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
  pageNav: document.getElementById("page-nav"),
  menuToggle: document.getElementById("menu-toggle"),
};

/** @type {{ meta: object, chapters: object[], types: object[], events: object[] }} */
let data = { meta: {}, chapters: [], types: [], events: [] };
let activeType = "all";
let activeId = null;
let activeChapterId = null;
let showingChapter = false;

function chapterLabel(id) {
  return data.chapters.find((c) => c.id === id)?.title ?? id ?? "";
}

function typeLabel(id) {
  return data.types.find((t) => t.id === id)?.label ?? id ?? "";
}

function listLabel(event) {
  if (event.number != null) return String(event.number);
  return event.title || event.id;
}

function pageHeading(event) {
  return event.title || listLabel(event);
}

function paragraphs(text = "") {
  return String(text)
    .trim()
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\n/g, " ").trim())
    .filter(Boolean);
}

function appendParagraphs(parent, text) {
  for (const textBlock of paragraphs(text)) {
    const p = document.createElement("p");
    p.textContent = textBlock;
    parent.append(p);
  }
}

function renderInfo(text) {
  if (!text) return null;

  const info = document.createElement("aside");
  info.className = "info-box";
  info.setAttribute("role", "note");

  const label = document.createElement("span");
  label.className = "info-label";
  label.textContent = "Info";

  const body = document.createElement("span");
  body.className = "info-text";
  body.textContent = text;

  info.append(label, body);
  return info;
}

function renderEffectStack(ongoing, once) {
  const items = [
    ...(ongoing || []).map((text) => ["ongoing", "Ongoing", text]),
    ...(once || []).map((text) => ["once", "Once", text]),
  ];
  if (!items.length) return null;

  const stack = document.createElement("div");
  stack.className = "effect-stack";
  for (const [kind, label, text] of items) {
    const row = document.createElement("div");
    row.className = `effect effect-${kind}`;
    const tag = document.createElement("span");
    tag.className = "effect-tag";
    tag.textContent = label;
    const body = document.createElement("span");
    body.className = "effect-text";
    body.textContent = text;
    row.append(tag, body);
    stack.append(row);
  }
  return stack;
}

function searchHay(event) {
  if (event.spoilerFree) {
    return [listLabel(event), chapterLabel(event.chapter)].join(" ").toLowerCase();
  }
  return [event.title, event.summary, event.body, listLabel(event), ...(event.tags || [])]
    .join(" ")
    .toLowerCase();
}

function filteredEvents() {
  const q = els.search.value.trim().toLowerCase();
  return data.events.filter((event) => {
    if (activeType !== "all" && event.type !== activeType) return false;
    if (!q) return true;
    return searchHay(event).includes(q);
  });
}

