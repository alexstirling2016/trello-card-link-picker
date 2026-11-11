window.TrelloPowerUp.initialize({
  "card-buttons": () => [{
    text: "Lier une carte",
    callback: t => t.popup({title: "Lier une carte", url: "./picker.html", height: 385}),
  }],
});
