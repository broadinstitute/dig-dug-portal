// Utility functions for custom user data

//function to save custom phenotype list for user
function savePhenotypes(phenotypes) {
    localStorage.setItem("_phenotypes", JSON.stringify(phenotypes));
}

//function to get custom phenotype list for user
function getPhenotypes() {
    return JSON.parse(localStorage.getItem("_phenotypes"));
}

//function to clear custom phenotype list for user
function clearPhenotypes() {
    localStorage.removeItem("_phenotypes");
}

//function to add a phenotype to the custom phenotype list for user
// phenotype: object with name and id

function addPhenotype(phenotype) {
    if (!!phenotype) {
        let phenotypes = getPhenotypes();
        if (phenotypes === null) {
            phenotypes = [];
        }
        let index = phenotypes.findIndex(p => p.id == phenotype.id);
        if (index === -1) {
            phenotypes.push(phenotype);
            savePhenotypes(phenotypes);
        } else {
            console.error("Phenotype already exists");
        }
    } else {
        console.error("Phenotype is null");
        return;
    }
}

//function to remove a phenotype from the custom phenotype list for user
// phenotype: object with name and id
function removePhenotypeById(phenotype) {
    if (!!phenotype) {
        let phenotypes = getPhenotypes();
        if (phenotypes == null) {
            phenotypes = [];
        }
        let index = phenotypes.findIndex(p => p.id == phenotype.id);
        if (index > -1) {
            phenotypes.splice(index, 1);
            savePhenotypes(phenotypes);
        }
    } else {
        console.error("Phenotype is null");
        return;
    }
}
