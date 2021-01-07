
var mdkp = mdkp || {};

(function () {
    "use strict";
    mdkp.utility = (function () {


        return {

        }
    }());
})();

var showSection = function (event) {
    let x = event.target.nextElementSibling.getAttribute("style");
    let newStyle = (x.includes("none")) ? "display: block" : "display: none";
    event.target.nextElementSibling.setAttribute("style", newStyle);
}

var showDetail = function (event) {
    event.target.innerHTML = event.target.getAttribute("data");
}

var hideDetail = function (event) {
    event.target.innerHTML = "&nbsp;";
}

var hideGroupDetail = function (event, numOfGenes) {
    event.target.innerHTML = "<span class='num-of-genes'>" + numOfGenes + "</span>";
}
