<template>
    <v-card min-height="500">
        <v-card-title class="text-h6">
              {{value.transfer_name}}
            </v-card-title>
            <v-card-subtitle>{{value.date | DisplayDate}} <v-btn icon v-if="(value.files || []).length>0" @click="Video2Clipboard"><v-icon :color="iconColor">{{icons.mdiVideo}}</v-icon></v-btn></v-card-subtitle>
            <image-attachment
        :value="value" v-on:showLB="$emit('showLB',value.url)"
        max-height="500" v-if="(value.mime_type || []).includes('image') && (value.files || []).length==0"
      ></image-attachment>
      <div v-else-if="(value.mime_type || []).includes('image') && (value.files || []).length > 0" :id="value.attachment_id" data-live-photo ref="livePlayer" style="width: 100%; height: auto; min-height:300px;"
            :data-photo-src="value.url" data-proactively-loads-video
            :data-video-src="`https://shackleton-media.azureedge.net/Attachments${value.files[0]}`"></div>
        <video v-else-if="(value.mime_type || []).includes('video')" controls preload :src="value.url" />
      <v-card-text v-html="FileList"></v-card-text>
            <v-card-actions>
              <v-btn icon link v-if="value.chat_id" :to="`/${value.chat_id}/${value.message_id}`" color="primary">
              <v-icon>{{icons.mdiMessageImageOutline}}</v-icon>
            </v-btn>
            <v-btn icon color="primary">
        <v-icon>{{icons.mdiDownload}}</v-icon>
      </v-btn>
      <v-btn icon color="primary" @click="addIgnored(value.filename)" :disabled="Stars.includes(value.filename)">
        <v-icon>{{icons.mdiCloseOutline}}</v-icon>
      </v-btn>
      <v-btn icon color="primary" @click="Stars.includes(value.filename) ? $emit('rem-fav',value) : $emit('set-fav',value)">
        <v-icon v-text="Stars.includes(value.filename) ? icons.mdiStar : icons.mdiStarOutline"></v-icon>
      </v-btn>
      </v-card-actions>
          </v-card>
</template>

<script>
const { BlobServiceClient } = require("@azure/storage-blob");
const { DateTime } = require("luxon");
import { mapMutations, mapGetters } from "vuex";
import * as LivePhotosKit from "livephotoskit";
import ImageAttachment from "@/components/ImageAttachment";
import axios from "axios";
import {
  mdiMagnify,
  mdiSortNumericAscending,
  mdiSortNumericDescending,
  mdiDownload,
  mdiChevronDown,
  mdiChevronRight,
  mdiChevronLeft,
  mdiStar,
  mdiVideo,
  mdiMessageImageOutline,
  mdiPageFirst,
  mdiCloseOutline,
  mdiStarOutline,
  mdiPageLast,
} from "@mdi/js";

export default {
  name: "Attachment",
  components: {
    "image-attachment": ImageAttachment,
  },
  data: () => ({
    icons: {
      mdiMagnify,
      mdiSortNumericAscending,
      mdiVideo,
      mdiSortNumericDescending,
      mdiDownload,
      mdiMessageImageOutline,
      mdiStar,
      mdiChevronDown,
      mdiChevronRight,
      mdiCloseOutline,
      mdiStarOutline,
      mdiChevronLeft,
      mdiPageFirst,
      mdiPageLast,
    },
    iconColor: undefined,
  }),
  props: {
    value: {
      type: Object,
    },
  },
  watch: {},
  methods: {
    ...mapMutations("Attachments", ["addIgnored"]),
    AddLivePlayer() {
      LivePhotosKit.Player(this.$refs.livePlayer);
    },
    Video2Clipboard(e) {
      var str = "/home/azureuser/media/Attachments" + this.value.files[0];
      this.$copyText(str)
        .then(() => (this.iconColor = "green"))
        .catch((err) => {
          console.error(err);
          this.iconColor = "red";
        });
    },
    processBlob() {
      axios.post(
        `http://localhost:7071/api/msgAttachment/Attachments${this.value.filename}`,
        {
          attachment_id: this.value.attachment_id.toString(),
          chat_id: this.value.chat_id.toString(),
          message_id: this.value.message_id.toString(),
          favorite: this.Stars.includes(this.value.filename) ? "true" : "false",
        }
      );
    },
  },
  filters: {
    DisplayDate: function (value) {
      if (!value) return "";
      return value.toLocal().toLocaleString(DateTime.DATETIME_SHORT);
    },
  },
  computed: {
    ...mapGetters("Attachments", ["Stars"]),
    FileList() {
      var str = this.value.filename;
      if (this.value.files) {
        str += "<br/>" + this.value.files.join("<br/>");
      }

      return str;
    },
  },
  mounted() {
    //const myNewPlayer = LivePhotosKit.Player();
    //document.body.appendChild(myNewPlayer);
    //A Player built from a pre-existing element:
    //LivePhotosKit.Player(document.getElementById('myExistingElement'));
    this.processBlob();
    if (
      (this.value.mime_type || []).includes("image") &&
      this.value.files.length > 0
    ) {
      this.$nextTick(() => this.AddLivePlayer());
    }
  },
};
</script>