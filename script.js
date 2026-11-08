let subjects = JSON.parse(localStorage.getItem("subjects")) || [
  { name: "Mathe (LK)" },
  { name: "Englisch (LK)" },
  { name: "WR (LK)" },
  { name: "Informatik (mündlich)" },
  { name: "Sport" },
  { name: "Deutsch" },
  { name: "Kunst" },
  { name: "Religion" },
  { name: "Physik" },
  { name: "Geschichte" }
];
function getLKs() {
  return subjects
    .filter(s => s.name.includes("(LK)"))
    .map(s => s.name);
}
function getMuendlich() {
  return subjects
    .filter(s => s.name.includes("(mündlich)"))
    .map(s => s.name);
}

const container = document.getElementById("subjects");

// UI erstellen
function renderSubjects() {
  container.innerHTML = "";

  subjects.forEach((sub, i) => {
    const div = document.createElement("div");
    div.className = "subject";

    let html = `<h3>${sub.name}</h3>`;
    const semesterNames = ["11/1", "11/2", "12/1", "12/2"];

    for (let h = 1; h <= 4; h++) {
      html += `
        <div class="halfyear">
          <span>${semesterNames[h - 1]}</span>

          <input class="klausur" type="number" min="0" max="15" id="k${i}_${h}" oninput="calculate()">

          <div class="sonstige">
      `;

      for (let s = 1; s <= 5; s++) {
        html += `<input type="number" min="0" max="15" id="s${i}_${h}_${s}" oninput="calculate()">`;
      }

      html += `
          </div>
          <div class="avg" id="avg_${i}_${h}">-</div>
        </div>
      `;
    }

    div.innerHTML = html;
    container.appendChild(div);
  });
}

function getAllNotes() {
  let values = [];

  subjects.forEach((_, i) => {
    for (let h = 1; h <= 4; h++) {

      const k = parseFloat(document.getElementById(`k${i}_${h}`).value);

      let sonstArr = [];
      for (let s = 1; s <= 5; s++) {
        let val = parseFloat(document.getElementById(`s${i}_${h}_${s}`).value);
        if (!isNaN(val)) sonstArr.push(val);
      }

      const note = calcNote(k, sonstArr);

      if (note !== null) values.push(note);
    }
  });

  return values;
}

// Gewichteter Schnitt (LKs zählen doppelt, wie im echten Abi)
function getWeightedAverage() {
  let weightedSum = 0;
  let weightedCount = 0;

  subjects.forEach((sub, i) => {
    const isLK = sub.name.includes("(LK)");
    const gewicht = isLK ? 2 : 1;

    for (let h = 1; h <= 4; h++) {
      const k = parseFloat(document.getElementById(`k${i}_${h}`).value);

      let sonstArr = [];
      for (let s = 1; s <= 5; s++) {
        let val = parseFloat(document.getElementById(`s${i}_${h}_${s}`).value);
        if (!isNaN(val)) sonstArr.push(val);
      }

      const note = calcNote(k, sonstArr);

      if (note !== null) {
        weightedSum += note * gewicht;
        weightedCount += gewicht;
      }
    }
  });

  return weightedCount > 0 ? weightedSum / weightedCount : null;
}

function calcNote(k, sonstArr) {
  if (!isNaN(k) && sonstArr.length > 0) {
    const sonstAvg = sonstArr.reduce((a, b) => a + b, 0) / sonstArr.length;
    return (k * (1 / 3)) + (sonstAvg * (2 / 3));
  }

  if (!isNaN(k)) return k;
  if (sonstArr.length > 0) return sonstArr.reduce((a, b) => a + b, 0) / sonstArr.length;

  return null;
}

// Berechnung
function calculate() {
  let total = 0;
  let count = 0;

  subjects.forEach((_, i) => {
    for (let h = 1; h <= 4; h++) {

      const k = parseFloat(document.getElementById(`k${i}_${h}`).value);

      let sonstArr = [];
      for (let s = 1; s <= 5; s++) {
        let val = parseFloat(document.getElementById(`s${i}_${h}_${s}`).value);
        if (!isNaN(val)) sonstArr.push(val);
      }

      const avgField = document.getElementById(`avg_${i}_${h}`);
      const row = avgField.parentElement;

      row.classList.remove("r1","r2","r3","r4","r5","y1","y2","y3","y4","y5","g1","g2","g3","g4","g5");

      const note = calcNote(k, sonstArr);

      if (note !== null) {
        avgField.innerText = note.toFixed(1);

        total += note;
        count++;

        if (note >= 10) {
          row.classList.add(note >= 13 ? "g5" : note >= 12 ? "g4" : note >= 11 ? "g3" : note >= 10.5 ? "g2" : "g1");
        } else if (note >= 7) {
          row.classList.add(note >= 9 ? "y5" : note >= 8.5 ? "y4" : note >= 8 ? "y3" : note >= 7.5 ? "y2" : "y1");
        } else {
          row.classList.add(note >= 6 ? "r1" : note >= 5 ? "r2" : note >= 4 ? "r3" : note >= 3 ? "r4" : "r5");
        }

      } else {
        avgField.innerText = "-";
      }
    }
  });

  if (count === 0) return;

const values = getAllNotes();
const avg = values.length ? values.reduce((a,b)=>a+b,0) / values.length : 0;
  const result = document.getElementById("result");

  let text = `Durchschnitt: ${avg.toFixed(2)} Punkte`;

  if (avg >= 10) text += " → Gut 👍";
  else if (avg >= 7) text += " → Mittel ⚠️";
  else text += " → Kritisch ❗";

  const weightedAvg = getWeightedAverage();
  if (weightedAvg !== null) {
    text += `<br><span style="opacity:0.85;">Realer Schnitt (LKs ×2 gewichtet): ${weightedAvg.toFixed(2)} Punkte</span>`;
    text += `<br><span style="font-size:0.85em; opacity:0.7;">ℹ️ Der obere Wert zählt alle Fächer gleich, der reale Schnitt gewichtet LKs wie im echten Abitur doppelt – daher können sich die Werte unterscheiden.</span>`;
  }

  const goal = localStorage.getItem("goal");
  if (goal) text += `<br>Ziel: ${goal} Punkte`;

  result.innerHTML = text;
}

