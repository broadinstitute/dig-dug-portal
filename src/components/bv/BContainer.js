import { h } from "vue";
import { functional } from "./helpers";

export default functional(
    "b-container",
    function BContainer({ fluid }, { slots }) {
        const size = fluid === true || fluid === "" ? "fluid" : fluid;
        return h(
            "div",
            { class: size ? `container-${size}` : "container" },
            slots.default?.()
        );
    },
    { props: { fluid: [Boolean, String] } }
);
