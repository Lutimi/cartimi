import { describe, expect, it } from "vitest";
import { nuevoPerfil, leerPerfil, comprarMejora, comprarPintura, premiar, equipamiento, EVENTOS, arenaEvento } from "../src/meta/progreso";
import { crearCarrito, vidaTotal, pasoFisico } from "../src/sim/carrito";
import { megaPunete } from "../src/sim/especial";
import { personaje } from "../src/data/personajes";
import { Derbi } from "../src/sim/derbi";
import { armarDerbiClasico } from "../src/sim/armar";
import { SIN_ENTRADA } from "../src/sim/tipos";
import { carrito, entrada, ABIERTO } from "./ayuda";

describe("economía y guardado", () => {
 it("compra una mejora y nunca permite saldo negativo", () => { const p=nuevoPerfil();expect(comprarMejora(p,'motor')).toBe(true);expect(p.monedas).toBe(180);expect(p.mejoras.motor).toBe(1);expect(comprarMejora(p,'motor')).toBe(false);expect(p.monedas).toBe(180); });
 it("limita las mejoras y equipar una pintura comprada es gratis", () => { const p=nuevoPerfil();p.monedas=5000;for(let i=0;i<3;i++)expect(comprarMejora(p,'agarre')).toBe(true);const saldo=p.monedas;expect(comprarMejora(p,'agarre')).toBe(false);expect(p.monedas).toBe(saldo);expect(comprarPintura(p,'lila')).toBe(true);expect(comprarPintura(p,'lila')).toBe(true);expect(p.monedas).toBe(saldo-240);expect(p.pintura).toBe('lila'); });
 it("no compra colores desconocidos ni sin saldo", () => {const p=nuevoPerfil();p.monedas=0;expect(comprarPintura(p,'lila')).toBe(false);expect(comprarPintura(p,'inventado')).toBe(false);expect(p.pintura).toBe('mandarina');});
 it("clasificar desbloquea el evento y el premio inicial se da una sola vez", () => {const p=nuevoPerfil();const r={evento:0,puesto:3,bajas:1,segundos:40};expect(premiar(p,r)).toEqual({monedas:252,clasificado:true,primera:true});expect(p.desbloqueado).toBe(1);expect(premiar(p,r).monedas).toBe(152);expect(p.partidas).toBe(2);});
 it("perder da monedas pero no desbloquea", () => {const p=nuevoPerfil();expect(premiar(p,{evento:0,puesto:4,bajas:0,segundos:20}).monedas).toBe(45);expect(p.desbloqueado).toBe(0);});
 it("rechaza resultados de eventos bloqueados", () => {const p=nuevoPerfil();expect(premiar(p,{evento:5,puesto:1,bajas:5,segundos:1}).monedas).toBe(0);expect(p.partidas).toBe(0);});
 it("recupera datos corruptos y valida límites", () => {expect(leerPerfil('{mal')).toEqual(nuevoPerfil());const p=leerPerfil(JSON.stringify({version:1,monedas:-200,desbloqueado:400,mejoras:{motor:99},pintura:'lila',pinturas:'lila',mejores:[-1,99]}));expect(p.monedas).toBe(0);expect(p.desbloqueado).toBe(5);expect(p.mejoras.motor).toBe(3);expect(p.pintura).toBe('mandarina');expect(p.mejores).toEqual(Array(6).fill(null));});
 it("conserva las compras después de serializar", () => {const p=nuevoPerfil();comprarMejora(p,'motor');comprarPintura(p,'menta');expect(leerPerfil(JSON.stringify(p))).toEqual(p);});
 it("las compras cambian las estadísticas reales sin mutar piezas compartidas", () => {const p=nuevoPerfil();const antes=crearCarrito({id:0,personaje:personaje('mily'),piezas:equipamiento(p),esJugador:true,pos:{x:0,y:0},rotacion:0});comprarMejora(p,'motor');const despues=crearCarrito({id:1,personaje:personaje('mily'),piezas:equipamiento(p),esJugador:true,pos:{x:0,y:0},rotacion:0});expect(despues.stats.velocidadMax).toBeGreaterThan(antes.stats.velocidadMax);expect(antes.stats.velocidadMax).toBe(22); expect(equipamiento(nuevoPerfil()).motor.mods).not.toEqual(equipamiento(p).motor.mods);});
});
describe("Mily: Mega Puñete", () => {
 it("reduce exactamente la mitad de vida y recalcula piezas dañadas", () => {const j=carrito({id:0,esJugador:true});const r=carrito({id:1,pos:{x:150,y:0}});const antes=vidaTotal(r);expect(megaPunete(j,[j,r])).toBe(r);expect(vidaTotal(r)).toBe(antes/2);expect(r.aceleracion).toBeLessThan(r.stats.aceleracion);expect(r.ultimoRival).toBe(j.id);});
 it("no golpea fuera del alcance, detrás ni a eliminados", () => {const j=carrito({id:0});const lejos=carrito({id:1,pos:{x:261,y:0}}),atras=carrito({id:2,pos:{x:-80,y:0}}),eliminado=carrito({id:3,pos:{x:80,y:0}});eliminado.eliminado=true;expect(megaPunete(j,[j,lejos,atras,eliminado])).toBeNull();expect(vidaTotal(lejos)).toBe(300);});
 it("elige solo al rival más cercano delante", () => {const j=carrito({id:0}),a=carrito({id:1,pos:{x:180,y:0}}),b=carrito({id:2,pos:{x:100,y:0}});expect(megaPunete(j,[a,b])).toBe(b);expect(vidaTotal(a)).toBe(300);});
 it("elimina y acredita la baja en el siguiente paso", () => {const d=new Derbi(armarDerbiClasico({semilla:2,nivel:1,jugador:'mily'}));const j=d.jugador!,r=d.carritos[1]!;j.pos={x:300,y:300};j.rotacion=0;r.pos={x:450,y:300};r.vidaMotor=20;megaPunete(j,[r]);const eventos=d.paso(SIN_ENTRADA);expect(r.eliminado).toBe(false);megaPunete(j,[r]);const eventos2=d.paso(SIN_ENTRADA);expect([...eventos,...eventos2]).toContainEqual({tipo:'eliminado',id:r.id,por:j.id});});
});
describe("conducción y eventos", () => {
 it("el nitro supera la velocidad normal y el freno reduce velocidad", () => {const a=carrito(),b=carrito();for(let i=0;i<100;i++){pasoFisico(a,entrada({adelante:true}),ABIERTO);pasoFisico(b,entrada({adelante:true,nitro:true}),ABIERTO);}expect(b.velocidad).toBeGreaterThan(a.velocidad);const antes=b.velocidad;pasoFisico(b,entrada({freno:true}),ABIERTO);expect(b.velocidad).toBeLessThan(antes*.9);});
 it.each(EVENTOS)("todos los eventos tienen salidas dentro de la arena ($nombre)", ev => {const a=arenaEvento(ev);for(const s of a.salidas){expect(s.x).toBeGreaterThan(0);expect(s.x).toBeLessThan(a.ancho);expect(s.y).toBeGreaterThan(0);expect(s.y).toBeLessThan(a.alto);}expect(ev.rivales+1).toBeLessThanOrEqual(a.salidas.length);});
});
