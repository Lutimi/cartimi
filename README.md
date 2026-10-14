# Clash Garage — Demolition Club

Juego de demolición para navegador con garaje, campaña y progresión local.

## Ejecutar

En Windows, usa `npm.cmd` si PowerShell bloquea `npm.ps1`.

```sh
npm install
npm run dev       # http://127.0.0.1:5173
npm test          # simulación, economía, progreso y habilidades
npm run build     # TypeScript + producción en dist/
```

## Jugar

- **WASD / flechas:** acelerar, reversa y girar.
- **Espacio:** nitro con consumo y recarga automática al soltar.
- **Shift:** frenar y reducir la inercia.
- **E:** Mega Puñete de Mily. Empieza cargado, golpea a un rival delante a hasta 260 unidades y reduce el 50% de su vida actual. Recarga en 20 segundos; fallar por falta de objetivo no gasta la carga.
- **Esc / P / botón de pausa:** pausar. Cambiar de pestaña pausa automáticamente.
- Controles táctiles en dispositivos con pantalla táctil.

## Campaña y garaje

Seis eventos con dificultad progresiva, cuatro escenarios y dos variantes: Fundición roja (cierre acelerado) y Gran final. Clasifica en el puesto indicado para desbloquear el siguiente. La pista de hielo tiene menos agarre.

Empiezas con **400 créditos**. Las partidas dan premios por puesto, 35 créditos por baja y 100 por la primera clasificación de cada evento. Perder también da créditos; abandonar una partida no da premios. El carrito se repara gratis antes de cada partida y hay recogibles de reparación en la arena.

El garaje vende tres niveles de motor, blindaje y agarre, además de cinco pinturas. Las mejoras se aplican a la simulación; las pinturas son cosméticas. Compras y progreso se guardan en el navegador (clave `cartimi.carrera.v1`). No se usa dinero real.

Mily está seleccionada al inicio. También puedes elegir a La Deportista, que tiene +10% de aceleración.

## Mini tráiler de Mily

En el menú pulsa **Ver mini tráiler**, o abre **[public/mily-trailer.html](public/mily-trailer.html)**. Es una animación original de 15 segundos, sin sonido. **Descargar vídeo** graba y descarga WebM (o MP4 si el navegador lo admite). Mantén visible la pestaña mientras se exporta. La página HTML independiente funciona sin el servidor; las tipografías usan alternativas locales si no hay conexión.

Para regenerar la página después de modificar el tráiler, con Vite ejecutándose:

```sh
node tools/export-trailer.mjs
```

## Estructura

- `src/sim/`: física, daño, IA y Mega Puñete.
- `src/meta/`: campaña, compras, premios y validación del guardado.
- `src/game/`: arena, efectos, controles, sonido y HUD de Phaser.
- `src/ui/`: menú, garaje, ilustraciones y tráiler.
- `tests/`: pruebas deterministas y de regresión.

Los documentos en `docs/` incluyen ideas de diseño a futuro; no todas están implementadas. El material del juego de referencia en `referencia-original/` es solo para estudio y no se publica.
