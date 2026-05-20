<script>
import SearchSection from "./SearchSection.vue";
import CanvasSection from "./CanvasSection.vue";
import DetailsSection from "./DetailsSection.vue";

export default {
    name: "LigerTemplate",

    components: {
        SearchSection,
        CanvasSection,
        DetailsSection
    }
};
</script>

<template>
    <div class="pkb-wrapper f-col fill-height align-h-center">
        <!-- NAV -->
        <pkb-header></pkb-header>
        <!-- BODY -->
        <div class="pkb-body">
            <div class="liger-page">
                <SearchSection :view-model="$parent">
                    <template v-slot:results>
                        <CanvasSection
                            :view-model="$parent"
                            :register-canvas-api="$parent.registerCanvasSectionApi"
                        />
                        <DetailsSection
                            :view-model="$parent"
                            :register-details-api="$parent.registerDetailsSectionApi"
                        />
                    </template>
                </SearchSection>
            </div>
        </div>
        <!-- FOOTER -->
        <pkb-footer></pkb-footer>
    </div>
</template>

<style>
.liger-page {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 24px;
}

.liger-controls {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.liger-mode-group {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.liger-search-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.liger-suggestion-list {
    display: flex;
    flex-direction: column;
    gap: 1px;
    border: 1px solid #d9d9d9;
    background: #d9d9d9;
}

.liger-mode-button,
.liger-suggestion-button,
.liger-input {
    padding: 10px 12px;
    border: 1px solid #d9d9d9;
    background: #ffffff;
    color: #111111;
    font: inherit;
}

.liger-mode-button,
.liger-suggestion-button {
    cursor: pointer;
}

.liger-mode-button.is-active {
    border-color: #111111;
}

.liger-suggestion-button {
    border: 0;
    text-align: left;
}

.liger-status {
    padding: 10px 12px;
    border: 1px solid #d9d9d9;
}

.liger-results-tree {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px 16px;
    border: 1px solid #d9d9d9;
    background: #fcfcfc;
}

.liger-results-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    padding: 0 0 10px 0;
    border-bottom: 1px solid #e6e6e6;
}

.liger-results-legend {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
}

.liger-browser-mode-group {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
}

.liger-browser-mode-wrap {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
}

.liger-browser-mode-button {
    padding: 3px 8px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.02em;
    line-height: 1.2;
}

.liger-results-legend-title {
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.03em;
    text-transform: uppercase;
}

.liger-results-legend-items {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.liger-browser-columns {
    position: absolute;
    top: 0;
    left: 0;
    width: max-content;
    will-change: transform;
}

.liger-browser-content {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    width: max-content;
    transform-origin: top left;
    will-change: transform;
}

.liger-browser-viewport.is-animating .liger-browser-columns,
.liger-browser-viewport.is-animating .liger-browser-content {
    transition: transform 180ms ease;
}

.liger-browser-viewport {
    position: relative;
    overflow: hidden;
    min-height: 452px;
    border-radius: 18px;
    cursor: grab;
    touch-action: none;
    user-select: none;
}

.liger-browser-fit-button {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 2;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: 34px;
    height: 34px;
    padding: 0 0 3px 0;
    border: 1px solid #d9d9d9;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.92);
    color: #333333;
    font: inherit;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(17, 17, 17, 0.08);
}

.liger-browser-fit-button:hover {
    background: #ffffff;
    color: #111111;
}

.liger-browser-viewport.is-dragging {
    cursor: grabbing;
}

.liger-browser-column {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: min(240px, 100%);
    min-width: 200px;
    padding: 10px;
    border: 1px solid #d9d9d9;
    border-radius: 14px;
    background: #ffffff;
    box-shadow: 0 6px 18px rgba(17, 17, 17, 0.06);
}

.liger-browser-column.is-shared-programs {
    width: min(320px, 100%);
    min-width: 280px;
}

.liger-browser-column.is-shared-contexts {
    width: min(320px, 100%);
    min-width: 280px;
}

.liger-browser-column-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 26px;
}

.liger-browser-toggle-group {
    display: inline-flex;
    align-items: center;
    margin-left: auto;
    white-space: nowrap;
}

.liger-browser-tooltip-wrap {
    position: relative;
    display: inline-flex;
}

.liger-browser-toggle {
    border: 1px solid #d9d9d9;
    border-radius: 999px;
    background: #ffffff;
    color: #111111;
    font: inherit;
    font-size: 11px;
    font-weight: 600;
    min-width: 44px;
    padding: 3px 10px;
    cursor: pointer;
    white-space: nowrap;
    transition: background-color 140ms ease, border-color 140ms ease, color 140ms ease, box-shadow 140ms ease;
}

.liger-browser-toggle.is-active {
    border-color: #111111;
    box-shadow: none;
}

.liger-browser-toggle:not(.is-active) {
    border-color: #d9d9d9;
}

.liger-browser-tooltip {
    position: absolute;
    right: 0;
    top: calc(100% + 8px);
    z-index: 4;
    width: 220px;
    padding: 8px 10px;
    border-radius: 10px;
    background: rgba(17, 17, 17, 0.94);
    color: #ffffff;
    font-size: 11px;
    font-weight: 500;
    line-height: 1.35;
    white-space: normal;
    box-shadow: 0 8px 22px rgba(17, 17, 17, 0.18);
    opacity: 0;
    pointer-events: none;
    transform: translateY(-4px);
    transition: opacity 80ms ease, transform 80ms ease;
}

.liger-browser-tooltip-wrap:hover .liger-browser-tooltip,
.liger-browser-tooltip-wrap:focus-within .liger-browser-tooltip {
    opacity: 1;
    transform: translateY(0);
}

.liger-browser-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-height: 420px;
    overflow: auto;
    user-select: none;
}

