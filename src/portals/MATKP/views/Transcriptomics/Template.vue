<template>
  <div class="matkp transcriptomic-prototype">
    <div class="f-col fill-height">
      <matkp-nav :showSearch="false"></matkp-nav>

      <div class="mat-body">
        <div class="prototype-page f-col">
          <div class="hero-panel f-col">
            <div class="hero-row f-row">
              <div class="hero-copy f-col">
                <h2>Cross-study transcriptomic evidence</h2>
                <div style="font-size: 16px;">
                  Search a gene to explore differential expression across curated bulk RNA-seq studies in humans and mice.<br/>
                  See results grouped by biological outcomes, summarized across studies using meta-analysis.
                </div>
              </div>

              
            </div>
          </div>

          <div v-if="$parent.showGeneResults" class="gene-bar">
            <div class="hero-controls f-col">
              <div class="gene-search-header f-row">
                <label
                  for="gene-search"
                  class="gene-bar__label"
                  >Search Gene (human or mouse)</label
                >
              </div>
              <div class="gene-search-row">
                <input
                  id="gene-search"
                  v-model="$parent.geneQuery"
                  type="text"
                  :placeholder="$parent.geneSearchPlaceholder"
                  @keydown.enter.prevent="$parent.loadGene()"
                />
                <button
                  type="button"
                  class="action-button"
                  :disabled="$parent.geneLoading"
                  @click="$parent.loadGene()"
                >
                  Search
                </button>
              </div>
              <div class="gene-search-examples helper-copy">
                Try
                <span
                  v-for="(item, index) in $parent.geneExamples"
                  :key="item.gene"
                  class="demo-gene"
                  @click="$parent.geneQuery = item.gene; $parent.loadGene()"
                  >{{ item.label }}<span
                    v-if="index < $parent.geneExamples.length - 1"
                    > </span
                  ></span
                >
              </div>
            </div>
            <div class="gene-bar__group">
              <div class="gene-bar__label">Result by species</div>
              <div
                v-if="!$parent.geneNotFound && !$parent.geneLoading && $parent.activeGene"
                class="species-toggle"
              >
                <button
                  type="button"
                  class="species-toggle__btn"
                  :class="{ 'species-toggle__btn--active': $parent.viewSpecies === 'human' }"
                  @click="$parent.setViewSpecies('human')"
                >Human<span v-if="$parent.geneOrthologSymbols.human" class="species-toggle__symbol"> {{ $parent.geneOrthologSymbols.human }}</span></button>
                <button
                  type="button"
                  class="species-toggle__btn"
                  :class="{ 'species-toggle__btn--active': $parent.viewSpecies === 'mouse' }"
                  @click="$parent.setViewSpecies('mouse')"
                >Mouse<span v-if="$parent.geneOrthologSymbols.mouse" class="species-toggle__symbol"> {{ $parent.geneOrthologSymbols.mouse }}</span></button>
              </div>
            </div>

            <div v-if="!$parent.geneNotFound && !$parent.geneLoading && $parent.activeGene" class="gene-bar__group">
              <div class="gene-bar__label">Filter data</div>
              <div class="gene-bar__filters">
                <div class="filter-section">
                  <div class="filter-section__header">
                    <span class="filter-section__name">Datasets</span>
                    <span class="filter-badge" :class="{ 'filter-badge--active': $parent.isDatasetFilterActive() }">{{ $parent.datasetFilterBadge() }}</span>
                  </div>
                  <div class="filter-flyout">
                    <label class="filter-option filter-option--select-all">
                      <input
                        type="checkbox"
                        :checked="$parent.areAllDatasetsSelected()"
                        :indeterminate.prop="$parent.isDatasetFilterIndeterminate()"
                        @change="$parent.setAllDatasetFilters($event.target.checked)"
                      />
                      <span>Select all</span>
                    </label>
                    <label
                      v-for="dataset in $parent.datasetOptions"
                      :key="dataset.id"
                      class="filter-option"
                    >
                      <input
                        type="checkbox"
                        :checked="$parent.datasetFilters[dataset.id]"
                        @change="$parent.setDatasetFilter(dataset.id, $event.target.checked)"
                      />
                      <span>{{ dataset.label }}</span>
                    </label>
                  </div>
                </div>

                <div class="filter-section">
                  <div class="filter-section__header">
                    <span class="filter-section__name">Depot</span>
                    <span class="filter-badge" :class="{ 'filter-badge--active': $parent.isDepotFilterActive() }">{{ $parent.depotFilterBadge() }}</span>
                  </div>
                  <div class="filter-flyout">
                    <label class="filter-option filter-option--select-all">
                      <input
                        type="checkbox"
                        :checked="$parent.areAllDepotsSelected()"
                        :indeterminate.prop="$parent.isDepotFilterIndeterminate()"
                        @change="$parent.setAllDepotFilters($event.target.checked)"
                      />
                      <span>Select all</span>
                    </label>
                    <label
                      v-for="depot in $parent.depotOptions"
                      :key="depot.id"
                      class="filter-option"
                    >
                      <input
                        type="checkbox"
                        :checked="$parent.depotFilters[depot.id]"
                        @change="$parent.setDepotFilter(depot.id, $event.target.checked)"
                      />
                      <span>{{ depot.label }}</span>
                    </label>
                  </div>
                </div>

                <div class="filter-section">
                  <div class="filter-section__header">
                    <span class="filter-section__name">Adj. P-value</span>
                    <span class="filter-badge" :class="{ 'filter-badge--active': $parent.isAdjPFilterActive() }">{{ $parent.isAdjPFilterActive() ? '≤ ' + $parent.adjPValueMax : '—' }}</span>
                  </div>
                  <div class="filter-flyout filter-flyout--input">
                    <label class="filter-option-label" for="adj-p-value-filter">Max adj. P-value</label>
                    <input
                      id="adj-p-value-filter"
                      v-model="$parent.adjPValueInput"
                      class="filter-section__input"
                      type="number"
                      min="0"
                      max="1"
                      step="0.001"
                      placeholder="e.g. 0.05"
                      @keydown.enter.prevent="$parent.applyAdjPFilter()"
                      @blur="$parent.applyAdjPFilter()"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="$parent.showGeneResults" class="content-grid">
            <div class="sticky-rail f-col">
              <div class="rail-card rail-card--sticky f-col">
                <div class="outcomes-list">
                  <div class="outcomes-group-title">
                    Outcomes
                    <span class="outcomes-species-indicator">
                      <button class="outcomes-species-btn" :class="{ 'outcomes-species--dimmed': $parent.viewSpecies !== 'human' }" @click="$parent.setViewSpecies('human')">Human</button>
                      <button class="outcomes-species-btn" :class="{ 'outcomes-species--dimmed': $parent.viewSpecies !== 'mouse' }" @click="$parent.setViewSpecies('mouse')">Mouse</button>
                    </span>
                  </div>

                  <div class="outcomes-nav">
                    <button
                      v-for="outcome in $parent.outcomes"
                      :key="outcome.outcome_id"
                      class="outcome-nav-item"
                      :class="{
                        'outcome-nav-item--active': $parent.isOutcomeInFocus(outcome.outcome_id),
                        'outcome-nav-item--dimmed': !outcome.hasFilteredData,
                      }"
                      @click="$parent.navigateToOutcome(outcome)"
                    >{{ outcome.outcome_label }}</button>
                  </div>
                </div>
              </div>

              
            </div>

            <div class="sections-column f-col">
              <div
                v-if="$parent.geneNotFound"
                class="no-gene-data-panel"
              >
                No data found
              </div>
              <section
                v-for="outcome in $parent.outcomes"
                v-show="
                  !$parent.geneNotFound &&
                  $parent.isOutcomeSectionVisible(outcome.outcome_id)
                "
                :key="outcome.outcome_id"
                class="outcome-section f-col"
                :data-outcome-id="outcome.outcome_id"
              >
                <div class="section-header f-row">
                  <div class="f-row section-heading">
                    <div class="section-title">
                      <span class="section-title__label">{{
                        outcome.outcome_label
                      }}</span>
                      <small
                        v-if="outcome.contrast_label"
                        class="section-title__contrast"
                        >({{ outcome.contrast_label }})</small
                      >
                    </div>
                    <div v-if="outcome.supportsVolcano" class="plot-view-toggle">
                      <button
                        type="button"
                        class="plot-view-btn"
                        :class="{ 'plot-view-btn--active': $parent.getPlotView(outcome.outcome_id) === 'forest' }"
                        @click="$parent.setPlotView(outcome.outcome_id, 'forest')"
                      >Forest</button>
                      <button
                        type="button"
                        class="plot-view-btn"
                        :class="{ 'plot-view-btn--active': $parent.getPlotView(outcome.outcome_id) === 'volcano' }"
                        @click="$parent.setPlotView(outcome.outcome_id, 'volcano')"
                      >Volcano</button>
                    </div>
                  </div>
                  <div class="section-header-meta f-col">
                    <div v-if="!outcome.supportsVolcano || $parent.getPlotView(outcome.outcome_id) === 'forest'" class="plot-legend f-col">
                      <div class="f-row legend-row">
                        <div class="legend-item f-row">
                          <span class="legend-dot"></span>
                          <span>effect size</span>
                        </div>
                        <div class="legend-item f-row">
                          <span class="legend-line"></span>
                          <span>95% CI</span>
                        </div>
                      </div>
                      <template v-if="outcome.pooledEffectLeft !== null">
                        <div class="f-row legend-row">
                          <div class="legend-item f-row">
                            <span class="legend-dot legend-dot--pooled"></span>
                            <span>pooled effect size</span>
                          </div>
                          <div class="legend-item f-row">
                            <span class="legend-ref-line"></span>
                            <span>pooled ref line</span>
                          </div>
                        </div>
                        <div class="f-row legend-row">
                          <div class="legend-item f-row">
                            <span><span class="legend-stars">*</span>&ensp;p&lt;0.05&ensp;<span class="legend-stars">**</span>&ensp;p&lt;0.01&ensp;<span class="legend-stars">***</span>&ensp;p&lt;0.001</span>
                          </div>
                          pooled significance
                        </div>
                      </template>
                    </div>
                    <div v-else class="plot-legend f-col">
                      <div class="f-row legend-row">
                        <div class="legend-item f-row">
                          <span class="legend-dot" style="background:#ff6c02"></span>
                          <span>p ≤ 0.05</span>
                        </div>
                        <div class="legend-item f-row">
                          <span class="legend-dot" style="background:#bbbbbb; opacity:0.55"></span>
                          <span>p > 0.05</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="plot-card f-col">
                  <template v-if="!outcome.supportsVolcano || $parent.getPlotView(outcome.outcome_id) === 'forest'">
                    <div
                      v-if="outcome.axis_labels.left || outcome.axis_labels.right"
                      class="plot-scale-row"
                    >
                      <div></div>
                      <div class="plot-direction-bar">
                        <span
                          v-if="outcome.axis_labels.left"
                          class="plot-direction-left"
                        >← {{ outcome.axis_labels.left }}</span>
                        <span
                          v-if="outcome.axis_labels.right"
                          class="plot-direction-right"
                        >{{ outcome.axis_labels.right }} →</span>
                      </div>
                    </div>

                    <div class="plot-scale-row">
                      <div></div>
                      <div class="plot-guide">
                        <div
                          v-for="tick in outcome.ticks"
                          :key="`${outcome.outcome_id}-${tick.position}`"
                          class="tick-label"
                          :class="{ null: Math.abs(tick.value) < 0.000001 }"
                          :style="{ left: `${tick.position}%` }"
                        >
                          {{ tick.label }}
                        </div>
                      </div>
                    </div>

                    <div class="plot-rows f-col">
                      <div
                        v-for="item in outcome.plotRowGroups"
                        :key="item.key"
                        class="plot-row"
                        :class="{ pooled: item.row.row_type === 'pooled' }"
                      >
                          <div class="label-rail">
                            <div
                              class="row-title"
                              :class="[
                                $parent.speciesClass(item.row.species),
                                {
                                  'pooled-emphasis':
                                    item.row.row_type === 'pooled',
                                },
                              ]"
                              v-b-tooltip.html.hover.right="
                                $parent.rowTooltip(item.row)
                              "
                            >
                              {{ item.row.display_label_short }}
                            </div>
                          </div>

                          <div class="plot-rail-wrap">
                            <span
                              v-if="item.row.comparison_level_a && item.row.row_type !== 'pooled'"
                              class="level-pill level-pill--left"
                            >{{ item.row.comparison_level_a }}</span>
                            <div
                              class="plot-rail"
                              v-b-tooltip.html.hover.top="
                                $parent.rowTooltip(item.row)
                              "
                            >
                              <div class="rail-line"></div>
                              <div class="rail-zero"></div>
                              <div
                                v-if="item.row.row_type !== 'pooled' && outcome.pooledEffectLeft !== null"
                                class="pooled-ref-line"
                                :style="{ left: `${outcome.pooledEffectLeft}%` }"
                              ></div>
                              <div
                                class="ci-line"
                                :style="{
                                  left: `${item.row.ciLeft}%`,
                                  width: `${item.row.ciWidth}%`,
                                }"
                              ></div>
                              <div
                                class="effect-marker"
                                :class="{ pooled: item.row.row_type === 'pooled' }"
                                :style="{
                                  left: `calc(${item.row.effectLeft}% - 7px)`,
                                }"
                              ></div>
                              <div
                                v-if="item.row.row_type === 'pooled' && $parent.formatStars(item.row.p_value)"
                                class="pooled-stars"
                                :style="{ left: `${item.row.effectLeft}%` }"
                              >{{ $parent.formatStars(item.row.p_value) }}</div>
                            </div>
                            <span
                              v-if="item.row.comparison_level_b && item.row.row_type !== 'pooled'"
                              class="level-pill level-pill--right"
                            >{{ item.row.comparison_level_b }}</span>
                          </div>
                      </div>
                    </div>
                  </template>

                  <div v-else class="volcano-section">
                    <div class="volcano-label-col f-col">
                      <div
                        v-for="(row, idx) in $parent.volcanoDataRows(outcome)"
                        :key="`vlbl-${idx}`"
                        class="label-rail vlabel-row"
                      >
                        <div
                          class="row-title"
                          :class="[
                            $parent.speciesClass(row.species),
                            { 'vlabel-active': $parent.volcanoHoveredKey === $parent.volcanoRowKey(row, idx) },
                          ]"
                          @mouseenter="$parent.setVolcanoHoveredKey($parent.volcanoRowKey(row, idx))"
                          @mouseleave="$parent.setVolcanoHoveredKey(null)"
                        >{{ row.display_label_short }}</div>
                      </div>
                    </div>
                    <div class="volcano-plot-col">
                      <volcano-plot
                        :rows="outcome.rows"
                        :row-tooltip="$parent.rowTooltip"
                        :hovered-key="$parent.volcanoHoveredKey"
                        @hover="$parent.setVolcanoHoveredKey($event)"
                        @hover-end="$parent.setVolcanoHoveredKey(null)"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  class="evidence-accordion"
                  :class="{
                    expanded: $parent.isOutcomeExpanded(outcome.outcome_id),
                  }"
                  :aria-expanded="
                    $parent.isOutcomeExpanded(outcome.outcome_id)
                      ? 'true'
                      : 'false'
                  "
                  @click="$parent.toggleOutcome(outcome.outcome_id)"
                >
                  <span class="evidence-accordion__caret" aria-hidden="true"></span>
                  <span class="evidence-accordion__label">Evidence rows</span>
                </button>

                <div
                  v-if="$parent.isOutcomeExpanded(outcome.outcome_id)"
                  class="details-card f-col"
                >
                  <div class="table-shadow-wrap">
                  <div class="table-wrap">
                    <table class="details-table">
                      <colgroup>
                        <col style="width: 150px" />
                        <col style="width: 180px" />
                        <col style="width: 100px" />
                        <col style="width: 100px" />
                        <col style="width: 100px" />
                        <col style="width: 110px" />
                        <col style="width: 70px" />
                        <col style="width: 152px" />
                        <col style="width: 75px" />
                        <col style="width: 75px" />
                        <col style="width: 150px" />
                      </colgroup>
                      <thead>
                        <tr>
                          <th>Study</th>
                          <th>Description</th>
                          <th>Tissue</th>
                          <th>Depot</th>
                          <th>Depot 2</th>
                          <th>Comparison</th>
                          <th
                            class="th-tooltip"
                            v-b-tooltip.hover.top="'Number of samples in each comparison group: reference (a) / treatment (b)'"
                          >N (a / b)</th>
                          <th>Effect (95% CI)</th>
                          <th>P-value</th>
                          <th>Adj. P</th>
                          <th>Method</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="(row, rowIndex) in outcome.rows"
                          :key="`${outcome.outcome_id}-table-${rowIndex}`"
                          :class="{ pooled: row.row_type === 'pooled' }"
                        >
                          <td class="cell-truncate" :title="row.display_label_medium">{{ row.display_label_short }}</td>
                          <td class="cell-truncate" :title="row.dataset_name">{{ row.dataset_name || "—" }}</td>
                          <td class="cell-truncate" :title="row.tissue">{{ row.tissue || "—" }}</td>
                          <td class="cell-truncate" :title="row.depot">{{ row.depot || '—' }}</td>
                          <td class="cell-truncate" :title="row.depot2">{{ row.depot2 || '—' }}</td>
                          <td class="cell-truncate" :title="row.direction_label">{{ row.direction_label || "—" }}</td>
                          <td class="cell-number">{{ row.n_group_a != null && row.n_group_b != null ? `${row.n_group_a} / ${row.n_group_b}` : row.n_total != null ? row.n_total : "—" }}</td>
                          <td>{{ $parent.formatEstimate(row) }}</td>
                          <td>{{ $parent.formatPValue(row.p_value) }}</td>
                          <td>{{ $parent.formatPValue(row.p_value_adj) }}</td>
                          <td class="cell-truncate" :title="row.note">{{ row.note || "—" }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      <matkp-footer></matkp-footer>
    </div>
  </div>
</template>

<style scoped>
.prototype-page {
  gap: 14px;
  max-width: 1400px;
  margin: 0 auto;
}

.rail-card,
.outcome-section {
  background: #ffffffcc;
}

.gene-display__species {
  font-size: 0.65em;
  font-weight: 400;
  color: #666666;
}

.hero-panel {
  gap: 14px;
  padding: 0 0 25px;
}

.hero-row {
  gap: 24px;
  justify-content: space-between;
}

.hero-copy {
  max-width: 760px;
}

.hero-copy h1 {
  margin: 0;
  font-size: 30px;
  line-height: 1;
}

.hero-copy p {
  margin: 0;
  font-size: 16px;
  line-height: 1.45;
}

.hero-controls {
  gap: 4px;
  width: 240px;
}

.gene-search-header {
  align-items: center;
  gap: 10px;
  margin: 0;
}

.gene-search-header__label {
  margin: 0;
}

.gene-search-species {
  display: flex;
  gap: 14px;
}

.gene-search-species__option {
  align-items: center;
  color: #000000;
  cursor: pointer;
  display: inline-flex;
  font-size: 13px;
  font-weight: 700;
  gap: 6px;
  line-height: 1.25;
  margin: 0;
}

.gene-search-species__option input {
  margin: 0;
}

.gene-search-examples{
  display:flex;
  gap:5px;
}

.helper-copy {
  color: #555555;
  font-size: 12px;
}

.demo-gene {
  cursor: pointer;
  font-weight: 700;
  text-underline-offset: 2px;
}

.gene-search-row {
  display: grid;
  gap: 8px;
  grid-template-columns: minmax(0, 1fr) auto;
  margin: 0;
}

#gene-search{
  height: 36px;
}

