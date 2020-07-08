<template>
    <div>Logging in...</div>
</template>

<script>
import { mapState, mapMutations } from 'vuex';

const clientid = require('./localconfig');

export default {
  mounted() {
    // https://developer.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/
    // "public_repo" when working on a public repo; "repo" when working on a private repo
    this.prepareOauthState();
    window.location = `https://github.com/login/oauth/authorize?client_id=${clientid}&state=${this.oauthState}&scope=public_repo`;
  },
  computed: {
    ...mapState({
      oauthState: (state) => state.github.oauthState,
    }),
  },
  methods: {
    ...mapMutations(['prepareOauthState']),
  },
};
</script>