.liger-browser-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 10px;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: #111111;
    font: inherit;
    cursor: pointer;
    text-align: left;
}

.liger-browser-item-copy {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1 1 auto;
    gap: 1px;
}

.liger-browser-item:hover {
    background: #f4f6f8;
}

.liger-browser-item.is-active {
    background: #eaf2ff;
    color: #144aa0;
}

.liger-browser-item.is-leaf:hover {
    background: #f7f3ff;
    color: #5e2fa0;
}

.liger-browser-column.is-dataset .liger-browser-item.is-active {
    background: #e7f0ff;
    color: #2158b6;
}

.liger-browser-column.is-search .liger-browser-item.is-active {
    background: #eef0f3;
    color: #4b5563;
}

.liger-browser-column.is-cell-type .liger-browser-item.is-active {
    background: #e8f7ef;
    color: #22784e;
}

.liger-browser-column.is-model .liger-browser-item.is-active {
    background: #fff3df;
    color: #9a5a00;
}

.liger-browser-column.is-shared-contexts .liger-browser-item.is-active {
    background: #e8f7ef;
    color: #22784e;
}

.liger-browser-column.is-factor .liger-browser-item.is-active,
.liger-browser-item.is-leaf.is-active {
    background: #f1e8ff;
    color: #5e2fa0;
}

.liger-browser-column.is-factor .liger-browser-item-label {
    white-space: normal;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-height: 1.2;
}

.liger-browser-item-label {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1 1 auto;
}

