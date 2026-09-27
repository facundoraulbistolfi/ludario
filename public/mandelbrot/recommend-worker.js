// Sample the current complex-plane viewport, then rank locally varied areas.
// This is an exploration heuristic: it does not prove that a spiral exists.
self.onmessage=({data:view})=>{
  const {width,height,cx,cy,span}=view;
  if(!width||!height||!Number.isFinite(span)||span<=0)return;
  const cols=112,rows=Math.max(54,Math.min(260,Math.round(cols*height/width)));
  const maxIter=Math.min(700,Math.max(320,view.maxIter));
  const samples=new Uint16Array(cols*rows);
  const at=(x,y)=>samples[y*cols+x];
  for(let y=0;y<rows;y++){
    const imag=cy+((y+.5)/rows-.5)*span*height/width;
    for(let x=0;x<cols;x++){
      const real=cx+((x+.5)/cols-.5)*span;
      const q=(real-.25)**2+imag*imag;
      if(q*(q+real-.25)<=.25*imag*imag||(real+1)**2+imag*imag<=.0625){samples[y*cols+x]=maxIter;continue}
      let zr=0,zi=0,zr2=0,zi2=0,n=0;
      while(zr2+zi2<=256&&n<maxIter){zi=2*zr*zi+imag;zr=zr2-zi2+real;zr2=zr*zr;zi2=zi*zi;n++}
      samples[y*cols+x]=n;
    }
    if(y%32===0)self.postMessage({progress:Math.round(70*y/rows)});
  }
  const candidates=[];
  const offsets=[];
  for(const radius of [3,7,12])for(let k=0;k<12;k++){
    const angle=2*Math.PI*k/12;
    offsets.push([Math.round(radius*Math.cos(angle)),Math.round(radius*Math.sin(angle))]);
  }
  // Keep tappable suggestions clear of the header and compact bottom bar.
  const firstRow=Math.max(13,Math.ceil(rows*85/height));
  const lastRow=Math.min(rows-13,Math.floor(rows*(1-110/height)));
  for(let y=firstRow;y<lastRow;y+=2){
    for(let x=13;x<cols-13;x+=2){
      const center=at(x,y),values=offsets.map(([dx,dy])=>at(x+dx,y+dy));
      let escaped=0,inside=0,sum=0,squared=0,transitions=0;
      for(let i=0;i<values.length;i++){
        const value=values[i],scaled=Math.log1p(value)/Math.log1p(maxIter);
        escaped+=value<maxIter;inside+=value>=maxIter;
        sum+=scaled;squared+=scaled*scaled;
        if(i%12!==11&&(value>=maxIter)!==(values[i+1]>=maxIter))transitions++;
      }
      const variance=Math.max(0,squared/36-(sum/36)**2);
      const mix=Math.min(inside,escaped)/36;
      const centerDark=center>=maxIter*.85?1:.35;
      const score=(variance*13+mix*2.7+transitions*.055)*centerDark;
      if(score>.08)candidates.push({x,y,score});
    }
    if(y%40===13)self.postMessage({progress:70+Math.round(25*y/rows)});
  }
  candidates.sort((a,b)=>b.score-a.score);
  const selected=[];
  // First pass favors distinct features; second pass fills nearby detail if needed.
  for(const radius of [Math.min(cols,rows)*.24,Math.min(cols,rows)*.12]){
    for(const candidate of candidates){
      if(selected.length===3)break;
      if(selected.some(p=>(p.x-candidate.x)**2+(p.y-candidate.y)**2<radius**2))continue;
      selected.push(candidate);
    }
    if(selected.length===3)break;
  }
  self.postMessage({suggestions:selected.map(({x,y})=>{
    const u=(x+.5)/cols,v=(y+.5)/rows;
    return {x:u,y:v,cx:cx+(u-.5)*span,cy:cy+(v-.5)*span*height/width};
  })});
};
