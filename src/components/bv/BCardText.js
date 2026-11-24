import { h } from "vue";
import { functional } from "./helpers";

export default functional(
    "b-card-text",
    function BCardText(props, { slots }) {
        return h("p", { class: "card-text" }, slots.default?.());
    },
    // declared, if only to let every attribute through
    { props: {} }
);
