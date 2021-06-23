<template>
    <div class="overflow-y-auto border-collapse box-border shadow-inner p-4"
         style="min-height: 100vh; height: 100vh; max-height: 100vh;">
        <div v-html="content" class="adoc"></div>
      <form class="w-full border-2 p-4 rounded mb-6" @keydown.enter.capture="joinScratch">
        <div class="adoc">
          <div class="paragraph">
            <p>Enter the name of a scratch file you'll be able to edit collaboratively.
              You're changes will be stored locally <b>AND</b> will be transmitted to all users that are online at the same time editing a scratch with the same name.
              This will share also your editing history, therefore please choose a unique name, or edit only public content.
              Use this for a collaborative editing session.
            </p>
          </div>
        </div>
        <div class="mb-2">
            <label class="block tracking-wide text-gray-700 text-xs font-bold mb-2" for="owner">
              Scratch Name
            </label>
            <div class="relative">
              <input autocomplete="off" class="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 pr-8 leading-tight focus:outline-none focus:bg-white focus:border-gray-500" id="scratch" type="text" placeholder="scratch name"
                     v-model="scratch" :title="scratch">
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700" v-if="owners.length > 0">
                <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
          </div>
        </div>
        <button type="button" class="text-white font-bold mt-2 py-2 px-4 rounded"
                :class="{ 'bg-gray-500': !inputScratchReady, 'bg-blue-500': inputScratchReady, 'cursor-not-allowed': !inputScratchReady, 'cursor-default': !inputScratchReady }"
                :disabled="!inputScratchReady"
                @click="joinScratch" id="joinScratch">
          Join
        </button>
      </form>
    <form class="w-full border-2 p-4 rounded" @keydown.enter.capture="loadGithub">
      <div class="adoc">
        <div class="paragraph">
          <p>Enter details of a GitHub repo to edit an AsciiDoc file in that repo.
            You're changes will be stored locally. If you have push permissions on that repo, you'll be able to commit your changes.
          </p>
        </div>
      </div>
      <div class="flex flex-wrap -mx-3 mb-2">
        <div class="w-full md:w-1/4 px-3 mb-6 md:mb-0">
          <label class="block tracking-wide text-gray-700 text-xs font-bold mb-2" for="owner">
            Owner
          </label>
          <div class="relative">
            <input autocomplete="off" class="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 pr-8 leading-tight focus:outline-none focus:bg-white focus:border-gray-500" id="owner" type="text" placeholder="owner"
                   v-model="owner" @keydown.down.prevent="nextOwner(1)" @keydown.up.prevent="nextOwner(-1)" @keydown.enter.prevent="useSelectedOwner" @keydown.space.prevent="useSelectedOwner" @keydown.tab.exact="useSelectedOwner" :title="owner">
            <div class="relative hidden" v-if="owners.length > 0">
              <div class="absolute z-50 left-0 right-0 rounded border border-gray-100 shadow py-2 bg-white">
                <div v-for="owner in owners" class="cursor-pointer p-2 hover:bg-gray-200 focus:bg-gray-200" @click="selectOwner(owner)" :key="owner.login"
                  :class="{ 'bg-gray-300': ownerSelected && owner.login === ownerSelected }">
                  <img :src="owner.avatar_url" class="rounded-full h-8 inline"> {{owner.login}}
                </div>
              </div>
            </div>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700" v-if="owners.length > 0">
              <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>
        <div class="w-full md:w-1/4 px-3 mb-6 md:mb-0">
          <label class="block tracking-wide text-gray-700 text-xs font-bold mb-2" for="repo">
            Repo
          </label>
          <div class="relative">
            <input autocomplete="off" class="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 pr-8 leading-tight focus:outline-none focus:bg-white focus:border-gray-500" id="repo" type="text" placeholder="repo"
                     v-model="repo" @focus="searchRepos" @keydown.down.prevent="nextRepo(1)" @keydown.up.prevent="nextRepo(-1)" @keydown.enter.prevent="useSelectedRepo" @keydown.space.prevent="useSelectedRepo" @keydown.tab.exact="useSelectedRepo" :title="repo">
            <div class="relative hidden" v-if="repos.length > 0">
              <div class="absolute z-50 left-0 right-0 rounded border border-gray-100 shadow py-2 bg-white">
                <div v-for="repo in filteredRepos" :key="repo.name" class="cursor-pointer p-2 hover:bg-gray-200 focus:bg-gray-200" @click="selectRepo(repo)"
                     :class="{ 'bg-gray-300': repoSelected && repo.name === repoSelected }">
                  {{repo.name}}
                </div>
              </div>
            </div>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700" v-if="repos.length > 0">
              <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>
        <div class="w-full md:w-1/4 px-3 mb-6 md:mb-0">
          <label class="block tracking-wide text-gray-700 text-xs font-bold mb-2" for="branch">
            Branch
          </label>
            <div class="relative">
            <input autocomplete="off" class="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 pr-8 leading-tight focus:outline-none focus:bg-white focus:border-gray-500" id="branch" type="text" placeholder="branch"
                  v-model="branch" @focus="searchBranches"  @keydown.down.prevent="nextBranch(1)" @keydown.up.prevent="nextBranch(-1)" @keydown.enter.prevent="useSelectedBranch" @keydown.space.prevent="useSelectedBranch" @keydown.tab.exact="useSelectedBranch" :title="branch">
            <div class="relative hidden" v-if="branches.length > 0">
              <div class="absolute z-50 left-0 right-0 rounded border border-gray-100 shadow py-2 bg-white">
                <div v-for="branch in filteredBranches" :key="branch.name" class="cursor-pointer p-2 hover:bg-gray-200 focus:bg-gray-200" @click="selectBranch(branch)"
                     :class="{ 'bg-gray-300': branchSelected && branch.name === branchSelected }">
                  {{branch.name}}
                </div>
              </div>
            </div>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700" v-if="branches.length > 0">
              <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>
        <div class="w-full md:w-1/4 px-3 mb-6 md:mb-0">
          <label class="block tracking-wide text-gray-700 text-xs font-bold mb-2" for="path">
            Path
          </label>
          <input autocomplete="off" class="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500" id="path" type="text" placeholder="path"
                 v-model="path">
        </div>
      </div>
      <button type="button" class="text-white font-bold mt-2 py-2 px-4 rounded"
              :class="{ 'bg-gray-500': !inputGithubReady, 'bg-blue-500': inputGithubReady, 'cursor-not-allowed': !inputGithubReady, 'cursor-default': !inputGithubReady }"
              :disabled="!inputGithubReady"
              @click="loadGithub" id="load">
        Load
      </button>
    </form>
  </div>
