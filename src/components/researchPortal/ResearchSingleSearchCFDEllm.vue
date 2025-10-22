<template>
	<div>
		<div class="search-underlay" @click="unFocus"></div>
		<div class="byor-single-search-wrapper">
			<div class="search-underlay-close-note" @click="unFocus">close search <b-icon icon="x-circle-fill"></b-icon></div>
			<div v-if="!searchInitiated" class="search-help" style="flex-direction: column;">
				<strong style="font-size:1.2em; color:#f26822">Find multi-omic Common Fund data, analyses, and program knowledge.</strong>
				<strong>With this LLM enhanced search, you can:</strong>
				<div>Ask about the Common Fund, its Centers, or its Programs.</div>
				<div>Tell me what you're researching or curious about.</div>
				<div>Just describe what youre looking for.</div>
			</div>
			<div v-if="searchInitiated" class="search-results" style="gap:40px">
				<!--
				<div v-if="singleSearchResult">
					<pre style="display:none">{{ singleSearchResult }}</pre>
					<div v-if="singleSearchResult.genes.length>0">
						<div v-for="gene in singleSearchResult.genes">{{ gene }}</div>
					</div>
					<div v-if="singleSearchResult.tissue.length>0">
						<div v-for="tissue in singleSearchResult.tissue">{{ tissue }}</div>
					</div>
					<div v-if="singleSearchResult.genes.length>0">
						<div v-for="disease in singleSearchResult.disease">{{ disease }}</div>
					</div>
				</div>
				-->
				<div v-if="llmResults" style="display:flex; flex-direction: column; gap:20px">
					<!--
					<div v-if="llmResults.info" class="search-result-box">
						<div>
							<strong>Info: </strong>{{ llmResults.info }}
						</div>
						<div>[run RAG info search]</div>
					</div>
					-->
					<div style="display:grid; gap:20px; grid-template-columns: 1fr 1fr;">
						<div v-if="llmResults.programs" class="search-result-box" style="display:flex; flex-direction: column; gap:5px">
							<strong>Suggested CFDE Programs:</strong>
							<div v-for="program in llmResults.programs" style="display:flex; flex-direction: column;">
								<div style="display:grid; grid-template-columns: 1fr 2fr; gap: 10px;">
									<strong>{{ program.name }}</strong> 
									<div style="display:flex; justify-content: flex-end; gap: 10px">
										<a :href="kcURL(`/r/kc_programs?DCC=${program.id}`)">program snapshot</a>
										<a :href="programLinks[program.id]" target="_blank">data portal</a>
									</div>
								</div>
								<div>{{ program.reason }}</div>
							</div>
						</div>
						<div v-if="llmResults.discovery" class="search-result-box">
							<strong>Knowledge Center Discovery: </strong>
							<div>See evidence-backed hypotheses about the biology behind your research interest:</div>
							<div style="text-align: center; font-family: serif; font-size: 1.4em; padding: 10px; font-style: italic;">{{ llmResults.discovery }}</div>
							<div>
								Using pre-computed genetic associations between 6,000 common & rare disease phenotypes 
								and 150,000 gene expression signatures from various CFDE Programs.
							</div>
							<div style="margin: 10px 0 0">
								<a :href="kcURL(`/r/cfde_reveal?query=${llmResults.discovery}`)" target="_blank">mechanism discovery</a>
							</div>
						</div>
					</div>
					<div style="display:flex; gap:20px">
						<div v-if="llmResults.gene?.name" class="search-result-box">
							<div>
								<strong>Gene: </strong>{{ llmResults.gene.name }}
							</div>
							<div><a :href="kcURL(`/r/kc_entity_gene?gene=${llmResults.gene.name}`)">gene info from cfde programs</a></div>
							<div><a :href="kcURL(`/r/kc_gene_set_browser?model=cfde&gene=${llmResults.gene.name}`)">gene set ↔ phenotype associations</a></div>
							<div><a :href="kcURL(`/r/kc_gene_set_browser_gene?model=cfde&gene=${llmResults.gene.name}`)">phenotype associations</a></div>
							<div><a :href="kcURL(`/r/kc_dge_gene?gene=${llmResults.gene.name}`)">tissue associations</a></div>
						</div>
						<div v-if="llmResults.phenotype?.name" class="search-result-box">
							<div>
								<strong>Phenotype: </strong>{{ llmResults.phenotype.name }}
							</div>
							<div v-if="semanticPhenotypes">
								<div v-for="item in semanticPhenotypes" style="display:flex; flex-direction: column;">
									<div>{{ item.description }}</div>
									<div><a :href="kcURL(`/r/kc_gene_set_browser_phenotype?model=cfde&phenotype=${llmResults.phenotype.name}`)">associated cfde gene sets</a></div>
									<div><a :href="kcURL(`/r/kc_phenotype_x_hs2mouse?phenotype=${llmResults.phenotype.name}`)">associated mouse phenotypes</a></div>
								</div>
							</div>
						</div>
						<div v-if="llmResults.tissue?.name" class="search-result-box">
							<div>
								<strong>Tissue: </strong>{{ llmResults.tissue.name }}
							</div>
							<div v-if="availableTissues">
								<div v-for="item in availableTissues"  style="display:flex; flex-direction: column;">
									<div>{{ item.label }}</div>
									<div><a :href="kcURL(`/r/kc_dge_tissue?tissue=${item.value}`)">differential expression by tissue</a></div>
								</div>
							</div>
							<div v-else>
								no results found
							</div>
						</div>
						<div v-if="llmResults.disease?.name" class="search-result-box">
							<div>
								<strong>Disease: </strong>{{ llmResults.disease.name }}
							</div>
							<div v-if="availableDiseases">
								<div v-for="item in availableDiseases"  style="display:flex; flex-direction: column;">
									<div>{{ item.label }}</div>
									<div><a :href="kcURL(`/r/kc_entity_disease?disease=${item.value}`)">disease info from cfde programs</a></div>
								</div>
							</div>
							<div v-else>
								no results found
							</div>
						</div>
					</div>
					
				</div>
			</div>
			<!--
			<span v-if="summaryAll.length > 0 && hasFocus" class="btn btn-default ss-summary-popup-btn"
				@click="summaryPopup = !summaryPopup ? true : null;">Toggle quick view <b-icon
					icon="arrow-up-right-square"></b-icon></span>
			-->
			<!--
			<span class="ss-search-methods" v-if="!!singleSearchConfig && !!singleSearchConfig['search by meaning enabled']">
				<span>Search by: </span>
				<span class="search-method">
					<input type="radio" id="ss_keyword" name="ssSearchMethods" value="ss_keyword" v-model="singleSearchMethod" checked />
					<label for="ss_keyword">Keyword</label>
				</span>
				<span class="search-method">
					<input type="radio" id="ss_meaning" name="ssSearchMethods" value="ss_meaning" v-model="singleSearchMethod" />
					<label for="ss_meaning">Meaning</label>
				</span>
			</span>
			-->
			<template v-if="singleSearchMethod == 'ss_keyword'"> 
				<input class="form-control byor-single-search" type="text" id="byor_single_search" v-model="singleSearchParam"
					:placeholder="!hasFocus?'Click here to begin':''" @keyup.enter="onSearch" @focus="onFocus" @blur="onBlur"
					autocomplete="off" />
				<div style="position:absolute; top:50%; right:10px; transform: translateY(-50%);">
					<div v-if="singleSearchParam && !isLoading" class="reset-search" @click="resetSearch()">
						clear search <b-icon icon="backspace-fill"></b-icon>
					</div>
					<div v-if="isLoading" class="loading"></div>
				</div>
				
			</template>
			<!--
			<template v-if="!!singleSearchConfig && !!singleSearchConfig['search by meaning enabled'] && singleSearchMethod == 'ss_meaning'">
				<select v-model="meaningSearchParam" id="ss_meaning_param" class="form-control ss-meaning-params">
					<option v-for="(param, paramIndex) in singleSearchConfig['search by meaning parameters']"
					:value="param.parameter">{{ param.label }}</option>
				</select>
				<select v-model="meaningSearchScore" id="ss_meaning_score" class="form-control ss-meaning-sim-score" title="Similarity score" >
					<option value="0.01">0.01</option>
					<option value="0.1">0.1</option>
					<option value="0.2">0.2</option>
					<option value="0.3">0.3</option>
					<option value="0.4">0.4</option>
					<option value="0.5" selected>0.5</option>
					<option value="0.6">0.6</option>
					<option value="0.7">0.7</option>
					<option value="0.8">0.8</option>
					<option value="0.9">0.9</option>
					<option value="1">1</option>
				</select>
				<input class="form-control byor-single-search meaning-search" type="text" id="byor_single_search" v-model="singleSearchParam"
					:placeholder="'Search by meaning'" @focus="onFocus" @blur="onBlur"
					autocomplete="off" />
				<span v-if="!!singleSearchParam" class="btn btn-default get-meaning-options" @click="getMeaningOptions()">
					Search <b-icon icon="search"></b-icon>
				</span>
				<span v-if="!!singleSearchParam" class="btn btn-default reset-search meaning-reset-search" @click="resetSearch()">
					<b-icon icon="x-circle-fill"></b-icon>
				</span>
			</template>
			-->

			<!--
			<div class="byor-single-search-results-wrapper" v-if="!!singleSearchConfig && singleSearchMethod == 'ss_keyword'">
				<div id="byor_single_search_results" class="byor-single-search-results-groups" v-if="anyResults() > 0">
					
					<div class="byor-ss-results-section" id="kp_gene_options" v-if="singleSearchResult.genes.length > 0">
						<div class="byor-ss-results-section-title">GENES</div>
						<div v-for="(gene, gIndex) in singleSearchResult.genes" :key="gene" class="">
							<div v-if="!!isParameterActive('kp genes').active && !!isParameterActive('kp genes').options"
								class="single-search-option search-gene-link" @mouseover="getVerticalPos('kp_gene_options','kp_gene_option_'+gIndex)"
							>
								{{ gene }}
								<span class="more-options">
									<div class="ss-options-wrapper" :id="'kp_gene_option_'+gIndex">
										<div v-for="option in isParameterActive('kp genes').options">
											<span>
												<a :href="(option.url) ? option.url + gene : 'javascript:;'" 
													class="ss-explore">
													{{option['url label'] }}
												</a>
												<span v-if="!!option.url && !!option.sections"> | </span>
												<a href="javascript:;" 
													class="ss-generate-summary"
													@click="generateSummary(gene, option['summary id'], option['summary label'], option.sections)"
												>
													{{option['summary label'] }}
												</a>
											</span>
										</div>
									</div>
								</span>
							</div>
							<span class="search-word-group" style="display:none">{{'Gene'}}</span>
						</div>
					</div>

					<template
						v-if="!!isParameterActive('kp phenotypes').active && !!isParameterActive('kp phenotypes').options && singleSearchResult.phenotypes.length>0"
						>
						<div id="kp_phenotypes_options" class="byor-ss-results-section">
							<div class="byor-ss-results-section-title">GENE SET PHENOTYPES</div>
							<div v-for="(phenotype, pIndex) in singleSearchResult.phenotypes" 
								:value="phenotype.name"
								:key="phenotype.name"
							>
								<div class="single-search-option" @mouseover="getVerticalPos('kp_phenotypes_options','kp_phenotypes_option_'+pIndex)">
									{{phenotype.description}}
									<span class="more-options">
										<div class="ss-options-wrapper" :id="'kp_phenotypes_option_'+pIndex">
											<div v-for="option in isParameterActive('kp phenotypes').options">
												<span>
													<a :href="(option.url) ? option.url + phenotype.name : 'javascript:;'"
														class="ss-explore"
														>
														{{ option['url label'] }}
													</a>
													<span v-if="!!option.url && !!option.sections"> | </span>
													<a href="javascript:;" 
														class="ss-generate-summary"
														@click="generateSummary(phenotype.name, option['summary id'], option['summary label'], option.sections)"
													>
														{{option['summary label'] }}
													</a>
												</span>
											</div>
										</div>
									</span>
								</div>
								<span class="search-word-group" style="display:none">{{phenotype.group}}</span>
							</div>
						</div>
					</template>

					<template v-for="param in singleSearchConfig['search parameters']">
						<template v-if="!param.values || (!!param.values && param.values != 'kp genes' && param.values != 'kp phenotypes')">
							<template v-if="!!isParameterActive(param['parameter']).active && singleSearchResult[param['parameter']].length>0">
								<div :id="param['parameter']+'_options'" class="byor-ss-results-section">
									<div class="byor-ss-results-section-title">{{ param['label'] }}</div>
									<div v-for="(item,itemIndex) in singleSearchResult[param['parameter']]">

										<div class="single-search-option" @mouseover="getVerticalPos(param['parameter']+'_options',param['parameter']+'_option_'+itemIndex)">
											{{item.label}}
											<span class="more-options">
												<div class="ss-options-wrapper" :id="param['parameter']+'_option_'+itemIndex">
													<div v-for="option in isParameterActive(param['parameter']).options">
														<span>
															<a :href="(option.url) ? option.url + item.value : 'javascript:;'"
																class="ss-explore"
															>
															{{ option['url label'] }}
															</a>
															<span v-if="!!option.url && !!option.sections"> | </span>
															<a href="javascript:;" 
																class="ss-generate-summary"
																@click="generateSummary(item.value, option['summary id'], option['summary label'], option.sections)"
															>
																{{option['summary label'] }}
															</a>
														</span>
													</div>
												</div>
											</span>
										</div>
									</div>
								</div>
							</template>
						</template>
					</template>
				</div>
			</div>
			-->
			<div class="byor-single-search-results-wrapper" v-if="!!singleSearchConfig && !!singleSearchConfig['search by meaning enabled'] && singleSearchMethod == 'ss_meaning'">
				<div id="byor_single_search_results" style="top: 75px;" class="byor-single-search-results-groups" v-if="meaningSearchOptions.length > 0 && meaningSearchOptions[0].value != ''">
					<div :id="meaningSearchParam+'_meaning_options'" class="byor-ss-results-section ss-meaning-search">
						<div class="byor-ss-results-section-title">{{  }}</div>
							<div v-for="(item,itemIndex) in meaningSearchOptions">
								<div class="single-search-option" @mouseover="getVerticalPos(meaningSearchParam+'_meaning_options',meaningSearchParam+'_'+itemIndex)">
									{{item.label}}{{ ' (' + item.score + ')' }}
									<span class="more-options">
										<div class="ss-options-wrapper" :id="meaningSearchParam+'_'+itemIndex">
											<div v-for="option in isParameterActive(meaningSearchParam).options">
												<span>
													<a :href="(option.url) ? option.url + item.value : 'javascript:;'"
														class="ss-explore"
													>
													{{ option['url label'] }}
													</a>
													<span v-if="!!option.url && !!option.sections"> | </span>
													<a href="javascript:;" 
														class="ss-generate-summary"
														@click="generateSummary(item.value, option['summary id'], option['summary label'], option.sections)"
													>
														{{option['summary label'] }}
													</a>
												</span>
											</div>
										</div>
									</span>
								</div>

								<!--<span class="search-word-group">{{param['parameter']}}</span>-->
							</div>
						</div>
				</div>
				<div v-else-if="meaningSearchOptions.length === 1 && meaningSearchOptions[0].value == ''">
					<div id="byor_single_search_results" style="top: 75px;" class="byor-single-search-results-groups">
						<div class="byor-ss-results-section ss-meaning-search">
							<div> 
								<div class="single-search-option">
									{{ meaningSearchOptions[0].label }}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div id="summary_popup" :class="(!!summaryPopup) ? 'ss-summary-popup' : 'ss-summary-popup hidden'">
				<span class="btn btn-default ss-summary-hide" @click="summaryPopup = !summaryPopup ? true : null;"><b-icon
						icon="arrow-down-left-square"></b-icon></span>
				<h4>Search quick view</h4>

				<div class="summary-content">
					<div v-for="item in summaryAll" v-html="item.data">
					</div>
				</div>
			</div>

		</div>
	</div>
