<template>
    <div>
        
        <!-- FilterWidget -->
        <filter-widget v-model="$parent.filterFunction" :inclusive="true">
            <filter-widget-control
                :field="'pValue'"
                :op="'<='"
                :threshold="'0.01'"
                :multiple="false">
                <!-- e.g. Documentation component can be used here to control and standardize labels -->
            </filter-widget-control>
            <filter-widget-control
                :field="'beta'"
                :op="'>='"
                :threshold="'3'"
                :multiple="false">
                <!-- e.g. Documentation component can be used here to control and standardize labels -->
            </filter-widget-control>
            <filter-widget-control
                :field="'test'"
                :op="'==='"
                :options="['no matches', 'some matches']"
                :multiple="true">
                Test String Match
            </filter-widget-control>
        </filter-widget>

        <!-- FilterContext is required in the page and must wrap around components with a filterable-wrapper -->
        <filter-context v-model="$parent.filterFunction">
            <filter-user 
                :initialData="[
                    { pValue: 0.01, beta: 3 }, 
                    {pValue: 0.001, beta: 3 }, 
                    {pValue: 0.2, beta: 3}, 
                    {pValue: 0.01, beta: 4}, 
                    {pValue: 0.01, beta:2}, 
                    {test: 'no matches'}
                ]">
            </filter-user>
        </filter-context>


    </div>
</template>
