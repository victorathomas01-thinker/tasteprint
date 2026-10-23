import {defineConfig,loadEnv} from 'vite';
import {validatePublicBuildConfig} from './scripts/public-build-config.js';

export default defineConfig(({mode})=>{
  validatePublicBuildConfig(loadEnv(mode,process.cwd(),'VITE_'));
  return {base:process.env.GITHUB_ACTIONS?'/tasteprint/':'/'};
});
