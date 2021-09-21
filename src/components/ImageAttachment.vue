<template>
    <v-img
        :src="ImageSource" @click.stop="$emit('showLB',ImageSource)" :id="value.etag"
        max-height="500" @load="loaded=true"
              contain ref="img"
        class="grey lighten-2"
      ><template v-slot:placeholder>
          <v-row
            class="fill-height ma-0"
            align="center"
            justify="center"
          >
            <v-progress-circular
              indeterminate
              color="grey lighten-5"
            ></v-progress-circular>
          </v-row>
        </template>
        <div class="face-rect" v-for="(r,i) in rects" v-show="showRecs"
        :key="i" :style="r.style"></div>
        </v-img>
</template>

<script>
import heicConvert from "heic-convert";

export default {
  name: "imageAttachment",
  data() {
    return {
      imageData: null,
      loaded: false,
      yFactor: null,
    };
  },
  props: {
    value: {
      type: Object,
    },
    metadata: {
      type: Object,
    },
    showRecs: {
      type: Boolean,
      default: false,
    },
    origWidth: { type: Number },
    origHeight: { type: Number },
  },
  watch: {
    loaded(v) {
      if (v) {
        this.UpdateCalcs();
      }
    },
  },
  computed: {
    ImageSource() {
      // return this.value.data || this.value.url;
      return this.imageData || this.value.data || this.value.url;
    },
    hFactor() {
      if (!this.loaded) return 1;
      // var orig = this.$_.get(this.metadata, "origheight");
      // if (!orig) return null;

      // orig = parseInt(orig);

      var curr = this.$el.getElementsByClassName("v-responsive__content")[0]
        .offsetHeight;
      if (!curr || curr == 0) return null;

      return curr / this.origHeight;
    },
    xPadding() {
      if (!this.loaded || !this.yFactor) return 1;

      return Math.floor(
        (this.containerWidth - this.origWidth * this.yFactor) / 2
      );

      var orig = this.origHeight * this.yFactor;
      var padding = 0;

      try {
        var containerWidth = this.$el.offsetWidth;
        padding = Math.floor((containerWidth - orig) / 2);
      } catch (e) {}

      return padding;
    },
    rects() {
      if (!this.loaded || !this.value.FaceRectangles) return [];
      return this.value.FaceRectangles.map((r) => {
        return {
          show: this.showRecs,
          style: {
            height: `${
              Math.floor(r.height * this.yFactor) > 496
                ? 496 - Math.floor(r.top * this.yFactor)
                : Math.floor(r.height * this.yFactor)
            }px`,
            width: `${Math.floor(r.width * this.yFactor)}px`,
            top: `${Math.floor(r.top * this.yFactor)}px`,
            left: `${this.xPadding + Math.floor(r.left * this.yFactor)}px`,
          },
        };
      });
      return this.$_.chain(this.metadata || {})
        .pick((v, k) => k.startsWith("eRec") || k.startsWith("erec"))
        .values()
        .map((r) => {
          var s = JSON.parse(`{"${r}}`.replace(/:/g, '":').replace(/,/g, ',"'));

          //debugger;

          return {
            show: this.showRecs,
            style: {
              height: `${
                Math.floor(s.height * this.yFactor) > 496
                  ? 496 - Math.floor(s.top * this.yFactor)
                  : Math.floor(s.height * this.yFactor)
              }px`,
              width: `${Math.floor(s.width * this.yFactor)}px`,
              top: `${Math.floor(s.top * this.yFactor)}px`,
              left: `${this.xPadding + Math.floor(s.left * this.yFactor)}px`,
            },
          };
        })
        .value();
      // return [
      //   {
      //     show: true,
      //     style: { height: "50%", width: "50%", top: "25%", left: "25%" },
      //   },
      // ];
    },
    containerWidth() {
      try {
        return this.$el.offsetWidth;
      } catch (e) {
        return 0;
      }
    },

    containerHeight() {
      if (!this.loaded) return 500;
      try {
        return this.$el.offsetHeight;
      } catch (e) {
        return 0;
      }
    },
  },
  methods: {
    UpdateCalcs() {
      this.yFactor = this.containerHeight / this.origHeight;
    },
    async GetHeic() {
      let output = await fetch(this.value.url).then(async (data) => {
        const buffer = Buffer.from(await data.arrayBuffer());

        return heicConvert({ buffer, format: "PNG" });
      });

      this.imageData = `data:image/png;base64,${btoa(
        output.reduce((data, byte) => `${data}${String.fromCharCode(byte)}`, "")
      )}`;
    },
  },
  created() {
    if (this.value.mime_type == "image/heic") this.GetHeic();
  },
};
</script>

<style lang="scss" scoped>
.face-rect {
  border: 2px solid orange;
  position: relative;
}
</style>