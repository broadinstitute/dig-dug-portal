import Vue from "vue";
import Template from "./Template.vue";
import "../../assets/layout.css";
import "../../assets/pkb-styles.css";
import { pankbaseMixin } from "@/portals/PanKbase/mixins/pankbaseMixin.js";
import { cyphers, renderCypher, renderCypherCurl } from "../../utils/paragraph";
import dataConvert from "@/utils/dataConvert";
import keyParams from "@/utils/keyParams";
import EventBus from "@/utils/eventBus";

new Vue({
    components: {
        
    },
    mixins: [pankbaseMixin],
    data() {
        return {
            geneName: 'CFTR',            
        };
    },
    watch: {},
    async created() {
        const cypherDisplay = renderCypher(cyphers.eqtls_by_tissue, {gene: this.geneName});
        const cypherCurlDisplay = renderCypherCurl(cyphers.eqtls_by_tissue, {gene: this.geneName});
        //const cypherFetch = await runCypherQuery(this.cyphers.eqtls_by_tissue, {gene: this.geneName});
        console.log(cypherDisplay);
        console.log(cypherCurlDisplay);
        //console.log(cypherFetch);
    },
    methods: {
        
        
        
        
    },
    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
