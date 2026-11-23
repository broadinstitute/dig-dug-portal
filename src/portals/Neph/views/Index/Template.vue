<template>
    <div class="front-page-body">
        <!-- Header -->
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>

        <!-- Body -->
        <div v-if="$parent.diseaseGroup">
            <div class="fluid">
                <div
                    :class="
                        'front-top-banner-' +
                        $parent.diseaseGroup.name +
                        'kp front-top-banner'
                    "
                >
                    <div class="container">
                        <div class="row">
                            <div class="col-md-12">
                                <div class="front-logo-wrapper">
                                    <img
                                        class="front-logo-img"
                                        v-if="
                                            $parent.frontContents
                                                .field_front_logo
                                        "
                                        :src="
                                            'https://kp4cd.org/sites/default/files/vueportal/' +
                                            $parent.frontContents
                                                .field_front_logo
                                        "
                                    />
                                    <span
                                        :class="
                                            'front-logo-tagline front-logo-tagline-' +
                                            $parent.diseaseGroup.name +
                                            'kp'
                                        "
                                         v-html="
                                            $parent.frontContents.field_tagline
                                        "
                                        ></span
                                    >
                                </div>
                            </div>

                            <div class="col-md-12 portal-front-tabs">
                                <div class="front-gene-search-wrapper" @click="closeOverlays">
                                    <form class="fs-form" @submit.prevent="submitSearch" @click.stop>
                                        <div class="fs-input-box">
                                            <input
                                                id="front-search-input"
                                                ref="searchInput"
                                                v-model="query"
                                                class="fs-input"
                                                type="text"
                                                placeholder="Search a sample, gene, variant or phenotype"
                                                aria-label="Search"
                                                aria-describedby="front-search-hint"
                                                aria-autocomplete="list"
                                                aria-controls="front-search-suggestions"
                                                :aria-expanded="String(showSuggestions)"
                                                :aria-activedescendant="activeDescendant"
                                                autocomplete="off"
                                                autocapitalize="off"
                                                spellcheck="false"
                                                @input="handleInput"
                                                @focus="updateSuggestions"
                                                @blur="scheduleCloseSuggestions"
                                                @keydown="handleKeydown"
                                            />
                                            <ul v-if="showSuggestions" id="front-search-suggestions" class="fs-suggestions" role="listbox">
                                                <li v-for="(option, index) in visibleOptions" :key="`${option.kind}-${option.label}`">
                                                    <button
                                                        :id="`front-search-option-${index}`"
                                                        class="fs-option"
                                                        :class="{ active: index === activeOption }"
                                                        type="button"
                                                        role="option"
                                                        :aria-selected="String(index === activeOption)"
                                                        @mousedown.prevent
                                                        @click="selectOption(option)"
                                                    >
                                                        <span class="fs-kind">{{ option.kind }}</span>
                                                        <span>{{ option.label }} <small v-if="option.id">{{ option.id }}</small></span>
                                                    </button>
                                                </li>
                                            </ul>
                                        </div>
                                        <button class="fs-submit" type="submit" :disabled="frontSearchPending">Search</button>
                                        <button class="fs-help-button" type="button" aria-label="Show accepted search formats" :aria-expanded="String(helpOpen)" @click.stop="toggleHelp">?</button>
                                    </form>
                                    <p id="front-search-hint" class="fs-hint" aria-live="polite">{{ hint }}</p>
                                    <button v-if="frontHpoCountsStatus === 'error'" class="fs-retry" type="button" @click.stop="retryFrontHpoCounts">Retry phenotype availability</button>
                                    <div v-if="helpOpen" class="fs-format-help" role="tooltip" @click.stop>
                                        <strong>Accepted search formats</strong>
                                        <span>Sample · BCH-00-00000-00</span>
                                        <span>Gene · SLC6A7</span>
                                        <span>Variant · chr12:102912793:CA:C</span>
                                        <span>Phenotype · Progressive muscle weakness [HP:0003323]</span>
                                        <span>Separate multiple phenotypes with commas; all must match (AND).</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="container static-content-section">
                <div class="row">
                    <div class="col-md-7">
                        <about-portal-section
                            :front-contents="$parent.frontContents"
                        ></about-portal-section>
                        <datasets-section
                            :disease-group="$parent.diseaseGroup"
                            :disease-groups="
                                $store.state.bioPortal.diseaseGroups
                            "
                            :datasets-info="$store.state.kp4cd.datasetsInfo"
                        ></datasets-section>
                        <under-datasets-section
                            :front-contents="$parent.frontContents"
                        ></under-datasets-section>
                    </div>
                    <div class="col-md-5">
                        <news-feed-section
                            :disease-group="$parent.diseaseGroup"
                            :news-feed="$store.state.kp4cd.newsFeed"
                        ></news-feed-section>
                        <about-project-section
                            :front-contents="$parent.frontContents"
                        ></about-project-section>
                    </div>
                </div>
            </div>
        </div> 

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>

<script>
import { frontSearchMixin } from "./frontSearch";

export default {
    name: "IndexTemplate",
    mixins: [frontSearchMixin],
};
</script>

<style scoped>
.front-gene-search-wrapper { position: relative; width: 50%; min-width: 320px; margin: auto; }
.fs-form { display: flex; align-items: stretch; gap: 8px; }
.fs-input-box { position: relative; flex: 1 1 auto; min-width: 0; }
.fs-input { width: 100%; height: 50px; padding: 0 14px; font-size: 16px; background-color: rgba(255, 255, 255, 0.75); border: 1px solid #fff; border-radius: 4px; }
.fs-suggestions { position: absolute; z-index: 20; top: 100%; left: 0; right: 0; margin: 2px 0 0; padding: 4px 0; list-style: none; background: #fff; border: 1px solid #b8c4d6; border-radius: 4px; box-shadow: 0 6px 18px rgba(0, 0, 0, .15); text-align: left; }
.fs-option { display: flex; gap: 12px; align-items: baseline; width: 100%; padding: 8px 14px; border: 0; background: transparent; font-size: 17px; text-align: left; cursor: pointer; }
.fs-option:hover, .fs-option.active { background: #e8f0fb; }
.fs-option small { margin-left: 6px; color: #596d87; }
.fs-kind { flex: 0 0 90px; color: #0b66d8; font-size: 14px; font-weight: 600; text-transform: uppercase; }
.fs-submit { padding: 0 22px; border: 1px solid #fff; border-radius: 4px; background-color: rgba(255, 255, 255, 0.75); color: #666; font-size: 16px; }
.fs-help-button { width: 50px; border: 1px solid #fff; border-radius: 4px; background-color: rgba(255, 255, 255, 0.75); color: #666; font-weight: 700; }
.fs-hint { margin: 8px 0 0; color: #fff; font-size: 15px; text-align: left; }
.fs-retry { display: block; margin-top: 4px; padding: 0; border: 0; background: transparent; color: #fff; text-decoration: underline; }
.fs-format-help { position: absolute; z-index: 20; right: 0; display: flex; flex-direction: column; gap: 4px; margin-top: 4px; padding: 12px 14px; background: #fff; color: #20242a; border: 1px solid #b8c4d6; border-radius: 4px; box-shadow: 0 6px 18px rgba(0, 0, 0, .15); font-size: 15px; text-align: left; }
</style>
