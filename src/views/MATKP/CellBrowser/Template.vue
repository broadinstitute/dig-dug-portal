<template>
    <matkp-wrapper>
    <div class="mat-wrap f-col fill-height">
        <!-- NAV -->
        <matkp-nav></matkp-nav>

        <!-- BODY -->
        <div class="mat-body">

            <div class="f-row" style="margin: 80px 20px 20px; justify-content: space-between;">
                <div class="f-col" v-if="$parent.activeDataset">
                    <div style="font-size: 20px; font-weight: bold;">{{ $parent.getDatasetNamePart($parent.datasetsObj[$parent.activeDataset]["info"]["datasetName"]) }}</div>
                    <div style="font-style: italic;">{{ $parent.getDatasetNamePart($parent.datasetsObj[$parent.activeDataset]["info"]["datasetName"], "credit") }}</div>
                    <div :class="`loader ${!$parent.isLoading ? 'hidden' : ''}`">loading...</div>
                </div>
                <div class="col1 header-wrapper" style="max-width:250px">
                    <template v-if="$parent.datasetsObj && Object.keys($parent.datasetsObj).length > 0">
                        <div class="dataset-wrapper">
                            <div class="f-row dataset-selector">
                                <select @change="$parent.selectDataset($event)" style="width:100%">
                                    <option value="" selected disabled hidden>Datasets</option>
                                    <option 
                                        v-for="(value, key) in $parent.datasetsObj"
                                        :value="key"
                                    >
                                        {{ value["info"]["datasetName"] }}
                                    </option>
                                </select>
                            </div>
                        </div>
                    </template>
                </div>
            </div>

            <div class="row1 explore-wrapper" style="padding:20px 20px 150px" v-if="$parent.activeField">

                <div class="col1" style="width:250px; gap:15px; font-size:14px">
                    <div class="label underline" style="position:relative">
                        Dataset Info 
                    </div>
                    <!--
                    <div class="col1">
                        <div class="label">Mammal</div>
                        <select class="active-field-selector" disabled>
                            <option value="" disabled hidden>Select</option>
                            <option value="human" selected>Human</option>
                            <option value="mouse">Mouse</option>
                        </select>
                    </div>
                    -->
                    
                    <template>
                        <div class="col1" style="width:250px;">
                            <div class="anatomogram">
                                <img class="anatomy-human" :class="$parent.datasetsObj[$parent.activeDataset]['info']['species'][0] ==='Human' ? '' : 'hidden'" src="https://hugeampkpncms.org/sites/default/files/users/user32/matkp/homo_sapiens.male_.svg">
                                <img class="anatomy-mouse" :class="$parent.datasetsObj[$parent.activeDataset]['info']['species'][0]==='Mouse' ? '' : 'hidden'" src="https://hugeampkpncms.org/sites/default/files/users/user32/matkp/mus_musculus.male_.svg">
                            </div>
                        </div>
                    </template>
                    <template v-if="$parent.activeField">
                        <div class="col1 info-block">
                            <!--
                            <div class="row1 info-field">
                                <div class="info-field-label">Name</div><div class="info-field-data unknown">{{ Array.isArray($parent.activeDataset) ? $parent.activeDataset[0] : $parent.activeDataset }}</div>
                            </div>
                            -->
                            <div class="row1 info-field">
                                <div class="info-field-label">Species</div><div class="info-field-data">
                                    <template v-for="item in $parent.datasetsObj[$parent.activeDataset]['info']['species']">
                                        <div>{{item}}</div>
                                    </template>
                                </div>
                            </div>
                            <div class="row1 info-field">
                                <div class="info-field-label">Depot</div><div class="info-field-data">
                                    <template v-for="item in $parent.datasetsObj[$parent.activeDataset]['info']['depot']">
                                        <div>{{item}}</div>
                                    </template>
                                </div>
                            </div>
                            <!--
                            <div class="row1 info-field">
                                <div class="info-field-label">Method</div><div class="info-field-data">
                                    <template v-for="item in $parent.datasetsObj[$parent.activeDataset]['info']['method']">
                                        <div>{{item}}</div>
                                    </template>
                                </div>
                            </div>
                            <div class="row1 info-field">
                                <div class="info-field-label">Platform</div><div class="info-field-data">
                                    <template v-for="item in $parent.datasetsObj[$parent.activeDataset]['info']['platform']">
                                        <div>{{item}}</div>
                                    </template>
                                </div>
                            </div>
                            -->
                        </div>
                    </template>
                    <!--
                    <div class="col1">
                        <div class="label">Depot</div>
                        <select class="active-field-selector" disabled>
                            <option value="" disabled hidden>Select</option>
                            <option value="VAT" selected>VAT</option>
                            <option value="SAT">SAT</option>
                        </select>
                    </div>
                    -->
                    <template v-if="$parent.activeField && $parent.compareField">
                        <div class="col1">
                            <div class="label bold">Compare Condition</div>
                            <select class="comapre-field-selector" @change="$parent.selectCompareField($event)">
                                <option value="" selected disabled hidden>None</option>
                                <option 
                                    v-for="(value, key) in $parent.datasetsObj[$parent.activeDataset]['metadata']" 
                                    :key="key"
                                    :value="key"
                                    :disabled="key === $parent.activeField ? 'disabled' : false"
                                    :selected="key === $parent.compareField ? 'selected' : false"
                                >
                                    {{ key }}
                                </option>
                            </select>
                        </div>
                    </template>
                    <template v-if="$parent.activeField && $parent.datasetsObj[$parent.activeDataset]['genes']">
                        <div class="col1 grow" style="margin:20px 0 0;">
                            <div class="label" style="font-weight: bold;">Gene Search</div>
                            <input class="gene-search-input" type="text" placeholder="Gene Name(s)"
                                @keyup.enter="$parent.searchGene($event)"
                            />
                            
                            <template v-if="$parent.datasetsObj[$parent.activeDataset]['genes']">
                                <div class="gene-list">
                                    <template v-for="(value, gene) in $parent.datasetsObj[$parent.activeDataset]['genes']">
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
                    </template>
                </div>

                <!-- tables -->
                <div class="tables-wrapper" style="min-width:600px">

                    


                    <template v-if="$parent.activeField">
                        <!-- CELL COUNT/% -->

                        <!--<div @click="$parent.htmlTableToObject('#table1')">download</div>-->

                        <!--
                        <select @change="$parent.selectCellCount($event)">
                            <option v-for="(item, index) in $parent.cellCountOptions" :value="index" :selected="$parent.cellCountOption === index ? 'selected' : false">{{ item }}</option>
                        </select>
                        -->

                        <div class="label underline">Abundance & Distribution of Cell Types {{ !$parent.compareField ? '' : 'x '+$parent.labelFromAnnotation($parent.compareField)  }}</div>

                        <div class="cell-count-tables-wrapper overflow-h">
                            
                            <table id="table1" class="data-table">
                                <thead>
                                    <template v-if="$parent.compareSet">
                                        <tr class="field_labels">
                                            <th colspan="3"></th>
                                            <th class="border-bottom" :colspan="$parent.datasetsObj[$parent.activeDataset]['metadata_labels'][$parent.compareField].length">{{ $parent.labelFromAnnotation($parent.compareField) }}</th>
                                        </tr>
                                        <tr>
                                            <th colspan="3"></th>
                                            <template v-for="(value2, key2) in $parent.datasetsObj[$parent.activeDataset]['metadata_labels'][$parent.compareField]">
                                                <th :data-b-field="value2" 
                                                    @mouseover="$parent.tableHoverOverHandler($event)"
                                                    @mouseout="$parent.tableHoverOutHandler($event)"
                                                    @click="$parent.tableClickHandler($event)"
                                                >{{ value2 }}</th>
                                            </template>
                                        </tr>
                                    </template>
                                    <tr>
                                        <th colspan="3">
                                            <div class="field-cluster-pct">
                                                <template v-for="(value, key) in $parent.datasetsObj[$parent.activeDataset]['metadata_labels'][$parent.activeField]">
                                                    <div 
                                                        :data-a-field="value" 
                                                        @mouseover="$parent.tableHoverOverHandler($event)"
                                                        @mouseout="$parent.tableHoverOutHandler($event)"
                                                        @click="$parent.tableClickHandler($event)"
                                                        :style="`background:${$parent.datasetsObj[$parent.activeDataset]['metadata_colors'][$parent.activeField][value]['color']}; width:${$parent.datasetsObj[$parent.activeDataset]['metadata_counts'][$parent.activeField][value]['pct']}%`"
                                                    ></div>
                                                </template>
                                            </div>
                                        </th>
                                        <template v-if="$parent.compareSet">
                                            <template v-if="$parent.cellCountOption === 0">
                                                <template v-for="(value2, key2) in $parent.datasetsObj[$parent.activeDataset]['metadata_colors'][$parent.compareField]">
                                                    <th :data-b-field="key2"
                                                        @mouseover="$parent.tableHoverOverHandler($event)"
                                                        @mouseout="$parent.tableHoverOutHandler($event)"
                                                        @click="$parent.tableClickHandler($event)"
                                                    ><div class="field-cluster-swatch" :style="`background:${value2['color']}`"></div></th>
                                                </template>
                                            </template>
                                            <template v-else>
                                                <th class="field-cluster-pct-cell" :colspan="Object.keys($parent.datasetsObj[$parent.activeDataset]['metadata_labels'][$parent.compareField]).length">
                                                    <div class="field-cluster-pct" :style="`width:100%; height:10px`">
                                                        <template v-for="(value2, key2) in $parent.datasetsObj[$parent.activeDataset]['metadata_labels'][$parent.compareField]">
                                                            <div 
                                                                :data-b-field="value2" 
                                                                @mouseover="$parent.tableHoverOverHandler($event)"
                                                                @mouseout="$parent.tableHoverOutHandler($event)"
                                                                @click="$parent.tableClickHandler($event)"
                                                                :style="`background:${$parent.datasetsObj[$parent.activeDataset]['metadata_colors'][$parent.compareField][value2]['color']}; width:${$parent.datasetsObj[$parent.activeDataset]['metadata_counts'][$parent.compareField][value2]['pct']}%`"
                                                            >
                                                            </div>
                                                        </template>
                                                    </div>
                                                </th>
                                            </template>
                                        </template>
                                    </tr>
                                    
                                        <tr>
                                            <th colspan="2">{{ $parent.labelFromAnnotation($parent.activeField) }}</th>
                                            <th class="border-right">
                                                <button style="white-space: nowrap; cursor:pointer"
                                                    @click="$parent.toggleCellCount()"
                                                >
                                                {{ $parent.cellCountOptions[$parent.cellCountOption] }}
                                                </button>
                                            </th>
                                            <template v-if="$parent.compareSet">
                                                <template v-for="(value2, key2) in $parent.datasetsObj[$parent.activeDataset]['metadata_labels'][$parent.compareField]">
                                                        <th class="field-cluster-count"
                                                            :data-b-field="value2" 
                                                            @mouseover="$parent.tableHoverOverHandler($event)"
                                                            @mouseout="$parent.tableHoverOutHandler($event)"
                                                            @click="$parent.tableClickHandler($event)"
                                                        >
                                                            {{$parent.datasetsObj[$parent.activeDataset]['metadata_counts'][$parent.compareField][value2][ $parent.cellCountOption===0 ? 'count' : 'pct'].toLocaleString()}}
                                                        </th>
                                                </template>
                                                <th></th>
                                            </template>
                                        </tr>
                                    
                                
                                </thead>
                                <tbody>
                                    <template v-for="(value, key) in $parent.datasetsObj[$parent.activeDataset]['metadata_labels'][$parent.activeField]">
                                        <tr :data-field="$parent.activeField" :data-field-label="value">
                                            <td :data-a-field="value"
                                                @mouseover="$parent.tableHoverOverHandler($event)"
                                                @mouseout="$parent.tableHoverOutHandler($event)"
                                                @click="$parent.tableClickHandler($event)"
                                            >
                                                <div class="field-cluster-swatch" :style="`background:${$parent.datasetsObj[$parent.activeDataset]['metadata_colors'][$parent.activeField][value]['color']}`">
                                                {{ $parent.datasetsObj[$parent.activeDataset]['metadata_colors'][$parent.activeField][value]['color'] }}
                                                </div>
                                            </td>
                                            <td class="field-cluster-label" 
                                                :data-a-field="value"
                                                @mouseover="$parent.tableHoverOverHandler($event)"
                                                @mouseout="$parent.tableHoverOutHandler($event)"
                                                @click="$parent.tableClickHandler($event)"
                                            >
                                                {{ value }}
                                            </td>
                                            <td class="field-cluster-count" 
                                                :data-a-field="value"
                                                @mouseover="$parent.tableHoverOverHandler($event)"
                                                @mouseout="$parent.tableHoverOutHandler($event)"
                                                @click="$parent.tableClickHandler($event)"
                                            >
                                                {{ $parent.datasetsObj[$parent.activeDataset]['metadata_counts'][$parent.activeField][value][ $parent.cellCountOption===0 ? "count" : "pct"].toLocaleString() }}
                                            </td>
                                            <template v-if="$parent.compareSet">
                                                <template v-for="(value2, key2) in $parent.datasetsObj[$parent.activeDataset]['metadata_labels'][$parent.compareField]">
                                                    <td class="field-cluster-count"
                                                        :data-a-field="value" :data-b-field="value2" 
                                                        @mouseover="$parent.tableHoverOverHandler($event)"
                                                        @mouseout="$parent.tableHoverOutHandler($event)"
                                                        @click="$parent.tableClickHandler($event)"
                                                    >
                                                        {{ $parent.compareSet[value][value2] ? $parent.compareSet[value][value2][ $parent.cellCountOption===0 ? "count" : "pct"].toLocaleString() : ''}}
                                                        <div class="field-cluster-bg" :style="`background:${$parent.datasetsObj[$parent.activeDataset]['metadata_colors'][$parent.compareField][value2]['color']};
                                                                                            opacity:${$parent.compareSet[value][value2] ? $parent.compareSet[value][value2]['pct']/100 : '0'};
                                                                                            width:${$parent.cellCountOption===1 ? $parent.compareSet[value][value2] ? $parent.compareSet[value][value2]['pct'] : '0' : '100' }%;`"></div>
                                                    </td>
                                                </template>
                                                
                                                <td class="field-cluster-pct-cell">
                                                    <div class="field-cluster-pct-wrap" style="width:100px">
                                                        <div class="field-cluster-pct" :style="`width:${ $parent.cellCountOption===1 ? $parent.datasetsObj[$parent.activeDataset]['metadata_counts'][$parent.activeField][value]['pct'] : '100'}%`">
                                                            <template v-for="(value2, key2) in $parent.datasetsObj[$parent.activeDataset]['metadata_labels'][$parent.compareField]">
                                                                <div 
                                                                    :data-a-field="value" :data-b-field="value2" 
                                                                    @mouseover="$parent.tableHoverOverHandler($event)"
                                                                    @mouseout="$parent.tableHoverOutHandler($event)"
                                                                    @click="$parent.tableClickHandler($event)"
                                                                    :style="`background:${$parent.datasetsObj[$parent.activeDataset]['metadata_colors'][$parent.compareField][value2]['color']}; width:${$parent.compareSet[value][value2] ? $parent.compareSet[value][value2]['pct'] : '0'}%`"
                                                                >
                                                                </div>
                                                            </template>
                                                        </div>
                                                    </div>
                                                </td>
                                                
                                            </template>
                                        </tr>
                                    </template>
                                </tbody>
                            </table>

                            <template v-if="$parent.activeField && !$parent.compareField">  
                                <div class="col1" style="gap: 30px;align-self:center; width:100%">
                                    <div class="hidden">x</div>
                                    <div class="col1 grow">
                                        <div class="label" style="font-weight: bold;">Compare Condition</div>
                                        <select class="comapre-field-selector" @change="$parent.selectCompareField($event)">
                                            <option value="" selected disabled hidden>None</option>
                                            <option 
                                                v-for="(value, key) in $parent.datasetsObj[$parent.activeDataset]['metadata']" 
                                                :key="key"
                                                :value="key"
                                                :disabled="key === $parent.activeField ? 'disabled' : false"
                                            >
                                                {{ key }}
                                            </option>
                                        </select>
                                        <div class="note">
                                            Select a condition to see its cell abundance and distribution compared by cell type.
                                        </div>
                                    </div>
                                    
                                    <template v-if="!$parent.datasetsObj[$parent.activeDataset]['genes']">
                                        <div class="col1 grow">
                                            <div class="label bold">Gene Search</div>
                                            <input class="gene-search-input" type="text" placeholder="Gene Name(s)"
                                                @keyup.enter="$parent.searchGene($event)"
                                            />
                                            <div class="note">
                                                See gene expression and differential gene expression by cell type, and condition if selected.
                                            </div>
                                        </div>
                                    </template>
                                    
                                </div>
                            </template>
                        </div>

                        <template v-if="$parent.activeField && !$parent.datasetsObj[$parent.activeDataset]['genes'] && !!$parent.compareField">
                            <div class="col1 grow" style="margin:20px 0 0;">
                                <div class="label" style="font-weight: bold;">Gene Search</div>
                                <input class="gene-search-input" type="text" placeholder="Gene Name(s)"
                                    @keyup.enter="$parent.searchGene($event)"
                                />
                                
                                <template v-if="$parent.datasetsObj[$parent.activeDataset]['genes']">
                                    <div class="gene-list">
                                        <template v-for="(value, gene) in $parent.datasetsObj[$parent.activeDataset]['genes']">
                                            <div class="gene-list-item" 
                                                :data-gene="gene"
                                                @click="$parent.removeGene($event)"
                                            >
                                            {{ gene }}
                                            </div>
                                        </template>
                                    </div>
                                </template>
                                
                                <div class="note">
                                    See gene expression and differential gene expression by cell type, and condition if selected.
                                </div>
                            </div>
                        </template>

                        <!-- GENE EXPRESSION MEAN/% -->
                        <template v-if="$parent.datasetsObj[$parent.activeDataset]['genes']">
                            <div class="row1 label-wrapper">
                                <div class="label underline">Gene Expression by Cell Type</div>
                                <!-- legends -->
                                <div class="row1 legends">
                                    <div class="col1 legend">
                                        <div class="label">Gene Expression</div>
                                        <div class="gradient" :style="`background: linear-gradient(to left, ${$parent.colorScalePlasmaColorsArray});`"></div>
                                        <div class="row1 marks"><div>0.0</div><div>3.0</div></div>
                                    </div>
                                    <div class="col1 legend">
                                        <div class="label">Expressed in Cells (%)</div>
                                        <div class="row1 circles">
                                            <div class="circle" style="height:20%"></div>
                                            <div class="circle" style="height:40%"></div>
                                            <div class="circle" style="height:60%"></div>
                                            <div class="circle" style="height:80%"></div>
                                            <div class="circle" style="height:100%"></div>
                                        </div>
                                        <div class="row1 marks"><div>0</div><div>100</div></div>
                                    </div>
                                </div>
                            </div>
                            <div class="expression-tables-wrapper overflow-h">
                                <table class="data-table">
                                    <thead>
                                        <tr class="field_labels">
                                            <th colspan="3"></th>
                                            <th :colspan="Object.keys($parent.datasetsObj[$parent.activeDataset]['genes']).length" class="border-bottom">mean expression</th>
                                        </tr>
                                        <tr class="field_labels">
                                            <th colspan="2">{{ $parent.labelFromAnnotation($parent.activeField) }}</th>
                                            <th><div class="gene-label no-events">Cell Count</div></th>
                                            <!-- dot plot labels -->
                                            <template v-for="(value2, gene) in $parent.datasetsObj[$parent.activeDataset]['genes']">
                                                <th v-if="value2['processed']"
                                                    :data-b-field="gene" :data-b-gene="gene"
                                                    @mouseover="$parent.tableHoverOverHandler($event)"
                                                    @mouseout="$parent.tableHoverOutHandler($event)"
                                                    @click="$parent.tableClickHandler($event)"
                                                    
                                                >
                                                    <div class="no-events">{{ gene }}</div>
                                                </th>
                                            </template>
                                            <template v-for="(value2, gene) in $parent.datasetsObj[$parent.activeDataset]['genes']">
                                                <th v-if="value2['processed']"
                                                    :data-b-field="gene" :data-b-gene="gene"
                                                    @mouseover="$parent.tableHoverOverHandler($event)"
                                                    @mouseout="$parent.tableHoverOutHandler($event)"
                                                    @click="$parent.tableClickHandler($event)"
                                                    
                                                >
                                                    <div class="gene-label">{{ gene }}</div>
                                                </th>
                                            </template>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <template v-for="(value, key) in $parent.datasetsObj[$parent.activeDataset]['metadata_labels'][$parent.activeField]">
                                            <tr :data-field="$parent.activeField" :data-field-label="value">
                                                <td :data-a-field="value"
                                                    @mouseover="$parent.tableHoverOverHandler($event)"
                                                    @mouseout="$parent.tableHoverOutHandler($event)"
                                                    @click="$parent.tableClickHandler($event)"
                                                >
                                                    <div class="field-cluster-swatch" :style="`background:${$parent.datasetsObj[$parent.activeDataset]['metadata_colors'][$parent.activeField][value]['color']}`"></div>
                                                </td>
                                                <td class="field-cluster-label" 
                                                    :data-a-field="value"
                                                    @mouseover="$parent.tableHoverOverHandler($event)"
                                                    @mouseout="$parent.tableHoverOutHandler($event)"
                                                    @click="$parent.tableClickHandler($event)"
                                                >
                                                    {{ value }}
                                                </td>
                                                <td class="field-cluster-count" 
                                                    :data-a-field="value"
                                                    @mouseover="$parent.tableHoverOverHandler($event)"
                                                    @mouseout="$parent.tableHoverOutHandler($event)"
                                                    @click="$parent.tableClickHandler($event)"
                                                >
                                                    {{ $parent.datasetsObj[$parent.activeDataset]['metadata_counts'][$parent.activeField][value][ $parent.cellCountOption===0 ? "count" : "pct"] }}
                                                </td>
                                                <template v-if="$parent.datasetsObj[$parent.activeDataset]['genes']">
                                                    <template v-for="(value2, gene) in $parent.datasetsObj[$parent.activeDataset]['genes']">
                                                        <td v-if="value2['processed']"
                                                            class="field-cluster-count cluster-expressionNO"
                                                            :data-a-field="value" :data-b-field="gene" :data-b-gene="gene"
                                                            @mouseover="$parent.tableHoverOverHandler($event)"
                                                            @mouseout="$parent.tableHoverOutHandler($event)"
                                                            @click="$parent.tableClickHandler($event)"
                                                            
                                                        >
                                                            {{ value2['processed'][value]['mean'].toFixed(4) }}
                                                        </td>
                                                    </template>
                                                </template>
                                                <template v-if="$parent.datasetsObj[$parent.activeDataset]['genes']">
                                                    <template v-for="(value2, gene) in $parent.datasetsObj[$parent.activeDataset]['genes']">
                                                        <td v-if="value2['processed']"
                                                            class="field-cluster-count cluster-expression" 
                                                            :data-a-field="value" :data-b-field="gene" :data-b-gene="gene"
                                                            @mouseover="$parent.tableHoverOverHandler($event)"
                                                            @mouseout="$parent.tableHoverOutHandler($event)"
                                                            @click="$parent.tableClickHandler($event)"
                                                            
                                                        >
                                                            <!-- dot plot -->
                                                            <div class="field-cluster-expression-bg" :style="`background:${value2['processed'][value]['color']};`">
                                                                <div class="field-cluster-expression" :style="`background:#000; transform:scale(${value2['processed'][value]['pct']});`"></div>
                                                            </div>
                                                        </td>
                                                    </template>
                                                </template>
                                            </tr>
                                        </template>
                                    </tbody>
                                </table>
                            </div>
                        </template>

                        <!-- GENE EXPRESSION MEAN/% COMPARE WITH CONDITION -->
                        <template v-if="$parent.activeGene && $parent.compareSet && $parent.datasetsObj[$parent.activeDataset]['genes']">
                            <div class="row1 label-wrapper">
                                <div class="label underline" style="padding:0">
                                    <!--{{$parent.activeGene}}-->
                                    <select class="active-field-selector" 
                                            style="width:auto; border:0"
                                            @change="$parent.setActiveGene($event)"
                                    >
                                        <template v-for="(value, gene) in $parent.datasetsObj[$parent.activeDataset]['genes']">
                                            <option 
                                                :value="gene" 
                                                :selected="gene === $parent.activeGene ? 'selected' : false"
                                            >
                                            {{ gene }}
                                            </option>
                                        </template>
                                    </select>
                                    Expression by Cell Type & {{$parent.labelFromAnnotation($parent.compareField)}} Condition
                                </div>
                                <!-- legends -->
                                <div class="row1 legends">
                                    <div class="col1 legend">
                                        <div class="label">Gene Expression</div>
                                        <div class="gradient" :style="`background: linear-gradient(to left, ${$parent.colorScalePlasmaColorsArray});`"></div>
                                        <div class="row1 marks"><div>0.0</div><div>3.0</div></div>
                                    </div>
                                    <div class="col1 legend">
                                        <div class="label">Expressed in Cells (%)</div>
                                        <div class="row1 circles">
                                            <div class="circle" style="height:20%"></div>
                                            <div class="circle" style="height:40%"></div>
                                            <div class="circle" style="height:60%"></div>
                                            <div class="circle" style="height:80%"></div>
                                            <div class="circle" style="height:100%"></div>
                                        </div>
                                        <div class="row1 marks"><div>0</div><div>100</div></div>
                                    </div>
                                </div>
                            </div>
                            <div class="expression-tables-wrapper overflow-h">
                                <table class="data-table">
                                    <thead>
                                        <template v-if="$parent.compareSet">
                                            <tr>
                                                <th colspan="2"></th>
                                                <th class="border-bottom" 
                                                    :colspan="Object.keys($parent.datasetsObj[$parent.activeDataset]['metadata_labels'][$parent.compareField]).length + 1"
                                                >
                                                    mean expression
                                                </th>
                                            </tr>
                                            <tr>
                                                <th colspan="3"></th>
                                                <th class="border-bottom" 
                                                    :colspan="Object.keys($parent.datasetsObj[$parent.activeDataset]['metadata_labels'][$parent.compareField]).length"
                                                >
                                                    {{$parent.labelFromAnnotation($parent.compareField)}}
                                                </th>
                                            </tr>
                                        </template>
                                        <tr class="field_labels">
                                            <th colspan="2">{{ $parent.labelFromAnnotation($parent.activeField) }}</th>
                                            <th :data-b-field="$parent.activeGene" :data-b-gene="$parent.activeGene"
                                                @mouseover="$parent.tableHoverOverHandler($event)"
                                                @mouseout="$parent.tableHoverOutHandler($event)"
                                                @click="$parent.tableClickHandler($event)"
                                            >
                                                <div class="no-events">{{ $parent.activeGene }}</div>
                                                
                                            </th>
                                            <template v-for="(value2, key2) in $parent.datasetsObj[$parent.activeDataset]['metadata_labels'][$parent.compareField]">
                                                <th :data-b-field="value2" 
                                                    @mouseover="$parent.tableHoverOverHandler($event)"
                                                    @mouseout="$parent.tableHoverOutHandler($event)"
                                                    @click="$parent.tableClickHandler($event)"
                                                >
                                                    <div class="no-events">{{ value2 }}</div>
                                                </th>
                                            </template>
                                            <!-- dot plot labels -->
                                            <th :data-b-field="$parent.activeGene" :data-b-gene="$parent.activeGene"
                                                @mouseover="$parent.tableHoverOverHandler($event)"
                                                @mouseout="$parent.tableHoverOutHandler($event)"
                                                @click="$parent.tableClickHandler($event)"
                                                
                                            >
                                                <div class="gene-label">{{ $parent.activeGene }}</div>
                                            </th>
                                            <template v-if="$parent.compareGeneSet">
                                                <template v-for="(value2, key2) in $parent.datasetsObj[$parent.activeDataset]['metadata_labels'][$parent.compareField]">
                                                    <th :data-b-field="value2" 
                                                        @mouseover="$parent.tableHoverOverHandler($event)"
                                                        @mouseout="$parent.tableHoverOutHandler($event)"
                                                        @click="$parent.tableClickHandler($event)"
                                                    >
                                                        <div class="gene-label">{{value2}}</div>
                                                    </th>
                                                </template>
                                            </template>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <template v-for="(value, key) in $parent.datasetsObj[$parent.activeDataset]['metadata_labels'][$parent.activeField]">
                                            <tr :data-field="$parent.activeField" :data-field-label="value">
                                                <td :data-a-field="value"
                                                    @mouseover="$parent.tableHoverOverHandler($event)"
                                                    @mouseout="$parent.tableHoverOutHandler($event)"
                                                    @click="$parent.tableClickHandler($event)"
                                                >
                                                    <div class="field-cluster-swatch" :style="`background:${$parent.datasetsObj[$parent.activeDataset]['metadata_colors'][$parent.activeField][value]['color']}`"></div>
                                                </td>
                                                <td class="field-cluster-label" 
                                                    :data-a-field="value"
                                                    @mouseover="$parent.tableHoverOverHandler($event)"
                                                    @mouseout="$parent.tableHoverOutHandler($event)"
                                                    @click="$parent.tableClickHandler($event)"
                                                >
                                                    {{ value }}
                                                </td>
                                                <!--
                                                <td class="field-cluster-count" 
                                                    :data-a-field="value"
                                                    @mouseover="$parent.tableHoverOverHandler($event)"
                                                    @mouseout="$parent.tableHoverOutHandler($event)"
                                                    @click="$parent.tableClickHandler($event)"
                                                >
                                                    {{ $parent.datasetsObj[$parent.activeDataset]['metadata_counts'][$parent.activeField][value][ $parent.cellCountOption===0 ? "count" : "pct"] }}
                                                </td>
                                                -->
                                                <template v-if="$parent.datasetsObj[$parent.activeDataset]['genes']">
                                                    
                                                    <template v-for="(value2, key2) in $parent.datasetsObj[$parent.activeDataset]['genes'][$parent.activeGene]">
                                                        
                                                        <td v-if="key2 === 'processed'"
                                                            class="field-cluster-count cluster-expressionNO"
                                                            :data-a-field="value" :data-b-field="$parent.activeGene" :data-b-gene="$parent.activeGene"
                                                            @mouseover="$parent.tableHoverOverHandler($event)"
                                                            @mouseout="$parent.tableHoverOutHandler($event)"
                                                            @click="$parent.tableClickHandler($event)"
                                                            
                                                        >
                                                            {{ value2[value]['mean'].toFixed(4) }}
                                                        </td>
                                                    </template>
                                                    <template v-if="$parent.compareGeneSet">
                                                        <template v-for="(value2, key2) in $parent.datasetsObj[$parent.activeDataset]['metadata_labels'][$parent.compareField]">
                                                            <td class="field-cluster-count cluster-expressionNO"
                                                                :data-a-field="value" :data-b-field="value2" :data-b-gene="$parent.activeGene"
                                                                @mouseover="$parent.tableHoverOverHandler($event)"
                                                                @mouseout="$parent.tableHoverOutHandler($event)"
                                                                @click="$parent.tableClickHandler($event)"
                                                            >
                                                                <template v-if="$parent.compareGeneSet[value][value2]">
                                                                    {{ $parent.compareGeneSet[value][value2]['mean'].toFixed(4) }}
                                                                </template>
                                                            </td>
                                                        </template>
                                                    </template>
                                                </template>
                                                <template v-if="$parent.datasetsObj[$parent.activeDataset]['genes']">
                                                    <template v-for="(value2, key2) in $parent.datasetsObj[$parent.activeDataset]['genes'][$parent.activeGene]">
                                                        <td v-if="key2 === 'processed'"
                                                            class="field-cluster-count cluster-expression" 
                                                            :data-a-field="value" :data-b-field="$parent.activeGene" :data-b-gene="$parent.activeGene"
                                                            @mouseover="$parent.tableHoverOverHandler($event)"
                                                            @mouseout="$parent.tableHoverOutHandler($event)"
                                                            @click="$parent.tableClickHandler($event)"
                                                            
                                                        >
                                                            <!-- dot plot -->
                                                            <div class="field-cluster-expression-bg" :style="`background:${value2[value]['color']};`">
                                                                <div class="field-cluster-expression" :style="`background:#000; transform:scale(${value2[value]['pct']});`"></div>
                                                            </div>
                                                        </td>
                                                    </template>
                                                    <template v-if="$parent.compareGeneSet">
                                                        <template v-for="(value2, key2) in $parent.datasetsObj[$parent.activeDataset]['metadata_labels'][$parent.compareField]">
                                                            <td class="field-cluster-count cluster-expression"
                                                                :data-a-field="value" :data-b-field="value2" :data-b-gene="$parent.activeGene"
                                                                @mouseover="$parent.tableHoverOverHandler($event)"
                                                                @mouseout="$parent.tableHoverOutHandler($event)"
                                                                @click="$parent.tableClickHandler($event)"
                                                            >
                                                                <template v-if="$parent.compareGeneSet[value][value2]">
                                                                    <!-- dot plot -->
                                                                    <div class="field-cluster-expression-bg" :style="`background:${$parent.compareGeneSet[value][value2] ? $parent.compareGeneSet[value][value2]['color'] : 'transparent'};`">
                                                                        <div class="field-cluster-expression" :style="`background:${$parent.compareGeneSet[value][value2] ? '#000' : '#000'}; transform:scale(${$parent.compareGeneSet[value][value2] ? $parent.compareGeneSet[value][value2]['pct'] : '0'});`"></div>
                                                                    </div>
                                                                </template>
                                                            </td>
                                                        </template>
                                                    </template>
                                                </template>
                                            </tr>
                                        </template>
                                    </tbody>
                                </table>
                            </div>
                        </template>

                        <!-- DIFFERENTIAL GENE EXPRESSION -->
                        <template v-if="$parent.compareDiffGeneSet && $parent.datasetsObj[$parent.activeDataset]['genes']">
                            <!-- label -->
                            <div class="row1 label-wrapper">
                                <div class="label underline" style="padding:0px">
                                    <select class="active-field-selector" 
                                            style="width:auto; border:0"
                                            @change="$parent.setActiveGene($event)"
                                    >
                                        <template v-for="(value, gene) in $parent.datasetsObj[$parent.activeDataset]['genes']">
                                            <option 
                                                :value="gene" 
                                                :selected="gene === $parent.activeGene ? 'selected' : false"
                                            >
                                            {{ gene }}
                                            </option>
                                        </template>
                                    </select>
                                    Differential Expression by Cell Type &
                                    <select class="active-field-selector" 
                                            style="width:auto; border:0"
                                            @change="$parent.setDiffCondition($event)"
                                    >
                                        <template v-for="key2 in $parent.getUniqueKeysAtDepth($parent.compareGeneSet, 2)">
                                            <option 
                                                :value="key2" 
                                                :selected="key2 === $parent.diffCondition ? 'selected' : false"
                                            >
                                            {{ key2 }}
                                            </option>
                                        </template>
                                    </select>
                                    {{$parent.labelFromAnnotation($parent.compareField)}}
                                </div>
                                <!-- legends -->
                                <div class="row1 legends">
                                    <div class="col1 legend">
                                        <div class="label">Effect Size</div>
                                        <div class="gradient" :style="`background: linear-gradient(to right, ${$parent.colorScaleRedBlue(-1)},${$parent.colorScaleRedBlue(0)}, ${$parent.colorScaleRedBlue(1)});`"></div>
                                        <div class="row1 marks"><div>-1.0</div><div>0.0</div><div>1.0</div></div>
                                    </div>
                                    <div class="col1 legend">
                                        <div class="label">p-Value</div>
                                        <div class="row1 circles">
                                            <div class="circle" style="height:100%"></div>
                                            <div class="circle" style="height:80%"></div>
                                            <div class="circle" style="height:60%"></div>
                                            <div class="circle" style="height:40%"></div>
                                            <div class="circle" style="height:20%"></div>
                                        </div>
                                        <div class="row1 marks"><div>{{`<=0.001`}}</div><div>{{`<=1`}}</div></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="expression-tables-wrapper overflow-h">
                                <div class="diff-gene-exp">
                                    <table class="data-table">
                                        <thead>
                                            <template v-if="$parent.compareDiffGeneSet">
                                                <tr>
                                                    <th colspan="2"></th>
                                                    <th class="border-bottom">
                                                        mean exp.
                                                    </th>
                                                    <th class="border-bottom" 
                                                        :colspan="$parent.getUniqueKeysAtDepth($parent.compareDiffGeneSet, 2).length"
                                                    >
                                                        p-value
                                                    </th>
                                                </tr>
                                                <tr>
                                                    <th colspan="2"></th>
                                                    <th class="border-bottom" 
                                                        :colspan="$parent.getUniqueKeysAtDepth($parent.compareDiffGeneSet, 2).length + 1"
                                                    >
                                                        {{ $parent.labelFromAnnotation($parent.compareField) }}
                                                    </th>
                                                </tr>
                                            </template>
                                            <tr class="field_labels">
                                                <th colspan="2">{{ $parent.labelFromAnnotation($parent.activeField) }}</th>
                                                <template v-if="$parent.diffCondition">
                                                    <th :data-b-field="$parent.diffCondition" 
                                                        @mouseover="$parent.tableHoverOverHandler($event)"
                                                        @mouseout="$parent.tableHoverOutHandler($event)"
                                                        @click="$parent.tableClickHandler($event)"
                                                    >
                                                        <div class="no-events">{{ $parent.diffCondition }}</div>
                                                    </th>
                                                </template>
                                                <template v-if="$parent.datasetsObj[$parent.activeDataset]['genes']">
                                                    <template v-for="key2 in $parent.getUniqueKeysAtDepth($parent.compareDiffGeneSet, 2)">
                                                        <th :data-b-field="key2" data-b-diff="true"
                                                            @mouseover="$parent.tableHoverOverHandler($event)"
                                                            @mouseout="$parent.tableHoverOutHandler($event)"
                                                            @click="$parent.tableClickHandler($event)"
                                                        >
                                                            <div class="no-events">{{key2}}</div>
                                                        </th>
                                                    </template>
                                                </template>

                                                <template v-if="$parent.diffCondition">
                                                    <th :data-b-field="$parent.diffCondition" 
                                                        @mouseover="$parent.tableHoverOverHandler($event)"
                                                        @mouseout="$parent.tableHoverOutHandler($event)"
                                                        @click="$parent.tableClickHandler($event)"
                                                    >
                                                        <div class="gene-label">{{ $parent.diffCondition }}</div>
                                                    </th>
                                                </template>
                                                <template v-if="$parent.datasetsObj[$parent.activeDataset]['genes']">
                                                    <template v-for="key2 in $parent.getUniqueKeysAtDepth($parent.compareDiffGeneSet, 2)">
                                                        <th :data-b-field="key2" data-b-diff="true"
                                                            @mouseover="$parent.tableHoverOverHandler($event)"
                                                            @mouseout="$parent.tableHoverOutHandler($event)"
                                                            @click="$parent.tableClickHandler($event)"
                                                        >
                                                            <div class="gene-label">{{key2}}</div>
                                                        </th>
                                                    </template>
                                                </template>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <template v-for="(value, key) in $parent.datasetsObj[$parent.activeDataset]['metadata_labels'][$parent.activeField]">
                                                <tr :data-field="$parent.activeField" :data-field-label="value">
                                                    
                                                    <td :data-a-field="value"
                                                        @mouseover="$parent.tableHoverOverHandler($event)"
                                                        @mouseout="$parent.tableHoverOutHandler($event)"
                                                        @click="$parent.tableClickHandler($event)"
                                                    >
                                                        
                                                            <div class="field-cluster-swatch" :style="`background:${$parent.datasetsObj[$parent.activeDataset]['metadata_colors'][$parent.activeField][value]['color']}`"></div>
                                                        
                                                    </td>
                                                    <td class="field-cluster-label" 
                                                        :data-a-field="value"
                                                        @mouseover="$parent.tableHoverOverHandler($event)"
                                                        @mouseout="$parent.tableHoverOutHandler($event)"
                                                        @click="$parent.tableClickHandler($event)"
                                                    >
                                                        {{ value }}
                                                    </td>
                                                    <template v-if="$parent.compareGeneSet">
                                                        <template v-for="(value2, key2) in $parent.datasetsObj[$parent.activeDataset]['metadata_labels'][$parent.compareField]">
                                                            <template v-if="value2 === $parent.diffCondition">
                                                                <td class="field-cluster-count cluster-expressionNO"
                                                                    :data-a-field="value" :data-b-field="value2" :data-b-gene="$parent.activeGene"
                                                                    @mouseover="$parent.tableHoverOverHandler($event)"
                                                                    @mouseout="$parent.tableHoverOutHandler($event)"
                                                                    @click="$parent.tableClickHandler($event)"
                                                                >
                                                                    <template v-if="$parent.compareGeneSet[value][value2]">
                                                                        {{ $parent.compareGeneSet[value][value2]['mean'].toFixed(4) }}
                                                                    </template>
                                                                </td>
                                                            </template>
                                                        </template>
                                                    </template>
                                                    <template v-if="$parent.datasetsObj[$parent.activeDataset]['genes']">
                                                        <template v-if="Object.keys($parent.compareDiffGeneSet[value]).length > 0">
                                                            <template v-for="(value2, key2) in $parent.compareDiffGeneSet[value]">
                                                                <td class="field-cluster-count"
                                                                    :data-a-field="value" :data-b-field="key2" data-b-diff="true"
                                                                    @mouseover="$parent.tableHoverOverHandler($event)"
                                                                    @mouseout="$parent.tableHoverOutHandler($event)"
                                                                    @click="$parent.tableClickHandler($event)"
                                                                >
                                                                    <template v-if="value2">
                                                                        {{ (value2["pValue"]).toFixed(4) }}<br>
                                                                        <!--{{ $parent.pValueFormatter(value2["pValue"]) }}-->
                                                                        <!--{{ (value2["effectSize"]).toFixed(4) }}-->
                                                                        <!--<div class="field-cluster-bg" :style="`background:${value2['rejected'] ? value2['effectSizeColor'] : value2['effectSizeColor']}`"></div>-->
                                                                    </template>
                                                                </td>
                                                            </template>
                                                        </template>
                                                        <template v-else>
                                                            <td></td>
                                                        </template>
                                                        
                                                        <template v-if="$parent.compareGeneSet">
                                                            <template v-for="(value2, key2) in $parent.datasetsObj[$parent.activeDataset]['metadata_labels'][$parent.compareField]">
                                                                <template v-if="value2 === $parent.diffCondition">
                                                                    <td class="field-cluster-count cluster-expression"
                                                                        :data-a-field="value" :data-b-field="value2" :data-b-gene="$parent.activeGene"
                                                                        @mouseover="$parent.tableHoverOverHandler($event)"
                                                                        @mouseout="$parent.tableHoverOutHandler($event)"
                                                                        @click="$parent.tableClickHandler($event)"
                                                                    >
                                                                        <template v-if="$parent.compareGeneSet[value][value2]">
                                                                            <!-- dot plot -->
                                                                            <div class="field-cluster-expression-bg" :style="`background:${$parent.compareGeneSet[value][value2] ? $parent.compareGeneSet[value][value2]['color'] : 'transparent'};`">
                                                                                <div class="field-cluster-expression" :style="`background:${$parent.compareGeneSet[value][value2] ? '#000' : '#000'}; transform:scale(${$parent.compareGeneSet[value][value2] ? $parent.compareGeneSet[value][value2]['pct'] : '0'});`"></div>
                                                                            </div>
                                                                        </template>
                                                                    </td>
                                                                </template>
                                                            </template>
                                                        </template>
                                                        <template v-for="(value2, key2) in $parent.compareDiffGeneSet[value]">
                                                            <td class="field-cluster-count cluster-expression"
                                                                :data-a-field="value" :data-b-field="key2" data-b-diff="true"
                                                                @mouseover="$parent.tableHoverOverHandler($event)"
                                                                @mouseout="$parent.tableHoverOutHandler($event)"
                                                                @click="$parent.tableClickHandler($event)"
                                                            >
                                                                <template v-if="value2">
                                                                    <!-- dot plot -->
                                                                    <div class="field-cluster-expression-bg" :style="`background:${value2['effectSizeColor']};`">
                                                                        <div class="field-cluster-expression" :style="`background: #000; transform:scale(${$parent.scaleElementByPvalue(value2['pValue'])});`"></div>
                                                                    </div>
                                                                </template>
                                                            </td>
                                                        </template>
                                                    </template>
                                                </tr>
                                            </template>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </template>

                    </template>
                </div>

                <div class="col1" style="width:250px" v-if="$parent.activeField">
                    <!-- hover data -->
                    <template v-if="$parent.activeDataset">
                        <div class="info-wrapper">
                            <div :class="`col1 sidebar ${$parent.fixedSidebar ? 'fixed-sidebar' : ''}`">
                                <!--
                                <div class="label" style="position:relative">
                                    Dataset Info 
                                    <div :class="`loader ${!$parent.isLoading ? 'hidden' : ''}`">loading...</div>
                                </div>
                                -->
                                <template v-if="$parent.activeField">
                                    <div class="col1 info-block">
                                        <!--
                                        <div class="row1 info-field">
                                            <div class="info-field-label">Name</div><div class="info-field-data unknown">{{ Array.isArray($parent.activeDataset) ? $parent.activeDataset[0] : $parent.activeDataset }}</div>
                                        </div>
                                        <div class="row1 info-field">
                                            <div class="info-field-label">Species</div><div class="info-field-data">
                                                <template v-for="item in $parent.datasetsObj[$parent.activeDataset]['info']['species']">
                                                    <div>{{item}}</div>
                                                </template>
                                            </div>
                                        </div>
                                        <div class="row1 info-field">
                                            <div class="info-field-label">Depot</div><div class="info-field-data">
                                                <template v-for="item in $parent.datasetsObj[$parent.activeDataset]['info']['depot']">
                                                    <div>{{item}}</div>
                                                </template>
                                            </div>
                                        </div>
                                        -->
                                        <div class="row1 info-field">
                                            <div class="info-field-label">Total Cells</div><div class="info-field-data num">{{$parent.datasetsObj[$parent.activeDataset]["cells"].length.toLocaleString()}}</div>
                                        </div>
                                    </div>
                                </template>

                                <template v-if="$parent.activeField">
                                    <div class="umap-wrapper" style="position:relative;width:250px;height:250px;">
                                        <div :class="`select-lock ${!$parent.lockedHover ? 'hidden' : ''}`"
                                            @click="$parent.unlockHover($event)"
                                        >
                                            <svg height="800" width="800" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 330 330" xml:space="preserve"><path d="M65 330h200c8.284 0 15-6.716 15-15V145c0-8.284-6.716-15-15-15h-15V85c0-46.869-38.131-85-85-85S80 38.131 80 85v45H65c-8.284 0-15 6.716-15 15v170c0 8.284 6.716 15 15 15zm115-95.014V255c0 8.284-6.716 15-15 15s-15-6.716-15-15v-20.014c-6.068-4.565-10-11.824-10-19.986 0-13.785 11.215-25 25-25s25 11.215 25 25c0 8.162-3.932 15.421-10 19.986zM110 85c0-30.327 24.673-55 55-55s55 24.673 55 55v45H110V85z"/></svg>
                                        </div>
                                        <canvas class="umap" style="border: solid 0.5px #ccc;width:250px;height:250px;position:absolute;"></canvas>
                                        <template v-if="$parent.datasetsObj[$parent.activeDataset]['genes']">
                                            <template v-for="(value2, gene) in $parent.datasetsObj[$parent.activeDataset]['genes']">
                                                <canvas :class="`umap`" :data-b-field="gene" :data-b-gene="gene" width="500" height="500" style="width:250px;height:250px;position:absolute;"></canvas>
                                            </template>
                                        </template>
                                        <template v-if="$parent.compareField">
                                            <template v-for="(value, key) in $parent.datasetsObj[$parent.activeDataset]['metadata_labels'][$parent.compareField]">
                                                <canvas :class="`umap`" :data-b-field="value" width="500" height="500" style="width:250px;height:250px;position:absolute;"></canvas>
                                            </template>
                                        </template>
                                        <template v-for="(value, key) in $parent.datasetsObj[$parent.activeDataset]['metadata_labels'][$parent.activeField]">
                                            <canvas :class="`umap`" :data-a-field="value" width="500" height="500" style="width:250px;height:250px;position:absolute"></canvas>
                                        </template>
                                    </div>
                                </template>
                                
                                <template v-if="$parent.hoverInfo">
                                    <template v-if="Object.keys($parent.hoverInfo['cluster']).length > 0">
                                        <div class="info-header">
                                            {{$parent.hoverInfo["cluster"]["name"]}}
                                            <div class="field-cluster-bg" :style="`background:${$parent.hoverInfo['cluster']['color']}; width:${$parent.hoverInfo['cluster']['cellPct']}%`"></div>
                                        </div>
                                        <div class="info-block">
                                            <div class="row1 info-field">
                                                <div class="info-field-label">Cell Count</div><div class="info-field-data num">{{$parent.hoverInfo["cluster"]["cellCount"].toLocaleString()}}</div>
                                            </div>
                                            <div class="row1 info-field">
                                                <div class="info-field-label">Cell %</div><div class="info-field-data num">{{$parent.hoverInfo["cluster"]["cellPct"]}}</div>
                                            </div>
                                        </div>
                                        <template v-if="$parent.hoverInfo['cluster']['text']">
                                            <div class="info-text" v-html="$parent.hoverInfo['cluster']['text']"></div>
                                        </template>
                                    </template>
                                    <template v-if="Object.keys($parent.hoverInfo['condition']).length > 0">
                                        <div class="info-header">
                                            {{$parent.hoverInfo["condition"]["name"]}}
                                            <div class="field-cluster-bg" :style="`
                                                background:${$parent.hoverInfo['condition']['color']}; 
                                                width:${ $parent.hoverInfo['cluster']['cellCount'] ? (($parent.hoverInfo['condition']['cellPct']/100)*($parent.hoverInfo['cluster']['cellPct']/100)) * 100 : $parent.hoverInfo['condition']['cellPct']}%
                                            `"></div>
                                        </div>
                                        <div class="info-block">
                                            <div class="row1 info-field">
                                                <div class="info-field-label">Cell Count</div><div class="info-field-data num">{{$parent.hoverInfo["condition"]["cellCount"].toLocaleString()}}</div>
                                            </div>
                                            <div class="row1 info-field">
                                                <div class="info-field-label">Cell %</div><div class="info-field-data num">{{$parent.hoverInfo["condition"]["cellPct"]}}</div>
                                            </div>
                                        </div>
                                        <template v-if="$parent.hoverInfo['condition']['text']">
                                            <div class="info-text" v-html="$parent.hoverInfo['condition']['text']"></div>
                                        </template>
                                    </template>
                                    <template v-if="Object.keys($parent.hoverInfo['gene']).length > 0">
                                        <div class="info-header">{{$parent.hoverInfo["gene"]["name"]}}</div>
                                        <div class="info-block">
                                            <div class="row1 info-field">
                                                <div class="info-field-label">Cells Exp.</div><div class="info-field-data num">{{$parent.hoverInfo["gene"]["cellsExp"]}}</div>
                                            </div>
                                            <div class="row1 info-field">
                                                <div class="info-field-label">Cells Exp. %</div><div class="info-field-data num">{{($parent.hoverInfo["gene"]["expPct"]*100).toFixed(2)}}</div>
                                            </div>
                                            <div class="row1 info-field">
                                                <div class="info-field-label">Mean Exp.</div><div class="info-field-data num">{{$parent.hoverInfo["gene"]["expMean"].toFixed(4)}}</div>
                                            </div>
                                        </div>
                                    </template>
                                    <template v-if="Object.keys($parent.hoverInfo['diff']).length > 0">
                                        <div class="info-header">{{$parent.hoverInfo["diff"]["name"]}}</div>
                                        <div class="info-block">
                                            <div class="row1 info-field">
                                                <div class="info-field-label">p-Value</div><div class="info-field-data num">{{$parent.hoverInfo["diff"]["pValue"].toFixed(8)}}</div>
                                            </div>
                                            <div class="row1 info-field">
                                                <div class="info-field-label">Effect Size</div><div class="info-field-data num">{{$parent.hoverInfo["diff"]["effectSize"].toFixed(8)}}</div>
                                            </div>
                                        </div>
                                    </template>
                                </template>
                                <template v-else>
                                    <template v-if="$parent.activeField">
                                        <div class="info-text">
                                            <!--The <span class="num bold">{{ Array.isArray($parent.activeDataset) ? $parent.activeDataset[0] : $parent.activeDataset }}</span>-->
                                            This dataset contains 
                                            <template v-for="(item, index) in $parent.datasetsObj[$parent.activeDataset]['info']['method']">
                                                <span class="bold">{{ item }}</span>{{($parent.datasetsObj[$parent.activeDataset]['info']['method'].length > 1) ? ((index === $parent.datasetsObj[$parent.activeDataset]['info']['method'].length-2) ? ', and ' : ((index < $parent.datasetsObj[$parent.activeDataset]['info']['method'].length-2) ? ', ' : '')) : ''}}
                                            </template>
                                            data of 
                                            <span class="num bold">{{ $parent.datasetsObj[$parent.activeDataset]["cells"].length.toLocaleString() }}</span> 
                                            cells from the 
                                            <template v-for="(item, index) in $parent.datasetsObj[$parent.activeDataset]['info']['depot']">
                                                <span class="bold">{{ item }}</span>{{($parent.datasetsObj[$parent.activeDataset]['info']['depot'].length > 1) ? ((index === $parent.datasetsObj[$parent.activeDataset]['info']['depot'].length-2) ? ', and ' : ((index < $parent.datasetsObj[$parent.activeDataset]['info']['depot'].length-2) ? ', ' : '')) : ''}}
                                            </template>
                                            depot{{$parent.datasetsObj[$parent.activeDataset]['info']['depot'].length > 1 ? 's' : ''}} of 
                                            <template v-for="item in $parent.datasetsObj[$parent.activeDataset]['info']['species']">
                                                <span class="bold">{{ item }}</span>{{($parent.datasetsObj[$parent.activeDataset]['info']['species'].length > 1) ? ((index === $parent.datasetsObj[$parent.activeDataset]['info']['species'].length-2) ? ', and ' : ((index < $parent.datasetsObj[$parent.activeDataset]['info']['species'].length-2) ? ', ' : '')) : ''}}
                                            </template> 
                                            subjects.
                                        </div>
                                    </template>
                                </template>
                            </div>
                        </div>
                    </template>
                </div>

            </div>
        </div>
        <!-- FOOTER -->
        <matkp-footer></matkp-footer>
    </div>
</matkp-wrapper>
</template>

<style scoped>
*{
    box-sizing: border-box;
}
select{
    cursor: pointer;
}
.col1{
    display: flex;
    flex-direction: column;
}
.row1{
    display:flex;
    flex-direction: row;
}
.grow{
    flex: 1;
}
.font-12{
    font-size: 12px;
}
::v-deep .num{
    font-family: monospace;
    text-align: right;
}
::v-deep .bold{
    font-weight: bold;
}
.loader{
    font-size: 14px;
    animation: blink 0.5s infinite;
    color:red;
}
@keyframes blink {
    0% { opacity: 0 }
    50% { opacity: 1 }
    100% { opacity: 0 }
}
.overflow-h {
    overflow-x: auto;
    /*box-shadow: inset -10px 0 5px -5px hsl(0deg 0% 0% / 4%);*/
}
.note {
    font-size: 13px;
    font-style: italic;
    padding: 10px 0;
    color: dimgray;
}
.label {
    font-size: 16px;
    margin-bottom: 5px;
}
.underline{
    border-bottom: 1px solid dimgray;
    width: fit-content;
    padding: 5px 0;
}
.label-wrapper {
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    margin: 20px 0 10px 0;
}
.legends {
    gap: 20px;
}
.legend {
    width: 125px;
    margin: 0 10px 0 0;
}
.legend .label {
    font-size: 12px;
}
.legend .gradient {
    height: 15px;
    width: -webkit-fill-available;
}
.legend .circles {
    height: 15px;
    width: -webkit-fill-available;
    justify-content: space-between;
    padding: 0 0;
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
.page-wrapper {
    align-items: center;
    gap: 20px;
    width: auto;
    padding-bottom: 200px;
    max-width: 1280px;
    margin: 0 auto;
    padding-top: 50px;
    font-size: 14px;
    line-height: normal;
}
.info-wrapper{
    position:relative;
    width: 250px;
    height: fit-content;
    font-size: 14px;
}
.sidebar{
    border-bottom: 1px solid dimgray;
    width:inherit;
}
.fixed-sidebar{
    position:fixed;
    top:20px;
}
.info-block {
    padding: 10px;
    gap: 5px;
}
.info-header {
    font-size: 14px;
    font-weight: bold;
    background: #ddd;
    padding: 5px;
    overflow: hidden;
    text-overflow: ellipsis;
    position:relative;
    mix-blend-mode: multiply;
}
.info-field-label {
    min-width: 100px;
    font-weight: bold;
}
.info-field-data {
    flex: 1;
    text-overflow: ellipsis;
    overflow: hidden;
}
.info-text{
    padding: 5px 10px 10px 10px;
    font-size: 12px;
}
.unknown{
    color:#808080;
}
.select-wrapper{
    gap: 20px;
}
.header-wrapper {
    gap: 10px;
    background: none;
    width: 100%;
    position: relative;
}
.explore-wrapper {
    gap: 20px;
    width: -webkit-fill-available;
}
.tables-wrapper{
    display: flex;
    flex-direction: column;
    gap: 20px;
    flex-grow: 1;
}

.anatomogram {
    display: flex;
    justify-content: center;
}
.anatomogram img {
    width: 130px;
}

.cell-count-tables-wrapper {
    display: flex;
    align-items: center;
    gap: 20px;
    flex-direction: row;
    justify-content: flex-start;
}
.expression-tables-wrapper{
    display:flex;
}
.dataset-selector {
    display: flex;
}

.data-table{

}
.data-table .active-table-item{
    background: #ddd;
}
.data-table .dim-table-item{
    opacity: 0.25;
}
.data-table .outline-table-item{
    outline: 1px solid black;
    z-index: 1;
}
.cell-count-options-select{
    width: 100%;
    text-align: center;
    border: 0;
    background: #ccc;
    padding: 3px 0;
}
.field-selectors {
    display: flex;
    gap: 10px;
}
.field-cluster{
    display:flex;
    flex-direction: row;
    align-items: center;
    gap: 20px;
    height: 20px;
}
.field-cluster-label {
    font-size: 16px;
}
.field-cluster-swatch{
    width: 100%;
    height: 100%;
    pointer-events: none;
    color:transparent;
    font-size: 0;
}
.field-cluster-count {
    font-family: monospace;
    text-align: right;
    font-size: 13px;
    padding-left: 20px !important;
    padding-right: 20px !important;
}
table{
    border-collapse: collapse;
    width: fit-content;
}
th{
    font-weight: normal;
    font-size: 14px;
    padding: 10px !important;
    text-align: center;
}
th, td{
    padding: 0;
    position: relative;
}
th:not(:first-child), 
td:not(:first-child) {
    padding: 0 20px;
}
th:has(.field-cluster-swatch), 
th:has(.field-cluster-pct) {
    height: 10px;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
}
.field-labels th:after {
    content: '';
    display: block;
    border-bottom: 1px solid #999;
}
td:has(.field-cluster-swatch) {
    min-width: 10px;
    width: 10px;
    height: 20px;
}
.border-bottom{
    border-bottom: 1px solid dimgrey;
}
.border-right,
td:nth-child(3) {
    border-right: 1px solid dimgrey;
}
td:has(.field-cluster-pct) {
    padding: 0 !important;
}
.field-cluster-pct-wrap {
    background:#ddd;
}
.field-cluster-pct {
    display: flex;
    width: 100%;
    height: 10px;
}
.field-cluster-pct-cell .field-cluster-pct{
    height:20px;
}
.field-cluster-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    pointer-events: none;
}
.field-cluster-expression-bg {
    width: 20px;
    height: 20px;
    pointer-events: none;
}
.field-cluster-expression {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: black !important;
    mix-blend-mode: soft-light;
    pointer-events: none;
    /*opacity: .5;*/
}
.cluster-expression{
    padding:0 !important;
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
th:has(.gene-label) {
    min-width: 20px;
    /*height: 70px;*/
}
.no-events{
    pointer-events: none;
}
.diff-gene-exp{
    position: relative;
}
.diff-gene-exp-legend{
    position: absolute;
    bottom: 0;
    left: calc(100% + 10px);
    width: 10px;
    height: calc(100% - 110px);
}
.legend-bg {
    width: 100%;
    height: 100%;
}

.umap-wrapper .umap.over{
    mix-blend-mode:difference;
    filter: grayscale();
}
.umap-wrapper.dim .umap:not(.highlight){
    opacity: 0.1;
    filter: grayscale();
    z-index: -1;
}
.dim-umap-item{
    opacity: 0.1;
    filter: grayscale();
    z-index: -1;
}

.select-lock {
    position: absolute;
    width: 20px;
    height: 20px;
    top: 0;
    right: 0;
    cursor: pointer;
    z-index: 10;
}
.select-lock svg {
    width: -webkit-fill-available;
    height: auto;
    object-fit: contain;
}
</style>