import { BPS_DENOMINATOR, type Usdt } from './money';

/**
 * Comisión de servicio sobre los envíos.
 *
 * Es un porcentaje plano con piso y techo, a propósito: un escalón duro
 * ("hasta $1.000 una tasa, arriba otra") se rompe solo, porque mandar dos
 * veces $999 saldría diez veces más barato que mandar $1.998 una vez.
 *
 * Con piso y techo la curva es continua: los envíos chicos pagan centavos y
 * ninguno paga más de un dólar, sin premiar a quien parta el monto.
 */
export const SEND_FEE_BPS = 25n;              // 0,25%
export const SEND_FEE_MIN: Usdt = 50_000n;    // $0,05
export const SEND_FEE_MAX: Usdt = 1_000_000n; // $1,00

/** A partir de acá la comisión queda clavada en el techo. */
export const SEND_FEE_CAP_FROM: Usdt = (SEND_FEE_MAX * BPS_DENOMINATOR) / SEND_FEE_BPS;

/**
 * Lo que cobra Chanchito por un envío de `amount`.
 *
 * Un envío de cero no paga nada: el piso aplica a envíos reales, no convierte
 * la nada en cinco centavos.
 */
export function sendFee(amount: Usdt): Usdt {
  if (amount <= 0n) return 0n;
  const raw = (amount * SEND_FEE_BPS) / BPS_DENOMINATOR;
  if (raw < SEND_FEE_MIN) return SEND_FEE_MIN;
  if (raw > SEND_FEE_MAX) return SEND_FEE_MAX;
  return raw;
}

/**
 * Total que sale de la billetera: lo enviado más la comisión.
 *
 * El saldo se compara contra esto, no contra `amount`. Si sólo se validara el
 * monto, un envío por el saldo exacto fallaría recién en la cadena.
 */
export function sendTotal(amount: Usdt): Usdt {
  return amount + sendFee(amount);
}
