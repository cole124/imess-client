<template>
    <v-container fluid>
        
    
      <v-data-iterator
        :items="VisibleAttachments"
        item-key="attachment_id"
        hide-default-footer
        :loading="prefetching || busy"
        :items-per-page="itemsPerPage"
        >
        <template v-slot:header>
          <v-toolbar
        ref="toolbar"
      dense
      class="mb-1"
    >
    <v-btn-toggle
              v-model="sortDesc"
              mandatory
            >
              <v-btn
                large
                depressed
                color="blue"
                :value="false"
              >
                <v-icon>{{icons.mdiSortNumericAscending}}</v-icon>
              </v-btn>
              <v-btn
                large
                depressed
                color="blue"
                :value="true"
              >
                <v-icon>{{icons.mdiSortNumericDescending}}</v-icon>
              </v-btn>
            </v-btn-toggle>
      <v-spacer></v-spacer>
      <v-select
              flat
              solo-inverted
              v-model="ignoredFilter"
              hide-details
              :items="['All','Exclude Ignored','Exclude Flagged','Only Ignored','Only Starred']"
              label="Filter"
            ></v-select>
            <v-spacer></v-spacer>
            <v-text-field v-model="searchTxt" prepend-inner-icon="mdi-magnify" flat
              solo-inverted hide-details clearable></v-text-field>
        <v-spacer></v-spacer>
            <v-select
              :value="allowed_mimes"
              flat
              solo-inverted
              @input="setAllowedMimes"
              hide-details
              :items="MediaTypes"
              label="filter"
              multiple
            ></v-select>
    </v-toolbar>
        </template>
        <template v-slot:default="{items}">
          <v-row>
          <v-col class="d-flex child-flex" v-for="a in items" :key="a.attachment_id"
      cols="12" md="6" 
    ><attachment :value="a" v-on:set-fav="SetFavorite" v-on:rem-fav="RemoveFavorite" v-on:showLB="showLightBox"></attachment>
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
            :disabled="prefetching || currentPage<3"
            dark
            color="blue darken-3"
            class="mr-1"
            :to="`/Person/${personId}/Attachments/1`"
          >
            <v-icon>{{icons.mdiPageFirst}}</v-icon>
          </v-btn>
          <v-btn
            fab
            :disabled="prefetching || currentPage==1"
            dark
            color="blue darken-3"
            class="mx-1"
            :to="`/Person/${personId}/Attachments/${currentPage-1}`"
          >
            <v-icon>{{icons.mdiChevronLeft}}</v-icon>
          </v-btn>
          <v-btn
            fab :disabled="prefetching || currentPage==numberOfPages"
            dark
            color="blue darken-3"
            class="mx-1"
            :to="`/Person/${personId}/Attachments/${currentPage+1}`"
          >
            <v-icon>{{icons.mdiChevronRight}}</v-icon>
          </v-btn>
          <v-btn
            fab
            :disabled="prefetching || currentPage>numberOfPages-2"
            dark
            color="blue darken-3"
            class="ml-1"
            :to="`/Person/${personId}/Attachments/${numberOfPages}`"
          >
            <v-icon>{{icons.mdiPageLast}}</v-icon>
          </v-btn>
        </v-row>

      </template>
        </v-data-iterator>
            
    </v-row>
    <!-- <infinite-loading @infinite="LoadMore"></infinite-loading> -->
    <v-dialog v-model="lightbox" max-width="90%" height="90%">
        <v-img :src="lb_url" contain width="100%" height="100%"></v-img>
      </v-dialog>
    </v-container>
</template>

<script>
import Attachment from "@/components/Attachment";
import heicConvert from "heic-convert";
import { ChatService } from "@/service/chatService";
const { BlobServiceClient } = require("@azure/storage-blob");

