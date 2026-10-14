# Análisis técnico de *Cul-de-Sac Smash 2: Wheels of Fury*

Cómo funcionaba el original, sacado de su código decompilado (`referencia-original/wheels-of-fury/`). Sirve como **referencia de mecánicas y números**; el juego nuevo usa su propio código, arte y personajes.

- Flash 8 / ActionScript 2, escenario de **600×400** a **31 fotogramas por segundo**.
- **Todas las fórmulas de física son por fotograma** (1/31 s). Los tiempos de efectos están en segundos.
- Nombres internos: `top`/`cockpit` = motor, `body`/`chassis` = carrocería, `wheels`/`tire` = ruedas.

---

## 1. Piezas y estadísticas

Base (`config.xml`): aceleración **0.75**, velocidad máxima **20**, umbral de derrape **15**, factor de deslizamiento **3**.

| Modificador | Pequeña | Mediana | Grande |
|---|---|---|---|
| Aceleración por carrocería | +0.25 | 0 | −0.35 |
| Aceleración por motor | 0 | +0.5 | +1.0 |
| Velocidad máx. por carrocería | +2 | 0 | −2 |
| Velocidad máx. por motor | 0 | +2 | +4 |
| Umbral de derrape por ruedas | 0 | +2 | +4 |
| Deslizamiento por ruedas | 0 | −1.5 | −3 |
| Peso (solo carrocería) | 0.5 | 1 | 1.5 |
| Golpe recibido (solo carrocería) | 100% | 70% | 40% |

| Precio | Pequeña | Mediana | Grande |
|---|---|---|---|
| Motor (Secador / Licuadora / Cortacésped) | $0.35 | $1.00 | $3.25 |
| Carrocería (Tostadora / Barril / Radiador) | $0.40 | $1.75 | $4.00 |
| Ruedas (Little Bits / Medium / Fat Tracks) | $0.25 | $0.75 | $1.50 |

**Problema de diseño:** el motor y las ruedas grandes no tienen desventaja. Solo la carrocería tiene un costo real (más peso → más lento). Por eso comprar se reduce a "ahorrar para lo más caro".

## 2. Física (`Car.as`)

En cada fotograma:

1. **Acelerar:** con ↑ `velocidad += aceleración`, con ↓ `velocidad -= aceleración`, con tope ±velocidad máx. Siempre `velocidad *= 0.975`.
2. **Girar** (solo si la velocidad del motor es > 1): `rotación += dirección × (|velocidad| / velocidad máx) × 6°`. La dirección es digital (−1, 0, 1); en reversa el giro se invierte.
3. **Derrape:** si `|velocidad| > umbral` y estás girando → `inercia = velocidad total × deslizamiento`.
4. **Fricción:** `inercia *= 0.8` (a 0 si < 0.1) e `impacto *= 0.9` (a 0 si < 0.1).
5. **Mover:** `total = normalizar(motor + inercia, |motor|) + impacto`. La inercia solo **cambia la dirección**, no la rapidez.
6. **Paredes:** la arena tiene 4 rectángulos. Al tocar uno, el carrito vuelve a su posición anterior, la velocidad, la inercia y el motor quedan en 0, y el impacto rebota en el eje de la pared.
7. **Giro residual:** `velocidad angular *= 0.95` (a 0 si < 0.5).

La cámara sigue al jugador y hay un minimapa.

### Medidas (sacadas de los gráficos del `.swf`)

| | Pequeña | Mediana | Grande |
|---|---|---|---|
| Carrocería (largo × ancho) | 49 × 24 px | 55 × 31 px | 73 × 41 px |
| Rueda (largo × ancho) | 14 × 3 px | 13 × 6 px | 18 × 10 px |

- Las ruedas van **por fuera** de la carrocería, a ±0.23 del largo hacia adelante y hacia atrás.
- **Arenas** (área jugable): patio 1200×800, chatarrería 1480×1128, cancha y final 1804×1270. Cada una tiene 8 puntos de salida (clips "0".."7"); el jugador sale del "0". Todos salen mirando a la derecha.
- **Zonas de choque** (clip `cCollision`, compartido por los 3 tamaños): el frente cubre la mitad delantera y la trasera la otra mitad, sin hueco. Cada rueda ocupa ~36% del ancho y ~45% del largo en su esquina. Así que **un golpe casi siempre daña 2 o 3 zonas a la vez**.

