<template>
  <div class="matkp transcriptomic-prototype">
    <div class="f-col fill-height">
      <matkp-nav :showSearch="false"></matkp-nav>

      <div class="mat-body">
        <div class="prototype-page f-col">
          <div class="hero-panel f-col">
            <div class="eyebrow">MATKP prototype</div>
            <div class="hero-row f-row">
              <div class="hero-copy f-col">
                <h1>Bulk transcriptomic datasets viewer</h1>
                <p>
                  Gene-first prototype for scanning bulk RNA-seq evidence across
                  adipose datasets. Each outcome is rendered as a compact forest
                  plot with a matching evidence table underneath.
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

            <div class="summary-strip">
              <div
                v-for="card in $parent.geneSummaryCards"
                :key="card.label"
                class="summary-card"
              >
                <div class="summary-value">{{ card.value }}</div>
                <div class="summary-label">{{ card.label }}</div>
              </div>
            </div>

            <div class="interpretation-note">
              Read each row as one dataset. The center line is the null value.
              Dots to the right indicate a higher estimate in the named
              comparison direction, dots to the left indicate a lower or
              opposite estimate, and orange intervals show uncertainty. If an
              interval crosses the center line, the row is compatible with
              little or no effect.
            </div>
          </div>

          <div class="content-grid">
            <div class="sticky-rail f-col">
              <div class="rail-card f-col">
                <div class="rail-title">Selected gene</div>
                <div class="gene-display">{{ $parent.activeGene.gene }}</div>
                <div class="rail-copy">
                  {{ $parent.activeGene.supported_outcome_count }} supported
                  outcomes across
                  {{ $parent.activeGene.page_summary.dataset_count }} datasets.
                </div>
              </div>

              <div class="rail-card f-col">
                <div class="rail-title">Outcomes</div>
                <div class="outcomes-list">
                  <button
                    v-for="outcome in $parent.outcomes"
                    :key="outcome.outcome_id"
                    type="button"
                    class="outcome-chip"
                    :class="{
                      active: $parent.isOutcomeInFocus(outcome.outcome_id),
                    }"
                    @click="$parent.selectOutcome(outcome.outcome_id)"
                  >
                    {{ outcome.outcome_label }}
                  </button>
                </div>
              </div>
            </div>

            <div class="sections-column f-col">
              <section
                v-for="outcome in $parent.outcomes"
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
                  <div class="section-meta f-row">
                    <div class="meta-chip">
                      {{ outcome.summary_counts.dataset_count }} datasets
                    </div>
                    <div class="meta-chip">
                      {{ outcome.summary_counts.species_count }} species
                    </div>
                    <div
                      v-if="outcome.summary_counts.pooled_row_count"
                      class="meta-chip pooled-chip"
                    >
                      {{ outcome.summary_counts.pooled_row_count }} pooled row
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
                    <div
                      v-for="row in outcome.plotRows"
                      :key="`${outcome.outcome_id}-${row.display_label_short}-${row.row_type}`"
                      class="plot-row"
                      :class="{ pooled: row.row_type === 'pooled' }"
                    >
                      <div class="label-rail">
                        <div class="row-title-row">
                          <div
                            class="row-title"
                            v-b-tooltip.html.hover.right="$parent.rowTooltip(row)"
                          >
                            {{
                              row.row_type === "pooled"
                                ? row.display_label_short
                                : row.display_label_short
                            }}
                          </div>
                          <div
                            class="species-badge compact"
                            :class="$parent.speciesClass(row.species)"
                          >
                            {{ $parent.formatSpeciesLabel(row.species) }}
                          </div>
                        </div>
                      </div>

                      <div
                        class="plot-rail"
                        v-b-tooltip.html.hover.top="$parent.rowTooltip(row)"
                      >
                        <div class="rail-line"></div>
                        <div class="rail-zero"></div>
                        <div
                          class="ci-line"
                          :style="{
                            left: `${row.ciLeft}%`,
                            width: `${row.ciWidth}%`,
                          }"
                        ></div>
                        <div
                          class="effect-marker"
                          :class="{ pooled: row.row_type === 'pooled' }"
                          :style="{ left: `calc(${row.effectLeft}% - 7px)` }"
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div class="plot-footer f-row">
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
                    <button
                      type="button"
                      class="evidence-toggle"
                      @click="$parent.toggleOutcome(outcome.outcome_id)"
                    >
                      {{
                        $parent.isOutcomeExpanded(outcome.outcome_id)
                          ? "Hide evidence rows"
                          : "Show evidence rows"
                      }}
                    </button>
                  </div>
                </div>

                <div
                  v-if="$parent.isOutcomeExpanded(outcome.outcome_id)"
                  class="details-card f-col"
                >
                  <div class="details-title">Evidence rows</div>
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

.eyebrow {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
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

.interpretation-note {
  background: #fff7d0;
  font-size: 12px;
  line-height: 1.45;
  padding: 12px 14px;
}

.summary-strip {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.summary-card {
  background: #fff7d0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px;
}

.summary-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
}

.summary-label {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
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

.rail-copy {
  color: #555555;
  font-size: 13px;
  line-height: 1.5;
}

.outcomes-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.outcome-chip,
.action-button,
.evidence-toggle {
  background: #ffffff;
  border: 1px solid #dddddd;
  border-radius: 5px;
  color: #000000;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  padding: 8px 10px;
  text-align: left;
}

.outcome-chip {
  width: 100%;
}

.action-button {
  background: #ffe514;
  border: 0;
  padding-left: 14px;
  padding-right: 14px;
  text-align: center;
}

.outcome-chip.active {
  background: #ffe514;
  border-color: #ffe514;
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

.section-meta {
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.meta-chip {
  background: #f2f2f2;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 700;
  padding: 6px 8px;
}

.meta-chip.highlight {
  background: #ffe514;
}

.pooled-chip {
  background: #fff7d0;
  border: 1px solid #ffe514;
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

.row-title-row {
  align-items: center;
  display: flex;
  gap: 6px;
  justify-content: space-between;
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
  width: 2px;
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

.species-badge {
  align-self: flex-end;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  padding: 5px 8px;
}

.species-badge.human {
  background: #ffe7cf;
}

.species-badge.mouse {
  background: #fff7d0;
}

.species-badge.other {
  background: #f2f2f2;
}

.species-badge.compact {
  align-self: auto;
  font-size: 10px;
  padding: 3px 6px;
}

.plot-footer {
  align-items: center;
  gap: 10px;
  justify-content: space-between;
  margin-top: 2px;
}

.plot-legend {
  align-items: center;
  color: #555555;
  flex-wrap: wrap;
  font-size: 11px;
  gap: 12px;
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
  width: 2px;
}

.evidence-toggle {
  background: #ffe514;
  padding: 6px 10px;
  white-space: nowrap;
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
