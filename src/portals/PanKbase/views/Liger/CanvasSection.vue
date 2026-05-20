<script>
// This file renders the interactive browser canvas, including both hierarchy
// and gene-program views, while delegating state and behavior to the parent.

export default {
    name: "LigerCanvasSection",

    props: {
        viewModel: {
            type: Object,
            required: true
        },
        registerCanvasApi: {
            type: Function,
            default: null
        }
    },

    mounted() {
        window.addEventListener("pointermove", this.handleBrowserCanvasPointerMove);
        window.addEventListener("pointerup", this.handleBrowserCanvasPointerUp);
        window.addEventListener("pointercancel", this.handleBrowserCanvasPointerUp);

        if (this.registerCanvasApi) {
            this.registerCanvasApi({
                fitAndCenterBrowserCanvas: this.fitAndCenterBrowserCanvas
            });
        }
    },

    beforeDestroy() {
        window.removeEventListener("pointermove", this.handleBrowserCanvasPointerMove);
        window.removeEventListener("pointerup", this.handleBrowserCanvasPointerUp);
        window.removeEventListener("pointercancel", this.handleBrowserCanvasPointerUp);

        if (this.viewModel.browserCanvasAnimationTimer) {
            clearTimeout(this.viewModel.browserCanvasAnimationTimer);
            this.viewModel.browserCanvasAnimationTimer = null;
        }

        if (this.registerCanvasApi) {
            this.registerCanvasApi(null);
        }
    },

    methods: {
        toggleGroupLabels(event) {
            this.viewModel.setGroupProgramsEnabled(!this.viewModel.groupProgramsEnabled);
            event?.currentTarget?.blur?.();
        },
        formatSharedContextScore(score) {
            const numericScore = Number(score);

            if (!Number.isFinite(numericScore)) {
                return score;
            }

            return numericScore.toFixed(3);
        },
        getSharedProgramRowMeta(programGroup) {
            if (this.viewModel.groupProgramsEnabled) {
                return programGroup.cellTypeCount;
            }

            return this.formatSharedContextScore(programGroup.contexts[0]?.score);
        },
        getSharedProgramRowMetaTitle(programGroup) {
            if (this.viewModel.groupProgramsEnabled) {
                return `${programGroup.cellTypeCount} cell type${programGroup.cellTypeCount === 1 ? "" : "s"}`;
            }

            return programGroup.contexts[0]?.scoreField || "";
        },
        getSharedProgramRowSubLabel(programGroup) {
            if (this.viewModel.groupProgramsEnabled) {
                return `${programGroup.datasetCount} tissues · ${programGroup.cellTypeCount} cell types`;
            }

            const context = programGroup.contexts[0] || {};
            return [context.datasetLabel, context.cellType].filter(Boolean).join(" · ");
        },
        getBrowserViewportElement() {
            return this.$el || null;
        },
        getBrowserContentElement() {
            return this.$el?.querySelector(".liger-browser-content") || null;
        },
        setBrowserCanvasAnimationState(isAnimating) {
            if (this.viewModel.browserCanvasAnimationTimer) {
                clearTimeout(this.viewModel.browserCanvasAnimationTimer);
                this.viewModel.browserCanvasAnimationTimer = null;
            }

            this.viewModel.browserCanvas = {
                ...this.viewModel.browserCanvas,
                isAnimating
            };

            if (isAnimating) {
                this.viewModel.browserCanvasAnimationTimer = setTimeout(() => {
                    this.viewModel.browserCanvas = {
                        ...this.viewModel.browserCanvas,
                        isAnimating: false
                    };
                    this.viewModel.browserCanvasAnimationTimer = null;
                }, 220);
            }
        },
        animateBrowserCanvasTo({ x, y, scale = this.viewModel.browserCanvas.scale }) {
            this.setBrowserCanvasAnimationState(true);
            this.viewModel.browserCanvas = {
                ...this.viewModel.browserCanvas,
                x,
                y,
                scale,
                isDragging: false,
                isAnimating: true
            };
        },
        isEventOverBrowserColumn(event) {
            return Boolean(event.target?.closest(".liger-browser-column"));
        },
        startBrowserCanvasPan(event) {
            if (event.button !== undefined && event.button !== 0) {
                return;
            }

            if (this.isEventOverBrowserColumn(event)) {
                return;
            }

            this.setBrowserCanvasAnimationState(false);
            this.viewModel.browserCanvas = {
                ...this.viewModel.browserCanvas,
                isDragging: true,
                startX: event.clientX,
                startY: event.clientY,
                originX: this.viewModel.browserCanvas.x,
                originY: this.viewModel.browserCanvas.y
            };
        },
        handleBrowserCanvasPointerMove(event) {
            if (!this.viewModel.browserCanvas.isDragging) {
                return;
            }

            this.viewModel.browserCanvas = {
                ...this.viewModel.browserCanvas,
                x: this.viewModel.browserCanvas.originX + (event.clientX - this.viewModel.browserCanvas.startX),
                y: this.viewModel.browserCanvas.originY + (event.clientY - this.viewModel.browserCanvas.startY)
            };
        },
        canScrollBrowserList(listElement, deltaY) {
            if (!listElement || listElement.scrollHeight <= listElement.clientHeight) {
                return false;
            }

            if (deltaY < 0) {
                return listElement.scrollTop > 0;
            }

            if (deltaY > 0) {
                return listElement.scrollTop + listElement.clientHeight < listElement.scrollHeight;
            }

            return false;
        },
        normalizeWheelDelta(deltaY) {
            const limitedDelta = Math.max(-120, Math.min(120, deltaY));
            return limitedDelta / 120;
        },
        handleBrowserCanvasWheel(event) {
            if (this.isEventOverBrowserColumn(event)) {
                return;
            }

            const scrollableList = event.target?.closest(".liger-browser-list");

            if (scrollableList && this.canScrollBrowserList(scrollableList, event.deltaY)) {
                return;
            }

            const viewportElement = this.getBrowserViewportElement();
            const contentElement = this.getBrowserContentElement();

            if (!viewportElement || !contentElement) {
                return;
            }

            event.preventDefault();

            const normalizedDelta = this.normalizeWheelDelta(event.deltaY);
            const zoomMultiplier = 1 - (normalizedDelta * 0.045);
            const nextScale = Math.min(2.25, Math.max(0.55, this.viewModel.browserCanvas.scale * zoomMultiplier));

            if (nextScale === this.viewModel.browserCanvas.scale) {
                return;
            }

            const viewportRect = viewportElement.getBoundingClientRect();
            const pointerX = event.clientX - viewportRect.left;
            const pointerY = event.clientY - viewportRect.top;
            const contentX = (pointerX - this.viewModel.browserCanvas.x) / this.viewModel.browserCanvas.scale;
            const contentY = (pointerY - this.viewModel.browserCanvas.y) / this.viewModel.browserCanvas.scale;

            this.viewModel.browserCanvas = {
                ...this.viewModel.browserCanvas,
                scale: nextScale,
                x: pointerX - (contentX * nextScale),
                y: pointerY - (contentY * nextScale),
                isAnimating: false
            };
        },
        handleBrowserCanvasPointerUp() {
            if (!this.viewModel.browserCanvas.isDragging) {
                return;
            }

            this.viewModel.browserCanvas = {
                ...this.viewModel.browserCanvas,
                isDragging: false
            };
        },
        fitAndCenterBrowserCanvas() {
            this.viewModel.$nextTick(() => {
                const viewportElement = this.getBrowserViewportElement();
                const contentElement = this.getBrowserContentElement();

                if (!viewportElement || !contentElement) {
                    return;
                }

                const contentWidth = contentElement.offsetWidth;
                const contentHeight = contentElement.offsetHeight;

                if (!contentWidth || !contentHeight) {
                    return;
                }

                const padding = 40;
                const availableWidth = Math.max(viewportElement.clientWidth - padding, 1);
                const availableHeight = Math.max(viewportElement.clientHeight - padding, 1);
                const fittedScale = Math.min(1.15, availableWidth / contentWidth, availableHeight / contentHeight);

                this.animateBrowserCanvasTo({
                    x: (viewportElement.clientWidth - (contentWidth * fittedScale)) / 2,
                    y: (viewportElement.clientHeight - (contentHeight * fittedScale)) / 2,
                    scale: fittedScale
                });
            });
        }
    }
};
</script>

