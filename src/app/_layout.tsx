import '../global.css';
// Antes que nada: instala los polyfills que WalletConnect necesita.
import '@walletconnect/react-native-compat';

import {
  Baloo2_500Medium,
  Baloo2_600SemiBold,
  Baloo2_700Bold,
  Baloo2_800ExtraBold,
} from '@expo-google-fonts/baloo-2';
import {
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useState } from 'react';
import { Platform, StatusBar as RNStatusBar, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { enableFreeze } from 'react-native-screens';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppKit, AppKitProvider } from '@reown/appkit-react-native';

import { TxBanner } from '@/components/tx-banner';
import { NetworkGuard } from '@/components/network-guard';
import { appKit } from '@/lib/appkit';
import { colors } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

// Las pantallas fuera de foco dejan de re-renderizar: menos trabajo en cada
// cambio de tab y transiciones más parejas.
enableFreeze(true);

// Fondo de la ventana nativa. Sin esto, cualquier hueco durante una transición
// muestra el blanco por defecto del sistema.
SystemUI.setBackgroundColorAsync(colors.cream);

// Android: que la ventana llegue hasta arriba de todo y el contenido se dibuje
// debajo de la barra de estado. Sin esto la ventana arranca recién bajo la
// barra y esa franja la pinta el sistema (negra). En SDK 57 `expo-status-bar`
// ya no expone `backgroundColor` — el modelo es edge-to-edge: la barra es
// transparente y el color lo pone tu propia pantalla, que es el crema del
// `Screen` gracias al `paddingTop: insets.top`.
if (Platform.OS === 'android') {
  RNStatusBar.setTranslucent(true);
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}

export default function RootLayout() {
  // Una sola instancia por montaje de la app; nunca recrear en cada render.
  const [queryClient] = useState(makeQueryClient);

  const [fontsLoaded] = useFonts({
    Baloo2_500Medium,
    Baloo2_600SemiBold,
    Baloo2_700Bold,
    Baloo2_800ExtraBold,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  // Fondo crema mientras cargan las fuentes, para no encadenar splash → blanco.
  if (!fontsLoaded) return <View className="flex-1 bg-cream" />;

  const tree = (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.cream }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.cream },
              animation: 'slide_from_right',
              animationDuration: 220,
              freezeOnBlur: true,
              // El gesto de volver hace que la app se sienta nativa.
              gestureEnabled: true,
            }}
          >
            <Stack.Screen name="index" options={{ animation: 'none' }} />
            <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
            <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
            <Stack.Screen name="joined" options={{ animation: 'fade', gestureEnabled: false }} />
          </Stack>
          {/* Fuera del Stack: así sobrevive a los cambios de pantalla. */}
          <TxBanner />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );

  // Sin Project ID la app funciona igual, sólo que sin wallets externas.
  if (!appKit) return tree;

  return (
    <AppKitProvider instance={appKit}>
      {tree}
      <NetworkGuard />
      {/*
        El envoltorio con posición absoluta es un rodeo documentado por Reown:
        con Expo Router en Android, el modal no se abre sin esto.
      */}
      <View style={{ position: 'absolute', height: '100%', width: '100%' }} pointerEvents="box-none">
        <AppKit />
      </View>
    </AppKitProvider>
  );
}
