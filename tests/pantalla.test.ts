import { describe, expect, it } from "vitest";
import { ALTO, ANCHO, ZOOM, calcularResolucion } from "../src/game/pantalla";

describe("nitidez y tamaño lógico del juego", () => {
  it.each([[960,600,1,1],[1920,1080,1,2],[1440,900,1,1.5],[1440,900,2,3],[390,844,3,1.25],[3840,2160,2,3]])("elige la densidad para %i × %i a %i DPR", (w,h,dpr,esperado) => {
    expect(calcularResolucion(w,h,dpr)).toBe(esperado);
  });
  it("mantiene el campo de visión y el espacio del HUD al subir la resolución", () => {
    for(const r of [1,1.5,2,3]) {
      expect(ANCHO*r/(ZOOM*r)).toBeCloseTo(ANCHO/ZOOM);
      expect(ALTO*r/r).toBe(ALTO);
    }
  });
  it("no genera dimensiones nulas al ocultar el contenedor", () => {
    expect(calcularResolucion(0,0,0)).toBe(1);
    expect(calcularResolucion(NaN,Infinity,NaN)).toBe(1);
  });
});
