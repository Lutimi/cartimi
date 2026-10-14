/** Ejecuta el arranque una sola vez y permite reintentar si falla. */
export function inicioUnico<T>(crear: () => Promise<T>): () => Promise<T> {
  let pendiente: Promise<T> | null = null;
  return () => {
    pendiente ??= Promise.resolve().then(crear).catch(error => {
      pendiente = null;
      throw error;
    });
    return pendiente;
  };
}
