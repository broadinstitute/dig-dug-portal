<template>
    <div style="display:flex; flex-direction: column; min-height: 100%">
        <!-- Header -->
        <page-header :disease-group="$parent.diseaseGroup" :front-contents="$parent.frontContents"></page-header>

        <!-- PEGASUS sub-navigation 
        <nav class="peg-nav">
            <div class="container-fluid d-flex align-items-center">
                <a class="peg-nav-brand" href="/pegasus.html">
                    <img
                        class="peg-nav-logo"
                        src="https://hugeampkpncms.org/sites/default/files/images/PEG/pegasus_icon_white.png"
                        alt=""
                    />
                    <span class="peg-nav-title">PEGASUS</span>
                </a>
                <a
                    class="peg-nav-link ml-auto"
                    href="https://gwas-catalog.github.io/PEGASUS/"
                    target="_blank"
                    rel="noopener"
                    >Documentation</a
                >
            </div>
        </nav>
        -->

        <!-- Body -->
        <div class="container-fluid mdkp-body" style="flex:1">
            <div class="card mdkp-card dataset-page-header">
                <div class="row card-body">
                    <div class="col-md-12">
                        <template v-if="!$parent.selectedAccession">
                            <div style="display:flex; gap:20px;">
                                <div>
                                    <img
                                        class="peg-logo"
                                        src="https://hugeampkpncms.org/sites/default/files/images/PEG/pegasus_icon.png"
                                        alt=""
                                    />
                                </div>
                                <div>
                                    <h2>PEGASUS</h2>
                                    <p class="peg-intro">
                                        Predicted Effector Gene Aggregation, Standards,
                                        and Unified Schema (PEGASUS) is a new community
                                        framework for organizing and sharing predicted
                                        effector gene resources in a more consistent,
                                        transparent, and reusable way.
                                        <a
                                            class="ml-auto"
                                            href="https://gwas-catalog.github.io/PEGASUS/"
                                            target="_blank"
                                            rel="noopener"
                                            >Learn More</a
                                        >
                                    </p>
                                </div>
                            </div>
                        </template>
                        <h2 v-else>
                            {{
                                $parent.selectedStudy
                                    ? $parent.selectedStudy.name
                                    : $parent.selectedAccession
                            }}
                        </h2>
                    </div>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body" v-if="!$parent.selectedAccession">
                    <div class="row mb-4">
                        <div class="col-md-6">
                            <b-form-input
                                v-model="$parent.filter"
                                size="sm"
                                type="search"
                                placeholder="Search studies"
                            ></b-form-input>
                        </div>
                        <div class="col-md-6 text-right">
                            <data-download
                                :data="$parent.studiesRows"
                                filename="PEGASUS_studies"
                            ></data-download>
                        </div>
                    </div>

                    <b-table
                        hover
                        small
                        responsive
                        class="peg-table"
                        :busy="$parent.studiesLoading"
                        :items="$parent.studiesRows"
                        :fields="$parent.fields"
                        :filter="$parent.filter"
                        :per-page="$parent.perPage"
                        :current-page="$parent.currentPage"
                        @filtered="$parent.onFiltered"
                        show-empty
                        empty-text="No studies found."
                        empty-filtered-text="No studies match your search."
                    >
                        <template #table-busy>
                            <div class="text-center my-3">
                                <b-spinner small></b-spinner>
                                Loading studies&hellip;
                            </div>
                        </template>

                        <template #cell(publication_ref)="v">
                            <a
                                v-if="v.item.publication_ref"
                                :href="
                                    'https://pubmed.ncbi.nlm.nih.gov/' +
                                    v.item.publication_ref
                                "
                                target="_blank"
                                rel="noopener"
                                >{{ v.item.publication_ref }}</a
                            >
                        </template>

                        <template #cell(view_list)="v">
                            <b-button
                                size="sm"
                                variant="outline-primary"
                                @click="$parent.viewList(v.item.accession_id)"
                                >View list</b-button
                            >
                        </template>
                    </b-table>

                    <b-pagination
                        v-if="$parent.studiesRowCount > $parent.perPage"
                        v-model="$parent.currentPage"
                        class="pagination-sm justify-content-center"
                        :total-rows="$parent.studiesRowCount"
                        :per-page="$parent.perPage"
                    ></b-pagination>
                </div>

                <div class="card-body" v-else>
                    <!-- Study list view -->
                    <div class="row mb-2">
                        <div class="col-md-12">
                            <b-button
                                size="sm"
                                variant="link"
                                class="pl-0"
                                @click="$parent.backToStudies()"
                                >&laquo; All studies</b-button
                            >
                        </div>
                    </div>

                    <div class="row peg-study-details">
                        <div
                            class="col-md-4"
                            v-for="(column, i) in $parent.selectedStudyDetails"
                            :key="i"
                        >
                            <dl class="row">
                                <template v-for="detail in column">
                                    <dt
                                        class="col-sm-4"
                                        :key="detail.label + '-label'"
                                    >
                                        {{ detail.label }}
                                    </dt>
                                    <dd class="col-sm-7" :key="detail.label">
                                        <a
                                            v-if="detail.href"
                                            :href="detail.href"
                                            target="_blank"
                                            rel="noopener"
                                            >{{ detail.value }}</a
                                        >
                                        <span v-else>{{ detail.value }}</span>
                                    </dd>
                                </template>
                            </dl>
                        </div>

                        <div class="col-md-4 peg-list-notes">
                            <p>
                                The PEG List communicates the author's
                                prioritization in a compact, interpretable form.
                                Users needing detailed, directional or
                                quantitative interpretation should refer to the
                                underlying matrix, which retains all evaluated
                                genes, evidence streams, and integration logic.
                            </p>
                            <div class="text-right">
                                <b-dropdown
                                    split
                                    right
                                    size="sm"
                                    variant="secondary"
                                    :split-href="$parent.fileHref('peg_list')"
                                    :disabled="$parent.zipping"
                                    split-class="text-white"
                                    toggle-class="peg-download-toggle"
                                >
                                    <template #button-content>
                                        <b-spinner
                                            v-if="$parent.zipping"
                                            small
                                        ></b-spinner>
                                        Download data
                                    </template>
                                    <b-dropdown-item
                                        :href="$parent.fileHref('peg_list')"
                                        :disabled="
                                            !$parent.studyFile('peg_list')
                                        "
                                        >List (TSV)</b-dropdown-item
                                    >
                                    <b-dropdown-item
                                        :href="$parent.fileHref('peg_matrix')"
                                        :disabled="
                                            !$parent.studyFile('peg_matrix')
                                        "
                                        >Matrix (TSV)</b-dropdown-item
                                    >
                                    <b-dropdown-item
                                        :href="$parent.fileHref('peg_metadata')"
                                        :disabled="
                                            !$parent.studyFile('peg_metadata')
                                        "
                                        >Metadata (XLSX)</b-dropdown-item
                                    >
                                    <b-dropdown-divider></b-dropdown-divider>
                                    <b-dropdown-item
                                        @click="$parent.downloadStudyZip()"
                                        >All files (ZIP)</b-dropdown-item
                                    >
                                </b-dropdown>
                            </div>
                        </div>
                    </div>

                    <div class="peg-list-legend">
                        <div>
                            <b-form-checkbox
                                class="peg-list-check"
                                :checked="true"
                                disabled
                            ></b-form-checkbox>
                            <span>= data present.</span>

                            <b-form-checkbox
                            class="peg-list-check"
                            :checked="false"
                            disabled
                            ></b-form-checkbox>
                            <span>= not assessed.</span>
                        </div>
                        <div>Ticks do NOT imply supportive vs negative.</div>
                    </div>

                    <b-table
                        hover
                        small
                        responsive
                        class="peg-table"
                        :busy="$parent.listLoading"
                        :items="$parent.listRows"
                        :fields="$parent.listFields"
                        show-empty
                        empty-text="No entries in this study's list."
                    >
                        <template #table-busy>
                            <div class="text-center my-3">
                                <b-spinner small></b-spinner>
                                Loading list&hellip;
                            </div>
                        </template>

                        <!-- Fallback slots: apply to every list column. -->
                        <template #head()="h">
                            <span
                                v-if="h.field.desc"
                                v-b-tooltip.hover
                                :title="h.field.desc"
                                class="peg-has-desc"
                                >{{ h.label }}</span
                            >
                            <span v-else>{{ h.label }}</span>
                        </template>

                        <template #cell()="v">
                            <div
                                v-if="$parent.isBooleanValue(v.value)"
                                class="text-center"
                            >
                                <b-form-checkbox
                                    class="peg-list-check"
                                    :checked="$parent.isTrue(v.value)"
                                    disabled
                                ></b-form-checkbox>
                            </div>
                            <span v-else>{{ v.value }}</span>
                        </template>
                    </b-table>
                </div>
            </div>
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>

