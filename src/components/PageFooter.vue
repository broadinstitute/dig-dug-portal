<template>
    <div v-if="diseaseGroup">
        <div :class="'container-fluid '+diseaseGroup.name+'kp-footer'">
            <div>
                Powered by the
                <span
                    style="font-weight:500; font-size: 1.2em; vertical-align:-.1em;"
                >HuGeAMP</span>
            </div>
        </div>
    </div>
</template>

<script>
import Vue from "vue";

export default Vue.component("page-footer", {
    props: ["diseaseGroup"],

    data() {
        return {};
    }
});
</script>
