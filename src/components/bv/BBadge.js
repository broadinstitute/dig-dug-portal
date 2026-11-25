import { h } from "vue";
import { functional } from "./helpers";

export default functional(
    "b-badge",
    function BBadge({ pill }, { slots }) {
        return h(
            "span",
            { class: ["badge badge-secondary", { "badge-pill": pill }] },
            slots.default?.()
        );
    },
    { props: { pill: Boolean } }
);
