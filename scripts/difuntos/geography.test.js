import {it,expect} from 'vitest';
import fs from 'node:fs';
import {cleanParts,meters} from './tracks.js';
const d=JSON.parse(fs.readFileSync(new URL('./data.json',import.meta.url)));
it('keeps all six original trails and the unmeasured yellow continuation',()=>{
 expect(d.croquis.paths.map(p=>p.id).sort()).toEqual(['amarillo','azul','celeste','naranja','rojo','verde']);
 const p=d.croquis.paths.find(p=>p.id==='amarillo'),tail=p.originalCoordinatesParts[0].slice(10);
 expect(p.coordinatesParts[0].slice(-tail.length)).toEqual(tail);
 expect(meters(p.coordinatesParts[0][0],p.coordinatesParts[0][1])).toBeLessThan(35);
 expect(meters(p.coordinatesParts[0].at(-tail.length-1),tail[0])).toBeLessThan(100);
});
it('ships two regional GPS tracks and locates the user-identified arrival',()=>{
 expect(d.sharedTracks).toHaveLength(2);
 for(const t of d.sharedTracks){const clean=cleanParts(t.parts,d.terrain.bounds);expect(clean.outside).toBe(0);expect(clean.gaps).toBe(0);expect(clean.points).toBeGreaterThan(500);expect(t).not.toHaveProperty('athlete')}
 expect(d.guide.sectors.find(p=>p.number===5).coordinates).toEqual(d.sharedTracks[1].parts.at(-1).at(-1));
});
it('shows the original trail and place layers by default',()=>{
 const html=fs.readFileSync(new URL('./index.template.html',import.meta.url),'utf8');
 expect(html).toContain('id="trailsOn" checked');expect(html).toContain('id="placesOn" checked');expect(html).toContain('id="sharedOn" checked');
});
