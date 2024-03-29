<template>
  <div class="grid grid-cols-2" id="content">
    <div
      class="overflow-y-auto relative border-collapse box-border shadow-inner"
      style="min-height: 100vh; height: 100vh; max-height: 100vh;">
      <!-- eslint-disable-next-line -->
          <codemirror v-model:value="content" :options="cmOptions" />
    </div>
    <div
      class="overflow-y-auto relative border-collapse box-border shadow-inner p-4"
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
        Unable to save contents as remote branch has been modified. Discard local changes and
        reload from server.
        <br />
      </template>
      <button
        type="submit"
        v-else-if="!conflicted && loggedin"
        class="text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        @click="opensavedialog"
        :class="{
          'bg-white': saveDialogOpen, 'bg-gray-500': !saveDialogOpen && !changed, 'bg-blue-500': !saveDialogOpen && changed, 'hover:bg-blue-700': !saveDialogOpen && changed, 'cursor-wait': saving, 'cursor-default': !changed && !saveDialogOpen, 'cursor-auto': saveDialogOpen,
        }"
        :disabled="saving || !changed || saveDialogOpen">
        {{ this.saving ? 'Saving...' : 'Save' }}
      </button>
      <button
        type="submit"
        class="text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        @click="reload"
        :class="{
          'bg-gray-500': !changed, 'bg-red-500': changed || conflicted, 'hover:bg-red-700': changed || conflicted, 'cursor-wait': reloading, 'cursor-default': !changed,
        }"
        :disabled="reloading || (!changed && !conflicted)">
        {{ this.reloading ? 'Reloading...' : 'Discard Changes' }}
      </button>
      <button
        type="submit"
        class="text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        @click="togglePreview"
        :disabled="!changed"
        :class="{
          'bg-gray-500': !changed, 'bg-blue-500': changed, 'hover:bg-blue-700': changed, 'cursor-default': !changed,
        }">
        Toggle Preview
      </button>
      <div class="relative">
        <form class="absolute z-10 fixed top-0 left-0 rounded p-6 border bg-white shadow" v-if="saveDialogOpen">
          <div class="mb-4">
            <p class="pb-2">Enter a commit message and press <i>Save</i> to commit your changes to GitHub.</p>
            <label class="block text-gray-700 text-sm font-bold mb-2" for="username">
              Commit message
            </label>
            <textarea
              class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="username"
              placeholder="Commit message"
              v-model="commitMessage" />
          </div>
          <div class="flex items-center justify-between">
            <button
              class="text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="button"
              :class="{
                'bg-gray-500': commitMessage.trim().length === 0, 'bg-blue-500': commitMessage.trim().length !== 0, 'hover:bg-blue-700': commitMessage.trim().length !== 0, 'cursor-not-allowed': commitMessage.trim().length === 0,
              }"
              @click="save"
              :disabled="commitMessage.trim().length === 0">
              Save
            </button>
            <button
              class="bg-white-500 hover:bg-blue-700 border-gray-400 border text-gray-500 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="button"
              @click="closesavedialog">
              Cancel
            </button>
          </div>
        </form>
      </div>
      <div>
        <div v-html="preview" class="adoc" />
      </div>
    </div>
  </div>
</template>

<style>
    #content .codemirror-container.height-auto {
      height: calc(100% - 10px); /* use full height for editor, but avoid vertical scrollbar */
    }
    #content .codemirror-container {
      font-size: 17px;
    }
</style>

<script>
import asciidoctor from '@asciidoctor/core';
import codemirror from 'codemirror-editor-vue3';
import 'codemirror-asciidoc';
import xss from 'xss';
import { diffChars } from 'diff';
import HtmlDiff from 'htmldiff-js';
import { mapActions, mapState } from 'vuex';
import highlightJsExt from 'asciidoctor-highlight.js';
import xssOptions from './whitelist';

const registry = asciidoctor().Extensions.create();
highlightJsExt.register(registry);
if (window.AsciidoctorKroki) {
  window.AsciidoctorKroki.register(registry);
}

const asciidoctorOptions = {
  safe: 'unsafe',
  extension_registry: registry,
  attributes: { showtitle: 'true', icons: 'font', 'source-highlighter': 'highlightjs-ext' },
};

