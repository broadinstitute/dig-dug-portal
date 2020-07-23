<template>
    <b-container fluid class="features">
        <b-row>
            <b-col>
                <b-button @click="showFeatures = !showFeatures">Features</b-button>
            </b-col>
        </b-row>
        <div v-for="(row, i) in features" v-show="showFeatures" class="feature-list">
            <b-row class="feature-name">
                <h5>{{i}}</h5>
            </b-row>
            <template v-for="(col, j) in row">
                <b-row class="feature-headers" v-if="j === 0">
                    <b-col v-for="header in Object.keys(col)">
                        <strong>{{header}}</strong>
                    </b-col>
                </b-row>
                <b-row>
                    <b-col v-for="item in col" v-html="item"></b-col>
                </b-row>
            </template>
        </div>
    </b-container>
</template>

<script>
import Vue from "vue";
import uiUtils from "@/utils/uiUtils";
export default Vue.component("effector-genes-features", {
    props: ["features"],
    data() {
        return {
            showFeatures: false,
        };
    },
});
</script>
