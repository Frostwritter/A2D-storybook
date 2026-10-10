const DATA_URL = new URL("./content/events.json", import.meta.url);

const SECTIONS = [
  { id: "poi", label: "POI", emoji: "📍" },
  { id: "combat", label: "Combats", emoji: "⚔️" },
];

const els = {
  brandTitle: document.getElementById("brand-title"),
  brandTagline: document.getElementById("brand-tagline"),
  search: document.getElementById("search"),
  sectionTabs: document.getElementById("section-tabs"),
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

/** @type {{ meta: object, chapters: object[], icons?: Record<string, string>, events: object[], combats: object[] }} */
let data = { meta: {}, chapters: [], icons: {}, events: [], combats: [] };
let activeSection = "poi";
let activeId = null;
let activeChapterId = null;
let showingChapter = false;
let combatPanel = "setup";

function assetUrl(path) {
  return new URL(path, DATA_URL).href;
}

function iconPath(name) {
  return data.icons?.[name] || null;
}

function renderIcon(name, className = "icon") {
  const path = iconPath(name);
  if (!path) return null;
  const img = document.createElement("img");
  img.src = assetUrl(path);
  img.alt = "";
  img.className = className;
  img.decoding = "async";
  return img;
}

function itemNameFromLabel(label) {
  return String(label).replace(/\s*\([^)]*\)\s*$/, "").trim();
}

function renderItemGlyph() {
  const glyph = document.createElement("span");
  glyph.className = "item-glyph";
  glyph.setAttribute("aria-hidden", "true");
  glyph.textContent = "❖";
  return glyph;
}

function renderItemChip(label) {
  const chip = document.createElement("span");
  chip.className = "item-chip";
  chip.append(renderItemGlyph());
  const icon = renderIcon(itemNameFromLabel(label), "icon icon-inline");
  if (icon) chip.append(icon);
  chip.append(document.createTextNode(label));
  return chip;
}

function appendVerbs(parent, text) {
  const pattern = /\b(Gain|Lose)\b/g;
  let lastIndex = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > lastIndex) parent.append(text.slice(lastIndex, index));
    const verb = document.createElement("span");
    verb.className = "effect-verb";
    verb.textContent = match[0];
    parent.append(verb);
    lastIndex = index + match[0].length;
  }
  if (lastIndex < text.length) parent.append(text.slice(lastIndex));
}

function appendPlainMarkedText(parent, text) {
  // :Icon Name: → inline icon (looked up in top-level `icons`)
  const pattern = /:([^:\n[\]]+):/g;
  let lastIndex = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > lastIndex) appendVerbs(parent, text.slice(lastIndex, index));
    const name = match[1].trim();
    const icon = renderIcon(name, "icon icon-inline");
    if (icon) {
      icon.alt = name;
      icon.title = name;
      parent.append(icon);
    } else {
      parent.append(match[0]);
    }
    lastIndex = index + match[0].length;
  }
  if (lastIndex < text.length) appendVerbs(parent, text.slice(lastIndex));
}

function appendMarkedText(parent, text, className) {
  const span = document.createElement("span");
  span.className = className;
  const pattern = /\[([^\]]+)\]/g;
  let lastIndex = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > lastIndex) appendPlainMarkedText(span, text.slice(lastIndex, index));
    span.append(renderItemChip(match[1].trim()));
    lastIndex = index + match[0].length;
  }
  if (lastIndex < text.length) appendPlainMarkedText(span, text.slice(lastIndex));
  parent.append(span);
}

function normalizeImage(image) {
  if (!image) return null;
  if (typeof image === "string") {
    const src = image.trim();
    return src ? { src, alt: "" } : null;
  }
  if (image.src) return image;
  return null;
}

function renderImage(image) {
  const spec = normalizeImage(image);
  if (!spec) return null;

  const figure = document.createElement("figure");
  figure.className = "story-image";

  const img = document.createElement("img");
  img.src = assetUrl(spec.src);
  img.alt = spec.alt || "";
  img.decoding = "async";
  figure.append(img);

  if (spec.caption) {
    const caption = document.createElement("figcaption");
    caption.textContent = spec.caption;
    figure.append(caption);
  }

  return figure;
}

function chapterLabel(id) {
  return data.chapters.find((c) => c.id === id)?.title ?? id ?? "";
}

function listLabel(event) {
  if (event.number != null) return String(event.number);
  return event.title || event.id;
}

function combatLabel(combat) {
  return combat.label || combat.id;
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

  appendMarkedText(info, text, "info-text");
  info.prepend(label);
  return info;
}

const EFFECT_LABELS = {
  ongoing: "Ongoing",
  once: "Once",
  repeatable: "Repeatable",
};

function appendEffectRows(stack, kind, texts) {
  const label = EFFECT_LABELS[kind];
  for (const text of texts || []) {
    const row = document.createElement("div");
    row.className = `effect effect-${kind}`;
    const tag = document.createElement("span");
    tag.className = "effect-tag";
    tag.textContent = label;
    appendMarkedText(row, text, "effect-text");
    row.prepend(tag);
    stack.append(row);
  }
}

