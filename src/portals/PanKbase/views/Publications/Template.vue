<template>
  <div class="pkb-wrapper f-col fill-height align-h-center">
      <!-- NAV -->
      <pkb-header></pkb-header>
      <!-- BODY -->
      <div class="pkb-body">
        <h3 class="page-title">Publications</h3>
        <div v-html="$parent.publicationsInfo" class="page-info"></div>
        <criterion-function-group>
          <filter-enumeration-control
            :field="'Publication Category'"
            :options="
                $parent.publications.map((pub) => pub['Publication Category'])
            "
          >
            <div class="label">Filter by Category</div>
        </filter-enumeration-control>
          <template slot="filtered" slot-scope="{ filter }">
          <b-table 
            :items="$parent.publications.filter(filter)"
            :sortable="true"
          >
            <template #cell(Publication)="p">
              <span>
                <strong>{{ $parent.extractAuthors(p).authors }}</strong>
                {{ $parent.extractAuthors(p).rest }}
              </span>
            </template>
          </b-table>
        </template>
        </criterion-function-group>
        
      </div>
      <!-- FOOTER -->
      <pkb-footer></pkb-footer> 
  </div>
</template>