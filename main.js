/* Mi Cancionero · beta — lógica principal */
const $=s=>document.querySelector(s);
const E=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------- Datos ---------- */
const M=8; // columnas por compás
const LOGO='icono.png';
const brand=(live=true)=>'<button class="brand" '+(live?'onclick="goHome()" title="Ir al menú"':'style="cursor:default" tabindex="-1"')+'><img src="'+LOGO+'" alt=""><span>Mi Cancionero</span></button>';
function goHome(){stop();view=null;mod();R()}
const INST={
 guitarra:{n:'Guitarra',t:'str',rows:['e','B','G','D','A','E'],f:[329.63,246.94,196,146.83,110,82.41]},
 bajo:{n:'Bajo',t:'str',rows:['G','D','A','E'],f:[98,73.42,55,41.2]},
 bateria:{n:'Batería',t:'dr',rows:['CR','HH','SD','T1','BD'],f:[900,700,320,190,60]},
 piano:{n:'Piano',t:'pn',rows:['B','A#','A','G#','G','F#','F','E','D#','D','C#','C']}
};
let S={user:null,guest:false,projects:[],songs:[]},cur='',view=null,q='',tab='letra',timer,col=0,pend=null;
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const mig=s=>{
 if(!Array.isArray(s.tracks))s.tracks=Object.entries(s.tracks).map(([k,T])=>({id:uid(),inst:k,n:INST[k].n,d:T.d}));
 if(!Array.isArray(s.chords))s.chords=[];
 if(typeof s.lyrics!=='string')s.lyrics='';
};
const song=()=>S.songs.find(s=>s.id==view);
const trk=id=>song().tracks.find(t=>t.id===id);
const mk=(inst,n)=>Array.from({length:INST[inst].rows.length},()=>Array(n).fill(''));
function save(){if(S.guest||!S.user)return;try{localStorage.setItem('tablab_'+S.user,JSON.stringify(S));localStorage.setItem('tablab_last',S.user)}catch(e){}}
function touch(){const s=song();if(s)s.u=Date.now();save()}
function mod(h){$('#m').innerHTML=h?'<div class="ov"><div class="md">'+h+'</div></div>':''}

/* ---------- Sesión ---------- */
function login(){let l='';try{l=localStorage.getItem('tablab_last')||''}catch(e){}
 return '<div class="login"><div class="md"><div>'+brand(false)+'</div><input class="ed" id="ln" placeholder="Tu nombre de usuario" value="'+E(l)+'"><button class="b on" onclick="enter()">Iniciar sesión</button><button class="b" onclick="gMod()">Continuar con Google</button><button class="b" onclick="guest()">Modo invitado</button><small style="color:var(--mut)">En esta beta las cuentas se guardan solo en este navegador. En modo invitado no se guarda nada: descargá tu proyecto antes de salir.</small></div></div>'}
function enter(){go($('#ln').value.trim())}
function gMod(){mod('<h3>Continuar con Google</h3><p style="margin:0;color:var(--mut)">El acceso real con Google necesita un servidor propio y una credencial de Google, que se conectan cuando la app tenga base de datos. Por ahora podés entrar con tu correo como usuario local, sin verificación.</p><input class="ed" id="ge" type="email" placeholder="tucorreo@gmail.com"><div class="r"><button class="b" onclick="mod()">Cancelar</button><button class="b on" onclick="go($(\'#ge\').value.trim())">Continuar</button></div>')}
function go(u){if(!u)return;let d=null;try{d=JSON.parse(localStorage.getItem('tablab_'+u))}catch(e){}
 S=d&&d.songs?d:{user:u,guest:false,projects:[],songs:[]};S.user=u;S.guest=false;S.songs.forEach(mig);save();mod();R()}
function guest(){S={user:'Invitado',guest:true,projects:[],songs:[]};R()}
function out(){stop();view=null;cur='';S={user:null,songs:[],projects:[]};R()}

