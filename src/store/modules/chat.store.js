import Vue from 'vue'
import axios from 'axios'
import { _ } from '@/plugins/ic-underscore.js'
import { ChatService } from '@/service/chatService'
import { compareDocumentPosition } from 'domutils'

const state = {
    chatsLoading: 'Not Started',
    chats: undefined
}

const initialThread = () => ({
    a_page: 1,
    mimes: [],
    pageSize: 5,
    ignored: [],
    favs: []
})

const getters = {
    chatStatus: state => state.chatsLoading,
    Chats: state => state.chats,
    // Stars: state => {
    //     if (state.currentThreadID && typeof (state.threads[state.currentThreadID].favs) == "undefined") state.threads[state.currentThreadID].favs = []

    //     return state.currentThreadID
    //         ? state.threads[state.currentThreadID].favs
    //         : []

    // },
    // Ignored: state => {
    //     return state.currentThreadID
    //         ? state.threads[state.currentThreadID].ignored
    //         : []
    // },
    // itemsPerPage: state => {
    //     return state.currentThreadID
    //         ? state.threads[state.currentThreadID].pageSize
    //         : 5
    // },
    // currentThread: state => {
    //     return state.currentThreadID
    //         ? state.threads[state.currentThreadID]
    //         : {}
    // }
}

const mutations = {
    setChats(state, payload) {
        state.chats = payload
    },
    setPageSize(state, sz) {
        if (state.currentThreadID) {
            state.threads[state.currentThreadID].pageSize = sz
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
    chatsLoadingStatus(state, payload) {
        state.chatsLoading = payload
    },

}

const actions = {
    async getChats({ commit }) {
        commit('chatsLoadingStatus', 'Loading')
        var service = new ChatService()

        return axios({ url: '#{apiUrl}#/api/chats', method: 'GET' })
            .then(resp => {
                commit('setChats', resp.data)
                commit('chatsLoadingStatus', 'Done')
            }).catch(err => commit('chatsLoadingStatus', err))
            .finally()
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