// Schwächen-Analyse
function analyseWeakness() {
  let subjectsScore = [];

  subjects.forEach((sub, i) => {
    let total = 0;
    let count = 0;

    for (let h = 1; h <= 4; h++) {
      const k = parseFloat(document.getElementById(`k${i}_${h}`).value);

      let sonstArr = [];
      for (let s = 1; s <= 5; s++) {
        let val = parseFloat(document.getElementById(`s${i}_${h}_${s}`).value);
        if (!isNaN(val)) sonstArr.push(val);
      }

      if (!isNaN(k) && sonstArr.length > 0) {
        const sonstAvg = sonstArr.reduce((a,b)=>a+b,0) / sonstArr.length;
        const note = calcNote(k, sonstArr);

        total += note;
        count++;
      }
    }

    if (count > 0) {
      subjectsScore.push({
        name: sub.name,
        avg: total / count
      });
    }
  });

  if (subjectsScore.length === 0) return;

  subjectsScore.sort((a, b) => a.avg - b.avg);

  const worst = subjectsScore[0];
  const best = subjectsScore[subjectsScore.length - 1];

  let html = `
    <div class="analysis">
      <h3>📉 Schwächen-Analyse</h3>

      <p><b>Schlechtestes Fach:</b> ${worst.name} (${worst.avg.toFixed(2)})</p>
      <p><b>Bestes Fach:</b> ${best.name} (${best.avg.toFixed(2)})</p>

      <hr>
      <p><b>Alle Fächer:</b></p>
  `;

  subjectsScore.forEach(s => {
    let status = "";

    if (s.avg >= 10) status = "🟢 stabil gut";
    else if (s.avg >= 7) status = "🟡 mittel";
    else status = "🔴 kritisch";

    let extra = "";

    if (getLKs().includes(s.name)) {
      extra += " 🔥 LK (starker Einfluss aufs Abi)";
    }

    if (getMuendlich().includes(s.name)) {
      extra += " 🎤 mündliches Abi (besondere Prüfung)";
    }

    html += `<p>${s.name}: ${s.avg.toFixed(2)} → ${status}${extra}</p>`;
  });

  html += `</div>`;

  document.getElementById("result").innerHTML = html;
}

// Prioritätsanalyse
function analysePriority() {
  const goal = parseFloat(localStorage.getItem("goal")) || 10;

  let subjectImpact = [];

  subjects.forEach((sub, i) => {
    let total = 0;
    let count = 0;

    for (let h = 1; h <= 4; h++) {
      const k = parseFloat(document.getElementById(`k${i}_${h}`).value);

      let sonstArr = [];
      for (let s = 1; s <= 5; s++) {
        let val = parseFloat(document.getElementById(`s${i}_${h}_${s}`).value);
        if (!isNaN(val)) sonstArr.push(val);
      }

      if (!isNaN(k) && sonstArr.length > 0) {
        const sonstAvg = sonstArr.reduce((a,b)=>a+b,0) / sonstArr.length;
        const note = calcNote(k, sonstArr);

        total += note;
        count++;
      }
    }

    if (count > 0) {
      const avg = total / count;

      subjectImpact.push({
        name: sub.name,
        avg: avg,
        gap: goal - avg // 🔥 entscheidend
      });
    }
  });

  if (subjectImpact.length === 0) return;

  // Sortieren: größte negative Abweichung zuerst
  subjectImpact.sort((a, b) => b.gap - a.gap);

  let html = `
    <div class="analysis">
      <h3>🎯 Zielbasierte Prioritäten-Analyse</h3>
      <p>Ziel: ${goal.toFixed(1)} Punkte</p>
      <hr>
  `;

  subjectImpact.forEach(s => {
    let status = "";

    if (s.gap > 2) status = "🔴 stark unter Ziel";
    else if (s.gap > 0) status = "🟡 knapp unter Ziel";
    else status = "🟢 über Ziel";

    html += `
      <p>
        <b>${s.name}</b>:
        ${s.avg.toFixed(2)} Punkte →
        ${status}
        (Δ ${s.gap.toFixed(2)})
      </p>
    `;
  });

  html += `</div>`;

  document.getElementById("result").innerHTML = html;
}

function analyseNeededPerSubject() {
  const goal = parseFloat(localStorage.getItem("goal")) || 10;

  let html = `
    <div class="analysis">
      <h3>🎯 Ziel pro Fach (Was du noch brauchst)</h3>
      <hr>
  `;

  subjects.forEach((sub, i) => {

    let values = [];
    let missing = 0;

    let weightedSum = 0;
    let weightedCount = 0;

    for (let h = 1; h <= 4; h++) {

      const kVal = document.getElementById(`k${i}_${h}`).value;
      const k = parseFloat(kVal);

      let sonstArr = [];
      for (let s = 1; s <= 5; s++) {
        let v = document.getElementById(`s${i}_${h}_${s}`).value;
        if (v !== "") sonstArr.push(parseFloat(v));
      }

      const note = calcNote(k, sonstArr);

      if (note !== null) {
        values.push(note);

        // Gewichtung:
        if (!isNaN(k) && sonstArr.length > 0) {
          // gemischte Note
          weightedSum += note;
          weightedCount += 1;
        }
      } else {
        missing++;
      }
    }

    if (values.length === 0) {
      html += `<p><b>${sub.name}</b>: ⚪ keine Daten</p>`;
      return;
    }

    const currentAvg = values.reduce((a,b)=>a+b,0) / values.length;

    const totalSlots = values.length + missing;

    const targetTotal = goal * totalSlots;
    const currentSum = values.reduce((a,b)=>a+b,0);

    const neededFuture = missing > 0
      ? (targetTotal - currentSum) / missing
      : null;

    let status = "";

    if (neededFuture === null) {
      status = "✔️ fertig bewertet";
    } else if (neededFuture > 15) {
      status = "🔴 unrealistisch erreichbar";
    } else if (neededFuture > 12) {
      status = "🟠 sehr schwer";
    } else if (neededFuture > 10) {
      status = "🟡 machbar";
    } else {
      status = "🟢 gut erreichbar";
    }

    html += `
      <p>
        <b>${sub.name}</b><br>
        Schnitt: ${currentAvg.toFixed(2)} → ${status}<br>
        ${neededFuture !== null
          ? `Du brauchst Ø ${neededFuture.toFixed(2)} in den restlichen Leistungen`
          : "Keine offenen Noten"}
      </p>
    `;
  });

  html += `</div>`;

  document.getElementById("result").innerHTML = html;
}


