<template>
  <div class="pkb-wrapper f-col fill-height align-h-center">
      <!-- NAV -->
      <pkb-header></pkb-header>
      <!-- BODY -->
      <div class="pkb-body">
         <div v-html="$parent.info"></div>
         <b-table 
              v-if="$parent.allMetadata"
              style="margin-bottom:20px"
              :items="$parent.allMetadata"
              :fields="$parent.tableColumns"
              striped
              hover
              responsive="sm"
              head-variant="light"
          >
              <template #cell(datasetId)="data">
                  <button v-if="data.item.datasetId !== $parent.selectedDataset" @click="$parent.selectDataset(data.item.datasetId)" class="pkb">Select</button>
                  <div v-else>Selected</div>
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