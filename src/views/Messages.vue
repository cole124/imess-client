<template>
      <div>
    <v-navigation-drawer app width="512" v-model="drawer">
      <v-list
          nav
        >
        <!-- <v-list-item-group
        v-model="conversations_current_chatId"
        color="primary" 
      >-->
      <!--@click="loadMessage(item.chat_identifier, item.ROWID)"-->
          <v-list-item 
          :to="`/${item.ROWID}`"
            v-for="item in ChatList"
            :key="`${item.ROWID}-${item.dSort}`"
            :input-value="conversations_current_chatId"
            :value="item.ROWID" 
          >
            <!-- <v-list-item-icon v-if="item.unread>0">
              <v-icon>account_circle</v-icon>
            </v-list-item-icon> -->
  
            <v-list-item-content>
              <v-list-item-title>{{ item.dName }}</v-list-item-title>
              
            </v-list-item-content>
            <v-list-item-action>
                  <v-list-item-action-text>{{item.dSort | appleDate}}</v-list-item-action-text>
            </v-list-item-action>
          </v-list-item>
        <!-- </v-list-item-group> -->
        </v-list>
    </v-navigation-drawer>
    
      <v-toolbar
      color="indigo"
      dark
    >
      <v-app-bar-nav-icon @click="drawer=!drawer">
          <v-icon>{{icons.mdiDotsHorizontal}}</v-icon>
      </v-app-bar-nav-icon>

      <v-toolbar-title>
          <router-link v-for="sender in SenderList" :key="sender.pk" v-text="sender.name" :to="`/person/${sender.pk}/attachments`" class="mr-2 white--text" v-if="sender.initials!='?'"></router-link>
      </v-toolbar-title>

      <v-spacer></v-spacer>

      <v-btn icon>
        <v-icon>{{icons.mdiMagnify}}</v-icon>
      </v-btn>
    </v-toolbar>
      <router-view :value="SelectedChat" :senders="SenderList"></router-view>
      
      </div>
</template>

<script>
import { mdiMagnify, mdiDotsHorizontal } from "@mdi/js";
const { DateTime } = require("luxon");
import { mapMutations, mapGetters, mapActions } from "vuex";
import { ChatService } from "@/service/chatService";

export default {
  name: "messages",
  data() {
    return {
      drawer: null,
      conversations_current: [],
      conversations_current_chatId: null,
      messagesContainer: null,
      refreshTimer: null,

      audiocontext: new (window.AudioContext || webkitAudioContext)(),
      icons: { mdiMagnify, mdiDotsHorizontal },
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
  },
  computed: {
    ...mapGetters("Chat", ["chatStatus", "Chats"]),
    ChatList() {
      var tmp = this.$_.sortBy(this.Chats, "dSort");
      tmp.reverse();
      return tmp;
    },
    numberOfPages() {
      if (typeof this.SelectedChat == "undefined") return 0;

      return Math.ceil(this.SelectedChat.msgCount / 20);
    },
    SelectedChat() {
      return (
        this.$_.find(
          this.Chats,
          (c) => c.ROWID == (this.$route.params["chatId"] || -1)
        ) || { msgCount: 0, dName: "", dName2: "" }
      );
    },
    SenderList() {
      var tmp = (this.SelectedChat.dName2 || "")
        .split(",")
        .reduce((map, obj) => {
          if (obj.includes("|")) {
            map[obj.split("|")[1]] = {
              name: obj.split("|")[0],
              pk: obj.split("|")[1],
              initials: obj
                .split("|")[0]
                .split(" ")
                .reduce((m, n) => {
                  m += n.substr(0, 1);
                  return m;
                }, "")
                .toUpperCase(),
            };
          } else if (obj.length > 0) {
            debugger;
          }

          return map;
        }, {});

      if (
        (this.SelectedChat.dName || "").split(",").length >
        this.$_.keys(tmp).length
      ) {
        var tmp2 = this.$_.filter(
          (this.SelectedChat.dName || "").split(","),
          (n) =>
            !this.$_.contains(
              this.$_.values(this.$_.mapObject(tmp, (o) => o.name)),
              n
            )
        ).forEach((n) => {
          tmp[n] = { name: n, pk: n, initials: n.substr(0, 2) };
        });
      }

      tmp[0] = { name: "Unknown", initials: "?", pk: 0 };
      return tmp;
    },
  },
  mounted() {
    // INIT

    this.messagesContainer = this.$refs.messagesContainer;
    // Vue.nextTick(() => {
    //   this.loadMessage(this.chats[0].chat_identifier, this.chats[0].ROWID)
    // })
    // Start our update/refresh loop
    this.refreshTimer = window.setInterval(this.refresh, 120000);
  },
  created() {
    this.load();
  },
  beforeDestroy() {
    window.clearInterval(this.refreshTimer);
  },
  methods: {
    ...mapActions("Chat", ["getChats"]),
    load() {
      // this.server.getAttachments().then((data) => {
      //   this.attachments = data.reduce((map, obj) => {
      //     obj.filename = `${this.server_address}${obj.filename}`;
      //     map[obj.message_id] = obj;
      //     return map;
      //   }, {});
      // });
      this.getChats();
      /*var service = new ChatService();

      this.$http.get("#{apiUrl}#/api/chats").then((resp) => {
        var tmp = this.$_.sortBy(resp.data, "dSort");
        tmp.reverse();
        //this.receiveAllSenders(tmp);
        this.chats = tmp;
        service.addChats(tmp);
      });*/
    },
    // loadMessage(chatId) {
    //   this.messagesLoading = true;
    //   this.conversations_current_chatId = chatId;

    //   this.$http
    //     .get(`#{apiUrl}#/api/messages/${chatId}/${(this.currentPage - 1) * 20}`)
    //     .then((resp) => {
    //       // if (this.conversations_current.length !== data.length) {
    //       this.conversations_current = resp.data;
    //       this.focus();
    //       //}
    //     })
    //     .finally(() => (this.messagesLoading = false));
    // },

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
    attachmentHandler() {
      console.log("test");
    },
    log(msg) {
      console.log(msg);
    },
    refresh() {
      // Refresh code goes here
      this.load();
    },
  },
};
</script>