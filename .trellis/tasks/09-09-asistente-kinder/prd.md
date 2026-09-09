# Asistente pedagógico para docentes de kínder

> Estado: **fase de planeación**. Sin código todavía. Este documento fija el alcance
> y las decisiones tomadas; el diseño técnico va en `design.md`.

## Problema

El profesor de kínder llega a dar un tema (las vocales, los números del 1 al 5, los
animales) y tiene que improvisar el material: buscar imágenes, recordar qué preguntas
hacer, inventar una actividad, y después acordarse de quién entendió y quién no.
Pierde tiempo antes y durante la clase, y la calidad de la clase depende de cuánto
alcanzó a preparar la noche anterior.

## Qué construimos

Una aplicación de escritorio que funciona como **tablero de apoyo del profesor**.
El profesor elige grado → materia → tema, y la app le entrega en pantalla todo lo
necesario para dar esa clase. Tres clics desde el inicio hasta estar dando clase.

**No es** un juego para que el niño use solo en su casa. Es la herramienta del
profesor durante la clase, proyectada al video beam o TV del salón.

## Usuarios

| Usuario | Cómo interactúa |
|---|---|
| **Profesor de kínder** | Usuario principal. Maneja la app durante toda la clase. |
| **Niños de 3 a 6 años** | Pasan al frente y clickean en la pantalla proyectada durante las actividades. |

## Decisiones tomadas

Confirmadas con el usuario el 2026-09-09:

1. **Plataforma**: aplicación de escritorio para Windows. Se instala en el PC del salón
   y se abre con doble clic. Debe funcionar **sin internet**.
2. **Solo mouse**: no se usa teclado en ningún momento durante la clase.
3. **Quién clickea**: el profesor y también los niños que pasan al frente.
4. **Currículo de referencia**: Colombia (MEN, educación inicial y preescolar).

## Restricciones de diseño

### R1 — Cero teclado

Consecuencia directa: **nada de lo que el niño toca, ni nada que ocurra en el flujo de
la clase, puede tener un campo de texto.** Todo es selección: tarjetas y botones.

Alcance preciso, ajustado el 2026-09-09: la regla protege la clase, no prohíbe el
teclado en la máquina del profesor. Las pantallas que son **solo del profesor y nunca
se proyectan** —la ficha del niño, y en su momento Configuración— sí pueden tener un
campo de escribir, porque ahí no hay 25 niños esperando ni un video beam mirando.

Por eso las anotaciones tienen dos caminos: **pulsar** una frase frecuente (rápido, sirve
en mitad de la clase) o **escribir** (para lo que no cabe en una frase hecha). El primero
es el que se usa con el grupo delante; el segundo, después.

Sigue abierto cómo cargar los nombres de los estudiantes sin teclado. Ver preguntas
abiertas.

### R2 — Los niños de 3 a 6 años también clickean

Esto es más exigente que "solo el profesor" y condiciona todas las actividades:

- Objetivos de clic grandes. Nunca menos de 64px, preferiblemente más de 100px en
  las zonas donde hace clic un niño.
- **No se arrastra: se toca y se toca.** Decidido al construir la actividad de
  clasificar (2026-09-09). La idea original era «arrastre perdonador», pero
  arrastrar exige mantener el botón pulsado mientras se mueve el mouse, y eso es
  justo lo que una mano de cuatro años no logra sostener. En su lugar: un clic
  levanta la ficha, otro clic la suelta en la canasta. Dos clics sueltos, sin
  precisión de destino, y encaja mejor con la regla de «un solo clic, nunca doble».
- **Sin castigo por error**: el error no bloquea, no hace ruido feo, no muestra una X
  roja. Se reintenta. Esto es kínder, no un examen.
- **Sin doble clic ni clic derecho.** Un solo clic para todo.
- **Sin tiempo límite** por defecto.
- Retroalimentación inmediata y visible desde 3 metros de distancia.

