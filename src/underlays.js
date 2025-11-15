import { dom } from "./util";

// moving grid effect on grid underlay
const maxGridSpeed = 4; // tested experimentally
window.addEventListener("mousemove", event => {
	let w = window.innerWidth, h = window.innerHeight;
	let dx = event.clientX - (w / 2), dy = event.clientY - (h / 2);
	let scale = maxGridSpeed / (Math.max(w, h) / 2);
	document.documentElement.style.setProperty("--grid-speed-x", dx);
	document.documentElement.style.setProperty("--grid-speed-y", dy);
	document.documentElement.style.setProperty("--grid-animation-duration", (1 / scale) + "s");
});

// lightspeed canvas underlay
const lightspeedCanvas = dom.lightspeedCanvas;
const lightspeedCtx = lightspeedCanvas.getContext("2d");
lightspeedCanvas.width = window.innerWidth;
lightspeedCanvas.height = window.innerHeight;

let stars = [];
const numStars = 200;

class Star {
    constructor () {
		this.isFirstTime = true; // add extra delay on first time
        this.reset();
    }

    update () {
		let now = Date.now();
		if (now < this.start) return;
		
        this.velocity += this.acceleration;
        this.prevX = this.x;
        this.prevY = this.y;
        this.x += Math.cos(this.angle) * this.velocity;
        this.y += Math.sin(this.angle) * this.velocity;

        if ((this.x < 0) || (this.x > lightspeedCanvas.width) || (this.y < 0) || (this.y > lightspeedCanvas.height)) {
            this.reset();
        }
    }

    draw () {
		let now = Date.now();
		if (now < this.start) return;
		
        lightspeedCtx.beginPath();
        lightspeedCtx.moveTo(this.prevX, this.prevY);
        lightspeedCtx.lineTo(this.x, this.y);
        lightspeedCtx.strokeStyle = `rgba(255, 255, 255, ${Math.min(1, (now - this.start) / 2000)})`; // 2 seconds to full brightness
        lightspeedCtx.lineWidth = this.radius;
        lightspeedCtx.stroke();
    }

    reset () {
        this.x = (lightspeedCanvas.width * 3 / 8) + (Math.random() * lightspeedCanvas.width / 4);
        this.y = (lightspeedCanvas.height * 3 / 8) + (Math.random() * lightspeedCanvas.height / 4);
		this.angle = Math.atan2(this.y - lightspeedCanvas.height / 2, this.x - lightspeedCanvas.width / 2); // direction away from center
        this.radius = Math.random() * 2 + 0.5;
        this.velocity = 0;
        this.prevX = this.x;
        this.prevY = this.y;
		this.acceleration = 0.03 + Math.random() * 0.05;
		
		// random delay (extra delay on first appearance)
		if (this.isFirstTime) this.start = Date.now() + Math.floor(Math.random() * 5000);
		else this.start = Date.now() + Math.floor(Math.random() * 1000);
		this.isFirstTime = false;
    }
}

function resetStars () {
	stars = new Array(numStars).fill(0).map(_ => new Star());
}

window.addEventListener("resize", _ => {
    lightspeedCanvas.width = window.innerWidth;
    lightspeedCanvas.height = window.innerHeight;
    resetStars();
});
resetStars();

function animateStars () {
    lightspeedCtx.fillStyle = "rgba(0, 0, 0, 0.3)";
    lightspeedCtx.fillRect(0, 0, lightspeedCanvas.width, lightspeedCanvas.height);

    stars.forEach(star => {
        star.update();
        star.draw();
    });

    requestAnimationFrame(animateStars);
}
animateStars();
