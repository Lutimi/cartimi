import Phaser from "phaser";
import { ALTO, ANCHO, resolucionVentana } from "./game/pantalla";
import { DerbiScene } from "./game/DerbiScene";
import { Interfaz } from "./ui/app";
import { EVENTOS } from "./meta/progreso";
import { Sonido } from "./game/sonido";
import { inicioUnico } from "./game/inicio";
import "./ui/style.css";

const sonido = new Sonido();
let juego: Phaser.Game | null = null;

// Phaser mide su contenedor durante el boot: debe estar visible antes de crearlo.
const cargarMotor = inicioUnico(() => new Promise<Phaser.Game>((resolve, reject) => {
  let terminado = false;
  const limpiar = () => { clearTimeout(espera); window.removeEventListener("error", errorArranque); };
  const fallar = (error: Error) => {
    if (terminado) return;
    terminado = true;
    limpiar();
    juego?.destroy(true);
    juego = null;
    reject(error);
  };
  const errorArranque = (event: ErrorEvent) => fallar(new Error(event.message || "No se pudo iniciar el motor."));
  const espera = window.setTimeout(() => fallar(new Error("El motor tardó demasiado en iniciar. Recarga la página e inténtalo otra vez.")), 12000);
  window.addEventListener("error", errorArranque);
  try {
    const resolucion = resolucionVentana();
    juego = new Phaser.Game({
      // El juego usa gráficos 2D. Canvas funciona también en vistas integradas sin WebGL.
      type: Phaser.CANVAS,
      parent: "juego", width: ANCHO * resolucion, height: ALTO * resolucion, backgroundColor: "#121817",
      scene: [],
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      render: { antialias: true, roundPixels: false },
      callbacks: { postBoot: game => {
        if (terminado) { game.destroy(true); return; }
        try {
          game.scene.add("derbi", DerbiScene, false);
          const alRedimensionar = () => ajustarResolucion(game);
          window.addEventListener("resize", alRedimensionar);
          game.events.once(Phaser.Core.Events.DESTROY, () => window.removeEventListener("resize", alRedimensionar));
          terminado = true;
          limpiar();
          if (import.meta.env.DEV) Object.assign(window, { juego: game });
          resolve(game);
        } catch (error) { fallar(error instanceof Error ? error : new Error(String(error))); }
      } },
    });
  } catch (error) { fallar(error instanceof Error ? error : new Error(String(error))); }
}));

function ajustarResolucion(game: Phaser.Game): void {
  const resolucion = resolucionVentana();
  if (game.scale.width !== ANCHO * resolucion || game.scale.height !== ALTO * resolucion) {
    game.scale.resize(ANCHO * resolucion, ALTO * resolucion);
  }
}

const ui = new Interfaz({
  jugar: async (evento, perfil, personaje) => {
    sonido.habilitar();
    // Permite aplicar el cambio de visibilidad y medir el tamaño real del contenedor.
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    const game = await cargarMotor();
    ajustarResolucion(game);
    game.scale.getParentBounds();
    game.scale.refresh();
    // start ya reinicia las escenas activas; no se debe apagar una escena sin estrenar.
    game.scene.start("derbi", {
      evento: EVENTOS[evento], perfil, personaje,
      alTerminar: ui.terminar.bind(ui), alPausar: ui.pausar.bind(ui), alActualizar: ui.actualizar.bind(ui),
      sonido: (tipo: "golpe" | "nitro" | "premio" | "punete") => sonido.tocar(tipo, perfil.sonido),
    });
    if (!game.scene.isActive("derbi")) throw new Error("La arena no pudo iniciarse.");
    // Quita el indicador de carga solo después de dibujar un fotograma de la arena.
    await new Promise<void>((resolve, reject) => {
      const completar = () => { clearTimeout(timeout); window.removeEventListener("error", fallar); resolve(); };
      const fallar = (e: ErrorEvent) => { clearTimeout(timeout); game.events.off(Phaser.Core.Events.POST_RENDER, completar); window.removeEventListener("error", fallar); reject(new Error(e.message || "No se pudo dibujar la arena.")); };
      const timeout = window.setTimeout(() => { game.events.off(Phaser.Core.Events.POST_RENDER, completar); window.removeEventListener("error", fallar); reject(new Error("La arena no respondió. Inténtalo de nuevo.")); }, 8000);
      window.addEventListener("error", fallar);
      game.events.once(Phaser.Core.Events.POST_RENDER, completar);
    });
  },
  pausa: estado => {
    if (!juego?.scene.getScene("derbi")) return;
    if (estado) juego.scene.pause("derbi");
    else { juego.scene.getScene("derbi").input.keyboard?.resetKeys(); juego.scene.resume("derbi"); }
  },
  salir: () => { juego?.scene.stop("derbi"); },
});
