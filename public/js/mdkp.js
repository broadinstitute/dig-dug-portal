
var mdkp = mdkp || {};

(function () {
    "use strict";
    mdkp.utility = (function () {

        let showHideElement = function (TGELEMENT) {
            let x = document.getElementById(TGELEMENT);
            if (x.style.display === "none") {
                x.style.display = "block";
            } else {
                x.style.display = "none";
            }
        };

        let popOutElement = function (ELEMENT) {

            console.log(ELEMENT);

            var element = document.getElementById(ELEMENT);

            console.log(element);

            if (typeof (element) == 'undefined' || element == null) {
                element = document.getElementsByClassName(ELEMENT)[0];
                console.log(element);
                element.classList.toggle("popped-out");
            } else {
                element.classList.toggle("popped-out");
            }

        }


        return {
            showHideElement: showHideElement,
            popOutElement: popOutElement,
        }
    }());
})();
