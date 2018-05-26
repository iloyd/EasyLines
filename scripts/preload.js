var linesApp = linesApp || {};
linesApp.Preload = function () { };
linesApp.Preload.prototype = {
	preload: function () {
		this.load.image('PlayMenu', 'images/PlayMenu.png');
		this.load.image('Ball', 'images/Ball.png');
		this.load.image('Target', 'images/spiral.png');
		this.load.image('LineTxtr', 'images/linetexture.png');
		this.load.image('Back_to_menu', 'images/back_to_menu.png');
		
		this.load.json('level', 'configs/levels.json');

	},
	create: function () {
		this.game.stage.backgroundColor = "#fff";
		this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
		this.scale.pageAlignHorizontally = true;
		this.scale.pageAlignVertically = true;
		this.game.state.start('MainMenu');
		
	}
};