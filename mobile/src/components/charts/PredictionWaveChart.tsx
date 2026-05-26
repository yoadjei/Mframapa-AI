import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, View } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors } from '../../theme/colors';

interface Props {
  width?: number;
  height?: number;
}

export function PredictionWaveChart({ width, height = 200 }: Props) {
  const W = width ?? Dimensions.get('window').width - 32;
  const H = height;

  // Static sine wave path matching mockup: two hills
  const points: { x: number; y: number }[] = [];
  const steps = 100;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = t * W;
    const y = H / 2 - Math.sin(t * Math.PI * 2) * (H * 0.38);
    points.push({ x, y });
  }

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${W},${H} L0,${H} Z`;

  return (
    <View>
      <Svg width={W} height={H}>
        <Defs>
          <LinearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={Colors.brandGreen} stopOpacity="0.45" />
            <Stop offset="1" stopColor={Colors.brandGreen} stopOpacity="0.02" />
          </LinearGradient>
        </Defs>
        <Path d={areaPath} fill="url(#waveGrad)" />
        <Path
          d={linePath}
          stroke={Colors.brandGreen}
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}
