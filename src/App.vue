<template>
    <div class="flex">
        <div id="sidebar" class="w-1/4 lg:w-1/6 p-4 overflow-y-auto overflow-x-hidden">
            <nav>
                <ol>
                    <li>
                        <router-link to="/">Welcome</router-link>
                    </li>
                </ol>
                <div class="pt-4" v-for="(workspace, windex) in workspaces" :key="workspace.owner + workspace.repo + workspace.branch" style="white-space: nowrap">
                    <div>
                        <button class="font-bold rounded cursor-pointer" @click="clearWorkspace(windex)"
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
                            'router-link-exact-active': activefile.workspaceId === windex && activefile.fileId === findex && $route.name === 'edit',
                            'italic': file.content !== file.original
                           }"
                           @click="selectFileForEditor({workspaceId: windex, fileId: findex})" :title="file.path">{{file.path}}</a><br>
                    </div>
                </div>
                <div class="pt-4" v-if="github.user">
                    User:
                    {{github.user.login}}
                    ({{github.user.name}})
                    <br>
                    <router-link to="/logout">Logout</router-link>
                </div>
                <div class="pt-4" v-else>
                    <router-link to="/login">Please log-in to save your work</router-link>
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
import { mapMutations, mapState, mapActions } from 'vuex';

export default {
  data() {
    return {};
  },
  computed: {
    ...mapState(['github', 'workspaces', 'messages']),
    activefile() {
      return {
        workspaceId: this.$store.state.activeWorkspace,
        fileId: this.$store.state.workspaces[this.$store.state.activeWorkspace].activeFile,
      };
    },
  },
  methods: {
    ...mapMutations(['clearWorkspace', 'clearFile', 'selectFile', 'removeErrorMessage']),
    ...mapActions(['checkConflictActiveFile']),
    selectFileForEditor(o) {
      this.selectFile(o);
      if (this.$route.name !== 'edit') {
        this.$router.push({ name: 'edit' });
      }
      this.checkConflictActiveFile();
    },
  },
};
</script>