// Text-Übersicht aller Noten
function showOverview() {
  const semesterNames = ["11/1", "11/2", "12/1", "12/2"];
  let text = "";
  
  // Arrays für die Berechnung der Halbjahresschnitte
  let semesterSums = [0, 0, 0, 0];
  let semesterCounts = [0, 0, 0, 0];

  subjects.forEach((sub, i) => {
    let subjectHasData = false;
    let subjectText = `${sub.name}:\n`;
    let subjectNotes = [];

    for (let h = 1; h <= 4; h++) {
      const kVal = document.getElementById(`k${i}_${h}`).value;

      let sonstArr = [];
      for (let s = 1; s <= 5; s++) {
        const v = document.getElementById(`s${i}_${h}_${s}`).value;
        if (v !== "") sonstArr.push(v);
      }

      if (kVal === "" && sonstArr.length === 0) continue;

      subjectHasData = true;

      const k = parseFloat(kVal);
      const sonstNum = sonstArr.map(parseFloat);
      const note = calcNote(k, sonstNum);

      if (note !== null) {
        subjectNotes.push(note);
        // Für den Halbjahresschnitt sammeln
        semesterSums[h - 1] += note;
        semesterCounts[h - 1]++;
      }

      const kDisplay = (kVal || "-").padEnd(2, " ");
      const sonstDisplay = sonstArr.length ? sonstArr.join(", ") : "-";
      const avgDisplay = note !== null ? `Ø ${note.toFixed(2)}` : "Ø -";

      subjectText += `  ${semesterNames[h - 1]}: ${kDisplay} / ${sonstDisplay.padEnd(20, " ")} ${avgDisplay}\n`;
    }

    if (subjectHasData) {
      const subjectAvg = subjectNotes.length
        ? subjectNotes.reduce((a, b) => a + b, 0) / subjectNotes.length
        : null;

      if (subjectAvg !== null) {
        subjectText += `  Gesamtschnitt: ${subjectAvg.toFixed(2)}\n`;
      }

      text += subjectText + "\n";
    }
  });

  if (text === "") {
    text = "Noch keine Noten eingetragen.";
  }

  window.currentOverviewText = text;

  // HTML für die 4 Halbjahresdurchschnitte generieren
  let semesterHtml = `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-bottom: 15px;">`;
  semesterNames.forEach((name, idx) => {
    const semAvg = semesterCounts[idx] > 0 ? (semesterSums[idx] / semesterCounts[idx]).toFixed(2) : "-";
    semesterHtml += `
      <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 5px; text-align: center; border: 1px solid rgba(255,255,255,0.1);">
        <b style="font-size: 0.9em; color: #aaa;">${name} Schnitt</b><br>
        <span style="font-size: 1.2em; font-weight: bold;">${semAvg}</span>
      </div>`;
  });
  semesterHtml += `</div>`;

  const html = `
    <div class="analysis">
      <h3>📋 Alle Noten – Übersicht</h3>
      ${semesterHtml}
      <button onclick="copyOverview()">📋 In Zwischenablage kopieren</button>
      <hr>
      <pre id="overviewText" style="white-space:pre-wrap; text-align:left; font-family: monospace;">${text}</pre>
    </div>
  `;

  document.getElementById("result").innerHTML = html;
}

// Übersicht kopieren
function copyOverview() {
  navigator.clipboard.writeText(window.currentOverviewText || "").then(() => {
    alert("✅ In Zwischenablage kopiert!");
  }).catch(() => {
    alert("❌ Kopieren fehlgeschlagen. Bitte manuell markieren.");
  });
}


// Trend-Analyse
function analyseTrend() {
  const semesterNames = ["11/1", "11/2", "12/1", "12/2"];
  let semesterSums = [0, 0, 0, 0];
  let semesterCounts = [0, 0, 0, 0];

  let html = `
    <div class="analysis">
      <h3>📈 Trend-Analyse pro Fach</h3>
      <hr>
  `;

  subjects.forEach((sub, i) => {
    let values = [];

    for (let h = 1; h <= 4; h++) {
      const k = parseFloat(document.getElementById(`k${i}_${h}`).value);

      let sonstArr = [];
      for (let s = 1; s <= 5; s++) {
        let val = parseFloat(document.getElementById(`s${i}_${h}_${s}`).value);
        if (!isNaN(val)) sonstArr.push(val);
      }

      const note = calcNote(k, sonstArr);
      if (note !== null) {
        values.push(note);
        // Für den allgemeinen Halbjahresschnitt sammeln
        semesterSums[h - 1] += note;
        semesterCounts[h - 1]++;
      }
    }

    if (values.length >= 2) {
      const first = values[0];
      const last = values[values.length - 1];

      let trend = "";
      let emoji = "";
      const diff = last - first;

      if (diff > 0.5) {
        emoji = "🟢";
        trend = "verbessert";
      } else if (diff < -0.5) {
        emoji = "🔴";
        trend = "verschlechtert";
      } else {
        emoji = "🟡";
        trend = "stabil";
      }

      html += `<p><b>${sub.name}</b>: ${emoji} ${trend} (${first.toFixed(1)} → ${last.toFixed(1)})</p>`;
    } else {
      html += `<p><b>${sub.name}</b>: ⚪ zu wenig Daten</p>`;
    }
  });

  // Gesamttrend der Halbjahre berechnen
  html += `
    <hr>
    <h4>📊 Verlauf der Halbjahresschnitte:</h4>
  `;
  
  let validSemesters = [];
  semesterNames.forEach((name, idx) => {
    if (semesterCounts[idx] > 0) {
      const avg = semesterSums[idx] / semesterCounts[idx];
      validSemesters.push({ name, avg });
      html += `<p><b>${name}:</b> ${avg.toFixed(2)} Punkte</p>`;
    } else {
      html += `<p><b>${name}:</b> Keine Daten</p>`;
    }
  });

  if (validSemesters.length >= 2) {
    const firstSem = validSemesters[0];
    const lastSem = validSemesters[validSemesters.length - 1];
    const semDiff = lastSem.avg - firstSem.avg;
    
    let totalTrend = "";
    let totalEmoji = "";
    if (semDiff > 0.3) {
      totalEmoji = "🚀";
      totalTrend = "Dein Gesamttrend zeigt nach oben!";
    } else if (semDiff < -0.3) {
      totalEmoji = "⚠️";
      totalTrend = "Dein Gesamttrend sinkt leicht ab.";
    } else {
      totalEmoji = "⚖️";
      totalTrend = "Deine Leistungen bleiben im Gesamtschnitt konstant.";
    }
    html += `<p style="margin-top: 15px; font-weight: bold;">${totalEmoji} ${totalTrend} (${firstSem.name} vs. ${lastSem.name})</p>`;
  }

  html += `</div>`;

  document.getElementById("result").innerHTML = html;
}

