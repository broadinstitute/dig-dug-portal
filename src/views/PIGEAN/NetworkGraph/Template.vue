<template>
    <div>
        <!-- Header -->
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
            :raw-phenotypes="$parent.rawPhenotypes"
        ></page-header>

        <!-- Body -->
        <div class="container-fluid mdkp-body">
            <div class="card mdkp-card">
                <div class="card-body">
                    <h4 class="card-title">Mechanism Graph</h4>
                    <template v-if="$parent.phenotype && $parent.genesetSize">
                        <network-graph
                            :phenotype="$parent.phenotype"
                            :geneset-size="$parent.genesetSize"
                        ></network-graph>
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>
