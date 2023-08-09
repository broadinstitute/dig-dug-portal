<template>
    <div id="app">
        <!-- KP Header -->
        <page-header
            v-if="$parent.displayOnKP == true"
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
            :rawPhenotypes="$parent.rawPhenotypes"
        ></page-header>

        <!--  Research page Header -->
        <research-page-header
            :class="
                $parent.displayOnKP == true
                    ? 'research-portal-header-compact'
                    : 'research-portal-header'
            "
            :researchMenu="$parent.researchMenu"
            :headerLogo="
                $parent.displayOnKP == true || $parent.headerLogo == false
                    ? null
                    : $parent.headerLogo
            "
        ></research-page-header>
        <div
            class="container-fluid mdkp-body"
        >
            
    <!-- multi section test-->
            <div class="col-md-12" v-if="!!$parent.sectionConfigs && !!$parent.sectionConfigs['is multi section']">
            
                <research-multi-sections-search 
                v-if="!!$parent.multiSectionsSearchParameters"
                    :searchParameters="$parent.multiSectionsSearchParameters"
                    :phenotypesInUse="$parent.phenotypesInSession"
                    :keyParams="$parent.keyParamUtils">
                </research-multi-sections-search>
                <research-section
                    v-for="config, index in $parent.sectionConfigs.sections"
                    :sectionIndex="'section-' + index"
                    :uId="$parent.uid"
                    :sectionConfig="config"
                    :keyParams="$parent.keyParamUtils"
                    :dataConvert="$parent.dataConvertUtils"
                    :phenotypeMap="$parent.phenotypeMap"
                    :colors="$parent.colors"
                    :plotMargin="$parent.plotMargin"
                    :plotLegend="$parent.plotLegend"
                    :tableLegend="$parent.tableLegend"
                    :key="index">
                </research-section>	
            </div>
					

		</div>


		 <!-- Research portal Footer-->
		<research-page-footer
            v-if="$parent.displayOnKP == null"
        ></research-page-footer>

        <!-- KP Footer-->
        <page-footer
            v-if="$parent.displayOnKP == true"
            :disease-group="$parent.diseaseGroup"
        ></page-footer>
    </div>
</template>

<style>
@import url("/css/effectorGenes.css");
@import url("/css/tooltipDocumentation.css");
html {
    font-size: 14px !important;
}
.no-data-warning {
    background-color: #ffaaaa;
    position: fixed;
    z-index: 10010;
    bottom: 30px;
    right: 30px;
    width: 300px;
    padding: 20px 20px;
    border: solid 1px #dd6666;
    border-radius: 5px;
    color: #ffffff;
}
#alert_pop_up {
    position: fixed;
    width: 400px;
    top: 50%;
    left: calc(50% - 200px);
    background-color: #ffefef;
    padding: 15px 30px;
    border: solid 1px #ff8888;
    border-radius: 5px;
    font-size: 1.15em;
    box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
}
.zoom-ui-wrapper {
    font-size: 13px;
    font-weight: 700;
    text-align: right;
    margin-bottom: 15px;
}
.zoom-radio-wrapper {
    width: auto;
    display: inline-block;
    font-size: 15px;
    font-weight: 300;
    border: solid 1px #ddd;
    padding: 3px 7px 0 7px;
    border-radius: 15px;
    margin: 0 10px 0 5px;
}
.zoom-radio {
    box-sizing: border-box;
    appearance: none;
    background: #eeeeee;
    outline: none;
    border: none;
    width: 8px;
    height: 15px;
    margin: 0 1px;
}
.zoom-radio.center {
    background: #bbbbbb;
}
.zoom-radio:hover {
    background: #666666;
    cursor: pointer;
}

.zoom-radio.checked {
    background: #05bd02;
}

.zoom-radio-number {
    display: inline-block;
    vertical-align: 2px;
    color: #000000;
    margin: 0 2px;
}

.zoom-radio-number:hover {
    color: #3388ff;
    cursor: pointer;
}

.direction-positive {
    color: #0066ff;
}
.direction-negative {
    color: #ff0000;
}

.rp-sub-header {
    position: relative;
    border-top: solid 1px #dddddd;
    font-size: 16px;
    margin-top: 15px;
}

.rp-sub-header-label {
    display: block;
    position: absolute;
    font-size: 10px;
    color: #eeeeee;
    top: -1px;
    background-color: #666666;
    padding: 0 5px;
    right: 0;
}

.rp-sub-header span.rp-sub-header-search-param-label,
.rp-sub-header span.rp-sub-header-search-param {
    display: inline-block;
}
.rp-sub-header span.rp-sub-header-search-param-label:first-letter {
    text-transform: uppercase;
}

.rp-sub-header span.rp-sub-header-search-param {
    font-size: 20px;
    margin-right: 20px;
}

.research-data-table td.multi-value-td span {
    height: 27px !important;
}
</style>