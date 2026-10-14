import { ARENAS_POR_DERBI, type Arena } from "../data/arenas";
import { PERSONAJES, personaje } from "../data/personajes";
import { piezasClasicas, type PiezasCarrito, type Tamano } from "../data/piezas";
import { Azar } from "./azar";
import type { ConfigDerbi, Participante } from "./derbi";

export type NivelDerbi = 1 | 2 | 3 | 4;

/** Piezas de un rival como en el original: cada una = min(azar(0..nivel-1), 2). */
export function piezasRival(azar: Azar, nivel: NivelDerbi): PiezasCarrito {
  const tamano = (): Tamano => Math.min(azar.entero(nivel), 2) as Tamano;
  return piezasClasicas(tamano(), tamano(), tamano());
}

export interface OpcionesDerbiClasico {
  semilla: number;
  nivel: NivelDerbi;
  arena?: Arena;
  /** id del personaje del jugador; null = derbi solo con IA. */
  jugador: string | null;
  piezasJugador?: PiezasCarrito;
}

/** Derbi con las piezas clásicas: el jugador contra 5 rivales al azar sin repetir. */
export function armarDerbiClasico(o: OpcionesDerbiClasico): ConfigDerbi {
  // Azar separado del de la simulación, para que armar el derbi no cambie lo que pasa en él.
  const azar = new Azar(o.semilla ^ 0x9e3779b9);
  const jugador: Participante | null = o.jugador
    ? { personaje: personaje(o.jugador), piezas: o.piezasJugador ?? piezasClasicas(1, 1, 1) }
    : null;
  const rivales = azar
    .barajar(PERSONAJES.filter((p) => p.id !== o.jugador))
    .slice(0, 5)
    .map((p) => ({ personaje: p, piezas: piezasRival(azar, o.nivel) }));
  return { semilla: o.semilla, arena: o.arena ?? ARENAS_POR_DERBI[o.nivel], jugador, rivales };
}
