const $=s=>document.querySelector(s);

const E=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

const INST={
 guitarra:{n:'Guitarra',t:'str',rows:['e','B','G','D','A','E'],f:[329.63,246.94,196,146.83,110,82.41]},
 bajo:{n:'Bajo',t:'str',rows:['G','D','A','E'],f:[98,73.42,55,41.2]},
 bateria:{n:'Batería',t:'dr',rows:['CR','HH','SD','T1','BD'],f:[900,700,320,190,60]},
 piano:{n:'Piano',t:'pn',rows:['B','A#','A','G#','G','F#','F','E','D#','D','C#','C']}
};

let S={user:null,guest:false,projects:[],songs:[]},cur='',view=null,q='',tab='letra',ac,timer,col=0;

const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,5);

const mig=s=>{if(!Array.isArray(s.tracks))s.tracks=Object.entries(s.tracks).map(([k,T])=>({id:uid(),inst:k,n:INST[k].n,d:T.d}))};

const song=()=>S.songs.find(s=>s.id==view);

function save(){if(S.guest||!S.user)return;try{localStorage.setItem('tablab_'+S.user,JSON.stringify(S));localStorage.setItem('tablab_last',S.user)}catch(e){}}

function touch(){const s=song();if(s)s.u=Date.now();save()}

function mod(h){$('#m').innerHTML=h?'<div class="ov"><div class="md">'+h+'</div></div>':''}

function login(){let l='';try{l=localStorage.getItem('tablab_last')||''}catch(e){}
 return '<div class="login"><div class="md"><h3>Tablaturas · beta</h3><input class="ed" id="ln" placeholder="Tu nombre de usuario" value="'+E(l)+'"><button class="b on" onclick="enter()">Iniciar sesión</button><button class="b" onclick="gMod()">Continuar con Google</button><button class="b" onclick="guest()">Modo invitado</button><small style="color:var(--mut)">En esta beta las cuentas se guardan solo en este navegador. En modo invitado no se guarda nada: descargá tu proyecto antes de salir.</small></div></div>'}

function enter(){go($('#ln').value.trim())}

function gMod(){mod('<h3>Continuar con Google</h3><p style="margin:0;color:var(--mut)">El acceso real con Google necesita un servidor propio y una credencial de Google, que se conectan cuando la app tenga base de datos. Por ahora podés entrar con tu correo como usuario local, sin verificación.</p><input class="ed" id="ge" type="email" placeholder="tucorreo@gmail.com"><div class="r"><button class="b" onclick="mod()">Cancelar</button><button class="b on" onclick="go($(\'#ge\').value.trim())">Continuar</button></div>')}

function go(u){if(!u)return;

let d=null;try{d=JSON.parse(localStorage.getItem('tablab_'+u))}catch(e){}
 S=d&&d.songs?d:{user:u,guest:false,projects:[],songs:[]};S.user=u;S.guest=false;S.songs.forEach(mig);save();mod();R()}

function guest(){S={user:'Invitado',guest:true,projects:[],songs:[]};R()}

function out(){stop();view=null;cur='';S={user:null,songs:[],projects:[]};R()}

function side(){const r=[...S.songs].sort((a,b)=>(b.u||0)-(a.u||0)).slice(0,8);
 return '<aside><div class="user"><div class="av">'+E(S.user[0].toUpperCase())+'</div><div>'+E(S.user)+'<br><a style="cursor:pointer;color:var(--mut);font-size:12px" onclick="out()">Salir</a></div></div>'+
 '<button class="b" onclick="document.getElementById(\'fi\').click()">+ cargar canción</button><button class="b" onclick="mNew()">+ crear canción</button>'+
 '<div class="rec"><p>Canciones recientes</p>'+(r.length?r.map(s=>'<a onclick="openS(\''+s.id+'\')">'+E(s.name)+'</a>').join(''):'<span style="color:var(--mut)">Todavía no hay canciones.</span>')+'</div></aside>'}

