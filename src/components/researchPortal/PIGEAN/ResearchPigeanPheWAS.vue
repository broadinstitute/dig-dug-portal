<template>
    <div class="mbm-plot-content row">
        <div class="col-md-12 phewas-plot-wrapper">
            <!--<download-chart
                v-if="!nativeDlBtn"
                :filename="!plotName ? 'PheWAS' : plotName"
                :chartId="canvasId + 'pheWasPlot'"
            >
            </download-chart>-->
            <div
                :id="canvasId + 'pheWasPlotWrapper'"
                class="col-md-12"
                style="display: inline-block"
            >
                <div
                    :id="canvasId + 'pheWasInfoBox'"
                    class="phe-was-info-box hidden"
                >
                    <div
                        :id="canvasId + 'info_box_close'"
                        class="fixed-info-box-close"
                        @click="
                            utils.uiUtils.removeOnMouseOut(
                                canvasId + 'pheWasInfoBox',
                                100
                            )
                        "
                    >
                        <b-icon icon="x-circle-fill"></b-icon>
                    </div>
                    <span :id="canvasId + 'pheWasInfoBoxContent'"></span>

                    <span v-for="(ptValue, ptKey) in hoverItems" :key="ptKey">
                        <strong v-if="!linkPhenotypes">
                            {{
                                (phenotypeMap[ptKey] &&
                                    phenotypeMap[ptKey].description) ||
                                ptKey
                            }}
                        </strong>
                        <strong v-else>
                            <a :href="phenotypeLink(ptKey)">
                                {{
                                    (phenotypeMap[ptKey] &&
                                        phenotypeMap[ptKey].description) ||
                                    ptKey
                                }}
                            </a>
                        </strong>
                        <br />
                        <span
                            v-for="(dValue, dKey) in ptValue.data"
                            :key="dKey"
                        >
                            <span>{{ dKey + ": " }}</span
                            ><span>{{ dValue }}</span> <br
                        /></span>
                        <template
                            v-if="
                                options != null &&
                                utils.uiUtils.isIdFixed(
                                    '#' + canvasId + 'pheWasInfoBox'
                                ) == true
                            "
                        >
                            <button
                                v-if="!!options.includes('add phenotype')"
                                class="option-button"
                                @click="addPhenotype(ptValue.id)"
                            >
                                Add this phenotype below
                            </button>

                            <button
                                v-if="!!options.includes('open phenotype page')"
                                class="option-button"
                                @click="
                                    openPage('phenotype.html', {
                                        phenotype: ptValue.id,
                                    })
                                "
                            >
                                Go to phenotype page
                            </button>
                        </template>
                        <span
                            v-if="
                                options != null &&
                                utils.uiUtils.isIdFixed(
                                    '#' + canvasId + 'pheWasInfoBox'
                                ) == false
                            "
                            >Click for options</span
                        >
                        <br />
                    </span>
                </div>
                <!-- Y-axis field selection checkboxes for multi-y-axis plots -->
                <div 
                    v-if="hasMultipleYAxisFields" 
                    class="y-axis-fields-selector"
                >
                    <label 
                        v-for="field in yAxisFields" 
                        :key="field"
                        class="y-axis-field-checkbox"
                    >
                        <input 
                            type="checkbox" 
                            :value="field"
                            :checked="selectedYAxisFields.includes(field)"
                            @change="toggleYAxisField(field)"
                        />
                        <span><span class="shape-symbol">{{ getFieldShapeLabel(field) }}</span> {{ getFieldDisplayLabel(field) }}</span>
                    </label>
                    <!-- Threshold filter toggle -->
                    <label 
                        v-if="renderConfig.thresholds && renderConfig.thresholds.length > 0"
                        class="y-axis-field-checkbox threshold-filter-checkbox"
                    >
                        <input 
                            type="checkbox" 
                            :checked="filterByThreshold"
                            @change="filterByThreshold = !filterByThreshold"
                        />
                        <span>Show only above threshold</span>
                    </label>
                    <!-- Phenotype group filter dropdown -->
                    <div 
                        v-if="availableGroups.length > 0"
                        class="phenotype-group-filter-inline"
                    >
                        <div class="dropdown-wrapper">
                            <button 
                                class="btn btn-sm btn-secondary dropdown-toggle"
                                type="button"
                                @click.stop="showGroupDropdown = !showGroupDropdown"
                            >
                                Filter by Groups ({{ selectedGroups.length }}/{{ availableGroups.length }})
                                <b-icon icon="chevron-down"></b-icon>
                            </button>
                            <div 
                                v-if="showGroupDropdown"
                                class="group-dropdown-menu"
                                @click.stop=""
                            >
                                <div class="group-dropdown-header">
                                    <label class="select-all-groups">
                                        <input 
                                            type="checkbox"
                                            :checked="selectedGroups.length === availableGroups.length"
                                            @change="toggleAllGroups"
                                        />
                                        <span>Select All</span>
                                    </label>
                                </div>
                                <div class="group-dropdown-content">
                                    <label 
                                        v-for="group in availableGroups" 
                                        :key="group"
                                        class="group-checkbox-item"
                                    >
                                        <input 
                                            type="checkbox" 
                                            :value="group"
                                            :checked="selectedGroups.includes(group)"
                                            @change="toggleGroup(group)"
                                        />
                                        <span>{{ group }}</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <canvas
                    :hidden="!showCanvas"
                    :id="canvasId + 'pheWasPlot'"
                    width=""
                    height=""
                    @mousemove="checkPosition($event, 'hover')"
                    @click="checkPosition($event, 'click')"
                    @mouseout="
                        !utils.uiUtils.isIdFixed(
                            '#' + canvasId + 'pheWasInfoBox'
                        )
                            ? utils.uiUtils.removeOnMouseOut(
                                  canvasId + 'pheWasInfoBox',
                                  1000
                              )
                            : ''
                    "
                ></canvas>
                <div class="download-images-setting">
                    <span class="btn btn-default options-gear"
                        >Download <b-icon icon="download"></b-icon
                    ></span>
                    <ul class="options">
                        <li>
                            <a
                                href="javascript:;"
                                @click="
                                    downloadImage(
                                        'vector_wrapper_' + canvasId,
                                        canvasId + '_pheWasPlot',
                                        'svg'
                                    )
                                "
                                >Download SVG</a
                            >
                        </li>
                        <li>
                            <a
                                href="javascript:;"
                                @click="
                                    downloadImage(
                                        canvasId + 'pheWasPlot',
                                        canvasId + '_pheWasPlot',
                                        'png'
                                    )
                                "
                                >Download PNG</a
                            >
                        </li>
                    </ul>
                </div>
                <research-phewas-plot-vector
                    v-if="!!renderData"
                    :renderData="groupData(renderData)"
                    :renderConfig="renderConfig"
                    :phenotypeMap="phenotypeMap"
                    :colors="colors"
                    :margin="adjPlotMargin"
                    :sectionId="canvasId"
                    :utils="utils"
                    :ref="canvasId + '_pheWasPlot'"
                >
                </research-phewas-plot-vector>
            </div>
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import { cloneDeep } from "lodash";
import { BootstrapVueIcons } from "bootstrap-vue";
import bioIndexUtils from "@/utils/bioIndexUtils";
import pheWasPlotVector from "@/components/researchPortal/vectorPlots/ResearchPheWasPlotVector.vue";
Vue.use(BootstrapVueIcons);

