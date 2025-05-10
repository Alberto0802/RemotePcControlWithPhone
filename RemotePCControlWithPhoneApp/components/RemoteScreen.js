import { useContext, useEffect, useState, useRef, useCallback } from 'react';
import { View, Image, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SocketContext } from './SocketContext';
import * as ScreenOrientation from 'expo-screen-orientation';

const RemoteScreen = () => {
  const { socket } = useContext(SocketContext);
  const [imageData, setImageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const lastTimestamp = useRef(0);

    useFocusEffect(
      useCallback(() => {
        // Bloquear orientación en horizontal al entrar a la pantalla
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        
        return () => {
          ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
        };
    }, [])
  );

  useEffect(() => { 
    if (!socket) return;

    const handleScreenData = (data) => {
      // Filtra frames duplicados o muy cercanos en tiempo
      if (data.timestamp - lastTimestamp.current > 50) { // ~20 FPS
        lastTimestamp.current = data.timestamp;
        setImageData(`data:image/jpeg;base64,${data.image}`);
        setLoading(false);
      }
    };

    socket.on('screen-data', handleScreenData);
    socket.emit('start-stream');

    return () => {
      socket.off('screen-data', handleScreenData);
      socket.emit('stop-stream');
    };
  }, [socket]);

  // Pre-render para evitar flickering
  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#00ff00" />
          <Text style={styles.text}>Conectando...</Text>
        </View>
      ) : (
        <Image
          source={{ uri: imageData }}
          style={styles.image}
          resizeMode="contain"
          fadeDuration={0} // Elimina animación por defecto
          onError={(e) => console.log('Error cargando imagen:', e.nativeEvent.error)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'black', // Fondo negro para transiciones
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  text: {
    color: '#fff',
    marginTop: 10,
  },
});

export default RemoteScreen;