library(data.table)
library(jsonlite)

portal_rds <- "/Users/kyuryung/Documents/Playground/crdc_portal_db/portal_db_test_20260529_132523/crdc_portal_test_db_tables.rds"
repo_dir <- "/Users/kyuryung/Documents/github_dir/dig-dug-portal"

out_sample_js <- file.path(repo_dir, "src/views/KrSample/portalSampleData.generated.js")
out_variant_js <- file.path(repo_dir, "src/views/KrVariant/portalVariantData.generated.js")
out_phenotype_js <- file.path(repo_dir, "src/views/KrPhenotype/portalPhenotypeData.generated.js")
out_focus_js <- file.path(repo_dir, "src/views/KrClinicalFocus/portalDiseaseReferenceData.generated.js")

db <- readRDS(portal_rds)

sample <- as.data.table(db$sample)
if (!"age_at_enrollment" %in% names(sample)) sample[, age_at_enrollment := NA_real_]
if (!"age_source" %in% names(sample)) sample[, age_source := NA_character_]
sample_page <- as.data.table(db$sample_page_summary)
sample_hpo <- as.data.table(db$sample_hpo)
hpo_edge <- as.data.table(db$hpo_edge)
hpo_ancestor <- as.data.table(db$hpo_ancestor)
hpo_term <- as.data.table(db$hpo_term)
hpo_gene_annotation <- as.data.table(db$hpo_gene_annotation)
hpo_gene_disease <- as.data.table(db$hpo_gene_disease)
hpo_disease_phenotype_positive <- as.data.table(db$hpo_disease_phenotype_positive)
disease <- as.data.table(db$disease)
disease_gene_weight <- as.data.table(db$disease_gene_weight)
disease_id_map <- as.data.table(db$disease_id_map)
mondo_term <- as.data.table(db$mondo_term)
sample_variant <- as.data.table(db$sample_variant)
same_variant_recurrence <- as.data.table(db$same_variant_recurrence)
same_gene_recurrence <- as.data.table(db$same_gene_recurrence)
variant_carrier <- as.data.table(db$variant_carrier)
gene_carrier <- as.data.table(db$gene_carrier)
sample_gene_summary <- as.data.table(db$sample_gene_variant_evidence_summary)
disease_match <- as.data.table(db$sample_disease_profile_match_summary)
cohort_score <- as.data.table(db$sample_to_cohort_phenotype_score)

preferred_sample <- "BCH-21-24935-01"
preferred_variant <- "chr5:150203773:T:A"
phenotype_query_ids <- c("HP:0003323", "HP:0001337", "HP:0001249", "HP:0000774")
broad_hpo_ids <- c("HP:0000001", "HP:0000118")
root_ids <- setdiff(hpo_edge[parent_hpo_id == "HP:0000118", unique(hpo_id)], broad_hpo_ids)
root_names <- hpo_term[hpo_id %in% root_ids, .(root_hpo_id = hpo_id, root_name = hpo_name)]

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

flag_value <- function(x) {
  length(x) > 0 && !is.na(x[1]) && isTRUE(as.logical(x[1]))
}

clean_label <- function(x) {
  x <- gsub("_", " ", fmt(x), fixed = TRUE)
  x
}

hpo_label <- function(ids) {
  ids <- setdiff(unique(ids[!is.na(ids) & ids != ""]), broad_hpo_ids)
  if (length(ids) == 0) return(character())
  dt <- data.table(hpo_id = ids)
  dt <- merge(dt, hpo_term[, .(hpo_id, hpo_name)], by = "hpo_id", all.x = TRUE)
  paste0(ifelse(is.na(dt$hpo_name), dt$hpo_id, dt$hpo_name), " [", dt$hpo_id, "]")
}

hpo_name_only <- function(ids) {
  ids <- setdiff(unique(ids[!is.na(ids) & ids != ""]), broad_hpo_ids)
  if (length(ids) == 0) return(character())
  dt <- data.table(hpo_id = ids)
  dt <- merge(dt, hpo_term[, .(hpo_id, hpo_name)], by = "hpo_id", all.x = TRUE)
  ifelse(is.na(dt$hpo_name), dt$hpo_id, dt$hpo_name)
}

split_ids <- function(x) {
  ids <- unlist(strsplit(fmt(x, ""), ";", fixed = TRUE))
  ids[ids != ""]
}

list_or_empty <- function(x) as.list(x)

term_root_table <- function(ids) {
  ids <- setdiff(unique(ids[!is.na(ids) & ids != ""]), broad_hpo_ids)
  if (!length(ids)) return(data.table(hpo_id = character(), root_hpo_id = character(), root_name = character()))
  dt <- data.table(hpo_id = ids)
  root_map <- hpo_ancestor[hpo_id %in% ids & ancestor_hpo_id %in% root_ids, .SD[which.min(distance)], by = hpo_id]
  root_map <- root_map[, .(hpo_id, root_hpo_id = ancestor_hpo_id)]
  dt <- merge(dt, root_map, by = "hpo_id", all.x = TRUE)
  dt[is.na(root_hpo_id), root_hpo_id := "OTHER"]
  dt <- merge(dt, root_names, by = "root_hpo_id", all.x = TRUE)
  dt[is.na(root_name), root_name := "Other phenotype terms"]
  dt
}

disease_reference_lookup <- unique(disease_match[, .(
  disease_id,
  disease_name = clean_label(disease_name),
  disease_source = fmt(disease_source)
)])

format_disease_reference <- function(ids, fallback = "-") {
  ids <- unique(unlist(strsplit(fmt(ids, ""), ";", fixed = TRUE)))
  ids <- ids[ids != ""]
  if (length(ids) == 0) return(fallback)
  labels <- vapply(ids, function(id) {
    ref <- disease_reference_lookup[disease_id == id][1]
    display_id <- gsub("^Orpha[_ ]", "ORPHA:", id)
    display_id <- gsub("^OMIM[_ ]", "OMIM:", display_id)
    display_id <- gsub("^MONDO[_ ]", "MONDO:", display_id)
    disease_name <- if (nrow(ref) > 0 && !is.na(ref$disease_name)) ref$disease_name else ""
    paste(c(display_id, disease_name)[c(display_id, disease_name) != ""], collapse = " · ")
  }, character(1))
  paste(labels, collapse = "; ")
}

make_hpo_term_objects <- function(ids, max_terms = 8) {
  ids <- setdiff(unique(ids[!is.na(ids) & ids != ""]), broad_hpo_ids)
  if (!length(ids)) return(list())
  dt <- data.table(hpo_id = ids)
  dt <- merge(dt, hpo_term[, .(hpo_id, hpo_name)], by = "hpo_id", all.x = TRUE)
  dt <- dt[order(hpo_name, hpo_id)][1:min(.N, max_terms)]
  lapply(seq_len(nrow(dt)), function(i) {
    list(id = dt$hpo_id[i], label = fmt(dt$hpo_name[i], dt$hpo_id[i]))
  })
}

