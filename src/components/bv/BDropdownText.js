import { h, mergeProps } from "vue";
import { functional, splitAttrs } from "./helpers";

export default functional(
    "b-dropdown-text",
    function BDropdownText(props, { attrs, slots }) {
        const [outer, inner] = splitAttrs(attrs);
        return h("li", mergeProps(outer, { role: "presentation" }), [
            h(
                "p",
                mergeProps(inner, { class: "b-dropdown-text" }),
                slots.default?.()
            ),
        ]);
    },
    { props: {}, inheritAttrs: false }
);
