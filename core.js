let nuclei = [];
let grid = [], temp_grid = [];

// default number of nuclei
let num_nuclei = 100;

// diffusion related
let cell_length;
let num_rows, num_cols;
let diffusion_constant, cooldown_rate;
let adjacent_weight, diagonal_weight;

// agitation
let heat_efficiency;

// inertial_confinement
let ic_heat, ic_force, ic_cycle;

// fusion related;
let max_heat, half_maxima, sigmoid_exponent;
let energy_display;

// fusion events
let fusion_events = [];

// constants
let distance_scaling, exclusion_radius
let mass_factor, charge_factor;
let radius_factor, force_factor;
const speed_of_light = 299792458;
const mass_proton = 1.67262192369e-27; // kilograms
const mass_neutron = 1.67492749804e-27; // kilograms
const minTemperatureForFusion = 150000000;


// measurements
let avg_temp1, avg_temp2, avg_z;
let total_energy_produced = 0;

// states
let show_grid;
let inertial_confinement;

// simulation
let frame;
let dt = 0.001;

initParams();

// Function to calculate the power produced per second
function calculatePowerProduced() {
    let timeElapsed = elapsedTime / 1000; // Get the time elapsed since the last measurement
    let power = total_energy_produced / timeElapsed; // Calculate power (Watt)
    power_display.innerHTML = `Power produced: ${power.toFixed(10)} W.s-1`;
    return power
}

function measureTemperature() {
    let sum = 0;

    for(let row = 0; row < num_rows; row++) {
      for(let col = 0; col < num_cols; col++) {
        sum += grid[row][col];
      }
    }
    avg_temp1 = 1 * sum / (num_rows * num_cols);
    let temperature_K = avg_temp1 + 273.15;

    temp_display.innerHTML = `Average temperature: ${temperature_K.toFixed(2)} K`;
    return temperature_K
  }

function update() {
    for (let nucleus of nuclei) {
        nucleus.update();
    }

    for(let fusion_event of fusion_events) {
        fusion_event.update();
    }

    diffuseHeat();
    internuclearInteractions();

    if(pressed) {
        heatUp();
    }

    frame++;
    frame = frame % fps
    if(frame == 0) {
        measureTemperature();
        calculatePowerProduced()
    }

    IC()
}

function internuclearInteractions() {
    let nucleus1, nucleus2, constant_part, force_x, force_y;
    for (let i = 0; i < nuclei.length - 1; i++) {
        for (let j = i + 1; j < nuclei.length; j++) {
            nucleus1 = nuclei[i];
            nucleus2 = nuclei[j];
            r = distanceBetween(nucleus1, nucleus2);

            if (r < Math.min(nucleus1.radius, nucleus2.radius)) {
                if (inertial_confinement) {
                  nuclearFusion(i, j, nucleus1, nucleus2);
                }
            }
            else {
                constant_part = force_factor * nucleus1.charge * nucleus2.charge / Math.pow(r, 3);
                force_x = constant_part * (nucleus1.x - nucleus2.x);
                force_y = constant_part * (nucleus1.y - nucleus2.y);
                nucleus1.applyForce(force_x, force_y);
                nucleus2.applyForce(-force_x, -force_y);
            }
        }
    }
}



function diffuseHeat() {
    syncGrids();
    diffuseCenter();
    diffuseEdges();
    diffuseCorners();
    cooldown();
}


