'use strict';

// Iconos de trazo, dibujados en SVG para que escalen y tomen el color del
// contexto. Nunca emoji: en un video beam se ven borrosos y no se recolorean.

window.Iconos = (function () {
  const TRAZOS = {
    atras: '<path d="M15 5l-7 7 7 7"/>',
    adelante: '<path d="M9 5l7 7-7 7"/>',
    inicio: '<path d="M3 11l9-7 9 7"/><path d="M5.5 9.6V20h13V9.6"/>',
    config:
      '<path d="M4 8h8M17.5 8H20M4 16h3.5M13 16h7"/><circle cx="14" cy="8" r="2.6"/><circle cx="10" cy="16" r="2.6"/>',

    proyectar: '<rect x="2.5" y="4" width="19" height="13.5" rx="2.5"/><path d="M8.5 21h7M12 17.5V21"/>',
    actividad: '<circle cx="8" cy="8" r="4.6"/><rect x="13" y="13" width="8.5" height="8.5" rx="2.2"/>',
    guia:
      '<path d="M12 7c-2-1.6-4.4-2.2-7-2v11c2.6-.2 5 .4 7 2"/>' +
      '<path d="M12 7c2-1.6 4.4-2.2 7-2v11c-2.6-.2-5 .4-7 2"/><path d="M12 7v11"/>',
    registro:
      '<rect x="4" y="5" width="16" height="16.5" rx="2.5"/><path d="M9 2.5h6v3.5H9z"/><path d="M8.6 13l2.6 2.6 4.4-5"/>',

    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    menos: '<path d="M6 12h12"/>',
    mas: '<path d="M12 6v12M6 12h12"/>',
    alerta: '<path d="M12 4.5l8.5 15.5H3.5z"/><path d="M12 10.5v4M12 17.3v.1"/>',

    lenguaje: '<rect x="3" y="4" width="18" height="13" rx="3.5"/><path d="M8.5 17L7 21.5l5.5-4.5"/>',
    matematicas:
      '<path d="M3.5 7h6M6.5 4v6"/><path d="M14.5 7h6"/>' +
      '<path d="M4 15.5l5 5M9 15.5l-5 5"/><path d="M14.5 16h6M14.5 20h6"/>',
    exploracion: '<path d="M5 19.5C5 11.5 11 5 19.5 4.5 20 13 13.5 19.5 5 19.5z"/><path d="M9 15.5l7.5-7.5"/>',
    convivencia:
      '<circle cx="9" cy="8" r="3.4"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/>' +
      '<circle cx="17.3" cy="9.3" r="2.6"/><path d="M16 14.6c2.8.3 5 2.7 5 5.4"/>',
    arte: '<circle cx="6.5" cy="17.5" r="3"/><circle cx="17.5" cy="15.5" r="3"/><path d="M9.5 17.5V6l11-2v11.5"/>',
  };

  function svg(nombre, tam, grosor) {
    const trazos = TRAZOS[nombre];
    if (!trazos) return '';
    const tamano = tam || 24;
    const estilo = grosor ? ` style="stroke-width:${grosor}"` : '';
    return `<svg viewBox="0 0 24 24" width="${tamano}" height="${tamano}" class="ic"${estilo} aria-hidden="true">${trazos}</svg>`;
  }

  return { svg };
})();