.hero-controls > .helper-copy {
  margin: 0;
}

.content-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: 280px minmax(0, 1fr);
}

.sticky-rail {
  gap: 14px;
  position: sticky;
  top: calc(var(--gene-bar-height, 48px) + 14px);
  align-self: flex-start;
  max-height: calc(100vh - var(--gene-bar-height, 48px) - 28px);
  overflow-y: auto;
}

.rail-card {
  gap: 10px;
  padding: 16px 16px 16px 25px;
}

.rail-card--sticky {
  position: sticky;
  top: calc(var(--gene-bar-height, 48px) + 14px);
  width: 100%;
}

.rail-title,
.details-title,
.section-title {
  font-size: 18px;
  font-weight: 700;
}

.gene-bar {
  align-items: flex-start;
  background: #ffffffee;
  backdrop-filter: blur(6px);
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  flex-wrap: wrap;
  gap: 50px;
  padding: 10px 25px;
  position: sticky;
  top: 0;
  z-index: 20;
}

.gene-bar__identity {
  font-size: 20px;
  font-weight: 700;
  gap: 2px;
  line-height: 1.1;
}

.gene-bar__group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.gene-bar__label {
  color: #999999;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.gene-bar__filters {
  display: flex;
  gap: 0;
}

.gene-bar .filter-section {
  border-bottom: none;
  border-right: 1px solid #dddddd;
}

