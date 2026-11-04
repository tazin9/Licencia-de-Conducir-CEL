document.addEventListener("DOMContentLoaded", () => {
  const SHIFT_STORAGE_KEY = "cel_avellaneda_shift_stats_v1";

  // ==========================================================================
  // 1. NAVEGACIÓN DE PESTAÑAS
  // ==========================================================================
  const tabButtons = document.querySelectorAll("[data-tab-target]");
  const tabPanels = document.querySelectorAll(".tab-panel");

  function switchTab(targetId) {
    tabPanels.forEach((panel) => {
      panel.classList.toggle("active", panel.id === targetId);
    });
    tabButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-tab-target") === targetId);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-tab-target");
      if (target) switchTab(target);
    });
  });

  // ==========================================================================
  // 2. CONTADOR COMPACTO DEL TURNO EN EL HEADER (LOCALSTORAGE)
  // ==========================================================================
  const kpiTotal = document.getElementById("kpi-total");
  const kpiBreakdown = document.getElementById("kpi-breakdown");
  const btnResetShift = document.getElementById("btn-reset-shift");
  const btnLogPatient = document.getElementById("btn-log-patient");

  function loadShiftStats() {
    try {
      const raw = localStorage.getItem(SHIFT_STORAGE_KEY);
      if (!raw) return { total: 0, apto: 0, warn: 0, retenido: 0, noapto: 0 };
      return JSON.parse(raw);
    } catch (e) {
      return { total: 0, apto: 0, warn: 0, retenido: 0, noapto: 0 };
    }
  }

  function saveShiftStats(stats) {
    try {
      localStorage.setItem(SHIFT_STORAGE_KEY, JSON.stringify(stats));
    } catch (e) {}
    renderShiftStats(stats);
  }

  function renderShiftStats(stats) {
    const total = stats.total || 0;
    const aptos = (stats.apto || 0) + (stats.warn || 0);
    const retNo = (stats.retenido || 0) + (stats.noapto || 0);
    if (kpiTotal) kpiTotal.textContent = total;
    if (kpiBreakdown) kpiBreakdown.textContent = `(${aptos}A · ${retNo}R)`;
  }

  renderShiftStats(loadShiftStats());

  if (btnResetShift) {
    btnResetShift.addEventListener("click", () => {
      if (confirm("¿Reiniciar el contador de postulantes atendidos en el turno de hoy?")) {
        saveShiftStats({ total: 0, apto: 0, warn: 0, retenido: 0, noapto: 0 });
      }
    });
  }

  // ==========================================================================
  // 3. CONTROLES DEL EVALUADOR Y GAVETAS COLAPSABLES ("MODO EXAMEN LIMPIO")
  // ==========================================================================
  const ptName = document.getElementById("pt-name");
  const ptDni = document.getElementById("pt-dni");
  const ptAge = document.getElementById("pt-age");
  const ptTramite = document.getElementById("pt-tramite");
  const subclassChecks = document.querySelectorAll('input[name="subclase"]');
  const chkDniVerificado = document.getElementById("chk-dni-verificado");
  const chkDdjjFirmada = document.getElementById("chk-ddjj-firmada");

  const avOd = document.getElementById("av-od");
  const avOi = document.getElementById("av-oi");
  const avCorreccion = document.getElementById("av-correccion");
  const visCampo = document.getElementById("vis-campo");
  const visEncandilamiento = document.getElementById("vis-encandilamiento");
  const audicionEstado = document.getElementById("audicion-estado");

  const taPas = document.getElementById("ta-pas");
  const taPad = document.getElementById("ta-pad");
  const locomotorEstado = document.getElementById("locomotor-estado");
  const adaptFChecks = document.querySelectorAll(".chk-adapt-f");

  const cardioEstado = document.getElementById("cardio-estado");
  const dbtEstado = document.getElementById("dbt-estado");
  const neuroEstado = document.getElementById("neuro-estado");
  const suenoMental = document.getElementById("sueno-mental");
  const relojEstado = document.getElementById("reloj-estado");
  const certEstado = document.getElementById("cert-estado");
  const boxCertificadoDatos = document.getElementById("box-certificado-datos");
  const certEspecialidad = document.getElementById("cert-especialidad");
  const certMedico = document.getElementById("cert-medico");
  const certResumen = document.getElementById("cert-resumen");

  // Gavetas minimalistas
  const toggleVisualExtra = document.getElementById("toggle-visual-extra");
  const toggleMotorExtra = document.getElementById("toggle-motor-extra");
  const toggleClinicoExtra = document.getElementById("toggle-clinico-extra");
  const lblToggleVisual = document.getElementById("lbl-toggle-visual");
  const lblToggleMotor = document.getElementById("lbl-toggle-motor");
  const lblToggleClinico = document.getElementById("lbl-toggle-clinico");
  const drawerVisual = document.getElementById("drawer-visual");
  const drawerMotor = document.getElementById("drawer-motor");
  const drawerClinico = document.getElementById("drawer-clinico");

  function syncDrawersUI() {
    if (drawerVisual && toggleVisualExtra) {
      drawerVisual.classList.toggle("open", toggleVisualExtra.checked);
      lblToggleVisual.classList.toggle("active-toggle", toggleVisualExtra.checked);
    }
    if (drawerMotor && toggleMotorExtra) {
      drawerMotor.classList.toggle("open", toggleMotorExtra.checked);
      lblToggleMotor.classList.toggle("active-toggle", toggleMotorExtra.checked);
    }
    if (drawerClinico && toggleClinicoExtra) {
      drawerClinico.classList.toggle("open", toggleClinicoExtra.checked);
      lblToggleClinico.classList.toggle("active-toggle", toggleClinicoExtra.checked);
    }
  }

  if (toggleVisualExtra) {
    toggleVisualExtra.addEventListener("change", () => {
      if (!toggleVisualExtra.checked) {
        visCampo.value = "normal";
        visEncandilamiento.value = "normal";
      }
      syncDrawersUI();
      evaluatePatient();
    });
  }

  if (toggleMotorExtra) {
    toggleMotorExtra.addEventListener("change", () => {
      if (!toggleMotorExtra.checked) {
        locomotorEstado.value = "conservado";
      } else if (locomotorEstado.value === "conservado") {
        locomotorEstado.value = "adaptado_f";
      }
      syncDrawersUI();
      evaluatePatient();
    });
  }

  if (toggleClinicoExtra) {
    toggleClinicoExtra.addEventListener("change", () => {
      if (!toggleClinicoExtra.checked) {
        cardioEstado.value = "normal";
        dbtEstado.value = "normal";
        neuroEstado.value = "normal";
        suenoMental.value = "normal";
        relojEstado.value = "normal";
        certEstado.value = "no_requiere";
      }
      syncDrawersUI();
      evaluatePatient();
    });
  }

  // Salidas del dictamen
  const verdictBanner = document.getElementById("verdict-banner");
  const verdictTitle = document.getElementById("verdict-title");
  const verdictSubtitle = document.getElementById("verdict-subtitle");
  const pillVigencia = document.getElementById("pill-vigencia");
  const pillRestricciones = document.getElementById("pill-restricciones");
  const dualEngineBox = document.getElementById("dual-engine-box");
  const dualG1Status = document.getElementById("dual-g1-status");
  const dualG2Status = document.getElementById("dual-g2-status");
  const verdictReasonsList = document.getElementById("verdict-reasons-list");
  const evolutionOutput = document.getElementById("evolution-output");

  let currentVerdictState = {
    category: "apto",
    suggestedSpecialty: "Cardiología",
    suggestedMotivo: ""
  };

  function fracFromDecimal(decStr) {
    const val = parseFloat(decStr);
    if (val <= 0) return "< 1/10";
    return `${Math.round(val * 10)}/10`;
  }

  // ==========================================================================
  // 4. MOTOR DE DECISIÓN DUAL (GRUPO 1 + GRUPO 2) Y EVOLUCIÓN SI.NA.LI.C.
  // ==========================================================================
  function evaluatePatient() {
    const name = (ptName.value || "").trim();
    const dni = (ptDni.value || "").trim();
    const age = parseInt(ptAge.value, 10) || 34;
    const tramite = ptTramite.value;

    const selectedG1 = [];
    const selectedG2 = [];
    let hasClassF = false;

    subclassChecks.forEach((cb) => {
      if (cb.checked) {
        if (cb.value === "F") hasClassF = true;
        if (cb.getAttribute("data-group") === "2") {
          selectedG2.push(cb.value);
        } else {
          selectedG1.push(cb.value);
        }
      }
    });

    // Auto-abrir gaveta motora si marca Clase F
    if (hasClassF && toggleMotorExtra && !toggleMotorExtra.checked) {
      toggleMotorExtra.checked = true;
      locomotorEstado.value = "adaptado_f";
    }

    // Auto-abrir gaveta visual si selecciona < 1/10 (Monocular)
    const od = parseFloat(avOd.value);
    const oi = parseFloat(avOi.value);
    if ((od <= 0 || oi <= 0) && toggleVisualExtra && !toggleVisualExtra.checked) {
      toggleVisualExtra.checked = true;
      if (visCampo.value === "normal") visCampo.value = "monocular_adaptado";
    }

    syncDrawersUI();

    if (boxCertificadoDatos) {
      boxCertificadoDatos.style.display = certEstado.value === "presenta_valido" ? "block" : "none";
    }

    const allSubclasses = [...selectedG1, ...selectedG2];
    const subclassesLabel = allSubclasses.length ? allSubclasses.join(", ") : "B1";
    const asksG1 = selectedG1.length > 0 || allSubclasses.length === 0;
    const asksG2 = selectedG2.length > 0;

    let maxMonthsG1 = 60;
    let maxMonthsG2 = 24;
    const reasons = [];
    const restrictions = [];

    if (age >= 70) {
      maxMonthsG1 = 12;
      maxMonthsG2 = 12;
      reasons.push({
        type: "info",
        text: `Edad ${age} años (≥ 70): Renovación anual (12m) y cribado cognitivo (Dto. 196/2025).`
      });
    } else if (age > 65) {
      maxMonthsG1 = 36;
      maxMonthsG2 = 12;
      reasons.push({
        type: "info",
        text: `Edad ${age} años (> 65): Vigencia máxima de 36 meses en Grupo 1 y anual en Grupo 2.`
      });
    }

    let statusG1 = "APTO";
    let statusG2 = "APTO";
    let suggestedSpecialty = "Cardiología";
    let suggestedMotivo = "";

    const upgradeStatus = (current, next) => {
      const order = { APTO: 0, APTO_RESTR: 1, RETENIDO: 2, NO_APTO: 3 };
      return order[next] > order[current] ? next : current;
    };

    // 1. Reglas de Edad Grupo 2
    if (asksG2 && age < 21) {
      statusG2 = upgradeStatus(statusG2, "NO_APTO");
      reasons.push({
        type: "danger",
        text: `Edad ${age} años (< 21): Inhabilitado para Clases Profesionales C, D y E (Ley 24.449 Art. 16).`
      });
    }
    if (asksG2 && age > 65 && tramite.includes("Original")) {
      statusG2 = upgradeStatus(statusG2, "NO_APTO");
      reasons.push({
        type: "danger",
        text: `Mayor de 65 años solicitando Licencia Profesional por primera vez (Original): No permitido.`
      });
    }

    // 2. Evaluación Visual (Ap. 15.1 Disp. 219/2025)
    const bestEye = Math.max(od, oi);
    const worstEye = Math.min(od, oi);
    const isMonocular = worstEye < 0.1 || visCampo.value.startsWith("monocular");

    if (avCorreccion.value === "olvido_lentes") {
      statusG1 = upgradeStatus(statusG1, "RETENIDO");
      statusG2 = upgradeStatus(statusG2, "RETENIDO");
      suggestedSpecialty = "Oftalmología";
      suggestedMotivo = `Agudeza visual sin corrección insuficiente en box (OD ${fracFromDecimal(od)} / OI ${fracFromDecimal(oi)}); concurre sin sus lentes`;
      reasons.push({
        type: "warn",
        text: `Ap. 10.4 / 15.1 Disp. 219/25: Olvidó sus lentes. Retener trámite hasta evaluar con corrección óptica.`
      });
    } else if (avCorreccion.value === "lentes_aereos" || avCorreccion.value === "lentes_contacto") {
      restrictions.push("Uso obligatorio de corrección óptica (lentes)");
      statusG1 = upgradeStatus(statusG1, "APTO_RESTR");
      statusG2 = upgradeStatus(statusG2, "APTO_RESTR");
    }

    if (visCampo.value === "diplopia_hemianopsia") {
      statusG1 = upgradeStatus(statusG1, "NO_APTO");
      statusG2 = upgradeStatus(statusG2, "NO_APTO");
      suggestedSpecialty = "Oftalmología";
      suggestedMotivo = "Alteración del campo visual binocular / diplopía activa";
      reasons.push({
        type: "danger",
        text: `Ap. 15.1 Disp. 219/25: Diplopía activa o hemianopsia son inhabilitantes.`
      });
    } else if (isMonocular) {
      statusG2 = upgradeStatus(statusG2, "NO_APTO");
      if (asksG2) {
        reasons.push({
          type: "danger",
          text: `Visión Monocular (Ap. 15.1 Disp. 219/25): INHABILITANTE para Grupo 2 Profesional (${selectedG2.join(", ")}).`
        });
      }
      if (visCampo.value === "monocular_reciente" || bestEye < 0.8) {
        statusG1 = upgradeStatus(statusG1, bestEye < 0.8 ? "NO_APTO" : "RETENIDO");
        suggestedSpecialty = "Oftalmología";
        suggestedMotivo = "Visión monocular: acreditar antigüedad ≥ 6 meses, AV ojo único ≥ 8/10 y campo visual normal";
        reasons.push({
          type: "danger",
          text: `Visión Monocular en Grupo 1 exige AV ≥ 8/10 en ojo único y ≥ 6 meses de adaptación con certificado oftalmológico.`
        });
      } else {
        statusG1 = upgradeStatus(statusG1, "APTO_RESTR");
        maxMonthsG1 = Math.min(maxMonthsG1, 36);
        restrictions.push("Espejos laterales panorámicos ambos lados + espejo interno panorámico + lentes protectores");
        reasons.push({
          type: "warn",
          text: `Visión Monocular compensada (ojo único ${fracFromDecimal(bestEye)} ≥ 8/10): Apto Grupo 1 con espejos panorámicos y protección ocular.`
        });
      }
    } else {
      const passesG1Vision = (bestEye >= 0.6 && worstEye >= 0.2) || (bestEye >= 0.5 && worstEye >= 0.5);
      if (!passesG1Vision) {
        statusG1 = upgradeStatus(statusG1, "RETENIDO");
        suggestedSpecialty = "Oftalmología";
        suggestedMotivo = `Agudeza visual inferior al corte de Grupo 1 (OD ${fracFromDecimal(od)} / OI ${fracFromDecimal(oi)})`;
        reasons.push({
          type: "danger",
          text: `No alcanza corte visual Grupo 1 (6/10 y 2/10). Retener y pedir interconsulta oftalmológica.`
        });
      }
      const passesG2Vision = bestEye >= 0.8 && worstEye >= 0.5;
      if (!passesG2Vision) {
        statusG2 = upgradeStatus(statusG2, "NO_APTO");
        if (asksG2) {
          suggestedSpecialty = "Oftalmología";
          suggestedMotivo = `Agudeza visual inferior al corte de Grupo 2 Profesional 8/10 y 5/10 (OD ${fracFromDecimal(od)} / OI ${fracFromDecimal(oi)})`;
          reasons.push({
            type: "danger",
            text: `No alcanza corte visual Grupo 2 Profesional (exige mínimo 8/10 en mejor ojo y 5/10 en peor ojo).`
          });
        }
      }
    }

    if (visEncandilamiento.value === "catarata_no_operada") {
      statusG1 = upgradeStatus(statusG1, "RETENIDO");
      statusG2 = upgradeStatus(statusG2, "RETENIDO");
      suggestedSpecialty = "Oftalmología";
      suggestedMotivo = "Alteración al encandilamiento / catarata activa";
      reasons.push({
        type: "warn",
        text: `Intolerancia al encandilamiento / catarata activa: Retener y derivar a Oftalmología.`
      });
    }

    // 3. Audición (Disp. 300/2025)
    if (audicionEstado.value === "otoamplifono") {
      statusG1 = upgradeStatus(statusG1, "APTO_RESTR");
      statusG2 = upgradeStatus(statusG2, "APTO_RESTR");
      restrictions.push("Uso obligatorio de otoamplífono (audífono)");
    } else if (audicionEstado.value === "hipoacusia_severa") {
      statusG1 = upgradeStatus(statusG1, "APTO_RESTR");
      statusG2 = upgradeStatus(statusG2, "NO_APTO");
      restrictions.push("Espejos laterales convexos duales + interno panorámico (Disp. 300/25)");
      reasons.push({
        type: "warn",
        text: `Disp. ANSV 300/2025: Hipoacusia severa/anacusia habilita Grupo 1 con espejos panorámicos; No Apto Grupo 2.`
      });
    } else if (audicionEstado.value === "hipoacusia_sin_estudio") {
      statusG1 = upgradeStatus(statusG1, "RETENIDO");
      statusG2 = upgradeStatus(statusG2, "RETENIDO");
      suggestedSpecialty = "Otorrinolaringología / Audiología";
      suggestedMotivo = "Déficit auditivo en consultorio sin equipamiento ni audiometría";
      reasons.push({
        type: "warn",
        text: `Disp. ANSV 300/2025: Hipoacusia sin audífono en el acto. Retener y solicitar audiometría.`
      });
    }

    // 4. Tensión Arterial y Locomotor
    const pas = parseInt(taPas.value, 10) || 120;
    const pad = parseInt(taPad.value, 10) || 80;
    if (pas >= 180 || pad >= 110) {
      statusG1 = upgradeStatus(statusG1, "RETENIDO");
      statusG2 = upgradeStatus(statusG2, "RETENIDO");
      suggestedSpecialty = "Cardiología";
      suggestedMotivo = `Hipertensión arterial severa constatada en box (TA ${pas}/${pad} mmHg)`;
      reasons.push({
        type: "danger",
        text: `TA en box ${pas}/${pad} mmHg (≥ 180/110): RETENER TRÁMITE y solicitar evaluación cardiológica.`
      });
    }

    if (locomotorEstado.value === "adaptado_f" || hasClassF) {
      statusG1 = upgradeStatus(statusG1, "APTO_RESTR");
      statusG2 = upgradeStatus(statusG2, "NO_APTO");
      const chosenAdapts = [];
      adaptFChecks.forEach((c) => {
        if (c.checked) chosenAdapts.push(c.value);
      });
      const adaptText = chosenAdapts.length ? chosenAdapts.join(" + ") : "Adaptación homologada Clase F";
      restrictions.push(`Vehículo Adaptado (Clase F): ${adaptText}`);
      reasons.push({
        type: "warn",
        text: `Ap. 15.6 Disp. 219/25: Apto Grupo 1 con adaptación técnica (${adaptText}) y prueba funcional.`
      });
    } else if (locomotorEstado.value === "deficit_agudo") {
      statusG1 = upgradeStatus(statusG1, "RETENIDO");
      statusG2 = upgradeStatus(statusG2, "RETENIDO");
      reasons.push({
        type: "warn",
        text: `Inmovilización / posoperatorio agudo: No Apto Transitorio (Retener).`
      });
    } else if (locomotorEstado.value === "deficit_severo") {
      statusG1 = upgradeStatus(statusG1, "NO_APTO");
      statusG2 = upgradeStatus(statusG2, "NO_APTO");
      reasons.push({
        type: "danger",
        text: `Déficit osteomioarticular severo no compensable: No Apto.`
      });
    }

    // 5. Patologías Crónicas y Cribado Cognitivo
    let requiresSpecialistCert = false;

    if (cardioEstado.value === "cardio_compensada") {
      requiresSpecialistCert = true;
      maxMonthsG1 = Math.min(maxMonthsG1, 24);
      maxMonthsG2 = Math.min(maxMonthsG2, 12);
      statusG1 = upgradeStatus(statusG1, "APTO_RESTR");
      statusG2 = upgradeStatus(statusG2, "APTO_RESTR");
      suggestedSpecialty = "Cardiología";
      suggestedMotivo = "Antecedente cardiovascular compensado (informar FEVI y NYHA I)";
    } else if (cardioEstado.value === "nyha_ii") {
      requiresSpecialistCert = true;
      maxMonthsG1 = Math.min(maxMonthsG1, 12);
      statusG1 = upgradeStatus(statusG1, "APTO_RESTR");
      statusG2 = upgradeStatus(statusG2, "NO_APTO");
      suggestedSpecialty = "Cardiología";
      suggestedMotivo = "Insuficiencia Cardíaca Clase Funcional NYHA II";
      reasons.push({
        type: "danger",
        text: `Insuf. Cardíaca NYHA II: Apto anual Grupo 1 con informe; NO APTO Grupo 2 Profesional.`
      });
    } else if (cardioEstado.value === "marcapasos") {
      requiresSpecialistCert = true;
      maxMonthsG1 = Math.min(maxMonthsG1, 24);
      maxMonthsG2 = Math.min(maxMonthsG2, 12);
      statusG1 = upgradeStatus(statusG1, "APTO_RESTR");
      statusG2 = upgradeStatus(statusG2, "APTO_RESTR");
      suggestedSpecialty = "Cardiología";
      suggestedMotivo = "Portador de Marcapasos (adjuntar control de telemetría)";
    } else if (cardioEstado.value === "cdi") {
      requiresSpecialistCert = true;
      maxMonthsG1 = Math.min(maxMonthsG1, 12);
      statusG1 = upgradeStatus(statusG1, "APTO_RESTR");
      statusG2 = upgradeStatus(statusG2, "NO_APTO");
      suggestedSpecialty = "Cardiología";
      suggestedMotivo = "Portador de Cardiodesfibrilador Implantable (CDI) — ≥ 6 meses sin descargas";
      reasons.push({
        type: "danger",
        text: `Portador de CDI (Ap. 15.7): INHABILITANTE para Grupo 2 Profesional. Apto anual en Grupo 1 (≥ 6m sin descargas).`
      });
    } else if (cardioEstado.value === "cardio_descompensada") {
      statusG1 = upgradeStatus(statusG1, "NO_APTO");
      statusG2 = upgradeStatus(statusG2, "NO_APTO");
      suggestedSpecialty = "Cardiología";
      reasons.push({
        type: "danger",
        text: `Cardiopatía NYHA III–IV o síncope activo: NO APTO.`
      });
    }

    if (dbtEstado.value === "dbt_oral") {
      requiresSpecialistCert = true;
      maxMonthsG1 = Math.min(maxMonthsG1, 36);
      maxMonthsG2 = Math.min(maxMonthsG2, 12);
      statusG1 = upgradeStatus(statusG1, "APTO_RESTR");
      statusG2 = upgradeStatus(statusG2, "APTO_RESTR");
      suggestedSpecialty = "Endocrinología / Diabetología";
      suggestedMotivo = "Diabetes Mellitus Tipo 2 en tratamiento oral";
    } else if (dbtEstado.value === "dbt_insulina") {
      requiresSpecialistCert = true;
      maxMonthsG1 = Math.min(maxMonthsG1, 24);
      statusG1 = upgradeStatus(statusG1, "APTO_RESTR");
      statusG2 = upgradeStatus(statusG2, "NO_APTO");
      suggestedSpecialty = "Endocrinología / Diabetología";
      suggestedMotivo = "Diabetes Insulino-Tratada (acreditar HbA1c y 0 hipoglucemias severas en 12 meses)";
      reasons.push({
        type: "warn",
        text: `Diabetes c/ Insulina (Ap. 15.9): Apto Grupo 1 con vigencia reducida (12–24m) e informe; NO APTO en regla general para Grupo 2.`
      });
    } else if (dbtEstado.value === "dbt_descompensada") {
      statusG1 = upgradeStatus(statusG1, "RETENIDO");
      statusG2 = upgradeStatus(statusG2, "NO_APTO");
      suggestedSpecialty = "Endocrinología / Diabetología";
      reasons.push({
        type: "danger",
        text: `Diabetes descompensada o hipoglucemia severa reciente: Impide otorgar el apto.`
      });
    }

    if (neuroEstado.value === "epilepsia_controlada") {
      requiresSpecialistCert = true;
      maxMonthsG1 = Math.min(maxMonthsG1, 12);
      statusG1 = upgradeStatus(statusG1, "APTO_RESTR");
      statusG2 = upgradeStatus(statusG2, "NO_APTO");
      suggestedSpecialty = "Neurología";
      suggestedMotivo = "Epilepsia en remisión (acreditar ≥ 12 meses sin crisis y EEG)";
      reasons.push({
        type: "danger",
        text: `Epilepsia ≥ 12m sin crisis (Ap. 15.8): Apto anual en Grupo 1; NO APTO para Grupo 2 Profesional.`
      });
    } else if (neuroEstado.value === "epilepsia_activa" || neuroEstado.value === "neuro_severo") {
      statusG1 = upgradeStatus(statusG1, "NO_APTO");
      statusG2 = upgradeStatus(statusG2, "NO_APTO");
      suggestedSpecialty = "Neurología";
      reasons.push({
        type: "danger",
        text: `Crisis convulsiva en los últimos 12 meses o déficit neurológico activo: NO APTO.`
      });
    } else if (neuroEstado.value === "neuro_estable") {
      requiresSpecialistCert = true;
      maxMonthsG1 = Math.min(maxMonthsG1, 12);
      statusG1 = upgradeStatus(statusG1, "APTO_RESTR");
      statusG2 = upgradeStatus(statusG2, "NO_APTO");
      suggestedSpecialty = "Neurología";
      suggestedMotivo = "Secuela neurológica / Parkinson leve compensado";
    }

    if (suenoMental.value === "saos_cpap") {
      requiresSpecialistCert = true;
      maxMonthsG1 = Math.min(maxMonthsG1, 24);
      maxMonthsG2 = Math.min(maxMonthsG2, 12);
      statusG1 = upgradeStatus(statusG1, "APTO_RESTR");
      statusG2 = upgradeStatus(statusG2, "APTO_RESTR");
      suggestedSpecialty = "Neumonología / Medicina del Sueño";
      suggestedMotivo = "SAOS en tratamiento con CPAP (reporte de adherencia)";
    } else if (suenoMental.value === "saos_sospecha") {
      statusG1 = upgradeStatus(statusG1, "RETENIDO");
      statusG2 = upgradeStatus(statusG2, "RETENIDO");
      suggestedSpecialty = "Neumonología / Medicina del Sueño";
      suggestedMotivo = "Sospecha clínica de Apnea del Sueño (SAOS) — Solicitud de Polisomnografía";
      reasons.push({
        type: "danger",
        text: `Sospecha alta de SAOS sin estudio: RETENER y solicitar Polisomnografía.`
      });
    } else if (suenoMental.value === "psicofarmaco_estable") {
      requiresSpecialistCert = true;
      maxMonthsG1 = Math.min(maxMonthsG1, 12);
      statusG1 = upgradeStatus(statusG1, "APTO_RESTR");
      statusG2 = upgradeStatus(statusG2, "NO_APTO");
      suggestedSpecialty = "Psiquiatría / Salud Mental";
      suggestedMotivo = "Tratamiento psicofarmacológico estable sin sedación";
    } else if (suenoMental.value === "psicofarmaco_sedante") {
      statusG1 = upgradeStatus(statusG1, "NO_APTO");
      statusG2 = upgradeStatus(statusG2, "NO_APTO");
      suggestedSpecialty = "Psiquiatría / Salud Mental";
      reasons.push({
        type: "danger",
        text: `Efecto sedativo activo o descompensación psíquica (Ley PBA 15.402): NO APTO.`
      });
    }

    if (relojEstado.value === "patologico") {
      statusG1 = upgradeStatus(statusG1, "RETENIDO");
      statusG2 = upgradeStatus(statusG2, "NO_APTO");
      suggestedSpecialty = "Neurología";
      suggestedMotivo = "Test del Reloj alterado en consultorio (≤ 6/10 pts) — Valoración neurocognitiva";
      reasons.push({
        type: "danger",
        text: `Test del Reloj ≤ 6/10 pts: RETENER TRÁMITE, abrochar dibujo al FUT y pedir Neurología + Psicología.`
      });
    }

    if (requiresSpecialistCert && certEstado.value === "falta_certificado") {
      if (statusG1 !== "NO_APTO") statusG1 = "RETENIDO";
      if (statusG2 !== "NO_APTO") statusG2 = "RETENIDO";
      reasons.push({
        type: "danger",
        text: `Falta certificado actualizado de especialista (≤ 30 días) con parámetros objetivos: RETENER TRÁMITE.`
      });
    }

    if (!chkDniVerificado.checked || !chkDdjjFirmada.checked) {
      statusG1 = upgradeStatus(statusG1, "RETENIDO");
      statusG2 = upgradeStatus(statusG2, "RETENIDO");
      reasons.push({
        type: "danger",
        text: `Art. 293 CP: Verificar DNI y firma presencial de DDJJ antes de validar.`
      });
    }

    // Mostrar comparativa dual solo cuando selecciona Grupo 1 y Grupo 2 al mismo tiempo
    if (dualEngineBox) {
      dualEngineBox.classList.toggle("visible", asksG1 && asksG2);
    }

    const formatShortStatus = (st, m) => {
      if (st === "APTO") return `✅ APTO (${m}m)`;
      if (st === "APTO_RESTR") return `⚠️ APTO C/ COND. (${m}m)`;
      if (st === "RETENIDO") return `⏸️ RETENIDO`;
      return `⛔ NO APTO`;
    };

    if (dualG1Status) dualG1Status.textContent = `${formatShortStatus(statusG1, maxMonthsG1)} [${selectedG1.join(", ") || "B1"}]`;
    if (dualG2Status) dualG2Status.textContent = `${formatShortStatus(statusG2, maxMonthsG2)} [${selectedG2.join(", ")}]`;

    let bannerClass = "";
    let mainTitle = "";
    let mainSubtitle = "";
    let effectiveMonths = asksG2 && statusG2 !== "NO_APTO" ? Math.min(maxMonthsG1, maxMonthsG2) : maxMonthsG1;

    const isDualSplit =
      asksG1 &&
      asksG2 &&
      (statusG1 === "APTO" || statusG1 === "APTO_RESTR") &&
      statusG2 === "NO_APTO";

    if (isDualSplit) {
      bannerClass = "status-warn";
      currentVerdictState.category = "warn";
      mainTitle = `APTO GRUPO 1 (${selectedG1.join(", ")}) / NO APTO GRUPO 2 (${selectedG2.join(", ")})`;
      mainSubtitle = `Habilitado para categoría particular, pero inhabilitado para licencia profesional por Baremo ANSV 219/2025.`;
    } else {
      let worstRequested = "APTO";
      if (asksG1) worstRequested = upgradeStatus(worstRequested, statusG1);
      if (asksG2) worstRequested = upgradeStatus(worstRequested, statusG2);

      if (worstRequested === "APTO" && effectiveMonths === 60 && restrictions.length === 0) {
        bannerClass = "";
        currentVerdictState.category = "apto";
        mainTitle = `APTO SIN RESTRICCIONES (${subclassesLabel})`;
        mainSubtitle = `Cumple el 100% de los parámetros de las Disposiciones ANSV 219/2025 y 300/2025.`;
      } else if (worstRequested === "APTO" || worstRequested === "APTO_RESTR") {
        bannerClass = "status-warn";
        currentVerdictState.category = "warn";
        const hasReducedVig = (asksG1 && maxMonthsG1 < 60 && age < 65) || requiresSpecialistCert;
        mainTitle =
          restrictions.length > 0 && hasReducedVig
            ? `APTO C/ RESTRICCIÓN Y VIG. REDUCIDA (${effectiveMonths}m)`
            : restrictions.length > 0
            ? `APTO CON RESTRICCIÓN (${subclassesLabel})`
            : `APTO VIGENCIA CONTROLADA (${effectiveMonths}m)`;
        mainSubtitle = `Registrar restricciones y/o tope de validez en el sistema Si.Na.Li.C.`;
      } else if (worstRequested === "RETENIDO") {
        bannerClass = "status-info";
        currentVerdictState.category = "info";
        mainTitle = `TRÁMITE RETENIDO / INTERCONSULTA`;
        mainSubtitle = `Pausar trámite (Ap. 10.4 / 10.5 Disp. 219/25) y solicitar informe a ${suggestedSpecialty}.`;
      } else {
        bannerClass = "status-noapto";
        currentVerdictState.category = "noapto";
        mainTitle = `NO APTO PARA CLASE ${subclassesLabel}`;
        mainSubtitle = `No alcanza el corte del Baremo ANSV (Ap. 10.6). Informar derecho a Junta Médica Provincial.`;
      }
    }

    currentVerdictState.suggestedSpecialty = suggestedSpecialty;
    currentVerdictState.suggestedMotivo = suggestedMotivo;

    if (verdictBanner) verdictBanner.className = `verdict-banner ${bannerClass}`.trim();
    if (verdictTitle) verdictTitle.textContent = mainTitle;
    if (verdictSubtitle) verdictSubtitle.textContent = mainSubtitle;
    if (pillVigencia) pillVigencia.textContent = `⏳ Vigencia: ${effectiveMonths} meses`;
    if (pillRestricciones) {
      pillRestricciones.textContent = restrictions.length
        ? `🔒 ${restrictions.join(" · ")}`
        : "🔒 Sin restricciones";
    }

    if (reasons.length === 0) {
      reasons.push({
        type: "info",
        text: `Visión (OD ${fracFromDecimal(od)} / OI ${fracFromDecimal(oi)}), audición, TA (${pas}/${pad} mmHg) y motricidad normales.`
      });
    }

    if (verdictReasonsList) {
      verdictReasonsList.innerHTML = reasons
        .map((r) => {
          const cls = r.type === "danger" ? "reason-danger" : r.type === "warn" ? "reason-warn" : "";
          return `<li class="${cls}">${r.text}</li>`;
        })
        .join("");
    }

    // Redacción automática de la Evolución Pericial
    const todayStr = new Date().toLocaleDateString("es-AR");
    const identPrefix =
      name || dni
        ? `Postulante ${name ? name : ""}${dni ? ` (DNI ${dni})` : ""}, ${age} años, concurre con DNI vigente (${tramite} Clase [${subclassesLabel}]). `
        : `Postulante de ${age} años concurre con DNI vigente (${tramite} Clase [${subclassesLabel}]). `;

    const corrLabel =
      avCorreccion.value === "lentes_aereos"
        ? "con corrección óptica (anteojos)"
        : avCorreccion.value === "lentes_contacto"
        ? "con lentes de contacto"
        : "sin corrección óptica";

    const baseExamText = `Suscribe DDJJ en mi presencia. Examen clínico y osteomioarticular conservado (TA ${pas}/${pad} mmHg). Evaluación visual (Ap. 15.1 Disp. 219/2025): AV OD ${fracFromDecimal(od)} / OI ${fracFromDecimal(oi)} ${corrLabel}, campo visual y respuesta al encandilamiento evaluados. Audición (Disp. 300/2025): ${audicionEstado.options[audicionEstado.selectedIndex].text}. `;

    let certAttachmentText = "";
    if (certEstado.value === "presenta_valido") {
      const esp = (certEspecialidad.value || suggestedSpecialty).trim();
      const med = (certMedico.value || "Especialista matriculado").trim();
      const res = (certResumen.value || "paciente clínicamente compensado y sin episodios agudos").trim();
      certAttachmentText = `Aporta certificado de especialista en ${esp} (${med}: ${res}), que se sella y adjunta al legajo (${todayStr}). `;
    }

    let closingDictamen = "";
    if (isDualSplit) {
      closingDictamen = `DICTAMEN DESDOBLADO (Disp. ANSV 219/2025): 1) APTO ${restrictions.length ? `CON RESTRICCIONES (${restrictions.join("; ")})` : ""} para Grupo 1 [${selectedG1.join(", ")}] por ${maxMonthsG1} meses. 2) NO APTO para Grupo 2 Profesional [${selectedG2.join(", ")}] conforme Baremo Nacional, notificándose derecho a Junta Médica Provincial.`;
    } else if (currentVerdictState.category === "apto") {
      closingDictamen = `Vigil y orientado globalmente. Cumple Baremo ANSV (Disp. 219/2025 y 300/2025). DICTAMEN: APTO Clase [${subclassesLabel}] (${effectiveMonths} meses).`;
    } else if (currentVerdictState.category === "warn") {
      const restrStr = restrictions.length ? ` Restricción: ${restrictions.join(" + ")}.` : "";
      closingDictamen = `Cumple Baremo ANSV (Disp. 219/2025 y 300/2025) bajo control evolutivo. DICTAMEN: APTO ${restrictions.length ? "CON RESTRICCIÓN" : "CON VIGENCIA CONTROLADA"} Clase [${subclassesLabel}] por ${effectiveMonths} meses.${restrStr}`;
    } else if (currentVerdictState.category === "info") {
      closingDictamen = `SE RETIENE TRÁMITE / PENDIENTE DE APTITUD (Ap. 10.4 / 10.5 Disp. ANSV 219/2025) por constatarse [${suggestedMotivo || "hallazgo clínico a evaluar"}]. Se solicita informe objetivo por especialista en ${suggestedSpecialty}.`;
    } else {
      closingDictamen = `DICTAMEN: NO APTO para Clase [${subclassesLabel}] (Ap. 10.6 y 11 Disp. ANSV 219/2025). No alcanza los parámetros mínimos del Baremo Nacional. Se notifica derecho a Junta Médica Provincial (Dto. 532/09 Anexo II).`;
    }

    if (evolutionOutput) {
      evolutionOutput.value = `${identPrefix}${baseExamText}${certAttachmentText}${closingDictamen}`;
    }

    renderPrintableSheet();
  }

  const allEvalInputs = document.querySelectorAll("#tab-evaluador input, #tab-evaluador select");
  allEvalInputs.forEach((el) => {
    if (el.id === "preset-selector") return;
    el.addEventListener("input", evaluatePatient);
    el.addEventListener("change", evaluatePatient);
  });

  // Botón de Copiar Evolución
  const btnCopyEvolution = document.getElementById("btn-copy-evolution");
  if (btnCopyEvolution && evolutionOutput) {
    btnCopyEvolution.addEventListener("click", () => {
      const text = evolutionOutput.value.trim();
      if (!text) return;
      const done = () => {
        const orig = btnCopyEvolution.textContent;
        btnCopyEvolution.textContent = "✓ Copiado al Portapapeles";
        btnCopyEvolution.classList.add("copied");
        setTimeout(() => {
          btnCopyEvolution.textContent = orig;
          btnCopyEvolution.classList.remove("copied");
        }, 2000);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done);
      } else {
        evolutionOutput.select();
        document.execCommand("copy");
        done();
      }
    });
  }

  // Botón Sumar al Turno
  if (btnLogPatient) {
    btnLogPatient.addEventListener("click", () => {
      const stats = loadShiftStats();
      stats.total = (stats.total || 0) + 1;
      if (currentVerdictState.category === "apto") stats.apto = (stats.apto || 0) + 1;
      else if (currentVerdictState.category === "warn") stats.warn = (stats.warn || 0) + 1;
      else if (currentVerdictState.category === "info") stats.retenido = (stats.retenido || 0) + 1;
      else stats.noapto = (stats.noapto || 0) + 1;
      saveShiftStats(stats);

      const orig = btnLogPatient.textContent;
      btnLogPatient.textContent = "✓ Sumado";
      setTimeout(() => {
        btnLogPatient.textContent = orig;
      }, 1400);
    });
  }

  // ==========================================================================
  // 5. SELECTOR COMPACTO DE CASOS RÁPIDOS Y BOTÓN LIMPIAR
  // ==========================================================================
  function resetFormToDefault() {
    ptName.value = "";
    ptDni.value = "";
    ptAge.value = "34";
    ptTramite.value = "Renovación";
    subclassChecks.forEach((cb) => {
      cb.checked = cb.value === "B1";
    });
    chkDniVerificado.checked = true;
    chkDdjjFirmada.checked = true;
    avOd.value = "1.0";
    avOi.value = "1.0";
    avCorreccion.value = "sin_correccion";
    visCampo.value = "normal";
    visEncandilamiento.value = "normal";
    audicionEstado.value = "conservada";
    taPas.value = "120";
    taPad.value = "80";
    locomotorEstado.value = "conservado";
    cardioEstado.value = "normal";
    dbtEstado.value = "normal";
    neuroEstado.value = "normal";
    suenoMental.value = "normal";
    relojEstado.value = "normal";
    certEstado.value = "no_requiere";
    certEspecialidad.value = "";
    certMedico.value = "";
    certResumen.value = "";
    if (toggleVisualExtra) toggleVisualExtra.checked = false;
    if (toggleMotorExtra) toggleMotorExtra.checked = false;
    if (toggleClinicoExtra) toggleClinicoExtra.checked = false;
    syncDrawersUI();
  }

  const presetSelector = document.getElementById("preset-selector");
  if (presetSelector) {
    presetSelector.addEventListener("change", () => {
      const preset = presetSelector.value;
      if (!preset) return;
      resetFormToDefault();

      if (preset === "lentes_b1") {
        avOd.value = "0.8";
        avOi.value = "0.7";
        avCorreccion.value = "lentes_aereos";
      } else if (preset === "monocular_dual") {
        ptAge.value = "42";
        subclassChecks.forEach((cb) => {
          cb.checked = cb.value === "B1" || cb.value === "D1";
        });
        avOd.value = "0.9";
        avOi.value = "0.0";
        avCorreccion.value = "lentes_aereos";
        toggleVisualExtra.checked = true;
        visCampo.value = "monocular_adaptado";
        toggleClinicoExtra.checked = true;
        certEstado.value = "presenta_valido";
        certEspecialidad.value = "Oftalmología";
        certMedico.value = "Dr. Funes MP 221400";
        certResumen.value = "Monocular > 6m adaptación, AV OD 9/10 y CV normal";
      } else if (preset === "hta_box") {
        ptAge.value = "58";
        taPas.value = "186";
        taPad.value = "112";
      } else if (preset === "dbt_insulina") {
        ptAge.value = "49";
        toggleClinicoExtra.checked = true;
        dbtEstado.value = "dbt_insulina";
        certEstado.value = "presenta_valido";
        certEspecialidad.value = "Endocrinología";
        certMedico.value = "Dra. Sosa MP 118920";
        certResumen.value = "DBT 1 compensada, HbA1c 6.9%, 0 hipoglucemias severas en 12m";
      } else if (preset === "adulto_mayor_75") {
        ptAge.value = "76";
        toggleClinicoExtra.checked = true;
        relojEstado.value = "patologico";
      } else if (preset === "cdi_profesional") {
        ptAge.value = "54";
        subclassChecks.forEach((cb) => {
          cb.checked = cb.value === "B1" || cb.value === "C1";
        });
        toggleClinicoExtra.checked = true;
        cardioEstado.value = "cdi";
        certEstado.value = "presenta_valido";
        certEspecialidad.value = "Cardiología";
        certMedico.value = "Dr. Pereyra MP 112045";
        certResumen.value = "CDI normofuncionante, > 9 meses sin descargas";
      }

      presetSelector.value = "";
      evaluatePatient();
    });
  }

  const btnNewPatient = document.getElementById("btn-new-patient");
  if (btnNewPatient) {
    btnNewPatient.addEventListener("click", () => {
      resetFormToDefault();
      evaluatePatient();
    });
  }

  // ==========================================================================
  // 6. PESTAÑA 2: BUSCADOR DE BAREMOS EN 2 SEGUNDOS
  // ==========================================================================
  const BAREMO_DB = [
    {
      title: "Agudeza Visual Binocular (Cortes Snellen)",
      cat: "Visual",
      keywords: "vision agudeza visual snellen lentes anteojos 0.6 0.8 6/10 8/10",
      g1: "Mínimo 6/10 (0,6) en mejor ojo y 2/10 (0,2) en peor ojo (o ≥ 0,5 AO).",
      g2: "Mínimo 8/10 (0,8) en mejor ojo y 5/10 (0,5) en peor ojo.",
      req: "Si usa lentes para alcanzar el corte, tildar 'Con corrección óptica'. Si olvidó los lentes, RETENER.",
      link: "../Normativa%20y%20Manuales%20de%20la%20Agencia%20Nacional%20de%20Seguridad%20Vial%20(ANSV)/Disposicion_ANSV_219_2025_Manual_y_Baremos_Psicofisicos_norma.htm#baremo-visual",
      normaLabel: "Ap. 15.1 Disp. 219/2025"
    },
    {
      title: "Visión Monocular (AV < 1/10 en un ojo)",
      cat: "Visual",
      keywords: "monocular ojo unico amaurosis espejos panoramicos",
      g1: "APTO C/ RESTRICCIÓN si ≥ 6 meses de adaptación, ojo único ≥ 8/10 (0,8) y CV normal certificado.",
      g2: "NO APTO (Inhabilitante absoluto para Clases C, D y E).",
      req: "Imponer en Grupo 1: 2 espejos laterales panorámicos + interno panorámico + lentes protectores.",
      link: "../Normativa%20y%20Manuales%20de%20la%20Agencia%20Nacional%20de%20Seguridad%20Vial%20(ANSV)/Disposicion_ANSV_219_2025_Manual_y_Baremos_Psicofisicos_norma.htm#baremo-visual",
      normaLabel: "Ap. 15.1 Disp. 219/2025"
    },
    {
      title: "Diplopía, Estrabismo y Hemianopsias",
      cat: "Visual",
      keywords: "diplopia vision doble estrabismo hemianopsia campo visual",
      g1: "Diplopía activa o hemianopsia: NO APTO (salvo diplopía ocluida ≥ 6m como monocular).",
      g2: "NO APTO absoluto toda diplopía o defecto campimétrico.",
      req: "Ante duda en confrontación, retener y pedir Campo Visual Computadorizado.",
      link: "../Normativa%20y%20Manuales%20de%20la%20Agencia%20Nacional%20de%20Seguridad%20Vial%20(ANSV)/Disposicion_ANSV_219_2025_Manual_y_Baremos_Psicofisicos_norma.htm#baremo-visual",
      normaLabel: "Ap. 15.1 Disp. 219/2025"
    },
    {
      title: "Hipoacusia, Anacusia y Otoamplífono",
      cat: "Auditivo",
      keywords: "audicion sordera hipoacusia anacusia audifono otoamplifono 300/2025",
      g1: "Con audífono: Apto c/ restricción. Anacusia bilateral: Apto A y B con espejos laterales convexos + interno panorámico.",
      g2: "Con audífono alcanzando umbral: Apto c/ control. Anacusia / hipoacusia profunda: NO APTO en D y E.",
      req: "Regido por la Disposición ANSV 300/2025.",
      link: "../Normativa%20y%20Manuales%20de%20la%20Agencia%20Nacional%20de%20Seguridad%20Vial%20(ANSV)/Disposicion_ANSV_300_2025_Baremo_Capacidad_Auditiva_norma.htm",
      normaLabel: "Disp. ANSV 300/2025"
    },
    {
      title: "Hipertensión Arterial en Box (≥ 180/110 mmHg)",
      cat: "Cardiovascular",
      keywords: "hipertension presion alta hta 180 110 ta",
      g1: "Si en box presenta TA ≥ 180/110 mmHg: RETENER TRÁMITE.",
      g2: "Si TA ≥ 180/110 mmHg o daño descompensado: RETENER.",
      req: "Derivar para estabilización y pedir pase cardiológico.",
      link: "../Normativa%20y%20Manuales%20de%20la%20Agencia%20Nacional%20de%20Seguridad%20Vial%20(ANSV)/Disposicion_ANSV_219_2025_Manual_y_Baremos_Psicofisicos_norma.htm#baremo-cardiovascular",
      normaLabel: "Ap. 15.7 Disp. 219/2025"
    },
    {
      title: "Insuficiencia Cardíaca (NYHA y FEVI)",
      cat: "Cardiovascular",
      keywords: "insuficiencia cardiaca nyha fevi ecocardiograma infarto",
      g1: "NYHA I y II: Apto vigencia reducida (12–24m). NYHA III y IV: NO APTO.",
      g2: "NYHA I con FEVI conservada: Apto anual. NYHA II, III y IV: NO APTO.",
      req: "Exigir Ecocardiograma (FEVI), NYHA y ausencia de síncopes.",
      link: "../Normativa%20y%20Manuales%20de%20la%20Agencia%20Nacional%20de%20Seguridad%20Vial%20(ANSV)/Disposicion_ANSV_219_2025_Manual_y_Baremos_Psicofisicos_norma.htm#baremo-cardiovascular",
      normaLabel: "Ap. 15.7 Disp. 219/2025"
    },
    {
      title: "Marcapasos y Cardiodesfibrilador (CDI)",
      cat: "Cardiovascular",
      keywords: "marcapasos cdi cardiodesfibrilador arritmia sincope",
      g1: "Marcapasos: Apto vig. reducida (1–3a). CDI: Apto ANUAL tras ≥ 6 meses sin descargas.",
      g2: "Marcapasos: evaluación anual con telemetría. CDI: NO APTO absoluto en Grupo 2.",
      req: "Exigir control de telemetría e informe de electrofisiología.",
      link: "../Normativa%20y%20Manuales%20de%20la%20Agencia%20Nacional%20de%20Seguridad%20Vial%20(ANSV)/Disposicion_ANSV_219_2025_Manual_y_Baremos_Psicofisicos_norma.htm#baremo-cardiovascular",
      normaLabel: "Ap. 15.7 Disp. 219/2025"
    },
    {
      title: "Epilepsia y Crisis Convulsivas",
      cat: "Neurológico",
      keywords: "epilepsia convulsiones crisis levetiracetam valproato eeg",
      g1: "APTO ANUAL con ≥ 12 meses libre de crisis, EEG e informe neurológico.",
      g2: "NO APTO (exige 5–10 años sin crisis y sin fármacos antiepilépticos).",
      req: "Informe neurológico con fecha de última crisis, EEG y medicación.",
      link: "../Normativa%20y%20Manuales%20de%20la%20Agencia%20Nacional%20de%20Seguridad%20Vial%20(ANSV)/Disposicion_ANSV_219_2025_Manual_y_Baremos_Psicofisicos_norma.htm#baremo-nervioso",
      normaLabel: "Ap. 15.8 Disp. 219/2025"
    },
    {
      title: "Diabetes Mellitus (Oral vs. Insulina)",
      cat: "Endócrino",
      keywords: "diabetes dbt insulina metformina hipoglucemia hba1c",
      g1: "Oral: Apto. Insulina: APTO VIGENCIA REDUCIDA (12–24m) sin hipoglucemias severas en 12m.",
      g2: "Oral compensada: Apto anual. Insulino-dependiente: NO APTO en regla general.",
      req: "Exigir HbA1c, fondo de ojo y constancia de 0 hipoglucemias graves en 12m.",
      link: "../Normativa%20y%20Manuales%20de%20la%20Agencia%20Nacional%20de%20Seguridad%20Vial%20(ANSV)/Disposicion_ANSV_219_2025_Manual_y_Baremos_Psicofisicos_norma.htm#baremo-endocrino",
      normaLabel: "Ap. 15.9 Disp. 219/2025"
    },
    {
      title: "Apnea del Sueño (SAOS) y CPAP",
      cat: "Sueño y Mental",
      keywords: "apnea sueno saos cpap ronquido obesidad somnolencia stop bang",
      g1: "Sin tratar: RETENER. Con CPAP eficaz: Apto vigencia reducida (12–24m).",
      g2: "Apto ANUAL solo con reporte objetivo de cumplimiento de CPAP y sin somnolencia.",
      req: "En choferes con STOP-BANG ≥ 3–5, retener y pedir Polisomnografía.",
      link: "../Normativa%20y%20Manuales%20de%20la%20Agencia%20Nacional%20de%20Seguridad%20Vial%20(ANSV)/Disposicion_ANSV_219_2025_Manual_y_Baremos_Psicofisicos_norma.htm#baremo-otros",
      normaLabel: "Ap. 15.10 Disp. 219/2025"
    },
    {
      title: "Psicofármacos y Salud Mental (Ley 15.402)",
      cat: "Sueño y Mental",
      keywords: "clonazepam alprazolam quetiapina psiquiatria sedacion alcohol cero",
      g1: "Estable sin sedación: Apto anual c/ informe. Sedación activa: NO APTO.",
      g2: "Uso de sedantes o trastornos psiquiátricos mayores: NO APTO.",
      req: "Ley PBA 15.402 prohíbe conducir bajo acción de psicotrópicos sedantes.",
      link: "../Marco%20Legal%20de%20la%20Provincia%20de%20Buenos%20Aires/Ley_Provincial_15402_Alcohol_Cero_al_Volante_PBA.html",
      normaLabel: "Ap. 15.3 · Ley PBA 15.402"
    },
    {
      title: "Adultos Mayores (≥ 70 años) y Test del Reloj",
      cat: "Sueño y Mental",
      keywords: "adulto mayor 70 anos demencia deterioro cognitivo test del reloj",
      g1: "Renovación ANUAL desde los 70 años. Reloj ≤ 6/10 pts: RETENER e interconsultar.",
      g2: "Ante mínimo deterioro ejecutivo o psicomotor: NO APTO.",
      req: "Abrochar la hoja dibujada del reloj al FUT como respaldo pericial.",
      link: "../Normativa%20y%20Manuales%20de%20la%20Agencia%20Nacional%20de%20Seguridad%20Vial%20(ANSV)/Disposicion_ANSV_219_2025_Manual_y_Baremos_Psicofisicos_norma.htm#baremo-mental",
      normaLabel: "Ap. 15.5 · Dto. 196/2025"
    },
    {
      title: "Discapacidad Motora, CUD y Clase F",
      cat: "Locomotor",
      keywords: "discapacidad cud amputacion clase f caja automatica pomo volante",
      g1: "Apto con Adaptación Vehicular (Clase F) previa prueba funcional de manejo.",
      g2: "NO APTO si compromete transporte público o cargas pesadas.",
      req: "Consignar adaptación exacta (caja automática, pomo giratorio, comandos manuales).",
      link: "../Normativa%20y%20Manuales%20de%20la%20Agencia%20Nacional%20de%20Seguridad%20Vial%20(ANSV)/Disposicion_ANSV_219_2025_Manual_y_Baremos_Psicofisicos_norma.htm#baremo-locomotor",
      normaLabel: "Ap. 15.6 · Ley 22.431"
    },
    {
      title: "Falsedad Ideológica (Art. 293 Código Penal)",
      cat: "Locomotor",
      keywords: "penal falsedad ideologica art 293 295 certificado falso",
      g1: "1 a 6 años de prisión por validar un FUT/Si.Na.Li.C. sin examen presencial.",
      g2: "Agravado en licencias profesionales.",
      req: "Jamás firmar sin el postulante presente con su DNI físico.",
      link: "../Marco%20Legal%20Nacional/Codigo_Penal_Ley_11179_Texto_Actualizado.html#art-293",
      normaLabel: "Arts. 292, 293 y 295 CP"
    }
  ];

  const baremoSearchInput = document.getElementById("baremo-fast-search");
  const filterPills = document.querySelectorAll(".filter-pill");
  const baremoCardsContainer = document.getElementById("baremo-cards-container");
  let activeCategoryFilter = "todos";

  function renderBaremoCards() {
    if (!baremoCardsContainer) return;
    const q = (baremoSearchInput ? baremoSearchInput.value : "").trim().toLowerCase();

    const filtered = BAREMO_DB.filter((item) => {
      const matchesCat = activeCategoryFilter === "todos" || item.cat === activeCategoryFilter;
      if (!matchesCat) return false;
      if (!q) return true;
      const haystack = `${item.title} ${item.cat} ${item.keywords} ${item.g1} ${item.g2} ${item.req}`.toLowerCase();
      return haystack.includes(q);
    });

    baremoCardsContainer.innerHTML = filtered
      .map(
        (item) => `
        <article class="baremo-item-card">
          <div class="baremo-item-header">
            <h3>${item.title}</h3>
            <span class="baremo-cat-tag">${item.cat}</span>
          </div>
          <div class="baremo-compare-box">
            <div class="b-col">
              <strong style="color: #065f46;">🟢 Grupo 1 (A, B, G)</strong>
              <span>${item.g1}</span>
            </div>
            <div class="b-col">
              <strong style="color: #92400e;">🟠 Grupo 2 (C, D, E)</strong>
              <span>${item.g2}</span>
            </div>
          </div>
          <div class="baremo-req-note">
            <strong>Conducta:</strong> ${item.req}
          </div>
          <div class="baremo-card-footer">
            <small style="color: var(--text-muted); font-weight: 600;">${item.normaLabel}</small>
            <a href="${item.link}" target="_blank" class="link-norma-direct">Ver norma ↗</a>
          </div>
        </article>
      `
      )
      .join("");
  }

  if (baremoSearchInput) baremoSearchInput.addEventListener("input", renderBaremoCards);
  filterPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      filterPills.forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      activeCategoryFilter = pill.getAttribute("data-cat") || "todos";
      renderBaremoCards();
    });
  });
  renderBaremoCards();

  // ==========================================================================
  // 7. PESTAÑA 3: CALCULADORAS STOP-BANG Y TEST DEL RELOJ
  // ==========================================================================
  const sbChecks = document.querySelectorAll(".sb-tool-check");
  const sbOutput = document.getElementById("sb-tool-output");
  const btnApplyStopBang = document.getElementById("btn-apply-stopbang");
  let currentStopBangScore = 0;

  function updateStopBangTool() {
    let score = 0;
    sbChecks.forEach((c) => {
      if (c.checked) score++;
    });
    currentStopBangScore = score;
    if (!sbOutput) return;
    if (score <= 2) {
      sbOutput.innerHTML = `<strong style="color: #065f46;">Puntaje: ${score}/8 — Bajo Riesgo de SAOS</strong>`;
    } else if (score <= 4) {
      sbOutput.innerHTML = `<strong style="color: #92400e;">Puntaje: ${score}/8 — Riesgo Intermedio (Retener en Grupo 2)</strong>`;
    } else {
      sbOutput.innerHTML = `<strong style="color: #991b1b;">Puntaje: ${score}/8 — Alto Riesgo (Retener y pedir Polisomnografía)</strong>`;
    }
  }

  sbChecks.forEach((c) => c.addEventListener("change", updateStopBangTool));
  if (btnApplyStopBang) {
    btnApplyStopBang.addEventListener("click", () => {
      if (currentStopBangScore >= 3 && toggleClinicoExtra) toggleClinicoExtra.checked = true;
      suenoMental.value = currentStopBangScore >= 3 ? "saos_sospecha" : "normal";
      evaluatePatient();
      switchTab("tab-evaluador");
    });
  }

  const clockInputs = document.querySelectorAll(".clock-calc-input");
  const clockOutput = document.getElementById("clock-tool-output");
  const btnApplyClock = document.getElementById("btn-apply-clock");
  let currentClockScore = 10;

  function updateClockTool() {
    const e = parseInt(document.getElementById("clock-esfera").value, 10) || 0;
    const n = parseInt(document.getElementById("clock-numeros").value, 10) || 0;
    const a = parseInt(document.getElementById("clock-agujas").value, 10) || 0;
    currentClockScore = e + n + a;
    if (!clockOutput) return;
    clockOutput.innerHTML =
      currentClockScore >= 7
        ? `<strong style="color: #065f46;">Puntaje: ${currentClockScore}/10 pts — NORMAL (≥ 7)</strong>`
        : `<strong style="color: #991b1b;">Puntaje: ${currentClockScore}/10 pts — PATOLÓGICO (≤ 6 → Retener)</strong>`;
  }

  clockInputs.forEach((inp) => inp.addEventListener("change", updateClockTool));
  if (btnApplyClock) {
    btnApplyClock.addEventListener("click", () => {
      if (currentClockScore <= 6 && toggleClinicoExtra) toggleClinicoExtra.checked = true;
      relojEstado.value = currentClockScore >= 7 ? "normal" : "patologico";
      evaluatePatient();
      switchTab("tab-evaluador");
    });
  }

  // ==========================================================================
  // 8. PESTAÑA 4: IMPRESIÓN DE INTERCONSULTA Y HOJA DEL RELOJ
  // ==========================================================================
  const sheetTypeSelect = document.getElementById("sheet-type-select");
  const groupInterconsultaEsp = document.getElementById("group-interconsulta-esp");
  const interconsultaEspSelect = document.getElementById("interconsulta-esp-select");
  const interconsultaMotivoInput = document.getElementById("interconsulta-motivo-input");
  const printableSheetContainer = document.getElementById("printable-sheet-container");
  const btnPrintOfficialSheet = document.getElementById("btn-print-official-sheet");
  const btnCopySheetText = document.getElementById("btn-copy-sheet-text");
  const btnGoInterconsulta = document.getElementById("btn-go-interconsulta");
  const btnGoRelojSheet = document.getElementById("btn-go-reloj-sheet");

  const ESPECIALIDAD_REQUIREMENTS = {
    "Cardiología": [
      "1. Diagnóstico cardiológico actualizado y Clase Funcional (NYHA I a IV).",
      "2. ECG y Ecocardiograma Doppler recientes (informando Fracción de Eyección - FEVI).",
      "3. En Marcapasos o CDI: telemetría actual y constancia de ausencia de descargas o síncopes en los últimos 6 meses.",
      "4. Esquema farmacológico, estabilidad tensional y ausencia de arritmias o angina."
    ],
    "Oftalmología": [
      "1. Agudeza visual (Snellen) en Ojo Derecho, Ojo Izquierdo y Binocular, sin y con corrección.",
      "2. Campo visual binocular (normal ≥ 120°) y ausencia de diplopía.",
      "3. En Visión Monocular (Grupo 1): constancia de antigüedad ≥ 6 meses de adaptación, AV en ojo único ≥ 8/10 (0,8), CV normal y visión nocturna conservada."
    ],
    "Neurología": [
      "1. Diagnóstico neurológico actualizado y examen motor/coordinativo.",
      "2. En Epilepsia: fecha exacta de última crisis (Grupo 1 exige ≥ 12 meses libre de crisis), EEG reciente y medicación.",
      "3. Constancia de ausencia de efectos sedativos o síndrome vertiginoso activo."
    ],
    "Endocrinología / Diabetología": [
      "1. Tipo de Diabetes Mellitus y esquema terapéutico actual (oral vs. insulina).",
      "2. Valor de HbA1c reciente y adherencia al automonitoreo glucémico.",
      "3. Constancia expresa de AUSENCIA de episodios de hipoglucemia severa en los últimos 12 meses."
    ],
    "Neumonología / Medicina del Sueño": [
      "1. Evaluación de Apnea Obstructiva del Sueño (SAOS) y Polisomnografía.",
      "2. Si utiliza CPAP: reporte objetivo de adherencia horaria y ausencia de somnolencia diurna."
    ],
    "Otorrinolaringología / Audiología": [
      "1. Audiometría Tonal actualizada en ambos oídos (Disposición ANSV Nº 300/2025).",
      "2. Ganancia auditiva funcional con otoamplífono (audífono)."
    ],
    "Psiquiatría / Salud Mental": [
      "1. Diagnóstico actualizado y estabilidad clínica (Ap. 15.3 Disp. ANSV 219/2025).",
      "2. Esquema psicofarmacológico y constancia expresa de ausencia de sedación o enlentecimiento psicomotor (Ley PBA 15.402)."
    ]
  };

  function renderPrintableSheet() {
    if (!printableSheetContainer) return;
    const mode = sheetTypeSelect ? sheetTypeSelect.value : "interconsulta";
    if (groupInterconsultaEsp) {
      groupInterconsultaEsp.style.display = mode === "interconsulta" ? "flex" : "none";
    }

    const todayStr = new Date().toLocaleDateString("es-AR");
    const name = (ptName.value || "________________________________").trim();
    const dni = (ptDni.value || "________________").trim();
    const age = (ptAge.value || "___").trim();

    const selectedClasses = [];
    let hasG2 = false;
    subclassChecks.forEach((cb) => {
      if (cb.checked) {
        selectedClasses.push(cb.value);
        if (cb.getAttribute("data-group") === "2") hasG2 = true;
      }
    });
    const classesStr = selectedClasses.length ? selectedClasses.join(", ") : "B1";
    const groupLabel = hasG2 ? "Grupo 2 (Profesional)" : "Grupo 1 (Particular)";

    if (mode === "interconsulta") {
      const esp = interconsultaEspSelect ? interconsultaEspSelect.value : "Cardiología";
      const motivo =
        (interconsultaMotivoInput && interconsultaMotivoInput.value.trim()) ||
        currentVerdictState.suggestedMotivo ||
        "Valoración clínica especializada según Baremo ANSV.";
      const reqList = ESPECIALIDAD_REQUIREMENTS[esp] || ESPECIALIDAD_REQUIREMENTS["Cardiología"];

      printableSheetContainer.innerHTML = `
        <div class="sheet-official-header">
          <div>
            <h2>CENTRO EMISOR DE LICENCIAS DE CONDUCIR – MUNICIPALIDAD DE AVELLANEDA</h2>
            <p>Sistema Nacional de Licencias de Conducir (Si.Na.Li.C.) · Disp. ANSV 219/2025 y 300/2025</p>
          </div>
          <div style="text-align: right; font-size: 0.78rem;">
            <strong>Fecha:</strong> ${todayStr}
          </div>
        </div>

        <h3 style="font-size: 0.95rem; margin-bottom: 0.55rem; text-transform: uppercase;">
          Solicitud de Informe Médico Especializado (${esp})
        </h3>

        <div style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 0.55rem 0.75rem; border-radius: 6px; font-size: 0.82rem; margin-bottom: 0.8rem;">
          <div><strong>Postulante:</strong> ${name} &nbsp;|&nbsp; <strong>DNI:</strong> ${dni} &nbsp;|&nbsp; <strong>Edad:</strong> ${age} años</div>
          <div style="margin-top: 0.2rem;"><strong>Categoría:</strong> Clase ${classesStr} (${groupLabel}) &nbsp;|&nbsp; <strong>Motivo:</strong> ${motivo}</div>
        </div>

        <p style="font-size: 0.8rem; margin-bottom: 0.5rem;">
          <strong>Estimado/a Colega Especialista en ${esp}:</strong><br/>
          Conforme al <strong>Apartado 10.5 de la Disposición ANSV Nº 219/2025</strong>, solicitamos informar con letra clara, fecha (vigencia ≤ 30 días), firma y sello profesional los siguientes <strong>parámetros objetivos</strong> (los certificados que solo indican <em>"Apto para conducir"</em> sin datos clínicos no son válidos para la auditoría):
        </p>

        <ul style="list-style: none; padding-left: 0; font-size: 0.8rem; display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 0.9rem;">
          ${reqList.map((item) => `<li style="padding: 0.3rem 0.55rem; border-left: 3px solid #0f172a; background: #f8fafc;">${item}</li>`).join("")}
        </ul>

        <div style="border: 1px solid #94a3b8; border-radius: 6px; padding: 0.6rem; min-height: 110px; font-size: 0.75rem; color: #475569;">
          <strong>Informe del Especialista (o en recetario adjunto):</strong>
        </div>

        <div class="signature-boxes-row">
          <div class="sig-line">Firma y Sello Médico Examinador CEL Avellaneda</div>
          <div class="sig-line">Firma del Postulante</div>
        </div>
      `;
    } else {
      printableSheetContainer.innerHTML = `
        <div class="sheet-official-header">
          <div>
            <h2>CENTRO EMISOR DE LICENCIAS DE CONDUCIR – MUNICIPALIDAD DE AVELLANEDA</h2>
            <p>Anexo al FUT · Prueba del Reloj a la Orden (Ap. 15.5 Disp. ANSV 219/2025)</p>
          </div>
          <div style="text-align: right; font-size: 0.78rem;">
            <strong>Fecha:</strong> ${todayStr}
          </div>
        </div>

        <div style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 0.5rem 0.75rem; border-radius: 6px; font-size: 0.82rem; margin-bottom: 0.65rem;">
          <strong>Postulante:</strong> ${name} &nbsp;|&nbsp; <strong>DNI:</strong> ${dni} &nbsp;|&nbsp; <strong>Edad:</strong> ${age} años &nbsp;|&nbsp; <strong>Clase:</strong> ${classesStr}
        </div>

        <div style="font-size: 0.82rem; margin-bottom: 0.45rem;">
          <strong>Consigna:</strong> <em>"Dibuje una esfera redonda de reloj grande, coloque todos los números de las horas y dibuje las agujas marcando las <strong>once y diez (11:10)</strong>."</em>
        </div>

        <div class="clock-draw-circle-area">
          Espacio para el dibujo manuscrito del reloj (Abrochar al FUT)
        </div>

        <div style="font-size: 0.78rem; padding: 0.45rem; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px;">
          <strong>Puntuación (Cacho/Sundström):</strong> Esfera (___/2) + Números 1–12 (___/4) + Agujas 11:10 (___/4) = <strong>TOTAL: ___ / 10 pts</strong> (Normal ≥ 7 · Patológico ≤ 6)
        </div>

        <div class="signature-boxes-row">
          <div class="sig-line">Firma del Postulante</div>
          <div class="sig-line">Firma y Sello Médico Examinador CEL Avellaneda</div>
        </div>
      `;
    }
  }

  if (sheetTypeSelect) sheetTypeSelect.addEventListener("change", renderPrintableSheet);
  if (interconsultaEspSelect) interconsultaEspSelect.addEventListener("change", renderPrintableSheet);
  if (interconsultaMotivoInput) interconsultaMotivoInput.addEventListener("input", renderPrintableSheet);

  if (btnGoInterconsulta) {
    btnGoInterconsulta.addEventListener("click", () => {
      if (sheetTypeSelect) sheetTypeSelect.value = "interconsulta";
      if (interconsultaEspSelect && currentVerdictState.suggestedSpecialty) {
        interconsultaEspSelect.value = currentVerdictState.suggestedSpecialty;
      }
      if (interconsultaMotivoInput && currentVerdictState.suggestedMotivo) {
        interconsultaMotivoInput.value = currentVerdictState.suggestedMotivo;
      }
      renderPrintableSheet();
      switchTab("tab-formularios");
    });
  }

  if (btnGoRelojSheet) {
    btnGoRelojSheet.addEventListener("click", () => {
      if (sheetTypeSelect) sheetTypeSelect.value = "reloj";
      renderPrintableSheet();
      switchTab("tab-formularios");
    });
  }

  if (btnPrintOfficialSheet) {
    btnPrintOfficialSheet.addEventListener("click", () => {
      document.body.classList.add("printing-sheet");
      window.print();
      setTimeout(() => {
        document.body.classList.remove("printing-sheet");
      }, 500);
    });
  }

  if (btnCopySheetText && printableSheetContainer) {
    btnCopySheetText.addEventListener("click", () => {
      const txt = printableSheetContainer.innerText.trim();
      if (!txt) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(() => {
          const orig = btnCopySheetText.textContent;
          btnCopySheetText.textContent = "✓ Copiado";
          setTimeout(() => {
            btnCopySheetText.textContent = orig;
          }, 1800);
        });
      }
    });
  }

  evaluatePatient();
});
