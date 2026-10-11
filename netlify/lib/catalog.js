// The menu (products table): one pack per item — a weight in grams or a
// number of pieces (unit "g" / "pcs") — and a price. An item is "on sale"
// when it's switched on AND has both a pack size and a price.

const db = require("./db");

function isOnSale(p) {
  return p.active && p.price != null && p.pack_size != null;
}

async function loadAll() {
  return db.select("products", {
    order: "sort_order.asc,id.asc",
    columns: "id,name,category,sort_order,pack_size,unit,price,active",
  });
}

// What the public website may see: on-sale items only.
async function loadPublic() {
  return (await loadAll()).filter(isOnSale).map((p) => ({
    name: p.name,
    category: p.category,
    pack_size: p.pack_size,
    unit: p.unit,
    price: Number(p.price),
  }));
}

module.exports = { isOnSale, loadAll, loadPublic };
