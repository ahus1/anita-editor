import Vue from 'vue';
import axios from 'axios';
import App from './AnitaApp.vue';
import './assets/css/styles.pcss';
import 'font-awesome/css/font-awesome.css';
import store from './store';
import router from './router';

// Add a request interceptor
axios.interceptors.request.use((config) => {
  if (config.url.startsWith('https://api.github.com/')) {
    if (store.state.github.token) {
      config.headers.authorization = `Token ${store.state.github.token.access_token}`;
    }
  }
  // Do something before request is sent
  return config;
}, (error) => Promise.reject(error));

// Add a response interceptor
axios.interceptors.response.use((response) => {
  // Any status code that lie within the range of 2xx cause this function to trigger
  if (response.config.url.startsWith('https://api.github.com/')) {
    // X-Ratelimit-Limit: 60
    // X-Ratelimit-Remaining: 53
    // X-Ratelimit-Reset: 1590137466
    store.commit('ratelimit',
      {
        limit: response.headers['x-ratelimit-limit'],
        remaining: response.headers['x-ratelimit-remaining'],
        reset: response.headers['x-ratelimit-reset'],
      });
  }
  // Do something with response data
  return response;
}, (error) => {
  if (error.response.status === 401 && error.config.url.startsWith('https://api.github.com/') && error.response.data.message === 'Bad credentials') {
    store.commit('invalidCredentials');
  } else {
    console.log('axios request failed', error, error.config, error.response);
  }
  // Any status codes that falls outside the range of 2xx cause this function to trigger
  // Do something with response error
  return Promise.reject(error);
});

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount('#app');
