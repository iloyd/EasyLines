var linesApp = linesApp || {};
linesApp.MainMenu = function () { };

var menu_button;
linesApp.MainMenu.prototype = {
	preload: function () {

	},
	create: function () {
		this.game.stage.backgroundColor = "ffffff";
		this.menu_button = this.game.add.button(this.game.world.centerX-128, this.game.world.centerY-125, 'PlayMenu', this.MenuButtonClick, this);
	},
	MenuButtonClick: function () {
		this.game.state.start('Game',true,false,0);
	}

};
