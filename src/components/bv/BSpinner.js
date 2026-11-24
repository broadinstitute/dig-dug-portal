import { h, mergeProps } from "vue";
import { checkUse, functional } from "./helpers";

export default functional(
    function BSpinner({ small, variant }, { attrs, slots }) {
        if (process.env.NODE_ENV !== "production") {
            checkUse(
                "b-spinner",
                { attrs, slots },
                { listeners: true, slots: [] }
            );
        }
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
    { props: { small: Boolean, variant: String }, inheritAttrs: false }
);
