import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';

const DeviceItem = ({ device, onRename, onDelete, onConnect }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(device.name);

  useEffect(() => {
    setName(device.name);
  }, [device.name]);

  const handleRename = () => {
    setIsEditing(false);
    onRename(device.id, name);
  };

  const confirmDelete = () => {
    Alert.alert(
      '¿Eliminar dispositivo?',
      `¿Seguro que quieres eliminar ${name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => onDelete(device.id) },
      ]
    );
  };

  return (
    <TouchableOpacity style={styles.container} onPress={() => onConnect(device.ip)}>
      <View style={styles.info}>
        {isEditing ? (
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            onSubmitEditing={handleRename}
            onBlur={handleRename}
            autoFocus
          />
        ) : (
          <Text style={styles.name}>{name}</Text>
        )}
        <Text style={styles.ip}>{device.ip}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.icon}>
          <Ionicons name="create-outline" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity onPress={confirmDelete} style={styles.icon}>
          <Ionicons name="trash-outline" size={20} color="#ff4d4d" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#222',
    padding: 15,
    marginVertical: 8,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 4,
  },
  ip: {
    color: '#aaa',
    fontSize: 14,
  },
  input: {
    color: '#fff',
    borderBottomColor: '#555',
    borderBottomWidth: 1,
    fontSize: 18,
    paddingVertical: 2,
  },
  actions: {
    flexDirection: 'row',
    marginLeft: 10,
  },
  icon: {
    marginLeft: 10,
  },
});

export default DeviceItem;
