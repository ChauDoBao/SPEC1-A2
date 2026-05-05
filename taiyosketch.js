/*
Copyright (C) 2026 Truong Nguyen Kieu My
*/

// --- 1. GLOBAL ARRAYS & VARIABLES ---
let nodes = [];           
let edges = [];           
let faces = [];           
let pulses = [];          
let bokehParticles = [];  

// --- 2. UI & STATE CONTROL ---
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

let currentMaxRow = 5;    
let centerX;              
let connectionDistance = 160; 

let homeImg;              
let energyOut = 0;        

// Sound Variables
let soundHover = false; 
let isMuted = false;    
let launchSound;
let powerUpSound;
let sliderSound; // NEW: Single variable for the slider sound

// --- 3. PRELOAD & SETUP ---
function preload() {
  homeImg = loadImage('house.png');
  
  // Load the sounds
  launchSound = loadSound("Resource-Launch(edited).wav"); 
  powerUpSound = loadSound("Node-Powerd-Up(edited).wav"); 
  sliderSound = loadSound("slide-2.wav"); // NEW: Load the slider sound
}

function setup() {
  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.parent('canvas-container'); 

  centerX = width * 0.5;
  targetY = height / 2;
  slideY = targetY; 
  
  for (let i = 0; i < 12; i++) {
    bokehParticles.push({
      x: random(width), y: random(height),
      anchorX: random(width), anchorY: random(height),
      size: random(150, 300),
      col: random(['#5175B9', '#ffffff', '#8faadc']),
      phaseX: random(TWO_PI), phaseY: random(TWO_PI),
      speedX: random(0.001, 0.004), speedY: random(0.001, 0.004),
      driftRange: random(40, 80)
    });
  }

  initInitialNetwork();
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
    
    // Slider UI Integration 
    drawHUDSlider(70, height/2 - 150, sliderSpeed, "Speed", 1);
    drawHUDSlider(70, height/2 + 150, sliderStrength, "Quantity", 2);
    
    drawNextLink();      
  }
  
  if (appState !== "INTRO") {
    drawHomeButton();    
    drawSoundButton(); 
  }
}

// --- 4. NETWORK LOGIC ---

function initInitialNetwork() {
  nodes = [];
  for (let r = 0; r <= currentMaxRow; r++) {
    let y = map(r, 0, currentMaxRow, height * 0.22, height * 0.82);
    let nodesInRow = r + 2; 
    let rowWidth = map(r, 0, currentMaxRow, width * 0.1, width * 0.8);
    
    for (let i = 0; i < nodesInRow; i++) {
      let x = map(i, 0, nodesInRow - 1, centerX - rowWidth/2, centerX + rowWidth/2);
      let nodeType = (r === 0) ? 'developed' : (r === 1 ? 'developing' : 'ldc');
      let size = (r === 0) ? 80 : (r === 1 ? 35 : 18);
      nodes.push(new Node(x, y, size, nodeType, (r <= 1), r));
    }
  }
  refreshConnections(); 
}

function spawnNewFloor() {
  if (nodes.length > 200) return; 
  
  let currentDeepestY = 0;
  nodes.forEach(n => { if(n.pos.y > currentDeepestY) currentDeepestY = n.pos.y; });

  currentMaxRow++;
  let r = currentMaxRow;
  let newY = currentDeepestY + 90; 
  
  if (newY > height - 140) return; 

  let nodesInRow = min(r + 2, 10); 
  let rowWidth = map(r, 0, 10, width * 0.3, width * 1.5);
  
  for (let i = 0; i < nodesInRow; i++) {
    let x = map(i, 0, nodesInRow - 1, centerX - rowWidth/2, centerX + rowWidth/2);
    nodes.push(new Node(x, newY, 18, 'ldc', false, r));
  }
  
  refreshConnections(); 
}

