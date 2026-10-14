import { SIN_ENTRADA, type Carrito, type Entrada, type Limites, type Mundo } from "./tipos";
import { anguloHacia, normalizarAngulo, type Vec } from "./vec";

// IA del original (AICar.as, ver docs/analisis-original.md §5).

/** Diferencia de ángulo (grados) que ignora antes de girar. */
const ZONA_MUERTA = 10;

const buscarVivo = (mundo: Mundo, id: number | null): Carrito | undefined =>
  id === null ? undefined : mundo.carritos.find((c) => c.id === id && !c.eliminado);

const centro = (l: Limites): Vec => ({ x: (l.x0 + l.x1) / 2, y: (l.y0 + l.y1) / 2 });

function elegirObjetivo(c: Carrito, mundo: Mundo): void {
  if (!c.ia) return;
  const otros = mundo.carritos.filter((o) => o !== c && !o.eliminado);
  c.ia.objetivo = otros.length > 0 ? mundo.azar.elegir(otros).id : null;
}

/** Gira hacia el ángulo deseado. Si está detrás, va en reversa y embiste con la parte trasera. */
export function conducirHacia(c: Carrito, anguloDeseado: number): Entrada {
  const diferencia = normalizarAngulo(anguloDeseado - c.rotacion);
  const entrada: Entrada = {
    adelante: false,
    atras: false,
    izquierda: diferencia < -ZONA_MUERTA,
    derecha: diferencia > ZONA_MUERTA,
  };
  // No acelera si tiene que girar mucho yendo rápido.
  if (Math.abs(diferencia) < 90) {
    entrada.adelante = !(Math.abs(diferencia) > 30 && c.velocidad > 15);
  } else {
    entrada.atras = !(Math.abs(diferencia) > 45 && c.velocidad > 15);
  }
  return entrada;
}

export function pensar(c: Carrito, mundo: Mundo): Entrada {
  const ia = c.ia;
  if (!ia) return SIN_ENTRADA;

  if (ia.modo === "huir") {
    ia.contador--;
    const rival = buscarVivo(mundo, c.ultimoRival);
    if (ia.contador > 0 && rival) return conducirHacia(c, anguloHacia(c.pos, rival.pos) + 180);
    ia.modo = "atacar";
  }

  if (ia.modo === "centro") {
    ia.contador--;
    if (ia.contador > 0) return conducirHacia(c, anguloHacia(c.pos, centro(mundo.limites)));
    ia.modo = "atacar";
  }

  let objetivo = buscarVivo(mundo, ia.objetivo);
  if (!objetivo) {
    elegirObjetivo(c, mundo);
    objetivo = buscarVivo(mundo, ia.objetivo);
  }
  return objetivo ? conducirHacia(c, anguloHacia(c.pos, objetivo.pos)) : SIN_ENTRADA;
}

/** Después de embestir a alguien, huye un momento y elige otro objetivo. */
export function alGolpear(c: Carrito, mundo: Mundo): void {
  if (!c.ia || c.ia.modo === "huir") return;
  c.ia.modo = "huir";
  c.ia.contador = 20 + mundo.azar.entero(20);
  elegirObjetivo(c, mundo);
}

/** Después de tocar un borde, va un rato hacia el centro. */
export function alTocarPared(c: Carrito, mundo: Mundo): void {
  if (!c.ia) return;
  c.ia.modo = "centro";
  c.ia.contador = 10 + mundo.azar.entero(20);
}
