<template>
    <div class="pigean-page">
        <page-header
            v-if="$parent.diseaseGroup.name"
            class="pigean-global-header"
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
            :raw-phenotypes="$store.state.bioPortal.phenotypes"
        />
        <nav v-else class="pigean-fallback-nav" aria-label="Portal">
            <a href="/">Knowledge Portal</a><span>Bird methods</span>
        </nav>
        <main class="pigean-method-page">
            <header class="pigean-title">
                <div>
                    <h1>PIGEAN</h1>
                    <p>Priors Inferred from GEne ANnotations</p>
                </div>
                <div
                    class="pigean-method-tabs"
                    role="tablist"
                    aria-label="About PIGEAN"
                >
                    <button
                        v-for="(tab, index) in tabs"
                        :id="`pigean-tab-${tab.id}`"
                        :key="tab.id"
                        role="tab"
                        :aria-label="tab.title"
                        :aria-selected="route.tab === tab.id"
                        :tabindex="route.tab === tab.id ? 0 : -1"
                        :aria-controls="`pigean-panel-${tab.id}`"
                        @click="navigate({ tab: tab.id, section: null })"
                        @keydown="tabKey($event, index)"
                    >
                        {{ tab.title }}
                    </button>
                </div>
            </header>
            <section
                v-if="route.tab !== 'explorer'"
                class="pigean-method-section"
                aria-label="Method documentation"
            >
                <div
                    :id="`pigean-panel-${route.tab}`"
                    role="tabpanel"
                    :aria-labelledby="`pigean-tab-${route.tab}`"
                    class="pigean-document-panel"
                >
                    <pigean-method-content
                        :key="route.tab"
                        :name="route.tab"
                        :title="tabs.find((tab) => tab.id === route.tab).title"
                        @section="section"
                        @loaded="scrollToSection"
                    />
                </div>
            </section>
            <section
                v-show="route.tab === 'explorer'"
                id="pigean-panel-explorer"
                role="tabpanel"
                class="pigean-featured"
                aria-labelledby="pigean-tab-explorer"
            >
                <header class="pigean-app-heading">
                    <div>
                        <h2 id="explorer-heading">Explore genetic support</h2>
                        <p>
                            Follow the evidence from a phenotype to its genes
                            and gene sets.
                        </p>
                    </div>
                    <button
                        class="btn btn-link"
                        @click="
                            navigate({
                                tab: 'user-guide',
                                section:
                                    'user-guide-choose-a-model-and-phenotype',
                            })
                        "
                    >
                        Read the usage guide
                    </button>
                </header>
                <pigean-portal-explorer :route="route" @navigate="navigate" />
            </section>
        </main>
        <page-footer
            v-if="$parent.diseaseGroup.name"
            :disease-group="$parent.diseaseGroup"
        />
        <footer v-else class="pigean-local-footer">
            PIGEAN · A method for exploring direct and indirect genetic support.
        </footer>
    </div>
