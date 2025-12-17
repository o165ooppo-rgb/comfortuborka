/* =========================
   Data: Services
========================= */
const services = {
  service1: {
    key: "service1",
    title: { ru: "Двор", uz: "Hovli", en: "Yard" },
    description: { ru: "Уборка двора", uz: "Hovlini tozalash", en: "Yard cleaning" },
    price: 15000,
    photo: "photos/house.png",
  },
  service2: {
    key: "service2",
    title: { ru: "Квартира", uz: "Kvartira", en: "Apartment" },
    description: { ru: "Уборка квартиры", uz: "Kvartirani tozalash", en: "Apartment cleaning" },
    price: 15000,
    photo: "photos/house.png",
  },
  service3: {
    key: "service3",
    title: { ru: "Школа", uz: "Maktab", en: "School" },
    description: { ru: "Уборка школы", uz: "Maktabni tozalash", en: "School cleaning" },
    price: 15000,
    photo: "photos/house.png",
  },
  service4: {
    key: "service4",
    title: { ru: "Квартира", uz: "Kvartira", en: "Apartment" },
    description: { ru: "Уборка квартиры", uz: "Kvartirani tozalash", en: "Apartment cleaning" },
    price: 15000,
    photo: "photos/house.png",
  },
  service5: {
    key: "service5",
    title: { ru: "Квартира", uz: "Kvartira", en: "Apartment" },
    description: { ru: "Уборка квартиры", uz: "Kvartirani tozalash", en: "Apartment cleaning" },
    price: 15000,
    photo: "photos/house.png",
  },
  service6: {
    key: "service6",
    title: { ru: "Квартира", uz: "Kvartira", en: "Apartment" },
    description: { ru: "Уборка квартиры", uz: "Kvartirani tozalash", en: "Apartment cleaning" },
    price: 15000,
    photo: "photos/house.png",
  },
  service7: {
    key: "service7",
    title: { ru: "Квартира", uz: "Kvartira", en: "Apartment" },
    description: { ru: "Уборка квартиры", uz: "Kvartirani tozalash", en: "Apartment cleaning" },
    price: 15000,
    photo: "photos/house.png",
  },
  service8: {
    key: "service8",
    title: { ru: "Квартира", uz: "Kvartira", en: "Apartment" },
    description: { ru: "Уборка квартиры", uz: "Kvartirani tozalash", en: "Apartment cleaning" },
    price: 15000,
    photo: "photos/house.png",
  },
  // Добавь остальные услуги по аналогии
};

let currentService = null;
let orderHistory = [];
let currentLanguage = "ru";
let adminLoggedIn = false;

