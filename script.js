const API_URL = "https://thesimpsonsapi.com/api/characters";
const IMAGE_CDN = "https://cdn.thesimpsonsapi.com/500";
const FALLBACK_IMAGE = "assets/portrait-placeholder.svg";

const grid = document.querySelector("#character-grid");
const resultsSummary = document.querySelector("#results-summary");
const pageCounter = document.querySelector("#page-counter");
const archiveCount = document.querySelector("#archive-count");
const updatedAt = document.querySelector("#updated-at");
const searchInput = document.querySelector("#search-input");
const searchForm = document.querySelector("#search-form");
const filterButtons = [...document.querySelectorAll(".filter-chip")];
const previousButton = document.querySelector("#previous-page");
const nextButton = document.querySelector("#next-page");
const emptyState = document.querySelector("#empty-state");
const errorState = document.querySelector("#error-state");
const clearFiltersButton = document.querySelector("#clear-filters");
const retryButton = document.querySelector("#retry-button");

let currentPage = 1;
let totalPages = 1;
let currentCharacters = [];
let selectedStatus = "all";
let latestRequest = 0;

function showSkeletons() {
  grid.replaceChildren();
  grid.setAttribute("aria-busy", "true");
  grid.hidden = false;
  emptyState.hidden = true;
  errorState.hidden = true;

  for (let index = 0; index < 8; index += 1) {
    const skeleton = document.createElement("div");
    skeleton.className = "skeleton-card";
    skeleton.setAttribute("aria-hidden", "true");
    const image = document.createElement("div");
    image.className = "skeleton-block skeleton-image";
    const lines = document.createElement("div");
    lines.className = "skeleton-lines";
    for (let line = 0; line < 3; line += 1) {
      const block = document.createElement("div");
      block.className = "skeleton-block";
      lines.appendChild(block);
    }
    skeleton.append(image, lines);
    grid.appendChild(skeleton);
  }
}

function getStatusDetails(status) {
  const normalized = String(status ?? "unknown").toLowerCase();
  if (normalized === "alive" || normalized === "vivo") {
    return { label: "Vivo", className: "alive", filterValue: "alive" };
  }
  if (["deceased", "dead", "falecido", "morto"].includes(normalized)) {
    return { label: "Falecido", className: "deceased", filterValue: "deceased" };
  }
  return { label: "Indefinido", className: "unknown", filterValue: "unknown" };
}

function makeElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function getPortraitUrl(portraitPath) {
  if (!portraitPath) return FALLBACK_IMAGE;
  if (/^https?:\/\//i.test(portraitPath)) return portraitPath;
  const normalizedPath = portraitPath.startsWith("/") ? portraitPath : `/${portraitPath}`;
  return `${IMAGE_CDN}${normalizedPath}`;
}

function createCharacterCard(character, index) {
  const status = getStatusDetails(character.status);
  const card = makeElement("article", "character-card");
  card.dataset.characterId = String(character.id ?? "");
  card.style.animationDelay = `${Math.min(index * 35, 245)}ms`;

  const visual = makeElement("div", "character-card__visual");
  const image = makeElement("img", "character-card__image");
  image.src = getPortraitUrl(character.portrait_path ?? character.image);
  image.alt = `Retrato de ${character.name ?? "personagem de Springfield"}`;
  image.loading = "lazy";
  image.decoding = "async";
  image.addEventListener("error", () => {
    if (image.dataset.fallbackApplied === "true") return;
    image.dataset.fallbackApplied = "true";
    image.src = FALLBACK_IMAGE;
  });

  const idLabel = makeElement("span", "character-card__id", `ARQ. ${String(character.id ?? "—").padStart(4, "0")}`);
  const statusBadge = makeElement("span", `character-status character-status--${status.className}`, status.label);
  visual.append(image, idLabel, statusBadge);

  const body = makeElement("div", "character-card__body");
  const eyebrow = makeElement("div", "character-card__eyebrow");
  eyebrow.append(
    makeElement("span", "", character.gender || "PERSONAGEM"),
    makeElement("span", "", character.age == null ? "IDADE N/D" : `${character.age} ANOS`),
  );
  const name = makeElement("h3", "character-card__name", character.name || "Sem nome");
  const occupation = makeElement("p", "character-card__occupation", character.occupation || "Profissão não informada");
  const phrase = Array.isArray(character.phrases) ? character.phrases.find((item) => typeof item === "string" && item.trim()) : "";
  const quote = makeElement("p", "character-card__quote", phrase ? `“${phrase}”` : "Uma história ainda não contada.");

  body.append(eyebrow, name, occupation, quote);
  card.append(visual, body);
  return card;
}

function filterCurrentPage() {
  const query = searchInput.value.trim().toLocaleLowerCase("pt-BR");
  return currentCharacters.filter((character) => {
    const name = String(character.name ?? "").toLocaleLowerCase("pt-BR");
    const occupation = String(character.occupation ?? "").toLocaleLowerCase("pt-BR");
    const matchesQuery = !query || name.includes(query) || occupation.includes(query);
    const matchesStatus = selectedStatus === "all" || getStatusDetails(character.status).filterValue === selectedStatus;
    return matchesQuery && matchesStatus;
  });
}

function renderCharacters() {
  const visibleCharacters = filterCurrentPage();
  grid.replaceChildren();
  grid.setAttribute("aria-busy", "false");
  grid.hidden = false;
  emptyState.hidden = visibleCharacters.length > 0;

  visibleCharacters.forEach((character, index) => {
    grid.appendChild(createCharacterCard(character, index));
  });

  const total = Number(archiveCount.dataset.total ?? 0);
  const shown = visibleCharacters.length;
  const pageCount = currentCharacters.length;
  resultsSummary.textContent = shown === pageCount
    ? `${pageCount} personagens nesta página · ${total.toLocaleString("pt-BR")} no arquivo`
    : `${shown} de ${pageCount} personagens nesta página · ${total.toLocaleString("pt-BR")} no arquivo`;
}

async function loadCharacters(page = 1) {
  const requestId = ++latestRequest;
  currentPage = page;
  showSkeletons();
  resultsSummary.textContent = "Consultando o arquivo de Springfield...";
  pageCounter.textContent = `PÁGINA ${page} / —`;

  try {
    const response = await fetch(`${API_URL}?page=${page}`, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`A API respondeu com o status ${response.status}.`);
    const payload = await response.json();
    if (requestId !== latestRequest) return;

    currentCharacters = Array.isArray(payload.results) ? payload.results : [];
    totalPages = Number(payload.pages) || 1;
    const totalCharacters = Number(payload.count) || 0;
    archiveCount.dataset.total = String(totalCharacters);
    archiveCount.textContent = totalCharacters.toLocaleString("pt-BR");
    pageCounter.textContent = `PÁGINA ${currentPage} / ${totalPages}`;
    updatedAt.textContent = `atualizado às ${new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date())}`;
    previousButton.disabled = currentPage <= 1;
    nextButton.disabled = currentPage >= totalPages;
    errorState.hidden = true;
    renderCharacters();
  } catch (error) {
    if (requestId !== latestRequest) return;
    console.error("Falha ao consultar a API de Os Simpsons:", error);
    grid.replaceChildren();
    grid.hidden = true;
    grid.setAttribute("aria-busy", "false");
    emptyState.hidden = true;
    errorState.hidden = false;
    resultsSummary.textContent = "Não foi possível atualizar os dados.";
    pageCounter.textContent = "PÁGINA — / —";
    previousButton.disabled = true;
    nextButton.disabled = true;
  }
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  renderCharacters();
});

searchInput.addEventListener("input", renderCharacters);

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedStatus = button.dataset.status;
    filterButtons.forEach((filterButton) => {
      const isSelected = filterButton === button;
      filterButton.classList.toggle("is-active", isSelected);
      filterButton.setAttribute("aria-pressed", String(isSelected));
    });
    renderCharacters();
  });
});

previousButton.addEventListener("click", () => {
  if (currentPage > 1) loadCharacters(currentPage - 1);
});

nextButton.addEventListener("click", () => {
  if (currentPage < totalPages) loadCharacters(currentPage + 1);
});

clearFiltersButton.addEventListener("click", () => {
  searchInput.value = "";
  selectedStatus = "all";
  filterButtons.forEach((button) => {
    const isSelected = button.dataset.status === "all";
    button.classList.toggle("is-active", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });
  renderCharacters();
});

retryButton.addEventListener("click", () => loadCharacters(currentPage));

loadCharacters();

