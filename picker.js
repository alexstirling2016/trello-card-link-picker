import {createRelationship, filterCards} from "./relationships.mjs";

const config = window.pickerConfig;
const t = window.TrelloPowerUp.iframe(config);
const element = id => document.getElementById(id);
const form = element("form");
const authorize = element("authorize");
const search = element("search");
const results = element("results");
const save = element("save");
let rest;
let context;
let cards = [];
let selected;
let busy = false;

function message(text) {
  element("message").textContent = text;
}

async function api(path, method = "GET", payload, query = {}) {
  const token = await rest.getToken();
  if (!token) throw new Error("Autorisez l’accès à Trello pour continuer.");
  const url = new URL("https://api.trello.com/1/" + path);
  url.search = new URLSearchParams({...query, key: config.appKey, token});
  const response = await fetch(url, {
    method,
    headers: payload ? {"Content-Type": "application/json"} : undefined,
    body: payload ? JSON.stringify(payload) : undefined,
    referrerPolicy: "no-referrer",
  });
  if (!response.ok) throw new Error(`Trello a refusé l’opération (HTTP ${response.status}).`);
  return response.json();
}

function render() {
  const matches = filterCards(cards, search.value);
  results.replaceChildren();
  for (const card of matches.slice(0, 25)) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `${card.name} · ${card.listName}`;
    button.setAttribute("aria-pressed", String(selected?.id === card.id));
    button.onclick = () => {
      selected = card;
      search.value = card.name;
      render();
      save.focus();
    };
    results.append(button);
  }
  if (!matches.length) results.textContent = "Aucune carte correspondante.";
  save.disabled = !selected || busy;
}

async function loadCards() {
  const [boardCards, lists] = await Promise.all([
    api(`boards/${context.board}/cards/open`, "GET", undefined, {fields: "name,idList"}),
    api(`boards/${context.board}/lists/open`, "GET", undefined, {fields: "name"}),
  ]);
  const names = new Map(lists.map(list => [list.id, list.name]));
  cards = boardCards.filter(card => card.id !== context.card)
    .map(card => ({...card, listName: names.get(card.idList) ?? ""}))
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
  authorize.hidden = true;
  form.hidden = false;
  render();
  search.focus();
}

authorize.onclick = async () => {
  authorize.disabled = true;
  try {
    await rest.authorize({scope: "read,write", expiration: "never"});
    await loadCards();
  } catch (error) {
    message(error.message);
  } finally {
    authorize.disabled = false;
  }
};
search.oninput = () => {
  selected = undefined;
  render();
};
form.onsubmit = async event => {
  event.preventDefault();
  if (!selected || busy) return;
  busy = true;
  save.disabled = true;
  try {
    await createRelationship(api, context.board, context.card, selected.id, element("relation").value);
    message("Lien enregistré.");
    await t.closePopup();
  } catch (error) {
    message(error.message);
  } finally {
    busy = false;
    save.disabled = !selected;
  }
};
t.render(async () => {
  try {
    if (!config.appKey) throw new Error("La clé publique du Power-Up reste à configurer.");
    context = t.getContext();
    rest = await t.getRestApi();
    if (await rest.isAuthorized()) await loadCards();
    else authorize.hidden = false;
  } catch (error) {
    message(error.message);
  }
});
