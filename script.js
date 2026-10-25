/* ═══════════════════════════════════════════
   HENDEL WORLD — script.js
   Particles · Audio · Ticker · Roulette · Modal
   ═══════════════════════════════════════════ */

const S = { sound:true, discount:0, promo:'', product:{name:'',price:0,id:''}, spinning:false, ctx:null };

// ── AUDIO ──
function initAudio(){
  if(S.ctx){if(S.ctx.state==='suspended')S.ctx.resume();return}
  const A=window.AudioContext||window.webkitAudioContext;if(A)S.ctx=new A();
}
function tone(f,t,d,v=.12){
  if(!S.sound||!S.ctx)return;
  try{const o=S.ctx.createOscillator(),g=S.ctx.createGain();
  o.type=t;o.frequency.value=f;g.gain.setValueAtTime(v,S.ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(.0001,S.ctx.currentTime+d);
  o.connect(g);g.connect(S.ctx.destination);o.start();o.stop(S.ctx.currentTime+d)}catch(_){}
}
function playClick(){tone(600,'sine',.08,.14);setTimeout(()=>tone(880,'triangle',.06,.1),30)}
function playTick(){tone(320,'square',.03,.06)}
function playWin(){[523,659,784,1047].forEach((f,i)=>setTimeout(()=>tone(f,'triangle',.3,.2),i*110))}
function playOk(){[440,659,880].forEach((f,i)=>setTimeout(()=>tone(f,'triangle',.25,.18),i*85))}
function toggleSound(){
  initAudio();S.sound=!S.sound;
  const b=document.getElementById('sndBtn');if(b)b.textContent=S.sound?'🔊':'🔇';
  showToast(S.sound?'Звук включён 🔊':'Звук выключен 🔇');
  if(S.sound)playClick();
}

// ── PARTICLES ──
(function(){
  const c=document.getElementById('cvs');if(!c)return;
  const x=c.getContext('2d');let W,H,P=[];
  const N=50,C=['rgba(232,160,32,','rgba(255,120,0,','rgba(229,62,62,','rgba(0,201,232,'];
  function sz(){W=c.width=innerWidth;H=c.height=innerHeight}
  function mk(ry){return{x:Math.random()*W,y:ry?Math.random()*H:H+5,r:Math.random()*2.2+.7,
    vy:Math.random()*.9+.35,vx:(Math.random()-.5)*.6,op:Math.random()*.55+.2,
    sw:Math.random()*Math.PI*2,ss:Math.random()*.018+.008,
    col:C[Math.floor(Math.random()*C.length)]}}
  sz();for(let i=0;i<N;i++)P.push(mk(true));
  addEventListener('resize',sz);
  (function loop(){
    x.clearRect(0,0,W,H);
    for(let i=0;i<P.length;i++){
      const p=P[i];p.y-=p.vy;p.sw+=p.ss;p.x+=Math.sin(p.sw)*.5+p.vx;
      x.beginPath();x.arc(p.x,p.y,p.r,0,Math.PI*2);
      x.fillStyle=p.col+p.op+')';x.shadowBlur=p.r*4;x.shadowColor=p.col+'.6)';x.fill();
      if(p.y<-8||p.x<-8||p.x>W+8)P[i]=mk(false);
    }
    requestAnimationFrame(loop);
  })();
})();

// ── TICKER ──
const BUYS=[
  {nick:'DarkKnight_77',item:'INFINITY',tag:'∞',col:'#ec4899',ago:'1 мин'},
  {nick:'Mr_Creeper99',item:'ASTRA',tag:'★ASTRA',col:'#00c9e8',ago:'3 мин'},
  {nick:'VortexPvP',item:'Гнев Гиганта',tag:'АРТЕФАКТ',col:'#e53e3e',ago:'5 мин'},
  {nick:'Stealther',item:'Донат-Кейс x5',tag:'КЕЙС',col:'#e8a020',ago:'7 мин'},
  {nick:'AlexPro_GG',item:'2.5M монет',tag:'МОНЕТЫ',col:'#fbbf24',ago:'9 мин'},
  {nick:'Shadow_Lord',item:'HENDEL',tag:'HENDEL',col:'#e8a020',ago:'12 мин'},
  {nick:'M3gaDestroyer',item:'DRAGON',tag:'DRAGON',col:'#b794f4',ago:'15 мин'},
];
function initTicker(){
  const el=document.getElementById('ttrack');if(!el)return;
  const d=[...BUYS,...BUYS];
  el.innerHTML=d.map(p=>`<div class="t">Игрок <b>${p.nick}</b> купил <span class="t-badge" style="border-color:${p.col};color:${p.col}">${p.tag}</span> ${p.item} <span class="t-time">· ${p.ago}</span></div>`).join('');
}

// ── TIMER ──
function startTimer(){
  let s=4*3600+18*60+32;const el=document.getElementById('promoTimer');if(!el)return;
  setInterval(()=>{s=s>0?s-1:12*3600;
    el.textContent=[Math.floor(s/3600),Math.floor(s%3600/60),s%60].map(v=>String(v).padStart(2,'0')).join(':');
  },1000);
}

// ── SKIN ──
let skT=null;
function updateSkin(v){
  clearTimeout(skT);skT=setTimeout(()=>{
    const n=v.trim(),img=document.getElementById('heroSkin'),lbl=document.getElementById('heroNick');
    if(n.length>=3){if(img)img.src=`https://mc-heads.net/body/${n}/right`;if(lbl)lbl.textContent=n}
    else if(!n){if(img)img.src='https://mc-heads.net/body/Saanimaing/right';if(lbl)lbl.textContent='Saanimaing'}
  },380);
}
function applyNick(){
  playClick();const n=document.getElementById('quickNick')?.value.trim();
  if(!n){showToast('Введи свой ник!');return}
  showToast(`Ник ${n} принят! Листай в магазин ⬇`);
  document.getElementById('shop')?.scrollIntoView({behavior:'smooth'});
}

// ── TABS ──
function switchTab(cat,btn){
  playClick();
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('on'));
  if(btn)btn.classList.add('on');
  document.querySelectorAll('#cardGrid .card').forEach(c=>{
    c.style.display=c.dataset.cat===cat?'flex':'none';
  });
}

