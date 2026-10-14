/** Coordenadas lógicas: el render puede tener más píxeles sin cambiar el juego. */
export const ANCHO = 960;
export const ALTO = 600;
export const ZOOM = 1.15;
export const FUENTE = "system-ui, 'Segoe UI', Roboto, sans-serif";

/** Densidad suficiente para el tamaño visible y la pantalla, con un límite de coste. */
export function calcularResolucion(ancho: number, alto: number, densidad = 1): number {
  const w = Number.isFinite(ancho) && ancho > 0 ? ancho : ANCHO;
  const h = Number.isFinite(alto) && alto > 0 ? alto : ALTO;
  const dpr = Number.isFinite(densidad) && densidad > 0 ? densidad : 1;
  const escala = Math.min(w / ANCHO, h / ALTO) * dpr;
  return Math.max(1, Math.min(3, Math.ceil(escala * 4) / 4));
}

export function resolucionVentana(): number {
  return calcularResolucion(window.innerWidth, window.innerHeight, window.devicePixelRatio);
}
