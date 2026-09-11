'use strict';

window.Paneles = window.Paneles || {};

// La Guía es lo que convierte esto en ayuda al profesor y no en otro banco de
// imágenes. Solo se ve en esta ventana; nunca se proyecta.
window.Paneles.guia = function (estado) {
  const esc = window.Util.esc;
  const lista = window.Util.lista;
  const guia = estado.tema.guia || {};

  function bloque(titulo, cuerpo, tono) {
    if (!cuerpo) return '';
    return `
      <section class="bloque">
        <h2 class="etiqueta ${tono === 'aviso' ? 'etiqueta-aviso' : ''}">${esc(titulo)}</h2>
        ${cuerpo}
      </section>`;
  }

  function puntos(items, tono) {
    if (!items.length) return '';
    return `<ul class="puntos ${tono === 'aviso' ? 'puntos-aviso' : ''}">
      ${items.map((t) => `<li class="prosa">${esc(t)}</li>`).join('')}
    </ul>`;
  }

  const queDecir = lista(guia.queDecir);
  const citas = queDecir.length
    ? `<div class="citas">${queDecir.map((t) => `<p class="prosa cita">«${esc(t)}»</p>`).join('')}</div>`
    : '';

  const materiales = lista(guia.materiales);

  return `
    <div class="guia">
      <div class="guia-cuerpo">
        ${bloque('Objetivo', guia.objetivo ? `<p class="prosa destacado">${esc(guia.objetivo)}</p>` : '')}
        ${bloque('Qué decir para empezar', citas)}
        ${bloque('Preguntas para hacer', puntos(lista(guia.preguntas)))}
        ${bloque('Errores comunes', puntos(lista(guia.erroresComunes), 'aviso'), 'aviso')}
      </div>

      <aside class="guia-ficha">
        <div>
          <div class="etiqueta">Duración</div>
          <div class="ficha-dato">${esc(estado.tema.duracionMin || '—')} minutos</div>
        </div>
        <hr>
        <div>
          <div class="etiqueta">Materiales físicos</div>
          <p class="prosa ficha-texto">${materiales.length ? esc(materiales.join(' · ')) : 'Ninguno'}</p>
        </div>
        <hr>
        <div>
          <div class="etiqueta">Dimensión (MEN)</div>
          <span class="pastilla pastilla-materia">${esc(estado.tema.dimension || 'sin definir')}</span>
        </div>
        <hr>
        <div>
          <div class="etiqueta">En este tema</div>
          <div class="ficha-cuenta"><span>Láminas para proyectar</span><b>${lista(estado.tema.laminas).length}</b></div>
          <div class="ficha-cuenta"><span>Actividades</span><b>${lista(estado.tema.actividades).length}</b></div>
        </div>
      </aside>
    </div>`;
};
