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
        }
    },

    methods: {
        addIGVTrack: function () {
            // https://css-tricks.com/creating-vue-js-component-instances-programmatically/
            const IGVAssociationsTrackClass = Vue.extend(IGVAssociationsTrack);
            const instance = new IGVAssociationsTrackClass({
                propsData: {
                    phenotype: this.newTrackPhenotype,
                }
            });
            instance.$mount();
            this.$children[0].$refs.igv.addIGVTrack(instance.$el);
        },
    },

    render(createElement, context) {
        return createElement(Template);
    },

}).$mount("#app");