/* =========================
   UI: Toast
========================= */
function showToast(type, title, text) {
  const root = document.getElementById("toastRoot");
  if (!root) return;

  const icons = {
    success: "fa-circle-check",
    error: "fa-circle-xmark",
    info: "fa-circle-info",
  };

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

/* =========================
   Modal helpers
========================= */
function openModalUI(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add("open");
  el.setAttribute("aria-hidden", "false");

  // close on click outside
  el.addEventListener("click", (e) => {
    if (e.target === el) closeModalUI(id);
  }, { once: true });
}

function closeModalUI(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove("open");
  el.setAttribute("aria-hidden", "true");
}

/* =========================
   Language
========================= */
function changeLanguage() {
  const languageSelect = document.getElementById("language-select");
  currentLanguage = languageSelect.value;
  renderServices();
  updateTexts();
  renderOrderHistory();
}

function updateTexts() {
  const dict = {
    servicesTitle: { ru: "Услуги", uz: "Xizmatlar", en: "Services" },
    servicesSubtitle: { ru: "Выберите услугу и оформите заказ за 1 минуту", uz: "Xizmatni tanlang va 1 daqiqada buyurtma bering", en: "Choose a service and place an order in 1 minute" },
    historySubtitle: { ru: "Заказы автоматически удаляются через 24 часа", uz: "Buyurtmalar 24 soatdan keyin avtomatik o‘chadi", en: "Orders are automatically removed after 24 hours" },

    pricePerUnitLabel: { ru: "Цена за единицу:", uz: "Birlik narxi:", en: "Price per unit:" },
    quantityLabel: { ru: "Количество (кв. м):", uz: "Miqdori (kv.m):", en: "Quantity (sq.m):" },
    totalPriceText: { ru: "Общая цена:", uz: "Umumiy narx:", en: "Total price:" },
    addToOrderButton: { ru: "Добавить в заказ", uz: "Buyurtmaga qo'shish", en: "Add to order" },

    orderFormTitle: { ru: "Оформление заказа", uz: "Buyurtma qilish", en: "Place an order" },
    serviceLabelText: { ru: "Услуга:", uz: "Xizmat:", en: "Service:" },
    orderTotalText: { ru: "Общая сумма:", uz: "Umumiy summa:", en: "Total amount:" },
    namePlaceholder: { ru: "Ваше имя", uz: "Ismingiz", en: "Your name" },
    phonePlaceholder: { ru: "Ваш телефон", uz: "Telefoningiz", en: "Your phone" },
    addressPlaceholder: { ru: "Ваш адрес", uz: "Manzilingiz", en: "Your address" },
    confirmOrderButton: { ru: "Подтвердить заказ", uz: "Buyurtmani tasdiqlash", en: "Confirm order" },

    orderDetailsTitle: { ru: "Детали заказа", uz: "Buyurtma tafsilotlari", en: "Order details" },
    orderHistoryTitle: { ru: "История заказов", uz: "Buyurtmalar tarixi", en: "Order history" },
  };

  // Optional titles exist
  const t1 = document.getElementById("servicesTitle");
  const t2 = document.getElementById("servicesSubtitle");
  const t3 = document.getElementById("historySubtitle");
  if (t1) t1.innerText = dict.servicesTitle[currentLanguage];
  if (t2) t2.innerText = dict.servicesSubtitle[currentLanguage];
  if (t3) t3.innerText = dict.historySubtitle[currentLanguage];

  document.getElementById("pricePerUnitLabel").innerText = dict.pricePerUnitLabel[currentLanguage];
  document.getElementById("quantityLabel").innerText = dict.quantityLabel[currentLanguage];
  document.getElementById("totalPriceText").innerText = dict.totalPriceText[currentLanguage];
  document.getElementById("addToOrderButton").innerText = dict.addToOrderButton[currentLanguage];

  document.getElementById("orderFormTitle").innerText = dict.orderFormTitle[currentLanguage];
  document.getElementById("serviceLabelText").innerText = dict.serviceLabelText[currentLanguage];
  document.getElementById("orderTotalText").innerText = dict.orderTotalText[currentLanguage];
  document.getElementById("name").placeholder = dict.namePlaceholder[currentLanguage];
  document.getElementById("phone").placeholder = dict.phonePlaceholder[currentLanguage];
  document.getElementById("address").placeholder = dict.addressPlaceholder[currentLanguage];
  document.getElementById("confirmOrderButton").innerText = dict.confirmOrderButton[currentLanguage];

  document.getElementById("orderDetailsTitle").innerText = dict.orderDetailsTitle[currentLanguage];
  document.getElementById("orderHistoryTitle").innerText = dict.orderHistoryTitle[currentLanguage];
}

/* =========================
   Services UI
========================= */
function renderServices() {
  const serviceGrid = document.querySelector(".service-grid");
  serviceGrid.innerHTML = "";

  Object.keys(services).forEach((key) => {
    const service = services[key];

    const item = document.createElement("div");
    item.className = "service-item";

    const img = document.createElement("img");
    img.src = service.photo;
    img.alt = service.title[currentLanguage];

    const title = document.createElement("h3");
    title.innerText = service.title[currentLanguage];

    const button = document.createElement("button");
    button.innerText =
      currentLanguage === "ru" ? "Выбрать" : currentLanguage === "uz" ? "Tanlash" : "Select";
    button.onclick = () => openServiceModal(service.key);

    item.appendChild(img);
    item.appendChild(title);
    item.appendChild(button);

    serviceGrid.appendChild(item);
  });
}

/* =========================
   Service Modal
========================= */
function openServiceModal(serviceKey) {
  currentService = services[serviceKey];

  document.getElementById("serviceTitle").innerText = currentService.title[currentLanguage];
  document.getElementById("serviceDescription").innerText = currentService.description[currentLanguage];
  document.getElementById("servicePrice").innerText = currentService.price.toLocaleString("ru-RU");

  document.getElementById("squareMeters").value = 1;
  updateTotalPrice();

  openModalUI("modal");
}

function closeModal() {
  closeModalUI("modal");
  currentService = null;
}

function updateTotalPrice() {
  const squareMeters = parseInt(document.getElementById("squareMeters").value || "1", 10);
  const totalPrice = squareMeters * currentService.price;
  document.getElementById("totalServicePrice").innerText = totalPrice.toLocaleString("ru-RU");
}

function addToOrder() {
  const squareMeters = parseInt(document.getElementById("squareMeters").value || "1", 10);
  const totalPrice = squareMeters * currentService.price;

  document.getElementById("orderService").innerText = `${currentService.title[currentLanguage]} (${squareMeters} кв. м)`;
  document.getElementById("orderTotal").innerText = `${totalPrice.toLocaleString("ru-RU")} Сум`;

  openModalUI("orderFormModal");
}

/* =========================
   Order Form
========================= */
function closeOrderForm() {
  closeModalUI("orderFormModal");

  document.getElementById("name").value = "";
  document.getElementById("phone").value = "";
  document.getElementById("address").value = "";
  document.getElementById("date").value = "";
  document.getElementById("time").value = "";
}

function confirmOrder() {
  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const address = document.getElementById("address").value.trim();
  const date = document.getElementById("date").value;
  const time = document.getElementById("time").value;

  const serviceText = document.getElementById("orderService").innerText;
  const totalText = document.getElementById("orderTotal").innerText;
  const totalPrice = parseInt(totalText.replace(/\D/g, ""), 10);

  if (!name || !phone || !address || !date || !time) {
    showToast("error",
      currentLanguage === "ru" ? "Ошибка" : currentLanguage === "uz" ? "Xatolik" : "Error",
      currentLanguage === "ru" ? "Заполните все поля." : currentLanguage === "uz" ? "Barcha maydonlarni to'ldiring." : "Please fill in all fields."
    );
    return;
  }

  const now = Date.now();

  const orderDetails = {
    id: `ord_${now}`,
    name,
    phone,
    total: totalPrice,
    address,
    date,
    time,
    service: serviceText,

    // NEW: worker panel fields
    status: "new",          // new | in_progress | done
    assignedTo: null,       // worker name (optional)
    workerNote: "",         // comment
    completedAt: null,

    timestamp: now,
    expirationTime: now + 24 * 60 * 60 * 1000,
  };

  orderHistory.push(orderDetails);
  localStorage.setItem("orderHistory", JSON.stringify(orderHistory));

  renderOrderHistory();
  closeOrderForm();
  closeModal();

  showToast("success",
    currentLanguage === "ru" ? "Готово" : currentLanguage === "uz" ? "Tayyor" : "Done",
    currentLanguage === "ru" ? "Заказ успешно оформлен!" : currentLanguage === "uz" ? "Buyurtma muvaffaqiyatli amalga oshirildi!" : "Order placed successfully!"
  );
}

/* =========================
   Order History
========================= */
function renderOrderHistory() {
  const container = document.getElementById("orderHistory");
  container.innerHTML = "";

  const currentTime = Date.now();

  // Remove expired
  orderHistory = orderHistory.filter((o) => o.expirationTime > currentTime);
  localStorage.setItem("orderHistory", JSON.stringify(orderHistory));

  if (orderHistory.length === 0) {
    container.innerHTML = `<div class="order-card"><p class="muted">${
      currentLanguage === "ru" ? "История заказов пуста."
      : currentLanguage === "uz" ? "Buyurtmalar tarixi bo'sh."
      : "Order history is empty."
    }</p></div>`;
    return;
  }

  orderHistory.forEach((order, index) => {
    const card = document.createElement("div");
    card.className = "order-card";

    const badge = statusBadge(order.status);

    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap;">
        <p><strong>${label("Заказ", "Buyurtma", "Order")} #${index + 1}</strong></p>
        ${badge}
      </div>

      <p>${label("Имя", "Ism", "Name")}: <strong>${escapeHtml(order.name)}</strong></p>
      <p>${label("Сумма", "Summa", "Amount")}: <strong>${Number(order.total).toLocaleString("ru-RU")} Сум</strong></p>
      <p>${label("Дата и время", "Sana va vaqt", "Date and Time")}: ${new Date(order.timestamp).toLocaleString()}</p>

      <div class="countdown" id="countdown-${index}"></div>

      <button class="btn-blue" onclick="showOrderDetails(${index})">${label("Подробнее", "Batafsil", "Details")}</button>
      <button class="btn-yellow" onclick="editOrder(${index})">${label("Редактировать", "Tahrirlash", "Edit")}</button>
      <button class="btn-red" onclick="deleteOrder(${index})">${label("Удалить", "O'chirish", "Delete")}</button>
    `;

    container.appendChild(card);
    initializeCountdown(order.expirationTime, `countdown-${index}`);
  });
}

function statusBadge(status) {
  const s = status || "new";
  if (s === "in_progress") return `<span class="badge badge-work"><i class="fa-solid fa-person-walking"></i> ${label("В работе","Ishda","In progress")}</span>`;
  if (s === "done") return `<span class="badge badge-done"><i class="fa-solid fa-circle-check"></i> ${label("Завершён","Yakunlandi","Done")}</span>`;
  return `<span class="badge badge-new"><i class="fa-solid fa-bolt"></i> ${label("Новый","Yangi","New")}</span>`;
}

function label(ru, uz, en){
  return currentLanguage === "ru" ? ru : currentLanguage === "uz" ? uz : en;
}

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}

function initializeCountdown(expirationTime, elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const r = 22;
  const cx = 26, cy = 26;
  const C = 2 * Math.PI * r;
  const totalTime = Math.max(1, expirationTime - Date.now());

  el.innerHTML = `
    <svg width="52" height="52" viewBox="0 0 52 52" aria-hidden="true">
      <circle class="cd-bg" cx="${cx}" cy="${cy}" r="${r}"></circle>
      <circle class="cd-ring" cx="${cx}" cy="${cy}" r="${r}"
              stroke-dasharray="${C}" stroke-dashoffset="0"></circle>
    </svg>
    <div class="countdown-text"></div>
  `;

  const ring = el.querySelector(".cd-ring");
  const text = el.querySelector(".countdown-text");

  function setRingState(remainingMs) {
    const H6 = 6 * 60 * 60 * 1000;
    const H1 = 1 * 60 * 60 * 1000;
    const M15 = 15 * 60 * 1000;

    // сброс классов
    el.classList.remove("cd-warn", "cd-urgent", "cd-pulse");

    if (remainingMs <= M15) {
      el.classList.add("cd-urgent", "cd-pulse"); // красный + пульс
    } else if (remainingMs <= H1) {
      el.classList.add("cd-urgent"); // красный
    } else if (remainingMs <= H6) {
      el.classList.add("cd-warn"); // жёлтый
    }
    // иначе — default (синий)
  }

  function tick() {
    const remaining = expirationTime - Date.now();
    if (remaining <= 0) {
      if (typeof renderOrderHistory === "function") renderOrderHistory();
      return;
    }

    const progress = remaining / totalTime;        // 1 -> 0
    const dashOffset = C * (1 - progress);         // 0 -> C
    ring.style.strokeDashoffset = `${dashOffset}`;

    setRingState(remaining);

    const h = Math.floor(remaining / (1000 * 60 * 60));
    const m = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((remaining % (1000 * 60)) / 1000);
    text.textContent = `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;

    requestAnimationFrame(tick);
  }

  tick();
}

/* Details */
function showOrderDetails(index) {
  const order = orderHistory[index];

  document.getElementById("detailsNameLabel").innerText = `${label("Имя","Ism","Name")}: ${order.name}`;
  document.getElementById("detailsTotalLabel").innerText = `${label("Общая сумма","Umumiy summa","Total amount")}: ${Number(order.total).toLocaleString("ru-RU")} Сум`;
  document.getElementById("detailsAddressLabel").innerText = `${label("Адрес","Manzil","Address")}: ${order.address}`;
  document.getElementById("detailsDateLabel").innerText = `${label("Дата","Sana","Date")}: ${order.date}`;
  document.getElementById("detailsTimeLabel").innerText = `${label("Время","Vaqt","Time")}: ${order.time}`;
  document.getElementById("detailsServiceLabel").innerText = `${label("Услуга","Xizmat","Service")}: ${order.service}`;

  openModalUI("orderDetailsModal");
}

function closeOrderDetails() {
  closeModalUI("orderDetailsModal");
}

/* Director gated actions (kept simple) */
function editOrder(index) {
  if (!adminLoggedIn) {
    const password = prompt(label("Введите пароль для редактирования заказа:","Parolni kiriting:","Enter password to edit:"));
    if (password !== "admin123") {
      showToast("error", label("Неверный пароль","Noto'g'ri parol","Incorrect password"), "");
      return;
    }
  }
  showToast("info", label("Пока не готово","Hali tayyor emas","Not ready"), label("Редактирование заказа пока не реализовано.","Tahrirlash hali yo'q.","Editing is not implemented yet."));
}

function deleteOrder(index) {
  if (!adminLoggedIn) {
    const password = prompt(label("Введите пароль для удаления заказа:","Parolni kiriting:","Enter password to delete:"));
    if (password !== "admin123") {
      showToast("error", label("Неверный пароль","Noto'g'ri parol","Incorrect password"), "");
      return;
    }
  }
  if (confirm(label("Вы уверены, что хотите удалить этот заказ?","Ishonchingiz komilmi?","Are you sure?"))) {
    orderHistory.splice(index, 1);
    localStorage.setItem("orderHistory", JSON.stringify(orderHistory));
    renderOrderHistory();
    showToast("success", label("Удалено","O'chirildi","Deleted"), "");
  }
}

/* Navigation */
function openClientDatabase() { window.location.href = "clients.html"; }
function openAccountant() { window.location.href = "accountant.html"; }
function openWorker() { window.location.href = "worker.html"; }

function openAdminLogin() {
  const password = prompt(label("Введите пароль директора:","Direktor parolini kiriting:","Enter director password:"));
  if (password === "admin123") {
    adminLoggedIn = true;
    localStorage.setItem("adminLoggedIn", "true");
    showToast("success", label("Доступ открыт","Kirish mumkin","Access granted"), label("Вы вошли как директор.","Siz direktor sifatida kirdingiz.","You are logged in as director."));
  } else {
    showToast("error", label("Неверный пароль","Noto'g'ri parol","Incorrect password"), "");
  }
}

/* Init */
window.onload = function () {
  const saved = localStorage.getItem("orderHistory");
  if (saved) orderHistory = JSON.parse(saved);

  adminLoggedIn = localStorage.getItem("adminLoggedIn") === "true";

  renderServices();
  updateTexts();
  renderOrderHistory();

  document.getElementById("language-select").value = currentLanguage;

  setInterval(renderOrderHistory, 60000);
};
