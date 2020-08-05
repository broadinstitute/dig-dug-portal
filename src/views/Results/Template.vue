<template>
    <div>
        <h2>Card Prototype</h2>

        <!-- Visualization/Tool Cards Take Arbitrary BioIndex Data and give arbitrary objects (BioIndex or otherwise) -->
        <h6><em>Visualization/Tool Card</em></h6>
        <div class="list-group-item">
            <h3>Visualization/Tool Name</h3>
                <template>
                    <!-- TODO: check against these, make dynamic -->
                    <b>Input Types </b>
                    <div class="bioindex-concept-pellet phenotype">
                        Phenotype
                    </div>
                    <div class="bioindex-concept-pellet gene">
                        Gene/Region
                    </div>
                </template>
                <template>
                    <!-- TODO: check against these, make dynamic -->
                    <b>Output Types </b>
                    <div class="bioindex-concept-pellet phenotype">
                        Phenotype
                    </div>
                    <div class="bioindex-concept-pellet gene">
                        Gene/Region
                    </div>
                </template>
                <br>
                <div v-if="true">
                    <template>
                        <locuszoom
                            ref="locuszoom"
                            :refSeq="false">
                            <lz-phewas-panel
                                :varId="'rs1260326'"
                                :phenotypeMap="$store.state.bioPortal.phenotypeMap">
                            </lz-phewas-panel>
                        </locuszoom>
                    </template>
                </div>
                <div v-else-if="!true">
                    <!-- TODO -->
                    <template>
                        <em>Drag in Inputs, or fill in Inputs with valid elements from context or collection</em>
                        <div>
                            <label for="card-input-phenotype">
                                Phenotype
                            </label>&nbsp;
                            <input id="card-input-phenotype"/>&nbsp;
                            <label for="card-input-gene">
                                Gene
                            </label>&nbsp;
                            <input id="card-input-gene"/>
                        </div>
                        <draggable
                            class="dragArea list-group"
                            :group="{ name:'cards', put: ['data', 'viz'] }"
                            :list="nullList"
                            @change="tap">
                            <div
                                slot="header"
                                class="btn-group list-group-item"
                                role="group"
                                aria-label="Basic example">
                                Drag Here
                            </div>
                        </draggable>
                    </template>
                </div>
        </div>
        <br>
        <!-- Data Cards have 1:1 correspondence with BioIndex -->
        <h6><em>Data Card</em></h6>
        <div class="list-group-item">
            <h3>Data Table Name</h3>
            <template>
                <b>Input Types </b>
                <div class="bioindex-concept-pellet phenotype">
                    Phenotype
                </div>
                <div class="bioindex-concept-pellet gene">
                    Gene/Region
                </div>
            </template>
            <template>
                <b>Output Type </b>
                <div class="bioindex-concept-pellet none">
                    Variant
                </div>
            </template>
            <br>
            <div v-if="true">
                <template>
                    Fill Content here
                    <!-- <associations-table
                        v-if="dataCardData"
                        :associations="dataCardData"
                        :phenotypes="phenotypes[0]"
                        :per-page="10"
                    ></associations-table> -->
                </template>
            </div>
            <div v-else-if="!true">
                    <!-- TODO -->
                    <template>
                        <em>Drag in Inputs, or fill in Inputs with valid elements from context or collection</em>
                        <div>
                            <label for="card-input-phenotype">
                                Phenotype
                            </label>&nbsp;
                            <input id="card-input-phenotype"/>&nbsp;
                            <label for="card-input-gene">
                                Gene
                            </label>&nbsp;
                            <input id="card-input-gene"/>
                        </div>
                        <draggable
                            class="dragArea list-group"
                            :group="{ name:'cards', put: ['data', 'viz'] }"
                            :list="nullList"
                            @change="tap">
                            <div
                                slot="header"
                                class="btn-group list-group-item"
                                role="group"
                                aria-label="Basic example">
                                Drag Here
                            </div>
                        </draggable>
                    </template>
                </div>
        </div>

        <br>

        <h2>Dragging Prototype</h2>

        <div class="row">
            <div class="col-3">
            <h5>Draggable Data</h5>
            <draggable
                class="dragArea list-group"
                :list="list1"
                :group="{ name: 'data', pull: 'clone', put: false }"
                :clone="cloneDog"
                @change="log"
            >
                <div class="list-group-item" v-for="element in list1" :key="element.id">
                {{ element.name }}
                </div>
            </draggable>
            </div>

            <div class="col-3">
            <h5>Draggable Workspace</h5>
            <draggable
                class="dragArea list-group"
                :list="list3"
                :group="{ put: ['viz'] }"
                @change="log">
                <div class="list-group-item" v-for="element in list3" :key="element.id">
                    {{ element.name }}
                    <draggable
                        class="dragArea list-group"
                        :group="{ name:'cards', put: ['data'] }"
                        :list="nullList"
                        @change="tap">
                        <div slot="header"
                             class="btn-group list-group-item"
                             role="group"
                             aria-label="Basic example">
                             Drag Here
                        </div>
                    </draggable>
                    <!-- <div v-else>
                        {{nullList[0]}}
                    </div> -->
                </div>
                <div v-if="list3.length === 0"
                     slot="header"
                     class="btn-group list-group-item"
                     role="group"
                     aria-label="Basic example">
                     Drag Here
                </div>
            </draggable>
            </div>

            <div class="col-3">
            <h5>Draggable Viz</h5>
            <draggable
                class="dragArea list-group"
                :list="list2"
                :group="{ name: 'viz', pull: 'clone', put: false }"
                :clone="cloneDog"
                @change="log">
                <draggable class="list-group-item" v-for="element in list2" :key="element.id">
                {{ element.name }}
                </draggable>
            </draggable>
            </div>
        </div>

    </div>

