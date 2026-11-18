<template>
  <div class="pkb-wrapper f-col fill-height align-h-center">
    <!-- NAV -->
    <pkb-header></pkb-header>
    <!-- BODY -->
    <div class="pkb-body mcp">
      <div class="mcp-top">
        <section class="mcp-hero" :style="{ padding: heroPad }">
          <div class="mcp-crumbs">
            <a href="https://data.pankbase.org">Data Library</a>
            <span aria-hidden="true">/</span>
            <span class="mcp-crumb-cur">AI access</span>
          </div>
          <h1 class="mcp-h1" :style="{ fontSize: m ? '34px' : '48px' }">Use PanKbase with AI assistants</h1>
          <div class="mcp-rule"></div>
          <p class="mcp-lead" :style="{ fontSize: m ? '16px' : '20px' }">The PanKbase MCP server lets AI assistants search and summarize the Data Library for you.</p>
          <div class="mcp-url-wrap">
            <label for="mcp-srv" class="mcp-label">Server URL</label>
            <div class="mcp-url-row" :style="{ flexDirection: m ? 'column' : 'row' }">
              <input id="mcp-srv" ref="srv" class="mcp-url" readonly :value="url" :style="{ fontSize: m ? '13px' : '17px' }" @focus="$event.target.select()">
              <button class="mcp-url-btn" :class="{ on: copied === 'url' }" aria-label="Copy server URL" @click="doCopy('url', url)">{{ copied === 'url' ? 'Copied ✓' : 'Copy URL' }}</button>
            </div>
          </div>
          <div class="mcp-badges"><span v-for="b in badges" :key="b" class="mcp-badge">{{ b }}</span></div>
          <div class="mcp-jump">
            <span class="mcp-label">Jump to your assistant</span>
            <div class="mcp-chips">
              <a v-for="c in chips" :key="c.name" :href="c.url" target="_blank" rel="noopener noreferrer" class="mcp-chip"><span class="mcp-chip-m" aria-hidden="true">{{ c.m }}</span>{{ c.name }}</a>
            </div>
          </div>
        </section>

        <div class="mcp-inner" :style="{ padding: m ? '16px 20px 48px' : '16px 40px 64px' }">
          <section class="mcp-sec">
            <h2 class="mcp-h2">How it works</h2>
            <ol class="mcp-flow" :style="{ gridTemplateColumns: m ? '1fr' : '1fr 90px 1fr 90px 1fr', gridTemplateRows: m ? 'auto 56px auto 56px auto' : 'auto' }">
              <li class="mcp-flow-card">
                <span class="mcp-step-tag">01 · YOU</span>
                <span class="mcp-flow-title">You ask a question</span>
                <span class="mcp-flow-sub">“How many T1D donors…?”</span>
              </li>
              <li class="mcp-beam-cell" aria-hidden="true"><div class="mcp-beam" :class="m ? 'v' : 'h'"></div></li>
              <li class="mcp-flow-card green">
                <span class="mcp-step-tag">02 · PANKBASE MCP</span>
                <span class="mcp-flow-title">Your assistant calls the PanKbase MCP server</span>
                <span class="mcp-flow-sub">Read-only search of the Data Library</span>
              </li>
              <li class="mcp-beam-cell" aria-hidden="true"><div class="mcp-beam" :class="m ? 'v' : 'h'"></div></li>
              <li class="mcp-flow-card">
                <span class="mcp-step-tag">03 · ANSWER</span>
                <span class="mcp-flow-title">Answers come back with accessions, counts and download links</span>
              </li>
            </ol>
          </section>
        </div>
      </div>

      <div class="mcp-main">
        <div class="mcp-inner mcp-stack" :style="{ padding: m ? '40px 20px 48px' : '56px 40px 72px', gap: m ? '40px' : '56px' }">
          <section id="setup" class="mcp-sec">
            <div>
              <h2 class="mcp-h2">Set it up</h2>
              <div class="mcp-muted">Pick your assistant to open its official MCP setup guide in a new tab. Use the server URL above.</div>
            </div>
            <div class="mcp-tabs" aria-label="Assistant setup guides">
              <a v-for="t in tabs" :key="t.id" :href="t.url" target="_blank" rel="noopener noreferrer" class="mcp-tab" :aria-label="t.name + ' MCP setup guide (opens in a new tab)'">{{ t.name }}<span aria-hidden="true" style="font-size:12px">↗</span></a>
            </div>
          </section>

          <section class="mcp-sec">
            <div>
              <h2 class="mcp-h2">What you can ask</h2>
              <div class="mcp-muted">Example questions to try once you are connected.</div>
            </div>
            <div class="mcp-grid" :style="{ gridTemplateColumns: caseCols, gap: '16px' }">
              <article v-for="c in cases" :key="c.title" class="mcp-case">
                <h3 class="mcp-h3">{{ c.title }}</h3>
                <blockquote class="mcp-quote">“{{ c.q }}”</blockquote>
                <div class="mcp-small"><strong>What you get:</strong> {{ c.get }}</div>
                <button class="mcp-copy" :aria-label="'Copy question: ' + c.title" @click="doCopy('q' + c.title, c.q)">{{ copied === 'q' + c.title ? 'Copied' : 'Copy question' }}</button>
              </article>
            </div>
          </section>

          <section class="mcp-sec">
            <h2 class="mcp-h2">What the server can do</h2>
            <div class="mcp-grid" :style="{ gridTemplateColumns: caseCols, gap: '12px' }">
              <div v-for="c in caps" :key="c.t" class="mcp-cap">
                <span class="mcp-cap-ic">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#219197" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path :d="c.d"></path></svg>
                </span>
                <span>
                  <span class="mcp-cap-t">{{ c.t }}</span>
                  <span class="mcp-cap-l">{{ c.l }}</span>
                </span>
              </div>
            </div>
          </section>

          <section class="mcp-sec">
            <h2 class="mcp-h2">Good to know</h2>
            <div class="mcp-grid" :style="{ gridTemplateColumns: goodCols, gap: '16px' }">
              <div class="mcp-good">
                <h3 class="mcp-h3 sm">Data citations</h3>
                <p>Cite PanKbase and partner programs (HPAP, nPOD, ADI, IIDP) per our Policies.</p>
                <a href="https://pankbase.org/policies.html">Read the Policies →</a>
              </div>
              <div class="mcp-good">
                <h3 class="mcp-h3 sm">Usage limits</h3>
                <p>Free and rate-limited. Heavy programmatic use should use the REST API.</p>
                <a href="https://pankbase.org/apis.html">API reference →</a>
              </div>
              <div class="mcp-good">
                <h3 class="mcp-h3 sm">Answers can be wrong</h3>
                <p>Check accessions in the Data Library before using results.</p>
              </div>
            </div>
          </section>

          <section class="mcp-help">
            <span class="mcp-help-t">Questions or issues?</span>
            <a href="mailto:help@pankbase.org">help@pankbase.org</a>
            <a href="https://pankbase.org/contact.html">Report a problem</a>
            <a href="https://pankbase.org/apis.html">API reference</a>
          </section>
        </div>
      </div>
    </div>
    <!-- FOOTER -->
    <pkb-footer></pkb-footer>
  </div>
