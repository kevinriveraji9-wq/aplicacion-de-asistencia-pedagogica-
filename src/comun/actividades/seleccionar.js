'use strict';

// Actividad «elige el correcto»: una pregunta y varias opciones, una válida.
// Sirve para letras, sonidos, figuras, colores — es el tipo más general.
//
// Cada opción puede ser texto (una letra grande) o un objeto dibujado.

window.Actividades = window.Actividades || {};

window.Actividades['seleccionar'] = (function () {
  const esc = window.Util.esc;
  const lista = window.Util.lista;

  function inicial() {
    return { elegida: null, acertada: false, fallos: [] };
  }

  function terminada(estado) {
    return Boolean(estado && estado.acertada);
  }

  function responder(config, estado, valor) {
    if (estado.acertada) return estado;

    const indice = Number(valor);
    const opcion = lista(config.opciones)[indice];
    if (!opcion) return estado;

    const acertada = Boolean(opcion.correcta);
    return {
      elegida: indice,
      acertada,
      fallos: acertada ? estado.fallos : estado.fallos.concat(indice),
    };
  }

  // Lo que se ve dentro del botón: una letra grande o un objeto dibujado.
  function caraDeOpcion(opcion, grande) {
    if (opcion.objeto) return window.Laminas.objeto(opcion.objeto, grande ? 130 : 96, 0);
    return `<span class="opcion-letra">${esc(opcion.texto || '')}</span>`;
  }

  function html(config, estadoRecibido, opciones) {
    const estado = estadoRecibido || inicial();
    const conf = opciones || {};

    const botones = lista(config.opciones)
      .map((opcion, i) => {
        const elegida = estado.elegida === i;
        const clases = ['opcion'];
        if (elegida && estado.acertada) clases.push('opcion-acertada');
        if (elegida && !estado.acertada) clases.push('opcion-reintentar');

        return `<button class="${clases.join(' ')}" data-act="${i}" ${estado.acertada ? 'disabled' : ''}>
          ${caraDeOpcion(opcion, conf.grande)}
          ${elegida && estado.acertada ? insignia() : ''}
        </button>`;
      })
      .join('');

    const cara = reaccion(estado);
    const bloqueCara = conf.grande
      ? window.Caras.reaccion(cara && cara.cara, cara && cara.texto, 130)
      : '';

    const paraLeer = [config.pregunta, config.apoyo].filter(Boolean).join('. ');

    return `
      <div class="actividad actividad-seleccionar ${conf.grande ? 'es-grande' : ''}">
        <div class="actividad-pregunta">
          <span>${esc(config.pregunta || '')}</span>
          ${conf.grande ? '' : window.Voz.boton(paraLeer)}
        </div>
        ${config.apoyo ? `<div class="actividad-apoyo">${esc(config.apoyo)}</div>` : ''}
        <div class="actividad-opciones">${botones}</div>
        ${bloqueCara}
      </div>`;
  }

  function reaccion(estado) {
    if (!estado) return null;
    if (estado.acertada) return { cara: 'feliz', texto: '¡Muy bien!' };
    if (estado.elegida !== null) return { cara: 'casi', texto: 'Casi. Mira otra vez.' };
    return null;
  }

  function insignia() {
    return `<span class="insignia">
      <svg viewBox="0 0 24 24" width="30" height="30" class="ic" style="stroke-width:3">
        <path d="M5 12.5l4.5 4.5L19 7"/>
      </svg>
    </span>`;
  }

  return { nombre: 'Elegir el correcto', inicial, terminada, reaccion, responder, html };
})();
