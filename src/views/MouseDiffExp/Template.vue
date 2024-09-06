<template>
  <div>
      <!-- Header -->
      <page-header
          :disease-group="$parent.diseaseGroup"
          :front-contents="$parent.frontContents"
          :raw-phenotypes="$parent.rawPhenotypes"
      ></page-header>

      <!-- Body -->
      <template>
          <div class="container-fluid mdkp-body">
              <search-header-wrapper>
                  <div class="region-search col filter-col-md">
                      <div class="label">Begin new search</div>
                      <research-single-search
                          :single-search-config="null"
                          :phenotypes="$parent.phenotypesInSession"
                          :utils="$parent.utilsBox"
                      ></research-single-search>
                  </div>
              </search-header-wrapper>
              <div class="card mdkp-card">
                  <div class="card-body temporary-card">
                      <documentation
                          name="tissue.explore.subheader"
                          :contentFill="$parent.docDetails"
                          :contentMap="$store.state.bioPortal.documentations"
                      ></documentation>
                  </div>
              </div>

              <div class="card mdkp-card">
                  <div class="card-body">
                      <h4>
                          MOUSE BROWSER GOES HERE
                      </h4>
                      This is where the mouse browser will go
                      <criterion-function-group>
                        <mouse-tissue-select>

                        </mouse-tissue-select>
                      </criterion-function-group>
                  </div>
              </div>
          </div>
      </template>

      <!-- Footer-->
      <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
  </div>
</template>

<style scoped>
.row .pagination.b-pagination {
  border: none !important;
  margin-bottom: 10px !important;
}

.row li.page-item .page-link {
  width: 30px !important;
  height: 30px !important;
  min-width: 30px !important;
  padding: 5px;
  margin: 0 1px;
}

tr.b-table-details > td {
  padding: 0 !important;
}

div.card >>> span.badge.badge-secondary.badge-pill.btn.filter-pill-H {
  background-color: #14a433;
}
</style>
