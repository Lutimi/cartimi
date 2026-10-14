import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({ games: [] as any[], actions: null as any }));
vi.mock("phaser", () => {
  class Game {
    config: any;
    listeners = new Map<string, () => void>();
    events = { once: vi.fn((name: string, fn: () => void) => this.listeners.set(name, fn)), off: vi.fn((name: string) => this.listeners.delete(name)) };
    scene = { add: vi.fn(), start: vi.fn(), stop: vi.fn(), isActive: vi.fn(() => true), getScene: vi.fn(), pause: vi.fn(), resume: vi.fn() };
    scale = { width: 960, height: 600, resize: vi.fn(), getParentBounds: vi.fn(), refresh: vi.fn() };
    destroy = vi.fn();
    constructor(config: any) { this.config = config; mock.games.push(this); }
    boot() { this.config.callbacks.postBoot(this); }
    render() { this.listeners.get("postrender")?.(); }
  }
  return { default: { Game, CANVAS: 1, Scale: { FIT: 3, CENTER_BOTH: 1 }, Core: { Events: { POST_RENDER: "postrender", DESTROY: "destroy" } } } };
});
vi.mock("../src/game/DerbiScene", () => ({ DerbiScene: class {} }));
vi.mock("../src/game/sonido", () => ({ Sonido: class { habilitar() {} tocar() {} } }));
vi.mock("../src/ui/app", () => ({ Interfaz: class {
  constructor(actions: unknown) { mock.actions = actions; }
  terminar() {} pausar() {} actualizar() {}
} }));

const tick = async () => { for (let i=0;i<8;i++) await Promise.resolve(); };
const perfil = { sonido: false };
beforeEach(async () => {
  vi.resetModules(); mock.games.length = 0; mock.actions = null;
  const target = new EventTarget();
  vi.stubGlobal("window", { setTimeout, clearTimeout, addEventListener: target.addEventListener.bind(target), removeEventListener: target.removeEventListener.bind(target), dispatchEvent: target.dispatchEvent.bind(target) });
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callback(0); return 1; });
  await import("../src/main");
});
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });

describe("Play: arranque real de la aplicación", () => {
  it("no crea el motor mientras solo se muestra el menú", () => { expect(mock.games).toHaveLength(0); });
  it("espera al motor y al primer fotograma antes de completar Play", async () => {
    let listo = false;
    const play = mock.actions.jugar(0, perfil, "mily").then(() => { listo=true; });
    await tick(); const game=mock.games[0];
    expect(game).toBeDefined(); expect(game.scene.start).not.toHaveBeenCalled(); expect(listo).toBe(false);
    game.boot(); await tick();
    expect(game.scene.add).toHaveBeenCalledOnce();
    expect(game.scene.start).toHaveBeenCalledWith("derbi", expect.objectContaining({ personaje: "mily", perfil }));
    expect(game.scene.stop).not.toHaveBeenCalled();
    expect(game.scale.getParentBounds).toHaveBeenCalledOnce();
    expect(listo).toBe(false);
    game.render(); await play; expect(listo).toBe(true);
  });
  it("reutiliza el motor al volver a jugar y arranca el evento nuevo", async () => {
    const primero=mock.actions.jugar(0,perfil,"mily");await tick();const game=mock.games[0];game.boot();await tick();game.render();await primero;
    const segundo=mock.actions.jugar(1,perfil,"deportista");await tick();game.render();await segundo;
    expect(mock.games).toHaveLength(1);expect(game.scene.start).toHaveBeenLastCalledWith("derbi",expect.objectContaining({personaje:"deportista",evento:expect.objectContaining({id:1})}));
  });
  it("propaga el error de arranque y permite crear un motor nuevo", async () => {
    const primero=mock.actions.jugar(0,perfil,"mily");const rejected=expect(primero).rejects.toThrow("Fallo de prueba");await tick();
    const event=new Event("error");Object.defineProperty(event,"message",{value:"Fallo de prueba"});window.dispatchEvent(event);await rejected;
    expect(mock.games[0].destroy).toHaveBeenCalledWith(true);
    const segundo=mock.actions.jugar(0,perfil,"mily");await tick();const game=mock.games[1];expect(game).toBeDefined();game.boot();await tick();game.render();await segundo;
  });
});
