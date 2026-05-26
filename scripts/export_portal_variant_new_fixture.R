library(data.table)
library(jsonlite)

portal_rds <- "/Users/kyuryung/Documents/Playground/crdc_portal_db/portal_db_test_20260522_163649/crdc_portal_test_db_tables.rds"
repo_dir <- "/Users/kyuryung/Documents/github_dir/dig-dug-portal"
out_js <- file.path(repo_dir, "src/views/KrVariant/portalVariantNewData.generated.js")

db <- readRDS(portal_rds)
sample <- as.data.table(db$sample)
sample_hpo <- as.data.table(db$sample_hpo)
hpo_edge <- as.data.table(db$hpo_edge)
hpo_ancestor <- as.data.table(db$hpo_ancestor)
hpo_term <- as.data.table(db$hpo_term)
sample_variant <- as.data.table(db$sample_variant)
variant_carrier <- as.data.table(db$variant_carrier)
gene_carrier <- as.data.table(db$gene_carrier)
sample_gene_summary <- as.data.table(db$sample_gene_variant_evidence_summary)

query_variant_id <- "chr2:231222761:AT:A"
vrow <- sample_variant[variant_id == query_variant_id][1]
if (!nrow(vrow)) stop("Query variant missing from sample_variant: ", query_variant_id)
query_gene <- as.character(vrow$gene_symbol[1])

fmt <- function(x, empty = "-") {
  x <- as.character(x)
  x[is.na(x) | x == "" | x == "NA" | x == "NaN"] <- empty
  x
}

fmt_num <- function(x, digits = 2, empty = "-") {
  ifelse(is.na(x), empty, format(round(as.numeric(x), digits), scientific = FALSE, trim = TRUE))
}

clinvar_display <- function(x) {
  value <- fmt(x, "")
  value <- value[1]
  if (value == "" || value == "-") return("Pathogenicity not available")

  lower <- tolower(gsub("[_ -]+", " ", value))
  if (grepl("likely pathogenic", lower)) return("LP")
  if (grepl("pathogenic", lower)) return("P")
  if (grepl("uncertain|vus", lower)) return("VUS")
  if (grepl("likely benign", lower)) return("LB")
  if (grepl("benign", lower)) return("B")
  value
}

age_label <- function(age_band, age_at_analysis) {
  age_band <- fmt(age_band, "")
  if (age_band != "" && age_band != "-") return(age_band)
  age <- suppressWarnings(as.numeric(age_at_analysis))
  if (is.na(age)) return("-")
  if (age <= 4) return("0-4")
  if (age <= 12) return("5-12")
  if (age <= 18) return("13-18")
  if (age <= 30) return("19-30")
  "30+"
}

hpo_label <- function(ids) {
  ids <- unique(ids[!is.na(ids) & ids != ""])
  if (!length(ids)) return(character())
  dt <- data.table(hpo_id = ids)
  dt <- merge(dt, hpo_term[, .(hpo_id, hpo_name)], by = "hpo_id", all.x = TRUE)
  paste0(ifelse(is.na(dt$hpo_name), dt$hpo_id, dt$hpo_name), " [", dt$hpo_id, "]")
}

parse_variant <- function(variant_id) {
  parts <- strsplit(variant_id, ":", fixed = TRUE)[[1]]
  list(chrom = parts[1], pos = as.integer(parts[2]), ref = parts[3], alt = parts[4])
}

variant_label <- function(v) {
  paste0(v$chrom, ":", format(v$pos, big.mark = ",", scientific = FALSE), " ", v$ref, ">", v$alt)
}

