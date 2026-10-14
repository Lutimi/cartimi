import { FISICA, STATS_BASE, VIDA } from "../data/fisica";
import type { Personaje } from "../data/personajes";
import type { PiezasCarrito } from "../data/piezas";
import { calcularStats } from "./stats";
import { SIN_ENTRADA, type Carrito, type Entrada, type IndiceRueda, type Limites } from "./tipos";
import { aRadianes, conLargo, copiar, escalar, largo, normalizarAngulo, sumar, vec, type Vec } from "./vec";

export interface ParamsCarrito {
  id: number;
  personaje: Personaje;
  piezas: PiezasCarrito;
  esJugador: boolean;
  pos: Vec;
  rotacion: number;
}

export function crearCarrito(p: ParamsCarrito): Carrito {
  const { motor, carroceria, ruedas } = p.piezas;
  const stats = calcularStats(STATS_BASE, [...motor.mods, ...carroceria.mods, ...ruedas.mods]);
  return {
    id: p.id,
    personaje: p.personaje,
    esJugador: p.esJugador,
    piezas: p.piezas,
    stats,
    largo: carroceria.largo,
    ancho: carroceria.ancho,
    pos: copiar(p.pos),
    posAnterior: copiar(p.pos),
    rotacion: p.rotacion,
    velocidad: 0,
    velocidadAngular: 0,
    direccionGiro: 0,
    entradaAnterior: { ...SIN_ENTRADA },
    velMotor: vec(),
    velInercia: vec(),
    velImpacto: vec(),
    velTotal: vec(),
    aceleracion: stats.aceleracion,
    umbralDerrape: stats.umbralDerrape,
    deslizamiento: stats.deslizamiento,
    vidaCarroceria: VIDA.carroceria,
    vidaMotor: VIDA.motor,
    vidaRuedas: [VIDA.rueda, VIDA.rueda, VIDA.rueda, VIDA.rueda],
    derrapando: false,
    eliminado: false,
    ultimoRival: null,
    ia: p.esJugador ? null : { modo: "atacar", objetivo: null, contador: 0 },
  };
}

const limitar = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v));

export const vidaRuedas = (c: Carrito): number => c.vidaRuedas.reduce((suma, v) => suma + v, 0);
export const vidaTotal = (c: Carrito): number => c.vidaCarroceria + c.vidaMotor + vidaRuedas(c);

export function fijarVidaCarroceria(c: Carrito, vida: number): void {
  c.vidaCarroceria = limitar(vida, 0, VIDA.carroceria);
}

export function fijarVidaMotor(c: Carrito, vida: number): void {
  c.vidaMotor = limitar(vida, 0, VIDA.motor);
  // Un motor dañado acelera menos: con 0 de vida, la mitad.
  c.aceleracion = c.stats.aceleracion / 2 + (c.vidaMotor / (2 * VIDA.motor)) * c.stats.aceleracion;
}

export function fijarVidaRueda(c: Carrito, rueda: IndiceRueda, vida: number): void {
  c.vidaRuedas[rueda] = limitar(vida, 0, VIDA.rueda);
  // Ruedas dañadas: derrapa antes y desliza más.
  const perdida = 4 * VIDA.rueda - vidaRuedas(c);
  c.umbralDerrape = c.stats.umbralDerrape - Math.trunc(perdida / 10);
  c.deslizamiento = c.stats.deslizamiento + Math.trunc(perdida / 50);
}

/** La última tecla de giro pulsada manda; al soltarla vuelve a la otra si sigue pulsada. */
export function actualizarDireccion(c: Carrito, e: Entrada): void {
  const antes = c.entradaAnterior;
  if (e.izquierda && !antes.izquierda) c.direccionGiro = -1;
  else if (e.derecha && !antes.derecha) c.direccionGiro = 1;

  if (!e.izquierda && !e.derecha) c.direccionGiro = 0;
  else if (c.direccionGiro === -1 && !e.izquierda) c.direccionGiro = 1;
  else if (c.direccionGiro === 1 && !e.derecha) c.direccionGiro = -1;
  else if (c.direccionGiro === 0) c.direccionGiro = e.izquierda ? -1 : 1;

  c.entradaAnterior = { ...e };
}