.species-toggle {
  display: flex;
  overflow: hidden;
  width: 240px;
}

.species-toggle__btn {
  border: 0;
  color: #555555;
  cursor: pointer;
  line-height: 1;
  padding: 4px 12px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  font-size: 12px;
  flex: 1;
}

.species-toggle__btn:not(.species-toggle__btn--active):hover{
  background: #fee6d7;
}

.species-toggle__btn--active {
  background: #ff6c02;
  color: #ffffff;
}

.species-toggle__symbol {
  font-weight: 600;
  opacity: 0.85;
  font-size: 16px;
}

.gene-display {
  font-size: inherit;
  font-weight: inherit;
  line-height: inherit;
}

.gene-display--empty {
  color: #555555;
}

.gene-summary-list {
  align-items: center;
  color: #555555;
  display: flex;
  flex-wrap: wrap;
  font-size: 13px;
  gap: 0 12px;
  list-style: none;
  margin: 0 0 0 auto;
  padding: 0;
}

.gene-summary-list li + li::before {
  content: "|";
  margin-right: 12px;
  opacity: 0.4;
}

.outcomes-list {
  display: flex;
  flex-direction: column;
}

.outcomes-group-title {
  align-items: center;
  color: #555555;
  display: flex;
  font-size: 11px;
  font-weight: 700;
  gap: 6px;
  justify-content: space-between;
  letter-spacing: 0.04em;
  margin: 10px 0 4px;
  text-transform: uppercase;
}

