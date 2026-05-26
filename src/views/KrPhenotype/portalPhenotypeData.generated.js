const portalPhenotypeState = {
  "activeOutlierSample": "BCH-22-44945-01",
  "phenotype": {
    "query": {
      "display": "Abnormal circulating purine concentration [HP:0004352] + Abnormal oral morphology [HP:0031816]",
      "subtext": "2 test DB HPO query terms; runtime PheRS/GRS is not implemented in frontend"
    },
    "headline": [
      {
        "label": "Phenotype-similar samples",
        "value": "20 / 350",
        "detail": "HPO overlap search in test DB"
      },
      {
        "label": "Annotation-burden check",
        "value": "Not calculated in fixture",
        "detail": "Would require backend/runtime residual scoring"
      },
      {
        "label": "Dominant phenotype structure",
        "value": "Abnormal circulating purine concentration + Abnormal oral morphology",
        "detail": "query HPO terms"
      }
    ],
    "queryTerms": {
      "exact": [
        {
          "label": "Abnormal circulating purine concentration",
          "id": "HP:0004352",
          "reason": "Selected test DB query term"
        },
        {
          "label": "Abnormal oral morphology",
          "id": "HP:0031816",
          "reason": "Selected test DB query term"
        }
      ],
      "expanded": [],
      "downWeighted": []
    },
    "topSamples": [
      {
        "rank": 1,
        "id": "BCH-22-44945-01",
        "group": "proband janet_chou",
        "investigator": "janet_chou",
        "proband": "Yes",
        "affected": "Yes",
        "sex": "male",
        "ageBand": "12-17",
        "sexAge": "male · 12-17",
        "diagnosed": "N/A",
        "diagnosedVariant": "",
        "queryTermsMatched": "2 / 2 query terms",
        "scoringTermsMatched": "not calculated in frontend fixture",
        "totalTerms": 107,
        "rawScore": "1",
        "expectedScore": "not calculated",
        "residual": "not calculated",
        "percentile": "not calculated",
        "equalOrHigher": "1 / 20",
        "signals": "ARMC9, LUZP1",
        "phenotypeProfile": []
      },
      {
        "rank": 2,
        "id": "BCH-18-10273-01",
        "group": "proband annapurna_poduri",
        "investigator": "annapurna_poduri",
        "proband": "Yes",
        "affected": "Yes",
        "sex": "female",
        "ageBand": "6-11",
        "sexAge": "female · 6-11",
        "diagnosed": "N/A",
        "diagnosedVariant": "",
        "queryTermsMatched": "2 / 2 query terms",
        "scoringTermsMatched": "not calculated in frontend fixture",
        "totalTerms": 208,
        "rawScore": "1",
        "expectedScore": "not calculated",
        "residual": "not calculated",
        "percentile": "not calculated",
        "equalOrHigher": "2 / 20",
        "signals": "ARMC9, HLA-C",
        "phenotypeProfile": []
      },
      {
        "rank": 3,
        "id": "BCH-21-99889-01",
        "group": "proband clinical_sequencing",
        "investigator": "clinical_sequencing",
        "proband": "Yes",
        "affected": "Yes",
        "sex": "male",
        "ageBand": "1-5",
        "sexAge": "male · 1-5",
        "diagnosed": "Yes",
        "diagnosedVariant": "",
        "queryTermsMatched": "2 / 2 query terms",
        "scoringTermsMatched": "not calculated in frontend fixture",
        "totalTerms": 257,
        "rawScore": "1",
        "expectedScore": "not calculated",
        "residual": "not calculated",
        "percentile": "not calculated",
        "equalOrHigher": "3 / 20",
        "signals": "ARMC9, LUZP1",
        "phenotypeProfile": []
      },
      {
        "rank": 4,
        "id": "BCH-22-42156-01",
        "group": "proband clinical_sequencing",
        "investigator": "clinical_sequencing",
        "proband": "Yes",
        "affected": "Yes",
        "sex": "male",
        "ageBand": "1-5",
        "sexAge": "male · 1-5",
        "diagnosed": "N/A",
        "diagnosedVariant": "",
        "queryTermsMatched": "1 / 2 query terms",
        "scoringTermsMatched": "not calculated in frontend fixture",
        "totalTerms": 48,
        "rawScore": "0.5",
        "expectedScore": "not calculated",
        "residual": "not calculated",
        "percentile": "not calculated",
        "equalOrHigher": "4 / 20",
        "signals": "HLA-B, HLA-DRB5",
        "phenotypeProfile": []
      },
      {
        "rank": 5,
        "id": "AU1605a",
        "group": "non-proband chris_walsh",
        "investigator": "chris_walsh",
        "proband": "No",
        "affected": "Yes",
        "sex": "male",
        "ageBand": "-",
        "sexAge": "male · -",
        "diagnosed": "N/A",
        "diagnosedVariant": "",
        "queryTermsMatched": "1 / 2 query terms",
        "scoringTermsMatched": "not calculated in frontend fixture",
        "totalTerms": 51,
        "rawScore": "0.5",
        "expectedScore": "not calculated",
        "residual": "not calculated",
        "percentile": "not calculated",
        "equalOrHigher": "5 / 20",
        "signals": "ARMC9, LUZP1",
        "phenotypeProfile": []
      },
      {
        "rank": 6,
        "id": "BCH-21-21266-03",
        "group": "non-proband clinical_sequencing",
        "investigator": "clinical_sequencing",
        "proband": "No",
        "affected": "Yes",
        "sex": "male",
        "ageBand": "18+",
        "sexAge": "male · 18+",
        "diagnosed": "Yes",
        "diagnosedVariant": "",
        "queryTermsMatched": "1 / 2 query terms",
        "scoringTermsMatched": "not calculated in frontend fixture",
        "totalTerms": 70,
        "rawScore": "0.5",
        "expectedScore": "not calculated",
        "residual": "not calculated",
        "percentile": "not calculated",
        "equalOrHigher": "6 / 20",
        "signals": "ARMC9, LUZP1",
        "phenotypeProfile": []
      }
    ],
    "coObserved": [
      {
        "label": "Abnormality of head or neck [HP:0000152]",
        "domain": "co-observed in matched CRDC samples",
        "cluster": "test DB co-observed HPO term",
        "count": "20 / 20",
        "score": "frequency in matched set",
        "width": "100%",
        "relatedGenes": [
          "ARMC9",
          "LUZP1",
          "HLA-C"
        ],
        "samples": [
          "BCH-22-44945-01",
          "BCH-18-10273-01"
        ],
        "orpha": [
          "SLC35A2-CDG",
          "Williams syndrome"
        ]
      },
      {
        "label": "All [HP:0000001]",
        "domain": "co-observed in matched CRDC samples",
        "cluster": "test DB co-observed HPO term",
        "count": "20 / 20",
        "score": "frequency in matched set",
        "width": "100%",
        "relatedGenes": [
          "ARMC9",
          "LUZP1",
          "HLA-C"
        ],
        "samples": [
          "BCH-22-44945-01",
          "BCH-18-10273-01"
        ],
        "orpha": [
          "SLC35A2-CDG",
          "Williams syndrome"
        ]
      },
      {
        "label": "Phenotypic abnormality [HP:0000118]",
        "domain": "co-observed in matched CRDC samples",
        "cluster": "test DB co-observed HPO term",
        "count": "20 / 20",
        "score": "frequency in matched set",
        "width": "100%",
        "relatedGenes": [
          "ARMC9",
          "LUZP1",
          "HLA-C"
        ],
        "samples": [
          "BCH-22-44945-01",
          "BCH-18-10273-01"
        ],
        "orpha": [
          "SLC35A2-CDG",
          "Williams syndrome"
        ]
      },
      {
        "label": "Abnormality of the head [HP:0000234]",
        "domain": "co-observed in matched CRDC samples",
        "cluster": "test DB co-observed HPO term",
        "count": "19 / 20",
        "score": "frequency in matched set",
        "width": "95%",
        "relatedGenes": [
          "ARMC9",
          "LUZP1",
          "HLA-C"
        ],
        "samples": [
          "BCH-22-44945-01",
          "BCH-18-10273-01"
        ],
        "orpha": [
          "SLC35A2-CDG",
          "Williams syndrome"
        ]
      },
      {
        "label": "Abnormality of the nervous system [HP:0000707]",
        "domain": "co-observed in matched CRDC samples",
        "cluster": "test DB co-observed HPO term",
        "count": "18 / 20",
        "score": "frequency in matched set",
        "width": "90%",
        "relatedGenes": [
          "ARMC9",
          "LUZP1",
          "HLA-C"
        ],
        "samples": [
          "BCH-22-44945-01",
          "BCH-18-10273-01"
        ],
        "orpha": [
          "SLC35A2-CDG",
          "Williams syndrome"
        ]
      },
      {
        "label": "Abnormality of the digestive system [HP:0025031]",
        "domain": "co-observed in matched CRDC samples",
        "cluster": "test DB co-observed HPO term",
        "count": "17 / 20",
        "score": "frequency in matched set",
        "width": "85%",
        "relatedGenes": [
          "ARMC9",
          "LUZP1",
          "HLA-C"
        ],
        "samples": [
          "BCH-22-44945-01",
          "BCH-18-10273-01"
        ],
        "orpha": [
          "SLC35A2-CDG",
          "Williams syndrome"
        ]
      },
      {
        "label": "Abnormal nervous system physiology [HP:0012638]",
        "domain": "co-observed in matched CRDC samples",
        "cluster": "test DB co-observed HPO term",
        "count": "17 / 20",
        "score": "frequency in matched set",
        "width": "85%",
        "relatedGenes": [
          "ARMC9",
          "LUZP1",
          "HLA-C"
        ],
        "samples": [
          "BCH-22-44945-01",
          "BCH-18-10273-01"
        ],
        "orpha": [
          "SLC35A2-CDG",
          "Williams syndrome"
        ]
      },
      {
        "label": "Abnormality of the face [HP:0000271]",
        "domain": "co-observed in matched CRDC samples",
        "cluster": "test DB co-observed HPO term",
        "count": "16 / 20",
        "score": "frequency in matched set",
        "width": "80%",
        "relatedGenes": [
          "ARMC9",
          "LUZP1",
          "HLA-C"
        ],
        "samples": [
          "BCH-22-44945-01",
          "BCH-18-10273-01"
        ],
        "orpha": [
          "SLC35A2-CDG",
          "Williams syndrome"
        ]
      }
    ],
    "diseaseCandidates": [
      {
        "disease": "SLC35A2-CDG",
        "profileMatch": "4.11 profile score · 11 / 74 disease HPO terms",
        "externalAnnotation": "SLC35A2-CDG · Orphapacket",
        "crdcEvidence": "19 / 20 phenotype-matched samples",
        "whyMatched": "input HPO profile overlaps external disease-HPO profile",
        "linkedGenes": [
          "ARMC9",
          "LUZP1",
          "HLA-C"
        ]
      },
      {
        "disease": "Williams syndrome",
        "profileMatch": "4.51 profile score · 13 / 187 disease HPO terms",
        "externalAnnotation": "Williams syndrome · Orphapacket",
        "crdcEvidence": "16 / 20 phenotype-matched samples",
        "whyMatched": "input HPO profile overlaps external disease-HPO profile",
        "linkedGenes": [
          "ARMC9",
          "LUZP1",
          "HLA-C"
        ]
      },
      {
        "disease": "ALG3-CDG",
        "profileMatch": "4.2 profile score · 13 / 45 disease HPO terms",
        "externalAnnotation": "ALG3-CDG · Orphapacket",
        "crdcEvidence": "16 / 20 phenotype-matched samples",
        "whyMatched": "input HPO profile overlaps external disease-HPO profile",
        "linkedGenes": [
          "ARMC9",
          "LUZP1",
          "HLA-C"
        ]
      },
      {
        "disease": "ALG8-CDG",
        "profileMatch": "3.27 profile score · 14 / 48 disease HPO terms",
        "externalAnnotation": "ALG8-CDG · Orphapacket",
        "crdcEvidence": "15 / 20 phenotype-matched samples",
        "whyMatched": "input HPO profile overlaps external disease-HPO profile",
        "linkedGenes": [
          "ARMC9",
          "LUZP1",
          "HLA-C"
        ]
      },
      {
        "disease": "Smith-Magenis syndrome",
        "profileMatch": "4.2 profile score · 13 / 95 disease HPO terms",
        "externalAnnotation": "Smith-Magenis syndrome · Orphapacket",
        "crdcEvidence": "14 / 20 phenotype-matched samples",
        "whyMatched": "input HPO profile overlaps external disease-HPO profile",
        "linkedGenes": [
          "ARMC9",
          "LUZP1",
          "HLA-C"
        ]
      }
    ],
    "geneCandidates": [
      {
        "gene": "ARMC9",
        "profileMatch": "2 query HPO terms evaluated as a weighted profile",
        "externalAnnotation": "external annotation shown when available",
        "cohortCarrierEvidence": "18 / 20 phenotype-matched samples carry rare ARMC9 variants",
        "whyMatched": "CRDC recurrence among phenotype-matched samples"
      },
      {
        "gene": "LUZP1",
        "profileMatch": "2 query HPO terms evaluated as a weighted profile",
        "externalAnnotation": "external annotation shown when available",
        "cohortCarrierEvidence": "13 / 20 phenotype-matched samples carry rare LUZP1 variants",
        "whyMatched": "CRDC recurrence among phenotype-matched samples"
      },
      {
        "gene": "HLA-C",
        "profileMatch": "2 query HPO terms evaluated as a weighted profile",
        "externalAnnotation": "external annotation shown when available",
        "cohortCarrierEvidence": "13 / 20 phenotype-matched samples carry rare HLA-C variants",
        "whyMatched": "CRDC recurrence among phenotype-matched samples"
      },
      {
        "gene": "OR2T33",
        "profileMatch": "2 query HPO terms evaluated as a weighted profile",
        "externalAnnotation": "external annotation shown when available",
        "cohortCarrierEvidence": "12 / 20 phenotype-matched samples carry rare OR2T33 variants",
        "whyMatched": "CRDC recurrence among phenotype-matched samples"
      },
      {
        "gene": "HLA-B",
        "profileMatch": "2 query HPO terms evaluated as a weighted profile",
        "externalAnnotation": "external annotation shown when available",
        "cohortCarrierEvidence": "11 / 20 phenotype-matched samples carry rare HLA-B variants",
        "whyMatched": "CRDC recurrence among phenotype-matched samples"
      },
      {
        "gene": "HLA-DRB5",
        "profileMatch": "2 query HPO terms evaluated as a weighted profile",
        "externalAnnotation": "external annotation shown when available",
        "cohortCarrierEvidence": "10 / 20 phenotype-matched samples carry rare HLA-DRB5 variants",
        "whyMatched": "CRDC recurrence among phenotype-matched samples"
      }
    ],
    "candidateEvidenceSummary": [
      {
        "gene": "ARMC9",
        "sources": [
          "CRDC"
        ]
      },
      {
        "gene": "LUZP1",
        "sources": [
          "CRDC"
        ]
      },
      {
        "gene": "HLA-C",
        "sources": [
          "CRDC"
        ]
      }
    ],
    "candidateVariants": [
      {
        "gene": "ARMC9",
        "id": "chr2:231222761:AT:A",
        "carriers": "259 / 20 matched samples",
        "coherence": "carrier phenotype fit not recalculated in fixture",
        "pathogenicity": "-",
        "link": "/krVariant.html?query=chr2%3A231222761%3AAT%3AA"
      },
      {
        "gene": "ARMC9",
        "id": "chr2:231222762:TAA:T",
        "carriers": "265 / 20 matched samples",
        "coherence": "carrier phenotype fit not recalculated in fixture",
        "pathogenicity": "-",
        "link": "/krVariant.html?query=chr2%3A231222762%3ATAA%3AT"
      },
      {
        "gene": "LUZP1",
        "id": "chr1:23092881:G:A",
        "carriers": "201 / 20 matched samples",
        "coherence": "carrier phenotype fit not recalculated in fixture",
        "pathogenicity": "-",
        "link": "/krVariant.html?query=chr1%3A23092881%3AG%3AA"
      },
      {
        "gene": "HLA-C",
        "id": "chr6:31269997:G:GATCC",
        "carriers": "145 / 20 matched samples",
        "coherence": "carrier phenotype fit not recalculated in fixture",
        "pathogenicity": "-",
        "link": "/krVariant.html?query=chr6%3A31269997%3AG%3AGATCC"
      },
      {
        "gene": "HLA-C",
        "id": "chr6:31269999:C:CAT",
        "carriers": "22 / 20 matched samples",
        "coherence": "carrier phenotype fit not recalculated in fixture",
        "pathogenicity": "-",
        "link": "/krVariant.html?query=chr6%3A31269999%3AC%3ACAT"
      }
    ]
  }
};

export function applyPortalPhenotypeData(state) {
    return {
        ...state,
        ...portalPhenotypeState,
        phenotype: {
            ...state.phenotype,
            ...portalPhenotypeState.phenotype,
        },
    };
}

