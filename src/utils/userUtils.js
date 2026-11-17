
function savePhenotypes(phenotypes) {
    localStorage.setItem("_phenotypes", JSON.stringify(phenotypes));
}

function getPhenotypes() {
    return JSON.parse(localStorage.getItem("_phenotypes"));
}

function clearPhenotypes() {
    localStorage.removeItem("_phenotypes");
}

function addPhenotype(phenotype) {
    if (!!phenotype) {
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

export default {
    savePhenotypes,
    getPhenotypes,
    clearPhenotypes,
    addPhenotype,
    removePhenotype
};
