/* =====================================================================
   AL-ELAHI TRAVELS — main.js
   Handles: sticky header, mobile drawer, scroll reveal, counters,
   hero slider, tabs, booking modal + WhatsApp submit, gallery lightbox
   ===================================================================== */
(function () {
  "use strict";

  /* ---------------- CONFIG ---------------- */
  var CONFIG = {
    whatsapp: "966536321755",      // +966 53 632 1755  (primary)
    whatsappAlt: "966551457823",   // +966 55 145 7823  (secondary)
    phonePrimary: "+966 53 632 1755",
    phoneAlt: "+966 55 145 7823",
    business: "Al-Elahi Travels",
    location: "Shamsia Building, Batha, Old Saptco Bus Station, Riyadh, Saudi Arabia"
  };
  window.ALELAHI = CONFIG;

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------------- 0. LAZY PHOTO SCANS ----------------
     The bus and hotel folders are read with probe requests (1.jpg, 2.jpg …),
     which is 150+ image downloads. Nothing is scanned until the matching section
     comes close to the viewport, so the first paint stays light. */
  function whenNear(el, cb, margin) {
    if (!el || !("IntersectionObserver" in window)) { cb(); return; }
    var obs = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) { obs.disconnect(); cb(); return; }
      }
    }, { rootMargin: (margin || 600) + "px 0px" });
    obs.observe(el);
  }

  /* Does a photo folder hold 1.jpg, 2.jpg, 3.jpg …? (stops at the first gap)
     Over http(s) this only sends HEAD requests, so learning that a hotel holds
     12 photos costs twelve tiny header checks instead of twelve full downloads.
     On file:// (the local preview) HEAD is not allowed, so the image itself is
     loaded — the browser cache then serves it again when it is displayed. */
  var CAN_HEAD = location.protocol !== "file:";
  function scanFolder(base, max, done) {
    var found = [];
    var n = 1;
    (function next() {
      if (n > max) return done(found);
      var pic = { n: n, src: base + n + ".jpg" };
      if (CAN_HEAD) {
        fetch(pic.src, { method: "HEAD", priority: "low" }).then(function (res) {
          if (!res.ok) return done(found);
          found.push(pic); n++; next();
        })["catch"](function () { done(found); });
      } else {
        var im = new Image();
        im.onload = function () { found.push(pic); n++; next(); };
        im.onerror = function () { done(found); };
        im.src = pic.src;
      }
    })();
  }

  /* Does a video folder hold 1.mp4, 2.mp4, 3.mp4 …? Same probe idea as the
     photos, so a new clip only has to be dropped in under the next number.
     Headless request → the file itself is never downloaded here. */
  function scanVideos(base, max, done) {
    var found = [];
    var n = 1;
    (function next() {
      if (n > max) return done(found);
      var clip = { n: n, src: base + n + ".mp4" };
      function yes() { found.push(clip); n++; next(); }
      function no() { done(found); }
      if (CAN_HEAD) {
        fetch(clip.src, { method: "HEAD", priority: "low" }).then(function (res) {
          if (res.ok) yes(); else no();
        })["catch"](no);
      } else {
        /* file:// preview: ask the browser to read just the clip's header */
        var probe = document.createElement("video");
        probe.preload = "metadata";
        probe.muted = true;
        probe.onloadedmetadata = yes;
        probe.onerror = no;
        probe.setAttribute("src", clip.src);
      }
    })();
  }

  /* Scan a list of folders with a small concurrency: quick to finish, yet the
     browser's connections stay mostly free for the photos that are on screen. */
  function scanFolders(tasks, limit, done) {
    var i = 0, live = 0, finished = 0;
    function pump() {
      while (live < limit && i < tasks.length) {
        live++;
        tasks[i++](function () {
          live--; finished++;
          if (finished === tasks.length) { if (done) done(); return; }
          pump();
        });
      }
    }
    if (!tasks.length) { if (done) done(); return; }
    pump();
  }

  /* Carousels only move while they are on screen (and the tab is visible), so a
     slider the visitor has scrolled past stops using battery / bandwidth. */
  function onScreenWatcher(el, set) {
    if (!el || !("IntersectionObserver" in window)) { set(true); return; }
    set(false);
    new IntersectionObserver(function (entries) {
      set(!!entries[0].isIntersecting);
    }, { threshold: 0.12 }).observe(el);
  }

  /* ---------------- 1. STICKY HEADER ---------------- */
  var header = $(".site-header");
  function onScrollHeader() {
    if (!header) return;
    header.classList.toggle("is-stuck", window.scrollY > 40);
  }
  onScrollHeader();
  window.addEventListener("scroll", onScrollHeader, { passive: true });

  /* ---------------- 2. MOBILE DRAWER NAV ---------------- */
  var nav = $(".main-nav");
  var toggle = $(".nav-toggle");
  var backdrop = $(".nav-backdrop");

  function closeNav() {
    if (!nav || !toggle) return;
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    if (backdrop) backdrop.classList.remove("is-open");
  }
  function openNav() {
    if (!nav || !toggle) return;
    nav.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    if (backdrop) backdrop.classList.add("is-open");
  }
  if (toggle) {
    toggle.addEventListener("click", function () {
      if (nav.classList.contains("is-open")) closeNav(); else openNav();
    });
  }
  if (backdrop) backdrop.addEventListener("click", closeNav);
  $$("[data-nav-close]").forEach(function (el) { el.addEventListener("click", closeNav); });
  $$(".main-nav ul a").forEach(function (a) { a.addEventListener("click", closeNav); });
  window.addEventListener("keydown", function (e) { if (e.key === "Escape") closeNav(); });
  window.addEventListener("resize", function () { if (window.innerWidth > 1080) closeNav(); });

  /* ---------------- 3. SCROLL REVEAL ---------------- */
  var revealEls = $$("[data-reveal]");
  if ("IntersectionObserver" in window && revealEls.length) {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var el = en.target;
          var delay = parseInt(el.getAttribute("data-reveal-delay") || "0", 10);
          setTimeout(function () { el.classList.add("is-in"); }, delay);
          revealObs.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });
    revealEls.forEach(function (el) { revealObs.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------------- 4. ANIMATED COUNTERS ---------------- */
  var counters = $$("[data-count]");
  function runCounter(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    var prefix = el.getAttribute("data-prefix") || "";
    var decimals = (target % 1 !== 0) ? 1 : 0;
    var dur = 1600;
    var start = null;
    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = target * eased;
      el.textContent = prefix + val.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  if (counters.length && "IntersectionObserver" in window) {
    var cObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { runCounter(en.target); cObs.unobserve(en.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (c) { cObs.observe(c); });
  }

  /* ---------------- 5. HERO SLIDER ---------------- */
  var slides = $$(".hero-slide");

  /* The hero photos are heavy, so the page only fetches the first one: the second
     follows right after and the rest when the browser is idle.
     (≤760px the portrait crops marked data-src-m are used.) */
  function heroImageURL(im) {
    var mobile = window.matchMedia && window.matchMedia("(max-width: 760px)").matches;
    return (mobile && im.getAttribute("data-src-m")) || im.getAttribute("data-src");
  }
  function heroLoad(i) {
    var im = slides[i] ? $("img", slides[i]) : null;
    if (im && !im.getAttribute("src") && im.getAttribute("data-src")) {
      im.setAttribute("src", heroImageURL(im));
    }
  }
  function heroLoadRest(from) {
    for (var i = from; i < slides.length; i++) heroLoad(i);
  }
  if (slides.length) {
    heroLoad(0);
    setTimeout(function () { heroLoad(1); }, 900);
    if ("requestIdleCallback" in window) {
      requestIdleCallback(function () { heroLoadRest(2); }, { timeout: 3000 });
    } else {
      setTimeout(function () { heroLoadRest(2); }, 2500);
    }
  }

  if (slides.length > 1) {
    var sIdx = 0;
    slides[0].classList.add("is-active");
    setInterval(function () {
      slides[sIdx].classList.remove("is-active");
      sIdx = (sIdx + 1) % slides.length;
      slides[sIdx].classList.add("is-active");
    }, 6500);
  } else if (slides.length === 1) {
    slides[0].classList.add("is-active");
  }

  /* ---------------- 6. TABS (packages / gallery) ---------------- */
  $$("[data-tabs]").forEach(function (group) {
    var tabs = $$(".tab", group);
    var targetSel = group.getAttribute("data-tabs");
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var key = tab.getAttribute("data-tab");
        tabs.forEach(function (t) {
          var on = t === tab;
          t.classList.toggle("is-active", on);
          t.setAttribute("aria-selected", on ? "true" : "false");
        });
        $$(targetSel).forEach(function (p) {
          p.classList.toggle("is-active", p.getAttribute("data-panel") === key);
        });
      });
    });
  });

  /* ---------------- 6b. HASH-DEEP-LINK TO A TAB ---------------- */
  function activateTabFromHash() {
    var hash = (location.hash || "").replace("#", "");
    if (!hash) return;
    var panel = document.querySelector('.panel[data-panel="' + hash + '"]');
    if (!panel) return;
    var group = panel.closest("[data-tabs]") || panel.parentElement;
    var tab = group ? group.querySelector('.tab[data-tab="' + hash + '"]') : null;
    if (tab) tab.click();
    else {
      $$(".panel").forEach(function (p) {
        p.classList.toggle("is-active", p.getAttribute("data-panel") === hash);
      });
    }
    setTimeout(function () {
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }
  if (location.hash) {
    window.addEventListener("load", activateTabFromHash);
  }
  window.addEventListener("hashchange", activateTabFromHash);

  /* ---------------- 7. PEOPLE STEPPERS + TOTAL ---------------- */
  $$(".stepper").forEach(function (st) {
    var input = $("input", st);
    var min = parseInt(input.getAttribute("min") || "0", 10);
    var max = parseInt(input.getAttribute("max") || "60", 10);
    $$("button", st).forEach(function (b) {
      b.addEventListener("click", function () {
        var dir = b.getAttribute("data-step") === "up" ? 1 : -1;
        var v = (parseInt(input.value, 10) || 0) + dir;
        v = Math.max(min, Math.min(max, v));
        input.value = v;
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });
    });
    input.addEventListener("input", function () {
      var v = parseInt(input.value, 10);
      if (isNaN(v)) v = min;
      v = Math.max(min, Math.min(max, v));
      input.value = v;
      updateTotal();
    });
  });

  function updateTotal() {
    var out = $("[data-total-people]");
    if (!out) return;
    var m = parseInt(($("#bkMen") || {}).value || "0", 10) || 0;
    var w = parseInt(($("#bkWomen") || {}).value || "0", 10) || 0;
    out.textContent = m + w;
  }
  updateTotal();

  /* ---------------- 8. BOOKING MODAL ---------------- */
  var modal = $("#bookingModal");
  var lastFocus = null;
  var bachelorMode = false;

  /* Bachelors packages are men only — the Women counter is hidden for them */
  var womenBox = (function () {
    var input = $("#bkWomen");
    return input ? input.closest(".people-box") : null;
  })();
  var peopleRow = $(".people-row");

  function syncGuestFields() {
    var womenInput = $("#bkWomen");
    if (womenBox) womenBox.hidden = bachelorMode;
    if (peopleRow) peopleRow.classList.toggle("is-single", bachelorMode);
    if (womenInput) {
      if (bachelorMode) womenInput.value = 0;
      else if (!parseInt(womenInput.value, 10)) womenInput.value = 1;
    }
    updateTotal();
  }

  function openModal(pkgName, pkgMeta) {
    if (!modal) return;
    lastFocus = document.activeElement;

    var pkgField = $("#bkPackage");
    if (pkgField) {
      pkgField.value = pkgName || "Custom / General Inquiry";
    }

    // Pre-select choices based on the package card's data attributes
    vipAllowed = !!(pkgMeta && pkgMeta.bus === "VIP Bus");
    bachelorMode = !!(pkgMeta && pkgMeta.forWho === "bachelors");
    if (pkgMeta) {
      setRadio("bkBus", pkgMeta.bus);
      setRadio("bkHotel", pkgMeta.hotel);
      setRadio("bkDest", pkgMeta.dest);
    }

    var sub = $("#modalPkgHint");
    if (sub) {
      sub.textContent = pkgName
        ? 'Selected package: ' + pkgName
        : "Fill this short form and we will confirm your booking on WhatsApp.";
    }

    destUnlocked = false;
    syncBookingRules();

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    setTimeout(function () {
      var first = $("#bkName");
      if (first) first.focus();
    }, 380);
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }

  function setRadio(groupName, value) {
    if (!value) return;
    var match = document.querySelector('input[name="' + groupName + '"][value="' + value + '"]');
    if (match) match.checked = true;
  }

  /* VIP bus departs only on Monday & Thursday (10:00 AM) —
     show the schedule note and offer those two days as date options */
  var vipNote = $("[data-vip-note]");
  var normalNote = $("[data-normal-note]");
  var vipDateBox = $("[data-vip-dates]");
  var vipDateList = $("[data-vip-dates-list]");
  var dateErr = $("[data-date-error]");
  var dateField = $("#bkDate");
  var DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var MON_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function isVipBus() {
    var picked = document.querySelector('input[name="bkBus"]:checked');
    return !!picked && picked.value === "VIP Bus";
  }

  function isoOf(d) {
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + "-" + (m < 10 ? "0" + m : m) + "-" + (day < 10 ? "0" + day : day);
  }

  /* Monday = 1, Thursday = 4 */
  function isVipDay(value) {
    if (!value) return false;
    var p = String(value).split("-");
    if (p.length !== 3) return false;
    var wd = new Date(+p[0], +p[1] - 1, +p[2]).getDay();
    return wd === 1 || wd === 4;
  }

  function nextVipDates(count) {
    var out = [], d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 1);            // start from tomorrow
    while (out.length < count) {
      if (d.getDay() === 1 || d.getDay() === 4) out.push(new Date(d.getTime()));
      d.setDate(d.getDate() + 1);
    }
    return out;
  }

  function buildVipDateList() {
    if (!vipDateList || vipDateList.getAttribute("data-built")) return;
    var frag = document.createDocumentFragment();
    nextVipDates(6).forEach(function (d) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "date-chip";
      b.setAttribute("data-date", isoOf(d));
      b.innerHTML = "<b>" + DAY_SHORT[d.getDay()] + "</b> " + d.getDate() + " " + MON_SHORT[d.getMonth()];
      frag.appendChild(b);
    });
    vipDateList.appendChild(frag);
    vipDateList.setAttribute("data-built", "1");
  }

  function markVipChip() {
    if (!vipDateList || !dateField) return;
    var cur = dateField.value;
    $$(".date-chip", vipDateList).forEach(function (c) {
      c.classList.toggle("is-active", c.getAttribute("data-date") === cur);
    });
  }

  /* VIP Bus goes to Makkah only, and "Madinah Only" is served by the Normal Bus.
     Both of those services run on Monday & Thursday only. */
  var destBox = $("[data-dest-chips]");
  var destHint = $("[data-vip-dest-note]");
  var madinahHint = $("[data-madinah-dest-note]");
  var dateHint = $("[data-dates-hint]");
  var destInputs = destBox ? $$('input[name="bkDest"]', destBox) : [];
  var destUnlocked = false;
  var vipBusChip = (function () {
    var input = $('input[name="bkBus"][value="VIP Bus"]');
    return input ? input.closest(".chip") : null;
  })();

  function curDest() {
    var picked = document.querySelector('input[name="bkDest"]:checked');
    return picked ? picked.value : "";
  }
  function isMadinahOnly() { return curDest() === "Madinah Only"; }

  /* Monday & Thursday only — for the VIP Bus and for Madinah Only */
  function monThuOnly() { return isVipBus() || isMadinahOnly(); }

  function checkVipDate() {
    if (!dateField) return true;
    var bad = monThuOnly() && !!dateField.value && !isVipDay(dateField.value);
    if (dateErr) dateErr.hidden = !bad;
    dateField.classList.toggle("is-invalid", bad);
    return !bad;
  }

  /* Departure time — the coaches leave ON THE HOUR, so this is an hour-only
     dropdown (no minutes, no seconds): the Normal Bus runs 10:00 AM → 7:00 PM,
     the VIP Bus 10:00 AM → 2:00 PM. The list is rebuilt when the bus changes. */
  var timeField = $("#bkTime");
  var timeHint  = $("[data-time-hint]");

  var TIME_SLOTS_NORMAL = ["10:00", "11:00", "12:00", "13:00", "14:00",
                           "15:00", "16:00", "17:00", "18:00", "19:00"];
  var TIME_SLOTS_VIP    = ["10:00", "11:00", "12:00", "13:00", "14:00"];

  function timeSlots() { return isVipBus() ? TIME_SLOTS_VIP : TIME_SLOTS_NORMAL; }

  function buildTimeOptions() {
    if (!timeField || timeField.tagName !== "SELECT") return;
    var list = timeSlots();
    var keep = timeField.value;
    var html = '<option value="">Select hour</option>';
    list.forEach(function (v) {
      html += '<option value="' + v + '">' + fmt12(v) + '</option>';
    });
    timeField.innerHTML = html;
    timeField.value = list.indexOf(keep) >= 0 ? keep : "";
  }

  /* a value left over from the other bus type is no longer selectable */
  function clampTime() {
    if (!timeField) return;
    if (timeField.value && timeSlots().indexOf(timeField.value) < 0) timeField.value = "";
  }

  function applyTimeWindow() {
    if (!timeField) return;
    if (timeHint) {
      timeHint.innerHTML = isVipBus()
        ? "VIP bus leaves on the hour, between <b>10:00 AM</b> and <b>2:00 PM</b>."
        : "Normal bus leaves on the hour, between <b>10:00 AM</b> and <b>7:00 PM</b>.";
    }
    buildTimeOptions();
  }

  /* VIP packages offer the VIP Bus only, every other package only the Normal Bus
     (and "Madinah Only" is always served by the Normal Bus) */
  var vipAllowed = false;
  var normalBusChip = (function () {
    var input = $('input[name="bkBus"][value="Normal Bus"]');
    return input ? input.closest(".chip") : null;
  })();

  function pickBus(value) {
    var input = $('input[name="bkBus"][value="' + value + '"]');
    if (input && !input.checked) input.checked = true;
  }

  function syncBusOptions() {
    var wantVip = vipAllowed && !isMadinahOnly();
    if (vipBusChip) vipBusChip.hidden = !wantVip;
    if (normalBusChip) normalBusChip.hidden = wantVip;
    pickBus(wantVip ? "VIP Bus" : "Normal Bus");
  }

  /* Destination Preference shows only the picked option (matches the package title):
     "Mecca Only" → Makkah Only, "Madina Only" → Madinah Only,
     "Mecca & Medina" → Makkah + Madinah.
     Tapping the locked button again reveals all three. */
  function applyDestVisibility() {
    var keep = destUnlocked ? "" : curDest();
    destInputs.forEach(function (input) {
      var label = input.closest(".chip");
      var off = !!keep && input.value !== keep;
      if (label) label.hidden = off;
      if (off && input.checked) {
        var fallback = $('input[name="bkDest"][value="' + keep + '"]', destBox);
        if (fallback) fallback.checked = true;
      }
    });
  }

  function syncBookingRules() {
    syncBusOptions();
    syncGuestFields();

    var vip = isVipBus();
    applyDestVisibility();

    var medina = isMadinahOnly();
    var mondayThursday = vip || medina;

    if (vipNote) vipNote.hidden = !vip;
    /* the Normal Bus runs all day, so its timing note shows whenever VIP is off */
    if (normalNote) normalNote.hidden = vip;
    if (destHint) destHint.hidden = !vip;
    if (madinahHint) madinahHint.hidden = !medina;
    if (vipDateBox) vipDateBox.hidden = !mondayThursday;
    if (mondayThursday) buildVipDateList();
    if (dateHint) {
      dateHint.innerHTML = vip
        ? "VIP Bus runs only on <b>Monday</b> &amp; <b>Thursday</b> — pick a date:"
        : "Madinah Only runs only on <b>Monday</b> &amp; <b>Thursday</b> — pick a date:";
    }

    checkVipDate();
    applyTimeWindow();
    markVipChip();
  }

  if (dateField) dateField.min = isoOf(new Date());

  $$('input[name="bkBus"], input[name="bkDest"]').forEach(function (el) {
    el.addEventListener("change", function () {
      if (el.name === "bkDest") destUnlocked = false;
      syncBookingRules();
    });
  });

  /* Tapping the locked choice again brings the other destinations back,
     so nobody gets stuck on Madinah Only / Makkah Only */
  if (destBox) {
    destBox.addEventListener("mousedown", function (e) {
      var label = e.target.closest(".chip");
      var input = label ? label.querySelector('input[name="bkDest"]') : null;
      if (!input || !input.checked || destUnlocked) return;
      destUnlocked = true;
      syncBookingRules();
    });
  }

  if (vipDateList) {
    vipDateList.addEventListener("click", function (e) {
      var chip = e.target.closest(".date-chip");
      if (!chip) return;
      if (dateField) dateField.value = chip.getAttribute("data-date");
      checkVipDate();
      markVipChip();
    });
  }
  if (dateField) {
    dateField.addEventListener("change", function () { checkVipDate(); markVipChip(); });
    dateField.addEventListener("input", function () { checkVipDate(); markVipChip(); });
  }
  syncBookingRules();

  // Hook every "Book Now" trigger
  $$("[data-book]").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      openModal(
        btn.getAttribute("data-book"),
        {
          bus: btn.getAttribute("data-bus"),
          hotel: btn.getAttribute("data-hotel"),
          dest: btn.getAttribute("data-dest"),
          forWho: cardTravellerType(btn)
        }
      );
    });
  });

  /* Reads the "Family" / "Bachelors" chip on the package card */
  function cardTravellerType(btn) {
    var card = btn.closest(".pkg");
    if (!card) return "";
    var found = "";
    $$(".pkg-tag--type", card).forEach(function (chip) {
      var t = chip.textContent.replace(/\s+/g, " ").trim().toLowerCase();
      if (t === "bachelors" || t === "family") found = t;
    });
    return found;
  }

  $$("[data-modal-close]").forEach(function (el) {
    el.addEventListener("click", closeModal);
  });
  if (modal) {
    modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
  }
  window.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal && modal.classList.contains("is-open")) closeModal();
  });

  /* ---------------- 9. FORM → WHATSAPP ---------------- */
  function val(id) {
    var el = document.getElementById(id);
    return el ? String(el.value || "").trim() : "";
  }
  function radioVal(name) {
    var el = document.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : "";
  }
  function fmt12(hhmm) {
    var p = String(hhmm).split(":");
    if (p.length < 2) return hhmm;
    var h = parseInt(p[0], 10), m = p[1];
    var ap = h >= 12 ? "PM" : "AM";
    var h12 = h % 12; if (!h12) h12 = 12;
    return h12 + ":" + m + " " + ap;
  }

  function buildMessage() {
    var men = parseInt(val("bkMen"), 10) || 0;
    var women = parseInt(val("bkWomen"), 10) || 0;

    var L = [];
    L.push("*NEW BOOKING REQUEST*");
    L.push("— " + CONFIG.business + " —");
    L.push("");
    L.push("*Package:* " + (val("bkPackage") || "General Inquiry"));
    L.push("*Full Name:* " + (val("bkName") || "-"));
    L.push("*Travel Date:* " + (val("bkDate") || "-"));
    L.push("*Departure Time:* " + (val("bkTime") ? fmt12(val("bkTime")) : "-"));
    L.push("*Mobile / WhatsApp:* " + (val("bkMobile") || "-"));
    if (val("bkIqama")) L.push("*Iqama / ID:* " + val("bkIqama"));
    L.push("");
    L.push("*Passengers:* " + (men + women) + " total");
    L.push("  · Men: " + men);
    L.push("  · " + (bachelorMode ? "Bachelors (men only)" : "Women: " + women));
    L.push("");
    L.push("*Bus Type:* " + (radioVal("bkBus") || "-"));
    L.push("*Hotel Preference:* " + (radioVal("bkHotel") || "-"));
    L.push("*Destination:* " + (radioVal("bkDest") || "-"));

    if (val("bkMessage")) {
      L.push("");
      L.push("*Additional Notes:* " + val("bkMessage"));
    }
    L.push("");
    L.push("Sent via website booking form.");
    return L.join("\n");
  }

  function showSuccess() {
    var form = $("#bookingForm");
    var success = $("#bookingSuccess");
    if (form) form.style.display = "none";
    var foot = $("#bookingFoot");
    if (foot) foot.style.display = "none";
    if (success) success.classList.add("is-shown");
    var head = $("#modalTitle");
    if (head) head.textContent = "Request Sent!";
    var hint = $("#modalPkgHint");
    if (hint) hint.textContent = "Thank you — our team will contact you shortly.";
  }

  var form = $("#bookingForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // Native validation feedback
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      // VIP bus runs only on Monday & Thursday
      if (!checkVipDate()) {
        if (dateField) dateField.focus();
        return;
      }
      // departure time has to sit inside the bus's window
      clampTime();

      var men = parseInt(val("bkMen"), 10) || 0;
      var women = parseInt(val("bkWomen"), 10) || 0;
      if (men + women < 1) {
        alert("Please add at least 1 passenger (Men or Women).");
        return;
      }

      var msg = buildMessage();
      var url = "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(msg);

      window.open(url, "_blank", "noopener");
      showSuccess();
    });
  }

  // "Send on WhatsApp instead" quick action inside modal
  var waQuick = $("#bkWhatsappQuick");
  if (waQuick) {
    waQuick.addEventListener("click", function (e) {
      e.preventDefault();
      if (!checkVipDate()) {
        if (dateField) dateField.focus();
        return;
      }
      clampTime();
      var msg = "Assalam o Alaikum, I would like to inquire about an Umrah package.\n\n" + buildMessage();
      window.open("https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(msg), "_blank", "noopener");
    });
  }

  // Reset modal back to form when reopened after a success
  if (modal) {
    var observer = new MutationObserver(function () {
      if (!modal.classList.contains("is-open")) {
        var f = $("#bookingForm"), s = $("#bookingSuccess"), ft = $("#bookingFoot");
        if (f && s && s.classList.contains("is-shown")) {
          setTimeout(function () {
            f.reset();
            f.style.display = "";
            if (ft) ft.style.display = "";
            s.classList.remove("is-shown");
            var t = $("#modalTitle"); if (t) t.textContent = t.getAttribute("data-original") || t.textContent;
            updateTotal();
          }, 400);
        }
      }
    });
    observer.observe(modal, { attributes: true, attributeFilter: ["class"] });
  }

  /* ---------------- 10. GALLERY FILTER + LIGHTBOX ---------------- */
  var galItems = $$(".gal-item:not(.gal-item--slot)");
  var lb = $("#lightbox");
  var lbImg = $("#lightboxImg");
  var lbCap = $("#lightboxCap");
  var lbIdx = 0;

  function visibleGalItems() {
    return galItems.filter(function (it) { return it.style.display !== "none"; });
  }

  function openLightbox(item) {
    if (!lb || !item) return;
    var list = visibleGalItems();
    lbIdx = list.indexOf(item);
    paintLightbox(list);
    lb.classList.add("is-open");
    lb.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function paintLightbox(list) {
    if (!list || !list.length) return;
    var it = list[lbIdx];
    var img = $("img", it);
    var cap = $("figcaption", it);
    if (lbImg && img) { lbImg.src = img.currentSrc || img.src; lbImg.alt = img.alt || ""; }
    if (lbCap) {
      lbCap.textContent = cap ? (cap.getAttribute("data-title") || cap.textContent.trim()).replace(/\s+/g, " ") : "";
    }
  }
  function closeLightbox() {
    if (!lb) return;
    lb.classList.remove("is-open");
    lb.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
  function stepLightbox(dir) {
    var list = visibleGalItems();
    if (!list.length) return;
    lbIdx = (lbIdx + dir + list.length) % list.length;
    paintLightbox(list);
  }

  galItems.forEach(function (it) {
    it.addEventListener("click", function () { openLightbox(it); });
  });
  var lbClose = $("#lightboxClose");
  if (lbClose) lbClose.addEventListener("click", closeLightbox);
  var lbPrev = $("#lightboxPrev");
  var lbNext = $("#lightboxNext");
  if (lbPrev) lbPrev.addEventListener("click", function (e) { e.stopPropagation(); stepLightbox(-1); });
  if (lbNext) lbNext.addEventListener("click", function (e) { e.stopPropagation(); stepLightbox(1); });
  if (lb) lb.addEventListener("click", function (e) { if (e.target === lb) closeLightbox(); });

  window.addEventListener("keydown", function (e) {
    if (!lb || !lb.classList.contains("is-open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") stepLightbox(-1);
    if (e.key === "ArrowRight") stepLightbox(1);
  });

  // Gallery category filter buttons
  $$("[data-gal-filter]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var key = btn.getAttribute("data-gal-filter");
      $$("[data-gal-filter]").forEach(function (b) {
        var on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-selected", on ? "true" : "false");
      });
      galItems.forEach(function (it) {
        var cat = it.getAttribute("data-cat") || "";
        var show = key === "all" || cat === key;
        it.style.display = show ? "" : "none";
      });
      $$(".gal-slot-group").forEach(function (g) {
        var cat = g.getAttribute("data-slot-cat") || "";
        g.style.display = (key === "all" || cat === key) ? "" : "none";
      });
    });
  });

  /* ---------------- 11. SCROLL PROGRESS HAIRLINE ---------------- */
  var progress = document.createElement("div");
  progress.className = "scroll-progress";
  progress.setAttribute("aria-hidden", "true");
  progress.innerHTML = "<i></i>";
  document.body.appendChild(progress);
  var progressBar = progress.firstChild;

  function updateProgress() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
    progressBar.style.transform = "scaleX(" + p.toFixed(4) + ")";
  }
  updateProgress();
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);

  /* ---------------- 12. TO TOP ---------------- */
  var toTop = $(".to-top");
  if (toTop) {
    window.addEventListener("scroll", function () {
      toTop.classList.toggle("is-shown", window.scrollY > 700);
    }, { passive: true });
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------------- 13. FOOTER YEAR ---------------- */
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------------- 13. CONTACT FORM → WHATSAPP ---------------- */
  var cForm = $("#contactForm");
  if (cForm) {
    cForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!cForm.checkValidity()) { cForm.reportValidity(); return; }

      var L = [];
      L.push("*NEW WEBSITE INQUIRY*");
      L.push("— " + CONFIG.business + " —");
      L.push("");
      L.push("*Name:* " + val("ctName"));
      L.push("*Phone / WhatsApp:* " + val("ctPhone"));
      if (val("ctEmail")) L.push("*Email:* " + val("ctEmail"));
      L.push("*Interest:* " + (val("ctInterest") || "-"));
      if (val("ctDate")) L.push("*Preferred Date:* " + val("ctDate"));
      if (val("ctPeople")) L.push("*No. of People:* " + val("ctPeople"));
      if (val("ctMsg")) {
        L.push("");
        L.push("*Message:* " + val("ctMsg"));
      }

      window.open("https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(L.join("\n")), "_blank", "noopener");
      cForm.reset();
      var ok = $("#contactSuccess");
      if (ok) {
        ok.classList.add("is-shown");
        setTimeout(function () { ok.classList.remove("is-shown"); }, 7000);
      }
    });
  }

  /* ---------------- 13b. GALLERY PREVIEW CAROUSELS (home page) ---------------- */
  function glSteps(track) {
    var slide = track ? track.querySelector(".gl-slide") : null;
    if (!slide) return 0;
    return slide.getBoundingClientRect().width + 16;
  }

  function fillGlCarousel(key, items, renderer) {
    var track = $("[data-gl-track='" + key + "']");
    if (!track || !items || !items.length) return;

    items.forEach(function (item, i) {
      var slide = document.createElement("div");
      if (renderer) {
        slide.className = "gl-slide gl-slide--card";
        renderer(slide, item, i);
      } else {
        var src = item && item.src ? item.src : item;
        var fallbackAlt = (key === "vip" ? "VIP bus photo " : key === "normal" ? "Umrah bus photo " : "Hotel photo ") + (i + 1);
        var alt = item && item.alt ? item.alt : fallbackAlt;
        slide.className = "gl-slide";
        slide.innerHTML = '<img src="' + src + '" alt="' + alt + '" loading="lazy">';
      }
      track.appendChild(slide);
    });

    var step = glSteps(track);
    var arrows = $$("[data-gl-prev='" + key + "'], [data-gl-next='" + key + "']");
    if (items.length <= 1) { arrows.forEach(function (a) { a.style.display = "none"; }); return; }

    function moveBy(dir) {
      var w = glSteps(track);
      if (!w) return;
      var maxScroll = track.scrollWidth - track.clientWidth;
      if (maxScroll <= 0) return;                     // nothing to scroll
      var cur = track.scrollLeft;
      var next = cur + dir * w;
      if (next > maxScroll) next = (cur >= maxScroll - 8) ? 0 : maxScroll;
      if (next < 0) next = maxScroll;
      track.scrollTo({ left: next, behavior: "smooth" });
    }

    $$("[data-gl-prev='" + key + "']").forEach(function (b) { b.addEventListener("click", function () { hold(); moveBy(-1); }); });
    $$("[data-gl-next='" + key + "']").forEach(function (b) { b.addEventListener("click", function () { hold(); moveBy(1); }); });

    /* Auto-slide keeps running, but pauses while the visitor is reading/holding */
    var hovering = false;
    var holdUntil = 0;
    function hold(ms) { holdUntil = Date.now() + (ms || 7000); }
    track.addEventListener("mouseenter", function () { hovering = true; });
    track.addEventListener("mouseleave", function () { hovering = false; });
    track.addEventListener("pointerdown", function () { hold(9000); });
    track.addEventListener("touchstart", function () { hold(9000); }, { passive: true });
    track.addEventListener("focusin", function () { hold(9000); });

    /* Auto-slide stops when the row is off screen or the tab is in the background */
    var onScreen = true;
    onScreenWatcher(track, function (v) { onScreen = v; });

    setInterval(function () {
      if (!onScreen || document.hidden) return;
      if (!hovering && Date.now() > holdUntil) moveBy(1);
    }, 4600);
  }

  /* ---------------- 14. MAKKAH HOTELS (photos → gallery carousel + viewer) ---------------- */
  var hotelGrid = $("#hotelGrid");
  var hotelModal = $("#hotelModal");
  var openShotViewer = null;   // shared photo viewer (hotel photos + VIP bus photos)

  if (hotelModal) {
    var HOTELS = [
      { name: "Al Olyan Hotel", stars: 4, slug: "al-olyan" },
      { name: "Al Wafideen Hotel", stars: 4, slug: "al-wafideen" },
      { name: "Bilal Hotel", stars: 3, slug: "bilal" },
      { name: "Emaar Al Sultan Hotel", stars: 4, slug: "emaar-al-sultan" },
      { name: "Holiday Inn Hotel", stars: 5, slug: "holiday-inn" },
      { name: "M Millennium Hotel", stars: 5, slug: "m-millennium" },
      { name: "Palestine Hotel", stars: 4, slug: "palestine" },
      { name: "Park House Hotel", stars: 4, slug: "park-house" },
      { name: "Rizq Palace Hotel", stars: 4, slug: "rizq-palace" },
      { name: "Voco Hotel", stars: 5, slug: "voco" }
    ];
    var HOTEL_MAX_PHOTOS = 12;     // photos are read as 1.jpg, 2.jpg, 3.jpg … in each folder
    var hotelShots = [];
    var shotIdx = 0;

    var hImg = $("#hotelImg"), hName = $("#hotelName"), hStars = $("#hotelStars");
    var hCaption = $("#hotelCaption"), hCounter = $("#hotelCounter");
    var hThumbs = $("#hotelThumbs");

    function starLabel(n) { return n + " Star"; }

    var ICON_PIN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/></svg>';
    var ICON_BED = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 19v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7"/><path d="M3 19h18M7 10V7.5A1.5 1.5 0 0 1 8.5 6h3A1.5 1.5 0 0 1 13 7.5V10M16 10V7.5A1.5 1.5 0 0 1 17.5 6h1"/></svg>';
    var ICON_ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

    /* --- build the hotel cards from the photos found on disk --- */
    function hotelCardMarkup(hotel) {
      var shots = hotel.photos.length;
      return '<span class="hotel-card-thumb">' +
          '<img src="' + hotel.photos[0].src + '" alt="' + hotel.name + ' — ' + starLabel(hotel.stars) + ' hotel near Masjid al-Haram, Makkah" loading="lazy">' +
          '<span class="hotel-card-stars">' + hotel.stars + '★</span>' +
        '</span>' +
        '<span class="hotel-card-body">' +
          '<strong>' + hotel.name + '</strong>' +
          '<span class="hotel-card-meta">' + ICON_PIN + '<span>Makkah · Near Masjid al-Haram</span></span>' +
          '<span class="hotel-card-meta">' + ICON_BED + '<span>' + starLabel(hotel.stars) + ' hotel · ' + shots + (shots === 1 ? ' photo' : ' photos') + '</span></span>' +
          '<span class="hotel-card-cta">View photos ' + ICON_ARROW + '</span>' +
        '</span>';
    }

    function renderHotelCard(hotel) {
      if (!hotelGrid) return;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "hotel-card";
      btn.innerHTML = hotelCardMarkup(hotel);
      btn.addEventListener("click", function () { openHotelShots(hotel.photos, 0); });
      hotelGrid.appendChild(btn);
    }

    function firstShotOf(hotel) {
      for (var i = 0; i < hotelShots.length; i++) {
        if (hotelShots[i].hotel === hotel) return i;
      }
      return 0;
    }

    var hotelsPending = HOTELS.length;

    function hotelDone(hotel) {
      if (hotel.photos.length) renderHotelCard(hotel);
      hotelsPending--;
      if (hotelsPending === 0) {
        hotelShots = [];
        HOTELS.forEach(function (h) {
          h.photos.forEach(function (s) { hotelShots.push(s); });
        });
        fillGlCarousel("hotels", HOTELS.filter(function (h) { return h.photos.length; }), function (slide, hotel) {
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "hotel-card";
          btn.innerHTML = hotelCardMarkup(hotel);
          btn.addEventListener("click", function () { openHotelShots(hotel.photos, 0); });
          slide.appendChild(btn);
        });
      }
    }

    function scanHotel(hotel, then) {
      scanFolder("assets/img/hotels/" + hotel.slug + "/", HOTEL_MAX_PHOTOS, function (l) {
        hotel.photos = l.map(function (p) {
          return {
            hotel: hotel,
            src: p.src,
            alt: hotel.name + " — " + starLabel(hotel.stars) + " hotel near Masjid al-Haram, Makkah"
          };
        });
        hotelDone(hotel);
        if (then) then();
      });
    }

    /* --- viewer (activeShots = the list being viewed: one hotel, or all) --- */
    var activeShots = [];

    function buildThumbs() {
      if (!hThumbs) return;
      hThumbs.innerHTML = "";
      activeShots.forEach(function (shot, i) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "hotel-thumb";
        b.innerHTML = '<img src="' + shot.src + '" alt="' + shot.hotel.name + ' photo ' + (i + 1) + '">';
        b.addEventListener("click", function () { shotIdx = i; paintShot(); });
        hThumbs.appendChild(b);
      });
    }

    function paintShot() {
      var shot = activeShots[shotIdx];
      if (!shot) return;
      var isHotel = shot.hotel && typeof shot.hotel.stars === "number";
      if (hImg) { hImg.src = shot.src; hImg.alt = shot.alt; }
      if (hName) hName.textContent = shot.title || shot.hotel.name;
      if (hStars) hStars.textContent = shot.meta || (isHotel ? starLabel(shot.hotel.stars) + " Hotel · Makkah" : "");
      if (hCaption) hCaption.textContent = shot.caption || (isHotel ? shot.hotel.name + " · " + starLabel(shot.hotel.stars) : shot.title || "");
      if (hCounter) hCounter.textContent = (shotIdx + 1) + " / " + activeShots.length;
      var thumbs = hThumbs ? $$(".hotel-thumb", hThumbs) : [];
      thumbs.forEach(function (t, i) { t.classList.toggle("is-active", i === shotIdx); });
      if (thumbs[shotIdx] && thumbs[shotIdx].scrollIntoView) {
        thumbs[shotIdx].scrollIntoView({ block: "nearest", inline: "center" });
      }
    }

    function stepShot(dir) {
      if (!activeShots.length) return;
      shotIdx = (shotIdx + dir + activeShots.length) % activeShots.length;
      paintShot();
    }

    function openHotelShots(list, idx) {
      if (!list || !list.length) return;
      activeShots = list;
      shotIdx = idx || 0;
      buildThumbs();
      paintShot();
      hotelModal.classList.add("is-open");
      hotelModal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }
    openShotViewer = openHotelShots;

    function closeHotelShots() {
      hotelModal.classList.remove("is-open");
      hotelModal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    var hotelViewAll = $("#hotelViewAll");
    if (hotelViewAll) hotelViewAll.addEventListener("click", function () { openHotelShots(hotelShots, 0); });

    $$("[data-hotel-close]").forEach(function (el) { el.addEventListener("click", closeHotelShots); });
    hotelModal.addEventListener("click", function (e) { if (e.target === hotelModal) closeHotelShots(); });

    var hPrev = $("#hotelPrev"), hNext = $("#hotelNext");
    if (hPrev) hPrev.addEventListener("click", function (e) { e.stopPropagation(); stepShot(-1); });
    if (hNext) hNext.addEventListener("click", function (e) { e.stopPropagation(); stepShot(1); });

    window.addEventListener("keydown", function (e) {
      if (!hotelModal.classList.contains("is-open")) return;
      if (e.key === "Escape") closeHotelShots();
      if (e.key === "ArrowLeft") stepShot(-1);
      if (e.key === "ArrowRight") stepShot(1);
    });

    /* Kick off the photo scan (1.jpg, 2.jpg, 3.jpg … per hotel folder) — but only
       when the hotel gallery / "view all" viewer is actually on the page, and only
       once that anchor is about to be reached, never on page load. */
    var hotelGallery = $("[data-gl-track='hotels']");
    var scanAnchor = hotelGallery || ($("#hotelViewAll") ? hotelModal : null);
    if (scanAnchor) whenNear(scanAnchor, function () {
      scanFolders(HOTELS.map(function (hotel) {
        return function (next) {
          hotel.photos = [];
          scanHotel(hotel, next);
        };
      }), 4);
    }, 500);
  }

  /* ---------------- 15. BUS PHOTOS (gallery carousels + optional bus section) -------- */
  ["vip", "normal"].forEach(function (key) {
    var box = $("[data-bus-carousel='" + key + "']");
    var stage = $("[data-bus-stage='" + key + "']");
    var dots = $("[data-bus-dots='" + key + "']");
    var prevBtn = $("[data-bus-prev='" + key + "']");
    var nextBtn = $("[data-bus-next='" + key + "']");

    var photos = [];
    var idx = 0;
    var timer = null;
    var label = key === "vip" ? "VIP luxury bus" : "Air-conditioned Umrah bus";

    function show(i) {
      if (!photos.length || !stage) return;
      idx = (i + photos.length) % photos.length;
      $$(".bus-slide", stage).forEach(function (s, k) { s.classList.toggle("is-active", k === idx); });
      if (dots) $$(".bus-dot", dots).forEach(function (d, k) { d.classList.toggle("is-active", k === idx); });
    }
    function stop() { if (timer) clearInterval(timer); timer = null; }
    function start() { stop(); timer = setInterval(function () { show(idx + 1); }, 5200); }

    function build() {
      if (!photos.length) return;

      /* the gallery preview carousel always gets the photos */
      fillGlCarousel(key, photos);

      /* Bus tiles (VIP + Normal): click (or Enter) opens the viewer in full size */
      if (openShotViewer) {
        var busTitle = key === "vip" ? "VIP Luxury Bus" : "Umrah Bus (Normal)";
        var busMeta = key === "vip" ? "VIP Bus · Makkah & Madinah service" : "Normal Bus · Air-conditioned Umrah coach";
        var busShots = photos.map(function (src, i) {
          return {
            src: src,
            alt: label + " — photo " + (i + 1),
            hotel: { name: busTitle },
            title: busTitle,
            meta: busMeta,
            caption: busTitle + " — photo " + (i + 1) + " of " + photos.length
          };
        });
        var busTrack = $("[data-gl-track='" + key + "']");
        var downX = null;
        if (busTrack) busTrack.addEventListener("pointerdown", function (e) { downX = e.clientX; });

        $$("[data-gl-track='" + key + "'] .gl-slide").forEach(function (slide, i) {
          slide.setAttribute("role", "button");
          slide.setAttribute("tabindex", "0");
          slide.setAttribute("title", "Click to view full size");
          function open() { openShotViewer(busShots, i); }
          slide.addEventListener("click", function (e) {
            if (downX !== null && Math.abs(e.clientX - downX) > 8) return;   // ignore drags
            open();
          });
          slide.addEventListener("keydown", function (e) {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
          });
        });
      }

      /* the optional big bus section (cross-fade carousel) */
      if (!box || !stage) return;
      box.setAttribute("data-count", photos.length);
      photos.forEach(function (src, i) {
        var slide = document.createElement("div");
        slide.className = "bus-slide" + (i === 0 ? " is-active" : "");
        slide.innerHTML = '<img src="' + src + '" alt="' + label + ' — photo ' + (i + 1) + '" loading="lazy">';
        stage.appendChild(slide);
        if (dots) {
          var d = document.createElement("button");
          d.type = "button";
          d.className = "bus-dot" + (i === 0 ? " is-active" : "");
          d.setAttribute("aria-label", label + " photo " + (i + 1));
          d.addEventListener("click", function () { show(i); start(); });
          dots.appendChild(d);
        }
      });
      if (photos.length > 1) start();
    }

    if (prevBtn) prevBtn.addEventListener("click", function () { show(idx - 1); start(); });
    if (nextBtn) nextBtn.addEventListener("click", function () { show(idx + 1); start(); });
    if (box) {
      box.addEventListener("mouseenter", stop);
      box.addEventListener("mouseleave", function () { if (photos.length > 1) start(); });
    }

    /* Photos are read as 1.jpg, 2.jpg, 3.jpg … inside assets/img/buses/<vip|normal>/
       — the scan starts when this carousel comes near the viewport. */
    var glTrack = $("[data-gl-track='" + key + "']");
    var scanAnchor = glTrack || box;
    if (scanAnchor) whenNear(scanAnchor, function () {
      scanFolder("assets/img/buses/" + key + "/", 20, function (l) {
        l.forEach(function (p) { photos.push(p.src); });
        build();
      });
    }, 500);
  });

  /* ---------------- 15b. ABOUT-SECTION MEDIA CAROUSEL (buses → hotel rooms) ---
     The carousel next to "A Trusted Umrah Travel Service Based in Riyadh" runs
     through, in order: the three newest bus photos (10, 11, 12), the rest of the
     normal fleet, the VIP bus, and then the hotels — each hotel's view photo
     followed by its rooms. Photos load on demand (4 ahead of the current slide),
     so a 100+ photo rotation never slows the home page down. Clicking a slide
     opens it full size in the shared photo viewer.                            */
  (function () {
    var box = $("[data-bus-carousel='about']");
    var stage = $("[data-bus-stage='about']");
    if (!box || !stage) return;

    var dots = $("[data-bus-dots='about']");
    var flag = $("[data-bus-flag='about']");
    var prevBtn = $("[data-bus-prev='about']");
    var nextBtn = $("[data-bus-next='about']");

    var HOTELS = [
      { name: "Al Olyan Hotel", stars: 4, slug: "al-olyan" },
      { name: "Al Wafideen Hotel", stars: 4, slug: "al-wafideen" },
      { name: "Bilal Hotel", stars: 3, slug: "bilal" },
      { name: "Emaar Al Sultan Hotel", stars: 4, slug: "emaar-al-sultan" },
      { name: "Holiday Inn Hotel", stars: 5, slug: "holiday-inn" },
      { name: "M Millennium Hotel", stars: 5, slug: "m-millennium" },
      { name: "Palestine Hotel", stars: 4, slug: "palestine" },
      { name: "Park House Hotel", stars: 4, slug: "park-house" },
      { name: "Rizq Palace Hotel", stars: 4, slug: "rizq-palace" },
      { name: "Voco Hotel", stars: 5, slug: "voco" }
    ];
    var HOTEL_MAX_PHOTOS = 12;      // 1.jpg = hotel view, 2.jpg… = the rooms
    var MAX_DOTS = 12;              // more photos than this → counter instead of dots
    var FIRST_UP = [10, 11, 12];    // these three bus photos open the rotation
    var AHEAD = 4;                  // how many slides are loaded ahead of the show

    var photos = [];
    var idx = 0;
    var timer = null;
    var retry = null;
    var hovering = false;
    var dotsOn = false;
    var counter = null;
    var holdUntil = 0;
    var visible = true;
    var scannedFolders = 0;
    var allScanned = false;

    /* The rotation runs only while the carousel is on screen */
    onScreenWatcher(box, function (v) { visible = v; start(); });

    function load(i) {
      if (!photos.length) return;
      var s = stage.children[((i % photos.length) + photos.length) % photos.length];
      if (!s) return;
      var im = s.firstChild;
      if (im && !im.getAttribute("src")) im.setAttribute("src", s.getAttribute("data-src"));
    }

    function show(i) {
      if (!photos.length) return;
      idx = (i + photos.length) % photos.length;
      $$(".bus-slide", stage).forEach(function (s, k) { s.classList.toggle("is-active", k === idx); });
      if (dotsOn) $$(".bus-dot", dots).forEach(function (d, k) { d.classList.toggle("is-active", k === idx); });
      for (var k = 0; k < AHEAD; k++) load(idx + k);
      if (flag) flag.textContent = photos[idx].flag;
      if (counter) counter.textContent = (idx + 1) + " / " + photos.length;
    }

    function stop() {
      if (timer) clearInterval(timer);
      timer = null;
      if (retry) clearTimeout(retry);
      retry = null;
    }
    function start() {
      stop();
      if (photos.length < 2 || !visible) return;
      timer = setInterval(tick, 4600);
    }
    /* Move on only once the next photo is ready, so a slide never shows an empty
       grey frame while its image is still downloading. */
    function tick() {
      if (!visible || document.hidden || hovering) return;
      if (Date.now() < holdUntil) return;
      if (hotelModal && hotelModal.classList.contains("is-open")) return;   // paused while the viewer is open
      if (retry) { clearTimeout(retry); retry = null; }
      var nslide = stage.children[(idx + 1) % photos.length];
      var nimg = nslide ? nslide.firstChild : null;
      if (nimg) {
        if (!nimg.getAttribute("src")) nimg.setAttribute("src", nslide.getAttribute("data-src"));
        if (!nimg.complete) { retry = setTimeout(tick, 400); return; }
      }
      show(idx + 1);
    }

    function openPhoto(i) {
      var p = photos[i];
      if (p && p.basket && openShotViewer) openShotViewer(p.basket, p.at);
    }

    /* --- assemble the slide list (buses first, then the hotels) ---
       The folders are scanned in parallel, so the list only ever grows: both bus
       folders must be in before anything is painted, and the hotels are appended
       in folder order (a hotel is skipped until the one before it has scanned). */
    function compose() {
      var list = [];
      if (busesScanned < 2) return list;

      function addBuses(arr, vip) {
        var name = vip ? "VIP Luxury Bus" : "Umrah Bus (Normal)";
        var basket = arr.map(function (p, i) {
          return {
            src: p.src,
            alt: name + " — photo " + (i + 1) + " of " + arr.length,
            hotel: { name: name },
            title: name,
            meta: vip ? "VIP Bus · Makkah & Madinah service" : "Normal Bus · Air-conditioned Umrah coach",
            caption: name + " — photo " + (i + 1) + " of " + arr.length
          };
        });
        arr.forEach(function (p, i) {
          list.push({
            src: p.src,
            flag: (vip ? "VIP Bus" : "Normal Bus") + " · photo " + (i + 1) + " of " + arr.length,
            alt: (vip ? "VIP luxury bus" : "Air-conditioned Umrah bus") + " — photo " + (i + 1),
            basket: basket,
            at: i
          });
        });
      }

      function addHotel(entry) {
        var h = entry.hotel;
        var rooms = entry.photos.length - 1;
        var basket = entry.photos.map(function (p, i) {
          return {
            src: p.src,
            alt: h.name + (i ? " room photo " + i : " hotel view"),
            hotel: h,
            title: h.name,
            meta: h.stars + " Star Hotel · Makkah",
            caption: h.name + " — " + (i ? "room photo " + i + " of " + rooms : "hotel view")
          };
        });
        entry.photos.forEach(function (p, i) {
          list.push({
            src: p.src,
            flag: h.name + " · " + (i ? "room " + i + " of " + rooms : "hotel view"),
            alt: h.name + (i ? " room photo " + i : " hotel view"),
            basket: basket,
            at: i
          });
        });
      }

      if (buses.normal.length) addBuses(buses.normal, false);
      if (buses.vip.length) addBuses(buses.vip, true);
      for (var i = 0; i < hotels.length; i++) {
        if (!hotels[i].scanned) break;
        if (hotels[i].photos.length) addHotel(hotels[i]);
      }
      return list;
    }

    function addSlide(p, i) {
      var slide = document.createElement("div");
      slide.className = "bus-slide" + (i === 0 ? " is-active" : "");
      slide.setAttribute("role", "button");
      slide.setAttribute("tabindex", "0");
      slide.setAttribute("title", "Click to view full size");
      slide.setAttribute("data-src", p.src);
      slide.innerHTML = '<img alt="' + p.alt + '">';
      slide.addEventListener("click", function () { openPhoto(i); });
      slide.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openPhoto(i); }
      });
      stage.appendChild(slide);

      if (dots) {
        var d = document.createElement("button");
        d.type = "button";
        d.className = "bus-dot" + (i === 0 ? " is-active" : "");
        d.setAttribute("aria-label", "Show photo " + (i + 1) + " of " + photos.length);
        d.addEventListener("click", function () { show(i); start(); });
        dots.appendChild(d);
      }
    }

    /* ≤12 photos → dot navigation, otherwise the "12 / 189" counter chip. The
       choice can only be made once every folder has been scanned. */
    function applyPager() {
      if (!allScanned) return;
      dotsOn = !!dots && photos.length <= MAX_DOTS;
      if (dots) dots.hidden = !dotsOn;
      if (counter) counter.hidden = dotsOn;
    }

    function folderDone() {
      scannedFolders++;
      if (scannedFolders >= 2 + HOTELS.length) { allScanned = true; applyPager(); }
    }

    /* The folders arrive one after another: the first slides are painted as soon
       as the bus photos are known and every hotel is appended as it scans in, so
       the visitor never stares at an empty frame while ~150 photos are probed. */
    function render() {
      if (!photos.length) { build(); return; }
      var list = compose();
      if (list.length <= photos.length) return;
      for (var i = photos.length; i < list.length; i++) addSlide(list[i], i);
      photos = list;
      box.setAttribute("data-count", photos.length);
      if (counter) counter.textContent = (idx + 1) + " / " + photos.length;
      if (flag) flag.textContent = photos[idx].flag;
    }

    function build() {
      photos = compose();
      if (!photos.length) return;

      box.setAttribute("data-count", photos.length);
      if (dots) dots.hidden = true;      // decided by applyPager() when the scan ends
      counter = document.createElement("span");
      counter.className = "bus-count";
      box.appendChild(counter);

      photos.forEach(addSlide);
      show(0);
      start();
    }

    var buses = { normal: [], vip: [] };
    var busesScanned = 0;
    var hotels = [];                       // [{ hotel: …, photos: [{n, src}…], scanned }]

    /* Scan the folders only when the carousel is about to be reached (never on
       page load) and paint the slides as each folder arrives. */
    whenNear(box, function () {
      scanFolder("assets/img/buses/normal/", 20, function (l) {
        buses.normal = l;
        /* 10, 11, 12 first, then the rest of the normal fleet */
        var first = [];
        FIRST_UP.forEach(function (num) {
          for (var i = 0; i < buses.normal.length; i++) {
            if (buses.normal[i].n === num) { first.push(buses.normal.splice(i, 1)[0]); break; }
          }
        });
        buses.normal = first.concat(buses.normal);
        busesScanned++;
        render();
        folderDone();
      });
      scanFolder("assets/img/buses/vip/", 20, function (l) {
        buses.vip = l;
        busesScanned++;
        render();
        folderDone();
      });
      /* the hotel folders are scanned four at a time (they are only reached later
         in the rotation) so the probes never crowd out the visible slides */
      scanFolders(HOTELS.map(function (h) {
        return function (next) {
          var entry = { hotel: h, photos: [], scanned: false };
          hotels.push(entry);
          scanFolder("assets/img/hotels/" + h.slug + "/", HOTEL_MAX_PHOTOS, function (l) {
            entry.photos = l;
            entry.scanned = true;
            render();
            folderDone();
            next();
          });
        };
      }), 4);
    }, 400);

    if (prevBtn) prevBtn.addEventListener("click", function () { show(idx - 1); start(); });
    if (nextBtn) nextBtn.addEventListener("click", function () { show(idx + 1); start(); });

    box.addEventListener("mouseenter", function () { hovering = true; });
    box.addEventListener("mouseleave", function () { hovering = false; });
    box.addEventListener("focusin", function () { hovering = true; });
    box.addEventListener("focusout", function () { hovering = false; });
    /* a tap / swipe on mobile only pauses the rotation for a moment */
    box.addEventListener("pointerdown", function () { holdUntil = Date.now() + 9000; });
  })();

  /* ---------------- 17. PACKAGE CARD PHOTO ----------------
     The package cards are authored without an <img>. This drops a designed
     photo header into each one: a pre-made collage of the trip's destination
     (Makkah, Madinah, or the two side by side) and one of our own coaches —
     see `assets/img/packages/` and the repo notes for how they are built.
     Over the photo it lays the Al-Elahi Travels wordmark, the Arabic line
     ("a complete spiritual journey") and a chevron; then a green location
     pill in front of the card's own pills, and a hotel / bus row under the
     title. Same shape as the reference package card.
     `loading="lazy"` keeps the extra images off the initial load.        */
  (function () {
    var cards = $$(".pkg");
    if (!cards.length) return;

    var P = "assets/img/packages/";

    /* two or three collages per group, cycled so neighbours never repeat */
    var SETS = {
      makkah:  ["makkah-1.jpg", "makkah-2.jpg"],
      madinah: ["madinah-1.jpg", "madinah-2.jpg", "madinah-3.jpg"],
      both:    ["both-1.jpg", "both-2.jpg"],
      vip:     ["vip-1.jpg", "vip-2.jpg"],
      /* family trips use variants that also show a family in the collage */
      "makkah-family":  ["makkah-family-1.jpg", "makkah-family-2.jpg"],
      "madinah-family": ["madinah-family-1.jpg", "madinah-family-2.jpg"],
      "both-family":    ["both-family-1.jpg", "both-family-2.jpg"],
      "vip-family":     ["vip-family-1.jpg"]
    };
    var ALT = {
      makkah:  "Al-Elahi Travels Umrah package — our coach and Masjid al-Haram in Makkah",
      madinah: "Al-Elahi Travels Umrah package — our coach and Masjid an-Nabawi in Madinah",
      both:    "Al-Elahi Travels Umrah package — our coach, Makkah and Madinah",
      vip:     "Al-Elahi Travels VIP Umrah package — our luxury coach and Masjid al-Haram",
      "makkah-family":  "Al-Elahi Travels family Umrah package — a family at Masjid al-Haram and our coach",
      "madinah-family": "Al-Elahi Travels family Umrah package — a family at Masjid an-Nabawi and our coach",
      "both-family":    "Al-Elahi Travels family Umrah package — a family, Makkah, Madinah and our coach",
      "vip-family":     "Al-Elahi Travels VIP family Umrah package — a family at Masjid al-Haram and our luxury coach"
    };

    var ICON_HOTEL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 19v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7"/><path d="M3 19h18M7 10V7.5A1.5 1.5 0 0 1 8.5 6h3A1.5 1.5 0 0 1 13 7.5V10M16 10V7.5A1.5 1.5 0 0 1 17.5 6h1"/></svg>';
    var ICON_BUS   = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17h14M6 17V9.5a2 2 0 0 1 .6-1.4l1.5-1.5A2 2 0 0 1 9.5 6h5a2 2 0 0 1 1.4.6l1.5 1.5A2 2 0 0 1 18 9.5V17"/><path d="M3 17h18M6 12h12"/><circle cx="8.5" cy="17" r="1.6"/><circle cx="15.5" cy="17" r="1.6"/></svg>';
    var ICON_CLOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/></svg>';
    var ICON_WA = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47 0 1.46 1.06 2.87 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.28.17-1.41-.07-.13-.27-.2-.57-.35zM12.05 21.5h-.01a9.4 9.4 0 0 1-4.79-1.31l-.34-.2-3.56.93.95-3.47-.22-.36a9.38 9.38 0 0 1-1.44-5.01c0-5.18 4.22-9.4 9.42-9.4a9.36 9.36 0 0 1 6.65 2.76 9.33 9.33 0 0 1 2.76 6.65c0 5.18-4.23 9.41-9.42 9.41zM20.13 3.86A11.35 11.35 0 0 0 12.05.5C5.78.5.68 5.6.68 11.87c0 2.01.53 3.98 1.53 5.71L.58 23.5l6.06-1.59a11.33 11.33 0 0 0 5.41 1.38h.01c6.27 0 11.37-5.1 11.37-11.37 0-3.04-1.18-5.9-3.3-8.06z"/></svg>';

    /* Bus timings — the same wording is repeated inside the booking modal
       (`.bus-note` / `.bus-note--time`). */
    var TIME_NORMAL = "Daily · 10:00 AM – 7:00 PM";
    var TIME_VIP    = "Mon & Thu · 10:00 AM – 2:00 PM";

    /* تجربة روحانية شاملة — “a complete spiritual journey” */
    var AR_LINE = "\u062a\u062c\u0631\u0628\u0629 \u0631\u0648\u062d\u0627\u0646\u064a\u0629 \u0634\u0627\u0645\u0644\u0629";

    var used = {};

    function pick(set) {
      var list = SETS[set];
      var i = (used[set] || 0) % list.length;
      used[set] = (used[set] || 0) + 1;
      return list[i];
    }

    cards.forEach(function (card) {
      if (card.querySelector(".pkg-media")) return;

      var btn      = card.querySelector("[data-bus]");
      var destEl   = card.querySelector("[data-dest]");
      var busVal   = btn    ? (btn.getAttribute("data-bus")     || "") : "";
      var hotelVal = btn    ? (btn.getAttribute("data-hotel")   || "") : "";
      var destVal  = destEl ? (destEl.getAttribute("data-dest") || "") : "";

      var isVip = /vip/i.test(busVal);
      var labelEl = card.querySelector(".pkg-tag--green") || card.querySelector(".pkg-tag");
      var labelText = labelEl ? labelEl.textContent.replace(/\s+/g, " ").trim() : "";
      var set, tag;

      if (isVip) {
        set = "vip";      tag = "VIP Bus";
      } else if (/madinah only/i.test(destVal)) {
        set = "madinah";  tag = "Madinah";
      } else if (/makkah\s*\+\s*madinah/i.test(destVal)) {
        set = "both";     tag = "Makkah & Madinah";
      } else if (/makkah only/i.test(destVal)) {
        set = "makkah";   tag = "Makkah";
      } else {
        /* the two home-page showcase cards already carry a label pill of their
           own, so the photo gets only the brand + Arabic overlays.
           Riyadh serves Makkah, Pakistan serves both holy cities. */
        set = /pakistan/i.test(labelText) ? "both" : "makkah";
        tag = null;
      }

      /* timings — VIP cards show the Mon/Thu window, the rest the daily one.
         The Pakistan packages (the #pakistan panel and the home-page showcase
         card) are a flight product, so they get no bus-timing pill at all. */
      var isPakistan = !!card.closest("#pakistan") || (!btn && /pakistan/i.test(labelText));
      var timeVal = isVip ? TIME_VIP : (isPakistan ? "" : TIME_NORMAL);

      /* Family trips swap in a variant of the collage that shows a family
         between the destination and the coach. NOTE: the VIP Bus cards carry
         TWO `.pkg-tag--type` chips ("VIP Bus" + "Family"/"Bachelors"), so every
         chip has to be checked — not just the first one. */
      var isFamily = $$(".pkg-tag--type, .pkg-tag--green", card).some(function (el) {
        return /family/i.test(el.textContent);
      });
      if (isFamily && SETS[set + "-family"]) set = set + "-family";

      var media = document.createElement("div");
      media.className = "pkg-media";
      media.innerHTML =
        '<img src="' + P + pick(set) + '" alt="' + ALT[set] + '" loading="lazy" decoding="async">' +
        '<span class="pkg-media-brand">Al-Elahi Travels</span>' +
        '<span class="pkg-media-copy"><b>' + AR_LINE + '</b>' +
          '<span>A complete spiritual journey</span></span>';
      card.insertBefore(media, card.firstChild);

      /* green location pill, in front of the card's own duration / type pills */
      var tags = card.querySelector(".pkg-tags");
      if (tags && tag) {
        var place = document.createElement("span");
        place.className = "pkg-tag pkg-tag--place";
        place.textContent = tag;
        tags.insertBefore(place, tags.firstChild);
      }

      /* hotel + bus + timing row, under the card title */
      var anchor = card.querySelector(".pkg-duration") || card.querySelector(".pkg-top h3");
      if (anchor && (hotelVal || busVal || timeVal)) {
        var meta = document.createElement("div");
        meta.className = "pkg-meta";
        meta.innerHTML =
          (hotelVal ? '<span class="pkg-meta-item">' + ICON_HOTEL + hotelVal + ' Hotel</span>' : "") +
          (busVal   ? '<span class="pkg-meta-item">' + ICON_BUS   + busVal   + '</span>'           : "") +
          (timeVal  ? '<span class="pkg-meta-item pkg-meta-item--time">' + ICON_CLOCK + timeVal + '</span>' : "");
        anchor.parentNode.insertBefore(meta, anchor.nextSibling);
      }

      /* The Pakistan packages are arranged on WhatsApp, so there the Book Now
         button is replaced by a WhatsApp icon button that opens a chat with
         the package already written in. */
      if (card.closest("#pakistan")) {
        var bookBtn = card.querySelector("[data-book]");
        if (bookBtn) {
          var pkgName = bookBtn.getAttribute("data-book") || "Umrah Package";
          var waLink = document.createElement("a");
          waLink.className = "btn btn--wa";
          waLink.href = "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(
            "Assalam o Alaikum, I would like to book this Umrah package: " + pkgName
          );
          waLink.target = "_blank";
          waLink.rel = "noopener";
          waLink.title = "Book on WhatsApp";
          waLink.setAttribute("aria-label", "Book " + pkgName + " on WhatsApp");
          waLink.innerHTML = ICON_WA;
          bookBtn.parentNode.replaceChild(waLink, bookBtn);
        }
      }
    });
  })();

  /* ---------------- 18. VIDEO SHOWCASE (home page) ----------------
     The clips are read as assets/Videos/1.mp4, 2.mp4, 3.mp4 … just like the
     photo folders, with a matching poster in assets/img/video/1.jpg …, so a new
     clip only has to be dropped in under the next number. Each card shows the
     poster and plays a silent preview on hover; a click opens the full player
     (with sound, controls and ←/→ to move through the clips). */
  (function () {
    var grid = $("[data-video-grid]");
    if (!grid) return;

    var band = grid.closest(".video-band") || grid;
    var modal = $("#videoModal");
    var player = $("#videoPlayer");
    var titleEl = $("#videoTitle");
    var countEl = $("#videoCounter");
    var loadEl = $("#videoLoad");
    var prevBtn = $("[data-video-prev]");
    var nextBtn = $("[data-video-next]");

    var MAX_VIDEOS = 12;
    var videos = [];
    var current = 0;
    var stoppers = [];                                    // pause-preview hooks
    var hoverOK = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    var ICON_PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86A1 1 0 0 0 8 5.14z"/></svg>';

    function posterOf(n) { return "assets/img/video/" + n + ".jpg"; }

    function makeCard(v, i) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "vcard";
      btn.style.setProperty("--i", i);
      btn.setAttribute("aria-label", "Play Umrah journey video " + (i + 1) + " of " + videos.length);
      btn.innerHTML =
        '<span class="vcard-media">' +
          '<video class="vcard-video" muted loop playsinline preload="none"></video>' +
          '<img class="vcard-poster" src="' + posterOf(v.n) + '" alt="Umrah journey with Al-Elahi Travels — video ' + (i + 1) + '" loading="lazy">' +
        '</span>' +
        '<span class="vcard-scrim"></span>' +
        '<span class="vcard-play"><span>' + ICON_PLAY + '</span></span>' +
        '<span class="vcard-bar">' +
          '<span class="vcard-tag">' + ICON_PLAY + '</span>' +
          '<span class="vcard-name">Umrah Journey</span>' +
        '</span>';

      var media = $(".vcard-media", btn);
      var poster = $(".vcard-poster", btn);
      var vid = $(".vcard-video", btn);

      /* the poster decides the frame, so a portrait clip never gets cropped */
      poster.addEventListener("load", function () {
        if (poster.naturalWidth) media.style.aspectRatio = poster.naturalWidth + " / " + poster.naturalHeight;
      });
      /* no poster made for this clip yet → let the video paint its own first frame */
      poster.addEventListener("error", function () {
        poster.style.display = "none";
        vid.setAttribute("preload", "metadata");
        if (!vid.getAttribute("src")) vid.setAttribute("src", v.src);
      });
      vid.addEventListener("loadedmetadata", function () {
        if (vid.videoWidth && !media.style.aspectRatio) {
          media.style.aspectRatio = vid.videoWidth + " / " + vid.videoHeight;
        }
      });

      function preview() {
        if (!hoverOK || (modal && modal.classList.contains("is-open"))) return;
        if (!vid.getAttribute("src")) vid.setAttribute("src", v.src);
        btn.classList.add("is-playing");
        var p = vid.play();
        if (p && p["catch"]) p["catch"](function () {});
      }
      function stopPreview() {
        if (!btn.classList.contains("is-playing")) return;
        btn.classList.remove("is-playing");
        vid.pause();
        try { vid.currentTime = 0; } catch (e) { /* not seekable yet */ }
      }
      stoppers.push(stopPreview);

      btn.addEventListener("mouseenter", preview);
      btn.addEventListener("mouseleave", stopPreview);
      btn.addEventListener("focus", preview);
      btn.addEventListener("blur", stopPreview);
      btn.addEventListener("click", function () { openVideo(i); });
      return btn;
    }

    function stopPreviews() { stoppers.forEach(function (fn) { fn(); }); }

    /* --- the full player --- */
    function openVideo(i) {
      if (!videos.length) return;
      stopPreviews();
      current = ((i % videos.length) + videos.length) % videos.length;
      var v = videos[current];

      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      if (loadEl) loadEl.hidden = false;
      if (titleEl) titleEl.textContent = "Umrah Journey — Clip " + (current + 1);
      if (countEl) countEl.textContent = (current + 1) + " / " + videos.length;

      player.pause();
      player.setAttribute("src", v.src);
      player.load();
      var p = player.play();
      if (p && p["catch"]) p["catch"](function () {});
    }

    function closeVideo() {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      player.pause();
      player.removeAttribute("src");       // stop buffering a 12–30 MB clip
      player.load();
      if (loadEl) loadEl.hidden = true;
    }

    function stepVideo(dir) { if (videos.length) openVideo(current + dir); }

    /* Phone clips are portrait, so the player is sized from the clip itself:
       a tall narrow box for portrait, a wide box for landscape. */
    player.addEventListener("loadedmetadata", function () {
      if (!player.videoWidth || !player.videoHeight) return;
      var ar = player.videoWidth / player.videoHeight;
      var narrow = window.matchMedia("(max-width: 560px)").matches;
      modal.style.setProperty("--video-ar", player.videoWidth + " / " + player.videoHeight);
      if (ar < 1) {
        modal.style.setProperty("--video-w", "500px");
        modal.style.setProperty("--video-h", narrow ? "min(64vh, 520px)" : "min(78vh, 760px)");
      } else {
        modal.style.setProperty("--video-w", "960px");
        modal.style.setProperty("--video-h", narrow ? "min(52vh, 360px)" : "min(62vh, 540px)");
      }
    });
    player.addEventListener("canplay", function () { if (loadEl) loadEl.hidden = true; });
    player.addEventListener("error", function () { if (loadEl) loadEl.hidden = true; });

    if (prevBtn) prevBtn.addEventListener("click", function () { stepVideo(-1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { stepVideo(1); });
    $$("[data-video-close]").forEach(function (el) { el.addEventListener("click", closeVideo); });
    modal.addEventListener("click", function (e) { if (e.target === modal) closeVideo(); });
    window.addEventListener("keydown", function (e) {
      if (!modal.classList.contains("is-open")) return;
      if (e.key === "Escape") closeVideo();
      if (e.key === "ArrowLeft") stepVideo(-1);
      if (e.key === "ArrowRight") stepVideo(1);
    });

    /* Only look for clips once the band is about to be reached */
    whenNear(band, function () {
      scanVideos("assets/Videos/", MAX_VIDEOS, function (list) {
        if (!list.length) { band.hidden = true; return; }
        /* The newest clip (highest number) is shown first — the rest keep their
           order after it, so adding 5.mp4 later pushes it to the front. */
        var last = list[list.length - 1];
        videos = [last].concat(list.slice(0, -1));
        /* three clips → three columns, four or more → a full wall of four */
        var cols = videos.length >= 4 ? 4 : (videos.length > 1 ? videos.length : 3);
        grid.classList.add("video-grid--" + cols);
        videos.forEach(function (v, i) { grid.appendChild(makeCard(v, i)); });
      });
    }, 500);
  })();

  /* ---------------- 16. SEO-ish: current year + active nav safe-guard ---- */
  var path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  $$(".main-nav a").forEach(function (a) {
    var href = (a.getAttribute("href") || "").toLowerCase();
    if (href === path) a.setAttribute("aria-current", "page");
  });

})();