</template>

<script>
import Vue from "vue";
import { match } from "@/utils/bioIndexUtils";
import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";
import alertUtils from "@/utils/alertUtils";
import EventBus from "@/utils/eventBus";
import { createLLMClient } from "@/utils/llmClient";
import { kcURL } from "@/utils/cfdeUtils";

export default Vue.component("research-single-search-cfde-llm", {
	props: ["singleSearchConfig", "phenotypes", "utils", "fromNav"],
	modules: {},

	data() {
		return {
			llmSearch: null,
			searchPrompt: `You help users discover available resources from the **Common Fund Data Ecosystem (CFDE)** as the **CFDE Knowledge Center (KC)**.

			Your job is to:

			* **Infer intent** from short search queries and **return intermediate results** (clickable options) that guide users to primary results (pages/tools/datasets).
			* **Extract any entities** (gene, tissue, phenotype, disease), and **rank relevant CFDE programs** by likely usefulness.

			Users may search by:

			* **Genes**, **Tissues**, **Phenotypes**, **Diseases**
			* General info about the **Common Fund**, its **Centers**, or **Programs**
			* A short free-text **research interest** or **data need**

			---

			## Types of results available on the KC (targets for discovery)

			* **CFDE Info** — RAG-enabled info about the Common Fund, its Centers, and its Programs.
			* **Gene Page** — secondary analyses for a given gene from various CFDE programs.
			* **Disease Page** — secondary analyses for a given disease from various CFDE programs.
			* **Differential Expression by Tissue** — genes differentially expressed in a tissue.
			* **Differential Expression by Phenotype** — genes differentially expressed for a phenotype.
			* **Gene Sets associated to Phenotypes** — curated or computed gene sets.
			* **Mechanism Discovery Tool** — finds pre-computed associations between phenotypes and CFDE-derived gene expression signatures; proposes mechanistic hypotheses tied to the user’s context.

			---


			### Parsing & Inference Guidelines

			* **general_info**: if the query matches CFDE/Center/Program names or patterns like 'what is|who|overview|about|help'
			* **research_discovery**: if the query has verbs like 'why|how|mechanism|pathway|regulate|affects|causes|signature|biomarker|association' or causal phrasing appear

			### Entity extraction & normalization (best effort, no web calls)

			* **Gene**: prefer HGNC symbols (case-sensitive). If ambiguous, keep user text.
			* **Disease/Phenotype**: preserve user phrasing; avoid over-normalization.
			* **Tissue**: preserve user phrasing (e.g., “left ventricle”, “kidney cortex”).
			* If an entity is not clearly present, set it to **'null'**.

			### Phenotype extraction from approximate phrasing

			* If the query contains terms that could describe a phenotype (e.g., "energy balance", "insulin resistance", "cardiac output", "inflammatory response"), set phenotype.name to the most salient phrase.

			### Output discipline

			* Use the **exact JSON** schema below.
			* Strings that are not applicable must be **'null'**, not empty "".
			* 'programs' must be **relevance-ordered** (most relevant first). Include **3–6** items with concise reasons.

			---

			## Output schema (multiple intents)
			{
				"info": null,
				"discovery": null,
				"gene": { "name": null },
				"phenotype": { "name": null },
				"tissue": { "name": null },
				"disease": { "name": null },
				"programs": [
					{ "name": "GTEx", "id": "GTEx", "relevance": 1, "reason": "…" }
				]
			}

			**Rules:**

			* If any intent is 'general_info', put the user's request in 'info'; else 'null'. Do not answer the users question, simply copy it here (you may fix obvious spelling errors).
			* If any intent is 'research_discovery', put the user's question in 'discovery'; else 'null'. Do not rephrase the users query, simply copy it here (you may fix obvious spelling errors).
			* Entities: extracted value or 'null'.
			* Phenotype: if the query includes phenotype-like phrasing, set phenotype.name to the most salient phrase (even if the inference is not entity_lookup). Otherwise null.
			* 'programs': 3–6 items, '1' = most relevant, with brief, concrete reasons (data type, modality, population, atlas, or signature match).

			---

			## CFDE Programs (neutral, info-dense)

			### **4DN (4D Nucleome)** 
			id: 4DN
			The 4D Nucleome project investigates how the spatial and temporal organization of DNA within the nucleus influences gene regulation and cellular function. It integrates genomics, epigenomics, transcriptomics, and imaging data to model chromatin structure and dynamics across cell types and disease states. The 4DN portal provides thousands of standardized datasets, analytical pipelines, and visualization tools for exploring genome architecture in 3D.

			### **A2CPS (Acute to Chronic Pain Signatures)** 
			id: A2CPS
			A2CPS seeks to identify molecular, physiological, and neuroimaging biomarkers that predict which individuals will develop chronic pain following surgery. The consortium collects multimodal data—including omics (genomics, proteomics, metabolomics, lipidomics, transcriptomics), quantitative sensory testing, and functional MRI—from over 3,000 participants. Its goal is to define biosignatures of pain susceptibility and resilience to improve early diagnosis and intervention.

			### **Bridge2AI** 
			id:Bridge2AI
			Bridge2AI unites biomedical and artificial intelligence communities to generate ethically sourced, AI-ready datasets and tools that follow FAIR principles. Its projects span voice biomarker discovery, diabetes cohort studies, intensive care data integration, and AI-driven cellular mapping. Bridge2AI emphasizes interoperability, workforce development, and the creation of multimodal datasets linking genomics, imaging, and clinical data for machine learning applications.

			### **exRNA (Extracellular RNA Communication Program)** 
			id: exRNA
			The exRNA program investigates extracellular RNAs and their carriers (e.g., extracellular vesicles, lipoproteins) to define their roles in intercellular communication, biomarker discovery, and therapeutics. It provides the exRNA Atlas and Explorer with human and mouse small/long RNA‑seq and qPCR profiles from diverse biofluids and phenotypes, plus tools for deconvolution, differential expression, and interactive visualization. These resources support study design, methods benchmarking, and discovery of exRNA-based disease signatures.

			### **GlyGen**
			id: GlyGen
			GlyGen integrates and harmonizes multi‑source glycoscience data on glycans, glycoproteins, proteins, and enzymes to enable cross‑database discovery. The portal supports queries by glycan structure/composition, protein, enzyme, organism, disease, and biomarker, linking glycosylation sites to functions, pathways, and 3D structures. It offers downloads and APIs to power analyses in glycomics, glycoproteomics, and translational biomarker research.

			### **GTEx (Genotype-Tissue Expression Project)**
			id: GTEx
			GTEx explores how genetic variation influences gene expression across diverse human tissues. By combining genomics, transcriptomics, and eQTL mapping, it provides a foundational reference for understanding gene regulation and tissue specificity. The GTEx Portal supports variant-gene association studies and integrative analyses linking genetic variation to disease mechanisms.

			### **HuBMAP (Human BioMolecular Atlas Program)**
			id: HuBMAP
			HuBMAP aims to create detailed 3D maps of the human body at single-cell resolution. It integrates imaging, spatial transcriptomics, and proteomics to chart cell types, neighborhoods, and tissue organization across organs. The resulting human reference atlas supports research on tissue microenvironments, cellular interactions, and organ-level function in health and disease.

			### **IDG (Illuminating the Druggable Genome)**
			id: IDG
			The IDG program aims to expand knowledge of understudied proteins that are potentially druggable, including GPCRs, kinases, and ion channels. It integrates functional genomics, proteomics, and cheminformatics to characterize protein function and disease associations. The resource supports drug discovery by revealing novel therapeutic targets and mechanisms.

			### **Kids First (Gabriella Miller Kids First Pediatric Research Program)**
			id: Kids First
			The Kids First Data Resource Center focuses on uncovering the genetic causes of childhood cancers and structural birth defects. It integrates whole-genome sequencing, RNA-seq, and phenotype data from thousands of pediatric patients and families. The portal enables cross-disease analysis to identify shared biological mechanisms and supports researchers studying developmental disorders and pediatric oncology.

			### **LINCS (Library of Integrated Network-based Cellular Signatures)**
			id: LINCS
			LINCS systematically characterizes cellular responses to genetic and chemical perturbations. Using transcriptomic and proteomic profiling, it builds a reference network linking molecular perturbations to phenotypic outcomes. The LINCS data portal supports computational modeling, drug repurposing, and systems-level understanding of cellular behavior under diverse conditions.

			### **Metabolomics Workbench**
			id: Metabolomics
			The Metabolomics Workbench provides access to comprehensive metabolomic datasets, standards, and analytical tools. It supports mass spectrometry and NMR-based studies of metabolites across species, tissues, and conditions. The repository facilitates data sharing, reproducibility, and integration with genomics and proteomics to advance systems biology and biomarker discovery.

			### **MoTrPAC (Molecular Transducers of Physical Activity Consortium)**
			id: MoTrPAC
			MoTrPAC seeks to map the molecular responses to physical activity across tissues and populations. Through genomics, proteomics, metabolomics, lipidomics, and epigenomics, it identifies molecular transducers that mediate the health benefits of exercise. Its datasets provide insights into how exercise influences metabolism, inflammation, and organ function.

			### **SenNet (Cellular Senescence Network)**
			id: SenNet
			SenNet aims to identify, characterize, and map senescent cells across human tissues to understand their roles in aging and disease. It integrates single-cell omics, spatial transcriptomics, and imaging to profile senescence-associated markers and pathways. The network produces reference atlases to guide research into cellular aging, regeneration, and age-related pathologies.

			### **SMaHT (Somatic Mosaicism across Human Tissues Network)**
			id: SMaHT
			SMaHT aims to systematically map somatic variation across human tissues and life stages to understand how mosaic mutations influence normal biology and disease risk. The network generates reference catalogs, standards, and computational pipelines using modalities such as whole‑genome sequencing, single‑cell and spatial assays, and complementary multi‑omics. Resulting resources enable studies of tissue homeostasis, aging, and predisposition to disorders linked to somatic mutations.

			### **SPARC (Stimulating Peripheral Activity to Relieve Conditions)**
			id: SPARC
			SPARC seeks to map the neural circuits that regulate organ function to inform bioelectronic medicine. It integrates neuroanatomical imaging, electrophysiology, transcriptomics, and computational modeling to elucidate nerve-organ interactions. The SPARC Portal provides data and tools for studying how peripheral nerve stimulation can modulate physiological systems and treat chronic diseases.

			---

			## Examples

			### Example 1 — “PPARG in adipose”
			{
				"info": null,
				"discovery": null,
				"gene": { "name": "PPARG" },
				"phenotype": { "name": null },
				"tissue": { "name": "adipose" },
				"disease": { "name": null },
				"programs": [
					{ "name": "GTEx", "id": "GTEX", "relevance": 1, "reason": "tissue-specific gene expression and eQTLs in adipose for PPARG" },
					{ "name": "HuBMAP", "id": "HuBMAP", "relevance": 2, "reason": "single-cell and spatial context for adipose cell types" },
					{ "name": "IDG", "id": "IDG", "relevance": 3, "reason": "target annotations and ligand/target associations" },
					{ "name": "Metabolomics Workbench", "id": "Metabolomics", "relevance": 4, "reason": "metabolic readouts relevant to adipose biology" }
				]
			}

			### Example 2 — “insulin resistance mechanisms”
			{
				"info": null,
				"discovery": "insulin resistance mechanisms",
				"gene": { "name": null },
				"phenotype": { "name": "insulin resistance" },
				"tissue": { "name": null },
				"disease": { "name": null },
				"programs": [
					{ "name": "GTEx", "id": "GTEx", "relevance": 1, "reason": "expression and eQTLs across metabolic tissues" },
					{ "name": "Metabolomics Workbench", "id": "Metabolomics", "relevance": 2, "reason": "metabolite signatures linked to insulin resistance" },
					{ "name": "LINCS", "id": "LINCS", "relevance": 3, "reason": "perturbation signatures to infer mechanisms/repurposing" },
					{ "name": "IDG", "id": "IDG", "relevance": 4, "reason": "candidate targets with druggability context" }
				]
			}

			### Example 3 — “What programs focus on extracellular biomarkers?”
			{
				"info": "What programs focus on extracellular biomarkers?",
				"discovery": null,
				"gene": { "name": null },
				"phenotype": { "name": null },
				"tissue": { "name": null },
				"disease": { "name": null },
				"programs": [
					{ "name": "exRNA", "id": "exRNA", "relevance": 1, "reason": "biofluid exRNA biomarkers and visualization tools" },
					{ "name": "Metabolomics Workbench", "id": "Metabolomics", "relevance": 2, "reason": "biofluid metabolite biomarkers and analysis" },
					{ "name": "LINCS", "id": "LINCS", "relevance": 3, "reason": "perturbation signatures to nominate biomarkers" }
				]
			}
			`,
			isLoading: false,
			llmResults: null,
			semanticPhenotypes: null,
			availableTissues: null,
			availableDiseases: null,

			searchInitiated: false,
			singleSearchParam: null,
			singleSearchMethod: 'ss_keyword',
			singleSearchResult: {
				genes: [],
				phenotypes: [],
				tissues: [],
				diseases: []
			},
			customList: {},
			summary: [],
			summarySearch: [],
			summaryByKey: [],
			summaryAll: [],
			summaryPopup: null,
			summaryPopupContent: "",
			hasFocus: false,
			meaningSearchScore: 0.5,
			meaningSearchParam: null,
			meaningSearchOptions: [],

			programLinks: {
				"4DN": "https://data.4dnucleome.org/",
				"A2CPS": "https://a2cps.org/researchers/accessing-our-data/",
				"Bridge2AI": "https://bridge2ai.org/datasets/",
				"exRNA": "https://exrna-atlas.org/",
				"GlyGen": "https://data.glygen.org/",
				"GTEx": "https://gtexportal.org/home/",
				"HuBMAP": "https://portal.hubmapconsortium.org/",
				"IDG": "https://pharos.nih.gov/",
				"Kids First": "https://portal.kidsfirstdrc.org/",
				"LINCS": "https://maayanlab.cloud/sigcom-lincs/#/MetadataSearch/Datasets",
				"Metabolomics": "https://www.metabolomicsworkbench.org/data/index.php",
				"MoTrPAC": "https://motrpac-data.org/data-download",
				"SenNet": "https://data.sennetconsortium.org/search",
				"SMaHT": "https://data.smaht.org/",
				"SPARC": "https://sparc.science/data?type=dataset"
			}
		};
	},
	created() {
		this.llmSearch = createLLMClient({
            llm: "openai",
            model: "gpt-5-nano",
            system_prompt: this.searchPrompt
        });

		if (!!this.singleSearchConfig && !!this.singleSearchConfig["search parameters"]) {

			this.singleSearchConfig["search parameters"].map(S => {
				if (!!S["data point"]) {
					let listPoint = S["data point"];
					this.getList(
						S["parameter"],
						listPoint["url"],
						listPoint["data type"],
						listPoint["data wrapper"]
					)
				} else if (!!S["values"] && (S["values"] != "kp genes" && S["values"] != "kp phenotypes")) {
					this.customList[S["parameter"]] = S["values"];
				}
			})
		} else {
			this.getTissues();
		}

		if(!!this.singleSearchConfig && !!this.singleSearchConfig["search by meaning parameters"]) {
			this.meaningSearchParam = this.singleSearchConfig["search by meaning parameters"][0]['parameter'];
		}
	},
	mounted() { 
		//listens for search event from nav component
		EventBus.$on('activate-search', this.onFocus);
	},
	beforeDestroy() {
		EventBus.$off('activate-search');
	},
	computed: {},
	watch: {
		summary(summaryArr) {
			this.updateSummary();
		},
		summarySearch(searchArr) {
			this.updateSummary();
		},
		singleSearchParam(PARAM) {
			return;

			if(this.singleSearchMethod == 'ss_keyword') {
				if (!!PARAM && PARAM.length >= 2) {

					let paramWords = PARAM.split(" ");
					
					this.lookupGenes(PARAM);
					// in case there is custom searchConfig, make sure kp gene search is there. Otherwise, gene search is active in default.
					/*
					if (!!this.singleSearchConfig && !!this.singleSearchConfig["search parameters"]) {

						let isKpGenes = null;

						this.singleSearchConfig["search parameters"].map(S => {
							if (!!S["values"] && S["values"] == "kp genes") {
								isKpGenes = true
							}
						})

						if (!!isKpGenes) { this.lookupGenes(PARAM); }

						let isKpPhenotypes = null;

						this.singleSearchConfig["search parameters"].map(S => {
							if (!!S["values"] && S["values"] == "kp phenotypes") {
								isKpPhenotypes = true
							}
						})

						if (!!isKpPhenotypes) {

							let searchPhenotypes = [];

							this.phenotypes.map((p) => {
								let isInPhenotype = 0;
								paramWords.map((w) => {
									if (
										!!p.description
											.toLowerCase()
											.includes(w.toLowerCase())
									) {
										isInPhenotype++;
									}
								});

								if (isInPhenotype == paramWords.length) {
									searchPhenotypes.push(p);
								}
							});

							let shorterFirst = searchPhenotypes.sort((a, b) => a.name.length - b.name.length);

							this.singleSearchResult.phenotypes = shorterFirst;
						}

					} else {
						this.lookupGenes(PARAM);
					}
					*/


					/// for custom parameters
					let searchFields = Object.keys(this.customList);


					
					searchFields.map(P => {

						let searchItems = [];
						this.customList[P].map(item => {
							let isInList = 0;

							paramWords.map((w) => {
								if (
									!!item.label
										.toLowerCase()
										.includes(w.toLowerCase())
								) {
									isInList++;
								}
							});

							if (isInList == paramWords.length) {
								searchItems.push(item);
							}
						})
						this.singleSearchResult[P] = searchItems;
					})

					//console.log({searchFields})
					//console.log(this.singleSearchResult)
					
				} else {
					this.singleSearchResult.genes = [];
					this.singleSearchResult.phenotypes = [];
					let searchFields = Object.keys(this.customList);
					this.summaryAll = [];
					this.summaryPopup = false;
					searchFields.map(P => {
						this.singleSearchResult[P] = [];
					})
				}
			}
			
		},
	},
	methods: {
		kcURL,
		...alertUtils,
		getVerticalPos(WRAPPER,TARGET) {
			let wrapper = document.getElementById(WRAPPER);
			let vPos = (wrapper)? wrapper.scrollTop * -1 : 0;
			document.getElementById(TARGET).style.setProperty('top', vPos+'px');
		},
		/*
		kcURL(path){
			const isLocalhost = window.location.hostname === 'localhost';
  
			if (isLocalhost) {
				// Extract pageid and query params
				const match = path.match(/^\/r\/([^?]+)\?(.*)$/);
				if (!match) return path;

				const pageid = match[1];
				const query = match[2];
				return `/research.html?pageid=${pageid}&${query}`;
			} else {
				// Production URL
				return path;
			}
		},
		*/
		getMeaningOptions() {

			const dataPoint = this.singleSearchConfig["search by meaning parameters"].filter( P => P.parameter == this.meaningSearchParam )[0]['data point'];

			let queryString = dataPoint.url;
			queryString += dataPoint.parameters['search phrase']+'='+this.singleSearchParam;
			queryString += (!!dataPoint.parameters['similarity score'])? '&'+dataPoint.parameters['similarity score']+'='+this.meaningSearchScore:'';

			async function getOptions(query) {

				const response = await fetch(query).then(resp => resp.json());

				if (!response.error) {
					return response;
				} else {
					throw new Error(`Request failed with status ${response.status}`);
				}
			}

			getOptions(queryString)
				.then(data => {

					let options = data;
					if(!!dataPoint['data wrapper']) {
						dataPoint['data wrapper'].map(M => {
							options = options[M]
						})
					}

					let displayOptions = [];
					const val = dataPoint.display.value, label = dataPoint.display.label, score = dataPoint.display.score;

					options.map(O => {
						displayOptions.push({
							'value':O[val],
							'label':O[label],
							'score':O[score]
						})
					})

					if(options.length === 0) {
						displayOptions.push({
							'value':'',
							'label':'No results found. Please try adjusting the similarity score or searching for a different term.',
							'score':''
						})
					}

					this.meaningSearchOptions = displayOptions;
				})
				.catch(error => console.error('Error fetching options:', error));
		},
		updateSummary() {
			//First get the list of keys searched

			let searchedKeys = [...new Set(this.summarySearch.map(s => s.key))].sort();

			this.summaryByKey = [];
			this.summaryAll = [];

			searchedKeys.map(s => {
				let keySearched = this.summarySearch.filter(ss => ss.key == s);
				let sId = keySearched[keySearched.length - 1].id;

				this.summary.map(sItem => {

					if (sItem.key == s) {
						this.summaryAll.push(sItem);

						if (sItem.id == sId) {
							this.summaryByKey.push(sItem);
						}
					}
				})
			})
		},
		generateSummary(KEY, ID, HEADER, sections) {

			//Set summaryPopup true

			this.summaryPopup = true;

			let ifSearched = this.summarySearch.filter(search => search.key == KEY && search.id == ID);

			if (ifSearched.length === 0) {
				sections.map(section => {
					switch (section['data point'].type) {
						case 'bioindex':
							this.getBiSummary(section, ID, KEY)
							break;
					}
				})

				this.summarySearch = [];

				this.summarySearch.push({ key: KEY, id: ID });
			} else {
				let notSearched = this.summarySearch.filter(search => search.key != KEY || search.id != ID);
				notSearched.push(ifSearched[0]);
				this.summarySearch = notSearched;
				console.log("item already searched")
			}

		},
		async getBiSummary(CONFIG, ID, KEY) {

			let fetchUrl = CONFIG['data point'].url;

			CONFIG['data point'].parameters.map(parameter => {
				fetchUrl = fetchUrl.replace('$' + parameter, KEY)
			})

			let summary = await fetch(fetchUrl).then(resp => resp.json());

			if (summary.error == null && !!Array.isArray(summary.data) && summary.data.length > 0) {

				let filteredData = [...new Set(summary.data)]

				/// adding filtering option
				if(CONFIG['pre filters']) {

					CONFIG['pre filters'].map(filter =>{
						switch (filter['type']) {
							case 'filter out':
								filter['values'].map(value =>{
									filteredData = filteredData.filter(i => i[filter['field']] != value);
								})
								break;

							case 'search':
								filteredData = filteredData.filter(i => !!filter['values'].includes(i[filter['field']]));

								break;
						}
					})
				}
				
				///

				summary.data = filteredData;

				let summaryHeader = "<b class='summary-data-header'>" + CONFIG["summary text"] + "</b><br />";

				CONFIG['data point'].parameters.map(parameter => {
					summaryHeader = summaryHeader.replace('$' + parameter, KEY)
				})

				let summaryData = "";

				summaryData += "<div class='summary-row'>";

				for (let j = 0; j < CONFIG['summary columns'].length; j++) {
					summaryData += "<span class='summary-column-header'>" + CONFIG['summary columns'][j].header + "</span>"
				}

				summaryData += "</div>";

				let rowsLimit = (!!CONFIG['summary rows'] && CONFIG['summary rows'] <= summary.data.length) ? CONFIG['summary rows'] : summary.data.length;

				for (let i = 0; i < rowsLimit; i++) {
					summaryData += "<div class='summary-row'>";
					for (let j = 0; j < CONFIG['summary columns'].length; j++) {

						console.log("CONFIG['summary columns'][j]", CONFIG['summary columns'][j]);

						let columnContent = (!!CONFIG['summary columns'][j].format) ? this.utils.Formatters.ssColumnFormat(summary.data[i],
							CONFIG['summary columns'][j].format,
							summary.data[i][CONFIG['summary columns'][j].field])
							: summary.data[i][CONFIG['summary columns'][j].field];
						summaryData += "<span class='summary-column'>" + columnContent + "</span>"
					}

					summaryData += "</div>";
				}

				summaryData = summaryHeader + summaryData;

				this.summary.push({ key: KEY, id: ID, data: summaryData });

			} else {
				let summaryHeader = "<b class='summary-data-header'>" + CONFIG["summary text"] + "</b><br />";

				CONFIG['data point'].parameters.map(parameter => {
					summaryHeader = summaryHeader.replace('$' + parameter, KEY)
				})

				summaryHeader += "<div class='summary-row'>N/A</div>"

				this.summary.push({ key: KEY, id: ID, data: summaryHeader });

			}
		},

		resetSearch() {
			this.singleSearchParam = null;
			this.llmResults = null;
			this.searchInitiated = false;
			this.semanticPhenotypes = null;
			this.availableTissues = null;
			this.availableDiseases = null;

			let keys = Object.keys(this.singleSearchResult);

			keys.map(key => {
				this.singleSearchResult[key] = [];
			})

			this.summaryPopup = false;
			this.summaryAll = [];
			this.meaningSearchOptions = [];
		},

		async getTissues() {

			let tissues1 = await fetch(`${BIO_INDEX_HOST}/api/bio/keys/gene-expression-tissue/1`)
				.then(resp => resp.json())
				.then(json => {
					if (json.count == 0) {
						return null;
					}

					let tissues = json.keys.map(key => key[0].replaceAll("_", " "))

					return tissues;
				});

			let tissues2 = await fetch(`${BIO_INDEX_HOST}/api/bio/keys/partitioned-heritability-top-tissue/2`)
				.then(resp => resp.json())
				.then(json => {
					if (json.count == 0) {
						return null;
					}

					let tissues = json.keys.map(key => key[0])

					return tissues;
				});

			//return tissues;
			if (!!tissues1 && tissues2) {
				let tissues = tissues1.concat(tissues2);

				let uniqueList = [...new Set(tissues)];

				let tissuesList = [];
				uniqueList.map(tissue => {
					let labelString = tissue.charAt(0).toUpperCase() + tissue.slice(1);
					let tempObj = { label: labelString, value: tissue.replaceAll(" ", "_") };

					tissuesList.push(tempObj)
				});
				this.customList["tissues"] = tissuesList;
			}
		},
		anyResults() {
			let parameters = Object.keys(this.singleSearchResult)

			let totalResults = 0;
			parameters.map(p => {
				totalResults += this.singleSearchResult[p].length;
			})

			return totalResults;
		},

		async findSemanticPhenotypes(term){
			const url = `https://api.kpndataregistry.org:8000/api/search/phenotypes?q=${encodeURIComponent(term)}&similarity_threshold=-0.1`
            const response =  await fetch(url);

            if (!response.ok) {
                new Error("Fetch error:" + response.statusText);
                return;
            }

            const res = await response.json();
            const data = res.data;

			const matches = data.filter(item => item.score > 0.9);

			if(matches.length===1){
				console.log(`found best match with a score of ${matches[0].score}`);
				return matches;
			}else if(data.length > 10){
                console.log('more than 10 phenotypes returned, sorting by score and trimming to 10 max');
                data.sort((a, b) => b.score - a.score);
                data.splice(10);
				return data;
            }
		},

		findMatchingEntity(entity, term){
			const paramWords = entity.split(" ");
			const searchFields = Object.keys(this.customList);
			searchFields.map(P => {
				const searchItems = [];
				this.customList[P].map(item => {
					let isInList = 0;

					paramWords.map((w) => {
						if (
							!!item.label
								.toLowerCase()
								.includes(w.toLowerCase())
						) {
							isInList++;
						}
					});

					if (isInList == paramWords.length) {
						searchItems.push(item);
					}
				})
				this.singleSearchResult[P] = searchItems;
			})
			if(term==='tissue' && this.singleSearchResult.tissue.length>0){
				return this.singleSearchResult.tissue;
			}
			if(term==='disease' && this.singleSearchResult.disease.length>0){
				return this.singleSearchResult.disease;
			}
			return null;
		},

		parseLLMResponse(rawString) {
            //parses llm text response to json object
            const cleanString = rawString.replace(/```json|```/g, '').trim()
            try {
                return JSON.parse(cleanString)
            } catch (e) {
                console.error('Failed to parse LLM JSON:', e)
                return []
            }
        },
		async onExtractResponse(response){
			this.isLoading = false;
			//this.llmExtractState = '';
            console.log('onResponse', response);
            if(response){
                const json = this.parseLLMResponse(response);
                console.log('response json', json);
				this.llmResults = json;
				if(this.llmResults.phenotype.name){
					this.semanticPhenotypes = await this.findSemanticPhenotypes(this.llmResults.phenotype.name);
				}
				if(this.llmResults.tissue.name){
					this.availableTissues = this.findMatchingEntity(this.llmResults.tissue.name, 'tissue');
				}
				if(this.llmResults.disease.name){
					this.availableDiseases = this.findMatchingEntity(this.llmResults.disease.name, 'disease')
				}
			}
		},
		onExtractError(error){
			this.isLoading = false;
            //this.llmExtractState = error;
            console.log('onError', error);
            //this.updateStep(this.search_step, 'error', error.message);
        },


		onSearch() {
			this.searchInitiated = true;
			//return;
			this.isLoading = true;
			this.llmSearch.sendPrompt({
                userPrompt: this.singleSearchParam,
                //onToken: this.onExtractToken,
                onResponse: this.onExtractResponse,
                //onState: this.onExtractState,
                onError: this.onExtractError,
                //onEnd: this.onExtractEnd
            });

			return;
			let searchKey = this.singleSearchParam;
			if (
				!!this.singleSearchParam.includes("rs") ||
				!!this.singleSearchParam.includes(":")
			) {

				searchKey = searchKey.replace(/,/g, "").trim();

				if (!!this.singleSearchParam.includes("-")) {
					let chr = searchKey.split(":")[0];
					let region = searchKey.split(":")[1].split("-");

					let regionPageUrl =
						"/region.html?chr=" +
						chr +
						"&end=" +
						region[1] +
						"&start=" +
						region[0];

					this.singleSearchParam = "";
					location.href = regionPageUrl;
				} else {
					location.href = "/variant.html?variant=" + searchKey;
				}
			} else if (
				!!this.singleSearchParam.includes("_") &&
				!!this.singleSearchParam.includes("-")
			) {
				//on search for a variant in chr3_12489012-C-T format
				location.href = "/variant.html?variant=" + searchKey;
			} else {
				let anyResults = this.anyResults();

				if (anyResults === 0) {
					alertUtils.popAlert("Your search term was not found. Please try again.")
				} else if (anyResults === 1) {

					let reDirectUrl;

					if (!this.singleSearchConfig) {

						for (const [sKey, sValue] of Object.entries(this.singleSearchResult)) {
							if (sValue.length == 1) {
								switch (sKey) {
									case 'phenotypes':
										reDirectUrl = "/phenotype.html?phenotype=" + sValue[0].name;
										break;
									case 'genes':
										reDirectUrl = "/gene.html?gene=" + sValue[0];
										break;
									case 'tissues':
										reDirectUrl = "/tissue.html?tissue=" + sValue[0].value;
										break;
									case 'diseases':
										reDirectUrl = "/disease.html?disease=" + sValue[0].value;
										break;
								}
							}
						}

						location.href = reDirectUrl;
					}

				} else if (anyResults > 1) {
					alertUtils.popAlert("Multiple search options are available. Please select one from the list.")
				}
			}
		},
		onFocus() {
			console.log('search focus');
			document.querySelector('.search-underlay').classList.add('focus');
			document.querySelector('.byor-single-search-wrapper').classList.add('focus');
			if(this.fromNav) document.querySelector('.byor-single-search-wrapper').classList.remove('hidden');
			this.hasFocus = true;
			//if(this.summaryAll.length>0) this.summaryPopup = true;
		},
		unFocus(){
			document.querySelector('.search-underlay').classList.remove('focus');
			document.querySelector('.byor-single-search-wrapper').classList.remove('focus');
			if(this.fromNav) document.querySelector('.byor-single-search-wrapper').classList.add('hidden');
			this.hasFocus = false;
			//this.summaryPopup = false;
		},
		onBlur() {
			console.log('seach blur');
		},

		isParameterActive(PARAM) {

			let returnParam = { active: null, url: '', options: null };

			if (!!this.singleSearchConfig && this.singleSearchMethod == 'ss_keyword') {
				this.singleSearchConfig["search parameters"].map(param => {
					if (param.values == PARAM) {
						returnParam.active = true;

						if (!!param['target page']) {
							if (!!param['target page']['page id']) {
								returnParam.url = '/research.html?pageid='
									+ param['target page']['page id'];
							} else if (!!param['target page']['url']) {
								returnParam.url = param['target page']['url'];
							}

							returnParam.url += (!!param['target page']['entity']) ? '&' + param['target page']['entity parameter'] + '=' + param['target page']['entity'] : "";

							if (!!param['target page']['page id']) {
								returnParam.url += '&' + param['parameter'] + '=';
							} else if (!!param['target page']['url']) {
								returnParam.url += param['parameter'] + '=';
							}
						}


						if (!!param.options) {
							returnParam.options = param.options;
						}

					} else {
						if (param.parameter == PARAM) {
							returnParam.active = true;

							if (!!param['target page']) {
								if (!!param['target page']['page id']) {
									returnParam.url = '/research.html?pageid='
										+ param['target page']['page id'];
								} else if (!!param['target page']['url']) {
									returnParam.url = param['target page']['url'];
								}

								returnParam.url += (!!param['target page']['entity']) ? '&' + param['target page']['entity parameter'] + '=' + param['target page']['entity'] : "";

								if (!!param['target page']['page id']) {
									returnParam.url += '&' + param['parameter'] + '=';
								} else if (!!param['target page']['url']) {
									returnParam.url += param['parameter'] + '=';
								}
							}

							if (!!param.options) {
								returnParam.options = param.options;
							}
						}
					}
				})
			} else if(!!this.singleSearchConfig && this.singleSearchMethod == 'ss_meaning') {
				this.singleSearchConfig["search by meaning parameters"].map(param => {
					if (param.parameter == PARAM) {
						returnParam.active = true;

						if (!!param['target page']) {
							if (!!param['target page']['page id']) {
								returnParam.url = '/research.html?pageid='
									+ param['target page']['page id'];
							} else if (!!param['target page']['url']) {
								returnParam.url = param['target page']['url'];
							}

							returnParam.url += (!!param['target page']['entity']) ? '&' + param['target page']['entity parameter'] + '=' + param['target page']['entity'] : "";

							if (!!param['target page']['page id']) {
								returnParam.url += '&' + param['parameter'] + '=';
							} else if (!!param['target page']['url']) {
								returnParam.url += param['parameter'] + '=';
							}
						}

						if (!!param.options) {
							returnParam.options = param.options;
						}
					}
				})
			}

			return returnParam;

		},
		async getList(PARAM, URL, TYPE, WRAPPER) {
			if (!!URL) {

				let paramList = await fetch(URL).then((resp) => resp.json());
				let list;

				if (paramList.error == null) {

					if (typeof paramList == "string") {
						paramList = (TYPE == "json") ? JSON.parse(paramList) : (TYPE == "csv") ? this.utils.dataConvert.csv2Json(paramList) : paramList;
					}
					if (!!WRAPPER) {

						let dataEntity = paramList;

						WRAPPER.map(w => {
							dataEntity = dataEntity[w];
						})

						if (typeof dataEntity == "string") {
							dataEntity = (TYPE == "json") ? JSON.parse(dataEntity) : (TYPE == "csv") ? this.utils.dataConvert.csv2Json(dataEntity) : dataEntity;
						}

						let values = [];

						if (dataEntity.length > 0) {
							dataEntity.map(item => {
								if (typeof item == 'string' || typeof item == 'number') {
									values.push({ "label": item, "value": item })
								} else if (typeof item == 'object' && !!Array.isArray(item)) {
									values.push({ "label": item[0], "value": item[0] })
								} else if (typeof item == 'object' && !Array.isArray(item)) {
									values.push(item);
								}
							})
						}

						list = values;

					} else {
						list = paramList
					}
					this.customList[PARAM] = list;

				} else {
					console.log("there is an error");
				}
			}

		},
		async searchGene(KEY) {

			let geneSymbol = await this.utils.regionUtils.geneSymbol(KEY);
			let isCustomGene = this.isParameterActive('kp genes');

			if (geneSymbol) {

				let genePageUrl;

				if (!isCustomGene.active) {
					genePageUrl = "/gene.html?gene=" + geneSymbol;
				} else if (!!isCustomGene.active) {
					genePageUrl = isCustomGene.url + geneSymbol;
				}

				location.href = genePageUrl;
			}
		},

		async searchRegion(KEY) {
			let region = await this.utils.regionUtils.parseRegion(KEY, true, 50000);
			let isCustomRegion = this.isParameterActive('kp region');

			if (region) {
				let regionPageUrl;

				if (!isCustomRegion.active) {
					regionPageUrl =
						"/region.html?chr=" +
						region.chr +
						"&end=" +
						region.end +
						"&start=" +
						region.start;
				} else if (!!isCustomRegion.active) {
					regionPageUrl = isCustomRegion.url +=
						region.chr +
						":" +
						region.start +
						"-" +
						region.end;
				}

				location.href = regionPageUrl;
			}
		},

		async lookupGenes(input) {
			let matches = await match("gene", input, { limit: 10 });
			this.singleSearchResult.genes = matches;
		},
	},
});
</script>

