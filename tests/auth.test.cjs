const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const { createHash } = require('node:crypto');

function load(path, mocks = {}) {
  const source = ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', source)(name => mocks[name] || require(name), module, module.exports);
  return module.exports;
}
const passwords = load('src/lib/passwords.ts');
const initialPassword = 'Temporary!456ABC';
const hash = passwords.hashServerPassword(initialPassword);
const baseUser = { id: 'usr-superadmin-01', email: 'admin@example.com', role: 'SUPER_ADMIN', status: 'ACTIVO',
  passwordHash: hash, mustChangePassword: true, failedLoginAttempts: 0 };
function setup(route) {
  let user = { ...baseUser };
  let failSave = false;
  let lastSave;
  const store = {
    serverGetUsers: async () => [{ ...user }],
    serverSaveUser: async (next, strict, previousHash) => {
      lastSave = { strict, previousHash };
      if (failSave) throw new Error('DB failure');
      user = { ...next };
    },
    serverRecordAuthAttempt: async next => { user = { ...user, failedLoginAttempts: next.failedLoginAttempts, lockedUntil: next.lockedUntil, lastLogin: next.lastLogin }; },
    serverSanitizeUser: ({ password, passwordHash, ...safe }) => safe,
  };
  const api = load(`src/app/api/auth/${route}/route.ts`, {
    '../../../../lib/serverStore': store,
    '../../../../lib/passwords': passwords,
    '../../../../lib/rateLimiter': { getClientIp: () => 'test', checkRateLimit: () => ({ allowed: true }) },
  });
  return { post: body => api.POST(new Request('http://localhost/api/auth', { method: 'POST',
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })),
    user: () => user, setUser: next => { user = next; }, fail: () => { failSave = true; }, lastSave: () => lastSave };
}

test('supports both legacy hashes and new salted scrypt; rejects hash as credential', () => {
  for (const value of [`salt_4tacia_calle_larga_${initialPassword}`, `${initialPassword}bomberos_calle_larga_4ta_sec_2026`]) {
    const legacy = createHash('sha256').update(value).digest('hex');
    assert.equal(passwords.verifyServerPassword(initialPassword, legacy), true);
    assert.equal(passwords.verifyServerPassword(legacy, legacy), false);
  }
  assert.equal(passwords.verifyServerPassword(initialPassword, hash), true);
  assert.equal(passwords.verifyServerPassword('wrong', hash), false);
  assert.notEqual(passwords.hashServerPassword(initialPassword), hash);
});
test('temporary login opens change flow without user or session token', async () => {
  const api = setup('login');
  const response = await api.post({ email: ' ADMIN@example.com ', password: initialPassword });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true, requiresPasswordChange: true });
});
test('wrong password and locked or suspended accounts cannot log in', async () => {
  const api = setup('login');
  assert.equal((await api.post({ email: baseUser.email, password: 'wrong' })).status, 401);
  assert.equal(api.user().failedLoginAttempts, 1);
  api.setUser({ ...baseUser, lockedUntil: new Date(Date.now() + 60000).toISOString() });
  assert.equal((await api.post({ email: baseUser.email, password: initialPassword })).status, 423);
  api.setUser({ ...baseUser, status: 'SUSPENDIDO' });
  assert.equal((await api.post({ email: baseUser.email, password: initialPassword })).status, 403);
});
test('change persists a new hash, clears plaintext and flag, and retires temporary key', async () => {
  const api = setup('change-password');
  const nextPassword = 'MyOwnPassword!789';
  const response = await api.post({ email: baseUser.email, currentPassword: initialPassword, newPassword: nextPassword });
  assert.equal(response.status, 200);
  assert.equal(api.user().mustChangePassword, false);
  assert.equal(api.user().password, undefined);
  assert.equal(passwords.verifyServerPassword(initialPassword, api.user().passwordHash), false);
  assert.equal(passwords.verifyServerPassword(nextPassword, api.user().passwordHash), true);
  assert.deepEqual(api.lastSave(), { strict: true, previousHash: hash });
  assert.equal((await api.post({ email: baseUser.email, currentPassword: initialPassword, newPassword: nextPassword })).status, 403);
});
test('weak or reused passwords and wrong current credentials are rejected', async () => {
  const api = setup('change-password');
  for (const newPassword of ['weak', initialPassword]) {
    assert.equal((await api.post({ email: baseUser.email, currentPassword: initialPassword, newPassword })).status, 400);
  }
  assert.equal((await api.post({ email: baseUser.email, currentPassword: 'wrong', newPassword: 'MyOwnPassword!789' })).status, 401);
  assert.equal(api.user().failedLoginAttempts, 1);
});
test('database failure does not report success or retire the temporary key', async () => {
  const api = setup('change-password'); api.fail();
  const response = await api.post({ email: baseUser.email, currentPassword: initialPassword, newPassword: 'MyOwnPassword!789' });
  assert.equal(response.status, 500);
  assert.equal(api.user().mustChangePassword, true);
  assert.equal(api.user().passwordHash, hash);
});
