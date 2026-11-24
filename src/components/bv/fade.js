// Bootstrap's fade, run as Vue's <transition> runs it for BootstrapVue: the classes are on the element while it lasts, then
// gone. Not by that component around a slot, because it has an instance: it would be the `$parent` of what comes into it.

export function nextFrame(callback) {
    requestAnimationFrame(() => requestAnimationFrame(callback));
}

// Calls back when the element's own transition is over, at once if its style has none.
export function afterTransition(el, callback) {
    const { transitionDelay, transitionDuration } = getComputedStyle(el);
    const seconds =
        parseFloat(transitionDuration) + parseFloat(transitionDelay);
    if (!seconds) {
        callback();
        return;
    }
    let timer = null;
    const end = (event) => {
        if (!event || event.target === el) {
            clearTimeout(timer);
            el.removeEventListener("transitionend", end);
            callback();
        }
    };
    // there is no event if the element is not displayed
    timer = setTimeout(end, 1000 * seconds + 1);
    el.addEventListener("transitionend", end);
}

// For a <transition> all the same, where there is no slot. Not by its class props: it has the same classes for entering and
// for leaving, and the end of the one would take them from the other.
export const fading = {
    css: false,
    onBeforeEnter: (el) => el.classList.add("fade"),
    onEnter: (el, done) => fade(el, true, done),
    onLeave: (el, done) => fade(el, false, done),
};

const running = new WeakMap();

// Ends what fade() started on the element, without its callback.
export function stopFade(el) {
    el.classList.remove("fade", "show");
    running.delete(el);
}

export function fade(el, show, callback = () => {}) {
    stopFade(el);
    const run = {};
    running.set(el, run);
    const unlessStopped = (f) => () => {
        if (running.get(el) === run) {
            f();
        }
    };
    el.classList.add("fade");
    el.classList.toggle("show", !show);
    nextFrame(
        unlessStopped(() => {
            el.classList.toggle("show", show);
            const done = () => {
                stopFade(el);
                callback();
            };
            afterTransition(el, unlessStopped(done));
        })
    );
}
