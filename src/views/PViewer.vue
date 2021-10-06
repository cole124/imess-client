<template>
    <v-container fluid>
      <v-data-iterator
        :items="VisibleAttachments"
        item-key="etag"
        hide-default-footer ref="scroll"
        :items-per-page="itemsPerPage"
        :loading="prefetching || busy"
        >
        <template v-slot:header>
          <v-toolbar
        ref="toolbar"
      class="mb-1"
    >
    <v-select
              flat
              solo-inverted
              v-model="sortBy"
              hide-details
              :items="['size','md5','etag','name','date','duration']"
              label="Sort"
            ></v-select>
            
      <v-spacer></v-spacer>
      <!--<v-spacer>
         <v-checkbox v-model="multiples" label="Multiples" hide-details></v-checkbox>
        <v-checkbox v-model="withFaces" label="Faces" hide-details></v-checkbox>
        <v-checkbox v-model="withE" label="E" hide-details></v-checkbox> 
      </v-spacer>-->
      <v-select
              flat
              solo-inverted
              multiple
              v-model="selectedUsers" persist
              hide-details
              :items="Users"
              label="User"
              clearable
            ></v-select>
            <v-spacer></v-spacer>
            <v-select
              flat
              solo-inverted
              multiple
              clearable
              v-model="selectedTags"
              hide-details
              :items="Tags"
              label="Tags"
            ></v-select>
            <v-spacer></v-spacer>
            <v-select
              flat
              solo-inverted
              multiple
              v-model="excludedTags"
              clearable
              hide-details
              :items="Tags"
              label="Excluded Tags"
            ></v-select>
            <v-spacer></v-spacer>
            <v-text-field v-model="searchTxt" prepend-inner-icon="mdi-magnify" flat
              solo-inverted hide-details clearable></v-text-field>
        <!-- <v-spacer></v-spacer>
            <v-btn text @click="removeDuplicates" color="blue">Remove Dups</v-btn>
            <v-btn text @click="deletePage" color="blue">Delete Page</v-btn>
            <v-btn text @click="SaveAll" color="green">Save Page</v-btn> -->
    </v-toolbar>
        </template>
        <template v-slot:default="{items}">
          
          <v-row id="scroll-content">
          <v-col class="d-flex child-flex px-12 video-wrapper" v-for="(a,i) in items" :key="a.etag"
      cols="12"
    ><blob :value="a" :all-tags="Tags" v-bind="a" @input="UpdateAttachment"
    v-on:delete="DeleteBlob" :hash-count="hashs[a.md5]" v-on:playing="VideoPlaying" :ref="a.etag"></blob>
      </v-col>
          </v-row>
            </template>
            <template v-slot:footer>
        <v-row
          class="mt-2"
          align="center"
          justify="center"
        >
        <v-spacer></v-spacer>
<span class="grey--text">Items per page</span>
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
                {{ itemsPerPage }}
                <v-icon>{{icons.mdiChevronDown}}</v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item
                v-for="(number, index) in itemsPerPageArray"
                :key="index"
                @click="setPageSize(number)"
              >
                <v-list-item-title>{{ number }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>

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
                <v-icon>{{icons.mdiChevronDown}}</v-icon>
              </v-btn>
            </template>
            <v-list max-height="50vh">
              <v-list-item
                v-for="(number, index) in numberOfPages"
                :key="index"
                :to="`/pView/${number}`"
                
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
            :disabled="prefetching || currentPage<3"
            dark
            color="blue darken-3"
            class="mr-1"
            :to="`/pView/1`"
          >
            <v-icon>{{icons.mdiPageFirst}}</v-icon>
          </v-btn>
          <v-btn
            fab
            :disabled="prefetching || currentPage==1"
            dark
            color="blue darken-3"
            class="mx-1"
            :to="`/pView/${currentPage-1}`"
          >
            <v-icon>{{icons.mdiChevronLeft}}</v-icon>
          </v-btn>
          <v-btn
            fab :disabled="prefetching || currentPage==numberOfPages"
            dark
            color="blue darken-3"
            class="mx-1"
            :to="`/pView/${currentPage+1}`"
          >
            <v-icon>{{icons.mdiChevronRight}}</v-icon>
          </v-btn>
          <v-btn
            fab
            :disabled="prefetching || currentPage>numberOfPages-2"
            dark
            color="blue darken-3"
            class="ml-1"
            :to="`/pView/${numberOfPages}`"
          >
            <v-icon>{{icons.mdiPageLast}}</v-icon>
          </v-btn>
        </v-row>

      </template>
        </v-data-iterator>
            
    </v-row>
    <!-- <infinite-loading @infinite="LoadMore"></infinite-loading> -->
    
    </v-container>
</template>

<script>
import pBlob from "@/components/pBlob";
import heicConvert from "heic-convert";
import { ChatService } from "@/service/chatService";
const { BlobServiceClient } = require("@azure/storage-blob");
const { QueueServiceClient } = require("@azure/storage-queue");

const { DateTime } = require("luxon");
import { mapMutations, mapGetters, mapActions } from "vuex";

const convertBlobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsDataURL(blob);
  });

