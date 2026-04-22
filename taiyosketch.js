/*
Copyright (C) 2026 Truong Nguyen Kieu My
*/

// --- 1. GLOBAL ARRAYS ---
let nodes = []; 
let edges = []; 
let faces = []; 
let pulses = []; 
let bokehParticles = []; 

// --- 2. STATE & UI VARIABLES ---
let appState = "INTRO"; 
let artAlpha = 0;
let homeHover = false;
let nextHover = false; 
let introAlpha = 255;
let introStage = 1; 
let targetY, slideY; 
let morphAlpha = 255;
let activeSlider = null;

let sliderSpeed = 0.5;    
let sliderStrength = 0.4; 

const rows = 6;  
let centerX;
let connectionDistance = 160; 

let headerImg;
let homeImg; // Variable for house icon


function preload() {
  headerImg = loadImage('header.png');
  homeImg = loadImage('house.png'); // Loading the house icon
}

function setup() {
  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.parent('canvas-container'); 

  centerX = width * 0.5;
  targetY = height / 2;
  slideY = targetY; 
  
  bokehParticles = [];
  for (let i = 0; i < 12; i++) {
    bokehParticles.push({
      x: random(width),
      y: random(height),
      anchorX: random(width),
      anchorY: random(height),
      size: random(150, 300),
      col: random(['#5175B9', '#ffffff', '#8faadc']), 
      phaseX: random(TWO_PI),
      phaseY: random(TWO_PI),
      speedX: random(0.001, 0.004),
      speedY: random(0.001, 0.004),
      driftRange: random(40, 80)
    });
  }

  initNetwork();
}

function draw() {
  background(4, 6, 12); 

  if (appState === "INTRO") { 
    drawIntro(); 
  } 
  else if (appState === "ART") {
    drawArt(); 
    autoTriggerPulses(); 
    drawCinematicBars(); 
    drawHeaderImage(); 
    
    drawHUDSlider(70, height/2 - 150, sliderSpeed, "Speed", 1);
    drawHUDSlider(70, height/2 + 150, sliderStrength, "Quantity", 2); 
    
    drawNextLink(); 
  }
  
  if (appState !== "INTRO") {
    drawHomeButton(); // Draws icon-based button
  }
}

// ... (initNetwork and drawArt stay the same)

function initNetwork() {
  nodes = []; edges = []; faces = [];
  for (let r = 0; r < rows; r++) {
    let y = map(r, 0, rows - 1, height * 0.22, height * 0.9);
    let nodesInRow = r + 2; 
    let rowWidth = map(r, 0, rows - 1, width * 0.1, width * 0.9);
    
    for (let i = 0; i < nodesInRow; i++) {
      let x = map(i, 0, nodesInRow - 1, centerX - rowWidth/2, centerX + rowWidth/2);
      let nodeType = (r === 0) ? 'developed' : (r === 1 ? 'developing' : 'ldc');
      let isComplete = (r <= 1); 
      let size = (r === 0) ? 60 : (r === 1 ? 35 : 18); 
      nodes.push(new Node(x, y, size, nodeType, isComplete, r));
    }
  }

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      let d = dist(nodes[i].anchor.x, nodes[i].anchor.y, nodes[j].anchor.x, nodes[j].anchor.y);
      if (d < connectionDistance) {
        edges.push({ a: nodes[i], b: nodes[j] });
        for (let k = j + 1; k < nodes.length; k++) {
          let d2 = dist(nodes[i].anchor.x, nodes[i].anchor.y, nodes[k].anchor.x, nodes[k].anchor.y);
          let d3 = dist(nodes[j].anchor.x, nodes[j].anchor.y, nodes[k].anchor.x, nodes[k].anchor.y);
          if (d2 < connectionDistance && d3 < connectionDistance) {
            faces.push({ a: nodes[i], b: nodes[j], c: nodes[k] });
          }
        }
      }
    }
  }
}