## 3. Choques y daño (`Game.as` → `DeterminePositions`, `Car.as` → `handleDamage`)

- **Detección:** se comprueba si dos carritos se superponen **y** si se acercaron en este fotograma.
- **Atacante:** el carrito con más velocidad total es el atacante (A); el otro es la víctima (V).
- `relativa = |vA − vV|`
  - Daño a la víctima: `relativa × pesoA × golpeRecibidoV`
  - Daño al atacante: `relativa × pesoV / 2 × golpeRecibidoA`
  - El jugador recibe siempre **×0.9**.
- **Zonas:** cada carrito tiene zonas de colisión. El daño se aplica a cada zona que toca el otro carrito:
  - zona trasera (`cBack`) → **carrocería**
  - zona delantera (`cFront`) → **motor**
  - cada rueda (`cWheel0..3`) → esa rueda
- **Reacción:** los dos vuelven a su posición anterior, la velocidad queda en 0 y cada uno recibe como impacto `velocidad del otro × su golpeRecibido`. Además giran al azar en sentidos opuestos.
- **Vida:** carrocería **100**, motor **100** y 4 ruedas de **25**, en total 300. **Eliminado cuando la suma es < 100.**
- **Efecto del daño:**
  - Motor: `aceleración = base × (0.5 + vidaMotor / 200)`.
  - Ruedas: `umbral derrape = base − int((100 − vidaRuedas) / 10)` y `deslizamiento = base + int((100 − vidaRuedas) / 50)`.
- **Sprites de daño:** carrocería y motor tienen 5 estados (cambian por debajo de 90, 75, 50 y 30). Las ruedas tienen 3 estados (por debajo de 15 y de 5).
- **Frases:** con daño ≥ 10 se usan frases "fuertes"; con menos, "débiles". Cada una sale con un 50% de probabilidad.

## 4. Barra y ataques especiales (`SpecialsManager.as`, `SpecialBase.as`)

- La barra tiene **10 puntos**: +1 por cada choque (los dos carritos) y +1 cada **3 s**. No carga durante la espera.
- Se dispara con **Espacio**. Solo puede haber **un especial activo en toda la partida**; al terminar hay **5 s** de espera.
- `TakeDamage(x)` multiplica la vida actual de carrocería y motor por `x`. Las ruedas pierden el **doble** de porcentaje.
- "Empujón" = la víctima sale disparada a la velocidad máxima (×2 en los fuertes).

| Personaje | Especial | Efecto exacto |
|---|---|---|
| Ed | Mocos | Carritos en el área: aceleración 0.25 durante 16 s |
| Edd | Rayo repulsor | Necesita algún rival a ≤150 px. Al impactar: ×0.95 y empujón ×2 |
| Eddy | Bomba fétida | Aura de 10 s: **×0.99 por fotograma** a quien esté dentro (≈ −27% por segundo) |
| Jonny | Tablón | Al golpear: ×0.90 y empujón ×2 |
| Kevin | Burla | Un rival al azar a ≤200 px queda inmóvil 20 s |
| Rolf | Cabras | 5 cabras en abanico (70–90° entre sí). Al golpear: ×0.95 y empujón |
| May | Cambio de look | Un rival al azar a ≤250 px pasa a tener todas las piezas pequeñas durante 15 s |
| Marie | Beso | 10 s: Marie, May y Lee tienen un aura de 90 px; los chicos dentro reciben ×0.991 por fotograma |
| Lee | Berrinche | Terremoto de 15 s: ×0.96 una sola vez a quien esté a ≤130 px de la grieta |

Las áreas se comprueban con un **cuadrado** (no un círculo) del radio indicado.

## 5. IA (`AICar.as`)

Máquina de estados:

