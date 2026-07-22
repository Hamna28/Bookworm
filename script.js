

const CART_KEY = "bookwormCart";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function cartCount(cart) {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

function updateCartBadge() {
  const cart = getCart();
  const count = cartCount(cart);
  document.querySelectorAll(".cart-count").forEach((el) => {
    el.textContent = count;
  });
}

function initImageFallbacks() {
  document.querySelectorAll("img[data-fallback-title]").forEach((img) => {
    img.addEventListener("error", () => {
      if (img.dataset.fallbackHandled) return;
      img.dataset.fallbackHandled = "true";
      const placeholder = document.createElement("div");
      placeholder.className = "placeholder-cover";
      placeholder.textContent = img.dataset.fallbackTitle;
      img.classList.add("hidden-cover");
      img.after(placeholder);
    });
  });

  document.querySelectorAll("img.logo").forEach((img) => {
    img.addEventListener("error", () => {
      if (img.dataset.fallbackHandled) return;
      img.dataset.fallbackHandled = "true";
      const placeholder = document.createElement("span");
      placeholder.className = "logo placeholder-cover";
      placeholder.textContent = "BH";
      img.replaceWith(placeholder);
    });
  });
}

function initGridToggle() {
  const toggleBtn = document.getElementById("toggleViewBtn");
  const bookGrid = document.getElementById("bookGrid");
  if (!toggleBtn || !bookGrid) return;

  toggleBtn.addEventListener("click", () => {
    bookGrid.classList.toggle("list-view");
    const isList = bookGrid.classList.contains("list-view");
    toggleBtn.textContent = isList ? "Grid View" : "List View";
  });
}

function initSearch() {
  const form = document.querySelector(".search-form");
  const input = document.querySelector(".search-input");
  const cards = document.querySelectorAll(".book-card");
  if (!form || !input || cards.length === 0) return;

  const filter = () => {
    const term = input.value.trim().toLowerCase();
    cards.forEach((card) => {
      const title = card.querySelector("h3")?.textContent.toLowerCase() || "";
      const author = card.querySelector(".author")?.textContent.toLowerCase() || "";
      const match = title.includes(term) || author.includes(term);
      card.style.display = match ? "" : "none";
    });
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    filter();
  });
  input.addEventListener("input", filter);
}

function initBuyFlow() {
  const container = document.querySelector(".book-container[data-book-id]");
  const buyBtn = document.getElementById("buyNowbtn");
  if (!container || !buyBtn) return;

  const qtyInput = document.getElementById("qtyInput");
  const decBtn = document.getElementById("qtyDecrease");
  const incBtn = document.getElementById("qtyIncrease");

  const clampQty = (val) => Math.min(99, Math.max(1, val));

  if (decBtn && qtyInput) {
    decBtn.addEventListener("click", () => {
      qtyInput.value = clampQty((parseInt(qtyInput.value, 10) || 1) - 1);
    });
  }
  if (incBtn && qtyInput) {
    incBtn.addEventListener("click", () => {
      qtyInput.value = clampQty((parseInt(qtyInput.value, 10) || 1) + 1);
    });
  }
  if (qtyInput) {
    qtyInput.addEventListener("change", () => {
      qtyInput.value = clampQty(parseInt(qtyInput.value, 10) || 1);
    });
  }

  buyBtn.addEventListener("click", () => {
    const id = container.dataset.bookId;
    const name = container.querySelector(".book-details h1").textContent.trim();
    const author = container.querySelector(".author-name").textContent.trim();
    const priceEl = container.querySelector(".price");
    const price = parseFloat(priceEl.dataset.price || "0");
    const image = container.querySelector(".book-image img")?.getAttribute("src") || "";
    const qty = qtyInput ? clampQty(parseInt(qtyInput.value, 10) || 1) : 1;

    const cart = getCart();
    const existing = cart.find((item) => item.id === id);
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({ id, name, author, price, image, qty });
    }
    saveCart(cart);

    const msg = document.getElementById("cartMessage");
    if (msg) {
      msg.textContent = `Added "${name}" to your shelf!`;
      msg.style.display = "block";
      setTimeout(() => { msg.style.display = "none"; }, 2200);
    }
  });
}

function formatPrice(n) {
  return "Rs. " + n.toLocaleString("en-PK");
}

function initCartPage() {
  const itemsWrap = document.getElementById("cartItems");
  if (!itemsWrap) return;

  const emptyState = document.getElementById("cartEmpty");
  const layout = document.getElementById("cartLayout");
  const subtotalEl = document.getElementById("cartSubtotal");
  const totalEl = document.getElementById("cartTotal");
  const shippingEl = document.getElementById("cartShipping");
  const checkoutBtn = document.getElementById("checkoutBtn");

  function render() {
    const cart = getCart();
    itemsWrap.innerHTML = "";

    if (cart.length === 0) {
      if (layout) layout.style.display = "none";
      if (emptyState) emptyState.style.display = "block";
      return;
    }
    if (layout) layout.style.display = "grid";
    if (emptyState) emptyState.style.display = "none";

    let subtotal = 0;

    cart.forEach((item) => {
      subtotal += item.price * item.qty;

      const row = document.createElement("div");
      row.className = "cart-row";
      row.innerHTML = `
        <div class="thumb">
          <img src="${item.image}" alt="${item.name}" data-fallback-title="${item.name}">
        </div>
        <div class="item-info">
          <h3>${item.name}</h3>
          <p>by ${item.author}</p>
        </div>
        <div class="qty-control">
          <button type="button" aria-label="Decrease quantity">−</button>
          <input type="number" value="${item.qty}" min="1" max="99" aria-label="Quantity">
          <button type="button" aria-label="Increase quantity">+</button>
        </div>
        <div class="item-price">${formatPrice(item.price * item.qty)}</div>
        <button type="button" class="remove-btn">Remove</button>
      `;

      const [decBtn, incBtn] = row.querySelectorAll(".qty-control button");
      const qtyInput = row.querySelector(".qty-control input");

      const updateQty = (newQty) => {
        const cartNow = getCart();
        const target = cartNow.find((c) => c.id === item.id);
        if (!target) return;
        target.qty = Math.min(99, Math.max(1, newQty));
        saveCart(cartNow);
        render();
      };

      decBtn.addEventListener("click", () => updateQty(item.qty - 1));
      incBtn.addEventListener("click", () => updateQty(item.qty + 1));
      qtyInput.addEventListener("change", () => updateQty(parseInt(qtyInput.value, 10) || 1));

      row.querySelector(".remove-btn").addEventListener("click", () => {
        const cartNow = getCart().filter((c) => c.id !== item.id);
        saveCart(cartNow);
        render();
      });

      itemsWrap.appendChild(row);
    });

    const shipping = subtotal > 0 ? 150 : 0;
    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
    if (shippingEl) shippingEl.textContent = formatPrice(shipping);
    if (totalEl) totalEl.textContent = formatPrice(subtotal + shipping);
  }

  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      if (getCart().length === 0) return;
      alert("Thank you! Your books are on their way to a cosy reading nook near you.");
      saveCart([]);
      render();
    });
  }

  render();
  initImageFallbacks();
}

document.addEventListener("DOMContentLoaded", () => {
  initImageFallbacks();
  updateCartBadge();
  initGridToggle();
  initSearch();
  initBuyFlow();
  initCartPage();
});
