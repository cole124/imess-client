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
                  <v-hover @input="hover=true">
          <v-icon
          color="grey lighten-1"
          large
        >
          {{icons.mdiAccount}}
        </v-icon>
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
      <!-- <v-btn icon :color="iconColor" @click="processBlob">
        <v-icon>{{icons.mdiCloudUploadOutline}}</v-icon>
      </v-btn> -->
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
    hover: true,
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
    processBlob() {
      var queueServiceClient = new QueueServiceClient(
        "https://shackletonmedia.queue.core.windows.net?sv=2019-02-02&st=2021-09-14T18%3A55%3A04Z&se=2081-09-15T18%3A55%3A00Z&sp=rau&sig=8wHKBoQGQmNfA4CdEXQEutn3aHtMxIYnY5Xv%2Ft05ewg%3D"
      );

      var queueClient = queueServiceClient.getQueueClient("pending-faces");

      this.$_.each(
        [
          "Attachments/00/00/0395DF42-99CB-4799-9401-496CEA4F563A/IMG_6206.jpg",
          "Attachments/00/00/at_0_E9A69A50-5EDD-41D4-9AE3-5B39A95916ED/IMG_4516.jpg",
          "Attachments/01/01/at_0_52CDA1DC-F8B0-4FE8-86E7-9E56C266175B/jpeg-image-GkPzTx.jpeg",
          "Attachments/02/02/at_1_05DB1E5E-8217-484E-BCDC-DA45DD40694F/61462752394__237977DD-C323-4662-A194-2A5F0B5CE343.jpeg",
          "Attachments/05/05/at_0_7CDB81A8-B6A9-4094-A1EC-94A2755CEE7A/IMG_7589.jpg",
          "Attachments/09/09/at_0_F090308D-0EDF-424E-B5B7-EE89DEA7941C/jpeg-image-7R3taj.jpeg",
          "Attachments/0c/12/at_0_207BEE98-270F-4CA9-8D80-CA5FFFBC1278/IMG_4316.jpeg",
          "Attachments/0d/13/099D22FD-7AEF-46CA-ADBB-6177A5B224B0/IMG_3757.jpeg",
          "Attachments/11/01/3D202F11-7253-459C-914C-8EBFA9FA50D0/IMG_6231.jpeg",
          "Attachments/13/03/at_0_ECA55765-53FE-4A0B-86FB-7AE8C7F0A16A/63867029695__E559866E-6A97-407F-BF9F-6AD88FCEBE51.jpeg",
          "Attachments/19/09/at_1_D9F1D3C1-7D0A-432C-BD26-35CB3F5FDC7D/IMG_3703.jpeg",
          "Attachments/1a/10/6CB0A0A4-2DDA-4AFA-8DB5-A7E9BF7B0D7E/IMG_6125.jpeg",
          "Attachments/1d/13/at_1_DDC08E6A-EF24-48FA-9884-3CDFE357DA30/jpeg-image-jlh6uI.jpeg",
          "Attachments/1e/14/at_1_C6A0DFD0-87DB-4FBF-8B3A-2FB2434C69A6/62070332538__7309DE18-113A-4207-9466-179FB07B9F24.jpeg",
          "Attachments/1f/15/at_0_82DECFDB-BF79-4EF1-88DA-A488871E3991/613784892.jpg",
          "Attachments/21/01/14F16EAD-69C2-4E43-8986-4C09AEA91D41/IMG_6328.jpeg",
          "Attachments/27/07/at_0_5D047D8E-D897-4F4B-8379-EA0FBD9D4ADC/IMG_4092.PNG",
          "Attachments/28/08/at_0_E8A48444-D06F-45A9-AFDE-8A7C997E1BFE/64445861309__7800ED1C-2CEB-42BF-B8BC-0507B0150EE4.jpeg",
          "Attachments/33/03/42CC82B8-82AB-4940-B054-273AB7AC559E/jpeg-image-zHqRNt.jpeg",
          "Attachments/33/03/495C9917-215F-446C-A86C-C2D4A46D144F/IMG_6327.jpeg",
          "Attachments/41/01/E559466A-BF67-4F46-9292-CC82E62ECD6B/Resized_Screenshot_20210805-074803_Messages.jpeg",
          "Attachments/51/01/F4084CEE-288A-4EDE-BD35-A68AD91C6822/IMG_5999.jpg",
          "Attachments/57/07/D400A5C5-8830-4724-964F-F3BA660508BE/644799479.jpg",
          "Attachments/62/02/6EDFA943-3C13-46FC-AF62-B5C6AE07894F/IMG_6691.jpeg",
          "Attachments/64/04/C47A39D2-A4CA-4920-AAE2-009DB6AF72A4/65023070308__9602C1BC-D2C4-4FC0-B21D-709EA0076223.jpeg",
          "Attachments/68/08/F4507159-15B5-4E97-935A-A1501DC832AF/IMG_3756.jpeg",
          "Attachments/74/04/FF532BE1-BD59-4B19-97D7-05F832CF44BD/IMG_6522.jpeg",
          "Attachments/75/05/B982D44A-EEE2-440A-9AB9-A1F22028E6C8/IMG_6466.jpeg",
          "Attachments/76/06/AFB2B177-C654-46A1-A35F-EB951362E54F/IMG_6301.jpeg",
          "Attachments/a4/04/at_0_2505B807-31DB-467B-B1E7-987231737CC6/jpeg-image-NDRnSN.jpeg",
        ],
        (a) => {
          queueClient
            .sendMessage(a)
            .then((res) => console.log(res))
            .catch((err) => console.error(err));
        }
      );
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