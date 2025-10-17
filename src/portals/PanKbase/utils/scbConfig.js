export const SCB_CONFIG = 
    {
        "type": "cell browser",
        "label": "Single Cell Browser",
        "presets": {
            "layout": 1,
            "datasetId": "islet_of_Langerhans_scRNA_v3-3",
            "showDatasetSelect": false
        },

        /*
            (optional) url parameter names
            this is only really needed with 2+ cell browser components on same page
            TODO: check optionality - should have defaults if omitted
        */
        "parameters":{
            "gene": "gene"
        },

        /*
            (required) desired bioindex url where api enpoints are localed
            "bioIndexDev" will be used if detected subdomain contains 'dev' or port is 8000
            TODO: make something default?
            TODO: handle trailing slash
        */
        "bioIndex": "https://bioindex.pankbase.org",
        "bioIndexDev": "https://bioindex-dev.pankbase.org",

        /*
            (optional) formatting params
            can be applied to all datasets in a bioindex
            and/or a specific dataset
            TODO: add a dataset specific example
        */
        "format":{
            //"default" formatting for all datasets in a bioindex
            "default":{
                /*
                    displayMap allows you to define user readable labels 
                        for your dataset column names
                    each key in displayMap should match a key in fields.metadata_labels
                        from the fields enpoint of your bioindex
                    the value of each key should be the desired label to display
                    otherwise the key name will be used for display
                */
                "displayMap":{
                    "biosample_id": "Biosample ID",
                    "donorsField": "Donor ID",
                    "disease__ontology_label": "Disease",
                    "cell_type__author": "Cell Type",
                    "bmi": "BMI",
                    "bmi__group": "BMI Group",
                    "custom__cell_cycle__phase": "Cell Cycle Phase",
                    "custom__author_cell_substype": "Cell Sub-Type",
                    "custom__development_stage__ontology_label": "Development Stage",
                    "custom__organism_age": "Age (years)",
                    "custom__organism_age__group": "Age Group (years)"
                },

                /*
                    define the columns in your data for a few default categories
                    used for selecting the appropriate fields for display and visualizations
                */
                "groups":{
                    "cellType": "cell_type__author",
                    "cellSubType": "custom__author_cell_substype",
                    "donors": "donorsField",
                    "samples": "biosample_id"
                }
            }
            /*
                in addition to default settings, you can specify same settings per datasetId
            ///
            "<some_dataset_ID>":{
                "displayMap": {},
                "annotationGroups": {},    
            }*/
        }
    }
    