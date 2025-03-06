/**
 * data-import-export.js
 * Import/Export-Modul für die Mitarbeiterbefragung
 * Ermöglicht den Import und Export von Daten im CSV-Format sowie Projektsicherung
 */

window.DataImportExportModule = (() => {
    // Modul-Elemente
    let container = null;
    let currentView = 'main';  // 'main', 'import', 'export', 'backup'
    
    // Import-Optionen
    const importOptions = {
        delimiter: ',',
        hasHeader: true,
        encoding: 'UTF-8',
        overwriteExisting: false,
        skipErrors: true,
        previewRows: 5
    };
    
    // Export-Optionen
    const exportOptions = {
        delimiter: ',',
        includeHeader: true,
        encoding: 'UTF-8',
        includeTimestamp: true,
        filename: `mitarbeiterbefragung_export_${new Date().toISOString().split('T')[0]}.csv`
    };
    
    // Backup-Optionen
    const backupOptions = {
        includeSettings: true,
        compressionLevel: 'medium', // 'none', 'low', 'medium', 'high'
        encryptBackup: false,
        backupFilename: `mitarbeiterbefragung_backup_${new Date().toISOString().split('T')[0]}.json`
    };
    
    // Zwischenspeicher für Import-Daten
    let importData = {
        rawData: null,
        parsedData: null,
        headers: [],
        mappings: {},
        previewData: [],
        validationResults: {
            validRows: 0,
            invalidRows: 0,
            warnings: [],
            errors: []
        }
    };
    
    /**
     * Import/Export-Modul initialisieren
     */
    const init = async (targetContainer) => {
        try {
            container = targetContainer;
            
            // Prüfen ob notwendige Abhängigkeiten vorhanden sind
            if (!window.Papa) {
                throw new Error('PapaParse nicht geladen - CSV-Funktionalität eingeschränkt');
            }
            
            // Basis-Layout erstellen
            createLayout();
            
            // Standard-Ansicht zeigen
            showMainView();
            
            return true;
        } catch (error) {
            console.error('Fehler bei der Initialisierung des Import/Export-Moduls:', error);
            container.innerHTML = `<div class="alert alert-danger">
                <h4>Fehler beim Laden des Import/Export-Moduls</h4>
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
            <div class="data-import-export-container">
                <div class="section-header d-flex justify-content-between align-items-center">
                    <div>
                        <h2>
                            <i class="fas fa-file-import"></i> 
                            Import / Export
                        </h2>
                        <p class="section-description">
                            Importieren und exportieren Sie Befragungsdaten und sichern Sie Ihren Projektfortschritt
                        </p>
                    </div>
                    <div class="actions" id="view-actions">
                        <!-- Dynamische Aktions-Buttons -->
                    </div>
                </div>
                
                <!-- Hauptinhalt - dynamisch befüllt -->
                <div id="import-export-content" class="mt-4">
                    <!-- Wird dynamisch mit der jeweiligen Ansicht befüllt -->
                </div>
            </div>
        `;
    };
    
    /**
     * Hauptansicht mit Auswahl der Funktionalität anzeigen
     */
    const showMainView = () => {
        currentView = 'main';
        
        // View-Actions aktualisieren
        const actionsContainer = document.getElementById('view-actions');
        actionsContainer.innerHTML = `
            <button id="refresh-data-btn" class="btn btn-outline-secondary me-2">
                <i class="fas fa-sync-alt"></i> Aktualisieren
            </button>
        `;
        
        // Event-Listener für Refresh-Button
        document.getElementById('refresh-data-btn').addEventListener('click', () => {
            showMainView(); // Ansicht neu laden
        });
        
        // Content-Container leeren und Hauptansicht erstellen
        const contentContainer = document.getElementById('import-export-content');
        contentContainer.innerHTML = `
            <div class="row">
                <!-- Import-Karte -->
                <div class="col-lg-6 mb-4">
                    <div class="card card-hover h-100">
                        <div class="card-body">
                            <h4 class="card-title mb-3">
                                <i class="fas fa-file-import text-primary"></i> Daten importieren
                            </h4>
                            <p class="card-text">
                                Importieren Sie Fragebogendaten aus CSV-Dateien. Sie können bestehende Daten ergänzen oder ersetzen.
                            </p>
                            <ul class="feature-list mb-4">
                                <li>CSV-Import mit Feldmapping</li>
                                <li>Datenvalidierung vor dem Import</li>
                                <li>Duplikaterkennung</li>
                            </ul>
                            <button id="show-import-btn" class="btn btn-primary">
                                <i class="fas fa-file-import"></i> CSV importieren
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Export-Karte -->
                <div class="col-lg-6 mb-4">
                    <div class="card card-hover h-100">
                        <div class="card-body">
                            <h4 class="card-title mb-3">
                                <i class="fas fa-file-export text-success"></i> Daten exportieren
                            </h4>
                            <p class="card-text">
                                Exportieren Sie die erfassten Fragebogendaten in verschiedenen Formaten für die Weiterverarbeitung.
                            </p>
                            <ul class="feature-list mb-4">
                                <li>CSV-Export mit anpassbaren Optionen</li>
                                <li>Datenfilterung vor dem Export</li>
                                <li>Einstellbare Datumsformate</li>
                            </ul>
                            <button id="show-export-btn" class="btn btn-success">
                                <i class="fas fa-file-export"></i> Daten exportieren
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row mt-2">
                <!-- Projekt-Backup-Karte -->
                <div class="col-lg-6 mb-4">
                    <div class="card card-hover h-100">
                        <div class="card-body">
                            <h4 class="card-title mb-3">
                                <i class="fas fa-save text-info"></i> Projekt sichern
                            </h4>
                            <p class="card-text">
                                Sichern Sie den gesamten Projektfortschritt einschließlich aller Daten und Einstellungen.
                            </p>
                            <ul class="feature-list mb-4">
                                <li>Vollständige Projektsicherung</li>
                                <li>Wiederherstellung aus Backup</li>
                                <li>Automatische Sicherungen</li>
                            </ul>
                            <button id="show-backup-btn" class="btn btn-info text-white">
                                <i class="fas fa-save"></i> Projekt sichern/laden
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Status-Karte -->
                <div class="col-lg-6 mb-4">
                    <div class="card h-100">
                        <div class="card-body">
                            <h4 class="card-title mb-3">
                                <i class="fas fa-info-circle text-secondary"></i> Datenstatus
                            </h4>
                            <div id="data-status">
                                <!-- Wird dynamisch befüllt -->
                                <div class="placeholder-text">Laden...</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Aktivitätslog -->
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">Aktivitäten</h5>
                            <button id="clear-log-btn" class="btn btn-sm btn-outline-secondary">
                                <i class="fas fa-eraser"></i> Log leeren
                            </button>
                        </div>
                        <div class="card-body">
                            <div id="activity-log" class="activity-log">
                                <!-- Wird dynamisch befüllt -->
                                <div class="log-entry">
                                    <span class="log-timestamp">Jetzt</span>
                                    <span class="log-message">Import/Export-Modul initialisiert</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Event-Listener für die Buttons
        document.getElementById('show-import-btn').addEventListener('click', () => {
            showImportView();
        });
        
        document.getElementById('show-export-btn').addEventListener('click', () => {
            showExportView();
        });
        
        document.getElementById('show-backup-btn').addEventListener('click', () => {
            showBackupView();
        });
        
        document.getElementById('clear-log-btn').addEventListener('click', () => {
            clearActivityLog();
        });
        
        // Datenstatus laden
        loadDataStatus();
        
        // Aktivitätslog aus dem LocalStorage laden
        loadActivityLog();
    };
    
    /**
     * Import-Ansicht anzeigen
     */
    const showImportView = () => {
        currentView = 'import';
        
        // Import-Daten zurücksetzen
        resetImportData();
        
        // View-Actions aktualisieren
        const actionsContainer = document.getElementById('view-actions');
        actionsContainer.innerHTML = `
            <button id="back-to-main-btn" class="btn btn-outline-secondary me-2">
                <i class="fas fa-arrow-left"></i> Zurück zur Übersicht
            </button>
        `;
        
        // Event-Listener für Back-Button
        document.getElementById('back-to-main-btn').addEventListener('click', () => {
            showMainView();
        });
        
        // Content-Container leeren und Import-Ansicht erstellen
        const contentContainer = document.getElementById('import-export-content');
        contentContainer.innerHTML = `
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="mb-0">CSV-Daten importieren</h5>
                </div>
                <div class="card-body">
                    <div class="import-steps">
                        <div class="step-indicators mb-4">
                            <div class="step active" id="step-indicator-1">
                                <div class="step-number">1</div>
                                <div class="step-title">Datei auswählen</div>
                            </div>
                            <div class="step-connector"></div>
                            <div class="step" id="step-indicator-2">
                                <div class="step-number">2</div>
                                <div class="step-title">Felder zuordnen</div>
                            </div>
                            <div class="step-connector"></div>
                            <div class="step" id="step-indicator-3">
                                <div class="step-number">3</div>
                                <div class="step-title">Daten überprüfen</div>
                            </div>
                            <div class="step-connector"></div>
                            <div class="step" id="step-indicator-4">
                                <div class="step-number">4</div>
                                <div class="step-title">Import abschließen</div>
                            </div>
                        </div>
                        
                        <!-- Schritt 1: Dateiauswahl -->
                        <div id="import-step-1" class="import-step active">
                            <div class="file-upload" id="csv-upload-area">
                                <div class="file-upload-icon">
                                    <i class="fas fa-cloud-upload-alt"></i>
                                </div>
                                <h5 class="file-upload-text">CSV-Datei hier ablegen oder klicken zum Auswählen</h5>
                                <p class="file-upload-info">Unterstützte Dateiformate: .csv</p>
                                <input type="file" id="csv-file-input" accept=".csv" class="file-input">
                            </div>
                            
                            <div class="import-options mt-4">
                                <h6>Import-Optionen</h6>
                                <div class="row g-3">
                                    <div class="col-md-6">
                                        <div class="form-group mb-3">
                                            <label for="delimiter-select" class="form-label">Trennzeichen:</label>
                                            <select class="form-control" id="delimiter-select">
                                                <option value=",">Komma (,)</option>
                                                <option value=";">Semikolon (;)</option>
                                                <option value="\t">Tabulator (Tab)</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-group mb-3">
                                            <label for="encoding-select" class="form-label">Zeichenkodierung:</label>
                                            <select class="form-control" id="encoding-select">
                                                <option value="UTF-8">UTF-8</option>
                                                <option value="ISO-8859-1">ISO-8859-1 (Latin-1)</option>
                                                <option value="Windows-1252">Windows-1252</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div class="row g-3">
                                    <div class="col-md-6">
                                        <div class="form-check mb-3">
                                            <input class="form-check-input" type="checkbox" id="has-header-checkbox" checked>
                                            <label class="form-check-label" for="has-header-checkbox">
                                                Erste Zeile enthält Spaltennamen
                                            </label>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-check mb-3">
                                            <input class="form-check-input" type="checkbox" id="skip-errors-checkbox" checked>
                                            <label class="form-check-label" for="skip-errors-checkbox">
                                                Fehlerhafte Zeilen überspringen
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="mt-4 d-flex justify-content-between">
                                <button class="btn btn-outline-secondary" id="cancel-import-btn">Abbrechen</button>
                                <button class="btn btn-primary" id="next-step-1-btn" disabled>Weiter</button>
                            </div>
                        </div>
                        
                        <!-- Schritt 2: Feldzuordnung -->
                        <div id="import-step-2" class="import-step">
                            <div class="mb-4">
                                <h6>Feldzuordnung</h6>
                                <p class="text-muted">Ordnen Sie die Spalten aus Ihrer CSV-Datei den Feldern in der Anwendung zu.</p>
                                
                                <div class="alert alert-info">
                                    <i class="fas fa-info-circle"></i> 
                                    Felder mit <span class="badge bg-danger">Pflicht</span> müssen zugeordnet werden.
                                </div>
                                
                                <div class="table-container">
                                    <table class="table table-sm table-bordered" id="mapping-table">
                                        <thead>
                                            <tr>
                                                <th style="width: 40%;">CSV-Spalte</th>
                                                <th style="width: 40%;">Anwendungsfeld</th>
                                                <th style="width: 20%;">Vorschau</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <!-- Wird dynamisch befüllt -->
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            
                            <div class="mt-4 d-flex justify-content-between">
                                <button class="btn btn-outline-secondary" id="back-step-2-btn">Zurück</button>
                                <button class="btn btn-primary" id="next-step-2-btn">Weiter</button>
                            </div>
                        </div>
                        
                        <!-- Schritt 3: Daten überprüfen -->
                        <div id="import-step-3" class="import-step">
                            <div class="mb-4">
                                <h6>Datenvorschau und Validierung</h6>
                                <p class="text-muted">Überprüfen Sie die Daten vor dem Import.</p>
                                
                                <div id="validation-summary" class="mb-3">
                                    <!-- Wird dynamisch befüllt -->
                                </div>
                                
                                <div class="table-responsive">
                                    <table class="table table-sm table-bordered table-striped" id="validation-table">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Status</th>
                                                <!-- Weitere Spalten werden dynamisch hinzugefügt -->
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <!-- Wird dynamisch befüllt -->
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            
                            <div class="import-options mt-4">
                                <h6>Import-Optionen</h6>
                                <div class="form-check mb-3">
                                    <input class="form-check-input" type="checkbox" id="overwrite-checkbox">
                                    <label class="form-check-label" for="overwrite-checkbox">
                                        Bestehende Datensätze überschreiben
                                    </label>
                                </div>
                            </div>
                            
                            <div class="mt-4 d-flex justify-content-between">
                                <button class="btn btn-outline-secondary" id="back-step-3-btn">Zurück</button>
                                <button class="btn btn-primary" id="next-step-3-btn">Importieren</button>
                            </div>
                        </div>
                        
                        <!-- Schritt 4: Import abschließen -->
                        <div id="import-step-4" class="import-step">
                            <div id="import-results">
                                <!-- Wird dynamisch befüllt -->
                            </div>
                            
                            <div class="mt-4 d-flex justify-content-between">
                                <button class="btn btn-outline-secondary" id="new-import-btn">Neuer Import</button>
                                <button class="btn btn-primary" id="finish-import-btn">Fertigstellen</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // UI für Drag-and-Drop und Dateiauswahl einrichten
        setupFileUploadArea();
        
        // Event-Listener für Import-Optionen
        document.getElementById('delimiter-select').value = importOptions.delimiter;
        document.getElementById('delimiter-select').addEventListener('change', (e) => {
            importOptions.delimiter = e.target.value;
        });
        
        document.getElementById('encoding-select').value = importOptions.encoding;
        document.getElementById('encoding-select').addEventListener('change', (e) => {
            importOptions.encoding = e.target.value;
        });
        
        document.getElementById('has-header-checkbox').checked = importOptions.hasHeader;
        document.getElementById('has-header-checkbox').addEventListener('change', (e) => {
            importOptions.hasHeader = e.target.checked;
        });
        
        document.getElementById('skip-errors-checkbox').checked = importOptions.skipErrors;
        document.getElementById('skip-errors-checkbox').addEventListener('change', (e) => {
            importOptions.skipErrors = e.target.checked;
        });
        
        // Event-Listener für Import-Navigation
        document.getElementById('cancel-import-btn').addEventListener('click', () => {
            showMainView();
        });
        
        document.getElementById('next-step-1-btn').addEventListener('click', () => {
            goToImportStep(2);
        });
        
        document.getElementById('back-step-2-btn').addEventListener('click', () => {
            goToImportStep(1);
        });
        
        document.getElementById('next-step-2-btn').addEventListener('click', () => {
            validateImportData().then(() => {
                goToImportStep(3);
            });
        });
        
        document.getElementById('back-step-3-btn').addEventListener('click', () => {
            goToImportStep(2);
        });
        
        document.getElementById('next-step-3-btn').addEventListener('click', () => {
            performImport();
        });
        
        document.getElementById('new-import-btn').addEventListener('click', () => {
            showImportView();
        });
        
        document.getElementById('finish-import-btn').addEventListener('click', () => {
            showMainView();
        });
        
        // Aktivitätslog aktualisieren
        addActivityLogEntry('Import-Ansicht geöffnet');
    };
    
    /**
     * Export-Ansicht anzeigen
     */
    const showExportView = () => {
        currentView = 'export';
        
        // View-Actions aktualisieren
        const actionsContainer = document.getElementById('view-actions');
        actionsContainer.innerHTML = `
            <button id="back-to-main-btn" class="btn btn-outline-secondary me-2">
                <i class="fas fa-arrow-left"></i> Zurück zur Übersicht
            </button>
        `;
        
        // Event-Listener für Back-Button
        document.getElementById('back-to-main-btn').addEventListener('click', () => {
            showMainView();
        });
        
        // Content-Container leeren und Export-Ansicht erstellen
        const contentContainer = document.getElementById('import-export-content');
        contentContainer.innerHTML = `
            <div class="row">
                <!-- Export-Optionen -->
                <div class="col-lg-5 mb-4">
                    <div class="card h-100">
                        <div class="card-header">
                            <h5 class="mb-0">Export-Optionen</h5>
                        </div>
                        <div class="card-body">
                            <form id="export-options-form">
                                <div class="form-group mb-3">
                                    <label for="export-filename" class="form-label">Dateiname:</label>
                                    <input type="text" class="form-control" id="export-filename" 
                                        value="${exportOptions.filename}">
                                </div>
                                
                                <div class="form-group mb-3">
                                    <label for="export-delimiter" class="form-label">Trennzeichen:</label>
                                    <select class="form-control" id="export-delimiter">
                                        <option value=",">Komma (,)</option>
                                        <option value=";">Semikolon (;)</option>
                                        <option value="\t">Tabulator (Tab)</option>
                                    </select>
                                </div>
                                
                                <div class="form-check mb-3">
                                    <input class="form-check-input" type="checkbox" id="include-header-checkbox" 
                                        ${exportOptions.includeHeader ? 'checked' : ''}>
                                    <label class="form-check-label" for="include-header-checkbox">
                                        Spaltenüberschriften einbeziehen
                                    </label>
                                </div>
                                
                                <div class="form-check mb-3">
                                    <input class="form-check-input" type="checkbox" id="include-timestamp-checkbox"
                                        ${exportOptions.includeTimestamp ? 'checked' : ''}>
                                    <label class="form-check-label" for="include-timestamp-checkbox">
                                        Zeitstempel im Dateinamen
                                    </label>
                                </div>
                                
                                <hr>
                                
                                <h6>Datenfilter</h6>
                                <div class="form-group mb-3">
                                    <label for="export-profession-filter" class="form-label">Berufsgruppe:</label>
                                    <select class="form-control" id="export-profession-filter">
                                        <option value="">Alle Berufsgruppen</option>
                                        ${SurveySchema.demographicOptions.profession.map(p => 
                                            `<option value="${p.id}">${p.label}</option>`
                                        ).join('')}
                                    </select>
                                </div>
                                
                                <div class="form-group mb-3">
                                    <label for="export-completeness-filter" class="form-label">Vollständigkeit:</label>
                                    <select class="form-control" id="export-completeness-filter">
                                        <option value="0">Alle Fragebögen</option>
                                        <option value="0.25">Mind. 25% ausgefüllt</option>
                                        <option value="0.5">Mind. 50% ausgefüllt</option>
                                        <option value="0.75">Mind. 75% ausgefüllt</option>
                                        <option value="0.9">Mind. 90% ausgefüllt</option>
                                    </select>
                                </div>
                                
                                <div class="mt-4">
                                    <button type="button" id="export-preview-btn" class="btn btn-outline-primary mb-2">
                                        <i class="fas fa-eye"></i> Vorschau
                                    </button>
                                    <button type="button" id="export-download-btn" class="btn btn-success mb-2">
                                        <i class="fas fa-download"></i> CSV herunterladen
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
                
                <!-- Export-Vorschau -->
                <div class="col-lg-7 mb-4">
                    <div class="card h-100">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">Datenvorschau</h5>
                            <span class="badge bg-primary" id="export-count-badge">0 Datensätze</span>
                        </div>
                        <div class="card-body">
                            <div id="export-preview-container" class="export-preview">
                                <div class="placeholder-text">
                                    Klicken Sie auf "Vorschau", um die zu exportierenden Daten anzuzeigen.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Zusätzliche Export-Formate -->
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="mb-0">Weitere Export-Formate</h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-4 mb-3">
                            <div class="export-format-card">
                                <div class="format-icon">
                                    <i class="fas fa-file-excel"></i>
                                </div>
                                <div class="format-details">
                                    <h6>Excel-Format</h6>
                                    <p class="small text-muted mb-2">Export als XLSX-Datei</p>
                                    <button id="export-excel-btn" class="btn btn-sm btn-outline-success">
                                        <i class="fas fa-download"></i> XLSX exportieren
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-4 mb-3">
                            <div class="export-format-card">
                                <div class="format-icon">
                                    <i class="fas fa-file-code"></i>
                                </div>
                                <div class="format-details">
                                    <h6>JSON-Format</h6>
                                    <p class="small text-muted mb-2">Export als JSON-Datei</p>
                                    <button id="export-json-btn" class="btn btn-sm btn-outline-success">
                                        <i class="fas fa-download"></i> JSON exportieren
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-4 mb-3">
                            <div class="export-format-card">
                                <div class="format-icon">
                                    <i class="fas fa-share-alt"></i>
                                </div>
                                <div class="format-details">
                                    <h6>Daten teilen</h6>
                                    <p class="small text-muted mb-2">URL zum Teilen generieren</p>
                                    <button id="share-data-btn" class="btn btn-sm btn-outline-primary">
                                        <i class="fas fa-link"></i> Link generieren
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Event-Listener für Export-Optionen
        document.getElementById('export-delimiter').value = exportOptions.delimiter;
        document.getElementById('export-delimiter').addEventListener('change', (e) => {
            exportOptions.delimiter = e.target.value;
        });
        
        document.getElementById('include-header-checkbox').addEventListener('change', (e) => {
            exportOptions.includeHeader = e.target.checked;
        });
        
        document.getElementById('include-timestamp-checkbox').addEventListener('change', (e) => {
            exportOptions.includeTimestamp = e.target.checked;
            
            // Dateinamen aktualisieren
            updateExportFilename();
        });
        
        document.getElementById('export-filename').addEventListener('input', (e) => {
            exportOptions.filename = e.target.value;
        });
        
        // Event-Listener für Export-Aktionen
        document.getElementById('export-preview-btn').addEventListener('click', () => {
            generateExportPreview();
        });
        
        document.getElementById('export-download-btn').addEventListener('click', () => {
            exportCSV();
        });
        
        document.getElementById('export-excel-btn').addEventListener('click', () => {
            exportExcel();
        });
        
        document.getElementById('export-json-btn').addEventListener('click', () => {
            exportJSON();
        });
        
        document.getElementById('share-data-btn').addEventListener('click', () => {
            shareData();
        });
        
        // Exportoptionen initialisieren
        updateExportFilename();
        
        // Initiale Vorschau generieren
        generateExportPreview();
        
        // Aktivitätslog aktualisieren
        addActivityLogEntry('Export-Ansicht geöffnet');
    };
    
    /**
     * Backup-Ansicht anzeigen
     */
    const showBackupView = () => {
        currentView = 'backup';
        
        // View-Actions aktualisieren
        const actionsContainer = document.getElementById('view-actions');
        actionsContainer.innerHTML = `
            <button id="back-to-main-btn" class="btn btn-outline-secondary me-2">
                <i class="fas fa-arrow-left"></i> Zurück zur Übersicht
            </button>
        `;
        
        // Event-Listener für Back-Button
        document.getElementById('back-to-main-btn').addEventListener('click', () => {
            showMainView();
        });
        
        // Content-Container leeren und Backup-Ansicht erstellen
        const contentContainer = document.getElementById('import-export-content');
        contentContainer.innerHTML = `
            <div class="row">
                <!-- Backup-Optionen -->
                <div class="col-lg-6 mb-4">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Projektsicherung</h5>
                        </div>
                        <div class="card-body">
                            <div class="alert alert-info mb-4">
                                <i class="fas fa-info-circle"></i> 
                                Eine Projektsicherung enthält alle erfassten Fragebögen, 
                                Anwendungseinstellungen und den aktuellen Projektstand.
                            </div>
                            
                            <form id="backup-options-form">
                                <div class="form-group mb-3">
                                    <label for="backup-filename" class="form-label">Dateiname:</label>
                                    <input type="text" class="form-control" id="backup-filename" 
                                        value="${backupOptions.backupFilename}">
                                </div>
                                
                                <div class="form-check mb-3">
                                    <input class="form-check-input" type="checkbox" id="include-settings-checkbox" 
                                        ${backupOptions.includeSettings ? 'checked' : ''}>
                                    <label class="form-check-label" for="include-settings-checkbox">
                                        Anwendungseinstellungen einbeziehen
                                    </label>
                                </div>
                                
                                <div class="form-group mb-3">
                                    <label for="compression-level" class="form-label">Komprimierung:</label>
                                    <select class="form-control" id="compression-level">
                                        <option value="none">Keine</option>
                                        <option value="low">Niedrig</option>
                                        <option value="medium" selected>Mittel</option>
                                        <option value="high">Hoch</option>
                                    </select>
                                </div>
                                
                                <div class="mt-4">
                                    <button type="button" id="create-backup-btn" class="btn btn-primary mb-2">
                                        <i class="fas fa-download"></i> Backup erstellen
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
                
                <!-- Projekt-Wiederherstellung -->
                <div class="col-lg-6 mb-4">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Projektwiederherstellung</h5>
                        </div>
                        <div class="card-body">
                            <div class="alert alert-warning mb-4">
                                <i class="fas fa-exclamation-triangle"></i> 
                                Beim Wiederherstellen eines Backups werden alle aktuellen Daten überschrieben. 
                                Erstellen Sie vorher ein Backup, wenn Sie die aktuellen Daten behalten möchten.
                            </div>
                            
                            <div class="file-upload" id="backup-upload-area">
                                <div class="file-upload-icon">
                                    <i class="fas fa-file-upload"></i>
                                </div>
                                <h5 class="file-upload-text">Backup-Datei hier ablegen oder klicken zum Auswählen</h5>
                                <p class="file-upload-info">Unterstützte Dateiformate: .json</p>
                                <input type="file" id="backup-file-input" accept=".json" class="file-input">
                            </div>
                            
                            <div id="restore-options" class="mt-3" style="display: none;">
                                <div class="form-check mb-3">
                                    <input class="form-check-input" type="checkbox" id="restore-settings-checkbox" checked>
                                    <label class="form-check-label" for="restore-settings-checkbox">
                                        Anwendungseinstellungen wiederherstellen
                                    </label>
                                </div>
                                
                                <div class="form-check mb-3">
                                    <input class="form-check-input" type="checkbox" id="merge-data-checkbox">
                                    <label class="form-check-label" for="merge-data-checkbox">
                                        Daten zusammenführen (statt überschreiben)
                                    </label>
                                </div>
                                
                                <button type="button" id="restore-backup-btn" class="btn btn-success mt-2">
                                    <i class="fas fa-cloud-upload-alt"></i> Backup wiederherstellen
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Backup-Historie -->
            <div class="card mb-4">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Backup-Historie</h5>
                    <button id="clear-backup-history-btn" class="btn btn-sm btn-outline-secondary">
                        <i class="fas fa-eraser"></i> Historie leeren
                    </button>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover" id="backup-history-table">
                            <thead>
                                <tr>
                                    <th>Datum</th>
                                    <th>Typ</th>
                                    <th>Größe</th>
                                    <th>Datensätze</th>
                                    <th>Status</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                <!-- Wird dynamisch befüllt oder mit Platzhalter -->
                                <tr>
                                    <td colspan="6" class="text-center">Keine Backup-Historie vorhanden</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        // Backup-Upload-Bereich einrichten
        setupBackupUploadArea();
        
        // Event-Listener für Backup-Optionen
        document.getElementById('include-settings-checkbox').addEventListener('change', (e) => {
            backupOptions.includeSettings = e.target.checked;
        });
        
        document.getElementById('compression-level').value = backupOptions.compressionLevel;
        document.getElementById('compression-level').addEventListener('change', (e) => {
            backupOptions.compressionLevel = e.target.value;
        });
        
        document.getElementById('backup-filename').addEventListener('input', (e) => {
            backupOptions.backupFilename = e.target.value;
        });
        
        // Event-Listener für Backup-Aktionen
        document.getElementById('create-backup-btn').addEventListener('click', () => {
            createBackup();
        });
        
        document.getElementById('clear-backup-history-btn').addEventListener('click', () => {
            clearBackupHistory();
        });
        
        // Backup-Historie laden
        loadBackupHistory();
        
        // Aktivitätslog aktualisieren
        addActivityLogEntry('Backup-Ansicht geöffnet');
    };
    
    /**
     * File-Upload-Bereich für CSV-Import einrichten
     */
    const setupFileUploadArea = () => {
        const uploadArea = document.getElementById('csv-upload-area');
        const fileInput = document.getElementById('csv-file-input');
        
        if (!uploadArea || !fileInput) return;
        
        // Drag-and-Drop-Funktionalität
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            if (e.dataTransfer.files.length) {
                fileInput.files = e.dataTransfer.files;
                handleCSVFileSelection(e.dataTransfer.files[0]);
            }
        });
        
        // Klick auf Upload-Bereich
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });
        
        // Dateiauswahl-Event
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length) {
                handleCSVFileSelection(e.target.files[0]);
            }
        });
    };
    
    /**
     * Backup-Upload-Bereich einrichten
     */
    const setupBackupUploadArea = () => {
        const uploadArea = document.getElementById('backup-upload-area');
        const fileInput = document.getElementById('backup-file-input');
        
        if (!uploadArea || !fileInput) return;
        
        // Drag-and-Drop-Funktionalität
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            if (e.dataTransfer.files.length) {
                fileInput.files = e.dataTransfer.files;
                handleBackupFileSelection(e.dataTransfer.files[0]);
            }
        });
        
        // Klick auf Upload-Bereich
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });
        
        // Dateiauswahl-Event
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length) {
                handleBackupFileSelection(e.target.files[0]);
            }
        });
        
        // Event-Listener für Wiederherstellungs-Button
        const restoreButton = document.getElementById('restore-backup-btn');
        if (restoreButton) {
            restoreButton.addEventListener('click', () => {
                confirmRestoreBackup();
            });
        }
    };
    
    /**
     * CSV-Datei verarbeiten
     */
    const handleCSVFileSelection = (file) => {
        if (!file || file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            Utils.notifications.error('Bitte wählen Sie eine gültige CSV-Datei aus.');
            return;
        }
        
        const reader = new FileReader();
        
        // Lade-Anzeige zeigen
        const uploadArea = document.getElementById('csv-upload-area');
        uploadArea.classList.add('processing');
        uploadArea.innerHTML = `
            <div class="loader"></div>
            <h5 class="file-upload-text">Datei wird verarbeitet...</h5>
        `;
        
        reader.onload = (e) => {
            try {
                // Rohdaten speichern
                importData.rawData = e.target.result;
                
                // CSV parsen
                parseCSV(importData.rawData);
                
                // Upload-Bereich aktualisieren
                uploadArea.classList.remove('processing');
                uploadArea.innerHTML = `
                    <div class="file-upload-success">
                        <i class="fas fa-check-circle"></i>
                        <h5 class="file-upload-text">Datei erfolgreich geladen</h5>
                        <p class="file-info">${file.name} (${formatFileSize(file.size)})</p>
                        <button class="btn btn-sm btn-outline-secondary mt-2" id="change-file-btn">
                            <i class="fas fa-sync-alt"></i> Andere Datei wählen
                        </button>
                    </div>
                `;
                
                // Event-Listener für "Andere Datei wählen"-Button
                document.getElementById('change-file-btn').addEventListener('click', () => {
                    document.getElementById('csv-file-input').value = '';
                    resetImportData();
                    setupFileUploadArea();
                });
                
                // Nächster Button aktivieren
                document.getElementById('next-step-1-btn').disabled = false;
                
                // Aktivitätslog aktualisieren
                addActivityLogEntry(`CSV-Datei "${file.name}" geladen`);
                
            } catch (error) {
                console.error('Fehler beim Verarbeiten der CSV-Datei:', error);
                
                // Fehleranzeige
                uploadArea.classList.remove('processing');
                uploadArea.innerHTML = `
                    <div class="file-upload-error">
                        <i class="fas fa-exclamation-circle"></i>
                        <h5 class="file-upload-text">Fehler beim Laden der Datei</h5>
                        <p class="text-danger">${error.message}</p>
                        <button class="btn btn-sm btn-outline-secondary mt-2" id="retry-file-btn">
                            <i class="fas fa-redo"></i> Erneut versuchen
                        </button>
                    </div>
                `;
                
                // Event-Listener für "Erneut versuchen"-Button
                document.getElementById('retry-file-btn').addEventListener('click', () => {
                    document.getElementById('csv-file-input').value = '';
                    resetImportData();
                    setupFileUploadArea();
                });
                
                // Nächster Button deaktivieren
                document.getElementById('next-step-1-btn').disabled = true;
                
                // Fehlermeldung anzeigen
                Utils.notifications.error('Fehler beim CSV-Import: ' + error.message);
            }
        };
        
        reader.onerror = () => {
            // Fehleranzeige
            uploadArea.classList.remove('processing');
            uploadArea.innerHTML = `
                <div class="file-upload-error">
                    <i class="fas fa-exclamation-circle"></i>
                    <h5 class="file-upload-text">Fehler beim Laden der Datei</h5>
                    <p class="text-danger">Die Datei konnte nicht gelesen werden.</p>
                    <button class="btn btn-sm btn-outline-secondary mt-2" id="retry-file-btn">
                        <i class="fas fa-redo"></i> Erneut versuchen
                    </button>
                </div>
            `;
            
            // Event-Listener für "Erneut versuchen"-Button
            document.getElementById('retry-file-btn').addEventListener('click', () => {
                document.getElementById('csv-file-input').value = '';
                resetImportData();
                setupFileUploadArea();
            });
            
            // Nächster Button deaktivieren
            document.getElementById('next-step-1-btn').disabled = true;
            
            // Fehlermeldung anzeigen
            Utils.notifications.error('Fehler beim Lesen der Datei.');
        };
        
        reader.readAsText(file);
    };
    
    /**
     * Backup-Datei verarbeiten
     */
    const handleBackupFileSelection = (file) => {
        if (!file || !file.name.endsWith('.json')) {
            Utils.notifications.error('Bitte wählen Sie eine gültige JSON-Backup-Datei aus.');
            return;
        }
        
        const reader = new FileReader();
        
        // Lade-Anzeige zeigen
        const uploadArea = document.getElementById('backup-upload-area');
        uploadArea.classList.add('processing');
        uploadArea.innerHTML = `
            <div class="loader"></div>
            <h5 class="file-upload-text">Backup wird überprüft...</h5>
        `;
        
        reader.onload = (e) => {
            try {
                // Backup-Daten parsen
                const backupData = JSON.parse(e.target.result);
                
                // Backup validieren
                if (!backupData || !backupData.surveys || !Array.isArray(backupData.surveys)) {
                    throw new Error('Ungültiges Backup-Format');
                }
                
                // Backup-Info anzeigen
                uploadArea.classList.remove('processing');
                uploadArea.innerHTML = `
                    <div class="file-upload-success">
                        <i class="fas fa-check-circle"></i>
                        <h5 class="file-upload-text">Backup-Datei erfolgreich geladen</h5>
                        <p class="file-info">${file.name} (${formatFileSize(file.size)})</p>
                        <div class="backup-info mt-2">
                            <p><strong>Inhalt:</strong> ${backupData.surveys.length} Fragebögen</p>
                            <p><strong>Datum:</strong> ${Utils.date.formatDateTime(backupData.lastModified || backupData.metadata?.created || new Date())}</p>
                        </div>
                        <button class="btn btn-sm btn-outline-secondary mt-2" id="change-backup-btn">
                            <i class="fas fa-sync-alt"></i> Andere Datei wählen
                        </button>
                    </div>
                `;
                
                // Event-Listener für "Andere Datei wählen"-Button
                document.getElementById('change-backup-btn').addEventListener('click', () => {
                    document.getElementById('backup-file-input').value = '';
                    setupBackupUploadArea();
                    document.getElementById('restore-options').style.display = 'none';
                });
                
                // Wiederherstellungs-Optionen anzeigen
                document.getElementById('restore-options').style.display = 'block';
                
                // Aktivitätslog aktualisieren
                addActivityLogEntry(`Backup-Datei "${file.name}" geladen`);
                
                // Backup-Daten zwischenspeichern
                document.getElementById('backup-file-input').dataset.backupData = e.target.result;
                
            } catch (error) {
                console.error('Fehler beim Verarbeiten der Backup-Datei:', error);
                
                // Fehleranzeige
                uploadArea.classList.remove('processing');
                uploadArea.innerHTML = `
                    <div class="file-upload-error">
                        <i class="fas fa-exclamation-circle"></i>
                        <h5 class="file-upload-text">Fehler beim Laden des Backups</h5>
                        <p class="text-danger">${error.message}</p>
                        <button class="btn btn-sm btn-outline-secondary mt-2" id="retry-backup-btn">
                            <i class="fas fa-redo"></i> Erneut versuchen
                        </button>
                    </div>
                `;
                
                // Event-Listener für "Erneut versuchen"-Button
                document.getElementById('retry-backup-btn').addEventListener('click', () => {
                    document.getElementById('backup-file-input').value = '';
                    setupBackupUploadArea();
                });
                
                // Wiederherstellungs-Optionen ausblenden
                document.getElementById('restore-options').style.display = 'none';
                
                // Fehlermeldung anzeigen
                Utils.notifications.error('Fehler beim Laden des Backups: ' + error.message);
            }
        };
        
        reader.onerror = () => {
            // Fehleranzeige
            uploadArea.classList.remove('processing');
            uploadArea.innerHTML = `
                <div class="file-upload-error">
                    <i class="fas fa-exclamation-circle"></i>
                    <h5 class="file-upload-text">Fehler beim Laden der Datei</h5>
                    <p class="text-danger">Die Datei konnte nicht gelesen werden.</p>
                    <button class="btn btn-sm btn-outline-secondary mt-2" id="retry-backup-btn">
                        <i class="fas fa-redo"></i> Erneut versuchen
                    </button>
                </div>
            `;
            
            // Event-Listener für "Erneut versuchen"-Button
            document.getElementById('retry-backup-btn').addEventListener('click', () => {
                document.getElementById('backup-file-input').value = '';
                setupBackupUploadArea();
            });
            
            // Wiederherstellungs-Optionen ausblenden
            document.getElementById('restore-options').style.display = 'none';
            
            // Fehlermeldung anzeigen
            Utils.notifications.error('Fehler beim Lesen der Backup-Datei.');
        };
        
        reader.readAsText(file);
    };
    
    /**
     * CSV-Daten parsen
     */
    const parseCSV = (csvData) => {
        // PapaParse verwenden um CSV zu parsen
        const parseResult = Papa.parse(csvData, {
            delimiter: importOptions.delimiter,
            header: importOptions.hasHeader,
            skipEmptyLines: true,
            dynamicTyping: true
        });
        
        if (parseResult.errors && parseResult.errors.length > 0) {
            // Nicht blockierende Warnungen protokollieren
            parseResult.errors.forEach(error => {
                console.warn('CSV-Parsing-Warnung:', error);
            });
            
            // Kritische Fehler werfen
            const criticalErrors = parseResult.errors.filter(e => e.type === 'Delimiter' || e.type === 'FileNotFound');
            if (criticalErrors.length > 0) {
                throw new Error(criticalErrors[0].message);
            }
        }
        
        // Parsierte Daten speichern
        importData.parsedData = parseResult.data;
        
        // Headers extrahieren oder erzeugen
        if (importOptions.hasHeader) {
            importData.headers = Object.keys(parseResult.data[0] || {});
        } else {
            // Bei fehlenden Headers automatisch erzeugen
            const firstRow = parseResult.data[0] || [];
            importData.headers = Array.from({ length: firstRow.length }, (_, i) => `Spalte ${i + 1}`);
        }
        
        // Preview-Daten für die Vorschau generieren
        importData.previewData = parseResult.data.slice(0, importOptions.previewRows);
        
        // Mapping initialisieren
        initializeFieldMapping();
    };
    
    /**
     * Automatisches Mapping von CSV-Spalten zu Anwendungsfeldern
     */
    const initializeFieldMapping = () => {
        importData.mappings = {};
        
        // Anwendungsfelder definieren
        const appFields = [];
        
        // ID und Timestamp hinzufügen
        appFields.push({ id: 'id', label: 'ID', required: true });
        appFields.push({ id: 'timestamp', label: 'Zeitstempel', required: true });
        
        // Fragen hinzufügen
        SurveySchema.sections.forEach(section => {
            section.questions.forEach(question => {
                appFields.push({
                    id: question.id,
                    label: `${question.id}: ${question.text.substring(0, 50)}${question.text.length > 50 ? '...' : ''}`,
                    required: false
                });
            });
        });
        
        // Demografische Felder hinzufügen
        appFields.push({ id: 'profession', label: 'Berufsgruppe', required: false });
        appFields.push({ id: 'experience', label: 'Berufserfahrung', required: false });
        appFields.push({ id: 'tenure', label: 'Zugehörigkeit zur Abteilung', required: false });
        
        // Automatisches Mapping versuchen
        importData.headers.forEach((header, index) => {
            // Exakte Übereinstimmung
            let matchedField = appFields.find(field => 
                field.id.toLowerCase() === header.toLowerCase()
            );
            
            // Wenn keine exakte Übereinstimmung, nach Teilübereinstimmungen suchen
            if (!matchedField) {
                matchedField = appFields.find(field => 
                    header.toLowerCase().includes(field.id.toLowerCase())
                );
            }
            
            // Wenn Feld gefunden, Mapping setzen
            if (matchedField) {
                importData.mappings[index] = matchedField.id;
            }
        });
    };
    
    /**
     * CSV-Import Schritt wechseln
     */
    const goToImportStep = (stepNumber) => {
        // Alle Schritte ausblenden
        document.querySelectorAll('.import-step').forEach(step => {
            step.classList.remove('active');
        });
        
        // Alle Schritt-Indikatoren zurücksetzen
        document.querySelectorAll('.step').forEach(indicator => {
            indicator.classList.remove('active', 'completed');
        });
        
        // Aktiven Schritt anzeigen
        document.getElementById(`import-step-${stepNumber}`).classList.add('active');
        
        // Aktiven und vorherige Schritt-Indikatoren markieren
        for (let i = 1; i <= 4; i++) {
            const indicator = document.getElementById(`step-indicator-${i}`);
            if (i < stepNumber) {
                indicator.classList.add('completed');
            } else if (i === stepNumber) {
                indicator.classList.add('active');
            }
        }
        
        // Schrittspezifische Aktionen
        if (stepNumber === 2) {
            renderFieldMapping();
        } else if (stepNumber === 3) {
            renderDataValidation();
        }
    };
    
    /**
     * Feldzuordnung rendern
     */
    const renderFieldMapping = () => {
        const mappingTable = document.querySelector('#mapping-table tbody');
        if (!mappingTable) return;
        
        mappingTable.innerHTML = '';
        
        // Anwendungsfelder für Dropdown
        const appFieldOptions = [];
        
        // ID und Timestamp
        appFieldOptions.push(`<option value="id">ID</option>`);
        appFieldOptions.push(`<option value="timestamp">Zeitstempel</option>`);
        
        // Fragen
        SurveySchema.sections.forEach(section => {
            section.questions.forEach(question => {
                const shortText = question.text.substring(0, 50) + (question.text.length > 50 ? '...' : '');
                appFieldOptions.push(`<option value="${question.id}">${question.id}: ${shortText}</option>`);
            });
        });
        
        // Demografische Felder
        appFieldOptions.push(`<option value="profession">Berufsgruppe</option>`);
        appFieldOptions.push(`<option value="experience">Berufserfahrung</option>`);
        appFieldOptions.push(`<option value="tenure">Zugehörigkeit zur Abteilung</option>`);
        
        // Leeroption für kein Mapping
        const noMappingOption = `<option value="">-- Nicht zuordnen --</option>`;
        
        // Für jede CSV-Spalte ein Mapping-Dropdown erstellen
        importData.headers.forEach((header, index) => {
            const row = document.createElement('tr');
            
            // Aktuelles Mapping für diese Spalte
            const currentMapping = importData.mappings[index] || '';
            
            // Vorschaudaten für diese Spalte
            const previewValues = importData.previewData.map(row => {
                const value = row[importOptions.hasHeader ? header : index];
                return value !== null && value !== undefined ? value : '';
            });
            
            // Einfache Vorschau generieren
            const previewText = previewValues
                .slice(0, 2)
                .map(v => String(v).substring(0, 20) + (String(v).length > 20 ? '...' : ''))
                .join(', ');
            
            // Dropdown mit ausgewähltem Mapping
            const mappingDropdown = `
                <select class="form-control field-mapping" data-index="${index}">
                    ${noMappingOption}
                    ${appFieldOptions.map(option => {
                        // Ersetze "value="currentMapping"" mit "value="currentMapping" selected"
                        if (currentMapping && option.includes(`value="${currentMapping}"`)) {
                            return option.replace(`value="${currentMapping}"`, `value="${currentMapping}" selected`);
                        }
                        return option;
                    }).join('')}
                </select>
            `;
            
            row.innerHTML = `
                <td>
                    <strong>${header}</strong>
                </td>
                <td>
                    ${mappingDropdown}
                </td>
                <td class="text-muted small">
                    ${previewText}
                </td>
            `;
            
            mappingTable.appendChild(row);
        });
        
        // Event-Listener für Mapping-Änderungen
        document.querySelectorAll('.field-mapping').forEach(select => {
            select.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index, 10);
                const value = e.target.value;
                
                // Mapping aktualisieren
                if (value) {
                    importData.mappings[index] = value;
                } else {
                    delete importData.mappings[index];
                }
            });
        });
    };
    
    /**
     * Importdaten validieren und Vorschau anzeigen
     */
    const validateImportData = async () => {
        try {
            // Validierung zurücksetzen
            importData.validationResults = {
                validRows: 0,
                invalidRows: 0,
                warnings: [],
                errors: [],
                rowValidation: []
            };
            
            // Prüfen ob mindestens ID oder Timestamp zugeordnet sind
            const hasIdMapping = Object.values(importData.mappings).includes('id');
            const hasTimestampMapping = Object.values(importData.mappings).includes('timestamp');
            
            if (!hasIdMapping && !hasTimestampMapping) {
                Utils.notifications.error('Mindestens ID oder Zeitstempel müssen zugeordnet werden.');
                return false;
            }
            
            // Loader anzeigen
            const validationSummary = document.getElementById('validation-summary');
            if (validationSummary) {
                validationSummary.innerHTML = `
                    <div class="d-flex align-items-center mb-3">
                        <div class="loader me-3"></div>
                        <div>Daten werden validiert...</div>
                    </div>
                `;
            }
            
            // Für jede Zeile ein Objekt nach Mapping erstellen und validieren
            importData.rowValidation = [];
            
            // Transformierte Daten
            const transformedData = [];
            
            // Daten verarbeiten
            for (let rowIndex = 0; rowIndex < importData.parsedData.length; rowIndex++) {
                const row = importData.parsedData[rowIndex];
                const mappedObject = {};
                const rowIssues = [];
                
                // Mapping anwenden
                Object.entries(importData.mappings).forEach(([csvIndex, fieldId]) => {
                    const csvIndexInt = parseInt(csvIndex, 10);
                    const value = row[importOptions.hasHeader ? importData.headers[csvIndexInt] : csvIndexInt];
                    mappedObject[fieldId] = value;
                });
                
                // ID generieren, falls nicht vorhanden
                if (!mappedObject.id) {
                    mappedObject.id = `survey_${Date.now()}_${rowIndex}`;
                    rowIssues.push({ type: 'info', message: 'ID automatisch generiert' });
                }
                
                // Timestamp setzen, falls nicht vorhanden
                if (!mappedObject.timestamp) {
                    mappedObject.timestamp = new Date().toISOString();
                    rowIssues.push({ type: 'info', message: 'Zeitstempel automatisch generiert' });
                }
                
                // Likert-Werte validieren
                SurveySchema.sections.forEach(section => {
                    section.questions.forEach(question => {
                        if (question.type === 'likert' && mappedObject[question.id] !== undefined) {
                            const value = mappedObject[question.id];
                            
                            // Wenn Wert vorhanden ist, prüfen ob es eine gültige Likert-Antwort ist (1-5)
                            if (value !== null && value !== '') {
                                if (!SurveySchema.validators.isValidLikertValue(value)) {
                                    rowIssues.push({ 
                                        type: 'error', 
                                        message: `Ungültiger Likert-Wert für ${question.id}: ${value}`
                                    });
                                }
                            }
                        }
                    });
                });
                
                // Demografische Werte validieren
                if (mappedObject.profession && !SurveySchema.demographicOptions.profession.some(p => p.id === mappedObject.profession)) {
                    rowIssues.push({ 
                        type: 'warning', 
                        message: `Unbekannte Berufsgruppe: ${mappedObject.profession}` 
                    });
                }
                
                if (mappedObject.experience && !SurveySchema.demographicOptions.experience.some(e => e.id === mappedObject.experience)) {
                    rowIssues.push({ 
                        type: 'warning', 
                        message: `Unbekannte Berufserfahrung: ${mappedObject.experience}` 
                    });
                }
                
                if (mappedObject.tenure && !SurveySchema.demographicOptions.tenure.some(t => t.id === mappedObject.tenure)) {
                    rowIssues.push({ 
                        type: 'warning', 
                        message: `Unbekannte Zugehörigkeit: ${mappedObject.tenure}` 
                    });
                }
                
                // Prüfen ob ein bestehender Fragebogen überschrieben werden würde
                const existingEntry = DataManager.getSurveyById(mappedObject.id);
                if (existingEntry) {
                    rowIssues.push({ 
                        type: 'warning', 
                        message: 'Ein Fragebogen mit dieser ID existiert bereits'
                    });
                }
                
                // Zeile als gültig oder ungültig markieren
                const hasErrors = rowIssues.some(issue => issue.type === 'error');
                const validationStatus = hasErrors ? 'invalid' : 'valid';
                
                // Validierungsergebnisse aktualisieren
                if (validationStatus === 'valid') {
                    importData.validationResults.validRows++;
                } else {
                    importData.validationResults.invalidRows++;
                }
                
                // Warnungen und Fehler sammeln
                rowIssues.forEach(issue => {
                    if (issue.type === 'error') {
                        importData.validationResults.errors.push(`Zeile ${rowIndex + 1}: ${issue.message}`);
                    } else if (issue.type === 'warning') {
                        importData.validationResults.warnings.push(`Zeile ${rowIndex + 1}: ${issue.message}`);
                    }
                });
                
                // Zeilenvalidierung speichern
                importData.rowValidation.push({
                    rowIndex,
                    mappedObject,
                    issues: rowIssues,
                    status: validationStatus
                });
                
                // Daten für Import speichern, wenn gültig
                if (validationStatus === 'valid') {
                    transformedData.push(mappedObject);
                }
            }
            
            // Transformierte Daten für späteren Import speichern
            importData.transformedData = transformedData;
            
            // Kurze Verzögerung für bessere UX
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Validierungsergebnisse anzeigen
            renderValidationResults();
            
            return true;
        } catch (error) {
            console.error('Fehler bei der Datenvalidierung:', error);
            Utils.notifications.error('Fehler bei der Datenvalidierung: ' + error.message);
            return false;
        }
    };
    
    /**
     * Validierungsergebnisse anzeigen
     */
    const renderValidationResults = () => {
        const validationSummary = document.getElementById('validation-summary');
        const validationTable = document.getElementById('validation-table');
        
        if (!validationSummary || !validationTable) return;
        
        // Validierungszusammenfassung
        let summaryClass = 'alert-success';
        let summaryIcon = 'check-circle';
        let summaryTitle = 'Daten sind gültig';
        
        if (importData.validationResults.invalidRows > 0) {
            summaryClass = 'alert-danger';
            summaryIcon = 'exclamation-circle';
            summaryTitle = 'Daten enthalten Fehler';
        } else if (importData.validationResults.warnings.length > 0) {
            summaryClass = 'alert-warning';
            summaryIcon = 'exclamation-triangle';
            summaryTitle = 'Daten enthalten Warnungen';
        }
        
        validationSummary.innerHTML = `
            <div class="alert ${summaryClass}">
                <div class="d-flex">
                    <div class="me-3">
                        <i class="fas fa-${summaryIcon} fa-2x"></i>
                    </div>
                    <div>
                        <h6 class="alert-heading">${summaryTitle}</h6>
                        <p class="mb-0">
                            ${importData.validationResults.validRows} von ${importData.parsedData.length} Zeilen sind gültig.
                            ${importData.validationResults.warnings.length > 0 ? 
                                `<br>${importData.validationResults.warnings.length} Warnungen gefunden.` : ''}
                            ${importData.validationResults.errors.length > 0 ? 
                                `<br>${importData.validationResults.errors.length} Fehler gefunden.` : ''}
                        </p>
                    </div>
                </div>
            </div>
        `;
        
        // Validierungstabelle erstellen
        const tableHead = validationTable.querySelector('thead tr');
        const tableBody = validationTable.querySelector('tbody');
        
        // Tabelle zurücksetzen
        tableHead.innerHTML = '<th>#</th><th>Status</th>';
        tableBody.innerHTML = '';
        
        // Spalten für wichtige Felder hinzufügen
        const importantFields = ['id', 'timestamp', 'profession'];
        
        // Felder aus Mapping ermitteln
        const mappedFields = [...new Set(Object.values(importData.mappings))];
        
        // Spalten für Felder erstellen, die im Mapping vorkommen
        importantFields.forEach(field => {
            if (mappedFields.includes(field)) {
                tableHead.innerHTML += `<th>${field}</th>`;
            }
        });
        
        // Spalte für Probleme
        tableHead.innerHTML += '<th>Probleme</th>';
        
        // Zeilen für Validierungsdaten erstellen
        const rowsToShow = importData.rowValidation.slice(0, 10); // Beschränkt auf die ersten 10 Zeilen
        
        rowsToShow.forEach(row => {
            const tr = document.createElement('tr');
            
            // Zeilennummer
            tr.innerHTML = `<td>${row.rowIndex + 1}</td>`;
            
            // Status
            let statusCell = '';
            if (row.status === 'valid') {
                statusCell = '<td><span class="badge bg-success">Gültig</span></td>';
            } else {
                statusCell = '<td><span class="badge bg-danger">Ungültig</span></td>';
            }
            tr.innerHTML += statusCell;
            
            // Wichtige Felder
            importantFields.forEach(field => {
                if (mappedFields.includes(field)) {
                    const value = row.mappedObject[field] || '';
                    tr.innerHTML += `<td>${value}</td>`;
                }
            });
            
            // Probleme
            let issuesCell = '<td>';
            if (row.issues.length > 0) {
                issuesCell += '<ul class="mb-0 ps-3 small">';
                row.issues.forEach(issue => {
                    let issueClass = '';
                    let issueIcon = '';
                    
                    if (issue.type === 'error') {
                        issueClass = 'text-danger';
                        issueIcon = 'exclamation-circle';
                    } else if (issue.type === 'warning') {
                        issueClass = 'text-warning';
                        issueIcon = 'exclamation-triangle';
                    } else {
                        issueClass = 'text-info';
                        issueIcon = 'info-circle';
                    }
                    
                    issuesCell += `
                        <li class="${issueClass}">
                            <i class="fas fa-${issueIcon}"></i> ${issue.message}
                        </li>
                    `;
                });
                issuesCell += '</ul>';
            } else {
                issuesCell += '<span class="text-muted">Keine Probleme</span>';
            }
            issuesCell += '</td>';
            
            tr.innerHTML += issuesCell;
            
            tableBody.appendChild(tr);
        });
        
        // Hinweis wenn nicht alle Zeilen angezeigt werden
        if (importData.rowValidation.length > 10) {
            const infoRow = document.createElement('tr');
            infoRow.innerHTML = `
                <td colspan="${tableHead.querySelectorAll('th').length}">
                    <div class="text-center text-muted">
                        ... und ${importData.rowValidation.length - 10} weitere Zeilen
                    </div>
                </td>
            `;
            tableBody.appendChild(infoRow);
        }
        
        // Event-Listener für Überschreiben-Option
        document.getElementById('overwrite-checkbox').addEventListener('change', (e) => {
            importOptions.overwriteExisting = e.target.checked;
        });
    };
    
    /**
     * Import durchführen
     */
    const performImport = async () => {
        try {
            // Import-Optionen
            const options = {
                overwriteExisting: importOptions.overwriteExisting
            };
            
            // Import-Ergebnisse anzeigen
            const resultsContainer = document.getElementById('import-results');
            if (!resultsContainer) return;
            
            // Ladeanimation anzeigen
            resultsContainer.innerHTML = `
                <div class="text-center p-4">
                    <div class="loader mb-3"></div>
                    <h5>Daten werden importiert...</h5>
                    <p class="text-muted">Bitte warten Sie, während die Daten importiert werden.</p>
                </div>
            `;
            
            // Kurze Verzögerung für bessere UX
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Import durchführen
            const result = DataManager.importSurveys(importData.transformedData, options);
            
            // Ergebnis anzeigen
            let resultClass = result.success ? 'success' : 'danger';
            let resultIcon = result.success ? 'check-circle' : 'exclamation-circle';
            let resultTitle = result.success ? 'Import erfolgreich' : 'Import fehlgeschlagen';
            
            resultsContainer.innerHTML = `
                <div class="text-center p-4">
                    <div class="import-result-icon text-${resultClass} mb-3">
                        <i class="fas fa-${resultIcon} fa-4x"></i>
                    </div>
                    <h5>${resultTitle}</h5>
                    
                    <div class="import-stats mt-4">
                        <div class="row">
                            <div class="col-md-4">
                                <div class="stat-card p-3">
                                    <div class="stat-card-title">Importiert</div>
                                    <div class="stat-card-value">${result.imported}</div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="stat-card p-3">
                                    <div class="stat-card-title">Übersprungen</div>
                                    <div class="stat-card-value">${result.skipped || 0}</div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="stat-card p-3">
                                    <div class="stat-card-title">Überschrieben</div>
                                    <div class="stat-card-value">${result.overwritten || 0}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-4">
                        ${result.success ? `
                            <p class="text-muted">Die Daten wurden erfolgreich importiert und stehen nun zur Verfügung.</p>
                        ` : `
                            <div class="alert alert-danger">
                                <p class="mb-2">Beim Import sind Fehler aufgetreten:</p>
                                <ul class="mb-0 text-start">
                                    ${result.errors.map(error => `<li>${error}</li>`).join('')}
                                </ul>
                            </div>
                        `}
                    </div>
                </div>
            `;
            
            // Import-Schritt abschließen
            goToImportStep(4);
            
            // Aktivitätslog aktualisieren
            if (result.success) {
                addActivityLogEntry(`${result.imported} Datensätze importiert`);
            } else {
                addActivityLogEntry(`Import fehlgeschlagen: ${result.errors[0]}`);
            }
            
            // Benachrichtigung anzeigen
            if (result.success) {
                Utils.notifications.success(`${result.imported} Datensätze erfolgreich importiert.`);
            } else {
                Utils.notifications.error(`Import fehlgeschlagen: ${result.errors[0]}`);
            }
            
            // Bei Erfolg App über Änderung informieren
            if (result.success) {
                Utils.eventBus.emit('dataChanged', { source: 'import', action: 'import', count: result.imported });
            }
            
            return result.success;
        } catch (error) {
            console.error('Fehler beim Import der Daten:', error);
            
            // Fehlermeldung anzeigen
            const resultsContainer = document.getElementById('import-results');
            if (resultsContainer) {
                resultsContainer.innerHTML = `
                    <div class="text-center p-4">
                        <div class="import-result-icon text-danger mb-3">
                            <i class="fas fa-exclamation-circle fa-4x"></i>
                        </div>
                        <h5>Import fehlgeschlagen</h5>
                        <div class="alert alert-danger mt-3">
                            ${error.message}
                        </div>
                    </div>
                `;
            }
            
            // Import-Schritt abschließen
            goToImportStep(4);
            
            // Aktivitätslog aktualisieren
            addActivityLogEntry(`Import fehlgeschlagen: ${error.message}`);
            
            // Benachrichtigung anzeigen
            Utils.notifications.error(`Fehler beim Import: ${error.message}`);
            
            return false;
        }
    };
    
    /**
     * Import-Daten zurücksetzen
     */
    const resetImportData = () => {
        importData = {
            rawData: null,
            parsedData: null,
            headers: [],
            mappings: {},
            previewData: [],
            transformedData: [],
            validationResults: {
                validRows: 0,
                invalidRows: 0,
                warnings: [],
                errors: []
            }
        };
    };
    
    /**
     * Export-Dateinamen aktualisieren
     */
    const updateExportFilename = () => {
        const filenameInput = document.getElementById('export-filename');
        if (!filenameInput) return;
        
        // Basisname ohne Datum und Endung
        let baseName = filenameInput.value;
        
        // Endet bereits mit .csv?
        if (baseName.endsWith('.csv')) {
            baseName = baseName.substring(0, baseName.length - 4);
        }
        
        // Enthält bereits ein Datum?
        const datePattern = /_\d{4}-\d{2}-\d{2}/;
        if (datePattern.test(baseName)) {
            baseName = baseName.replace(datePattern, '');
        }
        
        // Neuen Dateinamen generieren
        let newFilename = baseName;
        
        // Zeitstempel hinzufügen, wenn gewünscht
        if (exportOptions.includeTimestamp) {
            const now = new Date();
            const dateString = now.toISOString().split('T')[0]; // YYYY-MM-DD
            newFilename += `_${dateString}`;
        }
        
        // Dateiendung hinzufügen
        newFilename += '.csv';
        
        // Dateinamen aktualisieren
        filenameInput.value = newFilename;
        exportOptions.filename = newFilename;
    };
    
    /**
     * Export-Vorschau generieren
     */
    const generateExportPreview = () => {
        try {
            // Daten laden
            let surveys = DataManager.getAllSurveys();
            
            // Filter anwenden
            surveys = applyExportFilters(surveys);
            
            // Vorschau-Container
            const previewContainer = document.getElementById('export-preview-container');
            const countBadge = document.getElementById('export-count-badge');
            
            if (previewContainer) {
                if (surveys.length === 0) {
                    previewContainer.innerHTML = `
                        <div class="placeholder-text">
                            Keine Daten zum Exportieren vorhanden.
                        </div>
                    `;
                } else {
                    // Begrenzte Anzahl an Datensätzen für die Vorschau
                    const previewSurveys = surveys.slice(0, 5);
                    
                    // Tabelle für die Vorschau erstellen
                    let tableHTML = '<div class="table-responsive"><table class="table table-sm table-bordered">';
                    
                    // Header
                    tableHTML += '<thead><tr>';
                    tableHTML += '<th>ID</th>';
                    tableHTML += '<th>Zeitstempel</th>';
                    tableHTML += '<th>Berufsgruppe</th>';
                    tableHTML += '<th>Beispielfragen...</th>';
                    tableHTML += '</tr></thead>';
                    
                    // Body
                    tableHTML += '<tbody>';
                    previewSurveys.forEach(survey => {
                        tableHTML += '<tr>';
                        tableHTML += `<td>${survey.id}</td>`;
                        tableHTML += `<td>${Utils.date.formatDateTime(survey.timestamp)}</td>`;
                        
                        // Berufsgruppe formatieren
                        let professionDisplay = 'Nicht angegeben';
                        if (survey.profession) {
                            const professionObj = SurveySchema.demographicOptions.profession.find(p => p.id === survey.profession);
                            professionDisplay = professionObj ? professionObj.label : 'Nicht angegeben';
                        }
                        tableHTML += `<td>${professionDisplay}</td>`;
                        
                        // Beispielantworten (Q1, Q10, Q20)
                        const answers = [
                            survey.q1 !== null && survey.q1 !== undefined ? survey.q1 : '-',
                            survey.q10 !== null && survey.q10 !== undefined ? survey.q10 : '-',
                            survey.q20 !== null && survey.q20 !== undefined ? survey.q20 : '-'
                        ].join(', ');
                        
                        tableHTML += `<td>Antworten: ${answers}</td>`;
                        tableHTML += '</tr>';
                    });
                    tableHTML += '</tbody></table></div>';
                    
                    // Hinweis, wenn nicht alle angezeigt werden
                    if (surveys.length > 5) {
                        tableHTML += `
                            <div class="text-center text-muted mt-2">
                                <em>Vorschau begrenzt auf 5 von ${surveys.length} Datensätzen</em>
                            </div>
                        `;
                    }
                    
                    previewContainer.innerHTML = tableHTML;
                }
            }
            
            // Anzahl der Datensätze anzeigen
            if (countBadge) {
                countBadge.textContent = `${surveys.length} Datensätze`;
            }
            
            return surveys.length;
        } catch (error) {
            console.error('Fehler beim Generieren der Export-Vorschau:', error);
            
            // Fehlermeldung anzeigen
            const previewContainer = document.getElementById('export-preview-container');
            if (previewContainer) {
                previewContainer.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle"></i> 
                        Fehler beim Generieren der Vorschau: ${error.message}
                    </div>
                `;
            }
            
            return 0;
        }
    };
    
    /**
     * Filter auf Export-Daten anwenden
     */
    const applyExportFilters = (surveys) => {
        try {
            // Keine Filter ohne Daten
            if (!surveys || !Array.isArray(surveys) || surveys.length === 0) {
                return [];
            }
            
            let filteredSurveys = [...surveys];
            
            // Berufsgruppen-Filter
            const professionFilter = document.getElementById('export-profession-filter');
            if (professionFilter && professionFilter.value) {
                filteredSurveys = filteredSurveys.filter(survey => 
                    survey.profession === professionFilter.value
                );
            }
            
            // Vollständigkeits-Filter
            const completenessFilter = document.getElementById('export-completeness-filter');
            if (completenessFilter && completenessFilter.value) {
                const minCompleteness = parseFloat(completenessFilter.value);
                if (!isNaN(minCompleteness) && minCompleteness > 0) {
                    filteredSurveys = filteredSurveys.filter(survey => {
                        const completeness = SurveySchema.validators.getSurveyCompleteness(survey);
                        return completeness >= minCompleteness;
                    });
                }
            }
            
            return filteredSurveys;
        } catch (error) {
            console.error('Fehler beim Anwenden der Export-Filter:', error);
            return surveys; // Im Fehlerfall die Originaldaten zurückgeben
        }
    };
    
    /**
     * CSV exportieren
     */
    const exportCSV = () => {
        try {
            // Daten laden und filtern
            let surveys = DataManager.getAllSurveys();
            surveys = applyExportFilters(surveys);
            
            if (surveys.length === 0) {
                Utils.notifications.warning('Keine Daten zum Exportieren vorhanden.');
                return;
            }
            
            // CSV-Export-Optionen
            const options = {
                delimiter: exportOptions.delimiter,
                includeHeader: exportOptions.includeHeader,
                download: true,
                filename: exportOptions.filename
            };
            
            // CSV exportieren
            const result = DataManager.exportToCSV(options);
            
            if (result.success) {
                // Aktivitätslog aktualisieren
                addActivityLogEntry(`${surveys.length} Datensätze als CSV exportiert`);
                
                // Benachrichtigung anzeigen
                Utils.notifications.success(`${surveys.length} Datensätze erfolgreich exportiert.`);
            } else {
                // Fehlermeldung anzeigen
                Utils.notifications.error(`Export fehlgeschlagen: ${result.errors.join(', ')}`);
            }
            
            return result.success;
        } catch (error) {
            console.error('Fehler beim CSV-Export:', error);
            Utils.notifications.error(`Fehler beim Export: ${error.message}`);
            return false;
        }
    };
    
    /**
     * Excel exportieren
     */
    const exportExcel = () => {
        try {
            Utils.notifications.warning('Excel-Export ist in dieser Version nicht verfügbar.');
            // In einer realen Implementierung würde hier ExcelJS oder ein ähnliches Tool eingebunden
            return false;
        } catch (error) {
            console.error('Fehler beim Excel-Export:', error);
            Utils.notifications.error(`Fehler beim Export: ${error.message}`);
            return false;
        }
    };
    
    /**
     * JSON exportieren
     */
    const exportJSON = () => {
        try {
            // Daten laden und filtern
            let surveys = DataManager.getAllSurveys();
            surveys = applyExportFilters(surveys);
            
            if (surveys.length === 0) {
                Utils.notifications.warning('Keine Daten zum Exportieren vorhanden.');
                return;
            }
            
            // Dateiname generieren
            const filename = exportOptions.filename.replace('.csv', '.json');
            
            // JSON exportieren
            Utils.file.downloadJSON(surveys, filename);
            
            // Aktivitätslog aktualisieren
            addActivityLogEntry(`${surveys.length} Datensätze als JSON exportiert`);
            
            // Benachrichtigung anzeigen
            Utils.notifications.success(`${surveys.length} Datensätze erfolgreich als JSON exportiert.`);
            
            return true;
        } catch (error) {
            console.error('Fehler beim JSON-Export:', error);
            Utils.notifications.error(`Fehler beim Export: ${error.message}`);
            return false;
        }
    };
    
    /**
     * Daten teilen
     */
    const shareData = () => {
        try {
            App.shareProjectUrl().then(url => {
                if (url) {
                    // URL wurde erstellt und in die Zwischenablage kopiert
                    addActivityLogEntry('Projektteilungs-URL generiert');
                }
            });
        } catch (error) {
            console.error('Fehler beim Teilen der Daten:', error);
            Utils.notifications.error(`Fehler beim Teilen: ${error.message}`);
            return false;
        }
    };
    
    /**
     * Backup erstellen
     */
    const createBackup = () => {
        try {
            // Backup-Optionen
            const options = {
                includeSettings: backupOptions.includeSettings,
                download: true,
                filename: backupOptions.backupFilename
            };
            
            // Backup erstellen
            const result = DataManager.exportProject(options);
            
            if (result.success) {
                // In Backup-Historie speichern
                addBackupToHistory({
                    date: new Date().toISOString(),
                    type: 'manual',
                    size: formatFileSize(JSON.stringify(result.projectData).length),
                    count: result.projectData.surveys.length,
                    filename: options.filename
                });
                
                // Aktivitätslog aktualisieren
                addActivityLogEntry(`Projekt-Backup erstellt (${result.surveyCount} Datensätze)`);
                
                // Benachrichtigung anzeigen
                Utils.notifications.success(`Projekt-Backup erfolgreich erstellt.`);
            } else {
                // Fehlermeldung anzeigen
                Utils.notifications.error(`Backup fehlgeschlagen: ${result.errors.join(', ')}`);
            }
            
            return result.success;
        } catch (error) {
            console.error('Fehler beim Erstellen des Backups:', error);
            Utils.notifications.error(`Fehler beim Backup: ${error.message}`);
            return false;
        }
    };
    
    /**
     * Backup wiederherstellen
     */
    const confirmRestoreBackup = () => {
        // Backup-Datei abrufen
        const fileInput = document.getElementById('backup-file-input');
        if (!fileInput || !fileInput.dataset.backupData) {
            Utils.notifications.error('Keine Backup-Datei ausgewählt.');
            return;
        }
        
        // Optionen für die Wiederherstellung
        const restoreSettings = document.getElementById('restore-settings-checkbox').checked;
        const mergeData = document.getElementById('merge-data-checkbox').checked;
        
        // Bestätigung anfordern
        Utils.modal.confirm(
            `<div class="mb-3">
                <p><strong>Achtung:</strong> Bei der Wiederherstellung werden vorhandene Daten überschrieben.</p>
                <p>Möchten Sie wirklich fortfahren?</p>
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle"></i> 
                    Diese Aktion kann nicht rückgängig gemacht werden!
                </div>
            </div>`,
            () => {
                restoreBackup(fileInput.dataset.backupData, { restoreSettings, mergeData });
            },
            null,
            {
                title: 'Backup wiederherstellen',
                confirmText: 'Wiederherstellen',
                cancelText: 'Abbrechen'
            }
        );
    };
    
    /**
     * Backup wiederherstellen
     */
    const restoreBackup = (backupData, options = {}) => {
        try {
            // Backup-Daten parsen
            const projectData = JSON.parse(backupData);
            
            // Backup validieren
            if (!projectData || !projectData.surveys || !Array.isArray(projectData.surveys)) {
                throw new Error('Ungültiges Backup-Format');
            }
            
            // Wenn Einstellungen nicht wiederhergestellt werden sollen, entfernen
            if (!options.restoreSettings) {
                delete projectData.appSettings;
            }
            
            // Backup in den DataManager importieren
            const result = DataManager.importProject(projectData, {
                backup: true,
                merge: options.mergeData
            });
            
            if (result.success) {
                // In Backup-Historie speichern
                addBackupToHistory({
                    date: new Date().toISOString(),
                    type: 'restore',
                    size: formatFileSize(backupData.length),
                    count: projectData.surveys.length,
                    filename: 'Wiederherstellung'
                });
                
                // Aktivitätslog aktualisieren
                addActivityLogEntry(`Projekt-Backup wiederhergestellt (${projectData.surveys.length} Datensätze)`);
                
                // Benachrichtigung anzeigen
                Utils.notifications.success(`Projekt erfolgreich wiederhergestellt.`);
                
                // Zur Hauptansicht zurückkehren
                setTimeout(() => {
                    showMainView();
                    
                    // App über Änderung informieren
                    Utils.eventBus.emit('dataChanged', { 
                        source: 'import', 
                        action: 'restore', 
                        count: projectData.surveys.length 
                    });
                }, 1000);
            } else {
                // Fehlermeldung anzeigen
                Utils.notifications.error(`Wiederherstellung fehlgeschlagen: ${result.errors ? result.errors.join(', ') : 'Unbekannter Fehler'}`);
            }
            
            return result.success;
        } catch (error) {
            console.error('Fehler bei der Wiederherstellung des Backups:', error);
            Utils.notifications.error(`Fehler bei der Wiederherstellung: ${error.message}`);
            return false;
        }
    };
    
    /**
     * Backup zur Historie hinzufügen
     */
    const addBackupToHistory = (backupInfo) => {
        try {
            // Backup-Historie aus dem LocalStorage laden
            let history = Utils.storage.get('backup_history') || [];
            
            // Neues Backup hinzufügen
            history.unshift(backupInfo);
            
            // Maximal 10 Einträge behalten
            if (history.length > 10) {
                history = history.slice(0, 10);
            }
            
            // In LocalStorage speichern
            Utils.storage.set('backup_history', history);
            
            // Backup-Historie aktualisieren
            loadBackupHistory();
            
            return true;
        } catch (error) {
            console.error('Fehler beim Hinzufügen zur Backup-Historie:', error);
            return false;
        }
    };
    
    /**
     * Backup-Historie laden
     */
    const loadBackupHistory = () => {
        try {
            // Backup-Historie aus dem LocalStorage laden
            const history = Utils.storage.get('backup_history') || [];
            
            // Tabelle aktualisieren
            const tableBody = document.querySelector('#backup-history-table tbody');
            if (!tableBody) return;
            
            if (history.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Keine Backup-Historie vorhanden</td></tr>';
                return;
            }
            
            tableBody.innerHTML = '';
            
            history.forEach((backup, index) => {
                const row = document.createElement('tr');
                
                let typeIcon, typeText, statusBadge;
                
                if (backup.type === 'manual') {
                    typeIcon = 'fa-user';
                    typeText = 'Manuell';
                    statusBadge = '<span class="badge bg-success">Erstellt</span>';
                } else if (backup.type === 'auto') {
                    typeIcon = 'fa-clock';
                    typeText = 'Automatisch';
                    statusBadge = '<span class="badge bg-info">Auto</span>';
                } else {
                    typeIcon = 'fa-cloud-download-alt';
                    typeText = 'Wiederherstellung';
                    statusBadge = '<span class="badge bg-primary">Wiederhergestellt</span>';
                }
                
                row.innerHTML = `
                    <td>${Utils.date.formatDateTime(backup.date)}</td>
                    <td><i class="fas ${typeIcon}"></i> ${typeText}</td>
                    <td>${backup.size}</td>
                    <td>${backup.count} Fragebögen</td>
                    <td>${statusBadge}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-secondary backup-info-btn" data-index="${index}">
                            <i class="fas fa-info-circle"></i>
                        </button>
                    </td>
                `;
                
                tableBody.appendChild(row);
            });
            
            // Event-Listener für Info-Buttons
            document.querySelectorAll('.backup-info-btn').forEach(button => {
                button.addEventListener('click', () => {
                    const index = parseInt(button.dataset.index, 10);
                    showBackupInfo(history[index]);
                });
            });
            
            return true;
        } catch (error) {
            console.error('Fehler beim Laden der Backup-Historie:', error);
            return false;
        }
    };
    
    /**
     * Backup-Info anzeigen
     */
    const showBackupInfo = (backup) => {
        if (!backup) return;
        
        Utils.modal.alert(`
            <div class="backup-info-modal">
                <p><strong>Zeitpunkt:</strong> ${Utils.date.formatDateTime(backup.date)}</p>
                <p><strong>Typ:</strong> ${backup.type === 'manual' ? 'Manuell' : 
                                         backup.type === 'auto' ? 'Automatisch' : 'Wiederherstellung'}</p>
                <p><strong>Datensätze:</strong> ${backup.count}</p>
                <p><strong>Größe:</strong> ${backup.size}</p>
                <p><strong>Dateiname:</strong> ${backup.filename}</p>
            </div>
        `, null, { title: 'Backup-Informationen' });
    };
    
    /**
     * Backup-Historie leeren
     */
    const clearBackupHistory = () => {
        Utils.modal.confirm(
            'Möchten Sie wirklich die gesamte Backup-Historie löschen?',
            () => {
                // Historie löschen
                Utils.storage.remove('backup_history');
                
                // Tabelle aktualisieren
                loadBackupHistory();
                
                // Aktivitätslog aktualisieren
                addActivityLogEntry('Backup-Historie gelöscht');
                
                // Benachrichtigung anzeigen
                Utils.notifications.success('Backup-Historie gelöscht.');
            },
            null,
            {
                title: 'Backup-Historie löschen',
                confirmText: 'Löschen',
                cancelText: 'Abbrechen'
            }
        );
    };
    
    /**
     * Datenstatus anzeigen
     */
    const loadDataStatus = () => {
        const statusContainer = document.getElementById('data-status');
        if (!statusContainer) return;
        
        try {
            // Daten laden
            const surveys = DataManager.getAllSurveys();
            const state = DataManager.getState();
            
            if (surveys.length === 0) {
                statusContainer.innerHTML = `
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i> Keine Daten vorhanden
                        <p class="mb-0 mt-2">
                            Importieren Sie Daten oder erfassen Sie Fragebögen, 
                            um sie hier anzuzeigen.
                        </p>
                    </div>
                `;
                return;
            }
            
            // Letzte Änderung
            const lastModified = state.lastModified ? 
                Utils.date.formatDateTime(state.lastModified) : 
                'Unbekannt';
            
            // Vollständigkeit berechnen
            const completeSurveys = surveys.filter(survey => 
                SurveySchema.validators.getSurveyCompleteness(survey) >= 0.95
            ).length;
            
            const completenessPercentage = Math.round((completeSurveys / surveys.length) * 100);
            
            // Verteilung nach Berufsgruppen
            const professionCounts = {};
            SurveySchema.demographicOptions.profession.forEach(p => {
                professionCounts[p.id] = 0;
            });
            professionCounts.undefined = 0;
            
            surveys.forEach(survey => {
                const prof = survey.profession || 'undefined';
                professionCounts[prof] = (professionCounts[prof] || 0) + 1;
            });
            
            // Status-HTML generieren
            let statusHTML = `
                <div class="data-status-grid">
                    <div class="status-item">
                        <div class="status-label">Fragebögen gesamt</div>
                        <div class="status-value">${surveys.length}</div>
                    </div>
                    <div class="status-item">
                        <div class="status-label">Vollständige Fragebögen</div>
                        <div class="status-value">${completeSurveys} (${completenessPercentage}%)</div>
                    </div>
                    <div class="status-item">
                        <div class="status-label">Letzte Änderung</div>
                        <div class="status-value">${lastModified}</div>
                    </div>
                    <div class="status-item">
                        <div class="status-label">Speichernutzung</div>
                        <div class="status-value">${formatFileSize(JSON.stringify(state).length)}</div>
                    </div>
                </div>
                
                <div class="mt-3">
                    <h6>Verteilung nach Berufsgruppen</h6>
                    <div class="distribution-bars">
            `;
            
            // Berufsgruppen-Verteilungs-Balken
            SurveySchema.demographicOptions.profession.forEach(profession => {
                const count = professionCounts[profession.id] || 0;
                const percentage = Math.round((count / surveys.length) * 100);
                
                statusHTML += `
                    <div class="distribution-item">
                        <div class="distribution-label">${profession.label}</div>
                        <div class="distribution-bar-container">
                            <div class="distribution-bar" style="width: ${percentage}%"></div>
                            <div class="distribution-value">${count} (${percentage}%)</div>
                        </div>
                    </div>
                `;
            });
            
            // Nicht angegeben
            const undefinedCount = professionCounts.undefined || 0;
            const undefinedPercentage = Math.round((undefinedCount / surveys.length) * 100);
            
            if (undefinedCount > 0) {
                statusHTML += `
                    <div class="distribution-item">
                        <div class="distribution-label">Nicht angegeben</div>
                        <div class="distribution-bar-container">
                            <div class="distribution-bar" style="width: ${undefinedPercentage}%"></div>
                            <div class="distribution-value">${undefinedCount} (${undefinedPercentage}%)</div>
                        </div>
                    </div>
                `;
            }
            
            statusHTML += `
                    </div>
                </div>
            `;
            
            statusContainer.innerHTML = statusHTML;
            
        } catch (error) {
            console.error('Fehler beim Laden des Datenstatus:', error);
            statusContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle"></i> Fehler beim Laden des Datenstatus
                    <p class="mb-0 mt-2">${error.message}</p>
                </div>
            `;
        }
    };
    
    /**
     * Aktivitätslog laden
     */
    const loadActivityLog = () => {
        try {
            const logContainer = document.getElementById('activity-log');
            if (!logContainer) return;
            
            // Log aus dem LocalStorage laden
            const logEntries = Utils.storage.get('activity_log') || [];
            
            if (logEntries.length === 0) {
                logContainer.innerHTML = '<div class="placeholder-text">Keine Aktivitäten vorhanden</div>';
                return;
            }
            
            // HTML für Log-Einträge generieren
            let logHTML = '';
            
            logEntries.forEach(entry => {
                let iconClass = 'info-circle';
                
                if (entry.message.includes('erfolgreich')) {
                    iconClass = 'check-circle text-success';
                } else if (entry.message.includes('fehler') || entry.message.includes('Fehler')) {
                    iconClass = 'exclamation-circle text-danger';
                } else if (entry.message.includes('gelöscht')) {
                    iconClass = 'trash-alt text-danger';
                } else if (entry.message.includes('importiert')) {
                    iconClass = 'file-import text-primary';
                } else if (entry.message.includes('exportiert')) {
                    iconClass = 'file-export text-success';
                } else if (entry.message.includes('Backup')) {
                    iconClass = 'save text-info';
                }
                
                logHTML += `
                    <div class="log-entry">
                        <i class="fas fa-${iconClass} log-icon"></i>
                        <span class="log-timestamp">${Utils.date.formatDateTime(entry.timestamp)}</span>
                        <span class="log-message">${entry.message}</span>
                    </div>
                `;
            });
            
            logContainer.innerHTML = logHTML;
            
        } catch (error) {
            console.error('Fehler beim Laden des Aktivitätslogs:', error);
        }
    };
    
    /**
     * Eintrag zum Aktivitätslog hinzufügen
     */
    const addActivityLogEntry = (message) => {
        try {
            // Eintrag erstellen
            const entry = {
                timestamp: new Date().toISOString(),
                message: message
            };
            
            // Log aus dem LocalStorage laden
            let logEntries = Utils.storage.get('activity_log') || [];
            
            // Neuen Eintrag hinzufügen
            logEntries.unshift(entry);
            
            // Maximal 50 Einträge behalten
            if (logEntries.length > 50) {
                logEntries = logEntries.slice(0, 50);
            }
            
            // In LocalStorage speichern
            Utils.storage.set('activity_log', logEntries);
            
            // Wenn Log-Container vorhanden, Eintrag direkt hinzufügen
            const logContainer = document.getElementById('activity-log');
            if (logContainer && !logContainer.querySelector('.placeholder-text')) {
                let iconClass = 'info-circle';
                
                if (message.includes('erfolgreich')) {
                    iconClass = 'check-circle text-success';
                } else if (message.includes('fehler') || message.includes('Fehler')) {
                    iconClass = 'exclamation-circle text-danger';
                } else if (message.includes('gelöscht')) {
                    iconClass = 'trash-alt text-danger';
                } else if (message.includes('importiert')) {
                    iconClass = 'file-import text-primary';
                } else if (message.includes('exportiert')) {
                    iconClass = 'file-export text-success';
                } else if (message.includes('Backup')) {
                    iconClass = 'save text-info';
                }
                
                const newEntryHTML = `
                    <div class="log-entry">
                        <i class="fas fa-${iconClass} log-icon"></i>
                        <span class="log-timestamp">Gerade eben</span>
                        <span class="log-message">${message}</span>
                    </div>
                `;
                
                // Neuen Eintrag am Anfang einfügen
                const firstEntry = logContainer.querySelector('.log-entry');
                if (firstEntry) {
                    firstEntry.insertAdjacentHTML('beforebegin', newEntryHTML);
                } else {
                    logContainer.innerHTML = newEntryHTML;
                }
            }
            
            return true;
        } catch (error) {
            console.error('Fehler beim Hinzufügen des Aktivitätslogeintrags:', error);
            return false;
        }
    };
    
    /**
     * Aktivitätslog leeren
     */
    const clearActivityLog = () => {
        try {
            Utils.modal.confirm(
                'Möchten Sie wirklich das Aktivitätslog löschen?',
                () => {
                    // Log löschen
                    Utils.storage.remove('activity_log');
                    
                    // Log-Container aktualisieren
                    const logContainer = document.getElementById('activity-log');
                    if (logContainer) {
                        logContainer.innerHTML = '<div class="placeholder-text">Keine Aktivitäten vorhanden</div>';
                    }
                    
                    // Benachrichtigung anzeigen
                    Utils.notifications.success('Aktivitätslog gelöscht.');
                },
                null,
                {
                    title: 'Aktivitätslog löschen',
                    confirmText: 'Löschen',
                    cancelText: 'Abbrechen'
                }
            );
            
            return true;
        } catch (error) {
            console.error('Fehler beim Löschen des Aktivitätslogs:', error);
            return false;
        }
    };
    
    /**
     * Dateigröße formatieren
     */
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
        // Referenzen zurücksetzen
        container = null;
        currentView = 'main';
        
        // Import-Daten zurücksetzen
        resetImportData();
    };
    
    // Öffentliche API
    return {
        init,
        show,
        hide,
        dispose,
        showMainView,
        showImportView,
        showExportView,
        showBackupView,
        addActivityLogEntry
    };
})();