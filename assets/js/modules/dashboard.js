/**
 * dashboard.js
 * Dashboard-Modul für die Mitarbeiterbefragung
 * Anzeige von KPIs, Statusübersicht und Schnellzugriff auf Hauptfunktionen
 */

// IIFE mit Zuweisung an globales Window-Objekt
window.DashboardModule = (() => {
    // Modul-Elemente
    let container = null;
    let chartsInstances = {};
    let updateInterval = null;
    
    // Konfigurationsoptionen
    const config = {
        refreshInterval: 0, // Automatische Aktualisierung in ms (0 = deaktiviert)
        animations: true,
        colorScheme: 'default', // 'default', 'colorblind', 'monochrome'
        displayMode: 'full', // 'full', 'compact'
        showTargets: true // Zielwerte anzeigen
    };
    
    /**
     * Dashboard-Modul initialisieren
     */
    const init = async (targetContainer) => {
        try {
            container = targetContainer;
            
            // Konfiguration aus den Einstellungen laden
            loadConfigFromSettings();
            
            // Container mit Basis-Struktur füllen
            container.innerHTML = `
                <div class="dashboard-container ${config.displayMode}">
                    <div class="row mb-4">
                        <div class="col-12">
                            <div class="section-header d-flex justify-content-between align-items-center">
                                <div>
                                    <h2>
                                        <i class="fas fa-chart-pie"></i> 
                                        Dashboard
                                    </h2>
                                    <p class="section-description">
                                        Übersicht zur Mitarbeiterbefragung der Klinik für Radiologie und Nuklearmedizin
                                    </p>
                                </div>
                                <div class="dashboard-controls">
                                    <button id="refresh-dashboard" class="btn btn-outline-primary btn-sm">
                                        <i class="fas fa-sync-alt"></i> Aktualisieren
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- KPI-Cards -->
                    <div class="row kpi-row mb-4">
                        <div class="col-md-3 col-sm-6 mb-3">
                            <div class="stat-card">
                                <div class="stat-card-header">
                                    <h5 class="stat-card-title">Erfasste Fragebögen</h5>
                                    <i class="fas fa-file-alt stat-card-icon"></i>
                                </div>
                                <p class="stat-card-value" id="kpi-survey-count">0</p>
                                <p class="stat-card-footer" id="kpi-survey-trend"></p>
                            </div>
                        </div>
                        <div class="col-md-3 col-sm-6 mb-3">
                            <div class="stat-card">
                                <div class="stat-card-header">
                                    <h5 class="stat-card-title">Gesamtzufriedenheit</h5>
                                    <i class="fas fa-smile stat-card-icon"></i>
                                </div>
                                <p class="stat-card-value" id="kpi-satisfaction">-</p>
                                <p class="stat-card-description" id="kpi-satisfaction-desc"></p>
                            </div>
                        </div>
                        <div class="col-md-3 col-sm-6 mb-3">
                            <div class="stat-card">
                                <div class="stat-card-header">
                                    <h5 class="stat-card-title">Teilnahmequote</h5>
                                    <i class="fas fa-users stat-card-icon"></i>
                                </div>
                                <p class="stat-card-value" id="kpi-participation">-</p>
                                <p class="stat-card-description">Geschätztes Verhältnis zu Gesamtbelegschaft</p>
                            </div>
                        </div>
                        <div class="col-md-3 col-sm-6 mb-3">
                            <div class="stat-card">
                                <div class="stat-card-header">
                                    <h5 class="stat-card-title">Letzte Aktivität</h5>
                                    <i class="fas fa-clock stat-card-icon"></i>
                                </div>
                                <p class="stat-card-value" id="kpi-last-activity">-</p>
                                <p class="stat-card-description" id="kpi-last-activity-desc"></p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Schnellzugriff und Status -->
                    <div class="row mb-4">
                        <div class="col-lg-6 mb-3">
                            <div class="card card-glass">
                                <div class="card-header">
                                    <h5 class="card-title mb-0">
                                        <i class="fas fa-bolt"></i> Schnellzugriff
                                    </h5>
                                </div>
                                <div class="card-body">
                                    <div class="quick-actions">
                                        <a href="#data-entry" class="quick-action-btn" id="quick-add-survey">
                                            <i class="fas fa-plus-circle"></i>
                                            <span>Fragebogen erfassen</span>
                                        </a>
                                        <a href="#data-import-export" class="quick-action-btn" id="quick-import">
                                            <i class="fas fa-file-import"></i>
                                            <span>Daten importieren</span>
                                        </a>
                                        <a href="#analysis" class="quick-action-btn" id="quick-analyze">
                                            <i class="fas fa-chart-bar"></i>
                                            <span>Daten analysieren</span>
                                        </a>
                                        <a href="#reporting" class="quick-action-btn" id="quick-report">
                                            <i class="fas fa-file-pdf"></i>
                                            <span>Bericht erstellen</span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-lg-6 mb-3">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="card-title mb-0">
                                        <i class="fas fa-tasks"></i> Befragungsstatus
                                    </h5>
                                </div>
                                <div class="card-body">
                                    <div id="survey-progress-container">
                                        <div class="d-flex justify-content-between mb-1">
                                            <span>Fortschritt</span>
                                            <span id="progress-percentage">0%</span>
                                        </div>
                                        <div class="progress mb-3">
                                            <div id="survey-progress-bar" class="progress-bar" role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                                        </div>
                                        
                                        <div class="demographics-summary">
                                            <div class="d-flex justify-content-between mb-2">
                                                <span class="text-muted">Nach Berufsgruppe:</span>
                                                <span id="profession-distribution">-</span>
                                            </div>
                                            <div class="d-flex justify-content-between mb-2">
                                                <span class="text-muted">Nach Erfahrung:</span>
                                                <span id="experience-distribution">-</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Meilensteine -->
                                    <div class="timeline mt-3" id="survey-milestones">
                                        <div class="timeline-item">
                                            <div class="timeline-dot"></div>
                                            <div class="timeline-content">
                                                <div class="timeline-date" id="milestone-start-date">-</div>
                                                <div>Beginn der Befragung</div>
                                            </div>
                                        </div>
                                        <div class="timeline-item">
                                            <div class="timeline-dot"></div>
                                            <div class="timeline-content">
                                                <div class="timeline-date" id="milestone-last-activity">-</div>
                                                <div>Letzter Fragebogen erfasst</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Stärken und Schwächen -->
                    <div class="row mb-4">
                        <div class="col-12">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="card-title mb-0">
                                        <i class="fas fa-balance-scale"></i> Stärken und Schwächen
                                    </h5>
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-lg-6 mb-3">
                                            <h6 class="text-success mb-3"><i class="fas fa-thumbs-up"></i> Top 3 Stärken</h6>
                                            <div id="strengths-container">
                                                <div class="placeholder-text">Keine Daten verfügbar</div>
                                            </div>
                                        </div>
                                        <div class="col-lg-6 mb-3">
                                            <h6 class="text-danger mb-3"><i class="fas fa-thumbs-down"></i> Top 3 Verbesserungspotenziale</h6>
                                            <div id="weaknesses-container">
                                                <div class="placeholder-text">Keine Daten verfügbar</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Übergreifende Antwortverteilung -->
                    <div class="row mb-4">
                        <div class="col-12">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="card-title mb-0">
                                        <i class="fas fa-chart-pie"></i> Antwortverteilung
                                    </h5>
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-lg-8 mb-3">
                                            <canvas id="overall-distribution-chart" height="300"></canvas>
                                        </div>
                                        <div class="col-lg-4 mb-3">
                                            <div id="distribution-legend" class="chart-legend"></div>
                                            <div class="mt-4 pt-3 border-top">
                                                <h6>Schlüsselerkenntnisse</h6>
                                                <div id="key-insights">
                                                    <div class="placeholder-text">Wird geladen...</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Bereichsübersicht -->
                    <div class="row mb-4">
                        <div class="col-12">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="card-title mb-0">
                                        <i class="fas fa-th"></i> Themenbereiche im Überblick
                                    </h5>
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-lg-6 mb-3">
                                            <canvas id="areas-chart" height="250"></canvas>
                                        </div>
                                        <div class="col-lg-6 mb-3">
                                            <div class="table-container">
                                                <table class="table table-sm">
                                                    <thead>
                                                        <tr>
                                                            <th>Bereich</th>
                                                            <th>Durchschnitt</th>
                                                            <th>Status</th>
                                                            <th>Trend</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody id="areas-table-body">
                                                        <!-- Wird dynamisch befüllt -->
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Event-Listener für die Dashboard-Aktionen
            attachEventListeners();
            
            // Einmalig Daten laden
            await loadDashboardData();
            
            // Periodische Aktualisierung einrichten (falls aktiviert)
            setupAutoRefresh();
            
            // Charts initialisieren
            initCharts();
            
            return true;
        } catch (error) {
            console.error('Fehler bei der Initialisierung des Dashboard-Moduls:', error);
            container.innerHTML = `<div class="alert alert-danger">
                <h4>Fehler beim Laden des Dashboards</h4>
                <p>${error.message}</p>
            </div>`;
            return false;
        }
    };
    
    /**
     * Event-Listener für das Dashboard einrichten
     */
    const attachEventListeners = () => {
        // Aktualisieren-Button
        const refreshBtn = container.querySelector('#refresh-dashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                try {
                    // Spinner anzeigen
                    refreshBtn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Aktualisiere...';
                    refreshBtn.disabled = true;
                    
                    // Daten neu laden
                    await loadDashboardData();
                    
                    // Button zurücksetzen
                    setTimeout(() => {
                        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Aktualisieren';
                        refreshBtn.disabled = false;
                    }, 500);
                    
                    Utils.notifications.success('Dashboard aktualisiert');
                } catch (error) {
                    console.error('Fehler beim Aktualisieren des Dashboards:', error);
                    refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Aktualisieren';
                    refreshBtn.disabled = false;
                    Utils.notifications.error('Fehler beim Aktualisieren: ' + error.message);
                }
            });
        }
        
        // Schnellzugriff-Buttons
        const quickActions = container.querySelectorAll('.quick-action-btn');
        quickActions.forEach(action => {
            action.addEventListener('click', (event) => {
                event.preventDefault();
                const href = action.getAttribute('href');
                if (href && href.startsWith('#')) {
                    const moduleId = href.substring(1);
                    App.navigateTo(moduleId);
                }
            });
        });
    };
    
    /**
     * Dashboard-Daten laden und anzeigen
     */
    const loadDashboardData = async () => {
        try {
            const surveys = DataManager.getAllSurveys();
            
            // KPIs aktualisieren
            updateKPIs(surveys);
            
            // Fortschritt und Demografie aktualisieren
            updateProgress(surveys);
            
            // Stärken und Schwächen aktualisieren
            updateStrengthsAndWeaknesses(surveys);
            
            // Antwortverteilung aktualisieren
            updateDistributionChart(surveys);
            
            // Bereichsübersicht aktualisieren
            updateAreasOverview(surveys);
            
            return true;
        } catch (error) {
            console.error('Fehler beim Laden der Dashboard-Daten:', error);
            Utils.notifications.error('Fehler beim Laden der Dashboard-Daten');
            return false;
        }
    };
    
    /**
     * Konfiguration aus den Anwendungseinstellungen laden
     */
    const loadConfigFromSettings = () => {
        try {
            // Farbschema
            const state = DataManager.getState();
            const appSettings = state && state.appSettings ? state.appSettings : {};
            
            // Prüfen ob die Einstellungen verfügbar sind
            if (!appSettings) return;
            
            if (appSettings.charts && appSettings.charts.colorScheme) {
                config.colorScheme = appSettings.charts.colorScheme;
            }
            
            // Animationen
            if (appSettings.charts && appSettings.charts.animationSpeed === 'none') {
                config.animations = false;
            }
            
            // Display-Modus
            if (appSettings.ui && appSettings.ui.compactView) {
                config.displayMode = 'compact';
            }
            
            // Zielwerte
            if (appSettings.analysis && appSettings.analysis.showTargets !== undefined) {
                config.showTargets = appSettings.analysis.showTargets;
            }
        } catch (error) {
            console.error('Fehler beim Laden der Dashboard-Konfiguration:', error);
        }
    };
    
    /**
     * Automatische Aktualisierung einrichten
     */
    const setupAutoRefresh = () => {
        // Vorhandenen Timer entfernen
        if (updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
        }
        
        // Nur einrichten wenn aktiviert
        if (config.refreshInterval > 0) {
            updateInterval = setInterval(loadDashboardData, config.refreshInterval);
        }
    };
    
    /**
     * Charts initialisieren
     */
    const initCharts = () => {
        try {
            // Sicherstellen dass Chart.js verfügbar ist
            if (!window.Chart) {
                console.error('Chart.js nicht geladen');
                return;
            }
            
            // Globale Chart.js Konfiguration
            Chart.defaults.font.family = getComputedStyle(document.body).getPropertyValue('--font-family');
            Chart.defaults.color = getComputedStyle(document.body).getPropertyValue('--dark-grey');
            
            // Standard-Farben für Charts
            const chartColors = {
                default: [
                    getComputedStyle(document.body).getPropertyValue('--chart-color-1') || '#e3000b',
                    getComputedStyle(document.body).getPropertyValue('--chart-color-2') || '#3498db',
                    getComputedStyle(document.body).getPropertyValue('--chart-color-3') || '#2ecc71',
                    getComputedStyle(document.body).getPropertyValue('--chart-color-4') || '#f39c12',
                    getComputedStyle(document.body).getPropertyValue('--chart-color-5') || '#9b59b6'
                ]
            };
            
            // Antwortverteilung Chart
            const distributionCtx = document.getElementById('overall-distribution-chart');
            if (distributionCtx) {
                chartsInstances.distribution = new Chart(distributionCtx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Starke Zustimmung', 'Zustimmung', 'Neutral', 'Ablehnung', 'Starke Ablehnung'],
                        datasets: [{
                            data: [0, 0, 0, 0, 0],
                            backgroundColor: chartColors.default,
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        let label = context.label || '';
                                        let value = context.raw || 0;
                                        let percentage = context.parsed || 0;
                                        return `${label}: ${value} (${percentage.toFixed(1)}%)`;
                                    }
                                }
                            }
                        },
                        animation: config.animations ? {
                            duration: 1000,
                            easing: 'easeOutQuart'
                        } : false
                    }
                });
                
                // Legende manuell erstellen
                createChartLegend(
                    chartsInstances.distribution, 
                    document.getElementById('distribution-legend')
                );
            }
            
            // Bereichsübersicht Chart
            const areasCtx = document.getElementById('areas-chart');
            if (areasCtx) {
                chartsInstances.areas = new Chart(areasCtx, {
                    type: 'radar',
                    data: {
                        labels: [],
                        datasets: [{
                            label: 'Durchschnittliche Bewertung',
                            data: [],
                            backgroundColor: 'rgba(227, 0, 11, 0.2)',
                            borderColor: 'rgba(227, 0, 11, 1)',
                            pointBackgroundColor: 'rgba(227, 0, 11, 1)',
                            pointBorderColor: '#fff',
                            pointHoverBackgroundColor: '#fff',
                            pointHoverBorderColor: 'rgba(227, 0, 11, 1)',
                            borderWidth: 2
                        }]
                    },
                    options: {
                        scales: {
                            r: {
                                min: 1,
                                max: 5,
                                ticks: {
                                    stepSize: 1,
                                    showLabelBackdrop: false,
                                    font: {
                                        size: 10
                                    }
                                },
                                pointLabels: {
                                    font: {
                                        size: 11
                                    }
                                },
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.1)'
                                },
                                angleLines: {
                                    color: 'rgba(0, 0, 0, 0.1)'
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                display: true,
                                position: 'top'
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        let label = context.dataset.label || '';
                                        let value = context.raw || 0;
                                        return `${label}: ${value.toFixed(2)}`;
                                    }
                                }
                            }
                        },
                        animation: config.animations ? {
                            duration: 1000,
                            easing: 'easeOutQuart'
                        } : false
                    }
                });
            }
            
        } catch (error) {
            console.error('Fehler bei der Initialisierung der Charts:', error);
        }
    };
    
    /**
     * Manuelle Legende für ein Chart erstellen
     */
    const createChartLegend = (chart, container) => {
        if (!chart || !container) return;
        
        // Container leeren
        container.innerHTML = '';
        
        // Legende erstellen
        const legendItems = chart.data.labels.map((label, index) => {
            const backgroundColor = chart.data.datasets[0].backgroundColor[index];
            
            return `
                <div class="legend-item">
                    <span class="legend-color" style="background-color: ${backgroundColor}"></span>
                    <span class="legend-label">${label}</span>
                </div>
            `;
        });
        
        container.innerHTML = legendItems.join('');
    };
    
    /**
     * KPI-Werte aktualisieren
     */
    const updateKPIs = (surveys) => {
        try {
            // Anzahl der Fragebögen
            const surveyCountEl = container.querySelector('#kpi-survey-count');
            if (surveyCountEl) {
                surveyCountEl.textContent = surveys.length;
            }
            
            // Trend der Fragebögen anzeigen
            const surveyTrendEl = container.querySelector('#kpi-survey-trend');
            if (surveyTrendEl) {
                // Einfache Trend-Berechnung basierend auf letzten Tagen
                const now = new Date();
                const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                
                const recentSurveys = surveys.filter(survey => 
                    new Date(survey.timestamp) >= oneDayAgo
                ).length;
                
                if (recentSurveys > 0) {
                    surveyTrendEl.innerHTML = `<span class="stat-trend-up"><i class="fas fa-arrow-up"></i> ${recentSurveys} in den letzten 24h</span>`;
                } else {
                    surveyTrendEl.innerHTML = `Keine neuen Fragebögen in den letzten 24h`;
                }
            }
            
            // Gesamtzufriedenheit berechnen (aus Q33 und Q34)
            const satisfactionEl = container.querySelector('#kpi-satisfaction');
            const satisfactionDescEl = container.querySelector('#kpi-satisfaction-desc');
            
            if (satisfactionEl && satisfactionDescEl) {
                if (surveys.length > 0) {
                    // Werte für die Fragen sammeln
                    let q33Sum = 0;
                    let q33Count = 0;
                    let q34Sum = 0;
                    let q34Count = 0;
                    
                    for (const survey of surveys) {
                        if (survey.q33 != null) {
                            q33Sum += survey.q33;
                            q33Count++;
                        }
                        if (survey.q34 != null) {
                            q34Sum += survey.q34;
                            q34Count++;
                        }
                    }
                    
                    // Durchschnittswerte berechnen
                    const q33Avg = q33Count > 0 ? q33Sum / q33Count : 0;
                    const q34Avg = q34Count > 0 ? q34Sum / q34Count : 0;
                    
                    // Gesamtzufriedenheit als Durchschnitt
                    const overallSatisfaction = (q33Avg + q34Avg) / 2;
                    
                    // Anzeigen
                    satisfactionEl.textContent = overallSatisfaction.toFixed(1);
                    
                    // Beschreibung basierend auf Wert
                    let description = '';
                    let colorClass = '';
                    
                    if (overallSatisfaction >= 4.5) {
                        description = 'Hervorragend';
                        colorClass = 'text-success';
                    } else if (overallSatisfaction >= 3.8) {
                        description = 'Gut';
                        colorClass = 'text-success';
                    } else if (overallSatisfaction >= 3.2) {
                        description = 'Befriedigend';
                        colorClass = '';
                    } else if (overallSatisfaction >= 2.5) {
                        description = 'Verbesserungsbedürftig';
                        colorClass = 'text-warning';
                    } else {
                        description = 'Kritisch';
                        colorClass = 'text-danger';
                    }
                    
                    satisfactionDescEl.textContent = description;
                    satisfactionDescEl.className = colorClass;
                } else {
                    satisfactionEl.textContent = '-';
                    satisfactionDescEl.textContent = 'Keine Daten verfügbar';
                }
            }
            
            // Teilnahmequote (geschätzt basierend auf Gesamtmitarbeiterzahl)
            const participationEl = container.querySelector('#kpi-participation');
            if (participationEl) {
                // Annahme: Klinik hat etwa 50 Mitarbeiter
                const estimatedStaffCount = 50;
                const participationRate = surveys.length / estimatedStaffCount * 100;
                participationEl.textContent = participationRate.toFixed(0) + '%';
            }
            
            // Letzte Aktivität
            const lastActivityEl = container.querySelector('#kpi-last-activity');
            const lastActivityDescEl = container.querySelector('#kpi-last-activity-desc');
            
            if (lastActivityEl && lastActivityDescEl) {
                if (surveys.length > 0) {
                    // Neuesten Fragebogen finden
                    const sortedSurveys = [...surveys].sort((a, b) => 
                        new Date(b.timestamp) - new Date(a.timestamp)
                    );
                    
                    const lastSurvey = sortedSurveys[0];
                    lastActivityEl.textContent = Utils.format.timeAgo(lastSurvey.timestamp);
                    lastActivityDescEl.textContent = 'Letzter Fragebogen: ' + Utils.format.date(lastSurvey.timestamp);
                } else {
                    lastActivityEl.textContent = '-';
                    lastActivityDescEl.textContent = 'Keine Aktivitäten vorhanden';
                }
            }
            
        } catch (error) {
            console.error('Fehler beim Aktualisieren der KPIs:', error);
        }
    };
    
    /**
     * Fortschritts- und Demografie-Informationen aktualisieren
     */
    const updateProgress = (surveys) => {
        try {
            // Fortschrittsanzeige basierend auf geschätzter Gesamtmitarbeiterzahl
            const progressBar = container.querySelector('#survey-progress-bar');
            const progressPercentage = container.querySelector('#progress-percentage');
            
            if (progressBar && progressPercentage) {
                // Annahme: Ziel sind 50 Fragebögen
                const targetCount = 50;
                const progress = Math.min(100, (surveys.length / targetCount * 100));
                
                progressBar.style.width = `${progress}%`;
                progressBar.setAttribute('aria-valuenow', progress);
                progressPercentage.textContent = `${Math.round(progress)}%`;
            }
            
            // Demografische Verteilung
            updateDemographicDistribution(surveys);
            
            // Meilensteine aktualisieren
            updateMilestones(surveys);
            
        } catch (error) {
            console.error('Fehler beim Aktualisieren des Fortschritts:', error);
        }
    };
    
    /**
     * Demografische Verteilung aktualisieren
     */
    const updateDemographicDistribution = (surveys) => {
        try {
            const professionDistEl = container.querySelector('#profession-distribution');
            const experienceDistEl = container.querySelector('#experience-distribution');
            
            if (professionDistEl && experienceDistEl) {
                if (surveys.length > 0) {
                    // Berufsgruppen zählen
                    const professions = {
                        arzt: 0,
                        mtr: 0,
                        anmeldung: 0,
                        undefined: 0
                    };
                    
                    surveys.forEach(survey => {
                        const prof = survey.profession || 'undefined';
                        professions[prof] = (professions[prof] || 0) + 1;
                    });
                    
                    // Berufsgruppen anzeigen
                    const profLabels = {
                        arzt: 'Ärzte',
                        mtr: 'MTRs',
                        anmeldung: 'Anmeldung',
                        undefined: 'k.A.'
                    };
                    
                    const profText = Object.keys(professions)
                        .filter(key => professions[key] > 0)
                        .map(key => `${profLabels[key]}: ${professions[key]}`)
                        .join(', ');
                    
                    professionDistEl.textContent = profText || 'Keine Daten';
                    
                    // Erfahrung zählen
                    const experience = {
                        lt2: 0,
                        '2to5': 0,
                        '6to10': 0,
                        gt10: 0,
                        undefined: 0
                    };
                    
                    surveys.forEach(survey => {
                        const exp = survey.experience || 'undefined';
                        experience[exp] = (experience[exp] || 0) + 1;
                    });
                    
                    // Erfahrung anzeigen
                    const expLabels = {
                        lt2: '< 2 Jahre',
                        '2to5': '2-5 Jahre',
                        '6to10': '6-10 Jahre',
                        gt10: '> 10 Jahre',
                        undefined: 'k.A.'
                    };
                    
                    const expText = Object.keys(experience)
                        .filter(key => experience[key] > 0)
                        .map(key => `${expLabels[key]}: ${experience[key]}`)
                        .join(', ');
                    
                    experienceDistEl.textContent = expText || 'Keine Daten';
                } else {
                    professionDistEl.textContent = 'Keine Daten';
                    experienceDistEl.textContent = 'Keine Daten';
                }
            }
        } catch (error) {
            console.error('Fehler beim Aktualisieren der demografischen Verteilung:', error);
        }
    };
    
    /**
     * Meilensteine aktualisieren
     */
    const updateMilestones = (surveys) => {
        try {
            const startDateEl = container.querySelector('#milestone-start-date');
            const lastActivityEl = container.querySelector('#milestone-last-activity');
            
            if (startDateEl && lastActivityEl) {
                if (surveys.length > 0) {
                    // Sortieren nach Datum
                    const sortedSurveys = [...surveys].sort((a, b) => 
                        new Date(a.timestamp) - new Date(b.timestamp)
                    );
                    
                    // Erstes und letztes Datum
                    const firstSurvey = sortedSurveys[0];
                    const lastSurvey = sortedSurveys[sortedSurveys.length - 1];
                    
                    startDateEl.textContent = Utils.format.date(firstSurvey.timestamp);
                    lastActivityEl.textContent = Utils.format.date(lastSurvey.timestamp);
                } else {
                    startDateEl.textContent = '-';
                    lastActivityEl.textContent = '-';
                }
            }
        } catch (error) {
            console.error('Fehler beim Aktualisieren der Meilensteine:', error);
        }
    };
    
    /**
     * Stärken und Schwächen aktualisieren
     */
    const updateStrengthsAndWeaknesses = (surveys) => {
        try {
            const strengthsContainer = container.querySelector('#strengths-container');
            const weaknessesContainer = container.querySelector('#weaknesses-container');
            
            if (strengthsContainer && weaknessesContainer) {
                if (surveys.length > 0) {
                    // Stärken und Schwächen identifizieren
                    const strengths = [];
                    const weaknesses = [];
                    
                    // Für jede Kategorie den Durchschnitt berechnen
                    for (const area of SurveySchema.categorization.areas) {
                        let sum = 0;
                        let count = 0;
                        
                        for (const questionId of area.questions) {
                            for (const survey of surveys) {
                                if (survey[questionId] != null) {
                                    sum += survey[questionId];
                                    count++;
                                }
                            }
                        }
                        
                        if (count > 0) {
                            const average = sum / count;
                            
                            const areaData = {
                                id: area.id,
                                title: area.title,
                                average: average
                            };
                            
                            if (average >= 3.5) {
                                strengths.push(areaData);
                            } else if (average < 2.5) {
                                weaknesses.push(areaData);
                            }
                        }
                    }
                    
                    // Nach Durchschnitt sortieren
                    strengths.sort((a, b) => b.average - a.average);
                    weaknesses.sort((a, b) => a.average - b.average);
                    
                    // Top 3 Stärken anzeigen
                    if (strengths.length > 0) {
                        let strengthsHtml = '';
                        strengths.slice(0, 3).forEach(strength => {
                            const colorClass = getScoreColorClass(strength.average);
                            strengthsHtml += `
                                <div class="metric-item mb-3">
                                    <div class="d-flex justify-content-between align-items-center mb-1">
                                        <strong>${strength.title}</strong>
                                        <span class="badge ${colorClass}">${strength.average.toFixed(1)}</span>
                                    </div>
                                    <div class="progress" style="height: 8px;">
                                        <div class="progress-bar ${colorClass}" role="progressbar" 
                                            style="width: ${(strength.average / 5) * 100}%" 
                                            aria-valuenow="${strength.average}" 
                                            aria-valuemin="0" 
                                            aria-valuemax="5">
                                        </div>
                                    </div>
                                </div>
                            `;
                        });
                        strengthsContainer.innerHTML = strengthsHtml;
                    } else {
                        strengthsContainer.innerHTML = '<div class="placeholder-text">Keine Daten verfügbar</div>';
                    }
                    
                    // Top 3 Schwächen anzeigen
                    if (weaknesses.length > 0) {
                        let weaknessesHtml = '';
                        weaknesses.slice(0, 3).forEach(weakness => {
                            const colorClass = getScoreColorClass(weakness.average);
                            weaknessesHtml += `
                                <div class="metric-item mb-3">
                                    <div class="d-flex justify-content-between align-items-center mb-1">
                                        <strong>${weakness.title}</strong>
                                        <span class="badge ${colorClass}">${weakness.average.toFixed(1)}</span>
                                    </div>
                                    <div class="progress" style="height: 8px;">
                                        <div class="progress-bar ${colorClass}" role="progressbar" 
                                            style="width: ${(weakness.average / 5) * 100}%" 
                                            aria-valuenow="${weakness.average}" 
                                            aria-valuemin="0" 
                                            aria-valuemax="5">
                                        </div>
                                    </div>
                                </div>
                            `;
                        });
                        weaknessesContainer.innerHTML = weaknessesHtml;
                    } else {
                        weaknessesContainer.innerHTML = '<div class="placeholder-text">Keine Daten verfügbar</div>';
                    }
                } else {
                    // Keine Daten
                    strengthsContainer.innerHTML = '<div class="placeholder-text">Keine Daten verfügbar</div>';
                    weaknessesContainer.innerHTML = '<div class="placeholder-text">Keine Daten verfügbar</div>';
                }
            }
        } catch (error) {
            console.error('Fehler beim Aktualisieren der Stärken und Schwächen:', error);
        }
    };
    
    /**
     * Verteilungs-Chart aktualisieren
     */
    const updateDistributionChart = (surveys) => {
        try {
            if (surveys.length === 0 || !chartsInstances.distribution) {
                // Keine Daten oder Chart nicht initialisiert
                return;
            }
            
            // Gesamtverteilung der Antworten berechnen (1-5 für Likert-Fragen)
            const distribution = {
                1: 0, 2: 0, 3: 0, 4: 0, 5: 0
            };
            
            let totalResponses = 0;
            
            // Alle Fragen durchgehen
            surveys.forEach(survey => {
                // Nur Likert-Fragen berücksichtigen
                for (const sectionInfo of SurveySchema.sections) {
                    for (const question of sectionInfo.questions) {
                        if (question.type === 'likert') {
                            const answer = survey[question.id];
                            if (answer !== null && answer !== undefined) {
                                distribution[answer] = (distribution[answer] || 0) + 1;
                                totalResponses++;
                            }
                        }
                    }
                }
            });
            
            // Prozentualen Anteil berechnen
            const percentages = {};
            if (totalResponses > 0) {
                for (const key in distribution) {
                    percentages[key] = (distribution[key] / totalResponses) * 100;
                }
            }
            
            // Chart aktualisieren
            chartsInstances.distribution.data.datasets[0].data = [
                distribution[5], // Starke Zustimmung
                distribution[4], // Zustimmung
                distribution[3], // Neutral
                distribution[2], // Ablehnung
                distribution[1]  // Starke Ablehnung
            ];
            
            chartsInstances.distribution.update();
            
            // Schlüsselerkenntnisse aktualisieren
            updateKeyInsights(distribution, totalResponses);
            
        } catch (error) {
            console.error('Fehler beim Aktualisieren des Verteilungs-Charts:', error);
        }
    };
    
    /**
     * Schlüsselerkenntnisse basierend auf Verteilung aktualisieren
     */
    const updateKeyInsights = (distribution, totalResponses) => {
        try {
            const insightsContainer = document.getElementById('key-insights');
            if (!insightsContainer) return;
            
            // Positive und negative Antworten berechnen
            const positiveResponses = distribution[4] + distribution[5];
            const negativeResponses = distribution[1] + distribution[2];
            const neutralResponses = distribution[3];
            
            const positivePercentage = (positiveResponses / totalResponses * 100).toFixed(1);
            const negativePercentage = (negativeResponses / totalResponses * 100).toFixed(1);
            const neutralPercentage = (neutralResponses / totalResponses * 100).toFixed(1);
            
            // HTML generieren
            let insights = `
                <ul class="insights-list">
                    <li><strong>${positivePercentage}%</strong> der Antworten sind positiv</li>
                    <li><strong>${neutralPercentage}%</strong> der Antworten sind neutral</li>
                    <li><strong>${negativePercentage}%</strong> der Antworten sind negativ</li>
                </ul>
            `;
            
            // Zusätzliche Erkenntnisse
            let additionalInsight = '';
            if (positiveResponses > negativeResponses * 2) {
                additionalInsight = `<p class="mt-2 text-success">
                    <i class="fas fa-check-circle"></i> 
                    Die Gesamtzufriedenheit ist überdurchschnittlich hoch.
                </p>`;
            } else if (negativeResponses > positiveResponses) {
                additionalInsight = `<p class="mt-2 text-danger">
                    <i class="fas fa-exclamation-triangle"></i> 
                    Es besteht erheblicher Handlungsbedarf.
                </p>`;
            } else if (neutralResponses > (positiveResponses + negativeResponses)) {
                additionalInsight = `<p class="mt-2 text-warning">
                    <i class="fas fa-info-circle"></i> 
                    Viele neutrale Antworten deuten auf Unsicherheit hin.
                </p>`;
            }
            
            insightsContainer.innerHTML = insights + additionalInsight;
            
        } catch (error) {
            console.error('Fehler beim Aktualisieren der Schlüsselerkenntnisse:', error);
        }
    };
    
    /**
     * Bereichsübersicht aktualisieren
     */
    const updateAreasOverview = (surveys) => {
        try {
            if (surveys.length === 0 || !chartsInstances.areas) {
                // Keine Daten oder Chart nicht initialisiert
                return;
            }
            
            // Alle definierten Bereiche durchgehen
            const areas = SurveySchema.categorization.areas;
            
            // Arrays für Chart-Daten vorbereiten
            const labels = [];
            const averages = [];
            
            // Tabelle vorbereiten
            const tableBody = document.getElementById('areas-table-body');
            tableBody.innerHTML = '';
            
            // Für jeden Bereich Durchschnitt berechnen
            areas.forEach(area => {
                let sum = 0;
                let count = 0;
                
                for (const questionId of area.questions) {
                    for (const survey of surveys) {
                        if (survey[questionId] != null) {
                            sum += survey[questionId];
                            count++;
                        }
                    }
                }
                
                if (count > 0) {
                    const average = sum / count;
                    
                    // Nur hinzufügen, wenn Daten vorhanden
                    labels.push(area.title);
                    averages.push(average);
                    
                    // Zeile zur Tabelle hinzufügen
                    const colorClass = getScoreColorClass(average);
                    const statusBadge = getStatusBadge(average);
                    
                    // Trend (vereinfacht - in echter Anwendung würde hier historische Daten verglichen)
                    const trendIcon = average >= 3.5 ? 
                        '<i class="fas fa-arrow-up text-success"></i>' : 
                        (average < 2.5 ? 
                            '<i class="fas fa-arrow-down text-danger"></i>' : 
                            '<i class="fas fa-minus text-warning"></i>');
                    
                    tableBody.innerHTML += `
                        <tr>
                            <td>${area.title}</td>
                            <td><strong>${average.toFixed(2)}</strong></td>
                            <td>${statusBadge}</td>
                            <td>${trendIcon}</td>
                        </tr>
                    `;
                }
            });
            
            // Chart aktualisieren
            chartsInstances.areas.data.labels = labels;
            chartsInstances.areas.data.datasets[0].data = averages;
            chartsInstances.areas.update();
            
        } catch (error) {
            console.error('Fehler beim Aktualisieren der Bereichsübersicht:', error);
        }
    };
    
    /**
     * Farbklasse basierend auf Score ermitteln
     */
    const getScoreColorClass = (score) => {
        if (score >= 4.5) return 'category-excellent';
        if (score >= 3.8) return 'category-good';
        if (score >= 3.2) return 'category-good';
        if (score >= 2.5) return 'category-warning';
        return 'category-critical';
    };
    
    /**
     * Status-Badge basierend auf Score erstellen
     */
    const getStatusBadge = (score) => {
        if (score >= 4.5) return '<span class="badge category-excellent">Hervorragend</span>';
        if (score >= 3.8) return '<span class="badge category-good">Gut</span>';
        if (score >= 3.2) return '<span class="badge bg-info">Befriedigend</span>';
        if (score >= 2.5) return '<span class="badge category-warning">Verbesserungsbedürftig</span>';
        return '<span class="badge category-critical">Kritisch</span>';
    };
    
    /**
     * Modul anzeigen wenn es aktiviert wird
     */
    const show = () => {
        if (container) {
            container.classList.add('fade-in');
        }
    };
    
    /**
     * Modul ausblenden wenn zu einem anderen Modul gewechselt wird
     */
    const hide = () => {
        if (container) {
            container.classList.remove('fade-in');
        }
    };
    
    /**
     * Modul-Ressourcen freigeben
     */
    const dispose = () => {
        // Timer stoppen
        if (updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
        }
        
        // Charts zerstören
        for (const chartName in chartsInstances) {
            if (chartsInstances[chartName]) {
                chartsInstances[chartName].destroy();
            }
        }
        chartsInstances = {};
        
        // Container leeren
        if (container) {
            container.innerHTML = '';
        }
        
        container = null;
    };
    
    // Öffentliche API
    return {
        init,
        show,
        hide,
        dispose,
        loadDashboardData
    };
})();