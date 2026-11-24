import { h } from "vue";
import { checkUse, functional } from "./helpers";

export default functional(
    function BContainer({ fluid }, { attrs, slots }) {
        if (process.env.NODE_ENV !== "production") {
            checkUse("b-container", { attrs, slots }, { listeners: true });
        }
        const size = fluid === true || fluid === "" ? "fluid" : fluid;
        return h(
            "div",
            { class: size ? `container-${size}` : "container" },
            slots.default?.()
        );
    },
    { props: { fluid: [Boolean, String] } }
);
