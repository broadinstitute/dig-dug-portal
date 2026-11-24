import { warn } from "vue";
import { functional } from "./helpers";
import { ICONS, renderIcon, SUPPORTED } from "./icons";

export default functional(
    "b-icon",
    function BIcon({ icon, variant }, { attrs }) {
        if (process.env.NODE_ENV !== "production" && icon && !ICONS[icon]) {
            warn(`[bv] <b-icon> has no icon "${icon}": add it to icons.js`);
        }
        return renderIcon(ICONS[icon] ? icon : "blank", variant, attrs);
    },
    { props: { icon: String, variant: String }, inheritAttrs: false },
    SUPPORTED
);
