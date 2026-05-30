/* =========================================================
   Банний набір для «незайманої» — interactions
   ========================================================= */
(function () {
  "use strict";

  const $  = (s, ctx = document) => ctx.querySelector(s);
  const $$ = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Year ---------- */
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Sticky nav state ---------- */
  const nav = $("#nav");
  const onScroll = () => {
    nav.classList.toggle("is-scrolled", window.scrollY > 10);
    toTop.classList.toggle("is-visible", window.scrollY > 600);
  };

  /* ---------- Mobile menu ---------- */
  const burger = $("#burger");
  const navLinks = $("#navLinks");
  const closeMenu = () => {
    burger.classList.remove("is-open");
    navLinks.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  };
  burger.addEventListener("click", () => {
    const open = burger.classList.toggle("is-open");
    navLinks.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  });
  $$(".nav__link", navLinks).forEach((a) => a.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });

  /* ---------- Back to top ---------- */
  const toTop = $("#toTop");
  toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Scroll reveal ---------- */
  const reveals = $$(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          // small stagger for grouped siblings
          const delay = Math.min(i * 40, 160);
          setTimeout(() => el.classList.add("is-in"), delay);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
  }

  /* ---------- Animated counters ---------- */
  const counters = $$("[data-count]");
  const runCounter = (el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    const suffix = el.dataset.suffix || "";
    const dur = 1600;
    const start = performance.now();
    const fmt = (n) => n.toLocaleString("uk-UA", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = fmt(target) + suffix;
    };
    requestAnimationFrame(tick);
  };
  if ("IntersectionObserver" in window && !reduceMotion) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { runCounter(entry.target); cio.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => cio.observe(el));
  } else {
    counters.forEach((el) => {
      const decimals = parseInt(el.dataset.decimals || "0", 10);
      el.textContent = parseFloat(el.dataset.count).toLocaleString("uk-UA", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + (el.dataset.suffix || "");
    });
  }

  /* ---------- Hero glow follows cursor ---------- */
  const hero = $("#hero");
  const heroGlow = $("#heroGlow");
  if (hero && heroGlow && !reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      heroGlow.style.left = ((e.clientX - r.left) / r.width) * 100 + "%";
      heroGlow.style.top = ((e.clientY - r.top) / r.height) * 100 + "%";
    });
  }

  /* ---------- Ember/steam canvas ---------- */
  const canvas = $("#emberCanvas");
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext("2d");
    const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    let w = 0, h = 0, particles = [];
    let rafId = null;          // single source of truth for the loop
    let onScreen = true;

    const resize = () => {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(w * DPR));
      canvas.height = Math.max(1, Math.round(h * DPR));
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };

    const makeParticle = (fromBottom) => ({
      x: Math.random() * w,
      y: fromBottom ? h + Math.random() * 20 : Math.random() * h,
      r: Math.random() * 2.4 + 0.6,
      vy: -(Math.random() * 0.5 + 0.18),
      vx: (Math.random() - 0.5) * 0.25,
      a: Math.random() * 0.5 + 0.15,
      ember: Math.random() > 0.78,
      tw: Math.random() * Math.PI * 2,
    });

    const init = () => {
      resize();
      const count = Math.round(Math.min(w, 1400) / 18);
      particles = Array.from({ length: count }, () => makeParticle(false));
    };

    const frame = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter"; // additive glow — cheaper than per-particle shadowBlur
      for (const p of particles) {
        p.y += p.vy; p.x += p.vx; p.tw += 0.02;
        if (p.y < -10) Object.assign(p, makeParticle(true));
        const flicker = Math.max(p.a + Math.sin(p.tw) * 0.12, 0);
        ctx.fillStyle = p.ember
          ? `rgba(255, 150, 90, ${flicker})`
          : `rgba(120, 190, 255, ${flicker})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
      rafId = requestAnimationFrame(frame);
    };

    const start = () => { if (rafId === null && onScreen) rafId = requestAnimationFrame(frame); };
    const stop  = () => { if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; } };

    init();
    start();

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(init, 200); // just re-init dimensions; never spawns a second loop
    });

    // pause when scrolled off-screen to save battery
    new IntersectionObserver((entries) => {
      onScreen = entries[0].isIntersecting;
      if (onScreen) start(); else stop();
    }, { threshold: 0 }).observe(canvas);
  }

  /* ---------- Kit interactive detail ---------- */
  const kitItems = $$(".kit__item");
  const kitEmoji = $("#kitEmoji");
  const kitTitle = $("#kitTitle");
  const kitText = $("#kitText");
  const setKit = (item) => {
    kitItems.forEach((i) => i.classList.remove("is-active"));
    item.classList.add("is-active");
    if (kitEmoji) { kitEmoji.style.transform = "scale(0.6)"; setTimeout(() => { kitEmoji.textContent = item.dataset.emoji; kitEmoji.style.transform = "scale(1)"; }, 120); }
    if (kitTitle) kitTitle.textContent = item.dataset.title;
    if (kitText) kitText.textContent = item.dataset.text;
  };
  kitItems.forEach((item) => {
    item.addEventListener("mouseenter", () => setKit(item));
    item.addEventListener("click", () => setKit(item));
  });

  /* ---------- Configurator ---------- */
  const baseInputs = $$('#baseOptions input[name="base"]');
  const addonInputs = $$("#addonOptions input[type=checkbox]");
  const totalEl = $("#builderTotal");
  const builderOrderBtn = $("#builderOrder");
  const setSelect = $("#setSelect");

  const formatUAH = (n) => n.toLocaleString("uk-UA") + " грн";

  const calcTotal = () => {
    let total = 0, addons = [];
    const base = baseInputs.find((i) => i.checked) || baseInputs[0];
    if (base) total += parseInt(base.value, 10);
    addonInputs.forEach((i) => { if (i.checked) { total += parseInt(i.value, 10); addons.push(i.dataset.name); } });
    return { total, base, addons };
  };

  const animateTotal = (() => {
    let from = 990;
    return (to) => {
      if (reduceMotion) { totalEl.textContent = formatUAH(to); from = to; return; }
      const start = performance.now(), dur = 450, s = from;
      const tick = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        totalEl.textContent = formatUAH(Math.round(s + (to - s) * eased));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      from = to;
    };
  })();

  const updateBuilder = () => { animateTotal(calcTotal().total); };
  baseInputs.forEach((i) => i.addEventListener("change", updateBuilder));
  addonInputs.forEach((i) => i.addEventListener("change", updateBuilder));
  if (totalEl) updateBuilder();

  if (builderOrderBtn) {
    builderOrderBtn.addEventListener("click", () => {
      const { total, base, addons } = calcTotal();
      if (setSelect) {
        const opt = $$("#setSelect option").find((o) => o.value.includes("Власний"));
        if (opt) opt.selected = true;
      }
      const comment = $("#comment");
      if (comment) {
        const list = addons.length ? " + " + addons.join(", ") : "";
        comment.value = `Конструктор: ${base ? base.dataset.name : ""}${list}. Разом: ${formatUAH(total)}.`;
      }
      flashOrder();
      toast(`Набір на ${formatUAH(total)} додано до заявки`);
    });
  }

  /* ---------- Set cards -> prefill order select ---------- */
  $$("[data-set]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (setSelect) {
        const match = $$("#setSelect option").find((o) => o.textContent.trim() === btn.dataset.set.trim());
        if (match) match.selected = true;
      }
      flashOrder();
    });
  });

  /* highlight the order form briefly */
  const orderForm = $("#orderForm");
  function flashOrder() {
    if (!orderForm || reduceMotion) return;
    orderForm.animate(
      [{ boxShadow: "0 0 0 0 rgba(56,189,248,0.0)" }, { boxShadow: "0 0 0 6px rgba(56,189,248,0.35)" }, { boxShadow: "0 0 0 0 rgba(56,189,248,0.0)" }],
      { duration: 900, easing: "ease-out" }
    );
  }

  /* ---------- Toast ---------- */
  const toastEl = $("#toast");
  let toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("is-visible"), 3200);
  }

  /* ---------- Phone mask (light) ---------- */
  const phone = $("#phone");
  if (phone) {
    phone.addEventListener("input", () => {
      let d = phone.value.replace(/\D/g, "");
      if (d.startsWith("380")) d = d.slice(3);
      if (d.startsWith("0")) d = d.slice(1);
      d = d.slice(0, 9);
      let out = "+38 (0";
      if (d.length === 0) { phone.value = phone.value === "" ? "" : "+38 (0"; return; }
      out += d.slice(0, 2) + ")";
      if (d.length > 2) out += " " + d.slice(2, 5);
      if (d.length > 5) out += "-" + d.slice(5, 7);
      if (d.length > 7) out += "-" + d.slice(7, 9);
      phone.value = out;
    });
  }

  /* ---------- Form validation + submit ---------- */
  const successBox = $("#orderSuccess");
  if (orderForm) {
    const name = $("#name");

    const validateField = (field, ok) => {
      field.closest(".field").classList.toggle("is-invalid", !ok);
      return ok;
    };

    orderForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const okName = validateField(name, name.value.trim().length >= 2);
      const digits = phone.value.replace(/\D/g, "");
      const okPhone = validateField(phone, digits.length >= 11); // 380 + 9
      if (!okName || !okPhone) {
        toast("Перевірте, будь ласка, виділені поля");
        return;
      }
      // Send to PHP -> Telegram
      const btn = $("button[type=submit]", orderForm);
      const originalLabel = btn.textContent;
      btn.textContent = "Надсилаємо…";
      btn.disabled = true;

      const succeed = () => { if (successBox) successBox.hidden = false; toast("Заявку успішно надіслано 🔥"); };
      const fail = () => {
        btn.textContent = originalLabel;
        btn.disabled = false;
        toast("Не вдалося надіслати. Зателефонуйте, будь ласка 🙏");
      };

      // Demo mode when opened directly as a local file (no PHP server)
      if (location.protocol === "file:") {
        setTimeout(() => { succeed(); toast("Демо-режим: для реальної відправки завантажте сайт на хостинг з PHP"); }, 600);
        return;
      }

      fetch(orderForm.getAttribute("action") || "send.php", { method: "POST", body: new FormData(orderForm) })
        .then((r) => r.json().then((d) => ({ ok: r.ok && d && d.ok })).catch(() => ({ ok: r.ok })))
        .then((res) => (res.ok ? succeed() : fail()))
        .catch(fail);
    });

    [name, phone].forEach((f) => f.addEventListener("input", () => f.closest(".field").classList.remove("is-invalid")));
  }

  /* ---------- Active nav link on scroll ---------- */
  const sections = ["sets", "showcase", "features", "kit", "builder", "reviews"].map((id) => $("#" + id)).filter(Boolean);
  const navMap = new Map($$(".nav__link").map((a) => [a.getAttribute("href"), a]));
  if ("IntersectionObserver" in window && sections.length) {
    const sio = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const link = navMap.get("#" + entry.target.id);
        if (link) link.style.color = entry.isIntersecting ? "var(--text)" : "";
      });
    }, { threshold: 0.5 });
    sections.forEach((s) => sio.observe(s));
  }

  /* ---------- Preloader ---------- */
  const preloader = $("#preloader");
  if (preloader) {
    const fill = $("#preloaderFill");
    let p = 0, pTimer, finished = false;
    const tick = () => { p = Math.min(p + Math.random() * 13, 90); if (fill) fill.style.width = p + "%"; pTimer = setTimeout(tick, 150); };
    if (!reduceMotion) tick();
    const finish = () => {
      if (finished) return; finished = true;
      clearTimeout(pTimer);
      if (fill) fill.style.width = "100%";
      setTimeout(() => {
        preloader.classList.add("is-done");
        setTimeout(() => preloader.remove(), 650);
      }, reduceMotion ? 0 : 350);
    };
    if (document.readyState === "complete") finish();
    else window.addEventListener("load", finish);
    setTimeout(finish, 4000); // safety: never trap the user
  }

  /* ---------- Custom cursor ---------- */
  const cursorArrow = $("#cursorArrow");
  const cursorGlow = $("#cursorGlow");
  if (cursorArrow && cursorGlow && window.matchMedia("(pointer: fine)").matches) {
    const root = document.documentElement;
    root.classList.add("has-cursor");
    let mx = window.innerWidth / 2, my = window.innerHeight / 2, gx = mx, gy = my, active = false;

    window.addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
      if (!active) { active = true; root.classList.add("cursor-active"); }
      root.classList.remove("cursor-hidden");
      cursorArrow.style.transform = `translate(${mx - 2}px, ${my - 2}px)`; // arrow tip = hotspot
      if (reduceMotion) cursorGlow.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    });

    if (!reduceMotion) {
      const follow = () => {
        gx += (mx - gx) * 0.2; gy += (my - gy) * 0.2;
        cursorGlow.style.transform = `translate(${gx}px, ${gy}px) translate(-50%, -50%)`;
        requestAnimationFrame(follow);
      };
      requestAnimationFrame(follow);
    }

    window.addEventListener("mousedown", () => root.classList.add("cursor-down"));
    window.addEventListener("mouseup", () => root.classList.remove("cursor-down"));
    document.addEventListener("mouseleave", () => root.classList.add("cursor-hidden"));

    const interactiveSel = "a, button, input, textarea, select, label, summary, .kit__item, .showcase__tab, .opt";
    document.addEventListener("mouseover", (e) => { if (e.target.closest(interactiveSel)) root.classList.add("cursor-hover"); });
    document.addEventListener("mouseout", (e) => { if (e.target.closest(interactiveSel)) root.classList.remove("cursor-hover"); });
  }

  /* ---------- 3D product showcase ---------- */
  const box = $("#box3d");
  if (box) {
    const stage = $("#stage");
    const hint = $("#stageHint");
    const meta = $("#showcaseMeta");
    const orderBtn = $("#showcaseOrder");
    const tabs = $$(".showcase__tab");
    const products = [
      { who: "«незайманої»", title: "Для незайманої", price: "2 490", set: "Банний набір для незайманої — 2 490 грн",
        text: "Світла коробка з берези з лазерним гравіюванням. Усередині: дубовий віник, фетрова шапка, капці, рукавиця та рушник — на подушці з дубового листя." },
      { who: "«незайманого»", title: "Для незайманого", price: "2 490", set: "Банний набір для незайманого — 2 490 грн",
        text: "Темна коробка (тонований горіх) з гравіюванням. Той самий повний комплект для справжнього парильника — у стриманому чоловічому стилі." },
    ];

    let rxA = -18, ryA = -28, auto = true, dragging = false, lastX = 0, lastY = 0, raf = null, onScreen = true, resumeT;
    const apply = () => { box.style.transform = `rotateX(${rxA}deg) rotateY(${ryA}deg)`; };

    const loop = () => {
      if (auto && !dragging) ryA += 0.32;
      apply();
      raf = onScreen ? requestAnimationFrame(loop) : null;
    };
    const start = () => { if (raf === null && onScreen && !reduceMotion) raf = requestAnimationFrame(loop); };
    const stop = () => { if (raf !== null) { cancelAnimationFrame(raf); raf = null; } };
    apply();
    start();

    const onDown = (e) => {
      dragging = true; auto = false; clearTimeout(resumeT);
      lastX = e.clientX; lastY = e.clientY;
      stage.classList.add("is-dragging");
      if (hint) hint.style.opacity = "0";
      if (stage.setPointerCapture && e.pointerId != null) { try { stage.setPointerCapture(e.pointerId); } catch (_) {} }
    };
    const onMove = (e) => {
      if (!dragging) return;
      ryA += (e.clientX - lastX) * 0.4;
      rxA -= (e.clientY - lastY) * 0.4;
      rxA = Math.max(-82, Math.min(82, rxA));
      lastX = e.clientX; lastY = e.clientY;
      if (reduceMotion || raf === null) apply();
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      stage.classList.remove("is-dragging");
      resumeT = setTimeout(() => { auto = true; }, 2500);
    };
    stage.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    new IntersectionObserver((entries) => {
      onScreen = entries[0].isIntersecting;
      if (onScreen) start(); else stop();
    }, { threshold: 0 }).observe(stage);

    const selectProduct = (i) => {
      const prod = products[i];
      if (!prod) return;
      box.dataset.box = String(i);
      const whoEl = $(".box3d__who", box);
      if (whoEl) whoEl.textContent = prod.who;
      if (meta) meta.innerHTML =
        `<h3>Набір «${prod.title}»</h3><p>${prod.text}</p>` +
        `<div class="showcase__price">${prod.price} <small>грн</small></div>`;
      if (orderBtn) orderBtn.dataset.set = prod.set;
      tabs.forEach((t, ti) => { const on = ti === i; t.classList.toggle("is-active", on); t.setAttribute("aria-selected", String(on)); });
    };
    tabs.forEach((t) => t.addEventListener("click", () => selectProduct(parseInt(t.dataset.box, 10))));
  }
})();