<style scoped>
.loading {
    background: #eee;
    border: 2px solid black;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    z-index: 1;
    border-bottom-color: transparent;
    animation: rotation 1s linear infinite;
}
@keyframes rotation {
    0% {transform: rotate(0deg);}
    100% {transform: rotate(360deg);}
}

/* alert UI */
#byor_single_search{
	border-radius: 10px;
	padding:20px;
}

.search-underlay {
    background: #f7f6f6;
    position: fixed;
    width: 100vw;
    height: 100vh;
    top: 0;
    left: 0;
    z-index: 1000;
    opacity: .925;
	display: none;
}
.search-underlay-close-note {
    position: absolute;
    left: 50%;
    top: -30px;
    transform: translateX(-50%);
	display:none;
	font-size:12px;
	width: 100%;
    text-align: right;
    padding: 0 10px;
	cursor: pointer;
}
.search-help {
    position: absolute;
    left: 50%;
    top: 75px;
    transform: translateX(-50%);
	display:none;
	width:100%;
	padding: 0 10px;
}
.search-results {
    position: absolute;
    top: 75px;
    left: 50%;
    transform: translateX(-50%);
    display: none;
    width: 100vw;
    min-width: 100%;
    max-width: 1400px;
    padding: 0 60px;
}
.search-result-box{
	margin: 0 0 10px;
	flex: 1;
	background: #eee;
	padding: 20px;
	border-radius: 20px;
}
.search-underlay.focus{
	display:block;
}
.byor-single-search-wrapper.focus{
	z-index:2000;

	.byor-single-search-results{
		display:block;
	}
	.byor-single-search-results-groups{
		display:flex;
	}
	.ss-summary-popup:not(.hidden){
		display:block;
	}
	.search-underlay-close-note{
		display:block;
	}
	.search-help,
	.search-results{
		display:flex;
	}
}

