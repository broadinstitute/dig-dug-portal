import { h, mergeProps } from "vue";
import { functional, splitAttrs } from "./helpers";

export default functional(
    "b-dropdown-divider",
    function BDropdownDivider(props, { attrs }) {
        const [outer, inner] = splitAttrs(attrs);
        const own = {
            class: "dropdown-divider",
            role: "separator",
            "aria-orientation": "horizontal",
        };
        return h("li", mergeProps(outer, { role: "presentation" }), [
            h("hr", mergeProps(inner, own)),
        ]);
    },
    { props: {}, inheritAttrs: false },
    { slots: [] }
);
