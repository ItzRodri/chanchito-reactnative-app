import * as LocalAuthentication from 'expo-local-authentication';

/**
 * Pide la autenticación del dispositivo (huella, cara o PIN) antes de mostrar
 * algo sensible.
 *
 * Si el teléfono no tiene ninguna protección configurada, no hay nada contra
 * qué autenticar: en ese caso se deja pasar y la pantalla avisa. Bloquear al
 * dueño de su propia frase por no tener PIN sería peor que el riesgo.
 */
export async function requireDeviceAuth(reason: string): Promise<
  { ok: true } | { ok: false; reason: 'cancelled' | 'unavailable' }
> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();

  if (!hasHardware || !isEnrolled) return { ok: false, reason: 'unavailable' };

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: reason,
    cancelLabel: 'Cancelar',
    // Cae al PIN del teléfono si la biometría falla.
    disableDeviceFallback: false,
  });

  return result.success ? { ok: true } : { ok: false, reason: 'cancelled' };
}
