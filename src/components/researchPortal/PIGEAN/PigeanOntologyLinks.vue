<template>
    <span class="pigean-ontology-links">
        <template v-for="(mapping, index) in mappings">
            <a
                v-if="url(mapping.target_id)"
                :key="index"
                :href="url(mapping.target_id)"
                target="_blank"
                rel="noopener noreferrer"
                :title="description(mapping)"
                @click.stop
            >
                <strong>{{ mapping.target_id }}</strong>
                <span v-if="labels && mapping.target_label">{{
                    mapping.target_label
                }}</span>
                <small v-if="mapping.predicate !== 'skos:exactMatch'">{{
                    relation(mapping.predicate)
                }}</small>
            </a>
            <span v-else :key="index" :title="description(mapping)">{{
                mapping.target_id
            }}</span>
        </template>
    </span>
</template>
<script>
import {
    ontologyUrl,
    mappingRelation,
    formatScore,
} from "@/utils/pigeanPortalUtils";
export default {
    props: { mappings: { type: Array, default: () => [] }, labels: Boolean },
    methods: {
        url: ontologyUrl,
        relation: mappingRelation,
        description(mapping) {
            return [
                mapping.target_label || mapping.target_id,
                mappingRelation(mapping.predicate),
                `Source confidence: ${formatScore(mapping.confidence)}`,
                mapping.source,
            ]
                .filter(Boolean)
                .join(" · ");
        },
    },
};
</script>
<style>
.pigean-ontology-links {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}
.pigean-ontology-links > a,
.pigean-ontology-links > span {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px 7px;
    padding: 5px 8px;
    border: 1px solid #d5e3eb;
    border-radius: 4px;
    background: #f6f9fc;
    color: #24617e;
    font-size: 11px;
    overflow-wrap: anywhere;
    max-width: 100%;
}
.pigean-ontology-links small {
    color: #68547b;
    font-size: 10px;
}
.pigean-ontology-links a:hover {
    border-color: #7ba6bd;
    background: #eaf3f8;
}
</style>
