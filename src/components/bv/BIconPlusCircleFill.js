import { functional } from "./helpers";
import { renderIcon } from "./icons";

export default functional(
    function BIconPlusCircleFill({ variant }, context) {
        return renderIcon(
            "b-icon-plus-circle-fill",
            "plus-circle-fill",
            variant,
            context
        );
    },
    { props: { variant: String }, inheritAttrs: false }
);
