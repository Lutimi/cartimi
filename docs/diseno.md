# Diseño del juego: *Clash Garage*

Derbi de demolición con carritos hechos de cachivaches, visto desde arriba, para el navegador. Se inspira en *Cul-de-Sac Smash 2* (ver `analisis-original.md`) con personajes propios, una estructura por **temporadas tipo roguelite** y una tienda donde **cada compra es una decisión**.

> Los números de este documento son **valores iniciales**: se ajustan con el simulador de equilibrio (sección 12).

## 1. Pilares

1. **Los choques se sienten como el original:** misma física simple, mismo daño por zonas.
2. **Cada compra es una decisión:** no hay piezas "mejores", solo piezas distintas, con espacio y dinero limitados.
3. **Cada temporada es distinta:** tienda, rivales y arenas cambian, así que se rejuega.
4. **El contenido son datos:** agregar piezas, personajes o arenas no requiere tocar código.

## 2. Una temporada

```
Elegir personaje → [Cartelera → Derbi → Taller] × 4 → Cartelera → FINAL
```

Una temporada dura unos **20–25 minutos**.

- **Cartelera (antes de cada derbi):** muestra la arena, el modificador del derbi y los 5 rivales con su estilo y sus piezas. Es la información para planear las compras.
- **Derbi:** 6 carritos y gana el último que queda en pie. El puesto se define por el orden de eliminación, como en el original.
- **Objetivo mínimo por derbi:**

  | Derbi | 1 | 2 | 3 | 4 | Final |
  |---|---|---|---|---|---|
  | Hay que quedar | Top 4 | Top 4 | Top 3 | Top 3 | 1.º |

- **Vidas:** empiezas con **3**. Si no cumples el objetivo pierdes una; con 0 termina la temporada. Si ganas la final, ganas la temporada.
- **El daño se mantiene entre derbis.** Si te destruyen, llegas al taller con el carrito al mínimo y tienes que repararlo hasta al menos **150 de vida** para volver a competir.

## 3. Dinero

Se usan números enteros ($).

- **Al empezar:** $4 y un carrito básico (motor, carrocería y ruedas comunes).
- **Premios por puesto:**

  | Derbi | 1.º | 2.º | 3.º | 4.º | 5.º | 6.º |
  |---|---|---|---|---|---|---|
  | 1 | 4 | 3 | 2 | 1 | 0 | 0 |
  | 2 | 5 | 4 | 3 | 2 | 1 | 0 |
  | 3 | 6 | 5 | 4 | 2 | 1 | 0 |
  | 4 | 7 | 6 | 5 | 3 | 1 | 0 |

- **+$1** por cada carrito que eliminas tú.
- **Interés:** al terminar cada derbi, +$1 por cada $5 ahorrados (máximo +$3). Así, ahorrar también es una estrategia.

## 4. El carrito

### Ranuras
- **Motor, Carrocería y Ruedas:** obligatorias, como en el original.
- **Accesorios:** de 0 a 2 según la carrocería.
- **Peso máximo:** cada carrocería tiene una capacidad y cada pieza pesa. La suma no puede pasarse, así que **no cabe todo lo mejor junto**.

### Estadísticas visibles
| Estadística | Qué hace | Base en el original |
|---|---|---|
| Velocidad | Velocidad máxima | 20 |
| Aceleración | Cuánto sube la velocidad por fotograma | 0.75 |
| Manejo | Velocidad a la que empiezas a derrapar y cuánto deslizas | 15 / 3 |
| Peso | Daño que causas y empuje; también te hace más lento | 0.5–1.5 |
| Blindaje por zona | Cuánto daño recibe el frente (motor), la trasera (carrocería) y las ruedas | Igual para todas las zonas: 100% / 70% / 40% según la carrocería |
| Carga | Rapidez con que se llena la barra del especial | 1 punto por choque y 1 cada 3 s |

La vida es como en el original (carrocería 100, motor 100, 4 ruedas de 25), con modificadores según la pieza.

### Familias de piezas
Cada pieza pertenece a una familia. Con **2 piezas** de la misma familia ganas un bonus pequeño; con **3**, uno grande.

| Familia | Bonus con 2 piezas | Bonus con 3 piezas |
|---|---|---|
| Cocina | +20% de carga del especial | El especial empieza cargado a la mitad |
| Jardín | +15% de peso | Los choques de frente empujan el doble |
| Taller | +15% de blindaje | Se repara 10 de vida al eliminar a alguien |

## 5. Piezas de la v1 (ejemplos)

Rarezas: **común** ($3–5) y **rara** ($6–9).

