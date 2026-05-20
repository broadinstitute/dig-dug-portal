<template>
    <div class="categorical-filter-card">
        <div class="categorical-filter-head">
            <div class="categorical-filter-title">{{ displayLabel }}</div>
            <div class="categorical-filter-actions">
                <button class="categorical-filter-button" type="button" @click="selectAll">
                    All
                </button>
                <button class="categorical-filter-button" type="button" @click="selectNone">
                    None
                </button>
            </div>
        </div>

        <div class="categorical-filter-options">
            <label
                v-for="option in options"
                :key="`${columnName}-${option.value}`"
                class="categorical-filter-option"
                :style="optionBarStyle(option)"
            >
                <input
                    class="categorical-filter-checkbox"
                    type="checkbox"
                    :checked="isSelected(option.value)"
                    @change="toggleValue(option.value)"
                >
                <span class="categorical-filter-option-label">{{ option.label }}</span>
                <span class="categorical-filter-option-count">{{ option.count.toLocaleString() }}</span>
            </label>
        </div>
    </div>
</template>

<script>
export default {
    name: "CategoricalFilter",
    props: {
        columnName: {
            type: String,
            required: true,
        },
        displayLabel: {
            type: String,
            required: true,
        },
        options: {
            type: Array,
            default: () => [],
        },
        totalRowCount: {
            type: Number,
            default: 0,
        },
        value: {
            type: Array,
            default: () => [],
        },
    },
    computed: {
        optionCount() {
            return this.options.length;
        },
        selectedValues() {
            return Array.isArray(this.value) ? this.value : [];
        },
        coveragePercent() {
            if (!this.totalRowCount) {
                return 0;
            }

            const coveredCount = this.options.reduce((sum, option) => sum + option.count, 0);
            return Math.round((coveredCount / this.totalRowCount) * 100);
        },
        maxCount() {
            return this.options.reduce((max, option) => Math.max(max, option.count), 0) || 1;
        },
    },
    methods: {
        isSelected(value) {
            return this.selectedValues.includes(value);
        },
        toggleValue(value) {
            const nextValues = this.isSelected(value)
                ? this.selectedValues.filter((entry) => entry !== value)
                : this.selectedValues.concat(value);

            this.$emit("input", nextValues);
        },
        selectAll() {
            this.$emit("input", this.options.map((option) => option.value));
        },
        selectNone() {
            this.$emit("input", []);
        },
        optionBarStyle(option) {
            const width = (option.count / this.maxCount) * 100;
            return {
                background: `linear-gradient(90deg, #b9d5df 0%, #b9d5df ${width}%, rgba(255,255,255,0) ${width}%, rgba(255,255,255,0) 100%)`,
            };
        },
    },
};
</script>

<style scoped>
label{
    margin-bottom: 0;
}
.categorical-filter-card {
    padding: 14px 0 16px;
    border-bottom: 1px solid #d8d1c4;
}

.categorical-filter-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.categorical-filter-title {
    color: #22343f;
    font-size: 15px;
    font-weight: 700;
    line-height: 1.2;
}

.categorical-filter-badge {
    padding: 3px 8px;
    border-radius: 999px;
    background: #f1e6cf;
    color: #986c14;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}

.categorical-filter-meta {
    display: flex;
    gap: 12px;
    margin-top: 6px;
    color: #687b87;
    font-size: 12px;
}

.categorical-filter-actions {
    display: flex;
    gap: 10px;
}

.categorical-filter-button {
    border: 1px solid #8e97a1;
    border-radius: 8px;
    background: transparent;
    color: #4f6571;
    font-size: 12px;
    font-weight: 600;
}

.categorical-filter-options {
    display: flex;
    flex-direction: column;
    gap: 0;
    margin-top: 12px;
    overflow: hidden;
    background: #fffdfa;
}

.categorical-filter-option {
    display: grid;
    grid-template-columns: 22px minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    padding: 2px 10px 2px 5px;
}

.categorical-filter-option:first-child {
    border-top: 0;
}

.categorical-filter-checkbox {
    width: 16px;
    height: 16px;
    margin: 0;
}

.categorical-filter-option-label {
    min-width: 0;
    color: #22343f;
    font-size: 12px;
    font-weight: 500;
}

.categorical-filter-option-count {
    color: #5f7480;
    font-size: 12px;
    font-weight: 500;
}
</style>
