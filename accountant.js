/* =========================
   Storage + Defaults
========================= */
const STORE_KEY = "finance_transactions_v2";
const OLD_KEY = "transactions";

const DEFAULT_CATEGORIES = [
  "Cleaning: House",
  "Cleaning: Apartment",
  "Cleaning: School",
  "Cleaning: Office",
  "Supplies / Materials",
  "Transport / Fuel",
  "Salaries",
  "Maintenance",
  "Marketing",
  "Other"
];

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function money(n) {
  const val = Number(n || 0);
  return val.toLocaleString("en-US", { maximumFractionDigits: 0 }) + " AED";
}

function safeStr(v){ return (v ?? "").toString().trim(); }

/* =========================
   Load / Migrate
========================= */
function loadTransactions() {
  const v2 = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
  if (Array.isArray(v2)) return v2;

  // migrate old
  const old = JSON.parse(localStorage.getItem(OLD_KEY) || "null");
  if (Array.isArray(old) && old.length) {
    const migrated = old.map(t => ({
      id: t.id || Date.now() + Math.random(),
      type: t.type || "income",
      amount: Number(t.amount || 0),
      date: t.date || todayISO(),
      category: t.type === "expense" ? "Other" : "Cleaning: House",
      method: "cash",
      note: t.description || "",
      tag: ""
    }));
    localStorage.setItem(STORE_KEY, JSON.stringify(migrated));
    return migrated;
  }

  localStorage.setItem(STORE_KEY, JSON.stringify([]));
  return [];
}

function saveTransactions(list) {
  localStorage.setItem(STORE_KEY, JSON.stringify(list));
}

/* =========================
   State
========================= */
let TX = loadTransactions();
let trendChart = null;
let donutChart = null;
let barChart = null;

/* =========================
   UI Elements
========================= */
const els = {
  fromDate: document.getElementById("fromDate"),
  toDate: document.getElementById("toDate"),
  typeFilter: document.getElementById("typeFilter"),
  categoryFilter: document.getElementById("categoryFilter"),
  searchFilter: document.getElementById("searchFilter"),
  bucket: document.getElementById("bucket"),

  kpiIncome: document.getElementById("kpiIncome"),
  kpiExpense: document.getElementById("kpiExpense"),
  kpiProfit: document.getElementById("kpiProfit"),
  kpiCount: document.getElementById("kpiCount"),
  kpiIncomeSub: document.getElementById("kpiIncomeSub"),
  kpiExpenseSub: document.getElementById("kpiExpenseSub"),
  kpiProfitSub: document.getElementById("kpiProfitSub"),
  kpiAvg: document.getElementById("kpiAvg"),

  txTable: document.getElementById("txTable"),

  txType: document.getElementById("txType"),
  txCategory: document.getElementById("txCategory"),
  txAmount: document.getElementById("txAmount"),
  txDate: document.getElementById("txDate"),
  txNote: document.getElementById("txNote"),
  txMethod: document.getElementById("txMethod"),
  txTag: document.getElementById("txTag"),

  addBtn: document.getElementById("addBtn"),
  demoBtn: document.getElementById("demoBtn"),

  applyBtn: document.getElementById("applyBtn"),
  resetBtn: document.getElementById("resetBtn"),
  exportBtn: document.getElementById("exportBtn"),

  chartTrend: document.getElementById("chartTrend"),
  chartDonut: document.getElementById("chartDonut"),
  chartBars: document.getElementById("chartBars")
};

function allCategoriesFromData() {
  const set = new Set(DEFAULT_CATEGORIES);
  TX.forEach(t => set.add(t.category || "Other"));
  return Array.from(set);
}

function populateCategories() {
  const cats = allCategoriesFromData();

  // Filter dropdown
  els.categoryFilter.innerHTML = `<option value="all">Все</option>` + cats
    .map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`)
    .join("");

  // Form dropdown
  els.txCategory.innerHTML = cats
    .map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`)
    .join("");
}

function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

/* =========================
   Filters
========================= */
function getFilters() {
  const from = els.fromDate.value || null;
  const to = els.toDate.value || null;
  const type = els.typeFilter.value || "all";
  const cat = els.categoryFilter.value || "all";
  const search = safeStr(els.searchFilter.value).toLowerCase();
  return { from, to, type, cat, search };
}

