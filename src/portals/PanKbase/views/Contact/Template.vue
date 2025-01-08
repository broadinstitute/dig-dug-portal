<template>
  <div class="pkb-wrapper f-col fill-height align-h-center">
      <!-- NAV -->
      <pkb-header></pkb-header>
      <!-- BODY -->
      <div class="pkb-body">
        <h2 class="page-title">Contact Us</h2>
        <div v-html="$parent.contactInfo" class="page-info"></div>
      </div>
      <!-- FOOTER -->
      <pkb-footer></pkb-footer> 
  </div>
</template>