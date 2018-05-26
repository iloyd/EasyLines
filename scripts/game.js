var linesApp = linesApp || {};
linesApp.Game = function () { };

var MenuButton;
var graph;
var Ball, Ball_emitter;
var ball_velocity;
var downTouch, upTouch;
var text;
var bmp_data, ship_trail;
var ship_arr;
var touched;
var lines;
var ballMaterial;
var ballCollGroup;
var linesCollGroup;
var targetCollGroup;
var startGameFlag;

var lvl_title;
var lvl_target;
var maxspeed;
var timelimit;
var lineslimit;
var startlines;
var circles;
var target_sprite;
var curr_lvl;

linesApp.Game.prototype = {
    init: function(level) 
   {
      this.curr_lvl = level;
      console.log(level);
   },
	create: function () {
		this.game.stage.backgroundColor = "#FFFFFF";		
		this.MenuButton = this.game.add.button
		(10,10,'Back_to_menu', 
		function(){this.game.state.start('MainMenu');});
		this.MenuButton.scale.setTo(0.25, 0.25);		
		this.graph = this.game.add.graphics(0,0);
		this.game.physics.startSystem(Phaser.Physics.P2JS);
		this.game.physics.p2.setImpactEvents(true);
	    this.game.physics.p2.updateBoundsCollisionGroup();
		this.game.physics.p2.restitution = 0.8;
		this.game.physics.p2.gravity.y = 200;
		this.game.input.onDown.add(this.backgroundOnDown, this);
		this.game.input.onUp.add(this.backgroundOnUp, this);
		//this.game.physics.p2.useElapsedTime = true;
		//this.game.physics.p2.frameRate = 1/5;
		
		var phaserJSON = this.game.cache.getJSON('level');
		this.maxspeed = phaserJSON.levels[0].maxspeed;
		this.timelimit = phaserJSON.levels[0].timelimit;
		this.lineslimit = phaserJSON.levels[0].lineslimit;
		this.lvl_target = phaserJSON.levels[0].target;		
		this.startlines = phaserJSON.levels[0].startlines;
		this.circles = phaserJSON.levels[0].circles;
		
		this.downTouch = [0, 0];        
		this.touched = false;
		
		this.ballCollGroup = this.game.physics.p2.createCollisionGroup();
		this.linesCollGroup = this.game.physics.p2.createCollisionGroup();
		this.targetCollGroup = this.game.physics.p2.createCollisionGroup();
		this.circlesCollGroup = this.game.physics.p2.createCollisionGroup();
		
		
		this.text = this.game.add.text(0, 0,
			"", { font: "25px Arial", fill: "#19de65" });
		this.text.text = String(this.curr_lvl);
		this.Ball = this.game.add.sprite(100, 100, 'Ball');
		this.Ball.scale.setTo(0.3);
		this.game.physics.p2.enable(this.Ball, false);
		this.Ball.body.setCircle(4);
		this.Ball.body.collideWorldBounds = true;		
		this.Ball.body.mass = 1;
		this.Ball.body.setCollisionGroup(this.ballCollGroup);
		this.Ball.body.collides(this.linesCollGroup, this.onCollide, this);
		this.Ball.body.fixedRotation = true;
		this.Ball.body.data.ccdSpeedThreshold = 100;
		this.Ball.body.data.ccdIterations = 20;
		this.Ball.body.velocity.x = 0;
		this.ball_velocity = 80;		

		this.Ball_emitter = this.game.add.emitter(this.Ball.centerX, this.Ball.centerY, 50);
		this.Ball_emitter.makeParticles(['Ball']);
		this.Ball_emitter.gravity = 200;
		this.Ball_emitter.setAlpha(1, 0, 200);
		this.Ball_emitter.setScale(0.3, 0, 0.3, 0, 200);
		this.Ball_emitter.start(false, 75, 5);
	
		this.ballMaterial = this.game.physics.p2.createMaterial('ballMaterial',this.Ball.body);
		var worldMaterial = this.game.physics.p2.createMaterial('worldMaterial');
		var contactMaterial = this.game.physics.p2.createContactMaterial(this.ballMaterial, worldMaterial);
		this.game.physics.p2.setWorldMaterial(worldMaterial, true, true, true, true);
		contactMaterial.restitution = 1.0; 
		contactMaterial.surfaceVelocity = 0;
		this.bmp_data = this.game.make.bitmapData(this.game.width, this.game.height);
		this.bmp_data.addToWorld();						
		
		this.target_sprite = this.game.add.sprite(this.lvl_target.centerX, this.lvl_target.centerY, 'Target');
		this.target_sprite.scale.setTo(0.03);
		this.game.physics.p2.enable(this.target_sprite, false);
		this.target_sprite.body.static = true;
		this.target_sprite.body.setCollisionGroup(this.targetCollGroup);
		this.target_sprite.body.collides([this.ballCollGroup, this.targetCollGroup]);
		this.Ball.body.collides(this.targetCollGroup, this.onFinish, this);
		
		this.startGameFlag = false;
		this.game.paused = true;	
		
		for(var i =0; i<this.startlines.length; i++)
		{
			this.createPolygon(
				this.startlines[i].x1, 
				this.startlines[i].y1,
				this.startlines[i].x2, 
				this.startlines[i].y2
			);
		}
		for(var i = 0; i < this.circles.length; i++)
		{
			this.createCircle(
				this.circles[i].x, 
				this.circles[i].y, 
				this.circles[i].radius
			);
		}
	},
	
	update: function () {	
		
		if (this.touched) {
			this.bmp_data.clear();
			this.bmp_data.line(
				this.downTouch[0], 
				this.downTouch[1], 
				this.game.input.position.x, 
				this.game.input.position.y, 
				"#ff0000", 2);			
		}
		this.constrainVelocity(this.Ball, this.ball_velocity, this.startGameFlag);			
		this.target_sprite.body.rotation+=0.15;					
		this.changeEmitter();			
	},
	
	onCollide: function (body1, body2) {        
		if(this.ball_velocity < this.maxspeed)
			this.ball_velocity+=3;
		
	},
	
	onFinish: function()
	{
		this.game.state.start('MainMenu');		
	},
	
	backgroundOnDown: function (pointer,x,y) {
		this.game.paused = false;
		this.downTouch = [this.game.input.position.x, this.game.input.position.y];		
		this.touched = true;    
	},
	
	backgroundOnUp: function () {
		this.bmp_data.clear();
		this.upTouch = this.game.input.position;		
		this.touched = false;	
		this.createPolygon(
			this.downTouch[0], 
			this.downTouch[1], 
			this.upTouch.x, 
			this.upTouch.y
		);		
	},
	
	constrainVelocity: function(sprite, maxVelocity, flag){
		var body = sprite.body;
		var angle, currVelocitySqr, vx, vy;  
		vx = body.velocity.x;  
		vy = body.velocity.y; 	
	    currVelocitySqr = vx * vx + vy * vy;  
		if (currVelocitySqr != maxVelocity * maxVelocity) {    
			angle = Math.atan2(vy, vx); 
			
			vx = Math.cos(angle) * maxVelocity;    
			vy = Math.sin(angle) * maxVelocity;			
			body.velocity.x = vx; 			
			body.velocity.y = vy;
			if(flag == false)
				body.velocity.x = 0;
			this.startGameFlag = true;
		}
	},
	
	createPolygon: function(startX,startY, endX, endY)
	{
		var line;
		if(startY > endY)
			line = new Phaser.Line(endX, endY, startX, startY);
		else 
			line = new Phaser.Line(startX, startY, endX, endY);
		var dy = Math.sin(1.5708 - line.angle)*3;
		var dx = Math.sqrt(9 - dy*dy);		
		var poly = new Phaser.Polygon();			
		poly.setTo([
		new Phaser.Point(line.start.x-dx, line.start.y+dy),
        new Phaser.Point(line.start.x+dx, line.start.y-dy),
		new Phaser.Point(line.end.x+dx, line.end.y-dy),
		new Phaser.Point(line.end.x-dx, line.end.y+dy)]);		
		if(!poly.contains(this.Ball.body.x, this.Ball.body.y)){
			var polyline = this.game.add.tileSprite(0,0,1,1, 'LineTxtr');
			this.game.physics.p2.enable(polyline, false);            			
			polyline.body.addPolygon({}, 
			line.start.x-dx, line.start.y+dy,
			line.start.x+dx, line.start.y-dy,
			line.end.x+dx, line.end.y-dy,
			line.end.x-dx, line.end.y+dy);			
			polyline.body.static = true;
			polyline.body.setCollisionGroup(this.linesCollGroup);		
			polyline.body.collides([this.linesCollGroup, this.ballCollGroup]);
			polyline.body.data.ccdSpeedThreshold = 100;
			polyline.body.data.ccdIterations = 20;
			var lineMaterial = this.game.physics.p2.createMaterial('lineMaterial', polyline.body);
			var contactMaterial = this.game.physics.p2.createContactMaterial(this.ballMaterial, lineMaterial);
			contactMaterial.restitution = 1.1;
			contactMaterial.stiffness=1e10;
			contactMaterial.frictionStiffness = 1e10; 
			this.graph.beginFill("#000000");
		   this.graph.drawPolygon(poly.points);
		   this.graph.endFill();
		}
	},
	
	createCircle: function(x,y,r)
	{
		var circleSprite = this.game.add.sprite(x,y);
		this.game.physics.p2.enable(circleSprite, false)
		circleSprite.body.setCircle(r/2);
		circleSprite.body.static = true;
		circleSprite.body.setCollisionGroup(this.linesCollGroup);
		circleSprite.body.collides([this.ballCollGroup, this.linesCollGroup]);
		
		this.graph.beginFill("0xffabcd");
		this.graph.drawCircle(x,y,r);
		this.graph.endFill();
	},
	
	changeEmitter: function()
	{
		var px=this.Ball.body.velocity.x*-1;
		var	py = this.Ball.body.velocity.y*-1;
		this.Ball_emitter.minParticleSpeed.set(px,py);
		this.Ball_emitter.maxParticleSpeed.set(px,py);
		this.Ball_emitter.emitX = this.Ball.centerX;
		this.Ball_emitter.emitY = this.Ball.centerY;
	}
};
