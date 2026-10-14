import type { Arena } from "../data/arenas";
import { FISICA, VIDA } from "../data/fisica";
import type { Personaje } from "../data/personajes";
import type { PiezasCarrito } from "../data/piezas";
import { Azar } from "./azar";
import { crearCarrito, mover, pasoFisico, vidaTotal } from "./carrito";
import { resolverChoque } from "./choque";
import { cajaCarrito, seSuperponen } from "./colision";
import { alGolpear, alTocarPared, pensar } from "./ia";
import type { Carrito, Entrada, Evento, Limites, Mundo } from "./tipos";
import { anguloHacia, distancia } from "./vec";

export interface Participante {
  personaje: Personaje;
  piezas: PiezasCarrito;
}

export interface ConfigDerbi {
  semilla: number;
  arena: Arena;
  /** null = derbi solo con IA (para tests y simulaciones). */
  jugador: Participante | null;
  rivales: Participante[];
}

export class Derbi implements Mundo {
  readonly arena: Arena;
  readonly azar: Azar;
  readonly carritos: Carrito[] = [];
  readonly limites: Limites;
  /** Ids en orden de eliminación. */
  readonly eliminados: number[] = [];
  fotograma = 0;
  terminado = false;
  ganador: number | null = null;
  private muerteSubitaAnunciada = false;

  constructor(config: ConfigDerbi) {
    this.arena = config.arena;
    this.azar = new Azar(config.semilla);
    this.limites = { x0: 0, y0: 0, x1: config.arena.ancho, y1: config.arena.alto };

    const participantes = config.jugador ? [config.jugador, ...config.rivales] : config.rivales;
    if (participantes.length > config.arena.salidas.length) {
      throw new Error(`La arena ${config.arena.id} tiene ${config.arena.salidas.length} salidas`);
    }
    // En el original todos salían mirando a la derecha; aquí miran al centro.
    const centro = { x: config.arena.ancho / 2, y: config.arena.alto / 2 };
    participantes.forEach((p, i) => {
      const pos = config.arena.salidas[i] ?? centro;
      this.carritos.push(
        crearCarrito({
          id: i,
          personaje: p.personaje,
          piezas: p.piezas,
          esJugador: config.jugador !== null && i === 0,
          pos,
          rotacion: anguloHacia(pos, centro),
        }),
      );
    });
  }

  get jugador(): Carrito | undefined {
    return this.carritos.find((c) => c.esJugador);
  }

  get vivos(): Carrito[] {
    return this.carritos.filter((c) => !c.eliminado);
  }

  get segundos(): number {
    return this.fotograma / FISICA.fps;
  }

  get enMuerteSubita(): boolean {
    return this.segundos >= this.arena.muerteSubita;
  }

  /** Puesto final (1 = ganador). null si todavía no se sabe. */
  puesto(id: number): number | null {
    if (this.ganador === id) return 1;
    const indice = this.eliminados.indexOf(id);
    return indice === -1 ? null : this.carritos.length - indice;
  }

  /** Avanza un fotograma (1/31 s). */
  paso(entradaJugador: Entrada): Evento[] {
    const eventos: Evento[] = [];
    if (this.terminado) return eventos;
    this.fotograma++;
    this.cerrarArena(eventos);

    const vivos = this.vivos;
    for (const c of vivos) {
      const entrada = c.ia ? pensar(c, this) : entradaJugador;
      if (pasoFisico(c, entrada, this.limites)) {
        eventos.push({ tipo: "pared", id: c.id });
        alTocarPared(c, this);
      }
      mover(c);
    }

    for (let i = 0; i < vivos.length; i++) {
      for (let j = i + 1; j < vivos.length; j++) {
        const a = vivos[i];
        const b = vivos[j];
        if (!a || !b || a.eliminado || b.eliminado) continue;
        if (!seSuperponen(cajaCarrito(a), cajaCarrito(b))) continue;
        // Solo cuenta si se están acercando, como en el original.
        if (distancia(a.posAnterior, b.posAnterior) < distancia(a.pos, b.pos)) continue;
        const { atacante, victima } = resolverChoque(a, b, this.azar, eventos);
        alGolpear(atacante, this);
        this.revisarEliminacion(victima, eventos);
        this.revisarEliminacion(atacante, eventos);
      }
    }

    for (const c of this.carritos) this.revisarEliminacion(c, eventos);
    this.revisarFin(eventos);
    return eventos;
  }

  private revisarEliminacion(c: Carrito, eventos: Evento[]): void {
    if (c.eliminado || vidaTotal(c) >= VIDA.minima) return;
    c.eliminado = true;
    this.eliminados.push(c.id);
    eventos.push({ tipo: "eliminado", id: c.id, por: c.ultimoRival });
  }

  private revisarFin(eventos: Evento[]): void {
    const vivos = this.vivos;
    const jugadorFuera = this.jugador?.eliminado ?? false;
    if (vivos.length > 1 && !jugadorFuera) return;
    this.terminado = true;
    this.ganador = vivos.length === 1 ? (vivos[0]?.id ?? null) : null;
    // Si los dos últimos caen en el mismo choque, gana el último en caer.
    if (vivos.length === 0) this.ganador = this.eliminados.pop() ?? null;
    eventos.push({ tipo: "fin", ganador: this.ganador });
  }

  /** Muerte súbita: los bordes se cierran para que ninguna partida se quede atascada. */
  private cerrarArena(eventos: Evento[]): void {
    if (!this.enMuerteSubita) return;
    if (!this.muerteSubitaAnunciada) {
      this.muerteSubitaAnunciada = true;
      eventos.push({ tipo: "muerteSubita" });
    }
    const { ancho, alto, tamanoMinimo, velocidadCierre: v } = this.arena;
    const l = this.limites;
    if (l.x1 - l.x0 > ancho * tamanoMinimo) {
      l.x0 += v;
      l.x1 -= v;
    }
    if (l.y1 - l.y0 > alto * tamanoMinimo) {
      l.y0 += v;
      l.y1 -= v;
    }
  }
}
