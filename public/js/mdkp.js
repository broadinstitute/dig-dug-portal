
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
