import Vue from "vue";
import Template from "./Template.vue";

// tests
import { mount, render, shallowMount } from "@vue/test-utils";
import Stub from "./Stub.vue"
import LocusZoom from "../../components/lz/LocusZoom"
import LocusZoomAssociationsPanel from "../../components/lz/panels/LocusZoomAssociationsPanel"

// Prepare environment
// NOTE: needed to attach to document for this work, because LZ won't populate without HTML
const stubWrapper = mount(Stub, {
    attachTo: document.body,
})
let childrenLength;

// Run test
Promise.resolve(() => {})
    // Initialize
    .then(async () => await stubWrapper.setData({ phenotype: 'T2D' }))        // initial phenotype (TODO: push this out?)
    .then(() => {
        childrenLength = stubWrapper.findAllComponents(LocusZoom).wrappers[0].vm.$children.length;
        console.log(childrenLength)
    })
    // Act
    .then(async () => {
        await stubWrapper.setData({ phenotype: 'BMI' }) // first switch
        await stubWrapper.setData({ phenotype: 'T2D' }) // second switch
    })
    // Enforce assertions
    .then(() => {
        // - updates should keep component intact
        console.log(stubWrapper.findAllComponents(LocusZoom).wrappers[0].vm.$children.length === childrenLength)
        // - data should actually change
        console.log(stubWrapper.findAllComponents(LocusZoom).wrappers[0].vm.$children[0])
        // - only panel removals should remove component

    });


// vue page
Vue.config.productionTip = false;
new Vue({
    components: {
        LocusZoom,
        LocusZoomAssociationsPanel
    },
    async created() {

    },
    render(createElement) {
        return createElement(Template);
    },
}).$mount("#app");