| Pieza | Tipo | Familia | Ventaja | Desventaja |
|---|---|---|---|---|
| Secador | Motor | Jardín | Ligero, buena aceleración | Velocidad máxima baja |
| Licuadora | Motor | Cocina | Equilibrado | — |
| Turbina (rara) | Motor | Taller | Velocidad máxima muy alta | Se recalienta: tras 3 s acelerando pierde 30% de aceleración hasta que sueltas |
| Batidora (rara) | Motor | Cocina | +50% de carga del especial | −2 de velocidad |
| Cortacésped | Motor | Jardín | Potente | Pesado |
| Tostadora | Carrocería | Cocina | Ligera y rápida | Poco blindaje, sin accesorios, capacidad baja |
| Barril | Carrocería | Jardín | Equilibrada, 1 accesorio | — |
| Radiador (rara) | Carrocería | Taller | Mucho blindaje y peso | Lenta |
| Carrito de súper (rara) | Carrocería | Taller | Frente muy blindado (×0.5), 2 accesorios | Trasera frágil (×1.5) |
| Nevera | Carrocería | Cocina | Mucha vida y capacidad | Muy lenta |
| Rueditas | Ruedas | Cocina | Ligeras | Derrapan pronto |
| Todoterreno | Ruedas | Jardín | Buen agarre en hielo y barro | Más lentas en piso normal |
| Orugas (rara) | Ruedas | Taller | Casi no derrapan, mucho blindaje | Pesadas, giran lento |
| Patines | Ruedas | Cocina | +aceleración; derrapar carga la barra | Deslizan mucho |
| Llantas de tractor | Ruedas | Jardín | Mucha vida | Pesadas |

**Accesorios de la v1:**
- Parachoques con clavos: +50% de daño con el frente.
- Blindaje trasero: −40% de daño atrás.
- Contrapeso: +peso.
- Bobina: +1 punto extra de carga por choque.

## 6. Taller (entre derbis)

1. **Tienda que rota:** 5 piezas al azar del catálogo desbloqueado.
   - **Renovar** la tienda cuesta $1, y $1 más cada vez que renuevas en el mismo taller.
2. **Reparación por zona:** puedes reparar solo el motor, solo la carrocería o rueda por rueda. Cuesta **40% del precio de la pieza × vida perdida**, la misma fórmula del original. ¿Reparas todo o entras dañado para comprar una pieza?
3. **Vender:** recibes el 50% del precio × la vida que le queda a la pieza.
4. **Bodega:** guardas hasta 2 piezas para cambiarlas antes del próximo derbi según la arena y los rivales.

## 7. Rivales y arenas

### Estilos de los rivales
| Estilo | Cómo arma el carrito | Cómo pelea |
|---|---|---|
| Tanque | Pesado y blindado | Busca choques de frente |
| Ágil | Ligero y rápido | Golpea lados y trasera, y huye |
| Especialista | Prioriza la carga del especial | Mantiene distancia y usa el especial seguido |
| Oportunista | Equilibrado | Ataca al más dañado o a quien está peleando con otro |

- Los rivales arman su carrito con un **presupuesto** que crece en cada derbi y en cada liga, según su estilo. Su carrito se ve en la cartelera.
- La IA parte de la del original (atacar, huir, ir al centro; ver `analisis-original.md` §5) y le suma la forma de pelear de su estilo.

### Arenas de la v1
| Arena | Tamaño | Rasgo | Favorece a |
|---|---|---|---|
| Patio trasero | Chica | Sin obstáculos | Pesados |
| Chatarrería | Mediana | Pilas de chatarra que dañan al chocarlas | Ágiles |
| Cancha | Grande | Abierta | Rápidos |
| Pista congelada | Mediana | Poco agarre | Buenas ruedas |

### Modificadores de derbi
Cada derbi puede traer uno, que se ve en la cartelera:
- Especiales cargan el doble.
- Doble premio, pero sin taller después.
- Paredes con resortes.
- Niebla: sin minimapa.

## 8. Personajes (6 en la v1)

Cada personaje tiene un **especial** y una **habilidad pasiva**. Varias pasivas tocan la economía, así que la elección cambia cómo compras. Los nombres y el diseño son tuyos; estos son los moldes:

| Molde | Especial (inspirado en) | Pasiva |
|---|---|---|
| El glotón | Pegamento: frena a los cercanos (mocos de Ed) | +20 de vida de carrocería |
| El inventor | Rayo: daña y empuja a los cercanos (repulsor de Edd) | Las piezas de Taller cuestan $1 menos |
| El estafador | Nube: daño continuo en área (bomba fétida de Eddy) | +1 de interés máximo |
| La deportista | Burla: inmoviliza a un rival (Kevin) | +10% de aceleración |
| El granjero | Estampida: 5 proyectiles en abanico (cabras de Rolf) | Reparar cuesta 25% menos |
| La rebelde | Terremoto: zona que daña (berrinche de Lee) | La tienda muestra 1 pieza más |

**Reglas de la barra (corrigen al original):**
- La carga por choque entre los mismos dos carritos tiene una espera de 0.5 s, para que no se pueda "trabar".
- Las áreas son circulares.
- Sigue habiendo un solo especial activo a la vez.

