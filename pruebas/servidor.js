'use strict';

// Servidor estático mínimo para mirar la vista previa en un navegador.
// Solo herramienta de desarrollo: la app real no sirve nada por red.
//
//   npm run vista    → genera la vista previa y la sirve en :4321

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.join(__dirname, '..');
const PUERTO = 4321;

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.mp3': 'audio/mpeg',
};

http
  .createServer((peticion, respuesta) => {
    const relativa = decodeURIComponent(peticion.url.split('?')[0]).replace(/^\/+/, '');
    const destino = path.join(RAIZ, relativa);

    // Nada fuera de la carpeta del proyecto.
    if (!destino.startsWith(RAIZ)) {
      respuesta.writeHead(403).end('fuera de la raíz');
      return;
    }

    fs.readFile(destino, (error, contenido) => {
      if (error) {
        respuesta.writeHead(404).end('no está');
        return;
      }
      respuesta.writeHead(200, { 'Content-Type': TIPOS[path.extname(destino)] || 'application/octet-stream' });
      respuesta.end(contenido);
    });
  })
  .listen(PUERTO, () => {
    console.log(`vista previa en http://localhost:${PUERTO}/pruebas/vista-previa.html`);
  });
