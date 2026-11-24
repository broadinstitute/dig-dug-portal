import { h } from "vue";
import { functional } from "./helpers";

export default functional(
    "b-col",
    function BCol({ cols }, { slots }) {
        return h(
            "div",
            { class: cols ? `col-${cols}` : "col" },
            slots.default?.()
        );
    },
    { props: { cols: [Number, String] } }
);
