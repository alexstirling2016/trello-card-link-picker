const normalize = text => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
const shortLink = text => text.match(/https:\/\/trello\.com\/c\/([a-z0-9]+)/i)?.[1];
const markerNames = new Set(["Ajouter un préalable", "Ajouter un lien Alimente"]);

export function filterCards(cards, query) {
  const words = normalize(query.trim()).split(/\s+/);
  return cards.filter(card => {
    const searchable = normalize(card.name + " " + card.listName);
    return words.every(word => searchable.includes(word));
  });
}

const namedLink = card => {
  const title = [...card.name].map(char => "[]\\".includes(char) ? "\\" + char : char).join("");
  return `[${title}](${card.shortUrl})`;
};

async function ensureAttachment(api, card, other) {
  if (!card.attachments.some(item => shortLink(item.url) === shortLink(other.shortUrl))) {
    await api(`cards/${card.id}/attachments`, "POST", {url: other.shortUrl});
  }
}

async function ensureItem(api, card, name, other, text, checked = false) {
  const lists = await api(`cards/${card.id}/checklists`);
  const matching = lists.filter(list => list.name === name);
  if (matching.length > 1) throw new Error(`Plusieurs checklists portent le nom « ${name} ».`);
  const list = matching[0] ?? await api(`cards/${card.id}/checklists`, "POST", {name});
  if (list.checkItems?.some(item => shortLink(item.name) === shortLink(other.shortUrl))) return;
  await api(`checklists/${list.id}/checkItems`, "POST", {name: text, checked});
}

export async function createRelationship(api, boardId, sourceId, targetId, kind) {
  if (sourceId === targetId) throw new Error("Choisissez une autre carte.");
  const get = id => api(`cards/${id}`, "GET", undefined, {
    fields: "name,idBoard,shortUrl,closed,dueComplete,labels",
    attachments: "true", attachment_fields: "url",
  });
  const [source, target] = await Promise.all([get(sourceId), get(targetId)]);
  if ([source, target].some(card => card.idBoard !== boardId || card.closed)) {
    throw new Error("Les deux cartes doivent être actives sur ce tableau.");
  }
  if ([source, target].some(card => card.labels.some(label => markerNames.has(label.name)))) {
    throw new Error("Retirez l’étiquette temporaire d’automatisation avant de créer le lien.");
  }
  if (kind === "feeds") {
    await ensureAttachment(api, source, target);
    await ensureAttachment(api, target, source);
    await ensureItem(api, source, "Ce chantier alimente", target, namedLink(target));
    await ensureItem(api, target, "Ce chantier est alimenté par", source, namedLink(source));
    return;
  }
  if (kind !== "precedes" && kind !== "prerequisite") throw new Error("Type de lien inconnu.");
  const [prerequisite, dependent] = kind === "precedes" ? [source, target] : [target, source];
  await ensureAttachment(api, prerequisite, dependent);
  await ensureAttachment(api, dependent, prerequisite);
  await ensureItem(api, dependent, "Préalables au lancement", prerequisite,
    prerequisite.shortUrl, prerequisite.dueComplete);
  await ensureItem(api, prerequisite, "Ce travail précède", dependent, namedLink(dependent));
}
