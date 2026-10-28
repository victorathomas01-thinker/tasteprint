// Differences describe supplied quiz answers, not human compatibility or probabilities.
export function comparePreferencePatterns(first,second,dimensions){
 if(!Array.isArray(dimensions)||!dimensions.length||dimensions.length>30||new Set(dimensions).size!==dimensions.length)throw Error('Choose distinct preference dimensions.');
 const differences=dimensions.map(key=>{
  if(![first?.[key],second?.[key]].every(value=>Number.isFinite(value)&&value>=0&&value<=100))throw Error('Complete preference scores are required.');
  return {key,difference:Math.abs(first[key]-second[key])};
 }).sort((a,b)=>a.difference-b.difference||a.key.localeCompare(b.key));
 return {dimensions:differences.length,closeCount:differences.filter(x=>x.difference<=10).length,averageDifference:differences.reduce((sum,x)=>sum+x.difference,0)/differences.length,closest:differences[0],furthest:differences.at(-1)};
}
