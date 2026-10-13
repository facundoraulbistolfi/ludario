import {it,expect} from 'vitest';
import fs from 'node:fs';
import {meters} from './tracks.js';
import {lengthMeters,fitCorridor,projectOnPath,registerLocally} from './geography.js';
const d=JSON.parse(fs.readFileSync(new URL('./data.json',import.meta.url)));
it('preserves six croquis trails without publishing personal walking records',()=>{
 expect(d.croquis.paths.map(p=>p.id).sort()).toEqual(['amarillo','azul','celeste','naranja','rojo','verde']);
 expect(d).not.toHaveProperty('sharedTracks');expect(d).not.toHaveProperty('personalTracks');
 expect(JSON.stringify(d)).not.toMatch(/caminata del 11|athlete|heart_rate|start_time/i);
 expect(d.pathSources['gps-foot'].url).toBe('https://www.strava.com/');expect(JSON.stringify(d)).not.toMatch(/strava\.com\/activities|20553887856|20556370640/);
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
it('draws selected GPS corridors as trail/access geometry, never as activities',()=>{
 const yellow=d.croquis.paths.find(p=>p.id==='amarillo');
 expect(yellow.segments.some(s=>s.source==='gps-foot'&&s.confidence==='recorded')).toBe(true);
 expect(yellow.segments.some(s=>s.source==='croquis'&&s.confidence==='approximate')).toBe(true);
 const approach=d.guide.approaches.find(a=>a.sector===5);
 expect(approach.startId).toBe('parking-1');
 expect(approach.segments[0].source).toBe('gps-naranjas');
 for(const feature of [...d.guide.accessSegments,...d.croquis.paths.flatMap(p=>p.segments),...d.guide.approaches.flatMap(a=>a.segments)]){
  expect(d.pathSources[feature.source]).toBeTruthy();expect(feature.coordinates.length).toBeGreaterThan(1);
 }
 expect(d.guide.accessSegments.some(s=>s.source==='osm-383375668'&&s.confidence==='mapped')).toBe(true);
 expect(d.pathReview.gpsMeters).toBeGreaterThan(1800);expect(d.pathReview.gpsMeters).toBeLessThan(2100);
});
it('refuses to fit an unrelated or distant path merely because it is in OSM',()=>{
 const a=[[-57.86,-37.89],[-57.859,-37.89],[-57.858,-37.89]],far=a.map(p=>[p[0]+.01,p[1]]);
 expect(()=>fitCorridor(a,far)).toThrow(/does not cover/);
 const fitted=fitCorridor(a,a);expect(lengthMeters(fitted)).toBeCloseTo(lengthMeters(a),2);
 expect(projectOnPath(a[1],a).distance).toBeLessThan(.1);
});
it('limits anchor corrections locally without claiming to survey the complete drawing',()=>{
 const from=[-57.86,-37.89],to=[-57.861,-37.89],far=[-57.85,-37.9];
 const adjusted=registerLocally([from,far],[{from,to}]);
 expect(adjusted[0]).toEqual(to);expect(adjusted[1]).toEqual(far);
 for(const t of d.croquis.paths.filter(p=>p.id!=='amarillo'))expect(t.segments.every(s=>s.confidence==='approximate')).toBe(true);
});
