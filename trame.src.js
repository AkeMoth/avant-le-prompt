/* ============ TRAME · export autonome · Le Dernier Clic ============ */
/* Les données (CH, TRAME, INTRU, SVGS, EPI) et les toasts sont injectés
   depuis index.html par build-trame.js : ne pas les redéfinir ici. */

const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const anglesFor=id=>id==="epilogue"?EPI.angles:(CH.find(c=>c.id===id)||{angles:[]}).angles;

/* ---------- État ---------- */
/* Clé distincte de "alp-state" : l'export ne touche pas à la partie en cours. */
const EKEY="alp-trame-export";
let E={mode:"complete",verified:false,checked:false};
let saveT=null;
function save(){
  clearTimeout(saveT);
  saveT=setTimeout(async()=>{
    const data=JSON.stringify(E);
    if(window.storage&&window.storage.set){try{await window.storage.set(EKEY,data);}catch(e){}}
    try{localStorage.setItem(EKEY,data);}catch(e){}
  },400);
}
async function load(){
  let raw=null;
  if(window.storage&&window.storage.get){
    try{const r=await window.storage.get(EKEY);if(r&&r.value)raw=r.value;}catch(e){}
  }
  if(!raw){try{raw=localStorage.getItem(EKEY);}catch(e){}}
  if(raw){try{const p=JSON.parse(raw);if(p&&typeof p==="object")E=Object.assign(E,p);}catch(e){}}
}

/* ---------- Rendu ---------- */
function angleList(label,arr){
  if(!arr||!arr.length)return "";
  return `<div class="tang"><span class="tang-l">${esc(label)}</span><ul>${arr.map(a=>`<li>${esc(a.txt)}</li>`).join("")}</ul></div>`;
}
/* Les angles nourrissent la préparation, pas le direct : en essentielle on ne
   garde que le teaser sécurité, qui est un vrai segment de fin d'épisode. */
function trameLines(sec,ess){
  let out="";
  if(sec.ch&&!ess)out+=angleList("Angles à dérouler",anglesFor(sec.ch));
  if(sec.t==="Mot de la fin")out+=angleList("Teaser sécurité (épisode à venir)",INTRU.angles);
  return out;
}
function memoOf(sec){
  if(!sec.fig||!SVGS[sec.fig])return "";
  return `<div class="tmemo"><div class="tmemo-l">Mémo</div>${SVGS[sec.fig].svg}<div class="tmemo-c">${esc(SVGS[sec.fig].cap)}</div></div>`;
}
function trameView(){
  const ess=E.mode==="essentielle";
  let out=`<div class="card"><div class="eyebrow">La trame de l'épisode</div>
  <h2>59 minutes, 9 blocs</h2>
  <p class="small">Version finale, prête pour l'antenne. Les ${TRAME.length} sections sont là, schémas compris.</p>`;
  if(E.verified){
    out+=`<div class="tmode"><span class="tmode-l">Version</span>
      <button class="tmodebtn ${ess?"":"on"}" data-a="tmode" data-id="complete">Complète</button>
      <button class="tmodebtn ${ess?"on":""}" data-a="tmode" data-id="essentielle">Essentielle</button></div>
      <p class="mut small" style="margin-top:2px">${ess?"Version direct : les points clés à dérouler, schémas gardés.":"Version détaillée : tout le contenu, pour la préparation."}</p>`;
  }
  out+=`</div>`;
  TRAME.forEach(sec=>{
    const memo=memoOf(sec);
    if(ess){
      const keys=sec.key?`<ul class="tpoints">${sec.key.map(k=>`<li>${esc(k)}</li>`).join("")}</ul>`:"";
      const exb=sec.ex?`<div class="tex">
        <div class="tex-row ko"><span class="tex-l">mal fait</span>${esc(sec.ex.ko)}</div>
        <div class="tex-row ok"><span class="tex-l">bien fait</span>${esc(sec.ex.ok)}</div>
      </div>`:"";
      out+=`<div class="tsec ess"><div class="ttime">${sec.at} · ${sec.dur}</div><h3>${esc(sec.t)}</h3>${memo}${keys}${exb}${trameLines(sec,true)}</div>`;
    }else{
      const pts=sec.points?`<ul class="tpoints">${sec.points.map(p=>typeof p==="string"?`<li>${esc(p)}</li>`:`<li class="timage"><span class="tim-l">l'image</span> ${esc(p.img)}</li>`).join("")}</ul>`:"";
      out+=`<div class="tsec"><div class="ttime">${sec.at} · ${sec.dur}</div><h3>${esc(sec.t)}</h3><div class="tdesc">${esc(sec.desc)}</div>${memo}${pts}${trameLines(sec,false)}</div>`;
    }
  });
  if(!E.verified){
    out+=`<div class="card captcha">
      <div class="cap-head"><span class="cap-logo">reCLIC</span><span class="cap-sub">vérification humaine · v2</span></div>
      <button class="cap-check ${E.checked?"ticked":""}" data-a="mcaptcha"><span class="cap-box">${E.checked?"✓":""}</span><span>Je ne suis pas quelqu'un d'autre que Manu</span></button>
      <div class="cap-foot">Protégé par le lapin. Confidentialité douteuse.</div>
    </div>`;
  }
  if(E.checked&&!E.verified){
    out+=`<div class="modal" data-a="mclose"><div class="modalbox" data-a="keep">
      <div class="eyebrow">Vérification supplémentaire</div>
      <p style="font-weight:600;margin-bottom:12px">Si tu prétends vraiment être la personne que tu prétends être, qu'est-ce que le vrai Manu choisirait ici :</p>
      <div class="opts">
        <button class="opt" data-a="mverify" data-o="0">Un lion électrique</button>
        <button class="opt" data-a="mverify" data-o="1">Un poulpe alien</button>
        <button class="opt" data-a="mverify" data-o="2">Des insectes (juste histoire de montrer que ça existe)</button>
      </div>
      <div class="cap-foot" style="margin-top:12px">Une seule bonne réponse. Le lapin adulte regarde.</div>
    </div></div>`;
  }
  return out;
}
function render(){
  const sc=$("scroller");
  const y=sc?sc.scrollTop:0;
  $("app").innerHTML=trameView();
  if(sc)sc.scrollTo(0,y);
  armSchemaAnim();
}

