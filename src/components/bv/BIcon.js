import { warn } from "vue";
import { functional } from "./helpers";
import { ICONS, renderIcon } from "./icons";

export default functional(
    function BIcon({ icon, variant }, context) {
        if (process.env.NODE_ENV !== "production" && icon && !ICONS[icon]) {
            warn(`[bv] <b-icon> has no icon "${icon}": add it to icons.js`);
        }
        return renderIcon(
            "b-icon",
            ICONS[icon] ? icon : "blank",
            variant,
            context
        );
    },
    { props: { icon: String, variant: String }, inheritAttrs: false }
);
