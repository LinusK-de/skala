import { useState } from 'react';
import { type LayoutChangeEvent, View } from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';

import { useTheme } from '@/hooks/useTheme';
import type { Sentiment } from '@/lib/grades';

export interface ComparisonItem {
  label: string;
  value: number;
  sentiment: Sentiment;
}

/**
 * A horizontal lollipop of subjects (pass them already sorted best → worst). The
 * dot sits further RIGHT the better the mark, regardless of scale direction, with
 * the overall average drawn as a dashed ink reference line.
 */
export function ComparisonChart({
  items,
  min,
  max,
  betterIsLower,
  referenceValue,
  formatValue = (v) => `${v}`,
}: {
  items: ComparisonItem[];
  min: number;
  max: number;
  betterIsLower: boolean;
  referenceValue?: number | null;
  formatValue?: (v: number) => string;
}) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const labelWidth = 86;
  const valueWidth = 40;
  const trackLeft = labelWidth + 6;
  const trackRight = Math.max(trackLeft + 10, width - valueWidth);
  const trackW = trackRight - trackLeft;
  const rowH = 32;
  const top = 8;
  const height = items.length * rowH + top + 4;

  const goodness = (v: number) =>
    betterIsLower ? (max - v) / (max - min) : (v - min) / (max - min);
  const xFor = (v: number) => trackLeft + goodness(v) * trackW;
  const sentColor = (s: Sentiment) =>
    s === 'positive' ? colors.positive : s === 'warning' ? colors.warning : colors.textMuted;

  return (
    <View onLayout={onLayout} style={{ height }}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          {referenceValue != null ? (
            <Line
              x1={xFor(referenceValue)}
              x2={xFor(referenceValue)}
              y1={top}
              y2={height - 4}
              stroke={colors.text}
              strokeWidth={1}
              strokeDasharray="3 4"
            />
          ) : null}

          {items.map((item, i) => {
            const cy = top + i * rowH + rowH / 2;
            return (
              <Line
                key={`track-${item.label}`}
                x1={trackLeft}
                x2={trackRight}
                y1={cy}
                y2={cy}
                stroke={colors.border}
                strokeWidth={2}
                strokeLinecap="round"
              />
            );
          })}

          {items.map((item, i) => {
            const cy = top + i * rowH + rowH / 2;
            const x = xFor(item.value);
            return (
              <Circle
                key={`dot-${item.label}`}
                cx={x}
                cy={cy}
                r={5}
                fill={sentColor(item.sentiment)}
              />
            );
          })}

          {items.map((item, i) => {
            const cy = top + i * rowH + rowH / 2;
            return (
              <SvgText
                key={`label-${item.label}`}
                x={0}
                y={cy + 4}
                fill={colors.text}
                fontSize={13}
                fontWeight="500"
              >
                {item.label.length > 11 ? `${item.label.slice(0, 10)}…` : item.label}
              </SvgText>
            );
          })}

          {items.map((item, i) => {
            const cy = top + i * rowH + rowH / 2;
            return (
              <SvgText
                key={`value-${item.label}`}
                x={width}
                y={cy + 4}
                fill={colors.text}
                fontSize={13}
                fontWeight="600"
                textAnchor="end"
              >
                {formatValue(item.value)}
              </SvgText>
            );
          })}
        </Svg>
      ) : null}
    </View>
  );
}
