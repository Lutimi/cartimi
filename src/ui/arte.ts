export function icono(nombre: string, size = 20): string {
 const paths: Record<string,string> = {
 bandera: '<path d="M5 21V4m0 0c5-5 9 5 15 0v10c-6 5-10-5-15 0"/>',
 garaje: '<path d="m3 10 9-7 9 7v11H3V10Zm3 11V11h12v10M6 15h12M6 18h12"/>',
 trofeo: '<path d="M8 3h8v6a4 4 0 0 1-8 0V3Zm0 2H4v3c0 3 3 4 5 4m7-7h4v3c0 3-3 4-5 4m-3 1v6m-4 2h8"/>',
 flecha: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
 moneda: '<circle cx="12" cy="12" r="9"/><path d="m14 7-5 6h5l-4 5"/>',
 bloqueo: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
 motor: '<path d="M3 9h3l3-4h7l3 4h2v10H5v-5H3V9Zm7-4V2m-3 0h6m-1 7-3 5h5l-3 4"/>',
 escudo: '<path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6l9-4Zm-4 10 3 3 5-6"/>',
 rueda: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="m6 6 3 3m6 6 3 3M6 18l3-3m6-6 3-3"/>',
 sonido: '<path d="M3 9h4l5-4v14l-5-4H3V9Zm12 0c2 2 2 4 0 6m3-9c4 4 4 8 0 12"/>',
 silencio: '<path d="M3 9h4l5-4v14l-5-4H3V9Zm13 0 5 6m0-6-5 6"/>',
 ayuda: '<circle cx="12" cy="12" r="9"/><path d="M9 8c0-3 6-3 6 0 0 2-3 2-3 5m0 3v1"/>',
 check: '<path d="m5 12 4 4L19 6"/>',
 pausa: '<path d="M8 5v14M16 5v14"/>',
 rayo: '<path d="m13 2-9 12h7l-1 8 10-13h-8l1-7Z"/>',
 cruz: '<path d="m6 6 12 12M6 18 18 6"/>',
 };
 return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(paths[nombre]??paths.bandera)+'</svg>';
}
export function coche(color: string): string {
 return '<svg class="car-art" viewBox="0 0 680 420" fill="none" role="img" aria-label="Tu carrito de competición personalizado">'+
 '<defs><linearGradient id="body" x1="230" y1="130" x2="430" y2="310" gradientUnits="userSpaceOnUse"><stop stop-color="'+color+'"/><stop offset="1" stop-color="'+color+'" stop-opacity=".72"/></linearGradient><linearGradient id="glass" x1="300" y1="140" x2="390" y2="230"><stop stop-color="#526a74"/><stop offset="1" stop-color="#18252b"/></linearGradient><filter id="blur"><feGaussianBlur stdDeviation="12"/></filter><pattern id="tire" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-22)"><rect width="10" height="10" fill="#161b1d"/><path d="M0 0v10" stroke="#30383a" stroke-width="3"/></pattern></defs>'+
 '<ellipse cx="351" cy="331" rx="207" ry="36" fill="#000" opacity=".45" filter="url(#blur)"/>'+
 '<g transform="translate(15,-2)"><path d="m139 251 284-100 135 78-275 116Z" fill="#13191c"/>'+
 '<g fill="url(#tire)" stroke="#101416" stroke-width="5"><path d="m192 223 28-17q15-7 25 7l18 34q6 20-9 29l-28 13q-16 8-25-8l-18-34q-5-14 9-24Z"/><path d="m408 145 28-12q16-7 27 9l19 30q8 19-9 28l-29 13q-16 4-25-12l-18-32q-5-15 7-24Z"/><path d="m297 294 29-15q17-6 27 10l18 35q5 17-9 27l-29 14q-16 5-25-12l-17-33q-7-17 6-26Z"/><path d="m506 215 25-12q17-6 27 10l18 33q6 19-9 28l-27 14q-17 5-26-12l-17-32q-7-17 9-29Z"/></g>'+
 '<g fill="#6d7779" stroke="#313a3d" stroke-width="6"><ellipse cx="338" cy="330" rx="13" ry="21" transform="rotate(-25 338 330)"/><ellipse cx="546" cy="253" rx="13" ry="21" transform="rotate(-25 546 253)"/></g>'+
 '<path d="m169 227 88 63 12 41-103-64Z" fill="#853a24"/><path d="m257 290 273-97-5 48-256 90Z" fill="'+color+'"/><path d="m169 227 262-94 99 60-273 97Z" fill="url(#body)" stroke="#ffdbc0" stroke-opacity=".45" stroke-width="2"/>'+
 '<path d="m167 257 101 61 267-95-2 21-265 98-101-64Z" fill="#323d41" stroke="#758082" stroke-width="2"/>'+
 '<path d="m294 193 78-28 61 40-85 31Z" fill="#252d30"/><path d="m264 199 6-60 77-29 74 49 12 46-85 31Z" fill="#202c30" stroke="#4e6166" stroke-width="3"/>'+
 '<path d="m279 143 64-23 58 38-64 23Z" fill="'+color+'"/><path d="m281 153 54 34 4 37-64-34Z" fill="url(#glass)"/><path d="m346 185 56-21 17 33-72 27Z" fill="#83bdc8" opacity=".55"/><path d="m352 188 44-16" stroke="#d3f4f3" stroke-width="3" opacity=".7"/>'+
 '<path d="m355 250 114-40 24 15-113 40Z" fill="#20292d"/><path d="m366 249 17-6m-2 13 17-6m-8-11 17-6m-2 13 17-6m-8-11 17-6m-2 13 17-6" stroke="#899498" stroke-width="4"/>'+
 '<path d="m183 223 54-19 38 24-55 21Z" fill="#fff0cf"/><text x="192" y="235" fill="#242c2b" font-size="27" font-weight="900" font-family="Arial" transform="rotate(-19 192 235)">07</text>'+
 '<path d="m185 266 20 13m14 9 20 12" stroke="#ffe1a0" stroke-width="9"/><path d="m477 247 23-8m9-4 12-4" stroke="#fa7055" stroke-width="6"/>'+
 '<path d="m164 211 72 45 6 17-78-45Z" fill="#10191c"/><path d="m163 210 25-8 77 44-29 10Z" fill="#475559"/>'+
 '<g fill="#bfc9c6"><circle cx="285" cy="302" r="3"/><circle cx="507" cy="223" r="3"/><circle cx="317" cy="289" r="3"/></g></g></svg>';
}
export function pista(id: number, color: string): string {
 const paths = ['M36 85 69 37 161 37 193 81 164 124 72 124Z','M42 112V47h54v30h52V42h51v76H42Z','M43 82c0-62 154-62 154 0s-154 62-154 0Z','M42 99 77 42l49 39 48-38 27 68-69 17-29-30-41 29Z','M43 43h158v82H43V43Zm48 0v45h64v37','M45 80 84 35h79l37 45-37 46H84L45 80Z'];
 return '<svg class="track-art" viewBox="0 0 240 160" aria-hidden="true"><defs><pattern id="grid'+id+'" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0v20" fill="none" stroke="'+color+'" stroke-opacity=".12"/></pattern></defs><rect width="240" height="160" fill="url(#grid'+id+')"/><path d="'+paths[id]+'" fill="none" stroke="'+color+'" stroke-opacity=".12" stroke-width="27" stroke-linejoin="round"/><path d="'+paths[id]+'" fill="none" stroke="'+color+'" stroke-width="2" stroke-linejoin="round"/><path d="M63 110h18" stroke="#f1eee4" stroke-width="7"/><circle cx="81" cy="111" r="4" fill="#fb7545"/></svg>';
}

