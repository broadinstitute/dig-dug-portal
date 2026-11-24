import { h } from "vue";
import { checkUse, functional } from "./helpers";

export default functional(
    function BCardBody({ title }, { attrs, slots }) {
        if (process.env.NODE_ENV !== "production") {
            checkUse("b-card-body", { attrs, slots }, { listeners: true });
        }
        const heading = title ? h("h4", { class: "card-title" }, title) : null;
        return h("div", { class: "card-body" }, [heading, slots.default?.()]);
    },
    { props: { title: String } }
);
