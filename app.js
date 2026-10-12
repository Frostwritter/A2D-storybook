const LANGUAGE_STORAGE_KEY = "a2d-storybook-language";

const LANGUAGES = [
  { id: "en", label: "English", file: "events.json" },
  { id: "de", label: "Deutsch", file: "events.de.json" },
  { id: "fr", label: "Français", file: "events.fr.json" },
  { id: "it", label: "Italiano", file: "events.it.json" },
];

const LANGUAGE_FLAGS = {
  en: "🇬🇧",
  de: "🇩🇪",
  fr: "🇫🇷",
  it: "🇮🇹",
};

const UI_TEXT = {
  en: {
    language: "Language",
    search: "Search",
    searchPlaceholder: "Search…",
    sections: "Sections",
    entries: "Entries",
    contents: "Contents",
    chooseEntry: "Choose an entry",
    backToList: "← Back to list",
    info: "Info",
    ongoing: "Ongoing",
    once: "Once",
    repeatable: "Repeatable",
    requires: "Requires",
    setup: "Setup",
    conclusion: "Conclusion",
    goal: "Goal",
    setupImage: "Setup image",
    noConclusion: "No conclusion listed yet.",
    poi: "POI",
    combats: "Combats",
    chapter: "Chapter",
    combat: "Combat",
    killAllEnemies: "Kill all enemies.",
    contentMissing: "Content missing",
    effectVerbs: ["Gain", "Lose"],
  },
  de: {
    language: "Sprache",
    search: "Suchen",
    searchPlaceholder: "Suchen…",
    sections: "Bereiche",
    entries: "Einträge",
    contents: "Inhalt",
    chooseEntry: "Eintrag auswählen",
    backToList: "← Zur Liste",
    info: "Info",
    ongoing: "Dauerhaft",
    once: "Einmalig",
    repeatable: "Wiederholbar",
    requires: "Benötigt",
    setup: "Vorbereitung",
    conclusion: "Abschluss",
    goal: "Ziel",
    setupImage: "Vorbereitungsbild",
    noConclusion: "Noch kein Abschluss eingetragen.",
    poi: "POI",
    combats: "Kämpfe",
    chapter: "Kapitel",
    combat: "Kampf",
    killAllEnemies: "Besiege alle Gegner.",
    contentMissing: "Inhalt fehlt",
    effectVerbs: ["Erhalte", "Verliere"],
  },
  fr: {
    language: "Langue",
    search: "Rechercher",
    searchPlaceholder: "Rechercher…",
    sections: "Sections",
    entries: "Entrées",
    contents: "Sommaire",
    chooseEntry: "Choisir une entrée",
    backToList: "← Retour à la liste",
    info: "Info",
    ongoing: "Permanent",
    once: "Unique",
    repeatable: "Répétable",
    requires: "Requiert",
    setup: "Préparation",
    conclusion: "Conclusion",
    goal: "Objectif",
    setupImage: "Image de préparation",
    noConclusion: "Aucune conclusion n'est encore indiquée.",
    poi: "POI",
    combats: "Combats",
    chapter: "Chapitre",
    combat: "Combat",
    killAllEnemies: "Éliminez tous les ennemis.",
    contentMissing: "Contenu introuvable",
    effectVerbs: ["Gagnez", "Perdez"],
  },
  it: {
    language: "Lingua",
    search: "Cerca",
    searchPlaceholder: "Cerca…",
    sections: "Sezioni",
    entries: "Voci",
    contents: "Indice",
    chooseEntry: "Scegli una voce",
    backToList: "← Torna all'elenco",
    info: "Info",
    ongoing: "Continuativo",
    once: "Una tantum",
    repeatable: "Ripetibile",
    requires: "Richiede",
    setup: "Preparazione",
    conclusion: "Conclusione",
    goal: "Obiettivo",
    setupImage: "Immagine della preparazione",
    noConclusion: "Nessuna conclusione indicata.",
    poi: "POI",
    combats: "Combattimenti",
    chapter: "Capitolo",
    combat: "Combattimento",
    killAllEnemies: "Sconfiggi tutti i nemici.",
    contentMissing: "Contenuto mancante",
    effectVerbs: ["Ottieni", "Perdi"],
  },
};

