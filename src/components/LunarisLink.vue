<template>
    <div class="lunaris-link-wrapper" v-if="diseaseGroup && trait">
        <a
            :href="'http://34.71.240.244:8080/lunaris/lunaris.html?chr='+chr+'&begin='+begin+'&end='+end+'&trait='+trait.name"
            class="lunaris-link"
            target="_blank"
        >
            <tooltip-documentation
                name="test.tooltip.index.regionexample"
                :group="diseaseGroup.name"
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
    props: ["diseaseGroup", "chr", "begin", "end", "trait"],
    mounted: function() {}
});
</script>