function refreshConnections() {
  edges = [];
  faces = [];
  let dLimit = connectionDistance; 
  
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      let d = dist(nodes[i].anchor.x, nodes[i].anchor.y, nodes[j].anchor.x, nodes[j].anchor.y);
      if (d < dLimit) {
        edges.push({ a: nodes[i], b: nodes[j] });
        for (let k = j + 1; k < nodes.length; k++) {
          let d2 = dist(nodes[i].anchor.x, nodes[i].anchor.y, nodes[k].anchor.x, nodes[k].anchor.y);
          let d3 = dist(nodes[j].anchor.x, nodes[j].anchor.y, nodes[k].anchor.x, nodes[k].anchor.y);
          if (d2 < dLimit && d3 < dLimit) {
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
      c.setAlpha(100 * facePower * f.a.appearanceAlpha);
      fill(c); 
      triangle(f.a.pos.x, f.a.pos.y, f.b.pos.x, f.b.pos.y, f.c.pos.x, f.c.pos.y);
    }
  }

  for (let e of edges) {
    let edgePower = min(e.a.powerLevel, e.b.powerLevel);
    let visibility = min(e.a.appearanceAlpha, e.b.appearanceAlpha);
    if (visibility > 0.1) {
       let alpha = lerp(0, 180 * visibility, edgePower + 0.1);
       stroke(255, alpha); 
       strokeWeight(1);
       drawingContext.setLineDash([2, 5]); 
       line(e.a.pos.x, e.a.pos.y, e.b.pos.x, e.b.pos.y);
       drawingContext.setLineDash([]); 
    }
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
      let targets = nodes.filter(n => n.row === 1);
      
      if (targets.length > 0) {
        pulses.push(new RippleFlow(src, random(targets), true));
        energyOut += 0.08; 
        
        // SOUND TRIGGER: First triangle (Source) launches resources
        if (launchSound && launchSound.isLoaded() && !isMuted) {
          let panning = map(src.pos.x, 0, width, -1.0, 1.0);
          launchSound.pan(panning); 
          launchSound.setVolume(0.3); 
          launchSound.play();
        }
      }
    }
  }
}

// --- 5. CLASSES ---

class Node {
  constructor(x, y, size, type, isPowered, row) {
    this.anchor = createVector(x, y); 
    this.pos = createVector(x, y);    
    this.baseSize = size;
    this.currentSize = size;
    this.type = type;
    this.row = row; 
    this.isPowered = isPowered;
    this.powerLevel = isPowered ? 1 : 0;
    this.appearanceAlpha = isPowered ? 1.0 : 0.0; 
    this.noiseOffsetX = random(2000); 
    this.noiseOffsetY = random(4000);
    this.colorLerp = (type === 'developed') ? 1.0 : 0.0;
  }

  update() {
    if (this.appearanceAlpha < 1.0) this.appearanceAlpha += 0.02;

    let jitter = this.isPowered ? 1.5 : 8;
    this.pos.x = lerp(this.pos.x, this.anchor.x + map(noise(this.noiseOffsetX), 0, 1, -jitter, jitter), 0.08);
    this.pos.y = lerp(this.pos.y, this.anchor.y + map(noise(this.noiseOffsetY), 0, 1, -jitter, jitter), 0.08);
    this.noiseOffsetX += 0.01; this.noiseOffsetY += 0.01;

    if (this.type === 'developed') {
      let expansion = map(constrain(energyOut, 0, 20), 0, 20, 1.0, 2.2);
      this.currentSize = this.baseSize * expansion;
      this.colorLerp = lerp(this.colorLerp, 0.0, 0.005); 
      this.powerLevel = 1;
    } else if (this.isPowered) {
      this.powerLevel = lerp(this.powerLevel, 1, 0.05);
      this.colorLerp = lerp(this.colorLerp, 1.0, 0.01);
    }
  }

  drawV() {
    push(); translate(this.pos.x, this.pos.y);
    let nodeColor = lerpColor(color(255), color(81, 117, 185), this.colorLerp);
    let alpha = (this.isPowered ? 255 : 150) * this.appearanceAlpha; 
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
    noStroke(); fill(255, alpha);
    let ds = this.isPowered ? 5 : 3;
    ellipse(p1.x, p1.y, ds, ds); ellipse(p2.x, p2.y, ds, ds); ellipse(p3.x, p3.y, ds, ds);
    pop();
  }

