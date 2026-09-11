'use strict';

// Piezas que se repiten en varias pantallas. Están aquí y no copiadas en cada
// una para que «Atrás» e «Inicio» midan siempre lo mismo y estén siempre en el
// mismo sitio: el profesor está de pie frente a 25 niños y no puede ponerse a
// buscar cómo salir de una pantalla.

window.Piezas = (function () {
  const esc = window.Util.esc;
  const ico = window.Iconos.svg;

  function navegacion() {
    return `
      <button class="chip" data-ir="atras">${ico('atras', 24)} Atrás</button>
      <button class="chip" data-ir="inicio">${ico('inicio', 24)} Inicio</button>`;
  }

  function separador() {
    return '<div class="separador"></div>';
  }

  // Cabecera de las pantallas de navegación.
  function cabecera(titulo, derecha) {
    return `
      <header class="cabecera">
        ${navegacion()}
        ${separador()}
        <div class="cabecera-titulo">${esc(titulo)}</div>
        <div class="crece"></div>
        ${derecha || ''}
      </header>`;
  }

  // Cabecera de la Sala de clase: lleva la miga de pan y el tema.
  function cabeceraTema(estado) {
    const { grado, materia, tema } = estado;
    const total = materia.temas.length;
    const posicion = materia.temas.findIndex((t) => t.ruta === tema.ruta) + 1;

    return `
      <header class="cabecera">
        ${navegacion()}
        ${separador()}
        <div class="cabecera-tema">
          <div class="etiqueta">${esc(grado.nombre)} · ${esc(materia.nombre)}</div>
          <div class="cabecera-titulo">${esc(tema.titulo)}</div>
        </div>
        <div class="crece"></div>
        ${avisoPantalla(estado)}
        <div class="cabecera-nota">Tema ${posicion} de ${total}</div>
      </header>`;
  }

  // El profesor tiene que saber, sin preguntarse, si el video beam está vivo.
  function avisoPantalla(estado) {
    if (estado.hayProyeccion) {
      return `<div class="pastilla pastilla-ok">${ico('proyectar', 20)} Proyectando</div>`;
    }
    return `<div class="pastilla pastilla-aviso">${ico('alerta', 20)} Sin segunda pantalla</div>`;
  }

  const PANELES = [
    { id: 'proyectar', nombre: 'Proyectar', icono: 'proyectar' },
    { id: 'actividad', nombre: 'Actividad', icono: 'actividad' },
    { id: 'guia', nombre: 'Guía', icono: 'guia' },
    { id: 'registro', nombre: 'Registro', icono: 'registro' },
  ];

  function pestanas(activo) {
    const botones = PANELES.map((panel, i) => {
      const clases = ['pestana'];
      if (panel.id === activo) clases.push('pestana-activa');
      if (i < PANELES.length - 1) clases.push('con-separador');
      return `<button class="${clases.join(' ')}" data-panel="${panel.id}">
        ${ico(panel.icono, 28)} ${panel.nombre}
      </button>`;
    }).join('');

    return `<nav class="pestanas">${botones}</nav>`;
  }

  function vacio(mensaje) {
    return `<div class="vacio">${esc(mensaje)}</div>`;
  }

  return { navegacion, cabecera, cabeceraTema, pestanas, vacio, PANELES };
})();
