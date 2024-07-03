<template>
    <div class="matkp">
        <div class="f-col fill-height">
            <!-- NAV -->
            <matkp-nav></matkp-nav>

            <div class="mat-body" style="padding:20px">
                <div class="f-row" style="gap:20px;">
                    <!--
                    <div class="f-col" style="border:1px solid;padding:10px;">
                        <div class="f-row align-h-center" style="font-size:12px;margin:10px 0 0;font-weight:bold;">
                            Cell
                            <span v-for="(selected, index) in $parent.selectedCalculations">
                                &nbsp;{{$parent.calculationOptions[selected].label}}{{$parent.selectedCalculations.length <= 1 ? '' : index === $parent.selectedCalculations.length-2 ? ', and ' : index < $parent.selectedCalculations.length - 1 ? ', ' : ''}}
                            </span>
                        </div>
                        <div class="f-row" style="gap:10px;font-size:12px;margin:10px 0;font-weight: bold;">
                            <div style="width:250px;text-align:center;">of</div>
                            <div style="width:22px;text-align:center;"></div>
                            <div style="width:250px;text-align:center;">by</div>
                        </div>

                        <div class="f-row align-v-center" style="gap:10px;font-weight:bold;font-size:12px;margin: 0 0 40px 0;">
                            <div class="f-col align-v-center" style="gap:10px;width:250px;position:relative">
                                <template v-for="(select, index) in $parent.categoriesRight">
                                <select @change="$parent.handleCategorySelect($event, 'right', index)">
                                    <option :value="null">none</option>
                                    <option v-for="option in $parent.listOfCategories" 
                                        :value="option"
                                        :selected="select===option ? true: false"
                                    >{{option}}</option>
                                </select>
                                </template>
                                <button class="add-factor round-white" @click="$parent.addFactor('right')">+ and</button>
                            </div>
                            <button @click="$parent.swapSides()" class="round-white" style="padding:0 5px;">⇄</button>
                            <div class="f-col align-v-center" style="gap:10px;width:250px;position:relative">
                                <template v-for="(select, index) in $parent.categoriesLeft">
                                <select @change="$parent.handleCategorySelect($event, 'left', index)">
                                    <option :value="null">none</option>
                                    <option v-for="option in $parent.listOfCategories" 
                                        :value="option"
                                        :selected="select===option ? true: false"
                                    >{{option}}</option>
                                </select>
                                </template>
                                <button class="add-factor round-white" @click="$parent.addFactor('left')">+ and</button>
                            </div>
                        </div>
                    </div>
                    -->
                    <!--
                    <div class="f-col" style="border:1px solid;padding:10px;">
                        <div class="f-row" style="gap:10px;font-size:12px;margin:10px 0;font-weight: bold;">
                            <div style="width:250px;text-align:center;">measure</div>
                        </div>
                        <select v-model="$parent.selectedCalculations" multiple style="width:250px;flex-grow:1;">
                            <option v-for="(value, key) in Object.keys($parent.calculationOptions)" 
                                :value="value"
                            >{{value}}</option>
                        </select>
                    </div>
                    -->
                </div>
                <div class="f-row" style="margin-top:70px; gap:20px">
                    
                    <div class="f-col" style="width:250px;">
                        <div class="f-row spread-out" style="margin-bottom:10px">
                            <div>Dataset Categories</div>
                            <button 
                                v-if="$parent.categoriesLeft.length>0 && $parent.categoriesRight.length>0"
                                @click="$parent.swapSides()" 
                                class="round-white" 
                                style="font-size:12px;margin-right:0px;width:40px;"
                                >⇄
                            </button>
                        </div>
                        <div class="f-row spread-out categories" style="font-size: 12px; padding: 2px 2px 2px 13px;" v-for="category in $parent.listOfCategories">
                            <div class="category-label" :title="category">{{category}}</div>
                            <div class="f-row" style="gap:5px;">
                                <div 
                                    class="category-label-select" 
                                    :class="`${ $parent.categoriesLeft.includes(category) ? 'round-white gold-bg bold' : ''}`" 
                                    :data-category="category" 
                                    @click="$parent.toggleCategory($event, 'left')"
                                    >
                                    A
                                    <div 
                                        :class="`category-label-lock ${$parent.lockedCategoriesLeft.includes(category) ? 'category-locked' : ''}`" 
                                        :style="`left:-15px;display:${($parent.categoriesLeft.includes(category) && $parent.lockedCategoriesLeft.length<1) || $parent.lockedCategoriesLeft.includes(category) ? 'block' : 'none'}`"
                                        @click="$parent.lockCategory($event, 'left')"
                                        >
                                        &
                                        <!-- plus, ampersand, lock
                                        <svg class="no-events" height="800" width="800" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 330 330" xml:space="preserve"><path d="M65 330h200c8.284 0 15-6.716 15-15V145c0-8.284-6.716-15-15-15h-15V85c0-46.869-38.131-85-85-85S80 38.131 80 85v45H65c-8.284 0-15 6.716-15 15v170c0 8.284 6.716 15 15 15zm115-95.014V255c0 8.284-6.716 15-15 15s-15-6.716-15-15v-20.014c-6.068-4.565-10-11.824-10-19.986 0-13.785 11.215-25 25-25s25 11.215 25 25c0 8.162-3.932 15.421-10 19.986zM110 85c0-30.327 24.673-55 55-55s55 24.673 55 55v45H110V85z"/></svg>
                                        -->
                                    </div>
                                </div>
                                <div 
                                    class="category-label-select" 
                                    :class="`${ $parent.categoriesRight.includes(category) ? 'round-white gold-bg bold' : ''}`"  
                                    :data-category="category" 
                                    @click="$parent.toggleCategory($event, 'right')"
                                    >
                                    B
                                    <div 
                                        :class="`category-label-lock ${$parent.lockedCategoriesRight.includes(category) ? 'category-locked' : ''}`" 
                                        :style="`left:unset;right:-15px;display:${($parent.categoriesRight.includes(category) && $parent.lockedCategoriesRight.length<1) || $parent.lockedCategoriesRight.includes(category) ? 'block' : 'none'}`"
                                        @click="$parent.lockCategory($event, 'right')"
                                        >
                                        &
                                        <!--
                                        <svg class="no-events" height="800" width="800" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 330 330" xml:space="preserve"><path d="M65 330h200c8.284 0 15-6.716 15-15V145c0-8.284-6.716-15-15-15h-15V85c0-46.869-38.131-85-85-85S80 38.131 80 85v45H65c-8.284 0-15 6.716-15 15v170c0 8.284 6.716 15 15 15zm115-95.014V255c0 8.284-6.716 15-15 15s-15-6.716-15-15v-20.014c-6.068-4.565-10-11.824-10-19.986 0-13.785 11.215-25 25-25s25 11.215 25 25c0 8.162-3.932 15.421-10 19.986zM110 85c0-30.327 24.673-55 55-55s55 24.673 55 55v45H110V85z"/></svg>
                                        -->
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="f-col">
                        <div class="f-row" style="gap:20px; min-width: max-content">
                            <div class="f-col">
                                <div v-if="$parent.aRows.length>0">
                                    Proportion of A across all cells
                                    <stacked-bar-chart
                                        :data="$parent.aRows"
                                        :categoryKey="$parent.categoriesLeft.join('|')"
                                        totalKey="Total"
                                        :colors="$parent.categoryColors($parent.categoriesLeft.join('|'))"
                                        :normalize="true"
                                        :width="300"
                                        :labelTop="`count`"
                                        :labelBottom="`percent`"
                                        :margins="{top: 30, right: 10, bottom: 50, left:95}"
                                    />
                                </div>
                                <div v-if="$parent.categoriesLeft.length>0 && $parent.categoriesRight.length>0">
                                    Proportion of B within A
                                    <stacked-bar-chart 
                                        :data="$parent.sortedItems"
                                        :categoryKey="$parent.categoriesLeft.join('|')"
                                        totalKey="Total"
                                        :subCategoryKeys="$parent.categoryKeys($parent.categoriesRight)"
                                        :colors="$parent.categoryColors($parent.categoriesRight.join('|'))"
                                        :normalize="false"
                                        :width="300"
                                        :labelTop="`count`"
                                        :labelBottom="`percent`"
                                        :labelLeft="$parent.categoriesLeft.join('|')"
                                    />
                                </div>
                                <div v-else-if="$parent.categoriesLeft.length>0">
                                    Proportion of A across all cells
                                    <stacked-bar-chart
                                        :data="$parent.aRows"
                                        :categoryKey="$parent.categoriesLeft.join('|')"
                                        totalKey="Total"
                                        :colors="$parent.categoryColors($parent.categoriesLeft.join('|'))"
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
                                    Proportion of B across all cells
                                    <stacked-bar-chart
                                        :data="$parent.bRows"
                                        :categoryKey="$parent.categoriesRight.join('|')"
                                        totalKey="Total"
                                        :colors="$parent.categoryColors($parent.categoriesRight.join('|'))"
                                        :normalize="true"
                                        :width="300"
                                        :labelTop="`count`"
                                        :labelBottom="`percent`"
                                        :margins="{top: 30, right: 10, bottom: 50, left:95}"
                                    />
                                </div>
                                <div v-if="$parent.categoriesLeft.length>0 && $parent.categoriesRight.length>0">
                                    Proportion of B within A (normalized)
                                    <stacked-bar-chart
                                        :data="$parent.sortedItems"
                                        :categoryKey="$parent.categoriesLeft.join('|')"
                                        totalKey="Total"
                                        :subCategoryKeys="$parent.categoryKeys($parent.categoriesRight)"
                                        :colors="$parent.categoryColors($parent.categoriesRight.join('|'))"
                                        :normalize="true"
                                        :width="300"
                                        :labelTop="`percent`"
                                        :labelLeft="$parent.categoriesLeft[0]"
                                    />
                                </div>
                                <div v-else-if="$parent.categoriesRight.length>0">
                                    Proportion of B across all cells
                                    <stacked-bar-chart
                                        :data="$parent.bRows"
                                        :categoryKey="$parent.categoriesRight.join('|')"
                                        totalKey="Total"
                                        :colors="$parent.categoryColors($parent.categoriesRight.join('|'))"
                                        :normalize="false"
                                        :width="300"
                                        :labelTop="`count`"
                                        :labelBottom="`percent`"
                                        :margins="{top: 30, right: 10, bottom: 50, left:95}"
                                    />
                                </div>
                            </div>
                            <div class="f-col" style="gap:20px">
                                <div class="f-row" style="gap:20px" v-if="$parent.categoriesLeft.length>0 || $parent.categoriesRight.length>0">
                                    <div class="f-col" v-if="$parent.categoriesLeft.length>0">
                                        <div style="margin:0 0 10px 0">UMAP A</div>
                                        <div class="f-col align-v-center align-h-center" style="width:200px; height:200px; background:#dddddd"></div>
                                    </div>
                                    <div class="f-col" v-if="$parent.categoriesRight.length>0">
                                        <div style="margin:0 0 10px 0">UMAP B</div>
                                        <div class="f-col align-v-center align-h-center" style="width:200px; height:200px; background:#dddddd"></div>
                                    </div>
                                </div>
                                <div class="f-row" style="gap:20px" v-if="$parent.categoriesLeft.length>0 || $parent.categoriesRight.length>0">
                                    <div class="f-col" v-if="$parent.categoriesLeft.length>0">
                                        <div class="f-col" style="gap:5px; margin:0 0 5px 0">
                                            <div>Legend A</div>
                                            <div style="font-size:12px; line-height: 12px; color: gray;">{{ $parent.categoriesLeft.join('|') }}</div>
                                        </div>
                                        <div class="f-col" style="flex-wrap: wrap">
                                            <div class="f-row align-v-center" style="gap:5px; font-size: 12px;" v-for="category in $parent.categoryKeys($parent.categoriesLeft)">
                                                <div :style="`width:15px; height:15px; background:${$parent.fieldColors[$parent.categoriesLeft.join('|')][category]}`"></div>
                                                <div style="white-space: nowrap;">{{ category }}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="f-col" v-if="$parent.categoriesRight.length>0">
                                        <div class="f-col" style="gap:5px; margin:0 0 5px 0">
                                            <div>Legend B</div>
                                            <div style="font-size:12px; line-height: 12px; color: gray;">{{ $parent.categoriesRight.join('|') }}</div>
                                        </div>
                                        <div class="f-col" style="flex-wrap: wrap">
                                            <div class="f-row align-v-center" style="gap:5px; font-size: 12px;" v-for="category in $parent.categoryKeys($parent.categoriesRight)">
                                                <div :style="`width:15px; height:15px; background:${$parent.fieldColors[$parent.categoriesRight.join('|')][category]}`"></div>
                                                <div style="white-space: nowrap;">{{ category }}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="f-col table-drawer" v-if="$parent.rows.length>0">
                        <div class="table-drawer-handle" data-state="closed" @click="$parent.toggleTableDrawer($event)"></div>
                        <b-table 
                        style="font-size: 14px; width:auto;"
                        small
                        responsive
                        striped
                        ref="cellTable"
                        @sort-changed="$parent.onSortChanged"
                        :items="$parent.rows" 
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
                                <span class="table-swatch" :style="`background:${$parent.fieldColors[data.field.key][data.value]}`"></span><span>{{ data.value }}</span> 
                            </template>
                            <template v-for="category in $parent.categoryKeys($parent.categoriesRight)" v-slot:[`head(${category})`]="data">
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
.table-drawer{
    max-width: calc(100vw - 300px);
    position: absolute;
    top: calc(145px - 30px);
    left: calc(100vw - 60px);
    background: white;
    padding: 30px;
}
.table-drawer-handle{
    width:10px;
    height:100%;
    background:#ddd;
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
    opacity:0.25;
    cursor: pointer;
    position: relative;
}
.category-label-select:hover{
    opacity:1;
}
.category-label-select.round-white{
    opacity:1;
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
  