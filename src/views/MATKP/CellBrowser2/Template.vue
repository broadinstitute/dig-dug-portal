<template>
    <div class="matkp">
        <div class="f-col fill-height" style="height:fit-content; min-height:100vh;">
            <!-- NAV -->
            <matkp-nav></matkp-nav>

            <div class="mat-body f-col" style="padding:20px;">
                <div class="f-col" v-if="$parent.currentDataset">
                    <div class="f-row" style="gap:20px;">
                        <div class="f-col" style="min-width:250px;">
                            <div class="anatomogram">
                                <img class="anatomy-human" :class="$parent.currentDataset['species'][0] ==='Human' ? '' : 'hidden'" src="https://hugeampkpncms.org/sites/default/files/users/user32/matkp/homo_sapiens.male_.svg">
                                <img class="anatomy-mouse" :class="$parent.currentDataset['species'][0] ==='Mouse' ? '' : 'hidden'" src="https://hugeampkpncms.org/sites/default/files/users/user32/matkp/mus_musculus.male_.svg">
                            </div>
                        </div>
                        <div class="f-col spread-out" style="gap:5px;">
                            <div class="f-col" style="flex-grow:1">
                                <div class="bold" style="font-size: 18px;">{{ $parent.currentDataset['datasetName'] }}</div>
                                <div class="f-row" style="gap:20px; flex-grow:1">
                                    <div class="f-col">
                                        <div class="more-less" :style="`width:880px; height:${$parent.showMore ? 'auto' : '60px'};`">{{ $parent.currentDataset['summary'] }}</div>
                                        <div class="more-less-button" @click="$parent.toggleMore">{{ $parent.showMore ? 'less' : 'more' }}</div>
                                    </div>
                                    <div class="f-col spread-out">
                                        <div class="f-col">
                                            <div class="f-row" style="gap:5px;"><div class="bold">Authors:</div> <div>{{$parent.currentDataset['authors']}}</div></div>
                                            <div class="f-row" style="gap:5px;"><div class="bold">Contact:</div> <div>{{$parent.currentDataset['contact']}}</div></div>
                                            <div class="f-row" style="gap:5px;"><div class="bold">Doi:</div> <div>{{$parent.currentDataset['doi']}}</div></div>
                                        </div>
                                        <!--
                                        <div class="matkp-input">
                                            Browse more datasets
                                        </div>
                                        -->
                                    </div>
                                </div>
                            </div>
                            
                            <div class="f-row spread-out" style="font-size:14px; margin:10px 0 0;" v-if="!$parent.preload && !$parent.donorInfo">
                                <!--remove-->
                                <div class="f-col" >
                                    <div class="f-row" style="gap:5px;"><div class="bold">Species:</div> <div>{{$parent.currentDataset['species'][0]}}</div></div>
                                    <div class="f-row" style="gap:5px;"><div class="bold">Depot{{ $parent.currentDataset['tissue'].length>1?'s':'' }}:</div> <div>{{$parent.currentDataset['tissue'].join(', ')}}</div></div>
                                    <div class="f-row" style="gap:5px;"><div class="bold">Donors:</div> <div>{{$parent.totalDonors}}</div></div>
                                    <div class="f-row" style="gap:5px;"><div class="bold">Biosamples:</div> <div>{{$parent.totalSamples}}</div></div>
                                    <div class="f-row" style="gap:5px;"><div class="bold">Cells:</div> <div>{{$parent.currentDataset['totalCells'].toLocaleString()}}</div></div>
                                </div>
                            </div>
                            <!--
                            <div class="f-row" style="width:880px;; gap:20px">
                                <div>Sections:</div>
                                <div class="f-row" style="gap:50px">
                                    <div>Study/Donor Charactertistics</div>
                                    <div>Cell Composition</div>
                                    <div>Gene Expression</div>
                                </div>
                            </div>
                            -->

                            <div class="f-row align-v-center" :style="`display: ${$parent.preload ? 'block' : 'none'}; gap:10px; position:relative; font-size:12px; height:30px; padding-top:10px; margin-left:30px`">
                                <div class="data-load-spinner" ></div>
                                <div>loading {{ $parent.preloadItem }}</div>
                            </div>
                            
                        </div>
                        
                        
                    </div>
                </div>

                <div class="f-col" style="margin:0 0 40px 0; gap:20px; position: relative;" v-if="!$parent.preload && $parent.donorInfo">
                    <!--section study/donor-->
                    <div class="f-row" style="gap:20px">
                        <!--sidebar-->
                        <div class="f-col" style="min-width:250px; width:250px; margin: 50px 0 0; gap:20px; background:#e4e4e4; padding:10px">
                            <div class="f-col" style="font-size:14px;">
                                <div class="f-row" style="gap:50px;"><div class="bold">Species:</div> <div>{{$parent.currentDataset['species'][0]}}</div></div>
                                <div class="f-row" style="gap:55px;"><div class="bold">Depots:</div> <div>{{$parent.currentDataset['tissue'].join(', ')}}</div></div>
                                <div class="f-row spread-out" style="gap:5px;"><div class="bold">Donors:</div> <div>{{$parent.totalDonors}}</div></div>
                                <div class="f-row spread-out" style="gap:5px;"><div class="bold">Biosamples:</div> <div>{{$parent.totalSamples}}</div></div>
                                <div class="f-row spread-out" style="gap:5px;"><div class="bold">Cells:</div> <div>{{$parent.currentDataset['totalCells'].toLocaleString()}}</div></div>
                                <div class="f-row align-v-center" :style="`display: ${$parent.preload ? 'block' : 'none'}; gap:10px; position:relative; font-size:12px; height:30px; padding-top:10px; margin-left:30px`">
                                    <div class="data-load-spinner" ></div>
                                    <div>loading {{ $parent.preloadItem }}</div>
                                </div>
                            </div>
                            <div class="f-col">
                                    <div class="f-col spread-out" style="margin-bottom:5px; position:relative">
                                        <div class="sidebar-label">Donor data</div>
                                        <div class="sidebar-note" style="display:none">Select characteristics to see breakdown by donors.</div>
                                    </div>
                                    
                                    <div class="f-row spread-out categories" style="font-size: 14px; padding: 2px 2px 2px 13px;" 
                                        v-for="category in $parent.datasetConfig.donor_characteristics"
                                        id="select-donor-categories"
                                    >
                                        <div class="category-label" :title="category">{{category}}</div>
                                        <!--<div class="f-col align-v-center categories-list" :class="`${$parent.categoriesLeft.length===1?'maxA':''} ${$parent.categoriesRight.length===1?'maxB':''}`">-->
                                        <div class="f-col align-v-center categories-list">
                                            <div class="f-row" style="gap:5px;">
                                                <input
                                                    type="checkbox" 
                                                    class="category-label-select"
                                                    :class="`${ $parent.donorInfo[category] ? 'category-label-selected' : ''}`" 
                                                    :checked="$parent.donorInfo[category]"
                                                    :data-category="category" 
                                                    :data-side="'a'"
                                                    @click="$parent.toggleCategorySelect"
                                                >
                                            </div>
                                        </div>
                                    </div>
                                </div>
                        </div>
                        <!--content-->
                        <div class="f-col" style="flex-grow: 1;">
                            <div class="f-col" style="position: relative; gap:10px;" v-if="$parent.donorInfoGroups">
                                
                                <div class="section-title" style="margin-top:0">
                                    Study Characteristics
                                </div>
                                <div style="font-size:12px; margin-bottom:20px; max-width: 880px;">
                                    {{ $parent.studyDesign }}
                                </div>
                                <div class="f-row" style="flex-wrap:wrap; gap:10px">
                                    <div class="f-col" style="gap:10px" v-for="item in $parent.donorInfoGroups">
                                        <div class="chart-title"><b>{{item.key}}</b> by <b>{{ item.subKey }}</b></div>
                                        <div class="f-row">
                                            <stacked-bar-chart
                                                :data="item.data"
                                                :categoryKey="item.key"
                                                totalKey="Total"
                                                :subCategoryKeys="$parent.categoryKeys2(item.subKey)"
                                                :colors="$parent.colorsByCategory(item.subKey)"
                                                :normalize="false"
                                                :barType="`grouped`"
                                                :orientation="`horizontal`"
                                                :width="200"
                                                :height="200"
                                                :fitToSize="true"
                                                :showValues="true"
                                                :labelLeft="`donors`"
                                            />
                                            <div class="f-col">
                                                <div class="f-col" style="gap:5px; " >
                                                    <div style="font-size:12px; line-height: 12px; color: gray; margin:0 0 5px 0">{{ item.subKey }}</div>
                                                </div>
                                                <div class="f-col" style="flex-wrap: wrap;">
                                                    <div class="f-row align-v-center" style="gap:5px; font-size: 11px; line-height: 12px;" v-for="categoryKey in $parent.categoryKeys2(item.subKey)">
                                                        <div :style="`width:10px; height:10px; background:${$parent.fieldColors[item.subKey][categoryKey]}`"></div>
                                                        <div style="white-space: nowrap;">{{ categoryKey }}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="f-col" style="position: relative; gap:10px;" v-if="$parent.donorInfo">
                                <div class="section-title" style="margin-top:0">
                                    Donor Characteristics
                                </div>
                                <div class="f-row" style="flex-wrap:wrap; gap:10px; max-width:880px">
                                    <div class="f-col" v-for="(value, key) in $parent.donorInfo" style="width:200px; overflow-x:hidden;">
                                        <div class="chart-title">{{key}}</div>
                                        <stacked-bar-chart 
                                            :data="value"
                                            :categoryKey="key"
                                            totalKey="total"
                                            :colors="$parent.colorsByCategory(key)"
                                            :normalize="false"
                                            :barType="`grouped`"
                                            :orientation="`horizontal`"
                                            :width="200"
                                            :height="200"
                                            :fitToSize="true"
                                            :showValues="true"
                                            :margins="{top: 30, right: 10, bottom: 50, left:50}"
                                        />
                                    </div>
                                </div>
                                <div class="f-col table-drawer" data-state="closed" v-if="$parent.donorsTable" >
                                        
                                    <div class="f-col align-h-center table-drawer-handle" style="gap:10px; padding:25px 0" @click="$parent.toggleTableDrawer">
                                        <div class="f-col no-events align-h-center">
                                            <div style="font-size: 12px;">❮</div>
                                            <div style="width:25px;"><svg viewBox="0 0 24.00 24.00" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" stroke="#CCCCCC" stroke-width="0.048"></g><g id="SVGRepo_iconCarrier"> <path d="M3 9.5H21M3 14.5H21M8 4.5V19.5M6.2 19.5H17.8C18.9201 19.5 19.4802 19.5 19.908 19.282C20.2843 19.0903 20.5903 18.7843 20.782 18.408C21 17.9802 21 17.4201 21 16.3V7.7C21 6.5799 21 6.01984 20.782 5.59202C20.5903 5.21569 20.2843 4.90973 19.908 4.71799C19.4802 4.5 18.9201 4.5 17.8 4.5H6.2C5.0799 4.5 4.51984 4.5 4.09202 4.71799C3.71569 4.90973 3.40973 5.21569 3.21799 5.59202C3 6.01984 3 6.57989 3 7.7V16.3C3 17.4201 3 17.9802 3.21799 18.408C3.40973 18.7843 3.71569 19.0903 4.09202 19.282C4.51984 19.5 5.07989 19.5 6.2 19.5Z" stroke="#000000" stroke-width="1.2"></path> </g></svg></div>
                                        </div>
                                        <div class="no-events" style="transform: rotate(-90deg);">Table</div>
                                    </div>
                                    
                                    <b-table 
                                    style="font-size: 14px; width:auto;"
                                    small
                                    responsive
                                    striped
                                    ref="cellTable"
                                    @sort-changed="$parent.onSortChanged"
                                    :items="$parent.donorsTable.rows" 
                                    :fields="$parent.donorsTable.header">
                                        <template #cell(Total)="data">
                                            <span class="bold">{{ data.value }}</span>
                                        </template>
                                    </b-table>
                                    
                                </div>
                            </div>
                        </div>
                    </div>
                    <!--section cell-->
                    <div class="f-row" style="gap:20px">
                        <!--sidebar-->
                        <div class="f-col" style="min-width:250px; width:250px; margin: 50px 0 0;">
                            <div :class="`f-col sidebar ${$parent.fixedSidebar ? 'fixed-sidebar' : ''}`" style="width:250px; gap:20px;background:#e4e4e4; padding:10px; flex-grow:1" v-if="$parent.cellTypeInfo">
                                <div class="f-col">
                                    <div class="f-col" style="margin-bottom:5px; position:relative">
                                        <div class="sidebar-label">Cell Types</div>
                                        <div class="sidebar-note" style="display:none">Select a cell type category to see distribution.</div>
                                    </div>
                                    <div class="f-row spread-out categories" style="font-size: 14px; padding: 2px 2px 2px 13px;" 
                                        v-for="category in $parent.datasetConfig.cellTypes"
                                        id="select-cell-types"
                                    >
                                        <div class="category-label" :title="category">{{category}}</div>
                                        <!--<div class="f-col align-v-center categories-list" :class="`${$parent.categoriesLeft.length===1?'maxA':''} ${$parent.categoriesRight.length===1?'maxB':''}`">-->
                                        <div class="f-col align-v-center categories-list">
                                            <div class="f-row" style="gap:5px;">
                                                <input 
                                                    type="checkbox" 
                                                    class="category-label-select"
                                                    :class="`${ $parent.cellTypeInfo.key===category ? 'category-label-selected' : ''}`" 
                                                    :checked="$parent.cellTypeInfo.key===category"
                                                    :data-category="category" 
                                                    :data-side="'a'"
                                                    @click="$parent.toggleCategorySelect"
                                                >
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="f-col">
                                    <div class="f-col">
                                        <div class="f-row spread-out" style="margin-bottom:5px; position:relative">
                                            <div class="sidebar-label">Conditions</div>
                                            <!--<div class="f-row" style="gap:10px;margin:0 4px;"><div>A</div><div>B</div></div>-->
                                            
                                            <button 
                                                v-if="$parent.categoriesLeft.length>0 && $parent.categoriesRight.length>0"
                                                @click="$parent.swapSides()" 
                                                class="round-white swapBtn" 
                                                style="font-size:12px;margin-right:0px;width:40px;"
                                                a>⇄
                                            </button>
                                        </div>
                                        <div class="sidebar-note" style="display:none">Select up to 2 conditions to see relative abundance by cell types.</div>
                                    </div>
                                    
                                    <div class="f-row spread-out categories" style="font-size: 14px; padding: 2px 2px 2px 13px;" 
                                        v-for="category in $parent.datasetConfig.donor_characteristics"
                                        id="select-conditions"
                                    >
                                        <div class="category-label" :title="category">{{category}}</div>
                                        <!--<div class="f-col align-v-center categories-list" :class="`${$parent.categoriesLeft.length===1?'maxA':''} ${$parent.categoriesRight.length===1?'maxB':''}`">-->
                                        <div class="f-col align-v-center categories-list">
                                            <div class="f-row" style="gap:5px;">
                                                <input 
                                                    type="checkbox" 
                                                    class="category-label-select"
                                                    :class="`${ $parent.datasetSettings.selectedConditions[0]===category ? 'category-label-selected' : ''}`" 
                                                    :checked="$parent.datasetSettings.selectedConditions[0]===category"
                                                    :data-category="category" 
                                                    :data-side="'a'"
                                                    @click="$parent.toggleCategorySelect"
                                                >
                                                <input 
                                                    type="checkbox" 
                                                    class="category-label-select"
                                                    :class="`${ $parent.datasetSettings.selectedConditions[1]===category ? 'category-label-selected' : ''}`" 
                                                    :checked="$parent.datasetSettings.selectedConditions[1]===category" 
                                                    :data-category="category" 
                                                    :data-side="'b'"
                                                    @click="$parent.toggleCategorySelect"
                                                >
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!--content-->
                        <div class="f-row" style="flex-grow: 1;">
                            <div class="f-col" style="position: relative; gap:10px; flex-grow: 1;" v-if="$parent.cellTypeInfo">
                                <div class="section-title" style="margin-top:0">
                                    Cell Composition
                                </div>
                                <div style="font-size:12px; max-width: 880px;" v-if="$parent.cellInfo">
                                    {{ $parent.cellInfo }}
                                </div>
                                <div class="f-col" style="position:relative" v-if="$parent.cellTypeInfo">
                                    <div class="chart-title">Distribution of <b>{{$parent.cellTypeInfo.key}}</b></div>
                                    <div class="f-row" style="gap:10px">
                                        <stacked-bar-chart
                                            :data="$parent.cellTypeInfo.data[$parent.cellTypeInfo.key]"
                                            :categoryKey="$parent.cellTypeInfo.key"
                                            totalKey="Total"
                                            :colors="$parent.colorsByCategory($parent.cellTypeInfo.key)"
                                            :normalize="false"
                                            :barType="`grouped`"
                                            :orientation="`horizontal`"
                                            :width="610"
                                            :height="300"
                                            :fitToSize="true"
                                            :labelLeft="`count`"
                                            :labelBottom="$parent.cellTypeInfo.key"
                                            :showValues="false"
                                            :margins="{top: 30, right: 10, bottom: 50, left:95}"
                                        />
                                        <div class="f-col" style="margin:0;">
                                            <div class="f-col align-h-center" style="width:250px; aspect-ratio: 1; background:none;">
                                                <umap-plot 
                                                    style=" border:1px solid #ccc;"
                                                    :points="$parent.coordinates"
                                                    :colors="$parent.cellTypeInfo.umapColors"
                                                    :width="250"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="f-col table-drawer" data-state="closed" v-if="$parent.cellTypeTable" >
                                        
                                        <div class="f-col align-h-center table-drawer-handle" style="gap:10px; padding:25px 0" @click="$parent.toggleTableDrawer">
                                            <div class="f-col no-events align-h-center">
                                                <div style="font-size: 12px;">❮</div>
                                                <div style="width:25px;"><svg viewBox="0 0 24.00 24.00" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" stroke="#CCCCCC" stroke-width="0.048"></g><g id="SVGRepo_iconCarrier"> <path d="M3 9.5H21M3 14.5H21M8 4.5V19.5M6.2 19.5H17.8C18.9201 19.5 19.4802 19.5 19.908 19.282C20.2843 19.0903 20.5903 18.7843 20.782 18.408C21 17.9802 21 17.4201 21 16.3V7.7C21 6.5799 21 6.01984 20.782 5.59202C20.5903 5.21569 20.2843 4.90973 19.908 4.71799C19.4802 4.5 18.9201 4.5 17.8 4.5H6.2C5.0799 4.5 4.51984 4.5 4.09202 4.71799C3.71569 4.90973 3.40973 5.21569 3.21799 5.59202C3 6.01984 3 6.57989 3 7.7V16.3C3 17.4201 3 17.9802 3.21799 18.408C3.40973 18.7843 3.71569 19.0903 4.09202 19.282C4.51984 19.5 5.07989 19.5 6.2 19.5Z" stroke="#000000" stroke-width="1.2"></path> </g></svg></div>
                                            </div>
                                            <div class="no-events" style="transform: rotate(-90deg);">Table</div>
                                        </div>
                                        
                                        <b-table 
                                        style="font-size: 14px; width:auto;"
                                        small
                                        responsive
                                        striped
                                        ref="cellTable"
                                        @sort-changed="$parent.onSortChanged"
                                        :items="$parent.cellTypeTable.rows" 
                                        :fields="$parent.cellTypeTable.header">
                                            <template #cell(Total)="data">
                                                <span class="bold">{{ data.value }}</span>
                                            </template>
                                        </b-table>
                                        
                                    </div>
                                    
                                </div>
                                <div class="f-col" style="position:relative" v-if="$parent.cellTypeConditionsInfo.length>0">
                                    <div class="chart-title">Abundance of <b>{{$parent.cellTypeConditionsInfo[0].key}}</b> by <b>{{ $parent.cellTypeConditionsInfo[0].subKey }}</b> <span v-if="$parent.datasetSettings.selectedConditions[1]">and <b>{{$parent.datasetSettings.selectedConditions[1]}}</b></span></div>
                                    <div class="f-col" style="margin:10px 0 0" v-for="(item, i) in $parent.cellTypeConditionsInfo">
                                        <div class="f-row spread-out align-v-center" style="max-width:610px">
                                            <div style="font-size:14px;font-style:italic"><b>{{item.label}}</b></div>
                                            <div class="f-row" style="gap:10px;margin: 0 10px 0 0;">
                                                <div 
                                                @click="$parent.toggleStackChart(i)" 
                                                class="f-row toggle-pair"
                                                :class="`${$parent.chartStates[i].doStack ? 'toggled-b' : 'toggled-a'}`"
                                                >
                                                    <div class="toggle-a">group</div>
                                                    <div class="toggle-b">stack</div>
                                                </div>

                                                <div 
                                                @click="$parent.toggleNormalizeChart(i)" 
                                                class="f-row toggle-pair"
                                                :class="`${$parent.chartStates[i].doNormalize ? 'toggled-b' : 'toggled-a'}`"
                                                >
                                                    <div class="toggle-a">count</div>
                                                    <div class="toggle-b">% nrm</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="f-row" style="gap:10px">
                                            <stacked-bar-chart
                                                :data="item.data"
                                                :categoryKey="item.key"
                                                totalKey="Total"
                                                :subCategoryKeys="$parent.categoryKeys2(item.subKey)"
                                                :colors="$parent.colorsByCategory(item.subKey)"
                                                :normalize="$parent.chartStates[i].doNormalize"
                                                :barType="`${$parent.chartStates[i].doStack ? 'stacked' : 'grouped'}`"
                                                :orientation="`horizontal`"
                                                :width="610"
                                                :height="300"
                                                :fitToSize="true"
                                                :labelLeft="`${$parent.chartStates[i].doNormalize ? 'percent, normalized' : 'count'}`"
                                                :labelBottom="item.key"
                                            />
                                            <div class="f-col" style="margin:0;" v-if="i<1">
                                                <div class="f-col align-h-center" style="width:250px; aspect-ratio: 1; background:none;">
                                                    <umap-plot 
                                                        style=" border:1px solid #ccc;"
                                                        :points="$parent.coordinates"
                                                        :colors="item.umapColors"
                                                        :width="250"
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div class="f-col">
                                                <div class="f-col" style="gap:5px; " >
                                                    <div style="font-size:12px; line-height: 12px; color: gray; margin:0 0 5px 0">{{ item.subKey }}</div>
                                                </div>
                                                <div class="f-col" style="flex-wrap: wrap;">
                                                    <div class="f-row align-v-center" style="gap:5px; font-size: 11px; line-height: 12px;" v-for="categoryKey in $parent.categoryKeys2(item.subKey)">
                                                        <div :style="`width:10px; height:10px; background:${$parent.fieldColors[item.subKey][categoryKey]}`"></div>
                                                        <div style="white-space: nowrap;">{{ categoryKey }}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="f-col table-drawer" data-state="closed" v-if="$parent.cellTypeConditionTable" >
                                        <div class="f-col align-h-center table-drawer-handle" style="gap:10px; padding:25px 0" @click="$parent.toggleTableDrawer">
                                            <div class="f-col no-events align-h-center">
                                                <div style="font-size: 12px;">❮</div>
                                                <div style="width:25px;"><svg viewBox="0 0 24.00 24.00" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" stroke="#CCCCCC" stroke-width="0.048"></g><g id="SVGRepo_iconCarrier"> <path d="M3 9.5H21M3 14.5H21M8 4.5V19.5M6.2 19.5H17.8C18.9201 19.5 19.4802 19.5 19.908 19.282C20.2843 19.0903 20.5903 18.7843 20.782 18.408C21 17.9802 21 17.4201 21 16.3V7.7C21 6.5799 21 6.01984 20.782 5.59202C20.5903 5.21569 20.2843 4.90973 19.908 4.71799C19.4802 4.5 18.9201 4.5 17.8 4.5H6.2C5.0799 4.5 4.51984 4.5 4.09202 4.71799C3.71569 4.90973 3.40973 5.21569 3.21799 5.59202C3 6.01984 3 6.57989 3 7.7V16.3C3 17.4201 3 17.9802 3.21799 18.408C3.40973 18.7843 3.71569 19.0903 4.09202 19.282C4.51984 19.5 5.07989 19.5 6.2 19.5Z" stroke="#000000" stroke-width="1.2"></path> </g></svg></div>
                                            </div>
                                            <div class="no-events" style="transform: rotate(-90deg);">Table</div>
                                        </div>
                                        <b-table 
                                        style="font-size: 14px; width:auto;"
                                        small
                                        responsive
                                        striped
                                        ref="cellConditionTable"
                                        @sort-changed="$parent.onSortChanged"
                                        :items="$parent.cellTypeConditionTable.rows" 
                                        :fields="$parent.cellTypeConditionTable.header">
                                            <template #cell(Total)="data">
                                                <span class="bold">{{ data.value }}</span>
                                            </template>
                                        </b-table>
                                    </div>
                                </div>
                                

                                
                            </div>
                        </div>
                    </div>
                    <!--section gene-->
                    <div class="f-row" style="gap:20px">
                        <!--sidebar-->
                        <div class="f-col" style="min-width:250px; width:250px; margin: 50px 0 0; background:#e4e4e4; padding:10px">
                            <div class="f-col">
                                <div class="f-row spread-out">
                                    <div class="sidebar-label">Gene Search</div>
                                    <div style="position:relative;margin: -15px -10px 0 0;">
                                        <div class="gene-search-spinner" :style="`display: ${$parent.isLoading ? 'block' : 'none'}`"></div>
                                    </div>
                                </div>
                                <input class="gene-search-input" type="text" placeholder="Search gene name(s)"
                                    @keyup.enter="$parent.searchGene($event)"
                                />
                                <template v-if="$parent.geneNames.length>0">
                                    <div class="gene-list" style="flex-wrap: wrap; gap:5px">
                                        <template v-for="gene in $parent.geneNames">
                                            <div class="f-row align-v-center" style="flex-direction: row-reverse;">
                                                <div class="f-col align-h-center align-v-center gene-remove-btn" @click="$parent.removeGene(gene)">✖</div>
                                                <div class="f-row gene-list-item"
                                                    :class="`${gene === $parent.activeGene ? 'gene-selected' : ''}`"
                                                    :data-gene="gene"
                                                    @click="$parent.setActiveGene(gene)"
                                                >
                                                {{ gene }}
                                                </div>
                                            </div>
                                        </template>
                                    </div>
                                    <!--
                                    <div class="f-col" style="font-size:12px; padding:10px">
                                            <div class="f-row align-v-center spread-out" v-for="gene in $parent.geneNames">
                                                <div class="f-row" style="gap:5px;">
                                                    <div>★</div><div>{{ gene }}</div>
                                                </div>
                                                <div>✖</div>
                                            </div>
                                            
                                        </div>
                                    -->
                                </template>
                            </div>
                        </div>
                        <!--content-->
                        <div class="f-row">
                            <div class="f-col" style="position: relative; gap: 20px; max-width: 1010px;" v-if="$parent.donorInfo ">
                                <div class="f-col" style="max-width: 870px;">
                                    <div class="section-title">Gene Expression</div>
                                    
                                    <div style="font-size:12px; margin-bottom:20px;max-width: 880px;">
                                        <div v-if="$parent.genesInfo">{{ $parent.genesInfo }}</div>
                                        <div v-else>Search a gene on the left to see its expression by cell type and condition.</div>
                                    </div>
                                    
                                </div>
                                
                                <div class="f-row" style="width:1010px;gap: 20px;" v-if="$parent.expressionStats.length>0">
                                    <div class="f-col" style="width: 600px; min-width:600px; overflow-x: scroll; padding-bottom:20px">
                                        <div class="chart-title">Gene expression by <b>{{$parent.cellTypeInfo.key}}</b></div>
                                        <heatmap-dot-plot v-for="(item, i) in $parent.expressionStats"
                                            :data="item"
                                            orientation="horizontal"
                                            :fitToSize="false"
                                            :showTopLabels="i<1"
                                            :marginTop="i<1?0:1"
                                            :marginBottom="1"
                                        />
                                    </div>
                                    <div class="f-row">
                                        <div class="f-col legends" style="gap:5px">
                                            <div class="f-col legend">
                                                <div class="label">Gene Expression</div>
                                                <div class="gradient" :style="`background: linear-gradient(to left, ${$parent.colorScalePlasmaColorsArray});`"></div>
                                                <div class="f-row marks"><div>0.0</div><div>3.0</div></div>
                                            </div>
                                            <div class="f-col legend">
                                                <div class="label">Expressed in Cells (%)</div>
                                                <div class="f-row circles">
                                                    <div class="circleBorder"><div class="circle" style="height:20%"></div></div>
                                                    <div class="circleBorder"><div class="circle" style="height:40%"></div></div>
                                                    <div class="circleBorder"><div class="circle" style="height:60%"></div></div>
                                                    <div class="circleBorder"><div class="circle" style="height:80%"></div></div>
                                                    <div class="circleBorder"><div class="circle" style="height:100%"></div></div>
                                                </div>
                                                <div class="f-row marks"><div>0</div><div>100</div></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div v-if="$parent.combinedExpressionStats.length>0 && $parent.activeGene!==''" class="f-col" style="gap:10px;">
                                    <div class="f-col" style="gap:10px;">
                                        <div class="f-col">
                                            <div class="f-row" style="gap:20px">
                                                <div class="f-col">
                                                    <div class="chart-title"><b>{{$parent.activeGene}}</b> expression by <b>{{$parent.cellTypeInfo.key}}</b> and <b>{{ $parent.cellTypeConditionsInfo[0].subKey }}</b></div>
                                                    <div class="f-row align-v-bottom" style="height:fit-content; width: 600px;overflow-x: scroll; padding-bottom:20px">
                                                        <heatmap-dot-plot 
                                                            :data="$parent.combinedExpressionStats[0]"
                                                            orientation="vertical"
                                                            :fitToSize="false"
                                                            :marginLeft="40"
                                                        />
                                                        <div class="f-col">
                                                            <heatmap-dot-plot 
                                                                :data="$parent.combinedExpressionStats[1]"
                                                                orientation="horizontal"
                                                                :fitToSize="false"
                                                                :showLeftLabels="false"
                                                                :marginLeft="5"
                                                            />
                                                            <heatmap-dot-plot 
                                                                :data="$parent.combinedExpressionStats[2]"
                                                                orientation="vertical"
                                                                :fitToSize="false"
                                                                :showTopLabels="false"
                                                                :showLeftLabels="false"
                                                                :marginLeft="5"
                                                                :marginTop="5"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div class="f-col" style="margin:0;">
                                                    <div class="chart-title" style="margin:0 0 10px 0">UMAP {{ $parent.activeGene }}</div>
                                                    <div class="f-col align-h-center" style="width:250px; height:300px; background:none;">
                                                        <umap-plot 
                                                            style=" border:1px solid #ccc;"
                                                            :points="$parent.coordinates"
                                                            :colors="$parent.calcUmapExpressionColors"
                                                            :width="250"
                                                        />
                                                    </div>
                                                </div>
                                                
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


                <!-- blank -->
                
            </div>
                
                <!-- FOOTER -->
            <matkp-footer></matkp-footer>
        </div>
    </div>
