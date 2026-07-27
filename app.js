/* ============================================================================
   ENI Brand Value — logica presentazione. Rende KPI, grafici (Chart.js),
   tabelle, diagramma halo (SVG), navigazione, indice, starfield, tastiera.
   Tutti i dati da window.DATA (data.js). Nessuna dipendenza di rete.
   ============================================================================ */
(function () {
  "use strict";
  var D = window.DATA, T = window.OE;
  if (typeof applyOEChartDefaults === "function") applyOEChartDefaults();
  if (window.Chart) {
    Chart.defaults.font.family = T.font.sans; Chart.defaults.color = "#415A6F";
    Chart.defaults.plugins.legend.display = false; Chart.defaults.plugins.tooltip.displayColors = false;
    Chart.defaults.plugins.tooltip.backgroundColor = "#040832";
    Chart.defaults.plugins.tooltip.titleFont = { family: T.font.sans, weight: 650 };
    Chart.defaults.plugins.tooltip.bodyFont = { family: T.font.sans };
    Chart.defaults.plugins.tooltip.padding = 12; Chart.defaults.plugins.tooltip.cornerRadius = 2;
    Chart.defaults.maintainAspectRatio = false; Chart.defaults.animation.duration = 520;
  }

  /* ---------- palette ---------- */
  var BLUETTE = { 400: "#6E748B", 700: "#040832", 900: "#020522" };
  var LIME = { 400: "#8CCE63", 500: "#67B83B", 600: "#4E9A2E" };
  var GRAY = T.gray;
  var DV = { magenta: { 400: "#F26B73", 600: "#DE1135" }, green: { 600: "#16877C" }, yellow: { 600: "#FFD300" } };
  var BRAND = { eni: "#040832", plenitude: "#67B83B", enilive: "#0074A7" };
  // Palette campionate direttamente dai sunburst del PPT (slide 11/12/15/16/27/28).
  // Il blu Eni resta il colore dell'interfaccia; qui prevale la codifica dati della fonte.
  var PPT_SUNBURST = {
    eni: {
      comp: {
        inner: { "Consideration": "#270065", "Awareness": "#4400B3", "Image": "#8742FF" },
        outer: { "Consideration": "#5D408C", "Awareness": "#7340C6", "Image": "#A571FF" }
      },
      contr: {
        parent: { "Plenitude": "#00B33C", "Enilive": "#00FFFF", "Reputazione": "#5902EE", "Fattori Macro": "#340088", "Comunicazione": "#6740A6", "Altro": "#DADADA" },
        child: {
          "Plenitude": ["#40C66D"], "Enilive": ["#40FFFF"], "Reputazione": ["#8341F2", "#8341F2", "#8341F2", "#8341F2"],
          "Fattori Macro": ["#6740A6", "#9279BF"], "Comunicazione": ["#B991FF", "#CBADFF", "#9279BF", "#6E4CA9", "#E3E3E3"], "Altro": ["#E3E3E3"]
        }
      }
    },
    plenitude: {
      comp: {
        inner: { "Awareness": "#315C01", "Consideration": "#67C300", "Image": "#7FF100" },
        outer: { "Awareness": "#658541", "Consideration": "#8DD240", "Image": "#9FF540" }
      },
      contr: {
        parent: { "Eni": "#E5B400", "Enilive": "#00FFFF", "Reputazione": "#315C01", "Fattori Macro": "#67C300", "Digitale": "#7FF100", "Comunicazione": "#D5FFA4", "Altro": "#D0D0D0" },
        child: {
          "Eni": ["#ECC740"], "Enilive": ["#40FFFF"], "Reputazione": ["#658541", "#658541", "#658541", "#8DD240"],
          "Fattori Macro": ["#8DD240", "#9FF540"], "Digitale": ["#9FF540", "#D5FFA4"], "Comunicazione": ["#E0FFBB", "#D5FFA4", "#E0FFBB"], "Altro": ["#DCDCDC"]
        }
      }
    },
    enilive: {
      comp: {
        inner: { "Awareness": "#005B5B", "Consideration": "#00D4D4", "Image": "#9BEBEB" },
        outer: { "Awareness": "#408484", "Consideration": "#40E5E5", "Image": "#BBF2F2" }
      },
      contr: {
        parent: { "Eni": "#5902EE", "Plenitude": "#00B33C", "Reputazione": "#00D4D4", "Fattori Macro": "#9BEBEB", "Digitale": "#005B5B", "Comunicazione": "#027FAF", "Altro": "#D0D3D6" },
        child: {
          "Eni": ["#8341F2"], "Plenitude": ["#40C66D"], "Reputazione": ["#3FDCDC", "#3FDCDC"],
          "Fattori Macro": ["#BBF2F2", "#BBF2F2"], "Digitale": ["#408484", "#408484", "#408484"],
          "Comunicazione": ["#419FC3", "#419FC3", "#419FC3", "#419FC3", "#419FC3"], "Altro": ["#E1E3E5"]
        }
      }
    }
  };

  /* ---------- format ---------- */
  function IT(n, d) { d = d || 0; return new Intl.NumberFormat("it-IT", { minimumFractionDigits: d, maximumFractionDigits: d }).format(n); }
  function trimPct(n) { var s = IT(n, (Math.round(n) === n ? 0 : 1)); return s + "%"; }
  function fx(n) { return "x" + IT(n, (Math.round(n) === n ? 0 : (Math.round(n * 10) === n * 10 ? 1 : 2))); }
  function money(n) { return IT(n, (Math.round(n) === n ? 0 : 1)); }
  function themeOf(el) { return el && el.closest("[data-dark]") ? "dark" : "light"; }
  function ico(kind) {
    if (kind === "up") return '<svg viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
    if (kind === "down") return '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7"/></svg>';
    return '<svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg>';
  }
  function deltaHTML(v, suffix) {
    if (v === null || v === undefined) return '<span class="delta flat">' + ico("flat") + " invariato</span>";
    var cls = v > 0 ? "up" : (v < 0 ? "down" : "flat");
    var sign = v > 0 ? "+" : (v < 0 ? "−" : "");
    return '<span class="delta ' + cls + '">' + ico(cls) + sign + IT(Math.abs(v), (Math.round(v) === v ? 0 : 1)) + (suffix || "") + "</span>";
  }

  /* ---------- assi/temi per grafici ---------- */
  function gridColor(theme) { return theme === "dark" ? "rgba(250,247,239,.22)" : "rgba(4,8,50,.12)"; }
  function tick(theme) { return theme === "dark" ? "rgba(250,247,239,.88)" : "#4B5360"; }
  function baseScales(theme, opt) {
    opt = opt || {};
    return {
      x: { grid: { display: false, drawBorder: false }, ticks: { color: tick(theme), font: { size: 12 }, maxRotation: 0, autoSkip: true, maxTicksLimit: opt.xTicks || 8 } },
      y: { grid: { color: gridColor(theme), drawBorder: false }, ticks: { color: tick(theme), font: { size: 12 }, callback: opt.yCb }, beginAtZero: opt.zero !== false }
    };
  }
  var MONTHS = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
  function dLabel(iso) { var p = iso.split("-"); return MONTHS[parseInt(p[1], 10) - 1] + " '" + p[0].slice(2); }
  function gradient(ctx, area, hex) {
    if (!area) return hex;
    var g = ctx.createLinearGradient(0, area.top, 0, area.bottom);
    g.addColorStop(0, hexA(hex, .28)); g.addColorStop(1, hexA(hex, 0)); return g;
  }
  function hexA(hex, a) { var n = parseInt(hex.slice(1), 16); return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")"; }

  var VALUE_LABELS = {
    id: "valueLabels",
    afterDatasetsDraw: function (chart, args, opts) {
      if (!opts || opts.display === false) return;
      var horizontal = chart.options.indexAxis === "y";
      var ctx = chart.ctx;
      ctx.save();
      ctx.font = "650 12px " + T.font.sans;
      ctx.textBaseline = "middle";
      chart.data.datasets.forEach(function (ds, di) {
        var meta = chart.getDatasetMeta(di);
        if (meta.hidden) return;
        meta.data.forEach(function (bar, i) {
          var raw = ds.data[i];
          if (raw === null || raw === undefined) return;
          var p = bar.getProps(["x", "y", "base", "width", "height"], true);
          var label = opts.formatter ? opts.formatter(raw, ds, i) : String(raw);
          if (opts.inside) {
            if (Math.abs(p.x - p.base) < (opts.minWidth || 46)) return;
            ctx.textAlign = "center"; ctx.fillStyle = opts.color || "#FAF7EF";
            ctx.fillText(label, (p.x + p.base) / 2, p.y);
          } else if (horizontal) {
            ctx.textAlign = "left"; ctx.fillStyle = opts.color || "#040832";
            ctx.fillText(label, p.x + 8, p.y);
          } else {
            ctx.textAlign = "center"; ctx.fillStyle = opts.color || "#FAF7EF";
            ctx.fillText(label, p.x, p.y - 12);
          }
        });
      });
      ctx.restore();
    }
  };
  var BREAK_EVEN = {
    id: "breakEven",
    afterDraw: function (chart, args, opts) {
      if (!opts || opts.display === false || !chart.scales.x) return;
      var x = chart.scales.x.getPixelForValue(opts.value || 1), area = chart.chartArea, ctx = chart.ctx;
      ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = opts.color || "rgba(255,255,255,.45)";
      ctx.beginPath(); ctx.moveTo(x, area.top); ctx.lineTo(x, area.bottom); ctx.stroke();
      ctx.setLineDash([]); ctx.fillStyle = opts.color || "rgba(255,255,255,.65)";
      ctx.font = "600 11px " + T.font.sans; ctx.textAlign = "left"; ctx.fillText("break-even", x + 6, area.top + 10);
      ctx.restore();
    }
  };

  /* ---------- KPI ---------- */
  function kpi(brand, val, unit, sub, delta) {
    return '<div class="kpi" style="--brandc:' + (BRAND[brand] || "var(--accent)") + '">' +
      '<span class="brand">' + brandLabel(brand) + "</span>" +
      '<span class="val num">' + val + (unit ? '<span class="unit"> ' + unit + "</span>" : "") + "</span>" +
      (delta ? '<span class="sub">' + delta + "</span>" : "") +
      (sub ? '<span class="sub">' + sub + "</span>" : "") + "</div>";
  }
  function brandLabel(b) { return { eni: "Eni", plenitude: "Plenitude", enilive: "Enilive", spain: "Plenitude Spagna", portugal: "Plenitude Portogallo" }[b] || b; }

  function buildKPIs() {
    var b = D.bcf;
    document.getElementById("kpiBcf").innerHTML =
      kpi("eni", trimPct(b.eni), "", null, deltaHTML(+(b.eni - b.eniPrev).toFixed(1), " p.p. vs 2024")) +
      kpi("plenitude", trimPct(b.plenitude), "", null, deltaHTML(+(b.plenitude - b.plenitudePrev).toFixed(1), " p.p. vs 2024")) +
      kpi("enilive", trimPct(b.enilive), "", "Contributo più alto del gruppo", null);
    var v = D.brandValue;
    document.getElementById("kpiValue").innerHTML =
      kpi("eni", "€ " + money(v.eni.median), "Mln") +
      kpi("plenitude", "€ " + money(v.plenitude.median), "Mln") +
      kpi("enilive", "€ " + money(v.enilive.median), "Mln");
    document.getElementById("kpiIberia").innerHTML =
      kpi("spain", "€ " + money(v.spain.median), "Mln", "Trainato dall'espansione retail") +
      kpi("portugal", "€ " + money(v.portugal.median), "Mln", "Contributo marginalmente inferiore");
  }

  /* ---------- composizione (sunburst a due anelli + tabella) ---------- */
  var COMP_LABELS = { eni: "ENI", plenitude: "Plenitude", spain: "Spagna", portugal: "Portogallo", enilive: "Enilive" };
  var IMG_DIMS = ["Sostenibilità", "Prodotti e servizi", "Visione", "Affidabilità/Vicinanza"];
  function paletteKey(key) { return (key === "spain" || key === "portugal") ? "plenitude" : key; }
  function readableOn(hex) {
    if (!hex || hex.charAt(0) !== "#") return "#020522";
    var n = parseInt(hex.slice(1), 16);
    var rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(function (v) {
      v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4);
    });
    return (.2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2]) > .18 ? "#020522" : "#FFFFFF";
  }
  function sunburstCenter(title, subtitle) {
    return {
      id: "sunburstCenter",
      afterDatasetsDraw: function (chart) {
        var meta = chart.getDatasetMeta(0), first = meta && meta.data && meta.data[0];
        if (!first) return;
        var p = first.getProps(["x", "y"], true), cx = p.x, cy = p.y, ctx = chart.ctx;
        ctx.save(); ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillStyle = "#040832"; ctx.font = "650 21px " + T.font.sans;
        ctx.fillText(title, cx, cy - 7);
        ctx.fillStyle = "#4B5360"; ctx.font = "650 10.5px " + T.font.sans;
        ctx.fillText(subtitle || "BRAND INDEX", cx, cy + 13);
        ctx.restore();
      }
    };
  }
  var LABEL_BREAKS = {
    "Prodotti e servizi": ["Prodotti e", "servizi"], "Affidabilità/Vicinanza": ["Affidabilità", "Vicinanza"],
    "Fattori Macro": ["Fattori", "macro"], "Prezzi energia": ["Prezzi", "energia"],
    "Sito e app": ["Sito e", "app"], "News online": ["News", "online"], "Altri canali": ["Altri", "canali"],
    "Social media": ["Social", "media"], "Serie A": ["Serie A"], "Sponsorizzazioni": ["Sponsor"],
    "Rebranding stazioni": ["Rebranding", "stazioni"], "Social exposure": ["Social", "exposure"], "Social engagement": ["Social", "engagement"]
  };
  function sunburstLabels() {
    return {
      id: "sunburstLabels",
      afterDatasetsDraw: function (chart) {
        var ctx = chart.ctx, compact = chart.width < 430;
        chart.data.datasets.forEach(function (ds, di) {
          var meta = chart.getDatasetMeta(di);
          meta.data.forEach(function (arc, i) {
            if (ds._suppressLabels && ds._suppressLabels[i]) return;
            var value = Number(ds.data[i]), label = ds._labels && ds._labels[i];
            if (!value || !label) return;
            var p = arc.getProps(["x", "y", "startAngle", "endAngle", "innerRadius", "outerRadius"], true);
            var angle = (p.startAngle + p.endAngle) / 2, span = p.endAngle - p.startAngle;
            var radius = (p.innerRadius + p.outerRadius) / 2, thickness = p.outerRadius - p.innerRadius;
            var arcLength = span * radius, lines = LABEL_BREAKS[label] || [label];
            var isInner = ds._ring === "inner";
            var fontSize = isInner ? (compact ? 8.5 : 10.5) : (compact ? 7 : 9);
            if (arcLength < fontSize * (lines.length + .65)) return;
            if (compact && !isInner && (value < 4 || lines.join(" ").length > 14)) return;
            var fill = Array.isArray(ds.backgroundColor) ? ds.backgroundColor[i] : ds.backgroundColor;
            ctx.save(); ctx.textAlign = "center"; ctx.textBaseline = "middle";
            var maxTextWidth = isInner ? arcLength * .82 : thickness * 1.55;
            while (fontSize > 7) {
              ctx.font = "750 " + fontSize + "px " + T.font.sans;
              var widest = Math.max.apply(null, lines.map(function (line) { return ctx.measureText(line).width; }));
              if (widest <= maxTextWidth) break;
              fontSize -= .5;
            }
            ctx.font = "750 " + fontSize + "px " + T.font.sans;
            if (Math.max.apply(null, lines.map(function (line) { return ctx.measureText(line).width; })) > maxTextWidth * 1.08) { ctx.restore(); return; }
            if (isInner && lines.length * (fontSize + 1) > thickness * .74) { ctx.restore(); return; }
            ctx.fillStyle = readableOn(fill);
            var x = p.x + Math.cos(angle) * radius, y = p.y + Math.sin(angle) * radius;
            var rotation = isInner ? angle + Math.PI / 2 : angle;
            if (Math.cos(rotation) < 0) rotation += Math.PI;
            ctx.translate(x, y); ctx.rotate(rotation);
            var lineHeight = fontSize + 1;
            lines.forEach(function (line, li) { ctx.fillText(line, 0, (li - (lines.length - 1) / 2) * lineHeight); });
            ctx.restore();
          });
        });
      }
    };
  }
  function buildComposition() {
    document.querySelectorAll("[data-comp]").forEach(function (grid) {
      var key = grid.getAttribute("data-comp"), cfg = D.composition[key];
      var by = cfg.donut;                 // valori attuali (2025) → sunburst
      var table = cfg.table || [];        // Valore 2024 + variazione → tabella
      var aware = by["Awareness"] || 0, cons = by["Consideration"] || 0;
      var imgTotal = IMG_DIMS.reduce(function (s, k) { return s + (by[k] || 0); }, 0);
      var palette = PPT_SUNBURST[paletteKey(key)].comp;
      var values = { "Awareness": aware, "Consideration": cons, "Image": imgTotal };
      var macroOrder = key === "eni" ? ["Consideration", "Awareness", "Image"] : ["Awareness", "Consideration", "Image"];
      var inner = { data: macroOrder.map(function (k) { return values[k]; }), _labels: macroOrder,
        backgroundColor: macroOrder.map(function (k) { return palette.inner[k]; }) };
      var outerLabels = [], outerValues = [], outerColors = [], outerSuppress = [];
      macroOrder.forEach(function (k) {
        if (k === "Image") {
          IMG_DIMS.forEach(function (dim) { outerLabels.push(dim); outerValues.push(by[dim] || 0); outerColors.push(palette.outer.Image); outerSuppress.push(false); });
        } else {
          outerLabels.push(k); outerValues.push(values[k]); outerColors.push(palette.outer[k]); outerSuppress.push(true);
        }
      });
      var outer = { data: outerValues, _labels: outerLabels, _suppressLabels: outerSuppress, backgroundColor: outerColors };
      new Chart(grid.querySelector("canvas"), {
        type: "doughnut",
        data: {
          datasets: [
            { data: outer.data, backgroundColor: outer.backgroundColor, _labels: outer._labels, _suppressLabels: outer._suppressLabels, _ring: "outer", borderColor: "#FAF7EF", borderWidth: 3, weight: 1.12, hoverOffset: 5 },
            { data: inner.data, backgroundColor: inner.backgroundColor, _labels: inner._labels, _ring: "inner", borderColor: "#FAF7EF", borderWidth: 2, weight: 1, hoverOffset: 3 }
          ]
        },
        plugins: [sunburstCenter(COMP_LABELS[key] || "", "BRAND INDEX"), sunburstLabels()],
        options: {
          cutout: "31%", rotation: -90, animation: { animateRotate: true, duration: 600 },
          plugins: {
            tooltip: {
              callbacks: {
                title: function (it) { var d = it[0]; return d.chart.data.datasets[d.datasetIndex]._labels[d.dataIndex]; },
                label: function (c) { return trimPct(c.parsed); }
              }
            }
          }
        }
      });
      var tbl = grid.querySelector("[data-comptable]");
      var t = {}; table.forEach(function (r) { t[r[0]] = r; });   // nome -> [nome, valore2024, variazione]
      var imgTot24 = IMG_DIMS.reduce(function (s, k) { return s + ((t[k] && t[k][1]) || 0); }, 0);
      function cell(name, color, sub) {
        var r = t[name]; if (!r) return "";
        return "<tr class='" + (sub ? "sub" : "") + "'><td><span class='swatch' style='background:" + color + "'></span>" + name + "</td>" +
          "<td class='r num'>" + trimPct(r[1]) + "</td><td class='r'>" + deltaHTML(r[2], "") + "</td></tr>";
      }
      var head = "<thead><tr><th>Componente</th><th class='r'>Valore 2024</th><th class='r'>Variazione p.p.</th></tr></thead>";
      var groupRow = "<tr class='grp'><td colspan='3'>Image · " + trimPct(imgTot24) + "</td></tr>";
      var body = "<tbody>" + cell("Awareness", palette.outer.Awareness) + cell("Consideration", palette.outer.Consideration) +
        groupRow + IMG_DIMS.map(function (k) { return cell(k, palette.outer.Image, true); }).join("") + "</tbody>";
      tbl.innerHTML = head + body;
    });
  }

  /* ---------- contributi (sunburst gerarchico + tabella) ----------
     Struttura, valori e colori presi dai sunburst originali del ppt (slide 12/16/28).
     Ogni driver: {n:nome, v:valore%, d:variazione p.p. o null, c:colore, leaves:[[label,valore,colore]...]}.
     I valori di ciascun sunburst sommano a 100%. */
  var CONTRIB = {
    eni: { center: "ENI", drivers: [
      { n: "Plenitude", v: 13.2, d: null, c: "#16A34A", leaves: [["Plenitude", 13.2, "#3FBF6B"]] },
      { n: "Enilive", v: 12, d: null, c: "#00C4C4", leaves: [["Enilive", 12, "#40D9D9"]] },
      { n: "Reputazione", v: 17, d: null, c: "#6E1AFF", leaves: [["Digitale", 6.2, "#9B6BFF"], ["Stampa", 5.2, "#9B6BFF"], ["TV", 3.2, "#9B6BFF"], ["Radio", 2.4, "#9B6BFF"]] },
      { n: "Fattori Macro", v: 16, d: null, c: "#2E0A70", leaves: [["Inflazione", 10.2, "#4B18A8"], ["Prezzi energia", 5.8, "#5E2AC8"]] },
      { n: "Digitale", v: 9, d: null, c: "#8742FF", leaves: [["Sito", 4.2, "#AC8CFF"], ["Social", 4.8, "#AC8CFF"]] },
      { n: "Comunicazione", v: 2.4, d: null, c: "#C4A6FF", leaves: [["TV", 0.8, "#DBC8FF"], ["Digital", 0.5, "#DBC8FF"], ["Altro", 1.1, "#DBC8FF"]] },
      { n: "Altro", v: 30.4, d: null, c: "#D2D2D2", leaves: [["Altro", 30.4, "#E3E3E3"]] }
    ]},
    plenitude: { center: "Plenitude", drivers: [
      { n: "Eni", v: 7.6, d: null, c: "#E0A100", leaves: [["Eni", 7.6, "#F0C24D"]] },
      { n: "Enilive", v: 9.2, d: null, c: "#00C4C4", leaves: [["Enilive", 9.2, "#40D9D9"]] },
      { n: "Reputazione", v: 27, d: null, c: "#4C7A2E", leaves: [["Social", 7.7, "#6E9A50"], ["News online", 12.3, "#6E9A50"], ["Stampa", 6.5, "#6E9A50"], ["TV", 0.5, "#6E9A50"]] },
      { n: "Fattori Macro", v: 23.8, d: null, c: "#5FA82A", leaves: [["Inflazione", 6.8, "#83C74E"], ["Prezzi energia", 17, "#83C74E"]] },
      { n: "Digitale", v: 18, d: null, c: "#8FD62E", leaves: [["Sito e app", 15.8, "#ACE45C"], ["Social", 2.2, "#ACE45C"]] },
      { n: "Comunicazione", v: 8.7, d: null, c: "#C3EE8A", leaves: [["TV", 2.7, "#DCF6B4"], ["Digital", 5, "#DCF6B4"], ["Altro", 1, "#DCF6B4"]] },
      { n: "Altro", v: 5.7, d: null, c: "#D2D2D2", leaves: [["Altro", 5.7, "#E3E3E3"]] }
    ]},
    enilive: { center: "Enilive", drivers: [
      { n: "Eni", v: 13, d: null, c: "#5902EE", leaves: [["Eni", 13, "#8341F2"]] },
      { n: "Plenitude", v: 7, d: null, c: "#00B33C", leaves: [["Plenitude", 7, "#40C66D"]] },
      { n: "Reputazione", v: 9, d: null, c: "#00C4C4", leaves: [["Digitale", 2, "#3FD6D6"], ["Altri canali", 7, "#3FD6D6"]] },
      { n: "Fattori Macro", v: 24, d: null, c: "#66C2C2", leaves: [["Inflazione", 6, "#93D6D6"], ["Prezzi energia", 18, "#93D6D6"]] },
      { n: "Digitale", v: 15, d: null, c: "#005B5B", leaves: [["Social exposure", 6.5, "#3E8384"], ["Sito", 5, "#3E8384"], ["Social engagement", 3.5, "#3E8384"]] },
      { n: "Comunicazione", v: 12.9, d: null, c: "#027FAF", leaves: [["Rebranding stazioni", 5.7, "#3F9FC3"], ["Serie A", 4.9, "#3F9FC3"], ["TV", 1.7, "#3F9FC3"], ["Digital", 0.2, "#3F9FC3"], ["Altro", 0.4, "#3F9FC3"]] },
      { n: "Altro", v: 19.1, d: null, c: "#CFD2D5", leaves: [["Altro", 19.1, "#E1E3E5"]] }
    ]}
  };
  function buildContribution() {
    document.querySelectorAll("[data-contr]").forEach(function (box) {
      var key = box.getAttribute("data-contr"), cfg = CONTRIB[key]; if (!cfg) return;
      var drivers = cfg.drivers, oVal = [], oLab = [], oPar = [], oCol = [], oSup = [];
      drivers.forEach(function (dr) {
        dr.leaves.forEach(function (lf) {
          oVal.push(lf[1]); oLab.push(lf[0]); oPar.push(dr.n); oCol.push(lf[2]);
          oSup.push(dr.leaves.length === 1 && lf[0] === dr.n);
        });
      });
      new Chart(box.querySelector("canvas"), {
        type: "doughnut",
        data: { datasets: [
          { data: oVal, backgroundColor: oCol, _labels: oLab, _parents: oPar, _suppressLabels: oSup, _ring: "outer", borderColor: "#FAF7EF", borderWidth: 2, weight: 1.12, hoverOffset: 5 },
          { data: drivers.map(function (d) { return d.v; }), backgroundColor: drivers.map(function (d) { return d.c; }), _labels: drivers.map(function (d) { return d.n; }), _ring: "inner", borderColor: "#FAF7EF", borderWidth: 2, weight: 1 }
        ] },
        plugins: [sunburstCenter(cfg.center, "DRIVER DEL BRAND INDEX"), sunburstLabels()],
        options: {
          cutout: "31%", rotation: -90, animation: { animateRotate: true, duration: 600 },
          plugins: { tooltip: { callbacks: {
            title: function (it) { var d = it[0], ds = d.chart.data.datasets[d.datasetIndex]; return (ds._parents && ds._parents[d.dataIndex] && ds._parents[d.dataIndex] !== ds._labels[d.dataIndex] ? ds._parents[d.dataIndex] + " · " : "") + ds._labels[d.dataIndex]; },
            label: function (c) { return trimPct(c.parsed) + (c.dataset._ring === "outer" ? " del Brand Index" : ""); }
          } } }
        }
      });
      // Tabella = riepilogo "Valore 2024" + variazione p.p. (dalla tabella ppt); il sunburst mostra l'attuale.
      var table = box.querySelector("[data-contrtable]");
      var colorOf = {}; drivers.forEach(function (dr) { colorOf[dr.n] = dr.c; });
      var t24 = D.contribution[key] || [];
      table.innerHTML = "<thead><tr><th>Driver</th><th class='r'>Valore 2024</th><th class='r'>Variazione p.p.</th></tr></thead><tbody>" +
        t24.map(function (r) {
          var name = r[0] === "ENI" ? "Eni" : r[0];
          return "<tr><td><span class='swatch' style='background:" + (colorOf[name] || "#CFD2D5") + "'></span>" + name + "</td><td class='r num'>" + trimPct(r[1]) + "</td><td class='r'>" +
            (r[2] === null || r[2] === undefined ? "<span class='delta flat'>n.d.</span>" : deltaHTML(r[2], "")) + "</td></tr>";
        }).join("") + "</tbody>";
    });
  }

  /* ---------- ROI (barre canale + totale) ---------- */
  function buildROI() {
    document.querySelectorAll("[data-roi]").forEach(function (grid) {
      var key = grid.getAttribute("data-roi"), r = D.roi[key], theme = themeOf(grid);
      var ch = r.ch, labels = ch.map(function (x) { return x[0]; }), vals = ch.map(function (x) { return x[1]; });
      var bkey = { eni: "eni", plenitude: "plenitude", spain: "plenitude", portugal: "plenitude", enilive: "enilive" }[key];
      // su fondo scuro i colori di brand scuri sparirebbero: si usa una variante chiara e brillante
      var BAR_DARK = { eni: "#FFD300", plenitude: "#8CCE63", enilive: "#4FB0E0" };
      var barcol = theme === "dark" ? (BAR_DARK[bkey] || "#FFD300") : (BRAND[bkey] || BRAND.eni);
      new Chart(grid.querySelector("canvas"), {
        type: "bar",
        data: { labels: labels, datasets: [{ data: vals, backgroundColor: barcol, borderRadius: 0, maxBarThickness: 64 }] },
        plugins: [VALUE_LABELS, BREAK_EVEN],
        options: {
          indexAxis: "y", layout: { padding: { right: 52 } },
          scales: {
            x: { grid: { color: gridColor(theme), drawBorder: false }, ticks: { color: tick(theme), callback: function (v) { return "x" + v; } }, beginAtZero: true },
            y: { grid: { display: false }, ticks: { color: tick(theme), font: { size: 13, weight: 600 } } }
          },
          plugins: {
            valueLabels: { color: theme === "dark" ? "#FAF7EF" : "#040832", formatter: function (v) { return fx(v); } },
            breakEven: { value: 1, color: theme === "dark" ? "rgba(255,255,255,.48)" : "rgba(36,40,36,.42)" },
            tooltip: { callbacks: { label: function (c) { return fx(c.parsed.x) + " valore di brand per €"; } }
            }
          }
        }
      });
      var tot = grid.querySelector(".roi-total");
      if (tot) {
        var dl = (r.prev !== null && r.prev !== undefined && r.prev !== 0) ? deltaHTML(+(r.total - r.prev).toFixed(1), " vs anno prec.") : "";
        tot.innerHTML = '<div class="fig-label">ROI totale</div>' +
          '<div class="num" style="font-family:var(--oe-font-sans);font-weight:600;font-size:clamp(56px,8vw,104px);line-height:.9;color:' + (theme === "dark" ? "#fff" : "var(--accent)") + '">' + fx(r.total) + "</div>" +
          '<p class="sub" style="margin-top:12px;font-size:15px">' + (dl || "valore di brand per ogni € investito") + "</p>";
      }
    });
  }

  /* ---------- BCF trajectory ---------- */
  function buildBcfTraj() {
    var years = D.bcfTrajectory.years;
    function panel(canvasId, color, actual, forecast) {
      new Chart(document.getElementById(canvasId), {
        type: "line",
        data: { labels: years, datasets: [
          { label: "Storico", data: actual, borderColor: color, backgroundColor: color, borderWidth: 3, tension: .24, pointRadius: 4, pointBackgroundColor: color, spanGaps: false },
          { label: "Previsione", data: forecast, borderColor: color, backgroundColor: color, borderWidth: 2.5, borderDash: [7, 6], tension: .24, pointRadius: 3, pointStyle: "rectRot", spanGaps: false }
        ] },
        options: {
          interaction: { mode: "nearest", intersect: false },
          scales: {
            x: { grid: { display: false }, ticks: { color: "#565B6B", font: { size: 12 } } },
            y: { min: 0, max: 16, grid: { color: gridColor("light") }, ticks: { stepSize: 4, color: "#565B6B", callback: function (v) { return v + "%"; } } }
          },
          plugins: { tooltip: { callbacks: { label: function (c) { return c.dataset.label + ": " + IT(c.parsed.y, 1) + "%"; } } } }
        }
      });
    }
    panel("chBcfPlenitude", BRAND.plenitude, [9.9, 11.8, 9.6, 7.8, null, null], [null, null, null, 7.8, 6.3, 5.1]);
    panel("chBcfEnilive", BRAND.enilive, [null, null, 10.6, 13.8, null, null], [null, null, null, 13.8, 11.6, 9.8]);
  }

  /* ---------- competitor ---------- */
  /* ---------- competitor: confronto testa a testa ---------- */
  function buildMatchups() {
    var host = document.getElementById("matchups"); if (!host) return;
    var COMP = "#B15A42"; // colore competitor (terracotta)
    var M = [
      { g: { n: "Eni", c: "#0958A5" }, o: { n: "Enel" },
        rows: [["BCF", 2.2, 2.6, "pct"], ["Valore (Mln €)", 9135, 10397, "eur"], ["ROI comunicazione", 3.8, 6.0, "x"]],
        verdict: "Il contributo del brand di Enel resta strutturalmente superiore a quello di Eni, al netto delle oscillazioni annuali." },
      { g: { n: "Plenitude", c: "#67B83B" }, o: { n: "Edison", proxy: true },
        rows: [["BCF", 7.8, 18.1, "pct", true], ["Valore (Mln €)", 806, 1396, "eur", true], ["ROI comunicazione", 8.1, 8.7, "x", true]],
        verdict: "BCF molto superiore, ma il brand value di Edison scende per le performance finanziarie negative dell'azienda." },
      { g: { n: "Enilive", c: "#0074A7" }, o: { n: "Q8", proxy: true },
        rows: [["BCF", 13.8, 13.0, "pct", true], ["Valore (Mln €)", 2257, 600, "eur", true], ["ROI comunicazione", 4.8, 5.1, "x", true]],
        verdict: "Contributo del brand simile: la differenza di valore nasce dalle performance finanziarie, non dalla forza del marchio." }
    ];
    function grp(v) { return new Intl.NumberFormat("it-IT", { useGrouping: "always" }).format(v); }
    function fmt(v, kind) { return kind === "pct" ? trimPct(v) : (kind === "eur" ? grp(v) : fx(v)); }
    host.innerHTML = M.map(function (m) {
      var rows = m.rows.map(function (r) {
        var label = r[0], g = r[1], o = r[2], kind = r[3], oProxy = r[4];
        var max = Math.max(g, o) || 1, gw = Math.round(g / max * 100), ow = Math.round(o / max * 100);
        return "<div class='mrow'><div class='mrow__label'>" + label + "</div><div class='mgrid'>" +
          "<span class='mval l' style='color:" + m.g.c + "'>" + fmt(g, kind) + "</span>" +
          "<div class='mtrack l'><div class='mbar' style='width:" + gw + "%;background:" + m.g.c + "'></div></div>" +
          "<div class='mtrack r'><div class='mbar' style='width:" + ow + "%;background:" + COMP + "'></div></div>" +
          "<span class='mval r' style='color:" + COMP + "'>" + fmt(o, kind) + (oProxy ? "*" : "") + "</span>" +
          "</div></div>";
      }).join("");
      return "<div class='mcard stag' style='--gcol:" + m.g.c + "'>" +
        "<div class='mcard__head'><span class='mteam' style='color:" + m.g.c + "'>" + m.g.n + "<small>Gruppo Eni</small></span>" +
        "<span class='mvs'>vs</span>" +
        "<span class='mteam r' style='color:" + COMP + "'>" + m.o.n + (m.o.proxy ? "*" : "") + "<small>Competitor</small></span></div>" +
        "<div class='mrows'>" + rows + "</div>" +
        "<p class='mcard__verdict'>" + m.verdict + "</p></div>";
    }).join("");
  }
  function buildCompetitors() {
    // BCF: coppie gruppo/competitor
    competitorBar("chCompBcf", [
      { label: "Eni", value: 2.2, group: true }, { label: "Enel", value: 2.6 },
      { label: "Plenitude", value: 7.8, group: true }, { label: "Edison", value: 18.1, proxy: true },
      { label: "Enilive", value: 13.8, group: true }, { label: "Q8", value: 13.0, proxy: true }
    ], themeOf(document.getElementById("chCompBcf")), "%");
    // Brand value (da chart nativo) — ordinato desc
    var bv = D.brandValueBars, group = { Eni: 1, Plenitude: 1, Enilive: 1 }, proxy = { Q8: 1, Edison: 1 };
    var entries = bv.labels.map(function (l, i) { return { label: l, value: bv.values[i], group: !!group[l], proxy: !!proxy[l] }; })
      .sort(function (a, b) { return b.value - a.value; });
    competitorBar("chCompVal", entries, themeOf(document.getElementById("chCompVal")), "€", true);
    // ROI
    competitorBar("chCompRoi", [
      { label: "Eni", value: 3.8, group: true }, { label: "Enel", value: 6.0 },
      { label: "Plenitude", value: 8.1, group: true }, { label: "Edison", value: 5.1, proxy: true },
      { label: "Enilive", value: 4.8, group: true }, { label: "Q8", value: 8.7, proxy: true }
    ], themeOf(document.getElementById("chCompRoi")), "x");
  }

  /* ---------- serie storiche ---------- */
  var tsCharts = {};
  function tsChart(canvasId, key, color, theme) {
    var s = D.ts[key];
    var cv = document.getElementById(canvasId);
    if (tsCharts[canvasId]) tsCharts[canvasId].destroy();
    tsCharts[canvasId] = new Chart(cv, {
      type: "line",
      data: {
        labels: s.labels.map(dLabel),
        datasets: [{
          data: s.values, borderColor: color, borderWidth: 2.5, tension: .18, pointRadius: 0, pointHoverRadius: 4,
          fill: false, backgroundColor: color
        }]
      },
      options: {
        interaction: { mode: "index", intersect: false },
        scales: baseScales(theme, { xTicks: 7, zero: false }),
        plugins: { tooltip: { callbacks: { title: function (it) { return it[0].label; }, label: function (c) { return IT(c.parsed.y, 2); } } } }
      }
    });
  }

  /* ---------- tabelle appendice ---------- */
  function buildTables() {
    var v = D.brandValue, order = [["Eni", "eni"], ["Plenitude", "plenitude"], ["Enilive", "enilive"], ["Plenitude Spagna", "spain"], ["Plenitude Portogallo", "portugal"]];
    document.getElementById("tblWacc").innerHTML =
      "<thead><tr><th>Brand</th><th class='r'>Lower bound<br>(7,0%)</th><th class='r'>Scenario mediano<br>(6,5%)</th><th class='r'>Upper bound<br>(6,0%)</th></tr></thead><tbody>" +
      order.map(function (o) { var x = v[o[1]]; return "<tr><td>" + o[0] + "</td><td class='r num'>" + money(x.lower) + "</td><td class='r num'>" + money(x.median) + "</td><td class='r num'>" + money(x.upper) + "</td></tr>"; }).join("") + "</tbody>";
    document.getElementById("tblBil").innerHTML =
      "<thead><tr><th>Entità</th><th>Anno</th><th class='r'>Utile netto adjusted (Mln €)</th></tr></thead><tbody>" +
      D.bilancio.map(function (r) { return "<tr><td>" + r[0] + "</td><td>" + r[1] + "</td><td class='r num'>" + IT(r[2]) + "</td></tr>"; }).join("") + "</tbody>";
    renderProxy("q8");
  }
  function renderProxy(key) {
    document.getElementById("tblProxy").innerHTML =
      "<thead><tr><th>Compagnia</th><th class='r'>Peso</th><th>Razionale</th></tr></thead><tbody>" +
      D.proxy[key].map(function (r) { return "<tr><td>" + r[0] + "</td><td class='r num'>" + IT(r[1], 1) + "%</td><td style='font-weight:300'>" + r[2] + "</td></tr>"; }).join("") + "</tbody>";
  }

  /* ---------- halo matrix ---------- */
  function buildHalo() {
    var h = D.halo;
    function brand(key, label) {
      var src = key === "eni" ? "assets/eni-logo.svg" : (key === "plenitude" ? "assets/plenitude-logo-white.svg" : "assets/enilive-logo.svg");
      return '<div class="halo-brand halo-brand--' + key + '"><img src="' + src + '" alt="' + label + '"></div>';
    }
    function diagonal() { return '<div class="halo-cell halo-cell--na"><span>—</span><small>stesso brand</small></div>'; }
    function ns() { return '<div class="halo-cell halo-cell--ns"><strong>n.s.</strong><span>nessun effetto misurabile</span></div>'; }
    function effect(tone, title, metricA, valueA, metricB, valueB) {
      return '<div class="halo-cell halo-cell--' + tone + '"><strong>' + title + '</strong>' +
        '<span>' + metricA + ' <b>' + (valueA > 0 ? "+" : "") + IT(valueA, 2) + '</b></span>' +
        '<span>' + metricB + ' <b>' + (valueB > 0 ? "+" : "") + IT(valueB, 2) + '</b></span></div>';
    }
    document.getElementById("haloMatrix").innerHTML =
      '<div class="halo-corner">Genera ↓<br>Riceve →</div>' + brand("eni", "Eni") + brand("plenitude", "Plenitude") + brand("enilive", "Enilive") +
      brand("eni", "Eni") + diagonal() + effect("negative", "Sostituzione", "Awareness", h.eniPlenitude.awareness, "Image", h.eniPlenitude.image) + ns() +
      brand("plenitude", "Plenitude") + effect("negative", "Sostituzione", "Consideration", h.plenitudeEni.consideration, "Image", h.plenitudeEni.image) + diagonal() + ns() +
      brand("enilive", "Enilive") + effect("positive", "Halo positivo", "Awareness", h.eniliveEni.awareness, "Image", h.eniliveEni.image) + effect("positive", "Halo positivo", "Awareness", h.enilivePlenitude.awareness, "Image", h.enilivePlenitude.image) + diagonal();
  }

  /* ---------- tabs ---------- */
  function wireTabs(id, cb) {
    var box = document.getElementById(id); if (!box) return;
    box.addEventListener("click", function (e) {
      var b = e.target.closest(".tab"); if (!b) return;
      box.querySelectorAll(".tab").forEach(function (t) { t.setAttribute("aria-selected", t === b ? "true" : "false"); });
      cb(b.getAttribute("data-key"));
    });
  }

  /* ---------- navigazione / TOC / progress / dot-nav ---------- */
  function buildNav() {
    var sections = [].slice.call(document.querySelectorAll("main > section"));
    // dot-nav per capitolo (prima sezione di ogni gruppo data-chap)
    var chapters = [], seen = {};
    sections.forEach(function (s) { var c = s.getAttribute("data-chap"); if (!seen[c]) { seen[c] = 1; chapters.push({ id: s.id, label: s.getAttribute("data-nav") || c, chap: c }); } });
    var dots = document.getElementById("navdots");
    dots.innerHTML = chapters.map(function (c) { return '<a href="#' + c.id + '" data-for="' + c.id + '" data-label="' + c.chap + '" aria-label="' + c.chap + '"></a>'; }).join("");

    // TOC overlay
    var groups = {};
    sections.forEach(function (s) {
      var c = s.getAttribute("data-chap"); if (!groups[c]) groups[c] = [];
      groups[c].push({ id: s.id, nav: s.getAttribute("data-nav") });
    });
    var order = [], seen2 = {};
    sections.forEach(function (s) { var c = s.getAttribute("data-chap"); if (!seen2[c]) { seen2[c] = 1; order.push(c); } });
    document.getElementById("tocGrid").innerHTML = order.map(function (c) {
      var items = groups[c], parts = c.split(" · ");
      var subs = items.slice(1); // la prima sezione è il divisore di capitolo: già rappresentato dal titolo
      return '<div class="toc__chap">' + (parts.length > 1 ? '<span class="n">' + parts[0] + '</span>' : '') +
        '<a class="h" href="#' + items[0].id + '">' + (parts[1] || items[0].nav) + "</a>" +
        (subs.length ? "<ul>" + subs.map(function (it) { return '<li><a href="#' + it.id + '">' + it.nav + "</a></li>"; }).join("") + "</ul>" : "") +
        "</div>";
    }).join("");

    var toc = document.getElementById("toc");
    function closeToc() { toc.classList.remove("open"); document.body.style.overflow = ""; }
    function openToc() { toc.classList.add("open"); document.body.style.overflow = "hidden"; }
    document.getElementById("menuBtn").addEventListener("click", openToc);
    document.getElementById("tocClose").addEventListener("click", closeToc);
    toc.addEventListener("click", function (e) {
      var a = e.target.closest("a"), href = a && a.getAttribute("href");
      if (href && href.charAt(0) === "#") {
        e.preventDefault();
        var el = document.getElementById(href.slice(1));
        closeToc();
        if (el) requestAnimationFrame(function () { el.scrollIntoView({ behavior: "smooth", block: "start" }); });
      } else if (e.target === toc) { closeToc(); } // click sullo sfondo
    });

    // scroll-spy (capitolo attivo) + tema topbar/dots
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var chap = e.target.getAttribute("data-chap");
        document.querySelectorAll(".navdots a").forEach(function (a) {
          var s = document.getElementById(a.dataset.for);
          a.classList.toggle("active", s && s.getAttribute("data-chap") === chap);
        });
        var dark = e.target.hasAttribute("data-dark");
        document.body.classList.toggle("on-dark", dark);
        document.getElementById("logo").src = "ds-kit/components/logo-white.svg";
      });
    }, { threshold: .5 });
    sections.forEach(function (s) { spy.observe(s); });

    // progress bar
    var prog = document.getElementById("progress");
    function onScroll() {
      var h = document.documentElement, max = h.scrollHeight - h.clientHeight;
      prog.style.width = (max > 0 ? (h.scrollTop / max * 100) : 0) + "%";
    }
    document.addEventListener("scroll", onScroll, { passive: true }); onScroll();

    // tastiera
    document.addEventListener("keydown", function (e) {
      if (toc.classList.contains("open")) { if (e.key === "Escape") closeToc(); return; }
      if (["ArrowDown", "ArrowRight", "PageDown"].indexOf(e.key) >= 0) { e.preventDefault(); goRel(sections, 1); }
      else if (["ArrowUp", "ArrowLeft", "PageUp"].indexOf(e.key) >= 0) { e.preventDefault(); goRel(sections, -1); }
      else if (e.key === "Home") { e.preventDefault(); sections[0].scrollIntoView({ behavior: "smooth" }); }
      else if (e.key === "End") { e.preventDefault(); sections[sections.length - 1].scrollIntoView({ behavior: "smooth" }); }
    });
  }
  function goRel(sections, dir) {
    var y = window.scrollY + 4, cur = 0;
    for (var i = 0; i < sections.length; i++) { if (sections[i].offsetTop <= y + 2) cur = i; }
    var next = Math.max(0, Math.min(sections.length - 1, cur + dir));
    sections[next].scrollIntoView({ behavior: "smooth" });
  }

  /* ---------- reveal ---------- */
  function buildReveal() {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: .08 });
    document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
  }

  /* ---------- starfield ---------- */
  function starfield() {
    document.querySelectorAll(".starfield canvas").forEach(function (cv) {
      var host = cv.parentElement, ctx = cv.getContext("2d");
      function size() { cv.width = host.offsetWidth; cv.height = host.offsetHeight; draw(); }
      var stars = [];
      function seed() {
        stars = []; var n = Math.round((cv.width * cv.height) / 9000);
        for (var i = 0; i < n; i++) stars.push({ x: Math.random() * cv.width, y: Math.random() * cv.height, r: Math.random() * 1.3 + .2, a: Math.random() * .6 + .2 });
      }
      function draw() {
        if (!cv.width) return; seed(); ctx.clearRect(0, 0, cv.width, cv.height);
        stars.forEach(function (s) { ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.28); ctx.fillStyle = "rgba(255,255,255," + s.a + ")"; ctx.fill(); });
      }
      size();
      window.addEventListener("resize", debounce(size, 200));
    });
  }
  function debounce(fn, ms) { var t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }

  /* ---------- init ---------- */
  function init() {
    document.querySelectorAll("[data-oe-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
    buildKPIs();
    buildComposition();
    buildContribution();
    buildROI();
    buildBcfTraj();
    buildMatchups();
    buildHalo();
    buildTables();
    // serie storiche fisse
    tsChart("chSpainBI", "spainBI", BLUETTE[700], "light");
    tsChart("chPortugalBI", "portugalBI", BLUETTE[700], "light");
    tsChart("chStock", "eniStock", LIME[400], "dark");
    // tabs
    tsChart("chBI", "biPlenitude", BRAND.plenitude, "light");
    wireTabs("tabsBI", function (k) { tsChart("chBI", k, BRAND[{ biPlenitude: "plenitude", biEni: "eni", biEnilive: "enilive" }[k]], "light"); });
    tsChart("chRep", "repEni", BLUETTE[700], "light");
    wireTabs("tabsRep", function (k) { tsChart("chRep", k, BRAND[{ repEni: "eni", repPlenitude: "plenitude", repEnilive: "enilive" }[k]], "light"); });
    wireTabs("tabsProxy", function (k) { renderProxy(k); });
    buildReveal();
    buildNav();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
