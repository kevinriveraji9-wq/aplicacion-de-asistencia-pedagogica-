'use strict';

window.Pantallas = window.Pantallas || {};

window.Pantallas.materias = function (estado) {
  const esc = window.Util.esc;
  const ico = window.Iconos.svg;
  const Piezas = window.Piezas;

  const grado = estado.grado;

  if (!grado.materias.length) {
    return (
      Piezas.cabecera(grado.nombre) +
      Piezas.vacio('Este grado todavía no tiene materias con contenido.')
    );
  }

  const tarjetas = grado.materias
    .map((materia) => {
      const temas = materia.temas.length;
      return `
        <button class="tarjeta-materia" data-materia="${esc(materia.id)}"
                style="--color:${esc(materia.color)};--tinte:${esc(materia.tinte)};--oscuro:${esc(materia.oscuro)}">
          <span class="tarjeta-materia-sello">${ico(materia.icono || 'guia', 32)}</span>
          <span class="tarjeta-materia-pie">
            <span class="tarjeta-materia-nombre">${esc(materia.nombre)}</span>
            <span class="tarjeta-materia-nota">${temas} tema${temas === 1 ? '' : 's'}</span>
          </span>
        </button>`;
    })
    .join('');

  const derecha = `<div class="cabecera-nota">${esc(grado.edades || '')}</div>`;

  return `
    ${Piezas.cabecera(grado.nombre, derecha)}
    <main class="centro centro-arriba">
      <h1 class="titulo">¿Qué materia?</h1>
      <div class="rejilla-materias">${tarjetas}</div>
    </main>`;
};
