import VueRouter from 'vue-router';
import Vue from 'vue';
import Login from '../login.vue';
import Logout from '../logout.vue';

Vue.config.productionTip = false;

Vue.use(VueRouter);

const router = new VueRouter({
  routes: [
    {
      path: '/',
      component: () => import(/* webpackChunkName: "start" */ '../start.vue'),
      name: 'welcome',
    },
    {
      path: '/restore',
      component: () => import(/* webpackChunkName: "restore" */ '../restore.vue'),
      name: 'restore',
    },
    {
      path: '/edit',
      component: () => import(/* webpackChunkName: "editor" */ '../editor.vue'),
      name: 'edit',
    },
    {
      path: '/scratch/:name',
      component: () => import(/* webpackChunkName: "editor" */ '../scratch.vue'),
      name: 'scratch',
    },
    { path: '/login', component: Login },
    { path: '/logout', component: Logout },
  ],
});

export default router;
