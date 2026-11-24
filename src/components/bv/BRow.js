import { h } from "vue";
import { checkUse, functional } from "./helpers";

export default functional(
    function BRow({ noGutters }, { attrs, slots }) {
        if (process.env.NODE_ENV !== "production") {
            checkUse("b-row", { attrs, slots }, { listeners: true });
        }
        return h(
            "div",
            { class: ["row", { "no-gutters": noGutters }] },
            slots.default?.()
        );
    },
    { props: { noGutters: Boolean } }
);
