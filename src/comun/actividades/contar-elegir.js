'use strict';

// Actividad «contar y elegir el número».
//
// El estado vive en la ventana Docente —donde el niño usa el mouse— y se
// espeja a la de Proyección, que solo dibuja. Por eso html() es una función
// pura del estado: las dos ventanas la llaman con lo mismo y pintan lo mismo.
//
// Reglas del PRD que este archivo cumple, y que todo tipo de actividad debe
// cumplir: objetivos de 100px o más, un solo clic, sin tiempo límite y sin
// castigo por error (equivocarse no pinta nada rojo, solo no confirma).

window.Actividades = window.Actividades || {};

window.Actividades['contar-elegir'] = (function () {
  const esc = window.Util.esc;
  const Laminas = window.Laminas;

  function inicial() {
    return { elegida: null, acertada: false, fallos: [] };
  }

  // Quien dibuja la pantalla pregunta esto para saber si toca ofrecer el
  // siguiente paso. Firma común a todos los tipos: terminada(estado, config).
  function terminada(estado) {
    return Boolean(estado && estado.acertada);
  }

  function responder(config, estado, valor) {
    if (estado.acertada) return estado;

    const numero = Number(valor);
    const acertada = numero === Number(config.respuesta);

    return {
      elegida: numero,
      acertada,
      // Los fallos no se proyectan; le sirven al profesor para saber si el
      // niño contó mal o solo se equivocó al hacer clic.
      fallos: acertada ? estado.fallos : estado.fallos.concat(numero),
    };
  }

  function html(config, estadoRecibido, opciones) {
    // Tolera un estado ausente: la ventana de Proyección puede recibir el
    // primer mensaje antes de que el Docente haya inicializado nada.
    const estado = estadoRecibido || inicial();
    const conf = opciones || {};
    const tamObjeto = conf.grande ? 128 : 76;
    const cantidad = Number(config.cantidad) || 0;

    const opcionesHtml = window.Util.lista(config.opciones)
      .map((valor) => {
        const numero = Number(valor);
        const elegida = estado.elegida === numero;
        const clases = ['opcion'];
        if (elegida && estado.acertada) clases.push('opcion-acertada');
        if (elegida && !estado.acertada) clases.push('opcion-reintentar');

        return `
          <button class="${clases.join(' ')}" data-act="${numero}" ${estado.acertada ? 'disabled' : ''}>
            ${numero}
            ${elegida && estado.acertada ? insignia() : ''}
          </button>`;
      })
      .join('');

    // En la proyección la cara va dentro de la actividad; en la ventana del
    // profesor la dibuja el panel, junto a los botones de «qué sigue», porque
    // ahí el alto es escaso.
    const cara = reaccion(estado);
    const bloqueCara = conf.grande
      ? window.Caras.reaccion(cara && cara.cara, cara && cara.texto, 130)
      : '';

    return `
      <div class="actividad actividad-contar ${conf.grande ? 'es-grande' : ''}">
        <div class="actividad-pregunta">
          <span>${esc(config.pregunta || '')}</span>
          ${conf.grande ? '' : window.Voz.boton(config.pregunta)}
        </div>
        <div class="actividad-escena">
          ${Laminas.grupoDeObjetos(config.objeto || 'pelota', cantidad, tamObjeto)}
        </div>
        <div class="actividad-opciones">${opcionesHtml}</div>
        ${bloqueCara}
      </div>`;
  }

  // Qué cara toca ahora. La devuelve el tipo de actividad porque solo él sabe
  // qué significa su propio estado.
  function reaccion(estado) {
    if (!estado) return null;
    if (estado.acertada) return { cara: 'feliz', texto: '¡Muy bien!' };
    if (estado.elegida !== null) return { cara: 'casi', texto: 'Casi. Cuenta otra vez.' };
    return null;
  }

  function insignia() {
    return `<span class="insignia">
      <svg viewBox="0 0 24 24" width="30" height="30" class="ic" style="stroke-width:3">
        <path d="M5 12.5l4.5 4.5L19 7"/>
      </svg>
    </span>`;
  }

  return { nombre: 'Contar y elegir el número', inicial, terminada, reaccion, responder, html };
})();
