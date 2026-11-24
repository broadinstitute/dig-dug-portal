import { h } from "vue";
import { checkUse, functional } from "./helpers";

export default functional(
    function BCard({ noBody }, { attrs, slots }) {
        if (process.env.NODE_ENV !== "production") {
            checkUse(
                "b-card",
                { attrs, slots },
                { listeners: true, not: ["title"] }
            );
        }
        const content = slots.default?.();
        return h(
            "div",
            { class: "card" },
            noBody ? content : [h("div", { class: "card-body" }, content)]
        );
    },
    { props: { noBody: Boolean } }
);
