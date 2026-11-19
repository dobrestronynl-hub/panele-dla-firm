(() => {
  'use strict';

  function init() {
    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => Array.from(document.querySelectorAll(selector));
    const money = (value) => new Intl.NumberFormat('pl-PL', {
      style: 'currency', currency: 'PLN', minimumFractionDigits: 2,
    }).format(value);
    const normalize = (value) => String(value || '').toLocaleLowerCase('pl-PL')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l').trim();
    const labels = {
      dtf: 'Materiały DTF', flex: 'Folie flex', flock: 'Folie flock',
      prasy: 'Prasy transferowe', plotery: 'Plotery', akcesoria: 'Akcesoria',
    };
    const groups = { folie: ['flex', 'flock'], urzadzenia: ['prasy', 'plotery'] };
    const safeUrl = (value) => {
      try {
        const url = new URL(String(value || ''), window.location.href);
        return /^https?:$/.test(url.protocol) ? url.href : '';
      } catch { return ''; }
    };
    const products = (Array.isArray(window.JAMAC_PRODUCTS) ? window.JAMAC_PRODUCTS : [])
      .filter((product) => product && product.id != null && Number.isFinite(Number(product.price)))
      .map((product) => ({
        ...product, id: String(product.id), price: Math.max(0, Number(product.price)),
        name: String(product.name || ''), category: String(product.category || ''),
        image: String(product.image || ''), url: safeUrl(product.url),
      }));
    const productMap = new Map(products.map((product) => [product.id, product]));
    const state = { filter: 'all', query: '', showAll: false };

    function el(tag, className, text) {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (text !== undefined) node.textContent = text;
      return node;
    }

    function icon(name) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('width', '20');
      svg.setAttribute('height', '20');
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-width', '1.7');
      svg.setAttribute('stroke-linecap', 'round');
      svg.setAttribute('stroke-linejoin', 'round');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
      const paths = name === 'cart'
        ? ['M3 3h2l2.4 11.4a2 2 0 0 0 2 1.6H18a2 2 0 0 0 2-1.6L21 7H6', 'M10 21h.01M18 21h.01']
        : ['M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6'];
      paths.forEach((d) => {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        svg.append(path);
      });
      return svg;
    }

    function externalLink(className, text, href) {
      const link = el('a', className, text);
      if (href) link.href = href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      return link;
    }

    function productCard(product) {
      const card = el('article', 'product-card');
      card.dataset.productId = product.id;
      const visual = externalLink('product-visual', undefined, product.url);
      visual.setAttribute('aria-label', `Zobacz ${product.name} w sklepie JAMAC`);
      const image = el('img', 'product-image');
      image.src = product.image;
      image.alt = product.name;
      image.loading = 'lazy';
      image.decoding = 'async';
      image.width = 420;
      image.height = 360;
      visual.append(image);
      if (product.badge) visual.append(el('span', 'product-badge', String(product.badge)));
      const info = el('div', 'product-info');
      info.append(el('p', 'product-category', labels[product.category] || 'JAMAC'));
      const heading = el('h3', 'product-title');
      heading.append(externalLink('', product.name, product.url));
      info.append(heading, el('p', 'product-unit', String(product.unit || '')));
      const bottom = el('div', 'product-bottom');
      const price = el('div', 'price');
      price.append(el('strong', '', money(product.price)), el('small', '', 'netto'));
      const button = el('button', 'add-to-cart');
      button.type = 'button';
      button.dataset.add = product.id;
      button.setAttribute('aria-label', `Dodaj do koszyka demonstracyjnego: ${product.name}`);
      button.append(icon('cart'), el('span', '', 'Do koszyka'));
      bottom.append(price, button);
      info.append(bottom);
      card.append(visual, info);
      return card;
    }

    function matches(product, query) {
      return normalize([product.name, product.category, labels[product.category], product.unit, product.id].join(' '))
        .includes(normalize(query));
    }

    function renderProducts() {
      const matched = products.filter((product) =>
        (state.filter === 'all' || product.category === state.filter || groups[state.filter]?.includes(product.category))
        && (!state.query || matches(product, state.query)));
      const visible = state.filter === 'all' && !state.query && !state.showAll
        ? matched.slice(0, 4) : matched;
      const grid = $('#product-grid');
      if (grid) grid.replaceChildren(...visible.map(productCard));
      const count = $('#product-count');
      if (count) count.textContent = `${visible.length} z ${matched.length} produktów w podglądzie`;
      const empty = $('#product-empty');
      if (empty) {
        empty.hidden = matched.length > 0;
        const emptyMessage = empty.querySelector('.empty-message') || empty.querySelector('p');
        if (!matched.length && emptyMessage) emptyMessage.textContent = state.query
          ? `Brak produktów dla „${state.query}” w tym podglądzie. Spróbuj wpisać DTF, folia lub prasa albo sprawdź pełny katalog JAMAC.`
          : 'W tym podglądzie nie ma jeszcze produktów z wybranej kategorii. Sprawdź pełny katalog JAMAC.';
      }
      $$('[data-filter]').forEach((button) => {
        const active = button.dataset.filter === state.filter;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
        if (button.getAttribute('role') === 'tab') button.setAttribute('aria-selected', String(active));
      });
      $$('[data-show-all]').forEach((button) => {
        button.hidden = state.filter !== 'all' || !!state.query || matched.length <= 4;
        button.textContent = state.showAll ? 'Pokaż mniej produktów' : 'Pokaż więcej produktów';
        button.setAttribute('aria-expanded', String(state.showAll));
      });
    }

    function scrollToProducts() {
      $('#produkty')?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start',
      });
    }

    const search = $('#site-search');
    const results = $('#search-results');
    const searchStatus = $('#search-status');

    function hideSearch() {
      if (results) results.hidden = true;
      search?.setAttribute('aria-expanded', 'false');
    }

    function clearSearch() {
      state.query = '';
      if (search) search.value = '';
      if (searchStatus) searchStatus.textContent = '';
      hideSearch();
    }

    function showSearch() {
      if (!search || !results) return;
      const query = search.value.trim();
      if (!query) { hideSearch(); return; }
      const found = products.filter((product) => matches(product, query));
      results.replaceChildren();
      found.slice(0, 5).forEach((product) => {
        const item = el('li', 'search-result');
        const link = externalLink('search-item', undefined, product.url);
        const image = el('img', 'search-item-image');
        image.src = product.image;
        image.alt = '';
        image.width = 48;
        image.height = 48;
        const copy = el('span', 'search-item-copy');
        copy.append(el('span', 'search-item-name', product.name), el('span', 'search-item-price', `${money(product.price)} netto`));
        link.append(image, copy);
        item.append(link);
        results.append(item);
      });
      if (!found.length) results.append(el('li', 'search-no-results', 'Brak pasujących produktów w prezentacji.'));
      if (searchStatus) searchStatus.textContent = found.length
        ? `Znaleziono produktów: ${found.length}. Enter pokaże je poniżej.`
        : 'Brak pasujących produktów w prezentacji.';
      results.hidden = false;
      search.setAttribute('aria-expanded', 'true');
    }

    search?.setAttribute('aria-controls', 'search-results');
    search?.setAttribute('aria-expanded', 'false');
    search?.addEventListener('input', () => {
      if (!search.value.trim() && state.query) {
        state.query = '';
        state.filter = 'all';
        state.showAll = false;
        if (searchStatus) searchStatus.textContent = '';
        renderProducts();
      }
      showSearch();
    });
    search?.addEventListener('focus', showSearch);
    search?.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') hideSearch();
      if (event.key === 'ArrowDown' && results && !results.hidden) {
        const firstLink = results.querySelector('a');
        if (firstLink) { event.preventDefault(); firstLink.focus(); }
      }
    });
    results?.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') { hideSearch(); search?.focus(); }
      if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
      const links = Array.from(results.querySelectorAll('a'));
      const position = links.indexOf(document.activeElement);
      if (position < 0) return;
      event.preventDefault();
      if (event.key === 'ArrowUp' && position === 0) search?.focus();
      else links[(position + (event.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length]?.focus();
    });
    results?.addEventListener('click', (event) => {
      if (event.target.closest('a')) hideSearch();
    });
    $('#search-form')?.addEventListener('submit', (event) => {
      event.preventDefault();
      state.query = search?.value.trim() || '';
      state.filter = 'all';
      state.showAll = true;
      hideSearch();
      closeMenu();
      renderProducts();
      scrollToProducts();
      if (searchStatus) searchStatus.textContent = 'Wyniki wyszukiwania są w sekcji produktów.';
    });
    document.addEventListener('click', (event) => {
      if (search && results && !search.contains(event.target) && !results.contains(event.target)) hideSearch();
    });

    $$('[data-filter]').forEach((button) => button.addEventListener('click', () => {
      state.filter = button.dataset.filter || 'all';
      state.showAll = false;
      clearSearch();
      renderProducts();
    }));
    $$('[data-category]').forEach((button) => button.addEventListener('click', (event) => {
      event.preventDefault();
      closeMenu();
      state.filter = button.dataset.category || 'all';
      state.showAll = true;
      clearSearch();
      renderProducts();
      scrollToProducts();
    }));
    $$('[data-show-all]').forEach((button) => button.addEventListener('click', () => {
      state.showAll = !state.showAll;
      renderProducts();
      if (!state.showAll) scrollToProducts();
    }));

    const menuToggle = $('#menu-toggle');
    const mobileMenu = $('#mobile-menu');
    function closeMenu() {
      if (mobileMenu) mobileMenu.hidden = true;
      menuToggle?.setAttribute('aria-expanded', 'false');
      menuToggle?.setAttribute('aria-label', 'Otwórz menu');
    }
    menuToggle?.addEventListener('click', () => {
      if (!mobileMenu) return;
      const open = mobileMenu.hidden;
      mobileMenu.hidden = !open;
      menuToggle.setAttribute('aria-expanded', String(open));
      menuToggle.setAttribute('aria-label', open ? 'Zamknij menu' : 'Otwórz menu');
    });
    mobileMenu?.addEventListener('click', (event) => {
      if (event.target.closest('a, [data-category]')) closeMenu();
    });
    document.addEventListener('click', (event) => {
      if (mobileMenu && !mobileMenu.hidden && !mobileMenu.contains(event.target) && !menuToggle?.contains(event.target)) closeMenu();
    });

    let toastTimer;
    function toast(message) {
      const node = $('#toast');
      if (!node) return;
      clearTimeout(toastTimer);
      node.textContent = message;
      node.hidden = false;
      node.classList.add('is-visible');
      toastTimer = window.setTimeout(() => {
        node.classList.remove('is-visible');
        node.hidden = true;
      }, 3800);
    }

    const storageKey = 'jamac-demo-cart-v1';
    let cart = new Map();
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) || '[]');
      if (Array.isArray(saved)) saved.forEach((entry) => {
        if (!Array.isArray(entry) || entry.length !== 2) return;
        const [id, qty] = entry;
        if (productMap.has(String(id)) && Number.isInteger(qty) && qty > 0) cart.set(String(id), Math.min(qty, 99));
      });
    } catch { cart = new Map(); }

    function saveCart() {
      try { window.localStorage.setItem(storageKey, JSON.stringify([...cart])); } catch { /* The demo works without storage. */ }
    }

    function cartItem(product, qty) {
      const row = el('li', 'cart-row');
      const image = el('img', 'cart-item-image');
      image.src = product.image;
      image.alt = '';
      image.width = 72;
      image.height = 72;
      const info = el('div', 'cart-item-info');
      info.append(el('p', 'cart-item-name', product.name), el('p', 'cart-item-price', `${money(product.price)} netto / ${product.unit || 'szt.'}`));
      const controls = el('div', 'cart-item-controls');
      const quantity = el('div', 'cart-quantity');
      const minus = el('button', 'cart-qty', '−');
      minus.type = 'button';
      minus.dataset.cartMinus = product.id;
      minus.setAttribute('aria-label', `Zmniejsz ilość: ${product.name}`);
      const amount = el('span', 'cart-quantity-value', String(qty));
      amount.setAttribute('aria-label', `Ilość: ${qty}`);
      const plus = el('button', 'cart-qty', '+');
      plus.type = 'button';
      plus.dataset.cartPlus = product.id;
      plus.disabled = qty >= 99;
      plus.setAttribute('aria-label', `Zwiększ ilość: ${product.name}`);
      quantity.append(minus, amount, plus);
      const remove = el('button', 'cart-remove');
      remove.type = 'button';
      remove.dataset.cartRemove = product.id;
      remove.setAttribute('aria-label', `Usuń z koszyka: ${product.name}`);
      remove.append(icon('trash'));
      controls.append(quantity, el('strong', 'cart-item-total', money(product.price * qty)), remove);
      info.append(controls);
      row.append(image, info);
      return row;
    }

    function renderCart() {
      const entries = [...cart].filter(([id]) => productMap.has(id));
      const count = entries.reduce((sum, [, qty]) => sum + qty, 0);
      const total = entries.reduce((sum, [id, qty]) => sum + productMap.get(id).price * qty, 0);
      const countNode = $('#cart-count');
      if (countNode) countNode.textContent = String(count);
      $('#cart-open')?.setAttribute('aria-label', `Otwórz koszyk demonstracyjny. Liczba produktów: ${count}`);
      const items = $('#cart-items');
      if (items) items.replaceChildren(...entries.map(([id, qty]) => cartItem(productMap.get(id), qty)));
      const totalNode = $('#cart-total');
      if (totalNode) totalNode.textContent = money(total);
      const empty = $('#cart-empty');
      const filled = $('#cart-filled');
      if (empty) empty.hidden = count > 0;
      if (filled) filled.hidden = count === 0;
    }

    document.addEventListener('click', (event) => {
      const button = event.target.closest('[data-add]');
      if (!button) return;
      const id = button.dataset.add;
      const product = productMap.get(id);
      if (!product) return;
      const current = cart.get(id) || 0;
      if (current >= 99) { toast('W koszyku demonstracyjnym można dodać maksymalnie 99 sztuk produktu.'); return; }
      cart.set(id, current + 1);
      saveCart();
      renderCart();
      toast(`Dodano do koszyka: ${product.name}`);
    });
    $('#cart-items')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-cart-minus], [data-cart-plus], [data-cart-remove]');
      if (!button) return;
      const action = button.hasAttribute('data-cart-plus') ? 'cartPlus'
        : button.hasAttribute('data-cart-minus') ? 'cartMinus' : 'cartRemove';
      const id = button.dataset[action];
      if (!cart.has(id)) return;
      const next = action === 'cartPlus' ? Math.min(99, cart.get(id) + 1) : cart.get(id) - 1;
      if (action === 'cartRemove' || next <= 0) cart.delete(id);
      else cart.set(id, next);
      saveCart();
      renderCart();
      const replacement = $('#cart-items')?.querySelector(`[data-${action.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}="${CSS.escape(id)}"]`);
      if (replacement) replacement.focus();
      else $('#cart-dialog')?.querySelector('[data-close-cart]')?.focus();
    });

    const dialog = $('#cart-dialog');
    let dialogOpener = null;
    let previousOverflow = '';
    function finishClose() {
      document.body.style.overflow = previousOverflow;
      dialogOpener?.focus();
    }
    function closeCart() {
      if (!dialog?.hasAttribute('open')) return;
      if (typeof dialog.close === 'function') dialog.close();
      else { dialog.removeAttribute('open'); finishClose(); }
    }
    $('#cart-open')?.addEventListener('click', () => {
      if (!dialog || dialog.hasAttribute('open')) return;
      closeMenu();
      hideSearch();
      renderCart();
      dialogOpener = document.activeElement;
      previousOverflow = document.body.style.overflow;
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else { dialog.setAttribute('open', ''); dialog.setAttribute('aria-modal', 'true'); dialog.setAttribute('role', 'dialog'); }
      document.body.style.overflow = 'hidden';
      dialog.querySelector('[data-close-cart]')?.focus();
    });
    $$('[data-close-cart]').forEach((button) => button.addEventListener('click', closeCart));
    dialog?.addEventListener('click', (event) => { if (event.target === dialog) closeCart(); });
    dialog?.addEventListener('close', finishClose);
    dialog?.addEventListener('keydown', (event) => {
      if (event.key !== 'Tab' || typeof dialog.showModal === 'function') return;
      const focusable = Array.from(dialog.querySelectorAll('button:not([disabled]), a[href], input, select, textarea, [tabindex="0"]'))
        .filter((node) => !node.closest('[hidden]'));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    });
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      hideSearch();
      if (mobileMenu && !mobileMenu.hidden) { closeMenu(); menuToggle?.focus(); }
      if (dialog?.hasAttribute('open') && typeof dialog.showModal !== 'function') closeCart();
    });

    const uses = Array.isArray(window.JAMAC_USES) ? window.JAMAC_USES : [];
    function selectUse(id) {
      const use = uses.find((item) => item.id === id);
      if (!use) return;
      const title = $('#use-title');
      const description = $('#use-description');
      const link = $('#use-link');
      const image = $('#use-product-image');
      if (title) title.textContent = String(use.title || '');
      if (description) description.textContent = String(use.description || '');
      if (image && use.image) {
        image.src = String(use.image);
        image.alt = String(use.imageAlt || use.title || '');
      }
      if (link) {
        const url = safeUrl(use.url);
        if (url) link.href = url;
        link.textContent = String(use.button || 'Zobacz produkty');
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
      $$('[data-use]').forEach((button) => {
        const active = button.dataset.use === id;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      });
    }
    $$('[data-use]').forEach((button) => button.addEventListener('click', () => selectUse(button.dataset.use)));

    renderProducts();
    renderCart();
    if (uses.length) selectUse(uses[0].id);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
