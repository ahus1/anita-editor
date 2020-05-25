import Vue from 'vue'
import Vuex from 'vuex'
import createPersistedState from 'vuex-persistedstate'
import axios from "axios";

Vue.use(Vuex)

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

export const store = new Vuex.Store({
    state: {
        github: {
            oauthState: undefined,
            token: undefined,
            ratelimit: {
                limit: undefined, remaining: undefined, reset: undefined
            },
            user: undefined
        },
        activeWorkspace: 0,
        workspaces: []
    },
    getters: {
        activeFile: function (state) {
            if (state.workspaces.length === 0) {
                return undefined
            }
            let workspace = state.workspaces[state.activeWorkspace]
            if (workspace.files.length === 0) {
                return undefined;
            }
            return workspace.files[workspace.activeFile]
        }
    },
    mutations: {
        loggedIn(state, token) {
            Vue.set(state.github, 'token', token)
        },
        ratelimit(state, limit) {
            state.github.ratelimit.limit = limit.limit;
            state.github.ratelimit.remaining = limit.remaining;
            state.github.ratelimit.reset = limit.reset;
        },
        githubUser(state, user) {
            Vue.set(state.github, 'user', user)
        },
        invalidCredentials(state) {
            Vue.set(state.github, 'token', null)
            Vue.set(state.github, 'user', null)
        },
        logout(state) {
            Vue.set(state.github, 'token', null)
            Vue.set(state.github, 'user', null)
        },
        prepareOauthState(state) {
            let key = ""
            let key32 = new Uint32Array(4);
            key32 = window.crypto.getRandomValues(key32);
            for (let keySegment = 0; keySegment < key32.length; keySegment++) {
                key += key32[keySegment].toString(16); // Convert int to hex
            }
            state.github.oauthState = key
        },
        switchWorkspace(state, {owner, repo, branch}) {
            for(let i = 0; i < state.workspaces.length; ++i) {
                if (state.workspaces[i].owner === owner && state.workspaces[i].repo === repo && state.workspaces[i].branch === branch) {
                    state.activeWorkspace = i
                    return
                }
            }
            state.workspaces.push({owner, repo, branch, files: [], activeFile: undefined})
            state.workspaces.activeWorkspace = 0
        },
        clearWorkspace(state, {workspaceId}) {
            state.workspaces.splice(workspaceId, 1)
            if (state.activeWorkspace > workspaceId) {
                state.activeWorkspace --;
            }
            if (state.workspaces.length === 0) {
                state.activeWorkspace = undefined
            }
        },
        clearFile(state, {workspaceId, fileId}) {
            const workspace = state.workspaces[workspaceId]
            workspace.files.splice(fileId, 1)
            if (workspace.activeFile > fileId) {
                workspace.activeFile --;
            }
            if (workspace.files.length === 0) {
                workspace.activeFile = undefined
            }
        },
        selectFile(state, {workspaceId, fileId}) {
            state.activeWorkspace = workspaceId;
            state.workspaces[workspaceId].activeFile = fileId
        },
        loadedFile(state, {owner, repo, branch, path, content, sha}) {
            this.commit('switchWorkspace', {owner, repo, branch})
            for(let i = 0; i < state.workspaces[state.activeWorkspace].files.length; ++i) {
                const file = state.workspaces[state.activeWorkspace].files[i]
                if (file.path === path) {
                    file.content = content
                    file.original = content
                    file.sha = sha
                    file.conflict = false
                    state.workspaces[state.activeWorkspace].activeFile = i
                    return
                }
            }
            state.workspaces[state.activeWorkspace].files.push({path, content, original: content, sha, conflict: false})
            state.workspaces[state.activeWorkspace].activeFile = 0
        },
        updateActiveFileContent(state, {content}) {
            if (state.activeWorkspace === undefined) {
                return;
            }
            const workspace = state.workspaces[state.activeWorkspace]
            if (workspace.activeFile === undefined) {
                return;
            }
            const file = workspace.files[workspace.activeFile]
            Vue.set(file, 'content', content)
        },
        saveConflict(state, {owner, repo, branch, path, conflict}) {
            let found = false;
            state.workspaces.forEach(workspace => {
                if (workspace.owner === owner && workspace.repo === repo && workspace.branch === branch) {
                    workspace.files.forEach(file => {
                        if (file.path === path) {
                            file.conflict = conflict
                            found = true
                        }
                    })
                }
            })
            if (!found) {
                console.error('can not record save conflict', {owner, repo, branch, path})
            }
        },
        saveComplete(state, {owner, repo, branch, path, sha, content}) {
            let found = false;
            state.workspaces.forEach(workspace => {
                if (workspace.owner === owner && workspace.repo === repo && workspace.branch === branch) {
                    workspace.files.forEach(file => {
                        if (file.path === path) {
                            file.sha = sha
                            file.original = content
                            found = true
                        }
                    })
                }
            })
            if (!found) {
                console.error('can not record save conflict', {owner, repo, branch, path})
            }
        }
    },
    actions: {
        async login(context, {code, state}) {
            if (context.state.github.oauthState !== state) {
                throw "unable to authenticate, auth state doesn't match"
            }
            let token = await axios.post(`/token`,
                {
                    "code": code,
                    "state": state
                })
            if (token.data.access_token && token.data.token_type) {
                context.commit('loggedIn', {
                    access_token: token.data.access_token
                })
                let user = await axios.get(`https://api.github.com/user`)
                context.commit('githubUser', user.data)
            }
        },
        async refreshUser(context) {
            if (context.state.github.token) {
                let user = await axios.get(`https://api.github.com/user`)
                context.commit('githubUser', user.data)
            }
        },
        async loadFile(context, {file}) {
            // https://github.com/ahus1/asciidoctor-deepdive/blob/master/README.adoc
            // https://github.com/asciidoctor/asciidoctor-intellij-plugin/edit/master/doc/users-guide/modules/ROOT/pages/index.adoc
            let regex = new RegExp("https://github.com/(?<owner>[^/]*)/(?<repo>[^/]*)/(blob|edit)/(?<branch>[^/]*)/(?<path>.*)").exec(file);
            if (!regex) {
                return
            }
            const {groups: {owner, repo, branch, path}} = regex
            // GET /repos/:owner/:repo/contents/:path
            const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`)
            if (response.data.encoding === 'base64') {
                const content = b64DecodeUnicode(response.data.content)
                context.commit('loadedFile', {owner, repo, branch, path, content, sha: response.data.sha})
            }
        },
        async reloadActiveFile(context) {
            if (context.state.activeWorkspace === undefined) {
                return false;
            }
            const workspace = context.state.workspaces[context.state.activeWorkspace]
            if (workspace.activeFile === undefined) {
                return false;
            }
            const file = workspace.files[workspace.activeFile]
            const response = await axios.get(`https://api.github.com/repos/${workspace.owner}/${workspace.repo}/contents/${file.path}?ref=${workspace.branch}`)
            if (response.data.encoding === 'base64') {
                const content = b64DecodeUnicode(response.data.content)
                context.commit('loadedFile', {owner: workspace.owner, repo: workspace.repo, branch: workspace.branch, path: file.path, content, sha: response.data.sha})
            }
        },
        async checkConflictActiveFile(context) {
            if (context.state.activeWorkspace === undefined) {
                return false;
            }
            const workspace = context.state.workspaces[context.state.activeWorkspace]
            if (workspace.activeFile === undefined) {
                return false;
            }
            const file = workspace.files[workspace.activeFile]
            const response = await axios.get(`https://api.github.com/repos/${workspace.owner}/${workspace.repo}/contents/${file.path}?ref=${workspace.branch}`)
            if (response.data.encoding === 'base64') {
                context.commit('saveConflict', {
                    owner: workspace.owner,
                    repo: workspace.repo,
                    branch: workspace.branch,
                    path: file.path,
                    conflict: file.sha !== response.data.sha
                })
            }
        },
        async saveActiveFileContent(context) {
            if (context.state.activeWorkspace === undefined) {
                return false;
            }
            const workspace = context.state.workspaces[context.state.activeWorkspace]
            if (workspace.activeFile === undefined) {
                return false;
            }
            const file = workspace.files[workspace.activeFile]
            const newContent = file.content
            try {
                const response = await axios.put(`https://api.github.com/repos/${workspace.owner}/${workspace.repo}/contents/${file.path}`,
                    {
                        "message": "a new commit message",
                        "content": b64EncodeUnicode(newContent),
                        "sha": file.sha
                    })
                context.commit('saveComplete', {owner: workspace.owner, repo: workspace.repo, branch: workspace.branch, path: file.path, sha: response.data.content.sha, content: newContent})
                return true;
            } catch (error) {
                if (error.response && error.response.status === 409) {
                    context.commit('saveConflict', {owner: workspace.owner, repo: workspace.repo, branch: workspace.branch, path: file.path, conflict: true})
                } else {
                    throw error
                }
            }
        }
    },
    plugins: [
        createPersistedState({paths: ["activeWorkspace", "workspaces"]}),
        createPersistedState({storage: window.sessionStorage, paths: ["github"]})
    ]
})

