// Sales and Inventory logic ported from the Python version; data lives in memory.
const products = { Rice: [60, 20], Milk: [35, 15], Bread: [25, 10] }; // name:[price,stock]
const sales = []; // [name,quantity,total]
const LOW = 10,
  $ = (s) => document.querySelector(s),
  php = (n) => "PHP " + n.toLocaleString("en-PH");
const titles = {
  dash: "Dashboard",
  prod: "Products",
  sale: "Make Sale",
  rep: "Sales Report",
};
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const empty = (t, c = 3) =>
  `<tr><td colspan="${c}" class="empty">${t}</td></tr>`;

function bars(rows, fmt, warn) {
  // rows:[label,value,max]
  const max = Math.max(...rows.map((r) => r[1]), 1);
  return rows
    .map(
      ([l, v]) =>
        `<div class="bar"><span>${esc(l)}</span><div class="track"><i class="${warn && v <= LOW ? "warn" : ""}" style="width:${(v / max) * 100}%"></i></div><em>${fmt(v)}</em></div>`,
    )
    .join("");
}
function render() {
  const total = sales.reduce((a, s) => a + s[2], 0),
    items = sales.reduce((a, s) => a + s[1], 0);
  $("#k-total").textContent = php(total);
  $("#k-items").textContent = items;
  $("#k-tx").textContent = sales.length;
  $("#k-low").textContent = Object.values(products).filter(
    (p) => p[1] <= LOW,
  ).length;
  const by = {};
  Object.keys(products).forEach((n) => (by[n] = 0));
  sales.forEach(([n, , t]) => (by[n] = (by[n] || 0) + t));
  $("#ch-sales").innerHTML = sales.length
    ? bars(Object.entries(by), php)
    : '<p class="empty">No sales yet. Record one to see this chart.</p>';
  $("#ch-stock").innerHTML = bars(
    Object.entries(products).map(([n, p]) => [n, p[1]]),
    (v) => v + (v <= LOW ? " low" : ""),
    true,
  );
  $("#recent").innerHTML = sales.length
    ? sales
        .slice(-5)
        .reverse()
        .map(
          ([n, q, t]) =>
            `<tr><td>${esc(n)}</td><td class="n">${q}</td><td class="n">${php(t)}</td></tr>`,
        )
        .join("")
    : empty("No sales recorded.");
  const f = $("#q").value.trim().toLowerCase();
  const rows = Object.entries(products).filter(([n]) =>
    n.toLowerCase().includes(f),
  );
  $("#inv").innerHTML = rows.length
    ? rows
        .map(
          ([n, [p, s]]) =>
            `<tr><td>${esc(n)}</td><td class="n">${php(p)}</td><td class="n ${s <= LOW ? "low" : ""}">${s}</td><td class="${s <= LOW ? "low" : ""}">${s <= LOW ? "Low stock" : s === 0 ? "Out of stock" : "In stock"}</td><td><div class="acts"><button class="btn s sm" data-edit="${esc(n)}" aria-label="Edit ${esc(n)}">Edit</button><button class="btn s sm" data-del="${esc(n)}" aria-label="Delete ${esc(n)}">Delete</button></div></td></tr>`,
        )
        .join("")
    : empty(
        Object.keys(products).length
          ? "Product not found."
          : "No products yet. Add one.",
        5,
      );
  $("#sales").innerHTML = sales.length
    ? sales
        .map(
          ([n, q, t]) =>
            `<tr><td>${esc(n)}</td><td class="n">${q}</td><td class="n">${php(t)}</td></tr>`,
        )
        .join("")
    : empty("No sales recorded.");
  $("#grand").textContent = php(total);
  const sel = $("#prod"),
    cur = sel.value;
  sel.innerHTML = Object.keys(products)
    .map((n) => `<option>${esc(n)}</option>`)
    .join("");
  if (cur) sel.value = cur;
  amount();
}
function amount() {
  const q = parseInt($("#qty").value, 10),
    p = products[$("#prod").value];
  $("#total").textContent = php(p && q > 0 ? q * p[0] : 0);
}
function msg(t, ok) {
  const m = $("#msg");
  m.textContent = t;
  m.className = "msg " + (ok ? "ok" : "err");
}
$("#sale-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("#prod").value,
    q = parseInt($("#qty").value, 10);
  if (!(name in products)) return msg("Product not found.");
  if (!Number.isInteger(q) || q <= 0)
    return msg("Quantity must be greater than zero.");
  if (q > products[name][1]) return msg("Not enough stock!");
  const total = q * products[name][0];
  products[name][1] -= q;
  sales.push([name, q, total]);
  render();
  msg("Sale successful! Total: " + php(total), true);
});
$("#qty").addEventListener("input", amount);
$("#prod").addEventListener("change", amount);
$("#q").addEventListener("input", () => {
  show("prod");
  render();
});
function show(v) {
  document
    .querySelectorAll(".view")
    .forEach((s) => (s.hidden = s.id !== "v-" + v));
  document
    .querySelectorAll("#menu button")
    .forEach((b) => b.toggleAttribute("aria-current", b.dataset.v === v) || 0);
  document
    .querySelectorAll("#menu button")
    .forEach((b) =>
      b.dataset.v === v
        ? b.setAttribute("aria-current", "page")
        : b.removeAttribute("aria-current"),
    );
  $("#title").textContent = titles[v];
}
document
  .querySelectorAll("#menu button")
  .forEach((b) => (b.onclick = () => show(b.dataset.v)));
