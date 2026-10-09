// The menu (products table): one pack size and price per item.
// An item is "on sale" when it's switched on AND has both grams and a price.

const db = require("./db");

function isOnSale(p) {
  return p.active && p.price != null && p.grams != null;
}

async function loadAll() {
  return db.select("products", {
    order: "sort_order.asc,id.asc",
    columns: "id,name,category,sort_order,grams,price,active",
  });
}

// What the public website may see: on-sale items only.
async function loadPublic() {
  return (await loadAll()).filter(isOnSale).map((p) => ({
    name: p.name,
    category: p.category,
    grams: p.grams,
    price: Number(p.price),
  }));
}

module.exports = { isOnSale, loadAll, loadPublic };
