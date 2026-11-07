const $ = (s) => document.querySelector(s);
const state = {data:[], filtered:[], from:1880, to:2024, view:'stripes', scale:'balanced', selected:2024};
const NASA_CSV = 'https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv';
const fallback = [
[-.18],[-.09],[-.12],[-.18],[-.29],[-.22],[-.11],[-.11],[-.17],[-.16],
[-.27],[-.34],[-.36],[-.35],[-.22],[-.14],[-.30],[-.33],[-.23],[-.12],
[-.08],[-.13],[-.27],[-.31],[-.28],[-.22],[-.11],[-.20],[-.20],[-.18],
[-.16],[-.08],[-.14],[-.29],[-.15],[-.14],[-.20],[-.20],[-.28],[-.13],
[-.07],[-.02],[-.14],[-.07],[-.14],[-.20],[-.15],[-.03],[-.02],[-.02],
[-.01],[-.08],[-.08],[-.17],[-.07],[-.02],[-.12],[-.03],[.08],[.03],
[.05],[.03],[.06],[.03],[.05],[.02],[.03],[.01],[.05],[.03],
[.01],[.06],[.03],[.04],[.02],[.01],[.07],[.10],[.12],[.18],
[.16],[.13],[.23],[.28],[.33],[.40],[.42],[.44],[.33],[.46],
[.49],[.52],[.63],[.62],[.55],[.67],[.64],[.66],[.54],[.64],
[.70],[.66],[.61],[.68],[.75],[.90],[.95],[.92],[.85],[.98],
[1.02],[.92],[.85],[.89],[.98],[1.02],[1.16],[1.28]
].map(x=>x[0]);
const colorStops = [[-1.2,[30,65,105]],[-.6,[72,119,153]],[-.2,[142,171,177]],[0,[225,224,207]],[.4,[229,164,130]],[.8,[205,91,78]],[1.4,[142,35,48]]];
function colorFor(v){
  const multiplier = state.scale==='dramatic'?1.35:state.scale==='soft'?.78:1;
  v*=multiplier;
  let i=0; while(i<colorStops.length-2 && v>colorStops[i+1][0]) i++;
  const [a,ca]=colorStops[i], [b,cb]=colorStops[i+1], t=Math.max(0,Math.min(1,(v-a)/(b-a)));
  const c=ca.map((n,j)=>Math.round(n+(cb[j]-n)*t));
  return `rgb(${c.join(',')})`;
}
function fmt(v){return `${v>=0?'+':'−'}${Math.abs(v).toFixed(2)}`;}
function average(arr){return arr.length?arr.reduce((s,d)=>s+d.value,0)/arr.length:0;}
async function loadData(){
  try{
    const res=await fetch(NASA_CSV,{cache:'no-store'});
    if(!res.ok) throw new Error('NASA data unavailable');
    const text=await res.text();
    const lines=text.trim().split(/\r?\n/).slice(1);
    const parsed=[];
    for(const line of lines){
      const cols=line.split(',');
      const year=Number(cols[0]), value=Number(cols[13]);
      if(year>=1880 && Number.isFinite(value) && cols[13] && !cols[13].includes('*')) parsed.push({year,value});
    }
    if(parsed.length<100) throw new Error('Unexpected data format');
    state.data=parsed;
    $('#datasetStatus').textContent='NASA GISTEMP v4 · LIVE CSV';
  }catch(e){
    state.data=fallback.map((value,i)=>({year:1880+i,value}));
    $('#datasetStatus').textContent='OFFLINE PREVIEW · DEMO SERIES';
    console.info('Using offline preview data. Live NASA CSV could not be reached.',e);
  }
  state.from=state.data[0].year; state.to=state.data[state.data.length-1].year;
  state.selected=state.to;
  ['fromRange','toRange','yearSlider'].forEach(id=>{const el=$('#'+id);el.min=state.data[0].year;el.max=state.to;});
  $('#fromRange').value=state.from;$('#toRange').value=state.to;$('#yearSlider').value=state.selected;
  $('#recordYear').textContent=state.data.reduce((a,b)=>b.value>a.value?b:a).year;
  const record=state.data.reduce((a,b)=>b.value>a.value?b:a);
  $('#recordAnomaly').innerHTML=`${fmt(record.value)}<span>°C</span>`;
  $('#yearCount').textContent=state.data.length;
  renderAll();
}
function visible(){return state.data.filter(d=>d.year>=state.from&&d.year<=state.to);}
function renderStripes(target, data, compact=false){
  target.innerHTML='';
  const max=Math.max(...data.map(d=>Math.abs(d.value)),1);
  data.forEach(d=>{
    const el=document.createElement('div');el.className='stripe';el.style.background=colorFor(d.value);
    if(state.view==='bars' && !compact){
      const h=Math.max(4,Math.abs(d.value)/max*100);
      el.style.setProperty('--bar-height',h+'%');el.style.setProperty('--bar-align',d.value>=0?'end':'end');
      el.style.background=colorFor(d.value);
    }
    el.dataset.year=d.year;el.dataset.value=d.value;
    el.addEventListener('pointermove',e=>showTooltip(e,d,target));
    el.addEventListener('pointerleave',()=>$('#stripeTooltip').style.display='none');
    el.addEventListener('click',()=>selectYear(d.year));
    target.appendChild(el);
  });
  if(state.view==='bars'&&!compact) target.classList.add('bars'); else target.classList.remove('bars');
}
function showTooltip(e,d,target){
  const tip=$('#stripeTooltip'), rect=target.getBoundingClientRect();
  tip.style.display='block';tip.textContent=`${d.year}  ${fmt(d.value)}°C`;
  tip.style.left=Math.min(e.clientX-rect.left+10,rect.width-105)+'px';
  tip.style.top=Math.max(0,e.clientY-rect.top-34)+'px';
}
function renderChart(data){
  const box=$('#lineChart'); if(!data.length)return;
  const W=700,H=235,pad=25,min=-.5,max=1.5;
  const x=i=>pad+i/(data.length-1||1)*(W-pad*2), y=v=>H-pad-(v-min)/(max-min)*(H-pad*2);
  const pts=data.map((d,i)=>`${x(i)},${y(d.value)}`).join(' ');
  const zero=y(0);
  const selected=data.find(d=>d.year===state.selected);
  const sx=selected?x(data.indexOf(selected)):null, sy=selected?y(selected.value):null;
  const ticks=[-.5,0,.5,1,1.5];
  box.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Line chart of annual global temperature anomaly"><defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#e98f76" stop-opacity=".28"/><stop offset="1" stop-color="#e98f76" stop-opacity="0"/></linearGradient></defs>${ticks.map(t=>`<line x1="${pad}" x2="${W-pad}" y1="${y(t)}" y2="${y(t)}" stroke="var(--line)" stroke-dasharray="3 5"/><text x="0" y="${y(t)+3}" fill="var(--muted)" font-size="9" font-family="DM Mono">${t.toFixed(1)}</text>`).join('')}<line x1="${pad}" x2="${W-pad}" y1="${zero}" y2="${zero}" stroke="var(--muted)" opacity=".6"/><polygon points="${pad},${zero} ${pts} ${W-pad},${zero}" fill="url(#area)"/><polyline points="${pts}" fill="none" stroke="#e9957c" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>${selected?`<line x1="${sx}" x2="${sx}" y1="${pad}" y2="${H-pad}" stroke="var(--accent)" stroke-dasharray="3 4"/><circle cx="${sx}" cy="${sy}" r="5" fill="var(--accent)" stroke="var(--panel)" stroke-width="3"/>`:''}</svg>`;
}
function renderCompare(){
  const first=Number($('#compareSelect').value), early=state.data.filter(d=>d.year>=first&&d.year<first+30), recent=state.data.filter(d=>d.year>=state.to-29&&d.year<=state.to);
  const em=average(early),rm=average(recent);
  $('#earlyYears').textContent=`${early[0]?.year??first}–${early.at(-1)?.year??first+29}`;
  $('#recentYears').textContent=`${recent[0]?.year??''}–${recent.at(-1)?.year??''}`;
  $('#earlyMean').textContent=`${fmt(em)}°C`;$('#recentMean').textContent=`${fmt(rm)}°C`;
  $('#warmingGap').textContent=`${rm-em>=0?'+':''}${(rm-em).toFixed(2)}°C`;
  [['earlyStripes',early],['recentStripes',recent]].forEach(([id,arr])=>{
    const el=$('#'+id);el.innerHTML='';arr.forEach(d=>{const s=document.createElement('i');s.style.background=colorFor(d.value);el.appendChild(s);});
  });
}
function renderAll(){
  state.filtered=visible();
  renderStripes($('#stripes'),state.filtered);
  $('#startYear').textContent=state.from;$('#endYear').textContent=state.to;
  $('#rangeLabel').textContent=`${state.from} — ${state.to}`;
  $('#fromRange').value=state.from;$('#toRange').value=state.to;
  $('#scaleLabel').textContent=state.scale==='dramatic'?'High contrast':state.scale==='soft'?'Soft tones':'Balanced';
  $('#viewLabel').textContent=state.view==='bars'?'Bars':'Stripes';
  const latest=state.filtered.at(-1);const earliest=state.filtered[0];
  $('#insightTitle').textContent=state.filtered.filter(d=>d.value>0).length>state.filtered.length/2?'Warmer-than-average years dominate this window.':'Cooler-than-average years are more common in this window.';
  $('#insightText').textContent=`From ${earliest?.year??''} to ${latest?.year??''}, the average anomaly is ${fmt(average(state.filtered))}°C relative to the 1951–1980 reference period.`;
  renderChart(state.data.filter(d=>d.year>=state.from&&d.year<=state.to));
  selectYear(Math.max(state.from,Math.min(state.to,state.selected)),false);
  renderCompare();
}
function selectYear(year,rerender=true){
  const d=state.data.find(x=>x.year===Number(year));if(!d)return;
  state.selected=d.year;$('#selectedYear').textContent=d.year;$('#selectedAnomaly').textContent=`${fmt(d.value)}°`;
  $('#yearSlider').value=d.year;$('#selectedLabel').textContent=d.year===state.to?'LATEST IN VIEW':'SELECTED YEAR';
  $('#yearContext').textContent=d.value>=0?`This year was ${d.value.toFixed(2)}°C warmer than the 1951–1980 reference average.`:`This year was ${Math.abs(d.value).toFixed(2)}°C cooler than the 1951–1980 reference average.`;
  if(rerender)renderChart(state.data.filter(x=>x.year>=state.from&&x.year<=state.to));
}
function setRange(from,to){
  state.from=Math.min(from,to);state.to=Math.max(from,to);
  if(state.to-state.from<4)state.to=Math.min(state.data.at(-1).year,state.from+4);
  renderAll();
}
$('#fromRange').addEventListener('input',e=>setRange(+e.target.value,state.to));
$('#toRange').addEventListener('input',e=>setRange(state.from,+e.target.value));
$('#yearSlider').addEventListener('input',e=>selectYear(+e.target.value));
$('#prevYear').onclick=()=>selectYear(Math.max(state.from,state.selected-1));
$('#nextYear').onclick=()=>selectYear(Math.min(state.to,state.selected+1));
$('#scaleSelect').onchange=e=>{state.scale=e.target.value;renderAll();};
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{state.view=b.dataset.view;document.querySelectorAll('[data-view]').forEach(x=>x.classList.toggle('selected',x===b));renderAll();});
document.querySelectorAll('[data-range]').forEach(b=>b.onclick=()=>{
  const end=state.data.at(-1).year, n=b.dataset.range==='all'?state.data.length:Number(b.dataset.range);
  setRange(state.data[Math.max(0,state.data.length-n)].year,end);
  document.querySelectorAll('[data-range]').forEach(x=>x.classList.toggle('active',x===b));
});
$('#compareSelect').onchange=renderCompare;
$('#randomYear').onclick=()=>{const d=state.data[Math.floor(Math.random()*state.data.length)];setRange(Math.max(state.data[0].year,d.year-10),Math.min(state.data.at(-1).year,d.year+10));selectYear(d.year);};
$('#themeToggle').onclick=()=>document.body.classList.toggle('light');
let playTimer=null;
function playTimeline(){
  if(playTimer){clearInterval(playTimer);playTimer=null;$('#playIntro').textContent='▶  Play the timeline';return;}
  $('#playIntro').textContent='Ⅱ  Pause timeline';
  let y=state.data[0].year;setRange(y,state.data.at(-1).year);selectYear(y);
  playTimer=setInterval(()=>{y++;if(y>state.data.at(-1).year){clearInterval(playTimer);playTimer=null;$('#playIntro').textContent='▶  Play the timeline';return;}selectYear(y);},95);
}
$('#playIntro').onclick=playTimeline;
function downloadBlob(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();URL.revokeObjectURL(a.href);}
$('#downloadCsv').onclick=()=>{
  const rows=[['year','global_temperature_anomaly_celsius'],...state.filtered.map(d=>[d.year,d.value])];
  downloadBlob(new Blob([rows.map(r=>r.join(',')).join('\n')],{type:'text/csv'}),'climate-stripes-data.csv');
};
$('#downloadPng').onclick=()=>{
  const data=state.filtered,w=Math.max(900,data.length*5),h=380,canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#101a24';ctx.fillRect(0,0,w,h);
  const sw=w/data.length;data.forEach((d,i)=>{ctx.fillStyle=colorFor(d.value);ctx.fillRect(i*sw,0,Math.ceil(sw)+.5,h);});
  ctx.fillStyle='#fff';ctx.font='16px monospace';ctx.fillText(`${data[0].year} — ${data.at(-1).year}  |  GLOBAL TEMPERATURE ANOMALY`,24,h-22);
  canvas.toBlob(blob=>downloadBlob(blob,'climate-warming-stripes.png'));
};
$('#shareBtn').onclick=async()=>{
  const url=new URL(location.href);url.hash=`years=${state.from}-${state.to}&year=${state.selected}&scale=${state.scale}&view=${state.view}`;
  try{await navigator.clipboard.writeText(url.href);$('#shareBtn').textContent='✓ COPIED';setTimeout(()=>$('#shareBtn').textContent='↗ SHARE',1500);}
  catch{prompt('Copy this view link:',url.href);}
};
function restoreHash(){
  const raw=location.hash.slice(1);if(!raw)return;
  const p=new URLSearchParams(raw.replaceAll('&','&'));const years=(p.get('years')||'').split('-').map(Number);
  if(years.length===2&&years.every(Number.isFinite)){state.from=years[0];state.to=years[1];}
  if(p.has('year'))state.selected=Number(p.get('year'));if(p.has('scale'))state.scale=p.get('scale');if(p.has('view'))state.view=p.get('view');
}
loadData().then(()=>{restoreHash();renderAll();});
