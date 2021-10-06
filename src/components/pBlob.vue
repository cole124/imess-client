<template>
    <v-card min-height="500" :color="value.md5.length>0 && hashCount>1 ? 'yellow' : 'white'">
        <v-card-title class="text-h6">
          <div style="width:100%;">
              <span v-text="DisplayName" @click="editName" v-if="!editingName" class="float-left"></span>
              
              <v-text-field v-model="editedName" v-else :append-outer-icon="icons.mdiContentSaveOutline" outlined
              @change="SaveDisplayName" @click:append-outer="SaveDisplayName"></v-text-field>
              <span v-if="Duration>0 && !editingName" class="float-right">{{Duration | TimeDisplay}}</span>
              </div>
            </v-card-title>
            <v-card-subtitle>{{tags.username}}</v-card-subtitle>
            
        <div class="d-flex justify-center flex-column video-wrapper">
          <video class="video-js vjs-big-play-centered vjs-fill vjs-controls-enabled"  
        
         ref="video"></video>
        <!-- <video-player  class="video-player-box"
                 ref="videoPlayer"
                 :options="playerOptions"
                 :playsinline="true"
                 

                 @play="onPlayerPlay($event)"
                 @pause="onPlayerPause($event)"
                 
                 
                 @ready="playerReadied">
  </video-player> -->
        </div>
      <!-- <v-card-text>
        <video v-if="(value.mime_type || []).includes('video')" controls preload :src="url" max-height="500" width="100%"/>
        </v-card-text> -->
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
import "video.js/dist/video-js.css";

