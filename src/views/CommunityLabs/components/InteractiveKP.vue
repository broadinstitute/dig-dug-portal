<!-- Adapted from HTML file sent by Andrena.-->
<template>
  <div>
<header class="kp-header">
  <span class="brand"><b>T2D</b> Physiological Assays</span>
  <span class="sub">Scalability and translational relevance of assays for type 2 diabetes research</span>
</header>

<div class="kp-body">
  <div class="card"><div class="card-body intro">
    <svg width="64" height="64" viewBox="0 0 72 72" aria-hidden="true">
      <polygon points="36,3 65,19.5 65,52.5 36,69 7,52.5 7,19.5" fill="#fff" stroke="#c6defa" stroke-width="3"/>
      <line x1="20" y1="54" x2="54" y2="54" stroke="#212529" stroke-width="2"/>
      <line x1="20" y1="54" x2="20" y2="18" stroke="#212529" stroke-width="2"/>
      <circle cx="30" cy="42" r="5" fill="#117733"/><circle cx="44" cy="26" r="5" fill="#332288"/>
      <circle cx="47" cy="40" r="5" fill="#CC8833"/><circle cx="34" cy="28" r="5" fill="#CC6677"/>
    </svg>
    <div>
      <p>81 physiological assays used in type 2 diabetes research, scored for <b>scalability</b>
      and <b>translational relevance</b>, across 4 physiological categories and 5 model systems.</p>
      <div class="cats"><div class="legend-item"><div class="swatch" style="background:#117733"></div>Insulin responsiveness and glucose handling</div><div class="legend-item"><div class="swatch" style="background:#CC6677"></div>Insulin secretion</div><div class="legend-item"><div class="swatch" style="background:#CC8833"></div>Energy balance</div><div class="legend-item"><div class="swatch" style="background:#332288"></div>Lipid metabolism</div></div>
    </div>
  </div></div>

  <div class="card"><div class="card-body">
    <h1 class="card-title">Physiological Assays for T2D Research</h1>
    <p class="card-lead">Explore the assays in the scatter plot (panel A) or browse, filter and sort them in the reference matrix (panel B).</p>
    <div class="tabs-bar">
      <button class="tab-btn active" onclick="switchTab('scatter',this)">A &thinsp; Translational Relevance vs. Scalability</button>
      <button class="tab-btn" onclick="switchTab('matrix',this)">B &thinsp; Assay Reference Matrix</button>
    </div>

<!-- PANEL A -->
<div class="panel active" id="panel-scatter">
  <div class="panel-sub">
    Each point is one assay. <strong>Hover for full details.</strong>
    X-axis: translational relevance score (5 = highest relevance to human T2D; 1 = lowest relevance to human T2D). Y-axis: scalability score (5 = high-throughput; 1 = technically demanding).
    Colour = category. Shape = model system.
  </div>
  <div class="chart-card">
    <div id="scatter-plot" style="height:640px"></div>
    <div class="legend-strip">
      <div class="legend-block">
        <div class="legend-title">Category</div>
        <div class="legend-items"><div class="legend-item"><div class="swatch" style="background:#117733"></div>Insulin responsiveness and glucose handling</div><div class="legend-item"><div class="swatch" style="background:#CC6677"></div>Insulin secretion</div><div class="legend-item"><div class="swatch" style="background:#CC8833"></div>Energy balance</div><div class="legend-item"><div class="swatch" style="background:#332288"></div>Lipid metabolism</div></div>
      </div>
      <div class="legend-block">
        <div class="legend-title">Model system</div>
        <div class="legend-items">
          <div class="legend-item">&#9679; In vitro</div>
          <div class="legend-item">&#9650; Mice</div>
          <div class="legend-item">&#9670; Zebrafish</div>
          <div class="legend-item">&#9733; Drosophila</div>
          <div class="legend-item">&#9632; Multi-model</div>
        </div>
      </div>
      <div class="legend-block">
        <div class="legend-title">Scalability</div>
        <div class="score-scale">
          <div class="score-pip" style="background:#08519C">5</div>
          <div class="score-pip" style="background:#3182BD">4</div>
          <div class="score-pip" style="background:#6BAED6;color:#333">3</div>
          <div class="score-pip" style="background:#BDD7E7;color:#333">2</div>
          <div class="score-pip" style="background:#EFF3FF;color:#333;border:1px solid #ccc">1</div>
          <span style="font-size:13px;color:var(--muted);margin-left:4px">High &#8594; Low</span>
        </div>
      </div>
      <div class="legend-block">
        <div class="legend-title">Translational relevance</div>
        <div class="score-scale">
          <div class="score-pip" style="background:#016C59">5</div>
          <div class="score-pip" style="background:#1C9099">4</div>
          <div class="score-pip" style="background:#67A9CF;color:#333">3</div>
          <div class="score-pip" style="background:#BDC9E1;color:#333">2</div>
          <div class="score-pip" style="background:#F1EEF6;color:#333;border:1px solid #ccc">1</div>
          <span style="font-size:13px;color:var(--muted);margin-left:4px">High &#8594; Low</span>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- PANEL B -->
