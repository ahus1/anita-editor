import { createStore } from 'vuex';
import createPersistedState from 'vuex-persistedstate';
import axios from 'axios';
import Cookies from 'js-cookie';
import merge from 'three-way-merge';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';

const WEBRTC_ENABLED = true;

function b64EncodeUnicode(str) {
  // first we use encodeURIComponent to get percent-encoded UTF-8,
  // then we convert the percent encodings into raw bytes which
  // can be fed into btoa.
  return btoa(encodeURIComponent(str).replace(
    /%([0-9A-F]{2})/g,
    (match, p1) => String.fromCharCode(`0x${p1}`),
  ));
}

function b64DecodeUnicode(str) {
  // Going backwards: from bytestream, to percent-encoding, to original string.
  return decodeURIComponent(atob(str).split('').map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`).join(''));
}

function roomFromName(str) {
  return `yjs-${str}`.replace(/\s/g, '').toLowerCase();
}

function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// initialize color once per browser, so that the color stays the same after name changes
const myColor = getRandomColor();
const url = 'wss://anita-editor-eu.herokuapp.com/';

function initRoom(room, user) {
  const ydoc = new Y.Doc();
  let yjsWebrtcProvider;
  // use websocket provider to better support VPNs and mobile devices
  const yjsWsProvider = new WebsocketProvider(url, room, ydoc);
  yjsWsProvider.on('status', (event) => {
    console.log(`ws status ${room}: ${event.status}`); // logs "connected" or "disconnected"
  });
  if (WEBRTC_ENABLED) {
    yjsWebrtcProvider = new WebrtcProvider(room, ydoc, {
      awareness: yjsWsProvider.awareness,
      signaling: [url],
    });
    yjsWebrtcProvider.once('synced', () => {
      console.log(`synced webrtc ${room}`);
    });
    yjsWebrtcProvider.on('status', (event) => {
      console.log(`webrtc ${room}: ${event.status}`);
    });
  }
  const yjsIndexdbProvider = new IndexeddbPersistence(room, ydoc);
  yjsIndexdbProvider.once('synced', () => {
    console.log(`synced indexdb ${room}`);
  });
  const yText = ydoc.getText('codemirror');
  const yjsUndoManager = new Y.UndoManager(yText);
  if (user && user !== '') {
    if (yjsWebrtcProvider) {
      yjsWebrtcProvider.awareness.setLocalStateField('user', {
        name: user,
        color: getRandomColor(),
      });
    }
    yjsWsProvider.awareness.setLocalStateField('user', {
      name: user,
      color: getRandomColor(),
    });
  }
  return {
    ydoc,
    yjsWebrtcProvider,
    yjsWsProvider,
    yjsIndexdbProvider,
    yjsUndoManager,
    yText,
  };
}

const store = createStore({
  state: {
    github: {
      oauthState: undefined,
      token: undefined,
      ratelimit: {
        limit: undefined, remaining: undefined, reset: undefined,
      },
      user: undefined,
    },
    messages: [
      // dummy content for UI testing
      // {id: 0, message: "xxx"}
    ],
    currentMessageId: 0,
    activeWorkspace: undefined,
    workspaces: [],
    scratches: [],
    docs: [],
    activeScratch: undefined,
    scratchUserName: '',
  },
  getters: {
    activeFile(state) {
      if (state.workspaces.length === 0) {
        return undefined;
      }
      if (state.activeWorkspace === undefined || state.activeWorkspace === -1) {
        return undefined;
      }
      const workspace = state.workspaces[state.activeWorkspace];
      if (workspace.files.length === 0) {
        return undefined;
      }
      if (workspace.activeFile === undefined) {
        return undefined;
      }
      return workspace.files[workspace.activeFile];
    },
    activeScratch(state) {
      if (state.scratches.length === 0) {
        return undefined;
      }
      if (state.activeScratch === undefined || state.activeScratch >= state.scratches.length) {
        return undefined;
      }
      return state.scratches[state.activeScratch];
    },
    activeScratchDoc(state) {
      if (state.scratches.length === 0) {
        return undefined;
      }
      if (state.activeScratch === undefined) {
        return undefined;
      }
      return state.docs[state.activeScratch];
    },
    activeWorkspace(state) {
      if (state.workspaces.length === 0) {
        return undefined;
      }
      if (state.activeWorkspace === undefined) {
        return undefined;
      }
      return state.workspaces[state.activeWorkspace];
    },
    isDirty(state) {
      let dirty = false;
      workspaces:
      for (let i = 0; i < state.workspaces.length; i++) {
        const workspace = state.workspaces[i];
        for (let j = 0; j < workspace.files.length; j++) {
          const file = workspace.files[j];
          if (file.content !== file.original) {
            dirty = true;
            break workspaces;
          }
        }
      }
      return dirty;
    },
  },
  mutations: {
    loggedIn(state, token) {
      state.github.token = token;
    },
    ratelimit(state, limit) {
      state.github.ratelimit.limit = limit.limit;
      state.github.ratelimit.remaining = limit.remaining;
      state.github.ratelimit.reset = limit.reset;
    },
    githubUser(state, user) {
      state.github.user = user;
    },
    invalidCredentials(state) {
      state.github.token = null;
      state.github.use = null;
    },
    logout(state) {
      state.github.token = null;
      state.github.user = null;
    },
    prepareOauthState(state) {
      let key = '';
      let key32 = new Uint32Array(4);
      key32 = window.crypto.getRandomValues(key32);
      for (let keySegment = 0; keySegment < key32.length; keySegment++) {
        key += key32[keySegment].toString(16); // Convert int to hex
      }
      state.github.oauthState = key;
    },
    discardOauthState(state) {
      state.github.oauthState = undefined;
    },
    switchWorkspace(state, { owner, repo, branch }) {
      for (let i = 0; i < state.workspaces.length; ++i) {
        if (state.workspaces[i].owner === owner && state.workspaces[i].repo === repo
          && state.workspaces[i].branch === branch) {
          state.activeWorkspace = i;
          return;
        }
      }
      state.workspaces.push({
        owner, repo, branch, files: [], activeFile: undefined, permissions: {},
      });
      state.activeWorkspace = state.workspaces.length - 1;
    },
    clearWorkspace(state, { workspaceId }) {
      state.workspaces.splice(workspaceId, 1);
      if (state.activeWorkspace >= workspaceId) {
        state.activeWorkspace -= 1;
      }
      if (state.workspaces.length === 0) {
        state.activeWorkspace = undefined;
      }
    },
    clearFile(state, { workspaceId, fileId }) {
      const workspace = state.workspaces[workspaceId];
      workspace.files.splice(fileId, 1);
      if (workspace.activeFile > fileId) {
        workspace.activeFile += 1;
      }
      if (workspace.files.length === 0) {
        workspace.activeFile = undefined;
      }
    },
    leaveScratch(state, { scratchId }) {
      const { room } = state.scratches[scratchId];
      state.scratches.splice(scratchId, 1);
      if (state.docs[scratchId].yjsWebrtcProvider) {
        state.docs[scratchId].yjsWebrtcProvider.destroy();
      }
      state.docs[scratchId].yjsWsProvider.destroy();
      state.docs[scratchId].yjsIndexdbProvider.destroy();
      state.docs[scratchId].yjsUndoManager.destroy();
      state.docs.splice(scratchId, 1);
      indexedDB.deleteDatabase(room);
      if (state.activeScratch >= state.scratches.length) {
        state.activeScratch = state.scratches.length - 1;
      }
    },
    selectFile(state, { workspaceId, fileId }) {
      state.activeWorkspace = workspaceId;
      state.workspaces[workspaceId].activeFile = fileId;
    },
    selectScratch(state, { scratchId }) {
      state.activeScratch = scratchId;
      state.activeWorkspace = -1;
    },
    loadedFile(state, {
      owner, repo, branch, path, content, sha,
    }) {
      this.commit('switchWorkspace', { owner, repo, branch });
      for (let i = 0; i < state.workspaces[state.activeWorkspace].files.length; ++i) {
        const file = state.workspaces[state.activeWorkspace].files[i];
        if (file.path === path) {
          file.content = content;
          file.original = content;
          file.sha = sha;
          file.oldShas = {};
          file.conflict = false;
          state.workspaces[state.activeWorkspace].activeFile = i;
          return;
        }
      }
      state.workspaces[state.activeWorkspace].files.push({
        path, content, original: content, sha, conflict: false, oldShas: {},
      });
      state.workspaces[state.activeWorkspace].activeFile = 0;
    },
    loadedRepo(state, { owner, repo, permissions }) {
      for (let i = 0; i < state.workspaces.length; i++) {
        if (state.workspaces[i].owner === owner && state.workspaces[i].repo === repo) {
          state.workspaces[i].permissions = permissions;
        }
      }
    },
    updateActiveFileContent(state, { content }) {
      if (state.activeWorkspace === undefined) {
        return;
      }
      const workspace = state.workspaces[state.activeWorkspace];
      if (workspace.activeFile === undefined) {
        return;
      }
      const file = workspace.files[workspace.activeFile];
      file.content = content;
    },
    saveConflict(state, {
      owner, repo, branch, path, sha, content, conflict,
    }) {
      let found = false;
      state.workspaces.forEach((workspace) => {
        if (workspace.owner === owner && workspace.repo === repo && workspace.branch === branch) {
          workspace.files.forEach((file) => {
            if (file.path === path) {
              if (sha) {
                if (file.sha === sha) {
                  // the retrieved file has same contents like the on in the editor
                  file.oldShas = {};
                  file.conflict = false;
                } else if (file.oldShas[sha] === undefined) {
                  const merged = merge(file.content, file.original, content);
                  if (merged.conflict) {
                    file.conflict = true;
                  } else {
                    file.sha = sha;
                    file.original = content;
                    file.content = merged.joinedResults();
                  }
                } else {
                  file.conflict = (file.oldShas[sha] === undefined);
                }
              }
              if (conflict === true) {
                file.conflict = conflict;
              }
              found = true;
            }
          });
        }
      });
      if (!found) {
        console.error('can not record save conflict', {
          owner, repo, branch, path,
        });
      }
    },
    saveComplete(state, {
      owner, repo, branch, path, sha, content,
    }) {
      let found = false;
      state.workspaces.forEach((workspace) => {
        if (workspace.owner === owner && workspace.repo === repo && workspace.branch === branch) {
          workspace.files.forEach((file) => {
            if (file.path === path) {
              file.oldShas[file.sha] = true;
              file.sha = sha;
              file.original = content;
              found = true;
            }
          });
        }
      });
      if (!found) {
        console.error('can not record save conflict', {
          owner, repo, branch, path,
        });
      }
    },
    addErrorMessage(state, { message }) {
      state.currentMessageId += 1;
      state.messages.push({ message, id: state.currentMessageId });
    },
    removeErrorMessage(state, { id }) {
      for (let i = 0; i < state.messages.length; ++i) {
        if (state.messages[i].id === id) {
          state.messages.splice(i, 1);
          break;
        }
      }
    },
    addScratch(state, { name }) {
      const room = roomFromName(name);
      for (let i = 0; i < state.scratches.length; ++i) {
        if (state.scratches[i].room === room) {
          state.activeScratch = i;
          state.activeWorkspace = -1;
          return;
        }
      }
      state.activeScratch = state.scratches.push({
        name,
        room,
      }) - 1;
      state.activeWorkspace = -1;
      state.docs.push(initRoom(roomFromName(name), state.scratchUserName));
    },
    setScratchUser(state, { name }) {
      state.scratchUserName = name;
      for (let i = 0; i < state.docs.length; ++i) {
        if (state.docs[i].yjsWebrtcProvider) {
          state.docs[i].yjsWebrtcProvider.awareness.setLocalStateField('user', {
            name,
            color: myColor,
          });
        }
        state.docs[i].yjsWsProvider.awareness.setLocalStateField('user', {
          name,
          color: getRandomColor(),
        });
      }
    },
  },
  actions: {
    async login(context, { code, state }) {
      if (context.state.github.oauthState !== state) {
        throw new Error("unable to authenticate, auth state doesn't match");
      }
      const token = await axios.post(
        '.netlify/functions/token',
        {
          code,
          state,
        },
      );
      context.commit('discardOauthState');
      if (token.data.access_token && token.data.token_type) {
        context.commit('loggedIn', {
          access_token: token.data.access_token,
        });
        const user = await axios.get('https://api.github.com/user');
        context.commit('githubUser', user.data);
        const cache = {};
        for (let i = 0; i < context.state.workspaces.length; ++i) {
          const workspace = context.state.workspaces[i];

          // avoid calling GitHub multiple times for different branches of same repository
          if (cache[`${workspace.owner}/${workspace.repo}`] !== undefined) {
            continue;
          }
          cache[`${workspace.owner}/${workspace.repo}`] = true;

          const responseRepo = await axios.get(`https://api.github.com/repos/${workspace.owner}/${workspace.repo}`);
          context.commit('loadedRepo', {
            owner: workspace.owner,
            repo: workspace.repo,
            permissions: { push: responseRepo.data.permissions.push },
          });
        }
      }
    },
    async refreshUser(context) {
      if (context.state.github.token) {
        const user = await axios.get('https://api.github.com/user');
        context.commit('githubUser', user.data);
      }
    },
    addScratch(context, { name }) {
      context.commit('addScratch', { name });
    },
    showErrorMessage(context, { message, error }) {
      if (message !== undefined) {
        context.commit('addErrorMessage', { message });
      } else if (error !== undefined) {
        let m = '';
        if (error.response) {
          if (error.response.data.message !== error.response.statusText) {
            m = error.response.data.message;
          } else {
            m = `${error.response.statusText} (${error.response.status})`;
          }
        } else {
          m = error;
        }
        context.commit('addErrorMessage', { message: m });
        console.log(m, error);
      }
      const id = context.state.currentMessageId;
      window.setTimeout(() => {
        context.commit('removeErrorMessage', { id });
      }, 10000);
    },
    async loadFile(context, { file }) {
      // https://github.com/ahus1/asciidoctor-deepdive/blob/master/README.adoc
      // https://github.com/asciidoctor/asciidoctor-intellij-plugin/edit/master/doc/users-guide/modules/ROOT/pages/index.adoc
      // eslint-disable-next-line prefer-regex-literals
      const regex = new RegExp('https://github.com/(?<owner>[^/]*)/(?<repo>[^/]*)/(blob|edit)/(?<branch>[^/]*)/(?<path>.*)').exec(file);
      if (!regex) {
        return;
      }
      const {
        groups: {
          owner, repo, branch, path,
        },
      } = regex;
      // GET /repos/:owner/:repo/contents/:path
      // eslint-disable-next-line max-len
      // adding a timestamp to avoid receiving a cached response
      // (GitHub seems to cache up to 10 seconds)
      const responseFile = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}&ts=${Date.now()}`);
      if (responseFile.data.encoding === 'base64') {
        const content = b64DecodeUnicode(responseFile.data.content);
        context.commit('loadedFile', {
          owner, repo, branch, path, content, sha: responseFile.data.sha,
        });
        if (context.state.github.user) {
          const responseRepo = await axios.get(`https://api.github.com/repos/${owner}/${repo}`);
          context.commit('loadedRepo', {
            owner,
            repo,
            permissions: { push: responseRepo.data.permissions.push },
          });
        }
      }
    },
    async reloadActiveFile(context) {
      if (context.state.activeWorkspace === undefined) {
        return false;
      }
      const workspace = context.state.workspaces[context.state.activeWorkspace];
      if (workspace.activeFile === undefined) {
        return false;
      }
      const file = workspace.files[workspace.activeFile];
      const responseFile = await axios.get(`https://api.github.com/repos/${workspace.owner}/${workspace.repo}/contents/${file.path}?ref=${workspace.branch}`);
      if (responseFile.data.encoding === 'base64') {
        const content = b64DecodeUnicode(responseFile.data.content);
        context.commit('loadedFile', {
          owner: workspace.owner,
          repo: workspace.repo,
          branch: workspace.branch,
          path: file.path,
          content,
          sha: responseFile.data.sha,
        });
        if (context.state.github.user) {
          const responseRepo = await axios.get(`https://api.github.com/repos/${workspace.owner}/${workspace.repo}`);
          context.commit('loadedRepo', {
            owner: workspace.owner,
            repo: workspace.repo,
            permissions: { push: responseRepo.data.permissions.push },
          });
        }
      }
      return true;
    },
    async checkConflictActiveFile(context) {
      if (context.state.activeWorkspace === undefined) {
        return false;
      }
      const workspace = context.state.workspaces[context.state.activeWorkspace];
      if (workspace.activeFile === undefined) {
        return false;
      }
      const file = workspace.files[workspace.activeFile];
      const response = await axios.get(`https://api.github.com/repos/${workspace.owner}/${workspace.repo}/contents/${file.path}?ref=${workspace.branch}`);
      if (response.data.encoding === 'base64') {
        const content = b64DecodeUnicode(response.data.content);
        context.commit('saveConflict', {
          owner: workspace.owner,
          repo: workspace.repo,
          branch: workspace.branch,
          path: file.path,
          sha: response.data.sha,
          content,
        });
      }
      return true;
    },
    async saveActiveFileContent(context, { message }) {
      if (context.state.activeWorkspace === undefined) {
        return false;
      }
      const workspace = context.state.workspaces[context.state.activeWorkspace];
      if (workspace.activeFile === undefined) {
        return false;
      }
      const file = workspace.files[workspace.activeFile];
      const newContent = file.content;
      try {
        const response = await axios.put(
          `https://api.github.com/repos/${workspace.owner}/${workspace.repo}/contents/${file.path}`,
          {
            message,
            content: b64EncodeUnicode(newContent),
            sha: file.sha,
          },
        );
        context.commit('saveComplete', {
          owner: workspace.owner,
          repo: workspace.repo,
          branch: workspace.branch,
          path: file.path,
          sha: response.data.content.sha,
          content: newContent,
        });
      } catch (error) {
        if (error.response && error.response.status === 409) {
          context.commit('saveConflict', {
            owner: workspace.owner,
            repo: workspace.repo,
            branch: workspace.branch,
            path: file.path,
            conflict: true,
          });
          await context.dispatch('showErrorMessage', { message: 'Remote file has been changed while editing it. Results not saved.' });
        } else {
          await context.dispatch('showErrorMessage', { error });
        }
        return false;
      }
      return true;
    },
  },
  plugins: [
    createPersistedState({
      paths: ['activeWorkspace', 'workspaces', 'activeScratch', 'scratches', 'scratchUserName'],
      rehydrated: (s) => {
        // state "schema" migration to clean out old contents and set defaults for old properties
        s.state.workspaces.forEach((workspace) => {
          if (workspace.permissions === undefined) {
            workspace.permissions = {};
          }
          workspace.files.forEach((file) => {
            if (file.oldShas === undefined) {
              file.oldShas = {};
            }
            if (file.lastReadSha !== undefined) {
              file.lastReadSha = undefined;
            }
          });
        });
        s.state.docs = [];
        s.state.scratches.forEach((scratch) => {
          if (scratch.room === undefined) {
            scratch.room = roomFromName(scratch.name);
          }
          s.state.docs.push(initRoom(scratch.room, s.state.scratchUserName));
        });
      },
    }),
    // using session storage this would be only per tab, not per browser instance
    // createPersistedState({storage: window.sessionStorage, paths: ["github"]}),
    createPersistedState({
      storage: {
        getItem: (key) => Cookies.get(key),
        // Please see https://github.com/js-cookie/js-cookie#json, on how to handle JSON.
        setItem: (key, value) => Cookies.set(key, value, {
          expires: 1, // expire after 1 day
          secure: window.location.href.startsWith('https://'),
        }),
        removeItem: (key) => Cookies.remove(key),
      },
      fetchBeforeUse: true,
      paths: ['github'],
    }),
  ],
});

let unload = false;

window.addEventListener('storage', (event) => {
  // when using Safari, the current window receives its own events
  // (as opposed to Chrome and Firefox)
  // therefore check this windows is in the background (doesn't have focus) before unloading)
  if (event.key === 'vuex' && !document.hasFocus()) {
    unload = true;
    window.location.href = '/changed.html';
  }
});

window.addEventListener('beforeunload', (e) => {
  if (!store.getters.isDirty || store.state.github.oauthState !== undefined || unload) {
    return undefined;
  }

  // message will never show, browser will show a generic (translated) message in case of Chrome
  const confirmationMessage = 'It looks like you have been changed a file but haven\'t saved yet. '
    + 'If you leave before saving, your changes will only be store locally in the browser';

  (e || window.event).returnValue = confirmationMessage; // Gecko + IE
  return confirmationMessage; // Gecko + Webkit, Safari, Chrome etc.
});

export default store;
