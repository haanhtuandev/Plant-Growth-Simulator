const rules = {
  "X": [
    { rule: "(F[+X][-X]FX)", prob: 0.3 },              // Basic branching with two branches
    { rule: "(F[+X][-X][+X][-X]FX)", prob: 0.2 },      // Four branches for denser growth
    { rule: "(F[+X]F[-X]FXL)", prob: 0.2 },            // Two branches plus a leaf
    { rule: "(F[+X][-X]F[+X][-X]FXL)", prob: 0.15 },   // Four branches with a leaf
    { rule: "(F[[+X]L][-X]FXL)", prob: 0.15 }          // Nested branching with leaf clusters
  ],
  F: [ //defining drawing rules
    { rule: "F(F)",  prob: 0.7 },
    { rule: "F(FF)", prob: 0.05 },
    { rule: "F",     prob: 0.25  },
  ],
  "(": "",
  ")": ""
};

const len = 4; //length
const ang = 25; //rotating angle

let drawRules;
let word = "X"; // Letter which is used to draw
const maxGeneration = 8; //number of iteration
let currGeneration = 0;
let growthPercent = 1;
let started = false;
let tempMax = 26; 
let tempMin = 14;
let moisture = 60;
const optimalTemp = { min: 15, max: 25 }; //optimal temperature range
const optimalMoist = { min: 50, max: 70 }; //optimal moisture range
const tBase = 5; //temperature base
const totalGDDRequired = 800; // Total GDD to mature
let accumulatedGDD = 0; //tracking GDD accumulated

// Add lifecycle states
let plantState = "growing"; // possible states: "growing", "mature", "dormant"
let maturityDuration = 200; // How long the plant stays mature before dormancy (in frames)
let maturityCounter = 0;    // Counter for tracking time spent in mature state

function setup() {
  canvas = createCanvas(windowWidth*0.5, windowHeight*0.9); //background
  canvas.parent("visual-container");
  noLoop();
  select("#simulate").mousePressed(() => {
    if (!started) {
      started = true;
      loop(); // Start draw() loop when button is clicked
    }
  });
  strokeWeight(2); 


  select("#min-temp").input(() => {
    tempMin = int(select("#min-temp").value());
  });
  select("#max-temp").input(() => {
    tempMax = int(select("#max-temp").value());
  });

  select("#moist").input(() => {
    moisture = int(select("#moist").value());
  });

  drawRules = {
    "L": (t) => { //drawing leaves rules
      noStroke();
      let temperature = (tempMax + tempMin)/2; //average temperature of a day
      let leafWidth, leafHeight;
      if (temperature > optimalTemp.max) {
        leafWidth = 0.5 * len * t;  // Curled: narrower
        leafHeight = 2.5 * len * t;   // Curled: shorter
      } else {
        leafWidth = len * t;
        leafHeight = 3 * len * t;
      }

      let leafColor;
      if (moisture < optimalMoist.min && temperature < optimalTemp.min) {
        leafColor = color(255, 178, 102); // Pale brown
      } else 
        if (moisture < optimalMoist.min && temperature > optimalTemp.max) {
        leafColor = color(153, 76, 0);   // Dark brown
      } else {
        if (moisture > optimalMoist.max && temperature < optimalTemp.min) {
          leafColor = color(128, 128, 128); // Pale dark 
        } else 
        if (moisture > optimalMoist.max && temperature > optimalTemp.min){
          leafColor = color(0, 102, 0);     // Dark green
        }else 
        if (moisture < optimalMoist.min){
          leafColor = color(204, 102, 0) //brown
        }
        else if(moisture > optimalMoist.max){
          leafColor = color(0, 102, 0) //dark green
        }
        else if(temperature < optimalTemp.min){
          leafColor = color(153, 255, 153)
        } //pale green
        // else {leafColor = color(0, 204, 0)}
        else {leafColor = color(255, 204, 204)} //green
      }

      fill(leafColor);
      ellipse(0, 0, leafWidth, leafHeight); //leaves shape
    },
    "F": (t) => {
      stroke("#9ea93f"); //branches color
      line(0, 0, 0, -len * t);
      translate(0, -len * t);
    },
    "+": (t) => { 
      rotate(PI / 180 * -ang * t);
    },
    "-": (t) => {
      rotate(PI / 180 * ang * t);
    },
    "[": push,
    "]": pop,
  };
}

