<template>
    <div class="lunaris-link-wrapper">
        <a href="http://34.71.240.244:8080/lunaris/lunaris.html" class="lunaris-link">
            <tooltip-documentation
                name="test.tooltip.index.regionexample"
                :group="this.diseaseGroup"
                :isHover="true"
                :noIcon="true"
            ></tooltip-documentation>
        </a>
    </div>
</template>

<script>
import Vue from "vue";
import TooltipDocumentation from "@/components/TooltipDocumentation.vue";

export default Vue.component("lunaris-link", {
    props: ["diseaseGroup"],
    mounted: function() {}
});
</script>
