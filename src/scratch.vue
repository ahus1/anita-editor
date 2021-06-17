<template>
    <div class="grid grid-cols-2" id="content">
        <div class="overflow-y-auto relative border-collapse box-border shadow-inner"
             style="min-height: 100vh; height: 100vh; max-height: 100vh;">
          <codemirror :options="cmOptions" @ready="onCmReady" @input="onCmCodeChange" />
        </div>
        <div class="overflow-y-auto relative border-collapse box-border shadow-inner p-4"
             style="min-height: 100vh; height: 100vh; max-height: 100vh;">
            <div>
                <div v-html="preview" class="adoc"></div>
            </div>
        </div>
    </div>
</template>

<style>
    #content .CodeMirror {
      height: 100%; /* use full height for editor */
    }
    .remote-caret {
      position: absolute;
      border-left: black;
      border-left-style: solid;
      border-left-width: 2px;
      height: 1em;
    }
    .remote-caret > div {
      position: relative;
      top: -1.05em;
      font-size: 13px;
      background-color: rgb(250, 129, 0);
      font-style: normal;
      font-weight: normal;
      line-height: normal;
      user-select: none;
      color: white;
      padding-left: 2px;
      padding-right: 2px;
      z-index: 3;
    }
</style>

<script>
import asciidoctor from '@asciidoctor/core';
import { codemirror } from 'vue-codemirror';
import xss from 'xss';
import { getDefaultWhiteList } from 'xss/lib/default';
// conversion will run on the client side, therefore select browser variant
import { mapActions, mapMutations } from 'vuex';
import * as Y from 'yjs';
import { CodemirrorBinding } from 'y-codemirror';
import { WebrtcProvider } from 'y-webrtc';
import { IndexeddbPersistence } from 'y-indexeddb';
import highlightJsExt from 'asciidoctor-highlight.js';
import kroki from '../node_modules/asciidoctor-kroki/dist/browser/asciidoctor-kroki';

require('codemirror-asciidoc');

const registry = asciidoctor().Extensions.create();
highlightJsExt.register(registry);
kroki.register(registry);

const asciidoctorOptions = {
  safe: 'unsafe',
  extension_registry: registry,
  attributes: { showtitle: 'true', icons: 'font', 'source-highlighter': 'highlightjs-ext' },
};

const xssOptions = {
  whiteList: getDefaultWhiteList(),
  onIgnoreTag(tag) {
    console.log(`ignoring tag "${tag}' as it is not on the whitelist`);
  },
  onIgnoreTagAttr(tag, name, value) {
    console.log(`ignoring tag/attr "${tag}/${name}" with value "${value}" as it is not on the whitelist`);
  },
};

// allow ID, title and class for all elements on the whitelist
Object.keys(xssOptions.whiteList).forEach((key) => xssOptions.whiteList[key].push('id', 'title', 'class'));

xssOptions.whiteList.ol.push('type');
xssOptions.whiteList.ul.push('type');
xssOptions.whiteList.code.push('data-lang');
xssOptions.whiteList.i.push('data-value');
xssOptions.whiteList.a.push('rel');
xssOptions.whiteList.kbd = [];

// columns have a setting of the width style, therefore allow style
xssOptions.whiteList.col.push('style');

export default {
  data() {
    return {
      content: '',
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
  beforeDestroy() {
    this.closeYjs();
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
    '$store.getters.activeScratch': {
      immediate: true,
      async handler() {
        await this.getContent();
      },
    },
  },
  computed: {
    preview() {
      return this.renderContent(this.content);
    },
  },
  methods: {
    ...mapActions(['loadFile']),
    ...mapMutations(['addScratch']),
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
    onCmReady(cm) {
      this.cm = cm;
      this.getContent();
    },
    onCmCodeChange(content) {
      this.content = content;
    },
    closeYjs() {
      if (this.yjsBinding) {
        this.yjsBinding.destroy();
        this.yjsBinding = null;
      }
      if (this.yjsWebrtcProvider) {
        this.yjsWebrtcProvider.destroy();
        this.yjsWebrtcProvider = null;
      }
      if (this.yjsUndoManager) {
        this.yjsUndoManager.destroy();
        this.yjsUndoManager = null;
      }
    },
    async getContent() {
      const { name } = this.$route.query;
      const { activeScratch } = this.$store.getters;
      if (name !== undefined) {
        if (!activeScratch || activeScratch.name !== name) {
          await this.addScratch({ name });
          await this.$router.replace({ name: 'scratch', query: {} });
        }
      } else if (activeScratch === undefined && this.$route.name === 'scratch') {
        await this.$router.replace({ name: 'welcome' });
        return;
      }
      if (this.cm && name === undefined) {
        this.closeYjs();
        if (activeScratch) {
          const room = `yjs-${activeScratch.name}`.replace(/\s/g, '').toLowerCase();
          const ydoc = new Y.Doc();
          this.yjsWebrtcProvider = new WebrtcProvider(room, ydoc);
          this.yjsWebrtcProvider.once('synced', () => {
            // console.log('syncted webrtc');
          });
          this.yjsIndexdbProvider = new IndexeddbPersistence(room, ydoc);
          this.yjsIndexdbProvider.once('synced', () => {
            // console.log('synced indexdb');
          });

          const yText = ydoc.getText('codemirror');
          const yjsUndoManager = new Y.UndoManager(yText);
          this.yjsUndoManager = yjsUndoManager;

          this.yjsBinding = new CodemirrorBinding(yText, this.cm, this.yjsWebrtcProvider.awareness, {
            yUndoManager: yjsUndoManager,
          });
        }
      }
    },
  },
};
</script>
