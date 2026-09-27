let canceled=false;
self.onmessage=(event)=>{
  const {width,height,cx,cy,span,maxIter,colors,inside,frequency,phase=0}=event.data;
  const palette=colors.map(hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)));
  const core=[1,3,5].map(i=>parseInt(inside.slice(i,i+2),16));
  const step=span/width, x0=cx-width*step/2, y0=cy-height*step/2;
  const tileHeight=Math.max(4,Math.min(24,Math.floor(131072/width)));
  for(let row=0;row<height;row+=tileHeight){
    if(canceled)return;
    const rows=Math.min(tileHeight,height-row), pixels=new Uint8ClampedArray(width*rows*4);
    for(let ry=0;ry<rows;ry++){
      const y=y0+(row+ry)*step;
      for(let x=0;x<width;x++){
        const a=x0+x*step, b=y;
        let zr=0,zi=0,n=0;
        // Points inside the main cardioid and period-two bulb cannot escape.
        const q=(a-.25)*(a-.25)+b*b;
        if(q*(q+(a-.25))<=.25*b*b || (a+1)*(a+1)+b*b<=.0625)n=maxIter;
        else while(zr*zr+zi*zi<=256 && n<maxIter){const t=zr*zr-zi*zi+a;zi=2*zr*zi+b;zr=t;n++}
        const k=(ry*width+x)*4;
        if(n===maxIter){pixels[k]=core[0];pixels[k+1]=core[1];pixels[k+2]=core[2]}
        else{
          const mag=Math.sqrt(zr*zr+zi*zi);
          const smooth=n+1-Math.log2(Math.max(1,Math.log2(mag)));
          const t=((smooth*frequency/36+palette.length*phase/100)%palette.length+palette.length)%palette.length;
          const i=Math.floor(t),f=t-i,p=palette[i],next=palette[(i+1)%palette.length];
          pixels[k]=p[0]+(next[0]-p[0])*f;
          pixels[k+1]=p[1]+(next[1]-p[1])*f;
          pixels[k+2]=p[2]+(next[2]-p[2])*f;
        }
        pixels[k+3]=255;
      }
    }
    self.postMessage({row,rows,width,buffer:pixels.buffer},[pixels.buffer]);
  }
  self.postMessage({done:true});
};