function nuclearFusion(i, j, nucleus1, nucleus2) {
    // Check for valid fusion reactions between Deuterium, Tritium, and Helium-3.
    console.log("Attempting fusion between:", nucleus1, nucleus2);
    if (nucleus1.protons === 1 && nucleus2.protons === 1) {
        // D + D Fusion (Deuterium + Deuterium)
        if (nucleus1.neutrons === 1 && nucleus2.neutrons === 1) {
            // Possible outcomes of D + D:
            // 1. He-3 (Helium-3) + Neutron
            // 2. Tritium (T) + Proton
            if (Math.random() < 0.5) { // 50% chance for each outcome
                // He-3 + Neutron outcome
                let new_nucleus = new Nucleus(nucleus1.x, nucleus1.y, 2, 1, nucleus1.charge + nucleus2.charge, 0);
                nuclei.splice(j, 1);  // Remove nucleus2
                nuclei.splice(i, 1);  // Remove nucleus1
                nuclei.push(new_nucleus);
                // Energy calculation
                let energy_produced = calculateEnergy(new_nucleus, nucleus1, nucleus2);
                total_energy_produced += energy_produced;
                updateGrid(new_nucleus);
            } else {
                // Tritium (T) + Proton outcome
                let new_nucleus = new Nucleus(nucleus1.x, nucleus1.y, 1, 2, nucleus1.charge + nucleus2.charge, 0);
                nuclei.splice(j, 1);  // Remove nucleus2
                nuclei.splice(i, 1);  // Remove nucleus1
                nuclei.push(new_nucleus);
                // Energy calculation
                let energy_produced = calculateEnergy(new_nucleus, nucleus1, nucleus2);
                total_energy_produced += energy_produced;
                updateGrid(new_nucleus);
            }
        }
        else if (nucleus1.neutrons === 1 && nucleus2.neutrons === 2) {
            // D + T Fusion produces He-4 (Helium-4) and a Neutron
            let new_nucleus = new Nucleus(nucleus1.x, nucleus1.y, 2, 2, nucleus1.charge + nucleus2.charge, 4);
            nuclei.splice(j, 1);  // Remove nucleus2
            nuclei.splice(i, 1);  // Remove nucleus1
            nuclei.push(new_nucleus);
            // Energy calculation
            let energy_produced = calculateEnergy(new_nucleus, nucleus1, nucleus2);
            total_energy_produced += energy_produced;
            updateGrid(new_nucleus);
            console.log("D + T fusion resulted in He-4 and a neutron.");
        }
    }
    // D + He-3 (Deuterium + Helium-3) Fusion
    else if (nucleus1.protons === 1 && nucleus2.protons === 2) {
        // D + He-3 produces He-4 (Helium-4), which is stable and cannot fuse further.
        let new_nucleus = new Nucleus(nucleus1.x, nucleus1.y, 2, 2, nucleus1.charge + nucleus2.charge, 4);
        nuclei.splice(j, 1);  // Remove nucleus2
        nuclei.splice(i, 1);  // Remove nucleus1
        nuclei.push(new_nucleus);
        // Energy calculation
        let energy_produced = calculateEnergy(new_nucleus, nucleus1, nucleus2);
        total_energy_produced += energy_produced;
        updateGrid(new_nucleus);
        console.log("D + He-3 fusion resulted in He-4, which is stable.");
    }
    // He-3 + He-3 Fusion
    else if (nucleus1.protons === 2 && nucleus2.protons === 2 && nucleus1.neutrons === 1 && nucleus2.neutrons === 1) {
        // He-3 + He-3 Fusion produces He-4, which is stable and cannot fuse further.
        let new_nucleus = new Nucleus(nucleus1.x, nucleus1.y, 2, 2, nucleus1.charge + nucleus2.charge, 4);
        nuclei.splice(j, 1);  // Remove nucleus2
        nuclei.splice(i, 1);  // Remove nucleus1
        nuclei.push(new_nucleus);
        // Energy calculation
        let energy_produced = calculateEnergy(new_nucleus, nucleus1, nucleus2);
        total_energy_produced += energy_produced;
        updateGrid(new_nucleus);
        console.log("He-3 + He-3 fusion resulted in He-4, which is stable.");
    }
    else {
        // If fusion is not valid, do nothing
        console.log("Invalid fusion reaction.");
    }
}

function calculateEnergy(new_nucleus, nucleus1, nucleus2) {
    // Calculate total mass and energy produced in the fusion event
    let total_mass = ((nucleus1.protons + nucleus2.protons) * mass_proton) + ((nucleus1.neutrons + nucleus2.neutrons) * mass_neutron) ;

    let final_mass = new_nucleus.mass * mass_proton + new_nucleus.neutrons * mass_neutron;
    let mass_defect = total_mass - final_mass;
    let energy_produced = mass_defect * Math.pow(speed_of_light, 2);

    return energy_produced;
}

