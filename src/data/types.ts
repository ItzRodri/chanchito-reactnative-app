import type { Mood } from '@/components/chanchito-mascot';
import type { Bps, Usdt } from '@/lib/money';

export type Visibility = 'public' | 'private';

/**
 * En qué momento de su vida está el chanchito.
 *
 * `waiting` es el estado que más cambia la interfaz: la plata ya está adentro
 * pero todavía no genera nada, porque faltan cupos. El plazo tampoco corre.
 */
export type PoolStatus = 'waiting' | 'active' | 'closed';

/**
 * Un chanchito.
 *
 * Sólo datos crudos: números, timestamps y montos en unidades base. Nada de
 * texto ya armado — todo lo que se lee en pantalla ("4 de 5 cupos · quedan 6
 * días") se calcula en `src/lib/pool.ts`.
 *
 * El motivo es concreto: del contrato llegan `filled`, `capacity` y un
 * `deadline` en segundos. Si el tipo guardara la frase hecha, habría que
 * inventarla en la capa de datos y no habría forma de traducirla ni de
 * recalcularla cuando cambia la hora.
 */
export type Pool = {
  /** Hoy un slug ("salta"); con contratos, la address del vault. */
  id: string;
  name: string;
  mood: Mood;
  tag: string;
  visibility: Visibility;
  /** Código de invitación, sólo para privados. */
  code?: string;

  /** Mínimo y máximo que puede poner cada participante. */
  min: Usdt;
  max: Usdt;
  /** Meta total del grupo y cuánto lleva juntado. */
  goal: Usdt;
  raised: Usdt;

  capacity: number;
  filled: number;

  status: PoolStatus;
  durationMonths: number;
  /** Hasta cuándo se puede entrar, en epoch ms. */
  joinDeadline: number;
  /** Cuándo se llenó y arrancó todo. `null` si todavía está esperando. */
  activatedAt: number | null;
  /** Cuándo se puede cerrar. `null` hasta que arranque. */
  maturity: number | null;

  /** Tasa anual vigente en basis points (450 = 4,50%). Viene del yield. */
  aprBps: Bps;
};

export type Person = {
  id: string;
  name: string;
  handle: string;
  mood: Mood;
  bg: string;
};

/** Lo que puso una persona en un chanchito. */
export type Participation = {
  id: string;
  poolId: string;
  name: string;
  mood: Mood;

  deposited: Usdt;
  yieldEarned: Usdt;

  /** Avance del grupo, 0-100. */
  progress: number;
  activeCount: number;
  totalCount: number;
  durationMonths: number;

  /**
   * Cuenta desde la que se depositó. El contrato devuelve los fondos a esta
   * misma dirección, así que no se puede reasignar: la UI la muestra fija.
   */
  account: string;

  /** Estado del chanchito al que pertenece. */
  status: PoolStatus;
};

export type AppNotification = {
  id: string;
  icon: string;
  title: string;
  time: string;
  tone: 'mint' | 'paper' | 'coral';
};

export type ProfileStats = {
  saved: Usdt;
  earned: Usdt;
  completed: number;
  abandoned: number;
};
