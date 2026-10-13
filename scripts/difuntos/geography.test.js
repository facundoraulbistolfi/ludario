import {it,expect} from 'vitest';
import fs from 'node:fs';
import {meters} from './tracks.js';
const d=JSON.parse(fs.readFileSync(new URL('./data.json',import.meta.url)));
it('preserves six croquis trails without publishing personal walking records',()=>{
 expect(d.croquis.paths.map(p=>p.id).sort()).toEqual(['amarillo','azul','celeste','naranja','rojo','verde']);
 expect(d).not.toHaveProperty('sharedTracks');expect(d).not.toHaveProperty('personalTracks');
 expect(JSON.stringify(d)).not.toMatch(/strava|user GPS|caminata del 11/i);
});
it('provides sourced approaches and offline photos for every sector',()=>{
 expect(d.guide.approaches).toHaveLength(13);
 for(const s of d.guide.sectors){
  const a=d.guide.approaches.find(a=>a.sector===s.number);
  expect(d.guide.parking.some(p=>p.id===a.startId)).toBe(true);
  expect(d.routes.orientation[s.number].length).toBeGreaterThan(20);
  for(const part of [...a.parts,...a.orientationParts]){
   expect(part.length).toBeGreaterThan(1);
   const [west,south,east,north]=d.terrain.bounds;
   for(const [lon,lat] of part){expect(lon).toBeGreaterThanOrEqual(west);expect(lon).toBeLessThanOrEqual(east);expect(lat).toBeGreaterThanOrEqual(south);expect(lat).toBeLessThanOrEqual(north)}
  }
  expect(a.status).toMatch(/approximate/);
  const pages=d.routes.pagesBySector[s.number];expect(pages.length).toBeGreaterThan(0);
  for(const r of d.routes.sectors.find(p=>p.number===s.number).routes){expect(pages).toContain(r.page);expect(d.routes.topos[r.page]).toBeTruthy()}
 }
 expect(d.routes.sectors.reduce((sum,s)=>sum+s.routes.length,0)).toBe(336);
 expect(d.guide.approaches.find(a=>a.sector===8).parts).toEqual([]);
});
it('starts with guide accesses and removes walking controls',()=>{
 const html=fs.readFileSync(new URL('./index.template.html',import.meta.url),'utf8');
 expect(html).toContain('id="trailsOn" checked');expect(html).toContain('id="placesOn" checked');expect(html).toContain('id="accessOn" checked');
 expect(html).not.toMatch(/sharedOn|tracksOn|importTrack/);
});
it('locates sectors through the satellite transformation',()=>{
 const {homography:h,satelliteSize:[width,height]}=d.guide.registration;
 const [w,s,e,n]=d.terrain.bounds,merc=lat=>Math.log(Math.tan(Math.PI/4+lat*Math.PI/360));
 for(const p of d.guide.sectors){
  const [x,y]=p.pixel,den=h[2][0]*x+h[2][1]*y+h[2][2],u=(h[0][0]*x+h[0][1]*y+h[0][2])/den,v=(h[1][0]*x+h[1][1]*y+h[1][2])/den;
  const coord=[w+(e-w)*u/width,(2*Math.atan(Math.exp(merc(n)-(merc(n)-merc(s))*v/height))-Math.PI/2)*180/Math.PI];
  expect(meters(coord,p.coordinates)).toBeLessThan(.01);expect(p.locationStatus).toMatch(/registration/);
 }
});
it('keeps OSM provenance independent of official trail colors',()=>{
 expect(d.mappedPaths).toHaveLength(2);
 for(const p of d.mappedPaths){expect(p.source).toMatch(/^https:\/\/www.openstreetmap.org\/way\/\d+$/);expect(p.retrieved).toBe('2026-10-13');expect(p.tags.highway).toBe('path')}
});
