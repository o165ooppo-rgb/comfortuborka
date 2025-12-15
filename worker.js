let orders = [];
let workerName = "";

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
  }, 2600);
}

function goHome(){ window.location.href = "index.html"; }

function logoutWorker(){
  // тут можно сделать очистку workerSession, если захочешь
  showToast("info","Выход","Возвращаю на главную");
  setTimeout(() => goHome(), 300);
}

function loadData(){
  const saved = localStorage.getItem("orderHistory");
  orders = saved ? JSON.parse(saved) : [];

  const now = Date.now();
  // удалить истекшие
  orders = orders.filter(o => o.expirationTime > now);
  localStorage.setItem("orderHistory", JSON.stringify(orders));

  workerName = localStorage.getItem("workerName") || "";
  const input = document.getElementById("workerName");
  if (input) input.value = workerName;

  renderOrders();
}

function saveWorkerName(){
  const input = document.getElementById("workerName");
  workerName = (input.value || "").trim();
  localStorage.setItem("workerName", workerName);
  showToast("success","Сохранено", workerName ? `Работник: ${workerName}` : "Имя очищено");
}

function renderOrders(){
  const root = document.getElementById("worker-orders");
  root.innerHTML = "";

  if (!orders.length){
    root.innerHTML = `<div class="order-card"><p class="muted">Нет активных заказов.</p></div>`;
    return;
  }

  orders
    .sort((a,b) => (a.status === "done") - (b.status === "done")) // done вниз
    .forEach((o, idx) => {
      const card = document.createElement("div");
      card.className = "order-card";

      const badge = statusBadge(o.status);

      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap;">
          <p><strong>Заказ #${idx + 1}</strong></p>
          ${badge}
        </div>

        <p><span class="muted">Клиент:</span> <strong>${escapeHtml(o.name)}</strong> (${escapeHtml(o.phone)})</p>
        <p><span class="muted">Адрес:</span> <strong>${escapeHtml(o.address)}</strong></p>
        <p><span class="muted">Время:</span> <strong>${escapeHtml(o.date)} ${escapeHtml(o.time)}</strong></p>
        <p><span class="muted">Услуга:</span> <strong>${escapeHtml(o.service)}</strong></p>
        <p><span class="muted">Сумма:</span> <strong>${Number(o.total).toLocaleString("ru-RU")} Сум</strong></p>

        <div class="order-summary" style="margin-top:12px;">
          <p class="muted" style="margin-bottom:8px;font-weight:800;">Комментарий работника</p>
          <textarea id="note-${o.id}" rows="2" style="width:100%;padding:12px 14px;border-radius:12px;border:1px solid rgba(15,23,42,.15);resize:vertical;">${o.workerNote || ""}</textarea>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
            <button class="btn-gray" onclick="saveNote('${o.id}')">Сохранить комментарий</button>
            <button class="btn-blue" onclick="takeOrder('${o.id}')">Взять в работу</button>
            <button class="btn-yellow" onclick="setInProgress('${o.id}')">В работе</button>
            <button class="btn-red" onclick="completeOrder('${o.id}')">Завершить</button>
            <button class="btn-gray" onclick="removeOrder('${o.id}')">Удалить</button>
          </div>
          <p class="muted" style="margin-top:10px;">
            Назначен: <strong>${o.assignedTo ? escapeHtml(o.assignedTo) : "-"}</strong>
            ${o.completedAt ? ` | Завершён: <strong>${new Date(o.completedAt).toLocaleString()}</strong>` : ""}
          </p>
        </div>
      `;

      root.appendChild(card);
    });
}

function statusBadge(status){
  if (status === "in_progress") return `<span class="badge badge-work"><i class="fa-solid fa-person-walking"></i> В работе</span>`;
  if (status === "done") return `<span class="badge badge-done"><i class="fa-solid fa-circle-check"></i> Завершён</span>`;
  return `<span class="badge badge-new"><i class="fa-solid fa-bolt"></i> Новый</span>`;
}

function saveNote(orderId){
  const noteEl = document.getElementById(`note-${orderId}`);
  const note = (noteEl?.value || "").trim();

  const o = orders.find(x => x.id === orderId);
  if (!o) return;

  o.workerNote = note;
  persist();
  showToast("success","Комментарий сохранён", note ? "Ок" : "Комментарий очищен");
}

function takeOrder(orderId){
  const o = orders.find(x => x.id === orderId);
  if (!o) return;

  const name = (localStorage.getItem("workerName") || "").trim();
  if (!name){
    showToast("error","Нужно имя работника","Сверху введи имя и нажми “Сохранить”");
    return;
  }

  o.assignedTo = name;
  o.status = "in_progress";
  persist();
  showToast("success","Заказ взят в работу", `Работник: ${name}`);
}

function setInProgress(orderId){
  const o = orders.find(x => x.id === orderId);
  if (!o) return;

  o.status = "in_progress";
  persist();
  showToast("info","Статус обновлён","В работе");
}

function completeOrder(orderId){
  const o = orders.find(x => x.id === orderId);
  if (!o) return;

  o.status = "done";
  o.completedAt = Date.now();
  persist();
  showToast("success","Завершено","Заказ помечен как выполненный");
}

function removeOrder(orderId){
  if (!confirm("Удалить заказ?")) return;
  orders = orders.filter(x => x.id !== orderId);
  persist();
  showToast("success","Удалено","Заказ удалён");
}

function persist(){
  localStorage.setItem("orderHistory", JSON.stringify(orders));
  renderOrders();
}

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}

window.onload = loadData;
