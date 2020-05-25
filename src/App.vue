<template>
    <div class="flex">
        <div id="sidebar" class="w-1/4 lg:w-1/6 p-4 overflow-y-auto overflow-x-hidden">
            <nav>
                <ol>
                    <li>
                        <router-link to="/">Welcome</router-link>
                    </li>
                </ol>
                <div class="pt-4" v-for="(workspace, windex) in workspaces" style="white-space: nowrap">
                    <div>
                        <button class="font-bold rounded cursor-pointer" @click="clearWorkspace(windex)"
                                title="clear workspace with all files">&times;
                        </button>
                        <span :title="workspace.owner + '/' + workspace.repo + '/' + workspace.branch">{{workspace.owner}}/{{workspace.repo}}/{{workspace.branch}}</span>
                    </div>
                    <div class="px-4" v-for="(file, findex) in workspace.files">
                        <button class="font-bold rounded" @click="clearFile({workspaceId: windex, fileId: findex})"
                                title="clear file">&times;
                        </button>
                        <a class="cursor-pointer"
                           :class="{
                            'router-link-exact-active': activefile.workspaceId === windex && activefile.fileId === findex && $route.name === 'edit',
                            'italic': file.content !== file.original
                           }"
                           title="open file in editor"
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
            </nav>
        </div>
        <div id="content-wrapper" class="w-3/4 lg:w-5/6">
            <router-view></router-view>
        </div>
    </div>
</template>
<script>
    import {mapMutations, mapState, mapActions} from 'vuex'

    export default {
        data: function () {
            return {}
        },
        computed: {
            ...mapState(["github", "workspaces"]),
            activefile() {
                return {
                    workspaceId: this.$store.state.activeWorkspace,
                    fileId: this.$store.state.workspaces[this.$store.state.activeWorkspace].activeFile
                };
            }
        },
        methods: {
            ...mapMutations(["clearWorkspace", "clearFile", "selectFile"]),
            ...mapActions(["checkConflictActiveFile"]),
            selectFileForEditor(o) {
                this.selectFile(o)
                if (this.$route.name !== 'edit') {
                    this.$router.push({name: 'edit'})
                }
                this.checkConflictActiveFile()
            },
        }
    }
</script>
