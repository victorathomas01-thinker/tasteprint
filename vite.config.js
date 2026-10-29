import {defineConfig,loadEnv} from 'vite';
import {validatePublicBuildConfig} from './scripts/public-build-config.js';
import {fileURLToPath} from 'node:url';

export default defineConfig(({mode})=>{
  validatePublicBuildConfig(loadEnv(mode,process.cwd(),'VITE_'));
  return {base:process.env.GITHUB_ACTIONS?'/tasteprint/':'/',build:{rollupOptions:{input:{app:fileURLToPath(new URL('./index.html',import.meta.url)),demo:fileURLToPath(new URL('./demo.html',import.meta.url))}}}};
});
