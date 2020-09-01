import LocusZoom from "locuszoom";
import {BaseAdapter} from "locuszoom/esm/data/adapters"

import { query } from "@/utils/bioIndexUtils";
import idCounter from "@/utils/idCounter"
import { rgb } from "d3";
import _ from "lodash"

import { marking, scoring } from 'gwas-credible-sets';

import {
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";

const BASE_PANEL_OPTIONS = {
    height: 240,
}
export class LZAssociationsPanel {
    constructor(phenotype, { finishHandler, resolveHandler, errHandler }) {

        // panel_layout_type and datasource_type are not necessarily equal, and refer to different things
        // however they are also jointly necessary for LocusZoom –
        this.panel_layout_type = 'association';
        this.datasource_type = 'assoc';

        // this is arbitrary, but we want to base it on the ID
        this.panel_id = idCounter.getUniqueId(this.panel_layout_type);
        this.datasource_namespace_symbol_for_panel = `${this.panel_id}_src`;

        this.index = 'associations'
        this.queryStringMaker = (chr, start, end) => `${phenotype},${chr}:${start}-${end}`
        this.translator = associations => associations.map(association => ({
            id: association.varId,
            chr: association.chromosome,
            start: association.position,
            end: association.position,
            position: association.position,
            pvalue: association.pValue,
            log_pvalue: ((-1) * Math.log10(association.pValue)), // .toPrecision(4),
            variant: association.varId,
            ref_allele: association.varId,
        }));


        // LocusZoom Layout configuration options
        // See the LocusZoom docs for how this works
        // https://github.com/statgen/locuszoom/wiki/Data-Layer#data-layer-layout
        // If there's not a lot in here it's because we're overriding defaults
        this.locusZoomPanelOptions = {
            ...BASE_PANEL_OPTIONS,
            id: this.panel_id,
            y_index: 0,
            axes: {
                y1: {
                    label: 'log10 log_pvalue'
                }
            },
        };
        this.handlers = {
            finishHandler,
            resolveHandler,
            errHandler
        };

    }

    get bioIndexToLZReader() {
        const reader = new _LZBioIndexSource({
            index: this.index,
            queryStringMaker: this.queryStringMaker,
            translator: this.translator,
            finishHandler: this.handlers.finishHandler,
            resolveHandler: this.handlers.resolveHandler,
            errHandler: this.handlers.errHandler,
        });
        return reader;
    }

    get panel() {
        return {
            id: this.panel_id,
            panelLayoutType: this.panel_layout_type,
            takingDataSourceName: this.datasource_namespace_symbol_for_panel,
            forDataSourceType: this.datasource_type,
            locusZoomPanelOptions: this.locusZoomPanelOptions,
        }
    }

    get source() {
        return {
            isDataSourceType: this.datasource_type,
            givingDataSourceName: this.datasource_namespace_symbol_for_panel,
            withDataSourceReader: this.bioIndexToLZReader,
        }
    }

    get dataLayers() {
        // I had to find these data_layers out from doing LocusZoom.Layouts.get('panel', 'intervals') <= LocusZoom.Layouts.get('panel', this.panel_layout_type)

        // need to find a better way of editing data layers that doesn't require:
        // - having to call all of them, because overriding one overrides them all
        // - ditto with extending fields
        // the refactoring will probably have to occur conceptually, didn't think i'd have to be doing this
        return [
            // this works
            LocusZoom.Layouts.merge(
                {
                    y_axis: {
                        axis: 1,
                        field: '{{namespace[assoc]}}log_pvalue|log10', // Bad field name. The api actually sends back -log10, so this really means "log10( -log10 (p))"
                        // floor: 0,
                        upper_buffer: 0.10,
                        // min_extent: [0, 10],
                    }
                },
                LocusZoom.Layouts.get('data_layer', 'association_pvalues', { unnamespaced: true }),
            ),
            LocusZoom.Layouts.get('data_layer', 'recomb_rate', { unnamespaced: true }),
            LocusZoom.Layouts.get('data_layer', 'significance', { unnamespaced: true })
        ]
    }

}

export class LZAnnotationIntervalsPanel {
    constructor(annotation, method, { finishHandler, resolveHandler, errHandler }, colorScheme=id=>'128,128,128', scoring) {

        // panel_layout_type and datasource_type are not necessarily equal, and refer to different things
        // however they are also jointly necessary for LocusZoom –
        this.panel_layout_type = 'intervals';
        this.datasource_type = 'intervals';

        // this is arbitrary, but we want to base it on the ID
        this.panel_id = idCounter.getUniqueId(this.panel_layout_type);
        this.datasource_namespace_symbol_for_panel = `${this.panel_id}_src`;

        this.index = 'annotated-regions';
        this.queryStringMaker = (chr, start, end) => `${annotation},${chr}:${start}-${end}`
        this.translator = function (intervals) {
            const tissueIntervals = !!intervals ? intervals
                // .filter(interval => {
                //     let t = interval.tissueId || "NA";
                //     let m = interval.method || "NA";
                //     let key = `${t}_${m}_${interval.annotation}`;
                //     return typeof scoring[key] !== 'undefined';
                // })
                .map(interval => {
                    const { r, g, b } = rgb(colorScheme(interval.tissue));
                    let t = interval.tissueId || "NA";
                    let m = interval.method || "NA";
                    let key = `${t}_${m}_${interval.annotation}`;
                    return !!scoring[key] ? {
                        name: interval.tissue || interval.tissueId,
                        // some data (not displayed by default)
                        // region information
                        chr: interval.chromosome,
                        start: interval.start,
                        end: interval.end,
                        pvalue: scoring[key].minP,
                        fold: scoring[key].maxFold,
                        state_id: `${interval.tissueId}`,
                        // "state_name" is what annotations are actually grouped by when you split the tracks. it should be visible in the legend
                        state_name: `${interval.tissue}`,
                        // a string-encoded list of RGB coords, e.g. '255,0,128'
                        itemRgb: [r,g,b].join(), // TODO: color scheme
                    } : null;
            // filter nulls (which represent elements we can't score)
            }).filter(el => !!el) : [];
            return tissueIntervals;
        }

        // LocusZoom Layout configuration options
        // See the LocusZoom docs for how this works
        // https://github.com/statgen/locuszoom/wiki/Data-Layer#data-layer-layout
        // If there's not a lot in here it's because we're overriding defaults.
        this.locusZoomPanelOptions = {
            ...BASE_PANEL_OPTIONS,
            y_index: 1,
            title: {
                text: `${annotation} ${method ? method : ''}`
            },
            proportional_height: 0.2,
            fields: [
                `${this.datasource_namespace_symbol_for_panel}:pvalue`,
                `${this.datasource_namespace_symbol_for_panel}:fold`,
                ...LocusZoom.Layouts.get('data_layer', 'intervals', { namespace: this.datasource_namespace_symbol_for_panel }).fields
            ]
        };
        this.handlers = { finishHandler, resolveHandler, errHandler }
    }

    get bioIndexToLZReader() {
        const reader = new _LZBioIndexSource({
            index: this.index,
            queryStringMaker: this.queryStringMaker,
            translator: this.translator,
            finishHandler: this.handlers.finishHandler,
            resolveHandler: this.handlers.resolveHandler,
            errHandler: this.handlers.errHandler,
        });
        return reader;
    }

    get panel() {
        return {
            id: this.panel_id,
            panelLayoutType: this.panel_layout_type,
            takingDataSourceName: this.datasource_namespace_symbol_for_panel,
            forDataSourceType: this.datasource_type,
            locusZoomPanelOptions: this.locusZoomPanelOptions,
        }
    }

    get source() {
        return {
            isDataSourceType: this.datasource_type,
            givingDataSourceName: this.datasource_namespace_symbol_for_panel,
            withDataSourceReader: this.bioIndexToLZReader,
        }
    }

    get dataLayers() {
        // I had to find these data_layers out from doing LocusZoom.Layouts.get('panel', 'intervals') <= LocusZoom.Layouts.get('panel', this.panel_layout_type)

        // need to find a better way of editing data layers that doesn't require:
        // - having to call all of them, because overriding one overrides them all
        // - ditto with extending fields
        // the refactoring will probably have to occur conceptually, didn't think i'd have to be doing this
        return [
            // this works
            LocusZoom.Layouts.merge(
                {
                    fields: [
                        '{{namespace[intervals]}}pvalue',
                        '{{namespace[intervals]}}fold',
                        ...LocusZoom.Layouts.get('data_layer', 'intervals', { unnamespaced: true }).fields
                    ]
                },
                LocusZoom.Layouts.get('data_layer', 'intervals', { unnamespaced: true })
            ),
        ]
    }

}
export class LZCredibleVariantsPanel {
    constructor(phenotype, credibleSetId, { finishHandler, resolveHandler, errHandler }) {

        // panel_layout_type and datasource_type are not necessarily equal, and refer to different things
        // however they are also jointly necessary for LocusZoom –
        this.panel_layout_type = 'association';
        this.datasource_type = 'cred_vars';

        // this is arbitrary, but we want to base it on the ID
        this.panel_id = idCounter.getUniqueId(this.panel_layout_type);
        this.datasource_namespace_symbol_for_panel = `${this.panel_id}_src`;

        this.index = 'credible-variants';
        this.queryStringMaker = (chr, start, end) => `${phenotype},${credibleSetId}`
        this.translator = associations => associations.map(association => ({
            id: association.varId,
            chr: association.chromosome,
            start: association.position,
            end: association.position,
            position: association.position,
            pvalue: association.pValue,
            // posteriorProbability => posterior_prob; it's refactored to the name compatible with the other credible set visualization supported by LocusZoom
            posterior_prob: association.posteriorProbability,
            log_pvalue: ((-1) * Math.log10(association.pValue)).toPrecision(4),
            variant: association.varId,
            ref_allele: association.varId,
        }));

        // the requirement for this field is required for how we're implementing the `bioIndexToLZReader` getter (below)
        this.phenotype = phenotype;

        // LocusZoom Layout configuration options
        // See the LocusZoom docs for how this works
        // https://github.com/statgen/locuszoom/wiki/Data-Layer#data-layer-layout
        // If there's not a lot in here it's because we're overriding defaults
        this.locusZoomPanelOptions = {
            ...BASE_PANEL_OPTIONS,
            y_index: 1,
            title: {
                text: `${credibleSetId}`
            },
            axes: {
                y1: {
                    label: 'Posterior Probability'
                }
            },
            // Data Layers are what actually populate the layout with stuff
            // They tell you how your data is interpreted and where it's going
            // First: establish the namespace
            // Second: declare the fields with respect to the namespace
            // Third: create axes and register the fields inside of them
            // Fourth: write down the type of visualization using the data
            // Fifth: add stylings, and the data layer ID
            data_layers: [
                {
                    "namespace": {
                        // narrowing down data from datasources of <datasource_type> to <datasource_namespace_symbol>
                        [this.datasource_type]: this.datasource_namespace_symbol_for_panel
                    },
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
                }
        ]
        }
        this.handlers = { finishHandler, resolveHandler, errHandler };

    }

    get bioIndexToLZReader() {
        const reader = new _LZBioIndexSource({
            index: this.index,
            queryStringMaker: this.queryStringMaker,
            translator: this.translator,
            finishHandler: this.handlers.finishHandler,
            resolveHandler: this.handlers.resolveHandler,
            errHandler: this.handlers.errHandler,
        });
        return reader;
    }

    get panel() {
        return {
            id: this.panel_id,
            panelLayoutType: this.panel_layout_type,
            takingDataSourceName: this.datasource_namespace_symbol_for_panel,
            forDataSourceType: this.datasource_type,
            locusZoomPanelOptions: this.locusZoomPanelOptions,
        }
    }

    get source() {
        return {
            isDataSourceType: this.datasource_type,
            givingDataSourceName: this.datasource_namespace_symbol_for_panel,
            withDataSourceReader: this.bioIndexToLZReader,
        }
    }
}

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
            pvalue: association.pValue,
            // posteriorProbability => posterior_prob; it's refactored to the name compatible with the other credible set visualization supported by LocusZoom
            posterior_prob: association.posteriorProbability,
            log_pvalue: ((-1) * Math.log10(association.pValue)).toPrecision(4),
            variant: association.varId,
            ref_allele: association.varId,
            state: 'ssss'
        }));

        // the requirement for this field is required for how we're implementing the `bioIndexToLZReader` getter (below)
        this.phenotype = phenotype;
        this.initialData = initialData;

        // LocusZoom Layout configuration options
        // See the LocusZoom docs for how this works
        // https://github.com/statgen/locuszoom/wiki/Data-Layer#data-layer-layout
        // If there's not a lot in here it's because we're overriding defaults
        this.locusZoomPanelOptions = {
            title: { text: 'SNPs in 95% credible set', style: { 'font-size': '18px' } },
            width: 800,
            height: 240,
            proportional_width: 1,
            margin: { top: 25, bottom: 32  },
            axes: {
                x: {
                    label: 'Chromosome {{chr}} (Mb)',
                    label_offset: 32,
                    tick_format: 'region',
                    extent: 'state',
                },
                y1: {
                    label: 'Posterior Probability',
                    label_offset: 28,
                }
            },
            data_layers: [
                LocusZoom.Layouts.get('data_layer', 'annotation_credible_set', {
                    namespace: {
                        assoc: this.datasource_namespace_symbol_for_panel,
                        credset: this.datasource_namespace_symbol_for_panel
                    },
                }),
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
        }
    }

    get bioIndexToLZReader() {
        return new _LZComputedCredibleSetSource({
            phenotype: this.phenotype,
            translator: this.translator,
            initialData: this.initialData,
        });
    }

    get panel() {
        return {
            id: this.panel_id,
            panelLayoutType: this.panel_layout_type,
            takingDataSourceName: this.datasource_namespace_symbol_for_panel,
            forDataSourceType: this.datasource_type,
            locusZoomPanelOptions: this.locusZoomPanelOptions,
        }
    }

    get source() {
        return {
            isDataSourceType: this.datasource_type,
            givingDataSourceName: this.datasource_namespace_symbol_for_panel,
            withDataSourceReader: this.bioIndexToLZReader,
        }
    }
}

