import Phaser from "phaser";
import { DANO, FISICA } from "../data/fisica";
import { AVISOS_VIDA, FRASES, PARTES_ROTAS } from "../data/frases";
import { arenaEvento, equipamiento, PINTURAS } from "../meta/progreso";
import { tactil, type DatosCarrera } from "./puente";
import { megaPunete } from "../sim/especial";
import { armarDerbiClasico, type NivelDerbi } from "../sim/armar";
import { vidaTotal, fijarVidaCarroceria, fijarVidaMotor, fijarVidaRueda } from "../sim/carrito";
import { Derbi } from "../sim/derbi";
import { INDICES_RUEDA, type Carrito, type Entrada, type Evento } from "../sim/tipos";
import { normalizarAngulo } from "../sim/vec";
import { BORDE, dibujarCarrito, dibujarMuerteSubita, dibujarPiso, type Pose } from "./dibujo";
import { Efectos } from "./efectos";
import { Hud } from "./hud";
import { ALTO, ANCHO, ZOOM } from "./pantalla";

const PASO_MS = 1000 / FISICA.fps;
const CUENTA_ATRAS_MS = 2400;
/** Si el navegador se traba, no simula más de esto de golpe. */
const MAX_PASOS_POR_CUADRO = 5;

type Teclas = Record<"arriba" | "abajo" | "izquierda" | "derecha" | "w" | "a" | "s" | "d" | "nitro" | "freno" | "especial", Phaser.Input.Keyboard.Key>;



const elegir = <T>(lista: readonly T[]): T => lista[Math.floor(Math.random() * lista.length)] as T;
const conNombre = (frase: string, nombre: string): string => frase.replaceAll("{nombre}", nombre);



/**
 * Un derbi jugable. Parámetros opcionales en la URL:
 * ?derbi=1..4  ?semilla=123  ?motor=0..2&carroceria=0..2&ruedas=0..2 (piezas del jugador)
 */
export class DerbiScene extends Phaser.Scene {
  private derbi!: Derbi;
  private nivel: NivelDerbi = 1;
  private datos!: DatosCarrera;
  private nitro = 100;
  private especial = 100;
  private bajas = 0;
  private resultadoEnviado = false;
  private reparaciones: { x: number; y: number; activa: boolean; volver: number }[] = [];
  private golpe: { x: number; y: number; tx: number; ty: number; hasta: number } | null = null;
  private semilla = 0;
  private piso!: Phaser.GameObjects.Graphics;
  private g!: Phaser.GameObjects.Graphics;
  private hud!: Hud;
  private efectos = new Efectos();
  private teclas!: Teclas;
  private acumulado = 0;
  private cuentaAtras = 0;
  private reloj = 0;
  private poses = new Map<number, Pose>();
  /** Avisos de daño del jugador que ya se mostraron (para no repetirlos). */
  private avisosDados = new Set<string>();

  constructor() {
    super("derbi");
  }

  init(datos: DatosCarrera): void {
    this.datos = datos;
    this.nivel = Math.min(4, datos.evento.id + 1) as NivelDerbi;
    const seed = new URLSearchParams(location.search).get("semilla");
    this.semilla = seed !== null && Number.isFinite(Number(seed)) ? Number(seed) : Math.floor(Math.random() * 2 ** 31);
  }

