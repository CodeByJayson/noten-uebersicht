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

// Trend-Analyse
function analyseTrend() {

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

      if (!isNaN(k) && sonstArr.length > 0) {
        const avg = sonstArr.reduce((a,b)=>a+b,0) / sonstArr.length;
        const note = calcNote(k, sonstArr);
        values.push(note);
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

// Puffer
function analysePuffer() {

  const goal = parseFloat(localStorage.getItem("goal")) || 10;

  const values = getAllNotes();
const avg = values.length ? values.reduce((a,b)=>a+b,0) / values.length : 0;

  const diff = avg - goal;

  let status = "";

  if (diff >= 1) status = "🟢 guter Puffer";
  else if (diff >= 0) status = "🟡 knapp über Ziel";
  else if (diff >= -1) status = "🟠 knapp drunter";
  else status = "🔴 kritisch unter Ziel";

  let html = `
    <div class="analysis">
      <h3>🎯 Ziel-Puffer Analyse</h3>
      <hr>

      <p><b>Aktueller Schnitt:</b> ${avg.toFixed(2)}</p>
      <p><b>Ziel:</b> ${goal}</p>
      <p><b>Differenz:</b> ${diff.toFixed(2)}</p>
      <p><b>Status:</b> ${status}</p>

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

  // dein bestehender UI-Text bleibt
  const values = getAllNotes();
  const avg = values.length
    ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)
    : "-";

  document.getElementById("result").innerHTML = `
    <div class="analysis">
      <h3>💾 Daten gespeichert</h3>
      <hr>
      <p>✅ Alle Noten wurden gespeichert.</p>
      <p><b>📊 Schnitt:</b> ${avg}</p>
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