.outcomes-species-indicator {
  display: flex;
  gap: 4px;
}

.outcomes-species-btn {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font: inherit;
  letter-spacing: inherit;
  padding: 0;
  text-transform: inherit;
}

.outcomes-species-btn:hover {
  color: #ff6c02;
}

.outcomes-species--dimmed {
  opacity: 0.3;
}

.outcomes-group-title:first-child {
  margin-top: 0;
}

.outcomes-nav {
  display: flex;
  flex-direction: column;
}

.outcome-nav-item {
  background: none;
  border: none;
  border-left: 2px solid transparent;
  color: #333333;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.25;
  padding: 6px 0 6px 10px;
  text-align: left;
}

.outcome-nav-item:hover {
  color: #ff6c02;
}

.outcome-nav-item--active {
  border-left-color: #ff6c02;
  color: #ff6c02;
}

.outcome-nav-item--dimmed {
  opacity: 0.35;
}


.outcome-filter-active-dot {
  background: #ff6c02;
  border-radius: 999px;
  display: inline-block;
  height: 6px;
  margin-right: 5px;
  vertical-align: middle;
  width: 6px;
}

.outcome-filter-active-dot--after {
  margin-left: 5px;
  margin-right: 0;
}

.filter-section {
  border-bottom: 1px solid #dddddd;
  position: relative;
}

