<template>
    <div class="matkp">
        <div class="f-col fill-height">
            <!-- NAV -->
            <matkp-nav></matkp-nav>

            <div class="mat-body" style="padding:20px">
                <div class="f-col" v-if="$parent.currentDataset">
                    <div class="f-row" style="gap:20px">
                        <div class="f-col" style="min-width:250px;">
                            <div class="anatomogram">
                                <img class="anatomy-human" :class="$parent.currentDataset['species'][0] ==='Human' ? '' : 'hidden'" src="https://hugeampkpncms.org/sites/default/files/users/user32/matkp/homo_sapiens.male_.svg">
                                <img class="anatomy-mouse" :class="$parent.currentDataset['species'][0] ==='Mouse' ? '' : 'hidden'" src="https://hugeampkpncms.org/sites/default/files/users/user32/matkp/mus_musculus.male_.svg">
                            </div>
                        </div>
                        <div class="f-col" style="gap:5px;">
                            <div class="bold">{{ $parent.currentDataset['datasetName'] }}</div>
                            <div style="font-size:12px;">{{ $parent.currentDataset['summary'] }}</div>
                            <div class="f-col" style="font-size:14px">
                                <div class="f-row" style="gap:5px;"><div class="bold">Species:</div> <div>{{$parent.currentDataset['species'][0]}}</div></div>
                                <div class="f-row" style="gap:5px;"><div class="bold">Depot:</div> <div>{{$parent.currentDataset['tissue'].join(', ')}}</div></div>
                                <div class="f-row" style="gap:5px;"><div class="bold">Samples:</div> <div>{{$parent.currentDataset['totalCells'].toLocaleString()}}</div></div>
                            </div>
                        </div>
                        
                    </div>
                </div>
                <div class="f-row" style="margin:40px 0; gap:20px; position: relative;">
                    <div class="f-col" style="width:250px;">
                        <div class="f-row spread-out" style="margin-bottom:5px; position:relative">
                            <div>Dataset Categories</div>
                            <div class="f-row" style="gap:10px;margin:0 4px;"><div>A</div><div>B</div></div>
                            
                            <button 
                                v-if="$parent.categoriesLeft.length>0 && $parent.categoriesRight.length>0"
                                @click="$parent.swapSides()" 
                                class="round-white swapBtn" 
                                style="font-size:12px;margin-right:0px;width:40px;"
                                >⇄
                            </button>
                            
                        </div>
                        
                        <div class="f-row spread-out categories" style="font-size: 14px; padding: 2px 2px 2px 13px;" 
                            v-for="category in $parent.listOfCategories"
                        >
                            <div class="category-label" :title="category">{{category}}</div>
                            <div class="f-col align-v-center categories-list" :class="`${$parent.categoriesLeft.length===2?'maxA':''} ${$parent.categoriesRight.length===2?'maxB':''}`">
                                <div class="f-row" style="gap:5px;">
                                    <input 
                                        type="checkbox" 
                                        class="category-label-select"
                                        :class="`${ $parent.categoriesLeft.includes(category) ? 'category-label-selected' : ''}`" 
                                        :checked="$parent.categoriesLeft.includes(category)"
                                        :data-category="category" 
                                        :data-side="'left'"
                                        @click="$parent.toggleCategory"
                                    >
                                    <input 
                                        type="checkbox" 
                                        class="category-label-select"
                                        :class="`${ $parent.categoriesRight.includes(category) ? 'category-label-selected' : ''}`" 
                                        :checked="$parent.categoriesRight.includes(category)" 
                                        :data-category="category" 
                                        :data-side="'right'"
                                        @click="$parent.toggleCategory"
                                    >
                                    <!--
                                    <div 
                                        class="category-label-select round-white" 
                                        :class="`${ $parent.categoriesLeft.includes(category) ? 'category-label-selected' : ''}`" 
                                        :data-category="category" 
                                        :data-side="'left'"
                                        @click="$parent.toggleCategory"
                                        >
                                        A
                                    </div>
                                    <div 
                                        class="category-label-select round-white" 
                                        :class="`${ $parent.categoriesRight.includes(category) ? 'category-label-selected' : ''}`"  
                                        :data-category="category" 
                                        :data-side="'right'"
                                        @click="$parent.toggleCategory"
                                        >
                                        B
                                    </div>
                                    -->
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="f-col" v-if="$parent.categoriesLeft.length>0 || $parent.categoriesRight.length>0">
                        <div>Cell Composition</div>
                        <div class="f-row" style="gap:20px; min-width: max-content">
                            <div class="f-col">
                                <div v-if="$parent.categoriesLeft.length>0">
                                    <div class="chart-title">Proportion of A across all cells</div>
                                    <stacked-bar-chart
                                        :data="$parent.sortedRowsA"
                                        :categoryKey="$parent.categoriesLeft.join('|')"
                                        totalKey="Total"
                                        :colors="$parent.categoryColors('left')"
                                        :normalize="true"
                                        :width="300"
                                        :labelTop="`percent`"
                                        :margins="{top: 30, right: 10, bottom: 50, left:95}"
                                    />
                                </div>
                                <div v-if="$parent.categoriesLeft.length>0 && $parent.categoriesRight.length>0">
                                    <div class="chart-title">Distribution of B within A</div>
                                    <stacked-bar-chart 
                                        :data="$parent.sortedRows"
                                        :categoryKey="$parent.categoriesLeft.join('|')"
                                        totalKey="Total"
                                        :subCategoryKeys="$parent.categoryKeysRight"
                                        :colors="$parent.categoryColors('right')"
                                        :normalize="false"
                                        :width="300"
                                        :labelTop="`count`"
                                        :labelBottom="`percent`"
                                        :labelLeft="$parent.categoriesLeft.join('|')"
                                    />
                                </div>
                                <div v-else-if="$parent.categoriesLeft.length>0">
                                    <div class="chart-title">Distribution of A across all cells</div>
                                    <stacked-bar-chart
                                        :data="$parent.sortedRowsA"
                                        :categoryKey="$parent.categoriesLeft.join('|')"
                                        totalKey="Total"
                                        :colors="$parent.categoryColors('left')"
                                        :normalize="false"
                                        :width="300"
                                        :labelTop="`count`"
                                        :labelBottom="`percent`"
                                        :labelLeft="$parent.categoriesLeft.join('|')"
                                        :margins="{top: 30, right: 10, bottom: 50, left:95}"
                                    />
                                </div>
                            </div>
                            <div class="f-col">
                                <div v-if="$parent.categoriesRight.length>0">
                                    <div class="chart-title">Proportion of B across all cells</div>
                                    <stacked-bar-chart
                                        :data="$parent.sortedRowsB"
                                        :categoryKey="$parent.categoriesRight.join('|')"
                                        totalKey="Total"
                                        :colors="$parent.categoryColors('right')"
                                        :normalize="true"
                                        :width="300"
                                        :labelTop="`percent`"
                                        :margins="{top: 30, right: 10, bottom: 50, left:95}"
                                    />
                                </div>
                                <div v-if="$parent.categoriesLeft.length>0 && $parent.categoriesRight.length>0">
                                    <div class="chart-title">Proportion of B within A</div>
                                    <stacked-bar-chart
                                        :data="$parent.sortedRows"
                                        :categoryKey="$parent.categoriesLeft.join('|')"
                                        totalKey="Total"
                                        :subCategoryKeys="$parent.categoryKeysRight"
                                        :colors="$parent.categoryColors('right')"
                                        :normalize="true"
                                        :width="300"
                                        :labelTop="`percent`"
                                        :labelLeft="$parent.categoriesLeft[0]"
                                    />
                                </div>
                                <div v-else-if="$parent.categoriesRight.length>0">
                                    <div class="chart-title">Distribution of B across all cells</div>
                                    <stacked-bar-chart
                                        :data="$parent.sortedRowsB"
                                        :categoryKey="$parent.categoriesRight.join('|')"
                                        totalKey="Total"
                                        :colors="$parent.categoryColors('right')"
                                        :normalize="false"
                                        :width="300"
                                        :labelTop="`count`"
                                        :labelBottom="`percent`"
                                        :margins="{top: 30, right: 10, bottom: 50, left:95}"
                                    />
                                </div>
                            </div>
                            <div class="f-col" style="gap:20px">
                                <div class="f-row" style="gap:20px" v-if="$parent.coordinateColorsA.length>0 || $parent.coordinateColorsB.length>0">
                                    <div class="f-col" v-if="$parent.categoriesLeft.length>0">
                                        <div class="chart-title" style="margin:0 0 10px 0">UMAP A</div>
                                        <div class="f-col align-v-center align-h-center" style="width:200px; height:200px; background:none; border:1px solid #ccc">
                                            <umap-plot 
                                                :points="$parent.coordinates"
                                                :colors="$parent.coordinateColorsA"
                                                :width="200"
                                            />
                                        </div>
                                    </div>
                                    <div class="f-col" v-if="$parent.categoriesRight.length>0">
                                        <div class="chart-title" style="margin:0 0 10px 0">UMAP B</div>
                                        <div class="f-col align-v-center align-h-center" style="width:200px; height:200px; background:none; border:1px solid #ccc;">
                                            <umap-plot 
                                                :points="$parent.coordinates"
                                                :colors="$parent.coordinateColorsB"
                                                :width="200"
                                            /></div>
                                    </div>
                                </div>
                                <div class="f-row" style="gap:20px" v-if="$parent.categoriesLeft.length>0 || $parent.categoriesRight.length>0">
                                    <div class="f-col" style="width:auto;" v-if="$parent.categoriesLeft.length>0">
                                        <div class="f-col" style="gap:5px; margin:0 0 5px 0">
                                            <div class="chart-title">Legend A</div>
                                            <div style="font-size:12px; line-height: 12px; color: gray;">{{ $parent.categoriesLeft.join('|') }}</div>
                                        </div>
                                        <div class="f-col" style="flex-wrap: wrap">
                                            <div class="f-row align-v-center" style="gap:5px; font-size: 11px; line-height: 12px;" v-for="category in $parent.sortedRowsA">
                                                <div :style="`width:10px; height:10px; background:${$parent.fieldColors[$parent.categoriesLeft.join('|')][category[$parent.categoriesLeft.join('|')]]}`"></div>
                                                <div style="white-space: nowrap;">{{ category[$parent.categoriesLeft.join('|')] }}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="f-col" v-if="$parent.categoriesRight.length>0">
                                        <div class="f-col" style="gap:5px; margin:0 0 5px 0">
                                            <div class="chart-title">Legend B</div>
                                            <div style="font-size:12px; line-height: 12px; color: gray;">{{ $parent.categoriesRight.join('|') }}</div>
                                        </div>
                                        <div class="f-col" style="flex-wrap: wrap">
                                            <div class="f-row align-v-center" style="gap:5px; font-size: 11px; line-height: 12px" v-for="category in $parent.sortedRowsB">
                                                <div :style="`width:10px; height:10px; background:${$parent.fieldColors[$parent.categoriesRight.join('|')][category[$parent.categoriesRight.join('|')]]}`"></div>
                                                <div style="white-space: nowrap;">{{ category[$parent.categoriesRight.join('|')] }}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <!--
                    <div v-else>
                        Instructions
                        <div style="font-size:14px">
                            <div>Select a dataset category by selecting it as an A or B component.</div>
                            <div>Compare categories by select one as A and another as B.</div>
                            <div>To combine categories you can select up to 2 A and B categories each.</div>
                        </div>
                    </div>
                    -->
                    <div class="f-col table-drawer" data-state="closed" v-if="$parent.sortedRows.length>0" >
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
                        :items="$parent.sortedRows" 
                        :fields="$parent.headers">
                            <template #thead-top>
                                <tr>
                                    <th v-for="col in $parent.headers2" :colspan="col.colspan" :style="`${col.colspan>1 ? 'border-bottom:1px solid black;' : ''}`">{{ col.label }}</th>
                                </tr>
                            </template>
                            <template #bottom-row>
                                <td v-for="(value, key) in $parent.footer" :key="key" role="cell" class="bold">
                                    {{ value }}
                                </td>
                            </template>
                            <template #cell(Total)="data">
                                <span class="bold">{{ data.value }}</span>
                            </template>
                            <template v-slot:[`cell(${$parent.categoryString($parent.categoriesLeft)})`]="data">
                                <span class="table-swatch" :style="`background:${$parent.fieldColors[data.field.key][data.value]}`"></span><span style="white-space: nowrap;">{{ data.value }}</span> 
                            </template>
                            <template v-for="category in $parent.categoryKeysRight" v-slot:[`head(${category})`]="data">
                                <span class="table-swatch" :style="`background:${$parent.fieldColors[$parent.categoriesRight.join('|')][data.label]}`"></span><span>{{ data.label }}</span>
                            </template>
                        </b-table>
                    </div>
                </div>
                
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
    top: -30px;
    left: calc(100vw - 80px);
    background: white;
    padding: 30px 30px 30px 60px;
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
</style>
  