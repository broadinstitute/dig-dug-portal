<template>
    <div :class="'feature-content-wrapper hidden feature-content-wrapper-'+this.featureIndex">
        <b-container fluid>
            <div v-for="(row, i) in features" :class="'feature-list '+i">
                <b-row :class="'feature-name '+i">{{i}}</b-row>
                <template v-for="(col, j) in row">
                    <b-row :class="'feature-headers '+i" v-if="j === 0" :title="i">
                        <b-col
                            :class="($parent.config[$parent.dataset].featureRenderNot.includes(header))?'hidden feature-header-item '+i :'feature-header-item '+i "
                            v-for="header in Object.keys(col)"
                        >{{header}}</b-col>
                    </b-row>

                    <b-row :class="'feature-content '+i+ getColContent(col)">
                        <b-col
                            :class="($parent.config[$parent.dataset].featureRenderNot.includes(name))? 'hidden feature-content-item '+i +' '+item : 'feature-content-item '+i +' '+item"
                            v-for="(item,name) in col"
                            v-html="$parent.formatContent([i,name],item,'feature')"
                        ></b-col>
                    </b-row>
                </template>
            </div>
        </b-container>
    </div>
</template>

<script>
/// v-html="(item != '' && item != null)? $parent.formatContent([i,name],item,'feature'):'<span class="col-content-filler">filler</span>'"
import Vue from "vue";
import uiUtils from "@/utils/uiUtils";
export default Vue.component("effector-genes-features", {
    props: ["features", "featureIndex"],
    data() {
        return {};
    },
    methods: {
        getColContent(COL) {
            let colClass = " ";
            for (const [key, value] of Object.entries(COL)) {
                colClass += " " + value;
            }
            return colClass;
        },
    },
});
</script>
