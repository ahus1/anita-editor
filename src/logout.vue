<template>
    <div>You have been logged out.</div>
</template>

<script>
    import {store} from "./store";
    export default {
        mounted: function () {
            store.commit("logout")
        }
    }
</script>
