'use strict';

// Dibuja láminas y objetos contables. Lo usan las dos ventanas: la de
// Proyección para mostrarlos en grande y la del Docente para la vista previa.
//
// Los objetos son SVG generado en código, no archivos de imagen, para que la
// app arranque con contenido real sin depender de que alguien produzca las
// láminas. Cuando haya imágenes de verdad se usa { tipo: "imagen" }.

window.Laminas = (function () {
  const esc = window.Util.esc;

  const PALETA = ['#D2544A', '#2F6FB3', '#C98A2E', '#3E8E5A', '#7B5EA7'];
  const PALETA_OSCURA = ['#A63C34', '#22527F', '#96661D', '#2E6B43', '#5D4482'];

  const OBJETOS = {
    manzana(tam) {
      return `<svg viewBox="0 0 100 100" width="${tam}" height="${tam}" aria-hidden="true">
        <path d="M50 31c-9-9-24-9-32 0-9 10-6 28 3 42 6 9 12 14 18 14h22c6 0 12-5 18-14 9-14 12-32 3-42-8-9-23-9-32 0z" fill="#D2544A"/>
        <rect x="47" y="12" width="6" height="21" rx="3" fill="#7A5636"/>
        <path d="M54 19c6-6 14-7 18-5 0 6-5 12-12 13-3 1-6 0-6-2z" fill="#3E8E5A"/>
      </svg>`;
    },

    globo(tam, indice) {
      const claro = PALETA[indice % PALETA.length];
      const oscuro = PALETA_OSCURA[indice % PALETA_OSCURA.length];
      const cuerda = indice % 2 === 0 ? 'M30 72c0 10 8 12 8 21' : 'M30 72c0 10-8 12-8 21';
      const alto = Math.round(tam * 1.67);
      return `<svg viewBox="0 0 60 100" width="${tam}" height="${alto}" aria-hidden="true">
        <ellipse cx="30" cy="34" rx="24" ry="30" fill="${claro}"/>
        <path d="M30 64l-5.5 8h11z" fill="${oscuro}"/>
        <path d="${cuerda}" stroke="#C6C0B5" stroke-width="3" fill="none" stroke-linecap="round"/>
      </svg>`;
    },

    pelota(tam, indice) {
      const color = PALETA[indice % PALETA.length];
      return `<svg viewBox="0 0 100 100" width="${tam}" height="${tam}" aria-hidden="true">
        <circle cx="50" cy="50" r="42" fill="${color}"/>
        <path d="M8 50h84M50 8c14 14 14 70 0 84M50 8C36 22 36 78 50 92"
              stroke="#FFFDF9" stroke-width="5" fill="none" stroke-linecap="round"/>
      </svg>`;
    },

    estrella(tam, indice) {
      const color = PALETA[(indice + 2) % PALETA.length];
      return `<svg viewBox="0 0 100 100" width="${tam}" height="${tam}" aria-hidden="true">
        <path d="M50 8l12.6 25.5 28.2 4.1-20.4 19.9 4.8 28.1L50 72.3 24.8 85.6l4.8-28.1L9.2 37.6l28.2-4.1z" fill="${color}"/>
      </svg>`;
    },

    pez(tam, indice) {
      const color = PALETA[(indice + 1) % PALETA.length];
      const oscuro = PALETA_OSCURA[(indice + 1) % PALETA_OSCURA.length];
      return `<svg viewBox="0 0 100 100" width="${tam}" height="${tam}" aria-hidden="true">
        <path d="M72 50l22-17v34z" fill="${oscuro}"/>
        <ellipse cx="45" cy="50" rx="35" ry="23" fill="${color}"/>
        <circle cx="24" cy="44" r="5" fill="#FFFDF9"/>
        <circle cx="23" cy="44" r="2.4" fill="#33302B"/>
      </svg>`;
    },

    flor(tam, indice) {
      const color = PALETA[(indice + 3) % PALETA.length];
      const petalos = [0, 72, 144, 216, 288]
        .map((giro) => `<ellipse cx="50" cy="28" rx="12" ry="19" fill="${color}"
                          transform="rotate(${giro} 50 50)"/>`)
        .join('');
      return `<svg viewBox="0 0 100 100" width="${tam}" height="${tam}" aria-hidden="true">
        <path d="M50 55v38" stroke="#3E8E5A" stroke-width="6" stroke-linecap="round" fill="none"/>
        ${petalos}
        <circle cx="50" cy="50" r="12" fill="#C98A2E"/>
      </svg>`;
    },

    hoja(tam) {
      return `<svg viewBox="0 0 100 100" width="${tam}" height="${tam}" aria-hidden="true">
        <path d="M18 84C18 44 46 16 86 16c0 40-28 68-68 68z" fill="#3E8E5A"/>
        <path d="M30 72L74 28" stroke="#2E6B43" stroke-width="5" stroke-linecap="round" fill="none"/>
      </svg>`;
    },
  };

  // Un objeto que el tema pide y no existe se dibuja como un círculo neutro
  // en vez de romper la clase.
  function objeto(nombre, tam, indice) {
    const dibujar = OBJETOS[nombre] || OBJETOS.pelota;
    return dibujar(tam, indice || 0);
  }

  function objetosDisponibles() {
    return Object.keys(OBJETOS);
  }

  function grupoDeObjetos(nombre, cantidad, tam) {
    let html = '';
    for (let i = 0; i < cantidad; i += 1) html += objeto(nombre, tam, i);
    return html;
  }

  // ------------------------------------------------------------- láminas

  function laminaNumero(lamina, tam) {
    const cantidad = Number(lamina.numero) || 0;
    const columnas = cantidad > 6 ? 4 : 3;
    return `
      <div class="lamina lamina-numero">
        <div class="lamina-cifra">
          <div class="cifra">${esc(lamina.numero)}</div>
          <div class="palabra">${esc(lamina.palabra || '')}</div>
        </div>
        <div class="lamina-objetos" style="grid-template-columns:repeat(${columnas},minmax(0,1fr))">
          ${grupoDeObjetos(lamina.objeto || 'pelota', cantidad, tam)}
        </div>
      </div>`;
  }

  // Igual que la de número, pero para letras: la grafía enorme y la palabra
  // que la nombra. Opcionalmente con objetos al lado.
  function laminaLetra(lamina, tam) {
    const cantidad = Number(lamina.cantidad) || 0;
    return `
      <div class="lamina lamina-numero">
        <div class="lamina-cifra">
          <div class="cifra">${esc(lamina.letra)}</div>
          <div class="palabra">${esc(lamina.palabra || '')}</div>
        </div>
        ${cantidad
          ? `<div class="lamina-objetos" style="grid-template-columns:repeat(${Math.min(cantidad, 3)},minmax(0,1fr))">
               ${grupoDeObjetos(lamina.objeto || 'flor', cantidad, tam)}
             </div>`
          : ''}
      </div>`;
  }

  // Un grupo de objetos con su pie, sin grafía gigante. Para láminas que
  // muestran una categoría («los que viven en el agua») en vez de un símbolo.
  function laminaObjetos(lamina, tam) {
    const cantidad = Number(lamina.cantidad) || 0;
    return `
      <div class="lamina lamina-solo-objetos">
        <div class="lamina-objetos" style="grid-template-columns:repeat(${Math.min(cantidad, 4)},minmax(0,1fr))">
          ${grupoDeObjetos(lamina.objeto || 'pelota', cantidad, tam)}
        </div>
        ${lamina.pie ? `<div class="lamina-pie">${esc(lamina.pie)}</div>` : ''}
      </div>`;
  }

  function laminaImagen(lamina, rutaBase) {
    const src = `${rutaBase}/${String(lamina.archivo || '').replace(/^\/+/, '')}`;
    return `
      <div class="lamina lamina-imagen">
        <img src="${esc(src)}" alt="">
        ${lamina.pie ? `<div class="lamina-pie">${esc(lamina.pie)}</div>` : ''}
      </div>`;
  }

  function laminaTexto(lamina) {
    return `
      <div class="lamina lamina-texto">
        <div class="lamina-titular">${esc(lamina.texto || '')}</div>
        ${lamina.pie ? `<div class="lamina-pie">${esc(lamina.pie)}</div>` : ''}
      </div>`;
  }

  function dibujar(lamina, rutaBase, tam) {
    if (!lamina) return '<div class="lamina"></div>';
    const tamano = tam || 112;
    if (lamina.tipo === 'imagen') return laminaImagen(lamina, rutaBase || '');
    if (lamina.tipo === 'texto') return laminaTexto(lamina);
    if (lamina.tipo === 'letra') return laminaLetra(lamina, tamano);
    if (lamina.tipo === 'objetos') return laminaObjetos(lamina, tamano);
    return laminaNumero(lamina, tamano);
  }

  return { dibujar, objeto, grupoDeObjetos, objetosDisponibles };
})();