/* ---------- Menú (página principal) ---------- */
function side(){const r=[...S.songs].sort((a,b)=>(b.u||0)-(a.u||0)).slice(0,8);
 return '<aside>'+brand()+'<div class="user" style="margin-top:10px"><div class="av">'+E(S.user[0].toUpperCase())+'</div><div>'+E(S.user)+'<br><a style="cursor:pointer;color:var(--mut);font-size:12px" onclick="out()">Salir</a></div></div>'+
 '<button class="b" onclick="document.getElementById(\'fi\').click()">+ cargar canción</button><button class="b" onclick="mNew()">+ crear canción</button>'+
 '<div class="rec"><p>Canciones recientes</p>'+(r.length?r.map(s=>'<a onclick="openS(\''+s.id+'\')">'+E(s.name)+'</a>').join(''):'<span style="color:var(--mut)">Todavía no hay canciones.</span>')+'</div></aside>'}
function chips(){return '<div class="top"><button class="b '+(cur===''?'on':'')+'" onclick="cur=\'\';R()">Todos los proyectos</button>'+S.projects.map(p=>'<button class="b '+(cur===p?'on':'')+'" onclick="cur=this.dataset.p;R()" data-p="'+E(p)+'">'+E(p)+'</button>').join('')+'<button class="b" onclick="mProj()">+ proyecto</button></div>'}
function cards(){const l=S.songs.filter(s=>(!cur||s.project===cur)&&(s.name+' '+s.project).toLowerCase().includes(q.toLowerCase()));
 if(!l.length)return '<p class="empty">No hay canciones para mostrar. Creá una con “+ crear canción” o cargá un archivo.</p>';
 return l.map(s=>'<div class="card" style="--c:'+(s.cover?'url('+s.cover+')':'none')+'" onclick="openS(\''+s.id+'\')"><div class="t"><b>“'+E(s.name)+'”</b><span>-'+E(s.by)+'</span><span>-'+E(s.project||'sin proyecto')+'</span></div><div class="ic">'+s.tracks.map(t=>t.n).join(' · ')+' · '+s.bpm+' bpm</div></div>').join('')}
function home(){return chips()+'<div class="pad"><div class="srch"><input placeholder="Buscar…" value="'+E(q)+'" oninput="q=this.value;$(\'#g\').innerHTML=cards()"></div><div class="grid" id="g">'+cards()+'</div></div>'}
function mProj(){mod('<h3>Nuevo proyecto</h3><input class="ed" id="pn" placeholder="Banda, orquesta o proyecto"><div class="r"><button class="b" onclick="mod()">Cancelar</button><button class="b on" onclick="addP()">Crear</button></div>')}
function addP(){const p=$('#pn').value.trim();if(!p)return;if(!S.projects.includes(p))S.projects.push(p);cur=p;save();mod();R()}
function mNew(){mod('<h3>Crear composición</h3><input class="ed" id="nn" placeholder="Nombre de la canción"><select class="ed" id="np"><option value="">Sin proyecto</option>'+S.projects.map(p=>'<option '+(p===cur?'selected':'')+'>'+E(p)+'</option>').join('')+'</select><small style="color:var(--mut)">Instrumentos (podés repetirlos):</small><div class="ck">'+Object.keys(INST).map(k=>'<div class="st"><span>'+INST[k].n+'</span><button class="c ic" onclick="stp(\''+k+'\',-1)">−</button><b id="cn-'+k+'">0</b><button class="c ic" onclick="stp(\''+k+'\',1)">+</button></div>').join('')+'</div><label>BPM <input class="ed" id="nb" type="number" value="120" min="30" max="300" style="width:90px"></label><div class="r"><button class="b" onclick="mod()">Cancelar</button><button class="b on" onclick="create()">Crear</button></div>')}
function stp(k,d){const e=$('#cn-'+k);e.textContent=Math.max(0,Math.min(8,(+e.textContent)+d))}
function create(){const n=$('#nn').value.trim()||'Sin título',ks=[];
 Object.keys(INST).forEach(k=>{const c=+$('#cn-'+k).textContent;for(let j=1;j<=c;j++)ks.push([k,c>1?j:0])});
 if(!ks.length){$('.ck').style.outline='1px solid var(--acc)';$('.ck').style.outlineOffset='4px';return}
 const s={id:uid(),name:n,by:S.user,project:$('#np').value,bpm:+$('#nb').value||120,cover:'',lyrics:'',chords:[],tracks:[],u:Date.now()};
 ks.forEach(([k,j])=>s.tracks.push({id:uid(),inst:k,n:INST[k].n+(j?' '+j:''),d:mk(k,16)}));
 S.songs.push(s);save();mod();openS(s.id)}
function openS(id){stop();view=id;tab='letra';mod();R()}

