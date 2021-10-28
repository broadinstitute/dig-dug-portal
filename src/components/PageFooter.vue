<template>
    <div v-if="diseaseGroup">
        <div :class="'container-fluid '+diseaseGroup.name+'kp-footer'">
            <div>
                <a href="https://kp4cd.org/" style="color: #fff !important;">
                    Powered by the
                    <span
                        style="font-weight:500; font-size: 1.2em; vertical-align:-.1em;"
                    >HuGeAMP</span>
                    <span class="registered-mark">
                        &nbsp;&nbsp;|&nbsp;&nbsp;ACCELERATING MEDICINES PARTNERSHIP and AMP are registered service marks of the U.S. Department of Health and Human Services.
                    </span>
                </a>
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
    },
});
</script>
