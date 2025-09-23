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
            jsonResults: []
        };
    },
    watch: {},
    async created() {
        this.runAllQueries();
    },
    computed: {
        geneName(){
            return this.$store.state.geneName;
        }
    },
    methods: {
        async runAllQueries(){
            let queries = Object.values(cyphers);
            for (let i = 0; i < queries.length; i++){
                let singleQuery = queries[i];
                let results = await runCypherQuery(singleQuery, {gene: this.geneName});
                console.log(JSON.stringify(results.results));
                this.jsonResults.push(results.results);
            }
        }
        
        
        
        
    },
    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
