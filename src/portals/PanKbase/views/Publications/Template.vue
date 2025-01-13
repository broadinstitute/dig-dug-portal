<template>
  <div class="pkb-wrapper f-col fill-height align-h-center">
      <!-- NAV -->
      <pkb-header></pkb-header>
      <!-- BODY -->
      <div class="pkb-body">
        <h2 class="page-title">Publications</h2>
        <div v-html="$parent.about" class="page-info"></div>
        <criterion-function-group>
          <filter-basic-control>
            <div class="label">Search</div>
          </filter-basic-control>
          <filter-enumeration-control
            :field="'Category'"
            :options="
                $parent.publications.map((pub) => pub['Category'])
            "
          >
          <div class="label">Filter by Category</div>
        </filter-enumeration-control class="col filter-col-md">
          <template slot="filtered" slot-scope="{ filter }">
          <b-table 
            :items="$parent.publications.filter(filter)"
            :sortable="true"
            :per-page="$parent.perPage"
            :current-page="$parent.currentPage"
          >
            <template #cell(Publication)="p">
              <span>
                <strong>{{ $parent.extractAuthors(p).authors }}</strong>
                {{ $parent.extractAuthors(p).rest }}
              </span>
            </template>
          </b-table>
          <b-pagination
            class="pagination-sm justify-content-center"
            v-model="$parent.currentPage"
            :per-page="$parent.perPage"
            :total-rows="$parent.publications.filter(filter).length">
          </b-pagination>
        </template>
        </criterion-function-group>
        
      </div>
      <!-- FOOTER -->
      <pkb-footer></pkb-footer> 
  </div>
</template>