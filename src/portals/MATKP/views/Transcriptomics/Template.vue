<template>
  <div class="matkp transcriptomic-prototype">
    <div class="f-col fill-height">
      <matkp-nav :showSearch="false"></matkp-nav>

      <div class="mat-body">
        <div class="prototype-page f-col">
          <div class="hero-panel f-col">
            <div class="hero-row f-row">
              <div class="hero-copy f-col">
                <h1>Bulk transcriptomic datasets viewer</h1>
                <p>
                  Gene-first viewer for scanning bulk RNA-seq evidence across
                  adipose datasets. Each outcome is rendered as a compact forest
                  plot with a matching evidence table underneath. Read each row
                  as one dataset. The center line is the null value. Dots to the
                  right indicate a higher estimate in the named comparison
                  direction, dots to the left indicate a lower or opposite
                  estimate, and orange intervals show uncertainty. If an
                  interval crosses the center line, the row is compatible with
                  little or no effect.
                </p>
              </div>

              <div class="hero-controls f-col">
                <label for="gene-search">Gene</label>
                <div class="gene-search-row">
                  <input
                    id="gene-search"
                    v-model="$parent.geneQuery"
                    type="text"
                    list="matkp-gene-options"
                    placeholder="Type a gene symbol"
                    @keydown.enter.prevent="$parent.loadGene()"
                  />
                  <button
                    type="button"
                    class="action-button"
                    @click="$parent.loadGene()"
                  >
                    Search
                  </button>
                </div>
                <datalist id="matkp-gene-options">
                  <option
                    v-for="item in $parent.geneIndex"
                    :key="item.gene"
                    :value="item.gene"
                  ></option>
                </datalist>
                <div class="helper-copy">
                  Demo genes:
                  <span
                    v-for="(item, index) in $parent.geneIndex"
                    :key="item.gene"
                    class="demo-gene"
                    >{{ item.gene }}<span
                      v-if="index < $parent.geneIndex.length - 1"
                      >, </span
                    ></span
                  >
                </div>
              </div>
            </div>
          </div>

          <div class="content-grid">
            <div class="sticky-rail f-col">
              <div class="rail-card f-col">
                <div class="rail-title">Selected gene</div>
                <div class="gene-display">{{ $parent.activeGene.gene }}</div>
                <ul class="gene-summary-list">
                  <li
                    v-for="item in $parent.geneSummaryList"
                    :key="item"
                  >
                    {{ item }}
                  </li>
                </ul>
              </div>

              <div class="rail-card f-col">
                <div class="rail-title">Outcomes</div>
                <div class="outcomes-list">
                  <div class="outcome-filter-row outcome-filter-row--species">
                    <span class="outcome-filter-spacer" aria-hidden="true"></span>
                    <span class="outcome-filter-label">Species</span>
                    <b-dropdown
                      right
                      no-caret
                      variant="link"
                      toggle-class="outcome-filter-menu"
                      boundary="viewport"
                    >
                      <template #button-content>
                        <b-icon icon="three-dots-vertical"></b-icon>
                      </template>
                      <b-dropdown-form class="outcome-filter-dropdown">
                        <b-form-checkbox
                          size="sm"
                          :checked="$parent.speciesFilters.human"
                          @change="
                            $parent.setSpeciesFilter('human', $event)
                          "
                        >
                          Human
                        </b-form-checkbox>
                        <b-form-checkbox
                          size="sm"
                          :checked="$parent.speciesFilters.mouse"
                          @change="
                            $parent.setSpeciesFilter('mouse', $event)
                          "
                        >
                          Mouse
                        </b-form-checkbox>
                        <b-form-checkbox
                          size="sm"
                          :checked="$parent.speciesFilters.other"
                          @change="
                            $parent.setSpeciesFilter('other', $event)
                          "
                        >
                          Pooled / other
                        </b-form-checkbox>
                      </b-dropdown-form>
                    </b-dropdown>
                  </div>

                  <div
                    v-for="outcome in $parent.outcomes"
                    :key="outcome.outcome_id"
                    class="outcome-filter-row"
                  >
                    <b-form-checkbox
                      class="outcome-filter-checkbox"
                      size="sm"
                      :checked="$parent.isOutcomeVisible(outcome.outcome_id)"
                      @change="
                        $parent.setOutcomeVisibility(
                          outcome.outcome_id,
                          $event
                        )
                      "
                    ></b-form-checkbox>
                    <span class="outcome-filter-label">{{
                      outcome.outcome_label
                    }}</span>
                    <b-dropdown
                      right
                      no-caret
                      variant="link"
                      toggle-class="outcome-filter-menu"
                      boundary="viewport"
                    >
                      <template #button-content>
                        <b-icon icon="three-dots-vertical"></b-icon>
                      </template>
                      <b-dropdown-form class="outcome-filter-dropdown">
                        <div class="outcome-filter-dropdown__title">
                          {{ outcome.outcome_label }} filters
                        </div>
                        <div class="outcome-filter-dropdown__placeholder">
                          Optional section filters will appear here.
                        </div>
                      </b-dropdown-form>
                    </b-dropdown>
                  </div>
                </div>
              </div>
            </div>

            <div class="sections-column f-col">
              <section
                v-for="outcome in $parent.outcomes"
                v-show="$parent.isOutcomeVisible(outcome.outcome_id)"
                :key="outcome.outcome_id"
                class="outcome-section f-col"
                :data-outcome-id="outcome.outcome_id"
              >
                <div class="section-header f-row">
                  <div class="f-col section-heading">
                    <div class="section-title">{{ outcome.outcome_label }}</div>
                    <div class="section-subtitle">
                      {{ outcome.contrast_label }}
                    </div>
                  </div>
                  <div class="section-header-meta f-col">
                    <div class="section-meta">
                      <span
                        >{{ outcome.summary_counts.dataset_count }} datasets</span
                      >
                      <span
                        >{{ outcome.summary_counts.species_count }} species</span
                      >
                      <span class="section-meta__pooled pooled-emphasis"
                        >{{
                          outcome.summary_counts.pooled_row_count || 0
                        }}
                        pooled data</span
                      >
                    </div>
                    <div class="plot-legend f-row">
                      <div class="legend-item f-row">
                        <span class="legend-dot"></span>
                        <span>estimate</span>
                      </div>
                      <div class="legend-item f-row">
                        <span class="legend-line"></span>
                        <span>95% CI</span>
                      </div>
                      <div class="legend-item f-row">
                        <span class="legend-null"></span>
                        <span>null</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="plot-card f-col">
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
                    <template
                      v-for="item in outcome.plotRowGroups"
                    >
                      <div
                        v-if="item.type === 'species-header'"
                        :key="item.key"
                        class="species-group-header plot-scale-row"
                      >
                        <div
                          class="species-group-header__label"
                          :class="item.speciesClass"
                        >
                          {{ item.label }}
                        </div>
                        <div></div>
                      </div>
                      <div
                        v-else
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

                        <div
                          class="plot-rail"
                          v-b-tooltip.html.hover.top="
                            $parent.rowTooltip(item.row)
                          "
                        >
                          <div class="rail-line"></div>
                          <div class="rail-zero"></div>
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
                        </div>
                      </div>
                    </template>
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
                  <div class="table-wrap">
                    <table class="details-table">
                      <thead>
                        <tr>
                          <th>Study</th>
                          <th>Dataset ID</th>
                          <th>Species</th>
                          <th>Depot</th>
                          <th>Effect (95% CI)</th>
                          <th>Adj. p</th>
                          <th>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="row in outcome.rows"
                          :key="`${outcome.outcome_id}-table-${row.display_label_short}-${row.row_type}`"
                          :class="{ pooled: row.row_type === 'pooled' }"
                        >
                          <td>{{ row.display_label_medium }}</td>
                          <td>{{ row.dataset_id || "meta-analysis" }}</td>
                          <td>{{ row.species || "Pooled" }}</td>
                          <td>{{ row.depot || "—" }}</td>
                          <td>{{ $parent.formatEstimate(row) }}</td>
                          <td>{{ $parent.formatPValue(row.p_value_adj) }}</td>
                          <td>{{ row.note || "—" }}</td>
                        </tr>
                      </tbody>
                    </table>
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

