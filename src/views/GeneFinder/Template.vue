<template>
    <div class="card mdkp-card">
        <div class="card-body">
            <h4 class="card-title">
                Top
                {{
                $parent.intFormatter(
                $store.state.associations.data.length
                )
                }}
                associations for
                {{ $store.state.phenotype.description }}
                <tooltip-documentation
                    name="phenotype.top1000.tooltip"
                    :content-fill="$parent.documentationMap"
                    :isHover="true"
                    :noIcon="false"
                ></tooltip-documentation>
            </h4>

            <filter-group v-model="$parent.associationsFilter" :looseMatch="true">
                <filter-enumeration-control
                    :field="'consequence'"
                    :options="
                                    $store.state.associations.data.map(
                                        (association) => association.consequence
                                    )
                                "
                >
                    <div class="label">Consequence</div>
                </filter-enumeration-control>
                <filter-enumeration-control
                    :field="'nearest'"
                    :options="
                                    $store.state.associations.data.map(
                                        (association) => association.nearest[0]
                                    )
                                "
                >
                    <div class="label">Closest Genes</div>
                </filter-enumeration-control>

                <filter-pvalue-control :field="'pValue'">
                    <div class="label">P-Value (&le;)</div>
                </filter-pvalue-control>

                <filter-effect-direction-control :field="'beta'">
                    <div class="label">Effect (+/-)</div>
                </filter-effect-direction-control>
            </filter-group>

            <associations-table
                :phenotypes="[$store.state.phenotype]"
                :associations="$store.state.associations.data"
                :filter="$parent.associationsFilter"
                :per-page="10"
            ></associations-table>
        </div>
    </div>
</template>