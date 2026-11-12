<template>
    <div>
        <div class="kp-body">
  <!-- Intro panel -->
  <div class="card"><div class="card-body intro">
    <div class="intro-top">
      <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden="true">
        <polygon points="36,3 65,19.5 65,52.5 36,69 7,52.5 7,19.5" fill="#fff" stroke="#c6defa" stroke-width="3"/>
        <circle cx="29" cy="31" r="12" fill="#117733" fill-opacity=".8"/>
        <circle cx="43" cy="31" r="12" fill="#CC6677" fill-opacity=".8"/>
        <circle cx="36" cy="43" r="12" fill="#332288" fill-opacity=".8"/>
      </svg>
      <p>The T2D Tissue Explorer links the <b>tissues of action</b> in type 2 diabetes to the <b>in vitro models</b> available for each
      tissue and to the <b>physiological assays</b> that can be run on them. 4 tissues, 46 models and 81 assays
      (42 in vitro) are connected through four physiological categories: insulin responsiveness and glucose handling, insulin secretion, energy balance, lipid metabolism.</p>
    </div>
    <div class="flow" aria-hidden="true">
      <div class="step"><span class="step-head"><span class="step-num">1</span>Choose a tissue</span><span class="pill">Tissue</span></div>
      <span class="arrow">&#10140;</span>
      <div class="step"><span class="step-head"><span class="step-num">2</span>Choose a model or category</span><span class="pill">Model</span></div>
      <span class="arrow">&#10140;</span>
      <div class="step"><span class="step-head"><span class="step-num">3</span>View compatible assays</span><span class="pill result">Assays</span></div>
    </div>
    <div class="intro-foot">Works in both directions: choose an assay to see which tissues and models it can be used with.</div>
  </div></div>

  <!-- Search criteria -->
  <div class="card"><div class="card-body">
    <h1 class="card-title">T2D Tissue Explorer</h1>
    <p class="card-lead">Start by choosing a tissue, then narrow down by physiological category or model — or pick an assay to work backwards.</p>
    <h4 class="card-title">Build search criteria</h4>
    <div class="filtering-ui">
      <div class="filter-col"><label for="f-tissue">Tissue</label><select class="form-control" id="f-tissue" data-f="tissue"></select></div>
      <div class="filter-col"><label for="f-cat">Physiological category</label><select class="form-control" id="f-cat" data-f="cat"></select></div>
      <div class="filter-col"><label for="f-model">Model</label><select class="form-control" id="f-model" data-f="model"></select></div>
      <div class="filter-col"><label for="f-assay">Assay</label><select class="form-control" id="f-assay" data-f="assay"></select></div>
      <div class="filter-col"><button class="btn btn-outline" data-act="reset">Clear</button></div>
      <div class="filter-col"><button class="btn btn-primary" data-act="copy">Copy link</button></div>
    </div>
    <div class="status" id="status"></div>
  </div></div>

  <!-- 1. Coverage -->
  <div class="card"><div class="card-body">
    <h4 class="card-title">Coverage: tissue × physiological category</h4>
    <p class="card-sub">Number of in vitro models per tissue used for each category, split by model type. Click a cell to focus on it; dashed cells are gaps.</p>
    <div class="cov-scroll"><table class="cov" id="cov"></table></div>
    <div class="type-legend" id="type-legend"></div>
  </div></div>

  <div class="two-col">
    <!-- 2. Models -->
    <div class="card"><div class="card-body">
      <h4 class="card-title" id="models-title">Models</h4>
      <p class="card-sub">Click a model for its origin, limitations and references.</p>
      <div id="models"></div>
    </div></div>

    <!-- 3. Assays -->
    <div class="card"><div class="card-body">
      <h4 class="card-title" id="assays-title">Physiological assays</h4>
      <p class="card-sub">Translational relevance (x) vs. scalability (y). Highlighted assays can be run on the selected models; click a point or a row for details.</p>
      <div id="scatter"></div>
      <div class="legend-strip" id="assay-legend"></div>
      <div id="assay-detail"></div>
      <div id="assay-list"></div>
    </div></div>
  </div>
</div>

<footer>Data: Physiological assays_EM.xlsx · Models_table.xlsx &nbsp;|&nbsp; Models and assays are linked by physiological category</footer>

    </div>
</template>
<script>
import Vue from "vue";
import { BootstrapVue } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import * as plotly from "plotly.js-dist";
import tissue_assays from "../data/tissue_assays.json";

const D = tissue_assays;
const S = {tissue:null, cat:null, model:null, assay:null};