/* ---------- Editor: cabecera ---------- */
function cover(f){if(!f)return;const r=new FileReader();r.onload=()=>{const i=new Image();i.onload=()=>{const c=document.createElement('canvas');c.width=c.height=400;const m=Math.min(i.width,i.height);c.getContext('2d').drawImage(i,(i.width-m)/2,(i.height-m)/2,m,m,0,0,400,400);song().cover=c.toDataURL('image/jpeg',.7);touch();R()};i.src=r.result};r.readAsDataURL(f)}
function editor(){const s=song();
 if(tab!=='letra'&&!s.tracks.some(x=>x.id===tab))tab='letra';
 const t=s.tracks.find(x=>x.id===tab);
 const ch='<button class="c '+(tab==='letra'?'on':'')+'" onclick="tab=\'letra\';R()">Letra</button>'+
  s.tracks.map(x=>'<button class="c '+(x.id===tab?'on':'')+'" onclick="tab=\''+x.id+'\';R()">'+E(x.n)+'</button>').join('')+
  '<button class="c ic no" title="Agregar instrumento" onclick="mInst()">+</button><button class="c ic no" title="Quitar instrumento" onclick="mDel()">−</button><span class="bpm">'+s.bpm+' bpm</span>';
 const body=t?'<h3 style="margin-top:0">'+E(t.n)+'</h3>'+grid(t)+'<div class="no" style="margin-top:14px"><button class="b" onclick="addCols(\''+t.id+'\')">+ compás</button></div>':letra(s);
 return '<div class="top no">'+brand()+'<span style="flex:1"></span><button class="b on" onclick="play()">▶ Reproducir</button><button class="b" onclick="stop()">■</button><button class="b" onclick="window.print()">PDF</button><button class="b" onclick="exp()">Guardar proyecto</button></div>'+
 '<div class="pad"><div class="hd"><div class="cv" style="background-image:'+(s.cover?'url('+s.cover+')':'none')+'"></div><div><h2>“'+E(s.name)+'” - '+E(s.project||'sin banda')+' <button class="pen no" onclick="mEdit()" title="Editar">✎</button></h2><div class="chips">'+ch+'</div></div></div>'+body+'</div>'}
function mEdit(){const s=song();mod('<h3>Editar composición</h3><input class="ed" id="en" value="'+E(s.name)+'" placeholder="Título"><select class="ed" id="ep"><option value="">Sin banda</option>'+S.projects.map(p=>'<option '+(p===s.project?'selected':'')+'>'+E(p)+'</option>').join('')+'</select><label>BPM <input class="ed" id="eb" type="number" min="30" max="300" value="'+s.bpm+'" style="width:90px"></label><label class="b" style="text-align:center">Cambiar tapa del disco<input type="file" accept="image/*" hidden onchange="cover(this.files[0])"></label><div class="r"><button class="b" onclick="mod()">Cancelar</button><button class="b on" onclick="saveE()">Guardar</button></div>')}
function saveE(){const s=song();s.name=$('#en').value.trim()||s.name;s.project=$('#ep').value;s.bpm=+$('#eb').value||120;touch();mod();R()}

/* ---------- Instrumentos (+ / −) ---------- */
function mInst(){mod('<h3>Agregar instrumento</h3><select class="ed" id="ni">'+Object.keys(INST).map(k=>'<option value="'+k+'">'+INST[k].n+'</option>').join('')+'</select><div class="r"><button class="b" onclick="mod()">Cancelar</button><button class="b on" onclick="addT()">Agregar</button></div>')}
function addT(){const s=song(),k=$('#ni').value,c=s.tracks.filter(t=>t.inst===k).length,id=uid();
 s.tracks.push({id,inst:k,n:INST[k].n+(c?' '+(c+1):''),d:mk(k,16)});tab=id;touch();mod();R()}
function mDel(){const s=song();
 if(!s.tracks.length){mod('<h3>Quitar instrumento</h3><p style="margin:0">Esta canción no tiene instrumentos.</p><div class="r"><button class="b" onclick="mod()">Cerrar</button></div>');return}
 mod('<h3>Quitar instrumento</h3><select class="ed" id="nd">'+s.tracks.map(t=>'<option value="'+t.id+'" '+(t.id===tab?'selected':'')+'>'+E(t.n)+'</option>').join('')+'</select><p style="margin:0;color:var(--mut)">Se borra su tablatura de esta canción.</p><div class="r"><button class="b" onclick="mod()">Cancelar</button><button class="b on" onclick="rmT()">Quitar</button></div>')}
