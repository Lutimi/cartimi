export class Sonido {
 private ctx: AudioContext | null = null;
 private ultimo = 0;
 habilitar(): void { try { this.ctx ??= new AudioContext(); void this.ctx.resume(); } catch { /* Sonido opcional. */ } }
 tocar(tipo: "golpe" | "nitro" | "premio" | "punete", activo: boolean): void {
  if (!activo || !this.ctx || this.ctx.state !== "running") return;
  const now=this.ctx.currentTime;if(tipo==='golpe'&&now-this.ultimo<.1)return;this.ultimo=now;
  const osc=this.ctx.createOscillator(),gain=this.ctx.createGain();osc.connect(gain);gain.connect(this.ctx.destination);
  const dur=tipo==='punete'?.4:tipo==='premio'?.2:.12;osc.type=tipo==='premio'?'sine':'triangle';
  osc.frequency.setValueAtTime(tipo==='punete'?170:tipo==='premio'?660:90,now);osc.frequency.exponentialRampToValueAtTime(tipo==='premio'?990:30,now+dur);
  gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(tipo==='punete'?.23:.09,now+.01);gain.gain.exponentialRampToValueAtTime(.0001,now+dur);osc.start(now);osc.stop(now+dur+.01);
 }
}
