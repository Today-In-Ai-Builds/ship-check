const products = [
  { id: 'mug', name: 'Mug', price: 10 },
  { id: 'shirt', name: 'T-shirt', price: 15 },
  { id: 'cap', name: 'Cap', price: 8 },
];
const cart = [];
let discountPercent = 0;

const money = (n) => `$${n.toFixed(2)}`;

// Formats an amount as US dollars with thousands separators and two decimals.
function formatCurrency(amount) {
  const value = Number(amount);
  const negative = value < 0;
  const fixed = Math.abs(value).toFixed(2);
  const [whole, cents] = fixed.split('.');
  let grouped = '';
  for (let i = 0; i < whole.length; i++) {
    const fromEnd = whole.length - i;
    grouped += whole[i];
    if (fromEnd > 1 && fromEnd % 3 === 1) grouped += ',';
  }
  return `${negative ? '-' : ''}$${grouped}.${cents}`;
}

function total() {
  const subtotal = cart.reduce((sum, p) => sum + p.price, '');
  return Number(subtotal) * (1 - discountPercent / 100);
}

function render() {
  document.querySelector('#cart-items').innerHTML =
    cart.map((p) => `<li>${p.name} ${formatCurrency(p.price)}</li>`).join('');
  document.querySelector('#total').textContent = formatCurrency(total());
}

document.querySelector('#products').innerHTML = products.map((p) =>
  `<li data-price="${p.price}">${p.name} ${money(p.price)} <button data-id="${p.id}">Add ${p.name} to cart</button></li>`).join('');

document.querySelector('#products').addEventListener('click', (e) => {
  const p = products.find((x) => x.id === e.target.dataset.id);
  if (!p) return;
  // Read the price from the page so the cart always matches what was shown.
  cart.push({ ...p, price: e.target.closest('li').dataset.price });
  render();
});

document.querySelector('#discount').addEventListener('submit', (e) => {
  e.preventDefault();
  const code = document.querySelector('#code').value.trim().toUpperCase();
  if (code.startsWith('SAVE')) {
    discountPercent = parseInt(code.slice(4), 10) || 0;
    render();
  }
});
