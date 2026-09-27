// Animated GIF encoder that zooms from the minimum magnification into the selected view.
// Uses a palette derived from the active gradient and GIF LZW compression.
class Bytes {
  constructor(){this.data=new Uint8Array(1048576);this.length=0}
  byte(value){if(this.length===this.data.length){const next=new Uint8Array(this.data.length*2);next.set(this.data);this.data=next}this.data[this.length++]=value&255}
  word(value){this.byte(value);this.byte(value>>8)}
  text(value){for(let i=0;i<value.length;i++)this.byte(value.charCodeAt(i))}
  result(){return this.data.slice(0,this.length)}
}
function lzw(indices,output){
  const clear=256,end=257;
  let dictionary=new Map(),next=258,size=9,bits=0,bitCount=0,block=[];
  const flush=()=>{output.byte(block.length);for(const value of block)output.byte(value);block=[]};
  const byte=value=>{block.push(value);if(block.length===255)flush()};
  const code=value=>{bits|=value<<bitCount;bitCount+=size;while(bitCount>=8){byte(bits&255);bits>>>=8;bitCount-=8}};
  code(clear);
  let prefix=indices[0];
  for(let i=1;i<indices.length;i++){
    const symbol=indices[i],key=prefix*256+symbol,existing=dictionary.get(key);
    if(existing!==undefined){prefix=existing;continue}
    code(prefix);
    if(next<4096){dictionary.set(key,next++);if(next>(1<<size)&&size<12)size++}
    else{code(clear);dictionary=new Map();next=258;size=9}
    prefix=symbol;
  }
  code(prefix);code(end);
  if(bitCount)byte(bits&255);
  if(block.length)flush();output.byte(0);
}
function makePalette(colors,inside){
  const source=colors.map(hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)));
  const palette=new Uint8Array(768);
  for(let j=0;j<250;j++){
    const t=j/250*source.length,i=Math.floor(t),f=t-i,a=source[i],b=source[(i+1)%source.length];
    for(let c=0;c<3;c++)palette[j*3+c]=Math.round(a[c]+(b[c]-a[c])*f);
  }
  for(let c=0;c<3;c++)palette[250*3+c]=parseInt(inside.slice(1+c*2,3+c*2),16);
  return palette;
}
function makeLookup(palette){
  const lookup=new Uint8Array(32768);
  for(let key=0;key<32768;key++){
    const r=((key>>10)&31)*255/31,g=((key>>5)&31)*255/31,b=(key&31)*255/31;
    let best=0,distance=Infinity;
    for(let i=0;i<250;i++){
      const dr=r-palette[i*3],dg=g-palette[i*3+1],db=b-palette[i*3+2];
      const score=2*dr*dr+3*dg*dg+db*db;
      if(score<distance){distance=score;best=i}
    }
    lookup[key]=best;
  }
  return lookup;
}
function iterationsAt(frame,frames,target){
  const first=Math.min(180,target),progress=frame/(frames-1);
  return frame===frames-1?target:Math.round(first+(target-first)*progress**8);
}
self.onmessage=({data:task})=>{
  const {width,height,frames,fps,cx,cy,span,maxIter,colors,inside,frequency,phase}=task;
  if(width<1||height<1||frames<2||frames>240||width*height*frames>30000000||!Number.isInteger(maxIter)||maxIter<80||maxIter>50000)return self.postMessage({error:'La animación supera el límite de tamaño.'});
  let iterations=0;for(let frame=0;frame<frames;frame++)iterations+=iterationsAt(frame,frames,maxIter);
  if(width*height*maxIter>8000000000||width*height*iterations>50000000000)return self.postMessage({error:'Esta animación requiere demasiado cálculo. Reducí la definición o los cuadros.'});
  const palette=makePalette(colors,inside),lookup=makeLookup(palette),output=new Bytes();
  const gradient=colors.map(hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)));
  output.text('GIF89a');output.word(width);output.word(height);output.byte(0xf7);output.byte(250);output.byte(0);
  for(const value of palette)output.byte(value);
  output.byte(0x21);output.byte(0xff);output.byte(11);output.text('NETSCAPE2.0');output.byte(3);output.byte(1);output.word(0);output.byte(0);
  const startSpan=8,logScale=Math.log(span/startSpan),pixels=new Uint8Array(width*height);
  for(let frame=0;frame<frames;frame++){
    const t=frame/(frames-1),viewSpan=startSpan*Math.exp(logScale*t),viewCx=cx,viewCy=cy,frameIter=iterationsAt(frame,frames,maxIter);
    const step=viewSpan/width,x0=viewCx-viewSpan/2,y0=viewCy-height*step/2;
    for(let y=0;y<height;y++){
      const imag=y0+y*step;
      for(let x=0;x<width;x++){
        const real=x0+x*step,q=(real-.25)**2+imag*imag;
        let zr=0,zi=0,n=0;
        if(q*(q+real-.25)<=.25*imag*imag||(real+1)**2+imag*imag<=.0625)n=frameIter;
        else while(zr*zr+zi*zi<=256&&n<frameIter){const next=zr*zr-zi*zi+real;zi=2*zr*zi+imag;zr=next;n++}
        if(n===frameIter){pixels[y*width+x]=250;continue}
        const magnitude=Math.sqrt(zr*zr+zi*zi),smooth=n+1-Math.log2(Math.max(1,Math.log2(magnitude)));
        const colorT=((smooth*frequency/36+5*phase/100)%5+5)%5;
        const i=Math.floor(colorT),f=colorT-i,a=gradient[i],b=gradient[(i+1)%5];
        const red=Math.round(a[0]+(b[0]-a[0])*f),green=Math.round(a[1]+(b[1]-a[1])*f),blue=Math.round(a[2]+(b[2]-a[2])*f);
        pixels[y*width+x]=lookup[(red>>3)<<10|(green>>3)<<5|(blue>>3)];
      }
    }
    const delay=Math.max(2,Math.round((frame+1)*100/fps)-Math.round(frame*100/fps));
    output.byte(0x21);output.byte(0xf9);output.byte(4);output.byte(0);output.word(delay);output.byte(0);output.byte(0);
    output.byte(0x2c);output.word(0);output.word(0);output.word(width);output.word(height);output.byte(0);
    output.byte(8);lzw(pixels,output);
    self.postMessage({progress:frame+1,total:frames,iterations:frameIter});
  }
  output.byte(0x3b);
  const result=output.result();self.postMessage({done:true,buffer:result.buffer},[result.buffer]);
};
