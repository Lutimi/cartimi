export type Stat =
  | "aceleracion"
  | "velocidadMax"
  | "umbralDerrape"
  | "deslizamiento"
  | "peso"
  | "golpeRecibido";

export type Stats = Record<Stat, number>;

export interface Modificador {
  stat: Stat;
  suma?: number;
  mult?: number;
}

/** valor final = (base + Σ sumas) × Π multiplicadores */
export function calcularStats(base: Stats, mods: readonly Modificador[]): Stats {
  const resultado = { ...base };
  const multiplicadores: Partial<Stats> = {};
  for (const m of mods) {
    if (m.suma !== undefined) resultado[m.stat] += m.suma;
    if (m.mult !== undefined) multiplicadores[m.stat] = (multiplicadores[m.stat] ?? 1) * m.mult;
  }
  for (const [stat, mult] of Object.entries(multiplicadores) as [Stat, number][]) {
    resultado[stat] *= mult;
  }
  return resultado;
}
