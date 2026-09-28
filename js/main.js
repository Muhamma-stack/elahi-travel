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

    setInterval(function () {
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

    function probePhoto(hotel, i) {
      var src = "assets/img/hotels/" + hotel.slug + "/" + i + ".jpg";
      var probe = new Image();
      probe.onload = function () {
        hotel.photos.push({
          hotel: hotel,
          src: src,
          alt: hotel.name + " — " + starLabel(hotel.stars) + " hotel near Masjid al-Haram, Makkah"
        });
        if (i < HOTEL_MAX_PHOTOS) probePhoto(hotel, i + 1);
        else hotelDone(hotel);
      };
      probe.onerror = function () { hotelDone(hotel); };
      probe.src = src;
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

    /* Kick off the photo scan (1.jpg, 2.jpg, 3.jpg … per hotel folder) */
    HOTELS.forEach(function (hotel) {
      hotel.photos = [];
      probePhoto(hotel, 1);
    });
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

    /* Photos are read as 1.jpg, 2.jpg, 3.jpg … inside assets/img/buses/<vip|normal>/ */
    var n = 1;
    (function probe() {
      var src = "assets/img/buses/" + key + "/" + n + ".jpg";
      var im = new Image();
      im.onload = function () {
        photos.push(src);
        if (n < 20) { n++; probe(); } else build();
      };
      im.onerror = function () { build(); };
      im.src = src;
    })();
  });

  /* ---------------- 16. SEO-ish: current year + active nav safe-guard ---- */
  var path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  $$(".main-nav a").forEach(function (a) {
    var href = (a.getAttribute("href") || "").toLowerCase();
    if (href === path) a.setAttribute("aria-current", "page");
  });

})();
