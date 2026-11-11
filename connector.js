const filterIcon = new URL("./focus.svg", window.location.href).href;

window.TrelloPowerUp.initialize({
  "board-buttons": async t => {
    const {url} = await t.board("url");
    if (!url) return [];
    return [
      ["Focus uniquement", "Focus · Synthèse"],
      ["Focus + préalables", "Focus + préalables"],
    ].map(([text, label]) => {
      const board = new URL(url);
      board.search = "?filter=label:" + encodeURIComponent(label);
      return {text, url: board.href, icon: {light: filterIcon, dark: filterIcon}, condition: "signedIn"};
    });
  },
  "card-buttons": () => [{
    text: "Lier une carte",
    callback: t => t.popup({title: "Lier une carte", url: "./picker.html", height: 385}),
  }],
});