  create(): void {
    const config = armarDerbiClasico({ semilla: this.semilla, nivel: this.nivel, arena: arenaEvento(this.datos.evento), jugador: this.datos.personaje, piezasJugador: equipamiento(this.datos.perfil) });
    config.rivales = config.rivales.slice(0, this.datos.evento.rivales);
    if (config.jugador) {
      const color = PINTURAS.find(p => p.id === this.datos.perfil.pintura)!.color;
      config.jugador.personaje = { ...config.jugador.personaje, color: Number.parseInt(color.slice(1), 16) };
    }
    this.derbi = new Derbi(config);
    if (this.derbi.jugador && this.datos.personaje === "deportista") {
      this.derbi.jugador.stats.aceleracion *= 1.1;
      this.derbi.jugador.aceleracion = this.derbi.jugador.stats.aceleracion;
    }
    if (this.datos.evento.id === 3) for (const c of this.derbi.carritos) {
      c.stats.deslizamiento += 1.5; c.deslizamiento = c.stats.deslizamiento;
      c.stats.umbralDerrape -= 3; c.umbralDerrape = c.stats.umbralDerrape;
    }
    this.nitro = 100; this.especial = 100; this.bajas = 0; this.resultadoEnviado = false; this.golpe = null;
    this.reparaciones = [[.3,.35],[.7,.65],[.5,.5]].map(([x,y]) => ({ x: this.derbi.arena.ancho * x!, y: this.derbi.arena.alto * y!, activa: true, volver: 0 }));
    this.efectos = new Efectos();
    this.poses.clear();
    this.avisosDados.clear();
    this.acumulado = 0;
    this.reloj = 0;
    this.cuentaAtras = CUENTA_ATRAS_MS;

    const arena = this.derbi.arena;
    this.piso = this.add.graphics();
    dibujarPiso(this.piso, arena);
    this.g = this.add.graphics();
    this.hud = new Hud(this, this.derbi, this.semilla);

    // Cámara del mundo con zoom y una segunda cámara fija para el HUD.
    for (const extra of this.cameras.cameras.slice(1)) this.cameras.remove(extra);
    const camara = this.cameras.main;
    camara.setZoom(ZOOM * this.scale.width / ANCHO);
    camara.setBounds(-BORDE, -BORDE, arena.ancho + 2 * BORDE, arena.alto + 2 * BORDE);
    camara.ignore(this.hud.objetos);
    const camaraHud = this.cameras.add(0, 0, this.scale.width, this.scale.height).ignore([this.piso, this.g]);
    const ajustarCamaras = () => {
      const resolucion = this.scale.width / ANCHO;
      camara.setSize(this.scale.width, this.scale.height).setZoom(ZOOM * resolucion);
      camaraHud.setSize(this.scale.width, this.scale.height).setZoom(resolucion).centerOn(ANCHO / 2, ALTO / 2);
      this.hud.setResolucion(resolucion);
    };
    ajustarCamaras();
    this.scale.on(Phaser.Scale.Events.RESIZE, ajustarCamaras);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off(Phaser.Scale.Events.RESIZE, ajustarCamaras));