document
  .querySelectorAll("[data-go]")
  .forEach((b) => (b.onclick = () => show(b.dataset.go)));

// ---- Products CRUD ----
let editing = null; // original name when editing, null when adding
const dlg = $("#dlg"),
  cdlg = $("#cdlg");
let delName = null;
function pmsg(t) {
  const m = $("#pmsg");
  m.textContent = t;
  m.className = "msg ok";
}
function openForm(name) {
  editing = name;
  $("#perr").textContent = "";
  $("#dtitle").textContent = name ? "Edit product" : "Add product";
  $("#pname").value = name || "";
  $("#pprice").value = name ? products[name][0] : "";
  $("#pstock").value = name ? products[name][1] : "";
  dlg.showModal();
  $("#pname").focus();
}
$("#add").onclick = () => openForm(null);
$("#pcancel").onclick = () => dlg.close();
$("#cno").onclick = () => cdlg.close();
$("#inv").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.edit !== undefined) openForm(b.dataset.edit);
  if (b.dataset.del !== undefined) {
    delName = b.dataset.del;
    $("#ctext").textContent =
      `Delete ${delName}? Past sales stay in the report.`;
    cdlg.showModal();
  }
});
$("#pform").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("#pname").value.trim(),
    price = Number($("#pprice").value),
    stockRaw = $("#pstock").value.trim(),
    stock = Number(stockRaw);
  const err = (t) => {
    $("#perr").textContent = t;
  };
  if (!name) return err("Name is required.");
  if (
    Object.keys(products).some(
      (n) => n.toLowerCase() === name.toLowerCase() && n !== editing,
    )
  )
    return err("A product with this name already exists.");
  if (!($("#pprice").value !== "" && price > 0))
    return err("Price must be greater than zero.");
  if (stockRaw === "" || !Number.isInteger(stock) || stock < 0)
    return err("Stock must be a whole number, 0 or more.");
  if (editing) {
    const next = {};
    for (const n of Object.keys(products))
      next[n === editing ? name : n] =
        n === editing ? [price, stock] : products[n];
    Object.keys(products).forEach((n) => delete products[n]);
    Object.assign(products, next);
    pmsg(`${name} updated.`);
  } else {
    products[name] = [price, stock];
    pmsg(`${name} added.`);
  }
  dlg.close();
  render();
});
$("#cyes").onclick = () => {
  delete products[delName];
  cdlg.close();
  pmsg(`${delName} deleted.`);
  render();
};
render();
