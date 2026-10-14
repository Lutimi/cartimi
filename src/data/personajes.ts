export interface Personaje {
  id: string;
  nombre: string;
  /** Color de la carrocería. */
  color: number;
  /** Color del motor. */
  colorMotor: number;
}

// Nombres provisionales: son los "moldes" de docs/diseno.md §8 hasta que definas tus personajes.
export const PERSONAJES: readonly Personaje[] = [
  { id: "mily", nombre: "Mily", color: 0xfa743e, colorMotor: 0x613448 },
  { id: "deportista", nombre: "La Deportista", color: 0xe5484d, colorMotor: 0x8f1d22 },
  { id: "inventor", nombre: "El Inventor", color: 0x3e7bfa, colorMotor: 0x1b3f8f },
  { id: "gloton", nombre: "El Glotón", color: 0x46a758, colorMotor: 0x1f5e2b },
  { id: "estafador", nombre: "El Estafador", color: 0xf5c518, colorMotor: 0x8a6d00 },
  { id: "granjero", nombre: "El Granjero", color: 0xc07a3c, colorMotor: 0x5e3a17 },
  { id: "rebelde", nombre: "La Rebelde", color: 0x9b5de5, colorMotor: 0x4e2384 },
];

export function personaje(id: string): Personaje {
  const encontrado = PERSONAJES.find((p) => p.id === id);
  if (!encontrado) throw new Error(`Personaje desconocido: ${id}`);
  return encontrado;
}
