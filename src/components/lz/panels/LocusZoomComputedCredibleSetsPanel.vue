<template>
    <div></div>
</template>
<script>
import Vue from "vue";
import { isEqual, isEmpty } from "lodash";
import idCounter from "@/utils/idCounter";
import LocusZoom from "locuszoom";

import { BASE_PANEL_OPTIONS } from "@/utils/lzUtils"

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
            const onLoad = !!!this.onLoad ? result => this.$emit('input', result) : this.onLoad;
            this.panelId = this.addPanels(
                makeComputedCredibleVariantsPanel(
                    this.phenotype,
                    this.value
                )
            );
        },
    },
    watch: {
        value(newVal, oldVal) {
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

        this.panel_layout_type = 'annotation_credible_set';
        this.datasource_type = 'credset';

        this.panel_id = idCounter.getUniqueId(this.panel_layout_type);
        this.datasource_namespace_symbol_for_panel = `${this.panel_id}_src`;

        this.translator = associations => associations.map(association => ({
            id: association.varId,
            chr: association.chromosome,
            start: association.position,
            end: association.position,
            position: association.position,
            pValue: association.pValue,
            posterior_prob: association.posteriorProbability,
            log_pvalue: ((-1) * Math.log10(association.pValue)).toPrecision(4),
            variant: association.varId,
            ref_allele: association.reference,
            state: 'ssss'
        }));

        this.phenotype = phenotype;
        this.initialData = initialData;

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

                    "id_field": `${this.datasource_namespace_symbol_for_panel}:id`,
                    "fields": [
                        `${this.datasource_namespace_symbol_for_panel}:id`,
                        `${this.datasource_namespace_symbol_for_panel}:position`,
                        `${this.datasource_namespace_symbol_for_panel}:posterior_prob`
                    ],
                    "x_axis": {
                        "field": `${this.datasource_namespace_symbol_for_panel}:position`
                    },
                    "y_axis": {
                        "axis": 1,
                        "field": `${this.datasource_namespace_symbol_for_panel}:posterior_prob`,
                        "floor": 0,
                        "ceiling": 1
                    }
                },
            ],
        },

        this.layouts = [
            LocusZoom.Layouts.get("panel", this.panel_layout_type, this.locusZoomPanelOptions)
        ]

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
                const phenoRegionQuery = `${self.phenotype},${state.chr}:${state.start}-${state.end}`;
                query('associations', phenoRegionQuery).then(results => {
                    const translatedResults = self.translator(results);
                    const nlogpvals = translatedResults.map(association => association.log_pvalue);

                    if (!nlogpvals.some((val) => val >= self.params.significance_threshold)) {
                        return resolve([]);
                    }

                    const credset_data = [];
                    try {
                        const scores = scoring.bayesFactors(nlogpvals);
                        const posteriorProbabilities = scoring.normalizeProbabilities(scores);

                        const credibleSet = marking.findCredibleSet(posteriorProbabilities, self.params.threshold);
                        const credSetScaled = marking.rescaleCredibleSet(credibleSet);
                        const credSetBool = marking.markBoolean(credibleSet);

                        for (let i = 0; i < translatedResults.length; i++) {
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
                        console.error(e);
                    }
                    resolve(credset_data);
                }).finally(() => closeAlert(alertID))
            }
        });
    };
}





    







</script>
