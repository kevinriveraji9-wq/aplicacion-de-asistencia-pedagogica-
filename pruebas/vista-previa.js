'use strict';

// Genera pruebas/vista-previa.html: la ventana Docente completa, con el CSS y
// los guiones reales, pero con el puente `aula` simulado y datos de ejemplo
// incrustados.
//
// Existe porque la prueba de recorrido usa jsdom, que no calcula layout: pasó
// con 85 comprobaciones en verde mientras la ficha del niño se veía rota en
// pantalla (dos reglas CSS compartían el nombre `.ficha`). Esto se abre en un
// navegador de verdad y se mira.
//
//   node pruebas/vista-previa.js && start pruebas/vista-previa.html

const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.join(__dirname, '..');
const SALIDA = path.join(__dirname, 'vista-previa.html');

function leerJson(...partes) {
  return JSON.parse(fs.readFileSync(path.join(RAIZ, ...partes), 'utf8'));
}

function catalogo() {
  const meta = leerJson('contenido', 'catalogo.json');
  return meta.grados.map((grado) => {
    const materias = meta.materias
      .map((materia) => {
        const dir = path.join(RAIZ, 'contenido', grado.id, materia.id);
        if (!fs.existsSync(dir)) return null;
        const temas = fs
          .readdirSync(dir, { withFileTypes: true })
          .filter((e) => e.isDirectory())
          .map((e) => {
            const tema = leerJson('contenido', grado.id, materia.id, e.name, 'tema.json');
            return {
              ruta: `${grado.id}/${materia.id}/${e.name}`,
              id: tema.id,
              titulo: tema.titulo,
              orden: tema.orden || 0,
              duracionMin: tema.duracionMin || 0,
              dimension: tema.dimension || '',
            };
          })
          .sort((a, b) => a.orden - b.orden);
        return temas.length ? { ...materia, temas } : null;
      })
      .filter(Boolean);
    return { ...grado, materias };
  });
}

function temas() {
  const mapa = {};
  for (const grado of catalogo()) {
    for (const materia of grado.materias) {
      for (const tema of materia.temas) {
        const partes = tema.ruta.split('/');
        mapa[tema.ruta] = {
          ...leerJson('contenido', ...partes, 'tema.json'),
          ruta: tema.ruta,
          gradoId: partes[0],
          materiaId: partes[1],
          rutaBase: '.',
        };
      }
    }
  }
  return mapa;
}

// Registro de ejemplo con suficiente historia para que la ficha se vea llena.
function registro() {
  const alumnos = leerJson('datos', 'grupos.json').grupos[0].estudiantes;
  const estados = {};
  alumnos.forEach((a, i) => {
    estados[a.id] = ['logrado', 'en-proceso', 'necesita-apoyo'][i % 3];
  });

  return {
    'k2-a': {
      temas: {
        'kinder-2/matematicas/01-numeros-1-al-5': { fecha: '2026-09-02', estados },
        'kinder-2/matematicas/02-numeros-6-al-10': { fecha: '2026-09-05', estados },
        'kinder-2/lenguaje/01-las-vocales': { fecha: '2026-09-08', estados },
      },
      alumnos: {
        e01: {
          notas: [
            {
              id: 'repetir-1',
              fecha: '2026-09-05',
              observacion: 'repetir',
              texto: 'Necesita que le repitan la instrucción',
              tema: 'kinder-2/matematicas/02-numeros-6-al-10',
            },
            {
              id: 'escrita-1',
              fecha: '2026-09-08',
              manual: true,
              texto: 'Hoy contó hasta diez sin ayuda por primera vez. Contárselo a la mamá el viernes.',
              tema: 'kinder-2/lenguaje/01-las-vocales',
            },
          ],
        },
      },
    },
  };
}

const GUIONES = [
  '../src/comun/util.js',
  '../src/comun/iconos.js',
  '../src/comun/laminas.js',
  '../src/comun/caras.js',
  '../src/comun/voz.js',
  '../src/comun/actividades/contar-elegir.js',
  '../src/comun/actividades/seleccionar.js',
  '../src/comun/actividades/clasificar.js',
  '../src/docente/pantallas/piezas.js',
  '../src/docente/pantallas/grados.js',
  '../src/docente/pantallas/materias.js',
  '../src/docente/pantallas/temas.js',
  '../src/docente/pantallas/panel-guia.js',
  '../src/docente/pantallas/panel-proyectar.js',
  '../src/docente/pantallas/panel-actividad.js',
  '../src/docente/pantallas/panel-registro.js',
  '../src/docente/pantallas/panel-ficha.js',
  '../src/docente/pantallas/sala.js',
  '../src/docente/app.js',
];

const datos = {
  catalogo: catalogo(),
  temas: temas(),
  grupos: leerJson('datos', 'grupos.json'),
  observaciones: leerJson('datos', 'observaciones.json'),
  registro: registro(),
};

const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Aula — vista previa (datos de ejemplo)</title>
<link rel="stylesheet" href="../src/comun/tokens.css">
<link rel="stylesheet" href="../src/docente/estilos.css">
</head>
<body>
<div id="app"></div>
<div id="avisos" class="avisos"></div>

<script>
// Puente simulado: mismos métodos que el preload real, datos del disco.
const DATOS = ${JSON.stringify(datos)};
window.aula = {
  catalogo: async () => DATOS.catalogo,
  tema: async (ruta) => DATOS.temas[ruta],
  grupos: async () => DATOS.grupos,
  observaciones: async () => DATOS.observaciones,
  leerRegistro: async () => DATOS.registro,
  guardarRegistro: async () => true,
  dondeSeGuarda: async () => '(vista previa)',
  estadoPantallas: async () => ({ hayProyeccion: false }),
  alCambiarPantallas: () => {},
  proyectar: () => {},
  alProyectar: () => {},
};
</script>

${GUIONES.map((g) => `<script src="${g}"></script>`).join('\n')}
</body>
</html>
`;

fs.writeFileSync(SALIDA, html, 'utf8');
console.log(`vista previa escrita en ${path.relative(RAIZ, SALIDA)}`);
