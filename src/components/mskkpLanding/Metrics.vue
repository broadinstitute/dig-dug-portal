<template>
    <section class="mskkp-landing-metrics">
        <div class="mskkp-landing-metrics-row">
            <component
                :is="stat.href ? 'a' : 'div'"
                v-for="(stat, index) in stats"
                :key="index"
                class="mskkp-landing-metrics-item"
                v-bind="stat.href ? { href: stat.href } : {}"
            >
                <div class="mskkp-landing-metrics-icon">
                    <img :src="`/images/icons/stats/${stat.icon}.svg`" />
                </div>
                <div class="mskkp-landing-metrics-info">
                    <div class="mskkp-landing-metrics-count">
                        {{ stat.value }}
                    </div>
                    <div class="mskkp-landing-metrics-label">
                        {{ stat.display }}
                    </div>
                </div>
            </component>
        </div>
    </section>
</template>

<script>
import Vue from "vue";

export default Vue.component("mskkp-landing-metrics", {
    props: ["stats"],
});
</script>

<style>
.mskkp-landing-metrics {
    width: 100%;
    height: 100px;
    background-color: #bbbbbb;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
}

.mskkp-landing-metrics-row {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    gap: 40px;
}

.mskkp-landing-metrics-item,
a.mskkp-landing-metrics-item {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #6060a4 !important;
    text-decoration: none;
}

a.mskkp-landing-metrics-item:hover {
    opacity: 0.85;
    color: #6060a4 !important;
}

.mskkp-landing-metrics-icon {
    height: 70px;
    width: fit-content;
}

.mskkp-landing-metrics-icon img {
    height: 100%;
    display: block;
}

.mskkp-landing-metrics-count {
    font-size: 22px;
    font-weight: bold;
}

.mskkp-landing-metrics-label {
    font-size: 12px;
    max-width: 70px;
}
</style>