const FONT = "Roboto, Arial, sans-serif";
const SYMBOL = {"In vitro":"circle","Mice":"triangle-up","Zebrafish":"diamond","Drosophila":"star","Multi":"square"};
const GLYPH  = {"In vitro":"●","Mice":"▲","Zebrafish":"◆","Drosophila":"★","Multi":"■"};
const MODEL_LABEL = {"In vitro":"In vitro","Mice":"Mice","Zebrafish":"Zebrafish","Drosophila":"Drosophila","Multi":"Multi-model"};
const modelById  = Object.fromEntries(D.models.map(m => [m.id, m]));
const assayById  = Object.fromEntries(D.assays.map(a => [a.id, a]));
const catById    = Object.fromEntries(D.cats.map(c => [c.code, c]));
const tissueById = Object.fromEntries(D.tissues.map(t => [t.id, t]));
const typeById   = Object.fromEntries(D.types.map(t => [t.code, t]));

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const dot = code => `<span class="dot" style="background:${D.catColors[code]}"></span>`;
const pip = (score, pal) => score
  ? `<span class="pip" style="background:${pal[score]};color:${score>=3?"#fff":"#333"}${score===1?";border:1px solid #ccc":""}">${score}</span>`
  : `<span class="pip unknown" title="Not scored">?</span>`;
const typeColor = code => getComputedStyle(document.documentElement).getPropertyValue("--type-"+code).trim() || "#999";


Vue.use(BootstrapVue);

