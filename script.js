// Developer reference: the hardcoded demo password is: CTX-8F92-LOGIN!

/*
  Password check logic (client-side):
  - `HARDCODED_PASSWORD` stores the demo password.
  - On the login form submit we compare the entered password using strict equality (===).
  - If it matches we alert success and redirect to `home.html`.
  - If it doesn't match we alert the user about incorrect password.

  NOTE: This is frontend-only for demo purposes. Anyone can view the JS and see the password.
*/

const HARDCODED_PASSWORD = 'ZOKUFA'; // <-- generated password (developer reference)

let marketChartInstance = null; // holds Chart.js instance so we can resize/update it

document.addEventListener('DOMContentLoaded', () => {
  // Redirect guard: prevent direct access to dashboard without login flag
  const isDashboard = location.pathname.endsWith('home.html') || location.pathname.endsWith('/home.html');
  if (isDashboard && localStorage.getItem('krip_logged_in') !== '1') {
    window.location.href = 'index.html';
    return; // stop further initialization on protected page
  }
  // populate user name on dashboard (if present)
  const storedName = localStorage.getItem('krip_user_name') || 'ZOKUFA';
  const nameEl = document.getElementById('userName');
  const mobileNameEl = document.getElementById('mobileUserName');
  if (nameEl) nameEl.textContent = storedName;
  if (mobileNameEl) mobileNameEl.textContent = storedName;
  // ------------------ Login behavior (unchanged) ------------------
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    const passwordInput = document.getElementById('password');
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const supplied = passwordInput.value;
      if (supplied === HARDCODED_PASSWORD) {
        localStorage.setItem('krip_logged_in', '1');
        const suppliedName = document.getElementById('username')?.value.trim();
        localStorage.setItem('krip_user_name', suppliedName || 'ZOKUFA');
        // small UX: clear the password field before navigation
        passwordInput.value = '';
        window.location.href = 'home.html';
      } else {
        alert('Incorrect password');
        passwordInput.focus();
      }
    });
  }

  // ------------------ Logout ------------------
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('krip_logged_in');
    localStorage.removeItem('krip_user_name');
    window.location.href = 'index.html';
  });

  // ------------------ Mobile menu toggle
  // Adds a hamburger toggle for screens <= 768px. Clicking opens a sliding
  // mobile menu panel. Clicking outside or selecting a link closes it.
  const navToggle = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileLogout = document.getElementById('mobileLogout');
  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', (e) => {
      const open = mobileMenu.classList.toggle('open');
      mobileMenu.setAttribute('aria-hidden', String(!open));
      navToggle.setAttribute('aria-expanded', String(open));
    });

    // Close when clicking a link inside the menu
    mobileMenu.addEventListener('click', (e) => {
      const target = e.target;
      if (target.matches('.mobile-link')) {
        mobileMenu.classList.remove('open');
        mobileMenu.setAttribute('aria-hidden', 'true');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });

    // Close menu when clicking outside of it
    document.addEventListener('click', (e) => {
      if (!mobileMenu.classList.contains('open')) return;
      const withinMenu = mobileMenu.contains(e.target) || navToggle.contains(e.target);
      if (!withinMenu) {
        mobileMenu.classList.remove('open');
        mobileMenu.setAttribute('aria-hidden', 'true');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Wire mobile logout to the same behavior as the header logout
  if (mobileLogout) {
    mobileLogout.addEventListener('click', (e) => {
      e.preventDefault();
      if (logoutBtn) logoutBtn.click();
    });
  }

  // ------------------ Fund Account navigation
  // Account details are shown on a separate static page `account.html`.
  // The nav item links directly to that page; no toggle is required here.

  // ------------------ Chart initialization & responsiveness ------------------
  // Chart responsiveness notes:
  // - Chart.js is initialized with `responsive:true` and `maintainAspectRatio:false` so it
  //   will resize to fill its container (.chart-wrap). The canvas size is controlled via CSS.
  // - We also keep a reference to the Chart instance and call `resize()` on window resize
  //   to ensure pixel-perfect rendering across device pixel ratios.
  // - Tooltip is enabled and configured to show price and label (time) on hover.
  const chartEl = document.getElementById('marketChart');
  if (chartEl && window.Chart) {
    const ctx = chartEl.getContext('2d');
    // create a subtle vertical gradient for the fill
    const grad = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
    grad.addColorStop(0, 'rgba(0,240,255,0.12)');
    grad.addColorStop(1, 'rgba(0,240,255,0.02)');

    const data = {
      labels: Array.from({length: 40}, (_, i) => `T-${40 - i}`),
      datasets: [{
        label: 'Price',
        data: generateDemoPrices(40),
        borderColor: 'rgba(0,240,255,0.95)',
        backgroundColor: grad,
        tension: 0.18,
        pointRadius: 0,
        borderWidth: 2,
        fill: true
      }]
    };

    marketChartInstance = new Chart(ctx, {
      type: 'line',
      data,
      options: {
        maintainAspectRatio: false,
        responsive: true,
        animation: {duration: 1400, easing: 'easeOutQuart'},
        animations: { tension: {duration: 1200, easing: 'easeOutQuart'} },
        plugins: {
          legend: {display: false},
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(2,8,20,0.95)',
            titleColor: '#bff8ff',
            bodyColor: '#e6faff',
            padding: 8,
            callbacks: {
              label: (ctx) => `Price: R${ctx.formattedValue}`,
              title: (items) => items[0].label || ''
            }
          }
        },
        scales: {
          x: {grid: {color: 'rgba(255,255,255,0.02)'}, ticks: {color: '#9fbfc7'}},
          y: {grid: {color: 'rgba(255,255,255,0.03)'}, ticks: {color: '#9fbfc7'}}
        },
        interaction: {mode: 'index', intersect: false}
      }
    });

    // trigger an update to ensure the animation runs on load
    marketChartInstance.update();

    // Resize handler for robustness across devices. Chart.js already listens to resize,
    // but calling resize() ensures correct pixel ratio handling when container size changes.
    window.addEventListener('resize', () => { if (marketChartInstance) marketChartInstance.resize(); });

    // initialize live orderbook (fluctuating demo values)
    initOrderbookLive(document.getElementById('orderbook'), 9);
  }
});

// Helper: generate simple demo price series
function generateDemoPrices(n) {
  let v = 120; const out = [];
  for (let i = 0; i < n; i++) {
    v += (Math.random() - 0.47) * 3.5;
    out.push(parseFloat(v.toFixed(2)));
  }
  return out;
}

// Live orderbook: creates data, renders it, and starts small random fluctuations
function initOrderbookLive(container, rows = 9) {
  if (!container) return;
  const data = createOrderbookData(rows);
  renderOrderbook(container, data);
  startOrderbookLive(container, data);
}

function createOrderbookData(rows) {
  const asks = [];
  const bids = [];
  const base = 120000;
  for (let i = 0; i < rows; i++) {
    asks.push({price: base + i * 150 + Math.random() * 20, size: +(Math.random() * 0.8 + 0.1).toFixed(3)});
    bids.push({price: base - i * 140 - Math.random() * 20, size: +(Math.random() * 1.2 + 0.2).toFixed(3)});
  }
  return {asks, bids};
}

function renderOrderbook(container, data) {
  const {asks, bids} = data;
  // header
  const header = document.createElement('div');
  header.style.display = 'grid';
  header.style.gridTemplateColumns = '1fr 1fr';
  header.style.gap = '6px';
  header.style.marginBottom = '6px';
  header.style.fontSize = '13px';
  header.style.color = 'var(--muted)';
  header.innerHTML = '<div>Price (R)</div><div style="text-align:right">Size (BTC)</div>';

  const asksWrap = document.createElement('div');
  asksWrap.style.color = '#ff7b89';
  asks.slice().reverse().forEach((a, idx) => {
    const i = asks.length - 1 - idx; // original index
    const row = document.createElement('div');
    row.className = 'ob-row';
    row.dataset.side = 'ask';
    row.dataset.index = i;
    row.innerHTML = `<div class="ob-price ob-cell">${formatNumber(a.price.toFixed(2))}</div><div class="ob-size ob-cell" style="text-align:right">${a.size.toFixed(3)}</div>`;
    asksWrap.appendChild(row);
  });

  const sep = document.createElement('hr');
  sep.style.border = 'none';
  sep.style.borderTop = '1px solid rgba(255,255,255,0.03)';
  sep.style.margin = '8px 0';

  const bidsWrap = document.createElement('div');
  bidsWrap.style.color = '#7bffea';
  bids.forEach((b, i) => {
    const row = document.createElement('div');
    row.className = 'ob-row';
    row.dataset.side = 'bid';
    row.dataset.index = i;
    row.innerHTML = `<div class="ob-price ob-cell">${formatNumber(b.price.toFixed(2))}</div><div class="ob-size ob-cell" style="text-align:right">${b.size.toFixed(3)}</div>`;
    bidsWrap.appendChild(row);
  });

  // assemble
  container.innerHTML = '';
  container.appendChild(header);
  container.appendChild(asksWrap);
  container.appendChild(sep);
  container.appendChild(bidsWrap);
}

function startOrderbookLive(container, data) {
  // small fluctuations, multiple items per tick
  const volatility = 45; // price movement amplitude
  const sizeJitter = 0.4;
  const tickMs = 1100;

  function tick() {
    // update a few random asks and bids
    const changeCount = Math.max(1, Math.floor(Math.random() * 3));
    for (let k = 0; k < changeCount; k++) {
      // pick side
      const side = Math.random() > 0.5 ? 'ask' : 'bid';
      const arr = side === 'ask' ? data.asks : data.bids;
      const i = Math.floor(Math.random() * arr.length);
      const entry = arr[i];
      const oldPrice = entry.price;
      // small percent change
      const delta = (Math.random() - 0.48) * volatility;
      entry.price = Math.max(0.1, +(entry.price + delta).toFixed(2));
      // jitter size
      entry.size = +(Math.max(0.001, entry.size + (Math.random() - 0.5) * sizeJitter).toFixed(3));

      // update DOM
      const row = container.querySelector(`.ob-row[data-side="${side}"][data-index="${i}"]`);
      if (row) {
        const priceEl = row.querySelector('.ob-price');
        const sizeEl = row.querySelector('.ob-size');
        if (priceEl) {
          priceEl.textContent = formatNumber(entry.price.toFixed(2));
          // flash class
          const cls = entry.price > oldPrice ? 'flash-up' : 'flash-down';
          priceEl.classList.remove('flash-up', 'flash-down');
          void priceEl.offsetWidth;
          priceEl.classList.add(cls);
          setTimeout(() => priceEl.classList.remove(cls), 520);
        }
        if (sizeEl) {
          sizeEl.textContent = entry.size.toFixed(3);
        }
      }
    }
  }

  const handle = setInterval(tick, tickMs);
  // store handle so it could be cleared later if needed
  container._obInterval = handle;
}

// Populate recent trades list with mock entries
// Recent trades removed — dashboard no longer displays recent trades as per request.

// format number with thousand separators
function formatNumber(v) {
  return Number(v).toLocaleString('en-ZA');
}
