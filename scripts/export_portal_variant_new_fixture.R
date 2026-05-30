library(data.table)
library(jsonlite)

portal_rds <- "/Users/kyuryung/Documents/Playground/crdc_portal_db/portal_db_test_20260529_132523/crdc_portal_test_db_tables.rds"
repo_dir <- "/Users/kyuryung/Documents/github_dir/dig-dug-portal"
out_js <- file.path(repo_dir, "src/views/KrVariant/portalVariantNewData.generated.js")

db <- readRDS(portal_rds)
sample <- as.data.table(db$sample)
if (!"age_at_enrollment" %in% names(sample)) sample[, age_at_enrollment := NA_real_]
if (!"age_source" %in% names(sample)) sample[, age_source := NA_character_]
sample_hpo <- as.data.table(db$sample_hpo)
hpo_edge <- as.data.table(db$hpo_edge)
hpo_ancestor <- as.data.table(db$hpo_ancestor)
hpo_term <- as.data.table(db$hpo_term)
sample_variant <- as.data.table(db$sample_variant)
variant_carrier <- as.data.table(db$variant_carrier)
gene_carrier <- as.data.table(db$gene_carrier)
sample_gene_summary <- as.data.table(db$sample_gene_variant_evidence_summary)
disease_match <- as.data.table(db$sample_disease_profile_match_summary)
disease_gene_weight <- as.data.table(db$disease_gene_weight)
hpo_gene_disease <- as.data.table(db$hpo_gene_disease)
ddg2p_gene_disease <- as.data.table(db$ddg2p_gene_disease)
gene_annotation_summary <- as.data.table(db$gene_annotation_summary)
disease <- as.data.table(db$disease)
disease_id_map <- as.data.table(db$disease_id_map)
mondo_term <- as.data.table(db$mondo_term)

query_variant_id <- "chr5:150203773:T:A"
vrow <- sample_variant[variant_id == query_variant_id][1]
if (!nrow(vrow)) stop("Query variant missing from sample_variant: ", query_variant_id)
query_gene <- as.character(vrow$gene_symbol[1])

fmt <- function(x, empty = "-") {
  x <- as.character(x)
  x[is.na(x) | x == "" | x == "NA" | x == "NaN"] <- empty
  x
}

sex_value <- function(x) {
  value <- tolower(fmt(x, ""))
  if (value %in% c("female", "f")) return("female")
  if (value %in% c("male", "m")) return("male")
  "unknown"
}

`%||%` <- function(x, y) {
  if (is.null(x) || !length(x) || all(is.na(x))) y else x
}

clean_label <- function(x) {
  gsub("_", " ", fmt(x), fixed = TRUE)
}

split_values <- function(x) {
  values <- unique(unlist(strsplit(paste(fmt(x, ""), collapse = ";"), ";", fixed = TRUE)))
  values <- trimws(values)
  values[values != "" & values != "-"]
}

fmt_num <- function(x, digits = 2, empty = "-") {
  ifelse(is.na(x), empty, format(round(as.numeric(x), digits), scientific = FALSE, trim = TRUE))
}

age_at_enrollment_value <- function(x) {
  x <- suppressWarnings(as.numeric(x))
  ifelse(is.na(x), NA_real_, x)
}

age_at_enrollment_label <- function(x, empty = "-") {
  x <- suppressWarnings(as.numeric(x))
  if (is.na(x)) return(empty)
  value <- if (abs(x - round(x)) < 0.001) as.character(as.integer(round(x))) else fmt_num(x, 1, empty)
  paste(value, "years")
}

age_source_label <- function(age, source) {
  age <- suppressWarnings(as.numeric(age))
  if (is.na(age)) return("-")
  fmt(source)
}

