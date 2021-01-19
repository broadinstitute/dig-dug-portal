<template>
    <div>
        <page-header :disease-group="$parent.diseaseGroup" :front-contents="$parent.frontContents"></page-header>
        <div class="container-fluid mdkp-body">
            <div class="card mdkp-card">
                <div class="card-body">
                    <h1 class="card-title">KPLab</h1>
                    <ncats-predicate-table
                        :title="'Pathway'"
                        :geneSymbol="'PCSK9'"
                        :field="'pathway'">
                    </ncats-predicate-table>
                    <ncats-predicate-table
                        :title="'GO Terms'"
                        :geneSymbol="'PCSK9'"
                        :field="'go'">
                    </ncats-predicate-table>
                </div>
            </div>
        </div>
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>