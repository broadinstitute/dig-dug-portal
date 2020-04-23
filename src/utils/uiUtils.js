let popOutElement = function (ELEMENT) {
    var element = document.getElementById(ELEMENT);

    if (typeof (element) == 'undefined' || element == null) {
        element = document.getElementsByClassName(ELEMENT)[0];
        console.log(element);
        element.classList.toggle("popped-out");
    } else {
        element.classList.toggle("popped-out");
    }
}


export default {
    popOutElement,
}