/** Append body/info/effects/choices in the object's own key order. */
function appendContentBlocks(parent, source, { renderNestedChoices } = {}) {
  let effectStack = null;

  for (const key of Object.keys(source)) {
    if (key in EFFECT_LABELS) {
      const texts = source[key];
      if (!Array.isArray(texts) || !texts.length) continue;
      if (!effectStack) {
        effectStack = document.createElement("div");
        effectStack.className = "effect-stack";
        parent.append(effectStack);
      }
      appendEffectRows(effectStack, key, texts);
      continue;
    }

    effectStack = null;

    if (key === "image") {
      const image = renderImage(source.image);
      if (image) parent.append(image);
    } else if (key === "body") {
      appendParagraphs(parent, source.body);
    } else if (key === "info") {
      const info = renderInfo(source.info);
      if (info) parent.append(info);
    } else if (key === "choices" && renderNestedChoices && source.choices?.length) {
      parent.append(renderNestedChoices(source.choices));
    }
  }
}

function searchHay(event) {
  if (event.spoilerFree) {
    return [listLabel(event), chapterLabel(event.chapter)].join(" ").toLowerCase();
  }
  return [event.title, event.summary, event.body, listLabel(event), ...(event.tags || [])]
    .join(" ")
    .toLowerCase();
}

function filteredPois() {
  const q = els.search?.value.trim().toLowerCase() || "";
  return data.events.filter((event) => {
    if (!q) return true;
    return searchHay(event).includes(q);
  });
}

function filteredCombats() {
  return data.combats || [];
}

function visibleEntries() {
  return activeSection === "combat" ? filteredCombats() : filteredPois();
}

