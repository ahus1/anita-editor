<template>
    <div>You have been logged out.</div>
</template>

<script>
import store from './store';

export default {
  mounted() {
    store.commit('logout');
  },
};
</script>
