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
                    <b-button v-on:click="$parent.queryBioIndex" variant="outline-secondary">Run</b-button>
                </template>
            </b-input-group>
        </div>

        <p v-if="!$parent.loading">Not loading anything</p>
        <p v-if="$parent.loading">Loading stuff</p>

        <b-container>
            <b-row no-gutters>
                <b-col cols="2">

                    <a  v-for="(queryHash, n) in $parent.queryHashes"
                        :key="`link-${queryHash}-${n}`"
                        :id="`link-${queryHash}-${n}`"
                        @click="$parent.jumpToElementBy(`#card-${queryHash}-${n}`)"
                    >
                        {{queryHash}} {{n}}<br>
                    </a>

                </b-col>
                <b-col class="reverseorder">

                    <!-- TODO: content addressing id vs timestamp id? right now list index serves role of relative timestamp. don't like that -->
                    <div class="card"
                        v-for="(queryHash, n) in $parent.queryHashes"
                        :key="`card-${queryHash}-${n}`"
                        :id="`card-${queryHash}-${n}`"
                    >
                        {{`card-${queryHash}-${n}`}}
                        <!-- TODO: v-if for different datatypes? -->
                        <regions-result-card
                            :title="`${queryHash}`"
                            :regions="$parent.dataCache[queryHash]"
                        ></regions-result-card>
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
