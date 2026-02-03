import Vue from "vue";
import Template from "./Template.vue";

import "../../assets/matkp-styles.css";
import { fetchMetadata } from "@/components/researchPortal/singleCellBrowser/singleCellUtils.js";
import { matkpMixin } from "../../mixins/matkpMixin.js";

//import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";
//const BIO_INDEX_HOST = "https://bioindex-dev.hugeamp.org";
const BIO_INDEX_HOST = "https://matkp.hugeampkpnbi.org";
const METADATA_URL = `${BIO_INDEX_HOST}/api/raw/file/single_cell_all_metadata/dataset_metadata.json.gz`;

new Vue({
    components: {
    },
    mixins: [matkpMixin],

    data() {
        return {
            config_pageid: 'matkp_config',
            config: null,
            datasets: null,
            datasetsFlat: null,
            filter: null,
            selectedFilters: {},
            searchedItems: [],
            perPage: 10,
            currentPage: 1,
            pageOptions: [
                { value: 5, text: "5" },
                { value: 10, text: "10" },
                { value: 15, text: "20" },
                { value: 100, text: "All" },
            ],
            first: 2,
        };
    },

    mounted() {
        document
            .querySelector(".input-overlay")
            .addEventListener("click", this.handleClickOutside);
    },

    async created() {
        await this.getConfig();
        const datasets = await fetchMetadata(METADATA_URL);
        this.datasets = datasets;
        this.datasetsFlat = this.flattenDatasets(datasets);
    },

    watch: {
        filterOptions: {
            handler(newVal) {
                Object.keys(newVal).forEach((key) => {
                    if (!this.selectedFilters[key]) {
                        this.$set(this.selectedFilters, key, []);
                    }
                });
                this.updatePageFromQueryString();
            },
        },
        selectedFilters: {
            handler(newVal) {
                this.updateQueryStringFromPage(this.selectedFilters);
            },
            deep: true,
        },
    },

    computed: {
        allFields() {
            return this.config.columnLabels;
        },
        filterOptions() {
            const filterOptions = {};

            if (!this.datasetsFlat || !this.config) return filterOptions;

            const fieldKeys = this.config.datasetsFilters;

            console.log({fieldKeys})

            this.datasetsFlat.forEach((item) => {
                fieldKeys.forEach((key) => {
                    //console.log('  ',key, item[key]);
                    if (!filterOptions[key]) {
                        filterOptions[key] = new Set();
                    }
                    const itemKeyArr = item[key]
                        ? typeof item[key] === "string"
                            ? [item[key]]
                            : [...item[key]]
                        : [""]
                    itemKeyArr.forEach((value) => {
                        if (value.trim() !== "") filterOptions[key].add(value);
                        //console.log('      ',value);
                    });
                });
            });

            // Convert Sets to arrays and create options for select
            Object.keys(filterOptions).forEach((key) => {
                filterOptions[key] = Array.from(filterOptions[key]);
            });

            console.log("filterOptions", filterOptions);

            return filterOptions;
        },
        mainFields() {
            if (!this.datasetsFlat || !this.config) return null;
            let fields = [];
            this.config.datasetsColumns.forEach((column) => {
                fields.push({
                    key: column,
                    label: this.config.columnLabels[column],
                    sortable: true,
                });
            });
            fields = [
                ...fields,
                ...[
                    { key: "show_details", label: "", sortable: false },
                    //{ key: "download", label: "", sortable: false },
                    { key: "datasetId", label: "", sortable: false },
                ],
            ];
            console.log("mainFields", fields);
            return fields;
        },
        subFields() {
            if (!this.datasetsFlat || !this.config) return null;
            const fields = [];
            this.config.datasetsExtraColumns.forEach((column) => {
                fields.push({
                    key: column,
                    label: this.config.columnLabels[column],
                    sortable: true,
                });
            });
            fields.push({ key: "download", label: "Raw Data", sortable: false });
            fields.push({ key: "download_public", label: "Processed Data", sortable: false });
            //console.log('subFields', fields);
            return fields;
        },
        filteredItems() {
            if (!this.datasetsFlat) return [];
            const items = this.datasetsFlat.filter((item) => {
                return Object.keys(this.selectedFilters).every((key) => {
                    if (this.selectedFilters[key].length === 0) return true;
                    return this.selectedFilters[key].some((filterValue) =>
                        item[key]?.includes(filterValue)
                    );
                });
            });
            console.log({items})
            return items;
        },
        rows() {
            if (!this.datasetsFlat) return 0;
            if (this.filter) {
                if (
                    this.searchedItems.length > 0 ||
                    this.filteredItems.length < this.datasetsFlat.length
                ) {
                    if (
                        this.searchedItems.length > 0 &&
                        this.filteredItems.length < this.searchedItems.length
                    )
                        return this.filteredItems.length;
                    return this.searchedItems.length;
                }
                return 0;
            }
            if (this.filteredItems.length < this.datasetsFlat.length)
                return this.filteredItems.length;
            return this.datasetsFlat.length;
        },
    },

    methods: {
        async getConfig() {
            const dataPoint =
                `https://hugeampkpncms.org/rest/data?pageid=${this.config_pageid}`;
            const result = await fetch(dataPoint).then((resp) => resp.json());
            const json = JSON.parse(result[0]["field_data_points"]);
            this.config = json;
            console.log("config", json);
        },
        flattenDatasets(datasets){
            return datasets.map(obj => {
                const { required_sample_properties, custom_sample_properties, ...rest } = obj;
                return {
                    ...rest,
                    ...required_sample_properties,
                    ...custom_sample_properties
                };
            });
        },
        updateQueryStringFromPage(selectedFilters) {
            console.log("updateFromPage");
            const queryParams = [];
            for (const [key, value] of Object.entries(selectedFilters)) {
                if (value.length > 0) {
                    const encodedValues = value
                        .map((v) => encodeURIComponent(v.toLowerCase()))
                        .join(",");
                    queryParams.push(
                        `${encodeURIComponent(key)}=${encodedValues}`
                    );
                }
            }
            const queryString = queryParams.length
                ? `?${queryParams.join("&")}`
                : "";
            const newUrl = `${window.location.origin}${window.location.pathname}${queryString}`;
            window.history.pushState({ path: newUrl }, "", newUrl);
        },
        updatePageFromQueryString() {
            console.log("updateFromURL");
            const urlSearchParams = new URLSearchParams(window.location.search);
            const params = Object.fromEntries(urlSearchParams.entries());
            console.log("params", params);
            for (const [key, value] of Object.entries(params)) {
                const values = value.split(",");
                console.log(values);
                for (const v of values) {
                    const options = this.filterOptions[key];
                    console.log(key, "options", options);
                    const indices = options
                        .map((str, index) =>
                            str.toLowerCase().includes(v) ? index : -1
                        )
                        .filter((index) => index !== -1);
                    for (const i of indices) {
                        this.selectedFilters[key].push(
                            this.filterOptions[key][i]
                        );
                    }
                }
            }
        },
        isFilter(key) {
            return this.config.datasetsFilters.indexOf(key) > -1;
        },
        onFiltered(filteredItems) {
            //unused
            this.searchedItems = filteredItems;
            this.filteredCount = filteredItems.length;
        },
        showInputOptions(e) {
            const key = e.target.dataset.inputKey;
            document
                .querySelector(`[data-input-options-key="${key}"`)
                .classList.remove("hidden");
            document.querySelector(".input-overlay").classList.remove("hidden");
        },
        handleClickOutside(e) {
            document.querySelectorAll(".input-options").forEach((input) => {
                if (!input.classList.contains("hidden"))
                    input.classList.add("hidden");
            });
            document.querySelector(".input-overlay").classList.add("hidden");
        },
        removeInputOption(e) {
            const key = e.target.dataset.inputKey;
            const option = e.target.dataset.inputOption;
            const index = this.selectedFilters[key].indexOf(option);
            if (index !== -1) this.selectedFilters[key].splice(index, 1);
        },
        addInputOption(e) {
            const key = e.target.dataset.inputKey;
            const option = e.target.dataset.inputOption;
            const index = this.selectedFilters[key].indexOf(option);
            if (index === -1) {
                this.selectedFilters[key].push(option);
                this.$nextTick(() => {
                    e.target.dispatchEvent(new Event("mouseover"));
                });
            } else {
                this.removeInputOption(e);
            }
        },
        highlightTableItems(e) {
            const key = e.target.dataset.inputKey;
            const option = e.target.dataset.inputOption;
            console.log(option, key, this.selectedFilters);
            const index = this.selectedFilters[key].indexOf(option);
            if (index !== -1) {
                document
                    .querySelector(
                        `.input-list > *[data-input-key="${key}"][data-input-option="${option}"]`
                    )
                    .classList.add("highlight");
            } else {
                document
                    .querySelector(
                        `.filter .filter-count[data-input-key="${key}"]`
                    )
                    .classList.add("highlight");
            }
        },
        unHighlightTableItems(e) {
            const key = e.target.dataset.inputKey;
            const option = e.target.dataset.inputOption;
            const index = this.selectedFilters[key].indexOf(option);
            if (index !== -1) {
                document
                    .querySelector(
                        `.input-list > *[data-input-key="${key}"][data-input-option="${option}"]`
                    )
                    .classList.remove("highlight");
            } else {
                document
                    .querySelector(
                        `.filter .filter-count[data-input-key="${key}"]`
                    )
                    .classList.remove("highlight");
            }
        },
    },

    render(createElement, context) {
        return createElement(Template);
    },
}).$mount("#app");
