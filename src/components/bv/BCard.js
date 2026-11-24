import { h } from "vue";
import { functional } from "./helpers";

export default functional(
    "b-card",
    function BCard({ noBody }, { slots }) {
        const content = slots.default?.();
        return h(
            "div",
            { class: "card" },
            noBody ? content : [h("div", { class: "card-body" }, content)]
        );
    },
    { props: { noBody: Boolean } },
    { not: ["title"] }
);
