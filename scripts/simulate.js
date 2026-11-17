import {DIMENSIONS,QUESTIONS,ARCHETYPES,TRAVEL_MODES} from '../data.js';

const RUNS=Number(process.argv[2]||10000);
const SEED=Number(process.argv[3]??20261117);
if (!Number.isSafeInteger(RUNS) || RUNS < 1 || !Number.isInteger(SEED) || SEED < 0 || SEED > 0xffffffff) {
  throw new Error('Use a positive run count and a seed between 0 and 4294967295.');
}
let randomState=SEED;
const random=()=>{
  randomState=(Math.imul(1664525,randomState)+1013904223)>>>0;
  return randomState/4294967296;
};
console.log('Seed: ' + SEED);
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
      const remaining=[...q.options.keys()];
      const picks=[];
      for(let count=0;count<q.multi;count++){
        const index=Math.floor(random()*remaining.length);
        picks.push(remaining.splice(index,1)[0]);
      }
      picks.forEach(i=>apply(scores,q.options[i][3]));
    }else{
      const option=q.options[Math.floor(random()*q.options.length)];
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
