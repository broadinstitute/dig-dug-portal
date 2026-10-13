<script>
import Vue from "vue";
import InfoTip from "./InfoTip.vue";

// Trait associations, grouped by phenotype group. Shared by both detail panels --
// the two trait endpoints return the same three fields, so there is one table.
export default Vue.component("TraitTable", {
    components: {
        InfoTip
    },

    props: {
        // the buildTraitRows() result
        traits: {
            type: Object,
            default: null
        },
        loading: {
            type: Boolean,
            default: false
        },
        error: {
            type: String,
            default: ""
        }
    },

    computed: {
        groups() {
            return this.traits ? this.traits.groups : [];
        },

        // The filter is never silent: if traits were dropped for having no readable
        // label, say how many.
        filterNote() {
            if (!this.traits || !this.traits.unlabeled) {
                return "";
            }

            return `${this.traits.unlabeled} of ${this.traits.total} trait associations have no matching phenotype label and are not listed.`;
        },

        countNote() {
            if (!this.traits || !this.traits.shown) {
                return "";
            }

            return `Top ${this.traits.shown} by |beta|`;
        }
    }
});
</script>

<template>
    <div class="trait-table">
        <div v-if="loading" class="section-empty">Loading trait associations…</div>
        <div v-else-if="error" class="section-empty">{{ error }}</div>
        <div v-else-if="!groups.length" class="section-empty">
            No trait associations reported.
        </div>

        <template v-else>
            <div v-if="countNote" class="trait-count">{{ countNote }}</div>

            <!-- ONE table, with the group names as full-width rows inside it.
                 It used to be a table per group, and the beta columns staggered:
                 each table sized its own columns to its own longest trait name, so
                 no two groups agreed on where the numbers sat. That is not fixable
                 by pinning widths -- separate tables have no reason to agree, and
                 any width chosen would break on the next phenotype. One table has
                 one set of columns. -->
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Trait</th>
                        <th class="num">Beta</th>
                        <th class="num">Uncorrected</th>
                    </tr>
                </thead>
                <tbody>
                    <template v-for="group in groups">
                        <tr :key="'group-' + group.name" class="group-row">
                            <th colspan="3" scope="colgroup">{{ group.name }}</th>
                        </tr>
                        <tr v-for="row in group.rows" :key="group.name + '::' + row.key">
                            <!-- The raw API code is the tooltip: identity stays
                                 keyed by it internally, and it is what to quote in
                                 a bug report. -->
                            <td><info-tip cursor="inherit" :text="row.key">{{ row.label }}</info-tip></td>
                            <td class="num" :class="row.beta >= 0 ? 'dir-up' : 'dir-down'">
                                {{ row.beta.toFixed(3) }}
                            </td>
                            <td class="num">
                                {{ Number.isFinite(row.betaUncorrected) ? row.betaUncorrected.toFixed(3) : "—" }}
                            </td>
                        </tr>
                    </template>
                </tbody>
            </table>

            <div v-if="filterNote" class="section-foot">{{ filterNote }}</div>
        </template>
    </div>
</template>

<style scoped>
.trait-count{
    margin-bottom: 8px;
    font-size: 11px;
    color: var(--ce-muted);
}
.data-table{
    width: 100%;
    border-collapse: collapse;
}
.data-table th{
    padding: 4px 8px 4px 0;
    border-bottom: 1px solid var(--ce-line);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .04em;
    text-transform: uppercase;
    color: var(--ce-muted);
    text-align: left;
    white-space: nowrap;
}
.data-table td{
    padding: 5px 8px 5px 0;
    border-bottom: 1px solid var(--ce-line);
    font-size: 12px;
    line-height: 1.4;
    color: var(--ce-ink);
}
.data-table th.num,
.data-table td.num{
    text-align: right;
    padding-right: 0;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
}
/* The group name as a row inside the table, so every group shares one set of
   columns. Spaced above rather than below, so it reads as a heading for what follows
   it rather than a footer for what came before.

   Must stay AFTER `.data-table th`: both are one class plus one element, so the tie
   is broken by source order, and above this point the generic rule would win back
   the padding. */
.data-table .group-row th{
    padding: 14px 0 4px;
    letter-spacing: .06em;
}
/* The first group sits directly under the column heads and needs no gap. */
.data-table tbody tr:first-child th{
    padding-top: 2px;
}

.dir-up{ color: #2f5bea; }
.dir-down{ color: #d92d20; }

.section-empty{
    padding: 6px 0;
    font-size: 12px;
    line-height: 1.5;
    color: var(--ce-muted);
}
.section-foot{
    margin-top: 6px;
    font-size: 11px;
    line-height: 1.5;
    color: var(--ce-muted);
}
</style>
