/*
REFERENCE:
Google (n.d.) Gemini (Gemini Pro) [large language model], Google, accessed 27 March 2026. https://gemini.google.com/
Processing Foundation (n.d.) p5.js (version 1.9.0) [software library], Processing Foundation, accessed 27 March 2026. https://p5js.org/
Mother Teresa (2013) Mother Teresa: 10 inspiring quotes – Where peace comes from, The Christian Science Monitor website, accessed 24 March 2026, https://www.csmonitor.com/Books/2013/0825/Mother-Teresa-10-inspiring-quotes/Where-peace-comes-from.
*/

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
let soundHover = false;    
let isMuted = false;       
let introStage = 1;        
let targetY, slideY;       
let morphAlpha = 255;
let activeSlider = null;   

let sliderSpeed = 0.5;    
let sliderStrength = 0.4; 

// Instruction States
let instrState = 0; 
let instrTimer = 0;
let hasShownBaseInstr = false;
let hasShownSlider1 = false;
let hasShownSlider2 = false;
let hasShownAdapt = false;

// Network Geometry Settings
const sides = 10;          
const rings = 4;           
let centerX, centerY;      
let connectionDistance = 140; 

// Assets
let homeImg; 
let soundOnImg, soundOffImg; 

// Audio Assets
let sliderSound;
let adaptSound;
let chargedSound;
let pulseSound;
let progressSound;
let bgMusic;

// --- RESPONSIVE & GRID SETTINGS ---
let ui = {
  isMobile: false,
  sidebarW: 180,
  margin: 50,
  fPercent: 12,
  fLabel: 10,
  fNav: 16,
  fIntro: 60,
};

function preload() {
  homeImg = loadImage('house.png'); 
  soundOnImg = loadImage("sound-on.png");   
  soundOffImg = loadImage("sound-off.png"); 
  
  sliderSound = loadSound("slider(edited).wav"); 
  adaptSound = loadSound("adapt(edited).wav"); 
  chargedSound = loadSound("connected.wav"); 
  pulseSound = loadSound("resource-flow-new.wav"); 
  progressSound = loadSound("charged.wav"); 
  bgMusic = loadSound("backgroundchau.wav");
}

function setup() {
  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.parent('canvas-container'); 

  updateUILayout(); 

  centerX = width * 0.5;
  centerY = height * 0.5;
  targetY = height / 2;
  slideY = targetY; 
  
  initNetwork();
  
  bokehParticles = [];
  for (let i = 0; i < 12; i++) {
    bokehParticles.push({
      x: random(width), y: random(height),
      anchorX: random(width), anchorY: random(height),
      size: random(150, 300),
      col: random(['#ff6666', '#ffffff', '#ff9999']), 
      phaseX: random(TWO_PI), phaseY: random(TWO_PI),
      speedX: random(0.001, 0.004), speedY: random(0.001, 0.004),
      driftRange: random(40, 80)
    });
  }

  let nextBtn = select('#next-btn');
  if (nextBtn) {
    nextBtn.mousePressed((e) => {
      e.preventDefault(); 
      if (appState === "ART") {
        appState = "OUTRO";
        outroAlpha = 0;
        let footer = select('#dynamic-footer');
        if (footer) footer.removeClass('show-now'); 
      }
    });
  }
}

function updateUILayout() {
  ui.isMobile = width < 700;
  ui.margin = ui.isMobile ? 25 : 60;

  if (ui.isMobile) {
    ui.fPercent = 12;
    ui.fLabel = 12;
    ui.fNav = 12;
    ui.fIntro = min(width * 0.09, 45);
  } else {
    ui.fPercent = 16;
    ui.fLabel = 16;
    ui.fNav = 16;
    ui.fIntro = min(width * 0.06, 75);
  }
}

