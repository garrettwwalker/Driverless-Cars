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
  var perSecondTotal = currentAnnualRate / SECONDS_PER_YEAR;

  /* ---------- live counters ---------- */
  var bigCounter = $("#big-counter");
  var counterRate = $("#counter-rate");
  var miniPage = $("#mini-page");
  var miniTotalPage = $("#mini-total-page");
  var miniPerDay = $("#mini-perday");

  var liveEpoch = performance.now();
  var liveBase = cumulativeNow(params);
  var livePerSec = perSecondPreventable(params);
  var introStart = performance.now();
  var introDone = false;

  function recomputeLive() {
    liveBase = cumulativeNow(params);
    livePerSec = perSecondPreventable(params);
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
    miniPage.textContent = openSecs * livePerSec < 1
      ? (openSecs * livePerSec).toFixed(2)
      : fmtInt(openSecs * livePerSec);
    miniTotalPage.textContent = fmtInt(openSecs * perSecondTotal);

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

      var html = '<div class="city-status"><h3>' + ct.name + " — status</h3>" +
        '<div class="city-metrics">' + metrics + "</div>" +
        "<p>" + ct.status + "</p>" +
        '<p class="src"><a href="' + ct.statusSourceUrl + '" target="_blank" rel="noopener">Source ↗</a></p></div>';

      ct.quotes.forEach(function (q) {
        html += '<div class="quote"><blockquote>' + q.text + "</blockquote>" +
          '<div class="attr"><b>' + q.who + "</b> — " + q.role +
          (q.paraphrase ? '<span class="tag">paraphrase</span>' : "") + "</div>" +
          '<div class="ctx">' + q.when + " · " + q.context +
          ' <a href="' + q.url + '" target="_blank" rel="noopener">reporting ↗</a></div></div>";
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
    add("Waymo safety record", DATA.waymo.source, DATA.waymo.sourceUrl);
    add("Independent check (IIHS)", DATA.waymo.thirdParty.source, DATA.waymo.thirdParty.sourceUrl);
    add("Peer-reviewed comparison", DATA.waymo.peerReviewed.source, DATA.waymo.peerReviewed.sourceUrl);
    add("Congestion / time lost", DATA.congestion.source, DATA.congestion.sourceUrl);
    add("Parking supply and land use", DATA.parking.source, DATA.parking.sourceUrl);
    DATA.cities.forEach(function (ct) {
      add(ct.name + " — deployment status", "City / reporting", ct.statusSourceUrl);
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
