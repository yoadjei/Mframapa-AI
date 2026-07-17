import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';

interface Props {
  title: string;
  subtitle?: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  iconColor?: string;
  right?: React.ReactNode;
  showChevron?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  isDark?: boolean;
}

export function ListRow({ title, subtitle, icon, iconColor, right, showChevron, onPress, style, isDark = true }: Props) {
  const textColor = isDark ? Colors.textPrimary : Colors.lightTextPrimary;
  const subColor  = isDark ? Colors.textSecondary : Colors.lightTextSecondary;
  const iconBg    = isDark ? Colors.bgCard : '#EAF5EF';

  const content = (
    <View style={[styles.row, style]}>
      {icon ? (
        <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={18} color={iconColor ?? Colors.brandGreen} />
        </View>
      ) : null}
      <View style={styles.textBlock}>
        <Text style={[styles.title, { color: textColor }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: subColor }]}>{subtitle}</Text> : null}
      </View>
      {right ?? null}
      {showChevron ? (
        <Ionicons name="chevron-forward" size={16} color={subColor} style={styles.chevron} />
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.75} accessibilityRole="button">
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: { flex: 1, gap: 2 },
  title: { fontSize: 15, fontWeight: '600' },
  subtitle: { fontSize: 13 },
  chevron: { marginLeft: 4 },
});
