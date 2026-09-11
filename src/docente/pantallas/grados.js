'use strict';

window.Pantallas = window.Pantallas || {};

window.Pantallas.grados = function (estado) {
  const esc = window.Util.esc;
  const ico = window.Iconos.svg;

  const tarjetas = estado.catalogo
    .map((grado, i) => {
      const materias = grado.materias.length;
      return `
        <button class="tarjeta-grado" data-grado="${esc(grado.id)}">
          <span class="medalla medalla-${i + 1}">${esc(grado.numero || i + 1)}</span>
          <span class="tarjeta-grado-nombre">${esc(grado.nombre)}</span>
          <span class="tarjeta-grado-nota">
            ${esc(grado.edades || '')}${materias ? ` · ${materias} materia${materias === 1 ? '' : 's'}` : ''}
          </span>
        </button>`;
    })
    .join('');

  return `
    <header class="cabecera cabecera-inicio">
      <div class="marca">
        <span class="marca-sello">${ico('guia', 26)}</span>
        <span class="marca-nombre">AULA</span>
      </div>
      <div class="crece"></div>
      <button class="chip chip-suave" data-ir="configuracion">${ico('config', 23)} Configuración</button>
    </header>

    <main class="centro">
      <h1 class="titulo-grande">¿Con qué grupo vamos a trabajar?</h1>
      <p class="subtitulo">Elige el grado para ver sus materias</p>
      <div class="fila-grados">${tarjetas}</div>
    </main>`;
};
