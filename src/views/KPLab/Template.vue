<template>
    <div>
        <page-header :disease-group="$parent.diseaseGroup" :front-contents="$parent.frontContents"></page-header>
        <div class="container-fluid mdkp-body">
            <div class="card mdkp-card">
                <div class="card-body">
                    <h1 class="card-title">KPLab</h1>
                    <b-tabs content-class="mt-3">
                    <b-tab title="Pathway" active>                    
                        <ncats-predicate-table
                        :title="'Pathway'"
                        :geneSymbol="'PCSK9'"
                        :field="'pathway'">
                        </ncats-predicate-table>
                    </b-tab>
                    <b-tab title="Gene Ontology">
                        <ncats-predicate-table
                            :title="'GO Terms'"
                            :geneSymbol="'PCSK9'"
                            :field="'go'">
                        </ncats-predicate-table>
                    </b-tab>
                </b-tabs>
                </div>
            </div>
        </div>
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>