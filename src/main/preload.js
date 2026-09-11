'use strict';

const { contextBridge, ipcRenderer } = require('electron');

// Única superficie que las ventanas ven del sistema. Ningún render toca fs.
contextBridge.exposeInMainWorld('aula', {
  catalogo: () => ipcRenderer.invoke('catalogo'),
  tema: (ruta) => ipcRenderer.invoke('tema', ruta),
  grupos: () => ipcRenderer.invoke('grupos'),
  observaciones: () => ipcRenderer.invoke('observaciones'),

  leerRegistro: () => ipcRenderer.invoke('registro:leer'),
  guardarRegistro: (registro) => ipcRenderer.invoke('registro:guardar', registro),
  dondeSeGuarda: () => ipcRenderer.invoke('donde-se-guarda'),

  estadoPantallas: () => ipcRenderer.invoke('estado-pantallas'),
  alCambiarPantallas: (fn) => ipcRenderer.on('pantallas', (_e, datos) => fn(datos)),

  // Docente envía, Proyección escucha. Nunca al revés.
  proyectar: (mensaje) => ipcRenderer.send('proyectar', mensaje),
  alProyectar: (fn) => ipcRenderer.on('proyectar', (_e, mensaje) => fn(mensaje)),
});
