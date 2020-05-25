<template>
    <div class="grid grid-cols-2" id="content">
        <div class="overflow-y-auto relative border-collapse box-border shadow-inner"
             style="min-height: 100vh; height: 100vh; max-height: 100vh;">
            <editor v-model="content" @init="editorInit" lang="asciidoc" theme="chrome"></editor>
        </div>
        <div class="overflow-y-auto relative border-collapse box-border shadow-inner p-4"
             style="min-height: 100vh; height: 100vh; max-height: 100vh;">
            <button v-if="!conflicted" class="text-white font-bold py-2 px-4 rounded"
                    @click="save"
                    :class="{ 'bg-gray-500': !changed, 'bg-blue-500': changed, 'hover:bg-blue-700': changed, 'cursor-wait': saving, 'cursor-default': !changed}"
                    :disabled="saving || !changed">
                {{ this.saving ? 'Saving...' : 'Save' }}
            </button>
            <template v-if="conflicted">
                Unable to save contents as remote branch has been modified. Discard local changes and reload from server.
                <br />
            </template>
            <button class="text-white font-bold py-2 px-4 rounded"
                    @click="reload"
                    :class="{ 'bg-gray-500': !changed, 'bg-red-500': changed || conflicted, 'hover:bg-red-700': changed || conflicted, 'cursor-wait': reloading, 'cursor-default': !changed}"
                    :disabled="reloading || (!changed && !conflicted)">
                {{ this.reloading ? 'Reloading...' : 'Discard Changes' }}
            </button>
            <div>
                <div v-html="preview" class="adoc"></div>
            </div>
        </div>
    </div>
</template>

<style>
    .ace_editor {
        position: relative;
        /* match font size and line height with Asciidoctor stylesheet */
        font-size: 0.9rem;
        line-height: 1.6;
    }
</style>

<script>
    import asciidoctor from '@asciidoctor/core'
    import hljs from 'highlight.js'
    // conversion will run on the client side, therefore select browser variant
    import kroki from '../node_modules/asciidoctor-kroki/dist/browser/asciidoctor-kroki'
    import {mapActions, mapState} from "vuex";

    const registry = asciidoctor().Extensions.create()
    kroki.register(registry)

    const options = {
        safe: "unsafe",
        extension_registry: registry,
        sourceHighlighter: "highlightjs",
        attributes: {"showtitle": "true", "icons": "font"}
    }

    function b64EncodeUnicode(str) {
        // first we use encodeURIComponent to get percent-encoded UTF-8,
        // then we convert the percent encodings into raw bytes which
        // can be fed into btoa.
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
            function toSolidBytes(match, p1) {
                return String.fromCharCode('0x' + p1);
            }));
    }

    function b64DecodeUnicode(str) {
        // Going backwards: from bytestream, to percent-encoding, to original string.
        return decodeURIComponent(atob(str).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    }

    export default {
        data: function () {
            return {
                preview: "",
                saving: false,
                reloading: false
            }
        },
        mounted: function () {
            this.highlight()
        },
        components: {
            editor: require('vue2-ace-editor'),
        },
        watch: {
            $route: {
                immediate: true,
                async handler() {
                    await this.getContent()
                }
            },
            content: {
                immediate: true,
                handler(to) {
                    this.preview = this.renderContent(to)
                }
            },
        },
        computed: {
            ...mapState(["github"]),
            changed() {
                let activeFile = this.$store.getters.activeFile;
                if (activeFile === undefined) {
                    return false
                }
                return activeFile.content !== activeFile.original
            },
            conflicted() {
                let activeFile = this.$store.getters.activeFile;
                if (activeFile === undefined) {
                    return false
                }
                return activeFile.conflict === true
            },
            content: {
                get () {
                    let activeFile = this.$store.getters.activeFile;
                    if (activeFile) {
                        return activeFile.content
                    } else {
                        return ""
                    }
                },
                set (value) {
                    this.$store.commit('updateActiveFileContent', { content: value })
                }
            }
        },
        methods: {
            ...mapActions(["loadFile"]),
            editorInit: function (editor) {
                require('brace/ext/language_tools') //language extension prerequsite...
                require('brace/mode/asciidoc')
                require('brace/mode/javascript')    //language
                require('brace/mode/less')
                require('brace/theme/chrome')
                require('brace/snippets/javascript') //snippet
                editor.setOption("wrap", true)
                editor.setShowPrintMargin(false)
            },
            highlight() {
                var targets = this.$el.querySelectorAll('.adoc pre.highlight code')
                for (var i = 0; i < targets.length; i += 1) {
                    var target = targets[i]
                    hljs.highlightBlock(target)
                }
            },
            renderContent(content) {
                this.$nextTick(() => {
                    this.highlight()
                })
                return asciidoctor().convert(content, options)
            },
            async getContent() {
                const file = this.$route.query.file
                if (file !== undefined) {
                    await this.loadFile({file})
                    this.$router.replace({ name: 'edit'})
                }
            },
            async save() {
                // PUT /repos/:owner/:repo/contents/:path
                if (!this.saving) {
                    this.saving = true
                    try {
                        await this.$store.dispatch('saveActiveFileContent')
                    } catch (error) {
                        if (error.response && error.response.status === 409) {
                            console.log("Remote file has been changed while editing it. Results not saved.")
                        } else {
                            console.log(error)
                        }
                    } finally {
                        this.saving = false
                    }
                }
            },
            async reload() {
                if (!this.reloading) {
                    this.reloading = true
                    try {
                        await this.$store.dispatch('reloadActiveFile')
                    } catch (error) {
                        console.log(error)
                    } finally {
                        this.reloading = false
                    }
                }
            }
        }
    }
</script>
