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
            <div class="show-cypher">
              <button @click="$parent.toggleQuery(queryKey, 'cypher')">
                {{ $parent.queryText[queryKey].show !== 'cypher' ? 'Show' : 'Hide' }} cypher query
              </button>
              <button @click="$parent.toggleQuery(queryKey, 'curl')">
                {{ $parent.queryText[queryKey].show !== 'curl' ? 'Show' : 'Hide' }} curl query
              </button>
            </div>
            <div :hidden="$parent.queryText[queryKey].show === 'none'" class="query-copy">
              <pre v-if="$parent.queryText[queryKey].show === 'cypher'">
                {{ $parent.queryText[queryKey].cypher }}
              </pre>
              <pre v-else-if="$parent.queryText[queryKey].show === 'curl'">
                {{ $parent.queryText[queryKey].curl }}
              </pre>
            </div>
            
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
  .show-cypher {
    text-align: right;
  }
  .show-cypher button {
    margin: 5px;
  }
  .query-copy pre {
    padding: 10px;
    color: white;
    background-color: darkslategray;
    border-radius: 5px;
    margin-top: 5px;
  }
</style>