const SECTIONS = [
  { id: "poi", labelKey: "poi", emoji: "📍" },
  { id: "combat", labelKey: "combats", emoji: "⚔️" },
];

const POI_MARKERS = ["◆", "◇", "●", "▲", "✦", "✧"];

const els = {
  brandTitle: document.getElementById("brand-title"),
  brandTagline: document.getElementById("brand-tagline"),
  languageLabel: document.getElementById("language-label"),
  languageSelect: document.getElementById("language-select"),
  search: document.getElementById("search"),
  searchWrap: document.getElementById("search-wrap"),
  sectionTabs: document.getElementById("section-tabs"),
  list: document.getElementById("event-list"),
  page: document.getElementById("page"),
  empty: document.getElementById("empty"),
  pageMeta: document.getElementById("page-meta"),
  pageTitle: document.getElementById("page-title"),
  pageSummary: document.getElementById("page-summary"),
  pageTags: document.getElementById("page-tags"),
  pageBody: document.getElementById("page-body"),
  backBtn: document.getElementById("back-btn"),
  pageNav: document.getElementById("page-nav"),
  menuToggle: document.getElementById("menu-toggle"),
  emptyTitle: document.getElementById("empty-title"),
};

/** @type {{ meta: object, chapters: object[], icons?: Record<string, string>, events: object[], combats: object[] }} */
let data = { meta: {}, chapters: [], icons: {}, events: [], combats: [] };
let activeSection = "poi";
let activeId = null;
let activeChapterId = null;
let showingChapter = false;
let combatPanel = "setup";
let activeLanguage = getInitialLanguage();

function getInitialLanguage() {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (LANGUAGES.some((language) => language.id === stored)) return stored;
  return "en";
}

function text(key) {
  return UI_TEXT[activeLanguage]?.[key] ?? UI_TEXT.en[key] ?? key;
}

function dataUrlForLanguage(language) {
  const file = LANGUAGES.find((entry) => entry.id === language)?.file;
  return new URL(`./content/${file || "events.json"}`, import.meta.url);
}

function assetUrl(path) {
  return new URL(path, dataUrlForLanguage(activeLanguage)).href;
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
  const verbs = textForLanguage("effectVerbs");
  const pattern = new RegExp(`\\b(${verbs.map(escapeRegExp).join("|")})\\b`, "g");
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

function textForLanguage(key) {
  const value = text(key);
  return Array.isArray(value) ? value : [];
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
  if (event.marker) return event.marker;
  if (event.spoilerFree && event.number != null) {
    return POI_MARKERS[event.number - 1] || "•";
  }
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
    appendMarkedText(p, textBlock, "paragraph-text");
    parent.append(p);
  }
}

function renderInfo(content) {
  if (!content) return null;

  const info = document.createElement("aside");
  info.className = "info-box";
  info.setAttribute("role", "note");

  const label = document.createElement("span");
  label.className = "info-label";
  label.textContent = text("info");

  appendMarkedText(info, content, "info-text");
  info.prepend(label);
  return info;
}

const EFFECT_LABEL_KEYS = {
  ongoing: "ongoing",
  once: "once",
  repeatable: "repeatable",
};

