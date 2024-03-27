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
//phenotype: object with name and id
function addPhenotype(phenotype) {
    if (!!phenotype) {
        //check if phenotype have name and id
        if (!phenotype.name || !phenotype.id) {
            console.error("Phenotype input is missing name or id");
            return;
        }

        let phenotypes = getPhenotypes();
        if (phenotypes === null) {
            phenotypes = [];
        }
        let index = phenotypes.findIndex(p => p.id === phenotype.id);
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
//phenotype: object with name and id
function removePhenotype(phenotype) {
    if (!!phenotype) {
        let phenotypes = getPhenotypes();
        if (phenotypes === null) {
            phenotypes = [];
        }
        let index = phenotypes.findIndex(p => p.id === phenotype.id);
        if (index > -1) {
            phenotypes.splice(index, 1);
            savePhenotypes(phenotypes);
        }
    } else {
        console.error("Phenotype is null");
        return;
    }
}

function saveContext(GROUP, context) {
    console.log(GROUP, context)
    localStorage.setItem(GROUP, JSON.stringify(context));
}

function getContext(GROUP) {
    console.log(GROUP)
    return JSON.parse(localStorage.getItem(GROUP));
}

function clearContext(GROUP) {
    console.log(GROUP)
    localStorage.removeItem(GROUP);
}

export default {
    savePhenotypes,
    getPhenotypes,
    clearPhenotypes,
    addPhenotype,
    removePhenotype,
    saveContext,
    getContext,
    clearContext,
};
