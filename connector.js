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
      text: "Point d’avancement",
      icon: {light: reportIcon, dark: reportIcon},
      condition: "signedIn",
      callback: client => client.modal({title: "Point d’avancement", url: "./progress-report.html?v=57e6f4e", height: 420}),
    }];
  },
  "card-buttons": () => [{
    text: "Lier une carte",
    callback: t => t.popup({title: "Lier une carte", url: "./picker.html", height: 385}),
  }],
});