.filter-section__header {
  align-items: center;
  background: #eeeeee;
  cursor: pointer;
  display: flex;
  font-size: 13px;
  font-weight: 700;
  gap: 8px;
  justify-content: space-between;
  min-height: 36px;
  padding: 6px 10px;
}

.filter-section__name {
  flex: 1;
}

.filter-badge {
  background: #ffffff;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  white-space: nowrap;
}

.filter-badge--active {
  background: #ff6c02;
  color: #ffffff;
}

.filter-section:hover .filter-badge:not(.filter-badge--active) {
  outline: 2px solid #ff6c02;
}

.filter-flyout {
  background: #ffffff;
  box-shadow: 3px 3px 10px rgba(0, 0, 0, 0.15);
  display: none;
  flex-direction: column;
  left: 0;
  max-height: 500px;
  min-width: 200px;
  width: max-content;
  overflow-y: auto;
  padding: 8px 0;
  position: absolute;
  top: 100%;
  z-index: 100;
}

.filter-flyout--input {
  padding: 10px 12px;
}

.filter-section:hover .filter-flyout {
  display: flex;
}

.filter-option {
  align-items: center;
  cursor: pointer;
  display: flex;
  font-size: 13px;
  font-weight: 600;
  gap: 8px;
  min-height: 28px;
  padding: 2px 12px;
}

