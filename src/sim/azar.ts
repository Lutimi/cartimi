/** Azar con semilla (mulberry32): la misma semilla da siempre la misma secuencia. */
export class Azar {
  private estado: number;

  constructor(semilla: number) {
    this.estado = semilla >>> 0;
  }

  /** Número en [0, 1). */
  siguiente(): number {
    this.estado = (this.estado + 0x6d2b79f5) >>> 0;
    let t = this.estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Entero en [0, n), como random(n) de Flash. Devuelve 0 si n < 1. */
  entero(n: number): number {
    const tope = Math.floor(n);
    return tope < 1 ? 0 : Math.floor(this.siguiente() * tope);
  }

  elegir<T>(lista: readonly T[]): T {
    const elegido = lista[this.entero(lista.length)];
    if (elegido === undefined) throw new Error("No se puede elegir de una lista vacía");
    return elegido;
  }

  /** Copia de la lista en orden aleatorio (Fisher-Yates). */
  barajar<T>(lista: readonly T[]): T[] {
    const copia = [...lista];
    for (let i = copia.length - 1; i > 0; i--) {
      const j = this.entero(i + 1);
      [copia[i], copia[j]] = [copia[j] as T, copia[i] as T];
    }
    return copia;
  }
}
