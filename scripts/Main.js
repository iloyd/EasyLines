var linesApp = linesApp || {};
linesApp.game = new Phaser.Game(window.screen.width, window.screen.height, Phaser.CANVAS, '');
//linesApp.game = new Phaser.Game(800, 600, Phaser.WEBGL, '');

linesApp.game.state.add('Preload', linesApp.Preload);
linesApp.game.state.add('MainMenu', linesApp.MainMenu);
linesApp.game.state.add('Game', linesApp.Game);

linesApp.game.state.start('Preload');