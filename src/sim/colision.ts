import type { Carrito, IndiceRueda } from "./tipos";
import { aRadianes, punto, restar, type Vec } from "./vec";

/** Rectángulo rotado. */
export interface Caja {
  centro: Vec;
  mitadLargo: number;
  mitadAncho: number;
  /** Radianes. */
  angulo: number;
}

/** Rectángulo en coordenadas del carrito, como fracción de su largo (x, hacia adelante) y ancho (y). */
export interface RectLocal {
  x: number;
  y: number;
  mitadLargo: number;
  mitadAncho: number;
}

export type Zona = "frente" | "trasera" | IndiceRueda;

export const CUERPO: RectLocal = { x: 0, y: 0, mitadLargo: 0.5, mitadAncho: 0.5 };

/**
 * Zonas de daño, con las proporciones del clip cCollision del original:
 * cFront (mitad delantera) → motor, cBack (mitad trasera) → carrocería, cWheel0..3 (casi un cuarto cada una) → ruedas.
 * Un golpe siempre toca el frente o la trasera, y casi siempre alguna rueda.
 */
export const ZONAS: readonly { zona: Zona; rect: RectLocal }[] = [
  { zona: "frente", rect: { x: 0.25, y: 0, mitadLargo: 0.25, mitadAncho: 0.5 } },
  { zona: "trasera", rect: { x: -0.25, y: 0, mitadLargo: 0.25, mitadAncho: 0.5 } },
  { zona: 0, rect: { x: 0.23, y: -0.319, mitadLargo: 0.228, mitadAncho: 0.181 } },
  { zona: 1, rect: { x: 0.23, y: 0.319, mitadLargo: 0.228, mitadAncho: 0.181 } },
  { zona: 2, rect: { x: -0.216, y: -0.319, mitadLargo: 0.218, mitadAncho: 0.181 } },
  { zona: 3, rect: { x: -0.216, y: 0.319, mitadLargo: 0.218, mitadAncho: 0.181 } },
];

/** Caja de un rectángulo local para un carrito en cierta posición y rotación (en grados). */
export function cajaEn(
  centro: Vec,
  rotacion: number,
  largo: number,
  ancho: number,
  rect: RectLocal = CUERPO,
): Caja {
  const angulo = aRadianes(rotacion);
  const cos = Math.cos(angulo);
  const sin = Math.sin(angulo);
  const lx = rect.x * largo;
  const ly = rect.y * ancho;
  return {
    centro: { x: centro.x + lx * cos - ly * sin, y: centro.y + lx * sin + ly * cos },
    mitadLargo: rect.mitadLargo * largo,
    mitadAncho: rect.mitadAncho * ancho,
    angulo,
  };
}

export const cajaCarrito = (c: Carrito, rect: RectLocal = CUERPO): Caja =>
  cajaEn(c.pos, c.rotacion, c.largo, c.ancho, rect);

export function esquinas(caja: Caja): Vec[] {
  const cos = Math.cos(caja.angulo);
  const sin = Math.sin(caja.angulo);
  const lx = caja.mitadLargo;
  const ly = caja.mitadAncho;
  return [
    [lx, ly],
    [-lx, ly],
    [-lx, -ly],
    [lx, -ly],
  ].map(([x = 0, y = 0]) => ({
    x: caja.centro.x + x * cos - y * sin,
    y: caja.centro.y + x * sin + y * cos,
  }));
}

function ejes(caja: Caja): [Vec, Vec] {
  const cos = Math.cos(caja.angulo);
  const sin = Math.sin(caja.angulo);
  return [
    { x: cos, y: sin },
    { x: -sin, y: cos },
  ];
}

function proyectar(caja: Caja, eje: Vec): [number, number] {
  const [largoEje, anchoEje] = ejes(caja);
  const centro = punto(caja.centro, eje);
  const radio =
    caja.mitadLargo * Math.abs(punto(largoEje, eje)) + caja.mitadAncho * Math.abs(punto(anchoEje, eje));
  return [centro - radio, centro + radio];
}

/** Teorema del eje separador para dos rectángulos rotados. */
export function seSuperponen(a: Caja, b: Caja): boolean {
  for (const eje of [...ejes(a), ...ejes(b)]) {
    const [a0, a1] = proyectar(a, eje);
    const [b0, b1] = proyectar(b, eje);
    if (a1 <= b0 || b1 <= a0) return false;
  }
  return true;
}

/** Zonas de `victima` que toca la carrocería de `atacante`. */
export function zonasTocadas(victima: Carrito, atacante: Carrito): Zona[] {
  const cuerpo = cajaCarrito(atacante);
  return ZONAS.filter((z) => seSuperponen(cajaCarrito(victima, z.rect), cuerpo)).map((z) => z.zona);
}

/** Mitad del carrito (frente o trasera) más cercana a un punto. */
export function mitadMasCercana(c: Carrito, p: Vec): "frente" | "trasera" {
  const angulo = aRadianes(c.rotacion);
  const adelante = { x: Math.cos(angulo), y: Math.sin(angulo) };
  return punto(restar(p, c.pos), adelante) >= 0 ? "frente" : "trasera";
}