<style scope>
body.kp-default{
    height: 100vh !important;
}

.card-body{
    font-size: 14px;
}

/* Framework blurb under the studies-list heading. */
.peg-intro {
    margin-bottom: 0;
    max-width: 80ch;
}

/* PEGASUS sub-navigation, sits directly under the portal page header. */
.peg-nav {
    background-color: #33bbed;
    padding: 0.5rem;
}

.peg-nav-brand,
.peg-nav-brand:hover {
    display: flex;
    align-items: center;
    color: #fff;
    text-decoration: none;
}

.peg-nav-logo {
    height: 36px;
    width: auto;
    margin-right: 0.6rem;
}

.peg-logo {
    height: 100px;
    width: auto;
}

.peg-nav-title {
    font-size: 1.35rem;
    font-weight: 600;
    letter-spacing: 0.03em;
    line-height: 1;
    color: white;
}

.peg-nav-link {
    color: #fff !important;
    font-size: 0.9rem;
}

.peg-nav-link:hover,
.peg-nav-link:focus {
    color: #fff;
    text-decoration: underline;
}
/* Third column beside the study metadata: the list/matrix note plus the
   download control, so the matrix is easy to find from here. */
.peg-list-notes {
    border-left: 1px solid #dee2e6;
}

.peg-list-notes p {
    margin-bottom: 0.5rem;
    color: #6c757d;
}

