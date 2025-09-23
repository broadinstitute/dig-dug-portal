<template>
  <div class="pkb-wrapper f-col fill-height align-h-center">
      <!-- NAV -->
      <pkb-header></pkb-header>
      <!-- BODY -->
      <div class="pkb-body">
        <div class="row front-search-section">
          <div class="col-md-8 offset-md-2" align="center">
              <div class="single-search-wrapper">
                  <h4 style="color: #fff">
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
        <div v-if="!!$parent.jsonResults">
          <div v-for="queryKey, index in $parent.queryKeys" class="query-table">
            <strong>{{ index + 1 }}. {{ $parent.tissueFormatter(queryKey) }}</strong>
            <b-table :items="$parent.jsonResults[queryKey]">
            </b-table>
          </div>
        </div>
      </div>
      <!-- FOOTER -->
      <pkb-footer></pkb-footer> 
  </div>
</template>
<style scoped>
  .query-table {
    margin-bottom: 50px;
    background-color: #efefef;
  }
</style>