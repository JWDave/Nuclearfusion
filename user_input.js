function clicked() {

}

function moved() {

}

function released() {

}

function keyPressed(key) {
    if (key == 80) {
        pauseToggle();
    }
    else if (key == 71) {
        gridToggle();
    }
}

function keyReleased(key) {

}

function addNucleus(number = 1) {
    let passed;
    for (let i = 0; i < number; i++) {
        passed = false
        while (!passed) {
            passed = true;
            x = Math.random() * canvas_width;
            y = Math.random() * canvas_height;
            for (let nucleus of nuclei) {
                distance = distanceBetweenCoordAndNucleus(x, y, nucleus);
                if (distance <= exclusion_radius) {
                    passed = false;
                    break;
                }
            }
        }
        nuclei.push(new Nucleus(x, y, 1, 1, 100));
    }
    updateAtomic();
}

function removeNucleus(number = 1) {
    let removed = 0;
    while(nuclei.length > 0 && removed < number) {
        nuclei.pop();
        removed++;
    }
    updateAtomic();
}

let total_energy_consumed = 0;
const BOLTZMANN_CONSTANT = 1.380649e-23

function heatContainer() {
    let temperature1 = measureTemperature();
    let temperature2 = 155000000;
    let delta_temperature = temperature2 - temperature1;
    let energy_consumed = (3/2 * BOLTZMANN_CONSTANT * delta_temperature * nuclei.length);
    total_energy_consumed += energy_consumed;

    for(let row = 0; row < num_rows; row++) {
        for(let col = 0; col < num_cols; col++) {
            grid[row][col] = temperature2;
        }
    }

    energy_consummed_display.innerHTML = `Total energy consummed: ${total_energy_consumed.toFixed(30)} J`;
}

function restart() {
    updateParams("n");
    initParams();
    makeGrid();
    makeScene();

    z_display.innerHTML = "";
    temp_display.innerHTML = "";
    energy_consummed_display.innerHTML = "";
    inertial_confinement = false;
    startTime = null;
    total_energy_produced = 0;
    elapsedTime = 0;
    lastUpdateTime = null;

    startChronometer();

    timeData = [];
    energyData = [];
    updateAtomic();
}

function pauseToggle() {
    if (paused) {
        paused = false;
        pause_button.innerHTML = "Pause";
        startChronometer();
        dataCollector.startCollecting();
    } else {
        paused = true;
        pause_button.innerHTML = "Resume";
        pauseChronometer();
        dataCollector.stopCollecting();
    }
}
function toggleIC() {
    if (inertial_confinement) {
        inertial_confinement = false;
        ic_button.innerHTML = "Turn on Inertial Confinement";
    }
    else {
        inertial_confinement = true;
        ic_button.innerHTML = "Turn off Inertial Confinement";
        ic_cycle = 0;
        IC();
    }
}

function clearNuclei() {
    nuclei = [];
    updateAtomic()
}

function gridToggle() {
    show_grid = !show_grid;
}
