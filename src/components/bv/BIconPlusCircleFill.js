import { functional } from "./helpers";
import { renderIcon, SUPPORTED } from "./icons";

export default functional(
    "b-icon-plus-circle-fill",
    function BIconPlusCircleFill({ variant }, { attrs }) {
        return renderIcon("plus-circle-fill", variant, attrs);
    },
    { props: { variant: String }, inheritAttrs: false },
    SUPPORTED
);
