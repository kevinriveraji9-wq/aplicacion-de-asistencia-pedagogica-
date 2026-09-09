# Diseño técnico — Asistente pedagógico de kínder

Complementa `prd.md`. Fija stack, arquitectura de ventanas y formato de contenido.

## Decisión: dos pantallas

Confirmada con el usuario el 2026-09-09, y es la decisión que manda sobre la
arquitectura.

El problema que resuelve: **todo lo que la app muestra se proyecta al video beam.**
El panel de Registro lleva nombre y apellido de qué niño «necesita apoyo». Proyectado
en la pared lo ven los 25 compañeros y cualquier adulto que entre al salón.

La app corre en **dos ventanas sobre dos pantallas físicas**:

| Ventana | Pantalla | Qué muestra |
|---|---|---|
| **Docente** | el monitor del PC del salón | Todo: navegación, Guía, Registro, y el control de lo que se proyecta |
| **Proyección** | el video beam / TV | Solo láminas y actividades. Nunca Guía ni Registro. |

Es una separación **estructural, no una opción de configuración**: la ventana de
Proyección no tiene código capaz de renderizar la Guía ni el Registro. No se puede
filtrar información sensible por un bug de estado, porque el renderizador no existe
de ese lado.

### Con una sola pantalla

Degradación explícita, nunca silenciosa: si `screen.getAllDisplays()` devuelve una
sola pantalla, no se abre la ventana de Proyección. El botón «Proyectar» pone la
ventana Docente en pantalla completa mostrando solo la lámina, y al entrar a Registro
la app avisa que esa información es visible para el salón.

## Stack

**Electron + JavaScript, HTML y CSS planos. Sin framework y sin paso de compilación.**

- **Electron** porque dos ventanas sobre dos pantallas físicas es un problema resuelto
  (`screen.getAllDisplays()`, una `BrowserWindow` por pantalla), porque empaqueta a un
  `.exe` de Windows que se instala y se abre con doble clic, y porque funciona sin
  internet.
- **Sin framework** porque la app son 7 pantallas que renderizan JSON. React o Vue
  meterían un build, un `node_modules` gordo y una capa de abstracción para poco.
- **Sin paso de compilación** porque quien mantenga esto debe poder abrir la carpeta,
  leer un archivo y entender qué hace. Sin bundler, sin transpilador, sin sourcemaps.
- Los mockups ya son HTML y CSS: pasan a código casi directo.

Descartados: Tauri (exige toolchain de Rust, fricción alta en Windows para lo que
ganamos), .NET/WPF (multi-monitor excelente, pero rehacer esta interfaz en XAML es
mucho más lento y el contenido-como-dato encaja peor).

## Estructura de carpetas

```
package.json
src/
  main/
    main.js         proceso principal: ventanas, detección de pantallas
    preload.js      puente contextBridge (la única superficie expuesta al render)
  docente/          ventana del profesor
    index.html
    app.js          router y estado
    pantallas/      grado, materia, tema, sala (4 paneles)
  proyeccion/       ventana del video beam
    index.html
    proyeccion.js
  comun/
    tokens.css      los tokens de diseño de los mockups
    catalogo.js     lee contenido/ y arma el menú
    laminas.js      dibuja las láminas (compartido por ambas ventanas)
    actividades/    un archivo por tipo de actividad
contenido/          los temas, como dato
datos/              registro de observación, JSON local
```

`contenido/` y `datos/` viven **fuera de `src/`** a propósito: son datos, no programa.
Agregar un tema es copiar una carpeta, no tocar código.

## Comunicación entre ventanas

Unidireccional, del Docente a la Proyección. La Proyección nunca contesta ni guarda
estado propio: es una pantalla tonta.

```
Docente  --(preload)-->  main  --(webContents.send)-->  Proyección
         canal "proyectar"      { tipo, datos }
```

`tipo` es `"lamina"`, `"actividad"` o `"limpiar"`. La ventana de Proyección solo sabe
dibujar esos tres casos.

`contextIsolation: true`, `nodeIntegration: false`. El render nunca toca `fs`
directamente: todo pasa por el preload con una superficie mínima.

## Formato de un tema

Un tema es una carpeta con un `tema.json`. Este es el contrato central del proyecto
— si queda bien, agregar contenido nunca necesita programador.