make_disease_reference_index <- function(max_hpo_terms = 8) {
  disease_hpo <- hpo_disease_phenotype_positive[
    is_negated != TRUE & !hpo_id %in% broad_hpo_ids,
    .(
      disease_name = fmt(disease_name[which(!is.na(disease_name) & disease_name != "")][1], source_disease_id[1]),
      hpoTermCount = uniqueN(hpo_id),
      hpoIds = list(sort(unique(hpo_id)))
    ),
    by = .(source_disease_id, disease_source)
  ]

  orpha_from_disease <- disease[, .(
    source_disease_id = gsub("^Orpha_", "ORPHA:", disease_id),
    disease_source = "ORPHA",
    disease_name_from_disease = clean_label(disease_name),
    raw_disease_id = disease_id
  )]
  disease_hpo <- merge(disease_hpo, orpha_from_disease, by = c("source_disease_id", "disease_source"), all.x = TRUE)
  disease_hpo[!is.na(disease_name_from_disease) & disease_name_from_disease != "-", disease_name := disease_name_from_disease]
  disease_hpo[, sourceKey := fifelse(disease_source == "ORPHA", "orphanet", tolower(disease_source))]
  disease_hpo[, sourceLabel := fifelse(disease_source == "ORPHA", "Orphanet", disease_source)]
  disease_hpo[, rawId := fifelse(!is.na(raw_disease_id) & raw_disease_id != "", raw_disease_id, source_disease_id)]

  gene_counts_by_source <- hpo_gene_disease[
    !is.na(source_disease_id) & source_disease_id != "",
    .(linkedGeneCount = uniqueN(gene_symbol)),
    by = source_disease_id
  ]
  gene_counts_by_orpha <- disease_gene_weight[
    !is.na(disease_id) & disease_id != "",
    .(linkedGeneCountOrpha = uniqueN(gene_symbol)),
    by = .(raw_disease_id = disease_id)
  ]
  disease_hpo <- merge(disease_hpo, gene_counts_by_source, by = "source_disease_id", all.x = TRUE)
  disease_hpo <- merge(disease_hpo, gene_counts_by_orpha, by = "raw_disease_id", all.x = TRUE)
  disease_hpo[, linkedGeneCount := pmax(
    fifelse(is.na(linkedGeneCount), 0L, linkedGeneCount),
    fifelse(is.na(linkedGeneCountOrpha), 0L, linkedGeneCountOrpha)
  )]

  base_profiles <- disease_hpo[
    sourceKey %in% c("orphanet", "omim", "decipher"),
    .(sourceKey, sourceLabel, sourceId = source_disease_id, rawId, name = disease_name, hpoTermCount, linkedGeneCount, hpoIds)
  ]

  mondo_map <- disease_id_map[source %in% c("OMIM", "Orphanet"), .(source_disease_id, mondo_id)]
  mondo_hpo <- merge(
    mondo_map,
    disease_hpo[, .(source_disease_id, hpoIds)],
    by = "source_disease_id",
    allow.cartesian = TRUE
  )
  if (nrow(mondo_hpo) > 0) {
    mondo_hpo <- mondo_hpo[
      ,
      .(
        mappedReferenceCount = uniqueN(source_disease_id),
        hpoIds = list(sort(unique(unlist(hpoIds))))
      ),
      by = mondo_id
    ]
    mondo_hpo[, hpoTermCount := lengths(hpoIds)]
    mondo_hpo <- merge(mondo_hpo, mondo_term[, .(mondo_id, mondo_name)], by = "mondo_id", all.x = TRUE)
    mondo_profiles <- mondo_hpo[
      hpoTermCount > 0,
      .(
        sourceKey = "mondo",
        sourceLabel = "MONDO",
        sourceId = mondo_id,
        rawId = mondo_id,
        name = clean_label(mondo_name),
        hpoTermCount,
        linkedGeneCount = 0L,
        hpoIds
      )
    ]
    base_profiles <- rbind(base_profiles, mondo_profiles, fill = TRUE)
  }

  base_profiles <- unique(base_profiles[!is.na(sourceId) & sourceId != ""], by = c("sourceKey", "sourceId"))
  base_profiles <- base_profiles[order(sourceKey, name, sourceId)]

  lapply(seq_len(nrow(base_profiles)), function(i) {
    list(
      source = base_profiles$sourceKey[i],
      sourceLabel = base_profiles$sourceLabel[i],
      sourceId = base_profiles$sourceId[i],
      rawId = base_profiles$rawId[i],
      name = base_profiles$name[i],
      label = paste(c(base_profiles$sourceId[i], base_profiles$name[i])[c(base_profiles$sourceId[i], base_profiles$name[i]) != ""], collapse = " · "),
      hpoTermCount = as.integer(base_profiles$hpoTermCount[i]),
      linkedGeneCount = as.integer(base_profiles$linkedGeneCount[i]),
      hpoTerms = make_hpo_term_objects(base_profiles$hpoIds[[i]], max_hpo_terms)
    )
  })
}

make_domains <- function(hpo_ids, max_groups = 5) {
  ids <- setdiff(unique(hpo_ids[!is.na(hpo_ids) & hpo_ids != ""]), broad_hpo_ids)
  root_map <- term_root_table(ids)
  if (!nrow(root_map)) {
    return(list(list(name = "No HPO terms available", count = 0L, width = "0%", representativeTerms = list())))
  }
  labels <- merge(root_map, hpo_term[, .(hpo_id, hpo_name)], by = "hpo_id", all.x = TRUE)
  labels <- labels[root_hpo_id == "OTHER" | hpo_id != root_hpo_id]
  if (!nrow(labels)) {
    return(list(list(name = "No HPO terms available", count = 0L, width = "0%", representativeTerms = list())))
  }
  labels[, label := paste0(ifelse(is.na(hpo_name), hpo_id, hpo_name), " [", hpo_id, "]")]
  grouped <- labels[, .(
    count = uniqueN(hpo_id),
    representativeTerms = list(label[order(hpo_name, hpo_id)])
  ), by = .(root_name, root_hpo_id)][order(-count, root_name)]
  total <- uniqueN(labels$hpo_id)
  grouped <- grouped[1:min(.N, max_groups)]
  lapply(seq_len(nrow(grouped)), function(i) {
    root_label <- paste0(grouped$root_name[i], ifelse(grouped$root_hpo_id[i] == "OTHER", "", paste0(" [", grouped$root_hpo_id[i], "]")))
    width <- paste0(round(100 * grouped$count[i] / max(1, total)), "%")
    list(name = root_label, count = as.integer(grouped$count[i]), width = width, representativeTerms = as.list(grouped$representativeTerms[[i]]))
  })
}

sample_hpo_counts <- sample_hpo[, .(hpo_count = uniqueN(hpo_id)), by = sample_id]

pick_sample <- function() {
  if (preferred_sample %in% sample_page$sample_id) return(preferred_sample)
  ranked <- sample_gene_summary[
    candidate_label %in% c("external_and_crdc_supported", "uncurated_recurrent_candidate"),
    .(
      external = sum(candidate_label == "external_and_crdc_supported"),
      uncurated = sum(candidate_label == "uncurated_recurrent_candidate"),
      max_shared_hpo = max(shared_hpo_count, na.rm = TRUE),
      max_gene_carrier = max(gene_carrier_count, na.rm = TRUE)
    ),
    by = sample_id
  ][order(-external, -uncurated, -max_shared_hpo, -max_gene_carrier)]
  if (nrow(ranked) > 0) return(ranked$sample_id[1])
  sample_page$sample_id[1]
}

query_sample <- pick_sample()

