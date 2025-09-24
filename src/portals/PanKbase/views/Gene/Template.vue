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
        <h4>Gene Info for {{ $parent.geneName }}</h4>
        Coming soon!!!
      </div>
      <!-- FOOTER -->
      <pkb-footer></pkb-footer> 
  </div>
</template>
<style scoped>
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
    /*background-color: #6c757d;*/
    border-radius: 5px;
    margin-top: 5px;
  }
  .copy-button {
    text-align: right;
    padding-bottom: 10px;
  }
</style>