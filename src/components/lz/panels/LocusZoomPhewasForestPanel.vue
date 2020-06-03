<template>
    <div :ref="`${index}_${salt}`">
        <pre></pre>
    </div>
</template>
<script>
import Vue from "vue";
import LocusZoom from "locuszoom";

import LZEvents, {
    LZ_BROWSER_FORCE_REFRESH,
    LZ_ADD_PANEL,
    LZ_REMOVE_PANEL,
    LZ_CHILD_DESTROY_PANEL,
    LZ_BIOINDEX_QUERY_RESOLVE,
    LZ_BIOINDEX_QUERY_ERROR,
    LZ_BIOINDEX_QUERY_FINISH,
    } from "@/components/lz/LocusZoomEvents"

import { BioIndexReader } from "@/utils/igvUtils"

import { cloneDeep } from "lodash";


const PHEWAS_DATASOURCE = ["StaticJSON", [
      {
        "phenotype": "Bone cancer",
        "log_pvalue": 0.469,
        "beta": -0.033,
        "ci_start": -0.065,
        "ci_end": 0.016
      },
      {
        "phenotype": "Neurofibromatosis",
        "log_pvalue": 0.319,
        "beta": -0.018,
        "ci_start": -0.033,
        "ci_end": 0.003
      },
      {
        "phenotype": "Hypothyroidism",
        "log_pvalue": 0.707,
        "beta": -0.01975,
        "ci_start": -0.081,
        "ci_end": 0.047
      },
      {
        "phenotype": "Type 1 diabetes",
        "log_pvalue": 0.5681,
        "beta": -0.00425,
        "ci_start": -0.113,
        "ci_end": 0.049
      },
      {
        "phenotype": "Type 2 diabetes",
        "log_pvalue": 5.6754,
        "beta": -0.02825,
        "ci_start": -0.063,
        "ci_end": -0.005
      },
      {
        "phenotype": "Abnormal glucose",
        "log_pvalue": 0.545,
        "beta": -0.02225,
        "ci_start": -0.074,
        "ci_end": 0.042
      },
      {
        "phenotype": "Impaired fasting glucose",
        "log_pvalue": 0.5681,
        "beta": 0.01,
        "ci_start": -0.029,
        "ci_end": 0.045
      },
      {
        "phenotype": "Diabetic retinopathy",
        "log_pvalue": 0.437,
        "beta": 0.02475,
        "ci_start": -0.002,
        "ci_end": 0.052
      },
      {
        "phenotype": "Hypoglycemia",
        "log_pvalue": 0.647,
        "beta": -0.021,
        "ci_start": -0.089,
        "ci_end": 0.078
      },
      {
        "phenotype": "Adrenal hyperfunction",
        "log_pvalue": 0.8561,
        "beta": 0.0275,
        "ci_start": -0.021,
        "ci_end": 0.091
      },
      {
        "phenotype": "Proteinuria",
        "log_pvalue": 0.40803,
        "beta": 0.0385,
        "ci_start": -0.018,
        "ci_end": 0.121
      },
      {
        "phenotype": "Hypocalcemia",
        "log_pvalue": 0.517,
        "beta": -0.0375,
        "ci_start": -0.081,
        "ci_end": -0.015
      },
      {
        "phenotype": "Disorders of bilirubin excretion",
        "log_pvalue": 0.776,
        "beta": -0.00775,
        "ci_start": -0.093,
        "ci_end": 0.105
      },
      {
        "phenotype": "Morbid obesity",
        "log_pvalue": 1.048,
        "beta": -0.00625,
        "ci_start": -0.035,
        "ci_end": 0.068
      },
      {
        "phenotype": "Megaloblastic anemia",
        "log_pvalue": 2.28,
        "beta": 0.032,
        "ci_start": 0.022,
        "ci_end": 0.038
      },
      {
        "phenotype": "Pancytopenia",
        "log_pvalue": 1.178,
        "beta": -0.002,
        "ci_start": -0.027,
        "ci_end": 0.032
      },
      {
        "phenotype": "Primary thrombocytopenia",
        "log_pvalue": 2.231,
        "beta": 0.00925,
        "ci_start": -0.079,
        "ci_end": 0.057
      },
      {
        "phenotype": "Aphasia",
        "log_pvalue": 0.829,
        "beta": -0.02175,
        "ci_start": -0.053,
        "ci_end": 0.017
      },
      {
        "phenotype": "Schizophrenia",
        "log_pvalue": 0.814,
        "beta": -0.032,
        "ci_start": -0.077,
        "ci_end": -0.006
      },
      {
        "phenotype": "Obsessive-compulsive disorders",
        "log_pvalue": 9.47,
        "beta": -0.0115,
        "ci_start": -0.041,
        "ci_end": 0.09
      },
      {
        "phenotype": "Encephalitis",
        "log_pvalue": 0.1551,
        "beta": 0.007,
        "ci_start": -0.039,
        "ci_end": 0.02
      },
      {
        "phenotype": "Hypersomnia",
        "log_pvalue": 0.864,
        "beta": -0.02625,
        "ci_start": -0.105,
        "ci_end": 0.089
      },
      {
        "phenotype": "Parkinson's disease",
        "log_pvalue": 2.0334,
        "beta": -0.0275,
        "ci_start": -0.043,
        "ci_end": -0.007
      },
      {
        "phenotype": "Epilepsy",
        "log_pvalue": 0.456,
        "beta": -0.01675,
        "ci_start": -0.029,
        "ci_end": 0.013
      },
      {
        "phenotype": "Complex regional/central pain syndrome",
        "log_pvalue": 0.0404,
        "beta": -0.00325,
        "ci_start": -0.035,
        "ci_end": 0.05
      },
      {
        "phenotype": "Retinal detachments and defects",
        "log_pvalue": 0.876,
        "beta": 0.00875,
        "ci_start": -0.02,
        "ci_end": 0.069
      },
      {
        "phenotype": "Fuchs' dystrophy",
        "log_pvalue": 17.3972,
        "beta": -0.037,
        "ci_start": -0.071,
        "ci_end": -0.006
      },
      {
        "phenotype": "Myopia",
        "log_pvalue": 0.52,
        "beta": 0.0365,
        "ci_start": -0.005,
        "ci_end": 0.054
      },
      {
        "phenotype": "Scleritis and episcleritis",
        "log_pvalue": 1.966,
        "beta": 0.021,
        "ci_start": -0.035,
        "ci_end": 0.116
      },
      {
        "phenotype": "Otosclerosis",
        "log_pvalue": 1.274,
        "beta": -0.031,
        "ci_start": -0.046,
        "ci_end": -0.002
      },
      {
        "phenotype": "Cholesteatoma",
        "log_pvalue": 0.616,
        "beta": -0.01575,
        "ci_start": -0.057,
        "ci_end": 0.071
      },
      {
        "phenotype": "Meniere's disease",
        "log_pvalue": 0.424,
        "beta": -0.02075,
        "ci_start": -0.048,
        "ci_end": 0.022
      },
      {
        "phenotype": "Labyrinthitis",
        "log_pvalue": 1.44,
        "beta": 0.012,
        "ci_start": 0,
        "ci_end": 0.028
      },
      {
        "phenotype": "Coronary atherosclerosis",
        "log_pvalue": 5.444,
        "beta": -0.00025,
        "ci_start": -0.02,
        "ci_end": 0.013
      },
      {
        "phenotype": "Endocarditis",
        "log_pvalue": 2.9893,
        "beta": -0.03475,
        "ci_start": -0.076,
        "ci_end": 0.007
      },
      {
        "phenotype": "Cardiomyopathy",
        "log_pvalue": 1.4141,
        "beta": 0.01425,
        "ci_start": -0.008,
        "ci_end": 0.037
      },
      {
        "phenotype": "Atrial flutter",
        "log_pvalue": 0.884,
        "beta": -0.02725,
        "ci_start": -0.057,
        "ci_end": 0.003
      }
    ] ]