export class LZPhewasPanel {
    constructor(varId, phenotypeMap, { finishHandler, resolveHandler, errHandler }) {

        // panel_layout_type and datasource_type are not necessarily equal, and refer to different things
        // however they are also jointly necessary for LocusZoom –
        this.panel_layout_type = 'phewas';
        this.datasource_type = 'phewas';

        // this is arbitrary, but we want to base it on the ID
        this.panel_id = idCounter.getUniqueId(this.panel_layout_type);
        this.datasource_namespace_symbol_for_panel = `${this.panel_id}_src`;

        this.index = 'phewas-associations';
        this.queryStringMaker = (chr, start, end) => `${varId}`
        this.translator = associations => {
            const portalAssociations = associations.filter(a => {
                return !!phenotypeMap[a.phenotype];
            });
            // transform from bio index to locuszoom
            const phewas = portalAssociations.map(a => {
                const phenotypeInfo = phenotypeMap[a.phenotype];
                return {
                    id: phenotypeInfo.name,
                    log_pvalue: -Math.log10(a.pValue),
                    trait_group: phenotypeInfo.group,
                    trait_label: phenotypeInfo.description
                };
            });
            return phewas;
        }

        // LocusZoom Layout configuration options
        // See the LocusZoom docs for how this works
        // https://github.com/statgen/locuszoom/wiki/Data-Layer#data-layer-layout
        // If there's not a lot in here it's because we're not overriding defaults
        this.locusZoomPanelOptions = {
            // ...BASE_PANEL_OPTIONS,
        };
        this.handlers = { finishHandler, resolveHandler, errHandler };

    }

