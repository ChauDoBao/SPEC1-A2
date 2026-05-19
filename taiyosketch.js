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

let sliderFunding = 0.3;    
let sliderTech = 0.3; 
let sliderKnowledge = 0.3;

let currentMaxRow = 5;    
let centerX;              
let connectionDistance = 180; 

let homeImg;        
let soundOnImg, soundOffImg; 
let energyOut = 0;        

// Sound Variables
let soundHover = false; 
let isMuted = false;    
let sliderSound; 

let flowSound;
let sourceSound;
let fundSound;
let techSound;
let knowSound;
let bgMusic; // Background music variable

// --- INSTRUCTION FLAGS ---
let introSequenceStarted = false;
let hasShownDev = false;
let hasShownDeveloping = false;
let hasShownLDC = false;
let hasShownFund = false;
let hasShownTech = false;
let hasShownKnow = false;
let hasShownCombine = false;
let hasShownEnd = false;
let userHasInteracted = false; 

// --- RESPONSIVE UI OBJECT ---
let ui = {
  isMobile: false,
  sidebarW: 250, 
  margin: 50,
  fPercent: 12,
  fLabel: 10,
  fNav: 16,
  fIntro: 60,
};

// --- 3. PRELOAD & SETUP ---
function preload() {
  homeImg = loadImage('house.png');
  soundOnImg = loadImage("sound-on.png");   
  soundOffImg = loadImage("sound-off.png");
  sliderSound = loadSound("slide-2.wav"); 
  
  flowSound = loadSound("Resource-Providing-Flow.wav");
  sourceSound = loadSound("Source-activation.wav");
  fundSound = loadSound("Funding.wav");
  techSound = loadSound("Technology.wav");
  knowSound = loadSound("Knowledge.wav");
  
  bgMusic = loadSound("backgroundtaiyo.wav"); // Uncomment and add your filename here
}

