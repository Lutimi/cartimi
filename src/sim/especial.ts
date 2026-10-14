import { fijarVidaCarroceria, fijarVidaMotor, fijarVidaRueda } from "./carrito";
import { INDICES_RUEDA, type Carrito } from "./tipos";
import { aRadianes, distancia } from "./vec";
/** Golpe frontal: mitad exacta de la vida actual, sin modificar las vidas máximas. */
export function megaPunete(jugador: Carrito, rivales: readonly Carrito[]): Carrito | null {
  if (jugador.eliminado) return null;
  const rad = aRadianes(jugador.rotacion);
  const objetivo = rivales.filter(c => {
    if (c.id === jugador.id || c.eliminado) return false;
    const d = distancia(jugador.pos, c.pos);
    const frente = (c.pos.x - jugador.pos.x) * Math.cos(rad) + (c.pos.y - jugador.pos.y) * Math.sin(rad);
    return d <= 260 && frente >= d * .35;
  }).sort((a,b) => distancia(jugador.pos,a.pos) - distancia(jugador.pos,b.pos))[0];
  if (!objetivo) return null;
  fijarVidaCarroceria(objetivo, objetivo.vidaCarroceria * .5);
  fijarVidaMotor(objetivo, objetivo.vidaMotor * .5);
  for (const i of INDICES_RUEDA) fijarVidaRueda(objetivo, i, objetivo.vidaRuedas[i] * .5);
  objetivo.ultimoRival = jugador.id;
  objetivo.velImpacto = { x: Math.cos(rad) * 22, y: Math.sin(rad) * 22 };
  return objetivo;
}
