<template>
    <section class="glens-focus-result-card glens-focus-result-card--accordion">
        <button
            class="glens-focus-result-card__summary"
            type="button"
            :aria-expanded="open ? 'true' : 'false'"
            @click="open = !open"
        >
            <span>Clinical context × Search subject</span>
            <strong>
                <b>{{ insight.focusSubject }}</b>
                <i>×</i>
                <b>{{ insight.searchSubject }}</b>
            </strong>
            <em>{{ open ? "▾" : "▸" }}</em>
        </button>

        <div v-if="open" class="glens-focus-result-card__body">
            <div class="glens-focus-result-card__head">
                <div>
                    <span>Interpretation</span>
                    <strong>{{ insight.headline }}</strong>
                </div>
                <div class="glens-focus-result-card__metric">{{ insight.metric }}</div>
            </div>
            <div class="glens-focus-result-card__equation" aria-label="Clinical context multiplied by search subject">
                <div class="glens-focus-result-card__operand">
                    <span>Clinical context</span>
                    <strong>{{ insight.focusSubject }}</strong>
                </div>
                <div class="glens-focus-result-card__operator">×</div>
                <div class="glens-focus-result-card__operand">
                    <span>Search subject</span>
                    <strong>{{ insight.searchSubject }}</strong>
                </div>
            </div>
            <p>{{ insight.body }}</p>
            <ul v-if="insight.changes && insight.changes.length" class="glens-focus-result-card__changes">
                <li v-for="item in insight.changes" :key="item">{{ item }}</li>
            </ul>
            <div v-if="insight.secondaryBody" class="glens-focus-result-card__secondary">
                <strong>{{ insight.secondaryTitle }}</strong>
                <p>{{ insight.secondaryBody }}</p>
            </div>
        </div>
    </section>
</template>

<script>
import "./style.css";

export default {
    name: "FocusResultAccordion",
    props: {
        insight: {
            type: Object,
            required: true,
        },
    },
    data() {
        return {
            open: false,
        };
    },
};
</script>