<div class="panel" id="panel-matrix">
  <div class="panel-sub">
    Every assay with Scalability (SC, blue) and Translational Relevance (TR, teal) scores shown as colour-coded dots,
    followed by the model system, assay name and the process it measures. <strong>Hover for full details.</strong>
    Filter by category and sort using the controls below.
  </div>
  <div class="control-bar">
    <div class="ctrl-group">
      <span class="ctrl-label">Category</span>
      <button class="ctrl-btn active" onclick="setFilter('all',this)">All</button>
      <button class="ctrl-btn cat-ir" onclick="setFilter('IR',this)">Insulin responsiveness and glucose handling</button>
      <button class="ctrl-btn cat-is" onclick="setFilter('IS',this)">Insulin secretion</button>
      <button class="ctrl-btn cat-eb" onclick="setFilter('EB',this)">Energy balance</button>
      <button class="ctrl-btn cat-lm" onclick="setFilter('LM',this)">Lipid metabolism</button>
    </div>
    <div class="ctrl-divider"></div>
    <div class="ctrl-group">
      <span class="ctrl-label">Sort by</span>
      <button class="ctrl-btn active" onclick="setSort('cat',this)">Category</button>
      <button class="ctrl-btn" onclick="setSort('sc-desc',this)">Scalability &#8595;</button>
      <button class="ctrl-btn" onclick="setSort('tr-desc',this)">Translational &#8595;</button>
      <button class="ctrl-btn" onclick="setSort('sc-asc',this)">Scalability &#8593;</button>
      <button class="ctrl-btn" onclick="setSort('tr-asc',this)">Translational &#8593;</button>
    </div>
  </div>
  <div class="chart-card">
    <div id="matrix-plot" style="min-height:400px"></div>
  </div>
</div>
  </div></div>
</div>