function drawArt() {
  if (artAlpha < 255) artAlpha += 5;
  push();
  drawingContext.globalAlpha = artAlpha / 255;

  blendMode(ADD);
  noStroke();
  for (let b of bokehParticles) {
    b.x = b.anchorX + sin(frameCount * b.speedX + b.phaseX) * b.driftRange;
    b.y = b.anchorY + cos(frameCount * b.speedY + b.phaseY) * b.driftRange;
    drawSoftCircle(b.x, b.y, b.size, b.col);
  }

  blendMode(BLEND);
  for (let f of faces) {
    let facePower = min(f.a.powerLevel, min(f.b.powerLevel, f.c.powerLevel));
    if (facePower > 0) {
      let c = lerpColor(color(255), color(81, 117, 185), f.a.colorLerp);
      c.setAlpha(120 * facePower);
      fill(c); 
      triangle(f.a.pos.x, f.a.pos.y, f.b.pos.x, f.b.pos.y, f.c.pos.x, f.c.pos.y);
    }
  }

  for (let e of edges) {
    let edgePower = min(e.a.powerLevel, e.b.powerLevel);
    let alpha = lerp(30, 180, edgePower);
    strokeWeight(1);
    stroke(255, alpha); 
    drawingContext.setLineDash([2, 5]); 
    line(e.a.pos.x, e.a.pos.y, e.b.pos.x, e.b.pos.y);
    drawingContext.setLineDash([]); 
  }

  blendMode(ADD);
  for (let i = pulses.length - 1; i >= 0; i--) {
    pulses[i].update();
    pulses[i].display();
    if (pulses[i].isFinished) pulses.splice(i, 1);
  }
  
  for (let node of nodes) {
    node.update();
    node.display();
    node.drawV();
  }
  pop();
}

function autoTriggerPulses() {
  let interval = map(pow(sliderStrength, 2), 0, 1, 160, 5); 
  if (frameCount % max(1, floor(interval)) === 0) {
    let sources = nodes.filter(n => n.row === 0);
    if (sources.length > 0) {
      let src = random(sources);
      let targets = nodes.filter(n => n.row === 1 && dist(n.pos.x, n.pos.y, src.pos.x, src.pos.y) < connectionDistance * 2);
      if (targets.length > 0) {
        pulses.push(new RippleFlow(src, random(targets), true));
      }
    }
  }
}

// ... (Node and RippleFlow classes stay the same)

class Node {
  constructor(x, y, size, type, isComplete, row) {
    this.anchor = createVector(x, y);
    this.pos = createVector(x, y);
    this.baseSize = size;
    this.currentSize = size;
    this.type = type;
    this.row = row; 
    this.isPowered = isComplete;
    this.powerLevel = isComplete ? 1 : 0;
    this.noiseOffsetX = random(2000); 
    this.noiseOffsetY = random(4000);
    this.colorLerp = (type === 'developed') ? 1.0 : 0.0;
  }

  update() {
    let jitter = this.isPowered ? 1.5 : 8;
    this.pos.x = lerp(this.pos.x, this.anchor.x + map(noise(this.noiseOffsetX), 0, 1, -jitter, jitter), 0.08);
    this.pos.y = lerp(this.pos.y, this.anchor.y + map(noise(this.noiseOffsetY), 0, 1, -jitter, jitter), 0.08);
    this.noiseOffsetX += 0.01; this.noiseOffsetY += 0.01;

    if (this.type === 'developed') {
      let shrinkFactor = constrain(frameCount * 0.0005, 0, 0.6);
      this.currentSize = this.baseSize * (1 - shrinkFactor);
      this.colorLerp = lerp(this.colorLerp, 0.0, 0.001); 
      this.powerLevel = 1;
    } else if (this.isPowered) {
      this.powerLevel = lerp(this.powerLevel, 1, 0.05);
      this.colorLerp = lerp(this.colorLerp, 1.0, 0.01);
    }
  }

