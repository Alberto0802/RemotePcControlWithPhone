import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomePage from './components/HomePage';
import ConnectionScreen from './components/ConnectionScreen';
import { init } from './utils/database';
import { Alert } from 'react-native';

const Stack = createNativeStackNavigator();

export default function App() {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    init()
      .then(() => {
        console.log('Database initialized!');
      })
      .catch((err) => {
        console.log('Database failed to initialize', err);
      });
  }, []);

  const handleConnect = async (socketOrIp) => {
    if (typeof socketOrIp === 'object' && socketOrIp.connected) {
      const socket = socketOrIp;
      const ip = socket.io.uri.replace(/^http:\/\/|:3000$/g, '');
      setSocket(socket);
      return;
    }

    const ip = socketOrIp;
    const io = require('socket.io-client');
    const newSocket = io(`http://${ip}:3000`, {
      transports: ['websocket']
    });

    newSocket.on('connect_error', () => {
      Alert.alert('Error', 'No se pudo conectar al servidor.');
    });
  };

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen
          name="Home"
          options={{ title: 'Inicio', headerShown: false }}
        >
          {() => <HomePage onConnect={handleConnect} socket={socket} />}
        </Stack.Screen>
        <Stack.Screen
          name="Connection"
          options={{ title: 'Conectar' }}
        >
          {() => <ConnectionScreen onConnect={handleConnect} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