make_sample_state <- function(query_sample) {
  sp <- sample_page[sample_id == query_sample][1]
  if (nrow(sp) == 0) stop(paste("Sample missing from sample_page_summary:", query_sample))
  sm <- sample[sample_id == query_sample][1]
  if (nrow(sm) == 0) stop(paste("Sample missing from sample table:", query_sample))

  query_hpo_ids <- sample_hpo[sample_id == query_sample, unique(hpo_id)]
  display_hpo_ids <- setdiff(query_hpo_ids, broad_hpo_ids)
  query_hpo_terms <- hpo_label(display_hpo_ids)
  query_variants <- sample_variant[sample_id == query_sample]
  query_gene_set <- sort(unique(query_variants$gene_symbol))
  rare_gene_count <- uniqueN(query_gene_set)
  sample_variant_options <- if (nrow(query_variants) > 0) {
    lapply(seq_len(nrow(query_variants)), function(i) {
      list(
        gene = fmt(query_variants$gene_symbol[i]),
        variantId = fmt(query_variants$variant_id[i]),
        consequence = fmt(query_variants$Consequence[i]),
        pathogenicity = fmt(query_variants$clinvar_clnsig[i]),
        sourceLabel = "Sample rare coding variant",
        isGendx = FALSE
      )
    })
  } else {
    list()
  }

  top_diseases <- disease_match[sample_id == query_sample][order(disease_match_rank)][1:min(.N, 5)]
  disease_matches <- list()
  if (nrow(top_diseases) > 0) {
    disease_matches <- lapply(seq_len(nrow(top_diseases)), function(i) {
      ids <- split_ids(top_diseases$matched_hpo_ids[i])
      list(
        name = clean_label(top_diseases$disease_name[i]),
        diseaseId = fmt(top_diseases$disease_id[i]),
        source = fmt(top_diseases$disease_source[i], "Orphapacket"),
        matchedHpoCount = as.integer(top_diseases$matched_hpo_count[i]),
        totalDiseaseHpoTerms = as.integer(top_diseases$disease_hpo_count[i]),
        overlap = paste0(as.integer(top_diseases$matched_hpo_count[i]), " / ", as.integer(top_diseases$disease_hpo_count[i])),
        notes = paste0("Weighted profile score ", fmt_num(top_diseases$weighted_match_score[i], 3)),
        matchedHpoTerms = list_or_empty(hpo_label(ids))
      )
    })
  }
  top_disease_name <- if (length(disease_matches) > 0) disease_matches[[1]]$name else "No disease profile match"

  top_cohort <- cohort_score[sample_id == query_sample][order(cohort_affinity_rank)]
  group_rows <- list()
  if (nrow(top_cohort) > 0) {
    max_score <- max(top_cohort$cohort_weighted_overlap, na.rm = TRUE)
    group_rows <- lapply(seq_len(nrow(top_cohort)), function(i) {
      dot <- ifelse(max_score > 0, round((top_cohort$cohort_weighted_overlap[i] / max_score) * 88), 50)
      list(
        rank = paste0(as.integer(top_cohort$cohort_affinity_rank[i]), "/", uniqueN(cohort_score$cohort_id)),
        label = fmt(top_cohort$cohort_id[i]),
        zScore = fmt_num(top_cohort$cohort_weighted_overlap[i], 2),
        dotLeft = paste0(max(8, min(92, dot)), "%")
      )
    })
  }

  query_profile_hpo_ids <- setdiff(query_hpo_ids, broad_hpo_ids)
  if (length(query_profile_hpo_ids) == 0) query_profile_hpo_ids <- query_hpo_ids

  hpo_cohort_frequency <- sample_hpo[
    !hpo_id %in% broad_hpo_ids,
    .(sample_n = uniqueN(sample_id)),
    by = hpo_id
  ]
  hpo_cohort_frequency[, hpo_weight := log((uniqueN(sample$sample_id) + 1) / (sample_n + 1))]
  hpo_cohort_frequency[hpo_weight < 0 | is.na(hpo_weight), hpo_weight := 0]
  query_profile_weights <- hpo_cohort_frequency[hpo_id %in% query_profile_hpo_ids]
  query_profile_denominator <- sum(query_profile_weights$hpo_weight, na.rm = TRUE)
  if (query_profile_denominator <= 0) query_profile_denominator <- max(1, length(query_profile_hpo_ids))

  pair_hits <- merge(
    data.table(hpo_id = query_profile_hpo_ids),
    sample_hpo[sample_id != query_sample, .(sample_id, hpo_id)],
    by = "hpo_id",
    allow.cartesian = TRUE
  )
  pair_hits <- merge(pair_hits, hpo_cohort_frequency[, .(hpo_id, hpo_weight)], by = "hpo_id", all.x = TRUE)
  pair_hits[is.na(hpo_weight), hpo_weight := 1]
  phenotype_neighbors <- pair_hits[, .(
    shared_hpo_count = uniqueN(hpo_id),
    shared_weighted_score = sum(unique(.SD[, .(hpo_id, hpo_weight)])$hpo_weight, na.rm = TRUE),
    shared_hpo_ids = paste(head(sort(unique(hpo_id)), 20), collapse = ";")
  ), by = sample_id]
  phenotype_neighbors <- merge(phenotype_neighbors, sample_hpo_counts, by = "sample_id", all.x = TRUE)
  phenotype_neighbors <- merge(phenotype_neighbors, sample_page[, .(sample_id, gender, age_band, cohort_id, top_disease_name)], by = "sample_id", all.x = TRUE)
  phenotype_neighbors <- merge(phenotype_neighbors, sample[, .(sample_id, age_at_enrollment, age_source)], by = "sample_id", all.x = TRUE)
  phenotype_neighbors[, profile_similarity_0_1 := pmin(1, shared_weighted_score / query_profile_denominator)]
  phenotype_neighbors <- phenotype_neighbors[order(-profile_similarity_0_1, -shared_hpo_count)][1:min(.N, 6)]

  sample_gene_set <- sample_variant[, .(genes = list(sort(unique(gene_symbol)))), by = sample_id]
  phenotype_matches <- list()
  if (nrow(phenotype_neighbors) > 0) {
    phenotype_matches <- lapply(seq_len(nrow(phenotype_neighbors)), function(i) {
      sid <- phenotype_neighbors$sample_id[i]
      shared_ids <- split_ids(phenotype_neighbors$shared_hpo_ids[i])
      other_genes <- sample_gene_set[sample_id == sid, genes]
      other_genes <- if (length(other_genes) > 0) other_genes[[1]] else character()
      shared_genes <- intersect(query_gene_set, other_genes)
      top_variant <- sample_variant[sample_id == sid & gene_symbol %in% shared_genes][1, variant_id]
      if (length(top_variant) == 0 || is.na(top_variant)) top_variant <- sample_variant[sample_id == sid][1, variant_id]
      list(
        sampleId = sid,
        similarityRank = paste0("Rank ", i),
        phenotypeProfileSimilarity = fmt_num(phenotype_neighbors$profile_similarity_0_1[i], 3),
        phenotypeProfileSimilarityLabel = paste0(fmt_num(phenotype_neighbors$profile_similarity_0_1[i], 3), " (0-1)"),
        sharedPhenotypeCount = paste0(phenotype_neighbors$shared_hpo_count[i], " / ", length(query_profile_hpo_ids)),
        sharedHpoTerms = list_or_empty(hpo_label(shared_ids)),
        bestDisease = clean_label(phenotype_neighbors$top_disease_name[i]),
        gene = ifelse(length(shared_genes) > 0, shared_genes[1], "-"),
        sharedGenes = list_or_empty(shared_genes),
        geneticClue = ifelse(length(shared_genes) > 0, "same gene in test subset", "phenotype only"),
        topSignalVariantId = fmt(top_variant),
        investigator = fmt(phenotype_neighbors$cohort_id[i]),
        sex = fmt(phenotype_neighbors$gender[i]),
        ageBand = fmt(phenotype_neighbors$age_band[i]),
        ageAtEnrollment = age_at_enrollment_value(phenotype_neighbors$age_at_enrollment[i]),
        ageAtEnrollmentLabel = age_at_enrollment_label(phenotype_neighbors$age_at_enrollment[i]),
        ageSource = age_source_label(phenotype_neighbors$age_at_enrollment[i], phenotype_neighbors$age_source[i]),
        notes = "Ranked by normalized phenotype profile similarity"
      )
    })
  }

  gene_rows <- sample_gene_summary[sample_id == query_sample]
  if (nrow(gene_rows) > 0) {
    gene_rows[, sort_score := 0]
    gene_rows[has_same_variant_recurrence == TRUE, sort_score := sort_score + 4]
    gene_rows[has_same_gene_recurrence == TRUE, sort_score := sort_score + 3]
    gene_rows[has_carrier_phenotype_overlap == TRUE, sort_score := sort_score + 3]
    gene_rows[has_core_rare_disease_reference == TRUE, sort_score := sort_score + 2]
    gene_rows[has_panelapp_green_support == TRUE, sort_score := sort_score + 1]
    gene_rows <- gene_rows[order(-sort_score, -gene_carrier_count, -shared_hpo_count)][1:min(.N, 8)]
  }

  candidate_genes <- list()
  if (nrow(gene_rows) > 0) {
    candidate_genes <- lapply(seq_len(nrow(gene_rows)), function(i) {
      g <- gene_rows$gene_symbol[i]
      gv <- sample_variant[sample_id == query_sample & gene_symbol == g][1:min(.N, 5)]
      if (nrow(gv) == 0) gv <- sample_variant[sample_id == query_sample][1:min(.N, 1)]
      variants <- lapply(seq_len(nrow(gv)), function(j) {
        recur <- same_variant_recurrence[variant_id == gv$variant_id[j] & gene_symbol == g]
        list(
          variantId = gv$variant_id[j],
          consequence = fmt(gv$Consequence[j]),
          transcript = paste(c(fmt(gv$MANE[j]), fmt(gv$APPRIS[j]), paste0("PICK=", fmt(gv$PICK[j]))), collapse = " / "),
          gnomad = fmt_num(gv$gnomad_exome_af[j], 5),
          dp = fmt_num(gv$depth[j], 0),
          revel = fmt_num(gv$revel_score[j], 3),
          alphaMissense = fmt_num(gv$alphamissense_score[j], 3),
          lof = fmt(gv$lof_class[j]),
          clinvar = fmt(gv$clinvar_clnsig[j]),
          tier = fmt(gv$AR_genotype_group[j]),
          carriers = ifelse(nrow(recur) > 0, as.integer(recur$carrier_count[1]), 1L),
          consistency = paste0(as.integer(gene_rows$shared_hpo_count[i]), " shared carrier HPO terms")
        )
      })
      fit_ids <- split_ids(gene_rows$shared_hpo_ids[i])
      disease_link <- format_disease_reference(gene_rows$orpha_disease_ids[i])
      if (disease_link == "-") disease_link <- top_disease_name
      variant_interpretation <- fmt(gv$clinvar_clnsig[1], "")
      if (variant_interpretation == "" || variant_interpretation == "-") {
        variant_interpretation <- ifelse(fmt(gv$lof_class[1]) != "-", paste("LoFTEE", fmt(gv$lof_class[1])), "Pathogenicity not available")
      }
      list(
        gene = g,
        bestVariantId = fmt(gene_rows$best_variant_id[i]),
        bestVariant = paste(fmt(gene_rows$best_variant_id[i]), fmt(gv$Consequence[1]), variant_interpretation, sep = " · "),
        diseaseLink = disease_link,
        phenotypeFit = paste0(as.integer(gene_rows$shared_hpo_count[i]), " shared carrier HPO terms"),
        phenotypeFitTerms = list_or_empty(hpo_label(fit_ids)),
        internalSupport = paste0(as.integer(gene_rows$gene_carrier_count[i]), " same-gene carriers, ", as.integer(gene_rows$max_variant_carrier_count[i]), " same-variant carriers"),
        gendxSupport = ifelse(isTRUE(gene_rows$has_panelapp_green_support[i]), "PanelApp Green annotation", "not PanelApp Green"),
        priorityReason = fmt(gene_rows$candidate_label[i]),
        variantCount = as.integer(gene_rows$variant_count[i]),
        highestConsequence = fmt(gv$Consequence[1]),
        bestEvidence = paste0("REVEL ", fmt_num(gene_rows$best_revel[i], 3), " / AM ", fmt_num(gene_rows$best_alphamissense[i], 3)),
        clinvar = fmt(gv$clinvar_clnsig[1]),
        inheritance = fmt(gene_rows$modes_of_inheritance[i]),
        diseases = disease_link,
        phenotypeMatch = paste0(as.integer(gene_rows$shared_hpo_count[i]), " shared carrier HPO terms"),
        similarCarrierSamples = paste0(as.integer(gene_rows$carrier_count_with_shared_hpo[i]), " phenotype-overlapping carriers"),
        variants = variants
      )
    })
  }

  first_gene <- if (length(candidate_genes) > 0) candidate_genes[[1]]$gene else fmt(query_gene_set[1])
  first_variant <- if (length(candidate_genes) > 0) candidate_genes[[1]]$bestVariantId else if (nrow(query_variants) > 0) fmt(query_variants$variant_id[1]) else "-"
  query_variant_count <- nrow(query_variants)

  make_genotype_rows <- function(mode, top_gene = NULL, top_variant = NULL) {
    summarize_genotype_phenotype_overlap <- function(sid) {
      overlap_ids <- intersect(query_profile_hpo_ids, sample_hpo[sample_id == sid, hpo_id])
      overlap_ids <- unique(overlap_ids[!is.na(overlap_ids) & overlap_ids != ""])
      overlap_weights <- hpo_cohort_frequency[hpo_id %in% overlap_ids, .(hpo_id, hpo_weight)]
      overlap_score <- sum(unique(overlap_weights)$hpo_weight, na.rm = TRUE)
      profile_similarity <- pmin(1, overlap_score / query_profile_denominator)

      ancestor_overlap_ids <- hpo_ancestor[
        hpo_id %in% overlap_ids &
          ancestor_hpo_id %in% overlap_ids &
          hpo_id != ancestor_hpo_id,
        unique(ancestor_hpo_id)
      ]
      key_ids <- setdiff(overlap_ids, ancestor_overlap_ids)
      if (length(key_ids) == 0) key_ids <- overlap_ids
      key_rank <- merge(
        data.table(hpo_id = key_ids),
        hpo_cohort_frequency[, .(hpo_id, hpo_weight)],
        by = "hpo_id",
        all.x = TRUE
      )
      key_rank[is.na(hpo_weight), hpo_weight := 0]
      key_ids <- key_rank[order(-hpo_weight, hpo_id), hpo_id]

      list(
        overlap_ids = overlap_ids,
        overlap_label = paste0(length(overlap_ids), " / ", length(query_profile_hpo_ids), " shared HPO terms"),
        profile_similarity_label = paste0(fmt_num(profile_similarity, 3), " (0-1)"),
        key_label = {
          labels <- hpo_label(head(key_ids, 3))
          if (length(labels) == 0) "-" else paste(labels, collapse = "; ")
        }
      )
    }

    rows <- list()
    if (mode == "variant") {
      recurrent <- query_variants[variant_id %in% same_variant_recurrence[carrier_count >= 2, variant_id]]
      if (!is.null(top_variant) && !is.na(top_variant) && top_variant != "-" && top_variant != "") {
        preferred <- query_variants[variant_id == top_variant]
        recurrent <- unique(rbind(preferred, recurrent, fill = TRUE), by = c("variant_id", "gene_symbol"))
      }
      if (nrow(recurrent) > 0) {
        sv <- recurrent[1]
        carriers <- variant_carrier[variant_id == sv$variant_id & gene_symbol == sv$gene_symbol & sample_id != query_sample][1:min(.N, 6)]
        if (nrow(carriers) > 0) {
          rows <- lapply(seq_len(nrow(carriers)), function(i) {
            sid <- carriers$sample_id[i]
            phenotype_summary <- summarize_genotype_phenotype_overlap(sid)
            matched_meta <- sample_page[sample_id == sid][1]
            matched_sample <- sample[sample_id == sid][1]
            list(
              sampleId = sid,
              similarity = "Same variant",
              ageBand = fmt(matched_meta$age_band),
              ageAtEnrollment = age_at_enrollment_value(matched_sample$age_at_enrollment),
              ageAtEnrollmentLabel = age_at_enrollment_label(matched_sample$age_at_enrollment),
              ageSource = age_source_label(matched_sample$age_at_enrollment, matched_sample$age_source),
              sharedGene = sv$gene_symbol,
              queryVariantEvidence = paste("Queried sample:", sv$variant_id),
              matchedVariantEvidence = paste("Matched sample:", sv$variant_id),
              queryMatchSummary = paste0("1 / ", query_variant_count, " searched sample variants matched"),
              phenotypeOverlap = phenotype_summary$overlap_label,
              phenotypeProfileSimilarityLabel = phenotype_summary$profile_similarity_label,
              keyPhenotypes = phenotype_summary$key_label
            )
          })
        }
      }
    } else if (!is.null(top_gene) && !is.na(top_gene) && top_gene != "") {
      carriers <- gene_carrier[gene_symbol == top_gene & sample_id != query_sample][1:min(.N, 6)]
      if (nrow(carriers) > 0) {
        rows <- lapply(seq_len(nrow(carriers)), function(i) {
          sid <- carriers$sample_id[i]
          phenotype_summary <- summarize_genotype_phenotype_overlap(sid)
          matched_meta <- sample_page[sample_id == sid][1]
          matched_sample <- sample[sample_id == sid][1]
          matched_variant <- sample_variant[sample_id == sid & gene_symbol == top_gene][1, variant_id]
          list(
            sampleId = sid,
            similarity = "Same gene",
            ageBand = fmt(matched_meta$age_band),
            ageAtEnrollment = age_at_enrollment_value(matched_sample$age_at_enrollment),
            ageAtEnrollmentLabel = age_at_enrollment_label(matched_sample$age_at_enrollment),
            ageSource = age_source_label(matched_sample$age_at_enrollment, matched_sample$age_source),
            sharedGene = top_gene,
            queryVariantEvidence = paste("Queried sample:", ifelse(is.null(top_variant) || is.na(top_variant) || top_variant == "", fmt(gene_rows$best_variant_id[1]), fmt(top_variant))),
            matchedVariantEvidence = paste("Matched sample:", fmt(matched_variant)),
            queryMatchSummary = "Same gene matched",
            phenotypeOverlap = phenotype_summary$overlap_label,
            phenotypeProfileSimilarityLabel = phenotype_summary$profile_similarity_label,
            keyPhenotypes = phenotype_summary$key_label
          )
        })
      }
    }
    if (length(rows) == 0) {
      rows <- list(list(
        sampleId = "none",
        sampleLabel = paste("No", mode, "recurrence rows in test DB for this sample"),
        similarity = "-",
        ageBand = "-",
        ageAtEnrollment = NA_real_,
        ageAtEnrollmentLabel = "-",
        ageSource = "-",
        sharedGene = "",
        queryVariantEvidence = paste("Queried sample:", ifelse(is.null(top_variant) || is.na(top_variant) || top_variant == "", fmt(query_variants$variant_id[1]), fmt(top_variant))),
        matchedVariantEvidence = "Matched sample: none",
        queryMatchSummary = "-",
        phenotypeOverlap = "-",
        phenotypeProfileSimilarityLabel = "-",
        keyPhenotypes = "-"
      ))
    }
    rows
  }

  genotype_groups <- list(
    list(label = "Same variant", summary = "Exact same-variant carrier search from test DB", rows = make_genotype_rows("variant", first_gene, first_variant)),
    list(label = "Same gene", summary = paste("Same-gene carriers for", first_gene), rows = make_genotype_rows("gene", first_gene, first_variant))
  )

  sample_obj <- list(
    sampleId = query_sample,
    affected = ifelse(flag_value(sm$affected_flag), "Affected", "Unaffected"),
    proband = ifelse(flag_value(sm$proband_flag), "Proband", "non-Proband"),
    affectedStatus = ifelse(flag_value(sm$affected_flag), "Yes", "No"),
    probandStatus = ifelse(flag_value(sm$proband_flag), "Yes", "No"),
    sex = fmt(sm$gender),
    ageGroup = fmt(sm$age_band),
    ageBand = fmt(sm$age_band),
    ageAtEnrollment = age_at_enrollment_value(sm$age_at_enrollment),
    ageAtEnrollmentLabel = age_at_enrollment_label(sm$age_at_enrollment),
    ageSource = age_source_label(sm$age_at_enrollment, sm$age_source),
    investigator = fmt(sm$investigator, fmt(sm$cohort_id)),
    department = "CRDC",
    hpoTotal = as.integer(sp$sample_hpo_count),
    overviewHpoTermCount = as.integer(sp$sample_hpo_count),
    rareCodingGenes = as.integer(rare_gene_count),
    prioritizedGenes = length(candidate_genes),
    dominantPhenotypeDomain = ifelse(length(query_hpo_terms) > 0, query_hpo_terms[1], "-"),
    dominantPhenotypeCount = 1L,
    overviewDominantHpoGroup = ifelse(length(query_hpo_terms) > 0, query_hpo_terms[1], "-"),
    contextComparison = list(hpoTermCount = as.integer(sp$sample_hpo_count), dominantHpoGroup = ifelse(length(query_hpo_terms) > 0, query_hpo_terms[1], "-"), overlap = "No active context", dominantOverlapGroup = "-"),
    topCandidate = paste(first_gene, first_variant),
    selectedResidual = "not calculated",
    groupScanSummary = paste0(uniqueN(cohort_score$cohort_id), " investigator phenotype signatures scored by HPO overlap"),
    gendx = list(
      resultCount = 0L,
      shortStatus = ifelse(flag_value(sm$diagnosed_flag), "Diagnosed", "Undiagnosed"),
      status = ifelse(flag_value(sm$diagnosed_flag), "Diagnosed in sample metadata", "Not diagnosed in sample metadata"),
      gene = first_gene,
      variantId = first_variant,
      consequence = fmt(query_variants$Consequence[1]),
      pathogenicity = fmt(query_variants$clinvar_clnsig[1]),
      interpretation = "This mockup is populated from the 350-sample test portal DB. GenDx-specific reported diagnosis fields are limited in this export."
    ),
    positionMetrics = list(
      list(label = "Closest phenotype profile match", value = ifelse(length(phenotype_matches) > 0, paste0(phenotype_matches[[1]]$sampleId, " · profile similarity ", phenotype_matches[[1]]$phenotypeProfileSimilarityLabel), "-"), text = "Computed as a PheRS-like weighted phenotype profile similarity scaled from 0 to 1. More specific shared HPO terms contribute more than broad ontology terms."),
      list(label = "Investigator context", value = fmt(sp$top_affinity_cohort_id), text = "Computed from sample-to-investigator phenotype-signature overlap in the test DB."),
      list(label = "Public disease profile reference", value = top_disease_name, text = "Computed from sample HPO overlap with Orphapacket disease-HPO profiles.")
    ),
    groupAffinityTop = group_rows[1:min(length(group_rows), 3)],
    groupAffinityOther = if (length(group_rows) > 3) group_rows[4:length(group_rows)] else list(),
    phenotypeDomains = make_domains(display_hpo_ids),
    fullHpoTerms = list_or_empty(query_hpo_terms),
    phenotypeMatches = phenotype_matches,
    genotypeGroups = genotype_groups,
    diseaseMatches = disease_matches,
    candidateGenes = candidate_genes,
    sampleVariantOptions = sample_variant_options,
    comparePreview = list(
      list(label = "Phenotype overlap", value = "test DB", text = "Shared HPO terms are computed directly from the test portal DB."),
      list(label = "Genetic overlap", value = "same variant / same gene", text = "Genotype similarity is centered on recurrence, not global genotype similarity."),
      list(label = "Disease profile reference overlap", value = top_disease_name, text = "External disease match remains reference evidence."),
      list(label = "Conclusion", value = "rendering test", text = "This is a portal UI test, not final clinical interpretation.")
    )
  )

  list(
    referenceSampleId = ifelse(length(phenotype_matches) > 0, phenotype_matches[[1]]$sampleId, query_sample),
    selectedInvestigatorGroup = fmt(sp$top_affinity_cohort_id),
    openDiseases = setNames(as.list(rep(TRUE, max(1, length(disease_matches)))), if (length(disease_matches) > 0) vapply(disease_matches, function(x) x$name, character(1)) else "No disease"),
    expandedGenes = setNames(as.list(rep(TRUE, max(1, min(3, length(candidate_genes))))), if (length(candidate_genes) > 0) vapply(candidate_genes[1:min(3, length(candidate_genes))], function(x) x$gene, character(1)) else "NoGene"),
    sample = sample_obj
  )
}