function applyFilter(list, f) {
  return list.filter(t => {
    if (f.from && t.date < f.from) return false;
    if (f.to && t.date > f.to) return false;
    if (f.type !== "all" && t.type !== f.type) return false;
    if (f.cat !== "all" && (t.category || "Other") !== f.cat) return false;

    if (f.search) {
      const hay = `${t.note||""} ${t.category||""} ${t.tag||""} ${t.method||""}`.toLowerCase();
      if (!hay.includes(f.search)) return false;
    }
    return true;
  });
}

/* =========================
   Aggregation helpers
========================= */
function groupKey(dateISO, bucket) {
  const d = new Date(dateISO + "T00:00:00");
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  if (bucket === "day") return `${y}-${m}-${day}`;

  if (bucket === "week") {
    // Monday-based week key
    const tmp = new Date(d);
    const dayOfWeek = (tmp.getDay() + 6) % 7; // Mon=0..Sun=6
    tmp.setDate(tmp.getDate() - dayOfWeek);
    const ym = `${tmp.getFullYear()}-${String(tmp.getMonth()+1).padStart(2,"0")}-${String(tmp.getDate()).padStart(2,"0")}`;
    return `W:${ym}`;
  }

  // month
  return `${y}-${m}`;
}

function summarize(list) {
  let income = 0, expense = 0;
  list.forEach(t => {
    const a = Number(t.amount || 0);
    if (t.type === "income") income += a;
    else expense += a;
  });
  const profit = income - expense;
  const count = list.length;
  const avg = count ? (income / Math.max(1, list.filter(x=>x.type==="income").length)) : 0;
  const margin = income ? (profit / income) * 100 : 0;
  return { income, expense, profit, count, avg, margin };
}

function categoryTotals(list) {
  const map = new Map();
  list.forEach(t => {
    const c = t.category || "Other";
    const entry = map.get(c) || { income: 0, expense: 0 };
    entry[t.type] += Number(t.amount || 0);
    map.set(c, entry);
  });
  return map;
}

/* =========================
   Rendering
========================= */
function renderAll() {
  populateCategories();

  const f = getFilters();
  const filtered = applyFilter(TX, f);

  renderKPIs(filtered);
  renderTable(filtered);
  renderCharts(filtered);
}

function renderKPIs(list) {
  const s = summarize(list);

  els.kpiIncome.textContent = money(s.income);
  els.kpiExpense.textContent = money(s.expense);
  els.kpiProfit.textContent = money(s.profit);
  els.kpiCount.textContent = String(s.count);
  els.kpiAvg.textContent = `Средний чек: ${money(s.avg)}`;
  els.kpiProfitSub.textContent = `Маржа: ${s.margin.toFixed(1)}%`;

  // Sub: compare previous period if dates set
  const f = getFilters();
  if (f.from && f.to) {
    const from = new Date(f.from + "T00:00:00");
    const to = new Date(f.to + "T00:00:00");
    const days = Math.max(1, Math.round((to - from) / (1000*60*60*24)) + 1);

    const prevTo = new Date(from);
    prevTo.setDate(prevTo.getDate() - 1);
    const prevFrom = new Date(prevTo);
    prevFrom.setDate(prevFrom.getDate() - (days - 1));

    const prevF = {
      ...f,
      from: prevFrom.toISOString().slice(0,10),
      to: prevTo.toISOString().slice(0,10)
    };

    const prev = applyFilter(TX, prevF);
    const ps = summarize(prev);

    els.kpiIncomeSub.textContent = `Период: ${f.from} → ${f.to} | Было: ${money(ps.income)}`;
    els.kpiExpenseSub.textContent = `Было: ${money(ps.expense)}`;
  } else {
    els.kpiIncomeSub.textContent = "—";
    els.kpiExpenseSub.textContent = "—";
  }
}

