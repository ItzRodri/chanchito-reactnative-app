/**
 * Manejo de plata.
 *
 * Regla única: **la plata nunca se guarda como `number`**.
 *
 * En JavaScript `0.1 + 0.2 === 0.30000000000000004`. Con saldos de usuarios eso
 * termina en descuadres imposibles de rastrear. Y en la cadena los montos ya
 * son enteros: USDT tiene 6 decimales, así que "$1,50" viaja como `1500000`.
 *
 * Entonces: `bigint` en unidades base en TODA la app, y se convierte a texto
 * recién en el momento de dibujarlo en pantalla.
 */

/** USDT usa 6 decimales, tanto en Ethereum como en el resto de las redes. */
export const USDT_DECIMALS = 6;

const ONE_UNIT = 10n ** BigInt(USDT_DECIMALS);

/** Monto en unidades base (lo que entiende el contrato). */
export type Usdt = bigint;

/** 50 → 50_000000n. Para montos enteros de dólares (el slider, los presets). */
export function usdtFromWhole(dollars: number): Usdt {
  if (!Number.isInteger(dollars)) {
    throw new Error(`usdtFromWhole espera un entero, recibió ${dollars}`);
  }
  return BigInt(dollars) * ONE_UNIT;
}

/**
 * "12.34" → 12_340000n. Parsea texto sin pasar nunca por punto flotante.
 * Devuelve `null` si el texto no es un monto válido.
 */
export function usdtFromString(input: string): Usdt | null {
  const clean = input.trim().replace(',', '.');
  if (!/^\d*\.?\d*$/.test(clean) || clean === '' || clean === '.') return null;

  const [whole = '0', frac = ''] = clean.split('.');
  if (frac.length > USDT_DECIMALS) return null;

  const padded = frac.padEnd(USDT_DECIMALS, '0');
  return BigInt(whole || '0') * ONE_UNIT + BigInt(padded || '0');
}

/** Parte entera en dólares. 50_500000n → 50. Sólo para el slider. */
export function usdtToWhole(value: Usdt): number {
  return Number(value / ONE_UNIT);
}

type FormatOptions = {
  /** Decimales a mostrar. Por defecto 2, como cualquier precio. */
  decimals?: number;
  /** Oculta ",00" cuando el monto es redondo. Por defecto true. */
  trimZeros?: boolean;
  /** Antepone "+" a los positivos (ganancias). */
  signed?: boolean;
};

/**
 * 4_200000n → "4,20" · 1240_000000n → "1.240"
 * Formato es-AR: punto para miles, coma para decimales.
 * No incluye el "$" — eso lo pone la pantalla.
 */
export function formatUsdt(value: Usdt, options: FormatOptions = {}): string {
  const { decimals = 2, trimZeros = true, signed = false } = options;

  const negative = value < 0n;
  const abs = negative ? -value : value;

  const whole = abs / ONE_UNIT;
  const remainder = abs % ONE_UNIT;

  // Redondeo al alza a partir de la mitad, sin tocar punto flotante.
  const scale = 10n ** BigInt(USDT_DECIMALS - decimals);
  let fraction = remainder / scale;
  let carry = 0n;
  if (decimals < USDT_DECIMALS && remainder % scale >= scale / 2n) {
    fraction += 1n;
    if (fraction >= 10n ** BigInt(decimals)) {
      fraction = 0n;
      carry = 1n;
    }
  }

  const wholeText = groupThousands(whole + carry);
  const fractionText = decimals > 0 ? fraction.toString().padStart(decimals, '0') : '';

  const hideFraction = trimZeros && /^0*$/.test(fractionText);
  const body = hideFraction || !fractionText ? wholeText : `${wholeText},${fractionText}`;

  const sign = negative ? '−' : signed ? '+' : '';
  return `${sign}${body}`;
}

/** Atajo para el caso más común: "$1.240" */
export function money(value: Usdt, options?: FormatOptions): string {
  const formatted = formatUsdt(value, options);
  // El signo va antes del símbolo: "−$5", "+$86".
  if (formatted.startsWith('−') || formatted.startsWith('+')) {
    return `${formatted[0]}$${formatted.slice(1)}`;
  }
  return `$${formatted}`;
}

function groupThousands(value: bigint): string {
  const digits = value.toString();
  let out = '';
  for (let i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 === 0) out += '.';
    out += digits[i];
  }
  return out;
}

/* ------------------------------- porcentajes ------------------------------ */

/**
 * Tasas en *basis points* (1 bp = 0,01%). 450 bps = 4,50% anual.
 * Se guardan como entero por el mismo motivo que los montos.
 */
export type Bps = number;

export const BPS_DENOMINATOR = 10_000n;

/**
 * Ganancia estimada de un depósito, con matemática entera.
 * `amount * tasa * meses / (10000 * 12)`
 */
export function estimateYield(amount: Usdt, aprBps: Bps, months: number): Usdt {
  return (amount * BigInt(Math.round(aprBps)) * BigInt(months)) / (BPS_DENOMINATOR * 12n);
}

/** 450 → "4,5%" */
export function formatBps(bps: Bps): string {
  const percent = bps / 100;
  return `${percent.toFixed(percent % 1 === 0 ? 0 : 1).replace('.', ',')}%`;
}

/** Porcentaje de avance 0-100, redondeado, sin dividir por cero. */
export function percentOf(part: Usdt, total: Usdt): number {
  if (total <= 0n) return 0;
  return Number((part * 100n) / total);
}
