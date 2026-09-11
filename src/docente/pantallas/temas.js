'use strict';

window.Pantallas = window.Pantallas || {};

window.Pantallas.temas = function (estado) {
  const esc = window.Util.esc;
  const ico = window.Iconos.svg;
  const Piezas = window.Piezas;

  const { grado, materia } = estado;
  const delGrupo =
    (estado.registro[estado.grupo && estado.grupo.id] || {}).temas || {};

  // Un tema está visto solo si tiene marcas de verdad. Una entrada vacía
  // —de un registro viejo, o de abrir el panel sin marcar— no cuenta.
  function visto(tema) {
    const entrada = delGrupo[tema.ruta];
    return entrada && Object.keys(entrada.estados || {}).length ? entrada : null;
  }

  // «Sigue este tema» es el primero sin registro: es lo que el profesor busca
  // al abrir la lista, y le ahorra recordar dónde quedó.
  const siguiente = materia.temas.find((t) => !visto(t));

  const filas = materia.temas
    .map((tema, i) => {
      const marcado = visto(tema);
      const esSiguiente = siguiente && siguiente.ruta === tema.ruta;

      let marca;
      if (esSiguiente) {
        marca = '<span class="marca-tema marca-siguiente">Sigue este tema</span>';
      } else if (marcado) {
        marca = `<span class="marca-tema marca-visto">
          <span class="punto"></span> Visto ${esc(window.Util.fechaCorta(marcado.fecha))}
        </span>`;
      } else {
        marca = '<span class="marca-tema marca-sinver"><span class="punto"></span> Sin ver</span>';
      }

      return `
        <button class="fila-tema ${esSiguiente ? 'fila-tema-siguiente' : ''}" data-tema="${esc(tema.ruta)}">
          <span class="numero-tema ${marcado || esSiguiente ? '' : 'numero-apagado'}">${i + 1}</span>
          <span class="fila-tema-titulo">${esc(tema.titulo)}</span>
          <span class="fila-tema-nota">${tema.duracionMin ? `${tema.duracionMin} min` : ''}</span>
          ${marca}
        </button>`;
    })
    .join('');

  const derecha = `
    <div class="pastilla" style="background:var(--materia-tinte);color:var(--materia-oscuro)">
      ${ico(materia.icono || 'guia', 20)} ${esc(materia.nombre)}
    </div>`;

  return `
    ${Piezas.cabecera(`${grado.nombre} · ${materia.nombre}`, derecha)}
    <main class="centro centro-arriba">
      <h1 class="titulo">Elige el tema de hoy</h1>
      <div class="lista-temas">${filas}</div>
    </main>`;
};
