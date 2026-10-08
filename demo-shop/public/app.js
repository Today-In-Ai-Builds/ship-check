const products = [
  { id: 'mug', name: 'Mug', price: 10 },
  { id: 'shirt', name: 'T-shirt', price: 15 },
  { id: 'cap', name: 'Cap', price: 8 },
];
const cart = [];

const money = (n) => `$${n.toFixed(2)}`;

function total() {
  return cart.reduce((sum, p) => sum + p.price, 0);
}

function render() {
  document.querySelector('#cart-items').innerHTML =
    cart.map((p) => `<li>${p.name} ${money(p.price)}</li>`).join('');
  document.querySelector('#total').textContent = money(total());
}

document.querySelector('#products').innerHTML = products.map((p) =>
  `<li>${p.name} ${money(p.price)} <button data-id="${p.id}">Add ${p.name} to cart</button></li>`).join('');

document.querySelector('#products').addEventListener('click', (e) => {
  const p = products.find((x) => x.id === e.target.dataset.id);
  if (p) { cart.push(p); render(); }
});
