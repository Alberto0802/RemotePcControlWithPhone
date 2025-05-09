const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  const clientIp = socket.handshake.address;
  console.log(`📲 Dispositivo conectado desde: ${clientIp}`);

  socket.on('registerIp', ({ ip, name }) => {
    if (!ip || !name) return console.warn('❗ IP o name no recibidos');
    return console.log(`Dispositivo agregado nombre: ${name}`)
  });
  
  socket.emit('connected', { message: 'Conexión establecida con el servidor' });

});

server.listen(3000, '0.0.0.0', () => {
  console.log('🚀 Servidor escuchando en el puerto 3000');
});
