import { describe, expect, it } from "vitest";
import { Azar } from "../src/sim/azar";
import { resolverChoque } from "../src/sim/choque";
import { zonasTocadas } from "../src/sim/colision";
import type { Evento } from "../src/sim/tipos";
import { carrito } from "./ayuda";

/**
 * Dos barriles medianos (peso 1, golpe recibido 0.7). El atacante va a 10 px/fotograma hacia la derecha
 * y le pega con el frente en el costado derecho a la víctima, que mira hacia abajo.
 */
function escena(opciones: { victimaJugador?: boolean } = {}) {
  const atacante = carrito({ id: 1, tamanos: [1, 1, 1], pos: { x: 200, y: 200 }, rotacion: 0 });
  // largo/2 + ancho/2 − 4: se superponen 4 px.
  const victima = carrito({
    id: 2,
    tamanos: [1, 1, 1],
    pos: { x: 200 + 25 + 16 - 4, y: 200 },
    rotacion: 90,
    esJugador: opciones.victimaJugador ?? false,
  });
  atacante.velTotal = { x: 10, y: 0 };
  return { atacante, victima };
}

describe("zonas tocadas", () => {
  it("el frente del atacante toca el motor y las ruedas delanteras", () => {
    const { atacante, victima } = escena();
    expect(zonasTocadas(atacante, victima).sort()).toEqual([0, 1, "frente"].sort());
  });

  it("el costado de la víctima recibe en motor, carrocería y las dos ruedas de ese lado", () => {
    const { atacante, victima } = escena();
    expect(zonasTocadas(victima, atacante).sort()).toEqual([1, 3, "frente", "trasera"].sort());
  });
});

describe("daño del choque (Car.handleDamage)", () => {
  it("víctima: relativa × peso del atacante × su golpe recibido; atacante: la mitad", () => {
    const { atacante, victima } = escena();
    const eventos: Evento[] = [];
    resolverChoque(atacante, victima, new Azar(1), eventos);

    // 10 × 1 × 0.7 = 7 en cada zona tocada.
    expect(victima.vidaMotor).toBeCloseTo(93);
    expect(victima.vidaCarroceria).toBeCloseTo(93);
    expect(victima.vidaRuedas).toEqual([25, 18, 25, 18].map((v) => expect.closeTo(v)));
    // 10 × 1 / 2 × 0.7 = 3.5.
    expect(atacante.vidaMotor).toBeCloseTo(96.5);
    expect(atacante.vidaCarroceria).toBe(100);
    expect(atacante.vidaRuedas).toEqual([21.5, 21.5, 25, 25].map((v) => expect.closeTo(v)));

    expect(eventos).toEqual([
      expect.objectContaining({ tipo: "choque", atacante: 1, victima: 2, danoVictima: expect.closeTo(7) }),
    ]);
  });

  it("el jugador recibe un 10% menos", () => {
    const { atacante, victima } = escena({ victimaJugador: true });
    resolverChoque(atacante, victima, new Azar(1), []);
    expect(victima.vidaMotor).toBeCloseTo(100 - 6.3);
  });

  it("el atacante es el más rápido aunque se pase en segundo lugar", () => {
    const { atacante, victima } = escena();
    const resultado = resolverChoque(victima, atacante, new Azar(1), []);
    expect(resultado.atacante).toBe(atacante);
  });

  it("después del choque los dos frenan y la víctima sale empujada", () => {
    const { atacante, victima } = escena();
    atacante.velocidad = 10;
    resolverChoque(atacante, victima, new Azar(1), []);
    expect(atacante.velocidad).toBe(0);
    expect(victima.velocidad).toBe(0);
    // Impacto = velocidad del atacante × golpe recibido de la víctima.
    expect(victima.velImpacto.x).toBeCloseTo(7);
    expect(atacante.velImpacto.x).toBeCloseTo(0);
    expect(victima.velocidadAngular).toBe(-atacante.velocidadAngular);
  });
});
