<template>
    <div>
        <select
            id="region_expander"
            class="expand-region-select"
            @change="expandRegion()"
        >
            <option selected value="null">Expand region by:</option>
            <option value="50">&plusmn; 50 kb</option>
            <option value="100">&plusmn; 100 kb</option>
            <option value="150">&plusmn; 150 kb</option>
        </select>
    </div>
</template>

<script>
import Vue from "vue";

export default Vue.component("expand-region", {
    props: ["chr", "start", "end", "setLocus"],
    methods: {
        expandRegion() {
            let expandBy =
                document.getElementById("region_expander").value * 1000;

            this.$store.commit("setLocus", {
                chr: this.$store.state.chr,
                //HACKYY FIX - PLEASE FIND OUT  - why is "end" state a string but not "start" state
                start: parseInt(this.$store.state.start) - expandBy,
                end: parseInt(this.$store.state.end) + expandBy,
            });
            this.$store.dispatch("queryRegion");

            document.getElementById("region_expander").value = null;
        },
    },
});
</script>

