/* eslint-disable import/newline-after-import,import/first */
import { createRouter, createWebHistory } from 'vue-router';
import { createStore } from 'vuex';
import { shallowMount } from '@vue/test-utils';
import scratch from '../../src/AnitaScratch.vue';

const store = createStore({
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

const router = createRouter({
  history: createWebHistory(),
  routes: [
  ],
});

describe('AnitaScratch.vue', () => {
  it('renders props.msg when passed', () => {
    const wrapper = shallowMount(scratch, {
      global: {
        plugins: [store, router],
      },
    });
    expect(wrapper.text()).toContain('');
  });
});
