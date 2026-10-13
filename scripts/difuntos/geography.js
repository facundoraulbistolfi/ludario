import {meters} from './tracks.js';

export const lengthMeters=coordinates=>coordinates.slice(1).reduce((n,p,i)=>n+meters(coordinates[i],p),0);
export function projectOnPath(point,path){
 let best=null,total=0;
 const k=111320*Math.cos(point[1]*Math.PI/180);
 for(let i=0;i<path.length-1;i++){
  const a=path[i],b=path[i+1],dx=(b[0]-a[0])*k,dy=(b[1]-a[1])*111320;
  const t=Math.max(0,Math.min(1,((point[0]-a[0])*k*dx+(point[1]-a[1])*111320*dy)/(dx*dx+dy*dy||1)));
  const coordinate=[a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])],distance=meters(point,coordinate),edge=meters(a,b);
  if(!best||distance<best.distance)best={coordinate,distance,index:i,t,along:total+t*edge};
  total+=edge;
 }
 if(!best)throw Error('A path needs at least two coordinates');
 return best;
}
export function subpath(path,start,end){
 const a=projectOnPath(start,path),b=projectOnPath(end,path);
 const low=a.along<=b.along?a:b,high=a.along<=b.along?b:a;
 const coordinates=[low.coordinate,...path.slice(low.index+1,high.index+1),high.coordinate];
 return a.along<=b.along?coordinates:coordinates.reverse();
}
// Only conflate an explicitly identified corridor, never the nearest unrelated path.
export function fitCorridor(coordinates,reference,maxDistance=100){
 const a=projectOnPath(coordinates[0],reference),b=projectOnPath(coordinates.at(-1),reference);
 if(Math.max(a.distance,b.distance)>maxDistance)throw Error('The reference does not cover this corridor');
 const candidate=subpath(reference,a.coordinate,b.coordinate);
 const originalLength=lengthMeters(coordinates),length=lengthMeters(candidate);
 if(length<originalLength*.5||length>originalLength*2)throw Error('The reference changes the corridor topology');
 return candidate;
}
// Local registration corrects a drawing's anchors; it does not survey its trails.
export function registerLocally(coordinates,controls,radius=500){
 return coordinates.map(p=>{
  const distances=controls.map(c=>meters(p,c.from)),exact=distances.findIndex(n=>n<1);
  if(exact>=0)return [...controls[exact].to];
  const weights=distances.map(n=>n<radius?Math.pow(1-n/radius,2)/Math.pow(n+1,2):0),sum=weights.reduce((a,b)=>a+b,0);
  if(!sum)return [...p];
  const fade=Math.pow(Math.max(0,1-Math.min(...distances)/radius),2);
  return [0,1].map(k=>p[k]+fade*controls.reduce((n,c,i)=>n+weights[i]*(c.to[k]-c.from[k]),0)/sum);
 });
}
