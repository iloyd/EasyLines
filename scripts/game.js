var linesApp = linesApp || {};
linesApp.Game = function () { };

var MenuButton;
var graph;
var Ball, Ball_emitter;
var ball_velocity;
var downTouch, upTouch;
var text;
var lines_text;
var time_text;
var title_text;
var bmp_data, ship_trail;
var ship_arr;
var touched;
var lines;
var ballMaterial;
var ballCollGroup;
var linesCollGroup;
var targetCollGroup;
var startGameFlag;
var lvl_timer;
var painted_lines_cnt;


var lvl_title;
var lvl_target;
var maxspeed;
var timelimit;
var lineslimit;
var startlines;
var circles;
var start_ball_pos;
var target_sprite;
var curr_lvl;

linesApp.Game.prototype = {
    init: function(level) 
   {
      this.curr_lvl = level;     
   },
   //Инициализация всех начальных параметров уровня
	create: function () {
		this.game.stage.backgroundColor = "#FFFFFF";//Цвет фона		
		this.MenuButton = this.game.add.button // Кнопка выхода в главное меню
		(10,10,'Back_to_menu', 
		function(){this.game.state.start('MainMenu');});
		this.MenuButton.scale.setTo(0.06, 0.06);	//Уменьшение масштаба кнопки в 4 раза	
		this.graph = this.game.add.graphics(0,0); //Объект для отображения препятствий
		this.game.physics.startSystem(Phaser.Physics.P2JS);//Инициализация физики
		this.game.physics.p2.setImpactEvents(true); 
	   this.game.physics.p2.updateBoundsCollisionGroup();
		this.game.physics.p2.restitution = 0.8;
		this.game.physics.p2.gravity.y = 50;
		this.game.input.onDown.add(this.backgroundOnDown, this); // Обработка события нажатия функцией backgroundOnDown
		this.game.input.onUp.add(this.backgroundOnUp, this); // Обработка события прекращения нажатия функцией backgroundOnUp
		//this.game.physics.p2.useElapsedTime = true;
		//this.game.physics.p2.frameRate = 1/5;	
			
		
		
		var phaserJSON = this.game.cache.getJSON('level'); // Загрузка данных уровня из кэша
		this.maxspeed = phaserJSON.levels[ this.curr_lvl ].maxspeed; // Максимальная скорость шара
		this.timelimit = phaserJSON.levels[ this.curr_lvl ].timelimit; // Ограничение по времени на прохождение уровня
		this.lineslimit = phaserJSON.levels[ this.curr_lvl ].lineslimit; // Ограничение по количеству линий для игрока
		this.lvl_target = phaserJSON.levels[ this.curr_lvl ].target; // Цель для шара		
		this.startlines = phaserJSON.levels[ this.curr_lvl ].startlines; // Начальные линни-препятствия
		this.circles = phaserJSON.levels[ this.curr_lvl ].circles; // Начальные круги-препятствия		
		this.start_ball_pos = phaserJSON.levels[this.curr_lvl].ball;
		
		this.lvl_timer = this.game.time.create( false );		
		this.lvl_timer.loop( this.timelimit * 1000, this.outOfTime, this);
		
		
		this.downTouch = [0, 0]; //Инициазция переменной нажатия на экран       
		this.touched = false; // Флаговая переменная для отслеживания нажатия на экран
		
		//Инициализция групп сталкивающихся между собой объектов
		this.ballCollGroup = this.game.physics.p2.createCollisionGroup();
		this.linesCollGroup = this.game.physics.p2.createCollisionGroup();
		this.targetCollGroup = this.game.physics.p2.createCollisionGroup();
		this.circlesCollGroup = this.game.physics.p2.createCollisionGroup();	
		
		this.Ball = this.game.add.sprite( 
				this.start_ball_pos.x * window.screen.width, 
				this.start_ball_pos.y * window.screen.height, 
				'Ball');//Шар
		this.Ball.scale.setTo(0.3);//Уменьшение масштаба шара
		this.game.physics.p2.enable(this.Ball, false);//Инициализация физики для шара
		this.Ball.body.setCircle(4); // Границы тела шара
		this.Ball.body.collideWorldBounds = true;	//Сталкивается ли шар с границами экрана	
		this.Ball.body.mass = 1; // Масса шара
		this.Ball.body.setCollisionGroup(this.ballCollGroup);
		this.Ball.body.collides(this.linesCollGroup, this.onCollide, this); //Инициализация столкновений с препятствиями
		this.Ball.body.fixedRotation = true; //Вращение шара вокруг своей оси
		this.Ball.body.data.ccdSpeedThreshold = 100;
		this.Ball.body.data.ccdIterations = 20;
		this.Ball.body.velocity.x = 0;
		this.ball_velocity = 80; // Начальная скорость шара		

		//Параметры следа, который шар оставляет при движении
		this.Ball_emitter = this.game.add.emitter(this.Ball.centerX, this.Ball.centerY, 50);
		this.Ball_emitter.makeParticles(['Ball']);
		this.Ball_emitter.gravity = 200;
		this.Ball_emitter.setAlpha(1, 0, 200);
		this.Ball_emitter.setScale(0.3, 0, 0.3, 0, 200);
		this.Ball_emitter.start(false, 75, 5);
		
		//Инициализация физических свойств шара и грациц экрана
		this.ballMaterial = this.game.physics.p2.createMaterial('ballMaterial',this.Ball.body);
		var worldMaterial = this.game.physics.p2.createMaterial('worldMaterial');
		var contactMaterial = this.game.physics.p2.createContactMaterial(this.ballMaterial, worldMaterial);
		this.game.physics.p2.setWorldMaterial(worldMaterial, true, true, true, true);
		contactMaterial.restitution = 1.0; 
		contactMaterial.surfaceVelocity = 0;
		
		this.bmp_data = this.game.make.bitmapData(this.game.width, this.game.height);
		this.bmp_data.addToWorld();						
		
		//Инициализация параметров целевого объекта
		this.target_sprite = this.game.add.sprite(
				this.lvl_target.centerX * window.screen.width, 
				this.lvl_target.centerY * window.screen.height, 
				'Target');
		this.target_sprite.scale.setTo(0.03);
		this.game.physics.p2.enable(this.target_sprite, false);
		this.target_sprite.body.static = true;
		this.target_sprite.body.setCollisionGroup(this.targetCollGroup);
		this.target_sprite.body.collides([this.ballCollGroup, this.targetCollGroup]);
		this.Ball.body.collides(this.targetCollGroup, this.onFinish, this);
		
		//Пауза
		this.startGameFlag = false;
		this.game.paused = true;					
		this.painted_lines_cnt = 0;
		//Отрисовка начальных препятствий
		if(this.startlines)
		{
			for(var i =0; i<this.startlines.length; i++)
			{
				this.createPolygon(
					this.startlines[i].x1 * window.screen.width, 
					this.startlines[i].y1 * window.screen.height,
					this.startlines[i].x2 * window.screen.width, 
					this.startlines[i].y2 * window.screen.height
				);
			}
			this.lineslimit += this.startlines.length;
		}
		if(this.circles)
			for(var i = 0; i < this.circles.length; i++)
			{
				this.createCircle(
					this.circles[i].x * window.screen.width, 
					this.circles[i].y * window.screen.height, 
					this.circles[i].radius
				);
			}
		this.lines_text = this.game.add.text (window.screen.width * 0.55, 0, 
				"",{ font: "12px Arial", fill: "#1199ff" });
		this.time_text = this.game.add.text (window.screen.width * 0.10, 0, 
				"",{ font: "12px Arial", fill: "#1199ff" });
		this.title_text = this.game.add.text (window.screen.width * 0.4, window.screen.height * 0.1, 
				phaserJSON.levels[ this.curr_lvl ].title,{ font: "25px Arial", fill: "#010101" });
	},
	
	update: function () {	
		if(!this.game.paused)
		{		
			if (this.touched) 
				{
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
			this.time_text.text = "Осталось времени:" + String(Math.round(this.lvl_timer.duration.toFixed(0)/1000))+"s";
		}	
	},
	
	onCollide: function (body1, body2) {        
		if(this.ball_velocity < this.maxspeed)
			this.ball_velocity+=3;
	},
	
	onFinish: function()
	{
		this.game.state.start('Game', true, false, this.curr_lvl+1);		
	},
	
	backgroundOnDown: function (pointer,x,y) 
	{
		if( this.game.paused )
		{
			this.game.paused = false;
			this.lvl_timer.start();
			this.lines_text.text = "Осталось линий:"+String(this.lineslimit-this.painted_lines_cnt );
			this.title_text.destroy();
		}
		this.downTouch = [this.game.input.position.x, this.game.input.position.y];		
		this.touched = true;    
	},
	
	backgroundOnUp: function () 
	{
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
	
	constrainVelocity: function(sprite, maxVelocity, flag)
	{
		var body = sprite.body;
		var angle, currVelocitySqr, vx, vy;  
		vx = body.velocity.x;  
		vy = body.velocity.y; 	
	    currVelocitySqr = vx * vx + vy * vy;  
		if (currVelocitySqr != maxVelocity * maxVelocity) 
		{    
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
		if(this.painted_lines_cnt < this.lineslimit)
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
			var LengthOfLine = Math.sqrt(
					Math.pow(line.end.x - line.start.x, 2) + 
					Math.pow(line.end.y - line.start.y, 2))			
			if(!poly.contains(this.Ball.body.x, this.Ball.body.y) && LengthOfLine>10)
			{
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
				this.painted_lines_cnt++;
				this.lines_text.text = "Осталось линий:"+String(this.lineslimit-this.painted_lines_cnt ); 				
			}			
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
		var py = this.Ball.body.velocity.y*-1;
		this.Ball_emitter.minParticleSpeed.set(px,py);
		this.Ball_emitter.maxParticleSpeed.set(px,py);
		this.Ball_emitter.emitX = this.Ball.centerX;
		this.Ball_emitter.emitY = this.Ball.centerY;
	},
	
	outOfTime: function()
	{
		this.game.state.start('MainMenu');
	}
};
