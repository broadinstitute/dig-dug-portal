
<template>
    <!-- take the ideas from signal sifter for button - selecting or deselecting the suggestions -->
    <div class="row">
        <div class="col-md-10 mx-auto">
            <div v-for="suggestion in suggestions">
                <span class="lead">
                    <div
                        id="suggestionBox"
                        style="font-size: 15px; border-radius: 10px; background-color: #cfefee; padding:5px 5px 5px 5px"
                    >
                        <a
                            v-if="!!phenotypes && phenotypes.length == 1"
                            style="cursor: pointer; "
                            v-on:click="ActOnSuggestions"
                        >{{suggestion}}</a>
                        <a
                            v-if="!!phenotypes && phenotypes.length > 1"
                            style="cursor: pointer;"
                            v-on:click="GoToSignalSifter"
                        >{{suggestion}}</a>

                        <a
                            v-if="!!variants && variants.length >= 1 "
                            style="cursor: pointer;"
                            v-on:click="GoToSignalSifter"
                        >{{suggestion}}</a>

                        <button
                            type="button"
                            class="mr-2 close remove"
                            aria-label="Filter"
                            v-b-tooltip.hover.html="{variant: 'light',}"
                            :title="'Click to remove the suggestions'"
                            v-on:click="removeSuggestions"
                        >
                            <span style="color: green">
                                <b-icon-x-circle-fill></b-icon-x-circle-fill>
                            </span>
                        </button>
                    </div>
                </span>
            </div>
        </div>
        <!-- <div class="lead" v-for="suggestion in suggestions">
            <small>
                <span>{{suggestion}}</span>
            </small>
        </div>-->
    </div>
</template>


<script>
import Vue from "vue";
import keyParams from "@/utils/keyParams";
import uiUtils from "@/utils/uiUtils";

export default Vue.component("suggestions", {
    props: ["phenotypes", "variants", "tissues", "annotations", "genes"],
    // props: ["phenotypes"],
    modules: {
        keyParams,
        uiUtils
    },
    computed: {
        suggestions() {
            let suggs = [];
            if (!this.phenotypes && !this.variants) {
                return [];
            }
            if (!!this.phenotypes && this.phenotypes.length == 0) {
                suggs.push("Select a phenotype!");
            }
            if (!!this.phenotypes && this.phenotypes.length == 1) {
                suggs.push(
                    "Select more than 1 phenotype of same phenotype group to compare."
                );
            }
            if (!!this.phenotypes && this.phenotypes.length > 1) {
                suggs.push(
                    "Use the signal sifter to find variants impacting all selected phenotypes."
                );
            }
            if (
                !!this.variants &&
                this.variants.length > 0 &&
                this.genes.length == 0
            ) {
                suggs.push(
                    "Use the signal sifter to find variants impacting all selected phenotypes.part2"
                );
            }
            return suggs;
        }
    },
    methods: {
        ActOnSuggestions(event) {
            let suggestions = this.phenotypes;
            //this is going to add T2D by default for now
            this.$emit("updatePhenotypeSelected", event);
        },

        GoToSignalSifter(event) {
            let newUrl =
                window.location.protocol +
                "//" +
                window.location.host +
                "/" +
                "signalsifter.html" +
                "?phenotypes=" +
                "T2D";

            window.open(newUrl);
        },

        removeSuggestions(event) {
            var x = document.getElementById("suggestionBox");
            if (x.style.display === "none") {
                x.style.display = "block";
            } else {
                x.style.display = "none";
            }
        }
    }
});
</script>

<style></style>