</template>
  
<style>
/*@import url("/css/table.css");*/
.no-select {
  user-select: none;
  -webkit-user-select: none; /* Safari */
  -moz-user-select: none; /* Firefox */
  -ms-user-select: none; /* Internet Explorer/Edge */
}
.cursor-grabbing{
    /*cursor: grabbing !important;*/
}

.anatomogram {
    display: flex;
    justify-content: center;
}
.anatomogram img {
    width: 130px;
}

.table-drawer{
    max-width: calc(100vw - 300px);
    position: absolute;
    top: 0px;
    left: calc(100% - 80px);
    background: white;
    padding: 30px 30px 30px 60px;
    max-height: 100%;
}
.table-drawer-handle{
    width:40px;
    height:100%;
    background:#ffd10c;
    cursor: pointer;
    position: absolute;
    left:0;
    top:0;
}
table.table{
    width:auto;
}
table.table th, table.table td{
    padding: 2px 13px;
    position:relative;
}
table.table th div {
    white-space: nowrap;
}
.border-right2 {
    border-right: 1px solid black;
}
.isRef::after {
    content: '';
    width: 100%;
    height: 2px;
    position: absolute;
    background: gold;
    bottom: 0;
    left: 0;
}
button.add-factor {
    width: fit-content;
    align-self: center;
    position: absolute;
    bottom: -30px;
}
.round-white{
    border: 0;
    background: white;
    border-radius: 10px;
}

