import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { Table, Tabs } from 'ant-design-vue';

import 'bootstrap-icons/font/bootstrap-icons.css';
import 'vue3-toastify/dist/index.css';
import './assets/css/style.css';

import router from '@/core/router';
import { setTokenScope } from '@/core/auth/tokenStorage';
import { ESPACE_NOTES_BASE } from '@/modules/espace-notes/constants';
import App from './App.vue';

/**
 * L'espace de gestion des notes s'ouvre dans sa propre fenêtre et tient sa
 * propre session : le jeton y est rangé sous une clé distincte. La portée se
 * décide ici, avant tout appel réseau, d'après l'URL de la fenêtre — chaque
 * fenêtre ayant son propre contexte JavaScript, la valeur ne fuit pas d'un
 * espace à l'autre.
 */
if (window.location.pathname.startsWith(ESPACE_NOTES_BASE)) {
  setTokenScope('espace-notes');
}

const app = createApp(App);

// Pinia est installé avant le router : le guard de navigation et l'intercepteur
// 401 peuvent solliciter un store dès la toute première résolution de route.
app.use(createPinia());
app.use(router);

app.use(Table);
app.use(Tabs);

app.mount('#app');
