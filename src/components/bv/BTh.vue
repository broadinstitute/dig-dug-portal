<template>
    <th
        :class="cellClass"
        :colspan="span"
        :role="row.inThead ? 'columnheader' : 'rowheader'"
        :scope="!row.inThead ? 'row' : span ? 'colspan' : 'col'"
    >
        <slot></slot>
    </th>
</template>

<script>
import { checksUse } from "./helpers";

export default {
    name: "BTh",
    // attributes and listeners as in plain Vue 3, also under a compat parent
    compatConfig: { MODE: 3 },
    mixins:
        process.env.NODE_ENV === "production"
            ? []
            : [
                  checksUse("b-th", {
                      listeners: true,
                      attributes: ["abbr", "headers", "scope"],
                  }),
              ],
    // What a table's row tells its cells: () => ({ inThead, isStickyHeader, headVariant }). In the thead-top slot there is
    // no row, so a cell is a row header there, as in BootstrapVue.
    inject: {
        getBvTableTr: { default: () => () => ({}) },
    },
    props: {
        colspan: [Number, String],
    },
    computed: {
        row() {
            return this.getBvTableTr();
        },
        span() {
            const n = parseInt(this.colspan, 10);
            return n > 0 ? n : null;
        },
        cellClass() {
            // Bootstrap's table has no background that a sticky cell could inherit
            return this.row.isStickyHeader && !this.row.headVariant
                ? "table-b-table-default"
                : "";
        },
    },
};
</script>
