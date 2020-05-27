import Vue from "vue";
import store from "./store"
import Template from "./Template.vue";

import IGV from "@/components/igv/IGV.vue"
import IGVAssociationsTrack from "@/components/igv/tracks/IGVAssociationsTrack.vue"

Vue.config.productionTip = false;

new Vue({
    store,
    components: {
        IGV,
        IGVAssociationsTrack,
    },
    data() {
        return {
            nums: 3,
            newTrackPhenotype: '',
            tracks: []
        }
    },
    mounted() {
        console.log(this.$children[0].$refs)
    },
    methods: {
        addAssociationsTrack: function () {
            this.$children[0].$refs.igv.addAssociationsTrack({
                phenotype: this.newTrackPhenotype,
            });
        },
    },
    render(createElement, context) {
        return createElement(Template);
    },

}).$mount("#app");
