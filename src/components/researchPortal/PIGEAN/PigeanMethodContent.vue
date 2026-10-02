<template>
    <div
        class="pigean-reading"
        :class="{ 'pigean-abstract': name === 'abstract' }"
    >
        <aside
            v-if="rendered.headings.length > 1"
            class="pigean-contents"
            aria-label="On this page"
        >
            <strong>In this guide</strong>
            <a
                v-for="heading in rendered.headings"
                :key="heading.id"
                :href="`#${heading.id}`"
                @click.prevent="$emit('section', heading.id)"
                >{{ heading.text }}</a
            >
        </aside>
        <div class="pigean-article-wrap">
            <p v-if="loading" role="status">Loading {{ title }}…</p>
            <b-alert v-if="error" show variant="warning"
                >{{ error }}
                <b-button size="sm" variant="outline-dark" @click="load"
                    >Retry</b-button
                ></b-alert
            >
            <article
                ref="article"
                class="pigean-prose"
                :aria-label="title"
                v-html="rendered.html"
                @click="followLink"
            ></article>
            <a
                class="pigean-markdown-link"
                :href="`/pigean/content/${name}.md`"
                download
                >Download {{ title.toLowerCase() }} Markdown</a
            >
        </div>
    </div>
</template>
<script>
import { renderMethodMarkdown } from "@/utils/pigeanMarkdown";
import "katex/dist/katex.min.css";
export default {
    props: {
        name: { type: String, required: true },
        title: { type: String, required: true },
    },
    data: () => ({
        rendered: { html: "", headings: [] },
        loading: false,
        error: null,
    }),
    watch: {
        name: {
            immediate: true,
            handler() {
                this.load();
            },
        },
    },
    beforeDestroy() {
        if (this.controller) this.controller.abort();
    },
    methods: {
        async load() {
            if (this.controller) this.controller.abort();
            const controller = new AbortController();
            this.controller = controller;
            this.loading = true;
            this.error = null;
            this.rendered = { html: "", headings: [] };
            try {
                const response = await fetch(
                    `/pigean/content/${this.name}.md`,
                    { signal: controller.signal }
                );
                if (!response.ok)
                    throw new Error(
                        `Could not load ${this.title.toLowerCase()}.`
                    );
                const source = await response.text();
                if (controller.signal.aborted) return;
                this.rendered = renderMethodMarkdown(source, this.name);
                this.$nextTick(() => this.$emit("loaded"));
            } catch (error) {
                if (!controller.signal.aborted) this.error = error.message;
            } finally {
                if (this.controller === controller) this.loading = false;
            }
        },
        followLink(event) {
            const link = event.target.closest("a");
            if (link && (link.getAttribute("href") || "").startsWith("#")) {
                event.preventDefault();
                this.$emit("section", link.getAttribute("href").slice(1));
            }
        },
    },
};
</script>
<style>
.pigean-reading {
    display: flex;
    align-items: flex-start;
    gap: 3rem;
}
.pigean-contents {
    flex: 0 0 205px;
    position: sticky;
    top: 24px;
    font-size: 14px;
    padding-top: 12px;
}
.pigean-contents strong {
    display: block;
    margin-bottom: 12px;
}
.pigean-contents a {
    display: block;
    padding: 8px 0;
    color: #496170;
    line-height: 1.4;
}
.pigean-article-wrap {
    flex: 1;
    min-width: 0;
}
.pigean-prose {
    max-width: 830px;
    font-size: 16px;
    line-height: 1.8;
    color: #273d4b;
}
.pigean-prose h1 {
    font-size: 29px;
    line-height: 1.3;
    margin: 0 0 24px;
    color: #193446;
}
.pigean-prose h2 {
    font-size: 23px;
    margin: 44px 0 18px;
    line-height: 1.4;
    scroll-margin-top: 24px;
}
.pigean-prose p,
.pigean-prose ul {
    margin-bottom: 20px;
}
.pigean-prose li {
    margin-bottom: 7px;
}
.pigean-prose a {
    color: #116c9b;
    text-decoration: underline;
    text-underline-offset: 3px;
}
.pigean-prose img {
    display: block;
    width: 100%;
    height: auto;
    margin: 24px 0;
}
.pigean-prose video {
    display: block;
    width: 100%;
    aspect-ratio: 16 / 9;
    background: #000;
    border-radius: 6px;
}
.pigean-prose figure {
    margin: 28px 0 14px;
}
.pigean-prose figcaption {
    font-size: 14px;
    line-height: 1.6;
    color: #536875;
    padding-top: 12px;
}
.pigean-prose details {
    font-size: 14px;
    margin-bottom: 24px;
}
.pigean-prose summary {
    cursor: pointer;
    color: #496170;
}
.pigean-prose details p {
    margin: 12px 0;
}
.pigean-prose .pigean-equation {
    overflow-x: auto;
    padding: 12px 6px;
    margin: 22px 0;
    background: #f5f8fa;
    border-radius: 4px;
}
.pigean-prose .katex {
    font-size: 1.08em;
}
.pigean-prose .katex-display {
    margin: 0.5em 0;
}
.pigean-markdown-link {
    display: inline-block;
    font-size: 13px;
    margin-top: 24px;
    color: #496170;
}
.pigean-abstract {
    container: pigean-abstract / inline-size;
}
.pigean-abstract .pigean-prose {
    max-width: none;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
    gap: 24px 40px;
    align-items: start;
}
.pigean-abstract .pigean-prose h1 {
    grid-column: 1 / -1;
    margin-bottom: 0;
}
.pigean-abstract-copy {
    grid-column: 1;
    grid-row: 2;
    min-width: 0;
}
.pigean-abstract .pigean-abstract-figure {
    grid-column: 2;
    grid-row: 2;
    min-width: 0;
    margin: 0;
}
.pigean-abstract-figure > a {
    display: block;
    cursor: zoom-in;
}
.pigean-abstract .pigean-abstract-figure img {
    margin: 0;
}
.pigean-abstract-figure .pigean-figure-expand {
    display: inline-block;
    margin-top: 10px;
}
/* Stack when the reading card itself can no longer hold two useful columns. */
@container pigean-abstract (max-width: 960px) {
    .pigean-abstract .pigean-prose {
        display: flex;
        flex-direction: column;
        gap: 26px;
        max-width: 720px;
        margin-inline: auto;
    }
    .pigean-abstract-copy {
        max-width: 70ch;
    }
}
/* Fallback for browsers without container queries. */
@supports not (container-type: inline-size) {
    @media (max-width: 1110px) {
        .pigean-abstract .pigean-prose {
            display: flex;
            flex-direction: column;
            gap: 26px;
            max-width: 720px;
            margin-inline: auto;
        }
    }
}
@media (max-width: 1000px) {
    .pigean-reading {
        display: block;
    }
    .pigean-contents {
        position: static;
        margin-bottom: 26px;
    }
    .pigean-contents a {
        display: inline-block;
        margin-right: 20px;
    }
}
@media (max-width: 760px) {
    .pigean-prose {
        font-size: 15px;
    }
}
</style>
