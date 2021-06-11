<template>
    <div></div>
</template>
<script>
import Vue from "vue";
import { isEqual, isEmpty } from "lodash";

import LocusZoom from "locuszoom";
import { LZBioIndexSource, BASE_PANEL_OPTIONS } from "@/utils/lzUtils"
import idCounter from "@/utils/idCounter";

import { BaseAdapter } from "locuszoom/esm/data/adapters"
import { query } from "@/utils/bioIndexUtils";
import { marking, scoring } from 'gwas-credible-sets';
import {
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";

export default Vue.component("lz-computed-credset-panel", {
    props: {
        phenotype: {
            type: String,
            required: true,
        },
        credibleSetId: {
            type: String,
            required: true,
        },
        // for use with v-model
        value: {
            required: false
        },
        onLoad: Function,
        onResolve: Function,
        onError: Function,
    },
    data() {
        return {
            panelId: null,
        };
    },
    mounted() {
        this.updatePanel();
    },
    methods: {
        updatePanel() {
            // NOTE: result.data is bioindex-shaped data, NOT locuszoom-shaped data (which is good)
            const onLoad = !!!this.onLoad ? result => this.$emit('input', result) : this.onLoad;
            this.panelId = this.addPanelAndDataSource(
                new LZCredibleVariantsPanel(
                    this.phenotype,
                    this.credibleSetId,
                    onLoad,
                    this.onResolve,
                    this.onError,
                    this.value
                )
            );
        },
    },
    watch: {
        value(newVal, oldVal) {
            // the first clause prevents infinite loops
            // the second clause here prevents us from updating the panel twice when locuszoom pushes data to the page
            if (!isEqual(newVal, oldVal) && !isEmpty(oldVal)) {
                if (!!this.panelId) {
                    this.$parent.plot.removePanel(this.panelId);
                }
                this.updatePanel();
            }
        },
        phenotype(newPhenotype) {
            if (!!this.id) {
                this.$parent.plot.removePanel(this.id);
            }
            this.updatePanel();
        },
        credibleSetId(newPhenotype) {
            if (!!this.id) {
                this.$parent.plot.removePanel(this.id);
            }
            this.updatePanel();
        }
    },
});

export class LZComputedCredibleVariantsPanel {
    constructor(phenotype, initialData) {

        // panel_layout_type and datasource_type are not necessarily equal, and refer to different things
        // however they are also jointly necessary for LocusZoom
        this.panel_layout_type = 'annotation_credible_set';
        this.datasource_type = 'credset';

        // this is arbitrary, but we want to base it on the ID
        this.panel_id = idCounter.getUniqueId(this.panel_layout_type);
        this.datasource_namespace_symbol_for_panel = `${this.panel_id}_src`;

        this.translator = associations => associations.map(association => ({
            id: association.varId,
            chr: association.chromosome,
            start: association.position,
            end: association.position,
            position: association.position,
            pValue: association.pValue,
            // posteriorProbability => posterior_prob; it's refactored to the name compatible with the other credible set visualization supported by LocusZoom
            posterior_prob: association.posteriorProbability,
            log_pvalue: ((-1) * Math.log10(association.pValue)).toPrecision(4),
            variant: association.varId,
            ref_allele: association.reference,
            state: 'ssss' // TODO: what should this be?
        }));

        // the requirement for this field is required for how we're implementing the `bioIndexToLZReader` getter (below)
        this.phenotype = phenotype;
        this.initialData = initialData;

        // LocusZoom Layout configuration options
        // See the LocusZoom docs for how this works
        // https://github.com/statgen/locuszoom/wiki/Data-Layer#data-layer-layout
        // If there's not a lot in here it's because we're overriding defaults
        this.locusZoomPanelOptions = {
            ...BASE_PANEL_OPTIONS,
            title: { text: 'SNPs in 95% credible set', style: { 'font-size': '18px' }, x: -0.5 },
            y_index: 2,
            margin: { bottom: 28  },
            axes: {
                x: {
                    label: 'Chromosome {{chr}} (Mb)',
                    label_offset: 26,
                    tick_format: 'region',
                    extent: 'state',
                },
                y1: {
                    label: 'Posterior Probability',
                    label_offset: 28,
                }
            },
            data_layers: [

                {
                    "namespace": this.datasource_namespace_symbol_for_panel,
                    "id": this.panel_id,
                    "type": "scatter",

                    // id_field is necessary for the scatter visualization to work (used by the d3 code generating the viz)
                    "id_field": `${this.datasource_namespace_symbol_for_panel}:id`,
                    "fields": [
                        `${this.datasource_namespace_symbol_for_panel}:id`,
                        `${this.datasource_namespace_symbol_for_panel}:position`,
                        `${this.datasource_namespace_symbol_for_panel}:posterior_prob`
                    ],
                    "x_axis": {
                        "field": `${this.datasource_namespace_symbol_for_panel}:position`
                    },
                    // this overrides the log-pvalue and recombinant scales of the default associations plot
                    // since y-axes are partitioned into either axis: 1 -> y1 and axis: 2 -> y2, by overriding y_axis
                    // we've removed axis y2 from the associations plot (as we're only defining y1)
                    "y_axis": {
                        "axis": 1,
                        "field": `${this.datasource_namespace_symbol_for_panel}:posterior_prob`,
                        // normalizing the scale to probability space
                        "floor": 0,
                        "ceiling": 1
                    }
                },
            ],
        },
        this.bioIndexToLZReader = new _LZComputedCredibleSetSource({
            phenotype: this.phenotype,
            translator: this.translator,
            initialData: this.initialData,
        });

        this.sources = [[this.datasource_namespace_symbol_for_panel, this.bioIndexToLZReader]]

    }
}

class _LZComputedCredibleSetSource extends BaseAdapter {
    constructor(params) {
        super(params)
    }
    parseInit(params) {
        const { phenotype, translator, initialData } = params;
        this.translator = translator;
        this.initialData = initialData;
        this.phenotype = phenotype;
        this.params = Object.assign(
            { threshold: 0.95, significance_threshold: 7.301 },
            params
        );
    };
    fetchRequest(state, chain, fields) {
        const self = this;
        return new Promise((resolve) => {
            if (!!self.initialData) {
                resolve(self.translator(self.initialData));
                self.initialData = null;
            } else {
                const alertID = postAlertNotice(`Loading computed credset; please wait ...`);
                // decide whether or not to use a precomputed credset
                const phenoRegionQuery = `${self.phenotype},${state.chr}:${state.start}-${state.end}`;
                query('associations', phenoRegionQuery).then(results => {
                    // method documentation
                    // https://statgen.github.io/gwas-credible-sets/method/locuszoom-credible-sets.pdf
                    const translatedResults = self.translator(results);
                    const nlogpvals = translatedResults.map(association => association.log_pvalue);

                    if (!nlogpvals.some((val) => val >= self.params.significance_threshold)) {
                        // If NO points have evidence of significance, define the credible set to be empty
                        //  (rather than make a credible set that we don't think is meaningful)
                        return resolve([]);
                    }

                    const credset_data = [];
                    try {
                        const scores = scoring.bayesFactors(nlogpvals);
                        const posteriorProbabilities = scoring.normalizeProbabilities(scores);

                        // Use scores to mark the credible set in various ways (depending on your visualization preferences,
                        //   some of these may not be needed)
                        const credibleSet = marking.findCredibleSet(posteriorProbabilities, self.params.threshold);
                        const credSetScaled = marking.rescaleCredibleSet(credibleSet);
                        const credSetBool = marking.markBoolean(credibleSet);

                        // Annotate each response record based on credible set membership
                        for (let i = 0; i < translatedResults.length; i++) {
                            // TODO: filter credsets here
                            if (credSetBool[i]) {
                                credset_data.push({
                                    ...translatedResults[i],
                                    posterior_prob: posteriorProbabilities[i],
                                    contrib_fraction: credSetScaled[i],
                                    is_member: credSetBool[i],
                                });
                            }
                        }

                    } catch (e) {
                        // If the calculation cannot be completed, return the data without annotation fields
                        console.error(e);
                    }
                    resolve(credset_data);
                }).finally(() => closeAlert(alertID))
            }
        });
    };
}


export function makeCredibleVariantsPanel(phenotype, credibleSetId, onLoad, onResolve, onError, initialData) {

    // get a base layout, give it a title and add some fields under the 'assoc' namespace
    const layout = new LzLayout('association', {            
            ...BASE_PANEL_OPTIONS,
            y_index: 2,
            title: { text: 'SNPs in 95% credible set', style: { 'font-size': '18px' }, x: 5 },
            axes: {
                y1: {
                    label: 'Posterior Probability'
                }
            }
    })
    
    // create new data layer
    // Data Layers are what actually populate the layout with stuff
    // They tell you how your data is interpreted and where it's going
    // First: establish the namespace
    // Second: declare the fields with respect to the namespace
    // Third: create axes and register the fields inside of them
    // Fourth: write down the type of visualization using the data
    // Fifth: add stylings, and the data layer ID
    layout.addRule('data_layers', {
            "namespace": "assoc",
            "id": "credset_layout",
            "type": "scatter",
            "tag": "credsets",
            // id_field is necessary for the scatter visualization to work (used by the d3 code generating the viz)
            "id_field": `assoc:id`,

            "x_axis": {
                "field": `assoc:position`
            },
            "fields": [],
            // this overrides the log-pvalue and recombinant scales of the default associations plot
            // since y-axes are partitioned into either axis: 1 -> y1 and axis: 2 -> y2, by overriding y_axis
            // we've removed axis y2 from the associations plot (as we're only defining y1)
            "y_axis": {
                "axis": 1,
                "field": `assoc:posterior_prob`,
                // normalizing the scale to probability space
                "floor": 0,
                "ceiling": 1
            }
    });
    layout.addFields('$..data_layers[?(@.tag === "credsets")]', 'assoc', 
        ['pValue', 'position', 'id', 'posterior_prob']
    );


    // TODO: eliminate the translator function with field renaming!
    const translator = (associations) => {
        return associations.map(association => ({
            id: association.varId,
            position: association.position,
            pValue: association.pValue,
            // posteriorProbability => posterior_prob; it's refactored to the name compatible with the other credible set visualization supported by LocusZoom
            posterior_prob: association.posteriorProbability,
            contrib_fraction: 0.5,
            is_member: true,
            log_pvalue: ((-1) * Math.log10(association.pValue)).toPrecision(4),
            variant: association.varId,
            ref_allele: association.varId,
        }));
    };

    const datasource = new LzDataSource(_LZComputedCredibleSetSource)
        .withParams(
            bioIndexParams(
                phenotype, 
                translator, 
                initialData
            )
        );

    const associations_panel = new LzPanelClass(layout, datasource).initialize('assoc'); // 'assoc' binds both the datasource presented and the layout given uniquely
    return associations_panel.unwrap;
}


</script>
