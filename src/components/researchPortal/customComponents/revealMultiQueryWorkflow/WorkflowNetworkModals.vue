<template>
    <div v-if="w">
        <div
            v-if="w.all_supporting_network"
            style="position: absolute; z-index: 999; top: 200px; right: 50px"
        >
            <factor-base-reveal-network
                :key="999"
                :ref="'mechanismNetwork-' + 999"
                :network="w.all_supporting_network"
                :genes="[]"
                :width="640"
                :height="360"
                :show-popup-button="true"
                @open-popup="w.openNetworkPopup(999)"
            />
        </div>

        <!-- Network viz popup: 90% window size -->
        <div
            v-if="
                w.networkPopupMechanismIndex !== null &&
                w.mechanisms &&
                w.mechanisms[w.networkPopupMechanismIndex] &&
                (!w.networkPopupIsHypothesisMap ||
                    (w.mechanisms[w.networkPopupMechanismIndex].core_spine_network &&
                        w.mechanisms[w.networkPopupMechanismIndex].core_spine_network.nodes &&
                        w.mechanisms[w.networkPopupMechanismIndex].core_spine_network.nodes.length))
            "
            class="network-popup-overlay"
            @click.self="w.closeNetworkPopup"
        >
            <div class="network-popup-box">
                <div class="network-popup-header d-flex justify-content-between align-items-center">
                    <span class="font-weight-bold">{{
                        w.networkPopupIsHypothesisMap ? "Hypothesis map (biological mechanism)" : "Supporting network"
                    }}</span>
                    <button type="button" class="btn btn-sm btn-outline-secondary" aria-label="Close" @click="w.closeNetworkPopup">
                        <b-icon icon="x"></b-icon>
                    </button>
                </div>
                <div class="network-popup-body">
                    <factor-base-reveal-network
                        :key="'popup-' + w.networkPopupMechanismIndex + '-' + (w.networkPopupIsHypothesisMap ? 'hypothesis' : 'supporting')"
                        :network="
                            w.networkPopupIsHypothesisMap
                                ? w.mechanisms[w.networkPopupMechanismIndex].core_spine_network
                                : w.mechanisms[w.networkPopupMechanismIndex].supporting_network ||
                                  w.mechanisms[w.networkPopupMechanismIndex].network
                        "
                        :genes="w.mechanisms[w.networkPopupMechanismIndex].candidate_genes || w.mechanisms[w.networkPopupMechanismIndex].genes || []"
                        :width="w.popupNetworkWidth"
                        :height="w.popupNetworkHeight"
                        :show-popup-button="false"
                        :is-mechanism-flow-map="w.networkPopupIsHypothesisMap"
                        :is-biolink-map="w.networkPopupIsHypothesisMap && w.isMechanismUsingBiolinkMap(w.mechanisms[w.networkPopupMechanismIndex])"
                        :show-hypothesis-map-view-toggle="
                            w.networkPopupIsHypothesisMap &&
                            w.hasMechanismBiolinkNetwork(w.mechanisms[w.networkPopupMechanismIndex])
                        "
                        :show-original-hypothesis-map="
                            w.networkPopupIsHypothesisMap &&
                            !w.isMechanismUsingBiolinkMap(w.mechanisms[w.networkPopupMechanismIndex])
                        "
                        @hypothesis-original-map="
                            w.setMechanismMapViewMode(
                                w.networkPopupMechanismIndex,
                                $event ? 'original' : 'biolink'
                            )
                        "
                    />
                </div>
            </div>
        </div>

        <b-modal
            :visible="w.factorConnectivityPopupOpen"
            size="xl"
            title="Phenotype-gene set-gene connectivity"
            hide-footer
            body-class="pt-2 pb-2"
            @change="w.factorConnectivityPopupOpen = $event"
        >
            <div v-if="w.factorConnectivityPopupRow" class="small text-muted mb-2">
                {{ w.getPhenotypeDisplay(w.factorConnectivityPopupRow.phenotype) }} - {{ w.getFactorClusterDisplay(w.factorConnectivityPopupRow) }}
            </div>
            <factor-base-reveal-network
                v-if="w.factorConnectivityPopupNetwork && w.factorConnectivityPopupNetwork.nodes && w.factorConnectivityPopupNetwork.nodes.length"
                :network="w.factorConnectivityPopupNetwork"
                :width="w.popupNetworkWidth"
                :height="w.popupNetworkHeight"
                :show-popup-button="false"
                gene-node-metric-key="gwas_support"
                gene-color-by-gwas-support
                edge-distance-metric-key="functional_support"
            />
            <div v-else class="small text-muted">No connectivity graph data available for this row.</div>
        </b-modal>
    </div>
</template>

<script>
import FactorBaseRevealNetwork from "../FactorBaseRevealNetwork2.vue";

export default {
    name: "WorkflowNetworkModals",
    components: { FactorBaseRevealNetwork },
    props: {
        shell: { type: Object, default: null },
    },
    computed: {
        w() {
            return this.shell;
        },
    },
};
</script>

<style src="./mqSharedStyles.css"></style>
