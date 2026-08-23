import Svg, { Circle, Path, Rect } from 'react-native-svg';

type IconProps = { color: string; size?: number };

/** Casita: techo triangular + cuerpo, como en el mockup. */
export function HomeIcon({ color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22">
      <Path d="M0 11 L11 0 L22 11 Z" fill={color} />
      <Rect x={2} y={10} width={18} height={12} rx={3} fill={color} />
    </Svg>
  );
}

/** Lupa: aro + mango a 45°. */
export function SearchIcon({ color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22">
      <Circle cx={9} cy={9} r={7} stroke={color} strokeWidth={2.5} fill="none" />
      <Path d="M14.5 14.5 L20 20" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

/** Silueta de persona. */
export function ProfileIcon({ color, size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22">
      <Circle cx={11} cy={5} r={5} fill={color} />
      <Path d="M1 22 A10 10 0 0 1 21 22 Z" fill={color} />
    </Svg>
  );
}

/** Campanita del header de Home. */
export function BellIcon({ color, size = 15 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Path
        d="M3 11 V7 a5 5 0 0 1 10 0 v4"
        stroke={color}
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
      />
      <Path d="M2 11 h12" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}