<footer class="kp-footer">Data: Physiological assays_EM.xlsx &nbsp;|&nbsp; Scores: 1 = lowest, 5 = highest</footer>
</div>
</template>
<style scoped>
  /* Styled after the Knowledge Portal pages (hugeamp.org): Roboto/Arial, #eee page,
    #0077b6 header and footer bands, white cards, light-blue intro and filter panels. */
  :root {
    --font: "Roboto", Arial, sans-serif;
    --text: #212529; --muted: #6c757d; --border: rgba(0,0,0,.125); --line: #dee2e6;
    --page: #eeeeee; --surface: #ffffff; --kp-blue: #0077b6; --link: #007bff;
    --intro-bg: rgba(102,187,255,.19); --intro-border: rgba(51,153,255,.19);
    --filter-bg: #ddefff; --filter-border: #bbdfff;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: var(--font); font-size: 16px; line-height: 1.5; color: var(--text); background: var(--page); }
  body.embed .kp-header, body.embed .kp-footer { display: none; }
  a { color: var(--link); text-decoration: none; }
  button { font-family: inherit; }
  .kp-header { background: var(--kp-blue); color: #fff; min-height: 50px; display: flex; align-items: center; padding: 0 15px; gap: 12px; flex-wrap: wrap; }
  .kp-header .brand { font-size: 22px; font-weight: 300; }
  .kp-header .brand b { font-weight: 500; }
  .kp-header .sub { font-size: 14px; font-weight: 300; opacity: .9; margin-left: auto; }
  .kp-footer { background: var(--kp-blue); color: #fff; font-size: 14px; font-weight: 300; padding: 15px; text-align: center; margin-top: 10px; }
  .kp-body { padding: 10px 15px; }
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: 4px; margin: 10px 0; }
  .card-body { padding: 20px; }
  .intro { background: var(--intro-bg); border: 1px solid var(--intro-border); display: flex; gap: 16px; align-items: flex-start; }
  .intro svg { flex-shrink: 0; }
  .intro .cats { display: flex; flex-wrap: wrap; gap: 6px 16px; margin-top: 8px; font-size: 14px; }
  .intro .cats span { display: inline-flex; gap: 6px; align-items: center; }
  h1.card-title { font-size: 40px; font-weight: 500; line-height: 1.2; margin-bottom: 12px; }
  .card-lead { font-size: 16px; margin-bottom: 20px; }
  @media (max-width: 700px) { h1.card-title { font-size: 30px; } .intro { flex-direction: column; } }

  /* Bootstrap-style tabs */
  .tabs-bar { display: flex; flex-wrap: wrap; border-bottom: 1px solid var(--line); margin-bottom: 16px; }
  .tab-btn { font-size: 16px; color: var(--link); background: none; border: 1px solid transparent; border-radius: 4px 4px 0 0;
    padding: 8px 16px; margin-bottom: -1px; cursor: pointer; }
  .tab-btn:hover { border-color: #e9ecef #e9ecef var(--line); }
  .tab-btn.active { color: #495057; background: #fff; border-color: var(--line) var(--line) #fff; }
  .panel { display: none; }
  .panel.active { display: block; }
  .panel-sub { font-size: 14px; color: var(--muted); margin-bottom: 14px; max-width: 980px; }
  .panel-sub strong { color: var(--text); font-weight: 500; }
  .chart-card { background: var(--surface); border: 1px solid var(--line); border-radius: 4px; }

  /* legend */
  .legend-strip { display: flex; flex-wrap: wrap; border-top: 1px solid var(--line); }
  .legend-block { padding: 12px 18px; border-right: 1px solid var(--line); }
  .legend-block:last-child { border-right: none; }
  .legend-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .6px; color: var(--muted); margin-bottom: 6px; }
  .legend-items { display: flex; flex-wrap: wrap; gap: 12px; }
  .legend-item { display: flex; align-items: center; gap: 6px; font-size: 14px; line-height: 1; }
  .swatch { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .score-scale { display: flex; gap: 4px; align-items: center; }
  .score-pip { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; color: white; }

  /* filter & sort box (KP "search criteria" panel) */
  .control-bar { background: var(--filter-bg); border: 1px solid var(--filter-border); border-radius: 5px; padding: 10px 12px;
    display: flex; gap: 10px 14px; align-items: center; flex-wrap: wrap; margin-bottom: 14px; }
  .ctrl-group { display: flex; gap: 5px; align-items: center; flex-wrap: wrap; }
  .ctrl-label { font-size: 14px; font-weight: 700; margin-right: 4px; white-space: nowrap; }
  .ctrl-btn { font-size: 14px; padding: 4px 10px; border: 1px solid var(--link); border-radius: 4px; background: #fff; cursor: pointer;
    color: var(--link); white-space: nowrap; }
  .ctrl-btn:hover { background: #e7f1ff; }
  .ctrl-btn.active { background: var(--link); color: #fff; }
  .ctrl-btn.cat-ir.active {background:#117733; border-color:#117733; color:white;}
  .ctrl-btn.cat-is.active {background:#CC6677; border-color:#CC6677; color:white;}
  .ctrl-btn.cat-eb.active {background:#CC8833; border-color:#CC8833; color:white;}
  .ctrl-btn.cat-lm.active {background:#332288; border-color:#332288; color:white;}
  .ctrl-divider { width: 1px; height: 26px; background: var(--filter-border); margin: 0 4px; }
</style>
<script src="https://cdnjs.cloudflare.com/ajax/libs/plotly.js/2.26.0/plotly.min.js"></script>
<script>if (new URLSearchParams(location.search).get("embed") === "1") document.body.classList.add("embed");</script>
<script>
import Vue from "vue";
import { BootstrapVue } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

Vue.use(BootstrapVue);

import assays from "../data/assays.json";
const ASSAYS = assays;
const CAT_COLORS = {"IR": "#117733", "IS": "#CC6677", "EB": "#CC8833", "LM": "#332288"};
const CAT_ORDER  = [{"code": "IR", "full": "Insulin responsiveness and glucose handling"}, {"code": "IS", "full": "Insulin secretion"}, {"code": "EB", "full": "Energy balance"}, {"code": "LM", "full": "Lipid metabolism"}];
const SC_TICKS   = {"1": "Low", "3": "Medium", "5": "High"};
const TR_TICKS   = {"1": "Low", "3": "Medium", "5": "High"};
const JITTER     = [[0.0707, 0.0], [-0.0903, 0.0827], [0.0138, -0.1575], [0.1138, 0.1485], [0.0707, 0.0], [-0.0903, 0.0827], [0.0707, 0.0], [0.0138, -0.1575], [0.1138, 0.1485], [-0.2089, -0.0369], [0.0, 0.0], [-0.0903, 0.0827], [0.0707, 0.0], [0.0707, 0.0], [-0.0903, 0.0827], [0.0138, -0.1575], [0.0707, 0.0], [-0.0903, 0.0827], [0.0707, 0.0], [0.0, 0.0], [0.0707, 0.0], [0.0707, 0.0], [-0.0903, 0.0827], [0.0138, -0.1575], [0.0, 0.0], [-0.0903, 0.0827], [0.0138, -0.1575], [0.0, 0.0], [0.1138, 0.1485], [0.0707, 0.0], [-0.0903, 0.0827], [0.0138, -0.1575], [-0.0903, 0.0827], [0.1138, 0.1485], [0.1979, -0.1259], [-0.0662, 0.2462], [-0.2089, -0.0369], [0.1979, -0.1259], [-0.1262, -0.243], [0.2739, 0.1], [-0.0662, 0.2462], [-0.2849, 0.1176], [-0.1262, -0.243], [0.1138, 0.1485], [0.1138, 0.1485], [0.0707, 0.0], [-0.2089, -0.0369], [-0.0903, 0.0827], [0.0707, 0.0], [-0.0903, 0.0827], [0.0138, -0.1575], [0.0707, 0.0], [0.0707, 0.0], [-0.0903, 0.0827], [0.0707, 0.0], [-0.2089, -0.0369], [0.1373, -0.2935], [0.2739, 0.1], [-0.2849, 0.1176], [0.1015, 0.3236], [0.1373, -0.2935], [0.1015, 0.3236], [-0.3059, -0.1773], [-0.0903, 0.0827], [0.0138, -0.1575], [0.1138, 0.1485], [-0.2089, -0.0369], [0.0138, -0.1575], [-0.0903, 0.0827], [0.0138, -0.1575], [0.0138, -0.1575], [0.1138, 0.1485], [0.0138, -0.1575], [0.1138, 0.1485], [-0.2089, -0.0369], [-0.0903, 0.0827], [0.1979, -0.1259], [-0.0662, 0.2462], [0.1979, -0.1259], [-0.0662, 0.2462], [-0.1262, -0.243]];
const QUADRANT_SPLIT = 2.5;
const QUADRANTS = {"HH": "High scalability &amp; high translatability", "HL": "Screen-ready; model-distant", "LH": "Gold standard; throughput-limited", "LL": "Niche / specialist"};
const SC_COLORS  = {5:"#08519C",4:"#3182BD",3:"#6BAED6",2:"#BDD7E7",1:"#EFF3FF"};
const TR_COLORS  = {5:"#016C59",4:"#1C9099",3:"#67A9CF",2:"#BDC9E1",1:"#F1EEF6"};
const MODEL_SYMBOLS = {"In vitro":"circle","Mice":"triangle-up","Zebrafish":"diamond","Drosophila":"star","Multi":"square"};
const FONT = "Roboto, Arial, sans-serif";
const AXIS = {showline:true,linecolor:"#212529",linewidth:1.2,ticks:"outside",ticklen:4,
  tickwidth:1,tickcolor:"#212529",gridcolor:"#e8e8e8",gridwidth:1,zeroline:false,
  tickfont:{size:10,family:FONT,color:"#212529"},title:{font:{size:11.5,family:FONT,color:"#212529"}}};

const catName = code => (CAT_ORDER.find(c=>c.code===code)||{}).full || code;
const ticktext = labels => [1,2,3,4,5].map(t => labels[t] ? `${t}<br><i style='font-size:9px'>${labels[t]}</i>` : String(t));
const built={};

export default Vue.component("interactive-kp", {
    props: [],

    data() {
        return {
          mFilter: "all",
          mSort: "cat"
        };
    },
    created(){
      window.addEventListener("load",()=>{buildScatter();built.scatter=true;});
      console.log(assays.length);
    },
    computed: {
    },
    methods: {
      hoverText(d){
        const details = d.details.length>160 ? d.details.slice(0,160)+"…" : d.details;
        return `<b>${d.assay}</b><br>`+
          `<span style="color:#888">${catName(d.cat)}</span><br>`+
          (d.process ? `<b>Process:</b> ${d.process}<br>` : "")+
          `<b>Model:</b> ${d.model_raw}<br>`+
          `<b>Scalability:</b> ${d.sc}/5${d.sc_label?" ("+d.sc_label+")":""} &nbsp;&middot;&nbsp; <b>Translational:</b> ${d.tr}/5`+
          (details ? `<br><span style="font-size:11px">${details}</span>` : "")+
          `<extra></extra>`;
      },
      buildScatter() {
        const groups = {};
        ASSAYS.forEach((d,i) => {
          const k=d.cat+"|"+d.model;
          if (!groups[k]) groups[k]={cat:d.cat,model:d.model,idx:[]};
          groups[k].idx.push(i);
        });

        const traces = Object.values(groups).map(g => ({
          x:g.idx.map(i=>ASSAYS[i].tr+JITTER[i][0]), y:g.idx.map(i=>ASSAYS[i].sc+JITTER[i][1]),
          type:"scatter", mode:"markers",
          marker:{color:CAT_COLORS[g.cat],symbol:MODEL_SYMBOLS[g.model]||"circle",
            size:g.model==="Drosophila"?18:14,opacity:0.87,line:{color:"white",width:1.5}},
          hovertemplate:g.idx.map(i=>hoverText(ASSAYS[i])), showlegend:false,
        }));

        const Q=QUADRANT_SPLIT, XR=(Q+5.5)/2, XL=(0.5+Q)/2;
        const shapes=[
          {type:"rect",x0:Q,x1:5.5,y0:Q,y1:5.5,fillcolor:"rgba(1,108,89,0.06)",line:{width:0},layer:"below"},
          {type:"rect",x0:0.5,x1:Q,y0:Q,y1:5.5,fillcolor:"rgba(204,102,119,0.05)",line:{width:0},layer:"below"},
          {type:"rect",x0:Q,x1:5.5,y0:0.5,y1:Q,fillcolor:"rgba(8,81,156,0.05)",line:{width:0},layer:"below"},
          {type:"line",x0:Q,x1:Q,y0:0.5,y1:5.5,line:{color:"#BBBBBB",width:1,dash:"dot"}},
          {type:"line",x0:0.5,x1:5.5,y0:Q,y1:Q,line:{color:"#BBBBBB",width:1,dash:"dot"}},
        ];
        // Quadrant names come from the Excel (key = scalability + translational, H/L)
        const ann=[["HH",XR,5.59,"top","#016C59"],["HL",XL,5.59,"top","#CC6677"],
                  ["LH",XR,0.41,"bottom","#08519C"],["LL",XL,0.41,"bottom","#888"]]
          .filter(q=>QUADRANTS[q[0]])
          .map(([k,x,y,ya,c])=>({x,y,yanchor:ya,text:`<b>${QUADRANTS[k]}</b>`,showarrow:false,
            font:{size:9,color:c,family:FONT},bgcolor:"rgba(255,255,255,0.85)",borderpad:3}));
        Plotly.newPlot("scatter-plot",traces,{
          paper_bgcolor:"white",plot_bgcolor:"white",
          margin:{t:16,b:60,l:70,r:20},
          xaxis:{...AXIS,title:{text:"Translational relevance score",font:{size:11.5,family:FONT,color:"#212529"}},
            range:[0.4,5.6],tickvals:[1,2,3,4,5],ticktext:ticktext(TR_TICKS)},
          yaxis:{...AXIS,title:{text:"Scalability score",font:{size:11.5,family:FONT,color:"#212529"}},
            range:[0.4,5.6],tickvals:[1,2,3,4,5],ticktext:ticktext(SC_TICKS)},
          shapes,annotations:ann,hovermode:"closest",
          hoverlabel:{bgcolor:"white",bordercolor:"#ccc",font:{size:12,family:FONT},align:"left"},
        },{responsive:true,displayModeBar:true,modeBarButtonsToRemove:["select2d","lasso2d","toggleSpikelines"],displaylogo:false});
      },
      setFilter(f,btn){
        this.mFilter=f;
        document.querySelectorAll(".ctrl-btn[onclick*=setFilter]").forEach(b=>b.classList.remove("active"));
        btn.classList.add("active"); buildMatrix();
      },
      setSort(s,btn){
        this.mSort=s;
        document.querySelectorAll(".ctrl-btn[onclick*=setSort]").forEach(b=>b.classList.remove("active"));
        btn.classList.add("active"); buildMatrix();
      },
      buildMatrix(){
        const catIdx = c => CAT_ORDER.findIndex(o=>o.code===c);
        let rows = this.mFilter==="all" ? [...ASSAYS] : ASSAYS.filter(d => d.cat===this.mFilter);

        if (this.mSort==="sc-desc") rows.sort((a,b)=>b.sc-a.sc||b.tr-a.tr||catIdx(a.cat)-catIdx(b.cat));
        else if (this.mSort==="tr-desc") rows.sort((a,b)=>b.tr-a.tr||b.sc-a.sc||catIdx(a.cat)-catIdx(b.cat));
        else if (this.mSort==="sc-asc")  rows.sort((a,b)=>a.sc-b.sc||a.tr-b.tr||catIdx(a.cat)-catIdx(b.cat));
        else if (this.mSort==="tr-asc")  rows.sort((a,b)=>a.tr-b.tr||a.sc-b.sc||catIdx(a.cat)-catIdx(b.cat));

        const n=rows.length;
        const yV=rows.map((_,i)=>n-1-i);
        const hov=rows.map(hoverText);

        const scTr={x:rows.map(()=>0),y:yV,type:"scatter",mode:"markers+text",
          marker:{color:rows.map(d=>SC_COLORS[d.sc]),size:22,symbol:"circle",line:{color:"white",width:1.5}},
          text:rows.map(d=>String(d.sc)),
          textfont:{size:9,color:rows.map(d=>d.sc>=3?"#fff":"#333"),family:FONT},
          textposition:"middle center",hovertemplate:hov,showlegend:false};

        const trTr={x:rows.map(()=>1),y:yV,type:"scatter",mode:"markers+text",
          marker:{color:rows.map(d=>TR_COLORS[d.tr]),size:22,symbol:"circle",line:{color:"white",width:1.5}},
          text:rows.map(d=>String(d.tr)),
          textfont:{size:9,color:rows.map(d=>d.tr>=3?"#fff":"#333"),family:FONT},
          textposition:"middle center",hovertemplate:hov,showlegend:false};

        const modelTr={x:rows.map(()=>1.75),y:yV,type:"scatter",mode:"markers",
          marker:{color:rows.map(d=>CAT_COLORS[d.cat]),symbol:rows.map(d=>MODEL_SYMBOLS[d.model]||"circle"),
            size:11,opacity:0.8,line:{color:"white",width:0.8}},
          hovertemplate:hov,showlegend:false};

        const nameTr={x:rows.map(()=>2.1),y:yV,type:"scatter",mode:"text",
          text:rows.map(d=>`${d.assay}${d.process?`  <span style="color:#999">· ${d.process}</span>`:""}`),
          textfont:{size:10.5,color:rows.map(d=>CAT_COLORS[d.cat]),family:FONT},
          textposition:"middle right",hovertemplate:hov,showlegend:false};

        const shapes=[];
        const annotations=[
          {x:0,y:n+0.15,text:"<b>SC</b>",showarrow:false,font:{size:11,color:"#08519C",family:FONT}},
          {x:1,y:n+0.15,text:"<b>TR</b>",showarrow:false,font:{size:11,color:"#016C59",family:FONT}},
          {x:0,y:n+0.85,text:"Scalability",showarrow:false,font:{size:9,color:"#555",family:FONT}},
          {x:1,y:n+0.85,text:"Translational",showarrow:false,font:{size:9,color:"#555",family:FONT}},
        ];

        // Category bands + names when rows are grouped by category
        if (this.mSort==="cat"||this.mFilter!=="all"){
          let prev=null,start=0;
          const bands=[];
          rows.forEach((d,i)=>{
            if(d.cat!==prev){if(prev)bands.push({cat:prev,s:start,e:i-1});start=i;prev=d.cat;}
          });
          if(prev)bands.push({cat:prev,s:start,e:rows.length-1});
          bands.forEach(b=>{
            shapes.push({type:"rect",xref:"paper",x0:0,x1:1,
              y0:n-1-b.e-0.5,y1:n-1-b.s+0.5,
              fillcolor:CAT_COLORS[b.cat]+"14",line:{width:0},layer:"below"});
            if (this.mSort==="cat") annotations.push({xref:"paper",x:0.99,xanchor:"right",y:n-1-b.s,
              text:`<b>${catName(b.cat).toUpperCase()}</b>`,showarrow:false,
              font:{size:9,color:CAT_COLORS[b.cat],family:FONT}});
          });
        }

        const H=Math.max(500,n*24+80);
        document.getElementById("matrix-plot").style.height=H+"px";
        Plotly.newPlot("matrix-plot",[scTr,trTr,modelTr,nameTr],{
          paper_bgcolor:"white",plot_bgcolor:"white",
          margin:{t:30,b:20,l:20,r:40},
          xaxis:{visible:false,range:[-0.6,14],fixedrange:true},
          yaxis:{visible:false,range:[-0.7,n+1.3],fixedrange:true},
          shapes,annotations,hovermode:"closest",height:H,
          hoverlabel:{bgcolor:"white",bordercolor:"#ccc",font:{size:11,family:FONT},align:"left"},
        },{responsive:true,displayModeBar:false});
      },
      switchTab(tab,btn){
        document.querySelectorAll(".panel").forEach(p=>p.classList.remove("active"));
        document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
        document.getElementById("panel-"+tab).classList.add("active");
        btn.classList.add("active");
        if(!built[tab]){
          if(tab==="matrix")buildMatrix();
          built[tab]=true;
        }
      }
    },
});
</script>