const { DateTime } = require("luxon");
import { mapMutations, mapGetters } from "vuex";

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
  name: "Attachments",
  components: {
    Attachment,
  },
  data: () => ({
    refreshTimer: null,
    attachments: [],
    currentPage: 1,
    lightbox: false,
    lb_url: null,
    prefetching: false,
    searchTxt: "",
    busy: true,
    sortDesc: true,
    blobService: null,
    cache: null,
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
    sasToken:
      "?sv=2020-04-08&st=2021-09-08T15%3A37%3A30Z&se=2078-09-09T15%3A37%3A00Z&sr=c&sp=racwdxlt&sig=o4f3atH5F16Mlm6SFkn7rajyKEQKGmXJTD5kdPeO4vs%3D",
    itemsPerPageArray: [5, 10, 15, 20, 25],
    ignoredFilter: "Exclude Ignored",
  }),
  watch: {
    currentPage(v) {
      this.scrollTop();
      this.PreloadMedia();
    },
    pg(v) {
      if (typeof v === "string") {
        this.currentPage = parseInt(v);
      } else if (typeof v === "number") {
        this.currentPage = v;
      }
      //
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
      "addFav",
      "removeFav",
      "addIgnored",
    ]),
    UpdateItemsPerPage(v) {
      console.log(v);
    },
    PreloadMedia() {
      if (this.currentPage < this.numberOfPages) {
        console.log("Starting Prefetch");
        this.prefetching = true;
        Promise.all(
          this.$_.filter(
            this.$_.chunk(this.FilteredAttachments, this.itemsPerPage)[
              this.currentPage
            ],
            (i) => i.mime_type.includes("image")
          ).map((a) => {
            return fetch(a.url)
              .then((r) => r.blob())
              .then((b) => (a.data = URL.createObjectURL(b)))
              .catch((err) => err.message);
          })
        )
          .then((r) => console.log(`prefetched page: ${this.currentPage + 1}`))
          .catch((err) => console.error("Precache Error", err))
          .finally(() => (this.prefetching = false));
      } else {
        console.log("No Prefetch. Last Page");
      }
    },
    scrollTop() {
      this.$nextTick(() => this.$vuetify.goTo(0));
    },
    LoadAttachments() {
      this.$http
        .get(
          `#{apiUrl}#/api/personAttachments/${this.personId.replace("h", "")}`
        )
        .then(async (resp) => {
          this.attachments = this.$_.filter(
            resp.data.map((obj) => {
              obj.url =
                obj.mime_type == "image/heic"
                  ? `https://Heic.azureedge.net${obj.filename}`
                  : `https://shackleton-media.azureedge.net/Attachments${obj.filename}`;

              obj.date = DateTime.fromSeconds(
                obj.msgDate / 1000000000 + 978223302,
                {
                  zone: "UTC",
                }
              );
              return obj;
            }),
            (a) =>
              !this.$_.contains(["application/pdf", "image/gif"], a.mime_type)
          );
        })
        .finally(() => {
          this.busy = false;
          //this.setAllowedMimes(this.MediaTypes);
          this.PreloadMedia();
        });
      let config = {
        headers: {
          "Ocp-Apim-Subscription-Key": "313896ea64f84b83b5b5cfd8f5ae644b",
        },
      };
      var that = this;
      this.$http
        .get(
          "https://centralus.api.cognitive.microsoft.com/face/v1.0/persongroups/neighbors/persons/76386f7f-05db-421d-9efa-5bb6fafaf9f7",
          config
        )
        .then((res) => {
          promise
            .all(
              res.data.persistedFaceIds.map((f) => {
                return that.$http
                  .get(
                    `https://centralus.api.cognitive.microsoft.com/face/v1.0/persongroups/neighbors/persons/76386f7f-05db-421d-9efa-5bb6fafaf9f7/persistedFaces/${f}`,
                    config
                  )
                  .then((result) => {
                    debugger;
                  })
                  .catch((err) => console.log(err));
              })
            )
            .then((r2) => {
              debugger;
            });
        })
        .catch((err) => console.log(err));
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
      "allowed_mimes",
      "itemsPerPage",
      "Stars",
      "Ignored",
    ]),
    MediaTypes() {
      return this.$_.pluck(
        this.$_.uniq(this.attachments, (a) => a.mime_type),
        "mime_type"
      );
    },
    FilteredAttachments() {
      var temp = this.$_.sortBy(
        this.$_.filter(this.attachments, (a) => {
          return (
            this.$_.contains(this.allowed_mimes, a.mime_type) &&
            ((this.ignoredFilter == "Exclude Ignored" &&
              !this.$_.contains(this.Ignored || [], a.filename)) ||
              (this.ignoredFilter == "Only Ignored" &&
                this.$_.contains(this.Ignored || [], a.filename)) ||
              (this.ignoredFilter == "Only Starred" &&
                this.$_.contains(this.Stars || [], a.filename)) ||
              (this.ignoredFilter == "Exclude Flagged" &&
                !this.$_.contains(this.Ignored || [], a.filename) &&
                !this.$_.contains(this.Stars || [], a.filename)) ||
              this.ignoredFilter == "All")
          );
        }),
        "date"
      );

      if (this.searchTxt) {
        temp = this.$_.filter(temp, (i) =>
          i.transfer_name.includes(this.searchTxt)
        );
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
          this.currentPage - 1
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
    window.clearInterval(this.refreshTimer);
  },
  created() {
    this.switchThread(this.personId);
    if (this.pg) this.currentPage = parseInt(this.pg);
    this.LoadAttachments();
  },
  async mounted() {
    this.blobService = new BlobServiceClient(
      `https://shackletonmedia.blob.core.windows.net?sv=2020-04-08&ss=btqf&srt=sco&st=2021-09-08T17%3A42%3A09Z&se=2046-09-09T17%3A42%3A00Z&sp=rwdxftlacup&sig=Q3RCnYUF0zJQAhDM4sOchARYPb%2BoZdMt3hUCqN%2BkEMU%3D`
    );
    var tmp = [];
    const iter = this.blobService.findBlobsByTags("favorite='true'");

    let blobItem = await iter.next();
    while (!blobItem.done) {
      tmp.push(blobItem.value.name.replace("Attachments", ""));
      blobItem = await iter.next();
    }

    this.setFavs(tmp);
    this.refreshTimer = window.setInterval(this.refresh, 60000);
  },
};
</script>
<style lang="scss" scoped>
.v-main__wrap > div {
  -webkit-user-drag: none;
}
video {
  object-fit: contain;
  max-height: "500";
}
</style>