function updateGrid(new_nucleus) {
    // Update grid and energy display for the new nucleus
    let row = Math.floor(new_nucleus.y / cell_length);
    let col = Math.floor(new_nucleus.x / cell_length);
    grid[row][col] = 1;

    new_fusion_event = new Fusion_event(new_nucleus.x, new_nucleus.y, new_nucleus.radius);
    fusion_events.push(new_fusion_event);
    updateAtomic();

    // Display the total energy produced
    energy_display.innerHTML = `Total energy produced: ${total_energy_produced.toFixed(10)} J`;
}


let temperature1 = 0

function IC() {
    if(inertial_confinement) {
        if(frame == 0) {
            heatIC();
        }
        else if(frame == fps - 1) {
            for(let i = 0; i < nuclei.length; i++) {
              nuclei[i].compress();
            }
            toggleIC();
        }
    }
}

function updateAtomic() {
    let sum = 0;
    for(let nucleus of nuclei) {
        sum += nucleus.mass;
    }
    avg_z = sum / nuclei.length;
    z_display.innerHTML = `Average atomic number: ${avg_z.toFixed(2)}`;
    n_display.innerHTML = `Number of nuclei: ${nuclei.length}`;
}

function updateParams(variable) {
    if(variable == "n") {
        num_nuclei = Number.parseInt(n_input.value);
    }
    if(variable == "h") {
        heat_temperature = Number.parseFloat(heat_input.value);
        heat_display.innerHTML = `Temperature: ${heat_temperature * 1000}`;
    }
}

function initParams() {
    n_input.value = num_nuclei;
    updateParams("n");
    heat_input.value = 0.1;
    updateParams("h");

    mass_factor = 1;
    charge_factor = 1;
    force_factor = 1e9;
    distance_scaling = 1;

    diffusion_constant = 100;
    adjacent_weight = 0.2;
    diagonal_weight = 0.05;
    cooldown_rate = 0.0000001;
    heat_efficiency = 1E-20;

    energy_display = document.getElementById("energy-display");

    if(mobile) {
        cell_length = 10;
        radius_factor = 4;
        exclusion_radius = 10;
    }
    else {
        cell_length = 20;
        radius_factor = 10;
        exclusion_radius = 15;
    }

    max_heat = 1;
    half_maxima = 1;

    frame = 0;

    fusion_event = false;
    inertial_confinement = false;
    show_grid = true;
    total_energy_produced = 0;

    ic_heat = 0.05;
    ic_force = 1e5;

    makeScene();
    makeGrid();
}

function makeScene() {
    nuclei = [];
    fusion_events = [];

    let x, y, passed;
    for (let i = 0; i < num_nuclei; i++) {
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
        nuclei.push(new Nucleus(x, y, 1, Math.floor(Math.random() * 2) + 1, 1, 100));
    }
}

function makeGrid() {
    grid = [];
    num_rows = Math.ceil(canvas_height / cell_length);
    num_cols = Math.ceil(canvas_width / cell_length);

    for (let row = 0; row < num_rows; row++) {
        new_row = [];
        for (let col = 0; col < num_cols; col++) {
            new_row.push(0);
        }
        grid.push(new_row);
    }

    context.fillStyle = "#000000";
    context.fillRect(0, 0, canvas_width, canvas_height);
}

function distanceBetweenCoordAndNucleus(x, y, nucleus) {
    return distance_scaling * Math.sqrt(Math.pow(x - nucleus.x, 2) + Math.pow(y - nucleus.y, 2));
}

function distanceBetween(nucleus1, nucleus2) {
    return distance_scaling * Math.sqrt(Math.pow(nucleus2.x - nucleus1.x, 2) + Math.pow(nucleus2.y - nucleus1.y, 2));
}
