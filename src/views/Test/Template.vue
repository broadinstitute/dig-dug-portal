<template>
    <div>
        <!-- Header -->
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>

        <!-- Body -->
        <div class="container-fluid mdkp-body">
            <div class="card mdkp-card">
                <div class="card-body temporary-card">
                    
                    
                    <!-- <documentation
                        name="gene.explore.subheader"
                        :content-fill="$parent.documentationMap"
                    ></documentation> -->
                   
                    <div>Gene: {{$store.state.geneName}}</div>
                    
                    <div>{{$store.state.gene.data[0]}}</div>
                    <div>Region:{{$store.state.geneRegion}}</div>
                    <!-- <div>Genes: {{$store.state.variants.data}}</div> -->
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body">
                    <div v-if="$store.state.variants.data">
                        <h4 class="card-title">
                            Gene-Variants
                        </h4>

                        <bch-variant-search
                        v-bind:variants="
                                $store.state.variants.data
                            "
                        ></bch-variant-search>
                    </div>
                </div>
            </div>

            
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
