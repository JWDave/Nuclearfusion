class SimulationDataCollector {
    constructor() {
        this.data = [];
        this.isCollecting = false;
        this.collectionInterval = 1000; // Collect data every second
        this.intervalId = null;
    }

    startCollecting() {
        if (!this.isCollecting) {
            this.isCollecting = true;
            this.intervalId = setInterval(() => this.collectDataPoint(), this.collectionInterval);
        }
    }

    stopCollecting() {
        if (this.isCollecting) {
            clearInterval(this.intervalId);
            this.isCollecting = false;
        }
    }

    collectDataPoint() {
        const timePoint = elapsedTime / 1000; // Convert to seconds
        const dataPoint = {
            timestamp: timePoint,
            numberOfNuclei: nuclei.length,
            averageAtomicNumber: parseFloat(avg_z.toFixed(2)),
            temperature: parseFloat(measureTemperature().toFixed(2)),
            energyProduced: parseFloat(total_energy_produced.toFixed(10)),
            energyConsumed: parseFloat(total_energy_consumed.toFixed(10)),
            powerProduced: parseFloat((total_energy_produced / timePoint).toFixed(10))
        };
        this.data.push(dataPoint);
    }

    exportToCSV() {
        if (this.data.length === 0) {
            console.log('No data to export');
            return;
        }

        // Create CSV headers
        const headers = [
            'Time (s)',
            'Number of Nuclei',
            'Average Atomic Number',
            'Temperature (K)',
            'Energy Produced (J)',
            'Energy Consumed (J)',
            'Power Produced (W/s)'
        ];

        // Convert data to CSV format
        const csvContent = [
            headers.join(','),
            ...this.data.map(point => [
                point.timestamp,
                point.numberOfNuclei,
                point.averageAtomicNumber,
                point.temperature,
                point.energyProduced,
                point.energyConsumed,
                point.powerProduced
            ].join(','))
        ].join('\n');

        // Create and download CSV file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a'); // Changed from 'link' to 'a'
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `fusion_simulation_data_${new Date().toISOString()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    reset() {
        this.data = [];
        this.stopCollecting();
    }
}

// Create global instance of data collector
const dataCollector = new SimulationDataCollector();