// Map a registered detail back to its source pixels without resizing the image.
// Coordinates in the registration use the detail's declared width and height.
export function detailTransform(detail){
 const identity=new Float32Array([1,0,0,0,1,0,0,0,1]);
 if(!detail?.registration)return identity;
 const {source,target}=detail.registration,rows=[];
 for(let i=0;i<4;i++){
  const x=target[i][0]/detail.width,y=target[i][1]/detail.height;
  const u=source[i][0]/detail.width,v=source[i][1]/detail.height;
  rows.push([x,y,1,0,0,0,-u*x,-u*y,u],[0,0,0,x,y,1,-v*x,-v*y,v]);
 }
 for(let c=0;c<8;c++){
  let pivot=c;for(let r=c+1;r<8;r++)if(Math.abs(rows[r][c])>Math.abs(rows[pivot][c]))pivot=r;
  if(Math.abs(rows[pivot][c])<1e-10)return identity;
  [rows[c],rows[pivot]]=[rows[pivot],rows[c]];
  const scale=rows[c][c];for(let k=c;k<9;k++)rows[c][k]/=scale;
  for(let r=0;r<8;r++)if(r!==c){const factor=rows[r][c];for(let k=c;k<9;k++)rows[r][k]-=factor*rows[c][k];}
 }
 const h=rows.map(r=>r[8]);return new Float32Array([h[0],h[3],h[6],h[1],h[4],h[7],h[2],h[5],1]);
}
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const image=src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error('Não foi possível carregar o panorama.'));i.src=src;});
export class MaterialViewer {
 constructor(canvas,onFrame=()=>{}){
  this.canvas=canvas;this.onFrame=onFrame;this.view={yaw:-.9,pitch:-.12,fov:120};this.animation=0;this.roomCache={};this.textures={};
  const gl=this.gl=canvas.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:true});if(!gl)throw Error('Este navegador não suporta a vista 360°. Experimente um navegador atualizado.');
  const shader=(type,text)=>{const s=gl.createShader(type);gl.shaderSource(s,text);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
  this.program=gl.createProgram();gl.attachShader(this.program,shader(gl.VERTEX_SHADER,'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'));
  gl.attachShader(this.program,shader(gl.FRAGMENT_SHADER,`precision highp float;uniform sampler2D base,floorDetail,handlesDetail,handlesMask,slabDetail,cabinetDetail;uniform mat3 slabTransform,cabinetTransform;uniform vec2 size,texSize;uniform vec3 view,handleColor;uniform vec4 detailCamera,handlesCamera,slabCamera,cabinetCamera;uniform float flatMode,detailEnabled,detailFeather,handlesEnabled,handleTint,slabEnabled,cabinetEnabled;
  float cubic(float x){x=abs(x);return x<1.?1.5*x*x*x-2.5*x*x+1.:x<2.?-.5*x*x*x+2.5*x*x-4.*x+2.:0.;}
  vec3 samplePanorama(vec2 uv){
    vec2 p=uv*texSize-.5,b=floor(p),f=p-b;vec3 color=vec3(0.);
    // Match the tour's Catmull–Rom reconstruction, without bilinear softening.
    for(int j=-1;j<=2;j++)for(int i=-1;i<=2;i++){
      vec2 q=(b+vec2(float(i),float(j))+.5)/texSize;
      q.x=fract(q.x);q.y=clamp(q.y,.5/texSize.y,1.-.5/texSize.y);
      color+=texture2D(base,q).rgb*cubic(float(i)-f.x)*cubic(float(j)-f.y);
    }
    vec2 step=1./texSize;
    vec3 nearby=(texture2D(base,vec2(fract(uv.x-step.x),uv.y)).rgb+texture2D(base,vec2(fract(uv.x+step.x),uv.y)).rgb+texture2D(base,vec2(uv.x,clamp(uv.y-step.y,0.,1.))).rgb+texture2D(base,vec2(uv.x,clamp(uv.y+step.y,0.,1.))).rgb)*.25;
    // Bounded local contrast avoids bright halos along tiles and cabinet edges.
    color+=clamp((color-nearby)*.32,vec3(-.035),vec3(.035));
    return clamp(color,0.,1.);
  }
  vec4 sampleFloor(vec3 ray){
    if(detailEnabled<.5)return vec4(0.);
    float cx=cos(detailCamera.x),sx=sin(detailCamera.x),cp=cos(detailCamera.y),sp=sin(detailCamera.y);
    float x=cx*ray.x-sx*ray.z,z=sx*ray.x+cx*ray.z,y=cp*ray.y-sp*z;
    z=sp*ray.y+cp*z;if(z<=0.)return vec4(0.);
    vec2 uv=vec2(.5+.5*x/z/detailCamera.z,.5-.5*y/z/(detailCamera.z/detailCamera.w));
    float edge=min(min(uv.x,1.-uv.x),min(uv.y,1.-uv.y));
    if(edge<=0.)return vec4(0.);
    return vec4(texture2D(floorDetail,uv).rgb,smoothstep(0.,detailFeather,edge));
  }
  vec4 sampleSlab(vec3 ray){
    if(slabEnabled<.5)return vec4(0.);
    float cx=cos(slabCamera.x),sx=sin(slabCamera.x),cp=cos(slabCamera.y),sp=sin(slabCamera.y);
    float x=cx*ray.x-sx*ray.z,z=sx*ray.x+cx*ray.z,y=cp*ray.y-sp*z;z=sp*ray.y+cp*z;
    if(z<=0.)return vec4(0.);
    vec2 uv=vec2(.5+.5*x/z/slabCamera.z,.5-.5*y/z/(slabCamera.z/slabCamera.w));
    if(min(min(uv.x,1.-uv.x),min(uv.y,1.-uv.y))<=0.)return vec4(0.);
    vec3 registered=slabTransform*vec3(uv,1.);uv=registered.xy/registered.z;
    if(min(min(uv.x,1.-uv.x),min(uv.y,1.-uv.y))<=0.)return vec4(0.);
    return texture2D(slabDetail,uv);
  }
  vec4 sampleCabinet(vec3 ray){
    if(cabinetEnabled<.5)return vec4(0.);
    float cx=cos(cabinetCamera.x),sx=sin(cabinetCamera.x),cp=cos(cabinetCamera.y),sp=sin(cabinetCamera.y);
    float x=cx*ray.x-sx*ray.z,z=sx*ray.x+cx*ray.z,y=cp*ray.y-sp*z;z=sp*ray.y+cp*z;
    if(z<=0.)return vec4(0.);
    vec2 uv=vec2(.5+.5*x/z/cabinetCamera.z,.5-.5*y/z/(cabinetCamera.z/cabinetCamera.w));
    if(min(min(uv.x,1.-uv.x),min(uv.y,1.-uv.y))<=0.)return vec4(0.);
    vec3 registered=cabinetTransform*vec3(uv,1.);uv=registered.xy/registered.z;
    if(min(min(uv.x,1.-uv.x),min(uv.y,1.-uv.y))<=0.)return vec4(0.);
    return texture2D(cabinetDetail,uv);
  }
  vec4 sampleHandles(vec3 ray){
    if(handlesEnabled<.5)return vec4(0.);
    float cx=cos(handlesCamera.x),sx=sin(handlesCamera.x),cp=cos(handlesCamera.y),sp=sin(handlesCamera.y);
    float x=cx*ray.x-sx*ray.z,z=sx*ray.x+cx*ray.z,y=cp*ray.y-sp*z;z=sp*ray.y+cp*z;
    if(z<=0.)return vec4(0.);
    vec2 uv=vec2(.5+.5*x/z/handlesCamera.z,.5-.5*y/z/(handlesCamera.z/handlesCamera.w));
    if(min(min(uv.x,1.-uv.x),min(uv.y,1.-uv.y))<=0.)return vec4(0.);
    vec2 mask=texture2D(handlesMask,uv).rg;vec3 color=texture2D(handlesDetail,uv).rgb;
    // Match the cabinet's local illumination, avoiding a rectangular colour halo.
    vec2 anchor=uv.x<.24?vec2(266.,434.):uv.x<.43?vec2(583.,461.):uv.x<.65?vec2(946.,494.):vec2(1393.,552.);
    anchor/=vec2(1774.,887.);vec3 a=normalize(vec3((anchor.x*2.-1.)*handlesCamera.z,(1.-anchor.y*2.)*handlesCamera.z/handlesCamera.w,1.));
    float ay=cp*a.y+sp*a.z,az=-sp*a.y+cp*a.z;vec3 ar=vec3(cx*a.x+sx*az,ay,-sx*a.x+cx*az);
    vec2 ast=vec2(fract(.5+atan(ar.x,ar.z)/6.28318530718),.5-asin(ar.y)/3.14159265359);
    vec3 backgroundDelta=texture2D(base,ast).rgb-texture2D(handlesDetail,anchor).rgb;
    float light=dot(color,vec3(.2126,.7152,.0722));
    vec3 metal=handleColor*(.5+.85*light)+vec3(.12)*pow(light,6.);
    color=clamp(color+backgroundDelta*(1.-mask.g),0.,1.);
    return vec4(mix(color,metal,mask.g*handleTint),mask.r);
  }
  void main(){vec2 uv=gl_FragCoord.xy/size;float t=tan(view.z*.5);vec3 d=normalize(vec3((uv.x*2.-1.)*t,(uv.y*2.-1.)*t*size.y/size.x,1.));float y=cos(view.y)*d.y+sin(view.y)*d.z,z=-sin(view.y)*d.y+cos(view.y)*d.z;vec3 r=vec3(cos(view.x)*d.x+sin(view.x)*z,y,-sin(view.x)*d.x+cos(view.x)*z);vec2 st=vec2(fract(.5+atan(r.x,r.z)/6.28318530718),.5-asin(clamp(r.y,-1.,1.))/3.14159265359);
    // Bake the same repair into 360 exports and offline client presentations.
    if(flatMode>.5){st=vec2(uv.x,1.-uv.y);float yaw=(st.x-.5)*6.28318530718,pitch=(.5-st.y)*3.14159265359;r=vec3(sin(yaw)*cos(pitch),sin(pitch),cos(yaw)*cos(pitch));}
    vec3 color=flatMode>.5?texture2D(base,st).rgb:samplePanorama(st);vec4 floor=sampleFloor(r),handles=sampleHandles(r),slab=sampleSlab(r),cabinet=sampleCabinet(r);color=mix(color,cabinet.rgb,cabinet.a);color=mix(color,floor.rgb,floor.a);color=mix(color,slab.rgb,slab.a);gl_FragColor=vec4(mix(color,handles.rgb,handles.a),1.);}`));
  gl.linkProgram(this.program);if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(this.program));gl.useProgram(this.program);
  const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const pos=gl.getAttribLocation(this.program,'p');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
  this.u=Object.fromEntries(['base','size','texSize','view','flatMode','floorDetail','detailCamera','detailEnabled','detailFeather','handlesDetail','handlesMask','handlesCamera','handlesEnabled','handleColor','handleTint','slabDetail','slabCamera','slabEnabled','slabTransform','cabinetDetail','cabinetCamera','cabinetEnabled','cabinetTransform'].map(k=>[k,gl.getUniformLocation(this.program,k)]));this.observer=new ResizeObserver(()=>this.draw());this.observer.observe(canvas.parentElement);this.bind();
 }
 texture(name,source){if(name==='base')this.sourceSize={width:source.naturalWidth||source.width,height:source.naturalHeight||source.height};const g=this.gl;let t=this.textures[name];if(!t)t=this.textures[name]=g.createTexture();g.bindTexture(g.TEXTURE_2D,t);g.texImage2D(g.TEXTURE_2D,0,g.RGBA,g.RGBA,g.UNSIGNED_BYTE,source);for(const x of [g.TEXTURE_WRAP_S,g.TEXTURE_WRAP_T])g.texParameteri(g.TEXTURE_2D,x,g.CLAMP_TO_EDGE);for(const x of [g.TEXTURE_MIN_FILTER,g.TEXTURE_MAG_FILTER])g.texParameteri(g.TEXTURE_2D,x,g.LINEAR);}
 async prepare(catalog){this.catalog=catalog;}
 async setRoom(id,config,selections){cancelAnimationFrame(this.animation);const token=this.loadToken=(this.loadToken||0)+1;let data=this.roomCache[id];if(!data){const pictures=await Promise.all([config.image,...(config.variants||[])].map(image));const masks=[];const w=pictures[0].naturalWidth,h=pictures[0].naturalHeight;const base=document.createElement('canvas');base.width=w;base.height=h;const bg=base.getContext('2d');bg.drawImage(pictures[0],0,0,w,h);const pixels=bg.getImageData(0,0,w,h).data;
   for(const m of config.masks||[]){if(m.id>config.groups.length||(config.handleDetail&&config.groups[m.id-1]==='handles'))continue;const mask=document.createElement('canvas');mask.width=w;mask.height=h;const g=mask.getContext('2d');g.fillStyle='white';g.save();g.scale(w/1774,h/887);g.fill(new Path2D(m.path));g.restore();
    // Rendered variants retain the scene's objects, shadows and reflections.
    // A handle silhouette keeps its finish independent of cabinet fronts.
    if(id==='kitchen'&&m.id===4){const im=g.getImageData(0,0,w,h);for(let n=0;n<im.data.length;n+=4){if(im.data[n+3]&&Math.max(pixels[n],pixels[n+1],pixels[n+2])>150)im.data[n+3]=0;}g.putImageData(im,0,0);}
    masks.push({id:m.id,canvas:mask});}
   const floorDetails=Object.fromEntries(await Promise.all(Object.entries(config.floorDetail?.images||{}).map(async([key,src])=>[key,await image(src)])));
   const handleDetails=Object.fromEntries(await Promise.all(Object.entries(config.handleDetail?.images||{}).map(async([key,src])=>[key,await image(src)])));
   const slabDetails=Object.fromEntries(await Promise.all(Object.entries(config.slabDetail?.images||{}).map(async([key,src])=>[key,await image(src)])));
   const slabLayers={};for(const [key,src] of Object.entries(slabDetails)){const d=config.slabDetail,c=document.createElement('canvas');c.width=src.naturalWidth;c.height=src.naturalHeight;const ctx=c.getContext('2d');ctx.drawImage(src,0,0);const mask=document.createElement('canvas');mask.width=c.width;mask.height=c.height;const mg=mask.getContext('2d');mg.scale(c.width/d.width,c.height/d.height);mg.fillStyle='white';mg.fill(new Path2D(d.path));mg.globalCompositeOperation='destination-out';for(const hole of d.holes||[])mg.fill(new Path2D(hole));ctx.globalCompositeOperation='destination-in';ctx.filter='blur(1px)';ctx.drawImage(mask,0,0);slabLayers[key]=c;}
   const cabinetDetails=Object.fromEntries(await Promise.all(Object.entries(config.cabinetDetail?.images||{}).map(async([key,src])=>[key,await image(src)])));
   const cabinetLayers={};for(const [key,src] of Object.entries(cabinetDetails)){const d=config.cabinetDetail,c=document.createElement('canvas');c.width=src.naturalWidth;c.height=src.naturalHeight;const ctx=c.getContext('2d');ctx.drawImage(src,0,0);const mask=document.createElement('canvas');mask.width=c.width;mask.height=c.height;const mg=mask.getContext('2d');mg.scale(c.width/d.width,c.height/d.height);mg.fillStyle='white';mg.fill(new Path2D(d.path));mg.globalCompositeOperation='destination-out';for(const hole of d.holes||[])mg.fill(new Path2D(hole));ctx.globalCompositeOperation='destination-in';ctx.filter=`blur(${d.feather||1}px)`;ctx.drawImage(mask,0,0);cabinetLayers[key]=c;}
   let handlesMask;if(config.handleDetail){const detail=config.handleDetail;handlesMask=document.createElement('canvas');handlesMask.width=detail.width;handlesMask.height=detail.height;const ctx=handlesMask.getContext('2d');ctx.fillStyle='black';ctx.fillRect(0,0,handlesMask.width,handlesMask.height);ctx.fillStyle='red';ctx.filter='blur(4px)';for(const path of detail.surrounds)ctx.fill(new Path2D(path));ctx.filter='none';ctx.globalCompositeOperation='lighter';ctx.fillStyle='#00ff00';for(const path of detail.metal)ctx.fill(new Path2D(path));}
   const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const layer=document.createElement('canvas');layer.width=w;layer.height=h;data={pictures,masks,canvas,layer,floorDetails,handleDetails,handlesMask,slabDetails,slabLayers,slabTransform:detailTransform(config.slabDetail),cabinetDetails,cabinetLayers,cabinetTransform:detailTransform(config.cabinetDetail)};this.roomCache[id]=data;
  }if(this.disposed||token!==this.loadToken)return false;this.room=id;this.config=config;this.data=data;this.view={...config.normal};this.ready=true;if(data.handlesMask)this.texture('handlesMask',data.handlesMask);this.setSelections(selections);return true;
 }
 setSelections(s){this.selections={...s};if(!this.data)return;const {pictures,masks,canvas,layer}=this.data;const kits=this.catalog?.kits||[];const exact=kits.find(k=>Object.entries(k.selections[this.room]||{}).every(([key,id])=>s[key]===id));const indexes={luz:0,areia:1,grafite:2};
  // Use the selected cabinet finish as the kitchen foundation. Masking fronts
  // over a white foundation left white side panels and edge strips exposed.
  const foundation=this.room==='kitchen'?({w1000:0,u702:1,u963:2}[s.fronts]??0):0;
  if(exact&&pictures[indexes[exact.id]]){this.texture('base',pictures[indexes[exact.id]]);}else if(pictures.length===1){this.texture('base',pictures[0]);}else{const g=canvas.getContext('2d'),l=layer.getContext('2d');g.clearRect(0,0,canvas.width,canvas.height);g.drawImage(pictures[foundation]||pictures[0],0,0,canvas.width,canvas.height);
   for(const m of masks){const group=this.config.groups[m.id-1];if(group==='wood'||(this.room==='kitchen'&&group==='fronts')||(this.config.slabDetail&&['countertop','backsplash'].includes(group)))continue;const chosen=s[group];let source=0;if(kits.find(k=>k.id==='areia')?.selections[this.room]?.[group]===chosen)source=1;else if(kits.find(k=>k.id==='grafite')?.selections[this.room]?.[group]===chosen)source=2;if(this.config.defaults?.[group]===chosen)source=0;
    l.globalCompositeOperation='source-over';l.clearRect(0,0,layer.width,layer.height);l.drawImage(pictures[source],0,0,layer.width,layer.height);l.globalCompositeOperation='destination-in';l.filter=m.id===4&&this.room==='kitchen'?'none':`blur(${.6*canvas.width/1774}px)`;l.drawImage(m.canvas,0,0);l.filter='none';g.drawImage(layer,0,0);
   }this.texture('base',canvas);
  }const detail=this.data.floorDetails[s.floor];this.hasFloorDetail=!!detail;if(detail)this.texture('floorDetail',detail);const handles=this.data.handleDetails[s.fronts];this.hasHandleDetail=!!handles;if(handles)this.texture('handlesDetail',handles);const slab=this.data.slabLayers[s.backsplash+'|'+s.countertop]||this.data.slabLayers[s.backsplash];this.hasSlabDetail=!!slab;if(slab)this.texture('slabDetail',slab);const cabinet=this.data.cabinetLayers[s.fronts];this.hasCabinetDetail=!!cabinet;if(cabinet)this.texture('cabinetDetail',cabinet);this.draw();
 }
 draw(flat=false,width=0,height=0){if(!this.ready||this.disposed)return;const c=this.canvas,g=this.gl,rect=c.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2.5),scale=Math.min(dpr,4096/Math.max(rect.width,rect.height)),w=width||Math.round(rect.width*scale),h=height||Math.round(rect.height*scale);if(!w||!h)return;if(c.width!==w||c.height!==h){c.width=w;c.height=h;}g.viewport(0,0,w,h);g.useProgram(this.program);g.activeTexture(g.TEXTURE0);g.bindTexture(g.TEXTURE_2D,this.textures.base);g.uniform1i(this.u.base,0);g.uniform2f(this.u.size,w,h);g.uniform2f(this.u.texSize,this.sourceSize.width,this.sourceSize.height);const t=Math.tan(this.view.fov*Math.PI/360)*Math.min(1,w/h/1.45);g.uniform3f(this.u.view,this.view.yaw,this.view.pitch,2*Math.atan(t));g.uniform1f(this.u.flatMode,flat?1:0);
  const detail=this.config.floorDetail;g.activeTexture(g.TEXTURE1);g.bindTexture(g.TEXTURE_2D,this.hasFloorDetail?this.textures.floorDetail:this.textures.base);g.uniform1i(this.u.floorDetail,1);g.uniform1f(this.u.detailEnabled,this.hasFloorDetail?1:0);g.uniform4f(this.u.detailCamera,detail?.yaw||0,detail?.pitch||0,detail?.tangent||1,detail?.aspect||1);g.uniform1f(this.u.detailFeather,detail?.feather||.09);
  const hd=this.config.handleDetail;g.activeTexture(g.TEXTURE2);g.bindTexture(g.TEXTURE_2D,this.hasHandleDetail?this.textures.handlesDetail:this.textures.base);g.uniform1i(this.u.handlesDetail,2);g.activeTexture(g.TEXTURE3);g.bindTexture(g.TEXTURE_2D,this.hasHandleDetail?this.textures.handlesMask:this.textures.base);g.uniform1i(this.u.handlesMask,3);g.uniform1f(this.u.handlesEnabled,this.hasHandleDetail&&!this.omitHandles?1:0);g.uniform4f(this.u.handlesCamera,hd?.yaw||0,hd?.pitch||0,hd?.tangent||1,hd?.aspect||1);const aluminium=this.selections.handles==='handle-aluminium',hex=this.selections.handles==='handle-anthracite'?'4b4d4d':'202223';g.uniform1f(this.u.handleTint,aluminium?0:1);g.uniform3f(this.u.handleColor,...[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)/255));
  const sd=this.config.slabDetail;g.activeTexture(g.TEXTURE4);g.bindTexture(g.TEXTURE_2D,this.hasSlabDetail?this.textures.slabDetail:this.textures.base);g.uniform1i(this.u.slabDetail,4);g.uniform1f(this.u.slabEnabled,this.hasSlabDetail&&!this.omitSlab?1:0);g.uniform4f(this.u.slabCamera,sd?.yaw||0,sd?.pitch||0,sd?.tangent||1,sd?.aspect||1);g.uniformMatrix3fv(this.u.slabTransform,false,this.data.slabTransform);
  const cd=this.config.cabinetDetail;g.activeTexture(g.TEXTURE5);g.bindTexture(g.TEXTURE_2D,this.hasCabinetDetail?this.textures.cabinetDetail:this.textures.base);g.uniform1i(this.u.cabinetDetail,5);g.uniform1f(this.u.cabinetEnabled,this.hasCabinetDetail&&!this.omitCabinet?1:0);g.uniform4f(this.u.cabinetCamera,cd?.yaw||0,cd?.pitch||0,cd?.tangent||1,cd?.aspect||1);g.uniformMatrix3fv(this.u.cabinetTransform,false,this.data.cabinetTransform);
  g.drawArrays(g.TRIANGLES,0,6);c.dataset.room=this.room;c.dataset.view=JSON.stringify(this.view);c.dataset.selection=JSON.stringify(this.selections);this.onFrame();}
 clampFov(fov){return this.config?.fixedFov??clamp(fov,45,120);}
 animateTo(target){target={...target,fov:this.clampFov(target.fov)};cancelAnimationFrame(this.animation);const start={...this.view},time=performance.now(),duration=matchMedia('(prefers-reduced-motion: reduce)').matches?0:700;const step=now=>{const t=duration?Math.min(1,(now-time)/duration):1,k=t*t*(3-2*t);for(const key of ['yaw','pitch','fov'])this.view[key]=start[key]+(target[key]-start[key])*k;this.draw();if(t<1)this.animation=requestAnimationFrame(step);};this.animation=requestAnimationFrame(step);}
 project(x,y){const a=(x/1774-.5)*Math.PI*2,p=(.5-y/887)*Math.PI,dx=Math.sin(a)*Math.cos(p),dy=Math.sin(p),dz=Math.cos(a)*Math.cos(p),v=this.view,xx=Math.cos(v.yaw)*dx-Math.sin(v.yaw)*dz,z0=Math.sin(v.yaw)*dx+Math.cos(v.yaw)*dz,yy=Math.cos(v.pitch)*dy-Math.sin(v.pitch)*z0,zz=Math.sin(v.pitch)*dy+Math.cos(v.pitch)*z0;if(zz<=0)return null;const rect=this.canvas.getBoundingClientRect(),t=Math.tan(v.fov*Math.PI/360)*Math.min(1,rect.width/rect.height/1.45);return{x:(.5+.5*xx/zz/t)*rect.width,y:(.5-.5*yy/zz/t*rect.width/rect.height)*rect.height};}
 zoom(delta){this.animateTo({...this.view,fov:this.clampFov(this.view.fov+delta)});}
 bind(){const c=this.canvas,pointers=new Map();this.events=new AbortController();const listen=(type,fn,options={})=>c.addEventListener(type,fn,{...options,signal:this.events.signal});let last=null,pinch=0;listen('pointerdown',e=>{cancelAnimationFrame(this.animation);c.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});last={x:e.clientX,y:e.clientY};if(pointers.size===2){const [a,b]=[...pointers.values()];pinch=Math.hypot(a.x-b.x,a.y-b.y);}});listen('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2){const [a,b]=[...pointers.values()],d=Math.hypot(a.x-b.x,a.y-b.y);this.view.fov=this.clampFov(this.view.fov+(pinch-d)*.12);pinch=d;}else if(last){this.view.yaw-=(e.clientX-last.x)*.004;this.view.pitch=clamp(this.view.pitch+(e.clientY-last.y)*.003,-1.1,1.1);}last={x:e.clientX,y:e.clientY};this.draw();});const end=e=>{pointers.delete(e.pointerId);last=null;};listen('pointerup',end);listen('pointercancel',end);listen('wheel',e=>{e.preventDefault();this.view.fov=this.clampFov(this.view.fov+e.deltaY*.045);this.draw();},{passive:false});listen('keydown',e=>{const key=e.key;if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-'].includes(key))return;e.preventDefault();this.view.yaw+=key==='ArrowLeft'?-.08:key==='ArrowRight'?.08:0;this.view.pitch=clamp(this.view.pitch+(key==='ArrowUp'?.06:key==='ArrowDown'?-.06:0),-1.1,1.1);this.view.fov=this.clampFov(this.view.fov+(key==='+'?-5:key==='-'?5:0));this.draw();});}
 destroy(){this.disposed=true;this.ready=false;this.loadToken=(this.loadToken||0)+1;cancelAnimationFrame(this.animation);this.events?.abort();this.observer.disconnect();this.gl.getExtension('WEBGL_lose_context')?.loseContext();this.roomCache={};}
 capturePanorama({includeHandles=true,includeSlab=true,includeCabinet=true}={}){this.omitHandles=!includeHandles;this.omitSlab=!includeSlab;this.omitCabinet=!includeCabinet;this.draw(true,this.sourceSize.width,this.sourceSize.height);const result=this.canvas.toDataURL('image/jpeg',.96);this.omitHandles=false;this.omitSlab=false;this.omitCabinet=false;this.draw();return result;}
 exportHandleDetail(){const detail=this.config.handleDetail,src=this.data.handleDetails[this.selections.fronts];if(!detail||!src)return undefined;const c=document.createElement('canvas');c.width=src.naturalWidth;c.height=src.naturalHeight;c.getContext('2d').drawImage(src,0,0);return{...detail,images:{[this.selections.fronts]:c.toDataURL('image/webp',1)}};}
 exportCabinetDetail(){const detail=this.config.cabinetDetail,src=this.data.cabinetDetails[this.selections.fronts];if(!detail||!src)return undefined;const c=document.createElement('canvas');c.width=src.naturalWidth;c.height=src.naturalHeight;c.getContext('2d').drawImage(src,0,0);return{...detail,images:{[this.selections.fronts]:c.toDataURL('image/webp',1)}};}
 exportSlabDetail(){const detail=this.config.slabDetail,key=this.selections.backsplash+'|'+this.selections.countertop,selected=this.data.slabDetails[key]?key:this.selections.backsplash,src=this.data.slabDetails[selected];if(!detail||!src)return undefined;const c=document.createElement('canvas');c.width=src.naturalWidth;c.height=src.naturalHeight;c.getContext('2d').drawImage(src,0,0);return{...detail,images:{[selected]:c.toDataURL('image/webp',.95)}};}
 captureView(){this.draw();return this.canvas.toDataURL('image/jpeg',.96);}
}