    const teclado = this.input.keyboard;
    if (!teclado) throw new Error("Este juego necesita teclado");
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.teclas = teclado.addKeys({
      arriba: K.UP,
      abajo: K.DOWN,
      izquierda: K.LEFT,
      derecha: K.RIGHT,
      w: K.W,
      a: K.A,
      s: K.S,
      d: K.D,
      nitro: K.SPACE,
      freno: K.SHIFT,
      especial: K.E,
    }) as Teclas;
    const alPausar = () => this.datos.alPausar();
    teclado.on("keydown-P", alPausar);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { teclado.off("keydown-P", alPausar); teclado.removeAllKeys(true, true); });

    this.guardarPoses();
    this.hud.decir(`Derbi ${this.nivel}: ${arena.nombre}`);
  }

  update(_tiempo: number, delta: number): void {
    const ms = Math.min(delta, 250);
    this.reloj += ms;

    if (this.cuentaAtras > 0) {
      this.cuentaAtras -= ms;
      const n = Math.ceil((this.cuentaAtras / CUENTA_ATRAS_MS) * 3);
      this.hud.anunciar(this.cuentaAtras > 0 ? String(n) : "¡YA!");
      if (this.cuentaAtras <= 0) this.time.delayedCall(700, () => !this.derbi.terminado && this.hud.anunciar(""));
    } else {
      this.acumulado += ms;
      let pasos = 0;
      while (this.acumulado >= PASO_MS && pasos < MAX_PASOS_POR_CUADRO) {
        this.guardarPoses();
        this.habilidades();
        this.procesar(this.derbi.paso(this.leerEntrada()));
        this.recogerReparaciones();
        this.efectosDelPaso();
        this.acumulado -= PASO_MS;
        pasos++;
      }
      if (pasos === MAX_PASOS_POR_CUADRO) this.acumulado = 0;
    }

    const alfa = this.cuentaAtras > 0 ? 1 : this.acumulado / PASO_MS;
    this.dibujar(alfa);
    this.hud.actualizar(this.derbi, ms);
    this.datos.alActualizar({ nitro: this.nitro, velocidad: Math.abs(this.derbi.jugador?.velocidad ?? 0), especial: this.especial });
  }

  private leerEntrada(): Entrada {
    const t = this.teclas;
    return {
      adelante: t.arriba.isDown || t.w.isDown || tactil.adelante,
      atras: t.abajo.isDown || t.s.isDown || tactil.atras,
      izquierda: t.izquierda.isDown || t.a.isDown || tactil.izquierda,
      derecha: t.derecha.isDown || t.d.isDown || tactil.derecha,
      nitro: (t.nitro.isDown || tactil.nitro) && this.nitro > 1,
      freno: t.freno.isDown || tactil.freno,
    };
  }

  private guardarPoses(): void {
    for (const c of this.derbi.carritos) this.poses.set(c.id, { x: c.pos.x, y: c.pos.y, rotacion: c.rotacion });
  }

  /** Posición entre el fotograma anterior y el actual, para que se vea fluido a más de 31 fps. */
  private pose(c: Carrito, alfa: number): Pose {
    const antes = this.poses.get(c.id) ?? { x: c.pos.x, y: c.pos.y, rotacion: c.rotacion };
    return {
      x: antes.x + (c.pos.x - antes.x) * alfa,
      y: antes.y + (c.pos.y - antes.y) * alfa,
      rotacion: antes.rotacion + normalizarAngulo(c.rotacion - antes.rotacion) * alfa,
    };
  }

  private dibujar(alfa: number): void {
    const g = this.g;
    g.clear();
    if (this.derbi.enMuerteSubita) {
      dibujarMuerteSubita(g, this.derbi.arena, this.derbi.limites, Math.floor(this.reloj / 250) % 2);
    }
    this.efectos.dibujarMarcas(g);
    for (const p of this.reparaciones) if (p.activa) {
      const pulse = 2 + Math.sin(this.reloj / 220) * 2;
      g.fillStyle(0xa6d294, .08); g.fillCircle(p.x, p.y, 25 + pulse);
      g.lineStyle(1.5, 0xbbe7a4, .55); g.strokeCircle(p.x, p.y, 17 + pulse);
      g.fillStyle(0x1f3928, 1); g.fillRoundedRect(p.x - 12, p.y - 12, 24, 24, 5);
      g.fillStyle(0xc5f0ac, 1); g.fillRect(p.x - 7, p.y - 2, 14, 4); g.fillRect(p.x - 2, p.y - 7, 4, 14);
    }
    const jugador = this.derbi.jugador;
    if (jugador && !jugador.eliminado && this.datos.personaje === "mily" && this.especial >= 100) {
      const rad = jugador.rotacion * Math.PI / 180;
      g.lineStyle(1, 0xcaabef, .25); g.beginPath();
      g.arc(jugador.pos.x, jugador.pos.y, 140, rad - .9, rad + .9); g.strokePath();
    }
    // Restos abajo, el jugador arriba de todo.
    const orden = [...this.derbi.carritos].sort(
      (a, b) => Number(!a.eliminado) - Number(!b.eliminado) || Number(a.esJugador) - Number(b.esJugador),
    );
    for (const c of orden) dibujarCarrito(g, c, this.pose(c, alfa));
    this.efectos.dibujarParticulas(g);
    if (this.golpe && this.golpe.hasta > this.reloj) {
      const p = this.golpe; const alpha = Math.min(1, (p.hasta - this.reloj) / 300);
      g.lineStyle(19, 0xba8ee8, alpha * .55); g.lineBetween(p.x, p.y, p.tx, p.ty);
      g.fillStyle(0xd9baf8, alpha); g.fillRoundedRect(p.tx - 26, p.ty - 15, 42, 32, 7);
      for (let i = 0; i < 4; i++) g.fillRoundedRect(p.tx - 24 + i * 11, p.ty - 25, 10, 20, 4);
      g.lineStyle(3, 0xffd995, alpha); g.strokeCircle(p.tx, p.ty, 45 + (1 - alpha) * 55);
    }

    const seguido = this.derbi.jugador?.eliminado === false ? this.derbi.jugador : this.derbi.vivos[0];
    if (seguido) {
      const p = this.pose(seguido, alfa);
      this.cameras.main.centerOn(p.x, p.y);
    }
  }

  private efectosDelPaso(): void {
    for (const c of this.derbi.vivos) {
      if (c.derrapando) this.efectos.derrape(c);
      // Humo según el daño (en el original: random(300 − vida) > 50).
      if (Math.random() * (300 - vidaTotal(c)) > 50 && Math.random() < 0.3) this.efectos.humo(c.pos);
    }
    this.efectos.avanzar();
  }

  private carrito(id: number | null): Carrito | undefined {
    return id === null ? undefined : this.derbi.carritos.find((c) => c.id === id);
  }

  private procesar(eventos: Evento[]): void {
    const jugador = this.derbi.jugador;
    for (const e of eventos) {
      switch (e.tipo) {
        case "choque": {
          const dano = Math.max(e.danoVictima, e.danoAtacante);
          this.efectos.chispas(e.punto, dano);
          if (dano > 7 && (e.atacante === jugador?.id || e.victima === jugador?.id)) this.datos.sonido("golpe");
          const atacante = this.carrito(e.atacante);
          const victima = this.carrito(e.victima);
          if (!jugador || !atacante || !victima) break;
          if (victima === jugador || atacante === jugador) {
            if (dano >= DANO.golpeFuerte) this.cameras.main.shake(120, Math.min(0.012, dano / 1500));
            this.revisarDanoJugador(jugador);
          }
          // Como en el original, cada frase sale la mitad de las veces.
          if (Math.random() < 0.5) break;
          if (victima === jugador) {
            const frases = e.danoVictima >= DANO.golpeFuerte ? FRASES.rivalGolpeaFuerte : FRASES.rivalGolpeaSuave;
            this.hablar(atacante, conNombre(elegir(frases), jugador.personaje.nombre));
          } else if (atacante === jugador) {
            const frases = e.danoVictima >= DANO.golpeFuerte ? FRASES.rivalRecibeFuerte : FRASES.rivalRecibeSuave;
            this.hablar(victima, conNombre(elegir(frases), jugador.personaje.nombre));
          }
          break;
        }
        case "eliminado": {
          const eliminado = this.carrito(e.id);
          if (!eliminado) break;
          this.efectos.explosion(eliminado.pos);
          if (eliminado === jugador) {
            this.cameras.main.shake(300, 0.015);
          } else if (jugador && e.por === jugador.id) {
            this.bajas++;
            this.datos.sonido("premio");
            this.hud.decir(conNombre(elegir(FRASES.jugadorEliminaA), eliminado.personaje.nombre), 0xffd166);
            if (Math.random() < 0.5) {
              this.hablar(eliminado, conNombre(elegir(FRASES.rivalEliminadoPorJugador), jugador.personaje.nombre));
            }
          } else {
            this.hud.decir(conNombre(elegir(FRASES.eliminadoPorOtros), eliminado.personaje.nombre), 0xc9ced6);
          }
          break;
        }
        case "muerteSubita":
          this.hud.decir("¡Muerte súbita! La arena se está cerrando", 0xff6b5e);
          break;
        case "fin":
          this.mostrarResultado(e.ganador);
          break;
        case "pared":
          break;
      }
    }
  }

  private hablar(c: Carrito, frase: string): void {
    this.hud.decir(`${c.personaje.nombre}: ${frase}`, c.personaje.color);
  }

  /** Avisos cuando se rompe una parte o la vida total baja de ciertos umbrales (cada uno una sola vez). */
  private revisarDanoJugador(j: Carrito): void {
    const avisar = (clave: string, texto: string): void => {
      if (this.avisosDados.has(clave)) return;
      this.avisosDados.add(clave);
      this.hablar(j, texto);
    };
    if (j.vidaMotor <= 0) avisar("motor", PARTES_ROTAS.motor);
    if (j.vidaCarroceria <= 0) avisar("carroceria", PARTES_ROTAS.carroceria);
    for (const i of INDICES_RUEDA) if (j.vidaRuedas[i] <= 0) avisar(`rueda${i}`, PARTES_ROTAS.ruedas[i]);
    const total = vidaTotal(j);
    for (const aviso of AVISOS_VIDA) if (total < aviso.menosDe) avisar(`vida${aviso.menosDe}`, aviso.texto);
  }

  private mostrarResultado(_ganador: number | null): void {
    if (this.resultadoEnviado || !this.derbi.jugador) return;
    this.resultadoEnviado = true;
    const resultado = { evento: this.datos.evento.id, puesto: this.derbi.puesto(this.derbi.jugador.id) ?? this.derbi.carritos.length, bajas: this.bajas, segundos: this.derbi.segundos };
    this.hud.anunciar(resultado.puesto === 1 ? "¡VICTORIA!" : resultado.puesto + ".º PUESTO");
    this.time.delayedCall(1000, () => this.datos.alTerminar(resultado));
  }

  private habilidades(): void {
    if (this.derbi.terminado) return;
    const entrada = this.leerEntrada();
    this.nitro = Math.max(0, Math.min(100, this.nitro + (entrada.nitro && entrada.adelante ? -1.5 : .38)));
    this.especial = Math.min(100, this.especial + 100 / (20 * FISICA.fps));
    const pulsado = Phaser.Input.Keyboard.JustDown(this.teclas.especial) || tactil.especial;
    tactil.especial = false;
    const j = this.derbi.jugador;
    if (entrada.nitro && entrada.adelante && j) {
      this.efectos.chispas({ x: j.pos.x - Math.cos(j.rotacion * Math.PI / 180) * 28, y: j.pos.y - Math.sin(j.rotacion * Math.PI / 180) * 28 }, 2);
    }
    if (!pulsado || this.datos.personaje !== "mily" || !j || this.especial < 100) return;
    const objetivo = megaPunete(j, this.derbi.carritos);
    if (!objetivo) { this.hud.decir("Acércate y apunta al rival con el frente. El puñete sigue listo.", 0xd4b7f2); return; }
    this.especial = 0;
    this.golpe = { x: j.pos.x, y: j.pos.y, tx: objetivo.pos.x, ty: objetivo.pos.y, hasta: this.reloj + 600 };
    this.efectos.chispas(objetivo.pos, 60); this.cameras.main.shake(220, .012);
    this.hud.decir("¡MEGA PUÑETE! −50% de vida a " + objetivo.personaje.nombre, 0xe0bfff);
    this.datos.sonido("punete");
  }

  private recogerReparaciones(): void {
    const j = this.derbi.jugador;
    if (!j || j.eliminado || this.derbi.terminado) return;
    const lim = this.derbi.limites;
    for (const p of this.reparaciones) {
      if (p.x < lim.x0 + 30 || p.x > lim.x1 - 30 || p.y < lim.y0 + 30 || p.y > lim.y1 - 30) { p.activa = false; continue; }
      if (!p.activa && this.derbi.segundos >= p.volver) p.activa = true;
      if (!p.activa || vidaTotal(j) >= 299 || Math.hypot(j.pos.x - p.x, j.pos.y - p.y) > 38) continue;
      fijarVidaCarroceria(j, j.vidaCarroceria + 18); fijarVidaMotor(j, j.vidaMotor + 18);
      for (const i of INDICES_RUEDA) fijarVidaRueda(j, i, j.vidaRuedas[i] + 6);
      p.activa = false; p.volver = this.derbi.segundos + 18;
      this.hud.decir("Reparación recogida · hasta +60 de vida", 0xc1e7a3); this.datos.sonido("premio");
    }
  }
}
