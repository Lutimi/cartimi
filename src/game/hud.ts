import Phaser from "phaser";
import { VIDA } from "../data/fisica";
import { vidaTotal } from "../sim/carrito";
import type { Derbi } from "../sim/derbi";
import type { Carrito } from "../sim/tipos";
import { mezclar } from "./dibujo";
import { ALTO, ANCHO, FUENTE } from "./pantalla";

const MARGEN = 12;
const ANCHO_MAPA = 145;
const MAX_MENSAJES = 2;
const DURACION_MENSAJE = 3500;

interface Mensaje {
  texto: string;
  color: number;
  restante: number;
}

const css = (color: number): string => `#${color.toString(16).padStart(6, "0")}`;

/** Fracción de "aguante": 1 = sano, 0 = eliminado (cuando la vida total baja de 100). */
const aguante = (c: Carrito): number =>
  Math.max(0, (vidaTotal(c) - VIDA.minima) / (VIDA.carroceria + VIDA.motor + 4 * VIDA.rueda - VIDA.minima));

const colorVida = (f: number): number => (f > 0.5 ? mezclar(0xf5c518, 0x46a758, (f - 0.5) * 2) : mezclar(0xe5484d, 0xf5c518, f * 2));

export class Hud {
  readonly objetos: Phaser.GameObjects.GameObject[] = [];
  private readonly g: Phaser.GameObjects.Graphics;
  private readonly tiempo: Phaser.GameObjects.Text;
  private readonly aviso: Phaser.GameObjects.Text;
  private readonly centro: Phaser.GameObjects.Text;
  private readonly subtitulo: Phaser.GameObjects.Text;
  private readonly nombresRivales: Phaser.GameObjects.Text[];
  /** Textos fijos que se reutilizan: todo lo del HUD se crea al empezar para que la cámara del mundo lo ignore. */
  private readonly lineasMensajes: Phaser.GameObjects.Text[];
  private mensajes: Mensaje[] = [];
  private reloj = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    derbi: Derbi,
    semilla: number,
  ) {
    this.g = this.agregar(scene.add.graphics());
    const jugador = derbi.jugador;

    this.texto(MARGEN + 12, MARGEN + 8, jugador?.personaje.nombre ?? "", 15, css(jugador?.personaje.color ?? 0xffffff), true);
    this.texto(MARGEN + 12, MARGEN + 49, "Carrocería", 12);
    this.texto(MARGEN + 12, MARGEN + 67, "Motor", 12);
    this.texto(MARGEN + 12, MARGEN + 85, derbi.arena.nombre, 11, "#c9ced6");

    this.tiempo = this.texto(ANCHO / 2, MARGEN + 2, "0:00", 22, "#ffffff", true).setOrigin(0.5, 0);
    this.aviso = this.texto(ANCHO / 2, MARGEN + 32, "", 16, "#ff6b5e", true).setOrigin(0.5, 0);
    this.centro = this.texto(ANCHO / 2, ALTO / 2 - 40, "", 52, "#ffffff", true).setOrigin(0.5);
    this.subtitulo = this.texto(ANCHO / 2, ALTO / 2 + 14, "", 18, "#e6e6e6").setOrigin(0.5);

    const altoMapa = (ANCHO_MAPA * derbi.arena.alto) / derbi.arena.ancho;
    this.nombresRivales = derbi.carritos
      .filter((c) => !c.esJugador)
      .map((c, i) =>
        this.texto(ANCHO - MARGEN - ANCHO_MAPA + 16, MARGEN + altoMapa + 14 + i * 24, c.personaje.nombre, 12),
      );

    this.lineasMensajes = Array.from({ length: MAX_MENSAJES }, (_, i) =>
      this.texto(ANCHO / 2, ALTO - 24 - i * 22, "", 16, "#ffffff", true).setOrigin(0.5, 1),
    );

    this.texto(MARGEN, ALTO - MARGEN, "WASD / Flechas · Espacio: nitro · Shift: freno · E: especial · Esc: pausa", 12, "#c9ced6")
      .setOrigin(0, 1)
      .setAlpha(0.8);
    this.texto(ANCHO - MARGEN, ALTO - MARGEN, `CLUB / ${semilla % 10000}`, 11, "#c9ced6").setOrigin(1, 1).setAlpha(0.6);
  }

  setResolucion(resolucion: number): void {
    for (const objeto of this.objetos) {
      if (objeto instanceof Phaser.GameObjects.Text) objeto.setResolution(resolucion);
    }
  }

  private agregar<T extends Phaser.GameObjects.GameObject>(objeto: T): T {
    this.objetos.push(objeto);
    return objeto;
  }

  private texto(x: number, y: number, texto: string, tamano: number, color = "#ffffff", negrita = false): Phaser.GameObjects.Text {
    return this.agregar(
      this.scene.add
        .text(x, y, texto, {
          fontFamily: FUENTE,
          fontSize: `${tamano}px`,
          fontStyle: negrita ? "bold" : "normal",
          color,
          stroke: "#000000",
          strokeThickness: 1,
        })
        .setDepth(10),
    );
  }

  /** Mensaje abajo al centro; se desvanece solo. */
  decir(texto: string, color = 0xffffff): void {
    this.mensajes.unshift({ texto, color, restante: DURACION_MENSAJE });
    this.mensajes.splice(MAX_MENSAJES);
  }

  anunciar(titulo: string, subtitulo = ""): void {
    this.centro.setText(titulo);
    this.subtitulo.setText(subtitulo);
  }

  actualizar(derbi: Derbi, ms: number): void {
    this.reloj += ms;
    const g = this.g;
    g.clear();

    const segundos = Math.floor(derbi.segundos);
    this.tiempo.setText(`${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, "0")}`);
    const parpadeo = Math.floor(this.reloj / 300) % 2 === 0;
    this.aviso.setText(derbi.enMuerteSubita && !derbi.terminado ? "¡MUERTE SÚBITA!" : "").setAlpha(parpadeo ? 1 : 0.55);

    const jugador = derbi.jugador;
    if (jugador) this.panelJugador(g, jugador);
    this.minimapa(g, derbi);
    this.listaRivales(g, derbi);

    for (const m of this.mensajes) m.restante -= ms;
    this.mensajes = this.mensajes.filter((m) => m.restante > 0);
    this.lineasMensajes.forEach((linea, i) => {
      const m = this.mensajes[i];
      linea.setText(m?.texto ?? "");
      if (m) linea.setColor(css(m.color)).setAlpha(Math.min(1, m.restante / 600));
    });
  }

  private barra(g: Phaser.GameObjects.Graphics, x: number, y: number, ancho: number, alto: number, f: number): void {
    g.fillStyle(0x000000, 0.6);
    g.fillRect(x, y, ancho, alto);
    g.fillStyle(colorVida(f), 1);
    g.fillRect(x + 1, y + 1, Math.max(0, (ancho - 2) * f), alto - 2);
  }

  private panelJugador(g: Phaser.GameObjects.Graphics, c: Carrito): void {
    const x = MARGEN;
    const y = MARGEN;
    g.fillStyle(0x121d18, 0.92);
    g.fillRoundedRect(x, y, 250, 104, 8);

    // Aguante total: llega a 0 cuando el carrito queda eliminado.
    this.barra(g, x + 12, y + 32, 176, 12, aguante(c));
    this.barra(g, x + 92, y + 53, 96, 8, c.vidaCarroceria / VIDA.carroceria);
    this.barra(g, x + 92, y + 71, 96, 8, c.vidaMotor / VIDA.motor);

    // Esquema del carrito visto desde arriba (frente hacia arriba) con el estado de cada rueda.
    const cx = x + 222;
    const cy = y + 54;
    g.fillStyle(mezclar(c.personaje.color, 0x3b3b3b, 1 - c.vidaCarroceria / VIDA.carroceria), 1);
    g.fillRect(cx - 9, cy - 20, 18, 40);
    g.fillStyle(mezclar(c.personaje.colorMotor, 0x262626, 1 - c.vidaMotor / VIDA.motor), 1);
    g.fillRect(cx - 6, cy - 17, 12, 12);
    const ruedas: [number, number][] = [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ];
    ruedas.forEach(([lado, fila], i) => {
      g.fillStyle(colorVida((c.vidaRuedas[i] ?? 0) / VIDA.rueda), 1);
      g.fillRect(cx + lado * 13 - 3, cy + fila * 11 - 6, 6, 12);
    });
  }

  private minimapa(g: Phaser.GameObjects.Graphics, derbi: Derbi): void {
    const escala = ANCHO_MAPA / derbi.arena.ancho;
    const alto = derbi.arena.alto * escala;
    const x0 = ANCHO - MARGEN - ANCHO_MAPA;
    const y0 = MARGEN;
    g.fillStyle(0x000000, 0.45);
    g.fillRect(x0 - 4, y0 - 4, ANCHO_MAPA + 8, alto + 8);
    g.fillStyle(derbi.arena.colorPiso, 0.5);
    g.fillRect(x0, y0, ANCHO_MAPA, alto);
    if (derbi.enMuerteSubita) {
      const l = derbi.limites;
      g.lineStyle(1.5, 0xff4d3d, 1);
      g.strokeRect(x0 + l.x0 * escala, y0 + l.y0 * escala, (l.x1 - l.x0) * escala, (l.y1 - l.y0) * escala);
    }
    for (const c of derbi.carritos) {
      const px = x0 + c.pos.x * escala;
      const py = y0 + c.pos.y * escala;
      if (c.eliminado) {
        g.fillStyle(0x555555, 0.8);
        g.fillCircle(px, py, 2);
        continue;
      }
      g.fillStyle(c.personaje.color, 1);
      g.fillCircle(px, py, c.esJugador ? 4.5 : 3.5);
      if (c.esJugador) {
        g.lineStyle(1.5, 0xffffff, 1);
        g.strokeCircle(px, py, 4.5);
      }
    }
  }

  private listaRivales(g: Phaser.GameObjects.Graphics, derbi: Derbi): void {
    const x0 = ANCHO - MARGEN - ANCHO_MAPA;
    derbi.carritos
      .filter((c) => !c.esJugador)
      .forEach((c, i) => {
        const nombre = this.nombresRivales[i];
        if (!nombre) return;
        const y = nombre.y;
        g.fillStyle(c.eliminado ? 0x555555 : c.personaje.color, 1);
        g.fillRect(x0, y + 3, 10, 10);
        nombre.setAlpha(c.eliminado ? 0.45 : 1).setText(c.eliminado ? `${c.personaje.nombre} — fuera` : c.personaje.nombre);
        if (!c.eliminado) this.barra(g, x0 + 16, y + 16, ANCHO_MAPA - 20, 3, aguante(c));
      });
  }
}
