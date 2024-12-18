<template>
  <div class="pkb-wrapper f-col fill-height align-h-center">
      <!-- NAV -->
      <pkb-header></pkb-header>
      <!-- BODY -->
      <div class="pkb-body">
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