function renderSectionTabs() {
  els.sectionTabs.replaceChildren(
    ...SECTIONS.map((section) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "section-tab";
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", String(section.id === activeSection));
      const emoji = document.createElement("span");
      emoji.className = "section-tab-emoji";
      emoji.setAttribute("aria-hidden", "true");
      emoji.textContent = section.emoji;
      const label = document.createElement("span");
      label.textContent = section.label;
      btn.append(emoji, label);
      btn.addEventListener("click", () => {
        if (activeSection === section.id) return;
        activeSection = section.id;
        combatPanel = "setup";
        renderSectionTabs();
        renderList();
        const entries = visibleEntries();
        if (activeSection === "combat") {
          if (entries[0]) selectCombat(entries[0].id, true);
          else showEmpty();
        } else if (data.chapters[0]) {
          selectChapter(data.chapters[0].id, true);
        } else if (entries[0]) {
          selectEvent(entries[0].id, true);
        } else {
          showEmpty();
        }
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
    req.append(word);
    appendMarkedText(req, choice.requires, "requires-text");
    summary.append(req);
  }
  if (choice.note) {
    appendMarkedText(summary, choice.note, "choice-note");
  }

  const panel = document.createElement("div");
  panel.className = "choice-panel";
  appendContentBlocks(panel, choice, { renderNestedChoices: renderChoiceList });

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
  const nodes = [];

  if (activeSection === "combat") {
    for (const combat of filteredCombats()) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "event-item numbered";
      btn.setAttribute("aria-current", String(combat.id === activeId && !showingChapter));
      const title = document.createElement("span");
      title.className = "item-title";
      title.textContent = combatLabel(combat);
      btn.append(title);
      btn.addEventListener("click", () => selectCombat(combat.id, true));
      nodes.push(btn);
    }
  } else {
    const events = filteredPois();
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
      btn.setAttribute("aria-current", String(event.id === activeId && !showingChapter));

      const title = document.createElement("span");
      title.className = "item-title";
      title.textContent = listLabel(event);
      btn.append(title);

      if (!event.spoilerFree) {
        const meta = document.createElement("span");
        meta.className = "item-meta";
        meta.textContent = chapterLabel(event.chapter);
        btn.append(meta);
      }

      btn.addEventListener("click", () => selectEvent(event.id, true));
      nodes.push(btn);
    }
  }

  els.list.replaceChildren(...nodes);

  if (activeId && !showingChapter) {
    const entries = visibleEntries();
    if (!entries.some((e) => e.id === activeId)) showEmpty();
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

  activeSection = "poi";
  showingChapter = true;
  activeChapterId = chapterId;
  activeId = null;
  closeRail();
  renderSectionTabs();

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

function isConclusionInfo(entry) {
  return entry && typeof entry === "object" && !Array.isArray(entry) && entry.info != null;
}

function renderConclusionList(conclusion = []) {
  const entries = Array.isArray(conclusion) ? conclusion : [];
  const hasContent = entries.some((entry) => {
    if (isConclusionInfo(entry)) return String(entry.info ?? "").trim();
    return String(entry ?? "").trim();
  });

  if (!hasContent) {
    const empty = document.createElement("p");
    empty.className = "conclusion-empty";
    empty.textContent = "No conclusion listed yet.";
    return empty;
  }

  const stack = document.createElement("div");
  stack.className = "conclusion-stack";

  for (const entry of entries) {
    if (isConclusionInfo(entry)) {
      const info = renderInfo(entry.info);
      if (info) stack.append(info);
      continue;
    }

    const text = String(entry ?? "").trim();
    if (!text) continue;

    const row = document.createElement("div");
    row.className = "conclusion-row";
    appendMarkedText(row, text, "conclusion-text");
    stack.append(row);
  }

  return stack;
}

function renderCombatBody(combat) {
  const root = document.createElement("div");
  root.className = "combat-view";

  const tabs = document.createElement("div");
  tabs.className = "combat-tabs";
  tabs.setAttribute("role", "tablist");

  for (const panel of [
    { id: "setup", label: "Setup" },
    { id: "conclusion", label: "Conclusion" },
  ]) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "combat-tab";
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-selected", String(panel.id === combatPanel));
    btn.textContent = panel.label;
    btn.addEventListener("click", () => {
      combatPanel = panel.id;
      els.pageBody.replaceChildren(renderCombatBody(combat));
    });
    tabs.append(btn);
  }

  const panel = document.createElement("div");
  panel.className = "combat-panel";
  panel.setAttribute("role", "tabpanel");

  if (combatPanel === "conclusion") {
    panel.append(renderConclusionList(combat.conclusion));
  } else {
    const setup = combat.setup || {};
    appendParagraphs(panel, setup.body);
    const image = renderImage(setup.image);
    if (image) {
      panel.append(image);
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "setup-image-placeholder";
      placeholder.textContent = "Setup image";
      panel.append(placeholder);
    }
    const goal = document.createElement("aside");
    goal.className = "combat-goal";
    const goalLabel = document.createElement("span");
    goalLabel.className = "combat-goal-label";
    goalLabel.textContent = "Goal";
    const goalText = document.createElement("span");
    goalText.className = "combat-goal-text";
    goalText.textContent = setup.goal || "Kill all enemies.";
    goal.append(goalLabel, goalText);
    panel.append(goal);
  }

  root.append(tabs, panel);
  return root;
}

function selectCombat(id, pushHash = false) {
  const combat = (data.combats || []).find((c) => c.id === id);
  if (!combat) {
    showEmpty();
    return;
  }

  if (activeId !== id) combatPanel = "setup";

  activeSection = "combat";
  showingChapter = false;
  activeId = id;
  activeChapterId = null;
  closeRail();
  renderSectionTabs();

  els.empty.hidden = true;
  els.page.hidden = false;
  els.pageNav.hidden = false;

  els.pageMeta.hidden = false;
  els.pageMeta.textContent = "Combat";
  els.pageTitle.textContent = combatLabel(combat);
  els.pageSummary.textContent = "";
  els.pageSummary.hidden = true;
  els.pageTags.replaceChildren();
  els.pageTags.hidden = true;

  els.pageBody.replaceChildren(renderCombatBody(combat));
  els.pageBody.hidden = false;

  const visible = filteredCombats();
  const index = visible.findIndex((c) => c.id === id);
  els.prevBtn.disabled = index <= 0;
  els.nextBtn.disabled = index < 0 || index >= visible.length - 1;
  els.prevBtn.onclick = () => index > 0 && selectCombat(visible[index - 1].id, true);
  els.nextBtn.onclick = () =>
    index >= 0 && index < visible.length - 1 && selectCombat(visible[index + 1].id, true);

  setHash(id, pushHash);
  renderList();
}

function selectEvent(id, pushHash = false) {
  const event = data.events.find((e) => e.id === id);
  if (!event) {
    showEmpty();
    return;
  }

  activeSection = "poi";
  showingChapter = false;
  activeId = id;
  activeChapterId = event.chapter;
  closeRail();
  renderSectionTabs();

  els.empty.hidden = true;
  els.page.hidden = false;
  els.pageNav.hidden = false;

  els.pageMeta.hidden = false;
  els.pageMeta.replaceChildren();
  const typeEl = document.createElement("span");
  typeEl.textContent = "POI";
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
  appendContentBlocks(els.pageBody, event, { renderNestedChoices: renderChoiceList });
  els.pageBody.hidden = els.pageBody.childElementCount === 0;

  const visible = filteredPois();
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
    if (activeSection === "combat" && data.combats?.[0]) {
      selectCombat(data.combats[0].id, false);
    } else if (data.chapters[0]) {
      selectChapter(data.chapters[0].id, false);
    } else {
      showEmpty();
    }
    return;
  }
  if ((data.combats || []).some((combat) => combat.id === id)) {
    selectCombat(id, false);
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
  data.combats ||= [];

  const title = data.meta?.title || "Storybook";
  document.title = title;
  els.brandTitle.textContent = title;
  els.brandTagline.textContent = data.meta?.tagline || "";

  renderSectionTabs();
  renderList();
  applyHash();
}

els.search?.addEventListener("input", () => {
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
