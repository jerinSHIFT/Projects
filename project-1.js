/* ====== CONFIG ====== */
const API = 'https://api.tvmaze.com/search/shows';

/* ====== ELEMENTS ====== */
const root = document.documentElement;
const themeBtn = document.getElementById('themeBtn');
const q = document.getElementById('q');
const searchBtn = document.getElementById('searchBtn');
const clearBtn = document.getElementById('clearBtn');
const grid = document.getElementById('grid');
const state = document.getElementById('state');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('mTitle');
const modalPoster = document.getElementById('mPoster');
const modalFacts = document.getElementById('mFacts');
const modalPlot = document.getElementById('mPlot');
const modalChips = document.getElementById('mChips');
const closeModalBtn = document.getElementById('closeModal');

/* ====== THEME TOGGLE ====== */
function setTheme(theme) {
  root.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  themeBtn.textContent = theme === 'light' ? '🌙' : '☀️';
}
setTheme(localStorage.getItem('theme') || 'light');
themeBtn.addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  setTheme(next);
});

/* ====== UI STATE HELPERS ====== */
function setLoading(text = 'Loading…') {
  state.hidden = false;
  state.className = 'loading';
  state.textContent = text;
}
function setEmpty(text = 'Type a show name to search') {
  state.hidden = false;
  state.className = 'empty';
  state.textContent = text;
}
function setError(text = 'Something went wrong. Try again.') {
  state.hidden = false;
  state.className = 'error';
  state.textContent = text;
}
function clearState() {
  state.hidden = true;
  state.className = 'loading';
}

/* ====== CARD TEMPLATE ====== */
function cardHTML(item) {
  const m = item.show;
  const poster = m.image?.medium || 'https://via.placeholder.com/600x900?text=No+Poster';
  const year = m.premiered ? m.premiered.slice(0, 4) : '';

  return `
    <article class="card" tabindex="0" aria-label="${m.name}">
      <img class="poster" src="${poster}" alt="Poster of ${m.name}">
      <div class="meta">
        <div class="title">${m.name}</div>
        <div class="sub">${(m.type || '').toUpperCase()} ${year ? '• ' + year : ''}</div>
      </div>
      <div class="actions">
        <button class="btn secondary" data-id="${m.id}">Details</button>
      </div>
    </article>
  `;
}

/* ====== RENDER GRID ====== */
function renderGrid(list) {
  grid.innerHTML = list.map(cardHTML).join('');
  grid.querySelectorAll('button[data-id]').forEach((btn) => {
    btn.addEventListener('click', () => showDetails(btn.dataset.id));
  });
}

/* ====== MAIN SEARCH (API FETCH) ====== */
async function search() {
  const query = (q.value || '').trim();
  if (!query) {
    setEmpty('Type a show name to search');
    grid.innerHTML = '';
    return;
  }

  clearState();
  setLoading('Searching…');

  try {
    const res = await fetch(`${API}?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Network error');
    const data = await res.json();
    console.log('Search results:', data);

    if (!data.length) {
      grid.innerHTML = '';
      setEmpty('No shows found.');
      return;
    }

    renderGrid(data);
    clearState();
  } catch (err) {
    console.error(err);
    grid.innerHTML = '';
    setError('Failed to load data.');
  }
}

/* ====== DETAILS FETCH ====== */
async function showDetails(id) {
  try {
    const res = await fetch(`https://api.tvmaze.com/shows/${id}`);
    if (!res.ok) throw new Error('Failed to load details.');
    const d = await res.json();
     console.log('Fetched data:', d);

    modalTitle.textContent = `${d.name} ${d.premiered ? `(${d.premiered.slice(0, 4)})` : ''}`;
    modalPoster.src =
      d.image?.original ||
      d.image?.medium ||
      'https://via.placeholder.com/600x900?text=No+Poster';
    modalPoster.alt = `Poster of ${d.name}`;
    modalFacts.innerHTML = `
      <span class="chip">${d.type || 'N/A'}</span>
      <span class="chip">${d.language || '-'}</span>
      <span class="chip">${(d.genres || []).join(', ') || '-'}</span>
    `;
    modalPlot.textContent = d.summary
      ? d.summary.replace(/<[^>]+>/g, '')
      : 'No summary available.';
    modalChips.innerHTML = `
      ${d.officialSite ? `<span class="chip">Official site</span>` : ''}
      ${d.network?.name ? `<span class="chip">Network: ${d.network.name}</span>` : ''}
    `;

    modal.showModal();
    closeModalBtn.focus();
  } catch (err) {
    alert('Network error while loading details');
  }
}

/* ====== EVENTS ====== */
searchBtn.addEventListener('click', search);
clearBtn.addEventListener('click', () => {
  q.value = '';
  grid.innerHTML = '';
  setEmpty('Type a show name to search');
});
q.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') search();
});
closeModalBtn.addEventListener('click', () => modal.close());

/* ====== INIT ====== */
setEmpty('Type a show name to search');
