

// --- 1. GLOBAL ARRAYS ---
let nodes = []; 
let edges = []; 
let faces = []; 
let pulses = []; 
let bokehParticles = []; 

// --- 2. STATE & UI VARIABLES ---
let appState = "INTRO"; 
let menuState = "CLOSED"; 
let currentShape = "ORIGINAL"; 
let introAlpha = 255;
let outroAlpha = 0; 
let artAlpha = 0;
let homeHover = false;
let nextHover = false; 
let introStage = 1; 
let targetY, slideY; 
let morphAlpha = 255;
let activeSlider = null;

let sliderSpeed = 0.5;    
let sliderStrength = 0.4; 

const sides = 10; 
const rings = 4;  
let centerX, centerY;
let connectionDistance = 140; 

let headerImg;
let homeImg; 


function preload() {
  headerImg = loadImage('header.png');
  homeImg = loadImage('house.png'); // Correctly loads the home button image
}

function setup() {
  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.parent('canvas-container'); 

  centerX = width * 0.5;
  centerY = height * 0.5;
  targetY = height / 2;
  slideY = targetY; 
  
  initNetwork();
  
  bokehParticles = [];
  for (let i = 0; i < 12; i++) {
    bokehParticles.push({
      x: random(width),
      y: random(height),
      anchorX: random(width),
      anchorY: random(height),
      size: random(150, 300),
      col: random(['#ff6666', '#ffffff', '#ff9999']), 
      phaseX: random(TWO_PI),
      phaseY: random(TWO_PI),
      speedX: random(0.001, 0.004),
      speedY: random(0.001, 0.004),
      driftRange: random(40, 80)
    });
  }
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
    
    // Sliders now use the Red Theme
    drawHUDSlider(70, height/2 - 150, sliderSpeed, "Speed", 1);
    drawHUDSlider(70, height/2 + 150, sliderStrength, "Solutions &\nExperience", 2);
    
    drawAdaptMenu();
    drawNextLink(); 
  } 
  else if (appState === "OUTRO") {
    drawOutro(); 
  }
  
  if (appState !== "INTRO") {
    drawHomeButton(); 
  }
}

// --- 3. NAVIGATION & MOUSE LOGIC ---

function mousePressed() {
  if (homeHover) {
    window.location.href = "index.html"; 
    return;
  }
  if (nextHover && appState === "ART") {
    appState = "OUTRO";
    outroAlpha = 0;
    return;
  }
}

function mouseReleased() {
  activeSlider = null;
}

// --- 4. SCREEN DRAWING FUNCTIONS ---

function drawIntro() {
  textAlign(LEFT, CENTER); 
  textFont("new-spirit");
  drawingContext.font = `700 80px new-spirit, serif`;
  noStroke();
  
  let txtStage = "STAGE "; 
  let content1 = "2: SHARE"; 
  let content2 = "3: RECEIVE & ADAPT";
  
  let fullWidth = textWidth(txtStage) + textWidth(content2); 
  let startX = (width / 2) - (fullWidth / 2);
  
  fill(255, introAlpha); 
  text(txtStage, startX, targetY);
  
  let numX = startX + textWidth(txtStage); 
  slideY = lerp(slideY, targetY, 0.1); 
  
  let currentContent = (introStage === 1) ? content1 : content2;
  fill(255, morphAlpha); 
  text(currentContent, numX, slideY);
  
  if (frameCount > 120 && introStage === 1) { 
    morphAlpha -= 10; 
    if (morphAlpha <= 0) { 
      introStage = 2; 
      slideY = targetY - 60; 
    } 
  }
  
  if (introStage === 2) {
    morphAlpha = min(morphAlpha + 15, introAlpha); 
    if (frameCount > 260) { 
      introAlpha -= 5; 
      morphAlpha = introAlpha; 
      if (introAlpha <= 0) appState = "ART"; 
    }
  }
}