// Streich-Fächer
function analyseStreichfaecher() {
  const semesterNames = ["11/1", "11/2", "12/1", "12/2"];

  function isStreakable(subName) {
    if (subName.includes("(LK)")) return false;
    if (subName.includes("(mündlich)")) return false;
    const lower = subName.toLowerCase();
    if (lower.includes("deutsch")) return false;
    if (lower.includes("mathe")) return false;
    return true;
  }

  function reasonExcluded(subName) {
    if (subName.includes("(LK)")) return "Leistungskurs";
    if (subName.includes("(mündlich)")) return "mündliches Abi";
    const lower = subName.toLowerCase();
    if (lower.includes("deutsch")) return "Deutsch";
    if (lower.includes("mathe")) return "Mathe";
    return "ausgeschlossen";
  }

  // Alle Noten mit Metadaten sammeln
  let allResults = [];
  subjects.forEach((sub, i) => {
    const isLK = sub.name.includes("(LK)");
    const weight = isLK ? 2 : 1;
    const streakable = isStreakable(sub.name);

    for (let h = 1; h <= 4; h++) {
      const k = parseFloat(document.getElementById(`k${i}_${h}`).value);
      let sonstArr = [];
      for (let s = 1; s <= 5; s++) {
        let val = parseFloat(document.getElementById(`s${i}_${h}_${s}`).value);
        if (!isNaN(val)) sonstArr.push(val);
      }
      const note = calcNote(k, sonstArr);
      if (note !== null) {
        allResults.push({
          subIndex: i,
          subName: sub.name,
          halfYear: h,
          value: note,
          weight: weight,
          streakable: streakable
        });
      }
    }
  });

  if (allResults.length === 0) {
    document.getElementById("result").innerHTML = `
      <div class="analysis">
        <h3>🧹 Streich-Fächer Optimierung</h3>
        <p>Noch keine Noten eingetragen.</p>
      </div>
    `;
    return;
  }

  // Aktuelle Schnitte
  const totalSimpleSum = allResults.reduce((s, r) => s + r.value, 0);
  const currentSimple = totalSimpleSum / allResults.length;
  const totalWeightedSum = allResults.reduce((s, r) => s + r.value * r.weight, 0);
  const totalWeightedCount = allResults.reduce((s, r) => s + r.weight, 0);
  const currentWeighted = totalWeightedSum / totalWeightedCount;

  const eligible = allResults.filter(r => r.streakable);

  // Kombinationen-Generator
  function* combinations(arr, k) {
    if (k === 0) { yield []; return; }
    if (arr.length < k) return;
    for (let i = 0; i <= arr.length - k; i++) {
      for (const tail of combinations(arr.slice(i + 1), k - 1)) {
        yield [arr[i], ...tail];
      }
    }
  }

  // Constraints: max 2 pro Fach, max 1 pro Halbjahr
  function isValid(subset) {
    const subjCount = {};
    const hyCount = {};
    for (const item of subset) {
      subjCount[item.subIndex] = (subjCount[item.subIndex] || 0) + 1;
      hyCount[item.halfYear] = (hyCount[item.halfYear] || 0) + 1;
    }
    if (Object.values(subjCount).some(c => c > 2)) return false;
    if (Object.values(hyCount).some(c => c > 1)) return false;
    return true;
  }

  // Beste Kombination (max. 4 Streichungen) suchen
  let bestSubset = [];
  let bestWeighted = currentWeighted;
  let bestSimple = currentSimple;

  for (let k = 1; k <= Math.min(4, eligible.length); k++) {
    for (const subset of combinations(eligible, k)) {
      if (!isValid(subset)) continue;

      const sum = subset.reduce((s, r) => s + r.value, 0);
      const wSum = subset.reduce((s, r) => s + r.value * r.weight, 0);
      const wCount = subset.reduce((s, r) => s + r.weight, 0);
      const newWeighted = (totalWeightedSum - wSum) / (totalWeightedCount - wCount);

      if (newWeighted > bestWeighted) {
        bestWeighted = newWeighted;
        bestSimple = (totalSimpleSum - sum) / (allResults.length - k);
        bestSubset = subset;
      }
    }
  }

  // Ausgabe
  let html = `
    <div class="analysis">
      <h3>🧹 Streich-Fächer Optimierung</h3>
      <p style="font-size:0.88em; opacity:0.75;">
        Regeln: max. 4 Streichungen · max. 2 pro Fach · max. 1 pro Halbjahr<br>
        Nicht streichbar: Leistungskurse, mündliches Abi-Fach, Deutsch, Mathe
      </p>
      <hr>
  `;

  if (bestSubset.length === 0) {
    if (eligible.length === 0) {
      html += `<p>Keine streichbaren Fächer vorhanden (alle Fächer sind LK, mündlich, Deutsch oder Mathe).</p>`;
    } else {
      html += `<p>Durch Streichung lässt sich der Schnitt nicht verbessern (alle streichbaren Ergebnisse liegen über dem aktuellen Durchschnitt).</p>`;
    }
  } else {
    const improvement = bestWeighted - currentWeighted;
    const improvementSimple = bestSimple - currentSimple;

    html += `
      <p><b>Aktueller Schnitt:</b> ${currentSimple.toFixed(2)} · real (LKs ×2): ${currentWeighted.toFixed(2)}</p>
      <p><b>Nach Streichung:</b> ${bestSimple.toFixed(2)} · real: ${bestWeighted.toFixed(2)}</p>
      <p><b>Verbesserung:</b> ${improvementSimple >= 0 ? "+" : ""}${improvementSimple.toFixed(2)} · real: ${improvement >= 0 ? "+" : ""}${improvement.toFixed(2)}</p>
      <hr>
      <p><b>Empfohlene Streichungen (${bestSubset.length}):</b></p>
    `;

    const sortedBest = [...bestSubset].sort((a, b) => a.halfYear - b.halfYear || a.value - b.value);
    sortedBest.forEach((r, idx) => {
      html += `<p>${idx + 1}. <b>${r.subName}</b> ${semesterNames[r.halfYear - 1]}: ${r.value.toFixed(2)} Punkte</p>`;
    });

    html += `<p style="font-size:0.85em; opacity:0.7; margin-top:10px;">Verbleibend: ${allResults.length - bestSubset.length} von ${allResults.length} Halbjahresergebnissen</p>`;
  }

  // Nicht streichbare Fächer
  const excluded = subjects.filter(s => !isStreakable(s.name));
  if (excluded.length > 0) {
    html += `<hr><p><b>Nicht streichbar:</b></p>`;
    excluded.forEach(s => {
      html += `<p>• ${s.name} <span style="opacity:0.7;">(${reasonExcluded(s.name)})</span></p>`;
    });
  }

  // Alle streichbaren Ergebnisse (mit ✅ markiert = empfohlen)
  if (eligible.length > 0) {
    html += `<hr><p><b>Alle streichbaren Ergebnisse:</b></p>`;
    const sortedEligible = [...eligible].sort((a, b) => a.value - b.value);
    sortedEligible.forEach(r => {
      const isSelected = bestSubset.some(b => b.subIndex === r.subIndex && b.halfYear === r.halfYear);
      const marker = isSelected ? "✅" : "▫️";
      html += `<p>${marker} ${r.subName} ${semesterNames[r.halfYear - 1]}: ${r.value.toFixed(2)}</p>`;
    });
  }

  html += `</div>`;
  document.getElementById("result").innerHTML = html;
}

