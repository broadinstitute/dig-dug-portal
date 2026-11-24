import { h } from "vue";
import { checkUse, functional } from "./helpers";

export default functional(
    function BBadge({ pill }, { attrs, slots }) {
        if (process.env.NODE_ENV !== "production") {
            checkUse("b-badge", { attrs, slots }, { listeners: true });
        }
        return h(
            "span",
            { class: ["badge badge-secondary", { "badge-pill": pill }] },
            slots.default?.()
        );
    },
    { props: { pill: Boolean } }
);