sample_state <- make_sample_state(query_sample)

preferred_variant_row <- sample_variant[variant_id == preferred_variant][1]
if (nrow(preferred_variant_row) == 0) {
  warning("Preferred variant not found in sample_variant; falling back to sample GenDx/default variant.")
  top_variant_query <- sample_state$sample$gendx$variantId
  top_gene_query <- sample_state$sample$gendx$gene
} else {
  top_variant_query <- preferred_variant
  top_gene_query <- fmt(preferred_variant_row$gene_symbol[1], sample_state$sample$gendx$gene)
}

make_carrier_domains <- function(carrier_ids, denominator) {
  carrier_terms <- sample_hpo[sample_id %in% carrier_ids & !hpo_id %in% broad_hpo_ids, .(sample_id, hpo_id)]
  root_map <- term_root_table(unique(carrier_terms$hpo_id))
  carrier_terms <- merge(carrier_terms, root_map, by = "hpo_id", all.x = TRUE)
  carrier_terms <- carrier_terms[!is.na(root_name)]
  if (nrow(carrier_terms) == 0) {
    return(list(list(category = "No carrier HPO terms available", count = 0L, topTerms = list(), terms = list())))
  }
  labels <- merge(carrier_terms, hpo_term[, .(hpo_id, hpo_name)], by = "hpo_id", all.x = TRUE)
  labels <- labels[root_hpo_id == "OTHER" | hpo_id != root_hpo_id]
  if (nrow(labels) == 0) {
    return(list(list(category = "No carrier HPO terms available", count = 0L, topTerms = list(), terms = list())))
  }
  term_support <- labels[, .(
    support = uniqueN(sample_id),
    hpo_name = fmt(hpo_name[1], hpo_id[1])
  ), by = .(root_name, root_hpo_id, hpo_id)]
  grouped <- term_support[, .(
    count = uniqueN(labels[root_name == .BY$root_name & root_hpo_id == .BY$root_hpo_id, sample_id]),
    topTerms = list(head(hpo_name[order(-support, hpo_name)], 6)),
    terms = list(head(paste0(hpo_name[order(-support, hpo_name)], " [", hpo_id[order(-support, hpo_name)], "]"), 12))
  ), by = .(root_name, root_hpo_id)][order(-count, root_name)][1:min(.N, 5)]
  lapply(seq_len(nrow(grouped)), function(i) {
    category <- paste0(grouped$root_name[i], ifelse(grouped$root_hpo_id[i] == "OTHER", "", paste0(" [", grouped$root_hpo_id[i], "]")))
    list(
      category = category,
      count = as.integer(grouped$count[i]),
      topTerms = list_or_empty(grouped$topTerms[[i]]),
      terms = list_or_empty(grouped$terms[[i]])
    )
  })
}

