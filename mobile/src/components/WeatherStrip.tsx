import React from 'react';
import { View, Text } from 'react-native';
import { getColors, spacing, borderRadius, fontSize } from '../theme';
import { formatTemperature, formatHumidity, formatWindSpeed } from '../utils/formatters';

interface WeatherData {
  temp: number | null;
  humidity: number | null;
  wind: number | null;
}

interface WeatherStripProps {
  weather: WeatherData;
  isDark: boolean;
}

interface ItemProps {
  icon: string;
  label: string;
  value: string;
  colors: ReturnType<typeof getColors>;
}

function WeatherItem({ icon, label, value, colors }: ItemProps) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        paddingVertical: spacing.sm,
        backgroundColor: colors.card,
        borderRadius: borderRadius.md,
        marginHorizontal: 3,
      }}
    >
      <Text style={{ fontSize: fontSize.xl }}>{icon}</Text>
      <Text style={{ color: colors.text, fontSize: fontSize.md, fontWeight: '600', marginTop: 2 }}>
        {value}
      </Text>
      <Text style={{ color: colors.subtext, fontSize: fontSize.xs }}>{label}</Text>
    </View>
  );
}

export function WeatherStrip({ weather, isDark }: WeatherStripProps) {
  const colors = getColors(isDark);

  return (
    <View style={{ flexDirection: 'row', marginHorizontal: -3 }}>
      <WeatherItem
        icon="🌡"
        label="Temp"
        value={formatTemperature(weather.temp)}
        colors={colors}
      />
      <WeatherItem
        icon="💧"
        label="Humidity"
        value={formatHumidity(weather.humidity)}
        colors={colors}
      />
      <WeatherItem
        icon="💨"
        label="Wind"
        value={formatWindSpeed(weather.wind)}
        colors={colors}
      />
    </View>
  );
}
