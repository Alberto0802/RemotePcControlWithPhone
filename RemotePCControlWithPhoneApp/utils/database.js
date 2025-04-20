// utils/database.js
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('devices.db');

export const initDB = () => {
  return new Promise((resolve, reject) => {
    db.isInTransactionSync(tx => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS devices (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ip TEXT NOT NULL,
          name TEXT NOT NULL
        );`,
        [],
        () => resolve(),
        (_, error) => reject(error)
      );
    });
  });
};

export const insertDevice = (ip) => {
  return new Promise((resolve, reject) => {
    fetchDevices().then(devices => {
      if (devices.length >= 5) {
        reject(new Error('Has alcanzado el límite de 5 dispositivos.'));
        return;
      }

      db.isInTransactionSync(tx => {
        tx.executeSql(
          'INSERT INTO devices (ip) VALUES (?);',
          [ip],
          (_, result) => resolve(result),
          (_, error) => reject(error)
        );
      });
    });
  });
};

export const fetchDevices = () => {
  return new Promise((resolve, reject) => {
    db.isInTransactionSync(tx => {
      tx.executeSql(
        'SELECT * FROM devices;',
        [],
        (_, result) => resolve(result.rows._array),
        (_, error) => reject(error)
      );
    });
  });
};

export const deleteDevice = (id) => {
  return new Promise((resolve, reject) => {
    db.isInTransactionSync(tx => {
      tx.executeSql(
        'DELETE FROM devices WHERE id = ?;',
        [id],
        (_, result) => resolve(result),
        (_, error) => reject(error)
      );
    });
  });
};