function drawOutro() {
  if (outroAlpha < 255) outroAlpha += 3; 
  
  blendMode(ADD);
  bokehParticles.forEach(b => {
    b.x = b.anchorX + sin(frameCount * b.speedX + b.phaseX) * b.driftRange;
    b.y = b.anchorY + cos(frameCount * b.speedY + b.phaseY) * b.driftRange;
    drawSoftCircle(b.x, b.y, b.size, b.col);
  });
  
  blendMode(BLEND);
  textAlign(CENTER, CENTER);
  rectMode(CENTER);
  noStroke();
  
  fill(255, outroAlpha);
  textFont("new-spirit");
  drawingContext.font = `700 32px new-spirit, serif`;
  text("Connect 2 Partners, Share 1 Solution Now", width/2, height/2 - 60);
  
  textFont("mulish-variable");
  drawingContext.font = `200 18px mulish-variable, sans-serif`;
  let ctaText = "Find two international peers, host an online discussion, and share one simple, low-cost idea that can be started in a week to address a shared local challenge in your neighborhood.";
  text(ctaText, width/2, height/2 + 40, width * 0.65);
  
  fill(255, outroAlpha * 0.4);
  drawingContext.font = `200 14px mulish-variable, sans-serif`;
  text("CLICK HOME TO RETURN TO MAIN PAGE", width/2, height/2 + 180);
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
      fill(255, 80, 80, 160 * facePower);
      triangle(f.a.pos.x, f.a.pos.y, f.b.pos.x, f.b.pos.y, f.c.pos.x, f.c.pos.y);
    }
  }

  for (let e of edges) {
    let edgePower = min(e.a.powerLevel, e.b.powerLevel);
    let alpha = lerp(40, 200, edgePower);
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

function drawHeaderImage() {
  if (headerImg && artAlpha > 0) {
    push();
    imageMode(CENTER);
    drawingContext.globalAlpha = artAlpha / 255;
    image(headerImg, width / 2, 75); 
    pop();
  }
}

// --- 5. CORE CLASSES ---

class Node {
  constructor(x, y) {
    this.anchor = createVector(x, y);
    this.pos = createVector(x, y);
    this.noiseOffsetX = random(2000); 
    this.noiseOffsetY = random(4000);
    this.isCharging = false; 
    this.isPowered = false;
    this.chargeLevel = 0; 
    this.powerLevel = 0; 
    this.glowRadius = 10; 
  }

  update() {
    let jitter = this.isPowered ? 1.5 : (this.isCharging ? 3 : 8);
    let nx = map(noise(this.noiseOffsetX), 0, 1, -jitter, jitter);
    let ny = map(noise(this.noiseOffsetY), 0, 1, -jitter, jitter);
    
    this.pos.x = lerp(this.pos.x, this.anchor.x + nx, 0.08);
    this.pos.y = lerp(this.pos.y, this.anchor.y + ny, 0.08);
    
    this.noiseOffsetX += 0.01; 
    this.noiseOffsetY += 0.01;
    if (this.isPowered) this.powerLevel = 1;
  }

  drawV() {
    push();
    translate(this.pos.x, this.pos.y);
    let p = this.isPowered ? 1 : this.chargeLevel;
    let dotSize = lerp(2, 6, p);
    
    if (this.isPowered) { 
      stroke(255, 120, 120); 
      strokeWeight(2.5);
    } else { 
      stroke(255, 80, 80, lerp(120, 255, this.chargeLevel)); 
      strokeWeight(1.5);
    }
    
    noFill();
    let r = 9;
    let p1 = {x: 0, y: -r}, p2 = {x: -r * 0.86, y: r * 0.5}, p3 = {x: r * 0.86, y: r * 0.5};
    
    if (this.isPowered) { 
      beginShape(); vertex(p1.x, p1.y); vertex(p2.x, p2.y); vertex(p3.x, p3.y); endShape(CLOSE);
    } else { 
      line(p1.x, p1.y, p2.x, p2.y); line(p1.x, p1.y, p3.x, p3.y); 
    }
    
    noStroke(); fill(255);
    ellipse(p1.x, p1.y, dotSize, dotSize); 
    ellipse(p2.x, p2.y, dotSize, dotSize); 
    ellipse(p3.x, p3.y, dotSize, dotSize);
    pop();
  }

  charge(amount) { 
    this.isCharging = true; 
    this.chargeLevel = amount; 
    this.glowRadius = 10 + (amount * 25); // REDUCED GLOW FACTOR
  }

  powerUp() { 
    this.isCharging = false; 
    this.isPowered = true; 
    this.powerLevel = 1; 
    this.glowRadius = 35; // REDUCED MAX GLOW
  }

  display() {
    if (this.isPowered || this.isCharging) {
      let coreAlpha = this.isPowered ? 0.5 : this.chargeLevel * 0.2; // LOWERED OPACITY
      let grad = drawingContext.createRadialGradient(this.pos.x, this.pos.y, 0, this.pos.x, this.pos.y, this.glowRadius);
      grad.addColorStop(0, `rgba(255, 130, 130, ${coreAlpha})`);      
      grad.addColorStop(1, `rgba(255, 60, 60, 0)`);       
      drawingContext.fillStyle = grad; 
      noStroke();
      circle(this.pos.x, this.pos.y, this.glowRadius * 2);
    }
  }
}

class RippleFlow {
  constructor(target) {
    let angle = random(TWO_PI);
    let r = max(width, height) * 0.9;
    this.startPos = createVector(centerX + cos(angle) * r, centerY + sin(angle) * r);
    this.target = target;
    this.progress = 0;
    this.isFinished = false;
  }

  update() {
    this.progress += map(pow(sliderSpeed, 2), 0, 1, 0.003, 0.025);
    if (this.progress >= 1) {
      if (this.target.chargeLevel < 1) {
        this.target.charge(this.target.chargeLevel + 0.012);
      } else if (!this.target.isPowered) {
        this.target.powerUp();
        this.isFinished = true;
      }
      if (this.target.isPowered) this.isFinished = true;
    }
  }

  display() {
    noStroke();
    let numDots = floor(map(sliderStrength, 0, 1, 40, 120));
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

// --- 6. AUTOMATION & NAVIGATION ---

function autoTriggerPulses() {
  let interval = map(pow(sliderSpeed, 2), 0, 1, 140, 15); 
  if (frameCount % max(1, floor(interval)) === 0) {
    let valid = nodes.filter(n => !n.isPowered && !n.isCharging);
    if (valid.length > 0) {
      pulses.push(new RippleFlow(random(valid)));
    }
  }
}

function initNetwork() {
  nodes = []; edges = []; faces = [];
  let spacing = min(width, height) * 0.11; 
  for (let r = 1; r <= rings; r++) {
    for (let i = 0; i < sides; i++) {
      let angle = i * (TWO_PI / sides) - HALF_PI;
      let radius = r * spacing;
      let x = centerX + radius * cos(angle);
      let y = centerY + radius * sin(angle);
      nodes.push(new Node(x, y));
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

function transformShape(type) {
  nodes.forEach((n, i) => {
    let tx, ty;
    if (type === "POVERTY") {
      tx = centerX + (i % 10 - 5) * 55; ty = centerY - 160 + (i / 10) * 85 + abs(i % 10 - 5) * 22;
    } else if (type === "EDUCATION") {
      tx = centerX - 210 + (i % 7) * 75; ty = centerY - 160 + floor(i / 7) * 75;
    } else if (type === "CLIMATE") {
      let ang = i * 0.42; let rad = 60 + i * 5.5; tx = centerX + cos(ang) * rad; ty = centerY + sin(ang) * rad;
    } else if (type === "INFRA") {
      tx = centerX + (i % 3 - 1) * 110; ty = height - 220 - floor(i / 3) * 35;
    } else {
      let s = min(width, height) * 0.11; let r = floor(i / sides) + 1;
      let a = (i % sides) * (TWO_PI / sides) - HALF_PI;
      tx = centerX + r * s * cos(a); ty = centerY + r * s * sin(a);
    }
    n.anchor.set(tx, ty);
  });
}

// --- 7. UI COMPONENT RENDERING ---

function drawAdaptMenu() {
  let btnW = 125, btnH = 42, bottomY = height - 85, startX = width / 2;
  if (menuState === "CLOSED") {
    drawTextButton(startX, bottomY, btnW, btnH, "ADAPT", () => { menuState = "OPEN"; });
  } else {
    let options = ["POVERTY", "EDUCATION", "CLIMATE", "INFRA"];
    let spacing = 150; let totalW = (options.length - 1) * spacing;
    options.forEach((opt, i) => {
      let x = (width/2 - totalW/2) + (i * spacing);
      drawTextButton(x, bottomY, 115, btnH, opt, () => { transformShape(opt); });
    });
    drawTextButton(width/2, bottomY + 55, 65, 28, "BACK", () => { menuState = "CLOSED"; });
  }
}

function drawTextButton(x, y, w, h, label, callback) {
  let isHover = (mouseX > x - w/2 && mouseX < x + w/2 && mouseY > y - h/2 && mouseY < y + h/2);
  push(); translate(x, y); rectMode(CENTER); textAlign(CENTER, CENTER);
  stroke(255, isHover ? 255 : 120); fill(isHover ? 255 : 0, isHover ? 255 : 60);
  rect(0, 0, w, h, 5); noStroke(); fill(isHover ? 0 : 255);
  textFont("mulish-variable");
  drawingContext.font = `200 13px mulish-variable, sans-serif`;
  text(label, 0, 0);
  if (isHover && mouseIsPressed && !activeSlider) { callback(); mouseIsPressed = false; } 
  pop();
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
    // UPDATED SLIDER COLOR TO RED THEME
    fill(255, 80, 80, (i / (segments - 1) <= val) ? 180 : 30); 
    rect(0, h/2 - 6 - (i * segH) - segH/2, w - 10, segH - 2, 3);
  }
  fill(255, 210); text(label, 0, h/2 + 20); 
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
  stroke(255, 80, 80, nextHover ? 255 : 110); strokeWeight(2.5); line(0, 10, txtW, 10); pop();
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

function drawSoftCircle(x, y, r, c) {
  let cl = color(c);
  let g = drawingContext.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${red(cl)}, ${green(cl)}, ${blue(cl)}, 0.15)`);
  g.addColorStop(0.8, `rgba(${red(cl)}, ${green(cl)}, ${blue(cl)}, 0.03)`); 
  g.addColorStop(1, `rgba(${red(cl)}, ${green(cl)}, ${blue(cl)}, 0)`);
  drawingContext.fillStyle = g; circle(x, y, r * 2);
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); centerX = width/2; centerY = height/2; targetY = height/2; }