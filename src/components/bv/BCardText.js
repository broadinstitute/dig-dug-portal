import { h } from "vue";
import { checkUse, functional } from "./helpers";

export default functional(
    function BCardText(props, { attrs, slots }) {
        if (process.env.NODE_ENV !== "production") {
            checkUse("b-card-text", { attrs, slots }, { listeners: true });
        }
        return h("p", { class: "card-text" }, slots.default?.());
    },
    // declared, if only to let every attribute through
    { props: {} }
);
