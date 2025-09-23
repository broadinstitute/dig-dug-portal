import Vue from "vue";
import Template from "./Template.vue";
import store from "./store.js";
import "../../assets/layout.css";
import "../../assets/pkb-styles.css";
import { pankbaseMixin } from "@/portals/PanKbase/mixins/pankbaseMixin.js";
import { cyphers, renderCypher, renderCypherCurl, runCypherQuery } from "../../utils/paragraph.js";
import dataConvert from "@/utils/dataConvert";
import keyParams from "@/utils/keyParams";
import EventBus from "@/utils/eventBus";

new Vue({
    store,
    components: {
        
    },
    mixins: [pankbaseMixin],
    data() {
        return {
            jsonResults: null
        };
    },
    watch: {},
    async created() {
        this.jsonResults = await this.runAllQueries();
    },
    computed: {
        geneName(){
            return this.$store.state.geneName;
        },
        queryKeys(){
            return Object.keys(cyphers);
        }
    },
    methods: {
        async runAllQueries(){
            let allResults = {};
            for (let i = 0; i < this.queryKeys.length; i++){
                let singleQuery = this.queryKeys[i];
                let results = await runCypherQuery(cyphers[singleQuery], {gene: this.geneName});
                console.log(JSON.stringify(results.results));
                allResults[singleQuery] = results.results;
            }
            return allResults;
        }
        
        
        
        
    },
    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
