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
                    <b-button v-on:click="$store.dispatch('queryBioIndexForResults', { index: $parent.index, query: $parent.query })" variant="outline-secondary">Run</b-button>
                </template>
            </b-input-group>
        </div>

        <p v-if="!$store.getters.busy">Not loading anything</p>
        <p v-if="$store.getters.busy">Loading stuff</p>
        {{$store.state.busyBodies}}<br>

        {{$store.getters.encodeHistory.trim()}}<br>
        <input v-model="$parent.decodeString" placeholder="decode string"/>
        <button :value="$parent.decodeString.trim()" @click="$parent.decodeAndLoad($event.target.value)">Decode</button>

        <b-container fluid>
            <b-row no-gutters>
                <b-col cols="2">

                    <a  v-for="card in $store.getters.cardsById"
                        :key="`link-${$parent.hashQuery(card)}-${card.id}`"
                        :id="`link-${$parent.hashQuery(card)}-${card.id}`"
                        @click="$parent.jumpToElementBy(`#card-${$parent.hashQuery(card)}-${card.id}`)">

                        {{$parent.hashQuery(card)}} {{card.id}}<br>

                    </a>

                </b-col>
                <b-col class="reverseorder">
                <!-- <b-col> -->
                    <!-- TODO: content addressing id vs timestamp id? right now list index serves role of relative timestamp. don't like that -->
                    <div class="card"
                        v-for="card in $store.getters.cardsById"
                        :key="`card-${$parent.hashQuery(card)}-${card.id}`"
                        :id="`card-${$parent.hashQuery(card)}-${card.id}`">

                        <div v-if="card.index === 'regions'">
                            I'm a {{card}} that is supported ({{card.index}})
                            <regions-result-card
                                :title="`${$parent.hashQuery(card)}`"
                                :regions="$store.state.dataCache[$parent.contentHash(card)]"
                                :parent="card.parent"
                                @pushQuery="$store.dispatch('queryBioIndexForResults', { index: $event.index, query: $event.queryString, parent: card.id })"
                            ></regions-result-card>
                        </div>

                        <div v-else-if="card.index === 'associations'">
                            I'm a {{card}} that is supported ({{card.index}})
                            <associations-result-card
                                :title="`${$parent.hashQuery(card)}`"
                                :associations="$store.state.dataCache[$parent.contentHash(card)]"
                                :phenotype="$parent.phenotypeFromHash($parent.hashQuery(card))"
                                :locus="$parent.locusFromHash($parent.hashQuery(card))"

                                :parent="card.parent"
                                @pushQuery="$store.dispatch('queryBioIndexForResults', { index: $event.index, query: $event.queryString, parent: card.id })"
                            ></associations-result-card>
                        </div>

                        <div v-else>
                            I'm a {{card}} that's not yet supported ({{card.index}})
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
