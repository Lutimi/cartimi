import type Phaser from "phaser";
import type { Arena } from "../data/arenas";
import { VIDA } from "../data/fisica";
import type { Tamano } from "../data/piezas";
import { cajaEn, CUERPO, esquinas, type RectLocal } from "../sim/colision";
import { INDICES_RUEDA, type Carrito, type Limites } from "../sim/tipos";
import type { Vec } from "../sim/vec";

type Graficos = Phaser.GameObjects.Graphics;

export interface Pose {
  x: number;
  y: number;
  rotacion: number;
}

/** Grosor de la cerca alrededor de la arena (en el original, los clips cTop/cBot/cLeft/cRight medían 36 px). */
export const BORDE = 36;

/** fillPoints y strokePoints solo leen x e y, aunque los tipos de Phaser 4 pidan Vector2. */
const puntos = (vs: Vec[]): Phaser.Math.Vector2[] => vs as Phaser.Math.Vector2[];

const limitar01 = (t: number): number => Math.min(1, Math.max(0, t));

/** Mezcla dos colores 0xRRGGBB: t = 0 → a, t = 1 → b. */
export function mezclar(a: number, b: number, t: number): number {
  const k = limitar01(t);
  const canal = (desplazamiento: number): number => {
    const ca = (a >> desplazamiento) & 0xff;
    const cb = (b >> desplazamiento) & 0xff;
    return Math.round(ca + (cb - ca) * k) << desplazamiento;
  };
  return canal(16) | canal(8) | canal(0);
}

export function dibujarPiso(g: Graficos, arena: Arena): void {
  const { ancho, alto } = arena;
  g.fillStyle(arena.colorBorde, 1);
  g.fillRect(-BORDE, -BORDE, ancho + 2 * BORDE, alto + 2 * BORDE);
  g.fillStyle(arena.colorPiso, 1);
  g.fillRect(0, 0, ancho, alto);

  switch (arena.decoracion) {
    case "franjas":
      g.fillStyle(arena.colorLineas, 1);
      for (let x = 0; x < ancho; x += 120) g.fillRect(x, 0, 60, alto);
      break;
    case "cuadricula":
      g.lineStyle(2, arena.colorLineas, 1);
      for (let x = 0; x <= ancho; x += 80) g.lineBetween(x, 0, x, alto);
      for (let y = 0; y <= alto; y += 80) g.lineBetween(0, y, ancho, y);
      break;
    case "cancha":
      g.fillStyle(mezclar(arena.colorPiso, 0x000000, 0.08), 1);
      for (let x = 0; x < ancho; x += 150) g.fillRect(x, 0, 75, alto);
      g.lineStyle(5, arena.colorLineas, 0.9);
      g.strokeRect(40, 40, ancho - 80, alto - 80);
      g.lineBetween(ancho / 2, 40, ancho / 2, alto - 40);
      g.strokeCircle(ancho / 2, alto / 2, 150);
      g.strokeRect(40, alto / 2 - 220, 220, 440);
      g.strokeRect(ancho - 260, alto / 2 - 220, 220, 440);
      break;
    case "nieve":
      // Manchas fijas (sin azar) para que el piso sea siempre igual.
      g.fillStyle(arena.colorLineas, 1);
      for (let i = 0; i < 70; i++) {
        const x = (i * 263) % ancho;
        const y = (i * 151 + (i % 7) * 97) % alto;
        g.fillEllipse(x, y, 90 + (i % 5) * 30, 40 + (i % 3) * 20);
      }
      break;
  }

  // Marcas de neumáticos y grano deterministas; no afectan la física.
  for (let i = 0; i < 150; i++) {
    const x = (i * 137 + 83) % ancho, y = (i * 211 + 47) % alto;
    g.fillStyle(i % 3 === 0 ? 0xc3c1a5 : 0x080e0c, .08);
    g.fillRect(x, y, 2 + i % 4, 1 + i % 2);
  }
  g.lineStyle(2, 0xe3d4ad, .23); g.strokeRoundedRect(42, 42, ancho - 84, alto - 84, 22);
  g.lineStyle(3, 0xdfd4b5, .13); g.strokeCircle(ancho / 2, alto / 2, 115);
  g.strokeCircle(ancho / 2, alto / 2, 105);
  g.lineBetween(ancho / 2 - 135, alto / 2, ancho / 2 + 135, alto / 2);
  g.lineBetween(ancho / 2, alto / 2 - 135, ancho / 2, alto / 2 + 135);
  for (let x = 0; x < ancho; x += 64) {
    g.fillStyle(0x45504b, 1); g.fillRect(x + 2, -28, 59, 23); g.fillRect(x + 2, alto + 5, 59, 23);
    g.fillStyle(x % 128 === 0 ? 0xe1b36d : 0x303a34, 1); g.fillRect(x + 5, -25, 23, 17); g.fillRect(x + 5, alto + 8, 23, 17);
    g.fillStyle(0xd4d6bb, .5); g.fillCircle(x + 52, -16, 2); g.fillCircle(x + 52, alto + 16, 2);
  }
  for (let y = 0; y < alto; y += 64) {
    g.fillStyle(0x45504b, 1); g.fillRect(-28, y + 2, 23, 59); g.fillRect(ancho + 5, y + 2, 23, 59);
    g.fillStyle(y % 128 === 0 ? 0xe1b36d : 0x303a34, 1); g.fillRect(-25, y + 5, 17, 23); g.fillRect(ancho + 8, y + 5, 17, 23);
  }
  for (const pos of arena.salidas) {
    g.lineStyle(2, 0xe5dcb6, .2); g.strokeCircle(pos.x, pos.y, 43);
  }
  g.lineStyle(6, 0x000000, 0.3);
  g.strokeRect(0, 0, ancho, alto);
}