.hero-panel,
.rail-card,
.outcome-section {
  background: #ffffffcc;
}

.hero-panel {
  gap: 14px;
  padding: 28px;
}

.hero-row {
  gap: 24px;
  justify-content: space-between;
}

.hero-copy {
  gap: 8px;
  max-width: 760px;
}

.hero-copy h1 {
  margin: 0;
  font-size: 30px;
  line-height: 1;
}

.hero-copy p {
  margin: 0;
  font-size: 13px;
  line-height: 1.45;
  max-width: 680px;
}

.hero-controls {
  gap: 8px;
  min-width: 340px;
  width: 340px;
}

.helper-copy {
  color: #555555;
  font-size: 12px;
}

.demo-gene {
  font-weight: 700;
}

.gene-search-row {
  display: grid;
  gap: 8px;
  grid-template-columns: minmax(0, 1fr) auto;
}

.content-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: 280px minmax(0, 1fr);
}

.sticky-rail {
  gap: 14px;
  position: sticky;
  top: 20px;
  align-self: start;
}

.rail-card {
  gap: 10px;
  padding: 16px;
}

.rail-title,
.details-title,
.section-title {
  font-size: 18px;
  font-weight: 700;
}

.gene-display {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.1;
}

.gene-summary-list {
  color: #555555;
  font-size: 13px;
  line-height: 1.5;
  margin: 0;
  padding-left: 18px;
}

.outcomes-list {
  display: flex;
  flex-direction: column;
}

.outcome-filter-row {
  align-items: center;
  background: none;
  border: none;
  border-bottom: solid 1px #dddddd;
  border-radius: 0;
  display: grid;
  gap: 0 10px;
  grid-template-columns: 1.1rem 1fr 1.1rem;
  min-height: 38px;
  padding: 0;
}

