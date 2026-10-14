export interface Vec {
  x: number;
  y: number;
}

export const vec = (x = 0, y = 0): Vec => ({ x, y });
export const copiar = (v: Vec): Vec => ({ x: v.x, y: v.y });
export const sumar = (a: Vec, b: Vec): Vec => ({ x: a.x + b.x, y: a.y + b.y });
export const restar = (a: Vec, b: Vec): Vec => ({ x: a.x - b.x, y: a.y - b.y });
export const escalar = (v: Vec, k: number): Vec => ({ x: v.x * k, y: v.y * k });
export const punto = (a: Vec, b: Vec): number => a.x * b.x + a.y * b.y;
export const largo = (v: Vec): number => Math.hypot(v.x, v.y);
export const distancia = (a: Vec, b: Vec): number => Math.hypot(a.x - b.x, a.y - b.y);

/** Igual que Point.normalize(l) de Flash: mismo sentido con largo l. El vector cero queda en cero. */
export function conLargo(v: Vec, l: number): Vec {
  const actual = largo(v);
  return actual === 0 ? vec() : escalar(v, l / actual);
}

export const aRadianes = (grados: number): number => (grados * Math.PI) / 180;
export const aGrados = (radianes: number): number => (radianes * 180) / Math.PI;

/** Lleva un ángulo en grados al rango [-180, 180). */
export function normalizarAngulo(grados: number): number {
  return ((((grados + 180) % 360) + 360) % 360) - 180;
}

/** Ángulo en grados de `desde` hacia `hacia` (0 = derecha, 90 = abajo, como en Flash). */
export function anguloHacia(desde: Vec, hacia: Vec): number {
  return aGrados(Math.atan2(hacia.y - desde.y, hacia.x - desde.x));
}

/** Vector unitario en la dirección de un ángulo en grados. */
export function direccion(grados: number): Vec {
  const r = aRadianes(grados);
  return { x: Math.cos(r), y: Math.sin(r) };
}
