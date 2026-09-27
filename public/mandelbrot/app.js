(() => {
  const canvas=document.querySelector('#fractal'), ctx=canvas.getContext('2d',{alpha:false});
  const sheet=document.querySelector('#sheet'), body=document.querySelector('#sheetBody'), title=document.querySelector('#sheetTitle');
  const drawer=document.querySelector('#pointsDrawer'),drawerContent=document.querySelector('#drawerContent'),drawerBackdrop=document.querySelector('#drawerBackdrop');
  const presets=[
    {name:'Aurora',colors:['#07182d','#116c91','#65e6d9','#f7dc96','#ec7da3'],inside:'#060e1a'},
    {name:'Fuego',colors:['#170b25','#8c275c','#ef7345','#ffe29b','#fbf2d4'],inside:'#0d0817'},
    {name:'Océano',colors:['#07172c','#195c90','#55c5dc','#d4fbf3','#4b8dac'],inside:'#06111e'},
    {name:'Monocromo',colors:['#101520','#546173','#bdcbd6','#ffffff','#64707e'],inside:'#05080e'},
    {name:'Neón',colors:['#070d26','#4937a2','#ed3dd4','#6ff8e5','#efffc7'],inside:'#080519'},
    {name:'Cobre',colors:['#25121b','#754241','#ce7651','#f4c788','#fff0c4'],inside:'#140b11'},
    {name:'Hielo',colors:['#091b37','#2d70a5','#9cdef2','#f1fcff','#8fb8ee'],inside:'#051121'},
    {name:'Lima',colors:['#101e1c','#3a6f47','#a3dd66','#f1ff9b','#67c7a8'],inside:'#081412'},
    {name:'Crepúsculo',colors:['#18143e','#683b9a','#db6b9b','#f7ad77','#ffe7b1'],inside:'#0a0a1c'},
    {name:'Espectro',colors:['#141d5c','#2759df','#38dcb6','#ffce4c','#ef4867'],inside:'#080d24'}
  ];
  const state={cx:-.55,cy:0,span:3.25,maxIter:180,exportIter:1000,exportMode:'current',aspect:'screen',outputFormat:'png',gifSize:480,gifDuration:5,gifFps:10,gifIter:180,nudge:.1,zoomStep:2,frequency:1,phase:0,preset:0,colors:[...presets[0].colors],inside:presets[0].inside,size:4096};
  const landmarks=[
    {name:'Vista general',description:'El conjunto completo y sus lóbulos principales.',cx:-.55,cy:0,span:3.25,maxIter:180},
    {name:'Valle de caballitos',description:'Filamentos y espirales entre los dos lóbulos mayores.',cx:-.74519683,cy:.101869885,span:.02,maxIter:420},
    {name:'Valle de elefantes',description:'Pliegues en el borde derecho del cardioide.',cx:.27205033514905763,cy:.006118038612346085,span:.012,maxIter:450},
    {name:'Espiral triple',description:'Espirales en la región superior del conjunto.',cx:-.0875937321188787,cy:.6550902802386774,span:.012,maxIter:450},
    {name:'Cuerno del caballito',description:'Una zona de ramificaciones finas hacia el oeste.',cx:-1.25066,cy:.02012,span:.001,maxIter:500},
    {name:'Tronco del elefante',description:'Un acercamiento a los pliegues del valle.',cx:.2777323864244548,cy:.00734462674007808,span:.00006,maxIter:600}
  ];
  const storageKey='mandelbrot-points-v1';
  const validHex=value=>typeof value==='string'&&/^#[0-9a-fA-F]{6}$/.test(value);
  const cleanName=value=>String(value??'').trim().slice(0,60);
  function normalizePoint(value){
    if(!value||typeof value!=='object')return null;
    const cx=Number(value.cx),cy=Number(value.cy),span=Number(value.span),maxIter=Number(value.maxIter);
    if(!Number.isFinite(cx)||!Number.isFinite(cy)||Math.abs(cx)>1e6||Math.abs(cy)>1e6||!Number.isFinite(span)||span<1e-13||span>8||!Number.isInteger(maxIter)||maxIter<80||maxIter>1000)return null;
    const point={name:cleanName(value.name)||'Punto compartido',cx,cy,span,maxIter};
    if(typeof value.id==='string')point.id=value.id.slice(0,80);
    if(Array.isArray(value.colors)&&value.colors.length===5&&value.colors.every(validHex))point.colors=[...value.colors];
    if(validHex(value.inside))point.inside=value.inside;
    if(Number.isFinite(Number(value.frequency))&&Number(value.frequency)>=.2&&Number(value.frequency)<=3)point.frequency=Number(value.frequency);
    if(Number.isFinite(Number(value.phase))&&Number(value.phase)>=0&&Number(value.phase)<=100)point.phase=Number(value.phase);
    return point;
  }
  function readSavedPoints(){try{const list=JSON.parse(localStorage.getItem(storageKey)||'[]');return Array.isArray(list)?list.slice(0,100).map(normalizePoint).filter(Boolean):[]}catch{return []}}
  function readSharedPoint(){try{const params=new URLSearchParams(location.hash.slice(1));if(params.get('m')!=='1'||!params.has('x')||!params.has('y')||!params.has('s')||!params.has('i'))return null;return normalizePoint({name:params.get('n'),cx:params.get('x'),cy:params.get('y'),span:params.get('s'),maxIter:params.get('i'),colors:params.get('c')?.split(','),inside:params.get('b'),frequency:params.get('f'),phase:params.get('p')})}catch{return null}}
  let customPoints=readSavedPoints(),incomingPoint=readSharedPoint();
  let previewWorker=null,exportWorker=null,gifWorker=null,recommendWorker=null,resizeTimer=null,renderTimer=null,renderProgressTimer=null,activePanel=null,drawerOpen=false,exportCanvas=null,exportContext=null,exporting=false,gifExporting=false,targeting=false,suggesting=false,suggestions=[],fixedIter=0,lastCamera=null;
  const zoomSteps=[1.25,1.5,2,3,5,8],moveSteps=[2,5,10,20,35,50];
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const rect=()=>canvas.getBoundingClientRect();
  const formatZoom=()=>{const z=3.25/state.span;return z<10?z.toFixed(1)+'×':z<1000?Math.round(z)+'×':z.toExponential(1).replace('e+','e')+'×'};
  const currentIterations=()=>fixedIter||state.maxIter;
  const label=()=>{const count=currentIterations();document.querySelector('#zoomLabel').textContent=`${formatZoom()} · ${fixedIter?`${count/1000}k fijo`:`${count} iter.`}`};
  const hideHint=()=>document.querySelector('#hint').classList.add('hidden');
  const config=(width,height,maxIter=state.maxIter)=>({width,height,cx:state.cx,cy:state.cy,span:state.span,maxIter,colors:state.colors,inside:state.inside,frequency:state.frequency,phase:state.phase});
  function setRenderProgress(fraction){
    const ring=document.querySelector('#renderProgress'),percent=Math.round(clamp(fraction,0,1)*100);
    ring.classList.remove('hidden-el');ring.setAttribute('aria-valuenow',String(percent));
    document.querySelector('#renderProgressArc').style.strokeDashoffset=String(56.55*(1-percent/100));
  }
  function render(){
    const camera=`${state.cx}|${state.cy}|${state.span}`;
    if(lastCamera!==null&&camera!==lastCamera)fixedIter=0;
    lastCamera=camera;
    clearSuggestions();
    if(previewWorker)previewWorker.terminate();
    clearTimeout(renderProgressTimer);
    const bounds=rect();if(bounds.width<1||bounds.height<1){document.querySelector('#renderProgress').classList.add('hidden-el');return}
    setRenderProgress(0);
    const dpr=Math.min(devicePixelRatio||1,fixedIter>=30000?1:fixedIter?1.15:1.35), width=Math.round(bounds.width*dpr),height=Math.round(bounds.height*dpr);
    if(canvas.width!==width||canvas.height!==height){
      const previous=document.createElement('canvas');previous.width=canvas.width;previous.height=canvas.height;
      if(previous.width&&previous.height)previous.getContext('2d')?.drawImage(canvas,0,0);
      canvas.width=width;canvas.height=height;
      if(previous.width&&previous.height)ctx.drawImage(previous,0,0,width,height);
    }
    const worker=new Worker('./render-worker.js');previewWorker=worker;
    worker.onmessage=e=>{
      if(worker!==previewWorker)return;
      const tile=e.data;if(tile.done){worker.terminate();previewWorker=null;setRenderProgress(1);renderProgressTimer=setTimeout(()=>{if(!previewWorker)document.querySelector('#renderProgress').classList.add('hidden-el')},750);if(fixedIter)updateFixedUI('Detalle fijo listo. Podés mover la vista cuando quieras.');return}
      ctx.putImageData(new ImageData(new Uint8ClampedArray(tile.buffer),tile.width,tile.rows),0,tile.row);
      setRenderProgress((tile.row+tile.rows)/height);
      if(fixedIter)updateFixedUI(`Calculando detalle fijo… ${Math.round((tile.row+tile.rows)/height*100)}%`);
    };
    worker.onerror=()=>{if(worker===previewWorker){previewWorker=null;document.querySelector('#renderProgress').classList.add('hidden-el');if(fixedIter)updateFixedUI('No se pudo completar el detalle. Probá con menos iteraciones.')}worker.terminate()};
    worker.postMessage(config(width,height,currentIterations()));label();
    updateFixedUI(fixedIter?'Calculando detalle fijo… 0%':'');
  }
  const schedule=(delay=110)=>{clearTimeout(renderTimer);renderTimer=setTimeout(render,delay)};
  function zoomCenter(factor){state.span=clamp(state.span/factor,1e-13,8);hideHint();render()}
  function moveCenter(direction){const step=state.span*state.nudge;switch(direction){case 'up':state.cy-=step;break;case 'down':state.cy+=step;break;case 'left':state.cx-=step;break;case 'right':state.cx+=step}hideHint();render()}
  function stopTarget(){targeting=false;canvas.classList.remove('targeting');document.querySelector('#targetBanner').classList.add('hidden-el')}
  function pickCenter(x,y){const r=rect();state.cx+=(x-r.left-r.width/2)*state.span/r.width;state.cy+=(y-r.top-r.height/2)*state.span/r.width;stopTarget();hideHint();render()}
  function startTarget(){closeDrawer();closePanel();targeting=true;canvas.classList.add('targeting');document.querySelector('#targetBanner').classList.remove('hidden-el')}
  canvas.addEventListener('pointerdown',e=>{
    e.preventDefault();if(targeting&&e.isPrimary)pickCenter(e.clientX,e.clientY);
  });
  document.addEventListener('dblclick',e=>e.preventDefault(),{passive:false});
  document.querySelector('#zoomIn').onclick=()=>zoomCenter(state.zoomStep);
  document.querySelector('#zoomOut').onclick=()=>zoomCenter(1/state.zoomStep);
  document.querySelector('#reset').onclick=()=>{state.cx=-.55;state.cy=0;state.span=3.25;hideHint();render()};
  document.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>moveCenter(b.dataset.nav));
  document.querySelector('#navStep').onclick=e=>{const next=moveSteps[(moveSteps.indexOf(Math.round(state.nudge*100))+1)%moveSteps.length];state.nudge=next/100;e.currentTarget.textContent=next+'%';e.currentTarget.setAttribute('aria-label',`Paso de movimiento: ${next} por ciento. Tocar para cambiar`)};
  document.querySelector('#zoomStep').onclick=e=>{const next=zoomSteps[(zoomSteps.indexOf(state.zoomStep)+1)%zoomSteps.length];state.zoomStep=next;e.currentTarget.textContent=String(next).replace('.',',')+'×';e.currentTarget.setAttribute('aria-label',`Paso de zoom: ${next} aumentos. Tocar para cambiar`)};
  document.querySelector('#navigation').addEventListener('contextmenu',e=>e.preventDefault());
  document.querySelector('#openPoints').onclick=openDrawer;
  document.querySelector('#zoomLabel').onclick=()=>openPanel('appearance');
  document.querySelector('#drawerMark').onclick=startTarget;
  document.querySelector('#drawerGo').onclick=()=>openPanel('point');
  document.querySelector('#closeDrawer').onclick=closeDrawer;
  drawerBackdrop.onclick=closeDrawer;
  document.querySelector('#suggestCenters').onclick=startSuggestions;
  document.querySelector('#cancelSuggestions').onclick=clearSuggestions;
  document.querySelector('#hideControls').onclick=()=>{document.querySelector('#navigation').classList.add('hidden-el');document.querySelector('#showControls').classList.remove('hidden-el')};
  document.querySelector('#showControls').onclick=()=>{document.querySelector('#navigation').classList.remove('hidden-el');document.querySelector('#showControls').classList.add('hidden-el')};
  document.querySelector('#cancelTarget').onclick=stopTarget;
  function openDrawer(){
    closePanel();clearSuggestions();stopTarget();
    drawerOpen=true;drawerContent.append(body);drawPoints();
    drawer.classList.add('open');drawerBackdrop.classList.add('open');drawer.removeAttribute('inert');drawer.setAttribute('aria-hidden','false');
    document.querySelector('#openPoints').setAttribute('aria-expanded','true');document.querySelector('#closeDrawer').focus();
  }
  function closeDrawer(){
    if(!drawerOpen)return;
    if(drawer.contains(document.activeElement))document.querySelector('#openPoints').focus();
    drawerOpen=false;drawer.classList.remove('open');drawerBackdrop.classList.remove('open');drawer.setAttribute('aria-hidden','true');drawer.setAttribute('inert','');
    sheet.append(body);document.querySelector('#openPoints').setAttribute('aria-expanded','false');
  }
  function openPanel(name){
    closeDrawer();
    if(suggesting)clearSuggestions();
    activePanel=name;sheet.classList.add('open');sheet.setAttribute('aria-hidden','false');
    title.textContent={appearance:'Imagen y exportación',point:'Ir a punto'}[name];
    if(name==='appearance')drawAppearance();if(name==='point')drawGoToPoint();
  }
  function closePanel(){activePanel=null;sheet.classList.remove('open');sheet.setAttribute('aria-hidden','true')}
  document.querySelector('#close').onclick=closePanel;
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){stopTarget();closePanel();closeDrawer();clearSuggestions()}if(e.target.matches('input,select')||drawerOpen||activePanel)return;if(e.key==='+'||e.key==='=')document.querySelector('#zoomIn').click();if(e.key==='-')document.querySelector('#zoomOut').click();const arrows={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'};if(arrows[e.key]){e.preventDefault();moveCenter(arrows[e.key])}});
  function clearSuggestions(){
    if(recommendWorker){recommendWorker.terminate();recommendWorker=null}
    suggestions=[];document.querySelector('#suggestionMarkers').replaceChildren();
    suggesting=false;document.querySelector('.app').classList.remove('suggesting');
  }
  function selectSuggestion(index){
    const point=suggestions[index];if(!point)return;
    state.cx=point.cx;state.cy=point.cy;clearSuggestions();hideHint();render();
  }
  function startSuggestions(){
    clearSuggestions();
    stopTarget();closePanel();
    const bounds=rect(),status=document.querySelector('#suggestionStatus');
    if(bounds.width<1||bounds.height<1)return;
    suggesting=true;document.querySelector('.app').classList.add('suggesting');
    status.textContent='Buscando centros…';
    const worker=new Worker('./recommend-worker.js');recommendWorker=worker;
    worker.onmessage=({data})=>{
      if(worker!==recommendWorker||!suggesting)return;
      if(data.progress!==undefined){status.textContent=`Buscando centros… ${data.progress}%`;return}
      worker.terminate();recommendWorker=null;
      suggestions=data.suggestions||[];
      if(!suggestions.length){status.textContent='Sin centros aquí. Cancelá y probá otra zona.';return}
      status.textContent=`Tocá uno de los ${suggestions.length} puntos para centrar`;
      const markers=document.querySelector('#suggestionMarkers');
      suggestions.forEach((point,index)=>{
        const marker=document.createElement('button');marker.type='button';marker.className='suggestion-marker';marker.textContent=String(index+1);marker.style.left=(point.x*100)+'%';marker.style.top=(point.y*100)+'%';marker.setAttribute('aria-label',`Centrar en sugerencia ${index+1}`);marker.onclick=()=>selectSuggestion(index);markers.append(marker);
      });
    };
    worker.onerror=()=>{if(worker!==recommendWorker)return;worker.terminate();recommendWorker=null;status.textContent='No se pudo analizar. Cancelá y probá de nuevo.'};
    worker.postMessage({width:bounds.width,height:bounds.height,cx:state.cx,cy:state.cy,span:state.span,maxIter:state.maxIter});
  }
  function startFixed(iterations){
    if(!Number.isInteger(iterations)||iterations<=1000||iterations>50000){body.querySelector('#fixedError').textContent='Elegí un número entero entre 1.001 y 50.000.';return}
    body.querySelector('#fixedError').textContent='';body.querySelector('#fixedInput').value=iterations;
    fixedIter=iterations;render();
  }
  function updateFixedUI(message){
    if(activePanel!=='appearance')return;
    const status=body.querySelector('#fixedStatus');if(!status)return;
    status.textContent=message||(fixedIter?(previewWorker?'Calculando detalle fijo…':'Detalle fijo activo en este punto.'):'Elegí un valor para calcular más detalle en la posición actual.');
    body.querySelector('#restorePreview').classList.toggle('hidden-el',!fixedIter);
    body.querySelectorAll('[data-fixed]').forEach(button=>{const active=Number(button.dataset.fixed)===fixedIter;button.classList.toggle('selected',active);button.setAttribute('aria-pressed',String(active))});
    updateExportModeUI();
  }
  function drawAppearance(){
    const exportOpen=body.querySelector('#exportDetails')?.open||exporting;
    const fixedOpen=body.querySelector('#fixedDetails')?.open||Boolean(fixedIter);
    body.innerHTML=`<div class="setting"><div class="setting-line"><label for="iterations">Iteraciones en pantalla</label><output id="iterOutput">${state.maxIter} iteraciones</output></div><input type="range" id="iterations" min="80" max="1000" step="20" value="${state.maxIter}"><p>Hasta 1.000 iteraciones para moverte con fluidez.</p></div><details class="fixed-details" id="fixedDetails" ${fixedOpen?'open':''}><summary>Detalle fijo · hasta 50.000 iteraciones</summary><div class="fixed-content"><p class="helper">Calculá más iteraciones sin cambiar la cámara. Al mover o hacer zoom, vuelve a las iteraciones de navegación.</p><div class="fixed-grid">${[2000,5000,10000,30000,50000].map(n=>`<button type="button" data-fixed="${n}">${(n/1000).toLocaleString('es-AR')} mil</button>`).join('')}</div><div class="fixed-custom"><label for="fixedInput">O elegí un valor exacto<input class="number-field" type="number" id="fixedInput" min="1001" max="50000" step="1" value="${fixedIter||10000}" inputmode="numeric"></label><button type="button" class="action" id="applyFixed">Calcular</button></div><p id="fixedError" class="field-error" role="alert"></p><p id="fixedStatus" class="fixed-status" role="status" aria-live="polite"></p><button type="button" class="action hidden-el" id="restorePreview">Volver a navegación</button><p class="fixed-note">A 30.000 o 50.000 puede tardar bastante. Podés cancelar o mover la cámara en cualquier momento.</p></div></details><button type="button" class="action" id="toggleMarker" aria-pressed="${!document.querySelector('#centerMarker').classList.contains('hidden-el')}">${document.querySelector('#centerMarker').classList.contains('hidden-el')?'Mostrar':'Ocultar'} marca central</button><p class="section-label">Paletas</p><div class="presets">${presets.map((p,i)=>`<button type="button" class="preset ${state.preset===i?'selected':''}" data-index="${i}" aria-label="Paleta ${p.name}"><span class="bar" style="background:linear-gradient(90deg,${p.colors.join(',')})"></span><span>${p.name}</span></button>`).join('')}</div><p class="section-label">Colores personalizados</p><div class="color-row">${state.colors.map((color,i)=>`<label class="color-field">Tono ${i+1}<input type="color" data-color="${i}" value="${color}" aria-label="Tono ${i+1}"></label>`).join('')}<label class="color-field">Interior<input type="color" id="insideColor" value="${state.inside}" aria-label="Color del interior del conjunto"></label></div><div class="setting"><div class="setting-line"><label for="frequency">Repetición de colores</label><output id="freqOutput">${state.frequency.toFixed(1)}×</output></div><input type="range" id="frequency" min="0.2" max="3" step="0.1" value="${state.frequency}"></div><div class="setting"><div class="setting-line"><label for="phase">Desplazar la paleta</label><output id="phaseOutput">${state.phase}%</output></div><input type="range" id="phase" min="0" max="100" step="1" value="${state.phase}"></div><p class="helper">La paleta y el interior se aplican a PNG y GIF.</p><details class="export-details" id="exportDetails" ${exportOpen?'open':''}><summary>↓ Exportar PNG o GIF</summary><div id="exportSection"></div></details>`;
    body.querySelector('#iterations').oninput=e=>{state.maxIter=Number(e.target.value);body.querySelector('#iterOutput').textContent=state.maxIter+' iteraciones';label();updateExportModeUI();schedule(100)};
    body.querySelectorAll('[data-fixed]').forEach(button=>button.onclick=()=>startFixed(Number(button.dataset.fixed)));
    body.querySelector('#applyFixed').onclick=()=>startFixed(Number(body.querySelector('#fixedInput').value));
    body.querySelector('#restorePreview').onclick=()=>{fixedIter=0;render()};
    body.querySelector('#toggleMarker').onclick=e=>{const marker=document.querySelector('#centerMarker'),visible=marker.classList.toggle('hidden-el')===false;e.currentTarget.setAttribute('aria-pressed',String(visible));e.currentTarget.textContent=(visible?'Ocultar':'Mostrar')+' marca central'};
    body.querySelectorAll('.preset').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.index);state.preset=i;state.colors=[...presets[i].colors];state.inside=presets[i].inside;drawAppearance();schedule(0)});
    body.querySelectorAll('[data-color]').forEach(input=>input.oninput=()=>{state.colors[Number(input.dataset.color)]=input.value;state.preset=-1;body.querySelectorAll('.preset').forEach(b=>b.classList.remove('selected'));schedule(120)});
    body.querySelector('#insideColor').oninput=e=>{state.inside=e.target.value;state.preset=-1;body.querySelectorAll('.preset').forEach(b=>b.classList.remove('selected'));schedule(120)};
    body.querySelector('#frequency').oninput=e=>{state.frequency=Number(e.target.value);body.querySelector('#freqOutput').textContent=state.frequency.toFixed(1)+'×';schedule(120)};
    body.querySelector('#phase').oninput=e=>{state.phase=Number(e.target.value);body.querySelector('#phaseOutput').textContent=state.phase+'%';schedule(120)};
    drawExport();updateFixedUI();
  }
  function drawGoToPoint(){
    body.innerHTML=`<p class="helper">Cargá las coordenadas del punto que querés poner en el centro. Se conserva el zoom actual.</p><form id="pointForm"><div class="coordinate-grid"><label>Real (horizontal)<input id="centerReal" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" value="${state.cx.toPrecision(15)}"></label><label>Imaginaria (vertical)<input id="centerImaginary" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" value="${state.cy.toPrecision(15)}"></label></div><p id="centerError" class="field-error" role="alert"></p><button type="submit" class="action primary">Ir a este punto</button></form><p class="helper">Zoom actual: ${formatZoom()}</p>`;
    body.querySelector('#pointForm').onsubmit=e=>{e.preventDefault();const realInput=body.querySelector('#centerReal'),imagInput=body.querySelector('#centerImaginary');const real=Number(realInput.value.trim().replace(',','.')),imag=Number(imagInput.value.trim().replace(',','.'));if(!realInput.value.trim()||!imagInput.value.trim()||!Number.isFinite(real)||!Number.isFinite(imag)){body.querySelector('#centerError').textContent='Ingresá dos coordenadas válidas.';return}state.cx=real;state.cy=imag;closePanel();hideHint();render()};
  }
  function escapeHTML(value){return String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
  function viewPoint(point,renderNow=true){
    state.cx=point.cx;state.cy=point.cy;state.span=point.span;state.maxIter=point.maxIter;
    if(point.colors)state.colors=[...point.colors];if(point.inside)state.inside=point.inside;
    if(point.frequency!==undefined)state.frequency=point.frequency;if(point.phase!==undefined)state.phase=point.phase;
    if(point.colors)state.preset=-1;
    if(renderNow){hideHint();closeDrawer();closePanel();render()}
  }
  function currentPoint(name){return {name,cx:state.cx,cy:state.cy,span:state.span,maxIter:state.maxIter,colors:[...state.colors],inside:state.inside,frequency:state.frequency,phase:state.phase}}
  function saveCustomPoint(point){
    const candidate={...point,id:globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)};
    const updated=[candidate,...customPoints].slice(0,100);
    try{localStorage.setItem(storageKey,JSON.stringify(updated));customPoints=updated;return true}catch{return false}
  }
  function pointCard(point,kind,index){
    const coordinates=`${point.cx.toPrecision(9)} ${point.cy<0?'−':'+'} ${Math.abs(point.cy).toPrecision(9)}i`;
    const description=point.description?`<p>${escapeHTML(point.description)}</p>`:'';
    const save=kind==='incoming'?`<button type="button" data-point-action="save" data-kind="${kind}" data-index="${index}">Guardar</button>`:'';
    const remove=kind==='custom'?`<button type="button" class="danger" data-point-action="delete" data-kind="${kind}" data-index="${index}" aria-label="Eliminar ${escapeHTML(point.name)}">Eliminar</button>`:'';
    return `<article class="point-card"><h3>${escapeHTML(point.name)}</h3>${description}<p>${escapeHTML(coordinates)} · ${Math.round(3.25/point.span).toLocaleString('es-AR')}×</p><div class="point-buttons"><button type="button" data-point-action="go" data-kind="${kind}" data-index="${index}">Ir</button><button type="button" data-point-action="share" data-kind="${kind}" data-index="${index}">Compartir</button>${save}${remove}</div></article>`;
  }
  function pointStatus(message,error=false,url=''){
    const status=body.querySelector('#pointsStatus');if(!status)return;
    status.textContent=message;status.classList.toggle('error',error);
    const old=body.querySelector('#shareFallback');if(old)old.remove();
    if(url){const input=document.createElement('input');input.id='shareFallback';input.className='share-fallback';input.readOnly=true;input.value=url;input.setAttribute('aria-label','Enlace para copiar');status.after(input);input.select()}
  }
  function shareURL(point){
    const url=new URL(location.href);url.search='';
    const params=new URLSearchParams({m:'1',n:point.name,x:String(point.cx),y:String(point.cy),s:String(point.span),i:String(point.maxIter)});
    if(point.colors)params.set('c',point.colors.join(','));if(point.inside)params.set('b',point.inside);
    if(point.frequency!==undefined)params.set('f',String(point.frequency));if(point.phase!==undefined)params.set('p',String(point.phase));
    url.hash=params.toString();return url.toString();
  }
  async function sharePoint(point){
    const url=shareURL(point),text=`${point.name} · Mandelbrot\nRe: ${point.cx} · Im: ${point.cy} · Zoom: ${(3.25/point.span).toPrecision(5)}×`;
    if(navigator.share){try{await navigator.share({title:point.name,text,url});pointStatus('Punto compartido.');return}catch(error){if(error?.name==='AbortError')return}}
    try{await navigator.clipboard.writeText(`${text}\n${url}`);pointStatus('Enlace y coordenadas copiados.');return}catch{}
    pointStatus('Copiá este enlace para compartir el punto:',false,url);
  }
  function drawPoints(){
    body.innerHTML=`<div class="points-actions"><button type="button" class="action primary" id="saveCurrent">Guardar vista</button><button type="button" class="action" id="shareCurrent">Compartir vista</button></div><p class="point-status" id="pointsStatus" role="status" aria-live="polite"></p>${incomingPoint?`<p class="section-label">Punto recibido</p><div class="point-list">${pointCard(incomingPoint,'incoming',0)}</div>`:''}<p class="section-label">Mis puntos (${customPoints.length})</p>${customPoints.length?`<div class="point-list">${customPoints.map((point,i)=>pointCard(point,'custom',i)).join('')}</div>`:'<p class="point-note">Todavía no guardaste puntos. Se guardan en este dispositivo.</p>'}<p class="section-label">Lugares para explorar</p><div class="point-list">${landmarks.map((point,i)=>pointCard(point,'catalog',i)).join('')}</div><p class="point-note">Coordenadas basadas en la <a href="https://mandelbrot.neocities.org/gallery" target="_blank" rel="noopener noreferrer">galería de Mandelbrot</a>. El encuadre está adaptado a este explorador.</p><p class="point-note">El sitio es privado: para abrir un enlace compartido, la otra persona necesita acceso. El mensaje también incluye las coordenadas.</p>`;
    body.querySelector('#saveCurrent').onclick=drawSavePoint;
    body.querySelector('#shareCurrent').onclick=()=>sharePoint(currentPoint('Mi vista de Mandelbrot'));
    body.onclick=event=>{
      const button=event.target.closest('[data-point-action]');if(!button)return;
      const kind=button.dataset.kind,index=Number(button.dataset.index);
      const point=kind==='catalog'?landmarks[index]:kind==='custom'?customPoints[index]:kind==='incoming'?incomingPoint:null;
      if(!point)return;
      if(button.dataset.pointAction==='go')viewPoint(point);
      if(button.dataset.pointAction==='share')void sharePoint(point);
      if(button.dataset.pointAction==='save'){
        if(saveCustomPoint(point)){if(kind==='incoming'){incomingPoint=null;document.querySelector('#sharedBadge').classList.add('hidden-el')}drawPoints();pointStatus('Punto guardado en este dispositivo.')}else pointStatus('No se pudo guardar en este dispositivo.',true)
      }
      if(button.dataset.pointAction==='delete'&&window.confirm(`¿Eliminar “${point.name}” de Mis puntos?`)){
        const updated=customPoints.filter((_,i)=>i!==index);
        try{localStorage.setItem(storageKey,JSON.stringify(updated));customPoints=updated;drawPoints();pointStatus('Punto eliminado.')}catch{pointStatus('No se pudo eliminar el punto.',true)}
      }
    };
  }
  function drawSavePoint(){
    body.onclick=null;
    body.innerHTML=`<button type="button" class="action" id="backToPoints">← Volver al catálogo</button><p class="section-label">Agregar punto</p><p class="point-note">Los campos comienzan con la vista actual. Podés modificarlos antes de guardar.</p><form class="point-form" id="savePointForm"><label>Nombre del punto<input id="pointName" type="text" maxlength="60" required placeholder="Por ejemplo: Mi espiral" autocomplete="off"></label><div class="coordinate-grid"><label>Real<input id="savedReal" type="text" inputmode="decimal" value="${state.cx.toPrecision(15)}"></label><label>Imaginaria<input id="savedImaginary" type="text" inputmode="decimal" value="${state.cy.toPrecision(15)}"></label></div><label>Zoom (×)<input id="savedZoom" type="text" inputmode="decimal" value="${(3.25/state.span).toPrecision(15)}"></label><button type="submit" class="action primary">Guardar punto</button></form><p class="point-status" id="pointsStatus" role="status"></p>`;
    body.querySelector('#backToPoints').onclick=drawPoints;
    body.querySelector('#savePointForm').onsubmit=event=>{
      event.preventDefault();const name=cleanName(body.querySelector('#pointName').value);
      const fields=['#savedReal','#savedImaginary','#savedZoom'].map(selector=>body.querySelector(selector).value.trim().replace(',','.'));
      const [cx,cy,zoom]=fields.map(Number),span=3.25/zoom;
      if(!name){pointStatus('Escribí un nombre.',true);return}
      if(fields.some(value=>!value)||!Number.isFinite(cx)||!Number.isFinite(cy)||Math.abs(cx)>1e6||Math.abs(cy)>1e6||!Number.isFinite(zoom)||zoom<=0||!Number.isFinite(span)||span<1e-13||span>8){pointStatus('Revisá las coordenadas y el zoom.',true);return}
      if(saveCustomPoint({...currentPoint(name),cx,cy,span})){drawPoints();pointStatus('Punto guardado en este dispositivo.')}else pointStatus('No se pudo guardar en este dispositivo.',true)
    };
    body.querySelector('#pointName').focus();
  }
  const aspectRatios={screen:null,square:1,landscape43:4/3,portrait34:3/4,landscape169:16/9,portrait916:9/16};
  const aspectLabels={screen:'Pantalla',square:'1:1',landscape43:'4:3',portrait34:'3:4',landscape169:'16:9',portrait916:'9:16'};
  const gifSizes=[320,480,720],gifDurations=[3,5,8,12,20],gifFrameRates=[5,10,15,20];
  const gifIterationSteps=[80,180,350,600,1000,2000,5000,10000,20000,30000,50000];
  const gifMaxFrames=240,gifMaxPixels=30000000,gifMaxWork=50000000000,gifMaxFrameWork=8000000000;
  function exportDimensions(target,aspect=state.aspect){
    const r=rect(),ratio=aspectRatios[aspect]||r.width/r.height;
    let w=ratio>=1?target:Math.round(target*ratio),h=ratio>=1?Math.round(target/ratio):target;
    const maxPixels=16000000;if(w*h>maxPixels){const scale=Math.sqrt(maxPixels/(w*h));w=Math.floor(w*scale);h=Math.floor(h*scale)}
    return {w,h};
  }
  function maximumForExport(){
    const {w,h}=exportDimensions(state.size);
    const cores=Number(navigator.hardwareConcurrency)||4, memory=Number(navigator.deviceMemory)||4;
    const deviceFactor=clamp(cores/4,.75,1.25)*clamp(memory/4,.65,1.25);
    return Math.max(currentIterations(),Math.floor(clamp(5e10*deviceFactor/(w*h),1000,10000)/100)*100);
  }
  function selectedExportIterations(){return state.exportMode==='current'?currentIterations():state.exportMode==='maximum'?maximumForExport():state.exportIter}
  function gifIterationsAt(frame,frames,target){
    const first=Math.min(180,target),progress=frame/(frames-1);
    return frame===frames-1?target:Math.round(first+(target-first)*progress**8);
  }
  function gifLimitReason(option){
    if(option.frames>gifMaxFrames)return 'más de 240 cuadros';
    if(option.pixels>gifMaxPixels)return 'más de 30 millones de píxeles';
    if(option.frameWork>gifMaxFrameWork)return 'demasiado cálculo en el cuadro final';
    if(option.work>gifMaxWork)return 'demasiado cálculo en toda la animación';
    return '';
  }
  function gifCombination(size=state.gifSize,duration=state.gifDuration,fps=state.gifFps,aspect=state.aspect){
    const {w,h}=exportDimensions(size,aspect),frames=duration*fps,pixels=w*h*frames;
    let iterations=0;for(let frame=0;frame<frames;frame++)iterations+=gifIterationsAt(frame,frames,state.gifIter);
    const work=w*h*iterations,frameWork=w*h*state.gifIter;
    return {w,h,frames,pixels,work,frameWork,valid:frames<=gifMaxFrames&&pixels<=gifMaxPixels&&work<=gifMaxWork&&frameWork<=gifMaxFrameWork};
  }
  function ensureGifValid(){
    if(gifCombination().valid)return false;
    for(const size of [state.gifSize,...gifSizes.filter(n=>n<state.gifSize).reverse()]){
      for(const duration of [state.gifDuration,...gifDurations.filter(n=>n<state.gifDuration).reverse()]){
        for(const fps of [state.gifFps,...gifFrameRates.filter(n=>n<state.gifFps).reverse()]){
          if(gifCombination(size,duration,fps).valid){state.gifSize=size;state.gifDuration=duration;state.gifFps=fps;return true}
        }
      }
    }
    return false;
  }
  function updateExportModeUI(){
    if(activePanel!=='appearance')return;
    body.querySelectorAll('[data-export-mode]').forEach(b=>{const selected=b.dataset.exportMode===state.exportMode;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected))});
    body.querySelector('#manualIterations').classList.toggle('hidden-el',state.exportMode!=='manual');
    body.querySelector('#selectedIterations').textContent=selectedExportIterations().toLocaleString('es-AR')+' iteraciones';
    body.querySelector('#modeDescription').textContent=state.exportMode==='current'?'Usa exactamente las iteraciones actuales de la pantalla.':state.exportMode==='maximum'?'Calcula un límite práctico según la resolución y la capacidad informada por el dispositivo. Puede tardar varios minutos.':'Elegí el valor con el deslizador o escribilo.';
  }
  function drawExport(){
    const section=body.querySelector('#exportSection');if(!section)return;
    const gifAdjusted=state.outputFormat==='gif'&&ensureGifValid();
    const pngVisible=state.outputFormat==='png',gifVisible=!pngVisible;
    const png=`<div id="pngControls" class="${pngVisible?'':'hidden-el'}"><p class="helper">Guardá esta vista como PNG con el centro y la paleta elegidos.</p><p class="section-label">Resolución</p><div class="export-grid">${[2048,4096,6144].map(s=>`<button type="button" class="size ${state.size===s?'selected':''}" data-size="${s}" aria-pressed="${state.size===s}"><strong>${s/1024===2?'2K':s/1024===4?'4K':'6K'}</strong><span>${s===2048?'Rápida':s===4096?'Alta':'Máxima'}</span></button>`).join('')}</div><div class="dimensions" id="dimensions"></div><p class="section-label">Iteraciones del PNG</p><div class="mode-grid"><button type="button" class="mode" data-export-mode="current">Como pantalla</button><button type="button" class="mode" data-export-mode="manual">Manual</button><button type="button" class="mode" data-export-mode="maximum">Máxima</button></div><p class="mode-description" id="modeDescription"></p><div class="setting" id="manualIterations"><div class="setting-line"><label for="exportIterations">Valor manual</label><output id="exportIterOutput">${state.exportIter.toLocaleString('es-AR')}</output></div><div class="export-iter"><input type="range" id="exportIterations" min="100" max="10000" step="20" value="${state.exportIter}"><input type="number" class="number-field" id="exportIterNumber" aria-label="Iteraciones exactas del PNG" min="100" max="10000" step="1" value="${state.exportIter}"></div><p id="exportError" class="field-error" role="alert"></p></div><p class="dimensions">Máximo por píxel: <strong id="selectedIterations"></strong>.</p><p class="helper">Los puntos que escapan antes usan menos iteraciones. Subir el límite puede revelar detalle cerca del borde y tarda más.</p><button type="button" class="action primary" id="download">Generar PNG</button><div class="progress hidden-el" id="progress"><div id="progressFill"></div></div><p class="status" id="status" role="status" aria-live="polite"></p><button type="button" class="action hidden-el" id="cancelExport">Cancelar</button></div>`;
    const gif=`<div id="gifControls" class="${gifVisible?'':'hidden-el'}"><p class="helper">Empieza en el centro actual, con el zoom mínimo, y se acerca hasta el nivel de zoom actual. Usa la paleta elegida. Las iteraciones aumentan con el zoom hasta alcanzar el valor elegido en el último cuadro.</p><p class="section-label">Definición · lado más largo</p><div class="choice-grid">${gifSizes.map(n=>`<button type="button" data-gif-size="${n}" aria-pressed="${state.gifSize===n}" class="${state.gifSize===n?'selected':''}">${n}px</button>`).join('')}</div><p class="section-label">Duración</p><div class="choice-grid">${gifDurations.map(n=>`<button type="button" data-gif-duration="${n}" aria-pressed="${state.gifDuration===n}" class="${state.gifDuration===n?'selected':''}">${n} s</button>`).join('')}</div><p class="section-label">Fotogramas por segundo</p><div class="choice-grid">${gifFrameRates.map(n=>`<button type="button" data-gif-fps="${n}" aria-pressed="${state.gifFps===n}" class="${state.gifFps===n?'selected':''}">${n} FPS</button>`).join('')}</div><p class="section-label">Iteraciones del GIF</p><div class="setting"><div class="setting-line"><label for="gifIterations">Límite en el cuadro final</label><output id="gifIterOutput">${state.gifIter.toLocaleString('es-AR')}</output></div><input type="range" id="gifIterations" min="0" max="${gifIterationSteps.length-1}" step="1" value="${gifIterationSteps.indexOf(state.gifIter)}"><p id="gifIterHint">El primer cuadro usa hasta ${Math.min(180,state.gifIter).toLocaleString('es-AR')}; los siguientes suben gradualmente hasta ${state.gifIter.toLocaleString('es-AR')}.</p></div><p class="dimensions" id="gifSummary"></p><p class="dimensions" id="gifWork"></p><p class="helper">Cada cuadro recalcula la imagen. Para proteger el celular hay límites de 240 cuadros, 30 millones de píxeles en total y un máximo estimado de cálculos. Las opciones atenuadas los superan.</p>${gifAdjusted?'<p class="helper">Ajustamos definición, duración o FPS para respetar el límite de cálculo.</p>':''}<button type="button" class="action primary" id="generateGif">Generar GIF</button><div class="progress hidden-el" id="gifProgress"><div id="gifProgressFill"></div></div><p class="status" id="gifStatus" role="status" aria-live="polite"></p><button type="button" class="action hidden-el" id="cancelGif">Cancelar</button></div>`;
    section.innerHTML=`<p class="section-label">Proporción de la imagen</p><div class="aspect-grid">${Object.keys(aspectLabels).map(key=>`<button type="button" data-aspect="${key}" aria-pressed="${state.aspect===key}" class="${state.aspect===key?'selected':''}">${aspectLabels[key]}</button>`).join('')}</div><div class="output-tabs"><button type="button" data-output="png" class="${pngVisible?'selected':''}" aria-pressed="${pngVisible}">PNG</button><button type="button" data-output="gif" class="${gifVisible?'selected':''}" aria-pressed="${gifVisible}">GIF</button></div>${png}${gif}`;
    section.querySelectorAll('[data-aspect]').forEach(button=>button.onclick=()=>{if(exporting||gifExporting)return;state.aspect=button.dataset.aspect;drawExport()});
    section.querySelectorAll('[data-output]').forEach(button=>button.onclick=()=>{if(exporting||gifExporting)return;state.outputFormat=button.dataset.output;drawExport()});
    section.querySelectorAll('.size').forEach(button=>button.onclick=()=>{if(exporting||gifExporting)return;state.size=Number(button.dataset.size);drawExport()});
    const dims=exportDimensions(state.size);section.querySelector('#dimensions').textContent=`${dims.w.toLocaleString('es-AR')} × ${dims.h.toLocaleString('es-AR')} píxeles`;
    section.querySelectorAll('[data-export-mode]').forEach(button=>button.onclick=()=>{if(exporting||gifExporting)return;state.exportMode=button.dataset.exportMode;updateExportModeUI()});
    section.querySelector('#exportIterations').oninput=e=>{state.exportIter=Number(e.target.value);section.querySelector('#exportIterNumber').value=state.exportIter;section.querySelector('#exportIterOutput').textContent=state.exportIter.toLocaleString('es-AR');section.querySelector('#exportError').textContent='';updateExportModeUI()};
    section.querySelector('#exportIterNumber').onchange=e=>{const value=Number(e.target.value);if(!Number.isInteger(value)||value<100||value>10000){section.querySelector('#exportError').textContent='Elegí entre 100 y 10.000 iteraciones.';return}state.exportIter=value;section.querySelector('#exportIterations').value=value;section.querySelector('#exportIterOutput').textContent=value.toLocaleString('es-AR');section.querySelector('#exportError').textContent='';updateExportModeUI()};
    section.querySelector('#download').onclick=startExport;section.querySelector('#cancelExport').onclick=cancelExport;
    for(const [key,field] of [['size','gifSize'],['duration','gifDuration'],['fps','gifFps']])section.querySelectorAll(`[data-gif-${key}]`).forEach(button=>button.onclick=()=>{if(exporting||gifExporting)return;state[field]=Number(button.dataset[`gif${key[0].toUpperCase()+key.slice(1)}`]);drawExport()});
    section.querySelector('#gifIterations').oninput=e=>{state.gifIter=gifIterationSteps[Number(e.target.value)];section.querySelector('#gifIterOutput').textContent=state.gifIter.toLocaleString('es-AR');section.querySelector('#gifIterHint').textContent=`El primer cuadro usa hasta ${Math.min(180,state.gifIter).toLocaleString('es-AR')}; los siguientes suben gradualmente hasta ${state.gifIter.toLocaleString('es-AR')}.`;updateGifSummary()};
    section.querySelector('#gifIterations').onchange=()=>drawExport();
    section.querySelector('#generateGif').onclick=startGif;section.querySelector('#cancelGif').onclick=cancelGif;
    updateExportModeUI();syncExportUI();syncGifUI();
  }
  function updateGifSummary(){
    const summary=body.querySelector('#gifSummary');if(!summary)return;
    const combination=gifCombination(),{w,h,frames,pixels,work,frameWork,valid}=combination,busy=gifExporting||exporting;
    summary.textContent=`${w} × ${h} px · ${frames}/${gifMaxFrames} cuadros · ${(pixels/1e6).toFixed(1)}/${gifMaxPixels/1e6} M de píxeles · ${Math.min(180,state.gifIter).toLocaleString('es-AR')} → ${state.gifIter.toLocaleString('es-AR')} iteraciones${valid?'':` · ${gifLimitReason(combination)}.`}`;
    body.querySelector('#gifWork').textContent=`Carga teórica: ${(work/1e9).toFixed(1)}/${gifMaxWork/1e9} mil millones de iteraciones en total; ${(frameWork/1e9).toFixed(1)}/${gifMaxFrameWork/1e9} mil millones en el último cuadro.`;
    for(const button of body.querySelectorAll('[data-gif-size],[data-gif-duration],[data-gif-fps],[data-aspect]')){
      const size=button.dataset.gifSize?Number(button.dataset.gifSize):state.gifSize;
      const duration=button.dataset.gifDuration?Number(button.dataset.gifDuration):state.gifDuration;
      const fps=button.dataset.gifFps?Number(button.dataset.gifFps):state.gifFps;
      const aspect=button.dataset.aspect||state.aspect;
      const option=gifCombination(size,duration,fps,aspect);
      button.disabled=busy||(state.outputFormat==='gif'&&!option.valid);
      if(state.outputFormat==='gif'&&!option.valid){
        const reason=gifLimitReason(option);
        button.title=`No disponible: ${reason} con las otras opciones.`;
        button.setAttribute('aria-label',`${button.textContent.trim()}, no disponible: ${reason} con las otras opciones`);
      }else{button.removeAttribute('title');button.removeAttribute('aria-label')}
    }
    body.querySelector('#generateGif').disabled=busy||!valid;
  }
  function syncExportUI(){
    if(activePanel!=='appearance')return;
    const busy=exporting||gifExporting,download=body.querySelector('#download');
    if(download)download.disabled=busy;
    body.querySelectorAll('.size,[data-export-mode],#exportIterations,#exportIterNumber,#gifIterations,[data-aspect],[data-output],[data-gif-size],[data-gif-duration],[data-gif-fps]').forEach(el=>el.disabled=busy);
    body.querySelector('#progress').classList.toggle('hidden-el',!exporting);body.querySelector('#cancelExport').classList.toggle('hidden-el',!exporting);
    updateGifSummary();
  }
  function syncGifUI(){
    if(activePanel!=='appearance')return;
    body.querySelectorAll('[data-gif-size],[data-gif-duration],[data-gif-fps],[data-aspect],[data-output],#gifIterations').forEach(el=>el.disabled=gifExporting||exporting);
    body.querySelector('#gifProgress').classList.toggle('hidden-el',!gifExporting);body.querySelector('#cancelGif').classList.toggle('hidden-el',!gifExporting);
    const button=body.querySelector('#generateGif');if(button)button.disabled=gifExporting||exporting;
    updateGifSummary();
  }
  function cancelGif(){
    if(gifWorker)gifWorker.terminate();gifWorker=null;gifExporting=false;
    if(activePanel==='appearance'){body.querySelector('#gifStatus').textContent='Generación cancelada.';body.querySelector('#gifProgressFill').style.width='0%'}syncExportUI();syncGifUI();
  }
  function startGif(){
    if(gifExporting||exporting)return;
    const {w,h,frames,valid}=gifCombination();
    if(!valid){updateGifSummary();return}
    const worker=new Worker('./gif-worker.js');gifWorker=worker;gifExporting=true;syncExportUI();syncGifUI();
    body.querySelector('#gifStatus').textContent=`Preparando ${frames} cuadros; el último usará ${state.gifIter.toLocaleString('es-AR')} iteraciones…`;
    worker.onmessage=({data})=>{
      if(worker!==gifWorker)return;
      if(data.error){worker.terminate();gifWorker=null;gifExporting=false;if(activePanel==='appearance')body.querySelector('#gifStatus').textContent=data.error;syncExportUI();syncGifUI();return}
      if(data.progress){if(activePanel==='appearance'){const percent=Math.round(data.progress/data.total*100);body.querySelector('#gifProgressFill').style.width=percent+'%';body.querySelector('#gifStatus').textContent=`Cuadro ${data.progress} de ${data.total} · ${data.iterations.toLocaleString('es-AR')} iteraciones · ${percent}%`}return}
      if(data.done){worker.terminate();gifWorker=null;const blob=new Blob([data.buffer],{type:'image/gif'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`mandelbrot-${w}x${h}-${state.gifDuration}s-${state.gifFps}fps-${state.gifIter}iter.gif`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);gifExporting=false;if(activePanel==='appearance'){body.querySelector('#gifProgressFill').style.width='100%';body.querySelector('#gifStatus').textContent='GIF listo para guardar.'}syncExportUI();syncGifUI();}
    };
    worker.onerror=()=>{if(worker!==gifWorker)return;worker.terminate();gifWorker=null;gifExporting=false;if(activePanel==='appearance')body.querySelector('#gifStatus').textContent='No se pudo generar el GIF. Probá con menos definición.';syncExportUI();syncGifUI()};
    worker.postMessage({width:w,height:h,frames,fps:state.gifFps,cx:state.cx,cy:state.cy,span:state.span,maxIter:state.gifIter,colors:state.colors,inside:state.inside,frequency:state.frequency,phase:state.phase});
  }
  function cancelExport(){if(exportWorker)exportWorker.terminate();exportWorker=null;exportCanvas=null;exportContext=null;exporting=false;syncExportUI();if(activePanel==='appearance')body.querySelector('#status').textContent='Generación cancelada.'}
  function startExport(){
    if(exporting||gifExporting)return;
    if(state.exportMode==='manual'){
      const input=body.querySelector('#exportIterNumber'),value=Number(input.value);
      if(!Number.isInteger(value)||value<100||value>10000){body.querySelector('#exportError').textContent='Elegí entre 100 y 10.000 iteraciones.';input.focus();return}
      state.exportIter=value;
    }
    const iterations=selectedExportIterations(),{w,h}=exportDimensions(state.size);
    try{exportCanvas=document.createElement('canvas');exportCanvas.width=w;exportCanvas.height=h;exportContext=exportCanvas.getContext('2d',{alpha:false});if(!exportContext)throw Error('Sin memoria disponible')}
    catch(err){if(activePanel==='appearance')body.querySelector('#status').textContent='No se pudo crear la imagen. Probá una resolución menor.';return}
    const worker=new Worker('./render-worker.js');exportWorker=worker;exporting=true;syncExportUI();
    if(activePanel==='appearance')body.querySelector('#status').textContent=`Calculando ${iterations.toLocaleString('es-AR')} iteraciones…`;
    worker.onmessage=e=>{
      if(worker!==exportWorker)return;
      const tile=e.data;
      if(tile.done){worker.terminate();exportWorker=null;
        const output=exportCanvas;output.toBlob(blob=>{
          if(blob){const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=`mandelbrot-${w}x${h}-${iterations}iter.png`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
            if(activePanel==='appearance')body.querySelector('#status').textContent='PNG listo para guardar.';
          }else if(activePanel==='appearance')body.querySelector('#status').textContent='No se pudo guardar. Probá una resolución menor.';
          exportCanvas=null;exportContext=null;exporting=false;syncExportUI();
        },'image/png');return}
      exportContext.putImageData(new ImageData(new Uint8ClampedArray(tile.buffer),tile.width,tile.rows),0,tile.row);
      if(activePanel==='appearance'){const percent=Math.round((tile.row+tile.rows)/h*100);body.querySelector('#progressFill').style.width=percent+'%';body.querySelector('#status').textContent=`Calculando ${iterations.toLocaleString('es-AR')} iteraciones… ${percent}%`}
    };
    worker.onerror=()=>{cancelExport();if(activePanel==='appearance')body.querySelector('#status').textContent='No se pudo generar. Probá una resolución menor.'};
    worker.postMessage(config(w,h,iterations));
  }
  window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{render();if(activePanel==='appearance'&&!exporting&&!gifExporting)drawExport()},180)});
  function showIncomingPoint(point,doRender=true){
    incomingPoint=point;viewPoint(point,false);hideHint();if(doRender)render();
    const badge=document.querySelector('#sharedBadge');badge.textContent=`Punto compartido: ${point.name} · Guardar`;badge.classList.remove('hidden-el');badge.onclick=openDrawer;
    if(drawerOpen)drawPoints();
  }
  window.addEventListener('hashchange',()=>{const point=readSharedPoint();if(point)showIncomingPoint(point)});
  if(incomingPoint)showIncomingPoint(incomingPoint,false);
  render();
  setTimeout(hideHint,6500);
  if(document.modelContext?.registerTool){
    const register=(tool)=>{try{Promise.resolve(document.modelContext.registerTool(tool)).catch(()=>{})}catch{}};
    register({name:'configure_mandelbrot_view',title:'Configurar vista de Mandelbrot',description:'Configura el centro, el ancho visible, la paleta y las iteraciones; actualiza el fractal visible.',inputSchema:{type:'object',properties:{centerReal:{type:'number'},centerImaginary:{type:'number'},span:{type:'number',exclusiveMinimum:0},iterations:{type:'integer',minimum:80,maximum:1000},palette:{type:'string',enum:presets.map(p=>p.name)}},additionalProperties:false},annotations:{readOnlyHint:false},execute(input){if(!input||typeof input!=='object')throw Error('Configuración inválida');for(const key of Object.keys(input))if(!['centerReal','centerImaginary','span','iterations','palette'].includes(key))throw Error('Campo no reconocido');if(input.centerReal!==undefined){if(!Number.isFinite(input.centerReal))throw Error('Centro inválido')}if(input.centerImaginary!==undefined){if(!Number.isFinite(input.centerImaginary))throw Error('Centro inválido')}if(input.span!==undefined&&(!Number.isFinite(input.span)||input.span<=0))throw Error('Ancho inválido');if(input.iterations!==undefined&&(!Number.isInteger(input.iterations)||input.iterations<80||input.iterations>1000))throw Error('Iteraciones inválidas');let index=-1;if(input.palette!==undefined){index=presets.findIndex(p=>p.name===input.palette);if(index<0)throw Error('Paleta desconocida')}
      if(input.centerReal!==undefined)state.cx=input.centerReal;if(input.centerImaginary!==undefined)state.cy=input.centerImaginary;if(input.span!==undefined)state.span=clamp(input.span,1e-13,8);if(input.iterations!==undefined)state.maxIter=input.iterations;if(index>=0){state.preset=index;state.colors=[...presets[index].colors];state.inside=presets[index].inside}render();if(activePanel==='appearance')drawAppearance();if(activePanel==='point')drawGoToPoint();return {centerReal:state.cx,centerImaginary:state.cy,span:state.span,iterations:state.maxIter,palette:state.preset>=0?presets[state.preset].name:'Personalizada'};}});
  }
})();
