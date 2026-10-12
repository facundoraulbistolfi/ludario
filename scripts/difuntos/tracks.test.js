import {describe,it,expect} from 'vitest';
import {cleanParts,meters,toGPX,parseGPX} from './tracks.js';
const bounds=[-57.884,-37.922,-57.818,-37.873],a=[-57.85,-37.89],b=[-57.8501,-37.89];
describe('Difuntos GPS tracks',()=>{
 it('keeps coordinates and separates segments without joining gaps',()=>{const r=cleanParts([[a,b],[[...a],[...b]]],bounds);expect(r.parts).toEqual([[a,b],[a,b]]);expect(r.points).toBe(4)});
 it('breaks tracks on out-of-bounds points, invalid points and >250m jumps',()=>{const c=[-57.86,-37.90],d=[-57.8601,-37.90];const r=cleanParts([[a,b,[0,0],a,b,[NaN,0],c,d,a,b]],bounds);expect(r.parts).toEqual([[a,b],[a,b],[c,d],[a,b]]);expect(r.outside).toBe(1);expect(r.gaps).toBe(2)});
 it('rejects missing regional data and oversized input',()=>{expect(()=>cleanParts([[[0,0],[1,1]]],bounds)).toThrow();expect(()=>cleanParts([Array(30001).fill(a)],bounds)).toThrow(/30.000/)});
 it('rejects executable XML and invalid input before DOM parsing',()=>{expect(()=>parseGPX('<!DOCTYPE gpx>',bounds)).toThrow(/XML/);expect(()=>parseGPX('a'.repeat(4000001),bounds)).toThrow(/grande/)});
 it('exports independent segments and escapes names without health data',()=>{const s=toGPX({name:'A & <B>',parts:[[a,b],[b,a]],heartrate:120});expect(s).toContain('A &amp; &lt;B&gt;');expect(s.match(/<trkseg>/g)).toHaveLength(2);expect(s).not.toContain('heartrate');expect(s).toContain('lat="-37.89" lon="-57.85"')});
 it('calculates plausible geodesic spacing',()=>expect(meters(a,b)).toBeCloseTo(8.775,1));
});
