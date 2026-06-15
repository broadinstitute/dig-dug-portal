<template>
    <div>
        <div style="display:flex; gap:20px">
            <div>
                <img
                    src="https://hugeampkpncms.org/sites/default/files/users/user32/kc_icons/kc_reveal.png"
                    style="height:100px"
                    alt=""
                />
            </div>
            <div style="display:flex; flex-direction: column;">
                <div style="font-size: 2em; font-weight: bold;">CFDE REVEAL</div>
                <div style="font-size: 1.5em; font-weight: bold;">
                    Tell us what you're researching. We'll surface candidate genes and mechanisms you may not have considered.
                </div>
                <div style="font-size: 1.2em;">
                    All results are grounded in
                    <a role="button" @click="$emit('show-byor-tab')">computational analyses of biological data</a>.
                    An LLM is used to find, filter, and interpret findings in the context of your research.
                </div>
            </div>
        </div>
        <div>
            <ol>
                <li>
                    <strong>Search:</strong> For the best results, try entering a research question that combines a target gene, biological mechanism, tissue context, and disease phenotype.
                </li>
                <li>
                    <strong>Refine:</strong> Review and edit the extracted search terms to ensure they perfectly capture your intent, and toggle on "Exploratory Mode" if you want the AI to bridge missing gaps in the data with speculative leaps.
                </li>
                <li>
                    <strong>Analyze &amp; Export:</strong> Review the generated mechanistic hypotheses. Explore the biological mechanism maps automatically translated into the Biolink standard. Check the map's edges to see which connections are validated by the NCATS Translator. Download your full interactive report to continue your workflow.
                </li>
            </ol>
        </div>
    </div>
</template>

<script>
export default {
    name: "WorkflowHeader",
};
</script>