function renderTable(list) {
  const rows = [...list].sort((a,b) => (b.date + b.id) > (a.date + a.id) ? 1 : -1);

  els.txTable.innerHTML = rows.map(t => {
    const typeLabel = t.type === "income" ? "Доход" : "Расход";
    const typeClass = t.type === "income" ? "tag tag-income" : "tag tag-expense";
    return `
      <tr>
        <td>${escapeHtml(t.date)}</td>
        <td><span class="${typeClass}">${typeLabel}</span></td>
        <td>${escapeHtml(t.category || "Other")}</td>
        <td class="amount ${t.type === "income" ? "amt-income" : "amt-expense"}">${money(t.amount)}</td>
        <td>${escapeHtml(t.method || "")}</td>
        <td>
          <div class="note">
            <div class="note-main">${escapeHtml(t.note || "")}</div>
            ${t.tag ? `<div class="note-sub">#${escapeHtml(t.tag)}</div>` : ``}
          </div>
        </td>
        <td class="tx-actions">
          <button class="icon-btn" title="Удалить" data-del="${t.id}">✕</button>
        </td>
      </tr>
    `;
  }).join("");

  // bind delete
  els.txTable.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.getAttribute("data-del"));
      TX = TX.filter(x => x.id !== id);
      saveTransactions(TX);
      renderAll();
    });
  });
}

/* =========================
   Charts (Professional setup)
========================= */
function renderCharts(list) {
  const bucket = els.bucket.value;

  // Trend: group by bucket
  const grouped = new Map();
  list.forEach(t => {
    const key = groupKey(t.date, bucket);
    const cur = grouped.get(key) || { income: 0, expense: 0 };
    cur[t.type] += Number(t.amount || 0);
    grouped.set(key, cur);
  });

  const labels = Array.from(grouped.keys()).sort((a,b) => a.localeCompare(b));
  const incomeData = labels.map(k => grouped.get(k).income || 0);
  const expenseData = labels.map(k => grouped.get(k).expense || 0);
  const profitData = labels.map((k, i) => (incomeData[i] - expenseData[i]));

  // Donut: expenses by category (top 6 + other)
  const catMap = categoryTotals(list);
  const expensePairs = Array.from(catMap.entries())
    .map(([cat, v]) => [cat, v.expense || 0])
    .filter(([,v]) => v > 0)
    .sort((a,b) => b[1] - a[1]);

  const top = expensePairs.slice(0, 6);
  const rest = expensePairs.slice(6).reduce((s, x) => s + x[1], 0);
  if (rest > 0) top.push(["Other", rest]);

  const donutLabels = top.map(x => x[0]);
  const donutData = top.map(x => x[1]);

  // Bars: income vs expense by category (top 10 by total volume)
  const catPairs = Array.from(catMap.entries())
    .map(([cat, v]) => [cat, (v.income||0) + (v.expense||0), v.income||0, v.expense||0])
    .sort((a,b) => b[1] - a[1])
    .slice(0, 10);

  const barLabels = catPairs.map(x => x[0]);
  const barIncome = catPairs.map(x => x[2]);
  const barExpense = catPairs.map(x => x[3]);

  // Build charts
  buildTrend(labels, incomeData, expenseData, profitData);
  buildDonut(donutLabels, donutData);
  buildBars(barLabels, barIncome, barExpense);
}

function commonChartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { boxWidth: 12, boxHeight: 12, padding: 12 } },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${money(ctx.parsed.y ?? ctx.parsed)}`
        }
      }
    },
    scales: {
      y: {
        grid: { color: "rgba(15,23,42,.06)" },
        ticks: {
          callback: (v) => {
            const n = Number(v);
            if (n >= 100000) return `${Math.round(n/1000)}k`;
            return n;
          }
        }
      },
      x: {
        grid: { display: false }
      }
    }
  };
}

function buildTrend(labels, income, expense, profit) {
  if (trendChart) trendChart.destroy();

  trendChart = new Chart(els.chartTrend, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Доход",
          data: income,
          borderWidth: 2,
          tension: 0.35,
          fill: true,
          backgroundColor: "rgba(34,197,94,.12)",
          borderColor: "rgba(34,197,94,1)",
          pointRadius: 2
        },
        {
          label: "Расход",
          data: expense,
          borderWidth: 2,
          tension: 0.35,
          fill: true,
          backgroundColor: "rgba(239,68,68,.10)",
          borderColor: "rgba(239,68,68,1)",
          pointRadius: 2
        },
        {
          label: "Прибыль",
          data: profit,
          borderWidth: 2,
          tension: 0.35,
          fill: false,
          borderColor: "rgba(11,102,255,1)",
          pointRadius: 2
        }
      ]
    },
    options: {
      ...commonChartOptions(),
      plugins: {
        ...commonChartOptions().plugins,
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${money(ctx.parsed.y)}`
          }
        }
      }
    }
  });
}

function buildDonut(labels, data) {
  if (donutChart) donutChart.destroy();

  donutChart = new Chart(els.chartDonut, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data,
          borderWidth: 0,
          hoverOffset: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "70%",
      plugins: {
        legend: { position: "bottom" },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.label}: ${money(ctx.parsed)}`
          }
        }
      }
    }
  });
}

