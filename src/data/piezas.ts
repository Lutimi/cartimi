import type { Modificador } from "../sim/stats";

export type TipoPieza = "motor" | "carroceria" | "ruedas";

/** 0 = pequeña, 1 = mediana, 2 = grande. */
export type Tamano = 0 | 1 | 2;

export interface Pieza {
  id: string;
  nombre: string;
  tipo: TipoPieza;
  tamano: Tamano;
  mods: Modificador[];
}

export interface Carroceria extends Pieza {
  tipo: "carroceria";
  /** Medidas en píxeles (las del dibujo del original); el largo va en el sentido de la marcha. */
  largo: number;
  ancho: number;
}

export interface PiezasCarrito {
  motor: Pieza;
  carroceria: Carroceria;
  ruedas: Pieza;
}

// Las 9 piezas del original con sus mismos modificadores (docs/analisis-original.md §1).
// El catálogo del diseño nuevo (docs/diseno.md §5) se agrega en la fase 4.

export const MOTORES_CLASICOS: readonly [Pieza, Pieza, Pieza] = [
  { id: "secador", nombre: "Secador", tipo: "motor", tamano: 0, mods: [] },
  {
    id: "licuadora",
    nombre: "Licuadora",
    tipo: "motor",
    tamano: 1,
    mods: [
      { stat: "aceleracion", suma: 0.5 },
      { stat: "velocidadMax", suma: 2 },
    ],
  },
  {
    id: "cortacesped",
    nombre: "Cortacésped",
    tipo: "motor",
    tamano: 2,
    mods: [
      { stat: "aceleracion", suma: 1 },
      { stat: "velocidadMax", suma: 4 },
    ],
  },
];

export const CARROCERIAS_CLASICAS: readonly [Carroceria, Carroceria, Carroceria] = [
  {
    id: "tostadora",
    nombre: "Tostadora",
    tipo: "carroceria",
    tamano: 0,
    largo: 49,
    ancho: 24,
    mods: [
      { stat: "aceleracion", suma: 0.25 },
      { stat: "velocidadMax", suma: 2 },
      { stat: "peso", suma: 0.5 },
    ],
  },
  {
    id: "barril",
    nombre: "Barril",
    tipo: "carroceria",
    tamano: 1,
    largo: 55,
    ancho: 31,
    mods: [
      { stat: "peso", suma: 1 },
      { stat: "golpeRecibido", suma: -0.3 },
    ],
  },
  {
    id: "radiador",
    nombre: "Radiador",
    tipo: "carroceria",
    tamano: 2,
    largo: 73,
    ancho: 41,
    mods: [
      { stat: "aceleracion", suma: -0.35 },
      { stat: "velocidadMax", suma: -2 },
      { stat: "peso", suma: 1.5 },
      { stat: "golpeRecibido", suma: -0.6 },
    ],
  },
];

export const RUEDAS_CLASICAS: readonly [Pieza, Pieza, Pieza] = [
  { id: "rueditas", nombre: "Rueditas", tipo: "ruedas", tamano: 0, mods: [] },
  {
    id: "medianas",
    nombre: "Ruedas medianas",
    tipo: "ruedas",
    tamano: 1,
    mods: [
      { stat: "umbralDerrape", suma: 2 },
      { stat: "deslizamiento", suma: -1.5 },
    ],
  },
  {
    id: "orugas",
    nombre: "Orugas",
    tipo: "ruedas",
    tamano: 2,
    mods: [
      { stat: "umbralDerrape", suma: 4 },
      { stat: "deslizamiento", suma: -3 },
    ],
  },
];

export function piezasClasicas(motor: Tamano, carroceria: Tamano, ruedas: Tamano): PiezasCarrito {
  return {
    motor: MOTORES_CLASICOS[motor],
    carroceria: CARROCERIAS_CLASICAS[carroceria],
    ruedas: RUEDAS_CLASICAS[ruedas],
  };
}
