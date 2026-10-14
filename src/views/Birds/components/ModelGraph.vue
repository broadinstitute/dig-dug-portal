<template>
  <svg id="viz" viewBox="-20 0 1260 810" role="img" aria-label="Biological model, data types, and inferential model" @mouseover="onModelOver" @mouseout="onModelOut" @mousemove="onModelMove">
    <defs>
      <marker id="arrowBio" viewBox="0 0 10 10" refX="10" refY="5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#2f789a"/>
      </marker>
      <symbol id="personFigure" viewBox="0 0 24 44">
        <circle cx="12" cy="7" r="5" fill="currentColor"/>
        <path d="M7 14 C5 14 3.5 16 3.5 18.5 V28 H7 V42 H11 V30 H13 V42 H17 V28 H20.5 V18.5 C20.5 16 19 14 17 14 Z" fill="currentColor"/>
      </symbol>
      <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="5" stdDeviation="7" flood-color="#1b3554" flood-opacity=".10"/>
      </filter>
      <linearGradient id="directIndirectFill" x1="0" x2="1">
        <stop offset="0%" stop-color="#eef5ff"/>
        <stop offset="50%" stop-color="#eef5ff"/>
        <stop offset="50%" stop-color="#faf3ff"/>
        <stop offset="100%" stop-color="#faf3ff"/>
      </linearGradient>
      <linearGradient id="directIndirectStroke" x1="0" x2="1">
        <stop offset="0%" stop-color="#2869c7"/>
        <stop offset="50%" stop-color="#2869c7"/>
        <stop offset="50%" stop-color="#7d3db6"/>
        <stop offset="100%" stop-color="#7d3db6"/>
      </linearGradient>
    </defs>
    <!-- Six-stage biological model from the MSKKP causal process. -->
    <g id="biologicalModelLine" aria-label="Biological model: causal variants to cell types or states to regulatory elements to genes to cellular function and molecular mechanism to organismal function">
      <text x="28" y="20" class="bioModelLabel">BIOLOGICAL MODEL</text>
      <path d="M200 65 L235 56" class="bioCausalPath"/>
      <path d="M200 101 L235 120" class="bioCausalPath"/>
      <path d="M425 56 L460 70" class="bioCausalPath"/>
      <path d="M425 120 L460 99" class="bioCausalPath"/>
      <path d="M710 83 H780" class="bioCausalPath"/>
      <path d="M1010 83 H1070" class="bioCausalPath"/>
      <g class="bioStage" data-bio-stage="variant" aria-label="Causal variants">
        <rect x="50" y="48" width="150" height="70" rx="13" class="bioStageBox"/>
        <text x="125" y="70" class="bioIconText">A/T</text>
        <line x1="125" y1="72" x2="125" y2="76" stroke="#e36c53" stroke-width="2"/>
        <text x="125" y="90" class="bioStageText"><tspan x="125">CAUSAL</tspan><tspan x="125" dy="13">VARIANT(S)</tspan></text>
      </g>

      <g class="bioStage" data-bio-stage="cell" aria-label="Cell types and cell states">
        <rect x="235" y="30" width="190" height="52" rx="13" class="bioStageBox"/>
        <circle cx="323" cy="46" r="8" fill="#bac6d2" stroke="#708296" stroke-width="1.5"/>
        <circle cx="335" cy="46" r="8" fill="#d2dbe4" stroke="#708296" stroke-width="1.5"/>
        <text x="330" y="68" class="bioStageText"><tspan x="330">CELL TYPES /</tspan><tspan x="330" dy="12">CELL STATES</tspan></text>
      </g>

      <g class="bioStage" data-bio-stage="regulatory" aria-label="Regulatory elements">
        <rect x="235" y="94" width="190" height="52" rx="13" class="bioStageBox"/>
        <path d="M312 112 H348 M316 111 C323 111 323 103 330 103 C337 103 337 111 344 111" fill="#eda04a" stroke="#9b6c3a" stroke-width="1.4"/>
        <text x="330" y="127" class="bioStageText"><tspan x="330">REGULATORY</tspan><tspan x="330" dy="12">ELEMENT(S)</tspan></text>
      </g>

      <g class="bioStage" data-bio-stage="gene" aria-label="Genes">
        <rect x="460" y="48" width="250" height="70" rx="13" class="bioStageBox"/>
        <line x1="566" y1="66" x2="604" y2="66" stroke="#708296" stroke-width="1.7"/>
        <rect x="573" y="61" width="25" height="10" fill="#566a80"/>
        <text x="585" y="96" class="bioStageText">GENE(S)</text>
      </g>

      <g class="bioStage" data-bio-stage="cellular" aria-label="Cellular function and molecular mechanism">
        <rect x="780" y="48" width="230" height="70" rx="13" class="bioStageBox"/>
        <path d="M885 69 L895 59 L906 69 M885 69 L906 69" fill="none" stroke="#708296" stroke-width="1.7"/>
        <circle cx="885" cy="69" r="4" fill="#8498aa"/><circle cx="895" cy="59" r="4" fill="#8498aa"/><circle cx="906" cy="69" r="4" fill="#8498aa"/>
        <text x="895" y="90" class="bioStageText"><tspan x="895">CELLULAR FUNCTION /</tspan><tspan x="895" dy="13">MOLECULAR MECHANISM</tspan></text>
      </g>

      <g class="bioStage" data-bio-stage="organismal" aria-label="Organismal function">
        <rect x="1070" y="48" width="150" height="70" rx="13" class="bioStageBox"/>
        <use href="#personFigure" x="1136" y="54" width="18" height="25" color="#60758d"/>
        <text x="1145" y="90" class="bioStageText"><tspan x="1145">ORGANISMAL</tspan><tspan x="1145" dy="13">FUNCTION</tspan></text>
      </g>
    </g>
    <g id="dataTypesLayer" transform="translate(0 37)" aria-label="Data types associated with biological stages">
      <text x="28" y="129" class="bioModelLabel">DATA TYPES</text>
      <g class="dataSource" data-source="associations" aria-label="Genetic associations: GWAS, ExWAS">
        <rect x="40" y="143" width="170" height="53" rx="11" class="bioDataBox"/>
        <text x="125" y="164" class="bioDataTitle">Genetic associations</text>
        <text x="125" y="181" class="bioDataExamples">(GWAS, ExWAS)</text>
      </g>
      <g class="dataSource" data-source="annotations" aria-label="Functional genomic annotations: enhancers, promoters">
        <rect x="216" y="143" width="228" height="53" rx="11" class="bioDataBox"/>
        <text x="330" y="164" class="bioDataTitle">Functional genomic annotations</text>
        <text x="330" y="181" class="bioDataExamples">(enhancers, promoters)</text>
      </g>
      <g class="dataSource" data-source="geneSets" aria-label="Gene annotations: pathways, processes">
        <rect x="805" y="143" width="180" height="53" rx="11" class="bioDataBox"/>
        <text x="895" y="164" class="bioDataTitle">Gene annotations</text>
        <text x="895" y="181" class="bioDataExamples">(pathways, processes)</text>
      </g>
    </g>
    <g id="observableTrait" aria-label="Organismal function leads to observable trait or disease">
      <path d="M1145 119 V226" class="bioTraitArrow" marker-end="url(#arrowBio)"/>
      <rect x="1070" y="226" width="150" height="50" rx="13" class="bioStageBox"/>
      <text x="1145" y="246" class="bioStageText"><tspan x="1145">OBSERVABLE</tspan><tspan x="1145" dy="15">TRAIT/DISEASE</tspan></text>
    </g>
    <g id="inferentialLayer" transform="translate(0 125)">
    <text x="28" y="142" class="bioModelLabel">INFERENTIAL MODEL</text>

    <g class="dataCombination" transform="translate(45 0)" aria-label="Functional genomic annotations and genetic associations are used together">
      <path d="M52 353 C10 353 10 239 52 239"/>
      <circle cx="20" cy="296" r="12"/>
      <text x="20" y="296">+</text>
    </g>

    <!-- Genetic associations -->
    <g class="data-layer dataSource stat-only" data-kind="data" data-source="associations" transform="translate(45 0)">
      <rect x="52" y="175" rx="16" ry="16" width="205" height="108" class="dataBox" filter="url(#softShadow)"/>
      <text x="155" y="201" class="dataText">Genetic associations</text>
      <line x1="82" y1="259" x2="226" y2="259" stroke="#ddb480" stroke-width="2"/>
      <g fill="#d6a66f">
        <circle cx="86" cy="249" r="4"/><circle cx="98" cy="243" r="4"/><circle cx="110" cy="252" r="4"/>
        <circle cx="122" cy="231" r="5" fill="#eda54b"/><circle cx="134" cy="217" r="6" fill="#dc872f"/>
        <circle cx="146" cy="211" r="6" fill="#b96a25"/><circle cx="158" cy="228" r="5" fill="#eda54b"/>
        <circle cx="170" cy="240" r="4"/><circle cx="182" cy="244" r="4"/><circle cx="194" cy="250" r="4"/>
      </g>
    </g>

    <!-- Functional genomic annotations -->
    <g class="data-layer dataSource stat-only" data-kind="data" data-source="annotations" transform="translate(45 0)">
      <rect x="52" y="300" rx="16" ry="16" width="205" height="108" class="dataBox" filter="url(#softShadow)"/>
      <text x="155" y="326" class="dataText">Functional genomic</text>
      <text x="155" y="343" class="dataText">annotations</text>
      <g fill="none" stroke="#b57a39" stroke-width="2" stroke-linecap="round">
        <path d="M92 374 H218"/>
        <path d="M111 365 V383 M196 365 V383"/>
      </g>
      <rect x="121" y="367" width="22" height="14" rx="4" fill="#f6bb69"/>
      <rect x="164" y="367" width="22" height="14" rx="4" fill="#e8924a"/>
    </g>

    <!-- Gene annotations -->
    <g class="data-layer dataSource stat-only" data-kind="data" data-source="geneSets" transform="translate(45 0)">
      <rect x="52" y="425" rx="16" ry="16" width="205" height="125" class="dataBox" filter="url(#softShadow)"/>
      <text x="155" y="452" class="dataText">Gene annotations</text>
      <g fill="#f2a23a" opacity=".82">
        <rect x="82" y="473" width="42" height="11" rx="5"/>
        <rect x="134" y="473" width="58" height="11" rx="5"/>
        <rect x="202" y="473" width="25" height="11" rx="5"/>
        <rect x="98" y="503" width="70" height="11" rx="5"/>
        <rect x="180" y="503" width="37" height="11" rx="5"/>
      </g>
    </g>

    <!-- gene nodes -->
    <g class="node gene positive" data-id="geneA" data-methods="falcon pigean eaggl" data-title="Gene A — direct support, positive effect" data-body="Gene A has direct genetic support and a positive inferred direction of effect." data-hover="Gene A's association with Trait T is supported by direct genetic evidence (for example from GWAS)">
      <circle cx="525" cy="220" r="38"/>
      <text x="525" y="216">GENE A</text><text x="525" y="234" class="subLabel">direct ↑</text>
    </g>
    <g class="node gene negative" data-id="geneB" data-methods="pigean eaggl" data-title="Gene B — indirect support, negative effect" data-body="Gene B has indirect support through shared biology and a negative inferred direction of effect." data-hover="Although Gene B is not directly associated with Trait T by GWAS, it is in many pathways that include Gene A, which has direct genetic associations with Trait T. Therefore, Gene B is relevant to Trait T via indirect evidence.">
      <circle cx="525" cy="400" r="38"/>
      <text x="525" y="396">GENE B</text><text x="525" y="414" class="subLabel">indirect ↓</text>
    </g>
    <g class="node gene positive" data-id="geneC" data-methods="falcon pigean eaggl" data-title="Gene C — direct and indirect support, positive effect" data-body="Gene C has the strongest combined direct and indirect support and a positive inferred direction of effect." data-hover="Gene C is associated with Trait T via both direct and indirect evidence.">
      <circle cx="650" cy="285" r="55"/>
      <text x="650" y="277">GENE C</text>
      <text x="650" y="295" class="subLabel">direct + indirect</text>
      <text x="650" y="312" class="subLabel">↑</text>
    </g>
    <g class="node gene neutral" data-id="geneD" data-methods="" data-title="Gene D" data-body="Gene D has little genetic or functional support in this example." data-hover="Gene D is not relevant to Trait T.">
      <circle cx="650" cy="515" r="29"/>
      <text x="650" y="519">GENE D</text>
    </g>

    <!-- mechanism bubbles -->
    <g class="node" data-id="mech1" data-methods="eaggl" data-title="Hepatic lipid and cholesterol transport" data-body="A latent genetic factor characterized by genes involved in hepatic lipid and cholesterol transport." data-hover="Proxies for genetically-anchored mechanisms for Trait T, defined by a set of genes with similar biological functions and genetic associations with Trait T. Factor labels are generated by LLMs using the top gene annotations.">
      <ellipse cx="895" cy="245" rx="125" ry="95" class="mechBubble" fill="#d8f2ec" stroke="#41a99e"/>
    </g>
    <g class="node" data-id="mech2" data-methods="eaggl" data-title="Interferon-driven myeloid activation" data-body="A latent genetic factor characterized by interferon response and myeloid activation genes." data-hover="Proxies for genetically-anchored mechanisms for Trait T, defined by a set of genes with similar biological functions and genetic associations with Trait T. Factor labels are generated by LLMs using the top gene annotations.">
      <ellipse cx="895" cy="415" rx="125" ry="102" class="mechBubble" fill="#d8f2ec" stroke="#41a99e"/>
    </g>
    <g class="node" data-id="mech3" data-methods="eaggl" data-title="MAPK-mediated cellular stress response" data-body="A latent genetic factor characterized by MAPK signaling and cellular stress-response genes." data-hover="Proxies for genetically-anchored mechanisms for Trait T, defined by a set of genes with similar biological functions and genetic associations with Trait T. Factor labels are generated by LLMs using the top gene annotations.">
      <ellipse cx="895" cy="535" rx="115" ry="80" class="mechBubble" fill="#d8f2ec" stroke="#41a99e"/>
    </g>

    <!-- edges / method paths -->
    <g id="edges" class="stat-only">
      <!-- Direct genetic support: annotations combine with associations upstream of the genes -->
      <path d="M302 227 L487.02 221.19" class="edge falcon supportHigh" data-method="falcon" data-arrow-width="5"/>
      <path d="M302 264 L595.1 281.69" class="edge falcon supportMedium" data-method="falcon" data-arrow-width="3.7"/>

      <!-- Indirect support: associated genes and gene annotations -> relevant genes -->
      <path d="M525 258 L525 362" class="edge pigean" data-method="pigean" data-arrow-width="2.1"/>
      <path d="M302 450 L487.92 408.31" class="edge dataEdge pigean supportHigh" data-method="pigean" data-arrow-width="5"/>
      <path d="M302 441 L599.81 307.5" class="edge dataEdge pigean supportLow" data-method="pigean" data-arrow-width="2.5"/>

      <!-- Latent genetic factors: associated and relevant genes -> latent factors -->
      <path d="M562.965 221.54 L771.57 230" class="edge eaggl membershipEdge loadingStrong" data-method="eaggl" data-arrow-width="5.2"/>
      <path d="M560.72 387.035 L795 302" class="edge eaggl membershipEdge loadingMedium" data-method="eaggl" data-arrow-width="3.3"/>
      <path d="M698.585 310.78 L790.21 359.4" class="edge eaggl membershipEdge loadingHigh" data-method="eaggl" data-arrow-width="4.3"/>
      <path d="M558.585 417.78 L780 535" class="edge eaggl membershipEdge loadingLow" data-method="eaggl" data-arrow-width="2.3"/>

    </g>

    <!-- Keep mechanism labels above overlapping bubbles and connecting arrows. -->
    <g id="mechanismLabels" pointer-events="none">
      <text x="895" y="210" class="factorNumber">Factor 1</text>
      <text x="895" y="232" class="mechText">Hepatic lipid &amp; cholesterol</text>
      <text x="895" y="251" class="mechText">transport</text>
      <text x="895" y="381" class="factorNumber">Factor 2</text>
      <text x="895" y="403" class="mechText">Interferon-driven</text>
      <text x="895" y="422" class="mechText">myeloid activation</text>
      <text x="895" y="500" class="factorNumber">Factor 3</text>
      <text x="895" y="522" class="mechText">MAPK-mediated cellular</text>
      <text x="895" y="541" class="mechText">stress response</text>
    </g>

    <g id="variableBrackets" aria-label="Observed variables and estimated variables">
      <path d="M97 620 V632 H302 V620" class="variableBracket"/>
      <text x="199.5" y="657" class="variableBracketLabel">Observed variables</text>
      <path d="M470 620 V632 H1025 V620" class="variableBracket"/>
      <text x="747.5" y="657" class="variableBracketLabel">Estimated variables</text>
    </g>

    <!-- People with Trait T, loosely stratified by the three overlapping mechanisms. -->
    <g id="traitPopulation" aria-label="People with Trait T stratified into overlapping mechanism groups">
      <g aria-label="People aligned with hepatic lipid and cholesterol transport">
        <use href="#personFigure" x="1068" y="198" width="27" height="49" color="#294f6b"/>
        <use href="#personFigure" x="1088" y="217" width="27" height="49" color="#54748a"/>
        <use href="#personFigure" x="1109" y="194" width="27" height="49" color="#7893a5"/>
        <use href="#personFigure" x="1130" y="219" width="27" height="49" color="#9bafbc"/>
        <use href="#personFigure" x="1151" y="199" width="27" height="49" color="#3e667f"/>
        <use href="#personFigure" x="1172" y="222" width="27" height="49" color="#bdcbd4"/>
      </g>
      <g aria-label="People overlapping the first and second mechanism groups">
        <use href="#personFigure" x="1098" y="269" width="27" height="49" color="#668898" opacity=".9"/>
        <use href="#personFigure" x="1121" y="277" width="27" height="49" color="#8ca5af" opacity=".9"/>
        <use href="#personFigure" x="1144" y="268" width="27" height="49" color="#456f7f" opacity=".9"/>
      </g>
      <g aria-label="People aligned with interferon-driven myeloid activation">
        <use href="#personFigure" x="1068" y="326" width="27" height="49" color="#405a78"/>
        <use href="#personFigure" x="1089" y="350" width="27" height="49" color="#6c829c"/>
        <use href="#personFigure" x="1110" y="327" width="27" height="49" color="#91a4b5"/>
        <use href="#personFigure" x="1131" y="352" width="27" height="49" color="#b4c1cc"/>
        <use href="#personFigure" x="1152" y="330" width="27" height="49" color="#526e89"/>
        <use href="#personFigure" x="1173" y="354" width="27" height="49" color="#8096a8"/>
      </g>
      <g aria-label="People overlapping the second and third mechanism groups">
        <use href="#personFigure" x="1098" y="409" width="27" height="49" color="#588587" opacity=".9"/>
        <use href="#personFigure" x="1121" y="417" width="27" height="49" color="#82a3a0" opacity=".9"/>
        <use href="#personFigure" x="1144" y="408" width="27" height="49" color="#396f73" opacity=".9"/>
      </g>
      <g aria-label="People aligned with MAPK-mediated cellular stress response">
        <use href="#personFigure" x="1068" y="472" width="27" height="49" color="#345d65"/>
        <use href="#personFigure" x="1089" y="496" width="27" height="49" color="#5f8084"/>
        <use href="#personFigure" x="1110" y="473" width="27" height="49" color="#88a3a2"/>
        <use href="#personFigure" x="1131" y="498" width="27" height="49" color="#afc0bd"/>
        <use href="#personFigure" x="1152" y="476" width="27" height="49" color="#477379"/>
        <use href="#personFigure" x="1173" y="500" width="27" height="49" color="#789796"/>
      </g>
    </g>

    </g>
  </svg>