/* ---------- Animation des schémas ---------- */
/* Écouteur de scroll plutôt qu'IntersectionObserver : l'observer ne se
   déclenche pas dans tous les navigateurs de prévisualisation. Les relances
   après fonts.ready rattrapent le reflow des polices web. */
let schemaScrollBound=false;
function revealSchemas(){
  const sc=$("scroller");if(!sc)return;
  const h=sc.clientHeight;
  document.querySelectorAll(".tmemo svg:not(.drawn)").forEach(s=>{
    if(s.getBoundingClientRect().top<h*0.9)s.classList.add("drawn");
  });
}
function armSchemaAnim(){
  const sc=$("scroller");if(!sc)return;
  if(!schemaScrollBound){
    sc.addEventListener("scroll",revealSchemas,{passive:true});
    window.addEventListener("load",revealSchemas);
    if(document.fonts&&document.fonts.ready)document.fonts.ready.then(revealSchemas);
    schemaScrollBound=true;
  }
  requestAnimationFrame(revealSchemas);
  setTimeout(revealSchemas,160);setTimeout(revealSchemas,520);
}

/* ---------- Actions ---------- */
const A={
 tmode(id){E.mode=id;save();render();},
 mcaptcha(){E.checked=!E.checked;save();render();},
 keep(){},
 mclose(){E.checked=false;save();render();},
 mverify(id,t){
  const o=parseInt(t.dataset.o,10);
  if(o===1){
   E.verified=true;E.checked=false;E.mode="essentielle";save();render();
   toast("Identité confirmée : un poulpe alien, évidemment. Trame essentielle débloquée, à toi le mode direct.");
  }else{
   E.checked=false;save();render();
   toast(o===0?"Un lion électrique ? Le vrai Manu n'a jamais dit ça. Recommence, imposteur.":"Des insectes, tentative notée. Mais non : le vrai Manu sait ce qu'il choisit.");
  }
 }
};
document.addEventListener("click",e=>{
  const t=e.target.closest("[data-a]");if(!t)return;
  const ds=t.dataset,hadFocus=document.activeElement===t;
  const fn=A[ds.a];if(fn)fn(ds.id,t);
  if(hadFocus&&document.activeElement===document.body){
    let q='[data-a="'+ds.a+'"]';
    if(ds.id)q+='[data-id="'+ds.id+'"]';
    if(ds.o!=null)q+='[data-o="'+ds.o+'"]';
    const el=document.querySelector(q);
    if(el&&!el.disabled)el.focus({preventScroll:true});
  }
});

/* ---------- Init ---------- */
(async()=>{await load();render();})();
