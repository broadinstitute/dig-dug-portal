<template>
    <div>
        <page-header :disease-group="$parent.diseaseGroup" :front-contents="$parent.frontContents"></page-header>
        <criterion-annotation-picker
            :globalEnrichments="$parent.globalEnrichments"
            v-model="$parent.enrichmentFilter"
        ></criterion-annotation-picker>
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>


<style>
* {
    box-sizing: border-box;
}

/* Container for flexboxes */
.row {
    display: flex;
    flex-wrap: wrap;
}

/* Create four equal columns */
.column {
    flex: 25%;
    padding: 20px;
}

/* On screens that are 992px wide or less, go from four columns to two columns */
@media screen and (max-width: 992px) {
    .column {
        flex: 50%;
    }
}

/* On screens that are 600px wide or less, make the columns stack on top of each other instead of next to each other */
@media screen and (max-width: 600px) {
    .row {
        flex-direction: column;
    }
}

/* coding and regulatory evidence */
.codingEvidence1C {
    background-color: #ffd62e;
    padding: 5px;
    border-radius: 25px;
    font-weight: 700;
}
.codingEvidence2C {
    background-color: #ffec2e;
    padding: 5px;
    border-radius: 25px;
    font-weight: 700;
}
.regulatoryEvidence2R {
    background-color: #bfd730;
    padding: 5px;
    border-radius: 25px;
    font-weight: 700;
}
.regulatoryEvidence3R {
    background-color: #bfd73050;
    padding: 5px;
    border-radius: 25px;
    font-weight: 700;
}

/* color bar plot */
.arrow-up {
    width: 0;
    height: 40px;
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-bottom: 10px solid black;
    animation: moveright 1s alternate 1s;
}

#commonVariation .variationCausal {
    background-color: #884ea0;
}
#commonVariation .variationStrong {
    background-color: #9b59b6;
}
#commonVariation .variationModerate {
    background-color: #af7ac5;
}
#commonVariation .variationPossible {
    background-color: #c39bd3;
}
#commonVariation .variationPotential {
    background-color: #deb3f1;
}
#commonVariation .variationWeak {
    background-color: #e6c7f3;
}

#commonVariation .variationNoEvidence {
    background-color: #eaddee;
}
#rareVariation .variationCausal {
    background-color: #f1c206;
}
#rareVariation .variationStrong {
    background-color: #f3d14a;
}
#rareVariation .variationModerate {
    background-color: #f5db74;
}
#rareVariation .variationPossible {
    background-color: #f6e5a0;
}
#rareVariation .variationPotential {
    background-color: #f3e3a4;
}
#rareVariation .variationWeak {
    background-color: #f3e9c5;
}

#rareVariation .variationNoEvidence {
    background-color: #ebe8de;
}

#combinedVariation .variationCausal {
    background-color: rgb(20, 110, 103);
}
#combinedVariation .variationStrong {
    background-color: rgb(39, 148, 139);
}
#combinedVariation .variationModerate {
    background-color: rgb(48, 175, 164);
}
#combinedVariation .variationPossible {
    background-color: rgb(69, 192, 182);
}
#combinedVariation .variationPotential {
    background-color: rgb(78, 209, 198);
}
#combinedVariation .variationWeak {
    background-color: rgb(120, 228, 219);
}

#combinedVariation .variationNoEvidence {
    background-color: rgb(168, 240, 234);
}

/* arrow distance */
.causalclass {
    position: absolute;
    left: 70px;
}
.strongclass {
    position: absolute;
    left: 160px;
}
.moderateclass {
    position: absolute;
    left: 280px;
}
.possibleclass {
    position: absolute;
    left: 360px;
}

.potentialclass {
    position: absolute;
    left: 480px;
}
.weakclass {
    position: absolute;
    left: 580px;
}
.noEvidenceclass {
    position: absolute;
    left: 680px;
}

/* rare arrow distance */
.rarecausalclass {
    position: absolute;
    left: 1020px;
}
.rarestrongclass {
    position: absolute;
    left: 1120;
}
.raremoderateclass {
    position: absolute;
    left: 1220px;
}
.rarepossibleclass {
    position: absolute;
    left: 1320px;
}

.rarepotentialclass {
    position: absolute;
    left: 1420px;
}
.rareweakclass {
    position: relative;
    left: 1020px;
}
.rarenoEvidenceclass {
    position: absolute;
    left: 1620px;
}
</style>
