import React, { useEffect, useState, useContext } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { fetchDevices } from '../utils/database';
import ConnectionScreen from './ConnectionScreen';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { io } from 'socket.io-client';
import DeviceItem from './DeviceItem';

const HomePage = ({ onConnect, socket }) => {
  const [devices, setDevices] = useState([]);
  const [showConnectionScreen, setShowConnectionScreen] = useState(false);

  const refreshDevices = () => {
    if (socket) {
      socket.emit('getDevices');
    }
  };

  useFocusEffect(
    useCallback(() => {
      refreshDevices();
    }, [])
  );

  useEffect(() => {
    if (!socket) return;
  
    const requestDevices = () => {
      console.log('📡 Emitiendo getDevices');
      socket.emit('getDevices');
    };
  
    const onConnect = () => {
      console.log('✅ Socket conectado, pidiendo dispositivos');
      requestDevices();
    };
  
    const handleDeviceList = (data) => {
      console.log('📥 Lista de dispositivos recibida:', data);
      setDevices(data);
    };
  
    const handleDeviceChange = () => {
      console.log('🔁 Dispositivo cambiado, refrescando');
      requestDevices();
    };
  
    if (socket.connected) {
      requestDevices();
    } else {
      socket.on('connect', onConnect);
    }
  
    socket.on('deviceList', handleDeviceList);
    socket.on('deviceDeleted', handleDeviceChange);
    socket.on('deviceRenamed', handleDeviceChange);
  
    return () => {
      socket.off('connect', onConnect);
      socket.off('deviceList', handleDeviceList);
      socket.off('deviceDeleted', handleDeviceChange);
      socket.off('deviceRenamed', handleDeviceChange);
    };
  }, [socket]);
  
  

  const handleConnect = (ip) => {
    if (!ip) {
      Alert.alert('IP inválida');
      return;
    }

    const socket = io(`http://${ip}:3000`, {
      transports: ['websocket'],
      reconnection: false,
    });
  
    socket.on('connect', () => {
      console.log('✅ Conectado a', ip);
      socket.emit('registerIp', ip);
      onConnect(socket);
    });
  
    socket.on('connect_error', (err) => {
      console.log('❌ Error de conexión:', err.message);
      Alert.alert('Error', 'No se pudo conectar al servidor.');
    });
  };  

  const handleDeleteDevice = (id) => {
    Alert.alert('Confirmación', '¿Estás seguro de que quieres eliminar este dispositivo?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', onPress: () => {
        socket.emit('deleteDevice', id); 
      }},
    ]);
  };

  const handleRenameDevice = (id, newName) => {
    socket.emit('renameDevice', { id, newName });  
  };
  

  if (showConnectionScreen) {
    return <ConnectionScreen onConnect={(socketOrNull) => {
        setShowConnectionScreen(false);
        if (socketOrNull) {
          fetchDevices();
          onConnect(socketOrNull);
        }
      }} />
  }
  console.log('🔌 socket:', socket?.ip);
console.log(devices);
  return (
    <View style={styles.container}>
      {devices.length === 0 ? (
        <TouchableOpacity onPress={() => setShowConnectionScreen(true)}>
          <Image source={require('../assets/homepageImage.png')} style={styles.image} />
          <Text style={styles.imageText}>No tienes ningún dispositivo guardado</Text>
        </TouchableOpacity>
      ) : (
        <>
          <Text style={styles.title}>Tus dispositivos guardados</Text>
          <Text style={styles.numberOfDevices}>( {devices.length} / 5 )</Text>
          <FlatList
            data={devices}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <DeviceItem
                device={item}
                onRename={(id, newName) => handleRenameDevice(id, newName)}
                onDelete={() => handleDeleteDevice(item.id)}
                onConnect={(ip) => handleConnect(ip)}
              />
            )}
          />

          <TouchableOpacity style={styles.addNewButton} disabled={devices.length >=5} onPress={() => setShowConnectionScreen(true)}>
          <Text style={[styles.addNewText, devices.length >= 5 && styles.disabledText]}>+ Añadir nuevo dispositivo</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 22,
    marginBottom: 10,
    marginTop: 20,
    textAlign: 'center',
  },
  numberOfDevices: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 20,
    marginBottom: 5,
  },
  image: {
    width: 200,
    height: 200,
    alignSelf: 'center',
  },
  imageText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 22,
  },
  deviceItem: {
    backgroundColor: '#222',
    padding: 15,
    marginVertical: 10,
    borderRadius: 10,
  },
  deviceText: {
    color: '#fff',
    fontSize: 18,
  },
  addNewButton: {
    marginTop: 30,
    alignItems: 'center',
  },
  addNewText: {
    color: '#fff',
    fontSize: 18,
  },
  disabledText: {
    color: '#888'
  },
});

export default HomePage;