make_carrier_samples <- function(carriers) {
  if (nrow(carriers) == 0) return(list())
  carriers <- merge(
    carriers[, .(sample_id, cohort_id, affected_flag)],
    sample[, .(sample_id, gender, age_band, age_at_enrollment, age_source, proband_flag, diagnosed_flag)],
    by = "sample_id",
    all.x = TRUE
  )
  lapply(seq_len(nrow(carriers)), function(i) {
    list(
      id = carriers$sample_id[i],
      age = fmt(carriers$age_band[i]),
      ageAtEnrollment = age_at_enrollment_value(carriers$age_at_enrollment[i]),
      ageAtEnrollmentLabel = age_at_enrollment_label(carriers$age_at_enrollment[i]),
      ageSource = age_source_label(carriers$age_at_enrollment[i], carriers$age_source[i]),
      sex = sex_value(carriers$gender[i]),
      group = fmt(carriers$cohort_id[i]),
      proband = ifelse(isTRUE(carriers$proband_flag[i]), "Proband", "non-Proband"),
      affected = ifelse(isTRUE(carriers$affected_flag[i]), "Yes", "No"),
      diagnosed = diagnosed_label(carriers$diagnosed_flag[i])
    )
  })
}

make_variant_state <- function(query_variant_id, query_gene_symbol) {
  if (is.na(query_variant_id) || query_variant_id == "-") {
    query_variant_id <- sample_variant[gene_symbol == query_gene_symbol][1, variant_id]
  }
  vrow <- sample_variant[variant_id == query_variant_id][1]
  if (nrow(vrow) == 0) vrow <- sample_variant[gene_symbol == query_gene_symbol][1]
  gene_symbol <- fmt(vrow$gene_symbol, query_gene_symbol)
  variant_id <- fmt(vrow$variant_id, query_variant_id)
  exact_carriers <- variant_carrier[variant_id == query_variant_id & gene_symbol == gene_symbol]
  gene_carriers <- gene_carrier[gene_symbol == gene_symbol]
  exact_count <- uniqueN(exact_carriers$sample_id)
  gene_count <- uniqueN(gene_carriers$sample_id)
  exact_carrier_ids <- unique(exact_carriers$sample_id)
  gene_carrier_ids <- unique(gene_carriers$sample_id)
  disease_rows <- sample_gene_summary[gene_symbol == gene_symbol & has_core_rare_disease_reference == TRUE][1:min(.N, 2)]
  disease_labels <- unique(clean_label(unlist(strsplit(paste(fmt(disease_rows$orpha_disease_ids, ""), collapse = ";"), ";", fixed = TRUE))))
  disease_labels <- disease_labels[disease_labels != "-"]
  if (length(disease_labels) == 0) disease_labels <- paste(gene_symbol, "reference annotation")

  variant <- list(
    query = list(
      label = variant_id,
      pathogenicity = fmt(vrow$clinvar_clnsig, "Pathogenicity not available"),
      focusLeft = "50%",
      focusBandWidth = "0.35rem",
      window = paste(gene_symbol, "Variant"),
      build = "test DB"
    ),
    diseaseSignals = lapply(disease_labels[1:min(length(disease_labels), 2)], function(x) list(label = x, scope = paste(gene_symbol, "gene-level reference support"))),
    relatedDiseases = lapply(disease_labels[1:min(length(disease_labels), 2)], function(x) list(name = x, domain = "rare disease reference", signal = paste(gene_symbol, "linked"))),
    geneContext = list(
      list(label = "Nearest gene", value = gene_symbol),
      list(label = paste(gene_symbol, "variant carriers"), value = paste(gene_count, "samples")),
      list(label = "Exact queried variant carriers", value = paste(exact_count, "samples"))
    ),
    variantEvidence = list(
      list(label = "Search Variant", value = variant_id),
      list(label = "Queried variant carriers", value = paste(exact_count, "samples")),
      list(label = "ClinVar", value = fmt(vrow$clinvar_clnsig)),
      list(label = "gnomAD AF", value = fmt_num(vrow$gnomad_exome_af, 5)),
      list(label = "REVEL", value = fmt_num(vrow$revel_score, 3)),
      list(label = "AlphaMissense", value = fmt_num(vrow$alphamissense_score, 3)),
      list(label = "LoFTEE", value = fmt(vrow$lof_class))
    ),
    summaryScopes = list(
      variant = list(
        all = exact_count,
        proband = sum(sample[sample_id %in% exact_carrier_ids, proband_flag] == TRUE, na.rm = TRUE),
        probandPercent = round(100 * sum(sample[sample_id %in% exact_carrier_ids, proband_flag] == TRUE, na.rm = TRUE) / max(1, exact_count)),
        female = sum(sample[sample_id %in% exact_carrier_ids, gender] == "female", na.rm = TRUE),
        male = sum(sample[sample_id %in% exact_carrier_ids, gender] == "male", na.rm = TRUE)
      ),
      gene = list(
        all = gene_count,
        proband = sum(sample[sample_id %in% gene_carrier_ids, proband_flag] == TRUE, na.rm = TRUE),
        probandPercent = round(100 * sum(sample[sample_id %in% gene_carrier_ids, proband_flag] == TRUE, na.rm = TRUE) / max(1, gene_count)),
        female = sum(sample[sample_id %in% gene_carrier_ids, gender] == "female", na.rm = TRUE),
        male = sum(sample[sample_id %in% gene_carrier_ids, gender] == "male", na.rm = TRUE)
      )
    ),
    carrierSamples = make_carrier_samples(exact_carriers[1:min(.N, 18)]),
    geneCarrierSamples = make_carrier_samples(gene_carriers[1:min(.N, 18)]),
    carrierPhenotypesByCategory = make_carrier_domains(exact_carrier_ids, exact_count),
    geneCarrierPhenotypesByCategory = make_carrier_domains(gene_carrier_ids, gene_count),
    residualGroups = list(
      list(name = "All CRDC", low = "15%", width = "40%", median = "38%", selected = "70%", extreme = paste(exact_count, "exact variant carriers")),
      list(name = fmt(exact_carriers$cohort_id[1], "Top cohort"), low = "20%", width = "35%", median = "46%", selected = "78%", extreme = paste(uniqueN(exact_carriers$sample_id), "carrier samples"))
    ),
    geneResidualGroups = list(
      list(name = "All CRDC", low = "15%", width = "40%", median = "38%", selected = "70%", extreme = paste(gene_count, "same-gene carriers")),
      list(name = fmt(gene_carriers$cohort_id[1], "Top cohort"), low = "20%", width = "35%", median = "46%", selected = "78%", extreme = paste(uniqueN(gene_carriers$sample_id), "gene carriers"))
    )
  )
  list(variant = variant)
}