function draw() {
  background(4, 6, 12); 

  if (appState === "INTRO") { 
    drawIntro(); 
  } 
  else if (appState === "ART") {
    
    let footer = select("#dynamic-footer");
    if (footer && !footer.hasClass("show-now")) {
      footer.addClass("show-now");
    }

    // --- SENTENCE BY SENTENCE INSTRUCTIONS ---
    if (instrState === 0 && !hasShownBaseInstr) {
        instrState = 1;
        instrTimer = millis() + 6000; 
        let instr = select('#instruction-text');
        if (instr) {
            instr.html("This network of small incomplete triangles represents Least Developed Countries (LDCs) - fragile systems where connections are easily disrupted.");
            instr.addClass('show-instruction');
        }
    } else if (instrState === 1 && millis() > instrTimer) {
        instrState = 2;
        instrTimer = millis() + 7000;
        let instr = select('#instruction-text');
        if (instr) instr.html("In this piece, each interaction reveals a process of receiving and adapting - illustrating how LDCs depend on global support to navigate both local and global challenges.");
    } else if (instrState === 2 && millis() > instrTimer) {
        instrState = 3;
        instrTimer = millis() + 5000;
        let instr = select('#instruction-text');
        if (instr) instr.html("Click anywhere on the network to send resources into motion.");
    } else if (instrState === 3 && millis() > instrTimer) {
        instrState = 4; // Intro flow finished
        hasShownBaseInstr = true;
        let instr = select('#instruction-text');
        if (instr) instr.removeClass('show-instruction');
    }

    drawArt();              
    drawCinematicBars(); 
    
    if (!ui.isMobile) {
      let uiX = 70;
      let opac = mouseX < ui.sidebarW || activeSlider !== null ? 255 : 80;
      drawHUDSlider(uiX, height / 2 - 150, sliderSpeed, "Global Currents", 1, opac, false);
      drawHUDSlider(uiX, height / 2 + 150, sliderStrength, "Local Impact", 2, opac, false);
    } else {
      let opac = mouseY > height - 150 || activeSlider !== null ? 255 : 120;
      let sliderW = (width - 60) / 2;
      drawHUDSlider(width / 2 - sliderW / 2 - 10, height - 130, sliderSpeed, "Global Currents", 1, opac, true);
      drawHUDSlider(width / 2 + sliderW / 2 + 10, height - 130, sliderStrength, "Local Impact", 2, opac, true);
    }
    
    drawAdaptMenu();
  } 
  else if (appState === "OUTRO") {
    drawOutro(); 
  }
  
  if (appState !== "INTRO") {
    drawHomeButton(); 
    drawSoundButton(); 
  }
}

// --- 3. NAVIGATION & MOUSE LOGIC ---