```json
{
  "id": "contar-objetos-hasta-10",
  "titulo": "Contar objetos hasta 10",
  "orden": 3,
  "duracionMin": 25,
  "dimension": "cognitiva",
  "guia": {
    "objetivo": "...",
    "queDecir": ["...", "..."],
    "preguntas": ["...", "..."],
    "erroresComunes": ["...", "..."],
    "materiales": ["...", "..."]
  },
  "laminas": [
    { "tipo": "numero", "numero": 7, "palabra": "siete", "objeto": "manzana" },
    { "tipo": "imagen", "archivo": "laminas/granja.png", "pie": "..." }
  ],
  "actividades": [
    {
      "tipo": "contar-elegir",
      "pregunta": "¿Cuántos globos hay?",
      "objeto": "globo",
      "cantidad": 6,
      "opciones": [5, 6, 7],
      "respuesta": 6
    }
  ]
}
```

El grado y la materia **no** van dentro del JSON: se derivan de la ruta
(`contenido/kinder-2/matematicas/<tema>/`). Un solo lugar donde puede estar mal.

### Láminas sin archivos de imagen

`"tipo": "numero"` se dibuja con SVG generado en código, no con un PNG. Así la app
arranca con contenido real sin depender de que alguien produzca imágenes — que es el
riesgo grande del proyecto según `prd.md`. `"tipo": "imagen"` queda listo para cuando
haya láminas de verdad.

## Tipos de actividad

Siete tipos genéricos; el `tema.json` declara cuál usar. Cada uno es un archivo en
`src/comun/actividades/` que exporta `dibujar(contenedor, config, alResponder)`.

`contar-elegir` · `emparejar` · `seleccionar` · `ordenar` · `clasificar` ·
`buscar-en-escena` · `colorear`

Reglas que todos cumplen (de `prd.md` R2): objetivos de 100px o más, arrastre
perdonador, sin castigo por error, un solo clic, sin tiempo límite.

## Dónde viven los datos

Dos carpetas, y la distinción importa:

| | Ruta | Qué guarda | Escribible |
|---|---|---|---|
| **App** | `contenido/`, `datos/` junto al programa | Temas, y los valores por defecto de grupos y observaciones | No, al empaquetar queda en Archivos de programa |
| **Usuario** | `app.getPath('userData')` → `%APPDATA%\aula-kinder\` | El registro y las anotaciones | Sí |

Se lee primero de Usuario y se cae a App; escribir va siempre a Usuario. Así la app
arranca con contenido de ejemplo y lo que el colegio produce sobrevive a reinstalar
y a actualizar.

Guardar es atómico: se escribe un `.tmp` y se renombra encima. Si se corta la luz en
mitad de la clase, el registro anterior queda entero en vez de truncado.

## Registro y anotaciones

`registro.json` tiene dos mitades por grupo:

```json
{
  "k2-a": {
    "temas": {
      "kinder-2/matematicas/03-contar-objetos-hasta-10": {
        "fecha": "2026-09-09",
        "estados": { "e01": "logrado", "e02": "necesita-apoyo" }
      }
    },
    "alumnos": {
      "e01": {
        "notas": [
          { "id": "repetir-1757…", "fecha": "2026-09-09",
            "observacion": "repetir", "texto": "Necesita que le repitan la instrucción",
            "tema": "kinder-2/matematicas/03-contar-objetos-hasta-10" }
        ]
      }
    }
  }
}
```

`temas` es lo que se marca durante la clase; `alumnos` es lo que se acumula sobre cada
niño a lo largo del año. La **ficha del niño** (`panel-ficha.js`) junta las dos: se abre
pulsando su nombre en el Registro y muestra su historial completo más sus anotaciones.

Las anotaciones **se pulsan, no se escriben** (PRD R1: en clase no hay teclado). Las
frases disponibles salen de `datos/observaciones.json`, para que cada colegio use las
suyas sin tocar código.

Los archivos con el formato viejo —las rutas de tema colgando directas del grupo— se
convierten al leerlos; el primer guardado los deja al día.

## Orden de construcción

1. Esqueleto Electron con las dos ventanas y la detección de pantallas
2. Catálogo: leer `contenido/` y armar grado → materia → tema
3. Pantallas de navegación
4. Sala de clase: los 4 paneles
5. Proyección: láminas
6. Un tipo de actividad de punta a punta (`contar-elegir`)
7. Registro con persistencia
8. Los otros seis tipos de actividad
9. Empaquetado a `.exe`
