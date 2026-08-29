const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');

const colors = [
  { primary: '#8F0D0D', secondary: '#5B0606', gold1: '#F59E0B', gold2: '#FEF08A', goldDark: '#B45309', label: 'OPCIÓN 1' },
  { primary: '#1E3A8A', secondary: '#172554', gold1: '#38BDF8', gold2: '#E0F2FE', goldDark: '#0284C7', label: 'OPCIÓN 2' },
  { primary: '#065F46', secondary: '#022C22', gold1: '#34D399', gold2: '#D1FAE5', goldDark: '#059669', label: 'OPCIÓN 3' },
  { primary: '#78350F', secondary: '#451A03', gold1: '#FBBF24', gold2: '#FEF3C7', goldDark: '#D97706', label: 'OPCIÓN 4' },
  { primary: '#581C87', secondary: '#3B0764', gold1: '#C084FC', gold2: '#F3E8FF', goldDark: '#9333EA', label: 'OPCIÓN 5' },
  { primary: '#1F2937', secondary: '#111827', gold1: '#F59E0B', gold2: '#FEF08A', goldDark: '#D97706', label: 'OPCIÓN 6' },
];

function generateSvg(number, scheme) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <!-- Background Shield Gradient -->
    <linearGradient id="shieldGrad${number}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${scheme.primary}" />
      <stop offset="100%" stop-color="${scheme.secondary}" />
    </linearGradient>

    <!-- Gold Metallic Trim Gradient -->
    <linearGradient id="goldGrad${number}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${scheme.gold2}" />
      <stop offset="50%" stop-color="${scheme.gold1}" />
      <stop offset="100%" stop-color="${scheme.goldDark}" />
    </linearGradient>

    <!-- Inner Glow / Shadow -->
    <radialGradient id="innerGlow${number}" cx="50%" cy="35%" r="60%">
      <stop offset="0%" stop-color="white" stop-opacity="0.25" />
      <stop offset="100%" stop-color="black" stop-opacity="0.6" />
    </radialGradient>

    <!-- Shadow filter -->
    <filter id="dropShadow${number}" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="12" stdDeviation="10" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Outer Shadow Shield -->
  <g filter="url(#dropShadow${number})">
    <!-- Outer Gold Border -->
    <path d="M 256,24 C 360,24 440,64 440,64 C 440,240 370,410 256,488 C 142,410 72,240 72,64 C 72,64 152,24 256,24 Z" 
          fill="url(#goldGrad${number})" stroke="#78350F" stroke-width="4" />

    <!-- Inner Shield Body -->
    <path d="M 256,40 C 348,40 422,76 422,76 C 422,230 358,390 256,464 C 154,390 90,230 90,76 C 90,76 164,40 256,40 Z" 
          fill="url(#shieldGrad${number})" stroke="url(#goldGrad${number})" stroke-width="6" />

    <!-- Gloss Highlight Overlay -->
    <path d="M 256,40 C 348,40 422,76 422,76 C 422,230 358,390 256,464 C 154,390 90,230 90,76 C 90,76 164,40 256,40 Z" 
          fill="url(#innerGlow${number})" />
  </g>

  <!-- Top Maltese Cross / Stars Accent -->
  <g transform="translate(256, 85)" fill="url(#goldGrad${number})">
    <path d="M -8,-25 L 8,-25 L 5,-10 L 18,-18 L 25,-8 L 10,-5 L 18,8 L 8,5 L 5,18 L -5,18 L -8,5 L -18,8 L -25,-8 L -10,-5 L -18,-18 L -5,-10 Z" transform="scale(1.2)" />
    <circle cx="0" cy="-6" r="5" fill="#FFFFFF" />
  </g>

  <!-- Central Firefighter Badge Circle -->
  <circle cx="256" cy="245" r="125" fill="#111827" fill-opacity="0.75" stroke="url(#goldGrad${number})" stroke-width="6" />
  <circle cx="256" cy="245" r="115" fill="none" stroke="${scheme.goldDark}" stroke-width="2" stroke-dasharray="6,4" />

  <!-- Prominent Number -->
  <text x="256" y="305" 
        font-family="'Impact', 'Arial Black', 'Helvetica Neue', sans-serif" 
        font-size="160" 
        font-weight="900" 
        text-anchor="middle" 
        fill="url(#goldGrad${number})" 
        stroke="#451A03" 
        stroke-width="5"
        style="filter: drop-shadow(0px 8px 12px rgba(0,0,0,0.8));">
    ${number}
  </text>

  <!-- Bottom Banner / Ribbon -->
  <g transform="translate(0, 390)">
    <!-- Ribbon Shadow & Backing -->
    <path d="M 100,20 L 140,55 L 100,90 L 150,90 L 160,20 Z" fill="#451A03" />
    <path d="M 412,20 L 372,55 L 412,90 L 362,90 L 352,20 Z" fill="#451A03" />

    <!-- Ribbon Main Body -->
    <path d="M 130,20 L 382,20 C 395,20 405,30 405,45 L 395,75 C 395,85 385,90 370,90 L 142,90 C 127,90 117,85 117,75 L 107,45 C 107,30 117,20 130,20 Z" 
          fill="url(#goldGrad${number})" stroke="#78350F" stroke-width="3" filter="url(#dropShadow${number})" />

    <!-- Ribbon Inner Line -->
    <path d="M 138,28 L 374,28 C 382,28 388,34 388,42 L 380,68 C 380,74 374,78 366,78 L 146,78 C 138,78 132,74 132,68 L 124,42 C 124,34 130,28 138,28 Z" 
          fill="#111827" stroke="${scheme.gold1}" stroke-width="2" />

    <!-- Ribbon Text -->
    <text x="256" y="60" 
          font-family="'Arial Black', 'Impact', sans-serif" 
          font-size="24" 
          font-weight="900" 
          letter-spacing="4" 
          text-anchor="middle" 
          fill="url(#goldGrad${number})">
      ${scheme.label}
    </text>
  </g>
</svg>`;
}

for (let i = 1; i <= 6; i++) {
  const svgContent = generateSvg(i, colors[i - 1]);
  const svgPath = path.join(publicDir, `logo_${i}.svg`);
  fs.writeFileSync(svgPath, svgContent, 'utf8');
  console.log(`Generated ${svgPath}`);
}
