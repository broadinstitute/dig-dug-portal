<template>
	<div>
		<div class="search-underlay" @click="unFocus"></div>
		<div class="byor-single-search-wrapper">
			<div class="search-underlay-close-note" @click="unFocus">
				close search <b-icon icon="x-circle-fill"></b-icon>
			</div>

			<input
				class="form-control byor-single-search"
				type="text"
				id="byor_single_search"
				v-model="singleSearchParam"
				:placeholder="placeholder"
				autocomplete="off"
				@keyup.enter="onSearch"
				@focus="onFocus"
			/>
			<span
				v-if="!!singleSearchParam"
				class="btn btn-default reset-search"
				@click="resetSearch"
			>
				Clear search <b-icon icon="x-circle-fill"></b-icon>
			</span>

			<div
				class="byor-single-search-results-wrapper"
				v-if="!!singleSearchConfig"
			>
				<div
					id="byor_single_search_results"
					class="byor-single-search-results-groups"
					v-if="visibleCategories.length > 0 || showFreeTextPending"
				>
					<div
						v-for="cat in visibleCategories"
						:key="cat.id"
						class="ss-category"
						:class="{ 'is-step-two': !!lockedCategoryId, 'is-free-text': cat.isFreeText }"
					>
						<div class="ss-category-header" v-if="!cat.isFreeText">
							<div class="ss-category-title">{{ cat.label }}</div>
						</div>
						<div class="ss-category-body">
							<div
								v-if="!cat.isFreeText"
								class="ss-entities"
								:class="{ locked: isEntityLocked(cat) }"
							>
								<div
									v-for="entity in categoryEntities(cat)"
									:key="cat.id + '-' + entity.value"
									class="ss-entity"
									:class="{ selected: isEntitySelected(entity) }"
									@click="selectEntity(cat, entity)"
								>
									{{ entity.label }}
								</div>
							</div>
							<div
								class="ss-questions"
								:class="{ locked: isQuestionLocked(cat) }"
							>
								<div
									v-for="(question, qIndex) in categoryQuestions(cat)"
									:key="cat.id + '-q-' + qIndex"
									class="ss-question"
									:class="{ selected: isQuestionSelected(question) }"
									@click="selectQuestion(cat, question)"
								>
									{{ question['url label'] }}
								</div>
							</div>
						</div>
					</div>
					<div v-if="showFreeTextPending && visibleCategories.length === 0" class="ss-llm-loading">
						<div class="loading"></div>
						<span>Searching…</span>
					</div>
					<div v-if="llmPath" class="ss-llm-panel">
						<div v-if="isLoading" class="ss-llm-loading">
							<div class="loading"></div>
							<span>{{ llmPath === 'llm-discovery' ? 'Preparing your question…' : 'Finding CFDE programs…' }}</span>
						</div>
						<template v-else-if="llmResults">
							<div v-if="llmPath === 'llm-programs'" class="ss-llm-box">
								<strong>Suggested CFDE Programs:</strong>
								<div
									v-for="(program, pIndex) in (llmResults.programs || [])"
									:key="'prog-' + pIndex + '-' + program.id"
									class="ss-llm-program"
								>
									<div class="ss-llm-program-head">
										<strong>{{ program.name }}</strong>
										<div class="ss-llm-program-links">
											<a :href="kcURL('/r/kc_programs?DCC=' + program.id)">program snapshot</a>
											<a
												v-if="programLinks[program.id]"
												:href="programLinks[program.id]"
												target="_blank"
											>data portal</a>
										</div>
									</div>
									<div>{{ program.reason }}</div>
								</div>
								<div v-if="!(llmResults.programs && llmResults.programs.length)">
									No programs suggested.
								</div>
							</div>
							<div v-else-if="llmPath === 'llm-discovery'" class="ss-llm-box">
								<strong>Knowledge Center Discovery:</strong>
								<div>See evidence-backed hypotheses about the biology behind your research interest:</div>
								<template v-if="discoveryQuestions.length">
									<div
										v-for="(query, qIndex) in discoveryQuestions"
										:key="'disc-' + qIndex"
										class="ss-llm-discovery-choice"
										:class="{ selected: selectedDiscoveryQuery === query }"
										@click="selectDiscoveryQuery(query)"
									>
										<div class="ss-llm-discovery-query">{{ query }}</div>
									</div>
								</template>
								<div v-else class="ss-llm-discovery-query">{{ activeDiscoveryQuery }}</div>
								<div>
									Using pre-computed genetic associations between 6,000 common &amp; rare disease phenotypes
									and 150,000 gene expression signatures from various CFDE Programs.
								</div>
								<div v-if="activeDiscoveryQuery" class="ss-llm-discovery-link">
									<a
										:href="kcURL('/r/factor_base_reveal?query=' + encodeURIComponent(activeDiscoveryQuery))"
										target="_blank"
									>mechanism discovery</a>
								</div>
							</div>
						</template>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import Vue from "vue";
