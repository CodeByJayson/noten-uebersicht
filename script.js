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
        const avg = sonstArr.reduce((a,b)=>a+b,0) / sonstArr.length;
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

  subjectsScore.sort((a, b) => a.avg - b.avg);

  let html = `
    <div class="analysis">
      <h3>🧹 Streich-Fächer Analyse</h3>
      <p>→ Welche Fächer ziehen deinen Schnitt runter</p>
      <hr>
  `;

  subjectsScore.forEach((s, i) => {

    let impact = "";

    if (i === 0) impact = "❌ stärkster Negativ-Einfluss";
    else if (i === 1) impact = "⚠️ hoher Einfluss";
    else if (i >= subjectsScore.length - 2) impact = "🟢 stabil / positiv";
    else impact = "➖ neutral";

    html += `<p><b>${s.name}</b>: ${s.avg.toFixed(1)} NP → ${impact}</p>`;
  });

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

  let weightedSum = 0;
  let weightedCount = 0;

  let subjectDetails = [];

  subjects.forEach((sub, i) => {
    const isLK = sub.name.includes("(LK)");
    const gewicht = isLK ? 2 : 1;

    let subjectSum = 0;
    let subjectCount = 0;

    for (let h = 1; h <= 4; h++) {
      const k = parseFloat(document.getElementById(`k${i}_${h}`).value);

      let sonstArr = [];
      for (let s = 1; s <= 5; s++) {
        let val = parseFloat(document.getElementById(`s${i}_${h}_${s}`).value);
        if (!isNaN(val)) sonstArr.push(val);
      }

      const note = calcNote(k, sonstArr);

      if (note !== null) {
        subjectSum += note;
        subjectCount++;

        weightedSum += note * gewicht;
        weightedCount += gewicht;
      }
    }

    if (subjectCount > 0) {
      subjectDetails.push({
        name: sub.name,
        avg: subjectSum / subjectCount,
        isLK: isLK
      });
    }
  });

  if (weightedCount === 0) {
    document.getElementById("result").innerHTML = `
      <div class="analysis">
        <h3>🎓 Abi-Prognose</h3>
        <p>Noch keine Noten eingetragen.</p>
      </div>
    `;
    return;
  }

  const avgPoints = weightedSum / weightedCount;
  const block1 = (avgPoints / 15) * 600;

  let block1Status = "";
  if (block1 < 200) block1Status = "🔴 unter Mindestqualifikation (200 nötig)";
  else if (block1 < 300) block1Status = "🟠 knapp über Minimum";
  else if (block1 < 450) block1Status = "🟡 solide";
  else block1Status = "🟢 stark";

  const geschaetzteBlock2 = (avgPoints / 15) * 300;
  const geschaetzteGesamt = block1 + geschaetzteBlock2;

  // Punkte (0-15) in Schulnote (1-6) umrechnen, linear angenähert
  function punkteZuNote(p) {
    return (6 - p / 3).toFixed(1);
  }

  const noteAktuell = punkteZuNote(avgPoints);

  let html = `
    <div class="analysis">
      <h3>🎓 Abi-Prognose (Block 1)</h3>
      <p style="font-size:0.9em; opacity:0.7;">Basiert auf dem Thüringer Modell (LKs zählen doppelt, max. 600 Punkte in Block 1). In anderen Bundesländern können Gewichtung und Punktegrenzen abweichen.</p>
      <p style="font-size:0.9em; opacity:0.8;">📌 Hochrechnung: Es wird angenommen, dass dein bisheriger Punkteschnitt in <b>allen</b> noch fehlenden Halbjahresleistungen ebenso erreicht wird. Das ist <u>nicht</u> dein aktueller Punktestand, sondern eine Prognose bei gleichbleibender Leistung.</p>
      <hr>
      <p><b>Punkteschnitt bisher (gewichtet):</b> ${avgPoints.toFixed(2)} / 15 (entspricht Note ${noteAktuell})</p>
      <p><b>Hochgerechnete Block 1 Punkte:</b> ${block1.toFixed(0)} / 600 → ${block1Status}</p>
      <hr>
      <p><b>Gewichtung pro Fach:</b></p>
  `;

  subjectDetails.forEach(s => {
    html += `<p>${s.name}${s.isLK ? " 🔥 (×2)" : ""}: ${s.avg.toFixed(2)} (Note ${punkteZuNote(s.avg)})</p>`;
  });

  html += `
      <hr>
      <p><b>📌 Grobe Gesamtschätzung:</b></p>
      <p>Angenommen, auch die Prüfungsleistungen (Block 2) liegen auf demselben Niveau:</p>
      <p>Geschätzte Gesamtpunktzahl: ca. ${geschaetzteGesamt.toFixed(0)} / 900</p>
      <p><b>Erwarteter Gesamt-Notendurchschnitt: ca. ${noteAktuell}</b></p>
      <p style="font-size:0.9em; opacity:0.7;">⚠️ Nur eine grobe, unverbindliche Orientierung – kein offizielles Ergebnis. Zulassungsregeln, Streichfächer-Vorgaben und tatsächliche Prüfungsleistung sind nicht vollständig abgebildet. Nutzer aus anderen Bundesländern sollten sich zusätzlich über die dort geltenden Regeln informieren.</p>
    </div>
  `;

  document.getElementById("result").innerHTML = html;
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
