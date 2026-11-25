<template>
    <div>
        <!-- Header -->
        <page-header :disease-group="$parent.diseaseGroup" :front-contents="$parent.frontContents"></page-header>

        <!-- Body -->
        <div class="container-fluid mdkp-body">
            <div class="card mdkp-card">
                <div class="card-body">
                    <interactive-kp></interactive-kp>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <tissue-explorer></tissue-explorer>
                </div>
            </div>
        </div>
        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>

<script>
import InteractiveKp from "@/views/T2DAssays/components/InteractiveKP.vue";
import PageFooter from "@/components/PageFooter.vue";
import PageHeader from "@/components/PageHeader.vue";
import TissueExplorer from "@/views/T2DAssays/components/TissueExplorer.vue";

export default {
    components: {
        InteractiveKp,
        PageFooter,
        PageHeader,
        TissueExplorer,
    },
};
</script>