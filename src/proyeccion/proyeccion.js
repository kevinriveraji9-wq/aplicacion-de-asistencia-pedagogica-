'use strict';

// Ventana del video beam. Es una pantalla tonta a propósito: recibe qué
// dibujar y lo dibuja. No guarda estado, no pregunta nada, no escribe nada.
//
// Aquí NO existe código capaz de renderizar la Guía ni el Registro. Esa
// ausencia es la garantía de que los nombres de los niños y sus estados de
// aprendizaje no se proyectan frente al salón, ni siquiera por un error de
// estado en la otra ventana.

(function () {
  const escenario = document.getElementById('escenario');

  function reposo() {
    escenario.innerHTML = `
      <div class="reposo">
        <svg viewBox="0 0 24 24" width="120" height="120" class="ic" style="stroke-width:1.4">
          <path d="M12 7c-2-1.6-4.4-2.2-7-2v11c2.6-.2 5 .4 7 2"/>
          <path d="M12 7c2-1.6 4.4-2.2 7-2v11c-2.6-.2-5 .4-7 2"/>
          <path d="M12 7v11"/>
        </svg>
      </div>`;
  }

  function mostrarLamina(mensaje) {
    escenario.innerHTML = window.Laminas.dibujar(mensaje.lamina, mensaje.rutaBase, 140);
  }

  function mostrarActividad(mensaje) {
    const tipo = window.Actividades[mensaje.actividad && mensaje.actividad.tipo];
    if (!tipo) {
      escenario.innerHTML = '<div class="reposo"></div>';
      return;
    }
    escenario.innerHTML = tipo.html(mensaje.actividad, mensaje.estado, { grande: true });
  }

  // El color de la materia llega en el mensaje: esta ventana no conoce el
  // catálogo, solo pinta lo que le mandan.
  function aplicarColor(materia) {
    const css = document.documentElement.style;
    if (!materia) return;
    css.setProperty('--materia', materia.color);
    css.setProperty('--materia-tinte', materia.tinte);
    css.setProperty('--materia-oscuro', materia.oscuro);
  }

  window.aula.alProyectar((mensaje) => {
    if (!mensaje || mensaje.tipo === 'limpiar') return reposo();
    aplicarColor(mensaje.materia);
    if (mensaje.tipo === 'lamina') return mostrarLamina(mensaje);
    if (mensaje.tipo === 'actividad') return mostrarActividad(mensaje);
    reposo();
  });

  reposo();
})();
