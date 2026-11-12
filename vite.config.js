import {defineConfig,loadEnv} from 'vite';
import {validatePublicBuildConfig} from './scripts/public-build-config.js';
import {fileURLToPath} from 'node:url';

export default defineConfig(({mode})=>{
  const values=validatePublicBuildConfig(loadEnv(mode,process.cwd(),'VITE_'));
  const publicDemo=process.env.TASTEPRINT_PUBLIC_DEMO==='1';
  if(publicDemo&&Object.values(values).some(Boolean))throw Error('Public demo must have every backend key and feature flag blank.');
  let demoBase='/';
  return {base:process.env.GITHUB_ACTIONS?'/tasteprint/':'/',
    define:publicDemo?Object.fromEntries(['localStorage','sessionStorage'].flatMap(name=>[name,`window.${name}`,`globalThis.${name}`].map(key=>[key,`globalThis.__tasteprintPublicDemoStorage.${name}`]))):{},
    plugins:publicDemo?[{name:'isolated-public-demo',configResolved(config){demoBase=config.base;},transformIndexHtml(html,context){if(context.filename.endsWith('/demo.html'))return html;return {html:html.replace("connect-src 'self' https://*.supabase.co","connect-src 'none'"),tags:[{tag:'script',attrs:{src:`${demoBase}public-demo-bootstrap.js`},injectTo:'head-prepend'}]};}}]:[],
    build:{rollupOptions:{input:{app:fileURLToPath(new URL('./index.html',import.meta.url)),demo:fileURLToPath(new URL('./demo.html',import.meta.url))}}}};
});
