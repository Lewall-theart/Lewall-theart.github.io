/* ═══════════════════════════════════════════
   MAIN JS — shared across all pages
   ═══════════════════════════════════════════ */

// ── SCROLL FADE OBSERVER ──
const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach((el, i) => {
    if (el.isIntersecting) {
      el.target.style.transitionDelay = (el.target.dataset.delay || 0) + 'ms';
      el.target.classList.add('visible');
      fadeObserver.unobserve(el.target);
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll('.fade-up').forEach(el => fadeObserver.observe(el));

// ── STAGGER CHILDREN ──
document.querySelectorAll('[data-stagger]').forEach(parent => {
  parent.querySelectorAll('.fade-up').forEach((child, i) => {
    child.dataset.delay = i * 80;
  });
});

// ── NAVBAR SCROLL SHADOW ──
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 10) {
    navbar?.classList.add('scrolled');
  } else {
    navbar?.classList.remove('scrolled');
  }
}, { passive: true });

// ── MOBILE MENU ──
const hamburger = document.querySelector('.navbar__hamburger');
const mobileMenu = document.querySelector('.navbar__mobile');

hamburger?.addEventListener('click', () => {
  mobileMenu?.classList.toggle('open');
  const spans = hamburger.querySelectorAll('span');
  hamburger.classList.toggle('active');
  if (hamburger.classList.contains('active')) {
    spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
    spans[1].style.opacity = '0';
    spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
  } else {
    spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
  }
});

// ── ACTIVE NAV LINK ──
const currentPath = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.navbar__link').forEach(link => {
  const href = link.getAttribute('href');
  if (href && (href === currentPath || (currentPath === '' && href === 'index.html'))) {
    link.classList.add('active');
  }
});

// ── SEARCH MODAL ──
const searchTrigger = document.querySelector('.navbar__search');
const searchModal   = document.getElementById('searchModal');
const searchClose   = document.getElementById('searchClose');
const searchInput   = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

searchTrigger?.addEventListener('click', openSearch);
searchClose?.addEventListener('click', closeSearch);
searchModal?.addEventListener('click', e => { if (e.target === searchModal) closeSearch(); });

document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
  if (e.key === 'Escape') closeSearch();
});

function openSearch() {
  searchModal?.classList.add('open');
  setTimeout(() => searchInput?.focus(), 100);
}
function closeSearch() {
  searchModal?.classList.remove('open');
  if (searchInput) searchInput.value = '';
  if (searchResults) searchResults.innerHTML = '';
}

// Simple client-side search from writeups data
const WRITEUPS = [
  { title: "Papi Cris' Fortune", category: "Crypto", tags: ["RSA", "Small Prime"], diff: "medium", url: "writeups/papi-cris.html" },
  { title: "Baby RSA", category: "Crypto", tags: ["RSA", "e=3"], diff: "easy", url: "writeups/baby-rsa.html" },
  { title: "Forbidden Injection", category: "Web", tags: ["SQLi", "Bypass"], diff: "hard", url: "writeups/forbidden-injection.html" },
  { title: "Stack Overflow 101", category: "Pwn", tags: ["Buffer Overflow", "ROP"], diff: "medium", url: "writeups/stack-overflow.html" },
  { title: "Blind Vision", category: "Reverse", tags: ["IDA", "Anti-debug"], diff: "hard", url: "writeups/blind-vision.html" },
];

searchInput?.addEventListener('input', () => {
  const q = searchInput.value.toLowerCase().trim();
  if (!q) { searchResults.innerHTML = ''; return; }

  const hits = WRITEUPS.filter(w =>
    w.title.toLowerCase().includes(q) ||
    w.category.toLowerCase().includes(q) ||
    w.tags.some(t => t.toLowerCase().includes(q))
  );

  if (!hits.length) {
    searchResults.innerHTML = `<div class="search-empty">Không tìm thấy kết quả cho "<strong>${q}</strong>"</div>`;
    return;
  }

  searchResults.innerHTML = hits.map(w => `
    <a href="${w.url}" class="search-result" onclick="closeSearch()">
      <div class="search-result__title">${highlight(w.title, q)}</div>
      <div class="search-result__meta">
        <span class="tag tag--cyan">${w.category}</span>
        ${w.tags.map(t => `<span class="tag tag--orange">${t}</span>`).join('')}
      </div>
    </a>
  `).join('');
});

function highlight(text, q) {
  return text.replace(new RegExp(`(${q})`, 'gi'), '<mark>$1</mark>');
}

// ── COPY CODE BUTTONS ──
document.querySelectorAll('.code-block').forEach(block => {
  const btn = block.querySelector('.copy-btn');
  const pre = block.querySelector('pre');
  if (!btn || !pre) return;
  btn.addEventListener('click', () => {
    navigator.clipboard.writeText(pre.innerText).then(() => {
      btn.textContent = 'COPIED!';
      btn.style.color = 'var(--accent3)';
      setTimeout(() => { btn.textContent = 'COPY'; btn.style.color = ''; }, 1500);
    });
  });
});

// ── READ PROGRESS BAR ──
const progressBar = document.getElementById('readProgress');
if (progressBar) {
  window.addEventListener('scroll', () => {
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.width = (window.scrollY / docH * 100) + '%';
  }, { passive: true });
}
