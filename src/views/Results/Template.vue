<template>
    <div>

        <!-- TODO: Way to have multiple of these? -->
        <results-global-tooltip :identifier="'bioindex'">
            <template #header>
                Actions
            </template>
            <template #subheader>
                <!-- Make a new card using this information -->
            </template>
            <template v-slot:default="slotProps">
                <!-- <results-nav
                    :queryKey="slotProps.currentData.split(':')[0]"
                    :inputValue="slotProps.currentData.split(':')[1]"
                    :showCompoundIndexes="true"
                    @pushQuery="$store.dispatch('queryBioIndexForResults', { index: $event.index, query: $event.queryString, parent: -2 })"
                ></results-nav> -->
                <div v-if="slotProps.currentData.split(':')[0] === 'phenotype'">
                    I'm a phenotype component
                </div>
                <div v-else>
                    I'm supposed to be a {{slotProps.currentData.split(':')[0]}}
                </div>
            </template>
        </results-global-tooltip>

        <results-global-tooltip :identifier="'collection'">
            <template #header>
                Collect
            </template>
            <template v-slot:default="slotProps">
                <!-- <button @click="$store.dispatch('collectItem', slotProps.currentData)">
                    Collect {{slotProps.currentData}}
                </button> -->
                <!-- TODO: Actions can be here because currently the payload lets it be here, i.e. it turns out <BioIndexInputType>:value is used for both Actions and Collections
                     HOWEVER: We want to be able to compose cards in a way which isn't nested, i.e. content slots should be inside the scoped slot for currentProps,
                     and the content itself can potentially have its own components.
                     This will allow us to take more concretions out of the page/Template.vue itself.
                -->
                <!-- <h6>Actions</h6>
                <results-nav
                    :queryKey="slotProps.currentData.split(':')[0]"
                    :inputValue="slotProps.currentData.split(':')[1]"
                    :showCompoundIndexes="false"
                    @pushQuery="$store.dispatch('queryBioIndexForResults', { index: $event.index, query: $event.queryString, parent: -2 })"
                ></results-nav> -->
                <!-- <results-nav
                    :queryKey="slotProps.currentData.split(':')[0]"
                    :inputValue="slotProps.currentData.split(':')[1]"
                    :showCompoundIndexes="false"
                    @pushQuery="$store.dispatch('queryBioIndexForResults', { index: $event.index, query: $event.queryString, parent: -2 })"
                ></results-nav> -->
                <div v-if="slotProps.currentData.split(':')[0] === 'phenotype'">
                    I'm a phenotype component
                </div>
                <div v-else>
                    I'm supposed to be a {{slotProps.currentData.split(':')[0]}}
                </div>
            </template>
        </results-global-tooltip>



        <b-container fluid>
            <b-row no-gutters>
                <b-col cols="3">

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
                                <b-button v-on:click="$store.dispatch('queryBioIndexForResults', { index: $parent.index, query: $parent.query })" variant="outline-secondary">
                                    Make Card
                                </b-button>
                            </template>
                        </b-input-group>

                        <b-input-group>

                            <multiselect
                                v-model="$parent.cardsForOperation"
                                :options="$store.getters.cardsById.map(card => $parent.provenanceHash(card))"
                                :placeholder="'select cards'"
                                :multiple="true"
                            ></multiselect >

                            <!-- TODO: If we can get this to work with tags, we can minimize the number of libraries in play -->
                            <!-- <b-form-tags v-model="$parent.cardsForOperation" size="lg" add-on-change no-outer-focus class="mb-2">
                                <template v-slot="{ tags, inputAttrs, inputHandlers, disabled, removeTag }">
                                <ul v-if="tags.length > 0" class="list-inline d-inline-block mb-2">
                                    <li v-for="tag in tags" :key="tag" class="list-inline-item">
                                    <b-form-tag
                                        @remove="removeTag(tag)"
                                        :title="tag"
                                        :disabled="disabled"
                                        variant="info"
                                    >{{ tag }}</b-form-tag>
                                    </li>
                                </ul>
                                <b-form-select
                                    v-model="$parent.cardsForOperation"
                                    :options="$store.getters.cardsById.map(card => $parent.provenanceHash(card))">
                                    <template v-slot:first>
                                    <!-- This is required to prevent bugs with Safari -->
                                    <!-- <option disabled value="">Choose a tag...</option>
                                    </template>
                                </b-form-select>
                                </template>
                            </b-form-tags> -->

                            <template v-slot:append>
                                <b-dropdown
                                    v-model="$parent.operation"
                                    :text="$parent.operation"
                                    variant="info">
                                        <a  class="dropdown-item"
                                            v-for="i in $parent.operations"
                                            :key="i"
                                            @click="$parent.operation = i">
                                            {{i}}
                                        </a>
                                </b-dropdown>
                                <b-button v-on:click="$store.dispatch('joinCardsTogether', { operation: $parent.operation, cardIds: $parent.cardsForOperation })" variant="outline-secondary">
                                    {{$parent.operation}} cards
                                </b-button>
                            </template>

                        </b-input-group>

                    </div>

                    <button @click="$parent.makeURLWithEncodeHistory" :disabled="!$store.state.resultCards.cards.length > 0">Save Session</button>
                    <p v-if="$store.getters.busy">Loading</p>

                    <br>                    <br>

                    <div v-if="$store.getters.cardsById.length > 0">

                    <h5>Cards</h5> Reverse Chronological Order
                    <div class="reverseorder">
                        <a  v-for="card in $store.getters.cardsById"
                            :key="`link-${$parent.provenanceHash(card)}-${card.id}`"
                            :id="`link-${$parent.provenanceHash(card)}-${card.id}`"
                            :href="`#card-${$parent.provenanceHash(card)}-${card.id}`"
                            @click="$parent.jumpToElementBy(`#card-${$parent.provenanceHash(card)}-${card.id}`)">

                            {{$parent.bioIndexFromHash($parent.provenanceHash(card))}} for {{$parent.queryFromHash($parent.provenanceHash(card))}}<br>

                        </a>
                    </div>
                    </div>
                    <br>                    <br>


                    <div v-if="$store.state.collection.length > 0">
                        <h5>Collection</h5>
                        <div v-for="el in $store.state.collection" :key="el"> {{el}} </div>
                    </div>

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
                                :title="`${$parent.bioIndexFromHash($parent.provenanceHash(card))} for ${$parent.queryFromHash($parent.provenanceHash(card))}`"
                                :parent="card.parent"
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

                        <div v-else-if="card.index === 'set'">
                            <!-- {{$store.state.dataCache[card.id]}} -->
                            <result-card-template
                                :card="card"
                                :cardData="$store.state.dataCache[card.id]"
                            ></result-card-template>
                        </div>

                        <div v-else>
                            <result-card-template
                                :card="card"
                                :cardData="$store.state.dataCache[$parent.contentHash(card)]"
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