  drawV() {
    push();
    translate(this.pos.x, this.pos.y);
    let nodeColor = lerpColor(color(255), color(81, 117, 185), this.colorLerp);
    let alpha = this.isPowered ? 255 : 150;
    stroke(red(nodeColor), green(nodeColor), blue(nodeColor), alpha);
    strokeWeight(this.isPowered ? 2.5 : 1.5);
    noFill();
    let r = this.currentSize * 0.5;
    let p1 = {x: 0, y: -r}, p2 = {x: -r * 0.86, y: r * 0.5}, p3 = {x: r * 0.86, y: r * 0.5};
    if (this.isPowered) { 
      beginShape(); vertex(p1.x, p1.y); vertex(p2.x, p2.y); vertex(p3.x, p3.y); endShape(CLOSE);
    } else { 
      line(p1.x, p1.y, p2.x, p2.y); line(p1.x, p1.y, p3.x, p3.y); 
    }
    noStroke(); fill(255);
    let ds = this.isPowered ? 5 : 3;
    ellipse(p1.x, p1.y, ds, ds); ellipse(p2.x, p2.y, ds, ds); ellipse(p3.x, p3.y, ds, ds);
    pop();
  }

  display() {
    if (this.isPowered) {
      let currentGlow = this.currentSize * 2.2;
      let nodeColor = lerpColor(color(255), color(81, 117, 185), this.colorLerp);
      let grad = drawingContext.createRadialGradient(this.pos.x, this.pos.y, 0, this.pos.x, this.pos.y, currentGlow);
      grad.addColorStop(0, `rgba(${red(nodeColor)}, ${green(nodeColor)}, ${blue(nodeColor)}, 0.3)`);      
      grad.addColorStop(1, `rgba(${red(nodeColor)}, ${green(nodeColor)}, ${blue(nodeColor)}, 0)`);       
      drawingContext.fillStyle = grad; noStroke();
      circle(this.pos.x, this.pos.y, currentGlow * 2);
    }
  }

  powerUp() { this.isPowered = true; }
}

class RippleFlow {
  constructor(start, target, triggerNext) {
    this.startPos = createVector(start.pos.x, start.pos.y); 
    this.target = target;
    this.progress = 0;
    this.triggerNext = triggerNext;
    this.isFinished = false;
  }
  update() {
    this.progress += map(pow(sliderSpeed, 2), 0, 1, 0.003, 0.025);
    if (this.progress >= 1) {
      this.target.powerUp();
      if (this.triggerNext && this.target.row < rows - 1) {
        let nextRow = this.target.row + 1;
        let nextTargets = nodes.filter(n => n.row === nextRow && dist(n.pos.x, n.pos.y, this.target.pos.x, this.target.pos.y) < connectionDistance * 1.5);
        nextTargets.forEach(l => { if (random(1) > (1 - sliderStrength)) pulses.push(new RippleFlow(this.target, l, true)); });
      }
      this.isFinished = true;
    }
  }
  display() {
    noStroke();
    let numDots = 60; 
    for (let i = 0; i < numDots; i++) {
      let dotT = i / numDots;
      if (dotT > this.progress) continue;
      let p = p5.Vector.lerp(this.startPos, this.target.pos, dotT);
      let wave = exp(-pow((dotT - this.progress) * 16, 2)); 
      fill(255, 255 * wave); 
      ellipse(p.x, p.y, 1.2 + wave * 4.5);
    }
  }
}

// --- 5. UI COMPONENTS ---

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

// ... (drawIntro, drawHUDSlider, drawNextLink, drawCinematicBars, drawHeaderImage, drawSoftCircle stay the same)

