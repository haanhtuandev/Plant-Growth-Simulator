const canvas = document.getElementById("treeCanvas");
const ctx = canvas.getContext("2d");

const axiom = "F";
const rules = { "F": "FF+[+F-F-F]-[-F+F+F]" };
let sentence = axiom;
let len = 100;

function generate() {
    let nextSentence = "";
    for (let char of sentence) {
        nextSentence += rules[char] || char;
    }
    sentence = nextSentence;
    draw();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height);
    ctx.strokeStyle = "brown";

    for (let char of sentence) {
        if (char === "F") {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, -len);
            ctx.stroke();
            ctx.translate(0, -len);
        } else if (char === "+") {
            ctx.rotate(Math.PI / 6);
        } else if (char === "-") {
            ctx.rotate(-Math.PI / 6);
        } else if (char === "[") {
            ctx.save();
        } else if (char === "]") {
            ctx.restore();
        }
    }
    ctx.restore();
}

// Simulate growth over time
let iterations = 0;
function animateGrowth() {
    if (iterations < 5) {
        generate();
        len *= 0.7; // Shrink branches
        iterations++;
        setTimeout(animateGrowth, 1000);
    }
}

document.getElementById("simulate").addEventListener("click", animateGrowth);
