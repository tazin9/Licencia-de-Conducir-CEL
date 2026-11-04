# 🩺 Sistema Integral del Médico Examinador – CEL Avellaneda (Provincia de Buenos Aires)

Plataforma web clínica, pericial y normativa desarrollada para el ejercicio de la función de **Médico Examinador** en los **Centros Emisores de Licencias de Conducir (CEL)** de la Provincia de Buenos Aires (Municipalidad de Avellaneda – Distrito II / Región Sanitaria VI), bajo el marco del **Sistema Nacional de Licencias de Conducir (Si.Na.Li.C.)** y la **Agencia Nacional de Seguridad Vial (ANSV)**.

---

## 🌐 Acceso Directo Online (GitHub Pages)

Una vez publicado en GitHub Pages, podés acceder desde cualquier computadora del consultorio o desde el celular mediante los siguientes enlaces directos:

| Módulo del Sistema | Enlace Directo Web (GitHub Pages) | Uso Principal |
| :--- | :--- | :--- |
| 🏛️ **Portal Principal (Hub)** | **[https://tazin9.github.io/Licencia-de-Conducir-CEL/](https://tazin9.github.io/Licencia-de-Conducir-CEL/)** | Pantalla de inicio con acceso rápido a todos los módulos y normas clave. |
| 🩺 **App Web de Consultorio Diario** | **[https://tazin9.github.io/Licencia-de-Conducir-CEL/app-consultorio/](https://tazin9.github.io/Licencia-de-Conducir-CEL/app-consultorio/)** | Evaluación de postulantes en 5 minutos, motor de decisión dual (Grupo 1 / Grupo 2), generador de evolución para Si.Na.Li.C., buscador en 2 segundos e impresión A4 de interconsultas y Test del Reloj. |
| 📘 **Ebook de Onboarding Médico** | **[https://tazin9.github.io/Licencia-de-Conducir-CEL/ebook-onboarding-medico/](https://tazin9.github.io/Licencia-de-Conducir-CEL/ebook-onboarding-medico/)** | Plan de estudio guiado en 7 días, protocolo semiológico, resolución de los 8 casos críticos, blindaje médico-legal y Vademécum de bolsillo imprimible. |

> 💡 **Tip para el Consultorio:** Si al entrar al enlace raíz ves la versión anterior por unos minutos, presioná **`Ctrl + F5`** (en PC) o recargá la página en el celular para limpiar la caché del navegador.

---

## ⚙️ Funcionalidades Principales

### 1. Estación Web de Consultorio Diario (`./app-consultorio/`)
1. **⚡ Evaluador Pericial & Motor de Decisión Dual (Grupo 1 + Grupo 2):**
   - Evalúa simultáneamente categorías particulares (**Grupo 1: Clases A, B, G y Clase F**) y categorías profesionales (**Grupo 2: Clases C, D y E**) según la **Disposición ANSV Nº 219/2025** y la **Disposición ANSV Nº 300/2025**.
   - Detecta automáticamente dictámenes desdoblados (por ejemplo, postulante con visión monocular que solicita `B1 + D1` &rarr; *Apto con Restricción* para `B1` y *No Apto* para `D1`).
   - Calcula topes de vigencia por edad conforme al **Decreto PEN Nº 196/2025** y **Ley Nº 24.449** ($\le 65$ años, $> 65$ años y renovación anual obligatoria desde los $70$ años).
2. **📋 Generador Automático de Evolución Médico-Pericial (1-Click Copy):**
   - Redacta en tiempo real el texto médico-legal completo con agudeza visual, audición, tensión arterial en box, restricciones, datos del certificado de especialista o fundamentos de retención/inhabilitación, listo para copiar y pegar en el **Si.Na.Li.C.** o transcribir al **Formulario Único de Trámite (FUT)**.
3. **🖨️ Impresión Limpia A4 de Formularios Oficiales:**
   - **Solicitud de Informe Médico Especializado (Ap. 10.5 Disp. 219/2025):** Con los requisitos objetivos obligatorios según especialidad (*Cardiología, Oftalmología, Neurología, Endocrinología/Diabetología, Neumonología/Sueño, ORL/Audiología, Psiquiatría*).
   - **Hoja Oficial para Prueba del Reloj a la Orden (11:10):** Lista para imprimir, hacer dibujar al adulto mayor ($\ge 70$ años), puntuar con la escala de Cacho/Sundström (0 a 10 puntos), firmar y abrochar al FUT.
4. **🔍 Buscador Instantáneo de Baremos y Fármacos ("Consulta en 2 Segundos"):**
   - Consulta inmediata de puntos de corte entre Grupo 1 y Grupo 2 para visión monocular, insulina, epilepsia, marcapasos, CDI, hipoacusia, psicofármacos, apnea del sueño, discapacidad motora (Clase F) y responsabilidad penal (Art. 293 CP).
5. **👁️ Optotipo Digital y Calculadoras Clínicas (STOP-BANG y Test del Reloj):**
   - Permite calcular el puntaje en vivo y aplicarlo con un clic a la evaluación actual.
6. **🔒 Contador de Productividad del Turno (100% Local – Ley Nº 25.326):**
   - Registra la cantidad de postulantes atendidos en el turno (*Aptos, Con Restricción/Vigencia Reducida, Retenidos, No Aptos*) únicamente en el navegador local del médico, sin enviar datos personales ni sensibles a servidores externos.

---

### 2. Ebook de Inducción y Práctica Diaria (`./ebook-onboarding-medico/`)
- **Plan de Estudio en 7 Días** con casillas de verificación interactivas e indicación quirúrgica de qué artículos y apartados leer en cada norma.
- **Protocolo de los 5 Minutos** por postulante en el box médico.
- **Tablas Maestras de Subclases PBA (Disposición 20/2019)** y comparativas de Baremos ANSV.
- **Los 8 Casos Clínicos Críticos** del consultorio con guiones diplomáticos de comunicación.
- **Vademécum Rápido de Bolsillo** en 1 página A4 imprimible para dejar sobre el escritorio.

---

## 📂 Estructura del Repositorio y Base de Datos Legal

```text
licencia-conducir/
├── index.html                                  # Portal Principal (Hub)
├── README.md                                   # Documentación y enlaces de acceso
├── INDICE_BASE_DE_DATOS.md                     # Catálogo detallado de todas las normas descargadas
├── app-consultorio/                            # Aplicación Web de Consultorio Diario (Etapa 2)
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   └── manifest.json
├── ebook-onboarding-medico/                    # Ebook Interactivo de Inducción (Etapa 1)
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   └── manifest.json
├── Normativa y Manuales de la Agencia Nacional de Seguridad Vial (ANSV)/
│   ├── Disposicion_ANSV_219_2025_Manual_y_Baremos_Psicofisicos_norma.htm
│   ├── Disposicion_ANSV_300_2025_Baremo_Capacidad_Auditiva_norma.htm
│   ├── Disposicion_ANSV_54_2025_Reforma_SiNaLiC_norma.htm
│   ├── Disposicion_ANSV_207_2009_SiNaLiC.html (+ AnexoI.pdf y AnexoII.pdf)
│   └── Manual_Examen_Medico_Psicofisico_ANSV_Art14.pdf
├── Marco Legal Nacional/
│   ├── Ley_24449_Transito_Texto_Actualizado.html
│   ├── Decreto_779_1995_Reglamentario_Ley_24449_texactdto779-1995-anexo1.htm
│   ├── Decreto_196_2025_Modificacion_Reglamentacion_Transito_texact.htm
│   ├── Ley_17132_Ejercicio_de_la_Medicina_Texto_Actualizado.html
│   ├── Ley_26529_Derechos_del_Paciente_e_Historia_Clinica_Texto_Actualizado.html
│   ├── Ley_25326_Proteccion_Datos_Personales_Datos_Sensibles_Salud.html
│   ├── Codigo_Penal_Ley_11179_Texto_Actualizado.html
│   └── Codigo_Civil_y_Comercial_Ley_26994_Texto_Actualizado.html
└── Marco Legal de la Provincia de Buenos Aires/
    ├── Ley_Provincial_13927_Codigo_Transito_PBA.html
    ├── Ley_Provincial_15402_Alcohol_Cero_al_Volante_PBA.html
    ├── Decreto_Provincial_532_2009_Reglamentario_Ley_13927.html
    ├── Disposicion_20_2019_Anexo_Clases_y_Subclases_Licencias_PBA.pdf
    ├── Normativa_Vial_Provincia_Buenos_Aires_Resumen_manual_tramitacion.pdf
    ├── Decreto_Ley_5413_1958_Ejercicio_Medicina_y_Colegio_Medicos_PBA.html
    └── Codigo_de_Etica_Colegio_de_Medicos_PBA_Res_CS_950.pdf
```

Para consultar el detalle normativo completo de cada archivo local y su fuente oficial en InfoLeg / Normas GBA, ver [INDICE_BASE_DE_DATOS.md](./INDICE_BASE_DE_DATOS.md).