function buildBars(labels, income, expense) {
  if (barChart) barChart.destroy();

  barChart = new Chart(els.chartBars, {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Доход", data: income },
        { label: "Расход", data: expense }
      ]
    },
    options: {
      ...commonChartOptions(),
      scales: {
        ...commonChartOptions().scales,
        x: { grid: { display: false } }
      }
    }
  });
}

/* =========================
   Actions
========================= */
function setPreset(preset) {
  const now = new Date();
  const to = new Date(now);
  let from = new Date(now);

  if (preset === "this_month") {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    const days = Number(preset);
    from.setDate(from.getDate() - (days - 1));
  }

  els.fromDate.value = from.toISOString().slice(0,10);
  els.toDate.value = to.toISOString().slice(0,10);

  document.querySelectorAll(".seg-btn").forEach(b => b.classList.remove("active"));
  document.querySelector(`.seg-btn[data-preset="${preset}"]`)?.classList.add("active");
  renderAll();
}

function resetFilters() {
  els.fromDate.value = "";
  els.toDate.value = "";
  els.typeFilter.value = "all";
  els.categoryFilter.value = "all";
  els.searchFilter.value = "";
  document.querySelectorAll(".seg-btn").forEach(b => b.classList.remove("active"));
  document.querySelector(`.seg-btn[data-preset="30"]`)?.classList.add("active");
  setPreset("30");
}

function addTransaction(tx) {
  TX.push(tx);
  saveTransactions(TX);
  renderAll();
}

function exportCSV() {
  const f = getFilters();
  const filtered = applyFilter(TX, f).sort((a,b) => a.date.localeCompare(b.date));

  const header = ["date","type","category","amount","method","tag","note"];
  const lines = [header.join(",")];

  filtered.forEach(t => {
    const row = [
      t.date,
      t.type,
      `"${String(t.category||"").replaceAll('"','""')}"`,
      Number(t.amount || 0),
      t.method || "",
      `"${String(t.tag||"").replaceAll('"','""')}"`,
      `"${String(t.note||"").replaceAll('"','""')}"`,
    ];
    lines.push(row.join(","));
  });

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `finance_export_${todayISO()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* =========================
   Bind UI
========================= */
function initUI() {
  populateCategories();

  els.txDate.value = todayISO();

  // segmented presets
  document.querySelectorAll(".seg-btn").forEach(btn => {
    btn.addEventListener("click", () => setPreset(btn.dataset.preset));
  });

  els.applyBtn.addEventListener("click", renderAll);
  els.resetBtn.addEventListener("click", resetFilters);
  els.exportBtn.addEventListener("click", exportCSV);

  els.bucket.addEventListener("change", renderAll);

  // live search
  let searchTimer = null;
  els.searchFilter.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(renderAll, 180);
  });

  els.addBtn.addEventListener("click", () => {
    const type = els.txType.value;
    const category = els.txCategory.value;
    const amount = Number(els.txAmount.value);
    const date = els.txDate.value || todayISO();
    const note = safeStr(els.txNote.value);
    const method = els.txMethod.value;
    const tag = safeStr(els.txTag.value);

    if (!amount || amount <= 0 || !note) {
      alert("Заполни сумму и описание (клиент/работа).");
      return;
    }

    addTransaction({
      id: Date.now(),
      type,
      category: category || "Other",
      amount,
      date,
      note,
      method,
      tag
    });

    els.txAmount.value = "";
    els.txNote.value = "";
    els.txTag.value = "";
  });

  els.demoBtn.addEventListener("click", () => {
    const demo = [
      { type:"income", category:"Cleaning: House", amount:1200, note:"House cleaning — Villa (Client: Karim)", method:"card", tag:"vip" },
      { type:"expense", category:"Supplies / Materials", amount:180, note:"Chemicals + tools", method:"cash", tag:"" },
      { type:"expense", category:"Transport / Fuel", amount:90, note:"Fuel / parking", method:"cash", tag:"" },
      { type:"income", category:"Cleaning: Apartment", amount:450, note:"Apartment deep cleaning", method:"cash", tag:"urgent" }
    ];

    demo.forEach((d,i) => addTransaction({
      id: Date.now() + i,
      date: todayISO(),
      ...d
    }));
  });

  // default preset
  setPreset("30");
}

initUI();
