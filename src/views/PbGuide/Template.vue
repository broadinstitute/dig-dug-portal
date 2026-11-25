<template>
    <div class="pb-docs">
        <portal-guide current="guide" />
        <div class="pb-docs-width pb-guide-layout">
            <aside>
                <nav class="pb-guide-toc" aria-label="On this page">
                    <strong>On this page</strong>
                    <a v-for="section in sections" :key="section.id" :href="'#' + section.id"
                       :aria-current="activeSection === section.id ? 'location' : null">
                        {{ section.label }}
                    </a>
                    <a class="pb-guide-source-link" href="/pb_sources.html">Data Sources</a>
                </nav>
            </aside>

            <main class="pb-guide-content">
                <h1>Guide</h1>
                <section id="overview" aria-labelledby="overview-title">
                    <div class="pb-guide-overview-header">
                        <h2 id="overview-title">Overview</h2>
                        <a :href="pdfUrl" download>Download quick guide (PDF)</a>
                    </div>
                    <figure class="pb-guide-pdf">
                        <figcaption class="pb-guide-pdf-toolbar">
                            <strong>Quick guide</strong>
                            <span aria-label="Page 1 of 1">1 / 1</span>
                            <a :href="pdfUrl" target="_blank" rel="noopener"
                               aria-label="Open full PDF in a new tab" title="Open full PDF">
                                <b-icon-arrows-fullscreen aria-hidden="true" />
                            </a>
                        </figcaption>
                        <img src="/guides/quick_guide_en_preview.png" width="700" height="495"
                             alt="Quick guide showing how Home connects searches to the Phenotype, Gene, Variant, and Sample pages. The walkthroughs below explain each path.">
                    </figure>
                </section>

                <section id="phenotype" aria-labelledby="phenotype-title">
                    <h2 id="phenotype-title">Phenotype</h2>
                    <p>Find samples with a recorded feature and explore the projects, genes, and disease references associated with that search.</p>
                    <img class="pb-guide-control" src="/guides/guide-phenotype-controls.png" width="1353" height="70" loading="lazy"
                         alt="Phenotype search has an Include menu, a search field, and separate Search and Advanced search buttons.">
                    <ol>
                        <li>Enter a phenotype name or HPO ID, such as <strong>Seizure</strong> (<code>HP:0001250</code>). Select a suggestion, or enter the exact ID and choose <strong>Search</strong>.</li>
                        <li>Start with the number of matching samples and <strong>Projects with matching samples</strong>. A search can also include more specific terms in the HPO hierarchy.</li>
                        <li>Use <strong>Advanced search</strong> to include or exclude terms and refine the project or matching rule. Open a sample ID or gene symbol to explore the details.</li>
                    </ol>
                    <p class="pb-guide-note">Disease references describe published associations. The matching sample count comes from CRDC records.</p>
                    <a class="pb-guide-example" href="/pb_phenotype.html?query=HP%3A0001250">Try the Seizure example</a>
                </section>

                <section id="gene" aria-labelledby="gene-title">
                    <h2 id="gene-title">Gene</h2>
                    <p>See which variants were observed in a gene and explore its associations with recorded phenotypes.</p>
                    <img class="pb-guide-control" src="/guides/guide-gene-controls.png" width="223" height="54" loading="lazy"
                         alt="Gene search field with GJB2 entered beside the Search button.">
                    <ol>
                        <li>Enter a gene symbol such as <code>GJB2</code> and choose <strong>Search</strong>.</li>
                        <li>Start with <strong>Variants observed in the CRDC</strong>. Select a consequence or ClinVar category in the overview to filter the variant list. To look up a feature, use <strong>Find a phenotype</strong> under <strong>Single-phenotype associations</strong>.</li>
                        <li>Open a variant ID for variant-level evidence, or expand its row to see the carrier summary and available sample links.</li>
                    </ol>
                    <h3>Test a custom HPO profile</h3>
                    <p>In <strong>Test a phenotype profile</strong>, add one or more phenotype names or HPO IDs and choose <strong>Apply</strong>. The browser calculates <strong>rPheRS</strong>, a weighted score for how closely each sample’s recorded features match the profile, adjusted for how many HPO terms are documented for that sample.</p>
                    <p>A positive <strong>β</strong> means a higher genetic risk score (GRS) for the gene is associated with a higher profile score. β is measured in rPheRS standard deviations per 0.1 increase in GRS. A <strong>95% CI</strong> that spans zero leaves the direction uncertain. <strong>q</strong> adjusts P for testing multiple genes for that profile.</p>
                    <a class="pb-guide-example" href="/pb_gene2.html?query=GJB2">Try the GJB2 example</a>
                </section>

                <section id="variant" aria-labelledby="variant-title">
                    <h2 id="variant-title">Variant</h2>
                    <p>Look up the annotation for a specific variant and see how it appears in CRDC.</p>
                    <img class="pb-guide-control" src="/guides/guide-variant-controls.png" width="398" height="43" loading="lazy"
                         alt="Variant search field with a GRCh38 variant ID entered beside the Search button.">
                    <ol>
                        <li>Enter a GRCh38 variant ID in <code>chr:pos:ref:alt</code> format, such as <code>chr13:20189546:AC:A</code>, or enter an <code>rsID</code>. Choose <strong>Search</strong>.</li>
                        <li>Check the variant identity, ClinVar annotation, and gnomAD frequency at the top. Then review <strong>Carrier phenotypes</strong> to see the features recorded in CRDC.</li>
                        <li>Follow the gene link to see related variants. Where sample links are available, open one to explore that sample.</li>
                    </ol>
                    <h3>Test a custom HPO profile</h3>
                    <p>In the carrier samples section, open <strong>Phenotype profile</strong>, add one or more HPO terms, and choose <strong>Apply</strong>. This compares how closely selected carriers and eligible noncarriers match the same profile.</p>
                    <p>A positive <strong>β</strong> means selected carriers tend to score higher after adjustment, with the difference measured in rPheRS standard deviations. A positive <strong>Mean carrier rPheRS Z</strong> means scored carriers average above the full scoring cohort. <strong>P</strong> is unadjusted. With few scored carriers, treat the result as exploratory.</p>
                    <a class="pb-guide-example" href="/pb_variant.html?query=chr13%3A20189546%3AAC%3AA">Try the variant example</a>
                </section>

                <section id="sample" aria-labelledby="sample-title">
                    <h2 id="sample-title">Sample</h2>
                    <p>Review one sample’s recorded phenotypes, variant evidence, and prioritized findings when available.</p>
                    <img class="pb-guide-control" src="/guides/guide-sample-controls.png" width="621" height="60" loading="lazy"
                         alt="Sample page tabs for Phenotype profile, Variant profile, and Prioritized findings.">
                    <ol>
                        <li>Open a sample ID from a result table, or enter a CRDC sample ID in <strong>Sample search</strong>. Access to CRDC sample records depends on your authorization.</li>
                        <li>Start with <strong>Phenotype profile</strong> and <strong>Variant profile</strong>. Use <strong>Prioritized findings</strong> when available.</li>
                        <li>Open a phenotype, gene, or variant link to see evidence for that item in the rest of the cohort.</li>
                    </ol>
                    <a class="pb-guide-example" href="/pb_sample.html?fixture=1">Open an example with illustrative data</a>
                </section>
            </main>
        </div>
    </div>
