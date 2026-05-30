const portalPhenotypeState = {
  "activeOutlierSample": "BCH-19-90796-01",
  "phenotype": {
    "query": {
      "display": "Narrow chest [HP:0000774] + Intellectual disability [HP:0001249] + Tremor [HP:0001337] + Progressive muscle weakness [HP:0003323]",
      "subtext": "4 test DB HPO query terms; runtime PheRS/GRS is not implemented in frontend"
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
        "value": "Narrow chest + Intellectual disability",
        "detail": "query HPO terms"
      }
    ],
    "queryTerms": {
      "exact": [
        {
          "label": "Progressive muscle weakness",
          "id": "HP:0003323",
          "reason": "Selected test DB query term"
        },
        {
          "label": "Tremor",
          "id": "HP:0001337",
          "reason": "Selected test DB query term"
        },
        {
          "label": "Intellectual disability",
          "id": "HP:0001249",
          "reason": "Selected test DB query term"
        },
        {
          "label": "Narrow chest",
          "id": "HP:0000774",
          "reason": "Selected test DB query term"
        }
      ],
      "expanded": [],
      "downWeighted": []
    },
    "matchedCohortSummary": {
      "sex": "Sex: 11 female · 9 male",
      "proband": "Proband status: 18 proband · 2 non-proband"
    },
    "ageBins": [
      {
        "label": "0-4",
        "female": 0,
        "male": 0,
        "femaleHeight": "0px",
        "maleHeight": "0px"
      },
      {
        "label": "5-9",
        "female": 0,
        "male": 4,
        "femaleHeight": "0px",
        "maleHeight": "35px"
      },
      {
        "label": "10-17",
        "female": 2,
        "male": 0,
        "femaleHeight": "18px",
        "maleHeight": "0px"
      },
      {
        "label": "18+",
        "female": 1,
        "male": 1,
        "femaleHeight": "12px",
        "maleHeight": "12px"
      },
      {
        "label": "Unknown",
        "female": 8,
        "male": 4,
        "femaleHeight": "70px",
        "maleHeight": "35px"
      }
    ],
    "topSamples": [
      {
        "rank": 1,
        "id": "BCH-19-90796-01",
        "group": "proband clinical_sequencing",
        "investigator": "clinical_sequencing",
        "proband": "Yes",
        "affected": "Yes",
        "sex": "female",
        "ageBand": "1-5",
        "ageAtEnrollment": null,
        "ageAtEnrollmentLabel": "-",
        "ageSource": "-",
        "sexAge": "female · 1-5",
        "diagnosed": "Yes",
        "diagnosedVariant": "",
        "queryTermsMatched": "2 / 4 query terms",
        "scoringTermsMatched": "not calculated in frontend fixture",
        "totalTerms": 127,
        "rawScore": "0.5",
        "expectedScore": "not calculated",
        "residual": "not calculated",
        "percentile": "not calculated",
        "equalOrHigher": "1 / 20",
        "signals": "ARMC9, OR2T33",
        "phenotypeProfile": [
          {
            "category": "Abnormality of the nervous system [HP:0000707]",
            "terms": "29 / 115 terms",
            "queryPhenotype": "Intellectual disability [HP:0001249] · Tremor [HP:0001337]",
            "phenotypeTerms": [
              "Intellectual disability [HP:0001249]",
              "Tremor [HP:0001337]",
              "Abnormal brain morphology [HP:0012443]",
              "Abnormal emotional state [HP:0100851]",
              "Abnormal nervous system morphology [HP:0012639]",
              "Abnormal nervous system physiology [HP:0012638]",
              "Abnormal social behavior [HP:0012433]",
              "Abnormal speech pattern [HP:0002167]",
              "Abnormality of mental function [HP:0011446]",
              "Abnormality of movement [HP:0100022]",
              "Absent speech [HP:0001344]",
              "Aggressive behavior [HP:0000718]",
              "Atypical behavior [HP:0000708]",
              "Autism [HP:0000717]",
              "Autistic behavior [HP:0000729]",
              "Delayed speech and language development [HP:0000750]",
              "Disinhibition [HP:0000734]",
              "Echolalia [HP:0010529]",
              "Fasciculations [HP:0002380]",
              "Global developmental delay [HP:0001263]",
              "Impairment in personality functioning [HP:0031466]",
              "Involuntary movements [HP:0004305]",
              "Irritability [HP:0000737]",
              "Loss of speech [HP:0002371]",
              "Morphological central nervous system abnormality [HP:0002011]",
              "Motor stereotypy [HP:0000733]",
              "Neurodevelopmental abnormality [HP:0012759]",
              "Neurodevelopmental delay [HP:0012758]",
              "Violent behavior [HP:0008760]"
            ]
          },
          {
            "category": "Abnormality of the eye [HP:0000478]",
            "terms": "23 / 115 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal anterior eye segment morphology [HP:0004328]",
              "Abnormal conjugate eye movement [HP:0000549]",
              "Abnormal eye morphology [HP:0012372]",
              "Abnormal eye physiology [HP:0012373]",
              "Abnormal pupil morphology [HP:0000615]",
              "Abnormality of eye movement [HP:0000496]",
              "Abnormality of globe location [HP:0100886]",
              "Abnormality of globe size [HP:0100887]",
              "Abnormality of vision [HP:0000504]",
              "Abnormally large globe [HP:0001090]",
              "Amblyopia [HP:0000646]",
              "Buphthalmos [HP:0000557]",
              "Deeply set eye [HP:0000490]",
              "Developmental glaucoma [HP:0001087]",
              "Exodeviation [HP:0020049]",
              "Exotropia [HP:0000577]",
              "Glaucoma [HP:0000501]",
              "Heterotropia [HP:0032012]",
              "Monocular strabismus [HP:0010877]",
              "Ocular anterior segment dysgenesis [HP:0007700]",
              "Reduced visual acuity [HP:0007663]",
              "Strabismus [HP:0000486]",
              "Visual impairment [HP:0000505]"
            ]
          },
          {
            "category": "Abnormality of the respiratory system [HP:0002086]",
            "terms": "14 / 115 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal breath sound [HP:0030829]",
              "Abnormal larynx morphology [HP:0025423]",
              "Abnormal lung morphology [HP:0002088]",
              "Abnormal respiratory system morphology [HP:0012252]",
              "Abnormal respiratory system physiology [HP:0002795]",
              "Abnormal tracheobronchial morphology [HP:0005607]",
              "Abnormality of the larynx [HP:0001600]",
              "Abnormality of the upper respiratory tract [HP:0002087]",
              "Bronchitis [HP:0012387]",
              "Cough [HP:0012735]",
              "Laryngomalacia [HP:0001601]",
              "Respiratory tract infection [HP:0011947]",
              "Stridor [HP:0010307]",
              "Wheezing [HP:0030828]"
            ]
          },
          {
            "category": "Abnormality of the immune system [HP:0002715]",
            "terms": "12 / 115 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal cellular immune system morphology [HP:0010987]",
              "Abnormal lymph node morphology [HP:0002733]",
              "Abnormality of immune system physiology [HP:0010978]",
              "Abnormality of the lymphatic system [HP:0100763]",
              "Allergy [HP:0012393]",
              "Bronchiolitis [HP:0011950]",
              "Immunologic hypersensitivity [HP:0100326]",
              "Recurrent acute respiratory tract infection [HP:0011948]",
              "Recurrent infections [HP:0002719]",
              "Recurrent respiratory infections [HP:0002205]",
              "Seasonal allergy [HP:0012395]",
              "Unusual infection [HP:0032101]"
            ]
          },
          {
            "category": "Abnormality of the musculoskeletal system [HP:0033127]",
            "terms": "8 / 115 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal axial skeleton morphology [HP:0009121]",
              "Abnormal sacrum morphology [HP:0005107]",
              "Abnormal skeletal morphology [HP:0011842]",
              "Abnormal thorax morphology [HP:0000765]",
              "Abnormality of connective tissue [HP:0003549]",
              "Abnormality of the skeletal system [HP:0000924]",
              "Abnormality of the vertebral column [HP:0000925]",
              "Sacrococcygeal pilonidal abnormality [HP:0010767]"
            ]
          },
          {
            "category": "Abnormality of the digestive system [HP:0025031]",
            "terms": "7 / 115 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abdominal symptom [HP:0011458]",
              "Abnormal abdomen morphology [HP:0001438]",
              "Abnormal intestine morphology [HP:0002242]",
              "Abnormal large intestine morphology [HP:0002250]",
              "Abnormality of digestive system physiology [HP:0025032]",
              "Abnormality of the gastrointestinal tract [HP:0011024]",
              "Constipation [HP:0002019]"
            ]
          },
          {
            "category": "Abnormality of head or neck [HP:0000152]",
            "terms": "6 / 115 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal facial expression [HP:0005346]",
              "Abnormal facial shape [HP:0001999]",
              "Abnormality of the face [HP:0000271]",
              "Abnormality of the head [HP:0000234]",
              "Abnormality of the neck [HP:0000464]",
              "Abnormality of the orbital region [HP:0000315]"
            ]
          },
          {
            "category": "Abnormality of the cardiovascular system [HP:0001626]",
            "terms": "6 / 115 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal cardiovascular system physiology [HP:0011025]",
              "Abnormal cerebral vascular morphology [HP:0100659]",
              "Abnormal heart sound [HP:0031657]",
              "Abnormality of the vasculature [HP:0002597]",
              "Heart murmur [HP:0030148]",
              "Stroke [HP:0001297]"
            ]
          },
          {
            "category": "Abnormality of the integument [HP:0001574]",
            "terms": "6 / 115 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal skin morphology [HP:0011121]",
              "Abnormality of the skin [HP:0000951]",
              "Dry skin [HP:0000958]",
              "Localized skin lesion [HP:0011355]",
              "Sacral dimple [HP:0000960]",
              "Skin dimple [HP:0010781]"
            ]
          },
          {
            "category": "Other phenotype terms",
            "terms": "3 / 115 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "HP:0000735 [HP:0000735]",
              "HP:0002109 [HP:0002109]",
              "HP:0006919 [HP:0006919]"
            ]
          },
          {
            "category": "Constitutional symptom [HP:0025142]",
            "terms": "1 / 115 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Fatigue [HP:0012378]"
            ]
          }
        ]
      },
      {
        "rank": 2,
        "id": "BCH-18-99096-01",
        "group": "proband annapurna_poduri",
        "investigator": "annapurna_poduri",
        "proband": "Yes",
        "affected": "Yes",
        "sex": "male",
        "ageBand": "6-11",
        "ageAtEnrollment": 7,
        "ageAtEnrollmentLabel": "7 years",
        "ageSource": "age_at_enrollment",
        "sexAge": "male · 6-11",
        "diagnosed": "Yes",
        "diagnosedVariant": "",
        "queryTermsMatched": "2 / 4 query terms",
        "scoringTermsMatched": "not calculated in frontend fixture",
        "totalTerms": 221,
        "rawScore": "0.5",
        "expectedScore": "not calculated",
        "residual": "not calculated",
        "percentile": "not calculated",
        "equalOrHigher": "2 / 20",
        "signals": "ARMC9, SLC6A7",
        "phenotypeProfile": [
          {
            "category": "Abnormality of the nervous system [HP:0000707]",
            "terms": "68 / 206 terms",
            "queryPhenotype": "Intellectual disability [HP:0001249] · Tremor [HP:0001337]",
            "phenotypeTerms": [
              "Intellectual disability [HP:0001249]",
              "Tremor [HP:0001337]",
              "Abnormal brain morphology [HP:0012443]",
              "Abnormal central motor function [HP:0011442]",
              "Abnormal cerebral cortex morphology [HP:0002538]",
              "Abnormal cerebral morphology [HP:0002060]",
              "Abnormal cerebral subcortex morphology [HP:0010993]",
              "Abnormal cerebral white matter morphology [HP:0002500]",
              "Abnormal corpus callosum morphology [HP:0001273]",
              "Abnormal forebrain morphology [HP:0100547]",
              "Abnormal nervous system electrophysiology [HP:0001311]",
              "Abnormal nervous system morphology [HP:0012639]",
              "Abnormal nervous system physiology [HP:0012638]",
              "Abnormal reflex [HP:0031826]",
              "Abnormal speech pattern [HP:0002167]",
              "Abnormality of central nervous system electrophysiology [HP:0030178]",
              "Abnormality of mental function [HP:0011446]",
              "Abnormality of movement [HP:0100022]",
              "Absent speech [HP:0001344]",
              "Aplasia/Hypoplasia involving the central nervous system [HP:0002977]",
              "Aplasia/Hypoplasia of the cerebrum [HP:0007364]",
              "Aplasia/Hypoplasia of the corpus callosum [HP:0007370]",
              "Atrophy/Degeneration affecting the central nervous system [HP:0007367]",
              "Atypical behavior [HP:0000708]",
              "Brain atrophy [HP:0012444]",
              "Brisk reflexes [HP:0001348]",
              "Cerebral palsy [HP:0100021]",
              "Chorea [HP:0002072]",
              "Choreoathetosis [HP:0001266]",
              "Clonus [HP:0002169]",
              "Delayed fine motor development [HP:0010862]",
              "Delayed gross motor development [HP:0002194]",
              "Delayed speech and language development [HP:0000750]",
              "EEG abnormality [HP:0002353]",
              "Encephalopathy [HP:0001298]",
              "Epileptic encephalopathy [HP:0200134]",
              "Epileptic spasm [HP:0011097]",
              "Generalized myoclonic seizure [HP:0002123]",
              "Generalized tonic seizure [HP:0010818]",
              "Generalized-onset motor seizure [HP:0032677]",
              "Generalized-onset seizure [HP:0002197]",
              "Global developmental delay [HP:0001263]",
              "Hyperkinetic movements [HP:0002487]",
              "Hyperreflexia [HP:0001347]",
              "Hypoplasia of the corpus callosum [HP:0002079]",
              "Infantile spasms [HP:0012469]",
              "Involuntary movements [HP:0004305]",
              "Limb myoclonus [HP:0045084]",
              "Loss of speech [HP:0002371]",
              "Morphological central nervous system abnormality [HP:0002011]",
              "Motor delay [HP:0001270]",
              "Motor seizure [HP:0020219]",
              "Myoclonic seizure [HP:0032794]",
              "Myoclonus [HP:0001336]",
              "Neurodevelopmental abnormality [HP:0012759]",
              "Neurodevelopmental delay [HP:0012758]",
              "Seizure [HP:0001250]",
              "Sleep apnea [HP:0010535]",
              "Sleep disturbance [HP:0002360]",
              "Snoring [HP:0025267]",
              "Spastic tetraplegia [HP:0002510]",
              "Spasticity [HP:0001257]",
              "Status epilepticus [HP:0002133]",
              "Tetraplegia [HP:0002445]",
              "Tetraplegia/tetraparesis [HP:0030182]",
              "Tonic seizure [HP:0032792]",
              "Upper motor neuron dysfunction [HP:0002493]",
              "Weakness due to upper motor neuron dysfunction [HP:0010549]"
            ]
          },
          {
            "category": "Abnormality of head or neck [HP:0000152]",
            "terms": "22 / 206 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal conjunctiva morphology [HP:0000502]",
              "Abnormal nasal cavity morphology [HP:0010640]",
              "Abnormal nasal mucosa morphology [HP:0000433]",
              "Abnormal ocular adnexa morphology [HP:0030669]",
              "Abnormal oral cavity morphology [HP:0000163]",
              "Abnormal oral physiology [HP:0031815]",
              "Abnormal salivary gland morphology [HP:0010286]",
              "Abnormal skull morphology [HP:0000929]",
              "Abnormality of salivation [HP:0100755]",
              "Abnormality of skull size [HP:0000240]",
              "Abnormality of the face [HP:0000271]",
              "Abnormality of the head [HP:0000234]",
              "Abnormality of the mouth [HP:0000153]",
              "Abnormality of the nose [HP:0000366]",
              "Abnormality of the ocular adnexa [HP:0032039]",
              "Abnormality of the orbital region [HP:0000315]",
              "Decreased head circumference [HP:0040195]",
              "Drooling [HP:0002307]",
              "Excessive salivation [HP:0003781]",
              "Microcephaly [HP:0000252]",
              "Nasal congestion [HP:0001742]",
              "Rhinitis [HP:0012384]"
            ]
          },
          {
            "category": "Abnormality of the respiratory system [HP:0002086]",
            "terms": "19 / 206 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal blood gas level [HP:0012415]",
              "Abnormal blood oxygen level [HP:0500165]",
              "Abnormal lung morphology [HP:0002088]",
              "Abnormal pattern of respiration [HP:0002793]",
              "Abnormal respiratory system morphology [HP:0012252]",
              "Abnormal respiratory system physiology [HP:0002795]",
              "Abnormality of the upper respiratory tract [HP:0002087]",
              "Apnea [HP:0002104]",
              "Aspiration [HP:0002835]",
              "Asthma [HP:0002099]",
              "Chronic lung disease [HP:0006528]",
              "Cough [HP:0012735]",
              "Hyperventilation [HP:0002883]",
              "Hypoxemia [HP:0012418]",
              "Pneumothorax [HP:0002107]",
              "Respiratory failure [HP:0002878]",
              "Respiratory insufficiency [HP:0002093]",
              "Respiratory tract infection [HP:0011947]",
              "Tachypnea [HP:0002789]"
            ]
          },
          {
            "category": "Abnormality of the musculoskeletal system [HP:0033127]",
            "terms": "16 / 206 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal axial skeleton morphology [HP:0009121]",
              "Abnormal curvature of the vertebral column [HP:0010674]",
              "Abnormal joint morphology [HP:0001367]",
              "Abnormal muscle physiology [HP:0011804]",
              "Abnormal muscle tone [HP:0003808]",
              "Abnormal skeletal morphology [HP:0011842]",
              "Abnormal thorax morphology [HP:0000765]",
              "Abnormality of connective tissue [HP:0003549]",
              "Abnormality of the musculature [HP:0003011]",
              "Abnormality of the skeletal system [HP:0000924]",
              "Abnormality of the vertebral column [HP:0000925]",
              "Generalized hypotonia [HP:0001290]",
              "Hypertonia [HP:0001276]",
              "Hypotonia [HP:0001252]",
              "Neuropathic spinal arthropathy [HP:0008443]",
              "Scoliosis [HP:0002650]"
            ]
          },
          {
            "category": "Abnormality of the eye [HP:0000478]",
            "terms": "14 / 206 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal anterior eye segment morphology [HP:0004328]",
              "Abnormal eye morphology [HP:0012372]",
              "Abnormal eye physiology [HP:0012373]",
              "Abnormal involuntary eye movements [HP:0012547]",
              "Abnormality of eye movement [HP:0000496]",
              "Abnormality of vision [HP:0000504]",
              "Blindness [HP:0000618]",
              "Cerebral visual impairment [HP:0100704]",
              "Conjunctivitis [HP:0000509]",
              "Horizontal nystagmus [HP:0000666]",
              "Inflammatory abnormality of the eye [HP:0100533]",
              "Nystagmus [HP:0000639]",
              "Reduced visual acuity [HP:0007663]",
              "Visual impairment [HP:0000505]"
            ]
          },
          {
            "category": "Abnormality of the genitourinary system [HP:0000119]",
            "terms": "13 / 206 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal external genitalia morphology [HP:0000811]",
              "Abnormal male external genitalia morphology [HP:0000032]",
              "Abnormal reproductive system morphology [HP:0012243]",
              "Abnormal testis morphology [HP:0000035]",
              "Abnormality of the bladder [HP:0000014]",
              "Abnormality of the genital system [HP:0000078]",
              "Abnormality of the lower urinary tract [HP:0010936]",
              "Abnormality of the male genitalia [HP:0010461]",
              "Abnormality of the urinary system [HP:0000079]",
              "Cryptorchidism [HP:0000028]",
              "Functional abnormality of the bladder [HP:0000009]",
              "Neurogenic bladder [HP:0000011]",
              "Urinary retention [HP:0000016]"
            ]
          },
          {
            "category": "Abnormality of the immune system [HP:0002715]",
            "terms": "13 / 206 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal inflammatory response [HP:0012647]",
              "Abnormality of immune system physiology [HP:0010978]",
              "Allergic conjunctivitis [HP:0007879]",
              "Allergic rhinitis [HP:0003193]",
              "Allergy [HP:0012393]",
              "Immunologic hypersensitivity [HP:0100326]",
              "Increased inflammatory response [HP:0012649]",
              "Pneumonia [HP:0002090]",
              "Recurrent infections [HP:0002719]",
              "Recurrent lower respiratory tract infections [HP:0002783]",
              "Recurrent pneumonia [HP:0006532]",
              "Recurrent respiratory infections [HP:0002205]",
              "Unusual infection [HP:0032101]"
            ]
          },
          {
            "category": "Abnormality of the cardiovascular system [HP:0001626]",
            "terms": "11 / 206 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal cardiovascular system physiology [HP:0011025]",
              "Abnormal venous morphology [HP:0002624]",
              "Abnormality of cardiovascular system electrophysiology [HP:0030956]",
              "Abnormality of the vasculature [HP:0002597]",
              "Abnormality of the vasculature of the eye [HP:0008047]",
              "Arrhythmia [HP:0011675]",
              "Erythema [HP:0010783]",
              "Facial erythema [HP:0001041]",
              "Red eye [HP:0025337]",
              "Tachycardia [HP:0001649]",
              "Vascular skin abnormality [HP:0011276]"
            ]
          },
          {
            "category": "Abnormality of the digestive system [HP:0025031]",
            "terms": "9 / 206 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abdominal symptom [HP:0011458]",
              "Abnormal abdomen morphology [HP:0001438]",
              "Abnormal intestine morphology [HP:0002242]",
              "Abnormal large intestine morphology [HP:0002250]",
              "Abnormality of digestive system physiology [HP:0025032]",
              "Abnormality of the gastrointestinal tract [HP:0011024]",
              "Constipation [HP:0002019]",
              "Feeding difficulties [HP:0011968]",
              "Vomiting [HP:0002013]"
            ]
          },
          {
            "category": "Abnormality of metabolism/homeostasis [HP:0001939]",
            "terms": "6 / 206 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal circulating cholesterol concentration [HP:0003107]",
              "Abnormal circulating lipid concentration [HP:0003119]",
              "Abnormal circulating metabolite concentration [HP:0032180]",
              "Fever [HP:0001945]",
              "Hypercholesterolemia [HP:0003124]",
              "Hyperlipidemia [HP:0003077]"
            ]
          },
          {
            "category": "Abnormality of the integument [HP:0001574]",
            "terms": "6 / 206 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal skin morphology [HP:0011121]",
              "Abnormality of skin physiology [HP:0011122]",
              "Abnormality of the skin [HP:0000951]",
              "Generalized abnormality of skin [HP:0011354]",
              "Inflammatory abnormality of the skin [HP:0011123]",
              "Skin rash [HP:0000988]"
            ]
          },
          {
            "category": "Abnormality of limbs [HP:0040064]",
            "terms": "5 / 206 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal limb bone morphology [HP:0002813]",
              "Abnormality of lower limb joint [HP:0100491]",
              "Abnormality of the ankle [HP:0003028]",
              "Abnormality of the lower limb [HP:0002814]",
              "Ankle clonus [HP:0011448]"
            ]
          },
          {
            "category": "Abnormality of blood and blood-forming tissues [HP:0001871]",
            "terms": "3 / 206 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal thrombosis [HP:0001977]",
              "Deep venous thrombosis [HP:0002625]",
              "Venous thrombosis [HP:0004936]"
            ]
          },
          {
            "category": "Constitutional symptom [HP:0025142]",
            "terms": "1 / 206 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Pain [HP:0012531]"
            ]
          }
        ]
      },
      {
        "rank": 3,
        "id": "AU1605a",
        "group": "non-proband chris_walsh",
        "investigator": "chris_walsh",
        "proband": "No",
        "affected": "Yes",
        "sex": "male",
        "ageBand": "-",
        "ageAtEnrollment": null,
        "ageAtEnrollmentLabel": "-",
        "ageSource": "-",
        "sexAge": "male · -",
        "diagnosed": "No",
        "diagnosedVariant": "",
        "queryTermsMatched": "1 / 4 query terms",
        "scoringTermsMatched": "not calculated in frontend fixture",
        "totalTerms": 51,
        "rawScore": "0.25",
        "expectedScore": "not calculated",
        "residual": "not calculated",
        "percentile": "not calculated",
        "equalOrHigher": "3 / 20",
        "signals": "ARMC9, LUZP1",
        "phenotypeProfile": [
          {
            "category": "Abnormality of the nervous system [HP:0000707]",
            "terms": "17 / 44 terms",
            "queryPhenotype": "Intellectual disability [HP:0001249]",
            "phenotypeTerms": [
              "Intellectual disability [HP:0001249]",
              "Abnormal nervous system physiology [HP:0012638]",
              "Abnormal social behavior [HP:0012433]",
              "Abnormality of mental function [HP:0011446]",
              "Atypical behavior [HP:0000708]",
              "Delayed early-childhood social milestone development [HP:0012434]",
              "Delayed fine motor development [HP:0010862]",
              "Delayed gross motor development [HP:0002194]",
              "Delayed speech and language development [HP:0000750]",
              "Expressive language delay [HP:0002474]",
              "Global developmental delay [HP:0001263]",
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
            "terms": "14 / 44 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal digit morphology [HP:0011297]",
              "Abnormal finger morphology [HP:0001167]",
              "Abnormal hand morphology [HP:0005922]",
              "Abnormal limb bone morphology [HP:0002813]",
              "Abnormality of limb bone [HP:0040068]",
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
            "terms": "7 / 44 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal oral cavity morphology [HP:0000163]",
              "Abnormal oral morphology [HP:0031816]",
              "Abnormal palate morphology [HP:0000174]",
              "Abnormality of the face [HP:0000271]",
              "Abnormality of the head [HP:0000234]",
              "Abnormality of the mouth [HP:0000153]",
              "High palate [HP:0000218]"
            ]
          },
          {
            "category": "Abnormality of the musculoskeletal system [HP:0033127]",
            "terms": "4 / 44 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal appendicular skeleton morphology [HP:0011844]",
              "Abnormal skeletal morphology [HP:0011842]",
              "Abnormality of the skeletal system [HP:0000924]",
              "Aplasia/hypoplasia involving the skeleton [HP:0009115]"
            ]
          },
          {
            "category": "Abnormality of prenatal development or birth [HP:0001197]",
            "terms": "2 / 44 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal delivery [HP:0001787]",
              "Nuchal cord [HP:0012498]"
            ]
          }
        ]
      },
      {
        "rank": 4,
        "id": "BCH-21-78200-03",
        "group": "non-proband clinical_sequencing",
        "investigator": "clinical_sequencing",
        "proband": "No",
        "affected": "No",
        "sex": "male",
        "ageBand": "18+",
        "ageAtEnrollment": null,
        "ageAtEnrollmentLabel": "-",
        "ageSource": "-",
        "sexAge": "male · 18+",
        "diagnosed": "Yes",
        "diagnosedVariant": "",
        "queryTermsMatched": "1 / 4 query terms",
        "scoringTermsMatched": "not calculated in frontend fixture",
        "totalTerms": 58,
        "rawScore": "0.25",
        "expectedScore": "not calculated",
        "residual": "not calculated",
        "percentile": "not calculated",
        "equalOrHigher": "4 / 20",
        "signals": "ARMC9, LUZP1",
        "phenotypeProfile": [
          {
            "category": "Abnormality of the nervous system [HP:0000707]",
            "terms": "31 / 51 terms",
            "queryPhenotype": "Tremor [HP:0001337]",
            "phenotypeTerms": [
              "Tremor [HP:0001337]",
              "Abnormal brain morphology [HP:0012443]",
              "Abnormal central motor function [HP:0011442]",
              "Abnormal cerebral morphology [HP:0002060]",
              "Abnormal emotional state [HP:0100851]",
              "Abnormal forebrain morphology [HP:0100547]",
              "Abnormal nervous system morphology [HP:0012639]",
              "Abnormal nervous system physiology [HP:0012638]",
              "Abnormal speech pattern [HP:0002167]",
              "Abnormality of coordination [HP:0011443]",
              "Abnormality of mental function [HP:0011446]",
              "Abnormality of movement [HP:0100022]",
              "Absent speech [HP:0001344]",
              "Aggressive behavior [HP:0000718]",
              "Anxiety [HP:0000739]",
              "Aplasia/Hypoplasia involving the central nervous system [HP:0002977]",
              "Aplasia/Hypoplasia of the cerebrum [HP:0007364]",
              "Ataxia [HP:0001251]",
              "Atypical behavior [HP:0000708]",
              "Cognitive impairment [HP:0100543]",
              "Delayed speech and language development [HP:0000750]",
              "Dyssynergia [HP:0010867]",
              "Global developmental delay [HP:0001263]",
              "Hyperactivity [HP:0000752]",
              "Involuntary movements [HP:0004305]",
              "Morphological central nervous system abnormality [HP:0002011]",
              "Neurodevelopmental abnormality [HP:0012759]",
              "Neurodevelopmental delay [HP:0012758]",
              "Seizure [HP:0001250]",
              "Sleep disturbance [HP:0002360]",
              "Specific learning disability [HP:0001328]"
            ]
          },
          {
            "category": "Abnormality of the digestive system [HP:0025031]",
            "terms": "7 / 51 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abdominal symptom [HP:0011458]",
              "Abnormal esophagus physiology [HP:0025270]",
              "Abnormality of digestive system physiology [HP:0025032]",
              "Abnormality of the gastrointestinal tract [HP:0011024]",
              "Constipation [HP:0002019]",
              "Functional abnormality of the gastrointestinal tract [HP:0012719]",
              "Gastroesophageal reflux [HP:0002020]"
            ]
          },
          {
            "category": "Abnormality of head or neck [HP:0000152]",
            "terms": "5 / 51 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal skull morphology [HP:0000929]",
              "Abnormality of skull size [HP:0000240]",
              "Abnormality of the head [HP:0000234]",
              "Decreased head circumference [HP:0040195]",
              "Microcephaly [HP:0000252]"
            ]
          },
          {
            "category": "Abnormality of the eye [HP:0000478]",
            "terms": "4 / 51 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal conjugate eye movement [HP:0000549]",
              "Abnormal eye physiology [HP:0012373]",
              "Abnormality of eye movement [HP:0000496]",
              "Strabismus [HP:0000486]"
            ]
          },
          {
            "category": "Abnormality of the musculoskeletal system [HP:0033127]",
            "terms": "3 / 51 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal axial skeleton morphology [HP:0009121]",
              "Abnormal skeletal morphology [HP:0011842]",
              "Abnormality of the skeletal system [HP:0000924]"
            ]
          },
          {
            "category": "Other phenotype terms",
            "terms": "1 / 51 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "HP:0006919 [HP:0006919]"
            ]
          }
        ]
      },
      {
        "rank": 5,
        "id": "BCH-22-65666-01",
        "group": "proband chris_walsh",
        "investigator": "chris_walsh",
        "proband": "Yes",
        "affected": "Yes",
        "sex": "female",
        "ageBand": "12-17",
        "ageAtEnrollment": 16,
        "ageAtEnrollmentLabel": "16 years",
        "ageSource": "age_at_enrollment",
        "sexAge": "female · 12-17",
        "diagnosed": "No",
        "diagnosedVariant": "",
        "queryTermsMatched": "1 / 4 query terms",
        "scoringTermsMatched": "not calculated in frontend fixture",
        "totalTerms": 60,
        "rawScore": "0.25",
        "expectedScore": "not calculated",
        "residual": "not calculated",
        "percentile": "not calculated",
        "equalOrHigher": "5 / 20",
        "signals": "ARMC9, LUZP1",
        "phenotypeProfile": [
          {
            "category": "Abnormality of the nervous system [HP:0000707]",
            "terms": "24 / 51 terms",
            "queryPhenotype": "Tremor [HP:0001337]",
            "phenotypeTerms": [
              "Tremor [HP:0001337]",
              "Abnormal brain morphology [HP:0012443]",
              "Abnormal cerebral morphology [HP:0002060]",
              "Abnormal nervous system morphology [HP:0012639]",
              "Abnormal nervous system physiology [HP:0012638]",
              "Abnormality of movement [HP:0100022]",
              "Abnormality of neuronal migration [HP:0002269]",
              "Atypical behavior [HP:0000708]",
              "Congenital encephalopathy [HP:0007239]",
              "Dialeptic seizure [HP:0011146]",
              "Encephalopathy [HP:0001298]",
              "Epileptic encephalopathy [HP:0200134]",
              "Focal impaired awareness seizure [HP:0002384]",
              "Focal-onset seizure [HP:0007359]",
              "Generalized-onset seizure [HP:0002197]",
              "Global developmental delay [HP:0001263]",
              "Gray matter heterotopia [HP:0002282]",
              "Involuntary movements [HP:0004305]",
              "Morphological central nervous system abnormality [HP:0002011]",
              "Muscle fibrillation [HP:0010546]",
              "Myoclonus [HP:0001336]",
              "Neurodevelopmental abnormality [HP:0012759]",
              "Neurodevelopmental delay [HP:0012758]",
              "Seizure [HP:0001250]"
            ]
          },
          {
            "category": "Abnormality of the digestive system [HP:0025031]",
            "terms": "8 / 51 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abdominal symptom [HP:0011458]",
              "Abnormal abdomen morphology [HP:0001438]",
              "Abnormal intestine morphology [HP:0002242]",
              "Abnormal large intestine morphology [HP:0002250]",
              "Abnormality of digestive system physiology [HP:0025032]",
              "Abnormality of the gastrointestinal tract [HP:0011024]",
              "Constipation [HP:0002019]",
              "Vomiting [HP:0002013]"
            ]
          },
          {
            "category": "Abnormality of the musculoskeletal system [HP:0033127]",
            "terms": "7 / 51 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal axial skeleton morphology [HP:0009121]",
              "Abnormal curvature of the vertebral column [HP:0010674]",
              "Abnormal skeletal morphology [HP:0011842]",
              "Abnormality of the skeletal system [HP:0000924]",
              "Abnormality of the vertebral column [HP:0000925]",
              "Neuropathic spinal arthropathy [HP:0008443]",
              "Scoliosis [HP:0002650]"
            ]
          },
          {
            "category": "Abnormality of the eye [HP:0000478]",
            "terms": "6 / 51 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal eye physiology [HP:0012373]",
              "Abnormality of vision [HP:0000504]",
              "Hemianopia [HP:0012377]",
              "Homonymous hemianopia [HP:0030516]",
              "Visual field defect [HP:0001123]",
              "Visual impairment [HP:0000505]"
            ]
          },
          {
            "category": "Constitutional symptom [HP:0025142]",
            "terms": "2 / 51 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abdominal pain [HP:0002027]",
              "Pain [HP:0012531]"
            ]
          },
          {
            "category": "Abnormality of head or neck [HP:0000152]",
            "terms": "1 / 51 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormality of the head [HP:0000234]"
            ]
          },
          {
            "category": "Abnormality of metabolism/homeostasis [HP:0001939]",
            "terms": "1 / 51 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Fever [HP:0001945]"
            ]
          },
          {
            "category": "Abnormality of the immune system [HP:0002715]",
            "terms": "1 / 51 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Allergy [HP:0012393]"
            ]
          },
          {
            "category": "Abnormality of the integument [HP:0001574]",
            "terms": "1 / 51 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormality of the skin [HP:0000951]"
            ]
          }
        ]
      },
      {
        "rank": 6,
        "id": "BCH-23-47305-01",
        "group": "proband clinical_sequencing",
        "investigator": "clinical_sequencing",
        "proband": "Yes",
        "affected": "Yes",
        "sex": "female",
        "ageBand": "6-11",
        "ageAtEnrollment": null,
        "ageAtEnrollmentLabel": "-",
        "ageSource": "-",
        "sexAge": "female · 6-11",
        "diagnosed": "Yes",
        "diagnosedVariant": "",
        "queryTermsMatched": "1 / 4 query terms",
        "scoringTermsMatched": "not calculated in frontend fixture",
        "totalTerms": 79,
        "rawScore": "0.25",
        "expectedScore": "not calculated",
        "residual": "not calculated",
        "percentile": "not calculated",
        "equalOrHigher": "6 / 20",
        "signals": "ARMC9, LUZP1",
        "phenotypeProfile": [
          {
            "category": "Abnormality of the nervous system [HP:0000707]",
            "terms": "42 / 69 terms",
            "queryPhenotype": "Intellectual disability [HP:0001249]",
            "phenotypeTerms": [
              "Intellectual disability [HP:0001249]",
              "Abnormal brain morphology [HP:0012443]",
              "Abnormal central motor function [HP:0011442]",
              "Abnormal cerebral morphology [HP:0002060]",
              "Abnormal nervous system electrophysiology [HP:0001311]",
              "Abnormal nervous system morphology [HP:0012639]",
              "Abnormal nervous system physiology [HP:0012638]",
              "Abnormality of central nervous system electrophysiology [HP:0030178]",
              "Abnormality of coordination [HP:0011443]",
              "Abnormality of mental function [HP:0011446]",
              "Abnormality of movement [HP:0100022]",
              "Ataxia [HP:0001251]",
              "Atypical behavior [HP:0000708]",
              "Bilateral tonic-clonic seizure [HP:0002069]",
              "Bilateral tonic-clonic seizure with focal onset [HP:0007334]",
              "Borderline intellectual disability [HP:0006889]",
              "Cognitive impairment [HP:0100543]",
              "Convulsive status epilepticus [HP:0032660]",
              "Delayed speech and language development [HP:0000750]",
              "Dialeptic seizure [HP:0011146]",
              "EEG abnormality [HP:0002353]",
              "Encephalopathy [HP:0001298]",
              "Epileptic encephalopathy [HP:0200134]",
              "Focal-onset seizure [HP:0007359]",
              "Generalized non-motor (absence) seizure [HP:0002121]",
              "Generalized-onset seizure [HP:0002197]",
              "Global developmental delay [HP:0001263]",
              "Headache [HP:0002315]",
              "Language impairment [HP:0002463]",
              "Memory impairment [HP:0002354]",
              "Morphological central nervous system abnormality [HP:0002011]",
              "Neurodevelopmental abnormality [HP:0012759]",
              "Neurodevelopmental delay [HP:0012758]",
              "Nocturnal seizures [HP:0031951]",
              "Non-motor seizure [HP:0033259]",
              "Postural instability [HP:0002172]",
              "Reduced consciousness [HP:0004372]",
              "Seizure [HP:0001250]",
              "Specific learning disability [HP:0001328]",
              "Status epilepticus [HP:0002133]",
              "Status epilepticus with prominent motor symptoms [HP:0032658]",
              "Status epilepticus without prominent motor symptoms [HP:0031475]"
            ]
          },
          {
            "category": "Abnormality of metabolism/homeostasis [HP:0001939]",
            "terms": "9 / 69 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal blood urea nitrogen concentration [HP:0031970]",
              "Abnormal circulating enzyme concentration or activity [HP:0012379]",
              "Abnormal circulating metabolite concentration [HP:0032180]",
              "Abnormal circulating nitrogen compound concentration [HP:0004364]",
              "Abnormal total iron binding capacity [HP:0033212]",
              "Abnormality of alkaline phosphatase level [HP:0004379]",
              "Azotemia [HP:0002157]",
              "Elevated circulating alkaline phosphatase concentration [HP:0003155]",
              "Increased blood urea nitrogen [HP:0003138]"
            ]
          },
          {
            "category": "Abnormality of the genitourinary system [HP:0000119]",
            "terms": "6 / 69 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormality of the bladder [HP:0000014]",
              "Abnormality of the lower urinary tract [HP:0010936]",
              "Abnormality of the urinary system [HP:0000079]",
              "Enuresis [HP:0000805]",
              "Enuresis nocturna [HP:0010677]",
              "Functional abnormality of the bladder [HP:0000009]"
            ]
          },
          {
            "category": "Constitutional symptom [HP:0025142]",
            "terms": "4 / 69 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Fatigue [HP:0012378]",
              "Impaired continence [HP:0031064]",
              "Impairment of activities of daily living [HP:0031058]",
              "Pain [HP:0012531]"
            ]
          },
          {
            "category": "Abnormality of the digestive system [HP:0025031]",
            "terms": "2 / 69 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormality of the gastrointestinal tract [HP:0011024]",
              "Vomiting [HP:0002013]"
            ]
          },
          {
            "category": "Abnormality of the eye [HP:0000478]",
            "terms": "2 / 69 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormal eye physiology [HP:0012373]",
              "Staring gaze [HP:0025401]"
            ]
          },
          {
            "category": "Growth abnormality [HP:0001507]",
            "terms": "2 / 69 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormality of body weight [HP:0004323]",
              "Increased body weight [HP:0004324]"
            ]
          },
          {
            "category": "Abnormality of head or neck [HP:0000152]",
            "terms": "1 / 69 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Abnormality of the head [HP:0000234]"
            ]
          },
          {
            "category": "Abnormality of the immune system [HP:0002715]",
            "terms": "1 / 69 terms",
            "queryPhenotype": "—",
            "phenotypeTerms": [
              "Allergy [HP:0012393]"
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
          "HLA-B",
          "SLC6A7"
        ],
        "samples": [
          "BCH-19-90796-01",
          "BCH-18-99096-01"
        ],
        "orpha": [
          "Atypical Rett syndrome",
          "SLC35A2-CDG"
        ]
      },
      {
        "label": "Abnormality of the head [HP:0000234]",
        "domain": "co-observed in matched CRDC samples",
        "cluster": "test DB co-observed HPO term",
        "count": "20 / 20",
        "score": "frequency in matched set",
        "width": "100%",
        "relatedGenes": [
          "ARMC9",
          "HLA-B",
          "SLC6A7"
        ],
        "samples": [
          "BCH-19-90796-01",
          "BCH-18-99096-01"
        ],
        "orpha": [
          "Atypical Rett syndrome",
          "SLC35A2-CDG"
        ]
      },
      {
        "label": "Abnormality of the nervous system [HP:0000707]",
        "domain": "co-observed in matched CRDC samples",
        "cluster": "test DB co-observed HPO term",
        "count": "20 / 20",
        "score": "frequency in matched set",
        "width": "100%",
        "relatedGenes": [
          "ARMC9",
          "HLA-B",
          "SLC6A7"
        ],
        "samples": [
          "BCH-19-90796-01",
          "BCH-18-99096-01"
        ],
        "orpha": [
          "Atypical Rett syndrome",
          "SLC35A2-CDG"
        ]
      },
      {
        "label": "Abnormal nervous system physiology [HP:0012638]",
        "domain": "co-observed in matched CRDC samples",
        "cluster": "test DB co-observed HPO term",
        "count": "20 / 20",
        "score": "frequency in matched set",
        "width": "100%",
        "relatedGenes": [
          "ARMC9",
          "HLA-B",
          "SLC6A7"
        ],
        "samples": [
          "BCH-19-90796-01",
          "BCH-18-99096-01"
        ],
        "orpha": [
          "Atypical Rett syndrome",
          "SLC35A2-CDG"
        ]
      },
      {
        "label": "Atypical behavior [HP:0000708]",
        "domain": "co-observed in matched CRDC samples",
        "cluster": "test DB co-observed HPO term",
        "count": "19 / 20",
        "score": "frequency in matched set",
        "width": "95%",
        "relatedGenes": [
          "ARMC9",
          "HLA-B",
          "SLC6A7"
        ],
        "samples": [
          "BCH-19-90796-01",
          "BCH-18-99096-01"
        ],
        "orpha": [
          "Atypical Rett syndrome",
          "SLC35A2-CDG"
        ]
      },
      {
        "label": "Abnormality of movement [HP:0100022]",
        "domain": "co-observed in matched CRDC samples",
        "cluster": "test DB co-observed HPO term",
        "count": "19 / 20",
        "score": "frequency in matched set",
        "width": "95%",
        "relatedGenes": [
          "ARMC9",
          "HLA-B",
          "SLC6A7"
        ],
        "samples": [
          "BCH-19-90796-01",
          "BCH-18-99096-01"
        ],
        "orpha": [
          "Atypical Rett syndrome",
          "SLC35A2-CDG"
        ]
      },
      {
        "label": "Involuntary movements [HP:0004305]",
        "domain": "co-observed in matched CRDC samples",
        "cluster": "test DB co-observed HPO term",
        "count": "17 / 20",
        "score": "frequency in matched set",
        "width": "85%",
        "relatedGenes": [
          "ARMC9",
          "HLA-B",
          "SLC6A7"
        ],
        "samples": [
          "BCH-19-90796-01",
          "BCH-18-99096-01"
        ],
        "orpha": [
          "Atypical Rett syndrome",
          "SLC35A2-CDG"
        ]
      },
      {
        "label": "Allergy [HP:0012393]",
        "domain": "co-observed in matched CRDC samples",
        "cluster": "test DB co-observed HPO term",
        "count": "17 / 20",
        "score": "frequency in matched set",
        "width": "85%",
        "relatedGenes": [
          "ARMC9",
          "HLA-B",
          "SLC6A7"
        ],
        "samples": [
          "BCH-19-90796-01",
          "BCH-18-99096-01"
        ],
        "orpha": [
          "Atypical Rett syndrome",
          "SLC35A2-CDG"
        ]
      }
    ],
    "diseaseCandidates": [
      {
        "disease": "Atypical Rett syndrome",
        "diseaseId": "Orpha_3095",
        "source": "Orphapacket",
        "profileMatch": "6.22 profile score · 18 / 54 disease HPO terms",
        "externalAnnotation": "Atypical Rett syndrome · Orphapacket",
        "crdcEvidence": "19 / 20 phenotype-matched samples",
        "whyMatched": "input HPO profile overlaps external disease-HPO profile",
        "linkedGenes": [
          "ARMC9",
          "HLA-B",
          "SLC6A7"
        ]
      },
      {
        "disease": "SLC35A2-CDG",
        "diseaseId": "Orpha_356961",
        "source": "Orphapacket",
        "profileMatch": "5.73 profile score · 18 / 74 disease HPO terms",
        "externalAnnotation": "SLC35A2-CDG · Orphapacket",
        "crdcEvidence": "19 / 20 phenotype-matched samples",
        "whyMatched": "input HPO profile overlaps external disease-HPO profile",
        "linkedGenes": [
          "ARMC9",
          "HLA-B",
          "SLC6A7"
        ]
      },
      {
        "disease": "Williams syndrome",
        "diseaseId": "Orpha_904",
        "source": "Orphapacket",
        "profileMatch": "8.15 profile score · 21 / 187 disease HPO terms",
        "externalAnnotation": "Williams syndrome · Orphapacket",
        "crdcEvidence": "18 / 20 phenotype-matched samples",
        "whyMatched": "input HPO profile overlaps external disease-HPO profile",
        "linkedGenes": [
          "ARMC9",
          "HLA-B",
          "SLC6A7"
        ]
      },
      {
        "disease": "17q21.31 microdeletion syndrome",
        "diseaseId": "Orpha_363958",
        "source": "Orphapacket",
        "profileMatch": "5.73 profile score · 17 / 124 disease HPO terms",
        "externalAnnotation": "17q21.31 microdeletion syndrome · Orphapacket",
        "crdcEvidence": "18 / 20 phenotype-matched samples",
        "whyMatched": "input HPO profile overlaps external disease-HPO profile",
        "linkedGenes": [
          "ARMC9",
          "HLA-B",
          "SLC6A7"
        ]
      },
      {
        "disease": "Koolen-De Vries syndrome due to a point mutation",
        "diseaseId": "Orpha_363965",
        "source": "Orphapacket",
        "profileMatch": "5.73 profile score · 17 / 124 disease HPO terms",
        "externalAnnotation": "Koolen-De Vries syndrome due to a point mutation · Orphapacket",
        "crdcEvidence": "18 / 20 phenotype-matched samples",
        "whyMatched": "input HPO profile overlaps external disease-HPO profile",
        "linkedGenes": [
          "ARMC9",
          "HLA-B",
          "SLC6A7"
        ]
      }
    ],
    "geneCandidates": [
      {
        "gene": "ARMC9",
        "profileMatch": "3 / 4 exact query HPO terms",
        "externalAnnotation": "external annotation shown when available",
        "cohortCarrierEvidence": "19 / 20 phenotype-matched samples carry rare ARMC9 variants",
        "whyMatched": "CRDC recurrence among phenotype-matched samples",
        "hpoTerms": [
          {
            "hpoId": "HP:0001249",
            "hpoTerm": "Intellectual disability",
            "matched": true,
            "related": false,
            "evidenceRole": "Exact query HPO term",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:617622"
          },
          {
            "hpoId": "HP:0001249",
            "hpoTerm": "Intellectual disability",
            "matched": true,
            "related": false,
            "evidenceRole": "Exact query HPO term",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:475"
          },
          {
            "hpoId": "HP:0001337",
            "hpoTerm": "Tremor",
            "matched": true,
            "related": false,
            "evidenceRole": "Exact query HPO term",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:475"
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
            "hpoId": "HP:0000193",
            "hpoTerm": "Bifid uvula",
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
            "hpoId": "HP:0000218",
            "hpoTerm": "High palate",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:617622"
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
            "hpoId": "HP:0000202",
            "hpoTerm": "Orofacial cleft",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:475"
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
            "hpoId": "HP:0000219",
            "hpoTerm": "Thin upper lip vermilion",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "OMIM:617622"
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
        "gene": "HLA-B",
        "profileMatch": "0 / 4 exact query HPO terms · 2 related HPO terms",
        "externalAnnotation": "external annotation shown when available",
        "cohortCarrierEvidence": "11 / 20 phenotype-matched samples carry rare HLA-B variants",
        "whyMatched": "CRDC recurrence among phenotype-matched samples",
        "hpoTerms": [
          {
            "hpoId": "HP:0001324",
            "hpoTerm": "Muscle weakness",
            "matched": false,
            "related": true,
            "evidenceRole": "Related via HPO hierarchy",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:397"
          },
          {
            "hpoId": "HP:0001324",
            "hpoTerm": "Muscle weakness",
            "matched": false,
            "related": true,
            "evidenceRole": "Related via HPO hierarchy",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:3287"
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
            "hpoId": "HP:0000206",
            "hpoTerm": "Glossitis",
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
            "hpoId": "HP:0000155",
            "hpoTerm": "Oral ulcer",
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
            "hpoId": "HP:0011107",
            "hpoTerm": "Recurrent aphthous stomatitis",
            "matched": false,
            "related": false,
            "evidenceRole": "Gene phenotype annotation",
            "source": "HPO_genes_to_phenotype_260216",
            "sourceDisease": "ORPHA:29207"
          },
          {
            "hpoId": "HP:0011107",
            "hpoTerm": "Recurrent aphthous stomatitis",
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
        "gene": "SLC6A7",
        "profileMatch": "0 / 4 exact query HPO terms",
        "externalAnnotation": "external annotation shown when available",
        "cohortCarrierEvidence": "11 / 20 phenotype-matched samples carry rare SLC6A7 variants",
        "whyMatched": "CRDC recurrence among phenotype-matched samples",
        "hpoTerms": []
      },
      {
        "gene": "GLRA3",
        "profileMatch": "0 / 4 exact query HPO terms",
        "externalAnnotation": "external annotation shown when available",
        "cohortCarrierEvidence": "11 / 20 phenotype-matched samples carry rare GLRA3 variants",
        "whyMatched": "CRDC recurrence among phenotype-matched samples",
        "hpoTerms": []
      },
      {
        "gene": "OR2T33",
        "profileMatch": "0 / 4 exact query HPO terms",
        "externalAnnotation": "external annotation shown when available",
        "cohortCarrierEvidence": "11 / 20 phenotype-matched samples carry rare OR2T33 variants",
        "whyMatched": "CRDC recurrence among phenotype-matched samples",
        "hpoTerms": []
      },
      {
        "gene": "THEMIS2",
        "profileMatch": "0 / 4 exact query HPO terms",
        "externalAnnotation": "external annotation shown when available",
        "cohortCarrierEvidence": "10 / 20 phenotype-matched samples carry rare THEMIS2 variants",
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
        "gene": "HLA-B",
        "sources": [
          "CRDC"
        ]
      },
      {
        "gene": "SLC6A7",
        "sources": [
          "CRDC"
        ]
      }
    ],
    "candidateVariants": [
      {
        "gene": "THEMIS2",
        "id": "chr1:27882855:A:T",
        "carriers": "109 / 20 matched samples",
        "coherence": "carrier phenotype fit not recalculated in fixture",
        "pathogenicity": "-",
        "link": "/krVariant.html?query=chr1%3A27882855%3AA%3AT"
      },
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
        "gene": "HLA-B",
        "id": "chr6:31356417:G:T",
        "carriers": "64 / 20 matched samples",
        "coherence": "carrier phenotype fit not recalculated in fixture",
        "pathogenicity": "-",
        "link": "/krVariant.html?query=chr6%3A31356417%3AG%3AT"
      },
      {
        "gene": "HLA-B",
        "id": "chr6:31356428:G:GCCAAGTGT",
        "carriers": "18 / 20 matched samples",
        "coherence": "carrier phenotype fit not recalculated in fixture",
        "pathogenicity": "-",
        "link": "/krVariant.html?query=chr6%3A31356428%3AG%3AGCCAAGTGT"
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