function draw() {
  background(28);
  let temperature = (tempMax + tempMin)/2; //average temperature of a day

  // Display current plant state and info
  textSize(16);
  fill(255);
  
  let remainingGDD = Math.max(0, totalGDDRequired - accumulatedGDD);
  text(`Remaining GDD: ${Math.floor(remainingGDD)}`, 10, 20);
  text(`Plant State: ${plantState}`, 10, 40);
  text(`Temperature: ${temperature.toFixed(1)}°C`, 10, 60);
  text(`Moisture: ${moisture}%`, 10, 80);
  
  if (plantState === "growing") {
    // Calculate required GDD per generation
    const GDDPerGeneration = totalGDDRequired / maxGeneration;
    
    // Calculate daily GDD based on temperature
    let dailyGDD = Math.max(0, ((tempMax + tempMin)/2) - tBase);
    
    // Adjust growth rate based on daily GDD and required GDD per generation
    let growthRate = map(dailyGDD, 0, 40, 0.01, 0.1) * (dailyGDD / GDDPerGeneration) * 2;
    
    if (growthPercent < 1) {
      const mod = (currGeneration + growthPercent);
      growthPercent += growthRate / mod;
    } else {
      nextGeneration();
    }
  } 
  else if (plantState === "mature") {
    // Plant is fully grown, count maturity duration
    maturityCounter++;
    
    // Visual indicator that plant is mature
    if (frameCount % 60 < 30) {  // Blink effect
      fill(0, 255, 0);  // Green text
      text("🌱 Plant Mature! 🌱", 0, 100);
    }
    
    // After maturity period, transition to dormant
    if (maturityCounter >= maturityDuration) {
      plantState = "dormant";
      maturityCounter = 0;
    }
  }
  else if (plantState === "dormant") {
    // Plant is dormant, waiting for restart
    fill(255);
    text(" Click to plant new seed", 0, 100);
    
    // Check for mouse click to restart
    if (mouseIsPressed) {
      restartGrowth();
    }
  }

  // Draw the current state of the plant
  drawLsysLerp(width / 2, height, word, growthPercent);
}

function mouseReleased() {
  // Only trigger generation if plant is in growing state
  if (plantState === "growing") {
    nextGeneration();
  }
  else if (plantState === "dormant") {
    restartGrowth();
  }
}

function nextGeneration() {
  // Only proceed if growth conditions are met 
  if (growthPercent < 1) return;
  
  const GDDPerGeneration = totalGDDRequired / maxGeneration; 
  accumulatedGDD += GDDPerGeneration;
  
  // Check if maturity is reached or max iterations are hit
  if (currGeneration + 1 >= maxGeneration) {
    accumulatedGDD = totalGDDRequired;  // Ensure GDD is exactly at total required
    plantState = "mature";  // Change state to mature
  } else {
    word = generate(word); // update tree structure
    currGeneration++;
    growthPercent = 0;
  }
}

function restartGrowth() {
  // Reset everything to start a new growth cycle
  currGeneration = 0;
  word = "X";
  accumulatedGDD = 0;
  growthPercent = 0;
  plantState = "growing";
  maturityCounter = 0;
}

function generate(word) {
  let next = "";
  for (let i = 0; i < word.length; i++) {
    let c = word[i];
    if (c in rules) {
      let rule = rules[c];
      if (Array.isArray(rule)) {
        next += chooseOne(rule); //choose one of the rule 
      } else {
        next += rules[c];
      }
    } else {
      next += c;
    }
  }
  return next;
}

function chooseOne(ruleSet) {
  let n = random();
  let t = 0;
  for (let i = 0; i < ruleSet.length; i++) {
    t += ruleSet[i].prob;
    if (t > n) return ruleSet[i].rule;
  }
  return "";
}

function drawLsysLerp(x, y, state, t) {
  t = constrain(t, 0, 1);
  let lerpOn = false;
  push();
  translate(x, y);
  for (let i = 0; i < state.length; i++) {
    let c = state[i];
    if (c === "(") {
      lerpOn = true;
      continue;
    }
    if (c === ")") {
      lerpOn = false;
      continue;
    }
    let lerpT = lerpOn ? t : 1;
    if (c in drawRules) {
      drawRules[c](lerpT);
    }
  }
  pop();
}