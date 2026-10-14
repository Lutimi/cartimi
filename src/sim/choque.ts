import { DANO } from "../data/fisica";
import type { Azar } from "./azar";
import { fijarVidaCarroceria, fijarVidaMotor, fijarVidaRueda } from "./carrito";
import { mitadMasCercana, zonasTocadas, type Zona } from "./colision";
import type { Carrito, Evento } from "./tipos";
import { copiar, escalar, largo, restar, sumar, vec } from "./vec";

/** Aplica el daño completo a cada zona tocada, como el original. */
export function aplicarDano(c: Carrito, zonas: readonly Zona[], dano: number, otro: Carrito): void {
  // El frente y la trasera cubren todo el carrito, así que esto solo pasa por redondeo en un borde.
  const tocadas = zonas.length > 0 ? zonas : [mitadMasCercana(c, otro.pos)];
  for (const z of tocadas) {
    if (z === "frente") fijarVidaMotor(c, c.vidaMotor - dano);
    else if (z === "trasera") fijarVidaCarroceria(c, c.vidaCarroceria - dano);
    else fijarVidaRueda(c, z, c.vidaRuedas[z] - dano);
  }
}

/**
 * Choque entre dos carritos (Car.as → handleDamage y Game.as → DeterminePositions).
 * El más rápido es el atacante: recibe la mitad del daño que causa (ajustado por pesos).
 */
export function resolverChoque(
  c1: Carrito,
  c2: Carrito,
  azar: Azar,
  eventos: Evento[],
): { atacante: Carrito; victima: Carrito } {
  const [atacante, victima] = largo(c1.velTotal) > largo(c2.velTotal) ? [c1, c2] : [c2, c1];
  const relativa = largo(restar(atacante.velTotal, victima.velTotal));
  let danoVictima = relativa * atacante.stats.peso * victima.stats.golpeRecibido;
  let danoAtacante = ((relativa * victima.stats.peso) / 2) * atacante.stats.golpeRecibido;
  if (victima.esJugador) danoVictima *= DANO.factorJugador;
  if (atacante.esJugador) danoAtacante *= DANO.factorJugador;

  // Las zonas se miden antes de separar a los carritos.
  const zonasVictima = zonasTocadas(victima, atacante);
  const zonasAtacante = zonasTocadas(atacante, victima);
  aplicarDano(victima, zonasVictima, danoVictima, atacante);
  aplicarDano(atacante, zonasAtacante, danoAtacante, victima);
  atacante.ultimoRival = victima.id;
  victima.ultimoRival = atacante.id;
  eventos.push({
    tipo: "choque",
    atacante: atacante.id,
    victima: victima.id,
    danoAtacante,
    danoVictima,
    punto: escalar(sumar(c1.pos, c2.pos), 0.5),
  });

  // Rebote: cada uno vuelve a donde estaba y sale empujado con la velocidad del otro.
  const giro = Math.max(Math.abs(c1.velocidad), Math.abs(c2.velocidad)) / 2;
  const impacto1 = escalar(c2.velTotal, c1.stats.golpeRecibido);
  const impacto2 = escalar(c1.velTotal, c2.stats.golpeRecibido);
  for (const [c, impacto] of [
    [c1, impacto1],
    [c2, impacto2],
  ] as const) {
    c.pos = copiar(c.posAnterior);
    c.velImpacto = impacto;
    c.velMotor = vec();
    c.velInercia = vec();
    c.velocidad = 0;
  }
  c1.velocidadAngular = azar.entero(giro) - giro / 2;
  c2.velocidadAngular = -c1.velocidadAngular;

  return { atacante, victima };
}
