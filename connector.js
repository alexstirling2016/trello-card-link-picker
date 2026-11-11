const filterIcon = new URL("./focus.svg", window.location.href).href;
const reportIcon = new URL("./lightning.svg", window.location.href).href;

window.TrelloPowerUp.initialize({
  "board-buttons": async t => {
    const {url} = await t.board("url");
    if (!url) return [];
    const filters = [
      ["Focus uniquement", ["Focus · Synthèse"]],
      ["Focus + préalables", ["Focus + préalables", "Focus · Synthèse"]],
    ].map(([text, labels]) => {
      const board = new URL(url);
      board.search = "?filter=" + labels.map(label => "label:" + encodeURIComponent(label)).join(",");
      return {text, url: board.href, icon: {light: filterIcon, dark: filterIcon}, condition: "signedIn"};
    });
    return [...filters, {
      text: "Par quoi commencer ?",
      icon: {light: reportIcon, dark: reportIcon},
      condition: "signedIn",
      url: "https://trello.com/c/Yx7esjaL",
    }, {
      text: "Point d’avancement",
      icon: {light: reportIcon, dark: reportIcon},
      condition: "signedIn",
      callback: client => client.modal({title: "Point d’avancement", url: "./progress-report.html?v=e7898e9", height: 480}),
    }];
  },
  "card-buttons": async t => {
    const buttons = [{
      text: "Lier une carte",
      callback: client => client.popup({title: "Lier une carte", url: "./picker.html", height: 385}),
    }];
    try {
      const [list, card, board] = await Promise.all([
        t.list("name"), t.card("name", "labels"), t.board("url"),
      ]);
      const label = card?.labels?.find(label => label.name === card.name);
      if (list?.name === "Synthèse" && label && board?.url) {
        const filtered = new URL(board.url);
        filtered.search = "?filter=label:" + encodeURIComponent(label.name);
        buttons.push({text: "Voir les tâches du chantier", url: filtered.href, condition: "signedIn"});
      }
    } catch (error) {
      console.warn("Could not load the chantier filter shortcut", error);
    }
    return buttons;
  },
});
