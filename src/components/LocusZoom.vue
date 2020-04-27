<template>
    <div id="lz"></div>
</template>

<script>
import Vue from "vue";
import LocusZoom from "locuszoom";

import { LZ_TYPE, DEFAULT_PANEL_OPTIONS } from "@/utils/lz/lzConstants";
import LZDataSources from "@/utils/lz/lzDataSources";
import LZVueSource from "@/utils/lz/lzVueSource";
import * as _ from "lodash";

export default Vue.component("locuszoom", {
    props: [
        "panels",

        // initial locus, can be used to reset, too
        "chr",
        "start",
        "end",

        // custom LocusZoom state (all optional)
        "phenotype",
        "variant",

        // computed properties for each data source type
        ...Object.values(LZ_TYPE)
    ],

    /* This is the last region LocusZoom requested to be loaded.
     * It is used both as a cache to know if LocusZoom is requesting
     * the same region be loaded multiple times, and so the app/store
     * can know where LocusZoom is compared to the region stored in
     * the properties.
     *
     * It is set to the same region as that of the bound properties
     * initially. Otherwise, when the page initially loads, LocusZoom
     * will request that the region be fetched.
     *
     * WE DO NOT WANT TO DO THIS!!
     *
     * This is because the page itself will load the data on its own
     * when ready and we don't want to load it multiple times. Once
     * the data has been loaded, any scrolling from LocusZoom will update
     * the region here and cause a reload.
     *
     * Likewise, if the page loads new data on its own, the computed
     * property watch of this component will pick up the change and
     * refresh LocusZoom.
     */

    data() {
        return {
            /* This is our desired state.
             *
             * It can be set either by the app updating the properties
             * bound to the component or by LocusZoom itself requesting
             * a particular state (e.g. user scrolling).
             */
            desiredState: {
                chr: this.chr,
                start: this.start,
                end: this.end,
                phenotype: this.phenotype,
                variant: this.variant
            },

            /* This is the last requested state.
             *
             * It is our internal representation of the last desired state
             * that was emitted back to the app to be loaded.
             */
            requestedState: {}
        };
    },

    /* Called when the component is added to the DOM. Set up the
     * panels and layout of LocusZoom here.
     */
    mounted() {
        let panels = this.panels.map(p => {
            return LocusZoom.Layouts.get("panel", p, {
                ...DEFAULT_PANEL_OPTIONS

                // TODO: override/extend defaults here...
            });
        });

        // create the data source collection
        this.dataSources = new LocusZoom.DataSources();

        // register all the possible data sources
        Object.values(LZ_TYPE).forEach(lzType => {
            if (!!this[lzType]) {
                this.createSource(lzType, this[lzType]);
            } else {
                let source = LZDataSources[lzType];

                if (!!source) {
                    this.dataSources.add(lzType, source);
                }
            }
        });

        // create the final plot with a layout and desired state
        this.lzplot = LocusZoom.populate("#lz", this.dataSources, {
            panels,
            responsive_resize: "both",

            // this must be a copy since LocusZoom modifies the object passed
            state: Object.assign({}, this.desiredState)
        });
    },
    methods: {
        /* This is called whenever one of the LZVueSource objects had a
         * getRequest made by LocusZoom with a region. So it's possible
         * to be called multiple times with the same state.
         *
         * This represents a desired state that LocusZoom wants to load.
         *
         * If the state (desired) from LocusZoom differs from the last
         * requested state, then we update and emit an event requesting
         * that the app load it.
         *
         * If the is not different, then it is assumed that the sources's
         * data promise either already has the data loaded or will soon
         * and the promise was already returned to LocusZoom via a previous
         * getRequest method.
         */
        lzUpdate(state, chain, fields) {
            let keys = Object.keys(this.desiredState);

            // are all the state keys the same as the last requested state?
            let same = keys.every(key => {
                return state[key] === this.requestedState[key];
            });

            if (!same) {
                this.desiredState = _.pick(state, keys);
                this.requestedState = _.pick(state, keys);

                // request that the app/store load more data
                this.$emit("lzupdate", this.requestedState);
            }
        },

        /* This is called whenever we need LocusZoom to change its internal
         * state (region) to something else entirely. Eventually this will
         * result in lzUpdate being called with our new, desired state, and
         * an lzupdate event being fired to the app.
         *
         * This actual update is wrapped in debounce, because quite often
         * multiple properties are updated together, which means we'll get
         * multiple watches triggered, and applyState will be tripped multiple
         * times in a row. Those should be coalesced them into a single apply
         * made to LocusZoom.
         */
        applyState(updatedState) {
            this.desiredState = { ...this.desiredState, ...updatedState };

            // apply the update to LocusZoom
            let update = function() {
                this.lzplot.applyState(this.desiredState);
            };

            // wait a bit for possible, additional state changes
            _.debounce(update.bind(this), 100)();
        },

        /* Creates an LZVueSource for a type and set of loaded data for it.
         * The source is added to the set of data sources for LocusZoom.
         *
         * After registering it, add a watch on the computed property for
         * the data loaded by the app. This watch needs to be applied
         * immediately as it's possible the data was already loaded by the
         * app and we need the watch function to trigger.
         */
        createSource(lzType) {
            let params = { lzupdate: this.lzUpdate };
            let watchOptions = { immediate: true };

            // register the data source with LocusZoom
            this.dataSources.add(lzType, ["LZVueSource", params]);

            // add a custom watch for this property
            this.$watch(
                lzType,
                function(data) {
                    this.propertyWatch(lzType, data);
                },
                watchOptions
            );
        },

        /* The data for a particular data type was updated. Make sure the
         * source exists, then resolve the source's promise with the new
         * data and tell LocusZoom to redraw.
         */
        propertyWatch(lzType, data) {
            let source = this.dataSources.sources[lzType];

            if (!!source) {
                source.resolve(data);
            }

            /* Force redraw. This handles a case where LocusZoom didn't
             * actually request any data, but data has been provided
             * none-the-less.
             *
             * NOTE: sometimes a property update happens before LocusZoom
             * has actually been initialized. In that case, we still need
             * to resolve the data, but just can't refresh.
             */
            if (!!this.lzplot) {
                this.lzplot.refresh();
            }
        }
    },

    watch: {
        /* The original region has been updated.
         */
        chr(chr) {
            this.applyState({ chr });
        },
        start(start) {
            this.applyState({ start });
        },
        end(end) {
            this.applyState({ end });
        },

        /* The page's custom LocusZoom state has been updated.
         */
        phenotype(phenotype) {
            this.applyState({ phenotype });
        },
        variant(variant) {
            this.applyState({ variant });
        }
    }
});
</script>
