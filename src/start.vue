<template>
    <div class="overflow-y-auto border-collapse box-border shadow-inner p-4"
         style="min-height: 100vh; height: 100vh; max-height: 100vh;">
        <div v-html="content" class="adoc"></div>
        <label for="url" class="block text-gray-700 text-sm font-bold mb-2">GitHub URL:</label>
        <input id="url" class="shadow appearance-none border rounded py-2 w-full px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" v-model="url" type="text"/>
        <button class="text-white font-bold mt-2 py-2 px-4 rounded bg-blue-500"
                @click="load">
            Load
        </button>
    </div>
</template>

<script>
    import asciidoctor from '@asciidoctor/core'
    // conversion will run on the client side, therefore select browser variant
    import kroki from '../node_modules/asciidoctor-kroki/dist/browser/asciidoctor-kroki';
    import { mapActions } from 'vuex'

    const registry = asciidoctor().Extensions.create()
    kroki.register(registry)

    const options = {
        safe: "unsafe",
        extension_registry: registry,
        sourceHighlighter: "highlightjs",
        attributes: {"showtitle": "true", "icons": "font"}
    }

    export default {
        data: function () {
            var contents = this.getContents();
            return {
                content: this.renderContent(contents.start),
                url: undefined
            }
        },
        async mounted() {
            let href = window.location.href
            const result = new RegExp("code=(?<code>[^/][0-9a-z]*).*state=(?<state>[^/][0-9a-z]*)").exec(href)
            if (result) {
                href = href.replace(/\?code=[0-9a-z]*&state=[0-9a-z]*/, "")
                history.replaceState(null, "", href)
                if (this.$store.getters.activeFile) {
                    await this.$router.push({name: 'edit'})
                }
                await this.login(result.groups)
            } else {
                try {
                    await this.refreshUser()
                } catch (e) {
                    console.log(e);
                }
            }
        },
        methods: {
            ...mapActions([
                'login', 'refreshUser', 'loadFile'
            ]),
            async load() {
                await this.loadFile({file: this.url})
                this.$router.push({ name: 'edit'})
            },
            renderContent(content) {
                return asciidoctor().convert(content, options)
            },
            getContents() {
                var start = ""
                try {
                    start = require(`../static/start.adoc`).default
                } catch (e) {
                    start = `Unable to load start.adoc`
                }
                return {start}
            }
        }
    }
</script>
