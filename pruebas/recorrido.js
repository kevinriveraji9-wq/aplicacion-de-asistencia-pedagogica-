'use strict';

// Prueba de humo del recorrido completo de la ventana Docente.
//
// Monta las pantallas reales en un DOM de mentira, con el puente `aula`
// simulado, y hace los clics que haría el profesor: elegir grado, materia y
// tema, pasar las láminas, resolver la actividad y marcar el registro.
//
// No reemplaza probar la app de verdad —eso necesita dos pantallas— pero sí
// atrapa lo que se rompe al tocar el código: una pantalla que revienta, un
// paso sin salida, o el registro guardando basura.
//
//   npm test

const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const RAIZ = path.join(__dirname, '..');

// --------------------------------------------------------------- utilidades

let fallos = 0;
let pasos = 0;

function ok(condicion, descripcion) {
  pasos += 1;
  if (condicion) {
    console.log(`  ok    ${descripcion}`);
  } else {
    fallos += 1;
    console.log(`  FALLA ${descripcion}`);
  }
}

function seccion(titulo) {
  console.log(`\n${titulo}`);
}

// -------------------------------------------------- contenido real del disco

function leerJson(...partes) {
  return JSON.parse(fs.readFileSync(path.join(RAIZ, ...partes), 'utf8'));
}