const PHEWAS_PANEL = {
    id: "phewasforest",
    width: 800,
    height: 800,
    proportional_width: 1,
    margin: { top: 35, right: 220, bottom: 50, left: 20 },
    inner_border: "rgba(210, 210, 210, 0.85)",
    dashboard: {
        components: [{
            type: "toggle_legend",
            position: "left"
        }]
    },
    axes: {
        x: {
            label: "Beta",
            label_offset: 33
        },
        y2: {
            ticks: {  // Dynamically generated ticks, but specify custom options/styles to be used in every tick
                style: {
                    "font-weight": "bold",
                    "text-anchor": "start"
                }
            }
        }
    },
    legend: {
        origin: { x: 30, y: 45 },
        orientation: "vertical"
    },
    data_layers: [
        {
            namespace: { "phewas": "phewas" },
            id: "phewas_forest",
            type: "category_forest",
            z_index: 1,
            point_shape: "square",
            point_size: {
                scale_function: "interpolate",
                field: "{{namespace[phewas]}}log_pvalue",
                parameters: {
                    breaks: [0, 10],
                    values: [60, 160],
                    null_value: 50
                }
            },
            color: {
                scale_function: "interpolate",
                field: "{{namespace[phewas]}}log_pvalue",
                parameters: {
                    breaks: [0, 10],
                    values: ["#fee8c8","#b30000"],
                    null_value: "#B8B8B8"
                }
            },
            legend: [
                { label: "-log10 p-value" },
                { shape: "square", class: "lz-data_layer-forest", color: "#fdd49e", size: 60, label: "< 2" },
                { shape: "square", class: "lz-data_layer-forest", color: "#fdbb84", size: 80, label: "2 - 4" },
                { shape: "square", class: "lz-data_layer-forest", color: "#fc8d59", size: 100, label: "4 - 6" },
                { shape: "square", class: "lz-data_layer-forest", color: "#ef6548", size: 120, label: "6 - 8" },
                { shape: "square", class: "lz-data_layer-forest", color: "#d7301f", size: 140, label: "8 - 10" },
                { shape: "square", class: "lz-data_layer-forest", color: "#b30000", size: 160, label: "10+" }
            ],
            id_field: "{{namespace[phewas]}}phenotype",
            fields: ["{{namespace[phewas]}}phenotype", "{{namespace[phewas]}}log_pvalue", "{{namespace[phewas]}}log_pvalue|logtoscinotation", "{{namespace[phewas]}}beta", "{{namespace[phewas]}}ci_start", "{{namespace[phewas]}}ci_end"],
            x_axis: {
                field: "{{namespace[phewas]}}beta",
                lower_buffer: 0.1,
                upper_buffer: 0.1
            },
            y_axis: {
                axis: 2,
                category_field: "{{namespace[phewas]}}phenotype",  // Labels
                field: "{{namespace[phewas]}}y_offset",  // Positions (dynamically added)
            },
            confidence_intervals: {
                start_field: "{{namespace[phewas]}}ci_start",
                end_field: "{{namespace[phewas]}}ci_end"
            },
            behaviors: {
                onmouseover: [
                    { action: "set", status: "highlighted" }
                ],
                onmouseout: [
                    { action: "unset", status: "highlighted" }
                ],
                onclick: [
                    { action: "toggle", status: "selected", exclusive: true }
                ],
                onshiftclick: [
                    { action: "toggle", status: "selected" }
                ]
            },
            tooltip: {
                namespace: { "phewas": "phewas" },
                closable: true,
                show: { or: ["highlighted", "selected"] },
                hide: { and: ["unhighlighted", "unselected"] },
                html: "<strong>{{{{namespace[phewas]}}phenotype|htmlescape}}</strong><br>"
                    + "P Value: <strong>{{{{namespace[phewas]}}log_pvalue|logtoscinotation|htmlescape}}</strong><br>"
                    + "Odds Ratio: <strong>{{{{namespace[phewas]}}beta|htmlescape}}</strong><br>"
                    + "95% Conf. Interval: <strong>[ {{{{namespace[phewas]}}ci_start|htmlescape}} {{{{namespace[phewas]}}ci_end|htmlescape}} ]</strong>"
            }
        },
        {
            id: "zeroline",
            type: "orthogonal_line",
            z_index: 0,
            orientation: "vertical",
            offset: 0,
            y_axis: {
                axis: 2
            }
        }
    ]
}


