<template>
    <div>
        <results-global-tooltip>
            <template v-slot:default="slotProps">
                <results-nav
                    :queryKey="slotProps.currentData.split(':')[0]"
                    :inputValue="slotProps.currentData.split(':')[1]"
                ></results-nav>
            </template>
        </results-global-tooltip>
        <div>

            <b-input-group>
                <template v-slot:prepend>

                    <b-dropdown
                        v-model="$parent.index"
                        :text="$parent.index"
                        variant="info">
                            <a  class="dropdown-item"
                                v-for="i in $store.state.indexes"
                                :key="i"
                                href="#"
                                @click="$parent.index = i">
                                {{i}}
                            </a>
                    </b-dropdown>
                </template>

                <!-- TODO: Refactor as a function of the split of the schema -->
                <b-form-input
                    v-model="$parent.query"
                    :placeholder="$parent.placeholder"
                ></b-form-input>

                <template v-slot:append>
                    <b-button v-on:click="$store.dispatch('queryBioIndexForResults', { index: $parent.index, query: $parent.query })" variant="outline-secondary">Run</b-button>
                </template>
            </b-input-group>


        </div>

        <button @click="$parent.makeURLWithEncodeHistory" :disabled="!$store.state.resultCards.cards.length > 0">Make URL</button>
        <p v-if="$store.getters.busy">Loading</p>


        <b-container fluid>
            <b-row no-gutters>
                <b-col cols="2" class="reverseorder">

                    <a  v-for="card in $store.getters.cardsById"
                        :key="`link-${$parent.provenanceHash(card)}-${card.id}`"
                        :id="`link-${$parent.provenanceHash(card)}-${card.id}`"
                        @click="$parent.jumpToElementBy(`#card-${$parent.provenanceHash(card)}-${card.id}`)">

                        {{$parent.bioIndexFromHash($parent.provenanceHash(card))}} for {{$parent.queryFromHash($parent.provenanceHash(card))}}<br>

                    </a>

                </b-col>
                <b-col class="reverseorder">
                <!-- <b-col> -->
                    <!-- TODO: content addressing id vs timestamp id? right now list index serves role of relative timestamp. don't like that -->
                    <div class="card"
                        v-for="card in $store.getters.cardsById"
                        :key="`card-${$parent.provenanceHash(card)}-${card.id}`"
                        :id="`card-${$parent.provenanceHash(card)}-${card.id}`">

                        <div v-if="card.index === 'regions'">
                            <regions-result-card
                                :title="`${$parent.bioIndexFromHash($parent.provenanceHash(card))} for ${$parent.queryFromHash($parent.provenanceHash(card))}`"
                                :regions="$store.state.dataCache[$parent.contentHash(card)]"
                                :parent="card.parent"
                                @pushQuery="$store.dispatch('queryBioIndexForResults', { index: $event.index, query: $event.queryString, parent: card.id })"
                            ></regions-result-card>
                        </div>

                        <div v-else-if="card.index === 'associations'">
                            <associations-result-card
                                :title="`${$parent.bioIndexFromHash($parent.provenanceHash(card))} for ${$parent.queryFromHash($parent.provenanceHash(card))}`"
                                :associations="$store.state.dataCache[$parent.contentHash(card)]"
                                :phenotype="$parent.phenotypeFromHash($parent.provenanceHash(card))"
                                :locus="$parent.locusFromHash($parent.provenanceHash(card))"

                                :parent="card.parent"
                                @pushQuery="$store.dispatch('queryBioIndexForResults', { index: $event.index, query: $event.queryString, parent: card.id })"
                            ></associations-result-card>
                        </div>

                        <div v-else-if="card.index === 'variant'">
                            <variant-result-card
                                :title="`${$parent.bioIndexFromHash($parent.provenanceHash(card))} for ${$parent.queryFromHash($parent.provenanceHash(card))}`"
                                :variant="$store.state.dataCache[$parent.contentHash(card)]"
                                :parent="card.parent"
                                @pushQuery="$store.dispatch('queryBioIndexForResults', { index: $event.index, query: $event.queryString, parent: card.id })"
                            ></variant-result-card>
                        </div>

                        <div v-else-if="card.index === 'top-associations'">
                            <phenotype-signal-card
                                :topAssociations="$store.state.dataCache[$parent.contentHash(card)]"
                                :phenotypeMap="$store.state.bioPortal.phenotypeMap">
                            </phenotype-signal-card>
                        </div>

                        <div v-else-if="card.index === 'gene'">
                            <gene-result-card
                                :card="card"
                                :geneData="$store.state.dataCache[$parent.contentHash(card)]"
                                @pushQuery="$store.dispatch('queryBioIndexForResults', { index: $event.index, query: $event.queryString, parent: card.id })"
                            ></gene-result-card>
                        </div>

                        <div v-else>
                            <result-card-template
                                :card="card"
                            ></result-card-template>
                        </div>

                    </div>

                </b-col>
            </b-row>
        </b-container>


    </div>
</template>
<style scoped>
    /* that's the good stuff https://stackoverflow.com/a/60413254/1991892 */
    .reverseorder {
        display: flex;
        flex-direction: column-reverse;
        align-self: flex-start;
    }
</style>
