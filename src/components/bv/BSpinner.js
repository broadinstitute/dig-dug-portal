import { h, mergeProps } from "vue";
import { functional } from "./helpers";

export default functional(
    "b-spinner",
    function BSpinner({ small, variant }, { attrs }) {
        const look = [
            "spinner-border",
            { "spinner-border-sm": small, [`text-${variant}`]: variant },
        ];
        // without a label it is decoration, whatever the attributes say
        return h(
            "span",
            mergeProps(attrs, {
                class: look,
                role: null,
                "aria-hidden": "true",
            })
        );
    },
    { props: { small: Boolean, variant: String }, inheritAttrs: false },
    { slots: [] }
);
