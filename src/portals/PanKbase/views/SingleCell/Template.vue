<template>
  <div class="pkb-wrapper f-col fill-height align-h-center">
      <!-- NAV -->
      <pkb-header></pkb-header>
      <!-- BODY -->
      <div class="pkb-body">
         <div v-html="$parent.info"></div>
         <div class="analysis-set">
              <a href="https://data.pankbase.org/analysis-sets/PKBDS1349YHGQ/">
                  <button class="btn btn-secondary">View scRNA analysis set in Data Library</button>
              </a>
              <a href="https://data.pankbase.org/analysis-sets/PKBDS0470WCHR/">
                  <button class="btn btn-secondary">View snATAC analysis set in Data Library</button>
              </a>
          </div>
         <b-table 
              v-if="$parent.allMetadata"
              style="margin-bottom:40px"
              :items="$parent.allMetadata"
              :fields="$parent.tableColumns"
              striped
              hover
              small
              responsive="sm"
              head-variant="light"
          >
              <template #cell(viewDataset)="data">
                  <button @click="$parent.selectDataset(data.item.datasetId)" 
                    class="pkb" 
                    :class="data.item.datasetId === $parent.selectedDataset ? 'selected' : ''"
                    style="padding:0px 10px"
                  >
                    {{data.item.datasetId === $parent.selectedDataset ? 'Selected' : 'Select'}}
                  </button>
              </template>
              <template #cell(download)="data">
                <a :href="data.item.download" 
                  target="_blank" 
                >
                  Download 
                </a>
              </template>
          </b-table>
          <research-single-cell-browser 
            v-if="$parent.scbConfig" 
            sectionId="scb"
            :renderConfig="$parent.scbConfig"
            :utils="$parent.utils"
            :data="$parent.data"
          ></research-single-cell-browser>
      </div>
      <!-- FOOTER -->
      <pkb-footer></pkb-footer> 
  </div>
</template>
<style scoped>
.analysis-set {
    text-align: right;
    margin-bottom: 5px;
}
.analysis-set a {
    color: inherit !important;
    margin-left: 5px !important;
}
</style>