.outcome-filter-row--species {
  grid-template-columns: 1.1rem 1fr 1.1rem;
}

.outcome-filter-spacer {
  width: 1.1rem;
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
  justify-self: start;
  line-height: 1;
  margin: 0;
  min-height: 0;
  padding: 0;
}

.outcome-filter-checkbox :deep(.custom-control) {
  margin: 0;
  min-height: 0.64rem;
  padding-left: 0.64rem;
}

.outcome-filter-checkbox :deep(.custom-control-label) {
  min-height: 0.64rem;
  padding: 0;
}

.outcome-filter-checkbox :deep(.custom-control-label::before),
.outcome-filter-checkbox :deep(.custom-control-label::after) {
  height: 0.64rem;
  left: -0.64rem;
  top: 0;
  width: 0.64rem;
}

.outcome-filter-menu {
  align-items: center;
  color: #999999;
  display: inline-flex;
  font-size: 15px;
  height: 24px;
  justify-content: center;
  justify-self: end;
  line-height: 1;
  min-width: 24px;
  padding: 0;
  text-decoration: none;
}

.outcome-filter-menu:hover,
.outcome-filter-menu:focus,
.outcome-filter-menu:active {
  background: transparent;
  box-shadow: none;
  color: #999999;
  text-decoration: none;
}

.outcome-filter-row :deep(.outcome-filter-menu .b-icon) {
  color: #999999;
}

.outcome-filter-row :deep(.dropdown) {
  justify-self: end;
  line-height: 1;
}

.outcome-filter-row :deep(.btn-link) {
  border: 0;
}

:deep(.outcome-filter-dropdown) {
  font-size: 13px;
  line-height: 1.35;
  min-width: 168px;
  padding: 6px 10px;
}

:deep(.outcome-filter-dropdown__title) {
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 6px;
  text-transform: uppercase;
}

:deep(.outcome-filter-dropdown__placeholder) {
  color: #555555;
  font-size: 13px;
  line-height: 1.35;
}

:deep(.outcome-filter-dropdown .custom-checkbox) {
  align-items: center;
  display: flex;
  margin-bottom: 10px;
  min-height: 0;
  padding-left: calc(0.6rem + 8px);
}

:deep(.outcome-filter-dropdown .custom-checkbox:last-child) {
  margin-bottom: 0;
}

:deep(.outcome-filter-dropdown .custom-control-label) {
  align-items: center;
  display: inline-flex;
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 0;
  min-height: 0.6rem;
  padding-left: 0rem;
  padding-top: 0;
  position: relative;
}

:deep(.outcome-filter-dropdown .custom-control-label::before),
:deep(.outcome-filter-dropdown .custom-control-label::after) {
  height: 0.6rem;
  left: calc(-0.6rem - 8px);
  margin-top: -0.3rem;
  top: 50%;
  width: 0.6rem;
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

.outcome-section {
  gap: 12px;
  padding: 20px 24px;
}

.section-header {
  background: transparent;
  padding: 0;
  text-align: left;
  align-items: center;
  gap: 14px;
  justify-content: space-between;
  width: 100%;
}

.section-heading {
  gap: 4px;
}

.section-subtitle {
  color: #555555;
  font-size: 12px;
  font-weight: 700;
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

.plot-rows {
  gap: 2px;
}

.plot-row {
  align-items: center;
  display: grid;
  gap: 8px;
  grid-template-columns: 220px minmax(0, 1fr);
  min-height: 24px;
}

.label-rail {
  min-width: 0;
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
  bottom: 2px;
  left: 50%;
  top: 2px;
  transform: translateX(-50%);
  width: 1px;
}

.ci-line {
  background: #ff6c02;
  border-radius: 999px;
  height: 3px;
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

.plot-legend {
  align-items: center;
  color: #555555;
  flex-wrap: wrap;
  font-size: 11px;
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
  height: 10px;
  width: 10px;
}

.legend-line {
  background: #ff6c02;
  border-radius: 999px;
  display: inline-block;
  height: 3px;
  width: 18px;
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

:global(.plot-tooltip__row) {
  display: grid;
  gap: 12px;
  grid-template-columns: 72px minmax(0, 1fr);
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

.details-table {
  border-collapse: collapse;
  min-width: 100%;
  width: 100%;
}

.details-table th,
.details-table td {
  border-bottom: 1px solid #dddddd;
  font-size: 13px;
  line-height: 1.4;
  padding: 8px 10px;
  text-align: left;
  vertical-align: top;
}

.details-table th {
  background: #f2f2f2;
  font-size: 12px;
  text-transform: uppercase;
}

.details-table tr.pooled td {
  background: #fff9d9;
  font-weight: 700;
}

@media (max-width: 1280px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .sticky-rail {
    position: static;
  }

  .plot-scale-row,
  .plot-row {
    grid-template-columns: 180px minmax(0, 1fr);
  }
}
</style>