  display() {
    if (this.isPowered && this.appearanceAlpha > 0.1) {
      let currentGlow = this.currentSize * 2.2;
      let nodeColor = lerpColor(color(255), color(81, 117, 185), this.colorLerp);
      let grad = drawingContext.createRadialGradient(this.pos.x, this.pos.y, 0, this.pos.x, this.pos.y, currentGlow);
      grad.addColorStop(0, `rgba(${red(nodeColor)}, ${green(nodeColor)}, ${blue(nodeColor)}, ${0.3 * this.appearanceAlpha})`);      
      grad.addColorStop(1, `rgba(${red(nodeColor)}, ${green(nodeColor)}, ${blue(nodeColor)}, 0)`);       
      drawingContext.fillStyle = grad; noStroke();
      circle(this.pos.x, this.pos.y, currentGlow * 2);
    }
  }
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
      
      // SOUND TRIGGER: Node powers up when receiving resources
      if (!this.target.isPowered) {
        this.target.isPowered = true;
        
        if (powerUpSound && powerUpSound.isLoaded() && !isMuted) {
          powerUpSound.rate(random(0.9, 1.1)); 
          powerUpSound.setVolume(0.5); 
          powerUpSound.play();
        }
      }
      
      if (this.target.row === currentMaxRow) {
        spawnNewFloor();
      }

      if (this.triggerNext) {
        let nxtR = this.target.row + 1;
        let nxtT = nodes.filter(n => n.row === nxtR && dist(n.pos.x, n.pos.y, this.target.pos.x, this.target.pos.y) < connectionDistance * 2.5);
        nxtT.forEach(l => { 
          if (random(1) > (0.95 - sliderStrength)) {
            pulses.push(new RippleFlow(this.target, l, true)); 
          }
        });
      }
      this.isFinished = true;
    }
  }
  display() {
    noStroke();
    for (let i = 0; i < 60; i++) {
      let t = i / 60;
      if (t > this.progress) continue;
      let p = p5.Vector.lerp(this.startPos, this.target.pos, t);
      let w = exp(-pow((t - this.progress) * 16, 2));
      fill(255, 255 * w); 
      ellipse(p.x, p.y, 1.2 + w * 4.5);
    }
  }
}

// --- 6. UI & HELPER FUNCTIONS ---

function drawHomeButton() {
  let x = 54, y = 40, size = 32; 
  homeHover = (mouseX > x && mouseX < x + size && mouseY > y && mouseY < y + size);
  push(); if (homeHover) { cursor(HAND); tint(255); } else { tint(180); }
  if (homeImg) image(homeImg, x, y, size, size); pop();
}

function drawSoundButton() {
  let size = 30; 
  let x = width - 54 - size; 
  let y = 40; 
  
  soundHover = mouseX > x && mouseX < x + size && mouseY > y && mouseY < y + size;

  push();
  translate(x + size / 2, y + size / 2); 
  
  if (soundHover) cursor(HAND);
  
  let iconColor = soundHover ? color(255) : color(180);
  
  // Draw Speaker Body
  noStroke(); fill(iconColor);
  rect(-8, -4, 4, 8); 
  quad(-4, -4, -4, 4, 4, 8, 4, -8); 
  
  // Draw Waves or 'X'
  noFill(); stroke(iconColor); strokeWeight(2); strokeCap(ROUND); 
  
  if (!isMuted) {
    arc(5, 0, 8, 12, -PI/3, PI/3);
    arc(5, 0, 16, 20, -PI/3, PI/3);
  } else {
    line(8, -4, 14, 4);
    line(14, -4, 8, 4);
  }
  pop();
}

function drawIntro() {
  textAlign(LEFT, CENTER); textFont("new-spirit"); drawingContext.font = `700 80px new-spirit, serif`;
  noStroke(); let tS = "STAGE "; let c1 = "0: START"; let c2 = "1: PROVIDE";
  let fW = textWidth(tS) + textWidth(c2); let sX = (width / 2) - (fW / 2);
  fill(255, introAlpha); text(tS, sX, targetY);
  let nX = sX + textWidth(tS); slideY = lerp(slideY, targetY, 0.1); 
  let curr = (introStage === 1) ? c1 : c2;
  fill(255, morphAlpha); text(curr, nX, slideY);
  if (frameCount > 120 && introStage === 1) { morphAlpha -= 10; if (morphAlpha <= 0) { introStage = 2; slideY = targetY - 60; } }
  if (introStage === 2) { morphAlpha = min(morphAlpha + 15, introAlpha); if (frameCount > 260) { introAlpha -= 5; morphAlpha = introAlpha; if (introAlpha <= 0) appState = "ART"; } }
}

