<template>
  <div class="pkb-wrapper f-col fill-height align-h-center">
      <!-- NAV -->
      <pkb-header></pkb-header>
      <!-- BODY -->
      <div class="pkb-body">
        <div class="row front-search-section">
          <div class="col-md-8 offset-md-2" align="center">
              <div class="single-search-wrapper cypher-single-search">
                  <h4>
                      Search for gene
                  </h4>
                  <research-single-search
                      :single-search-config="$parent.searchConfig"
                      :phenotypes="[]"
                      :utils="$parent.utilsBox"
                  ></research-single-search>
              </div>
          </div>
      </div>
        <div v-if="!!$parent.jsonResults" id="cypher-tables">
          <div v-for="queryKey, index in $parent.queryKeys" class="query-table">
            <strong>{{ index + 1 }}. {{ $parent.tissueFormatter(queryKey) }}</strong>
            <b-table :items="$parent.jsonResults[queryKey]"
              sticky-header="300px">
            </b-table>
          </div>
        </div>
      </div>
      <!-- FOOTER -->
      <pkb-footer></pkb-footer> 
  </div>
</template>
<style>
  .query-table {
    margin-bottom: 50px;
    padding: 10px;
    border-radius: 5px;
    background-color: white;
  }
  .cypher-single-search {
    margin-bottom: 50px;
  }
  #cypher-tables {
    background-color: #efefef;
    padding: 25px;
  }
</style>