import _videojs from "video.js";
const videojs = window.videojs || _videojs;
import ImageAttachment from "@/components/ImageAttachment";
import "videojs-thumbnail-sprite";
import axios from "axios";
// as of videojs 6.6.0
const DEFAULT_EVENTS = [
  "loadeddata",
  "canplay",
  "canplaythrough",
  // "play",
  "pause",
  "waiting",
  // "playing",
  "ended",
  "error",
];

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

  data: () => ({
    player: null,
    reseted: true,
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
    start: {
      type: Number,
      default: 0,
    },
    crossOrigin: {
      type: String,
      default: "",
    },
    playsinline: {
      type: Boolean,
      default: true,
    },
    customEventName: {
      type: String,
      default: "statechanged",
    },
    events: {
      type: Array,
      default: () => [],
    },
    globalOptions: {
      type: Object,
      default: () => ({
        autoplay: false,
        controls: true,
        preload: "auto",
        fluid: true,
        muted: false,
        // controlBar: {
        //   remainingTimeDisplay: true,
        //   playToggle: {},
        //   progressControl: {},
        //   fullscreenToggle: {},
        //   volumeMenuButton: {
        //     inline: false,
        //     vertical: true,
        //   },
        // },
        techOrder: ["html5"],
        plugins: {},
      }),
    },
    globalEvents: {
      type: Array,
      default: () => [],
    },
  },
  watch: {
    MediaTags(v) {
      this.tgs = v;
    },
  },
  methods: {
    onPlayerPlay(player) {
      this.$emit("playing", this.value.etag);
    },
    onPlayerPause(player) {
      console.log("player pause!", player);
    },
    // ...player event

    // or listen state event
    playerStateChanged(playerCurrentState) {
      console.log("player current update state", playerCurrentState);
    },

    // player is ready
    playerReadied(player) {
      console.log("the player is readied", player);
      // you can use it to do something...
      // player.[methods]
    },
    pausePlayer() {
      if (this.player.hasStarted_) {
        this.player.pause();
      }
    },
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
    initialize() {
      // videojs options
      const videoOptions = Object.assign(
        {},
        this.globalOptions,
        this.playerOptions
      );

      // ios fullscreen
      // if (this.playsinline) {
      //   this.$refs.video.setAttribute("playsinline", this.playsinline);
      //   this.$refs.video.setAttribute("webkit-playsinline", this.playsinline);
      //   this.$refs.video.setAttribute("x5-playsinline", this.playsinline);
      //   this.$refs.video.setAttribute("x5-video-player-type", "h5");
      //   this.$refs.video.setAttribute("x5-video-player-fullscreen", false);
      // }

      // cross origin
      if (this.crossOrigin !== "") {
        this.$refs.video.crossOrigin = this.crossOrigin;
        this.$refs.video.setAttribute("crossOrigin", this.crossOrigin);
      }

      // emit event
      const emitPlayerState = (event, value) => {
        if (event) {
          this.$emit(event, this.player);
        }
        if (value) {
          this.$emit(this.customEventName, { [event]: value });
        }
      };

      // avoid error "VIDEOJS: ERROR: Unable to find plugin: __ob__"
      if (videoOptions.plugins) {
        delete videoOptions.plugins.__ob__;
      }

      // videoOptions
      // console.log('videoOptions', videoOptions)

      // player
      const self = this;
      this.player = videojs(this.$refs.video, videoOptions, function () {
        // events
        const events = DEFAULT_EVENTS.concat(self.events).concat(
          self.globalEvents
        );

        // watch events
        const onEdEvents = {};
        for (let i = 0; i < events.length; i++) {
          if (
            typeof events[i] === "string" &&
            onEdEvents[events[i]] === undefined
          ) {
            ((event) => {
              onEdEvents[event] = null;
              this.on(event, () => {
                emitPlayerState(event, true);
              });
            })(events[i]);
          }
        }
        this.on("play", function () {
          self.$emit("playing", self.value.etag);
        });
        // watch timeupdate
        this.on("timeupdate", function () {
          emitPlayerState("timeupdate", this.currentTime());
        });

        // player readied
        self.$emit("ready", this);
      });
    },
    dispose(callback) {
      if (this.player && this.player.dispose) {
        if (this.player.techName_ !== "Flash") {
          this.player.pause && this.player.pause();
        }
        this.player.dispose();
        this.player = null;
        this.$nextTick(() => {
          this.reseted = false;
          this.$nextTick(() => {
            this.reseted = true;
            this.$nextTick(() => {
              callback && callback();
            });
          });
        });
        /*
          if (!this.$el.children.length) {
            const video = document.createElement('video')
            video.className = 'video-js'
            this.$el.appendChild(video)
          }
          */
      }
    },
  },
  filters: {
    TimeDisplay: function (value) {
      if (!value) return "";
      if (value < 60) {
        return `${value}s`;
      } else if (value < 3600) {
        var min = Math.floor(value / 60);
        var sec = value - min * 60;
        return `${min}:${sec}`;
      } else {
        var h = Math.floor(value / 3600);
        var min = Math.floor((value - h * 3600) / 60);
        var sec = value - h * 3600 - min * 60;
        return `${h}:${("000" + min).slice(-2)}:${sec}`;
      }
    },
  },
  computed: {
    Duration: {
      get() {
        return Math.ceil(
          this.$_.has(this.tags, "duration") ? this.tags.duration : 0
        );
      },
      set(v) {
        debugger;
      },
    },
    playerOptions() {
      return {
        // videojs options
        muted: true,
        language: "en",
        playbackRates: [0.7, 1.0, 1.5, 2.0],

        sources: [
          {
            type: this.value.mime_type,
            src: this.url,
          },
        ],

        //height: "450",
        //poster: "/static/images/author.jpg",
      };
    },
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
    if (!this.player) {
      this.initialize();
    }
  },
  beforeDestroy() {
    if (this.player) {
      this.dispose();
    }
  },
};
</script>

<style lang="scss" scoped>
.video-wrapper {
  align-content: center;
  align-items: center;
  justify-content: center;
  //max-height: calc(100vh - 350px);
  max-width: 100%;
  position: relative;
  overflow: hidden;
}
</style>