const DATA_URL = new URL("./content/events.json", import.meta.url);

const els = {
  brandTitle: document.getElementById("brand-title"),
  brandTagline: document.getElementById("brand-tagline"),
  search: document.getElementById("search"),
  filters: document.getElementById("filters"),
  list: document.getElementById("event-list"),
  page: document.getElementById("page"),
  empty: document.getElementById("empty"),
  pageMeta: document.getElementById("page-meta"),
  pageTitle: document.getElementById("page-title"),
  pageSummary: document.getElementById("page-summary"),
  pageTags: document.getElementById("page-tags"),
  pageBody: document.getElementById("page-body"),
  prevBtn: document.getElementById("prev-btn"),
  nextBtn: document.getElementById("next-btn"),
  menuToggle: document.getElementById("menu-toggle"),
};

/** @type {{ meta: object, chapters: object[], types: object[], events: object[] }} */
let data = { meta: {}, chapters: [], types: [], events: [] };
let activeType = "all";
let activeId = null;

function chapterLabel(id) {
  return data.chapters.find((c) => c.id === id)?.title ?? id ?? "";
}

function typeLabel(id) {
  return data.types.find((t) => t.id === id)?.label ?? id ?? "";
}

function paragraphs(text = "") {
  return String(text)
    .trim()
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\n/g, " ").trim())
    .filter(Boolean);
}

function filteredEvents() {
  const q = els.search.value.trim().toLowerCase();
  return data.events.filter((event) => {
    if (activeType !== "all" && event.type !== activeType) return false;
    if (!q) return true;
    const hay = [event.title, event.summary, event.body, ...(event.tags || [])]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

function renderFilters() {
  const chips = [
    { id: "all", label: "Alle" },
    ...data.types.map((t) => ({ id: t.id, label: t.label })),
  ];

  els.filters.replaceChildren(
    ...chips.map((chip) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "filter-chip";
      btn.textContent = chip.label;
      btn.setAttribute("aria-pressed", String(chip.id === activeType));
      btn.addEventListener("click", () => {
        activeType = chip.id;
        renderFilters();
        renderList();
      });
      return btn;
    })
  );
}

function renderList() {
  const events = filteredEvents();
  els.list.replaceChildren(
    ...events.map((event) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "event-item";
      btn.setAttribute("aria-current", String(event.id === activeId));

      const title = document.createElement("span");
      title.className = "item-title";
      title.textContent = event.title;

      const meta = document.createElement("span");
      meta.className = "item-meta";
      meta.textContent = [typeLabel(event.type), chapterLabel(event.chapter)]
        .filter(Boolean)
        .join(" · ");

      btn.append(title, meta);
      btn.addEventListener("click", () => selectEvent(event.id, true));
      return btn;
    })
  );

  if (activeId && !events.some((e) => e.id === activeId)) {
    showEmpty();
  }
}

function showEmpty() {
  activeId = null;
  els.page.hidden = true;
  els.empty.hidden = false;
  history.replaceState(null, "", location.pathname + location.search);
  renderList();
}

function selectEvent(id, pushHash = false) {
  const event = data.events.find((e) => e.id === id);
  if (!event) {
    showEmpty();
    return;
  }

  activeId = id;
  document.body.classList.remove("rail-open");
  els.menuToggle.setAttribute("aria-expanded", "false");

  els.empty.hidden = true;
  els.page.hidden = false;

  els.pageMeta.textContent = [typeLabel(event.type), chapterLabel(event.chapter)]
    .filter(Boolean)
    .join(" · ");
  els.pageTitle.textContent = event.title;
  els.pageSummary.textContent = event.summary || "";
  els.pageSummary.hidden = !event.summary;

  els.pageTags.replaceChildren(
    ...(event.tags || []).map((tag) => {
      const li = document.createElement("li");
      li.textContent = tag;
      return li;
    })
  );

  els.pageBody.replaceChildren(
    ...paragraphs(event.body).map((text) => {
      const p = document.createElement("p");
      p.textContent = text;
      return p;
    })
  );

  const visible = filteredEvents();
  const index = visible.findIndex((e) => e.id === id);
  els.prevBtn.disabled = index <= 0;
  els.nextBtn.disabled = index < 0 || index >= visible.length - 1;
  els.prevBtn.onclick = () => index > 0 && selectEvent(visible[index - 1].id, true);
  els.nextBtn.onclick = () =>
    index >= 0 && index < visible.length - 1 && selectEvent(visible[index + 1].id, true);

  if (pushHash) {
    history.pushState(null, "", `#${encodeURIComponent(id)}`);
  } else {
    history.replaceState(null, "", `#${encodeURIComponent(id)}`);
  }

  renderList();
}

function applyHash() {
  const id = decodeURIComponent(location.hash.replace(/^#/, ""));
  if (id) selectEvent(id, false);
  else showEmpty();
}

async function boot() {
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error(`Konnte content/events.json nicht laden (${res.status})`);
  data = await res.json();

  const title = data.meta?.title || "Storybook";
  document.title = title;
  els.brandTitle.textContent = title;
  els.brandTagline.textContent = data.meta?.tagline || "";

  renderFilters();
  renderList();
  applyHash();

  if (!location.hash && data.events[0]) {
    selectEvent(data.events[0].id, false);
  }
}

els.search.addEventListener("input", () => {
  renderList();
});

els.menuToggle.addEventListener("click", () => {
  const open = document.body.classList.toggle("rail-open");
  els.menuToggle.setAttribute("aria-expanded", String(open));
});

window.addEventListener("hashchange", applyHash);

window.addEventListener("keydown", (e) => {
  if (e.target.matches("input, textarea")) return;
  if (e.key === "ArrowLeft") els.prevBtn.click();
  if (e.key === "ArrowRight") els.nextBtn.click();
});

boot().catch((err) => {
  els.empty.hidden = false;
  els.page.hidden = true;
  els.empty.innerHTML = `<h1>Inhalt fehlt</h1><p>${err.message}</p>`;
  console.error(err);
});