</template>
<style scoped>
input:focus + div, input + div:hover {
  display: block;
}
</style>

<script>
import asciidoctor from '@asciidoctor/core';
// conversion will run on the client side, therefore select browser variant
import { mapActions, mapState } from 'vuex';
import axios from 'axios';

const registry = asciidoctor().Extensions.create();
if (navigator.userAgent.toLowerCase().indexOf('safari') === -1 || navigator.userAgent.toLowerCase().indexOf('chrome') > -1) {
  const kroki = require('../node_modules/asciidoctor-kroki/dist/browser/asciidoctor-kroki');
  kroki.register(registry);
}

const options = {
  safe: 'unsafe',
  extension_registry: registry,
  sourceHighlighter: 'highlightjs',
  attributes: { showtitle: 'true', icons: 'font' },
};

export default {
  data() {
    const contents = this.getContents();
    return {
      content: this.renderContent(contents.start),
      scratch: '',
      owner: '',
      owners: [],
      ownerSearched: undefined,
      ownerSelected: undefined,
      repo: '',
      repos: [],
      repoSelected: undefined,
      repoOwner: undefined,
      branch: '',
      branches: [],
      branchesRepo: undefined,
      branchSelected: undefined,
      path: '',
    };
  },
  async mounted() {
    let { href } = window.location;
    const result = new RegExp('code=(?<code>[^/][0-9a-z]*).*state=(?<state>[^/][0-9a-z]*)').exec(href);
    if (result) {
      href = href.replace(/\?code=[0-9a-z]*&state=[0-9a-z]*/, '');
      // eslint-disable-next-line
      history.replaceState(null, '', href);
      if (this.$store.getters.activeFile) {
        await this.$router.push({ name: 'edit' });
      } else if (this.$store.getters.activeScratch) {
        await this.$router.push({ name: 'scratch', params: { name: this.$store.getters.activeScratch.name } });
      }
      await this.login(result.groups);
    } else {
      try {
        await this.refreshUser();
      } catch (error) {
        await this.$store.dispatch('showErrorMessage', { error });
      }
    }
  },
  watch: {
    async owner() {
      this.ownerSelected = undefined;
      if (!this.github.token) {
        return;
      }
      // debounce
      clearTimeout(this.ownerTimeout);
      this.ownerTimeout = setTimeout(() => {
        this.searchOwners();
      }, 200);
    },
    async repo() {
      this.repoSelected = undefined;
    },
    async branch() {
      this.branchSelected = undefined;
    },
  },
  computed: {
    ...mapState(['github']),
    filteredRepos() {
      return this.repos.filter((repo) => repo.name.indexOf(this.repo) !== -1).slice(0, 10);
    },
    filteredBranches() {
      return this.branches.filter((branch) => branch.name.indexOf(this.branch) !== -1).slice(0, 10);
    },
    inputScratchReady() {
      return this.scratch !== '';
    },
    inputGithubReady() {
      return this.owner !== '' && this.repo !== '' && this.branch !== '' && this.path !== '';
    },
  },
  methods: {
    async searchOwners() {
      if (this.owner.length === 0 || this.owner === this.ownerSearched) {
        return;
      }
      this.ownerSearched = this.owner;
      const myOwnerSearch = this.owner;
      const response = await axios.get(`https://api.github.com/search/users?q=${this.owner}&per_page=10`, {
        headers: {
          'Content-Type': 'application/vnd.github.v3+json',
        },
      });
      if (this.owner === myOwnerSearch) {
        this.$set(this, 'owners', response.data.items);
      }
    },
    selectOwner(owner) {
      this.owner = owner.login;
    },
    nextOwner(direction) {
      let pos = -1;
      for (let i = 0; i < this.owners.length; ++i) {
        if (this.owners[i].login === this.ownerSelected) {
          pos = i;
          break;
        }
      }
      if (pos === -1 && this.owners.length > 0) {
        this.ownerSelected = this.owners[0].login;
      } else if (direction > 0 && pos !== -1 && this.owners.length > pos + direction) {
        this.ownerSelected = this.owners[pos + direction].login;
      } else if (direction < 0 && pos > 0) {
        this.ownerSelected = this.owners[pos + direction].login;
      }
    },
    useSelectedOwner() {
      let pos = -1;
      for (let i = 0; i < this.owners.length; ++i) {
        if (this.owners[i].login === this.ownerSelected) {
          pos = i;
          break;
        }
      }
      if (this.ownerSelected && pos !== -1) {
        this.owner = this.ownerSelected;
      }
    },
    useSelectedRepo() {
      let pos = -1;
      for (let i = 0; i < this.filteredRepos.length; ++i) {
        if (this.filteredRepos[i].name === this.repoSelected) {
          pos = i;
          break;
        }
      }
      if (this.repoSelected && pos !== -1) {
        this.repo = this.repoSelected;
      }
    },
    useSelectedBranch() {
      let pos = -1;
      for (let i = 0; i < this.filteredBranches.length; ++i) {
        if (this.filteredBranches[i].name === this.branchSelected) {
          pos = i;
          break;
        }
      }
      if (this.branchSelected && pos !== -1) {
        this.branch = this.branchSelected;
      }
    },
    nextRepo(direction) {
      let pos = -1;
      for (let i = 0; i < this.filteredRepos.length; ++i) {
        if (this.filteredRepos[i].name === this.repoSelected) {
          pos = i;
          break;
        }
      }
      if (pos === -1 && this.filteredRepos.length > 0) {
        this.repoSelected = this.filteredRepos[0].name;
      } else if (direction > 0 && pos !== -1 && this.filteredRepos.length > pos + direction) {
        this.repoSelected = this.filteredRepos[pos + direction].name;
      } else if (direction < 0 && pos > 0) {
        this.repoSelected = this.filteredRepos[pos + direction].name;
      }
    },
    nextBranch(direction) {
      let pos = -1;
      for (let i = 0; i < this.filteredBranches.length; ++i) {
        if (this.filteredBranches[i].name === this.branchSelected) {
          pos = i;
          break;
        }
      }
      if (pos === -1 && this.filteredBranches.length > 0) {
        this.branchSelected = this.filteredBranches[0].name;
      } else if (direction > 0 && pos !== -1 && this.filteredBranches.length > pos + direction) {
        this.branchSelected = this.filteredBranches[pos + direction].name;
      } else if (direction < 0 && pos > 0) {
        this.branchSelected = this.filteredBranches[pos + direction].name;
      }
    },
    async searchRepos() {
      if (this.repoOwner === this.owner) {
        return;
      }
      this.repoOwner = this.owner;
      if (this.owner === '') {
        this.$set(this, 'repos', []);
        return;
      }
      const myOwner = this.owner;
      const response = await axios.get(`https://api.github.com/users/${this.owner}/repos`, {
        headers: {
          'Content-Type': 'application/vnd.github.v3+json',
        },
      });
      // if no-one has changed it in between
      if (myOwner === this.repoOwner) {
        this.$set(this, 'repos', response.data);
      }
    },
    selectRepo(repo) {
      this.repo = repo.name;
      this.$set(this, 'branches', []);
    },
    async searchBranches() {
      if (this.branchesRepo === `${this.owner}/${this.repo}`) {
        return;
      }
      this.branchesRepo = `${this.owner}/${this.repo}`;
      const myBranchesRepo = this.branchesRepo;
      if (this.repo === '') {
        this.$set(this, 'branches', []);
        return;
      }
      const response = await axios.get(`https://api.github.com/repos/${this.owner}/${this.repo}/branches`, {
        headers: {
          'Content-Type': 'application/vnd.github.v3+json',
        },
      });
      if (myBranchesRepo === this.branchesRepo) {
        this.$set(this, 'branches', response.data);
      }
    },
    selectBranch(branch) {
      this.branch = branch.name;
    },
    ...mapActions([
      'login', 'refreshUser', 'loadFile', 'addScratch',
    ]),
    async loadGithub() {
      if (!this.inputGithubReady) {
        return;
      }
      await this.loadFile({ file: `https://github.com/${this.owner}/${this.repo}/blob/${this.branch}/${this.path}` });
      if (this.$route.name !== 'edit') {
        await this.$router.push({ name: 'edit' });
      }
    },
    async joinScratch() {
      if (!this.inputScratchReady) {
        return;
      }
      if (this.$route.name !== 'scratch') {
        await this.$router.push({ name: 'scratch', params: { name: this.scratch } });
      }
    },
    renderContent(content) {
      return asciidoctor().convert(content, options);
    },
    getContents() {
      let start = '';
      try {
        start = require('../public/start.adoc').default;
      } catch (e) {
        start = 'Unable to load start.adoc';
      }
      return { start };
    },
  },
};
</script>
