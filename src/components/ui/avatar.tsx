import { View } from 'react-native';

import { ChanchitoMascot, type Mood } from '@/components/chanchito-mascot';

type Props = {
  mood: Mood;
  bg?: string;
  size?: number;
  /** Superposición en las pilas de amigos. */
  overlap?: boolean;
};

/** Círculo con borde tinta y el chanchito adentro. */
export function Avatar({ mood, bg = '#FFF3EC', size = 42, overlap }: Props) {
  return (
    <View
      className="items-center justify-center overflow-hidden rounded-full border-[2.5px] border-ink"
      style={{ width: size, height: size, backgroundColor: bg, marginRight: overlap ? -size * 0.24 : 0 }}
    >
      <ChanchitoMascot mood={mood} size={size * 0.8} />
    </View>
  );
}

/** Cuadrado redondeado con el chanchito (listas de chanchitos). */
export function PoolAvatar({ mood, size = 52 }: { mood: Mood; size?: number }) {
  return (
    <View
      className="items-center justify-center rounded-[15px] border-[2.5px] border-ink bg-cream"
      style={{ width: size, height: size }}
    >
      <ChanchitoMascot mood={mood} size={size * 0.8} />
    </View>
  );
}
