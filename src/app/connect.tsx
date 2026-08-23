import { AppKitButton, useAccount } from '@reown/appkit-react-native';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { connectWallet, hasWallet, isBackedUp } from '@/api/wallet';
import { ChanchitoMascot } from '@/components/chanchito-mascot';
import { Bob, Button, Screen } from '@/components/ui';
import { hasWalletConnect } from '@/lib/appkit';
import { useSessionStore } from '@/store/session';

export default function ConnectScreen() {
  const connect = useSessionStore((s) => s.connect);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Wallet externa: AppKit maneja el emparejamiento y avisa por este hook.
  const external = useAccount();

  useEffect(() => {
    if (!external.isConnected || !external.address) return;

    const accounts = (external.allAccounts?.length
      ? external.allAccounts.map((a, index) => ({ address: a.address as `0x${string}`, index }))
      : [{ address: external.address as `0x${string}`, index: 0 }]
    );
    connect(accounts, external.address as `0x${string}`, 'external');
    router.replace('/(tabs)');
  }, [external.isConnected, external.address, external.allAccounts, connect]);

  async function createWallet() {
    setBusy(true);
    setError(null);
    try {
      const alreadyHad = await hasWallet();
      const { accounts, activeAddress } = await connectWallet();
      connect(accounts, activeAddress, 'embedded');

      // Si la wallet es nueva o nunca se respaldó, primero las 12 palabras.
      const backedUp = alreadyHad && (await isBackedUp());
      router.replace(backedUp ? '/(tabs)' : '/wallet/backup');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos crear tu wallet');
      setBusy(false);
    }
  }

  return (
    <Screen className="px-6 pb-8">
      <View className="flex-1 items-center justify-center gap-4">
        <Bob>
          <ChanchitoMascot mood="happy" size={140} />
        </Bob>
        <Text className="max-w-[250px] text-center font-display text-2xl leading-tight text-ink">
          Empezá a{'\n'}ahorrar
        </Text>

        <View className="flex-row items-center gap-2.5 rounded-[18px] border-[2.5px] border-ink bg-mint-tint px-4 py-3">
          <View className="h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-ink bg-mint">
            <Text className="text-[15px]">🔒</Text>
          </View>
          <Text className="font-body-semi text-xs leading-[16px] text-ink">
            No guardamos tu plata.{'\n'}Tu wallet, tus fondos.
          </Text>
        </View>

        {error && (
          <Text className="text-center font-body-bold text-[11px] text-coral">{error}</Text>
        )}
      </View>

      {/* Quien no sabe qué es una wallet: se la creamos. */}
      <Button
        label="Crear mi wallet"
        variant="ink"
        loading={busy}
        onPress={createWallet}
        icon={<View className="h-4 w-4 rounded bg-pink" />}
      />
      <Text className="mt-2.5 text-center font-body text-[11px] text-clay">
        Se genera en tu teléfono y se guarda cifrada
      </Text>

      {/*
        WalletConnect queda fuera por ahora.
        La capa de firma de la app es WDK, que trabaja a partir de la frase
        semilla para poder agrupar operaciones y pagar el gas en USD₮. Una
        wallet externa nunca entrega su frase, así que no puede usar ese
        camino: mostrar el botón llevaría a un error al primer depósito.
      */}
      {false && hasWalletConnect && (
        <>
          <View className="my-4 flex-row items-center gap-2.5">
            <View className="h-0.5 flex-1 bg-sand-deep" />
            <Text className="font-body-bold text-[10px] text-clay">o</Text>
            <View className="h-0.5 flex-1 bg-sand-deep" />
          </View>

          <View className="items-center">
            <AppKitButton label="Ya tengo una wallet" connectStyle={{ width: '100%' }} />
          </View>
          <Text className="mt-2.5 text-center font-body text-[11px] text-clay">
            MetaMask · Rainbow · Trust y 600 más
          </Text>
        </>
      )}

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/wallet/restore')}
        className="mt-4"
        style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1 })}
      >
        <Text className="text-center font-body-bold text-xs text-pink-deep">
          Ya tengo una frase de recuperación
        </Text>
      </Pressable>
    </Screen>
  );
}
