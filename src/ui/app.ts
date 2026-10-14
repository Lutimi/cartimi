import { EVENTOS, MEJORAS, PINTURAS, CLAVE, leerPerfil, precioMejora, comprarMejora, comprarPintura, premiar, type Perfil, type Resultado } from "../meta/progreso";
import { icono, coche, pista, mily } from "./arte";
import { soltarControles, tactil, type Telemetria } from "../game/puente";
import { abrirTrailer } from "./trailer";
export interface Acciones { jugar: (evento: number, perfil: Perfil, personaje: string) => Promise<void>; pausa: (estado: boolean) => void; salir: () => void }
export class Interfaz {
 readonly perfil: Perfil;
 private tab = "jugar";
 private seleccionado = 0;
 private personaje = "mily";
 private enPartida = false;
 private iniciando = false;
 private pausado = false;
 private modal: HTMLElement;
 private menu: HTMLElement;
 private aviso: HTMLElement;
 private focoAnterior: HTMLElement | null = null;
 private guardado = true;
 constructor(private acciones: Acciones) {
  try { this.perfil = leerPerfil(localStorage.getItem(CLAVE)); } catch { this.perfil = leerPerfil(null); this.guardado = false; }
  this.seleccionado = this.perfil.desbloqueado;
  document.querySelector<HTMLDivElement>("#app")!.innerHTML = '<div id="menu"></div><div id="race-ui" hidden><button class="icon-button race-pause" id="pause" aria-label="Pausar partida">'+icono('pausa')+'</button><div class="race-meter"><span>NITRO <kbd>ESPACIO</kbd></span><div class="meter"><i id="nitro-fill"></i></div><b id="speed">0 <small>KM/H</small></b></div><button class="special-button" id="special-touch"><span>✦ MEGA PUÑETE</span><small id="special-label">LISTO · E</small><i id="special-fill"></i></button><div class="touch-controls"><button data-control="izquierda" aria-label="Girar izquierda">◀</button><button data-control="derecha" aria-label="Girar derecha">▶</button><button data-control="atras" aria-label="Reversa">▼</button><button data-control="adelante" aria-label="Acelerar">▲</button><button data-control="nitro" aria-label="Nitro">'+icono('rayo')+'</button><button data-control="freno" aria-label="Frenar">FRENO</button></div></div><div id="modal" hidden></div><div id="toast" role="status" aria-live="polite"></div>';
  this.menu = document.querySelector('#menu')!; this.modal = document.querySelector('#modal')!; this.aviso = document.querySelector('#toast')!;
  document.querySelector('#pause')!.addEventListener('click',()=>this.pausar());
  document.querySelector('#special-touch')!.addEventListener('pointerdown',()=>{ tactil.especial = true; });
  for(const b of document.querySelectorAll<HTMLButtonElement>('[data-control]')) {
   const key = b.dataset.control as keyof typeof tactil;
   b.addEventListener('pointerdown', e=>{ e.preventDefault(); b.setPointerCapture(e.pointerId); tactil[key]=true; });
   for(const event of ['pointerup','pointercancel','lostpointercapture']) b.addEventListener(event,()=>{tactil[key]=false;});
  }
  window.addEventListener('blur',()=>{soltarControles(); if(this.enPartida&&!this.pausado) this.pausar();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&this.enPartida&&!this.pausado)this.pausar();});
  document.addEventListener('keydown',e=>{
   if(e.code==='Escape') { if(this.enPartida) { if(this.pausado && this.modal.querySelector('#resume'))this.reanudar(); else if(!this.pausado)this.pausar(); } else this.cerrarModal(); }
   if(e.key==='Tab'&&!this.modal.hidden) { const items=Array.from(this.modal.querySelectorAll<HTMLElement>('button:not(:disabled),a[href]')); const first=items[0],last=items.at(-1); if(e.shiftKey&&document.activeElement===first){ e.preventDefault();last?.focus(); } else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();} }
  });
  this.render();
 }
 private guardar(): void { try {localStorage.setItem(CLAVE,JSON.stringify(this.perfil));} catch {this.guardado=false;this.toast('No se pudo guardar. El progreso durará esta sesión.');} }
 private toast(text: string): void { this.aviso.textContent=text; this.aviso.classList.add('show'); window.setTimeout(()=>this.aviso.classList.remove('show'),3200); }
 private saldo(): string { return icono('moneda',18)+'<span>'+this.perfil.monedas.toLocaleString('es')+'</span><small>CR</small>'; }
 private render(): void {
  const p=this.perfil;
  this.menu.innerHTML='<aside class="sidebar"><a href="#" class="brand" aria-label="Clash Garage inicio"><span class="brand-mark">C<span>▰</span></span><span class="brand-name">CLASH GARAGE<small>DEMOLITION CLUB</small></span></a><div class="nav-label">TU PRÓXIMO IMPACTO</div><nav>'+[['jugar','bandera','Jugar'],['garaje','garaje','Garaje'],['palmares','trofeo','Palmarés']].map(([id,ic,label])=>'<button data-tab="'+id+'" class="nav-item '+(this.tab===id?'active':'')+'">'+icono(ic!)+'<span>'+label+'</span>'+(id==='garaje'?'<small>03</small>':'')+'</button>').join('')+'</nav><div class="sidebar-bottom"><div class="season-tag"><span class="live-dot"></span> TEMPORADA 01</div><p>Un carrito.<br>Muchas malas intenciones.</p><button class="help-button" id="help">'+icono('ayuda',17)+' Cómo se juega</button><div class="profile"><div class="avatar">M</div><span>Piloto local<small>'+p.partidas+' partidas disputadas</small></span><span class="online-dot"></span></div></div></aside><main class="content"><header class="topbar"><div class="breadcrumb">EL CLUB <span>/</span> '+({jugar:'CENTRAL DE CARRERAS',garaje:'EL TALLER',palmares:'TU HISTORIA'}[this.tab])+'</div><div class="header-actions"><button class="icon-button" id="sound" aria-label="'+(p.sonido?'Silenciar sonido':'Activar sonido')+'">'+icono(p.sonido?'sonido':'silencio')+'</button><div class="wallet">'+this.saldo()+'</div></div></header><div class="page-content">'+(this.tab==='jugar'?this.inicio():this.tab==='garaje'?this.garaje():this.palmares())+'</div><footer><span><i class="live-dot"></i> '+(this.guardado?'Progreso guardado en este navegador':'Guardado disponible solo en esta sesión')+'</span><span>CLASH GARAGE / HECHO PARA CHOCAR</span></footer></main>';
  this.menu.querySelector('.brand')!.addEventListener('click',e=>{e.preventDefault();this.tab='jugar';this.render();});
  this.menu.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach(b=>b.onclick=()=>{this.tab=b.dataset.tab!;this.render();});
  this.menu.querySelector('#sound')!.addEventListener('click',()=>{p.sonido=!p.sonido;this.guardar();this.render();});
  this.menu.querySelector('#help')!.addEventListener('click',()=>this.ayuda());
  this.menu.querySelectorAll<HTMLButtonElement>('[data-event]').forEach(b=>b.onclick=()=>{this.seleccionado=Number(b.dataset.event);this.render();});
  this.menu.querySelector('#play')?.addEventListener('click',()=>this.jugar());
  this.menu.querySelector('#go-garage')?.addEventListener('click',()=>{this.tab='garaje';this.render();});
  this.menu.querySelectorAll<HTMLButtonElement>('[data-driver]').forEach(b=>b.onclick=()=>{this.personaje=b.dataset.driver!;this.render();});
  this.menu.querySelector('#trailer')?.addEventListener('click',()=>abrirTrailer(this.modal,()=>this.cerrarModal()));
  this.menu.querySelectorAll<HTMLButtonElement>('[data-upgrade]').forEach(b=>b.onclick=()=>{const item=MEJORAS.find(x=>x.id===b.dataset.upgrade);if(item&&comprarMejora(p,item.id)){this.guardar();this.render();this.toast(item.nombre+' instalado.');}});
  this.menu.querySelectorAll<HTMLButtonElement>('[data-paint]').forEach(b=>b.onclick=()=>{if(comprarPintura(p,b.dataset.paint!)){this.guardar();this.render();this.toast('Pintura equipada.');}});
 }
 private inicio(): string {
  const e=EVENTOS[this.seleccionado]!;const p=this.perfil;const color=PINTURAS.find(c=>c.id===p.pintura)!.color;
  return '<div class="section-heading"><div><div class="eyebrow">MENOS REGLAS. MÁS METAL.</div><h1>Bienvenido al caos<span>.</span></h1></div><span class="season-pill">'+icono('bandera',15)+' TEMPORADA 01</span></div><section class="hero"><div class="hero-copy"><div class="eyebrow orange"><span class="live-dot"></span> '+e.etiqueta+' / EVENTO 0'+(e.id+1)+'</div><h2>HECHO PARA<br>EL <em>IMPACTO.</em></h2><p>Arma tu carrito. Encuentra tu rival.<br>Deja que el metal hable por ti.</p><div class="hero-buttons"><button class="button primary" id="play">A LA ARENA '+icono('flecha')+'</button><button class="button secondary" id="go-garage">'+icono('garaje',18)+' Mi garaje</button></div><div class="hero-details"><span>'+icono('bandera',14)+' '+e.zona+'</span><span>'+e.rivales+' rivales</span><span>'+icono('moneda',14)+' Hasta '+(e.premio+e.rivales*35+100)+' CR*</span></div></div><div class="hero-visual"><span class="big-number">07</span><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div>'+coche(color)+'<div class="car-caption"><span><i></i> LISTO PARA EL IMPACTO</span><strong>SCRAPPER <b>07</b></strong><small>EDICIÓN PERSONALIZADA / '+(this.personaje==='mily'?'MILY':'LA DEPORTISTA')+'</small></div><span class="visual-coordinate">GARAGE / 01—06</span></div></section><div class="under-hero"><span>'+icono('check',14)+' Objetivo: '+(e.objetivo===1?'gana la final':'termina en el top '+e.objetivo)+' para avanzar</span><span>*Incluye bajas y primera clasificación. Reparación gratuita al salir.</span></div><div class="section-title"><h2>Elige tu próximo desafío <span>06 EVENTOS</span></h2><span>'+p.desbloqueado+' / 5 desbloqueados después del inicial</span></div><section class="event-grid">'+EVENTOS.map(ev=>{const locked=ev.id>p.desbloqueado;const best=p.mejores[ev.id];return '<button class="event-card '+(ev.id===this.seleccionado?'selected ':'')+(locked?'locked':'')+'" data-event="'+ev.id+'" '+(locked?'disabled':'')+' aria-pressed="'+(ev.id===this.seleccionado)+'"><div class="event-top"><span>0'+(ev.id+1)+'</span><span>'+(locked?icono('bloqueo',14):best!==null&&best!==undefined&&best<=ev.objetivo?icono('check',14):ev.id===this.seleccionado?'SELECCIONADO':ev.etiqueta)+'</span></div>'+pista(ev.id,ev.color)+'<div class="event-info"><h3>'+ev.zona+'</h3><p>'+ev.regla+'</p><div><span>'+icono('moneda',13)+' '+ev.premio+' CR · victoria</span><span>'+(locked?'BLOQUEADO':best?'MEJOR: '+best+'.º':'TOP '+ev.objetivo)+'</span></div></div></button>';}).join('')+'</section><section class="driver-banner"><div class="driver-art">'+mily()+'</div><div class="driver-copy"><div class="eyebrow orange">NUEVA PILOTO / PODER DESDE LA SALIDA</div><h2>Mily. Puños arriba.</h2><p>Su Mega Puñete quita el 50% de la vida actual de un rival al frente.<br>Empieza cargado. Pulsa <kbd>E</kbd> cerca de tu objetivo. Recarga: 20 s.</p><div class="driver-choices"><button class="driver-chip '+(this.personaje==='mily'?'chosen':'')+'" data-driver="mily">'+(this.personaje==='mily'?icono('check',14):'')+' Mily · Mega Puñete</button><button class="driver-chip '+(this.personaje==='deportista'?'chosen':'')+'" data-driver="deportista">La Deportista · +10% aceleración</button></div></div><button class="button secondary" id="trailer">▶ Ver mini tráiler</button></section>';
 }
 private garaje(): string {
  const p=this.perfil;const color=PINTURAS.find(c=>c.id===p.pintura)!.color;
  return '<div class="section-heading"><div><div class="eyebrow">UNA VUELTA DE TUERCA</div><h1>Tu carrito. Tus reglas<span>.</span></h1></div><span class="season-pill">'+icono('garaje',16)+' TALLER ABIERTO</span></div><section class="garage-preview"><div class="garage-car">'+coche(color)+'<span>SCRAPPER / 07</span></div><div class="build-stats"><div class="eyebrow orange">CONFIGURACIÓN ACTUAL</div><h2>Pequeño. Pero peligroso.</h2><p>Mejoras permanentes, pagadas con los créditos que ganas jugando. Cada partida empieza con el carrito reparado.</p>'+MEJORAS.map(m=>'<div class="stat-row"><span>'+m.nombre+'</span><div>'+[0,1,2].map(i=>'<i class="'+(i<p.mejoras[m.id]?'filled':'')+'"></i>').join('')+'</div><b>'+p.mejoras[m.id]+'/3</b></div>').join('')+'</div></section><div class="section-title"><h2>Potencia tu máquina <span>MEJORAS PERMANENTES</span></h2></div><section class="upgrade-grid">'+MEJORAS.map(m=>{const level=p.mejoras[m.id],cost=precioMejora(level);return '<article class="upgrade-card"><div class="upgrade-icon">'+icono(m.icono,30)+'</div><span class="part-level">NIVEL '+level+' / 3</span><h3>'+m.nombre+'</h3><p>'+m.descripcion+'</p><small class="effect">'+m.efecto+'</small><button class="button '+(level===3?'secondary':'primary')+'" data-upgrade="'+m.id+'" '+(level===3||p.monedas<cost?'disabled':'')+'>'+(level===3?icono('check',17)+' Nivel máximo':p.monedas<cost?'Faltan '+(cost-p.monedas)+' CR':'Mejorar '+icono('moneda',17)+' '+cost+' CR')+'</button></article>';}).join('')+'</section><div class="section-title"><h2>Deja tu marca <span>PINTURAS</span></h2><span>Estilo propio. Mismas estadísticas.</span></div><section class="paint-grid">'+PINTURAS.map(c=>'<button data-paint="'+c.id+'" class="paint-card '+(p.pintura===c.id?'equipped':'')+'" '+(!p.pinturas.includes(c.id)&&p.monedas<c.precio?'disabled':'')+'><span class="paint-swatch" style="--paint:'+c.color+'"></span><strong>'+c.nombre+'</strong><small>'+(p.pintura===c.id?'✓ EQUIPADA':p.pinturas.includes(c.id)?'EQUIPAR':c.precio+' CR')+'</small></button>').join('')+'</section>';
 }
 private palmares(): string {
  const p=this.perfil;return '<div class="section-heading"><div><div class="eyebrow">CADA GOLPE CUENTA</div><h1>Tu nombre en el metal<span>.</span></h1></div></div><div class="record-grid">'+[['Partidas',p.partidas],['Victorias',p.victorias],['Rivales eliminados',p.bajas],['Créditos disponibles',p.monedas]].map(([label,n])=>'<div class="record"><span>'+label+'</span><strong>'+n+'</strong></div>').join('')+'</div><section class="hall"><div class="trophy-art">'+icono('trofeo',90)+'</div><h2>'+(p.mejores[5]===1?'Rey de la chatarra.':'El trofeo te está esperando.')+'</h2><p>Supera los seis eventos y gana la gran final para conquistar el campeonato.</p></section><div class="results-table">'+EVENTOS.map(e=>'<div><span class="table-number">0'+(e.id+1)+'</span><strong>'+e.zona+'</strong><span>'+e.etiqueta+'</span><b>'+(p.mejores[e.id]?p.mejores[e.id]+'.º puesto':e.id>p.desbloqueado?'Bloqueado':'Por disputar')+'</b></div>').join('')+'</div>';
 }
 private async jugar(): Promise<void> {
  if (this.iniciando) return;
  this.iniciando = true;
  this.cerrarModal();
  this.enPartida = false;
  this.pausado = false;
  this.menu.hidden = true;
  const zona = document.querySelector<HTMLElement>('#juego')!;
  const hud = document.querySelector<HTMLElement>('#race-ui')!;
  zona.hidden = false;
  hud.hidden = true;
  document.querySelector<HTMLElement>('#special-touch')!.hidden = this.personaje !== 'mily';
  document.body.classList.add('racing');
  soltarControles();
  this.abrirModal('<div class="eyebrow orange">PREPARANDO EL IMPACTO</div><h2>Cargando arena…</h2><p>Encendiendo motores.</p>');
  try {
    await this.acciones.jugar(this.seleccionado, this.perfil, this.personaje);
    this.enPartida = true;
    hud.hidden = false;
    this.cerrarModal();
    if (document.hidden) this.pausar();
  } catch (error) {
    console.error('No se pudo iniciar Clash Garage:', error);
    this.acciones.salir();
    this.cerrarModal();
    zona.hidden = true;
    hud.hidden = true;
    this.menu.hidden = false;
    document.body.classList.remove('racing');
    this.abrirModal('<div class="eyebrow orange">NO SE PUDO ABRIR LA ARENA</div><h2>Volvamos a intentarlo.</h2><p id="start-error"></p><button class="button primary full" id="retry-start">Reintentar</button><button class="button secondary full" id="cancel-start">Volver al menú</button>');
    this.modal.querySelector('#start-error')!.textContent = error instanceof Error ? error.message : 'Ocurrió un error al iniciar la partida.';
    this.modal.querySelector('#retry-start')!.addEventListener('click', () => { void this.jugar(); });
    this.modal.querySelector('#cancel-start')!.addEventListener('click', () => this.cerrarModal());
  } finally { this.iniciando = false; }
 }
 actualizar(t: Telemetria): void {document.querySelector<HTMLElement>('#nitro-fill')!.style.width=t.nitro+'%';document.querySelector('#speed')!.innerHTML=Math.round(t.velocidad*6)+' <small>KM/H</small>';document.querySelector('#special-label')!.textContent=t.especial>=100?'LISTO · E':Math.ceil((100-t.especial)/5)+' s · RECARGANDO';document.querySelector<HTMLElement>('#special-fill')!.style.width=t.especial+'%';document.querySelector('#special-touch')!.classList.toggle('ready',t.especial>=100);}
 private abrirModal(html: string): void {this.focoAnterior=document.activeElement as HTMLElement;this.modal.innerHTML='<div class="modal-card" role="dialog" aria-modal="true" aria-label="Clash Garage"><div class="modal-inner">'+html+'</div></div>';this.modal.hidden=false;this.modal.querySelector<HTMLButtonElement>('button')?.focus();}
 private cerrarModal(): void {this.modal.dispatchEvent(new Event('cerrar-trailer'));this.modal.hidden=true;this.modal.innerHTML='';this.focoAnterior?.focus();}
 pausar(): void {if(!this.enPartida||this.pausado)return;this.pausado=true;soltarControles();this.acciones.pausa(true);this.abrirModal('<div class="eyebrow orange">RESPIRA. VUELVE A GOLPEAR.</div><h2>Tiempo fuera.</h2><p>La partida está pausada.</p><button class="button primary full" id="resume">Seguir jugando '+icono('flecha')+'</button><button class="button secondary full" id="exit">Volver al garaje</button><small>Salir no entrega créditos ni cambia tu progreso.</small>');this.modal.querySelector('#resume')!.addEventListener('click',()=>this.reanudar());this.modal.querySelector('#exit')!.addEventListener('click',()=>this.salir('garaje'));}
 private reanudar(): void {this.cerrarModal();this.pausado=false;soltarControles();this.acciones.pausa(false);}
 private salir(tab='jugar'): void {this.acciones.salir();this.enPartida=false;this.pausado=false;soltarControles();this.cerrarModal();document.querySelector<HTMLElement>('#juego')!.hidden=true;document.querySelector<HTMLElement>('#race-ui')!.hidden=true;document.body.classList.remove('racing');this.menu.hidden=false;this.tab=tab;this.render();}
 terminar(r: Resultado): void {
  if(!this.enPartida)return;this.pausado=true;this.acciones.pausa(true);const reward=premiar(this.perfil,r);this.guardar();
  const final=r.evento===5&&r.puesto===1;this.abrirModal('<div class="result-medal">'+icono(final?'trofeo':reward.clasificado?'bandera':'escudo',48)+'</div><div class="eyebrow orange">'+(final?'CAMPEONATO COMPLETADO':reward.clasificado?'OBJETIVO COMPLETADO':'CADA GOLPE ENSEÑA')+'</div><h2>'+(final?'¡Campeón del club!':r.puesto===1?'¡Victoria!':reward.clasificado?'¡Clasificaste!':'Vuelve más fuerte.')+'</h2><p>'+EVENTOS[r.evento]!.zona+' · '+r.puesto+'.º puesto · '+Math.floor(r.segundos)+' segundos</p><div class="reward">'+icono('moneda',27)+' +'+reward.monedas+' <small>CRÉDITOS</small></div><p>'+r.bajas+' eliminaciones'+(reward.primera?' · +100 CR por primera clasificación':'')+'</p><button class="button primary full" id="next">'+(reward.clasificado&&r.evento<5?'Siguiente evento':'Volver a intentarlo')+' '+icono('flecha')+'</button><button class="button secondary full" id="shop">Mejorar en el garaje</button><button class="text-button full" id="menu-result">Volver al menú</button>');
  this.modal.querySelector('#next')!.addEventListener('click',()=>{if(reward.clasificado&&r.evento<5)this.seleccionado=r.evento+1;this.jugar();});this.modal.querySelector('#shop')!.addEventListener('click',()=>{if(reward.clasificado)this.seleccionado=this.perfil.desbloqueado;this.salir('garaje');});this.modal.querySelector('#menu-result')!.addEventListener('click',()=>{this.seleccionado=this.perfil.desbloqueado;this.salir();});
 }
 private ayuda(): void {this.abrirModal('<div class="eyebrow orange">MANUAL PARA EL CAOS</div><h2>El último en pie gana.</h2><div class="controls-list"><p><kbd>WASD</kbd> / <kbd>↑ ↓ ← →</kbd><span>Acelerar, reversa y girar</span></p><p><kbd>ESPACIO</kbd><span>Nitro · se recarga al soltar</span></p><p><kbd>SHIFT</kbd><span>Frenar para cerrar las curvas</span></p><p><kbd>E</kbd><span>Mily: Mega Puñete frontal · 20 s de recarga</span></p><p><kbd>ESC</kbd><span>Pausar la partida</span></p></div><p>Recoge las cruces verdes para reparar tu carrito. Golpea los costados, protege tu motor y evita los bordes cuando la arena se cierre.</p><p>Clasifica para desbloquear el siguiente evento. Ganas créditos incluso al perder; compra mejoras permanentes en el garaje.</p><button class="button primary full" id="close-help">Entendido. Vamos.</button>');this.modal.querySelector('#close-help')!.addEventListener('click',()=>this.cerrarModal());}
}
