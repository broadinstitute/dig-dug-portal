<template>
    <div class="pkb-wrapper f-col fill-height align-h-center">
        <!-- NAV -->
        <pkb-header></pkb-header>
        <!-- BODY -->
        <div class="pkb-body">
            <div>
                <div v-html="$parent.info"></div>
                <iframe
                    id="meta-embed"
                    src="https://tools.cmdga.org/metadata_analysis_assays/"
                ></iframe>
            </div>
        </div>
        <!-- FOOTER -->
        <pkb-footer></pkb-footer>
    </div>
</template>

<script>
import PkbFooter from "@/portals/PanKbase/components/pkb-footer.vue";
import PkbHeader from "@/portals/PanKbase/components/pkb-header.vue";

export default {
    components: {
        PkbFooter,
        PkbHeader,
    },
};
</script>
<style>
#meta-embed {
    width: 100%;
    height: 1000px;
    border: none;
    margin: 40px 0 0;
}
</style>