### R2b — Los niños no leen

Es la restricción más olvidada del proyecto y la que más cambia el diseño. Un niño de
Kínder 1 o 2 no lee nada; uno de Kínder 3 apenas empieza. Todo lo que la app comunique
al niño **por escrito no llega**. Cuatro respuestas, en orden de importancia:

1. **Voz.** La pregunta y la instrucción se dicen en voz alta al abrir la actividad, y
   hay un botón de altavoz para repetirlas las veces que haga falta. Se usa la voz que
   ya trae Windows (`speechSynthesis` sobre SAPI), así que funciona sin internet y sin
   grabar nada. Verificado en el equipo de desarrollo: Microsoft Helena, es-ES.
   El formato del tema deja lugar a `"audio": "audio/x.mp3"` para cuando haya
   grabaciones de verdad, que siempre serán mejores que la voz sintética.
2. **Caras en vez de palabras.** Acertar y equivocarse se comunican con una cara, no
   con un texto. La cara de error es ámbar y con gesto suave: dice «casi», no «mal».
3. **Objetos dibujados en vez de texto.** Las opciones de una actividad pueden ser
   imágenes en lugar de palabras (`{ "objeto": "pez" }` en vez de `{ "texto": "pez" }`).
4. **El profesor.** El panel de Guía le dice qué decir. Es el respaldo de todo lo
   anterior y la razón por la que esta app acompaña al profesor en vez de reemplazarlo.

Lo que **no** se resuelve así: las actividades cuyo objetivo *es* leer (reconocer la
letra A). Ahí el texto es el contenido, no el envoltorio, y debe seguir siendo visible.

### R3 — Legibilidad a distancia

La pantalla se proyecta. Todo el contenido para los niños debe leerse a 3 metros:
tipografía grande, alto contraste, poco texto por pantalla.

### R4 — El profesor nunca se pierde

"Atrás" e "Inicio" siempre visibles en el mismo lugar. El profesor está de pie frente
a 25 niños; no puede ponerse a buscar cómo salir de una pantalla.

## Estructura de navegación

```
Inicio
└── Grado         Kinder 1 · Kinder 2 · Kinder 3
    └── Materia   Lenguaje · Matemáticas · Exploración del medio · ...
        └── Tema  "Los números del 1 al 5" · "Las vocales" · ...
            └── SALA DE CLASE
```

## La Sala de Clase

Es la pantalla que importa. Cuatro paneles por tema:

| Panel | Para quién | Contenido |
|---|---|---|
| **Proyectar** | los niños | Láminas grandes a pantalla completa. Se pasan con clic. |
| **Actividad** | niños + profe | 1 a 3 mini-actividades interactivas |
| **Guía** | solo el profe | Objetivo, qué decir, preguntas para hacer, errores comunes, duración estimada, materiales físicos que necesita |
| **Registro** | solo el profe | Lista del grupo. Un clic por niño: logrado / en proceso / necesita apoyo |

El panel **Guía** es lo que convierte esto en "ayuda al profesor" y no en otro banco
de imágenes. Es la diferencia central del producto.

## Materias vs. dimensiones (decisión de currículo)

Tensión a resolver: el MEN organiza la educación inicial por **dimensiones del
desarrollo** y actividades rectoras, no por "materias". Pero el profesor en el día a día
planea por materias, y así lo pidió el usuario.

**Decisión**: la interfaz muestra **materias** (el lenguaje del profesor), y cada tema
lleva internamente la etiqueta de su **dimensión** correspondiente. Así el profesor
navega como piensa, y si el colegio pide alineación oficial, el dato ya está.

Nota sobre nombres de grados: en Colombia los grados oficiales de preescolar son
Prejardín, Jardín y Transición. "Kinder 1/2/3" es el nombre que usan varios colegios
privados. La app usa "Kinder 1/2/3" en pantalla, pero el mapeo a los grados oficiales
debe quedar registrado.