import { match } from "@/utils/bioIndexUtils";
import { cfdePhenotypes, kcURL } from "@/utils/cfdeUtils";
import { createLLMClient } from "@/utils/llmClient";
import EventBus from "@/utils/eventBus";

const LLM_QUESTIONS = [
	{ id: "llm-programs", "url label": "Suggest CFDE programs" },
	{ id: "llm-discovery", "url label": "Discover knowledge in CFDE KC" },
];

const DISCOVERY_QUESTION_TEMPLATES = {
	gene: [
		"How is {entity} expressed across human tissues?",
		"What diseases are associated with {entity} expression?",
		"How does {entity} expression change with exercise or perturbation?",
		"What molecular mechanisms regulate {entity}?",
	],
	phenotype: [
		"What gene expression signatures are associated with {entity}?",
		"What molecular mechanisms underlie {entity}?",
		"Which tissues contribute to {entity}?",
		"What genes are differentially expressed in {entity}?",
	],
	disease: [
		"What gene expression signatures are associated with {entity}?",
		"What molecular mechanisms underlie {entity}?",
		"Which tissues are most relevant to {entity}?",
		"What genes might be therapeutic targets for {entity}?",
	],
	tissue: [
		"Which genes are differentially expressed in {entity}?",
		"How does gene expression in {entity} relate to common diseases?",
		"What molecular programs define {entity}?",
		"How does exercise or perturbation affect {entity}?",
	],
	generic: [
		"What gene expression signatures are associated with {entity}?",
		"What molecular mechanisms involve {entity}?",
		"How is {entity} related to human disease?",
	],
};

const PROGRAMS_PROMPT = `You rank Common Fund Data Ecosystem (CFDE) programs for a user's search.

Return JSON only:
{
  "programs": [
    { "name": "GTEx", "id": "GTEx", "relevance": 1, "reason": "…" }
  ]
}

Rules:
- Return 3–6 programs, relevance 1 = most relevant, each with a brief concrete reason.
- Use these ids exactly: 4DN, A2CPS, Bridge2AI, exRNA, GlyGen, GTEx, HuBMAP, IDG, Kids First, LINCS, Metabolomics, MoTrPAC, SenNet, SMaHT, SPARC
- Rank from the selected entity and/or the user's query. Do not invent programs.

Programs:
- 4DN: 3D genome architecture, chromatin, imaging
- A2CPS: chronic pain biomarkers, omics, neuroimaging
- Bridge2AI: AI-ready multimodal biomedical datasets
- exRNA: extracellular RNA, biofluid biomarkers
- GlyGen: glycans, glycoproteins, glycosylation
- GTEx: tissue-specific gene expression and eQTLs
- HuBMAP: single-cell and spatial human tissue maps
- IDG: understudied druggable proteins, targets
- Kids First: pediatric cancer and birth-defect genomics
- LINCS: perturbation signatures, drug repurposing
- Metabolomics: metabolite datasets and standards
- MoTrPAC: molecular transducers of exercise
- SenNet: senescent cells, aging
- SMaHT: somatic mosaicism across tissues
- SPARC: neural circuits, organ innervation
`;

const DISCOVERY_PROMPT = `You prepare one complete biomedical question for CFDE REVEAL mechanism discovery.

REVEAL accepts only a complete, biologically meaningful sentence — not a bare gene, disease, phenotype, or tissue name.

Return JSON only:
{ "discovery": "…" }

Rules:
- If the input is already a complete question or research statement (a full sentence, or starts with how/why/what/does/can), copy it. Fix only spelling and grammar.
- If the input is a fragment or incomplete phrase, rewrite it into ONE concise biologically meaningful question.
- Prefer questions about gene expression, disease mechanisms, tissue context, pathways, or perturbation.
- Do not mention CFDE program names (GTEx, LINCS, HuBMAP, MoTrPAC, and similar).
- Do not add entities the user did not mention.
- One sentence. No quotes. No commentary.
`;

