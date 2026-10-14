import { describe, expect, it } from "vitest";
import { cajaAlineada, fijarVidaMotor, fijarVidaRueda, mover, pasoFisico } from "../src/sim/carrito";
import { largo } from "../src/sim/vec";
import { ABIERTO, carrito, entrada } from "./ayuda";

const ADELANTE = entrada({ adelante: true });

function fotograma(c: ReturnType<typeof carrito>, e = ADELANTE, limites = ABIERTO): boolean {
  const toco = pasoFisico(c, e, limites);
  mover(c);
  return toco;
}

describe("estadísticas de las piezas (GameInfo.calcProperties)", () => {
  it("todo pequeño", () => {
    const { stats } = carrito({ tamanos: [0, 0, 0] });
    expect(stats.aceleracion).toBeCloseTo(1.0);
    expect(stats.velocidadMax).toBeCloseTo(22);
    expect(stats.umbralDerrape).toBeCloseTo(15);
    expect(stats.deslizamiento).toBeCloseTo(3);
    expect(stats.peso).toBeCloseTo(0.5);
    expect(stats.golpeRecibido).toBeCloseTo(1);
  });

  it("todo mediano", () => {
    const { stats } = carrito({ tamanos: [1, 1, 1] });
    expect(stats.aceleracion).toBeCloseTo(1.25);
    expect(stats.velocidadMax).toBeCloseTo(22);
    expect(stats.umbralDerrape).toBeCloseTo(17);
    expect(stats.deslizamiento).toBeCloseTo(1.5);
    expect(stats.peso).toBeCloseTo(1);
    expect(stats.golpeRecibido).toBeCloseTo(0.7);
  });

  it("todo grande", () => {
    const { stats } = carrito({ tamanos: [2, 2, 2] });
    expect(stats.aceleracion).toBeCloseTo(1.4);
    expect(stats.velocidadMax).toBeCloseTo(22);
    expect(stats.umbralDerrape).toBeCloseTo(19);
    expect(stats.deslizamiento).toBeCloseTo(0);
    expect(stats.peso).toBeCloseTo(1.5);
    expect(stats.golpeRecibido).toBeCloseTo(0.4);
  });
});

describe("aceleración", () => {
  it("un fotograma acelerando: (0 + 1) × 0.975", () => {
    const c = carrito();
    fotograma(c);
    expect(c.velocidad).toBeCloseTo(0.975);
    expect(c.pos.x).toBeCloseTo(0.975);
    expect(c.pos.y).toBeCloseTo(0);
  });

  it("la velocidad tope es velocidadMax × 0.975", () => {
    const c = carrito();
    for (let i = 0; i < 300; i++) fotograma(c);
    expect(c.velocidad).toBeCloseTo(22 * 0.975);
  });

  it("sin acelerar, frena solo", () => {
    const c = carrito();
    c.velocidad = 10;
    fotograma(c, entrada({}));
    expect(c.velocidad).toBeCloseTo(9.75);
  });

  it("un motor destruido acelera la mitad", () => {
    const c = carrito();
    fijarVidaMotor(c, 0);
    expect(c.aceleracion).toBeCloseTo(0.5);
    fijarVidaMotor(c, 50);
    expect(c.aceleracion).toBeCloseTo(0.75);
  });
});

describe("giro", () => {
  it("gira |velocidad| / velocidadMax × 6 grados por fotograma", () => {
    const c = carrito();
    c.velocidad = 11;
    c.velMotor = { x: 11, y: 0 };
    fotograma(c, entrada({ derecha: true }));
    expect(c.rotacion).toBeCloseTo(((11 * 0.975) / 22) * 6);
  });

  it("en reversa el giro se invierte", () => {
    const c = carrito();
    c.velocidad = -11;
    c.velMotor = { x: -11, y: 0 };
    fotograma(c, entrada({ derecha: true }));
    expect(c.rotacion).toBeCloseTo(-((11 * 0.975) / 22) * 6);
  });

  it("parado no gira", () => {
    const c = carrito();
    fotograma(c, entrada({ derecha: true }));
    expect(c.rotacion).toBe(0);
  });

  it("la última tecla de giro pulsada manda", () => {
    const c = carrito();
    fotograma(c, entrada({ izquierda: true }));
    expect(c.direccionGiro).toBe(-1);
    fotograma(c, entrada({ izquierda: true, derecha: true }));
    expect(c.direccionGiro).toBe(1);
    fotograma(c, entrada({ izquierda: true }));
    expect(c.direccionGiro).toBe(-1);
    fotograma(c, entrada({}));
    expect(c.direccionGiro).toBe(0);
  });
});

describe("derrape", () => {
  it("derrapa al girar por encima del umbral, sin cambiar la rapidez", () => {
    const c = carrito();
    for (let i = 0; i < 60; i++) fotograma(c);
    fotograma(c, entrada({ adelante: true, derecha: true }));
    expect(c.derrapando).toBe(true);
    expect(largo(c.velInercia)).toBeGreaterThan(0);
    expect(largo(c.velTotal)).toBeCloseTo(Math.abs(c.velocidad));
  });

  it("no derrapa por debajo del umbral", () => {
    const c = carrito();
    c.velocidad = 10;
    c.velMotor = { x: 10, y: 0 };
    fotograma(c, entrada({ derecha: true }));
    expect(c.derrapando).toBe(false);
  });

  it("ruedas dañadas: derrapa antes y desliza más", () => {
    const c = carrito();
    fijarVidaRueda(c, 0, 0);
    fijarVidaRueda(c, 1, 0);
    expect(c.umbralDerrape).toBe(15 - 5);
    expect(c.deslizamiento).toBe(3 + 1);
  });
});

describe("paredes", () => {
  const ARENA = { x0: 0, y0: 0, x1: 400, y1: 300 };

  it("no atraviesa un borde yendo a toda velocidad", () => {
    const c = carrito({ pos: { x: 200, y: 150 } });
    let toco = false;
    for (let i = 0; i < 120; i++) {
      toco = fotograma(c, ADELANTE, ARENA) || toco;
      expect(c.pos.x).toBeLessThan(ARENA.x1 + 30);
    }
    expect(toco).toBe(true);
  });

  it("al tocar un borde frena en seco", () => {
    const c = carrito({ pos: { x: 390, y: 150 } });
    c.velocidad = 15;
    c.velMotor = { x: 15, y: 0 };
    c.velTotal = { x: 15, y: 0 };
    expect(fotograma(c, ADELANTE, ARENA)).toBe(true);
    expect(c.velocidad).toBe(0);
    expect(c.velTotal.x).toBeLessThan(0);
  });

  it("un carrito quieto y metido en el borde sale empujado", () => {
    const c = carrito({ pos: { x: 395, y: 150 } });
    for (let i = 0; i < 60; i++) fotograma(c, entrada({}), ARENA);
    expect(cajaAlineada(c).x1).toBeLessThanOrEqual(ARENA.x1 + 1);
  });
});