.reset-search {
	position: relative;
	top: 0;
	right: 0;
	color: #999999;
	font-size: 14px;
	width: max-content;
	cursor: pointer;
}

.reset-search:hover {
	color: #333333;
}

.ss-summary-hide{
	position: absolute;
	top: 4px;
	right: 4px;
}

.byor-single-search-wrapper {
	width: 100%;
	position: relative;
}

.byor-single-search {
	width: 100%;
	margin-left: auto;
	margin-right: auto;
}

.byor-single-search-results-wrapper {
	position: relative;
	margin-left: auto;
	margin-right: auto;
}

.byor-single-search-results {
	display:none;
	position: absolute;
	width: 100%;
	background-color: #fff;
	font-size: 14px;
	z-index: 100;
	padding: 10px 15px;
	border-radius: 0.25rem;
	box-shadow: 10px 10px 10px 10px rgba(0, 0, 0, 0.2);
	/*overflow-y: scroll;
	max-height: 500px;*/
	text-align: left;
	height: auto;
}

.byor-single-search-results-groups {
	display:none;
	justify-content: flex-start;
	gap:10px;
	position: absolute;
	min-width: 100%;
    width: auto;
    max-width: 90vw;
    transform: translateX(-50%);
    left: 50%;
	background-color: #f7f6f6;
	font-size: 14px;
	z-index: 100;
	padding: 10px;
	height: auto;
	border-radius: 10px;
}
.byor-ss-results-section {
	min-width: 100px;
    width: max-content;
    max-width: 300px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    height: 300px;
    overflow-y: auto;
	background-color: white;
	padding: 10px;
	border-radius: 10px;
}