// Puffer unter Verwendung des realen (gewichteten) Schnitts
function analysePuffer() {
  const goal = parseFloat(localStorage.getItem("goal")) || 10;

  // Hier wird jetzt der reale, LK-gewichtete Schnitt abgerufen
  const weightedAvg = getWeightedAverage();
  
  // Falls noch überhaupt keine Noten eingetragen sind
  if (weightedAvg === null) {
    document.getElementById("result").innerHTML = `
      <div class="analysis">
        <h3>🎯 Ziel-Puffer Analyse</h3>
        <hr>
        <p>Noch keine Noten eingetragen, um einen Puffer zu berechnen.</p>
      </div>
    `;
    return;
  }

  const diff = weightedAvg - goal;
  let status = "";

  if (diff >= 1) status = "🟢 guter Puffer";
  else if (diff >= 0) status = "🟡 knapp über Ziel";
  else if (diff >= -1) status = "🟠 knapp drunter"; // Entspricht deiner CSS-Klasse oder Logik, falls du Textfarben nutzt
  else status = "🔴 kritisch unter Ziel";

  let html = `
    <div class="analysis">
      <h3>🎯 Ziel-Puffer Analyse (Realer Schnitt)</h3>
      <hr>

      <p><b>Realer Schnitt (LKs ×2):</b> ${weightedAvg.toFixed(2)}</p>
      <p><b>Dein Ziel:</b> ${goal.toFixed(1)} Punkte</p>
      <p><b>Differenz:</b> ${diff >= 0 ? "+" : ""}${diff.toFixed(2)}</p>
      <p><b>Status:</b> ${status}</p>
      
      <p style="font-size:0.85em; opacity:0.7; margin-top: 15px;">
        ℹ️ Diese Analyse basiert jetzt auf deinem realen Abitur-Schnitt, bei dem Leistungskurse bereits doppelt zählen.
      </p>
    </div>
  `;

  document.getElementById("result").innerHTML = html;
}