</template>

<script>
const URL = "https://mcp.data.pankbase.org/mcp";
const DOCS = [
  { id: "claude", name: "Claude", m: "C", url: "https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp" },
  { id: "code", name: "Claude Code", m: ">_", url: "https://code.claude.com/docs/en/mcp" },
  { id: "science", name: "Claude Science", m: "CS", url: "https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp" },
  { id: "chatgpt", name: "ChatGPT", m: "GP", url: "https://developers.openai.com/api/docs/guides/custom-mcp-server" },
  { id: "gemini", name: "Gemini", m: "G", url: "https://geminicli.com/docs/tools/mcp-server/" },
  { id: "anti", name: "Google Antigravity", m: "A", url: "https://antigravity.google/docs/mcp" },
  { id: "vscode", name: "VS Code (Copilot)", m: "VS", url: "https://code.visualstudio.com/docs/agent-customization/mcp-servers" },
  { id: "other", name: "Other clients", m: "{}", url: "https://modelcontextprotocol.io/docs/getting-started/intro" },
];
const Q = [
  ["Cohort overview", "Summarize T1D donors by age group and autoantibody status.", "counts and distributions"],
  ["Find donors", "Which pediatric T1D donors still have detectable C-peptide?", "donor accessions with values"],
  ["Islet quality", "Find islet samples with purity above 80% and perifusion data.", "biosample list with QC fields"],
  ["Find assays", "What snATAC-seq data exists for T2D donors?", "measurement sets and linked analyses"],
  ["Get files", "Give me download links for the islet scRNA-seq reference map.", "file manifest with URLs"],
  ["Differential expression", "Which beta-cell DE results relate to glucagon secretion?", "analysis sets with traits"],
];
const CAPS = [
  ["Donors & cohorts", "Counts, distributions and donor accessions.", "M16 11a4 4 0 1 0-8 0m-4 9a8 8 0 0 1 16 0"],
  ["Biosamples & islet QC", "Biosample lists with QC fields.", "M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"],
  ["Assays (measurement sets)", "Measurement sets and their linked analyses.", "M4 20V10m5 10V4m5 16v-7m5 7V8"],
  ["Processed data & files", "Analysis sets with download links.", "M6 3h8l4 4v14H6zM14 3v4h4"],
  ["Reference genomes & annotations", "Reference files used across the library.", "M4 6c4-3 12 3 16 0M4 12c4-3 12 3 16 0M4 18c4-3 12 3 16 0"],
  ["Pipelines (workflows)", "The workflows behind processed results.", "M5 5h4v4H5zM15 15h4v4h-4zM9 7h4a2 2 0 0 1 2 2v6"],
];