function renderFilters() {
  const chips = [
    { id: "all", label: "All" },
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

function renderChoice(choice) {
  const details = document.createElement("details");
  details.className = "choice";

  const summary = document.createElement("summary");
  const label = document.createElement("span");
  label.className = "choice-label";
  label.textContent = choice.label;
  summary.append(label);

  if (choice.requires) {
    const req = document.createElement("span");
    req.className = "choice-requires";
    const word = document.createElement("span");
    word.className = "requires-word";
    word.textContent = "Requires";
    const key = document.createElement("span");
    key.className = "requires-key";
    key.textContent = choice.requires;
    req.append(word, key);
    summary.append(req);
  }
  if (choice.note) {
    const note = document.createElement("span");
    note.className = "choice-note";
    note.textContent = choice.note;
    summary.append(note);
  }

  const panel = document.createElement("div");
  panel.className = "choice-panel";
  appendParagraphs(panel, choice.body);
  const info = renderInfo(choice.info);
  if (info) panel.append(info);
  const effects = renderEffectStack(choice.ongoing, choice.once);
  if (effects) panel.append(effects);
  if (choice.choices?.length) {
    panel.append(renderChoiceList(choice.choices));
  }

  details.append(summary, panel);
  return details;
}

function renderChoiceList(choices) {
  const list = document.createElement("div");
  list.className = "choice-list";
  list.append(...choices.map(renderChoice));
  return list;
}

function setHash(id, pushHash) {
  const hash = `#${encodeURIComponent(id)}`;
  if (pushHash) history.pushState(null, "", hash);
  else history.replaceState(null, "", hash);
}

function closeRail() {
  document.body.classList.remove("rail-open");
  els.menuToggle.setAttribute("aria-expanded", "false");
}

function renderList() {
  const events = filteredEvents();
  const nodes = [];
  let lastChapter = null;

  for (const event of events) {
    if (event.chapter !== lastChapter) {
      lastChapter = event.chapter;
      const heading = document.createElement("button");
      heading.type = "button";
      heading.className = "list-chapter";
      heading.textContent = chapterLabel(event.chapter);
      heading.setAttribute(
        "aria-current",
        String(showingChapter && activeChapterId === event.chapter)
      );
      heading.addEventListener("click", () => selectChapter(event.chapter, true));
      nodes.push(heading);
    }

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = event.spoilerFree ? "event-item numbered" : "event-item";
    btn.setAttribute("aria-current", String(event.id === activeId));

    const title = document.createElement("span");
    title.className = "item-title";
    title.textContent = listLabel(event);
    btn.append(title);

    if (!event.spoilerFree) {
      const meta = document.createElement("span");
      meta.className = "item-meta";
      meta.textContent = [typeLabel(event.type), chapterLabel(event.chapter)]
        .filter(Boolean)
        .join(" · ");
      btn.append(meta);
    }

    btn.addEventListener("click", () => selectEvent(event.id, true));
    nodes.push(btn);
  }

  els.list.replaceChildren(...nodes);

  if (activeId && !events.some((e) => e.id === activeId)) {
    showEmpty();
  }
}

function showEmpty() {
  activeId = null;
  activeChapterId = null;
  showingChapter = false;
  els.page.hidden = true;
  els.empty.hidden = false;
  history.replaceState(null, "", location.pathname + location.search);
  renderList();
}

function selectChapter(chapterId, pushHash = false) {
  const chapter = data.chapters.find((c) => c.id === chapterId);
  if (!chapter) {
    showEmpty();
    return;
  }

  showingChapter = true;
  activeChapterId = chapterId;
  activeId = null;
  closeRail();

  els.empty.hidden = true;
  els.page.hidden = false;
  els.pageNav.hidden = true;

  els.pageMeta.textContent = "Chapter";
  els.pageMeta.hidden = false;
  els.pageTitle.textContent = chapter.title;
  els.pageSummary.textContent = chapter.summary || "";
  els.pageSummary.hidden = !chapter.summary;

  els.pageTags.replaceChildren();
  els.pageTags.hidden = true;

  const grid = document.createElement("div");
  grid.className = "entry-grid";
  const events = data.events.filter((event) => event.chapter === chapterId);
  for (const event of events) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = event.spoilerFree ? "entry-tile numbered" : "entry-tile";
    const label = document.createElement("span");
    label.className = "entry-tile-label";
    label.textContent = listLabel(event);
    btn.append(label);
    if (!event.spoilerFree) {
      const meta = document.createElement("span");
      meta.className = "entry-tile-meta";
      meta.textContent = event.title || "";
      btn.append(meta);
    }
    btn.addEventListener("click", () => selectEvent(event.id, true));
    grid.append(btn);
  }

  els.pageBody.replaceChildren(grid);
  els.pageBody.hidden = events.length === 0;

  setHash(chapterId, pushHash);
  renderList();
}

function selectEvent(id, pushHash = false) {
  const event = data.events.find((e) => e.id === id);
  if (!event) {
    showEmpty();
    return;
  }

  showingChapter = false;
  activeId = id;
  activeChapterId = event.chapter;
  closeRail();

  els.empty.hidden = true;
  els.page.hidden = false;
  els.pageNav.hidden = false;

  els.pageMeta.hidden = false;
  els.pageMeta.replaceChildren();
  const typeEl = document.createElement("span");
  typeEl.textContent = typeLabel(event.type);
  const sep = document.createTextNode(" · ");
  const chapterBtn = document.createElement("button");
  chapterBtn.type = "button";
  chapterBtn.className = "chapter-link";
  chapterBtn.textContent = chapterLabel(event.chapter);
  chapterBtn.addEventListener("click", () => selectChapter(event.chapter, true));
  els.pageMeta.append(typeEl, sep, chapterBtn);

  els.pageTitle.textContent = pageHeading(event);
  els.pageSummary.textContent = event.summary || "";
  els.pageSummary.hidden = !event.summary;

  els.pageTags.replaceChildren(
    ...(event.tags || []).map((tag) => {
      const li = document.createElement("li");
      li.textContent = tag;
      return li;
    })
  );
  els.pageTags.hidden = !event.tags?.length;

  els.pageBody.replaceChildren();
  appendParagraphs(els.pageBody, event.body);
  const info = renderInfo(event.info);
  if (info) els.pageBody.append(info);
  const pageEffects = renderEffectStack(event.ongoing, event.once);
  if (pageEffects) els.pageBody.append(pageEffects);
  if (event.choices?.length) {
    els.pageBody.append(renderChoiceList(event.choices));
  }
  els.pageBody.hidden = els.pageBody.childElementCount === 0;

  const visible = filteredEvents();
  const index = visible.findIndex((e) => e.id === id);
  els.prevBtn.disabled = index <= 0;
  els.nextBtn.disabled = index < 0 || index >= visible.length - 1;
  els.prevBtn.onclick = () => index > 0 && selectEvent(visible[index - 1].id, true);
  els.nextBtn.onclick = () =>
    index >= 0 && index < visible.length - 1 && selectEvent(visible[index + 1].id, true);

  setHash(id, pushHash);
  renderList();
}

function applyHash() {
  const id = decodeURIComponent(location.hash.replace(/^#/, ""));
  if (!id) {
    if (data.chapters[0]) selectChapter(data.chapters[0].id, false);
    else showEmpty();
    return;
  }
  if (data.chapters.some((chapter) => chapter.id === id)) {
    selectChapter(id, false);
    return;
  }
  selectEvent(id, false);
}

async function boot() {
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error(`Could not load content/events.json (${res.status})`);
  data = await res.json();

  const title = data.meta?.title || "Storybook";
  document.title = title;
  els.brandTitle.textContent = title;
  els.brandTagline.textContent = data.meta?.tagline || "";

  renderFilters();
  renderList();
  applyHash();
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
  if (showingChapter) return;
  if (e.key === "ArrowLeft") els.prevBtn.click();
  if (e.key === "ArrowRight") els.nextBtn.click();
});

boot().catch((err) => {
  els.empty.hidden = false;
  els.page.hidden = true;
  els.empty.innerHTML = `<h1>Content missing</h1><p>${err.message}</p>`;
  console.error(err);
});
