'use strict';

// Actividad «clasificar»: repartir fichas entre dos o más canastas.
//
// NO se arrastra. Se toca la ficha (se levanta) y luego se toca la canasta.
// Dos clics sueltos en vez de mantener el botón mientras se mueve el mouse:
// para una mano de cuatro años eso es mucho más fácil de lograr, y encaja con
// la regla de «un solo clic, nunca doble». Ver design.md.
//
// Equivocarse de canasta no quita la ficha ni pinta nada rojo: la canasta se
// mueve un poco y la ficha sigue levantada, lista para otro intento.

window.Actividades = window.Actividades || {};

window.Actividades['clasificar'] = (function () {
  const esc = window.Util.esc;
  const lista = window.Util.lista;

  function inicial() {
    return { elegida: null, colocadas: {}, error: null, fallos: 0 };
  }

  // Terminada cuando todas las fichas están en alguna canasta.
  function terminada(estado, config) {
    if (!estado || !config) return false;
    return Object.keys(estado.colocadas).length === lista(config.fichas).length;
  }

  function responder(config, estado, valor) {
    const fichas = lista(config.fichas);
    const [que, cual] = String(valor).split(':');

    if (que === 'f') {
      const indice = Number(cual);
      if (estado.colocadas[indice] !== undefined) return estado;
      return { ...estado, elegida: estado.elegida === indice ? null : indice, error: null };
    }

    if (que === 'c') {
      if (estado.elegida === null) return estado;
      const ficha = fichas[estado.elegida];
      if (!ficha) return estado;

      if (ficha.canasta === cual) {
        const colocadas = { ...estado.colocadas, [estado.elegida]: cual };
        return { ...estado, colocadas, elegida: null, error: null };
      }
      return { ...estado, error: cual, fallos: estado.fallos + 1 };
    }

    return estado;
  }

  function html(config, estadoRecibido, opciones) {
    const estado = estadoRecibido || inicial();
    const conf = opciones || {};
    const tam = conf.grande ? 104 : 76;
    const fichas = lista(config.fichas);
    const canastas = lista(config.canastas);

    const bandeja = fichas
      .map((ficha, i) => {
        if (estado.colocadas[i] !== undefined) return '';
        const clases = ['pieza'];
        if (estado.elegida === i) clases.push('pieza-levantada');
        return `<button class="${clases.join(' ')}" data-act="f:${i}">
          ${window.Laminas.objeto(ficha.objeto, tam, i)}
        </button>`;
      })
      .join('');

    const cajas = canastas
      .map((canasta) => {
        const dentro = fichas
          .map((ficha, i) => (estado.colocadas[i] === canasta.id
            ? window.Laminas.objeto(ficha.objeto, Math.round(tam * 0.62), i)
            : ''))
          .join('');

        const clases = ['canasta'];
        if (estado.error === canasta.id) clases.push('canasta-reintentar');
        if (estado.elegida !== null) clases.push('canasta-lista');

        return `<button class="${clases.join(' ')}" data-act="c:${esc(canasta.id)}">
          <span class="canasta-nombre">${esc(canasta.nombre)}</span>
          <span class="canasta-dentro">${dentro}</span>
        </button>`;
      })
      .join('');

    const listo = terminada(estado, config);
    const quedan = fichas.length - Object.keys(estado.colocadas).length;

    const apoyo = listo
      ? ''
      : estado.elegida !== null
        ? 'Ahora toca la canasta donde va'
        : `Toca una figura para levantarla · quedan ${quedan}`;

    const cara = reaccion(estado, config);
    const bloqueCara = conf.grande
      ? window.Caras.reaccion(cara && cara.cara, cara && cara.texto, 130)
      : '';

    const paraLeer = [config.pregunta, apoyo].filter(Boolean).join('. ');

    return `
      <div class="actividad actividad-clasificar ${conf.grande ? 'es-grande' : ''}">
        <div class="actividad-pregunta">
          <span>${esc(config.pregunta || '')}</span>
          ${conf.grande ? '' : window.Voz.boton(paraLeer)}
        </div>
        <div class="actividad-apoyo">${esc(apoyo)}</div>
        <div class="bandeja">${bandeja}</div>
        <div class="canastas">${cajas}</div>
        ${bloqueCara}
      </div>`;
  }

  function reaccion(estado, config) {
    if (!estado) return null;
    if (terminada(estado, config)) return { cara: 'feliz', texto: '¡Muy bien!' };
    if (estado.error) return { cara: 'casi', texto: 'Ahí no. Prueba en la otra.' };
    return null;
  }

  return { nombre: 'Clasificar en canastas', inicial, terminada, reaccion, responder, html };
})();
