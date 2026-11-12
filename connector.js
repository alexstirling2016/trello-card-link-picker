const filterIcon = new URL("./focus.svg", window.location.href).href;
const reportIcon = new URL("./lightning.svg", window.location.href).href;

window.TrelloPowerUp.initialize({
  "board-buttons": async t => {
    const {url, labels} = await t.board("url", "labels");
    if (!url) return [];
    const names = new Set((labels ?? []).map(label => label.name));
    const focus = names.has("Focus") ? "Focus" : "Focus · Synthèse";
    const prerequisite = names.has("Préalable") ? "Préalable" : "Focus + préalables";
    const filters = [
      ["Focus uniquement", [focus]],
      ["Focus + préalables", [prerequisite, focus]],
    ].map(([text, labels]) => {
      const board = new URL(url);
      board.search = "?filter=" + labels.map(label => "label:" + encodeURIComponent(label)).join(",");
      return {text, url: board.href, target: "_self", icon: {light: filterIcon, dark: filterIcon}, condition: "signedIn"};
    });
    return [...filters, {
      text: "Point d’avancement",
      icon: {light: reportIcon, dark: reportIcon},
      condition: "signedIn",
      callback: client => client.modal({title: "Point d’avancement", url: "./progress-report.html?v=7dcd016", height: 480}),
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
        buttons.push({
          text: "Voir les tâches du chantier",
          condition: "signedIn",
          callback: client => client.popup({title: "Tâches du chantier", url: "./chantier-filter.html", height: 60}),
        });
      }
    } catch (error) {
      console.warn("Could not load the chantier filter shortcut", error);
    }
    return buttons;
  },
});
