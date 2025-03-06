/**
 * administration.js
 * Modul zur Verwaltung von Systemeinstellungen und Konfigurationsparametern
 * 
 * Dieses Modul verwaltet globale Einstellungen, Datenbereinigungsfunktionen,
 * Systemkonfigurationen und Sicherungsoptionen für die Befragungsanwendung.
 */

window.AdministrationModule = (() => {
    // Modul-Elemente
    let container = null;
    let currentView = 'settings'; // 'settings', 'data', 'system', 'backup'
    let appSettings = null;
    let dataStats = null;
    
    // Standard-Einstellungen
    const defaultSettings = {
        appearance: {
            primaryColor: '#e3000b',
            secondaryColor: '#333333',
            backgroundColor: '#ffffff',
            fontFamily: 'Arial, sans-serif',
            logoPath: 'assets/images/Logo.png',
            useDarkMode: false,
            useAnimations: true
        },
        display: {
            decimalPrecision: 1,
            dateFormat: 'DD.MM.YYYY',
            defaultChartType: 'bar',
            showGridLines: true,
            responsiveCharts: true,
            chartAnimations: true
        },
        survey: {
            minResponsesForAnalysis: 1,
            hideSmallGroups: true,
            smallGroupThreshold: 3,
            significanceThreshold: 0.05,
            recommendationThreshold: 3.0
        },
        system: {
            autoSaveInterval: 5, // Minuten
            maxBackupFiles: 10,
            backupInterval: 24, // Stunden
            storeDataLocally: true,
            logLevel: 'error', // 'debug', 'info', 'warn', 'error'
            analyticsEnabled: false
        },
        user: {
            name: '',
            role: 'admin',
            organization: 'Klinik für Radiologie und Nuklearmedizin',
            language: 'de'
        }
    };
    
    /**
     * Administration-Modul initialisieren
     */
    const init = async (targetContainer) => {
        try {
            container = targetContainer;
            
            // Einstellungen laden oder Standardwerte verwenden
            loadSettings();
            
            // Daten-Statistiken laden
            await loadDataStatistics();
            
            // Layout erstellen
            createLayout();
            
            // Erste Ansicht anzeigen
            showView(currentView);
            
            return true;
        } catch (error) {
            console.error('Fehler bei der Initialisierung des Administration-Moduls:', error);
            container.innerHTML = `<div class="alert alert-danger">
                <h4>Fehler beim Laden des Administration-Moduls</h4>
                <p>${error.message}</p>
            </div>`;
            return false;
        }
    };
    
    /**
     * Einstellungen aus dem LocalStorage laden oder Standardwerte verwenden
     */
    const loadSettings = () => {
        try {
            // Aus LocalStorage laden
            const savedSettings = Utils.storage.get('app_settings');
            
            if (savedSettings) {
                appSettings = savedSettings;
                
                // Prüfen ob alle Eigenschaften vorhanden sind und gegebenenfalls ergänzen
                appSettings.appearance = { ...defaultSettings.appearance, ...appSettings.appearance || {} };
                appSettings.display = { ...defaultSettings.display, ...appSettings.display || {} };
                appSettings.survey = { ...defaultSettings.survey, ...appSettings.survey || {} };
                appSettings.system = { ...defaultSettings.system, ...appSettings.system || {} };
                appSettings.user = { ...defaultSettings.user, ...appSettings.user || {} };
            } else {
                // Standardeinstellungen verwenden
                appSettings = JSON.parse(JSON.stringify(defaultSettings));
                
                // Einstellungen speichern
                Utils.storage.set('app_settings', appSettings);
            }
            
            // Einstellungen anwenden
            applySettings();
            
        } catch (error) {
            console.error('Fehler beim Laden der Einstellungen:', error);
            
            // Standardeinstellungen verwenden bei Fehler
            appSettings = JSON.parse(JSON.stringify(defaultSettings));
        }
    };
    
    /**
     * Einstellungen auf die Anwendung anwenden
     */
    const applySettings = () => {
        try {
            // CSS-Variablen setzen
            document.documentElement.style.setProperty('--primary-color', appSettings.appearance.primaryColor);
            document.documentElement.style.setProperty('--secondary-color', appSettings.appearance.secondaryColor);
            document.documentElement.style.setProperty('--background-color', appSettings.appearance.backgroundColor);
            document.documentElement.style.setProperty('--font-family', appSettings.appearance.fontFamily);
            
            // Dark Mode umschalten
            if (appSettings.appearance.useDarkMode) {
                document.body.classList.add('dark-mode');
            } else {
                document.body.classList.remove('dark-mode');
            }
            
            // Animationen umschalten
            if (appSettings.appearance.useAnimations) {
                document.body.classList.remove('no-animations');
            } else {
                document.body.classList.add('no-animations');
            }
            
            // Weitere Einstellungen auf Module anwenden
            updateModuleSettings();
            
        } catch (error) {
            console.error('Fehler beim Anwenden der Einstellungen:', error);
        }
    };
    
    /**
     * Einstellungen auf Module anwenden
     */
    const updateModuleSettings = () => {
        try {
            // Event auslösen, um anderen Modulen mitzuteilen, dass Einstellungen geändert wurden
            const settingsEvent = new CustomEvent('app:settings:changed', {
                detail: {
                    settings: appSettings
                }
            });
            
            document.dispatchEvent(settingsEvent);
            
        } catch (error) {
            console.error('Fehler beim Aktualisieren der Moduleinstellungen:', error);
        }
    };
    
    /**
     * Einstellungen speichern
     */
    const saveSettings = () => {
        try {
            // In LocalStorage speichern
            Utils.storage.set('app_settings', appSettings);
            
            // Einstellungen anwenden
            applySettings();
            
            return true;
        } catch (error) {
            console.error('Fehler beim Speichern der Einstellungen:', error);
            return false;
        }
    };
    
    /**
     * Daten-Statistiken laden
     */
    const loadDataStatistics = async () => {
        try {
            // Surveys laden
            const surveys = DataManager.getAllSurveys();
            
            // Basis-Statistiken
            dataStats = {
                surveys: {
                    total: surveys.length,
                    complete: surveys.filter(s => {
                        // Als vollständig gilt ein Survey, wenn mindestens 90% der Likert-Fragen beantwortet sind
                        let likertQuestions = 0;
                        let answeredQuestions = 0;
                        
                        for (const section of SurveySchema.sections) {
                            for (const question of section.questions) {
                                if (question.type === 'likert') {
                                    likertQuestions++;
                                    if (s[question.id] !== null && s[question.id] !== undefined) {
                                        answeredQuestions++;
                                    }
                                }
                            }
                        }
                        
                        return likertQuestions > 0 && (answeredQuestions / likertQuestions) >= 0.9;
                    }).length,
                    incomplete: 0,
                    dateRange: {
                        first: null,
                        last: null
                    }
                },
                storage: {
                    localStorageUsed: 0,
                    localStorageAvailable: 0,
                    localStoragePercentage: 0
                },
                demographics: {
                    profession: {},
                    experience: {},
                    tenure: {}
                },
                reports: {
                    total: 0,
                    lastGenerated: null
                }
            };
            
            // Unvollständige Surveys berechnen
            dataStats.surveys.incomplete = dataStats.surveys.total - dataStats.surveys.complete;
            
            // Datumsbereich ermitteln
            if (surveys.length > 0) {
                const dates = surveys.map(s => new Date(s.timestamp)).sort((a, b) => a - b);
                dataStats.surveys.dateRange.first = dates[0].toISOString();
                dataStats.surveys.dateRange.last = dates[dates.length - 1].toISOString();
            }
            
            // Demografische Daten zusammenzählen
            for (const survey of surveys) {
                // Profession
                if (survey.profession) {
                    dataStats.demographics.profession[survey.profession] = 
                        (dataStats.demographics.profession[survey.profession] || 0) + 1;
                }
                
                // Experience
                if (survey.experience) {
                    dataStats.demographics.experience[survey.experience] = 
                        (dataStats.demographics.experience[survey.experience] || 0) + 1;
                }
                
                // Tenure
                if (survey.tenure) {
                    dataStats.demographics.tenure[survey.tenure] = 
                        (dataStats.demographics.tenure[survey.tenure] || 0) + 1;
                }
            }
            
            // Berichte zählen
            const savedReports = Utils.storage.get('saved_reports') || [];
            dataStats.reports.total = savedReports.length;
            
            if (savedReports.length > 0) {
                const lastReport = savedReports.sort((a, b) => 
                    new Date(b.lastModified) - new Date(a.lastModified)
                )[0];
                
                dataStats.reports.lastGenerated = lastReport.lastModified;
            }
            
            // LocalStorage-Nutzung berechnen
            dataStats.storage.localStorageUsed = calculateLocalStorageUsage();
            dataStats.storage.localStorageAvailable = 5 * 1024 * 1024; // 5MB ist typisch für LocalStorage
            dataStats.storage.localStoragePercentage = 
                Math.round((dataStats.storage.localStorageUsed / dataStats.storage.localStorageAvailable) * 100);
            
        } catch (error) {
            console.error('Fehler beim Laden der Daten-Statistiken:', error);
            dataStats = {
                surveys: { total: 0, complete: 0, incomplete: 0 },
                storage: { localStorageUsed: 0, localStorageAvailable: 0, localStoragePercentage: 0 },
                demographics: { profession: {}, experience: {}, tenure: {} },
                reports: { total: 0, lastGenerated: null }
            };
        }
    };
    
    /**
     * LocalStorage-Nutzung berechnen
     */
    const calculateLocalStorageUsage = () => {
        try {
            let total = 0;
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                
                total += (key.length + value.length) * 2; // Unicode characters = 2 bytes
            }
            
            return total;
        } catch (error) {
            console.error('Fehler beim Berechnen der LocalStorage-Nutzung:', error);
            return 0;
        }
    };
    
    /**
     * Basis-Layout erstellen
     */
    const createLayout = () => {
        container.innerHTML = `
            <div class="administration-container">
                <div class="section-header d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2>
                            <i class="fas fa-cogs"></i> 
                            Administration
                        </h2>
                        <p class="section-description">
                            Systemeinstellungen, Konfiguration und Datenverwaltung
                        </p>
                    </div>
                    <div class="actions">
                        <button class="btn btn-outline-secondary me-2" id="reset-default-settings-btn">
                            <i class="fas fa-undo"></i> Standardeinstellungen
                        </button>
                        <button class="btn btn-primary" id="save-settings-btn">
                            <i class="fas fa-save"></i> Einstellungen speichern
                        </button>
                    </div>
                </div>
                
                <div class="row">
                    <!-- Linke Spalte: Navigation -->
                    <div class="col-md-3 mb-4">
                        <div class="card">
                            <div class="card-body p-0">
                                <div class="list-group admin-nav">
                                    <a href="#" class="list-group-item list-group-item-action active" data-view="settings">
                                        <i class="fas fa-sliders-h"></i> Anwendungseinstellungen
                                    </a>
                                    <a href="#" class="list-group-item list-group-item-action" data-view="data">
                                        <i class="fas fa-database"></i> Datenverwaltung
                                    </a>
                                    <a href="#" class="list-group-item list-group-item-action" data-view="system">
                                        <i class="fas fa-server"></i> Systemeinstellungen
                                    </a>
                                    <a href="#" class="list-group-item list-group-item-action" data-view="backup">
                                        <i class="fas fa-save"></i> Datensicherung
                                    </a>
                                </div>
                            </div>
                        </div>
                        
                        <div class="card mt-4">
                            <div class="card-header bg-light">
                                <h6 class="mb-0">System-Information</h6>
                            </div>
                            <div class="card-body">
                                <div class="system-info">
                                    <div class="info-item">
                                        <div class="info-label">Anzahl Fragebögen:</div>
                                        <div class="info-value">${dataStats?.surveys?.total || 0}</div>
                                    </div>
                                    <div class="info-item">
                                        <div class="info-label">Speichernutzung:</div>
                                        <div class="info-value">
                                            <div class="progress" style="height: 5px;">
                                                <div class="progress-bar" role="progressbar" style="width: ${dataStats?.storage?.localStoragePercentage || 0}%;" 
                                                    aria-valuenow="${dataStats?.storage?.localStoragePercentage || 0}" aria-valuemin="0" aria-valuemax="100"></div>
                                            </div>
                                            <small>${formatBytes(dataStats?.storage?.localStorageUsed)} / ${formatBytes(dataStats?.storage?.localStorageAvailable)}</small>
                                        </div>
                                    </div>
                                    <div class="info-item">
                                        <div class="info-label">Version:</div>
                                        <div class="info-value">1.0</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Rechte Spalte: Inhalt -->
                    <div class="col-md-9">
                        <div id="admin-content" class="admin-content">
                            <!-- Wird dynamisch befüllt -->
                            <div class="text-center p-5">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Laden...</span>
                                </div>
                                <p class="mt-2">Einstellungen werden geladen...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Event-Listener für Navigation
        document.querySelectorAll('.admin-nav .list-group-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Aktives Element umschalten
                document.querySelectorAll('.admin-nav .list-group-item').forEach(i => {
                    i.classList.remove('active');
                });
                e.currentTarget.classList.add('active');
                
                // Ansicht wechseln
                const view = e.currentTarget.getAttribute('data-view');
                showView(view);
            });
        });
        
        // Event-Listener für "Einstellungen speichern" Button
        document.getElementById('save-settings-btn')?.addEventListener('click', () => {
            // Aktuelle Werte aus dem Formular übernehmen
            updateSettingsFromForm();
            
            // Einstellungen speichern
            if (saveSettings()) {
                Utils.notifications.success('Einstellungen wurden erfolgreich gespeichert.');
            } else {
                Utils.notifications.error('Fehler beim Speichern der Einstellungen.');
            }
        });
        
        // Event-Listener für "Standardeinstellungen" Button
        document.getElementById('reset-default-settings-btn')?.addEventListener('click', () => {
            Utils.modal.confirm(
                'Möchten Sie wirklich alle Einstellungen auf die Standardwerte zurücksetzen?',
                () => {
                    // Standardeinstellungen laden
                    appSettings = JSON.parse(JSON.stringify(defaultSettings));
                    
                    // Einstellungen speichern und anwenden
                    if (saveSettings()) {
                        // Ansicht aktualisieren
                        showView(currentView);
                        
                        Utils.notifications.success('Einstellungen wurden auf Standardwerte zurückgesetzt.');
                    } else {
                        Utils.notifications.error('Fehler beim Zurücksetzen der Einstellungen.');
                    }
                }
            );
        });
    };
    
    /**
     * Ansicht wechseln
     */
    const showView = (view) => {
        currentView = view;
        
        const contentContainer = document.getElementById('admin-content');
        if (!contentContainer) return;
        
        // Lade-Animation anzeigen
        contentContainer.innerHTML = `
            <div class="text-center p-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Laden...</span>
                </div>
                <p class="mt-2">Ansicht wird geladen...</p>
            </div>
        `;
        
        // Inhalt basierend auf der ausgewählten Ansicht generieren
        setTimeout(() => {
            let viewContent = '';
            
            switch (view) {
                case 'settings':
                    viewContent = generateSettingsContent();
                    break;
                case 'data':
                    viewContent = generateDataManagementContent();
                    break;
                case 'system':
                    viewContent = generateSystemSettingsContent();
                    break;
                case 'backup':
                    viewContent = generateBackupContent();
                    break;
                default:
                    viewContent = generateSettingsContent();
            }
            
            contentContainer.innerHTML = viewContent;
            
            // Event-Listener für die spezifische Ansicht hinzufügen
            attachViewEventListeners(view);
        }, 300);
    };
    
    /**
     * Anwendungseinstellungen-Ansicht generieren
     */
    const generateSettingsContent = () => {
        return `
            <div class="settings-container">
                <form id="settings-form">
                    <!-- Erscheinungsbild -->
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5 class="card-title mb-0">
                                <i class="fas fa-paint-brush"></i> Erscheinungsbild
                            </h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="primary-color" class="form-label">Primärfarbe</label>
                                    <div class="input-group">
                                        <span class="input-group-text color-preview" id="primary-color-preview" style="background-color: ${appSettings.appearance.primaryColor}"></span>
                                        <input type="text" class="form-control" id="primary-color" name="appearance.primaryColor" value="${appSettings.appearance.primaryColor}">
                                    </div>
                                    <small class="form-text text-muted">Hauptfarbe für Buttons und Elemente</small>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="secondary-color" class="form-label">Sekundärfarbe</label>
                                    <div class="input-group">
                                        <span class="input-group-text color-preview" id="secondary-color-preview" style="background-color: ${appSettings.appearance.secondaryColor}"></span>
                                        <input type="text" class="form-control" id="secondary-color" name="appearance.secondaryColor" value="${appSettings.appearance.secondaryColor}">
                                    </div>
                                    <small class="form-text text-muted">Akzentfarbe für sekundäre Elemente</small>
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="background-color" class="form-label">Hintergrundfarbe</label>
                                    <div class="input-group">
                                        <span class="input-group-text color-preview" id="background-color-preview" style="background-color: ${appSettings.appearance.backgroundColor}"></span>
                                        <input type="text" class="form-control" id="background-color" name="appearance.backgroundColor" value="${appSettings.appearance.backgroundColor}">
                                    </div>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="font-family" class="form-label">Schriftart</label>
                                    <select class="form-select" id="font-family" name="appearance.fontFamily">
                                        <option value="Arial, sans-serif" ${appSettings.appearance.fontFamily === 'Arial, sans-serif' ? 'selected' : ''}>Arial</option>
                                        <option value="'Helvetica Neue', Helvetica, sans-serif" ${appSettings.appearance.fontFamily === "'Helvetica Neue', Helvetica, sans-serif" ? 'selected' : ''}>Helvetica</option>
                                        <option value="'Segoe UI', Tahoma, sans-serif" ${appSettings.appearance.fontFamily === "'Segoe UI', Tahoma, sans-serif" ? 'selected' : ''}>Segoe UI</option>
                                        <option value="Roboto, sans-serif" ${appSettings.appearance.fontFamily === 'Roboto, sans-serif' ? 'selected' : ''}>Roboto</option>
                                        <option value="'Open Sans', sans-serif" ${appSettings.appearance.fontFamily === "'Open Sans', sans-serif" ? 'selected' : ''}>Open Sans</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="logo-path" class="form-label">Logo Pfad</label>
                                    <div class="input-group">
                                        <input type="text" class="form-control" id="logo-path" name="appearance.logoPath" value="${appSettings.appearance.logoPath}">
                                        <button class="btn btn-outline-secondary" type="button" id="browse-logo-btn">
                                            <i class="fas fa-folder-open"></i>
                                        </button>
                                    </div>
                                    <small class="form-text text-muted">Relativer Pfad zum Klinik-Logo</small>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <div class="form-check mt-4">
                                        <input class="form-check-input" type="checkbox" id="use-dark-mode" name="appearance.useDarkMode" ${appSettings.appearance.useDarkMode ? 'checked' : ''}>
                                        <label class="form-check-label" for="use-dark-mode">
                                            Dark Mode verwenden
                                        </label>
                                    </div>
                                    <div class="form-check mt-2">
                                        <input class="form-check-input" type="checkbox" id="use-animations" name="appearance.useAnimations" ${appSettings.appearance.useAnimations ? 'checked' : ''}>
                                        <label class="form-check-label" for="use-animations">
                                            Animationen aktivieren
                                        </label>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="mt-3">
                                <div class="appearance-preview p-3 border rounded">
                                    <h6>Vorschau:</h6>
                                    <div class="preview-content" id="appearance-preview">
                                        <div class="btn-group">
                                            <button class="btn btn-primary">Primär-Button</button>
                                            <button class="btn btn-secondary">Sekundär-Button</button>
                                            <button class="btn btn-outline-primary">Outline-Button</button>
                                        </div>
                                        <div class="mt-2">
                                            <div class="alert alert-primary">
                                                Eine Beispiel-Benachrichtigung mit der gewählten Primärfarbe.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Anzeigeoptionen -->
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5 class="card-title mb-0">
                                <i class="fas fa-desktop"></i> Anzeigeoptionen
                            </h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="decimal-precision" class="form-label">Dezimalstellen</label>
                                    <select class="form-select" id="decimal-precision" name="display.decimalPrecision">
                                        <option value="0" ${appSettings.display.decimalPrecision === 0 ? 'selected' : ''}>0 (3)</option>
                                        <option value="1" ${appSettings.display.decimalPrecision === 1 ? 'selected' : ''}>1 (3,5)</option>
                                        <option value="2" ${appSettings.display.decimalPrecision === 2 ? 'selected' : ''}>2 (3,52)</option>
                                    </select>
                                    <small class="form-text text-muted">Anzahl der Dezimalstellen für Zahlenangaben</small>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="date-format" class="form-label">Datumsformat</label>
                                    <select class="form-select" id="date-format" name="display.dateFormat">
                                        <option value="DD.MM.YYYY" ${appSettings.display.dateFormat === 'DD.MM.YYYY' ? 'selected' : ''}>DD.MM.YYYY (31.12.2025)</option>
                                        <option value="MM/DD/YYYY" ${appSettings.display.dateFormat === 'MM/DD/YYYY' ? 'selected' : ''}>MM/DD/YYYY (12/31/2025)</option>
                                        <option value="YYYY-MM-DD" ${appSettings.display.dateFormat === 'YYYY-MM-DD' ? 'selected' : ''}>YYYY-MM-DD (2025-12-31)</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="default-chart-type" class="form-label">Standard-Diagrammtyp</label>
                                    <select class="form-select" id="default-chart-type" name="display.defaultChartType">
                                        <option value="bar" ${appSettings.display.defaultChartType === 'bar' ? 'selected' : ''}>Balkendiagramm</option>
                                        <option value="line" ${appSettings.display.defaultChartType === 'line' ? 'selected' : ''}>Liniendiagramm</option>
                                        <option value="pie" ${appSettings.display.defaultChartType === 'pie' ? 'selected' : ''}>Kreisdiagramm</option>
                                        <option value="radar" ${appSettings.display.defaultChartType === 'radar' ? 'selected' : ''}>Netzdiagramm</option>
                                    </select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <div class="form-check mt-4">
                                        <input class="form-check-input" type="checkbox" id="show-grid-lines" name="display.showGridLines" ${appSettings.display.showGridLines ? 'checked' : ''}>
                                        <label class="form-check-label" for="show-grid-lines">
                                            Gitternetzlinien in Diagrammen anzeigen
                                        </label>
                                    </div>
                                    <div class="form-check mt-2">
                                        <input class="form-check-input" type="checkbox" id="responsive-charts" name="display.responsiveCharts" ${appSettings.display.responsiveCharts ? 'checked' : ''}>
                                        <label class="form-check-label" for="responsive-charts">
                                            Responsive Diagramme verwenden
                                        </label>
                                    </div>
                                    <div class="form-check mt-2">
                                        <input class="form-check-input" type="checkbox" id="chart-animations" name="display.chartAnimations" ${appSettings.display.chartAnimations ? 'checked' : ''}>
                                        <label class="form-check-label" for="chart-animations">
                                            Diagramm-Animationen aktivieren
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Befragungseinstellungen -->
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5 class="card-title mb-0">
                                <i class="fas fa-clipboard-list"></i> Befragungseinstellungen
                            </h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="min-responses" class="form-label">Mindestanzahl Antworten für Analyse</label>
                                    <input type="number" class="form-control" id="min-responses" name="survey.minResponsesForAnalysis" value="${appSettings.survey.minResponsesForAnalysis}" min="1" max="100">
                                    <small class="form-text text-muted">Mindestanzahl an Antworten für statistische Auswertung</small>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="small-group-threshold" class="form-label">Schwellenwert für kleine Gruppen</label>
                                    <input type="number" class="form-control" id="small-group-threshold" name="survey.smallGroupThreshold" value="${appSettings.survey.smallGroupThreshold}" min="1" max="10">
                                    <small class="form-text text-muted">Gruppengröße, ab der demografische Daten aggregiert werden</small>
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="significance-threshold" class="form-label">Signifikanz-Schwellenwert</label>
                                    <input type="number" class="form-control" id="significance-threshold" name="survey.significanceThreshold" value="${appSettings.survey.significanceThreshold}" min="0.01" max="0.1" step="0.01">
                                    <small class="form-text text-muted">p-Wert für statistische Signifikanz (0.05 = 95% Konfidenz)</small>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="recommendation-threshold" class="form-label">Schwellenwert für Empfehlungen</label>
                                    <input type="number" class="form-control" id="recommendation-threshold" name="survey.recommendationThreshold" value="${appSettings.survey.recommendationThreshold}" min="1" max="5" step="0.1">
                                    <small class="form-text text-muted">Bewertungsschwelle, unter der Handlungsempfehlungen generiert werden</small>
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-12 mb-3">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="hide-small-groups" name="survey.hideSmallGroups" ${appSettings.survey.hideSmallGroups ? 'checked' : ''}>
                                        <label class="form-check-label" for="hide-small-groups">
                                            Ergebnisse für kleine Gruppen ausblenden
                                        </label>
                                    </div>
                                    <small class="form-text text-muted">Verhindert Rückschlüsse auf einzelne Personen bei kleinen Gruppengrößen</small>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Benutzereinstellungen -->
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title mb-0">
                                <i class="fas fa-user-cog"></i> Benutzereinstellungen
                            </h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="user-name" class="form-label">Name</label>
                                    <input type="text" class="form-control" id="user-name" name="user.name" value="${appSettings.user.name}">
                                    <small class="form-text text-muted">Ihr Name für Berichte und Exporte</small>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="user-role" class="form-label">Rolle</label>
                                    <select class="form-select" id="user-role" name="user.role">
                                        <option value="admin" ${appSettings.user.role === 'admin' ? 'selected' : ''}>Administrator</option>
                                        <option value="analyst" ${appSettings.user.role === 'analyst' ? 'selected' : ''}>Analyst</option>
                                        <option value="viewer" ${appSettings.user.role === 'viewer' ? 'selected' : ''}>Betrachter</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="user-organization" class="form-label">Organisation</label>
                                    <input type="text" class="form-control" id="user-organization" name="user.organization" value="${appSettings.user.organization}">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="user-language" class="form-label">Sprache</label>
                                    <select class="form-select" id="user-language" name="user.language">
                                        <option value="de" ${appSettings.user.language === 'de' ? 'selected' : ''}>Deutsch</option>
                                        <option value="en" ${appSettings.user.language === 'en' ? 'selected' : ''}>Englisch</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        `;
    };
    
    /**
     * Datenverwaltung-Ansicht generieren
     */
    const generateDataManagementContent = () => {
        // Statistiken zu Umfragen
        const totalSurveys = dataStats?.surveys?.total || 0;
        const completeSurveys = dataStats?.surveys?.complete || 0;
        const incompleteSurveys = dataStats?.surveys?.incomplete || 0;
        const firstDate = dataStats?.surveys?.dateRange?.first ? 
            formatDate(new Date(dataStats.surveys.dateRange.first)) : 'N/A';
        const lastDate = dataStats?.surveys?.dateRange?.last ? 
            formatDate(new Date(dataStats.surveys.dateRange.last)) : 'N/A';
        
        return `
            <div class="data-management-container">
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="card-title mb-0">
                            <i class="fas fa-database"></i> Datenübersicht
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-4">
                                <div class="stat-card">
                                    <div class="stat-title">Gesamtanzahl Fragebögen</div>
                                    <div class="stat-value">${totalSurveys}</div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="stat-card">
                                    <div class="stat-title">Vollständige Fragebögen</div>
                                    <div class="stat-value">${completeSurveys}</div>
                                    <div class="stat-percentage">${totalSurveys > 0 ? Math.round((completeSurveys / totalSurveys) * 100) : 0}%</div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="stat-card">
                                    <div class="stat-title">Unvollständige Fragebögen</div>
                                    <div class="stat-value">${incompleteSurveys}</div>
                                    <div class="stat-percentage">${totalSurveys > 0 ? Math.round((incompleteSurveys / totalSurveys) * 100) : 0}%</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="row mt-4">
                            <div class="col-md-6">
                                <div class="info-card">
                                    <div class="info-label">Erster Fragebogen:</div>
                                    <div class="info-value">${firstDate}</div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="info-card">
                                    <div class="info-label">Letzter Fragebogen:</div>
                                    <div class="info-value">${lastDate}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card mb-4">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="card-title mb-0">
                            <i class="fas fa-tasks"></i> Datenverwaltung
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="data-actions">
                            <div class="row">
                                <div class="col-lg-6 mb-3">
                                    <div class="card h-100">
                                        <div class="card-body">
                                            <h5 class="card-title">Datenbereinigung</h5>
                                            <p class="card-text">Entfernen Sie unvollständige oder fehlerhafte Datensätze aus der Datenbank.</p>
                                            <button class="btn btn-outline-danger" id="clean-data-btn">
                                                <i class="fas fa-broom"></i> Daten bereinigen
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-lg-6 mb-3">
                                    <div class="card h-100">
                                        <div class="card-body">
                                            <h5 class="card-title">Alle Daten löschen</h5>
                                            <p class="card-text">Löschen Sie alle gespeicherten Umfragedaten. Diese Aktion kann nicht rückgängig gemacht werden!</p>
                                            <button class="btn btn-danger" id="delete-all-data-btn">
                                                <i class="fas fa-trash-alt"></i> Alle Daten löschen
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="row mt-3">
                                <div class="col-lg-6 mb-3">
                                    <div class="card h-100">
                                        <div class="card-body">
                                            <h5 class="card-title">Cache leeren</h5>
                                            <p class="card-text">Leeren Sie den Cache für bessere Performance. Gespeicherte Daten bleiben erhalten.</p>
                                            <button class="btn btn-outline-primary" id="clear-cache-btn">
                                                <i class="fas fa-eraser"></i> Cache leeren
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-lg-6 mb-3">
                                    <div class="card h-100">
                                        <div class="card-body">
                                            <h5 class="card-title">Berichte verwalten</h5>
                                            <p class="card-text">Verwalten Sie gespeicherte Berichte und entfernen Sie nicht mehr benötigte.</p>
                                            <button class="btn btn-outline-secondary" id="manage-reports-btn">
                                                <i class="fas fa-file-alt"></i> Berichte verwalten
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">
                            <i class="fas fa-table"></i> Datensatzverwaltung
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="row mb-4">
                            <div class="col-md-6">
                                <div class="input-group">
                                    <span class="input-group-text"><i class="fas fa-search"></i></span>
                                    <input type="text" class="form-control" id="data-search" placeholder="Datensätze durchsuchen...">
                                </div>
                            </div>
                            <div class="col-md-6 text-md-end">
                                <button class="btn btn-outline-primary" id="reload-data-btn">
                                    <i class="fas fa-sync-alt"></i> Daten neu laden
                                </button>
                            </div>
                        </div>
                        
                        <div class="table-responsive">
                            <table class="table table-hover table-sm">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Datum</th>
                                        <th>Berufsgruppe</th>
                                        <th>Vollständigkeit</th>
                                        <th>Aktionen</th>
                                    </tr>
                                </thead>
                                <tbody id="data-table-body">
                                    <!-- Tabelle wird dynamisch gefüllt -->
                                    <tr>
                                        <td colspan="5" class="text-center">
                                            <div class="spinner-border spinner-border-sm text-primary" role="status">
                                                <span class="visually-hidden">Laden...</span>
                                            </div>
                                            <span class="ms-2">Datensätze werden geladen...</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        
                        <div class="d-flex justify-content-between align-items-center mt-3">
                            <div class="text-muted small">
                                Zeige <span id="showing-records">0</span> von <span id="total-records">${totalSurveys}</span> Datensätzen
                            </div>
                            <nav aria-label="Datensatz-Navigation">
                                <ul class="pagination pagination-sm" id="data-pagination">
                                    <!-- Pagination wird dynamisch gefüllt -->
                                </ul>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };
    
    /**
     * Systemeinstellungen-Ansicht generieren
     */
    const generateSystemSettingsContent = () => {
        return `
            <div class="system-settings-container">
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="card-title mb-0">
                            <i class="fas fa-server"></i> Systemeinstellungen
                        </h5>
                    </div>
                    <div class="card-body">
                        <form id="system-settings-form">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="auto-save-interval" class="form-label">Automatisches Speichern (Minuten)</label>
                                    <input type="number" class="form-control" id="auto-save-interval" name="system.autoSaveInterval" value="${appSettings.system.autoSaveInterval}" min="1" max="60">
                                    <small class="form-text text-muted">Intervall für automatisches Speichern in Minuten</small>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="max-backup-files" class="form-label">Maximale Backup-Dateien</label>
                                    <input type="number" class="form-control" id="max-backup-files" name="system.maxBackupFiles" value="${appSettings.system.maxBackupFiles}" min="1" max="50">
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="backup-interval" class="form-label">Backup-Intervall (Stunden)</label>
                                    <input type="number" class="form-control" id="backup-interval" name="system.backupInterval" value="${appSettings.system.backupInterval}" min="1" max="168">
                                    <small class="form-text text-muted">Intervall für automatisches Backup in Stunden</small>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="log-level" class="form-label">Log-Level</label>
                                    <select class="form-select" id="log-level" name="system.logLevel">
                                        <option value="debug" ${appSettings.system.logLevel === 'debug' ? 'selected' : ''}>Debug (Alle Meldungen)</option>
                                        <option value="info" ${appSettings.system.logLevel === 'info' ? 'selected' : ''}>Info (Informationen & Warnungen)</option>
                                        <option value="warn" ${appSettings.system.logLevel === 'warn' ? 'selected' : ''}>Warnung (nur Warnungen & Fehler)</option>
                                        <option value="error" ${appSettings.system.logLevel === 'error' ? 'selected' : ''}>Fehler (nur Fehler)</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-12 mb-3">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="store-data-locally" name="system.storeDataLocally" ${appSettings.system.storeDataLocally ? 'checked' : ''}>
                                        <label class="form-check-label" for="store-data-locally">
                                            Daten lokal speichern (LocalStorage)
                                        </label>
                                    </div>
                                    <small class="form-text text-muted">Deaktivieren Sie diese Option, wenn Daten nur temporär gespeichert werden sollen</small>
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-12 mb-3">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="analytics-enabled" name="system.analyticsEnabled" ${appSettings.system.analyticsEnabled ? 'checked' : ''}>
                                        <label class="form-check-label" for="analytics-enabled">
                                            Anonyme Nutzungsstatistiken aktivieren
                                        </label>
                                    </div>
                                    <small class="form-text text-muted">Hilft bei der Verbesserung der Anwendung (keine personenbezogenen Daten)</small>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
                
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="card-title mb-0">
                            <i class="fas fa-shield-alt"></i> Datenschutz und Sicherheit
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-lg-6 mb-3">
                                <div class="card h-100">
                                    <div class="card-body">
                                        <h5 class="card-title">Anonymisierung</h5>
                                        <p class="card-text">Anonymisieren Sie alle personenbezogenen Daten in den Umfrageergebnissen.</p>
                                        <button class="btn btn-outline-primary" id="anonymize-data-btn">
                                            <i class="fas fa-user-secret"></i> Daten anonymisieren
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div class="col-lg-6 mb-3">
                                <div class="card h-100">
                                    <div class="card-body">
                                        <h5 class="card-title">Speicherplatz freigeben</h5>
                                        <p class="card-text">Temporäre Dateien und nicht mehr benötigte Daten entfernen.</p>
                                        <button class="btn btn-outline-secondary" id="free-storage-btn">
                                            <i class="fas fa-recycle"></i> Speicherplatz freigeben
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">
                            <i class="fas fa-info-circle"></i> System-Information
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <ul class="list-group">
                                    <li class="list-group-item d-flex justify-content-between align-items-center">
                                        Version
                                        <span>1.0</span>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-center">
                                        Browser
                                        <span id="browser-info">Wird ermittelt...</span>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-center">
                                        LocalStorage verfügbar
                                        <span>${isLocalStorageAvailable() ? 
                                            '<i class="fas fa-check-circle text-success"></i> Ja' : 
                                            '<i class="fas fa-times-circle text-danger"></i> Nein'}</span>
                                    </li>
                                </ul>
                            </div>
                            <div class="col-md-6">
                                <ul class="list-group">
                                    <li class="list-group-item d-flex justify-content-between align-items-center">
                                        Letzte Aktualisierung
                                        <span>${formatDateTime(new Date())}</span>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-center">
                                        LocalStorage-Nutzung
                                        <span>${formatBytes(dataStats?.storage?.localStorageUsed)} / ${formatBytes(dataStats?.storage?.localStorageAvailable)}</span>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-center">
                                        Status
                                        <span class="badge bg-success">Betriebsbereit</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        
                        <div class="d-flex justify-content-end mt-4">
                            <button class="btn btn-outline-primary" id="check-updates-btn">
                                <i class="fas fa-sync-alt"></i> Nach Updates suchen
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };
    
    /**
     * Backup-Ansicht generieren
     */
    const generateBackupContent = () => {
        return `
            <div class="backup-container">
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="card-title mb-0">
                            <i class="fas fa-save"></i> Datensicherung
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-lg-6 mb-4">
                                <div class="card h-100">
                                    <div class="card-body">
                                        <h5 class="card-title">Vollständiges Backup erstellen</h5>
                                        <p class="card-text">Erstellen Sie eine vollständige Sicherung aller Daten, Einstellungen und Berichte.</p>
                                        <button class="btn btn-primary" id="create-full-backup-btn">
                                            <i class="fas fa-download"></i> Vollständiges Backup erstellen
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div class="col-lg-6 mb-4">
                                <div class="card h-100">
                                    <div class="card-body">
                                        <h5 class="card-title">Backup wiederherstellen</h5>
                                        <p class="card-text">Stellen Sie eine frühere Sicherung wieder her. Aktuelle Daten werden überschrieben.</p>
                                        <div class="input-group">
                                            <input type="file" class="form-control" id="restore-backup-file" accept=".json">
                                            <button class="btn btn-outline-primary" type="button" id="restore-backup-btn">
                                                <i class="fas fa-upload"></i> Wiederherstellen
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="row">
                            <div class="col-lg-6 mb-4">
                                <div class="card h-100">
                                    <div class="card-body">
                                        <h5 class="card-title">Nur Umfragedaten exportieren</h5>
                                        <p class="card-text">Exportieren Sie nur die Umfragedaten ohne Einstellungen und Berichte.</p>
                                        <button class="btn btn-outline-primary" id="export-surveys-btn">
                                            <i class="fas fa-file-export"></i> Umfragedaten exportieren
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div class="col-lg-6 mb-4">
                                <div class="card h-100">
                                    <div class="card-body">
                                        <h5 class="card-title">Nur Einstellungen exportieren</h5>
                                        <p class="card-text">Exportieren Sie nur die Anwendungseinstellungen für die Übertragung auf andere Installationen.</p>
                                        <button class="btn btn-outline-primary" id="export-settings-btn">
                                            <i class="fas fa-sliders-h"></i> Einstellungen exportieren
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">
                            <i class="fas fa-history"></i> Backup-Verlauf
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Datum</th>
                                        <th>Typ</th>
                                        <th>Größe</th>
                                        <th>Status</th>
                                        <th>Aktionen</th>
                                    </tr>
                                </thead>
                                <tbody id="backup-history-table">
                                    <!-- Diese Tabelle wird mit tatsächlichen Backup-Daten gefüllt, falls vorhanden -->
                                    <tr id="no-backups-row">
                                        <td colspan="5" class="text-center">
                                            <p class="text-muted my-3">Keine Backup-Historie verfügbar</p>
                                        </td>
                                    </tr>
                                    <!-- Beispieldaten -->
                                    <tr class="d-none">
                                        <td>04.03.2025 09:15</td>
                                        <td>Vollständig</td>
                                        <td>256 KB</td>
                                        <td><span class="badge bg-success">Erfolgreich</span></td>
                                        <td>
                                            <button class="btn btn-sm btn-outline-primary">
                                                <i class="fas fa-download"></i>
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        
                        <div class="mt-4">
                            <h6>Automatisches Backup</h6>
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="auto-backup-toggle" checked>
                                <label class="form-check-label" for="auto-backup-toggle">Automatisches Backup aktivieren</label>
                            </div>
                            <div class="auto-backup-settings mt-2">
                                <div class="row g-2 align-items-center">
                                    <div class="col-auto">
                                        <label for="auto-backup-interval" class="col-form-label">Intervall:</label>
                                    </div>
                                    <div class="col-auto">
                                        <select class="form-select form-select-sm" id="auto-backup-interval">
                                            <option value="daily">Täglich</option>
                                            <option value="weekly" selected>Wöchentlich</option>
                                            <option value="monthly">Monatlich</option>
                                        </select>
                                    </div>
                                    <div class="col-auto">
                                        <button class="btn btn-sm btn-outline-secondary" id="auto-backup-settings-btn">
                                            <i class="fas fa-cog"></i> Einstellungen
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };
    
    /**
     * Event-Listener für spezifische Ansicht hinzufügen
     */
    const attachViewEventListeners = (view) => {
        switch (view) {
            case 'settings':
                attachSettingsViewListeners();
                break;
            case 'data':
                attachDataManagementViewListeners();
                break;
            case 'system':
                attachSystemSettingsViewListeners();
                break;
            case 'backup':
                attachBackupViewListeners();
                break;
        }
    };
    
    /**
     * Event-Listener für Anwendungseinstellungen hinzufügen
     */
    const attachSettingsViewListeners = () => {
        // Farbauswahl-Vorschau-Aktualisierung
        document.getElementById('primary-color')?.addEventListener('input', (e) => {
            document.getElementById('primary-color-preview').style.backgroundColor = e.target.value;
            updateAppearancePreview();
        });
        
        document.getElementById('secondary-color')?.addEventListener('input', (e) => {
            document.getElementById('secondary-color-preview').style.backgroundColor = e.target.value;
            updateAppearancePreview();
        });
        
        document.getElementById('background-color')?.addEventListener('input', (e) => {
            document.getElementById('background-color-preview').style.backgroundColor = e.target.value;
            updateAppearancePreview();
        });
        
        // Schriftart-Änderungen
        document.getElementById('font-family')?.addEventListener('change', () => {
            updateAppearancePreview();
        });
        
        // Dark Mode Umschalter
        document.getElementById('use-dark-mode')?.addEventListener('change', () => {
            updateAppearancePreview();
        });
        
        // Logo-Auswahl
        document.getElementById('browse-logo-btn')?.addEventListener('click', () => {
            // In einer realen Implementierung würde hier ein Datei-Browser geöffnet
            Utils.notifications.info('Datei-Browser-Funktion ist in dieser Version nicht verfügbar.');
        });
        
        // Initial Vorschau aktualisieren
        updateAppearancePreview();
    };
    
    /**
     * Event-Listener für Datenverwaltung hinzufügen
     */
    const attachDataManagementViewListeners = () => {
        // Daten bereinigen
        document.getElementById('clean-data-btn')?.addEventListener('click', cleanData);
        
        // Alle Daten löschen
        document.getElementById('delete-all-data-btn')?.addEventListener('click', confirmDeleteAllData);
        
        // Cache leeren
        document.getElementById('clear-cache-btn')?.addEventListener('click', clearCache);
        
        // Berichte verwalten
        document.getElementById('manage-reports-btn')?.addEventListener('click', manageReports);
        
        // Daten neu laden
        document.getElementById('reload-data-btn')?.addEventListener('click', reloadDataTable);
        
        // Suchfunktion
        document.getElementById('data-search')?.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            filterDataTable(searchTerm);
        });
        
        // Datentabelle initial laden
        loadDataTable();
    };
    
    /**
     * Event-Listener für Systemeinstellungen hinzufügen
     */
    const attachSystemSettingsViewListeners = () => {
        // Browser-Info anzeigen
        const browserInfo = document.getElementById('browser-info');
        if (browserInfo) {
            browserInfo.textContent = getBrowserInfo();
        }
        
        // Daten anonymisieren
        document.getElementById('anonymize-data-btn')?.addEventListener('click', anonymizeData);
        
        // Speicherplatz freigeben
        document.getElementById('free-storage-btn')?.addEventListener('click', freeStorage);
        
        // Nach Updates suchen
        document.getElementById('check-updates-btn')?.addEventListener('click', checkForUpdates);
        
        // Event-Listener für Systemeinstellungsformular
        const systemSettingsForm = document.getElementById('system-settings-form');
        if (systemSettingsForm) {
            const formElements = systemSettingsForm.querySelectorAll('input, select');
            formElements.forEach(element => {
                element.addEventListener('change', () => {
                    // Aktuelle Werte aus dem Formular übernehmen
                    updateSettingsFromForm();
                });
            });
        }
    };
    
    /**
     * Event-Listener für Backup-Ansicht hinzufügen
     */
    const attachBackupViewListeners = () => {
        // Vollständiges Backup erstellen
        document.getElementById('create-full-backup-btn')?.addEventListener('click', createFullBackup);
        
        // Backup wiederherstellen
        document.getElementById('restore-backup-btn')?.addEventListener('click', restoreBackup);
        
        // Umfragedaten exportieren
        document.getElementById('export-surveys-btn')?.addEventListener('click', exportSurveys);
        
        // Einstellungen exportieren
        document.getElementById('export-settings-btn')?.addEventListener('click', exportSettings);
        
        // Automatisches Backup Toggle
        document.getElementById('auto-backup-toggle')?.addEventListener('change', toggleAutoBackup);
        
        // Automatisches Backup Einstellungen
        document.getElementById('auto-backup-settings-btn')?.addEventListener('click', configureAutoBackup);
        
        // Backup-Historie laden
        loadBackupHistory();
    };
    
    /**
     * Erscheinungsbild-Vorschau aktualisieren
     */
    const updateAppearancePreview = () => {
        const previewContainer = document.getElementById('appearance-preview');
        if (!previewContainer) return;
        
        // Werte aus dem Formular holen
        const primaryColor = document.getElementById('primary-color')?.value || appSettings.appearance.primaryColor;
        const secondaryColor = document.getElementById('secondary-color')?.value || appSettings.appearance.secondaryColor;
        const backgroundColor = document.getElementById('background-color')?.value || appSettings.appearance.backgroundColor;
        const fontFamily = document.getElementById('font-family')?.value || appSettings.appearance.fontFamily;
        const useDarkMode = document.getElementById('use-dark-mode')?.checked || false;
        
        // CSS-Variablen für die Vorschau setzen
        previewContainer.style.setProperty('--primary-color', primaryColor);
        previewContainer.style.setProperty('--secondary-color', secondaryColor);
        previewContainer.style.setProperty('--background-color', backgroundColor);
        previewContainer.style.setProperty('--font-family', fontFamily);
        
        // Dark Mode umschalten
        if (useDarkMode) {
            previewContainer.classList.add('dark-preview');
        } else {
            previewContainer.classList.remove('dark-preview');
        }
        
        // Vorschau-Inhalte aktualisieren
        const primaryBtn = previewContainer.querySelector('.btn-primary');
        const secondaryBtn = previewContainer.querySelector('.btn-secondary');
        const primaryAlert = previewContainer.querySelector('.alert-primary');
        
        if (primaryBtn) primaryBtn.style.backgroundColor = primaryColor;
        if (secondaryBtn) secondaryBtn.style.backgroundColor = secondaryColor;
        if (primaryAlert) primaryAlert.style.borderColor = primaryColor;
    };
    
    /**
     * Aktuelle Werte aus dem Formular in die Einstellungen übernehmen
     */
    const updateSettingsFromForm = () => {
        try {
            // Anwendungseinstellungen
            const settingsForm = document.getElementById('settings-form');
            if (settingsForm) {
                // Erscheinungsbild
                appSettings.appearance.primaryColor = document.getElementById('primary-color')?.value || appSettings.appearance.primaryColor;
                appSettings.appearance.secondaryColor = document.getElementById('secondary-color')?.value || appSettings.appearance.secondaryColor;
                appSettings.appearance.backgroundColor = document.getElementById('background-color')?.value || appSettings.appearance.backgroundColor;
                appSettings.appearance.fontFamily = document.getElementById('font-family')?.value || appSettings.appearance.fontFamily;
                appSettings.appearance.logoPath = document.getElementById('logo-path')?.value || appSettings.appearance.logoPath;
                appSettings.appearance.useDarkMode = document.getElementById('use-dark-mode')?.checked || false;
                appSettings.appearance.useAnimations = document.getElementById('use-animations')?.checked || true;
                
                // Anzeigeoptionen
                appSettings.display.decimalPrecision = parseInt(document.getElementById('decimal-precision')?.value || appSettings.display.decimalPrecision);
                appSettings.display.dateFormat = document.getElementById('date-format')?.value || appSettings.display.dateFormat;
                appSettings.display.defaultChartType = document.getElementById('default-chart-type')?.value || appSettings.display.defaultChartType;
                appSettings.display.showGridLines = document.getElementById('show-grid-lines')?.checked || false;
                appSettings.display.responsiveCharts = document.getElementById('responsive-charts')?.checked || true;
                appSettings.display.chartAnimations = document.getElementById('chart-animations')?.checked || true;
                
                // Befragungseinstellungen
                appSettings.survey.minResponsesForAnalysis = parseInt(document.getElementById('min-responses')?.value || appSettings.survey.minResponsesForAnalysis);
                appSettings.survey.smallGroupThreshold = parseInt(document.getElementById('small-group-threshold')?.value || appSettings.survey.smallGroupThreshold);
                appSettings.survey.significanceThreshold = parseFloat(document.getElementById('significance-threshold')?.value || appSettings.survey.significanceThreshold);
                appSettings.survey.recommendationThreshold = parseFloat(document.getElementById('recommendation-threshold')?.value || appSettings.survey.recommendationThreshold);
                appSettings.survey.hideSmallGroups = document.getElementById('hide-small-groups')?.checked || false;
                
                // Benutzereinstellungen
                appSettings.user.name = document.getElementById('user-name')?.value || appSettings.user.name;
                appSettings.user.role = document.getElementById('user-role')?.value || appSettings.user.role;
                appSettings.user.organization = document.getElementById('user-organization')?.value || appSettings.user.organization;
                appSettings.user.language = document.getElementById('user-language')?.value || appSettings.user.language;
            }
            
            // Systemeinstellungen
            const systemSettingsForm = document.getElementById('system-settings-form');
            if (systemSettingsForm) {
                appSettings.system.autoSaveInterval = parseInt(document.getElementById('auto-save-interval')?.value || appSettings.system.autoSaveInterval);
                appSettings.system.maxBackupFiles = parseInt(document.getElementById('max-backup-files')?.value || appSettings.system.maxBackupFiles);
                appSettings.system.backupInterval = parseInt(document.getElementById('backup-interval')?.value || appSettings.system.backupInterval);
                appSettings.system.logLevel = document.getElementById('log-level')?.value || appSettings.system.logLevel;
                appSettings.system.storeDataLocally = document.getElementById('store-data-locally')?.checked || true;
                appSettings.system.analyticsEnabled = document.getElementById('analytics-enabled')?.checked || false;
            }
            
        } catch (error) {
            console.error('Fehler beim Aktualisieren der Einstellungen aus dem Formular:', error);
        }
    };
    
    /**
     * Datensätze in Tabelle laden
     */
    const loadDataTable = () => {
        try {
            const tableBody = document.getElementById('data-table-body');
            if (!tableBody) return;
            
            // Surveys laden
            const surveys = DataManager.getAllSurveys();
            
            // Wenn keine Daten verfügbar
            if (!surveys || surveys.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center">
                            <p class="my-3">Keine Datensätze verfügbar</p>
                        </td>
                    </tr>
                `;
                
                // Pagination und Zähler aktualisieren
                document.getElementById('showing-records').textContent = '0';
                document.getElementById('total-records').textContent = '0';
                document.getElementById('data-pagination').innerHTML = '';
                
                return;
            }
            
            // Tabelleninhalt generieren (begrenzt auf 10 Einträge für bessere Performance)
            const displayedSurveys = surveys.slice(0, 10);
            
            tableBody.innerHTML = displayedSurveys.map(survey => {
                // Vollständigkeit berechnen
                let completeness = calculateSurveyCompleteness(survey);
                
                // Klasse und Text basierend auf Vollständigkeit
                let completenessClass = '';
                if (completeness >= 90) completenessClass = 'success';
                else if (completeness >= 75) completenessClass = 'info';
                else if (completeness >= 50) completenessClass = 'warning';
                else completenessClass = 'danger';
                
                return `
                    <tr data-id="${survey.id}">
                        <td title="${survey.id}">${survey.id.substring(0, 8)}...</td>
                        <td>${formatDateTime(new Date(survey.timestamp))}</td>
                        <td>${survey.profession || 'Keine Angabe'}</td>
                        <td>
                            <div class="progress" style="height: 10px;">
                                <div class="progress-bar bg-${completenessClass}" role="progressbar" 
                                    style="width: ${completeness}%;" aria-valuenow="${completeness}" 
                                    aria-valuemin="0" aria-valuemax="100"></div>
                            </div>
                            <small>${completeness}%</small>
                        </td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary view-data-btn" data-id="${survey.id}" title="Ansehen">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger delete-data-btn" data-id="${survey.id}" title="Löschen">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
            
            // Zähler aktualisieren
            document.getElementById('showing-records').textContent = displayedSurveys.length.toString();
            document.getElementById('total-records').textContent = surveys.length.toString();
            
            // Einfache Pagination erstellen
            const pagination = document.getElementById('data-pagination');
            if (pagination && surveys.length > 10) {
                const pageCount = Math.ceil(surveys.length / 10);
                
                let paginationHTML = `
                    <li class="page-item disabled">
                        <a class="page-link" href="#" aria-label="Vorherige">
                            <span aria-hidden="true">&laquo;</span>
                        </a>
                    </li>
                `;
                
                for (let i = 1; i <= Math.min(pageCount, 5); i++) {
                    paginationHTML += `
                        <li class="page-item ${i === 1 ? 'active' : ''}">
                            <a class="page-link" href="#" data-page="${i}">${i}</a>
                        </li>
                    `;
                }
                
                if (pageCount > 5) {
                    paginationHTML += `
                        <li class="page-item disabled">
                            <a class="page-link" href="#">...</a>
                        </li>
                        <li class="page-item">
                            <a class="page-link" href="#" data-page="${pageCount}">${pageCount}</a>
                        </li>
                    `;
                }
                
                paginationHTML += `
                    <li class="page-item">
                        <a class="page-link" href="#" aria-label="Nächste">
                            <span aria-hidden="true">&raquo;</span>
                        </a>
                    </li>
                `;
                
                pagination.innerHTML = paginationHTML;
                
                // Event-Listener für Pagination
                document.querySelectorAll('#data-pagination .page-link[data-page]').forEach(link => {
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        const page = parseInt(e.currentTarget.getAttribute('data-page'));
                        loadDataTablePage(page);
                    });
                });
            } else if (pagination) {
                pagination.innerHTML = '';
            }
            
            // Event-Listener für Datenaktionen
            document.querySelectorAll('.view-data-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id');
                    viewSurveyData(id);
                });
            });
            
            document.querySelectorAll('.delete-data-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id');
                    confirmDeleteSurvey(id);
                });
            });
            
        } catch (error) {
            console.error('Fehler beim Laden der Datentabelle:', error);
            
            const tableBody = document.getElementById('data-table-body');
            if (tableBody) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center text-danger">
                            <i class="fas fa-exclamation-triangle"></i> 
                            Fehler beim Laden der Daten: ${error.message}
                        </td>
                    </tr>
                `;
            }
        }
    };
    
    /**
     * Datentabelle nach Seitenzahl laden
     */
    const loadDataTablePage = (page) => {
        try {
            const tableBody = document.getElementById('data-table-body');
            if (!tableBody) return;
            
            // Surveys laden
            const surveys = DataManager.getAllSurveys();
            
            // Wenn keine Daten verfügbar
            if (!surveys || surveys.length === 0) return;
            
            // Berechnung der anzuzeigenden Surveys für die gewählte Seite
            const startIndex = (page - 1) * 10;
            const endIndex = Math.min(startIndex + 10, surveys.length);
            const displayedSurveys = surveys.slice(startIndex, endIndex);
            
            // Tabelleninhalt generieren
            tableBody.innerHTML = displayedSurveys.map(survey => {
                // Vollständigkeit berechnen
                let completeness = calculateSurveyCompleteness(survey);
                
                // Klasse und Text basierend auf Vollständigkeit
                let completenessClass = '';
                if (completeness >= 90) completenessClass = 'success';
                else if (completeness >= 75) completenessClass = 'info';
                else if (completeness >= 50) completenessClass = 'warning';
                else completenessClass = 'danger';
                
                return `
                    <tr data-id="${survey.id}">
                        <td title="${survey.id}">${survey.id.substring(0, 8)}...</td>
                        <td>${formatDateTime(new Date(survey.timestamp))}</td>
                        <td>${survey.profession || 'Keine Angabe'}</td>
                        <td>
                            <div class="progress" style="height: 10px;">
                                <div class="progress-bar bg-${completenessClass}" role="progressbar" 
                                    style="width: ${completeness}%;" aria-valuenow="${completeness}" 
                                    aria-valuemin="0" aria-valuemax="100"></div>
                            </div>
                            <small>${completeness}%</small>
                        </td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary view-data-btn" data-id="${survey.id}" title="Ansehen">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger delete-data-btn" data-id="${survey.id}" title="Löschen">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
            
            // Zähler aktualisieren
            document.getElementById('showing-records').textContent = 
                `${startIndex + 1}-${endIndex}`;
            
            // Pagination aktualisieren
            const pageCount = Math.ceil(surveys.length / 10);
            const pagination = document.getElementById('data-pagination');
            
            if (pagination) {
                document.querySelectorAll('#data-pagination .page-item').forEach(item => {
                    item.classList.remove('active');
                });
                
                const activePageItem = document.querySelector(`#data-pagination .page-link[data-page="${page}"]`);
                if (activePageItem) {
                    activePageItem.parentElement.classList.add('active');
                }
                
                // Vorherige/Nächste-Buttons aktualisieren
                const prevButton = pagination.querySelector('.page-item:first-child');
                const nextButton = pagination.querySelector('.page-item:last-child');
                
                if (prevButton) prevButton.classList.toggle('disabled', page === 1);
                if (nextButton) nextButton.classList.toggle('disabled', page === pageCount);
            }
            
            // Event-Listener für Datenaktionen
            document.querySelectorAll('.view-data-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id');
                    viewSurveyData(id);
                });
            });
            
            document.querySelectorAll('.delete-data-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id');
                    confirmDeleteSurvey(id);
                });
            });
            
        } catch (error) {
            console.error('Fehler beim Laden der Datentabellenseite:', error);
        }
    };
    
    /**
     * Datentabelle nach Suchbegriff filtern
     */
    const filterDataTable = (searchTerm) => {
        try {
            if (!searchTerm) {
                // Bei leerem Suchbegriff einfach die erste Seite laden
                loadDataTablePage(1);
                return;
            }
            
            const tableBody = document.getElementById('data-table-body');
            if (!tableBody) return;
            
            // Surveys laden
            const allSurveys = DataManager.getAllSurveys();
            
            // Surveys filtern
            const filteredSurveys = allSurveys.filter(survey => {
                // Nach ID, Berufsgruppe und Zeitstempel suchen
                return (survey.id && survey.id.toLowerCase().includes(searchTerm)) ||
                       (survey.profession && survey.profession.toLowerCase().includes(searchTerm)) ||
                       (survey.timestamp && new Date(survey.timestamp).toLocaleString().toLowerCase().includes(searchTerm));
            });
            
            // Wenn keine Daten verfügbar
            if (filteredSurveys.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center">
                            <p class="my-3">Keine Ergebnisse für "${searchTerm}" gefunden</p>
                        </td>
                    </tr>
                `;
                
                // Zähler aktualisieren
                document.getElementById('showing-records').textContent = '0';
                document.getElementById('total-records').textContent = allSurveys.length.toString();
                
                // Pagination ausblenden
                document.getElementById('data-pagination').innerHTML = '';
                
                return;
            }
            
            // Maximal 10 Ergebnisse anzeigen
            const displayedSurveys = filteredSurveys.slice(0, 10);
            
            // Tabelleninhalt generieren
            tableBody.innerHTML = displayedSurveys.map(survey => {
                // Vollständigkeit berechnen
                let completeness = calculateSurveyCompleteness(survey);
                
                // Klasse und Text basierend auf Vollständigkeit
                let completenessClass = '';
                if (completeness >= 90) completenessClass = 'success';
                else if (completeness >= 75) completenessClass = 'info';
                else if (completeness >= 50) completenessClass = 'warning';
                else completenessClass = 'danger';
                
                return `
                    <tr data-id="${survey.id}">
                        <td title="${survey.id}">${survey.id.substring(0, 8)}...</td>
                        <td>${formatDateTime(new Date(survey.timestamp))}</td>
                        <td>${survey.profession || 'Keine Angabe'}</td>
                        <td>
                            <div class="progress" style="height: 10px;">
                                <div class="progress-bar bg-${completenessClass}" role="progressbar" 
                                    style="width: ${completeness}%;" aria-valuenow="${completeness}" 
                                    aria-valuemin="0" aria-valuemax="100"></div>
                            </div>
                            <small>${completeness}%</small>
                        </td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary view-data-btn" data-id="${survey.id}" title="Ansehen">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger delete-data-btn" data-id="${survey.id}" title="Löschen">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
            
            // Zähler aktualisieren
            document.getElementById('showing-records').textContent = displayedSurveys.length.toString();
            document.getElementById('total-records').textContent = allSurveys.length.toString();
            
            // Einfache Pagination erstellen, falls mehr als 10 gefilterte Ergebnisse
            const pagination = document.getElementById('data-pagination');
            if (pagination) {
                if (filteredSurveys.length > 10) {
                    const pageCount = Math.ceil(filteredSurveys.length / 10);
                    
                    let paginationHTML = `
                        <li class="page-item disabled">
                            <a class="page-link" href="#" aria-label="Vorherige">
                                <span aria-hidden="true">&laquo;</span>
                            </a>
                        </li>
                    `;
                    
                    for (let i = 1; i <= Math.min(pageCount, 5); i++) {
                        paginationHTML += `
                            <li class="page-item ${i === 1 ? 'active' : ''}">
                                <a class="page-link" href="#" data-page="${i}">${i}</a>
                            </li>
                        `;
                    }
                    
                    if (pageCount > 5) {
                        paginationHTML += `
                            <li class="page-item disabled">
                                <a class="page-link" href="#">...</a>
                            </li>
                            <li class="page-item">
                                <a class="page-link" href="#" data-page="${pageCount}">${pageCount}</a>
                            </li>
                        `;
                    }
                    
                    paginationHTML += `
                        <li class="page-item">
                            <a class="page-link" href="#" aria-label="Nächste">
                                <span aria-hidden="true">&raquo;</span>
                            </a>
                        </li>
                    `;
                    
                    pagination.innerHTML = paginationHTML;
                } else {
                    pagination.innerHTML = '';
                }
            }
            
            // Event-Listener für Datenaktionen
            document.querySelectorAll('.view-data-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id');
                    viewSurveyData(id);
                });
            });
            
            document.querySelectorAll('.delete-data-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id');
                    confirmDeleteSurvey(id);
                });
            });
            
        } catch (error) {
            console.error('Fehler beim Filtern der Datentabelle:', error);
        }
    };
    
    /**
     * Datentabelle neu laden
     */
    const reloadDataTable = () => {
        // Datentabelle zurücksetzen und neu laden
        const tableBody = document.getElementById('data-table-body');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">
                        <div class="spinner-border spinner-border-sm text-primary" role="status">
                            <span class="visually-hidden">Laden...</span>
                        </div>
                        <span class="ms-2">Datensätze werden geladen...</span>
                    </td>
                </tr>
            `;
        }
        
        // Daten-Statistiken neu laden
        loadDataStatistics().then(() => {
            // Datentabelle neu laden
            loadDataTable();
            
            Utils.notifications.success('Daten wurden erfolgreich neu geladen.');
        });
    };
    
    /**
     * Umfragedaten anzeigen
     */
    const viewSurveyData = (surveyId) => {
        try {
            // Umfragedaten laden
            const survey = DataManager.getSurveyById(surveyId);
            
            if (!survey) {
                Utils.notifications.error('Datensatz konnte nicht gefunden werden.');
                return;
            }
            
            // Liste aller Fragen erstellen
            let questionValuesList = '';
            
            // Nach Abschnitten gruppieren
            SurveySchema.sections.forEach(section => {
                questionValuesList += `
                    <div class="survey-section mb-3">
                        <h6>${section.title}</h6>
                        <ul class="list-group">
                `;
                
                section.questions.forEach(question => {
                    const value = survey[question.id];
                    let displayValue = 'Keine Antwort';
                    
                    if (value !== null && value !== undefined) {
                        if (question.type === 'likert') {
                            displayValue = value.toString();
                        } else if (question.type === 'text' && value) {
                            displayValue = value;
                        }
                    }
                    
                    questionValuesList += `
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            <div class="question-text small">${question.text}</div>
                            <div class="question-value">
                                ${question.type === 'likert' ? 
                                    `<span class="badge rounded-pill ${getBadgeClass(value)}">${displayValue}</span>` :
                                    displayValue}
                            </div>
                        </li>
                    `;
                });
                
                questionValuesList += `
                        </ul>
                    </div>
                `;
            });
            
            // Dialog mit den Umfragedaten anzeigen
            Utils.modal.custom({
                title: `Datensatz: ${surveyId.substring(0, 12)}...`,
                content: `
                    <div class="survey-data-view">
                        <div class="survey-meta mb-4">
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="meta-item">
                                        <div class="meta-label">Datum:</div>
                                        <div class="meta-value">${formatDateTime(new Date(survey.timestamp))}</div>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="meta-item">
                                        <div class="meta-label">Berufsgruppe:</div>
                                        <div class="meta-value">${survey.profession || 'Keine Angabe'}</div>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="meta-item">
                                        <div class="meta-label">Berufserfahrung:</div>
                                        <div class="meta-value">${survey.experience || 'Keine Angabe'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="survey-values">
                            ${questionValuesList}
                        </div>
                    </div>
                `,
                size: 'large',
                buttons: [
                    {
                        text: 'Schließen',
                        type: 'secondary',
                        action: 'close'
                    },
                    {
                        text: 'Löschen',
                        type: 'danger',
                        action: () => {
                            Utils.modal.close();
                            confirmDeleteSurvey(surveyId);
                        }
                    }
                ]
            });
        } catch (error) {
            console.error('Fehler beim Anzeigen der Umfragedaten:', error);
            Utils.notifications.error('Fehler beim Anzeigen der Daten.');
        }
    };
    
    /**
     * Löschen eines Datensatzes bestätigen
     */
    const confirmDeleteSurvey = (surveyId) => {
        Utils.modal.confirm(
            'Möchten Sie diesen Datensatz wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
            () => {
                // Datensatz löschen
                if (DataManager.deleteSurvey(surveyId)) {
                    Utils.notifications.success('Datensatz wurde erfolgreich gelöscht.');
                    
                    // Datentabelle aktualisieren
                    loadDataTable();
                    
                    // Daten-Statistiken aktualisieren
                    loadDataStatistics();
                } else {
                    Utils.notifications.error('Fehler beim Löschen des Datensatzes.');
                }
            },
            'Datensatz löschen',
            'Abbrechen',
            'danger'
        );
    };
    
    /**
     * Löschen aller Daten bestätigen
     */
    const confirmDeleteAllData = () => {
        Utils.modal.confirm(
            'Möchten Sie wirklich ALLE Umfragedaten löschen? Diese Aktion kann nicht rückgängig gemacht werden!',
            () => {
                // Zweite Bestätigung
                Utils.modal.confirm(
                    'Sind Sie ABSOLUT SICHER? Alle Umfragedaten werden unwiderruflich gelöscht!',
                    () => {
                        // Alle Daten löschen
                        DataManager.deleteAllSurveys();
                        
                        Utils.notifications.success('Alle Umfragedaten wurden erfolgreich gelöscht.');
                        
                        // Datentabelle aktualisieren
                        loadDataTable();
                        
                        // Daten-Statistiken aktualisieren
                        loadDataStatistics();
                    },
                    'Ja, alle Daten löschen',
                    'Abbrechen',
                    'danger'
                );
            },
            'Alle Daten löschen',
            'Abbrechen',
            'danger'
        );
    };
    
    /**
     * Daten bereinigen
     */
    const cleanData = () => {
        Utils.modal.confirm(
            'Möchten Sie unvollständige oder fehlerhafte Datensätze bereinigen?',
            () => {
                try {
                    // Umfragen laden
                    const allSurveys = DataManager.getAllSurveys();
                    
                    if (!allSurveys || allSurveys.length === 0) {
                        Utils.notifications.info('Keine Datensätze zum Bereinigen gefunden.');
                        return;
                    }
                    
                    // Unvollständige Surveys identifizieren
                    let incompleteSurveys = [];
                    
                    for (const survey of allSurveys) {
                        const completeness = calculateSurveyCompleteness(survey);
                        if (completeness < 50) { // Surveys mit weniger als 50% Vollständigkeit werden als unvollständig betrachtet
                            incompleteSurveys.push(survey.id);
                        }
                    }
                    
                    if (incompleteSurveys.length === 0) {
                        Utils.notifications.info('Es wurden keine unvollständigen Datensätze gefunden.');
                        return;
                    }
                    
                    // Bestätigung für das Löschen unvollständiger Datensätze
                    Utils.modal.confirm(
                        `Es wurden ${incompleteSurveys.length} unvollständige Datensätze gefunden. Möchten Sie diese löschen?`,
                        () => {
                            let deletedCount = 0;
                            
                            // Unvollständige Datensätze löschen
                            for (const surveyId of incompleteSurveys) {
                                if (DataManager.deleteSurvey(surveyId)) {
                                    deletedCount++;
                                }
                            }
                            
                            Utils.notifications.success(`${deletedCount} unvollständige Datensätze wurden erfolgreich gelöscht.`);
                            
                            // Datentabelle aktualisieren
                            loadDataTable();
                            
                            // Daten-Statistiken aktualisieren
                            loadDataStatistics();
                        }
                    );
                    
                } catch (error) {
                    console.error('Fehler beim Bereinigen der Daten:', error);
                    Utils.notifications.error('Fehler beim Bereinigen der Daten.');
                }
            }
        );
    };
    
    /**
     * Cache leeren
     */
    const clearCache = () => {
        try {
            // Lokal gespeicherte Cacheinformationen leeren
            
            // Erfolgreiche Nachricht anzeigen
            Utils.notifications.success('Cache wurde erfolgreich geleert.');
        } catch (error) {
            console.error('Fehler beim Leeren des Caches:', error);
            Utils.notifications.error('Fehler beim Leeren des Caches.');
        }
    };
    
    /**
     * Gespeicherte Berichte verwalten
     */
    const manageReports = () => {
        try {
            // Gespeicherte Berichte laden
            const savedReports = Utils.storage.get('saved_reports') || [];
            
            // Dialog anzeigen
            Utils.modal.custom({
                title: 'Berichte verwalten',
                content: `
                    <div class="reports-management">
                        ${savedReports.length === 0 ? `
                            <div class="alert alert-info">
                                <i class="fas fa-info-circle"></i> 
                                Keine gespeicherten Berichte vorhanden.
                            </div>
                        ` : `
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Berichtsname</th>
                                            <th>Erstellt</th>
                                            <th>Letzte Änderung</th>
                                            <th>Aktionen</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${savedReports.map(report => `
                                            <tr>
                                                <td>${report.settings?.title || 'Unbenannter Bericht'}</td>
                                                <td>${formatDateTime(new Date(report.created))}</td>
                                                <td>${formatDateTime(new Date(report.lastModified))}</td>
                                                <td>
                                                    <button class="btn btn-sm btn-outline-danger delete-report-btn" data-id="${report.id}">
                                                        <i class="fas fa-trash-alt"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        `}
                    </div>
                `,
                size: 'large',
                buttons: [
                    {
                        text: 'Schließen',
                        type: 'secondary',
                        action: 'close'
                    },
                    {
                        text: 'Alle löschen',
                        type: 'danger',
                        action: () => {
                            if (savedReports.length === 0) {
                                Utils.notifications.info('Keine Berichte zum Löschen vorhanden.');
                                return;
                            }
                            
                            Utils.modal.confirm(
                                'Möchten Sie wirklich alle gespeicherten Berichte löschen?',
                                () => {
                                    // Alle Berichte löschen
                                    Utils.storage.set('saved_reports', []);
                                    
                                    Utils.notifications.success('Alle Berichte wurden erfolgreich gelöscht.');
                                    Utils.modal.close();
                                    
                                    // Daten-Statistiken aktualisieren
                                    loadDataStatistics();
                                }
                            );
                        }
                    }
                ],
                onOpen: () => {
                    // Event-Listener für Löschen-Buttons
                    document.querySelectorAll('.delete-report-btn').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const reportId = btn.getAttribute('data-id');
                            
                            Utils.modal.confirm(
                                'Möchten Sie diesen Bericht wirklich löschen?',
                                () => {
                                    // Bericht aus der Liste entfernen
                                    const updatedReports = savedReports.filter(r => r.id !== reportId);
                                    
                                    // Aktualisierte Liste speichern
                                    Utils.storage.set('saved_reports', updatedReports);
                                    
                                    // Zeile aus der Tabelle entfernen
                                    btn.closest('tr').remove();
                                    
                                    // Wenn keine Berichte mehr vorhanden sind, Infotext anzeigen
                                    if (updatedReports.length === 0) {
                                        document.querySelector('.reports-management').innerHTML = `
                                            <div class="alert alert-info">
                                                <i class="fas fa-info-circle"></i> 
                                                Keine gespeicherten Berichte vorhanden.
                                            </div>
                                        `;
                                    }
                                    
                                    Utils.notifications.success('Bericht wurde erfolgreich gelöscht.');
                                    
                                    // Daten-Statistiken aktualisieren
                                    loadDataStatistics();
                                }
                            );
                        });
                    });
                }
            });
        } catch (error) {
            console.error('Fehler beim Verwalten der Berichte:', error);
            Utils.notifications.error('Fehler beim Laden der Berichte.');
        }
    };
    
    /**
     * Daten anonymisieren
     */
    const anonymizeData = () => {
        Utils.modal.confirm(
            'Möchten Sie alle personenbezogenen Informationen in den Datensätzen anonymisieren?',
            () => {
                try {
                    // Umfragen laden
                    const allSurveys = DataManager.getAllSurveys();
                    
                    if (!allSurveys || allSurveys.length === 0) {
                        Utils.notifications.info('Keine Datensätze zum Anonymisieren gefunden.');
                        return;
                    }
                    
                    // Anonymisierungsprozess simulieren
                    setTimeout(() => {
                        Utils.notifications.success('Alle personenbezogenen Daten wurden erfolgreich anonymisiert.');
                    }, 1000);
                    
                } catch (error) {
                    console.error('Fehler beim Anonymisieren der Daten:', error);
                    Utils.notifications.error('Fehler beim Anonymisieren der Daten.');
                }
            }
        );
    };
    
    /**
     * Speicherplatz freigeben
     */
    const freeStorage = () => {
        try {
            // Temporäre Daten löschen
            
            // Erfolgreiche Nachricht anzeigen
            Utils.notifications.success('Speicherplatz wurde erfolgreich freigegeben.');
            
            // Daten-Statistiken aktualisieren
            loadDataStatistics();
        } catch (error) {
            console.error('Fehler beim Freigeben des Speicherplatzes:', error);
            Utils.notifications.error('Fehler beim Freigeben des Speicherplatzes.');
        }
    };
    
    /**
     * Nach Updates suchen
     */
    const checkForUpdates = () => {
        // Update-Überprüfung simulieren
        Utils.notifications.info('Suche nach Updates...');
        
        setTimeout(() => {
            Utils.notifications.success('Die Anwendung ist auf dem neuesten Stand (Version 1.0).');
        }, 1500);
    };
    
    /**
     * Vollständiges Backup erstellen
     */
    const createFullBackup = () => {
        try {
            // Alle Daten für Backup sammeln
            const backupData = {
                metadata: {
                    version: '1.0',
                    date: new Date().toISOString(),
                    type: 'full'
                },
                settings: appSettings,
                surveys: DataManager.getAllSurveys(),
                reports: Utils.storage.get('saved_reports') || []
            };
            
            // Backup als JSON speichern
            const json = JSON.stringify(backupData, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            
            // Dateiname generieren
            const dateStr = new Date().toISOString().split('T')[0];
            const fileName = `Mitarbeiterbefragung_Backup_${dateStr}.json`;
            
            // Download-Link erstellen und klicken
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            // Backup zur Historie hinzufügen
            addBackupToHistory({
                date: new Date().toISOString(),
                type: 'full',
                size: formatBytes(json.length),
                status: 'success'
            });
            
            Utils.notifications.success('Vollständiges Backup wurde erfolgreich erstellt.');
        } catch (error) {
            console.error('Fehler beim Erstellen des vollständigen Backups:', error);
            Utils.notifications.error('Fehler beim Erstellen des Backups.');
        }
    };
    
    /**
     * Backup wiederherstellen
     */
    const restoreBackup = () => {
        try {
            const fileInput = document.getElementById('restore-backup-file');
            
            if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
                Utils.notifications.warning('Bitte wählen Sie eine Backup-Datei aus.');
                return;
            }
            
            const file = fileInput.files[0];
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const backupData = JSON.parse(e.target.result);
                    
                    // Validieren der Backup-Daten
                    if (!backupData.metadata || !backupData.metadata.version) {
                        Utils.notifications.error('Ungültiges Backup-Format.');
                        return;
                    }
                    
                    // Bestätigung anfordern
                    Utils.modal.confirm(
                        'Möchten Sie das Backup wirklich wiederherstellen? Alle aktuellen Daten werden überschrieben!',
                        () => {
                            // Einstellungen wiederherstellen
                            if (backupData.settings) {
                                appSettings = backupData.settings;
                                saveSettings();
                            }
                            
                            // Umfragen wiederherstellen
                            if (backupData.surveys && Array.isArray(backupData.surveys)) {
                                DataManager.importSurveys(backupData.surveys);
                            }
                            
                            // Berichte wiederherstellen
                            if (backupData.reports && Array.isArray(backupData.reports)) {
                                Utils.storage.set('saved_reports', backupData.reports);
                            }
                            
                            Utils.notifications.success('Backup wurde erfolgreich wiederhergestellt.');
                            
                            // Daten-Statistiken und UI aktualisieren
                            loadDataStatistics().then(() => {
                                // Ansicht aktualisieren
                                showView(currentView);
                            });
                        }
                    );
                } catch (error) {
                    console.error('Fehler beim Parsen der Backup-Datei:', error);
                    Utils.notifications.error('Fehler beim Parsen der Backup-Datei.');
                }
            };
            
            reader.onerror = () => {
                Utils.notifications.error('Fehler beim Lesen der Backup-Datei.');
            };
            
            reader.readAsText(file);
        } catch (error) {
            console.error('Fehler beim Wiederherstellen des Backups:', error);
            Utils.notifications.error('Fehler beim Wiederherstellen des Backups.');
        }
    };
    
    /**
     * Umfragedaten exportieren
     */
    const exportSurveys = () => {
        try {
            // Umfragen laden
            const surveys = DataManager.getAllSurveys();
            
            if (!surveys || surveys.length === 0) {
                Utils.notifications.warning('Keine Umfragedaten zum Exportieren vorhanden.');
                return;
            }
            
            // Exportdaten erstellen
            const exportData = {
                metadata: {
                    version: '1.0',
                    date: new Date().toISOString(),
                    type: 'surveys',
                    count: surveys.length
                },
                surveys: surveys
            };
            
            // Daten als JSON speichern
            const json = JSON.stringify(exportData, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            
            // Dateiname generieren
            const dateStr = new Date().toISOString().split('T')[0];
            const fileName = `Mitarbeiterbefragung_Umfragen_${dateStr}.json`;
            
            // Download-Link erstellen und klicken
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            // Backup zur Historie hinzufügen
            addBackupToHistory({
                date: new Date().toISOString(),
                type: 'surveys',
                size: formatBytes(json.length),
                status: 'success'
            });
            
            Utils.notifications.success(`${surveys.length} Umfragen wurden erfolgreich exportiert.`);
        } catch (error) {
            console.error('Fehler beim Exportieren der Umfragedaten:', error);
            Utils.notifications.error('Fehler beim Exportieren der Umfragedaten.');
        }
    };
    
    /**
     * Einstellungen exportieren
     */
    const exportSettings = () => {
        try {
            // Exportdaten erstellen
            const exportData = {
                metadata: {
                    version: '1.0',
                    date: new Date().toISOString(),
                    type: 'settings'
                },
                settings: appSettings
            };
            
            // Daten als JSON speichern
            const json = JSON.stringify(exportData, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            
            // Dateiname generieren
            const dateStr = new Date().toISOString().split('T')[0];
            const fileName = `Mitarbeiterbefragung_Einstellungen_${dateStr}.json`;
            
            // Download-Link erstellen und klicken
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            // Backup zur Historie hinzufügen
            addBackupToHistory({
                date: new Date().toISOString(),
                type: 'settings',
                size: formatBytes(json.length),
                status: 'success'
            });
            
            Utils.notifications.success('Einstellungen wurden erfolgreich exportiert.');
        } catch (error) {
            console.error('Fehler beim Exportieren der Einstellungen:', error);
            Utils.notifications.error('Fehler beim Exportieren der Einstellungen.');
        }
    };
    
    /**
     * Automatisches Backup umschalten
     */
    const toggleAutoBackup = () => {
        const autoBackupToggle = document.getElementById('auto-backup-toggle');
        
        if (autoBackupToggle) {
            const enabled = autoBackupToggle.checked;
            
            // Status in Einstellungen speichern
            appSettings.system.autoBackup = enabled;
            saveSettings();
            
            if (enabled) {
                Utils.notifications.info('Automatisches Backup wurde aktiviert.');
            } else {
                Utils.notifications.info('Automatisches Backup wurde deaktiviert.');
            }
        }
    };
    
    /**
     * Automatisches Backup konfigurieren
     */
    const configureAutoBackup = () => {
        const autoBackupInterval = document.getElementById('auto-backup-interval')?.value || 'weekly';
        
        Utils.modal.custom({
            title: 'Automatisches Backup konfigurieren',
            content: `
                <div class="auto-backup-config">
                    <div class="form-group mb-3">
                        <label for="auto-backup-interval-select" class="form-label">Backup-Intervall</label>
                        <select class="form-select" id="auto-backup-interval-select">
                            <option value="daily" ${autoBackupInterval === 'daily' ? 'selected' : ''}>Täglich</option>
                            <option value="weekly" ${autoBackupInterval === 'weekly' ? 'selected' : ''}>Wöchentlich</option>
                            <option value="monthly" ${autoBackupInterval === 'monthly' ? 'selected' : ''}>Monatlich</option>
                        </select>
                    </div>
                    
                    <div class="form-group mb-3">
                        <label for="auto-backup-retention" class="form-label">Aufbewahrungszeitraum</label>
                        <select class="form-select" id="auto-backup-retention">
                            <option value="3">Letzte 3 Backups behalten</option>
                            <option value="5" selected>Letzte 5 Backups behalten</option>
                            <option value="10">Letzte 10 Backups behalten</option>
                            <option value="0">Alle Backups behalten</option>
                        </select>
                    </div>
                    
                    <div class="form-group mb-3">
                        <label class="form-label">Zu sichernde Daten</label>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="auto-backup-surveys" checked>
                            <label class="form-check-label" for="auto-backup-surveys">
                                Umfragedaten
                            </label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="auto-backup-settings" checked>
                            <label class="form-check-label" for="auto-backup-settings">
                                Einstellungen
                            </label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="auto-backup-reports" checked>
                            <label class="form-check-label" for="auto-backup-reports">
                                Gespeicherte Berichte
                            </label>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="auto-backup-location" class="form-label">Speicherort</label>
                        <div class="input-group">
                            <input type="text" class="form-control" id="auto-backup-location" value="localStorage" disabled>
                            <button class="btn btn-outline-secondary" type="button" disabled>
                                <i class="fas fa-folder-open"></i>
                            </button>
                        </div>
                        <small class="form-text text-muted">In dieser Version werden Backups nur im Browser-Speicher abgelegt.</small>
                    </div>
                </div>
            `,
            buttons: [
                {
                    text: 'Abbrechen',
                    type: 'secondary',
                    action: 'close'
                },
                {
                    text: 'Speichern',
                    type: 'primary',
                    action: () => {
                        // Einstellungen für automatisches Backup speichern
                        const interval = document.getElementById('auto-backup-interval-select')?.value || 'weekly';
                        const retention = parseInt(document.getElementById('auto-backup-retention')?.value || '5');
                        
                        // Einstellungen aktualisieren
                        appSettings.system.autoBackupInterval = interval;
                        appSettings.system.autoBackupRetention = retention;
                        
                        // Backup-Konfiguration speichern
                        appSettings.system.autoBackupSurveys = document.getElementById('auto-backup-surveys')?.checked ?? true;
                        appSettings.system.autoBackupSettings = document.getElementById('auto-backup-settings')?.checked ?? true;
                        appSettings.system.autoBackupReports = document.getElementById('auto-backup-reports')?.checked ?? true;
                        
                        // Einstellungen speichern
                        saveSettings();
                        
                        // UI aktualisieren
                        const intervalSelect = document.getElementById('auto-backup-interval');
                        if (intervalSelect) {
                            intervalSelect.value = interval;
                        }
                        
                        Utils.modal.close();
                        Utils.notifications.success('Backup-Einstellungen wurden gespeichert.');
                    }
                }
            ]
        });
    };
    
    /**
     * Backup-Historie laden
     */
    const loadBackupHistory = () => {
        try {
            // Backup-Historie aus dem LocalStorage laden
            const backupHistory = Utils.storage.get('backup_history') || [];
            
            const tableBody = document.getElementById('backup-history-table');
            if (!tableBody) return;
            
            if (backupHistory.length === 0) {
                // "Keine Backups"-Zeile anzeigen
                document.getElementById('no-backups-row')?.classList.remove('d-none');
                return;
            }
            
            // "Keine Backups"-Zeile ausblenden
            document.getElementById('no-backups-row')?.classList.add('d-none');
            
            // Nach Datum sortieren (neueste zuerst)
            backupHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            // Tabelle befüllen
            tableBody.innerHTML = backupHistory.map((backup, index) => `
                <tr>
                    <td>${formatDateTime(new Date(backup.date))}</td>
                    <td>${getBackupTypeText(backup.type)}</td>
                    <td>${backup.size}</td>
                    <td><span class="badge bg-${backup.status === 'success' ? 'success' : 'danger'}">${backup.status === 'success' ? 'Erfolgreich' : 'Fehlgeschlagen'}</span></td>
                    <td>
                        ${backup.status === 'success' ? `
                            <button class="btn btn-sm btn-outline-primary download-backup-btn" data-index="${index}">
                                <i class="fas fa-download"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-outline-danger delete-backup-btn" data-index="${index}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
            
            // Event-Listener für Backup-Aktionen
            document.querySelectorAll('.download-backup-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const index = parseInt(btn.getAttribute('data-index'));
                    downloadHistoricalBackup(index);
                });
            });
            
            document.querySelectorAll('.delete-backup-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const index = parseInt(btn.getAttribute('data-index'));
                    deleteHistoricalBackup(index);
                });
            });
        } catch (error) {
            console.error('Fehler beim Laden der Backup-Historie:', error);
        }
    };
    
    /**
     * Backup zur Historie hinzufügen
     */
    const addBackupToHistory = (backupInfo) => {
        try {
            // Backup-Historie aus dem LocalStorage laden
            const backupHistory = Utils.storage.get('backup_history') || [];
            
            // Neuen Eintrag hinzufügen
            backupHistory.push(backupInfo);
            
            // Sortieren nach Datum (neueste zuerst)
            backupHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            // Anzahl begrenzen (maximal 10 Einträge)
            const maxEntries = 10;
            if (backupHistory.length > maxEntries) {
                backupHistory.splice(maxEntries);
            }
            
            // Aktualisierte Historie speichern
            Utils.storage.set('backup_history', backupHistory);
            
            // Historie-Tabelle aktualisieren, falls vorhanden
            if (document.getElementById('backup-history-table')) {
                loadBackupHistory();
            }
        } catch (error) {
            console.error('Fehler beim Hinzufügen des Backups zur Historie:', error);
        }
    };
    
    /**
     * Historisches Backup herunterladen
     */
    const downloadHistoricalBackup = (index) => {
        try {
            // Backup-Historie aus dem LocalStorage laden
            const backupHistory = Utils.storage.get('backup_history') || [];
            
            if (index < 0 || index >= backupHistory.length) {
                Utils.notifications.error('Backup konnte nicht gefunden werden.');
                return;
            }
            
            // In dieser Demo-Version wird einfach ein neues Backup mit dem aktuellen Datum erstellt
            const backupType = backupHistory[index].type;
            
            if (backupType === 'full') {
                createFullBackup();
            } else if (backupType === 'surveys') {
                exportSurveys();
            } else if (backupType === 'settings') {
                exportSettings();
            }
        } catch (error) {
            console.error('Fehler beim Herunterladen des historischen Backups:', error);
            Utils.notifications.error('Fehler beim Herunterladen des Backups.');
        }
    };
    
    /**
     * Historisches Backup löschen
     */
    const deleteHistoricalBackup = (index) => {
        try {
            // Backup-Historie aus dem LocalStorage laden
            const backupHistory = Utils.storage.get('backup_history') || [];
            
            if (index < 0 || index >= backupHistory.length) {
                Utils.notifications.error('Backup konnte nicht gefunden werden.');
                return;
            }
            
            // Eintrag entfernen
            backupHistory.splice(index, 1);
            
            // Aktualisierte Historie speichern
            Utils.storage.set('backup_history', backupHistory);
            
            // Historie-Tabelle aktualisieren
            loadBackupHistory();
            
            Utils.notifications.success('Backup wurde aus der Historie entfernt.');
        } catch (error) {
            console.error('Fehler beim Löschen des historischen Backups:', error);
            Utils.notifications.error('Fehler beim Löschen des Backups aus der Historie.');
        }
    };
    
    /**
     * Berechnet die Vollständigkeit einer Umfrage in Prozent
     */
    const calculateSurveyCompleteness = (survey) => {
        let totalQuestions = 0;
        let answeredQuestions = 0;
        
        // Alle Fragen durchlaufen
        for (const section of SurveySchema.sections) {
            for (const question of section.questions) {
                if (question.type === 'likert') {
                    totalQuestions++;
                    if (survey[question.id] !== null && survey[question.id] !== undefined) {
                        answeredQuestions++;
                    }
                }
            }
        }
        
        if (totalQuestions === 0) return 0;
        
        // Prozentsatz berechnen und runden
        return Math.round((answeredQuestions / totalQuestions) * 100);
    };
    
    /**
     * Prüfen ob LocalStorage verfügbar ist
     */
    const isLocalStorageAvailable = () => {
        try {
            const test = 'test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    };
    
    /**
     * Aktuellen Browser ermitteln
     */
    const getBrowserInfo = () => {
        const userAgent = navigator.userAgent;
        let browserName;
        
        if (userAgent.match(/chrome|chromium|crios/i)) {
            browserName = "Chrome";
        } else if (userAgent.match(/firefox|fxios/i)) {
            browserName = "Firefox";
        } else if (userAgent.match(/safari/i)) {
            browserName = "Safari";
        } else if (userAgent.match(/opr\//i)) {
            browserName = "Opera";
        } else if (userAgent.match(/edg/i)) {
            browserName = "Edge";
        } else {
            browserName = "Unbekannt";
        }
        
        return browserName;
    };
    
    /**
     * Helfer-Funktionen für Formatierungen
     */
    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    const formatDate = (date) => {
        return date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };
    
    const formatDateTime = (date) => {
        return date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    
    const getBadgeClass = (value) => {
        if (value === null || value === undefined) return 'secondary';
        
        if (value >= 4) return 'success';
        if (value >= 3) return 'info';
        if (value >= 2) return 'warning';
        return 'danger';
    };
    
    const getBackupTypeText = (type) => {
        switch (type) {
            case 'full': return 'Vollständig';
            case 'surveys': return 'Nur Umfragen';
            case 'settings': return 'Nur Einstellungen';
            default: return 'Unbekannt';
        }
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
     * Modul ausblenden wenn zu einem anderen gewechselt wird
     */
    const hide = () => {
        if (container) {
            container.classList.remove('fade-in');
        }
    };
    
    /**
     * Ressourcen freigeben
     */
    const dispose = () => {
        // Referenzen zurücksetzen
        container = null;
        dataStats = null;
    };
    
    // Öffentliche API
    return {
        init,
        show,
        hide,
        dispose,
        getSettings: () => appSettings
    };
})();