import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { Table, Tabs } from 'ant-design-vue';

import 'bootstrap-icons/font/bootstrap-icons.css';
import 'vue3-toastify/dist/index.css';
import './assets/css/style.css';

import router from '@/core/router';
import App from './App.vue';

const app = createApp(App);

// Pinia est installé avant le router : le guard de navigation et l'intercepteur
// 401 peuvent solliciter un store dès la toute première résolution de route.
app.use(createPinia());
app.use(router);

app.use(Table);
app.use(Tabs);

app.mount('#app');