export default Vue.component('locuszoom-phewas-panel', {

    props: {

        phenotype: {
            type: String,
            // required: true
        },

        // TODO: Problem with setting this as a prop is that the translation method depends on visualization type being targeted?
        panel: {
            type: String,
        },

        finishHandler: {
            type: Function,
            required: false
        },
        resolveHandler: {
            type: Function,
            required: false
        },
        errHandler: {
            type: Function,
            required: false
        }

    },

    data() {
        return {
            index: 'associations',
            salt: Math.floor((Math.random() * 10000)).toString(),
        }
    },

    computed: {

        panelName() {
            return `${this.phenotype} ${this.panel}`
        },

        queryStringMaker: function () {
            return (chr, start, end) => `${this.phenotype},${chr}:${start}-${end}`;
        },

    },

    mounted() {

        LZEvents.$emit(LZ_ADD_PANEL, this.buildPanel());

        LZEvents.$on(LZ_CHILD_DESTROY_PANEL, panelName => {
            if (panelName === this.panelName) {
                this.$destroy();
            };
        });

    },

    beforeDestroy () {

        LZEvents.$emit(LZ_REMOVE_PANEL, this.panelName);

    },

    methods: {
        buildPanel() {
            return {
                panel: PHEWAS_PANEL,
                dataSource: PHEWAS_DATASOURCE,
            }
        }
    },

    watch: {
        phenotype(newPhenotype, oldPhenotype) {

            LZEvents.$emit(LZ_REMOVE_PANEL, `${this.phenotype} ${this.visualization}`);
            LZEvents.$emit(LZ_ADD_PANEL, this.buildPanel());

        }
    }

})

</script>