<template>
    <div
        class="liger-browser-viewport"
        :class="{
            'is-dragging': viewModel.browserCanvas.isDragging,
            'is-animating': viewModel.browserCanvas.isAnimating
        }"
        @pointerdown="startBrowserCanvasPan($event)"
        @wheel="handleBrowserCanvasWheel($event)"
    >
        <button
            class="liger-browser-fit-button"
            type="button"
            aria-label="Fit and center view"
            title="Fit and center view"
            @pointerdown.stop
            @click.stop="fitAndCenterBrowserCanvas()"
        >
            ⌖
        </button>

        <div
            class="liger-browser-columns"
            :style="{
                transform: `translate(${viewModel.browserCanvas.x}px, ${viewModel.browserCanvas.y}px)`
            }"
        >
            <div
                class="liger-browser-content"
                :style="{
                    transform: `scale(${viewModel.browserCanvas.scale})`
                }"
            >
                <template v-if="viewModel.browserMode === 'hierarchy'">
                    <div class="liger-browser-column is-search">
                        <div class="liger-browser-column-header">
                            <span class="liger-entity-badge is-search">
                                {{ viewModel.searchType === "gene" ? "Gene" : "Trait" }}
                            </span>
                        </div>
                        <div class="liger-browser-list">
                            <button
                                class="liger-browser-item"
                                :class="{ 'is-active': viewModel.isHierarchyItemActive('searchRoot') }"
                                type="button"
                                @click="viewModel.selectHierarchyItem('searchRoot')"
                            >
                                <span class="liger-browser-item-label">{{ viewModel.getSearchRootDisplayValue() }}</span>
                            </button>
                        </div>
                    </div>

                    <div class="liger-browser-column is-dataset">
                        <div class="liger-browser-column-header">
                            <span class="liger-entity-badge is-dataset">Tissue</span>
                        </div>
                        <div class="liger-browser-list">
                            <button
                                v-for="datasetGroup in viewModel.searchHierarchy"
                                :key="datasetGroup.dataset"
                                class="liger-browser-item"
                                :class="{ 'is-active': viewModel.isHierarchyItemActive('dataset', datasetGroup.dataset) }"
                                type="button"
                                @click="viewModel.selectHierarchyItem('dataset', { dataset: datasetGroup.dataset })"
                            >
                                <span class="liger-browser-item-copy">
                                    <span class="liger-browser-item-label">{{ viewModel.getDatasetDisplayLabel(datasetGroup.dataset) }}</span>
                                    <span class="liger-browser-item-sublabel">{{ viewModel.getDatasetDisplaySubLabel(datasetGroup.dataset) }}</span>
                                </span>
                                <span class="liger-browser-item-meta">{{ datasetGroup.cellTypes.length }}</span>
                                <span class="liger-browser-item-chevron">›</span>
                            </button>
                        </div>
                    </div>

                    <div
                        v-if="viewModel.getActiveDatasetGroup()"
                        class="liger-browser-column is-cell-type"
                    >
                        <div class="liger-browser-column-header">
                            <span class="liger-entity-badge is-cell-type">Cell Type</span>
                        </div>
                        <div class="liger-browser-list">
                            <button
                                v-for="cellTypeGroup in viewModel.getActiveDatasetGroup().cellTypes"
                                :key="`${viewModel.getActiveDatasetGroup().dataset}-${cellTypeGroup.cellType}`"
                                class="liger-browser-item"
                                :class="{ 'is-active': viewModel.isHierarchyItemActive('cellType', cellTypeGroup.cellType, { dataset: viewModel.getActiveDatasetGroup().dataset }) }"
                                type="button"
                                @click="viewModel.selectHierarchyItem('cellType', {
                                    dataset: viewModel.getActiveDatasetGroup().dataset,
                                    cellType: cellTypeGroup.cellType
                                })"
                            >
                                <span class="liger-browser-item-label">{{ cellTypeGroup.cellType }}</span>
                                <span class="liger-browser-item-meta">{{ cellTypeGroup.models.length }}</span>
                                <span class="liger-browser-item-chevron">›</span>
                            </button>
                        </div>
                    </div>

                    <div
                        v-if="viewModel.getActiveModelGroup()"
                        class="liger-browser-column is-factor"
                    >
                        <div class="liger-browser-column-header">
                            <span class="liger-entity-badge is-factor">Gene Program</span>
                        </div>

                        <div
                            v-if="viewModel.isModelFactorLoading(
                                viewModel.activeHierarchyPath.dataset,
                                viewModel.activeHierarchyPath.cellType,
                                viewModel.activeHierarchyPath.model
                            )"
                            class="liger-browser-status"
                        >
                            Loading gene programs...
                        </div>

                        <div
                            v-else
                            class="liger-browser-list"
                        >
                            <button
                                v-for="factorGroup in viewModel.getActiveModelGroup().factors"
                                :key="`${viewModel.activeHierarchyPath.dataset}-${viewModel.activeHierarchyPath.cellType}-${viewModel.activeHierarchyPath.model}-${factorGroup.factor}`"
                                class="liger-browser-item is-leaf"
                                :class="{
                                    'is-active': viewModel.factorModalData
                                        && viewModel.factorModalData.dataset === viewModel.activeHierarchyPath.dataset
                                        && viewModel.factorModalData.cellType === viewModel.activeHierarchyPath.cellType
                                        && viewModel.factorModalData.model === viewModel.activeHierarchyPath.model
                                        && viewModel.factorModalData.factor === factorGroup.factor
                                }"
                                type="button"
                                @click="viewModel.openFactorModal({
                                    dataset: viewModel.activeHierarchyPath.dataset,
                                    cellType: viewModel.activeHierarchyPath.cellType,
                                    model: viewModel.activeHierarchyPath.model,
                                    factor: factorGroup.factor,
                                    score: factorGroup.score,
                                    scoreField: factorGroup.scoreField
                                })"
                            >
                                <span class="liger-browser-item-copy">
                                    <span
                                        class="liger-browser-item-label"
                                        :title="viewModel.getFactorSummary(
                                            viewModel.activeHierarchyPath.dataset,
                                            viewModel.activeHierarchyPath.cellType,
                                            viewModel.activeHierarchyPath.model,
                                            factorGroup.factor
                                        )?.label || factorGroup.factor"
                                    >
                                        {{ viewModel.getFactorSummary(
                                            viewModel.activeHierarchyPath.dataset,
                                            viewModel.activeHierarchyPath.cellType,
                                            viewModel.activeHierarchyPath.model,
                                            factorGroup.factor
                                        )?.label || factorGroup.factor }}
                                    </span>
                                </span>
                                <span class="liger-browser-item-chevron">↗</span>
                            </button>
                        </div>
                    </div>
                </template>

                <template v-else>
                    <div class="liger-browser-column is-search">
                        <div class="liger-browser-column-header">
                            <span class="liger-entity-badge is-search">
                                {{ viewModel.searchType === "gene" ? "Gene" : "Trait" }}
                            </span>
                        </div>
                        <div class="liger-browser-list">
                            <button
                                class="liger-browser-item"
                                :class="{ 'is-active': viewModel.isSharedSearchRootActive() }"
                                type="button"
                                @click="viewModel.selectHierarchyItem('searchRoot')"
                            >
                                <span class="liger-browser-item-label">{{ viewModel.getSearchRootDisplayValue() }}</span>
                            </button>
                        </div>
                    </div>

                    <div class="liger-browser-column is-factor is-shared-programs">
                        <div class="liger-browser-column-header">
                            <span class="liger-entity-badge is-factor">Gene Programs</span>
                            <div
                                v-if="!viewModel.sharedProgramsLoading"
                                class="liger-browser-toggle-group"
                                role="group"
                                aria-label="Group labels"
                            >
                                <div class="liger-browser-tooltip-wrap">
                                    <button
                                        class="liger-browser-toggle"
                                        :class="{ 'is-active': viewModel.groupProgramsEnabled }"
                                        type="button"
                                        :aria-pressed="viewModel.groupProgramsEnabled ? 'true' : 'false'"
                                        aria-describedby="liger-group-labels-tooltip"
                                        @click="toggleGroupLabels($event)"
                                    >
                                        Group Labels
                                    </button>
                                    <div
                                        id="liger-group-labels-tooltip"
                                        class="liger-browser-tooltip"
                                        role="tooltip"
                                    >
                                        Toggle to group matching gene program labels.
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div
                            v-if="viewModel.sharedProgramsLoading"
                            class="liger-browser-status"
                        >
                            Loading gene program labels...
                        </div>

                        <div
                            v-else-if="viewModel.sharedProgramGroups.length"
                            class="liger-browser-list"
                        >
                            <button
                                v-for="programGroup in viewModel.sharedProgramGroups"
                                :key="programGroup.key"
                                class="liger-browser-item"
                                :class="{ 'is-active': viewModel.isSharedProgramGroupActive(programGroup.key) }"
                                type="button"
                                @click="viewModel.selectSharedProgramGroup(programGroup.key)"
                            >
                                <span class="liger-browser-item-copy">
                                    <span class="liger-browser-item-label" :title="programGroup.label">
                                        {{ programGroup.label }}
                                    </span>
                                    <span class="liger-browser-item-sublabel">
                                        {{ getSharedProgramRowSubLabel(programGroup) }}
                                    </span>
                                </span>
                                <span class="liger-browser-item-meta" :title="getSharedProgramRowMetaTitle(programGroup)">
                                    {{ getSharedProgramRowMeta(programGroup) }}
                                </span>
                            </button>
                        </div>

                        <div v-else class="liger-browser-status">
                            No gene programs available for this result set.
                        </div>
                    </div>

                    <div
                        v-if="viewModel.activeSharedProgramGroup"
                        class="liger-browser-column is-model is-shared-contexts"
                    >
                        <div class="liger-browser-column-header">
                            <span class="liger-entity-badge is-associated-cell-type">Associated Cell Types</span>
                        </div>
                        <div class="liger-browser-list">
                            <button
                                v-for="context in viewModel.activeSharedProgramGroup.contexts"
                                :key="context.key"
                                class="liger-browser-item is-shared-context"
                                :class="{ 'is-active': viewModel.isSharedProgramContextActive(context.key) }"
                                type="button"
                                @click="viewModel.openSharedProgramContext(context)"
                            >
                                <span class="liger-browser-item-copy">
                                    <span class="liger-browser-item-label">
                                        {{ context.cellType }}
                                    </span>
                                    <span class="liger-browser-item-sublabel">
                                        {{ context.datasetLabel }}
                                    </span>
                                </span>
                                <span
                                    v-if="viewModel.groupProgramsEnabled"
                                    class="liger-browser-item-meta"
                                    :title="context.scoreField"
                                >
                                    {{ formatSharedContextScore(context.score) }}
                                </span>
                            </button>
                        </div>
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>