.table-swatch{
    width:8px;
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
}

.swapBtn {
    position: absolute;
    right: 0;
    top: -100%;
}

.categories:nth-child(even) {
    background: #dddddd;
}

.category-label{
    overflow: hidden;
    margin: 0 30px 0 0;
}
.category-label-select {
    width: 15px;
    text-align: center;
    opacity:0.75;
    color: #ddd;
    cursor: pointer;
    position: relative;
    /*box-shadow: inset 0 0 2px 0px #bbb;
    border: 0.5px solid #bbbbbb;*/
}
.categories-list.maxA .category-label-select[data-side='left']:not(.category-label-selected),
.categories-list.maxB .category-label-select[data-side='right']:not(.category-label-selected) {
    opacity: 0.2;
    cursor:default;
}
body.cursor-grabbing .category-label-select{
    cursor:inherit;
}
.category-label-select:hover{
    opacity:1;
    color: black;
    background: #ffd10c;
}
.category-label-select.category-label-selected{
    opacity:1;
    font-weight: bold;
    color: black;
    background: #ffd10c;
}

.category-label-lock {
    width: 12px;
    height: auto;
    position: absolute;
    top: -1px;
    opacity: 0.2;
    font-size: 14px;
    line-height: 20px;
    font-weight: normal;
}
.category-label-lock svg {
    width: 100%;
    height: 100%;
}
.category-label-lock:hover{
    opacity:1;
}
.category-locked{
    opacity: 1;
    font-weight: bold;
    color:#ff6c02;
}

