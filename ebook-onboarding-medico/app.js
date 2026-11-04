document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "cel_avellaneda_onboarding_progress_v1";
  const checkboxes = document.querySelectorAll(".study-checkbox");
  const progressBar = document.getElementById("study-progress-fill");
  const progressText = document.getElementById("study-progress-text");
  const resetBtn = document.getElementById("btn-reset-progress");
  const printBtn = document.getElementById("btn-print-ebook");
  const searchInput = document.getElementById("ebook-search");
  const searchCount = document.getElementById("search-results-count");
  const chapters = document.querySelectorAll(".chapter-card");
  const navLinks = document.querySelectorAll(".nav-list a");

  // Mobile Drawer Controls
  const sidebar = document.getElementById("ebook-sidebar");
  const backdrop = document.getElementById("sidebar-backdrop");
  const openDrawerBtn = document.getElementById("btn-open-drawer");
  const closeDrawerBtn = document.getElementById("btn-close-drawer");
  const mobileSearchBtn = document.getElementById("btn-mobile-search");

  function toggleDrawer(open) {
    if (!sidebar || !backdrop) return;
    if (open) {
      sidebar.classList.add("open");
      backdrop.classList.add("open");
    } else {
      sidebar.classList.remove("open");
      backdrop.classList.remove("open");
    }
  }

  if (openDrawerBtn) openDrawerBtn.addEventListener("click", () => toggleDrawer(true));
  if (closeDrawerBtn) closeDrawerBtn.addEventListener("click", () => toggleDrawer(false));
  if (backdrop) backdrop.addEventListener("click", () => toggleDrawer(false));
  navLinks.forEach((link) => {
    link.addEventListener("click", () => toggleDrawer(false));
  });
  if (mobileSearchBtn && searchInput) {
    mobileSearchBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => searchInput.focus(), 250);
    });
  }

  // 1. Load & Update Study Progress
  function loadProgress() {
    let saved = {};
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch (e) {
      saved = {};
    }
    checkboxes.forEach((cb) => {
      const id = cb.getAttribute("data-module-id");
      cb.checked = Boolean(saved[id]);
    });
    updateProgressUI();
  }

  function saveProgress() {
    const state = {};
    checkboxes.forEach((cb) => {
      const id = cb.getAttribute("data-module-id");
      state[id] = cb.checked;
    });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
    updateProgressUI();
  }

  function updateProgressUI() {
    const total = checkboxes.length;
    if (total === 0) return;
    let completed = 0;
    checkboxes.forEach((cb) => {
      if (cb.checked) completed++;
    });
    const pct = Math.round((completed / total) * 100);
    if (progressBar) progressBar.style.width = `${pct}%`;
    if (progressText) progressText.textContent = `${completed}/${total} módulos (${pct}%)`;
  }

  checkboxes.forEach((cb) => cb.addEventListener("change", saveProgress));

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      checkboxes.forEach((cb) => (cb.checked = false));
      saveProgress();
    });
  }

  loadProgress();

  // 2. Print / PDF Export
  if (printBtn) {
    printBtn.addEventListener("click", () => {
      toggleDrawer(false);
      window.print();
    });
  }

  // 3. Copy to Clipboard for Clinical Templates
  const copyButtons = document.querySelectorAll(".btn-copy");
  copyButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-copy-target");
      const targetEl = document.getElementById(targetId);
      if (!targetEl) return;
      const text = targetEl.innerText.trim();

      const markCopied = () => {
        const originalLabel = btn.textContent;
        btn.textContent = "✓ Copiado al portapapeles";
        btn.classList.add("copied");
        setTimeout(() => {
          btn.textContent = originalLabel;
          btn.classList.remove("copied");
        }, 2000);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(markCopied).catch(() => {
          fallbackCopy(text, markCopied);
        });
      } else {
        fallbackCopy(text, markCopied);
      }
    });
  });

  function fallbackCopy(text, callback) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      callback();
    } catch (e) {}
    document.body.removeChild(ta);
  }

  // 4. Interactive Clinical Calculators (Snellen, Epworth, STOP-BANG)
  const snellenSelect = document.getElementById("snellen-converter-select");
  const snellenOutput = document.getElementById("snellen-converter-output");
  const snellenMap = {
    "1.0": { frac: "10/10", feet: "20/20", logmar: "0.00", g1: "APTO Mejor Ojo", g2: "APTO Mejor Ojo (≥ 0,8)" },
    "0.9": { frac: "9/10", feet: "20/22", logmar: "0.05", g1: "APTO Mejor Ojo", g2: "APTO Mejor Ojo (≥ 0,8)" },
    "0.8": { frac: "8/10", feet: "20/25", logmar: "0.10", g1: "APTO (Corte Ojo Único Monocular)", g2: "APTO Corte Mínimo Mejor Ojo (0,8)" },
    "0.7": { frac: "7/10", feet: "20/28", logmar: "0.15", g1: "APTO Mejor Ojo", g2: "NO ALCANZA Mejor Ojo (sirve como peor ojo ≥ 0,5)" },
    "0.6": { frac: "6/10", feet: "20/32", logmar: "0.22", g1: "APTO Corte Mínimo Mejor Ojo (0,6)", g2: "NO ALCANZA Mejor Ojo (sirve como peor ojo ≥ 0,5)" },
    "0.5": { frac: "5/10", feet: "20/40", logmar: "0.30", g1: "APTO si ambos ojos ≥ 0,5", g2: "Corte Mínimo Peor Ojo (con mejor ojo ≥ 0,8)" },
    "0.4": { frac: "4/10", feet: "20/50", logmar: "0.40", g1: "Sirve solo como peor ojo (si mejor ojo ≥ 0,6)", g2: "NO APTO para Grupo 2" },
    "0.3": { frac: "3/10", feet: "20/63", logmar: "0.52", g1: "Sirve solo como peor ojo (si mejor ojo ≥ 0,6)", g2: "NO APTO para Grupo 2" },
    "0.2": { frac: "2/10", feet: "20/100", logmar: "0.70", g1: "Corte Mínimo Peor Ojo (con mejor ojo ≥ 0,6)", g2: "NO APTO para Grupo 2" },
    "0.1": { frac: "1/10", feet: "20/200", logmar: "1.00", g1: "Límite Visión Monocular (< 0,1 es monocular)", g2: "NO APTO Inhabilitante" }
  };

  if (snellenSelect && snellenOutput) {
    const updateSnellen = () => {
      const val = snellenSelect.value;
      const d = snellenMap[val];
      if (!d) return;
      snellenOutput.innerHTML = `
        <div><strong>Equivalencias:</strong> Decimal <code>${val}</code> = Fracción <code>${d.frac}</code> = Pies <code>${d.feet}</code> (LogMAR ${d.logmar})</div>
        <div><strong>Grupo 1 (A, B, G):</strong> ${d.g1}</div>
        <div><strong>Grupo 2 (C, D, E):</strong> ${d.g2}</div>
      `;
    };
    snellenSelect.addEventListener("change", updateSnellen);
    updateSnellen();
  }

  // Epworth & STOP-BANG
  const stopBangChecks = document.querySelectorAll(".stopbang-check");
  const stopBangResult = document.getElementById("stopbang-result");
  if (stopBangChecks.length && stopBangResult) {
    const updateStopBang = () => {
      let score = 0;
      stopBangChecks.forEach((c) => {
        if (c.checked) score++;
      });
      let badge = `<span class="badge badge-apto">Bajo Riesgo (${score}/8)</span>`;
      let conduct = "Sin sospecha clínica alta de SAOS. Continuar evaluación estándar.";
      if (score >= 3 && score <= 4) {
        badge = `<span class="badge badge-warn">Riesgo Intermedio (${score}/8)</span>`;
        conduct = "En choferes profesionales (Grupo 2) o si asocia somnolencia diurna (Epworth > 10), retener y solicitar evaluación neumonológica.";
      } else if (score >= 5) {
        badge = `<span class="badge badge-noapto">Alto Riesgo de SAOS Moderado/Severo (${score}/8)</span>`;
        conduct = "RETENER TRÁMITE: Solicitar interconsulta con Neumonología / Polisomnografía antes de otorgar aptitud.";
      }
      stopBangResult.innerHTML = `<div><strong>Puntaje STOP-BANG:</strong> ${badge}</div><div><strong>Conducta en CEL:</strong> ${conduct}</div>`;
    };
    stopBangChecks.forEach((c) => c.addEventListener("change", updateStopBang));
    updateStopBang();
  }

  // 5. Instant Search Filter across Chapters
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const query = searchInput.value.trim().toLowerCase();
      if (!query) {
        chapters.forEach((ch) => ch.classList.remove("hidden-by-search"));
        if (searchCount) searchCount.textContent = "9 capítulos disponibles";
        return;
      }

      let visibleCount = 0;
      chapters.forEach((ch) => {
        const content = ch.innerText.toLowerCase();
        if (content.includes(query)) {
          ch.classList.remove("hidden-by-search");
          visibleCount++;
        } else {
          ch.classList.add("hidden-by-search");
        }
      });

      if (searchCount) {
        searchCount.textContent =
          visibleCount === 1
            ? "1 capítulo coincide"
            : `${visibleCount} capítulos coinciden`;
      }
    });
  }

  // 6. Active Navigation Highlight on Scroll
  function updateActiveNav() {
    let currentId = "";
    const scrollPos = window.scrollY + 140;
    chapters.forEach((ch) => {
      if (ch.classList.contains("hidden-by-search")) return;
      if (ch.offsetTop <= scrollPos) {
        currentId = ch.getAttribute("id");
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove("active");
      const href = link.getAttribute("href");
      if (href === `#${currentId}`) {
        link.classList.add("active");
      }
    });
  }

  window.addEventListener("scroll", updateActiveNav, { passive: true });
  updateActiveNav();
});
