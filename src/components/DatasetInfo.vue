<template>
    <div>
        <div class="dataset-info-wrapper" v-html="this.datasetInfo[0].body[0].value"></div>
    </div>
</template>

<script>
import Vue from "vue";

export default Vue.component("dataset-info-section", {
    props: ["datasetInfo"],
    mounted: function() {
        let imageElements = document.getElementsByTagName("img");

        for (var i = 0; i < imageElements.length; i++) {
            let iESrc = imageElements[i].getAttribute("src");
            if (!iESrc.includes("http://")) {
                let newSrc = iESrc.replace(
                    "/sites/",
                    "http://kp4cd.org/sites/"
                );
                imageElements[i].setAttribute("src", newSrc);
            }
        }
    }
});
</script>

<style>
@import url("/css/datasetsInfo.css");
</style>
