import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';

interface Props {
  initials?: string;
  photo?: string;
  size?: number;
  borderColor?: string;
}

export function Avatar({ initials = 'YA', photo, size = 80, borderColor }: Props) {
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: borderColor ?? Colors.brandGreen,
          backgroundColor: Colors.brandGreen,
        }]}
    >
      {photo ? (
        <Image source={{ uri: photo }} style={{ width: size - 6, height: size - 6, borderRadius: (size - 6) / 2 }} />
      ) : (
        <Text style={[styles.initials, { fontSize: size * 0.32 }]}>{initials}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
