import { createRouter, createWebHashHistory } from 'vue-router';

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
  ],
});

export default router;
