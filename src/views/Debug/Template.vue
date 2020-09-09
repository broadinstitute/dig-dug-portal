<template>
    <div>
        
        <!-- FilterWidget -->
        <!-- Q: Does filterWidget have to take a filterFunction from its parent?
             A: No.

             Q: Why is filter-widget defined separately from filter-context? Why not wrap components using filter-widget?
             A: I can give three reasons:
                - It allows filter-widget to be rendered anywhere on the page, separate from fitler-context.
                - 
                - 
         -->
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
            <!-- 
                For the most part, string matching will be done by string equality under '=='/'==='
                TODO: What happens when we want a conditional to be an inclusive-OR and not an AND? (this is the case for AssociationsTable)
                TODO: Allow functions as given `op` to allow for more interesting lexical matches?
             -->
            <filter-widget-control
                :field="'test'"
                :op="'=='"
                :options="['no matches', 'some matches']"
                :multiple="true">
                Test String Match
            </filter-widget-control>
        </filter-widget>

        <!-- FilterContext is required in the page and must wrap around components with a filterable-wrapper -->
        <!-- Q: Does filter-provider consume a function in v-model, or a spec for deriving a function? 
             A: It consumes a function. 
             
             If we want to abstract further and have it consume specs then you have either write a function that converts some
             data defining predicates (which are objects with keys for: /field/, a binary /operation/, and a /threshold/)
             These functions are already defined in filterHelpers.js – see `predicateFromSpec` and `filterFromPredicates`.
        -->
        <filter-context :value="$parent.filterFunction">
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

        {{`the filter function is \n`}}
        <pre>{{`${$parent.filterFunction}`}}</pre>


    </div>
</template>
