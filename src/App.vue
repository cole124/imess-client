<template>
  <v-app>
    <!-- <v-navigation-drawer app width="512" v-model="drawer">
      <v-list
          nav
        >
        <v-list-item-group
        v-model="conversations_current_chatId"
        color="primary"
      >
      <!--@click="loadMessage(item.chat_identifier, item.ROWID)" -->
          <!-- <v-list-item 
          
            v-for="item in chats"
            :key="item.ROWID"
            :input-value="conversations_current_chatId"
            :value="item.ROWID" 
          >
            <!-- <v-list-item-icon v-if="item.unread>0">
              <v-icon>account_circle</v-icon>
            </v-list-item-icon> -->
  
            <!--<v-list-item-content>
              <v-list-item-title>{{ item.dName }}</v-list-item-title>
              
            </v-list-item-content>
            <v-list-item-action>
                  <v-list-item-action-text>{{item.dSort | appleDate}}</v-list-item-action-text>
            </v-list-item-action>
          </v-list-item>
        </v-list-item-group>
        </v-list>
    </v-navigation-drawer> -->
    <v-main>
      <router-view></router-view>
    </v-main>
    <v-snackbar
      v-model="updateExists"
      :timeout="timeout"
      left
      bottom
      :class="snackbarClass"
    >
      New version available!
      <v-spacer />
      <v-btn dark color="primary" @click.native="refreshApp">Refresh</v-btn>
      <v-btn icon @click="updateExists = false">
        <v-icon color="white">{{ icons.mdiClose }}</v-icon>
      </v-btn>
    </v-snackbar>
  </v-app>
</template>

<script>
/* eslint-disable */
import Vue from "vue";
import message from "./components/message";
import Player from "./components/Player";
const { DateTime } = require("luxon");
import { initJsStore } from "./service/idb_service";
import { mapMutations, mapGetters, mapActions } from "vuex";
import { mdiClose } from "@mdi/js";

class MSG {
  constructor(text) {
    this.text = text;
    this.is_from_me = 1;
    this.date_sent = new Date();
    this.date_read = new Date();
    this.is_sent = 0;
    this.is_read = 0;
    this.is_delivered = 0;
    this.is_finished = 0;
  }
}

export default {
  name: "App",
  components: {
    message,
  },
  data() {
    return {
      // Load from config
      server_address: "http://192.168.1.196:44055",
      lightbox: false,
      lb_url: null,
      icons: {
        mdiClose,
      },
      drawer: null,
      attachments: {},
      worker: null,
      chats: [],
      conversations: [],
      conversations_current: [],
      conversations_current_chatId: null,
      messagesContainer: null,
      refreshTimer: null,
      messagesLoading: false,
      audiocontext: new (window.AudioContext || webkitAudioContext)(),
      currentPage: 1,
      itemsPerPage: 20,
      registration: null,
      updateExists: true,
      timeout: -1,
    };
  },
  watch: {
    conversations_current_chatId(id) {
      this.conversations_current = [];
      this.currentPage = 1;
      this.loadMessage(id);
    },
    currentPage(v) {
      if (v > 1) this.loadMessage(this.conversations_current_chatId);
    },
    chatStatus(v) {
      console.log(`Chats Loading Status: ${v}`);
      if (v === "Done") {
        setInterval(this.refresh, 30000);
      }
    },
  },
  computed: {
    ...mapGetters("Chat", ["chatStatus"]),
    numberOfPages() {
      if (typeof this.SelectedChat == "undefined") return 0;

      return Math.ceil(this.SelectedChat.msgCount / 20);
    },
    snackbarClass() {
      var cls = "snack";

      var userAgent = navigator.userAgent.toLowerCase();
      if (userAgent.indexOf("safari") != -1) {
        if (userAgent.indexOf("chrome") > -1) {
          cls += " chrome";
        } else if (
          userAgent.indexOf("opera") > -1 ||
          userAgent.indexOf("opr") > -1
        ) {
          cls += " opera";
        } else {
          cls += " safari";
        }
      }

      return cls;
    },
    SelectedChat() {
      return (
        this.$_.find(
          this.chats,
          (c) => c.ROWID == this.conversations_current_chatId
        ) || { msgCount: 0 }
      );
    },
    ConversationTitle() {
      if (this.conversations_current_chatId == null) return "";

      var tmp = this.$_.find(
        this.chats,
        (c) => c.ROWID == this.conversations_current_chatId
      );

      if (tmp) return tmp.dName;

      return "";
    },
  },
  mounted() {
    // INIT
    //this.load();

    // this.worker.port.postMessage({
    //   cmd: "install",
    // });

    this.messagesContainer = this.$refs.messagesContainer;

    // Vue.nextTick(() => {
    //   this.loadMessage(this.chats[0].chat_identifier, this.chats[0].ROWID)
    // })
    // Start our update/refresh loop
    //this.refreshTimer = window.setInterval(this.refresh, 60000);
  },
  beforeDestroy() {
    window.clearInterval(this.refreshTimer);
  },
  methods: {
    load() {
      // this.server.getAttachments().then((data) => {
      //   this.attachments = data.reduce((map, obj) => {
      //     obj.filename = `${this.server_address}${obj.filename}`;
      //     map[obj.message_id] = obj;
      //     return map;
      //   }, {});
      // });
      // this.$http.get("#{apiUrl}#/api/chats").then((resp) => {
      //   var tmp = this.$_.sortBy(resp.data, "dSort");
      //   tmp.reverse();
      //   this.chats = tmp;
      // });
      // if (this.conversations_current_chatId) {
      //   this.loadMessage(this.conversations_current_chatId);
      // }
    },
    refreshApp() {
      this.updateExists = false;
      if (!this.registration || !this.registration.waiting) {
        return;
      }
      this.registration.waiting.postMessage("skipWaiting");
    },
    loadMessage(chatId) {
      this.messagesLoading = true;
      this.conversations_current_chatId = chatId;

      this.$http
        .get(`#{apiUrl}#/api/messages/${chatId}/${(this.currentPage - 1) * 20}`)
        .then((resp) => {
          // if (this.conversations_current.length !== data.length) {
          this.conversations_current = resp.data;
          this.focus();
          //}
        })
        .finally(() => (this.messagesLoading = false));
    },
    showLightBox(val) {
      this.lb_url = val;
      this.lightbox = true;
    },
    // newMessage(evt) {
    //   if (!evt.target.value) return false;
    //   this.server
    //     .postMessage(this.conversations_current_target, evt.target.value)
    //     .then((resp) => {
    //       console.log(resp);
    //     });
    //   const msg = new MSG(evt.target.value);
    //   this.conversations_current.push(msg);
    //   evt.target.value = "";
    //   this.focus();
    // },
    focus() {
      // // Scroll conversations to bottom on data change
      // Vue.nextTick(() => {
      //   this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
      // });
      // // Ensure we scroll to bottom after attachments load
      // // TODO: Make this more accurate...
      // window.setTimeout(() => {
      //   Vue.nextTick(() => {
      //     this.messagesContainer.scrollTop =
      //       this.messagesContainer.scrollHeight;
      //   });
      // }, 500);
    },
    showRefreshUI(e) {
      this.registration = e.detail;
      this.updateExists = true;
    },
    log(msg) {
      console.log(msg);
    },
    refresh() {
      // Refresh code goes here
      this.load();
    },
  },
  created() {
    document.addEventListener("swUpdated", this.showRefreshUI, { once: true });
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (this.refreshing) return;
        this.refreshing = true;
        window.location.reload();
      });
    }
  },
  async beforeCreate() {
    try {
      const isDbCreated = await initJsStore();
      if (isDbCreated) {
        console.log("db created");
        // prefill database
      } else {
        console.log("db opened");
      }
    } catch (error) {
      console.error(error);
    }
  },
  destroyed() {
    document.removeEventListener("swUpdated", this.showRefreshUI);
  },
};
</script>


