import { Redirect } from 'expo-router';

import { useSessionStore } from '@/store/session';

/**
 * Puerta de entrada: onboarding → conectar wallet → app.
 */
export default function Index() {
  const onboarded = useSessionStore((s) => s.onboarded);
  const connected = useSessionStore((s) => s.connected);

  if (!onboarded) return <Redirect href="/onboarding" />;
  if (!connected) return <Redirect href="/connect" />;
  return <Redirect href="/(tabs)" />;
}
