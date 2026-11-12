// Dependency-free JavaScript syntax gate. Does not execute application code.
import {readdirSync} from 'node:fs';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
const root=new URL('../',import.meta.url).pathname;
const files=[];
function visit(path){for(const entry of readdirSync(path,{withFileTypes:true})){if(['node_modules','.git','dist'].includes(entry.name)||entry.name.startsWith('.'))continue;const full=join(path,entry.name);if(entry.isDirectory())visit(full);else if(entry.name.endsWith('.js'))files.push(full);}}
visit(root);for(const file of files)execFileSync(process.execPath,['--check',file],{stdio:'pipe'});
console.log(`JavaScript syntax PASS: ${files.length} files. No style or TypeScript checking claimed.`);
