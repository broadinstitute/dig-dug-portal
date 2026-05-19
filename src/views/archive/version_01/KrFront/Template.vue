<template>
    <div>
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
            page="front"
        ></page-header>

        <div class="container-fluid mdkp-body glens-page">
            <section class="glens-hero">
                <div class="glens-topbar">
                    <div>
                        <p class="glens-eyebrow">The Genomic Lens</p>
                        <h1 class="glens-title">
                            Rare disease genomics portal prototype
                        </h1>
                    </div>
                    <span class="glens-badge">Local prototype</span>
                </div>

                <div class="row no-gutters glens-split">
                    <div class="col-lg-6 glens-panel glens-panel--variant">
                        <div class="glens-panel-badge">Variant / Gene / Disease</div>
                        <h2 class="glens-panel-title">Search by genomic finding.</h2>
                        <p class="glens-panel-copy">
                            Use one input for variant coordinates, gene symbols, or
                            rare disease names. This path opens a variant-centered
                            result page.
                        </p>

                        <form class="glens-search" @submit.prevent="goToVariant">
                            <label class="glens-label" for="variant-search">
                                Search input
                            </label>
                            <div class="glens-search-shell">
                                <input
                                    id="variant-search"
                                    v-model.trim="variantQuery"
                                    class="glens-input"
                                    type="text"
                                    :placeholder="frontFixture.variantPlaceholder"
                                />
                                <button class="glens-button glens-button--primary" type="submit">
                                    Open Results
                                </button>
                            </div>
                        </form>

                        <div class="row glens-mini-grid">
                            <div class="col-sm-6">
                                <div class="glens-mini-card">
                                    <p class="glens-mini-label">Mode</p>
                                    <p class="glens-mini-title">Variant-centered route</p>
                                    <p class="glens-mini-copy">
                                        Structured for locus-first exploration.
                                    </p>
                                </div>
                            </div>
                            <div class="col-sm-6">
                                <div class="glens-mini-card">
                                    <p class="glens-mini-label">Examples</p>
                                    <p class="glens-mini-title">Coordinate, gene, disease</p>
                                    <p class="glens-mini-copy">
                                        {{ frontFixture.variantExample }}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-lg-6 glens-panel glens-panel--phenotype">
                        <div class="glens-panel-badge glens-panel-badge--green">
                            Phenotype (HPO Terms)
                        </div>
                        <h2 class="glens-panel-title">Search by phenotype profile.</h2>
                        <p class="glens-panel-copy">
                            Enter one or more phenotype terms or HPO identifiers.
                            This path opens a phenotype-centered result page.
                        </p>

                        <form class="glens-search" @submit.prevent="goToPhenotype">
                            <label class="glens-label" for="phenotype-search">
                                Phenotype input
                            </label>
                            <div class="glens-search-shell">
                                <input
                                    id="phenotype-search"
                                    v-model.trim="phenotypeQuery"
                                    class="glens-input"
                                    type="text"
                                    :placeholder="frontFixture.phenotypePlaceholder"
                                />
                                <button class="glens-button glens-button--green" type="submit">
                                    Open Results
                                </button>
                            </div>
                        </form>

                        <div class="row glens-mini-grid">
                            <div class="col-sm-6">
                                <div class="glens-mini-card">
                                    <p class="glens-mini-label">Mode</p>
                                    <p class="glens-mini-title">Phenotype-led route</p>
                                    <p class="glens-mini-copy">
                                        Built for symptom-first reverse lookup.
                                    </p>
                                </div>
                            </div>
                            <div class="col-sm-6">
                                <div class="glens-mini-card">
                                    <p class="glens-mini-label">Examples</p>
                                    <p class="glens-mini-title">Plain terms or HPO IDs</p>
                                    <p class="glens-mini-copy">
                                        {{ frontFixture.phenotypeExample }}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>

        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>

<script>
export default {
    name: "KrFrontTemplate",
    data() {
        return {
            variantQuery: "",
            phenotypeQuery: "",
            frontFixture: {
                variantPlaceholder:
                    "chr15:22,000,220 G>C / UBE3A / 15q11-q13 microdeletion syndrome",
                phenotypePlaceholder:
                    "hypotonia / developmental delay / HP:0001250",
                variantExample:
                    "chr15:22,000,220 G>C / UBE3A / 15q11-q13 microdeletion syndrome",
                phenotypeExample:
                    "hypotonia / developmental delay / HP:0001250",
            },
        };
    },
    methods: {
        goToVariant() {
            const query = this.variantQuery || "chr15:22,000,220 G>C";
            window.location.assign(`/krVariant_V3.html?query=${encodeURIComponent(query)}`);
        },
        goToPhenotype() {
            const query =
                this.phenotypeQuery || "cleft palate [HP:0001250]";
            window.location.assign(
                `/krPhenotype.html?query=${encodeURIComponent(query)}`
            );
        },
    },
};
</script>

