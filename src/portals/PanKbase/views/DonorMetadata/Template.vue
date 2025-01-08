<template>
  <div class="pkb-wrapper f-col fill-height align-h-center">
      <!-- NAV -->
      <pkb-header></pkb-header>
      <!-- BODY -->
      <div class="pkb-body">
        <div>
          <iframe id="meta-embed" src="http://tools.cmdga.org:3838/metadata_analysis_assays/"></iframe>
        </div>
      </div>
      <!-- FOOTER -->
      <pkb-footer></pkb-footer> 
  </div>
</template>
<style>
  #meta-embed {
    width: 100%;
    height: 900px;
    border: none;
  }
</style>
