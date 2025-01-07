<template>
  <div class="pkb-wrapper f-col fill-height align-h-center">
      <!-- NAV -->
      <pkb-header></pkb-header>
      <!-- BODY -->
      <div class="pkb-body">
        <h3 class="page-title">Publications</h3>
        <div v-html="$parent.publicationsInfo" class="page-info"></div>
        <b-table
          :items="$parent.publications"
          >
            <template #cell(Publication)="p">
              <span>
                <strong>{{ $parent.extractAuthors(p).authors }}</strong>
                {{ $parent.extractAuthors(p).rest }}
              </span>
            </template>
        </b-table>
      </div>
      <!-- FOOTER -->
      <pkb-footer></pkb-footer> 
  </div>
</template>