function chips(){return '<div class="top"><button class="b '+(cur===''?'on':'')+'" onclick="cur=\'\';R()">Todos los proyectos</button>'+S.projects.map(p=>'<button class="b '+(cur===p?'on':'')+'" onclick="cur=this.dataset.p;R()" data-p="'+E(p)+'">'+E(p)+'</button>').join('')+'<button class="b" onclick="mProj()">+ proyecto</button></div>'}

function cards(){const l=S.songs.filter(s=>(!cur||s.project===cur)&&(s.name+' '+s.project).toLowerCase().includes(q.toLowerCase()));
 if(!l.length)return '<p class="empty">No hay canciones para mostrar. Creá una con “+ crear canción” o cargá un archivo.</p>';
 return l.map(s=>'<div class="card" style="--c:'+(s.cover?'url('+s.cover+')':'none')+'" onclick="openS(\''+s.id+'\')"><div class="t"><b>“'+E(s.name)+'”</b><span>-'+E(s.by)+'</span><span>-'+E(s.project||'sin proyecto')+'</span></div><div class="ic">'+s.tracks.map(t=>t.n).join(' · ')+' · '+s.bpm+' bpm</div></div>').join('')}

function home(){return chips()+'<div class="pad"><div class="srch"><input placeholder="Buscar…" value="'+E(q)+'" oninput="q=this.value;$(\'#g\').innerHTML=cards()"></div><div class="grid" id="g">'+cards()+'</div></div>'}

function mk(inst,n){return Array.from({length:INST[inst].rows.length},()=>Array(n).fill(''))}

function mProj(){mod('<h3>Nuevo proyecto</h3><input class="ed" id="pn" placeholder="Banda, orquesta o proyecto"><div class="r"><button class="b" onclick="mod()">Cancelar</button><button class="b on" onclick="addP()">Crear</button></div>')}

function addP(){const p=$('#pn').value.trim();if(!p)return;if(!S.projects.includes(p))S.projects.push(p);cur=p;save();mod();R()}

function mNew(){mod('<h3>Crear composición</h3><input class="ed" id="nn" placeholder="Nombre de la canción"><select class="ed" id="np"><option value="">Sin proyecto</option>'+S.projects.map(p=>'<option '+(p===cur?'selected':'')+'>'+E(p)+'</option>').join('')+'</select><div class="ck">'+Object.keys(INST).map(k=>'<label>'+INST[k].n+' <input class="ed" type="number" min="0" max="8" value="0" data-k="'+k+'" style="width:56px"></label>').join('')+'</div><label>BPM <input class="ed" id="nb" type="number" value="120" min="30" max="300" style="width:90px"></label><div class="r"><button class="b" onclick="mod()">Cancelar</button><button class="b on" onclick="create()">Crear</button></div>')}

function create(){const n=$('#nn').value.trim()||'Sin título',ks=[];document.querySelectorAll('.ck input').forEach(i=>{const c=+i.value||0;for(let j=1;j<=c;j++)ks.push([i.dataset.k,c>1?j:0])});if(!ks.length){$('.ck').style.outline='1px solid var(--acc)';return}
 const s={id:uid(),name:n,by:S.user,project:$('#np').value,bpm:+$('#nb').value||120,cover:'',lyrics:'',tracks:[],u:Date.now()};ks.forEach(([k,j])=>s.tracks.push({id:uid(),inst:k,n:INST[k].n+(j?' '+j:''),d:mk(k,16)}));
 S.songs.push(s);save();mod();openS(s.id)}

function openS(id){stop();view=id;tab='letra';mod();R()}

function cover(f){if(!f)return;

const r=new FileReader();r.onload=()=>{const i=new Image();i.onload=()=>{const c=document.createElement('canvas');c.width=c.height=400;

const m=Math.min(i.width,i.height);c.getContext('2d').drawImage(i,(i.width-m)/2,(i.height-m)/2,m,m,0,0,400,400);song().cover=c.toDataURL('image/jpeg',.7);touch();R()};i.src=r.result};r.readAsDataURL(f)}

