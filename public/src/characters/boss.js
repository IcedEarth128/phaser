//SPIDER HIVE - BOSS # 1
//Spawns up to three spiders to chase player.
//Spawns every 15 seconds if there is room.
//Sprays webbing and acid every 5-10 seconds after a pulsating charge up.
//How to defeat?
class SpiderHive extends Phaser.Physics.Matter.Sprite{
    constructor(scene,x,y) {
        super(scene.matter.world, x, y, 'boss_spiderhive', 0)        
        scene.matter.world.add(this);
        scene.add.existing(this); 
        this.setActive(true);
        const { Body, Bodies } = Phaser.Physics.Matter.Matter; // Native Matter modules
        const { width: w, height: h } = this;
        
        const coreArea =  Bodies.rectangle(0, 0, this.width*.5, this.height*.35, { chamfer: {radius: 5}, isSensor: false });

        const mainBody = Body.create({
            parts: [coreArea],
            frictionStatic: 0,
            frictionAir: 0.00,
            friction: 0.10,
            restitution: 0.00,
            label: "BossSpiderHive"
        });

        mainBody.render.sprite.xOffset = .51;
        mainBody.render.sprite.yOffset = .80;

        this
        .setExistingBody(mainBody)
        .setFixedRotation() 
        .setIgnoreGravity(true);  
    }
}