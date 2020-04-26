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

        // refresh sync flag (optional)
        "refresh",

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
            lzchr: this.chr,
            lzstart: this.start,
            lzend: this.end
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

        // create the final plot with a layout and initial state
        this.lzplot = LocusZoom.populate("#lz", this.dataSources, {
            panels,
            responsive_resize: "both",
            state: {
                chr: this.chr,
                start: this.start,
                end: this.end
            }
        });
    },
    methods: {
        /* Posts a custom event that the app can listen for and - when
         * received - dispatch whatever messages are necessary to load data.
         */
        requestUpdate() {
            this.$emit("lzupdate", {
                chr: this.lzchr,
                start: this.lzstart,
                end: this.lzend
            });
        },

        /* This is called whenever one of the LZVueSource objects had a
         * getRequest made by LocusZoom with a region.
         *
         * If the region requested is different from the region already
         * loaded, then the `lzupdate` event is emitted with the new
         * region. This allows the app to dispatch whatever actions are
         * necessary to load the data in question.
         *
         * If the region is invalid or not different, then it is assumed
         * that the LZVueSource's data promise either already has the
         * data loaded or will soon (and the promise was already returned
         * to LocusZoom).
         */
        lzUpdate({ chr, start, end }, chain, fields) {
            let valid = !!chr && !!start && !!end;
            let updated =
                chr !== this.lzchr ||
                start !== this.lzstart ||
                end !== this.lzend;

            if (valid && updated) {
                this.lzchr = chr;
                this.lzstart = start;
                this.lzend = end;

                // request that the app/store load more data
                this.requestUpdate();
            }
        },

        /* This is called whenever we need LocusZoom to change its internal
         * state (region) to something else entirely. Eventually this will
         * result in lzUpdate being called and an lzupdate event being
         * fired.
         *
         * This action is wrapped in debounce, because quite often all the
         * properties are updated together, which means we'll get multiple
         * watches triggered, and applyState will be tripped multiple times
         * in a row. Those should be coalesced them into a single apply
         * made to LocusZoom.
         */
        applyState() {
            let plot = this.lzplot;
            let state = {
                chr: this.chr,
                start: this.start,
                end: this.end
            };

            // wait a bit for possible, additional state changes
            _.debounce(() => plot.applyState(state), 100)();
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
        /* The refresh property allows the LocusZoom component to be aware
         * of external properties that should cause LocusZoom to request
         * new data.
         *
         * An example of this would be a phenotype property changing which
         * means associations should be loaded. But since LocusZoom is only
         * aware of the region for its state, it can't know to request data.
         *
         * The template using this component can v-bind:refresh to the
         * phenotype computed property and - when it changes - this watch
         * will trigger and then emit the lzupdate event.
         *
         * Additionally, sometimes it may be nice to use this as something
         * that can be triggered multiple times with a flag. In that case,
         * it can be bound with .sync (e.g. v-bind:refresh.sync) and after
         * this triggers it will be reset back to false so that the app
         * can set it to true again in the future, causing another refresh.
         */
        refresh(flag) {
            if (!!flag) {
                this.requestUpdate();

                /* If refresh was bound with v-bind:refresh.sync, then this
                 * will reset it to false, so that the app can set it to
                 * true again later and this watch will trip again.
                 */
                this.$emit("update:refresh", false);
            }
        },

        /* The original region has been updated.
         */
        chr(chr) {
            this.applyState();
        },
        start(start) {
            this.applyState();
        },
        end(end) {
            this.applyState();
        }
    }
});
</script>
