'use strict';

window.Paneles = window.Paneles || {};

const ESTADOS_REGISTRO = [
  { id: 'logrado', nombre: 'Logrado', icono: 'check' },
  { id: 'en-proceso', nombre: 'En proceso', icono: 'menos' },
  { id: 'necesita-apoyo', nombre: 'Necesita apoyo', icono: 'mas' },
];

// Este panel lleva nombre y apellido de cada niño y su estado de aprendizaje.
// Nunca se proyecta: la ventana de Proyección no tiene código para dibujarlo.
window.Paneles.registro = function (estado) {
  const esc = window.Util.esc;
  const ico = window.Iconos.svg;

  const grupo = estado.grupo;
  if (!grupo || !grupo.estudiantes.length) {
    return window.Piezas.vacio(
      'No hay un grupo cargado para este grado. Revisa datos/grupos.json.'
    );
  }

  const delGrupo = estado.registro[grupo.id] || { temas: {}, alumnos: {} };
  const entrada = (delGrupo.temas || {})[estado.tema.ruta] || { estados: {} };
  const marcados = grupo.estudiantes.filter((e) => entrada.estados[e.id]).length;

  function cuantasNotas(alumnoId) {
    return (((delGrupo.alumnos || {})[alumnoId] || {}).notas || []).length;
  }

  const leyenda = ESTADOS_REGISTRO
    .map(
      (e) => `<span class="leyenda leyenda-${e.id}">
        <span class="leyenda-sello">${ico(e.icono, 16, 3.4)}</span> ${esc(e.nombre)}
      </span>`
    )
    .join('');

  const filas = grupo.estudiantes
    .map((alumno) => {
      const actual = entrada.estados[alumno.id];
      const botones = ESTADOS_REGISTRO
        .map(
          (e) => `<button class="marca ${actual === e.id ? `marca-${e.id}` : ''}"
                          data-marcar="${esc(alumno.id)}" data-valor="${e.id}"
                          title="${esc(e.nombre)}">${ico(e.icono, 24, 3)}</button>`
        )
        .join('');

      const notas = cuantasNotas(alumno.id);

      // El nombre abre la ficha del niño. Es la puerta a su historia: sin
      // ella, marcar «necesita apoyo» clase tras clase no lleva a ninguna parte.
      return `<div class="fila-alumno">
        <button class="fila-alumno-nombre" data-ficha="${esc(alumno.id)}">
          ${esc(alumno.nombre)}
          ${notas ? `<span class="senal-notas">${notas}</span>` : ''}
        </button>
        ${botones}
      </div>`;
    })
    .join('');

  // Con una sola pantalla esta información queda proyectada frente al salón.
  const aviso = estado.hayProyeccion
    ? ''
    : `<div class="aviso-privacidad">
        ${ico('alerta', 24)}
        <span>No hay segunda pantalla. Si estás proyectando esta ventana, el salón está
        viendo los nombres y el estado de cada niño.</span>
      </div>`;

  return `
    <div class="registro">
      ${aviso}
      <div class="registro-encabezado">
        <h1 class="titulo-medio">¿Cómo le fue a cada niño?</h1>
        <div class="crece"></div>
        <span class="registro-cuenta">${marcados} de ${grupo.estudiantes.length} marcados</span>
        <button class="chip chip-fuerte" data-registro-guardar="1">
          ${ico('check', 22, 2.6)} Guardar
        </button>
      </div>
      <div class="registro-leyenda">${leyenda}</div>
      <div class="registro-rejilla">${filas}</div>
      ${marcados === grupo.estudiantes.length
        ? `<div class="siguiente-paso">
             <button class="paso paso-fuerte" data-ir="atras">
               ${ico('check', 30, 2.6)} Terminar y volver a los temas
             </button>
           </div>`
        : ''}
    </div>`;
};
