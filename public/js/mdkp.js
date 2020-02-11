
var mdkp = mdkp || {};

(function () {
    "use strict";
    mdkp.utility = (function () {

        var showHideElement = function (TGELEMENT) {
            var x = document.getElementById(TGELEMENT);
            if (x.style.display === "none") {
                x.style.display = "block";
            } else {
                x.style.display = "none";
            }
        };


        return {
            showHideElement: showHideElement,
        }
    }());
})();
