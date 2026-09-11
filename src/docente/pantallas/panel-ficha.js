'use strict';

window.Paneles = window.Paneles || {};

// Ficha del niño: todo lo que la app sabe de él, en un solo sitio.
//
// Existe porque marcar «necesita apoyo» tema tras tema no sirve de nada si
// después nadie puede ver la historia junta. Aquí el profesor ve cómo ha ido
// ese niño en todos los temas y le deja anotaciones.
//
// Dos formas de anotar, a propósito:
//  - PULSANDO una frase de datos/observaciones.json: rápido, sirve en mitad de
//    la clase con 25 niños encima y sin soltar el mouse.
//  - ESCRIBIENDO: para lo que no cabe en una frase hecha. Rompe la regla de
//    «solo mouse», y por eso vive aquí y no en nada que el niño toque: esta
//    pantalla es del profesor y nunca se proyecta.

const NOMBRE_ESTADO = {
  logrado: 'Logrado',
  'en-proceso': 'En proceso',
  'necesita-apoyo': 'Necesita apoyo',
};

window.Paneles.ficha = function (estado) {
  const esc = window.Util.esc;
  const lista = window.Util.lista;
  const ico = window.Iconos.svg;

  const grupo = estado.grupo;
  const alumno = grupo && grupo.estudiantes.find((e) => e.id === estado.ficha);
  if (!alumno) return window.Piezas.vacio('No se encontró ese estudiante.');

  const delGrupo = estado.registro[grupo.id] || { temas: {}, alumnos: {} };
  const notas = ((delGrupo.alumnos || {})[alumno.id] || {}).notas || [];

  // ------------------------------------------------------------ historial

  const historial = Object.entries(delGrupo.temas || {})
    .map(([ruta, entrada]) => ({ ruta, entrada, valor: (entrada.estados || {})[alumno.id] }))
    .filter((f) => f.valor)
    .sort((a, b) => String(b.entrada.fecha).localeCompare(String(a.entrada.fecha)));

  const cuenta = { logrado: 0, 'en-proceso': 0, 'necesita-apoyo': 0 };
  historial.forEach((f) => { cuenta[f.valor] += 1; });

  function datosDelTema(ruta) {
    for (const grado of estado.catalogo) {
      for (const materia of grado.materias) {
        const tema = materia.temas.find((t) => t.ruta === ruta);
        if (tema) return { titulo: tema.titulo, materia: materia.nombre, color: materia.color };
      }
    }
    return { titulo: ruta, materia: '', color: '#A9A399' };
  }

  const filasHistorial = historial.length
    ? historial
        .map((f) => {
          const tema = datosDelTema(f.ruta);
          return `<div class="ficha-fila">
            <span class="ficha-punto" style="background:${esc(tema.color)}"></span>
            <span class="ficha-fila-tema">
              <span class="ficha-fila-titulo">${esc(tema.titulo)}</span>
              <span class="ficha-fila-materia">${esc(tema.materia)} · ${esc(window.Util.fechaCorta(f.entrada.fecha))}</span>
            </span>
            <span class="pastilla-estado estado-${esc(f.valor)}">${esc(NOMBRE_ESTADO[f.valor] || f.valor)}</span>
          </div>`;
        })
        .join('')
    : '<div class="ficha-sin-nada">Todavía no hay temas marcados para este niño.</div>';

  // ---------------------------------------------------------- anotaciones

  const listaNotas = notas.length
    ? notas
        .slice()
        .reverse()
        .map(
          (nota) => `<div class="nota">
            <span class="nota-cuerpo">
              <span class="nota-texto">${esc(nota.texto)}</span>
              <span class="nota-fecha">${esc(window.Util.fechaCorta(nota.fecha))}${nota.manual ? ' · escrita' : ''}</span>
            </span>
            <button class="nota-quitar" data-nota-quitar="${esc(nota.id)}" title="Quitar">
              ${ico('mas', 22, 3)}
            </button>
          </div>`
        )
        .join('')
    : '<div class="ficha-sin-nada">Sin anotaciones todavía.</div>';

  const disponibles = lista(estado.observaciones)
    .map(
      (obs) => `<button class="etiqueta-obs etiqueta-${esc(obs.tono || 'conducta')}"
                        data-nota="${esc(obs.id)}">${esc(obs.texto)}</button>`
    )
    .join('');

  const borrador = estado.notaBorrador || '';

  return `
    <div class="ficha">
      <div class="ficha-encabezado">
        <button class="chip" data-ficha-cerrar="1">${ico('atras', 24)} Volver al registro</button>
        <div class="ficha-nombre">${esc(alumno.nombre)}</div>
        <div class="crece"></div>
        <div class="ficha-resumen">
          <span class="pastilla-estado estado-logrado">${cuenta.logrado} logrado</span>
          <span class="pastilla-estado estado-en-proceso">${cuenta['en-proceso']} en proceso</span>
          <span class="pastilla-estado estado-necesita-apoyo">${cuenta['necesita-apoyo']} con apoyo</span>
        </div>
      </div>

      <div class="ficha-cuerpo">
        <section class="ficha-columna">
          <h2 class="etiqueta">Cómo ha ido</h2>
          <div class="ficha-lista">${filasHistorial}</div>
        </section>

        <section class="ficha-columna">
          <h2 class="etiqueta">Anotaciones</h2>
          <div class="ficha-lista">${listaNotas}</div>
        </section>

        <section class="ficha-columna">
          <h2 class="etiqueta">Escribir una anotación</h2>
          <div class="escribir">
            <textarea class="escribir-campo" data-borrador="1" rows="3"
                      placeholder="Lo que no cabe en una frase hecha…"
                      maxlength="400">${esc(borrador)}</textarea>
            <button class="chip chip-fuerte" data-nota-escrita="1" ${borrador.trim() ? '' : 'disabled'}>
              ${ico('check', 22, 2.6)} Agregar
            </button>
          </div>

          <h2 class="etiqueta">O pulsar una frecuente</h2>
          <div class="etiquetas-obs">${disponibles}</div>
        </section>
      </div>
    </div>`;
};
