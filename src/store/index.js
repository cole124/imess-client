import Vue from 'vue';
import Vuex from 'vuex';
import createPersistedState from 'vuex-persistedstate'
import modules from './modules';

Vue.use(Vuex);
const debug = process.env.NODE_ENV !== 'production';


export default new Vuex.Store({
    modules, plugins: [
        createPersistedState({ paths: ['Attachments'] })], strict: debug
})