import { createApp } from 'vue';
import { createPinia } from 'pinia';
import './assets/css/style.css';
import 'vue3-toastify/dist/index.css';
// Import de Bootstrap (si ce n'est pas déjà fait)

// Import des icônes Bootstrap
import 'bootstrap-icons/font/bootstrap-icons.css'
//Integration antd vue3-toastify
import { Table, Tabs } from 'ant-design-vue';
import router from './routes';
import App from './App.vue';
const app = createApp(App);

app.use(router);
app.use(createPinia()); // Ajouter Pinia à ton application Vue 3
app.use(Table);
app.use(Tabs);
app.mount('#app');
