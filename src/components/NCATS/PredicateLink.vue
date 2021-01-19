<template>
    <div v-if="!!links[domain]">
        <a  v-for="(word, index) in [].concat(content)"
            :key="word" 
            :href="linkInDomainForId(links, domain, word)">
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
            links: ncatsUtils.links,
        }
    },
    methods: {
        linkInDomainForId() {
            return ncatsUtils.linkInDomainForId(...arguments)
        } 
    }
})
</script>