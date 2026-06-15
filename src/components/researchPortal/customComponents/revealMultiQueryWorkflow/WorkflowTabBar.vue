<template>
    <div>
        <div v-if="workflowErrorSteps.length" class="mb-2">
            <div
                v-for="(errStep, ei) in workflowErrorSteps"
                :key="'reveal-wf-err-' + ei + '-' + (errStep.title || '')"
                class="alert alert-danger py-2 small mb-1"
                role="alert"
            >
                <strong>Error:</strong> {{ errStep.title }}
            </div>
        </div>
        <div style="display:flex; gap:20px">
            <h4
                class="reveal-tab"
                :class="{ 'tab-active': activeTab === 'terms' }"
                @click="$emit('select-tab', 'terms')"
            >
                Search terms
            </h4>
            <h4
                class="reveal-tab"
                :class="{ 'tab-active': activeTab === 'data', 'tab-inactive': !dataTabEnabled }"
                @click="dataTabEnabled && $emit('select-tab', 'data')"
            >
                Data
            </h4>
            <h4
                class="reveal-tab"
                :class="{ 'tab-active': activeTab === 'results', 'tab-inactive': !resultsTabEnabled }"
                @click="resultsTabEnabled && $emit('select-tab', 'results')"
            >
                Results
            </h4>
        </div>
    </div>
</template>

<script>
export default {
    name: "WorkflowTabBar",
    props: {
        activeTab: { type: String, default: "terms" },
        dataTabEnabled: { type: Boolean, default: false },
        resultsTabEnabled: { type: Boolean, default: false },
        workflowErrorSteps: { type: Array, default: () => [] },
    },
};
</script>

<style src="./mqSharedStyles.css"></style>
