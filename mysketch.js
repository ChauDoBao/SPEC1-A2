/*
Copyright (C) 2026 Truong Nguyen Kieu My

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or 
(at your option) any later version.

Reference: 
Processing Foundation 2023, p5.js: A JavaScript library for creative coding, viewed 26 March 2026, https://p5js.org/

Google n.d., Google AI Studio [large language model], Google, viewed 27 March 2026, https://aistudio.google.com/
*/

let nodes = [];
let bokehParticles = [];
let pulses = [];
let hubs = [];
let hubCycleTimer = 0;

// State and UI
let appState = "INTRO";
let introAlpha = 255;
let artAlpha = 0;
let homeHover = false;
let nextHover = false;
let soundHover = false; // NEW: Hover state for the sound button
let isMuted = false;    // NEW: Mute toggle state
let headerImg; 

let sliderSpeed = 0.5;
let sliderStrength = 0.5;
let activeSlider = null;

let introStage = 1;
let targetY, slideY;
let morphAlpha = 255;

const HUB_COUNT = 6;
const SPOKES_PER_HUB = 6;
let homeImg;

//sound
let clickSound;
let pulseSound;
let progressSound;
let completeSound;
let sliderUpSound;
let sliderDownSound;


function preload() {
  homeImg = loadImage('house.png'); 
  clickSound = loadSound("click(edited).wav"); 
  pulseSound = loadSound("resource-flow.wav"); 
  progressSound = loadSound("node-bloom.wav"); 
  completeSound = loadSound("small-triangle-completed(edited).wav"); 
  sliderUpSound = loadSound("slider-louder(edited).wav"); 
  sliderDownSound = loadSound("slider-quiter(edited).wav"); 
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  targetY = height / 2;
  slideY = targetY;

  for (let i = 0; i < 12; i++) {
    bokehParticles.push(new Bokeh());
  }

  // --- GENERATIVE TRIANGLE ARRANGEMENT ---
  // I first define 3 master corners pTop, pBottomLeft, pBottomRight at random coordinates within the screen.
  //Instead of manually placing 6 hubs, I used Linear Interpolation (lerp) to find the midpoints between those three corners. By this way I can create new type of triangle everytime user reload the page.

  let margin = 150;
  let centerX = width / 2;

  let pTop = createVector(
    centerX + random(-width * 0.1, width * 0.1),
    random(height * 0.1, height * 0.2)
  );
  let pBottomLeft = createVector(
    random(margin, centerX - width * 0.05),
    random(height * 0.6, height * 0.85)
  );
  let pBottomRight = createVector(
    random(centerX + width * 0.05, width - margin),
    random(height * 0.6, height * 0.85)
  );

  let hubPos = [
    pTop, // Hub 0
    p5.Vector.lerp(pTop, pBottomLeft, 0.5), // Hub 1
    p5.Vector.lerp(pTop, pBottomRight, 0.5), // Hub 2
    pBottomLeft, // Hub 3
    p5.Vector.lerp(pBottomLeft, pBottomRight, 0.5), // Hub 4
    pBottomRight, // Hub 5
  ];

  hubPos.forEach((pos) => {
    let hub = new Node(pos.x, pos.y, 75, "hub", true);
    hubs.push(hub);
    nodes.push(hub);
  });

  let pairs = [
    [0, 1],
    [0, 2],
    [1, 2],
    [1, 3],
    [1, 4],
    [2, 4],
    [2, 5],
    [3, 4],
    [4, 5],
  ];
  pairs.forEach((pair) => {
    let h1 = hubs[pair[0]];
    let h2 = hubs[pair[1]];
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 50) {
      let midX = (h1.anchor.x + h2.anchor.x) / 2 + random(-30, 30);
      let midY = (h1.anchor.y + h2.anchor.y) / 2 + random(-30, 30);
      if (!checkOverlap(midX, midY, 22)) {
        let shared = new Node(midX, midY, 22, "ldc", false);
        shared.parentHub = h1;
        shared.secondaryHub = h2;
        nodes.push(shared);
        placed = true;
      }
      attempts++;
    }
  });

  hubs.forEach((h) => {
    for (let i = 0; i < SPOKES_PER_HUB; i++) {
      let placed = false;
      let attempts = 0;
      // Fixed angle distribution for circular arrangement
      let angle = i * (TWO_PI / SPOKES_PER_HUB);
      while (!placed && attempts < 10) {
        // Narrowed distance range to make the circle shape clearer
        let d = 135 + random(-5, 5);
        let x = h.anchor.x + cos(angle) * d;
        let y = h.anchor.y + sin(angle) * d;
        if (!checkOverlap(x, y, 18)) {
          let petal = new Node(x, y, 18, "ldc", false);
          petal.parentHub = h;
          nodes.push(petal);
          placed = true;
        }
        attempts++;
      }
    }
  });
}

