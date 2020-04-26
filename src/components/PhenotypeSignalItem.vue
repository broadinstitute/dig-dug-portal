<template>
    <div
        class="highlight-bar"
        :class="{'progress-bar-striped': isActive}"
        :style="{'width': width +'%'}"
        v-b-hover="highlight"
    >
        <span class="marker">
            <span class="tool-tip">{{title}}</span>
        </span>
    </div>
</template>

<script>
import Vue from "vue";
export default Vue.component("phenotype-signal-item", {
    props: {
        width: Number,
        title: String
    },
    data() {
        return {
            isActive: false
        };
    },
    methods: {
        highlight() {
            this.isActive = !this.isActive;
        }
    }
});
</script>
