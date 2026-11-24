import { h } from "vue";
import { functional } from "./helpers";

export default functional(
    "b-card-body",
    function BCardBody({ title }, { slots }) {
        const heading = title ? h("h4", { class: "card-title" }, title) : null;
        return h("div", { class: "card-body" }, [heading, slots.default?.()]);
    },
    { props: { title: String } }
);
