<template>
    <div>
        <div
            v-if="allSupportingNetwork"
            style="position: absolute; z-index: 999; top: 200px; right: 50px"
        >
            <factor-base-reveal-network
                :key="999"
                :ref="'mechanismNetwork-' + 999"
                :network="allSupportingNetwork"
                :genes="[]"
                :width="640"
                :height="360"
                :show-popup-button="true"
                @open-popup="helpers.openNetworkPopup({ index: 999, hypothesisMap: false })"
            />
        </div>

        <!-- Network viz popup: 90% window size -->
        <div
            v-if="
                networkPopupMechanismIndex !== null &&
                mechanisms &&
                mechanisms[networkPopupMechanismIndex] &&
                (networkPopupIsHypothesisMap
                    ? mechanisms[networkPopupMechanismIndex].core_spine_network &&
                      mechanisms[networkPopupMechanismIndex].core_spine_network.nodes &&
                      mechanisms[networkPopupMechanismIndex].core_spine_network.nodes.length
                    : (mechanisms[networkPopupMechanismIndex].supporting_network &&
                          mechanisms[networkPopupMechanismIndex].supporting_network.nodes &&
                          mechanisms[networkPopupMechanismIndex].supporting_network.nodes.length) ||
                      (mechanisms[networkPopupMechanismIndex].network &&
                          mechanisms[networkPopupMechanismIndex].network.nodes &&
                          mechanisms[networkPopupMechanismIndex].network.nodes.length))
            "
            class="network-popup-overlay"
            @click.self="helpers.closeNetworkPopup"
        >
            <div class="network-popup-box">
                <div class="network-popup-header d-flex justify-content-between align-items-center">
                    <span class="font-weight-bold">{{
                        networkPopupIsHypothesisMap ? "Hypothesis map (biological mechanism)" : "Supporting network"
                    }}</span>
                    <button type="button" class="btn btn-sm btn-outline-secondary" aria-label="Close" @click="helpers.closeNetworkPopup">
                        <b-icon icon="x"></b-icon>
                    </button>
                </div>
                <div class="network-popup-body">
                    <factor-base-reveal-network
                        :key="'popup-' + networkPopupMechanismIndex + '-' + (networkPopupIsHypothesisMap ? 'hypothesis' : 'supporting')"
                        :network="
                            networkPopupIsHypothesisMap
                                ? mechanisms[networkPopupMechanismIndex].core_spine_network
                                : mechanisms[networkPopupMechanismIndex].supporting_network ||
                                  mechanisms[networkPopupMechanismIndex].network
                        "
                        :genes="mechanisms[networkPopupMechanismIndex].candidate_genes || mechanisms[networkPopupMechanismIndex].genes || []"
                        :width="popupNetworkWidth"
                        :height="popupNetworkHeight"
                        :show-popup-button="false"
                        :is-mechanism-flow-map="networkPopupIsHypothesisMap"
                        :keep-physics-enabled="!networkPopupIsHypothesisMap"
                        :use-gene-role-colors="networkPopupIsHypothesisMap"
                        :highlight-anchor-genes="!networkPopupIsHypothesisMap"
                        :is-biolink-map="networkPopupIsHypothesisMap && helpers.isMechanismUsingBiolinkMap(mechanisms[networkPopupMechanismIndex])"
                        :show-hypothesis-map-view-toggle="
                            networkPopupIsHypothesisMap &&
                            helpers.hasMechanismBiolinkNetwork(mechanisms[networkPopupMechanismIndex])
                        "
                        :show-original-hypothesis-map="
                            networkPopupIsHypothesisMap &&
                            !helpers.isMechanismUsingBiolinkMap(mechanisms[networkPopupMechanismIndex])
                        "
                        @hypothesis-original-map="
                            helpers.setMechanismMapViewMode(
                                networkPopupMechanismIndex,
                                $event ? 'original' : 'biolink'
                            )
                        "
                    />
                </div>
            </div>
        </div>

        <b-modal
            :visible="factorConnectivityPopupOpen"
            size="xl"
            title="Phenotype-gene set-gene connectivity"
            hide-footer
            body-class="pt-2 pb-2"
            @change="$emit('update:factorConnectivityPopupOpen', $event)"
        >
            <div v-if="factorConnectivityPopupRow" class="small text-muted mb-2">
                {{ helpers.getPhenotypeDisplay(factorConnectivityPopupRow.phenotype) }} - {{ helpers.getFactorClusterDisplay(factorConnectivityPopupRow) }}
            </div>
            <factor-base-reveal-network
                v-if="factorConnectivityPopupNetwork && factorConnectivityPopupNetwork.nodes && factorConnectivityPopupNetwork.nodes.length"
                :network="factorConnectivityPopupNetwork"
                :width="popupNetworkWidth"
                :height="popupNetworkHeight"
                :show-popup-button="false"
                keep-physics-enabled
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
        allSupportingNetwork: { type: Object, default: null },
        networkPopupMechanismIndex: { type: Number, default: null },
        mechanisms: { type: Array, default: null },
        networkPopupIsHypothesisMap: { type: Boolean, default: false },
        popupNetworkWidth: { type: Number, default: 960 },
        popupNetworkHeight: { type: Number, default: 640 },
        factorConnectivityPopupOpen: { type: Boolean, default: false },
        factorConnectivityPopupRow: { type: Object, default: null },
        factorConnectivityPopupNetwork: { type: Object, default: null },
        helpers: { type: Object, required: true },
    },
};
</script>

<style src="./mqSharedStyles.css"></style>
