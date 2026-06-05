<template>
    <div class="wkb-markdown-block">
        <template v-for="(block, index) in blocks">
            <ul v-if="block.type === 'list'" :key="`list-${index}`" class="wkb-markdown-list">
                <li v-for="(item, itemIndex) in block.items" :key="`item-${index}-${itemIndex}`">
                    {{ item }}
                </li>
            </ul>
            <h3
                v-else-if="block.type === 'h3'"
                :key="`h3-${index}`"
                class="wkb-markdown-h3"
            >
                {{ block.text }}
            </h3>
            <h2
                v-else-if="block.type === 'h2'"
                :key="`h2-${index}`"
                class="wkb-markdown-h2"
            >
                {{ block.text }}
            </h2>
            <h1
                v-else-if="block.type === 'h1'"
                :key="`h1-${index}`"
                class="wkb-markdown-h1"
            >
                {{ block.text }}
            </h1>
            <p v-else :key="`p-${index}`" class="wkb-markdown-p">
                {{ block.text }}
            </p>
        </template>
    </div>
</template>

<script>
function parseMarkdownBlocks(text) {
    const lines = String(text || "").split(/\r?\n/);
    const blocks = [];
    let index = 0;
    while (index < lines.length) {
        const line = lines[index].trimEnd();
        if (!line.trim()) {
            index += 1;
            continue;
        }
        if (line.startsWith("- ")) {
            const items = [];
            while (index < lines.length && lines[index].trim().startsWith("- ")) {
                items.push(lines[index].trim().slice(2));
                index += 1;
            }
            blocks.push({ type: "list", items });
            continue;
        }
        if (line.startsWith("### ")) {
            blocks.push({ type: "h3", text: line.slice(4) });
            index += 1;
            continue;
        }
        if (line.startsWith("## ")) {
            blocks.push({ type: "h2", text: line.slice(3) });
            index += 1;
            continue;
        }
        if (line.startsWith("# ")) {
            blocks.push({ type: "h1", text: line.slice(2) });
            index += 1;
            continue;
        }
        const paragraph = [line];
        index += 1;
        while (
            index < lines.length &&
            lines[index].trim() &&
            !lines[index].trim().startsWith("- ") &&
            !lines[index].trim().startsWith("#")
        ) {
            paragraph.push(lines[index].trim());
            index += 1;
        }
        blocks.push({ type: "p", text: paragraph.join(" ") });
    }
    return blocks;
}

export default {
    name: "WorkspaceMarkdownBlock",
    props: {
        text: {
            type: String,
            default: "",
        },
    },
    computed: {
        blocks() {
            return parseMarkdownBlocks(this.text);
        },
    },
};
</script>

<style scoped>
.wkb-markdown-block {
    font-size: 13px;
    line-height: 1.55;
    color: var(--cfde-ink, #33363d);
}

.wkb-markdown-h1,
.wkb-markdown-h2,
.wkb-markdown-h3 {
    margin: 0 0 8px;
    font-weight: 700;
    color: var(--cfde-blue, #2c5c97);
}

.wkb-markdown-h1 {
    font-size: 1.05rem;
}

.wkb-markdown-h2 {
    font-size: 0.98rem;
}

.wkb-markdown-h3 {
    font-size: 0.94rem;
}

.wkb-markdown-p {
    margin: 0 0 10px;
}

.wkb-markdown-list {
    margin: 0 0 12px;
    padding-left: 1.2rem;
}

.wkb-markdown-list li {
    margin-bottom: 4px;
}
</style>
