//Bright does not have health, but does have corruption. Being Dark for too long, or taking hits from enemies corrupts him. If he reaches full corruption, you have to battle him.

class Bright extends Phaser.Physics.Matter.Sprite{
    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'bright', 0)
        this.scene = scene;       
        scene.matter.world.add(this);
        scene.add.existing(this); 
        this.setActive(true);
        this.sprite = this;
    
        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        const { width: w, height: h } = this.sprite;
        const mainBody = Bodies.circle(0,0,w*.18);

        this.sensors = {
          bottom: Bodies.rectangle(0, h * 0.18, w * 0.22, 2, { isSensor: true }),
          top: Bodies.rectangle(0, -h * 0.18, w * 0.22, 2, { isSensor: true }),
          left: Bodies.rectangle(-w * 0.18, 0, 2, h * 0.22, { isSensor: true }),
          right: Bodies.rectangle(w * 0.18, 0, 2, h * 0.22, { isSensor: true })
        };
        this.sensors.bottom.label = "BRIGHT_BOTTOM";
        this.sensors.top.label = "BRIGHT_TOP";
        this.sensors.left.label = "BRIGHT_LEFT";
        this.sensors.right.label = "BRIGHT_RIGHT";

        const compoundBody = Body.create({
          parts: [mainBody, this.sensors.top, this.sensors.bottom, this.sensors.left, this.sensors.right],
          frictionStatic: 0.5,
          frictionAir: 0.3,
          friction: 0.5,
          restitution: 0.00,
          density: 0.05,
          label: "BRIGHT"
        });
        this.sprite
        .setExistingBody(compoundBody)          
        .setCollisionCategory(CATEGORY.BRIGHT)
        .setScale(1.5)
        //.setFixedRotation() // Sets inertia to infinity so the player can't rotate
        .setPosition(config.x, config.y)
        .setIgnoreGravity(true);
          
        //Custom properties
        this.light_status = 0;//0 - Bright, 1 - Dark;
        this.hp = 1;
        this.max_hp = 1;
        this.mv_speed = 3;
        this.roll_speed = .3;
        this.jump_speed = 6;
        this.alive = true;
        this.falling = false;
        this.debug = this.scene.add.text(this.x, this.y-16, 'bright', { fontSize: '10px', fill: '#00FF00' });
        this.touching = {up:0,down:0,left:0,right:0};
        this.airTime = 0;//For Camera Shake
        this.light_radius = 50;

        //Create Effects
        this.effect=[
            this.scene.add.particles('shapes',  new Function('return ' + this.scene.cache.text.get('effect-bright-sparks'))())
        ];
        console.log(this.effect[0].emitters.list[0]);
        this.effect[0].setVisible(false);
        this.effect[0].emitters.list[0].setPosition(this.x,this.y);
        this.effect[0].emitters.list[0].startFollow(this);
        
        this.abPulse = {c:0,max:100,doCharge:false};

        //Abilities
        this.beamAbility = new BrightBeam(this.scene,this.x,this.y,this.rotation);
        this.beamReady = true;
        this.beamCoolDown = this.scene.time.addEvent({ delay: 1000, callback: this.resetBeam, callbackScope: this, loop: true });

        //Controller
        this.controller;
        this.ctrlDevice;
        this.ctrlDeviceId = -1;
    }

    update()
    {
            if(this.alive){

            if(this.touching.up==0 && this.touching.down == 0 && this.touching.left == 0 && this.touching.right == 0){
                this.airTime++;
            }else{
                this.airTime=0;
            };
            if(this.abPulse.doCharge){
                if(this.abPulse.c < this.abPulse.max){
                this.abPulse.c++;
                }
            }


            //Do Dark Updates
            if(this.light_status == 1){
                if(this.touching.down == 0 && this.airTime > 40){
                    //Falling, so change animation
                    this.sprite.anims.play('dark-falling', false);
                    this.falling = true;
                }else{
                    //On ground now.
                    this.sprite.anims.play('dark-idle', false);
                    if(this.falling){
                        //If I was falling, shake the camera.
                        camera_main.shake(80,.005);
                        this.falling = false;
                        
                    }
                }
            }
            //Movement Code
            if(curr_player==players.BRIGHT || playerMode > 0){
                //Only control if currently the active control object
                let control_left = this.getControllerAction('left');
                let control_right = this.getControllerAction('right');
                let control_up = this.getControllerAction('up');
                let control_down = this.getControllerAction('down');
                let control_jump = this.getControllerAction('jump');
                let control_beam = this.getControllerAction('beam');
                let control_passPress = this.getControllerAction('pass');
                let control_passRelease = this.getControllerAction('passR');
                let control_pulsePress = this.getControllerAction('pulse');
                let control_pulseRelease = this.getControllerAction('pulseR');
                //Control Based on Light or Dark Modes
                let darkMode = 1;
                let brightMode = 0;
                if(this.light_status == brightMode){
                    //BRIGHT CONTROLS 
                    if(control_beam && this.beamReady ){
                        this.beamReady = false;
                        this.beamAbility.create(soullight.aimer.x,soullight.aimer.y,soullight.aimer.rotation);
                    }
                    if(control_left){
                        this.sprite.setVelocityX(-this.mv_speed);
                        this.flipX= true; // flip the sprite to the left
                        this.sprite.anims.play('bright-idle', true);//Idle
                    }
                    if(control_right){
                        this.sprite.setVelocityX(this.mv_speed);
                        this.flipX= false; // flip the sprite to the right
                        this.sprite.anims.play('bright-idle', true);//Idle
                    }
                    if (control_up) {
                        this.sprite.setVelocityY(-this.mv_speed);
                        this.sprite.anims.play('bright-idle', true);
                    }
                    if (control_down) {
                        this.sprite.setVelocityY(this.mv_speed);
                        this.sprite.anims.play('bright-idle', true);
                    }
                    if(!control_left && !control_right && !control_up && !control_down){
                        this.sprite.anims.play('bright-idle', true);//Idle
                    }
                    //Passing Soulight
                    if(soullight.ownerid == 1){
                        if(control_passPress){soullight.aimStart();};
                        if(control_passRelease){soullight.aimStop();};
                    }
                    if(control_pulsePress){
                        bright.pulseCharge();
                    }
                    if(control_pulseRelease){
                        bright.pulseThrow(solana);
                    }

                }else{
                    //DARK CONTROLS
                    if (control_left) {          
                        this.sprite.setAngularVelocity(-this.roll_speed);            
                        this.sprite.anims.play('dark-idle', true);      
                    }
                    if (control_right) {     
                        this.sprite.setAngularVelocity(this.roll_speed);                    
                        this.sprite.anims.play('dark-idle', true);                 
                    }
                    if(!control_left && !control_right){
                        this.sprite.anims.play('dark-idle', true);//Idle
                    }
                    
                    if (control_down && this.airTime == 0) {
                        let angVel = this.body.angularVelocity;
                        if(angVel > 0){this.setAngularVelocity(angVel-.05)};
                        if(angVel < 0){this.setAngularVelocity(angVel+.05)};
                        if(angVel < .10 && angVel > -.10){this.setAngularVelocity(0)};
                        //Kick up dust
                        if(this.body.velocity.x > 1 || this.body.velocity.x < -1){
                            let pQ = Math.round(Math.abs(this.body.velocity.x));
                            emitter_dirt_spray.active = true;
                            emitter_dirt_spray.explode(5,this.x,this.y);
                        }
                    }
                                    //Dark Jump
                    if(control_jump && this.airTime <=  10){
                        this.sprite.setVelocityY(-this.jump_speed);
                    }
                }

                this.debug.setPosition(this.sprite.x, this.sprite.y-64);
                this.debug.setText("ctrl-pass:"+String(control_passPress)
                +"\nctrl-passR:"+String(control_passRelease)
                +"\nR-StatusKPGlobal:"+String(keyPad.checkKeyState('R'))
                +"\nR-KP_R:"+String(keyPad.buttons.R.b.isDown));
            }
        }

    }    
    getControllerAction(action){
        if(this.ctrlDeviceId >=0){
            switch(action){
                case 'up':
                    return (gamePad[this.ctrlDeviceId].getStickLeft().y < 0);
                case 'down':
                    return (gamePad[this.ctrlDeviceId].getStickLeft().y > 0);
                case 'left':
                    return (gamePad[this.ctrlDeviceId].getStickLeft().x < 0);
                case 'right':
                    return (gamePad[this.ctrlDeviceId].getStickLeft().x > 0);
                case 'jump':
                    return (gamePad[this.ctrlDeviceId].checkButtonState('A') == 1);
                case 'beam':
                    return (gamePad[this.ctrlDeviceId].checkButtonState('X') == 1);
                case 'pass':
                    return (gamePad[this.ctrlDeviceId].checkButtonState('Y') == 1);
                case 'passR':
                    return (gamePad[this.ctrlDeviceId].checkButtonState('Y') == -1);
                case 'pulse':
                    return (gamePad[this.ctrlDeviceId].checkButtonState('B') == 1);
                case 'pulseR':
                    return (gamePad[this.ctrlDeviceId].checkButtonState('B') == -1);
                default:
                    return false;
            }
        }else if(this.ctrlDeviceId == -1){
            switch(action){
                case 'up':
                    return (keyPad.checkKeyState('W') > 0);
                case 'down':
                    return (keyPad.checkKeyState('S') > 0);
                case 'left':
                    return (keyPad.checkKeyState('A') > 0);
                case 'right':
                    return (keyPad.checkKeyState('D') > 0);
                case 'jump':
                    return (keyPad.checkKeyState('SPC') == 1);
                case 'beam':
                    return (keyPad.checkMouseState('MB0') > 0);
                case 'pass':
                    return (keyPad.checkKeyState('R') == 1);
                case 'passR':
                    return (keyPad.checkKeyState('R') == -1);
                case 'pulse':
                    return (keyPad.checkKeyState('F') == 1);
                case 'pulseR':
                    return (keyPad.checkKeyState('F') == -1);
                default:
                    return false;
    
                } 
        }else{
            return false
        }
    }
    setController(ctrlId,ctrl){
        //Sets the controller Source
        this.ctrlDevice = ctrl;
        this.ctrlDeviceId = ctrlId;
    }
    resetBeam(){
       this.beamReady = true; 
    }
    toDark(){
        this.light_status = 1;
        this.setFrictionAir(0.01);
        this.sprite.setTexture('dark');
        this.sprite.anims.play('dark-idle', false);
        this.sprite.setIgnoreGravity(false);
        this.sprite.setCollisionCategory(CATEGORY.DARK);
        this.sprite.setDensity(0.01);
    }
    toBright(){
        this.light_status = 0;
        this.setFrictionAir(0.30);
        this.sprite.setTexture('bright');
        this.sprite.anims.play('bright-idle', false);
        this.sprite.setIgnoreGravity(true);
        this.sprite.setCollisionCategory(CATEGORY.BRIGHT);
        this.sprite.setDensity(0.01);
        //Tween back to straight up
        this.reAlignBright();
    }
    reAlignBright(){
        this.scene.tweens.add({
            targets: this,
            angle: 0,
            ease: 'Power1',
            duration: 1000,
            onComplete: this.reAlignComplete,
            onCompleteParams: [ this ]
        });
    }
    reAlignComplete(){

    }
    getVelocity(){
        return this.body.velocity;
    }
    death(animation, frame){
        
        if(animation.key == 'bright-walk'){
            this.setActive(false);
            this.setVisible(false);
            this.debug.setVisible(false);
            this.hp = 1;
            this.alive = true; 
        }
    }
    receiveDamage(damage) {
        this.hp -= damage;           
        
        // if hp drops below 0 we deactivate this enemy
        if(this.hp <= 0 && !this.dead ) {
            this.alive = false; 
                     
            this.sprite.on('animationcomplete',this.death,this);            
            this.sprite.anims.play('bright-walk', false);
            
        }
    }
    pulseCharge(){
        this.abPulse.doCharge = true;
        this.effect[0].setVisible(true);
    }
    pulseThrow(object){
        this.abPulse.doCharge = false;
        this.effect[0].setVisible(false);
        //Bright charges up, sending nearby objects flying away, including Solana, bullets, crates, etc.
        //Will have a min power and a max power level, based on charge time. The Charge drains light.
        if(Phaser.Math.Distance.Between(this.x,this.y,object.x,object.y) < 64){
            let angleToThrow = Phaser.Math.Angle.Between(this.x,this.y,object.x,object.y);
            let power =  this.abPulse.c/1000;
            let vecX = Math.cos(angleToThrow)*power;
            let vecY = Math.sin(angleToThrow)*power;  
            object.applyForce({x:vecX,y:vecY});
        }
        this.abPulse.c = 0;
    }
}
