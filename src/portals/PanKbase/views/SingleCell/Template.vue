<template>
  <div class="pkb-wrapper f-col fill-height align-h-center">
      <!-- NAV -->
      <pkb-header></pkb-header>
      <!-- BODY -->
      <div class="pkb-body">
         <div v-html="$parent.info"></div>
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
              <template #cell(totalCells)="data">
                {{data.item.totalCells.toLocaleString()}}
              </template>
              <template #cell(viewDataset)="data">
                  <button @click="$parent.selectDataset(data.item.datasetId)" 
                    class="pkb" 
                    :class="data.item.datasetId === $parent.selectedDataset ? 'selected' : ''"
                    style="padding:0px 10px"
                  >
                    {{data.item.datasetId === $parent.selectedDataset ? 'Selected' : 'Select'}}
                  </button>
              </template>
              <template #cell(downloadData)="data">
                <a :href="`${$parent.downloadLinks[data.item.datasetId]}`" 
                  target="_blank" 
                >
                  Download
                </a>
              </template>
          </b-table>
          <research-single-cell-browser 
            v-if="true"
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