.byor-ss-results-section.ss-meaning-search {
	width: auto !important;
	margin: auto;
}

.byor-ss-results-section:only-child{
	width: -webkit-fill-available;
	max-width: unset;
}
.byor-ss-results-section-title{
	font-weight: bold;
	text-transform: uppercase;
	font-size: 14px;
}
.more-options {
    position: fixed;
    z-index: 1;
    margin: -5px 0 0;
}
div.single-search-option{
	color:#ff6600;
	cursor: default;
	padding: 0 2px;
}
div.single-search-option:hover{
	background:#ff6600;
	color: white;
	border-radius: 5px;
}
.single-search-option{
	padding-right:10px;
}
.single-search-option:hover {
	/*border-bottom: solid 2px #dddddd;
	margin-bottom: -2px;
	padding-right: 50px;*/
	border-bottom: 0;
	margin-bottom: 0;
}

.single-search-option .ss-options-wrapper {
	display: none;
	position: absolute;
	background-color: #fff;
	z-index: 101;
	border: solid 1px #dddddd;
	border-radius: 5px;
	white-space: nowrap;
	padding: 5px 15px;
	margin-left: 5px;
	box-shadow: 5px 5px 5px 5px rgba(0, 0, 0, 0.2);
}

.single-search-option:hover .ss-options-wrapper {
	display: inline-block;
}