- **ATTACK:** elige un objetivo al azar (cualquiera menos él mismo y quien esté usando un especial). Se orienta hacia él con una zona muerta de ±10°.
  - Si el objetivo está en la mitad delantera (±90°) → acelera, salvo que el ángulo sea > 30° y la velocidad > 15.
  - Si está detrás → **reversa** (embiste con la parte trasera), salvo que el ángulo sea > 45° y la velocidad > 15.
- **RETREAT:** después de golpear, huye del último objetivo durante 20–39 fotogramas.
- **HEAD_FOR_CENTER:** después de tocar una pared, va hacia (300, 200) durante 10–29 fotogramas.
- **Especiales:** cada 2 s decide si usarlo.
  - Probabilidad base según el derbi: 0% / 33% / 66% / 100%.
  - Se multiplica por `(100 / n − 1) / 100`, donde `n` = carritos a ≤200 px contando a sí mismo. Necesita `n ≥ 2`.
- **Piezas de los rivales:** cada pieza = `min(azar(0..derbi−1), 2)`:
  - Derbi 1: todas pequeñas.
  - Derbi 2: 50% pequeñas / 50% medianas.
  - Derbi 3: un tercio de cada tamaño.
  - Final: 25% pequeñas / 25% medianas / 50% grandes.

Los rivales son 5 personajes al azar, sin repetir y distintos al del jugador.

## 6. Economía (`GameInfo.as`, `GarageDamageReportPanel.as`)

- **Partida nueva:** carrito "ZIPPY" (todas las piezas pequeñas) y **$0**.
- **Premios por puesto:**

  | Derbi | 1.º | 2.º | 3.º | 4.º | 5.º | 6.º |
  |---|---|---|---|---|---|---|
  | 1 (patio) | 1.00 | 0.75 | 0.50 | 0.25 | 0.13 | 0 |
  | 2 (chatarrería) | 2.50 | 1.25 | 0.63 | 0.32 | 0.17 | 0 |
  | 3 (cancha) | 5.00 | 2.50 | 1.25 | 0.36 | 0.32 | 0 |
  | Final (nieve) | 10.00 | 5.00 | 2.50 | 1.25 | 0.63 | 0 |

- **+$0.50** por cada carrito que eliminas tú.
- **Vender:** `Σ precio de la pieza × vida% × 0.5` (por ejemplo, a vida completa = 50%).
- **Reparar:** `Σ precio de la pieza × vida% perdida × 0.40`.
- Ganar un derbi desbloquea el siguiente. Ganar la final da un **trofeo** a ese personaje.
- Puedes tener varios carritos en el garaje.
- Se guarda en un `SharedObject` (el equivalente a localStorage) llamado `cds_smash2_profile_6`.

## 7. Trucos y atajos

- **ESC** abre el campo de trucos:
  - `JACKPOT`: +$19.53.
  - `WHEELIE`: desbloquea todos los derbis.
  - `ARMOR`: inmune a choques (no a especiales).
- **Ctrl** al empezar una partida nueva: +$100. **Shift** al cargar: reinicia el perfil. **S**: silencio.
- Controles: flechas o I/J/K/L, Espacio para el especial.

## 8. Errores encontrados (no copiarlos)

- **"Trabarse" con otro carrito carga la barra muy rápido:** cada fotograma en contacto cuenta como un choque nuevo.
- **Daño de ruedas del atacante:** usa el daño de la víctima en vez del suyo.
- **Bono de las cabras:** si un rival muere mientras está marcado por las cabras de Rolf, el bono de $0.50 se le da al jugador, aunque Rolf sea la IA.
- **Color equivocado:** `GameInfo.sColors.Makover` (le falta una "e") → el halo de May no cambia de color.
- **Reparar con el dinero justo:** la condición usa `<` en vez de `<=`, así que no deja.
- **Partidas atascadas:** no hay muerte súbita. Si dos rivales quedan dando vueltas fuera de pantalla, hay que reiniciar.
- **Áreas cuadradas:** los efectos usan áreas cuadradas, no circulares, así que en las esquinas alcanzan más lejos.
