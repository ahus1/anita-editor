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
      component: () => import(/* webpackChunkName: "start" */ '../start'),
    },
    {
      path: '/edit',
      component: () => import(/* webpackChunkName: "editor" */ '../editor'),
      name: 'edit',
    },
    { path: '/login', component: Login },
    { path: '/logout', component: Logout },
  ],
});

export default router;