</template>
<script>
import Vue from "vue";

export default Vue.component("modelgraph", {
  components: {
  },
  props: { method: { type: String, required: true } },
  data() { return { activeHover: null }; },
  mounted() { this.applyFocus(); },
  methods: {
    applyFocus() {
      const viz = this.$el;
      const method = this.method;
      const sourceMethods = {
        associations: ['falcon', 'pigean', 'eaggl'],
        annotations: ['falcon', 'pigean', 'eaggl'],
        geneSets: ['pigean', 'eaggl']
      };
      viz.classList.toggle('mechanisms-dimmed', method === 'falcon' || method === 'pigean');
      viz.querySelectorAll('.dataSource').forEach(source => {
        const active = method === 'all' || sourceMethods[source.dataset.source].includes(method);
        source.classList.toggle('focus-dim', !active);
      });
      viz.querySelectorAll('.node').forEach(node => {
        const active = method === 'all' || (node.dataset.methods || '').split(/\s+/).includes(method);
        node.classList.toggle('focus-dim', !active);
        node.classList.toggle('focus-node', method !== 'all' && active);
      });
      viz.querySelectorAll('.edge').forEach(edge => {
        const active = method === 'all' || edge.dataset.method === method ||
          (edge.dataset.methods || '').split(/\s+/).includes(method);
        edge.classList.toggle('focus-dim', !active);
        edge.classList.toggle('focus-edge', method !== 'all' && active);
      });
    },
    onModelOver(event) {
      const node = event.target.closest('.node');
      if (!node || !this.$el.contains(node) || node.contains(event.relatedTarget)) return;
      this.activeHover = node;
      this.$emit('show-tip', { text: node.dataset.hover || node.dataset.title || '', event });
    },
    onModelOut(event) {
      if (!this.activeHover || this.activeHover.contains(event.relatedTarget)) return;
      this.activeHover = null;
      this.$emit('hide-tip');
    },
    onModelMove(event) {
      if (this.activeHover) this.$emit('move-tip', event);
    }
  },
  watch: { method() { this.$nextTick(this.applyFocus); } },
});
</script>
<style>
@import url("/css/birdcss/revisions.css");
@import url("/css/birdcss/style.css");
</style>