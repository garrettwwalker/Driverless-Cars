/* app.js — all interactivity. Reads figures from window.DATA (data.js). */
(function () {
  "use strict";
  var DATA = window.DATA;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var SECONDS_PER_YEAR = 365.25 * 24 * 3600;
  var SQFT_PER_SQMI = 27878400;
  var NOW = new Date();
  var CUR_YEAR = NOW.getFullYear();
  var PAGE_OPEN = Date.now();

  /* ---------- formatting ---------- */
  function fmtInt(n) { return Math.round(n).toLocaleString("en-US"); }
  function fmtUSD(n) {
    if (n >= 1e9) return "$" + (n / 1e9).toFixed(n >= 1e10 ? 0 : 1) + " billion";
    if (n >= 1e6) return "$" + (n / 1e6).toFixed(1) + " million";
    return "$" + fmtInt(n);
  }
  function fmtCompact(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(n >= 1e10 ? 0 : 2).replace(/\.?0+$/, "") + " billion";
    if (n >= 1e6) return (n / 1e6).toFixed(0) + " million";
    return fmtInt(n);
  }

  /* ---------- model ---------- */
  var deathsByYear = {};
  DATA.usTrafficDeaths.series.forEach(function (d) { deathsByYear[d.year] = d.deaths; });
  var series = DATA.usTrafficDeaths.series;
  var currentAnnualRate = series[series.length - 1].deaths; // latest estimate as running rate

  function yearFraction(date) {
    var s = new Date(date.getFullYear(), 0, 1);
    var e = new Date(date.getFullYear() + 1, 0, 1);
    return (date - s) / (e - s);
  }

  function autonomousShare(year, startYear, yearsTo50) {
    if (year <= startYear) return 0;
    var slope = 0.5 / yearsTo50;
    return Math.min(DATA.model.shareCap, slope * (year - startYear));
  }

  var params = {
    startYear: DATA.model.startYearDefault,
    yearsTo50: DATA.model.yearsTo50Default,
    reduction: DATA.model.reductionDefault,
  };

  function modelRows(p) {
    var rows = [];
    var cumulative = 0;
    for (var y = p.startYear; y <= CUR_YEAR; y++) {
      var partial = 1;
      var deaths;
      if (y === CUR_YEAR) { deaths = currentAnnualRate; partial = yearFraction(NOW); }
      else { deaths = deathsByYear[y] != null ? deathsByYear[y] : currentAnnualRate; }
      var share = autonomousShare(y, p.startYear, p.yearsTo50);
      var preventable = deaths * partial * share * p.reduction;
      cumulative += preventable;
      rows.push({ year: y, deaths: deaths, partial: partial, share: share, preventable: preventable, cumulative: cumulative });
    }
    return rows;
  }

  function cumulativeNow(p) {
    var rows = modelRows(p);
    return rows.length ? rows[rows.length - 1].cumulative : 0;
  }
  function perSecondPreventable(p) {
    var shareNow = autonomousShare(CUR_YEAR, p.startYear, p.yearsTo50);
    return (currentAnnualRate / SECONDS_PER_YEAR) * shareNow * p.reduction;
  }
  // Medical bills attributable to the preventable slice of crashes, per second.
  function medicalPerSecondPreventable(p) {
    var shareNow = autonomousShare(CUR_YEAR, p.startYear, p.yearsTo50);
    return (DATA.crashMedicalCost.annualUSD / SECONDS_PER_YEAR) * shareNow * p.reduction;
  }

  /* ---------- live counters ---------- */
  var bigCounter = $("#big-counter");
  var counterRate = $("#counter-rate");
  var miniPage = $("#mini-page");
  var miniMedical = $("#mini-medical");
  var miniPerDay = $("#mini-perday");

  var liveEpoch = performance.now();
  var liveBase = cumulativeNow(params);
  var livePerSec = perSecondPreventable(params);
  var liveMedicalPerSec = medicalPerSecondPreventable(params);
  var introStart = performance.now();
  var introDone = false;

  function recomputeLive() {
    liveBase = cumulativeNow(params);
    livePerSec = perSecondPreventable(params);
    liveMedicalPerSec = medicalPerSecondPreventable(params);
    liveEpoch = performance.now();
    counterRate.textContent = "+" + (livePerSec * 3600).toFixed(1) + "/hr";
    miniPerDay.textContent = fmtInt(livePerSec * 86400);
  }

  function frame(t) {
    var live = liveBase + livePerSec * ((performance.now() - liveEpoch) / 1000);
    var shown = live;
    if (!introDone) {
      var p = Math.min(1, (t - introStart) / 1300);
      shown = live * (1 - Math.pow(1 - p, 3));
      if (p >= 1) introDone = true;
    }
    bigCounter.textContent = fmtInt(shown);

    var openSecs = (Date.now() - PAGE_OPEN) / 1000;
    var dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0); // local midnight, in the viewer's own time zone
    var secsToday = (Date.now() - dayStart.getTime()) / 1000;
    miniPage.textContent = secsToday * livePerSec < 1
      ? (secsToday * livePerSec).toFixed(2)
      : fmtInt(secsToday * livePerSec);
    miniMedical.textContent = "$" + fmtInt(openSecs * liveMedicalPerSec);

    requestAnimationFrame(frame);
  }

  /* ---------- SVG bar chart ---------- */
  function barChart(el, data, opts) {
    opts = opts || {};
    var W = 720, H = 254, padT = 22, padB = 30, padX = 6;
    var max = Math.max.apply(null, data.map(function (d) { return d.actual; })) * 1.05;
    var n = data.length;
    var slot = (W - padX * 2) / n;
    var bw = Math.min(slot * 0.62, 46);
    var chartH = H - padT - padB;
    var svg = ['<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet" role="img">'];
    data.forEach(function (d, i) {
      var x = padX + slot * i + (slot - bw) / 2;
      var ah = (d.actual / max) * chartH;
      var ph = (d.prevent / max) * chartH;
      var ay = padT + chartH - ah;
      var py = padT + chartH - ph;
      svg.push('<rect class="bar-actual" x="' + x.toFixed(1) + '" y="' + ay.toFixed(1) +
        '" width="' + bw.toFixed(1) + '" height="' + Math.max(0, ah).toFixed(1) + '" rx="2">' +
        '<title>' + d.label + ": " + fmtInt(d.actual) + (opts.unit || "") + '</title></rect>');
      if (ph > 0.5) {
        svg.push('<rect class="bar-prevent" x="' + x.toFixed(1) + '" y="' + py.toFixed(1) +
          '" width="' + bw.toFixed(1) + '" height="' + ph.toFixed(1) + '" rx="2">' +
          '<title>' + d.label + ": " + fmtInt(d.prevent) + " preventable</title></rect>");
      }
      svg.push('<text class="bar-label" x="' + (x + bw / 2).toFixed(1) + '" y="' + (H - 12) +
        '" text-anchor="middle">' + d.label + '</text>');
      if (opts.showValues) {
        svg.push('<text class="bar-value" x="' + (x + bw / 2).toFixed(1) + '" y="' + (ay - 5).toFixed(1) +
          '" text-anchor="middle">' + (opts.valueFmt ? opts.valueFmt(d.actual) : fmtInt(d.actual)) + '</text>');
      }
    });
    svg.push("</svg>");
    el.innerHTML = svg.join("");
  }

  /* ---------- SVG pictogram (isotype) chart ---------- */
  var GLYPH = {
    person:
      // Original body; head shifted to x=12.8 so it sits over the body's center (~12.85).
      "M12.8 2.4a2.6 2.6 0 1 1 0 5.2 2.6 2.6 0 0 1 0-5.2z" +
      "M8.7 8.9h6.6c1 0 1.8.7 2 1.7l1 5.1c.1.7-.4 1.3-1.1 1.3-.5 0-1-.4-1.1-.9L16 13v9.1c0 .6-.5 " +
      "1.1-1.1 1.1s-1.1-.5-1.1-1.1V17h-1.6v5.1c0 .6-.5 1.1-1.1 1.1s-1.1-.5-1.1-1.1V13l-.4 3.2c-.1.5-.6.9" +
      "-1.1.9-.7 0-1.2-.6-1.1-1.3l1-5.1c.2-1 1-1.7 2-1.7z",
    car:
      "M4.4 12.2l1.5-3.8C6.3 7.3 7.3 6.6 8.5 6.6h7c1.2 0 2.2.7 2.6 1.8l1.5 3.8c.8.3 1.4 1.1 1.4 2v3.4c0 .5-.4.9-.9.9" +
      "h-1.3a2 2 0 0 1-4 0H8.7a2 2 0 0 1-4 0H3.4c-.5 0-.9-.4-.9-.9v-3.4c0-.9.6-1.7 1.4-2zm2-.3h11.2l-1-2.6c-.2-.5-.6-.8" +
      "-1.1-.8h-7c-.5 0-.9.3-1.1.8l-1 2.6z",
  };

  // opts: { value, highlight?, perIcon, cols?, glyph?, baseClass?, hiClass? }
  function pictoChart(el, opts) {
    var per = opts.perIcon;
    var cols = opts.cols || 30;
    var total = Math.max(1, Math.round(opts.value / per));
    var hi = opts.highlight != null ? Math.max(0, Math.min(total, Math.round(opts.highlight / per))) : 0;
    var glyph = opts.glyph || "person";
    var baseClass = opts.baseClass || "pg-base";
    var hiClass = opts.hiClass || "pg-hi";
    var cell = 24, gap = 4, step = cell + gap;
    var rows = Math.ceil(total / cols);
    var W = Math.min(total, cols) * step - gap;
    var H = rows * step - gap;
    var uid = "pg" + (pictoChart._n = (pictoChart._n || 0) + 1);
    var label = opts.label ? ' aria-label="' + opts.label + '"' : "";
    var out = ['<svg viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="xMinYMin meet" class="picto" role="img"' + label + ">"];
    out.push('<defs><path id="' + uid + '" d="' + GLYPH[glyph] + '"/></defs>');
    for (var i = 0; i < total; i++) {
      var x = (i % cols) * step;
      var y = Math.floor(i / cols) * step;
      out.push('<use href="#' + uid + '" x="' + x + '" y="' + y + '" class="pg ' +
        (i < hi ? hiClass : baseClass) + '"/>');
    }
    out.push("</svg>");
    el.innerHTML = out.join("");
  }

  var PICTO_PER_PERSON = 250;
  function renderTollPicto() {
    var last = series[series.length - 1];
    var share = autonomousShare(last.year, params.startYear, params.yearsTo50);
    var prevent = last.deaths * share * params.reduction;
    pictoChart($("#picto-toll"), {
      value: last.deaths,
      highlight: prevent,
      perIcon: PICTO_PER_PERSON,
      cols: 30,
      label: fmtInt(last.deaths) + " U.S. road deaths in " + last.year + ", of which about " +
        fmtInt(prevent) + " are preventable under the current assumptions",
    });
    $("#picto-year").textContent = last.year + (last.estimate ? " (est.)" : "");
    $("#picto-per").textContent = PICTO_PER_PERSON;
    $("#picto-total").textContent = fmtInt(last.deaths);
    $("#picto-prevent").textContent = fmtInt(prevent);
  }

  function renderDeathsChart() {
    var startShown = 2019;
    var data = [];
    for (var y = startShown; y <= CUR_YEAR; y++) {
      var deaths = y === CUR_YEAR ? currentAnnualRate : (deathsByYear[y] != null ? deathsByYear[y] : currentAnnualRate);
      var share = autonomousShare(y, params.startYear, params.yearsTo50);
      data.push({ label: String(y), actual: deaths, prevent: deaths * share * params.reduction });
    }
    barChart($("#chart-deaths"), data);
  }

  function renderBreakdown() {
    var rows = modelRows(params);
    var html = ['<table><thead><tr><th>Year</th><th>Road deaths</th><th>Auto. share</th><th>× reduction</th><th>Preventable</th><th>Cumulative</th></tr></thead><tbody>'];
    rows.forEach(function (r) {
      html.push("<tr><td>" + r.year + (r.partial < 1 ? " (partial)" : "") + "</td><td>" +
        fmtInt(r.deaths * r.partial) + "</td><td>" + (r.share * 100).toFixed(0) + "%</td><td>" +
        (params.reduction * 100).toFixed(0) + "%</td><td>" + fmtInt(r.preventable) + "</td><td>" +
        fmtInt(r.cumulative) + "</td></tr>");
    });
    html.push("<tr><td>Total</td><td></td><td></td><td></td><td></td><td>" +
      fmtInt(rows.length ? rows[rows.length - 1].cumulative : 0) + "</td></tr>");
    html.push("</tbody></table>");
    $("#breakdown-table").innerHTML = html.join("");
  }

  /* ---------- toll controls ---------- */
  function bindToll() {
    var cs = $("#c-start"), cr = $("#c-ramp"), cd = $("#c-red");
    cs.min = DATA.model.startYearMin; cs.max = DATA.model.startYearMax; cs.value = params.startYear;
    cr.min = DATA.model.yearsTo50Min; cr.max = DATA.model.yearsTo50Max; cr.value = params.yearsTo50;
    cd.min = DATA.model.reductionMin * 100; cd.max = DATA.model.reductionMax * 100; cd.value = params.reduction * 100;

    function sync() {
      params.startYear = +cs.value;
      params.yearsTo50 = +cr.value;
      params.reduction = +cd.value / 100;
      $("#o-start").textContent = cs.value;
      $("#since-year").textContent = cs.value;
      $("#o-ramp").textContent = cr.value + (cr.value === "1" ? " year" : " years");
      $("#o-red").textContent = cd.value + "%";
      recomputeLive();
      renderTollPicto();
      renderDeathsChart();
      renderBreakdown();
    }
    [cs, cr, cd].forEach(function (el) { el.addEventListener("input", sync); });
    sync();
  }

  /* ---------- time section ---------- */
  function bindTime() {
    var c = DATA.congestion;
    $("#t-hours").textContent = c.usHoursPerDriver;
    $("#t-cost").textContent = "$" + c.usCostPerDriver;
    $("#t-total").textContent = fmtUSD(c.usTotalCost);

    var cy = $("#c-years");
    function sync() {
      var yrs = +cy.value;
      var hrs = yrs * c.usHoursPerDriver;
      $("#o-years").textContent = yrs + (yrs === 1 ? " year" : " years");
      $("#t-years-label").textContent = yrs;
      $("#t-yourhours").textContent = fmtInt(hrs);
      $("#t-yourdays").textContent = fmtInt(hrs / 24);
      $("#t-yourcost").textContent = fmtUSD(yrs * c.usCostPerDriver);
    }
    cy.addEventListener("input", sync);
    sync();

    var cityData = DATA.cities.map(function (ct) {
      return { label: ct.name.replace("Washington, D.C.", "D.C."), actual: ct.congestionHours, prevent: 0 };
    });
    cityData.unshift({ label: "U.S. avg", actual: c.usHoursPerDriver, prevent: 0 });
    barChart($("#chart-time"), cityData, { showValues: true, unit: " hrs" });
  }

  /* ---------- space section ---------- */
  function bindSpace() {
    var pk = DATA.parking;
    $("#s-low").textContent = fmtCompact(pk.spacesLow);
    $("#s-high").textContent = fmtCompact(pk.spacesHigh);
    $("#s-share").textContent = pk.cityLandSharePct + "%";
    $("#s-la").textContent = pk.downtownLAPct + "%";
    $("#s-cruise").textContent = pk.cruisingForParkingPct + "%";

    var grid = $("#grid-viz");
    for (var i = 0; i < 100; i++) grid.appendChild(document.createElement("i"));
    var cells = $$("i", grid);

    var c = $("#c-spaces");
    function lerp(a, b, t) { return a + (b - a) * t; }
    function sync() {
      var t = +c.value / 100;
      var spaces = lerp(pk.spacesLow, pk.spacesHigh, t);
      var perVeh = lerp(pk.spacesPerVehicleLow, pk.spacesPerVehicleHigh, t);
      var sqft = spaces * pk.sqFtPerSpace;
      var sqmi = sqft / SQFT_PER_SQMI;
      var ref = sqmi < 15000 ? pk.refAreas[0] : pk.refAreas[1];

      $("#o-spaces").textContent = perVeh.toFixed(1) + " per vehicle";
      $("#s-area").textContent = fmtInt(sqmi) + " sq mi";
      $("#s-area-mode").textContent = t < 0.15 ? "the low estimate" : t > 0.85 ? "the high estimate" : "your estimate (" + fmtCompact(spaces) + " spaces)";
      $("#s-compare").textContent = (sqmi / ref.sqMi).toFixed(2) + "× " + ref.name;

      var lit = Math.round(perVeh * 10);
      cells.forEach(function (el, idx) { el.classList.toggle("on", idx < lit); });
      $(".grid-cap").textContent = "≈ " + perVeh.toFixed(1) + " parking spaces for every vehicle in the U.S. (each square = 0.1).";
    }
    c.addEventListener("input", sync);
    sync();
  }

  /* ---------- record section ---------- */
  function bindRecord() {
    var w = DATA.waymo;
    $("#w-asof").textContent = w.asOf;
    $("#w-miles").textContent = fmtCompact(w.autonomousMiles);
    $("#w-lifetimes").textContent = w.lifetimesEquivalent;
    $("#w-week").textContent = fmtCompact(w.milesPerWeek);
    $("#w-every").textContent = "every " + w.seriousCrashPreventedEveryDays + " days";

    $("#w-stats").innerHTML = w.stats.map(function (s) {
      return '<div class="big-stat"><b>' + Math.round(s.value * 100) + "%</b><span>" + s.label + "</span></div>";
    }).join("");

    var srcs = [
      { t: w.thirdParty.text, s: w.thirdParty.source, u: w.thirdParty.sourceUrl },
      { t: w.peerReviewed.text, s: w.peerReviewed.source, u: w.peerReviewed.sourceUrl },
      { t: "Waymo's own methodology and running totals.", s: w.source, u: w.sourceUrl },
    ];
    $("#w-sources").innerHTML = srcs.map(function (o) {
      return '<div class="sc">' + o.t + ' <a href="' + o.u + '" target="_blank" rel="noopener">' + o.s + "</a></div>";
    }).join("");

    var tp = w.thirdParty;
    var perCrash = 0.2;
    pictoChart($("#picto-human"), {
      value: tp.humanCrashesPerMillionMiles, perIcon: perCrash, cols: 24, glyph: "car", baseClass: "pg-human",
      label: "Human drivers: " + tp.humanCrashesPerMillionMiles.toFixed(2) + " crashes per million miles",
    });
    pictoChart($("#picto-waymo"), {
      value: tp.waymoCrashesPerMillionMiles, perIcon: perCrash, cols: 24, glyph: "car", baseClass: "pg-waymo",
      label: "Waymo: " + tp.waymoCrashesPerMillionMiles.toFixed(2) + " crashes per million miles",
    });
    $("#pc-human").textContent = tp.humanCrashesPerMillionMiles.toFixed(2);
    $("#pc-waymo").textContent = tp.waymoCrashesPerMillionMiles.toFixed(2);
    $("#pc-per").textContent = perCrash.toFixed(1);
  }

  /* ---------- cities section ---------- */
  function bindCities() {
    var tabsEl = $("#city-tabs");
    var bodyEl = $("#city-body");
    DATA.cities.forEach(function (ct, i) {
      var b = document.createElement("button");
      b.className = "city-tab" + (i === 0 ? " is-active" : "");
      b.textContent = ct.name;
      b.addEventListener("click", function () {
        $$(".city-tab", tabsEl).forEach(function (x) { x.classList.remove("is-active"); });
        b.classList.add("is-active");
        renderCity(ct);
      });
      tabsEl.appendChild(b);
    });

    function renderCity(ct) {
      var metrics = '<div><b>' + ct.congestionHours + " hrs</b>lost to congestion / driver / yr</div>";
      if (ct.congestionCostPerDriver) metrics += '<div><b>$' + fmtInt(ct.congestionCostPerDriver) + "</b>cost of that time / driver</div>";
      if (ct.congestionCityCost) metrics += '<div><b>' + fmtUSD(ct.congestionCityCost) + "</b>citywide, per year</div>";
      if (ct.casualties) {
        var cz = ct.casualties;
        metrics += '<div><b>' + fmtInt(cz.deaths.count) + "</b>traffic deaths (" + cz.deaths.year + ")</div>";
        metrics += '<div><b>' + fmtInt(cz.injuries.count) + "</b>" + cz.injuries.label + " (" + cz.injuries.year + ")</div>";
      }

      var srcs = '<a href="' + ct.statusSourceUrl + '" target="_blank" rel="noopener">Status ↗</a>';
      if (ct.casualties) {
        srcs += ' · <a href="' + ct.casualties.deaths.sourceUrl + '" target="_blank" rel="noopener">Deaths ↗</a>';
        if (ct.casualties.injuries.sourceUrl !== ct.casualties.deaths.sourceUrl) {
          srcs += ' · <a href="' + ct.casualties.injuries.sourceUrl + '" target="_blank" rel="noopener">Injuries ↗</a>';
        }
      }

      var html = '<div class="city-status"><h3>' + ct.name + " — status</h3>" +
        '<div class="city-metrics">' + metrics + "</div>" +
        "<p>" + ct.status + "</p>" +
        '<p class="src">' + srcs + "</p></div>";

      ct.quotes.forEach(function (q) {
        html += '<div class="quote"><blockquote>' + q.text + "</blockquote>" +
          '<div class="attr"><b>' + q.who + "</b> — " + q.role +
          (q.paraphrase ? '<span class="tag">paraphrase</span>' : "") + "</div>" +
          '<div class="ctx">' + q.when + " · " + q.context +
          ' <a href="' + q.url + '" target="_blank" rel="noopener">reporting ↗</a></div></div>';
      });
      bodyEl.innerHTML = html;
    }
    renderCity(DATA.cities[0]);
  }

  /* ---------- method section ---------- */
  function bindMethod() {
    $("#method-caveats").innerHTML = DATA.model.caveats.map(function (c) { return "<li>" + c + "</li>"; }).join("");

    var all = [];
    function add(b, s, u) { all.push({ b: b, s: s, u: u }); }
    add("Road deaths", DATA.usTrafficDeaths.source, DATA.usTrafficDeaths.sourceUrl);
    add("Share of crashes with driver as critical reason", DATA.humanError.source, DATA.humanError.sourceUrl);
    add("Medical cost of crash injuries", DATA.crashMedicalCost.source, DATA.crashMedicalCost.sourceUrl);
    add("Waymo safety record", DATA.waymo.source, DATA.waymo.sourceUrl);
    add("Independent check (IIHS)", DATA.waymo.thirdParty.source, DATA.waymo.thirdParty.sourceUrl);
    add("Peer-reviewed comparison", DATA.waymo.peerReviewed.source, DATA.waymo.peerReviewed.sourceUrl);
    add("Congestion / time lost", DATA.congestion.source, DATA.congestion.sourceUrl);
    add("Parking supply and land use", DATA.parking.source, DATA.parking.sourceUrl);
    DATA.cities.forEach(function (ct) {
      add(ct.name + " — deployment status", "City / reporting", ct.statusSourceUrl);
      if (ct.casualties) {
        add(ct.name + " — traffic deaths", ct.casualties.deaths.source, ct.casualties.deaths.sourceUrl);
        add(ct.name + " — traffic injuries", ct.casualties.injuries.source, ct.casualties.injuries.sourceUrl);
      }
    });
    $("#source-list").innerHTML = all.map(function (o) {
      return '<div class="sl"><b>' + o.b + "</b>" + o.s + ' — <a href="' + o.u + '" target="_blank" rel="noopener">' + o.u + "</a></div>";
    }).join("");
  }

  /* ---------- tab navigation ---------- */
  function bindTabs() {
    var tabs = $$(".tab");
    var panels = {};
    $$(".panel").forEach(function (p) { panels[p.id.replace("panel-", "")] = p; });

    function activate(name) {
      if (!panels[name]) return;
      tabs.forEach(function (t) { t.classList.toggle("is-active", t.dataset.tab === name); });
      Object.keys(panels).forEach(function (k) { panels[k].classList.toggle("is-active", k === name); });
      if (history.replaceState) history.replaceState(null, "", "#" + name);
      window.scrollTo({ top: 0, behavior: "auto" });
    }
    tabs.forEach(function (t) { t.addEventListener("click", function () { activate(t.dataset.tab); }); });
    $$("[data-jump]").forEach(function (a) {
      a.addEventListener("click", function (e) { e.preventDefault(); activate(a.dataset.jump); });
    });
    var initial = (location.hash || "").replace("#", "");
    if (initial && panels[initial]) activate(initial);
  }

  /* ---------- init ---------- */
  $("#foot-date").textContent = DATA.meta.lastReviewed;
  bindTabs();
  bindToll();
  bindTime();
  bindSpace();
  bindRecord();
  bindCities();
  bindMethod();
  recomputeLive();
  requestAnimationFrame(frame);
})();