variant_state <- make_variant_state(top_variant_query, top_gene_query)

make_phenotype_state <- function(query_ids) {
  query_ids <- setdiff(unique(query_ids[!is.na(query_ids) & query_ids != ""]), broad_hpo_ids)
  if (length(query_ids) == 0) query_ids <- setdiff(sample_hpo[sample_id == query_sample, unique(hpo_id)], broad_hpo_ids)[1:2]
  query_terms <- data.table(hpo_id = query_ids)

  make_sample_phenotype_profile <- function(sid) {
    ids <- setdiff(sample_hpo[sample_id == sid, unique(hpo_id)], c("HP:0000001", "HP:0000118"))
    if (!length(ids)) return(list())
    root_map <- term_root_table(ids)
    labels <- data.table(hpo_id = ids)
    labels <- merge(labels, hpo_term[, .(hpo_id, hpo_name)], by = "hpo_id", all.x = TRUE)
    labels <- merge(labels, root_map, by = "hpo_id", all.x = TRUE)
    labels <- labels[root_hpo_id == "OTHER" | hpo_id != root_hpo_id]
    if (!nrow(labels)) return(list())
    labels[, label := paste0(ifelse(is.na(hpo_name), hpo_id, hpo_name), " [", hpo_id, "]")]
    labels[, is_query := hpo_id %in% query_ids]
    total <- uniqueN(labels$hpo_id)
    grouped <- labels[, .(
      n = uniqueN(hpo_id),
      query_labels = paste(label[is_query], collapse = " · "),
      term_labels = list(label[order(!is_query, hpo_name)])
    ), by = .(root_name, root_hpo_id)][order(-n, root_name)]
    lapply(seq_len(nrow(grouped)), function(i) {
      list(
        category = paste0(grouped$root_name[i], ifelse(grouped$root_hpo_id[i] == "OTHER", "", paste0(" [", grouped$root_hpo_id[i], "]"))),
        terms = paste0(grouped$n[i], " / ", total, " terms"),
        queryPhenotype = ifelse(grouped$query_labels[i] == "", "—", grouped$query_labels[i]),
        phenotypeTerms = as.list(grouped$term_labels[[i]])
      )
    })
  }

  make_matched_age_bins <- function(ids) {
    rows <- sample[sample_id %in% ids]
    rows[, age_group := fifelse(!is.na(age_at_enrollment) & age_at_enrollment <= 4, "0-4",
                         fifelse(!is.na(age_at_enrollment) & age_at_enrollment <= 9, "5-9",
                         fifelse(!is.na(age_at_enrollment) & age_at_enrollment <= 17, "10-17",
                         fifelse(!is.na(age_at_enrollment), "18+", "Unknown"))))]
    bins <- data.table(label = c("0-4", "5-9", "10-17", "18+", "Unknown"))
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

  make_matched_cohort_summary <- function(ids) {
    rows <- sample[sample_id %in% ids]
    female <- sum(tolower(fmt(rows$gender, "")) == "female", na.rm = TRUE)
    male <- sum(tolower(fmt(rows$gender, "")) == "male", na.rm = TRUE)
    known_sex <- female + male
    proband <- sum(rows$proband_flag == TRUE, na.rm = TRUE)
    non_proband <- sum(rows$proband_flag == FALSE, na.rm = TRUE)
    known_proband <- proband + non_proband
    total <- length(unique(ids))
    sex_parts <- c()
    if (female > 0) sex_parts <- c(sex_parts, paste(female, "female"))
    if (male > 0) sex_parts <- c(sex_parts, paste(male, "male"))
    if (total > known_sex) sex_parts <- c(sex_parts, paste(total - known_sex, "sex not available"))
    proband_parts <- c()
    if (proband > 0) proband_parts <- c(proband_parts, paste(proband, "proband"))
    if (non_proband > 0) proband_parts <- c(proband_parts, paste(non_proband, "non-proband"))
    if (total > known_proband) proband_parts <- c(proband_parts, paste(total - known_proband, "proband status not available"))
    list(
      sex = paste("Sex:", paste(sex_parts, collapse = " · ")),
      proband = paste("Proband status:", paste(proband_parts, collapse = " · "))
    )
  }

  make_gene_hpo_terms <- function(g_symbol) {
    gene_terms <- unique(hpo_gene_annotation[gene_symbol == g_symbol, .(hpo_id, hpo_name, source_disease_id, evidence_source)])
    if (!nrow(gene_terms)) return(list())
    query_ancestors <- unique(hpo_ancestor[hpo_id %in% query_ids, ancestor_hpo_id])
    gene_terms[, exact_match := hpo_id %in% query_ids]
    gene_terms[, related_match := !exact_match & (
      hpo_id %in% query_ancestors |
        hpo_id %in% hpo_ancestor[ancestor_hpo_id %in% query_ids, unique(hpo_id)]
    )]
    gene_terms[, match_rank := fifelse(exact_match, 1L, fifelse(related_match, 2L, 3L))]
    gene_terms <- gene_terms[order(match_rank, hpo_name, hpo_id)]
    lapply(seq_len(nrow(gene_terms)), function(i) {
      list(
        hpoId = gene_terms$hpo_id[i],
        hpoTerm = fmt(gene_terms$hpo_name[i], gene_terms$hpo_id[i]),
        matched = isTRUE(gene_terms$exact_match[i]),
        related = isTRUE(gene_terms$related_match[i]),
        evidenceRole = if (isTRUE(gene_terms$exact_match[i])) {
          "Exact query HPO term"
        } else if (isTRUE(gene_terms$related_match[i])) {
          "Related via HPO hierarchy"
        } else {
          "Gene phenotype annotation"
        },
        source = fmt(gene_terms$evidence_source[i], "HPO gene annotation"),
        sourceDisease = fmt(gene_terms$source_disease_id[i], "-")
      )
    })
  }
  matched <- sample_hpo[hpo_id %in% query_ids, .(
    matched_query_terms = uniqueN(hpo_id),
    matched_hpo_ids = paste(sort(unique(hpo_id)), collapse = ";")
  ), by = sample_id]
  matched <- merge(matched, sample_hpo_counts, by = "sample_id", all.x = TRUE)
  matched <- merge(matched, sample_page[, .(sample_id, gender, age_band, cohort_id, diagnosed_flag)], by = "sample_id", all.x = TRUE)
  matched <- merge(matched, sample[, .(sample_id, age_at_enrollment, age_source)], by = "sample_id", all.x = TRUE)
  matched[, score := matched_query_terms / length(query_ids)]
  matched <- matched[order(-matched_query_terms, hpo_count)][1:min(.N, 20)]
  matched_ids <- matched$sample_id

  gene_hits <- sample_variant[sample_id %in% matched_ids, .(carrier_n = uniqueN(sample_id), variant_n = uniqueN(variant_id)), by = gene_symbol][order(-carrier_n)][1:min(.N, 6)]
  co_obs <- sample_hpo[
    sample_id %in% matched_ids & !hpo_id %in% c(query_ids, broad_hpo_ids),
    .(support = uniqueN(sample_id)),
    by = hpo_id
  ][order(-support)][1:min(.N, 8)]
  disease_hits <- disease_match[sample_id %in% matched_ids, .(support = uniqueN(sample_id), mean_score = mean(weighted_match_score, na.rm = TRUE), matched_hpo = max(matched_hpo_count, na.rm = TRUE), total_hpo = max(disease_hpo_count, na.rm = TRUE)), by = .(disease_id, disease_name, disease_source)][order(-support, -mean_score)][1:min(.N, 5)]

  top_samples <- lapply(seq_len(min(nrow(matched), 6)), function(i) {
    sid <- matched$sample_id[i]
    sig <- sample_gene_summary[sample_id == sid][order(-gene_carrier_count, -shared_hpo_count)][1:min(.N, 2), gene_symbol]
    list(
      rank = i,
      id = sid,
      group = paste(ifelse(isTRUE(sample[sample_id == sid, proband_flag][1]), "proband", "non-proband"), matched$cohort_id[i]),
      investigator = fmt(matched$cohort_id[i]),
      proband = ifelse(isTRUE(sample[sample_id == sid, proband_flag][1]), "Yes", "No"),
      affected = ifelse(isTRUE(sample[sample_id == sid, affected_flag][1]), "Yes", "No"),
      sex = fmt(matched$gender[i]),
      ageBand = fmt(matched$age_band[i]),
      ageAtEnrollment = age_at_enrollment_value(matched$age_at_enrollment[i]),
      ageAtEnrollmentLabel = age_at_enrollment_label(matched$age_at_enrollment[i]),
      ageSource = age_source_label(matched$age_at_enrollment[i], matched$age_source[i]),
      sexAge = paste(fmt(matched$gender[i]), fmt(matched$age_band[i]), sep = " · "),
      diagnosed = diagnosed_label(matched$diagnosed_flag[i]),
      diagnosedVariant = "",
      queryTermsMatched = paste0(matched$matched_query_terms[i], " / ", length(query_ids), " query terms"),
      scoringTermsMatched = "not calculated in frontend fixture",
      totalTerms = as.integer(matched$hpo_count[i]),
      rawScore = fmt_num(matched$score[i], 2),
      expectedScore = "not calculated",
      residual = "not calculated",
      percentile = "not calculated",
      equalOrHigher = paste0(i, " / ", nrow(matched)),
      signals = paste(sig, collapse = ", "),
      phenotypeProfile = make_sample_phenotype_profile(sid)
    )
  })

  co_observed <- lapply(seq_len(nrow(co_obs)), function(i) {
    genes <- gene_hits$gene_symbol[1:min(nrow(gene_hits), 3)]
    list(
      label = hpo_label(co_obs$hpo_id[i])[1],
      domain = "co-observed in matched CRDC samples",
      cluster = "test DB co-observed HPO term",
      count = paste0(co_obs$support[i], " / ", length(matched_ids)),
      score = "frequency in matched set",
      width = paste0(round(100 * co_obs$support[i] / max(1, length(matched_ids))), "%"),
      relatedGenes = list_or_empty(genes),
      samples = list_or_empty(head(matched_ids, 2)),
      orpha = list_or_empty(clean_label(head(disease_hits$disease_name, 2)))
    )
  })

  disease_candidates <- lapply(seq_len(nrow(disease_hits)), function(i) {
    genes <- gene_hits$gene_symbol[1:min(nrow(gene_hits), 3)]
    list(
      disease = clean_label(disease_hits$disease_name[i]),
      diseaseId = fmt(disease_hits$disease_id[i], ""),
      source = fmt(disease_hits$disease_source[i], "Reference profile"),
      profileMatch = paste0(fmt_num(disease_hits$mean_score[i], 2), " profile score · ", disease_hits$matched_hpo[i], " / ", disease_hits$total_hpo[i], " disease HPO terms"),
      externalAnnotation = paste(clean_label(disease_hits$disease_name[i]), fmt(disease_hits$disease_source[i]), sep = " · "),
      crdcEvidence = paste(disease_hits$support[i], "/", length(matched_ids), "phenotype-matched samples"),
      whyMatched = "input HPO profile overlaps external disease-HPO profile",
      linkedGenes = list_or_empty(genes)
    )
  })

  gene_candidates <- lapply(seq_len(nrow(gene_hits)), function(i) {
    gene_terms <- make_gene_hpo_terms(gene_hits$gene_symbol[i])
    exact_n <- sum(vapply(gene_terms, function(x) isTRUE(x$matched), logical(1)))
    related_n <- sum(vapply(gene_terms, function(x) isTRUE(x$related), logical(1)))
    list(
      gene = gene_hits$gene_symbol[i],
      profileMatch = paste0(exact_n, " / ", length(query_ids), " exact query HPO terms", ifelse(related_n > 0, paste0(" · ", related_n, " related HPO terms"), "")),
      externalAnnotation = "external annotation shown when available",
      cohortCarrierEvidence = paste0(gene_hits$carrier_n[i], " / ", length(matched_ids), " phenotype-matched samples carry rare ", gene_hits$gene_symbol[i], " variants"),
      whyMatched = "CRDC recurrence among phenotype-matched samples",
      hpoTerms = gene_terms
    )
  })

  candidate_variants <- list()
  if (nrow(gene_hits) > 0) {
    cv <- sample_variant[sample_id %in% matched_ids & gene_symbol %in% gene_hits$gene_symbol][1:min(.N, 5)]
    candidate_variants <- lapply(seq_len(nrow(cv)), function(i) {
      list(
        gene = cv$gene_symbol[i],
        id = cv$variant_id[i],
        carriers = paste0(uniqueN(sample_variant[variant_id == cv$variant_id[i], sample_id]), " / ", length(matched_ids), " matched samples"),
        coherence = "carrier phenotype fit not recalculated in fixture",
        pathogenicity = fmt(cv$clinvar_clnsig[i]),
        link = paste0("/krVariant.html?query=", URLencode(cv$variant_id[i], reserved = TRUE))
      )
    })
  }

  list(
    activeOutlierSample = ifelse(length(top_samples) > 0, top_samples[[1]]$id, query_sample),
    phenotype = list(
      query = list(
        display = paste(hpo_label(query_ids), collapse = " + "),
        subtext = paste(length(query_ids), "test DB HPO query terms; runtime PheRS/GRS is not implemented in frontend")
      ),
      headline = list(
        list(label = "Phenotype-similar samples", value = paste0(length(matched_ids), " / ", uniqueN(sample$sample_id)), detail = "HPO overlap search in test DB"),
        list(label = "Annotation-burden check", value = "Not calculated in fixture", detail = "Would require backend/runtime residual scoring"),
        list(label = "Dominant phenotype structure", value = paste(head(hpo_name_only(query_ids), 2), collapse = " + "), detail = "query HPO terms")
      ),
      queryTerms = list(
        exact = lapply(query_ids, function(id) list(label = hpo_name_only(id)[1], id = id, reason = "Selected test DB query term")),
        expanded = list(),
        downWeighted = list()
      ),
      matchedCohortSummary = make_matched_cohort_summary(matched_ids),
      ageBins = make_matched_age_bins(matched_ids),
      topSamples = top_samples,
      coObserved = co_observed,
      diseaseCandidates = disease_candidates,
      geneCandidates = gene_candidates,
      candidateEvidenceSummary = lapply(gene_hits$gene_symbol[1:min(nrow(gene_hits), 3)], function(g) list(gene = g, sources = list("CRDC"))),
      candidateVariants = candidate_variants
    )
  )
}

phenotype_state <- make_phenotype_state(phenotype_query_ids)

write_generated <- function(path, const_name, apply_name, payload, target_key = NULL) {
  json <- toJSON(payload, auto_unbox = TRUE, pretty = TRUE, null = "null", na = "null")
  if (is.null(target_key)) {
    body <- paste0(
      "export function ", apply_name, "(state) {\n",
      "    return {\n",
      "        ...state,\n",
      "        ...", const_name, ",\n",
      "    };\n",
      "}\n"
    )
  } else {
    body <- paste0(
      "export function ", apply_name, "(state) {\n",
      "    return {\n",
      "        ...state,\n",
      "        ...", const_name, ",\n",
      "        ", target_key, ": {\n",
      "            ...state.", target_key, ",\n",
      "            ...", const_name, ".", target_key, ",\n",
      "        },\n",
      "    };\n",
      "}\n"
    )
  }
  js <- paste0("const ", const_name, " = ", json, ";\n\n", body)
  writeLines(js, path, useBytes = TRUE)
  cat("Wrote:", path, "\n")
}

disease_reference_index <- make_disease_reference_index(max_hpo_terms = 8)
write_disease_reference_generated <- function(path, payload) {
  json <- toJSON(payload, auto_unbox = TRUE, pretty = FALSE, null = "null", na = "null")
  js <- paste0(
    "export const portalDiseaseReferenceIndex = ", json, ";\n\n",
    "function normalizeDiseaseQuery(value) {\n",
    "    return String(value || \"\").toLowerCase().replace(/[\\s_]+/g, \" \").trim();\n",
    "}\n\n",
    "export function findPortalDiseaseReference(query, source = \"\") {\n",
    "    const normalized = normalizeDiseaseQuery(query);\n",
    "    const normalizedSource = String(source || \"\").toLowerCase();\n",
    "    if (!normalized) return null;\n",
    "    return portalDiseaseReferenceIndex.find((item) => {\n",
    "        if (normalizedSource && item.source !== normalizedSource) return false;\n",
    "        const candidates = [item.sourceId, item.rawId, item.name, item.label].map(normalizeDiseaseQuery);\n",
    "        return candidates.some((candidate) => candidate === normalized || candidate.includes(normalized));\n",
    "    }) || null;\n",
    "}\n\n",
    "export function portalDiseaseReferenceSuggestions(source = \"\", limit = 200, query = \"\") {\n",
    "    const normalizedSource = String(source || \"\").toLowerCase();\n",
    "    const normalizedQuery = normalizeDiseaseQuery(query);\n",
    "    return portalDiseaseReferenceIndex\n",
    "        .filter((item) => !normalizedSource || item.source === normalizedSource)\n",
    "        .filter((item) => {\n",
    "            if (!normalizedQuery) return true;\n",
    "            const candidates = [item.sourceId, item.rawId, item.name, item.label].map(normalizeDiseaseQuery);\n",
    "            return candidates.some((candidate) => candidate.includes(normalizedQuery));\n",
    "        })\n",
    "        .slice(0, limit);\n",
    "}\n"
  )
  writeLines(js, path, useBytes = TRUE)
  cat("Wrote:", path, "\n")
}

write_generated(out_sample_js, "portalSampleState", "applyPortalSampleData", sample_state, "sample")
write_generated(out_variant_js, "portalVariantState", "applyPortalVariantData", variant_state, "variant")
write_generated(out_phenotype_js, "portalPhenotypeState", "applyPortalPhenotypeData", phenotype_state, "phenotype")
write_disease_reference_generated(out_focus_js, disease_reference_index)

cat("Query sample:", query_sample, "\n")
cat("Variant query:", top_variant_query, "\n")
cat("Gene query:", top_gene_query, "\n")
