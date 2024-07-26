<template>
    <div class="matkp">
        <div class="f-col fill-height" style="height:fit-content; min-height:100vh;">
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
                            <div class="f-row spread-out" style="font-size:14px; margin:10px 0 0;">
                                <div class="f-col" >
                                    <div class="f-row" style="gap:5px;"><div class="bold">Species:</div> <div>{{$parent.currentDataset['species'][0]}}</div></div>
                                    <div class="f-row" style="gap:5px;"><div class="bold">Depot:</div> <div>{{$parent.currentDataset['tissue'].join(', ')}}</div></div>
                                    <div class="f-row" style="gap:5px;"><div class="bold">Total Cells:</div> <div>{{$parent.currentDataset['totalCells'].toLocaleString()}}</div></div>
                                </div>
                                <div class="f-col" style="position:relative">
                                    <div class="gene-search-spinner" :style="`display: ${$parent.isLoading ? 'block' : 'none'}`"></div>
                                    <input class="gene-search-input" type="text" placeholder="Search gene name(s)"
                                        @keyup.enter="$parent.searchGene($event)"
                                    />
                                    <template v-if="true">
                                        <div class="gene-list">
                                            <template v-for="gene in $parent.geneNames">
                                                <div class="gene-list-item" 
                                                    :data-gene="gene"
                                                    @click="$parent.removeGene($event)"
                                                >
                                                {{ gene }}
                                                </div>
                                            </template>
                                        </div>
                                    </template>
                                </div>
                            </div>
                        </div>
                        
                    </div>
                </div>
                <div class="f-row" style="margin:40px 0; gap:20px; position: relative;">
                    <div class="f-col sidebar-parent" style="min-width: 250px; position: relative">
                        <div :class="`sidebar ${$parent.fixedSidebar ? 'fixed-sidebar' : ''}`" style="width:250px">
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
                                <!--<div class="f-col align-v-center categories-list" :class="`${$parent.categoriesLeft.length===1?'maxA':''} ${$parent.categoriesRight.length===1?'maxB':''}`">-->
                                <div class="f-col align-v-center categories-list">
                                    <div class="f-row" style="gap:5px;">
                                        <input 
                                            type="checkbox" 
                                            class="category-label-select"
                                            :class="`${ $parent.categoriesLeft.includes(category) ? 'category-label-selected' : ''}`" 
                                            :checked="$parent.categoriesLeft.includes(category)"
                                            :data-category="category" 
                                            :data-side="'left'"
                                            @click="$parent.toggleCategory"
                                            :disabled="$parent.categoriesLeft.length===1 && !$parent.categoriesLeft.includes(category)"
                                        >
                                        <input 
                                            type="checkbox" 
                                            class="category-label-select"
                                            :class="`${ $parent.categoriesRight.includes(category) ? 'category-label-selected' : ''}`" 
                                            :checked="$parent.categoriesRight.includes(category)" 
                                            :data-category="category" 
                                            :data-side="'right'"
                                            @click="$parent.toggleCategory"
                                            :disabled="$parent.categoriesRight.length===1 && !$parent.categoriesRight.includes(category)"
                                        >
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="f-col" style="flex-grow: 1; gap:10px;">


                        <div class="f-row spread-out" v-if="$parent.currentDataset && $parent.categoriesLeft.length===0 && $parent.categoriesRight.length===0">
                            <div class="f-row align-v-center" style="gap:10px"><span style="transform:rotate(-180deg); font-size: 24px;">➡</span> Select categories</div>
                            <div class="f-row align-v-center" style="gap:10px">Then search gene(s) <span style="transform:rotate(-90deg); font-size: 24px;">➡</span></div>
                        </div>


                        <div class="f-col" style="position: relative; gap:10px;">
                            <div class="f-col" style="gap:10px" v-if="$parent.geneNames.length > 0">
                                <div class="f-row spread-out" style="width:880px">
                                    <div>Gene Expression</div>
                                    <div class="f-row legends">
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
                                
                                <!--<div class="chart-title">{{ $parent.activeGene }} in A</div>-->
                                <div class="f-row" style="gap:10px;">
                                    <!--
                                    <div class="f-row" style="width:610px; overflow-x:auto; gap:10px">
                                        <div class="f-col">
                                            <div class="chart-title">A Expression</div>
                                            <div v-if="$parent.geneExpressionA">
                                                <heatmap-dot-plot 
                                                    :data="$parent.geneExpressionA"
                                                    orientation="vertical"
                                                    :fitToSize="false"
                                                />
                                            </div>
                                        </div>
                                        <div class="f-col">
                                            <div class="chart-title">B Expression</div>
                                            <div v-if="$parent.geneExpressionB">
                                                <heatmap-dot-plot 
                                                    :data="$parent.geneExpressionB"
                                                    orientation="vertical"
                                                    :fitToSize="false"
                                                />
                                            </div>
                                        </div>
                                        <div class="f-col" v-if="$parent.coordinateColorsGene.length>0" style="margin:0;">
                                            <div class="chart-title" style="margin:0 0 10px 0">UMAP {{ $parent.geneNames[0] }}</div>
                                            <div class="f-col align-h-center" style="width:250px; height:300px; background:none;">
                                                <umap-plot 
                                                    style=" border:1px solid #ccc;"
                                                    :points="$parent.coordinates"
                                                    :colors="$parent.coordinateColorsGene"
                                                    :width="250"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    -->
                                    <!--
                                    <b-table
                                        small
                                        responsive
                                        striped
                                        :items="$parent.dgeRows"
                                        :fields="$parent.dgeHeaders"
                                    >
                                        <template #cell()="data">
                                            <span :style="`background: ${typeof data.value === 'boolean' ? data.value ? 'red' : 'black' : ''}`">
                                                {{ data.value }}
                                            </span>
                                        </template>
                                    </b-table>
                                    -->
                                </div>
                                <div class="f-col" style="gap:10px">
                                    <div class="f-col" style="gap:10px;" v-for="(value, gene) in $parent.combinedExpression">
                                        <div class="f-col">
                                            <div class="f-row" style="gap:10px">
                                                <div class="f-col">
                                                    <div class="chart-title">{{gene}}</div>
                                                    <div class="f-row align-v-bottom" style="height:fit-content; width: 610px;overflow-x: scroll;">
                                                        <heatmap-dot-plot 
                                                            :data="{[gene]: $parent.geneExpressionB[gene]}"
                                                            orientation="vertical"
                                                            :fitToSize="false"
                                                            :marginLeft="40"
                                                        />
                                                        <div class="f-col">
                                                            <heatmap-dot-plot 
                                                                :data="{[gene]: $parent.geneExpressionA[gene]}"
                                                                orientation="horizontal"
                                                                :fitToSize="false"
                                                                :showLeftLabels="false"
                                                                :marginLeft="5"
                                                            />
                                                            <heatmap-dot-plot 
                                                                :data="value"
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
                                                    <div class="chart-title" style="margin:0 0 10px 0">UMAP {{ gene }}</div>
                                                    <div class="f-col align-h-center" style="width:250px; height:300px; background:none;">
                                                        <umap-plot 
                                                            style=" border:1px solid #ccc;"
                                                            :points="$parent.coordinates"
                                                            :colors="$parent.coordinateColorsGene[gene]"
                                                            :width="250"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="f-col table-drawer" data-state="closed" v-if="$parent.expressionRows.length>0" >
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
                                    :items="$parent.expressionRows" 
                                    :fields="$parent.expressionHeaders"
                                >
                                    <template #cell(label)="data">
                                        <span>{{ data.value }}</span>
                                    </template>
                                    <template v-for="gene in $parent.geneNames" v-slot:([`${gene}_mean`])="data">
                                        <span>{{ data.value.toFixed(2) }}</span>
                                    </template>
                                    <template v-for="gene in $parent.geneNames" v-slot:([`${gene}_percent`])="data">
                                        <span>{{ data.value.toFixed(2) }}%</span>
                                    </template>
                                </b-table>
                            </div>
                        </div>


                        <div class="f-col" style="position: relative; gap:10px;" v-if="$parent.categoriesLeft.length>0 || $parent.categoriesRight.length>0">
                            <div>Cell Composition</div>
                            <div class="f-row" style="gap:10px">
                                <div class="f-col" style="gap:10px; flex-grow:1">
                                    <div class="f-row" style="gap:10px; position:relative">
                                        <div class="f-col" v-if="$parent.categoriesLeft.length>0">
                                            <div class="chart-title" style="margin:0 0 10px 0">Distribution of A</div>
                                            <stacked-bar-chart
                                                :data="$parent.sortedRowsA"
                                                :categoryKey="$parent.categoriesLeft.join('|')"
                                                totalKey="Total"
                                                :colors="$parent.categoryColors('left')"
                                                :normalize="false"
                                                :barType="`grouped`"
                                                :orientation="`horizontal`"
                                                :width="610"
                                                :height="300"
                                                :fitToSize="true"
                                                :labelLeft="`count`"
                                                :labelBottom="$parent.categoriesLeft.join('|')"
                                                :margins="{top: 30, right: 10, bottom: 50, left:95}"
                                            />
                                        </div>
                                        
                                        <div class="f-col" v-if="$parent.categoriesLeft.length>0" style="margin:0;">
                                            <div class="chart-title" style="margin:0 0 10px 0">UMAP A</div>
                                            <div class="f-col align-h-center" style="width:250px; aspect-ratio: 1; background:none;">
                                                <umap-plot 
                                                    style=" border:1px solid #ccc;"
                                                    :points="$parent.coordinates"
                                                    :colors="$parent.coordinateColorsA"
                                                    :width="250"
                                                />
                                            </div>
                                        </div>

                                        <div class="f-col" v-if="$parent.categoriesLeft.length>0">
                                            <div class="f-col" style="gap:5px; margin:0 0 5px 0" >
                                                <div class="chart-title">Legend A</div>
                                                <div style="font-size:12px; line-height: 12px; color: gray;">{{ $parent.categoriesLeft.join('|') }}</div>
                                            </div>
                                            <div class="f-col" style="flex-wrap: wrap;  height:287px">
                                                <div class="f-row align-v-center" style="gap:5px; font-size: 11px; line-height: 12px;" v-for="category in $parent.sortedRowsA">
                                                    <div :style="`width:10px; height:10px; background:${$parent.fieldColors[$parent.categoriesLeft.join('|')][category[$parent.categoriesLeft.join('|')]]}`"></div>
                                                    <div style="white-space: nowrap;">{{ category[$parent.categoriesLeft.join('|')] }}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="f-col table-drawer" data-state="closed" v-if="$parent.sortedRowsA.length>0" >
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
                                            :items="$parent.sortedRowsA" 
                                            :fields="$parent.headersA">
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

                                    <div class="f-row" style="gap:10px; position:relative">
                                        <div class="f-col" v-if="$parent.categoriesRight.length>0">
                                            <div class="chart-title" style="margin:0 0 10px 0">Distribution of B</div>
                                            <stacked-bar-chart
                                                :data="$parent.sortedRowsB"
                                                :categoryKey="$parent.categoriesRight.join('|')"
                                                totalKey="Total"
                                                :colors="$parent.categoryColors('right')"
                                                :normalize="false"
                                                :barType="`grouped`"
                                                :orientation="`horizontal`"
                                                :width="610"
                                                :height="300"
                                                :fitToSize="true"
                                                :labelLeft="`count`"
                                                :labelBottom="`${$parent.categoriesRight.join('|')}`"
                                                :margins="{top: 30, right: 10, bottom: 50, left:95}"
                                            />
                                        </div>
                                        <div class="f-col" v-if="$parent.categoriesRight.length>0" style="margin:0;">
                                            <div class="chart-title" style="margin:0 0 10px 0">UMAP B</div>
                                            <div class="f-col align-h-center" style="width:250px; aspect-ratio: 1; background:none;">
                                                <umap-plot 
                                                    style=" border:1px solid #ccc;"
                                                    :points="$parent.coordinates"
                                                    :colors="$parent.coordinateColorsB"
                                                    :width="250"
                                                />
                                            </div>
                                        </div>

                                        <div class="f-col" v-if="$parent.categoriesRight.length>0">
                                            <div class="f-col" style="gap:5px; margin:0 0 5px 0">
                                                <div class="chart-title">Legend B</div>
                                                <div style="font-size:12px; line-height: 12px; color: gray;">{{ $parent.categoriesRight.join('|') }}</div>
                                            </div>
                                            <div class="f-col" style="flex-wrap: wrap; height:287px">
                                                <div class="f-row align-v-center" style="gap:5px; font-size: 11px; line-height: 12px" v-for="category in $parent.sortedRowsB">
                                                    <div :style="`width:10px; height:10px; background:${$parent.fieldColors[$parent.categoriesRight.join('|')][category[$parent.categoriesRight.join('|')]]}`"></div>
                                                    <div style="white-space: nowrap;">{{ category[$parent.categoriesRight.join('|')] }}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="f-col table-drawer" data-state="closed" v-if="$parent.sortedRowsB.length>0" >
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
                                            :items="$parent.sortedRowsB" 
                                            :fields="$parent.headersB">
                                                <template #cell(Total)="data">
                                                    <span class="bold">{{ data.value }}</span>
                                                </template>
                                                <template v-slot:[`cell(${$parent.categoryString($parent.categoriesRight)})`]="data">
                                                    <span class="table-swatch" :style="`background:${$parent.fieldColors[data.field.key][data.value]}`"></span><span style="white-space: nowrap;">{{ data.value }}</span> 
                                                </template>
                                                <template v-for="category in $parent.categoryKeysRight" v-slot:[`head(${category})`]="data">
                                                    <span class="table-swatch" :style="`background:${$parent.fieldColors[$parent.categoriesRight.join('|')][data.label]}`"></span><span>{{ data.label }}</span>
                                                </template>
                                            </b-table>
                                        </div>
                                    </div>

                                    <template v-if="$parent.categoriesLeft.length>0 && $parent.categoriesRight.length>0">
                                        <!--<div style="margin: 0 0 0 0" >How does cell type abundance change by condition?</div>-->
                                        <div class="f-row" style="gap:10px; position:relative">
                                            <div class="f-col">
                                                <div class="f-row spread-out align-v-center">
                                                    <div class="chart-title" style="margin:0 0 10px 0">Relative abundance of B by A</div>
                                                    <div class="f-row" style="gap:10px;margin: 0 10px 0 0;">
                                                        <div @click="$parent.toggleStack" class="round-white" style="font-size:12px; padding:5px; cursor:pointer;">
                                                            <div>{{ $parent.doStack ? 'group' : 'stack'}}</div>
                                                        </div>
                                                        <div @click="$parent.toggleNormalize" class="round-white" style="font-size:12px; padding:5px; cursor:pointer;">
                                                            <div>{{ $parent.doNormalize ? 'count' : '%nrm'}}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <stacked-bar-chart
                                                    :data="$parent.sortedRows"
                                                    :categoryKey="$parent.categoriesLeft.join('|')"
                                                    totalKey="Total"
                                                    :subCategoryKeys="$parent.categoryKeysRight"
                                                    :colors="$parent.categoryColors('right')"
                                                    :normalize="$parent.doNormalize"
                                                    :barType="`${$parent.doStack ? 'stacked' : 'grouped'}`"
                                                    :orientation="`horizontal`"
                                                    :width="610"
                                                    :height="300"
                                                    :fitToSize="true"
                                                    :labelLeft="`${$parent.doNormalize ? 'percent, normalized' : 'count'}`"
                                                    :labelBottom="$parent.categoriesLeft.join('|')"
                                                />
                                            </div>
                                            <div class="f-col">
                                                <div class="f-col" style="gap:5px; margin:0 0 5px 0">
                                                    <div class="chart-title">Legend B</div>
                                                    <div style="font-size:12px; line-height: 12px; color: gray;">{{ $parent.categoriesRight.join('|') }}</div>
                                                </div>
                                                <div class="f-col" style="flex-wrap: wrap; height:287px">
                                                    <div class="f-row align-v-center" style="gap:5px; font-size: 11px; line-height: 12px" v-for="category in $parent.sortedRowsB">
                                                        <div :style="`width:10px; height:10px; background:${$parent.fieldColors[$parent.categoriesRight.join('|')][category[$parent.categoriesRight.join('|')]]}`"></div>
                                                        <div style="white-space: nowrap;">{{ category[$parent.categoriesRight.join('|')] }}</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <!--
                                            <div class="f-col" style="margin: 0 0 0 20px;padding: 0 0 0 20px;border-left: 1px solid #bbb; width:200px">
                                                <div class="chart-title" style="margin:0 0 10px 0">Statistical significance:</div>
                                                <div style="font-size:14px;font-family:monospace">
                                                    <div class="f-row spread-out">fStatistic: <div>{{$parent.combinedBarsFstat?.toFixed(4)}}</div></div>
                                                    <div class="f-row spread-out">pValue: <div>{{$parent.combinedBarspVal?.toExponential(4)}}</div></div>
                                                    
                                                </div>
                                                
                                                <div style="font-size:12px; margin: 20px 0 0 0">
                                                    <div v-if="$parent.combinedBarspVal < 0.05">
                                                        With an alpha of < 0.05, the ANOVA results above suggest that some of the differences in cell type abundance across conditions are statistically significant.
                                                    </div>
                                                    <div v-else>
                                                        With an alpha of < 0.05, the ANOVA results above suggest that the differences in cell type abundance across conditions are NOT statistically significant.
                                                    </div>
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
                                    </template>
                                </div>
                            </div>
                            
                        </div>
                        </div>
                        
                    </div>
                </div>
                
                <!-- FOOTER -->
                <matkp-footer></matkp-footer>
            </div>

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
    content: '✖';
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
    color: red;
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
    font-size: 12px !important;
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
    font-size: 12px;
    margin-top: 3px;
}

.gene-search-spinner{
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
</style>
  