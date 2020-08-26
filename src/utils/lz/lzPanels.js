import LocusZoom from "locuszoom";

import { query } from "@/utils/bioIndexUtils";
import idCounter from "@/utils/idCounter"
import { rgb } from "d3";

import { marking, scoring } from 'gwas-credible-sets';

import {
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";

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
            log_pvalue: ((-1) * Math.log10(association.pValue)).toPrecision(4),
            variant: association.varId,
            ref_allele: association.varId,
        }));

        // LocusZoom Layout configuration options
        // See the LocusZoom docs for how this works
        // https://github.com/statgen/locuszoom/wiki/Data-Layer#data-layer-layout
        // If there's not a lot in here it's because we're overriding defaults
        this.locusZoomLayoutOptions = {
            "id": this.panel_id,
            y_index: -9001,
        };
        this.handlers = {
            finishHandler,
            resolveHandler,
            errHandler
        };

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
            locusZoomLayoutOptions: this.locusZoomLayoutOptions,
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

export class LZAnnotationIntervalsPanel {
    constructor(annotation, method, { finishHandler, resolveHandler, errHandler }, colorScheme = id => '128,128,128') {

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
                .map(interval => {
                    const { r, g, b } = rgb(colorScheme(interval.tissue))
                    return {
                        name: interval.tissue || interval.tissueId,
                        chr: interval.chromosome,
                        start: interval.start,
                        end: interval.end,
                        state_id: `${interval.tissueId}`,
                        // "state_name" is what annotations are actually grouped by when you split the tracks. it should be visible in the legend
                        state_name: `${interval.tissue}`,
                        // a string-encoded list of RGB coords, e.g. '255,0,128'
                        itemRgb: [r, g, b].join(), // TODO: color scheme
                    };
                }) : [];
            return tissueIntervals;
        }

