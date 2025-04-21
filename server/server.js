const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
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

const db = new sqlite3.Database('./devices.db', (err) => {
  if (err) {
    console.error('Error al abrir la base de datos:', err);
  } else {
    console.log('Conectado a la base de datos SQLite.');

    db.run(`CREATE TABLE IF NOT EXISTS devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip TEXT NOT NULL,
      name TEXT NOT NULL
    )`);
  }
});

io.on('connection', (socket) => {
  const clientIp = socket.handshake.address;
  console.log(`📲 Dispositivo conectado desde: ${clientIp}`);

  socket.on('registerIp', ({ ip, name }) => {
    if (!ip || !name) return console.warn('❗ IP o name no recibidos');

    db.all('SELECT * FROM devices WHERE ip = ?', [ip], (err, rows) => {
      if (err) return console.error('DB Error:', err);

      if (rows.length < 5) {
        db.run('INSERT INTO devices (ip, name) VALUES (?, ?)', [ip, name], (err) => {
          if (err) console.error('Insert error:', err);
          else console.log(`✅ Dispositivo agregado: ${name} (${ip})`);
        });
      } else {
        console.log(`❌ Límite alcanzado de dispositivos para ${ip}`);
      }
    });
  });
  
  socket.emit('connected', { message: 'Conexión establecida con el servidor' });

  socket.on('getDevices', () => {
    db.all('SELECT * FROM devices', (err, rows) => {
      if (!err) {
        socket.emit('deviceList', rows);
      } else {
        console.error('Error al obtener dispositivos:', err);
      }
    });
  });

  socket.on('renameDevice', ({ id, newName }) => {
    db.run('UPDATE devices SET name = ? WHERE id = ?', [newName, id], (err) => {
      if (err) console.error('Error renombrando:', err);
      else console.log(`✏️ Dispositivo ${id} renombrado a "${newName}"`);
    });
  });

  socket.on('deleteDevice', (id) => {
    db.run('DELETE FROM devices WHERE id = ?', [id], (err) => {
      if (err) console.error('Error eliminando dispositivo:', err);
      else {
        console.log(`🗑️ Dispositivo ${id} eliminado`);
        io.emit('deviceDeleted', id);
      }
    });
  });

});

server.listen(3000, '0.0.0.0', () => {
  console.log('🚀 Servidor escuchando en el puerto 3000');
});