function rmT(){const s=song(),id=$('#nd').value;s.tracks=s.tracks.filter(t=>t.id!==id);tab='letra';touch();mod();R()}

/* ---------- Tablatura por compases ---------- */
function grid(t){const I=INST[t.inst],n=Math.ceil(t.d[0].length/M);let h='<div class="ms">';
 for(let m=0;m<n;m++){
  h+='<div class="m"><div class="mh"><span>Compás '+(m+1)+'</span><span class="no"><button class="ib" title="Duplicar compás" onclick="dupM(\''+t.id+'\','+m+')">⧉</button><button class="ib" title="Quitar compás" onclick="delM(\''+t.id+'\','+m+')">✕</button></span></div><div class="sc"><table class="tb">';
  t.d.forEach((row,r)=>{h+='<tr><th>'+I.rows[r]+'</th>';
   for(let c=m*M;c<m*M+M;c++){const v=row[c];
    h+=I.t==='str'?'<td data-c="'+c+'"><input maxlength="2" value="'+E(v)+'" oninput="cell(\''+t.id+'\','+r+','+c+',this.value)"></td>':
    '<td data-c="'+c+'"><button onclick="tg(\''+t.id+'\','+r+','+c+',this)">'+(v?(I.t==='dr'?'x':'●'):'')+'</button></td>'}
   h+='</tr>'});
  h+='</table></div></div>'}
 return h+'</div>'}
function cell(id,r,c,v){trk(id).d[r][c]=v.trim();touch()}
function tg(id,r,c,b){const T=trk(id),I=INST[T.inst];T.d[r][c]=T.d[r][c]?'':'1';b.textContent=T.d[r][c]?(I.t==='dr'?'x':'●'):'';touch();if(T.d[r][c])snd(T.inst,r,'1')}
function addCols(id){trk(id).d.forEach(r=>{for(let i=0;i<M;i++)r.push('')});touch();R()}
function dupM(id,m){trk(id).d.forEach(r=>r.splice((m+1)*M,0,...r.slice(m*M,m*M+M)));touch();R()}
function delM(id,m){const T=trk(id);if(T.d[0].length<=M)return;T.d.forEach(r=>r.splice(m*M,M));touch();R()}

/* ---------- Letra con acordes ---------- */
function letra(s){
 return '<div class="lbar no"><span>Seleccioná un fragmento de la letra para ponerle un acorde encima.</span><button class="b on" id="ab" disabled onclick="mAcorde()">♪ Agregar acorde</button></div>'+
 '<textarea id="ta" class="no" placeholder="Escribí o pegá la letra de la canción…" oninput="lyr(this)" onselect="sel()" onkeyup="sel()" onmouseup="sel()" ontouchend="sel()"></textarea>'+
 '<div class="pvh">Vista con acordes (tocá un acorde para editarlo o quitarlo)</div><div class="pv" id="pv">'+pv(s)+'</div>'}
function sel(){const ta=$('#ta'),b=$('#ab');if(ta&&b)b.disabled=ta.selectionStart===ta.selectionEnd}
function lyr(el){const s=song(),o=s.lyrics,n=el.value;let p=0;const mx=Math.min(o.length,n.length);
 while(p<mx&&o[p]===n[p])p++;
 let x=0;while(x<mx-p&&o[o.length-1-x]===n[n.length-1-x])x++;
 const oe=o.length-x,d=n.length-o.length;
 s.chords=s.chords.filter(c=>c.b<=p||c.a>=oe).map(c=>c.b<=p?c:{...c,a:c.a+d,b:c.b+d});
 s.lyrics=n;$('#pv').innerHTML=pv(s);touch()}
function pv(s){const tx=s.lyrics;if(!tx)return '';
 const cs=s.chords.map((c,i)=>({...c,i})).sort((a,b)=>a.a-b.a),L=[[]];let pos=0;
 const put=(str,ci)=>{str.split('\n').forEach((p,k)=>{if(k)L.push([]);if(p!==''){L[L.length-1].push({t:p,ci:ci});ci=null}})};
 cs.forEach(c=>{put(tx.slice(pos,c.a),null);put(tx.slice(c.a,c.b),c.i);pos=c.b});put(tx.slice(pos),null);
 return L.map(l=>'<div class="ln">'+(l.length?l.map(g=>'<span class="w'+(g.ci!=null?' k':'')+'"'+(g.ci!=null?' onclick="mAcorde('+g.ci+')"':'')+'><b>'+(g.ci!=null?E(s.chords[g.ci].c):'')+'</b><i>'+E(g.t)+'</i></span>').join(''):'&nbsp;')+'</div>').join('')}
