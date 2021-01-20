<template>
    <div v-if="!!links[domain]" :key="salt">
        <a  v-for="(word, index) in [].concat(content)"
            :href="baseUri"
            :key="word">
            {{word}}
        </a>
    </div>
    <div v-else>
        {{content}}
    </div>
</template>
<script>
import Vue from "vue";
import ncatsUtils from "./ncatsUtils";

export default Vue.component("ncats-predicate-link", {
    props: ["content", "domain"],
    data() {
        return {
            salt: Math.floor(Math.random() * 10000).toString(),
            links: ncatsUtils.links,
            baseUri: '',
        }
    },
    async mounted() {
        const self = this;
        await ncatsUtils.uri(this.domain).then(prefixResource => {
            if (prefixResource !== null) {
                let { providerHtmlTemplate } = prefixResource[0]._source;
                // hack. TODO: inform prefixcommons
                if (this.domain === "go") {
                    providerHtmlTemplate = "http://amigo.geneontology.org/amigo/term/$id";
                }
                if (!!this.content) {
                    this.baseUri = providerHtmlTemplate.replace("$id", this.content);
                }
            }
        });
    },
    computed: {
        // linkInDomainForId(word) {
        //     this.baseUri;
        //     return word => {
        //         if (this.baseUri) {
        //             const { providerHtmlTemplate } = this.baseUri;
        //             return providerHtmlTemplate.replace("$id", word);
        //         } else {
        //             return ''
        //         }
        //     }
        // }
    }
})
</script>