export default Vue.component("tissue-explorer", {
    props: [],

    data() {
        return {
            plotReady: false,
        };
    },
    created(){
    },
    mounted(){
        document.addEventListener("change", ev => {
        const f = ev.target.dataset && ev.target.dataset.f;
        if (!f) return;
        const v = ev.target.value || null;
        set(f === "tissue" ? {tissue: v, model: null} : {[f]: v});
        });
        document.addEventListener("click", ev => {
        const el = ev.target.closest("[data-act]");
        if (!el) return;
        const id = el.dataset.id || null;
        switch (el.dataset.act) {
            case "tissue": set({tissue: S.tissue === id ? null : id, model: null}); break;
            case "cat":    set({cat: S.cat === id ? null : id}); break;
            case "cell": {
            const same = S.tissue === el.dataset.t && S.cat === el.dataset.c;
            set(same ? {tissue: null, cat: null, model: null} : {tissue: el.dataset.t, cat: el.dataset.c, model: null}); break;
            }
            case "model":  set({model: S.model === id ? null : id}); break;
            case "assay":  set({assay: S.assay === id ? null : id}); break;
            case "reset":  set({tissue: null, cat: null, model: null, assay: null}); break;
            case "copy": {
            const done = () => { el.textContent = "Link copied"; setTimeout(() => el.textContent = "Copy link", 1500); };
            if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(done, () => prompt("Copy this link:", location.href));
            else prompt("Copy this link:", location.href);
            break;
            }
        }
        });
        window.addEventListener("hashchange", () => { readHash(); render(); });

        if (new URLSearchParams(location.search).get("embed") === "1") document.body.classList.add("embed");
        document.getElementById("type-legend").innerHTML = D.types.map(t =>
        `<span><span class="swatch-sq" style="background:${typeColor(t.code)}"></span>${esc(t.name)}</span>`).join("");
        this.renderAssayLegend();
        this.readHash();
        window.addEventListener("load", this.render());
    },
    computed: {
    },
    methods: {
        // ── Linking rule ────────────────────────────────────────────────
        compatible(m, a) {
        return a.invitro && m.cats.includes(a.cat) &&
            (!a.tissues.length || a.tissues.some(t => t.toLowerCase() === m.tissue.toLowerCase()));
        },
        scopeModels() {
            return D.models.filter(m => (!S.tissue || m.tissue_id === S.tissue) &&
                                        (!S.cat || m.cats.includes(S.cat)) &&
                                        (!S.model || m.id === S.model));
        },
        hasScope() { return !!(S.tissue || S.cat || S.model); },
        activeAssays() {
            if (!hasScope()) return null;
            const ms = scopeModels();
            return new Set(D.assays.filter(a => (!S.cat || a.cat === S.cat) && ms.some(m => compatible(m, a))).map(a => a.id));
        },
        assayModels(a) { return D.models.filter(m => compatible(m, a)); },
        
        // ── State & URL ─────────────────────────────────────────────────
        set(patch) {
            Object.assign(S, patch);
            if (S.model && !modelById[S.model]) S.model = null;
            if (S.assay && !assayById[S.assay]) S.assay = null;
            if (S.model) S.tissue = modelById[S.model].tissue_id;
            if (S.model && S.cat && !modelById[S.model].cats.includes(S.cat)) S.cat = null;
            const h = Object.entries(S).filter(([,v]) => v).map(([k,v]) => `${k}=${encodeURIComponent(v)}`).join("&");
            history.replaceState(null, "", location.pathname + location.search + (h ? "#" + h : ""));
            render();
        },
        readHash() {
            const p = new URLSearchParams(location.hash.slice(1));
            S.tissue = tissueById[p.get("tissue")] ? p.get("tissue") : null;
            S.cat    = catById[p.get("cat")] ? p.get("cat") : null;
            S.model  = modelById[p.get("model")] ? p.get("model") : null;
            S.assay  = assayById[p.get("assay")] ? p.get("assay") : null;
            if (S.model) S.tissue = modelById[S.model].tissue_id;
        },
        // ── Search criteria ─────────────────────────────────────────────
        renderFilters() {
            const opt = (v, label, sel) => `<option value="${esc(v)}"${sel ? " selected" : ""}>${esc(label)}</option>`;
            const a = S.assay ? assayById[S.assay] : null;

            document.getElementById("f-tissue").innerHTML = opt("", `All tissues (${D.models.length} models)`, !S.tissue) +
                D.tissues.map(t => {
                const ms = D.models.filter(m => m.tissue_id === t.id);
                const n = a ? ms.filter(m => compatible(m, a)).length : ms.length;
                return opt(t.id, `${t.name} (${n} ${a ? "compatible" : "models"})`, S.tissue === t.id);
                }).join("");

            document.getElementById("f-cat").innerHTML = opt("", "All categories", !S.cat) +
                D.cats.map(c => opt(c.code, c.full, S.cat === c.code)).join("");

            const ms = D.models.filter(m => (!S.tissue || m.tissue_id === S.tissue) && (!S.cat || m.cats.includes(S.cat)));
            let mo = opt("", `Any model (${ms.length})`, !S.model);
            (S.tissue ? [tissueById[S.tissue]] : D.tissues).forEach(t => D.types.forEach(ty => {
                const g = ms.filter(m => m.tissue_id === t.id && m.type === ty.code);
                if (g.length) mo += `<optgroup label="${esc(t.name)} · ${esc(ty.name)}">` +
                g.map(m => opt(m.id, `${m.name} (${m.species})`, S.model === m.id)).join("") + `</optgroup>`;
            }));
            document.getElementById("f-model").innerHTML = mo;

            const act = activeAssays();
            let ao = opt("", act ? `Any compatible assay (${act.size})` : `Any assay (${D.assays.length})`, !S.assay);
            D.cats.forEach(c => {
                const g = D.assays.filter(x => x.cat === c.code && (!act || act.has(x.id) || x.id === S.assay));
                if (g.length) ao += `<optgroup label="${esc(c.full)}">` + g.map(x => opt(x.id, x.label, S.assay === x.id)).join("") + `</optgroup>`;
            });
            document.getElementById("f-assay").innerHTML = ao;

            const nm = scopeModels().length;
            let st;
            if (a) st = `<b>${esc(a.assay)}</b> can be used with <b>${assayModels(a).length}</b> of the ${D.models.length} models`;
            else if (act) st = `<b>${nm}</b> model${nm === 1 ? "" : "s"} selected · <b>${act.size}</b> compatible in vitro assays`;
            else st = `Showing all ${D.tissues.length} tissues, ${D.models.length} models and ${D.assays.length} assays`;
            document.getElementById("status").innerHTML = st;
        },
        // ── 1. Coverage grid ────────────────────────────────────────────
        renderCoverage() {
            const a = S.assay ? assayById[S.assay] : null;
            let h = `<colgroup><col class="c-tissue">${D.cats.map(() => "<col>").join("")}</colgroup>` +
                `<thead><tr><th class="corner">Tissue \\ Category</th>` +
                D.cats.map(c => `<th data-act="cat" data-id="${c.code}" class="${S.cat===c.code?"sel":""}"><span class="cat-h">${dot(c.code)}${esc(c.full)}</span></th>`).join("") +
                `</tr></thead><tbody>`;
            D.tissues.forEach(t => {
                h += `<tr><th class="row-h ${S.tissue===t.id?"sel":""}" data-act="tissue" data-id="${t.id}">${esc(t.name)}</th>`;
                D.cats.forEach(c => {
                const ms = D.models.filter(m => m.tissue_id === t.id && m.cats.includes(c.code));
                if (!ms.length) { h += `<td class="empty" title="No ${esc(t.name)} models listed for ${esc(c.full)}">—</td>`; return; }
                const nComp = a ? (c.code === a.cat ? ms.filter(m => compatible(m, a)).length : 0) : null;
                const cls = [S.tissue===t.id && S.cat===c.code ? "sel" : "",
                            S.tissue===t.id ? "sel-row" : "", S.cat===c.code ? "sel-col" : "",
                            a && nComp === 0 ? "dim" : ""].join(" ");
                const bar = D.types.map(ty => {
                    const n = ms.filter(m => m.type === ty.code).length;
                    return n ? `<span style="flex:${n};background:${typeColor(ty.code)}" title="${esc(ty.name)}: ${n}"></span>` : "";
                }).join("");
                const tip = D.types.map(ty => `${ty.name}: ${ms.filter(m => m.type === ty.code).length}`).join("\n");
                h += `<td class="${cls}" data-act="cell" data-t="${t.id}" data-c="${c.code}" title="${esc(tip)}">
                    <div class="n">${a ? nComp : ms.length}<small>${a ? "compatible" : "models"}</small></div><div class="typebar">${bar}</div></td>`;
                });
                h += `</tr>`;
            });
            h += `</tbody><tfoot><tr><td></td>` +
                D.cats.map(c => `<td>${D.assays.filter(x => x.cat === c.code && x.invitro).length} in vitro assays</td>`).join("") +
                `</tr></tfoot>`;
            document.getElementById("cov").innerHTML = h;
        },
        // ── 2. Models ───────────────────────────────────────────────────
        modelHTML(m, a) {
            const match = a && compatible(m, a);
            const cls = ["model", S.model===m.id ? "sel" : "", a && !match ? "dim" : "", match ? "match" : ""].join(" ");
            const nAssays = D.assays.filter(x => compatible(m, x)).length;
            const refs = m.pmids.length
                ? m.pmids.map(p => `<a href="https://pubmed.ncbi.nlm.nih.gov/${p}/" target="_blank" rel="noopener">PMID ${p}</a>`).join(", ")
                : esc(m.refs || "—");
            return `<div class="${cls}">
                <div class="model-row" data-act="model" data-id="${m.id}">
                <span><span class="m-name">${esc(m.name)}</span><span class="m-species">${esc(m.species)}</span></span>
                <span class="dots">${m.cats.map(dot).join("")}</span>
                <span class="m-sc">${m.sc_label ? `<span class="sc-lab">${esc(m.sc_label)}</span>` : ""}${pip(m.sc, D.scPalette)}</span>
                </div>
                <div class="model-detail">
                <dl>
                    <dt>Tissue</dt><dd>${esc(m.tissue)} · ${esc(typeById[m.type].name)}</dd>
                    <dt>Origin</dt><dd>${esc(m.origin || "—")}</dd>
                    <dt>Scalability</dt><dd>${esc(m.sc_label || "Not scored")}</dd>
                    <dt>Categories</dt><dd>${m.cats.map(c => `${dot(c)} ${esc(catById[c].full)}`).join("<br>")}</dd>
                    <dt>Notes</dt><dd>${esc(m.notes || "—")}</dd>
                    <dt>References</dt><dd>${refs}</dd>
                    <dt>Assays</dt><dd>${nAssays} in vitro assays in its categories (highlighted on the right)</dd>
                </dl>
                </div></div>`;
        },
        renderModels() {
            const a = S.assay ? assayById[S.assay] : null;
            const tissues = S.tissue ? [tissueById[S.tissue]] : D.tissues;
            document.getElementById("models-title").textContent =
                `Models${S.tissue ? " — " + tissueById[S.tissue].name : ""}${S.cat ? " · " + catById[S.cat].full : ""}`;
            let h = "";
            tissues.forEach(t => {
                const ms = D.models.filter(m => m.tissue_id === t.id && (!S.cat || m.cats.includes(S.cat)));
                let inner = "";
                D.types.forEach(ty => {
                const g = ms.filter(m => m.type === ty.code);
                if (g.length) inner += `<div class="type-group"><h6><span class="swatch-sq" style="background:${typeColor(ty.code)}"></span>${esc(ty.name)} (${g.length})</h6>${g.map(m => modelHTML(m, a)).join("")}</div>`;
                });
                if (!inner) inner = `<div class="empty-note">No ${esc(t.name)} models listed for ${esc(catById[S.cat].full)}.</div>`;
                h += `<div class="tissue-group">${S.tissue ? "" : `<h5>${esc(t.name)}</h5>`}${inner}</div>`;
            });
            document.getElementById("models").innerHTML = h;
        },
        // ── 3. Assays ───────────────────────────────────────────────────
        hoverText(d) {
            const details = d.details.length > 160 ? d.details.slice(0, 160) + "…" : d.details;
            return `<b>${esc(d.assay)}</b><br><span style="color:#888">${esc(catById[d.cat].full)}</span><br>` +
                (d.process ? `<b>Process:</b> ${esc(d.process)}<br>` : "") +
                `<b>Model:</b> ${esc(d.model_raw)}<br><b>Scalability:</b> ${d.sc}/5 · <b>Translational:</b> ${d.tr}/5` +
                (details ? `<br><span style="font-size:11px">${esc(details)}</span>` : "") + `<extra></extra>`;
        },
        renderScatter() {
            const act = activeAssays();
            const groups = {};
            D.assays.forEach((d, i) => { const k = d.cat + "|" + d.model; (groups[k] = groups[k] || {cat: d.cat, model: d.model, idx: []}).idx.push(i); });
            const traces = Object.values(groups).map(g => ({
                x: g.idx.map(i => D.assays[i].tr + D.jitter[i][0]), y: g.idx.map(i => D.assays[i].sc + D.jitter[i][1]),
                customdata: g.idx.map(i => D.assays[i].id), type: "scatter", mode: "markers",
                marker: {color: D.catColors[g.cat], symbol: SYMBOL[g.model] || "circle",
                size: g.idx.map(i => (D.assays[i].id === S.assay ? 19 : (g.model === "Drosophila" ? 15 : 12))),
                opacity: g.idx.map(i => (!act || act.has(D.assays[i].id) || D.assays[i].id === S.assay) ? 0.9 : 0.12),
                line: {color: g.idx.map(i => D.assays[i].id === S.assay ? "#212529" : "white"),
                        width: g.idx.map(i => D.assays[i].id === S.assay ? 2.5 : 1.2)}},
                hovertemplate: g.idx.map(i => hoverText(D.assays[i])), showlegend: false,
            }));
            const Q = D.split, XR = (Q + 5.5) / 2, XL = (0.5 + Q) / 2;
            const AX = {showline:true, linecolor:"#212529", linewidth:1, ticks:"outside", ticklen:3, tickcolor:"#212529",
                gridcolor:"#eeeeee", zeroline:false, range:[0.4,5.6], tickvals:[1,2,3,4,5], fixedrange:true,
                tickfont:{size:11, family:FONT, color:"#212529"}};
            const tt = lab => [1,2,3,4,5].map(t => lab[t] ? `${t}<br><i style='font-size:10px'>${lab[t]}</i>` : String(t));
            const ann = (x, y, yanchor, text, color) => ({x, y, yanchor, text:`<b>${text}</b>`, showarrow:false,
                font:{size:10, color, family:FONT}, bgcolor:"rgba(255,255,255,0.85)", borderpad:2});
            const layout = {
                paper_bgcolor:"white", plot_bgcolor:"white", margin:{t:8, b:50, l:60, r:8},
                xaxis:{...AX, title:{text:"Translational relevance score", font:{size:13, family:FONT}}, ticktext:tt(D.trTicks)},
                yaxis:{...AX, title:{text:"Scalability score", font:{size:13, family:FONT}}, ticktext:tt(D.scTicks)},
                shapes:[
                {type:"rect", x0:Q, x1:5.5, y0:Q, y1:5.5, fillcolor:"rgba(1,108,89,0.05)", line:{width:0}, layer:"below"},
                {type:"rect", x0:0.5, x1:Q, y0:Q, y1:5.5, fillcolor:"rgba(204,102,119,0.05)", line:{width:0}, layer:"below"},
                {type:"rect", x0:Q, x1:5.5, y0:0.5, y1:Q, fillcolor:"rgba(8,81,156,0.05)", line:{width:0}, layer:"below"},
                {type:"line", x0:Q, x1:Q, y0:0.5, y1:5.5, line:{color:"#BBBBBB", width:1, dash:"dot"}},
                {type:"line", x0:0.5, x1:5.5, y0:Q, y1:Q, line:{color:"#BBBBBB", width:1, dash:"dot"}}],
                annotations:[["HH", XR, 5.59, "top", "#016C59"], ["HL", XL, 5.59, "top", "#CC6677"],
                            ["LH", XR, 0.41, "bottom", "#08519C"], ["LL", XL, 0.41, "bottom", "#888"]]
                .filter(q => D.quadrants[q[0]])                       // names from the Excel
                .map(([k, x, y, ya, c]) => ann(x, y, ya, esc(D.quadrants[k]), c)),
                hovermode:"closest", hoverlabel:{bgcolor:"white", bordercolor:"#ccc", font:{size:12, family:FONT}, align:"left"},
            };
            const el = document.getElementById("scatter");
            Plotly.react(el, traces, layout, {responsive:true, displayModeBar:false});
            if (!plotReady) {
                el.on("plotly_click", ev => { const id = ev.points[0].customdata; set({assay: S.assay === id ? null : id}); });
                plotReady = true;
            }
        },
        renderAssayLegend() {
            document.getElementById("assay-legend").innerHTML =
                D.cats.map(c => `<span>${dot(c.code)}${esc(c.full)}</span>`).join("") +
                Object.keys(GLYPH).map(k => `<span>${GLYPH[k]} ${MODEL_LABEL[k]}</span>`).join("") +
                `<span>${pip(5, D.scPalette)} Scalability</span><span>${pip(5, D.trPalette)} Translational</span>`;
        },
        renderAssayDetail() {
            const box = document.getElementById("assay-detail");
            if (!S.assay) { box.innerHTML = ""; return; }
            const a = assayById[S.assay];
            const ms = assayModels(a);
            let compat;
            if (!a.invitro) compat = `<i>Not an in vitro assay (${esc(a.model_raw)}) — not linked to the in vitro models.</i>`;
            else if (!ms.length) compat = `<i>No in vitro models listed for this category.</i>`;
            else compat = D.tissues.map(t => {
                const g = ms.filter(m => m.tissue_id === t.id);
                return g.length ? `<div><b>${esc(t.name)}</b> (${g.length}): ${g.map(m =>
                `<span class="mchip" data-act="model" data-id="${m.id}">${esc(m.name)} <span style="color:#999">${esc(m.species)}</span></span>`).join("")}</div>` : "";
            }).join("");
            box.innerHTML = `<div class="assay-detail">
                <h5><span>${esc(a.assay)}</span><span style="display:inline-flex;gap:4px">${pip(a.sc, D.scPalette)}${pip(a.tr, D.trPalette)}</span></h5>
                <div class="meta">${dot(a.cat)} ${esc(catById[a.cat].full)} · ${esc(a.process)} · ${esc(a.model_raw)}</div>
                <div>${esc(a.details)}</div>
                <div class="compat"><b>Models it can be used with${a.tissues.length ? " (" + esc(a.tissues.join(", ")) + ")" : ""}:</b>${compat}</div>
            </div>`;
        },
        renderAssayList() {
            const act = activeAssays();
            let rows = act ? D.assays.filter(a => act.has(a.id)) : D.assays.filter(a => !S.cat || a.cat === S.cat);
            rows = [...rows].sort((a, b) => D.cats.findIndex(c => c.code === a.cat) - D.cats.findIndex(c => c.code === b.cat) || b.sc - a.sc || b.tr - a.tr);
            const scope = S.model ? modelById[S.model].name : S.tissue ? tissueById[S.tissue].name + " models" : S.cat ? "models in this category" : null;
            document.getElementById("assays-title").textContent = scope ? `Assays compatible with ${scope}` : "Physiological assays";
            let h = `<div class="list-head">${scope ? `${rows.length} in vitro assays` : `All ${rows.length} assays`}
                <span>${scope ? "Linked by physiological category" : "Choose a tissue or model to see compatible assays"}</span></div>`;
            if (rows.length) h += `<div class="col-head"><span>SC</span><span>TR</span><span></span><span>ASSAY · PROCESS · MODEL SYSTEM</span></div>`;
            D.cats.forEach(c => {
                const g = rows.filter(a => a.cat === c.code);
                if (!g.length) return;
                h += `<div class="cat-block"><h6>${dot(c.code)}${esc(c.full)} (${g.length})</h6>` + g.map(a =>
                `<div class="assay-row ${S.assay===a.id?"sel":""}" data-act="assay" data-id="${a.id}">
                    ${pip(a.sc, D.scPalette)}${pip(a.tr, D.trPalette)}<span class="glyph" style="color:${D.catColors[a.cat]}">${GLYPH[a.model]||"●"}</span>
                    <span><span>${esc(a.assay)}</span> <span class="a-proc">· ${esc(a.process)}</span> <span class="a-model">· ${esc(a.model_raw)}</span></span></div>`).join("") + `</div>`;
            });
            if (scope) {
                const cats = new Set(scopeModels().flatMap(m => m.cats));
                const nVivo = D.assays.filter(a => !a.invitro && cats.has(a.cat) && (!S.cat || a.cat === S.cat)).length;
                if (nVivo) h += `<div class="note">${nVivo} in vivo assays in these categories are not linked to in vitro models (shown faded in the plot).</div>`;
            }
            if (!rows.length) h += `<div class="empty-note">No compatible assays.</div>`;
            document.getElementById("assay-list").innerHTML = h;
        },
        // ── Render all ──────────────────────────────────────────────────
        render() {
            this.renderFilters(); this.renderCoverage(); this.renderModels();
            this.renderScatter(); this.renderAssayDetail(); this.renderAssayList();
        }
    },
});
</script>
<style>
    /* Styled after the Knowledge Portal pages (hugeamp.org): Roboto/Arial, #eee page,
    #0077b6 header and footer bands, white cards, light-blue intro and filter panels. */
    :root {
    --font: "Roboto", Arial, sans-serif;
    --text: #212529; --muted: #6c757d; --faint: #999; --border: rgba(0,0,0,.125); --line: #dee2e6;
    --page: #eeeeee; --surface: #ffffff; --kp-blue: #0077b6; --link: #007bff;
    --intro-bg: rgba(102,187,255,.19); --intro-border: rgba(51,153,255,.19);
    --filter-bg: #ddefff; --filter-border: #bbdfff;
    --hilite: #fff6d5; --sel: #0077b6;
    --type-IM: #4d4d4d; --type-PR: #8c8c8c; --type-PS: #c4c4c4;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: var(--font); font-size: 16px; line-height: 1.5; color: var(--text); background: var(--page); }
    body.embed .kp-header, body.embed .kp-footer { display: none; }
    a { color: var(--link); text-decoration: none; }
    a:hover { text-decoration: underline; }
    button, select { font-family: inherit; }

    /* header & footer bands */
    .kp-header { background: var(--kp-blue); color: #fff; min-height: 50px; display: flex; align-items: center; padding: 0 15px; gap: 12px; }
    .kp-header .brand { font-size: 22px; font-weight: 300; letter-spacing: .2px; }
    .kp-header .brand b { font-weight: 500; }
    .kp-header .sub { font-size: 14px; font-weight: 300; opacity: .9; margin-left: auto; }
    .kp-footer { background: var(--kp-blue); color: #fff; font-size: 14px; font-weight: 300; padding: 15px; text-align: center; margin-top: 10px; }
    .kp-body { padding: 10px 15px; }

    /* cards */
    .card { background: var(--surface); border: 1px solid var(--border); border-radius: 4px; margin: 10px 0; }
    .card-body { padding: 20px; }
    h1.card-title { font-size: 40px; font-weight: 500; line-height: 1.2; margin-bottom: 12px; }
    h4.card-title { font-size: 24px; font-weight: 500; line-height: 1.2; margin-bottom: 12px; }
    .card-lead { font-size: 16px; margin-bottom: 24px; }
    .card-sub { font-size: 14px; color: var(--muted); margin: -6px 0 14px; }

    /* intro panel with workflow */
    .intro { background: var(--intro-bg); border: 1px solid var(--intro-border); padding: 20px 20px 14px; }
    .intro-top { display: flex; gap: 16px; align-items: flex-start; }
    .intro-top svg { flex-shrink: 0; }
    .intro-top p { font-size: 16px; }
    .flow { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; margin: 18px 0 6px 86px; }
    .step { display: flex; flex-direction: column; gap: 6px; align-items: flex-start; }
    .step-head { display: flex; gap: 8px; align-items: center; font-size: 17px; }
    .step-num { width: 26px; height: 26px; border-radius: 50%; background: #4472c4; color: #fff; font-size: 15px; font-weight: 500;
    display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 0 0 2px #fff; }
    .pill { border: 2px solid #9e9e9e; border-radius: 14px; padding: 1px 18px; font-size: 15px; background: #fff; text-align: center; min-width: 130px; }
    .pill.result { border: none; background: #d5ead2; }
    .arrow { color: #9e9e9e; font-size: 26px; line-height: 1; margin-top: 26px; }
    .intro-foot { font-size: 14px; color: var(--muted); margin-top: 10px; }

    /* search criteria */
    .filtering-ui { background: var(--filter-bg); border: 1px solid var(--filter-border); border-radius: 5px; padding: 10px 12px 12px;
    display: flex; flex-wrap: wrap; gap: 10px 14px; justify-content: center; align-items: flex-end; }
    .filter-col { display: flex; flex-direction: column; align-items: center; gap: 2px; }
    .filter-col label { font-size: 14px; font-weight: 700; }
    .form-control { font-size: 14px; color: #495057; background: #fff; border: 1px solid #ced4da; border-radius: 4px; padding: 5px 10px; height: 32px; width: 230px; }
    .form-control:focus { outline: none; border-color: #80bdff; box-shadow: 0 0 0 .2rem rgba(0,123,255,.25); }
    .btn { font-size: 14px; border-radius: 4px; padding: 5px 12px; height: 32px; cursor: pointer; border: 1px solid transparent; }
    .btn-primary { background: var(--link); border-color: var(--link); color: #fff; }
    .btn-primary:hover { background: #0069d9; }
    .btn-outline { background: #fff; border-color: #6c757d; color: #6c757d; }
    .btn-outline:hover { background: #6c757d; color: #fff; }
    .status { font-size: 14px; color: var(--muted); text-align: center; margin-top: 10px; }
    .status b { color: var(--text); font-weight: 500; }

    /* layout */
    .two-col { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: 0 10px; align-items: start; }
    @media (max-width: 1000px) { .two-col { grid-template-columns: minmax(0, 1fr); } .flow { margin-left: 0; } h1.card-title { font-size: 32px; } }
    @media (max-width: 640px) { .flow { flex-direction: column; align-items: flex-start; gap: 10px; } .arrow { display: none; } }

    /* coverage table */
    .cov-scroll { overflow-x: auto; }
    table.cov { border-collapse: separate; border-spacing: 4px; width: 100%; min-width: 620px; table-layout: fixed; font-size: 14px; }
    .cov col.c-tissue { width: 92px; }
    .cov th { font-weight: 700; text-align: left; padding: 4px 6px; vertical-align: bottom; cursor: pointer; border-bottom: 2px solid var(--line); }
    .cov th.corner { cursor: default; color: var(--muted); font-weight: 400; font-size: 12px; }
    .cov th .cat-h { display: flex; gap: 6px; align-items: flex-start; line-height: 1.25; }
    .cov th .cat-h .dot { margin-top: 4px; }
    .cov th.row-h { font-size: 15px; vertical-align: middle; white-space: nowrap; border-bottom: none; }
    .cov th.sel, .cov td.sel-row, .cov td.sel-col { background: var(--hilite); }
    .cov td { background: #f8f9fa; border: 1px solid var(--line); border-radius: 4px; padding: 7px 9px; cursor: pointer; vertical-align: top; }
    .cov td:hover { border-color: #adb5bd; }
    .cov td.empty { background: transparent; border-style: dashed; color: var(--faint); cursor: default; }
    .cov td.sel { border: 2px solid var(--sel); padding: 6px 8px; }
    .cov td.dim { opacity: .35; }
    .cov .n { font-size: 20px; font-weight: 500; line-height: 1; }
    .cov .n small { font-size: 12px; font-weight: 400; color: var(--muted); margin-left: 3px; }
    .typebar { display: flex; gap: 2px; height: 6px; margin-top: 7px; }
    .typebar span { display: block; border-radius: 1px; }
    .cov tfoot td { background: transparent; border: none; cursor: default; font-size: 12px; color: var(--muted); padding: 2px 6px; }
    .type-legend { display: flex; gap: 16px; flex-wrap: wrap; font-size: 13px; color: var(--muted); margin-top: 8px; }
    .type-legend span { display: inline-flex; gap: 6px; align-items: center; }
    .swatch-sq { width: 12px; height: 7px; border-radius: 1px; display: inline-block; }
    .dots { display: inline-flex; gap: 3px; }
    .dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; flex-shrink: 0; }

    /* models */
    .tissue-group + .tissue-group { margin-top: 16px; }
    .tissue-group > h5 { font-size: 18px; font-weight: 500; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 2px solid var(--line); }
    .type-group { margin-bottom: 10px; }
    .type-group > h6 { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .6px; color: var(--muted);
    margin: 8px 0 3px; display: flex; gap: 6px; align-items: center; }
    .model { border-radius: 4px; border: 1px solid transparent; font-size: 14px; }
    .model-row { display: grid; grid-template-columns: 1fr 38px 96px; gap: 8px; align-items: center; padding: 5px 8px; cursor: pointer; }
    .model-row > .dots { justify-content: flex-end; }
    .model-row > .m-sc { display: inline-flex; gap: 6px; align-items: center; justify-content: flex-end; }
    .model:hover { border-color: var(--line); background: #f8f9fa; }
    .model.dim { opacity: .35; }
    .model.match .model-row { background: var(--hilite); }
    .model.sel { border-color: var(--sel); background: var(--surface); }
    .model .m-name { font-weight: 500; }
    .model .m-species { color: var(--muted); font-size: 13px; margin-left: 5px; }
    .model-detail { display: none; padding: 4px 10px 12px; font-size: 14px; border-top: 1px solid var(--line); }
    .model.sel .model-detail { display: block; }
    .model-detail dl { display: grid; grid-template-columns: 100px 1fr; gap: 4px 12px; margin-top: 6px; }
    .model-detail dt { color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: .4px; padding-top: 2px; }
    .empty-note { color: var(--muted); font-style: italic; padding: 8px 0; font-size: 14px; }

    /* score pips */
    .pip { display: inline-flex; width: 22px; height: 22px; border-radius: 50%; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; flex-shrink: 0; }
    .pip.unknown { background: #eee; color: #999; border: 1px dashed #bbb; }
    .sc-lab { font-size: 12px; color: var(--muted); white-space: nowrap; }

    /* assays */
    #scatter { height: 440px; }
    .legend-strip { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 13px; color: var(--muted); padding: 8px 2px 2px; }
    .legend-strip span { display: inline-flex; gap: 6px; align-items: center; }
    .assay-detail { border: 2px solid var(--sel); border-radius: 4px; padding: 12px 14px; margin: 12px 0 4px; font-size: 14px; }
    .assay-detail h5 { font-size: 18px; font-weight: 500; display: flex; gap: 8px; align-items: center; justify-content: space-between; }
    .assay-detail .meta { color: var(--muted); font-size: 13px; margin: 3px 0 8px; }
    .assay-detail .compat { margin-top: 10px; }
    .assay-detail .compat b { font-weight: 500; }
    .mchip { display: inline-block; font-size: 13px; border: 1px solid #ced4da; border-radius: 12px; padding: 1px 9px; margin: 4px 4px 0 0; cursor: pointer; background: #fff; }
    .mchip:hover { border-color: var(--link); color: var(--link); }
    .list-head { font-size: 15px; font-weight: 500; margin: 16px 0 6px; display: flex; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
    .list-head span { font-weight: 400; color: var(--muted); font-size: 13px; }
    .cat-block > h6 { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .6px; margin: 12px 0 3px;
    display: flex; gap: 6px; align-items: center; }
    .col-head, .assay-row { display: grid; grid-template-columns: 22px 22px 14px 1fr; gap: 8px; align-items: center; }
    .col-head { font-size: 11px; font-weight: 700; color: var(--muted); padding: 0 8px; letter-spacing: .4px; }
    .assay-row { padding: 3px 8px; cursor: pointer; border-radius: 4px; border: 1px solid transparent; font-size: 14px; }
    .assay-row:hover { background: #f8f9fa; border-color: var(--line); }
    .assay-row.sel { border-color: var(--sel); }
    .assay-row .a-proc { color: var(--muted); font-size: 13px; }
    .assay-row .a-model { color: var(--faint); font-size: 12px; }
    .glyph { font-size: 12px; line-height: 1; text-align: center; }
    .note { font-size: 13px; color: var(--muted); margin-top: 10px; font-style: italic; }
</style>