.search-word-group {
	color: #cccccc;
	font-size: 12px;
	display: block;
	float: right;
	text-transform: capitalize;
}

.search-gene-link {
	position: relative;
}

.search-gene-link .gene-link-tip {
	display: none;
	position: absolute;
	text-decoration: none;
	white-space: nowrap;
	background-color: #00000099;
	color: #ffffff !important;
	font-size: 12px;
	padding: 0px 4px;
	border-radius: 5px;
	top: -3px;
	left: -220px;
}

.search-gene-link:hover .gene-link-tip {
	display: block;
}

.ss-summary-popup .summary-data-header {
	padding: 5px 0;
	display: inline-block;
}

.ss-summary-popup .summary-row {
	display: table-row;
	width: 100%;
	font-size: 14px !important;
}

.ss-summary-popup .summary-column {
	padding: 0 10px;
	border-right: solid 1px #dddddd;
	display: table-cell;
}

.ss-summary-popup .summary-column-header {
	padding: 0 10px;
	border-right: solid 1px #dddddd;
	display: table-cell;
	font-weight: bold;
}

.ss-summary-popup .summary-next-action {
	display: inline-block;
	padding: 3px 0px 0px 10px;
	font-weight: bold;
}


a.ss-generate-summary {
	color: #ff6600 !important;
}