// Abi-Prognose mit LK-Gewichtung 
function analyseAbiPrognose() {
  const semesterNames = ["11/1", "11/2", "12/1", "12/2"];

  function isStreakable(subName) {
    if (subName.includes("(LK)")) return false;
    if (subName.includes("(mündlich)")) return false;
    const lower = subName.toLowerCase();
    if (lower.includes("deutsch")) return false;
    if (lower.includes("mathe")) return false;
    return true;
  }

  // === 1. Alle Ergebnisse sammeln ===
  let allResults = [];
  subjects.forEach((sub, i) => {
    const isLK = sub.name.includes("(LK)");
    const weight = isLK ? 2 : 1;
    const streakable = isStreakable(sub.name);
    for (let h = 1; h <= 4; h++) {
      const k = parseFloat(document.getElementById(`k${i}_${h}`).value);
      let sonstArr = [];
      for (let s = 1; s <= 5; s++) {
        let val = parseFloat(document.getElementById(`s${i}_${h}_${s}`).value);
        if (!isNaN(val)) sonstArr.push(val);
      }
      const note = calcNote(k, sonstArr);
      allResults.push({
        subIndex: i, subName: sub.name, halfYear: h,
        value: note, weight, streakable, filled: note !== null
      });
    }
  });

  const filled = allResults.filter(r => r.filled);
  const empty = allResults.filter(r => !r.filled);

  if (filled.length === 0) {
    document.getElementById("result").innerHTML = `
      <div class="analysis">
        <h3>🎓 Abi-Prognose</h3>
        <p>Noch keine Noten eingetragen.</p>
      </div>`;
    return;
  }

  // === 2. Streich-Optimierung auf den bereits gefüllten Ergebnissen ===
  const eligible = filled.filter(r => r.streakable);

  function* combinations(arr, k) {
    if (k === 0) { yield []; return; }
    if (arr.length < k) return;
    for (let i = 0; i <= arr.length - k; i++) {
      for (const tail of combinations(arr.slice(i + 1), k - 1)) yield [arr[i], ...tail];
    }
  }

  function isValidStreak(subset) {
    const sc = {}, hc = {};
    for (const it of subset) {
      sc[it.subIndex] = (sc[it.subIndex] || 0) + 1;
      hc[it.halfYear] = (hc[it.halfYear] || 0) + 1;
    }
    return !Object.values(sc).some(c => c > 2)
        && !Object.values(hc).some(c => c > 1);
  }

  const totalSum = filled.reduce((s, r) => s + r.value * r.weight, 0);
  const totalCount = filled.reduce((s, r) => s + r.weight, 0);
  const rawAvg = totalSum / totalCount;

  let bestSet = [], bestSum = totalSum, bestCount = totalCount, bestAvg = rawAvg;

  for (let k = 1; k <= Math.min(4, eligible.length); k++) {
    for (const subset of combinations(eligible, k)) {
      if (!isValidStreak(subset)) continue;
      const dSum = subset.reduce((s, r) => s + r.value * r.weight, 0);
      const dCount = subset.reduce((s, r) => s + r.weight, 0);
      const nCount = totalCount - dCount;
      const nSum = totalSum - dSum;
      if (nCount === 0) continue;
      const nAvg = nSum / nCount;
      if (nAvg > bestAvg + 1e-9) {
        bestAvg = nAvg; bestSum = nSum; bestCount = nCount; bestSet = subset;
      }
    }
  }

  // === 3. Prognose (40-Slot-Modell, LKs ×2) ===
  const block1Prognose = (bestAvg / 15) * 600;

  // === 4. Rückwärtsrechnung ===
  const emptyCount = empty.reduce((s, r) => s + r.weight, 0);
  const totalFinalCount = bestCount + emptyCount;

  const userGoal = parseFloat(localStorage.getItem("goal")) || 10;
  const userGoalBlock1 = Math.round(userGoal * 40);

  function neededAvg(target) {
    if (emptyCount === 0) return null;
    const targetAvgPoints = target / 40;
    return (targetAvgPoints * totalFinalCount - bestSum) / emptyCount;
  }

  function statusOf(needed) {
    if (needed === null) return { emoji: "✔️", text: "alle Noten vorhanden" };
    if (needed < 0)      return { emoji: "✅", text: "bereits übertroffen" };
    if (needed > 15)     return { emoji: "🔴", text: "unrealistisch" };
    if (needed > 12)     return { emoji: "🟠", text: "sehr schwer" };
    if (needed > 10)     return { emoji: "🟡", text: "machbar" };
    return { emoji: "🟢", text: "gut erreichbar" };
  }

  const targetSet = new Set([350, 400, 450, userGoalBlock1]);
  const targets = [...targetSet].sort((a, b) => a - b);

  // === 5. HTML-Ausgabe ===
  let html = `
    <div class="analysis">
      <h3>🎓 Abi-Prognose – Block 1</h3>
      <p style="font-size:0.88em; opacity:0.7;">
        Thüringer Modell: LKs ×2, max. 600 Punkte (40 gewichtete Halbjahresergebnisse).<br>
        Streichregeln angewandt: max. 4 gesamt · max. 2/Fach · max. 1/Halbjahr · LK/mündlich/Deutsch/Mathe ausgeschlossen.
      </p>
      <hr>

      <p><b>📌 Aktueller Stand</b> (nur eingetragene Noten):</p>
      <p>Ø <b style="font-size:1.15em;">${bestAvg.toFixed(2)}</b> Punkte über ${bestCount} gewichtete Ergebnisse</p>
      <p style="font-size:0.85em; opacity:0.7;">Roh-Schnitt ohne Streichung: ${rawAvg.toFixed(2)}</p>
  `;

  if (bestSet.length > 0) {
    html += `<p style="font-size:0.88em; opacity:0.85;"><b>Optimale Streichung (${bestSet.length}):</b> `;
    html += bestSet.map(r =>
      `${r.subName} ${semesterNames[r.halfYear - 1]} (${r.value.toFixed(1)})`
    ).join(", ");
    html += `</p>`;
  } else {
    html += `<p style="font-size:0.88em; opacity:0.7;">Keine Streichung verbessert den Schnitt.</p>`;
  }

  html += `
      <hr>
      <p><b>🔮 Prognose (falls Schnitt so bleibt):</b></p>
      <p style="font-size:1.4em; font-weight:bold; margin:8px 0;">${block1Prognose.toFixed(0)} / 600 Punkte</p>
      <p style="font-size:0.85em; opacity:0.7;">
        Hochrechnung: Ø ${bestAvg.toFixed(2)} × 40. Kein aktueller Punktestand – reine Annahme „so weitermachen wie bisher".
      </p>
      <hr>
      <p><b>🎯 Rückwärtsrechnung – was brauchst du noch?</b></p>
  `;

  if (emptyCount === 0) {
    html += `<p style="font-size:0.9em; opacity:0.8;">
      Alle ${bestCount} gewichteten Ergebnisse sind eingetragen – die Block-1-Punkte stehen quasi fest.
    </p>`;
  } else {
    html += `<p style="font-size:0.88em; opacity:0.75;">
      Noch ${emptyCount} gewichtete Slots offen. Um ein Ziel zu erreichen, brauchst du in diesen Slots im Schnitt:
    </p>`;
    html += `<table style="width:100%; margin-top:12px; border-collapse:collapse;">
      <tr style="border-bottom:1px solid rgba(255,255,255,0.15); text-align:left;">
        <th style="padding:8px;">Ziel (Block 1)</th>
        <th style="padding:8px;">Ø nötig</th>
        <th style="padding:8px;">Status</th>
      </tr>`;

    targets.forEach(t => {
      const needed = neededAvg(t);
      const s = statusOf(needed);
      const isUserGoal = t === userGoalBlock1;
      const display = needed === null ? "–" : (needed < 0 ? "– (übertroffen)" : needed.toFixed(2) + " NP");
      html += `
        <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
          <td style="padding:8px;">${t}${isUserGoal ? " ⭐" : ""}</td>
          <td style="padding:8px; font-weight:bold;">${display}</td>
          <td style="padding:8px;">${s.emoji} ${s.text}</td>
        </tr>`;
    });

    html += `</table>`;
    html += `<p style="font-size:0.83em; opacity:0.65; margin-top:10px;">
      ⭐ = dein persönliches Ziel (Ø ${userGoal} → ${userGoalBlock1} Block-1-Punkte).<br>
      „Ø nötig" ist der Durchschnitt in <u>allen</u> noch offenen Slots – Streichungen wurden bereits auf die bisherigen Noten angewandt.
    </p>`;
  }

  // Fächer-Übersicht
  html += `<hr><p><b>📊 Fächer-Übersicht:</b></p>`;
  subjects.forEach((sub, i) => {
    const subFilled = filled.filter(r => r.subIndex === i);
    const subEmpty = empty.filter(r => r.subIndex === i);
    const locked = isStreakable(sub.name) ? "" : " 🔒";
    const weightTag = sub.name.includes("(LK)") ? " ×2" : "";

    if (subFilled.length > 0) {
      const avg = subFilled.reduce((s, r) => s + r.value, 0) / subFilled.length;
      const offen = subEmpty.length > 0 ? `, ${subEmpty.length} offen` : "";
      html += `<p>${sub.name}${locked}: Ø <b>${avg.toFixed(2)}</b> (${subFilled.length} gefüllt${offen})${weightTag}</p>`;
    } else {
      html += `<p>${sub.name}${locked}: noch keine Noten (${subEmpty.length} offen)${weightTag}</p>`;
    }
  });
  html += `<p style="font-size:0.83em; opacity:0.65; margin-top:6px;">🔒 = nicht streichbar (LK, mündlich, Deutsch oder Mathe)</p>`;

  // Zulassungsbedingungen
  const unterkurse = filled.filter(r => r.value < 5).length;
  const nullPunkte = filled.filter(r => r.value === 0).length;

  html += `
      <hr>
      <p><b>⚠️ Zulassungsbedingungen:</b></p>
      <p>Ergebnisse unter 5 NP: <b>${unterkurse}</b> ${unterkurse > 8 ? "🔴 zu viele!" : unterkurse > 0 ? "🟡 im Blick behalten" : "🟢 keine"}</p>
      <p>Ergebnisse mit 0 NP: <b>${nullPunkte}</b> ${nullPunkte > 0 ? "🔴 Achtung!" : "🟢 keine"}</p>
      <hr>
      <p style="font-size:0.83em; opacity:0.65;">
        ⚠️ Unverbindliche Orientierung, kein offizielles Ergebnis. Block 2 (Abiturprüfungen) nicht enthalten.
        Genaue Streichregeln deiner Schule können von diesem Modell abweichen.
      </p>
    </div>`;

  document.getElementById("result").innerHTML = html;
}