function checkOverlap(x, y, size) {
  let margin = 60;
  if (x < margin || x > width - margin || y < margin || y > height - margin)
    return true;
  for (let n of nodes) {
    let minAllowedDist = size / 2 + n.size / 2 + 25;
    if (dist(x, y, n.anchor.x, n.anchor.y) < minAllowedDist) return true;
  }
  return false;
}

function draw() {
  background(4, 6, 12);
  if (appState === "INTRO") {
    drawIntro();
  } else {
    manageHubActivity();
    drawArt();
    autoTriggerPulses();
    drawCinematicBars();
    drawHUDSlider(70, height / 2 - 150, sliderSpeed, "Speed", 1);
    drawHUDSlider(
      70,
      height / 2 + 150,
      sliderStrength,
      "Solutions &\nExperience",
      2
    );
    drawNextLink();
  }
  drawHomeButton();
  drawSoundButton(); // NEW: Draw the mute button
}

function drawArt() {
  if (artAlpha < 255) artAlpha += 5;
  push();
  drawingContext.globalAlpha = artAlpha / 255;
  blendMode(ADD);
  bokehParticles.forEach((b) => {
    b.update();
    b.display();
  });
  blendMode(BLEND);

  //By default, p5.js does not have a function to draw dotted lines so I use HTML5 Canvas API drawingContext.setLineDash to draw 3 pixels of white line, then leave a gap of 6 pixels.
  //I didn't use a solid white. I used lerp(10, 100, n.powerLevel). This means as a small triangle receives energy and its "Power Level" rises, the dotted line connecting it to the big triangle physically brightens from 10% to 100%.
  nodes.forEach((n) => {
    strokeWeight(1);
    if (n.parentHub) {
      drawingContext.setLineDash([3, 6]);
      stroke(255, lerp(10, 100, n.powerLevel));
      line(n.parentHub.pos.x, n.parentHub.pos.y, n.pos.x, n.pos.y);
    }
    if (n.secondaryHub) {
      drawingContext.setLineDash([3, 6]);
      stroke(255, lerp(10, 100, n.powerLevel));
      line(n.secondaryHub.pos.x, n.secondaryHub.pos.y, n.pos.x, n.pos.y);
    }
    drawingContext.setLineDash([]);
  });
  blendMode(ADD);
  for (let i = pulses.length - 1; i >= 0; i--) {
    pulses[i].update();
    pulses[i].display();
    if (pulses[i].isFinished) pulses.splice(i, 1);
  }
  blendMode(BLEND);
  nodes.forEach((n) => {
    n.update();
    n.display();
    n.drawV();
  });
  pop();
}

//To ensure the screen isn't overwhelmed. This function shuffles the list of hubs and picks only 2 or 3 to be active.

function manageHubActivity() {
  if (millis() > hubCycleTimer) {
    hubs.forEach((h) => (h.isActiveSharing = false));
    let count = random([2, 3]);
    let shuffled = shuffle([...hubs]);
    for (let i = 0; i < count; i++) {
      shuffled[i].isActiveSharing = true;
    }
    hubCycleTimer = millis() + random(3000, 5000);
  }
}