</template>

<script>
import draggable from "vuedraggable";
import { query } from "../../utils/bioIndexUtils";
let idGlobal = 8;
export default {
  name: "custom-clone",
  display: "Custom Clone",
  order: 3,
  components: {
    draggable
  },
  data() {
    return {
    list2: [
        { name: "visualization 1", id: 1 },
        { name: "visualization 2", id: 2 },
        { name: "visualization 3", id: 3 },
        { name: "visualization 4", id: 4 }
      ],
     list1: [
        { name: "data 1", id: 1 },
        { name: "data 2", id: 2 },
        { name: "data 3", id: 3 },
        { name: "data 4", id: 4 }
      ],
      list3: [],
      nullList: [],
      dataCardData: null,
      visualizationCard: {},
    };
  },
  async created() {
    const dataCardData = await query('top-associations', 'slc30a8', { limit: null });
    this.dataCardData = dataCardData;
    // console.log()
  },
  computed: {
      phenotypes() {
          return Object.values(this.$store.state.bioPortal.phenotypeMap);
      }
  },
  methods: {
    removeAt(idx) {
      this.list2.splice(idx, 1);
    },
    log: function(evt) {
      window.console.log(evt);
    },
    tap: function(evt) {
      window.console.log('tapping',evt);
    },
    cloneDog({ id, name }) {
        const newId = idGlobal++;
        if (!this.nullList[newId]) {
            this.nullList[newId] = [];
        };
        return {
            id: newId,
            name: name
        };
    }
  }
};
</script>
<style scoped>


.bioindex-concept-pellet {
    cursor: pointer;
    display: inline-block;
    margin: 0px 10px 10px 0;
    padding: 2px 20px;
    -webkit-border-radius: 3px;
    -moz-border-radius: 3px;
    border-radius: 3px;
    font-size: 13px;
}

.bioindex-concept-pellet.phenotype {
    background-color: #a0d7ff;
    border: solid 1px #30b7f6;
}

.bioindex-concept-pellet.gene {
    background-color: #b7eab7;
    border: solid 1px #72ce49;
}

.bioindex-concept-pellet.antisense {
    background-color: #b7eab7;
    border: solid 1px #72ce49;
}


.bioindex-concept-pellet.none {
    background-color: #eee;
    border: solid 1px #ccc;
}

</style>
