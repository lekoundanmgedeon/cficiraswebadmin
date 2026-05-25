export default [
  { path: '/auth/login', name: 'Login', component: () => import('@/views/auth/Login.vue'), meta: { public: true } },
  { path: '/auth/register', name: 'Register', component: () => import('@/views/auth/Register.vue'), meta: { public: true } },
  { path: '/auth/new-password', name: 'NewPassword', component: () => import('@/views/auth/Login.vue'), meta: { public: true } },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('@/views/errors/NotFound.vue'), meta: { public: true } },
];