/* Darken the caret half of the split button so the two halves read as
   separate controls. */
.peg-download-toggle.btn-secondary {
    background-color: #494f54;
    border-color: #494f54;
    box-shadow: inset 1px 0 0 rgba(255, 255, 255, 0.35);
}

.peg-download-toggle.btn-secondary:hover,
.peg-download-toggle.btn-secondary:focus {
    background-color: #3d4246;
    border-color: #3d4246;
}

/* Checkbox legend directly above the list table. Flex rather than inline text
   so the boxes centre against the type regardless of font size. */
.peg-list-legend {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: flex-end;
    font-size: 0.8rem;
    color: #6c757d;
    margin-bottom: 0.25rem;
}

/* Collapse the control to exactly the box, so align-items centres the box
   itself rather than a taller box-plus-offset. */
.peg-list-legend .peg-list-check.custom-control {
    height: 1rem;
    margin: 0 0.25rem 0 0.75rem;
}

.peg-list-legend .peg-list-check .custom-control-label::before,
.peg-list-legend .peg-list-check .custom-control-label::after {
    top: 0;
}

/* Columns that carry a PEG evidence-category definition. */
.peg-has-desc {
    border-bottom: 1px dotted currentColor;
    cursor: help;
}

/* Bootstrap defaults table cells to vertical-align: top. */
.peg-table tbody td {
    vertical-align: middle;
}

/* Bootstrap's custom-control reserves 1.5rem of left padding for the box and
   positions it at the far left, which leaves a label-less checkbox off-centre.
   Shrink the control to exactly the box so text-center actually centres it. */
.peg-list-check.custom-control {
    display: inline-block;
    min-height: 0;
    padding-left: 1rem;
}

.peg-study-details {
    font-size: 0.9rem;
    /* Keep the list table off the details above it. */
    margin-bottom: 1.75rem;
}

.peg-study-details dd {
    margin-bottom: 0;
}

.peg-list-check .custom-control-label::before,
.peg-list-check .custom-control-label::after {
    left: -1rem;
}
</style>