.filter-option:hover {
  background: #f5f5f5;
}

.filter-option--select-all {
  border-bottom: 1px solid #eeeeee;
  color: #555555;
  font-weight: 700;
  margin-bottom: 4px;
  padding-bottom: 8px;
}

.filter-option-label {
  color: #555555;
  display: block;
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 6px;
}

.filter-section__input {
  border: 1px solid #dddddd;
  border-radius: 4px;
  font-size: 13px;
  padding: 4px 6px;
  width: 160px;
}

.filter-section__input[type="number"] {
  appearance: textfield;
  -moz-appearance: textfield;
}

.filter-section__input[type="number"]::-webkit-outer-spin-button,
.filter-section__input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.outcome-filter-row {
  align-items: center;
  border-bottom: solid 1px #dddddd;
  cursor: pointer;
  display: flex;
  gap: 8px;
  min-height: 34px;
  padding: 0;
}

.outcome-filter-row--dimmed {
  opacity: 0.4;
}

.outcome-filter-label {
  color: #000000;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.25;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.outcome-filter-checkbox {
  flex-shrink: 0;
  margin: 0;
}

.action-button {
  background: #ffe514;
  border: 0;
  padding-left: 14px;
  padding-right: 14px;
  text-align: center;
}

.sections-column {
  gap: 14px;
}

.no-gene-data-panel {
  align-items: center;
  background: #ffffffcc;
  color: #555555;
  display: flex;
  font-size: 18px;
  font-weight: 700;
  justify-content: center;
  min-height: 120px;
  padding: 28px;
}

.outcome-section {
  gap: 12px;
  padding: 20px 25px;
}

.section-header {
  background: transparent;
  padding: 0;
  text-align: left;
  align-items: flex-start;
  gap: 14px;
  justify-content: space-between;
  width: 100%;
}

.section-heading {
  min-width: 0;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.3;
  max-width: 100%;
}

.section-title__label {
  white-space: nowrap;
}

.section-title__contrast {
  display: none;
}

.section-header-meta {
  align-items: flex-end;
  gap: 4px;
}

.section-meta {
  color: #555555;
  font-size: 12px;
  font-weight: 700;
  text-align: right;
}

.section-meta span + span::before {
  content: "|";
  margin: 0 0.35em;
}

.pooled-emphasis {
  color: #ff6c02;
}

