let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let chart;

function goHome() {
  window.location.href = "index.html";
}

function addTransaction() {
  const type = document.getElementById("transactionType").value;
  const amount = Number(document.getElementById("amount").value);
  const description = document.getElementById("description").value;

  if (!amount || !description) {
    alert("Заполните все поля");
    return;
  }

  transactions.push({
    id: Date.now(),
    type,
    amount,
    description,
    date: new Date().toISOString().split("T")[0]
  });

  localStorage.setItem("transactions", JSON.stringify(transactions));
  document.getElementById("amount").value = "";
  document.getElementById("description").value = "";

  render();
}

function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  localStorage.setItem("transactions", JSON.stringify(transactions));
  render();
}

function applyFilters() {
  render(true);
}

function resetFilters() {
  document.getElementById("fromDate").value = "";
  document.getElementById("toDate").value = "";
  document.getElementById("typeFilter").value = "all";
  render();
}

function render(filtered = false) {
  let data = [...transactions];

  if (filtered) {
    const from = document.getElementById("fromDate").value;
    const to = document.getElementById("toDate").value;
    const type = document.getElementById("typeFilter").value;

    if (from) data = data.filter(t => t.date >= from);
    if (to) data = data.filter(t => t.date <= to);
    if (type !== "all") data = data.filter(t => t.type === type);
  }

  let income = 0, expense = 0;
  data.forEach(t => {
    t.type === "income" ? income += t.amount : expense += t.amount;
  });

  document.getElementById("totalIncome").textContent = income.toLocaleString();
  document.getElementById("totalExpense").textContent = expense.toLocaleString();
  document.getElementById("totalProfit").textContent = (income - expense).toLocaleString();

  renderTable(data);
  renderChart(data);
}

function renderTable(data) {
  const table = document.getElementById("transactionTable");
  table.innerHTML = "";

  data.reverse().forEach(t => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${t.date}</td>
      <td class="${t.type}">${t.type === "income" ? "Доход" : "Расход"}</td>
      <td>${t.amount.toLocaleString()}</td>
      <td>${t.description}</td>
      <td><button onclick="deleteTransaction(${t.id})">✖</button></td>
    `;
    table.appendChild(row);
  });
}

function renderChart(data) {
  const ctx = document.getElementById("financeChart");

  const grouped = {};
  data.forEach(t => {
    grouped[t.date] ??= { income: 0, expense: 0 };
    grouped[t.date][t.type] += t.amount;
  });

  const labels = Object.keys(grouped);
  const incomeData = labels.map(d => grouped[d].income);
  const expenseData = labels.map(d => grouped[d].expense);

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Доход",
          data: incomeData,
          borderColor: "#22c55e",
          backgroundColor: "rgba(34,197,94,.2)",
          tension: .4
        },
        {
          label: "Расход",
          data: expenseData,
          borderColor: "#ef4444",
          backgroundColor: "rgba(239,68,68,.2)",
          tension: .4
        }
      ]
    }
  });
}

render();
