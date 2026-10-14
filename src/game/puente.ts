import type { EventoCarrera, Perfil, Resultado } from "../meta/progreso";
export const tactil = { adelante: false, atras: false, izquierda: false, derecha: false, nitro: false, freno: false, especial: false };
export function soltarControles(): void { for (const k of Object.keys(tactil) as (keyof typeof tactil)[]) tactil[k] = false; }
export interface Telemetria { nitro: number; velocidad: number; especial: number }
export interface DatosCarrera { evento: EventoCarrera; perfil: Perfil; personaje: string; alTerminar: (r: Resultado) => void; alPausar: () => void; alActualizar: (t: Telemetria) => void; sonido: (tipo: "golpe" | "nitro" | "premio" | "punete") => void }
