<template>
  <div class="pkb-wrapper f-col fill-height align-h-center">
      <!-- NAV -->
      <pkb-header></pkb-header>
      <!-- BODY -->
      <div class="pkb-body">
        <h2 class="page-title">Publications</h2>
        <div v-html="$parent.about" class="page-info"></div>
        <criterion-function-group>
          <div class="col filter-col-md">
            <div class="label">Search</div>
            <input v-model="$parent.searchString"/>
          </div>
          <div class="col filter-col-md">
            <div class="label">Filter by Category</div>
            <select v-model="$parent.searchCategory">
              <option value="">All</option>
              <option v-for="category in $parent.categories"
                :value="category">
                  {{ category }}
              </option>
            </select>
          </div>
          <template slot="filtered" slot-scope="{ filter }">
          <b-table 
            :items="$parent.pubSearchResults"
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
            :total-rows="$parent.pubSearchResults.length">
          </b-pagination>
        </template>
        </criterion-function-group>
        
      </div>
      <!-- FOOTER -->
      <pkb-footer></pkb-footer> 
  </div>
</template>