function mousePressed() {
  if (getAudioContext().state !== 'running') {
    userStartAudio();
  }
if (bgMusic && bgMusic.isLoaded() && !bgMusic.isPlaying()) {
    bgMusic.setVolume(0.3); // Set this low so it doesn't overpower your sound effects
    bgMusic.loop();         // .loop() instead of .play() so it repeats forever
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

  if (homeHover) {
    window.location.href = "index.html"; 
    return;
  }

  if (appState === "ART" && !activeSlider) {
    let closestNode = null;
    let minDist = 100; // Generous hit area so you don't miss when nodes move

    // Find the nearest node to the mouse
    for (let n of nodes) {
      let d = dist(mouseX, mouseY, n.pos.x, n.pos.y);
      if (d < minDist) {
        minDist = d;
        closestNode = n;
      }
    }

    // If we clicked near a node, trigger the ripple flow
    if (closestNode) {
      let nearbyNodes = nodes.filter(other => dist(closestNode.pos.x, closestNode.pos.y, other.pos.x, other.pos.y) < connectionDistance * 1.5);
      let numShots = floor(random(3, 6)); 
      nearbyNodes = shuffle(nearbyNodes).slice(0, numShots);
      if (!nearbyNodes.includes(closestNode)) nearbyNodes[0] = closestNode;

      for (let target of nearbyNodes) {
        pulses.push(new RippleFlow(target));
      }
      
      if (pulseSound && pulseSound.isLoaded()) {
        setTimeout(() => {
          if (!isMuted) {
            let panning = map(closestNode.pos.x, 0, width, -1.0, 1.0);
            pulseSound.pan(panning); 
            pulseSound.setVolume(0.2); 
            pulseSound.play();
          }
        }, 500); 
      }
      return; 
    }
  }
}

function mouseReleased() {
  activeSlider = null; 
}

// --- 4. SCREEN DRAWING FUNCTIONS ---

function drawIntro() {
  let fontSize = ui.isMobile ? 32 : 80;
  
  textFont("new-spirit");
  textSize(fontSize); 
  textStyle(BOLD); 
  drawingContext.font = `700 ${fontSize}px new-spirit, serif`;
  noStroke();
  
  let txtStage = "STAGE "; 
  let num1 = "2: ", text1 = "SHARE"; 
  let num2 = "3: ", text2 = "RECEIVE & ADAPT";
  
  let currentNum = (introStage === 1) ? num1 : num2;
  let currentText = (introStage === 1) ? text1 : text2;
  
  slideY = lerp(slideY, targetY, 0.1); 

  if (ui.isMobile) {
    let topWidth = textWidth(txtStage) + textWidth(currentNum);
    let startX = (width / 2) - (topWidth / 2);
    
    textAlign(LEFT, CENTER);
    fill(255, introAlpha); 
    text(txtStage, startX, targetY - 25);
    
    fill(255, morphAlpha); 
    text(currentNum, startX + textWidth(txtStage), targetY - 25);
    
    textAlign(CENTER, CENTER);
    text(currentText, width / 2, slideY + 25);
    
  } else {
    textAlign(LEFT, CENTER); 
    
    let fullContent = currentNum + currentText;
    let fullWidth = textWidth(txtStage) + textWidth(fullContent); 
    let startX = (width / 2) - (fullWidth / 2);
    
    fill(255, introAlpha); 
    text(txtStage, startX, targetY);
    
    let numX = startX + textWidth(txtStage); 
    fill(255, morphAlpha); 
    text(fullContent, numX, slideY);
  }
  
  if (frameCount > 120 && introStage === 1) { 
    morphAlpha -= 10; 
    if (morphAlpha <= 0) { 
      introStage = 2; 
      slideY = targetY - (ui.isMobile ? 35 : 60); 
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
  let titleSize = ui.isMobile ? 24 : 32;
  textSize(titleSize);
  textStyle(BOLD); 
  drawingContext.font = `700 ${titleSize}px new-spirit, serif`;
  text("Connect 2 Partners, Share 1 Solution Now", width/2, height/2 - 60);
  
  textFont("mulish-variable");
  let pSize = ui.isMobile ? 14 : 18;
  textSize(pSize);
  textStyle(NORMAL);
  drawingContext.font = `200 ${pSize}px mulish-variable, sans-serif`;
  let ctaText = "Find two international peers, host an online discussion, and share one simple, low-cost idea that can be started in a week to address a shared local challenge in your neighborhood.";
  text(ctaText, width/2, height/2 + 40, width * 0.85);
  
  fill(255, outroAlpha * 0.4);
  textSize(14);
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
// Automatic pulses based on Global Currents
  if (frameCount % floor(map(sliderSpeed, 0, 1, 120, 10)) === 0) {
      let randomNode = random(nodes);
      pulses.push(new RippleFlow(randomNode));
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
  
  blendMode(BLEND); 
  for (let node of nodes) {
    if (dist(mouseX, mouseY, node.pos.x, node.pos.y) < 20) {
      cursor(HAND);
    }
    node.update();
    node.display();
    node.drawV();
  }
  pop();
}

// --- 5. CORE CLASSES ---

class Node {
  constructor(x, y) {
    this.anchor = createVector(x, y); 
    this.pos = createVector(x, y);    
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.mass = random(0.8, 1.2);

    this.noiseOffsetX = random(2000); 
    this.noiseOffsetY = random(4000);
    this.isCharging = false; 
    this.isPowered = false;
    this.chargeLevel = 0; 
    this.powerLevel = 0; 
    this.glowRadius = 10; 
  }

  applyForce(force) {
    let f = p5.Vector.div(force, this.mass);
    this.acc.add(f);
  }

  update() {
   // 1. Spring force (Stiffness increases with Local Impact)
    let stiffness = map(sliderStrength, 0, 1, 0.05, 0.25);
    let spring = p5.Vector.sub(this.anchor, this.pos);
    spring.mult(stiffness); 
    this.applyForce(spring);

    // 2. Cursor Repulsion (Resisted by Local Impact)
    let mousePos = createVector(mouseX, mouseY);
    let dMouse = p5.Vector.dist(this.pos, mousePos);
    let resistance = map(sliderStrength, 0, 1, 1, 0.2); 
    
    if (dMouse < 120) {
      let repel = p5.Vector.sub(this.pos, mousePos);
      repel.normalize();
      let strength = map(dMouse, 0, 120, 5, 0) * resistance;
      repel.mult(strength);
      this.applyForce(repel);
    }

    // 3. Environmental Procedural Forces
    let globalFlow = sliderSpeed; 
    
    if (currentShape === "CLIMATE") {
        let nAngle = noise(this.pos.x * 0.01, this.pos.y * 0.01, frameCount * 0.05) * TWO_PI;
        let wind = p5.Vector.fromAngle(nAngle).mult(globalFlow * 2);
        this.applyForce(wind);
    } 
    else if (currentShape === "POVERTY") {
        if (sliderStrength < 0.5) {
            let drift = p5.Vector.sub(this.pos, createVector(centerX, centerY)).mult(0.01);
            this.applyForce(drift);
        }
    }
    else if (currentShape === "EDUCATION") {
        let pulseForce = sin(frameCount * 0.02) * globalFlow;
        this.applyForce(createVector(0, pulseForce));
    }

    // 4. Euler Physics Integration
    this.vel.add(this.acc);
    this.vel.mult(0.85); 
    this.pos.add(this.vel);
    this.acc.mult(0); 

    // 5. Active Jitter
    let jitter = this.isPowered ? 0.5 : (this.isCharging ? 2 : 4);
    this.pos.x += map(noise(this.noiseOffsetX), 0, 1, -jitter, jitter);
    this.pos.y += map(noise(this.noiseOffsetY), 0, 1, -jitter, jitter);
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
    this.glowRadius = 10 + (amount * 25); 
  }

  powerUp() { 
    this.isCharging = false; 
    this.isPowered = true; 
    this.powerLevel = 1; 
    this.glowRadius = 35; 
    
    if (chargedSound && chargedSound.isLoaded() && !isMuted) {
      let r = random(0.9, 1.1); 
      chargedSound.rate(r); 
      chargedSound.setVolume(0.6); 
      chargedSound.play();
    }
  }

  display() {
    let baseGlow = sliderStrength * 0.5; 
    let coreAlpha = max(this.isPowered ? 0.5 : this.chargeLevel * 0.2, baseGlow); 
    let radius = map(sliderStrength, 0, 1, 10, 50);

    if (this.isPowered || this.isCharging || sliderStrength > 0.1) {
      let grad = drawingContext.createRadialGradient(this.pos.x, this.pos.y, 0, this.pos.x, this.pos.y, radius);
      grad.addColorStop(0, `rgba(255, 130, 130, ${coreAlpha})`);      
      grad.addColorStop(1, `rgba(255, 60, 60, 0)`);       
      drawingContext.fillStyle = grad; 
      noStroke();
      circle(this.pos.x, this.pos.y, radius * 2);
    }
  }
}

class RippleFlow {
  constructor(targetNode) {
    let angle = random(TWO_PI);
    let r = max(width, height) * 0.9;
    this.startPos = createVector(centerX + cos(angle) * r, centerY + sin(angle) * r);
    
    this.target = targetNode;
    this.progress = 0;
    this.isFinished = false;
  }

  update() {
    if (!this.target) { this.isFinished = true; return; }
    
    let prevProgress = this.progress;
    this.progress += map(pow(sliderSpeed, 2), 0, 1, 0.003, 0.025);    
    if (prevProgress < 1 && this.progress >= 1) {
      if (progressSound && progressSound.isLoaded() && !isMuted) {
        progressSound.setVolume(0.15);
        progressSound.play();
      }
    }

    if (this.progress >= 1) {
      if (prevProgress < 1) { 
        let impact = p5.Vector.sub(this.target.pos, this.startPos);
        impact.normalize();
        impact.mult(15); 
        this.target.applyForce(impact);
      }

      if (this.target.chargeLevel < 1) {
        this.target.charge(this.target.chargeLevel + 0.35); 
      } else if (!this.target.isPowered) {
        this.target.powerUp();
        this.isFinished = true;
      }
      if (this.target.isPowered) this.isFinished = true;
    }
  }

  display() {
    if (!this.target) return;
    
    noStroke();
    let numDots = floor(map(sliderStrength, 0, 1, 30, 100));
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

function initNetwork() {
  nodes = []; edges = []; faces = [];
  
  let mobileScale = ui.isMobile ? 0.7 : 1.0; 
  
  connectionDistance = min(width, height) * 0.18 * mobileScale; 
  let spacing = min(width, height) * 0.11 * mobileScale; 
  
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
  currentShape = type; 

  let mobileScale = ui.isMobile ? 0.7 : 1.0;
  let scaleF = (min(width, height) / 900) * mobileScale; 

  nodes.forEach((n, i) => {
    let tx, ty;
    if (type === "POVERTY") {
      tx = centerX + (i % 10 - 5) * (55 * scaleF); 
      ty = centerY - (160 * scaleF) + (i / 10) * (85 * scaleF) + abs(i % 10 - 5) * (22 * scaleF);
    } else if (type === "EDUCATION") {
      tx = centerX - (210 * scaleF) + (i % 7) * (75 * scaleF); 
      ty = centerY - (160 * scaleF) + floor(i / 7) * (75 * scaleF);
    } else if (type === "CLIMATE") {
      let ang = i * 0.42; 
      let rad = (60 * scaleF) + i * (5.5 * scaleF); 
      tx = centerX + cos(ang) * rad; 
      ty = centerY + sin(ang) * rad;
    } else if (type === "INFRA") {
      tx = centerX + (i % 3 - 1) * (110 * scaleF); 
      ty = height - (220 * scaleF) - floor(i / 3) * (35 * scaleF);
    } else {
      let s = min(width, height) * 0.11 * mobileScale; 
      let r = floor(i / sides) + 1;
      let a = (i % sides) * (TWO_PI / sides) - HALF_PI;
      tx = centerX + r * s * cos(a); 
      ty = centerY + r * s * sin(a);
    }
    n.anchor.set(tx, ty);
  });
}

// --- 7. UI COMPONENT RENDERING ---

function drawAdaptMenu() {
  let btnW = ui.isMobile ? width * 0.22 : 125;
  let btnH = ui.isMobile ? 36 : 42;
  
  let bottomY = ui.isMobile ? height - 190 : height - 160; 
  let startX = width / 2;
  
  if (menuState === "CLOSED") {
    drawTextButton(startX, bottomY, btnW, btnH, "ADAPT", () => { menuState = "OPEN"; });
  } else {
    let options = ["POVERTY", "EDUCATION", "CLIMATE", "INFRA"];
    
    let spacing = min(150, width / (options.length + 0.5)); 
    let totalW = (options.length - 1) * spacing;
    
    options.forEach((opt, i) => {
      let x = (width/2 - totalW/2) + (i * spacing);
      drawTextButton(x, bottomY, btnW - 10, btnH, opt, () => { 
          transformShape(opt); 

          // Show Adapt Instruction
          if (!hasShownAdapt && instrState === 4) {
            let instr = select('#instruction-text');
            if (instr) {
                instr.html("Now you can observe how LDCs transform incoming resources to tackle four major challenges...");
                instr.addClass('show-instruction');
                setTimeout(() => instr.removeClass('show-instruction'), 5000);
            }
            hasShownAdapt = true;
          }

      });
    });
  }
}

function drawTextButton(x, y, w, h, label, callback) {
  let isHover = (mouseX > x - w/2 && mouseX < x + w/2 && mouseY > y - h/2 && mouseY < y + h/2);
  
  push(); translate(x, y); rectMode(CENTER); textAlign(CENTER, CENTER);
  stroke(255, isHover ? 255 : 120); fill(isHover ? 255 : 0, isHover ? 255 : 60);
  rect(0, 0, w, h, 5); noStroke(); fill(isHover ? 0 : 255);
  
  let fontSize = ui.isMobile ? 10 : 13;
  textSize(fontSize);
  textStyle(NORMAL);
  textFont("mulish-variable");
  drawingContext.font = `200 ${fontSize}px mulish-variable, sans-serif`;
  text(label, 0, 0);
  
  if (isHover && mouseIsPressed && !activeSlider) { 
    if (adaptSound && adaptSound.isLoaded() && !isMuted) {
      adaptSound.play();
    }
    callback(); 
    mouseIsPressed = false; 
  } 
  pop();
}

function drawHUDSlider(x, y, val, label, id, sliderOpacity, horizontal) {
  let isMobile = width < 600;
  let h = isMobile ? 120 : 200; 
  let activeColor = color(255, 80, 80); 

  let over = horizontal
    ? mouseX > x - (isMobile ? width/4 : 90) && mouseX < x + (isMobile ? width/4 : 90) && mouseY > y - 30 && mouseY < y + 30
    : mouseX > x - 30 && mouseX < x + 30 && mouseY > y - 100 && mouseY < y + 100;

  // Wait until the initial 3 sentences are done before showing slider tooltips
  let isInteracting = isMobile ? (activeSlider === id) : over;
  if (isInteracting && appState === "ART" && instrState === 4) {
      let instr = select('#instruction-text');
      if (id === 1 && !hasShownSlider1) {
          if (instr) {
              instr.html("Use the first slider to adjust the flow of these currents");
              instr.addClass('show-instruction');
              setTimeout(() => instr.removeClass('show-instruction'), 5000);
          }
          hasShownSlider1 = true;
      } else if (id === 2 && !hasShownSlider2) {
          if (instr) {
              instr.html("Use the second to influence how deeply they transform the system.");
              instr.addClass('show-instruction');
              setTimeout(() => instr.removeClass('show-instruction'), 5000);
          }
          hasShownSlider2 = true;
      }
  }

  if (mouseIsPressed && over) activeSlider = id;

  if (activeSlider === id) {
    let prevVal = val; 
    let rawVal = horizontal
      ? map(mouseX, x - (isMobile ? width/4 : 90), x + (isMobile ? width/4 : 90), 0, 1)
      : map(mouseY, y + 100, y - 100, 0, 1);
      
    let snappedVal = round(constrain(rawVal, 0, 1) * 10) / 10;
    
    if (snappedVal !== prevVal) {
      if (sliderSound && sliderSound.isLoaded() && !isMuted) {
        let pitch = (snappedVal > prevVal) ? map(snappedVal, 0, 1, 1, 1.5) : map(snappedVal, 0, 1, 0.5, 0.9);
        sliderSound.rate(pitch); 
        sliderSound.setVolume(0.5);
        sliderSound.play();
      }
    }
    
    if (id === 1) sliderSpeed = snappedVal;
    if (id === 2) sliderStrength = snappedVal;
  }

  push();
  translate(x, y);
  drawingContext.globalAlpha = sliderOpacity / 255;
  textFont("mulish-variable");

  let len = isMobile ? width/2 - 50 : 180;

  if (horizontal) {
    textAlign(LEFT, CENTER);
    drawingContext.font = `500 ${ui.fLabel}px mulish-variable, sans-serif`;
    fill(255);
    text(label, -len / 2, -10);

    textAlign(RIGHT, CENTER);
    drawingContext.font = `500 ${ui.fPercent}px mulish-variable, sans-serif`;
    text(floor(val * 100) + "%", len / 2, -10);

    stroke(255, 40);
    strokeWeight(2);
    line(-len / 2, 5, len / 2, 5);
    stroke(activeColor);
    line(-len / 2, 5, map(val, 0, 1, -len / 2, len / 2), 5);
    noStroke();
    for (let i = 0; i <= 10; i++) {
      let nx = map(i, 0, 10, -len / 2, len / 2);
      fill(i / 10 <= val + 0.01 ? activeColor : 80);
      circle(nx, 5, 3);
    }
    fill(activeColor);
    circle(map(val, 0, 1, -len / 2, len / 2), 5, 12);
  } else {
    textAlign(CENTER, CENTER);
    drawingContext.font = `500 ${ui.fPercent}px mulish-variable, sans-serif`;
    fill(255);
    text(floor(val * 100) + "%", 0, -125);

    drawingContext.font = `500 ${ui.fLabel}px mulish-variable, sans-serif`;
    let words = label.split(" ");
    let labelY = min(130, height - y - 20);
    
    if (words.length > 1) {
      text(words[0], 0, labelY);
      text(words[1], 0, labelY + ui.fLabel + 5);
    } else {
      text(label, 0, labelY);
    }

    stroke(255, 40);
    strokeWeight(2);
    line(0, -100, 0, 100);
    stroke(activeColor);
    line(0, 100, 0, map(val, 0, 1, 100, -100));
    noStroke();
    for (let i = 0; i <= 10; i++) {
      let ny = map(i, 0, 10, 100, -100);
      fill(i / 10 <= val + 0.01 ? activeColor : 80);
      circle(0, ny, 5);
    }
    fill(activeColor);
    circle(0, map(val, 0, 1, 100, -100), 16); 
  }
  pop();
}

function drawHomeButton() {
  let x = ui.isMobile ? 25 : 54;
  let y = ui.isMobile ? 30 : 45;
  let size = ui.isMobile ? 24 : 32;
  
  homeHover = mouseX > x && mouseX < x + size && mouseY > y && mouseY < y + size;
  if (homeHover) cursor(HAND);
  
  push(); 
  if (homeHover) { 
    tint(255, 255); 
  } else { 
    tint(255, 100); 
  }
  if (homeImg) image(homeImg, x, y, size, size);
  pop();
}

function drawSoundButton() {
  let size = ui.isMobile ? 24 : 32;
  let marginX = ui.isMobile ? 25 : 54;
  let y = ui.isMobile ? 30 : 45;
  let x = width - marginX - size;
  
  soundHover = mouseX > x && mouseX < x + size && mouseY > y && mouseY < y + size;

  push();
  if (soundHover) {
    cursor(HAND);
    tint(255, 255);
  } else {
    tint(255, 100);
  }

  let currentImg = isMuted ? soundOffImg : soundOnImg;
  if (currentImg) {
    image(currentImg, x, y, size, size);
  }
  pop();
}

function drawCinematicBars() {
  let isMobile = width < 600;
  let barH = isMobile ? 100 : 150;
  noStroke();
  let topGrad = drawingContext.createLinearGradient(0, 0, 0, barH);
  topGrad.addColorStop(0, "rgba(0,0,0,1)");
  topGrad.addColorStop(1, "rgba(0,0,0,0)");
  drawingContext.fillStyle = topGrad;
  rect(0, 0, width, barH);
  let bottomGrad = drawingContext.createLinearGradient(
    0,
    height,
    0,
    height - barH
  );
  bottomGrad.addColorStop(0, "rgba(0,0,0,1)");
  bottomGrad.addColorStop(1, "rgba(0,0,0,0)");
  drawingContext.fillStyle = bottomGrad;
  rect(0, height - barH, width, barH);
}

function drawSoftCircle(x, y, r, c) {
  let cl = color(c);
  let g = drawingContext.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${red(cl)}, ${green(cl)}, ${blue(cl)}, 0.15)`);
  g.addColorStop(0.8, `rgba(${red(cl)}, ${green(cl)}, ${blue(cl)}, 0.03)`); 
  g.addColorStop(1, `rgba(${red(cl)}, ${green(cl)}, ${blue(cl)}, 0)`);
  drawingContext.fillStyle = g; circle(x, y, r * 2);
}

function windowResized() { 
  resizeCanvas(windowWidth, windowHeight); 
  updateUILayout(); 
  centerX = width/2; 
  centerY = height/2; 
  targetY = height/2; 
  
  initNetwork();
  transformShape(currentShape); 
}
