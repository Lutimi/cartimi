import { PERSONAJES } from "../src/data/personajes";
import { piezasClasicas, type Tamano } from "../src/data/piezas";
import { crearCarrito } from "../src/sim/carrito";
import { SIN_ENTRADA, type Carrito, type Entrada, type Limites } from "../src/sim/tipos";
import type { Vec } from "../src/sim/vec";

export const ABIERTO: Limites = { x0: -1e6, y0: -1e6, x1: 1e6, y1: 1e6 };

export function carrito(
  opciones: {
    id?: number;
    tamanos?: [Tamano, Tamano, Tamano];
    pos?: Vec;
    rotacion?: number;
    esJugador?: boolean;
  } = {},
): Carrito {
  const [motor, carroceria, ruedas] = opciones.tamanos ?? [0, 0, 0];
  return crearCarrito({
    id: opciones.id ?? 0,
    personaje: PERSONAJES[0]!,
    piezas: piezasClasicas(motor, carroceria, ruedas),
    esJugador: opciones.esJugador ?? false,
    pos: opciones.pos ?? { x: 0, y: 0 },
    rotacion: opciones.rotacion ?? 0,
  });
}

export const entrada = (parcial: Partial<Entrada>): Entrada => ({ ...SIN_ENTRADA, ...parcial });