function updateUILayout() {
  ui.isMobile = width < 700;
  ui.margin = ui.isMobile ? 25 : 60;
  
  connectionDistance = ui.isMobile ? 260 : 180; 

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

function setup() {
  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.parent('canvas-container'); 

  updateUILayout();

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

  let nextBtn = select('#next-btn');
  if (nextBtn) {
    nextBtn.mousePressed((e) => {
      e.preventDefault(); 
      if (appState === "ART") {
        appState = "OUTRO";
        let footer = select('#dynamic-footer');
        if (footer) footer.removeClass('show-now');
      }
    });
  }
  
  initInitialNetwork();
}

function displayInstruction(textStr, duration = 5000) {
  let instr = select('#instruction-text');
  if (instr) {
    instr.html(textStr);
    instr.addClass('show-instruction');
    
    if (window.instructionTimeout) clearTimeout(window.instructionTimeout);
    
    window.instructionTimeout = setTimeout(() => {
      instr.removeClass('show-instruction');
    }, duration);
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
    
    if (!introSequenceStarted) {
      introSequenceStarted = true;
      
      let s1 = "The goal of this generative art is to illustrate the process of providing, where developed countries provide resources to support developing countries and LDCs.";
      let s2 = "Users can observe the flow of resources from the top nodes representing developed countries to all the nodes below.";
      let s3 = "They can also interact to adjust the amount and speed of resources being delivered, helping them understand triangular partnerships.";
      let s4 = ui.isMobile ? "Tap the network and sliders to understand what they represent." : "Hover over the network and sliders to understand what they represent.";
      
      displayInstruction(s1, 5500);
      setTimeout(() => { if (!userHasInteracted) displayInstruction(s2, 5500); }, 6000);
      setTimeout(() => { if (!userHasInteracted) displayInstruction(s3, 6500); }, 12000);
      setTimeout(() => { if (!userHasInteracted) displayInstruction(s4, 5000); }, 19000);
    }

    let isInteractingWithNodes = ui.isMobile ? mouseIsPressed : true;
    
    if (isInteractingWithNodes && frameCount % 10 === 0) { 
      for (let n of nodes) {
        if (dist(mouseX, mouseY, n.pos.x, n.pos.y) < n.currentSize) {
          userHasInteracted = true; 
          
          if (n.row === 0 && !hasShownDev) {
            displayInstruction("Developed countries – the brightest nodes, always full brightness to represent full resources.");
            hasShownDev = true;
          } else if (n.row === 1 && !hasShownDeveloping) {
            displayInstruction("Developing countries – receive resources from the top row.");
            hasShownDeveloping = true;
          } else if (n.row > 1 && !hasShownLDC) {
            displayInstruction("LDCs receive resources and gradually become brighter over time.");
            hasShownLDC = true;
          }
          break; 
        }
      }
    }

    let allPowered = nodes.length > 20 && nodes.every(n => n.isPowered);
    if (allPowered && !hasShownEnd && introSequenceStarted) {
      setTimeout(() => {
        displayInstruction("Once all nodes are connected, press “Next Stage” to transition to the next part of the artwork.", 8000);
        hasShownEnd = true;
      }, 2000); 
    }
    
    drawArt();           
    autoTriggerPulses(); 
    drawCinematicBars(); 
    
    if (!ui.isMobile) {
      let uiX = 70;
      let opac = mouseX < ui.sidebarW + 50 || activeSlider !== null ? 255 : 80;
      
      drawHUDSlider(uiX, height / 2 - 150, sliderFunding, "Funding", 1, opac, false);
      drawHUDSlider(uiX + 90, height / 2 - 150, sliderKnowledge, "Knowledge", 3, opac, false);
      drawHUDSlider(uiX, height / 2 + 150, sliderTech, "Tech", 2, opac, false);
      
    } else {
      let opac = mouseY > height - 190 || activeSlider !== null ? 255 : 120;
      let sliderW = (width - 60) / 2;
      let yBottom = height - 130;
      let yTop = yBottom - 45; 

      drawHUDSlider(width / 2 - sliderW / 2 - 10, yTop, sliderTech, "Technology", 2, opac, true);
      drawHUDSlider(width / 2 - sliderW / 2 - 10, yBottom, sliderFunding, "Funding", 1, opac, true);
      drawHUDSlider(width / 2 + sliderW / 2 + 10, yBottom, sliderKnowledge, "Knowledge", 3, opac, true);
    }
  }
  
  if (appState !== "INTRO") {
    drawHomeButton();    
    drawSoundButton(); 
  }
}

// --- 4. NETWORK LOGIC ---

function initInitialNetwork() {
  nodes = [];
  
  currentMaxRow = ui.isMobile ? 4 : 5; 
  
  for (let r = 0; r <= currentMaxRow; r++) {
    let bottomSpread = ui.isMobile ? height * 0.70 : height * 0.82;
    let y = map(r, 0, currentMaxRow, height * 0.22, bottomSpread);
    
    let nodesInRow = r + 2; 
    let rowWidth = map(r, 0, currentMaxRow, width * 0.1, width * 0.8);
    
    for (let i = 0; i < nodesInRow; i++) {
      let x = map(i, 0, nodesInRow - 1, centerX - rowWidth/2, centerX + rowWidth/2);
      let nodeType = (r === 0) ? 'developed' : (r === 1 ? 'developing' : 'ldc');
      let size = (r === 0) ? (ui.isMobile ? 50 : 80) : (r === 1 ? 35 : 18);
      
      nodes.push(new Node(x, y, size, nodeType, (r <= 1), r));
    }
  }
  refreshConnections(); 
}

function spawnNewFloor() {
  if (nodes.length > 150) return; 
  
  let currentDeepestY = 0;
  nodes.forEach(n => { if(n.pos.y > currentDeepestY) currentDeepestY = n.pos.y; });

  currentMaxRow++;
  let r = currentMaxRow;
  let newY = currentDeepestY + 90; 
  
  let bottomLimit = ui.isMobile ? height - 380 : height - 140;
  if (newY > bottomLimit) return; 

  let nodesInRow = min(r + 2, 8); 
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
      
      let baseAlpha = (f.a.row === 0 || f.b.row === 0 || f.c.row === 0) ? 40 : 100;
      
      c.setAlpha(baseAlpha * facePower * f.a.appearanceAlpha);
      fill(c); 
      triangle(f.a.pos.x, f.a.pos.y, f.b.pos.x, f.b.pos.y, f.c.pos.x, f.c.pos.y);
    }
  }

  for (let e of edges) {
    let edgePower = min(e.a.powerLevel, e.b.powerLevel);
    let visibility = min(e.a.appearanceAlpha, e.b.appearanceAlpha);
    
    if (visibility > 0.1) {
       let baseAlpha = lerp(0, 100 * visibility, edgePower + 0.1);
       
       let techPulse = sin(frameCount * 0.05 + e.a.pos.x * 0.01) * 0.5 + 0.5; 
       let techAlpha = lerp(0, 255, sliderTech * techPulse) * visibility;
       let finalAlpha = min(255, baseAlpha + techAlpha);
       
       stroke(255, finalAlpha); 
       
       if (sliderTech > 0.1) {
           drawingContext.shadowBlur = map(sliderTech, 0, 1, 0, 15);
           drawingContext.shadowColor = '#5175B9';
       } else {
           drawingContext.shadowBlur = 0;
       }

       if (sliderTech > 0.8) {
           strokeWeight(1.5);
           drawingContext.setLineDash([]); 
       } else {
           strokeWeight(1);
           let gap = max(1, 5 - (sliderTech * 4));
           drawingContext.setLineDash([2, gap]); 
       }

       line(e.a.pos.x, e.a.pos.y, e.b.pos.x, e.b.pos.y);
       drawingContext.shadowBlur = 0; 
    }
  }
  drawingContext.setLineDash([]); 

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
  let totalSliders = sliderFunding + sliderTech + sliderKnowledge;
  
  let interval = map(pow(totalSliders / 3, 1.5), 0, 1, 240, 45); 
  
  if (frameCount % max(1, floor(interval)) === 0 && totalSliders > 0.05) {
    
    if (pulses.length > 12) return; 

    let sources = nodes.filter(n => n.row === 0);
    
    if (sources.length > 0) {
      let src = random(sources);
      let targets = nodes.filter(n => n.row === 1);
      
      if (targets.length > 0) {
        let rnd = random(totalSliders);
        let pType = 'funding';
        if (rnd > sliderFunding) pType = 'tech';
        if (rnd > sliderFunding + sliderTech) pType = 'knowledge';
        
        let speedMod = map(totalSliders / 3, 0, 1, 0.015, 0.05); 
        
        pulses.push(new RippleFlow(src, random(targets), true, pType, speedMod));
        energyOut += 0.08; 
        
        if (sourceSound && sourceSound.isLoaded() && !isMuted) {
          sourceSound.pan(map(src.pos.x, 0, width, -1.0, 1.0)); 
          sourceSound.setVolume(0.4); 
          sourceSound.play();
        }
        
        if (flowSound && flowSound.isLoaded() && !isMuted && !flowSound.isPlaying()) {
          flowSound.setVolume(0.2);
          flowSound.play();
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
    
    this.vibrateTimer = 0; 
  }

  update() {
    if (this.appearanceAlpha < 1.0) this.appearanceAlpha += 0.02;

    if (this.vibrateTimer > 0) this.vibrateTimer--;
    
    let vx = map(noise(this.noiseOffsetX), 0, 1, -1.5, 1.5);
    let vy = map(noise(this.noiseOffsetY), 0, 1, -1.5, 1.5);
    
   if (this.vibrateTimer > 0) {
        // Calculate intensity: Higher knowledge = stronger shake
        // We multiply the random range by (1 + sliderKnowledge * 3) 
        // to make it up to 4x stronger at 100% slider
        let intensity = 3 * (1 + sliderKnowledge * 3); 
        
        vx += random(-intensity, intensity);
        vy += random(-intensity, intensity);
    } else if (!this.isPowered) {
        vx = map(noise(this.noiseOffsetX), 0, 1, -8, 8);
        vy = map(noise(this.noiseOffsetY), 0, 1, -8, 8);
    }

    this.pos.x = lerp(this.pos.x, this.anchor.x + vx, 0.15);
    this.pos.y = lerp(this.pos.y, this.anchor.y + vy, 0.15);
    
    this.noiseOffsetX += 0.01; this.noiseOffsetY += 0.01;

    if (this.type === 'developed') {
      let expansion = map(constrain(energyOut, 0, 20), 0, 20, 1.0, 2.2);
      this.currentSize = this.baseSize * expansion;
      
      this.colorLerp = lerp(this.colorLerp, 1.0, 0.005); 
      this.powerLevel = 1;
    } else if (this.isPowered) {
      this.powerLevel = lerp(this.powerLevel, 1, 0.05);
      
      // Determine if color should fade to blue based on resources
      let hasColorResources = (sliderFunding > 0.01 || sliderTech > 0.01);
      let targetColor = hasColorResources ? 1.0 : 0.0;
      this.colorLerp = lerp(this.colorLerp, targetColor, 0.02);
    }
  }

 drawV() {
    push(); translate(this.pos.x, this.pos.y);
    let nodeColor = lerpColor(color(255), color(81, 117, 185), this.colorLerp);
    
    // NEW: Check if Funding or Tech is active
    let hasColorResources = (sliderFunding > 0.01 || sliderTech > 0.01);
    
    // If powered AND has color resources, go to 255. 
    // If powered but ONLY knowledge is active, keep opacity at 150 (the "unpowered" level).
    let targetAlpha = (this.isPowered && hasColorResources) ? 255 : 150;
    let alpha = targetAlpha * this.appearanceAlpha; 
    
    stroke(red(nodeColor), green(nodeColor), blue(nodeColor), alpha);
    
    // Apply condition to stroke weight so Knowledge slider doesn't thicken it
    strokeWeight((this.isPowered && hasColorResources) ? 2.5 : 1.5);
    
    noFill();
    let r = this.currentSize * 0.5;
    let p1 = {x: 0, y: -r}, p2 = {x: -r * 0.86, y: r * 0.5}, p3 = {x: r * 0.86, y: r * 0.5};
    
    if (this.isPowered) { 
      beginShape(); vertex(p1.x, p1.y); vertex(p2.x, p2.y); vertex(p3.x, p3.y); endShape(CLOSE);
    } else { 
      line(p1.x, p1.y, p2.x, p2.y); line(p1.x, p1.y, p3.x, p3.y);
    }
    
    noStroke(); fill(255, alpha);
    
    // Apply condition to corner dots size
    let ds = (this.isPowered && hasColorResources) ? 5 : 3;
    ellipse(p1.x, p1.y, ds, ds); ellipse(p2.x, p2.y, ds, ds); ellipse(p3.x, p3.y, ds, ds);
    pop();
  }

  display() {
    let hasGlowResources = (sliderFunding > 0.01 || sliderTech > 0.01);
    
    if (this.isPowered && this.appearanceAlpha > 0.1 && hasGlowResources) {
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
  constructor(start, target, triggerNext, type, speed) {
    this.startPos = createVector(start.pos.x, start.pos.y); 
    this.target = target;
    this.progress = 0;
    this.triggerNext = triggerNext;
    this.type = type;   
    this.speed = speed; 
    this.isFinished = false;
  }
  
  update() {
    this.progress += this.speed;
    if (this.progress >= 1) {
      
      if (!isMuted) {
          let sfx;
          if (this.type === 'funding') sfx = fundSound;
          else if (this.type === 'tech') sfx = techSound;
          else if (this.type === 'knowledge') sfx = knowSound;
          
          if (sfx && sfx.isLoaded()) {
              sfx.rate(random(0.9, 1.1));
              sfx.setVolume(0.5);
              sfx.play();
          }
      }

      if (!this.target.isPowered) {
        this.target.isPowered = true;
      }
      
      if (this.type === 'knowledge') {
          this.target.vibrateTimer = 25; 
      }

      if (this.target.row === currentMaxRow) {
        spawnNewFloor();
      }

      if (this.triggerNext && pulses.length < 20) {
        let nxtR = this.target.row + 1;
        let nxtT = nodes.filter(n => n.row === nxtR && dist(n.pos.x, n.pos.y, this.target.pos.x, this.target.pos.y) < connectionDistance * 2.5);
        
        if (nxtT.length > 0) {
          let shuffledPaths = nxtT.sort(() => 0.5 - Math.random());
          let branches = shuffledPaths.slice(0, 1); 
          
          branches.forEach(l => { 
            let cascadeProb = (this.type === 'funding' ? sliderFunding : (this.type === 'tech' ? sliderTech : sliderKnowledge));
            if (random(1) < cascadeProb + 0.2) {
              pulses.push(new RippleFlow(this.target, l, true, this.type, this.speed)); 
            }
          });
        }
      }
      this.isFinished = true;
    }
  }
  
  display() {
    push();
    noStroke();
    
    if (this.type === 'funding') {
        drawingContext.shadowBlur = 15;
        drawingContext.shadowColor = '#8faadc'; 
    }
    
    let trailLength = 15;
    for (let i = 0; i < trailLength; i++) {
      let t = i / trailLength;
      if (t > this.progress) continue;
      let p = p5.Vector.lerp(this.startPos, this.target.pos, t);
      let w = exp(-pow((t - this.progress) * 8, 2)); 
      
      fill(255, 255 * w); 
      ellipse(p.x, p.y, 1.2 + w * 4.5);
    }
    pop();
  }
}

// --- 6. UI & HELPER FUNCTIONS ---

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

function drawIntro() {
  push();
  let isMobile = width < 600;
  let fontSize = isMobile ? 32 : 80;

  textFont("new-spirit");
  textSize(fontSize);
  textStyle(BOLD);
  drawingContext.font = `700 ${fontSize}px new-spirit, serif`;
  noStroke();

  let txtStage = "STAGE ";
  let num1 = "0: ", text1 = "START";
  let num2 = "1: ", text2 = "PROVIDE";

  let currentNum = introStage === 1 ? num1 : num2;
  let currentText = introStage === 1 ? text1 : text2;

  slideY = lerp(slideY, targetY, 0.1);

  if (isMobile) {
    let topWidth = textWidth(txtStage) + textWidth(currentNum);
    let startX = width / 2 - topWidth / 2;

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
    let startX = width / 2 - fullWidth / 2;

    fill(255, introAlpha);
    text(txtStage, startX, targetY);

    let numX = startX + textWidth(txtStage);
    fill(255, morphAlpha);
    text(fullContent, numX, slideY);
  }
  pop();

  if (frameCount > 120 && introStage === 1) {
    morphAlpha -= 10;
    if (morphAlpha <= 0) {
      introStage = 2;
      slideY = targetY - (isMobile ? 35 : 60);
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

function drawHUDSlider(x, y, val, label, id, sliderOpacity, horizontal, customLen) {
  let len = customLen ? customLen : (ui.isMobile ? width / 2 - 50 : 180);
  let activeColor = color(81, 117, 185); 

  let over = horizontal
    ? mouseX > x - len / 2 && mouseX < x + len / 2 && mouseY > y - 20 && mouseY < y + 20
    : mouseX > x - 30 && mouseX < x + 30 && mouseY > y - 100 && mouseY < y + 100;

  let isInteracting = ui.isMobile ? mouseIsPressed : true;
  if (over && appState === "ART" && isInteracting) {
      userHasInteracted = true;
      
      if (id === 1 && !hasShownFund) {
        displayInstruction("Increase Funding: More funding pulses → nodes below become brighter, representing richer resources.");
        hasShownFund = true;
      } else if (id === 2 && !hasShownTech) {
        displayInstruction("Increase Technology: Lights get brighter and flicker → simulate technology spreading, pulse motion becomes smoother based on technological advancement.");
        hasShownTech = true;
      } else if (id === 3 && !hasShownKnow) {
        displayInstruction("Increase Knowledge: Nodes vibrate when receiving → illustrate the spread of knowledge and experience.");
        hasShownKnow = true;
      }
      
      if (hasShownFund && hasShownTech && hasShownKnow && !hasShownCombine) {
          setTimeout(() => {
              displayInstruction("Combine All Sliders: Creates a lively network where nodes activate and provide resources depending on slider percentages.", 8000);
          }, 6000); 
          hasShownCombine = true;
      }
  }

  if (mouseIsPressed && over) activeSlider = id;

  if (activeSlider === id) {
    let prevVal = val;
    let rawVal = horizontal
      ? map(mouseX, x - len / 2, x + len / 2, 0, 1)
      : map(mouseY, y + 100, y - 100, 0, 1);
    let snappedVal = round(constrain(rawVal, 0, 1) * 10) / 10;
    
    if (snappedVal !== prevVal) {
      if (sliderSound && sliderSound.isLoaded() && !isMuted) {
        sliderSound.rate(map(snappedVal, 0, 1, 0.7, 1.4)); 
        sliderSound.setVolume(map(snappedVal, 0, 1, 0.4, 0.8));
        sliderSound.play();
      }
    }
    
    if (id === 1) sliderFunding = snappedVal;
    if (id === 2) sliderTech = snappedVal;
    if (id === 3) sliderKnowledge = snappedVal;
  }

  push();
  translate(x, y);
  drawingContext.globalAlpha = sliderOpacity / 255;
  textFont("mulish-variable");

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
    text(label, 0, 125);

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

function drawCinematicBars() {
  let isMobile = width < 600;
  let barH = isMobile ? 100 : 150;
  noStroke();
  let topGrad = drawingContext.createLinearGradient(0, 0, 0, barH); 
  topGrad.addColorStop(0, 'rgba(0,0,0,1)'); 
  topGrad.addColorStop(1, 'rgba(0,0,0,0)');
  drawingContext.fillStyle = topGrad; rect(0, 0, width, barH);
  let bottomGrad = drawingContext.createLinearGradient(0, height, 0, height - barH); 
  bottomGrad.addColorStop(0, 'rgba(0,0,0,1)'); 
  bottomGrad.addColorStop(1, 'rgba(0,0,0,0)');
  drawingContext.fillStyle = bottomGrad; rect(0, height - barH, width, barH);
}

function drawSoftCircle(x, y, r, c) { 
  let cl = color(c); 
  let g = drawingContext.createRadialGradient(x, y, 0, x, y, r); 
  g.addColorStop(0, `rgba(${red(cl)}, ${green(cl)}, ${blue(cl)}, 0.15)`); 
  g.addColorStop(0.8, `rgba(${red(cl)}, ${green(cl)}, ${blue(cl)}, 0.03)`); 
  g.addColorStop(1, `rgba(${red(cl)}, ${green(cl)}, ${blue(cl)}, 0)`); 
  drawingContext.fillStyle = g; 
  circle(x, y, r * 2); 
}

function mousePressed() {
  if (getAudioContext().state !== 'running') {
    userStartAudio();
  }

  if (bgMusic && bgMusic.isLoaded() && !bgMusic.isPlaying()) {
    bgMusic.setVolume(0.3); 
    bgMusic.loop();         
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
}

function mouseReleased() { activeSlider = null; }

function windowResized() { 
  resizeCanvas(windowWidth, windowHeight); 
  updateUILayout();
  centerX = width/2; 
  targetY = height/2; 
}