## 9. Lucha: qué se conserva y qué cambia

- **Se conserva:** la física y el daño del original (`analisis-original.md` §2–3), en un ciclo fijo de 1/31 s.
- **Se corrigen** los errores del §8 de ese documento.
- **Muerte súbita a los 90 s:** la arena se encoge para que ninguna partida se quede atascada.
- **Un derbi debe durar 1.5–3 minutos.**

## 10. Progreso entre temporadas

- **Desbloqueos por logros:** piezas nuevas que entran al catálogo, además de personajes y arenas. Las piezas desbloqueadas **no son más fuertes**; solo dan más opciones.
- **Trofeo** por cada personaje con el que ganas una temporada, como en el original.
- **Ligas:** niveles de dificultad que suman una regla cada uno (rivales con más presupuesto, menos interés, reparar más caro…).
- **Semilla:** cada temporada sale de una semilla de azar, así que se puede repetir exactamente y compartir.

## 11. Arquitectura

```
src/
  sim/      física, choques, daño, IA, especiales (TypeScript puro, sin Phaser)
  data/     piezas, familias, personajes, especiales, arenas, modificadores, ligas
  meta/     temporada, tienda, economía, desbloqueos, guardado
  game/     escenas de Phaser: dibujo, sonido, controles, menús
tools/
  balance/  simulador de temporadas sin pantalla
```

- **La simulación no depende de Phaser.** Usa un paso fijo y un azar con semilla, así que es **determinista**: con las mismas entradas da siempre el mismo resultado. Esto permite:
  - Tests de las fórmulas.
  - Simular temporadas sin pantalla.
  - Repeticiones y, más adelante, multijugador.
- **Estadísticas por modificadores:** valor final = (base + sumas) × multiplicadores. Lo usan piezas, familias, pasivas, especiales y estados temporales.
- **Especiales armados con bloques:**
  - Alcance: área, aura, proyectiles, objetivo al azar.
  - Efecto: daño en porcentaje, daño fijo, frenar, inmovilizar, empujar, transformar.
- **Eventos:** choque, daño, eliminación, compra, fin de derbi. Las frases, sonidos, logros y desbloqueos se conectan a ellos.
- **Datos validados al cargar**, para que un error en un archivo de datos se detecte enseguida.
- **Guardado con versión y migraciones**, para que las actualizaciones no rompan partidas.

Ejemplo de pieza como dato:

```ts
{
  id: "turbina",
  tipo: "motor",
  rareza: "rara",
  familia: "taller",
  precio: 7,
  peso: 3,
  mods: [
    { stat: "velocidadMax", suma: 5 },
    { stat: "aceleracion", suma: 0.25 },
  ],
  rasgos: [{ id: "sobrecalienta", segundos: 3, aceleracion: -0.3 }],
}
```

Ejemplo de especial como dato:

```ts
{
  id: "estampida",
  alcance: { tipo: "proyectiles", cantidad: 5, abanicoGrados: 80, velocidad: 12 },
  efectos: [
    { tipo: "danoPorcentaje", valor: 0.05 },
    { tipo: "empujon", fuerza: 1 },
  ],
}
```

## 12. Simulador de equilibrio

Juega temporadas completas sin pantalla, con un **comprador IA** para cada estilo. Metas:

- Ningún estilo gana más del **55%** contra los demás.
- Cada pieza aparece en entre el **10% y el 40%** de los carritos ganadores (ninguna nunca y ninguna siempre).
- Cada familia completa debe ser competitiva.
- Ahorrar debe rendir parecido a gastar: el interés no puede ser la única estrategia buena.

## 13. Plan

**v1 (unos 5–6 meses con 3–5 h/semana):**

| Fase | Semanas | Qué se hace |
|---|---|---|
| 1. Lógica del juego | 2–3 | Física, choques y daño del original en `sim/`, con tests |
| 2. Dibujo y controles | 1–2 | Phaser con arte provisional: 1 contra 1 jugable |
| 3. IA y derbi | 2 | Derbi de 6 carritos con muerte súbita |
| 4. Piezas como datos | 2 | Modificadores, peso máximo, familias |
| 5. Especiales | 2–3 | Sistema de bloques y 6 personajes |
| 6. Temporada | 3 | Cartelera, taller, tienda que rota, reparación por zona, vidas, interés |
| 7. Equilibrio | 2–3 | Simulador, comprador IA y ajuste de números |
| 8. Arte y sonido | 3 | Sprites SVG por capas y sonidos |
| 9. Cierre | 2–3 | Menús, guardado, desbloqueos y trofeos, publicación en itch.io |

**Después de la v1:**
- Piezas épicas, objetos de un solo uso (nitro, aceite, escudo) y retos de patrocinadores.
- Elegir entre 2 derbis posibles (rutas).
- Más personajes, arenas y ligas.
- Temporada del día con semilla compartida.
- Multijugador local; después, en línea.
