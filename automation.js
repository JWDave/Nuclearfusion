class SimulationAutomator {
    constructor() {
        this.currentSimulation = 0;
        this.currentNucleiCount = 100;
        this.simulationsPerCount = 100;
        this.maxNucleiCount = 1000;
        this.simulationDuration = 10000; // 10 seconds in milliseconds
        this.isRunning = false;
        this.results = [];
        this.dataCollector = new SimulationDataCollector();
        this.simulationStartTime = null;
        this.currentSimulationTimer = null;
    }

    async startAutomation() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.results = [];

        this.createStatusDisplay();

        while (this.currentNucleiCount <= this.maxNucleiCount && this.isRunning) {
            for (let i = 0; i < this.simulationsPerCount && this.isRunning; i++) {
                await this.runSingleSimulation(this.currentNucleiCount, i + 1);
            }
            this.currentNucleiCount += 100;
        }

        this.exportAllResults();
        this.isRunning = false;
        this.updateStatus('All simulations completed! Results exported.');
    }

    async runSingleSimulation(nucleiCount, runNumber) {
        return new Promise((resolve) => {
            // Update status
            this.updateStatus(`Running simulation ${runNumber}/100 with ${nucleiCount} nuclei`);

            // Reset simulation and set nuclei count
            n_input.value = nucleiCount;
            restart();

            // Ensure simulation is running
            if (paused) {
                pauseToggle(); // This will set paused = false and start the animation
            }

            // Reset and start data collection
            this.dataCollector.reset();
            this.dataCollector.startCollecting();

            // Store simulation start time
            this.simulationStartTime = Date.now();
            startTime = Date.now(); // Reset the global simulation timer

            // Set up timer to end simulation after duration
            this.currentSimulationTimer = setInterval(() => {
                const currentTime = Date.now();
                const elapsedTime = currentTime - this.simulationStartTime;

                if (elapsedTime >= this.simulationDuration) {
                    // Clear the interval
                    clearInterval(this.currentSimulationTimer);

                    // Stop the simulation
                    if (!paused) {
                        pauseToggle(); // This will set paused = true and stop the animation
                    }

                    // Collect final data
                    this.dataCollector.stopCollecting();

                    // Store results
                    const simulationResult = {
                        nucleiCount: nucleiCount,
                        runNumber: runNumber,
                        data: this.dataCollector.data,
                        duration: elapsedTime,
                        finalTemperature: measureTemperature(),
                        finalNucleiCount: nuclei.length,
                        finalAverageAtomicNumber: avg_z
                    };
                    this.results.push(simulationResult);

                    // Move to next simulation
                    resolve();
                }
            }, 100); // Check every 100ms
        });
    }

    createStatusDisplay() {
        if (!this.statusElement) {
            this.statusElement = document.createElement('div');
            this.statusElement.style.position = 'fixed';
            this.statusElement.style.top = '10px';
            this.statusElement.style.right = '10px';
            this.statusElement.style.padding = '10px';
            this.statusElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            this.statusElement.style.color = 'white';
            this.statusElement.style.borderRadius = '5px';
            this.statusElement.style.zIndex = '1000';
            document.body.appendChild(this.statusElement);
        }
    }

    updateStatus(message) {
        if (this.statusElement) {
            this.statusElement.textContent = message;
        }
    }

    exportAllResults() {
        const headers = [
            'Initial Nuclei Count',
            'Run Number',
            'Time (s)',
            'Number of Nuclei',
            'Average Atomic Number',
            'Temperature (K)',
            'Energy Produced (J)',
            'Energy Consumed (J)',
            'Power Produced (W/s)',
            'Simulation Duration (ms)',
            'Final Temperature (K)',
            'Final Nuclei Count',
            'Final Average Atomic Number'
        ];

        let csvContent = headers.join(',') + '\n';

        this.results.forEach(simulation => {
            simulation.data.forEach(dataPoint => {
                const row = [
                    simulation.nucleiCount,
                    simulation.runNumber,
                    dataPoint.timestamp,
                    dataPoint.numberOfNuclei,
                    dataPoint.averageAtomicNumber,
                    dataPoint.temperature,
                    dataPoint.energyProduced,
                    dataPoint.energyConsumed,
                    dataPoint.powerProduced,
                    simulation.duration,
                    simulation.finalTemperature,
                    simulation.finalNucleiCount,
                    simulation.finalAverageAtomicNumber
                ];
                csvContent += row.join(',') + '\n';
            });
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `fusion_simulation_batch_results_${new Date().toISOString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Create control panel for automation
function createAutomationControls() {
    const controlPanel = document.createElement('div');
    controlPanel.style.position = 'fixed';
    controlPanel.style.bottom = '10px';
    controlPanel.style.right = '10px';
    controlPanel.style.padding = '10px';
    controlPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    controlPanel.style.borderRadius = '5px';
    controlPanel.style.zIndex = '1000';

    const startButton = document.createElement('button');
    startButton.innerHTML = 'Start Batch Simulations';
    startButton.onclick = () => {
        const automator = new SimulationAutomator();
        automator.startAutomation();
    };

    controlPanel.appendChild(startButton);
    document.body.appendChild(controlPanel);
}

// Initialize automation controls
window.addEventListener('load', createAutomationControls);
