import React, { useEffect, useState, useContext } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { fetchServers, updateServer, deleteServer } from '../utils/database';
import ConnectionScreen from './ConnectionScreen';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { io } from 'socket.io-client';
import DeviceItem from './DeviceItem';
import { SocketContext } from './SocketContext';

const HomePage = ({ onConnect }) => {
  const [servers, setServers] = useState([]);
  const [showConnectionScreen, setShowConnectionScreen] = useState(false);
  const { setSocket } = useContext(SocketContext);
  const { socket }= useContext(SocketContext);
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
  
      // Cargar servidores desde SQLite
      const loadServers = async () => {
        try {
          const loadedServers = await fetchServers();
          setServers(loadedServers);
        } catch (err) {
          console.log('Error al cargar servidores:', err);
        }
      };
  
      loadServers();
    }, [socket])
  );

  if (showConnectionScreen) {
    return <ConnectionScreen onConnect={(socketOrNull) => {
      setShowConnectionScreen(false);
      if (socketOrNull) {
        onConnect(socketOrNull);
      }
      (async () => {
        const loadedServers = await fetchServers();
        setServers(loadedServers);
      })();
    }} />
  }
  
const handleConnect = async (ip) => {
  try {
    const newSocket = io(`http://${ip}:3000`, {
      transports: ['websocket'],
      timeout: 10000,
      forceNew: true
    });

    // Espera conexión con timeout
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout de conexión'));
      }, 10000);

      newSocket.on('connect', () => {
        clearTimeout(timeout);
        setSocket(newSocket);
        navigation.navigate('Remote');
        resolve();
      });

      newSocket.on('connect_error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

  } catch (err) {
    Alert.alert('Error de conexión', 
      `No se pudo conectar al servidor:\n${err.message}\n\nVerifica que:
      - La IP sea correcta
      - El servidor esté ejecutándose
      - Ambos dispositivos estén en la misma red`);
    console.error('Error de conexión:', err);
  }
};

  const handleRenameServer = async (id, newName) => {
      try {
        await updateServer(id, newName);
        const updatedServers = await fetchServers();
        setServers(updatedServers);
      } catch (err) {
        console.log("Error al renombrar servidor:", err);
        Alert.alert("Error", "No se pudo renombrar el dispositivo.");
      }
    };
    
  const handleDeleteServer = async (id) => {
      try {
        await deleteServer(id);
        const updatedServers = await fetchServers();
        setServers(updatedServers);
      } catch (err) {
        console.log("Error al eliminar servidor:", err);
        Alert.alert("Error", "No se pudo eliminar el dispositivo.");
      }
    };

  return (
    <View style={styles.container}>
      {servers.length === 0 ? (
        <TouchableOpacity onPress={() => setShowConnectionScreen(true)}>
          <Image source={require('../assets/homepageImage.png')} style={styles.image} />
          <Text style={styles.imageText}>No tienes ningún dispositivo guardado</Text>
        </TouchableOpacity>
      ) : (
        <>
          <Text style={styles.title}>Tus dispositivos guardados</Text>
          <Text style={styles.numberOfDevices}>( {servers.length} / 5 )</Text>
          <FlatList
            data={servers}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <DeviceItem
                device={item}
                onRename={(id, newName) => handleRenameServer(id, newName)}
                onDelete={() => handleDeleteServer(item.id)}
                onConnect={(ip) => handleConnect(ip)}
              />
            )}
          />

          <TouchableOpacity style={styles.addNewButton} disabled={servers.length >=5} onPress={() => setShowConnectionScreen(true)}>
          <Text style={[styles.addNewText, servers.length >= 5 && styles.disabledText]}>+ Añadir nuevo dispositivo</Text>
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
