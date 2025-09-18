import Vue from "vue";
import Template from "./Template.vue";
import "../../assets/layout.css";
import "../../assets/pkb-styles.css";
import { pankbaseMixin } from "@/portals/PanKbase/mixins/pankbaseMixin.js";
import { getPankbaseContent } from "@/portals/PanKbase/utils/content";
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
            cypherAPI: 'HTTPS://vcr7lwcrnh.execute-api.us-east-1.amazonaws.com/development/api',
            cyphers: {
                eqtls_by_tissue: `
                MATCH (v:sequence_variant)-[r:fine_mapped_eQTL]->(g:gene {name:"$gene"})
                RETURN r.tissue_id AS tissue,
                    COUNT(DISTINCT v) AS n_variants,
                    collect(DISTINCT v.id) AS variant_ids
                ORDER BY n_variants DESC`
            }
        };
    },
    watch: {},
    async created() {
        const cypherDisplay = this.renderCypher(this.cyphers.eqtls_by_tissue, {gene: this.geneName});
        const cypherCurlDisplay = this.renderCypherCurl(this.cyphers.eqtls_by_tissue, {gene: this.geneName});
        //const cypherFetch = await this.runCypherQuery(this.cyphers.eqtls_by_tissue, {gene: this.geneName});
        console.log(cypherDisplay);
        console.log(cypherCurlDisplay);
        //console.log(cypherFetch);
    },
    methods: {
        // removes excess indentation and leading/trailing blank lines
        dedent(str) {
            if (!str) return "";
            const lines = str.replace(/\r\n?/g, "\n").split("\n");

            // trim blank first/last lines
            while (lines.length && lines[0].trim() === "") lines.shift();
            while (lines.length && lines[lines.length - 1].trim() === "") lines.pop();

            if (!lines.length) return "";

            const baseIndent = (lines[0].match(/^(\s*)/) || ["", ""])[1].length;

            return lines.map(line =>
                line.startsWith(" ".repeat(baseIndent)) ? line.slice(baseIndent) : line
            ).join("\n");
        },
        async runCypherQuery(cypher, params = {}) {
            // render + dedent + param-substitute just like your curl
            const rendered = this.renderCypher(this.dedent(cypher), params);
            const compact = rendered.replace(/\s+/g, " ").trim();

            const response = await fetch(this.cypherAPI, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: compact }),
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Cypher API error ${response.status}: ${text}`);
            }
            return response.json();
        },
        renderCypher(cypher, params = {}) {
            //fix indentation for display
            let query = this.dedent(cypher);
            //replace params
            for (const [key, val] of Object.entries(params)) {
                const safeVal = typeof val === "string" ? `${val}` : val;
                query = query.replace(new RegExp("\\$" + key, "g"), safeVal);
            }
            return query;
        },
        renderCypherCurl(cypher, params = {}) {
            // substitute params
            let query = this.renderCypher(cypher, params);
            //remove line breaks
            const compact = query.replace(/\s+/g, " ").trim();
            //escape quotes
            const payload = `{ "query": "${compact.replace(/"/g, '\\"')}" }`;
            //compile query
            const curl = `
            curl -X POST '${this.cypherAPI}' \\
                -H 'Content-Type: application/json' \\
                -d '${payload}'`;
            //dedent
            const prettyCurl = this.dedent(curl)
            //generate curl command
            return prettyCurl;
        }
    },
    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