function drawIntro() {
  textAlign(LEFT, CENTER); 
  textFont("new-spirit");
  drawingContext.font = `700 80px new-spirit, serif`;
  noStroke();
  let txtStage = "STAGE "; let content1 = "0: START"; let content2 = "1: PROVIDE";
  let fullWidth = textWidth(txtStage) + textWidth(content2); 
  let startX = (width / 2) - (fullWidth / 2);
  fill(255, introAlpha); text(txtStage, startX, targetY);
  let numX = startX + textWidth(txtStage); slideY = lerp(slideY, targetY, 0.1); 
  let currentContent = (introStage === 1) ? content1 : content2;
  fill(255, morphAlpha); text(currentContent, numX, slideY);
  if (frameCount > 120 && introStage === 1) { 
    morphAlpha -= 10; if (morphAlpha <= 0) { introStage = 2; slideY = targetY - 60; } 
  }
  if (introStage === 2) {
    morphAlpha = min(morphAlpha + 15, introAlpha); 
    if (frameCount > 260) { introAlpha -= 5; morphAlpha = introAlpha; if (introAlpha <= 0) appState = "ART"; }
  }
}

function drawHUDSlider(x, y, val, label, id) {
  let h = 210, w = 32; 
  if (mouseIsPressed && mouseX > x - w && mouseX < x + w && mouseY > y - h/2 && mouseY < y + h/2) activeSlider = id;
  if (activeSlider === id) {
    let newVal = map(mouseY, y + h/2, y - h/2, 0, 1);
    if (id === 1) sliderSpeed = constrain(newVal, 0, 1);
    if (id === 2) sliderStrength = constrain(newVal, 0, 1);
  }
  push(); translate(x, y); rectMode(CENTER); textAlign(CENTER, CENTER);
  textFont("mulish-variable");
  drawingContext.font = `200 16px mulish-variable, sans-serif`;
  fill(255); text(floor(val * 100) + "%", 0, -h/2 - 14);
  fill(0, 160); noStroke(); rect(0, 0, w, h, 16); 
  let segments = 20; let segH = (h - 12) / segments;
  for(let i = 0; i < segments; i++) {
    fill(81, 117, 185, (i / (segments - 1) <= val) ? 255 : 120); 
    rect(0, h/2 - 6 - (i * segH) - segH/2, w - 10, segH - 2, 3);
  }
  fill(255, 210); text(label, 0, h/2 + 20); pop();
}

function drawNextLink() {
  let label = "Next Stage >>"; textSize(16);
  let x = width - 60, y = height - 85;
  textFont("mulish-variable");
  drawingContext.font = `200 16px mulish-variable, sans-serif`;
  let txtW = textWidth(label); x -= txtW; 
  nextHover = (mouseX > x - 25 && mouseX < width && mouseY > y - 45 && mouseY < height);
  push(); translate(x, y); textAlign(LEFT, BASELINE);
  if (nextHover) { cursor(HAND); drawingContext.shadowBlur = 18; drawingContext.shadowColor = 'rgba(255, 255, 255, 0.8)'; }
  fill(nextHover ? 255 : 150); text(label, 0, 0);
  stroke(81, 117, 185, nextHover ? 255 : 110); strokeWeight(2.5); line(0, 10, txtW, 10); pop();
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

function drawHeaderImage() {
  if (headerImg && artAlpha > 0) {
    push(); imageMode(CENTER);
    drawingContext.globalAlpha = artAlpha / 255;
    image(headerImg, width / 2, 75); pop();
  }
}

function drawSoftCircle(x, y, r, c) {
  let cl = color(c);
  let g = drawingContext.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${red(cl)}, ${green(cl)}, ${blue(cl)}, 0.15)`);
  g.addColorStop(0.8, `rgba(${red(cl)}, ${green(cl)}, ${blue(cl)}, 0.03)`); 
  g.addColorStop(1, `rgba(${red(cl)}, ${green(cl)}, ${blue(cl)}, 0)`);
  drawingContext.fillStyle = g; circle(x, y, r * 2);
}


function mousePressed() {
  if (homeHover) window.location.href = "index.html";
  if (nextHover && appState === "ART") window.location.href = "my.html";
}

function mouseReleased() { activeSlider = null; }
function windowResized() { resizeCanvas(windowWidth, windowHeight); centerX = width/2; targetY = height/2; }