import type { Stats } from "../sim/stats";

/**
 * Constantes del original (config.xml y Car.as, ver docs/analisis-original.md §2).
 * Unidades: píxeles y grados por fotograma, a 31 fotogramas por segundo.
 */
export const FISICA = {
  fps: 31,
  /** Grados que gira por fotograma a velocidad máxima. */
  giroMax: 6,
  desaceleracion: 0.975,
  friccionInercia: 0.8,
  friccionImpacto: 0.9,
  amortiguacionGiro: 0.95,
  /** Empuje mínimo para salir de una pared (en el original un carrito lento podía quedarse pegado). */
  empujeMinimoPared: 1,
} as const;

export const STATS_BASE: Stats = {
  aceleracion: 0.75,
  velocidadMax: 20,
  umbralDerrape: 15,
  deslizamiento: 3,
  peso: 0,
  golpeRecibido: 1,
};

export const VIDA = {
  carroceria: 100,
  motor: 100,
  rueda: 25,
  /** Un carrito queda eliminado cuando la suma de todas sus vidas baja de este valor. */
  minima: 100,
} as const;

export const DANO = {
  /** El jugador recibe un 10% menos de daño en los choques, como en el original. */
  factorJugador: 0.9,
  /** Desde este daño un golpe cuenta como "fuerte" (frases, sacudida de cámara). */
  golpeFuerte: 10,
} as const;
