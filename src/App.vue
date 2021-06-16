<template>
    <div class="flex" id="app">
        <div id="sidebar" class="w-48 p-4 overflow-y-auto overflow-x-hidden">
            <nav>
                <ol>
                    <li>
                        <router-link id="nav_welcome" to="/">Welcome</router-link>
                    </li>
                </ol>
                <div class="pt-4" v-for="(workspace, windex) in workspaces" :key="workspace.owner + workspace.repo + workspace.branch" style="white-space: nowrap">
                    <div>
                        <button class="font-bold rounded cursor-pointer" @click="clearWorkspace({ workspaceId: windex})"
                                title="clear workspace with all files">&times;
                        </button>
                        <span :title="workspace.owner + '/' + workspace.repo + '/' + workspace.branch">{{workspace.owner}}/{{workspace.repo}}/{{workspace.branch}}</span>
                    </div>
                    <div class="px-4" v-for="(file, findex) in workspace.files" :key="file.path">
                        <button class="font-bold rounded" @click="clearFile({workspaceId: windex, fileId: findex})"
                                title="clear file">&times;
                        </button>
                        <a class="cursor-pointer"
                           :class="{
                            'router-link-exact-active': activefile && activefile.workspaceId === windex && activefile.fileId === findex && $route.name === 'edit',
                            'italic': file.content !== file.original
                           }"
                           @click="selectFileForEditor({workspaceId: windex, fileId: findex})" :title="file.path">{{file.path}}</a><br>
                    </div>
                </div>
              <div class="pt-4" v-for="(scratch, sindex) in scratches" :key="scratch.name" style="white-space: nowrap">
                <button class="font-bold rounded cursor-pointer" @click="leaveScratch({ scratchId: sindex})"
                        title="leave scratch">&times;
                </button>
                <a class="cursor-pointer"
                   :class="{
                            'router-link-exact-active': activeScratch && activeScratch === scratch && $route.name === 'scratch'
                           }"
                   :title="scratch.name"
                   @click="selectScratchForEditor({scratchId: sindex})">{{scratch.name}}</a><br>
              </div>
                <div class="pt-4" v-if="github.user">
                    User:
                    {{github.user.login}}
                    ({{github.user.name}})
                    <br>
                    <router-link to="/logout">Logout</router-link>
                </div>
                <div class="pt-4" v-else>
                    <router-link to="/login" v-show="workspaces.length > 0">Please log-in to save your work</router-link>
                </div>
                <div class="pt-10">
                    <a href="https://github.com/ahus1/asciidoc-editor" target="_blank" rel="noopener">Source (GitHub)</a>
                </div>
                <div>
                    <a href="https://www.ahus1.de/aboutme" target="_blank" rel="noopener">About me</a>
                </div>
                <div>
                    <a href="https://www.ahus1.de/impressum" target="_blank" rel="noopener">Imprint</a>
                </div>
            </nav>
            <div class="z-10 fixed top-0 right-0 pt-20 pr-3" v-if="messages.length > -1">
                <div v-for="message in messages" :key="message.id" class="relative mb-2 p-2 pr-5 rounded bg-red-400 font-bold shadow">
                    <div class="absolute top-0 right-0 pr-1 cursor-pointer" @click="removeErrorMessage({id: message.id})">
                        &times;
                    </div>
                    {{ message.message }}
                </div>
            </div>
        </div>
        <div id="content-wrapper" class="w-3/4 lg:w-5/6">
            <router-view></router-view>
        </div>
    </div>
</template>
<script>
import {
  mapActions, mapGetters, mapMutations, mapState,
} from 'vuex';

export default {
  data() {
    return {};
  },
  computed: {
    ...mapState(['github', 'workspaces', 'messages', 'scratches']),
    ...mapGetters(['activeScratch']),
    activefile() {
      if (this.$store.state.activeWorkspace === undefined) {
        return undefined;
      }
      if (this.$store.state.activeWorkspace >= this.$store.state.workspaces.length) {
        return undefined;
      }
      return {
        workspaceId: this.$store.state.activeWorkspace,
        fileId: this.$store.state.workspaces[this.$store.state.activeWorkspace].activeFile,
      };
    },
  },
  watch: {
    $route: {
      immediate: true,
      handler(to) {
        console.log(to);
        if (to.path.startsWith('/http')) {
          this.$router.push({ name: 'edit', query: { file: to.path.substr(1) } });
        }
      },
    },
  },
  methods: {
    ...mapMutations(['clearWorkspace', 'clearFile', 'selectFile', 'selectScratch', 'removeErrorMessage', 'leaveScratch']),
    ...mapActions(['checkConflictActiveFile']),
    selectFileForEditor(o) {
      this.selectFile(o);
      if (this.$route.name !== 'edit') {
        this.$router.push({ name: 'edit' });
      }
      this.checkConflictActiveFile();
    },
    selectScratchForEditor(scratchId) {
      this.selectScratch(scratchId);
      if (this.$route.name !== 'scratch') {
        this.$router.push({ name: 'scratch' });
      }
    },
  },
};
</script>