### Propuesta de materias por grado

**Kinder 1 (3-4 años)** — sensorial y exploratorio
Lenguaje y comunicación · Pensamiento matemático · Exploración del medio · Arte y música · Motricidad

**Kinder 2 (4-5 años)**
Lenguaje (vocales, sonido inicial) · Matemáticas (1-10, series, clasificar) · Exploración del medio (plantas, clima, hábitats) · Convivencia y emociones · Arte y música

**Kinder 3 (5-6 años)** — preparación para primero
Lenguaje (consonantes, sílabas, escribir su nombre) · Matemáticas (1-20, sumas simples, patrones) · Ciencias (ciclo del agua, seres vivos) · Sociales (oficios, mi país) · Arte y música

> Esta lista es una propuesta razonable pero **debe validarse contra el plan de estudios
> real de un colegio** antes de construir contenido a escala. No dar por definitiva.

## Decisión de arquitectura central: el contenido es dato, no código

Cada tema es una carpeta con su archivo de definición más sus recursos:

```
contenido/kinder-2/matematicas/numeros-1-10/
   tema.json      objetivo, guía docente, qué actividades usa y con qué datos
   laminas/       imágenes para proyectar
   audio/         canción, instrucciones habladas
```

Y en vez de programar cada actividad una por una, se programan **tipos genéricos de
actividad** y el `tema.json` declara cuál usar:

1. Emparejar (unir dos columnas)
2. Seleccionar el correcto ("¿cuál es la vocal A?")
3. Contar y elegir el número
4. Ordenar / secuenciar (tamaños, pasos de un cuento)
5. Clasificar (arrastrar a canastas)
6. Buscar en la escena
7. Colorear por clic

Con esto, agregar un tema nuevo no requiere programar. Es la diferencia entre una app
con 12 temas y una que crece durante años.

## Módulos

- **Catálogo** — lee las carpetas de contenido y arma el menú de grados/materias/temas
- **Proyector** — muestra láminas a pantalla completa
- **Motor de actividades** — implementa los tipos genéricos
- **Panel docente** — guía, notas, duración
- **Registro** — observaciones por niño, guardado local
- **Configuración** — grupo, lista de estudiantes, tamaño de letra

## Criterios de aceptación (del producto, no de esta fase)

- [ ] El profesor llega de Inicio a la Sala de Clase en 3 clics
- [ ] Ninguna pantalla usada en clase tiene campo de texto
- [ ] Toda la app funciona sin conexión a internet
- [ ] Un niño de 4 años completa una actividad de arrastre sin ayuda del profesor
- [ ] Agregar un tema nuevo no requiere escribir código
- [ ] Todo el texto proyectado se lee a 3 metros
- [ ] El registro de observación de un grupo de 25 niños se completa en menos de 2 minutos

## Fuera de alcance

Cuentas y login · sincronización en la nube · uso del niño en casa sin profesor ·
reportes automáticos a padres · edición de contenido desde la app.

## Preguntas abiertas

1. **Nombres de estudiantes sin teclado.** ¿Se precarga una lista desde un archivo que
   alguien prepara una vez, o se pone un teclado en pantalla clickeable solo para la
   configuración inicial? Afecta el módulo de Configuración.
2. **Origen del contenido.** ¿Quién produce las láminas y las imágenes? Sin contenido
   real la app está vacía. Es el riesgo más grande del proyecto, más que lo técnico.
3. **Cuántos temas para la primera versión.** Propuesta: 1 materia completa de 1 grado,
   bien hecha, en vez de 15 materias a medias.
4. **Currículo real.** Conseguir el plan de estudios de un colegio concreto para validar
   la lista de materias y temas.
5. **Audio.** ¿Se necesita voz grabada para las instrucciones? Los niños de kínder no leen.
   Si sí, es un costo de producción que hay que planear desde ahora.
