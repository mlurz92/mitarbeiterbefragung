/**
 * analysis.js
 * Datenanalyse-Modul für die Mitarbeiterbefragung
 * Ermöglicht die umfassende Analyse und Visualisierung der Fragebogendaten
 */

window.AnalysisModule = (() => {
    // Modul-Elemente
    let container = null;
    let currentView = 'overview'; // 'overview', 'detail', 'comparison', 'advanced'
    let currentChartType = 'bar'; // 'bar', 'line', 'radar', 'pie', 'heatmap'
    let chartsInstances = {};
    
    // Filteroptionen für Analysen
    let filterOptions = {
        profession: '',
        experience: '',
        tenure: '',
        completenessMin: 0,
        dateFrom: null,
        dateTo: null
    };
    
    // Analyseoptionen
    let analysisOptions = {
        showAverages: true,
        showMedians: false,
        showStdDev: false,
        showTargetValues: true,
        groupByDemographics: false,
        normalizeData: false,
        colorScheme: 'default' // 'default', 'colorblind', 'monochrome'
    };
    
    // Aktuell ausgewählte Analyseelemente
    let selectedSurveys = [];
    let selectedQuestions = [];
    let selectedSection = null;
    let selectedQuestion = null;
    let selectedComparison = null;
    
    /**
     * Datenanalyse-Modul initialisieren
     */
    const init = async (targetContainer) => {
        try {
            container = targetContainer;
            
            // Prüfen ob notwendige Abhängigkeiten vorhanden sind
            if (!window.Chart) {
                throw new Error('Chart.js nicht geladen - Visualisierungsfunktionen eingeschränkt');
            }
            
            // Basis-Layout erstellen
            createLayout();
            
            // Filter initialisieren und anwenden
            initFilters();
            applyFilters();
            
            // Übersichtsansicht anzeigen
            showOverviewView();
            
            return true;
        } catch (error) {
            console.error('Fehler bei der Initialisierung des Datenanalyse-Moduls:', error);
            container.innerHTML = `<div class="alert alert-danger">
                <h4>Fehler beim Laden des Datenanalyse-Moduls</h4>
                <p>${error.message}</p>
            </div>`;
            return false;
        }
    };
    
    /**
     * Basis-Layout für das Modul erstellen
     */
    const createLayout = () => {
        container.innerHTML = `
            <div class="analysis-container">
                <div class="section-header d-flex justify-content-between align-items-center">
                    <div>
                        <h2>
                            <i class="fas fa-chart-bar"></i> 
                            Datenanalyse
                        </h2>
                        <p class="section-description">
                            Analysieren und visualisieren Sie die Ergebnisse der Mitarbeiterbefragung
                        </p>
                    </div>
                    <div class="actions" id="view-actions">
                        <!-- Dynamische Aktions-Buttons -->
                    </div>
                </div>
                
                <!-- Filter-Bereich -->
                <div class="card mb-4" id="filter-card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">
                            <i class="fas fa-filter"></i> Filter und Optionen
                        </h5>
                        <button class="btn btn-sm btn-outline-secondary" id="toggle-filters-btn" title="Filter ein-/ausblenden">
                            <i class="fas fa-chevron-up"></i>
                        </button>
                    </div>
                    <div class="card-body" id="filter-body">
                        <div class="row">
                            <!-- Demografische Filter -->
                            <div class="col-md-6 col-lg-3 mb-3">
                                <div class="form-group">
                                    <label for="profession-filter" class="form-label">Berufsgruppe</label>
                                    <select class="form-control" id="profession-filter">
                                        <option value="">Alle Berufsgruppen</option>
                                        <!-- Wird dynamisch befüllt -->
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-6 col-lg-3 mb-3">
                                <div class="form-group">
                                    <label for="experience-filter" class="form-label">Berufserfahrung</label>
                                    <select class="form-control" id="experience-filter">
                                        <option value="">Alle Erfahrungsstufen</option>
                                        <!-- Wird dynamisch befüllt -->
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-6 col-lg-3 mb-3">
                                <div class="form-group">
                                    <label for="tenure-filter" class="form-label">Zugehörigkeit</label>
                                    <select class="form-control" id="tenure-filter">
                                        <option value="">Alle Zugehörigkeiten</option>
                                        <!-- Wird dynamisch befüllt -->
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-6 col-lg-3 mb-3">
                                <div class="form-group">
                                    <label for="completeness-filter" class="form-label">Vollständigkeit</label>
                                    <select class="form-control" id="completeness-filter">
                                        <option value="0">Alle Fragebögen</option>
                                        <option value="0.25">Mind. 25% ausgefüllt</option>
                                        <option value="0.5">Mind. 50% ausgefüllt</option>
                                        <option value="0.75">Mind. 75% ausgefüllt</option>
                                        <option value="0.9">Mind. 90% ausgefüllt</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <div class="row">
                            <!-- Datums-Filter -->
                            <div class="col-md-6 col-lg-3 mb-3">
                                <div class="form-group">
                                    <label for="date-from" class="form-label">Datum von</label>
                                    <input type="date" class="form-control" id="date-from">
                                </div>
                            </div>
                            <div class="col-md-6 col-lg-3 mb-3">
                                <div class="form-group">
                                    <label for="date-to" class="form-label">Datum bis</label>
                                    <input type="date" class="form-control" id="date-to">
                                </div>
                            </div>
                            
                            <!-- Analyseoptionen -->
                            <div class="col-md-12 col-lg-6 mb-3">
                                <label class="form-label">Anzeigeoptionen</label>
                                <div class="d-flex flex-wrap">
                                    <div class="form-check me-3 mb-2">
                                        <input class="form-check-input" type="checkbox" id="show-averages" checked>
                                        <label class="form-check-label" for="show-averages">Durchschnitte</label>
                                    </div>
                                    <div class="form-check me-3 mb-2">
                                        <input class="form-check-input" type="checkbox" id="show-medians">
                                        <label class="form-check-label" for="show-medians">Median</label>
                                    </div>
                                    <div class="form-check me-3 mb-2">
                                        <input class="form-check-input" type="checkbox" id="show-stddev">
                                        <label class="form-check-label" for="show-stddev">Standardabweichung</label>
                                    </div>
                                    <div class="form-check me-3 mb-2">
                                        <input class="form-check-input" type="checkbox" id="show-targets" checked>
                                        <label class="form-check-label" for="show-targets">Zielwerte</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="row mt-1">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label for="chart-type" class="form-label">Diagrammtyp</label>
                                    <div class="chart-type-selector" id="chart-type-selector">
                                        <button class="chart-type-btn active" data-type="bar" title="Balkendiagramm">
                                            <i class="fas fa-chart-bar"></i>
                                        </button>
                                        <button class="chart-type-btn" data-type="line" title="Liniendiagramm">
                                            <i class="fas fa-chart-line"></i>
                                        </button>
                                        <button class="chart-type-btn" data-type="radar" title="Netzdiagramm">
                                            <i class="fas fa-spider-web"></i>
                                        </button>
                                        <button class="chart-type-btn" data-type="pie" title="Kreisdiagramm">
                                            <i class="fas fa-chart-pie"></i>
                                        </button>
                                        <button class="chart-type-btn" data-type="heatmap" title="Heatmap">
                                            <i class="fas fa-th"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6 d-flex justify-content-end align-items-end">
                                <div class="btn-group">
                                    <button class="btn btn-outline-secondary" id="reset-filters-btn">
                                        <i class="fas fa-undo"></i> Filter zurücksetzen
                                    </button>
                                    <button class="btn btn-primary" id="apply-filters-btn">
                                        <i class="fas fa-search"></i> Anwenden
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Navigation zwischen Ansichten -->
                <div class="card mb-4">
                    <div class="card-body p-0">
                        <div class="analysis-nav">
                            <button class="analysis-nav-btn active" data-view="overview">
                                <i class="fas fa-th-large"></i> Übersicht
                            </button>
                            <button class="analysis-nav-btn" data-view="detail">
                                <i class="fas fa-search-plus"></i> Detailanalyse
                            </button>
                            <button class="analysis-nav-btn" data-view="comparison">
                                <i class="fas fa-balance-scale"></i> Vergleich
                            </button>
                            <button class="analysis-nav-btn" data-view="advanced">
                                <i class="fas fa-chart-network"></i> Erweiterte Analyse
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Statistik-Übersicht -->
                <div class="card mb-4" id="statistics-card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">
                            <i class="fas fa-calculator"></i> Statistik
                        </h5>
                        <div>
                            <span class="badge bg-primary me-2" id="selected-count">0 ausgewählt</span>
                            <button class="btn btn-sm btn-outline-secondary" id="toggle-stats-btn" title="Statistik ein-/ausblenden">
                                <i class="fas fa-chevron-up"></i>
                            </button>
                        </div>
                    </div>
                    <div class="card-body" id="statistics-body">
                        <div class="row">
                            <div class="col-md-3 col-sm-6 mb-3">
                                <div class="stat-card">
                                    <div class="stat-label">Anzahl Fragebögen</div>
                                    <div class="stat-value" id="stat-count">0</div>
                                </div>
                            </div>
                            <div class="col-md-3 col-sm-6 mb-3">
                                <div class="stat-card">
                                    <div class="stat-label">Ø Gesamtzufriedenheit</div>
                                    <div class="stat-value" id="stat-satisfaction">0.0</div>
                                </div>
                            </div>
                            <div class="col-md-3 col-sm-6 mb-3">
                                <div class="stat-card">
                                    <div class="stat-label">Höchste Bewertung</div>
                                    <div class="stat-value" id="stat-highest">-</div>
                                </div>
                            </div>
                            <div class="col-md-3 col-sm-6 mb-3">
                                <div class="stat-card">
                                    <div class="stat-label">Niedrigste Bewertung</div>
                                    <div class="stat-value" id="stat-lowest">-</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Hauptinhalt - dynamisch befüllt -->
                <div id="analysis-content" class="mt-4">
                    <!-- Wird dynamisch mit der jeweiligen Ansicht befüllt -->
                </div>
            </div>
        `;
        
        // Demografische Filter-Optionen laden
        loadDemographicFilterOptions();
        
        // Event-Listener für Filter-Aktionen
        document.getElementById('toggle-filters-btn').addEventListener('click', toggleFilters);
        document.getElementById('toggle-stats-btn').addEventListener('click', toggleStatistics);
        document.getElementById('reset-filters-btn').addEventListener('click', resetFilters);
        document.getElementById('apply-filters-btn').addEventListener('click', applyFilters);
        
        // Event-Listener für Analyseoptionen
        document.getElementById('show-averages').addEventListener('change', updateAnalysisOptions);
        document.getElementById('show-medians').addEventListener('change', updateAnalysisOptions);
        document.getElementById('show-stddev').addEventListener('change', updateAnalysisOptions);
        document.getElementById('show-targets').addEventListener('change', updateAnalysisOptions);
        
        // Event-Listener für Diagrammtypen
        document.querySelectorAll('.chart-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.chart-type-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentChartType = btn.dataset.type;
                updateCharts();
            });
        });
        
        // Event-Listener für Ansichts-Navigation
        document.querySelectorAll('.analysis-nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = btn.dataset.view;
                document.querySelectorAll('.analysis-nav-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                switch (view) {
                    case 'overview':
                        showOverviewView();
                        break;
                    case 'detail':
                        showDetailView();
                        break;
                    case 'comparison':
                        showComparisonView();
                        break;
                    case 'advanced':
                        showAdvancedView();
                        break;
                }
            });
        });
        
        // Standard-Chart-Typ setzen
        document.querySelector(`.chart-type-btn[data-type="${currentChartType}"]`).classList.add('active');
    };
    
    /**
     * Demografische Filter-Optionen laden
     */
    const loadDemographicFilterOptions = () => {
        try {
            // Berufsgruppen-Filter
            const professionSelect = document.getElementById('profession-filter');
            if (professionSelect) {
                SurveySchema.demographicOptions.profession.forEach(option => {
                    const optionElement = document.createElement('option');
                    optionElement.value = option.id;
                    optionElement.textContent = option.label;
                    professionSelect.appendChild(optionElement);
                });
            }
            
            // Berufserfahrungs-Filter
            const experienceSelect = document.getElementById('experience-filter');
            if (experienceSelect) {
                SurveySchema.demographicOptions.experience.forEach(option => {
                    const optionElement = document.createElement('option');
                    optionElement.value = option.id;
                    optionElement.textContent = option.label;
                    experienceSelect.appendChild(optionElement);
                });
            }
            
            // Zugehörigkeits-Filter
            const tenureSelect = document.getElementById('tenure-filter');
            if (tenureSelect) {
                SurveySchema.demographicOptions.tenure.forEach(option => {
                    const optionElement = document.createElement('option');
                    optionElement.value = option.id;
                    optionElement.textContent = option.label;
                    tenureSelect.appendChild(optionElement);
                });
            }
        } catch (error) {
            console.error('Fehler beim Laden der demografischen Filter-Optionen:', error);
        }
    };
    
    /**
     * Filter initialisieren
     */
    const initFilters = () => {
        try {
            // Daten aus DataManager laden
            const surveys = DataManager.getAllSurveys();
            
            // Wenn Daten vorhanden sind, Datums-Filter initialisieren
            if (surveys.length > 0) {
                let minDate = null;
                let maxDate = null;
                
                // Min und Max Datum ermitteln
                surveys.forEach(survey => {
                    const date = new Date(survey.timestamp);
                    if (!minDate || date < minDate) {
                        minDate = date;
                    }
                    if (!maxDate || date > maxDate) {
                        maxDate = date;
                    }
                });
                
                // Datums-Inputs setzen
                if (minDate && maxDate) {
                    const dateFromInput = document.getElementById('date-from');
                    const dateToInput = document.getElementById('date-to');
                    
                    // Format YYYY-MM-DD
                    const formatDate = (date) => {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        return `${year}-${month}-${day}`;
                    };
                    
                    if (dateFromInput) {
                        dateFromInput.value = formatDate(minDate);
                        dateFromInput.min = formatDate(minDate);
                        dateFromInput.max = formatDate(maxDate);
                    }
                    
                    if (dateToInput) {
                        dateToInput.value = formatDate(maxDate);
                        dateToInput.min = formatDate(minDate);
                        dateToInput.max = formatDate(maxDate);
                    }
                }
            }
        } catch (error) {
            console.error('Fehler bei der Initialisierung der Filter:', error);
        }
    };
    
    /**
     * Filter ein-/ausblenden
     */
    const toggleFilters = () => {
        const filterBody = document.getElementById('filter-body');
        const toggleBtn = document.getElementById('toggle-filters-btn');
        
        if (filterBody && toggleBtn) {
            if (filterBody.style.display === 'none') {
                filterBody.style.display = '';
                toggleBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
            } else {
                filterBody.style.display = 'none';
                toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
            }
        }
    };
    
    /**
     * Statistik ein-/ausblenden
     */
    const toggleStatistics = () => {
        const statsBody = document.getElementById('statistics-body');
        const toggleBtn = document.getElementById('toggle-stats-btn');
        
        if (statsBody && toggleBtn) {
            if (statsBody.style.display === 'none') {
                statsBody.style.display = '';
                toggleBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
            } else {
                statsBody.style.display = 'none';
                toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
            }
        }
    };
    
    /**
     * Filter zurücksetzen
     */
    const resetFilters = () => {
        // Filter-Formularelemente zurücksetzen
        document.getElementById('profession-filter').value = '';
        document.getElementById('experience-filter').value = '';
        document.getElementById('tenure-filter').value = '';
        document.getElementById('completeness-filter').value = '0';
        
        // Datums-Filter zurücksetzen
        initFilters(); // Dies setzt die Datums-Inputs auf ihre ursprünglichen Werte
        
        // Analyseoptionen zurücksetzen
        document.getElementById('show-averages').checked = true;
        document.getElementById('show-medians').checked = false;
        document.getElementById('show-stddev').checked = false;
        document.getElementById('show-targets').checked = true;
        
        // Filter-Optionen aktualisieren
        filterOptions = {
            profession: '',
            experience: '',
            tenure: '',
            completenessMin: 0,
            dateFrom: document.getElementById('date-from').value,
            dateTo: document.getElementById('date-to').value
        };
        
        // Analyseoptionen aktualisieren
        analysisOptions = {
            showAverages: true,
            showMedians: false,
            showStdDev: false,
            showTargetValues: true,
            groupByDemographics: false,
            normalizeData: false,
            colorScheme: 'default'
        };
        
        // Notification anzeigen
        Utils.notifications.info('Filter wurden zurückgesetzt.');
    };
    
    /**
     * Filter anwenden
     */
    const applyFilters = () => {
        // Filter-Werte auslesen
        filterOptions.profession = document.getElementById('profession-filter').value;
        filterOptions.experience = document.getElementById('experience-filter').value;
        filterOptions.tenure = document.getElementById('tenure-filter').value;
        filterOptions.completenessMin = parseFloat(document.getElementById('completeness-filter').value);
        filterOptions.dateFrom = document.getElementById('date-from').value;
        filterOptions.dateTo = document.getElementById('date-to').value;
        
        // Daten filtern
        filterSurveys();
        
        // Aktualisieren der Ansicht
        updateView();
        
        // Notification anzeigen
        Utils.notifications.success('Filter wurden angewendet.');
    };
    
    /**
     * Analyseoptionen aktualisieren
     */
    const updateAnalysisOptions = () => {
        analysisOptions.showAverages = document.getElementById('show-averages').checked;
        analysisOptions.showMedians = document.getElementById('show-medians').checked;
        analysisOptions.showStdDev = document.getElementById('show-stddev').checked;
        analysisOptions.showTargetValues = document.getElementById('show-targets').checked;
        
        // Charts aktualisieren
        updateCharts();
    };
    
    /**
     * Fragebögen nach aktuellen Filterkriterien filtern
     */
    const filterSurveys = () => {
        try {
            // Alle Fragebögen laden
            const allSurveys = DataManager.getAllSurveys();
            
            // Gefiltertes Array
            selectedSurveys = [...allSurveys];
            
            // Nach Berufsgruppe filtern
            if (filterOptions.profession) {
                selectedSurveys = selectedSurveys.filter(survey => survey.profession === filterOptions.profession);
            }
            
            // Nach Berufserfahrung filtern
            if (filterOptions.experience) {
                selectedSurveys = selectedSurveys.filter(survey => survey.experience === filterOptions.experience);
            }
            
            // Nach Zugehörigkeit filtern
            if (filterOptions.tenure) {
                selectedSurveys = selectedSurveys.filter(survey => survey.tenure === filterOptions.tenure);
            }
            
            // Nach Vollständigkeit filtern
            if (filterOptions.completenessMin > 0) {
                selectedSurveys = selectedSurveys.filter(survey => {
                    const completeness = SurveySchema.validators.getSurveyCompleteness(survey);
                    return completeness >= filterOptions.completenessMin;
                });
            }
            
            // Nach Datum filtern
            if (filterOptions.dateFrom) {
                const dateFrom = new Date(filterOptions.dateFrom);
                selectedSurveys = selectedSurveys.filter(survey => {
                    const surveyDate = new Date(survey.timestamp);
                    return surveyDate >= dateFrom;
                });
            }
            
            if (filterOptions.dateTo) {
                const dateTo = new Date(filterOptions.dateTo);
                dateTo.setHours(23, 59, 59); // Ende des Tages
                selectedSurveys = selectedSurveys.filter(survey => {
                    const surveyDate = new Date(survey.timestamp);
                    return surveyDate <= dateTo;
                });
            }
            
            // Ausgewählte Anzahl anzeigen
            const selectedCountBadge = document.getElementById('selected-count');
            if (selectedCountBadge) {
                selectedCountBadge.textContent = `${selectedSurveys.length} ausgewählt`;
            }
            
            // Statistiken aktualisieren
            updateStatistics();
            
            return selectedSurveys;
        } catch (error) {
            console.error('Fehler beim Filtern der Fragebögen:', error);
            Utils.notifications.error('Fehler beim Filtern der Daten.');
            return [];
        }
    };
    
    /**
     * Statistiken aktualisieren
     */
    const updateStatistics = () => {
        try {
            const statCount = document.getElementById('stat-count');
            const statSatisfaction = document.getElementById('stat-satisfaction');
            const statHighest = document.getElementById('stat-highest');
            const statLowest = document.getElementById('stat-lowest');
            
            if (!statCount || !statSatisfaction || !statHighest || !statLowest) {
                return;
            }
            
            // Anzahl Fragebögen
            statCount.textContent = selectedSurveys.length;
            
            // Wenn keine Fragebögen ausgewählt sind, Platzhalter anzeigen
            if (selectedSurveys.length === 0) {
                statSatisfaction.textContent = '-';
                statHighest.textContent = '-';
                statLowest.textContent = '-';
                return;
            }
            
            // Durchschnittliche Gesamtzufriedenheit (Q33 und Q34)
            let totalSatisfaction = 0;
            let satisfactionCount = 0;
            
            selectedSurveys.forEach(survey => {
                if (survey.q33) {
                    totalSatisfaction += survey.q33;
                    satisfactionCount++;
                }
                if (survey.q34) {
                    totalSatisfaction += survey.q34;
                    satisfactionCount++;
                }
            });
            
            const avgSatisfaction = satisfactionCount > 0 ? totalSatisfaction / satisfactionCount : 0;
            statSatisfaction.textContent = avgSatisfaction.toFixed(1);
            
            // Höchste und niedrigste Bewertung finden
            let highestScore = { value: 0, questionId: '' };
            let lowestScore = { value: 6, questionId: '' }; // Höher als die max. Likert-Skala
            
            // Durchschnitte für alle Fragen berechnen
            const questionAverages = {};
            
            // Durch alle Fragebogenabschnitte iterieren
            SurveySchema.sections.forEach(section => {
                section.questions.forEach(question => {
                    if (question.type === 'likert') {
                        // Durchschnitt für diese Frage berechnen
                        let sum = 0;
                        let count = 0;
                        
                        selectedSurveys.forEach(survey => {
                            if (survey[question.id] !== null && survey[question.id] !== undefined) {
                                sum += survey[question.id];
                                count++;
                            }
                        });
                        
                        if (count > 0) {
                            const avg = sum / count;
                            questionAverages[question.id] = avg;
                            
                            // Höchste und niedrigste Bewertung aktualisieren
                            if (avg > highestScore.value) {
                                highestScore = { value: avg, questionId: question.id };
                            }
                            if (avg < lowestScore.value) {
                                lowestScore = { value: avg, questionId: question.id };
                            }
                        }
                    }
                });
            });
            
            // Fragen-Details anzeigen
            if (highestScore.questionId) {
                const highestQuestion = getQuestionTextById(highestScore.questionId);
                statHighest.innerHTML = `<span class="stat-highlight">${highestScore.value.toFixed(1)}</span>
                                         <span class="stat-detail">${highestQuestion}</span>`;
            } else {
                statHighest.textContent = '-';
            }
            
            if (lowestScore.questionId) {
                const lowestQuestion = getQuestionTextById(lowestScore.questionId);
                statLowest.innerHTML = `<span class="stat-highlight">${lowestScore.value.toFixed(1)}</span>
                                        <span class="stat-detail">${lowestQuestion}</span>`;
            } else {
                statLowest.textContent = '-';
            }
        } catch (error) {
            console.error('Fehler beim Aktualisieren der Statistiken:', error);
        }
    };
    
    /**
     * Fragetext anhand der ID zurückgeben
     */
    const getQuestionTextById = (questionId) => {
        let questionText = questionId;
        
        SurveySchema.sections.forEach(section => {
            const question = section.questions.find(q => q.id === questionId);
            if (question) {
                // Text auf max. 60 Zeichen kürzen
                questionText = question.text.length > 60 ? 
                    question.text.substring(0, 57) + '...' : 
                    question.text;
            }
        });
        
        return questionText;
    };
    
    /**
     * Übersichtsansicht anzeigen
     */
    const showOverviewView = () => {
        currentView = 'overview';
        
        // View-Actions aktualisieren
        const actionsContainer = document.getElementById('view-actions');
        actionsContainer.innerHTML = `
            <button class="btn btn-outline-primary me-2" id="export-chart-btn">
                <i class="fas fa-download"></i> Diagramm speichern
            </button>
            <button class="btn btn-outline-secondary" id="print-overview-btn">
                <i class="fas fa-print"></i> Drucken
            </button>
        `;
        
        // Event-Listener für Aktionen
        document.getElementById('export-chart-btn').addEventListener('click', exportCurrentChart);
        document.getElementById('print-overview-btn').addEventListener('click', printCurrentView);
        
        // Content-Container leeren und Übersichtsansicht erstellen
        const contentContainer = document.getElementById('analysis-content');
        contentContainer.innerHTML = `
            <div class="row">
                <!-- Alle Themenbereiche -->
                <div class="col-12 mb-4">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Themenbereiche im Vergleich</h5>
                        </div>
                        <div class="card-body">
                            <div class="chart-container-lg">
                                <canvas id="areas-overview-chart" height="300"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <!-- Top und Flop-Bewertungen -->
                <div class="col-lg-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header">
                            <h5 class="mb-0">Top 5 Bewertungen</h5>
                        </div>
                        <div class="card-body">
                            <div class="chart-container">
                                <canvas id="top-questions-chart" height="250"></canvas>
                            </div>
                            <div class="mt-3" id="top-questions-legend"></div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header">
                            <h5 class="mb-0">Niedrigste 5 Bewertungen</h5>
                        </div>
                        <div class="card-body">
                            <div class="chart-container">
                                <canvas id="bottom-questions-chart" height="250"></canvas>
                            </div>
                            <div class="mt-3" id="bottom-questions-legend"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <!-- Verteilung der Antworten -->
                <div class="col-lg-7 mb-4">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Antwortverteilung</h5>
                        </div>
                        <div class="card-body">
                            <div class="chart-container">
                                <canvas id="response-distribution-chart" height="300"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Demografische Übersicht -->
                <div class="col-lg-5 mb-4">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Demografische Verteilung</h5>
                        </div>
                        <div class="card-body">
                            <div class="chart-container">
                                <canvas id="demographic-chart" height="300"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <!-- Heatmap aller Fragen -->
                <div class="col-12">
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">Bewertung aller Fragen</h5>
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-outline-secondary active" id="view-sections-btn">Nach Abschnitten</button>
                                <button class="btn btn-outline-secondary" id="view-questions-btn">Nach Bewertung</button>
                            </div>
                        </div>
                        <div class="card-body">
                            <div id="heatmap-container" class="heatmap-container">
                                <div class="text-center p-5">
                                    <div class="loader"></div>
                                    <p>Daten werden geladen...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Event-Listener für die Ansichts-Umschaltung
        document.getElementById('view-sections-btn').addEventListener('click', (e) => {
            document.getElementById('view-questions-btn').classList.remove('active');
            e.target.classList.add('active');
            renderHeatmap('sections');
        });
        
        document.getElementById('view-questions-btn').addEventListener('click', (e) => {
            document.getElementById('view-sections-btn').classList.remove('active');
            e.target.classList.add('active');
            renderHeatmap('ratings');
        });
        
        // Charts initialisieren
        initOverviewCharts();
        
        // Heatmap rendern
        renderHeatmap('sections');
    };
    
    /**
     * Übersichts-Charts initialisieren
     */
    const initOverviewCharts = () => {
        try {
            // Themenbereiche im Vergleich
            initAreasOverviewChart();
            
            // Top und Flop Bewertungen
            initTopBottomQuestionsCharts();
            
            // Antwortverteilung
            initResponseDistributionChart();
            
            // Demografische Verteilung
            initDemographicChart();
        } catch (error) {
            console.error('Fehler beim Initialisieren der Übersichts-Charts:', error);
        }
    };
    
    /**
     * Themenbereiche-Übersicht-Chart initialisieren
     */
    const initAreasOverviewChart = () => {
        const ctx = document.getElementById('areas-overview-chart');
        if (!ctx) return;
        
        // Wenn keine Daten ausgewählt sind
        if (selectedSurveys.length === 0) {
            ctx.parentElement.innerHTML = `
                <div class="text-center p-4">
                    <i class="fas fa-chart-bar fa-3x text-muted mb-3"></i>
                    <p>Keine Daten für die Anzeige verfügbar.</p>
                </div>
            `;
            return;
        }
        
        // Daten für das Chart aufbereiten
        const areas = SurveySchema.categorization.areas;
        const labels = [];
        const data = [];
        
        areas.forEach(area => {
            // Themenbereich als Label hinzufügen
            labels.push(area.title);
            
            // Durchschnitt für diesen Bereich berechnen
            const average = DataManager.statistics.getAreaAverage(area.id, selectedSurveys);
            data.push(average);
        });
        
        // Chart erstellen
        if (chartsInstances.areasOverview) {
            chartsInstances.areasOverview.destroy();
        }
        
        chartsInstances.areasOverview = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Durchschnittliche Bewertung',
                    data: data,
                    backgroundColor: 'rgba(227, 0, 11, 0.7)',
                    borderColor: 'rgba(227, 0, 11, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        min: 1,
                        max: 5,
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: 'Durchschnittliche Bewertung'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Themenbereiche'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Durchschnitt: ${context.parsed.y.toFixed(2)}`;
                            }
                        }
                    }
                }
            }
        });
    };
    
    /**
     * Top und Flop Fragen-Charts initialisieren
     */
    const initTopBottomQuestionsCharts = () => {
        try {
            const topCtx = document.getElementById('top-questions-chart');
            const bottomCtx = document.getElementById('bottom-questions-chart');
            const topLegend = document.getElementById('top-questions-legend');
            const bottomLegend = document.getElementById('bottom-questions-legend');
            
            if (!topCtx || !bottomCtx) return;
            
            // Wenn keine Daten ausgewählt sind
            if (selectedSurveys.length === 0) {
                const noDataMessage = `
                    <div class="text-center p-4">
                        <i class="fas fa-chart-bar fa-3x text-muted mb-3"></i>
                        <p>Keine Daten für die Anzeige verfügbar.</p>
                    </div>
                `;
                
                topCtx.parentElement.innerHTML = noDataMessage;
                bottomCtx.parentElement.innerHTML = noDataMessage;
                return;
            }
            
            // Durchschnitte für alle Likert-Fragen berechnen
            const questionAverages = [];
            
            SurveySchema.sections.forEach(section => {
                section.questions.forEach(question => {
                    if (question.type === 'likert') {
                        // Durchschnitt für diese Frage berechnen
                        let sum = 0;
                        let count = 0;
                        
                        selectedSurveys.forEach(survey => {
                            const value = survey[question.id];
                            if (value !== null && value !== undefined) {
                                sum += value;
                                count++;
                            }
                        });
                        
                        if (count > 0) {
                            questionAverages.push({
                                id: question.id,
                                text: question.text,
                                average: sum / count
                            });
                        }
                    }
                });
            });
            
            // Nach Durchschnitt sortieren
            questionAverages.sort((a, b) => b.average - a.average);
            
            // Top 5 und Bottom 5
            const top5 = questionAverages.slice(0, 5);
            const bottom5 = questionAverages.slice(-5).reverse();
            
            // Daten für Top-Chart
            const topLabels = top5.map(q => q.id);
            const topData = top5.map(q => q.average);
            
            // Daten für Bottom-Chart
            const bottomLabels = bottom5.map(q => q.id);
            const bottomData = bottom5.map(q => q.average);
            
            // Top-Chart erstellen
            if (chartsInstances.topQuestions) {
                chartsInstances.topQuestions.destroy();
            }
            
            chartsInstances.topQuestions = new Chart(topCtx, {
                type: 'bar',
                data: {
                    labels: topLabels,
                    datasets: [{
                        label: 'Bewertung',
                        data: topData,
                        backgroundColor: 'rgba(46, 204, 113, 0.7)',
                        borderColor: 'rgba(46, 204, 113, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            min: 1,
                            max: 5,
                            beginAtZero: false
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `Bewertung: ${context.parsed.y.toFixed(2)}`;
                                }
                            }
                        }
                    }
                }
            });
            
            // Bottom-Chart erstellen
            if (chartsInstances.bottomQuestions) {
                chartsInstances.bottomQuestions.destroy();
            }
            
            chartsInstances.bottomQuestions = new Chart(bottomCtx, {
                type: 'bar',
                data: {
                    labels: bottomLabels,
                    datasets: [{
                        label: 'Bewertung',
                        data: bottomData,
                        backgroundColor: 'rgba(231, 76, 60, 0.7)',
                        borderColor: 'rgba(231, 76, 60, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            min: 1,
                            max: 5,
                            beginAtZero: false
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `Bewertung: ${context.parsed.y.toFixed(2)}`;
                                }
                            }
                        }
                    }
                }
            });
            
            // Legenden mit vollständigen Fragen erstellen
            if (topLegend) {
                topLegend.innerHTML = '<ul class="chart-legend">' + 
                    top5.map((q, i) => `
                        <li>
                            <span class="legend-color" style="background-color: rgba(46, 204, 113, 0.7)"></span>
                            <strong>${q.id}:</strong> ${truncateText(q.text, 100)}
                        </li>
                    `).join('') + 
                '</ul>';
            }
            
            if (bottomLegend) {
                bottomLegend.innerHTML = '<ul class="chart-legend">' + 
                    bottom5.map((q, i) => `
                        <li>
                            <span class="legend-color" style="background-color: rgba(231, 76, 60, 0.7)"></span>
                            <strong>${q.id}:</strong> ${truncateText(q.text, 100)}
                        </li>
                    `).join('') + 
                '</ul>';
            }
        } catch (error) {
            console.error('Fehler beim Initialisieren der Top/Bottom Charts:', error);
        }
    };
    
    /**
     * Antwortverteilungs-Chart initialisieren
     */
    const initResponseDistributionChart = () => {
        const ctx = document.getElementById('response-distribution-chart');
        if (!ctx) return;
        
        // Wenn keine Daten ausgewählt sind
        if (selectedSurveys.length === 0) {
            ctx.parentElement.innerHTML = `
                <div class="text-center p-4">
                    <i class="fas fa-chart-bar fa-3x text-muted mb-3"></i>
                    <p>Keine Daten für die Anzeige verfügbar.</p>
                </div>
            `;
            return;
        }
        
        // Antwortverteilung über alle Likert-Fragen
        const distribution = {
            1: 0, 2: 0, 3: 0, 4: 0, 5: 0
        };
        let totalResponses = 0;
        
        selectedSurveys.forEach(survey => {
            SurveySchema.sections.forEach(section => {
                section.questions.forEach(question => {
                    if (question.type === 'likert') {
                        const value = survey[question.id];
                        if (value !== null && value !== undefined) {
                            distribution[value] = (distribution[value] || 0) + 1;
                            totalResponses++;
                        }
                    }
                });
            });
        });
        
        // Chart erstellen
        if (chartsInstances.responseDistribution) {
            chartsInstances.responseDistribution.destroy();
        }
        
        chartsInstances.responseDistribution = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Stimme gar nicht zu (1)', 'Stimme eher nicht zu (2)', 'Teils/teils (3)', 'Stimme eher zu (4)', 'Stimme voll zu (5)'],
                datasets: [{
                    data: [distribution[1], distribution[2], distribution[3], distribution[4], distribution[5]],
                    backgroundColor: [
                        'rgba(231, 76, 60, 0.7)',
                        'rgba(243, 156, 18, 0.7)',
                        'rgba(52, 152, 219, 0.7)',
                        'rgba(46, 204, 113, 0.7)',
                        'rgba(39, 174, 96, 0.7)'
                    ],
                    borderColor: [
                        'rgba(231, 76, 60, 1)',
                        'rgba(243, 156, 18, 1)',
                        'rgba(52, 152, 219, 1)',
                        'rgba(46, 204, 113, 1)',
                        'rgba(39, 174, 96, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const percent = ((value / totalResponses) * 100).toFixed(1);
                                return `${context.label}: ${value} Antworten (${percent}%)`;
                            }
                        }
                    }
                }
            }
        });
    };
    
    /**
     * Demografisches Chart initialisieren
     */
    const initDemographicChart = () => {
        const ctx = document.getElementById('demographic-chart');
        if (!ctx) return;
        
        // Wenn keine Daten ausgewählt sind
        if (selectedSurveys.length === 0) {
            ctx.parentElement.innerHTML = `
                <div class="text-center p-4">
                    <i class="fas fa-chart-bar fa-3x text-muted mb-3"></i>
                    <p>Keine Daten für die Anzeige verfügbar.</p>
                </div>
            `;
            return;
        }
        
        // Berufsgruppen zählen
        const professionCounts = {};
        SurveySchema.demographicOptions.profession.forEach(p => {
            professionCounts[p.id] = 0;
        });
        professionCounts.undefined = 0;
        
        selectedSurveys.forEach(survey => {
            const prof = survey.profession || 'undefined';
            professionCounts[prof] = (professionCounts[prof] || 0) + 1;
        });
        
        // Daten für das Chart aufbereiten
        const labels = [];
        const data = [];
        const colors = [];
        
        SurveySchema.demographicOptions.profession.forEach(p => {
            labels.push(p.label);
            data.push(professionCounts[p.id]);
        });
        
        // Nicht angegeben hinzufügen, falls vorhanden
        if (professionCounts.undefined > 0) {
            labels.push('Nicht angegeben');
            data.push(professionCounts.undefined);
        }
        
        // Farben generieren
        const baseColors = [
            'rgba(227, 0, 11, 0.7)',
            'rgba(52, 152, 219, 0.7)',
            'rgba(46, 204, 113, 0.7)'
        ];
        
        for (let i = 0; i < data.length; i++) {
            colors.push(baseColors[i % baseColors.length]);
        }
        
        // Chart erstellen
        if (chartsInstances.demographic) {
            chartsInstances.demographic.destroy();
        }
        
        chartsInstances.demographic = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderColor: colors.map(c => c.replace('0.7', '1')),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const percent = ((value / selectedSurveys.length) * 100).toFixed(1);
                                return `${context.label}: ${value} (${percent}%)`;
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: 'Verteilung nach Berufsgruppe'
                    }
                }
            }
        });
    };
    
    /**
     * Heatmap für alle Fragen rendern
     */
    const renderHeatmap = (mode = 'sections') => {
        try {
            const heatmapContainer = document.getElementById('heatmap-container');
            if (!heatmapContainer) return;
            
            // Wenn keine Daten ausgewählt sind
            if (selectedSurveys.length === 0) {
                heatmapContainer.innerHTML = `
                    <div class="text-center p-4">
                        <i class="fas fa-th fa-3x text-muted mb-3"></i>
                        <p>Keine Daten für die Heatmap verfügbar.</p>
                    </div>
                `;
                return;
            }
            
            // Durchschnitte für alle Likert-Fragen berechnen
            const questionAverages = [];
            
            SurveySchema.sections.forEach(section => {
                section.questions.forEach(question => {
                    if (question.type === 'likert') {
                        // Durchschnitt für diese Frage berechnen
                        let sum = 0;
                        let count = 0;
                        
                        selectedSurveys.forEach(survey => {
                            const value = survey[question.id];
                            if (value !== null && value !== undefined) {
                                sum += value;
                                count++;
                            }
                        });
                        
                        if (count > 0) {
                            questionAverages.push({
                                id: question.id,
                                text: question.text,
                                section: section.title,
                                sectionId: section.id,
                                average: sum / count
                            });
                        }
                    }
                });
            });
            
            // HTML für die Heatmap generieren
            let heatmapHTML = '';
            
            if (mode === 'sections') {
                // Nach Abschnitten gruppieren
                const sectionGroups = {};
                
                questionAverages.forEach(q => {
                    if (!sectionGroups[q.sectionId]) {
                        sectionGroups[q.sectionId] = {
                            title: q.section,
                            questions: []
                        };
                    }
                    
                    sectionGroups[q.sectionId].questions.push(q);
                });
                
                // HTML für jeden Abschnitt generieren
                Object.values(sectionGroups).forEach(section => {
                    heatmapHTML += `
                        <div class="heatmap-section mb-4">
                            <h6 class="heatmap-section-title">${section.title}</h6>
                            <div class="heatmap-grid">
                    `;
                    
                    section.questions.forEach(q => {
                        const colorClass = getHeatmapColorClass(q.average);
                        
                        heatmapHTML += `
                            <div class="heatmap-cell ${colorClass}" title="${q.text}">
                                <div class="heatmap-id">${q.id}</div>
                                <div class="heatmap-value">${q.average.toFixed(1)}</div>
                            </div>
                        `;
                    });
                    
                    heatmapHTML += `
                            </div>
                        </div>
                    `;
                });
            } else {
                // Nach Bewertung sortieren
                questionAverages.sort((a, b) => b.average - a.average);
                
                heatmapHTML += '<div class="heatmap-grid heatmap-grid-sorted">';
                
                questionAverages.forEach(q => {
                    const colorClass = getHeatmapColorClass(q.average);
                    
                    heatmapHTML += `
                        <div class="heatmap-cell ${colorClass}" title="${q.text}">
                            <div class="heatmap-id">${q.id}</div>
                            <div class="heatmap-value">${q.average.toFixed(1)}</div>
                            <div class="heatmap-section-name">${q.section}</div>
                        </div>
                    `;
                });
                
                heatmapHTML += '</div>';
            }
            
            // Heatmap-Container aktualisieren
            heatmapContainer.innerHTML = heatmapHTML;
            
            // Tooltips für Heatmap-Zellen
            const cells = heatmapContainer.querySelectorAll('.heatmap-cell');
            cells.forEach(cell => {
                cell.addEventListener('click', () => {
                    // ID aus der Zelle extrahieren
                    const idElement = cell.querySelector('.heatmap-id');
                    if (idElement) {
                        const questionId = idElement.textContent;
                        showQuestionDetailDialog(questionId);
                    }
                });
            });
        } catch (error) {
            console.error('Fehler beim Rendern der Heatmap:', error);
            
            const heatmapContainer = document.getElementById('heatmap-container');
            if (heatmapContainer) {
                heatmapContainer.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle"></i> 
                        Fehler beim Erstellen der Heatmap: ${error.message}
                    </div>
                `;
            }
        }
    };
    
    /**
     * Dialog mit Detailinformationen zu einer Frage anzeigen
     */
    const showQuestionDetailDialog = (questionId) => {
        try {
            // Frage finden
            let questionData = null;
            
            SurveySchema.sections.forEach(section => {
                const question = section.questions.find(q => q.id === questionId);
                if (question) {
                    questionData = {
                        ...question,
                        section: section.title
                    };
                }
            });
            
            if (!questionData) {
                Utils.notifications.error(`Frage ${questionId} nicht gefunden.`);
                return;
            }
            
            // Antworten für diese Frage sammeln
            const answers = [];
            selectedSurveys.forEach(survey => {
                const value = survey[questionId];
                if (value !== null && value !== undefined) {
                    answers.push(value);
                }
            });
            
            // Statistiken berechnen
            const average = answers.length > 0 ? 
                answers.reduce((sum, val) => sum + val, 0) / answers.length : 
                0;
            
            const sortedAnswers = [...answers].sort((a, b) => a - b);
            const middleIndex = Math.floor(sortedAnswers.length / 2);
            const median = sortedAnswers.length % 2 === 0 ?
                (sortedAnswers[middleIndex - 1] + sortedAnswers[middleIndex]) / 2 :
                sortedAnswers[middleIndex];
            
            const stdDev = answers.length > 0 ?
                Math.sqrt(answers.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / answers.length) :
                0;
            
            // Verteilung berechnen
            const distribution = {
                1: 0, 2: 0, 3: 0, 4: 0, 5: 0
            };
            
            answers.forEach(value => {
                distribution[value] = (distribution[value] || 0) + 1;
            });
            
            // Prozentuale Verteilung berechnen
            const percentages = {};
            Object.keys(distribution).forEach(key => {
                percentages[key] = answers.length > 0 ? 
                    ((distribution[key] / answers.length) * 100).toFixed(1) + '%' :
                    '0%';
            });
            
            // Dialog anzeigen
            Utils.modal.custom({
                title: `Detailanalyse: ${questionId}`,
                content: `
                    <div class="question-detail-dialog">
                        <div class="question-info mb-3">
                            <h5>${questionData.text}</h5>
                            <div class="text-muted">Abschnitt: ${questionData.section}</div>
                        </div>
                        
                        <div class="row mb-4">
                            <div class="col-md-4 mb-3">
                                <div class="stat-card">
                                    <div class="stat-label">Durchschnitt</div>
                                    <div class="stat-value">${average.toFixed(2)}</div>
                                </div>
                            </div>
                            <div class="col-md-4 mb-3">
                                <div class="stat-card">
                                    <div class="stat-label">Median</div>
                                    <div class="stat-value">${median.toFixed(2)}</div>
                                </div>
                            </div>
                            <div class="col-md-4 mb-3">
                                <div class="stat-card">
                                    <div class="stat-label">Standardabweichung</div>
                                    <div class="stat-value">${stdDev.toFixed(2)}</div>
                                </div>
                            </div>
                        </div>
                        
                        <h6>Antwortverteilung</h6>
                        <div class="distribution-bars mb-4">
                            <div class="distribution-item">
                                <div class="distribution-label">Stimme gar nicht zu (1)</div>
                                <div class="distribution-bar-container">
                                    <div class="distribution-bar bg-danger" style="width: ${percentages[1]}"></div>
                                    <div class="distribution-value">${distribution[1]} (${percentages[1]})</div>
                                </div>
                            </div>
                            <div class="distribution-item">
                                <div class="distribution-label">Stimme eher nicht zu (2)</div>
                                <div class="distribution-bar-container">
                                    <div class="distribution-bar bg-warning" style="width: ${percentages[2]}"></div>
                                    <div class="distribution-value">${distribution[2]} (${percentages[2]})</div>
                                </div>
                            </div>
                            <div class="distribution-item">
                                <div class="distribution-label">Teils/teils (3)</div>
                                <div class="distribution-bar-container">
                                    <div class="distribution-bar bg-info" style="width: ${percentages[3]}"></div>
                                    <div class="distribution-value">${distribution[3]} (${percentages[3]})</div>
                                </div>
                            </div>
                            <div class="distribution-item">
                                <div class="distribution-label">Stimme eher zu (4)</div>
                                <div class="distribution-bar-container">
                                    <div class="distribution-bar bg-success" style="width: ${percentages[4]}"></div>
                                    <div class="distribution-value">${distribution[4]} (${percentages[4]})</div>
                                </div>
                            </div>
                            <div class="distribution-item">
                                <div class="distribution-label">Stimme voll zu (5)</div>
                                <div class="distribution-bar-container">
                                    <div class="distribution-bar bg-success" style="width: ${percentages[5]}"></div>
                                    <div class="distribution-value">${distribution[5]} (${percentages[5]})</div>
                                </div>
                            </div>
                        </div>
                        
                        <div id="question-detail-chart-container" style="height: 250px;">
                            <canvas id="question-detail-chart"></canvas>
                        </div>
                    </div>
                `,
                size: 'large',
                onOpen: () => {
                    // Chart erstellen
                    const ctx = document.getElementById('question-detail-chart');
                    if (ctx) {
                        new Chart(ctx, {
                            type: 'bar',
                            data: {
                                labels: ['1', '2', '3', '4', '5'],
                                datasets: [{
                                    label: 'Anzahl Antworten',
                                    data: [distribution[1], distribution[2], distribution[3], distribution[4], distribution[5]],
                                    backgroundColor: [
                                        'rgba(231, 76, 60, 0.7)',
                                        'rgba(243, 156, 18, 0.7)',
                                        'rgba(52, 152, 219, 0.7)',
                                        'rgba(46, 204, 113, 0.7)',
                                        'rgba(39, 174, 96, 0.7)'
                                    ],
                                    borderColor: [
                                        'rgba(231, 76, 60, 1)',
                                        'rgba(243, 156, 18, 1)',
                                        'rgba(52, 152, 219, 1)',
                                        'rgba(46, 204, 113, 1)',
                                        'rgba(39, 174, 96, 1)'
                                    ],
                                    borderWidth: 1
                                }]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                    y: {
                                        beginAtZero: true
                                    }
                                },
                                plugins: {
                                    legend: {
                                        display: false
                                    },
                                    tooltip: {
                                        callbacks: {
                                            label: function(context) {
                                                const value = context.raw;
                                                const percent = answers.length > 0 ? 
                                                    ((value / answers.length) * 100).toFixed(1) : 
                                                    0;
                                                return `${value} Antworten (${percent}%)`;
                                            }
                                        }
                                    }
                                }
                            }
                        });
                    }
                }
            });
        } catch (error) {
            console.error('Fehler beim Anzeigen der Fragedetails:', error);
            Utils.notifications.error('Fehler beim Anzeigen der Fragedetails.');
        }
    };
    
    /**
     * Detailansicht anzeigen
     */
    const showDetailView = () => {
        currentView = 'detail';
        
        // View-Actions aktualisieren
        const actionsContainer = document.getElementById('view-actions');
        actionsContainer.innerHTML = `
            <button class="btn btn-outline-primary me-2" id="export-detail-chart-btn">
                <i class="fas fa-download"></i> Diagramm speichern
            </button>
            <button class="btn btn-outline-secondary" id="print-detail-btn">
                <i class="fas fa-print"></i> Drucken
            </button>
        `;
        
        // Event-Listener für Aktionen
        document.getElementById('export-detail-chart-btn').addEventListener('click', exportCurrentChart);
        document.getElementById('print-detail-btn').addEventListener('click', printCurrentView);
        
        // Content-Container leeren und Detailansicht erstellen
        const contentContainer = document.getElementById('analysis-content');
        contentContainer.innerHTML = `
            <div class="row mb-4">
                <!-- Fragebogenabschnitte -->
                <div class="col-lg-4">
                    <div class="card h-100">
                        <div class="card-header">
                            <h5 class="mb-0">Fragebogenabschnitte</h5>
                        </div>
                        <div class="card-body p-0">
                            <div class="list-group list-group-flush" id="section-list">
                                <!-- Wird dynamisch befüllt -->
                                <div class="text-center p-3">
                                    <div class="loader"></div>
                                    <p>Daten werden geladen...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Fragen des ausgewählten Abschnitts -->
                <div class="col-lg-8">
                    <div class="card h-100">
                        <div class="card-header">
                            <h5 class="mb-0" id="selected-section-title">Wählen Sie einen Abschnitt</h5>
                        </div>
                        <div class="card-body">
                            <div id="selected-section-content">
                                <div class="placeholder-content">
                                    <i class="fas fa-arrow-left fa-3x text-muted mb-3"></i>
                                    <p>Wählen Sie einen Fragebogenabschnitt aus, um die Fragen anzuzeigen.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Detailansicht für ausgewählte Frage -->
            <div id="question-detail-container" style="display: none;">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0" id="selected-question-title">Fragendetails</h5>
                        <button class="btn btn-sm btn-outline-secondary" id="close-question-detail-btn">
                            <i class="fas fa-times"></i> Schließen
                        </button>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-lg-8 mb-4">
                                <div class="chart-container-lg">
                                    <canvas id="question-detail-chart" height="300"></canvas>
                                </div>
                            </div>
                            <div class="col-lg-4 mb-4">
                                <div class="question-stats">
                                    <!-- Wird dynamisch befüllt -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Event-Listener für Schließen-Button der Fragedetails
        document.getElementById('close-question-detail-btn').addEventListener('click', () => {
            document.getElementById('question-detail-container').style.display = 'none';
        });
        
        // Fragebogenabschnitte laden
        loadSectionsList();
    };
    
    /**
     * Fragebogenabschnitte laden
     */
    const loadSectionsList = () => {
        try {
            const sectionList = document.getElementById('section-list');
            if (!sectionList) return;
            
            sectionList.innerHTML = '';
            
            // Durch alle Fragebogenabschnitte iterieren
            SurveySchema.sections.forEach(section => {
                const item = document.createElement('a');
                item.href = '#';
                item.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
                item.setAttribute('data-section-id', section.id);
                
                item.innerHTML = `
                    <div>
                        <div class="fw-bold">${section.title}</div>
                        <div class="small text-muted">${section.questions.length} Fragen</div>
                    </div>
                    <span class="badge bg-primary rounded-pill">${calculateSectionAverage(section.id).toFixed(1)}</span>
                `;
                
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    // Aktiven Eintrag setzen
                    document.querySelectorAll('.list-group-item').forEach(item => {
                        item.classList.remove('active');
                    });
                    item.classList.add('active');
                    
                    // Abschnitt auswählen
                    selectSection(section);
                });
                
                sectionList.appendChild(item);
            });
            
            // Demografischen Abschnitt hinzufügen
            const demoItem = document.createElement('a');
            demoItem.href = '#';
            demoItem.className = 'list-group-item list-group-item-action';
            demoItem.setAttribute('data-section-id', 'demographics');
            
            demoItem.innerHTML = `
                <div class="fw-bold">Demografische Angaben</div>
                <div class="small text-muted">Optionale Angaben</div>
            `;
            
            demoItem.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Aktiven Eintrag setzen
                document.querySelectorAll('.list-group-item').forEach(item => {
                    item.classList.remove('active');
                });
                demoItem.classList.add('active');
                
                // Demografischen Abschnitt anzeigen
                showDemographicSection();
            });
            
            sectionList.appendChild(demoItem);
            
            // Ersten Abschnitt auswählen
            if (SurveySchema.sections.length > 0) {
                selectSection(SurveySchema.sections[0]);
                sectionList.querySelector('.list-group-item').classList.add('active');
            }
        } catch (error) {
            console.error('Fehler beim Laden der Fragebogenabschnitte:', error);
            
            const sectionList = document.getElementById('section-list');
            if (sectionList) {
                sectionList.innerHTML = `
                    <div class="alert alert-danger m-3">
                        <i class="fas fa-exclamation-circle"></i> 
                        Fehler beim Laden der Fragebogenabschnitte: ${error.message}
                    </div>
                `;
            }
        }
    };
    
    /**
     * Durchschnitt für einen Abschnitt berechnen
     */
    const calculateSectionAverage = (sectionId) => {
        if (!selectedSurveys || selectedSurveys.length === 0) {
            return 0;
        }
        
        // Abschnitt finden
        const section = SurveySchema.sections.find(s => s.id === sectionId);
        if (!section) return 0;
        
        // Durch alle Fragen im Abschnitt iterieren und Durchschnitte berechnen
        let totalSum = 0;
        let totalCount = 0;
        
        section.questions.forEach(question => {
            if (question.type === 'likert') {
                let sum = 0;
                let count = 0;
                
                selectedSurveys.forEach(survey => {
                    const value = survey[question.id];
                    if (value !== null && value !== undefined) {
                        sum += value;
                        count++;
                    }
                });
                
                if (count > 0) {
                    totalSum += sum;
                    totalCount += count;
                }
            }
        });
        
        return totalCount > 0 ? totalSum / totalCount : 0;
    };
    
    /**
     * Abschnitt auswählen und Fragen anzeigen
     */
    const selectSection = (section) => {
        try {
            selectedSection = section;
            
            const titleElement = document.getElementById('selected-section-title');
            const contentElement = document.getElementById('selected-section-content');
            
            if (!titleElement || !contentElement) return;
            
            titleElement.textContent = section.title;
            
            // Fragedetails ausblenden
            document.getElementById('question-detail-container').style.display = 'none';
            
            // Übersicht über alle Fragen im Abschnitt anzeigen
            let contentHTML = `
                <div class="section-info mb-4">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <div>
                            <h6>${section.questions.length} Fragen in diesem Abschnitt</h6>
                            ${section.description ? `<p class="text-muted">${section.description}</p>` : ''}
                        </div>
                        <div>
                            <span class="badge bg-primary p-2" style="font-size: 1.1rem;">Ø ${calculateSectionAverage(section.id).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            `;
            
            if (section.questions.length > 0) {
                contentHTML += '<div class="questions-list">';
                
                section.questions.forEach(question => {
                    if (question.type === 'likert') {
                        // Statistiken für diese Frage berechnen
                        const stats = calculateQuestionStatistics(question.id);
                        
                        // Farbe basierend auf Durchschnitt
                        const colorClass = getColorClassByValue(stats.average);
                        
                        contentHTML += `
                            <div class="question-item mb-4" data-question-id="${question.id}">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <div>
                                        <h6 class="mb-1">
                                            <span class="question-number">${question.id}</span>
                                            ${question.text}
                                        </h6>
                                    </div>
                                    <div>
                                        <span class="badge ${colorClass} p-2">${stats.average.toFixed(2)}</span>
                                    </div>
                                </div>
                                
                                <div class="question-distribution">
                                    <div class="distribution-bar-wrapper">
                                        <div class="distribution-segment" style="width: ${stats.percentages[1]}; background-color: rgba(231, 76, 60, 0.7);" title="1: ${stats.percentages[1]}"></div>
                                        <div class="distribution-segment" style="width: ${stats.percentages[2]}; background-color: rgba(243, 156, 18, 0.7);" title="2: ${stats.percentages[2]}"></div>
                                        <div class="distribution-segment" style="width: ${stats.percentages[3]}; background-color: rgba(52, 152, 219, 0.7);" title="3: ${stats.percentages[3]}"></div>
                                        <div class="distribution-segment" style="width: ${stats.percentages[4]}; background-color: rgba(46, 204, 113, 0.7);" title="4: ${stats.percentages[4]}"></div>
                                        <div class="distribution-segment" style="width: ${stats.percentages[5]}; background-color: rgba(39, 174, 96, 0.7);" title="5: ${stats.percentages[5]}"></div>
                                    </div>
                                </div>
                                
                                <div class="question-actions mt-2">
                                    <button class="btn btn-sm btn-outline-primary view-question-details-btn" data-question-id="${question.id}">
                                        <i class="fas fa-chart-bar"></i> Details anzeigen
                                    </button>
                                </div>
                            </div>
                        `;
                    } else if (question.type === 'text') {
                        // Offene Frage
                        contentHTML += `
                            <div class="question-item mb-4">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <div>
                                        <h6 class="mb-1">
                                            <span class="question-number">${question.id}</span>
                                            ${question.text}
                                        </h6>
                                    </div>
                                    <div>
                                        <span class="badge bg-secondary p-2">Offene Frage</span>
                                    </div>
                                </div>
                                <div class="text-muted">
                                    <button class="btn btn-sm btn-outline-primary view-text-answers-btn" data-question-id="${question.id}">
                                        <i class="fas fa-comment-alt"></i> Antworten anzeigen
                                    </button>
                                </div>
                            </div>
                        `;
                    }
                });
                
                contentHTML += '</div>';
            } else {
                contentHTML = `
                    <div class="placeholder-content text-center">
                        <i class="fas fa-ban fa-3x text-muted mb-3"></i>
                        <p>Keine Fragen in diesem Abschnitt.</p>
                    </div>
                `;
            }
            
            contentElement.innerHTML = contentHTML;
            
            // Event-Listener für Details-Buttons
            document.querySelectorAll('.view-question-details-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const questionId = btn.getAttribute('data-question-id');
                    showQuestionDetails(questionId);
                });
            });
            
            // Event-Listener für Textantworten-Buttons
            document.querySelectorAll('.view-text-answers-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const questionId = btn.getAttribute('data-question-id');
                    showTextAnswers(questionId);
                });
            });
        } catch (error) {
            console.error('Fehler beim Anzeigen des Abschnitts:', error);
            
            const contentElement = document.getElementById('selected-section-content');
            if (contentElement) {
                contentElement.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle"></i> 
                        Fehler beim Anzeigen des Abschnitts: ${error.message}
                    </div>
                `;
            }
        }
    };
    
    /**
     * Demografischen Abschnitt anzeigen
     */
    const showDemographicSection = () => {
        try {
            selectedSection = null;
            
            const titleElement = document.getElementById('selected-section-title');
            const contentElement = document.getElementById('selected-section-content');
            
            if (!titleElement || !contentElement) return;
            
            titleElement.textContent = 'Demografische Angaben';
            
            // Fragedetails ausblenden
            document.getElementById('question-detail-container').style.display = 'none';
            
            if (selectedSurveys.length === 0) {
                contentElement.innerHTML = `
                    <div class="placeholder-content text-center">
                        <i class="fas fa-users fa-3x text-muted mb-3"></i>
                        <p>Keine Daten verfügbar.</p>
                    </div>
                `;
                return;
            }
            
            // Zählen der demografischen Daten
            const professionCounts = {};
            const experienceCounts = {};
            const tenureCounts = {};
            
            SurveySchema.demographicOptions.profession.forEach(p => {
                professionCounts[p.id] = 0;
            });
            professionCounts.undefined = 0;
            
            SurveySchema.demographicOptions.experience.forEach(e => {
                experienceCounts[e.id] = 0;
            });
            experienceCounts.undefined = 0;
            
            SurveySchema.demographicOptions.tenure.forEach(t => {
                tenureCounts[t.id] = 0;
            });
            tenureCounts.undefined = 0;
            
            selectedSurveys.forEach(survey => {
                const prof = survey.profession || 'undefined';
                const exp = survey.experience || 'undefined';
                const tenure = survey.tenure || 'undefined';
                
                professionCounts[prof] = (professionCounts[prof] || 0) + 1;
                experienceCounts[exp] = (experienceCounts[exp] || 0) + 1;
                tenureCounts[tenure] = (tenureCounts[tenure] || 0) + 1;
            });
            
            // Demografische Daten anzeigen
            contentElement.innerHTML = `
                <div class="demographic-charts">
                    <div class="row">
                        <div class="col-lg-4 mb-4">
                            <h6>Berufsgruppe</h6>
                            <div class="chart-container" style="height: 250px;">
                                <canvas id="profession-chart"></canvas>
                            </div>
                        </div>
                        <div class="col-lg-4 mb-4">
                            <h6>Berufserfahrung</h6>
                            <div class="chart-container" style="height: 250px;">
                                <canvas id="experience-chart"></canvas>
                            </div>
                        </div>
                        <div class="col-lg-4 mb-4">
                            <h6>Zugehörigkeit zur Abteilung</h6>
                            <div class="chart-container" style="height: 250px;">
                                <canvas id="tenure-chart"></canvas>
                            </div>
                        </div>
                    </div>
                    
                    <div class="demographic-tables mt-4">
                        <div class="row">
                            <div class="col-lg-4 mb-4">
                                <div class="table-container">
                                    <table class="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Berufsgruppe</th>
                                                <th>Anzahl</th>
                                                <th>%</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${SurveySchema.demographicOptions.profession.map(p => `
                                                <tr>
                                                    <td>${p.label}</td>
                                                    <td>${professionCounts[p.id]}</td>
                                                    <td>${((professionCounts[p.id] / selectedSurveys.length) * 100).toFixed(1)}%</td>
                                                </tr>
                                            `).join('')}
                                            ${professionCounts.undefined > 0 ? `
                                                <tr>
                                                    <td>Nicht angegeben</td>
                                                    <td>${professionCounts.undefined}</td>
                                                    <td>${((professionCounts.undefined / selectedSurveys.length) * 100).toFixed(1)}%</td>
                                                </tr>
                                            ` : ''}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div class="col-lg-4 mb-4">
                                <div class="table-container">
                                    <table class="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Berufserfahrung</th>
                                                <th>Anzahl</th>
                                                <th>%</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${SurveySchema.demographicOptions.experience.map(e => `
                                                <tr>
                                                    <td>${e.label}</td>
                                                    <td>${experienceCounts[e.id]}</td>
                                                    <td>${((experienceCounts[e.id] / selectedSurveys.length) * 100).toFixed(1)}%</td>
                                                </tr>
                                            `).join('')}
                                            ${experienceCounts.undefined > 0 ? `
                                                <tr>
                                                    <td>Nicht angegeben</td>
                                                    <td>${experienceCounts.undefined}</td>
                                                    <td>${((experienceCounts.undefined / selectedSurveys.length) * 100).toFixed(1)}%</td>
                                                </tr>
                                            ` : ''}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div class="col-lg-4 mb-4">
                                <div class="table-container">
                                    <table class="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Zugehörigkeit</th>
                                                <th>Anzahl</th>
                                                <th>%</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${SurveySchema.demographicOptions.tenure.map(t => `
                                                <tr>
                                                    <td>${t.label}</td>
                                                    <td>${tenureCounts[t.id]}</td>
                                                    <td>${((tenureCounts[t.id] / selectedSurveys.length) * 100).toFixed(1)}%</td>
                                                </tr>
                                            `).join('')}
                                            ${tenureCounts.undefined > 0 ? `
                                                <tr>
                                                    <td>Nicht angegeben</td>
                                                    <td>${tenureCounts.undefined}</td>
                                                    <td>${((tenureCounts.undefined / selectedSurveys.length) * 100).toFixed(1)}%</td>
                                                </tr>
                                            ` : ''}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Charts erstellen
            createDemographicCharts(professionCounts, experienceCounts, tenureCounts);
        } catch (error) {
            console.error('Fehler beim Anzeigen des demografischen Abschnitts:', error);
            
            const contentElement = document.getElementById('selected-section-content');
            if (contentElement) {
                contentElement.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle"></i> 
                        Fehler beim Anzeigen der demografischen Daten: ${error.message}
                    </div>
                `;
            }
        }
    };
    
    /**
     * Demografische Charts erstellen
     */
    const createDemographicCharts = (professionCounts, experienceCounts, tenureCounts) => {
        try {
            // Berufsgruppen-Chart
            const profCtx = document.getElementById('profession-chart');
            if (profCtx) {
                // Labels und Daten extrahieren
                const profLabels = [];
                const profData = [];
                const colors = [];
                
                // Basis-Farben
                const baseColors = [
                    'rgba(227, 0, 11, 0.7)',
                    'rgba(52, 152, 219, 0.7)',
                    'rgba(46, 204, 113, 0.7)',
                    'rgba(155, 89, 182, 0.7)'
                ];
                
                // Berufsgruppen
                SurveySchema.demographicOptions.profession.forEach((p, index) => {
                    if (professionCounts[p.id] > 0) {
                        profLabels.push(p.label);
                        profData.push(professionCounts[p.id]);
                        colors.push(baseColors[index % baseColors.length]);
                    }
                });
                
                // Nicht angegeben
                if (professionCounts.undefined > 0) {
                    profLabels.push('Nicht angegeben');
                    profData.push(professionCounts.undefined);
                    colors.push('rgba(149, 165, 166, 0.7)');
                }
                
                new Chart(profCtx, {
                    type: 'pie',
                    data: {
                        labels: profLabels,
                        datasets: [{
                            data: profData,
                            backgroundColor: colors,
                            borderColor: colors.map(c => c.replace('0.7', '1')),
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    boxWidth: 12,
                                    padding: 10
                                }
                            }
                        }
                    }
                });
            }
            
            // Berufserfahrungs-Chart
            const expCtx = document.getElementById('experience-chart');
            if (expCtx) {
                // Labels und Daten extrahieren
                const expLabels = [];
                const expData = [];
                
                // Berufserfahrung
                SurveySchema.demographicOptions.experience.forEach(e => {
                    if (experienceCounts[e.id] > 0) {
                        expLabels.push(e.label);
                        expData.push(experienceCounts[e.id]);
                    }
                });
                
                // Nicht angegeben
                if (experienceCounts.undefined > 0) {
                    expLabels.push('Nicht angegeben');
                    expData.push(experienceCounts.undefined);
                }
                
                new Chart(expCtx, {
                    type: 'doughnut',
                    data: {
                        labels: expLabels,
                        datasets: [{
                            data: expData,
                            backgroundColor: [
                                'rgba(52, 152, 219, 0.7)',
                                'rgba(155, 89, 182, 0.7)',
                                'rgba(52, 73, 94, 0.7)',
                                'rgba(22, 160, 133, 0.7)',
                                'rgba(149, 165, 166, 0.7)'
                            ],
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    boxWidth: 12,
                                    padding: 10
                                }
                            }
                        }
                    }
                });
            }
            
            // Zugehörigkeits-Chart
            const tenureCtx = document.getElementById('tenure-chart');
            if (tenureCtx) {
                // Labels und Daten extrahieren
                const tenureLabels = [];
                const tenureData = [];
                
                // Zugehörigkeit
                SurveySchema.demographicOptions.tenure.forEach(t => {
                    if (tenureCounts[t.id] > 0) {
                        tenureLabels.push(t.label);
                        tenureData.push(tenureCounts[t.id]);
                    }
                });
                
                // Nicht angegeben
                if (tenureCounts.undefined > 0) {
                    tenureLabels.push('Nicht angegeben');
                    tenureData.push(tenureCounts.undefined);
                }
                
                new Chart(tenureCtx, {
                    type: 'doughnut',
                    data: {
                        labels: tenureLabels,
                        datasets: [{
                            data: tenureData,
                            backgroundColor: [
                                'rgba(46, 204, 113, 0.7)',
                                'rgba(230, 126, 34, 0.7)',
                                'rgba(155, 89, 182, 0.7)',
                                'rgba(52, 73, 94, 0.7)',
                                'rgba(149, 165, 166, 0.7)'
                            ],
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    boxWidth: 12,
                                    padding: 10
                                }
                            }
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Fehler beim Erstellen der demografischen Charts:', error);
        }
    };
    
    /**
     * Statistiken für eine Frage berechnen
     */
    const calculateQuestionStatistics = (questionId) => {
        // Antworten für diese Frage sammeln
        const answers = [];
        selectedSurveys.forEach(survey => {
            const value = survey[questionId];
            if (value !== null && value !== undefined) {
                answers.push(value);
            }
        });
        
        // Statistiken berechnen
        const average = answers.length > 0 ? 
            answers.reduce((sum, val) => sum + val, 0) / answers.length : 
            0;
        
        // Verteilung berechnen
        const distribution = {
            1: 0, 2: 0, 3: 0, 4: 0, 5: 0
        };
        
        answers.forEach(value => {
            distribution[value] = (distribution[value] || 0) + 1;
        });
        
        // Prozentuale Verteilung berechnen
        const percentages = {};
        Object.keys(distribution).forEach(key => {
            percentages[key] = answers.length > 0 ? 
                ((distribution[key] / answers.length) * 100).toFixed(1) + '%' :
                '0%';
        });
        
        return {
            answers,
            average,
            distribution,
            percentages
        };
    };
    
    /**
     * Details für eine Frage anzeigen
     */
    const showQuestionDetails = (questionId) => {
        try {
            // Frage finden
            let questionData = null;
            
            SurveySchema.sections.forEach(section => {
                const question = section.questions.find(q => q.id === questionId);
                if (question) {
                    questionData = {
                        ...question,
                        section: section.title
                    };
                }
            });
            
            if (!questionData) {
                Utils.notifications.error(`Frage ${questionId} nicht gefunden.`);
                return;
            }
            
            // Aktuelle Frage speichern
            selectedQuestion = questionId;
            
            // Antworten für diese Frage sammeln und Statistiken berechnen
            const stats = calculateQuestionStatistics(questionId);
            
            // Container anzeigen
            const detailContainer = document.getElementById('question-detail-container');
            detailContainer.style.display = 'block';
            
            // Titel setzen
            const titleElement = document.getElementById('selected-question-title');
            titleElement.textContent = `${questionId}: ${questionData.text}`;
            
            // Statistiken anzeigen
            const statsElement = document.querySelector('.question-stats');
            if (statsElement) {
                // Sortierte Antworten für Median und Quartile
                const sortedAnswers = [...stats.answers].sort((a, b) => a - b);
                const middleIndex = Math.floor(sortedAnswers.length / 2);
                
                const median = sortedAnswers.length > 0 ? (
                    sortedAnswers.length % 2 === 0 ?
                    (sortedAnswers[middleIndex - 1] + sortedAnswers[middleIndex]) / 2 :
                    sortedAnswers[middleIndex]
                ) : 0;
                
                // Standardabweichung
                const stdDev = stats.answers.length > 0 ?
                    Math.sqrt(stats.answers.reduce((sum, val) => sum + Math.pow(val - stats.average, 2), 0) / stats.answers.length) :
                    0;
                
                // Varianz
                const variance = stdDev * stdDev;
                
                // Min und Max
                const min = sortedAnswers.length > 0 ? sortedAnswers[0] : 0;
                const max = sortedAnswers.length > 0 ? sortedAnswers[sortedAnswers.length - 1] : 0;
                
                // Antwortmodi (häufigste Werte)
                const modes = [];
                let maxFrequency = 0;
                
                for (let i = 1; i <= 5; i++) {
                    const frequency = stats.distribution[i] || 0;
                    if (frequency > maxFrequency) {
                        maxFrequency = frequency;
                        modes.length = 0;
                        modes.push(i);
                    } else if (frequency === maxFrequency && frequency > 0) {
                        modes.push(i);
                    }
                }
                
                // Statistiken anzeigen
                statsElement.innerHTML = `
                    <div class="statistic-group">
                        <div class="statistic-item">
                            <div class="statistic-label">Durchschnitt</div>
                            <div class="statistic-value">${stats.average.toFixed(2)}</div>
                        </div>
                        <div class="statistic-item">
                            <div class="statistic-label">Median</div>
                            <div class="statistic-value">${median.toFixed(2)}</div>
                        </div>
                        <div class="statistic-item">
                            <div class="statistic-label">Standardabw.</div>
                            <div class="statistic-value">${stdDev.toFixed(2)}</div>
                        </div>
                        <div class="statistic-item">
                            <div class="statistic-label">Varianz</div>
                            <div class="statistic-value">${variance.toFixed(2)}</div>
                        </div>
                    </div>
                    
                    <div class="statistic-group mt-3">
                        <div class="statistic-item">
                            <div class="statistic-label">Min</div>
                            <div class="statistic-value">${min}</div>
                        </div>
                        <div class="statistic-item">
                            <div class="statistic-label">Max</div>
                            <div class="statistic-value">${max}</div>
                        </div>
                        <div class="statistic-item">
                            <div class="statistic-label">Häufigster Wert</div>
                            <div class="statistic-value">${modes.join(', ')}</div>
                        </div>
                        <div class="statistic-item">
                            <div class="statistic-label">Antworten</div>
                            <div class="statistic-value">${stats.answers.length}</div>
                        </div>
                    </div>
                    
                    <div class="distribution-bars mt-4">
                        <h6 class="mb-2">Antwortverteilung</h6>
                        <div class="distribution-item">
                            <div class="distribution-label">1 - Stimme gar nicht zu</div>
                            <div class="distribution-bar-container">
                                <div class="distribution-bar bg-danger" style="width: ${stats.percentages[1]}"></div>
                                <div class="distribution-value">${stats.distribution[1] || 0} (${stats.percentages[1]})</div>
                            </div>
                        </div>
                        <div class="distribution-item">
                            <div class="distribution-label">2 - Stimme eher nicht zu</div>
                            <div class="distribution-bar-container">
                                <div class="distribution-bar bg-warning" style="width: ${stats.percentages[2]}"></div>
                                <div class="distribution-value">${stats.distribution[2] || 0} (${stats.percentages[2]})</div>
                            </div>
                        </div>
                        <div class="distribution-item">
                            <div class="distribution-label">3 - Teils/teils</div>
                            <div class="distribution-bar-container">
                                <div class="distribution-bar bg-info" style="width: ${stats.percentages[3]}"></div>
                                <div class="distribution-value">${stats.distribution[3] || 0} (${stats.percentages[3]})</div>
                            </div>
                        </div>
                        <div class="distribution-item">
                            <div class="distribution-label">4 - Stimme eher zu</div>
                            <div class="distribution-bar-container">
                                <div class="distribution-bar bg-success" style="width: ${stats.percentages[4]}"></div>
                                <div class="distribution-value">${stats.distribution[4] || 0} (${stats.percentages[4]})</div>
                            </div>
                        </div>
                        <div class="distribution-item">
                            <div class="distribution-label">5 - Stimme voll zu</div>
                            <div class="distribution-bar-container">
                                <div class="distribution-bar bg-success" style="width: ${stats.percentages[5]}"></div>
                                <div class="distribution-value">${stats.distribution[5] || 0} (${stats.percentages[5]})</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-4">
                        <button class="btn btn-outline-primary btn-sm export-question-stats-btn">
                            <i class="fas fa-download"></i> Statistiken exportieren
                        </button>
                    </div>
                `;
                
                // Event-Listener für Export-Button
                const exportBtn = statsElement.querySelector('.export-question-stats-btn');
                if (exportBtn) {
                    exportBtn.addEventListener('click', () => {
                        exportQuestionStats(questionId, stats);
                    });
                }
            }
            
            // Chart erstellen
            const chartCtx = document.getElementById('question-detail-chart');
            if (chartCtx) {
                if (chartsInstances.questionDetail) {
                    chartsInstances.questionDetail.destroy();
                }
                
                // Chart-Typ basierend auf globaler Einstellung
                let chartType = currentChartType;
                if (chartType === 'radar' || chartType === 'heatmap') {
                    // Diese Chart-Typen sind für einzelne Fragen nicht sinnvoll
                    chartType = 'bar';
                }
                
                // Chart erstellen
                if (chartType === 'bar') {
                    chartsInstances.questionDetail = new Chart(chartCtx, {
                        type: 'bar',
                        data: {
                            labels: ['1', '2', '3', '4', '5'],
                            datasets: [{
                                label: 'Anzahl Antworten',
                                data: [
                                    stats.distribution[1] || 0,
                                    stats.distribution[2] || 0,
                                    stats.distribution[3] || 0,
                                    stats.distribution[4] || 0,
                                    stats.distribution[5] || 0
                                ],
                                backgroundColor: [
                                    'rgba(231, 76, 60, 0.7)',
                                    'rgba(243, 156, 18, 0.7)',
                                    'rgba(52, 152, 219, 0.7)',
                                    'rgba(46, 204, 113, 0.7)',
                                    'rgba(39, 174, 96, 0.7)'
                                ],
                                borderColor: [
                                    'rgba(231, 76, 60, 1)',
                                    'rgba(243, 156, 18, 1)',
                                    'rgba(52, 152, 219, 1)',
                                    'rgba(46, 204, 113, 1)',
                                    'rgba(39, 174, 96, 1)'
                                ],
                                borderWidth: 1
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    title: {
                                        display: true,
                                        text: 'Anzahl der Antworten'
                                    }
                                },
                                x: {
                                    title: {
                                        display: true,
                                        text: 'Bewertung'
                                    }
                                }
                            },
                            plugins: {
                                legend: {
                                    display: false
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            const value = context.raw;
                                            const total = stats.answers.length;
                                            const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                            return `${value} Antworten (${percent}%)`;
                                        }
                                    }
                                },
                                title: {
                                    display: true,
                                    text: `Verteilung der Antworten für ${questionId}`,
                                    font: {
                                        size: 16
                                    }
                                }
                            }
                        }
                    });
                } else if (chartType === 'pie' || chartType === 'doughnut') {
                    chartsInstances.questionDetail = new Chart(chartCtx, {
                        type: chartType,
                        data: {
                            labels: ['1 - Stimme gar nicht zu', '2 - Stimme eher nicht zu', '3 - Teils/teils', '4 - Stimme eher zu', '5 - Stimme voll zu'],
                            datasets: [{
                                data: [
                                    stats.distribution[1] || 0,
                                    stats.distribution[2] || 0,
                                    stats.distribution[3] || 0,
                                    stats.distribution[4] || 0,
                                    stats.distribution[5] || 0
                                ],
                                backgroundColor: [
                                    'rgba(231, 76, 60, 0.7)',
                                    'rgba(243, 156, 18, 0.7)',
                                    'rgba(52, 152, 219, 0.7)',
                                    'rgba(46, 204, 113, 0.7)',
                                    'rgba(39, 174, 96, 0.7)'
                                ],
                                borderColor: [
                                    'rgba(231, 76, 60, 1)',
                                    'rgba(243, 156, 18, 1)',
                                    'rgba(52, 152, 219, 1)',
                                    'rgba(46, 204, 113, 1)',
                                    'rgba(39, 174, 96, 1)'
                                ],
                                borderWidth: 1
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    position: 'right'
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            const value = context.raw;
                                            const total = stats.answers.length;
                                            const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                            return `${context.label}: ${value} (${percent}%)`;
                                        }
                                    }
                                },
                                title: {
                                    display: true,
                                    text: `Verteilung der Antworten für ${questionId}`,
                                    font: {
                                        size: 16
                                    }
                                }
                            }
                        }
                    });
                } else if (chartType === 'line') {
                    // Für Linien-Chart etwas andere Darstellung
                    chartsInstances.questionDetail = new Chart(chartCtx, {
                        type: 'line',
                        data: {
                            labels: ['1', '2', '3', '4', '5'],
                            datasets: [{
                                label: 'Anzahl Antworten',
                                data: [
                                    stats.distribution[1] || 0,
                                    stats.distribution[2] || 0,
                                    stats.distribution[3] || 0,
                                    stats.distribution[4] || 0,
                                    stats.distribution[5] || 0
                                ],
                                fill: false,
                                borderColor: 'rgba(227, 0, 11, 1)',
                                tension: 0.1,
                                pointBackgroundColor: 'rgba(227, 0, 11, 1)',
                                pointRadius: 5,
                                pointHoverRadius: 7
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    title: {
                                        display: true,
                                        text: 'Anzahl der Antworten'
                                    }
                                },
                                x: {
                                    title: {
                                        display: true,
                                        text: 'Bewertung'
                                    }
                                }
                            },
                            plugins: {
                                legend: {
                                    display: false
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            const value = context.raw;
                                            const total = stats.answers.length;
                                            const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                            return `${value} Antworten (${percent}%)`;
                                        }
                                    }
                                },
                                title: {
                                    display: true,
                                    text: `Verteilung der Antworten für ${questionId}`,
                                    font: {
                                        size: 16
                                    }
                                }
                            }
                        }
                    });
                }
            }
            
            // Zum Detailbereich scrollen
            detailContainer.scrollIntoView({ behavior: 'smooth' });
            
        } catch (error) {
            console.error('Fehler beim Anzeigen der Fragedetails:', error);
            Utils.notifications.error('Fehler beim Anzeigen der Fragedetails.');
        }
    };
    
    /**
     * Textantworten für eine offene Frage anzeigen
     */
    const showTextAnswers = (questionId) => {
        try {
            // Antworten sammeln
            const answers = [];
            
            selectedSurveys.forEach(survey => {
                const text = survey[questionId];
                if (text && text.trim() !== '') {
                    answers.push({
                        text: text,
                        date: survey.timestamp,
                        survey: survey
                    });
                }
            });
            
            // Dialog anzeigen
            Utils.modal.custom({
                title: `Textantworten: ${questionId}`,
                content: `
                    <div class="text-answers-dialog">
                        <div class="mb-3">
                            <p>Es wurden ${answers.length} Antworten gefunden.</p>
                        </div>
                        
                        ${answers.length > 0 ? `
                            <div class="text-answers-list">
                                ${answers.map((answer, index) => `
                                    <div class="text-answer-card mb-3">
                                        <div class="text-answer-content">
                                            "${answer.text}"
                                        </div>
                                        <div class="text-answer-meta">
                                            <div class="text-muted small">
                                                ${Utils.date.formatDateTime(answer.date)}
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <div class="alert alert-info">
                                Keine Textantworten vorhanden.
                            </div>
                        `}
                        
                        ${answers.length > 0 ? `
                            <div class="mt-3">
                                <button id="export-text-answers-btn" class="btn btn-outline-primary btn-sm">
                                    <i class="fas fa-download"></i> Antworten exportieren
                                </button>
                            </div>
                        ` : ''}
                    </div>
                `,
                size: 'large',
                onOpen: () => {
                    // Event-Listener für Export-Button
                    const exportBtn = document.getElementById('export-text-answers-btn');
                    if (exportBtn) {
                        exportBtn.addEventListener('click', () => {
                            exportTextAnswers(questionId, answers);
                        });
                    }
                }
            });
        } catch (error) {
            console.error('Fehler beim Anzeigen der Textantworten:', error);
            Utils.notifications.error('Fehler beim Anzeigen der Textantworten.');
        }
    };
    
    /**
     * Statistiken für eine Frage exportieren
     */
    const exportQuestionStats = (questionId, stats) => {
        try {
            // Frage finden
            let questionText = questionId;
            SurveySchema.sections.forEach(section => {
                const question = section.questions.find(q => q.id === questionId);
                if (question) {
                    questionText = question.text;
                }
            });
            
            // CSV-Daten vorbereiten
            const csvContent = `Statistiken für Frage ${questionId}
Fragetext: ${questionText}

Durchschnitt: ${stats.average.toFixed(2)}
Median: ${calculateMedian(stats.answers).toFixed(2)}
Standardabweichung: ${calculateStandardDeviation(stats.answers, stats.average).toFixed(2)}
Anzahl Antworten: ${stats.answers.length}

Verteilung:
1 - Stimme gar nicht zu: ${stats.distribution[1] || 0} (${((stats.distribution[1] || 0) / stats.answers.length * 100).toFixed(1)}%)
2 - Stimme eher nicht zu: ${stats.distribution[2] || 0} (${((stats.distribution[2] || 0) / stats.answers.length * 100).toFixed(1)}%)
3 - Teils/teils: ${stats.distribution[3] || 0} (${((stats.distribution[3] || 0) / stats.answers.length * 100).toFixed(1)}%)
4 - Stimme eher zu: ${stats.distribution[4] || 0} (${((stats.distribution[4] || 0) / stats.answers.length * 100).toFixed(1)}%)
5 - Stimme voll zu: ${stats.distribution[5] || 0} (${((stats.distribution[5] || 0) / stats.answers.length * 100).toFixed(1)}%)
`;
            
            // Datei herunterladen
            Utils.file.downloadText(csvContent, `frage_${questionId}_statistik.csv`);
            
            // Benachrichtigung anzeigen
            Utils.notifications.success('Statistiken wurden exportiert.');
        } catch (error) {
            console.error('Fehler beim Exportieren der Statistiken:', error);
            Utils.notifications.error('Fehler beim Exportieren der Statistiken.');
        }
    };
    
    /**
     * Textantworten für eine offene Frage exportieren
     */
    const exportTextAnswers = (questionId, answers) => {
        try {
            // Frage finden
            let questionText = questionId;
            SurveySchema.sections.forEach(section => {
                const question = section.questions.find(q => q.id === questionId);
                if (question) {
                    questionText = question.text;
                }
            });
            
            // CSV-Daten vorbereiten
            let csvContent = `Textantworten für Frage ${questionId}
Fragetext: ${questionText}
Anzahl Antworten: ${answers.length}

Datum;Antwort\n`;
            
            // Antworten hinzufügen
            answers.forEach(answer => {
                // Datum formatieren
                const date = Utils.date.formatDate(answer.date);
                // Text für CSV aufbereiten (in Anführungszeichen und Zeilenumbrüche entfernen)
                const text = `"${answer.text.replace(/"/g, '""').replace(/\r?\n|\r/g, ' ')}"`;
                csvContent += `${date};${text}\n`;
            });
            
            // Datei herunterladen
            Utils.file.downloadText(csvContent, `frage_${questionId}_antworten.csv`);
            
            // Benachrichtigung anzeigen
            Utils.notifications.success('Textantworten wurden exportiert.');
        } catch (error) {
            console.error('Fehler beim Exportieren der Textantworten:', error);
            Utils.notifications.error('Fehler beim Exportieren der Textantworten.');
        }
    };
    
    /**
     * Vergleichsansicht anzeigen
     */
    const showComparisonView = () => {
        currentView = 'comparison';
        
        // View-Actions aktualisieren
        const actionsContainer = document.getElementById('view-actions');
        actionsContainer.innerHTML = `
            <button class="btn btn-outline-primary me-2" id="export-comparison-btn">
                <i class="fas fa-download"></i> Diagramm speichern
            </button>
            <button class="btn btn-outline-secondary" id="print-comparison-btn">
                <i class="fas fa-print"></i> Drucken
            </button>
        `;
        
        // Event-Listener für Aktionen
        document.getElementById('export-comparison-btn').addEventListener('click', exportCurrentChart);
        document.getElementById('print-comparison-btn').addEventListener('click', printCurrentView);
        
        // Content-Container leeren und Vergleichsansicht erstellen
        const contentContainer = document.getElementById('analysis-content');
        contentContainer.innerHTML = `
            <div class="card mb-4">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Gruppenvergleich</h5>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-secondary active" id="compare-by-profession-btn">
                            Nach Berufsgruppe
                        </button>
                        <button class="btn btn-outline-secondary" id="compare-by-experience-btn">
                            Nach Berufserfahrung
                        </button>
                        <button class="btn btn-outline-secondary" id="compare-by-tenure-btn">
                            Nach Zugehörigkeit
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row mb-3">
                        <div class="col-md-4">
                            <div class="form-group">
                                <label for="comparison-section" class="form-label">Fragebogenabschnitt</label>
                                <select class="form-control" id="comparison-section">
                                    <option value="">-- Bitte wählen --</option>
                                    <!-- Wird dynamisch befüllt -->
                                </select>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-group">
                                <label for="comparison-question" class="form-label">Frage</label>
                                <select class="form-control" id="comparison-question">
                                    <option value="">-- Bitte erst Abschnitt wählen --</option>
                                    <!-- Wird dynamisch befüllt -->
                                </select>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-group">
                                <label for="comparison-type" class="form-label">Anzeigen</label>
                                <select class="form-control" id="comparison-type">
                                    <option value="averages">Durchschnittswerte</option>
                                    <option value="distribution">Antwortverteilung</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div class="comparison-chart-container mt-4">
                        <div id="comparison-chart-placeholder" class="text-center p-5">
                            <i class="fas fa-chart-bar fa-3x text-muted mb-3"></i>
                            <p>Bitte wählen Sie einen Fragebogenabschnitt und eine Frage aus, um den Vergleich anzuzeigen.</p>
                        </div>
                        <div class="chart-container-lg" style="height: 500px; display: none;">
                            <canvas id="comparison-chart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card mb-4" id="comparison-details-card" style="display: none;">
                <div class="card-header">
                    <h5 class="mb-0" id="comparison-details-title">Detaillierte Vergleichsdaten</h5>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-striped table-bordered" id="comparison-details-table">
                            <thead>
                                <!-- Wird dynamisch befüllt -->
                            </thead>
                            <tbody>
                                <!-- Wird dynamisch befüllt -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        // Abschnitte laden
        loadComparisonSections();
        
        // Event-Listener für Auswahl
        document.getElementById('comparison-section').addEventListener('change', handleSectionChange);
        document.getElementById('comparison-question').addEventListener('change', handleQuestionChange);
        document.getElementById('comparison-type').addEventListener('change', updateComparisonChart);
        
        // Event-Listener für Vergleichsarten
        document.getElementById('compare-by-profession-btn').addEventListener('click', (e) => {
            document.querySelectorAll('.btn-group .btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            selectedComparison = 'profession';
            updateComparisonChart();
        });
        
        document.getElementById('compare-by-experience-btn').addEventListener('click', (e) => {
            document.querySelectorAll('.btn-group .btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            selectedComparison = 'experience';
            updateComparisonChart();
        });
        
        document.getElementById('compare-by-tenure-btn').addEventListener('click', (e) => {
            document.querySelectorAll('.btn-group .btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            selectedComparison = 'tenure';
            updateComparisonChart();
        });
        
        // Standard-Vergleichsart setzen
        selectedComparison = 'profession';
    };
    
    /**
     * Abschnitte für Vergleich laden
     */
    const loadComparisonSections = () => {
        const sectionSelect = document.getElementById('comparison-section');
        if (!sectionSelect) return;
        
        sectionSelect.innerHTML = '<option value="">-- Bitte wählen --</option>';
        
        // Durch alle Fragebogenabschnitte iterieren
        SurveySchema.sections.forEach(section => {
            const option = document.createElement('option');
            option.value = section.id;
            option.textContent = section.title;
            sectionSelect.appendChild(option);
        });
    };
    
    /**
     * Fragen für ausgewählten Abschnitt laden
     */
    const handleSectionChange = () => {
        const sectionId = document.getElementById('comparison-section').value;
        const questionSelect = document.getElementById('comparison-question');
        
        if (!questionSelect) return;
        
        questionSelect.innerHTML = '';
        
        if (!sectionId) {
            questionSelect.innerHTML = '<option value="">-- Bitte erst Abschnitt wählen --</option>';
            return;
        }
        
        // Abschnitt finden
        const section = SurveySchema.sections.find(s => s.id === sectionId);
        if (!section) return;
        
        // Option "Alle Fragen" hinzufügen
        const allOption = document.createElement('option');
        allOption.value = "all";
        allOption.textContent = "Alle Fragen im Abschnitt";
        questionSelect.appendChild(allOption);
        
        // Durch Fragen im Abschnitt iterieren (nur Likert-Fragen)
        section.questions.forEach(question => {
            if (question.type === 'likert') {
                const option = document.createElement('option');
                option.value = question.id;
                option.textContent = `${question.id}: ${truncateText(question.text, 80)}`;
                questionSelect.appendChild(option);
            }
        });
        
        // Wenn Fragen vorhanden sind, erste auswählen
        if (questionSelect.options.length > 1) {
            questionSelect.value = "all";
            handleQuestionChange();
        }
    };
    
    /**
     * Vergleichsdiagramm aktualisieren wenn eine Frage ausgewählt wird
     */
    const handleQuestionChange = () => {
        updateComparisonChart();
    };
    
    /**
     * Vergleichsdiagramm aktualisieren
     */
    const updateComparisonChart = () => {
        try {
            const sectionId = document.getElementById('comparison-section').value;
            const questionId = document.getElementById('comparison-question').value;
            const comparisonType = document.getElementById('comparison-type').value;
            
            // Platzhalter und Chart-Container
            const placeholder = document.getElementById('comparison-chart-placeholder');
            const chartContainer = document.querySelector('.chart-container-lg');
            const detailsCard = document.getElementById('comparison-details-card');
            
            if (!sectionId || !questionId) {
                // Keine Auswahl
                if (placeholder) placeholder.style.display = 'block';
                if (chartContainer) chartContainer.style.display = 'none';
                if (detailsCard) detailsCard.style.display = 'none';
                return;
            }
            
            // Chart anzeigen
            if (placeholder) placeholder.style.display = 'none';
            if (chartContainer) chartContainer.style.display = 'block';
            if (detailsCard) detailsCard.style.display = 'block';
            
            // Section finden
            const section = SurveySchema.sections.find(s => s.id === sectionId);
            if (!section) return;
            
            // Daten aufbereiten
            const comparisonData = prepareComparisonData(section, questionId, selectedComparison, comparisonType);
            
            // Chart erstellen
            createComparisonChart(comparisonData, comparisonType);
            
            // Detailtabelle erstellen
            createComparisonTable(comparisonData, comparisonType);
            
        } catch (error) {
            console.error('Fehler beim Aktualisieren des Vergleichsdiagramms:', error);
            Utils.notifications.error('Fehler beim Erstellen des Vergleichs.');
        }
    };
    
    /**
     * Daten für den Vergleich aufbereiten
     */
    const prepareComparisonData = (section, questionId, comparisonBy, comparisonType) => {
        // Ergebnisobjekt
        const result = {
            section: section,
            questionId: questionId,
            comparisonBy: comparisonBy,
            comparisonType: comparisonType,
            title: '',
            groups: [],
            questions: [],
            datasets: []
        };
        
        // Gruppen basierend auf Vergleichsmerkmal bestimmen
        let groups = [];
        let groupLabels = {};
        
        if (comparisonBy === 'profession') {
            SurveySchema.demographicOptions.profession.forEach(p => {
                groups.push(p.id);
                groupLabels[p.id] = p.label;
            });
            groups.push('undefined');
            groupLabels['undefined'] = 'Nicht angegeben';
            
            result.title = 'Vergleich nach Berufsgruppe';
        }
        else if (comparisonBy === 'experience') {
            SurveySchema.demographicOptions.experience.forEach(e => {
                groups.push(e.id);
                groupLabels[e.id] = e.label;
            });
            groups.push('undefined');
            groupLabels['undefined'] = 'Nicht angegeben';
            
            result.title = 'Vergleich nach Berufserfahrung';
        }
        else if (comparisonBy === 'tenure') {
            SurveySchema.demographicOptions.tenure.forEach(t => {
                groups.push(t.id);
                groupLabels[t.id] = t.label;
            });
            groups.push('undefined');
            groupLabels['undefined'] = 'Nicht angegeben';
            
            result.title = 'Vergleich nach Zugehörigkeit zur Abteilung';
        }
        
        result.groups = groups;
        result.groupLabels = groupLabels;
        
        // Fragen bestimmen
        const questions = [];
        
        if (questionId === 'all') {
            // Alle Likert-Fragen im Abschnitt
            section.questions.forEach(q => {
                if (q.type === 'likert') {
                    questions.push(q);
                }
            });
            result.title += ` - ${section.title}`;
        } else {
            // Nur die ausgewählte Frage
            const question = section.questions.find(q => q.id === questionId);
            if (question) {
                questions.push(question);
                result.title += ` - ${question.text}`;
            }
        }
        
        result.questions = questions;
        
        // Daten aufbereiten
        if (comparisonType === 'averages') {
            // Durchschnittswerte für jede Gruppe und jede Frage
            const datasets = [];
            
            groups.forEach(group => {
                // Fragebögen dieser Gruppe filtern
                const groupSurveys = selectedSurveys.filter(s => (s[comparisonBy] || 'undefined') === group);
                
                // Durchschnittswerte berechnen
                const data = questions.map(q => {
                    // Antworten für diese Frage
                    const values = groupSurveys
                        .map(s => s[q.id])
                        .filter(v => v !== null && v !== undefined);
                    
                    // Durchschnitt
                    return values.length > 0 ?
                        values.reduce((sum, val) => sum + val, 0) / values.length :
                        null;
                });
                
                // Dataset hinzufügen
                datasets.push({
                    label: groupLabels[group],
                    data: data,
                    backgroundColor: getRandomColor(0.7),
                    borderColor: getRandomColor(1),
                    borderWidth: 1
                });
            });
            
            result.datasets = datasets;
            
        } else if (comparisonType === 'distribution') {
            // Antwortverteilung für eine bestimmte Frage
            if (questionId === 'all') {
                // Bei "alle Fragen" nur die erste verwenden
                if (questions.length > 0) {
                    result.questions = [questions[0]];
                    result.title = `${result.title.split(' - ')[0]} - ${questions[0].text}`;
                }
            }
            
            if (result.questions.length === 0) return result;
            
            const question = result.questions[0];
            
            // Dataset für jede Gruppe
            groups.forEach(group => {
                // Fragebögen dieser Gruppe filtern
                const groupSurveys = selectedSurveys.filter(s => (s[comparisonBy] || 'undefined') === group);
                
                // Antwortverteilung berechnen
                const distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
                
                groupSurveys.forEach(s => {
                    const value = s[question.id];
                    if (value !== null && value !== undefined) {
                        distribution[value] = (distribution[value] || 0) + 1;
                    }
                });
                
                // Dataset hinzufügen
                result.datasets.push({
                    label: groupLabels[group],
                    group: group,
                    distribution: distribution,
                    total: Object.values(distribution).reduce((sum, val) => sum + val, 0)
                });
            });
        }
        
        return result;
    };
    
    /**
     * Vergleichs-Chart erstellen
     */
    const createComparisonChart = (data, type) => {
        const chartCtx = document.getElementById('comparison-chart');
        if (!chartCtx) return;
        
        // Altes Chart zerstören falls vorhanden
        if (chartsInstances.comparison) {
            chartsInstances.comparison.destroy();
        }
        
        if (type === 'averages') {
            // Durchschnittsvergleich
            
            // Labels für die Fragen
            const labels = data.questions.map(q => q.id);
            
            // Chart erstellen
            chartsInstances.comparison = new Chart(chartCtx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: data.datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            min: 1,
                            max: 5,
                            beginAtZero: false,
                            title: {
                                display: true,
                                text: 'Durchschnittliche Bewertung'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Fragen'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'top'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.dataset.label}: ${context.parsed.y !== null ? context.parsed.y.toFixed(2) : 'Keine Daten'}`;
                                },
                                title: function(context) {
                                    const questionId = context[0].label;
                                    const question = data.questions.find(q => q.id === questionId);
                                    return question ? `${questionId}: ${truncateText(question.text, 60)}` : questionId;
                                }
                            }
                        },
                        title: {
                            display: true,
                            text: data.title,
                            font: {
                                size: 16
                            }
                        }
                    }
                }
            });
            
        } else if (type === 'distribution') {
            // Antwortverteilung
            
            if (data.questions.length === 0) return;
            const question = data.questions[0];
            
            // Daten für das Chart aufbereiten
            const chartDatasets = [];
            
            // Ein Dataset pro Antwort (1-5), mit den Werten für jede Gruppe
            for (let answer = 1; answer <= 5; answer++) {
                const dataset = {
                    label: `${answer} - ${getLikertLabel(answer)}`,
                    data: data.datasets.map(group => {
                        const count = group.distribution[answer] || 0;
                        return group.total > 0 ? (count / group.total) * 100 : 0;
                    }),
                    backgroundColor: getLikertColor(answer, 0.7),
                    borderColor: getLikertColor(answer, 1),
                    borderWidth: 1
                };
                
                chartDatasets.push(dataset);
            }
            
            // Chart erstellen
            chartsInstances.comparison = new Chart(chartCtx, {
                type: 'bar',
                data: {
                    labels: data.datasets.map(d => d.label),
                    datasets: chartDatasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            min: 0,
                            max: 100,
                            title: {
                                display: true,
                                text: 'Prozent der Antworten'
                            },
                            ticks: {
                                callback: function(value) {
                                    return value + '%';
                                }
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: data.title.split(' - ')[0].replace('Vergleich nach ', '')
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'top'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const datasetIndex = context.datasetIndex;
                                    const groupIndex = context.dataIndex;
                                    const answer = datasetIndex + 1;
                                    const group = data.datasets[groupIndex];
                                    
                                    const count = group.distribution[answer] || 0;
                                    const percent = context.parsed.y.toFixed(1);
                                    
                                    return `${context.dataset.label}: ${count} Antworten (${percent}%)`;
                                }
                            }
                        },
                        title: {
                            display: true,
                            text: `Antwortverteilung: ${question.text.length > 60 ? question.text.substring(0, 57) + '...' : question.text}`,
                            font: {
                                size: 16
                            }
                        }
                    }
                }
            });
        }
    };
    
    /**
     * Vergleichs-Detailtabelle erstellen
     */
    const createComparisonTable = (data, type) => {
        const tableContainer = document.getElementById('comparison-details-table');
        if (!tableContainer) return;
        
        const titleElement = document.getElementById('comparison-details-title');
        if (titleElement) {
            titleElement.textContent = `Detaillierte Vergleichsdaten: ${data.title.split(' - ')[0]}`;
        }
        
        if (type === 'averages') {
            // Durchschnittsvergleich
            
            // Tabellenkopf erstellen
            let tableHead = `
                <tr>
                    <th>Frage</th>
                    ${data.groups.map(group => `<th>${data.groupLabels[group]}</th>`).join('')}
                </tr>
            `;
            
            // Tabelleninhalt erstellen
            let tableBody = '';
            
            data.questions.forEach((question, index) => {
                tableBody += `
                    <tr>
                        <td title="${question.text}">${question.id}</td>
                        ${data.groups.map((group, groupIndex) => {
                            const value = data.datasets[groupIndex].data[index];
                            return `<td>${value !== null ? value.toFixed(2) : '-'}</td>`;
                        }).join('')}
                    </tr>
                `;
            });
            
            // Tabelle zusammensetzen
            tableContainer.innerHTML = `
                <thead>${tableHead}</thead>
                <tbody>${tableBody}</tbody>
            `;
            
        } else if (type === 'distribution') {
            // Antwortverteilung
            
            if (data.questions.length === 0) return;
            const question = data.questions[0];
            
            // Tabellenkopf erstellen
            let tableHead = `
                <tr>
                    <th>${data.title.split(' - ')[0].replace('Vergleich nach ', '')}</th>
                    <th>1 - Stimme gar nicht zu</th>
                    <th>2 - Stimme eher nicht zu</th>
                    <th>3 - Teils/teils</th>
                    <th>4 - Stimme eher zu</th>
                    <th>5 - Stimme voll zu</th>
                    <th>Durchschnitt</th>
                </tr>
            `;
            
            // Tabelleninhalt erstellen
            let tableBody = '';
            
            data.datasets.forEach(group => {
                // Durchschnitt berechnen
                let sum = 0;
                let count = 0;
                
                for (let i = 1; i <= 5; i++) {
                    const value = group.distribution[i] || 0;
                    sum += value * i;
                    count += value;
                }
                
                const average = count > 0 ? sum / count : 0;
                
                tableBody += `
                    <tr>
                        <td>${group.label}</td>
                        ${[1, 2, 3, 4, 5].map(answer => {
                            const value = group.distribution[answer] || 0;
                            const percent = group.total > 0 ? ((value / group.total) * 100).toFixed(1) : '0.0';
                            return `<td>${value} (${percent}%)</td>`;
                        }).join('')}
                        <td class="font-weight-bold">${average.toFixed(2)}</td>
                    </tr>
                `;
            });
            
            // Tabelle zusammensetzen
            tableContainer.innerHTML = `
                <thead>${tableHead}</thead>
                <tbody>${tableBody}</tbody>
            `;
        }
    };
    
    /**
     * Text für Likert-Skala
     */
    const getLikertLabel = (value) => {
        switch (value) {
            case 1: return 'Stimme gar nicht zu';
            case 2: return 'Stimme eher nicht zu';
            case 3: return 'Teils/teils';
            case 4: return 'Stimme eher zu';
            case 5: return 'Stimme voll zu';
            default: return '';
        }
    };
    
    /**
     * Farbe für Likert-Skala
     */
    const getLikertColor = (value, alpha) => {
        switch (value) {
            case 1: return `rgba(231, 76, 60, ${alpha})`;
            case 2: return `rgba(243, 156, 18, ${alpha})`;
            case 3: return `rgba(52, 152, 219, ${alpha})`;
            case 4: return `rgba(46, 204, 113, ${alpha})`;
            case 5: return `rgba(39, 174, 96, ${alpha})`;
            default: return `rgba(149, 165, 166, ${alpha})`;
        }
    };
    
    /**
     * Erweiterte Analyseansicht anzeigen
     */
    const showAdvancedView = () => {
        currentView = 'advanced';
        
        // View-Actions aktualisieren
        const actionsContainer = document.getElementById('view-actions');
        actionsContainer.innerHTML = `
            <button class="btn btn-outline-primary me-2" id="export-advanced-btn">
                <i class="fas fa-download"></i> Daten exportieren
            </button>
            <button class="btn btn-outline-secondary" id="print-advanced-btn">
                <i class="fas fa-print"></i> Drucken
            </button>
        `;
        
        // Event-Listener für Aktionen
        document.getElementById('export-advanced-btn').addEventListener('click', exportAdvancedData);
        document.getElementById('print-advanced-btn').addEventListener('click', printCurrentView);
        
        // Content-Container leeren und erweiterte Analysesicht erstellen
        const contentContainer = document.getElementById('analysis-content');
        contentContainer.innerHTML = `
            <div class="row">
                <!-- Korrelationsmatrix -->
                <div class="col-lg-8 mb-4">
                    <div class="card h-100">
                        <div class="card-header">
                            <h5 class="mb-0">Korrelationsmatrix</h5>
                        </div>
                        <div class="card-body">
                            <div class="form-group mb-3">
                                <label for="correlation-section" class="form-label">Fragebogenabschnitt</label>
                                <select class="form-control" id="correlation-section">
                                    <option value="">Alle Abschnitte</option>
                                    <!-- Wird dynamisch befüllt -->
                                </select>
                            </div>
                            
                            <div class="correlation-matrix-container mt-4">
                                <div id="correlation-matrix-placeholder" class="text-center p-5">
                                    <div class="loader"></div>
                                    <p>Korrelationsmatrix wird berechnet...</p>
                                </div>
                                <div id="correlation-matrix" style="display: none;">
                                    <!-- Matrix wird dynamisch generiert -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Schlüsselerkenntnisse -->
                <div class="col-lg-4 mb-4">
                    <div class="card h-100">
                        <div class="card-header">
                            <h5 class="mb-0">Schlüsselerkenntnisse</h5>
                        </div>
                        <div class="card-body">
                            <div id="key-insights">
                                <div class="placeholder-text">
                                    Wählen Sie einen Fragebogenabschnitt aus, um Erkenntnisse anzuzeigen.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <!-- Trendanalyse -->
                <div class="col-12">
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">Fragenübergreifende Analyse</h5>
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-outline-secondary active" id="cluster-analysis-btn">
                                    Fragenclustering
                                </button>
                                <button class="btn btn-outline-secondary" id="factor-analysis-btn">
                                    Empfehlungen
                                </button>
                            </div>
                        </div>
                        <div class="card-body">
                            <div id="advanced-analysis-container" class="text-center p-5">
                                <div class="loader"></div>
                                <p>Analyse wird durchgeführt...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Abschnitte laden
        loadCorrelationSections();
        
        // Event-Listener für Abschnittsauswahl
        document.getElementById('correlation-section').addEventListener('change', generateCorrelationMatrix);
        
        // Event-Listener für Analyseumschaltung
        document.getElementById('cluster-analysis-btn').addEventListener('click', (e) => {
            document.querySelectorAll('.btn-group .btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            showQuestionClustering();
        });
        
        document.getElementById('factor-analysis-btn').addEventListener('click', (e) => {
            document.querySelectorAll('.btn-group .btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            showFactorAnalysis();
        });
        
        // Korrelationsmatrix generieren
        setTimeout(() => {
            generateCorrelationMatrix();
        }, 500);
        
        // Standard-Analyse anzeigen
        setTimeout(() => {
            showQuestionClustering();
        }, 1000);
    };
    
    /**
     * Abschnitte für Korrelationsmatrix laden
     */
    const loadCorrelationSections = () => {
        const sectionSelect = document.getElementById('correlation-section');
        if (!sectionSelect) return;
        
        // Vorhandene Optionen behalten
        const currentValue = sectionSelect.value;
        sectionSelect.innerHTML = '<option value="">Alle Abschnitte</option>';
        
        // Durch alle Fragebogenabschnitte iterieren
        SurveySchema.sections.forEach(section => {
            const option = document.createElement('option');
            option.value = section.id;
            option.textContent = section.title;
            sectionSelect.appendChild(option);
        });
        
        // Vorherigen Wert wiederherstellen falls möglich
        if (currentValue) {
            sectionSelect.value = currentValue;
        }
    };
    
    /**
     * Korrelationsmatrix generieren
     */
    const generateCorrelationMatrix = () => {
        try {
            const sectionId = document.getElementById('correlation-section').value;
            const matrixPlaceholder = document.getElementById('correlation-matrix-placeholder');
            const matrixContainer = document.getElementById('correlation-matrix');
            
            if (!matrixPlaceholder || !matrixContainer) return;
            
            // Platzhalter anzeigen, Matrix ausblenden
            matrixPlaceholder.style.display = 'block';
            matrixContainer.style.display = 'none';
            
            // Fragen auswählen
            let questions = [];
            
            if (sectionId) {
                // Nur Fragen aus dem ausgewählten Abschnitt
                const section = SurveySchema.sections.find(s => s.id === sectionId);
                if (section) {
                    section.questions.forEach(question => {
                        if (question.type === 'likert') {
                            questions.push(question);
                        }
                    });
                }
            } else {
                // Alle Likert-Fragen
                SurveySchema.sections.forEach(section => {
                    section.questions.forEach(question => {
                        if (question.type === 'likert') {
                            questions.push(question);
                        }
                    });
                });
            }
            
            // Wenn zu viele Fragen, begrenzen
            if (questions.length > 25) {
                Utils.notifications.warning(`Zu viele Fragen für die Matrix (${questions.length}). Die ersten 25 werden angezeigt.`);
                questions = questions.slice(0, 25);
            }
            
            // Wenn keine Fragen oder keine Daten
            if (questions.length === 0 || selectedSurveys.length === 0) {
                matrixPlaceholder.style.display = 'none';
                matrixContainer.innerHTML = `
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i> 
                        ${questions.length === 0 ? 'Keine Fragen für die Korrelationsmatrix gefunden.' : 'Keine Daten für die Korrelationsmatrix verfügbar.'}
                    </div>
                `;
                matrixContainer.style.display = 'block';
                
                // Schlüsselerkenntnisse leeren
                const insightsContainer = document.getElementById('key-insights');
                if (insightsContainer) {
                    insightsContainer.innerHTML = `
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle"></i> 
                            Keine Daten für Erkenntnisse verfügbar.
                        </div>
                    `;
                }
                
                return;
            }
            
            // Korrelationsmatrix berechnen
            const correlations = calculateCorrelationsMatrix(questions, selectedSurveys);
            
            // Matrix-HTML generieren
            let matrixHTML = '<div class="correlation-matrix">';
            
            // Header-Zeile
            matrixHTML += '<div class="correlation-row correlation-header">';
            matrixHTML += '<div class="correlation-cell correlation-corner"></div>'; // Obere linke Ecke
            
            questions.forEach(q => {
                matrixHTML += `<div class="correlation-cell correlation-header-cell" title="${q.text}">${q.id}</div>`;
            });
            
            matrixHTML += '</div>';
            
            // Zeilen für jede Frage
            questions.forEach((rowQ, rowIndex) => {
                matrixHTML += '<div class="correlation-row">';
                
                // Zeilen-Header
                matrixHTML += `<div class="correlation-cell correlation-row-header" title="${rowQ.text}">${rowQ.id}</div>`;
                
                // Korrelationszellen
                questions.forEach((colQ, colIndex) => {
                    const correlation = correlations[rowIndex][colIndex];
                    
                    // Zellenklasse basierend auf Korrelationsstärke
                    let cellClass = '';
                    if (rowIndex === colIndex) {
                        // Diagonale
                        cellClass = 'correlation-self';
                    } else if (!correlation || isNaN(correlation)) {
                        // Keine Korrelation
                        cellClass = 'correlation-null';
                    } else if (Math.abs(correlation) < 0.2) {
                        cellClass = 'correlation-very-weak';
                    } else if (Math.abs(correlation) < 0.4) {
                        cellClass = 'correlation-weak';
                    } else if (Math.abs(correlation) < 0.6) {
                        cellClass = 'correlation-moderate';
                    } else if (Math.abs(correlation) < 0.8) {
                        cellClass = 'correlation-strong';
                    } else {
                        cellClass = 'correlation-very-strong';
                    }
                    
                    if (correlation > 0) {
                        cellClass += ' correlation-positive';
                    } else if (correlation < 0) {
                        cellClass += ' correlation-negative';
                    }
                    
                    const corrValue = correlation !== null && !isNaN(correlation) ? correlation.toFixed(2) : '-';
                    
                    matrixHTML += `
                        <div class="correlation-cell ${cellClass}" 
                             data-row="${rowQ.id}" 
                             data-col="${colQ.id}" 
                             data-value="${corrValue}"
                             title="Korrelation zwischen ${rowQ.id} und ${colQ.id}: ${corrValue}">
                            ${corrValue}
                        </div>
                    `;
                });
                
                matrixHTML += '</div>';
            });
            
            matrixHTML += '</div>';
            
            // Legende hinzufügen
            matrixHTML += `
                <div class="correlation-legend mt-3">
                    <div class="legend-title">Legende:</div>
                    <div class="legend-items">
                        <div class="legend-item">
                            <div class="legend-color correlation-very-strong correlation-positive"></div>
                            <div class="legend-label">Starke positive Korrelation (0.8-1.0)</div>
                        </div>
                        <div class="legend-item">
                            <div class="legend-color correlation-strong correlation-positive"></div>
                            <div class="legend-label">Positive Korrelation (0.6-0.8)</div>
                        </div>
                        <div class="legend-item">
                            <div class="legend-color correlation-moderate correlation-positive"></div>
                            <div class="legend-label">Mittlere positive Korrelation (0.4-0.6)</div>
                        </div>
                        <div class="legend-item">
                            <div class="legend-color correlation-weak correlation-positive"></div>
                            <div class="legend-label">Schwache positive Korrelation (0.2-0.4)</div>
                        </div>
                        <div class="legend-item">
                            <div class="legend-color correlation-very-weak"></div>
                            <div class="legend-label">Sehr schwache/keine Korrelation (-0.2-0.2)</div>
                        </div>
                        <div class="legend-item">
                            <div class="legend-color correlation-weak correlation-negative"></div>
                            <div class="legend-label">Schwache negative Korrelation (-0.4--0.2)</div>
                        </div>
                        <div class="legend-item">
                            <div class="legend-color correlation-moderate correlation-negative"></div>
                            <div class="legend-label">Mittlere negative Korrelation (-0.6--0.4)</div>
                        </div>
                        <div class="legend-item">
                            <div class="legend-color correlation-strong correlation-negative"></div>
                            <div class="legend-label">Negative Korrelation (-0.8--0.6)</div>
                        </div>
                        <div class="legend-item">
                            <div class="legend-color correlation-very-strong correlation-negative"></div>
                            <div class="legend-label">Starke negative Korrelation (-1.0--0.8)</div>
                        </div>
                    </div>
                </div>
            `;
            
            // Matrix anzeigen
            matrixContainer.innerHTML = matrixHTML;
            matrixPlaceholder.style.display = 'none';
            matrixContainer.style.display = 'block';
            
            // Event-Listener für Matrix-Zellen
            document.querySelectorAll('.correlation-cell:not(.correlation-header-cell):not(.correlation-row-header):not(.correlation-self)').forEach(cell => {
                cell.addEventListener('click', () => {
                    // Aktive Zelle markieren
                    document.querySelectorAll('.correlation-cell-active').forEach(c => {
                        c.classList.remove('correlation-cell-active');
                    });
                    cell.classList.add('correlation-cell-active');
                    
                    // Zeilen- und Spalten-Überschriften hervorheben
                    const rowId = cell.dataset.row;
                    const colId = cell.dataset.col;
                    
                    document.querySelectorAll(`.correlation-header-cell`).forEach(c => {
                        c.classList.remove('correlation-highlight');
                    });
                    document.querySelectorAll(`.correlation-row-header`).forEach(c => {
                        c.classList.remove('correlation-highlight');
                    });
                    
                    document.querySelectorAll(`.correlation-header-cell[title*="${colId}"]`).forEach(c => {
                        c.classList.add('correlation-highlight');
                    });
                    
                    document.querySelectorAll(`.correlation-row-header[title*="${rowId}"]`).forEach(c => {
                        c.classList.add('correlation-highlight');
                    });
                    
                    // Korrelations-Details anzeigen
                    showCorrelationDetails(rowId, colId, cell.dataset.value);
                });
            });
            
            // Schlüsselerkenntnisse anzeigen
            generateKeyInsights(correlations, questions);
            
        } catch (error) {
            console.error('Fehler bei der Generierung der Korrelationsmatrix:', error);
            
            const matrixContainer = document.getElementById('correlation-matrix');
            if (matrixContainer) {
                matrixContainer.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle"></i> 
                        Fehler bei der Generierung der Korrelationsmatrix: ${error.message}
                    </div>
                `;
                matrixContainer.style.display = 'block';
                document.getElementById('correlation-matrix-placeholder').style.display = 'none';
            }
        }
    };
    
    /**
     * Korrelationsmatrix für Fragen berechnen
     */
    const calculateCorrelationsMatrix = (questions, surveys) => {
        // Matrix für die Korrelationen initialisieren
        const matrix = [];
        for (let i = 0; i < questions.length; i++) {
            matrix[i] = Array(questions.length).fill(null);
        }
        
        // Diagonale mit 1.0 füllen (Selbstkorrelation)
        for (let i = 0; i < questions.length; i++) {
            matrix[i][i] = 1.0;
        }
        
        // Korrelationen berechnen
        for (let i = 0; i < questions.length; i++) {
            for (let j = i + 1; j < questions.length; j++) {
                const qi = questions[i].id;
                const qj = questions[j].id;
                
                // Daten für diese Fragen extrahieren
                const values = [];
                
                surveys.forEach(survey => {
                    const vi = survey[qi];
                    const vj = survey[qj];
                    
                    if (vi !== null && vi !== undefined && vj !== null && vj !== undefined) {
                        values.push([vi, vj]);
                    }
                });
                
                // Korrelation berechnen wenn genügend Daten vorhanden
                if (values.length > 5) {
                    const correlation = calculatePearsonCorrelation(values);
                    
                    // In die Matrix einfügen (symmetrisch)
                    matrix[i][j] = correlation;
                    matrix[j][i] = correlation;
                }
            }
        }
        
        return matrix;
    };
    
    /**
     * Pearson-Korrelationskoeffizient berechnen
     */
    const calculatePearsonCorrelation = (values) => {
        // Mittelwerte berechnen
        let sum1 = 0;
        let sum2 = 0;
        
        for (let i = 0; i < values.length; i++) {
            sum1 += values[i][0];
            sum2 += values[i][1];
        }
        
        const mean1 = sum1 / values.length;
        const mean2 = sum2 / values.length;
        
        // Korrelation berechnen
        let numerator = 0;
        let denominator1 = 0;
        let denominator2 = 0;
        
        for (let i = 0; i < values.length; i++) {
            const diff1 = values[i][0] - mean1;
            const diff2 = values[i][1] - mean2;
            
            numerator += diff1 * diff2;
            denominator1 += diff1 * diff1;
            denominator2 += diff2 * diff2;
        }
        
        if (denominator1 === 0 || denominator2 === 0) {
            return 0; // Keine Varianz in einer der Variablen
        }
        
        return numerator / Math.sqrt(denominator1 * denominator2);
    };
    
    /**
     * Schlüsselerkenntnisse aus Korrelationen generieren
     */
    const generateKeyInsights = (correlations, questions) => {
        try {
            const insightsContainer = document.getElementById('key-insights');
            if (!insightsContainer) return;
            
            // Signifikante Korrelationen extrahieren
            const significantCorrelations = [];
            
            for (let i = 0; i < questions.length; i++) {
                for (let j = i + 1; j < questions.length; j++) {
                    const correlation = correlations[i][j];
                    
                    if (correlation !== null && !isNaN(correlation) && Math.abs(correlation) >= 0.6) {
                        significantCorrelations.push({
                            q1: questions[i],
                            q2: questions[j],
                            correlation: correlation
                        });
                    }
                }
            }
            
            // Nach Korrelationsstärke sortieren (absteigend)
            significantCorrelations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
            
            // Top-Korrelationen begrenzen
            const topCorrelations = significantCorrelations.slice(0, 8);
            
            // HTML generieren
            if (topCorrelations.length === 0) {
                insightsContainer.innerHTML = `
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i> 
                        Keine signifikanten Korrelationen gefunden.
                    </div>
                    <p class="text-muted small">
                        Signifikante Korrelationen (ab 0.6) würden hier angezeigt werden.
                    </p>
                `;
            } else {
                let insightsHTML = '<div class="key-insights-list">';
                
                topCorrelations.forEach(item => {
                    const colorClass = item.correlation > 0 ? 'correlation-positive' : 'correlation-negative';
                    const strengthClass = Math.abs(item.correlation) >= 0.8 ? 'correlation-very-strong' : 'correlation-strong';
                    
                    insightsHTML += `
                        <div class="insight-item">
                            <div class="insight-correlation ${colorClass} ${strengthClass}">
                                ${item.correlation.toFixed(2)}
                            </div>
                            <div class="insight-description">
                                <div class="insight-question">${item.q1.id}: ${truncateText(item.q1.text, 80)}</div>
                                <div class="insight-relation">
                                    <i class="fas fa-${item.correlation > 0 ? 'arrow-up' : 'arrow-down'} me-1"></i>
                                    ${item.correlation > 0 ? 'korreliert positiv mit' : 'korreliert negativ mit'}
                                </div>
                                <div class="insight-question">${item.q2.id}: ${truncateText(item.q2.text, 80)}</div>
                            </div>
                        </div>
                    `;
                });
                
                insightsHTML += '</div>';
                
                // Interpretation hinzufügen
                insightsHTML += `
                    <div class="insights-interpretation mt-3">
                        <h6>Interpretation</h6>
                        <p class="text-muted small">
                            <i class="fas fa-info-circle me-1"></i> 
                            Positive Korrelationen deuten darauf hin, dass Fragen ähnlich beantwortet wurden.
                            Negative Korrelationen zeigen gegensätzliche Antwortmuster.
                        </p>
                    </div>
                `;
                
                insightsContainer.innerHTML = insightsHTML;
            }
        } catch (error) {
            console.error('Fehler bei der Generierung der Schlüsselerkenntnisse:', error);
            
            const insightsContainer = document.getElementById('key-insights');
            if (insightsContainer) {
                insightsContainer.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle"></i> 
                        Fehler bei der Generierung der Schlüsselerkenntnisse: ${error.message}
                    </div>
                `;
            }
        }
    };
    
    /**
     * Details zu ausgewählter Korrelation anzeigen
     */
    const showCorrelationDetails = (q1id, q2id, correlation) => {
        try {
            // Fragen finden
            let q1 = null;
            let q2 = null;
            
            SurveySchema.sections.forEach(section => {
                section.questions.forEach(question => {
                    if (question.id === q1id) q1 = question;
                    if (question.id === q2id) q2 = question;
                });
            });
            
            if (!q1 || !q2) return;
            
            // Interpretationstext basierend auf Korrelationsstärke
            let interpretationText = '';
            const corrValue = parseFloat(correlation);
            
            if (Math.abs(corrValue) >= 0.8) {
                interpretationText = corrValue > 0 ? 
                    'Sehr starke positive Korrelation: Die beiden Fragen weisen ein nahezu identisches Antwortmuster auf.' : 
                    'Sehr starke negative Korrelation: Die beiden Fragen weisen ein stark gegensätzliches Antwortmuster auf.';
            } else if (Math.abs(corrValue) >= 0.6) {
                interpretationText = corrValue > 0 ? 
                    'Starke positive Korrelation: Die beiden Fragen weisen ein ähnliches Antwortmuster auf.' : 
                    'Starke negative Korrelation: Die beiden Fragen weisen ein gegensätzliches Antwortmuster auf.';
            } else if (Math.abs(corrValue) >= 0.4) {
                interpretationText = corrValue > 0 ? 
                    'Mittlere positive Korrelation: Die beiden Fragen weisen ein moderat ähnliches Antwortmuster auf.' : 
                    'Mittlere negative Korrelation: Die beiden Fragen weisen ein moderat gegensätzliches Antwortmuster auf.';
            } else if (Math.abs(corrValue) >= 0.2) {
                interpretationText = corrValue > 0 ? 
                    'Schwache positive Korrelation: Die beiden Fragen weisen ein leicht ähnliches Antwortmuster auf.' : 
                    'Schwache negative Korrelation: Die beiden Fragen weisen ein leicht gegensätzliches Antwortmuster auf.';
            } else {
                interpretationText = 'Sehr schwache oder keine Korrelation: Die beiden Fragen scheinen unabhängig voneinander zu sein.';
            }
            
            // Dialog anzeigen
            Utils.modal.custom({
                title: 'Korrelationsdetails',
                content: `
                    <div class="correlation-details">
                        <div class="correlation-value-display mb-4 ${corrValue > 0 ? 'correlation-positive' : 'correlation-negative'}">
                            <div class="correlation-value-circle">
                                ${correlation}
                            </div>
                            <div class="correlation-value-label">
                                ${Math.abs(corrValue) >= 0.8 ? 'Sehr stark' :
                                  Math.abs(corrValue) >= 0.6 ? 'Stark' :
                                  Math.abs(corrValue) >= 0.4 ? 'Mittel' :
                                  Math.abs(corrValue) >= 0.2 ? 'Schwach' :
                                  'Sehr schwach'}
                                ${corrValue > 0 ? ' positiv' : corrValue < 0 ? ' negativ' : ''}
                            </div>
                        </div>
                        
                        <div class="correlation-questions mb-3">
                            <div class="correlation-question">
                                <div class="question-id">${q1id}</div>
                                <div class="question-text">${q1.text}</div>
                            </div>
                            <div class="correlation-direction">
                                <i class="fas fa-${corrValue > 0 ? 'arrow-right' : 'exchange-alt'}"></i>
                            </div>
                            <div class="correlation-question">
                                <div class="question-id">${q2id}</div>
                                <div class="question-text">${q2.text}</div>
                            </div>
                        </div>
                        
                        <div class="correlation-interpretation mb-4">
                            <h6>Interpretation:</h6>
                            <p>${interpretationText}</p>
                        </div>
                        
                        <div class="correlation-scatter-container" style="height: 300px;">
                            <canvas id="correlation-scatter-chart"></canvas>
                        </div>
                    </div>
                `,
                size: 'large',
                onOpen: () => {
                    // Streudiagramm erstellen
                    createCorrelationScatterChart(q1id, q2id);
                }
            });
        } catch (error) {
            console.error('Fehler beim Anzeigen der Korrelationsdetails:', error);
            Utils.notifications.error('Fehler beim Anzeigen der Korrelationsdetails.');
        }
    };
    
    /**
     * Streudiagramm für Korrelation erstellen
     */
    const createCorrelationScatterChart = (q1id, q2id) => {
        try {
            const chartCtx = document.getElementById('correlation-scatter-chart');
            if (!chartCtx) return;
            
            // Daten sammeln
            const scatterData = [];
            let sizeCountMap = {}; // Um Duplizierte Punkte zu zählen
            
            selectedSurveys.forEach(survey => {
                const x = survey[q1id];
                const y = survey[q2id];
                
                if (x !== null && x !== undefined && y !== null && y !== undefined) {
                    const key = `${x}-${y}`;
                    sizeCountMap[key] = (sizeCountMap[key] || 0) + 1;
                    
                    scatterData.push({
                        x: x,
                        y: y,
                        count: sizeCountMap[key]
                    });
                }
            });
            
            // Chart erstellen
            new Chart(chartCtx, {
                type: 'scatter',
                data: {
                    datasets: [{
                        label: `Korrelation zwischen ${q1id} und ${q2id}`,
                        data: scatterData.map(point => ({
                            x: point.x + (Math.random() * 0.2 - 0.1), // Jitter für überlappende Punkte
                            y: point.y + (Math.random() * 0.2 - 0.1),
                            r: Math.min(15, 5 + 2 * Math.log(point.count)), // Größe basierend auf Anzahl
                            count: point.count
                        })),
                        backgroundColor: 'rgba(227, 0, 11, 0.6)',
                        borderColor: 'rgba(227, 0, 11, 0.8)',
                        borderWidth: 1,
                        pointRadius: (context) => {
                            return context.dataset.data[context.dataIndex].r;
                        },
                        pointHoverRadius: (context) => {
                            return context.dataset.data[context.dataIndex].r + 2;
                        }
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: `Frage ${q1id}`,
                                color: '#666'
                            },
                            min: 0.5,
                            max: 5.5,
                            ticks: {
                                stepSize: 1
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: `Frage ${q2id}`,
                                color: '#666'
                            },
                            min: 0.5,
                            max: 5.5,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const data = context.dataset.data[context.dataIndex];
                                    return `${q1id}: ${Math.round(data.x)}, ${q2id}: ${Math.round(data.y)}, Anzahl: ${data.count}`;
                                }
                            }
                        },
                        legend: {
                            display: false
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Fehler beim Erstellen des Streudiagramms:', error);
            
            const chartContainer = document.getElementById('correlation-scatter-chart');
            if (chartContainer) {
                chartContainer.parentElement.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle"></i> 
                        Fehler beim Erstellen des Streudiagramms: ${error.message}
                    </div>
                `;
            }
        }
    };
    
    /**
     * Fragenclustering anzeigen
     */
    const showQuestionClustering = () => {
        try {
            const analysisContainer = document.getElementById('advanced-analysis-container');
            if (!analysisContainer) return;
            
            // Laden-Anzeige
            analysisContainer.innerHTML = `
                <div class="text-center p-5">
                    <div class="loader"></div>
                    <p>Clustering wird durchgeführt...</p>
                </div>
            `;
            
            // Kurze Verzögerung für bessere UX
            setTimeout(() => {
                // Fragen auswählen (alle Likert-Fragen)
                const questions = [];
                
                SurveySchema.sections.forEach(section => {
                    section.questions.forEach(question => {
                        if (question.type === 'likert') {
                            questions.push({
                                ...question,
                                section: section.title
                            });
                        }
                    });
                });
                
                // Wenn nicht genügend Daten oder Fragen
                if (selectedSurveys.length === 0 || questions.length === 0) {
                    analysisContainer.innerHTML = `
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle"></i> 
                            Nicht genügend Daten für das Fragenclustering.
                        </div>
                    `;
                    return;
                }
                
                // Korrelationsmatrix berechnen
                const correlationMatrix = calculateCorrelationsMatrix(questions, selectedSurveys);
                
                // Clustering durchführen
                const clusters = performHierarchicalClustering(correlationMatrix, questions);
                
                // Cluster anzeigen
                const clusterHTML = generateClusterHTML(clusters, questions);
                
                analysisContainer.innerHTML = clusterHTML;
                
                // Event-Listener für Cluster-Aufklappen
                document.querySelectorAll('.cluster-expander').forEach(expander => {
                    expander.addEventListener('click', () => {
                        const clusterId = expander.dataset.clusterId;
                        const content = document.querySelector(`.cluster-content[data-cluster-id="${clusterId}"]`);
                        
                        if (content) {
                            const isExpanded = content.style.display !== 'none';
                            
                            content.style.display = isExpanded ? 'none' : 'block';
                            expander.innerHTML = isExpanded ? 
                                '<i class="fas fa-chevron-down"></i>' : 
                                '<i class="fas fa-chevron-up"></i>';
                        }
                    });
                });
            }, 1000);
        } catch (error) {
            console.error('Fehler beim Anzeigen des Fragenclusterings:', error);
            
            const analysisContainer = document.getElementById('advanced-analysis-container');
            if (analysisContainer) {
                analysisContainer.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle"></i> 
                        Fehler beim Durchführen des Fragenclusterings: ${error.message}
                    </div>
                `;
            }
        }
    };
    
    /**
     * Hierarchisches Clustering auf Basis der Korrelationsmatrix
     */
    const performHierarchicalClustering = (correlationMatrix, questions) => {
        // Ähnlichkeitsmatrix erstellen (1 - Korrelation)
        const similarityMatrix = [];
        
        for (let i = 0; i < correlationMatrix.length; i++) {
            similarityMatrix[i] = [];
            for (let j = 0; j < correlationMatrix.length; j++) {
                // Umwandlung der Korrelation in eine Distanz
                // Hohe positive Korrelation -> geringe Distanz
                // Negative Korrelation -> hohe Distanz
                if (i === j) {
                    similarityMatrix[i][j] = 0; // Selbst-Ähnlichkeit
                } else if (correlationMatrix[i][j] === null || isNaN(correlationMatrix[i][j])) {
                    similarityMatrix[i][j] = 1; // Keine Korrelation
                } else {
                    // Transformieren der Korrelation (-1 bis 1) in eine Distanz (0 bis 2)
                    // wobei 0 = perfekt korreliert, 2 = perfekt negativ korreliert
                    similarityMatrix[i][j] = 1 - correlationMatrix[i][j];
                }
            }
        }
        
        // Einfaches hierarchisches Clustering (Greedy)
        let clusters = questions.map((q, idx) => ({
            indices: [idx],
            questions: [q],
            avgCorrelation: 1 // Selbstkorrelation
        }));
        
        // Clustering-Schwellenwert (maximale Distanz für Cluster-Kombination)
        const threshold = 0.4; // entspricht einer Korrelation von 0.6
        
        // Iterativ ähnlichste Cluster zusammenführen
        while (clusters.length > 1) {
            let minDistance = Infinity;
            let mergeI = -1;
            let mergeJ = -1;
            
            // Finde die zwei ähnlichsten Cluster
            for (let i = 0; i < clusters.length; i++) {
                for (let j = i + 1; j < clusters.length; j++) {
                    // Durchschnittliche Distanz zwischen allen Fragen in beiden Clustern
                    let totalDist = 0;
                    let count = 0;
                    
                    for (let idxA of clusters[i].indices) {
                        for (let idxB of clusters[j].indices) {
                            totalDist += similarityMatrix[idxA][idxB];
                            count++;
                        }
                    }
                    
                    const avgDist = totalDist / count;
                    
                    if (avgDist < minDistance) {
                        minDistance = avgDist;
                        mergeI = i;
                        mergeJ = j;
                    }
                }
            }
            
            // Abbruch wenn Schwellenwert überschritten
            if (minDistance > threshold) {
                break;
            }
            
            // Cluster zusammenführen
            if (mergeI !== -1 && mergeJ !== -1) {
                clusters[mergeI] = {
                    indices: [...clusters[mergeI].indices, ...clusters[mergeJ].indices],
                    questions: [...clusters[mergeI].questions, ...clusters[mergeJ].questions],
                    avgCorrelation: 1 - minDistance // Umrechnung zurück in Korrelation
                };
                
                clusters.splice(mergeJ, 1);
            } else {
                break; // Sicherheitsabbruch
            }
        }
        
        // Sortieren der Cluster nach Größe (absteigend)
        clusters.sort((a, b) => b.questions.length - a.questions.length);
        
        return clusters;
    };
    
    /**
     * HTML für Cluster generieren
     */
    const generateClusterHTML = (clusters, allQuestions) => {
        let html = `
            <div class="cluster-overview">
                <h6>Fragenclustering basierend auf Korrelationen</h6>
                <p class="text-muted mb-4">
                    Das Clustering gruppiert Fragen mit ähnlichen Antwortmustern. Gruppierte Fragen werden tendenziell
                    ähnlich beantwortet und könnten ähnliche Konzepte messen.
                </p>
        `;
        
        if (clusters.length === 0) {
            html += `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i> 
                    Keine signifikanten Cluster gefunden.
                </div>
            `;
            return html;
        }
        
        // Cluster Karte für jeden Cluster erstellen
        clusters.forEach((cluster, index) => {
            // Thematische Analyse des Clusters
            let clusterTopic = analyzeClusterTopic(cluster.questions);
            
            // Bestimme die dominante Sektion, falls vorhanden
            const sectionCounts = {};
            let dominantSection = '';
            let maxCount = 0;
            
            cluster.questions.forEach(q => {
                sectionCounts[q.section] = (sectionCounts[q.section] || 0) + 1;
                if (sectionCounts[q.section] > maxCount) {
                    maxCount = sectionCounts[q.section];
                    dominantSection = q.section;
                }
            });
            
            // Farbe für den Cluster basierend auf dominanter Sektion
            const sectionColorIndex = Object.keys(sectionCounts).indexOf(dominantSection) % 5;
            const sectionColorClass = `cluster-color-${sectionColorIndex}`;
            
            html += `
                <div class="cluster-card mb-3 ${sectionColorClass}">
                    <div class="cluster-header">
                        <div class="cluster-info">
                            <div class="cluster-name">Cluster ${index + 1}: ${clusterTopic}</div>
                            <div class="cluster-stats">
                                <span>${cluster.questions.length} Fragen</span>
                                <span class="ms-2">Ø Korrelation: ${cluster.avgCorrelation.toFixed(2)}</span>
                                ${dominantSection ? `<span class="ms-2">Hauptsächlich: ${dominantSection}</span>` : ''}
                            </div>
                        </div>
                        <button class="cluster-expander" data-cluster-id="${index}">
                            <i class="fas fa-chevron-down"></i>
                        </button>
                    </div>
                    <div class="cluster-content" data-cluster-id="${index}" style="display: none;">
                        <ul class="cluster-questions-list">
                            ${cluster.questions.map(q => `
                                <li class="cluster-question-item">
                                    <div class="question-id">${q.id}</div>
                                    <div class="question-text">${q.text}</div>
                                    <div class="question-section">${q.section}</div>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            `;
        });
        
        // Anzeige von nicht gruppierten Fragen
        const groupedQuestionsIds = new Set(
            clusters.flatMap(cluster => cluster.questions.map(q => q.id))
        );
        
        const ungroupedQuestions = allQuestions.filter(q => !groupedQuestionsIds.has(q.id));
        
        if (ungroupedQuestions.length > 0) {
            html += `
                <div class="cluster-card mb-3 cluster-ungrouped">
                    <div class="cluster-header">
                        <div class="cluster-info">
                            <div class="cluster-name">Nicht gruppierte Fragen</div>
                            <div class="cluster-stats">
                                <span>${ungroupedQuestions.length} Fragen</span>
                            </div>
                        </div>
                        <button class="cluster-expander" data-cluster-id="ungrouped">
                            <i class="fas fa-chevron-down"></i>
                        </button>
                    </div>
                    <div class="cluster-content" data-cluster-id="ungrouped" style="display: none;">
                        <ul class="cluster-questions-list">
                            ${ungroupedQuestions.map(q => `
                                <li class="cluster-question-item">
                                    <div class="question-id">${q.id}</div>
                                    <div class="question-text">${q.text}</div>
                                    <div class="question-section">${q.section}</div>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            `;
        }
        
        html += `
            </div>
        `;
        
        return html;
    };
    
    /**
     * Thema eines Frageblocks analysieren
     */
    const analyzeClusterTopic = (questions) => {
        // Einfacher Ansatz: Finden häufiger Wörter im Fragetext
        const wordCounts = {};
        const stopWords = [
            'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einer', 'eines', 'einem', 'einen',
            'und', 'oder', 'aber', 'ist', 'sind', 'nicht', 'für', 'bei', 'mit', 'zu', 'zum', 'zur',
            'von', 'vom', 'im', 'in', 'an', 'am', 'auf', 'als', 'um', 'es', 'sie', 'ich', 'du', 'wir',
            'mich', 'meine', 'meiner', 'meinen', 'meinem', 'mir', 'dich', 'deine', 'deiner', 'deinen',
            'deinem', 'dir', 'sich', 'uns', 'unser', 'unsere', 'unserer', 'unseren', 'unserem',
            'euch', 'eure', 'eurer', 'euren', 'eurem', 'ihrer', 'ihnen', 'ihrem', 'ihren'
        ];
        
        // Text aller Fragen kombinieren und häufige Wörter extrahieren
        questions.forEach(q => {
            const words = q.text.toLowerCase()
                .replace(/[^\wäöüß\s]/g, '') // Nur Buchstaben und Leerzeichen
                .split(/\s+/);
                
            words.forEach(word => {
                if (word.length > 3 && !stopWords.includes(word)) {
                    wordCounts[word] = (wordCounts[word] || 0) + 1;
                }
            });
        });
        
        // Wörter nach Häufigkeit sortieren
        const sortedWords = Object.entries(wordCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(entry => entry[0]);
        
        // Wenn keine Schlüsselwörter gefunden wurden
        if (sortedWords.length === 0) {
            return "Gemischte Themen";
        }
        
        // Erste Buchstaben groß schreiben
        const formattedWords = sortedWords.map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        );
        
        return formattedWords.join(', ');
    };
    
    /**
     * Faktorenanalyse und Empfehlungen anzeigen
     */
    const showFactorAnalysis = () => {
        try {
            const analysisContainer = document.getElementById('advanced-analysis-container');
            if (!analysisContainer) return;
            
            // Laden-Anzeige
            analysisContainer.innerHTML = `
                <div class="text-center p-5">
                    <div class="loader"></div>
                    <p>Analysiere Daten und erstelle Empfehlungen...</p>
                </div>
            `;
            
            // Kurze Verzögerung für bessere UX
            setTimeout(() => {
                // Daten analysieren
                const analysisResults = analyzeOverallResults(selectedSurveys);
                
                // Wenn nicht genügend Daten
                if (analysisResults.length === 0) {
                    analysisContainer.innerHTML = `
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle"></i> 
                            Nicht genügend Daten für die Analyse.
                        </div>
                    `;
                    return;
                }
                
                // Empfehlungen anzeigen
                let html = `
                    <div class="recommendations-container">
                        <h6>Automatische Empfehlungen basierend auf der Datenanalyse</h6>
                        <p class="text-muted mb-4">
                            Diese Empfehlungen basieren auf den identifizierten Stärken und Schwächen in den Umfrageergebnissen.
                            Sie dienen als Ausgangspunkt für weitere Diskussionen und Maßnahmenplanungen.
                        </p>
                        
                        <div class="row">
                            <!-- Stärken -->
                            <div class="col-md-6 mb-4">
                                <div class="card h-100 border-success">
                                    <div class="card-header bg-success bg-opacity-10">
                                        <h5 class="mb-0 text-success">
                                            <i class="fas fa-thumbs-up me-2"></i> Stärken
                                        </h5>
                                    </div>
                                    <div class="card-body">
                                        <ul class="recommendation-list strengths-list">
                                            ${analysisResults.strengths.map(item => `
                                                <li class="recommendation-item">
                                                    <div class="recommendation-rating">
                                                        <span class="badge bg-success">${item.score.toFixed(1)}</span>
                                                    </div>
                                                    <div class="recommendation-content">
                                                        <div class="recommendation-title">${item.title}</div>
                                                        <div class="recommendation-details text-muted small">
                                                            ${item.details}
                                                        </div>
                                                    </div>
                                                </li>
                                            `).join('')}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Schwächen -->
                            <div class="col-md-6 mb-4">
                                <div class="card h-100 border-danger">
                                    <div class="card-header bg-danger bg-opacity-10">
                                        <h5 class="mb-0 text-danger">
                                            <i class="fas fa-thumbs-down me-2"></i> Verbesserungspotential
                                        </h5>
                                    </div>
                                    <div class="card-body">
                                        <ul class="recommendation-list weaknesses-list">
                                            ${analysisResults.weaknesses.map(item => `
                                                <li class="recommendation-item">
                                                    <div class="recommendation-rating">
                                                        <span class="badge bg-danger">${item.score.toFixed(1)}</span>
                                                    </div>
                                                    <div class="recommendation-content">
                                                        <div class="recommendation-title">${item.title}</div>
                                                        <div class="recommendation-details text-muted small">
                                                            ${item.details}
                                                        </div>
                                                    </div>
                                                </li>
                                            `).join('')}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Konkrete Maßnahmenempfehlungen -->
                        <div class="row">
                            <div class="col-12 mb-4">
                                <div class="card border-primary">
                                    <div class="card-header bg-primary bg-opacity-10">
                                        <h5 class="mb-0 text-primary">
                                            <i class="fas fa-tasks me-2"></i> Empfohlene Maßnahmen
                                        </h5>
                                    </div>
                                    <div class="card-body">
                                        <div class="action-recommendations">
                                            ${generateRecommendations(analysisResults)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="disclaimer mt-2">
                            <p class="text-muted small">
                                <i class="fas fa-info-circle me-1"></i>
                                <strong>Hinweis:</strong> Diese automatisch generierten Empfehlungen basieren auf statistischen Mustern
                                und sollten als Ausgangspunkt für weitere Diskussionen dienen. Eine sorgfältige Überprüfung und Anpassung
                                durch Fachexperten wird empfohlen.
                            </p>
                        </div>
                    </div>
                `;
                
                analysisContainer.innerHTML = html;
                
            }, 1500);
        } catch (error) {
            console.error('Fehler bei der Generierung der Empfehlungen:', error);
            
            const analysisContainer = document.getElementById('advanced-analysis-container');
            if (analysisContainer) {
                analysisContainer.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle"></i> 
                        Fehler bei der Generierung der Empfehlungen: ${error.message}
                    </div>
                `;
            }
        }
    };
    
    /**
     * Gesamtergebnisse analysieren
     */
    const analyzeOverallResults = (surveys) => {
        // Wenn keine Umfragen zur Analyse
        if (!surveys || surveys.length === 0) {
            return [];
        }
        
        // Bereichsweise Durchschnitte berechnen
        const areaAverages = {};
        let lowestArea = { id: '', score: 5.0 };
        let highestArea = { id: '', score: 0.0 };
        
        SurveySchema.categorization.areas.forEach(area => {
            const areaQuestions = area.questionIds;
            let sum = 0;
            let count = 0;
            
            surveys.forEach(survey => {
                areaQuestions.forEach(qid => {
                    if (survey[qid] !== null && survey[qid] !== undefined) {
                        sum += survey[qid];
                        count++;
                    }
                });
            });
            
            const avg = count > 0 ? sum / count : 0;
            areaAverages[area.id] = avg;
            
            // Höchsten und niedrigsten Bereich tracken
            if (avg > 0) {
                if (avg < lowestArea.score) {
                    lowestArea = { id: area.id, score: avg, title: area.title };
                }
                if (avg > highestArea.score) {
                    highestArea = { id: area.id, score: avg, title: area.title };
                }
            }
        });
        
        // Einzelfragen-Durchschnitte
        const questionAverages = {};
        let lowestQuestions = [];
        let highestQuestions = [];
        
        SurveySchema.sections.forEach(section => {
            section.questions.forEach(question => {
                if (question.type === 'likert') {
                    let sum = 0;
                    let count = 0;
                    
                    surveys.forEach(survey => {
                        const value = survey[question.id];
                        if (value !== null && value !== undefined) {
                            sum += value;
                            count++;
                        }
                    });
                    
                    const avg = count > 0 ? sum / count : 0;
                    questionAverages[question.id] = {
                        score: avg,
                        text: question.text,
                        section: section.title
                    };
                    
                    // Für Top/Bottom-Liste
                    if (avg > 0) {
                        if (lowestQuestions.length < 3) {
                            lowestQuestions.push({ id: question.id, score: avg, text: question.text });
                            lowestQuestions.sort((a, b) => a.score - b.score);
                        } else if (avg < lowestQuestions[2].score) {
                            lowestQuestions.pop();
                            lowestQuestions.push({ id: question.id, score: avg, text: question.text });
                            lowestQuestions.sort((a, b) => a.score - b.score);
                        }
                        
                        if (highestQuestions.length < 3) {
                            highestQuestions.push({ id: question.id, score: avg, text: question.text });
                            highestQuestions.sort((a, b) => b.score - a.score);
                        } else if (avg > highestQuestions[2].score) {
                            highestQuestions.pop();
                            highestQuestions.push({ id: question.id, score: avg, text: question.text });
                            highestQuestions.sort((a, b) => b.score - a.score);
                        }
                    }
                }
            });
        });
        
        // Stärken und Schwächen bestimmen
        const strengths = [];
        const weaknesses = [];
        
        // Bereichsstärken und -schwächen
        strengths.push({
            title: `Stärke im Bereich "${highestArea.title}"`,
            score: highestArea.score,
            details: `Der Bereich "${highestArea.title}" erhielt mit ${highestArea.score.toFixed(2)} die höchste durchschnittliche Bewertung.`
        });
        
        weaknesses.push({
            title: `Verbesserungsbedarf im Bereich "${lowestArea.title}"`,
            score: lowestArea.score,
            details: `Der Bereich "${lowestArea.title}" erhielt mit ${lowestArea.score.toFixed(2)} die niedrigste durchschnittliche Bewertung.`
        });
        
        // Einzelfragen-Stärken
        highestQuestions.forEach(q => {
            strengths.push({
                title: truncateText(q.text, 80),
                score: q.score,
                details: `Frage ${q.id} erhielt mit ${q.score.toFixed(2)} eine sehr positive Bewertung.`
            });
        });
        
        // Einzelfragen-Schwächen
        lowestQuestions.forEach(q => {
            weaknesses.push({
                title: truncateText(q.text, 80),
                score: q.score,
                details: `Frage ${q.id} erhielt mit ${q.score.toFixed(2)} eine vergleichsweise niedrige Bewertung.`
            });
        });
        
        return {
            strengths,
            weaknesses,
            areaAverages,
            questionAverages,
            highestArea,
            lowestArea,
            highestQuestions,
            lowestQuestions
        };
    };
    
    /**
     * Konkrete Maßnahmenempfehlungen generieren
     */
    const generateRecommendations = (results) => {
        // Wenn keine Ergebnisse
        if (!results) return 'Keine ausreichenden Daten für Empfehlungen.';
        
        let recommendationsHTML = '<div class="action-items">';
        
        // Priorität basierend auf Bewertung
        results.weaknesses.sort((a, b) => a.score - b.score);
        
        // Für die wichtigsten Schwächen konkrete Maßnahmen vorschlagen
        const topIssues = results.weaknesses.slice(0, 3);
        
        // Standard-Empfehlungen nach Themenbereichen
        const recommendationTemplates = {
            'Arbeitsumfeld und Ressourcen': [
                'Workshop zur Optimierung der Arbeitsabläufe durchführen',
                'Ressourcenbedarfsanalyse erstellen und Beschaffungsplan entwickeln',
                'Ergonomie-Assessment der Arbeitsplätze durchführen'
            ],
            'Zusammenarbeit und Führung': [
                'Teambuilding-Maßnahmen und regelmäßige Feedbackgespräche einführen',
                'Führungskräftetraining zu kommunikativer Führung anbieten',
                'Monatliche Team-Besprechungen zur Verbesserung der interdisziplinären Zusammenarbeit einrichten'
            ],
            'Arbeitsbelastung': [
                'Arbeitsbelastungsanalyse durchführen und Entlastungsmaßnahmen identifizieren',
                'Flexible Arbeitszeitmodelle prüfen und bei Bedarf einführen',
                'Personalbedarfsplanung überprüfen und ggf. anpassen'
            ],
            'Entwicklung': [
                'Individuelles Fortbildungsprogramm für unterschiedliche Berufsgruppen entwickeln',
                'Mentoring-Programm für neue Mitarbeitende etablieren',
                'Regelmäßige Entwicklungsgespräche einführen'
            ],
            'Patientenorientierung': [
                'Prozessanalyse zur Optimierung der Patientenversorgung durchführen',
                'Feedbacksystem für Patientenmeinungen einrichten',
                'Schulungen zu patientenzentrierter Kommunikation anbieten'
            ],
            'Innovation': [
                'Innovationsworkshops zur Prozessverbesserung durchführen',
                'Digitalisierungsstrategie für die Abteilung entwickeln',
                'Best-Practice-Besuche bei anderen Einrichtungen organisieren'
            ],
            'Allgemein': [
                'Regelmäßige Folgebefragungen zur Überprüfung der Maßnahmen durchführen',
                'Fokusgruppen mit Vertretern verschiedener Berufsgruppen einrichten',
                'Maßnahmenplan mit Verantwortlichkeiten und Zeitrahmen erstellen'
            ]
        };
        
        // Empfehlungen basierend auf den schwächsten Bereichen
        const baseArea = results.lowestArea.id.split('-')[0];
        const matchingRecommendations = recommendationTemplates[baseArea] || recommendationTemplates['Allgemein'];
        
        topIssues.forEach((issue, index) => {
            const priority = index === 0 ? 'Hohe Priorität' : (index === 1 ? 'Mittlere Priorität' : 'Normale Priorität');
            const priorityClass = index === 0 ? 'high-priority' : (index === 1 ? 'medium-priority' : 'normal-priority');
            
            recommendationsHTML += `
                <div class="action-item ${priorityClass}">
                    <div class="action-priority">${priority}</div>
                    <div class="action-content">
                        <h6 class="action-title">
                            ${index === 0 ? 
                                `Verbesserung im Bereich "${results.lowestArea.title}"` :
                                issue.title}
                        </h6>
                        <p class="action-description">
                            ${matchingRecommendations[index % matchingRecommendations.length]}
                        </p>
                        <div class="action-steps">
                            <div class="action-step">
                                <span class="step-number">1</span>
                                <span class="step-text">Ist-Zustand analysieren und Problemursachen identifizieren</span>
                            </div>
                            <div class="action-step">
                                <span class="step-number">2</span>
                                <span class="step-text">Konkrete Maßnahmen in Zusammenarbeit mit dem Team entwickeln</span>
                            </div>
                            <div class="action-step">
                                <span class="step-number">3</span>
                                <span class="step-text">Umsetzungsplan erstellen und Verantwortlichkeiten festlegen</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        // Allgemeine Empfehlung
        recommendationsHTML += `
            <div class="action-item">
                <div class="action-priority">Kontinuierlich</div>
                <div class="action-content">
                    <h6 class="action-title">Regelmäßige Überprüfung der Maßnahmen und weiteres Monitoring</h6>
                    <p class="action-description">
                        Etablieren Sie einen kontinuierlichen Verbesserungsprozess mit regelmäßiger Überprüfung der umgesetzten Maßnahmen.
                    </p>
                </div>
            </div>
        `;
        
        recommendationsHTML += '</div>';
        
        return recommendationsHTML;
    };
    
    /**
     * Aktuelles Diagramm exportieren
     */
    const exportCurrentChart = () => {
        try {
            // Aktive Chart-Instanz bestimmen
            let chartInstance = null;
            let filename = 'diagramm';
            
            switch (currentView) {
                case 'overview':
                    chartInstance = chartsInstances.areasOverview;
                    filename = 'themenbereiche-vergleich';
                    break;
                case 'detail':
                    if (selectedQuestion) {
                        chartInstance = chartsInstances.questionDetail;
                        filename = 'frage-detail-' + selectedQuestion;
                    }
                    break;
                case 'comparison':
                    chartInstance = chartsInstances.comparison;
                    filename = 'vergleich-analyse';
                    break;
                case 'advanced':
                    // Kein spezifisches Chart
                    break;
            }
            
            if (!chartInstance) {
                Utils.notifications.warning('Kein Diagramm zum Exportieren gefunden.');
                return;
            }
            
            // Canvas-Element finden und als Bild exportieren
            const canvas = chartInstance.canvas;
            
            // Image-Qualität und Hintergrund verbessern
            const context = canvas.getContext('2d');
            const originalStyle = context.fillStyle;
            
            // Weißer Hintergrund
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height);
            
            // Chart neu rendern
            chartInstance.draw();
            
            // Als Bild exportieren
            const image = canvas.toDataURL('image/png', 1.0);
            
            // Download-Link erstellen und klicken
            const link = document.createElement('a');
            link.download = `${filename}_${new Date().toISOString().split('T')[0]}.png`;
            link.href = image;
            link.click();
            
            // Stil wiederherstellen
            context.fillStyle = originalStyle;
            
            // Benachrichtigung anzeigen
            Utils.notifications.success('Diagramm wurde als Bild exportiert.');
        } catch (error) {
            console.error('Fehler beim Exportieren des Diagramms:', error);
            Utils.notifications.error('Fehler beim Exportieren des Diagramms.');
        }
    };
    
    /**
     * Erweiterte Analysedaten exportieren
     */
    const exportAdvancedData = () => {
        try {
            // Daten für den Export aufbereiten
            const exportData = {
                timestamp: new Date().toISOString(),
                filteredSurveyCount: selectedSurveys.length,
                filters: filterOptions,
                overallStatistics: {
                    sectionAverages: {}
                },
                questionStatistics: {}
            };
            
            // Bereichs-Durchschnitte berechnen
            SurveySchema.sections.forEach(section => {
                let sectionSum = 0;
                let sectionCount = 0;
                
                section.questions.forEach(question => {
                    if (question.type === 'likert') {
                        let sum = 0;
                        let count = 0;
                        let distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
                        
                        selectedSurveys.forEach(survey => {
                            const value = survey[question.id];
                            if (value !== null && value !== undefined) {
                                sum += value;
                                count++;
                                distribution[value] = (distribution[value] || 0) + 1;
                            }
                        });
                        
                        if (count > 0) {
                            const avg = sum / count;
                            sectionSum += sum;
                            sectionCount += count;
                            
                            // Fragen-Statistik speichern
                            exportData.questionStatistics[question.id] = {
                                text: question.text,
                                average: avg,
                                count: count,
                                distribution: distribution
                            };
                        }
                    }
                });
                
                // Bereichs-Durchschnitt speichern
                if (sectionCount > 0) {
                    exportData.overallStatistics.sectionAverages[section.id] = {
                        title: section.title,
                        average: sectionSum / sectionCount,
                        questionCount: section.questions.filter(q => q.type === 'likert').length
                    };
                }
            });
            
            // In JSON umwandeln
            const jsonData = JSON.stringify(exportData, null, 2);
            
            // Als Datei herunterladen
            Utils.file.downloadJSON(exportData, `analyse_export_${new Date().toISOString().split('T')[0]}.json`);
            
            // Benachrichtigung anzeigen
            Utils.notifications.success('Analysedaten wurden exportiert.');
        } catch (error) {
            console.error('Fehler beim Exportieren der Analysedaten:', error);
            Utils.notifications.error('Fehler beim Exportieren der Analysedaten.');
        }
    };
    
    /**
     * Aktuelle Ansicht drucken
     */
    const printCurrentView = () => {
        try {
            // Charts für den Druck vorbereiten
            for (const key in chartsInstances) {
                if (chartsInstances[key]) {
                    // Sicherstellen, dass die Charts gerendert sind
                    chartsInstances[key].resize();
                    chartsInstances[key].render();
                }
            }
            
            // Zeitverzögerung für die Chart-Aktualisierung
            setTimeout(() => {
                window.print();
            }, 250);
        } catch (error) {
            console.error('Fehler beim Drucken der Ansicht:', error);
            Utils.notifications.error('Fehler beim Drucken der Ansicht.');
        }
    };
    
    /**
     * Aktuell angezeigte Ansicht aktualisieren
     */
    const updateView = () => {
        switch (currentView) {
            case 'overview':
                showOverviewView();
                break;
            case 'detail':
                showDetailView();
                break;
            case 'comparison':
                showComparisonView();
                break;
            case 'advanced':
                showAdvancedView();
                break;
        }
    };
    
    /**
     * Charts aktualisieren
     */
    const updateCharts = () => {
        switch (currentView) {
            case 'overview':
                initOverviewCharts();
                break;
            case 'detail':
                if (selectedQuestion) {
                    showQuestionDetails(selectedQuestion);
                } else if (selectedSection) {
                    selectSection(selectedSection);
                }
                break;
            case 'comparison':
                updateComparisonChart();
                break;
            case 'advanced':
                // Advanced hat eigene Update-Logik
                break;
        }
    };
    
    /**
     * Farbe basierend auf Wert (1-5) zurückgeben
     */
    const getColorClassByValue = (value) => {
        if (value >= 4.5) return 'bg-success text-white';
        if (value >= 4.0) return 'bg-success text-white';
        if (value >= 3.5) return 'bg-info text-white';
        if (value >= 3.0) return 'bg-info text-white';
        if (value >= 2.5) return 'bg-warning';
        if (value >= 2.0) return 'bg-warning';
        return 'bg-danger text-white';
    };
    
    /**
     * Farbe für Heatmap basierend auf Wert (1-5) zurückgeben
     */
    const getHeatmapColorClass = (value) => {
        if (value >= 4.5) return 'heatmap-value-5';
        if (value >= 4.0) return 'heatmap-value-4-5';
        if (value >= 3.5) return 'heatmap-value-4';
        if (value >= 3.0) return 'heatmap-value-3-5';
        if (value >= 2.5) return 'heatmap-value-3';
        if (value >= 2.0) return 'heatmap-value-2-5';
        if (value >= 1.5) return 'heatmap-value-2';
        return 'heatmap-value-1';
    };
    
    /**
     * Zufällige Farbe generieren
     */
    const getRandomColor = (alpha) => {
        const r = Math.floor(Math.random() * 200);
        const g = Math.floor(Math.random() * 200);
        const b = Math.floor(Math.random() * 200);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };
    
    /**
     * Text auf bestimmte Länge kürzen
     */
    const truncateText = (text, maxLength) => {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
    };
    
    /**
     * Median einer Reihe von Zahlen berechnen
     */
    const calculateMedian = (values) => {
        if (!values || values.length === 0) return 0;
        
        // Sortiere die Werte
        const sorted = [...values].sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);
        
        if (sorted.length % 2 === 0) {
            return (sorted[middle - 1] + sorted[middle]) / 2;
        } else {
            return sorted[middle];
        }
    };
    
    /**
     * Standardabweichung berechnen
     */
    const calculateStandardDeviation = (values, mean = null) => {
        if (!values || values.length === 0) return 0;
        
        // Mittelwert berechnen falls nicht gegeben
        if (mean === null) {
            mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        }
        
        // Quadrierte Abweichungen berechnen
        const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
        const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
        
        // Standardabweichung als Wurzel der Varianz
        return Math.sqrt(variance);
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
        // Charts zerstören
        for (const key in chartsInstances) {
            if (chartsInstances[key]) {
                chartsInstances[key].destroy();
                chartsInstances[key] = null;
            }
        }
        
        // Referenzen zurücksetzen
        container = null;
        currentView = 'overview';
        selectedSurveys = [];
        selectedQuestions = [];
        selectedSection = null;
        selectedQuestion = null;
        selectedComparison = null;
        chartsInstances = {};
    };
    
    // Öffentliche API
    return {
        init,
        show,
        hide,
        dispose,
        updateView,
        filterSurveys,
        updateCharts
    };
})();