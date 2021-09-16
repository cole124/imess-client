<template>
    <v-container fluid ref="messagesContainer">
        <infinite-loading @infinite="LoadMoreTop" direction="top" v-if="startIdx>0 && message_id && messageScrolled"></infinite-loading>
        <v-row class="conversations">
            <v-col cols="12" v-for="msg in VisibleMessages" :key="msg.ROWID" class="message-container">
            <message :ref="`msg_${msg.ROWID}`" :value="msg" v-on:open-lb="showLightBox" :showSender="SenderCount>1" :sender="senders[msg.Z_PK] || senders[msg.hID] || senders[0]"></message>
            </v-col>
            </v-row>
            <infinite-loading @infinite="LoadMore"></infinite-loading>
        <!-- <v-data-iterator
        :items="conversations_current"
        :loading="messagesLoading"
        item-key="ROWID"
        :disable-pagination="SelectedChat.msgCount>20"
        :server-items-length="SelectedChat.msgCount" hide-default-footer
        :items-per-page="itemsPerPage"
        :page.sync="currentPage"
        sort-desc
        sort-by="dSort">
        <template v-slot:default="{items}">
          <v-row class="conversations"><v-col cols="12" v-for="msg in items" :key="msg.ROWID" class="message-container">
            <message :value="msg" v-on:open-lb="showLightBox" :showSender="SenderCount>1" :sender="senders[msg.Z_PK || 0]"></message>
            </v-col></v-row>
            </template>
            <template v-slot:footer>
        <v-row
          class="mt-2"
          align="center"
          justify="center"
        >
        <v-spacer></v-spacer>

          <span
            class="mr-4
            grey--text"
          >
            Page </span>
            <v-menu offset-y>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                dark
                text
                color="primary"
                class="ml-2"
                v-bind="attrs"
                v-on="on"
              >
                {{ currentPage }}
                <v-icon>mdi-chevron-down</v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item
                v-for="(number, index) in numberOfPages"
                :key="index"
                @click="currentPage=number"
              >
                <v-list-item-title>{{ number }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu> <span
            class="mr-4
            grey--text"
          > of {{ numberOfPages }}
          </span>
          <v-btn
            fab
            :disabled="currentPage==1"
            dark
            color="blue darken-3"
            class="mr-1"
            @click="currentPage--"
          >
            <v-icon>{{icons.mdiChevronLeft}}</v-icon>
          </v-btn>
          <v-btn
            fab
            dark
            color="blue darken-3"
            class="ml-1"
            @click="currentPage++"
          >
            <v-icon>{{icons.mdiChevronRight}}</v-icon>
          </v-btn>
        </v-row>

      </template>
        </v-data-iterator> -->
        <v-dialog v-model="lightbox" max-width="90%" height="90%">
        <v-img :src="lb_url" contain width="100%" height="100%"></v-img>
      </v-dialog>
      </v-container>
</template>

<script>
import { mdiChevronLeft, mdiChevronRight } from "@mdi/js";
import InfiniteLoading from "vue-infinite-loading";
import message from "@/components/message";
export default {
  name: "MessageGrid",
  components: {
    message,
    InfiniteLoading,
  },
  data() {
    return {
      lightbox: false,
      lb_url: null,
      messagesLoading: true,
      currentPage: 1,
      itemsPerPage: 20,
      icons: { mdiChevronLeft, mdiChevronRight },
      SelectedChat: this.value,
      conversations_current: [],
      startIdx: 0,
      messageScrolled: false,
    };
  },
  props: {
    chatId: {
      type: [Number, String],
    },
    value: {
      type: Object,
      default: {
        msgCount: 0,
      },
    },
    senders: {
      type: Object,
    },
    message_id: {
      type: [Number, String],
    },
  },
  watch: {
    value(v) {
      this.SelectedChat = v;
    },
    chatId(v) {
      console.log(`ChatId: ${v}. chatId changed`);
      this.conversations_current = [];
      this.loadMessages();
    },
  },
  computed: {
    numberOfPages() {
      return Math.ceil(this.SelectedChat.msgCount / this.itemsPerPage);
    },
    SenderCount() {
      return this.SelectedChat.dName.split(",").length;
    },
    VisibleMessages() {
      if (this.startIdx > 0) {
        var tmp = this.$_.first(
          this.conversations_current,
          this.currentPage * this.itemsPerPage
        );

        return this.$_.last(tmp, tmp.length - this.startIdx);
      } else {
        return this.$_.first(
          this.conversations_current,
          this.currentPage * this.itemsPerPage
        );
      }
    },
  },
  methods: {
    loadMessages() {
      this.messagesLoading = true;
      console.log(`ChatId: ${this.chatId}. loadingMessages.starting`);

      this.$http
        .get(`#{apiUrl}#/api/messages/${this.chatId}`)
        .then((resp) => {
          // if (this.conversations_current.length !== data.length) {
          this.conversations_current = resp.data;

          if (this.message_id) {
            var idx = this.$_.findIndex(
              resp.data,
              (m) => m.ROWID == this.message_id
            );
            if (idx) {
              this.currentPage = Math.floor(idx / this.itemsPerPage) + 1;
              //   if (idx > this.itemsPerPage) {
              //     this.startIdx = idx - this.itemsPerPage;
              //   }
            }
          }
          //}
        })
        .finally(() => {
          this.$nextTick(() => {
            this.messagesLoading = false;
            console.log(`ChatId: ${this.chatId}. loadingMessages.done`);
          });
        });
    },
    LoadMore($state) {
      if (this.messagesLoading) $state.reset();
      else {
        if (this.conversations_current.length > this.VisibleMessages.length) {
          this.currentPage++;
          $state.loaded();
        } else {
          $state.complete();
        }
      }
    },
    LoadMoreTop($state) {
      if (this.messagesLoading) $state.reset();
      else {
        if (this.startIdx > 0) {
          this.startIdx = Math.max(this.startIdx - this.itemsPerPage, 0);
          $state.loaded();
        } else {
          $state.complete();
        }
      }
    },
    LoadSelectedMessage() {
      if (this.message_id) {
        console.log({
          messagesLoading: this.messagesLoading,
          msg: this.$refs[`msg_${this.message_id}`],
        });
        if (
          this.messagesLoading ||
          typeof this.$refs[`msg_${this.message_id}`] === "undefined"
        ) {
          setTimeout(this.LoadSelectedMessage, 1000);
        } else {
          this.$nextTick(() => {
            this.$vuetify.goTo(this.$refs[`msg_${this.message_id}`][0]);
            this.messageScrolled = true;
          });
        }
      }
    },
    showLightBox(val) {
      this.lb_url = val;
      this.lightbox = true;
    },
  },
  mounted() {
    this.LoadSelectedMessage();
  },
  //   beforeRouteEnter(to, from, next) {
  //     next((vm) => {
  //       vm.loadMessages();
  //       // vm.from = from
  //     });
  //   },
  beforeRouteUpdate(to, from, next) {
    // this.conversations_current = [];
    // console.log(this.chatId);
    // this.loadMessages();
    this.LoadSelectedMessage();
    next();
  },
  created() {
    this.loadMessages();
  },
};
</script>