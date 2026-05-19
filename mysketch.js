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
let soundHover = false;
let isMuted = false;
let hasShownInstr1 = false; 
let hasShownInstr2 = false; 
let hasShownHubInstr = false;
let hasShownLDCInstr = false;

let sliderSpeed = 0.5;
let sliderStrength = 0.5;
let activeSlider = null;

let introStage = 1;
let targetY, slideY;
let morphAlpha = 255;

let homeImg;
let soundOnImg, soundOffImg;
let clickSound,
  pulseSound,
  progressSound,
  completeSound,
  sliderUpSound,
  sliderDownSound;
let bgMusic;

// --- RESPONSIVE & GRID SETTINGS ---
let ui = {
  isMobile: false,
  sidebarW: 180,
  margin: 50,
  smallSize: 18,
  bigSize: 54,
  // Font Sizes
  fPercent: 12,
  fLabel: 10,
  fNav: 16,
  fIntro: 60,
};

function preload() {
  homeImg = loadImage("house.png");
  soundOnImg = loadImage("sound-on.png");
  soundOffImg = loadImage("sound-off.png");
  clickSound = loadSound("click(edited).wav");
  pulseSound = loadSound("resource-flow.wav");
  progressSound = loadSound("node-bloom.wav");
  completeSound = loadSound("small-triangle-completed.wav");
  sliderUpSound = loadSound("slider-louder(edited).wav");
  sliderDownSound = loadSound("slider-quiter(edited).wav");
    bgMusic = loadSound("backgroundchau.wav");

}

function setup() {
  createCanvas(windowWidth, windowHeight);
  updateUILayout();
  initializeNetwork();

  targetY = height / 2;
  slideY = targetY;

  bokehParticles = [];
  for (let i = 0; i < 8; i++) {
    bokehParticles.push({
      x: random(width),
      y: random(height),
      anchorX: random(width),
      anchorY: random(height),
      size: random(150, 300),
      col: random(["#66ffc4", "#ffffff", "#99ffdd"]),
      phaseX: random(TWO_PI),
      phaseY: random(TWO_PI),
      speedX: random(0.001, 0.004),
      speedY: random(0.001, 0.004),
      driftRange: random(40, 80),
    });
  }
}

