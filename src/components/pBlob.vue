<template>
    <v-card min-height="500" :color="value.md5.length>0 && hashCount>1 ? 'yellow' : 'white'">
        <v-card-title class="text-h6">
              <span v-text="DisplayName" @click="editName" v-if="!editingName"></span>
              <v-text-field v-model="editedName" v-else :append-outer-icon="icons.mdiContentSaveOutline" outlined
              @change="SaveDisplayName" @click:append-outer="SaveDisplayName"></v-text-field>
            </v-card-title>
            <v-card-subtitle>{{tags.username}}</v-card-subtitle>
            
        
        
      <v-card-text>
        <video v-if="(value.mime_type || []).includes('video')" controls preload :src="url" max-height="500" width="100%"/>
        </v-card-text>
            <v-card-actions>
              

        <v-row
          justify="space-between" align="center"
        >
        <v-col >
          <v-combobox
          v-model="tgs"
          :items="allTags"
          hide-selected
          multiple
          chips
          @input="updateTags"
          >
          <template v-slot:selection="{ attrs, item, parent, selected }">
        <v-chip
          v-bind="attrs"
          label
          small
        >
          <span class="pr-2">
            {{ item }}
          </span>
          <v-icon
            small
            @click="removeTag(item)"
          >
            $delete
          </v-icon>
        </v-chip>
      </template></v-combobox>
          <!-- <v-autocomplete
        :items="unselectedTags"
        color="white"
        hide-details
        :append-outer-icon="icons.mdiPlusOutline"
        :search-input.sync="newTag"
        click:append-outer="tagInput"
        @input="tagInput('input')"
        @change="tagInput('change')"
      >
      
      </v-autocomplete>
      
          <v-chip-group column>
          <v-chip v-for="t in MediaTags" :key="t" close @click:close="removeTag(t)">
          {{t}}
          </v-chip>
          </v-chip-group> -->
          
          </v-col>
          <v-col class="d-flex justify-end">
          <v-btn icon color="primary">
        <v-icon>{{icons.mdiDownload}}</v-icon>
      </v-btn>
      <v-btn icon color="primary" @click="$emit('delete',value)">
        <v-icon>{{icons.mdiCloseOutline}}</v-icon>
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
  mdiPlusOutline,
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
  name: "pBlob",
  components: {
    "image-attachment": ImageAttachment,
  },
  data: () => ({
    iconColor: undefined,
    hover: false,
    tgs: [],
    editingName: false,
    editedName: "",
    icons: {
      mdiMagnify,
      mdiPlusOutline,
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
    allTags: {
      type: Array,
    },
  },
  watch: {
    MediaTags(v) {
      this.tgs = v;
    },
  },
  methods: {
    ...mapMutations("Attachments", ["addIgnored", "saveBlob", "addFace"]),
    editName() {
      this.editedName = this.DisplayName;
      this.editingName = true;
    },
    removeTag(t) {
      this.tgs = this.$_.without(this.MediaTags, t);
      this.updateTags();
    },
    updateTags() {
      var tmp = this.$_.clone(this.value);
      tmp.metadata.tags = this.tgs.join(",");

      this.$emit("input", tmp);
    },
    tagInput(m) {
      console.log(m);
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
    SaveDisplayName() {
      var tmp = this.$_.clone(this.value);
      tmp.tags.display_name = this.editedName;
      this.$emit("input", tmp);

      this.editingName = false;
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
      return this.$_.has(this.tags, "display_name")
        ? this.tags.display_name
        : this.value.name.substr(this.value.name.lastIndexOf("/") + 1);
    },
    IsPersisted() {
      return this.$_.contains(this.FaceFiles, this.DisplayName);
    },
    FaceCount() {
      return this.$_.get(this.tags, "faceCount", 0);
    },
    MediaTags() {
      return this.$_.filter(
        this.$_.defaults(this.metadata || {}, { tags: "" }).tags.split(","),
        (v) => v.length > 0
      );
    },
    unselectedTags() {
      return this.$_.filter(
        this.allTags || [],
        (t) => !this.$_.contains(this.MediaTags, t)
      ).sort();
    },
  },
  mounted() {
    this.tgs = this.MediaTags;
  },
};
</script>