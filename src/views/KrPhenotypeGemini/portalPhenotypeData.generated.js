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
    "matchedCohortSummary": {
      "sex": "Sex: 10 female · 10 male",
      "proband": "Proband status: 14 proband · 6 non-proband"
    },
    "ageBins": [
      {
        "label": "0-4",
        "female": 1,
        "male": 2,
        "femaleHeight": "23px",
        "maleHeight": "47px"
      },
      {
        "label": "5-12",
        "female": 3,
        "male": 3,
        "femaleHeight": "70px",
        "maleHeight": "70px"
      },
      {
        "label": "13-18",
        "female": 2,
        "male": 0,
        "femaleHeight": "47px",
        "maleHeight": "0px"
      },
      {
        "label": "19-30",
        "female": 1,
        "male": 1,
        "femaleHeight": "23px",
        "maleHeight": "23px"
      },
      {
        "label": "30+",
        "female": 1,
        "male": 3,
        "femaleHeight": "23px",
        "maleHeight": "70px"
      },
      {
        "label": "Unknown",
        "female": 2,
        "male": 1,
        "femaleHeight": "47px",
        "maleHeight": "23px"
      }
    ],
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
        "phenotypeProfile": [
          {
            "category": "Abnormality of head or neck [HP:0000152]",
            "terms": "17 / 105 terms",
            "queryPhenotype": "Abnormal oral morphology [HP:0031816]",
            "phenotypeTerms": [
              "Abnormal oral morphology [HP:0031816]",
              "Abnormal facial expression [HP:0005346]",
              "Abnormal facial shape [HP:0001999]",
              "Abnormal lip morphology [HP:0000159]",
              "Abnormal oral cavity morphology [HP:0000163]",
              "Abnormal oral mucosa morphology [HP:0011830]",
              "Abnormality of head or neck [HP:0000152]",
              "Abnormality of the dentition [HP:0000164]",
              "Abnormality of the face [HP:0000271]",
              "Abnormality of the gingiva [HP:0000168]",
              "Abnormality of the head [HP:0000234]",
              "Abnormality of the mouth [HP:0000153]",
              "Abnormality of the orbital region [HP:0000315]",
              "Abnormality of the tongue [HP:0000157]",
              "Chapped lip [HP:0040181]",
              "Moon facies [HP:0500011]",
              "Oral ulcer [HP:0000155]"
            ]
          },
          {
            "category": "Abnormality of the immune system [HP:0002715]",
            "terms": "17 / 105 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal cellular immune system morphology [HP:0010987]",
              "Abnormal circulating immunoglobulin concentration [HP:0010701]",
              "Abnormal immune system morphology [HP:0032251]",
              "Abnormal inflammatory response [HP:0012647]",
              "Abnormal lymph node morphology [HP:0002733]",
              "Abnormality of humoral immunity [HP:0005368]",
              "Abnormality of immune system physiology [HP:0010978]",
              "Abnormality of the immune system [HP:0002715]",
              "Abnormality of the lymphatic system [HP:0100763]",
              "Allergy [HP:0012393]",
              "Autoimmunity [HP:0002960]",
              "Decreased circulating immunoglobulin concentration [HP:0004313]",
              "Immunodeficiency [HP:0002721]",
              "Increased inflammatory response [HP:0012649]",
              "Lymphadenopathy [HP:0002716]",
              "Periodontitis [HP:0000704]",
              "Stomatitis [HP:0010280]"
            ]
          },
          {
            "category": "Abnormality of the digestive system [HP:0025031]",
            "terms": "16 / 105 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abdominal symptom [HP:0011458]",
              "Abnormal abdomen morphology [HP:0001438]",
              "Abnormal abdominal wall morphology [HP:0004298]",
              "Abnormal intestine morphology [HP:0002242]",
              "Abnormal large intestine morphology [HP:0002250]",
              "Abnormal umbilicus morphology [HP:0001551]",
              "Abnormality of digestive system physiology [HP:0025032]",
              "Abnormality of the digestive system [HP:0025031]",
              "Abnormality of the gastrointestinal tract [HP:0011024]",
              "Constipation [HP:0002019]",
              "Feeding difficulties [HP:0011968]",
              "Feeding difficulties in infancy [HP:0008872]",
              "Nasogastric tube feeding [HP:0040288]",
              "Nasogastric tube feeding in infancy [HP:0011470]",
              "Neoplasm of the oral cavity [HP:0100649]",
              "Tube feeding [HP:0033454]"
            ]
          },
          {
            "category": "Abnormality of blood and blood-forming tissues [HP:0001871]",
            "terms": "11 / 105 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal granulocyte count [HP:0032309]",
              "Abnormal granulocyte morphology [HP:0001911]",
              "Abnormal leukocyte count [HP:0011893]",
              "Abnormal leukocyte morphology [HP:0001881]",
              "Abnormal myeloid leukocyte morphology [HP:0010974]",
              "Abnormal total neutrophil count [HP:0011991]",
              "Abnormality of blood and blood-forming tissues [HP:0001871]",
              "Abnormality of neutrophils [HP:0001874]",
              "Decreased total neutrophil count [HP:0001875]",
              "Hematological neoplasm [HP:0004377]",
              "Lymphoproliferative disorder [HP:0005523]"
            ]
          },
          {
            "category": "Abnormality of the integument [HP:0001574]",
            "terms": "11 / 105 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal blistering of the skin [HP:0008066]",
              "Abnormal skin morphology [HP:0011121]",
              "Abnormality of skin physiology [HP:0011122]",
              "Abnormality of the integument [HP:0001574]",
              "Abnormality of the skin [HP:0000951]",
              "Generalized abnormality of skin [HP:0011354]",
              "Inflammatory abnormality of the skin [HP:0011123]",
              "Localized skin lesion [HP:0011355]",
              "Pruritus [HP:0000989]",
              "Skin rash [HP:0000988]",
              "Skin vesicle [HP:0200037]"
            ]
          },
          {
            "category": "Abnormality of metabolism/homeostasis [HP:0001939]",
            "terms": "6 / 105 terms",
            "queryPhenotype": "Abnormal circulating purine concentration [HP:0004352]",
            "phenotypeTerms": [
              "Abnormal circulating purine concentration [HP:0004352]",
              "Abnormal B cell physiology [HP:0005372]",
              "Abnormal cellular physiology [HP:0011017]",
              "Abnormal lymphocyte physiology [HP:0031409]",
              "Abnormality of metabolism/homeostasis [HP:0001939]",
              "Fever [HP:0001945]"
            ]
          },
          {
            "category": "Abnormality of limbs [HP:0040064]",
            "terms": "5 / 105 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal limb bone morphology [HP:0002813]",
              "Abnormal palm morphology [HP:0100871]",
              "Abnormality of limbs [HP:0040064]",
              "Abnormality of the hand [HP:0001155]",
              "Abnormality of the upper limb [HP:0002817]"
            ]
          },
          {
            "category": "Abnormality of the cardiovascular system [HP:0001626]",
            "terms": "4 / 105 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormality of the cardiovascular system [HP:0001626]",
              "Abnormality of the vasculature [HP:0002597]",
              "Erythema [HP:0010783]",
              "Vascular skin abnormality [HP:0011276]"
            ]
          },
          {
            "category": "Abnormality of the genitourinary system [HP:0000119]",
            "terms": "4 / 105 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal male external genitalia morphology [HP:0000032]",
              "Abnormal penis morphology [HP:0000036]",
              "Abnormality of the genital system [HP:0000078]",
              "Abnormality of the genitourinary system [HP:0000119]"
            ]
          },
          {
            "category": "Growth abnormality [HP:0001507]",
            "terms": "4 / 105 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormality of body weight [HP:0004323]",
              "Decreased body weight [HP:0004325]",
              "Growth abnormality [HP:0001507]",
              "Weight loss [HP:0001824]"
            ]
          },
          {
            "category": "Abnormality of the musculoskeletal system [HP:0033127]",
            "terms": "2 / 105 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal thorax morphology [HP:0000765]",
              "Abnormality of connective tissue [HP:0003549]"
            ]
          },
          {
            "category": "Abnormality of the respiratory system [HP:0002086]",
            "terms": "2 / 105 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal lung morphology [HP:0002088]",
              "Abnormality of the respiratory system [HP:0002086]"
            ]
          },
          {
            "category": "Neoplasm [HP:0002664]",
            "terms": "2 / 105 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Neoplasm [HP:0002664]",
              "Neoplasm by anatomical site [HP:0011793]"
            ]
          },
          {
            "category": "Abnormal cellular phenotype [HP:0025354]",
            "terms": "1 / 105 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal cellular phenotype [HP:0025354]"
            ]
          },
          {
            "category": "Abnormality of the eye [HP:0000478]",
            "terms": "1 / 105 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormality of the eye [HP:0000478]"
            ]
          },
          {
            "category": "Abnormality of the nervous system [HP:0000707]",
            "terms": "1 / 105 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormality of the nervous system [HP:0000707]"
            ]
          },
          {
            "category": "Constitutional symptom [HP:0025142]",
            "terms": "1 / 105 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Pain [HP:0012531]"
            ]
          }
        ]
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
        "phenotypeProfile": [
          {
            "category": "Abnormality of the nervous system [HP:0000707]",
            "terms": "33 / 206 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal brain morphology [HP:0012443]",
              "Abnormal cerebral morphology [HP:0002060]",
              "Abnormal fear-induced behavior [HP:0100852]",
              "Abnormal nervous system morphology [HP:0012639]",
              "Abnormal nervous system physiology [HP:0012638]",
              "Abnormal social behavior [HP:0012433]",
              "Abnormality of movement [HP:0100022]",
              "Abnormality of the nervous system [HP:0000707]",
              "Agoraphobia [HP:0000756]",
              "Anxiety [HP:0000739]",
              "Atypical behavior [HP:0000708]",
              "Claustrophobia [HP:0025253]",
              "Delayed speech and language development [HP:0000750]",
              "Depression [HP:0000716]",
              "Encephalopathy [HP:0001298]",
              "Epileptic encephalopathy [HP:0200134]",
              "Excessive shyness [HP:0100962]",
              "Expressive language delay [HP:0002474]",
              "Global developmental delay [HP:0001263]",
              "Headache [HP:0002315]",
              "Impairment in personality functioning [HP:0031466]",
              "Involuntary movements [HP:0004305]",
              "Morphological central nervous system abnormality [HP:0002011]",
              "Muscle fibrillation [HP:0010546]",
              "Myoclonus [HP:0001336]",
              "Neurodevelopmental abnormality [HP:0012759]",
              "Neurodevelopmental delay [HP:0012758]",
              "Obstructive sleep apnea [HP:0002870]",
              "Receptive language delay [HP:0010863]",
              "Seizure [HP:0001250]",
              "Sleep apnea [HP:0010535]",
              "Sleep disturbance [HP:0002360]",
              "Snoring [HP:0025267]"
            ]
          },
          {
            "category": "Abnormality of the musculoskeletal system [HP:0033127]",
            "terms": "26 / 206 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal appendicular skeleton morphology [HP:0011844]",
              "Abnormal axial skeleton morphology [HP:0009121]",
              "Abnormal intervertebral disk morphology [HP:0005108]",
              "Abnormal joint morphology [HP:0001367]",
              "Abnormal muscle physiology [HP:0011804]",
              "Abnormal muscle tone [HP:0003808]",
              "Abnormal rib cage morphology [HP:0001547]",
              "Abnormal skeletal morphology [HP:0011842]",
              "Abnormal thorax morphology [HP:0000765]",
              "Abnormality of connective tissue [HP:0003549]",
              "Abnormality of the musculature [HP:0003011]",
              "Abnormality of the musculoskeletal system [HP:0033127]",
              "Abnormality of the skeletal system [HP:0000924]",
              "Abnormality of the vertebral column [HP:0000925]",
              "Aplasia/hypoplasia affecting bones of the axial skeleton [HP:0009122]",
              "Aplasia/hypoplasia involving the skeleton [HP:0009115]",
              "Aplasia/Hypoplasia involving the vertebral column [HP:0008518]",
              "Arthritis [HP:0001369]",
              "Arthropathy [HP:0003040]",
              "Generalized hypotonia [HP:0001290]",
              "Hypotonia [HP:0001252]",
              "Intervertebral disk degeneration [HP:0008419]",
              "Muscle flaccidity [HP:0010547]",
              "Muscle weakness [HP:0001324]",
              "Osteoarthritis [HP:0002758]",
              "Thoracic dysplasia [HP:0006644]"
            ]
          },
          {
            "category": "Abnormality of the cardiovascular system [HP:0001626]",
            "terms": "20 / 206 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal blood vessel morphology [HP:0033353]",
              "Abnormal cardiac atrium morphology [HP:0005120]",
              "Abnormal cardiovascular system morphology [HP:0030680]",
              "Abnormal cardiovascular system physiology [HP:0011025]",
              "Abnormal heart morphology [HP:0001627]",
              "Abnormal heart valve morphology [HP:0001654]",
              "Abnormal morphology of the great vessels [HP:0030962]",
              "Abnormal vascular morphology [HP:0025015]",
              "Abnormality of cardiovascular system electrophysiology [HP:0030956]",
              "Abnormality of the cardiovascular system [HP:0001626]",
              "Abnormality of the vasculature [HP:0002597]",
              "Arrhythmia [HP:0011675]",
              "Atrial arrhythmia [HP:0001692]",
              "Congenital malformation of the great arteries [HP:0011603]",
              "Paroxysmal supraventricular tachycardia [HP:0004763]",
              "Paroxysmal tachycardia [HP:0006688]",
              "Patent ductus arteriosus [HP:0001643]",
              "Supraventricular arrhythmia [HP:0005115]",
              "Supraventricular tachycardia [HP:0004755]",
              "Tachycardia [HP:0001649]"
            ]
          },
          {
            "category": "Abnormality of the genitourinary system [HP:0000119]",
            "terms": "17 / 206 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal external genitalia morphology [HP:0000811]",
              "Abnormal male external genitalia morphology [HP:0000032]",
              "Abnormal renal physiology [HP:0012211]",
              "Abnormal reproductive system morphology [HP:0012243]",
              "Abnormality of the genital system [HP:0000078]",
              "Abnormality of the genitourinary system [HP:0000119]",
              "Abnormality of the kidney [HP:0000077]",
              "Abnormality of the male genitalia [HP:0010461]",
              "Abnormality of the upper urinary tract [HP:0010935]",
              "Abnormality of the urinary system [HP:0000079]",
              "Abnormality of the urinary system physiology [HP:0011277]",
              "Ambiguous genitalia [HP:0000062]",
              "Ambiguous genitalia, male [HP:0000033]",
              "Nephritis [HP:0000123]",
              "Nephropathy [HP:0000112]",
              "Nephrotic syndrome [HP:0000100]",
              "Renal insufficiency [HP:0000083]"
            ]
          },
          {
            "category": "Abnormality of the immune system [HP:0002715]",
            "terms": "16 / 206 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal cellular immune system morphology [HP:0010987]",
              "Abnormal inflammatory response [HP:0012647]",
              "Abnormal lymph node morphology [HP:0002733]",
              "Abnormal nasopharyngeal adenoid morphology [HP:3000033]",
              "Abnormal size of nasopharyngeal adenoids [HP:0040257]",
              "Abnormality of immune system physiology [HP:0010978]",
              "Abnormality of the immune system [HP:0002715]",
              "Abnormality of the lymphatic system [HP:0100763]",
              "Abnormality of the tonsils [HP:0100765]",
              "Allergy [HP:0012393]",
              "Combined immunodeficiency [HP:0005387]",
              "Immunodeficiency [HP:0002721]",
              "Increased inflammatory response [HP:0012649]",
              "Increased size of nasopharyngeal adenoids [HP:0040261]",
              "Lymphadenopathy [HP:0002716]",
              "Severe combined immunodeficiency [HP:0004430]"
            ]
          },
          {
            "category": "Abnormality of head or neck [HP:0000152]",
            "terms": "14 / 206 terms",
            "queryPhenotype": "Abnormal oral morphology [HP:0031816]",
            "phenotypeTerms": [
              "Abnormal oral morphology [HP:0031816]",
              "Abnormal facial shape [HP:0001999]",
              "Abnormal nasopharynx morphology [HP:0001739]",
              "Abnormal oral cavity morphology [HP:0000163]",
              "Abnormal scalp morphology [HP:0001965]",
              "Abnormal tongue morphology [HP:0030809]",
              "Abnormality of head or neck [HP:0000152]",
              "Abnormality of the face [HP:0000271]",
              "Abnormality of the head [HP:0000234]",
              "Abnormality of the mouth [HP:0000153]",
              "Abnormality of the nose [HP:0000366]",
              "Abnormality of the tongue [HP:0000157]",
              "Nasal congestion [HP:0001742]",
              "Protruding tongue [HP:0010808]"
            ]
          },
          {
            "category": "Abnormality of the integument [HP:0001574]",
            "terms": "14 / 206 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal hair morphology [HP:0001595]",
              "Abnormal skin morphology [HP:0011121]",
              "Abnormality of skin physiology [HP:0011122]",
              "Abnormality of skin pigmentation [HP:0001000]",
              "Abnormality of the integument [HP:0001574]",
              "Abnormality of the skin [HP:0000951]",
              "Acne [HP:0001061]",
              "Comedo [HP:0025249]",
              "Dry skin [HP:0000958]",
              "Eczematoid dermatitis [HP:0000964]",
              "Inflammatory abnormality of the skin [HP:0011123]",
              "Localized skin lesion [HP:0011355]",
              "Open comedo [HP:0025251]",
              "Skin rash [HP:0000988]"
            ]
          },
          {
            "category": "Abnormality of the respiratory system [HP:0002086]",
            "terms": "14 / 206 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal breath sound [HP:0030829]",
              "Abnormal pattern of respiration [HP:0002793]",
              "Abnormal pharynx morphology [HP:0033151]",
              "Abnormal respiratory system morphology [HP:0012252]",
              "Abnormal respiratory system physiology [HP:0002795]",
              "Abnormality of the pharynx [HP:0000600]",
              "Abnormality of the respiratory system [HP:0002086]",
              "Abnormality of the upper respiratory tract [HP:0002087]",
              "Apnea [HP:0002104]",
              "Asthma [HP:0002099]",
              "Breathing dysregulation [HP:0005957]",
              "Dyspnea [HP:0002094]",
              "Respiratory distress [HP:0002098]",
              "Wheezing [HP:0030828]"
            ]
          },
          {
            "category": "Abnormality of metabolism/homeostasis [HP:0001939]",
            "terms": "12 / 206 terms",
            "queryPhenotype": "Abnormal circulating purine concentration [HP:0004352]",
            "phenotypeTerms": [
              "Abnormal circulating purine concentration [HP:0004352]",
              "Abnormal blood glucose concentration [HP:0011015]",
              "Abnormal circulating carbohydrate concentration [HP:0011013]",
              "Abnormal glucose homeostasis [HP:0011014]",
              "Abnormal homeostasis [HP:0012337]",
              "Abnormality of acid-base homeostasis [HP:0004360]",
              "Abnormality of metabolism/homeostasis [HP:0001939]",
              "Acidosis [HP:0001941]",
              "Glucose intolerance [HP:0001952]",
              "Hypoglycemia [HP:0001943]",
              "Lactic acidosis [HP:0003128]",
              "Stress/infection-induced lactic acidosis [HP:0004897]"
            ]
          },
          {
            "category": "Abnormality of the digestive system [HP:0025031]",
            "terms": "10 / 206 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abdominal mass [HP:0031500]",
              "Abdominal symptom [HP:0011458]",
              "Abnormal abdomen morphology [HP:0001438]",
              "Abnormality of digestive system physiology [HP:0025032]",
              "Abnormality of the digestive system [HP:0025031]",
              "Abnormality of the gastrointestinal tract [HP:0011024]",
              "Abnormality of the liver [HP:0001392]",
              "Functional abnormality of the gastrointestinal tract [HP:0012719]",
              "Gastrointestinal obstruction [HP:0004796]",
              "Pelvic mass [HP:0031501]"
            ]
          },
          {
            "category": "Constitutional symptom [HP:0025142]",
            "terms": "7 / 206 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abdominal pain [HP:0002027]",
              "Constitutional symptom [HP:0025142]",
              "Fatigue [HP:0012378]",
              "Impaired continence [HP:0031064]",
              "Impairment of activities of daily living [HP:0031058]",
              "Pain [HP:0012531]",
              "Urinary incontinence [HP:0000020]"
            ]
          },
          {
            "category": "Abnormality of the ear [HP:0000598]",
            "terms": "6 / 206 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal ear morphology [HP:0031703]",
              "Abnormal vestibular function [HP:0001751]",
              "Abnormality of the ear [HP:0000598]",
              "Abnormality of the inner ear [HP:0000359]",
              "Functional abnormality of the inner ear [HP:0011389]",
              "Vertigo [HP:0002321]"
            ]
          },
          {
            "category": "Abnormality of limbs [HP:0040064]",
            "terms": "4 / 206 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal limb bone morphology [HP:0002813]",
              "Abnormality of limb bone [HP:0040068]",
              "Abnormality of limbs [HP:0040064]",
              "Limb duplication [HP:0100524]"
            ]
          },
          {
            "category": "Abnormality of prenatal development or birth [HP:0001197]",
            "terms": "4 / 206 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal delivery [HP:0001787]",
              "Abnormality of prenatal development or birth [HP:0001197]",
              "Caesarean section [HP:0011410]",
              "Secondary Caesarian section [HP:0030364]"
            ]
          },
          {
            "category": "Growth abnormality [HP:0001507]",
            "terms": "4 / 206 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormality of body weight [HP:0004323]",
              "Growth abnormality [HP:0001507]",
              "Increased body weight [HP:0004324]",
              "Obesity [HP:0001513]"
            ]
          },
          {
            "category": "Abnormality of the endocrine system [HP:0000818]",
            "terms": "2 / 206 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormality of the endocrine system [HP:0000818]",
              "Diabetes mellitus [HP:0000819]"
            ]
          },
          {
            "category": "Abnormality of blood and blood-forming tissues [HP:0001871]",
            "terms": "1 / 206 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormality of blood and blood-forming tissues [HP:0001871]"
            ]
          },
          {
            "category": "Abnormality of the thoracic cavity [HP:0045027]",
            "terms": "1 / 206 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal mediastinum morphology [HP:0045026]"
            ]
          },
          {
            "category": "Other phenotype terms",
            "terms": "1 / 206 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "HP:0000976 [HP:0000976]"
            ]
          }
        ]
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
        "phenotypeProfile": [
          {
            "category": "Abnormality of metabolism/homeostasis [HP:0001939]",
            "terms": "37 / 255 terms",
            "queryPhenotype": "Abnormal circulating purine concentration [HP:0004352]",
            "phenotypeTerms": [
              "Abnormal circulating purine concentration [HP:0004352]",
              "Abnormal blood cation concentration [HP:0010929]",
              "Abnormal blood glucose concentration [HP:0011015]",
              "Abnormal blood inorganic cation concentration [HP:0010927]",
              "Abnormal blood ion concentration [HP:0003111]",
              "Abnormal blood monovalent inorganic cation concentration [HP:0010930]",
              "Abnormal blood sodium concentration [HP:0010931]",
              "Abnormal circulating albumin concentration [HP:0012116]",
              "Abnormal circulating bilirubin concentration [HP:0033479]",
              "Abnormal circulating calcium concentration [HP:0004363]",
              "Abnormal circulating carbohydrate concentration [HP:0011013]",
              "Abnormal circulating carboxylic acid concentration [HP:0004354]",
              "Abnormal circulating creatinine concentration [HP:0012100]",
              "Abnormal circulating dicarboxylic acid concentration [HP:0010995]",
              "Abnormal circulating metabolite concentration [HP:0032180]",
              "Abnormal circulating nitrogen compound concentration [HP:0004364]",
              "Abnormal circulating protein concentration [HP:0010876]",
              "Abnormal glucose homeostasis [HP:0011014]",
              "Abnormal homeostasis [HP:0012337]",
              "Abnormality of acid-base homeostasis [HP:0004360]",
              "Abnormality of fluid regulation [HP:0011032]",
              "Abnormality of metabolism/homeostasis [HP:0001939]",
              "Acidosis [HP:0001941]",
              "Anasarca [HP:0012050]",
              "Azotemia [HP:0002157]",
              "Edema [HP:0000969]",
              "Elevated circulating creatinine concentration [HP:0003259]",
              "Generalized edema [HP:0007430]",
              "Glucose intolerance [HP:0001952]",
              "Hyperbilirubinemia [HP:0002904]",
              "Hyperglycemia [HP:0003074]",
              "Hypoalbuminemia [HP:0003073]",
              "Hypocalcemia [HP:0002901]",
              "Hyponatremia [HP:0002902]",
              "Lactic acidosis [HP:0003128]",
              "Metabolic acidosis [HP:0001942]",
              "Neonatal hyperbilirubinemia [HP:0003265]"
            ]
          },
          {
            "category": "Abnormality of head or neck [HP:0000152]",
            "terms": "36 / 255 terms",
            "queryPhenotype": "Abnormal oral morphology [HP:0031816]",
            "phenotypeTerms": [
              "Abnormal oral morphology [HP:0031816]",
              "Abnormal calvaria morphology [HP:0002683]",
              "Abnormal facial expression [HP:0005346]",
              "Abnormal facial shape [HP:0001999]",
              "Abnormal facial skeleton morphology [HP:0011821]",
              "Abnormal forehead morphology [HP:0000290]",
              "Abnormal jaw morphology [HP:0030791]",
              "Abnormal lip morphology [HP:0000159]",
              "Abnormal mandible morphology [HP:0000277]",
              "Abnormal oral cavity morphology [HP:0000163]",
              "Abnormal periauricular region morphology [HP:0000383]",
              "Abnormal skull morphology [HP:0000929]",
              "Abnormal upper lip morphology [HP:0000177]",
              "Abnormality of head or neck [HP:0000152]",
              "Abnormality of skull size [HP:0000240]",
              "Abnormality of the chin [HP:0000306]",
              "Abnormality of the face [HP:0000271]",
              "Abnormality of the head [HP:0000234]",
              "Abnormality of the mouth [HP:0000153]",
              "Aplasia/Hypoplasia involving bones of the skull [HP:0009116]",
              "Aplasia/Hypoplasia of the mandible [HP:0009118]",
              "Brachycephaly [HP:0000248]",
              "Cleft lip [HP:0410030]",
              "Cleft upper lip [HP:0000204]",
              "Decreased head circumference [HP:0040195]",
              "Hypoplastic facial bones [HP:0002692]",
              "Incomplete cleft of the upper lip [HP:0011340]",
              "Microcephaly [HP:0000252]",
              "Micrognathia [HP:0000347]",
              "Narrow forehead [HP:0000341]",
              "Non-midline cleft of the upper lip [HP:0100335]",
              "Orofacial cleft [HP:0000202]",
              "Retrognathia [HP:0000278]",
              "Short chin [HP:0000331]",
              "Small face [HP:0000274]",
              "Unilateral cleft lip [HP:0100333]"
            ]
          },
          {
            "category": "Abnormality of the cardiovascular system [HP:0001626]",
            "terms": "35 / 255 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal aortic arch morphology [HP:0012303]",
              "Abnormal aortic morphology [HP:0001679]",
              "Abnormal atrial septum morphology [HP:0011994]",
              "Abnormal blood vessel morphology [HP:0033353]",
              "Abnormal cardiac atrium morphology [HP:0005120]",
              "Abnormal cardiac septum morphology [HP:0001671]",
              "Abnormal cardiac ventricle morphology [HP:0001713]",
              "Abnormal cardiovascular system morphology [HP:0030680]",
              "Abnormal cardiovascular system physiology [HP:0011025]",
              "Abnormal connection of the cardiac segments [HP:0011545]",
              "Abnormal heart morphology [HP:0001627]",
              "Abnormal heart sound [HP:0031657]",
              "Abnormal left ventricle morphology [HP:0001711]",
              "Abnormal morphology of the great vessels [HP:0030962]",
              "Abnormal systemic arterial morphology [HP:0011004]",
              "Abnormal vascular morphology [HP:0025015]",
              "Abnormal ventricular septum morphology [HP:0010438]",
              "Abnormal ventriculoarterial connection [HP:0011563]",
              "Abnormality of the cardiovascular system [HP:0001626]",
              "Abnormality of the vasculature [HP:0002597]",
              "Arterial stenosis [HP:0100545]",
              "Atrial septal defect [HP:0001631]",
              "Coarctation of aorta [HP:0001680]",
              "Congenital malformation of the great arteries [HP:0011603]",
              "Congenital malformation of the left heart [HP:0045017]",
              "Conotruncal defect [HP:0001710]",
              "Heart murmur [HP:0030148]",
              "Hypoplastic aortic arch [HP:0012304]",
              "Hypoplastic ventricle [HP:0001961]",
              "Interrupted aortic arch [HP:0011611]",
              "Interrupted aortic arch type B [HP:0011613]",
              "Patent ductus arteriosus [HP:0001643]",
              "Patent ductus arteriosus after premature birth [HP:0011649]",
              "Peripheral arterial stenosis [HP:0004950]",
              "Ventricular septal defect [HP:0001629]"
            ]
          },
          {
            "category": "Abnormality of the genitourinary system [HP:0000119]",
            "terms": "21 / 255 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal external genitalia morphology [HP:0000811]",
              "Abnormal male external genitalia morphology [HP:0000032]",
              "Abnormal male urethral meatus morphology [HP:0032076]",
              "Abnormal penis morphology [HP:0000036]",
              "Abnormal renal physiology [HP:0012211]",
              "Abnormal reproductive system morphology [HP:0012243]",
              "Abnormal urine output [HP:0012590]",
              "Abnormality of renal excretion [HP:0011036]",
              "Abnormality of the genital system [HP:0000078]",
              "Abnormality of the genitourinary system [HP:0000119]",
              "Abnormality of the kidney [HP:0000077]",
              "Abnormality of the lower urinary tract [HP:0010936]",
              "Abnormality of the male genitalia [HP:0010461]",
              "Abnormality of the upper urinary tract [HP:0010935]",
              "Abnormality of the urethra [HP:0000795]",
              "Abnormality of the urinary system [HP:0000079]",
              "Abnormality of the urinary system physiology [HP:0011277]",
              "Anuria [HP:0100519]",
              "Decreased urine output [HP:0011037]",
              "Displacement of the urethral meatus [HP:0100627]",
              "Hypospadias [HP:0000047]"
            ]
          },
          {
            "category": "Abnormality of the musculoskeletal system [HP:0033127]",
            "terms": "20 / 255 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal appendicular skeleton morphology [HP:0011844]",
              "Abnormal axial skeleton morphology [HP:0009121]",
              "Abnormal muscle physiology [HP:0011804]",
              "Abnormal muscle tone [HP:0003808]",
              "Abnormal sacrum morphology [HP:0005107]",
              "Abnormal skeletal morphology [HP:0011842]",
              "Abnormal thorax morphology [HP:0000765]",
              "Abnormality of connective tissue [HP:0003549]",
              "Abnormality of the musculature [HP:0003011]",
              "Abnormality of the musculoskeletal system [HP:0033127]",
              "Abnormality of the skeletal system [HP:0000924]",
              "Abnormality of the vertebral column [HP:0000925]",
              "Aplasia/hypoplasia affecting bones of the axial skeleton [HP:0009122]",
              "Aplasia/hypoplasia involving the skeleton [HP:0009115]",
              "Generalized hypotonia [HP:0001290]",
              "Hypotonia [HP:0001252]",
              "Neonatal hypotonia [HP:0001319]",
              "Sacrococcygeal pilonidal abnormality [HP:0010767]",
              "Thoracic hypoplasia [HP:0005257]",
              "Unilateral chest hypoplasia [HP:0005254]"
            ]
          },
          {
            "category": "Abnormality of the nervous system [HP:0000707]",
            "terms": "19 / 255 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal brain morphology [HP:0012443]",
              "Abnormal cerebellum morphology [HP:0001317]",
              "Abnormal cerebral morphology [HP:0002060]",
              "Abnormal forebrain morphology [HP:0100547]",
              "Abnormal hindbrain morphology [HP:0011282]",
              "Abnormal metencephalon morphology [HP:0011283]",
              "Abnormal nervous system morphology [HP:0012639]",
              "Abnormal nervous system physiology [HP:0012638]",
              "Abnormality of mental function [HP:0011446]",
              "Abnormality of the nervous system [HP:0000707]",
              "Aplasia/Hypoplasia involving the central nervous system [HP:0002977]",
              "Aplasia/Hypoplasia of the cerebellum [HP:0007360]",
              "Aplasia/Hypoplasia of the cerebrum [HP:0007364]",
              "Atypical behavior [HP:0000708]",
              "Cerebellar hypoplasia [HP:0001321]",
              "Depression [HP:0000716]",
              "Impairment in personality functioning [HP:0031466]",
              "Morphological central nervous system abnormality [HP:0002011]",
              "Reduced consciousness [HP:0004372]"
            ]
          },
          {
            "category": "Abnormality of limbs [HP:0040064]",
            "terms": "18 / 255 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal digit morphology [HP:0011297]",
              "Abnormal fifth toe morphology [HP:0010322]",
              "Abnormal finger morphology [HP:0001167]",
              "Abnormal foot morphology [HP:0001760]",
              "Abnormal limb bone morphology [HP:0002813]",
              "Abnormal toe morphology [HP:0001780]",
              "Abnormality of limb bone [HP:0040068]",
              "Abnormality of limbs [HP:0040064]",
              "Abnormality of the hand [HP:0001155]",
              "Abnormality of the lower limb [HP:0002814]",
              "Abnormality of the phalanges of the 5th toe [HP:0010342]",
              "Abnormality of the upper limb [HP:0002817]",
              "Clinodactyly [HP:0030084]",
              "Deviation of finger [HP:0004097]",
              "Deviation of the hand or of fingers of the hand [HP:0009484]",
              "Finger clinodactyly [HP:0040019]",
              "Syndactyly [HP:0001159]",
              "Toe syndactyly [HP:0001770]"
            ]
          },
          {
            "category": "Abnormality of the ear [HP:0000598]",
            "terms": "13 / 255 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal antihelix morphology [HP:0009738]",
              "Abnormal ear morphology [HP:0031703]",
              "Abnormal location of ears [HP:0000357]",
              "Abnormal pinna morphology [HP:0000377]",
              "Abnormality of the ear [HP:0000598]",
              "Abnormality of the outer ear [HP:0000356]",
              "Absent antihelix [HP:0011234]",
              "Aplasia/Hypoplasia of the ear [HP:0008771]",
              "Aplasia/Hypoplasia of the external ear [HP:0008772]",
              "Low-set ears [HP:0000369]",
              "Microtia [HP:0008551]",
              "Mozart ear [HP:0030677]",
              "Posteriorly rotated ears [HP:0000358]"
            ]
          },
          {
            "category": "Abnormality of blood and blood-forming tissues [HP:0001871]",
            "terms": "7 / 255 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal bleeding [HP:0001892]",
              "Abnormal thrombosis [HP:0001977]",
              "Abnormality of blood and blood-forming tissues [HP:0001871]",
              "Abnormality of coagulation [HP:0001928]",
              "Abnormality of the coagulation cascade [HP:0003256]",
              "Arterial thrombosis [HP:0004420]",
              "Venous thrombosis [HP:0004936]"
            ]
          },
          {
            "category": "Abnormality of prenatal development or birth [HP:0001197]",
            "terms": "7 / 255 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal placenta morphology [HP:0100767]",
              "Abnormalities of placenta or umbilical cord [HP:0001194]",
              "Abnormality of prenatal development or birth [HP:0001197]",
              "Abnormality of the amniotic fluid [HP:0001560]",
              "Calcified placenta [HP:0011415]",
              "Oligohydramnios [HP:0001562]",
              "Premature birth [HP:0001622]"
            ]
          },
          {
            "category": "Abnormality of the digestive system [HP:0025031]",
            "terms": "7 / 255 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abdominal distention [HP:0003270]",
              "Abdominal symptom [HP:0011458]",
              "Abnormal abdomen morphology [HP:0001438]",
              "Abnormality of digestive system physiology [HP:0025032]",
              "Abnormality of the digestive system [HP:0025031]",
              "Abnormality of the gastrointestinal tract [HP:0011024]",
              "Ascites [HP:0001541]"
            ]
          },
          {
            "category": "Abnormality of the respiratory system [HP:0002086]",
            "terms": "7 / 255 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal lung morphology [HP:0002088]",
              "Abnormal respiratory system morphology [HP:0012252]",
              "Abnormal respiratory system physiology [HP:0002795]",
              "Abnormality of the respiratory system [HP:0002086]",
              "Pneumothorax [HP:0002107]",
              "Pulmonary edema [HP:0100598]",
              "Respiratory insufficiency [HP:0002093]"
            ]
          },
          {
            "category": "Abnormality of the integument [HP:0001574]",
            "terms": "6 / 255 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal skin morphology [HP:0011121]",
              "Abnormality of the integument [HP:0001574]",
              "Abnormality of the skin [HP:0000951]",
              "Localized skin lesion [HP:0011355]",
              "Sacral dimple [HP:0000960]",
              "Skin dimple [HP:0010781]"
            ]
          },
          {
            "category": "Abnormality of the breast [HP:0000769]",
            "terms": "5 / 255 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal breast morphology [HP:0031093]",
              "Abnormal intermamillary distance [HP:0040157]",
              "Abnormal nipple morphology [HP:0004404]",
              "Abnormality of the breast [HP:0000769]",
              "Wide intermamillary distance [HP:0006610]"
            ]
          },
          {
            "category": "Abnormality of the endocrine system [HP:0000818]",
            "terms": "5 / 255 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormality of the endocrine system [HP:0000818]",
              "Abnormality of the thyroid gland [HP:0000820]",
              "Abnormality of thyroid physiology [HP:0002926]",
              "Diabetes mellitus [HP:0000819]",
              "Hypothyroidism [HP:0000821]"
            ]
          },
          {
            "category": "Growth abnormality [HP:0001507]",
            "terms": "4 / 255 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Failure to thrive [HP:0001508]",
              "Growth abnormality [HP:0001507]",
              "Growth delay [HP:0001510]",
              "Intrauterine growth retardation [HP:0001511]"
            ]
          },
          {
            "category": "Other phenotype terms",
            "terms": "4 / 255 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Maternal diabetes [HP:0009800]",
              "Pregnancy history [HP:0002686]",
              "HP:0002648 [HP:0002648]",
              "HP:0008572 [HP:0008572]"
            ]
          },
          {
            "category": "Abnormality of the immune system [HP:0002715]",
            "terms": "3 / 255 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormality of immune system physiology [HP:0010978]",
              "Abnormality of the immune system [HP:0002715]",
              "Immunodeficiency [HP:0002721]"
            ]
          },
          {
            "category": "Abnormality of the thoracic cavity [HP:0045027]",
            "terms": "1 / 255 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal mediastinum morphology [HP:0045026]"
            ]
          }
        ]
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
        "phenotypeProfile": [
          {
            "category": "Abnormality of the integument [HP:0001574]",
            "terms": "12 / 46 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal skin morphology [HP:0011121]",
              "Abnormality of skin physiology [HP:0011122]",
              "Abnormality of skin pigmentation [HP:0001000]",
              "Abnormality of the integument [HP:0001574]",
              "Abnormality of the skin [HP:0000951]",
              "Epidermal thickening [HP:0011368]",
              "Hyperkeratosis [HP:0000962]",
              "Inflammatory abnormality of the skin [HP:0011123]",
              "Localized skin lesion [HP:0011355]",
              "Nevus [HP:0003764]",
              "Pustule [HP:0200039]",
              "Thickened skin [HP:0001072]"
            ]
          },
          {
            "category": "Abnormality of head or neck [HP:0000152]",
            "terms": "10 / 46 terms",
            "queryPhenotype": "Abnormal oral morphology [HP:0031816]",
            "phenotypeTerms": [
              "Abnormal oral morphology [HP:0031816]",
              "Abnormal dental morphology [HP:0006482]",
              "Abnormal oral cavity morphology [HP:0000163]",
              "Abnormality of head or neck [HP:0000152]",
              "Abnormality of the dentition [HP:0000164]",
              "Abnormality of the face [HP:0000271]",
              "Abnormality of the head [HP:0000234]",
              "Abnormality of the mouth [HP:0000153]",
              "Double tooth [HP:0011089]",
              "Fused teeth [HP:0011090]"
            ]
          },
          {
            "category": "Abnormality of the respiratory system [HP:0002086]",
            "terms": "7 / 46 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal respiratory system physiology [HP:0002795]",
              "Abnormality of the respiratory system [HP:0002086]",
              "Breathing dysregulation [HP:0005957]",
              "Dyspnea [HP:0002094]",
              "Neonatal respiratory distress [HP:0002643]",
              "Respiratory distress [HP:0002098]",
              "Respiratory insufficiency [HP:0002093]"
            ]
          },
          {
            "category": "Abnormality of the nervous system [HP:0000707]",
            "terms": "6 / 46 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal nervous system physiology [HP:0012638]",
              "Abnormality of the nervous system [HP:0000707]",
              "Atypical behavior [HP:0000708]",
              "Delayed speech and language development [HP:0000750]",
              "Neurodevelopmental abnormality [HP:0012759]",
              "Neurodevelopmental delay [HP:0012758]"
            ]
          },
          {
            "category": "Abnormality of the immune system [HP:0002715]",
            "terms": "4 / 46 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal inflammatory response [HP:0012647]",
              "Abnormality of immune system physiology [HP:0010978]",
              "Abnormality of the immune system [HP:0002715]",
              "Increased inflammatory response [HP:0012649]"
            ]
          },
          {
            "category": "Neoplasm [HP:0002664]",
            "terms": "4 / 46 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Cutaneous hamartoma [HP:0031111]",
              "Hamartoma [HP:0010566]",
              "Neoplasm [HP:0002664]",
              "Neoplasm by histology [HP:0011792]"
            ]
          },
          {
            "category": "Abnormality of the musculoskeletal system [HP:0033127]",
            "terms": "3 / 46 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormality of connective tissue [HP:0003549]",
              "Abnormality of the musculoskeletal system [HP:0033127]",
              "Connective tissue nevi [HP:0100898]"
            ]
          }
        ]
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
        "phenotypeProfile": [
          {
            "category": "Abnormality of the nervous system [HP:0000707]",
            "terms": "18 / 49 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal nervous system physiology [HP:0012638]",
              "Abnormal social behavior [HP:0012433]",
              "Abnormality of mental function [HP:0011446]",
              "Abnormality of the nervous system [HP:0000707]",
              "Atypical behavior [HP:0000708]",
              "Delayed early-childhood social milestone development [HP:0012434]",
              "Delayed fine motor development [HP:0010862]",
              "Delayed gross motor development [HP:0002194]",
              "Delayed speech and language development [HP:0000750]",
              "Expressive language delay [HP:0002474]",
              "Global developmental delay [HP:0001263]",
              "Intellectual disability [HP:0001249]",
              "Moderate intellectual disability [HP:0002342]",
              "Motor delay [HP:0001270]",
              "Neurodevelopmental abnormality [HP:0012759]",
              "Neurodevelopmental delay [HP:0012758]",
              "Receptive language delay [HP:0010863]",
              "Sleep disturbance [HP:0002360]"
            ]
          },
          {
            "category": "Abnormality of limbs [HP:0040064]",
            "terms": "15 / 49 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal digit morphology [HP:0011297]",
              "Abnormal finger morphology [HP:0001167]",
              "Abnormal hand morphology [HP:0005922]",
              "Abnormal limb bone morphology [HP:0002813]",
              "Abnormality of limb bone [HP:0040068]",
              "Abnormality of limbs [HP:0040064]",
              "Abnormality of the hand [HP:0001155]",
              "Abnormality of the upper limb [HP:0002817]",
              "Aplasia/hypoplasia involving bones of the extremities [HP:0045060]",
              "Aplasia/hypoplasia involving bones of the hand [HP:0005927]",
              "Aplasia/hypoplasia involving bones of the upper limbs [HP:0006496]",
              "Aplasia/Hypoplasia of fingers [HP:0006265]",
              "Aplasia/hypoplasia of the extremities [HP:0009815]",
              "Short digit [HP:0011927]",
              "Short finger [HP:0009381]"
            ]
          },
          {
            "category": "Abnormality of head or neck [HP:0000152]",
            "terms": "8 / 49 terms",
            "queryPhenotype": "Abnormal oral morphology [HP:0031816]",
            "phenotypeTerms": [
              "Abnormal oral morphology [HP:0031816]",
              "Abnormal oral cavity morphology [HP:0000163]",
              "Abnormal palate morphology [HP:0000174]",
              "Abnormality of head or neck [HP:0000152]",
              "Abnormality of the face [HP:0000271]",
              "Abnormality of the head [HP:0000234]",
              "Abnormality of the mouth [HP:0000153]",
              "High palate [HP:0000218]"
            ]
          },
          {
            "category": "Abnormality of the musculoskeletal system [HP:0033127]",
            "terms": "5 / 49 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal appendicular skeleton morphology [HP:0011844]",
              "Abnormal skeletal morphology [HP:0011842]",
              "Abnormality of the musculoskeletal system [HP:0033127]",
              "Abnormality of the skeletal system [HP:0000924]",
              "Aplasia/hypoplasia involving the skeleton [HP:0009115]"
            ]
          },
          {
            "category": "Abnormality of prenatal development or birth [HP:0001197]",
            "terms": "3 / 49 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal delivery [HP:0001787]",
              "Abnormality of prenatal development or birth [HP:0001197]",
              "Nuchal cord [HP:0012498]"
            ]
          }
        ]
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
        "phenotypeProfile": [
          {
            "category": "Abnormality of head or neck [HP:0000152]",
            "terms": "26 / 68 terms",
            "queryPhenotype": "Abnormal oral morphology [HP:0031816]",
            "phenotypeTerms": [
              "Abnormal oral morphology [HP:0031816]",
              "Abnormal cheek morphology [HP:0004426]",
              "Abnormal eyelid morphology [HP:0000492]",
              "Abnormal lip morphology [HP:0000159]",
              "Abnormal midface morphology [HP:0000309]",
              "Abnormal nasal bridge morphology [HP:0000422]",
              "Abnormal nasal morphology [HP:0005105]",
              "Abnormal ocular adnexa morphology [HP:0030669]",
              "Abnormal oral cavity morphology [HP:0000163]",
              "Abnormal upper lip morphology [HP:0000177]",
              "Abnormality of head or neck [HP:0000152]",
              "Abnormality of the face [HP:0000271]",
              "Abnormality of the head [HP:0000234]",
              "Abnormality of the mouth [HP:0000153]",
              "Abnormality of the nose [HP:0000366]",
              "Abnormality of the ocular adnexa [HP:0032039]",
              "Abnormality of the orbital region [HP:0000315]",
              "Abnormality of the palpebral fissures [HP:0008050]",
              "Abnormality of upper lip vermillion [HP:0011339]",
              "Depressed nasal bridge [HP:0005280]",
              "Epicanthus [HP:0000286]",
              "Full cheeks [HP:0000293]",
              "Slanting of the palpebral fissure [HP:0200006]",
              "Thin upper lip vermilion [HP:0000219]",
              "Thin vermilion border [HP:0000233]",
              "Upslanted palpebral fissure [HP:0000582]"
            ]
          },
          {
            "category": "Abnormality of the ear [HP:0000598]",
            "terms": "14 / 68 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal antihelix morphology [HP:0009738]",
              "Abnormal ear morphology [HP:0031703]",
              "Abnormal ear physiology [HP:0031704]",
              "Abnormal Eustachian tube morphology [HP:0040115]",
              "Abnormal location of ears [HP:0000357]",
              "Abnormality of the ear [HP:0000598]",
              "Abnormality of the middle ear [HP:0000370]",
              "Abnormality of the outer ear [HP:0000356]",
              "Anteverted ears [HP:0040080]",
              "Conductive hearing impairment [HP:0000405]",
              "Functional abnormality of the middle ear [HP:0011452]",
              "Hearing abnormality [HP:0000364]",
              "Hearing impairment [HP:0000365]",
              "Low-set ears [HP:0000369]"
            ]
          },
          {
            "category": "Abnormality of the immune system [HP:0002715]",
            "terms": "6 / 68 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal inflammatory response [HP:0012647]",
              "Abnormality of immune system physiology [HP:0010978]",
              "Abnormality of the immune system [HP:0002715]",
              "Increased inflammatory response [HP:0012649]",
              "Otitis media [HP:0000388]",
              "Otitis media with effusion [HP:0031353]"
            ]
          },
          {
            "category": "Abnormality of the respiratory system [HP:0002086]",
            "terms": "6 / 68 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal respiratory system physiology [HP:0002795]",
              "Abnormality of the respiratory system [HP:0002086]",
              "Dyspnea [HP:0002094]",
              "Neonatal respiratory distress [HP:0002643]",
              "Respiratory distress [HP:0002098]",
              "Respiratory insufficiency [HP:0002093]"
            ]
          },
          {
            "category": "Abnormality of the cardiovascular system [HP:0001626]",
            "terms": "5 / 68 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal cardiovascular system physiology [HP:0011025]",
              "Abnormal systemic blood pressure [HP:0030972]",
              "Abnormality of the cardiovascular system [HP:0001626]",
              "Hypertension [HP:0000822]",
              "Increased blood pressure [HP:0032263]"
            ]
          },
          {
            "category": "Abnormality of the integument [HP:0001574]",
            "terms": "5 / 68 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal eyelash morphology [HP:0000499]",
              "Abnormal hair morphology [HP:0001595]",
              "Abnormal skin adnexa morphology [HP:0011138]",
              "Abnormality of the integument [HP:0001574]",
              "Long eyelashes [HP:0000527]"
            ]
          },
          {
            "category": "Other phenotype terms",
            "terms": "5 / 68 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Family history [HP:0032316]",
              "Maternal hypertension [HP:0008071]",
              "Past medical history [HP:0032443]",
              "Pregnancy history [HP:0002686]",
              "Toxemia of pregnancy [HP:0100603]"
            ]
          },
          {
            "category": "Abnormality of prenatal development or birth [HP:0001197]",
            "terms": "1 / 68 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormality of prenatal development or birth [HP:0001197]"
            ]
          }
        ]
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
        "profileMatch": "0 / 2 exact query HPO terms · 4 related HPO terms",
        "externalAnnotation": "external annotation shown when available",
        "cohortCarrierEvidence": "18 / 20 phenotype-matched samples carry rare ARMC9 variants",
        "whyMatched": "CRDC recurrence among phenotype-matched samples",
        "hpoTerms": [
          {
            "hpoId": "HP:0000193",
            "hpoTerm": "Bifid uvula",
            "matched": false,
            "related": true,
            "evidenceRole": "Related via HPO hierarchy",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:617622"
          },
          {
            "hpoId": "HP:0000218",
            "hpoTerm": "High palate",
            "matched": false,
            "related": true,
            "evidenceRole": "Related via HPO hierarchy",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:617622"
          },
          {
            "hpoId": "HP:0000202",
            "hpoTerm": "Orofacial cleft",
            "matched": false,
            "related": true,
            "evidenceRole": "Related via HPO hierarchy",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:475"
          },
          {
            "hpoId": "HP:0000219",
            "hpoTerm": "Thin upper lip vermilion",
            "matched": false,
            "related": true,
            "evidenceRole": "Related via HPO hierarchy",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:617622"
          },
          {
            "hpoId": "HP:0004691",
            "hpoTerm": "2-3 toe syndactyly",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:617622"
          },
          {
            "hpoId": "HP:0030680",
            "hpoTerm": "Abnormal cardiovascular system morphology",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:475"
          },
          {
            "hpoId": "HP:0003312",
            "hpoTerm": "Abnormal form of the vertebral bodies",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:475"
          },
          {
            "hpoId": "HP:0002793",
            "hpoTerm": "Abnormal pattern of respiration",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:475"
          },
          {
            "hpoId": "HP:0000496",
            "hpoTerm": "Abnormality of eye movement",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:617622"
          },
          {
            "hpoId": "HP:0002269",
            "hpoTerm": "Abnormality of neuronal migration",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:475"
          },
          {
            "hpoId": "HP:0000864",
            "hpoTerm": "Abnormality of the hypothalamus-pituitary axis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:475"
          },
          {
            "hpoId": "HP:0002251",
            "hpoTerm": "Aganglionic megacolon",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:475"
          },
          {
            "hpoId": "HP:0001274",
            "hpoTerm": "Agenesis of corpus callosum",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:617622"
          },
          {
            "hpoId": "HP:0000463",
            "hpoTerm": "Anteverted nares",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:475"
          },
          {
            "hpoId": "HP:0007370",
            "hpoTerm": "Aplasia/Hypoplasia of the corpus callosum",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:475"
          },
          {
            "hpoId": "HP:0002104",
            "hpoTerm": "Apnea",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:475"
          },
          {
            "hpoId": "HP:0002104",
            "hpoTerm": "Apnea",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:617622"
          },
          {
            "hpoId": "HP:0001251",
            "hpoTerm": "Ataxia",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:475"
          },
          {
            "hpoId": "HP:0000007",
            "hpoTerm": "Autosomal recessive inheritance",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:617622"
          },
          {
            "hpoId": "HP:0004422",
            "hpoTerm": "Biparietal narrowing",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:475"
          },
          {
            "hpoId": "HP:0001272",
            "hpoTerm": "Cerebellar atrophy",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:617622"
          },
          {
            "hpoId": "HP:0001320",
            "hpoTerm": "Cerebellar vermis hypoplasia",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:475"
          },
          {
            "hpoId": "HP:0000589",
            "hpoTerm": "Coloboma",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:617622"
          },
          {
            "hpoId": "HP:0003577",
            "hpoTerm": "Congenital onset",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:617622"
          },
          {
            "hpoId": "HP:0001305",
            "hpoTerm": "Dandy-Walker malformation",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:617622"
          },
          {
            "hpoId": "HP:0000750",
            "hpoTerm": "Delayed speech and language development",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:617622"
          },
          {
            "hpoId": "HP:0002084",
            "hpoTerm": "Encephalocele",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:475"
          },
          {
            "hpoId": "HP:0002876",
            "hpoTerm": "Episodic tachypnea",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:475"
          },
          {
            "hpoId": "HP:0008872",
            "hpoTerm": "Feeding difficulties in infancy",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:475"
          },
          {
            "hpoId": "HP:0001829",
            "hpoTerm": "Foot polydactyly",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:475"
          },
          {
            "hpoId": "HP:0001288",
            "hpoTerm": "Gait disturbance",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:475"
          },
          {
            "hpoId": "HP:0001263",
            "hpoTerm": "Global developmental delay",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:617622"
          },
          {
            "hpoId": "HP:0001263",
            "hpoTerm": "Global developmental delay",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:475"
          },
          {
            "hpoId": "HP:0002282",
            "hpoTerm": "Gray matter heterotopia",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:617622"
          },
          {
            "hpoId": "HP:0001161",
            "hpoTerm": "Hand polydactyly",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:475"
          },
          {
            "hpoId": "HP:0002553",
            "hpoTerm": "Highly arched eyebrow",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:475"
          },
          {
            "hpoId": "HP:0000238",
            "hpoTerm": "Hydrocephalus",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:475"
          },
          {
            "hpoId": "HP:0001252",
            "hpoTerm": "Hypotonia",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:617622"
          },
          {
            "hpoId": "HP:0001252",
            "hpoTerm": "Hypotonia",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:475"
          },
          {
            "hpoId": "HP:0001249",
            "hpoTerm": "Intellectual disability",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:617622"
          },
          {
            "hpoId": "HP:0001249",
            "hpoTerm": "Intellectual disability",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:475"
          },
          {
            "hpoId": "HP:0000612",
            "hpoTerm": "Iris coloboma",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:475"
          },
          {
            "hpoId": "HP:0000276",
            "hpoTerm": "Long face",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:475"
          },
          {
            "hpoId": "HP:0000369",
            "hpoTerm": "Low-set ears",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:475"
          },
          {
            "hpoId": "HP:0000347",
            "hpoTerm": "Micrognathia",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:617622"
          },
          {
            "hpoId": "HP:0000054",
            "hpoTerm": "Micropenis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:617622"
          },
          {
            "hpoId": "HP:0002419",
            "hpoTerm": "Molar tooth sign on MRI",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:617622"
          },
          {
            "hpoId": "HP:0000639",
            "hpoTerm": "Nystagmus",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:475"
          },
          {
            "hpoId": "HP:0000657",
            "hpoTerm": "Oculomotor apraxia",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:475"
          },
          {
            "hpoId": "HP:0000609",
            "hpoTerm": "Optic nerve hypoplasia",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:617622"
          },
          {
            "hpoId": "HP:0010442",
            "hpoTerm": "Polydactyly",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:617622"
          },
          {
            "hpoId": "HP:0002126",
            "hpoTerm": "Polymicrogyria",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:475"
          },
          {
            "hpoId": "HP:0002126",
            "hpoTerm": "Polymicrogyria",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:617622"
          },
          {
            "hpoId": "HP:0001162",
            "hpoTerm": "Postaxial hand polydactyly",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:617622"
          },
          {
            "hpoId": "HP:0000426",
            "hpoTerm": "Prominent nasal bridge",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:475"
          },
          {
            "hpoId": "HP:0000508",
            "hpoTerm": "Ptosis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:617622"
          },
          {
            "hpoId": "HP:0000508",
            "hpoTerm": "Ptosis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:475"
          },
          {
            "hpoId": "HP:0007663",
            "hpoTerm": "Reduced visual acuity",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:617622"
          },
          {
            "hpoId": "HP:0000556",
            "hpoTerm": "Retinal dystrophy",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:617622"
          },
          {
            "hpoId": "HP:0002650",
            "hpoTerm": "Scoliosis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:475"
          },
          {
            "hpoId": "HP:0001250",
            "hpoTerm": "Seizure",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:617622"
          },
          {
            "hpoId": "HP:0001250",
            "hpoTerm": "Seizure",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:475"
          },
          {
            "hpoId": "HP:0001696",
            "hpoTerm": "Situs inversus totalis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:475"
          },
          {
            "hpoId": "HP:0000486",
            "hpoTerm": "Strabismus",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:475"
          },
          {
            "hpoId": "HP:0020185",
            "hpoTerm": "Superior cerebellar dysplasia",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:617622"
          },
          {
            "hpoId": "HP:0002789",
            "hpoTerm": "Tachypnea",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:617622"
          },
          {
            "hpoId": "HP:0001337",
            "hpoTerm": "Tremor",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:475"
          },
          {
            "hpoId": "HP:0002119",
            "hpoTerm": "Ventriculomegaly",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:617622"
          },
          {
            "hpoId": "HP:0000431",
            "hpoTerm": "Wide nasal bridge",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:617622"
          }
        ]
      },
      {
        "gene": "LUZP1",
        "profileMatch": "0 / 2 exact query HPO terms · 2 related HPO terms",
        "externalAnnotation": "external annotation shown when available",
        "cohortCarrierEvidence": "13 / 20 phenotype-matched samples carry rare LUZP1 variants",
        "whyMatched": "CRDC recurrence among phenotype-matched samples",
        "hpoTerms": [
          {
            "hpoId": "HP:0000343",
            "hpoTerm": "Long philtrum",
            "matched": false,
            "related": true,
            "evidenceRole": "Related via HPO hierarchy",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0000160",
            "hpoTerm": "Narrow mouth",
            "matched": false,
            "related": true,
            "evidenceRole": "Related via HPO hierarchy",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0000878",
            "hpoTerm": "11 pairs of ribs",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0008066",
            "hpoTerm": "Abnormal blistering of the skin",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0001671",
            "hpoTerm": "Abnormal cardiac septum morphology",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0030680",
            "hpoTerm": "Abnormal cardiovascular system morphology",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0000534",
            "hpoTerm": "Abnormal eyebrow morphology",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0000055",
            "hpoTerm": "Abnormal female external genitalia morphology",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0001654",
            "hpoTerm": "Abnormal heart valve morphology",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0002242",
            "hpoTerm": "Abnormal intestine morphology",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0002167",
            "hpoTerm": "Abnormal speech pattern",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0004378",
            "hpoTerm": "Abnormality of the anus",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0002715",
            "hpoTerm": "Abnormality of the immune system",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0000077",
            "hpoTerm": "Abnormality of the kidney",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0001392",
            "hpoTerm": "Abnormality of the liver",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0000464",
            "hpoTerm": "Abnormality of the neck",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0001743",
            "hpoTerm": "Abnormality of the spleen",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0000504",
            "hpoTerm": "Abnormality of vision",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0001344",
            "hpoTerm": "Absent speech",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0001274",
            "hpoTerm": "Agenesis of corpus callosum",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0001734",
            "hpoTerm": "Annular pancreas",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0005113",
            "hpoTerm": "Aortic arch aneurysm",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0000708",
            "hpoTerm": "Atypical behavior",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0000717",
            "hpoTerm": "Autism",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0000892",
            "hpoTerm": "Bifid ribs",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0000248",
            "hpoTerm": "Brachycephaly",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0001156",
            "hpoTerm": "Brachydactyly",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0100490",
            "hpoTerm": "Camptodactyly of finger",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0000518",
            "hpoTerm": "Cataract",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0002120",
            "hpoTerm": "Cerebral cortical atrophy",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0004209",
            "hpoTerm": "Clinodactyly of the 5th finger",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0000405",
            "hpoTerm": "Conductive hearing impairment",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0002019",
            "hpoTerm": "Constipation",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0006824",
            "hpoTerm": "Cranial nerve paralysis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0000028",
            "hpoTerm": "Cryptorchidism",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0000490",
            "hpoTerm": "Deeply set eye",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0000270",
            "hpoTerm": "Delayed cranial suture closure",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0000750",
            "hpoTerm": "Delayed speech and language development",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0005280",
            "hpoTerm": "Depressed nasal bridge",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0000457",
            "hpoTerm": "Depressed nasal ridge",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0001644",
            "hpoTerm": "Dilated cardiomyopathy",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0002015",
            "hpoTerm": "Dysphagia",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0002353",
            "hpoTerm": "EEG abnormality",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0000286",
            "hpoTerm": "Epicanthus",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0001508",
            "hpoTerm": "Failure to thrive",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0008872",
            "hpoTerm": "Feeding difficulties in infancy",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0001829",
            "hpoTerm": "Foot polydactyly",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0002007",
            "hpoTerm": "Frontal bossing",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0001288",
            "hpoTerm": "Gait disturbance",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0002020",
            "hpoTerm": "Gastroesophageal reflux",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0002230",
            "hpoTerm": "Generalized hirsutism",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0001263",
            "hpoTerm": "Global developmental delay",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0004374",
            "hpoTerm": "Hemiplegia/hemiparesis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0001397",
            "hpoTerm": "Hepatic steatosis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0008499",
            "hpoTerm": "High hypermetropia",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0001385",
            "hpoTerm": "Hip dysplasia",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0011228",
            "hpoTerm": "Horizontal eyebrow",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0000126",
            "hpoTerm": "Hydronephrosis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0000135",
            "hpoTerm": "Hypogonadism",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0008736",
            "hpoTerm": "Hypoplasia of penis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0000047",
            "hpoTerm": "Hypospadias",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0000821",
            "hpoTerm": "Hypothyroidism",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0001252",
            "hpoTerm": "Hypotonia",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0001249",
            "hpoTerm": "Intellectual disability",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0001387",
            "hpoTerm": "Joint stiffness",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0002808",
            "hpoTerm": "Kyphosis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0100559",
            "hpoTerm": "Lower limb asymmetry",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0012733",
            "hpoTerm": "Macule",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0000252",
            "hpoTerm": "Microcephaly",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0008551",
            "hpoTerm": "Microtia",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0011800",
            "hpoTerm": "Midface retrusion",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0000733",
            "hpoTerm": "Motor stereotypy",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0003198",
            "hpoTerm": "Myopathy",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0003006",
            "hpoTerm": "Neuroblastoma",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0000639",
            "hpoTerm": "Nystagmus",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0001513",
            "hpoTerm": "Obesity",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0001107",
            "hpoTerm": "Ocular albinism",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0000648",
            "hpoTerm": "Optic atrophy",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0001643",
            "hpoTerm": "Patent ductus arteriosus",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0000307",
            "hpoTerm": "Pointed chin",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0002591",
            "hpoTerm": "Polyphagia",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0002465",
            "hpoTerm": "Poor speech",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0000358",
            "hpoTerm": "Posteriorly rotated ears",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0002021",
            "hpoTerm": "Pyloric stenosis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0000107",
            "hpoTerm": "Renal cyst",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0000902",
            "hpoTerm": "Rib fusion",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0002650",
            "hpoTerm": "Scoliosis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0001250",
            "hpoTerm": "Seizure",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0100716",
            "hpoTerm": "Self-injurious behavior",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0000407",
            "hpoTerm": "Sensorineural hearing impairment",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0001773",
            "hpoTerm": "Short foot",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0004322",
            "hpoTerm": "Short stature",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0003416",
            "hpoTerm": "Spinal canal stenosis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0000486",
            "hpoTerm": "Strabismus",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0001009",
            "hpoTerm": "Telangiectasia",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0001636",
            "hpoTerm": "Tetralogy of Fallot",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0002119",
            "hpoTerm": "Ventriculomegaly",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0000505",
            "hpoTerm": "Visual impairment",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          },
          {
            "hpoId": "HP:0000431",
            "hpoTerm": "Wide nasal bridge",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:1606"
          }
        ]
      },
      {
        "gene": "HLA-C",
        "profileMatch": "0 / 2 exact query HPO terms",
        "externalAnnotation": "external annotation shown when available",
        "cohortCarrierEvidence": "13 / 20 phenotype-matched samples carry rare HLA-C variants",
        "whyMatched": "CRDC recurrence among phenotype-matched samples",
        "hpoTerms": [
          {
            "hpoId": "HP:0001369",
            "hpoTerm": "Arthritis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:177900"
          },
          {
            "hpoId": "HP:0001803",
            "hpoTerm": "Nail pits",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:177900"
          },
          {
            "hpoId": "HP:0001426",
            "hpoTerm": "Non-Mendelian inheritance",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:177900"
          },
          {
            "hpoId": "HP:0001806",
            "hpoTerm": "Onycholysis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:177900"
          },
          {
            "hpoId": "HP:0025088",
            "hpoTerm": "Onychomadesis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:177900"
          },
          {
            "hpoId": "HP:0003765",
            "hpoTerm": "Psoriasiform dermatitis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:177900"
          }
        ]
      },
      {
        "gene": "OR2T33",
        "profileMatch": "0 / 2 exact query HPO terms",
        "externalAnnotation": "external annotation shown when available",
        "cohortCarrierEvidence": "12 / 20 phenotype-matched samples carry rare OR2T33 variants",
        "whyMatched": "CRDC recurrence among phenotype-matched samples",
        "hpoTerms": []
      },
      {
        "gene": "HLA-B",
        "profileMatch": "0 / 2 exact query HPO terms · 4 related HPO terms",
        "externalAnnotation": "external annotation shown when available",
        "cohortCarrierEvidence": "11 / 20 phenotype-matched samples carry rare HLA-B variants",
        "whyMatched": "CRDC recurrence among phenotype-matched samples",
        "hpoTerms": [
          {
            "hpoId": "HP:0000206",
            "hpoTerm": "Glossitis",
            "matched": false,
            "related": true,
            "evidenceRole": "Related via HPO hierarchy",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0000155",
            "hpoTerm": "Oral ulcer",
            "matched": false,
            "related": true,
            "evidenceRole": "Related via HPO hierarchy",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0011107",
            "hpoTerm": "Recurrent aphthous stomatitis",
            "matched": false,
            "related": true,
            "evidenceRole": "Related via HPO hierarchy",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:29207"
          },
          {
            "hpoId": "HP:0011107",
            "hpoTerm": "Recurrent aphthous stomatitis",
            "matched": false,
            "related": true,
            "evidenceRole": "Related via HPO hierarchy",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:4000041",
            "hpoTerm": "AA amyloidosis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0005112",
            "hpoTerm": "Abdominal aortic aneurysm",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0002027",
            "hpoTerm": "Abdominal pain",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0002027",
            "hpoTerm": "Abdominal pain",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0002027",
            "hpoTerm": "Abdominal pain",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:29207"
          },
          {
            "hpoId": "HP:0002027",
            "hpoTerm": "Abdominal pain",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:36426"
          },
          {
            "hpoId": "HP:0001646",
            "hpoTerm": "Abnormal aortic valve morphology",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0008066",
            "hpoTerm": "Abnormal blistering of the skin",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:36426"
          },
          {
            "hpoId": "HP:0008066",
            "hpoTerm": "Abnormal blistering of the skin",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0004306",
            "hpoTerm": "Abnormal endocardium morphology",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0001654",
            "hpoTerm": "Abnormal heart valve morphology",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0001637",
            "hpoTerm": "Abnormal myocardium morphology",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:36426"
          },
          {
            "hpoId": "HP:0001637",
            "hpoTerm": "Abnormal myocardium morphology",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0001597",
            "hpoTerm": "Abnormal nail morphology",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:29207"
          },
          {
            "hpoId": "HP:0002103",
            "hpoTerm": "Abnormal pleura morphology",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0002103",
            "hpoTerm": "Abnormal pleura morphology",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:36426"
          },
          {
            "hpoId": "HP:0002103",
            "hpoTerm": "Abnormal pleura morphology",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:29207"
          },
          {
            "hpoId": "HP:0007256",
            "hpoTerm": "Abnormal pyramidal sign",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0002167",
            "hpoTerm": "Abnormal speech pattern",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0001874",
            "hpoTerm": "Abnormality of neutrophils",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:36426"
          },
          {
            "hpoId": "HP:0000795",
            "hpoTerm": "Abnormality of the urethra",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:36426"
          },
          {
            "hpoId": "HP:0001872",
            "hpoTerm": "Abnormality of thrombocytes",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0032554",
            "hpoTerm": "Absent pulse",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0100792",
            "hpoTerm": "Acantholysis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:36426"
          },
          {
            "hpoId": "HP:0001061",
            "hpoTerm": "Acne",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0006554",
            "hpoTerm": "Acute hepatic failure",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:36426"
          },
          {
            "hpoId": "HP:0001596",
            "hpoTerm": "Alopecia",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0100576",
            "hpoTerm": "Amaurosis fugax",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0100576",
            "hpoTerm": "Amaurosis fugax",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0001903",
            "hpoTerm": "Anemia",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0001903",
            "hpoTerm": "Anemia",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0001903",
            "hpoTerm": "Anemia",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:36426"
          },
          {
            "hpoId": "HP:0002039",
            "hpoTerm": "Anorexia",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0002039",
            "hpoTerm": "Anorexia",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0002039",
            "hpoTerm": "Anorexia",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0012122",
            "hpoTerm": "Anterior uveitis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:106300"
          },
          {
            "hpoId": "HP:0002647",
            "hpoTerm": "Aortic dissection",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0001659",
            "hpoTerm": "Aortic regurgitation",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:29207"
          },
          {
            "hpoId": "HP:0001659",
            "hpoTerm": "Aortic regurgitation",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:106300"
          },
          {
            "hpoId": "HP:0001659",
            "hpoTerm": "Aortic regurgitation",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0001659",
            "hpoTerm": "Aortic regurgitation",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0011675",
            "hpoTerm": "Arrhythmia",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0011675",
            "hpoTerm": "Arrhythmia",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:106300"
          },
          {
            "hpoId": "HP:0100545",
            "hpoTerm": "Arterial stenosis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0004420",
            "hpoTerm": "Arterial thrombosis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0004420",
            "hpoTerm": "Arterial thrombosis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0012089",
            "hpoTerm": "Arteritis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0002829",
            "hpoTerm": "Arthralgia",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0002829",
            "hpoTerm": "Arthralgia",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0002829",
            "hpoTerm": "Arthralgia",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:29207"
          },
          {
            "hpoId": "HP:0002829",
            "hpoTerm": "Arthralgia",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0001369",
            "hpoTerm": "Arthritis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0001369",
            "hpoTerm": "Arthritis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:29207"
          },
          {
            "hpoId": "HP:0001369",
            "hpoTerm": "Arthritis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0001369",
            "hpoTerm": "Arthritis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0004970",
            "hpoTerm": "Ascending tubular aorta aneurysm",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:6000945",
            "hpoTerm": "Asymmetric blood pressure between arms",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0001251",
            "hpoTerm": "Ataxia",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0001251",
            "hpoTerm": "Ataxia",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0000708",
            "hpoTerm": "Atypical behavior",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0010885",
            "hpoTerm": "Avascular necrosis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0003418",
            "hpoTerm": "Back pain",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:106300"
          },
          {
            "hpoId": "HP:0034438",
            "hpoTerm": "Balanitis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:29207"
          },
          {
            "hpoId": "HP:0000618",
            "hpoTerm": "Blindness",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0020141",
            "hpoTerm": "Blood pressure substantially higher in legs than arms",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:6000944",
            "hpoTerm": "Carotidynia",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0100773",
            "hpoTerm": "Cartilage destruction",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:29207"
          },
          {
            "hpoId": "HP:0000518",
            "hpoTerm": "Cataract",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0002637",
            "hpoTerm": "Cerebral ischemia",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0002637",
            "hpoTerm": "Cerebral ischemia",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0002637",
            "hpoTerm": "Cerebral ischemia",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0100749",
            "hpoTerm": "Chest pain",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0100543",
            "hpoTerm": "Cognitive impairment",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:29207"
          },
          {
            "hpoId": "HP:0000405",
            "hpoTerm": "Conductive hearing impairment",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0001289",
            "hpoTerm": "Confusion",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0001635",
            "hpoTerm": "Congestive heart failure",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0000509",
            "hpoTerm": "Conjunctivitis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:29207"
          },
          {
            "hpoId": "HP:0000509",
            "hpoTerm": "Conjunctivitis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:36426"
          },
          {
            "hpoId": "HP:0200020",
            "hpoTerm": "Corneal erosion",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:36426"
          },
          {
            "hpoId": "HP:0012735",
            "hpoTerm": "Cough",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0012735",
            "hpoTerm": "Cough",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:36426"
          },
          {
            "hpoId": "HP:0006824",
            "hpoTerm": "Cranial nerve paralysis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0000716",
            "hpoTerm": "Depression",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0002376",
            "hpoTerm": "Developmental regression",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0000873",
            "hpoTerm": "Diabetes insipidus",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0002014",
            "hpoTerm": "Diarrhea",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0002014",
            "hpoTerm": "Diarrhea",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:29207"
          },
          {
            "hpoId": "HP:0002014",
            "hpoTerm": "Diarrhea",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:36426"
          },
          {
            "hpoId": "HP:0001644",
            "hpoTerm": "Dilated cardiomyopathy",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0000651",
            "hpoTerm": "Diplopia",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0011658",
            "hpoTerm": "Double outlet right ventricle with subpulmonary ventricular septal defect without pulmonary stenosis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0001260",
            "hpoTerm": "Dysarthria",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0030016",
            "hpoTerm": "Dyspareunia",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:36426"
          },
          {
            "hpoId": "HP:0002015",
            "hpoTerm": "Dysphagia",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:36426"
          },
          {
            "hpoId": "HP:0002094",
            "hpoTerm": "Dyspnea",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:36426"
          },
          {
            "hpoId": "HP:0002094",
            "hpoTerm": "Dyspnea",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0008391",
            "hpoTerm": "Dystrophic fingernails",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:29207"
          },
          {
            "hpoId": "HP:0100518",
            "hpoTerm": "Dysuria",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:36426"
          },
          {
            "hpoId": "HP:0011227",
            "hpoTerm": "Elevated circulating C-reactive protein concentration",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0011227",
            "hpoTerm": "Elevated circulating C-reactive protein concentration",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:29207"
          },
          {
            "hpoId": "HP:0011227",
            "hpoTerm": "Elevated circulating C-reactive protein concentration",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0011227",
            "hpoTerm": "Elevated circulating C-reactive protein concentration",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0005413",
            "hpoTerm": "Elevated circulating alpha-globulin concentration",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:6000502",
            "hpoTerm": "Elevated circulating calprotectin concentration",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0002910",
            "hpoTerm": "Elevated circulating hepatic transaminase concentration",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:36426"
          },
          {
            "hpoId": "HP:0033123",
            "hpoTerm": "Elevated circulating osteopontin level",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0003565",
            "hpoTerm": "Elevated erythrocyte sedimentation rate",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0003565",
            "hpoTerm": "Elevated erythrocyte sedimentation rate",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:29207"
          },
          {
            "hpoId": "HP:0003565",
            "hpoTerm": "Elevated erythrocyte sedimentation rate",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0003565",
            "hpoTerm": "Elevated erythrocyte sedimentation rate",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0100584",
            "hpoTerm": "Endocarditis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0100686",
            "hpoTerm": "Enthesitis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:29207"
          },
          {
            "hpoId": "HP:0100686",
            "hpoTerm": "Enthesitis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:106300"
          },
          {
            "hpoId": "HP:0000621",
            "hpoTerm": "Entropion",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:36426"
          },
          {
            "hpoId": "HP:0000031",
            "hpoTerm": "Epididymitis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0000421",
            "hpoTerm": "Epistaxis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0010783",
            "hpoTerm": "Erythema",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:36426"
          },
          {
            "hpoId": "HP:0012219",
            "hpoTerm": "Erythema nodosum",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0012219",
            "hpoTerm": "Erythema nodosum",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:29207"
          },
          {
            "hpoId": "HP:0012219",
            "hpoTerm": "Erythema nodosum",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0002043",
            "hpoTerm": "Esophageal stricture",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:36426"
          },
          {
            "hpoId": "HP:0003781",
            "hpoTerm": "Excessive salivation",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:36426"
          },
          {
            "hpoId": "HP:0012378",
            "hpoTerm": "Fatigue",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0012378",
            "hpoTerm": "Fatigue",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0012378",
            "hpoTerm": "Fatigue",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0012378",
            "hpoTerm": "Fatigue",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:36426"
          },
          {
            "hpoId": "HP:0001945",
            "hpoTerm": "Fever",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0001945",
            "hpoTerm": "Fever",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0001945",
            "hpoTerm": "Fever",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:29207"
          },
          {
            "hpoId": "HP:0001945",
            "hpoTerm": "Fever",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0001945",
            "hpoTerm": "Fever",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:36426"
          },
          {
            "hpoId": "HP:0001288",
            "hpoTerm": "Gait disturbance",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0100758",
            "hpoTerm": "Gangrene",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0100758",
            "hpoTerm": "Gangrene",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0100758",
            "hpoTerm": "Gangrene",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0002239",
            "hpoTerm": "Gastrointestinal hemorrhage",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:36426"
          },
          {
            "hpoId": "HP:0002239",
            "hpoTerm": "Gastrointestinal hemorrhage",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0005244",
            "hpoTerm": "Gastrointestinal infarctions",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0005244",
            "hpoTerm": "Gastrointestinal infarctions",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0003249",
            "hpoTerm": "Genital ulcers",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0000099",
            "hpoTerm": "Glomerulonephritis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0100820",
            "hpoTerm": "Glomerulopathy",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0002315",
            "hpoTerm": "Headache",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0002315",
            "hpoTerm": "Headache",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0002315",
            "hpoTerm": "Headache",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0000365",
            "hpoTerm": "Hearing impairment",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0000790",
            "hpoTerm": "Hematuria",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0001269",
            "hpoTerm": "Hemiparesis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0002105",
            "hpoTerm": "Hemoptysis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0002105",
            "hpoTerm": "Hemoptysis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0001399",
            "hpoTerm": "Hepatic failure",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0008843",
            "hpoTerm": "Hip osteoarthritis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:106300"
          },
          {
            "hpoId": "HP:0011899",
            "hpoTerm": "Hyperfibrinogenemia",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0000975",
            "hpoTerm": "Hyperhidrosis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0000962",
            "hpoTerm": "Hyperkeratosis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:29207"
          },
          {
            "hpoId": "HP:0001347",
            "hpoTerm": "Hyperreflexia",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0000822",
            "hpoTerm": "Hypertension",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0100735",
            "hpoTerm": "Hypertensive crisis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0001960",
            "hpoTerm": "Hypokalemic metabolic alkalosis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:36426"
          },
          {
            "hpoId": "HP:0100326",
            "hpoTerm": "Immunologic hypersensitivity",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0005216",
            "hpoTerm": "Impaired mastication",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0030783",
            "hpoTerm": "Increased circulating interleukin 6 concentration",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0012649",
            "hpoTerm": "Increased inflammatory response",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0012649",
            "hpoTerm": "Increased inflammatory response",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0002516",
            "hpoTerm": "Increased intracranial pressure",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0002383",
            "hpoTerm": "Infectious encephalitis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0002037",
            "hpoTerm": "Inflammation of the large intestine",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:29207"
          },
          {
            "hpoId": "HP:0002037",
            "hpoTerm": "Inflammation of the large intestine",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:106300"
          },
          {
            "hpoId": "HP:0004417",
            "hpoTerm": "Intermittent claudication",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0001101",
            "hpoTerm": "Iritis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:29207"
          },
          {
            "hpoId": "HP:0000737",
            "hpoTerm": "Irritability",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0030164",
            "hpoTerm": "Jaw claudication",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0001387",
            "hpoTerm": "Joint stiffness",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0001387",
            "hpoTerm": "Joint stiffness",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:29207"
          },
          {
            "hpoId": "HP:0001386",
            "hpoTerm": "Joint swelling",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:29207"
          },
          {
            "hpoId": "HP:0001097",
            "hpoTerm": "Keratoconjunctivitis sicca",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0002808",
            "hpoTerm": "Kyphosis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:106300"
          },
          {
            "hpoId": "HP:0003419",
            "hpoTerm": "Low back pain",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:29207"
          },
          {
            "hpoId": "HP:0002716",
            "hpoTerm": "Lymphadenopathy",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0012733",
            "hpoTerm": "Macule",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:36426"
          },
          {
            "hpoId": "HP:0002024",
            "hpoTerm": "Malabsorption",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0033834",
            "hpoTerm": "Malaise",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0033834",
            "hpoTerm": "Malaise",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0100721",
            "hpoTerm": "Mediastinal lymphadenopathy",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0002354",
            "hpoTerm": "Memory impairment",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0001287",
            "hpoTerm": "Meningitis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0001287",
            "hpoTerm": "Meningitis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0002076",
            "hpoTerm": "Migraine",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0002076",
            "hpoTerm": "Migraine",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0001653",
            "hpoTerm": "Mitral regurgitation",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0001324",
            "hpoTerm": "Muscle weakness",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0001324",
            "hpoTerm": "Muscle weakness",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0003326",
            "hpoTerm": "Myalgia",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0003326",
            "hpoTerm": "Myalgia",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0003326",
            "hpoTerm": "Myalgia",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0001658",
            "hpoTerm": "Myocardial infarction",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:36426"
          },
          {
            "hpoId": "HP:0001658",
            "hpoTerm": "Myocardial infarction",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0001658",
            "hpoTerm": "Myocardial infarction",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0012819",
            "hpoTerm": "Myocarditis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0100614",
            "hpoTerm": "Myositis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0002017",
            "hpoTerm": "Nausea and vomiting",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:36426"
          },
          {
            "hpoId": "HP:0002017",
            "hpoTerm": "Nausea and vomiting",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0030166",
            "hpoTerm": "Night sweats",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0001426",
            "hpoTerm": "Non-Mendelian inheritance",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:106300"
          },
          {
            "hpoId": "HP:0033430",
            "hpoTerm": "Non-infectious meningitis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0007813",
            "hpoTerm": "Nongranulomatous uveitis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0031246",
            "hpoTerm": "Nonproductive cough",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0000639",
            "hpoTerm": "Nystagmus",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0040313",
            "hpoTerm": "Oligoarthritis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:106300"
          },
          {
            "hpoId": "HP:0000597",
            "hpoTerm": "Ophthalmoparesis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0000648",
            "hpoTerm": "Optic atrophy",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0100653",
            "hpoTerm": "Optic neuritis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0100796",
            "hpoTerm": "Orchitis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0002754",
            "hpoTerm": "Osteomyelitis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:29207"
          },
          {
            "hpoId": "HP:0001733",
            "hpoTerm": "Pancreatitis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:36426"
          },
          {
            "hpoId": "HP:0001733",
            "hpoTerm": "Pancreatitis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0012121",
            "hpoTerm": "Panuveitis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0200034",
            "hpoTerm": "Papule",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0003401",
            "hpoTerm": "Paresthesia",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0003401",
            "hpoTerm": "Paresthesia",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0001701",
            "hpoTerm": "Pericarditis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0001701",
            "hpoTerm": "Pericarditis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:29207"
          },
          {
            "hpoId": "HP:0001701",
            "hpoTerm": "Pericarditis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0009830",
            "hpoTerm": "Peripheral neuropathy",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0000613",
            "hpoTerm": "Photophobia",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0000613",
            "hpoTerm": "Photophobia",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:29207"
          },
          {
            "hpoId": "HP:0000613",
            "hpoTerm": "Photophobia",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:36426"
          },
          {
            "hpoId": "HP:0002202",
            "hpoTerm": "Pleural effusion",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0002102",
            "hpoTerm": "Pleuritis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0005764",
            "hpoTerm": "Polyarticular arthritis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0025532",
            "hpoTerm": "Positive pathergy test",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0003765",
            "hpoTerm": "Psoriasiform dermatitis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:106300"
          },
          {
            "hpoId": "HP:0000508",
            "hpoTerm": "Ptosis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0002092",
            "hpoTerm": "Pulmonary arterial hypertension",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0002204",
            "hpoTerm": "Pulmonary embolism",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0002206",
            "hpoTerm": "Pulmonary fibrosis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:29207"
          },
          {
            "hpoId": "HP:0002113",
            "hpoTerm": "Pulmonary infiltrates",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0200039",
            "hpoTerm": "Pustule",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:29207"
          },
          {
            "hpoId": "HP:0200039",
            "hpoTerm": "Pustule",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0001954",
            "hpoTerm": "Recurrent fever",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0100776",
            "hpoTerm": "Recurrent pharyngitis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0002205",
            "hpoTerm": "Recurrent respiratory infections",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:36426"
          },
          {
            "hpoId": "HP:0000010",
            "hpoTerm": "Recurrent urinary tract infections",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:29207"
          },
          {
            "hpoId": "HP:0004372",
            "hpoTerm": "Reduced consciousness",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0001920",
            "hpoTerm": "Renal artery stenosis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0000083",
            "hpoTerm": "Renal insufficiency",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0000083",
            "hpoTerm": "Renal insufficiency",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0000083",
            "hpoTerm": "Renal insufficiency",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:36426"
          },
          {
            "hpoId": "HP:0002093",
            "hpoTerm": "Respiratory insufficiency",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:29207"
          },
          {
            "hpoId": "HP:0002091",
            "hpoTerm": "Restrictive ventilatory defect",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:36426"
          },
          {
            "hpoId": "HP:0000488",
            "hpoTerm": "Retinopathy",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0000488",
            "hpoTerm": "Retinopathy",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0100654",
            "hpoTerm": "Retrobulbar optic neuritis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0002923",
            "hpoTerm": "Rheumatoid factor positive",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:106300"
          },
          {
            "hpoId": "HP:0012317",
            "hpoTerm": "Sacroiliac arthritis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:29207"
          },
          {
            "hpoId": "HP:0012317",
            "hpoTerm": "Sacroiliac arthritis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:106300"
          },
          {
            "hpoId": "HP:0100809",
            "hpoTerm": "Scalp tenderness",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0001250",
            "hpoTerm": "Seizure",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0001250",
            "hpoTerm": "Seizure",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0100806",
            "hpoTerm": "Sepsis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:36426"
          },
          {
            "hpoId": "HP:0000988",
            "hpoTerm": "Skin rash",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:29207"
          },
          {
            "hpoId": "HP:0200042",
            "hpoTerm": "Skin ulcer",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0200042",
            "hpoTerm": "Skin ulcer",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0001744",
            "hpoTerm": "Splenomegaly",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0001297",
            "hpoTerm": "Stroke",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0001482",
            "hpoTerm": "Subcutaneous nodule",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0001645",
            "hpoTerm": "Sudden cardiac death",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0001645",
            "hpoTerm": "Sudden cardiac death",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:36426"
          },
          {
            "hpoId": "HP:0002638",
            "hpoTerm": "Superficial thrombophlebitis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0001873",
            "hpoTerm": "Thrombocytopenia",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:36426"
          },
          {
            "hpoId": "HP:0002326",
            "hpoTerm": "Transient ischemic attack",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0500006",
            "hpoTerm": "Urethritis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:29207"
          },
          {
            "hpoId": "HP:0000554",
            "hpoTerm": "Uveitis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:29207"
          },
          {
            "hpoId": "HP:0002617",
            "hpoTerm": "Vascular dilatation",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0002633",
            "hpoTerm": "Vasculitis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0002633",
            "hpoTerm": "Vasculitis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0002633",
            "hpoTerm": "Vasculitis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0004936",
            "hpoTerm": "Venous thrombosis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0002321",
            "hpoTerm": "Vertigo",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0002321",
            "hpoTerm": "Vertigo",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0002321",
            "hpoTerm": "Vertigo",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0001123",
            "hpoTerm": "Visual field defect",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0002367",
            "hpoTerm": "Visual hallucination",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0000505",
            "hpoTerm": "Visual impairment",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0000505",
            "hpoTerm": "Visual impairment",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          },
          {
            "hpoId": "HP:0000505",
            "hpoTerm": "Visual impairment",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:36426"
          },
          {
            "hpoId": "HP:0000572",
            "hpoTerm": "Visual loss",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0001824",
            "hpoTerm": "Weight loss",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0001824",
            "hpoTerm": "Weight loss",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:117"
          },
          {
            "hpoId": "HP:0001824",
            "hpoTerm": "Weight loss",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:29207"
          },
          {
            "hpoId": "HP:0001824",
            "hpoTerm": "Weight loss",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:36426"
          },
          {
            "hpoId": "HP:0001824",
            "hpoTerm": "Weight loss",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
          }
        ]
      },
      {
        "gene": "HLA-DRB5",
        "profileMatch": "0 / 2 exact query HPO terms",
        "externalAnnotation": "external annotation shown when available",
        "cohortCarrierEvidence": "10 / 20 phenotype-matched samples carry rare HLA-DRB5 variants",
        "whyMatched": "CRDC recurrence among phenotype-matched samples",
        "hpoTerms": []
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

