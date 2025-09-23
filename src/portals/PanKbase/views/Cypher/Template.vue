<template>
  <div class="pkb-wrapper f-col fill-height align-h-center">
      <!-- NAV -->
      <pkb-header></pkb-header>
      <!-- BODY -->
      <div class="pkb-body">
        <div v-if="!!$parent.jsonResults">
          <div v-for="queryKey, index in $parent.queryKeys">
            <strong>{{ index }}. {{ queryKey }}</strong>
            <b-table :items="$parent.jsonResults[queryKey]">
            </b-table>
          </div>
        </div>
      </div>
      <!-- FOOTER -->
      <pkb-footer></pkb-footer> 
  </div>
</template>