import Vue from 'vue'
import axios from 'axios'
import { _ } from '@/plugins/ic-underscore.js'

const state = {
    currentThreadID: null,
    threads: {},
    pageSize: 5,
    a_page: 1,
    saved: [],
    persistedFaces: []

}

const initialThread = () => ({
    a_page: 1,
    mimes: [],
    pageSize: 5,
    ignored: [],
    favs: []
})

const getters = {
    curPage: state => {
        return state.currentThreadID
            ? state.threads[state.currentThreadID].a_page
            : state.a_page

    },
    allowed_mimes: state => {
        return state.currentThreadID
            ? state.threads[state.currentThreadID].mimes
            : []
    },
    Stars: state => {
        if (state.currentThreadID && typeof (state.threads[state.currentThreadID].favs) == "undefined") state.threads[state.currentThreadID].favs = []

        return state.currentThreadID
            ? state.threads[state.currentThreadID].favs
            : []

    },
    Ignored: state => {
        return state.currentThreadID
            ? state.threads[state.currentThreadID].ignored
            : []
    },

    Saved: state => {
        return state.saved || []
    },
    itemsPerPage: state => {
        return state.currentThreadID
            ? state.threads[state.currentThreadID].pageSize || 5
            : state.pageSize
    },
    currentThread: state => {
        return state.currentThreadID
            ? state.threads[state.currentThreadID]
            : {}
    },
    Faces: state => state.persistedFaces || [],
    FaceFiles: state => {
        return _.chain(state.persistedFaces || [])
            .filter(f => typeof (f.userData) !== "undefined")
            .pluck('userData')
            .uniq()
            .value()
    },
    FaceIds: state => {
        return _.chain(state.persistedFaces || [])
            .pluck('persistedFaceId')
            .uniq()
            .value()
    },
}

const mutations = {
    setAttachPage(state, pg) {
        if (state.currentThreadID) {
            state.threads[state.currentThreadID].a_page = pg
        }
    },
    setPageSize(state, sz) {
        if (state.currentThreadID) {
            state.threads[state.currentThreadID].pageSize = sz
        } else {
            state.pageSize = sz
        }
    },
    setAllowedMimes(state, payload) {
        if (state.currentThreadID) {
            state.threads[state.currentThreadID].mimes = payload
        }
    },
    addFav(state, payload) {
        if (state.currentThreadID) {
            if (typeof (state.threads[state.currentThreadID].favs) == "undefined") state.threads[state.currentThreadID].favs = []
            state.threads[state.currentThreadID].favs.push(payload)
        }
    },
    saveBlob(state, payload) {
        if (!state.saved) state.saved = []

        state.saved.push(payload)
    },
    setFavs(state, payload) {

        if (state.currentThreadID) {
            if (typeof (state.threads[state.currentThreadID].favs) == "undefined") state.threads[state.currentThreadID].favs = []
            state.threads[state.currentThreadID].favs = payload
        }
    },
    removeFav(state, payload) {
        if (state.currentThreadID) {
            if (typeof (state.threads[state.currentThreadID].favs) == "undefined") state.threads[state.currentThreadID].favs = []
            state.threads[state.currentThreadID].favs = state.threads[state.currentThreadID].favs.filter(i => i != payload)
        }
    },
    addIgnored(state, payload) {

        if (state.currentThreadID) {
            if (typeof (state.threads[state.currentThreadID].ignored) == "undefined") state.threads[state.currentThreadID].ignored = []

            state.threads[state.currentThreadID].ignored.push(payload)
        }
    },
    switchThread(state, id) {
        setCurrentThread(state, id)
    },
    receiveAllSenders(state, senders) {
        debugger
    },
    addFace(state, payload) {
        if (!state.persistedFaces) state.persistedFaces = [];

        if (!_.contains(state.persistedFaces, payload)) state.persistedFaces.push(payload)
    }

}

const actions = {
    setAttachPage({ commit }, payload) {
        commit('setAttachPage', payload)
    },
    switchThread({ commit }, payload) {
        commit('switchThread', payload)
    },
    loadSavedFace({ commit }, payload) {
        axios({
            url: `https://centralus.api.cognitive.microsoft.com/face/v1.0/persongroups/neighbors/persons/76386f7f-05db-421d-9efa-5bb6fafaf9f7/persistedFaces/${payload}`, method: 'GET',
            headers: {
                "Ocp-Apim-Subscription-Key": "313896ea64f84b83b5b5cfd8f5ae644b",
            }
        })
            .then(resp => {
                commit('addFace', resp.data)
                // commit('chatsLoadingStatus', 'Done')
            })
        // .catch(err => commit('chatsLoadingStatus', err))
        // .finally()
    },
    trainGroup({ commit }) {
        axios({
            url: `https://centralus.api.cognitive.microsoft.com/face/v1.0/persongroups/neighbors/train`, method: 'POST',
            headers: {
                "Ocp-Apim-Subscription-Key": "313896ea64f84b83b5b5cfd8f5ae644b",
            }
        })
            .catch(err => console.error(err))
    }
}

function setCurrentThread(state, id) {
    state.currentThreadID = id
    if (!state.threads[id]) {
        createThread(state, id)
    }
    // mark thread as read
    // state.threads[id].lastMessage.isRead = true
}

function createThread(state, id) {
    Vue.set(state.threads, id, initialThread())
}

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
}