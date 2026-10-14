import type { Vec } from "../sim/vec";

export interface Arena {
  id: string;
  nombre: string;
  ancho: number;
  alto: number;
  /** Puntos de salida en orden: el jugador sale del primero. */
  salidas: readonly Vec[];
  /** Cómo se dibuja el piso. */
  decoracion: "franjas" | "cuadricula" | "cancha" | "nieve";
  colorPiso: number;
  colorLineas: number;
  colorBorde: number;
  /** Segundos hasta que empieza la muerte súbita. */
  muerteSubita: number;
  /** Píxeles por fotograma que avanza cada borde durante la muerte súbita. */
  velocidadCierre: number;
  /** Fracción del tamaño original hasta la que se puede cerrar la arena. */
  tamanoMinimo: number;
}

const MUERTE_SUBITA = { muerteSubita: 90, velocidadCierre: 0.6, tamanoMinimo: 0.35 } as const;

// Tamaños y salidas de los fondos BG_1..BG_4 del original (paredes cTop/cBot/cLeft/cRight y puntos "0".."7").
export const ARENAS = {
  patio: {
    id: "patio",
    nombre: "Patio trasero",
    ancho: 1200,
    alto: 800,
    salidas: [
      { x: 150, y: 159 },
      { x: 548, y: 73 },
      { x: 140, y: 476 },
      { x: 417, y: 654 },
      { x: 628, y: 401 },
      { x: 957, y: 407 },
      { x: 781, y: 676 },
      { x: 946, y: 200 },
    ],
    decoracion: "franjas",
    colorPiso: 0x6a994e,
    colorLineas: 0x5f8c45,
    colorBorde: 0x5b3a21,
    ...MUERTE_SUBITA,
  },
  chatarreria: {
    id: "chatarreria",
    nombre: "Chatarrería",
    ancho: 1480,
    alto: 1128,
    salidas: [
      { x: 248, y: 242 },
      { x: 725, y: 89 },
      { x: 115, y: 647 },
      { x: 406, y: 918 },
      { x: 715, y: 875 },
      { x: 1262, y: 664 },
      { x: 1094, y: 951 },
      { x: 1252, y: 243 },
    ],
    decoracion: "cuadricula",
    colorPiso: 0x8d7b68,
    colorLineas: 0x7f6d5b,
    colorBorde: 0x4a4e57,
    ...MUERTE_SUBITA,
  },
  cancha: {
    id: "cancha",
    nombre: "Cancha de la escuela",
    ancho: 1804,
    alto: 1270,
    salidas: [
      { x: 235, y: 227 },
      { x: 977, y: 114 },
      { x: 147, y: 800 },
      { x: 519, y: 1136 },
      { x: 1028, y: 1180 },
      { x: 1632, y: 753 },
      { x: 1571, y: 1084 },
      { x: 1560, y: 243 },
    ],
    decoracion: "cancha",
    colorPiso: 0x4f9d5d,
    colorLineas: 0xe8f1e4,
    colorBorde: 0x2f4858,
    ...MUERTE_SUBITA,
  },
  nieve: {
    id: "nieve",
    nombre: "Plaza nevada",
    ancho: 1804,
    alto: 1270,
    salidas: [
      { x: 235, y: 227 },
      { x: 978, y: 113 },
      { x: 147, y: 742 },
      { x: 519, y: 1137 },
      { x: 1029, y: 1182 },
      { x: 1635, y: 753 },
      { x: 1573, y: 1085 },
      { x: 1562, y: 242 },
    ],
    decoracion: "nieve",
    colorPiso: 0xe6eef5,
    colorLineas: 0xcfdbe6,
    colorBorde: 0x6b7c8f,
    ...MUERTE_SUBITA,
  },
} as const satisfies Record<string, Arena>;

/** Arena de cada derbi, en el orden del original. */
export const ARENAS_POR_DERBI: Readonly<Record<1 | 2 | 3 | 4, Arena>> = {
  1: ARENAS.patio,
  2: ARENAS.chatarreria,
  3: ARENAS.cancha,
  4: ARENAS.nieve,
};
