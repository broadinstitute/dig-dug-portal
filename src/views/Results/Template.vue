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
                    v-model="$parent.queryString"
                ></b-form-input>

                <template v-slot:append>
                    <b-button v-on:click="$parent.queryBioIndexForResults($parent.index, $parent.queryString)" variant="outline-secondary">Run</b-button>
                </template>
            </b-input-group>
        </div>

        <p v-if="!$parent.loading">Not loading anything</p>
        <p v-if="$parent.loading">Loading stuff</p>

        <b-container fluid>
            <b-row no-gutters>
                <b-col cols="1">

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
                        v-for="(queryHash, n) in $parent.queryHashes"
                        :key="`card-${queryHash}-${n}`"
                        :id="`card-${queryHash}-${n}`">


                        <!-- TODO: v-if for different datatypes? -->
                        <div v-if="$parent.bioIndexFromHash(queryHash) === 'regions'">
                            <regions-result-card
                                :title="`${queryHash}`"
                                :regions="$parent.dataCache[queryHash]"
                                @pushQuery="$parent.queryBioIndexForResults($event.index, $event.queryString)"
                            ></regions-result-card>
                        </div>

                        <div v-else-if="$parent.bioIndexFromHash(queryHash) === 'top-associations'">
                            <associations-result-card
                                :title="`${queryHash}`"
                                :associations="$parent.dataCache[queryHash]"
                                :locus="$parent.locusFromHash(queryHash)"
                                @pushQuery="$parent.queryBioIndexForResults($event.index, $event.queryString)"
                            ></associations-result-card>
                        </div>

                        <div v-else>
                            I'm a {{queryHash}} that's not yet supported
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
