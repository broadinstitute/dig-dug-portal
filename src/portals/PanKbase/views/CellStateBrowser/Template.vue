<template>
    <div class="pkb-wrapper f-col fill-height align-h-center">
        <pkb-header></pkb-header>

        <div class="pkb-body">
            <LigerBrowser :config="$parent.liger_config" />
        </div>

        <pkb-footer></pkb-footer>
    </div>
</template>

<script>
import LigerBrowser from "@/components/researchPortal/LIGER/LigerBrowser.vue";
import PkbFooter from "@/portals/PanKbase/components/pkb-footer.vue";
import PkbHeader from "@/portals/PanKbase/components/pkb-header.vue";

export default {
    components: {
        LigerBrowser,
        PkbFooter,
        PkbHeader,
    },
};
</script>
