<template>
  <div class="pkb-wrapper f-col fill-height align-h-center">
      <!-- NAV -->
      <pkb-header></pkb-header>
      <!-- BODY -->
      <div class="pkb-body">
        <h2 class="page-title">Analytical Library</h2>
        <div v-html="$parent.libraryInfo"></div>
      </div>
      <!-- FOOTER -->
      <pkb-footer></pkb-footer> 
  </div>
</template>