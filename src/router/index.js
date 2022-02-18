import { createRouter, createWebHashHistory } from 'vue-router';
import Login from '../AnitaLogin.vue';
import Logout from '../AnitaLogout.vue';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: () => import(/* webpackChunkName: "AnitaStart" */ '../AnitaStart.vue'),
      name: 'welcome',
    },
    {
      path: '/restore',
      component: () => import(/* webpackChunkName: "AnitaRestore" */ '../AnitaRestore.vue'),
      name: 'restore',
    },
    {
      path: '/edit',
      component: () => import(/* webpackChunkName: "AnitaEditor" */ '../AnitaEditor.vue'),
      name: 'edit',
    },
    {
      path: '/scratch/:name',
      component: () => import(/* webpackChunkName: "AnitaScratch" */ '../AnitaScratch.vue'),
      name: 'scratch',
    },
    { path: '/login', component: Login },
    { path: '/logout', component: Logout },
  ],
});

export default router;
