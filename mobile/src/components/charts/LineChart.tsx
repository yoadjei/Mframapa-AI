import React from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors } from '../../theme/colors';

interface Props {
  data: number[];
  labels?: string[];
  width?: number;
  height?: number;
  color?: string;
  isDark?: boolean;
  showDots?: boolean;
  secondaryData?: number[];
  secondaryColor?: string;
}

function buildPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  return d;
}

function buildAreaPath(points: { x: number; y: number }[], height: number): string {
  if (points.length < 2) return '';
  const line = buildPath(points);
  return `${line} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;
}

export function LineChart({
  data,
  labels,
  width,
  height = 120,
  color,
  isDark = true,
  showDots = true,
  secondaryData,
  secondaryColor = '#2196F3',
}: Props) {
  const W = width ?? Dimensions.get('window').width - 64;
  const padH = 16;
  const padV = 12;
  const chartW = W - padH * 2;
  const chartH = height - padV * 2;
  const lineColor = color ?? Colors.brandGreen;

  if (!data || data.length === 0) return null;

  const minVal = Math.min(...data, ...(secondaryData ?? []));
  const maxVal = Math.max(...data, ...(secondaryData ?? []));
  const range  = maxVal - minVal || 1;

  const toPoints = (d: number[]) =>
    d.map((v, i) => ({
      x: padH + (i / (d.length - 1)) * chartW,
      y: padV + chartH - ((v - minVal) / range) * chartH,
    }));

  const pts1 = toPoints(data);
  const pts2 = secondaryData ? toPoints(secondaryData) : null;
  const path1 = buildPath(pts1);
  const area1 = buildAreaPath(pts1, height - padV);

  return (
    <View style={{ width: W, height }}>
      <Svg width={W} height={height}>
        <Defs>
          <LinearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={lineColor} stopOpacity="0.3" />
            <Stop offset="1" stopColor={lineColor} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Path d={area1} fill="url(#grad1)" />
        <Path d={path1} stroke={lineColor} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {pts2 ? (
          <Path d={buildPath(pts2)} stroke={secondaryColor} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        ) : null}
        {showDots &&
          pts1.map((p, i) => (
            <Circle key={i} cx={p.x} cy={p.y} r={4} fill={lineColor} />
          ))}
        {showDots && pts2 &&
          pts2.map((p, i) => (
            <Circle key={`s${i}`} cx={p.x} cy={p.y} r={4} fill={secondaryColor} />
          ))}
      </Svg>
      <View style={[styles.valueRow, { width: W, paddingHorizontal: padH }]}>
        {data.map((v, i) => (
          <Text
            key={`v${i}`}
            style={[styles.value, { color: isDark ? Colors.textSecondary : '#5C6B7A' }]}
          >
            {Math.round(v)}
          </Text>
        ))}
      </View>
      {labels && labels.length > 0 ? (
        <View style={[styles.labelRow, { width: W, paddingHorizontal: padH }]}>
          {labels.map((l, i) => (
            <Text key={i} style={[styles.label, { color: isDark ? Colors.textMuted : '#5C6B7A' }]}>
              {l}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  value: {
    fontSize: 10,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  label: {
    fontSize: 11,
    flex: 1,
    textAlign: 'center',
  },
});
