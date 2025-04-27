import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import "./assets/styles/reset.css";
import "./assets/styles/global.css";
import "./assets/styles/iconfont/iconfont.css";
window.$ = document.querySelector.bind(document);
const app = createApp(App)

app.use(ElementPlus)
app.mount('#app')
