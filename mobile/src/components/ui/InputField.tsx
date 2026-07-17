import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, ViewStyle, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';

interface Props extends TextInputProps {
  label?: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  secure?: boolean;
  containerStyle?: ViewStyle;
  isDark?: boolean;
}

export function InputField({ label, icon, secure, containerStyle, isDark = true, ...rest }: Props) {
  const [show, setShow] = useState(false);
  const bg     = isDark ? Colors.bgCardAlt : '#FFFFFF';
  const border = isDark ? '#1E3328' : Colors.lightBorder;
  const text   = isDark ? Colors.textPrimary : Colors.lightTextPrimary;
  const ph     = isDark ? Colors.textMuted : '#9CAFaa';

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={[styles.label, { color: isDark ? Colors.textSecondary : Colors.lightTextSecondary }]}>{label}</Text> : null}
      <View style={[styles.row, { backgroundColor: bg, borderColor: border }]}>
        {icon ? (
          <Ionicons name={icon} size={18} color={ph} style={styles.icon} />
        ) : null}
        <TextInput
          {...rest}
          style={[styles.input, { color: text, flex: 1 }]}
          placeholderTextColor={ph}
          secureTextEntry={secure && !show}
          accessibilityLabel={label ?? rest.placeholder}
        />
        {secure ? (
          <TouchableOpacity onPress={() => setShow(!show)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name={show ? 'eye-outline' : 'eye-off-outline'} size={18} color={ph} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { fontSize: 13, fontWeight: '500' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  icon: {},
  input: { fontSize: 15 },
});
