<template>
    <div :class="'container-fluid '+diseaseGroup+'kp-footer'">
        <div>{{ portalName }}</div>
    </div>
</template>

<script>
import Vue from "vue";

export default Vue.component("page-footer", {
    data() {
        return {};
    },
    computed: {
        diseaseGroup() {
            return this.$store.state.diseaseGroup.id;
        },
        portalName() {
            let name = null;

            switch (this.$store.state.diseaseGroup.id) {
                case "md":
                    name = "Metabolic Disorder Knowledge Portal";
                    break;
                case "cvd":
                    name = "Cardiovascular Disease Knowledge Portal";
                    break;
            }

            return name;
        }
    }
});
</script>
