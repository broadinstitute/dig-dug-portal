<template>
    <section
        class="pigean-phenotype-summary"
        :class="{ compact }"
        :aria-label="`Phenotype metadata for ${traitId}`"
    >
        <h4 v-if="showName">{{ name }}</h4>
        <p v-if="loading" class="small text-muted" role="status">
            Loading phenotype metadata…
        </p>
        <p v-else-if="!metadata" class="small text-muted">
            Phenotype metadata is unavailable. Source identifier: {{ traitId }}.
        </p>
        <p v-else-if="!phenotype" class="small text-muted">
            No phenotype metadata is available for {{ traitId }} in this
            data-model version.
        </p>
        <template v-else>
            <p class="pigean-phenotype-identifiers">
                <span>{{ traitId }}</span
                ><span>{{ phenotype.portal_id }}</span
                ><span>{{ phenotype.trait_group }}</span>
            </p>
            <p
                v-if="
                    !compact &&
                    phenotype.description &&
                    phenotype.description !== phenotype.name
                "
                class="small"
            >
                {{ phenotype.description }}
            </p>
            <pigean-ontology-links
                v-if="!compact"
                :mappings="phenotype.mappings"
                labels
            />
            <details>
                <summary>
                    Phenotype details · {{ phenotype.mappings.length }} ontology
                    mappings
                </summary>
                <p class="pigean-phenotype-types">
                    <span v-if="phenotype.trait_type">{{
                        phenotype.trait_type
                    }}</span>
                    <span v-if="phenotype.gwas_source_category"
                        >Source group:
                        {{ phenotype.gwas_source_category }}</span
                    >
                    <span v-if="phenotype.legacy_trait_group"
                        >Legacy group: {{ phenotype.legacy_trait_group }}</span
                    >
                    <span v-if="phenotype.is_dichotomous !== ''"
                        >Dichotomous:
                        {{ truth(phenotype.is_dichotomous) }}</span
                    >
                    <span v-if="phenotype.is_complex !== ''"
                        >Complex trait: {{ truth(phenotype.is_complex) }}</span
                    >
                </p>
                <p v-if="phenotype.id !== traitId" class="small">
                    Metadata identifier: <code>{{ phenotype.id }}</code
                    >. Matched by {{ matchLabel }}; queries continue to use
                    <code>{{ traitId }}</code
                    >.
                </p>
                <p class="small text-muted">
                    Mapping relations and confidence are reported by the
                    phenotype data model. A broader match or cross-reference is
                    not an exact synonym.
                </p>
                <div
                    v-if="phenotype.mappings.length"
                    class="pigean-mappings-scroll"
                >
                    <table class="table table-sm pigean-mappings-table">
                        <caption class="sr-only">
                            Ontology mapping details for
                            {{
                                name
                            }}
                        </caption>
                        <thead>
                            <tr>
                                <th scope="col">Ontology / identifier</th>
                                <th scope="col">Label</th>
                                <th scope="col">Relation</th>
                                <th scope="col">Confidence</th>
                                <th scope="col">Justification / source</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="(mapping, index) in phenotype.mappings"
                                :key="index"
                            >
                                <td>
                                    <span>{{ mapping.target_ontology }}</span
                                    ><a
                                        v-if="url(mapping.target_id)"
                                        :href="url(mapping.target_id)"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        >{{ mapping.target_id }}</a
                                    ><span v-else>{{ mapping.target_id }}</span>
                                </td>
                                <td>{{ mapping.target_label || "—" }}</td>
                                <td :title="mapping.predicate">
                                    {{ relation(mapping.predicate) }}
                                </td>
                                <td>{{ format(mapping.confidence) }}</td>
                                <td>
                                    {{ mapping.justification
                                    }}<small>{{ mapping.source }}</small>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <p v-else class="small">
                    No ontology mappings are supplied for this phenotype.
                </p>
                <p v-if="metadata" class="pigean-phenotype-provenance">
                    {{ metadata.source.name }} · {{ metadata.source.version }} ·
                    <a
                        href="/pigean/registry/phenotypes.json"
                        target="_blank"
                        rel="noopener noreferrer"
                        >Metadata and provenance</a
                    >
                </p>
            </details>
        </template>
    </section>
</template>
<script>
import PigeanOntologyLinks from "./PigeanOntologyLinks.vue";
import {
    phenotypeFor,
    phenotypeName,
    ontologyUrl,
    mappingRelation,
    formatScore,
} from "@/utils/pigeanPortalUtils";
export default {
    components: { PigeanOntologyLinks },
    props: {
        traitId: String,
        metadata: Object,
        loading: Boolean,
        compact: Boolean,
        showName: Boolean,
    },
    computed: {
        phenotype() {
            return phenotypeFor(this.metadata, this.traitId);
        },
        name() {
            return phenotypeName(this.metadata, this.traitId);
        },
        matchLabel() {
            const match = this.metadata && this.metadata.lookup[this.traitId];
            return (
                {
                    pigean_id: "the recorded PIGEAN identifier",
                    embedded_orphanet_id: "the embedded Orphanet identifier",
                    gcat_hyphen_variant:
                        "a unique GWAS Catalog identifier differing only in hyphens",
                }[match && match.match] || "legacy identifier"
            );
        },
    },
    methods: {
        url: ontologyUrl,
        relation: mappingRelation,
        format: formatScore,
        truth(value) {
            return ["true", "1"].includes(String(value).toLowerCase())
                ? "Yes"
                : ["false", "0"].includes(String(value).toLowerCase())
                ? "No"
                : value;
        },
    },
};
</script>
<style>
.pigean-phenotype-summary {
    min-width: 0;
}
.pigean-phenotype-summary h4 {
    font-size: 17px;
    color: #284f65;
    margin: 0 0 10px;
}
.pigean-phenotype-identifiers,
.pigean-phenotype-types {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    font-size: 12px;
    color: #5b7282;
    margin-bottom: 12px;
    overflow-wrap: anywhere;
}
.pigean-phenotype-summary details {
    margin-top: 12px;
}
.pigean-phenotype-summary summary {
    color: #3d647c;
    cursor: pointer;
    font-size: 12px;
}
.pigean-phenotype-summary details[open] summary {
    margin-bottom: 14px;
}
.pigean-mappings-scroll {
    overflow: auto;
    max-height: 380px;
    border: 1px solid #dce6ed;
    border-radius: 4px;
}
.pigean-mappings-table {
    font-size: 12px;
    margin: 0;
    color: #304d60;
}
.pigean-mappings-table td {
    min-width: 120px;
    max-width: 260px;
    overflow-wrap: anywhere;
}
.pigean-mappings-table th {
    background: #f1f6f9;
    position: sticky;
    top: 0;
}
.pigean-mappings-table td > span,
.pigean-mappings-table small {
    display: block;
    color: #617483;
}
.pigean-phenotype-provenance {
    color: #617483;
    font-size: 11px;
    margin: 12px 0 0;
}
.pigean-phenotype-summary.compact {
    margin-bottom: 18px;
    padding-bottom: 18px;
    border-bottom: 1px solid #e0e8ee;
}
</style>
