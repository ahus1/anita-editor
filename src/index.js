import Vue from 'vue'
import App from './App'
import Editor from './editor'
import Login from './login'
import Logout from './logout'
import Start from './start'
import VueRouter from 'vue-router'
import 'assets/css/styles.pcss'
import 'font-awesome/css/font-awesome.css'
import 'highlight.js/styles/github.css'
import {store} from './store.js'
import axios from 'axios'

const router = new VueRouter({
    routes: [
        {path: '/', component: Start},
        {path: '/edit', component: Editor, name: 'edit'},
        {path: '/login', component: Login},
        {path: '/logout', component: Logout}
    ]
})

Vue.use(VueRouter)

// Add a request interceptor
axios.interceptors.request.use(function (config) {
    if (config.url.startsWith("https://api.github.com/")) {
        if (store.state.github.token) {
            config.headers["authorization"] = `Token ${store.state.github.token.access_token}`
        }
    }
    // Do something before request is sent
    return config;
}, function (error) {
    // Do something with request error
    return Promise.reject(error);
});

// Add a response interceptor
axios.interceptors.response.use(function (response) {
    // Any status code that lie within the range of 2xx cause this function to trigger
    if (response.config.url.startsWith("https://api.github.com/")) {
        // X-Ratelimit-Limit: 60
        // X-Ratelimit-Remaining: 53
        // X-Ratelimit-Reset: 1590137466
        store.commit("ratelimit",
            {
                limit: response.headers["x-ratelimit-limit"],
                remaining: response.headers["x-ratelimit-remaining"],
                reset: response.headers["x-ratelimit-reset"]
            }
        )
    }
    // Do something with response data
    return response;
}, function (error) {
    if (error.response.status === 401 && error.config.url.startsWith("https://api.github.com/") && error.response.data.message === "Bad credentials") {
        store.commit("invalidCredentials")
    } else {
        console.log("axios request failed", error, error.config, error.response)
    }
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    return Promise.reject(error);
});

new Vue({
    router,
    store,
    render: h => h(App)
}).$mount('#app')
