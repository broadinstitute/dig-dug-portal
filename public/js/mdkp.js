$ = jQuery;

var mdkp = mdkp || {};

(function () {
    "use strict";
    mdkp.utility = (function () {

        var showHideElement = function (TGELEMENT) {
                  $(TGELEMENT).toggle("slow","swing");
              }

        return {
            showHideElement : showHideElement,
        }
    }());
})();
