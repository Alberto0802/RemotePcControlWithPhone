import { useContext, useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  PanResponder,
  Animated,
  TextInput
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SocketContext } from './SocketContext';
import * as ScreenOrientation from 'expo-screen-orientation';

const FRAME_INTERVAL = 16; // ~30fps
const JPEG_QUALITY = 70;   // mejor calidad

const RemoteScreen = () => {
  const { socket } = useContext(SocketContext);
  const [imageData, setImageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inputKey, setInputKey] = useState(0);
  const inputRef = useRef(null);
  const lastTimestamp = useRef(0);
  const waitingForImageLoad = useRef(false);

  const JOYSTICK_RADIUS = 50;
  const SENSITIVITY = 0.7;
  const movementRef = useRef({ dx: 0, dy: 0 });
  const movementInterval = useRef(null);
  const joystickPosition = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const image1Opacity = useRef(new Animated.Value(1)).current;
  const image2Opacity = useRef(new Animated.Value(0)).current;

  const [image1Data, setImage1Data] = useState(null);
  const [image2Data, setImage2Data] = useState(null);
  const [showingImage1, setShowingImage1] = useState(true);

  useFocusEffect(
    useCallback(() => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      return () => {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
      };
    }, [])
  );


  useEffect(() => {
    if (!socket) return;

    const handleScreenData = (data) => {
      // Actualiza sólo si la imagen es más nueva que la actual
      if (data.timestamp > lastTimestamp.current) {
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

  const onImageLoad = () => {
    // Cuando la nueva imagen termina de cargar, hacemos la transición
    waitingForImageLoad.current = false;

    if (showingImage1) {
      Animated.parallel([
        Animated.timing(image1Opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(image2Opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start(() => setShowingImage1(false));
    } else {
      Animated.parallel([
        Animated.timing(image1Opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(image2Opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => setShowingImage1(true));
    }
  };


  const startSendingMouseMovements = () => {
    if (movementInterval.current) return;
    movementInterval.current = setInterval(() => {
      const { dx, dy } = movementRef.current;
      if (dx !== 0 || dy !== 0) socket?.emit('mouse-move', { dx, dy });
    }, 50);
  };

  const stopSendingMouseMovements = () => {
    clearInterval(movementInterval.current);
    movementInterval.current = null;
    movementRef.current = { dx: 0, dy: 0 };
    socket?.emit('mouse-move', { dx: 0, dy: 0 });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: startSendingMouseMovements,
      onPanResponderMove: (_, gesture) => {
        let { dx, dy } = gesture;
        const dist = Math.hypot(dx, dy);
        if (dist > JOYSTICK_RADIUS) {
          const angle = Math.atan2(dy, dx);
          dx = JOYSTICK_RADIUS * Math.cos(angle);
          dy = JOYSTICK_RADIUS * Math.sin(angle);
        }
        joystickPosition.setValue({ x: dx, y: dy });
        movementRef.current = {
          dx: Math.round(dx * SENSITIVITY),
          dy: Math.round(dy * SENSITIVITY),
        };
      },
      onPanResponderRelease: () => {
        stopSendingMouseMovements();
        Animated.spring(joystickPosition, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
        }).start();
      },
      onPanResponderTerminate: () => {
        stopSendingMouseMovements();
        Animated.spring(joystickPosition, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  const handleClick = (button) => {
    socket?.emit('mouse-click', { button });
  };

  const handleKeyPress = ({ nativeEvent }) => {
    const key = nativeEvent.key;
    if (key === 'Backspace') {
      socket?.emit('type-key', { key: 'backspace' });
    } else if (key.length === 1) {
      socket?.emit('type-key', { key });
    }
  };

  const handleEnterPress = () => {
    socket?.emit('type-key', { key: 'enter' });
  };

  return (
     <View style={styles.container}>
      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#00ff00" />
          <Text style={styles.text}>Conectando...</Text>
        </View>
      )}

      {imageData && (
        <Image
          source={{ uri: imageData }}
          style={styles.image}
          resizeMode="contain"
          fadeDuration={0} // sin fade
          onError={(e) => console.log('Error cargando imagen:', e.nativeEvent.error)}
        />
      )}
      <View style={styles.joystickContainer} {...panResponder.panHandlers}>
        <Animated.View style={[styles.joystickKnob, joystickPosition.getLayout()]} />
      </View>
          <View style={styles.buttonsWrapper}>
            {/* Fila 1: Tec + Enter */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                onPress={() => inputRef.current?.focus()}
                style={styles.button}
              >
                <Text style={styles.buttonText}>⌨️ Tec</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleEnterPress}
                style={styles.button}
              >
                <Text style={styles.buttonText}>↵ Enter</Text>
              </TouchableOpacity>
            </View>

            {/* Fila 2: Izq + Der */}
            <View style={styles.buttonRow}>
              <TouchableOpacity onPress={() => handleClick('left')} style={styles.button}>
                <Text style={styles.buttonText}>🖱️ Izq</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleClick('right')} style={styles.button}>
                <Text style={styles.buttonText}>🖱️ Der</Text>
              </TouchableOpacity>
            </View>

            {/* Hidden input para el teclado */}
            <TextInput
              ref={inputRef}
              style={styles.hiddenInput}
              onKeyPress={handleKeyPress}
              autoFocus={false}
              blurOnSubmit={false}
              caretHidden={true}
            />
          </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  image: { flex: 1, width: '100%', height: '100%', backgroundColor: 'black' },
  loading: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  text: { color: '#fff', marginTop: 10 },
  joystickContainer: { position: 'absolute', left: 30, bottom: 30, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.05)', borderColor: '#00ff00', borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  joystickKnob: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#00ff00' },
  buttonsContainer: { position: 'absolute', right: 90, bottom: 30, flexDirection: 'row', gap: 20 },
  mouseButton: { backgroundColor: '#444', padding: 15, borderRadius: 10, opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  keyboardContainer: { position: 'absolute', right: 95, bottom: 100, alignItems: 'center' },
  keyboardButton: { backgroundColor: '#444', padding: 15, borderRadius: 10, opacity: 0.5 },
  hiddenInput: { height: 0, width: 0, opacity: 0, position: 'absolute' },
  buttonsWrapper: {position: 'absolute', right: 90, bottom: 30, gap: 10, alignItems: 'center'},
  buttonRow: {flexDirection: 'row', gap: 20},
  button: {backgroundColor: '#444', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10, opacity: 0.6},
});

export default RemoteScreen;