import LocusZoom from 'locuszoom';
import { AssociationLZ } from 'locuszoom/esm/data/adapters';
import credibleSets from 'locuszoom/esm/ext/lz-credible-sets';

import { PORTAL_API_BASE_URL, LD_SERVER_BASE_URL } from './constants';
import { makeParser } from './gwas/parsers';

LocusZoom.use(credibleSets);

const stateUrlMapping = Object.freeze({ chr: 'chrom', start: 'start', end: 'end' });

class TabixAssociationLZ extends AssociationLZ {
    parseInit(init) {
        this.params = init.params;
        this.parser = makeParser(this.params);
        this.reader = init.tabix_reader;
    }

    getCacheKey(state, chain, fields) {
        return [state.chr, state.start, state.end].join('_');
    }

    fetchRequest(state, chain, fields) {
        const self = this;
        return new Promise((resolve, reject) => {
            self.reader.fetch(state.chr, state.start, state.end, (data, err) => {
                if (err) {
                    reject(new Error('Could not read requested region. This may indicate an error with the .tbi index.'));
                }
                resolve(data);
            });
        });
    }

    normalizeResponse(data) {
        return data.map(this.parser).filter((item) => !Number.isNaN(item.log_pvalue));
    }
}

LocusZoom.Adapters.add('TabixAssociationLZ', TabixAssociationLZ);

function sourceName(display_name) {
    return display_name.replace(/[^A-Za-z0-9_]/g, '_');
}

function createStudyLayout(
    source_label,
    annotations = { credible_sets: false, gwas_catalog: true },
    build,
) {
    const new_panels = [];
    const source_name = sourceName(source_label);

    const namespace = {
        assoc: `assoc_${source_name}`,
        credset: `credset_${source_name}`,
        catalog: 'catalog',
    };

    const assoc_panel = LocusZoom.Layouts.get('panel', 'association', {
        id: `association_${source_name}`,
        title: { text: source_label },
        height: 275,
        namespace,
    });
    const assoc_layer = assoc_panel.data_layers[2];
    assoc_layer.label = {
        text: '{{{{namespace[assoc]}}variant}}',
        spacing: 12,
        lines: { style: { 'stroke-width': '2px', stroke: '#333333', 'stroke-dasharray': '2px 2px' } },
        filters: [
            { field: 'lz_show_label', operator: '=', value: true },
        ],
        style: { 'font-weight': 'bold' },
    };
    assoc_layer.tooltip = LocusZoom.Layouts.get('tooltip', 'standard_association_with_label', { namespace });
    const assoc_tooltip = assoc_layer.tooltip;

    assoc_tooltip.html += '{{#if {{namespace[assoc]}}beta|is_numeric}}<br>&beta;: <strong>{{{{namespace[assoc]}}beta|scinotation|htmlescape}}</strong>{{/if}}';
    assoc_tooltip.html += '{{#if {{namespace[assoc]}}stderr_beta|is_numeric}}<br>SE (&beta;): <strong>{{{{namespace[assoc]}}stderr_beta|scinotation|htmlescape}}</strong>{{/if}}';
    assoc_tooltip.html += '{{#if {{namespace[assoc]}}alt_allele_freq|is_numeric}}<br>Alt. freq: <strong>{{{{namespace[assoc]}}alt_allele_freq|scinotation|htmlescape}} </strong>{{/if}}';
    assoc_tooltip.html += '{{#if {{namespace[assoc]}}rsid}}<br>rsID: <a href="https://www.ncbi.nlm.nih.gov/snp/{{{{namespace[assoc]}}rsid|htmlescape}}" target="_blank" rel="noopener">{{{{namespace[assoc]}}rsid|htmlescape}}</a>{{/if}}';

    const dash_extra = [];
    if (Object.values(annotations).some((item) => !!item)) {
        dash_extra.push({
            type: 'display_options',
            custom_event_name: 'widget_association_display_options_choice',
            position: 'right',
            color: 'blue',
            button_html: 'Display options...',
            button_title: 'Control how plot items are displayed',
            layer_name: 'associationpvalues',
            default_config_display_name: 'Default view',
            options: [],
        });
    }
    const fields_extra = [
        '{{namespace[assoc]}}rsid',
        '{{namespace[assoc]}}beta',
        '{{namespace[assoc]}}stderr_beta',
        '{{namespace[assoc]}}alt_allele_freq',
    ];
    if (annotations.credible_sets) {
        const basis = LocusZoom.Layouts.get('panel', 'association_credible_set', { namespace });
        dash_extra[0].options.push(...basis.toolbar.widgets.pop().options);
        fields_extra.push('{{namespace[credset]}}posterior_prob', '{{namespace[credset]}}contrib_fraction', '{{namespace[credset]}}is_member');
        assoc_tooltip.html += '{{#if {{namespace[credset]}}posterior_prob}}<br>Posterior probability: <strong>{{{{namespace[credset]}}posterior_prob|scinotation}}{{/if}}</strong><br>';
    }
    if (annotations.gwas_catalog) {
        const basis = LocusZoom.Layouts.get('panel', 'association_catalog', { namespace });
        dash_extra[0].options.push(...basis.toolbar.widgets.pop().options);
        fields_extra.push('{{namespace[catalog]}}rsid', '{{namespace[catalog]}}trait', '{{namespace[catalog]}}log_pvalue');
        assoc_tooltip.html += '{{#if {{namespace[catalog]}}rsid}}<br><a href="https://www.ebi.ac.uk/gwas/search?query={{{{namespace[catalog]}}rsid}}" target="_new">See hits in GWAS catalog</a>{{/if}}';
    }

    assoc_layer.fields.push(...fields_extra);
    assoc_panel.toolbar.widgets.push(...dash_extra);

    new_panels.push(LocusZoom.Layouts.get('panel', 'association', assoc_panel));
    if (annotations.gwas_catalog) {
        new_panels.push(LocusZoom.Layouts.get('panel', 'annotation_catalog', {
            id: `catalog_${source_name}`,
            namespace,
            toolbar: { widgets: [] },
            title: {
                text: 'Hits in GWAS Catalog',
                style: { 'font-size': '14px' },
                x: 50,
            },
        }));
    }
    return new_panels;
}

