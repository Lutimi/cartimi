import { coche, mily, icono } from "./arte";
const DURACION = 15;
const imagen = async (svg: string): Promise<HTMLImageElement> => { const img=new Image();const url=URL.createObjectURL(new Blob([svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')],{type:'image/svg+xml'})); try { await new Promise<void>((ok,fail)=>{img.onload=()=>ok();img.onerror=()=>fail(new Error('No se pudo cargar la ilustración'));img.src=url;});return img;} finally {URL.revokeObjectURL(url);} };
export async function abrirTrailer(contenedor: HTMLElement, cerrar: () => void): Promise<void> {
 contenedor.hidden=false;contenedor.innerHTML='<section class="trailer-card" role="dialog" aria-modal="true" aria-label="Mini tráiler de Mily"><canvas width="1280" height="720" aria-label="Tráiler animado de Mily, 15 segundos"></canvas><div class="trailer-toolbar"><span>MILY / EL PRIMER GOLPE · 15 SEGUNDOS</span><div><button class="button secondary" id="replay">↻ Repetir</button><button class="button primary" id="download-trailer">Descargar vídeo</button><button class="icon-button" id="close-trailer" aria-label="Cerrar tráiler">'+icono('cruz')+'</button></div></div><p class="trailer-status" role="status">Animación original · Sin sonido</p></section>';
 const canvas=contenedor.querySelector('canvas')!;const ctx=canvas.getContext('2d')!;
 const status=contenedor.querySelector<HTMLElement>('.trailer-status')!;let active=true;let raf=0;let recorder:MediaRecorder|null=null;let stream:MediaStream|null=null;let exporting=false;let inicio=performance.now();
 const limpiar=()=>{active=false;cancelAnimationFrame(raf);if(recorder?.state==='recording')recorder.stop();stream?.getTracks().forEach(t=>t.stop());};
 contenedor.addEventListener('cerrar-trailer',limpiar,{once:true});
 contenedor.querySelector('#close-trailer')!.addEventListener('click',cerrar);
 const replay=contenedor.querySelector<HTMLButtonElement>('#replay')!;const download=contenedor.querySelector<HTMLButtonElement>('#download-trailer')!;
 replay.onclick=()=>{if(!exporting)inicio=performance.now();};replay.focus();
 let portrait:HTMLImageElement,car:HTMLImageElement;
 try {[portrait,car]=await Promise.all([imagen(mily()),imagen(coche('#fa743e'))]);} catch {status.textContent='No se pudo preparar el tráiler. Cierra y vuelve a abrirlo.';return;}
 if(!active)return;
 const text=(str:string,x:number,y:number,size:number,color='#eee9dc',align:CanvasTextAlign='left')=>{ctx.fillStyle=color;ctx.textAlign=align;ctx.font='900 '+size+'px "Barlow Condensed", Impact, sans-serif';ctx.fillText(str,x,y);};
 const draw=(t:number)=>{
  const grad=ctx.createRadialGradient(860,300,20,640,350,800);grad.addColorStop(0,'#55405b');grad.addColorStop(1,'#141d19');ctx.fillStyle=grad;ctx.fillRect(0,0,1280,720);
  ctx.strokeStyle='#baa2cf12';ctx.lineWidth=1;for(let i=-700;i<1500;i+=60){ctx.beginPath();ctx.moveTo(i+t*9,0);ctx.lineTo(i+720+t*9,720);ctx.stroke();}
  ctx.fillStyle='#e9e6d7';ctx.textAlign='left';ctx.font='700 20px Arial';ctx.fillText('CLASH GARAGE / DEMOLITION CLUB',55,55);ctx.fillStyle='#f89162';ctx.textAlign='right';ctx.font='12px Arial';ctx.fillText('PRESENTAMOS A MILY',1225,55);
  ctx.save();
  if(t<4.5){
   const entry=Math.min(1,t/0.8);ctx.globalAlpha=entry;ctx.drawImage(portrait,715+(1-entry)*120,95,520,585);
   text('NO NECESITA',65,230,72);text('PEDIR PASO.',65,315,86,'#f58d5b');text('MILY',65,478,154,'#d1b3ef');
   ctx.fillStyle='#bab9af';ctx.font='22px Arial';ctx.fillText('La nueva piloto del club.',69,538);text('PUÑOS ARRIBA. MIEDO ABAJO.',69,586,23,'#c4b1d2');
  } else if(t<8){
   const p=(t-4.5)/3.5;ctx.drawImage(car,470+p*65,170,770,475);text('DESDE LA SALIDA.',65,195,72);text('100% CARGADA.',65,282,87,'#d3b2f2');ctx.fillStyle='#aaa69e';ctx.font='23px Arial';ctx.fillText('Tu primer golpe no espera.',69,354);
   ctx.fillStyle='#312738';ctx.fillRect(70,430,380,23);ctx.fillStyle='#c8a0ec';ctx.fillRect(70,430,380*Math.min(1,p*5+.5),23);text('MEGA PUÑETE · LISTO',70,500,29,'#d9bdf4');
  } else if(t<12){
   const p=t-8;const golpe=Math.max(0,1-Math.abs(p-1.1)*5);ctx.translate(golpe*8,-golpe*6);
   text('UN GOLPE.',65,190,83);text('MEDIA VIDA.',65,281,101,'#fa8a59');
   ctx.drawImage(car,60+Math.min(p,1.1)*115,330,480,295);ctx.save();ctx.translate(940+Math.max(0,p-1.1)*35,560);ctx.rotate(Math.PI);ctx.globalAlpha=.85;ctx.drawImage(car,-220,-145,440,280);ctx.restore();
   if(p>.7){ctx.fillStyle='#c8a3eb';ctx.beginPath();ctx.roundRect(570,440,180,88,25);ctx.fill();ctx.fillStyle='#e5cfff';for(let i=0;i<4;i++){ctx.beginPath();ctx.roundRect(660+i*21,419,19,62,8);ctx.fill();}ctx.fillStyle='#f6d496';for(let i=0;i<9;i++){const a=i*Math.PI*2/9;ctx.beginPath();ctx.moveTo(810+Math.cos(a)*70,480+Math.sin(a)*70);ctx.lineTo(810+Math.cos(a+.1)*125,480+Math.sin(a+.1)*125);ctx.lineTo(810+Math.cos(a+.2)*72,480+Math.sin(a+.2)*72);ctx.fill();}}
   ctx.fillStyle='#363e36';ctx.fillRect(840,335,320,18);ctx.fillStyle=p>1.1?'#f88b5c':'#b0cb87';ctx.fillRect(840,335,p>1.1?160:320,18);text(p>1.1?'−50% VIDA ACTUAL':'RIVAL',1000,313,28,'#ede9d8','center');
   ctx.fillStyle='#000';ctx.globalAlpha=golpe*.16;ctx.fillRect(0,0,1280,720);
  } else {
   ctx.drawImage(portrait,785,110,430,483);text('EL PRIMER GOLPE',65,235,74);text('LLEVA SU NOMBRE.',65,323,80,'#d4b4f1');text('MILY.',65,478,150,'#f8905d');ctx.fillStyle='#edb588';ctx.fillRect(70,540,350,58);text('JUEGA EN CLASH GARAGE',245,579,25,'#242521','center');
  }
  ctx.restore();ctx.fillStyle='#929d8d';ctx.textAlign='left';ctx.font='13px Arial';ctx.fillText('PULSA E · RIVAL CERCANO AL FRENTE · RECARGA EN 20 S',55,680);ctx.fillStyle='#403849';ctx.fillRect(0,712,1280,8);ctx.fillStyle='#c3a0e4';ctx.fillRect(0,712,1280*Math.min(t/DURACION,1),8);
 };
 const tick=()=>{if(!active)return;const t=Math.min(DURACION,(performance.now()-inicio)/1000);draw(t);if(t>=DURACION&&recorder?.state==='recording')recorder.stop();raf=requestAnimationFrame(tick);};
 inicio=performance.now();tick();
 download.onclick=()=>{
  if(exporting)return;
  if(!('MediaRecorder' in window)||!canvas.captureStream){status.textContent='Este navegador no permite exportar vídeo. Prueba en Chrome o Edge.';return;}
  const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm','video/mp4'].find(m=>MediaRecorder.isTypeSupported(m));
  if(!mime){status.textContent='No hay un formato de vídeo compatible en este navegador.';return;}
  try {
   stream=canvas.captureStream(30);recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:5000000});const chunks:Blob[]=[];
   recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
   recorder.onstop=()=>{stream?.getTracks().forEach(t=>t.stop());exporting=false;download.disabled=false;replay.disabled=false;if(!active)return;const blob=new Blob(chunks,{type:mime});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='Mily-El-primer-golpe.'+(mime.includes('mp4')?'mp4':'webm');a.click();window.setTimeout(()=>URL.revokeObjectURL(url),30000);status.textContent='Vídeo exportado. Mily está lista para compartir.';};
   recorder.onerror=()=>{stream?.getTracks().forEach(t=>t.stop());exporting=false;download.disabled=false;replay.disabled=false;status.textContent='La exportación falló. Puedes volver a intentarlo.';};
   exporting=true;download.disabled=true;replay.disabled=true;inicio=performance.now();recorder.start();status.textContent='Grabando los 15 segundos del tráiler… Mantén esta pestaña visible.';
  } catch {stream?.getTracks().forEach(t=>t.stop());status.textContent='No se pudo iniciar la grabación en este navegador.';}
 };
}
