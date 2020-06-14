<template>
    <div class="grid grid-cols-2" id="content">
        <div class="overflow-y-auto relative border-collapse box-border shadow-inner"
             style="min-height: 100vh; height: 100vh; max-height: 100vh;">
            <editor v-model="content" @init="editorInit" lang="asciidoc" theme="chrome"></editor>
        </div>
        <div class="overflow-y-auto relative border-collapse box-border shadow-inner p-4"
             style="min-height: 100vh; height: 100vh; max-height: 100vh;">
            <template v-if="changed && !loggedin">
                Please log-in using the action on the toolbar on the left to be able to save your changes.
                <br />
            </template>
            <template v-else-if="!canpush && loggedin">
                Unable to save contents as user doesn't have push permissions on this repository.
                <br />
            </template>
            <template v-else-if="conflicted">
                Unable to save contents as remote branch has been modified. Discard local changes and reload from server.
                <br />
            </template>
            <button v-else-if="!conflicted && loggedin" class="text-white font-bold py-2 px-4 rounded"
                    @click="save"
                    :class="{ 'bg-gray-500': !changed, 'bg-blue-500': changed, 'hover:bg-blue-700': changed, 'cursor-wait': saving, 'cursor-default': !changed}"
                    :disabled="saving || !changed">
                {{ this.saving ? 'Saving...' : 'Save' }}
            </button>
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
    import xss  from 'xss'
    import { getDefaultWhiteList }  from 'xss/lib/default'

    // conversion will run on the client side, therefore select browser variant
    import kroki from '../node_modules/asciidoctor-kroki/dist/browser/asciidoctor-kroki'
    import {mapActions, mapState} from "vuex";

    const registry = asciidoctor().Extensions.create()
    kroki.register(registry)

    const asciidoctorOptions = {
        safe: "unsafe",
        extension_registry: registry,
        sourceHighlighter: "highlightjs",
        attributes: {"showtitle": "true", "icons": "font"}
    }

    const xssOptions = {
        whiteList: getDefaultWhiteList(),
        onIgnoreTag: function (tag, html, options) {
            console.log('ignoring tag "' + tag + "' as it is not on the whitelist");
        },
        onIgnoreTagAttr: function (tag, name, value, whitelist) {
            console.log('ignoring tag/attr "' + tag + '/' + name + '" with value "' + value + '" as it is not on the whitelist');
        }
    }

    // allow ID, title and class for all elements on the whitelist
    Object.keys(xssOptions.whiteList).forEach(key => xssOptions.whiteList[key].push('id','title','class'))

    xssOptions.whiteList['ol'].push('type')
    xssOptions.whiteList['ul'].push('type')
    xssOptions.whiteList['code'].push('data-lang')
    xssOptions.whiteList['i'].push('data-value')
    xssOptions.whiteList['a'].push('rel')

    // columns have a setting of the width style, therefore allow style
    xssOptions.whiteList['col'].push('style')

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
            canpush() {
                let activeWorkspace = this.$store.getters.activeWorkspace;
                if (activeWorkspace === undefined) {
                    return false
                }
                return activeWorkspace.permissions.push
            },
            loggedin() {
                return this.$store.state.github.user !== undefined && this.$store.state.github.user !== null;
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
                const codeblocks = this.$el.querySelectorAll('.adoc pre.highlight code')
                codeblocks.forEach(codeblock => hljs.highlightBlock(codeblock))
                // all links should open in a new window to not disturb the editor
                const linksWithTarget = this.$el.querySelectorAll('.adoc a')
                linksWithTarget.forEach(link => {
                    link.setAttribute('target', '_blank')
                    link.setAttribute('rel', 'noopener')
                })
            },
            renderContent(content) {
                this.$nextTick(() => {
                    this.highlight()
                })
                let html = asciidoctor().convert(content, asciidoctorOptions);
                html = xss(html, xssOptions)
                return html
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
                        await this.$store.dispatch('showErrorMessage', { error })
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
                        await this.$store.dispatch('showErrorMessage', { error })
                    } finally {
                        this.reloading = false
                    }
                }
            }
        }
    }
</script>