<style lang="scss">
.snack.safari {
  .v-snack__wrapper {
    bottom: 100px;
  }
}
.home-container {
  display: flex;
  height: 100%;
  width: 100%;
  flex-direction: row;
}

.chats {
  height: 100%;
  display: flex;
  overflow-y: auto;
  overflow-x: hidden;
  flex-direction: column;
  background-color: #f7f7f7;
  // font-size 20px
  width: 33%;

  .chat {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    padding: 0.5em 1em 0.5em 1em;
    // border 1px solid grey
    border-bottom: 0.5px solid grey;
    height: 100px;

    &.selected {
      background-color: red;
    }

    .chat-avatar {
      align-self: center;
      border-radius: 25px;
      width: 50px;
      height: 50px;
      background-color: #c7c7cc;

      i {
        font-size: 50px;
      }
    }

    .chat-name {
      display: flex;
      align-items: flex-start;
      height: 100%;
      width: 80%;

      p {
        // white-space: nowrap;
        overflow: hidden;
        padding-left: 0.5em;
        text-overflow: ellipsis !important;

        a {
          font-weight: 600;
        }
      }
    }
  }
}

.conversations {
  overflow-y: auto;
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
  // padding 1em
  // border-left 1px solid grey
  -webkit-box-shadow: 2px 0px 2px 2px #888;
  box-shadow: 2px 0px 2px 2px #888;

  .message-container {
    overflow-x: hidden !important;
    padding: 1em;
    flex: 1 1 100%;
    display: flex;
    flex-direction: column;
    overflow: auto;
  }

  .message-wrapper {
    max-width: 66%;
    flex-direction: row;
    margin-bottom: 1em;
  }

  .message-time,
  .message-read {
    padding: 0 0.5em 0 0.5em;
    float: right;
  }

  .message {
    overflow-wrap: break-word;
    // padding 1em
    border-radius: 1em;

    p {
      padding: 1em;
      margin: 0;
    }

    .attachments {
      video {
        width: 100%;
        height: 100%;
        border: 1px solid grey;
      }

      img {
        padding: 0;
        max-width: 100%;
      }

      .audio-container {
        width: 100%;
        height: 100%;
        display: flex;
      }
    }
  }

  .sent {
    align-self: flex-end;

    .message {
      background-color: #007aff;
      color: white;
    }
  }

  .recieved {
    align-self: flex-start;

    .message {
      background-color: #e5e5ea;
      color: black;
    }

    .message-time {
      order: -1;
      float: left;
    }
  }

  .new {
    display: flex;
    flex: 0 0 50px;
    padding: 0.5em 4em 0.5em 0.5em;
    justify-content: center;
    align-items: center;
    bottom: 0;
    background-color: #f7f7f7;

    input {
      width: 100%;
      height: 90%;
      font-size: 16px;
      // border-radius 1em
      padding: 0 0.5em 0 0.5em;
      outline: none;
    }
  }
}

a {
  color: black;
  text-decoration: none;

  :hover {
    color: #5856d6;
  }
}

.center {
  margin: 0 auto;
}
</style>
