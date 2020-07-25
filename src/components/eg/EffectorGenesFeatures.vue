<template>
    <div class="feature-content-wrapper">
        <b-button @click="showFeatures = !showFeatures" class="view-features-btn">View Features</b-button>
        <b-container fluid>
            <div v-for="(row, i) in features" v-show="showFeatures" class="feature-list">
                <b-row :class="'feature-name '+i">{{i}}</b-row>
                <template v-for="(col, j) in row">
                    <b-row :class="'feature-headers '+i" v-if="j === 0">
                        <b-col
                            :class="'feature-header-item '+i"
                            v-for="header in Object.keys(col)"
                        >{{header}}</b-col>
                    </b-row>
                    <b-row :class="'feature-content '+i">
                        <b-col
                            :class="'feature-content-item '+i +' '+item"
                            v-if="item != '' && item != null "
                            v-for="item in col"
                            v-html="item"
                        ></b-col>
                        <b-col :class="'feature-content-item '+i +' '+item" v-else>
                            <span class="col-content-filler">filler</span>
                        </b-col>
                    </b-row>
                </template>
            </div>
        </b-container>
    </div>
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
