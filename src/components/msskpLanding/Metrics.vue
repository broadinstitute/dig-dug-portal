<template>
    <section class="msskp-landing-metrics">
        <div class="msskp-landing-metrics-row">
            <component
                :is="stat.href ? 'a' : 'div'"
                v-for="(stat, index) in stats"
                :key="index"
                class="msskp-landing-metrics-item"
                v-bind="stat.href ? { href: stat.href } : {}"
            >
                <div class="msskp-landing-metrics-icon">
                    <img :src="`/images/icons/stats/${stat.icon}.svg`" />
                </div>
                <div class="msskp-landing-metrics-info">
                    <div class="msskp-landing-metrics-count">
                        {{ stat.value }}
                    </div>
                    <div class="msskp-landing-metrics-label">
                        {{ stat.display }}
                    </div>
                </div>
            </component>
        </div>
    </section>
</template>

<script>
import Vue from "vue";

export default Vue.component("msskp-landing-metrics", {
    props: ["stats"],
});
</script>

<style>
.msskp-landing-metrics {
    width: 100%;
    height: 100px;
    background-color: #bbbbbb;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
}

.msskp-landing-metrics-row {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    gap: 40px;
}

.msskp-landing-metrics-item,
a.msskp-landing-metrics-item {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #6060a4 !important;
    text-decoration: none;
}

a.msskp-landing-metrics-item:hover {
    opacity: 0.85;
    color: #6060a4 !important;
}

.msskp-landing-metrics-icon {
    height: 70px;
    width: fit-content;
}

.msskp-landing-metrics-icon img {
    height: 100%;
    display: block;
}

.msskp-landing-metrics-count {
    font-size: 22px;
    font-weight: bold;
}

.msskp-landing-metrics-label {
    font-size: 12px;
    max-width: 70px;
}
</style>