function fillDiscoveryQuestions(entityType, entity) {
	const name = (entity && (entity.label || entity.value)) || "";
	const templates = DISCOVERY_QUESTION_TEMPLATES[entityType] || DISCOVERY_QUESTION_TEMPLATES.generic;
	return templates.map((template) => template.replace(/\{entity\}/g, name));
}

function entityTypeFromParam(param) {
	const text = [param && param.parameter, param && param.label, param && param.type]
		.filter(Boolean)
		.join(" ")
		.toLowerCase();
	if (text.includes("tissue")) return "tissue";
	if (text.includes("disease")) return "disease";
	if (text.includes("phenotype")) return "phenotype";
	if (text.includes("gene")) return "gene";
	return "generic";
}

export default Vue.component("cfde-single-search", {
	props: ["singleSearchConfig", "phenotypes", "utils", "fromNav"],

	data() {
		return {
			singleSearchParam: null,
			hasFocus: false,
			singleSearchResult: {
				genes: [],
				phenotypes: [],
				cfdePhenotypes: [],
			},
			customList: {},
			cfdePhenotypeList: Object.keys(cfdePhenotypes).map((key) => ({
				value: key,
				label: cfdePhenotypes[key],
			})),
			lockedCategoryId: null,
			lockedEntity: null,
			lockedQuestion: null,
			lockedEntityType: null,
			llmPrograms: null,
			llmDiscovery: null,
			llmPath: null,
			llmResults: null,
			isLoading: false,
			discoveryQuestions: [],
			selectedDiscoveryQuery: null,
			geneLookupId: 0,
			geneLookupPending: false,
			pendingListLoads: 0,
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
			},
		};
	},

	computed: {
		placeholder() {
			if (this.singleSearchConfig && this.singleSearchConfig["search instruction"]) {
				return this.singleSearchConfig["search instruction"];
			}
			return "Search gene, variant, region, phenotype, or tissue";
		},
		searchParameters() {
			const config = this.singleSearchConfig;
			if (!config) return [];
			const top = this.asParamArray(config["search parameters"]);
			const nested = config["single search"]
				? this.asParamArray(config["single search"]["search parameters"])
				: [];
			if (!top.length) return nested;
			if (!nested.length) return top;
			const seen = new Set(top.map((p) => p.parameter || this.normalizedValues(p)));
			return top.concat(nested.filter((p) => !seen.has(p.parameter || this.normalizedValues(p))));
		},
		customSearchParameters() {
			return this.searchParameters.filter((param) => {
				return !this.isCfdePhenotypesParam(param) &&
					this.normalizedValues(param) !== "kp genes" &&
					this.normalizedValues(param) !== "kp phenotypes";
			});
		},
		cfdePhenotypeParameters() {
			return this.searchParameters.filter((param) => this.isCfdePhenotypesParam(param));
		},
		cfdePhenotypeParam() {
			return this.cfdePhenotypeParameters[0] || null;
		},
		cfdePhenotypeLabel() {
			return (this.cfdePhenotypeParam && this.cfdePhenotypeParam.label) || "Phenotypes";
		},
		cfdePhenotypeOptions() {
			if (this.cfdePhenotypeParam && this.cfdePhenotypeParam.options) {
				return this.cfdePhenotypeParam.options;
			}
			return this.isParameterActive("cfde phenotypes").options || [];
		},
		geneParam() {
			return this.isParameterActive("kp genes");
		},
		phenotypeParam() {
			return this.isParameterActive("kp phenotypes");
		},
		searchCategories() {
			const cats = [];

			if (this.geneParam.active && this.singleSearchResult.genes.length > 0) {
				const geneConfig = this.searchParameters.find((p) => this.normalizedValues(p) === "kp genes");
				cats.push({
					id: "genes",
					entityType: "gene",
					label: (geneConfig && geneConfig.label) || "Gene",
					entities: this.singleSearchResult.genes.map((g) => ({ value: g, label: g })),
					questions: this.withLlmQuestions(this.geneParam.options),
				});
			}

			if (this.phenotypeParam.active && this.singleSearchResult.phenotypes.length > 0) {
				const phenotypeConfig = this.searchParameters.find((p) => this.normalizedValues(p) === "kp phenotypes");
				cats.push({
					id: "kpPhenotypes",
					entityType: "phenotype",
					label: (phenotypeConfig && phenotypeConfig.label) || "Phenotype",
					entities: this.singleSearchResult.phenotypes.map((p) => ({
						value: p.name,
						label: p.description,
					})),
					questions: this.withLlmQuestions(this.phenotypeParam.options),
				});
			}

			if (this.singleSearchResult.cfdePhenotypes.length > 0) {
				cats.push({
					id: "cfdePhenotypes",
					entityType: "phenotype",
					label: this.cfdePhenotypeLabel,
					entities: this.singleSearchResult.cfdePhenotypes,
					questions: this.withLlmQuestions(this.cfdePhenotypeOptions),
				});
			}

			this.customSearchParameters.forEach((param) => {
				const entities = this.resultList(param.parameter);
				const meta = this.isParameterActive(param.parameter);
				if (!entities.length || !meta.active) return;
				cats.push({
					id: param.parameter,
					entityType: entityTypeFromParam(param),
					label: param.label,
					entities: entities.map((item) => ({ value: item.value, label: item.label })),
					questions: this.withLlmQuestions(meta.options),
				});
			});

			if (cats.length === 0 && this.isFreeTextQuery) {
				cats.push(this.freeTextCategory);
			}

			return cats;
		},
		freeTextCategory() {
			const query = (this.singleSearchParam || "").trim();
			return {
				id: "freeText",
				label: "Query",
				isFreeText: true,
				entityType: "freeText",
				entities: [{ value: query, label: query }],
				questions: LLM_QUESTIONS.slice(),
			};
		},
		isLookupsPending() {
			return this.geneLookupPending || this.pendingListLoads > 0;
		},
		isFreeTextQuery() {
			const query = (this.singleSearchParam || "").trim();
			return query.length >= 2 && !this.isLookupsPending;
		},
		showFreeTextPending() {
			const query = (this.singleSearchParam || "").trim();
			return query.length >= 2 && this.isLookupsPending && this.searchCategories.length === 0;
		},
		visibleCategories() {
			if (this.lockedCategoryId === "freeText") {
				return [this.freeTextCategory];
			}
			if (this.lockedCategoryId) {
				return this.searchCategories.filter((c) => c.id === this.lockedCategoryId);
			}
			return this.searchCategories;
		},
		activeDiscoveryQuery() {
			return this.selectedDiscoveryQuery || (this.llmResults && this.llmResults.discovery) || "";
		},
	},

	created() {
		this.llmPrograms = createLLMClient({
			llm: "openai",
			model: "gpt-5-nano",
			system_prompt: PROGRAMS_PROMPT,
		});
		this.llmDiscovery = createLLMClient({
			llm: "openai",
			model: "gpt-5-nano",
			system_prompt: DISCOVERY_PROMPT,
		});
		this.loadEntityLists();
	},

	mounted() {
		EventBus.$on("activate-search", this.onFocus);
	},

	beforeDestroy() {
		EventBus.$off("activate-search", this.onFocus);
		this.abortLlms();
	},

	watch: {
		searchParameters: {
			immediate: true,
			handler() {
				this.loadEntityLists();
			},
		},
		singleSearchParam(PARAM) {
			this.resetLock();
			if (PARAM && PARAM.length >= 2) {
				this.runAutocomplete(PARAM);
			} else {
				this.geneLookupId += 1;
				this.geneLookupPending = false;
				this.clearResults();
			}
		},
	},

	methods: {
		onSearch() {},
		asParamArray(raw) {
			if (Array.isArray(raw)) return raw;
			if (raw && Array.isArray(raw.parameters)) return raw.parameters;
			return [];
		},
		normalizedValues(param) {
			if (!param || param.values == null) return "";
			if (typeof param.values === "string") return param.values.trim().toLowerCase();
			return "";
		},
		isCfdePhenotypesParam(param) {
			if (!param) return false;
			const values = this.normalizedValues(param);
			const parameter = param.parameter != null ? String(param.parameter).trim().toLowerCase() : "";
			return values === "cfde phenotypes" ||
				values === "cfde phenotype" ||
				parameter === "cfde phenotypes";
		},
		loadEntityLists() {
			this.searchParameters.forEach((S) => {
				const values = this.normalizedValues(S);
				if (values === "kp genes" || values === "kp phenotypes") {
					return;
				}

				if (this.isCfdePhenotypesParam(S)) {
					this.$set(this.singleSearchResult, "cfdePhenotypes", []);
					return;
				}

				if (!this.singleSearchResult[S.parameter]) {
					this.$set(this.singleSearchResult, S.parameter, []);
				}

				if (S["data point"]) {
					const listPoint = S["data point"];
					this.getList(
						S.parameter,
						listPoint.url,
						listPoint["data type"],
						listPoint["data wrapper"]
					);
				} else if (Array.isArray(S.values)) {
					this.$set(this.customList, S.parameter, S.values);
				}
			});

			if (this.singleSearchParam && this.singleSearchParam.length >= 2) {
				this.runAutocomplete(this.singleSearchParam);
			}
		},
		resultList(parameter) {
			return this.singleSearchResult[parameter] || [];
		},
		matchesAllWords(text, words) {
			if (!text) return false;
			const haystack = String(text).toLowerCase();
			return words.every((w) => haystack.includes(w.toLowerCase()));
		},
		runAutocomplete(PARAM) {
			const paramWords = PARAM.split(/\s+/).filter(Boolean);
			const hasKpGenes = this.searchParameters.some((S) => this.normalizedValues(S) === "kp genes");
			const hasKpPhenotypes = this.searchParameters.some((S) => this.normalizedValues(S) === "kp phenotypes");

			if (hasKpGenes || this.searchParameters.length === 0) {
				this.lookupGenes(PARAM);
			} else {
				this.geneLookupPending = false;
			}

			if (hasKpPhenotypes && Array.isArray(this.phenotypes)) {
				const searchPhenotypes = this.phenotypes.filter((p) =>
					this.matchesAllWords(p.description, paramWords)
				);
				this.singleSearchResult.phenotypes = searchPhenotypes.sort(
					(a, b) => a.name.length - b.name.length
				);
			}

			if (this.cfdePhenotypeParameters.length > 0) {
				const cfdeHits = this.cfdePhenotypeList.filter((item) =>
					this.matchesAllWords(item.label, paramWords) ||
					this.matchesAllWords(item.value, paramWords)
				).sort((a, b) => String(a.label).length - String(b.label).length);
				this.singleSearchResult.cfdePhenotypes = cfdeHits;
			} else {
				this.singleSearchResult.cfdePhenotypes = [];
			}

			Object.keys(this.customList).forEach((P) => {
				const list = this.customList[P] || [];
				const searchItems = list.filter((item) =>
					this.matchesAllWords(item.label, paramWords) ||
					this.matchesAllWords(item.value, paramWords)
				).sort((a, b) => String(a.label).length - String(b.label).length);
				this.$set(this.singleSearchResult, P, searchItems);
			});
		},
		clearResults() {
			this.singleSearchResult.genes = [];
			this.singleSearchResult.phenotypes = [];
			this.singleSearchResult.cfdePhenotypes = [];
			Object.keys(this.customList).forEach((P) => {
				this.$set(this.singleSearchResult, P, []);
			});
			this.resetLock();
		},
		resetSearch() {
			this.singleSearchParam = null;
			this.clearResults();
		},
		resetLock() {
			this.abortLlms();
			this.lockedCategoryId = null;
			this.lockedEntity = null;
			this.lockedQuestion = null;
			this.lockedEntityType = null;
			this.llmPath = null;
			this.llmResults = null;
			this.isLoading = false;
			this.discoveryQuestions = [];
			this.selectedDiscoveryQuery = null;
		},
		abortLlms() {
			if (this.llmPrograms) this.llmPrograms.abort();
			if (this.llmDiscovery) this.llmDiscovery.abort();
		},
		lockCategory(cat) {
			if (!cat) return;
			this.lockedCategoryId = cat.id;
			this.lockedEntityType = cat.entityType || null;
		},
		categoryEntities(cat) {
			if (this.lockedCategoryId === cat.id && this.lockedEntity) {
				return [this.lockedEntity];
			}
			return cat.entities;
		},
		categoryQuestions(cat) {
			if (this.lockedCategoryId === cat.id && this.lockedQuestion) {
				return [this.lockedQuestion];
			}
			return cat.questions;
		},
		isEntityLocked(cat) {
			return this.lockedCategoryId === cat.id && !!this.lockedEntity;
		},
		isQuestionLocked(cat) {
			return this.lockedCategoryId === cat.id && !!this.lockedQuestion;
		},
		isEntitySelected(entity) {
			return !!(this.lockedEntity && this.lockedEntity.value === entity.value);
		},
		isQuestionSelected(question) {
			if (!this.lockedQuestion) return false;
			if (this.lockedQuestion.id || question.id) {
				return this.lockedQuestion.id === question.id;
			}
			return this.lockedQuestion.url === question.url &&
				this.lockedQuestion["url label"] === question["url label"];
		},
		selectEntity(cat, entity) {
			if (this.isEntitySelected(entity)) {
				this.resetLock();
				return;
			}
			if (this.lockedQuestion) {
				this.lockCategory(cat);
				this.lockedEntity = entity;
				this.goTo(this.lockedQuestion, entity);
				return;
			}
			if ((cat.questions || []).length === 1) {
				this.lockCategory(cat);
				this.lockedEntity = entity;
				this.lockedQuestion = cat.questions[0];
				this.goTo(cat.questions[0], entity);
				return;
			}
			this.lockCategory(cat);
			this.lockedEntity = entity;
		},
		selectQuestion(cat, question) {
			if (this.isQuestionSelected(question)) {
				this.resetLock();
				return;
			}
			if (this.lockedEntity) {
				this.lockCategory(cat);
				this.lockedQuestion = question;
				this.goTo(question, this.lockedEntity);
				return;
			}
			if ((cat.entities || []).length === 1) {
				this.lockCategory(cat);
				this.lockedEntity = cat.entities[0];
				this.lockedQuestion = question;
				this.goTo(question, cat.entities[0]);
				return;
			}
			this.lockCategory(cat);
			this.lockedQuestion = question;
		},
		goTo(question, entity) {
			if (question && question.id === "llm-programs") {
				this.runProgramsLlm(entity);
				return;
			}
			if (question && question.id === "llm-discovery") {
				if (this.lockedCategoryId === "freeText") {
					this.runDiscoveryLlm(entity);
				} else {
					this.showDefaultDiscovery(entity);
				}
				return;
			}
			if (!question || !question.url || !entity) return;
			window.location.href = question.url + entity.value;
		},
		withLlmQuestions(options) {
			return [...(options || []), ...LLM_QUESTIONS];
		},
		queryPrompt(entity) {
			const parts = [];
			if (this.singleSearchParam) parts.push(this.singleSearchParam);
			if (entity && entity.label && entity.value !== this.singleSearchParam) {
				parts.push("Selected " + (entity.label === entity.value ? entity.label : entity.label + " (" + entity.value + ")"));
			}
			return parts.join("\n");
		},
		runProgramsLlm(entity) {
			this.abortLlms();
			this.llmPath = "llm-programs";
			this.llmResults = null;
			this.discoveryQuestions = [];
			this.selectedDiscoveryQuery = null;
			this.isLoading = true;
			this.llmPrograms.sendPrompt({
				userPrompt: this.queryPrompt(entity),
				onResponse: this.onProgramsResponse,
				onError: this.onLlmError,
			});
		},
		runDiscoveryLlm(entity) {
			this.abortLlms();
			this.llmPath = "llm-discovery";
			this.llmResults = null;
			this.discoveryQuestions = [];
			this.selectedDiscoveryQuery = null;
			this.isLoading = true;
			const query = (entity && (entity.label || entity.value)) || this.singleSearchParam || "";
			this.llmDiscovery.sendPrompt({
				userPrompt: query,
				onResponse: this.onDiscoveryResponse,
				onError: this.onLlmError,
			});
		},
		showDefaultDiscovery(entity) {
			this.abortLlms();
			this.llmPath = "llm-discovery";
			this.isLoading = false;
			this.llmResults = {};
			this.discoveryQuestions = fillDiscoveryQuestions(this.lockedEntityType, entity);
			this.selectedDiscoveryQuery = null;
		},
		selectDiscoveryQuery(query) {
			this.selectedDiscoveryQuery = query;
		},
		parseLlmResponse(rawString) {
			const cleanString = String(rawString || "").replace(/```json|```/g, "").trim();
			try {
				return JSON.parse(cleanString);
			} catch (e) {
				return null;
			}
		},
		onProgramsResponse(response) {
			this.isLoading = false;
			const json = this.parseLlmResponse(response) || {};
			if (!Array.isArray(json.programs)) json.programs = [];
			this.llmResults = json;
		},
		onDiscoveryResponse(response) {
			this.isLoading = false;
			const json = this.parseLlmResponse(response) || {};
			if (json.discovery === "null") json.discovery = null;
			this.llmResults = json;
			this.selectedDiscoveryQuery = json.discovery || this.singleSearchParam;
		},
		onLlmError() {
			this.isLoading = false;
			if (this.llmPath === "llm-discovery") {
				this.selectedDiscoveryQuery = this.singleSearchParam;
				this.llmResults = { discovery: this.singleSearchParam };
			} else {
				this.llmResults = {};
			}
		},
		kcURL,
		onFocus() {
			const underlay = this.$el.querySelector(".search-underlay");
			const wrapper = this.$el.querySelector(".byor-single-search-wrapper");
			if (underlay) underlay.classList.add("focus");
			if (wrapper) {
				wrapper.classList.add("focus");
				if (this.fromNav) wrapper.classList.remove("hidden");
			}
			this.hasFocus = true;
		},
		unFocus() {
			const underlay = this.$el.querySelector(".search-underlay");
			const wrapper = this.$el.querySelector(".byor-single-search-wrapper");
			if (underlay) underlay.classList.remove("focus");
			if (wrapper) {
				wrapper.classList.remove("focus");
				if (this.fromNav) wrapper.classList.add("hidden");
			}
			this.hasFocus = false;
		},
		isParameterActive(PARAM) {
			const returnParam = { active: null, url: "", options: null };

			this.searchParameters.forEach((param) => {
				if (param.values !== PARAM && param.parameter !== PARAM) {
					return;
				}

				returnParam.active = true;

				if (param["target page"]) {
					const target = param["target page"];
					if (target["page id"]) {
						returnParam.url = "/research.html?pageid=" + target["page id"];
					} else if (target.url) {
						returnParam.url = target.url;
					}

					returnParam.url += target.entity
						? "&" + target["entity parameter"] + "=" + target.entity
						: "";

					if (target["page id"]) {
						returnParam.url += "&" + param.parameter + "=";
					} else if (target.url) {
						returnParam.url += param.parameter + "=";
					}
				}

				if (param.options) {
					returnParam.options = param.options;
				}
			});

			return returnParam;
		},
		async getList(PARAM, URL, TYPE, WRAPPER) {
			if (!URL) return;
			this.pendingListLoads += 1;

			try {
			const paramListRaw = await fetch(URL).then((resp) => resp.json());

			if (paramListRaw.error != null) {
				return;
			}

			let paramList = paramListRaw;
			if (typeof paramList === "string") {
				paramList =
					TYPE === "json"
						? JSON.parse(paramList)
						: TYPE === "csv"
							? this.utils.dataConvert.csv2Json(paramList)
							: paramList;
			}

			let list;
			if (WRAPPER) {
				let dataEntity = paramList;
				WRAPPER.forEach((w) => {
					dataEntity = dataEntity[w];
				});

				if (typeof dataEntity === "string") {
					dataEntity =
						TYPE === "json"
							? JSON.parse(dataEntity)
							: TYPE === "csv"
								? this.utils.dataConvert.csv2Json(dataEntity)
								: dataEntity;
				}

				const values = [];
				if (dataEntity && dataEntity.length > 0) {
					dataEntity.forEach((item) => {
						if (typeof item === "string" || typeof item === "number") {
							values.push({ label: item, value: item });
						} else if (typeof item === "object" && Array.isArray(item)) {
							values.push({ label: item[0], value: item[0] });
						} else if (typeof item === "object") {
							values.push(item);
						}
					});
				}
				list = values;
			} else {
				list = paramList;
			}

			this.$set(this.customList, PARAM, list);
			if (!this.singleSearchResult[PARAM]) {
				this.$set(this.singleSearchResult, PARAM, []);
			}
			} finally {
				this.pendingListLoads = Math.max(0, this.pendingListLoads - 1);
				if (this.singleSearchParam && this.singleSearchParam.length >= 2) {
					this.runAutocomplete(this.singleSearchParam);
				}
			}
		},
		async lookupGenes(input) {
			const id = ++this.geneLookupId;
			this.geneLookupPending = true;
			try {
				const matches = await match("gene", input, { limit: 10 });
				if (id !== this.geneLookupId) return;
				if (this.singleSearchParam === input) {
					this.singleSearchResult.genes = matches;
				}
			} catch (e) {
				if (id !== this.geneLookupId) return;
				if (this.singleSearchParam === input) {
					this.singleSearchResult.genes = [];
				}
			} finally {
				if (id === this.geneLookupId) {
					this.geneLookupPending = false;
				}
			}
		},
	},
});
</script>

