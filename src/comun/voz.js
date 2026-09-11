'use strict';

// Lee en voz alta. Es la pieza que hace que la app sirva a un niño que
// todavía no lee: la pregunta y la instrucción se oyen, no se leen.
//
// Usa la voz que ya trae Windows (SAPI), así que funciona sin internet y sin
// grabar nada. No es la voz de la profesora —una grabación de verdad siempre
// será mejor— pero está disponible hoy y no cuesta producción.
//
// Cuando haya grabaciones, un tema podrá traer { "audio": "audio/x.mp3" } y
// eso tendrá prioridad: ver reproducir().

window.Voz = (function () {
  const sintesis = window.speechSynthesis || null;
  let voces = [];

  function cargarVoces() {
    if (!sintesis) return;
    voces = sintesis.getVoices() || [];
  }

  if (sintesis) {
    cargarVoces();
    // En Chromium la lista llega tarde la primera vez.
    sintesis.addEventListener('voiceschanged', cargarVoces);
  }

  function vozEspanol() {
    if (!voces.length) cargarVoces();
    return voces.find((v) => v.lang && v.lang.toLowerCase().startsWith('es')) || null;
  }

  function disponible() {
    return Boolean(sintesis && vozEspanol());
  }

  function decir(texto) {
    const frase = String(texto || '').trim();
    if (!sintesis || !frase) return false;

    const voz = vozEspanol();
    if (!voz) return false;

    sintesis.cancel();
    const dicho = new window.SpeechSynthesisUtterance(frase);
    dicho.voice = voz;
    dicho.lang = voz.lang;
    dicho.rate = 0.85; // más lento: son niños de cuatro años
    dicho.pitch = 1.05;
    sintesis.speak(dicho);
    return true;
  }

  function callar() {
    if (sintesis) sintesis.cancel();
  }

  // Punto único de reproducción: si el tema trae una grabación se usa esa, y
  // si no, se sintetiza. Así el contenido puede ir mejorando sin tocar código.
  function reproducir(texto, archivo, rutaBase) {
    if (archivo && rutaBase) {
      const audio = new window.Audio(`${rutaBase}/${String(archivo).replace(/^\/+/, '')}`);
      audio.play().catch(() => decir(texto));
      return true;
    }
    return decir(texto);
  }

  // Botón de altavoz. `texto` es lo que se lee; se guarda en el atributo para
  // que el router lo lea sin tener que saber de actividades.
  function boton(texto, grande) {
    const seguro = window.Util.esc(texto || '');
    return `<button class="altavoz ${grande ? 'altavoz-grande' : ''}"
                    data-hablar="${seguro}" title="Escuchar">
      <svg viewBox="0 0 24 24" width="${grande ? 52 : 44}" height="${grande ? 52 : 44}"
           class="ic" style="stroke-width:2.2" aria-hidden="true">
        <path d="M4 9.5h3.5L12.5 5v14l-5-4.5H4z"/>
        <path d="M16.5 9.5c1.4 1.4 1.4 3.6 0 5"/>
        <path d="M19 7c2.7 2.7 2.7 7.3 0 10"/>
      </svg>
    </button>`;
  }

  return { disponible, decir, callar, reproducir, boton };
})();
