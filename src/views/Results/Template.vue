<template>
    <div>

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

                <b-form-input
                    v-model="$parent.query"
                    :placeholder="$parent.placeholder"
                ></b-form-input>
                <template v-slot:append>
                    <b-button v-on:click="$parent.queryBioIndexForResults($parent.index, $parent.query)" variant="outline-secondary">Run</b-button>
                </template>
            </b-input-group>
        </div>

        <p v-if="!$parent.loading">Not loading anything</p>
        <p v-if="$parent.loading">Loading stuff</p>

        {{$store.getters.encodeHistory.trim()}}<br>
        <input v-model="$parent.decodeString" placeholder="decode string"/>
        <button @click="$store.commit('decodeHistoryAndLoad',$event.target.value)" :value="$parent.decodeString.trim()">Decode</button>

        <b-container fluid>
            <b-row no-gutters>
                <b-col cols="2">

                    <a  v-for="(queryHash, n) in $parent.queryHashes"
                        :key="`link-${queryHash}-${n}`"
                        :id="`link-${queryHash}-${n}`"
                        @click="$parent.jumpToElementBy(`#card-${queryHash}-${n}`)">

                        {{queryHash}} {{n}}<br>

                    </a>

                </b-col>
                <b-col class="reverseorder">

                    <!-- TODO: content addressing id vs timestamp id? right now list index serves role of relative timestamp. don't like that -->
                    <div class="card"
                        v-for="card in $store.state.resultCards.cards"
                        :key="`card-${$parent.hashQuery(card)}-${card.id}`"
                        :id="`card-${$parent.hashQuery(card)}-${card.id}`">


                        <div v-if="card.index === 'regions'">
                            <regions-result-card
                                :title="`${$parent.hashQuery(card)}`"
                                :parent="card.parent"
                                :regions="$parent.dataCache[$parent.hashQuery(card)]"
                                @pushQuery="$parent.queryBioIndexForResults($event.index, $event.queryString, card.id)"
                            ></regions-result-card>
                        </div>


                        <div v-else-if="card.index === 'associations'">
                            <associations-result-card
                                :title="`${$parent.hashQuery(card)}`"
                                :parent="card.parent"

                                :associations="$parent.dataCache[$parent.hashQuery(card)]"
                                :phenotype="$parent.phenotypeFromHash($parent.hashQuery(card))"
                                :locus="$parent.locusFromHash($parent.hashQuery(card))"

                                @pushQuery="$parent.queryBioIndexForResults($event.index, $event.queryString, card.id)"
                            ></associations-result-card>
                        </div>


                        <div v-else-if="card.index === 'variant'">
                            <!-- <variant-result-card
                                :title="`${$parent.hashQuery(card)}`"
                                :parent="card.parent"
                                :variant="$parent.dataCache[$parent.hashQuery(card)]"
                                @pushQuery="$parent.queryBioIndexForResults($event.index, $event.queryString)"
                            ></variant-result-card> -->
                            {{$parent.dataCache[$parent.hashQuery(card)][0].associations}}
                            <phewas-table
                                :associations="$parent.dataCache[$parent.hashQuery(card)][0].associations"
                                :phenotype-map="$store.state.bioPortal.phenotypeMap"
                            ></phewas-table>
                        </div>

                        <div v-else>
                            I'm a {{card}} that's not yet supported
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
    }
</style>