class Node {
  constructor(x, y, size, type, isComplete) {
    this.anchor = createVector(x, y);
    this.pos = createVector(x, y);
    this.size = size;
    this.type = type;
    this.isPowered = isComplete;
    this.completionProgress = isComplete ? 1 : 0;
    this.powerLevel = isComplete ? 1 : 0;

    // PERLIN NOISE: I used unique offsets here so that every triangle has a slightly different "float" pattern, avoiding robotic movement.
    this.noiseOffsetX = random(1000);
    this.noiseOffsetY = random(2000);
    this.colorLerp = 0.0;
    this.parentHub = null;
    this.secondaryHub = null;
    this.isActiveSharing = false;
    this.glowFactor = 0;
  }

  //Jitter logic: Incomplete triangles jitter more (unstable), while powered triangles become steady (stable).
  update() {
    let jitter = this.isPowered ? 1.2 : 4;
    this.pos.x =
      this.anchor.x + map(noise(this.noiseOffsetX), 0, 1, -jitter, jitter);
    this.pos.y =
      this.anchor.y + map(noise(this.noiseOffsetY), 0, 1, -jitter, jitter);
    this.noiseOffsetX += 0.01;
    this.noiseOffsetY += 0.01;

    let targetGlow = this.isActiveSharing ? 0.5 : 0;
    this.glowFactor = lerp(this.glowFactor, targetGlow, 0.05);

    if (this.isPowered) {
      this.powerLevel = lerp(this.powerLevel, 1, 0.05);
      this.colorLerp = lerp(this.colorLerp, 1.0, 0.02);
    }
  }

  receiveEnergy(amount) {
    if (this.completionProgress < 1.0) {
      this.completionProgress += amount; // add a small "bit" of progress
      
      if (progressSound && progressSound.isLoaded()) {
        progressSound.setVolume(0.3);
        progressSound.play();
      }
      
      if (this.completionProgress >= 1.0) {
        this.completionProgress = 1.0;
        this.powerUp();
      }
    }
  }
  // I defined three vertices (p0,p1,p2).  The lines from p0 -> p1 and p0 -> p2 are always drawn.
  // The bottom side p1 -> p2 is the "completion" side. I used the (lerp) to draw a partial line based on 'completionProgress' variable (0.0 to 1.0) to calculate a temporary coordinate
  // When energy is received, completionProgress increases. The line physically extends across the bottom until it hits p2 and closes the shape.
  drawV() {
    push();
    translate(this.pos.x, this.pos.y);
    let baseColor =
      this.type === "hub"
        ? color("#2FE197")
        : lerpColor(color(255), color("#98FB98"), this.colorLerp);
    let alpha = map(this.completionProgress, 0, 1, 100, 255);
    stroke(red(baseColor), green(baseColor), blue(baseColor), alpha);

    strokeWeight(1.5);
    noFill();

    let r = this.size * 0.5;
    let p0 = { x: 0, y: -r };
    let p1 = { x: -r * 0.86, y: r * 0.5 };
    let p2 = { x: r * 0.86, y: r * 0.5 };

    line(p0.x, p0.y, p1.x, p1.y);
    line(p0.x, p0.y, p2.x, p2.y);

    if (this.completionProgress > 0) {
      let endX = lerp(p1.x, p2.x, this.completionProgress);
      let endY = lerp(p1.y, p2.y, this.completionProgress);
      line(p1.x, p1.y, endX, endY);
    }

    fill(255);
    noStroke();
    let ds = this.isPowered ? 5 : 2.5;
    ellipse(p0.x, p0.y, ds, ds);
    ellipse(p1.x, p1.y, ds, ds);
    ellipse(p2.x, p2.y, ds, ds);
    pop();
  }

  powerUp() {
    this.isPowered = true;
    if (completeSound && completeSound.isLoaded()) {
      // Randomize pitch slightly (between 0.9 and 1.1), so it doesn't sound repetitive
      let r = random(0.9, 1.1);
      completeSound.rate(r); 
      completeSound.setVolume(0.6); 
      completeSound.play();
    }
  }

