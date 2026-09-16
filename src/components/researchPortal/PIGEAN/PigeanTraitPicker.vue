<template>
    <div class="pigean-typeahead" @focusout="onBlur">
        <label :for="id">{{ label }}</label>
        <input
            :id="id"
            class="form-control"
            role="combobox"
            aria-autocomplete="list"
            :aria-expanded="String(open && suggestions.length > 0)"
            :aria-controls="`${id}-options`"
            :aria-activedescendant="
                open && suggestions[active] ? `${id}-option-${active}` : null
            "
            :value="value"
            autocomplete="off"
            placeholder="Search a trait name, ID, or ontology term"
            @input="input"
            @focus="open = true"
            @keydown="keydown"
        />
        <span
            v-if="selectedTrait"
            class="pigean-picker-selection"
            :title="selectedTrait.name + ' · ' + selectedTrait.portal_id"
            >{{ selectedTrait.name
            }}<template v-if="selectedTrait.portal_id">
                · {{ selectedTrait.portal_id }}</template
            ></span
        >
        <ul
            v-if="open && suggestions.length"
            :id="`${id}-options`"
            role="listbox"
            class="pigean-suggestions"
        >
            <li
                v-for="(trait, index) in suggestions"
                :id="`${id}-option-${index}`"
                :key="trait.id"
                role="option"
                :aria-selected="index === active"
                :class="{ active: index === active }"
                @mousedown.prevent="choose(trait)"
            >
                <strong>{{ trait.name }}</strong
                ><span
                    >{{ trait.id }}
                    <template v-if="trait.portal_id"
                        >· {{ trait.portal_id }}</template
                    ></span
                >
            </li>
        </ul>
    </div>
</template>
<script>
import { rankTraits } from "@/utils/pigeanPortalUtils";
export default {
    props: {
        value: String,
        model: String,
        traits: { type: Array, default: () => [] },
        id: String,
        label: { type: String, default: "Phenotype" },
    },
    data: () => ({ open: false, active: 0 }),
    computed: {
        selectedTrait() {
            return this.traits.find((trait) => trait.id === this.value);
        },
        suggestions() {
            return rankTraits(this.traits, this.value || "", this.model);
        },
    },
    methods: {
        input(event) {
            this.$emit("input", event.target.value);
            this.open = true;
            this.active = 0;
        },
        choose(trait) {
            this.$emit("input", trait.id);
            this.open = false;
            this.$emit("selected", trait);
        },
        onBlur() {
            this.open = false;
        },
        keydown(event) {
            if (event.key === "Escape") {
                this.open = false;
                return;
            }
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                this.open = true;
                this.active = Math.max(
                    0,
                    Math.min(
                        this.suggestions.length - 1,
                        this.active + (event.key === "ArrowDown" ? 1 : -1)
                    )
                );
            } else if (
                event.key === "Enter" &&
                this.open &&
                this.suggestions[this.active]
            ) {
                event.preventDefault();
                this.choose(this.suggestions[this.active]);
            }
        },
    },
};
</script>
<style scoped>
.pigean-picker-selection {
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
    margin-top: 6px;
    font-size: 11px;
    color: #587383;
    overflow-wrap: anywhere;
}
.pigean-typeahead {
    position: relative;
}
label {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 7px;
}
.pigean-suggestions {
    position: absolute;
    z-index: 20;
    width: 100%;
    max-height: 340px;
    overflow-y: auto;
    list-style: none;
    padding: 4px;
    margin: 4px 0 0;
    background: white;
    border: 1px solid #a9bdc9;
    border-radius: 4px;
}
.pigean-suggestions li {
    padding: 8px 12px;
    cursor: pointer;
}
.pigean-suggestions li.active,
.pigean-suggestions li:hover {
    background: #edf4f8;
}
.pigean-suggestions strong,
.pigean-suggestions span {
    display: block;
    font-size: 13px;
}
.pigean-suggestions span {
    color: #586e7b;
    font-size: 12px;
}
</style>
