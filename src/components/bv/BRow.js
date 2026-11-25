import { h } from "vue";
import { functional } from "./helpers";

export default functional(
    "b-row",
    function BRow({ noGutters }, { slots }) {
        return h(
            "div",
            { class: ["row", { "no-gutters": noGutters }] },
            slots.default?.()
        );
    },
    { props: { noGutters: Boolean } }
);