// ===== Verlaufs-Historie (für die Statistik) =====
function recordHistory() {
  const values = getAllNotes();
  const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
  const weighted = getWeightedAverage();

  if (avg === null && weighted === null) return;

  let history = JSON.parse(localStorage.getItem("history")) || [];
  const dateKey = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const entry = {
    date: dateKey,
    avg: avg !== null ? parseFloat(avg.toFixed(2)) : null,
    weighted: weighted !== null ? parseFloat(weighted.toFixed(2)) : null
  };

  const existingIndex = history.findIndex(h => h.date === dateKey);
  if (existingIndex >= 0) {
    history[existingIndex] = entry; // heutigen Eintrag aktualisieren statt duplizieren
  } else {
    history.push(entry);
  }

  history.sort((a, b) => new Date(a.date) - new Date(b.date));
  localStorage.setItem("history", JSON.stringify(history));
}

// Statistik-Ansicht: Notendurchschnitt im Verlauf (Chart.js)
let historyChartInstance = null;

function analyseHistory() {
  const history = JSON.parse(localStorage.getItem("history")) || [];

  if (history.length === 0) {
    document.getElementById("result").innerHTML = `
      <div class="analysis">
        <h3>📊 Verlauf</h3>
        <p>Noch keine Verlaufsdaten. Klicke einmal auf 💾 Speichern, damit hier ein Verlauf entsteht.</p>
      </div>
    `;
    return;
  }

  document.getElementById("result").innerHTML = `
    <div class="analysis">
      <h3>📊 Notendurchschnitt im Verlauf</h3>
      <p style="font-size:0.85em; opacity:0.7;">Ein Punkt entsteht jedes Mal, wenn du auf "Speichern" klickst (maximal einer pro Tag).</p>
      <hr>
      <canvas id="historyChart" height="260"></canvas>
    </div>
  `;

  // Zoom-Fenster: 6–13 NP (nur erweitern, wenn Werte außerhalb liegen)
  const allValues = history.flatMap(h => [h.avg, h.weighted]).filter(v => v !== null);
  let yMin = 7, yMax = 12;
  if (allValues.length > 0) {
    yMin = Math.min(yMin, Math.floor(Math.min(...allValues)));
    yMax = Math.max(yMax, Math.ceil(Math.max(...allValues)));
  }

  const ctx = document.getElementById("historyChart").getContext("2d");
  if (historyChartInstance) historyChartInstance.destroy();

  historyChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: history.map(h => h.date),
      datasets: [
        {
          label: "Einfacher Schnitt",
          data: history.map(h => h.avg),
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59,130,246,0.15)",
          tension: 0.25,
          spanGaps: true
        },
        {
          label: "Realer Schnitt (LKs ×2)",
          data: history.map(h => h.weighted),
          borderColor: "#10b981",
          backgroundColor: "rgba(16,185,129,0.15)",
          tension: 0.25,
          spanGaps: true
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          min: yMin,
          max: yMax,
          ticks: { color: "#e2e8f0", stepSize: 1 },
          grid: { color: "rgba(255,255,255,0.08)" }
        },
        x: {
          ticks: { color: "#e2e8f0" },
          grid: { color: "rgba(255,255,255,0.05)" }
        }
      },
      plugins: {
        legend: { labels: { color: "#ffffff" } }
      }
    }
  });
}