diagnosed_label <- function(x) {
  if (isTRUE(x)) return("Yes")
  if (identical(x, FALSE)) return("No")
  "N/A"
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

display_disease_id <- function(id) {
  id <- fmt(id, "")
  id <- gsub("^Orpha[_ ]", "ORPHA:", id)
  id <- gsub("^OMIM[_ ]", "OMIM:", id)
  id <- gsub("^MONDO[_ ]", "MONDO:", id)
  id <- gsub("^DECIPHER[_ ]", "DECIPHER:", id)
  id
}

lookup_disease_ids <- function(id) {
  raw_id <- fmt(id, "")
  display_id <- display_disease_id(raw_id)
  unique(c(
    raw_id,
    display_id,
    gsub("^ORPHA:", "Orpha_", display_id),
    gsub("^OMIM:", "OMIM_", display_id),
    gsub("^MONDO:", "MONDO_", display_id)
  ))
}

mondo_lookup <- merge(
  disease_id_map,
  mondo_term[, .(mondo_id, mondo_name)],
  by = "mondo_id",
  all.x = TRUE,
  sort = FALSE
)
mondo_lookup <- mondo_lookup[!is.na(source_disease_id) & source_disease_id != "", .(
  disease_id = source_disease_id,
  disease_name = clean_label(mondo_name),
  disease_source = paste(fmt(source, "source"), "via MONDO")
)]

disease_reference_lookup <- unique(rbindlist(list(
  disease_match[, .(
    disease_id,
    disease_name = clean_label(disease_name),
    disease_source = fmt(disease_source, "Reference profile")
  )],
  disease[, .(
    disease_id,
    disease_name = clean_label(disease_name),
    disease_source = fmt(disease_source, "Reference profile")
  )],
  mondo_lookup
), fill = TRUE))

disease_reference_record <- function(id, fallback_name = "") {
  raw_id <- fmt(id, "")
  ref <- disease_reference_lookup[disease_id %in% lookup_disease_ids(raw_id)][1]
  display_id <- display_disease_id(raw_id)
  disease_name <- if (nrow(ref) > 0 && !is.na(ref$disease_name) && ref$disease_name != "-") ref$disease_name else fallback_name
  source <- if (nrow(ref) > 0 && !is.na(ref$disease_source) && ref$disease_source != "-") ref$disease_source else "Reference profile"
  label <- paste(c(display_id, disease_name)[c(display_id, disease_name) != ""], collapse = " · ")
  list(id = display_id, rawId = raw_id, name = disease_name, source = source, label = label)
}

make_disease_gene_links <- function() {
  links <- list()
  if (nrow(disease_gene_weight)) {
    links[[length(links) + 1]] <- disease_gene_weight[
      !is.na(gene_symbol) & gene_symbol != "" & !is.na(disease_id) & disease_id != "",
      .(gene_symbol, disease_id, evidence_source)
    ]
  }
  if (nrow(hpo_gene_disease)) {
    links[[length(links) + 1]] <- hpo_gene_disease[
      !is.na(gene_symbol) & gene_symbol != "" & !is.na(source_disease_id) & source_disease_id != "",
      .(gene_symbol, disease_id = source_disease_id, evidence_source)
    ]
  }
  if (nrow(ddg2p_gene_disease) && all(c("gene_symbol", "disease_mim") %in% names(ddg2p_gene_disease))) {
    links[[length(links) + 1]] <- ddg2p_gene_disease[
      !is.na(gene_symbol) & gene_symbol != "" & !is.na(disease_mim) & disease_mim != "",
      .(gene_symbol, disease_id = paste0("OMIM:", disease_mim), evidence_source)
    ]
  }
  if (!length(links)) return(data.table(gene_symbol = character(), disease_id = character(), evidence_source = character(), disease_key = character()))
  merged <- unique(rbindlist(links, fill = TRUE))
  merged[, disease_key := display_disease_id(disease_id)]
  merged
}

disease_gene_links <- make_disease_gene_links()

compact_list_label <- function(values, prefix = "", limit = 2) {
  values <- split_values(values)
  if (!length(values)) return("")
  values <- gsub("_", " ", values, fixed = TRUE)
  label <- paste(head(values, limit), collapse = "; ")
  if (length(values) > limit) label <- paste0(label, "; +", length(values) - limit, " more")
  paste0(prefix, label)
}

secondary_annotation_label <- function(gene) {
  row <- gene_annotation_summary[gene_symbol == gene][1]
  if (!nrow(row)) return("-")
  parts <- c(
    compact_list_label(row$ddg2p_disease_names, "DDG2P: ", 1),
    compact_list_label(row$panel_names, "PanelApp: ", 1),
    compact_list_label(row$pathway_names, "Pathway: ", 1)
  )
  parts <- parts[parts != ""]
  if (!length(parts)) return("-")
  paste(head(parts, 2), collapse = " · ")
}

make_co_carrier_gene_references <- function(current_genes) {
  current_genes <- sort(unique(current_genes[!is.na(current_genes) & current_genes != ""]))
  co_genes <- setdiff(current_genes, query_gene)
  if (!length(co_genes)) return(list())
  if (!nrow(disease_gene_links)) {
    return(setNames(lapply(co_genes, function(gene) list(diseaseReferences = list(), diseaseReference = "-", secondaryAnnotation = secondary_annotation_label(gene))), co_genes))
  }

  disease_gene_sets <- disease_gene_links[, .(
    linkedGeneCount = uniqueN(gene_symbol),
    diseaseGenes = list(sort(unique(gene_symbol))),
    sources = list(sort(unique(fmt(evidence_source, "reference"))))
  ), by = disease_key]

  result <- lapply(co_genes, function(gene) {
    gene_diseases <- unique(disease_gene_links[gene_symbol == gene, disease_key])
    refs <- lapply(gene_diseases, function(key) {
      disease_set <- disease_gene_sets[disease_key == key][1]
      if (!nrow(disease_set)) return(NULL)
      overlap_genes <- sort(intersect(current_genes, disease_set$diseaseGenes[[1]]))
      record <- disease_reference_record(key)
      overlap_label <- paste0(length(overlap_genes), "/", disease_set$linkedGeneCount, " genes")
      list(
        id = record$id,
        rawId = record$rawId,
        name = record$name,
        source = paste(disease_set$sources[[1]], collapse = "; "),
        overlap = overlap_label,
        overlapGenes = as.list(overlap_genes),
        diseaseGenes = as.list(disease_set$diseaseGenes[[1]]),
        linkedGeneCount = as.integer(disease_set$linkedGeneCount),
        label = paste(c(record$label, overlap_label)[c(record$label, overlap_label) != ""], collapse = " · ")
      )
    })
    refs <- Filter(Negate(is.null), refs)
    refs <- refs[order(
      -vapply(refs, function(ref) length(ref$overlapGenes), numeric(1)),
      vapply(refs, function(ref) ref$linkedGeneCount, numeric(1)),
      vapply(refs, function(ref) ref$label, character(1))
    )]
    list(
      diseaseReferences = if (length(refs)) refs[1:min(length(refs), 3)] else list(),
      diseaseReference = if (length(refs)) refs[[1]]$label else "-",
      secondaryAnnotation = secondary_annotation_label(gene)
    )
  })
  names(result) <- co_genes
  result
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

make_carrier_samples <- function(carrier_rows, context = "variant") {
  if (!nrow(carrier_rows)) return(list())
  if (!"variant_id" %in% names(carrier_rows)) carrier_rows[, variant_id := NA_character_]
  if (!"genotype" %in% names(carrier_rows)) carrier_rows[, genotype := NA_character_]
  rows <- carrier_rows[, .(
    cohort_id = fmt(cohort_id[which(!is.na(cohort_id) & cohort_id != "")][1], "-"),
    affected_flag = any(affected_flag == TRUE, na.rm = TRUE)
  ), by = sample_id][order(sample_id)]
  sample_ids <- unique(rows$sample_id)
  context_variant_rows <- if (identical(context, "gene")) {
    sample_variant[sample_id %in% sample_ids & gene_symbol == query_gene]
  } else {
    carrier_rows
  }
  if (!"variant_id" %in% names(context_variant_rows)) context_variant_rows[, variant_id := NA_character_]
  if (!"genotype" %in% names(context_variant_rows)) context_variant_rows[, genotype := NA_character_]
  context_variant_summary <- context_variant_rows[, .(
    variant_count = uniqueN(variant_id[!is.na(variant_id) & variant_id != ""]),
    genotype = {
      values <- unique(fmt(genotype, ""))
      values <- values[values != "" & values != "-"]
      if (length(values)) paste(values, collapse = ", ") else "-"
    }
  ), by = sample_id][order(sample_id)]
  rows <- merge(rows, context_variant_summary, by = "sample_id", all.x = TRUE, sort = FALSE)
  rows[is.na(variant_count), variant_count := 0L]
  rows[is.na(genotype), genotype := "-"]
  rows <- merge(
    rows,
    sample[, .(sample_id, gender, age_band, age_at_analysis, age_at_enrollment, age_source, proband_flag, diagnosed_flag)],
    by = "sample_id",
    all.x = TRUE,
    sort = FALSE
  )
  sample_gene_list <- sample_variant[
    sample_id %in% sample_ids & !is.na(gene_symbol) & gene_symbol != "",
    .(
      variantGenes = list(sort(unique(gene_symbol))),
      variantGeneCount = uniqueN(gene_symbol)
    ),
    by = sample_id
  ]
  rows <- merge(rows, sample_gene_list, by = "sample_id", all.x = TRUE, sort = FALSE)
  sample_hpo_profile <- unique(sample_hpo[
    sample_id %in% sample_ids & !hpo_id %in% c("HP:0000001", "HP:0000118"),
    .(sample_id, hpo_id)
  ])
  sample_root_map <- hpo_ancestor[
    hpo_id %in% sample_hpo_profile$hpo_id & ancestor_hpo_id %in% hpo_edge[parent_hpo_id == "HP:0000118", unique(hpo_id)],
    .SD[which.min(distance)],
    by = hpo_id
  ][, .(hpo_id, root_hpo_id = ancestor_hpo_id)]
  root_names_local <- hpo_term[hpo_id %in% hpo_edge[parent_hpo_id == "HP:0000118", unique(hpo_id)], .(root_hpo_id = hpo_id, root_name = hpo_name)]
  sample_root_profile <- merge(sample_hpo_profile, sample_root_map, by = "hpo_id", all.x = TRUE)
  sample_root_profile <- merge(sample_root_profile, root_names_local, by = "root_hpo_id", all.x = TRUE)
  sample_root_profile <- sample_root_profile[!is.na(root_hpo_id) & !is.na(root_name)]
  sample_root_profile[, root_label := paste0(root_name, " [", root_hpo_id, "]")]
  hpo_by_sample <- sample_hpo_profile[, .(hpoIds = list(sort(unique(hpo_id)))), by = sample_id]
  root_by_sample <- sample_root_profile[, .(rootCategories = list(sort(unique(root_label)))), by = sample_id]
  rows <- merge(rows, hpo_by_sample, by = "sample_id", all.x = TRUE, sort = FALSE)
  rows <- merge(rows, root_by_sample, by = "sample_id", all.x = TRUE, sort = FALSE)
  lapply(seq_len(nrow(rows)), function(i) {
    variant_genes <- rows$variantGenes[[i]]
    if (is.null(variant_genes) || !length(variant_genes) || all(is.na(variant_genes))) {
      variant_genes <- character()
    }
    list(
      id = rows$sample_id[i],
      age = age_label(rows$age_band[i], rows$age_at_analysis[i]),
      ageAtEnrollment = age_at_enrollment_value(rows$age_at_enrollment[i]),
      ageAtEnrollmentLabel = age_at_enrollment_label(rows$age_at_enrollment[i]),
      ageSource = age_source_label(rows$age_at_enrollment[i], rows$age_source[i]),
      sex = sex_value(rows$gender[i]),
      group = fmt(rows$cohort_id[i]),
      genotype = fmt(rows$genotype[i]),
      proband = ifelse(isTRUE(rows$proband_flag[i]), "Proband", "non-Proband"),
      affected = ifelse(isTRUE(rows$affected_flag[i]), "Yes", "No"),
      diagnosed = diagnosed_label(rows$diagnosed_flag[i]),
      variantCount = as.integer(rows$variant_count[i]),
      variantGeneCount = as.integer(rows$variantGeneCount[i] %||% 0L),
      variantGenes = as.list(variant_genes),
      hpoIds = as.list(rows$hpoIds[[i]] %||% character()),
      rootCategories = as.list(rows$rootCategories[[i]] %||% character())
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
    sampleIds = list(sort(unique(sample_id))),
    term_table = list(.SD[, .(label, n = uniqueN(sample_id)), by = .(hpo_id, label)][order(-n, label)])
  ), by = .(root_name, root_hpo_id)][order(-support, root_name)][1:min(.N, 6)]
  lapply(seq_len(nrow(grouped)), function(i) {
    terms <- grouped$term_table[[i]]
    top_terms <- terms[1:min(.N, 3), label]
    list(
      category = paste0(grouped$root_name[i], ifelse(grouped$root_hpo_id[i] == "OTHER", "", paste0(" [", grouped$root_hpo_id[i], "]"))),
      count = as.integer(grouped$term_count[i]),
      support = as.integer(grouped$support[i]),
      sampleIds = as.list(grouped$sampleIds[[i]]),
      topTerms = as.list(gsub("\\s*\\[[^]]+\\]$", "", top_terms)),
      terms = as.list(terms$label)
    )
  })
}

make_phenotype_rows <- function(root_profile, denominator, proband_denominator) {
  if (!length(root_profile)) return(list())
  lapply(root_profile[1:min(length(root_profile), 5)], function(row) {
    support <- suppressWarnings(as.numeric(row$support))
    if (!length(support) || is.na(support)) support <- 0
    all_percent <- as.integer(round(100 * support / max(1, denominator)))
    proband_percent <- as.integer(round(100 * support / max(1, proband_denominator)))
    list(
      label = row$category,
      all = all_percent,
      proband = min(all_percent, proband_percent)
    )
  })
}

make_density_series <- function(v, window_start, window_end) {
  positions <- seq(window_start, window_end)
  window_rows <- sample_variant[chrom == v$chrom & pos >= window_start & pos <= window_end]
  window_rows <- merge(
    window_rows,
    sample[, .(sample_id, cohort_id, proband_flag, affected_flag)],
    by = "sample_id",
    all.x = TRUE,
    sort = FALSE
  )

  count_by_pos <- function(rows) {
    counts <- setNames(rep(0L, length(positions)), as.character(positions))
    if (nrow(rows)) {
      by_pos <- rows[, .(n = uniqueN(sample_id)), by = pos]
      counts[as.character(by_pos$pos)] <- as.integer(by_pos$n)
    }
    as.list(as.integer(counts))
  }

  series_for <- function(rows) {
    list(
      all = count_by_pos(rows),
      affected = count_by_pos(rows[affected_flag == TRUE]),
      proband = count_by_pos(rows[proband_flag == TRUE])
    )
  }

  series <- list("all-investigators" = series_for(window_rows))
  groups <- sort(unique(fmt(window_rows$cohort_id, "")))
  groups <- groups[groups != "" & groups != "-"]
  for (group in groups) {
    series[[group]] <- series_for(window_rows[cohort_id == group])
  }
  series
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
disease_refs <- lapply(disease_labels[1:min(2, length(disease_labels))], disease_reference_record)
carrier_reference_genes <- sort(unique(sample_variant[sample_id %in% union(exact_ids, gene_ids), gene_symbol]))
co_carrier_gene_references <- make_co_carrier_gene_references(carrier_reference_genes)

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
    geneContext = list(
      list(label = "Nearest gene", value = query_gene),
      list(label = paste(query_gene, "variant carriers"), value = paste(gene_scope$all, "samples")),
      list(label = "Exact queried variant carriers", value = paste(variant_scope$all, "samples"))
    ),
    carrierSamples = make_carrier_samples(exact_carriers, "variant"),
    geneCarrierSamples = make_carrier_samples(gene_carriers, "gene"),
    variantDemographics = list(all = make_age_bins(exact_ids)),
    demographics = list(all = make_age_bins(gene_ids)),
    densitySeries = make_density_series(v, window_start, window_end),
    carrierPhenotypesByCategory = variant_roots,
    geneCarrierPhenotypesByCategory = gene_roots,
    coCarrierGeneReferences = co_carrier_gene_references,
    variantPhenotypes = list("all-investigators" = make_phenotype_rows(variant_roots, variant_scope$all, variant_scope$proband)),
    phenotypes = list("all-investigators" = make_phenotype_rows(gene_roots, gene_scope$all, gene_scope$proband)),
    diseaseSignals = lapply(disease_refs, function(x) list(label = x$label, id = x$id, rawId = x$rawId, name = x$name, source = x$source, scope = paste(query_gene, "gene-level reference support"))),
    relatedDiseases = lapply(disease_refs, function(x) list(name = x$label, id = x$id, rawId = x$rawId, source = x$source, domain = "rare disease reference", signal = paste(query_gene, "linked"))),
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