/** Zona roja fuera de los límites actuales durante la muerte súbita. */
export function dibujarMuerteSubita(g: Graficos, arena: Arena, l: Limites, parpadeo: number): void {
  g.fillStyle(0xb3261e, 0.3);
  g.fillRect(0, 0, arena.ancho, l.y0);
  g.fillRect(0, l.y1, arena.ancho, arena.alto - l.y1);
  g.fillRect(0, l.y0, l.x0, l.y1 - l.y0);
  g.fillRect(l.x1, l.y0, arena.ancho - l.x1, l.y1 - l.y0);
  g.lineStyle(5, 0xff4d3d, 0.6 + 0.4 * parpadeo);
  g.strokeRect(l.x0, l.y0, l.x1 - l.x0, l.y1 - l.y0);
}

/** Largo y ancho del dibujo de cada rueda según su tamaño (medidas de los sprites del original). */
const RUEDA_VISUAL: Record<Tamano, { largo: number; ancho: number }> = {
  0: { largo: 14, ancho: 4 },
  1: { largo: 14, ancho: 6 },
  2: { largo: 18, ancho: 9 },
};

export function dibujarCarrito(g: Graficos, c: Carrito, pose: Pose): void {
  const { largo, ancho } = c;
  const caja = (rect: RectLocal = CUERPO, centro = { x: pose.x, y: pose.y }, rotacion = pose.rotacion) =>
    puntos(esquinas(cajaEn(centro, rotacion, largo, ancho, rect)));

  if (c.eliminado) {
    g.fillStyle(0x2a2622, 0.85);
    g.fillPoints(caja(), true);
    g.fillStyle(0x151311, 0.9);
    g.fillPoints(caja({ x: 0.2, y: 0, mitadLargo: 0.17, mitadAncho: 0.3 }), true);
    return;
  }

  if (c.esJugador) {
    g.fillStyle(c.personaje.id === "mily" ? 0xc19be8 : 0xf7be7b, .07); g.fillCircle(pose.x, pose.y, largo * .8);
    g.lineStyle(1, c.personaje.id === "mily" ? 0xc19be8 : 0xf7be7b, .35); g.strokeCircle(pose.x, pose.y, largo * .65);
  }
  // Sombra
  g.fillStyle(0x000000, 0.25);
  g.fillPoints(caja(CUERPO, { x: pose.x + 5, y: pose.y + 6 }), true);

  // Ruedas por fuera de la carrocería, como en el original: oscuras sanas, rojizas rotas.
  // Las delanteras giran con el volante.
  const rueda = RUEDA_VISUAL[c.piezas.ruedas.tamano];
  for (const i of INDICES_RUEDA) {
    const delantera = i < 2;
    const lado = i % 2 === 0 ? -1 : 1;
    const local = { x: delantera ? 0.24 : -0.24, y: (lado * (ancho / 2 + rueda.ancho / 2 + 0.5)) / ancho };
    const centro = cajaEn(pose, pose.rotacion, largo, ancho, { ...local, mitadLargo: 0, mitadAncho: 0 }).centro;
    const giro = delantera ? c.direccionGiro * 25 : 0;
    const vida = c.vidaRuedas[i] / VIDA.rueda;
    g.fillStyle(mezclar(0x9a3412, 0x1c1c1c, vida), 1);
    g.fillPoints(puntos(esquinas(cajaEn(centro, pose.rotacion + giro, rueda.largo, rueda.ancho))), true);
  }

  // Carrocería: el color se apaga con el daño.
  const colorCuerpo = mezclar(c.personaje.color, 0x3b3b3b, (1 - c.vidaCarroceria / VIDA.carroceria) * 0.75);
  g.fillStyle(colorCuerpo, 1);
  g.fillPoints(caja(), true);
  // El jugador se distingue por el borde blanco.
  if (c.esJugador) g.lineStyle(2.5, 0xffffff, 1);
  else g.lineStyle(2, mezclar(colorCuerpo, 0x000000, 0.45), 1);
  g.strokePoints(caja(), true);

  // Motor, adelante.
  g.fillStyle(mezclar(c.personaje.colorMotor, 0x262626, (1 - c.vidaMotor / VIDA.motor) * 0.8), 1);
  g.fillPoints(caja({ x: 0.27, y: 0, mitadLargo: 0.16, mitadAncho: 0.3 }), true);

  // Bandas, cristales, parachoques y faros.
  g.fillStyle(0xf0e4c5, .8);
  g.fillPoints(caja({ x: .03, y: -.28, mitadLargo: .43, mitadAncho: .045 }), true);
  g.fillStyle(0x1d2b30, 1); g.fillPoints(caja({ x: -.11, y: 0, mitadLargo: .16, mitadAncho: .31 }), true);
  g.fillStyle(0x8bafb5, .8); g.fillPoints(caja({ x: .07, y: 0, mitadLargo: .045, mitadAncho: .3 }), true);
  g.fillStyle(0x62716d, 1);
  g.fillPoints(caja({ x: .49, y: 0, mitadLargo: .045, mitadAncho: .55 }), true);
  g.fillPoints(caja({ x: -.49, y: 0, mitadLargo: .035, mitadAncho: .52 }), true);
  for (const side of [-1, 1]) {
    g.fillStyle(0xffe7ab, 1); g.fillPoints(caja({ x: .45, y: side * .32, mitadLargo: .025, mitadAncho: .10 }), true);
    g.fillStyle(0xed6859, 1); g.fillPoints(caja({ x: -.45, y: side * .32, mitadLargo: .025, mitadAncho: .085 }), true);
  }
  // Conductor.
  const cabeza = cajaEn(pose, pose.rotacion, largo, ancho, { x: -0.12, y: 0, mitadLargo: 0, mitadAncho: 0 }).centro;
  g.fillStyle(c.personaje.id === "mily" ? 0xc19be8 : 0xeadbbd, 1);
  g.fillCircle(cabeza.x, cabeza.y, ancho * 0.2);
  g.lineStyle(1.5, 0x222a29, 1);
  g.strokeCircle(cabeza.x, cabeza.y, ancho * 0.2);
}