// ===== Backup-System =====
function exportBackup() {
  const backup = {
    subjects: subjects,
    grades: JSON.parse(localStorage.getItem("grades")) || null,
    goal: localStorage.getItem("goal") || null,
    history: JSON.parse(localStorage.getItem("history")) || [],
    exportedAt: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `notentracker-backup-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  localStorage.setItem("lastBackup", new Date().toISOString());
  updateBackupBanner();

  document.getElementById("result").innerHTML = `
    <div class="analysis">
      <h3>💾 Backup erstellt</h3>
      <p>✅ Datei wurde heruntergeladen: <b>${a.download}</b></p>
      <p style="font-size:0.85em; opacity:0.7;">Bewahre die Datei sicher auf (z. B. Cloud-Speicher oder E-Mail an dich selbst) – sie ist deine Rettung, falls der Browser die Noten verliert.</p>
    </div>
  `;
}

function importBackup(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const backup = JSON.parse(e.target.result);

      if (!confirm("⚠️ Dies überschreibt alle aktuellen Noten und Einstellungen mit dem Backup. Fortfahren?")) {
        return;
      }

      if (backup.subjects) {
        subjects = backup.subjects;
        localStorage.setItem("subjects", JSON.stringify(subjects));
      }
      if (backup.grades) localStorage.setItem("grades", JSON.stringify(backup.grades));
      if (backup.goal) localStorage.setItem("goal", backup.goal);
      if (backup.history) localStorage.setItem("history", JSON.stringify(backup.history));

      renderSubjects();
      loadData();
      calculate();

      localStorage.setItem("lastBackup", new Date().toISOString());
      updateBackupBanner();

      alert("✅ Backup erfolgreich eingespielt!");
    } catch (err) {
      alert("❌ Datei konnte nicht gelesen werden. Ist es eine gültige Backup-Datei?");
    }
  };
  reader.readAsText(file);
  event.target.value = ""; // Reset, damit dieselbe Datei erneut wählbar ist
}

// Reminder-Banner: zeigt sich, wenn das letzte Backup > 30 Tage her ist (oder nie gemacht wurde)
function updateBackupBanner() {
  const banner = document.getElementById("backupBanner");
  if (!banner) return;

  const lastBackup = localStorage.getItem("lastBackup");

  if (!lastBackup) {
    banner.style.display = "flex";
    banner.querySelector("span").innerText = "⚠️ Du hast noch nie ein Backup erstellt. Bitte jetzt eines machen, sonst gehen deine Noten bei Datenverlust unwiderruflich verloren!";
    return;
  }

  const daysSince = (Date.now() - new Date(lastBackup).getTime()) / (1000 * 60 * 60 * 24);

  if (daysSince >= 30) {
    banner.style.display = "flex";
    banner.querySelector("span").innerText = `⚠️ Letztes Backup vor ${Math.floor(daysSince)} Tagen. Zeit für ein neues Backup!`;
  } else {
    banner.style.display = "none";
  }
}

// Ziel setzen
function setGoal() {
  const goal = prompt("Welchen Durchschnitt willst du erreichen? (0-15 Punkte)");
  if (!goal) return;

  localStorage.setItem("goal", goal);
  calculate();
}

// Settings 
function openSettings() {
  document.getElementById("settingsModal").classList.add("show");

  const text = subjects.map(s => s.name).join("\n");
  document.getElementById("subjectsInput").value = text;
}

function closeSettings() {
  document.getElementById("settingsModal").style.display = "none";
  document.getElementById("settingsModal").classList.remove("show");
}

function saveSettings() {
  saveData();
  if (!confirm("⚠️ Fächer ändern kann bestehende Noten unbrauchbar machen. Fortfahren?")) {
    return;
  }

  const input = document.getElementById("subjectsInput").value;

  const newSubjects = input
    .split("\n")
    .map(s => s.trim())
    .filter(s => s !== "")
    .map(name => ({ name }));

  if (newSubjects.length === 0) {
    alert("Mindestens ein Fach nötig!");
    return;
  }

  subjects = newSubjects;

  localStorage.setItem("subjects", JSON.stringify(subjects));

  closeSettings();
  renderSubjects();
  calculate();
}

// Warnung
function openWarning() {
  document.getElementById("warningModal").classList.add("show");
}

function closeWarning() {
  document.getElementById("warningModal").classList.remove("show");
}

// speichern
function saveData() {
  const data = [];

  subjects.forEach((_, i) => {
    let subj = {};

    for (let h = 1; h <= 4; h++) {
      subj[`k${h}`] = document.getElementById(`k${i}_${h}`).value;

      subj[`s${h}`] = [];
      for (let s = 1; s <= 5; s++) {
        subj[`s${h}`].push(document.getElementById(`s${i}_${h}_${s}`).value);
      }
    }

    data.push(subj);
  });

  localStorage.setItem("grades", JSON.stringify(data));
  recordHistory(); // Verlauf für die Statistik aufzeichnen

  const values = getAllNotes();
  const avg = values.length
    ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)
    : "-";

  const weightedAvg = getWeightedAverage();
  const weightedText = weightedAvg !== null
    ? `<p><b>🎓 Realer Schnitt (LKs ×2):</b> ${weightedAvg.toFixed(2)}</p>
       <p style="font-size:0.85em; opacity:0.7;">ℹ️ Der reale Schnitt gewichtet LKs doppelt, wie im echten Abitur. Der Schnitt oben zählt alle Fächer gleich.</p>`
    : "";

  document.getElementById("result").innerHTML = `
    <div class="analysis">
      <h3>💾 Daten gespeichert</h3>
      <hr>
      <p>✅ Alle Noten wurden gespeichert.</p>
      <p><b>📊 Schnitt:</b> ${avg}</p>
      ${weightedText}
    </div>
  `;
}

// laden
function loadData() {
  const data = JSON.parse(localStorage.getItem("grades"));
  if (!data) return;

  data.forEach((subj, i) => {
    for (let h = 1; h <= 4; h++) {

      document.getElementById(`k${i}_${h}`).value = subj[`k${h}`];

      subj[`s${h}`].forEach((val, sIndex) => {
        document.getElementById(`s${i}_${h}_${sIndex+1}`).value = val;
      });
    }
  });

  calculate();
}

renderSubjects();
loadData();
calculate();
updateBackupBanner();
