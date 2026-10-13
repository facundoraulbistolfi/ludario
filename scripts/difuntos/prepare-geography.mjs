import fs from 'node:fs';
import {projectOnPath,subpath,lengthMeters,fitCorridor,registerLocally} from './geography.js';
const file=new URL('./data.json',import.meta.url),d=JSON.parse(fs.readFileSync(file)),input=JSON.parse(fs.readFileSync(new URL('./geographic-inputs.json',import.meta.url)));
const {foot,naranjas,osmEntrance,satelliteRoad}=input.corridors;
const controls=[{from:d.croquis.controls[0].coordinates,to:naranjas[0]},{from:d.croquis.controls[1].coordinates,to:naranjas.at(-1)}];
const feature=(coordinates,source,confidence='approximate',note='')=>({coordinates,source,confidence,note});
const join=(a,b)=>[...a,...b.slice(1)];
const p=d.croquis.paths.find(p=>p.id==='amarillo');
p.originalCoordinatesParts ||= p.coordinatesParts;
// Preserve the unsurveyed continuation rather than replacing it with unrelated OSM.
const tail=p.originalCoordinatesParts[0].slice(10);
p.segments=[feature(foot,'gps-foot','recorded','Correspondencia con Amarillo inferida por el pie de sierra.'),feature([foot.at(-1),tail[0]],'croquis','approximate','Enlace sin registro GPS.'),feature(tail,'croquis')];
p.coordinatesParts=[join(join(foot,[foot.at(-1),tail[0]]),tail)];
p.geographicNote='Pie de sierra ajustado con GPS; continuación aproximada del croquis. La correspondencia con el color es inferida.';
for(const trail of d.croquis.paths){
 if(trail.id!=='amarillo'){
  trail.originalCoordinatesParts ||= trail.coordinatesParts;
  trail.coordinatesParts=trail.originalCoordinatesParts.map(part=>registerLocally(part,controls));
  trail.segments=trail.coordinatesParts.map(part=>feature(part,'croquis-registration'));
  trail.geographicNote='Croquis con ajuste local de posición cerca de Totanka y Naranjas. El sendero completo no está medido; sigue siendo aproximado.';
 }
 trail.geographicNote ||= 'Croquis con ajuste local de posición cerca de Totanka y Naranjas. El sendero completo no está medido; sigue siendo aproximado.';
}
for(const landmark of d.croquis.landmarks){
 landmark.originalCoordinates ||= landmark.coordinates;
 if(['totanka','naranjas'].includes(landmark.id))landmark.coordinates=landmark.id==='totanka'?naranjas[0]:naranjas.at(-1);
 else if(!['bosque-rojas'].includes(landmark.id))landmark.coordinates=registerLocally([landmark.originalCoordinates],controls)[0];
}
const g=d.guide;
g.originalCoordinatesAccessParts ||= g.coordinatesAccessParts;
const original=g.originalCoordinatesAccessParts;
const parks=g.parking;
parks[0].coordinates=naranjas[0];parks[0].locationStatus='Public parking reference derived from GPS corridor on a 20 m grid';
const fromNorth=projectOnPath(parks[1].coordinates,naranjas);
parks[1].coordinates=fromNorth.coordinate;parks[1].locationStatus='Guide E symbol projected on matching GPS approach';
const mainGPS=subpath(naranjas,naranjas[0],fromNorth.coordinate);
const north=projectOnPath(parks[1].coordinates,original[0]);
const mainTail=[north.coordinate,...original[0].slice(north.index+1)];
const ingress=fitCorridor([osmEntrance[0],satelliteRoad[0]],osmEntrance,30);
g.accessSegments=[feature(ingress,'osm-383375668','mapped'),feature([ingress.at(-1),satelliteRoad[0]],'satellite-road'),feature(satelliteRoad,'satellite-road'),feature(mainGPS,'gps-naranjas','recorded'),feature([mainGPS.at(-1),mainTail[0]],'guide'),feature(mainTail,'guide')];
// Foot-of-sierra guide road gets the same measured corridor as the colored trail.
const south=projectOnPath(foot.at(-1),original[1]);
const southTail=[south.coordinate,...original[1].slice(south.index+1)];
g.accessSegments.push(feature(foot,'gps-foot','recorded'),feature([foot.at(-1),southTail[0]],'guide'),feature(southTail,'guide'));
for(const part of original.slice(3))g.accessSegments.push(feature(part,'guide'));
g.accessSegments.push(feature(subpath(naranjas,parks[1].coordinates,naranjas.at(-1)),'gps-naranjas','recorded'));
g.coordinatesAccessParts=g.accessSegments.map(s=>s.coordinates);
for(const a of g.approaches){
 a.segments=(a.parts||[]).map(part=>feature(part,'guide'));
 if([4,5].includes(a.sector)){
  // User explicitly identified this as parking → Paredes Naranjas.
  a.startId=parks[0].id;a.startName=parks[0].name;
  a.segments=[feature(naranjas,'gps-naranjas','recorded')];
  const sector=g.sectors.find(s=>s.number===a.sector);
  a.orientationParts=[[naranjas.at(-1),sector.coordinates]];
  if(a.sector===4)a.orientationParts=[[naranjas.at(-1),g.sectors.find(s=>s.number===5).coordinates],[g.sectors.find(s=>s.number===5).coordinates,sector.coordinates]];
  a.geographicNote='Acceso a Naranjas ajustado con GPS. La llegada medida y los símbolos de pared son referencias distintas.';
 }else if([6,7].includes(a.sector)){
  a.orientationParts=[[parks[0].coordinates,g.sectors.find(s=>s.number===6).coordinates]];
  if(a.sector===7)a.orientationParts.push([g.sectors.find(s=>s.number===6).coordinates,g.sectors.find(s=>s.number===7).coordinates]);
  a.geographicNote='Estacionamiento referenciado con GPS; subida final interpretada de la guía.';
 }else a.geographicNote='Plano oficial alineado con el satélite. Tramo final orientativo sin registro GPS.';
 a.parts=a.segments.map(s=>s.coordinates);
 for(const part of a.orientationParts)a.segments.push(feature(part,'orientation'));
 a.status='Mixed sources; orientation links and unmeasured guide/croquis segments remain approximate';
}
d.pathSources=input.sources;
d.croquis.status='Mixed croquis and selected GPS corridor; no complete field validation';
d.pathReview={gridMeters:20,date:'2026-10-13',gpsMeters:Math.round(lengthMeters(foot)+lengthMeters(naranjas)),method:'Selected GPS corridors + matching OSM entrance + manual visible satellite road + official georeferenced guide + bounded local croquis registration near two GPS anchors. No automatic snapping to distant OSM.',limits:'Official trail colors inferred for measured foot corridor. Local registration adjusts drawing position, not trail geometry. Other colored paths have no matching surveyed geometry; not terrain-validated.',unavailable:input.unavailable};
d.audit.status='Correcciones parciales con GPS, OSM y camino visible en satélite; resto aproximado.';
d.audit.method=d.pathReview.method;
d.routes.orientation[5]='Desde el estacionamiento principal de Totanka, seguí el acceso ajustado con GPS hacia Naranjas. También podés iniciar en el estacionamiento de Naranjas, sobre el mismo corredor. El punto medido es una referencia de llegada, no de cada vía.';
fs.writeFileSync(file,JSON.stringify(d)+'\n');
console.log('Geografía: '+d.pathReview.gpsMeters+' m de corredores GPS; croquis y finales sin medición conservados.');
