<template>
</template>

<script>
    /*
        LoadControlBase
        - LoadControls are an abstract component that dispatch modifications to the local instance of a BioIndex that
            manipulates the *process* of a query
            - Processual parameters for a query are: `continuation`, `abort`
        - So far we can establish the existence of the following load controls, which are mutually independent
            - AbortControl
                - S0: Invariants:
                    - R_d: Loading = not Abort  // relation: for AbortControl, action on AbortControl flips Load and Abort
                - S1: Default Option:   Cancel
                    - Display on:
                        at least Continuation != null => Loading = True
                    - BioIndex Mutation:
                        Abort = True
                        Set Continuation to null ~~~ Loading = False
                        Report Data that was sent
                - S2: Undo Option:      Restart
                    - Display on:
                        at least Continuation = null and query exists?
                        - It's possible for query to be an empty page
                    - BioIndex Mutation:
                        Abort = False
                    - BioIndex Action:
                        Dispatch query with original parameters
                        (Let continuation vary)
                - S3: Empty option
                    - Display on:
                        Query not exists
                        DNC Continuation => DNC Loading
            - PauseControl
                - S0: Invariants:
                    - Loading ~~~ continuation tokens
                - S1: Default Option:   Pause
                    - BioIndex State:
                        Abort = True
                - S2: Undo Option:      Continue
                    - BioIndex State:
                        Abort != False
            - More
                If I'm loading, and I can continue, but I'm not continuing,
                - S1
                    - BioIndex State:?
                        Abort = True
                        Load = True
                - S2
                    - BioIndex State
                - T1
                    Abort (True -> False)
        - State Semantics:
            - Use/Hide
                - Pause: Is loading, but is aborted, data exists
                - Continue: Is loading, is not aborted, data exists
                - Cancel: Is not loading, and is aborted, data is empty (force)
                - Restart: Is loading, is not aborted, data is empty
            -  Show
                - Can Pause: Is loading, is not aborted, has data
                - Can Continue: Is loading, is aborted, data_t === data_t-1
                - Can Cancel: Is loading, Is not aborted, DNC data (likely has)
                - Can Restart:  Is not loading, Is aborted, data empty (b/c cancel), have query?
        - Note
            - Difference between Pause and Cancel
                - Identical display states: Is loading, is not aborted
                - Different transform states:
                    - Pause: Loading, not Aborted -> Loading, Aborted,  = Continuable  // possible?
                    - Cancel: Loading, not Aborted -> not Loading, Aborted = UnContinuable
                    And others:
                    - Continue: Loading, Aborted -> not Aborted, Loading
                    - Restart: not Loading, Aborted -> Loading, not Aborted | Query
    */
    // TODO: Use vue-state-machine, or xState?
    export default {
        name: "LoadControl",
        props: ["aborted", "loading"],
    }
</script>

<style scoped>

</style>
