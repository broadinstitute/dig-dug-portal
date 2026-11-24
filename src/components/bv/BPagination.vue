<template>
    <ul
        class="pagination b-pagination"
        :class="size ? `pagination-${size}` : null"
        role="menubar"
        aria-disabled="false"
        aria-label="Pagination"
        @keydown="move"
    >
        <li
            v-for="item in items"
            :key="item.key"
            class="page-item"
            :class="item.class"
            :role="item.dots ? 'separator' : 'presentation'"
            :aria-hidden="item.off ? 'true' : null"
        >
            <span v-if="item.dots" class="page-link">…</span>
            <span
                v-else-if="item.off"
                v-bind="item.attrs"
                class="page-link"
                aria-disabled="true"
                >{{ item.text }}</span
            >
            <button
                v-else
                v-bind="item.attrs"
                class="page-link"
                type="button"
                @click.capture="go($event, item.page)"
                @keydown="pressOnSpace"
            >
                {{ item.text }}
            </button>
        </li>
    </ul>
</template>

<script>
import { focusOn, isVisible, stopEvent, toInteger } from "./dom";
import { checksUse } from "./helpers";

// how many page numbers there is room for
const LIMIT = 5;

function clamp(value, pages) {
    return Math.min(Math.max(toInteger(value) || 1, 1), pages);
}

export default {
    name: "BPagination",
    // attributes, listeners and v-model as in plain Vue 3, also under a compat parent
    compatConfig: { MODE: 3 },
    mixins: checksUse("b-pagination", { slots: [] }),
    props: {
        ariaControls: String,
        modelValue: [Number, String],
        perPage: [Number, String],
        size: String,
        totalRows: [Number, String],
        // with @input, instead of v-model
        value: [Number, String],
    },
    emits: ["input", "update:modelValue"],
    data() {
        const page = toInteger(this.modelValue ?? this.value, 0);
        // below 1: no page is the current one
        const current = page > 0 ? page : -1;
        // `told` is what the parent knows
        return { current, told: current };
    },
    computed: {
        rows() {
            return Math.max(toInteger(this.totalRows) || 0, 0);
        },
        rowsPerPage() {
            return Math.max(toInteger(this.perPage) || 20, 1);
        },
        pages() {
            return Math.max(Math.ceil(this.rows / this.rowsPerPage), 1);
        },
        inputs() {
            const model = this.modelValue ?? this.value ?? null;
            return [model, this.pages, this.rows, this.rowsPerPage];
        },
        shown() {
            return clamp(this.current, this.pages);
        },
        numbers() {
            const { pages, shown } = this;
            if (pages <= LIMIT) {
                return [1, pages];
            }
            if (shown < LIMIT - 1) {
                return [1, LIMIT - 1];
            }
            if (shown > pages - LIMIT + 2) {
                return [pages - LIMIT + 2, pages];
            }
            return [shown - 1, shown + 1];
        },
        items() {
            const { current, pages, shown } = this;
            const [first, last] = this.numbers;
            const list = [];
            for (let page = first; page <= last; page++) {
                list.push(this.number(page));
            }
            const dots = { dots: true, class: "disabled bv-d-xs-down-none" };
            if (first > 1) {
                list.unshift({ ...dots, key: "before" });
            }
            if (last < pages) {
                list.push({ ...dots, key: "after" });
            }
            const atStart = current < 1 || shown === 1;
            const atEnd = current < 1 || shown === pages;
            return [
                this.end("first", "«", 1, atStart),
                this.end("previous", "‹", shown - 1, atStart),
                ...list,
                this.end("next", "›", shown + 1, atEnd),
                this.end("last", "»", pages, atEnd),
            ];
        },
    },
    watch: {
        current: "tell",
        // one watcher for all of them: their order counts
        inputs(
            [model, pages, rows, rowsPerPage],
            [oldModel, oldPages, oldRows, oldRowsPerPage]
        ) {
            if (model !== oldModel) {
                this.current = clamp(model, oldPages);
                this.tell();
            }
            if (
                (rowsPerPage !== oldRowsPerPage && rows === oldRows) ||
                (pages !== oldPages && this.current > pages)
            ) {
                this.current = 1;
                this.tell();
            }
        },
    },
    created() {
        this.$nextTick(() => {
            this.current = Math.min(Math.max(this.current, 0), this.pages);
        });
    },
    methods: {
        tell() {
            if (this.current !== this.told) {
                this.told = this.current;
                const page = this.current > 0 ? this.current : null;
                this.$emit("update:modelValue", page);
                this.$emit("input", page);
            }
        },
        end(name, text, page, off) {
            return {
                key: name,
                text,
                page,
                off,
                class: { disabled: off },
                attrs: {
                    role: "menuitem",
                    tabindex: off ? null : "-1",
                    "aria-label": `Go to ${name} page`,
                    "aria-controls": this.ariaControls || null,
                },
            };
        },
        number(page) {
            const { current, pages, shown } = this;
            const [first, last] = this.numbers;
            const active = page === shown && current > 0;
            // a narrow screen has room for three
            let hidden = false;
            if (last - first > 2) {
                const from = Math.min(Math.max(shown - 1, first), last - 2);
                hidden = page < from || page > from + 2;
            }
            return {
                key: `page-${page}`,
                text: page,
                page,
                class: { active, "bv-d-xs-down-none": hidden },
                attrs: {
                    role: "menuitemradio",
                    tabindex:
                        active || (current < 1 && page === first) ? "0" : "-1",
                    "aria-label": `Go to page ${page}`,
                    "aria-checked": active ? "true" : "false",
                    "aria-controls": this.ariaControls || null,
                    "aria-posinset": page,
                    "aria-setsize": pages,
                },
            };
        },
        go({ target }, page) {
            if (page === this.current) {
                return;
            }
            this.current = page;
            this.$nextTick(() => {
                if (!isVisible(target) || !this.$el.contains(target)) {
                    this.$nextTick(this.focusCurrent);
                } else {
                    focusOn(target);
                }
            });
        },
        buttons() {
            return [...this.$el.querySelectorAll("button.page-link")].filter(
                isVisible
            );
        },
        focusCurrent() {
            const buttons = this.buttons();
            const button = buttons.find(
                (el) =>
                    toInteger(el.getAttribute("aria-posinset")) === this.shown
            );
            focusOn(button || buttons[0]);
        },
        move(event) {
            const { keyCode, shiftKey } = event;
            const back = keyCode === 37 || keyCode === 38;
            if (!back && keyCode !== 39 && keyCode !== 40) {
                return;
            }
            event.preventDefault();
            this.$nextTick(() => {
                const buttons = this.buttons();
                if (shiftKey) {
                    focusOn(buttons[back ? 0 : buttons.length - 1]);
                } else {
                    const at = buttons.indexOf(document.activeElement);
                    focusOn(buttons[back ? at - 1 : at + 1]);
                }
            });
        },
        pressOnSpace(event) {
            if (event.keyCode === 32) {
                stopEvent(event);
                event.stopImmediatePropagation();
                event.currentTarget.click();
            }
        },
    },
};
</script>
