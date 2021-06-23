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
import { mapActions, mapGetters, mapMutations } from 'vuex';
import { CodemirrorBinding } from 'y-codemirror';
import highlightJsExt from 'asciidoctor-highlight.js';

require('codemirror-asciidoc');

const registry = asciidoctor().Extensions.create();
highlightJsExt.register(registry);
if (navigator.userAgent.toLowerCase().indexOf('safari') === -1 || navigator.userAgent.toLowerCase().indexOf('chrome') > -1) {
  const kroki = require('../node_modules/asciidoctor-kroki/dist/browser/asciidoctor-kroki');
  kroki.register(registry);
}

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
        const { name } = this.$route.params;
        if (name !== undefined && (this.activeScratch === undefined || this.activeScratch.name !== name)) {
          await this.addScratch({ name });
        }
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
    ...mapGetters(['activeScratch']),
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
      // this will debounce changes in the editor for the preview
      // the first character will render immediately, the next character will be delayed for some milliseconds
      if (this.content !== content || this.delay) {
        if (this.delay) {
          this.delayedContent = content;
        } else {
          this.content = content;
          this.delay = window.setTimeout(() => {
            if (this.delayedContent && this.delayedContent !== this.content) {
              this.content = this.delayedContent;
              this.delayedContent = undefined;
            }
            this.delay = undefined;
          }, 200);
        }
      }
    },
    closeYjs() {
      if (this.yjsBinding) {
        this.yjsBinding.destroy();
        this.yjsBinding = null;
      }
    },
    async getContent() {
      if (this.activeScratch === undefined && this.$route.name === 'scratch') {
        await this.$router.replace({ name: 'welcome' });
        return;
      }
      if (this.cm) {
        this.closeYjs();
        const { activeScratchDoc } = this.$store.getters;
        if (activeScratchDoc) {
          let awareness;
          if (activeScratchDoc.yjsWsProvider) {
            awareness = activeScratchDoc.yjsWsProvider.awareness;
          } else {
            awareness = activeScratchDoc.yjsWebrtcProvider.awareness;
          }
          this.yjsBinding = new CodemirrorBinding(activeScratchDoc.yText, this.cm, awareness, {
            yUndoManager: activeScratchDoc.yjsUndoManager,
          });
        }
      }
    },
  },
};
</script>