export default {
  name: "MCPServerBody",
  data() {
    return {
      w: typeof window !== "undefined" ? window.innerWidth : 1280,
      copied: "",
      url: URL,
      badges: ["Free · no sign-in", "Read-only", "Rate-limited"],
      tabs: DOCS,
      cases: Q.map(([title, q, get]) => ({ title, q, get })),
      caps: CAPS.map(([t, l, d]) => ({ t, l, d })),
    };
  },
  computed: {
    m() { return this.w < 700; },
    t() { return this.w < 1000; },
    heroPad() { return this.m ? "36px 20px 24px" : "56px 40px 32px"; },
    caseCols() { return this.m ? "1fr" : this.t ? "repeat(2,minmax(0,1fr))" : "repeat(3,minmax(0,1fr))"; },
    goodCols() { return this.t ? "1fr" : "repeat(3,minmax(0,1fr))"; },
    chips() {
      return DOCS.filter((x) => x.m !== "{}").map((x) => ({
        url: x.url,
        m: x.m,
        name: x.name === "Google Antigravity" ? "Antigravity" : x.name === "VS Code (Copilot)" ? "VS Code" : x.name,
      }));
    },
  },
  mounted() { window.addEventListener("resize", this.onResize); },
  beforeDestroy() { window.removeEventListener("resize", this.onResize); clearTimeout(this.tm); },
  methods: {
    onResize() { this.w = window.innerWidth; },
    doCopy(key, text) {
      try { navigator.clipboard.writeText(text); } catch (e) { /* ignore */ }
      this.copied = key;
      clearTimeout(this.tm);
      this.tm = setTimeout(() => { this.copied = ""; }, 2000);
    },
  },
};
</script>