make_age_bins <- function(sample_ids) {
  rows <- unique(sample[sample_id %in% sample_ids], by = "sample_id")
  rows[, age_group := fifelse(!is.na(age_at_analysis) & age_at_analysis <= 4, "0-4",
                       fifelse(!is.na(age_at_analysis) & age_at_analysis <= 12, "5-12",
                       fifelse(!is.na(age_at_analysis) & age_at_analysis <= 18, "13-18",
                       fifelse(!is.na(age_at_analysis) & age_at_analysis <= 30, "19-30",
                       fifelse(!is.na(age_at_analysis), "30+", "Unknown")))))]
  bins <- data.table(label = c("0-4", "5-12", "13-18", "19-30", "30+", "Unknown"))
  counts <- rows[age_group %in% bins$label, .(
    female = sum(tolower(fmt(gender, "")) == "female", na.rm = TRUE),
    male = sum(tolower(fmt(gender, "")) == "male", na.rm = TRUE)
  ), by = .(label = age_group)]
  bins <- merge(bins, counts, by = "label", all.x = TRUE, sort = FALSE)
  bins[is.na(female), female := 0L]
  bins[is.na(male), male := 0L]
  max_count <- max(c(bins$female, bins$male, 1), na.rm = TRUE)
  lapply(seq_len(nrow(bins)), function(i) {
    list(
      label = bins$label[i],
      female = as.integer(bins$female[i]),
      male = as.integer(bins$male[i]),
      femaleHeight = paste0(ifelse(bins$female[i] > 0, max(12, round(70 * bins$female[i] / max_count)), 0), "px"),
      maleHeight = paste0(ifelse(bins$male[i] > 0, max(12, round(70 * bins$male[i] / max_count)), 0), "px")
    )
  })
}

make_scope <- function(sample_ids, carrier_rows) {
  ids <- unique(sample_ids)
  rows <- unique(sample[sample_id %in% ids], by = "sample_id")
  female <- sum(tolower(fmt(rows$gender, "")) == "female", na.rm = TRUE)
  male <- sum(tolower(fmt(rows$gender, "")) == "male", na.rm = TRUE)
  proband <- sum(rows$proband_flag == TRUE, na.rm = TRUE)
  affected <- unique(carrier_rows[sample_id %in% ids, .(sample_id, affected_flag)])
  affected_n <- sum(affected$affected_flag == TRUE, na.rm = TRUE)
  diagnosed <- sum(rows$diagnosed_flag == TRUE, na.rm = TRUE)
  list(
    all = length(ids),
    proband = as.integer(proband),
    probandPercent = as.integer(round(100 * proband / max(1, length(ids)))),
    affected = as.integer(affected_n),
    diagnosed = as.integer(diagnosed),
    female = as.integer(female),
    male = as.integer(male)
  )
}

make_carrier_samples <- function(carrier_rows) {
  if (!nrow(carrier_rows)) return(list())
  if (!"variant_id" %in% names(carrier_rows)) carrier_rows[, variant_id := NA_character_]
  rows <- carrier_rows[, .(
    cohort_id = fmt(cohort_id[which(!is.na(cohort_id) & cohort_id != "")][1], "-"),
    affected_flag = any(affected_flag == TRUE, na.rm = TRUE),
    variant_count = uniqueN(variant_id[!is.na(variant_id) & variant_id != ""])
  ), by = sample_id][order(sample_id)]
  rows <- merge(
    rows,
    sample[, .(sample_id, gender, age_band, age_at_analysis, proband_flag, diagnosed_flag)],
    by = "sample_id",
    all.x = TRUE,
    sort = FALSE
  )
  lapply(seq_len(nrow(rows)), function(i) {
    list(
      id = rows$sample_id[i],
      age = age_label(rows$age_band[i], rows$age_at_analysis[i]),
      group = fmt(rows$cohort_id[i]),
      proband = ifelse(isTRUE(rows$proband_flag[i]), "Proband", "non-Proband"),
      affected = ifelse(isTRUE(rows$affected_flag[i]), "Yes", "No"),
      diagnosed = ifelse(isTRUE(rows$diagnosed_flag[i]), "Yes", "N/A"),
      variantCount = as.integer(rows$variant_count[i])
    )
  })
}

