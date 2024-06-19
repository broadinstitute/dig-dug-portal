<template>
    <div class="matkp">
        <div class="f-col fill-height">
            <!-- NAV -->
            <matkp-nav></matkp-nav>

            <div class="mat-body">
                <div class="f-row" style="gap:20px;">
                    <div class="f-col">
                        <div class="f-row" style="gap:10px;font-size:12px;margin:10px 0;font-weight: bold;">
                            <div style="width:250px;text-align:center;">y axis</div>
                            <button @click="$parent.swapSides()" class="round-white" style="padding:0 5px;">⇄</button>
                            <div style="width:250px;text-align:center;">x axis</div>
                        </div>

                        <div class="f-row align-v-center" style="gap:10px;font-weight:bold;font-size:12px;margin: 0 0 40px 0;">
                            <div class="f-col align-v-center" style="gap:10px;width:250px;position:relative">
                                <template v-for="(select, index) in $parent.categoriesLeft">
                                <select @change="$parent.handleCategorySelect($event, 'left', index)">
                                    <option :value="null">none</option>
                                    <option v-for="option in $parent.categoryOptions" 
                                        :value="option"
                                        :selected="select===option ? true: false"
                                    >{{option}}</option>
                                </select>
                                </template>
                                <button class="add-factor round-white" @click="$parent.addFactor('left')">+ add factor</button>
                            </div>
                            <div style="width:22px;text-align:center;">✕</div>
                            <div class="f-col align-v-center" style="gap:10px;width:250px;position:relative">
                                <template v-for="(select, index) in $parent.categoriesRight">
                                <select @change="$parent.handleCategorySelect($event, 'right', index)">
                                    <option :value="null">none</option>
                                    <option v-for="option in $parent.categoryOptions" 
                                        :value="option"
                                        :selected="select===option ? true: false"
                                    >{{option}}</option>
                                </select>
                                </template>
                                <button class="add-factor round-white" @click="$parent.addFactor('right')">+ add factor</button>
                            </div>
                        </div>
                    </div>
                    <div class="f-col">
                        <div class="f-row" style="gap:10px;font-size:12px;margin:10px 0;font-weight: bold;">
                            <div style="width:250px;text-align:center;">aggregation</div>
                        </div>
                        <select v-model="$parent.selectedCalculations" multiple style="width:250px;">
                            <option v-for="option in $parent.calculationOptions" 
                                :value="option"
                            >{{option}}</option>
                        </select>
                        </div>
                </div>
                <!--
                <div class="f-row align-v-center" style="gap:10px; font-weight: bold; font-size: 12px;">
                    <select v-model="$parent.selectedCategories.categoryA">
                        <option :value="null">none</option>
                        <option v-for="option in $parent.categoryOptions" 
                            :value="option"
                            :selected="$parent.selectedCategories.categoryA===option ? true: false"
                        >{{option}}</option>
                    </select>
                    ✕
                    <select v-model="$parent.selectedCategories.categoryB">
                        <option :value="null">none</option>
                        <option v-for="option in $parent.categoryOptions" 
                            :value="option"
                            :selected="$parent.selectedCategories.categoryB===option ? true: false"
                        >{{option}}</option>
                    </select>
                    ::
                    <select v-model="$parent.selectedCategories.categoryC">
                        <option :value="null">none</option>
                        <option v-for="option in $parent.categoryOptions" 
                            :value="option"
                            :selected="$parent.selectedCategories.categoryC===option ? true: false"
                        >{{option}}</option>
                    </select>
                    <select v-model="$parent.selectedCalculations" multiple>
                        <option v-for="option in $parent.calculationOptions" 
                            :value="option"
                        >{{option}}</option>
                    </select>
                </div>
                -->
                <b-table 
                style="font-size: 14px; margin:20px 0;"
                small 
                sort-icon-left 
                responsive
                striped
                :fields="$parent.fields" 
                :items="$parent.items">
                    <template #thead-top>
                        <tr>
                            <th v-for="col in $parent.headerColumns3" :colspan="col.colspan" style="border-right:1px solid black">{{ col.label }}</th>
                        </tr>
                        <tr>
                            <th v-for="col in $parent.headerColumns2" :colspan="col.colspan" style="border-right:1px solid black">{{ col.label }}</th>
                        </tr>
                    </template>
                </b-table>
            </div>

            <!-- FOOTER -->
            <matkp-footer></matkp-footer>
        </div>
    </div>
</template>
  
<style>
table.table{
    width:auto;
}
table.table th, table.table td{
    padding: 5px 13px;
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
</style>
  