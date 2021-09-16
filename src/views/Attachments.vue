<template>
    <v-container>
        <v-toolbar
      dense
      float
    >
      <v-btn icon @click="sortDesc=false" :color="!sortDesc ? 'primary' : 'secondary'">
        <v-icon>{{icons.mdiSortAscending}}</v-icon>
      </v-btn>

      <v-btn icon @click="sortDesc=true" :color="sortDesc ? 'primary' : 'secondary'">
        <v-icon>{{icons.mdiSortDescending}}</v-icon>
      </v-btn>
    </v-toolbar>
    <v-row>
            <v-col class="d-flex child-flex" v-for="a in VisibleAttachments" :key="a.attachment_id"
      cols="12" md="6" lg="4"
    ><v-card min-height="500">
        <v-card-title class="text-h6">
              {{a.transfer_name}}
            </v-card-title>
            <image-attachment
        :value="a" v-on:showLB="showLightBox"
        max-height="500" v-if="(a.mime_type || []).includes('image')"
      ></image-attachment>
        <video v-if="(a.mime_type || []).includes('video')" controls preload :src="a.filename" height="500" />
      
            <v-card-actions>
              <v-btn icon text link v-if="a.chat_id" :to="`/${a.chat_id}/${a.message_id}`" color="primary">
              <v-icon>{{icons.mdiMessageImageOutline}}</v-icon>
            </v-btn>
            <v-btn icon text color="primary">
        <v-icon>{{icons.mdiDownload}}</v-icon>
      </v-btn>
      </v-card-actions>
          </v-card>
      </v-col>
    </v-row>
    <infinite-loading @infinite="LoadMore"></infinite-loading>
    <v-dialog v-model="lightbox" max-width="90%" height="90%">
        <v-img :src="lb_url" contain width="100%" height="100%"></v-img>
      </v-dialog>
    </v-container>
</template>

<script>
import InfiniteLoading from "vue-infinite-loading";
import ImageAttachment from "@/components/ImageAttachment";
import { mapActions, mapGetters } from "vuex";
import {
  mdiMagnify,
  mdiSortAscending,
  mdiSortDescending,
  mdiDownload,
  mdiMessageImageOutline,
} from "@mdi/js";

export default {
  name: "Attachments",
  components: {
    InfiniteLoading,
    "image-attachment": ImageAttachment,
    ImageAttachment,
  },
  data: () => ({
    attachments: [],
    //currentPage: 1,
    lightbox: false,
    lb_url: null,
    busy: true,
    sortDesc: true,
    icons: {
      mdiMagnify,
      mdiSortAscending,
      mdiSortDescending,
      mdiDownload,
      mdiMessageImageOutline,
    },
  }),
  props: {
    personId: {
      type: [Number, String],
    },
  },
  methods: {
    LoadAttachments() {
      this.$http
        .get(
          `#{apiUrl}#/api/personAttachments/${this.personId.replace("h", "")}`
        )
        .then(async (resp) => {
          this.attachments = this.$_.filter(
            resp.data.map((obj) => {
              obj.filename = `http://shackleton-sms.azureedge.net${obj.filename}`;

              return obj;
            }),
            (a) => a.mime_type !== "image/gif"
          );
        })
        .finally(() => (this.busy = false));
    },

    LoadMore($state) {
      if (this.busy) $state.reset();
      else {
        if (this.attachments.length > this.VisibleAttachments.length) {
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
  },
  computed: {
    ...mapGetters("Attachments", ["attachmentPage"]),
    pId() {
      return this.personId.includes("h")
        ? this.personId.replace("h", "")
        : this.personId;
    },
    currentPage: {
      get() {
        return this.attachmentPage;
      },
      set(v) {},
    },
    VisibleAttachments() {
      var temp = this.$_.sortBy(this.attachments, "created_date");
      if (this.sortDesc) {
        temp.reverse();
      }
      return this.$_.first(temp, this.currentPage * 16);
    },
  },
  beforeRouteUpdate(to, from, next) {
    this.LoadAttachments();
    next();
  },
  created() {
    this.LoadAttachments();
  },
};
</script>
<style lang="scss" scoped>
.v-main__wrap > div {
  -webkit-user-drag: none;
}
</style>