<style scoped>
.search-underlay {
	background: #f7f6f6;
	position: fixed;
	width: 100vw;
	height: 100vh;
	top: 0;
	left: 0;
	z-index: 1000;
	opacity: 0.8;
	display: none;
}
.search-underlay-close-note {
	position: absolute;
	left: 50%;
	top: -30px;
	transform: translateX(-50%);
	display: none;
	font-size: 12px;
	width: 100%;
	text-align: right;
	padding: 0 10px;
	cursor: pointer;
}
.search-underlay.focus {
	display: block;
}
.byor-single-search-wrapper {
	width: 100%;
	position: relative;
}
.byor-single-search-wrapper.focus {
	z-index: 2000;
}
.byor-single-search-wrapper.focus .search-underlay-close-note {
	display: block;
}
.byor-single-search-wrapper.focus .byor-single-search-results-groups {
	display: flex;
}
.byor-single-search {
	width: 100%;
	margin-left: auto;
	margin-right: auto;
}
.reset-search {
	position: absolute;
	top: 50%;
	transform: translateY(-50%);
	right: 4px;
	color: #999999;
	font-size: 14px;
}
.reset-search:hover {
	color: #333333;
}
.byor-single-search-results-wrapper {
	position: relative;
	margin-left: auto;
	margin-right: auto;
}
.byor-single-search-results-groups {
	display: none;
	flex-direction: column;
	gap: 10px;
	position: absolute;
	min-width: 100%;
	width: 100%;
	max-width: 90vw;
	transform: translateX(-50%);
	left: 50%;
	background-color: #f7f6f6;
	font-size: 14px;
	z-index: 100;
	padding: 10px;
	height: auto;
	max-height: 70vh;
	overflow-y: auto;
	border-radius: 10px;
}
.ss-category {
	background-color: white;
	border-radius: 10px;
	padding: 12px 14px;
	display: flex;
	flex-direction: column;
	gap: 8px;
	max-height: 175px;
}
.ss-category-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 10px;
}
.ss-category-title {
	font-weight: bold;
	text-transform: uppercase;
	font-size: 14px;
}
.ss-category-body {
	display: flex;
	gap: 24px;
	min-height: 0;
	flex: 1;
}
.ss-entities,
.ss-questions {
	min-width: 0;
	overflow-y: auto;
	display: flex;
	flex-direction: column;
}
.ss-entities {
	flex: 4;
}
.ss-questions {
	flex: 6;
	justify-content: center;
	font-size: 16px;
}
.ss-category.is-free-text .ss-questions {
	flex: 1;
}
.ss-entities.locked,
.ss-questions.locked {
	justify-content: center;
	align-items: center;
	text-align: center;
}
.ss-entity,
.ss-question {
	cursor: pointer;
	padding: 3px 8px;
	border-radius: 5px;
	width: fit-content;
	max-width: 100%;
}
.ss-question {
	border-bottom: solid 0.3px #FA6600;
}
.ss-question:not(:last-child) {
	border-radius: 0;
}
.ss-entity,
.ss-question {
	color: #666666;
}
.ss-entity.selected,
.ss-question.selected {
	font-family: serif;
	font-style: italic;
	font-size: 18px;
	line-height: 1.25em;
	color: #FA6600;
	background: none;
}
.ss-entity:hover,
.ss-question:hover {
	background: #ff6600;
	color: white;
	text-decoration: none;
}
.ss-llm-panel {
	background: #fff;
	border-radius: 10px;
	padding: 16px 18px;
}
.ss-llm-loading {
	display: flex;
	align-items: center;
	gap: 10px;
	color: #666;
}
.loading {
	background: #eee;
	border: 2px solid #333;
	width: 14px;
	height: 14px;
	border-radius: 50%;
	border-bottom-color: transparent;
	animation: ss-rotation 1s linear infinite;
}
@keyframes ss-rotation {
	0% { transform: rotate(0deg); }
	100% { transform: rotate(360deg); }
}
.ss-llm-box {
	display: flex;
	flex-direction: column;
	gap: 10px;
	font-size: 14px;
	color: #333;
}
.ss-llm-program {
	display: flex;
	flex-direction: column;
	gap: 2px;
	padding: 8px 0;
	border-bottom: solid 0.3px #FA6600;
}
.ss-llm-program-head {
	display: flex;
	justify-content: space-between;
	gap: 10px;
	align-items: baseline;
}
.ss-llm-program-links {
	display: flex;
	gap: 10px;
	flex-shrink: 0;
}
.ss-llm-discovery-query {
	text-align: center;
	font-family: serif;
	font-size: 1.4em;
	padding: 10px;
	font-style: italic;
	color: #FA6600;
}
.ss-llm-discovery-choice {
	cursor: pointer;
	border-bottom: solid 0.3px #FA6600;
}
.ss-llm-discovery-choice .ss-llm-discovery-query {
	text-align: left;
	font-size: 1.15em;
	padding: 8px 0;
}
.ss-llm-discovery-choice.selected .ss-llm-discovery-query {
	text-align: center;
	font-size: 1.4em;
}
.ss-llm-discovery-link {
	margin-top: 6px;
}
</style>
