// What PanKbase uses of BootstrapVue 2.23, for Vue 3: the same tags and markup, on Bootstrap 4 and BootstrapVue's stylesheet.
import BAlert from "./BAlert.vue";
import BBadge from "./BBadge";
import BButton from "./BButton";
import BCard from "./BCard";
import BCardBody from "./BCardBody";
import BCardText from "./BCardText";
import BCol from "./BCol";
import BContainer from "./BContainer";
import BDropdown from "./BDropdown.vue";
import BDropdownDivider from "./BDropdownDivider";
import BDropdownItem from "./BDropdownItem.vue";
import BDropdownText from "./BDropdownText";
import BFormInput from "./BFormInput.vue";
import BFormRadio from "./BFormRadio.vue";
import BFormRadioGroup from "./BFormRadioGroup.vue";
import BIcon from "./BIcon";
import BIconInfoCircleFill from "./BIconInfoCircleFill";
import BIconPlusCircleFill from "./BIconPlusCircleFill";
import BModal from "./BModal.vue";
import BPagination from "./BPagination.vue";
import BRow from "./BRow";
import BSkeletonImg from "./BSkeletonImg";
import BSkeletonWrapper from "./BSkeletonWrapper";
import BSpinner from "./BSpinner";
import BTab from "./BTab.vue";
import BTable from "./BTable";
import BTabs from "./BTabs.vue";
import BTh from "./BTh.vue";
import { bvModal } from "./modals";
import { bvToast } from "./toasts";
import tooltip from "./tooltip";

const plugin = (components) => ({
    install(app) {
        for (const [name, component] of Object.entries(components)) {
            app.component(name, component);
        }
    },
});

const components = plugin({
    BAlert,
    BBadge,
    BButton,
    BCard,
    BCardBody,
    BCardText,
    BCol,
    BContainer,
    BDropdown,
    BDropdownDivider,
    BDropdownItem,
    BDropdownText,
    BFormInput,
    BFormRadio,
    BFormRadioGroup,
    BModal,
    BPagination,
    BRow,
    BSkeletonImg,
    BSkeletonWrapper,
    BSpinner,
    BTab,
    BTable,
    BTabs,
    BTh,
});

export const BootstrapVue = {
    install(app) {
        components.install(app);
        app.directive("b-tooltip", tooltip);
        const { globalProperties } = app.config;
        globalProperties.$bvModal = bvModal;
        globalProperties.$bvToast = bvToast(app);
    },
};

export const BootstrapVueIcons = plugin({
    BIcon,
    BIconInfoCircleFill,
    BIconPlusCircleFill,
});