make_root_profile <- function(sample_ids) {
  root_ids <- hpo_edge[parent_hpo_id == "HP:0000118", unique(hpo_id)]
  root_names <- hpo_term[hpo_id %in% root_ids, .(root_hpo_id = hpo_id, root_name = hpo_name)]
  hpo_rows <- unique(sample_hpo[sample_id %in% sample_ids & !hpo_id %in% c("HP:0000001", "HP:0000118"), .(sample_id, hpo_id)])
  if (!nrow(hpo_rows)) return(list())
  root_map <- hpo_ancestor[
    hpo_id %in% hpo_rows$hpo_id & ancestor_hpo_id %in% root_ids,
    .SD[which.min(distance)],
    by = hpo_id
  ][, .(hpo_id, root_hpo_id = ancestor_hpo_id)]
  hpo_rows <- merge(hpo_rows, root_map, by = "hpo_id", all.x = TRUE)
  hpo_rows[is.na(root_hpo_id), root_hpo_id := "OTHER"]
  hpo_rows <- merge(hpo_rows, root_names, by = "root_hpo_id", all.x = TRUE)
  hpo_rows[is.na(root_name), root_name := "Other phenotype terms"]
  hpo_rows <- merge(hpo_rows, hpo_term[, .(hpo_id, hpo_name)], by = "hpo_id", all.x = TRUE)
  hpo_rows[, label := paste0(ifelse(is.na(hpo_name), hpo_id, hpo_name), " [", hpo_id, "]")]
  grouped <- hpo_rows[, .(
    support = uniqueN(sample_id),
    term_count = uniqueN(hpo_id),
    term_table = list(.SD[, .(label, n = uniqueN(sample_id)), by = .(hpo_id, label)][order(-n, label)])
  ), by = .(root_name, root_hpo_id)][order(-support, root_name)][1:min(.N, 6)]
  lapply(seq_len(nrow(grouped)), function(i) {
    terms <- grouped$term_table[[i]]
    top_terms <- terms[1:min(.N, 3), label]
    list(
      category = paste0(grouped$root_name[i], ifelse(grouped$root_hpo_id[i] == "OTHER", "", paste0(" [", grouped$root_hpo_id[i], "]"))),
      count = as.integer(grouped$term_count[i]),
      support = as.integer(grouped$support[i]),
      topTerms = as.list(gsub("\\s*\\[[^]]+\\]$", "", top_terms)),
      terms = as.list(terms$label)
    )
  })
}

make_phenotype_rows <- function(root_profile, denominator, proband_denominator) {
  lapply(root_profile[1:min(length(root_profile), 5)], function(row) {
    all_percent <- as.integer(round(100 * row$support / max(1, denominator)))
    list(
      label = row$category,
      all = all_percent,
      proband = min(all_percent, as.integer(round(100 * row$support / max(1, proband_denominator))))
    )
  })
}

v <- parse_variant(query_variant_id)
exact_carriers <- variant_carrier[variant_id == query_variant_id & gene_symbol == query_gene]
gene_carriers <- gene_carrier[gene_symbol == query_gene]
exact_ids <- unique(exact_carriers$sample_id)
gene_ids <- unique(gene_carriers$sample_id)
variant_scope <- make_scope(exact_ids, exact_carriers)
gene_scope <- make_scope(gene_ids, gene_carriers)
variant_roots <- make_root_profile(exact_ids)
gene_roots <- make_root_profile(gene_ids)
marker_coordinate <- variant_label(v)
window_start <- v$pos - 25
window_end <- v$pos + 25
major_ticks <- as.integer(round(seq(window_start, window_end, length.out = 5)))
minor_ticks <- seq(window_start + 5, window_end - 5, by = 5)

disease_rows <- sample_gene_summary[gene_symbol == query_gene & has_core_rare_disease_reference == TRUE]
disease_labels <- unique(unlist(strsplit(paste(fmt(disease_rows$orpha_disease_ids, ""), collapse = ";"), ";", fixed = TRUE)))
disease_labels <- disease_labels[disease_labels != "" & disease_labels != "-"]
if (!length(disease_labels)) disease_labels <- paste(query_gene, "reference annotation")