function appendEffectRows(stack, kind, texts) {
  const label = text(EFFECT_LABEL_KEYS[kind]);
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
    if (key in EFFECT_LABEL_KEYS) {
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
      label.textContent = text(section.labelKey);
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
    word.textContent = text("requires");
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
      btn.className = "event-item marked";
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
      btn.className = event.spoilerFree ? "event-item marked" : "event-item";
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
  els.emptyTitle.textContent = text("chooseEntry");
  history.replaceState(null, "", location.pathname + location.search);
  renderList();
}

function returnToList() {
  if (activeSection === "poi" && activeChapterId) {
    selectChapter(activeChapterId, true);
    return;
  }

  showEmpty();
  if (window.matchMedia("(max-width: 860px)").matches) {
    document.body.classList.add("rail-open");
    els.menuToggle.setAttribute("aria-expanded", "true");
  }
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

  els.pageMeta.textContent = text("chapter");
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
    btn.className = event.spoilerFree ? "entry-tile marked" : "entry-tile";
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
    empty.textContent = text("noConclusion");
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
    { id: "setup", label: text("setup") },
    { id: "conclusion", label: text("conclusion") },
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
      placeholder.textContent = text("setupImage");
      panel.append(placeholder);
    }
    const goal = document.createElement("aside");
    goal.className = "combat-goal";
    const goalLabel = document.createElement("span");
    goalLabel.className = "combat-goal-label";
    goalLabel.textContent = text("goal");
    const goalText = document.createElement("span");
    goalText.className = "combat-goal-text";
    goalText.textContent = setup.goal || text("killAllEnemies");
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
  els.pageMeta.textContent = text("combat");
  els.pageTitle.textContent = combatLabel(combat);
  els.pageSummary.textContent = "";
  els.pageSummary.hidden = true;
  els.pageTags.replaceChildren();
  els.pageTags.hidden = true;

  els.pageBody.replaceChildren(renderCombatBody(combat));
  els.pageBody.hidden = false;

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
  typeEl.textContent = text("poi");
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

function updateChrome() {
  document.documentElement.lang = activeLanguage;
  els.languageLabel.textContent = LANGUAGE_FLAGS[activeLanguage] || LANGUAGE_FLAGS.en;
  els.languageLabel.title = text("language");
  els.languageSelect.value = activeLanguage;
  els.languageSelect.setAttribute("aria-label", text("language"));
  els.searchWrap.querySelector(".sr-only").textContent = text("search");
  els.search.placeholder = text("searchPlaceholder");
  els.sectionTabs.setAttribute("aria-label", text("sections"));
  els.list.setAttribute("aria-label", text("entries"));
  els.menuToggle.textContent = text("contents");
  els.backBtn.textContent = text("backToList");
  if (!els.empty.hidden) {
    els.emptyTitle.textContent = text("chooseEntry");
  }
}

async function fetchLanguageData(language) {
  const res = await fetch(dataUrlForLanguage(language));
  if (!res.ok) throw new Error(`Could not load content for ${language} (${res.status})`);
  const nextData = await res.json();
  nextData.combats ||= [];
  return nextData;
}

async function changeLanguage(language) {
  if (!LANGUAGES.some((entry) => entry.id === language) || language === activeLanguage) return;
  const previousLanguage = activeLanguage;

  try {
    data = await fetchLanguageData(language);
    activeLanguage = language;
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    const title = data.meta?.title || "Storybook";
    document.title = title;
    els.brandTitle.textContent = title;
    els.brandTagline.textContent = data.meta?.tagline || "";
    updateChrome();
    renderSectionTabs();
    renderList();
    applyHash();
  } catch (err) {
    activeLanguage = previousLanguage;
    els.languageSelect.value = previousLanguage;
    console.error(err);
  }
}

async function boot() {
  data = await fetchLanguageData(activeLanguage);

  const title = data.meta?.title || "Storybook";
  document.title = title;
  els.brandTitle.textContent = title;
  els.brandTagline.textContent = data.meta?.tagline || "";

  updateChrome();
  renderSectionTabs();
  renderList();
  applyHash();
}

els.search?.addEventListener("input", () => {
  renderList();
});

els.languageSelect.addEventListener("change", (event) => {
  changeLanguage(event.target.value);
});

els.backBtn.addEventListener("click", returnToList);

els.menuToggle.addEventListener("click", () => {
  const open = document.body.classList.toggle("rail-open");
  els.menuToggle.setAttribute("aria-expanded", String(open));
});

window.addEventListener("hashchange", applyHash);

boot().catch((err) => {
  els.empty.hidden = false;
  els.page.hidden = true;
  els.empty.replaceChildren();
  const title = document.createElement("h1");
  title.textContent = text("contentMissing");
  const message = document.createElement("p");
  message.textContent = err.message;
  els.empty.append(title, message);
  console.error(err);
});