export function mily(): string {
 return '<svg viewBox="0 0 320 360" class="mily-art" role="img" aria-label="Mily, piloto de cabello violeta y guantes de combate"><defs><linearGradient id="jacket" x2="1" y2="1"><stop stop-color="#ff9555"/><stop offset="1" stop-color="#b84e36"/></linearGradient></defs><circle cx="164" cy="156" r="119" fill="#b59aea" opacity=".12"/><path d="m60 323 18-96 57-32h54l62 38 19 90Z" fill="url(#jacket)" stroke="#202329" stroke-width="7"/><path d="m127 203 36 51 39-48-20-26h-40Z" fill="#dda783"/><path d="m139 225 22 31 23-32 13 98h-73Z" fill="#242e34"/><path d="M103 130c-18-82 130-94 123 4l-14 59-45 22-50-27Z" fill="#24252d"/><path d="M117 126c-2-57 96-56 94 3l-4 36c-2 34-26 53-45 46-29-10-43-33-44-85Z" fill="#efbc94"/><path d="M99 136c-16-39 2-74 38-83 51-17 88 11 91 49l-11 35-24-54c-20 32-47 30-74 33l-3 33Z" fill="#a887d9"/><path d="m105 105 27-32 54-4" stroke="#d2b8f2" stroke-width="9" stroke-linecap="round"/><path d="m132 139 16-3m32-1 15 6" stroke="#382831" stroke-width="5" stroke-linecap="round"/><path d="m149 177 28 2-13 11Z" fill="#fff1df"/><path d="m107 272-35 24-35-57 6-31 36-11 21 33Z" fill="#382d47" stroke="#201f2b" stroke-width="6"/><path d="m42 215 11-37 18-6 16 10 7 22-13 28Z" fill="#b499e3" stroke="#272432" stroke-width="6"/><path d="m221 267 24-38 40 27-10 58-47 4Z" fill="#382d47" stroke="#201f2b" stroke-width="6"/><path d="m241 240 7-36 20-9 26 26-5 39-27 10Z" fill="#b499e3" stroke="#272432" stroke-width="6"/><path d="m66 189 11 17m188 1 10 20" stroke="#e1d0ff" stroke-width="6"/><path d="m99 250 21-14m92 1 20 12" stroke="#ffe2b4" stroke-width="5"/><text x="140" y="294" font-size="30" font-weight="900" fill="#e4d1aa" font-family="Arial">M</text></svg>';
}
