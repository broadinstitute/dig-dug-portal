
const colors = ["#007bff75",
    "#04884575",
    "#8490C875",
    "#BF61A575",
    "#EE312475",
    "#FCD70075",
    "#5555FF75",
    "#7aaa1c75",
    "#9F78AC75",
    "#F8808475",
    "#F5A4C775",
    "#CEE6C175",
    "#cccc0075",
    "#6FC7B675",
    "#D5A76875",
    "#d4d4d475"]

const popAlert = function (MESSAGE) {

    const el = document.createElement('div');
    el.classList.add('alert-pop-up');
    el.setAttribute("id", "alert_pop_up");
    el.textContent = MESSAGE;

    document.body.appendChild(el);

    let wrapper = document.getElementById("alert_pop_up");
    setTimeout(function () {
        wrapper.remove();
    }, 2000);
}

const popModal = function (CONTENT) {

    const el = document.createElement('div');
    el.classList.add('modal-pop-up');
    el.setAttribute("id", "modal_pop_up");
    el.innerHTML = CONTENT;

    document.body.appendChild(el);

    let wrapper = document.getElementById("alert_pop_up");
}

const popSectionAlert = function (MESSAGE, ID) {
    let poppedAlerts = document.querySelectorAll(".section-alert-pop-up");

    let heights = 15;

    for (let i = 0; i < poppedAlerts.length; ++i) {
        heights += poppedAlerts[i].offsetHeight + 15
    }

    let popID = "alert_pop_up_" + ID;
    let sectionID = "section_" + ID;
    let el = document.createElement('div');
    el.classList.add('section-alert-pop-up');
    el.setAttribute("id", popID);
    el.style.bottom = heights + "px"
    el.textContent = MESSAGE;

    document.getElementById(sectionID).appendChild(el)

    let wrapper = document.getElementById(popID);
    setTimeout(function () {
        wrapper.remove();
    }, 5000);
}

export default {
    popAlert,
    popSectionAlert,
    popModal
};

