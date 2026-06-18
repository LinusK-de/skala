import Svg, { Circle, Path, Polyline, Rect } from 'react-native-svg';

export type TabIconName = 'heute' | 'faecher' | 'verlauf' | 'mehr';

/** Minimal line icons for the tab bar — stroke colour follows the active tint. */
export function TabBarIcon({ name, color }: { name: TabIconName; color: string }) {
  const common = {
    stroke: color,
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      {name === 'heute' ? (
        <>
          <Path d="M4 11l8-6 8 6" {...common} />
          <Path d="M6 10v8a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-8" {...common} />
        </>
      ) : null}
      {name === 'faecher' ? (
        <>
          <Path d="M5 5.5A1.5 1.5 0 0 1 6.5 4H18v15H6.5A1.5 1.5 0 0 0 5 20.5z" {...common} />
          <Path d="M5 20.5A1.5 1.5 0 0 1 6.5 19H18" {...common} />
        </>
      ) : null}
      {name === 'verlauf' ? (
        <>
          <Polyline points="4 15 9 9 13 12 20 5" {...common} />
          <Path d="M4 19h16" {...common} />
        </>
      ) : null}
      {name === 'mehr' ? (
        <>
          <Circle cx={5} cy={12} r={1.4} fill={color} />
          <Circle cx={12} cy={12} r={1.4} fill={color} />
          <Circle cx={19} cy={12} r={1.4} fill={color} />
          <Rect x={3} y={5} width={18} height={14} rx={3} {...common} />
        </>
      ) : null}
    </Svg>
  );
}