</template>
<script>
import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import PigeanMethodContent from "@/components/researchPortal/PIGEAN/PigeanMethodContent.vue";
import PigeanPortalExplorer from "@/components/researchPortal/PIGEAN/PigeanPortalExplorer.vue";
import { MODELS } from "@/utils/pigeanPortalUtils";
const defaults = {
    tab: "abstract",
    view: "explore",
    model: "cfde-inc-v2",
    trait: "T2D",
    bModel: "small",
    bTrait: "T2D",
};
const allowed = [
    ...Object.keys(defaults),
    "run",
    "snapshot",
    "gene",
    "gene_set",
    "sheet",
    "section",
];
function readRoute() {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const route = { ...defaults };
    allowed.forEach((key) => {
        if (params.has(key)) route[key] = params.get(key);
    });
    if (
        !["abstract", "explorer", "documentation", "user-guide"].includes(
            route.tab
        )
    )
        route.tab = "abstract";
    if (!["explore", "compare"].includes(route.view)) route.view = "explore";
    if (!MODELS.some((model) => model.id === route.model))
        route.model = defaults.model;
    if (!MODELS.some((model) => model.id === route.bModel))
        route.bModel = defaults.bModel;
    if (window.location.hash === "#explorer" || route.section === "explorer") {
        route.tab = "explorer";
        delete route.section;
    }
    return route;
}
export default {
    components: {
        PageHeader,
        PageFooter,
        PigeanMethodContent,
        PigeanPortalExplorer,
    },
    data: () => ({
        route: readRoute(),
        tabs: [
            { id: "abstract", title: "Abstract" },
            { id: "explorer", title: "Explorer" },
            { id: "documentation", title: "Documentation" },
            { id: "user-guide", title: "Usage guide" },
        ],
    }),
    mounted() {
        window.addEventListener("hashchange", this.restore);
        this.scrollToSection();
    },
    beforeDestroy() {
        window.removeEventListener("hashchange", this.restore);
    },
    methods: {
        restore() {
            const previousTab = this.route.tab;
            this.route = readRoute();
            this.$nextTick(() => {
                if (this.route.section) this.scrollToSection();
                else if (previousTab !== this.route.tab)
                    document
                        .querySelector(".pigean-title")
                        .scrollIntoView({ block: "start" });
            });
        },
        navigate(patch) {
            const next = { ...this.route, ...patch };
            const params = new URLSearchParams();
            allowed.forEach((key) => {
                if (next[key]) params.set(key, next[key]);
            });
            const hash = `#${params.toString()}`;
            if (window.location.hash !== hash) window.location.hash = hash;
            else this.scrollToSection();
        },
        section(id) {
            this.navigate(
                id === "explorer"
                    ? { tab: "explorer", section: null }
                    : { section: id }
            );
        },
        scrollToSection() {
            if (this.route.section) {
                const target = document.getElementById(this.route.section);
                if (target) target.scrollIntoView({ block: "start" });
            }
        },
        tabKey(event, index) {
            let next = index;
            if (event.key === "ArrowRight")
                next = (index + 1) % this.tabs.length;
            else if (event.key === "ArrowLeft")
                next = (index + this.tabs.length - 1) % this.tabs.length;
            else if (event.key === "Home") next = 0;
            else if (event.key === "End") next = this.tabs.length - 1;
            else return;
            event.preventDefault();
            this.navigate({ tab: this.tabs[next].id, section: null });
            this.$nextTick(() =>
                document
                    .getElementById(`pigean-tab-${this.tabs[next].id}`)
                    .focus()
            );
        },
    },
};
</script>
<style>
.pigean-page {
    background: #f1f5f8;
    color: #203b4d;
    font-family: Arial, Helvetica, sans-serif;
}
.pigean-method-page {
    max-width: 1420px;
    padding: 42px 42px 70px;
    margin: 0 auto;
}
.pigean-fallback-nav {
    min-height: 62px;
    display: flex;
    align-items: center;
    gap: 30px;
    padding: 14px 42px;
    background: #fff;
    border-bottom: 1px solid #dbe4ea;
}
.pigean-fallback-nav a {
    color: #205577;
    font-size: 18px;
    font-weight: 600;
}
.pigean-fallback-nav span {
    font-size: 14px;
    color: #647d8a;
}
.pigean-title {
    display: flex;
    align-items: center;
    gap: 48px;
    padding: 0 0 30px;
    scroll-margin-top: 22px;
}
.pigean-title h1 {
    font-size: 44px;
    font-weight: 700;
    margin: 0 0 5px;
    letter-spacing: -0.7px;
    color: #164d71;
}
.pigean-title p {
    font-size: 13px;
    margin: 0;
    color: #506a7a;
}
.pigean-primary {
    background: #146d9b;
    border-color: #146d9b;
    color: #fff !important;
}
.pigean-primary:hover {
    background: #11577b;
    border-color: #11577b;
}
.pigean-method-section {
    background: #fff;
    border-radius: 8px;
    border: 1px solid #dbe4ea;
}
.pigean-method-tabs {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
}
.pigean-method-tabs button {
    position: relative;
    background: none;
    border: 0;
    color: #536d7e;
    padding: 12px 18px;
    font-size: 17px;
}
.pigean-method-tabs button + button::before {
    content: "|";
    position: absolute;
    left: -2px;
    color: #acbcc7;
    font-style: normal;
    font-weight: 400;
}
.pigean-method-tabs button[aria-selected="true"] {
    color: #146d9b;
    font-style: normal;
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 8px;
}
.pigean-document-panel {
    padding: 34px;
}
.pigean-featured {
    scroll-margin-top: 20px;
}
.pigean-app-heading {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    margin-bottom: 20px;
}
.pigean-app-heading h2 {
    font-size: 30px;
    color: #193c55;
    margin: 0 0 8px;
}
.pigean-app-heading p {
    color: #536d7e;
    margin: 0;
}
.pigean-local-footer {
    color: #5f7888;
    padding: 25px 42px;
    font-size: 13px;
    border-top: 1px solid #dbe4ea;
}
.pigean-page :focus-visible {
    outline: 3px solid #9750a1;
    outline-offset: 3px;
}
.pigean-page .btn {
    border-radius: 4px;
}
@media (max-width: 1000px) {
    /* Let the shared portal menu wrap above the method, without covering it. */
    .pigean-global-header .row[class*="kp-header"] {
        height: auto;
        min-height: 50px;
        padding-bottom: 12px;
    }
    .pigean-global-header .kp-menu-wrapper {
        position: static;
        flex: 0 0 100%;
        max-width: 100%;
        text-align: left;
    }
    .pigean-global-header .amp-banner-2021 img {
        max-width: calc(100% - 30px);
        height: auto;
    }
    .pigean-title {
        gap: 18px;
        align-items: flex-start;
        flex-direction: column;
    }
    .pigean-method-tabs button:first-child {
        padding-left: 0;
    }
}
@media (max-width: 760px) {
    .pigean-method-page {
        padding: 28px 14px 45px;
    }
    .pigean-app-heading {
        align-items: flex-start;
        flex-direction: column;
    }
    .pigean-title h1 {
        font-size: 36px;
    }
    .pigean-document-panel {
        padding: 22px 18px;
    }
    .pigean-method-tabs button {
        font-size: 14px;
        padding: 12px 10px;
    }
    .pigean-fallback-nav {
        padding: 14px 18px;
    }
}
</style>