    get bioIndexToLZReader() {
        return new _LZBioIndexSource({
            index: this.index,
            queryStringMaker: this.queryStringMaker,
            translator: this.translator,
            finishHandler: this.handlers.finishHandler,
            resolveHandler: this.handlers.resolveHandler,
            errHandler: this.handlers.errHandler,
        });
    }

    get panel() {
        return {
            id: this.panel_id,
            panelLayoutType: this.panel_layout_type,
            takingDataSourceName: this.datasource_namespace_symbol_for_panel,
            forDataSourceType: this.datasource_type,
            locusZoomPanelOptions: this.locusZoomPanelOptions,
        }
    }

    get source() {
        return {
            isDataSourceType: this.datasource_type,
            givingDataSourceName: this.datasource_namespace_symbol_for_panel,
            withDataSourceReader: this.bioIndexToLZReader,
        }
    }
}
class _LZBioIndexSource extends BaseAdapter {
    constructor(params) {
        super(params)
    }
    parseInit(params) {
        const { index, queryStringMaker, translator } = params;
        this.params = params;
        this.queryStringMaker = queryStringMaker;
        this.index = index;
        this.translator = translator;
    };
    getCacheKey(state /*, chain, fields*/) {
        // In generic form, Tabix queries are based on chr, start, and end. The cache is thus controlled by the query,
        //  not the URL
        return [state.chr, state.start, state.end].join('_');
    }
    fetchRequest(state, chain, fields) {
        const self = this;
        const alertID = postAlertNotice(`Loading ${self.index}; please wait ...`);
        return new Promise((resolve, reject) => {
            if (!!self.initialData) {
                resolve(self.translator(self.initialData));
                self.initialData = null;
            } else {
                query(self.index, self.queryStringMaker(state.chr, state.start, state.end), {
                    finishHandler: self.params.finishHandler,
                    resolveHandler: self.params.resolveHandler,
                    errHandler: self.params.errHandler,
                })
                .then(async resultData => {
                    resolve(self.translator(resultData));
                })
                .catch(async error => {
                    postAlertError(error.detail);
                    reject(new Error(error));
                })
            }
        }).finally(closeAlert(alertID));
    };
}