function mAcorde(i){const s=song();let c='',tx='';
 if(i==null){const ta=$('#ta');pend={a:ta.selectionStart,b:ta.selectionEnd};if(pend.a===pend.b)return;tx=s.lyrics.slice(pend.a,pend.b)}
 else{pend={i};const k=s.chords[i];tx=s.lyrics.slice(k.a,k.b);c=k.c}
 mod('<h3>Acorde para “'+E(tx.length>40?tx.slice(0,40)+'…':tx)+'”</h3><input class="ed" id="ac" value="'+E(c)+'" placeholder="Ej: Am, C7, F#m" maxlength="12"><div class="qk">'+['C','D','E','F','G','A','B','Am','Dm','Em','Bm'].map(x=>'<button class="c" onclick="$(\'#ac\').value=\''+x+'\'">'+x+'</button>').join('')+'</div><div class="r">'+(i!=null?'<button class="b" onclick="rmAc('+i+')">Quitar</button>':'')+'<button class="b" onclick="mod()">Cancelar</button><button class="b on" onclick="svAc()">Guardar</button></div>');
 setTimeout(()=>{const e=$('#ac');if(e)e.focus()},0)}
function svAc(){const s=song(),v=$('#ac').value.trim();if(!v)return;
 if(pend.i!=null)s.chords[pend.i].c=v;
 else{s.chords=s.chords.filter(c=>c.b<=pend.a||c.a>=pend.b);s.chords.push({a:pend.a,b:pend.b,c:v})}
 s.chords.sort((x,y)=>x.a-y.a);touch();mod();R()}
function rmAc(i){song().chords.splice(i,1);touch();mod();R()}

/* ---------- Sonido (síntesis en el navegador, sin archivos externos) ---------- */
let AC,MB,NZ,KC={};
function ctx(){
 if(!AC){AC=new (window.AudioContext||window.webkitAudioContext)();
  const cp=AC.createDynamicsCompressor();cp.threshold.value=-14;cp.ratio.value=4;
  MB=AC.createGain();MB.gain.value=.9;MB.connect(cp);cp.connect(AC.destination);
  NZ=AC.createBuffer(1,AC.sampleRate*2,AC.sampleRate);const d=NZ.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}
 AC.resume();return AC}
/* Cuerda pulsada (Karplus-Strong): guitarra y bajo */
function pluck(L,dec,len){const key=L+'|'+dec;if(KC[key])return KC[key];
 const sr=AC.sampleRate,n=Math.floor(sr*len),b=AC.createBuffer(1,n,sr),o=b.getChannelData(0),ring=new Float32Array(L);
 let lp=0;for(let i=0;i<L;i++){lp=lp*.55+(Math.random()*2-1)*.45;ring[i]=lp}
 let p=0;for(let i=0;i<n;i++){const x=ring[p],y=ring[(p+1)%L];o[i]=x;ring[p]=(x+y)*.5*dec;p=(p+1)%L}
 return KC[key]=b}
function stringNote(k,f,t){const bass=k==='bajo',sr=AC.sampleRate,L=Math.max(2,Math.round(sr/f-.5)),
 b=pluck(L,bass?.9987:.9968,bass?2.8:2.2),s=AC.createBufferSource(),fl=AC.createBiquadFilter(),g=AC.createGain();
 s.buffer=b;s.playbackRate.value=f*(L+.5)/sr;fl.type='lowpass';fl.frequency.value=bass?850:4500;
 g.gain.setValueAtTime(bass?1.7:1.2,t);g.gain.linearRampToValueAtTime(0,t+b.duration);
 s.connect(fl);fl.connect(g);g.connect(MB);s.start(t)}
