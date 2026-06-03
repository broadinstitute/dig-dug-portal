<script>
import Vue from "vue";
import keyParams from "@/utils/keyParams";
export default Vue.component('LigerBrowser', {
    props: {
        config: {
            type: Object,
            default: () => ({})
        }
    },

    data() {
        return {
            searchedGene: null,
            selectedGene: null,
            availableTissues: ["Liver", "Pancreas"],
            selectedTissue: null,
            availableCellTypes: ["Beta", "Gamma Cell", "Pancreatic Active Stellate", "Delta Cell", "Pancreatic Quiescent Stellate", "Plasmablast", "Mast"],
            selectedCellType: null,
            viewInfo: false,
        };
    },

    computed: {
        
    },

    watch: {
        
    },

    async created() {
        
    },

    beforeDestroy() {
        
    },

    methods: {
        selectTissue(tissue) {
            this.selectedTissue = tissue;
            this.selectedCellType = null;
        },
        selectCellType(cellType) {
            this.selectedCellType = cellType;
        }
    }
});
</script>

<template>
    <div id="liger" class="f-col g-40">
        <div class="f-row g-40">
            <div class="f-col align-v-bottom flex1" style="padding:0 0 7px;">
                <h4 class="bold">Search gene</h4>
                <div class="search f-row g-5">
                    <input type="text" class="flex1" v-model="searchedGene" @keyup.enter="selectedGene=searchedGene.toUpperCase()"/>
                    <button class="primary bold"
                        @click="selectedGene=searchedGene.toUpperCase()"
                    >
                        Search
                    </button>
                </div>
            </div>
            <h4 class="headline f-col flex1">
                Compare gene expression across cell types, curated cell states and 
                computationally inferred gene programs with genetically supported links 
                to human traits, revealing both established and potentially novel biology.
            </h4>
        </div>
        <div v-if="selectedGene" id="liger-body" class="f-col g-40">
            <div class="flex1">
                <h3 class="bold">Where is <span class="pill">{{ selectedGene }}</span> expressed?</h3>
            </div>
            <div class="f-col g-40">
                <div class="f-row g-20">
                    <div class=" section-card f-col g-10 flex1">
                        <div>
                            <h5 class="bold">Tissue</h5>
                        </div>
                        <div class="options f-col">
                            <div v-for="tissue in availableTissues" 
                                :key="tissue" 
                                class="grid-item"
                                :class="{selected: selectedTissue === tissue}"
                                @click="selectTissue(tissue)"
                            >
                                {{tissue}}
                            </div>
                        </div>
                    </div>
                    <div class="section-card flex1 relative">
                        <div v-if="!selectedTissue"
                            class="card-overlay"
                        >
                            <div><strong>Select a Tissue</strong> to see expression by Cell Type</div>
                        </div>
                        <div class="f-row g-20">
                            <div class="f-col flex1">
                                <div class="expression-grid">
                                    <h5 class="bold">Cell Type</h5>
                                    <h5 class="bold">Expression <!--<span v-if="selectedGene">of <span class="pill">{{ selectedGene }}</span></span>--></h5>
                                    <h5 class="bold text-right">ABS</h5>
                                    <h5 class="bold text-right">SPEC</h5>
                                </div>
                                    <div v-for="cellType in availableCellTypes" 
                                    :key="cellType" 
                                    class="expression-grid grid-item"
                                    :class="{selected: selectedCellType === cellType}"
                                    @click="selectCellType(cellType)"
                                >
                                    <div>{{cellType}}</div>
                                    <div>------------</div>
                                    <div class="text-right">0.0</div>
                                    <div class="text-right">0.0</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="f-col g-20">
                    <div class="section-header">
                        <div class="f-row spread-out">
                            <h3 class="bold">Cell states and gene programs <span v-if="selectedCellType">for {{ selectedCellType }} in {{ selectedTissue }}</span><span v-else>within a cell type</span></h3>
                            <button v-if="selectedCellType"
                                @click="viewInfo=!viewInfo"
                            >
                                Show {{ viewInfo ? 'Expression': 'Info'}}
                            </button>
                        </div>
                        <div class="subtitle">Cell states are curated, marker-defined biology. Gene programs are data-driven, computationally inferred latent factors.</div>
                    </div>
                    <div class="f-row g-20">
                        <div class="section-card flex1 relative">
                            <div v-if="!selectedCellType"
                                class="card-overlay"
                            >
                                <div><strong>Select a Cell Type</strong> to see expression by Curated Cell State</div>
                            </div>
                            
                            <div v-if="!viewInfo" class="expression f-col flex1">
                                <div class="expression-grid">
                                    <h5 class="bold">Cell State</h5>
                                    <h5 class="bold">Expression <!--<span v-if="selectedGene">of <span class="pill">{{ selectedGene }}</span></span>--></h5>
                                    <h5 class="bold text-right">ABS</h5>
                                    <h5 class="bold text-right">SPEC</h5>
                                </div>
                                <div class="expression-grid grid-item">
                                    <div>Cell State A</div>
                                    <div>------------</div>
                                    <div class="text-right">0.0</div>
                                    <div class="text-right">0.0</div>
                                </div>
                                <div class="expression-grid grid-item">
                                    <div>Cell State B</div>
                                    <div>------------</div>
                                    <div class="text-right">0.0</div>
                                    <div class="text-right">0.0</div>
                                </div>
                                <div class="expression-grid grid-item">
                                    <div>Cell State C</div>
                                    <div>------------</div>
                                    <div class="text-right">0.0</div>
                                    <div class="text-right">0.0</div>
                                </div>
                                <div class="expression-grid grid-item">
                                    <div>Cell State D</div>
                                    <div>------------</div>
                                    <div class="text-right">0.0</div>
                                    <div class="text-right">0.0</div>
                                </div>
                                <div class="expression-grid grid-item">
                                    <div>Cell State E</div>
                                    <div>------------</div>
                                    <div class="text-right">0.0</div>
                                    <div class="text-right">0.0</div>
                                </div>
                                <div class="expression-grid grid-item">
                                    <div>Cell State F</div>
                                    <div>------------</div>
                                    <div class="text-right">0.0</div>
                                    <div class="text-right">0.0</div>
                                </div>
                                <div class="expression-grid grid-item">
                                    <div>Cell State G</div>
                                    <div>------------</div>
                                    <div class="text-right">0.0</div>
                                    <div class="text-right">0.0</div>
                                </div>
                            </div>

                            <div v-else class="info f-col flex1">
                                <div class="info-grid">
                                    <h5 class="bold">Cell State</h5>
                                    <h5 class="bold">Description</h5>
                                    <h5 class="bold">Marker Genes</h5>
                                </div>
                                <div class="info-grid grid-item">
                                    <div>Cell State A</div>
                                    <div>Description</div>
                                    <div>Genes</div>
                                </div>
                                <div class="info-grid grid-item">
                                    <div>Cell State B</div>
                                    <div>Description</div>
                                    <div>Genes</div>
                                </div>
                                <div class="info-grid grid-item">
                                    <div>Cell State C</div>
                                    <div>Description</div>
                                    <div>Genes</div>
                                </div>
                                <div class="info-grid grid-item">
                                    <div>Cell State D</div>
                                    <div>Description</div>
                                    <div>Genes</div>
                                </div>
                                <div class="info-grid grid-item">
                                    <div>Cell State E</div>
                                    <div>Description</div>
                                    <div>Genes</div>
                                </div>
                                <div class="info-grid grid-item">
                                    <div>Cell State F</div>
                                    <div>Description</div>
                                    <div>Genes</div>
                                </div>
                                <div class="info-grid grid-item">
                                    <div>Cell State G</div>
                                    <div>Description</div>
                                    <div>Genes</div>
                                </div>
                            </div>
                        </div>
                        <div class="section-card  flex1 relative">
                            <div v-if="!selectedCellType"
                                class="card-overlay"
                            >
                                <div><strong>Select a Cell Type</strong> to see expression by Inferred Gene Program</div>
                            </div>
                            <div v-if="!viewInfo" class="expression f-col flex1">
                                <div class="expression-grid">
                                    <h5 class="bold">Gene Program</h5>
                                    <h5 class="bold">Expression <!--<span v-if="selectedGene">of <span class="pill">{{ selectedGene }}</span></span>--></h5>
                                    <h5 class="bold text-right">ABS</h5>
                                    <h5 class="bold text-right">SPEC</h5>
                                </div>
                                <div class="expression-grid grid-item">
                                    <div>Gene Program A</div>
                                    <div>------------</div>
                                    <div class="text-right">0.0</div>
                                    <div class="text-right">0.0</div>
                                </div>
                                <div class="expression-grid grid-item">
                                    <div>Gene Program B</div>
                                    <div>------------</div>
                                    <div class="text-right">0.0</div>
                                    <div class="text-right">0.0</div>
                                </div>
                                <div class="expression-grid grid-item">
                                    <div>Gene Program C</div>
                                    <div>------------</div>
                                    <div class="text-right">0.0</div>
                                    <div class="text-right">0.0</div>
                                </div>
                                <div class="expression-grid grid-item">
                                    <div>Gene Program D</div>
                                    <div>------------</div>
                                    <div class="text-right">0.0</div>
                                    <div class="text-right">0.0</div>
                                </div>
                                <div class="expression-grid grid-item">
                                    <div>Gene Program E</div>
                                    <div>------------</div>
                                    <div class="text-right">0.0</div>
                                    <div class="text-right">0.0</div>
                                </div>
                                <div class="expression-grid grid-item">
                                    <div>Gene Program F</div>
                                    <div>------------</div>
                                    <div class="text-right">0.0</div>
                                    <div class="text-right">0.0</div>
                                </div>
                                <div class="expression-grid grid-item">
                                    <div>Gene Program G</div>
                                    <div>------------</div>
                                    <div class="text-right">0.0</div>
                                    <div class="text-right">0.0</div>
                                </div>
                            </div>
                            <div v-else class="info f-col flex1">
                                <div class="info-grid">
                                    <h5 class="bold">Gene Program</h5>
                                    <h5 class="bold">Description</h5>
                                    <h5 class="bold">Top Genes</h5>
                                </div>
                                <div class="info-grid grid-item">
                                    <div>Gene Program A</div>
                                    <div>Description</div>
                                    <div>Genes</div>
                                </div>
                                <div class="info-grid grid-item">
                                    <div>Gene Program B</div>
                                    <div>Description</div>
                                    <div>Genes</div>
                                </div>
                                <div class="info-grid grid-item">
                                    <div>Gene Program C</div>
                                    <div>Description</div>
                                    <div>Genes</div>
                                </div>
                                <div class="info-grid grid-item">
                                    <div>Gene Program D</div>
                                    <div>Description</div>
                                    <div>Genes</div>
                                </div>
                                <div class="info-grid grid-item">
                                    <div>Gene Program E</div>
                                    <div>Description</div>
                                    <div>Genes</div>
                                </div>
                                <div class="info-grid grid-item">
                                    <div>Gene Program F</div>
                                    <div>Description</div>
                                    <div>Genes</div>
                                </div>
                                <div class="info-grid grid-item">
                                    <div>Gene Program G</div>
                                    <div>Description</div>
                                    <div>Genes</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="f-col g-20">
                    <div>
                        <h3 class="bold">Relationships between states and programs</h3>
                        <div class="subtitle">Explore genetic correlations between known cell states and inferred gene programs for potentially novel connections.</div>
                    </div>
                    <div class="section-card f-col g-10 relative">
                        <div v-if="!selectedCellType"
                            class="card-overlay"
                        >
                            <div><strong>Select a Cell Type</strong> to see relationships</div>
                        </div>
                        <div class="f-row">
                            <select>
                                <option>program-state correlation</option>
                            </select>
                        </div>
                        <div class="spaceholder">
                            Heatmap. Cell State labels on left. Gene Program labels on top. Cells colored by correlation, no values displayed. Color legend above heatmap.
                        </div>
                    </div>
                </div>
                <div class="f-col g-20">
                    <div>
                        <h3 class="bold">Genetically supported links of states and programs to human traits</h3>
                        <div class="subtitle">Explain</div>
                    </div>
                    <div class="section-card f-col g-10 relative">
                        <div v-if="!selectedCellType"
                            class="card-overlay"
                        >
                            <div><strong>Select a Cell Type</strong> to see trait links</div>
                        </div>
                        <div class="f-row spread-out">
                            <div class="f-row g-5">
                                <select>
                                    <option>joint beta</option>
                                </select>
                                <select>
                                    <option>states + factors</option>
                                </select>
                            </div>
                        </div>
                        <div class="spaceholder">
                            Heatmap. Trait labels on left. Cell States and/or Gene Program labels on top. Cells colored by correlation, no values displayed. Color legend above heatmap.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
