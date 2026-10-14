/** Frases de los rivales y del jugador. `{nombre}` se reemplaza por el nombre de quien corresponda. */
export const FRASES = {
  /** Un rival le pega fuerte al jugador. */
  rivalGolpeaFuerte: ["¡Toma!", "¡Te tengo!", "¡Ni lo viste venir!", "¡Eso te va a doler!", "¡Fuera de mi camino!"],
  rivalGolpeaSuave: ["¡Permiso!", "¡Toc, toc!", "¡Uy, perdón!", "¡Cuidado, {nombre}!"],
  /** El jugador le pega a un rival. */
  rivalRecibeFuerte: ["¡AAAH!", "¡Me las vas a pagar, {nombre}!", "¡Mi carrito!", "¡Ahora sí me enojé!"],
  rivalRecibeSuave: ["¿Eso es todo?", "Ni cosquillas.", "¡Ja! ¿Y eso?", "Apenas un rasguño."],
  rivalEliminadoPorJugador: ["¡NOOOO!", "¡Esto no se queda así, {nombre}!", "¡Quiero la revancha!", "¡Mi pobre carrito!"],
  eliminadoPorOtros: ["{nombre} está fuera.", "{nombre} quedó hecho chatarra.", "Adiós, {nombre}.", "{nombre} no aguantó más."],
  jugadorEliminaA: ["¡Eliminaste a {nombre}!", "¡{nombre}, a la chatarra!", "¡Uno menos: {nombre}!"],
} as const;

/** Lo que dice el jugador cuando se rompe una parte de su carrito (en el original: "front left wheel is busted"). */
export const PARTES_ROTAS = {
  motor: "¡Se destrozó el motor!",
  carroceria: "¡La carrocería no aguanta más!",
  ruedas: [
    "¡Se rompió la rueda delantera izquierda!",
    "¡Se rompió la rueda delantera derecha!",
    "¡Se rompió la rueda trasera izquierda!",
    "¡Se rompió la rueda trasera derecha!",
  ],
} as const;

/** Avisos según la vida total del jugador (de mayor a menor). */
export const AVISOS_VIDA: readonly { menosDe: number; texto: string }[] = [
  { menosDe: 200, texto: "Estamos bastante golpeados…" },
  { menosDe: 150, texto: "¡Estamos en problemas!" },
  { menosDe: 120, texto: "¡Un golpe más y nos vamos!" },
];
