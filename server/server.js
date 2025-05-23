const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const robot = require('robotjs');
const sharp = require('sharp');
const fs = require('fs');
const screenshot = require('screenshot-desktop');

const app = express();
app.use(cors());
const FRAME_INTERVAL = 1; // 30fps
const JPEG_QUALITY = 100;   // calidad mejor
const cursorImage = fs.readFileSync('./assets/cursor.png');
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Variables para evitar procesamiento concurrente
let processing = false;

const captureAndEmit = async (socket) => {
  if (processing) return;
  processing = true;
  try {
    const mouse = robot.getMousePos();
    const imgBuffer = await screenshot({ format: 'png' });
    const metadata = await sharp(imgBuffer).metadata();

    const maxWidth = 960;
    const scale = maxWidth / metadata.width;
    const newHeight = Math.round(metadata.height * scale);

    const resized = await sharp(imgBuffer)
      .resize(maxWidth, newHeight)
      .composite([{ input: cursorImage, top: Math.round(mouse.y * scale) - 1, left: Math.round(mouse.x * scale) }])
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer();

    if (socket.connected) {
      socket.volatile.emit('screen-data', { image: resized.toString('base64'), timestamp: Date.now() });
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