  display() {
    if (this.isPowered) {
      let nodeColor = this.type === "hub" ? color("#2FE197") : color("#98FB98");

      let h_glowMult = 1;
      let h_opacity = 0.15;
      let p_glowMult = 1;
      let p_opacity = 0.15;

      let currentRadius, currentAlpha;

      if (this.type === "hub") {
        currentRadius = this.size * h_glowMult;
        currentAlpha = h_opacity;
      } else {
        currentRadius = this.size * p_glowMult * this.completionProgress;
        currentAlpha = p_opacity * this.completionProgress;
      }

      // I used createRadialGradient to create a blur below each medium triangles
      let grad = drawingContext.createRadialGradient(
        this.pos.x,
        this.pos.y,
        0,
        this.pos.x,
        this.pos.y,
        currentRadius
      );
      // I define a center point and a radius. I then add "Color Stops."
      //Stop 0 is the center (Color + Opacity). Stop 0.5 is the mid-glow. Stop 1 is completely transparent.
      grad.addColorStop(
        0,
        `rgba(${red(nodeColor)}, ${green(nodeColor)}, ${blue(
          nodeColor
        )}, ${currentAlpha})`
      );
      grad.addColorStop(
        0.5,
        `rgba(${red(nodeColor)}, ${green(nodeColor)}, ${blue(nodeColor)}, ${
          currentAlpha * 0.3
        })`
      );
      grad.addColorStop(1, `rgba(0,0,0,0)`);
      drawingContext.fillStyle = grad;
      noStroke();
      circle(this.pos.x, this.pos.y, currentRadius * 2);
    }
  }
}

function drawIntro() {
  textAlign(LEFT, CENTER);
  
  textFont("new-spirit");
  drawingContext.font = `700 80px new-spirit, serif`;
  
  noStroke();
  let txtStage = "STAGE ";
  let content1 = "1: PROVIDE",
    content2 = "2: SHARE";
  let fullWidth = textWidth(txtStage) + textWidth(content2);
  let startX = width / 2 - fullWidth / 2;
  fill(255, introAlpha);
  text(txtStage, startX, targetY);
  let numX = startX + textWidth(txtStage);
  slideY = lerp(slideY, targetY, 0.1);
  let currentContent = introStage === 1 ? content1 : content2;
  fill(255, morphAlpha);
  text(currentContent, numX, slideY);
  if (frameCount > 80 && introStage === 1) {
    morphAlpha -= 15;
    if (morphAlpha <= 0) {
      introStage = 2;
      slideY = targetY - 60;
    }
  }
  if (introStage === 2) {
    morphAlpha = min(morphAlpha + 20, introAlpha);
    if (frameCount > 180) {
      introAlpha -= 7;
      morphAlpha = introAlpha;
      if (introAlpha <= 0) appState = "ART";
    }
  }
}

function drawHomeButton() {
  let x = 54,
    y = 40,
    size = 30;
  homeHover =
    mouseX > x && mouseX < x + size && mouseY > y && mouseY < y + size;
  push();
  if (homeHover) {
    cursor(HAND);
    tint(255);
  } else tint(180);
  if (homeImg) image(homeImg, x, y, size, size);
  pop();
}

// --- NEW SOUND BUTTON ---
function drawSoundButton() {
  let size = 30; // Match the home button size
  let x = width - 54 - size; // Mirrored padding from the right
  let y = 40; // Perfectly aligned with the home button's Y coordinate
  
  soundHover = mouseX > x && mouseX < x + size && mouseY > y && mouseY < y + size;

  push();
  // Translate to the center of the button area
  translate(x + size / 2, y + size / 2); 
  
  if (soundHover) {
    cursor(HAND);
  }
  
  let iconColor = soundHover ? color(255) : color(180);
  
  // 1. Draw Speaker Body (Solid, no stroke for crisp edges)
  noStroke();
  fill(iconColor);
  rect(-8, -4, 4, 8); // Base rectangle
  quad(-4, -4, -4, 4, 4, 8, 4, -8); // Fixed: Flared speaker cone (was 'triangle' before)
  
  // 2. Draw Waves or 'X' based on mute state
  noFill();
  stroke(iconColor);
  strokeWeight(2);
  strokeCap(ROUND); // Makes the ends of the lines/arcs softly rounded
  
  if (!isMuted) {
    // Sound Waves
    arc(5, 0, 8, 12, -PI/3, PI/3);
    arc(5, 0, 16, 20, -PI/3, PI/3);
  } else {
    // Muted 'X'
    line(8, -4, 14, 4);
    line(14, -4, 8, 4);
  }
  
  pop();
}

