<template>
    <v-card min-height="500" :color="value.md5.length>0 && hashCount>1 ? 'yellow' : 'white'">
        <v-card-title class="text-h6">
              {{DisplayName}}
            </v-card-title>
            <v-card-subtitle>{{value.md5}} {{value.size}}</v-card-subtitle>
            
        
        
      <v-card-text>
        <video v-if="(value.mime_type || []).includes('video')" controls preload :src="url" />
        <image-attachment :show-recs="hover"
        :value="value" v-on:showLB="$emit('showLB',url)" :metadata="value.metadata" v-bind="value"
        
        max-height="500" v-else
      >
      <!-- :show-recs="hover" -->
      </image-attachment></v-card-text>
            <v-card-actions>
              

        <v-row
          justify="space-between" align="center"
        >
        <v-col >
          <v-badge :content="FaceCount" v-if="FaceCount>0">
                  
          <v-icon
          color="grey lighten-1"
          large
        >
          {{icons.mdiAccount}}
        </v-icon>
          </v-badge>
          <v-badge :content="ECount" v-if="ECount>0" class="mx-5">
                  <v-hover v-model="hover">
          <v-avatar
      color="orange"
      size="36"
    >
      <span class="white--text text-h5">E</span>
    </v-avatar>
                  </v-hover>
          </v-badge>
          {{value.origWidth}} {{value.origHeight}}
          </v-col>
          <v-col class="d-flex justify-end">
          <v-btn icon color="primary">
        <v-icon>{{icons.mdiDownload}}</v-icon>
      </v-btn>
      <v-btn icon color="primary" @click="$emit('delete',value)">
        <v-icon>{{icons.mdiCloseOutline}}</v-icon>
      </v-btn>

      <v-btn icon color="primary" @click="svBlob">
        <v-icon>{{icons.mdiContentSaveOutline}}</v-icon>
      </v-btn>
      <v-btn icon :color="iconColor" @click="AddToFace" :disabled="IsPersisted">
        <v-icon>{{icons.mdiCloudUploadOutline}}</v-icon>
      </v-btn>
      <v-btn icon @click="processBlob" ref="btnProcess">
        <v-icon>{{icons.mdiFileRefreshOutline}}</v-icon>
      </v-btn>
      </v-col>
        </v-row>
      
            
      <!-- <v-btn icon color="primary" @click="Stars.includes(value.filename) ? $emit('rem-fav',value) : $emit('set-fav',value)">
        <v-icon v-text="Stars.includes(value.filename) ? icons.mdiStar : icons.mdiStarOutline"></v-icon>
      </v-btn> -->
      </v-card-actions>
          </v-card>
</template>

<script>
const { BlobServiceClient } = require("@azure/storage-blob");
const { QueueServiceClient } = require("@azure/storage-queue");
const { DateTime } = require("luxon");
import { mapMutations, mapGetters } from "vuex";
import ImageAttachment from "@/components/ImageAttachment";
import axios from "axios";
import {
  mdiMagnify,
  mdiSortNumericAscending,
  mdiSortNumericDescending,
  mdiDownload,
  mdiChevronDown,
  mdiFileRefreshOutline,
  mdiAccount,
  mdiChevronRight,
  mdiContentSaveOutline,
  mdiChevronLeft,
  mdiStar,
  mdiVideo,
  mdiMessageImageOutline,
  mdiPageFirst,
  mdiCloseOutline,
  mdiStarOutline,
  mdiCloudUploadOutline,
  mdiPageLast,
} from "@mdi/js";

export default {
  name: "Blob",
  components: {
    "image-attachment": ImageAttachment,
  },
  data: () => ({
    iconColor: undefined,
    hover: false,
    icons: {
      mdiMagnify,
      mdiSortNumericAscending,
      mdiVideo,
      mdiAccount,
      mdiSortNumericDescending,
      mdiDownload,
      mdiMessageImageOutline,
      mdiStar,
      mdiChevronDown,
      mdiContentSaveOutline,
      mdiFileRefreshOutline,
      mdiCloudUploadOutline,
      mdiChevronRight,
      mdiCloseOutline,
      mdiStarOutline,
      mdiChevronLeft,
      mdiPageFirst,
      mdiPageLast,
    },
  }),
  props: {
    value: {
      type: Object,
    },
    hashCount: {
      type: Number,
      default: 1,
    },
    tags: {
      type: Object,
    },
    url: {
      type: String,
    },
    metadata: {
      type: Object,
    },
  },
  methods: {
    ...mapMutations("Attachments", ["addIgnored", "saveBlob", "addFace"]),
    svBlob() {
      this.saveBlob(this.value.etag);
    },
    processBlob(e) {
      var queueServiceClient = new QueueServiceClient(
        "https://shackletonmedia.queue.core.windows.net?sv=2019-02-02&st=2021-09-14T18%3A55%3A04Z&se=2081-09-15T18%3A55%3A00Z&sp=rau&sig=8wHKBoQGQmNfA4CdEXQEutn3aHtMxIYnY5Xv%2Ft05ewg%3D"
      );

      var queueClient = queueServiceClient.getQueueClient("pending-faces");

      queueClient
        .sendMessage(this.value.name)
        .then((res) => {
          this.$refs.btnProcess.color = "green";
        })
        .catch((err) => console.error(err));
      // axios
      //   .post(`http://localhost:7071/api/msgAttachment/${this.value.name}`, {
      //     dummy: "tag",
      //   })
      //   .then((res) => {
      //     debugger;
      //   })
      //   .catch((err) => console.log(err));
    },
    AddToFace(e) {
      let config = {
        headers: {
          "Ocp-Apim-Subscription-Key": "313896ea64f84b83b5b5cfd8f5ae644b",
        },
      };
      axios
        .post(
          `https://centralus.api.cognitive.microsoft.com/face/v1.0/persongroups/neighbors/persons/76386f7f-05db-421d-9efa-5bb6fafaf9f7/persistedFaces?userData=${this.DisplayName}&detectionModel=detection_03`,
          {
            url: this.url,
          },
          config
        )

        .then((res) => {
          var data = this.$_.extend(res.data, { userData: this.DisplayName });
          console.log(data);
          this.addFace(data);
          this.iconColor = "green";
          this.$emit("trained");
        })
        .catch((err) => {
          this.iconColor = "red";
          console.error(err);
        });
    },
  },
  filters: {
    DisplayDate: function (value) {
      if (!value) return "";
      return value.toLocal().toLocaleString(DateTime.DATETIME_SHORT);
    },
  },
  computed: {
    ...mapGetters("Attachments", ["FaceFiles", "Stars"]),
    DisplayName() {
      return this.value.name.substr(this.value.name.lastIndexOf("/") + 1);
    },
    IsPersisted() {
      return this.$_.contains(this.FaceFiles, this.DisplayName);
    },
    FaceCount() {
      return this.$_.get(this.tags, "faceCount", 0);
    },
    ECount() {
      return this.value.origHeight > 0
        ? this.$_.get(this.tags, "foundFaces", 0)
        : 0;
    },
  },
};
</script>