// Coordinates only: never retain heart rate, timestamps or athlete information.
export const TRACK_LIMIT = 30000;
export const within = (p, b) => Array.isArray(p) && p.length >= 2 && p.every(Number.isFinite) && p[0] >= b[0] && p[0] <= b[2] && p[1] >= b[1] && p[1] <= b[3];
export function meters(a,b) {
  const r=Math.PI/180, dl=(b[0]-a[0])*r, dp=(b[1]-a[1])*r;
  const h=Math.sin(dp/2)**2+Math.cos(a[1]*r)*Math.cos(b[1]*r)*Math.sin(dl/2)**2;
  return 12742000*Math.asin(Math.min(1,Math.sqrt(h)));
}
export function cleanParts(parts,bounds) {
  let count=0, outside=0, gaps=0;const result=[];
  for(const input of parts){let part=[];const flush=()=>{if(part.length>1)result.push(part);part=[]};
    for(const p of input){if(++count>TRACK_LIMIT)throw Error('El archivo supera los 30.000 puntos. Exportá un recorrido más corto.');
      if(!within(p,[-180,-90,180,90])){flush();gaps++;continue;}
      if(!within(p,bounds)){flush();outside++;continue;}
      if(part.length&&meters(part.at(-1),p)>250){flush();gaps++;}
      if(!part.length||meters(part.at(-1),p)>1)part.push(p.slice(0,2));
    }flush();
  }
  if(!result.length)throw Error('No hay un tramo continuo dentro de la zona descargada de Difuntos.');
  return {parts:result,outside,gaps,points:result.reduce((n,p)=>n+p.length,0)};
}
export function parseGPX(text,bounds,Parser=globalThis.DOMParser) {
  if(text.length>4_000_000)throw Error('El GPX es demasiado grande (máximo 4 MB).');
  if(/<!DOCTYPE|<!ENTITY/i.test(text))throw Error('El GPX contiene una declaración XML no admitida.');
  const doc=new Parser().parseFromString(text,'application/xml');
  if(doc.getElementsByTagName('parsererror').length||doc.documentElement?.localName!=='gpx')throw Error('No es un archivo GPX válido.');
  const all=(node,tag)=>Array.from(node.getElementsByTagNameNS('*',tag));
  const point=p=>[p.hasAttribute('lon')?Number(p.getAttribute('lon')):NaN,p.hasAttribute('lat')?Number(p.getAttribute('lat')):NaN];
  const segments=all(doc,'trkseg').map(s=>all(s,'trkpt').map(point));
  if(!segments.length)segments.push(...all(doc,'rte').map(s=>all(s,'rtept').map(point)));
  const cleaned=cleanParts(segments,bounds);
  const track=all(doc,'trk')[0]||all(doc,'rte')[0];
  const name=track?Array.from(track.children).find(x=>x.localName==='name')?.textContent:'';
  return {...cleaned,name:(name||'Mi recorrido GPS').trim().slice(0,100)};
}
export function toGPX(track){
  const escape=s=>String(s).replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));
  return '<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="Ludario Difuntos" xmlns="http://www.topografix.com/GPX/1/1"><trk><name>'+escape(track.name)+'</name>'+track.parts.map(p=>'<trkseg>'+p.map(c=>'<trkpt lat="'+c[1]+'" lon="'+c[0]+'"/>').join('')+'</trkseg>').join('')+'</trk></gpx>';
}
