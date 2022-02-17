import { createRouter } from 'vue-router';
import { createStore } from 'vuex';
import { mount } from '@vue/test-utils';
import editor from '../../src/AnitaEditor.vue';

const store = createStore({
  state: {
    github: {},
  },
  getters: {
    activeFile() {
      return undefined;
    },
  },
});

const router = createRouter({
  routes: [
  ],
});

describe('AnitaEditor.vue', () => {
  it('renders props.msg when passed', () => {
    const wrapper = mount(editor, {
      global: {
        plugins: [store, router],
      },
    });
    expect(wrapper.text()).toContain('Discard Changes');
    expect(wrapper.text()).toContain('Toggle Preview');
  });
});
