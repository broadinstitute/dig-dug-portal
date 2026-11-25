import { Comment, Fragment, h, mergeProps, reactive } from "vue";
import { checksUse, nextId, splitAttrs } from "./helpers";
import {
    checkKeys,
    countsAsClick,
    filterItems,
    get,
    looseEqual,
    normalizeFields,
    sortItems,
    startCase,
    toText,
} from "./table";

const ENTER = 13;
const SPACE = 32;
const END = 35;
const HOME = 36;
const UP = 38;
const DOWN = 40;

const atLeast = (least, value) => Math.max(least, parseInt(value, 10) || 0);

// In Vue 3 a slot with a false `v-if` gives a comment.
const isEmpty = (vnodes) =>
    vnodes.length === 0 || (vnodes.length === 1 && vnodes[0].type === Comment);

function slotFor(slots, kind, key) {
    return slots[`${kind}(${key})`] || slots[`${kind}(${key.toLowerCase()})`];
}

// One component, with plain rows and cells. (In BootstrapVue rows and header cells are components too.)
export default {
    name: "BTable",
    // attributes, listeners and v-model as in plain Vue 3, also under a compat parent
    compatConfig: { MODE: 3 },
    mixins: checksUse("b-table", {
        attributes: ["detail-key"],
        not: ["aria-busy", "aria-colcount", "aria-describedby"],
        slots: [/^cell\(.*\)$/, /^head\(.+\)$/, "row-details", "thead-top"],
    }),
    inheritAttrs: false,
    props: {
        bordered: Boolean,
        currentPage: { type: [Number, String], default: 1 },
        emptyText: { type: String, default: "There are no records to show" },
        // (the defaults of BootstrapVue: a page that passes `undefined` passes what one that passes nothing does, and no change comes of it)
        fields: { type: Array, default: null },
        filter: String,
        headVariant: String,
        hover: Boolean,
        id: String,
        items: Array,
        // v-model gets the rows that are shown; what is put in has no effect
        modelValue: Array,
        noSortReset: Boolean,
        // a prop, because rows can be focused if there is a listener
        onRowClicked: [Function, Array],
        perPage: { type: [Number, String], default: 0 },
        responsive: [Boolean, String],
        showEmpty: Boolean,
        small: Boolean,
        sortBy: String,
        sortDesc: { type: Boolean, default: false },
        sortIconLeft: Boolean,
        sortNullLast: Boolean,
        // of a field, not of the table: here it is an attribute
        sortable: Boolean,
        // `true`, or the height
        stickyHeader: [Boolean, String],
        striped: Boolean,
        tableClass: [Array, Object, String],
        tbodyTrClass: [Array, Function, Object, String],
    },
    emits: ["filtered", "update:modelValue", "update:sortBy"],
    data() {
        return {
            localSortBy: this.sortBy || "",
            localSortDesc: this.sortDesc || false,
            ownId: nextId(),
        };
    },
    computed: {
        tableId() {
            return this.id || this.ownId;
        },
        // Reactive also if the page's are not: `toggleDetails`, and pages, set `_showDetails` and other keys of an item.
        // BootstrapVue's copy in data() does that.
        localItems() {
            const items = Array.isArray(this.items) ? this.items : [];
            return items.map((item) =>
                item !== null && typeof item === "object"
                    ? reactive(item)
                    : item
            );
        },
        columns() {
            const columns = normalizeFields(this.fields, this.localItems);
            if (process.env.NODE_ENV !== "production") {
                checkKeys("field", this.fields || [], this.$parent);
            }
            return columns;
        },
        isSortable() {
            return this.columns.some((field) => field.sortable);
        },
        // what is not a text is no filter (BootstrapVue takes a RegExp too)
        localFilter() {
            return typeof this.filter === "string" ? this.filter : "";
        },
        filteredItems() {
            return this.localFilter && this.localItems.length > 0
                ? filterItems(this.localItems, this.localFilter, this.columns)
                : this.localItems;
        },
        sortedItems() {
            return this.localSortBy
                ? sortItems(
                      this.filteredItems,
                      this.localSortBy,
                      this.localSortDesc,
                      this.sortNullLast
                  )
                : this.filteredItems;
        },
        // the rows
        computedItems() {
            const perPage = atLeast(0, this.perPage);
            const start = (atLeast(1, this.currentPage) - 1) * perPage;
            return perPage
                ? this.sortedItems.slice(start, start + perPage)
                : this.sortedItems.slice();
        },
        toEmit() {
            return {
                rows: this.computedItems,
                filteredItems: this.filteredItems,
                localItems: this.localItems,
                filter: this.localFilter,
                sortBy: this.localSortBy,
            };
        },
    },
    watch: {
        sortBy(value) {
            this.localSortBy = value || "";
        },
        sortDesc(value) {
            this.localSortDesc = value || false;
        },
        // one watcher for all events, so that they come in BootstrapVue's order
        toEmit(now, before) {
            if (!looseEqual(now.rows, before.rows)) {
                this.$emit("update:modelValue", now.rows);
            }
            const changed = ["filteredItems", "localItems", "filter"].some(
                (key) => now[key] !== before[key]
            );
            if (changed && (now.filter || before.filter)) {
                const rows = now.filter ? now.filteredItems : now.localItems;
                this.$emit("filtered", rows, rows.length);
            }
            if (now.sortBy !== before.sortBy) {
                this.$emit("update:sortBy", now.sortBy);
            }
        },
    },
    mounted() {
        this.$emit("update:modelValue", this.computedItems);
    },
    methods: {
        headClicked(event, field) {
            if (!countsAsClick(event, this.$el)) {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            if (field.sortable && this.localSortBy === field.key) {
                this.localSortDesc = !this.localSortDesc;
            } else if (field.sortable) {
                this.localSortBy = field.key;
                this.localSortDesc = false;
            } else if (this.localSortBy && !this.noSortReset) {
                this.localSortBy = "";
                this.localSortDesc = false;
            }
        },
        // the rows of items, which can be focused (not details)
        itemRows() {
            return [...this.$refs.tbody.children].filter(
                (row) => row.tabIndex === 0
            );
        },
        // `items`: the rows of the last render, which the elements are of (`computedItems` can be ahead of them)
        rowClicked(event, items) {
            if (countsAsClick(event, this.$refs.tbody)) {
                const row = event.target.closest("tr");
                const index = this.itemRows().indexOf(row);
                if (index > -1) {
                    this.$emit("row-clicked", items[index], index, event);
                }
            }
        },
        rowKeydown(event, items) {
            const { keyCode, shiftKey, target } = event;
            const rows = this.itemRows();
            const index = rows.indexOf(target);
            if (index === -1 || target !== document.activeElement) {
                return;
            }
            const last = rows.length - 1;
            const to = {
                [HOME]: 0,
                [UP]: shiftKey ? 0 : index - 1,
                [DOWN]: shiftKey ? last : index + 1,
                [END]: last,
            }[keyCode];
            if (to === undefined && keyCode !== ENTER && keyCode !== SPACE) {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            if (to === undefined) {
                this.rowClicked(event, items);
            } else if (rows[to]) {
                rows[to].focus();
            }
        },
        sortLabel(field) {
            if (!field.sortable) {
                return this.isSortable && this.localSortBy && !this.noSortReset
                    ? "Click to clear sorting"
                    : "";
            }
            return this.localSortBy === field.key && !this.localSortDesc
                ? "Click to sort descending"
                : "Click to sort ascending";
        },
        renderHead() {
            const { columns, headVariant, isSortable, $slots: slots } = this;
            const cells = columns.map((field, index) => {
                const { key, label, sortable } = field;
                const sorted = this.localSortDesc ? "descending" : "ascending";
                const sortLabel = this.sortLabel(field);
                const props = {
                    key,
                    class: [
                        // Bootstrap's table has no background that a sticky cell could inherit
                        this.stickyHeader && !headVariant
                            ? "table-b-table-default"
                            : "",
                        { "position-relative": sortLabel },
                        field.class,
                        field.thClass,
                        {
                            "b-table-sort-icon-left":
                                sortable && this.sortIconLeft,
                        },
                    ],
                    style: field.thStyle,
                    role: "columnheader",
                    scope: "col",
                    "aria-colindex": index + 1,
                };
                if (!label.trim()) {
                    props["aria-label"] = startCase(key);
                }
                if (isSortable) {
                    const click = (event) => this.headClicked(event, field);
                    props.onClick = click;
                    props.onKeydown = (event) => {
                        if ([ENTER, SPACE].includes(event.keyCode)) {
                            click(event);
                        }
                    };
                }
                if (sortable) {
                    props.tabindex = "0";
                    props["aria-sort"] =
                        this.localSortBy === key ? sorted : "none";
                }
                const slot = slotFor(slots, "head", key);
                let content = slot && slot({ label, column: key, field });
                if (!content || isEmpty(content)) {
                    content = [h("div", label)];
                }
                return h("th", props, [
                    ...content,
                    sortLabel
                        ? h("span", { class: "sr-only" }, ` (${sortLabel})`)
                        : null,
                ]);
            });
            const top = slots["thead-top"];
            return h(
                "thead",
                {
                    key: "thead",
                    class: headVariant ? `thead-${headVariant}` : "",
                    role: "rowgroup",
                },
                [
                    h(
                        Fragment,
                        { key: "top" },
                        top
                            ? top({ columns: columns.length, fields: columns })
                            : []
                    ),
                    h("tr", { key: "row", class: "", role: "row" }, cells),
                ]
            );
        },
        renderCell({ field, slot }, index, item, rowIndex) {
            const { key, formatter, tdClass } = field;
            let value = get(item, key, null);
            if (typeof formatter === "function") {
                value = formatter(value, key, item);
            }
            return h(
                "td",
                {
                    key: `${index}-${key}`,
                    class: [
                        field.class,
                        typeof tdClass === "function"
                            ? tdClass(get(item, key, ""), key, item)
                            : tdClass,
                    ],
                    role: "cell",
                    "aria-colindex": index + 1,
                },
                slot
                    ? slot({
                          item,
                          index: rowIndex,
                          field,
                          unformatted: get(item, key, ""),
                          value: value ?? "",
                          toggleDetails: () => this.toggleDetails(item),
                          detailsShowing: Boolean(item._showDetails),
                      })
                    : toText(value)
            );
        },
        toggleDetails(item) {
            if (this.$slots["row-details"]) {
                item._showDetails = !item._showDetails;
            }
        },
        rowClass(item, kind) {
            const { tbodyTrClass } = this;
            return typeof tbodyTrClass === "function"
                ? tbodyTrClass(item, kind)
                : tbodyTrClass;
        },
        renderRow(item, index, cells) {
            const { columns, currentPage, perPage, $slots: slots } = this;
            const details = slots["row-details"];
            const isOpen = item._showDetails && details;
            const detailsId = isOpen
                ? `${this.tableId}__details_${index}_`
                : null;
            const rows = [
                h(
                    "tr",
                    {
                        // Rows are known by their place: what is in them lives on when the table is sorted or paged.
                        key: `row-${index}`,
                        class: [
                            this.rowClass(item, "row"),
                            { "b-table-has-details": isOpen },
                        ],
                        role: "row",
                        tabindex: this.onRowClicked ? "0" : null,
                        "aria-details": detailsId,
                        "aria-owns": detailsId,
                        "aria-rowindex":
                            currentPage && perPage > 0
                                ? (currentPage - 1) * perPage + index + 1
                                : null,
                    },
                    cells.map((cell, n) =>
                        this.renderCell(cell, n, item, index)
                    )
                ),
            ];
            if (isOpen) {
                if (this.striped) {
                    // keeps the stripes of the next rows
                    rows.push(
                        h("tr", {
                            key: `stripe-${index}`,
                            class: "d-none",
                            role: "presentation",
                            "aria-hidden": "true",
                        })
                    );
                }
                rows.push(
                    h(
                        "tr",
                        {
                            key: `details-${index}`,
                            id: detailsId,
                            class: [
                                "b-table-details",
                                this.rowClass(item, "row-details"),
                            ],
                            role: "row",
                            tabindex: "-1",
                        },
                        [
                            h(
                                "td",
                                {
                                    class: "",
                                    colspan: columns.length || null,
                                    role: "cell",
                                },
                                details({
                                    item,
                                    index,
                                    fields: columns,
                                    toggleDetails: () =>
                                        this.toggleDetails(item),
                                })
                            ),
                        ]
                    )
                );
            }
            return rows;
        },
        renderEmpty() {
            const text = this.localFilter
                ? "There are no records matching your request"
                : this.emptyText;
            return h(
                "tr",
                {
                    key: this.localFilter ? "empty-filtered" : "empty",
                    class: [
                        "b-table-empty-row",
                        this.rowClass(null, "row-empty"),
                    ],
                    role: "row",
                },
                [
                    h(
                        "td",
                        {
                            class: "",
                            colspan: this.columns.length || null,
                            role: "cell",
                        },
                        [
                            h("div", { role: "alert", "aria-live": "polite" }, [
                                h("div", { class: "text-center my-2" }, text),
                            ]),
                        ]
                    ),
                ]
            );
        },
        renderBody() {
            const { columns, computedItems, $slots: slots } = this;
            if (process.env.NODE_ENV !== "production") {
                checkKeys("item", computedItems);
            }
            const cells = columns.map((field) => ({
                field,
                slot: slotFor(slots, "cell", field.key) || slots["cell()"],
            }));
            const rows = computedItems.flatMap((item, index) =>
                this.renderRow(item, index, cells)
            );
            if (this.showEmpty && computedItems.length === 0) {
                rows.push(this.renderEmpty());
            }
            return h(
                "tbody",
                {
                    key: "tbody",
                    ref: "tbody",
                    role: "rowgroup",
                    onClick:
                        this.onRowClicked &&
                        ((event) => this.rowClicked(event, computedItems)),
                    onKeydown:
                        this.onRowClicked &&
                        ((event) => this.rowKeydown(event, computedItems)),
                },
                rows
            );
        },
    },
    render() {
        const { columns, computedItems, responsive, stickyHeader } = this;
        const [outer, inner] = splitAttrs(this.$attrs);
        const count = this.filteredItems.length;
        const table = {
            key: "table",
            class: [
                "table b-table",
                this.tableClass,
                {
                    "table-striped": this.striped,
                    "table-hover": this.hover && computedItems.length > 0,
                    "table-bordered": this.bordered,
                    "table-sm": this.small,
                },
            ],
            "aria-rowcount": count > computedItems.length ? count : null,
            sortable: this.sortable ? "sortable" : null,
            ...inner,
            id: this.tableId,
            role: inner.role || "table",
            "aria-busy": "false",
            "aria-colcount": columns.length,
        };
        const content = [
            columns.length > 0 ? this.renderHead() : null,
            this.renderBody(),
        ];
        if (!responsive && !stickyHeader) {
            return h("table", mergeProps(table, outer), content);
        }
        const wrapper = {
            key: "wrapper",
            class: [
                stickyHeader ? "b-table-sticky-header" : "",
                responsive
                    ? `table-responsive${
                          responsive === true ? "" : `-${responsive}`
                      }`
                    : "",
            ],
            style: {
                maxHeight:
                    typeof stickyHeader === "string" ? stickyHeader : null,
            },
        };
        return h("div", mergeProps(wrapper, outer), [
            h("table", table, content),
        ]);
    },
};
