import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomePage from './components/HomePage';
import ConnectionScreen from './components/ConnectionScreen';
import { init } from './utils/database';
import RemoteScreen from './components/RemoteScreen';
import { SocketContext } from './components/SocketContext';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const Stack = createNativeStackNavigator();

export default function App() {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    init()
      .then(() => console.log('Database initialized!'))
      .catch((err) => console.log('Database failed to initialize', err));
  }, []);

  const handleConnect = (newSocket) => {
    setSocket(newSocket);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SocketContext.Provider value={{ socket, setSocket }}>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Home">
            <Stack.Screen
              name="Home"
              options={{ title: 'Inicio', headerShown: false }}
            >
              {() => <HomePage onConnect={handleConnect} socket={socket} />}
            </Stack.Screen>
            <Stack.Screen name="Connection" options={{ title: 'Conectar' }}>
              {() => <ConnectionScreen onConnect={handleConnect} />}
            </Stack.Screen>
            <Stack.Screen
              name="Remote"
              options={{ title: 'Remote Control', headerShown: false }}
            >
              {() => <RemoteScreen socket={socket} />}
            </Stack.Screen>
          </Stack.Navigator>
        </NavigationContainer>
      </SocketContext.Provider>
    </GestureHandlerRootView>
  );
}
