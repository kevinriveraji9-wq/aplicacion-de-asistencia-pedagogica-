'use strict';

window.Paneles = window.Paneles || {};

// Control de lo que se ve en el video beam. Esta ventana muestra una vista
// previa pequeña; la lámina en grande vive en la otra pantalla.
window.Paneles.proyectar = function (estado) {
  const esc = window.Util.esc;
  const ico = window.Iconos.svg;
  const laminas = window.Util.lista(estado.tema.laminas);

  if (!laminas.length) {
    return window.Piezas.vacio('Este tema no tiene láminas para proyectar.');
  }

  const indice = Math.min(estado.lamina, laminas.length - 1);
  const enLaUltima = indice === laminas.length - 1;
  const hayActividades = window.Util.lista(estado.tema.actividades).length > 0;

  const tiras = laminas
    .map((lamina, i) => {
      const etiqueta = lamina.tipo === 'imagen' ? lamina.pie || 'Imagen'
        : lamina.tipo === 'texto' ? lamina.texto
        : lamina.palabra || lamina.numero;
      return `<button class="tira ${i === indice ? 'tira-activa' : ''}" data-lamina="${i}">
        <span class="tira-numero">${i + 1}</span>
        <span class="tira-texto">${esc(etiqueta)}</span>
      </button>`;
    })
    .join('');

  return `
    <div class="proyectar">
      <div class="previa">
        <div class="previa-marco">
          ${window.Laminas.dibujar(laminas[indice], estado.tema.rutaBase, 54)}
        </div>
        <div class="previa-nota">
          ${estado.hayProyeccion
            ? 'Así se ve ahora en el video beam'
            : 'Vista previa — no hay segunda pantalla conectada'}
        </div>
      </div>

      <div class="tiras">${tiras}</div>

      <div class="mando">
        <button class="mando-flecha" data-lamina-mover="-1" ${indice === 0 ? 'disabled' : ''}>
          ${ico('atras', 42, 2.6)}
        </button>
        <div class="mando-cuenta">Lámina ${indice + 1} de ${laminas.length}</div>
        ${enLaUltima && hayActividades
          ? `<button class="mando-siguiente" data-panel="actividad">
               ${ico('actividad', 32)} Ir a la actividad
             </button>`
          : `<button class="mando-flecha mando-flecha-fuerte" data-lamina-mover="1"
                     ${enLaUltima ? 'disabled' : ''}>
               ${ico('adelante', 42, 2.6)}
             </button>`}
      </div>
    </div>`;
};
