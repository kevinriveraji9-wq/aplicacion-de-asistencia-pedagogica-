'use strict';

window.Pantallas = window.Pantallas || {};

// Sala de clase: la cabecera y las pestañas son fijas, y debajo va el panel
// activo. Los cuatro paneles son del mismo tema; el profesor no sale de él.
window.Pantallas.sala = function (estado) {
  const Piezas = window.Piezas;

  // La ficha de un niño no pertenece a ningún tema: se abre desde el Registro
  // y ocupa la pantalla entera, sin pestañas, para que quede claro que es otra
  // cosa y que se sale por donde se entró.
  if (estado.ficha) {
    return `
      ${Piezas.cabeceraTema(estado)}
      <main class="panel panel-ficha">${window.Paneles.ficha(estado)}</main>`;
  }

  const panel = window.Paneles[estado.panel] || window.Paneles.guia;

  return `
    ${Piezas.cabeceraTema(estado)}
    ${Piezas.pestanas(estado.panel)}
    <main class="panel panel-${estado.panel}">${panel(estado)}</main>`;
};