/* Piano: parciales con decaimiento distinto + golpe de martillo */
function pianoNote(f,t){const g=AC.createGain(),A=[1,.55,.36,.22,.13,.08,.04];g.connect(MB);
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.34,t+.006);g.gain.exponentialRampToValueAtTime(.001,t+2.6);
 A.forEach((a,i)=>{const m=i+1,o=AC.createOscillator(),h=AC.createGain();o.type='sine';o.frequency.value=f*m*(1+.0003*m*m);
  h.gain.setValueAtTime(a/2.4,t);h.gain.exponentialRampToValueAtTime(.0001,t+Math.max(.25,2.6/(1+i*.8)));
  o.connect(h);h.connect(g);o.start(t);o.stop(t+2.7)});
 noise(t,.025,'lowpass',2200,.1)}
function noise(t,dur,type,fr,vol){const s=AC.createBufferSource(),fl=AC.createBiquadFilter(),g=AC.createGain();
 s.buffer=NZ;fl.type=type;fl.frequency.value=fr;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);
 s.connect(fl);fl.connect(g);g.connect(MB);s.start(t,Math.random()*.4);s.stop(t+dur)}
function tone(t,f0,f1,dur,vol,type){const o=AC.createOscillator(),g=AC.createGain();o.type=type||'sine';
 o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+dur*.6);
 g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);g.connect(MB);o.start(t);o.stop(t+dur)}
/* Batería: filas CR, HH, SD, T1, BD */
function drum(r,t){
 if(r===0){noise(t,1.3,'highpass',6000,.32);noise(t,.5,'bandpass',9500,.14)}
 else if(r===1)noise(t,.06,'highpass',8000,.38);
 else if(r===2){noise(t,.2,'highpass',1800,.5);tone(t,230,150,.13,.4,'triangle')}
 else if(r===3)tone(t,210,90,.38,.75);
 else{tone(t,150,42,.5,1);noise(t,.02,'lowpass',3000,.3)}}
function snd(k,r,v){const c=ctx(),t=c.currentTime+.01,I=INST[k];
 if(I.t==='dr')return drum(r,t);
 if(I.t==='pn')return pianoNote(261.63*Math.pow(2,(11-r)/12),t);
 const n=parseInt(v);if(isNaN(n))return;stringNote(k,I.f[r]*Math.pow(2,n/12),t)}
function play(){const s=song();if(!s||!s.tracks.length)return;stop();col=0;
 timer=setInterval(()=>{const mx=Math.max(...s.tracks.map(t=>t.d[0].length));if(col>=mx){stop();return}
  document.querySelectorAll('td.p').forEach(x=>x.classList.remove('p'));
  document.querySelectorAll('td[data-c="'+col+'"]').forEach(x=>x.classList.add('p'));
  s.tracks.forEach(t=>t.d.forEach((row,r)=>{if(row[col])snd(t.inst,r,row[col])}));col++},60000/s.bpm/4)}
function stop(){clearInterval(timer);document.querySelectorAll('td.p').forEach(x=>x.classList.remove('p'))}

/* ---------- Guardar / cargar proyecto ---------- */
function exp(){const j=JSON.stringify(song());
 mod('<h3>Guardar proyecto</h3><p style="margin:0;color:var(--mut)">Copiá este contenido y guardalo en un archivo .json. Después podés volver a abrirlo con “+ cargar canción”.</p><textarea id="ex" readonly>'+E(j)+'</textarea><div class="r"><button class="b" onclick="mod()">Cerrar</button><button class="b on" onclick="$(\'#ex\').select();try{navigator.clipboard.writeText($(\'#ex\').value)}catch(e){document.execCommand(\'copy\')}">Copiar</button></div>')}
function imp(i){const f=i.files[0];if(!f)return;const r=new FileReader();
 r.onload=()=>{try{const s=JSON.parse(r.result);if(!s.tracks||!s.name)throw 0;mig(s);s.id=uid();s.by=s.by||S.user;s.u=Date.now();
  if(s.project&&!S.projects.includes(s.project))S.projects.push(s.project);S.songs.push(s);save();i.value='';openS(s.id)}
  catch(e){mod('<h3>No se pudo cargar</h3><p style="margin:0">El archivo no es una canción válida de esta aplicación.</p><div class="r"><button class="b" onclick="mod()">Cerrar</button></div>')}};
 r.readAsText(f)}

/* ---------- Render ---------- */
function R(){$('#app').innerHTML=!S.user?login():'<div class="app">'+side()+'<main>'+(view?editor():home())+'</main></div>';
 const ta=$('#ta');if(ta&&view){ta.value=song().lyrics}}
R();
