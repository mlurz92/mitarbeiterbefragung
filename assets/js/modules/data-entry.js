/**
 * data-entry.js
 * Datenerfassungs-Modul für die Mitarbeiterbefragung
 * Ermöglicht die Erfassung, Bearbeitung und Verwaltung von Fragebogendaten
 */

window.DataEntryModule = (() => {
    // Modul-Elemente
    let container = null;
    let currentView = 'list'; // 'list' oder 'form'
    let currentSurvey = null; // Aktuell bearbeiteter Fragebogen
    let unsavedChanges = false; // Tracker für ungespeicherte Änderungen
    let formProgress = 0; // Fortschritt bei der Formularausfüllung (0-100%)
    let formSections = []; // Abschnitte des Formulars für Navigation
    
    // Lokaler Cache für Fragebögen (für Undo-Funktionalität)
    let surveysCache = {};
    
    /**
     * Datenerfassungs-Modul initialisieren
     */
    const init = async (targetContainer) => {
        try {
            container = targetContainer;
            
            // Basis-Layout erstellen
            createLayout();
            
            // Standard-Ansicht zeigen
            showListView();
            
            // Event-Listener für den "Zurück"-Button im Browser
            window.addEventListener('popstate', handlePopState);
            
            return true;
        } catch (error) {
            console.error('Fehler bei der Initialisierung des Datenerfassungs-Moduls:', error);
            container.innerHTML = `<div class="alert alert-danger">
                <h4>Fehler beim Laden des Datenerfassungs-Moduls</h4>
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
            <div class="data-entry-container">
                <div class="section-header d-flex justify-content-between align-items-center">
                    <div>
                        <h2>
                            <i class="fas fa-edit"></i> 
                            Datenerfassung
                        </h2>
                        <p class="section-description">
                            Erfassen und verwalten Sie Fragebögen der Mitarbeiterbefragung
                        </p>
                    </div>
                    <div class="actions" id="view-actions">
                        <!-- Dynamische Aktions-Buttons -->
                    </div>
                </div>
                
                <!-- Hauptinhalt - dynamisch befüllt -->
                <div id="data-entry-content" class="mt-4">
                    <!-- Wird dynamisch mit Liste oder Formular befüllt -->
                </div>
            </div>
        `;
    };
    
    /**
     * Liste der vorhandenen Fragebögen anzeigen
     */
    const showListView = () => {
        currentView = 'list';
        currentSurvey = null;
        unsavedChanges = false;
        
        // View-Actions aktualisieren
        const actionsContainer = document.getElementById('view-actions');
        actionsContainer.innerHTML = `
            <button id="new-survey-btn" class="btn btn-primary me-2">
                <i class="fas fa-plus"></i> Neuer Fragebogen
            </button>
        `;
        
        // Event-Listener für "Neuer Fragebogen"-Button
        document.getElementById('new-survey-btn').addEventListener('click', () => {
            showFormView();
        });
        
        // Content-Container leeren und Tabelle erstellen
        const contentContainer = document.getElementById('data-entry-content');
        contentContainer.innerHTML = `
            <div class="card mb-4">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Erfasste Fragebögen</h5>
                    <div class="input-group search-box" style="max-width: 300px;">
                        <input type="text" id="survey-search" class="form-control" placeholder="Fragebögen durchsuchen">
                        <button class="btn btn-outline-secondary" type="button">
                            <i class="fas fa-search"></i>
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="table-container">
                        <table class="table table-hover" id="surveys-table">
                            <thead>
                                <tr>
                                    <th data-sortable="true" data-key="id">ID</th>
                                    <th data-sortable="true" data-key="timestamp">Datum</th>
                                    <th data-sortable="true" data-key="profession">Berufsgruppe</th>
                                    <th data-sortable="true" data-key="completeness">Vollständigkeit</th>
                                    <th>Aktionen</th>
                                </tr>
                            </thead>
                            <tbody>
                                <!-- Wird dynamisch befüllt -->
                            </tbody>
                        </table>
                    </div>
                    <div id="no-surveys-message" class="text-center py-4" style="display: none;">
                        <p class="text-muted">Keine Fragebögen vorhanden</p>
                        <button id="create-first-survey" class="btn btn-outline-primary mt-2">
                            <i class="fas fa-plus-circle"></i> Ersten Fragebogen erstellen
                        </button>
                    </div>
                    <div id="table-pagination" class="mt-3">
                        <!-- Pagination wird hier eingefügt -->
                    </div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">Statistik</h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="stat-item mb-3">
                                <div class="stat-label">Gesamt erfasst:</div>
                                <div class="stat-value" id="stat-total">0</div>
                            </div>
                            <div class="stat-item mb-3">
                                <div class="stat-label">Vollständig ausgefüllt:</div>
                                <div class="stat-value" id="stat-complete">0</div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="stat-item mb-3">
                                <div class="stat-label">Durchschnittliche Vollständigkeit:</div>
                                <div class="stat-value" id="stat-avg-completeness">0%</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-label">Letzte Erfassung:</div>
                                <div class="stat-value" id="stat-last-entry">-</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Tabellendaten laden
        loadSurveysTable();
        
        // Event-Listener für den "Ersten Fragebogen erstellen"-Button
        const createFirstButton = document.getElementById('create-first-survey');
        if (createFirstButton) {
            createFirstButton.addEventListener('click', () => {
                showFormView();
            });
        }
        
        // Event-Listener für die Suchfunktion
        const searchInput = document.getElementById('survey-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                filterSurveysTable(e.target.value);
            });
        }
        
        // Tabelle sortierbar machen
        Utils.table.initSortableTable(document.getElementById('surveys-table'));
    };
    
    /**
     * Fragebögen-Tabelle laden
     */
    const loadSurveysTable = () => {
        const tableBody = document.querySelector('#surveys-table tbody');
        const noSurveysMessage = document.getElementById('no-surveys-message');
        const statTotal = document.getElementById('stat-total');
        const statComplete = document.getElementById('stat-complete');
        const statAvgCompleteness = document.getElementById('stat-avg-completeness');
        const statLastEntry = document.getElementById('stat-last-entry');
        
        // Fragebögen aus dem DataManager laden
        const surveys = DataManager.getAllSurveys();
        
        // Statistik-Werte berechnen
        if (statTotal) statTotal.textContent = surveys.length;
        
        let completeCount = 0;
        let completenessSum = 0;
        let latestTimestamp = null;
        
        // Tabelle leeren
        if (tableBody) tableBody.innerHTML = '';
        
        if (surveys.length === 0) {
            // Nachricht anzeigen wenn keine Fragebögen vorhanden
            if (noSurveysMessage) noSurveysMessage.style.display = 'block';
            if (tableBody) tableBody.parentElement.style.display = 'none';
        } else {
            // Fragebögen anzeigen
            if (noSurveysMessage) noSurveysMessage.style.display = 'none';
            if (tableBody) {
                tableBody.parentElement.style.display = 'table';
                
                // Surveys nach Datum sortieren (neueste zuerst)
                const sortedSurveys = [...surveys].sort((a, b) => 
                    new Date(b.timestamp) - new Date(a.timestamp)
                );
                
                sortedSurveys.forEach(survey => {
                    // Vollständigkeit berechnen
                    const completeness = SurveySchema.validators.getSurveyCompleteness(survey) * 100;
                    completenessSum += completeness;
                    
                    if (completeness >= 95) {
                        completeCount++;
                    }
                    
                    // Neuestes Datum finden
                    const timestamp = new Date(survey.timestamp);
                    if (!latestTimestamp || timestamp > latestTimestamp) {
                        latestTimestamp = timestamp;
                    }
                    
                    // Berufsgruppe für die Anzeige formatieren
                    let professionDisplay = 'Nicht angegeben';
                    if (survey.profession) {
                        const professionObj = SurveySchema.demographicOptions.profession.find(p => p.id === survey.profession);
                        professionDisplay = professionObj ? professionObj.label : 'Nicht angegeben';
                    }
                    
                    // Vollständigkeits-Anzeige formatieren
                    let completenessClass = '';
                    if (completeness >= 95) completenessClass = 'text-success';
                    else if (completeness >= 75) completenessClass = 'text-info';
                    else if (completeness >= 50) completenessClass = 'text-warning';
                    else completenessClass = 'text-danger';
                    
                    // Zeile zur Tabelle hinzufügen
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td data-key="id">${survey.id.substring(0, 8)}...</td>
                        <td data-key="timestamp" data-sort-value="${survey.timestamp}">
                            ${Utils.date.formatDate(survey.timestamp)}
                        </td>
                        <td data-key="profession">${professionDisplay}</td>
                        <td data-key="completeness" data-sort-value="${completeness}">
                            <div class="progress" style="height: 10px; width: 100px;">
                                <div class="progress-bar ${completenessClass}" role="progressbar" 
                                    style="width: ${completeness}%" 
                                    aria-valuenow="${completeness}" 
                                    aria-valuemin="0" 
                                    aria-valuemax="100">
                                </div>
                            </div>
                            <span class="ms-2 ${completenessClass}">${completeness.toFixed(0)}%</span>
                        </td>
                        <td>
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-outline-primary edit-survey-btn" 
                                    data-survey-id="${survey.id}" title="Bearbeiten">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-outline-danger delete-survey-btn" 
                                    data-survey-id="${survey.id}" title="Löschen">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </div>
                        </td>
                    `;
                    tableBody.appendChild(row);
                    
                    // Cache für Undo-Funktionalität
                    surveysCache[survey.id] = { ...survey };
                });
                
                // Event-Listener für Aktions-Buttons hinzufügen
                attachTableActionListeners();
                
                // Paginierung hinzufügen
                Utils.table.paginate(document.getElementById('surveys-table'));
                
                // Statistik aktualisieren
                const avgCompleteness = surveys.length > 0 ? completenessSum / surveys.length : 0;
                
                if (statComplete) statComplete.textContent = `${completeCount} (${((completeCount / surveys.length) * 100).toFixed(0)}%)`;
                if (statAvgCompleteness) statAvgCompleteness.textContent = `${avgCompleteness.toFixed(0)}%`;
                if (statLastEntry && latestTimestamp) {
                    statLastEntry.textContent = Utils.date.formatDateTime(latestTimestamp);
                }
            }
        }
    };
    
    /**
     * Event-Listener für die Tabellen-Aktionen hinzufügen
     */
    const attachTableActionListeners = () => {
        // Edit-Buttons
        const editButtons = document.querySelectorAll('.edit-survey-btn');
        editButtons.forEach(button => {
            button.addEventListener('click', () => {
                const surveyId = button.getAttribute('data-survey-id');
                editSurvey(surveyId);
            });
        });
        
        // Delete-Buttons
        const deleteButtons = document.querySelectorAll('.delete-survey-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', () => {
                const surveyId = button.getAttribute('data-survey-id');
                confirmDeleteSurvey(surveyId);
            });
        });
    };
    
    /**
     * Tabelle nach Suchbegriff filtern
     */
    const filterSurveysTable = (searchTerm) => {
        const table = document.getElementById('surveys-table');
        const rows = table.querySelectorAll('tbody tr');
        const normalizedTerm = Utils.string.normalizeForSearch(searchTerm);
        
        let matchCount = 0;
        
        rows.forEach(row => {
            // Alle Zellen durchsuchen (außer der letzten mit den Aktions-Buttons)
            let match = false;
            for (let i = 0; i < row.cells.length - 1; i++) {
                const cellText = row.cells[i].textContent;
                const normalizedCell = Utils.string.normalizeForSearch(cellText);
                
                if (normalizedCell.includes(normalizedTerm)) {
                    match = true;
                    break;
                }
            }
            
            // Zeile ein-/ausblenden
            row.style.display = match ? '' : 'none';
            if (match) matchCount++;
        });
        
        // Paginierung aktualisieren
        const paginationInfo = document.querySelector('.pagination-info');
        if (paginationInfo) {
            if (searchTerm.trim() === '') {
                paginationInfo.style.display = '';
            } else {
                paginationInfo.style.display = 'none';
            }
        }
        
        return matchCount;
    };
    
    /**
     * Bestätigung zum Löschen eines Fragebogens anzeigen
     */
    const confirmDeleteSurvey = (surveyId) => {
        const survey = DataManager.getSurveyById(surveyId);
        if (!survey) {
            Utils.notifications.error('Fragebogen nicht gefunden');
            return;
        }
        
        // Führende ID für die Anzeige
        const shortId = survey.id.substring(0, 8) + '...';
        
        // Datum formatieren
        const formattedDate = Utils.date.formatDateTime(survey.timestamp);
        
        // Berufsgruppe für die Anzeige formatieren
        let professionDisplay = 'Nicht angegeben';
        if (survey.profession) {
            const professionObj = SurveySchema.demographicOptions.profession.find(p => p.id === survey.profession);
            professionDisplay = professionObj ? professionObj.label : 'Nicht angegeben';
        }
        
        // Bestätigungs-Dialog anzeigen
        Utils.modal.confirm(
            `<div class="mb-3">
                <p>Sind Sie sicher, dass Sie den folgenden Fragebogen löschen möchten?</p>
                <div class="alert alert-info">
                    <div><strong>ID:</strong> ${shortId}</div>
                    <div><strong>Datum:</strong> ${formattedDate}</div>
                    <div><strong>Berufsgruppe:</strong> ${professionDisplay}</div>
                </div>
                <p class="text-danger">Diese Aktion kann nicht rückgängig gemacht werden!</p>
            </div>`,
            () => deleteSurvey(surveyId),
            null,
            {
                title: 'Fragebogen löschen',
                confirmText: 'Löschen',
                cancelText: 'Abbrechen'
            }
        );
    };
    
    /**
     * Fragebogen aus dem DataManager löschen
     */
    const deleteSurvey = (surveyId) => {
        // Fragebogen abrufen und im Cache speichern (für Undo-Option)
        const survey = DataManager.getSurveyById(surveyId);
        if (survey) {
            surveysCache[surveyId] = { ...survey };
        }
        
        // Löschen durchführen
        const result = DataManager.deleteSurvey(surveyId);
        
        if (result.success) {
            // Erfolgsmeldung anzeigen
            Utils.notifications.success('Fragebogen wurde gelöscht', 5000);
            
            // Undo-Option anbieten
            const undoNotification = document.createElement('div');
            undoNotification.innerHTML = `
                <span>Fragebogen wurde gelöscht.</span>
                <button id="undo-delete" class="btn btn-link p-0 ms-2">Rückgängig machen</button>
            `;
            
            // Benachrichtigung mit Undo-Button anzeigen
            const notification = Utils.notifications.show(undoNotification, 'info', 8000);
            
            // Event-Listener für Undo-Button
            const undoButton = undoNotification.querySelector('#undo-delete');
            undoButton.addEventListener('click', () => {
                // Gelöschten Fragebogen wiederherstellen
                const cachedSurvey = surveysCache[surveyId];
                if (cachedSurvey) {
                    const restoreResult = DataManager.addSurvey(cachedSurvey);
                    if (restoreResult.success) {
                        Utils.notifications.success('Fragebogen wurde wiederhergestellt', 3000);
                        
                        // Benachrichtigung ausblenden
                        Utils.notifications.hide(notification);
                        
                        // Tabelle aktualisieren
                        loadSurveysTable();
                    } else {
                        Utils.notifications.error('Fehler beim Wiederherstellen des Fragebogens', 5000);
                    }
                }
            });
            
            // Tabelle aktualisieren
            loadSurveysTable();
        } else {
            Utils.notifications.error('Fehler beim Löschen des Fragebogens: ' + result.errors.join(', '), 5000);
        }
    };
    
    /**
     * Fragebogen zur Bearbeitung öffnen
     */
    const editSurvey = (surveyId) => {
        const survey = DataManager.getSurveyById(surveyId);
        if (!survey) {
            Utils.notifications.error('Fragebogen nicht gefunden');
            return;
        }
        
        // Fragebogen zur Bearbeitung setzen
        currentSurvey = { ...survey };
        
        // Formularansicht anzeigen
        showFormView(true); // true = Bearbeitungsmodus
    };
    
    /**
     * Fragebogen-Formular anzeigen (neu oder bearbeiten)
     */
    const showFormView = (editMode = false) => {
        // Zustand aktualisieren
        currentView = 'form';
        unsavedChanges = false;
        
        // Wenn nicht im Bearbeitungsmodus, leeren Fragebogen erstellen
        if (!editMode) {
            currentSurvey = SurveySchema.emptyTemplate();
        }
        
        // View-Actions aktualisieren
        const actionsContainer = document.getElementById('view-actions');
        actionsContainer.innerHTML = `
            <button id="back-to-list-btn" class="btn btn-outline-secondary me-2">
                <i class="fas fa-arrow-left"></i> Zurück zur Liste
            </button>
            <button id="save-survey-btn" class="btn btn-success me-2">
                <i class="fas fa-save"></i> Speichern
            </button>
            <div class="dropdown d-inline-block">
                <button class="btn btn-outline-primary dropdown-toggle" type="button" id="formActionsDropdown" 
                    data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="fas fa-cog"></i>
                </button>
                <ul class="dropdown-menu" aria-labelledby="formActionsDropdown">
                    <li><a class="dropdown-item" href="#" id="reset-form-btn">
                        <i class="fas fa-undo"></i> Formular zurücksetzen
                    </a></li>
                    <li><a class="dropdown-item" href="#" id="auto-fill-btn">
                        <i class="fas fa-magic"></i> Zufallsdaten einfügen
                    </a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="#" id="print-form-btn">
                        <i class="fas fa-print"></i> Formular drucken
                    </a></li>
                </ul>
            </div>
        `;
        
        // Event-Listener für Aktions-Buttons
        document.getElementById('back-to-list-btn').addEventListener('click', () => {
            handleBackToList();
        });
        
        document.getElementById('save-survey-btn').addEventListener('click', () => {
            saveSurvey();
        });
        
        document.getElementById('reset-form-btn').addEventListener('click', (e) => {
            e.preventDefault();
            confirmResetForm();
        });
        
        document.getElementById('auto-fill-btn').addEventListener('click', (e) => {
            e.preventDefault();
            autoFillForm();
        });
        
        document.getElementById('print-form-btn').addEventListener('click', (e) => {
            e.preventDefault();
            printForm();
        });
        
        // Content-Container leeren und Formular erstellen
        const contentContainer = document.getElementById('data-entry-content');
        contentContainer.innerHTML = `
            <div class="card mb-4">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">${editMode ? 'Fragebogen bearbeiten' : 'Neuer Fragebogen'}</h5>
                    <div class="form-progress">
                        <span id="form-progress-text">0% ausgefüllt</span>
                        <div class="progress" style="width: 200px; height: 8px;">
                            <div id="form-progress-bar" class="progress-bar" role="progressbar" 
                                style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card-body">
                    <form id="survey-form" novalidate>
                        <!-- Formular-Inhalt wird dynamisch erstellt -->
                    </form>
                </div>
                
                <div class="card-footer d-flex justify-content-between">
                    <div>
                        <button type="button" id="prev-section-btn" class="btn btn-outline-secondary" disabled>
                            <i class="fas fa-chevron-left"></i> Zurück
                        </button>
                        <button type="button" id="next-section-btn" class="btn btn-outline-primary">
                            Weiter <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                    <div>
                        <button type="button" id="cancel-form-btn" class="btn btn-outline-secondary me-2">
                            Abbrechen
                        </button>
                        <button type="button" id="submit-form-btn" class="btn btn-primary">
                            <i class="fas fa-check"></i> Speichern
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Formular-Navigation -->
            <div class="card form-navigation-card">
                <div class="card-header">
                    <h5 class="mb-0">Formularnavigation</h5>
                </div>
                <div class="card-body">
                    <ul class="nav flex-column form-nav-list" id="form-nav-list">
                        <!-- Wird dynamisch befüllt -->
                    </ul>
                </div>
            </div>
        `;
        
        // Fragebogen-Formular erstellen
        createSurveyForm();
        
        // Event-Listener für Formular-Navigation
        document.getElementById('prev-section-btn').addEventListener('click', () => {
            navigateToPreviousSection();
        });
        
        document.getElementById('next-section-btn').addEventListener('click', () => {
            navigateToNextSection();
        });
        
        document.getElementById('cancel-form-btn').addEventListener('click', () => {
            handleBackToList();
        });
        
        document.getElementById('submit-form-btn').addEventListener('click', () => {
            saveSurvey();
        });
        
        // Fragebogen mit den aktuellen Daten befüllen
        if (currentSurvey) {
            populateFormWithData(currentSurvey);
        }
        
        // Fortschritt berechnen
        calculateFormProgress();
        
        // Navigation initialisieren
        setTimeout(() => {
            initFormNavigation();
        }, 100);
        
        // Form-Dropdown initialisieren
        const dropdownToggle = document.getElementById('formActionsDropdown');
        if (dropdownToggle) {
            // Bootstrap-Dropdown initialisieren (falls vorhanden)
            if (typeof bootstrap !== 'undefined' && bootstrap.Dropdown) {
                new bootstrap.Dropdown(dropdownToggle);
            } else {
                // Fallback für Dropdown ohne Bootstrap
                dropdownToggle.addEventListener('click', (e) => {
                    e.preventDefault();
                    const dropdown = document.querySelector('.dropdown-menu');
                    dropdown.classList.toggle('show');
                    
                    // Klick außerhalb schließt Dropdown
                    const closeDropdown = (e) => {
                        if (!dropdownToggle.contains(e.target)) {
                            dropdown.classList.remove('show');
                            document.removeEventListener('click', closeDropdown);
                        }
                    };
                    
                    document.addEventListener('click', closeDropdown);
                });
            }
        }
        
        // Warnung vor ungespeicherten Änderungen
        window.addEventListener('beforeunload', handleBeforeUnload);
    };
    
    /**
     * Fragebogen-Formular erstellen
     */
    const createSurveyForm = () => {
        const form = document.getElementById('survey-form');
        if (!form) return;
        
        // Formular leeren
        form.innerHTML = '';
        
        // Alle Fragebogenabschnitte durchlaufen
        formSections = []; // Zurücksetzen
        
        SurveySchema.sections.forEach((section, sectionIndex) => {
            // Formularabschnitt erstellen
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'form-section';
            sectionDiv.id = `section-${section.id}`;
            sectionDiv.dataset.sectionIndex = sectionIndex;
            
            // Titel und Beschreibung
            sectionDiv.innerHTML = `
                <div class="section-header mb-4">
                    <h3>${section.title}</h3>
                    ${section.description ? `<p class="section-description">${section.description}</p>` : ''}
                </div>
            `;
            
            // Fragen im Abschnitt
            section.questions.forEach(question => {
                const questionBlock = document.createElement('div');
                questionBlock.className = 'question-block mb-4';
                questionBlock.id = `question-${question.id}`;
                
                // Fragentext
                const questionText = document.createElement('div');
                questionText.className = 'question-text';
                questionText.innerHTML = `
                    <span class="question-number">${question.id.substring(1)}.</span>
                    ${question.text}
                `;
                questionBlock.appendChild(questionText);
                
                // Antwortfelder je nach Fragentyp
                if (question.type === 'likert') {
                    // Likert-Skala
                    const likertScale = document.createElement('div');
                    likertScale.className = 'likert-scale';
                    
                    // Optionen 1-5
                    const options = [
                        { value: 1, label: 'Stimme gar nicht zu' },
                        { value: 2, label: 'Stimme eher nicht zu' },
                        { value: 3, label: 'Teils/teils' },
                        { value: 4, label: 'Stimme eher zu' },
                        { value: 5, label: 'Stimme voll zu' }
                    ];
                    
                    options.forEach(option => {
                        const item = document.createElement('div');
                        item.className = 'likert-item';
                        
                        const input = document.createElement('input');
                        input.type = 'radio';
                        input.name = question.id;
                        input.id = `${question.id}_${option.value}`;
                        input.value = option.value;
                        input.className = 'likert-radio';
                        
                        const label = document.createElement('label');
                        label.className = 'likert-label';
                        label.htmlFor = `${question.id}_${option.value}`;
                        label.textContent = option.value;
                        label.title = option.label;
                        
                        input.addEventListener('change', () => {
                            // Daten aktualisieren und Fortschritt berechnen
                            currentSurvey[question.id] = parseInt(input.value, 10);
                            unsavedChanges = true;
                            calculateFormProgress();
                        });
                        
                        item.appendChild(input);
                        item.appendChild(label);
                        likertScale.appendChild(item);
                    });
                    
                    questionBlock.appendChild(likertScale);
                    
                } else if (question.type === 'text') {
                    // Textfeld für offene Fragen
                    const textarea = document.createElement('textarea');
                    textarea.className = 'form-control';
                    textarea.name = question.id;
                    textarea.id = question.id;
                    textarea.rows = 3;
                    textarea.placeholder = 'Ihre Antwort...';
                    
                    textarea.addEventListener('input', () => {
                        // Daten aktualisieren und Fortschritt berechnen
                        currentSurvey[question.id] = textarea.value;
                        unsavedChanges = true;
                        calculateFormProgress();
                    });
                    
                    questionBlock.appendChild(textarea);
                }
                
                sectionDiv.appendChild(questionBlock);
            });
            
            // Abschnitt zum Formular hinzufügen
            form.appendChild(sectionDiv);
            
            // Für die Navigation merken
            formSections.push({
                id: section.id,
                title: section.title,
                element: sectionDiv
            });
        });
        
        // Demografische Daten Abschnitt hinzufügen
        const demographicSection = document.createElement('div');
        demographicSection.className = 'form-section';
        demographicSection.id = 'section-demographics';
        demographicSection.dataset.sectionIndex = formSections.length;
        
        demographicSection.innerHTML = `
            <div class="section-header mb-4">
                <h3>Demografische Angaben</h3>
                <p class="section-description">
                    Diese Angaben sind freiwillig und helfen uns, die Ergebnisse besser zu verstehen.
                </p>
            </div>
            
            <div class="form-group mb-4">
                <label for="profession" class="form-label">Ihre Berufsgruppe:</label>
                <div id="profession-options" class="survey-radio-group">
                    ${SurveySchema.demographicOptions.profession.map(option => `
                        <label class="survey-radio">
                            <input type="radio" name="profession" value="${option.id}">
                            <span>${option.label}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
            
            <div class="form-group mb-4">
                <label for="experience" class="form-label">Ihre Berufserfahrung:</label>
                <div id="experience-options" class="survey-radio-group">
                    ${SurveySchema.demographicOptions.experience.map(option => `
                        <label class="survey-radio">
                            <input type="radio" name="experience" value="${option.id}">
                            <span>${option.label}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
            
            <div class="form-group mb-4">
                <label for="tenure" class="form-label">Zugehörigkeit zur Abteilung:</label>
                <div id="tenure-options" class="survey-radio-group">
                    ${SurveySchema.demographicOptions.tenure.map(option => `
                        <label class="survey-radio">
                            <input type="radio" name="tenure" value="${option.id}">
                            <span>${option.label}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Event-Listener für demografische Optionen
        form.appendChild(demographicSection);
        
        // Für die Navigation merken
        formSections.push({
            id: 'demographics',
            title: 'Demografische Angaben',
            element: demographicSection
        });
        
        // Event-Listener für demografische Daten
        const demographicInputs = demographicSection.querySelectorAll('input[type="radio"]');
        demographicInputs.forEach(input => {
            input.addEventListener('change', () => {
                // Daten aktualisieren
                currentSurvey[input.name] = input.value;
                unsavedChanges = true;
                calculateFormProgress();
            });
        });
        
        // Initial nur den ersten Abschnitt anzeigen
        formSections.forEach((section, index) => {
            section.element.style.display = index === 0 ? 'block' : 'none';
        });
    };
    
    /**
     * Formular mit Daten befüllen
     */
    const populateFormWithData = (data) => {
        if (!data) return;
        
        // Likert-Fragen
        SurveySchema.sections.forEach(section => {
            section.questions.forEach(question => {
                if (question.type === 'likert' && data[question.id] !== null) {
                    const radio = document.getElementById(`${question.id}_${data[question.id]}`);
                    if (radio) radio.checked = true;
                } else if (question.type === 'text') {
                    const textarea = document.getElementById(question.id);
                    if (textarea) textarea.value = data[question.id] || '';
                }
            });
        });
        
        // Demografische Daten
        if (data.profession) {
            const professionRadio = document.querySelector(`input[name="profession"][value="${data.profession}"]`);
            if (professionRadio) professionRadio.checked = true;
        }
        
        if (data.experience) {
            const experienceRadio = document.querySelector(`input[name="experience"][value="${data.experience}"]`);
            if (experienceRadio) experienceRadio.checked = true;
        }
        
        if (data.tenure) {
            const tenureRadio = document.querySelector(`input[name="tenure"][value="${data.tenure}"]`);
            if (tenureRadio) tenureRadio.checked = true;
        }
        
        // Fortschritt berechnen
        calculateFormProgress();
    };
    
    /**
     * Formularfortschritt berechnen
     */
    const calculateFormProgress = () => {
        if (!currentSurvey) return;
        
        // Zähler für beantwortete Fragen
        let answeredQuestions = 0;
        let totalQuestions = 0;
        
        // Likert und Text Fragen zählen
        SurveySchema.sections.forEach(section => {
            section.questions.forEach(question => {
                totalQuestions++;
                if (currentSurvey[question.id] !== null && 
                    currentSurvey[question.id] !== undefined && 
                    currentSurvey[question.id] !== '') {
                    answeredQuestions++;
                }
            });
        });
        
        // Demografische Daten zählen (optional)
        const demographicFields = ['profession', 'experience', 'tenure'];
        const demographicWeight = 0.5; // Demografische Felder zählen nur halb
        
        demographicFields.forEach(field => {
            totalQuestions += demographicWeight;
            if (currentSurvey[field]) {
                answeredQuestions += demographicWeight;
            }
        });
        
        // Fortschritt berechnen (0-100%)
        formProgress = Math.round((answeredQuestions / totalQuestions) * 100);
        
        // UI aktualisieren
        const progressBar = document.getElementById('form-progress-bar');
        const progressText = document.getElementById('form-progress-text');
        
        if (progressBar) {
            progressBar.style.width = `${formProgress}%`;
            progressBar.setAttribute('aria-valuenow', formProgress);
            
            // Farbe je nach Fortschritt
            if (formProgress < 25) {
                progressBar.className = 'progress-bar bg-danger';
            } else if (formProgress < 50) {
                progressBar.className = 'progress-bar bg-warning';
            } else if (formProgress < 75) {
                progressBar.className = 'progress-bar bg-info';
            } else {
                progressBar.className = 'progress-bar bg-success';
            }
        }
        
        if (progressText) {
            progressText.textContent = `${formProgress}% ausgefüllt`;
        }
        
        // Navigation aktualisieren
        updateFormNavigation();
        
        return formProgress;
    };
    
    /**
     * Formular-Navigation initialisieren
     */
    const initFormNavigation = () => {
        const navList = document.getElementById('form-nav-list');
        if (!navList || !formSections.length) return;
        
        // Liste leeren
        navList.innerHTML = '';
        
        // Navigations-Elemente erstellen
        formSections.forEach((section, index) => {
            const listItem = document.createElement('li');
            listItem.className = 'nav-item';
            
            const link = document.createElement('a');
            link.href = '#';
            link.className = 'nav-link';
            link.dataset.sectionIndex = index;
            link.innerHTML = `
                <span class="nav-index">${index + 1}.</span>
                <span class="nav-title">${section.title}</span>
                <span class="nav-status"></span>
            `;
            
            // Klick-Handler
            link.addEventListener('click', (e) => {
                e.preventDefault();
                navigateToSection(index);
            });
            
            listItem.appendChild(link);
            navList.appendChild(listItem);
        });
        
        // Ersten Abschnitt als aktiv markieren
        updateFormNavigation();
    };
    
    /**
     * Formular-Navigation aktualisieren
     */
    const updateFormNavigation = () => {
        // Aktuelle Abschnitt ermitteln
        let currentSectionIndex = 0;
        formSections.forEach((section, index) => {
            if (section.element.style.display === 'block') {
                currentSectionIndex = index;
            }
        });
        
        // Navigationspunkte aktualisieren
        const navLinks = document.querySelectorAll('#form-nav-list .nav-link');
        navLinks.forEach((link, index) => {
            // Aktiven Status setzen
            if (index === currentSectionIndex) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
            
            // Fortschritt in diesem Abschnitt berechnen
            const sectionProgress = calculateSectionProgress(index);
            
            // Status-Icon aktualisieren
            const statusSpan = link.querySelector('.nav-status');
            
            if (sectionProgress === 100) {
                statusSpan.innerHTML = '<i class="fas fa-check-circle text-success"></i>';
            } else if (sectionProgress > 0) {
                statusSpan.innerHTML = '<i class="fas fa-adjust text-warning"></i>';
            } else {
                statusSpan.innerHTML = '<i class="far fa-circle text-muted"></i>';
            }
        });
        
        // Navigation-Buttons aktualisieren
        const prevButton = document.getElementById('prev-section-btn');
        const nextButton = document.getElementById('next-section-btn');
        
        if (prevButton) {
            prevButton.disabled = currentSectionIndex === 0;
        }
        
        if (nextButton) {
            const isLastSection = currentSectionIndex === formSections.length - 1;
            nextButton.innerHTML = isLastSection ? 
                'Fertigstellen <i class="fas fa-check"></i>' : 
                'Weiter <i class="fas fa-chevron-right"></i>';
        }
    };
    
    /**
     * Berechnet den Fortschritt in einem bestimmten Abschnitt
     */
    const calculateSectionProgress = (sectionIndex) => {
        if (!currentSurvey || sectionIndex >= formSections.length) return 0;
        
        // Bei demografischen Daten
        if (sectionIndex === formSections.length - 1) {
            const demographicFields = ['profession', 'experience', 'tenure'];
            let answeredFields = 0;
            
            demographicFields.forEach(field => {
                if (currentSurvey[field]) {
                    answeredFields++;
                }
            });
            
            return Math.round((answeredFields / demographicFields.length) * 100);
        }
        
        // Bei normalen Fragebogenabschnitten
        const section = SurveySchema.sections[sectionIndex];
        if (!section) return 0;
        
        let answeredQuestions = 0;
        const totalQuestions = section.questions.length;
        
        section.questions.forEach(question => {
            if (currentSurvey[question.id] !== null && 
                currentSurvey[question.id] !== undefined && 
                currentSurvey[question.id] !== '') {
                answeredQuestions++;
            }
        });
        
        return totalQuestions === 0 ? 0 : Math.round((answeredQuestions / totalQuestions) * 100);
    };
    
    /**
     * Zu einem bestimmten Abschnitt navigieren
     */
    const navigateToSection = (sectionIndex) => {
        if (sectionIndex < 0 || sectionIndex >= formSections.length) return;
        
        // Alle Abschnitte ausblenden
        formSections.forEach(section => {
            section.element.style.display = 'none';
        });
        
        // Gewählten Abschnitt einblenden
        formSections[sectionIndex].element.style.display = 'block';
        
        // Navigation aktualisieren
        updateFormNavigation();
        
        // Zum Anfang des Abschnitts scrollen
        formSections[sectionIndex].element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    
    /**
     * Zum vorherigen Abschnitt navigieren
     */
    const navigateToPreviousSection = () => {
        // Aktuellen Abschnitt ermitteln
        let currentSectionIndex = 0;
        formSections.forEach((section, index) => {
            if (section.element.style.display === 'block') {
                currentSectionIndex = index;
            }
        });
        
        // Zum vorherigen navigieren
        if (currentSectionIndex > 0) {
            navigateToSection(currentSectionIndex - 1);
        }
    };
    
    /**
     * Zum nächsten Abschnitt navigieren
     */
    const navigateToNextSection = () => {
        // Aktuellen Abschnitt ermitteln
        let currentSectionIndex = 0;
        formSections.forEach((section, index) => {
            if (section.element.style.display === 'block') {
                currentSectionIndex = index;
            }
        });
        
        // Zum nächsten navigieren
        if (currentSectionIndex < formSections.length - 1) {
            navigateToSection(currentSectionIndex + 1);
        } else {
            // Bei letztem Abschnitt: Speichern
            saveSurvey();
        }
    };
    
    /**
     * Fragebogen speichern
     */
    const saveSurvey = () => {
        if (!currentSurvey) return;
        
        try {
            // Timestamp aktualisieren
            currentSurvey.timestamp = new Date().toISOString();
            
            // Speichern oder aktualisieren
            let result;
            
            if (DataManager.getSurveyById(currentSurvey.id)) {
                // Bestehenden Fragebogen aktualisieren
                result = DataManager.updateSurvey(currentSurvey.id, currentSurvey);
                if (result.success) {
                    Utils.notifications.success('Fragebogen wurde aktualisiert');
                }
            } else {
                // Neuen Fragebogen hinzufügen
                result = DataManager.addSurvey(currentSurvey);
                if (result.success) {
                    Utils.notifications.success('Fragebogen wurde gespeichert');
                }
            }
            
            if (result.success) {
                // Ungespeicherte Änderungen zurücksetzen
                unsavedChanges = false;
                
                // Zurück zur Liste
                showListView();
            } else {
                // Fehler anzeigen
                Utils.notifications.error('Fehler beim Speichern: ' + result.errors.join(', '));
            }
        } catch (error) {
            console.error('Fehler beim Speichern des Fragebogens:', error);
            Utils.notifications.error('Fehler beim Speichern: ' + error.message);
        }
    };
    
    /**
     * Bestätigung zum Zurücksetzen des Formulars anzeigen
     */
    const confirmResetForm = () => {
        if (!unsavedChanges) {
            resetForm();
            return;
        }
        
        Utils.modal.confirm(
            'Möchten Sie das Formular wirklich zurücksetzen? Alle nicht gespeicherten Änderungen gehen verloren.',
            resetForm,
            null,
            {
                title: 'Formular zurücksetzen',
                confirmText: 'Zurücksetzen',
                cancelText: 'Abbrechen'
            }
        );
    };
    
    /**
     * Formular zurücksetzen
     */
    const resetForm = () => {
        // Neuen leeren Fragebogen erstellen
        currentSurvey = SurveySchema.emptyTemplate();
        
        // Formularfelder leeren
        const form = document.getElementById('survey-form');
        if (form) {
            const radioInputs = form.querySelectorAll('input[type="radio"]');
            radioInputs.forEach(input => {
                input.checked = false;
            });
            
            const textareas = form.querySelectorAll('textarea');
            textareas.forEach(textarea => {
                textarea.value = '';
            });
        }
        
        // Fortschritt aktualisieren
        calculateFormProgress();
        
        // Zum ersten Abschnitt navigieren
        navigateToSection(0);
        
        // Bestätigung anzeigen
        Utils.notifications.info('Formular wurde zurückgesetzt');
    };
    
    /**
     * Zufällige Daten für das Formular generieren (Entwicklungshilfe)
     */
    const autoFillForm = () => {
        // Bestätigung anfordern
        Utils.modal.confirm(
            'Möchten Sie das Formular mit zufälligen Testdaten füllen? Dies ist nur für Entwicklungszwecke gedacht.',
            () => {
                // Zufällige Likert-Werte
                SurveySchema.sections.forEach(section => {
                    section.questions.forEach(question => {
                        if (question.type === 'likert') {
                            // Zufälliger Wert zwischen 1 und 5
                            const randomValue = Math.floor(Math.random() * 5) + 1;
                            currentSurvey[question.id] = randomValue;
                            
                            // Radio-Button setzen
                            const radio = document.getElementById(`${question.id}_${randomValue}`);
                            if (radio) radio.checked = true;
                        } else if (question.type === 'text') {
                            // Zufälliger Text
                            const texts = [
                                'Sehr gute Zusammenarbeit im Team',
                                'Mehr Fortbildungsmöglichkeiten wären wünschenswert',
                                'Technische Ausstattung könnte verbessert werden',
                                'Kommunikation zwischen den Abteilungen optimieren',
                                'Flexible Arbeitszeiten sind positiv'
                            ];
                            const randomText = texts[Math.floor(Math.random() * texts.length)];
                            currentSurvey[question.id] = randomText;
                            
                            // Textarea füllen
                            const textarea = document.getElementById(question.id);
                            if (textarea) textarea.value = randomText;
                        }
                    });
                });
                
                // Demografische Daten
                const professionOptions = SurveySchema.demographicOptions.profession;
                const experienceOptions = SurveySchema.demographicOptions.experience;
                const tenureOptions = SurveySchema.demographicOptions.tenure;
                
                // Zufällige Werte auswählen
                const randomProfession = professionOptions[Math.floor(Math.random() * professionOptions.length)].id;
                const randomExperience = experienceOptions[Math.floor(Math.random() * experienceOptions.length)].id;
                const randomTenure = tenureOptions[Math.floor(Math.random() * tenureOptions.length)].id;
                
                // Werte setzen
                currentSurvey.profession = randomProfession;
                currentSurvey.experience = randomExperience;
                currentSurvey.tenure = randomTenure;
                
                // Radio-Buttons setzen
                const professionRadio = document.querySelector(`input[name="profession"][value="${randomProfession}"]`);
                if (professionRadio) professionRadio.checked = true;
                
                const experienceRadio = document.querySelector(`input[name="experience"][value="${randomExperience}"]`);
                if (experienceRadio) experienceRadio.checked = true;
                
                const tenureRadio = document.querySelector(`input[name="tenure"][value="${randomTenure}"]`);
                if (tenureRadio) tenureRadio.checked = true;
                
                // Fortschritt aktualisieren
                calculateFormProgress();
                
                // Änderungen markieren
                unsavedChanges = true;
                
                // Bestätigung anzeigen
                Utils.notifications.success('Formular mit Testdaten gefüllt');
            },
            null,
            {
                title: 'Testdaten einfügen',
                confirmText: 'Testdaten einfügen',
                cancelText: 'Abbrechen'
            }
        );
    };
    
    /**
     * Formular ausdrucken
     */
    const printForm = () => {
        // Druckansicht öffnen
        window.print();
    };
    
    /**
     * Zurück zur Listenansicht navigieren (mit Bestätigung bei ungespeicherten Änderungen)
     */
    const handleBackToList = () => {
        if (!unsavedChanges) {
            showListView();
            return;
        }
        
        Utils.modal.confirm(
            'Es gibt ungespeicherte Änderungen. Möchten Sie wirklich zur Liste zurückkehren?',
            showListView,
            null,
            {
                title: 'Ungespeicherte Änderungen',
                confirmText: 'Änderungen verwerfen',
                cancelText: 'Abbrechen'
            }
        );
    };
    
    /**
     * Vor dem Verlassen der Seite warnen bei ungespeicherten Änderungen
     */
    const handleBeforeUnload = (event) => {
        if (unsavedChanges) {
            const message = 'Es gibt ungespeicherte Änderungen. Möchten Sie die Seite wirklich verlassen?';
            event.returnValue = message;
            return message;
        }
    };
    
    /**
     * Browser-Zurück-Button behandeln
     */
    const handlePopState = (event) => {
        if (currentView === 'form' && unsavedChanges) {
            // Bestätigung anzeigen
            if (confirm('Es gibt ungespeicherte Änderungen. Möchten Sie wirklich zurück zur Liste?')) {
                showListView();
            } else {
                // Navigation verhindern und URL wiederherstellen
                history.pushState(null, '', window.location.pathname);
            }
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
        // Event-Listener entfernen
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('popstate', handlePopState);
        
        // Cache leeren
        surveysCache = {};
        
        // Referenzen zurücksetzen
        container = null;
        currentView = 'list';
        currentSurvey = null;
        unsavedChanges = false;
        formSections = [];
    };
    
    // Öffentliche API
    return {
        init,
        show,
        hide,
        dispose,
        showListView,
        showFormView
    };
})();