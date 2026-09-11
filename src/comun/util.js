'use strict';

// Utilidades mínimas compartidas por las dos ventanas.
window.Util = (function () {
  // Todo el contenido sale de archivos JSON que edita gente que no programa.
  // Nada de eso entra al DOM sin pasar por aquí.
  function esc(valor) {
    return String(valor == null ? '' : valor)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function lista(valor) {
    return Array.isArray(valor) ? valor : [];
  }

  function hoy() {
    return new Date().toISOString().slice(0, 10);
  }

  function fechaCorta(iso) {
    if (!iso) return '';
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const [anio, mes, dia] = iso.split('-').map(Number);
    if (!anio || !mes || !dia) return '';
    return `${dia} ${meses[mes - 1]}`;
  }

  return { esc, lista, hoy, fechaCorta };
})();