function drawHUDSlider(x, y, val, label, id) {
  let h = 200; 
  let w = 40;  
  let activeColor = color("#2FE197"); 

  if (mouseIsPressed &&
      mouseX > x - w/2 && mouseX < x + w/2 &&
      mouseY > y - h/2 && mouseY < y + h/2) {
    activeSlider = id;
  }

  if (activeSlider === id) {
    let prevVal = val; 
    let rawVal = map(mouseY, y + h/2, y - h/2, 0, 1);

    let snappedVal = round(constrain(rawVal, 0, 1) * 10) / 10;
    if (snappedVal > prevVal) {
      if (sliderUpSound && sliderUpSound.isLoaded()) {
        sliderUpSound.rate(map(snappedVal, 0, 1, 1, 1.5)); 
        sliderUpSound.setVolume(map(snappedVal, 0, 1, 0.5, 0.9));
        sliderUpSound.play();
      }
    } 
    else if (snappedVal < prevVal) {
      if (sliderDownSound && sliderDownSound.isLoaded()) {
        sliderDownSound.rate(map(snappedVal, 0, 1, 0.5, 0.9)); 
        sliderDownSound.setVolume(map(snappedVal, 0, 1, 0.5, 0.9));
        sliderDownSound.play();
      }
    }
    
    if (id === 1) sliderSpeed = snappedVal;
    if (id === 2) sliderStrength = snappedVal;
  }

  push();
  translate(x, y);

  textFont("mulish-variable");
  drawingContext.font = `200 16px mulish-variable, sans-serif`;

  // --- PERCENTAGE TEXT (Top) ---
  textAlign(CENTER, CENTER);
  fill(255);
  text(floor(val * 100) + "%", 0, -h / 2 - 25);

  // --- DRAW THE LINES ---
  strokeWeight(2);
  stroke(255, 40);
  line(0, -h/2, 0, h/2);
  let currentY = map(val, 0, 1, h/2, -h/2);
  stroke(activeColor);
  line(0, h/2, 0, currentY);
  
  noStroke();
  for (let i = 0; i <= 10; i++) {
    let nodeY = map(i, 0, 10, h/2, -h/2);
    let nodePct = i / 10;

    if (nodePct <= val + 0.01) {
      fill(activeColor);
    } else {
      fill(255, 100); 
    }
    circle(0, nodeY, 6);
  }

  // --- DRAW THE MOVABLE BIG CIRCLE (Indicator) ---
  fill(activeColor);
  drawingContext.shadowBlur = 15;
  drawingContext.shadowColor = activeColor;
  circle(0, currentY, 13); 
  drawingContext.shadowBlur = 0;

  // --- LABEL (Bottom) ---
  fill(255, 200);
  text(label, 0, h / 2 + 26);
  
  pop();
}

function autoTriggerPulses() {
  let triggerInterval = map(pow(sliderSpeed, 2), 0, 1, 150, 5);
  if (frameCount % max(1, floor(triggerInterval)) === 0) {
    let activeHubs = hubs.filter((h) => h.isActiveSharing);
    if (activeHubs.length > 0) {
      let randomHub = random(activeHubs);
      
      let panning = map(randomHub.pos.x, 0, width, -1.0, 1.0);
      if (pulseSound && pulseSound.isLoaded()) {
        pulseSound.pan(panning); 
        pulseSound.setVolume(0.2); 
        pulseSound.play();
      }
      
      let myPetals = nodes.filter((n) => n.parentHub === randomHub);
      if (myPetals.length > 0) {
        let qty = floor(map(sliderStrength, 0, 1, 1, myPetals.length));
        for (let i = 0; i < qty; i++) {
          pulses.push(
            new RippleFlow(randomHub, random(myPetals), sliderStrength)
          );
        }
      }
    }
  }
}