function acelerar(c: Carrito, e: Entrada): void {
  const max = c.stats.velocidadMax * (e.nitro && e.adelante ? 1.35 : 1);
  const aceleracion = c.aceleracion * (e.nitro && e.adelante ? 1.8 : 1);
  if (e.adelante) c.velocidad = Math.min(c.velocidad + aceleracion, max);
  else if (e.atras) c.velocidad = Math.max(c.velocidad - c.aceleracion, -max);
  c.velocidad *= FISICA.desaceleracion;
  if (e.freno) { c.velocidad *= .82; c.velInercia = escalar(c.velInercia, .6); }
}

function friccion(c: Carrito): void {
  c.velInercia = largo(c.velInercia) > 0.1 ? escalar(c.velInercia, FISICA.friccionInercia) : vec();
  c.velImpacto = largo(c.velImpacto) > 0.1 ? escalar(c.velImpacto, FISICA.friccionImpacto) : vec();
}

/** Rectángulo alineado a los ejes que contiene al carrito rotado. */
export function cajaAlineada(c: Carrito): Limites {
  const r = aRadianes(c.rotacion);
  const cos = Math.abs(Math.cos(r));
  const sin = Math.abs(Math.sin(r));
  const mx = (c.largo * cos + c.ancho * sin) / 2;
  const my = (c.largo * sin + c.ancho * cos) / 2;
  return { x0: c.pos.x - mx, y0: c.pos.y - my, x1: c.pos.x + mx, y1: c.pos.y + my };
}

/** Al tocar un borde, frena en seco y rebota hacia adentro. Devuelve true si tocó alguno. */
function chocarParedes(c: Carrito, lim: Limites): boolean {
  const caja = cajaAlineada(c);
  const rebote = (componente: number): number => Math.max(Math.abs(componente), FISICA.empujeMinimoPared);
  let toco = false;
  if (caja.y0 < lim.y0) {
    c.velImpacto = { x: c.velImpacto.x, y: rebote(c.velTotal.y) };
    toco = true;
  }
  if (caja.y1 > lim.y1) {
    c.velImpacto = { x: c.velImpacto.x, y: -rebote(c.velTotal.y) };
    toco = true;
  }
  if (caja.x0 < lim.x0) {
    c.velImpacto = { x: rebote(c.velTotal.x), y: c.velImpacto.y };
    toco = true;
  }
  if (caja.x1 > lim.x1) {
    c.velImpacto = { x: -rebote(c.velTotal.x), y: c.velImpacto.y };
    toco = true;
  }
  if (toco) {
    c.velInercia = vec();
    c.velMotor = vec();
    c.velocidad = 0;
    c.velocidadAngular = 0;
  }
  return toco;
}

/** Un fotograma de física (Car.as → NORMAL_update). Devuelve true si tocó un borde. */
export function pasoFisico(c: Carrito, e: Entrada, lim: Limites): boolean {
  c.posAnterior = copiar(c.pos);
  actualizarDireccion(c, e);
  acelerar(c, e);
  friccion(c);
  const tocoPared = chocarParedes(c, lim);

  if (Math.abs(c.velocidadAngular) < 0.5) c.velocidadAngular = 0;
  if (c.velocidadAngular !== 0) {
    c.rotacion += c.velocidadAngular;
    c.velocidadAngular *= FISICA.amortiguacionGiro;
  }
  if (Math.abs(c.velocidad) < 0.005) c.velocidad = 0;

  // Gira más cuanto más rápido va; en reversa el giro se invierte.
  if (largo(c.velMotor) > 1) {
    const giro = (Math.abs(c.velocidad) / c.stats.velocidadMax) * FISICA.giroMax * c.direccionGiro;
    c.rotacion += c.velocidad <= 0 ? -giro : giro;
  }

  // Derrape: la inercia conserva la dirección anterior y la fricción la va soltando.
  c.derrapando = Math.abs(c.velocidad) > c.umbralDerrape && c.direccionGiro !== 0;
  if (c.derrapando) c.velInercia = escalar(c.velTotal, c.deslizamiento);

  c.rotacion = normalizarAngulo(c.rotacion);
  const r = aRadianes(c.rotacion);
  c.velMotor = { x: Math.cos(r) * c.velocidad, y: Math.sin(r) * c.velocidad };
  return tocoPared;
}

/** Car.as → move: la inercia solo cambia la dirección, no la rapidez. */
export function mover(c: Carrito): void {
  const conInercia = conLargo(sumar(c.velMotor, c.velInercia), largo(c.velMotor));
  c.velTotal = sumar(conInercia, c.velImpacto);
  c.pos = sumar(c.pos, c.velTotal);
}
