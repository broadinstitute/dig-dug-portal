<template>
    <div
        :class="
            'feature-content-wrapper hidden feature-content-wrapper-' +
            this.featureIndex +
            ' ' +
            cleanString(columnHeader)
        "
    >
        <b-container fluid>
            <div
                v-for="(row, i) in features"
                :class="'feature-list ' + i"
                :key="i"
            >
                <div class="row" :class="'feature-name ' + i" v-html="i"></div>
                <template v-for="(col, j) in row" :key="`c_${i}_${j}`">
                    <b-row
                        :class="'feature-headers ' + i"
                        v-if="j === 0"
                        :title="i"
                        :key="`h_${i}_${j}`"
                    >
                        <div
                            class="col"
                            :class="
                                $parent.config[
                                    $parent.dataset
                                ].featureRenderNot.includes(header)
                                    ? 'hidden feature-header-item ' + i
                                    : 'feature-header-item ' + i
                            "
                            v-for="header in Object.keys(col)"
                            :key="header"
                            v-html="header"
                        ></div>
                    </b-row>

                    <b-row
                        :class="'feature-content ' + i + getColContent(col)"
                    >
                        <template v-for="(item, name) in col" :key="name">
                            <div
                                class="col"
                                v-if="item == '' && item == null"
                                :class="
                                    $parent.config[
                                        $parent.dataset
                                    ].featureRenderNot.includes(name)
                                        ? 'hidden feature-content-item ' +
                                          i +
                                          ' ' +
                                          item
                                        : 'feature-content-item ' +
                                          i +
                                          ' ' +
                                          item
                                "
                                v-html="
                                    '<span class=\'col-content-filler\'>filler</span>'
                                "
                            ></div>
                            <div
                                class="col"
                                v-else
                                :class="
                                    $parent.config[
                                        $parent.dataset
                                    ].featureRenderNot.includes(name)
                                        ? 'hidden feature-content-item ' +
                                          i +
                                          ' ' +
                                          name +
                                          ' ' +
                                          item
                                        : 'feature-content-item ' +
                                          i +
                                          ' ' +
                                          cleanString(name) +
                                          ' ' +
                                          item
                                "
                                v-html="
                                    $parent.formatContent(
                                        [i, name],
                                        item,
                                        'feature'
                                    )
                                "
                            ></div>
                        </template>
                    </b-row>
                </template>
            </div>
        </b-container>
    </div>
</template>

<script>
import uiUtils from "@/utils/uiUtils";
export default {
    name: "effector-genes-features",
    props: ["features", "featureIndex", "columnHeader"],
    data() {
        return {};
    },
    computed: {},
    methods: {
        getColContent(COL) {
            let colClass = " ";
            for (const [key, value] of Object.entries(COL)) {
                colClass += " " + value;
            }
            return colClass;
        },
        cleanString(S) {
            return S.toString().replace(/[^a-zA-Z ]/g, "");
        },
    },
};
</script>