function mousePressed() {
  if (getAudioContext().state !== 'running') {
    userStartAudio();
  }

  // NEW: Sound toggle logic
  if (soundHover) {
    isMuted = !isMuted;
    if (isMuted) {
      outputVolume(0); // Instantly silences all p5.sound output
    } else {
      outputVolume(1); // Restores master volume
    }
    return; // Exit early so clicking this doesn't trigger the clickSound
  }

  if (clickSound && clickSound.isLoaded() && !isMuted) {
    clickSound.play();
  }
  
  if (homeHover) window.location.href = "index.html";
  if (nextHover) window.location.href = "chau.html";
}

function mouseReleased() {
  activeSlider = null;
}

class Bokeh {
  constructor() {
    this.anchorX = random(width);
    this.anchorY = random(height);
    this.x = this.anchorX;
    this.y = this.anchorY;
    this.size = random(120, 320);
    this.col = random(["#FF3C3C", "#5175B9", "#ffffff"]); 
    this.offX = random(1000);
    this.offY = random(1000);
  }
  update() {
    this.x = this.anchorX + sin(frameCount * 0.008 + this.offX) * 40;
    this.y = this.anchorY + cos(frameCount * 0.008 + this.offY) * 40;
  }
  display() {
    let c = color(this.col);
    let grad = drawingContext.createRadialGradient(
      this.x, this.y, 0, this.x, this.y, this.size
    );
    grad.addColorStop(0, `rgba(${red(c)}, ${green(c)}, ${blue(c)}, 0.08)`);
    grad.addColorStop(1, `rgba(0,0,0,0)`);
    drawingContext.fillStyle = grad;
    circle(this.x, this.y, this.size * 2);
  }
}

class RippleFlow {
  constructor(start, target, strength) {
    this.startPos = createVector(start.pos.x, start.pos.y);
    this.target = target;
    this.progress = 0;
    this.speed = 0.015;
    this.isFinished = false;
    this.strength = strength;
  }
  update() {
    this.progress += this.speed;
    if (this.progress >= 1) {
      this.target.receiveEnergy(map(this.strength, 0, 1, 0.005, 0.02)); 
      this.isFinished = true;
    }
  }

  display() {
    noStroke();
    let dots = floor(map(this.strength, 0, 1, 15, 40));
    for (let i = 0; i < dots; i++) {
      let dotT = i / dots;
      if (dotT > this.progress) continue;
      let p = p5.Vector.lerp(this.startPos, this.target.pos, dotT);
      let waveScale = exp(-pow((dotT - this.progress) * 12, 2));
      fill(255, 180 * waveScale);
      ellipse(p.x, p.y, 1.5 + waveScale * 3.5);
    }
  }
}

function drawCinematicBars() {
  let barH = 150; noStroke();
  let topGrad = drawingContext.createLinearGradient(0, 0, 0, barH);
  topGrad.addColorStop(0, 'rgba(0,0,0,1)'); topGrad.addColorStop(1, 'rgba(0,0,0,0)');
  drawingContext.fillStyle = topGrad; rect(0, 0, width, barH);
  let bottomGrad = drawingContext.createLinearGradient(0, height, 0, height - barH);
  bottomGrad.addColorStop(0, 'rgba(0,0,0,1)'); bottomGrad.addColorStop(1, 'rgba(0,0,0,0)');
  drawingContext.fillStyle = bottomGrad; rect(0, height - barH, width, barH);
}

function drawNextLink() {
let label = "Next Stage >>"; textSize(16); let txtW = textWidth(label);
  let x = width - 60; let y = height - 85;
  textFont("mulish-variable");
  drawingContext.font = `200 16px mulish-variable, sans-serif`;
  txtW = textWidth(label); x -= txtW; 
  nextHover = (mouseX > x - 25 && mouseX < width && mouseY > y - 45 && mouseY < height);
  push(); translate(x, y); textAlign(LEFT, BASELINE);
  if (nextHover) { cursor(HAND); drawingContext.shadowBlur = 18; drawingContext.shadowColor = 'rgba(255, 255, 255, 0.8)'; }
  fill(nextHover ? 255 : 150); text(label, 0, 0);
  stroke(47, 255, 151, nextHover ? 255 : 140); strokeWeight(2.5); line(0, 10, txtW, 10); pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  targetY = height / 2;
}
