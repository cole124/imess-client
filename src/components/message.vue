<template>

<div class="message-wrapper d-flex flex-row" :class="[value.is_from_me ? 'sent' : 'recieved']">
    <div v-if="!value.is_from_me && showSender" class="d-flex align-end mr-2">
      <v-avatar color="teal"><span class="white--text text-h5">{{sender.initials}}</span></v-avatar>
      </div>
    <v-card class="message">
        <v-carousel v-if="value.attachmentCount>0"
            :show-arrows="attachments.length>1"
            :hide-delimiters="attachments.length<2"
            hide-delimiter-background
            show-arrows-on-hover>
            <template v-slot:prev="{ on, attrs }">
      <v-btn
        v-bind="attrs"
        v-on="on" icon
      ><v-icon>{{icons.mdiChevronLeft}}</v-icon></v-btn>
    </template>
    <template v-slot:next="{ on, attrs }">
      <v-btn
        v-bind="attrs"
        v-on="on" icon
      >
      <v-icon>{{icons.mdiChevronRight}}</v-icon>
      </v-btn>
    </template>
    <v-carousel-item
      v-for="(attach, i) in attachments"
      :key="attach.attachment_id"
      width="100%"

    >
    <v-img v-if="(attach.mime_type || []).includes('image')" :src="attach.url" @click.stop="$emit('open-lb',attach.url)" max-height="500" contain/>
    <video v-if="(attach.mime_type || []).includes('video')" controls preload :src="attach.url" width="567" height="500" />
    </v-carousel-item>
  </v-carousel>
  <v-card-text v-if="CleanText.length>0">{{CleanText}}</v-card-text>
  <v-card-subtitle>{{value.dSort | appleDate}}  {{value.ROWID}}</v-card-subtitle>
    </v-card>
</div>

<!--.message-wrapper(
         v-else,
        v-for="msg of conversations_current",
        :class="[msg.is_from_me ? 'sent' : 'recieved']"
      )
        .message(@click="log(msg)")
          p(v-if="!msg.cache_has_attachments") {{ msg.text }}
          .attachments(v-else)
            .audio-container(v-if="msg.is_audio_message")
              player(
                :url="attachments[msg.ROWID].filename",
                :audiocontext="audiocontext"
              )
            video(
              v-if="attachments[msg.ROWID].mime_type.includes('video')",
              controls,
              preload
            )
              source(:src="attachments[msg.ROWID].filename")
            img(
              v-if="attachments[msg.ROWID].mime_type.includes('image')",
              :src="attachments[msg.ROWID].filename"
            )
        //- .message-time
        //-   span {{msg.date_sent}}
        .message-read -->
</template>

<script>
/* eslint-disable */
const { heicConvert } = require("heic-convert");
import { mdiChevronLeft, mdiChevronRight } from "@mdi/js";
export default {
  name: "message",
  props: {
    value: {
      type: Object,
    },
    sender: {
      type: Object,
      default: () => {
        initials: "?";
      },
    },
    showSender: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      attachments: [],
      icons: { mdiChevronLeft, mdiChevronRight },
    };
  },
  computed: {
    HasAttachments() {
      if (!this.value) return false;

      return this.value.attachmentCount > 0;
    },
    CleanText() {
      return this.value.text.replaceAll(/\uFFFC/g, "");
    },
    Sender() {
      return "XY";
    },
  },
  watch: {},
  methods: {
    GetImageSource(att) {
      if (att.mime_type == "image/heic") {
        return fetch(att.url).then(async (data) => {
          const buffer = Buffer.from(await data.arrayBuffer());
          return heicConvert({ buffer, format: "PNG" });
        });
      } else {
        return att.url;
      }
    },
  },
  mounted() {
    if (this.HasAttachments) {
      this.$http
        .get(`#{apiUrl}#/api/attachments/${this.value.ROWID}`)
        .then((resp) => {
          this.attachments = resp.data.map((obj) => {
            obj.url =
              obj.mime_type == "image/heic"
                ? `https://Heic.azureedge.net${obj.filename}`
                : `https://shackleton-media.azureedge.net/Attacments${obj.filename}`;

            return obj;
          });
        });
    }
  },
};
</script>

<style lang="scss" scoped>
.message-wrapper {
  max-width: 66%;
  flex-direction: row;
  margin-bottom: 1em;
}

.sent {
  align-self: flex-end;

  .message {
    background-color: #007aff;

    .v-card__text,
    .v-card__subtitle {
      color: white;
    }
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
</style>