@import url("/css/layout.css");

h1, h2, h3, h4, h5, h6, .h1, .h2, .h3, .h4, .h5, .h6 {
    margin-bottom: 0px !important;
}
#liger{
    font-family: Open Sans, sans-serif;
    font-size: 14px;
}
#liger-body{
    background: #f8f8f8;
    padding: 20px;
}
.headline{
    line-height: 2rem;
}
#liger .search{
    font-size: 1.5em;
}
#liger .search input{
    text-transform: uppercase;
}
#liger button {
    border: 1px solid rgba(0, 0, 0, .25);
    background: white;
    color: #4e4e4e;
    padding: 1px 10px;
    font-size: 14px;
}
#liger button.primary{
    background: #219197;
    color: white;
}

.expression-grid{
    display:grid;
    grid-template-columns: 200px auto 50px 50px;
    padding: 5px 10px;
}
.info-grid{
    display:grid;
    grid-template-columns: 200px auto 200px;
    padding: 5px 10px;
}
.grid-item{
    text-align: left;
    cursor: pointer;
}
.grid-item:hover{
    background: #94c95e;
}
.grid-item.selected {
    background: #219197;
    color: white;
}

.tabs {
    display: flex;
    font-size: 1.2em;
    gap: 5px;
    border-bottom: 1px solid rgba(0, 0, 0, .25);
}
.tab {
    padding: 5px 10px;
    border: 1px solid rgba(0, 0, 0, .25);
    border-bottom: 1px solid white;
    cursor: pointer;
}
.tab.active {
    margin-bottom: -.5px;
    color: #219197;
    font-weight: bold;
    border-color: #219197;
    border-bottom-color: white;
}
.tab-section {
    border: 1px solid rgba(0, 0, 0, .25);
    border-top: none;
    padding: 15px 10px;
}

.options > div {
    padding: 5px 10px;  
}
.options .selected {
    background: #219197;
    color: white;
}

.title{
    margin-bottom: 20px;
}
.subtitle{
    font-size: 1.2em;
}

.spaceholder {
    display: flex;
    width: 100%;
    height: 300px;
    align-items: center;
    justify-content: center;
    border: 1px dashed #bbb;
}
.card-overlay {
    position: absolute;
    top:0;
    left:0;
    background: rgb(236 236 236);
    width: 100%;
    height: 100%;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 5;
}

.section-card {
    padding: 15px;
    background: white;
}

.pill {
    display: inline-flex;
    position: relative;
    margin: 0 3px;
    z-index: 1;
}
.pill:before {
    content: '';
    background: gold;
    width: 110%;
    height: 100%;
    position: absolute;
    transform: translate(-5%, 0);
    z-index: -1;
    border-radius: .5rem;
}
</style>