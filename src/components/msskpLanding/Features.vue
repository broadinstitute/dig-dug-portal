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
                <div
                    v-for="resource in group.resources"
                    :key="resource"
                    class="msskp-landing-features-box"
                >
                    {{ resource }}
                </div>
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
                        "Variant Sifter",
                        "HuGE Calculator",
                        "Human > Mouse comparator",
                    ],
                },
                {
                    subheader: "Single Cell Resources",
                    resources: ["Single Cell Browser", "Cell State Browser"],
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
}
</style>
