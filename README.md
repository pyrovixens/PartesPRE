# Sistema de Gestión de Partes de Emergencia y Asistencias
### 🚒 4ª Compañía de Bomberos "Calle Larga" – Cuerpo de Bomberos Los Andes
*"Unión, Lealtad y Servicio" • Fundada el 21 de Agosto de 1985*

---

## 📌 Descripción General

Plataforma integral y moderna diseñada específicamente para la administración, digitalización y análisis operativo de los servicios prestados por la **4ª Compañía de Bomberos Calle Larga**. 

El sistema reemplaza las planillas manuales y libros de novedades físicos, automatizando:
- La emisión y control de **Partes de Emergencia**.
- El registro de **Asistencias** y cálculo de porcentajes de constancia reglamentarios.
- La visualización de **Dashboards Analíticos** con gráficos idénticos a los requeridos por la Comandancia (10-0-1 al 10-16).
- La exportación oficial a **PDF** (con membrete institucional, tiempos radiales y firmas) y **Excel** (con base de datos completa y matriz de asistencia cruzada).

---

## ✨ Características Principales

### 1. 📝 Emisión Ágil de Partes
- **Cronometría Radial**: Cálculo instantáneo de tiempos de respuesta (Despacho ➔ 6-0) y duración de operaciones (6-7, 6-8, 6-10).
- **Catálogo Nacional de Claves Radiales**: Incluye todas las claves estándar (10-0-1 a 10-16) y Actividades Institucionales (Academias `A`, Entrenamiento Estándar `ES`, Reuniones de Compañía `RC`, Reuniones de Fundación `RF`, Citaciones Varias `V`).
- **Control de Material Mayor (Carros)**: Registro de unidades despachadas (`B-4`, `BX-4`, `R-4`, `K-4`), maquinistas, odómetro (km) y horómetro de bomba.
- **Nómina de Asistencia Inteligente**: Selector rápido de voluntarios con diferenciación entre personal que *tripuló carro* vs personal que *llegó por sus medios (6-0 en el lugar)* y asignación de rol táctico.

### 2. 📊 Dashboard Estadístico en Tiempo Real
- **Gráfico Oficial de Claves**: Gráfica de barras idéntica a la planilla de Comandancia con distribución por código (10-0-1 a 10-16).
- **Gráfico Combinado de Dotación**: Cantidad de llamados (barras) vs. promedio de bomberos asistentes (línea continua).
- **Indicadores Clave (KPIs)**: Total de actos, tiempo promedio de llegada (6-0), horas bomba acumuladas y kilómetros recorridos.
- **Ranking de Asistencia**: Top de voluntarios más activos y control de constancia para premios y distinciones.

### 3. 🖨️ Exportación Oficial en PDF
- **Parte de Emergencia Individual**: Formato formal listo para imprimir o enviar digitalmente, con el escudo oficial de la 4ª Compañía, desglose de carros, tabla de voluntarios asistentes y cuadro de firmas para el Oficial a Cargo (OBAC) y la Capitanía/Ayudantía.
- **Informe Ejecutivo Mensual**: Resumen mensual consolidado para entrega a la Comandancia.

### 4. 📑 Exportación Avanzada a Excel (.XLSX)
- **Hoja 1 - Partes de Emergencia**: Registro maestro detallado fila por fila con todos los campos y filtros.
- **Hoja 2 - Matriz de Asistencia**: Cuadrícula cruzada (Voluntarios vs. Fechas/Folios) con conteo de asistencias y porcentaje `%` automático.
- **Hoja 3 - Resumen por Claves**: Totales de emergencias por tipo y promedios de dotación.
- **Hoja 4 - Material Mayor**: Estadísticas de desgaste, km y horas de bomba por carro.

### 5. 👥 Gestión de Personal y Flota
- **Padrón de Voluntarios**: Altas, bajas, modificación de cargos (Director, Capitán, Tenientes, Maquinistas, etc.) y estados (Activo, Honorario, Licencia).
- **Flota de Carros**: Control de estado operativo, patentes y contadores de mantenimiento.
- **Copia de Seguridad (.JSON)**: Respaldo y restauración total de la base de datos con 1 solo clic.

---

## 🚀 Puesta en Marcha

### Requisitos
- Node.js (versión 18 o superior)
- Navegador web moderno (Chrome, Safari, Edge, Firefox)

### Comandos de Ejecución

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Iniciar en modo desarrollo**:
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3003](http://localhost:3003) en tu navegador.

3. **Compilar para producción**:
   ```bash
   npm run build
   npm run start
   ```

---

## 📱 Uso en Red Local / Cuartel
Para acceder desde tablets, celulares de oficiales o cualquier computadora conectada al Wi-Fi del cuartel:
```bash
npm run dev -- -H 0.0.0.0
```
Luego accede desde el dispositivo móvil ingresando la IP local del equipo (ej: `http://192.168.1.50:3003`).

---

**Desarrollado con dedicación para el Cuerpo de Bomberos de Los Andes - 4ª Compañía Calle Larga.**
# PartesPRE