function updateUILayout() {
  ui.isMobile = width < 700;
  ui.smallSize = ui.isMobile ? 12 : 18;
  ui.bigSize = ui.smallSize * 3;
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
function initializeNetwork() {
  nodes = [];
  hubs = [];
  pulses = [];

  // Boundaries & Setup
  let leftLimit = ui.isMobile ? 50 : ui.sidebarW + 70;
  let rightLimit = ui.isMobile ? width - 50 : width - 100;
  let availableWidth = rightLimit - leftLimit;
  let centerX = leftLimit + availableWidth * 0.45;

  let topY = ui.isMobile ? height * 0.22 : height * 0.12;
  let bottomY = ui.isMobile ? height * 0.62 : height * 0.78;

  // Bottom Layer
  let pBottomLeft = createVector(leftLimit, bottomY);
  let pBottomCenter = createVector(centerX, bottomY);
  let pBottomRight = createVector(leftLimit + availableWidth * 0.9, bottomY);

  // Top Layer
  let pTop = createVector(random(leftLimit + 20, rightLimit - 20), topY);

  // Middle Layer
  let pMidLeft = p5.Vector.lerp(pTop, pBottomLeft, 0.5);
  let pMidRight = p5.Vector.lerp(pTop, pBottomRight, 0.5);

  let hubPos = [
    pTop,
    pMidLeft,
    pMidRight,
    pBottomLeft,
    pBottomCenter,
    pBottomRight,
  ];

  hubPos.forEach((pos) => {
    let hub = new Node(pos.x, pos.y, ui.bigSize, "hub", true);
    hubs.push(hub);
    nodes.push(hub);
  });

  // --- INCREASED PATH NODES ---
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
    let h1 = hubs[pair[0]],
      h2 = hubs[pair[1]];

    // On desktop, we now place TWO nodes along each connection line instead of one
    let nodeSteps = ui.isMobile ? [0.5] : [0.35, 0.65];

    nodeSteps.forEach((t) => {
      let px = lerp(h1.anchor.x, h2.anchor.x, t);
      let py = lerp(h1.anchor.y, h2.anchor.y, t);

      if (!checkOverlap(px, py, ui.smallSize * 1.2)) {
        let n = new Node(px, py, ui.smallSize * 1.1, "ldc", false);
        n.parentHub = h1;
        nodes.push(n);
      }
    });
  });

  // --- INCREASED PETAL COUNT ---
  // Increased from 6 to 9 for desktop
  let count = ui.isMobile ? 3 : 9;

  hubs.forEach((h) => {
    for (let i = 0; i < count; i++) {
      let attempts = 0,
        placed = false;
      // Increased max attempts to 40 to help find space for the higher count
      while (!placed && attempts < 40) {
        let angle = random(TWO_PI);
        let d = min(width, height) * (ui.isMobile ? 0.12 : 0.09);
        let x = h.anchor.x + cos(angle) * d;
        let y = h.anchor.y + sin(angle) * d;

        if (!checkOverlap(x, y, ui.smallSize)) {
          let petal = new Node(x, y, ui.smallSize, "ldc", false);
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
  let leftWall = ui.isMobile ? size + 10 : ui.sidebarW + 20;

  // Keep the safety boundaries the same
  if (x < leftWall || x > width - size - 10 || y < 80 || y > height - 120)
    return true;

  for (let n of nodes) {
    // REDUCED BUFFER: Changed from 25 to 15 to allow higher density
    if (dist(x, y, n.anchor.x, n.anchor.y) < size / 2 + n.size / 2 + 15)
      return true;
  }
  return false;
}
function draw() {
  background(4, 6, 12);
  if (appState === "INTRO") {
    drawIntro();
  } else {
    let footer = select("#dynamic-footer");
    if (footer && !footer.hasClass("show-now")) {
      footer.addClass("show-now");
    }
    
    let instr = select('#instruction-text'); 

    if (!hasShownHubInstr && appState === "ART") {
      for (let h of hubs) {
        if (dist(mouseX, mouseY, h.pos.x, h.pos.y) < h.size / 2) {
          let instr = select('#instruction-text');
          if (instr) {
            instr.html("I'm the developing country");
            instr.addClass('show-instruction');
            hasShownHubInstr = true;
            setTimeout(() => instr.removeClass('show-instruction'), 5000);
          }
          break; 
        }
      }
    }
    
    if (!hasShownLDCInstr) {
        for (let n of nodes) {
          if (n.type === 'ldc') {
            if (dist(mouseX, mouseY, n.pos.x, n.pos.y) < n.size) {
              instr.html("I'm the least developed country (LDC)");
              instr.addClass('show-instruction');
              hasShownLDCInstr = true;
              setTimeout(() => instr.removeClass('show-instruction'), 5000);
              break; 
            }
          }
        }
      }

    manageHubActivity();
    drawArt();
    autoTriggerPulses();
    drawCinematicBars();

    if (!ui.isMobile) {
      let uiX = 70;
      let opac = mouseX < ui.sidebarW || activeSlider !== null ? 255 : 80;
      drawHUDSlider(
        uiX,
        height / 2 - 150,
        sliderSpeed,
        "Generousity",
        1,
        opac,
        false
      );
      drawHUDSlider(
        uiX,
        height / 2 + 150,
        sliderStrength,
        "Growth Solutions",
        2,
        opac,
        false
      );
    } else {
      let opac = mouseY > height - 150 || activeSlider !== null ? 255 : 120;
      let sliderW = (width - 60) / 2;
      drawHUDSlider(
        width / 2 - sliderW / 2 - 10,
        height - 130,
        sliderSpeed,
        "Generosity",
        1,
        opac,
        true
      );
      drawHUDSlider(
        width / 2 + sliderW / 2 + 10,
        height - 130,
        sliderStrength,
        "Growth Solutions",
        2,
        opac,
        true
      );
    }
  }
  drawHomeButton();
  drawSoundButton();
}

function drawSoundButton() {
  let size = ui.isMobile ? 24 : 32;
  let marginX = ui.isMobile ? 25 : 54;
  let y = ui.isMobile ? 30 : 45;
  let x = width - marginX - size;

  soundHover =
    mouseX > x && mouseX < x + size && mouseY > y && mouseY < y + size;

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

function drawHUDSlider(x, y, val, label, id, sliderOpacity, horizontal) {
  let len = ui.isMobile ? width / 2 - 50 : 180;
  let activeColor = color("#2FE197");
  let over = horizontal
    ? mouseX > x - len / 2 &&
      mouseX < x + len / 2 &&
      mouseY > y - 30 &&
      mouseY < y + 30
    : mouseX > x - 30 &&
      mouseX < x + 30 &&
      mouseY > y - 100 &&
      mouseY < y + 100;
  
  if (over && appState === "ART") {
    let instr = select('#instruction-text');
    
    // Check Slider 1 (Generosity)
    if (id === 1 && !hasShownInstr1) {
      instr.html("Slide up the slider to foster the connection between developing and least developed countries.");
      instr.addClass('show-instruction');
      hasShownInstr1 = true;
      // Auto-hide after 5 seconds
      setTimeout(() => instr.removeClass('show-instruction'), 5000);
    } 
    // Check Slider 2 (Growth Solutions)
    else if (id === 2 && !hasShownInstr2) {
      instr.html("Move the slider up to encourage developing countries to share more resources.");
      instr.addClass('show-instruction');
      hasShownInstr2 = true;
      setTimeout(() => instr.removeClass('show-instruction'), 5000);
    }
  }
  
  if (mouseIsPressed && over) activeSlider = id;

  if (activeSlider === id) {
    let prevVal = val;
    let rawVal = horizontal
      ? map(mouseX, x - len / 2, x + len / 2, 0, 1)
      : map(mouseY, y + 100, y - 100, 0, 1);
    let snappedVal = round(constrain(rawVal, 0, 1) * 10) / 10;
    if (snappedVal > prevVal && sliderUpSound.isLoaded()) sliderUpSound.play();
    if (snappedVal < prevVal && sliderDownSound.isLoaded())
      sliderDownSound.play();
    if (id === 1) sliderSpeed = snappedVal;
    if (id === 2) sliderStrength = snappedVal;
  }

  push();
  translate(x, y);
  drawingContext.globalAlpha = sliderOpacity / 255;
  textFont("mulish-variable");

  if (horizontal) {
    textAlign(LEFT, CENTER);
    drawingContext.font = `500 ${ui.fLabel}px mulish-variable, sans-serif`; // Changed to 700
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
    if (words.length > 1) {
      text(words[0], 0, 125);
      text(words[1], 0, 130 + ui.fLabel);
    } else {
      text(label, 0, 125);
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
    circle(0, map(val, 0, 1, 100, -100), 16); // Knob
  }
  pop();
}

class Node {
  constructor(x, y, size, type, isComplete) {
    this.isFullyMatured = false;
    this.anchor = createVector(x, y);
    this.pos = createVector(x, y);
    this.size = size;
    this.type = type;
    this.isPowered = isComplete;
    this.completionProgress = isComplete ? 1 : 0;
    this.powerLevel = isComplete ? 1 : 0;
    this.noiseOffsetX = random(1000);
    this.noiseOffsetY = random(2000);
    this.colorLerp = 0.0;
    this.parentHub = null;
    this.isActiveSharing = false;
  }

  update() {
    let jitter = this.isPowered ? 1.0 : 3.0;
    this.pos.x =
      this.anchor.x + map(noise(this.noiseOffsetX), 0, 1, -jitter, jitter);
    this.pos.y =
      this.anchor.y + map(noise(this.noiseOffsetY), 0, 1, -jitter, jitter);
    this.noiseOffsetX += 0.01;
    this.noiseOffsetY += 0.01;

    if (this.type === "hub") {
      let myChildren = nodes.filter((n) => n.parentHub === this);
      this.isFullyMatured =
        myChildren.length > 0 && myChildren.every((c) => c.isPowered);
    }
    if (this.isPowered) {
      this.powerLevel = lerp(this.powerLevel, 1, 0.05);
      this.colorLerp = lerp(this.colorLerp, 1.0, 0.02);
    }
  }

  receiveEnergy(amount) {
    if (this.completionProgress < 1.0) {
      this.completionProgress += amount;
      if (progressSound.isLoaded()) {
        let progVol = lerp(0.6, 0.3, pow(sliderSpeed, 1.5));
        progressSound.setVolume(progVol);
    
        if (!progressSound.isPlaying()) {
          progressSound.play();
        }
      }

      if (this.completionProgress >= 1.0) {
        this.completionProgress = 1.0;
        this.powerUp();
      }
    }
  }

  drawV() {
    push();
    translate(this.pos.x, this.pos.y);

    let baseColor =
      this.type === "hub"
        ? color("#2FE197")
        : lerpColor(color(255), color("#98FB98"), this.colorLerp);

    let alphaVal;
    if (this.type === "hub") {
      if (this.isActiveSharing) {
        alphaVal = 255;
      } else if (this.isFullyMatured) {
        alphaVal = 200;
      } else {
        alphaVal = 200;
      }
    } else {
      alphaVal = map(this.completionProgress, 0, 1, 48, 255);
    }

    let curW = 2;
    if (this.type === "hub") {
      if (this.isFullyMatured) {
        curW = 2.0;
        drawingContext.shadowBlur = 20;
        drawingContext.shadowColor = "#2FE197";
      } else if (this.isActiveSharing) curW = 3.0;
    }

    strokeWeight(curW);
    stroke(red(baseColor), green(baseColor), blue(baseColor), alphaVal);
    noFill();

    let r = this.size * 0.5;
    let p0 = { x: 0, y: -r },
      p1 = { x: -r * 0.86, y: r * 0.5 },
      p2 = { x: r * 0.86, y: r * 0.5 };

    line(p0.x, p0.y, p1.x, p1.y);
    line(p0.x, p0.y, p2.x, p2.y);
    line(
      p1.x,
      p1.y,
      lerp(p1.x, p2.x, max(this.completionProgress, 0.001)),
      lerp(p1.y, p2.y, max(this.completionProgress, 0.001))
    );

    // --- VERTEX DOTS OPACITY ---
    // Apply the same alphaVal to the white dots at the corners
    fill(255, alphaVal);
    noStroke();
    let ds = this.isPowered ? (ui.isMobile ? 3 : 5) : ui.isMobile ? 1.5 : 2.5;
    ellipse(p0.x, p0.y, ds, ds);
    ellipse(p1.x, p1.y, ds, ds);
    ellipse(p2.x, p2.y, ds, ds);
    pop();
  }

  display() {
    // Only draw the aura if it's an active sharing hub or a powered small node
    if (this.type === "hub" && !this.isActiveSharing) return;

    if (this.isPowered || this.isActiveSharing) {
      let nodeColor = this.type === "hub" ? color("#2FE197") : color("#B5FCB5");

      // EFFECT: Active sharing aura is much larger (size * 2.5)
      let auraMult = this.type === "hub" && this.isActiveSharing ? 1.8 : 1.2;
      let currentRadius = this.size * auraMult;

      let grad = drawingContext.createRadialGradient(
        this.pos.x,
        this.pos.y,
        0,
        this.pos.x,
        this.pos.y,
        currentRadius
      );

      // EFFECT: Active sharing glow is clearer (0.4 opacity)
      let glowAlpha =
        this.type === "hub" && this.isActiveSharing
          ? 0.4
          : map(this.completionProgress, 0, 1, 0.05, 0.15);

      grad.addColorStop(
        0,
        `rgba(${red(nodeColor)}, ${green(nodeColor)}, ${blue(
          nodeColor
        )}, ${glowAlpha})`
      );
      grad.addColorStop(1, `rgba(0,0,0,0)`);

      drawingContext.fillStyle = grad;
      noStroke();
      circle(this.pos.x, this.pos.y, currentRadius * 2);
    }
  }

  powerUp() {
    this.isPowered = true;
    if (completeSound && completeSound.isLoaded()) {
      let compVol = lerp(0.5, 0.3, sliderSpeed);
      completeSound.setVolume(compVol);
      
      let baseRate = this.type === "hub" ? 0.8 : 1.2;
      completeSound.rate(baseRate + random(-0.1, 0.1));
      
      completeSound.play();
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
  nodes.forEach((n) => {
    if (n.parentHub) {
      strokeWeight(1);
      drawingContext.setLineDash([3, 6]);
      stroke(255, lerp(40, 180, n.powerLevel));
      line(n.parentHub.pos.x, n.parentHub.pos.y, n.pos.x, n.pos.y);
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

function manageHubActivity() {
  if (millis() > hubCycleTimer) {
    hubs.forEach((h) => (h.isActiveSharing = false));
    let shuffled = shuffle([...hubs]);
    for (let i = 0; i < random([1, 2]); i++) shuffled[i].isActiveSharing = true;
    hubCycleTimer = millis() + random(4000, 6000);
  }
}

function autoTriggerPulses() {
  // Speed/Frequency calculation
  let triggerInterval = map(pow(sliderSpeed, 2), 0, 1, 150, 5);

  if (frameCount % max(1, floor(triggerInterval)) === 0) {
    let activeHubs = hubs.filter((h) => h.isActiveSharing);

    if (activeHubs.length > 0) {
      let randomHub = random(activeHubs);

      // --- HIGH-FIDELITY AUDIO CLEANUP ---
      if (pulseSound.isLoaded()) {
        let vol = lerp(0.6, 0.3, pow(sliderSpeed, 2));
        pulseSound.setVolume(vol);

        let pitch = map(sliderSpeed, 0, 1, 0.9, 1.4) + random(-0.3, 0.3);
        pulseSound.rate(pitch);
        pulseSound.pan(random(-0.6, 0.6));
        if (sliderSpeed > 0.7) {
          if (random(1) < 0.75) pulseSound.play();
        } else {
          pulseSound.play();
        }
      }

      // --- PULSE VISUAL GENERATION ---
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
  let num1 = "1: ",
    text1 = "PROVIDE";
  let num2 = "2: ",
    text2 = "SHARE";

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

  if (frameCount > 80 && introStage === 1) {
    morphAlpha -= 15;
    if (morphAlpha <= 0) {
      introStage = 2;
      slideY = targetY - (isMobile ? 35 : 60);
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
  let x = ui.isMobile ? 25 : 54;
  let y = ui.isMobile ? 30 : 45;
  let size = ui.isMobile ? 24 : 32;
  homeHover =
    mouseX > x && mouseX < x + size && mouseY > y && mouseY < y + size;
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
  drawingContext.fillStyle = g;
  circle(x, y, r * 2);
}

function mousePressed() {
  if (getAudioContext().state !== "running") {
    userStartAudio();
  }
if (bgMusic && bgMusic.isLoaded() && !bgMusic.isPlaying()) {
    bgMusic.setVolume(0.3); // Set this low so it doesn't overpower your sound effects
    bgMusic.loop();         // .loop() instead of .play() so it repeats forever
  }
  
  if (soundHover) {
    isMuted = !isMuted;
    if (isMuted) outputVolume(0);
    else outputVolume(1);
    return;
  }

  if (clickSound.isLoaded() && !isMuted) clickSound.play();
  if (homeHover) window.location.href = "index.html";
}

function mouseReleased() {
  activeSlider = null;
}

class RippleFlow {
  constructor(start, target, strength) {
    this.startPos = createVector(start.pos.x, start.pos.y);
    this.target = target;
    this.progress = 0;
    this.speed = 0.025;
    this.strength = strength;
    this.isFinished = false;
  }

  update() {
    this.progress += this.speed;
    if (this.progress >= 1) {
      this.target.receiveEnergy(map(this.strength, 0, 1, 0.08, 0.2));
      this.isFinished = true;
    }
  }

  display() {
    push();
    noStroke();

    // 1. Determine how many "segments" the pulse has based on slider
    // Low strength = 1 segment, High strength = up to 5 segments
    let segments = floor(map(this.strength, 0, 1, 1, 5));

    // 2. Determine brightness/opacity
    // Low strength = pale (100), High strength = bright (255)
    let baseAlpha = map(this.strength, 0, 1, 80, 255);

    // 3. Draw the pulse segments (The Comet Tail)
    for (let i = 0; i < segments; i++) {
      // Each segment is slightly behind the one before it
      let offset = i * 0.02;
      let currentProg = max(0, this.progress - offset);

      // Calculate position on the path
      let p = p5.Vector.lerp(this.startPos, this.target.pos, currentProg);

      // Calculate visual properties for each segment
      // The lead segment (i=0) is largest and brightest
      let sizeMult = map(i, 0, segments, 1, 0.4);
      let alphaMult = map(i, 0, segments, 1, 0.2);
      let pulseSize = (ui.isMobile ? 3 : 6) * sizeMult;

      // If strength is high, make the lead circle glow green
      if (this.strength > 0.7 && i === 0) {
        fill(255); // Bright Green lead
        // Optional: add a tiny bit of glow
      } else {
        fill(255, baseAlpha * alphaMult); // Pale white tail
        drawingContext.shadowBlur = 0;
      }

      ellipse(p.x, p.y, pulseSize, pulseSize);
    }
    pop();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  updateUILayout();
  initializeNetwork();
}
