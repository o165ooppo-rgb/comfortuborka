let transactions = [];

function showToast(type, title, text) {
  const root = document.getElementById("toastRoot");
  if (!root) return;

  const icons = { success:"fa-circle-check", error:"fa-circle-xmark", info:"fa-circle-info" };
  const toast = document.createElement("div");
  toast.className = `toast ${type || "info"}`;
  toast.innerHTML = `
    <div class="t-icon"><i class="fa-solid ${icons[type] || icons.info}"></i></div>
    <div>
      <div class="t-title">${title || ""}</div>
      <div class="t-text">${text || ""}</div>
    </div>
  `;
  root.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";
    toast.style.transition = "opacity .2s ease, transform .2s ease";
    setTimeout(() => toast.remove(), 220);
  }, 2400);
}

window.onload = function () {
  const saved = localStorage.getItem("transactions");
  if (saved) transactions = JSON.parse(saved);

  renderTransactions();

  document.getElementById("transaction-form").addEventListener("submit", function (event) {
    event.preventDefault();
    addTransaction();
  });
};

function addTransaction() {
  const type = document.getElementById("transaction-type").value;
  const amount = parseFloat(document.getElementById("transaction-amount").value);
  const description = document.getElementById("transaction-description").value.trim();

  if (!amount || !description) {
    showToast("error", "Ошибка", "Заполните все поля.");
    return;
  }

  const transaction = {
    type,
    amount,
    description,
    date: new Date().toLocaleString(),
  };

  transactions.push(transaction);
  localStorage.setItem("transactions", JSON.stringify(transactions));
  renderTransactions();

  document.getElementById("transaction-form").reset();
  showToast("success", "Добавлено", type === "income" ? "Доход добавлен" : "Расход добавлен");
}

function renderTransactions() {
  const list = document.getElementById("transaction-list");
  list.innerHTML = "";

  let incomeTotal = 0;
  let expenseTotal = 0;

  if (transactions.length === 0) {
    list.innerHTML = `<div class="order-card"><p class="muted">Нет транзакций.</p></div>`;
    document.getElementById("transaction-summary").innerHTML = "";
    return;
  }

  transactions.forEach((t, index) => {
    const card = document.createElement("div");
    card.className = "order-card";

    card.innerHTML = `
      <p><strong>${t.type === "income" ? "Доход" : "Расход"}</strong></p>
      <p><span class="muted">Сумма:</span> <strong>${t.amount.toLocaleString("ru-RU")} Сум</strong></p>
      <p><span class="muted">Описание:</span> <strong>${escapeHtml(t.description)}</strong></p>
      <p class="muted">Дата: ${t.date}</p>
      <button class="btn-red" onclick="deleteTransaction(${index})">Удалить</button>
    `;

    list.appendChild(card);

    if (t.type === "income") incomeTotal += t.amount;
    else expenseTotal += t.amount;
  });

  document.getElementById("transaction-summary").innerHTML = `
    <h3 style="margin-bottom:8px;">Общая информация</h3>
    <p><span class="muted">Общий доход:</span> <strong>${incomeTotal.toLocaleString("ru-RU")} Сум</strong></p>
    <p><span class="muted">Общие расходы:</span> <strong>${expenseTotal.toLocaleString("ru-RU")} Сум</strong></p>
    <p><span class="muted">Чистая прибыль:</span> <strong>${(incomeTotal - expenseTotal).toLocaleString("ru-RU")} Сум</strong></p>
  `;
}

function deleteTransaction(index) {
  if (!confirm("Удалить транзакцию?")) return;
  transactions.splice(index, 1);
  localStorage.setItem("transactions", JSON.stringify(transactions));
  renderTransactions();
  showToast("success", "Удалено", "Транзакция удалена");
}

function logout() {
  window.location.href = "index.html";
}

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}
