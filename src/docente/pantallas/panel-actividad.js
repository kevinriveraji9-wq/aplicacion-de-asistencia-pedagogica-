'use strict';

window.Paneles = window.Paneles || {};

// El niño pasa al computador y usa el mouse aquí; el salón mira el video beam.
// Por eso la actividad es interactiva en esta ventana y se espeja en la otra.
window.Paneles.actividad = function (estado) {
  const esc = window.Util.esc;
  const ico = window.Iconos.svg;
  const actividades = window.Util.lista(estado.tema.actividades);

  if (!actividades.length) {
    return window.Piezas.vacio('Este tema no tiene actividades todavía.');
  }

  const indice = Math.min(estado.actividad, actividades.length - 1);
  const config = actividades[indice];
  const tipo = window.Actividades[config.tipo];

  if (!tipo) {
    return window.Piezas.vacio(`Tipo de actividad no implementado: ${config.tipo}`);
  }

  const cuerpo = tipo.html(config, estado.estadoActividad, { grande: false });
  const terminada = tipo.terminada ? tipo.terminada(estado.estadoActividad, config) : false;
  const hayMas = indice < actividades.length - 1;

  // La cara y los botones de «qué sigue» comparten fila: en esta ventana el
  // alto es escaso, y de todos modos se leen juntos («¡Muy bien! → seguir»).
  const cara = tipo.reaccion ? tipo.reaccion(estado.estadoActividad, config) : null;

  // Acertar no puede dejar al profesor mirando una pantalla bloqueada sin
  // saber qué sigue. Al terminar, la app dice a dónde ir: a la siguiente
  // actividad, o al Registro si esta era la última.
  const siguientePaso = terminada
    ? `<div class="siguiente-paso">
        <button class="paso" data-actividad-reiniciar="1">Repetir</button>
        ${hayMas
          ? `<button class="paso paso-fuerte" data-actividad-mover="1">
               Siguiente actividad ${ico('adelante', 30, 2.6)}
             </button>`
          : `<button class="paso paso-fuerte" data-panel="registro">
               ${ico('registro', 30)} Pasar al Registro
             </button>`}
      </div>`
    : '';

  return `
    <div class="actividad-marco">
      <div class="actividad-columna">
        ${cuerpo}
        <div class="cierre">
          ${window.Caras.reaccion(cara && cara.cara, cara && cara.texto, 76)}
          ${siguientePaso}
        </div>
      </div>
    </div>

    <footer class="tira-docente">
      <span class="tira-docente-fuerte">Actividad ${indice + 1} de ${actividades.length}</span>
      <span class="tira-docente-sep">·</span>
      <span class="tira-docente-tenue">${esc(tipo.nombre)}</span>
      <div class="crece"></div>
      <button class="chip" data-actividad-reiniciar="1">Repetir</button>
      <button class="chip ${terminada && hayMas ? 'chip-fuerte' : ''}" data-actividad-mover="1"
              ${hayMas ? '' : 'disabled'}>
        Siguiente actividad ${ico('adelante', 21)}
      </button>
    </footer>`;
};
