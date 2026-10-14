import { ARENAS_POR_DERBI, type Arena } from "../data/arenas";
import { piezasClasicas, type PiezasCarrito } from "../data/piezas";
import type { NivelDerbi } from "../sim/armar";

export const EVENTOS = [
  { id: 0, nombre: "El primer impacto", zona: "Patio industrial", etiqueta: "INICIACIÓN", arena: 1, rivales: 3, objetivo: 3, premio: 180, cierre: 65, detalle: "Aprende a golpear. Termina entre los tres primeros.", regla: "Arena compacta", color: "#e8aa65" },
  { id: 1, nombre: "Metal contra metal", zona: "La chatarrería", etiqueta: "CALLEJERO", arena: 2, rivales: 4, objetivo: 3, premio: 240, cierre: 60, detalle: "Cuatro rivales, menos espacio para equivocarte.", regla: "Rivales reforzados", color: "#b7c690" },
  { id: 2, nombre: "Fuera de control", zona: "Estadio nocturno", etiqueta: "PROFESIONAL", arena: 3, rivales: 5, objetivo: 2, premio: 320, cierre: 55, detalle: "Aprovecha las rectas y consigue un puesto en la final.", regla: "Campo abierto", color: "#85b4c5" },
  { id: 3, nombre: "Bajo cero", zona: "Puerto congelado", etiqueta: "EXPERTO", arena: 4, rivales: 5, objetivo: 2, premio: 400, cierre: 55, detalle: "El hielo cambia el agarre. Frena antes de girar.", regla: "Superficie deslizante", color: "#aecde8" },
  { id: 4, nombre: "Última llamada", zona: "Fundición roja", etiqueta: "ÉLITE", arena: 2, rivales: 5, objetivo: 2, premio: 480, cierre: 40, detalle: "La arena se cierra antes. Busca el centro y resiste.", regla: "Cierre acelerado", color: "#df836d" },
  { id: 5, nombre: "Rey de la chatarra", zona: "La gran final", etiqueta: "CAMPEONATO", arena: 3, rivales: 5, objetivo: 1, premio: 650, cierre: 45, detalle: "Solo puede quedar uno. Gana para levantar el trofeo.", regla: "Rivales de élite", color: "#e6c877" },
] as const;
export type EventoCarrera = (typeof EVENTOS)[number];
export type Mejora = "motor" | "blindaje" | "agarre";
export const MEJORAS: { id: Mejora; nombre: string; descripcion: string; efecto: string; icono: string }[] = [
  { id: "motor", nombre: "Motor de competición", descripcion: "Sal más rápido y convierte cada recta en una oportunidad.", efecto: "+8% velocidad · +12% aceleración por nivel", icono: "motor" },
  { id: "blindaje", nombre: "Blindaje reforzado", descripcion: "Aguanta el impacto. Mantén tu carrito en una sola pieza.", efecto: "−12% daño recibido por nivel", icono: "escudo" },
  { id: "agarre", nombre: "Neumáticos de agarre", descripcion: "Traza mejor las curvas y recupera el control al derrapar.", efecto: "+3 umbral de derrape · −0,4 deslizamiento", icono: "rueda" },
];
export const PINTURAS = [
  { id: "mandarina", nombre: "Naranja mecánica", color: "#fa743e", precio: 0 },
  { id: "menta", nombre: "Menta salvaje", color: "#a3d2a0", precio: 180 },
  { id: "hielo", nombre: "Azul eléctrico", color: "#79b8ec", precio: 180 },
  { id: "lila", nombre: "Ultravioleta", color: "#bc9aef", precio: 240 },
  { id: "oro", nombre: "Oro de campeón", color: "#e8c566", precio: 350 },
] as const;
export interface Perfil {
  version: 1; monedas: number; desbloqueado: number; mejores: (number | null)[];
  mejoras: Record<Mejora, number>; pinturas: string[]; pintura: string;
  partidas: number; victorias: number; bajas: number; sonido: boolean;
}
export const CLAVE = "cartimi.carrera.v1";
export const nuevoPerfil = (): Perfil => ({ version: 1, monedas: 400, desbloqueado: 0, mejores: Array(6).fill(null), mejoras: { motor: 0, blindaje: 0, agarre: 0 }, pinturas: ["mandarina"], pintura: "mandarina", partidas: 0, victorias: 0, bajas: 0, sonido: true });
const entero = (n: unknown, fallback: number, max = 9999999): number => typeof n === "number" && Number.isFinite(n) ? Math.max(0, Math.min(max, Math.floor(n))) : fallback;
export function leerPerfil(raw: string | null): Perfil {
  const base = nuevoPerfil();
  try {
    const p = JSON.parse(raw ?? "null");
    if (!p || p.version !== 1) return base;
    for (const k of ["monedas", "partidas", "victorias", "bajas"] as const) base[k] = entero(p[k], base[k]);
    base.desbloqueado = entero(p.desbloqueado, 0, 5);
    for (const k of ["motor", "blindaje", "agarre"] as const) base.mejoras[k] = entero(p.mejoras?.[k], 0, 3);
    base.mejores = EVENTOS.map((_, i) => typeof p.mejores?.[i] === "number" && p.mejores[i] >= 1 && p.mejores[i] <= 6 ? Math.floor(p.mejores[i]) : null);
    base.pinturas = PINTURAS.filter(c => c.precio === 0 || (Array.isArray(p.pinturas) && p.pinturas.includes(c.id))).map(c => c.id);
    base.pintura = base.pinturas.includes(p.pintura) ? p.pintura : "mandarina";
    base.sonido = typeof p.sonido === "boolean" ? p.sonido : true;
    return base;
  } catch { return base; }
}
export const precioMejora = (nivel: number): number => [220, 380, 600][nivel] ?? 0;
export function comprarMejora(p: Perfil, id: Mejora): boolean {
  const nivel = p.mejoras[id];
  if (!Number.isInteger(nivel) || nivel >= 3 || p.monedas < precioMejora(nivel)) return false;
  p.monedas -= precioMejora(nivel); p.mejoras[id]++; return true;
}
export function comprarPintura(p: Perfil, id: string): boolean {
  const pintura = PINTURAS.find(c => c.id === id);
  if (!pintura) return false;
  if (!p.pinturas.includes(id)) {
    if (p.monedas < pintura.precio) return false;
    p.monedas -= pintura.precio; p.pinturas.push(id);
  }
  p.pintura = id; return true;
}
export interface Resultado { evento: number; puesto: number; bajas: number; segundos: number }
export function premiar(p: Perfil, r: Resultado): { monedas: number; clasificado: boolean; primera: boolean } {
  const evento = EVENTOS[r.evento];
  if (!evento || r.evento > p.desbloqueado || !Number.isInteger(r.puesto) || r.puesto < 1 || r.puesto > evento.rivales + 1) return { monedas: 0, clasificado: false, primera: false };
  const clasificado = r.puesto <= evento.objetivo;
  const primera = clasificado && (p.mejores[r.evento] === null || (p.mejores[r.evento] ?? 99) > evento.objetivo);
  const bajas = entero(r.bajas, 0, evento.rivales);
  const monedas = Math.round(evento.premio * (r.puesto === 1 ? 1 : clasificado ? .65 : .25)) + bajas * 35 + (primera ? 100 : 0);
  p.monedas += monedas; p.partidas++; p.bajas += bajas;
  if (r.puesto === 1) p.victorias++;
  p.mejores[r.evento] = Math.min(p.mejores[r.evento] ?? 99, r.puesto);
  if (clasificado) p.desbloqueado = Math.max(p.desbloqueado, Math.min(5, r.evento + 1));
  return { monedas, clasificado, primera };
}
export function equipamiento(p: Perfil): PiezasCarrito {
  const base = piezasClasicas(1, 1, 1);
  return {
    motor: { ...base.motor, mods: [...base.motor.mods, { stat: "velocidadMax", mult: 1 + p.mejoras.motor * .08 }, { stat: "aceleracion", mult: 1 + p.mejoras.motor * .12 }] },
    carroceria: { ...base.carroceria, mods: [...base.carroceria.mods, { stat: "golpeRecibido", mult: 1 - p.mejoras.blindaje * .12 }] },
    ruedas: { ...base.ruedas, mods: [...base.ruedas.mods, { stat: "umbralDerrape", suma: p.mejoras.agarre * 3 }, { stat: "deslizamiento", suma: -p.mejoras.agarre * .4 }] },
  };
}
export function arenaEvento(evento: EventoCarrera): Arena {
  const base = ARENAS_POR_DERBI[evento.arena as NivelDerbi];
  const factor = evento.id === 0 ? .65 : evento.id === 1 || evento.id === 4 ? .7 : .72;
  return { ...base, nombre: evento.zona, ancho: Math.round(base.ancho * factor), alto: Math.round(base.alto * factor), salidas: base.salidas.map(p => ({ x: p.x * factor, y: p.y * factor })), muerteSubita: evento.cierre, velocidadCierre: evento.id === 4 ? 1.1 : .8, tamanoMinimo: .25,
    colorPiso: evento.id === 3 ? 0x9caeb8 : evento.id === 0 ? 0x393d39 : evento.id === 4 ? 0x493a37 : 0x303b40,
    colorLineas: evento.id === 3 ? 0xb5c7ce : evento.id === 0 ? 0x3d423c : 0x3b484b, colorBorde: 0x202629 };
}