.chart-title{
    font-size: 14px;
    font-style: italic;
}

.f-tooltip{
    position: absolute;
}
.f-tooltip-right{
    left:100%;
    top: 50%;
    transform: translateY(-50%);
    padding: 0 0 0 10px;
}
.f-tooltip-right::after {
    content: '';
    width: 0;
    height: 0;
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;
    border-right: 10px solid white;
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
}
.f-tooltip-left{
    left:0;
    top: 50%;
    transform: translate(-100%, -50%);
    padding: 0 10px 0 0;
}
.f-tooltip-left::after {
    content: '';
    width: 0;
    height: 0;
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;
    border-left: 10px solid white;
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
}

.category-label-extra{
    display: none;
}
.category-label-extra-box{
    background:white;
    border-radius: 10px;
    padding:3px 10px;
}
.category-label-select:hover .category-label-extra{
    display:flex;
}

.gene-search-input {
    text-transform: uppercase;
}
.gene-search-input::placeholder{
    text-transform: none;
}
.gene-list {
    display: flex;
    background: #ccc;
    padding: 10px;
    gap: 10px;
    border-radius: 0 0 5px 5px;
}
.gene-list-item {
    background: white;
    padding: 2px 5px;
    font-size: 12px;
    border-radius: 5px;
    cursor: pointer;
    position: relative;
}
.gene-list-item:hover:after {
    content: '★';
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background: #fff;
    border-radius: inherit;
    display: flex;
    align-items: center;
    justify-content: center;
    color: gold;
}
.gene-label {
    font-size: 12px;
    transform-origin: left top;
    transform: rotate(-90deg) translateY(-50%);
    position: absolute;
    bottom: 0;
    left: 50%;
    white-space: nowrap;
    pointer-events: none;
}

