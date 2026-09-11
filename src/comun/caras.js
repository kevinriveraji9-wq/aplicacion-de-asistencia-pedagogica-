'use strict';

// Caras de reacción. Existen porque un niño de cuatro años no lee: la cara le
// dice si acertó antes de que nadie le explique nada.
//
// La cara de error es ÁMBAR y con un gesto suave, no roja ni llorando. Dice
// «casi», no «mal». El PRD prohíbe castigar el error, y una cara compungida
// en pantalla frente a 25 compañeros es un castigo.

window.Caras = (function () {
  const esc = window.Util.esc;

  const TONOS = {
    feliz: { relleno: '#EAF3ED', trazo: '#3E8E5A', tinta: '#2E6B43' },
    casi: { relleno: '#F9F0E1', trazo: '#C98A2E', tinta: '#96661D' },
  };

  function dibujar(tipo, tam) {
    const tono = TONOS[tipo] || TONOS.casi;
    const tamano = tam || 96;

    // Feliz sonríe; «casi» hace una boca recta ligeramente curvada hacia
    // abajo — pensativa, no llorosa.
    const boca =
      tipo === 'feliz'
        ? 'M32 56c4.5 8 12 12 18 12s13.5-4 18-12'
        : 'M33 66c5-5.5 12-8 17-8s12 2.5 17 8';

    const cejas =
      tipo === 'feliz'
        ? ''
        : '<path d="M28 30c4-3 9-3.5 13-1.5M72 30c-4-3-9-3.5-13-1.5" stroke-width="4"/>';

    return `<svg viewBox="0 0 100 100" width="${tamano}" height="${tamano}"
                 fill="none" stroke="${tono.trazo}" stroke-width="5"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="50" cy="50" r="44" fill="${tono.relleno}"/>
      <circle cx="35" cy="42" r="5" fill="${tono.trazo}" stroke="none"/>
      <circle cx="65" cy="42" r="5" fill="${tono.trazo}" stroke="none"/>
      ${cejas}
      <path d="${boca}"/>
    </svg>`;
  }

  // Bloque de reacción que usan todas las actividades. `tipo` null reserva el
  // espacio sin dibujar nada, para que la pantalla no salte al responder.
  function reaccion(tipo, texto, tam) {
    if (!tipo) return '<div class="reaccion reaccion-vacia"></div>';
    return `<div class="reaccion reaccion-${esc(tipo)}">
      ${dibujar(tipo, tam)}
      <span class="reaccion-texto">${esc(texto || '')}</span>
    </div>`;
  }

  return { dibujar, reaccion };
})();
