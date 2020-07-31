<template>
    <div>
        <slot name="header">
            <span v-if="typeof card != 'undefined'">
                <h4>{{card.index}} for {{card.query}}<scroll-to-arrow></scroll-to-arrow></h4>
            </span>
            <span v-else-if="!!title">
                <h4>{{title}} <scroll-to-arrow></scroll-to-arrow></h4>
            </span>
            <slot name="subheader"></slot>
        </slot>
        <b-row>
            <slot name="sidebar">
                <!-- <b-col cols="3"> -->
                    <span v-if="typeof card != 'undefined'">

                    </span>
                <!-- </b-col> -->
            </slot>
            <b-col>
                <slot name="content">
                    <span v-if="typeof card != 'undefined' && !!cardData">
                        {{ cardData.length }} items
                        <!-- <table>
                            <thead>
                                <tr>
                                    <th v-for="prop in dataProperties" :key="JSON.stringify(prop)">
                                        {{prop}}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="objectElement in cardData" :key="JSON.stringify(objectElement)">
                                    <td v-for="value in Object.values(objectElement)" :key="JSON.stringify(value)">
                                        {{value}}
                                    </td>
                                </tr>
                            </tbody>
                        </table> -->
                    </span>
                </slot>
            </b-col>
        </b-row>
    </div>
</template>
<script>
import Vue from "vue"

import ScrollToTop from "@/components/ScrollToTop"
import jsonQuery from "json-query"

import { BIOINDEX_SCHEMA } from "../utils/resultsUtils"

import { BootstrapVue } from "bootstrap-vue";
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';

import _ from "lodash"

Vue.use(BootstrapVue);
export default Vue.component('result-card-template', {
    props: ["title", "card", "cardData"],
    components: {
        ScrollToTop,
    },
    data() {
        return {
            schemas: BIOINDEX_SCHEMA.data
        }
    },
    computed: {
        dataProperties() {
            if(!!this.cardData) {
                return _.uniq(this.cardData.reduce((acc, datum) => acc.concat(Object.keys(datum)), []))
            }
        },
        dataValues() {

        },
        simpleXsForYs() {
            function isCompasableWithIndex(index, schema) {

                function closeMatch(index, schema) {
                    const closeMatches = {
                    };
                    if (!!closeMatches[index]) {
                        return closeMatches[index].some(el => schema.query.keys.includes(el));
                    } else {
                        return schema.query.keys.includes(index);
                    }
                }

                // all of the indexes that have query keys that include data corresponding to the current index
                if (index === "gene" || index === "genes" || index === "regions") {
                    return schema.locus && schema.query.keys.length < 2;
                } else {
                    return closeMatch(index, schema);
                };

            }
            return this.schemas.filter(schema => isCompasableWithIndex(card.index, schema));
        }
    }
})
</script>
