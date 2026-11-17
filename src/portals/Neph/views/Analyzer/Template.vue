<template>
    <div>
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>

        <main class="container-fluid mdkp-body kr-page">
            <section class="kr-band kr-front-grid">
                <div>
                    <p class="kr-kicker">CRDC rare disease browser</p>
                    <h1>Search CRDC evidence first</h1>
                    <p class="kr-lede">
                        Start with a sample, phenotype profile, variant, or gene.
                        Internal cohort evidence is shown before reference support
                        and secondary annotation.
                    </p>
                </div>
                <div class="kr-context-panel">
                    <div class="kr-panel-title">{{ $parent.contextStatusLabel }}</div>
                    <b-form @submit.prevent="$parent.applyContext">
                        <b-form-input
                            v-model="$parent.contextInput"
                            placeholder="Optional HPO context, comma-separated"
                        ></b-form-input>
                        <div class="kr-inline-actions">
                            <b-button size="sm" type="submit" variant="primary">
                                Apply
                            </b-button>
                            <b-button size="sm" variant="outline-secondary" @click="$parent.clearContext">
                                Clear
                            </b-button>
                        </div>
                    </b-form>
                    <div class="kr-muted">{{ $parent.contextStatusText }}</div>
                </div>
            </section>

            <section class="card mdkp-card">
                <div class="card-body">
                    <h2 class="kr-section-title">Find Evidence</h2>
                    <b-form @submit.prevent="$parent.submitSearch">
                        <b-form-group label="Search type">
                            <b-form-radio-group
                                v-model="$parent.searchMode"
                                :options="$parent.searchModes.map(mode => ({ text: mode.label, value: mode.id }))"
                                buttons
                                button-variant="outline-primary"
                            ></b-form-radio-group>
                        </b-form-group>
                        <b-form-group :label="$parent.activeModeConfig.label">
                            <b-input-group>
                                <b-form-input
                                    v-model="$parent.query"
                                    :placeholder="$parent.activeModeConfig.placeholder"
                                ></b-form-input>
                                <b-input-group-append>
                                    <b-button variant="outline-secondary" @click="$parent.setExample">
                                        Example
                                    </b-button>
                                    <b-button
                                        type="submit"
                                        variant="primary"
                                        :disabled="$parent.searchLoading"
                                    >
                                        <span v-if="$parent.searchLoading">Searching...</span>
                                        <span v-else>Search</span>
                                    </b-button>
                                </b-input-group-append>
                            </b-input-group>
                            <div class="kr-muted mt-2">{{ $parent.activeModeConfig.helper }}</div>
                            <b-alert
                                v-if="$parent.searchError"
                                show
                                variant="danger"
                                class="mt-3 mb-0"
                            >
                                {{ $parent.searchError }}
                            </b-alert>
                        </b-form-group>
                    </b-form>
                </div>
            </section>
        </main>

        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
