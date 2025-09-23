<template>
    <div class="sysbio f-layout">
        <!-- NAV -->
        <sysbio-header></sysbio-header>
        <!-- BODY -->
        <div class="sysbio-body">
            <div v-if="$parent.pageInfo" style="margin:0 0 40px">
                <h2>{{ $parent.pageInfo.title }}</h2>
                <div v-html="$parent.pageInfo.body"></div>
            </div>
            <div v-if="$parent.ready" style="display:flex; gap: 20px; height: 480px;">
                <div style="display:flex; flex-direction: column; width: 300px;">
                    <div style="display:flex; justify-content: space-between; align-items: baseline; margin: 0 0 5px;">
                        <strong style="font-size: 16px;">Color By</strong>
                    </div>
                    <div style="display:flex; flex-direction: column; gap: 10px; overflow-y:hidden">
                        <select style="width: 100%; padding: 5px;" v-model="$parent.colorByField">
                            <option value="">--Select--</option>
                            <option v-for="(value, key) of $parent.fields.metadata_labels" :value="key">
                                {{ key }}
                            </option>
                        </select>
                        <div style="overflow-y: scroll;">
                            <div class="colorize-label" v-for="(value, label) of $parent.fields.metadata_labels[$parent.colorByField]" :key="label" @click="$parent.colorLabel(value)" :class="$parent.labelIsolated(value)" style="display:flex; gap: 5px;">
                                <div>
                                    <svg width="1em" viewBox="0 -0.5 17 17" xmlns="http://www.w3.org/2000/svg"><path d="M3 10.333C3 13.463 5.427 16 8.418 16 11.41 16 14 13.463 14 10.333 14 7.204 8.418 0 8.418 0S3 7.204 3 10.333Z" :fill="$parent.labelColors ? $parent.labelColors[$parent.colorByField][value] : '#434343'"/></svg>
                                </div>
                                <div :title="label" @mouseover="$parent.emitHover(value)" @mouseout="$parent.emitHover('')">{{ value }}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div style="display:flex; flex-direction: column; width: 450px; flex: 1">
                    <div style="display:flex; justify-content: space-between; align-items: baseline; margin: 0 0 5px;">
                        <strong style="font-size: 16px;">PCA</strong>
                        <div>{{ $parent.totalCells.toLocaleString() }} cells</div>
                    </div>
                    <research-umap-plot-gl 
                        group="datasetId"
                        :points="$parent.coordinates"
                        :labels="$parent.fields"
                        :colors="$parent.labelColors"
                        :cellTypeField="$parent.colorByField"
                        :colorByField="$parent.colorByField"
                        :hoverFields="[]"
                        :highlightLabel="$parent.highlightLabel"
                        :highlightLabels="$parent.highlightLabels"
                        :width="450"
                        :height="450"
                    />
                </div>
            </div>
        </div>
        <!-- FOOTER -->
        <sysbio-footer></sysbio-footer>
    </div>
</template>

<script>
export default {

}
</script>

<style scoped>
.colorize-label{
    cursor: pointer;
}
.colorize-label.off{
    opacity: 0.5;
}

/* download button */
.download {
    margin: 0;
    float: unset;
    margin: 0;
    float: unset;
    width: fit-content;
}
::v-deep .download button{
    color: black;
    background-color: white;
    padding: 0.25rem 0.5rem;
    border: 0;
    box-shadow: 0px 1px 2px 0 black;
    font-size: 12px;
}
::v-deep .download button:hover{
    color: black;
    background-color: #ccc;
}
/* search input */
::v-deep .search input {
    font-size: 12px;
    line-height: unset;
    padding: 0.25rem 0.5rem;
    height: unset;
    border:0;
    box-shadow: 0px 1px 2px 0 black;
}
/* de table rows */
.clickable-cell{
    cursor:pointer;
}
::v-deep tr.downregulated {
    border-left: 5px solid #12bdfe !important;
}
::v-deep tr.upregulated {
    border-left: 5px solid #ff00c7 !important;
}
::v-deep .row-highlight{
    background-color:#eee;
}

.slider-input{
    font-size: 12px;
    padding: 0;
    width: 30px;
    background: none;
    border: none;
}
</style>