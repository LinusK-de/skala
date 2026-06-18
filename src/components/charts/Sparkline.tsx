import { useState } from 'react';
import { type LayoutChangeEvent, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { useTheme } from '@/hooks/useTheme';

/**
 * A tiny axis-less line for the dashboard hero. Values are on the unified 1–6
 * axis (lower = better → higher on screen). Nulls are skipped.
 */
export function Sparkline({ values, height = 44 }: { values: (number | null)[]; height?: number }) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const points = values
    .map((value, index) => ({ value, index }))
    .filter((p): p is { value: number; index: number } => p.value !== null);

  const min = 1;
  const max = 6;
  const pad = 5;
  const count = values.length;
  const xFor = (i: number) => (count <= 1 ? width / 2 : (i / (count - 1)) * width);
  const yFor = (v: number) => pad + ((v - min) / (max - min)) * (height - 2 * pad);

  let path = '';
  points.forEach((p, i) => {
    const x = xFor(p.index);
    const y = yFor(p.value);
    path += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  });

  const last = points[points.length - 1];

  return (
    <View onLayout={onLayout} style={{ height }}>
      {width > 0 && points.length >= 2 ? (
        <Svg width={width} height={height}>
          <Path
            d={path}
            fill="none"
            stroke={colors.accent1}
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {last ? (
            <Circle cx={xFor(last.index)} cy={yFor(last.value)} r={3} fill={colors.tint} />
          ) : null}
        </Svg>
      ) : null}
    </View>
  );
}
