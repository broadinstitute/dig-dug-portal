// Utility functions for user management

//function to save custom phenotype list for user
function savePhenotypes(phenotypes) {
    localStorage.setItem("_phenotypes", JSON.stringify(phenotypes));
}

//function to get custom phenotype list for user
function getPhenotypes() {
    return JSON.parse(localStorage.getItem("_phenotypes"));
}

export { savePhenotypes, getPhenotypes };
