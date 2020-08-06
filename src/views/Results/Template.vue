<template>
    <div>
        <h2>Card Prototype</h2>

        <!-- Visualization/Tool Cards [VTC] Take Arbitrary BioIndex Data and give arbitrary objects (BioIndex or otherwise) -->
        <!-- They can be "fulfilled" by a Data Card [DC] in two possible ways:
                * Representation. If a DC and a VTC share an input type and an output type (such as when they would use the same BioIndex call), the VTC takes the *input* of the DC as the input of the VTC
                    * e.g. a PheWAS plot (VTC) represent a PheWAS table (DC)
                * Composition. If the output type of a DC acts as the input type of a VTC, the VTC takes the *data* of the DC and uses it???
                    * (TODO: e.g. a PheWAS table [or a PheWAS plot] can compose with a GWAS plot?)
            A Visualization/Tool Card starts out unfulfilled. If you try to fulfill a VTC with a Data Card which doesn't share an input nor compose, it is left unfulfilled.
            (It is maybe possible for a VTC to be fulfilled without Data Cards?)
         -->
        <h6><em>Visualization/Tool Card</em></h6>
        <locuszoom-phewas-plot-card></locuszoom-phewas-plot-card>

        <br>

        <!-- Data Cards have 1:1 correspondence with BioIndex -->
        <h6><em>Data Card</em></h6>
        <phewas-associations-card></phewas-associations-card>

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

            <div class="col-6">
                <h5>Draggable Workspace</h5>
                <draggable
                    class="dragArea list-group"
                    :list="list3"
                    :group="{
                        name: 'dash',
                        put: ['data', 'viz'] // TODO: viz only? with data too?
                    }"
                    @change="log">

                    <div class="list-group-item" v-for="element in list3" :key="element.id">

                        <!-- TODO: Element dispatch code goes here -->
                        <div v-if="element.name.split(';')[0] === 'locuszoom-phewas-plot'">
                            <locuszoom-phewas-plot-card></locuszoom-phewas-plot-card>
                        </div>

                        <div v-if="element.name.split(';')[0] === 'phewas-associations'">
                            <phewas-associations-card
                                v-if="element.name.split(';')[1] === 'varId' && !!element.name.split(';')[2]"
                                :varId="element.name.split(';')[2]"
                            ></phewas-associations-card>
                            <phewas-associations-card
                                v-else
                            ></phewas-associations-card>
                        </div>

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

import PheWASData from "./nucards/PheWASData";
import PheWASViz from "./nucards/PheWASViz";


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
        { name: "visualization 4", id: 4 },
        { name: "locuszoom-phewas-plot", id: 4 },
      ],
     list1: [
        { name: "data 1", id: 1 },
        { name: "data 2", id: 2 },
        { name: "data 3", id: 3 },
        { name: "data 4", id: 4 },
        { name: 'phewas-associations;varId;2:27730940:T:C' , tag: 'hello', id: 4 }
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