</template>

<script>
import { BIconArrowsFullscreen } from 'bootstrap-vue';
import PortalGuide from '@/components/pb/PortalGuide.vue';
import './docs.css';

const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'phenotype', label: 'Phenotype' },
    { id: 'gene', label: 'Gene' },
    { id: 'variant', label: 'Variant' },
    { id: 'sample', label: 'Sample' },
];

export default {
    name: 'PbGuide',
    components: { BIconArrowsFullscreen, PortalGuide },
    data: () => ({
        activeSection: 'overview',
        pdfUrl: '/guides/quick_guide_en.pdf',
        sections,
    }),
    mounted() {
        const linkedSection = sections.find(section => '#' + section.id === window.location.hash);
        if (linkedSection) document.getElementById(linkedSection.id).scrollIntoView();
        this.updateActiveSection();
        window.addEventListener('scroll', this.updateActiveSection, { passive: true });
        window.addEventListener('resize', this.updateActiveSection);
        window.addEventListener('hashchange', this.updateActiveSection);
    },
    beforeDestroy() {
        window.removeEventListener('scroll', this.updateActiveSection);
        window.removeEventListener('resize', this.updateActiveSection);
        window.removeEventListener('hashchange', this.updateActiveSection);
    },
    methods: {
        updateActiveSection() {
            this.activeSection = sections.reduce((active, section) => {
                return document.getElementById(section.id).getBoundingClientRect().top <= 94 ? section.id : active;
            }, 'overview');
        },
    },
};
</script>
