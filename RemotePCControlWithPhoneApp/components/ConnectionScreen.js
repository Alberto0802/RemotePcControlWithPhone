import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import io from 'socket.io-client';
import { BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';

const ConnectionScreen = ({ onConnect }) => {
  const [ip, setIp] = useState('');
  const [name, setName] =useState('');
  const [connecting, setConnecting] = useState(false);

  const connectToServer = () => {
    if (!ip) {
      Alert.alert('Error', 'Por favor ingresa una IP válida.');
      return;
    }

    setConnecting(true);
    const socket = io(`http://${ip}:3000`, {
      transports: ['websocket'],
      reconnection: false,
    });

    socket.on('connect', () => {
        console.log('✅ Conectado al servidor');
        console.log(`ℹ️ Enviando -> IP: ${ip}, Name: ${name}`);
        socket.emit('registerIp', { ip, name });
        onConnect(socket)
    });

    socket.on('connect_error', () => {
      setConnecting(false);
      Alert.alert('Error', 'No se pudo conectar al servidor.');
    });
  };

  const showInfoAlert = () => {
    Alert.alert(
      '¿Cómo saber tu IP?',
      `Para saber la IP de tu dispositivo:
  
      🔹 En Windows:
      1. Abre el símbolo del sistema (cmd).
      2. Escribe "ipconfig" y pulsa Enter.
      3. Busca "Dirección IPv4".
      
      🔹 En Mac:
      1. Ve a Preferencias del sistema > Red.
      2. Selecciona tu conexión y verás tu IP en "Estado".
      
      Usa una IP como: 192.168.x.x`,
      [{ text: 'Entendido', style: 'default' }]
    );
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        onConnect(null);
        return true; 
      };
  
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
  
      return () => {
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
      };
    }, [])
  );
  

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Conectar al servidor</Text>
      <TextInput
        style={styles.name}
        placeholder='Nombre: Portatil'
        placeholderTextColor={'#fff'}
        value={name}
        onChangeText={setName}
      />
      <TouchableOpacity onPress={showInfoAlert} style={styles.infoButton}>
        <Ionicons name="information-circle-outline" size={24} color="#fff"/>
      </TouchableOpacity>
      <TextInput
        style={styles.input}
        placeholder="Ej: 192.168.1.100"
        placeholderTextColor={'#fff'}
        value={ip}
        onChangeText={setIp}
        keyboardType="numeric"
      />
      <Button title={connecting ? 'Conectando...' : 'Conectar'} onPress={connectToServer} disabled={connecting} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  title: {
    fontSize: 22,
    marginBottom: 20,
    textAlign: 'center',
    color: '#fff'
  },
  name: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
    padding: 10,
    color: '#fff'
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
    padding: 10,
    color: '#fff'
  },

});

export default ConnectionScreen;
