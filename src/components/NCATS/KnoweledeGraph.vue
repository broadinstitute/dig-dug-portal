<script>
import Vue from "vue";
let results = [
  {
    "node_bindings": {
      "n00": [
        {
          "id": "NCBIGene:1803",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:MolecularEntity",
            "biolink:Gene",
            "biolink:GeneOrGeneProduct",
            "biolink:MacromolecularMachine",
            "biolink:GenomicEntity"
          ]
        }
      ],
      "n01": [
        {
          "id": "MONDO:0005044",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:Disease",
            "biolink:DiseaseOrPhenotypicFeature"
          ]
        }
      ]
    },
    "edge_bindings": {
      "e00": [
        {
          "id": "8c6ca68ef652b11d8808fa279badfed9"
        }
      ]
    }
  },
  {
    "node_bindings": {
      "n00": [
        {
          "id": "NCBIGene:1803",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:MolecularEntity",
            "biolink:Gene",
            "biolink:GeneOrGeneProduct",
            "biolink:MacromolecularMachine",
            "biolink:GenomicEntity"
          ]
        }
      ],
      "n01": [
        {
          "id": "MONDO:0005154",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:Disease",
            "biolink:DiseaseOrPhenotypicFeature"
          ]
        }
      ]
    },
    "edge_bindings": {
      "e00": [
        {
          "id": "282dbb681900c26a8e7d90a662437e32"
        }
      ]
    }
  },
  {
    "node_bindings": {
      "n00": [
        {
          "id": "NCBIGene:1803",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:MolecularEntity",
            "biolink:Gene",
            "biolink:GeneOrGeneProduct",
            "biolink:MacromolecularMachine",
            "biolink:GenomicEntity"
          ]
        }
      ],
      "n01": [
        {
          "id": "MONDO:0001040",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:Disease",
            "biolink:DiseaseOrPhenotypicFeature"
          ]
        }
      ]
    },
    "edge_bindings": {
      "e00": [
        {
          "id": "533f54f9bf54bf4e8c516ea5876fbdf8"
        }
      ]
    }
  },
  {
    "node_bindings": {
      "n00": [
        {
          "id": "NCBIGene:1803",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:MolecularEntity",
            "biolink:Gene",
            "biolink:GeneOrGeneProduct",
            "biolink:MacromolecularMachine",
            "biolink:GenomicEntity"
          ]
        }
      ],
      "n01": [
        {
          "id": "MONDO:0005148",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:Disease",
            "biolink:DiseaseOrPhenotypicFeature"
          ]
        }
      ]
    },
    "edge_bindings": {
      "e00": [
        {
          "id": "49d1752cff709fca8a10dc1283897b5e"
        }
      ]
    }
  },
  {
    "node_bindings": {
      "n00": [
        {
          "id": "NCBIGene:1803",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:MolecularEntity",
            "biolink:Gene",
            "biolink:GeneOrGeneProduct",
            "biolink:MacromolecularMachine",
            "biolink:GenomicEntity"
          ]
        }
      ],
      "n01": [
        {
          "id": "MONDO:0013209",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:Disease",
            "biolink:DiseaseOrPhenotypicFeature"
          ]
        }
      ]
    },
    "edge_bindings": {
      "e00": [
        {
          "id": "809828e169d98bee1a5c8c81557e2069"
        }
      ]
    }
  },
  {
    "node_bindings": {
      "n00": [
        {
          "id": "NCBIGene:1803",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:MolecularEntity",
            "biolink:Gene",
            "biolink:GeneOrGeneProduct",
            "biolink:MacromolecularMachine",
            "biolink:GenomicEntity"
          ]
        }
      ],
      "n01": [
        {
          "id": "MONDO:0005015",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:Disease",
            "biolink:DiseaseOrPhenotypicFeature"
          ]
        }
      ]
    },
    "edge_bindings": {
      "e00": [
        {
          "id": "f0313f1ee3e425317daf1f178f7519a0"
        }
      ]
    }
  },
  {
    "node_bindings": {
      "n00": [
        {
          "id": "NCBIGene:1803",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:MolecularEntity",
            "biolink:Gene",
            "biolink:GeneOrGeneProduct",
            "biolink:MacromolecularMachine",
            "biolink:GenomicEntity"
          ]
        }
      ],
      "n01": [
        {
          "id": "MONDO:0003634",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:Disease",
            "biolink:DiseaseOrPhenotypicFeature"
          ]
        }
      ]
    },
    "edge_bindings": {
      "e00": [
        {
          "id": "441307fdaaac8ee2bee40384b46351bd"
        }
      ]
    }
  },
  {
    "node_bindings": {
      "n00": [
        {
          "id": "NCBIGene:1803",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:MolecularEntity",
            "biolink:Gene",
            "biolink:GeneOrGeneProduct",
            "biolink:MacromolecularMachine",
            "biolink:GenomicEntity"
          ]
        }
      ],
      "n01": [
        {
          "id": "MONDO:0004993",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:Disease",
            "biolink:DiseaseOrPhenotypicFeature"
          ]
        }
      ]
    },
    "edge_bindings": {
      "e00": [
        {
          "id": "61f6fd2f6ff07dd1e7c9184b159d9b4e"
        }
      ]
    }
  },
  {
    "node_bindings": {
      "n00": [
        {
          "id": "NCBIGene:1803",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:MolecularEntity",
            "biolink:Gene",
            "biolink:GeneOrGeneProduct",
            "biolink:MacromolecularMachine",
            "biolink:GenomicEntity"
          ]
        }
      ],
      "n01": [
        {
          "id": "MONDO:0005010",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:Disease",
            "biolink:DiseaseOrPhenotypicFeature"
          ]
        }
      ]
    },
    "edge_bindings": {
      "e00": [
        {
          "id": "a2e699dbd73b742cf7445b1330be33a9"
        }
      ]
    }
  },
  {
    "node_bindings": {
      "n00": [
        {
          "id": "NCBIGene:1803",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:MolecularEntity",
            "biolink:Gene",
            "biolink:GeneOrGeneProduct",
            "biolink:MacromolecularMachine",
            "biolink:GenomicEntity"
          ]
        }
      ],
      "n01": [
        {
          "id": "MONDO:0002525",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:Disease",
            "biolink:DiseaseOrPhenotypicFeature"
          ]
        }
      ]
    },
    "edge_bindings": {
      "e00": [
        {
          "id": "b33abca961938e6a805fea6d6ee1506e"
        }
      ]
    }
  },
  {
    "node_bindings": {
      "n00": [
        {
          "id": "NCBIGene:1803",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:MolecularEntity",
            "biolink:Gene",
            "biolink:GeneOrGeneProduct",
            "biolink:MacromolecularMachine",
            "biolink:GenomicEntity"
          ]
        }
      ],
      "n01": [
        {
          "id": "MONDO:0005263",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:Disease",
            "biolink:DiseaseOrPhenotypicFeature"
          ]
        }
      ]
    },
    "edge_bindings": {
      "e00": [
        {
          "id": "91964a4775a274927cb10c85cde0c06d"
        }
      ]
    }
  },
  {
    "node_bindings": {
      "n00": [
        {
          "id": "NCBIGene:1803",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:MolecularEntity",
            "biolink:Gene",
            "biolink:GeneOrGeneProduct",
            "biolink:MacromolecularMachine",
            "biolink:GenomicEntity"
          ]
        }
      ],
      "n01": [
        {
          "id": "MONDO:0004982",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:Disease",
            "biolink:DiseaseOrPhenotypicFeature"
          ]
        }
      ]
    },
    "edge_bindings": {
      "e00": [
        {
          "id": "9c3e8ab00a3396df35ec64d5fc1b50cf"
        }
      ]
    }
  },
  {
    "node_bindings": {
      "n00": [
        {
          "id": "NCBIGene:1803",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:MolecularEntity",
            "biolink:Gene",
            "biolink:GeneOrGeneProduct",
            "biolink:MacromolecularMachine",
            "biolink:GenomicEntity"
          ]
        }
      ],
      "n01": [
        {
          "id": "MONDO:0008383",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:Disease",
            "biolink:DiseaseOrPhenotypicFeature"
          ]
        }
      ]
    },
    "edge_bindings": {
      "e00": [
        {
          "id": "2c4f8f8363ef98aa39552396fd1796ed"
        }
      ]
    }
  },
  {
    "node_bindings": {
      "n00": [
        {
          "id": "NCBIGene:1803",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:MolecularEntity",
            "biolink:Gene",
            "biolink:GeneOrGeneProduct",
            "biolink:MacromolecularMachine",
            "biolink:GenomicEntity"
          ]
        }
      ],
      "n01": [
        {
          "id": "MONDO:0002909",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:Disease",
            "biolink:DiseaseOrPhenotypicFeature"
          ]
        }
      ]
    },
    "edge_bindings": {
      "e00": [
        {
          "id": "2d206721a29b7b9974113d858326ab46"
        }
      ]
    }
  },
  {
    "node_bindings": {
      "n00": [
        {
          "id": "NCBIGene:1803",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:MolecularEntity",
            "biolink:Gene",
            "biolink:GeneOrGeneProduct",
            "biolink:MacromolecularMachine",
            "biolink:GenomicEntity"
          ]
        }
      ],
      "n01": [
        {
          "id": "MONDO:0004946",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:Disease",
            "biolink:DiseaseOrPhenotypicFeature"
          ]
        }
      ]
    },
    "edge_bindings": {
      "e00": [
        {
          "id": "33739e06257d29d5b97c67f61945248a"
        }
      ]
    }
  },
  {
    "node_bindings": {
      "n00": [
        {
          "id": "NCBIGene:1803",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:MolecularEntity",
            "biolink:Gene",
            "biolink:GeneOrGeneProduct",
            "biolink:MacromolecularMachine",
            "biolink:GenomicEntity"
          ]
        }
      ],
      "n01": [
        {
          "id": "MONDO:0004992",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:Disease",
            "biolink:DiseaseOrPhenotypicFeature"
          ]
        }
      ]
    },
    "edge_bindings": {
      "e00": [
        {
          "id": "ede1cb404402be1ff1312583fadc4a13"
        }
      ]
    }
  },
  {
    "node_bindings": {
      "n00": [
        {
          "id": "NCBIGene:1803",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:MolecularEntity",
            "biolink:Gene",
            "biolink:GeneOrGeneProduct",
            "biolink:MacromolecularMachine",
            "biolink:GenomicEntity"
          ]
        }
      ],
      "n01": [
        {
          "id": "MONDO:0019082",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:Disease",
            "biolink:DiseaseOrPhenotypicFeature"
          ]
        }
      ]
    },
    "edge_bindings": {
      "e00": [
        {
          "id": "05d1e23cce0c32e00f117fc43de4dfc7"
        }
      ]
    }
  },
  {
    "node_bindings": {
      "n00": [
        {
          "id": "NCBIGene:1803",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:MolecularEntity",
            "biolink:Gene",
            "biolink:GeneOrGeneProduct",
            "biolink:MacromolecularMachine",
            "biolink:GenomicEntity"
          ]
        }
      ],
      "n01": [
        {
          "id": "MONDO:0011122",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:Disease",
            "biolink:DiseaseOrPhenotypicFeature"
          ]
        }
      ]
    },
    "edge_bindings": {
      "e00": [
        {
          "id": "97a3c8e9a614fca723f89f2497e72d36"
        }
      ]
    }
  },
  {
    "node_bindings": {
      "n00": [
        {
          "id": "NCBIGene:1803",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:MolecularEntity",
            "biolink:Gene",
            "biolink:GeneOrGeneProduct",
            "biolink:MacromolecularMachine",
            "biolink:GenomicEntity"
          ]
        }
      ],
      "n01": [
        {
          "id": "MONDO:0011057",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:Disease",
            "biolink:DiseaseOrPhenotypicFeature"
          ]
        }
      ]
    },
    "edge_bindings": {
      "e00": [
        {
          "id": "e23659ae0a21c4040e303fa884d15bf2"
        }
      ]
    }
  },
  {
    "node_bindings": {
      "n00": [
        {
          "id": "NCBIGene:1803",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:MolecularEntity",
            "biolink:Gene",
            "biolink:GeneOrGeneProduct",
            "biolink:MacromolecularMachine",
            "biolink:GenomicEntity"
          ]
        }
      ],
      "n01": [
        {
          "id": "MONDO:0005240",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:Disease",
            "biolink:DiseaseOrPhenotypicFeature"
          ]
        }
      ]
    },
    "edge_bindings": {
      "e00": [
        {
          "id": "f73a751a835cc04be5bfe3295b54b72b"
        }
      ]
    }
  },
  {
    "node_bindings": {
      "n00": [
        {
          "id": "NCBIGene:1803",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:MolecularEntity",
            "biolink:Gene",
            "biolink:GeneOrGeneProduct",
            "biolink:MacromolecularMachine",
            "biolink:GenomicEntity"
          ]
        }
      ],
      "n01": [
        {
          "id": "MONDO:0005311",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:Disease",
            "biolink:DiseaseOrPhenotypicFeature"
          ]
        }
      ]
    },
    "edge_bindings": {
      "e00": [
        {
          "id": "855f77bb817477233f49f017af8a2a78"
        }
      ]
    }
  },
  {
    "node_bindings": {
      "n00": [
        {
          "id": "NCBIGene:1803",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:MolecularEntity",
            "biolink:Gene",
            "biolink:GeneOrGeneProduct",
            "biolink:MacromolecularMachine",
            "biolink:GenomicEntity"
          ]
        }
      ],
      "n01": [
        {
          "id": "EFO:0000275",
          "category": "biolink:Disease"
        }
      ]
    },
    "edge_bindings": {
      "e00": [
        {
          "id": "INTEGRATED_GENETICS_3342"
        }
      ]
    }
  },
  {
    "node_bindings": {
      "n00": [
        {
          "id": "NCBIGene:1803",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:MolecularEntity",
            "biolink:Gene",
            "biolink:GeneOrGeneProduct",
            "biolink:MacromolecularMachine",
            "biolink:GenomicEntity"
          ]
        }
      ],
      "n01": [
        {
          "id": "EFO:0000378",
          "category": "biolink:Disease"
        }
      ]
    },
    "edge_bindings": {
      "e00": [
        {
          "id": "INTEGRATED_GENETICS_22947"
        }
      ]
    }
  },
  {
    "node_bindings": {
      "n00": [
        {
          "id": "NCBIGene:1803",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:MolecularEntity",
            "biolink:Gene",
            "biolink:GeneOrGeneProduct",
            "biolink:MacromolecularMachine",
            "biolink:GenomicEntity"
          ]
        }
      ],
      "n01": [
        {
          "id": "EFO:0004705",
          "category": "biolink:Disease"
        }
      ]
    },
    "edge_bindings": {
      "e00": [
        {
          "id": "RC_GENES_12228"
        }
      ]
    }
  },
  {
    "node_bindings": {
      "n00": [
        {
          "id": "NCBIGene:1803",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:MolecularEntity",
            "biolink:Gene",
            "biolink:GeneOrGeneProduct",
            "biolink:MacromolecularMachine",
            "biolink:GenomicEntity"
          ]
        }
      ],
      "n01": [
        {
          "id": "EFO:0004705",
          "category": "biolink:Disease"
        }
      ]
    },
    "edge_bindings": {
      "e00": [
        {
          "id": "RC_GENES_10152"
        }
      ]
    }
  },
  {
    "node_bindings": {
      "n00": [
        {
          "id": "NCBIGene:1803",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:MolecularEntity",
            "biolink:Gene",
            "biolink:GeneOrGeneProduct",
            "biolink:MacromolecularMachine",
            "biolink:GenomicEntity"
          ]
        }
      ],
      "n01": [
        {
          "id": "MONDO:0004985",
          "category": "biolink:Disease"
        }
      ]
    },
    "edge_bindings": {
      "e00": [
        {
          "id": "magma_gene_2014167"
        }
      ]
    }
  },
  {
    "node_bindings": {
      "n00": [
        {
          "id": "NCBIGene:1803",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:MolecularEntity",
            "biolink:Gene",
            "biolink:GeneOrGeneProduct",
            "biolink:MacromolecularMachine",
            "biolink:GenomicEntity"
          ]
        }
      ],
      "n01": [
        {
          "id": "EFO:0000378",
          "category": "biolink:Disease"
        }
      ]
    },
    "edge_bindings": {
      "e00": [
        {
          "id": "magma_gene_1905119"
        }
      ]
    }
  },
  {
    "node_bindings": {
      "n00": [
        {
          "id": "NCBIGene:1803",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:MolecularEntity",
            "biolink:Gene",
            "biolink:GeneOrGeneProduct",
            "biolink:MacromolecularMachine",
            "biolink:GenomicEntity"
          ]
        }
      ],
      "n01": [
        {
          "id": "MONDO:0005148",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:Disease",
            "biolink:DiseaseOrPhenotypicFeature"
          ]
        }
      ]
    },
    "edge_bindings": {
      "e00": [
        {
          "id": "magma_gene_807484"
        }
      ]
    }
  },
  {
    "node_bindings": {
      "n00": [
        {
          "id": "NCBIGene:1803",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:MolecularEntity",
            "biolink:Gene",
            "biolink:GeneOrGeneProduct",
            "biolink:MacromolecularMachine",
            "biolink:GenomicEntity"
          ]
        }
      ],
      "n01": [
        {
          "id": "MONDO:0001660",
          "category": "biolink:Disease"
        }
      ]
    },
    "edge_bindings": {
      "e00": [
        {
          "id": "magma_gene_1203949"
        }
      ]
    }
  },
  {
    "node_bindings": {
      "n00": [
        {
          "id": "NCBIGene:1803",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:MolecularEntity",
            "biolink:Gene",
            "biolink:GeneOrGeneProduct",
            "biolink:MacromolecularMachine",
            "biolink:GenomicEntity"
          ]
        }
      ],
      "n01": [
        {
          "id": "EFO:1001870",
          "category": "biolink:Disease"
        }
      ]
    },
    "edge_bindings": {
      "e00": [
        {
          "id": "magma_gene_1576279"
        }
      ]
    }
  },
  {
    "node_bindings": {
      "n00": [
        {
          "id": "NCBIGene:1803",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:MolecularEntity",
            "biolink:Gene",
            "biolink:GeneOrGeneProduct",
            "biolink:MacromolecularMachine",
            "biolink:GenomicEntity"
          ]
        }
      ],
      "n01": [
        {
          "id": "EFO:0004705",
          "category": "biolink:Disease"
        }
      ]
    },
    "edge_bindings": {
      "e00": [
        {
          "id": "magma_gene_1015493"
        }
      ]
    }
  },
  {
    "node_bindings": {
      "n00": [
        {
          "id": "NCBIGene:1803",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:MolecularEntity",
            "biolink:Gene",
            "biolink:GeneOrGeneProduct",
            "biolink:MacromolecularMachine",
            "biolink:GenomicEntity"
          ]
        }
      ],
      "n01": [
        {
          "id": "MONDO:0005315",
          "category": "biolink:Disease"
        }
      ]
    },
    "edge_bindings": {
      "e00": [
        {
          "id": "magma_gene_826603"
        }
      ]
    }
  },
  {
    "node_bindings": {
      "n00": [
        {
          "id": "NCBIGene:1803",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:MolecularEntity",
            "biolink:Gene",
            "biolink:GeneOrGeneProduct",
            "biolink:MacromolecularMachine",
            "biolink:GenomicEntity"
          ]
        }
      ],
      "n01": [
        {
          "id": "MONDO:0005090",
          "category": "biolink:Disease"
        }
      ]
    },
    "edge_bindings": {
      "e00": [
        {
          "id": "magma_gene_3233371"
        }
      ]
    }
  },
  {
    "node_bindings": {
      "n00": [
        {
          "id": "NCBIGene:1803",
          "category": [
            "biolink:NamedThing",
            "biolink:BiologicalEntity",
            "biolink:MolecularEntity",
            "biolink:Gene",
            "biolink:GeneOrGeneProduct",
            "biolink:MacromolecularMachine",
            "biolink:GenomicEntity"
          ]
        }
      ],
      "n01": [
        {
          "id": "EFO:0000537",
          "category": "biolink:Disease"
        }
      ]
    },
    "edge_bindings": {
      "e00": [
        {
          "id": "magma_gene_97626"
        }
      ]
    }
  },
  {
    "confidence": 0.9,
    "description": "No description available",
    "edge_bindings": {
      "N1": [
        {
          "id": "N1_3"
        }
      ],
      "e00": [
        {
          "id": "KG2c:31946697"
        }
      ]
    },
    "essence": "angioedema",
    "essence_category": "biolink:Disease",
    "node_bindings": {
      "n00": [
        {
          "id": "UniProtKB:P27487"
        }
      ],
      "n01": [
        {
          "id": "MONDO:0010481"
        }
      ]
    },
    "reasoner_id": "ARAX",
    "row_data": [
      0.9,
      "angioedema",
      "biolink:Disease"
    ]
  },
  {
    "confidence": 0.9,
    "description": "No description available",
    "edge_bindings": {
      "N1": [
        {
          "id": "N1_4"
        }
      ],
      "e00": [
        {
          "id": "KG2c:31981143"
        }
      ]
    },
    "essence": "extraskeletal myxoid chondrosarcoma",
    "essence_category": "biolink:Disease",
    "node_bindings": {
      "n00": [
        {
          "id": "UniProtKB:P27487"
        }
      ],
      "n01": [
        {
          "id": "MONDO:0012825"
        }
      ]
    },
    "reasoner_id": "ARAX",
    "row_data": [
      0.9,
      "extraskeletal myxoid chondrosarcoma",
      "biolink:Disease"
    ]
  },
  {
    "confidence": 0.4000000000000001,
    "description": "No description available",
    "edge_bindings": {
      "N1": [
        {
          "id": "N1_2"
        }
      ],
      "e00": [
        {
          "id": "KG2c:31965564"
        }
      ]
    },
    "essence": "Dubin-Johnson syndrome",
    "essence_category": "biolink:Disease",
    "node_bindings": {
      "n00": [
        {
          "id": "UniProtKB:P27487"
        }
      ],
      "n01": [
        {
          "id": "MONDO:0009380"
        }
      ]
    },
    "reasoner_id": "ARAX",
    "row_data": [
      0.4,
      "Dubin-Johnson syndrome",
      "biolink:Disease"
    ]
  },
  {
    "confidence": 0.4000000000000001,
    "description": "No description available",
    "edge_bindings": {
      "N1": [
        {
          "id": "N1_1"
        }
      ],
      "e00": [
        {
          "id": "KG2c:31937343"
        }
      ]
    },
    "essence": "adenomatoid tumor",
    "essence_category": "biolink:Disease",
    "node_bindings": {
      "n00": [
        {
          "id": "UniProtKB:P27487"
        }
      ],
      "n01": [
        {
          "id": "MONDO:0004230"
        }
      ]
    },
    "reasoner_id": "ARAX",
    "row_data": [
      0.4,
      "adenomatoid tumor",
      "biolink:Disease"
    ]
  },
  {
    "confidence": 0.4000000000000001,
    "description": "No description available",
    "edge_bindings": {
      "N1": [
        {
          "id": "N1_0"
        }
      ],
      "e00": [
        {
          "id": "KG2c:31925426"
        }
      ]
    },
    "essence": "obesity disorder",
    "essence_category": "biolink:Disease",
    "node_bindings": {
      "n00": [
        {
          "id": "UniProtKB:P27487"
        }
      ],
      "n01": [
        {
          "id": "MONDO:0011122"
        }
      ]
    },
    "reasoner_id": "ARAX",
    "row_data": [
      0.4,
      "obesity disorder",
      "biolink:Disease"
    ]
  },
  {
    "edge_bindings": {
      "e00": [
        {
          "id": "magma_gene_97626"
        }
      ]
    },
    "node_bindings": {
      "n00": [
        {
          "id": "NCBIGene:1803"
        }
      ],
      "n01": [
        {
          "id": "EFO:0000537"
        }
      ]
    }
  },
  {
    "edge_bindings": {
      "e00": [
        {
          "id": "magma_gene_3233371"
        }
      ]
    },
    "node_bindings": {
      "n00": [
        {
          "id": "NCBIGene:1803"
        }
      ],
      "n01": [
        {
          "id": "EFO:0000692"
        }
      ]
    }
  },
  {
    "edge_bindings": {
      "e00": [
        {
          "id": "magma_gene_826603"
        }
      ]
    },
    "node_bindings": {
      "n00": [
        {
          "id": "NCBIGene:1803"
        }
      ],
      "n01": [
        {
          "id": "EFO:0003931"
        }
      ]
    }
  },
  {
    "edge_bindings": {
      "e00": [
        {
          "id": "magma_gene_1015493"
        }
      ]
    },
    "node_bindings": {
      "n00": [
        {
          "id": "NCBIGene:1803"
        }
      ],
      "n01": [
        {
          "id": "EFO:0004705"
        }
      ]
    }
  },
  {
    "edge_bindings": {
      "e00": [
        {
          "id": "magma_gene_1576279"
        }
      ]
    },
    "node_bindings": {
      "n00": [
        {
          "id": "NCBIGene:1803"
        }
      ],
      "n01": [
        {
          "id": "EFO:1001870"
        }
      ]
    }
  },
  {
    "edge_bindings": {
      "e00": [
        {
          "id": "magma_gene_1203949"
        }
      ]
    },
    "node_bindings": {
      "n00": [
        {
          "id": "NCBIGene:1803"
        }
      ],
      "n01": [
        {
          "id": "MONDO:0001660"
        }
      ]
    }
  },
  {
    "edge_bindings": {
      "e00": [
        {
          "id": "magma_gene_807484"
        }
      ]
    },
    "node_bindings": {
      "n00": [
        {
          "id": "NCBIGene:1803"
        }
      ],
      "n01": [
        {
          "id": "EFO:0001360"
        }
      ]
    }
  },
  {
    "edge_bindings": {
      "e00": [
        {
          "id": "magma_gene_1905119"
        }
      ]
    },
    "node_bindings": {
      "n00": [
        {
          "id": "NCBIGene:1803"
        }
      ],
      "n01": [
        {
          "id": "EFO:0000378"
        }
      ]
    }
  },
  {
    "edge_bindings": {
      "e00": [
        {
          "id": "magma_gene_2014167"
        }
      ]
    },
    "node_bindings": {
      "n00": [
        {
          "id": "NCBIGene:1803"
        }
      ],
      "n01": [
        {
          "id": "EFO:0000289"
        }
      ]
    }
  },
  {
    "edge_bindings": {
      "e00": [
        {
          "id": "RC_GENES_10152"
        }
      ]
    },
    "node_bindings": {
      "n00": [
        {
          "id": "NCBIGene:1803"
        }
      ],
      "n01": [
        {
          "id": "EFO:0004705"
        }
      ]
    }
  },
  {
    "edge_bindings": {
      "e00": [
        {
          "id": "RC_GENES_12228"
        }
      ]
    },
    "node_bindings": {
      "n00": [
        {
          "id": "NCBIGene:1803"
        }
      ],
      "n01": [
        {
          "id": "EFO:0004705"
        }
      ]
    }
  },
  {
    "edge_bindings": {
      "e00": [
        {
          "id": "INTEGRATED_GENETICS_22947"
        }
      ]
    },
    "node_bindings": {
      "n00": [
        {
          "id": "NCBIGene:1803"
        }
      ],
      "n01": [
        {
          "id": "EFO:0000378"
        }
      ]
    }
  },
  {
    "edge_bindings": {
      "e00": [
        {
          "id": "INTEGRATED_GENETICS_3342"
        }
      ]
    },
    "node_bindings": {
      "n00": [
        {
          "id": "NCBIGene:1803"
        }
      ],
      "n01": [
        {
          "id": "EFO:0000275"
        }
      ]
    }
  }
]
export default Vue.component("knowledge-graph", {

})
</script>
