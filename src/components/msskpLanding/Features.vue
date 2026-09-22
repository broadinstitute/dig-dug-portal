<template>
    <section class="msskp-landing-features">
        <h2 class="msskp-landing-features-header">Explore Portal Resources</h2>
        <div
            v-for="group in resourceGroups"
            :key="group.subheader"
            class="msskp-landing-features-group"
        >
            <h3 class="msskp-landing-features-subheader">
                {{ group.subheader }}
            </h3>
            <div class="msskp-landing-features-row">
                <component
                    :is="resource.href ? 'a' : 'div'"
                    v-for="resource in group.resources"
                    :key="resource.title"
                    class="msskp-landing-features-box"
                    v-bind="
                        resource.href
                            ? { href: resource.href }
                            : {}
                    "
                >
                    <img
                        class="msskp-landing-features-icon"
                        :src="resource.icon"
                        :alt="resource.title"
                    />
                    <div class="msskp-landing-features-title">
                        {{ resource.title }}
                    </div>
                    <p class="msskp-landing-features-description">
                        {{ resource.description }}
                    </p>
                </component>
            </div>
        </div>
    </section>
</template>

<script>
import Vue from "vue";

export default Vue.component("msskp-landing-features", {
    data() {
        return {
            resourceGroups: [
                {
                    subheader: "Human Genetic and Genomic Resources",
                    resources: [
                        {
                            title: "Variant Sifter",
                            icon: "/images/msskp_icons/variant_sifter.svg",
                            href: "/r/kp_variant_sifter",
                            description:
                                "Explore genetic associations and prioritize variants across musculoskeletal phenotypes. Filter signals by locus, ancestry, and supporting evidence in one view.",
                        },
                        {
                            title: "HuGE Calculator",
                            icon: "/images/msskp_icons/huge.svg",
                            href: "/hugecalculator.html",
                            description:
                                "Estimate human genetic evidence for a gene across relevant traits. Combine association strength and supporting studies into a clear HuGE score.",
                        },
                        {
                            title: "Human > Mouse comparator",
                            icon: "/images/msskp_icons/human_mouse.svg",
                            href: "/mouse_diff_exp.html",
                            description:
                                "Compare gene expression and biological context between human and mouse. Identify conserved and divergent patterns that inform translational hypotheses.",
                        },
                    ],
                },
                {
                    subheader: "Single Cell Resources",
                    resources: [
                        {
                            title: "Single Cell Browser",
                            icon: "/images/msskp_icons/single_cell.svg",
                            href: "/r/scb",
                            description:
                                "Browse single-cell expression profiles across musculoskeletal cell types. Map genes to clusters and explore tissue-specific expression patterns.",
                        },
                        {
                            title: "Cell State Browser",
                            icon: "/images/msskp_icons/cell_state.svg",
                            href: "/liger.html",
                            description:
                                "Investigate cell-state transitions and gene programs linked to disease biology. Connect expression states with pathways and candidate effector mechanisms.",
                        },
                    ],
                },
            ],
        };
    },
});
</script>

<style>
.msskp-landing-features {
    width: 100%;
    background-color: #dddddd;
    padding: 35px 50px;
    box-sizing: border-box;
    text-align: center;
}

.msskp-landing-features-header {
    font-size: 20px;
    font-weight: 700;
    margin: 0 0 20px;
}

.msskp-landing-features-group + .msskp-landing-features-group {
    margin-top: 20px;
}

.msskp-landing-features-subheader {
    font-size: 16px;
    font-weight: 700;
    margin: 0 0 10px;
}

.msskp-landing-features-row {
    display: flex;
    justify-content: center;
    gap: 15px;
}

.msskp-landing-features-box {
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

a.msskp-landing-features-box:hover {
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
}

.msskp-landing-features-icon {
    width: 100px;
    height: 100px;
    margin-bottom: 12px;
    display: block;
}

.msskp-landing-features-title {
    font-family: "Roboto Slab", serif;
    font-weight: 600;
    color: #6060a4;
    font-size: 14px;
    margin-bottom: 8px;
}

.msskp-landing-features-description {
    margin: 0;
    font-size: 13px;
    line-height: 1.4;
    color: #333333;
}
</style>
