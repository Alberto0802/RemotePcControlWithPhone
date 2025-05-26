const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const robot = require('robotjs');
const sharp = require('sharp');
const fs = require('fs');

const app = express();
app.use(cors());
const FRAME_INTERVAL = 33; // ~30fps (1000ms/30)
const JPEG_QUALITY = 30;   // Reducida para mejor rendimiento
const MAX_WIDTH = 1280;    // Reducido para mejor rendimiento
const cursorImage = fs.readFileSync('./assets/cursor.png');
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Variables para monitoreo de FPS
let frameCount = 0;
let lastFpsUpdate = Date.now();
let currentFps = 0;

// Función para actualizar y mostrar FPS
const updateFps = () => {
  const now = Date.now();
  const elapsed = now - lastFpsUpdate;
  
  if (elapsed >= 1000) {
    currentFps = Math.round((frameCount * 1000) / elapsed);
    console.log(`FPS actual: ${currentFps}`);
    frameCount = 0;
    lastFpsUpdate = now;
  }
};

// Variables para evitar procesamiento concurrente
let processing = false;
let lastFrameTime = 0;
const MIN_FRAME_TIME = 1000 / 30;

// Cache para la imagen del cursor
const cursorSharp = sharp(cursorImage);
let cursorResized = null;

// Función para capturar pantalla con robotjs
const captureScreen = () => {
  const screenSize = robot.getScreenSize();
  const img = robot.screen.capture(0, 0, screenSize.width, screenSize.height);
  
  // Convertir el buffer de robotjs a un formato que sharp pueda procesar
  const buffer = Buffer.alloc(screenSize.width * screenSize.height * 4);
  let pos = 0;
  
  for (let y = 0; y < screenSize.height; y++) {
    for (let x = 0; x < screenSize.width; x++) {
      const idx = (y * screenSize.width + x) * 4;
      buffer[idx] = img.image[idx + 2];     // R
      buffer[idx + 1] = img.image[idx + 1]; // G
      buffer[idx + 2] = img.image[idx];     // B
      buffer[idx + 3] = 255;                // A
    }
  }
  
  return {
    buffer,
    width: screenSize.width,
    height: screenSize.height
  };
};

const captureAndEmit = async (socket) => {
  if (processing) return;
  
  const now = Date.now();
  if (now - lastFrameTime < MIN_FRAME_TIME) return;
  
  processing = true;
  try {
    const mouse = robot.getMousePos();
    const { buffer, width, height } = captureScreen();
    
    const scale = MAX_WIDTH / width;
    const newHeight = Math.round(height * scale);

    const resized = await sharp(buffer, {
      raw: {
        width: width,
        height: height,
        channels: 4
      }
    })
      .resize(MAX_WIDTH, newHeight, {
        fit: 'inside',
        withoutEnlargement: true,
        fastShrinkOnLoad: true
      })
      .composite([{ 
        input: cursorResized || cursorImage, 
        top: Math.round(mouse.y * scale) - 1, 
        left: Math.round(mouse.x * scale) 
      }])
      .jpeg({ 
        quality: JPEG_QUALITY,
        progressive: true,
        optimizeScans: true,
        chromaSubsampling: '4:2:0',
        mozjpeg: true
      })
      .toBuffer();

    if (socket.connected) {
      socket.volatile.emit('screen-data', { 
        image: resized.toString('base64'), 
        timestamp: now,
        fps: currentFps
      });
      lastFrameTime = now;
      frameCount++;
      updateFps();
    }
  } catch (err) {
    console.error('Error en captura:', err);
  } finally {
    processing = false;
  }
};

io.on('connection', (socket) => {
  console.log(`Cliente conectado: ${socket.id}`);
  let interval;

  socket.on('start-stream', () => {
    if (interval) clearInterval(interval);
    interval = setInterval(() => captureAndEmit(socket), FRAME_INTERVAL);
  });

  socket.on('stop-stream', () => clearInterval(interval));
  socket.on('disconnect', () => clearInterval(interval));

  socket.on('mouse-move', ({ dx, dy }) => {
    const pos = robot.getMousePos();
    robot.moveMouse(pos.x + dx, pos.y + dy);
  });

  socket.on('mouse-click', ({ button }) => {
    if (button === 'left' || button === 'right') robot.mouseClick(button);
  });

  socket.on('type-key', ({ key }) => {
    if (key === 'backspace') {
      robot.keyTap('backspace');
    } else if (typeof key === 'string' && key.length === 1) {
      const isUpper = key === key.toUpperCase() && key !== key.toLowerCase();
      if (isUpper) robot.keyTap(key.toLowerCase(), 'shift');
      else robot.keyTap(key);
    } else if (key === 'enter') {
      robot.keyTap('enter');
    }
  });
});

server.listen(3000, '0.0.0.0', () => console.log('Servidor corriendo en puerto 3000'));
