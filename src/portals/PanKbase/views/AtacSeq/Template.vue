<template>
    <div class="pkb-wrapper f-col fill-height">
        <!-- NAV -->
        <pkb-header z-index="0"></pkb-header>
        <!-- BODY -->
        <div class="pkb-body">
            <div class="row front-search-section">
          <div class="col-md-8 offset-md-2" align="center">
              <div class="single-search-wrapper cypher-single-search">
                  <h4>
                      Search gene
                  </h4>
                  <research-single-search
                      :single-search-config="$parent.searchConfig"
                      :phenotypes="[]"
                      :utils="$parent.utilsBox"
                  ></research-single-search>
              </div>
          </div>
      </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <div id="documentation"></div>
                    <div class="analysis-set">
                        <a href="https://data.pankbase.org/search/?type=AnalysisSet&query=Peak+counts&file_set_type=principal+analysis">
                            <button class="btn btn-secondary">View analysis sets in Data Library</button>
                        </a>
                    </div>
                    <atac-seq v-if="$parent.geneReady" :gene="$parent.geneName"></atac-seq>
                </div>
            </div>
        </div>
        <!-- FOOTER -->
        <pkb-footer></pkb-footer>
    </div>
</template>

<script>
import AtacSeq from "@/portals/PanKbase/components/AtacSeq.vue";
import PkbFooter from "@/portals/PanKbase/components/pkb-footer.vue";
import PkbHeader from "@/portals/PanKbase/components/pkb-header.vue";
import ResearchSingleSearch from "@/components/researchPortal/ResearchSingleSearch.vue";

export default {
    components: {
        AtacSeq,
        PkbFooter,
        PkbHeader,
        ResearchSingleSearch,
    },
};
</script>
<style scoped>
.pkb-body {
    max-width: 2000px;
}
.container {
    display: flex;
    justify-content: center;
}
.center {
    padding: 10px;
}

/* basic positioning */
.legend {
    list-style: none;
}
.legend li {
    float: left;
    margin-right: 10px;
}
.legend span {
    border: 0px;
    float: left;
    width: 12px;
    height: 12px;
    margin: 2px;
}

.mdkp-card {
    margin-top: 20px;
    margin-bottom: 20px;
}
.toc-item {
    padding: 10px;
    margin-bottom: 5px;
    background-color: #efefef;
    border: 1px solid #dddddd;
    border-radius: 5px;
}
.analysis-set {
    text-align: right;
    margin-bottom: 5px;
}
.analysis-set a {
    color: inherit !important;
}
</style>
