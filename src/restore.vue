<template>
  <div>Restoring view...</div>
</template>

<script>
export default {
  data() {
    return {};
  },
  async mounted() {
    // restore the navigation based on the state in the local storage
    // that is: the last scratch or file that was worked on in the other tab
    if (this.$store.getters.activeFile) {
      await this.$router.replace({ name: 'edit' });
    } else if (this.$store.getters.activeScratch) {
      await this.$router.replace({ name: 'scratch', params: { name: this.$store.getters.activeScratch.name } });
    } else {
      await this.$router.replace({ name: 'welcome' });
    }
  },
};
</script>
