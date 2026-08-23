import type { Participation, Pool } from '@/data/types';
import { money, percentOf, type Usdt } from '@/lib/money';

/**
 * Todo el texto que se ve en pantalla sobre un chanchito se deriva acá.
 * Ninguna de estas frases se guarda: se recalculan en cada render, así que
 * "quedan 6 días" sigue siendo verdad mañana.
 */

const DAY_MS = 86_400_000;

/** Avance de la meta, 0-100. */
export function poolProgress(pool: Pool): number {
  return percentOf(pool.raised, pool.goal);
}

/** Cuánto falta para llegar a la meta. */
export function poolMissing(pool: Pool): Usdt {
  const missing = pool.goal - pool.raised;
  return missing > 0n ? missing : 0n;
}

export function poolMissingLabel(pool: Pool): string {
  return money(poolMissing(pool));
}

/** "4 de 5 cupos" */
export function poolSeatsLabel(pool: Pool): string {
  return `${pool.filled} de ${pool.capacity} cupos`;
}

/** "4/5 cupos" — versión corta para las tarjetas chicas. */
export function poolSeatsShort(pool: Pool): string {
  return `${pool.filled}/${pool.capacity} cupos`;
}

export function poolIsFull(pool: Pool): boolean {
  return pool.filled >= pool.capacity;
}

/** Días que faltan para que cierre la inscripción. Nunca negativo. */
export function poolDaysLeft(pool: Pool, now = Date.now()): number {
  const days = Math.ceil((pool.joinDeadline - now) / DAY_MS);
  return days > 0 ? days : 0;
}

export function poolJoinClosed(pool: Pool, now = Date.now()): boolean {
  return now >= pool.joinDeadline || poolIsFull(pool);
}

/** "4 de 5 cupos · quedan 6 días para unirte" */
export function poolJoinLabel(pool: Pool, now = Date.now()): string {
  const seats = poolSeatsLabel(pool);

  if (pool.status === 'closed') return `${seats} · terminado`;
  if (pool.status === 'active') return `${seats} · en marcha`;
  if (poolFailedToFill(pool, now)) return `${seats} · no se llenó`;

  const days = poolDaysLeft(pool, now);
  if (days === 0) return `${seats} · cierra hoy`;
  if (days === 1) return `${seats} · queda 1 día para unirte`;
  return `${seats} · quedan ${days} días para unirte`;
}

/**
 * El chanchito está esperando que se llene: la plata está adentro pero
 * todavía no genera nada y el plazo no arrancó.
 */
export function poolIsWaiting(pool: Pool): boolean {
  return pool.status === 'waiting';
}

/** Venció la inscripción sin llenarse: cada uno puede sacar todo, sin comisión. */
export function poolFailedToFill(pool: Pool, now = Date.now()): boolean {
  return pool.status === 'waiting' && now >= pool.joinDeadline;
}

/** Cuántos faltan para que arranque. */
export function poolSeatsMissing(pool: Pool): number {
  const missing = pool.capacity - pool.filled;
  return missing > 0 ? missing : 0;
}

/**
 * Qué pasa con el plazo, según el estado.
 *
 * Antes de llenarse no hay una fecha que mostrar: el reloj no arrancó. Decir
 * "faltan 4 meses" ahí sería mentira.
 */
export function poolTimeLabel(pool: Pool, demoAccel: boolean, now = Date.now()): string {
  if (pool.status === 'closed') return 'terminado';

  if (pool.status === 'waiting') {
    if (poolFailedToFill(pool, now)) return 'no se llenó a tiempo';
    const missing = poolSeatsMissing(pool);
    return missing === 1
      ? 'arranca cuando entre 1 más'
      : `arranca cuando entren ${missing} más`;
  }

  if (!pool.maturity) return durationLabel(pool.durationMonths, demoAccel);
  const days = Math.ceil((pool.maturity - now) / DAY_MS);
  if (days <= 0) return 'listo para cerrar';
  if (demoAccel) return 'faltan 2 min (demo)';
  if (days === 1) return 'falta 1 día';
  if (days < 45) return `faltan ${days} días`;
  const months = Math.round(days / 30);
  return `faltan ${months} meses`;
}

/** Casi lleno: el 🔥 de las tarjetas. */
export function poolIsHot(pool: Pool): boolean {
  return poolProgress(pool) >= 85;
}

/** "4 meses" — o la versión acelerada del modo demo. */
export function durationLabel(months: number, demoAccel: boolean): string {
  return `${months} ${demoAccel ? 'min (demo)' : 'meses'}`;
}

/* ----------------------------- participaciones ---------------------------- */

export function participationTotal(part: Participation): Usdt {
  return part.deposited + part.yieldEarned;
}

/** "4 de 5" — cuántos siguen adentro. */
export function participationActiveLabel(part: Participation): string {
  return `${part.activeCount} de ${part.totalCount}`;
}

export function participationRemainingLabel(part: Participation, demoAccel: boolean): string {
  if (part.status === 'waiting') return 'esperando que se llene';
  if (part.status === 'closed') return 'terminado';
  if (demoAccel) return 'faltan 2 min (demo)';
  const months = part.durationMonths;
  return months === 1 ? 'falta 1 mes' : `faltan ${months} meses`;
}

/** "0x8f…3a2" — la cuenta, acortada para mostrar. */
export function shortAccount(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
