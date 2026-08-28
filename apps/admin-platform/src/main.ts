import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import '@mall/design-tokens/style.css';
// 必须最先导入：配置 token 命名空间，避免与商家端共用 key 串号
import './token-ns';
import App from './App.vue';
import router from './router';


const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(ElementPlus);
app.mount('#app');
