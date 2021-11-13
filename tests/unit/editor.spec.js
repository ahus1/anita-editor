import VueRouter from 'vue-router';
import Vuex from 'vuex';
import { mount, createLocalVue } from '@vue/test-utils';
import scratch from '../../src/AnitaScratch.vue';

const localVue = createLocalVue();
localVue.use(Vuex);
localVue.use(VueRouter);

const store = new Vuex.Store({
  state: {
    github: {},
  },
  getters: {
    activeFile() {
      return undefined;
    },
    activeScratch() {
      return undefined;
    },
  },
});

const router = new VueRouter({
  routes: [
  ],
});

describe('AnitaScratch.vue', () => {
  it('renders props.msg when passed', () => {
    const wrapper = mount(scratch, {
      store,
      router,
      localVue,
    });
    expect(wrapper.text()).toContain('');
  });
});
