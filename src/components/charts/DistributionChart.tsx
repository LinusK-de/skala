import { useState } from 'react';
import { type LayoutChangeEvent, View } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';

import { useTheme } from '@/hooks/useTheme';

export interface DistributionBar {
  label: string;
  count: number;
}

/** A vertical histogram of grade frequencies (blush fill). Pro feature. */
export function DistributionChart({
  bars,
  height = 160,
}: {
  bars: DistributionBar[];
  height?: number;
}) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const plotTop = 8;
  const plotBottom = 20;
  const plotH = height - plotTop - plotBottom;
  const maxCount = Math.max(1, ...bars.map((b) => b.count));
  const slot = bars.length > 0 ? width / bars.length : width;
  const barWidth = Math.max(6, Math.min(28, slot * 0.5));

  return (
    <View onLayout={onLayout} style={{ height }}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          {bars.map((bar, i) => {
            const h = (bar.count / maxCount) * plotH;
            const x = i * slot + (slot - barWidth) / 2;
            const y = plotTop + (plotH - h);
            return (
              <Rect
                key={bar.label}
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(bar.count > 0 ? 3 : 0, h)}
                rx={4}
                fill={colors.accent2}
              />
            );
          })}
          {bars.map((bar, i) => (
            <SvgText
              key={`l-${bar.label}`}
              x={i * slot + slot / 2}
              y={height - 6}
              fill={colors.textMuted}
              fontSize={10}
              textAnchor="middle"
            >
              {bar.label}
            </SvgText>
          ))}
        </Svg>
      ) : null}
    </View>
  );
}
