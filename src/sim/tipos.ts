import type { Personaje } from "../data/personajes";
import type { PiezasCarrito } from "../data/piezas";
import type { Azar } from "./azar";
import type { Stats } from "./stats";
import type { Vec } from "./vec";

export interface Entrada {
  adelante: boolean;
  atras: boolean;
  izquierda: boolean;
  derecha: boolean;
  nitro?: boolean;
  freno?: boolean;
}

export const SIN_ENTRADA: Readonly<Entrada> = {
  adelante: false,
  atras: false,
  izquierda: false,
  derecha: false,
};

/** 0 = delantera izquierda, 1 = delantera derecha, 2 = trasera izquierda, 3 = trasera derecha. */
export type IndiceRueda = 0 | 1 | 2 | 3;
export const INDICES_RUEDA: readonly IndiceRueda[] = [0, 1, 2, 3];

export type ModoIA = "atacar" | "huir" | "centro";

export interface EstadoIA {
  modo: ModoIA;
  objetivo: number | null;
  /** Fotogramas que le quedan en el modo actual (huir y centro). */
  contador: number;
}

export interface Carrito {
  id: number;
  personaje: Personaje;
  esJugador: boolean;
  piezas: PiezasCarrito;
  /** Estadísticas sin daño, calculadas a partir de las piezas. */
  stats: Stats;
  largo: number;
  ancho: number;

  pos: Vec;
  posAnterior: Vec;
  /** Grados: 0 = derecha, 90 = abajo. */
  rotacion: number;
  /** Velocidad con signo en el sentido de la marcha (negativa = reversa). */
  velocidad: number;
  velocidadAngular: number;
  direccionGiro: -1 | 0 | 1;
  entradaAnterior: Entrada;

  velMotor: Vec;
  velInercia: Vec;
  velImpacto: Vec;
  velTotal: Vec;

  /** Valores actuales: cambian con el daño. */
  aceleracion: number;
  umbralDerrape: number;
  deslizamiento: number;

  vidaCarroceria: number;
  vidaMotor: number;
  vidaRuedas: [number, number, number, number];

  derrapando: boolean;
  eliminado: boolean;
  ultimoRival: number | null;
  /** null para el jugador. */
  ia: EstadoIA | null;
}

export interface Limites {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** Lo que la IA necesita saber del derbi. */
export interface Mundo {
  readonly carritos: readonly Carrito[];
  readonly limites: Limites;
  readonly azar: Azar;
}

export type Evento =
  | {
      tipo: "choque";
      atacante: number;
      victima: number;
      danoAtacante: number;
      danoVictima: number;
      punto: Vec;
    }
  | { tipo: "eliminado"; id: number; por: number | null }
  | { tipo: "pared"; id: number }
  | { tipo: "muerteSubita" }
  | { tipo: "fin"; ganador: number | null };