.plot-card,
.details-card {
  background: #ffffff;
  gap: 10px;
  padding: 14px 16px;
}

.plot-scale-row {
  display: grid;
  gap: 8px;
  grid-template-columns: 220px minmax(0, 1fr);
}

.plot-guide {
  display: grid;
  height: 18px;
  position: relative;
}

.tick-label {
  color: #555555;
  font-size: 10px;
  position: absolute;
  top: 0;
  transform: translateX(-50%);
}

.tick-label.null {
  font-weight: 700;
}

.plot-direction-bar {
  align-items: center;
  color: #333333;
  display: flex;
  font-size: 11px;
  font-weight: 600;
  gap: 8px;
  justify-content: space-between;
  padding: 0 2px;
}

.plot-direction-left,
.plot-direction-right {
  max-width: 45%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.plot-rows {
  gap: 0px;
}

.plot-row {
  align-items: center;
  display: grid;
  gap: 8px;
  grid-template-columns: 220px minmax(0, 1fr);
  min-height: 20px;
}

.label-rail {
  min-width: 0;
}

.plot-rail-wrap {
  overflow: visible;
  position: relative;
}

.level-pill {
  background: #f0f0f0;
  border-radius: 4px;
  color: #444444;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  padding: 2px 5px;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  white-space: nowrap;
  z-index: 1;
}

.level-pill--left {
  left: 0;
}

.level-pill--right {
  right: 0;
}

.species-group-header {
  margin-top: 4px;
}

.species-group-header:first-child {
  margin-top: 0;
}

.species-group-header__label {
  border-radius: 999px;
  color: #000000;
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  margin-left: -10px;
  padding: 3px 6px;
  text-transform: uppercase;
  width: fit-content;
}

.species-group-header__label.human {
  background: #ffe7cf;
}

.species-group-header__label.mouse {
  background: #fff7d0;
}

.species-group-header__label.other {
  background: #f2f2f2;
}

/*
.row-title.human {
  border-left: solid 3px #ffe7cf;
  padding-left: 5px;
}

.row-title.mouse {
  border-left: solid 3px #fff7d0;
  padding-left: 5px;
}

.row-title.other {
  border-left: solid 3px #f2f2f2;
  padding-left: 5px;
}
*/

.row-title {
  font-size: 12px;
  font-weight: 700;
  line-height: 1.1;
  cursor: default;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.plot-rail {
  cursor: default;
  height: 20px;
  position: relative;
}

.rail-line,
.rail-zero {
  position: absolute;
}

.rail-line {
  background: linear-gradient(90deg, #f0f0f0 0%, #fafafa 100%);
  height: 2px;
  left: 0;
  right: 0;
  top: 9px;
}

.rail-zero {
  background: #424242;
  left: 50%;
  transform: translateX(-50%);
  width: 1px;
  height: 130%;
}

.pooled-ref-line {
  border-left: 2px dotted rgba(255, 108, 2, 0.45);
  bottom: -10px;
  pointer-events: none;
  position: absolute;
  top: -1px;
  transform: translateX(-3px);
}

.ci-line {
  background: #ff6c02;
  border-radius: 999px;
  height: 1px;
  position: absolute;
  top: 8px;
}

.effect-marker {
  background: #424242;
  border: 2px solid #ffe514;
  border-radius: 999px;
  height: 10px;
  position: absolute;
  top: 4px;
  width: 10px;
}

.effect-marker.pooled {
  background: #ff6c02;
  border-color: #424242;
}

.pooled-stars {
  color: #ff6c02;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  pointer-events: none;
  position: absolute;
  top: 17px;
  transform: translateX(-65%);
}

.plot-legend {
  align-items: flex-end;
  color: #555555;
  font-size: 11px;
}

.legend-row {
  align-items: center;
  gap: 12px;
  justify-content: flex-end;
}

.legend-item {
  align-items: center;
  gap: 5px;
}

.legend-dot {
  background: #424242;
  border: 2px solid #ffe514;
  border-radius: 999px;
  display: inline-block;
  flex-shrink: 0;
  height: 10px;
  width: 10px;
}

.legend-dot--pooled {
  background: #ff6c02;
  border-color: #424242;
}

.legend-line {
  background: #ff6c02;
  border-radius: 999px;
  display: inline-block;
  height: 3px;
  width: 18px;
}

.legend-ref-line {
  border-left: 2px dotted rgba(255, 108, 2, 0.6);
  display: inline-block;
  flex-shrink: 0;
  height: 14px;
  width: 0;
}

.legend-stars {
  color: #ff6c02;
  font-weight: 700;
}

.legend-null {
  background: #424242;
  display: inline-block;
  height: 12px;
  width: 1px;
}

.evidence-accordion {
  align-items: center;
  background: none;
  border: 0;
  color: #000000;
  cursor: pointer;
  display: inline-flex;
  font-size: 13px;
  font-weight: 700;
  gap: 6px;
  padding: 0;
  text-align: left;
  text-decoration: none;
}

.evidence-accordion:hover,
.evidence-accordion:focus {
  color: #000000;
  text-decoration: none;
}

.evidence-accordion__label {
  color: #000000;
}

.evidence-accordion__caret {
  border-bottom: 5px solid transparent;
  border-left: 7px solid #ff6c02;
  border-top: 5px solid transparent;
  display: inline-block;
  flex-shrink: 0;
  height: 0;
  transition: transform 0.15s ease;
  width: 0;
}

.evidence-accordion.expanded .evidence-accordion__caret {
  transform: rotate(90deg);
}

:global(.tooltip.b-tooltip .tooltip-inner) {
  background: #ffffff;
  border: 1px solid #dddddd;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  color: #000000;
  max-width: 320px;
  padding: 10px 12px;
  text-align: left;
}

:global(.tooltip.b-tooltip .arrow::before) {
  border-top-color: #dddddd !important;
  border-bottom-color: #dddddd !important;
}

:global(.plot-tooltip__pill) {
  background: #f0f0f0;
  border-radius: 4px;
  color: #444444;
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  padding: 2px 5px;
  white-space: nowrap;
}

:global(.plot-tooltip) {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

:global(.plot-tooltip__title) {
  font-size: 12px;
  font-weight: 700;
  line-height: 1.35;
}

:global(.plot-tooltip__description) {
  color: #555555;
  font-size: 11px;
  line-height: 1.4;
}

:global(.plot-tooltip__divider) {
  border-top: 1px solid #eeeeee;
  margin: 2px 0;
}

:global(.plot-tooltip__row) {
  display: grid;
  gap: 12px;
  grid-template-columns: 60px minmax(0, 1fr);
}

:global(.plot-tooltip__label) {
  color: #555555;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

:global(.plot-tooltip__value) {
  font-size: 12px;
  line-height: 1.35;
}

.table-shadow-wrap {
  position: relative;
}

.table-shadow-wrap::after {
  background: linear-gradient(to left, rgba(0, 0, 0, 0.1), transparent);
  bottom: 0;
  content: "";
  pointer-events: none;
  position: absolute;
  right: 0;
  top: 0;
  width: 12px;
  z-index: 10;
}

.table-wrap {
  overflow-x: auto;
}

.details-table {
  border-collapse: collapse;
  table-layout: fixed;
  width: max-content;
}

.details-table th,
.details-table td {
  border-bottom: 1px solid #dddddd;
  font-size: 13px;
  line-height: 1.4;
  padding: 8px 10px;
  text-align: left;
  vertical-align: middle;
}

.details-table th {
  background: #f2f2f2;
  font-size: 12px;
  text-transform: uppercase;
}

.th-tooltip {
  cursor: help;
  text-decoration: underline dotted #666666;
  text-underline-offset: 3px;
}

.details-table th:first-child,
.details-table td:first-child {
  background: #ffffff;
  left: 0;
  position: sticky;
  z-index: 1;
}

.details-table th:first-child {
  background: #f2f2f2;
}

.details-table tr.pooled td {
  background: #fff9d9;
  font-weight: 700;
}

.details-table tr.pooled td:first-child {
  background: #fff9d9;
}

.cell-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-number {
  text-align: right;
}

.volcano-section {
  align-items: flex-start;
  display: flex;
}

.volcano-label-col {
  flex-shrink: 0;
  padding: 20px 0 0;
  width: 220px;
  height: 320px;
  overflow: scroll;
}

.vlabel-row {
  align-items: center;
  display: flex;
  min-height: 20px;
  padding: 2px 0;
}

.vlabel-active {
  background: #fff4ee;
  color: #cc4400;
}

.volcano-plot-col {
  flex: 1;
  min-width: 0;
}

.plot-view-toggle {
  display: flex;
  margin-left: 6px;
  overflow: hidden;
  width: fit-content;
}

.plot-view-btn {
  background: #eeeeee;
  border: none;
  color: #666666;
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.03em;
  padding: 3px 10px;
}

.plot-view-btn + .plot-view-btn {
  border-left: 1px solid #dddddd;
}

.plot-view-btn--active {
  background: #ff6c02;
  color: #ffffff;
}

@media (max-width: 1280px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .rail-card--sticky {
    position: static;
  }

  .plot-scale-row,
  .plot-row {
    grid-template-columns: 180px minmax(0, 1fr);
  }
}
</style>
