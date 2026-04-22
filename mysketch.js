/*
Copyright (C) 2026 Truong Nguyen Kieu My
*/

let nodes = [];
let bokehParticles = [];
let pulses = [];
let hubs = []; 
let activeSharingHubs = []; 

// State and UI
let appState = "INTRO"; 
let introAlpha = 255;
let artAlpha = 0;
let homeHover = false;
let nextHover = false; 

let sliderSpeed = 0.5;    
let sliderStrength = 0.4; 
let activeSlider = null;  

let introStage = 1; 
let targetY, slideY; 
let morphAlpha = 255;

const HUB_COUNT = 6; 
let homeImg; 
let headerImg;

const MARGIN_X = 280; 
const THEME_GREEN = '#2FE197';

function preload() {
  headerImg = loadImage('header.png');
}

function preload() {
  headerImg = loadImage('header.png');
  homeImg = loadImage('house.png'); // Correctly loads the home button image
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  targetY = height / 2;
  slideY = targetY; 

  for (let i = 0; i < 5; i++) {
    bokehParticles.push(new Bokeh());
  }

  let cols = 3; let rows = 2;
  let availableWidth = width - MARGIN_X - 120; 
  let cellW = availableWidth / cols;
  let cellH = height / rows;

  for (let i = 0; i < HUB_COUNT; i++) {
    let col = i % cols;
    let row = floor(i / cols);
    let x = MARGIN_X + cellW * col + random(cellW * 0.2, cellW * 0.8);
    let y = cellH * row + random(cellH * 0.2, cellH * 0.8);
    
    let hubNode = new Node(x, y, 35, 'hub', true);
    hubs.push(hubNode);
    nodes.push(hubNode);
  }

  for (let i = 0; i < hubs.length; i++) {
    let currentHub = hubs[i];
    let nextHub = hubs[(i + 1) % hubs.length]; 

    let petalsToCreate = 10;
    let attempts = 0;
    while (nodes.filter(n => n.parents.includes(currentHub)).length < petalsToCreate && attempts < 800) {
      let angle = random(TWO_PI);
      let d = random(80, 240); 
      let x = constrain(currentHub.pos.x + cos(angle) * d, MARGIN_X + 30, width - 40);
      let y = constrain(currentHub.pos.y + sin(angle) * d, 60, height - 160);
      
      let tooClose = false;
      for (let other of nodes) {
        if (dist(x, y, other.pos.x, other.pos.y) < 40) tooClose = true;
      }
      
      let dToLine = distToSegment(createVector(x, y), currentHub.pos, nextHub.pos);
      if (!tooClose && dToLine > 50) { 
        let petal = new Node(x, y, 16, 'ldc', false);
        petal.parents.push(currentHub);
        nodes.push(petal);
      }
      attempts++;
    }

    if (random(1) > 0.6) {
      let mx = lerp(currentHub.pos.x, nextHub.pos.x, 0.5);
      let my = lerp(currentHub.pos.y, nextHub.pos.y, 0.5);
      let bridgeNode = new Node(mx, my, 18, 'ldc', false);
      bridgeNode.parents.push(currentHub);
      bridgeNode.parents.push(nextHub);
      nodes.push(bridgeNode);
    }
  }
}

function draw() {
  background(4, 6, 12); 
  if (appState === "INTRO") { drawIntro(); } 
  else {
    drawArt(); 
    autoTriggerPulses();
    drawCinematicBars(); 
    drawHeaderImage();
    drawHUDSlider(70, height/2 - 150, sliderSpeed, "Speed", 1);
    drawHUDSlider(70, height/2 + 150, sliderStrength, "Solutions &\nExperience", 2);
    drawNextLink(); 
  }
  drawHomeButton(); 
}