class _LZComputedCredibleSetSource extends BaseAdapter {
    constructor(params) {
        super(params)
    }
    parseInit(params) {
        const { phenotype, translator, initialData } = params;
        this.params = params;
        this.translator = translator;
        this.initialData = initialData;
        this.phenotype = phenotype;
    };
    fetchRequest(state, chain, fields) {
        const self = this;
        const alertID = postAlertNotice(`Loading ${this.index}; please wait ...`);
        return new Promise((resolve) => {
            if (!!self.initialData) {
                resolve(self.translator(self.initialData));
                self.initialData = null;
            } else {
                // decide whether or not to use a precomputed credset
                const phenoRegionQuery = `${self.phenotype},${state.chr}:${state.start}-${state.end}`;
                // TODO: CAN THIS QUERY CALL BE ELIMINATED WITH CHAINING TO GET DATA ALREADY LOADED BY ANOTHER DATA SOURCE?
                query('associations', phenoRegionQuery).then(async results => {
                    // method documentation 
                    // https://statgen.github.io/gwas-credible-sets/method/locuszoom-credible-sets.pdf

                    const translatedResults = self.translator(results);
                    const nlogpvals = translatedResults.map(association => association.log_pvalue);

                    const credset_data = [];
                    try {
                        const scores = scoring.bayesFactors(nlogpvals);
                        const posteriorProbabilities = scoring.normalizeProbabilities(scores);
                        const credibleSet = marking.findCredibleSet(scores, 0.95);

                        // Use scores to mark the credible set in various ways (depending on your visualization preferences,
                        //   some of these may not be needed)
                        
                        const credSetScaled = marking.rescaleCredibleSet(credibleSet);
                        const credSetBool = marking.markBoolean(credibleSet);

                        // Annotate each response record based on credible set membership
                        for (let i = 0; i < translatedResults.length; i++) {
                            console.log(nlogpvals[i], scores[i], posteriorProbabilities[i], credSetScaled[i], credSetBool[i])
                            credset_data.push({
                                ...translatedResults[i],
                                posterior_prob: posteriorProbabilities[i],
                                contrib_fraction: credSetScaled[i],
                                is_member: credSetBool[i],
                            });
                        }
                    } catch (e) {
                        // If the calculation cannot be completed, return the data without annotation fields
                        console.error(e);
                    }
                    resolve(credset_data);
                })
            }
        }).finally(closeAlert(alertID));
    };
}