import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('servers.db');
console.log("📂 Base de datos abierta:", db);

// ✅ Crear tabla
export const init = () => {
  return new Promise(async (resolve, reject) => {
    try {
      await db.withTransactionAsync(async () => {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS servers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            ip TEXT NOT NULL
          );
        `);
      });
      console.log("✅ Tabla creada");
      resolve();
    } catch (error) {
      console.log("❌ Error creando tabla:", error);
      reject(error);
    }
  });
};

// ✅ Insertar servidor
export const insertServer = (name, ip) => {
  return new Promise(async (resolve, reject) => {
    try {
      await db.withTransactionAsync(async () => {
        await db.runAsync(
          `INSERT INTO servers (name, ip) VALUES (?, ?);`,
          [name, ip]
        );
      });
      console.log("✅ Servidor insertado");
      resolve();
    } catch (error) {
      console.log("❌ Error al insertar:", error);
      reject(error);
    }
  });
};

// ✅ Obtener servidores
export const fetchServers = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const servers = await db.getAllAsync(`SELECT * FROM servers;`);
      console.log("✅ Servidores obtenidos:", servers);
      resolve(servers);
    } catch (error) {
      console.log("❌ Error al obtener servidores:", error);
      reject(error);
    }
  });
};

// ✅ Eliminar servidor
export const deleteServer = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      await db.withTransactionAsync(async () => {
        await db.runAsync(
          `DELETE FROM servers WHERE id = ?;`,
          [id]
        );
      });
      console.log("🗑️ Servidor eliminado:", id);
      resolve();
    } catch (error) {
      console.log("❌ Error al eliminar:", error);
      reject(error);
    }
  });
};

export const updateServer = (id, newName) => {
  return new Promise(async (resolve, reject) => {
    try {
      await db.withTransactionAsync(async () => {
        await db.runAsync(
          `UPDATE servers SET name = ? WHERE id = ?;`,
          [newName, id]
        );
      });
      console.log("✏️ Servidor renombrado");
      resolve();
    } catch (error) {
      console.log("❌ Error al renombrar servidor:", error);
      reject(error);
    }
  });
};