function drawArt() {
  if (artAlpha < 255) artAlpha += 5;
  push();
  drawingContext.globalAlpha = artAlpha / 255;
  
  blendMode(BLEND);
  nodes.forEach(n => {
    n.parents.forEach(p => {
      let edgeAlpha = n.completion > 0.4 ? 100 : 30; 
      stroke(47, 225, 151, edgeAlpha); strokeWeight(1);
      drawingContext.setLineDash([2, 6]); line(p.pos.x, p.pos.y, n.pos.x, n.pos.y);
      drawingContext.setLineDash([]); 
    });
  });

  blendMode(ADD);
  noStroke(); 
  bokehParticles.forEach(b => { b.update(); b.display(); });
  
  for (let i = pulses.length - 1; i >= 0; i--) {
    pulses[i].update(); pulses[i].display();
    if (pulses[i].isFinished) pulses.splice(i, 1);
  }

  blendMode(BLEND);
  nodes.forEach(n => {
    n.update();
    n.display(); 
    n.drawV();    
  });
  pop();
}

function drawHeaderImage() {
  if (headerImg && artAlpha > 0) {
    push();
    imageMode(CENTER);
    drawingContext.globalAlpha = artAlpha / 255;
    image(headerImg, width / 2, 75);
    pop();
  }
}