// ── PROMO ──
const CODES={HENDEL:.20,GRIEF2026:.15,START:.10,YOUTUBE:.15};
function applyPromo(){
  playClick();const code=(document.getElementById('promoInput')?.value||'').trim().toUpperCase();
  const msg=document.getElementById('promoRes');
  if(!code){msg.innerHTML='<span style="color:#fc8181">Введите промокод!</span>';return}
  if(CODES[code]){
    S.discount=CODES[code];S.promo=code;const pct=Math.round(S.discount*100);
    msg.innerHTML=`<span style="color:#68d391">✓ Промокод <b>${code}</b> — скидка −${pct}%!</span>`;
    playOk();recalc();showToast(`Скидка −${pct}% применена!`);
  }else{msg.innerHTML='<span style="color:#fc8181">Неверный промокод!</span>'}
}
function recalc(){
  document.querySelectorAll('.p-now[data-base]').forEach(el=>{
    const b=parseFloat(el.dataset.base);if(isNaN(b))return;
    el.innerHTML=`${Math.max(1,Math.round(b*(1-S.discount)))} <em>₽</em>`;
  });
}

// ── ROULETTE ──
const POOL=[
  {l:'DREAM',c:'r-dream',i:'🌱'},{l:'RICH',c:'r-rich',i:'💰'},
  {l:'DRAGON',c:'r-dragon',i:'🐉'},{l:'HENDEL',c:'r-hendel',i:'⭐'},
  {l:'ASTRA',c:'r-astra',i:'🌌'},{l:'INFINITY',c:'r-inf',i:'👑'}
];
let RI=[];
function pick(){const r=Math.random()*100;if(r<40)return POOL[0];if(r<68)return POOL[1];if(r<86)return POOL[2];if(r<94)return POOL[3];if(r<99)return POOL[4];return POOL[5]}
function buildRoulette(){
  const t=document.getElementById('rlTrack');if(!t)return;
  RI=Array.from({length:60},()=>pick());
  t.innerHTML=RI.map((it,i)=>`<div class="rl-item ${it.c}" data-i="${i}"><div class="rl-icon">${it.i}</div><div class="rl-name">${it.l}</div></div>`).join('');
}
function spinRoulette(){
  if(S.spinning)return;S.spinning=true;initAudio();playClick();
  const t=document.getElementById('rlTrack'),b=document.getElementById('spinBtn'),r=document.getElementById('spinRes'),vp=document.querySelector('.rl-vp');
  if(!t||!b)return;
  b.disabled=true;b.style.opacity='.5';
  r.classList.remove('won');r.textContent='🎰 Крутится...';
  t.style.transition='none';t.style.transform='translateX(0)';void t.offsetWidth;
  const idx=Math.floor(Math.random()*10)+45,win=RI[idx],iw=120,vpw=vp?vp.offsetWidth:800;
  const off=idx*iw+iw/2-vpw/2;
  t.style.transition='transform 5.5s cubic-bezier(.08,.8,.18,1)';
  t.style.transform=`translateX(-${off}px)`;
  let tk=0;const ti=setInterval(()=>{playTick();if(++tk>32)clearInterval(ti)},130);
  setTimeout(()=>{
    S.spinning=false;b.disabled=false;b.style.opacity='1';
    r.classList.add('won');r.innerHTML=`🎉 Выпало: <b>${win.l}</b>! Открой кейс в игре!`;
    playWin();showToast(`${win.i} ${win.l} — крути в игре за реал!`);
    setTimeout(buildRoulette,2000);
  },5700);
}

