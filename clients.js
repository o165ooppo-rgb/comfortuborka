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
  }, 2200);
}

function logout(){ window.location.href = "index.html"; }

function loadClients(){
  const saved = localStorage.getItem("orderHistory");
  const orders = saved ? JSON.parse(saved) : [];

  // Собираем клиентов по телефону
  const map = new Map();
  orders.forEach(o => {
    const key = (o.phone || "").trim();
    if (!key) return;
    if (!map.has(key)){
      map.set(key, { name: o.name, phone: o.phone, totalOrders: 0, totalSpent: 0, lastOrder: 0 });
    }
    const c = map.get(key);
    c.totalOrders += 1;
    c.totalSpent += Number(o.total || 0);
    c.lastOrder = Math.max(c.lastOrder, Number(o.timestamp || 0));
  });

  renderClients([...map.values()].sort((a,b) => b.lastOrder - a.lastOrder));
}

function renderClients(clients){
  const root = document.getElementById("client-list");
  root.innerHTML = "";

  if (!clients.length){
    root.innerHTML = `<div class="order-card"><p class="muted">Пока нет клиентов (нет заказов).</p></div>`;
    return;
  }

  clients.forEach(c => {
    const card = document.createElement("div");
    card.className = "order-card";
    card.innerHTML = `
      <p><strong>${escapeHtml(c.name)}</strong> <span class="muted">(${escapeHtml(c.phone)})</span></p>
      <p><span class="muted">Заказов:</span> <strong>${c.totalOrders}</strong></p>
      <p><span class="muted">Потратил:</span> <strong>${c.totalSpent.toLocaleString("ru-RU")} Сум</strong></p>
      <p class="muted">Последний заказ: ${new Date(c.lastOrder).toLocaleString()}</p>
    `;
    root.appendChild(card);
  });

  showToast("info","Готово",`Клиентов: ${clients.length}`);
}

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}

window.onload = loadClients;