export default Vue.component("ResearchPigeanPhewasPlot", {
    components: {
        pheWasPlotVector,
    },
    props: [
        "canvasId",
        "phenotypeMap",
        "phenotypesData",
        "renderConfig",
        "pkgData",
        "pkgDataSelected",
        "colors",
        "plotMargin",
        "filter",
        "options",
        "sectionId",
        "utils",
        "plotName",
        "top1500",
        "linkPhenotypes",
        "isPigean",
        "matchingHoverDots",
    ],

    data() {
        return {
            pheWasData: null,
            pheWasPosData: {},
            spaceBy: 7,
            trigger: 0,
            hoverItems: {},
            showCanvas: true,
            selectedYAxisFields: [], // Track which y-axis fields are selected
            filterByThreshold: true, // User-controlled threshold filter toggle (initially checked)
            selectedGroups: [], // Track which phenotype groups are selected
            showGroupDropdown: false, // Control dropdown visibility
        };
    },
    modules: {},
    computed: {
        hasMultipleYAxisFields() {
            return !!(
                this.renderConfig["y axis fields"] &&
                Array.isArray(this.renderConfig["y axis fields"]) &&
                this.renderConfig["y axis fields"].length > 0
            );
        },
        yAxisFields() {
            if (this.hasMultipleYAxisFields) {
                return this.renderConfig["y axis fields"];
            }
            return [];
        },
        primaryYAxisField() {
            if (this.hasMultipleYAxisFields && this.renderConfig["primary y axis field"]) {
                return this.renderConfig["primary y axis field"];
            }
            return this.renderConfig["y axis field"] || null;
        },
        currentYAxisField() {
            // Use primary field if no fields selected, otherwise use first selected
            if (this.selectedYAxisFields.length === 0) {
                return this.primaryYAxisField;
            }
            return this.selectedYAxisFields[0];
        },
        greaterThan() {
            return (
                !!this.renderConfig["label in black"] &&
                this.renderConfig["label in black"] === "greater than"
            );
        },
        phenotypeMapConfig() {
            if (this.renderConfig["phenotype map"] == "null") {
                return null;
            } else if (
                this.renderConfig["phenotype map"] == "kp phenotype map"
            ) {
                return "kpPhenotypeMap";
            }
            return null;
        },
        renderData() {
            this.showCanvas = true;
            let content = {};
            content["data"] = [];

            if (this.phenotypesData) {
                let phenotypesData = cloneDeep(this.phenotypesData);
                
                // Determine which field to use for sorting and p-value calculation
                const sortField = this.hasMultipleYAxisFields 
                    ? this.primaryYAxisField 
                    : (this.renderConfig["y axis field"] || null);
                
                phenotypesData.forEach((d) => {
                    // Use primary field for rawPValue calculation
                    d["rawPValue"] = this.getPValue(d, sortField);
                });
                phenotypesData = phenotypesData.sort(
                    (a, b) => a.rawPValue - b.rawPValue
                );
                if (this.top1500) {
                    // Restrict to the top 1500 phenotypes by p-value
                    // for when 6500 traits are used.
                    phenotypesData = phenotypesData.slice(0, 1500);
                }
                if (this.greaterThan) {
                    // Shows the "significant" phenotypes first in the group.
                    phenotypesData.reverse();
                }

                phenotypesData.map((d) => {
                    // Handle log10 conversion for multiple y-axis fields
                    if (this.hasMultipleYAxisFields) {
                        // Convert ALL fields in y axis fields to -log10 if needed
                        const fieldsToConvert = this.yAxisFields;
                        
                        if (
                            this.renderConfig["convert y -log10"] == true ||
                            this.renderConfig["convert y -log10"] == "true"
                        ) {
                            fieldsToConvert.forEach(field => {
                                if (d[field] !== undefined && d[field] !== null) {
                                    d[field + "-log10"] = -Math.log10(Math.max(Number(d[field]), 1e-300));
                                }
                            });
                        }
                    } else {
                        // Single y-axis field (original behavior)
                        if (
                            this.renderConfig["convert y -log10"] == true ||
                            this.renderConfig["convert y -log10"] == "true"
                        ) {
                            const yField = this.renderConfig["y axis field"];
                            if (yField) {
                                d[yField + "-log10"] = -Math.log10(d["rawPValue"]);
                            }
                        }
                    }

                    // Check phenotype map config first
                    if (this.phenotypeMapConfig == "kpPhenotypeMap") {
                        // Use phenotype map - filter by it
                        const renderByField = this.renderConfig["render by"];
                        if (!!this.phenotypeMap[d[renderByField]]) {
                            content["data"].push(d);
                        }
                    } else if (this.phenotypeMapConfig == null) {
                        // No phenotype map - use group by field directly, include all data
                        content["data"].push(d);
                    }
                });
            }
            if (this.filter) {
                content.data = content.data.filter(this.filter);
            }
            
            // Apply threshold filtering if enabled (OR logic - any field passes)
            if (this.filterByThreshold && 
                this.renderConfig["thresholds"] && 
                this.renderConfig["thresholds"].length > 0) {
                const threshold = Number(this.renderConfig["thresholds"][0]);
                
                // Determine which fields to check - use all fields if multiple y-axis, or selected if filtering
                const fieldsToCheck = this.hasMultipleYAxisFields
                    ? (this.selectedYAxisFields.length > 0 ? this.selectedYAxisFields : this.yAxisFields)
                    : [this.renderConfig["y axis field"]];
                
                content.data = content.data.filter((d) => {
                    // Check if ANY of the fields pass the threshold (OR logic)
                    let passesThreshold = false;
                    
                    fieldsToCheck.forEach(field => {
                        let fieldValue;
                        if (this.renderConfig["convert y -log10"] == "true") {
                            const logField = field + "-log10";
                            fieldValue = d[logField] !== undefined ? Number(d[logField]) : null;
                        } else {
                            fieldValue = d[field] !== undefined && d[field] !== null ? Number(d[field]) : null;
                        }
                        
                        if (fieldValue !== null && !isNaN(fieldValue)) {
                            if (this.greaterThan) {
                                if (fieldValue >= threshold) {
                                    passesThreshold = true;
                                }
                            } else {
                                if (fieldValue <= threshold) {
                                    passesThreshold = true;
                                }
                            }
                        }
                    });
                    
                    return passesThreshold;
                });
            }
            
            // Apply group filtering if groups are selected
            if (this.selectedGroups.length > 0 && this.availableGroups.length > 0) {
                const groupByField = this.renderConfig["group by"];
                
                content.data = content.data.filter((d) => {
                    let group;
                    if (this.phenotypeMapConfig == "kpPhenotypeMap") {
                        // Use phenotype map groups
                        const renderByValue = d[this.renderConfig["render by"]];
                        if (this.phenotypeMap[renderByValue] && this.phenotypeMap[renderByValue].group) {
                            group = this.phenotypeMap[renderByValue].group;
                        } else {
                            group = 'N/A';
                        }
                    } else if (this.phenotypeMapConfig == null && groupByField) {
                        // No phenotype map - use group by field directly
                        if (d[groupByField] != null && d[groupByField] !== undefined && d[groupByField] !== '') {
                            group = d[groupByField];
                        } else {
                            group = 'N/A';
                        }
                    }
                    return group && this.selectedGroups.includes(group);
                });
            }

            if (!!content.data && content.data.length > 0) {
                return content;
            } else {
                this.showCanvas = false;
                return null;
            }
        },
        adjPlotMargin() {
            let customPlotMargin = this.renderConfig["plot margin"]
                ? this.renderConfig["plot margin"]
                : null;

            let plotMargin = customPlotMargin
                ? {
                      left: customPlotMargin.left,
                      right: customPlotMargin.right,
                      top: customPlotMargin.top,
                      bottom: customPlotMargin.bottom,
                      bump: customPlotMargin.bump ? customPlotMargin.bump : 10,
                  }
                : {
                      left: this.plotMargin.leftMargin,
                      right: this.plotMargin.rightMargin,
                      top: this.plotMargin.topMargin,
                      bottom: this.plotMargin.bottomMargin,
                      bump: this.plotMargin.bump,
                  };

            return plotMargin;
        },
        availableGroups() {
            // Extract available groups from original phenotypesData (before filtering)
            // This avoids circular dependency with renderData
            if (!this.phenotypesData || this.phenotypesData.length === 0) {
                return [];
            }
            
            const groups = new Set();
            const groupByField = this.renderConfig["group by"];
            let hasItemsWithoutGroup = false;
            
            // Check phenotype map config first
            if (this.phenotypeMapConfig == "kpPhenotypeMap") {
                // Use phenotype map groups
                this.phenotypesData.forEach((d) => {
                    const renderByValue = d[this.renderConfig["render by"]];
                    if (this.phenotypeMap[renderByValue] && this.phenotypeMap[renderByValue].group) {
                        groups.add(this.phenotypeMap[renderByValue].group);
                    } else {
                        hasItemsWithoutGroup = true;
                    }
                });
            } else if (this.phenotypeMapConfig == null && groupByField) {
                // No phenotype map - use group by field directly
                this.phenotypesData.forEach((d) => {
                    if (d[groupByField] != null && d[groupByField] !== undefined && d[groupByField] !== '') {
                        groups.add(d[groupByField]);
                    } else {
                        hasItemsWithoutGroup = true;
                    }
                });
            }
            
            // Add 'N/A' group if there are items without a group value
            if (hasItemsWithoutGroup) {
                groups.add('N/A');
            }
            
            return Array.from(groups).sort();
        },
    },
    watch: {
        renderData: {
            handler(content) {
                // Use nextTick to ensure DOM is ready
                if (content && content.data && content.data.length > 0) {
                    this.$nextTick(() => {
                        this.renderPheWas();
                    });
                }
            },
            immediate: true
        },
        selectedYAxisFields: {
            handler() {
                // Re-render when selected fields change
                this.$nextTick(() => {
                    this.renderPheWas();
                });
            },
            deep: true
        },
        selectedGroups: {
            handler() {
                // Re-render when selected groups change
                this.$nextTick(() => {
                    this.renderPheWas();
                });
            },
            deep: true
        },
        phenotypesData: {
            handler(newData, oldData) {
                // Initialize selectedGroups with all groups when phenotypesData changes
                this.$nextTick(() => {
                    if (this.availableGroups.length > 0 && this.selectedGroups.length === 0) {
                        this.selectedGroups = [...this.availableGroups];
                    }
                });
                // Re-render plot when data changes (e.g., when filters are applied)
                // Always trigger re-render when phenotypesData prop changes
                this.$nextTick(() => {
                    this.renderPheWas();
                });
            },
            immediate: true,
            deep: true
        },
        filterByThreshold() {
            // Re-render when filter toggle changes
            this.$nextTick(() => {
                this.renderPheWas();
            });
        },
        matchingHoverDots(newDots) {
            console.log("received by phewas", newDots);
        },
    },
    created: function () {
        // Don't render here - wait for mounted and renderData to be ready
    },
    mounted: function () {
        window.addEventListener("resize", this.onResize);
        // Initialize selected fields with ALL fields if multiple y-axis fields exist
        if (this.hasMultipleYAxisFields && this.yAxisFields.length > 0) {
            this.selectedYAxisFields = [...this.yAxisFields];
        }
        // Close dropdown when clicking outside
        document.addEventListener('click', this.handleClickOutside);
        // Wait for DOM and computed properties to be ready, then render
        this.$nextTick(() => {
            if (this.renderData && this.renderData.data && this.renderData.data.length > 0) {
                this.renderPheWas();
            }
        });
    },
    beforeDestroy() {
        window.removeEventListener("resize", this.onResize);
        document.removeEventListener('click', this.handleClickOutside);
    },
    methods: {
        getPValue(d, field = null) {
            const yField = field || this.renderConfig["y axis field"] || this.primaryYAxisField;
            if (!yField || d[yField] === undefined || d[yField] === null) {
                return 0;
            }
            return typeof d[yField] == "string"
                ? Number(d[yField])
                : d[yField];
        },
        toggleYAxisField(field) {
            const index = this.selectedYAxisFields.indexOf(field);
            if (index > -1) {
                // Remove if already selected
                this.selectedYAxisFields.splice(index, 1);
                // Ensure at least primary field is selected
                if (this.selectedYAxisFields.length === 0 && this.primaryYAxisField) {
                    this.selectedYAxisFields.push(this.primaryYAxisField);
                }
            } else {
                // Add if not selected
                this.selectedYAxisFields.push(field);
            }
            // Trigger re-render
            this.$nextTick(() => {
                this.renderPheWas();
            });
        },
        getFieldShape(field) {
            // Returns shape based on field position: primary -> circle, 1st secondary -> square, 2nd secondary -> diamond
            if (!this.hasMultipleYAxisFields) {
                return 'circle';
            }
            const fields = this.yAxisFields;
            const index = fields.indexOf(field);
            if (index === -1) {
                return 'circle';
            }
            if (field === this.primaryYAxisField) {
                return 'circle';
            }
            // Find position among secondary fields (excluding primary)
            const secondaryFields = fields.filter(f => f !== this.primaryYAxisField);
            const secondaryIndex = secondaryFields.indexOf(field);
            if (secondaryIndex === 0) {
                return 'square';
            } else if (secondaryIndex === 1) {
                return 'diamond';
            }
            // Default to circle for additional fields
            return 'circle';
        },
        getFieldShapeLabel(field) {
            const shape = this.getFieldShape(field);
            const shapeSymbols = {
                'circle': '●',
                'square': '■',
                'diamond': '◆'
            };
            return shapeSymbols[shape] || '●';
        },
        getFieldDisplayLabel(field) {
            // Get the display label from "y axis field labels" if available
            if (this.hasMultipleYAxisFields && 
                this.renderConfig["y axis field labels"] && 
                Array.isArray(this.renderConfig["y axis field labels"])) {
                const fieldIndex = this.yAxisFields.indexOf(field);
                if (fieldIndex >= 0 && fieldIndex < this.renderConfig["y axis field labels"].length) {
                    return this.renderConfig["y axis field labels"][fieldIndex];
                }
            }
            // Fallback to field name if no label mapping exists
            return field;
        },
        toggleGroup(group) {
            const index = this.selectedGroups.indexOf(group);
            if (index > -1) {
                this.selectedGroups.splice(index, 1);
            } else {
                this.selectedGroups.push(group);
            }
        },
        toggleAllGroups(event) {
            if (event.target.checked) {
                this.selectedGroups = [...this.availableGroups];
            } else {
                this.selectedGroups = [];
            }
        },
        handleClickOutside(event) {
            // Close dropdown if clicking outside
            const dropdown = event.target.closest('.dropdown-wrapper');
            if (!dropdown && this.showGroupDropdown) {
                this.showGroupDropdown = false;
            }
        },
        applyOpacityToColor(color, opacity) {
            // Convert hex color to rgba with opacity
            if (color.startsWith('#')) {
                const hex = color.slice(1);
                const r = parseInt(hex.substr(0, 2), 16);
                const g = parseInt(hex.substr(2, 2), 16);
                const b = parseInt(hex.substr(4, 2), 16);
                return `rgba(${r}, ${g}, ${b}, ${opacity})`;
            }
            // If already rgba, extract rgb and apply new opacity
            if (color.startsWith('rgba')) {
                const rgb = color.match(/\d+/g);
                if (rgb && rgb.length >= 3) {
                    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${opacity})`;
                }
            }
            // Fallback: return original color
            return color;
        },
        downloadImage(ID, NAME, TYPE) {
            if (TYPE == "svg") {
                this.$refs[this.canvasId + "_pheWasPlot"].renderPlot();
                this.utils.uiUtils.downloadImg(
                    ID,
                    NAME,
                    TYPE,
                    "vector_pheWas_plot_" + this.canvasId
                );
            } else if (TYPE == "png") {
                this.utils.uiUtils.downloadImg(ID, NAME, TYPE);
            }
        },
        openPage(PAGE, PARAMETER) {
            this.utils.uiUtils.openPage(PAGE, PARAMETER);
        },
        addPhenotype(PHENOTYPE) {
            this.$parent.$parent.pushCriterionPhenotype(PHENOTYPE);
            window.location.href = "#associations-table";
        },
        groupData(DATA) {
            let phenotypeGroups = [];
            let phenotypeGroupsObj = {};
            const groupByField = this.renderConfig["group by"];

            // Check phenotype map config first
            if (this.phenotypeMapConfig == "kpPhenotypeMap") {
                // Use phenotype map groups
                for (const [key, value] of Object.entries(this.phenotypeMap)) {
                    phenotypeGroups.push(value);
                }

                phenotypeGroups = [
                    ...new Set(phenotypeGroups.map((p) => p.group)),
                ].sort();
            } else if (this.phenotypeMapConfig == null && groupByField) {
                // No phenotype map - use group by field directly
                phenotypeGroups = [
                    ...new Set(
                        DATA.data.map((p) => {
                            const value = p[groupByField];
                            return (value != null && value !== undefined && value !== '') ? value : 'N/A';
                        })
                    ),
                ].sort();
            }

            // Always include 'N/A' group if using phenotype map (in case some items don't have a group)
            if (this.phenotypeMapConfig == "kpPhenotypeMap" && !phenotypeGroups.includes('N/A')) {
                phenotypeGroups.push('N/A');
                phenotypeGroups.sort();
            }

            phenotypeGroups.map((p) => {
                phenotypeGroupsObj[p] = [];
            });

            DATA.data.map((p) => {
                let group;
                if (this.phenotypeMapConfig == "kpPhenotypeMap") {
                    // Use phenotype map groups
                    const renderByValue = p[this.renderConfig["render by"]];
                    if (this.phenotypeMap[renderByValue] && this.phenotypeMap[renderByValue].group) {
                        group = this.phenotypeMap[renderByValue].group;
                    } else {
                        group = 'N/A';
                    }
                } else if (this.phenotypeMapConfig == null && groupByField) {
                    // No phenotype map - use group by field directly
                    const value = p[groupByField];
                    if (value != null && value !== undefined && value !== '') {
                        group = value;
                    } else {
                        group = 'N/A';
                    }
                }

                // Always assign to a group (either the actual group or 'N/A')
                if (group) {
                    phenotypeGroupsObj[group].push(p);
                }
            });
            /*
			for (const [key, value] of Object.entries(phenotypeGroupsObj)) {
				value.sort((a, b) =>
					a[this.renderConfig["y axis field"]] >
					b[this.renderConfig["y axis field"]]
						? 1
						: -1
				);
			}*/

            return phenotypeGroupsObj;
        },
        onResize() {
            this.renderPheWas();
        },
        checkPosition(event, TYPE) {
            let e = event;
            let rect = e.target.getBoundingClientRect();

            let rawX = e.clientX - rect.left;
            let rawY = e.clientY - rect.top;

            let customPlotMargin = this.renderConfig["plot margin"]
                ? this.renderConfig["plot margin"]
                : null;

            let plotMargin = customPlotMargin
                ? {
                      left: customPlotMargin.left,
                      right: customPlotMargin.right,
                      top: customPlotMargin.top,
                      bottom: customPlotMargin.bottom,
                      bump: 10,
                  }
                : {
                      left: this.plotMargin.leftMargin / 2,
                      right: (this.plotMargin.leftMargin / 2) * 1.5,
                      top: (this.plotMargin.bottomMargin / 2) * 3.5,
                      bottom: (this.plotMargin.bottomMargin / 2) * 2.5,
                      bump: 10,
                  };

            let y = Math.ceil(e.clientY - rect.top);
            let x = Math.ceil(e.clientX - rect.left);

            const infoBox = document.querySelector(
                "#" + this.canvasId + "pheWasInfoBox"
            );
            const infoBoxContent = document.querySelector(
                "#" + this.canvasId + "pheWasInfoBoxContent"
            );
            const infoBoxClose = document.querySelector(
                "#" + this.canvasId + "info_box_close"
            );
            if (infoBox.getAttribute("class").includes("fixed") == false) {
                let infoContent = "";
                this.hoverItems = {};
                if (
                    x >= plotMargin.left / 2 &&
                    x <= rect.width - plotMargin.right / 2
                ) {
                    for (const [yKey, yValue] of Object.entries(
                        this.pheWasPosData
                    )) {
                        let yLoc = yKey.split("-");

                        if (y >= yLoc[0] && y <= yLoc[1]) {
                            yValue.map((xPos) => {
                                if (x >= xPos.start && x <= xPos.end) {
                                    this.hoverItems[xPos.id] = xPos;
                                    infoContent += `<strong>${xPos.name}</strong><br />`;
                                    this.renderConfig["hover content"].map(
                                        (h) => {
                                            infoContent +=
                                                h +
                                                ":" +
                                                xPos.data[h] +
                                                "<br />";
                                        }
                                    );
                                }
                            });
                        }
                    }
                }

                if (TYPE == "hover") {
                    if (
                        Object.keys(this.hoverItems).length > 0 &&
                        !!this.isPigean
                    ) {
                        this.$emit(
                            "dotsHovered",
                            JSON.stringify(this.hoverItems)
                        );
                    }
                    if (infoContent == "") {
                        if (
                            infoBox.getAttribute("class").includes("fixed") ==
                            false
                        ) {
                            //infoBoxContent.innerHTML = "";
                            infoBox.setAttribute("class", "hidden");
                            infoBoxClose.setAttribute("class", "hidden");
                        }
                    } else {
                        if (
                            infoBox.getAttribute("class").includes("fixed") ==
                            false
                        ) {
                            //infoBoxContent.innerHTML = infoContent;
                            infoBox.setAttribute("class", "phe-was-info-box");
                            infoBoxClose.setAttribute("class", "hidden");
                            if (x < rect.width - 300) {
                                infoBox.style.left = rawX + 25 + "px";
                                infoBox.style.top = rawY + this.spaceBy + "px";
                            } else {
                                infoBox.style.left = rawX - 325 + "px";
                                infoBox.style.width = "300px !important";
                                infoBox.style.top = rawY + this.spaceBy + "px";
                            }
                        }
                    }
                }

                if (TYPE == "click") {
                    infoBoxClose.setAttribute("class", "fixed-info-box-close");
                    if (infoContent == "") {
                        //infoBoxContent.innerHTML = "";
                        infoBox.setAttribute("class", "hidden");
                    } else {
                        //infoBoxContent.innerHTML = infoContent;
                        infoBox.setAttribute("class", "phe-was-info-box fixed");
                        if (x < rect.width - 300) {
                            infoBox.style.left = rawX + 25 + "px";
                            infoBox.style.top = rawY + this.spaceBy + "px";
                        } else {
                            infoBox.style.left = rawX - 325 + "px";
                            infoBox.style.width = "300px !important";
                            infoBox.style.top = rawY + this.spaceBy + "px";
                        }
                    }
                }
            }
        },
        renderPheWas() {
            // Early return if renderData is not ready
            if (!this.renderData || !this.renderData.data || this.renderData.data.length === 0) {
                return;
            }
            
            if (
                !!this.renderConfig["thresholds"] &&
                this.renderConfig["thresholds"] == "calculate"
            ) {
                let threshholds = [];
                this.renderConfig["thresholds calculate"].map((expression) => {
                    let calcString = "";

                    expression.map((e) => {
                        let eValue = ["+", "-", "*", "/", "(", ")"].includes(e)
                            ? e
                            : typeof e === "number"
                            ? e
                            : typeof e === "string"
                            ? e == "data length"
                                ? this.renderData.data.length
                                : null
                            : null;

                        calcString += eValue;
                    });

                    let threshold = eval(calcString);

                    threshholds.push(threshold);
                });
                this.renderConfig["thresholds"] = threshholds;
            }

            let wrapper = document.querySelector(
                "#" + this.canvasId + "pheWasPlotWrapper"
            );
            let canvas = document.querySelector(
                "#" + this.canvasId + "pheWasPlot"
            );

            if (!!canvas && !!wrapper) {
                let canvasWidth = this.renderConfig.width
                    ? this.renderConfig.width * 2
                    : wrapper.clientWidth * 2;
                let canvasHeight = Number(this.renderConfig["height"]) * 2;

                let c, ctx;
                c = document.querySelector("#" + this.canvasId + "pheWasPlot");
                c.setAttribute("width", canvasWidth);
                c.setAttribute("height", canvasHeight);
                c.setAttribute(
                    "style",
                    "width:" +
                        canvasWidth / 2 +
                        "px;height:" +
                        canvasHeight / 2 +
                        "px;"
                );
                ctx = c.getContext("2d");

                ctx.clearRect(0, 0, canvasWidth, canvasHeight);

                this.pheWasPosData = {};

                let renderData = this.groupData(this.renderData);

                let groups = {};
                let totalNum = 0;

                let minY = null;
                let maxY = null;

                // Determine which fields to use for min/max calculation - use ALL fields if multiple y-axis
                const fieldsForMinMax = this.hasMultipleYAxisFields
                    ? this.yAxisFields
                    : [this.renderConfig["y axis field"]];

                for (const [key, value] of Object.entries(renderData)) {
                    groups[key] = value.length;
                    totalNum += value.length;
                    value.map((p) => {
                        // Calculate min/max across all fields
                        fieldsForMinMax.forEach(field => {
                            let yValue;
                            if (this.renderConfig["convert y -log10"] == "true") {
                                const logField = field + "-log10";
                                yValue = p[logField] !== undefined ? Number(p[logField]) : null;
                            } else {
                                yValue = p[field] !== undefined && p[field] !== null ? Number(p[field]) : null;
                            }
                            
                            if (yValue !== null && !isNaN(yValue)) {
                                minY = minY == null ? yValue : yValue < minY ? yValue : minY;
                                maxY = maxY == null ? yValue : yValue > maxY ? yValue : maxY;
                            }
                        });
                    });
                }
                minY = Math.floor(minY);
                maxY = Math.ceil(maxY);

                if (minY == maxY) {
                    minY -= 0.5;
                    maxY += 0.5;
                }

                ctx.stroke();

                let customPlotMargin = this.renderConfig["plot margin"]
                    ? this.renderConfig["plot margin"]
                    : null;
                let plotMargin = customPlotMargin
                    ? {
                          left: customPlotMargin.left,
                          right: customPlotMargin.right,
                          top: customPlotMargin.top,
                          bottom: customPlotMargin.bottom,
                          bump: 10,
                      }
                    : {
                          left: this.plotMargin.leftMargin / 2,
                          right: (this.plotMargin.leftMargin / 2) * 1.5,
                          top: (this.plotMargin.bottomMargin / 2) * 3.5,
                          bottom: (this.plotMargin.bottomMargin / 2) * 2.5,
                          bump: 10,
                      };

                if (this.renderData.data.length > 1) {
                    this.utils.plotUtils.renderAxisWBump(
                        ctx,
                        canvasWidth,
                        canvasHeight,
                        plotMargin,
                        "y",
                        5,
                        minY,
                        maxY,
                        this.renderConfig["y axis label"]
                    );
                }

                this.utils.plotUtils.renderAxisWBump(
                    ctx,
                    canvasWidth,
                    canvasHeight,
                    plotMargin,
                    "x",
                    null,
                    null,
                    null,
                    this.renderConfig["x axis label"]
                );

                this.renderTicksByGroup(
                    ctx,
                    canvasWidth,
                    canvasHeight,
                    plotMargin,
                    "x",
                    groups
                );

                let xStep =
                    (canvasWidth - plotMargin.left - plotMargin.right) /
                    totalNum;

                let yMax = maxY;
                let yMin = minY;

                // render Y ticks
                let yStep =
                    (canvasHeight - (plotMargin.top + plotMargin.bottom)) /
                    (yMax - yMin);

                /// render guide line
                //

                this.renderConfig["thresholds"].map((t) => {
                    ctx.beginPath();
                    let tValue =
                        this.renderConfig["convert y -log10"] == "true"
                            ? -Math.log10(Number(t))
                            : Number(t);

                    let yFromMinYGuide = -minY + tValue;

                    let guidelineYpos =
                        canvasHeight -
                        plotMargin.bottom -
                        yFromMinYGuide * yStep;

                    ctx.setLineDash([20, 10]);
                    ctx.moveTo(
                        plotMargin.left - plotMargin.bump,
                        guidelineYpos
                    );
                    ctx.lineTo(
                        canvasWidth + plotMargin.bump - plotMargin.right,
                        guidelineYpos
                    );
                    ctx.strokeStyle = "#FFAA00";
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    ctx.closePath();
                });

                ctx.setLineDash([]); // Set annoying line dash back to normal

                let groupsArr = Object.keys(groups).sort();

                let dotIndex = 0;
                let pigeanColors = {};

                if (totalNum > 1) {
                    for (const [key, value] of Object.entries(renderData)) {
                        let keyIndex =
                            groupsArr.indexOf(key) % this.colors.length;
                        let fillColor = this.colors[keyIndex];
                        let strokeColor = "#00000075"; //this.colors[keyIndex];
                        pigeanColors[key] = fillColor;
                        let labelIndex = 0;
                        let labelOrigin = 0;
                        let maxWidthPerGroup =
                            plotMargin.left +
                            xStep * dotIndex +
                            xStep * value.length -
                            24;

                        value.map((p) => {
                            // Check phenotype map config first
                            const renderByField = this.renderConfig["render by"];
                            const shouldRender = this.phenotypeMapConfig == null ||
                                (this.phenotypeMapConfig == "kpPhenotypeMap" &&
                                    !!this.phenotypeMap[p[renderByField]]);
                            
                            if (shouldRender) {
                                let xPos =
                                    plotMargin.left + xStep * (dotIndex + 0.5);

                                let rawValue = p[this.renderConfig["render by"]];
                                let pName;
                                if (this.phenotypeMapConfig == "kpPhenotypeMap") {
                                    // Use phenotype map description
                                    pName = this.phenotypeMap[rawValue] && this.phenotypeMap[rawValue]["description"]
                                        ? this.phenotypeMap[rawValue]["description"]
                                        : rawValue;
                                } else if (this.phenotypeMapConfig == null) {
                                    // No phenotype map - use raw value
                                    pName = rawValue;
                                }
                                
                                // Determine which fields to render - use ALL fields if multiple y-axis
                                const fieldsToRender = this.hasMultipleYAxisFields
                                    ? this.yAxisFields
                                    : [this.renderConfig["y axis field"]];
                                
                                const multipleFieldsSelected = fieldsToRender.length > 1;
                                
                                fieldsToRender.forEach((field, fieldIndex) => {
                                    // Skip if field is not selected (when user unchecks a checkbox)
                                    // But if no fields are selected, render all (initial state)
                                    if (this.hasMultipleYAxisFields && 
                                        this.selectedYAxisFields.length > 0 && 
                                        !this.selectedYAxisFields.includes(field)) {
                                        return;
                                    }
                                    
                                    // Get shape for this field
                                    const fieldShape = this.getFieldShape(field);
                                    let yValue;
                                    if (this.renderConfig["convert y -log10"] == "true") {
                                        const logField = field + "-log10";
                                        yValue = p[logField] !== undefined ? Number(p[logField]) : null;
                                    } else {
                                        yValue = p[field] !== undefined && p[field] !== null && p[field] != 0
                                            ? Number(p[field])
                                            : null;
                                    }
                                    
                                    if (yValue === null || isNaN(yValue)) {
                                        return; // Skip if no valid value
                                    }

                                    let yFromMinY = -minY + yValue;
                                    let yPos =
                                        canvasHeight -
                                        plotMargin.bottom -
                                        yFromMinY * yStep;
                                    
                                    // Determine opacity: primary field = 100%, others = 50%
                                    let opacity = 1.0;
                                    if (multipleFieldsSelected) {
                                        if (field === this.primaryYAxisField) {
                                            opacity = 1.0;
                                        } else {
                                            opacity = 0.5;
                                        }
                                    }
                                    
                                    // Apply opacity to colors
                                    let fieldFillColor = this.applyOpacityToColor(fillColor, opacity);
                                    let fieldStrokeColor = this.applyOpacityToColor(strokeColor, opacity);
                                    
                                    // Calculate threshold check using primary field
                                    let passesThreshold = false;
                                    if (field === this.primaryYAxisField || !this.hasMultipleYAxisFields) {
                                        passesThreshold = this.greaterThan
                                            ? p.rawPValue >= Number(this.renderConfig["thresholds"][0])
                                            : p.rawPValue <= Number(this.renderConfig["thresholds"][0]);
                                    }

                                    if (
                                        this.renderConfig["beta field"] != "null" &&
                                        !!this.renderConfig["beta field"]
                                    ) {
                                        if (
                                            !!p[this.renderConfig["beta field"]] &&
                                            p[this.renderConfig["beta field"]] != 0
                                        ) {
                                            this.renderTriangle(
                                                ctx,
                                                xPos,
                                                yPos,
                                                fieldFillColor,
                                                fieldStrokeColor,
                                                Math.sign(
                                                    p[
                                                        this.renderConfig[
                                                            "beta field"
                                                        ]
                                                    ]
                                                )
                                            );
                                        } else {
                                            // Render with shape based on field
                                            this.renderShape(
                                                ctx,
                                                xPos,
                                                yPos,
                                                fieldFillColor,
                                                fieldStrokeColor,
                                                fieldShape
                                            );
                                        }
                                    } else {
                                        // GENE PAGE PIGEAN PHEWAS - Render with shape based on field
                                        this.renderShape(
                                            ctx,
                                            xPos,
                                            yPos,
                                            fieldFillColor,
                                            fieldStrokeColor,
                                            fieldShape
                                        );
                                    }
                                    
                                    // Only store position data for primary field (or first field if single)
                                    if (field === this.primaryYAxisField || (!this.hasMultipleYAxisFields && fieldIndex === 0)) {
                                        ///organize data by position
                                        let yRangeStart = Math.round(yPos / 2) - 5;
                                        let yRangeEnd = Math.round(yPos / 2) + 5;
                                        let yRange = yRangeStart + "-" + yRangeEnd;
                                        let tempObj = {};
                                        this.renderConfig["hover content"].map((c) => {
                                            tempObj[c] = p[c];
                                        });
                                        let xRange = {
                                            start: Math.round(xPos / 2) - 5,
                                            end: Math.round(xPos / 2) + 5,
                                            data: tempObj,
                                            name: pName,
                                            id: p[this.renderConfig["render by"]],
                                        };

                                        if (!this.pheWasPosData[yRange]) {
                                            this.pheWasPosData[yRange] = [];
                                        }
                                        this.pheWasPosData[yRange].push(xRange);
                                    }
                                });
                                
                                // Only render labels once (using primary field position)
                                if (fieldsToRender.length > 0) {
                                    const primaryField = this.hasMultipleYAxisFields 
                                        ? this.primaryYAxisField 
                                        : fieldsToRender[0];
                                    let primaryYValue;
                                    if (this.renderConfig["convert y -log10"] == "true") {
                                        const logField = primaryField + "-log10";
                                        primaryYValue = p[logField] !== undefined ? Number(p[logField]) : null;
                                    } else {
                                        primaryYValue = p[primaryField] !== undefined && p[primaryField] !== null && p[primaryField] != 0
                                            ? Number(p[primaryField])
                                            : null;
                                    }
                                    
                                    if (primaryYValue !== null && !isNaN(primaryYValue)) {
                                        let yFromMinY = -minY + primaryYValue;
                                        let yPos =
                                            canvasHeight -
                                            plotMargin.bottom -
                                            yFromMinY * yStep;
                                        
                                        let passesThreshold = this.greaterThan
                                            ? p.rawPValue >= Number(this.renderConfig["thresholds"][0])
                                            : p.rawPValue <= Number(this.renderConfig["thresholds"][0]);

                                        ///add labels if p-value above 2.5e-6
                                        if (labelIndex == 0) {
                                            labelOrigin = xPos;
                                        }

                                        //if (labelIndex == 0 || p.pValue <= 2.5e-6) {
                                        let labelXpos = labelOrigin + 24 * labelIndex;

                                        labelXpos = xPos > labelXpos ? xPos : labelXpos;
                                        if (
                                            labelIndex == 0 ||
                                            labelXpos < maxWidthPerGroup //|| passesThreshold
                                            // This is incredibly messy
                                        ) {
                                            ctx.font = "22px Arial";
                                            ctx.fillStyle = passesThreshold
                                                ? "#000000"
                                                : "#00000050";

                                            ctx.save();
                                            ctx.translate(labelXpos + 10, yPos - 24);
                                            ctx.rotate((90 * -Math.PI) / 180);
                                            ctx.textAlign = "start";
                                            ctx.fillText(pName, 0, 0);
                                            ctx.restore();

                                            ctx.lineWidth = 1;
                                            ctx.moveTo(xPos, yPos);
                                            ctx.lineTo(labelXpos, yPos - 20);
                                            ctx.strokeStyle = "#00000080";
                                            ctx.stroke();
                                        }

                                        labelIndex++;
                                        //}
                                    }
                                }
                                dotIndex++;
                            }
                        });
                        keyIndex++;
                    }
                } else {
                    for (const [key, value] of Object.entries(renderData)) {
                        let keyIndex =
                            groupsArr.indexOf(key) % this.colors.length;
                        let fillColor = this.colors[keyIndex];
                        pigeanColors[key] = fillColor;
                        let strokeColor = "#00000075"; //this.colors[keyIndex];
                        value.map((p) => {
                            let xPos = canvasWidth / 2;

                            let yPos = canvasHeight / 2;

                            // Check phenotype map config first
                            const renderByField = this.renderConfig["render by"];
                            const shouldRender = this.phenotypeMapConfig == null ||
                                (this.phenotypeMapConfig == "kpPhenotypeMap" &&
                                    !!this.phenotypeMap[p[renderByField]]);
                            
                            if (shouldRender) {
                                if (
                                    !!p[this.renderConfig["beta field"]] &&
                                    p[this.renderConfig["beta field"]] != 0
                                ) {
                                    this.renderTriangle(
                                        ctx,
                                        xPos,
                                        yPos,
                                        fillColor,
                                        strokeColor,
                                        Math.sign(
                                            p[this.renderConfig["beta field"]]
                                        )
                                    );
                                } else {
                                    this.renderDot(
                                        ctx,
                                        xPos,
                                        yPos,
                                        fillColor,
                                        strokeColor
                                    );
                                }

                                const rawValue = p[renderByField];
                                let pName;
                                if (this.phenotypeMapConfig == "kpPhenotypeMap") {
                                    // Use phenotype map description
                                    pName = this.phenotypeMap[rawValue] && this.phenotypeMap[rawValue]["description"]
                                        ? this.phenotypeMap[rawValue]["description"]
                                        : rawValue;
                                } else if (this.phenotypeMapConfig == null) {
                                    // No phenotype map - use raw value
                                    pName = rawValue;
                                }

                                ///organize data by position
                                let yRangeStart = Math.round(yPos) - 5;
                                let yRangeEnd = Math.round(yPos) + 5;
                                let yRange = yRangeStart + "-" + yRangeEnd;
                                let tempObj = {};
                                this.renderConfig["hover content"].map((c) => {
                                    tempObj[c] = p[c];
                                });
                                let xRange = {
                                    start: Math.round(xPos) - 5,
                                    end: Math.round(xPos) + 5,
                                    data: tempObj,
                                    name: pName,
                                };

                                if (!this.pheWasPosData[yRange]) {
                                    this.pheWasPosData[yRange] = [];
                                }
                                this.pheWasPosData[yRange].push(xRange);

                                ctx.font = "26px Arial";
                                ctx.fillStyle = "#000000";
                                ctx.textAlign = "start";
                                ctx.fillText(pName, xPos + 15, yPos);
                                let infoIndex = 1;
                                this.renderConfig["hover content"].map((h) => {
                                    ctx.fillText(
                                        h + ": " + p[h],
                                        xPos + 15,
                                        yPos + infoIndex * 40
                                    );
                                    infoIndex++;
                                });
                            }
                        });
                    }
                }
                this.$emit("pigeanColors", pigeanColors);
            }
        },

        renderDot(CTX, XPOS, YPOS, DOT_COLOR, STROKE_COLOR) {
            CTX.beginPath();
            CTX.arc(XPOS, YPOS, 10, 0, 2 * Math.PI);

            CTX.fillStyle = DOT_COLOR;
            CTX.fill();
            CTX.lineWidth = 1;
            CTX.strokeStyle = STROKE_COLOR;
            CTX.stroke();
            //
        },
        renderShape(CTX, XPOS, YPOS, FILL_COLOR, STROKE_COLOR, SHAPE) {
            CTX.beginPath();
            const size = 10;
            
            if (SHAPE === 'circle') {
                CTX.arc(XPOS, YPOS, size, 0, 2 * Math.PI);
            } else if (SHAPE === 'square') {
                CTX.rect(XPOS - size, YPOS - size, size * 2, size * 2);
            } else if (SHAPE === 'diamond') {
                CTX.moveTo(XPOS, YPOS - size);
                CTX.lineTo(XPOS + size, YPOS);
                CTX.lineTo(XPOS, YPOS + size);
                CTX.lineTo(XPOS - size, YPOS);
                CTX.closePath();
            } else {
                // Default to circle
                CTX.arc(XPOS, YPOS, size, 0, 2 * Math.PI);
            }
            
            CTX.fillStyle = FILL_COLOR;
            CTX.fill();
            CTX.lineWidth = 1;
            CTX.strokeStyle = STROKE_COLOR;
            CTX.stroke();
        },

        renderTriangle(CTX, XPOS, YPOS, DOT_COLOR, STROKE_COLOR, EFFECT) {
            CTX.beginPath();
            if (EFFECT == 1) {
                CTX.moveTo(XPOS - 10, YPOS + 10);
                CTX.lineTo(XPOS + 10, YPOS + 10);
                CTX.lineTo(XPOS, YPOS - 10);
            }
            if (EFFECT == -1) {
                CTX.moveTo(XPOS - 10, YPOS - 10);
                CTX.lineTo(XPOS, YPOS + 10);
                CTX.lineTo(XPOS + 10, YPOS - 10);
            }
            CTX.closePath();

            CTX.fillStyle = DOT_COLOR;
            CTX.fill();
            CTX.lineWidth = 1;
            CTX.strokeStyle = STROKE_COLOR;
            CTX.stroke();
        },

        renderTicksByGroup(CTX, WIDTH, HEIGHT, MARGIN, DIRECTION, GROUPS) {
            let groupsArr = Object.keys(GROUPS).sort();
            let totalNum = 0;
            for (const [key, value] of Object.entries(GROUPS)) {
                totalNum += value;
            }

            CTX.beginPath();
            CTX.lineWidth = 1;
            CTX.strokeStyle = "#000000";
            CTX.font = "22px Arial";
            CTX.fillStyle = "#000000";
            CTX.setLineDash([]); // cancel dashed line incase dashed lines rendered some where

            switch (DIRECTION) {
                case "x":
                    let xTickDistance =
                        (WIDTH - MARGIN.left - MARGIN.right) / totalNum;

                    let previousGroup = 0;
                    for (const [key, value] of Object.entries(GROUPS)) {
                        if (value > 0) {
                            let tickXPos =
                                MARGIN.left +
                                (previousGroup + 0.5) * xTickDistance;
                            let adjTickXPos = Math.floor(tickXPos);
                            CTX.moveTo(
                                adjTickXPos,
                                HEIGHT - MARGIN.bottom + MARGIN.bump
                            );
                            CTX.lineTo(
                                adjTickXPos,
                                HEIGHT - MARGIN.bottom + MARGIN.bump * 2
                            );
                            CTX.stroke();

                            let keyIndex =
                                groupsArr.indexOf(key) % this.colors.length;
                            CTX.fillStyle = this.colors[keyIndex];
                            CTX.save();
                            CTX.translate(
                                adjTickXPos,
                                HEIGHT - MARGIN.bottom + MARGIN.bump * 2
                            );
                            CTX.rotate((45 * Math.PI) / 180);
                            CTX.textAlign = "start";
                            CTX.fillText(key, 0, 15);
                            //CTX.rotate((45 * Math.PI) / 180);
                            CTX.restore();

                            previousGroup += value;
                        }
                    }

                    break;
                case "y":
                    /// leave it empty in case we need it later
                    break;
            }
        },

        checkStared(ITEM) {
            let selectedItems = this.pkgDataSelected
                .filter((s) => s.type == this.renderConfig["star key"])
                .map((s) => s.id);

            if (selectedItems.includes(ITEM)) {
                return true;
            } else {
                return false;
            }
        },
        addStarItem(ITEM) {
            this.$store.dispatch("pkgDataSelected", {
                type: this.renderConfig["star key"],
                id: ITEM,
                action: "add",
            });
        },
        removeStarItem(ITEM) {
            this.$store.dispatch("pkgDataSelected", {
                type: this.renderConfig["star key"],
                id: ITEM,
                action: "remove",
            });
        },
        phenotypeLink(rawPhenotype) {
            let destination = `/phenotype.html?phenotype=${rawPhenotype}`;
            if (this.isPigean) {
                let suffix = `&genesetSize=${
                    this.$store.state.genesetSize ||
                    bioIndexUtils.DEFAULT_GENESET_SIZE
                }&traitGroup=${
                    this.$store.state.traitGroup ||
                    bioIndexUtils.DEFAULT_TRAIT_GROUP
                }`;
                destination = `/pigean${destination}${suffix}`;
            }
            return destination;
        },
    },
});
</script>

<style>
.fixed-info-box-close {
    position: absolute;
    top: 0;
    right: 3px;
    font-size: 14px;
    color: #69f;
}
.phe-was-info-box {
    position: absolute;
    background-color: #fff;
    border: solid 1px #ddd;
    border-radius: 5px;
    padding: 5px 15px;
    z-index: 11;
    font-size: 13px;
    min-width: 200px !important;
    max-width: 400px !important;
}
.option-button {
    font-size: 12px;
    border: solid 1px #aaaaaa;
    border-radius: 10px;
    display: block;
    /* padding: 1px 5px; */
    margin-bottom: 3px;
}
.y-axis-fields-selector {
    margin-bottom: 10px;
    padding: 10px;
    background-color: #f5f5f5;
    border-radius: 4px;
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    align-items: center;
}
.y-axis-field-checkbox {
    display: flex;
    align-items: center;
    cursor: pointer;
    font-size: 14px;
    user-select: none;
}
.y-axis-field-checkbox input[type="checkbox"] {
    margin-right: 5px;
    cursor: pointer;
}
.y-axis-field-checkbox span {
    color: #333;
}
.y-axis-field-checkbox .shape-symbol {
    font-size: 200%;
    display: inline-block;
    vertical-align: -2px;
    line-height: 0;
    margin-right: 0px;
}
.threshold-filter-checkbox {
    margin-left: 20px;
    padding-left: 15px;
    border-left: 1px solid #ddd;
}
.threshold-filter-checkbox span {
    font-weight: 500;
}
.phenotype-group-filter-inline {
    margin-left: 20px;
    padding-left: 15px;
    border-left: 1px solid #ddd;
    display: inline-flex;
    align-items: center;
}
.dropdown-wrapper {
    position: relative;
    display: inline-block;
}
.dropdown-wrapper button {
    display: flex;
    align-items: center;
    gap: 5px;
}
.group-dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 5px;
    background-color: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    min-width: 200px;
    max-height: 300px;
    overflow-y: auto;
}
.group-dropdown-header {
    padding: 8px 12px;
    border-bottom: 1px solid #eee;
    background-color: #f5f5f5;
}
.select-all-groups {
    display: flex;
    align-items: center;
    cursor: pointer;
    font-weight: 500;
    font-size: 13px;
}
.select-all-groups input[type="checkbox"] {
    margin-right: 6px;
    cursor: pointer;
}
.group-dropdown-content {
    padding: 5px 0;
    max-height: 250px;
    overflow-y: auto;
}
.group-checkbox-item {
    display: flex;
    align-items: center;
    padding: 6px 12px;
    cursor: pointer;
    font-size: 13px;
}
.group-checkbox-item:hover {
    background-color: #f0f0f0;
}
.group-checkbox-item input[type="checkbox"] {
    margin-right: 8px;
    cursor: pointer;
}
.group-checkbox-item span {
    color: #333;
    user-select: none;
}
</style>
