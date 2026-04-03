<template>
    <div class="pkb-wrapper f-col fill-height">
        <!-- NAV -->
        <pkb-header></pkb-header>
        <!-- BODY -->
        <div class="pkb-body">
            <div class="card mdkp-card">
                <div class="card-body">
                    <h2>Filter Donors</h2>
                    <div v-if="$store.state.metadata.length > 0">
                    <criterion-function-group>
                            <template slot="filtered" slot-scope="{ filter }">
                            <b-table 
                                :items="$store.state.metadata"
                                :sortable="true"
                                :per-page="$parent.perPage"
                                :current-page="$parent.currentPage"
                            >
                            </b-table>
                            <b-pagination
                                class="pagination-md justify-content-center"
                                v-model="$parent.currentPage"
                                :per-page="$parent.perPage"
                                :total-rows="$store.state.metadata.length">
                            </b-pagination>
                            </template>
                            </criterion-function-group>
                    </div>
                </div>
            </div>
        </div>
        <!-- FOOTER -->
        <pkb-footer></pkb-footer>
    </div>
</template>
<style scoped>
.pkb-body {
    max-width: 2000px;
}
.container {
    display: flex;
    justify-content: center;
}
.center {
    padding: 10px;
}

/* basic positioning */
.legend {
    list-style: none;
}
.legend li {
    float: left;
    margin-right: 10px;
}
.legend span {
    border: 0px;
    float: left;
    width: 12px;
    height: 12px;
    margin: 2px;
}

.mdkp-card {
    margin-top: 20px;
    margin-bottom: 20px;
}
.toc-item {
    padding: 10px;
    margin-bottom: 5px;
    background-color: #efefef;
    border: 1px solid #dddddd;
    border-radius: 5px;
}
</style>
