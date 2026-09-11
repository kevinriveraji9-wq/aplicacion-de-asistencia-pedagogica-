'use strict';

const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');

const RAIZ = path.join(__dirname, '..', '..');
const CONTENIDO = path.join(RAIZ, 'contenido');
const PRELOAD = path.join(__dirname, 'preload.js');

// Dónde viven los datos, y por qué en dos sitios.
//
// DATOS_APP es la carpeta que viaja con el programa: trae los valores por
// defecto (el grupo de ejemplo, la lista de observaciones). Al empaquetar
// queda dentro de Archivos de programa, que es de SOLO LECTURA.
//
// DATOS_USUARIO es donde se escribe todo: %APPDATA%\aula-kinder. Sobrevive a
// reinstalar y a actualizar la app.
//
// Se lee primero de DATOS_USUARIO y se cae a DATOS_APP. Escribir siempre va a
// DATOS_USUARIO.
const DATOS_APP = path.join(RAIZ, 'datos');

function dirUsuario() {
  // app.getPath solo es fiable con la app lista, así que se resuelve tarde.
  return app.getPath('userData');
}

let ventanaDocente = null;
let ventanaProyeccion = null;

// ---------------------------------------------------------------- ventanas

// La ventana Docente va siempre en la pantalla principal (el monitor del PC).
// La de Proyección solo existe si hay una segunda pantalla: es el video beam.
// Esta separación es la que impide que la Guía y el Registro —que llevan
// nombre y apellido de los niños— terminen proyectados frente al salón.

function pantallaExterna() {
  const principal = screen.getPrimaryDisplay();
  return screen.getAllDisplays().find((p) => p.id !== principal.id) || null;
}