class Bokeh {
  constructor() {
    this.anchorX = random(width); this.anchorY = random(height);
    this.col = color(random(['#2FE197', '#5175B9', '#ffffff']));
    this.size = random(120, 280); this.baseOpacity = 0.08; 
    this.x = this.anchorX; this.y = this.anchorY;
    this.offX = random(1000); this.offY = random(1000);
  }
  update() {
    this.x = this.anchorX + sin(frameCount * 0.002 + this.offX) * 40;
    this.y = this.anchorY + cos(frameCount * 0.002 + this.offY) * 40;
  }
  display() {
    let r = red(this.col); let g = green(this.col); let b = blue(this.col);
    let grad = drawingContext.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
    grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${this.baseOpacity})`);
    grad.addColorStop(0.8, `rgba(${r}, ${g}, ${b}, 0.02)`); 
    grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    drawingContext.fillStyle = grad; circle(this.x, this.y, this.size * 2);
  }
}

class Node {
  constructor(x, y, size, type, isComplete) {
    this.anchor = createVector(x, y);
    this.pos = createVector(x, y);
    this.size = size; this.type = type;
    this.completion = isComplete ? 1 : 0; 
    this.noiseOffsetX = random(1000); this.noiseOffsetY = random(2000);
    this.parents = []; this.col = color(THEME_GREEN);
  }
  update() {
    let jitter = (this.type === 'hub' || this.completion >= 1) ? 1.2 : 4;
    this.pos.x = this.anchor.x + map(noise(this.noiseOffsetX), 0, 1, -jitter, jitter);
    this.pos.y = this.anchor.y + map(noise(this.noiseOffsetY), 0, 1, -jitter, jitter);
    this.noiseOffsetX += 0.01; this.noiseOffsetY += 0.01;
  }
  drawV() {
    push(); translate(this.pos.x, this.pos.y);
    stroke(red(this.col), green(this.col), blue(this.col), this.completion > 0.4 ? 255 : 120);
    strokeWeight(this.completion >= 1 ? 2.5 : 1.2); noFill();
    let r = this.size * 0.5;
    let p0 = {x: 0, y: -r}; let p1 = {x: -r * 0.86, y: r * 0.5}; let p2 = {x: r * 0.86, y: r * 0.5};
    
    beginShape();
    vertex(p0.x, p0.y); vertex(p1.x, p1.y); vertex(p2.x, p2.y); 
    if (this.completion > 0) {
        vertex(lerp(p2.x, p0.x, this.completion), lerp(p2.y, p0.y, this.completion));
    }
    if (this.completion >= 1) endShape(CLOSE); else endShape();
    
    fill(255); noStroke();
    let ds = this.completion >= 1 ? 4 : 2;
    ellipse(p0.x, p0.y, ds, ds); ellipse(p1.x, p1.y, ds, ds); ellipse(p2.x, p2.y, ds, ds);
    pop();
  }
  receiveEnergy() {
    if (this.completion < 1) {
        this.completion += random(0.04, 0.07);
        this.completion = constrain(this.completion, 0, 1);
    }
  }
  display() {
    if (this.type === 'hub') {
      let isSharing = activeSharingHubs.includes(this);
      let blurSize = this.size * 2.8; 
      let blurAlpha = isSharing ? 0.18 : 0.1;

      let grad = drawingContext.createRadialGradient(this.pos.x, this.pos.y, 0, this.pos.x, this.pos.y, blurSize);
      grad.addColorStop(0, `rgba(47, 225, 151, ${blurAlpha})`);
      grad.addColorStop(1, `rgba(0,0,0,0)`);
      drawingContext.fillStyle = grad; noStroke(); circle(this.pos.x, this.pos.y, blurSize * 2);
    } else if (this.completion >= 1) {
      let glowR = this.size * 1.5;
      let grad = drawingContext.createRadialGradient(this.pos.x, this.pos.y, 0, this.pos.x, this.pos.y, glowR);
      grad.addColorStop(0, `rgba(47, 225, 151, 0.08)`); grad.addColorStop(1, `rgba(0,0,0,0)`);       
      drawingContext.fillStyle = grad; noStroke(); circle(this.pos.x, this.pos.y, glowR * 2);
    }
  }
}

function autoTriggerPulses() {
  let triggerInterval = map(pow(sliderSpeed, 2), 0, 1, 150, 5);
  if (frameCount % max(1, floor(triggerInterval)) === 0) {
    if (activeSharingHubs.length < floor(random(1, 3))) {
        let potential = hubs.filter(h => !activeSharingHubs.includes(h));
        if (potential.length > 0) activeSharingHubs.push(random(potential));
    }
    activeSharingHubs.forEach((hub, index) => {
        let targets = nodes.filter(n => n.parents.includes(hub));
        if (targets.length > 0) pulses.push(new RippleFlow(hub, random(targets), sliderStrength));
        if (random(1) > 0.985) activeSharingHubs.splice(index, 1);
    });
  }
}

class RippleFlow {
  constructor(start, target, strength) {
    this.startPos = createVector(start.pos.x, start.pos.y); this.target = target;
    this.progress = 0; this.speed = 0.012; this.isFinished = false; this.strength = strength;
  }
  update() { 
    this.progress += this.speed; 
    if (this.progress >= 1) { this.target.receiveEnergy(); this.isFinished = true; } 
  }
  display() {
    noStroke(); let dots = floor(map(this.strength, 0, 1, 15, 40));
    for (let i = 0; i < dots; i++) {
      let dotT = i / dots; if (dotT > this.progress) continue;
      let p = p5.Vector.lerp(this.startPos, this.target.pos, dotT);
      let waveScale = exp(-pow((dotT - this.progress) * 12, 2)); 
      fill(47, 225, 151, (120 + this.strength * 135) * waveScale); ellipse(p.x, p.y, 1 + waveScale * 4);
    }
  }
}

function distToSegment(p, v, w) {
  let l2 = pow(v.x - w.x, 2) + pow(v.y - w.y, 2);
  if (l2 == 0) return dist(p.x, p.y, v.x, v.y);
  let t = max(0, min(1, ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2));
  return dist(p.x, p.y, v.x + t * (w.x - v.x), v.y + t * (w.y - v.y));
}

function drawHUDSlider(x, y, val, label, id) {
  let h = 210, w = 32; // Matches reference dimensions
  if (mouseIsPressed && mouseX > x - w && mouseX < x + w && mouseY > y - h/2 && mouseY < y + h/2) activeSlider = id;
  if (activeSlider === id) {
    let newVal = map(mouseY, y + h/2, y - h/2, 0, 1);
    if (id === 1) sliderSpeed = constrain(newVal, 0, 1);
    if (id === 2) sliderStrength = constrain(newVal, 0, 1);
  }
  push(); translate(x, y); rectMode(CENTER); textAlign(CENTER, CENTER);
  
  // Font styling using Mulish as requested
  textFont("mulish-variable");
  drawingContext.font = `200 16px mulish-variable, sans-serif`;
  fill(255); 
  text(floor(val * 100) + "%", 0, -h/2 - 14); // Specific reference offset
  
  fill(0, 160); noStroke(); rect(0, 0, w, h, 16); 
  let segments = 20; // Matches reference count
  let segH = (h - 12) / segments;
  for(let i = 0; i < segments; i++) {
    fill(47, 225, 151, (i / (segments - 1) <= val) ? 255 : 140); 
    rect(0, h/2 - 6 - (i * segH) - segH/2, w - 10, segH - 2, 3);
  }
  fill(255, 210); 
  text(label, 0, h/2 + 20); // Specific reference offset
  pop();
}

function drawHomeButton() {
  let x = 54; let y = 40; let size = 32; // Exact coordinates and size from reference
  
  // Hover logic based on exact image coordinates
  homeHover = (mouseX > x && mouseX < x + size && mouseY > y && mouseY < y + size);
  
  push(); 
  if (homeHover) { 
    cursor(HAND); 
    tint(255); // Full brightness on hover
  } else { 
    tint(180); // Subtle dim when not hovering
  }
  
  // Draw the image exactly as defined in the reference
  if (homeImg) {
    image(homeImg, x, y, size, size); 
  }
  pop();
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
  stroke(47, 225, 151, nextHover ? 200 : 50); strokeWeight(2.5); line(0, 10, txtW, 10); pop();
}

function drawIntro() {
  textAlign(LEFT, CENTER); 
  
  // Title text: New Spirit
  textFont("new-spirit");
  drawingContext.font = `700 80px new-spirit, serif`;
  noStroke();
  
  let txtStage = "STAGE "; let content1 = "1: PROVIDE"; let content2 = "2: SHARE";
  let fullWidth = textWidth(txtStage) + textWidth(content2); let startX = (width / 2) - (fullWidth / 2);
  fill(255, introAlpha); text(txtStage, startX, targetY);
  let numX = startX + textWidth(txtStage); slideY = lerp(slideY, targetY, 0.1); 
  let currentContent = (introStage === 1) ? content1 : content2;
  fill(255, morphAlpha); text(currentContent, numX, slideY);
  if (frameCount > 100 && introStage === 1) { morphAlpha -= 15; if (morphAlpha <= 0) { introStage = 2; slideY = targetY - 60; } }
  if (introStage === 2) {
    morphAlpha = min(morphAlpha + 20, introAlpha); 
    if (frameCount > 240) { introAlpha -= 7; morphAlpha = introAlpha; if (introAlpha <= 0) appState = "ART"; }
  }
}

function drawCinematicBars() {
  let barH = 140; noStroke();
  let topGrad = drawingContext.createLinearGradient(0, 0, 0, barH);
  topGrad.addColorStop(0, 'rgba(0,0,0,1)'); topGrad.addColorStop(1, 'rgba(0,0,0,0)');
  drawingContext.fillStyle = topGrad; rect(0, 0, width, barH);
  let bottomGrad = drawingContext.createLinearGradient(0, height, 0, height - barH);
  bottomGrad.addColorStop(0, 'rgba(0,0,0,1)'); bottomGrad.addColorStop(1, 'rgba(0,0,0,0)');
  drawingContext.fillStyle = bottomGrad; rect(0, height - barH, width, barH);
}

function mouseReleased() { activeSlider = null; }
function mousePressed() { if (homeHover) window.location.href = "index.html"; if (nextHover) window.location.href = "chau.html"; }
function windowResized() { resizeCanvas(windowWidth, windowHeight); targetY = height / 2; }