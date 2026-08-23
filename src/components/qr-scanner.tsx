import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { Modal, Text, View } from 'react-native';

import { Button, HardPressable } from '@/components/ui';

type Props = {
  visible: boolean;
  onClose: () => void;
  onScan: (value: string) => void;
  title?: string;
  hint?: string;
};

/**
 * Escáner de QR.
 *
 * Acepta tanto una dirección pelada (`0x…`) como el formato `ethereum:0x…`
 * que usan varias wallets al generar su código: quien escanea no debería tener
 * que saber cuál de los dos le tocó.
 */
export function QrScanner({ visible, onClose, onScan, title = 'Escaneá el código', hint }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  // Un QR dispara muchas lecturas por segundo; sin esto se llama N veces.
  const handled = useRef(false);

  useEffect(() => {
    if (visible) handled.current = false;
  }, [visible]);

  function handle(raw: string) {
    if (handled.current) return;
    handled.current = true;

    const value = raw.trim();
    // `ethereum:0xABC…@11155111?value=0` → nos quedamos con la dirección.
    const match = /0x[a-fA-F0-9]{40}/.exec(value);
    onScan(match ? match[0] : value);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-ink">
        <View className="px-5 pb-3 pt-14">
          <Text className="font-display text-[20px] text-cream">{title}</Text>
          {hint ? (
            <Text className="mt-1 font-body text-[12px] text-[#d8c3ba]">{hint}</Text>
          ) : null}
        </View>

        {!permission ? null : !permission.granted ? (
          <View className="flex-1 items-center justify-center gap-3 px-8">
            <Text className="text-center font-body text-[13px] leading-5 text-cream">
              Necesitamos la cámara para leer el código. No se guarda ninguna imagen.
            </Text>
            <Button label="Permitir cámara" onPress={requestPermission} />
          </View>
        ) : (
          <View className="flex-1">
            <CameraView
              style={{ flex: 1 }}
              facing="back"
              enableTorch={torch}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={({ data }) => handle(data)}
            />
            {/* Marco guía: ayuda a encuadrar sin tapar la lectura. */}
            <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
              <View className="h-64 w-64 rounded-3xl border-4 border-pink" />
            </View>
          </View>
        )}

        <View className="flex-row gap-2.5 px-5 pb-10 pt-4">
          <HardPressable
            onPress={() => setTorch((t) => !t)}
            flat
            haptic
            container="flex-1"
            className="items-center rounded-2xl border-[2.5px] border-cream bg-ink p-3"
            accessibilityRole="button"
            accessibilityLabel="Linterna"
          >
            <Text className="font-display text-xs text-cream">{torch ? '🔦 Apagar' : '🔦 Luz'}</Text>
          </HardPressable>
          <HardPressable
            onPress={onClose}
            flat
            haptic
            container="flex-1"
            className="items-center rounded-2xl border-[2.5px] border-cream bg-cream p-3"
            accessibilityRole="button"
            accessibilityLabel="Cancelar"
          >
            <Text className="font-display text-xs text-ink">Cancelar</Text>
          </HardPressable>
        </View>
      </View>
    </Modal>
  );
}
