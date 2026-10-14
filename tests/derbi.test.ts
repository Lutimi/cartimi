import { describe, expect, it } from "vitest";
import { ARENAS } from "../src/data/arenas";
import { FISICA } from "../src/data/fisica";
import { PERSONAJES } from "../src/data/personajes";
import { piezasClasicas } from "../src/data/piezas";
import { armarDerbiClasico } from "../src/sim/armar";
import { Derbi } from "../src/sim/derbi";
import { alGolpear, conducirHacia } from "../src/sim/ia";
import { SIN_ENTRADA, type Evento } from "../src/sim/tipos";
import { carrito } from "./ayuda";

const derbiSoloIA = (semilla: number) =>
  new Derbi(armarDerbiClasico({ semilla, nivel: 3, jugador: null }));

function jugarHastaElFinal(derbi: Derbi, maxSegundos = 240): Evento[] {
  const eventos: Evento[] = [];
  for (let i = 0; i < maxSegundos * FISICA.fps && !derbi.terminado; i++) {
    eventos.push(...derbi.paso(SIN_ENTRADA));
  }
  return eventos;
}

const foto = (d: Derbi) =>
  JSON.stringify(d.carritos.map((c) => [c.pos.x.toFixed(6), c.pos.y.toFixed(6), c.rotacion.toFixed(6), c.eliminado]));

describe("IA (AICar)", () => {
  it("con el objetivo enfrente, acelera sin girar", () => {
    expect(conducirHacia(carrito(), 0)).toEqual({ adelante: true, atras: false, izquierda: false, derecha: false });
  });

  it("con el objetivo detrás, va en reversa", () => {
    expect(conducirHacia(carrito(), 180)).toMatchObject({ adelante: false, atras: true });
  });

  it("no acelera si tiene que girar mucho yendo rápido", () => {
    const c = carrito();
    c.velocidad = 20;
    expect(conducirHacia(c, 45)).toMatchObject({ adelante: false, derecha: true });
  });

  it("después de golpear huye entre 20 y 39 fotogramas", () => {
    const d = derbiSoloIA(1);
    const c = d.carritos[0]!;
    alGolpear(c, d);
    expect(c.ia?.modo).toBe("huir");
    expect(c.ia?.contador).toBeGreaterThanOrEqual(20);
    expect(c.ia?.contador).toBeLessThan(40);
  });
});

describe("derbi", () => {
  it("es determinista: la misma semilla da exactamente lo mismo", () => {
    const a = derbiSoloIA(42);
    const b = derbiSoloIA(42);
    for (let i = 0; i < 1500; i++) {
      a.paso(SIN_ENTRADA);
      b.paso(SIN_ENTRADA);
    }
    expect(foto(a)).toBe(foto(b));
    const c = derbiSoloIA(43);
    for (let i = 0; i < 1500; i++) c.paso(SIN_ENTRADA);
    expect(foto(c)).not.toBe(foto(a));
  });

  it.each([1, 2, 3, 4, 5, 6, 7, 8])("siempre termina con un ganador (semilla %i)", (semilla) => {
    const d = derbiSoloIA(semilla);
    const eventos = jugarHastaElFinal(d);
    expect(d.terminado).toBe(true);
    expect(d.ganador).not.toBeNull();
    expect(d.puesto(d.ganador!)).toBe(1);
    expect(eventos.filter((e) => e.tipo === "eliminado").length).toBeGreaterThanOrEqual(4);
  });

  it("los carritos no salen de la arena", () => {
    const d = derbiSoloIA(7);
    for (let i = 0; i < 120 * FISICA.fps && !d.terminado; i++) {
      d.paso(SIN_ENTRADA);
      for (const c of d.vivos) {
        expect(c.pos.x).toBeGreaterThan(d.limites.x0 - 40);
        expect(c.pos.x).toBeLessThan(d.limites.x1 + 40);
        expect(c.pos.y).toBeGreaterThan(d.limites.y0 - 40);
        expect(c.pos.y).toBeLessThan(d.limites.y1 + 40);
      }
    }
  });

  it("un carrito con menos de 100 de vida queda eliminado y el otro gana", () => {
    const d = new Derbi({
      semilla: 1,
      arena: ARENAS.patio,
      jugador: null,
      rivales: [
        { personaje: PERSONAJES[0]!, piezas: piezasClasicas(1, 1, 1) },
        { personaje: PERSONAJES[1]!, piezas: piezasClasicas(1, 1, 1) },
      ],
    });
    const [fuerte, debil] = d.carritos as [(typeof d.carritos)[0], (typeof d.carritos)[0]];
    debil.vidaCarroceria = 1;
    debil.vidaMotor = 0;
    const eventos = jugarHastaElFinal(d, 30);
    expect(eventos).toContainEqual(expect.objectContaining({ tipo: "eliminado", id: debil.id }));
    expect(d.ganador).toBe(fuerte.id);
    expect(d.puesto(debil.id)).toBe(2);
  });

  it("si eliminan al jugador, el derbi termina y sabe su puesto", () => {
    const d = new Derbi(armarDerbiClasico({ semilla: 3, nivel: 4, jugador: "deportista" }));
    const jugador = d.jugador!;
    jugador.vidaCarroceria = 0;
    jugador.vidaMotor = 0;
    jugarHastaElFinal(d, 60);
    expect(d.terminado).toBe(true);
    expect(jugador.eliminado).toBe(true);
    expect(d.puesto(jugador.id)).toBeGreaterThanOrEqual(2);
  });

  it("la muerte súbita cierra la arena", () => {
    const d = derbiSoloIA(5);
    const anchoInicial = d.limites.x1 - d.limites.x0;
    const eventos: Evento[] = [];
    for (let i = 0; i < (ARENAS.patio.muerteSubita + 5) * FISICA.fps && !d.terminado; i++) {
      eventos.push(...d.paso(SIN_ENTRADA));
    }
    if (!d.terminado) {
      expect(eventos).toContainEqual({ tipo: "muerteSubita" });
      expect(d.limites.x1 - d.limites.x0).toBeLessThan(anchoInicial);
    }
  });
});
