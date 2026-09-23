<template>
    <section class="mskkp-landing-features">
        <h2 class="mskkp-landing-features-header">Explore Portal Resources</h2>
        <div
            v-for="group in resourceGroups"
            :key="group.subheader"
            class="mskkp-landing-features-group"
        >
            <h3 class="mskkp-landing-features-subheader">
                {{ group.subheader }}
            </h3>
            <div class="mskkp-landing-features-row">
                <component
                    :is="resource.href ? 'a' : 'div'"
                    v-for="resource in group.resources"
                    :key="resource.title"
                    class="mskkp-landing-features-box"
                    v-bind="
                        resource.href
                            ? { href: resource.href }
                            : {}
                    "
                >
                    <img
                        v-if="resource.icon"
                        class="mskkp-landing-features-icon"
                        :src="resource.icon"
                        :alt="resource.title"
                    />
                    <div
                        v-else
                        class="mskkp-landing-features-icon mskkp-landing-features-icon-placeholder"
                        aria-hidden="true"
                    ></div>
                    <div class="mskkp-landing-features-title">
                        <span
                            v-if="resource.isNew"
                            class="mskkp-landing-features-new"
                            >New</span
                        >
                        {{ resource.title }}
                    </div>
                    <p class="mskkp-landing-features-description">
                        {{ resource.description }}
                    </p>
                </component>
            </div>
        </div>
    </section>
</template>

<script>
import Vue from "vue";

export default Vue.component("mskkp-landing-features", {
    data() {
        return {
            resourceGroups: [
                {
                    subheader: "Human Genetic and Genomic Resources",
                    resources: [
                        {
                            title: "GWAS Meta-analyses",
                            icon: "/images/mskkp_icons/gwas_analyses.svg",
                            href: "/phenotype.html?phenotype=Osteoporosis",
                            description:
                                "Access our sample-aware “bottom-line” meta-analyses of all human GWAS on the portal for a given trait.",
                        },
                        {
                            title: "Variant Sifter",
                            icon: "/images/mskkp_icons/variant_sifter.svg",
                            href: "/r/kp_variant_sifter",
                            description:
                                "Explore genetic associations and prioritize variants across musculoskeletal phenotypes. Filter signals by locus, ancestry, and supporting evidence in one view.",
                        },
                        {
                            title: "Predicted effector gene (PEG) lists",
                            icon: "/images/mskkp_icons/PEG.svg",
                            href: "/r/pegl_app_front_PEGASUS",
                            description:
                                "Curated PEG lists drawn from published studies across many traits and disease areas.",
                        },
                    ],
                },
                {
                    subheader: "Single Cell Resources",
                    resources: [
                        {
                            title: "Single Cell Browser",
                            icon: "/images/mskkp_icons/single_cell.svg",
                            href: "/r/scb",
                            description:
                                "Browse integrated single cell maps for musculoskeletal tissues. Map genes to clusters and explore tissue-specific expression patterns.",
                        },
                        {
                            title: "Cell State Browser",
                            icon: "/images/mskkp_icons/cell_state.svg",
                            href: "/liger.html",
                            isNew: true,
                            description:
                                "Investigate cell-state transitions and gene programs linked to disease biology. Connect expression states with pathways and candidate effector mechanisms.",
                        },
                        {
                            title: "Human > Mouse comparator",
                            icon: "/images/mskkp_icons/human_mouse.svg",
                            href: "/mouse_diff_exp.html",
                            isNew: true,
                            description:
                                "Compare gene expression and biological context between human and mouse. Identify conserved and divergent patterns that inform translational hypotheses.",
                        },
                    ],
                },
            ],
        };
    },
});
</script>

<style>
.mskkp-landing-features {
    width: 100%;
    background-color: #dddddd;
    padding: 35px 50px;
    box-sizing: border-box;
    text-align: center;
}

.mskkp-landing-features-header {
    font-size: 20px;
    font-weight: 700;
    margin: 0 0 20px;
}

.mskkp-landing-features-group + .mskkp-landing-features-group {
    margin-top: 20px;
}

.mskkp-landing-features-subheader {
    font-size: 16px;
    font-weight: 700;
    margin: 0 0 10px;
}

.mskkp-landing-features-row {
    display: flex;
    justify-content: center;
    gap: 15px;
}

.mskkp-landing-features-box {
    flex: 0 0 calc((100% - 60px) / 5);
    background-color: #ffffff;
    padding: 15px;
    font-size: 14px;
    border-radius: 5px;
    text-align: center;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    color: inherit;
    text-decoration: none;
}

a.mskkp-landing-features-box:hover {
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
}

.mskkp-landing-features-icon {
    width: 100px;
    height: 100px;
    margin-bottom: 12px;
    display: block;
}

.mskkp-landing-features-icon-placeholder {
    background-color: transparent;
}

.mskkp-landing-features-title {
    font-family: "Roboto Slab", serif;
    font-weight: 600;
    color: #6060a4;
    font-size: 14px;
    margin-bottom: 8px;
}

.mskkp-landing-features-new {
    display: inline-block;
    margin-right: 6px;
    padding: 1px 6px;
    border-radius: 3px;
    background-color: #6060a4;
    color: #ffffff;
    font-family: inherit;
    font-size: 11px;
    font-weight: 700;
    line-height: 1.4;
    vertical-align: middle;
}

.mskkp-landing-features-description {
    margin: 0;
    font-size: 13px;
    line-height: 1.4;
    color: #333333;
}
</style>