// ── MODAL ──
function openModal(name,base,id){
  playClick();initAudio();
  const price=Math.max(1,Math.round(base*(1-S.discount)));
  S.product={name,price,id};
  document.getElementById('mName').textContent=name;
  document.getElementById('mPrice').textContent=price+' ₽';
  document.getElementById('mBtnPrice').textContent=price+' ₽';
  const qn=document.getElementById('quickNick')?.value.trim();
  const ni=document.getElementById('mNick');
  if(qn&&ni){ni.value=qn;updateAvatar(qn)}else updateAvatar('');
  document.getElementById('modalOverlay').classList.add('open');
  setTimeout(()=>ni?.focus(),220);
}
function closeModal(){playClick();document.getElementById('modalOverlay').classList.remove('open')}
let avT=null;
function updateAvatar(v){clearTimeout(avT);avT=setTimeout(()=>{
  const n=v.trim(),img=document.getElementById('mAvatar');if(!img)return;
  img.src=n.length>=3?`https://mc-heads.net/avatar/${n}`:'https://mc-heads.net/avatar/Steve';
},300)}
function initPay(){
  document.querySelectorAll('.pay-opt').forEach(o=>{
    o.addEventListener('click',()=>{
      document.querySelectorAll('.pay-opt').forEach(x=>x.classList.remove('sel'));
      o.classList.add('sel');const r=o.querySelector('input[type=radio]');if(r)r.checked=true;playClick();
    });
  });
}
function submitPayment(){
  playClick();const nick=document.getElementById('mNick')?.value.trim();
  if(!nick){showToast('Укажи ник!');document.getElementById('mNick')?.focus();return}
  if(nick.length<3||nick.length>16||!/^[A-Za-z0-9_]+$/.test(nick)){showToast('Ник: 3–16 латиница/цифры/_');return}
  const gw=document.getElementById('gwSel')?.value;
  if(gw==='demo'){playOk();closeModal();showToast(`✅ ДЕМО: ${S.product.name} выдан игроку ${nick}!`);return}
  showToast('Перенаправление...');
  fetch('http://localhost:3000/api/create-payment',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({nickname:nick,itemId:S.product.id,price:S.product.price,gateway:gw,promo:S.promo})
  }).then(r=>r.json()).then(d=>{if(d.paymentUrl)location.href=d.paymentUrl;else fb(gw,nick)}).catch(()=>fb(gw,nick));
}
function fb(gw,nick){setTimeout(()=>alert(`[${gw.toUpperCase()}]\nСумма: ${S.product.price} ₽\nИгрок: ${nick}\nТовар: ${S.product.name}\n\nНастройте API-ключи в website/server.js!`),300)}

// ── UTILS ──
function copyIP(){
  playClick();const ip=document.getElementById('srv-ip')?.textContent||'play.hendelworld.net';
  navigator.clipboard.writeText(ip).then(()=>showToast(`✓ IP ${ip} скопирован!`)).catch(()=>showToast(`IP: ${ip}`));
}
let toastT=null;
function showToast(m){
  const el=document.getElementById('toast'),t=document.getElementById('toastMsg');
  if(!el||!t)return;t.textContent=m;el.classList.add('show');
  clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('show'),3800);
}
addEventListener('click',e=>{if(e.target.id==='modalOverlay')closeModal()});
addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});

// ── SCROLL REVEAL ──
function initReveal(){
  const obs=new IntersectionObserver((entries)=>{
    entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target)}});
  },{threshold:.12});
  document.querySelectorAll('.card,.feat,.about-card,.rule-card,.spin-box').forEach(el=>{
    el.style.opacity='0';el.style.transform='translateY(24px)';
    el.style.transition='opacity .5s ease,transform .5s ease';
    obs.observe(el);
  });
}
// Add CSS class dynamically
const st=document.createElement('style');
st.textContent='.visible{opacity:1!important;transform:translateY(0)!important}';
document.head.appendChild(st);

// ── INIT ──
document.addEventListener('DOMContentLoaded',()=>{
  initTicker();startTimer();buildRoulette();initPay();initReveal();
  document.addEventListener('click',initAudio,{once:true});
});
