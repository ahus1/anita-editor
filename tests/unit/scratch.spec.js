import VueRouter from 'vue-router';
import Vuex from 'vuex';
import { mount, createLocalVue } from '@vue/test-utils';
import editor from '../../src/AnitaEditor.vue';

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
  },
});

const router = new VueRouter({
  routes: [
  ],
});

describe('AnitaEditor.vue', () => {
  it('renders props.msg when passed', () => {
    const wrapper = mount(editor, {
      store,
      router,
      localVue,
    });
    expect(wrapper.text()).toContain('Discard Changes');
    expect(wrapper.text()).toContain('Toggle Preview');
  });
});
