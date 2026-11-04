document.addEventListener("DOMContentLoaded", () => {
  const SHIFT_STORAGE_KEY = "cel_avellaneda_shift_stats_v1";

  // ==========================================================================
  // 1. NAVEGACIÓN DE PESTAÑAS (ESCRITORIO Y MÓVIL)
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
  // 2. CONTADOR DIARIO DEL TURNO (LOCALSTORAGE ANÓNIMO - LEY 25.326)
  // ==========================================================================
  const kpiTotal = document.getElementById("kpi-total");
  const kpiApto = document.getElementById("kpi-apto");
  const kpiWarn = document.getElementById("kpi-warn");
  const kpiRetenido = document.getElementById("kpi-retenido");
  const kpiNoApto = document.getElementById("kpi-noapto");
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
    if (kpiTotal) kpiTotal.textContent = stats.total || 0;
    if (kpiApto) kpiApto.textContent = stats.apto || 0;
    if (kpiWarn) kpiWarn.textContent = stats.warn || 0;
    if (kpiRetenido) kpiRetenido.textContent = stats.retenido || 0;
    if (kpiNoApto) kpiNoApto.textContent = stats.noapto || 0;
  }

  renderShiftStats(loadShiftStats());

  if (btnResetShift) {
    btnResetShift.addEventListener("click", () => {
      saveShiftStats({ total: 0, apto: 0, warn: 0, retenido: 0, noapto: 0 });
    });
  }

  // ==========================================================================
  // 3. REFERENCIAS A CONTROLES DEL EVALUADOR PERICIAL
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
  const boxAdaptacionesF = document.getElementById("box-adaptaciones-f");
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

  // Salidas del dictamen
  const verdictBanner = document.getElementById("verdict-banner");
  const verdictTitle = document.getElementById("verdict-title");
  const verdictSubtitle = document.getElementById("verdict-subtitle");
  const pillVigencia = document.getElementById("pill-vigencia");
  const pillRestricciones = document.getElementById("pill-restricciones");
  const dualG1Status = document.getElementById("dual-g1-status");
  const dualG2Status = document.getElementById("dual-g2-status");
  const verdictReasonsList = document.getElementById("verdict-reasons-list");
  const evolutionOutput = document.getElementById("evolution-output");

  // Estado actual del veredicto para el contador del turno e interconsulta
  let currentVerdictState = {
    category: "apto", // apto | warn | info | noapto
    suggestedSpecialty: "Cardiología",
    suggestedMotivo: ""
  };

  function fracFromDecimal(decStr) {
    const val = parseFloat(decStr);
    if (val <= 0) return "< 1/10";
    return `${Math.round(val * 10)}/10`;
  }

  // ==========================================================================
  // 4. MOTOR DE DECISIÓN CLÍNICA DUAL (GRUPO 1 + GRUPO 2) Y REDACTOR PERICIAL
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

    // Mostrar/ocultar caja de adaptaciones Clase F
    const needsAdaptBox = hasClassF || locomotorEstado.value === "adaptado_f";
    if (boxAdaptacionesF) {
      boxAdaptacionesF.style.display = needsAdaptBox ? "block" : "none";
    }

    // Mostrar/ocultar caja de certificado especialista
    if (boxCertificadoDatos) {
      boxCertificadoDatos.style.display = certEstado.value === "presenta_valido" ? "block" : "none";
    }

    const allSubclasses = [...selectedG1, ...selectedG2];
    const subclassesLabel = allSubclasses.length ? allSubclasses.join(", ") : "B1";
    const asksG1 = selectedG1.length > 0 || allSubclasses.length === 0;
    const asksG2 = selectedG2.length > 0;

    // Tope de vigencia base por edad según Decreto 196/2025 / Ley 24.449 / PBA
    let maxMonthsG1 = 60; // 5 años hasta 65
    let maxMonthsG2 = 24; // Profesional (1 a 2 años según edad)
    const reasons = [];
    const restrictions = [];

    if (age >= 70) {
      maxMonthsG1 = 12;
      maxMonthsG2 = 12;
      reasons.push({
        type: "info",
        text: `Edad ${age} años (≥ 70 años): Renovación anual obligatoria (máx. 12 meses) y cribado cognitivo (Art. 13/14 Ley 24.449 y Dto. 196/2025).`
      });
    } else if (age > 65) {
      maxMonthsG1 = 36;
      maxMonthsG2 = 12;
      reasons.push({
        type: "info",
        text: `Edad ${age} años (> 65 años): Tope máximo de vigencia hasta 36 meses en Grupo 1 y control anual en Grupo 2.`
      });
    }

    let statusG1 = "APTO"; // APTO | APTO_RESTR | RETENIDO | NO_APTO
    let statusG2 = "APTO";
    let suggestedSpecialty = "Cardiología";
    let suggestedMotivo = "";

    const upgradeStatus = (current, next) => {
      const order = { APTO: 0, APTO_RESTR: 1, RETENIDO: 2, NO_APTO: 3 };
      return order[next] > order[current] ? next : current;
    };

    // 1. Reglas de Edad para Profesionales (Grupo 2)
    if (asksG2 && age < 21) {
      statusG2 = upgradeStatus(statusG2, "NO_APTO");
      reasons.push({
        type: "danger",
        text: `Edad ${age} años (< 21 años): Inhabilitado legalmente para Clases Profesionales C, D y E (Art. 16/20 Ley 24.449).`
      });
    }
    if (asksG2 && age > 65 && tramite.includes("Original")) {
      statusG2 = upgradeStatus(statusG2, "NO_APTO");
      reasons.push({
        type: "danger",
        text: `Mayor de 65 años solicitando Licencia Profesional por primera vez (Original): No permitido por reglamentación nacional.`
      });
    }

    // 2. Evaluación Visual (Apartado 15.1 Disposición ANSV 219/2025)
    const od = parseFloat(avOd.value);
    const oi = parseFloat(avOi.value);
    const bestEye = Math.max(od, oi);
    const worstEye = Math.min(od, oi);
    const isMonocular = worstEye < 0.1 || visCampo.value.startsWith("monocular");

    if (avCorreccion.value === "olvido_lentes") {
      statusG1 = upgradeStatus(statusG1, "RETENIDO");
      statusG2 = upgradeStatus(statusG2, "RETENIDO");
      suggestedSpecialty = "Oftalmología";
      suggestedMotivo = `Déficit de agudeza visual sin corrección en box (OD ${fracFromDecimal(od)} / OI ${fracFromDecimal(oi)}); concurre sin anteojos`;
      reasons.push({
        type: "warn",
        text: `Ap. 10.4 / 15.1 Disp. 219/25: No alcanza corte visual sin lentes y olvidó sus anteojos. Retener trámite hasta que concurra con corrección óptica o informe oftalmológico.`
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
      suggestedMotivo = "Alteración severa del campo visual binocular / diplopía activa";
      reasons.push({
        type: "danger",
        text: `Ap. 15.1 Disp. 219/25: Diplopía activa, hemianopsia o escotoma central son inhabilitantes.`
      });
    } else if (isMonocular) {
      // Visión Monocular: SIEMPRE NO APTO para Grupo 2
      statusG2 = upgradeStatus(statusG2, "NO_APTO");
      if (asksG2) {
        reasons.push({
          type: "danger",
          text: `Ap. 15.1 Disp. 219/25 (Visión Monocular): INHABILITANTE ABSOLUTO para Grupo 2 Profesional (${selectedG2.join(", ")}).`
        });
      }
      // Para Grupo 1: requiere >= 6 meses de adaptación, mejor ojo >= 0.8 y CV normal con certificado
      if (visCampo.value === "monocular_reciente" || bestEye < 0.8) {
        statusG1 = upgradeStatus(statusG1, bestEye < 0.8 ? "NO_APTO" : "RETENIDO");
        suggestedSpecialty = "Oftalmología";
        suggestedMotivo = "Visión monocular: acreditar antigüedad ≥ 6 meses, AV en ojo único ≥ 8/10, campo visual y visión nocturna conservados";
        reasons.push({
          type: "danger",
          text: `Ap. 15.1 Disp. 219/25 (Visión Monocular en Grupo 1): Exige ojo único ≥ 8/10 (0,8) y ≥ 6 meses de adaptación certificados por oftalmólogo.`
        });
      } else {
        statusG1 = upgradeStatus(statusG1, "APTO_RESTR");
        maxMonthsG1 = Math.min(maxMonthsG1, 36);
        restrictions.push("Espejos retrovisores laterales panorámicos en ambos lados + espejo interno panorámico + lentes protectores / casco integral");
        reasons.push({
          type: "warn",
          text: `Ap. 15.1 Disp. 219/25: Visión Monocular compensada (≥ 6 meses y ojo único ${fracFromDecimal(bestEye)} ≥ 8/10). Apto Grupo 1 con espejos panorámicos y protección ocular.`
        });
      }
    } else {
      // Evaluación Binocular Estándar
      // Corte Grupo 1: mejor ojo >= 0.6 y peor ojo >= 0.2 (o >= 0.5 ambos ojos)
      const passesG1Vision = (bestEye >= 0.6 && worstEye >= 0.2) || (bestEye >= 0.5 && worstEye >= 0.5);
      if (!passesG1Vision) {
        statusG1 = upgradeStatus(statusG1, "RETENIDO");
        suggestedSpecialty = "Oftalmología";
        suggestedMotivo = `Agudeza visual inferior al mínimo reglamentario de Grupo 1 (OD ${fracFromDecimal(od)} / OI ${fracFromDecimal(oi)})`;
        reasons.push({
          type: "danger",
          text: `Ap. 15.1 Disp. 219/25: No alcanza el corte mínimo para Grupo 1 (6/10 en mejor ojo y 2/10 en peor ojo). Retener para interconsulta oftalmológica.`
        });
      }
      // Corte Grupo 2: mejor ojo >= 0.8 y peor ojo >= 0.5
      const passesG2Vision = bestEye >= 0.8 && worstEye >= 0.5;
      if (!passesG2Vision) {
        statusG2 = upgradeStatus(statusG2, "NO_APTO");
        if (asksG2) {
          suggestedSpecialty = "Oftalmología";
          suggestedMotivo = `Agudeza visual inferior al corte de Grupo 2 Profesional 8/10 y 5/10 (actual: OD ${fracFromDecimal(od)} / OI ${fracFromDecimal(oi)})`;
          reasons.push({
            type: "danger",
            text: `Ap. 15.1 Disp. 219/25: No alcanza el corte para Grupo 2 Profesional (exige mínimo 8/10 en mejor ojo y 5/10 en peor ojo).`
          });
        }
      }
    }

    if (visEncandilamiento.value === "catarata_no_operada") {
      statusG1 = upgradeStatus(statusG1, "RETENIDO");
      statusG2 = upgradeStatus(statusG2, "RETENIDO");
      suggestedSpecialty = "Oftalmología";
      suggestedMotivo = "Alteración en prueba de recuperación al encandilamiento / opacidad de medios";
      reasons.push({
        type: "warn",
        text: `Ap. 15.1 Disp. 219/25: Intolerancia al encandilamiento / catarata activa. Retener y solicitar informe oftalmológico.`
      });
    }

    // 3. Evaluación Auditiva (Disposición ANSV 300/2025)
    if (audicionEstado.value === "otoamplifono") {
      statusG1 = upgradeStatus(statusG1, "APTO_RESTR");
      statusG2 = upgradeStatus(statusG2, "APTO_RESTR");
      restrictions.push("Uso obligatorio de otoamplífono (audífono)");
      reasons.push({
        type: "info",
        text: `Disp. ANSV 300/2025 (Ap. 15.2): Hipoacusia compensada con audífono. Consignar restricción de uso obligatorio de otoamplífono.`
      });
    } else if (audicionEstado.value === "hipoacusia_severa") {
      statusG1 = upgradeStatus(statusG1, "APTO_RESTR");
      statusG2 = upgradeStatus(statusG2, "NO_APTO");
      restrictions.push("Espejos retrovisores laterales convexos duales y espejo interno panorámico (Disp. 300/25)");
      reasons.push({
        type: "warn",
        text: `Disp. ANSV 300/2025: Hipoacusia severa/anacusia bilateral permite Grupo 1 con espejos laterales convexos + interno panorámico; inhabilita transporte profesional Grupo 2.`
      });
    } else if (audicionEstado.value === "hipoacusia_sin_estudio") {
      statusG1 = upgradeStatus(statusG1, "RETENIDO");
      statusG2 = upgradeStatus(statusG2, "RETENIDO");
      suggestedSpecialty = "Otorrinolaringología / Audiología";
      suggestedMotivo = "Déficit auditivo detectado en consultorio sin audiometría ni equipamiento";
      reasons.push({
        type: "warn",
        text: `Disp. ANSV 300/2025: Hipoacusia no equipada en el acto. Retener trámite y solicitar audiometría tonal / equipamiento con otoamplífono.`
      });
    }

    // 4. Tensión Arterial en Box y Locomotor (Ap. 15.6 y 15.7)
    const pas = parseInt(taPas.value, 10) || 120;
    const pad = parseInt(taPad.value, 10) || 80;
    if (pas >= 180 || pad >= 110) {
      statusG1 = upgradeStatus(statusG1, "RETENIDO");
      statusG2 = upgradeStatus(statusG2, "RETENIDO");
      suggestedSpecialty = "Cardiología";
      suggestedMotivo = `Hipertensión arterial severa constatada en consultorio del CEL (TA ${pas}/${pad} mmHg)`;
      reasons.push({
        type: "danger",
        text: `Ap. 15.7 Disp. 219/25: Cifras tensionales ≥ 180/110 mmHg en el box (${pas}/${pad} mmHg). RETENER TRÁMITE, estabilizar y exigir pase cardiológico.`
      });
    }

    if (locomotorEstado.value === "adaptado_f" || hasClassF) {
      statusG1 = upgradeStatus(statusG1, "APTO_RESTR");
      statusG2 = upgradeStatus(statusG2, "NO_APTO");
      const chosenAdapts = [];
      adaptFChecks.forEach((c) => {
        if (c.checked) chosenAdapts.push(c.value);
      });
      const adaptText = chosenAdapts.length ? chosenAdapts.join(" + ") : "Adaptación vehicular homologada Clase F";
      restrictions.push(`Vehículo Adaptado (Clase F): ${adaptText}`);
      reasons.push({
        type: "warn",
        text: `Ap. 15.6 Disp. 219/25 y Ley 22.431: Déficit motor compensado. Apto Grupo 1 con adaptación técnica (${adaptText}) y prueba funcional de manejo.`
      });
    } else if (locomotorEstado.value === "deficit_agudo") {
      statusG1 = upgradeStatus(statusG1, "RETENIDO");
      statusG2 = upgradeStatus(statusG2, "RETENIDO");
      reasons.push({
        type: "warn",
        text: `Ap. 10.4 / 15.6 Disp. 219/25: Inmovilización con yeso o posoperatorio agudo. No Apto Transitorio (Retener hasta alta traumatológica).`
      });
    } else if (locomotorEstado.value === "deficit_severo") {
      statusG1 = upgradeStatus(statusG1, "NO_APTO");
      statusG2 = upgradeStatus(statusG2, "NO_APTO");
      reasons.push({
        type: "danger",
        text: `Ap. 15.6 Disp. 219/25: Déficit osteomioarticular severo no compensable para el comando seguro del vehículo.`
      });
    }

    // 5. Patologías Crónicas: Cardiovascular, Diabetes, Neurología, Sueño y Cognición
    let requiresSpecialistCert = false;

    // Cardiovascular (Ap. 15.7)
    if (cardioEstado.value === "cardio_compensada") {
      requiresSpecialistCert = true;
      maxMonthsG1 = Math.min(maxMonthsG1, 24);
      maxMonthsG2 = Math.min(maxMonthsG2, 12);
      statusG1 = upgradeStatus(statusG1, "APTO_RESTR");
      statusG2 = upgradeStatus(statusG2, "APTO_RESTR");
      suggestedSpecialty = "Cardiología";
      suggestedMotivo = "Antecedente cardiovascular compensado (solicitud de informe con FEVI, NYHA I y ausencia de isquemia/arritmias)";
      reasons.push({
        type: "warn",
        text: `Ap. 15.7 Disp. 219/25: Cardiopatía compensada (NYHA I). Otorgar vigencia reducida (12–24 meses en G1; anual en G2) con certificado cardiológico.`
      });
    } else if (cardioEstado.value === "nyha_ii") {
      requiresSpecialistCert = true;
      maxMonthsG1 = Math.min(maxMonthsG1, 12);
      statusG1 = upgradeStatus(statusG1, "APTO_RESTR");
      statusG2 = upgradeStatus(statusG2, "NO_APTO");
      suggestedSpecialty = "Cardiología";
      suggestedMotivo = "Insuficiencia Cardíaca Clase Funcional NYHA II";
      reasons.push({
        type: "danger",
        text: `Ap. 15.7 Disp. 219/25: Insuficiencia Cardíaca NYHA II permite Grupo 1 con vigencia anual e informe cardiológico, pero es NO APTO para Grupo 2 Profesional.`
      });
    } else if (cardioEstado.value === "marcapasos") {
      requiresSpecialistCert = true;
      maxMonthsG1 = Math.min(maxMonthsG1, 24);
      maxMonthsG2 = Math.min(maxMonthsG2, 12);
      statusG1 = upgradeStatus(statusG1, "APTO_RESTR");
      statusG2 = upgradeStatus(statusG2, "APTO_RESTR");
      suggestedSpecialty = "Cardiología";
      suggestedMotivo = "Portador de Marcapasos Definitivo (solicitud de control de telemetría y ausencia de síncopes)";
      reasons.push({
        type: "warn",
        text: `Ap. 15.7 Disp. 219/25: Portador de Marcapasos Definitivo compensado. Exigir telemetría e informe de electrofisiología y reducir vigencia.`
      });
    } else if (cardioEstado.value === "cdi") {
      requiresSpecialistCert = true;
      maxMonthsG1 = Math.min(maxMonthsG1, 12);
      statusG1 = upgradeStatus(statusG1, "APTO_RESTR");
      statusG2 = upgradeStatus(statusG2, "NO_APTO");
      suggestedSpecialty = "Cardiología";
      suggestedMotivo = "Portador de Cardiodesfibrilador Implantable (CDI) — requiere acreditar ≥ 6 meses sin descargas ni síncopes";
      reasons.push({
        type: "danger",
        text: `Ap. 15.7 Disp. 219/25: Cardiodesfibrilador Implantable (CDI) es INHABILITANTE ABSOLUTO para Grupo 2 Profesional. En Grupo 1: vigencia anual tras ≥ 6 meses sin descargas.`
      });
    } else if (cardioEstado.value === "cardio_descompensada") {
      statusG1 = upgradeStatus(statusG1, "NO_APTO");
      statusG2 = upgradeStatus(statusG2, "NO_APTO");
      suggestedSpecialty = "Cardiología";
      suggestedMotivo = "Cardiopatía descompensada Clase Funcional NYHA III-IV / Síncope recurrente";
      reasons.push({
        type: "danger",
        text: `Ap. 15.7 Disp. 219/25: Insuficiencia cardíaca NYHA III–IV, angina inestable o síncopes activos son NO APTOS para toda clase.`
      });
    }

    // Diabetes Mellitus (Ap. 15.9)
    if (dbtEstado.value === "dbt_oral") {
      requiresSpecialistCert = true;
      maxMonthsG1 = Math.min(maxMonthsG1, 36);
      maxMonthsG2 = Math.min(maxMonthsG2, 12);
      statusG1 = upgradeStatus(statusG1, "APTO_RESTR");
      statusG2 = upgradeStatus(statusG2, "APTO_RESTR");
      suggestedSpecialty = "Endocrinología / Diabetología";
      suggestedMotivo = "Diabetes Mellitus Tipo 2 en tratamiento oral (solicitud de HbA1c, estabilidad glucémica y fondo de ojo)";
      reasons.push({
        type: "info",
        text: `Ap. 15.9 Disp. 219/25: Diabetes Tipo 2 con antidiabéticos orales compensada. Vigencia controlada en G1 y anual obligatoria en G2.`
      });
    } else if (dbtEstado.value === "dbt_insulina") {
      requiresSpecialistCert = true;
      maxMonthsG1 = Math.min(maxMonthsG1, 24);
      statusG1 = upgradeStatus(statusG1, "APTO_RESTR");
      statusG2 = upgradeStatus(statusG2, "NO_APTO");
      suggestedSpecialty = "Endocrinología / Diabetología";
      suggestedMotivo = "Diabetes Mellitus Insulino-Tratada (solicitud de HbA1c, automonitoreo, fondo de ojo y ausencia de hipoglucemias severas en los últimos 12 meses)";
      reasons.push({
        type: "danger",
        text: `Ap. 15.9 Disp. 219/25: Diabetes Insulino-Requiente permite Grupo 1 con vigencia reducida (12–24 meses) y 0 hipoglucemias severas en 12m; NO APTO en regla general para Grupo 2 Profesional.`
      });
    } else if (dbtEstado.value === "dbt_descompensada") {
      statusG1 = upgradeStatus(statusG1, "RETENIDO");
      statusG2 = upgradeStatus(statusG2, "NO_APTO");
      suggestedSpecialty = "Endocrinología / Diabetología";
      suggestedMotivo = "Diabetes Mellitus descompensada / Episodio de hipoglucemia severa reciente";
      reasons.push({
        type: "danger",
        text: `Ap. 15.9 Disp. 219/25: Hipoglucemia severa en los últimos 12 meses o descompensación metabólica impide otorgar el apto.`
      });
    }

    // Neurología / Epilepsia (Ap. 15.8)
    if (neuroEstado.value === "epilepsia_controlada") {
      requiresSpecialistCert = true;
      maxMonthsG1 = Math.min(maxMonthsG1, 12);
      statusG1 = upgradeStatus(statusG1, "APTO_RESTR");
      statusG2 = upgradeStatus(statusG2, "NO_APTO");
      suggestedSpecialty = "Neurología";
      suggestedMotivo = "Antecedente de Epilepsia (solicitud de informe neurológico acreditando ≥ 12 meses libre de crisis, EEG, medicación y ausencia de sedación)";
      reasons.push({
        type: "danger",
        text: `Ap. 15.8 Disp. 219/25: Epilepsia con ≥ 12 meses libre de crisis es APTO ANUAL en Grupo 1 con informe neurológico; NO APTO para Grupo 2 Profesional (exige 5–10 años sin crisis y sin fármacos).`
      });
    } else if (neuroEstado.value === "epilepsia_activa") {
      statusG1 = upgradeStatus(statusG1, "NO_APTO");
      statusG2 = upgradeStatus(statusG2, "NO_APTO");
      suggestedSpecialty = "Neurología";
      suggestedMotivo = "Crisis convulsiva en los últimos 12 meses / Epilepsia no controlada";
      reasons.push({
        type: "danger",
        text: `Ap. 15.8 Disp. 219/25: Crisis epiléptica dentro de los últimos 12 meses es INHABILITANTE para todas las clases.`
      });
    } else if (neuroEstado.value === "neuro_estable") {
      requiresSpecialistCert = true;
      maxMonthsG1 = Math.min(maxMonthsG1, 12);
      statusG1 = upgradeStatus(statusG1, "APTO_RESTR");
      statusG2 = upgradeStatus(statusG2, "NO_APTO");
      suggestedSpecialty = "Neurología";
      suggestedMotivo = "Antecedente neurológico (Parkinson inicial / Secuela ACV) para valoración motora y cognitiva";
      reasons.push({
        type: "warn",
        text: `Ap. 15.8 Disp. 219/25: Patología neurológica compensada. Control anual estricto en Grupo 1 con informe especializado; inhabilitante para Grupo 2.`
      });
    } else if (neuroEstado.value === "neuro_severo") {
      statusG1 = upgradeStatus(statusG1, "NO_APTO");
      statusG2 = upgradeStatus(statusG2, "NO_APTO");
      suggestedSpecialty = "Neurología";
      suggestedMotivo = "Trastorno neurológico progresivo / Vértigo incapacitante";
      reasons.push({
        type: "danger",
        text: `Ap. 15.8 Disp. 219/25: Déficit neurológico progresivo o síndrome vertiginoso activo es NO APTO.`
      });
    }

    // Sueño (SAOS) y Salud Mental / Psicotrópicos (Ap. 15.3 a 15.5 y 15.10 + Ley PBA 15.402)
    if (suenoMental.value === "saos_cpap") {
      requiresSpecialistCert = true;
      maxMonthsG1 = Math.min(maxMonthsG1, 24);
      maxMonthsG2 = Math.min(maxMonthsG2, 12);
      statusG1 = upgradeStatus(statusG1, "APTO_RESTR");
      statusG2 = upgradeStatus(statusG2, "APTO_RESTR");
      suggestedSpecialty = "Neumonología / Medicina del Sueño";
      suggestedMotivo = "Síndrome de Apnea Obstructiva del Sueño (SAOS) en tratamiento con CPAP (adjuntar reporte de cumplimiento horario y ausencia de somnolencia diurna)";
      reasons.push({
        type: "warn",
        text: `Ap. 15.10 Disp. 219/25: SAOS tratado con CPAP eficaz. Exigir reporte objetivo de adherencia al CPAP y otorgar vigencia reducida (anual en Grupo 2).`
      });
    } else if (suenoMental.value === "saos_sospecha") {
      statusG1 = upgradeStatus(statusG1, "RETENIDO");
      statusG2 = upgradeStatus(statusG2, "RETENIDO");
      suggestedSpecialty = "Neumonología / Medicina del Sueño";
      suggestedMotivo = "Alto riesgo clínico de Apnea Obstructiva del Sueño (STOP-BANG ≥ 3–5 / Somnolencia diurna) — Solicitud de Polisomnografía y evaluación neumonológica";
      reasons.push({
        type: "danger",
        text: `Ap. 15.10 Disp. 219/25: Sospecha clínica alta de Apnea del Sueño (SAOS) sin estudio ni tratamiento. RETENER TRÁMITE y solicitar polisomnografía / informe neumonológico.`
      });
    } else if (suenoMental.value === "psicofarmaco_estable") {
      requiresSpecialistCert = true;
      maxMonthsG1 = Math.min(maxMonthsG1, 12);
      statusG1 = upgradeStatus(statusG1, "APTO_RESTR");
      statusG2 = upgradeStatus(statusG2, "NO_APTO");
      suggestedSpecialty = "Psiquiatría / Salud Mental";
      suggestedMotivo = "Tratamiento psicofarmacológico crónico (acreditar estabilidad clínica y ausencia de efectos adversos sedativos o psicomotores)";
      reasons.push({
        type: "warn",
        text: `Ap. 15.3 Disp. 219/25 y Ley PBA 15.402: Tratamiento psicofarmacológico estable sin sedación permite Grupo 1 con vigencia anual e informe psiquiátrico.`
      });
    } else if (suenoMental.value === "psicofarmaco_sedante") {
      statusG1 = upgradeStatus(statusG1, "NO_APTO");
      statusG2 = upgradeStatus(statusG2, "NO_APTO");
      suggestedSpecialty = "Psiquiatría / Salud Mental";
      suggestedMotivo = "Sedación farmacológica activa / Descompensación psíquica o consumo problemático";
      reasons.push({
        type: "danger",
        text: `Ap. 15.3/15.4 Disp. 219/25 y Ley PBA 15.402 (Art. 28 ter): Prohibición absoluta de conducir bajo acción de psicotrópicos sedantes o descompensación psíquica.`
      });
    }

    // Cribado Cognitivo / Test del Reloj (Ap. 15.5)
    if (relojEstado.value === "patologico") {
      statusG1 = upgradeStatus(statusG1, "RETENIDO");
      statusG2 = upgradeStatus(statusG2, "NO_APTO");
      suggestedSpecialty = "Neurología";
      suggestedMotivo = "Resultado alterado en prueba de cribado visuoespacial/ejecutivo (Test del Reloj ≤ 6/10 pts) — Solicitud de evaluación neurocognitiva";
      reasons.push({
        type: "danger",
        text: `Ap. 15.5 Disp. 219/25: Cribado cognitivo alterado en el box (Test del Reloj ≤ 6/10). RETENER TRÁMITE, adjuntar hoja dibujada al FUT y solicitar interconsulta con Neurología + Psicología.`
      });
    }

    // Verificación de Certificado de Especialista cuando hay patología crónica compensada
    if (requiresSpecialistCert && certEstado.value === "falta_certificado") {
      if (statusG1 !== "NO_APTO") statusG1 = "RETENIDO";
      if (statusG2 !== "NO_APTO") statusG2 = "RETENIDO";
      reasons.push({
        type: "danger",
        text: `Ap. 10.5 Disp. 219/25 (Auditoría Documental): El postulante presenta patología crónica que exige informe de especialista actualizado (≤ 30 días) con parámetros objetivos, y no lo aporta hoy. RETENER TRÁMITE.`
      });
    }

    // Seguridad documental: DDJJ y DNI
    if (!chkDniVerificado.checked || !chkDdjjFirmada.checked) {
      statusG1 = upgradeStatus(statusG1, "RETENIDO");
      statusG2 = upgradeStatus(statusG2, "RETENIDO");
      reasons.push({
        type: "danger",
        text: `Alerta Penal Art. 293 CP: Es obligatorio verificar el DNI físico y hacer firmar la DDJJ en presencia del médico examinador antes de validar en Si.Na.Li.C.`
      });
    }

    // ========================================================================
    // CONSOLIDACIÓN DEL VEREDICTO GLOBAL Y DESGLOSE DUAL (GRUPO 1 VS GRUPO 2)
    // ========================================================================
    const formatGroupLabel = (st, maxM) => {
      if (st === "APTO") return `✅ APTO (${maxM} meses)`;
      if (st === "APTO_RESTR") return `⚠️ APTO C/ RESTR. O VIG. RED. (${maxM}m)`;
      if (st === "RETENIDO") return `⏸️ RETENIDO (Interconsulta)`;
      return `⛔ NO APTO (Inhabilitado)`;
    };

    if (dualG1Status) {
      dualG1Status.textContent = asksG1
        ? `${formatGroupLabel(statusG1, maxMonthsG1)} [${selectedG1.join(", ") || "B1"}]`
        : "No solicitado";
    }
    if (dualG2Status) {
      dualG2Status.textContent = asksG2
        ? `${formatGroupLabel(statusG2, maxMonthsG2)} [${selectedG2.join(", ")}]`
        : "No solicitado";
    }

    // Determinar el banner global
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
      mainTitle = `DICTAMEN DIVIDIDO: APTO GRUPO 1 (${selectedG1.join(", ")}) / NO APTO GRUPO 2 (${selectedG2.join(", ")})`;
      mainSubtitle = `El postulante cumple el Baremo ANSV para su licencia particular (${selectedG1.join(", ")}), pero presenta una condición inhabilitante para la categoría profesional (${selectedG2.join(", ")}).`;
    } else {
      // Estado combinado de las categorías solicitadas
      let worstRequested = "APTO";
      if (asksG1) worstRequested = upgradeStatus(worstRequested, statusG1);
      if (asksG2) worstRequested = upgradeStatus(worstRequested, statusG2);

      if (worstRequested === "APTO" && effectiveMonths === 60 && restrictions.length === 0) {
        bannerClass = "";
        currentVerdictState.category = "apto";
        mainTitle = `APTO SIN RESTRICCIONES (${subclassesLabel})`;
        mainSubtitle = `Cumple el 100% de los parámetros psicofísicos de las Disposiciones ANSV 219/2025 y 300/2025.`;
      } else if (worstRequested === "APTO" || worstRequested === "APTO_RESTR") {
        bannerClass = "status-warn";
        currentVerdictState.category = "warn";
        const hasReducedVig = (asksG1 && maxMonthsG1 < 60 && age < 65) || requiresSpecialistCert;
        if (restrictions.length > 0 && hasReducedVig) {
          mainTitle = `APTO CON RESTRICCIONES Y VIGENCIA REDUCIDA (${effectiveMonths} MESES)`;
        } else if (restrictions.length > 0) {
          mainTitle = `APTO CON RESTRICCIÓN REGLAMENTARIA (${subclassesLabel})`;
        } else {
          mainTitle = `APTO CON VIGENCIA CONTROLADA (${effectiveMonths} MESES)`;
        }
        mainSubtitle = `Habilitado condicionando el registro en Si.Na.Li.C. a las restricciones y/o plazo de control indicados.`;
      } else if (worstRequested === "RETENIDO") {
        bannerClass = "status-info";
        currentVerdictState.category = "info";
        mainTitle = `TRÁMITE RETENIDO / PENDIENTE DE INTERCONSULTA (Ap. 10.4 / 10.5)`;
        mainSubtitle = `Pausar trámite en Si.Na.Li.C. y entregar Solicitud de Informe a Especialista en ${suggestedSpecialty}.`;
      } else {
        bannerClass = "status-noapto";
        currentVerdictState.category = "noapto";
        mainTitle = `NO APTO PARA CLASE ${subclassesLabel} (Ap. 10.6 Disp. 219/25)`;
        mainSubtitle = `No alcanza los puntos de corte mínimos del Baremo Federal ANSV. Informar derecho a Junta Médica Provincial.`;
      }
    }

    currentVerdictState.suggestedSpecialty = suggestedSpecialty;
    currentVerdictState.suggestedMotivo = suggestedMotivo;

    if (verdictBanner) {
      verdictBanner.className = `verdict-banner ${bannerClass}`.trim();
    }
    if (verdictTitle) verdictTitle.textContent = mainTitle;
    if (verdictSubtitle) verdictSubtitle.textContent = mainSubtitle;
    if (pillVigencia) {
      pillVigencia.textContent = `⏳ Vigencia Máx: ${effectiveMonths} meses (${(effectiveMonths / 12).toFixed(effectiveMonths % 12 === 0 ? 0 : 1)} años)`;
    }
    if (pillRestricciones) {
      pillRestricciones.textContent = restrictions.length
        ? `🔒 Restricciones: ${restrictions.join(" · ")}`
        : "🔒 Restricciones: Ninguna";
    }

    if (reasons.length === 0) {
      reasons.push({
        type: "info",
        text: `Agudeza visual OD ${fracFromDecimal(od)} / OI ${fracFromDecimal(oi)}, audición, TA (${pas}/${pad} mmHg) y motricidad dentro del Baremo ANSV 219/2025 y 300/2025.`
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

    // ========================================================================
    // GENERACIÓN AUTOMÁTICA DE LA EVOLUCIÓN PERICIAL PARA COPIAR AL SI.NA.LI.C.
    // ========================================================================
    const todayStr = new Date().toLocaleDateString("es-AR");
    const identPrefix = name || dni
      ? `Postulante ${name ? name : ""}${dni ? ` (DNI ${dni})` : ""}, ${age} años, concurre con DNI vigente para trámite de ${tramite} Clase [${subclassesLabel}]. `
      : `Postulante de ${age} años concurre con DNI vigente para trámite de ${tramite} Clase [${subclassesLabel}]. `;

    const ddjjText = `Suscribe Declaración Jurada de Salud (DDJJ) en mi presencia. `;
    const corrLabel =
      avCorreccion.value === "lentes_aereos"
        ? "con corrección óptica (lentes aéreos)"
        : avCorreccion.value === "lentes_contacto"
        ? "con lentes de contacto"
        : "sin corrección óptica";

    const visionText = `Evaluación visual (Ap. 15.1 Disp. ANSV 219/2025): AV OD ${fracFromDecimal(od)} / OI ${fracFromDecimal(oi)} ${corrLabel}; campo visual (${visCampo.options[visCampo.selectedIndex].text.split("(")[0].trim()}) y respuesta al encandilamiento evaluados. `;
    const audioText = `Capacidad auditiva (Disp. ANSV 300/2025): ${audicionEstado.options[audicionEstado.selectedIndex].text}. `;
    const vitalText = `Examen clínico y osteomioarticular: TA en box ${pas}/${pad} mmHg; motricidad y fuerza prensil: ${locomotorEstado.options[locomotorEstado.selectedIndex].text.split("(")[0].trim()}. `;

    let certAttachmentText = "";
    if (certEstado.value === "presenta_valido") {
      const esp = (certEspecialidad.value || suggestedSpecialty).trim();
      const med = (certMedico.value || "Especialista matriculado").trim();
      const res = (certResumen.value || "paciente clínicamente compensado, adherente al tratamiento y sin descompensaciones agudas").trim();
      certAttachmentText = `Aporta certificado de especialista en ${esp} (${med}), quien informa ${res}; se sella y adjunta copia fiel al legajo físico/digital en fecha ${todayStr}. `;
    }

    let closingDictamen = "";
    if (isDualSplit) {
      closingDictamen = `DICTAMEN DESDOBLADO (Disp. ANSV 219/2025): 1) Se otorga APTO ${restrictions.length ? `CON RESTRICCIONES (${restrictions.join("; ")})` : ""} para Categoría Particular Grupo 1 [${selectedG1.join(", ")}] por ${maxMonthsG1} meses. 2) Se dictamina NO APTO para Categoría Profesional Grupo 2 [${selectedG2.join(", ")}] por no alcanzar el punto de corte reglamentario federal, notificándose su derecho a revisión por Junta Médica Provincial (Dto. 532/09 Anexo II).`;
    } else if (currentVerdictState.category === "apto") {
      closingDictamen = `Examen psíquico vigil y orientado globalmente. Cumple la totalidad de los criterios del Baremo ANSV (Disp. 219/2025 y 300/2025). DICTAMEN: APTO para Clase [${subclassesLabel}] (Vigencia: ${effectiveMonths} meses).`;
    } else if (currentVerdictState.category === "warn") {
      const restrStr = restrictions.length ? ` Restricciones obligatorias en sistema: ${restrictions.join(" + ")}.` : "";
      closingDictamen = `Cumple criterios del Baremo ANSV (Disp. 219/2025 y 300/2025) bajo control evolutivo (Arts. 14 y 20 Ley 24.449 / Dto. 196/2025). DICTAMEN: APTO ${restrictions.length ? "CON RESTRICCIÓN" : "CON VIGENCIA CONTROLADA"} para Clase [${subclassesLabel}] por el plazo de ${effectiveMonths} meses.${restrStr}`;
    } else if (currentVerdictState.category === "info") {
      closingDictamen = `SE RETIENE TRÁMITE / PENDIENTE DE APTITUD MÉDICA (Ap. 10.4 y 10.5 Disp. ANSV 219/2025). Atento a constatarse [${suggestedMotivo || "hallazgo clínico que requiere valoración especializada"}], se hace entrega de solicitud de interconsulta para especialista en ${suggestedSpecialty} con parámetros objetivos obligatorios. Queda el trámite pausado hasta la presentación de dicha documentación.`;
    } else {
      closingDictamen = `DICTAMEN: NO APTO para Clase [${subclassesLabel}] (Ap. 10.6 y 11 Disp. ANSV 219/2025). Los parámetros objetivados no alcanzan los cortes mínimos de seguridad vial exigidos por el Baremo Nacional para la categoría solicitada. Se informa al postulante su derecho a solicitar evaluación ante la Junta Médica Provincial (Dto. PBA 532/09 Anexo II).`;
    }

    if (evolutionOutput) {
      evolutionOutput.value = `${identPrefix}${ddjjText}${visionText}${audioText}${vitalText}${certAttachmentText}${closingDictamen}`;
    }

    // Sincronizar también la vista previa de formularios imprimibles
    renderPrintableSheet();
  }

  // Escuchar cambios en todos los inputs del evaluador
  const allEvalInputs = document.querySelectorAll(
    "#tab-evaluador input, #tab-evaluador select"
  );
  allEvalInputs.forEach((el) => {
    el.addEventListener("input", evaluatePatient);
    el.addEventListener("change", evaluatePatient);
  });

  // Botón de Copiar Evolución Pericial
  const btnCopyEvolution = document.getElementById("btn-copy-evolution");
  if (btnCopyEvolution && evolutionOutput) {
    btnCopyEvolution.addEventListener("click", () => {
      const text = evolutionOutput.value.trim();
      if (!text) return;
      const done = () => {
        const orig = btnCopyEvolution.textContent;
        btnCopyEvolution.textContent = "✓ Evolución Copiada al Portapapeles (Lista para pegar)";
        btnCopyEvolution.classList.add("copied");
        setTimeout(() => {
          btnCopyEvolution.textContent = orig;
          btnCopyEvolution.classList.remove("copied");
        }, 2200);
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

  // Botón de Registrar en Contador del Turno
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
      btnLogPatient.textContent = "✓ Sumado al Turno Hoy";
      setTimeout(() => {
        btnLogPatient.textContent = orig;
      }, 1500);
    });
  }

  // ==========================================================================
  // 5. PRESETS DE ESCENARIOS RÁPIDOS Y BOTÓN "NUEVO POSTULANTE"
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
    taPas.value = "124";
    taPad.value = "78";
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
  }

  const presetButtons = document.querySelectorAll("[data-preset]");
  presetButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const preset = btn.getAttribute("data-preset");
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
        visCampo.value = "monocular_adaptado";
        certEstado.value = "presenta_valido";
        certEspecialidad.value = "Oftalmología";
        certMedico.value = "Dr. Ramiro Funes M.P. 221.400";
        certResumen.value = "Visión monocular > 6 meses de adaptación, AV OD 9/10, campo visual y visión nocturna normales";
      } else if (preset === "hta_box") {
        ptAge.value = "58";
        taPas.value = "188";
        taPad.value = "112";
      } else if (preset === "dbt_insulina") {
        ptAge.value = "49";
        dbtEstado.value = "dbt_insulina";
        certEstado.value = "presenta_valido";
        certEspecialidad.value = "Endocrinología y Diabetología";
        certMedico.value = "Dra. Valeria Sosa M.P. 118.920";
        certResumen.value = "DBT tipo 1 compensada, HbA1c 6.9%, automonitoreo diario y 0 hipoglucemias severas en los últimos 12 meses";
      } else if (preset === "adulto_mayor_75") {
        ptAge.value = "76";
        relojEstado.value = "patologico";
      } else if (preset === "cdi_profesional") {
        ptAge.value = "54";
        subclassChecks.forEach((cb) => {
          cb.checked = cb.value === "B1" || cb.value === "C1";
        });
        cardioEstado.value = "cdi";
        certEstado.value = "presenta_valido";
        certEspecialidad.value = "Cardiología / Electrofisiología";
        certMedico.value = "Dr. Martín Pereyra M.P. 112.045";
        certResumen.value = "CDI normofuncionante, > 9 meses libre de descargas y sin síncopes";
      }

      evaluatePatient();
    });
  });

  const btnNewPatient = document.getElementById("btn-new-patient");
  if (btnNewPatient) {
    btnNewPatient.addEventListener("click", () => {
      resetFormToDefault();
      evaluatePatient();
    });
  }

  // ==========================================================================
  // 6. PESTAÑA 2: BASE DE DATOS DE BAREMOS Y MEDICAMENTOS (CONSULTA EN 2 SEG)
  // ==========================================================================
  const BAREMO_DB = [
    {
      title: "Agudeza Visual Binocular (Cortes Snellen)",
      cat: "Visual",
      keywords: "vision agudeza visual snellen lentes anteojos miopia astigmatismo 0.6 0.8 6/10 8/10",
      g1: "Mínimo 6/10 (0,6) en mejor ojo y 2/10 (0,2) en peor ojo (o ≥ 0,5 en cada ojo), con o sin corrección.",
      g2: "Mínimo 8/10 (0,8) en mejor ojo y 5/10 (0,5) en peor ojo, con o sin corrección óptica.",
      req: "Si alcanza el corte usando anteojos o lentes de contacto, tildar obligatorio 'Con corrección óptica'. Si olvidó los lentes, RETENER.",
      link: "../Normativa%20y%20Manuales%20de%20la%20Agencia%20Nacional%20de%20Seguridad%20Vial%20(ANSV)/Disposicion_ANSV_219_2025_Manual_y_Baremos_Psicofisicos_norma.htm#baremo-visual",
      normaLabel: "Ap. 15.1 Disp. ANSV 219/2025"
    },
    {
      title: "Visión Monocular (AV < 1/10 en un ojo)",
      cat: "Visual",
      keywords: "monocular ojo unico amaurosis tuerto protesis ocular espejos panoramicos",
      g1: "APTO C/ RESTRICCIÓN si lleva ≥ 6 meses de pérdida, AV en ojo único ≥ 8/10 (0,8), CV normal (≥ 50° nasal / 70° temporal) y visión nocturna conservada.",
      g2: "NO APTO (Inhabilitante absoluto para Clases C, D y E).",
      req: "En Grupo 1 exigir certificado oftalmológico e imponer: 2 espejos laterales panorámicos + espejo interno panorámico + lentes protectores (o casco integral en motos).",
      link: "../Normativa%20y%20Manuales%20de%20la%20Agencia%20Nacional%20de%20Seguridad%20Vial%20(ANSV)/Disposicion_ANSV_219_2025_Manual_y_Baremos_Psicofisicos_norma.htm#baremo-visual",
      normaLabel: "Ap. 15.1 Disp. ANSV 219/2025"
    },
    {
      title: "Cirugía de Catarata (Pseudofaquia) y Encandilamiento",
      cat: "Visual",
      keywords: "catarata lente intraocular lio pseudofaquia encandilamiento deslumbramiento cirugia refractiva",
      g1: "Apto tras alta oftalmológica posoperatoria (usualmente 30 días), alcanzando corte 0,6 y buena recuperación al encandilamiento.",
      g2: "Apto tras recuperación documentada, alcanzando 0,8 / 0,5 sin deslumbramiento ni diplopía.",
      req: "Si presenta catarata bilateral no operada con encandilamiento patológico o AV < corte, retener trámite y derivar a Oftalmología.",
      link: "../Normativa%20y%20Manuales%20de%20la%20Agencia%20Nacional%20de%20Seguridad%20Vial%20(ANSV)/Disposicion_ANSV_219_2025_Manual_y_Baremos_Psicofisicos_norma.htm#baremo-visual",
      normaLabel: "Ap. 15.1 Disp. ANSV 219/2025"
    },
    {
      title: "Diplopía, Estrabismo y Hemianopsias (Campo Visual)",
      cat: "Visual",
      keywords: "diplopia vision doble estrabismo hemianopsia cuadrantopsia campo visual glaucoma",
      g1: "Diplopía activa o hemianopsia es NO APTO (salvo diplopía ocluida con ≥ 6 meses de adaptación evaluada como monocular).",
      g2: "NO APTO absoluto toda diplopía, reducción concéntrica o defecto campimétrico.",
      req: "Ante sospecha en campimetría por confrontación, retener y pedir Campo Visual Computadorizado binocular.",
      link: "../Normativa%20y%20Manuales%20de%20la%20Agencia%20Nacional%20de%20Seguridad%20Vial%20(ANSV)/Disposicion_ANSV_219_2025_Manual_y_Baremos_Psicofisicos_norma.htm#baremo-visual",
      normaLabel: "Ap. 15.1 Disp. ANSV 219/2025"
    },
    {
      title: "Hipoacusia, Anacusia y Uso de Otoamplífono",
      cat: "Auditivo",
      keywords: "audicion sordera hipoacusia anacusia audifono otoamplifono implante coclear 300/2025",
      g1: "Con audífono: Apto c/ restricción 'Uso de otoamplífono'. Hipoacusia severa/anacusia bilateral: Apto Clases A y B con espejos laterales convexos duales + interno panorámico.",
      g2: "Alcanzando umbral con otoamplífono: Apto con control audiométrico. Anacusia / hipoacusia profunda: NO APTO para transporte de pasajeros/emergencia (D/E).",
      req: "Regido por la nueva Disposición ANSV 300/2025 que actualizó el Apartado 15.2.",
      link: "../Normativa%20y%20Manuales%20de%20la%20Agencia%20Nacional%20de%20Seguridad%20Vial%20(ANSV)/Disposicion_ANSV_300_2025_Baremo_Capacidad_Auditiva_norma.htm",
      normaLabel: "Disposición ANSV 300/2025"
    },
    {
      title: "Hipertensión Arterial (HTA) en Consultorio (≥ 180/110 mmHg)",
      cat: "Cardiovascular",
      keywords: "hipertension presion alta hta crisis hipertensiva 180 110 ta",
      g1: "HTA compensada: Apto. Si en el box presenta TA ≥ 180/110 mmHg o síntomas: RETENER TRÁMITE.",
      g2: "Exige control tensional estricto sin cardiopatía hipertensiva descompensada. Si ≥ 180/110 mmHg: RETENER.",
      req: "Nunca otorgar el apto con cifras ≥ 180/110 mmHg en el acto; derivar para ajuste terapéutico y pedir informe cardiológico.",
      link: "../Normativa%20y%20Manuales%20de%20la%20Agencia%20Nacional%20de%20Seguridad%20Vial%20(ANSV)/Disposicion_ANSV_219_2025_Manual_y_Baremos_Psicofisicos_norma.htm#baremo-cardiovascular",
      normaLabel: "Ap. 15.7 Disp. ANSV 219/2025"
    },
    {
      title: "Insuficiencia Cardíaca (Clasificación NYHA y FEVI)",
      cat: "Cardiovascular",
      keywords: "insuficiencia cardiaca nyha fevi ecocardiograma disnea cardiopatia isquemica infarto iam",
      g1: "NYHA I y II compensadas: Apto con vigencia reducida (12–24m). NYHA III y IV: NO APTO.",
      g2: "NYHA I con FEVI conservada: Apto anual con informe cardiológico. NYHA II, III y IV: NO APTO.",
      req: "Exigir certificado cardiológico con Ecocardiograma (FEVI), Clase Funcional NYHA, ergometría y ausencia de síncopes.",
      link: "../Normativa%20y%20Manuales%20de%20la%20Agencia%20Nacional%20de%20Seguridad%20Vial%20(ANSV)/Disposicion_ANSV_219_2025_Manual_y_Baremos_Psicofisicos_norma.htm#baremo-cardiovascular",
      normaLabel: "Ap. 15.7 Disp. ANSV 219/2025"
    },
    {
      title: "Marcapasos Definitivo y Cardiodesfibrilador (CDI)",
      cat: "Cardiovascular",
      keywords: "marcapasos cdi cardiodesfibrilador implantable arritmia sincope electrofisiologia",
      g1: "Marcapasos: Apto vig. reducida (1–3 años) posimplante sin síncopes. CDI: Apto ANUAL solo tras ≥ 6 meses sin descargas.",
      g2: "Marcapasos: evaluación restrictiva anual con telemetría normal. CDI: NO APTO (Inhabilitante absoluto en Grupo 2).",
      req: "Exigir informe de cardiólogo/electrofisiólogo con control de telemetría reciente del dispositivo.",
      link: "../Normativa%20y%20Manuales%20de%20la%20Agencia%20Nacional%20de%20Seguridad%20Vial%20(ANSV)/Disposicion_ANSV_219_2025_Manual_y_Baremos_Psicofisicos_norma.htm#baremo-cardiovascular",
      normaLabel: "Ap. 15.7 Disp. ANSV 219/2025"
    },
    {
      title: "Epilepsia y Crisis Convulsivas",
      cat: "Neurológico",
      keywords: "epilepsia convulsiones crisis comicial levetiracetam valproato fenitoina lamotrigina eeg",
      g1: "APTO VIGENCIA ANUAL acreditando mínimo 12 meses libre de crisis, con informe neurológico, EEG y adherencia terapéutica sin sedación.",
      g2: "NO APTO (exige 5 a 10 años libre de crisis SIN medicación antiepiléptica y con EEG normal).",
      req: "Certificado neurológico debe especificar fecha exacta de última crisis, tipo de epilepsia, fármaco y tolerancia.",
      link: "../Normativa%20y%20Manuales%20de%20la%20Agencia%20Nacional%20de%20Seguridad%20Vial%20(ANSV)/Disposicion_ANSV_219_2025_Manual_y_Baremos_Psicofisicos_norma.htm#baremo-nervioso",
      normaLabel: "Ap. 15.8 Disp. ANSV 219/2025"
    },
    {
      title: "ACV / AIT, Enfermedad de Parkinson y Vértigo",
      cat: "Neurológico",
      keywords: "acv ait ictus hemiparesia parkinson temblor vertigo meniere",
      g1: "AIT/ACV estabilizado: Apto vigencia reducida (12m) con alta neurológica (y adaptación Clase F si dejó secuela motora). Vértigo activo: No Apto.",
      g2: "Enfermedad de Parkinson, secuelas de ACV o síndrome vertiginoso recurrente: NO APTO.",
      req: "Evaluar fuerza prensil, coordinación índice-nariz, campo visual (descartar hemianopsia pos-ACV) y cognición.",
      link: "../Normativa%20y%20Manuales%20de%20la%20Agencia%20Nacional%20de%20Seguridad%20Vial%20(ANSV)/Disposicion_ANSV_219_2025_Manual_y_Baremos_Psicofisicos_norma.htm#baremo-nervioso",
      normaLabel: "Ap. 15.8 Disp. ANSV 219/2025"
    },
    {
      title: "Diabetes Mellitus (Tratamiento Oral vs. Insulina)",
      cat: "Endócrino",
      keywords: "diabetes dbt insulina metformina hipoglucemia hba1c glucemia",
      g1: "Oral compensada: Apto vigencia controlada. Insulino-tratado: APTO VIGENCIA REDUCIDA (12 a 24 meses) sin hipoglucemias severas en los últimos 12 meses.",
      g2: "Oral compensada: Apto anual con control estricto. Insulino-dependiente: NO APTO en regla general (salvo dictamen excepcional de Junta Médica).",
      req: "Certificado diabetológico con HbA1c, fondo de ojo, automonitoreo y constancia de 0 hipoglucemias graves en 12 meses.",
      link: "../Normativa%20y%20Manuales%20de%20la%20Agencia%20Nacional%20de%20Seguridad%20Vial%20(ANSV)/Disposicion_ANSV_219_2025_Manual_y_Baremos_Psicofisicos_norma.htm#baremo-endocrino",
      normaLabel: "Ap. 15.9 Disp. ANSV 219/2025"
    },
    {
      title: "Síndrome de Apnea Obstructiva del Sueño (SAOS) y CPAP",
      cat: "Sueño y Mental",
      keywords: "apnea sueno saos sahos cpap ronquido obesidad somnolencia epworth stop bang",
      g1: "SAOS moderado/severo sin tratar: RETENER. En tratamiento con CPAP eficaz: Apto vigencia reducida (12–24 meses).",
      g2: "Exigencia máxima: Apto ANUAL solo con informe neumonológico y reporte objetivo de uso del CPAP sin somnolencia diurna.",
      req: "En obesidad mórbida (IMC ≥ 35) o cuello ancho en choferes profesionales, aplicar STOP-BANG y Epworth en el box.",
      link: "../Normativa%20y%20Manuales%20de%20la%20Agencia%20Nacional%20de%20Seguridad%20Vial%20(ANSV)/Disposicion_ANSV_219_2025_Manual_y_Baremos_Psicofisicos_norma.htm#baremo-otros",
      normaLabel: "Ap. 15.10 Disp. ANSV 219/2025"
    },
    {
      title: "Psicofármacos, Benzodiacepinas y Salud Mental (Ley 15.402)",
      cat: "Sueño y Mental",
      keywords: "clonazepam alprazolam lorazepam diazepam quetiapina risperidona antidepresivos sertralina psiquiatria alcohol cero",
      g1: "Cuadro compensado sin sedación: Apto vigencia reducida (12m) con informe psiquiátrico. Sedación activa o psicosis descompensada: NO APTO.",
      g2: "Uso de benzodiacepinas sedantes, antipsicóticos o trastornos psiquiátricos mayores: NO APTO.",
      req: "La Ley PBA 15.402 (Art. 28 ter) prohíbe conducir bajo acción de medicamentos que disminuyan la aptitud psicofísica.",
      link: "../Marco%20Legal%20de%20la%20Provincia%20de%20Buenos%20Aires/Ley_Provincial_15402_Alcohol_Cero_al_Volante_PBA.html",
      normaLabel: "Ap. 15.3 Disp. 219/25 · Ley PBA 15.402"
    },
    {
      title: "Adultos Mayores (≥ 70 años) y Deterioro Cognitivo (Test del Reloj)",
      cat: "Sueño y Mental",
      keywords: "adulto mayor anciano 70 anos demencia alzheimer deterioro cognitivo test del reloj bradipsiquia",
      g1: "Renovación ANUAL obligatoria desde los 70 años. Si Test del Reloj ≤ 6/10 pts o desorientación: RETENER y pedir Neurología + Neuropsicología.",
      g2: "Exigencia psicofísica anual estricta; ante mínimo deterioro ejecutivo o enlentecimiento psicomotor: NO APTO.",
      req: "Abrochar siempre la hoja dibujada del reloj (firmada y fechada) al formulario FUT como respaldo pericial.",
      link: "../Normativa%20y%20Manuales%20de%20la%20Agencia%20Nacional%20de%20Seguridad%20Vial%20(ANSV)/Disposicion_ANSV_219_2025_Manual_y_Baremos_Psicofisicos_norma.htm#baremo-mental",
      normaLabel: "Ap. 15.5 Disp. 219/25 · Dto. 196/2025"
    },
    {
      title: "Discapacidad Motora, Amputaciones, CUD y Clase F",
      cat: "Locomotor",
      keywords: "discapacidad cud amputacion hemiplejia paraplejia clase f caja automatica pomo volante protesis",
      g1: "Poseer CUD no inhabilita: Apto con Adaptación Vehicular (Clase F / B adaptada) previa prueba funcional en auto adaptado.",
      g2: "NO APTO cuando el déficit compromete la conducción profesional de cargas o transporte público.",
      req: "Consignar los accesorios exactos en el dictamen: caja automática, pomo giratorio, freno/acelerador manual o pedalera invertida.",
      link: "../Normativa%20y%20Manuales%20de%20la%20Agencia%20Nacional%20de%20Seguridad%20Vial%20(ANSV)/Disposicion_ANSV_219_2025_Manual_y_Baremos_Psicofisicos_norma.htm#baremo-locomotor",
      normaLabel: "Ap. 15.6 Disp. 219/25 · Ley 22.431"
    },
    {
      title: "Insuficiencia Renal Crónica y Hemodiálisis",
      cat: "Endócrino",
      keywords: "renal dialisis hemodialisis trasplante nefropatia",
      g1: "En hemodiálisis estable: Apto vigencia anual con certificado nefrológico (recomendación de no conducir en el posdiálisis inmediato por hipotensión).",
      g2: "En programa de hemodiálisis crónica: NO APTO para Grupo 2 Profesional.",
      req: "Exigir informe de Nefrología acreditando estabilidad hemodinámica, hematocrito y ausencia de encefalopatía/arritmias.",
      link: "../Normativa%20y%20Manuales%20de%20la%20Agencia%20Nacional%20de%20Seguridad%20Vial%20(ANSV)/Disposicion_ANSV_219_2025_Manual_y_Baremos_Psicofisicos_norma.htm#baremo-otros",
      normaLabel: "Ap. 15.10 Disp. ANSV 219/2025"
    },
    {
      title: "Falsedad Ideológica de Instrumento Público (Art. 293 Código Penal)",
      cat: "Locomotor",
      keywords: "penal delito falsedad ideologica art 293 295 certificado falso favor politico",
      g1: "Pena de 1 a 6 años de prisión e inhabilitación absoluta al funcionario/médico que inserte declaraciones falsas en un instrumento público (FUT / Si.Na.Li.C.).",
      g2: "Idéntica responsabilidad penal agravada por tratarse de transporte público o de cargas.",
      req: "Regla innegociable: Jamás validar en sistema ni sellar un FUT sin haber examinado presencialmente al postulante con su DNI en mano.",
      link: "../Marco%20Legal%20Nacional/Codigo_Penal_Ley_11179_Texto_Actualizado.html#art-293",
      normaLabel: "Arts. 292, 293 y 295 Código Penal"
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

    if (filtered.length === 0) {
      baremoCardsContainer.innerHTML = `
        <div class="panel-card" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
          <strong>No se encontraron coincidencias para "${q}".</strong>
          <p style="font-size: 0.84rem; color: var(--text-muted); margin-top: 0.35rem;">Probá buscando por órgano o condición general (ej.: visión, insulina, marcapasos, epilepsia, audífono).</p>
        </div>
      `;
      return;
    }

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
              <strong style="color: #166534;">🟢 Grupo 1 (A, B, G)</strong>
              <span>${item.g1}</span>
            </div>
            <div class="b-col">
              <strong style="color: #9a3412;">🟠 Grupo 2 (C, D, E)</strong>
              <span>${item.g2}</span>
            </div>
          </div>
          <div class="baremo-req-note">
            <strong>📌 Conducta y Documentación:</strong> ${item.req}
          </div>
          <div class="baremo-card-footer">
            <small style="color: var(--text-muted); font-weight: 600;">${item.normaLabel}</small>
            <a href="${item.link}" target="_blank" class="link-norma-direct">Abrir Norma Oficial ↗</a>
          </div>
        </article>
      `
      )
      .join("");
  }

  if (baremoSearchInput) {
    baremoSearchInput.addEventListener("input", renderBaremoCards);
  }
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
  // 7. PESTAÑA 3: CALCULADORAS INTERACTIVAS (STOP-BANG Y TEST DEL RELOJ)
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
      sbOutput.innerHTML = `<strong style="color: #166534;">Puntaje STOP-BANG: ${score}/8 — Bajo Riesgo de SAOS</strong><p style="font-size: 0.78rem; margin-top: 0.25rem;">Continuar evaluación habitual sin necesidad de polisomnografía.</p>`;
    } else if (score <= 4) {
      sbOutput.innerHTML = `<strong style="color: #92400e;">Puntaje STOP-BANG: ${score}/8 — Riesgo Intermedio de SAOS</strong><p style="font-size: 0.78rem; margin-top: 0.25rem;">En choferes profesionales (Grupo 2: C, D, E) o con somnolencia diurna, retener y solicitar evaluación por Neumonología.</p>`;
    } else {
      sbOutput.innerHTML = `<strong style="color: #991b1b;">Puntaje STOP-BANG: ${score}/8 — ALTO RIESGO de SAOS Moderado/Severo</strong><p style="font-size: 0.78rem; margin-top: 0.25rem;">RETENER TRÁMITE: Solicitar Polisomnografía e informe neumonológico antes de otorgar aptitud.</p>`;
    }
  }

  sbChecks.forEach((c) => c.addEventListener("change", updateStopBangTool));
  if (btnApplyStopBang) {
    btnApplyStopBang.addEventListener("click", () => {
      suenoMental.value = currentStopBangScore >= 3 ? "saos_sospecha" : "normal";
      evaluatePatient();
      switchTab("tab-evaluador");
    });
  }

  // Calculadora del Test del Reloj (Cacho / Sundström)
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
    if (currentClockScore >= 7) {
      clockOutput.innerHTML = `<strong style="color: #166534;">Puntaje Total: ${currentClockScore}/10 puntos — NORMAL (Corte ≥ 7 pts)</strong><p style="font-size: 0.78rem; margin-top: 0.25rem;">Sin evidencia de deterioro visuoespacial/ejecutivo en el cribado rápido.</p>`;
    } else {
      clockOutput.innerHTML = `<strong style="color: #991b1b;">Puntaje Total: ${currentClockScore}/10 puntos — PATOLÓGICO (≤ 6 pts)</strong><p style="font-size: 0.78rem; margin-top: 0.25rem;">RETENER TRÁMITE: Adjuntar hoja del reloj al FUT y solicitar interconsulta con Neurología y Evaluación Neuropsicológica.</p>`;
    }
  }

  clockInputs.forEach((inp) => inp.addEventListener("change", updateClockTool));
  if (btnApplyClock) {
    btnApplyClock.addEventListener("click", () => {
      relojEstado.value = currentClockScore >= 7 ? "normal" : "patologico";
      evaluatePatient();
      switchTab("tab-evaluador");
    });
  }

  // ==========================================================================
  // 8. PESTAÑA 4: GENERADOR DE HOJAS OFICIALES IMPRIMIBLES (INTERCONSULTA Y RELOJ)
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
      "1. Diagnóstico cardiológico actualizado, Clase Funcional (NYHA I a IV) y tiempo de evolución.",
      "2. Resultados de ECG y Ecocardiograma Doppler recientes (informando Fracción de Eyección - FEVI).",
      "3. En portadores de Marcapasos o CDI: informe de telemetría actual y constancia de ausencia de descargas o síncopes en los últimos 6 meses.",
      "4. Esquema farmacológico actual, estabilidad de cifras tensionales y ausencia de angina, arritmias malignas o episodios sincopales."
    ],
    "Oftalmología": [
      "1. Diagnóstico oftalmológico y agudeza visual (escala Snellen) en Ojo Derecho, Ojo Izquierdo y Binocular, sin y con corrección óptica.",
      "2. Campo visual binocular (normal ≥ 120°, descartando hemianopsias, cuadrantopsias o escotomas centrales) y motilidad ocular (ausencia de diplopía).",
      "3. En Visión Monocular (Grupo 1): constancia expresa de antigüedad ≥ 6 meses de adaptación, AV en ojo único ≥ 8/10 (0,8), campo visual normal (≥ 50° nasal y ≥ 70° temporal) y visión nocturna conservada.",
      "4. Tolerancia al encandilamiento y estado de medios transparentes (cristalino / pseudofaquia)."
    ],
    "Neurología": [
      "1. Diagnóstico neurológico preciso, tiempo de evolución y examen motor/coordinativo actual.",
      "2. En antecedente de Epilepsia / Crisis Convulsivas: fecha exacta de la última crisis (Grupo 1 exige ≥ 12 meses libre de crisis), resultado de EEG reciente y adherencia terapéutica.",
      "3. En Adultos Mayores o sospecha cognitiva: valoración neurocognitiva / ejecutiva para conducción segura.",
      "4. Esquema farmacológico actual y constancia de ausencia de efectos adversos sedativos, diplopía o síndrome vertiginoso activo."
    ],
    "Endocrinología / Diabetología": [
      "1. Tipo de Diabetes Mellitus, tiempo de evolución y esquema terapéutico actual (oral vs. insulino-tratado).",
      "2. Valor de Hemoglobina Glicosilada (HbA1c) reciente y adherencia al automonitoreo glucémico.",
      "3. Constancia expresa de AUSENCIA de episodios de hipoglucemia severa (que hayan requerido asistencia de terceros) en los últimos 12 meses.",
      "4. Reconocimiento conservado de síntomas de alarma hipoglucémica y ausencia de complicaciones visuales/neuropáticas incapacitantes."
    ],
    "Neumonología / Medicina del Sueño": [
      "1. Evaluación diagnóstica de Síndrome de Apnea Obstructiva del Sueño (SAOS) y resultado de Polisomnografía / Poligrafía respiratoria (IAH).",
      "2. Si utiliza CPAP: reporte objetivo descargado del equipo acreditando cumplimiento horario adecuado (≥ 4 hs/noche en > 70% de las noches).",
      "3. Constancia expresa de control de la somnolencia diurna excesiva (Escala de Epworth normalizada)."
    ],
    "Otorrinolaringología / Audiología": [
      "1. Diagnóstico audiológico y Audiometría Tonal actualizada en ambos oídos (Disposición ANSV Nº 300/2025).",
      "2. Ganancia auditiva funcional con el uso de otoamplífono (audífono) para alcanzar el umbral conversacional reglamentario.",
      "3. Constancia de ausencia de síndrome vertiginoso periférico en actividad."
    ],
    "Psiquiatría / Salud Mental": [
      "1. Diagnóstico psicopatológico actualizado conforme DSM/CIE, evolución y estabilidad clínica actual (Ap. 15.3 Disp. ANSV 219/2025).",
      "2. Esquema psicofarmacológico detallado (dosis y horarios) y adherencia al tratamiento.",
      "3. Constancia expresa de ausencia de efectos adversos sedativos, somnolencia o enlentecimiento psicomotor (Ley PBA 15.402 Art. 28 ter), así como ausencia de auto o heteroagresividad."
    ]
  };

  function renderPrintableSheet() {
    if (!printableSheetContainer) return;
    const mode = sheetTypeSelect ? sheetTypeSelect.value : "interconsulta";
    if (groupInterconsultaEsp) {
      groupInterconsultaEsp.style.display = mode === "interconsulta" ? "flex" : "none";
    }

    const todayStr = new Date().toLocaleDateString("es-AR");
    const name = (ptName.value || "____________________________________").trim();
    const dni = (ptDni.value || "__________________").trim();
    const age = (ptAge.value || "____").trim();

    const selectedClasses = [];
    let hasG2 = false;
    subclassChecks.forEach((cb) => {
      if (cb.checked) {
        selectedClasses.push(cb.value);
        if (cb.getAttribute("data-group") === "2") hasG2 = true;
      }
    });
    const classesStr = selectedClasses.length ? selectedClasses.join(", ") : "B1";
    const groupLabel = hasG2 ? "Grupo 2 (Licencia Profesional)" : "Grupo 1 (Licencia Particular)";

    if (mode === "interconsulta") {
      const esp = interconsultaEspSelect ? interconsultaEspSelect.value : "Cardiología";
      const motivo =
        (interconsultaMotivoInput && interconsultaMotivoInput.value.trim()) ||
        currentVerdictState.suggestedMotivo ||
        "Valoración clínica especializada para determinar aptitud psicofísica vial conforme Baremo ANSV.";
      const reqList = ESPECIALIDAD_REQUIREMENTS[esp] || ESPECIALIDAD_REQUIREMENTS["Cardiología"];

      printableSheetContainer.innerHTML = `
        <div class="sheet-official-header">
          <div>
            <h2>CENTRO EMISOR DE LICENCIAS DE CONDUCIR – MUNICIPALIDAD DE AVELLANEDA</h2>
            <p>Sistema Nacional de Licencias de Conducir (Si.Na.Li.C.) · Provincia de Buenos Aires</p>
          </div>
          <div style="text-align: right; font-size: 0.8rem;">
            <strong>Fecha:</strong> ${todayStr}<br/>
            <span>Disp. ANSV Nº 219/2025 y 300/2025</span>
          </div>
        </div>

        <h3 style="font-size: 1rem; margin-bottom: 0.65rem; text-transform: uppercase;">
          Solicitud de Informe Médico Especializado (${esp})
        </h3>

        <div style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 0.65rem 0.85rem; border-radius: 6px; font-size: 0.85rem; margin-bottom: 0.9rem;">
          <div><strong>Postulante:</strong> ${name} &nbsp;|&nbsp; <strong>DNI Nº:</strong> ${dni} &nbsp;|&nbsp; <strong>Edad:</strong> ${age} años</div>
          <div style="margin-top: 0.25rem;"><strong>Categoría Solicitada:</strong> Clase ${classesStr} — <strong>${groupLabel}</strong></div>
          <div style="margin-top: 0.25rem;"><strong>Motivo de la Solicitud / Hallazgo en Box:</strong> ${motivo}</div>
        </div>

        <p style="font-size: 0.84rem; margin-bottom: 0.6rem;">
          <strong>Estimado/a Colega Especialista en ${esp}:</strong><br/>
          El ciudadano de referencia se encuentra tramitando su Licencia Nacional de Conducir. Conforme al <strong>Apartado 10.5 de la Disposición ANSV Nº 219/2025</strong>, los certificados que solo consignan <em>"Apto para conducir"</em> carecen de validez administrativa para la auditoría del legajo. Le solicitamos tenga a bien informar con letra clara, fecha (vigencia ≤ 30 días), firma y sello con matrícula profesional los siguientes <strong>parámetros objetivos</strong>:
        </p>

        <ul style="list-style: none; padding-left: 0; font-size: 0.84rem; display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1rem;">
          ${reqList.map((item) => `<li style="padding: 0.35rem 0.6rem; border-left: 3px solid #0f172a; background: #f8fafc;">${item}</li>`).join("")}
        </ul>

        <div style="border: 1px solid #94a3b8; border-radius: 6px; padding: 0.7rem; min-height: 115px; font-size: 0.78rem; color: #475569;">
          <strong>Espacio opcional para respuesta del Médico Especialista Externo (o en recetario membretado adjunto):</strong>
        </div>

        <p style="font-size: 0.75rem; color: #334155; margin-top: 0.6rem;">
          <em>Nota legal: El presente informe revestirá carácter de documento adjunto al legajo oficial del Sistema Nacional de Licencias de Conducir (Ley 24.449, Ley PBA 13.927 y Dto. 532/09). La determinación final de la aptitud vial y sus restricciones es competencia pericial del Médico Examinador conforme a los puntos de corte de la ANSV.</em>
        </p>

        <div class="signature-boxes-row">
          <div class="sig-line">Firma y Sello del Médico Examinador CEL Avellaneda</div>
          <div class="sig-line">Firma del Postulante (Notificado de Trámite Pendiente)</div>
        </div>
      `;
    } else {
      // Hoja Oficial del Test del Reloj
      printableSheetContainer.innerHTML = `
        <div class="sheet-official-header">
          <div>
            <h2>CENTRO EMISOR DE LICENCIAS DE CONDUCIR – MUNICIPALIDAD DE AVELLANEDA</h2>
            <p>Anexo al Formulario Único de Trámite (FUT) · Cribado Visuoespacial y Ejecutivo (Ap. 15.5 Disp. ANSV 219/2025)</p>
          </div>
          <div style="text-align: right; font-size: 0.8rem;">
            <strong>Fecha:</strong> ${todayStr}
          </div>
        </div>

        <div style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 0.6rem 0.85rem; border-radius: 6px; font-size: 0.85rem; margin-bottom: 0.75rem;">
          <strong>Postulante:</strong> ${name} &nbsp;|&nbsp; <strong>DNI Nº:</strong> ${dni} &nbsp;|&nbsp; <strong>Edad:</strong> ${age} años &nbsp;|&nbsp; <strong>Clase:</strong> ${classesStr}
        </div>

        <div style="font-size: 0.86rem; margin-bottom: 0.5rem;">
          <strong>Consigna a la orden (Cacho / Sundström):</strong>
          <em>"Dibuje en el recuadro inferior una esfera redonda de reloj grande, coloque adentro todos los números de las horas en su lugar correcto y dibuje las dos agujas marcando las <strong>once y diez (11:10)</strong>."</em>
        </div>

        <div class="clock-draw-circle-area">
          Espacio para el dibujo manuscrito del reloj por parte del postulante (Abrochar esta hoja al FUT)
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 0.78rem; margin-top: 0.5rem;">
          <thead>
            <tr style="background: #f1f5f9; border-bottom: 1px solid #94a3b8;">
              <th style="text-align: left; padding: 0.35rem;">Parámetro Evaluado</th>
              <th style="text-align: left; padding: 0.35rem;">Escala de Puntuación</th>
              <th style="text-align: center; padding: 0.35rem; width: 110px;">Puntaje Obtenido</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #cbd5e1;">
              <td style="padding: 0.35rem;"><strong>1. Esfera del Reloj</strong> (0 a 2 pts)</td>
              <td style="padding: 0.35rem;">2: Normal / 1: Distorsión moderada o incompleta / 0: Ausente</td>
              <td style="text-align: center; padding: 0.35rem;">_____ / 2</td>
            </tr>
            <tr style="border-bottom: 1px solid #cbd5e1;">
              <td style="padding: 0.35rem;"><strong>2. Números 1 al 12</strong> (0 a 4 pts)</td>
              <td style="padding: 0.35rem;">4: Todos en orden y cuadrantes / 3: Leve error espacial / 2: Omisión o hemicampo / ≤1: Grave</td>
              <td style="text-align: center; padding: 0.35rem;">_____ / 4</td>
            </tr>
            <tr style="border-bottom: 1px solid #cbd5e1;">
              <td style="padding: 0.35rem;"><strong>3. Agujas a las 11:10</strong> (0 a 4 pts)</td>
              <td style="padding: 0.35rem;">4: Corta al 11 y larga al 2 / 3: Igual longitud / 2: Apunta al 10 en vez del 2 / ≤1: No marca hora</td>
              <td style="text-align: center; padding: 0.35rem;">_____ / 4</td>
            </tr>
            <tr style="background: #f8fafc; font-weight: 700;">
              <td colspan="2" style="padding: 0.45rem;">PUNTAJE TOTAL (Normal ≥ 7/10 pts · Sospecha de deterioro cognitivo ≤ 6/10 pts → Retener e Interconsultar)</td>
              <td style="text-align: center; padding: 0.45rem;">_____ / 10</td>
            </tr>
          </tbody>
        </table>

        <div class="signature-boxes-row">
          <div class="sig-line">Firma del Postulante</div>
          <div class="sig-line">Firma y Sello del Médico Examinador CEL Avellaneda</div>
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
          btnCopySheetText.textContent = "✓ Texto de la Hoja Copiado al Portapapeles";
          setTimeout(() => {
            btnCopySheetText.textContent = orig;
          }, 2000);
        });
      }
    });
  }

  // Inicializar evaluación al cargar la página
  evaluatePatient();
});