payload <- list(
  variant = list(
    query = list(
      label = marker_coordinate,
      rawId = query_variant_id,
      pathogenicity = clinvar_display(vrow$clinvar_clnsig),
      focusLeft = "50%",
      focusBandWidth = "0.35rem",
      window = paste(query_gene, "Variant"),
      build = "test DB",
      cytoband = ""
    ),
    axisTicks = as.list(format(major_ticks, big.mark = ",", scientific = FALSE)),
    minorTicks = lapply(seq_along(minor_ticks), function(i) {
      list(left = paste0(round(100 * (minor_ticks[i] - window_start) / (window_end - window_start), 1), "%"), label = as.character(minor_ticks[i] %% 1000))
    }),
    markers = list(list(
      label = "●",
      left = "50%",
      badge = paste0(v$ref, ">", v$alt),
      coordinate = marker_coordinate,
      pathogenicity = ifelse(clinvar_display(vrow$clinvar_clnsig) == "Pathogenicity not available", "", clinvar_display(vrow$clinvar_clnsig)),
      classification = "query",
      focal = TRUE,
      visibleInWindow = TRUE
    )),
    queryWindow = paste0(v$chrom, ":", format(window_start, big.mark = ",", scientific = FALSE), "-", format(window_end, big.mark = ",", scientific = FALSE), " (±25bp)"),
    variantEvidence = list(
      list(label = "Search Variant", value = query_variant_id),
      list(label = "Queried variant carriers", value = paste(variant_scope$all, "samples")),
      list(label = "ClinVar", value = clinvar_display(vrow$clinvar_clnsig)),
      list(label = "gnomAD AF", value = fmt_num(vrow$gnomad_exome_af, 5)),
      list(label = "REVEL", value = fmt_num(vrow$revel_score, 3)),
      list(label = "AlphaMissense", value = fmt_num(vrow$alphamissense_score, 3)),
      list(label = "LoFTEE", value = fmt(vrow$lof_class))
    ),
    summaryScopes = list(variant = variant_scope, gene = gene_scope),
    carrierSamples = make_carrier_samples(exact_carriers),
    geneCarrierSamples = make_carrier_samples(gene_carriers),
    variantDemographics = list(all = make_age_bins(exact_ids)),
    demographics = list(all = make_age_bins(gene_ids)),
    carrierPhenotypesByCategory = variant_roots,
    geneCarrierPhenotypesByCategory = gene_roots,
    variantPhenotypes = list("all-investigators" = make_phenotype_rows(variant_roots, variant_scope$all, variant_scope$proband)),
    phenotypes = list("all-investigators" = make_phenotype_rows(gene_roots, gene_scope$all, gene_scope$proband)),
    diseaseSignals = lapply(disease_labels[1:min(2, length(disease_labels))], function(x) list(label = x, scope = paste(query_gene, "gene-level reference support"))),
    relatedDiseases = lapply(disease_labels[1:min(2, length(disease_labels))], function(x) list(name = x, domain = "rare disease reference", signal = paste(query_gene, "linked"))),
    newFixtureStatus = list(
      label = "test DB fixture",
      exactCarrierCount = variant_scope$all,
      sameGeneCarrierCount = gene_scope$all,
      exactCarrierHpoCount = uniqueN(sample_hpo[sample_id %in% exact_ids & !hpo_id %in% c("HP:0000001", "HP:0000118"), hpo_id]),
      sameGeneCarrierHpoCount = uniqueN(sample_hpo[sample_id %in% gene_ids & !hpo_id %in% c("HP:0000001", "HP:0000118"), hpo_id])
    )
  )
)

json <- toJSON(payload, auto_unbox = TRUE, pretty = TRUE, null = "null", na = "null")
js <- paste0(
  "const portalVariantNewState = ", json, ";\n\n",
  "export function applyPortalVariantNewData(state) {\n",
  "    return {\n",
  "        ...state,\n",
  "        variant: {\n",
  "            ...state.variant,\n",
  "            ...portalVariantNewState.variant,\n",
  "            variantDemographics: {\n",
  "                ...state.variant.variantDemographics,\n",
  "                ...portalVariantNewState.variant.variantDemographics,\n",
  "            },\n",
  "            demographics: {\n",
  "                ...state.variant.demographics,\n",
  "                ...portalVariantNewState.variant.demographics,\n",
  "            },\n",
  "            variantPhenotypes: {\n",
  "                ...state.variant.variantPhenotypes,\n",
  "                ...portalVariantNewState.variant.variantPhenotypes,\n",
  "            },\n",
  "            phenotypes: {\n",
  "                ...state.variant.phenotypes,\n",
  "                ...portalVariantNewState.variant.phenotypes,\n",
  "            },\n",
  "        },\n",
  "    };\n",
  "}\n"
)
writeLines(js, out_js, useBytes = TRUE)
cat("Wrote:", out_js, "\n")
