let screen_width = window.innerWidth, screen_height = window.innerHeight;
let canvas_width, canvas_height;
let fps = 30, paused = false;
let mobile;
let startTime;
let elapsedTime = 0;
let lastUpdateTime;
let energyData = [];
let timeData = [];
let powerData = [];


if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    mobile = true;
} else {
    mobile = false;
}

let canvas = document.getElementById("canvas");
let context = canvas.getContext("2d");

let n_input = document.getElementById("n-input");

let heat_display = document.getElementById("heat-display");
let heat_input = document.getElementById("heat-input");
let energy_consummed_display = document.getElementById("energy-consummed")

let temp_display = document.getElementById("temp-display");
let z_display = document.getElementById("z-display");
let n_display = document.getElementById("n-display");
let chronometer_display = document.getElementById("chronometer-display")
let power_display = document.getElementById("power-display")

let pause_button = document.getElementById("pause-button");
let ic_button = document.getElementById("ic-button");

if (mobile) {
    canvas_width = 0.9 * screen_width;
}
else {
    canvas_width = 0.7 * screen_width;
}
canvas_height = canvas_width / 1.618;

canvas.width = canvas_width;
canvas.height = canvas_height;

let animate = window.requestAnimationFrame
    || window.webkitRequestAnimationFrame
    || window.mozRequestAnimationFrame
    || function (callback) {
        window.setTimeout(callback, 1000 / fps);
    };

// Function to start the chronometer
function startChronometer() {
    if (!startTime) { // Initialize startTime if it's not set
        startTime = Date.now();
    } else {
        // Adjust startTime to account for paused time
        startTime += Date.now() - lastUpdateTime;
    }
    updateElapsedTime(); // Start updating elapsed time immediately
}

// Function to pause the chronometer
function pauseChronometer() {
    lastUpdateTime = Date.now(); // Save the last update time before pausing
}

// Function to update the elapsed time
function updateElapsedTime() {
    if (!paused) {
        elapsedTime = Date.now() - startTime; // Calculate the elapsed time
        requestAnimationFrame(updateElapsedTime); // Continue updating
    }
}

 // Function to format the elapsed time in hh:mm:ss format
function formatElapsedTime() {
    let seconds = Math.floor(elapsedTime / 1000); // Convert milliseconds to seconds
    let hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    let minutes = Math.floor(seconds / 60);
    seconds %= 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}



window.onload = function() {
    initParams();
    startChronometer();
    createAutomationControls();
    animate(step);
}

let previousInterval = -1;

function step() {
    if (!paused) {
        updateElapsedTime();
        update();
    }
    render();
    animate(step);

    let interval = Math.floor(elapsedTime / 1000); // seconds

    if (interval !== previousInterval) {
      previousInterval = interval;

      if (interval % 5 === 0 && interval !== 0) {
        heatContainer();
        toggleIC();
      }
    }

    chronometer_display.innerHTML = `Elapsed Time: ${formatElapsedTime()}`;
}

let click_x, click_y, pressed;

if(mobile) {
    canvas.addEventListener("touchstart", function (e) {
        getTouchPosition(canvas, e);
        let touch = e.touches[0];
        let mouseEvent = new MouseEvent("mousedown", {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
        pressed = true;
        clicked();
    }, false);

    canvas.addEventListener("touchmove", function (e) {
        getTouchPosition(canvas, e);
        let touch = e.touches[0];
        let mouseEvent = new MouseEvent("mousemove", {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
        moved();
    }, false);

    canvas.addEventListener("touchend", function (e) {
        getTouchPosition(canvas, e);
        let touch = e.touches[0];
        let mouseEvent = new MouseEvent("mouseup", {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
        pressed = false;
        released();
    }, false);
}
else {
    canvas.addEventListener("mousedown", function (e) {
        getMousePosition(canvas, e);
        pressed = true;
        clicked();
    });

    canvas.addEventListener("mousemove", function (e) {
        getMousePosition(canvas, e);
        moved();
    });

    canvas.addEventListener("mouseup", function (e) {
        getMousePosition(canvas, e);
        pressed = false;
        released();
    });

    window.addEventListener("keydown", function(e) {
        keyPressed(e.keyCode);
    }, false);

    window.addEventListener("keydown", function(e) {
        keyReleased(e.keyCode);
    }, false);
}

function getMousePosition(canvas, event) {
    rect = canvas.getBoundingClientRect();
    click_x = event.clientX - rect.left;
    click_y = event.clientY - rect.top;
}

function getTouchPosition(canvas, event) {
    var rect = canvas.getBoundingClientRect();
    click_x = event.touches[0].clientX - rect.left;
    click_y = event.touches[0].clientY - rect.top;
}
