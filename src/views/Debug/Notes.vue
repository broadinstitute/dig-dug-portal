<template>
    <div>
        <!-- TODO: Work with Preeti on filter? -->
        <!-- Filter Component
             - Shouldn't take a whole day to setup ('it just works')
             - Send a function to filter component
             - Filter component binds filter to all components listening to it
             + Page-centric approach?
                - Would eventually require setup functions
             + Component-centric approach?
                - May require service-provider style pattern
                - Can bloat up relatively quickly
             - Components shouldn't know about the filter being passed to them (they should apply the function no problem)
             - A filter function should be applicable to many components at once
         -->
         
        <!-- Step 1: Interface Ergonomics -->
        <!-- 
            Filter provider and client are directly in page
            Cons:
            - Looks messy
            - Clutters template with implementation detail (of a kind) that technically could be hidden in the component
                !! Although, it seems that since this alone isn't sufficient for locuszoom and associations-table to respond to a change in the filters, 
                   this ends up being the biggest solution! (since we need to do reactive prop-drilling which implies prop/watcher, composition API, or multiple filterCs anyway)
            Pros:
            - Explicit
            - Only one provider-component pair required
         -->
        <filterP>
            <template slot-scope="filter">
                <filterC :foobar="filter">
                    <!-- how does each of these components apply the filter function? -->
                    <locuszoom></locuszoom>
                    <asscociations-table></asscociations-table>
                </filterC>
            </template>
        </filterP>

        <!-- 
            Filter component binds to a piece of data in the page, that each component directly subscribes to
            - Cost:
              - Breaches page scope (which we shouldn't do without Composition API to facilitate modularity and DRY)
              - Each component requiring the filter must implement the prop and watcher directly (also not DRY)
              - Prop-drilling costs
            - Benefit:
                - Fewest DOM elements required
                - Simple abstractions are used for implementation (Composition API can make them DRY)
                - Flat hierarchy
         -->
        <filter v-model="$parent.filter"></filter>
        <locuszoom
            :filter="$parent.filter"
        ></locuszoom>
        <asscociations-table
            :filter="$parent.filter"
        ></asscociations-table>

        <!-- 
            Apply the filter onto the data before it's passed out
            Pro:
            - No component necessary
            - Straightfoward (if hacky?)
            Con:
            - Cluttering template with procedural abstractions
            - No abstraction means no...?
         -->
        <filter-widget v-model="$parent.filter"></filter-widget>
        <locuszoom
            :value="$store.state.associations.data|$parent.filter"
        ></locuszoom>
        <asscociations-table
            :value="$store.state.associations.data|$parent.filter"
        ></asscociations-table>

        <!-- Revision:
            Pros:
            - If all the components just take the data directly then this works well
            Cons:
            - Most of the functionality is in the parent page (which will just get bigger and bigger)
                - Forces us towards Composition API/Vue 3
         -->
        <filter-widget v-model="$parent.filter"></filter-widget>
        <!-- 
            Page Script
            <script>
                new Vue({
                    computed: {
                        associationsData() {
                            return this.filter(this.$store.state.associations.data)
                        }
                    }
                    ...
                })
            ></script>
         -->
        <locuszoom
            v-model="$parent.associationsData"
        ></locuszoom>
        <asscociations-table
            v-model="$parent.associationsData"
        ></asscociations-table>

        <!-- 
            Revision: 
            - Use providers, again, to manage scope, but combine the filter provider with the filter widget to prevent the function from escaping to the page scope
            - Only usable with puppet components
        -->
        <filter-widget>
            <filterP>
                <filterC slot-scope="filter">
                    <locuszoom
                        :associations="filter($store.state.associations.data)">
                    </locuszoom>
                    <asscociations-table
                        :associations="filter($store.state.associations.data)">    
                    </asscociations-table>
                </filterC>
            </filterP>
        </filter-widget>

        <!-- 
            PO: 
            Turn the filter into a module?
            Could use registration functions to create hooks for filter change beahvior
            Pros:
            - Global availability
            - Natural service abstraction
            Cons:
            - Components shouldn't use it because components shouldn't be aware of the store. This means that the page has to take care of it
            Problem:
            - How does the filter end up being applied to the data? Bloats up the Page's created/mounted function! That's brittle and cluttering
         -->

        <filter-widget v-model="$parent.filter"></filter-widget>
        <filter-scope :state="$parent.filter">
            <!-- 
                LocusZoom and AssociationsTable both have a filterC component inside of them which handles
                => An APPLY event (which the component passes an applicator function to, as the response will vary with the client)
                => Prop Drilling (which will allow for an arbitrary location for the respondents to the filter as long as they are inside the parent)
                => Scope can be duplicated? <- would that require a miniature store (or module?) for the component to use?
                Cost:
                - Unflat hierarchy
                - Must modify existing components (will I have to do that anyway? How does this compare to similar modification costs?)
                Tradeoffs:
                - Will mainly work with components that duplicate the data they need
                - The subsystem will be a little long (many components with small innards) and uses some higher level Vue features
                Benefit:
                - Least amount of boilerplate for managing prop drilling (the client components just provide a filter function to their providers)
                - Filter-widget can go anywhere even if the scope can't
                    - If we can duplicate the filter-scope (HOW?) then we can manage the flatness part even if tags are duplicated

                (
                    TODO: are these pros unique to this solution?
                    This solution seems nice because...
                    * The filter-scope just passes an element along to whoever says they'll take it (doesn't care)
                    * The filter-client just passes a callback along to that says what the response to the scope should be (doesn't care what it gets as long as it's a predicate)
                    * Everything stays private to the components that are using the filter in the relevant way
                    * Ideally, the filter function will be able to gracefully handle all cases given (fails quietly and always returns something, even if it's the original data)
                        * See notes below
                )
             -->
            <locuszoom></locuszoom>
            <asscociations-table></asscociations-table>
        </filter-scope>

        <!-- But if we externalize this complexity, we need more refs to get this to work?  -->
        <filterP :state="filter">
            <filterC slot-scope="filter" @change="$ref.locuszoom.applyFilter(filter)">
                <locuszoom ref="locuszoom"></locuszoom>
            </filterC>
            <filterC slot-scope="filter" @change="$ref.associationsTable.applyFilter(filter)">
                <asscociations-table ref="associationsTable">    
                </asscociations-table>
            </filterC>
        </filterP>


        <!-- 
            Also necessary is a filter-function library
            - Assume AoS format: then => pattern match to prop shapes
                * applyFilter HoF?
                * Ideally, the filter function will be able to gracefully handle all cases given (fails quietly and always returns something, even if it's the original data)
                    * PROBLEM: The programmer must guarantee the shape of the data is relevant to the filter function! how do we want to preserve this contract?
                        * PO: Force strict option using PropCheck
                            * BUT: baseline pattern matching is loose-goosey
            - Implement loose token matching for heuristic filtering on prop names?
                NOTE: camel-case causes an ambiguity here!
                opts?
              - Loose matching between lower case, uppercase, and camel-case
              - Loose matching between _, -, whitespace and camelCase?
              - Loose matching with prefixes (e.g. `_src`)

            We could also use a style-guide for labels and a meeting for getting it implemented
            Alternately retool label tables
         -->

         <!-- 
             Also needed is a filter widget
            - Filter widget needs to be able to modify the filter function with an arbitrary number of option-value pairs given to it (i.e. highly extensible)
            - Filter function neeeds to know how to modify the provider that passes the function change message along
          -->

        <!-- 
            Suppose (preliminarily!) that we use the vue context api library. 
            Then the components we will need for the final solution would be:
            - Provider
            - Consumer
            - Event-Binder (wrapped by Consumer)
            - A component with means of defining what the filter is
            
            Then the widget that uses the component with means of defining what the filter is to the Provider, and all wrapped consumers respond with the function that was bound to them.
            Does this satisfy on the associations table?
            Does this satisfy on the locuszoom component?
            What will Jeff think?
         -->

        <!-- 
            NOTE: 
            some of these solutions share implementation requirements - these are the common currencies for the tradeoffs between these solutions
         -->

    </div>
</template>