export default {
  data() {
    return {
      saving: false,
      saveDialogOpen: false,
      commitMessage: '',
      reloading: false,
      mode: 0,
      cmOptions: {
        lineWrapping: true,
        lineNumbers: true,
        mode: 'asciidoc',
      },
    };
  },
  mounted() {
    this.highlight();
  },
  components: {
    codemirror,
  },
  watch: {
    $route: {
      immediate: true,
      async handler() {
        await this.getContent();
      },
    },
    '$store.getters.activeFile': {
      immediate: true,
      async handler() {
        await this.getContent();
      },
    },
  },
  computed: {
    ...mapState(['github']),
    preview() {
      if (this.mode === 0 || !this.changed) {
        return this.renderContent(this.content);
      } if (this.mode === 1) {
        const { activeFile } = this.$store.getters;
        return HtmlDiff.execute(
          this.renderContent(activeFile.original),
          this.renderContent(this.content),
        );
      }
      const { activeFile } = this.$store.getters;
      const diff = diffChars(activeFile.original, activeFile.content, {});
      let diffHtml = '';
      diff.forEach((part) => {
        // green for additions, red for deletions
        // grey for common parts
        const color = part.added ? '#acf2bd'
          : part.removed ? '#fdb8c0' : '';
        if (color !== '') {
          part.value = part.value.replace(/\r/g, '');
          part.value = part.value.replace(/\n/g, '&nbsp\n');
        }
        diffHtml += `<span style="background-color: ${color}">${part.value}</span>`;
      });
      diffHtml = `<pre>${diffHtml}</pre>`;
      return diffHtml;
    },
    changed() {
      const { activeFile } = this.$store.getters;
      if (activeFile === undefined) {
        return false;
      }
      return activeFile.content !== activeFile.original;
    },
    conflicted() {
      const { activeFile } = this.$store.getters;
      if (activeFile === undefined) {
        return false;
      }
      return activeFile.conflict === true;
    },
    canpush() {
      const { activeWorkspace } = this.$store.getters;
      if (activeWorkspace === undefined) {
        return false;
      }
      return activeWorkspace.permissions.push;
    },
    loggedin() {
      return this.$store.state.github.user !== undefined && this.$store.state.github.user !== null;
    },
    content: {
      get() {
        const { activeFile } = this.$store.getters;
        if (activeFile) {
          return activeFile.content;
        }
        return '';
      },
      set(value) {
        this.$store.commit('updateActiveFileContent', { content: value });
      },
    },
  },
  methods: {
    ...mapActions(['loadFile']),
    opensavedialog() {
      this.saveDialogOpen = true;
    },
    closesavedialog() {
      this.saveDialogOpen = false;
    },
    togglePreview() {
      this.mode = (this.mode + 1) % 3;
    },
    highlight() {
      // all links should open in a new window to not disturb the editor
      const linksWithTarget = this.$el.querySelectorAll('.adoc a');
      linksWithTarget.forEach((link) => {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener');
      });
    },
    renderContent(content) {
      this.$nextTick(() => {
        this.highlight();
      });
      let html = asciidoctor().convert(content, asciidoctorOptions);
      html = xss(html, xssOptions);
      return html;
    },
    async getContent() {
      const { file } = this.$route.query;
      this.saveDialogOpen = false;
      const { activeFile } = this.$store.getters;
      if (file !== undefined) {
        await this.loadFile({ file });
        if (Object.keys(this.$route.query).length !== 0) {
          await this.$router.replace({ name: 'edit' });
        }
      } else if (activeFile === undefined && this.$route.name === 'edit') {
        await this.$router.replace({ name: 'welcome' });
      }
    },
    async save() {
      // PUT /repos/:owner/:repo/contents/:path
      if (!this.saving) {
        this.saveDialogOpen = false;
        this.saving = true;
        try {
          await this.$store.dispatch('saveActiveFileContent', { message: this.commitMessage.trim() });
          this.commitMessage = '';
        } catch (error) {
          await this.$store.dispatch('showErrorMessage', { error });
        } finally {
          this.saving = false;
        }
      }
    },
    async reload() {
      if (!this.reloading) {
        this.reloading = true;
        this.saveDialogOpen = false;
        try {
          await this.$store.dispatch('reloadActiveFile');
        } catch (error) {
          await this.$store.dispatch('showErrorMessage', { error });
        } finally {
          this.reloading = false;
        }
      }
    },
  },
};
</script>