.ss-summary-popup {
	text-align: left !important;
	position: fixed;
	bottom: 15px;
	right: 0px;
	width: auto;
	height: auto;
	max-height: 50%;
	padding: 15px;
	border: solid 1px #ddd;
	background-color: #fff;
	box-shadow: 5px 5px 5px 5px rgba(0, 0, 0, 0.2);
	z-index: 1000;
	overflow: auto;
	display:none;
}

.ss-summary-popup {
    text-align: left !important;
    position: absolute;
    top: 380px;
    bottom: unset;
    left: 50%;
    transform: translateX(-50%);
    min-width: 100%;
    width: max-content;
	max-width: 90vw;
    height: 500px;
    max-height: max-content;
    padding: 15px;
    background-color: #fff;
    box-shadow: none;
    border: none;
    border-radius: 10px;
    z-index: 1000;
    overflow-y: auto;
    display: none;
}

.ss-summary-popup .summary-content {

}

.ss-summary-popup.hidden {
	display: none;
}

.ss-summary-popup-btn {
	position: absolute;
	right: 0;
	top: -30px;
	font-size: 12px;
	background-color: #ffffff;
	padding: 2px 10px;
	border-radius: 15px;
}

/* meaning search styles */
.ss-search-methods {
	display: block;
    width: 100%;
    text-align: left;
    padding-left: 10px;
    margin-top: -10px;
    color: #FF6600;
}

