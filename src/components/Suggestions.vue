
<template>
    <!-- take the ideas from signal sifter for button - selecting or deselecting the suggestions -->
    <div class="row">
        <div class="col-md-10 mx-auto">
            <div v-for="suggestion in suggestions">
                <span class="lead">
                    <div class="text color-1-bg">
                        <a
                            v-if="phenotypes.length == 1"
                            style="cursor: pointer;"
                            v-on:click="ActOnSuggestions"
                        >{{suggestion}}</a>
                        <a
                            v-if="phenotypes.length > 1"
                            style="cursor: pointer;"
                            v-on:click="GoToSignalSifter"
                        >{{suggestion}}</a>

                        <button
                            type="button"
                            class="mr-2 close remove"
                            aria-label="Filter"
                            v-b-tooltip.hover.html="{variant: 'light',}"
                            :title="'Click to remove the suggestions'"
                            v-on:click="$parent.removePhenotype(index)"
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
    //   props: ["phenotypes", "variants", "tissues", "annotations", "genes"],
    props: ["phenotypes"],
    modules: {
        keyParams,
        uiUtils
    },
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
                suggs.push(
                    "Select more than 1 phenotype of same phenotype group to compare."
                );
            }
            if (this.phenotypes.length > 1) {
                suggs.push(
                    "Use the signal sifter to find variants impacting all selected phenotypes."
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
    methods: {
        ActOnSuggestions(event) {
            let suggestions = this.phenotypes;
            console.log("i was clicked");
            let newUrl =
                window.location.protocol +
                "//" +
                window.location.host +
                window.location.pathname +
                "?chr=" +
                keyParams.chr +
                "&end=" +
                keyParams.end +
                "&phenotype=" +
                suggestions[0].name +
                "%2C" +
                "T2D" +
                "&start=" +
                keyParams.start;
            console.log("new url", newUrl);
            //to update the same page
            // window.history.replaceState({}, null, newUrl);
            // window.history.pushstate();
            window.open(newUrl);
        },

        GoToSignalSifter(event) {
            let newUrl =
                window.location.protocol +
                "//" +
                window.location.host +
                "/" +
                "signalsifter.html";

            window.open(newUrl);
        }
    }
});
</script>

<style></style>
