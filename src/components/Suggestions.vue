
<template>
    <!-- take the ideas from signal sifter for button - selecting or deselecting the suggestions -->
    <div>
        <div class="card mdkp-card">
            <div class="card-body temporary-card">Please click on the following suggestions</div>
            <div class="lead" v-for="suggestion in suggestions">
                <div v-html>Show {{suggestion}} w/ link here...</div>
            </div>
        </div>
    </div>
</template>


<script>
import Vue from "vue";

export default Vue.component("suggestions", {
    //   props: ["phenotypes", "variants", "tissues", "annotations", "genes"],
    props: ["phenotypes"],
    computed: {
        suggestions() {
            let suggs = [];
            if (!this.phenotypes) {
                return [];
            }
            if (this.phenotypes.length == 0) {
                suggs.push("Select a phenotype!");
            }
            if (this.phenotypes.length == 1) {
                suggs.push("Select more than 1 phenotype to compare.");
            }
            if (this.phenotypes.length > 1) {
                suggs.push(
                    "Use the <a>signal sifter</a> to find variants impacting all selected phenotypes."
                );
            }
            // if (this.variants.length > 0 && this.genes.length == 1) {
            //     suggs.push(
            //         "Use the <a>signal sifter</a> to find variants impacting all selected phenotypes.part2"
            //     );
            // }
            return suggs;
        }
    },
    methods: {}
});
</script>