function editor(){const s=song();if(tab!=='letra'&&!s.tracks.some(x=>x.id===tab))tab='letra';

const t=s.tracks.find(x=>x.id===tab);

const ch='<button class="c '+(tab==='letra'?'on':'')+'" onclick="tab=\'letra\';R()">Letra</button>'+s.tracks.map(x=>'<button class="c '+(x.id===tab?'on':'')+'" onclick="tab=\''+x.id+'\';R()">'+E(x.n)+'</button>').join('')+'<button class="c no" onclick="mInst()">+ instrumento</button><span class="bpm">'+s.bpm+' bpm</span>';

const body=t?'<h3 style="margin-top:0">'+E(t.n)+'</h3>'+grid(t)+'<div class="no" style="display:flex;gap:8px;margin-top:10px"><button class="b" onclick="addCols(\''+t.id+'\')">+ compás</button><button class="b" onclick="delT(\''+t.id+'\')">Quitar instrumento</button></div>':'<textarea class="no" oninput="song().lyrics=this.value;touch()" placeholder="Escribí los acordes en la línea de arriba de cada verso:\n\n   Am         G\nLetra de la canción…">'+E(s.lyrics)+'</textarea>';
 return '<div class="top no"><button class="b" onclick="stop();view=null;R()">Página</button><span style="flex:1"></span><button class="b on" onclick="play()">▶ Reproducir</button><button class="b" onclick="stop()">■</button><button class="b" onclick="window.print()">PDF</button><button class="b" onclick="exp()">Guardar proyecto</button></div><div class="pad"><div class="hd"><div class="cv" style="background-image:'+(s.cover?'url('+s.cover+')':'none')+'"></div><div><h2>“'+E(s.name)+'” - '+E(s.project||'sin banda')+' <button class="pen no" onclick="mEdit()" title="Editar">✎</button></h2><div class="chips">'+ch+'</div></div></div>'+body+'</div>'}

function grid(t){const I=INST[t.inst];

let h='<div class="sc"><table class="tb">';
 t.d.forEach((row,r)=>{h+='<tr><th>'+I.rows[r]+'</th>';row.forEach((v,c)=>{const bar=c%8==7?' bar':'';
  h+=I.t==='str'?'<td class="'+bar+'" data-c="'+c+'"><input maxlength="2" value="'+E(v)+'" oninput="cell(\''+t.id+'\','+r+','+c+',this.value)"></td>':'<td class="'+bar+'" data-c="'+c+'"><button onclick="tg(\''+t.id+'\','+r+','+c+',this)">'+(v?(I.t==='dr'?'x':'●'):'')+'</button></td>'});h+='</tr>'});
 return h+'</table></div>'}
const trk=id=>song().tracks.find(t=>t.id===id);

function cell(id,r,c,v){trk(id).d[r][c]=v.trim();touch()}

function tg(id,r,c,b){const T=trk(id),I=INST[T.inst];T.d[r][c]=T.d[r][c]?'':'1';b.textContent=T.d[r][c]?(I.t==='dr'?'x':'●'):'';touch();if(T.d[r][c])snd(T.inst,r,'1')}

function addCols(id){trk(id).d.forEach(r=>{for(let i=0;i<8;i++)r.push('')});touch();R()}

function delT(id){mod('<h3>Quitar instrumento</h3><p style="margin:0">Se borra su tablatura de esta canción. ¿Querés continuar?</p><div class="r"><button class="b" onclick="mod()">Cancelar</button><button class="b on" onclick="rmT(\''+id+'\')">Quitar</button></div>')}

function rmT(id){const s=song();s.tracks=s.tracks.filter(t=>t.id!==id);tab='letra';touch();mod();R()}

function mInst(){mod('<h3>Agregar instrumento</h3><select class="ed" id="ni">'+Object.keys(INST).map(k=>'<option value="'+k+'">'+INST[k].n+'</option>').join('')+'</select><div class="r"><button class="b" onclick="mod()">Cancelar</button><button class="b on" onclick="addT()">Agregar</button></div>')}

function addT(){const s=song(),k=$('#ni').value,c=s.tracks.filter(t=>t.inst===k).length,id=uid();s.tracks.push({id,inst:k,n:INST[k].n+(c?' '+(c+1):''),d:mk(k,16)});tab=id;touch();mod();R()}