function drawHUDSlider(x, y, val, label, id) {
  let h = 200; 
  let w = 40;  
  let activeColor = color(81, 117, 185); 

  if (mouseIsPressed &&
      mouseX > x - w/2 && mouseX < x + w/2 &&
      mouseY > y - h/2 && mouseY < y + h/2) {
    activeSlider = id;
  }

  if (activeSlider === id) {
    let prevVal = val; 
    let rawVal = map(mouseY, y + h/2, y - h/2, 0, 1);
    let snappedVal = round(constrain(rawVal, 0, 1) * 10) / 10;
    
    // NEW: Slider Sound playback using the single slider-2.wav
    if (snappedVal !== prevVal) {
      if (sliderSound && sliderSound.isLoaded() && !isMuted) {
        // Higher value = higher pitch
        sliderSound.rate(map(snappedVal, 0, 1, 0.7, 1.4)); 
        sliderSound.setVolume(map(snappedVal, 0, 1, 0.4, 0.8));
        sliderSound.play();
      }
    }
    
    if (id === 1) sliderSpeed = snappedVal;
    if (id === 2) sliderStrength = snappedVal;
  }

  push();
  translate(x, y);

  textFont("mulish-variable");
  drawingContext.font = `200 16px mulish-variable, sans-serif`;

  textAlign(CENTER, CENTER);
  fill(255);
  text(floor(val * 100) + "%", 0, -h / 2 - 25);

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

  fill(activeColor);
  drawingContext.shadowBlur = 15;
  drawingContext.shadowColor = activeColor;
  circle(0, currentY, 13); 
  drawingContext.shadowBlur = 0;

  fill(255, 200);
  text(label, 0, h / 2 + 26);
  pop();
}

function drawNextLink() {
  let label = "Next Stage >>"; textSize(16); let x = width - 60, y = height - 85;
  textFont("mulish-variable"); drawingContext.font = `200 16px mulish-variable, sans-serif`;
  let txtW = textWidth(label); x -= txtW; 
  nextHover = (mouseX > x - 25 && mouseX < width && mouseY > y - 45 && mouseY < height);
  push(); translate(x, y); textAlign(LEFT, BASELINE);
  if (nextHover) { cursor(HAND); drawingContext.shadowBlur = 18; drawingContext.shadowColor = 'rgba(255, 255, 255, 0.8)'; }
  fill(nextHover ? 255 : 150); text(label, 0, 0);
  stroke(81, 117, 185, nextHover ? 255 : 110); strokeWeight(2.5); line(0, 10, txtW, 10); pop();
}

function drawCinematicBars() {
  let barH = 150; noStroke();
  let topGrad = drawingContext.createLinearGradient(0, 0, 0, barH); topGrad.addColorStop(0, 'rgba(0,0,0,1)'); topGrad.addColorStop(1, 'rgba(0,0,0,0)');
  drawingContext.fillStyle = topGrad; rect(0, 0, width, barH);
  let bottomGrad = drawingContext.createLinearGradient(0, height, 0, height - barH); bottomGrad.addColorStop(0, 'rgba(0,0,0,1)'); bottomGrad.addColorStop(1, 'rgba(0,0,0,0)');
  drawingContext.fillStyle = bottomGrad; rect(0, height - barH, width, barH);
}


function drawSoftCircle(x, y, r, c) { let cl = color(c); let g = drawingContext.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${red(cl)}, ${green(cl)}, ${blue(cl)}, 0.15)`); g.addColorStop(0.8, `rgba(${red(cl)}, ${green(cl)}, ${blue(cl)}, 0.03)`); g.addColorStop(1, `rgba(${red(cl)}, ${green(cl)}, ${blue(cl)}, 0)`); drawingContext.fillStyle = g; circle(x, y, r * 2); }

function mousePressed() {
  if (getAudioContext().state !== 'running') {
    userStartAudio();
  }

  if (soundHover) {
    isMuted = !isMuted;
    if (isMuted) {
      outputVolume(0); 
    } else {
      outputVolume(1); 
    }
    return; 
  }
  
  if (homeHover) window.location.href = "index.html"; 
  if (nextHover && appState === "ART") window.location.href = "my.html"; 
}

function mouseReleased() { activeSlider = null; }
function windowResized() { resizeCanvas(windowWidth, windowHeight); centerX = width/2; targetY = height/2; }
