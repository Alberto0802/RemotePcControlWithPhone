const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const screenshot = require('screenshot-desktop');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const captureAndEmit = async (socket) => {
  try {
    const img = await screenshot({
      format: 'jpeg',
    });
    
    if (socket.connected) {
      socket.volatile.emit('screen-data', {
        image: img.toString('base64'),
        timestamp: Date.now()
      });
    }
  } catch (err) {
    console.error('Capture error:', err);
  }
};

io.on('connection', (socket) => {
  const clientIp = socket.handshake.address;
  console.log(`📲 Dispositivo conectado desde: ${clientIp}`);

  socket.on('registerIp', ({ ip, name }) => {
    if (!ip || !name) return console.warn('❗ IP o name no recibidos');
    return console.log(`Dispositivo agregado nombre: ${name}`)
  });
  
  socket.emit('connected', { message: 'Conexión establecida con el servidor' });

  let streamingInterval;

  socket.on('start-stream', () => {
    console.log('Iniciando streaming');
    streamingInterval = setInterval(() => captureAndEmit(socket), 50); // 10 FPS
  });

  socket.on('stop-stream', () => {
    console.log('Stop streaming');
    clearInterval(streamingInterval);
  });

  socket.on('disconnect', () => {
    clearInterval(streamingInterval);
    console.log(`Cliente desconectado: ${socket.id}`);
  });

});

server.listen(3000, '0.0.0.0', () => {
  console.log('🚀 Servidor escuchando en el puerto 3000');
});