function createStudyTabixSources(label, tabix_reader, parser_options) {
    const assoc_name = `assoc_${sourceName(label)}`;
    const source_params = { ...parser_options, id_field: 'variant' };
    return [
        [assoc_name, ['TabixAssociationLZ', { tabix_reader, params: source_params }]],
        [
            `credset_${sourceName(label)}`, [
                'CredibleSetLZ',
                { params: { fields: { log_pvalue: `${assoc_name}:log_pvalue` }, threshold: 0.95 } },
            ],
        ],
    ];
}

function addPanels(plot, data_sources, panel_options, source_options) {
    source_options.forEach((source) => data_sources.add(...source));
    panel_options.forEach((panel_layout) => {
        panel_layout.y_index = -1;
        const panel = plot.addPanel(panel_layout);
        panel.addBasicLoader();
    });
}

function getBasicSources(study_sources = []) {
    return [
        ...study_sources,
        ['catalog', ['GwasCatalogLZ', { url: `${PORTAL_API_BASE_URL}annotation/gwascatalog/results/` }]],
        ['ld', ['LDLZ2', { url: LD_SERVER_BASE_URL, params: { source: '1000G', population: 'ALL' } }]],
        ['gene', ['GeneLZ', { url: `${PORTAL_API_BASE_URL}annotation/genes/` }]],
        ['recomb', ['RecombLZ', { url: `${PORTAL_API_BASE_URL}annotation/recomb/results/` }]],
        ['constraint', ['GeneConstraintLZ', { url: 'https://gnomad.broadinstitute.org/api/' }]],
    ];
}

function getBasicLayout(initial_state = {}, study_panels = [], mods = {}) {
    const panels = [
        ...study_panels,
        LocusZoom.Layouts.get('panel', 'genes'),
    ];

    const extra = Object.assign({
        state: initial_state,
        panels,
    }, mods);
    return LocusZoom.Layouts.get('plot', 'standard_association', extra);
}

function deNamespace(data, prefer) {
    return Object.keys(data).reduce((acc, key) => {
        const new_key = key.replace(/.*?:/, '');
        if (!Object.prototype.hasOwnProperty.call(acc, new_key)
            || (!prefer || key.startsWith(prefer))) {
            acc[new_key] = data[key];
        }
        return acc;
    }, {});
}

export {
    getBasicSources, getBasicLayout,
    createStudyTabixSources, createStudyLayout,
    sourceName, addPanels,
    deNamespace,
    stateUrlMapping,
};