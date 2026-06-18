import { useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';

import { typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export interface TrendDatum {
  label: string;
  value: number | null;
  /** Draw a faint stage-boundary divider before this point. */
  boundary?: boolean;
}

/**
 * A line chart over evenly-spaced terms. The y-axis is oriented so the BEST mark
 * is at the top (1 on the grade scale, 15 on points) — falling lines always mean
 * "getting worse". Nulls break the line. Degrades to a calm placeholder under two
 * points. All colours come from theme tokens, so light/dark parity is automatic.
 */
export function TrendChart({
  data,
  min,
  max,
  betterIsLower,
  ticks,
  height = 188,
  formatValue = (v) => `${v}`,
}: {
  data: TrendDatum[];
  min: number;
  max: number;
  betterIsLower: boolean;
  ticks: number[];
  height?: number;
  formatValue?: (v: number) => string;
}) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const withData = data.filter((d) => d.value !== null).length;

  const plotLeft = 30;
  const plotRight = 10;
  const plotTop = 12;
  const plotBottom = 22;
  const plotW = Math.max(0, width - plotLeft - plotRight);
  const plotH = height - plotTop - plotBottom;
  const count = data.length;

  const xFor = (i: number) =>
    count <= 1 ? plotLeft + plotW / 2 : plotLeft + (i / (count - 1)) * plotW;
  const yFor = (v: number) => {
    const t = betterIsLower ? (v - min) / (max - min) : (max - v) / (max - min);
    return plotTop + t * plotH;
  };

  // Build the line path, breaking on nulls.
  let path = '';
  let pen = false;
  data.forEach((d, i) => {
    if (d.value === null) {
      pen = false;
      return;
    }
    const x = xFor(i);
    const y = yFor(d.value);
    path += pen ? ` L ${x} ${y}` : ` M ${x} ${y}`;
    pen = true;
  });

  return (
    <View onLayout={onLayout} style={{ height }}>
      {width > 0 && withData >= 2 ? (
        <Svg width={width} height={height}>
          {ticks.map((tick) => {
            const y = yFor(tick);
            return (
              <G key={tick}>
                <Line
                  x1={plotLeft}
                  x2={plotLeft + plotW}
                  y1={y}
                  y2={y}
                  stroke={colors.border}
                  strokeWidth={StyleSheet.hairlineWidth}
                />
                <SvgText
                  x={plotLeft - 6}
                  y={y + 4}
                  fill={colors.textMuted}
                  fontSize={10}
                  textAnchor="end"
                >
                  {formatValue(tick)}
                </SvgText>
              </G>
            );
          })}

          {data.map((d, i) =>
            d.boundary && i > 0 ? (
              <Line
                key={`b-${i}`}
                x1={xFor(i) - plotW / (2 * Math.max(1, count - 1))}
                x2={xFor(i) - plotW / (2 * Math.max(1, count - 1))}
                y1={plotTop}
                y2={plotTop + plotH}
                stroke={colors.border}
                strokeWidth={1}
                strokeDasharray="3 4"
              />
            ) : null,
          )}

          <Path
            d={path.trim()}
            fill="none"
            stroke={colors.tint}
            strokeWidth={2.5}
            strokeLinejoin="round"
          />

          {data.map((d, i) =>
            d.value === null ? null : (
              <Circle key={`p-${i}`} cx={xFor(i)} cy={yFor(d.value)} r={3.5} fill={colors.tint} />
            ),
          )}

          {data.map((d, i) => {
            const show = count <= 6 || i === 0 || i === count - 1 || d.boundary;
            if (!show) return null;
            return (
              <SvgText
                key={`x-${i}`}
                x={xFor(i)}
                y={height - 6}
                fill={colors.textMuted}
                fontSize={10}
                textAnchor="middle"
              >
                {d.label}
              </SvgText>
            );
          })}
        </Svg>
      ) : (
        <View style={styles.placeholder}>
          <Text style={[styles.placeholderText, { color: colors.textMuted }]}>
            Mehr Noten, mehr Verlauf
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { fontSize: 14, fontWeight: typography.weightMedium },
});
