import { h } from "vue";
import { checkUse, functional } from "./helpers";

export default functional(
    function BCol({ cols }, { attrs, slots }) {
        if (process.env.NODE_ENV !== "production") {
            checkUse("b-col", { attrs, slots }, { listeners: true });
        }
        return h(
            "div",
            { class: cols ? `col-${cols}` : "col" },
            slots.default?.()
        );
    },
    { props: { cols: [Number, String] } }
);