function mEdit(){const s=song();mod('<h3>Editar composición</h3><input class="ed" id="en" value="'+E(s.name)+'" placeholder="Título"><select class="ed" id="ep"><option value="">Sin banda</option>'+S.projects.map(p=>'<option '+(p===s.project?'selected':'')+'>'+E(p)+'</option>').join('')+'</select><label>BPM <input class="ed" id="eb" type="number" min="30" max="300" value="'+s.bpm+'" style="width:90px"></label><label class="b" style="text-align:center">Cambiar tapa del disco<input type="file" accept="image/*" hidden onchange="cover(this.files[0])"></label><div class="r"><button class="b" onclick="mod()">Cancelar</button><button class="b on" onclick="saveE()">Guardar</button></div>')}

function saveE(){const s=song();s.name=$('#en').value.trim()||s.name;s.project=$('#ep').value;s.bpm=+$('#eb').value||120;touch();mod();R()}

function snd(k,r,v){if(!ac)ac=new (window.AudioContext||window.webkitAudioContext)();ac.resume();

const I=INST[k],t=ac.currentTime;

let f,ty='triangle',d=.5;
 if(I.t==='str'){const n=parseInt(v);if(isNaN(n))return;f=I.f[r]*Math.pow(2,n/12);if(k==='bajo')ty='sine'}
 else if(I.t==='pn'){f=261.63*Math.pow(2,(11-r)/12);ty='sine';d=.8}
 else{f=I.f[r];ty=r<=1?'square':'sine';d=r<=1?.08:.2}
 const o=ac.createOscillator(),g=ac.createGain();o.type=ty;o.frequency.value=f;if(I.t==='dr'&&r>=3)o.frequency.exponentialRampToValueAtTime(f*.4,t+d);
 g.gain.setValueAtTime(.18,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d)}

function play(){const s=song();if(!s||!s.tracks.length)return;stop();col=0;
 timer=setInterval(()=>{const mx=Math.max(...s.tracks.map(t=>t.d[0].length));if(col>=mx){stop();return}
  document.querySelectorAll('td.p').forEach(x=>x.classList.remove('p'));document.querySelectorAll('td[data-c="'+col+'"]').forEach(x=>x.classList.add('p'));
  s.tracks.forEach(t=>t.d.forEach((row,r)=>{if(row[col])snd(t.inst,r,row[col])}));col++},60000/s.bpm/4)}

function stop(){clearInterval(timer);document.querySelectorAll('td.p').forEach(x=>x.classList.remove('p'))}

function exp(){const j=JSON.stringify(song());
 mod('<h3>Guardar proyecto</h3><p style="margin:0;color:var(--mut)">Copiá este contenido y guardalo en un archivo .json. Después podés volver a abrirlo con “+ cargar canción”.</p><textarea id="ex" style="min-height:140px" readonly>'+E(j)+'</textarea><div class="r"><button class="b" onclick="mod()">Cerrar</button><button class="b on" onclick="$(\'#ex\').select();try{navigator.clipboard.writeText($(\'#ex\').value)}catch(e){document.execCommand(\'copy\')}">Copiar</button></div>')}

function imp(i){const f=i.files[0];if(!f)return;

const r=new FileReader();r.onload=()=>{try{const s=JSON.parse(r.result);if(!s.tracks||!s.name)throw 0;mig(s);s.id=uid();s.by=s.by||S.user;s.u=Date.now();if(s.project&&!S.projects.includes(s.project))S.projects.push(s.project);S.songs.push(s);save();i.value='';openS(s.id)}catch(e){mod('<h3>No se pudo cargar</h3><p style="margin:0">El archivo no es una canción válida de esta aplicación.</p><div class="r"><button class="b" onclick="mod()">Cerrar</button></div>')}};r.readAsText(f)}

function R(){$('#app').innerHTML=!S.user?login():'<div class="app">'+side()+'<main>'+(view?editor():home())+'</main></div>'}
R();