.gene-list-item.gene-selected {
    background: gold;
}

.gene-remove-btn {
    cursor: pointer;
    color: #909090;
    font-size: 12px;
    width: 20px;
    aspect-ratio: 1;
}
.gene-remove-btn:hover{
    color: red;
}
.gene-remove-btn:hover + .gene-list-item{
    background:red;
}

.fixed-sidebar{
    position:fixed;
    top:40px;
}


.legends {
    gap: 20px;
}
.legend {
    width: 125px;
    margin: 0 10px 0 0;
}
.legend .label {
    font-size: 11px !important;
}
.legend .gradient {
    height: 15px;
    width: -webkit-fill-available;
    border-radius: 20px;
}
.legend .circles {
    height: 15px;
    width: -webkit-fill-available;
    justify-content: space-between;
    padding: 0 0;
}
.legend .circleBorder {
    border: 1px solid #ccc;
    border-radius: 50%;
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
}
.legend .circle {
    aspect-ratio: 1;
    background: #ccc;
    border-radius: 50%;
    align-self: center;
}
.legend .marks {
    justify-content: space-between;
    font-size: 11px;
    margin-top: 3px;
}

.gene-search-spinner,
.data-load-spinner{
    width: 20px;
    height: 20px;
    background: #ffd10c;
    position: absolute;
    left: -30px;
    top: 10px;
    animation: rotationBack 1s ease-in-out infinite reverse;
}
@keyframes rotationBack {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(-360deg);
  }
}

.section-title {
    border-bottom: 5px solid #ffd10c;
    font-weight: bold;
    width: fit-content;
    margin: 20px 0 10px 0;
}

.toggle-pair {
    cursor:pointer;
    background: #ccc;
    border-radius: 10px;
    box-shadow: inset 0 0 3px 0px rgba(0, 0, 0, .2);
}
.toggle-a, .toggle-b {
    font-size:11px; 
    padding:2px 7px; 
    border-radius: 10px;
    background: transparent;
}
.toggled-a .toggle-a, 
.toggled-b .toggle-b {
    background: white;
}

.sidebar-label{
    font-weight: bold;
    font-size: 14px;
}
.sidebar-note{
    font-size: 12px;
    line-height: 12px;
    margin: 0 0 10px;
    padding: 10px;
    background: white;
}

.more-less{
    overflow:hidden;
    margin: 0 0 5px 0;
}
.more-less-button{
    align-self: flex-end;
    padding: 0 5px;
    margin: 5px;
    background: white;
    cursor:pointer;
    font-weight: bold;
    border-radius: 5px;
}

@media (min-width:1400px){
    .mat-body{
        padding-left:calc(50% - 700px) !important;
    }
}
</style>
  