import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { confettiColors } from '@/theme/tokens';
import { useSessionStore } from '@/store/session';

/* ---------------------------- flotar (keyframe `floaty`) ------------------ */

export function Bob({ children, className = '' }: { children: ReactNode; className?: string }) {
  const reduceMotion = useSessionStore((s) => s.reduceMotion);
  const t = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    t.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [reduceMotion, t]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: -7 * t.value }] }));

  return (
    <Animated.View className={className} style={style}>
      {children}
    </Animated.View>
  );
}

/* ------------------------------ pop (keyframe `pop`) ---------------------- */

export function Pop({ children, className = '' }: { children: ReactNode; className?: string }) {
  const reduceMotion = useSessionStore((s) => s.reduceMotion);
  const s = useSharedValue(reduceMotion ? 1 : 0.4);
  const o = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) return;
    o.value = withTiming(1, { duration: 200 });
    s.value = withSequence(
      withTiming(1.12, { duration: 300, easing: Easing.out(Easing.ease) }),
      withTiming(1, { duration: 200, easing: Easing.out(Easing.ease) }),
    );
  }, [reduceMotion, s, o]);

  const style = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ scale: s.value }] }));

  return (
    <Animated.View className={className} style={style}>
      {children}
    </Animated.View>
  );
}

/* -------------------- romper el chanchito (keyframe `shakebreak`) --------- */

export function ShakeBreak({ children, className = '' }: { children: ReactNode; className?: string }) {
  const reduceMotion = useSessionStore((s) => s.reduceMotion);
  const r = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    r.value = withSequence(
      withTiming(-6, { duration: 140 }),
      withTiming(6, { duration: 140 }),
      withTiming(-4, { duration: 140 }),
      withTiming(3, { duration: 140 }),
      withTiming(0, { duration: 140 }),
    );
  }, [reduceMotion, r]);

  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${r.value}deg` }] }));

  return (
    <Animated.View className={className} style={style}>
      {children}
    </Animated.View>
  );
}

/* ------------------------------- confeti ---------------------------------- */

function ConfettiPiece({ index, distance }: { index: number; distance: number }) {
  const t = useSharedValue(0);
  const duration = 1600 + (index % 4) * 350;
  const delay = (index % 5) * 120;

  useEffect(() => {
    t.value = withDelay(delay, withTiming(1, { duration, easing: Easing.in(Easing.ease) }));
  }, [t, delay, duration]);

  const style = useAnimatedStyle(() => ({
    opacity: t.value < 0.1 ? t.value * 10 : 1 - t.value,
    transform: [{ translateY: -30 + t.value * distance }, { rotate: `${t.value * 540}deg` }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: `${6 + index * 6}%`,
          width: 7 + (index % 3) * 2,
          height: 10 + (index % 2) * 4,
          borderRadius: 2,
          backgroundColor: confettiColors[index % confettiColors.length],
        },
        style,
      ]}
    />
  );
}

export function Confetti({ pieces = 16 }: { pieces?: number }) {
  const reduceMotion = useSessionStore((s) => s.reduceMotion);
  const { height } = useWindowDimensions();
  if (reduceMotion) return null;

  return (
    <View pointerEvents="none" className="absolute inset-0 z-0">
      {Array.from({ length: pieces }).map((_, i) => (
        <ConfettiPiece key={i} index={i} distance={height * 0.75} />
      ))}
    </View>
  );
}

/* -------------------------------- monedas --------------------------------- */

function Coin({ index, distance }: { index: number; distance: number }) {
  const t = useSharedValue(0);
  const duration = 1500 + (index % 3) * 400;
  const delay = (index % 4) * 150;

  useEffect(() => {
    t.value = withDelay(delay, withTiming(1, { duration, easing: Easing.in(Easing.ease) }));
  }, [t, delay, duration]);

  const style = useAnimatedStyle(() => ({
    opacity: t.value < 0.2 ? t.value * 5 : 1 - t.value,
    transform: [{ translateY: -20 + t.value * distance }, { scale: 0.6 + t.value * 0.4 }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: `${14 + index * 9}%`,
          width: 20,
          height: 20,
          borderRadius: 10,
          borderWidth: 2,
          borderColor: '#241713',
          backgroundColor: '#F0B429',
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <View className="h-2 w-2 rounded-full bg-[#FFE27A]" style={{ marginBottom: 3, marginRight: 3 }} />
    </Animated.View>
  );
}

export function Coins({ pieces = 9 }: { pieces?: number }) {
  const reduceMotion = useSessionStore((s) => s.reduceMotion);
  const { height } = useWindowDimensions();
  if (reduceMotion) return null;

  return (
    <View pointerEvents="none" className="absolute inset-0 z-0">
      {Array.from({ length: pieces }).map((_, i) => (
        <Coin key={i} index={i} distance={height * 0.55} />
      ))}
    </View>
  );
}