.ss-search-methods .search-method {
	display:inline-block;
	margin-right: 10px;
}

.ss-search-methods .search-method input[type=radio] {
	vertical-align: middle;
	/* accent-color: #FF6600;*/
	margin-right: 5px;
}

.ss-search-methods .search-method label {
}

select.ss-meaning-params {
	width: 25%;
	height: 54px;
	background-color:  #ff6600;
	color: #ffffff;
	border: solid 2px #ff6600;
	border-radius: 0;
	border-top-left-radius: 10px;
	border-bottom-left-radius: 10px;
    float: left;
}

select.ss-meaning-sim-score {
	width: 8%;
	height: 54px;
	background-color:  #ff6600;
	color: #ffffff;
	border: solid 2px #ff6600;
	border-left: solid 1px #ff9966;
	border-radius: 0;
    float: left;
}

.byor-single-search.meaning-search, #byor_single_search.meaning-search {
	width: 67% !important;
    margin-left: 0;
    float: left;
    border-radius: 0 !important;
    border-top-right-radius: 10px !important;
    border-bottom-right-radius: 10px !important;
}

.reset-search.meaning-reset-search {
	transform: translateY(55%);
}

.get-meaning-options {
	position: absolute;
    white-space: nowrap;
    background-color: #ff6600;
    color: #ffffff;
    font-size: 0.75em;
    border-radius: 4em;
	top: 75%;
    transform: translateY(65%);
    right: 40px;
}

.get-meaning-options:hover {
	background-color: #aa3300;
}


</style>