        // LocusZoom Layout configuration options
        // See the LocusZoom docs for how this works
        // https://github.com/statgen/locuszoom/wiki/Data-Layer#data-layer-layout
        // If there's not a lot in here it's because we're overriding defaults
        this.locusZoomLayoutOptions = {
            title: {
                text: `${annotation} ${method ? method : ''}`
            }
        };
        this.handlers = { finishHandler, resolveHandler, errHandler }
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
            locusZoomLayoutOptions: this.locusZoomLayoutOptions,
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
        this.locusZoomLayoutOptions = {
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
            data_layers: [{
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
            }]
        }
        this.handlers = { finishHandler, resolveHandler, errHandler };

    }

    get bioIndexToLZReader() {
        return new _LZCredibleSetSource({
            phenotype: this.phenotype,
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
            locusZoomLayoutOptions: this.locusZoomLayoutOptions,
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
        // If there's not a lot in here it's because we're overriding defaults
        this.locusZoomLayoutOptions = {};
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
            locusZoomLayoutOptions: this.locusZoomLayoutOptions,
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

// TODO: refactor to use BaseAdapter?
// NOTE: Ideally we'd use an interface that both _LZBioIndexSource and _LZCredibleSetSource satisfy
// (because otherwise we'd be using concrete inheritance if we were to minimize duplication here, or otherwise enforce structure across duplications)
const _LZBioIndexSource = LocusZoom.Data.Source.extend(function (init) {
    this.parseInit(init);
});
_LZBioIndexSource.prototype.parseInit = function (params) {
    const { index, queryStringMaker, translator, finishHandler, resolveHandler, errHandler } = params;
    this.params = params;
    this.queryStringMaker = queryStringMaker;
    this.index = index;
    this.translator = translator;
};
_LZBioIndexSource.prototype.getRequest = function (state, chain, fields) {
    const self = this;
    return new Promise((resolve, reject) => {
        const alertID = postAlertNotice(`Loading ${self.index}; please wait ...`);
        query(self.index, self.queryStringMaker(state.chr, state.start, state.end), {
            finishHandler: self.finishHandler,
            resolveHandler: self.resolveHandler,
            errHandler: self.errHandler,
        })
        .then(async resultData => {
            resolve(self.translator(resultData));
        })
        .catch(async error => {
            postAlertError(error.detail);
            reject(new Error(error));
        })
        .finally(closeAlert(alertID));
    });
};

const _LZCredibleSetSource = LocusZoom.Data.Source.extend(function (init) {
    this.parseInit(init);
});
_LZCredibleSetSource.prototype.parseInit = function (params) {
    const { phenotype, index, queryStringMaker, translator, finishHandler, resolveHandler, errHandler, initialData } = params;
    this.params = params;
    this.queryStringMaker = queryStringMaker;
    this.index = index;
    this.translator = translator;
    this.initialData = initialData;
    this.phenotype = phenotype;
};
_LZCredibleSetSource.prototype.getRequest = function (state, chain, fields) {
    const self = this;
    return new Promise((resolve, reject) => {

        const alertID = postAlertNotice(`Loading ${self.index}; please wait ...`);
        if (!!self.initialData) {
            closeAlert(alertID);
            resolve(self.translator(self.initialData));
            self.initialData = null;
        } else {
            // decide whether or not to use a precomputed credset
            // TODO: conditional based on the code below
            const phenoRegionQuery = `${this.phenotype},${state.chr}:${state.start}-${state.end}`;
            query('credible-sets', phenoRegionQuery).then(async results => {
                closeAlert(alertID);
                console.log('credible sets bioindex results', results);
                if (
                    results.length > 0
                ) {
                    // TODO: credset combination branch
                    console.log('there are credible sets - merge and return them');
                    resolve([]);
                } else {
                    console.log('calculate the credible sets')
                    console.log('get the necessary associations')
                    query('associations', phenoRegionQuery).then(async results => {
                        // TODO: what is this?
                        // const nlogpvals = chain.body.map(function (item) {
                        //     return item[self.params.fields.log_pvalue];  // this implies that this data is column-indexed?
                        // });
                        const translatedResults = self.translator(results);
                        const nlogpvals = results.map(association => -Math.log10(association.pValue));
                        const credset_data = [];
                        try {
                            const scores = scoring.bayesFactors(nlogpvals);
                            const posteriorProbabilities = scoring.normalizeProbabilities(scores);

                            // Use scores to mark the credible set in various ways (depending on your visualization preferences,
                            //   some of these may not be needed)
                            const credibleSet = marking.findCredibleSet(scores, 0.95);
                            const credSetScaled = marking.rescaleCredibleSet(credibleSet);
                            const credSetBool = marking.markBoolean(credibleSet);
                            console.log('trying to make credset info', scores, posteriorProbabilities, credibleSet, credSetScaled, credSetBool);

                            // Annotate each response record based on credible set membership
                            for (let i = 0; i < translatedResults.length; i++) {
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
                        console.log(credset_data);
                        resolve(credset_data);
                    });
                }
            });
        }

    });
};











// Adapted Credible Set Data Source
// Behavior: if there are no credible sets satisfactory on the given region, calculate credible set membership for the points and return that instead
// From LocusZoom Code
// https://github.com/statgen/locuszoom/blob/84d979c1fe54b2e3396857d3cef3fc7e581881ef/esm/ext/lz-credible-sets.js

// const BaseAdapter = LocusZoom.Adapters.get('BaseAdapter');
/**
 * Custom data source that calculates the 95% credible set based on provided data.
 * This source must be requested as the second step in a chain, after a previous step that returns fields required
 *  for the calculation.
 *
 * @param {Object} init.params
 * @param {Object} init.params.fields
 * @param {String} init.params.fields.log_pvalue The name of the field containing pvalue information
 * @param {Number} [init.params.threshold=0.95] The credible set threshold (eg 95%)
 *
 */
// class CredibleSetLZ extends BaseAdapter {
//     constructor(config) {
//         super(...arguments);
//         this.dependentSource = true; // Don't do calcs for a region with no assoc data
//     }

//     parseInit(config) {
//         super.parseInit(...arguments);
//         if (!(this.params.fields && this.params.fields.log_pvalue)) {
//             throw new Error(`Source config for ${this.constructor.SOURCE_NAME} must specify how to find 'fields.log_pvalue'`);
//         }
//         if (!this.params.threshold) {
//             this.params.threshold = 0.95;
//         }
//     }

//     getCacheKey (state, chain, fields) {
//         const threshold = state.credible_set_threshold || this.params.threshold;
//         return [threshold, state.chr, state.start, state.end].join('_');
//     }

//     // TODO: This is the method to refactor!
//     fetchRequest(state, chain) {
//         const self = this;

//         // TODO: !!! can work as a filter function replacement?! - K
//         // The threshold can be overridden dynamically via `plot.state`, or set when the source is created
//         const threshold = state.credible_set_threshold || this.params.threshold;

//         // Calculate raw bayes factors and posterior probabilities based on information returned from the API
//         if (typeof chain.body[0][self.params.fields.log_pvalue] === 'undefined') {
//             throw new Error('Credible set source could not locate the required fields from a previous request.');
//         }
//         const nlogpvals = chain.body.map(function (item) {
//             return item[self.params.fields.log_pvalue];
//         });
        // const credset_data = [];
        // try {
        //     const scores = scoring.bayesFactors(nlogpvals);
        //     const posteriorProbabilities = scoring.normalizeProbabilities(scores);

        //     // Use scores to mark the credible set in various ways (depending on your visualization preferences,
        //     //   some of these may not be needed)
        //     const credibleSet = marking.findCredibleSet(scores, threshold);
        //     const credSetScaled = marking.rescaleCredibleSet(credibleSet);
        //     const credSetBool = marking.markBoolean(credibleSet);

        //     // Annotate each response record based on credible set membership
        //     for (let i = 0; i < chain.body.length; i++) {
        //         credset_data.push({
        //             posterior_prob: posteriorProbabilities[i],
        //             contrib_fraction: credSetScaled[i],
        //             is_member: credSetBool[i],
        //         });
        //     }
        // } catch (e) {
        //     // If the calculation cannot be completed, return the data without annotation fields
        //     console.error(e);
        // }
        // return Promise.resolve(credset_data);
//     }

//     combineChainBody(data, chain, fields, outnames, trans) {
//         // At this point namespacing has been applied; add the calculated fields for this source to the chain
//         for (let i = 0; i < data.length; i++) {
//             const src = data[i];
//             const dest = chain.body[i];
//             Object.keys(src).forEach(function (attr) {
//                 dest[attr] = src[attr];
//             });
//         }
//         return chain.body;
//     }
// }

