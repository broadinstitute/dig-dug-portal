<template>
    <div
        class="vks-mapping-row-details"
        :style="{ borderLeftColor: accentColor }"
    >
        <table class="table table-sm vks-mapping-row-details-table">
            <thead>
                <tr>
                    <th
                        v-for="column in detailColumns"
                        :key="column.key"
                        :style="{
                            backgroundColor: accentColor,
                            color: '#ffffff',
                        }"
                    >
                        {{ column.label }}
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr
                    v-for="(entry, index) in details"
                    :key="`${entry.label || entry.region || 'detail'}-${index}`"
                >
                    <td
                        v-for="column in detailColumns"
                        :key="`${column.key}-${index}`"
                    >
                        {{ formatCell(entry, column) }}
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script>
import {
    mappingDetailColumnsForGroup,
    mappingGroupColor,
} from "./variantSifterMappingData.js";

export default {
    name: "VariantSifterMappingRowDetails",
    props: {
        details: {
            type: Array,
            default: () => [],
        },
        groupId: {
            type: String,
            default: "credible-sets",
        },
        title: {
            type: String,
            default: "Mapped credible sets",
        },
        columns: {
            type: Array,
            default: null,
        },
        utils: {
            type: Object,
            default: null,
        },
    },
    computed: {
        accentColor() {
            return mappingGroupColor(this.groupId);
        },
        detailColumns() {
            if (Array.isArray(this.columns) && this.columns.length) {
                if (typeof this.columns[0] === "string") {
                    return this.columns.map((label, index) => ({
                        key: `col-${index}`,
                        label,
                        format: index > 0 ? "scientific" : null,
                    }));
                }
                return this.columns;
            }
            return mappingDetailColumnsForGroup(this.groupId);
        },
    },
    methods: {
        formatCell(entry, column) {
            const value = entry?.[column.key];
            if (value == null || value === "") {
                return "—";
            }
            if (column.format === "scientific") {
                return this.formatScientific(value);
            }
            return String(value);
        },
        formatScientific(value) {
            if (value == null || value === "") {
                return "—";
            }
            if (
                typeof value === "number" &&
                this.utils?.Formatters?.BYORColumnFormatter
            ) {
                return this.utils.Formatters.BYORColumnFormatter(
                    value,
                    "PPA",
                    {
                        "column formatting": {
                            PPA: { type: ["scientific notation"] },
                        },
                    },
                    null,
                    null,
                    {}
                );
            }
            if (typeof value === "number") {
                if (value !== 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 1000)) {
                    return value.toExponential(2);
                }
                return String(value);
            }
            return String(value);
        },
    },
};
</script>

<style scoped>
.vks-mapping-row-details {
    margin: 0;
    padding: 0;
    border-left: 4px solid #32afd5;
    background: transparent;
}

.vks-mapping-row-details-table {
    margin: 0;
    width: 100%;
    background: #ffffff;
    font-size: 12px;
}

.vks-mapping-row-details-table thead th {
    white-space: nowrap;
    border-color: transparent;
    font-weight: 600;
}

.vks-mapping-row-details-table tbody td {
    background: #ffffff;
}
</style>