import {
  mdiMagnify,
  mdiSortNumericAscending,
  mdiSortNumericDescending,
  mdiDownload,
  mdiChevronDown,
  mdiChevronRight,
  mdiRefreshCircle,
  mdiChevronLeft,
  mdiStar,
  mdiVideo,
  mdiMessageImageOutline,
  mdiPageFirst,
  mdiCloseOutline,
  mdiStarOutline,
  mdiPageLast,
} from "@mdi/js";

function wait(ms, value) {
  return new Promise((resolve) => setTimeout(resolve, ms, value));
}

export default {
  name: "PViewer",
  components: {
    blob: pBlob,
  },
  data: () => ({
    refreshTimer: null,
    attachments: [],
    currentPage: 1,
    lightbox: false,
    lb_url: null,
    prefetching: false,
    searchTxt: "",
    persistedFaceIds: [],
    busy: false,
    sortDesc: true,
    sortBy: "duration",
    blobService: null,
    cache: [],
    selectedUsers: [],
    selectedTags: [],
    excludedTags: [],
    faceTrained: false,
    multiples: false,
    withFaces: false,
    withE: true,
    icons: {
      mdiMagnify,
      mdiSortNumericAscending,
      mdiVideo,
      mdiSortNumericDescending,
      mdiDownload,
      mdiMessageImageOutline,
      mdiRefreshCircle,
      mdiStar,
      mdiChevronDown,
      mdiChevronRight,
      mdiCloseOutline,
      mdiStarOutline,
      mdiChevronLeft,
      mdiPageFirst,
      mdiPageLast,
    },
    hashs: {},
    sasToken:
      "?sv=2020-04-08&st=2021-09-08T15%3A37%3A30Z&se=2078-09-09T15%3A37%3A00Z&sr=c&sp=racwdxlt&sig=o4f3atH5F16Mlm6SFkn7rajyKEQKGmXJTD5kdPeO4vs%3D",
    itemsPerPageArray: [5, 10, 15, 20, 25, 50, 100],
    ignoredFilter: "Exclude Ignored",
  }),
  watch: {
    currentPage(v) {
      this.scrollTop();
    },
    pg(v) {
      if (typeof v === "string") {
        this.currentPage = parseInt(v);
      } else if (typeof v === "number") {
        this.currentPage = v;
      }
      //
    },
    withFaces(v) {
      if (v) this.withE = false;
    },
    withE(v) {
      if (v) this.withFaces = false;
    },
    itemsPerPage(v) {
      if (this.currentPage > this.numberOfPages) {
        this.currentPage = this.numberOfPages;
      }
    },
    numberOfPages(v) {
      if (this.currentPage > this.numberOfPages) {
        this.currentPage = this.numberOfPages;
      }
    },
    attachments(v) {
      this.hashs = this.$_.countBy(v, "md5");
    },
  },
  props: {
    personId: {
      type: [Number, String],
    },
    pg: {
      type: [Number, String],
      default: 1,
    },
  },
  methods: {
    ...mapMutations("Attachments", [
      "setAttachPage",
      "switchThread",
      "setAllowedMimes",
      "setPageSize",
      "setFavs",
      "saveBlob",
      "addFav",
      "removeFav",
      "addIgnored",
    ]),
    ...mapActions("Attachments", ["loadSavedFace", "trainGroup"]),
    UpdateAttachment(v) {
      var container = "media/p";

      var idx = this.$_.findIndex(this.attachments, (a) => a.etag == v.etag);
      this.$set(this.attachments, idx, v);

      var containerClient = this.blobService.getContainerClient(container);

      var blobClient = containerClient.getBlockBlobClient(v.transfer_name);

      blobClient.setTags(v.tags);
      blobClient.setMetadata(v.metadata);
    },
    CheckFaces() {
      var queueServiceClient = new QueueServiceClient(
        "https://shackletonmedia.queue.core.windows.net?sv=2019-02-02&st=2021-09-14T18%3A55%3A04Z&se=2081-09-15T18%3A55%3A00Z&sp=rau&sig=8wHKBoQGQmNfA4CdEXQEutn3aHtMxIYnY5Xv%2Ft05ewg%3D"
      );

      var queueClient = queueServiceClient.getQueueClient("pending-faces");

      this.$_.each(
        this.$_.filter(this.attachments, (i) => {
          var tags = this.$_.get(i, "tags");
          if (typeof tags == "undefined") return false;

          return (
            parseInt(this.$_.get(tags, "faceCount", "0")) > 0 &&
            !this.$_.get(tags, "eFound", null)
          );
        }),
        (a) => {
          queueClient
            .sendMessage(a.name)
            .then((res) => console.log(res))
            .catch((err) => console.error(err));
        }
      );
    },
    SaveAll() {
      this.$_.each(this.$_.pluck(this.VisibleAttachments, "etag"), (x) =>
        this.saveBlob(x)
      );
    },
    scrollTop() {
      var elem = document.getElementById("scroll-content");
      if (elem && elem.scrollTop) elem.scrollTop = 0;
    },
    VideoPlaying(id) {
      this.$_.each(
        this.$_.filter(this.VisibleAttachments, (v) => v.etag != id),
        (r) => {
          var player = this.$refs[r.etag][0];
          //debugger;
          player.pausePlayer();
        }
      );
    },
    SetPage(v) {
      debugger;
    },
    async LoadAttachments() {
      this.busy = true;
      var container = "media";
      console.log(container);
      var containerClient = this.blobService.getContainerClient(container);

      let i = 1;
      var tmp = [];

      let iter = containerClient.listBlobsFlat({
        prefix: "p",
        includeDeleted: false,
        includeTags: true,
        includeMetadata: true,
      });
      let blobItem = await iter.next();
      while (!blobItem.done) {
        var hashArray = Array.from(
          new Uint8Array(blobItem.value.properties.contentMD5)
        );

        // convert bytes to hex string
        var hashHex = hashArray
          .map((b) => ("00" + b.toString(16)).slice(-2))
          .join("");

        tmp.push({
          name: blobItem.value.name,
          mime_type: blobItem.value.properties.contentType,
          etag: blobItem.value.properties.etag,
          size: blobItem.value.properties.contentLength,
          md5Array: blobItem.value.properties.contentMD5,
          md5: hashHex,
          transfer_name: blobItem.value.name.substr(2),
          tags: blobItem.value.tags || [],
          date: blobItem.value.properties.lastModified,
          metadata: blobItem.value.metadata || {},
        });
        // debugger;
        blobItem = await iter.next();
      }

      this.attachments = this.$_.uniq(
        this.$_.filter(
          tmp.map((obj) => {
            obj.url = "https://shackleton-media.azureedge.net/" + obj.name;
            // obj.url =
            //   "https://shackletonmedia.blob.core.windows.net/media/" + obj.name;
            // obj.origWidth = parseInt(this.$_.get(obj.metadata, "origwidth", 0));
            // obj.origHeight = parseInt(
            //   this.$_.get(obj.metadata, "origheight", 0)
            // );

            // obj.FaceRectangles = this.$_.chain(obj.metadata || {})
            //   .pick((v, k) => k.startsWith("eRec") || k.startsWith("erec"))
            //   .values()
            //   .map((r) => {
            //     return JSON.parse(
            //       `{"${r}}`.replace(/:/g, '":').replace(/,/g, ',"')
            //     );
            //   })
            //   .value();
            // obj.date = DateTime.fromSeconds(
            //       obj.msgDate / 1000000000 + 978223302,
            //       {
            //         zone: "UTC",
            //       }
            //     );
            return obj;
          }),
          (i) =>
            !this.$_.contains(this.cache, i.etag) &&
            !i.name.endsWith(".fsa") &&
            !i.name.includes("AppleDouble") &&
            !i.name.includes("giphy")
        ),
        "etag"
      );

      this.cache = [];
      this.busy = false;
      // var queueServiceClient = new QueueServiceClient(
      //   "https://shackletonmedia.queue.core.windows.net?sv=2019-02-02&st=2021-09-14T18%3A55%3A04Z&se=2081-09-15T18%3A55%3A00Z&sp=rau&sig=8wHKBoQGQmNfA4CdEXQEutn3aHtMxIYnY5Xv%2Ft05ewg%3D"
      // );

      // var queueClient = queueServiceClient.getQueueClient("pending-faces");

      // debugger;

      // this.$http
      //   .get(
      //     `#{apiUrl}#/api/personAttachments/${this.personId.replace("h", "")}`
      //   )
      //   .then(async (resp) => {
      //     this.attachments = this.$_.filter(
      //       resp.data.map((obj) => {
      //         obj.url =
      //           obj.mime_type == "image/heic"
      //             ? `https://Heic.azureedge.net${obj.filename}`
      //             : `https://shackleton-media.azureedge.net${obj.filename}`;

      //         obj.date = DateTime.fromSeconds(
      //           obj.msgDate / 1000000000 + 978223302,
      //           {
      //             zone: "UTC",
      //           }
      //         );
      //         return obj;
      //       }),
      //       (a) =>
      //         !this.$_.contains(["application/pdf", "image/gif"], a.mime_type)
      //     );
      //   })
      //   .finally(() => {
      //     this.busy = false;
      //     //this.setAllowedMimes(this.MediaTypes);
      //     this.PreloadMedia();
      //   });
    },
    LoadMore($state) {
      if (this.busy) $state.reset();
      else {
        if (this.FilteredAttachments.length > this.VisibleAttachments.length) {
          this.currentPage++;
          $state.loaded();
        } else {
          $state.complete();
        }
      }
    },
    showLightBox(val) {
      this.lb_url = val;
      this.lightbox = true;
    },
    DeleteBlob(v) {
      var containerClient = this.blobService.getContainerClient("media");

      this.cache.push(v.etag);

      containerClient
        .deleteBlob(v.name)
        .then(() => {
          var idx = this.$_.indexOf(this.attachments, v);
          if (idx && idx >= 0) this.$delete(this.attachments, idx);
        })
        .catch((err) => console.error(err));
    },
    deletePage() {
      this.$_.each(
        this.$_.filter(this.attachments, (a) =>
          this.$_.contains(
            this.$_.pluck(this.VisibleAttachments, "etag"),
            a.etag
          )
        ),
        (a) => {
          this.DeleteBlob(a);
          this.cache.push(a.etag);
        }
      );
      this.scrollTop();
    },
    removeDuplicates() {
      var lst = [];
      if (this.multipleHashs.length == 0) return;
      this.$_.each(this.multipleHashs, (h) => {
        var tmp = this.$_.filter(this.attachments, (a) => a.md5 == h);

        if (tmp.length <= 1) return;

        this.$_.each(
          this.$_.without(tmp, tmp[0]).map((x) => {
            return { name: x.name, idx: this.$_.indexOf(this.attachments, x) };
          }),
          (t) => {
            lst.push(t);
          }
        );
      });

      lst = this.$_.sortBy(lst, "idx");
      lst.reverse();

      this.$_.each(lst, (t) => {
        var obj = this.$_.find(this.attachments, (i) => i.name == t.name);
        if (obj) {
          this.DeleteBlob(obj);

          // this.$delete(this.attachments, idx);
        }
      });
    },
    DownloadAttachment(att) {
      this.$http
        .get(att.url, { responseType: "blob" })
        .then((response) => {
          const blob = new Blob([response.data], { type: att.mime_type });
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = att.transfer_name;
          link.click();
          URL.revokeObjectURL(link.href);
        })
        .catch(console.error);
    },
    SetFavorite(a) {
      var container = `media/Attachments${a.filename.replace(
        a.transfer_name,
        ""
      )}`;
      container = container.substr(0, container.length - 1);

      var containerClient = this.blobService.getContainerClient(container);

      var blobClient = containerClient.getBlockBlobClient(a.transfer_name);

      blobClient.setTags({
        favorite: "true",
        attachment_id: a.attachment_id.toString(),
        chat_id: a.chat_id.toString(),
      });

      this.addFav(a.filename);
    },
    refresh() {
      // Refresh code goes here
      this.LoadAttachments();
    },
    RemoveFavorite(a) {
      var container = `media/Attachments${a.filename.replace(
        a.transfer_name,
        ""
      )}`;
      container = container.substr(0, container.length - 1);

      var containerClient = this.blobService.getContainerClient(container);

      var blobClient = containerClient.getBlockBlobClient(a.transfer_name);

      blobClient.setTags({
        favorite: "false",
        attachment_id: a.attachment_id.toString(),
        chat_id: a.chat_id.toString(),
      });

      this.removeFav(a.filename);
    },
  },
  filters: {
    DisplayDate: function (value) {
      if (!value) return "";
      return value.toLocal().toLocaleString(DateTime.DATETIME_SHORT);
    },
  },
  computed: {
    ...mapGetters("Attachments", [
      "itemsPerPage",
      "Stars",
      "FaceFiles",
      "Saved",
      "Ignored",
    ]),
    // TrainedImages() {
    //   return this.$_.uniq(
    //     this.$_.filter(this.persistedFaceIds, (f) => typeof f !== "undefined")
    //   );
    // },
    Users() {
      return this.$_.uniq(
        this.$_.pluck(this.$_.pluck(this.attachments, "tags"), "username")
      ).sort();
    },
    Tags() {
      return this.$_.filter(
        this.$_.uniq(
          this.$_.flatten(
            this.$_.filter(
              this.$_.pluck(
                this.$_.pluck(this.attachments, "metadata"),
                "tags"
              ),
              (v) => typeof v != "undefined"
            ).map((v) => {
              return (v || "").split(",");
            })
          )
        ),
        (v) => v.length > 0
      );
    },
    MediaTypes() {
      return this.$_.pluck(
        this.$_.uniq(this.attachments, (a) => a.mime_type),
        "mime_type"
      );
    },
    multipleHashs() {
      return this.$_.filter(this.$_.keys(this.hashs), (k) => this.hashs[k] > 1);
    },
    FilteredAttachments() {
      var temp = this.attachments || [];

      if (this.searchTxt) {
        temp = this.$_.filter(temp, (i) => i.name.includes(this.searchTxt));
      }

      if (this.selectedUsers.length > 0) {
        temp = this.$_.filter(temp, (i) =>
          this.$_.contains(this.selectedUsers, i.tags["username"])
        );
      }

      if (this.selectedTags.length > 0) {
        temp = this.$_.filter(
          temp,
          (i) =>
            this.$_.intersection(
              this.selectedTags,
              (i.metadata["tags"] || "").split(",")
            ).length > 0
        );
      }

      if (this.excludedTags.length > 0) {
        temp = this.$_.filter(
          temp,
          (i) =>
            this.$_.intersection(
              this.excludedTags,
              (i.metadata["tags"] || "").split(",")
            ).length == 0
        );
      }

      if (this.sortBy == "name") {
        temp = this.$_.sortBy(temp, (a) => {
          return this.$_.has(a.tags, "display_name")
            ? a.tags.display_name
            : a.name.substr(a.name.lastIndexOf("/") + 1);
        });
      } else if (this.sortBy == "duration") {
        temp = this.$_.sortBy(temp, (a) => {
          return this.$_.has(a.tags, "duration")
            ? parseInt(a.tags.duration)
            : 0;
        });
      } else {
        temp = this.$_.sortBy(temp, this.sortBy);
      }
      if (this.sortDesc) {
        temp.reverse();
      }
      return temp;
    },
    // currentPage: {
    //   get() {
    //     return this.curPage;
    //   },
    //   set(v) {
    //     this.setAttachPage(v);
    //   },
    // },
    VisibleAttachments() {
      if (this.numberOfPages > 0) {
        return this.$_.chunk(this.FilteredAttachments || [], this.itemsPerPage)[
          Math.max(this.currentPage - 1, 0)
        ];
      } else {
        return [];
      }
    },
    numberOfPages() {
      if ((this.FilteredAttachments || []).length == 0) return 0;
      return (
        Math.floor(this.FilteredAttachments.length / this.itemsPerPage) + 1 || 0
      );
    },
  },
  beforeRouteUpdate(to, from, next) {
    this.LoadAttachments();
    next();
  },
  beforeDestroy() {
    if (this.faceTrained) this.trainGroup();
    window.clearInterval(this.refreshTimer);
  },
  created() {
    if (this.pg) this.currentPage = parseInt(this.pg);
  },
  async mounted() {
    this.blobService = new BlobServiceClient(
      `https://shackletonmedia.blob.core.windows.net?sv=2020-04-08&ss=btqf&srt=sco&st=2021-09-08T17%3A42%3A09Z&se=2046-09-09T17%3A42%3A00Z&sp=rwdxftlacup&sig=Q3RCnYUF0zJQAhDM4sOchARYPb%2BoZdMt3hUCqN%2BkEMU%3D`
    );
    await this.LoadAttachments();
    this.refreshTimer = window.setInterval(this.refresh, 250000);
    //this.LoadAttachments();
    //var tmp = [];

    // let blobItem = await iter.next();
    // while (!blobItem.done) {
    //   tmp.push(blobItem.value.name.replace("Attachments", ""));
    //   blobItem = await iter.next();
    // }
  },
};
</script>
<style lang="scss" scoped>
.v-main__wrap > div {
  -webkit-user-drag: none;
}

#scroll-content {
  overflow-y: scroll;
  max-height: calc(100vh - 130px);
  margin-top: 8px !important;
}
</style>
