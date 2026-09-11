'use strict';

// Ventana Docente: estado, ruteo y todos los clics.
//
// Los clics se manejan en un solo sitio, por delegación sobre atributos
// data-*. Así cada pantalla es una función pura que devuelve HTML y no tiene
// que acordarse de conectar ni desconectar escuchas.

(function () {
  const raiz = document.getElementById('app');
  const capaAvisos = document.getElementById('avisos');

  const estado = {
    catalogo: [],
    grado: null,
    materia: null,
    tema: null,

    panel: 'guia',
    lamina: 0,
    actividad: 0,
    estadoActividad: null,

    grupos: [],
    grupo: null,
    registro: {},
    observaciones: [],
    ficha: null,
    notaBorrador: '',

    hayProyeccion: false,
    error: null,
  };

  let guardadoPendiente = null;

  // ------------------------------------------------------------- arranque

  async function iniciar() {
    try {
      estado.catalogo = await window.aula.catalogo();
      const datos = await window.aula.grupos();
      estado.grupos = window.Util.lista(datos && datos.grupos);
      estado.registro = (await window.aula.leerRegistro()) || {};
      const obs = await window.aula.observaciones();
      estado.observaciones = window.Util.lista(obs && obs.observaciones);
      estado.hayProyeccion = (await window.aula.estadoPantallas()).hayProyeccion;
    } catch (error) {
      estado.error = error.message;
    }

    window.aula.alCambiarPantallas((datos) => {
      estado.hayProyeccion = datos.hayProyeccion;
      render();
    });

    render();
  }

  // --------------------------------------------------------------- vistas

  function vista() {
    if (estado.error) return 'error';
    if (estado.tema) return 'sala';
    if (estado.materia) return 'temas';
    if (estado.grado) return 'materias';
    return 'grados';
  }

  function render() {
    const actual = vista();

    if (actual === 'error') {
      raiz.innerHTML = `
        <main class="centro">
          <h1 class="titulo">No se pudo cargar el contenido</h1>
          <p class="subtitulo">${window.Util.esc(estado.error)}</p>
        </main>`;
      return;
    }

    raiz.innerHTML = window.Pantallas[actual](estado);
  }

  function avisar(texto) {
    const nota = document.createElement('div');
    nota.className = 'toast';
    nota.textContent = texto;
    capaAvisos.appendChild(nota);
    setTimeout(() => nota.remove(), 2600);
  }

  // ------------------------------------------------------------ navegación

  function irGrado(id) {
    estado.grado = estado.catalogo.find((g) => g.id === id) || null;
    // El grupo se resuelve aquí y no al abrir el tema: la lista de temas ya
    // necesita saber cuáles vio este grupo para marcar «Sigue este tema».
    estado.grupo = estado.grado
      ? estado.grupos.find((g) => g.grado === estado.grado.id) || estado.grupos[0] || null
      : null;
    estado.materia = null;
    estado.tema = null;
    render();
  }

  function irMateria(id) {
    estado.materia = estado.grado.materias.find((m) => m.id === id) || null;
    if (estado.materia) aplicarColorMateria(estado.materia);
    estado.tema = null;
    render();
  }

  async function irTema(ruta) {
    try {
      estado.tema = await window.aula.tema(ruta);
    } catch (error) {
      avisar(`No se pudo abrir el tema: ${error.message}`);
      return;
    }

    estado.panel = 'guia';
    estado.lamina = 0;
    estado.actividad = 0;
    estado.estadoActividad = null;
    estado.ficha = null;

    limpiarProyeccion();
    render();
  }

  function atras() {
    window.Voz.callar();
    // Desde la ficha de un niño, «Atrás» vuelve al registro, no sale del tema.
    if (estado.ficha) {
      estado.ficha = null;
      return render();
    }
    if (estado.tema) {
      estado.tema = null;
      limpiarProyeccion();
    } else if (estado.materia) {
      estado.materia = null;
      aplicarColorMateria(null);
    } else if (estado.grado) {
      estado.grado = null;
    }
    render();
  }

  function inicio() {
    window.Voz.callar();
    estado.ficha = null;
    estado.tema = null;
    estado.materia = null;
    estado.grado = null;
    aplicarColorMateria(null);
    limpiarProyeccion();
    render();
  }

  // Toda la sesión queda del color de su materia: el profesor sabe dónde está
  // sin leer.
  function aplicarColorMateria(materia) {
    const raizCss = document.documentElement.style;
    if (!materia) {
      raizCss.removeProperty('--materia');
      raizCss.removeProperty('--materia-tinte');
      raizCss.removeProperty('--materia-oscuro');
      return;
    }
    raizCss.setProperty('--materia', materia.color);
    raizCss.setProperty('--materia-tinte', materia.tinte);
    raizCss.setProperty('--materia-oscuro', materia.oscuro);
  }

  // ----------------------------------------------------------- proyección

  function limpiarProyeccion() {
    window.aula.proyectar({ tipo: 'limpiar' });
  }

  // La proyección no conoce el catálogo, así que el color de la materia viaja
  // en cada mensaje: la lámina del video beam sale del mismo color que la
  // sesión en la ventana del profesor.
  function colorMateria() {
    const m = estado.materia;
    return m ? { color: m.color, tinte: m.tinte, oscuro: m.oscuro } : null;
  }

  function proyectarLamina() {
    const laminas = window.Util.lista(estado.tema.laminas);
    if (!laminas.length) return limpiarProyeccion();
    window.aula.proyectar({
      tipo: 'lamina',
      lamina: laminas[Math.min(estado.lamina, laminas.length - 1)],
      rutaBase: estado.tema.rutaBase,
      materia: colorMateria(),
    });
  }

  function proyectarActividad() {
    const actividades = window.Util.lista(estado.tema.actividades);
    if (!actividades.length) return limpiarProyeccion();
    const config = actividades[Math.min(estado.actividad, actividades.length - 1)];
    window.aula.proyectar({
      tipo: 'actividad',
      actividad: config,
      estado: estado.estadoActividad,
      materia: colorMateria(),
    });
  }

  function actividadActual() {
    const actividades = window.Util.lista(estado.tema.actividades);
    return actividades[Math.min(estado.actividad, actividades.length - 1)] || null;
  }

  function reiniciarActividad() {
    const config = actividadActual();
    const tipo = config && window.Actividades[config.tipo];
    estado.estadoActividad = tipo ? tipo.inicial(config) : null;
  }

  // Los niños de kínder no leen: la pregunta se dice en voz alta al abrir la
  // actividad, no solo se escribe. Se lee al entrar y al cambiar de actividad,
  // nunca en cada respuesta —repetir la pregunta a cada clic sería insoportable.
  function hablarActividad() {
    const config = actividadActual();
    if (!config) return;
    const partes = [config.pregunta, config.apoyo].filter(Boolean).join('. ');
    window.Voz.reproducir(partes, config.audio, estado.tema.rutaBase);
  }

  function irPanel(id) {
    estado.panel = id;
    window.Voz.callar();

    if (id === 'actividad' && !estado.estadoActividad) reiniciarActividad();

    // Guía y Registro son del profesor: al entrar, el beam se apaga.
    if (id === 'guia' || id === 'registro') limpiarProyeccion();
    if (id === 'proyectar') proyectarLamina();
    if (id === 'actividad') {
      proyectarActividad();
      hablarActividad();
    }

    render();
  }

  // -------------------------------------------------------------- registro

  // El registro de un grupo tiene dos mitades: `temas` (qué se marcó en cada
  // clase) y `alumnos` (las anotaciones de cada niño).
  function registroDelGrupo() {
    const id = estado.grupo.id;
    const grupo = estado.registro[id] || (estado.registro[id] = { temas: {}, alumnos: {} });
    if (!grupo.temas) grupo.temas = {};
    if (!grupo.alumnos) grupo.alumnos = {};
    return grupo;
  }

  function marcar(alumnoId, valor) {
    const ruta = estado.tema.ruta;
    const porGrupo = registroDelGrupo();
    const entrada =
      porGrupo.temas[ruta] || (porGrupo.temas[ruta] = { fecha: window.Util.hoy(), estados: {} });

    // Volver a pulsar el mismo estado lo quita: marcar mal a un niño no puede
    // ser un callejón sin salida.
    if (entrada.estados[alumnoId] === valor) delete entrada.estados[alumnoId];
    else entrada.estados[alumnoId] = valor;

    entrada.fecha = window.Util.hoy();

    // Un tema sin ninguna marca no está visto. Si quedó vacío por desmarcar,
    // la entrada se borra: si no, el tema aparecería como visto en la lista
    // solo por haber abierto el panel. El grupo se conserva aunque se quede
    // sin temas, porque puede tener anotaciones de los niños.
    if (!Object.keys(entrada.estados).length) delete porGrupo.temas[ruta];

    render();
    guardarPronto();
  }

  // ------------------------------------------------------------ anotaciones

  function anotar(nota) {
    if (!estado.grupo || !estado.ficha) return;
    const porGrupo = registroDelGrupo();
    const alumno =
      porGrupo.alumnos[estado.ficha] || (porGrupo.alumnos[estado.ficha] = { notas: [] });

    alumno.notas.push({
      fecha: window.Util.hoy(),
      tema: estado.tema ? estado.tema.ruta : null,
      ...nota,
    });

    render();
    guardarPronto();
  }

  // Anotación de un clic: la frase ya está escrita en observaciones.json.
  function agregarNota(observacionId) {
    const obs = estado.observaciones.find((o) => o.id === observacionId);
    if (!obs) return;
    anotar({
      id: `${observacionId}-${Date.now()}`,
      observacion: observacionId,
      texto: obs.texto,
    });
  }

  // Anotación escrita a mano, para lo que no cabe en una frase hecha.
  function agregarNotaEscrita() {
    const texto = String(estado.notaBorrador || '').trim();
    if (!texto) return;
    anotar({ id: `escrita-${Date.now()}`, texto, manual: true });
    estado.notaBorrador = '';
    render();
  }

  function quitarNota(notaId) {
    const porGrupo = registroDelGrupo();
    const alumno = porGrupo.alumnos[estado.ficha];
    if (!alumno) return;
    alumno.notas = alumno.notas.filter((n) => n.id !== notaId);
    render();
    guardarPronto();
  }

  // Autoguardado: un profesor con 25 niños encima no se va a acordar de pulsar
  // Guardar, y perder observaciones no es aceptable.
  function guardarPronto() {
    clearTimeout(guardadoPendiente);
    guardadoPendiente = setTimeout(() => guardar(false), 400);
  }

  async function guardar(conAviso) {
    clearTimeout(guardadoPendiente);
    try {
      await window.aula.guardarRegistro(estado.registro);
      if (conAviso) avisar('Registro guardado');
    } catch (error) {
      avisar(`No se pudo guardar: ${error.message}`);
    }
  }

  // ----------------------------------------------------------------- clics

  document.addEventListener('click', (evento) => {
    const en = (selector) => evento.target.closest(selector);
    let nodo;

    if ((nodo = en('[data-hablar]'))) {
      if (!window.Voz.decir(nodo.dataset.hablar)) {
        avisar('Este computador no tiene una voz en español instalada.');
      }
      return;
    }

    if ((nodo = en('[data-ir]'))) {
      const destino = nodo.dataset.ir;
      if (destino === 'atras') return atras();
      if (destino === 'inicio') return inicio();
      if (destino === 'configuracion') return avisar('La pantalla de Configuración todavía no está hecha.');
    }

    if ((nodo = en('[data-grado]'))) return irGrado(nodo.dataset.grado);
    if ((nodo = en('[data-materia]'))) return irMateria(nodo.dataset.materia);
    if ((nodo = en('[data-tema]'))) return irTema(nodo.dataset.tema);
    if ((nodo = en('[data-panel]'))) return irPanel(nodo.dataset.panel);

    if ((nodo = en('[data-lamina]'))) {
      estado.lamina = Number(nodo.dataset.lamina);
      proyectarLamina();
      return render();
    }

    if ((nodo = en('[data-lamina-mover]'))) {
      const total = window.Util.lista(estado.tema.laminas).length;
      const siguiente = estado.lamina + Number(nodo.dataset.laminaMover);
      if (siguiente < 0 || siguiente >= total) return;
      estado.lamina = siguiente;
      proyectarLamina();
      return render();
    }

    if ((nodo = en('[data-actividad-mover]'))) {
      const total = window.Util.lista(estado.tema.actividades).length;
      const siguiente = estado.actividad + Number(nodo.dataset.actividadMover);
      if (siguiente < 0 || siguiente >= total) return;
      estado.actividad = siguiente;
      reiniciarActividad();
      proyectarActividad();
      hablarActividad();
      return render();
    }

    if (en('[data-actividad-reiniciar]')) {
      reiniciarActividad();
      proyectarActividad();
      hablarActividad();
      return render();
    }

    // Única entrada de las actividades: cualquier cosa con data-act le llega
    // al tipo de actividad, que decide qué significa. Así un tipo nuevo con
    // otros objetivos (fichas, canastas, parejas) no obliga a tocar el router.
    if ((nodo = en('[data-act]'))) {
      const config = actividadActual();
      const tipo = config && window.Actividades[config.tipo];
      if (!tipo) return;
      estado.estadoActividad = tipo.responder(config, estado.estadoActividad, nodo.dataset.act);
      proyectarActividad();
      return render();
    }

    if ((nodo = en('[data-marcar]'))) {
      return marcar(nodo.dataset.marcar, nodo.dataset.valor);
    }

    if ((nodo = en('[data-ficha]'))) {
      estado.ficha = nodo.dataset.ficha;
      return render();
    }

    if (en('[data-ficha-cerrar]')) {
      estado.ficha = null;
      return render();
    }

    if ((nodo = en('[data-nota]'))) return agregarNota(nodo.dataset.nota);
    if ((nodo = en('[data-nota-quitar]'))) return quitarNota(nodo.dataset.notaQuitar);
    if (en('[data-nota-escrita]')) return agregarNotaEscrita();

    if (en('[data-registro-guardar]')) return guardar(true);
  });

  // El borrador de la anotación escrita se guarda en el estado a cada tecla,
  // sin repintar: si no, cada render borraría lo que el profesor va tecleando.
  document.addEventListener('input', (evento) => {
    const campo = evento.target.closest('[data-borrador]');
    if (!campo) return;
    const estabaVacio = !String(estado.notaBorrador || '').trim();
    const ahoraVacio = !String(campo.value).trim();
    estado.notaBorrador = campo.value;

    // El botón «Agregar» solo cambia al pasar de vacío a con texto o al revés.
    // Mientras no cambie no se repinta, para no interrumpir al que escribe.
    if (estabaVacio === ahoraVacio) return;

    const posicion = campo.selectionStart;
    render();
    const nuevo = document.querySelector('[data-borrador]');
    if (nuevo) {
      nuevo.focus();
      nuevo.setSelectionRange(posicion, posicion);
    }
  });

  // Ctrl+Enter guarda la anotación sin soltar el teclado.
  document.addEventListener('keydown', (evento) => {
    if (!evento.target.closest('[data-borrador]')) return;
    if (evento.key === 'Enter' && (evento.ctrlKey || evento.metaKey)) {
      evento.preventDefault();
      agregarNotaEscrita();
    }
  });

  // Esto es un tablero, no un documento: nada de menú contextual ni de
  // arrastrar y soltar archivos dentro de la ventana.
  // ...salvo dentro del campo de escribir, donde copiar y pegar sí hace falta.
  document.addEventListener('contextmenu', (e) => {
    if (e.target.closest('[data-borrador]')) return;
    e.preventDefault();
  });
  document.addEventListener('dragover', (e) => e.preventDefault());
  document.addEventListener('drop', (e) => e.preventDefault());

  iniciar();
})();
