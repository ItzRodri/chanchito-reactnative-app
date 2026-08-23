import Svg, { Circle, Ellipse, Path, Polygon, Rect } from 'react-native-svg';

import { colors } from '@/theme/tokens';

export type Mood = 'normal' | 'happy' | 'excited' | 'celebrating' | 'sad';

type Props = {
  mood?: Mood;
  size?: number;
};

/**
 * Puerto directo de `ChanchitoMascot.dc.html`.
 * El viewBox 200x190 y todas las coordenadas se mantienen intactas.
 */
export function ChanchitoMascot({ mood = 'happy', size = 120 }: Props) {
  const stroke = colors.ink;

  return (
    <Svg width={size} height={size} viewBox="0 0 200 190">
      {/* orejas */}
      <Polygon points="46,74 62,22 96,58" fill={colors.pinkSoft} stroke={stroke} strokeWidth={7} strokeLinejoin="round" />
      <Polygon points="154,74 138,22 104,58" fill={colors.pinkSoft} stroke={stroke} strokeWidth={7} strokeLinejoin="round" />

      {/* cabeza */}
      <Circle cx={100} cy={112} r={64} fill={colors.pinkSoft} stroke={stroke} strokeWidth={7} />

      {/* interior de las orejas */}
      <Polygon points="60,64 68,38 86,58" fill={colors.pink} stroke={stroke} strokeWidth={5} strokeLinejoin="round" />
      <Polygon points="140,64 132,38 114,58" fill={colors.pink} stroke={stroke} strokeWidth={5} strokeLinejoin="round" />

      {/* cachetes */}
      <Circle cx={50} cy={128} r={12} fill={colors.pinkCheek} opacity={0.65} />
      <Circle cx={150} cy={128} r={12} fill={colors.pinkCheek} opacity={0.65} />

      {/* ojos */}
      <Circle cx={76} cy={102} r={12} fill={stroke} />
      <Circle cx={124} cy={102} r={12} fill={stroke} />
      <Circle cx={80} cy={98} r={4} fill="#fff" />
      <Circle cx={128} cy={98} r={4} fill="#fff" />

      {/* cejas tristes + lagrimita */}
      {mood === 'sad' && (
        <>
          <Path d="M62 84 Q76 78 90 86" fill="none" stroke={stroke} strokeWidth={5} strokeLinecap="round" />
          <Path d="M110 86 Q124 78 138 84" fill="none" stroke={stroke} strokeWidth={5} strokeLinecap="round" />
          <Ellipse cx={66} cy={122} rx={5} ry={9} fill={colors.sky} stroke={stroke} strokeWidth={4} />
        </>
      )}

      {/* hocico */}
      <Ellipse cx={100} cy={130} rx={38} ry={27} fill={colors.pink} stroke={stroke} strokeWidth={7} />
      <Ellipse cx={86} cy={130} rx={6.5} ry={11} fill={stroke} />
      <Ellipse cx={114} cy={130} rx={6.5} ry={11} fill={stroke} />

      {/* bocas */}
      {mood === 'normal' && (
        <Path d="M86 166 Q100 172 114 166" fill="none" stroke={stroke} strokeWidth={6} strokeLinecap="round" />
      )}
      {mood === 'happy' && (
        <Path d="M80 162 Q100 180 120 162" fill="none" stroke={stroke} strokeWidth={6} strokeLinecap="round" />
      )}
      {mood === 'excited' && (
        <Path d="M82 162 Q100 186 118 162 Z" fill={colors.pinkDeep} stroke={stroke} strokeWidth={6} strokeLinejoin="round" />
      )}
      {mood === 'celebrating' && (
        <>
          <Path d="M80 160 Q100 188 120 160 Z" fill={colors.pinkDeep} stroke={stroke} strokeWidth={6} strokeLinejoin="round" />
          <Rect x={14} y={30} width={12} height={12} rx={3} fill={colors.mint} stroke={stroke} strokeWidth={4} transform="rotate(20 20 36)" />
          <Rect x={176} y={42} width={12} height={12} rx={3} fill={colors.coral} stroke={stroke} strokeWidth={4} transform="rotate(-15 182 48)" />
          <Circle cx={24} cy={96} r={6} fill={colors.sun} stroke={stroke} strokeWidth={4} />
          <Circle cx={178} cy={104} r={6} fill={colors.sky} stroke={stroke} strokeWidth={4} />
        </>
      )}
      {mood === 'sad' && (
        <Path d="M84 172 Q100 160 116 172" fill="none" stroke={stroke} strokeWidth={6} strokeLinecap="round" />
      )}
    </Svg>
  );
}
