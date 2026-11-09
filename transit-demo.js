const routes = [
  { name: "Toril - Downtown", fare: 20 },
  { name: "Matina - Downtown", fare: 15 },
  { name: "Buhangin - Downtown", fare: 25 }
];

const walletBalance = document.getElementById("walletBalance");
const loadForm = document.getElementById("loadForm");
const loadAmount = document.getElementById("loadAmount");
const loadMessage = document.getElementById("loadMessage");
const routeMessage = document.getElementById("routeMessage");
const historyList = document.getElementById("historyList");
const paymentDialog = document.getElementById("paymentDialog");
const paymentForm = document.getElementById("paymentForm");
const toast = document.getElementById("toast");
const walletCard = document.querySelector(".wallet-card");
const amountInput = document.querySelector(".amount-input");

let balance = 0;
let pendingRoute = null;
let transactions = [];
let toastTimer;

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2
  }).format(amount);
}

function updateBalance() {
  walletBalance.textContent = formatCurrency(balance);
  animate(walletBalance, "is-updated");
  animate(walletCard, "is-celebrating");
}

function animate(element, className) {
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
}

document.addEventListener("pointerdown", event => {
  const button = event.target.closest("button");
  if (!button || button.disabled) return;

  const bounds = button.getBoundingClientRect();
  const ripple = document.createElement("span");
  ripple.className = "button-ripple";
  ripple.style.left = `${event.clientX - bounds.left}px`;
  ripple.style.top = `${event.clientY - bounds.top}px`;
  button.append(ripple);
  setTimeout(() => ripple.remove(), 600);
});

document.addEventListener("click", event => {
  const button = event.target.closest(".button, .reset-button");
  if (!button || button.disabled) return;
  animate(button, "is-clicked");
});

document.addEventListener("animationend", event => {
  if (event.animationName !== "button-tap") return;
  event.target.classList.remove("is-clicked");
});

document.addEventListener("animationend", event => {
  if (event.animationName !== "balance-pop" && event.animationName !== "wallet-glow") return;
  event.target.classList.remove(event.animationName === "balance-pop" ? "is-updated" : "is-celebrating");
});

function animateMessage(element) {
  animate(element, "is-updated");
}

function showMessage(element, message, kind) {
  element.textContent = message;
  element.dataset.kind = kind || "success";
  animateMessage(element);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

function renderTransactions() {
  if (transactions.length === 0) {
    historyList.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon" aria-hidden="true">⌁</span>
        <p>No demo transactions yet.</p>
        <span>Add demo credits, then choose a route to try it.</span>
      </div>`;
    return;
  }

  historyList.replaceChildren(...transactions.map(transaction => {
    const row = document.createElement("article");
    row.className = "transaction";
    row.style.animationDelay = `${Math.min(transactions.indexOf(transaction), 5) * 70}ms`;

    const detail = document.createElement("div");
    const route = document.createElement("span");
    route.className = "transaction-route";
    route.textContent = transaction.route;
    const date = document.createElement("time");
    date.className = "transaction-date";
    date.dateTime = transaction.date.toISOString();
    date.textContent = transaction.date.toLocaleString("en-PH", {
      dateStyle: "medium",
      timeStyle: "short"
    });
    detail.append(route, date);

    const amount = document.createElement("span");
    amount.className = "transaction-amount";
    amount.textContent = `− ${formatCurrency(transaction.fare)}`;
    row.append(detail, amount);
    return row;
  }));
}

loadAmount.addEventListener("invalid", () => {
  showMessage(loadMessage, "Enter a demo amount between ₱1 and ₱5,000.", "error");
  animate(amountInput, "is-invalid");
});

loadAmount.addEventListener("input", () => {
  amountInput.classList.remove("is-invalid");
  loadMessage.textContent = "";
});

loadForm.addEventListener("submit", event => {
  event.preventDefault();
  const amount = Number(loadAmount.value);
  if (!Number.isFinite(amount) || amount < 1 || amount > 5000) {
    showMessage(loadMessage, "Enter a demo amount between ₱1 and ₱5,000.", "error");
    animate(amountInput, "is-invalid");
    return;
  }

  balance = Math.round((balance + amount) * 100) / 100;
  amountInput.classList.remove("is-invalid");
  updateBalance();
  showMessage(loadMessage, `${formatCurrency(amount)} in demo credits added. No money was charged.`);
  routeMessage.textContent = "";
});

document.querySelectorAll("[data-route][data-fare]").forEach(button => {
  button.addEventListener("click", () => {
    const route = routes.find(item => item.name === button.dataset.route);
    if (!route) return;

    if (balance < route.fare) {
      showMessage(routeMessage, `Not enough demo balance. Add at least ${formatCurrency(route.fare)} to try this fare.`, "error");
      animate(amountInput, "is-invalid");
      loadAmount.focus();
      return;
    }

    pendingRoute = route;
    document.getElementById("confirmRoute").textContent = route.name;
    document.getElementById("confirmAmount").textContent = formatCurrency(route.fare);
    paymentDialog.showModal();
  });
});

paymentForm.addEventListener("submit", event => {
  if (event.submitter?.value !== "confirm") {
    pendingRoute = null;
    return;
  }

  event.preventDefault();
  if (!pendingRoute || balance < pendingRoute.fare) {
    paymentDialog.close();
    pendingRoute = null;
    return;
  }

  balance = Math.round((balance - pendingRoute.fare) * 100) / 100;
  transactions.unshift({
    route: pendingRoute.name,
    fare: pendingRoute.fare,
    date: new Date()
  });
  updateBalance();
  renderTransactions();
  showMessage(routeMessage, `${formatCurrency(pendingRoute.fare)} sample fare paid for ${pendingRoute.name}.`);
  showToast("Demo payment complete — no real payment was made.");
  pendingRoute = null;
  paymentDialog.close();
});

document.getElementById("resetDemo").addEventListener("click", () => {
  if (paymentDialog.open) paymentDialog.close();
  balance = 0;
  transactions = [];
  pendingRoute = null;
  loadAmount.value = "100";
  amountInput.classList.remove("is-invalid");
  loadMessage.textContent = "";
  routeMessage.textContent = "";
  updateBalance();
  renderTransactions();
  showToast("Demo reset. Your sample wallet is back to ₱0.00.");
});

paymentDialog.addEventListener("click", event => {
  if (event.target === paymentDialog) paymentDialog.close();
});

updateBalance();
