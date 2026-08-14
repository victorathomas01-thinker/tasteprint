import {DIMENSIONS,QUESTIONS,ARCHETYPES,TRAVEL_MODES} from '../data.js';

const RUNS=Number(process.argv[2]||10000);
const fresh=()=>Object.fromEntries(DIMENSIONS.map(k=>[k,50]));
const clamp=n=>Math.max(0,Math.min(100,Math.round(n)));
const apply=(scores,delta)=>{for(const [k,v] of Object.entries(delta||{}))scores[k]=clamp(scores[k]+v)};
const distance=(a,b)=>Math.sqrt(DIMENSIONS.reduce((sum,k)=>sum+(a[k]-b[k])**2,0)/DIMENSIONS.length);
const nearest=(scores,list)=>list.map(item=>({item,d:distance(scores,item.vector)})).sort((a,b)=>a.d-b.d)[0].item;

const archetypes=Object.fromEntries(ARCHETYPES.map(x=>[x.name,0]));
const modes=Object.fromEntries(TRAVEL_MODES.map(x=>[x.name,0]));

for(let run=0;run<RUNS;run++){
  const scores=fresh();
  for(const q of QUESTIONS){
    if(q.multi){
      const picks=[...q.options.keys()].sort(()=>Math.random()-.5).slice(0,q.multi);
      picks.forEach(i=>apply(scores,q.options[i][3]));
    }else{
      const option=q.options[Math.floor(Math.random()*q.options.length)];
      apply(scores,option[3]);
    }
  }
  archetypes[nearest(scores,ARCHETYPES).name]++;
  modes[nearest(scores,TRAVEL_MODES).name]++;
}

const report=(title,data)=>{
  console.log(`\n${title}`);
  Object.entries(data).sort((a,b)=>b[1]-a[1]).forEach(([name,count])=>{
    console.log(`${name.padEnd(24)} ${String(count).padStart(6)}  ${(count/RUNS*100).toFixed(2)}%`);
  });
};

console.log(`Tasteprint distribution simulation — ${RUNS.toLocaleString()} random profiles`);
report('Archetypes',archetypes);
report('Travel modes',modes);
