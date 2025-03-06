/**
 * data-manager.js
 * Zentrale Datenverwaltung für die Mitarbeiterbefragung der Klinik für Radiologie und Nuklearmedizin
 * Stellt CRUD-Operationen und LocalStorage-Integration bereit
 */

const DataManager = (() => {
    // Konstanten
    const STORAGE_KEY = 'mitarbeiterbefragung_data';
    const AUTOSAVE_INTERVAL = 30000; // 30 Sekunden
    
    // Hauptdatenstruktur
    let state = {
        surveys: [],        // Array mit Fragebogendaten
        lastModified: null, // Zeitstempel der letzten Änderung
        appSettings: {      // Anwendungseinstellungen
            charts: {
                colorScheme: 'default',
                animationSpeed: 'medium',
                showLegend: true
            },
            analysis: {
                significanceLevel: 0.05,
                excludeIncomplete: false,
                minimumResponses: 3
            },
            notifications: {
                autosaveEnabled: true,
                showSuccessMessages: true,
                notificationDuration: 5000
            },
            ui: {
                darkMode: false,
                compactView: false,
                tableRowsPerPage: 10
            }
        },
        metadata: {
            version: '1.0.0',
            created: new Date().toISOString(),
            totalEntries: 0,
            lastBackup: null,
            projectName: 'Mitarbeiterbefragung 2025',
            projectDescription: 'Klinik für Radiologie und Nuklearmedizin'
        }
    };
    
    // Autosave-Timer
    let autosaveTimer = null;
    
    // Event-Listener
    const listeners = {
        dataChanged: [],
        surveyAdded: [],
        surveyUpdated: [],
        surveyDeleted: [],
        dataImported: [],
        settingsChanged: []
    };

    /**
     * Daten in LocalStorage speichern
     */
    const saveToLocalStorage = () => {
        try {
            state.lastModified = new Date().toISOString();
            Utils.storage.set(STORAGE_KEY, state);
            return true;
        } catch (error) {
            console.error('Fehler beim Speichern der Daten:', error);
            return false;
        }
    };
    
    /**
     * Daten aus LocalStorage laden
     */
    const loadFromLocalStorage = () => {
        try {
            const savedData = Utils.storage.get(STORAGE_KEY);
            if (savedData) {
                // Datenstruktur validieren und alte Versionen migrieren
                if (savedData.surveys && Array.isArray(savedData.surveys)) {
                    state = {
                        ...state,
                        ...savedData,
                        // Stelle sicher, dass neue Einstellungen nicht überschrieben werden
                        appSettings: {
                            ...state.appSettings,
                            ...(savedData.appSettings || {})
                        },
                        metadata: {
                            ...state.metadata,
                            ...(savedData.metadata || {})
                        }
                    };
                    
                    state.metadata.totalEntries = state.surveys.length;
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Fehler beim Laden der Daten:', error);
            return false;
        }
    };
    
    /**
     * Autosave starten/stoppen
     */
    const toggleAutosave = (enable = true) => {
        // Timer stoppen falls vorhanden
        if (autosaveTimer) {
            clearInterval(autosaveTimer);
            autosaveTimer = null;
        }
        
        // Nur neu starten wenn aktiviert
        if (enable) {
            autosaveTimer = setInterval(() => {
                if (state.appSettings.notifications.autosaveEnabled) {
                    const success = saveToLocalStorage();
                    if (success) {
                        console.debug('Automatische Speicherung erfolgreich');
                    }
                }
            }, AUTOSAVE_INTERVAL);
        }
        
        state.appSettings.notifications.autosaveEnabled = enable;
        notifyListeners('settingsChanged', { setting: 'autosaveEnabled', value: enable });
    };
    
    /**
     * Benachrichtigt alle Listener eines Event-Typs
     */
    const notifyListeners = (eventType, data) => {
        if (!listeners[eventType]) return;
        
        listeners[eventType].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Fehler beim Ausführen des ${eventType}-Listeners:`, error);
            }
        });
    };
    
    /**
     * Validiert einen Fragebogeneintrag
     */
    const validateSurvey = (surveyData) => {
        if (!surveyData || typeof surveyData !== 'object') {
            return { valid: false, errors: ['Ungültiges Datenformat.'] };
        }
        
        // ID prüfen
        if (!surveyData.id) {
            surveyData.id = `survey_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        }
        
        // Timestamp prüfen
        if (!surveyData.timestamp) {
            surveyData.timestamp = new Date().toISOString();
        }
        
        // Fragebogendaten und Struktur prüfen
        const errors = [];
        
        if (!SurveySchema.validators.isValidSurveyData(surveyData)) {
            errors.push('Fragebogendaten entsprechen nicht dem erwarteten Schema.');
        }
        
        // Bei demografischen Daten prüfen ob gültige Werte
        if (surveyData.profession && !SurveySchema.demographicOptions.profession.some(p => p.id === surveyData.profession)) {
            errors.push('Ungültige Berufsgruppe.');
        }
        
        if (surveyData.experience && !SurveySchema.demographicOptions.experience.some(e => e.id === surveyData.experience)) {
            errors.push('Ungültige Berufserfahrung.');
        }
        
        if (surveyData.tenure && !SurveySchema.demographicOptions.tenure.some(t => t.id === surveyData.tenure)) {
            errors.push('Ungültige Zugehörigkeitsdauer.');
        }
        
        return { 
            valid: errors.length === 0, 
            errors,
            data: surveyData // Ggf. ergänzte Daten zurückgeben
        };
    };
    
    /**
     * Initialisiert den DataManager
     */
    const init = () => {
        // Versuche Daten aus dem LocalStorage zu laden
        const success = loadFromLocalStorage();
        
        // Starte automatische Speicherung
        toggleAutosave(state.appSettings.notifications.autosaveEnabled);
        
        return success;
    };
    
    // Public API für CRUD-Operationen
    
    /**
     * Alle Fragebogendaten abrufen
     */
    const getAllSurveys = () => {
        return [...state.surveys];
    };
    
    /**
     * Einzelnen Fragebogen nach ID abrufen
     */
    const getSurveyById = (id) => {
        return state.surveys.find(survey => survey.id === id) || null;
    };
    
    /**
     * Neuen Fragebogen hinzufügen
     */
    const addSurvey = (surveyData) => {
        const { valid, errors, data } = validateSurvey(surveyData);
        
        if (!valid) {
            return { success: false, errors };
        }
        
        // Prüfe ob ID bereits existiert
        const existingIndex = state.surveys.findIndex(s => s.id === data.id);
        if (existingIndex !== -1) {
            return { 
                success: false, 
                errors: ['Ein Fragebogen mit dieser ID existiert bereits.']
            };
        }
        
        // Füge neuen Fragebogen hinzu
        state.surveys.push(data);
        state.metadata.totalEntries = state.surveys.length;
        
        // Speichern und Benachrichtigen
        saveToLocalStorage();
        notifyListeners('dataChanged', { action: 'add', data });
        notifyListeners('surveyAdded', data);
        
        return { success: true, data };
    };
    
    /**
     * Fragebogen aktualisieren
     */
    const updateSurvey = (id, surveyData) => {
        // Finde Fragebogen im Datenbestand
        const index = state.surveys.findIndex(survey => survey.id === id);
        if (index === -1) {
            return { 
                success: false, 
                errors: [`Fragebogen mit ID ${id} nicht gefunden.`]
            };
        }
        
        // Neue Daten mit vorhandenen zusammenführen
        const updatedSurvey = {
            ...state.surveys[index],
            ...surveyData,
            id // ID darf nicht geändert werden
        };
        
        // Validieren
        const { valid, errors, data } = validateSurvey(updatedSurvey);
        if (!valid) {
            return { success: false, errors };
        }
        
        // Aktualisieren
        state.surveys[index] = data;
        
        // Speichern und Benachrichtigen
        saveToLocalStorage();
        notifyListeners('dataChanged', { action: 'update', data });
        notifyListeners('surveyUpdated', data);
        
        return { success: true, data };
    };
    
    /**
     * Fragebogen löschen
     */
    const deleteSurvey = (id) => {
        const index = state.surveys.findIndex(survey => survey.id === id);
        if (index === -1) {
            return { 
                success: false, 
                errors: [`Fragebogen mit ID ${id} nicht gefunden.`]
            };
        }
        
        // Lösche aus dem Array
        const deletedSurvey = state.surveys[index];
        state.surveys.splice(index, 1);
        state.metadata.totalEntries = state.surveys.length;
        
        // Speichern und Benachrichtigen
        saveToLocalStorage();
        notifyListeners('dataChanged', { action: 'delete', data: deletedSurvey });
        notifyListeners('surveyDeleted', id);
        
        return { success: true, data: deletedSurvey };
    };
    
    /**
     * Alle Daten löschen
     */
    const clearAllData = () => {
        const previousData = [...state.surveys];
        
        // Zurücksetzen auf leeren Zustand, aber Einstellungen behalten
        state.surveys = [];
        state.lastModified = new Date().toISOString();
        state.metadata.totalEntries = 0;
        
        // Speichern und Benachrichtigen
        saveToLocalStorage();
        notifyListeners('dataChanged', { action: 'clear', previousData });
        
        return { success: true };
    };
    
    /**
     * Mehrere Fragebögen auf einmal importieren
     * Mit Duplikatsprüfung und Validierung
     */
    const importSurveys = (surveysArray, options = { overwriteExisting: false }) => {
        if (!Array.isArray(surveysArray) || surveysArray.length === 0) {
            return { 
                success: false, 
                errors: ['Keine gültigen Daten zum Importieren vorhanden.'],
                imported: 0
            };
        }
        
        const results = {
            success: true,
            imported: 0,
            skipped: 0,
            invalid: 0,
            overwritten: 0,
            errors: []
        };
        
        // Verarbeite jeden Fragebogen
        surveysArray.forEach(surveyData => {
            const { valid, errors, data } = validateSurvey(surveyData);
            
            if (!valid) {
                results.invalid++;
                results.errors.push(`Ungültiger Datensatz: ${errors.join(', ')}`);
                return;
            }
            
            // Prüfe ob bereits vorhanden
            const existingIndex = state.surveys.findIndex(s => s.id === data.id);
            
            if (existingIndex !== -1) {
                if (options.overwriteExisting) {
                    // Vorhandenen überschreiben
                    state.surveys[existingIndex] = data;
                    results.overwritten++;
                    results.imported++;
                } else {
                    // Überspringen
                    results.skipped++;
                }
            } else {
                // Neu hinzufügen
                state.surveys.push(data);
                results.imported++;
            }
        });
        
        // Nur als erfolgreich markieren wenn mindestens ein Datensatz importiert wurde
        if (results.imported === 0) {
            results.success = false;
            results.errors.push('Keine Datensätze importiert.');
        } else {
            // Aktualisiere Metadaten
            state.metadata.totalEntries = state.surveys.length;
            state.lastModified = new Date().toISOString();
            
            // Speichern und Benachrichtigen
            saveToLocalStorage();
            notifyListeners('dataChanged', { action: 'import', count: results.imported });
            notifyListeners('dataImported', results);
        }
        
        return results;
    };
    
    /**
     * CSV-Daten importieren
     */
    const importFromCSV = (csvString, options = { hasHeader: true, overwriteExisting: false }) => {
        try {
            // CSV parsen mit PapaParse (wird in späteren Schritten eingebunden)
            // Hier nutzen wir eine lokale Hilfsfunktion für den Fall, dass die Bibliothek noch nicht geladen ist
            let parsedData;
            
            if (typeof Papa !== 'undefined') {
                // PapaParse ist geladen
                parsedData = Papa.parse(csvString, {
                    header: options.hasHeader,
                    skipEmptyLines: true,
                    dynamicTyping: true
                }).data;
            } else {
                // Einfacher Fallback-Parser für Basiskompatibilität
                parsedData = parseCSVFallback(csvString, options.hasHeader);
            }
            
            if (!parsedData || parsedData.length === 0) {
                return {
                    success: false,
                    errors: ['Keine gültigen Daten in der CSV-Datei gefunden.'],
                    imported: 0
                };
            }
            
            // Konvertiere CSV-Zeilen zu Fragebogendaten
            const header = options.hasHeader ? parsedData[0] : SurveySchema.csvHelpers.getCSVHeader();
            const surveys = options.hasHeader ? parsedData.slice(1) : parsedData;
            
            const surveyObjects = surveys.map(row => {
                if (options.hasHeader) {
                    // Bei Header sind die Daten bereits im Objektformat
                    return row;
                } else {
                    // Ansonsten konvertieren wir die Zeile zu einem Objekt
                    return SurveySchema.csvHelpers.csvRowToObject(row, header);
                }
            }).filter(Boolean); // Entferne null/undefined
            
            // Importiere die konvertierten Objekte
            return importSurveys(surveyObjects, { overwriteExisting: options.overwriteExisting });
            
        } catch (error) {
            console.error('Fehler beim CSV-Import:', error);
            return {
                success: false,
                errors: [`Fehler beim Parsen der CSV-Datei: ${error.message}`],
                imported: 0
            };
        }
    };
    
    /**
     * Einfacher CSV-Parser als Fallback für Basiskompatibilität
     */
    const parseCSVFallback = (csvString, hasHeader) => {
        if (!csvString) return [];
        
        // Zeilen aufteilen
        const lines = csvString.split(/\r\n|\n|\r/);
        if (lines.length === 0) return [];
        
        const result = [];
        
        // Header extrahieren
        const header = hasHeader ? lines[0].split(',').map(h => h.trim()) : null;
        
        // Zeilen verarbeiten
        const startIndex = hasHeader ? 1 : 0;
        
        for (let i = startIndex; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            
            // Zeile in Felder aufteilen (einfache Implementierung ohne Berücksichtigung von Anführungszeichen)
            const fields = lines[i].split(',').map(f => f.trim());
            
            if (hasHeader) {
                // Objekt erstellen
                const obj = {};
                header.forEach((key, index) => {
                    if (index < fields.length) {
                        // Versuche Zahlen zu konvertieren
                        const value = fields[index];
                        if (!isNaN(value) && value !== '') {
                            obj[key] = parseFloat(value);
                        } else {
                            obj[key] = value;
                        }
                    }
                });
                result.push(obj);
            } else {
                // Array behalten
                result.push(fields);
            }
        }
        
        return result;
    };
    
    /**
     * Exportiert alle Fragebogendaten als CSV
     */
    const exportToCSV = (options = {}) => {
        try {
            if (state.surveys.length === 0) {
                return { success: false, errors: ['Keine Daten zum Exportieren vorhanden.'] };
            }
            
            // CSV-Header
            const header = SurveySchema.csvHelpers.getCSVHeader();
            
            // Zeilen generieren
            const rows = state.surveys.map(survey => 
                SurveySchema.csvHelpers.objectToCSVRow(survey, header)
            );
            
            // CSV-String bauen
            let csvContent;
            
            if (typeof Papa !== 'undefined') {
                // PapaParse verwenden wenn verfügbar
                csvContent = Papa.unparse({
                    fields: header,
                    data: rows
                });
            } else {
                // Einfacher Fallback
                csvContent = [
                    header.join(','),
                    ...rows.map(row => row.map(cell => {
                        // Behandle spezialzeichen und anführungszeichen
                        if (cell === null || cell === undefined) return '';
                        const str = String(cell);
                        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                            return `"${str.replace(/"/g, '""')}"`;
                        }
                        return str;
                    }).join(','))
                ].join('\n');
            }
            
            if (options.download) {
                // Datei herunterladen
                const filename = options.filename || `mitarbeiterbefragung_export_${new Date().toISOString().slice(0, 10)}.csv`;
                Utils.file.downloadCSV(csvContent, filename);
            }
            
            return { 
                success: true,
                csvString: csvContent,
                rowCount: rows.length
            };
        } catch (error) {
            console.error('Fehler beim CSV-Export:', error);
            return {
                success: false,
                errors: [`Fehler beim Erstellen der CSV-Datei: ${error.message}`]
            };
        }
    };
    
    /**
     * Exportiert den gesamten Datenstand als JSON
     */
    const exportProject = (options = {}) => {
        try {
            // Aktualisiere Metadaten vor dem Export
            state.lastModified = new Date().toISOString();
            state.metadata.exportDate = new Date().toISOString();
            
            if (options.download) {
                // Datei herunterladen
                const filename = options.filename || `mitarbeiterbefragung_projekt_${new Date().toISOString().slice(0, 10)}.json`;
                Utils.file.downloadJSON(state, filename);
            }
            
            return {
                success: true,
                projectData: state,
                surveyCount: state.surveys.length
            };
        } catch (error) {
            console.error('Fehler beim Projektexport:', error);
            return {
                success: false,
                errors: [`Fehler beim Exportieren des Projekts: ${error.message}`]
            };
        }
    };
    
    /**
     * Importiert einen kompletten Projektstand aus JSON
     */
    const importProject = (projectData, options = {}) => {
        try {
            if (!projectData || typeof projectData !== 'object') {
                return {
                    success: false,
                    errors: ['Ungültiges Projektdatenformat.']
                };
            }
            
            // Validiere Projektdaten
            if (!Array.isArray(projectData.surveys)) {
                return {
                    success: false,
                    errors: ['Keine gültigen Befragungsdaten im Projekt gefunden.']
                };
            }
            
            // Optional: Vorherige Daten sichern
            let previousState = null;
            if (options.backup) {
                previousState = { ...state };
            }
            
            // Komplette Datenstruktur übernehmen
            state = {
                ...state, // Aktuelle Standardwerte behalten
                ...projectData,
                appSettings: {
                    ...state.appSettings, // Aktuelle Einstellungen behalten
                    ...(projectData.appSettings || {}) // Aber importierte Einstellungen übernehmen wenn vorhanden
                },
                metadata: {
                    ...state.metadata, // Aktuelle Metadaten behalten
                    ...(projectData.metadata || {}), // Aber importierte Metadaten übernehmen wenn vorhanden
                    imported: new Date().toISOString() // Import-Zeitstempel hinzufügen
                }
            };
            
            // Aktualisiere Anzahl der Einträge
            state.metadata.totalEntries = state.surveys.length;
            
            // Speichern und Benachrichtigen
            saveToLocalStorage();
            notifyListeners('dataChanged', { action: 'projectImport', count: state.surveys.length });
            
            return {
                success: true,
                surveyCount: state.surveys.length,
                previousState: previousState
            };
        } catch (error) {
            console.error('Fehler beim Projektimport:', error);
            return {
                success: false,
                errors: [`Fehler beim Importieren des Projekts: ${error.message}`]
            };
        }
    };
    
    /**
     * Konfiguriert Anwendungseinstellungen
     */
    const updateSettings = (settingPath, value) => {
        try {
            // Pfad aufteilen (z.B. "analysis.excludeIncomplete")
            const path = settingPath.split('.');
            if (path.length < 1) {
                return {
                    success: false,
                    errors: ['Ungültiger Einstellungspfad.']
                };
            }
            
            // Referenz auf Einstellungsobjekt
            let current = state;
            let parent = null;
            let lastKey = null;
            
            // Navigiere zum letzten Eltern-Objekt
            for (let i = 0; i < path.length - 1; i++) {
                const key = path[i];
                if (!current[key] || typeof current[key] !== 'object') {
                    return {
                        success: false,
                        errors: [`Einstellungspfad '${settingPath}' existiert nicht.`]
                    };
                }
                parent = current;
                current = current[key];
                lastKey = key;
            }
            
            // Setze Wert
            const finalKey = path[path.length - 1];
            
            // Speichere vorherigen Wert
            const previousValue = current[finalKey];
            
            // Aktualisiere Wert
            current[finalKey] = value;
            
            // Speichern und Benachrichtigen
            saveToLocalStorage();
            notifyListeners('settingsChanged', { 
                setting: settingPath, 
                value, 
                previousValue 
            });
            
            return {
                success: true,
                path: settingPath,
                value: value,
                previousValue: previousValue
            };
        } catch (error) {
            console.error('Fehler beim Aktualisieren der Einstellungen:', error);
            return {
                success: false,
                errors: [`Fehler beim Aktualisieren der Einstellungen: ${error.message}`]
            };
        }
    };
    
    /**
     * Ruft eine Einstellung ab
     */
    const getSetting = (settingPath) => {
        try {
            // Pfad aufteilen
            const path = settingPath.split('.');
            
            // Navigiere zum Wert
            let current = state;
            for (const key of path) {
                if (current[key] === undefined) {
                    return undefined;
                }
                current = current[key];
            }
            
            return current;
        } catch (error) {
            console.error('Fehler beim Abrufen der Einstellung:', error);
            return undefined;
        }
    };
    
    /**
     * Meldet einen Listener für Datenänderungen an
     */
    const addListener = (eventType, callback) => {
        if (!listeners[eventType]) {
            listeners[eventType] = [];
        }
        
        listeners[eventType].push(callback);
        
        // Returns Funktion zum Entfernen des Listeners
        return () => {
            removeListener(eventType, callback);
        };
    };
    
    /**
     * Entfernt einen Listener
     */
    const removeListener = (eventType, callback) => {
        if (!listeners[eventType]) return false;
        
        const index = listeners[eventType].indexOf(callback);
        if (index !== -1) {
            listeners[eventType].splice(index, 1);
            return true;
        }
        
        return false;
    };
    
    /**
     * Erstellt einen leeren Fragebogen nach Template
     */
    const createEmptySurvey = () => {
        return SurveySchema.emptyTemplate();
    };
    
    /**
     * Statistikfunktionen für die Datenanalyse
     */
    const statistics = {
        /**
         * Berechnet den Durchschnitt für eine Frage
         */
        getQuestionAverage: (questionId, filter = {}) => {
            let surveyData = state.surveys;
            
            // Filter anwenden falls vorhanden
            if (Object.keys(filter).length > 0) {
                surveyData = SurveySchema.filters.applyMultipleFilters(surveyData, filter);
            }
            
            return SurveySchema.statistics.calculateAverage(surveyData, questionId);
        },
        
        /**
         * Berechnet den Median für eine Frage
         */
        getQuestionMedian: (questionId, filter = {}) => {
            let surveyData = state.surveys;
            
            // Filter anwenden falls vorhanden
            if (Object.keys(filter).length > 0) {
                surveyData = SurveySchema.filters.applyMultipleFilters(surveyData, filter);
            }
            
            return SurveySchema.statistics.calculateMedian(surveyData, questionId);
        },
        
        /**
         * Berechnet die Standardabweichung für eine Frage
         */
        getQuestionStandardDeviation: (questionId, filter = {}) => {
            let surveyData = state.surveys;
            
            // Filter anwenden falls vorhanden
            if (Object.keys(filter).length > 0) {
                surveyData = SurveySchema.filters.applyMultipleFilters(surveyData, filter);
            }
            
            return SurveySchema.statistics.calculateStandardDeviation(surveyData, questionId);
        },
        
        /**
         * Berechnet den Durchschnitt für einen Themenbereich
         */
        getAreaAverage: (areaId, filter = {}) => {
            let surveyData = state.surveys;
            
            // Filter anwenden falls vorhanden
            if (Object.keys(filter).length > 0) {
                surveyData = SurveySchema.filters.applyMultipleFilters(surveyData, filter);
            }
            
            return SurveySchema.statistics.calculateAreaAverage(surveyData, areaId);
        },
        
        /**
         * Identifiziert Stärken und Schwächen
         */
        getStrengthsAndWeaknesses: (filter = {}) => {
            let surveyData = state.surveys;
            
            // Filter anwenden falls vorhanden
            if (Object.keys(filter).length > 0) {
                surveyData = SurveySchema.filters.applyMultipleFilters(surveyData, filter);
            }
            
            return SurveySchema.statistics.identifyStrengthsAndWeaknesses(surveyData);
        },
        
        /**
         * Berechnet Antwortverteilung für eine Frage
         */
        getAnswerDistribution: (questionId, filter = {}) => {
            let surveyData = state.surveys;
            
            // Filter anwenden falls vorhanden
            if (Object.keys(filter).length > 0) {
                surveyData = SurveySchema.filters.applyMultipleFilters(surveyData, filter);
            }
            
            // Für Likert-Fragen die Verteilung berechnen
            const distribution = {
                '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, 'noAnswer': 0
            };
            
            let totalResponses = 0;
            
            surveyData.forEach(survey => {
                const answer = survey[questionId];
                if (answer === null || answer === undefined || answer === '') {
                    distribution.noAnswer++;
                } else {
                    const value = String(answer);
                    if (distribution[value] !== undefined) {
                        distribution[value]++;
                        totalResponses++;
                    }
                }
            });
            
            // Prozentuale Verteilung hinzufügen
            const percentages = {};
            if (totalResponses > 0) {
                for (const key in distribution) {
                    if (key !== 'noAnswer') {
                        percentages[key] = (distribution[key] / totalResponses) * 100;
                    }
                }
            }
            
            return {
                distribution,
                percentages,
                totalResponses,
                noAnswer: distribution.noAnswer,
                questionId
            };
        },
        
        /**
         * Berechnet Statistiken für alle Fragen
         */
        getAllQuestionStatistics: (filter = {}) => {
            const allQuestions = SurveySchema.ui.getAllQuestions();
            const statistics = {};
            
            allQuestions.forEach(question => {
                if (question.type === 'likert') {
                    statistics[question.id] = {
                        average: this.getQuestionAverage(question.id, filter),
                        median: this.getQuestionMedian(question.id, filter),
                        standardDeviation: this.getQuestionStandardDeviation(question.id, filter),
                        distribution: this.getAnswerDistribution(question.id, filter),
                        text: question.text,
                        sectionId: question.sectionId,
                        sectionTitle: question.sectionTitle
                    };
                }
            });
            
            return statistics;
        },
        
        /**
         * Findet Korrelationen zwischen Fragen
         */
        findCorrelations: (questionId, threshold = 0.5, filter = {}) => {
            let surveyData = state.surveys;
            
            // Filter anwenden falls vorhanden
            if (Object.keys(filter).length > 0) {
                surveyData = SurveySchema.filters.applyMultipleFilters(surveyData, filter);
            }
            
            // Alle Likert-Fragen außer der Zielfrage
            const likertQuestions = SurveySchema.ui.getAllQuestions()
                .filter(q => q.type === 'likert' && q.id !== questionId)
                .map(q => q.id);
            
            // Pearson-Korrelationskoeffizient für jede Frage berechnen
            const correlations = [];
            
            likertQuestions.forEach(otherQuestionId => {
                // Extraktion valider Antwortpaare
                const pairs = [];
                surveyData.forEach(survey => {
                    const value1 = survey[questionId];
                    const value2 = survey[otherQuestionId];
                    
                    if (value1 !== null && value1 !== undefined && value1 !== '' &&
                        value2 !== null && value2 !== undefined && value2 !== '') {
                        pairs.push([parseFloat(value1), parseFloat(value2)]);
                    }
                });
                
                if (pairs.length < 3) return; // Zu wenig Daten
                
                // Berechnung des Korrelationskoeffizienten
                let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
                
                pairs.forEach(([x, y]) => {
                    sumX += x;
                    sumY += y;
                    sumXY += x * y;
                    sumX2 += x * x;
                    sumY2 += y * y;
                });
                
                const n = pairs.length;
                const numerator = n * sumXY - sumX * sumY;
                const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
                
                let correlation = denominator === 0 ? 0 : numerator / denominator;
                // Auf -1 bis 1 beschränken (wegen Rundungsfehlern)
                correlation = Math.max(-1, Math.min(1, correlation));
                
                // Nur signifikante Korrelationen behalten
                const absoluteCorrelation = Math.abs(correlation);
                if (absoluteCorrelation >= threshold) {
                    const otherQuestion = SurveySchema.ui.getQuestionById(otherQuestionId);
                    correlations.push({
                        questionId: otherQuestionId,
                        questionText: otherQuestion.text,
                        sectionId: otherQuestion.sectionId,
                        sectionTitle: otherQuestion.sectionTitle,
                        correlation: correlation,
                        absoluteCorrelation: absoluteCorrelation,
                        direction: correlation > 0 ? 'positive' : 'negative',
                        strength: absoluteCorrelation >= 0.7 ? 'strong' : 'moderate',
                        sampleSize: pairs.length
                    });
                }
            });
            
            // Nach Korrelationsstärke absteigend sortieren
            correlations.sort((a, b) => b.absoluteCorrelation - a.absoluteCorrelation);
            
            return correlations;
        }
    };
    
    /**
     * Filter-Funktionen für Datenauswertungen
     */
    const filters = {
        /**
         * Filtert Fragebogendaten nach demografischen Merkmalen
         */
        filterByDemographic: (field, value) => {
            return SurveySchema.filters.filterByDemographic(state.surveys, field, value);
        },
        
        /**
         * Wendet mehrere Filter auf die Daten an
         */
        applyMultipleFilters: (filterCriteria) => {
            return SurveySchema.filters.applyMultipleFilters(state.surveys, filterCriteria);
        },
        
        /**
         * Filtert nach Vollständigkeit des Fragebogens
         */
        filterByCompleteness: (minCompleteness = 0.75) => {
            return state.surveys.filter(survey => {
                const completeness = SurveySchema.validators.getSurveyCompleteness(survey);
                return completeness >= minCompleteness;
            });
        },
        
        /**
         * Filtert nach Datumswerten
         */
        filterByDate: (startDate, endDate) => {
            return state.surveys.filter(survey => {
                const timestamp = new Date(survey.timestamp);
                const isAfterStart = !startDate || timestamp >= new Date(startDate);
                const isBeforeEnd = !endDate || timestamp <= new Date(endDate);
                return isAfterStart && isBeforeEnd;
            });
        }
    };

    // Initialisiere beim Import
    init();

    // Öffentliche API
    return {
        // State-Management
        getAllSurveys,
        getSurveyById,
        addSurvey,
        updateSurvey,
        deleteSurvey,
        clearAllData,
        createEmptySurvey,
        
        // Persistence
        saveToLocalStorage,
        loadFromLocalStorage,
        
        // Import/Export
        importSurveys,
        importFromCSV,
        exportToCSV,
        exportProject,
        importProject,
        
        // Einstellungen
        updateSettings,
        getSetting,
        
        // Statistik und Filter
        statistics,
        filters,
        
        // Event-Listener
        addListener,
        removeListener,
        
        // Autosave
        toggleAutosave,
        
        // Für Debugging
        getState: () => ({ ...state })
    };
})();

// Export für ES6 Module und CommonJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataManager;
} else if (typeof define === 'function' && define.amd) {
    define(['SurveySchema', 'Utils'], function(SurveySchema, Utils) { return DataManager; });
} else {
    window.DataManager = DataManager;
}