function crearVentanaDocente() {
  const { x, y, width, height } = screen.getPrimaryDisplay().workArea;

  ventanaDocente = new BrowserWindow({
    x,
    y,
    width: Math.min(1440, width),
    height: Math.min(900, height),
    minWidth: 1100,
    minHeight: 700,
    title: 'Aula — Docente',
    backgroundColor: '#F7F4EE',
    webPreferences: {
      preload: PRELOAD,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  ventanaDocente.loadFile(path.join(RAIZ, 'src', 'docente', 'index.html'));
  ventanaDocente.on('closed', () => {
    ventanaDocente = null;
  });
}

function crearVentanaProyeccion() {
  const externa = pantallaExterna();
  if (!externa || ventanaProyeccion) return;

  ventanaProyeccion = new BrowserWindow({
    x: externa.bounds.x,
    y: externa.bounds.y,
    width: externa.bounds.width,
    height: externa.bounds.height,
    fullscreen: true,
    frame: false,
    title: 'Aula — Proyección',
    backgroundColor: '#FFFDF9',
    webPreferences: {
      preload: PRELOAD,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  ventanaProyeccion.loadFile(path.join(RAIZ, 'src', 'proyeccion', 'index.html'));
  ventanaProyeccion.on('closed', () => {
    ventanaProyeccion = null;
    avisarPantallas();
  });
}

function cerrarVentanaProyeccion() {
  if (!ventanaProyeccion) return;
  ventanaProyeccion.destroy();
  ventanaProyeccion = null;
  avisarPantallas();
}

// El profesor puede conectar o desconectar el video beam en mitad de la clase.
function vigilarPantallas() {
  screen.on('display-added', () => {
    crearVentanaProyeccion();
    avisarPantallas();
  });
  screen.on('display-removed', () => {
    if (!pantallaExterna()) cerrarVentanaProyeccion();
    avisarPantallas();
  });
}

function avisarPantallas() {
  if (ventanaDocente && !ventanaDocente.isDestroyed()) {
    ventanaDocente.webContents.send('pantallas', estadoPantallas());
  }
}

function estadoPantallas() {
  return { hayProyeccion: Boolean(ventanaProyeccion) };
}

// --------------------------------------------------------------- contenido

// Grado y materia se derivan de la ruta de la carpeta, no del JSON del tema:
// un solo lugar donde pueden estar mal.

async function leerJson(ruta, siFalta = null) {
  try {
    return JSON.parse(await fs.readFile(ruta, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return siFalta;
    throw new Error(`No se pudo leer ${ruta}: ${error.message}`);
  }
}

async function subcarpetas(ruta) {
  try {
    const entradas = await fs.readdir(ruta, { withFileTypes: true });
    return entradas.filter((e) => e.isDirectory()).map((e) => e.name).sort();
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

async function leerTemas(gradoId, materiaId) {
  const dir = path.join(CONTENIDO, gradoId, materiaId);
  const temas = [];

  for (const carpeta of await subcarpetas(dir)) {
    const tema = await leerJson(path.join(dir, carpeta, 'tema.json'));
    if (!tema) continue;
    temas.push({
      carpeta,
      ruta: `${gradoId}/${materiaId}/${carpeta}`,
      id: tema.id || carpeta,
      titulo: tema.titulo || carpeta,
      orden: Number(tema.orden) || 0,
      duracionMin: Number(tema.duracionMin) || 0,
      dimension: tema.dimension || '',
    });
  }

  return temas.sort((a, b) => a.orden - b.orden);
}

async function leerCatalogo() {
  const meta = await leerJson(path.join(CONTENIDO, 'catalogo.json'));
  if (!meta) throw new Error('Falta contenido/catalogo.json');

  const grados = [];
  for (const grado of meta.grados) {
    const materias = [];
    for (const materia of meta.materias) {
      const temas = await leerTemas(grado.id, materia.id);
      if (temas.length) materias.push({ ...materia, temas });
    }
    grados.push({ ...grado, materias });
  }
  return grados;
}

async function leerTema(rutaRelativa) {
  // La ruta viene del render: la validamos contra el árbol de contenido antes
  // de tocar el disco.
  const partes = String(rutaRelativa).split('/');
  if (partes.length !== 3 || partes.some((p) => !p || p.includes('.'))) {
    throw new Error(`Ruta de tema inválida: ${rutaRelativa}`);
  }

  const dir = path.join(CONTENIDO, ...partes);
  const tema = await leerJson(path.join(dir, 'tema.json'));
  if (!tema) throw new Error(`No hay tema en ${rutaRelativa}`);

  const [gradoId, materiaId] = partes;
  return {
    ...tema,
    ruta: rutaRelativa,
    gradoId,
    materiaId,
    // Para las láminas que sí son archivos de imagen. encodeURI porque la
    // carpeta del proyecto puede tener espacios y acentos.
    rutaBase: encodeURI(`file:///${dir.replace(/\\/g, '/')}`),
  };
}

// ------------------------------------------------------------------- datos

async function leerDato(nombre, siFalta) {
  const propio = await leerJson(path.join(dirUsuario(), nombre), null);
  if (propio) return propio;
  return (await leerJson(path.join(DATOS_APP, nombre), siFalta)) || siFalta;
}

async function escribirDato(nombre, valor) {
  const dir = dirUsuario();
  await fs.mkdir(dir, { recursive: true });
  // Se escribe a un temporal y se renombra: si se va la luz a mitad de la
  // clase, el registro anterior sigue entero en vez de quedar truncado.
  const destino = path.join(dir, nombre);
  const temporal = `${destino}.tmp`;
  await fs.writeFile(temporal, JSON.stringify(valor, null, 2), 'utf8');
  await fs.rename(temporal, destino);
  return true;
}

// El registro nació con las rutas de tema colgando directas del grupo. Ahora
// el grupo tiene `temas` y `alumnos` (para las anotaciones). Los archivos
// viejos se convierten al leerlos; el primer guardado los deja al día.
function migrarRegistro(registro) {
  const salida = {};
  for (const [grupoId, valor] of Object.entries(registro || {})) {
    if (!valor || typeof valor !== 'object') continue;
    if (valor.temas || valor.alumnos) {
      salida[grupoId] = { temas: valor.temas || {}, alumnos: valor.alumnos || {} };
    } else {
      salida[grupoId] = { temas: valor, alumnos: {} };
    }
  }
  return salida;
}

async function leerRegistro() {
  return migrarRegistro(await leerDato('registro.json', {}));
}

// --------------------------------------------------------------------- ipc

function registrarIpc() {
  ipcMain.handle('catalogo', () => leerCatalogo());
  ipcMain.handle('tema', (_evento, ruta) => leerTema(ruta));
  ipcMain.handle('grupos', () => leerDato('grupos.json', { grupos: [] }));
  ipcMain.handle('observaciones', () => leerDato('observaciones.json', { observaciones: [] }));
  ipcMain.handle('registro:leer', () => leerRegistro());
  ipcMain.handle('registro:guardar', (_evento, registro) => escribirDato('registro.json', registro));
  ipcMain.handle('estado-pantallas', () => estadoPantallas());
  ipcMain.handle('donde-se-guarda', () => path.join(dirUsuario(), 'registro.json'));

  // Único canal hacia la proyección, y va en un solo sentido.
  ipcMain.on('proyectar', (_evento, mensaje) => {
    if (ventanaProyeccion && !ventanaProyeccion.isDestroyed()) {
      ventanaProyeccion.webContents.send('proyectar', mensaje);
    }
  });
}

// ------------------------------------------------------------------ arranque

app.whenReady().then(() => {
  registrarIpc();
  crearVentanaDocente();
  crearVentanaProyeccion();
  vigilarPantallas();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) crearVentanaDocente();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