<style>
.mcp { width: 100%; background: #fff; color: #212529; font-family: 'Open Sans', Helvetica, Arial, sans-serif; line-height: 1.5; box-sizing: border-box; }
.mcp * { box-sizing: border-box; }
.mcp a { color: #219197; text-decoration: none; }
.mcp a:hover { color: #1a7479; text-decoration: underline; }
.mcp-top, .mcp-main { width: 100%; background: #fff; }
.mcp-hero { position: relative; max-width: 1400px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
.mcp-crumbs { display: flex; align-items: center; gap: 10px; font-size: 14px; }
.mcp-crumb-cur { color: #219197; font-weight: 600; }
.mcp-h1 { margin: 0; font-weight: 700; letter-spacing: -0.02em; line-height: 1.1; color: #173d39; }
.mcp-rule { width: 64px; height: 3px; background: #94c95e; }
.mcp-lead { margin: 0; max-width: 720px; }
.mcp-url-wrap { max-width: 780px; display: flex; flex-direction: column; gap: 8px; }
.mcp-label { font: 600 12px 'Open Sans', sans-serif; text-transform: uppercase; letter-spacing: .08em; }
.mcp-url-row { display: flex; gap: 10px; }
.mcp-url { flex: 1; min-width: 0; height: 58px; padding: 0 18px; font-family: 'IBM Plex Mono', monospace; font-weight: 500; color: #173d39; background: #fff; border: 1px solid #ced4da; border-radius: 3.5px; outline: none; transition: box-shadow .2s, border-color .2s; }
.mcp-url:focus { border-color: #219197; box-shadow: 0 0 0 3px rgba(33,145,151,.25); }
.mcp-url-btn { flex: none; height: 58px; padding: 0 26px; border-radius: 3.5px; border: 1px solid #219197; background: #219197; color: #fff; font: 600 14px 'Open Sans', sans-serif; cursor: pointer; transition: all .25s; }
.mcp-url-btn:hover, .mcp-url-btn.on { background: #1a7479; }
.mcp-url-btn.on { box-shadow: 0 10px 24px rgba(33,145,151,.35); transform: scale(1.04); }
.mcp-url-btn:focus-visible, .mcp-chip:focus-visible, .mcp-tab:focus-visible, .mcp-copy:focus-visible { outline: 3px solid #219197; outline-offset: 2px; }
.mcp-badges, .mcp-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.mcp-badge { font: 600 13px 'Open Sans', sans-serif; color: #219197; background: #e8f4f4; border: 1px solid rgba(33,145,151,.35); border-radius: 3.5px; padding: 4px 12px; }
.mcp-jump { display: flex; flex-direction: column; gap: 8px; margin-top: 6px; }
.mcp-chip { display: flex; align-items: center; gap: 8px; color: #173d39 !important; font-size: 14px; font-weight: 600; padding: 5px 12px 5px 6px; border-radius: 3.5px; background: #fff; border: 1px solid #ced4da; transition: all .15s; }
.mcp-chip:hover { background: #219197; border-color: #219197; color: #fff !important; text-decoration: none !important; }
.mcp-chip-m { width: 26px; height: 26px; border-radius: 50%; background: #e8f4f4; border: 1px solid #219197; display: flex; align-items: center; justify-content: center; font: 600 10px 'Open Sans', sans-serif; color: #219197; }
.mcp-inner { max-width: 1400px; margin: 0 auto; }
.mcp-stack { display: flex; flex-direction: column; overflow-x: hidden; }
.mcp-sec { display: flex; flex-direction: column; gap: 16px; }
.mcp-h2 { margin: 0; font-size: 24px; font-weight: 700; color: #173d39; }
.mcp-h3 { margin: 0; font-size: 18px; font-weight: 600; color: #173d39; }
.mcp-h3.sm { font-size: 17px; }
.mcp-muted { font-size: 14px; color: #6f8780; }
.mcp-small { font-size: 14px; }
.mcp-small strong { color: #173d39; }
.mcp-flow { list-style: none; margin: 0; padding: 0; display: grid; gap: 0; align-items: stretch; }
.mcp-flow-card { background: #fbfbfb; border-top: 3px solid #219197; box-shadow: 0 10px 24px rgba(19,48,44,.05); padding: 20px; display: flex; flex-direction: column; gap: 8px; }
.mcp-flow-card.green { border-top-color: #94c95e; box-shadow: 0 10px 24px rgba(33,145,151,.18); }
.mcp-step-tag { font: 600 12px 'Open Sans', sans-serif; color: #219197; }
.mcp-flow-title { font-size: 18px; font-weight: 600; color: #173d39; }
.mcp-flow-sub { font-size: 13px; }
.mcp-beam-cell { display: flex; align-items: center; justify-content: center; }
.mcp-beam { border-radius: 3px; }
.mcp-beam.h { height: 3px; width: 100%; background: linear-gradient(90deg, rgba(33,145,151,.15) 0%, #219197 50%, rgba(33,145,151,.15) 100%); background-size: 200% 100%; animation: mcpBeamX 2s linear infinite; }
.mcp-beam.v { width: 3px; height: 100%; background: linear-gradient(180deg, rgba(33,145,151,.15) 0%, #219197 50%, rgba(33,145,151,.15) 100%); background-size: 100% 200%; animation: mcpBeamY 2s linear infinite; }
@keyframes mcpBeamX { from { background-position: 0 0; } to { background-position: 200% 0; } }
@keyframes mcpBeamY { from { background-position: 0 0; } to { background-position: 0 200%; } }
@media (prefers-reduced-motion: reduce) { .mcp * { animation: none !important; transition: none !important; } }
.mcp-tabs { display: flex; gap: 8px; overflow-x: auto; padding: 4px 2px 12px; }
.mcp-tab { flex: none; white-space: nowrap; display: inline-flex; align-items: center; gap: 8px; padding: 9px 16px; border-radius: 3.5px; border: 1px solid #d9e2e0; background: #fbfbfb; color: #6f8780 !important; font: 600 14px 'Open Sans', sans-serif; transition: all .15s; }
.mcp-tab:hover { border-color: #219197; color: #173d39 !important; background: #e8f4f4; text-decoration: none !important; }
.mcp-grid { display: grid; }
.mcp-case { background: #fbfbfb; border: 1px solid #d9e2e0; border-top: 3px solid #219197; box-shadow: 0 10px 24px rgba(19,48,44,.05); padding: 20px; display: flex; flex-direction: column; gap: 12px; transition: all .2s; }
.mcp-case:hover { border-color: #219197; box-shadow: 0 10px 24px rgba(33,145,151,.22); transform: translateY(-2px); }
.mcp-quote { margin: 0; border-left: 2px solid #219197; padding: 2px 0 2px 12px; font: 400 14px/1.55 'Open Sans', sans-serif; color: #173d39; flex: 1; }
.mcp-copy { align-self: flex-start; cursor: pointer; background: transparent; border: 1px solid #219197; color: #219197; border-radius: 3.5px; padding: 7px 14px; font: 600 12px 'Open Sans', sans-serif; transition: all .2s; }
.mcp-copy:hover { background: #e8f4f4; box-shadow: 0 0 14px rgba(33,145,151,.4); }
.mcp-cap { display: flex; gap: 14px; align-items: flex-start; background: #fbfbfb; border: 1px solid #d9e2e0; padding: 16px; transition: all .2s; }
.mcp-cap:hover { border-color: #219197; box-shadow: 0 10px 24px rgba(33,145,151,.18); }
.mcp-cap-ic { flex: none; width: 38px; height: 38px; border-radius: 3.5px; border: 1px solid #219197; background: #e8f4f4; display: flex; align-items: center; justify-content: center; }
.mcp-cap-t { display: block; font-weight: 600; font-size: 16px; color: #173d39; }
.mcp-cap-l { display: block; font-size: 14px; }
.mcp-good { background: #fbfbfb; border: 1px solid #d9e2e0; border-left: 4px solid #219197; padding: 20px; display: flex; flex-direction: column; gap: 8px; }
.mcp-good p { margin: 0; font-size: 14px; flex: 1; }
.mcp-good a { font-size: 14px; font-weight: 600; }
.mcp-help { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 24px; padding: 16px 20px; background: #fbfbfb; border: 1px solid #d9e2e0; font-size: 14px; }
.mcp-help-t { font-weight: 600; color: #173d39; }
</style>
