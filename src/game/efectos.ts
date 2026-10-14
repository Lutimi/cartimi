import type Phaser from "phaser";
import { cajaCarrito } from "../sim/colision";
import type { Carrito } from "../sim/tipos";
import type { Vec } from "../sim/vec";

// Efectos solo visuales: usan Math.random porque no afectan a la simulación.

interface Particula {
  x: number;
  y: number;
  vx: number;
  vy: number;
  vida: number;
  vidaMax: number;
  radio: number;
  crece: number;
  color: number;
  alfa: number;
}

interface Marca {
  x: number;
  y: number;
  vida: number;
}

/** Duración de las marcas de derrape, en fotogramas de simulación. */
const VIDA_MARCA = 8 * 31;
const MAX_MARCAS = 1200;

const azar = (min: number, max: number): number => min + Math.random() * (max - min);

export class Efectos {
  private particulas: Particula[] = [];
  private marcas: Marca[] = [];

  private emitir(p: Vec, cantidad: number, velocidad: [number, number], plantilla: Omit<Particula, "x" | "y" | "vx" | "vy">): void {
    for (let i = 0; i < cantidad; i++) {
      const angulo = Math.random() * Math.PI * 2;
      const v = azar(...velocidad);
      this.particulas.push({ ...plantilla, x: p.x, y: p.y, vx: Math.cos(angulo) * v, vy: Math.sin(angulo) * v });
    }
  }

  chispas(p: Vec, dano: number): void {
    const cantidad = Math.min(16, 3 + Math.round(dano / 2));
    this.emitir(p, cantidad, [2, 7], { vida: 14, vidaMax: 14, radio: 2.2, crece: -0.1, color: 0xffd166, alfa: 1 });
  }

  explosion(p: Vec): void {
    this.emitir(p, 22, [1, 5], { vida: 26, vidaMax: 26, radio: 7, crece: 0.5, color: 0xff7b00, alfa: 0.95 });
    this.emitir(p, 12, [0.5, 3], { vida: 22, vidaMax: 22, radio: 5, crece: 0.4, color: 0xffd60a, alfa: 1 });
    this.emitir(p, 14, [0.3, 1.5], { vida: 60, vidaMax: 60, radio: 10, crece: 0.45, color: 0x3d3d3d, alfa: 0.6 });
  }

  humo(p: Vec): void {
    this.emitir(p, 1, [0.2, 0.8], { vida: 40, vidaMax: 40, radio: 5, crece: 0.25, color: 0x6b6b6b, alfa: 0.45 });
  }

  /** Marcas debajo de las ruedas traseras. */
  derrape(c: Carrito): void {
    for (const y of [-0.4, 0.4]) {
      const { centro } = cajaCarrito(c, { x: -0.24, y, mitadLargo: 0, mitadAncho: 0 });
      this.marcas.push({ x: centro.x, y: centro.y, vida: VIDA_MARCA });
    }
    if (this.marcas.length > MAX_MARCAS) this.marcas.splice(0, this.marcas.length - MAX_MARCAS);
  }

  /** Avanza un fotograma de simulación. */
  avanzar(): void {
    for (const p of this.particulas) {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.9;
      p.vy *= 0.9;
      p.radio = Math.max(0.5, p.radio + p.crece);
      p.vida--;
    }
    this.particulas = this.particulas.filter((p) => p.vida > 0);
    for (const m of this.marcas) m.vida--;
    this.marcas = this.marcas.filter((m) => m.vida > 0);
  }

  dibujarMarcas(g: Phaser.GameObjects.Graphics): void {
    for (const m of this.marcas) {
      g.fillStyle(0x1a1a1a, 0.22 * (m.vida / VIDA_MARCA));
      g.fillRect(m.x - 2.5, m.y - 2.5, 5, 5);
    }
  }

  dibujarParticulas(g: Phaser.GameObjects.Graphics): void {
    for (const p of this.particulas) {
      g.fillStyle(p.color, p.alfa * (p.vida / p.vidaMax));
      g.fillCircle(p.x, p.y, p.radio);
    }
  }
}
