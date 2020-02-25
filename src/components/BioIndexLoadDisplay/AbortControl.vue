<template>
    <button></button>
</template>

<script>
    export default {
        name: "AbortControl",
        props: ["aborted", "loading"],
        getters: {
            canPause() {},
            canCancel() {},
            canContinue() {},
            canRestart() {},
        },
        actions: {
            pause(context) {
                const canPause = state.loading && !state.aborted;
                if (canPause) {
                    context.commit("setAbort", true);
                };
            },
            cancel(context) {
                const canCancel = state.loading && !state.aborted;
                if (canCancel) {
                    context.commit();
                };
            },
            continue(context) {
                const canContinue = state.loading && state.aborted;
                if (canContinue) {
                    context.commit("setAbort", true);
                };
            },
            restart(context) {
                const canRestart = state.loading && state.aborted;
                if (canRestart) {
                    context.commit("setAbort", true);
                };
            },
        }
    }
</script>

<style scoped>

</style>
