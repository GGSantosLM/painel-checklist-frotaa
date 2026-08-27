/* ============================================
   Chart Manager
   Wraps Chart.js donut and line charts.
   Handles creation, update, and destruction.
   ============================================ */

class ChartManager {
    constructor() {
        this.conformityChart = null;
        this.kmChart = null;
        this.overallConformityChart = null;
    }

    /* ---------- Conformity Donut ---------- */

    /**
     * Create or update the conformity donut chart.
     * @param {number} okCount
     * @param {number} nokCount
     */
    updateConformity(okCount, nokCount) {
        const ctx = document.getElementById('conformityChart');
        if (!ctx) return;

        const total = okCount + nokCount;
        const pct = total > 0 ? Math.round((okCount / total) * 100) : 0;

        // Update center text
        const center = document.getElementById('donutCenter');
        if (center) {
            center.querySelector('.donut-value').textContent = total > 0 ? `${pct}%` : '—';
        }

        // Update legend
        const legend = document.getElementById('conformityLegend');
        if (legend) {
            legend.innerHTML = `
                <div class="legend-item">
                    <span class="legend-dot legend-dot--ok"></span>
                    <span>OK</span>
                    <span class="legend-value">${okCount}</span>
                </div>
                <div class="legend-item">
                    <span class="legend-dot legend-dot--nok"></span>
                    <span>NOK</span>
                    <span class="legend-value">${nokCount}</span>
                </div>
            `;
        }

        const data = {
            labels: ['Conforme', 'Não Conforme'],
            datasets: [{
                data: [okCount, nokCount],
                backgroundColor: [
                    getComputedStyle(document.documentElement).getPropertyValue('--clr-green').trim(),
                    getComputedStyle(document.documentElement).getPropertyValue('--clr-red').trim()
                ],
                borderWidth: 0,
                cutout: '75%',
                borderRadius: 4,
                spacing: 2
            }]
        };

        if (this.conformityChart) {
            this.conformityChart.data = data;
            this.conformityChart.update('active');
        } else {
            this.conformityChart = new Chart(ctx, {
                type: 'doughnut',
                data: data,
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: '#1F2937',
                            titleFont: { family: 'Inter', size: 12 },
                            bodyFont: { family: 'Inter', size: 12 },
                            cornerRadius: 8,
                            padding: 10,
                            callbacks: {
                                label: (ctx) => {
                                    const val = ctx.parsed;
                                    const pctVal = total > 0 ? Math.round((val / total) * 100) : 0;
                                    return ` ${ctx.label}: ${val} (${pctVal}%)`;
                                }
                            }
                        }
                    },
                    animation: {
                        animateRotate: true,
                        duration: 800,
                        easing: 'easeOutQuart'
                    }
                }
            });
        }
    }

    /* ---------- KM Line Chart ---------- */

    /**
     * Create or update the KM evolution line chart.
     * @param {string[]} labels  - date labels (e.g. ['01','02','03'])
     * @param {number[]} values  - cumulative KM values
     */
    updateKmChart(labels, values) {
        const ctx = document.getElementById('kmChart');
        if (!ctx) return;

        const primaryClr = getComputedStyle(document.documentElement)
            .getPropertyValue('--clr-primary').trim();

        const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 120);
        gradient.addColorStop(0, primaryClr + '30');
        gradient.addColorStop(1, primaryClr + '05');

        const data = {
            labels: labels,
            datasets: [{
                label: 'KM',
                data: values,
                fill: true,
                backgroundColor: gradient,
                borderColor: primaryClr,
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 4,
                pointHoverBackgroundColor: primaryClr,
                tension: 0.4
            }]
        };

        if (this.kmChart) {
            this.kmChart.data = data;
            this.kmChart.update('active');
        } else {
            this.kmChart = new Chart(ctx, {
                type: 'line',
                data: data,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: '#1F2937',
                            titleFont: { family: 'Inter', size: 11 },
                            bodyFont: { family: 'Inter', size: 11 },
                            cornerRadius: 8,
                            padding: 8,
                            callbacks: {
                                label: (ctx) => ` ${ctx.parsed.y.toLocaleString('pt-BR')} km`
                            }
                        }
                    },
                    scales: {
                        x: {
                            display: true,
                            grid: { display: false },
                            ticks: {
                                font: { family: 'Inter', size: 10 },
                                color: getComputedStyle(document.documentElement).getPropertyValue('--clr-text-muted').trim() || '#9CA3AF',
                                maxTicksLimit: 8
                            }
                        },
                        y: {
                            display: false,
                            beginAtZero: false
                        }
                    },
                    animation: {
                        duration: 600,
                        easing: 'easeOutQuart'
                    },
                    interaction: {
                        mode: 'index',
                        intersect: false
                    }
                }
            });
        }
    }

    /* ---------- Overall Fleet Conformity Line Chart ---------- */

    /**
     * Create or update the overall fleet conformity chart on the Home screen.
     * @param {string[]} labels  - date labels (e.g. ['01 Mai', '02 Mai'])
     * @param {number[]} values  - conformity % per day
     */
    updateOverallConformityChart(labels, values) {
        const ctx = document.getElementById('overallConformityChart');
        if (!ctx) return;

        const greenClr = getComputedStyle(document.documentElement)
            .getPropertyValue('--clr-green').trim();
        const amberClr = getComputedStyle(document.documentElement)
            .getPropertyValue('--clr-amber').trim();

        const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 200);
        gradient.addColorStop(0, greenClr + '30');
        gradient.addColorStop(1, greenClr + '05');

        const data = {
            labels: labels,
            datasets: [{
                label: 'Conformidade %',
                data: values,
                fill: true,
                backgroundColor: gradient,
                borderColor: greenClr,
                borderWidth: 2.5,
                pointRadius: values.length > 30 ? 0 : 3,
                pointHoverRadius: 5,
                pointBackgroundColor: greenClr,
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: greenClr,
                pointHoverBorderWidth: 2,
                tension: 0.35
            }]
        };

        if (this.overallConformityChart) {
            this.overallConformityChart.data = data;
            this.overallConformityChart.update('active');
        } else {
            this.overallConformityChart = new Chart(ctx, {
                type: 'line',
                data: data,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: '#1F2937',
                            titleFont: { family: 'Inter', size: 12 },
                            bodyFont: { family: 'Inter', size: 12 },
                            cornerRadius: 8,
                            padding: 10,
                            callbacks: {
                                label: (ctx) => ` ${ctx.parsed.y.toFixed(1)}% conforme`
                            }
                        }
                    },
                    scales: {
                        x: {
                            display: true,
                            grid: { display: false },
                            ticks: {
                                font: { family: 'Inter', size: 10 },
                                color: getComputedStyle(document.documentElement).getPropertyValue('--clr-text-muted').trim() || '#9CA3AF',
                                maxTicksLimit: 12
                            }
                        },
                        y: {
                            display: true,
                            min: 80,
                            max: 100,
                            grid: {
                                color: getComputedStyle(document.documentElement).getPropertyValue('--clr-border-light').trim() || '#F3F4F6',
                            },
                            ticks: {
                                font: { family: 'Inter', size: 10 },
                                color: getComputedStyle(document.documentElement).getPropertyValue('--clr-text-muted').trim() || '#9CA3AF',
                                callback: (v) => v + '%'
                            }
                        }
                    },
                    animation: {
                        duration: 800,
                        easing: 'easeOutQuart'
                    },
                    interaction: {
                        mode: 'index',
                        intersect: false
                    }
                }
            });
        }
    }

    /** Destroy all charts (used when switching vehicles or screens) */
    destroyAll() {
        if (this.conformityChart) {
            this.conformityChart.destroy();
            this.conformityChart = null;
        }
        if (this.kmChart) {
            this.kmChart.destroy();
            this.kmChart = null;
        }
        if (this.overallConformityChart) {
            this.overallConformityChart.destroy();
            this.overallConformityChart = null;
        }
    }
}