// Reproduce lo que hace el proceso principal al armar el catálogo, para que la
// prueba corra contra el contenido real y no contra un invento.
function catalogoDelDisco() {
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
            const tema = JSON.parse(fs.readFileSync(path.join(dir, e.name, 'tema.json'), 'utf8'));
            return {
              carpeta: e.name,
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

function temaDelDisco(ruta) {
  const partes = ruta.split('/');
  const tema = leerJson('contenido', ...partes, 'tema.json');
  return { ...tema, ruta, gradoId: partes[0], materiaId: partes[1], rutaBase: 'file:///falso' };
}

// ------------------------------------------------------------------ montaje

const GUIONES = [
  'src/comun/util.js',
  'src/comun/iconos.js',
  'src/comun/laminas.js',
  'src/comun/caras.js',
  'src/comun/voz.js',
  'src/comun/actividades/contar-elegir.js',
  'src/comun/actividades/seleccionar.js',
  'src/comun/actividades/clasificar.js',
  'src/docente/pantallas/piezas.js',
  'src/docente/pantallas/grados.js',
  'src/docente/pantallas/materias.js',
  'src/docente/pantallas/temas.js',
  'src/docente/pantallas/panel-guia.js',
  'src/docente/pantallas/panel-proyectar.js',
  'src/docente/pantallas/panel-actividad.js',
  'src/docente/pantallas/panel-registro.js',
  'src/docente/pantallas/panel-ficha.js',
  'src/docente/pantallas/sala.js',
  'src/docente/app.js',
];

function montar() {
  const dom = new JSDOM('<!doctype html><body><div id="app"></div><div id="avisos"></div></body>', {
    runScripts: 'dangerously',
  });
  const ventana = dom.window;

  const proyectado = [];
  let guardado = null;

  ventana.aula = {
    catalogo: async () => catalogoDelDisco(),
    tema: async (ruta) => temaDelDisco(ruta),
    grupos: async () => leerJson('datos', 'grupos.json'),
    observaciones: async () => leerJson('datos', 'observaciones.json'),
    dondeSeGuarda: async () => 'C:/falso/registro.json',
    leerRegistro: async () => ({}),
    guardarRegistro: async (registro) => {
      guardado = JSON.parse(JSON.stringify(registro));
      return true;
    },
    estadoPantallas: async () => ({ hayProyeccion: true }),
    alCambiarPantallas: () => {},
    proyectar: (mensaje) => proyectado.push(mensaje),
    alProyectar: () => {},
  };

  for (const guion of GUIONES) {
    ventana.eval(fs.readFileSync(path.join(RAIZ, guion), 'utf8'));
  }

  return { ventana, proyectado, verGuardado: () => guardado };
}

const esperar = () => new Promise((r) => setTimeout(r, 0));

function clic(ventana, selector, indice) {
  const nodos = ventana.document.querySelectorAll(selector);
  const nodo = nodos[indice || 0];
  if (!nodo) throw new Error(`No existe ${selector}${indice ? ` [${indice}]` : ''}`);
  nodo.dispatchEvent(new ventana.MouseEvent('click', { bubbles: true }));
  return nodo;
}

function hay(ventana, selector) {
  return Boolean(ventana.document.querySelector(selector));
}

function texto(ventana) {
  return ventana.document.getElementById('app').textContent.replace(/\s+/g, ' ');
}

// ------------------------------------------------------------------ recorrido

async function principal() {
  const { ventana, proyectado, verGuardado } = montar();
  await esperar();

  seccion('Inicio');
  ok(hay(ventana, '[data-grado]'), 'muestra los grados');
  const grados = ventana.document.querySelectorAll('[data-grado]').length;
  ok(grados === 3, `hay 3 grados (encontrados ${grados})`);

  seccion('Grado → materias');
  clic(ventana, '[data-grado="kinder-2"]');
  await esperar();
  ok(hay(ventana, '[data-materia]'), 'muestra las materias del grado');

  seccion('Materia → temas');
  clic(ventana, '[data-materia="matematicas"]');
  await esperar();
  const temas = ventana.document.querySelectorAll('[data-tema]').length;
  ok(temas === 3, `lista los 3 temas de Matemáticas (encontrados ${temas})`);
  ok(texto(ventana).includes('Sigue este tema'), 'marca cuál tema sigue');

  seccion('Tema → sala de clase');
  clic(ventana, '[data-tema]', 2); // «Contar objetos hasta 10»
  await esperar();
  ok(hay(ventana, '.pestanas'), 'abre la sala con sus pestañas');
  ok(hay(ventana, '.guia'), 'entra por el panel de Guía');
  ok(
    proyectado.length > 0 && proyectado[proyectado.length - 1].tipo === 'limpiar',
    'apaga el video beam al entrar a la Guía'
  );

  seccion('Panel Proyectar');
  clic(ventana, '[data-panel="proyectar"]');
  await esperar();
  ok(hay(ventana, '.previa-marco'), 'muestra la vista previa');
  ok(proyectado[proyectado.length - 1].tipo === 'lamina', 'proyecta la primera lámina');

  const totalLaminas = ventana.document.querySelectorAll('[data-lamina]').length;
  for (let i = 1; i < totalLaminas; i += 1) {
    clic(ventana, '[data-lamina-mover="1"]');
    await esperar();
  }
  ok(texto(ventana).includes(`Lámina ${totalLaminas} de ${totalLaminas}`), 'llega a la última lámina');
  ok(hay(ventana, '.mando-siguiente'), 'en la última lámina ofrece ir a la actividad');

  seccion('Panel Actividad');
  clic(ventana, '.mando-siguiente');
  await esperar();
  ok(hay(ventana, '.actividad'), 'abre la actividad');
  ok(proyectado[proyectado.length - 1].tipo === 'actividad', 'espeja la actividad al beam');

  const tema = temaDelDisco('kinder-2/matematicas/03-contar-objetos-hasta-10');
  const primera = tema.actividades[0];
  const mala = primera.opciones.find((o) => o !== primera.respuesta);

  ok(hay(ventana, '.altavoz[data-hablar]'), 'ofrece escuchar la pregunta en voz alta');
  ok(!hay(ventana, '.reaccion-feliz'), 'sin responder no hay cara');

  clic(ventana, `[data-act="${mala}"]`);
  await esperar();
  ok(!hay(ventana, '.opcion-acertada'), 'una respuesta equivocada no se marca como acierto');
  ok(!hay(ventana, '.siguiente-paso'), 'una respuesta equivocada no ofrece seguir');
  ok(!texto(ventana).includes('¡Muy bien!'), 'no felicita por equivocarse');
  ok(hay(ventana, '.reaccion-casi'), 'al equivocarse sale la cara de «casi»');
  ok(!hay(ventana, '.reaccion-feliz'), 'al equivocarse no sale la cara feliz');

  clic(ventana, `[data-act="${primera.respuesta}"]`);
  await esperar();
  ok(hay(ventana, '.opcion-acertada'), 'la respuesta correcta se marca');
  ok(texto(ventana).includes('¡Muy bien!'), 'felicita al acertar');
  ok(hay(ventana, '.reaccion-feliz'), 'al acertar sale la cara feliz');
  ok(!hay(ventana, '.reaccion-casi'), 'al acertar desaparece la cara de «casi»');
  ok(hay(ventana, '.siguiente-paso'), 'al acertar ofrece el siguiente paso');

  // Resolver el resto de actividades hasta la última.
  for (let i = 1; i < tema.actividades.length; i += 1) {
    clic(ventana, '.siguiente-paso [data-actividad-mover="1"]');
    await esperar();
    clic(ventana, `[data-act="${tema.actividades[i].respuesta}"]`);
    await esperar();
  }
  ok(
    hay(ventana, '.siguiente-paso [data-panel="registro"]'),
    'tras la última actividad ofrece pasar al Registro'
  );

  seccion('Panel Registro');
  clic(ventana, '.siguiente-paso [data-panel="registro"]');
  await esperar();
  ok(hay(ventana, '.fila-alumno'), 'muestra la lista del grupo');
  ok(
    proyectado[proyectado.length - 1].tipo === 'limpiar',
    'apaga el video beam al entrar al Registro'
  );

  const alumnos = leerJson('datos', 'grupos.json').grupos[0].estudiantes;
  ok(
    ventana.document.querySelectorAll('.fila-alumno').length === alumnos.length,
    `lista los ${alumnos.length} estudiantes`
  );

  // El bug que arreglamos: marcar y desmarcar no puede dejar el tema «visto».
  clic(ventana, `[data-marcar="${alumnos[0].id}"][data-valor="logrado"]`);
  await esperar();
  clic(ventana, `[data-marcar="${alumnos[0].id}"][data-valor="logrado"]`);
  await esperar();
  await new Promise((r) => setTimeout(r, 500));
  const trasDesmarcar = verGuardado();
  ok(
    !trasDesmarcar['k2-a'] ||
      !trasDesmarcar['k2-a'].temas['kinder-2/matematicas/03-contar-objetos-hasta-10'],
    'desmarcar al último niño borra la entrada en vez de dejarla vacía'
  );

  for (const alumno of alumnos) {
    clic(ventana, `[data-marcar="${alumno.id}"][data-valor="logrado"]`);
    await esperar();
  }
  ok(texto(ventana).includes(`${alumnos.length} de ${alumnos.length} marcados`), 'cuenta los marcados');
  ok(hay(ventana, '.siguiente-paso [data-ir="atras"]'), 'con el grupo completo ofrece terminar');

  await new Promise((r) => setTimeout(r, 500));
  const guardado = verGuardado();
  const entrada = guardado['k2-a'].temas['kinder-2/matematicas/03-contar-objetos-hasta-10'];
  ok(Object.keys(entrada.estados).length === alumnos.length, 'guarda el estado de cada niño');
  ok(Boolean(entrada.fecha), 'guarda la fecha');

  seccion('Ficha del niño');
  clic(ventana, `[data-ficha="${alumnos[0].id}"]`);
  await esperar();
  ok(hay(ventana, '.ficha'), 'el nombre abre la ficha del niño');
  ok(!hay(ventana, '.pestanas'), 'la ficha ocupa la pantalla, sin pestañas');
  ok(texto(ventana).includes(alumnos[0].nombre), 'la ficha muestra su nombre');
  ok(texto(ventana).includes('Contar objetos hasta 10'), 'la ficha muestra el historial de temas');
  ok(texto(ventana).includes('Sin anotaciones todavía'), 'arranca sin anotaciones');

  const observaciones = leerJson('datos', 'observaciones.json').observaciones;
  ok(
    ventana.document.querySelectorAll('[data-nota]').length === observaciones.length,
    `ofrece las ${observaciones.length} anotaciones configuradas`
  );
  clic(ventana, `[data-nota="${observaciones[0].id}"]`);
  await esperar();
  ok(texto(ventana).includes(observaciones[0].texto), 'al pulsar una anotación queda escrita');
  ok(hay(ventana, '[data-nota-quitar]'), 'la anotación se puede quitar');

  await new Promise((r) => setTimeout(r, 500));
  const conNota = verGuardado();
  const guardadaEnAlumno = ((conNota['k2-a'].alumnos || {})[alumnos[0].id] || {}).notas || [];
  ok(guardadaEnAlumno.length === 1, 'la anotación se guarda colgada del niño, no del tema');
  ok(Boolean(guardadaEnAlumno[0].fecha), 'la anotación queda fechada');
  ok(
    guardadaEnAlumno[0].tema === 'kinder-2/matematicas/03-contar-objetos-hasta-10',
    'la anotación recuerda en qué clase se puso'
  );

  clic(ventana, '[data-nota-quitar]');
  await esperar();
  ok(texto(ventana).includes('Sin anotaciones todavía'), 'quitar la anotación la borra');

  seccion('Anotación escrita a mano');
  const campo = ventana.document.querySelector('[data-borrador]');
  ok(Boolean(campo), 'la ficha tiene un campo para escribir');
  ok(
    ventana.document.querySelector('[data-nota-escrita]').disabled,
    'con el campo vacío no se puede agregar'
  );

  campo.value = 'Le cuesta sostener el lápiz, revisar motricidad fina';
  campo.dispatchEvent(new ventana.Event('input', { bubbles: true }));
  await esperar();
  ok(
    !ventana.document.querySelector('[data-nota-escrita]').disabled,
    'con texto se habilita el botón'
  );

  clic(ventana, '[data-nota-escrita]');
  await esperar();
  ok(texto(ventana).includes('motricidad fina'), 'la anotación escrita queda en la lista');
  ok(
    !ventana.document.querySelector('[data-borrador]').value,
    'el campo se limpia después de agregar'
  );

  await new Promise((r) => setTimeout(r, 500));
  const escritas = (verGuardado()['k2-a'].alumnos[alumnos[0].id].notas || []).filter((n) => n.manual);
  ok(escritas.length === 1, 'la anotación escrita se guarda marcada como manual');

  clic(ventana, `[data-nota="${observaciones[0].id}"]`);
  await esperar();
  clic(ventana, '[data-ficha-cerrar]');
  await esperar();
  ok(hay(ventana, '.fila-alumno'), 'volver de la ficha regresa al registro');
  ok(hay(ventana, '.senal-notas'), 'el registro señala qué niños tienen anotaciones');

  seccion('Cierre del recorrido');
  clic(ventana, '.siguiente-paso [data-ir="atras"]');
  await esperar();
  ok(hay(ventana, '[data-tema]'), 'vuelve a la lista de temas');
  ok(texto(ventana).includes('Visto'), 'el tema queda marcado como visto');

  seccion('Lenguaje — actividad de elegir el correcto');
  clic(ventana, '[data-ir="inicio"]');
  await esperar();
  clic(ventana, '[data-grado="kinder-2"]');
  await esperar();
  const cuantasMaterias = ventana.document.querySelectorAll('[data-materia]').length;
  ok(cuantasMaterias === 3, `Kínder 2 tiene 3 materias (encontradas ${cuantasMaterias})`);

  clic(ventana, '[data-materia="lenguaje"]');
  await esperar();
  clic(ventana, '[data-tema]', 0);
  await esperar();
  clic(ventana, '[data-panel="actividad"]');
  await esperar();
  ok(hay(ventana, '.actividad-seleccionar'), 'abre una actividad de elegir el correcto');

  const vocales = temaDelDisco('kinder-2/lenguaje/01-las-vocales').actividades[0];
  const buena = vocales.opciones.findIndex((o) => o.correcta);
  const otra = vocales.opciones.findIndex((o) => !o.correcta);

  clic(ventana, `[data-act="${otra}"]`);
  await esperar();
  ok(!hay(ventana, '.opcion-acertada'), 'elegir mal no marca acierto');
  clic(ventana, `[data-act="${buena}"]`);
  await esperar();
  ok(hay(ventana, '.opcion-acertada'), 'elegir bien marca acierto');
  ok(hay(ventana, '.siguiente-paso'), 'ofrece el siguiente paso');

  seccion('Exploración — actividad de clasificar');
  clic(ventana, '[data-ir="inicio"]');
  await esperar();
  clic(ventana, '[data-grado="kinder-2"]');
  await esperar();
  clic(ventana, '[data-materia="exploracion"]');
  await esperar();
  clic(ventana, '[data-tema]', 0);
  await esperar();
  clic(ventana, '[data-panel="actividad"]');
  await esperar();
  ok(hay(ventana, '.actividad-clasificar'), 'abre una actividad de clasificar');

  const clasif = temaDelDisco('kinder-2/exploracion/01-agua-y-tierra').actividades[0];
  const canastaMala = clasif.canastas.find((c) => c.id !== clasif.fichas[0].canasta).id;

  clic(ventana, '[data-act="f:0"]');
  await esperar();
  ok(hay(ventana, '.pieza-levantada'), 'tocar una ficha la levanta');

  clic(ventana, `[data-act="c:${canastaMala}"]`);
  await esperar();
  ok(hay(ventana, '.canasta-reintentar'), 'la canasta equivocada solo se mueve');
  ok(hay(ventana, '.reaccion-casi'), 'la canasta equivocada muestra la cara de «casi»');
  ok(hay(ventana, '.pieza-levantada'), 'la ficha sigue levantada tras equivocarse');
  ok(hay(ventana, '[data-act="f:0"]'), 'equivocarse no le quita la ficha al niño');

  clic(ventana, `[data-act="c:${clasif.fichas[0].canasta}"]`);
  await esperar();
  ok(!hay(ventana, '[data-act="f:0"]'), 'la ficha acertada pasa a la canasta');
  ok(!hay(ventana, '.siguiente-paso'), 'con fichas pendientes todavía no ofrece seguir');

  for (let i = 1; i < clasif.fichas.length; i += 1) {
    clic(ventana, `[data-act="f:${i}"]`);
    await esperar();
    clic(ventana, `[data-act="c:${clasif.fichas[i].canasta}"]`);
    await esperar();
  }
  ok(texto(ventana).includes('¡Muy bien!'), 'al colocar todas felicita');
  ok(hay(ventana, '.siguiente-paso'), 'al colocar todas ofrece el siguiente paso');

  seccion('Todo el contenido del disco dibuja sin reventar');
  let laminasDibujadas = 0;
  let actividadesDibujadas = 0;
  for (const grado of catalogoDelDisco()) {
    for (const materia of grado.materias) {
      for (const t of materia.temas) {
        const completo = temaDelDisco(t.ruta);
        for (const lamina of completo.laminas || []) {
          ventana.Laminas.dibujar(lamina, completo.rutaBase, 100);
          laminasDibujadas += 1;
        }
        for (const act of completo.actividades || []) {
          const tipoAct = ventana.Actividades[act.tipo];
          ok(Boolean(tipoAct), `${t.ruta}: el tipo «${act.tipo}» existe`);
          if (tipoAct) {
            tipoAct.html(act, tipoAct.inicial(act), { grande: true });
            actividadesDibujadas += 1;
          }
        }
      }
    }
  }
  ok(laminasDibujadas > 0, `dibujó ${laminasDibujadas} láminas`);
  ok(actividadesDibujadas > 0, `dibujó ${actividadesDibujadas} actividades`);

  seccion('El beam nunca recibió datos del profesor');
  const tipos = [...new Set(proyectado.map((m) => m.tipo))].sort();
  ok(
    tipos.every((t) => ['lamina', 'actividad', 'limpiar'].includes(t)),
    `solo se proyectaron tipos permitidos (${tipos.join(', ')})`
  );
  const textoProyectado = JSON.stringify(proyectado);
  ok(
    !alumnos.some((a) => textoProyectado.includes(a.nombre)),
    'ningún nombre de estudiante salió hacia la proyección'
  );

  console.log(`\n${pasos - fallos} de ${pasos} comprobaciones pasaron.`);
  if (fallos) {
    console.log(`${fallos} FALLARON`);
    process.exit(1);
  }
}

principal().catch((error) => {
  console.error('\nLa prueba reventó:', error);
  process.exit(1);
});