.liger-browser-item-sublabel {
    min-width: 0;
    color: #777777;
    font-size: 11px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.liger-browser-item-meta {
    color: #666666;
    font-size: 12px;
    white-space: nowrap;
}

.liger-browser-item.is-shared-context {
    align-items: flex-start;
}

.liger-browser-item.is-shared-context .liger-browser-item-meta {
    max-width: 88px;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: right;
}

.liger-browser-status {
    padding: 8px 10px;
    color: #666666;
    font-size: 13px;
}

.liger-detail-accordion {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.liger-detail-accordion-item {
    display: flex;
    flex-direction: column;
    gap: 0;
    border: 1px solid #d9d9d9;
    border-radius: 14px;
    background: #ffffff;
    overflow: hidden;
}

.liger-detail-accordion-toggle {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 4px 6px;
    border: 0;
    border-radius: 0;
    background: transparent;
    color: #111111;
    font: inherit;
    cursor: pointer;
    text-align: left;
}

.liger-detail-accordion-item.is-active .liger-detail-accordion-toggle {
    border-bottom: 1px solid #ececec;
}

.liger-detail-accordion-item.is-search.is-active .liger-detail-accordion-toggle {
    background: #eef0f3;
    color: #4b5563;
}

.liger-detail-accordion-item.is-dataset.is-active .liger-detail-accordion-toggle {
    background: #e7f0ff;
    color: #2158b6;
}

.liger-detail-accordion-item.is-cell-type.is-active .liger-detail-accordion-toggle {
    background: #e8f7ef;
    color: #22784e;
}

.liger-detail-accordion-item.is-model.is-active .liger-detail-accordion-toggle {
    background: #fff3df;
    color: #9a5a00;
}

.liger-detail-accordion-item.is-factor.is-active .liger-detail-accordion-toggle {
    background: #f4ebff;
    color: #6f35b2;
}

.liger-detail-accordion-item.is-active .liger-detail-accordion-value {
    color: #111111;
}

.liger-detail-accordion-title {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
}

.liger-detail-accordion-value {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 600;
}

.liger-detail-accordion-indicator {
    color: #666666;
    font-weight: 600;
}

.liger-detail-panel {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 15px 20px;
    border: 0;
    border-radius: 0;
    background: transparent;
}

.liger-detail-panel-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
}

.liger-detail-panel-title-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.liger-detail-panel-kicker {
    color: #666666;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}

.liger-detail-panel-title {
    font-size: 15px;
    font-weight: 600;
    line-height: 1.25;
}

.liger-detail-panel-close {
    padding: 4px 8px;
    border: 1px solid #d9d9d9;
    border-radius: 10px;
    background: #ffffff;
    color: #111111;
    font: inherit;
    cursor: pointer;
}

.liger-detail-panel-meta {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 6px;
}

.liger-detail-panel-meta > div {
    display: flex;
    flex-direction: column;
    padding: 6px 8px;
    border: 1px solid #ebebeb;
    border-radius: 12px;
    background: #fafafa;
    min-width: 0;
}

.liger-detail-meta-label {
    color: #666666;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.03em;
    text-transform: uppercase;
}

.liger-detail-panel-section {
    display: flex;
    flex-direction: column;
    gap: 0px;
    min-width: 0;
}

.liger-detail-panel-columns {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
}

.liger-detail-panel-section-title {
    font-weight: 600;
    font-size: 13px;
}

.liger-detail-panel-section-count {
    color: #666666;
    font-weight: 500;
}

.liger-detail-panel-loading {
    color: #666666;
    font-size: 13px;
}

.liger-detail-placeholder {
    color: #666666;
    font-size: 13px;
}

.liger-detail-panel-dataset {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.liger-detail-panel-split {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.liger-detail-panel-main,
.liger-detail-panel-side {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.liger-detail-panel-meta-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 8px;
}

.liger-detail-panel-meta-pair {
    grid-template-columns: 1fr;
}

.liger-detail-rich-text {
    color: #333333;
    font-size: 13px;
    line-height: 1.4;
    word-break: break-word;
    overflow: hidden;
}

.liger-detail-meta-value,
.liger-detail-meta-link {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.liger-detail-meta-link {
    color: #2158b6;
    text-decoration: none;
}

.liger-detail-meta-link:hover {
    text-decoration: underline;
}

.liger-detail-list {
    display: flex;
    flex-direction: column;
    gap: 3px;
    max-height: 180px;
    overflow: auto;
}

.liger-detail-list-header,
.liger-detail-list-item {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    padding: 5px 8px;
}

.liger-detail-list-header {
    position: sticky;
    top: 0;
    z-index: 1;
    border-bottom: 1px solid #ececec;
    background: #ffffff;
    color: #666666;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.03em;
    text-transform: uppercase;
}

.liger-detail-list-item {
    border: 1px solid #ececec;
    border-radius: 8px;
    background: #fafafa;
    font-size: 13px;
    line-height: 1.2;
}

.liger-detail-list-item-label {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.liger-detail-list-item-value {
    color: #666666;
    font-size: 12px;
    white-space: nowrap;
}

.liger-entity-badge {
    display: inline-flex;
    align-items: center;
    padding: 3px 8px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.02em;
    white-space: nowrap;
}

.liger-entity-badge.is-dataset {
    background: #e7f0ff;
    color: #2158b6;
}

.liger-entity-badge.is-search {
    background: #eef0f3;
    color: #4b5563;
}

.liger-entity-badge.is-cell-type {
    background: #e8f7ef;
    color: #22784e;
}

.liger-entity-badge.is-associated-cell-type {
    background: #e8f7ef;
    color: #22784e;
}

.liger-entity-badge.is-model {
    background: #fff3df;
    color: #9a5a00;
}

.liger-entity-badge.is-factor {
    background: #f4ebff;
    color: #6f35b2;
}

.liger-pill-list {
    display: flex;
    gap: 8px;
}

.liger-pill-list {
    flex-direction: row;
    flex-wrap: wrap;
}

.liger-pill {
    padding: 6px 8px;
    border: 1px solid #d9d9d9;
}

@media (max-width: 880px) {
    .liger-results-toolbar {
        flex-direction: column;
        align-items: stretch;
    }

    .liger-browser-mode-wrap {
        align-items: flex-start;
    }

    .liger-browser-mode-group {
        justify-content: flex-start;
    }

    .liger-browser-column-header {
        align-items: flex-start;
        flex-direction: column;
    }
}
</style>