<style scoped>
.glens-page {
    padding: 2.8rem 2.5rem 3.4rem;
    background: linear-gradient(180deg, #f6f9ff 0%, #eef5ff 50%, #edf6f1 100%);
}

.glens-hero {
    max-width: 1280px;
    margin: 0 auto;
    padding: 2.3rem 2.45rem;
    border-radius: 1.75rem;
    background: rgba(255, 255, 255, 0.72);
    box-shadow: 0 24px 70px rgba(22, 32, 51, 0.08);
}

.glens-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
}

.glens-eyebrow,
.glens-mini-label,
.glens-label {
    margin: 0;
    color: #526276;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
}

.glens-title,
.glens-panel-title,
.glens-mini-title {
    margin: 0;
    color: #162033;
    font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    font-weight: 800;
}

.glens-title {
    margin-top: 0.35rem;
    font-size: 2rem;
}

.glens-badge,
.glens-panel-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.45rem 0.8rem;
    border-radius: 999px;
    background: #eef3fb;
    color: #526276;
    font-size: 0.82rem;
    font-weight: 700;
}

.glens-split {
    overflow: hidden;
    border-radius: 1.5rem;
    background: rgba(255, 255, 255, 0.65);
}

.glens-panel {
    min-height: 32rem;
    padding: 2.55rem 2.25rem 2.55rem 3.45rem;
}

.glens-panel--variant {
    border-right: 1px solid rgba(203, 213, 225, 0.45);
    background: linear-gradient(160deg, rgba(232, 240, 255, 0.92), rgba(247, 249, 255, 0.96));
}

.glens-panel--phenotype {
    background: linear-gradient(160deg, rgba(236, 247, 241, 0.96), rgba(249, 252, 250, 0.98));
}

.glens-panel-badge {
    margin-bottom: 1.5rem;
    background: rgba(255, 255, 255, 0.82);
    color: #0d4d91;
}

.glens-panel-badge--green {
    color: #3f715b;
}

.glens-panel-title {
    font-size: 2.1rem;
    line-height: 1.1;
}

.glens-panel-copy,
.glens-mini-copy {
    color: #526276;
}

.glens-panel-copy {
    margin: 1rem 0 0;
    max-width: 38rem;
    font-size: 1rem;
    line-height: 1.7;
}

.glens-search {
    margin-top: 2rem;
}

.glens-search-shell {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: 0.75rem;
    padding: 0.65rem;
    border: 1px solid rgba(203, 213, 225, 0.5);
    border-radius: 1.25rem;
    background: #fff;
}

.glens-input {
    flex: 1 1 auto;
    padding: 0.9rem 1rem;
    border: 0;
    border-radius: 1rem;
    background: transparent;
    color: #162033;
    font-size: 1rem;
}

.glens-input:focus {
    outline: none;
    box-shadow: none;
}

.glens-button {
    padding: 0.9rem 1.2rem;
    border: 0;
    border-radius: 1rem;
    color: #fff;
    font-weight: 700;
}

.glens-button--primary {
    background: #0d4d91;
}

.glens-button--green {
    background: #3f715b;
}

.glens-mini-grid {
    margin-top: 2rem;
}

.glens-mini-card {
    height: 100%;
    padding: 1.25rem;
    border: 1px solid rgba(255, 255, 255, 0.75);
    border-radius: 1.25rem;
    background: rgba(255, 255, 255, 0.82);
}

.glens-mini-title {
    margin-top: 0.5rem;
    font-size: 1.1rem;
}

.glens-mini-copy {
    margin: 0.6rem 0 0;
    font-size: 0.92rem;
    line-height: 1.6;
}

@media (max-width: 991.98px) {
    .glens-panel--variant {
        border-right: 0;
        border-bottom: 1px solid rgba(203, 213, 225, 0.45);
    }
}

@media (max-width: 767.98px) {
    .glens-page {
        padding: 1.25rem 0.9rem 2rem;
    }

    .glens-hero {
        padding: 1.2rem;
    }

    .glens-topbar,
    .glens-search-shell {
        display: block;
    }

    .glens-badge {
        margin-top: 0.75rem;
    }

    .glens-button {
        width: 100%;
        margin-top: 0.75rem;
    }

    .glens-panel {
        padding: 1.6rem 1.2rem 1.6rem 1.7rem;
    }
}
</style>
