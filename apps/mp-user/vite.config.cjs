const fs = require('node:fs');
const path = require('node:path');
const { defineConfig, loadEnv } = require('vite');
const uniMod = require('@dcloudio/vite-plugin-uni');

const uni = uniMod.default || uniMod;

module.exports = defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, 'VITE_');
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'src/manifest.json'), 'utf8'));
  const appid = env.VITE_MP_USER_APPID || manifest?.['mp-weixin']?.appid || manifest?.appid;
  if (!appid) console.warn('[mall][mp-user] AppID 未配置：设置 VITE_MP_USER_APPID 或 src/manifest.json 的 mp-weixin.appid 后再发布。');
  return { plugins: [uni()] };
});
