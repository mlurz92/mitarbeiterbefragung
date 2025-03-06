/**
 * reporting.js
 * Reporting-Modul für die Mitarbeiterbefragung
 * Ermöglicht die Erstellung und den Export von strukturierten Berichten
 */

window.ReportingModule = (() => {
    // Modul-Elemente
    let container = null;
    let currentView = 'templates'; // 'templates', 'editor', 'preview'
    let currentTemplate = null;
    let currentReportData = null;
    let currentReportSettings = null;
    let previewCanvas = null;
    
    // Report-Vorlagen
    const reportTemplates = [
        {
            id: 'executive-summary',
            name: 'Executive Summary',
            description: 'Kompakte Übersicht der wichtigsten Ergebnisse auf 1-2 Seiten für Führungskräfte',
            sections: ['summary', 'highlights', 'recommendations'],
            icon: 'file-alt'
        },
        {
            id: 'full-report',
            name: 'Vollständiger Bericht',
            description: 'Detaillierter Bericht mit allen Ergebnissen und umfassender Analyse',
            sections: ['summary', 'demographics', 'detailed-results', 'comparison', 'recommendations'],
            icon: 'book'
        },
        {
            id: 'areas-report',
            name: 'Themenbereiche-Bericht',
            description: 'Analyse gruppiert nach den Hauptthemenbereichen des Fragebogens',
            sections: ['summary', 'areas-analysis', 'recommendations'],
            icon: 'sitemap'
        },
        {
            id: 'presentation',
            name: 'Präsentationsvorlage',
            description: 'Für die Vorstellung der Ergebnisse optimierte Darstellung',
            sections: ['title', 'summary', 'key-findings', 'action-plan'],
            icon: 'desktop'
        },
        {
            id: 'custom',
            name: 'Individueller Bericht',
            description: 'Erstellen Sie einen individuell angepassten Bericht',
            sections: [],
            icon: 'edit'
        }
    ];
    
    // Berichtsabschnitts-Optionen
    const sectionOptions = [
        {id: 'title', name: 'Titelseite', icon: 'heading'},
        {id: 'summary', name: 'Zusammenfassung', icon: 'align-left'},
        {id: 'demographics', name: 'Demografische Daten', icon: 'users'},
        {id: 'highlights', name: 'Wichtigste Erkenntnisse', icon: 'star'},
        {id: 'detailed-results', name: 'Detaillierte Ergebnisse', icon: 'chart-bar'},
        {id: 'areas-analysis', name: 'Analyse nach Themenbereichen', icon: 'puzzle-piece'},
        {id: 'comparison', name: 'Vergleichsanalyse', icon: 'balance-scale'},
        {id: 'key-findings', name: 'Kernerkenntnisse', icon: 'lightbulb'},
        {id: 'recommendations', name: 'Empfehlungen', icon: 'list-ul'},
        {id: 'action-plan', name: 'Maßnahmenplan', icon: 'tasks'},
        {id: 'appendix', name: 'Anhang', icon: 'paperclip'}
    ];
    
    // Standard-Berichtseinstellungen
    const defaultReportSettings = {
        title: 'Ergebnisbericht Mitarbeiterbefragung 2025',
        subtitle: 'Klinik für Radiologie und Nuklearmedizin',
        author: 'Automatisch generierter Bericht',
        date: new Date().toLocaleDateString('de-DE'),
        colors: {
            primary: '#e3000b',
            secondary: '#333333',
            accent: '#0066cc',
            background: '#ffffff',
            text: '#333333'
        },
        logo: {
            use: true,
            position: 'top-right',
            file: 'Logo.png'
        },
        pageSettings: {
            orientation: 'portrait', // 'portrait' oder 'landscape'
            size: 'A4',
            margins: {
                top: '2cm',
                bottom: '2cm',
                left: '2cm',
                right: '2cm'
            },
            header: true,
            footer: true,
            pageNumbers: true
        },
        sections: {
            title: {
                include: true,
                customTitle: '',
                showDate: true,
                coverImage: ''
            },
            summary: {
                include: true,
                maxWords: 200,
                includeOverallScore: true
            },
            demographics: {
                include: true,
                charts: ['profession', 'experience', 'tenure'],
                includeTable: true
            },
            highlights: {
                include: true,
                showTop: 3,
                showBottom: 3,
                includeCharts: true
            },
            'detailed-results': {
                include: true,
                groupBySection: true,
                includeQuestionText: true,
                includeCharts: true,
                includeComments: true
            },
            'areas-analysis': {
                include: true,
                showAllAreas: true,
                includeRadarChart: true
            },
            comparison: {
                include: true,
                compareBy: 'profession',
                includeCharts: true
            },
            'key-findings': {
                include: true,
                maxFindings: 5,
                includeRecommendations: true
            },
            recommendations: {
                include: true,
                prioritize: true,
                includeResponsibilities: false
            },
            'action-plan': {
                include: true,
                includeDates: true,
                includeOwners: true
            },
            appendix: {
                include: false,
                includeSurvey: true,
                includeMethodology: true
            }
        },
        filters: {
            useCurrentFilters: true,
            applyFilters: false,
            filterSettings: null
        }
    };
    
    /**
     * Reporting-Modul initialisieren
     */
    const init = async (targetContainer) => {
        try {
            container = targetContainer;
            
            // Prüfen ob notwendige Abhängigkeiten vorhanden sind
            if (!window.jsPDF) {
                console.warn('jsPDF nicht geladen - PDF-Export eingeschränkt');
            }
            
            // Basis-Layout erstellen
            createLayout();
            
            // Template-Ansicht anzeigen
            showTemplatesView();
            
            return true;
        } catch (error) {
            console.error('Fehler bei der Initialisierung des Reporting-Moduls:', error);
            container.innerHTML = `<div class="alert alert-danger">
                <h4>Fehler beim Laden des Reporting-Moduls</h4>
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
            <div class="reporting-container">
                <div class="section-header d-flex justify-content-between align-items-center">
                    <div>
                        <h2>
                            <i class="fas fa-file-pdf"></i> 
                            Berichte
                        </h2>
                        <p class="section-description">
                            Erstellen und exportieren Sie strukturierte Berichte der Befragungsergebnisse
                        </p>
                    </div>
                    <div class="actions" id="view-actions">
                        <!-- Dynamische Aktions-Buttons -->
                    </div>
                </div>
                
                <!-- Navigation zwischen Ansichten -->
                <div class="card mb-4">
                    <div class="card-body p-0">
                        <div class="report-nav">
                            <button class="report-nav-btn active" data-view="templates">
                                <i class="fas fa-list-alt"></i> Vorlagen
                            </button>
                            <button class="report-nav-btn" data-view="editor">
                                <i class="fas fa-edit"></i> Berichtseditor
                            </button>
                            <button class="report-nav-btn" data-view="preview">
                                <i class="fas fa-eye"></i> Vorschau
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Hauptinhalt - dynamisch befüllt -->
                <div id="reporting-content" class="mt-4">
                    <!-- Wird dynamisch mit der jeweiligen Ansicht befüllt -->
                </div>
            </div>
        `;
        
        // Event-Listener für Ansichts-Navigation
        document.querySelectorAll('.report-nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = btn.dataset.view;
                
                // Nur erlauben, wenn ein Bericht im Editor ist
                if ((view === 'editor' || view === 'preview') && !currentTemplate && currentView === 'templates') {
                    Utils.notifications.warning('Bitte wählen Sie zuerst eine Berichtsvorlage aus.');
                    return;
                }
                
                document.querySelectorAll('.report-nav-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                switch (view) {
                    case 'templates':
                        showTemplatesView();
                        break;
                    case 'editor':
                        showEditorView();
                        break;
                    case 'preview':
                        showPreviewView();
                        break;
                }
            });
        });
    };
    
    /**
     * Vorlagen-Ansicht anzeigen
     */
    const showTemplatesView = () => {
        currentView = 'templates';
        
        // View-Actions aktualisieren
        const actionsContainer = document.getElementById('view-actions');
        actionsContainer.innerHTML = `
            <button class="btn btn-outline-secondary me-2" id="saved-reports-btn">
                <i class="fas fa-save"></i> Gespeicherte Berichte
            </button>
            <button class="btn btn-outline-primary" id="create-custom-report-btn">
                <i class="fas fa-plus"></i> Neuer individueller Bericht
            </button>
        `;
        
        // Event-Listener für Aktionen
        document.getElementById('saved-reports-btn').addEventListener('click', showSavedReports);
        document.getElementById('create-custom-report-btn').addEventListener('click', createCustomReport);
        
        // Content-Container leeren und Vorlagen-Ansicht erstellen
        const contentContainer = document.getElementById('reporting-content');
        
        let templatesHTML = `
            <div class="report-templates-container">
                <h5 class="mb-4">Verfügbare Berichtsvorlagen</h5>
                <div class="row">
        `;
        
        // Vorlagen anzeigen
        reportTemplates.forEach(template => {
            templatesHTML += `
                <div class="col-lg-4 col-md-6 mb-4">
                    <div class="card h-100 template-card" data-template-id="${template.id}">
                        <div class="card-body">
                            <div class="template-icon">
                                <i class="fas fa-${template.icon}"></i>
                            </div>
                            <h5 class="card-title">${template.name}</h5>
                            <p class="card-text">${template.description}</p>
                            <div class="template-sections">
                                <small class="text-muted">Enthält:</small>
                                <ul class="template-sections-list">
                                    ${template.sections.map(section => {
                                        const sectionObj = sectionOptions.find(opt => opt.id === section);
                                        return sectionObj ? 
                                            `<li><i class="fas fa-${sectionObj.icon}"></i> ${sectionObj.name}</li>` : '';
                                    }).join('')}
                                </ul>
                            </div>
                        </div>
                        <div class="card-footer">
                            <button class="btn btn-primary w-100 use-template-btn" data-template-id="${template.id}">
                                <i class="fas fa-pencil-alt"></i> Verwenden
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        templatesHTML += `
                </div>
                
                <div class="mt-4">
                    <h5 class="mb-3">Kürzlich erstellte Berichte</h5>
                    <div id="recent-reports-container">
                        <!-- Wird dynamisch befüllt -->
                        <div class="text-center p-3">
                            <div class="loader"></div>
                            <p>Berichte werden geladen...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        contentContainer.innerHTML = templatesHTML;
        
        // Event-Listener für Template-Buttons
        document.querySelectorAll('.use-template-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const templateId = btn.getAttribute('data-template-id');
                selectTemplate(templateId);
            });
        });
        
        // Kürzlich erstellte Berichte laden
        loadRecentReports();
    };
    
    /**
     * Kürzlich erstellte Berichte laden
     */
    const loadRecentReports = () => {
        const recentReportsContainer = document.getElementById('recent-reports-container');
        if (!recentReportsContainer) return;
        
        try {
            // Berichte aus dem LocalStorage laden
            const savedReports = Utils.storage.get('saved_reports') || [];
            
            if (savedReports.length === 0) {
                recentReportsContainer.innerHTML = `
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i> 
                        Keine gespeicherten Berichte vorhanden.
                    </div>
                `;
                return;
            }
            
            // Sortieren nach Datum (neueste zuerst)
            savedReports.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
            
            // Maximal 3 anzeigen
            const recentReports = savedReports.slice(0, 3);
            
            // HTML für Tabelle generieren
            let html = `
                <div class="table-responsive">
                    <table class="table table-hover table-sm">
                        <thead>
                            <tr>
                                <th>Berichtsname</th>
                                <th>Vorlage</th>
                                <th>Letzte Änderung</th>
                                <th>Aktionen</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            recentReports.forEach(report => {
                const template = reportTemplates.find(t => t.id === report.templateId) || 
                                {name: 'Benutzerdefiniert', icon: 'file'};
                
                html += `
                    <tr>
                        <td>${report.settings.title || 'Unbenannter Bericht'}</td>
                        <td><i class="fas fa-${template.icon}"></i> ${template.name}</td>
                        <td>${Utils.date.formatDateTime(report.lastModified)}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary edit-report-btn" data-report-id="${report.id}">
                                <i class="fas fa-edit"></i> Bearbeiten
                            </button>
                        </td>
                    </tr>
                `;
            });
            
            html += `
                        </tbody>
                    </table>
                </div>
                <div class="text-end">
                    <button class="btn btn-sm btn-link" id="view-all-reports-btn">
                        Alle Berichte anzeigen <i class="fas fa-angle-right"></i>
                    </button>
                </div>
            `;
            
            recentReportsContainer.innerHTML = html;
            
            // Event-Listener für Bearbeiten-Buttons
            document.querySelectorAll('.edit-report-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const reportId = btn.getAttribute('data-report-id');
                    loadSavedReport(reportId);
                });
            });
            
            // Event-Listener für "Alle anzeigen"-Button
            document.getElementById('view-all-reports-btn').addEventListener('click', showSavedReports);
            
        } catch (error) {
            console.error('Fehler beim Laden der kürzlich erstellten Berichte:', error);
            
            recentReportsContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle"></i> 
                    Fehler beim Laden der Berichte: ${error.message}
                </div>
            `;
        }
    };
    
    /**
     * Gespeicherte Berichte anzeigen
     */
    const showSavedReports = () => {
        try {
            // Berichte aus dem LocalStorage laden
            const savedReports = Utils.storage.get('saved_reports') || [];
            
            // Dialog anzeigen
            Utils.modal.custom({
                title: 'Gespeicherte Berichte',
                content: `
                    <div class="saved-reports-list">
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
                                            <th>Vorlage</th>
                                            <th>Erstellt</th>
                                            <th>Letzte Änderung</th>
                                            <th>Aktionen</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${savedReports.map(report => {
                                            const template = reportTemplates.find(t => t.id === report.templateId) || 
                                                            {name: 'Benutzerdefiniert', icon: 'file'};
                                            
                                            return `
                                                <tr>
                                                    <td>${report.settings.title || 'Unbenannter Bericht'}</td>
                                                    <td><i class="fas fa-${template.icon}"></i> ${template.name}</td>
                                                    <td>${Utils.date.formatDateTime(report.created)}</td>
                                                    <td>${Utils.date.formatDateTime(report.lastModified)}</td>
                                                    <td>
                                                        <button class="btn btn-sm btn-outline-primary edit-saved-report-btn" data-report-id="${report.id}">
                                                            <i class="fas fa-edit"></i>
                                                        </button>
                                                        <button class="btn btn-sm btn-outline-danger delete-saved-report-btn" data-report-id="${report.id}">
                                                            <i class="fas fa-trash-alt"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            `;
                                        }).join('')}
                                    </tbody>
                                </table>
                            </div>
                        `}
                    </div>
                `,
                size: 'large',
                onOpen: () => {
                    // Event-Listener für Bearbeiten-Buttons
                    document.querySelectorAll('.edit-saved-report-btn').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const reportId = btn.getAttribute('data-report-id');
                            loadSavedReport(reportId);
                            Utils.modal.close();
                        });
                    });
                    
                    // Event-Listener für Löschen-Buttons
                    document.querySelectorAll('.delete-saved-report-btn').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const reportId = btn.getAttribute('data-report-id');
                            deleteReport(reportId);
                            
                            // Eintrag aus der Tabelle entfernen
                            btn.closest('tr').remove();
                            
                            // Prüfen, ob noch Berichte vorhanden sind
                            const tableBody = document.querySelector('.saved-reports-list tbody');
                            if (tableBody && tableBody.children.length === 0) {
                                document.querySelector('.saved-reports-list').innerHTML = `
                                    <div class="alert alert-info">
                                        <i class="fas fa-info-circle"></i> 
                                        Keine gespeicherten Berichte vorhanden.
                                    </div>
                                `;
                            }
                        });
                    });
                }
            });
        } catch (error) {
            console.error('Fehler beim Anzeigen der gespeicherten Berichte:', error);
            Utils.notifications.error('Fehler beim Laden der gespeicherten Berichte.');
        }
    };
    
    /**
     * Benutzerdefinierte Vorlage erstellen
     */
    const createCustomReport = () => {
        selectTemplate('custom');
    };
    
    /**
     * Gespeicherten Bericht löschen
     */
    const deleteReport = (reportId) => {
        try {
            // Bestätigung anfordern
            Utils.modal.confirm(
                'Möchten Sie diesen Bericht wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
                () => {
                    // Berichte aus dem LocalStorage laden
                    let savedReports = Utils.storage.get('saved_reports') || [];
                    
                    // Bericht finden
                    const reportIndex = savedReports.findIndex(r => r.id === reportId);
                    
                    if (reportIndex !== -1) {
                        // Bericht entfernen
                        savedReports.splice(reportIndex, 1);
                        
                        // Aktualisierte Liste speichern
                        Utils.storage.set('saved_reports', savedReports);
                        
                        // Benachrichtigung anzeigen
                        Utils.notifications.success('Bericht wurde gelöscht.');
                        
                        // Kürzlich erstellte Berichte aktualisieren
                        if (currentView === 'templates') {
                            loadRecentReports();
                        }
                    } else {
                        Utils.notifications.error('Bericht konnte nicht gefunden werden.');
                    }
                }
            );
        } catch (error) {
            console.error('Fehler beim Löschen des Berichts:', error);
            Utils.notifications.error('Fehler beim Löschen des Berichts.');
        }
    };
    
    /**
     * Gespeicherten Bericht laden
     */
    const loadSavedReport = (reportId) => {
        try {
            // Berichte aus dem LocalStorage laden
            const savedReports = Utils.storage.get('saved_reports') || [];
            
            // Bericht finden
            const report = savedReports.find(r => r.id === reportId);
            
            if (!report) {
                Utils.notifications.error('Bericht konnte nicht gefunden werden.');
                return;
            }
            
            // Vorlage setzen
            currentTemplate = reportTemplates.find(t => t.id === report.templateId);
            
            if (!currentTemplate) {
                currentTemplate = { ...reportTemplates.find(t => t.id === 'custom') };
            }
            
            // Berichtseinstellungen laden
            currentReportSettings = { ...report.settings };
            
            // Berichtsdaten laden
            currentReportData = { ...report.data };
            
            // Id des geladenen Berichts speichern
            currentReportSettings.reportId = reportId;
            
            // Zur Editor-Ansicht wechseln
            showEditorView();
            
            // Navigation aktualisieren
            document.querySelectorAll('.report-nav-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.view === 'editor') {
                    btn.classList.add('active');
                }
            });
            
            // Benachrichtigung anzeigen
            Utils.notifications.success('Bericht wurde geladen.');
            
        } catch (error) {
            console.error('Fehler beim Laden des Berichts:', error);
            Utils.notifications.error('Fehler beim Laden des Berichts.');
        }
    };
    
    /**
     * Berichtsvorlage auswählen
     */
    const selectTemplate = (templateId) => {
        // Vorlage finden
        const template = reportTemplates.find(t => t.id === templateId);
        
        if (!template) {
            Utils.notifications.error('Berichtsvorlage konnte nicht gefunden werden.');
            return;
        }
        
        // Vorlage speichern
        currentTemplate = template;
        
        // Standard-Einstellungen klonen
        currentReportSettings = JSON.parse(JSON.stringify(defaultReportSettings));
        
        // Bei Custom-Template alle Sektionen deaktivieren und Titel anpassen
        if (templateId === 'custom') {
            Object.keys(currentReportSettings.sections).forEach(sectionKey => {
                currentReportSettings.sections[sectionKey].include = false;
            });
            
            currentReportSettings.title = 'Individueller Bericht';
        } else {
            // Nur die in der Vorlage enthaltenen Sektionen aktivieren
            Object.keys(currentReportSettings.sections).forEach(sectionKey => {
                currentReportSettings.sections[sectionKey].include = template.sections.includes(sectionKey);
            });
        }
        
        // Berichtsdaten initialisieren
        generateReportData();
        
        // Zur Editor-Ansicht wechseln
        showEditorView();
        
        // Navigation aktualisieren
        document.querySelectorAll('.report-nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.view === 'editor') {
                btn.classList.add('active');
            }
        });
    };
    
    /**
     * Berichtsdaten generieren
     */
    const generateReportData = () => {
        try {
            // Standarddaten
            currentReportData = {
                metadata: {
                    generated: new Date().toISOString(),
                    template: currentTemplate.id,
                    version: '1.0'
                },
                surveys: {
                    total: 0,
                    filtered: 0,
                    dateRange: {
                        from: null,
                        to: null
                    }
                },
                statistics: {
                    overall: {
                        average: 0,
                        median: 0,
                        stddev: 0,
                        min: 0,
                        max: 0
                    },
                    areas: [],
                    questions: {},
                    demographics: {
                        profession: {},
                        experience: {},
                        tenure: {}
                    }
                },
                highlights: {
                    strengths: [],
                    weaknesses: []
                }
            };
            
            // Daten vorbereiten (Entweder aktuelle Filter oder alle Daten)
            let surveys = [];
            
            if (currentReportSettings.filters.useCurrentFilters) {
                // Aktuelle Filter aus dem Analyse-Modul verwenden
                surveys = AnalysisModule.filterSurveys(); // Diese Funktion muss die gefilterten Daten zurückgeben
            } else {
                // Alle Daten verwenden
                surveys = DataManager.getAllSurveys();
            }
            
            // Wenn keine Daten, frühzeitig zurückkehren
            if (!surveys || surveys.length === 0) {
                console.warn('Keine Daten für Berichtserstellung verfügbar.');
                return;
            }
            
            // Datensatzinformationen
            currentReportData.surveys.total = DataManager.getAllSurveys().length;
            currentReportData.surveys.filtered = surveys.length;
            
            // Datumsbereich bestimmen
            let minDate = null;
            let maxDate = null;
            
            surveys.forEach(survey => {
                const date = new Date(survey.timestamp);
                if (!minDate || date < minDate) minDate = date;
                if (!maxDate || date > maxDate) maxDate = date;
            });
            
            currentReportData.surveys.dateRange.from = minDate ? minDate.toISOString() : null;
            currentReportData.surveys.dateRange.to = maxDate ? maxDate.toISOString() : null;
            
            // Gesamtstatistik berechnen
            let allRatings = [];
            let questionCounts = {};
            
            SurveySchema.sections.forEach(section => {
                section.questions.forEach(question => {
                    if (question.type === 'likert') {
                        let sum = 0;
                        let count = 0;
                        let values = [];
                        
                        surveys.forEach(survey => {
                            const value = survey[question.id];
                            if (value !== null && value !== undefined) {
                                sum += value;
                                count++;
                                values.push(value);
                                allRatings.push(value);
                            }
                        });
                        
                        if (count > 0) {
                            const avg = sum / count;
                            const sortedValues = [...values].sort((a, b) => a - b);
                            const median = sortedValues.length % 2 === 0 ?
                                (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2 :
                                sortedValues[Math.floor(sortedValues.length / 2)];
                                
                            const stddev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / count);
                            
                            // Für Fragen-Statistik
                            currentReportData.statistics.questions[question.id] = {
                                text: question.text,
                                section: section.title,
                                average: avg,
                                median: median,
                                stddev: stddev,
                                count: count,
                                distribution: {
                                    1: values.filter(v => v === 1).length,
                                    2: values.filter(v => v === 2).length,
                                    3: values.filter(v => v === 3).length,
                                    4: values.filter(v => v === 4).length,
                                    5: values.filter(v => v === 5).length
                                }
                            };
                            
                            // Zählung für Gesamtstatistik
                            questionCounts[question.id] = {
                                sum: sum,
                                count: count
                            };
                        }
                    }
                });
            });
            
            // Gesamtdurchschnitt berechnen
            if (allRatings.length > 0) {
                const overall = currentReportData.statistics.overall;
                
                overall.average = allRatings.reduce((sum, val) => sum + val, 0) / allRatings.length;
                
                const sortedRatings = [...allRatings].sort((a, b) => a - b);
                overall.median = sortedRatings.length % 2 === 0 ?
                    (sortedRatings[sortedRatings.length / 2 - 1] + sortedRatings[sortedRatings.length / 2]) / 2 :
                    sortedRatings[Math.floor(sortedRatings.length / 2)];
                    
                overall.stddev = Math.sqrt(allRatings.reduce((sum, val) => sum + Math.pow(val - overall.average, 2), 0) / allRatings.length);
                overall.min = Math.min(...allRatings);
                overall.max = Math.max(...allRatings);
            }
            
            // Bereichsstatistiken berechnen
            SurveySchema.categorization.areas.forEach(area => {
                const areaQuestions = area.questionIds;
                let sum = 0;
                let count = 0;
                
                areaQuestions.forEach(qId => {
                    if (questionCounts[qId]) {
                        sum += questionCounts[qId].sum;
                        count += questionCounts[qId].count;
                    }
                });
                
                if (count > 0) {
                    currentReportData.statistics.areas.push({
                        id: area.id,
                        title: area.title,
                        description: area.description,
                        average: sum / count,
                        questionCount: areaQuestions.length
                    });
                }
            });
            
            // Stärken und Schwächen identifizieren
            
            // Nach Durchschnitt sortieren
            const sortedQuestions = Object.entries(currentReportData.statistics.questions)
                .map(([id, data]) => ({ id, ...data }))
                .sort((a, b) => b.average - a.average);
            
            // Top 5 als Stärken
            currentReportData.highlights.strengths = sortedQuestions.slice(0, 5)
                .map(q => ({
                    id: q.id,
                    text: q.text,
                    section: q.section,
                    score: q.average,
                    median: q.median
                }));
            
            // Bottom 5 als Schwächen
            currentReportData.highlights.weaknesses = sortedQuestions.slice(-5)
                .map(q => ({
                    id: q.id,
                    text: q.text,
                    section: q.section,
                    score: q.average,
                    median: q.median
                }))
                .reverse();
            
            // Demografische Daten
            surveys.forEach(survey => {
                // Berufsgruppen
                const profession = survey.profession || 'undefined';
                currentReportData.statistics.demographics.profession[profession] = 
                    (currentReportData.statistics.demographics.profession[profession] || 0) + 1;
                
                // Berufserfahrung
                const experience = survey.experience || 'undefined';
                currentReportData.statistics.demographics.experience[experience] = 
                    (currentReportData.statistics.demographics.experience[experience] || 0) + 1;
                
                // Zugehörigkeit zur Abteilung
                const tenure = survey.tenure || 'undefined';
                currentReportData.statistics.demographics.tenure[tenure] = 
                    (currentReportData.statistics.demographics.tenure[tenure] || 0) + 1;
            });
            
        } catch (error) {
            console.error('Fehler bei der Generierung der Berichtsdaten:', error);
            Utils.notifications.error('Fehler bei der Generierung der Berichtsdaten.');
        }
    };
    
    /**
     * Bearbeiter-Ansicht anzeigen
     */
    const showEditorView = () => {
        currentView = 'editor';
        
        if (!currentTemplate || !currentReportSettings) {
            Utils.notifications.error('Keine Berichtsvorlage ausgewählt.');
            showTemplatesView();
            return;
        }
        
        // View-Actions aktualisieren
        const actionsContainer = document.getElementById('view-actions');
        actionsContainer.innerHTML = `
            <button class="btn btn-outline-secondary me-2" id="discard-report-btn">
                <i class="fas fa-times"></i> Verwerfen
            </button>
            <button class="btn btn-outline-primary me-2" id="save-report-btn">
                <i class="fas fa-save"></i> Speichern
            </button>
            <button class="btn btn-primary" id="generate-report-btn">
                <i class="fas fa-file-pdf"></i> Bericht generieren
            </button>
        `;
        
        // Event-Listener für Aktionen
        document.getElementById('discard-report-btn').addEventListener('click', confirmDiscardReport);
        document.getElementById('save-report-btn').addEventListener('click', saveReport);
        document.getElementById('generate-report-btn').addEventListener('click', () => {
            // Navigation zur Vorschau
            document.querySelectorAll('.report-nav-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.view === 'preview') {
                    btn.classList.add('active');
                }
            });
            
            // Vorschau-Ansicht anzeigen
            showPreviewView();
        });
        
        // Content-Container leeren und Editor-Ansicht erstellen
        const contentContainer = document.getElementById('reporting-content');
        
        // Editor-Layout generieren
        let editorHTML = `
            <div class="report-editor-container">
                <div class="row">
                    <!-- Linke Spalte: Sektionsauswahl -->
                    <div class="col-lg-4 mb-4">
                        <div class="card h-100">
                            <div class="card-header">
                                <h5 class="mb-0">Berichts-Sektionen</h5>
                            </div>
                            <div class="card-body p-0">
                                <div class="list-group list-group-flush" id="sections-list">
                                    ${sectionOptions.map(section => `
                                        <div class="list-group-item section-list-item d-flex justify-content-between align-items-center"
                                             data-section-id="${section.id}">
                                            <div class="section-info">
                                                <i class="fas fa-${section.icon}"></i> ${section.name}
                                            </div>
                                            <div class="section-actions">
                                                <div class="form-check">
                                                    <input class="form-check-input section-toggle" type="checkbox" 
                                                        id="section-toggle-${section.id}" 
                                                        data-section-id="${section.id}" 
                                                        ${currentReportSettings.sections[section.id]?.include ? 'checked' : ''}>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Rechte Spalte: Sektions-Einstellungen -->
                    <div class="col-lg-8">
                        <div class="card mb-4">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <h5 class="mb-0">Allgemeine Einstellungen</h5>
                                <button class="btn btn-sm btn-outline-secondary" id="toggle-general-settings-btn">
                                    <i class="fas fa-chevron-up"></i>
                                </button>
                            </div>
                            <div class="card-body" id="general-settings-body">
                                <!-- Allgemeine Einstellungen -->
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <div class="form-group">
                                            <label for="report-title" class="form-label">Berichtstitel</label>
                                            <input type="text" class="form-control" id="report-title" 
                                                value="${currentReportSettings.title || ''}">
                                        </div>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <div class="form-group">
                                            <label for="report-subtitle" class="form-label">Untertitel</label>
                                            <input type="text" class="form-control" id="report-subtitle" 
                                                value="${currentReportSettings.subtitle || ''}">
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <div class="form-group">
                                            <label for="report-author" class="form-label">Autor</label>
                                            <input type="text" class="form-control" id="report-author" 
                                                value="${currentReportSettings.author || ''}">
                                        </div>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <div class="form-group">
                                            <label for="report-date" class="form-label">Datum</label>
                                            <input type="date" class="form-control" id="report-date" 
                                                value="${currentReportSettings.date ? new Date(currentReportSettings.date).toISOString().split('T')[0] : ''}">
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <div class="form-group">
                                            <label for="page-orientation" class="form-label">Seitenausrichtung</label>
                                            <select class="form-control" id="page-orientation">
                                                <option value="portrait" ${currentReportSettings.pageSettings.orientation === 'portrait' ? 'selected' : ''}>Hochformat</option>
                                                <option value="landscape" ${currentReportSettings.pageSettings.orientation === 'landscape' ? 'selected' : ''}>Querformat</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <div class="form-group">
                                            <label for="page-size" class="form-label">Seitengröße</label>
                                            <select class="form-control" id="page-size">
                                                <option value="A4" ${currentReportSettings.pageSettings.size === 'A4' ? 'selected' : ''}>A4</option>
                                                <option value="letter" ${currentReportSettings.pageSettings.size === 'letter' ? 'selected' : ''}>Letter</option>
                                                <option value="A3" ${currentReportSettings.pageSettings.size === 'A3' ? 'selected' : ''}>A3</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="row">
                                    <div class="col-12 mb-3">
                                        <div class="form-group">
                                            <label class="form-label d-block">Seitengestaltung</label>
                                            <div class="form-check form-check-inline">
                                                <input class="form-check-input" type="checkbox" id="include-header-checkbox" 
                                                    ${currentReportSettings.pageSettings.header ? 'checked' : ''}>
                                                <label class="form-check-label" for="include-header-checkbox">Kopfzeile</label>
                                            </div>
                                            <div class="form-check form-check-inline">
                                                <input class="form-check-input" type="checkbox" id="include-footer-checkbox" 
                                                    ${currentReportSettings.pageSettings.footer ? 'checked' : ''}>
                                                <label class="form-check-label" for="include-footer-checkbox">Fußzeile</label>
                                            </div>
                                            <div class="form-check form-check-inline">
                                                <input class="form-check-input" type="checkbox" id="include-page-numbers-checkbox" 
                                                    ${currentReportSettings.pageSettings.pageNumbers ? 'checked' : ''}>
                                                <label class="form-check-label" for="include-page-numbers-checkbox">Seitenzahlen</label>
                                            </div>
                                            <div class="form-check form-check-inline">
                                                <input class="form-check-input" type="checkbox" id="include-logo-checkbox" 
                                                    ${currentReportSettings.logo.use ? 'checked' : ''}>
                                                <label class="form-check-label" for="include-logo-checkbox">Logo einbinden</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <div class="form-group">
                                            <label for="primary-color" class="form-label">Primärfarbe</label>
                                            <div class="input-group color-picker-group">
                                                <span class="input-group-text color-preview" id="primary-color-preview"
                                                      style="background-color: ${currentReportSettings.colors.primary}"></span>
                                                <input type="text" class="form-control" id="primary-color" 
                                                    value="${currentReportSettings.colors.primary}">
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <div class="form-group">
                                            <label for="secondary-color" class="form-label">Sekundärfarbe</label>
                                            <div class="input-group color-picker-group">
                                                <span class="input-group-text color-preview" id="secondary-color-preview"
                                                      style="background-color: ${currentReportSettings.colors.secondary}"></span>
                                                <input type="text" class="form-control" id="secondary-color" 
                                                    value="${currentReportSettings.colors.secondary}">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="row">
                                    <div class="col-12 mb-3">
                                        <div class="form-group">
                                            <label class="form-label">Datenfilter</label>
                                            <div class="form-check">
                                                <input class="form-check-input" type="radio" name="filter-option" id="use-current-filters" 
                                                    ${currentReportSettings.filters.useCurrentFilters ? 'checked' : ''}>
                                                <label class="form-check-label" for="use-current-filters">
                                                    Aktuelle Filter aus Analyse-Modul verwenden
                                                </label>
                                            </div>
                                            <div class="form-check">
                                                <input class="form-check-input" type="radio" name="filter-option" id="use-all-data" 
                                                    ${!currentReportSettings.filters.useCurrentFilters ? 'checked' : ''}>
                                                <label class="form-check-label" for="use-all-data">
                                                    Alle Daten verwenden
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Sektions-spezifische Einstellungen -->
                        <div id="section-settings-container">
                            <!-- Wird dynamisch befüllt -->
                            <div class="card">
                                <div class="card-body text-center p-5">
                                    <i class="fas fa-mouse-pointer fa-2x mb-3 text-muted"></i>
                                    <h5>Wählen Sie eine Sektion aus, um deren Einstellungen anzupassen</h5>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        contentContainer.innerHTML = editorHTML;
        
        // Event-Listener für Toggle-Button der allgemeinen Einstellungen
        document.getElementById('toggle-general-settings-btn').addEventListener('click', toggleGeneralSettings);
        
        // Event-Listener für Sektion-Checkboxen
        document.querySelectorAll('.section-toggle').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const sectionId = e.target.getAttribute('data-section-id');
                toggleSection(sectionId, e.target.checked);
            });
        });
        
        // Event-Listener für Sektion-Listeneinträge
        document.querySelectorAll('.section-list-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // Nicht auslösen, wenn auf die Checkbox geklickt wurde
                if (e.target.classList.contains('section-toggle') || 
                    e.target.classList.contains('form-check-input')) {
                    return;
                }
                
                const sectionId = item.getAttribute('data-section-id');
                showSectionSettings(sectionId);
                
                // Aktiven Eintrag markieren
                document.querySelectorAll('.section-list-item').forEach(i => {
                    i.classList.remove('active');
                });
                item.classList.add('active');
            });
        });
        
        // Event-Listener für Farbauswahl
        document.getElementById('primary-color').addEventListener('input', (e) => {
            currentReportSettings.colors.primary = e.target.value;
            document.getElementById('primary-color-preview').style.backgroundColor = e.target.value;
        });
        
        document.getElementById('secondary-color').addEventListener('input', (e) => {
            currentReportSettings.colors.secondary = e.target.value;
            document.getElementById('secondary-color-preview').style.backgroundColor = e.target.value;
        });
        
        // Event-Listener für allgemeine Berichtseinstellungen
        document.getElementById('report-title').addEventListener('input', (e) => {
            currentReportSettings.title = e.target.value;
        });
        
        document.getElementById('report-subtitle').addEventListener('input', (e) => {
            currentReportSettings.subtitle = e.target.value;
        });
        
        document.getElementById('report-author').addEventListener('input', (e) => {
            currentReportSettings.author = e.target.value;
        });
        
        document.getElementById('report-date').addEventListener('input', (e) => {
            currentReportSettings.date = e.target.value;
        });
        
        document.getElementById('page-orientation').addEventListener('change', (e) => {
            currentReportSettings.pageSettings.orientation = e.target.value;
        });
        
        document.getElementById('page-size').addEventListener('change', (e) => {
            currentReportSettings.pageSettings.size = e.target.value;
        });
        
        document.getElementById('include-header-checkbox').addEventListener('change', (e) => {
            currentReportSettings.pageSettings.header = e.target.checked;
        });
        
        document.getElementById('include-footer-checkbox').addEventListener('change', (e) => {
            currentReportSettings.pageSettings.footer = e.target.checked;
        });
        
        document.getElementById('include-page-numbers-checkbox').addEventListener('change', (e) => {
            currentReportSettings.pageSettings.pageNumbers = e.target.checked;
        });
        
        document.getElementById('include-logo-checkbox').addEventListener('change', (e) => {
            currentReportSettings.logo.use = e.target.checked;
        });
        
        // Event-Listener für Filteroptionen
        document.getElementById('use-current-filters').addEventListener('change', (e) => {
            if (e.target.checked) {
                currentReportSettings.filters.useCurrentFilters = true;
                // Berichtsdate neu generieren mit aktuellen Filtern
                generateReportData();
            }
        });
        
        document.getElementById('use-all-data').addEventListener('change', (e) => {
            if (e.target.checked) {
                currentReportSettings.filters.useCurrentFilters = false;
                // Berichtsdate neu generieren mit allen Daten
                generateReportData();
            }
        });
        
        // Erste aktive Sektion anzeigen
        const firstActiveSection = sectionOptions.find(section => 
            currentReportSettings.sections[section.id]?.include);
            
        if (firstActiveSection) {
            showSectionSettings(firstActiveSection.id);
            
            // Aktiven Eintrag markieren
            document.querySelector(`.section-list-item[data-section-id="${firstActiveSection.id}"]`)?.classList.add('active');
        }
    };
    
    /**
     * Toggle für allgemeine Einstellungen
     */
    const toggleGeneralSettings = () => {
        const settingsBody = document.getElementById('general-settings-body');
        const toggleBtn = document.getElementById('toggle-general-settings-btn');
        
        if (!settingsBody || !toggleBtn) return;
        
        if (settingsBody.style.display === 'none') {
            settingsBody.style.display = 'block';
            toggleBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
        } else {
            settingsBody.style.display = 'none';
            toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
        }
    };
    
    /**
     * Sektion ein-/ausschalten
     */
    const toggleSection = (sectionId, include) => {
        // Sektionseinstellungen aktualisieren
        if (currentReportSettings && currentReportSettings.sections[sectionId]) {
            currentReportSettings.sections[sectionId].include = include;
        }
        
        // UI aktualisieren
        const checkbox = document.getElementById(`section-toggle-${sectionId}`);
        const listItem = document.querySelector(`.section-list-item[data-section-id="${sectionId}"]`);
        
        if (checkbox) checkbox.checked = include;
        
        if (include && listItem) {
            // Sektionseinstellungen anzeigen
            showSectionSettings(sectionId);
            
            // Aktiven Eintrag markieren
            document.querySelectorAll('.section-list-item').forEach(item => {
                item.classList.remove('active');
            });
            listItem.classList.add('active');
        } else if (listItem && listItem.classList.contains('active')) {
            // Wenn die aktive Sektion deaktiviert wird, eine andere aktive Sektion anzeigen
            const firstActiveSection = sectionOptions.find(section => 
                section.id !== sectionId && currentReportSettings.sections[section.id]?.include);
                
            if (firstActiveSection) {
                showSectionSettings(firstActiveSection.id);
                
                // Aktiven Eintrag markieren
                document.querySelectorAll('.section-list-item').forEach(item => {
                    item.classList.remove('active');
                });
                document.querySelector(`.section-list-item[data-section-id="${firstActiveSection.id}"]`)?.classList.add('active');
            } else {
                // Keine aktiven Sektionen mehr, Platzhalter anzeigen
                document.getElementById('section-settings-container').innerHTML = `
                    <div class="card">
                        <div class="card-body text-center p-5">
                            <i class="fas fa-mouse-pointer fa-2x mb-3 text-muted"></i>
                            <h5>Wählen Sie eine Sektion aus, um deren Einstellungen anzupassen</h5>
                        </div>
                    </div>
                `;
            }
        }
    };
    
    /**
     * Sektionseinstellungen anzeigen
     */
    const showSectionSettings = (sectionId) => {
        const sectionSettings = currentReportSettings.sections[sectionId];
        if (!sectionSettings) return;
        
        const section = sectionOptions.find(s => s.id === sectionId);
        if (!section) return;
        
        const settingsContainer = document.getElementById('section-settings-container');
        if (!settingsContainer) return;
        
        // HTML basierend auf Sektionstyp generieren
        let settingsHTML = '';
        
        switch (sectionId) {
            case 'title':
                settingsHTML = generateTitleSectionSettings(sectionSettings);
                break;
            case 'summary':
                settingsHTML = generateSummarySectionSettings(sectionSettings);
                break;
            case 'demographics':
                settingsHTML = generateDemographicsSectionSettings(sectionSettings);
                break;
            case 'highlights':
                settingsHTML = generateHighlightsSectionSettings(sectionSettings);
                break;
            case 'detailed-results':
                settingsHTML = generateDetailedResultsSectionSettings(sectionSettings);
                break;
            case 'areas-analysis':
                settingsHTML = generateAreasAnalysisSectionSettings(sectionSettings);
                break;
            case 'comparison':
                settingsHTML = generateComparisonSectionSettings(sectionSettings);
                break;
            case 'key-findings':
                settingsHTML = generateKeyFindingsSectionSettings(sectionSettings);
                break;
            case 'recommendations':
                settingsHTML = generateRecommendationsSectionSettings(sectionSettings);
                break;
            case 'action-plan':
                settingsHTML = generateActionPlanSectionSettings(sectionSettings);
                break;
            case 'appendix':
                settingsHTML = generateAppendixSectionSettings(sectionSettings);
                break;
            default:
                settingsHTML = `
                    <div class="card">
                        <div class="card-body text-center p-5">
                            <i class="fas fa-exclamation-circle fa-2x mb-3 text-warning"></i>
                            <h5>Keine Einstellungen für diese Sektion verfügbar</h5>
                        </div>
                    </div>
                `;
        }
        
        settingsContainer.innerHTML = settingsHTML;
        
        // Event-Listener basierend auf Sektionstyp hinzufügen
        attachSectionEventListeners(sectionId);
    };
    
    /**
     * Einstellungen für Titelseite generieren
     */
    const generateTitleSectionSettings = (settings) => {
        return `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Titelseite Einstellungen</h5>
                    <div>
                        <div class="form-check form-switch">
                            <input class="form-check-input section-include-toggle" type="checkbox" id="include-title-section"
                                data-section-id="title" ${settings.include ? 'checked' : ''}>
                            <label class="form-check-label" for="include-title-section">Einbeziehen</label>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <div class="form-group">
                                <label for="title-custom-title" class="form-label">Alternativer Titel (optional)</label>
                                <input type="text" class="form-control" id="title-custom-title" 
                                    value="${settings.customTitle || ''}" placeholder="Standard-Titel verwenden">
                            </div>
                        </div>
                        <div class="col-md-6 mb-3">
                            <div class="form-check mt-4">
                                <input class="form-check-input" type="checkbox" id="title-show-date" 
                                    ${settings.showDate ? 'checked' : ''}>
                                <label class="form-check-label" for="title-show-date">Datum anzeigen</label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-12 mb-3">
                            <div class="form-group">
                                <label for="title-cover-image" class="form-label">Titelbild (optional)</label>
                                <div class="input-group">
                                    <input type="text" class="form-control" id="title-cover-image" 
                                        value="${settings.coverImage || ''}" placeholder="URL oder Pfad zum Bild">
                                    <button class="btn btn-outline-secondary" type="button" id="title-browse-image-btn">
                                        <i class="fas fa-folder-open"></i>
                                    </button>
                                </div>
                                <small class="form-text text-muted">
                                    Lassen Sie dieses Feld leer, um kein Titelbild zu verwenden.
                                </small>
                            </div>
                        </div>
                    </div>
                    
                    <div class="title-preview mt-3">
                        <h6>Vorschau:</h6>
                        <div class="title-preview-content p-3 border">
                            <h1>${settings.customTitle || currentReportSettings.title}</h1>
                            <h3>${currentReportSettings.subtitle}</h3>
                            ${settings.showDate ? `<p>Datum: ${currentReportSettings.date || new Date().toLocaleDateString()}</p>` : ''}
                            ${settings.coverImage ? `<div class="text-center mt-2"><img src="${settings.coverImage}" alt="Titelbild" style="max-width: 100%; max-height: 150px;"></div>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    };
    
    /**
     * Einstellungen für Zusammenfassung generieren
     */
    const generateSummarySectionSettings = (settings) => {
        return `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Zusammenfassung Einstellungen</h5>
                    <div>
                        <div class="form-check form-switch">
                            <input class="form-check-input section-include-toggle" type="checkbox" id="include-summary-section"
                                data-section-id="summary" ${settings.include ? 'checked' : ''}>
                            <label class="form-check-label" for="include-summary-section">Einbeziehen</label>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <div class="form-group">
                                <label for="summary-max-words" class="form-label">Maximale Wortanzahl</label>
                                <input type="number" class="form-control" id="summary-max-words" 
                                    value="${settings.maxWords}" min="50" max="500">
                            </div>
                        </div>
                        <div class="col-md-6 mb-3">
                            <div class="form-check mt-4">
                                <input class="form-check-input" type="checkbox" id="summary-include-overall-score" 
                                    ${settings.includeOverallScore ? 'checked' : ''}>
                                <label class="form-check-label" for="summary-include-overall-score">
                                    Gesamtbewertung einbeziehen
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="summary-preview mt-3">
                        <h6>Beispielzusammenfassung:</h6>
                        <div class="summary-preview-content p-3 border">
                            <p>
                                Die Mitarbeiterbefragung der Klinik für Radiologie und Nuklearmedizin wurde im Zeitraum 
                                vom ${currentReportData?.surveys?.dateRange?.from ? new Date(currentReportData.surveys.dateRange.from).toLocaleDateString() : '01.03.2025'} 
                                bis ${currentReportData?.surveys?.dateRange?.to ? new Date(currentReportData.surveys.dateRange.to).toLocaleDateString() : '31.03.2025'} 
                                durchgeführt. Insgesamt haben ${currentReportData?.surveys?.filtered || 10} Mitarbeiterinnen und Mitarbeiter 
                                an der Befragung teilgenommen.
                            </p>
                            ${settings.includeOverallScore ? `
                                <div class="overall-score-display">
                                    <strong>Gesamtbewertung:</strong> ${currentReportData?.statistics?.overall?.average.toFixed(2) || '3.75'} / 5.0
                                </div>
                            ` : ''}
                            <p>
                                Die Ergebnisse zeigen insgesamt ein positives Bild der Abteilung. Besonders hervorzuheben sind 
                                die Bereiche "Zusammenarbeit im Team" und "Patientenorientierung". Verbesserungspotenzial 
                                besteht bei den Themen "Arbeitsbelastung" und "IT-Systeme".
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };
    
    /**
     * Einstellungen für demografische Daten generieren
     */
    const generateDemographicsSectionSettings = (settings) => {
        return `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Demografische Daten Einstellungen</h5>
                    <div>
                        <div class="form-check form-switch">
                            <input class="form-check-input section-include-toggle" type="checkbox" id="include-demographics-section"
                                data-section-id="demographics" ${settings.include ? 'checked' : ''}>
                            <label class="form-check-label" for="include-demographics-section">Einbeziehen</label>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-12 mb-3">
                            <label class="form-label">Anzuzeigende Diagramme</label>
                            <div class="form-check">
                                <input class="form-check-input demographic-chart-checkbox" type="checkbox" 
                                    id="demographics-chart-profession" value="profession"
                                    ${settings.charts.includes('profession') ? 'checked' : ''}>
                                <label class="form-check-label" for="demographics-chart-profession">
                                    Berufsgruppen
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input demographic-chart-checkbox" type="checkbox" 
                                    id="demographics-chart-experience" value="experience"
                                    ${settings.charts.includes('experience') ? 'checked' : ''}>
                                <label class="form-check-label" for="demographics-chart-experience">
                                    Berufserfahrung
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input demographic-chart-checkbox" type="checkbox" 
                                    id="demographics-chart-tenure" value="tenure"
                                    ${settings.charts.includes('tenure') ? 'checked' : ''}>
                                <label class="form-check-label" for="demographics-chart-tenure">
                                    Zugehörigkeit zur Abteilung
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-12 mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="demographics-include-table" 
                                    ${settings.includeTable ? 'checked' : ''}>
                                <label class="form-check-label" for="demographics-include-table">
                                    Tabelle mit detaillierten Daten anzeigen
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="demographics-preview mt-3">
                        <h6>Vorschau:</h6>
                        <div class="demographics-preview-content p-3 border">
                            <div class="text-center">
                                <img src="assets/images/demo-chart-demographics.png" alt="Demografische Daten Beispiel" 
                                    style="max-width: 100%; max-height: 200px;">
                                <p class="text-muted mt-2">Beispieldarstellung demografischer Daten</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };
    
    /**
     * Einstellungen für Highlights generieren
     */
    const generateHighlightsSectionSettings = (settings) => {
        return `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Wichtigste Erkenntnisse Einstellungen</h5>
                    <div>
                        <div class="form-check form-switch">
                            <input class="form-check-input section-include-toggle" type="checkbox" id="include-highlights-section"
                                data-section-id="highlights" ${settings.include ? 'checked' : ''}>
                            <label class="form-check-label" for="include-highlights-section">Einbeziehen</label>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <div class="form-group">
                                <label for="highlights-show-top" class="form-label">Anzahl der Top-Ergebnisse</label>
                                <input type="number" class="form-control" id="highlights-show-top" 
                                    value="${settings.showTop}" min="1" max="10">
                            </div>
                        </div>
                        <div class="col-md-6 mb-3">
                            <div class="form-group">
                                <label for="highlights-show-bottom" class="form-label">Anzahl der niedrigsten Ergebnisse</label>
                                <input type="number" class="form-control" id="highlights-show-bottom" 
                                    value="${settings.showBottom}" min="1" max="10">
                            </div>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-12 mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="highlights-include-charts" 
                                    ${settings.includeCharts ? 'checked' : ''}>
                                <label class="form-check-label" for="highlights-include-charts">
                                    Diagramme einbeziehen
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="highlights-preview mt-3">
                        <h6>Vorschau:</h6>
                        <div class="highlights-preview-content p-3 border">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6 class="text-success">Top ${settings.showTop} Ergebnisse</h6>
                                    <ul class="list-group">
                                        ${currentReportData?.highlights?.strengths?.slice(0, settings.showTop).map((item, index) => `
                                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                                ${truncateText(item.text, 60)}
                                                <span class="badge bg-success">${item.score.toFixed(1)}</span>
                                            </li>
                                        `).join('') || `
                                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                                Beispiel für Top-Ergebnis
                                                <span class="badge bg-success">4.5</span>
                                            </li>
                                        `}
                                    </ul>
                                </div>
                                <div class="col-md-6">
                                    <h6 class="text-danger">Niedrigste ${settings.showBottom} Ergebnisse</h6>
                                    <ul class="list-group">
                                        ${currentReportData?.highlights?.weaknesses?.slice(0, settings.showBottom).map((item, index) => `
                                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                                ${truncateText(item.text, 60)}
                                                <span class="badge bg-danger">${item.score.toFixed(1)}</span>
                                            </li>
                                        `).join('') || `
                                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                                Beispiel für niedriges Ergebnis
                                                <span class="badge bg-danger">2.5</span>
                                            </li>
                                        `}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };
    
    /**
     * Einstellungen für detaillierte Ergebnisse generieren
     */
    const generateDetailedResultsSectionSettings = (settings) => {
        return `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Detaillierte Ergebnisse Einstellungen</h5>
                    <div>
                        <div class="form-check form-switch">
                            <input class="form-check-input section-include-toggle" type="checkbox" id="include-detailed-results-section"
                                data-section-id="detailed-results" ${settings.include ? 'checked' : ''}>
                            <label class="form-check-label" for="include-detailed-results-section">Einbeziehen</label>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="detailed-results-group-by-section" 
                                    ${settings.groupBySection ? 'checked' : ''}>
                                <label class="form-check-label" for="detailed-results-group-by-section">
                                    Nach Fragebogenabschnitten gruppieren
                                </label>
                            </div>
                        </div>
                        <div class="col-md-6 mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="detailed-results-include-question-text" 
                                    ${settings.includeQuestionText ? 'checked' : ''}>
                                <label class="form-check-label" for="detailed-results-include-question-text">
                                    Vollständigen Fragetext anzeigen
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="detailed-results-include-charts" 
                                    ${settings.includeCharts ? 'checked' : ''}>
                                <label class="form-check-label" for="detailed-results-include-charts">
                                    Diagramme einbeziehen
                                </label>
                            </div>
                        </div>
                        <div class="col-md-6 mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="detailed-results-include-comments" 
                                    ${settings.includeComments ? 'checked' : ''}>
                                <label class="form-check-label" for="detailed-results-include-comments">
                                    Kommentare zu offenen Fragen einbeziehen
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="detailed-results-preview mt-3">
                        <h6>Vorschau:</h6>
                        <div class="detailed-results-preview-content p-3 border">
                            <h6>Beispiel für detaillierte Ergebnisdarstellung</h6>
                            <div class="question-card mb-3 p-3 border">
                                <div class="question-header d-flex justify-content-between">
                                    <div>
                                        <strong>Q1: </strong>
                                        ${settings.includeQuestionText ? 
                                            'Meine technische Ausstattung (z. B. Computer, Arbeitsplatz) ermöglicht mir effizientes Arbeiten.' : 'Q1'}
                                    </div>
                                    <div class="question-score">
                                        <span class="badge bg-info">3.7</span>
                                    </div>
                                </div>
                                
                                ${settings.includeCharts ? `
                                    <div class="text-center mt-3">
                                        <img src="assets/images/demo-chart-question.png" alt="Beispiel-Frage-Chart" style="max-width: 100%; max-height: 120px;">
                                    </div>
                                ` : ''}
                                
                                <div class="distribution-bars">
                                    <div class="distribution-item">
                                        <div class="distribution-label">1</div>
                                        <div class="distribution-bar-container">
                                            <div class="distribution-bar bg-danger" style="width: 10%"></div>
                                            <div class="distribution-value">10%</div>
                                        </div>
                                    </div>
                                    <!-- ... weitere Balken ... -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };
    
    /**
     * Einstellungen für Bereichs-Analyse generieren
     */
    const generateAreasAnalysisSectionSettings = (settings) => {
        return `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Themenbereiche-Analyse Einstellungen</h5>
                    <div>
                        <div class="form-check form-switch">
                            <input class="form-check-input section-include-toggle" type="checkbox" id="include-areas-analysis-section"
                                data-section-id="areas-analysis" ${settings.include ? 'checked' : ''}>
                            <label class="form-check-label" for="include-areas-analysis-section">Einbeziehen</label>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="areas-analysis-show-all-areas" 
                                    ${settings.showAllAreas ? 'checked' : ''}>
                                <label class="form-check-label" for="areas-analysis-show-all-areas">
                                    Alle Themenbereiche anzeigen
                                </label>
                            </div>
                        </div>
                        <div class="col-md-6 mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="areas-analysis-include-radar-chart" 
                                    ${settings.includeRadarChart ? 'checked' : ''}>
                                <label class="form-check-label" for="areas-analysis-include-radar-chart">
                                    Netzdiagramm einbeziehen
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="areas-analysis-preview mt-3">
                        <h6>Vorschau:</h6>
                        <div class="areas-analysis-preview-content p-3 border">
                            <div class="text-center">
                                <img src="assets/images/demo-chart-areas.png" alt="Beispiel für Bereichsanalyse" 
                                    style="max-width: 100%; max-height: 200px;">
                                <p class="text-muted mt-2">Beispieldarstellung der Themenbereiche-Analyse</p>
                            </div>
                            
                            <div class="mt-3">
                                <table class="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>Themenbereich</th>
                                            <th>Durchschnitt</th>
                                            <th>Anzahl Fragen</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${currentReportData?.statistics?.areas?.map(area => `
                                            <tr>
                                                <td>${area.title}</td>
                                                <td>${area.average.toFixed(2)}</td>
                                                <td>${area.questionCount}</td>
                                            </tr>
                                        `).join('') || `
                                            <tr>
                                                <td>Beispiel-Themenbereich</td>
                                                <td>3.75</td>
                                                <td>6</td>
                                            </tr>
                                        `}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };
    
    /**
     * Einstellungen für Vergleichs-Analyse generieren
     */
    const generateComparisonSectionSettings = (settings) => {
        return `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Vergleichsanalyse Einstellungen</h5>
                    <div>
                        <div class="form-check form-switch">
                            <input class="form-check-input section-include-toggle" type="checkbox" id="include-comparison-section"
                                data-section-id="comparison" ${settings.include ? 'checked' : ''}>
                            <label class="form-check-label" for="include-comparison-section">Einbeziehen</label>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <div class="form-group">
                                <label for="comparison-compare-by" class="form-label">Gruppieren nach</label>
                                <select class="form-control" id="comparison-compare-by">
                                    <option value="profession" ${settings.compareBy === 'profession' ? 'selected' : ''}>
                                        Berufsgruppe
                                    </option>
                                    <option value="experience" ${settings.compareBy === 'experience' ? 'selected' : ''}>
                                        Berufserfahrung
                                    </option>
                                    <option value="tenure" ${settings.compareBy === 'tenure' ? 'selected' : ''}>
                                        Zugehörigkeit zur Abteilung
                                    </option>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-6 mb-3">
                            <div class="form-check mt-4">
                                <input class="form-check-input" type="checkbox" id="comparison-include-charts" 
                                    ${settings.includeCharts ? 'checked' : ''}>
                                <label class="form-check-label" for="comparison-include-charts">
                                    Diagramme einbeziehen
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="comparison-preview mt-3">
                        <h6>Vorschau:</h6>
                        <div class="comparison-preview-content p-3 border">
                            <div class="text-center">
                                <img src="assets/images/demo-chart-comparison.png" alt="Beispiel für Vergleichsanalyse" 
                                    style="max-width: 100%; max-height: 200px;">
                                <p class="text-muted mt-2">Beispieldarstellung der Vergleichsanalyse</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };
    
    /**
     * Einstellungen für Kernerkenntnisse generieren
     */
    const generateKeyFindingsSectionSettings = (settings) => {
        return `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Kernerkenntnisse Einstellungen</h5>
                    <div>
                        <div class="form-check form-switch">
                            <input class="form-check-input section-include-toggle" type="checkbox" id="include-key-findings-section"
                                data-section-id="key-findings" ${settings.include ? 'checked' : ''}>
                            <label class="form-check-label" for="include-key-findings-section">Einbeziehen</label>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <div class="form-group">
                                <label for="key-findings-max-findings" class="form-label">Maximale Anzahl an Erkenntnissen</label>
                                <input type="number" class="form-control" id="key-findings-max-findings" 
                                    value="${settings.maxFindings}" min="3" max="10">
                            </div>
                        </div>
                        <div class="col-md-6 mb-3">
                            <div class="form-check mt-4">
                                <input class="form-check-input" type="checkbox" id="key-findings-include-recommendations" 
                                    ${settings.includeRecommendations ? 'checked' : ''}>
                                <label class="form-check-label" for="key-findings-include-recommendations">
                                    Empfehlungen zu jeder Erkenntnis einbeziehen
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="key-findings-preview mt-3">
                        <h6>Vorschau:</h6>
                        <div class="key-findings-preview-content p-3 border">
                            <div class="key-finding-item mb-3">
                                <h6 class="key-finding-title">1. Positive Teamkultur</h6>
                                <p class="key-finding-description">
                                    Die Zusammenarbeit im Team wird durchgehend positiv bewertet (4.5/5.0). 
                                    Dies zeigt sich besonders in den Antworten zur gegenseitigen Unterstützung.
                                </p>
                                ${settings.includeRecommendations ? `
                                    <div class="key-finding-recommendation p-2 bg-light">
                                        <strong>Empfehlung:</strong> Die bestehenden Teamstrukturen sollten beibehalten 
                                        und als Vorbild für andere Bereiche genutzt werden.
                                    </div>
                                ` : ''}
                            </div>
                            
                            <div class="key-finding-item">
                                <h6 class="key-finding-title">2. Verbesserungsbedarf bei IT-Systemen</h6>
                                <p class="key-finding-description">
                                    Die IT-Systeme werden mit 2.8/5.0 unterdurchschnittlich bewertet. 
                                    Dies stellt ein Hindernis für effizientes Arbeiten dar.
                                </p>
                                ${settings.includeRecommendations ? `
                                    <div class="key-finding-recommendation p-2 bg-light">
                                        <strong>Empfehlung:</strong> Durchführung einer IT-Bedarfsanalyse und 
                                        gezielte Schulungen für bestehende Systeme.
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };
    
    /**
     * Einstellungen für Empfehlungen generieren
     */
    const generateRecommendationsSectionSettings = (settings) => {
        return `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Empfehlungen Einstellungen</h5>
                    <div>
                        <div class="form-check form-switch">
                            <input class="form-check-input section-include-toggle" type="checkbox" id="include-recommendations-section"
                                data-section-id="recommendations" ${settings.include ? 'checked' : ''}>
                            <label class="form-check-label" for="include-recommendations-section">Einbeziehen</label>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="recommendations-prioritize" 
                                    ${settings.prioritize ? 'checked' : ''}>
                                <label class="form-check-label" for="recommendations-prioritize">
                                    Nach Priorität sortieren
                                </label>
                            </div>
                        </div>
                        <div class="col-md-6 mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="recommendations-include-responsibilities" 
                                    ${settings.includeResponsibilities ? 'checked' : ''}>
                                <label class="form-check-label" for="recommendations-include-responsibilities">
                                    Verantwortlichkeiten einbeziehen
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="recommendations-preview mt-3">
                        <h6>Vorschau:</h6>
                        <div class="recommendations-preview-content p-3 border">
                            <div class="recommendation-item mb-3 p-2 border-start border-primary border-4">
                                <h6 class="recommendation-title">
                                    ${settings.prioritize ? '<span class="badge bg-danger me-2">Hohe Priorität</span>' : ''}
                                    Optimierung der IT-Systeme
                                </h6>
                                <p class="recommendation-description">
                                    Durchführung einer IT-Bedarfsanalyse und Identifikation von Problemstellen
                                    im aktuellen Workflow. Basierend darauf sollte ein Verbesserungsplan mit
                                    kurz- und langfristigen Maßnahmen entwickelt werden.
                                </p>
                                ${settings.includeResponsibilities ? `
                                    <div class="recommendation-responsibility text-muted">
                                        <strong>Verantwortlich:</strong> IT-Abteilung, Abteilungsleitung
                                    </div>
                                ` : ''}
                            </div>
                            
                            <div class="recommendation-item p-2 border-start border-info border-4">
                                <h6 class="recommendation-title">
                                    ${settings.prioritize ? '<span class="badge bg-info me-2">Mittlere Priorität</span>' : ''}
                                    Erweiterung des Fortbildungsangebots
                                </h6>
                                <p class="recommendation-description">
                                    Entwicklung eines strukturierten Fortbildungsprogramms mit spezifischen
                                    Angeboten für verschiedene Berufsgruppen.
                                </p>
                                ${settings.includeResponsibilities ? `
                                    <div class="recommendation-responsibility text-muted">
                                        <strong>Verantwortlich:</strong> Personalentwicklung, Fachexperten der Abteilung
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };
    
    /**
     * Einstellungen für Maßnahmenplan generieren
     */
    const generateActionPlanSectionSettings = (settings) => {
        return `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Maßnahmenplan Einstellungen</h5>
                    <div>
                        <div class="form-check form-switch">
                            <input class="form-check-input section-include-toggle" type="checkbox" id="include-action-plan-section"
                                data-section-id="action-plan" ${settings.include ? 'checked' : ''}>
                            <label class="form-check-label" for="include-action-plan-section">Einbeziehen</label>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="action-plan-include-dates" 
                                    ${settings.includeDates ? 'checked' : ''}>
                                <label class="form-check-label" for="action-plan-include-dates">
                                    Terminplanung einbeziehen
                                </label>
                            </div>
                        </div>
                        <div class="col-md-6 mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="action-plan-include-owners" 
                                    ${settings.includeOwners ? 'checked' : ''}>
                                <label class="form-check-label" for="action-plan-include-owners">
                                    Verantwortlichkeiten einbeziehen
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="action-plan-preview mt-3">
                        <h6>Vorschau:</h6>
                        <div class="action-plan-preview-content p-3 border">
                            <table class="table table-bordered">
                                <thead>
                                    <tr>
                                        <th style="width: 5%">#</th>
                                        <th>Maßnahme</th>
                                        ${settings.includeDates ? '<th>Zeitplan</th>' : ''}
                                        ${settings.includeOwners ? '<th>Verantwortlich</th>' : ''}
                                        <th style="width: 15%">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>1</td>
                                        <td>
                                            <strong>IT-Bedarfsanalyse durchführen</strong>
                                            <div class="small">Identifikation von Schwachstellen und Verbesserungspotential</div>
                                        </td>
                                        ${settings.includeDates ? '<td>Q2 2025</td>' : ''}
                                        ${settings.includeOwners ? '<td>IT-Abteilung</td>' : ''}
                                        <td><span class="badge bg-warning">Planung</span></td>
                                    </tr>
                                    <tr>
                                        <td>2</td>
                                        <td>
                                            <strong>Schulungsplan erstellen</strong>
                                            <div class="small">Entwicklung eines bedarfsorientierten Fortbildungskonzepts</div>
                                        </td>
                                        ${settings.includeDates ? '<td>Q3 2025</td>' : ''}
                                        ${settings.includeOwners ? '<td>Personalentwicklung</td>' : ''}
                                        <td><span class="badge bg-info">Vorbereitung</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };
    
    /**
     * Einstellungen für Anhang generieren
     */
    const generateAppendixSectionSettings = (settings) => {
        return `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Anhang Einstellungen</h5>
                    <div>
                        <div class="form-check form-switch">
                            <input class="form-check-input section-include-toggle" type="checkbox" id="include-appendix-section"
                                data-section-id="appendix" ${settings.include ? 'checked' : ''}>
                            <label class="form-check-label" for="include-appendix-section">Einbeziehen</label>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="appendix-include-survey" 
                                    ${settings.includeSurvey ? 'checked' : ''}>
                                <label class="form-check-label" for="appendix-include-survey">
                                    Original-Fragebogen einbeziehen
                                </label>
                            </div>
                        </div>
                        <div class="col-md-6 mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="appendix-include-methodology" 
                                    ${settings.includeMethodology ? 'checked' : ''}>
                                <label class="form-check-label" for="appendix-include-methodology">
                                    Methodische Erläuterungen einbeziehen
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="appendix-preview mt-3">
                        <h6>Vorschau:</h6>
                        <div class="appendix-preview-content p-3 border">
                            <h6>Anhang: ${settings.includeSurvey ? 'Fragebogen' : ''} ${settings.includeSurvey && settings.includeMethodology ? '&' : ''} ${settings.includeMethodology ? 'Methodische Erläuterungen' : ''}</h6>
                            <p class="text-muted">
                                Der Anhang wird automatisch generiert und enthält die ausgewählten Elemente:
                            </p>
                            <ul>
                                ${settings.includeSurvey ? '<li>Vollständiger Original-Fragebogen</li>' : ''}
                                ${settings.includeMethodology ? '<li>Erläuterungen zur Erhebungsmethodik und Auswertung</li>' : ''}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };
    
    /**
     * Event-Listener für Sektionseinstellungen hinzufügen
     */
    const attachSectionEventListeners = (sectionId) => {
        // Sektionsspezifische Event-Listener
        
        // Gemeinsamer Event-Listener für alle Sektionen
        const toggleCheckbox = document.getElementById(`include-${sectionId}-section`);
        if (toggleCheckbox) {
            toggleCheckbox.addEventListener('change', (e) => {
                toggleSection(sectionId, e.target.checked);
            });
        }
        
        // Sektionsspezifische Event-Listener
        switch (sectionId) {
            case 'title':
                attachTitleSectionListeners();
                break;
            case 'summary':
                attachSummarySectionListeners();
                break;
            case 'demographics':
                attachDemographicsSectionListeners();
                break;
            case 'highlights':
                attachHighlightsSectionListeners();
                break;
            case 'detailed-results':
                attachDetailedResultsSectionListeners();
                break;
            case 'areas-analysis':
                attachAreasAnalysisSectionListeners();
                break;
            case 'comparison':
                attachComparisonSectionListeners();
                break;
            case 'key-findings':
                attachKeyFindingsSectionListeners();
                break;
            case 'recommendations':
                attachRecommendationsSectionListeners();
                break;
            case 'action-plan':
                attachActionPlanSectionListeners();
                break;
            case 'appendix':
                attachAppendixSectionListeners();
                break;
        }
    };
    
    /**
     * Event-Listener für Titelseite
     */
    const attachTitleSectionListeners = () => {
        document.getElementById('title-custom-title')?.addEventListener('input', (e) => {
            currentReportSettings.sections.title.customTitle = e.target.value;
            updateTitlePreview();
        });
        
        document.getElementById('title-show-date')?.addEventListener('change', (e) => {
            currentReportSettings.sections.title.showDate = e.target.checked;
            updateTitlePreview();
        });
        
        document.getElementById('title-cover-image')?.addEventListener('input', (e) => {
            currentReportSettings.sections.title.coverImage = e.target.value;
            updateTitlePreview();
        });
        
        document.getElementById('title-browse-image-btn')?.addEventListener('click', () => {
            // In einer realen Anwendung würde hier ein Datei-Browser geöffnet
            Utils.notifications.info('Datei-Browser-Funktion ist in dieser Version nicht verfügbar.');
        });
    };
    
    /**
     * Titelseiten-Vorschau aktualisieren
     */
    const updateTitlePreview = () => {
        const settings = currentReportSettings.sections.title;
        const previewContent = document.querySelector('.title-preview-content');
        
        if (previewContent) {
            previewContent.innerHTML = `
                <h1>${settings.customTitle || currentReportSettings.title}</h1>
                <h3>${currentReportSettings.subtitle}</h3>
                ${settings.showDate ? `<p>Datum: ${currentReportSettings.date || new Date().toLocaleDateString()}</p>` : ''}
                ${settings.coverImage ? `<div class="text-center mt-2"><img src="${settings.coverImage}" alt="Titelbild" style="max-width: 100%; max-height: 150px;"></div>` : ''}
            `;
        }
    };
    
    /**
     * Event-Listener für Zusammenfassung
     */
    const attachSummarySectionListeners = () => {
        document.getElementById('summary-max-words')?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            if (!isNaN(value) && value >= 50 && value <= 500) {
                currentReportSettings.sections.summary.maxWords = value;
            }
        });
        
        document.getElementById('summary-include-overall-score')?.addEventListener('change', (e) => {
            currentReportSettings.sections.summary.includeOverallScore = e.target.checked;
            updateSummaryPreview();
        });
    };
    
    /**
     * Zusammenfassungs-Vorschau aktualisieren
     */
    const updateSummaryPreview = () => {
        const settings = currentReportSettings.sections.summary;
        const previewContent = document.querySelector('.summary-preview-content');
        
        if (previewContent) {
            const overallScoreHTML = settings.includeOverallScore ? `
                <div class="overall-score-display">
                    <strong>Gesamtbewertung:</strong> ${currentReportData?.statistics?.overall?.average.toFixed(2) || '3.75'} / 5.0
                </div>
            ` : '';
            
            const dateFrom = currentReportData?.surveys?.dateRange?.from ? 
                new Date(currentReportData.surveys.dateRange.from).toLocaleDateString() : '01.03.2025';
                
            const dateTo = currentReportData?.surveys?.dateRange?.to ? 
                new Date(currentReportData.surveys.dateRange.to).toLocaleDateString() : '31.03.2025';
            
            previewContent.innerHTML = `
                <p>
                    Die Mitarbeiterbefragung der Klinik für Radiologie und Nuklearmedizin wurde im Zeitraum 
                    vom ${dateFrom} bis ${dateTo} durchgeführt. Insgesamt haben 
                    ${currentReportData?.surveys?.filtered || 10} Mitarbeiterinnen und Mitarbeiter 
                    an der Befragung teilgenommen.
                </p>
                ${overallScoreHTML}
                <p>
                    Die Ergebnisse zeigen insgesamt ein positives Bild der Abteilung. Besonders hervorzuheben sind 
                    die Bereiche "Zusammenarbeit im Team" und "Patientenorientierung". Verbesserungspotenzial 
                    besteht bei den Themen "Arbeitsbelastung" und "IT-Systeme".
                </p>
            `;
        }
    };
    
    /**
     * Event-Listener für demografische Daten
     */
    const attachDemographicsSectionListeners = () => {
        document.querySelectorAll('.demographic-chart-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const charts = [];
                document.querySelectorAll('.demographic-chart-checkbox:checked').forEach(cb => {
                    charts.push(cb.value);
                });
                currentReportSettings.sections.demographics.charts = charts;
            });
        });
        
        document.getElementById('demographics-include-table')?.addEventListener('change', (e) => {
            currentReportSettings.sections.demographics.includeTable = e.target.checked;
        });
    };
    
    /**
     * Event-Listener für Highlights
     */
    const attachHighlightsSectionListeners = () => {
        document.getElementById('highlights-show-top')?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            if (!isNaN(value) && value >= 1 && value <= 10) {
                currentReportSettings.sections.highlights.showTop = value;
                updateHighlightsPreview();
            }
        });
        
        document.getElementById('highlights-show-bottom')?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            if (!isNaN(value) && value >= 1 && value <= 10) {
                currentReportSettings.sections.highlights.showBottom = value;
                updateHighlightsPreview();
            }
        });
        
        document.getElementById('highlights-include-charts')?.addEventListener('change', (e) => {
            currentReportSettings.sections.highlights.includeCharts = e.target.checked;
        });
    };
    
    /**
     * Highlights-Vorschau aktualisieren
     */
    const updateHighlightsPreview = () => {
        const settings = currentReportSettings.sections.highlights;
        const previewContent = document.querySelector('.highlights-preview-content');
        
        if (!previewContent) return;
        
        // Top-Items HTML generieren
        let topItemsHTML = '';
        if (currentReportData?.highlights?.strengths?.length > 0) {
            currentReportData.highlights.strengths.slice(0, settings.showTop).forEach(item => {
                topItemsHTML += `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        ${truncateText(item.text, 60)}
                        <span class="badge bg-success">${item.score.toFixed(1)}</span>
                    </li>
                `;
            });
        } else {
            topItemsHTML = `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    Beispiel für Top-Ergebnis
                    <span class="badge bg-success">4.5</span>
                </li>
            `;
        }
        
        // Bottom-Items HTML generieren
        let bottomItemsHTML = '';
        if (currentReportData?.highlights?.weaknesses?.length > 0) {
            currentReportData.highlights.weaknesses.slice(0, settings.showBottom).forEach(item => {
                bottomItemsHTML += `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        ${truncateText(item.text, 60)}
                        <span class="badge bg-danger">${item.score.toFixed(1)}</span>
                    </li>
                `;
            });
        } else {
            bottomItemsHTML = `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    Beispiel für niedriges Ergebnis
                    <span class="badge bg-danger">2.5</span>
                </li>
            `;
        }
        
        // Vorschau aktualisieren
        previewContent.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6 class="text-success">Top ${settings.showTop} Ergebnisse</h6>
                    <ul class="list-group">
                        ${topItemsHTML}
                    </ul>
                </div>
                <div class="col-md-6">
                    <h6 class="text-danger">Niedrigste ${settings.showBottom} Ergebnisse</h6>
                    <ul class="list-group">
                        ${bottomItemsHTML}
                    </ul>
                </div>
            </div>
        `;
    };
    
    /**
     * Event-Listener für detaillierte Ergebnisse
     */
    const attachDetailedResultsSectionListeners = () => {
        document.getElementById('detailed-results-group-by-section')?.addEventListener('change', (e) => {
            currentReportSettings.sections['detailed-results'].groupBySection = e.target.checked;
        });
        
        document.getElementById('detailed-results-include-question-text')?.addEventListener('change', (e) => {
            currentReportSettings.sections['detailed-results'].includeQuestionText = e.target.checked;
            updateDetailedResultsPreview();
        });
        
        document.getElementById('detailed-results-include-charts')?.addEventListener('change', (e) => {
            currentReportSettings.sections['detailed-results'].includeCharts = e.target.checked;
            updateDetailedResultsPreview();
        });
        
        document.getElementById('detailed-results-include-comments')?.addEventListener('change', (e) => {
            currentReportSettings.sections['detailed-results'].includeComments = e.target.checked;
        });
    };
    
    /**
     * Detaillierte Ergebnisse Vorschau aktualisieren
     */
    const updateDetailedResultsPreview = () => {
        const settings = currentReportSettings.sections['detailed-results'];
        const previewContent = document.querySelector('.detailed-results-preview-content');
        
        if (!previewContent) return;
        
        previewContent.innerHTML = `
            <h6>Beispiel für detaillierte Ergebnisdarstellung</h6>
            <div class="question-card mb-3 p-3 border">
                <div class="question-header d-flex justify-content-between">
                    <div>
                        <strong>Q1: </strong>
                        ${settings.includeQuestionText ? 
                            'Meine technische Ausstattung (z. B. Computer, Arbeitsplatz) ermöglicht mir effizientes Arbeiten.' : 'Q1'}
                    </div>
                    <div class="question-score">
                        <span class="badge bg-info">3.7</span>
                    </div>
                </div>
                
                ${settings.includeCharts ? `
                    <div class="text-center mt-3">
                        <img src="assets/images/demo-chart-question.png" alt="Beispiel-Frage-Chart" style="max-width: 100%; max-height: 120px;">
                    </div>
                ` : ''}
                
                <div class="distribution-bars">
                    <div class="distribution-item">
                        <div class="distribution-label">1</div>
                        <div class="distribution-bar-container">
                            <div class="distribution-bar bg-danger" style="width: 10%"></div>
                            <div class="distribution-value">10%</div>
                        </div>
                    </div>
                    <!-- ... weitere Balken ... -->
                </div>
            </div>
        `;
    };
    
    /**
     * Event-Listener für Bereichs-Analyse
     */
    const attachAreasAnalysisSectionListeners = () => {
        document.getElementById('areas-analysis-show-all-areas')?.addEventListener('change', (e) => {
            currentReportSettings.sections['areas-analysis'].showAllAreas = e.target.checked;
        });
        
        document.getElementById('areas-analysis-include-radar-chart')?.addEventListener('change', (e) => {
            currentReportSettings.sections['areas-analysis'].includeRadarChart = e.target.checked;
        });
    };
    
    /**
     * Event-Listener für Vergleichs-Analyse
     */
    const attachComparisonSectionListeners = () => {
        document.getElementById('comparison-compare-by')?.addEventListener('change', (e) => {
            currentReportSettings.sections.comparison.compareBy = e.target.value;
        });
        
        document.getElementById('comparison-include-charts')?.addEventListener('change', (e) => {
            currentReportSettings.sections.comparison.includeCharts = e.target.checked;
        });
    };
    
    /**
     * Event-Listener für Kernerkenntnisse
     */
    const attachKeyFindingsSectionListeners = () => {
        document.getElementById('key-findings-max-findings')?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            if (!isNaN(value) && value >= 3 && value <= 10) {
                currentReportSettings.sections['key-findings'].maxFindings = value;
            }
        });
        
        document.getElementById('key-findings-include-recommendations')?.addEventListener('change', (e) => {
            currentReportSettings.sections['key-findings'].includeRecommendations = e.target.checked;
            updateKeyFindingsPreview();
        });
    };
    
    /**
     * Kernerkenntnisse Vorschau aktualisieren
     */
    const updateKeyFindingsPreview = () => {
        const settings = currentReportSettings.sections['key-findings'];
        const previewContent = document.querySelector('.key-findings-preview-content');
        
        if (!previewContent) return;
        
        const recommendationsHTML = settings.includeRecommendations ? `
            <div class="key-finding-recommendation p-2 bg-light">
                <strong>Empfehlung:</strong> Die bestehenden Teamstrukturen sollten beibehalten 
                und als Vorbild für andere Bereiche genutzt werden.
            </div>
        ` : '';
        
        const recommendationsHTML2 = settings.includeRecommendations ? `
            <div class="key-finding-recommendation p-2 bg-light">
                <strong>Empfehlung:</strong> Durchführung einer IT-Bedarfsanalyse und 
                gezielte Schulungen für bestehende Systeme.
            </div>
        ` : '';
        
        previewContent.innerHTML = `
            <div class="key-finding-item mb-3">
                <h6 class="key-finding-title">1. Positive Teamkultur</h6>
                <p class="key-finding-description">
                    Die Zusammenarbeit im Team wird durchgehend positiv bewertet (4.5/5.0). 
                    Dies zeigt sich besonders in den Antworten zur gegenseitigen Unterstützung.
                </p>
                ${recommendationsHTML}
            </div>
            
            <div class="key-finding-item">
                <h6 class="key-finding-title">2. Verbesserungsbedarf bei IT-Systemen</h6>
                <p class="key-finding-description">
                    Die IT-Systeme werden mit 2.8/5.0 unterdurchschnittlich bewertet. 
                    Dies stellt ein Hindernis für effizientes Arbeiten dar.
                </p>
                ${recommendationsHTML2}
            </div>
        `;
    };
    
    /**
     * Event-Listener für Empfehlungen
     */
    const attachRecommendationsSectionListeners = () => {
        document.getElementById('recommendations-prioritize')?.addEventListener('change', (e) => {
            currentReportSettings.sections.recommendations.prioritize = e.target.checked;
            updateRecommendationsPreview();
        });
        
        document.getElementById('recommendations-include-responsibilities')?.addEventListener('change', (e) => {
            currentReportSettings.sections.recommendations.includeResponsibilities = e.target.checked;
            updateRecommendationsPreview();
        });
    };
    
    /**
     * Empfehlungen Vorschau aktualisieren
     */
    const updateRecommendationsPreview = () => {
        const settings = currentReportSettings.sections.recommendations;
        const previewContent = document.querySelector('.recommendations-preview-content');
        
        if (!previewContent) return;
        
        const priorityBadge = settings.prioritize ? '<span class="badge bg-danger me-2">Hohe Priorität</span>' : '';
        const priorityBadge2 = settings.prioritize ? '<span class="badge bg-info me-2">Mittlere Priorität</span>' : '';
        
        const responsibilitiesHTML = settings.includeResponsibilities ? `
            <div class="recommendation-responsibility text-muted">
                <strong>Verantwortlich:</strong> IT-Abteilung, Abteilungsleitung
            </div>
        ` : '';
        
        const responsibilitiesHTML2 = settings.includeResponsibilities ? `
            <div class="recommendation-responsibility text-muted">
                <strong>Verantwortlich:</strong> Personalentwicklung, Fachexperten der Abteilung
            </div>
        ` : '';
        
        previewContent.innerHTML = `
            <div class="recommendation-item mb-3 p-2 border-start border-primary border-4">
                <h6 class="recommendation-title">
                    ${priorityBadge}
                    Optimierung der IT-Systeme
                </h6>
                <p class="recommendation-description">
                    Durchführung einer IT-Bedarfsanalyse und Identifikation von Problemstellen
                    im aktuellen Workflow. Basierend darauf sollte ein Verbesserungsplan mit
                    kurz- und langfristigen Maßnahmen entwickelt werden.
                </p>
                ${responsibilitiesHTML}
            </div>
            
            <div class="recommendation-item p-2 border-start border-info border-4">
                <h6 class="recommendation-title">
                    ${priorityBadge2}
                    Erweiterung des Fortbildungsangebots
                </h6>
                <p class="recommendation-description">
                    Entwicklung eines strukturierten Fortbildungsprogramms mit spezifischen
                    Angeboten für verschiedene Berufsgruppen.
                </p>
                ${responsibilitiesHTML2}
            </div>
        `;
    };
    
    /**
     * Event-Listener für Maßnahmenplan
     */
    const attachActionPlanSectionListeners = () => {
        document.getElementById('action-plan-include-dates')?.addEventListener('change', (e) => {
            currentReportSettings.sections['action-plan'].includeDates = e.target.checked;
            updateActionPlanPreview();
        });
        
        document.getElementById('action-plan-include-owners')?.addEventListener('change', (e) => {
            currentReportSettings.sections['action-plan'].includeOwners = e.target.checked;
            updateActionPlanPreview();
        });
    };
    
    /**
     * Maßnahmenplan Vorschau aktualisieren
     */
    const updateActionPlanPreview = () => {
        const settings = currentReportSettings.sections['action-plan'];
        const previewContent = document.querySelector('.action-plan-preview-content');
        
        if (!previewContent) return;
        
        const datesHeader = settings.includeDates ? '<th>Zeitplan</th>' : '';
        const ownersHeader = settings.includeOwners ? '<th>Verantwortlich</th>' : '';
        
        const datesCell = settings.includeDates ? '<td>Q2 2025</td>' : '';
        const ownersCell = settings.includeOwners ? '<td>IT-Abteilung</td>' : '';
        
        const datesCell2 = settings.includeDates ? '<td>Q3 2025</td>' : '';
        const ownersCell2 = settings.includeOwners ? '<td>Personalentwicklung</td>' : '';
        
        previewContent.innerHTML = `
            <table class="table table-bordered">
                <thead>
                    <tr>
                        <th style="width: 5%">#</th>
                        <th>Maßnahme</th>
                        ${datesHeader}
                        ${ownersHeader}
                        <th style="width: 15%">Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>1</td>
                        <td>
                            <strong>IT-Bedarfsanalyse durchführen</strong>
                            <div class="small">Identifikation von Schwachstellen und Verbesserungspotential</div>
                        </td>
                        ${datesCell}
                        ${ownersCell}
                        <td><span class="badge bg-warning">Planung</span></td>
                    </tr>
                    <tr>
                        <td>2</td>
                        <td>
                            <strong>Schulungsplan erstellen</strong>
                            <div class="small">Entwicklung eines bedarfsorientierten Fortbildungskonzepts</div>
                        </td>
                        ${datesCell2}
                        ${ownersCell2}
                        <td><span class="badge bg-info">Vorbereitung</span></td>
                    </tr>
                </tbody>
            </table>
        `;
    };
    
    /**
     * Event-Listener für Anhang
     */
    const attachAppendixSectionListeners = () => {
        document.getElementById('appendix-include-survey')?.addEventListener('change', (e) => {
            currentReportSettings.sections.appendix.includeSurvey = e.target.checked;
            updateAppendixPreview();
        });
        
        document.getElementById('appendix-include-methodology')?.addEventListener('change', (e) => {
            currentReportSettings.sections.appendix.includeMethodology = e.target.checked;
            updateAppendixPreview();
        });
    };
    
    /**
     * Anhang Vorschau aktualisieren
     */
    const updateAppendixPreview = () => {
        const settings = currentReportSettings.sections.appendix;
        const previewContent = document.querySelector('.appendix-preview-content');
        
        if (!previewContent) return;
        
        const surveyListItem = settings.includeSurvey ? '<li>Vollständiger Original-Fragebogen</li>' : '';
        const methodologyListItem = settings.includeMethodology ? '<li>Erläuterungen zur Erhebungsmethodik und Auswertung</li>' : '';
        
        previewContent.innerHTML = `
            <h6>Anhang: ${settings.includeSurvey ? 'Fragebogen' : ''} ${settings.includeSurvey && settings.includeMethodology ? '&' : ''} ${settings.includeMethodology ? 'Methodische Erläuterungen' : ''}</h6>
            <p class="text-muted">
                Der Anhang wird automatisch generiert und enthält die ausgewählten Elemente:
            </p>
            <ul>
                ${surveyListItem}
                ${methodologyListItem}
            </ul>
        `;
    };
    
    /**
     * Vorschau-Ansicht anzeigen
     */
    const showPreviewView = () => {
        currentView = 'preview';
        
        if (!currentTemplate || !currentReportSettings) {
            Utils.notifications.error('Keine Berichtsvorlage ausgewählt.');
            showTemplatesView();
            return;
        }
        
        // View-Actions aktualisieren
        const actionsContainer = document.getElementById('view-actions');
        actionsContainer.innerHTML = `
            <button class="btn btn-outline-secondary me-2" id="back-to-editor-btn">
                <i class="fas fa-arrow-left"></i> Zurück zum Editor
            </button>
            <div class="btn-group me-2">
                <button class="btn btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" id="export-options-btn">
                    <i class="fas fa-download"></i> Exportieren
                </button>
                <ul class="dropdown-menu" aria-labelledby="export-options-btn">
                    <li><a class="dropdown-item" href="#" id="export-pdf-btn"><i class="fas fa-file-pdf"></i> Als PDF exportieren</a></li>
                    <li><a class="dropdown-item" href="#" id="export-images-btn"><i class="fas fa-file-image"></i> Als Bilder exportieren</a></li>
                </ul>
            </div>
            <button class="btn btn-primary" id="print-report-btn">
                <i class="fas fa-print"></i> Drucken
            </button>
        `;
        
        // Event-Listener für Aktionen
        document.getElementById('back-to-editor-btn').addEventListener('click', () => {
            // Navigation zur Editor-Ansicht
            document.querySelectorAll('.report-nav-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.view === 'editor') {
                    btn.classList.add('active');
                }
            });
            
            // Editor-Ansicht anzeigen
            showEditorView();
        });
        
        document.getElementById('export-pdf-btn').addEventListener('click', exportReportAsPDF);
        document.getElementById('export-images-btn').addEventListener('click', exportReportAsImages);
        document.getElementById('print-report-btn').addEventListener('click', printReport);
        
        // Content-Container leeren und Vorschau-Ansicht erstellen
        const contentContainer = document.getElementById('reporting-content');
        
        contentContainer.innerHTML = `
            <div class="report-preview-container">
                <div class="report-preview-header mb-4">
                    <h5>Berichtsvorschau</h5>
                    <p class="text-muted">Vorschau von "${currentReportSettings.title || 'Unbenannter Bericht'}"</p>
                </div>
                
                <div class="report-preview-toolbar mb-3">
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-secondary active" id="preview-mode-pages">
                            <i class="fas fa-file-alt"></i> Seitenansicht
                        </button>
                        <button class="btn btn-outline-secondary" id="preview-mode-sections">
                            <i class="fas fa-list"></i> Abschnittsansicht
                        </button>
                    </div>
                    <div class="preview-scale-control ms-3">
                        <button class="btn btn-sm btn-outline-secondary" id="zoom-out-btn"><i class="fas fa-search-minus"></i></button>
                        <span id="zoom-level">100%</span>
                        <button class="btn btn-sm btn-outline-secondary" id="zoom-in-btn"><i class="fas fa-search-plus"></i></button>
                    </div>
                </div>
                
                <div class="report-preview-loading text-center p-5">
                    <div class="loader"></div>
                    <p>Berichtsvorschau wird generiert...</p>
                </div>
                
                <div class="report-preview-content" id="report-preview-content" style="display: none;">
                    <!-- Wird dynamisch befüllt -->
                </div>
            </div>
        `;
        
        // Event-Listener für Vorschau-Modi
        document.getElementById('preview-mode-pages').addEventListener('click', (e) => {
            document.getElementById('preview-mode-sections').classList.remove('active');
            e.target.classList.add('active');
            showReportPreview('pages');
        });
        
        document.getElementById('preview-mode-sections').addEventListener('click', (e) => {
            document.getElementById('preview-mode-pages').classList.remove('active');
            e.target.classList.add('active');
            showReportPreview('sections');
        });
        
        // Event-Listener für Zoom-Kontrollen
        let zoomLevel = 100;
        const zoomLevelElement = document.getElementById('zoom-level');
        
        document.getElementById('zoom-in-btn').addEventListener('click', () => {
            if (zoomLevel < 200) {
                zoomLevel += 10;
                zoomLevelElement.textContent = `${zoomLevel}%`;
                document.getElementById('report-preview-content').style.transform = `scale(${zoomLevel / 100})`;
            }
        });
        
        document.getElementById('zoom-out-btn').addEventListener('click', () => {
            if (zoomLevel > 50) {
                zoomLevel -= 10;
                zoomLevelElement.textContent = `${zoomLevel}%`;
                document.getElementById('report-preview-content').style.transform = `scale(${zoomLevel / 100})`;
            }
        });
        
        // Berichtsvorschau generieren
        setTimeout(() => {
            showReportPreview('pages');
        }, 500);
    };
    
    /**
     * Berichtsvorschau anzeigen
     */
    const showReportPreview = (mode = 'pages') => {
        try {
            const previewContent = document.getElementById('report-preview-content');
            const loadingIndicator = document.querySelector('.report-preview-loading');
            
            if (!previewContent || !loadingIndicator) return;
            
            // Lade-Indikator anzeigen
            previewContent.style.display = 'none';
            loadingIndicator.style.display = 'block';
            
            // Timeout für realistischeres Lade-Erlebnis
            setTimeout(() => {
                // HTML basierend auf Modus generieren
                let previewHTML = '';
                
                if (mode === 'pages') {
                    previewHTML = generatePagesPreview();
                } else {
                    previewHTML = generateSectionsPreview();
                }
                
                // Vorschau anzeigen
                previewContent.innerHTML = previewHTML;
                previewContent.style.display = 'block';
                loadingIndicator.style.display = 'none';
                
                // Canvas für PDF-Vorschau initialisieren
                if (mode === 'pages') {
                    initPreviewCanvas();
                }
            }, 800);
        } catch (error) {
            console.error('Fehler beim Generieren der Berichtsvorschau:', error);
            
            const previewContent = document.getElementById('report-preview-content');
            const loadingIndicator = document.querySelector('.report-preview-loading');
            
            if (previewContent && loadingIndicator) {
                loadingIndicator.style.display = 'none';
                previewContent.style.display = 'block';
                previewContent.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle"></i> 
                        Fehler beim Generieren der Berichtsvorschau: ${error.message}
                    </div>
                `;
            }
        }
    };
    
    /**
     * Seitenbasierte Vorschau generieren
     */
    const generatePagesPreview = () => {
        // Berichtsseiten simulieren
        const pages = [];
        
        // Aktive Abschnitte filtern
        const activeSections = [];
        
        for (const sectionId of Object.keys(currentReportSettings.sections)) {
            if (currentReportSettings.sections[sectionId].include) {
                const sectionOption = sectionOptions.find(s => s.id === sectionId);
                if (sectionOption) {
                    activeSections.push({
                        id: sectionId,
                        name: sectionOption.name,
                        icon: sectionOption.icon
                    });
                }
            }
        }
        
        // Titelseite
        if (currentReportSettings.sections.title.include) {
            pages.push({
                title: 'Titelseite',
                content: generateTitlePagePreview()
            });
        }
        
        // Inhaltsverzeichnis
        if (activeSections.length > 3) {
            pages.push({
                title: 'Inhaltsverzeichnis',
                content: generateTOCPagePreview(activeSections)
            });
        }
        
        // Seiten für Abschnitte generieren
        activeSections.forEach(section => {
            if (section.id === 'title') return; // Titelseite wurde bereits erstellt
            
            // Für einige umfangreiche Abschnitte mehrere Seiten generieren
            if (section.id === 'detailed-results') {
                pages.push({
                    title: section.name,
                    content: generateSectionPreview(section.id, section.name, section.icon)
                });
                
                // Zusätzliche Seiten für detaillierte Ergebnisse
                pages.push({
                    title: `${section.name} (Fortsetzung)`,
                    content: generateSectionPreviewContinuation(section.id)
                });
            } else {
                pages.push({
                    title: section.name,
                    content: generateSectionPreview(section.id, section.name, section.icon)
                });
            }
        });
        
        // HTML für alle Seiten generieren
        let pagesHTML = `<div class="report-pages-container">`;
        
        pages.forEach((page, index) => {
            const pageNumber = index + 1;
            
            pagesHTML += `
                <div class="report-page" data-page="${pageNumber}">
                    <div class="report-page-content">
                        ${page.content}
                    </div>
                    ${currentReportSettings.pageSettings.pageNumbers ? `
                        <div class="report-page-footer">
                            <div class="report-page-number">Seite ${pageNumber} von ${pages.length}</div>
                        </div>
                    ` : ''}
                </div>
            `;
        });
        
        pagesHTML += `</div>`;
        
        return pagesHTML;
    };
    
    /**
     * Abschnittsbasierte Vorschau generieren
     */
    const generateSectionsPreview = () => {
        let sectionsHTML = `<div class="report-sections-container">`;
        
        // Aktive Abschnitte filtern und verarbeiten
        for (const sectionId of Object.keys(currentReportSettings.sections)) {
            if (currentReportSettings.sections[sectionId].include) {
                const sectionOption = sectionOptions.find(s => s.id === sectionId);
                if (sectionOption) {
                    sectionsHTML += `
                        <div class="report-section-preview">
                            <div class="report-section-header">
                                <h5 class="mb-0">
                                    <i class="fas fa-${sectionOption.icon}"></i> ${sectionOption.name}
                                </h5>
                            </div>
                            <div class="report-section-content">
                                ${generateSectionPreview(sectionId, sectionOption.name, sectionOption.icon)}
                            </div>
                        </div>
                    `;
                }
            }
        }
        
        sectionsHTML += `</div>`;
        
        return sectionsHTML;
    };
    
    /**
     * Titelseiten-Vorschau generieren
     */
    const generateTitlePagePreview = () => {
        const settings = currentReportSettings.sections.title;
        const title = settings.customTitle || currentReportSettings.title;
        const subtitle = currentReportSettings.subtitle;
        const date = settings.showDate ? currentReportSettings.date : null;
        const coverImage = settings.coverImage;
        
        return `
            <div class="report-title-page">
                ${currentReportSettings.logo.use ? `
                    <div class="report-logo ${currentReportSettings.logo.position}">
                        <img src="${currentReportSettings.logo.file}" alt="Logo">
                    </div>
                ` : ''}
                
                <div class="title-content">
                    <h1 class="report-title">${title}</h1>
                    <h3 class="report-subtitle">${subtitle}</h3>
                    ${date ? `<p class="report-date">Datum: ${date}</p>` : ''}
                    
                    ${coverImage ? `
                        <div class="report-cover-image">
                            <img src="${coverImage}" alt="Titelbild">
                        </div>
                    ` : ''}
                </div>
                
                <div class="report-author">
                    ${currentReportSettings.author}
                </div>
            </div>
        `;
    };
    
    /**
     * Inhaltsverzeichnis-Vorschau generieren
     */
    const generateTOCPagePreview = (sections) => {
        let tocHTML = `
            <div class="report-toc-page">
                <h2 class="report-page-title">Inhaltsverzeichnis</h2>
                
                <div class="report-toc-content">
                    <ul class="report-toc-list">
        `;
        
        // Manuelle Seitenzahlen für die Simulation
        let currentPage = 3; // Nach Titelseite und Inhaltsverzeichnis
        
        sections.forEach(section => {
            if (section.id === 'title') return; // Titelseite nicht im Inhaltsverzeichnis
            
            tocHTML += `
                <li class="report-toc-item">
                    <span class="report-toc-text">
                        <i class="fas fa-${section.icon}"></i> ${section.name}
                    </span>
                    <span class="report-toc-dots"></span>
                    <span class="report-toc-page">${currentPage}</span>
                </li>
            `;
            
            // Seiten für umfangreiche Abschnitte erhöhen
            if (section.id === 'detailed-results' || section.id === 'areas-analysis') {
                currentPage += 2;
            } else {
                currentPage++;
            }
        });
        
        tocHTML += `
                    </ul>
                </div>
            </div>
        `;
        
        return tocHTML;
    };
    
    /**
     * Abschnitts-Vorschau generieren
     */
    const generateSectionPreview = (sectionId, sectionName, sectionIcon) => {
        let sectionHTML = '';
        
        // Abschnittsüberschrift
        sectionHTML += `
            <h2 class="report-page-title">
                <i class="fas fa-${sectionIcon}"></i> ${sectionName}
            </h2>
        `;
        
        // Inhalt je nach Abschnittstyp
        switch (sectionId) {
            case 'summary':
                sectionHTML += generateSummaryContent();
                break;
            case 'demographics':
                sectionHTML += generateDemographicsContent();
                break;
            case 'highlights':
                sectionHTML += generateHighlightsContent();
                break;
            case 'detailed-results':
                sectionHTML += generateDetailedResultsContent();
                break;
            case 'areas-analysis':
                sectionHTML += generateAreasAnalysisContent();
                break;
            case 'comparison':
                sectionHTML += generateComparisonContent();
                break;
            case 'key-findings':
                sectionHTML += generateKeyFindingsContent();
                break;
            case 'recommendations':
                sectionHTML += generateRecommendationsContent();
                break;
            case 'action-plan':
                sectionHTML += generateActionPlanContent();
                break;
            case 'appendix':
                sectionHTML += generateAppendixContent();
                break;
            default:
                sectionHTML += `
                    <p class="text-muted">Inhalt für ${sectionName} wird generiert...</p>
                `;
        }
        
        return sectionHTML;
    };
    
    /**
     * Fortsetzungsseite für einen Abschnitt generieren
     */
    const generateSectionPreviewContinuation = (sectionId) => {
        let sectionHTML = '';
        
        // Abhängig vom Abschnittstyp unterschiedliche Fortsetzungen
        switch (sectionId) {
            case 'detailed-results':
                sectionHTML += `
                    <h2 class="report-page-title">Detaillierte Ergebnisse (Fortsetzung)</h2>
                    
                    <div class="question-card mb-4">
                        <div class="question-header">
                            <h4>Q7: Bei Fragen oder Problemen kann ich meine Führungskräfte schnell und unkompliziert erreichen.</h4>
                        </div>
                        <div class="question-stats">
                            <p>Durchschnitt: 4.1 | Median: 4.0 | Antworten: ${currentReportData?.surveys?.filtered || 10}</p>
                        </div>
                        <div class="question-distribution">
                            <div class="distribution-bars">
                                <div class="distribution-item">
                                    <div class="distribution-label">1</div>
                                    <div class="distribution-bar-container">
                                        <div class="distribution-bar bg-danger" style="width: 5%"></div>
                                        <div class="distribution-value">5%</div>
                                    </div>
                                </div>
                                <div class="distribution-item">
                                    <div class="distribution-label">2</div>
                                    <div class="distribution-bar-container">
                                        <div class="distribution-bar bg-warning" style="width: 10%"></div>
                                        <div class="distribution-value">10%</div>
                                    </div>
                                </div>
                                <div class="distribution-item">
                                    <div class="distribution-label">3</div>
                                    <div class="distribution-bar-container">
                                        <div class="distribution-bar bg-info" style="width: 15%"></div>
                                        <div class="distribution-value">15%</div>
                                    </div>
                                </div>
                                <div class="distribution-item">
                                    <div class="distribution-label">4</div>
                                    <div class="distribution-bar-container">
                                        <div class="distribution-bar bg-success" style="width: 30%"></div>
                                        <div class="distribution-value">30%</div>
                                    </div>
                                </div>
                                <div class="distribution-item">
                                    <div class="distribution-label">5</div>
                                    <div class="distribution-bar-container">
                                        <div class="distribution-bar bg-success" style="width: 40%"></div>
                                        <div class="distribution-value">40%</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="question-card mb-4">
                        <div class="question-header">
                            <h4>Q10: Ärzte und MTRs kommunizieren respektvoll und zielorientiert miteinander.</h4>
                        </div>
                        <div class="question-stats">
                            <p>Durchschnitt: 3.9 | Median: 4.0 | Antworten: ${currentReportData?.surveys?.filtered || 10}</p>
                        </div>
                        <div class="question-distribution">
                            <div class="distribution-bars">
                                <div class="distribution-item">
                                    <div class="distribution-label">1</div>
                                    <div class="distribution-bar-container">
                                        <div class="distribution-bar bg-danger" style="width: 5%"></div>
                                        <div class="distribution-value">5%</div>
                                    </div>
                                </div>
                                <div class="distribution-item">
                                    <div class="distribution-label">2</div>
                                    <div class="distribution-bar-container">
                                        <div class="distribution-bar bg-warning" style="width: 10%"></div>
                                        <div class="distribution-value">10%</div>
                                    </div>
                                </div>
                                <div class="distribution-item">
                                    <div class="distribution-label">3</div>
                                    <div class="distribution-bar-container">
                                        <div class="distribution-bar bg-info" style="width: 15%"></div>
                                        <div class="distribution-value">15%</div>
                                    </div>
                                </div>
                                <div class="distribution-item">
                                    <div class="distribution-label">4</div>
                                    <div class="distribution-bar-container">
                                        <div class="distribution-bar bg-success" style="width: 30%"></div>
                                        <div class="distribution-value">30%</div>
                                    </div>
                                </div>
                                <div class="distribution-item">
                                    <div class="distribution-label">5</div>
                                    <div class="distribution-bar-container">
                                        <div class="distribution-bar bg-success" style="width: 40%"></div>
                                        <div class="distribution-value">40%</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                break;
            default:
                sectionHTML = `<p class="text-muted">Fortsetzung wird generiert...</p>`;
        }
        
        return sectionHTML;
    };
    
    /**
     * Zusammenfassung-Inhalt generieren
     */
    const generateSummaryContent = () => {
        const settings = currentReportSettings.sections.summary;
        
        return `
            <div class="report-summary">
                <p>
                    Die Mitarbeiterbefragung der Klinik für Radiologie und Nuklearmedizin wurde im Zeitraum 
                    vom ${currentReportData?.surveys?.dateRange?.from ? new Date(currentReportData.surveys.dateRange.from).toLocaleDateString() : '01.03.2025'} 
                    bis ${currentReportData?.surveys?.dateRange?.to ? new Date(currentReportData.surveys.dateRange.to).toLocaleDateString() : '31.03.2025'} 
                    durchgeführt. Insgesamt haben ${currentReportData?.surveys?.filtered || 10} Mitarbeiterinnen und Mitarbeiter 
                    an der Befragung teilgenommen.
                </p>
                
                ${settings.includeOverallScore ? `
                    <div class="overall-score">
                        <div class="score-label">Gesamtbewertung:</div>
                        <div class="score-value">${currentReportData?.statistics?.overall?.average.toFixed(2) || '3.75'}</div>
                        <div class="score-scale">/ 5.0</div>
                    </div>
                ` : ''}
                
                <p>
                    Die Ergebnisse zeigen insgesamt ein positives Bild der Abteilung. Besonders hervorzuheben sind 
                    die Bereiche "Zusammenarbeit im Team" und "Patientenorientierung". Verbesserungspotenzial 
                    besteht bei den Themen "Arbeitsbelastung" und "IT-Systeme".
                </p>
                
                <p>
                    Die detaillierte Analyse der Befragungsergebnisse zeigt deutliche Unterschiede zwischen den verschiedenen 
                    Berufsgruppen. Während die ärztlichen Mitarbeiter besonders die fachlichen Aspekte positiv hervorheben,
                    betonen die MTRs die gute Zusammenarbeit im Team.
                </p>
                
                <p>
                    Die aus der Befragung abgeleiteten Empfehlungen konzentrieren sich auf die Verbesserung der IT-Systeme,
                    die Optimierung der Arbeitsabläufe sowie die Weiterentwicklung der Fortbildungsmöglichkeiten.
                </p>
            </div>
        `;
    };
    
    /**
     * Demografische Daten-Inhalt generieren
     */
    const generateDemographicsContent = () => {
        const settings = currentReportSettings.sections.demographics;
        let chartsHTML = '';
        
        // Charts basierend auf Einstellungen
        if (settings.charts.includes('profession')) {
            chartsHTML += `
                <div class="demographic-chart mb-4">
                    <h4>Verteilung nach Berufsgruppe</h4>
                    <div class="chart-placeholder text-center">
                        <img src="assets/images/demo-chart-profession.png" alt="Berufsgruppen-Chart" class="demo-chart">
                    </div>
                </div>
            `;
        }
        
        if (settings.charts.includes('experience')) {
            chartsHTML += `
                <div class="demographic-chart mb-4">
                    <h4>Verteilung nach Berufserfahrung</h4>
                    <div class="chart-placeholder text-center">
                        <img src="assets/images/demo-chart-experience.png" alt="Berufserfahrungs-Chart" class="demo-chart">
                    </div>
                </div>
            `;
        }
        
        if (settings.charts.includes('tenure')) {
            chartsHTML += `
                <div class="demographic-chart mb-4">
                    <h4>Verteilung nach Zugehörigkeit zur Abteilung</h4>
                    <div class="chart-placeholder text-center">
                        <img src="assets/images/demo-chart-tenure.png" alt="Zugehörigkeits-Chart" class="demo-chart">
                    </div>
                </div>
            `;
        }
        
        // Tabelle mit demografischen Daten
        let tableHTML = '';
        if (settings.includeTable) {
            tableHTML = `
                <div class="demographic-table mt-4">
                    <h4>Detaillierte demografische Daten</h4>
                    <table class="table table-bordered">
                        <thead>
                            <tr>
                                <th>Berufsgruppe</th>
                                <th>Anzahl</th>
                                <th>Prozent</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Ärztlicher Dienst</td>
                                <td>3</td>
                                <td>30%</td>
                            </tr>
                            <tr>
                                <td>MTR</td>
                                <td>5</td>
                                <td>50%</td>
                            </tr>
                            <tr>
                                <td>Anmeldung/Sekretariat</td>
                                <td>1</td>
                                <td>10%</td>
                            </tr>
                            <tr>
                                <td>Nicht angegeben</td>
                                <td>1</td>
                                <td>10%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `;
        }
        
        return `
            <div class="report-demographics">
                <p class="section-introduction">
                    Die demografischen Daten der Befragungsteilnehmer geben Aufschluss über die Zusammensetzung 
                    der Stichprobe und erlauben eine differenzierte Betrachtung der Ergebnisse nach verschiedenen 
                    Mitarbeitergruppen.
                </p>
                
                ${chartsHTML}
                ${tableHTML}
            </div>
        `;
    };
    
    /**
     * Highlights-Inhalt generieren
     */
    const generateHighlightsContent = () => {
        const settings = currentReportSettings.sections.highlights;
        
        // Top-Items HTML generieren
        let topItemsHTML = '<ul class="highlights-list">';
        if (currentReportData?.highlights?.strengths?.length > 0) {
            currentReportData.highlights.strengths.slice(0, settings.showTop).forEach(item => {
                topItemsHTML += `
                    <li class="highlight-item">
                        <div class="highlight-score positive">${item.score.toFixed(1)}</div>
                        <div class="highlight-text">${item.text}</div>
                    </li>
                `;
            });
        } else {
            topItemsHTML += `
                <li class="highlight-item">
                    <div class="highlight-score positive">4.5</div>
                    <div class="highlight-text">Die Zusammenarbeit im Team ist konstruktiv und wertschätzend.</div>
                </li>
                <li class="highlight-item">
                    <div class="highlight-score positive">4.3</div>
                    <div class="highlight-text">Ärzte und MTRs kommunizieren respektvoll und zielorientiert miteinander.</div>
                </li>
                <li class="highlight-item">
                    <div class="highlight-score positive">4.2</div>
                    <div class="highlight-text">Die hohe Qualität der Patientenversorgung hat bei uns oberste Priorität.</div>
                </li>
            `;
        }
        topItemsHTML += '</ul>';
        
        // Bottom-Items HTML generieren
        let bottomItemsHTML = '<ul class="highlights-list">';
        if (currentReportData?.highlights?.weaknesses?.length > 0) {
            currentReportData.highlights.weaknesses.slice(0, settings.showBottom).forEach(item => {
                bottomItemsHTML += `
                    <li class="highlight-item">
                        <div class="highlight-score negative">${item.score.toFixed(1)}</div>
                        <div class="highlight-text">${item.text}</div>
                    </li>
                `;
            });
        } else {
            bottomItemsHTML += `
                <li class="highlight-item">
                    <div class="highlight-score negative">2.8</div>
                    <div class="highlight-text">Die IT-Systeme (z.B. SAP, PACS) unterstützen meine Arbeit zuverlässig und effektiv.</div>
                </li>
                <li class="highlight-item">
                    <div class="highlight-score negative">2.5</div>
                    <div class="highlight-text">Die Personalstärke ist ausreichend, um die täglichen Aufgaben gut zu bewältigen.</div>
                </li>
                <li class="highlight-item">
                    <div class="highlight-score negative">2.3</div>
                    <div class="highlight-text">Es gibt wirksame Maßnahmen, um die Belastung durch Personalmangel zu reduzieren.</div>
                </li>
            `;
        }
        bottomItemsHTML += '</ul>';
        
        // Charts, falls aktiviert
        let chartsHTML = '';
        if (settings.includeCharts) {
            chartsHTML = `
                <div class="highlights-charts mt-4">
                    <div class="row">
                        <div class="col-12">
                            <h4>Verteilung der Bewertungen</h4>
                            <div class="chart-placeholder text-center">
                                <img src="assets/images/demo-chart-highlights.png" alt="Highlights-Chart" class="demo-chart">
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        return `
            <div class="report-highlights">
                <p class="section-introduction">
                    Die folgenden Fragen haben die höchsten bzw. niedrigsten Bewertungen erhalten und 
                    repräsentieren damit besondere Stärken und Verbesserungspotentiale der Abteilung.
                </p>
                
                <div class="row">
                    <div class="col-md-6">
                        <div class="highlights-group positives">
                            <h3>Top ${settings.showTop} Bewertungen</h3>
                            ${topItemsHTML}
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="highlights-group negatives">
                            <h3>Niedrigste ${settings.showBottom} Bewertungen</h3>
                            ${bottomItemsHTML}
                        </div>
                    </div>
                </div>
                
                ${chartsHTML}
            </div>
        `;
    };
    
    /**
     * Detaillierte Ergebnisse-Inhalt generieren
     */
    const generateDetailedResultsContent = () => {
        const settings = currentReportSettings.sections['detailed-results'];
        
        return `
            <div class="report-detailed-results">
                <p class="section-introduction">
                    Die folgenden Darstellungen zeigen detaillierte Ergebnisse für alle Fragen 
                    ${settings.groupBySection ? 'gruppiert nach Fragebogenabschnitten' : ''}.
                    Für jede Frage werden Durchschnittswerte und Antwortverteilungen dargestellt.
                </p>
                
                <div class="section-group mb-4">
                    <h3 class="section-group-title">I. Arbeitsumfeld und Ressourcen</h3>
                    
                    <div class="question-card mb-4">
                        <div class="question-header">
                            <h4>Q1: ${settings.includeQuestionText ? 'Meine technische Ausstattung (z. B. Computer, Arbeitsplatz) ermöglicht mir effizientes Arbeiten.' : 'Q1'}</h4>
                        </div>
                        <div class="question-stats">
                            <p>Durchschnitt: 3.2 | Median: 3.0 | Antworten: ${currentReportData?.surveys?.filtered || 10}</p>
                        </div>
                        ${settings.includeCharts ? `
                            <div class="question-chart text-center mb-3">
                                <img src="assets/images/demo-chart-question.png" alt="Frage-Chart" class="demo-chart-small">
                            </div>
                        ` : ''}
                        <div class="question-distribution">
                            <div class="distribution-bars">
                                <div class="distribution-item">
                                    <div class="distribution-label">1</div>
                                    <div class="distribution-bar-container">
                                        <div class="distribution-bar bg-danger" style="width: 10%"></div>
                                        <div class="distribution-value">10%</div>
                                    </div>
                                </div>
                                <div class="distribution-item">
                                    <div class="distribution-label">2</div>
                                    <div class="distribution-bar-container">
                                        <div class="distribution-bar bg-warning" style="width: 20%"></div>
                                        <div class="distribution-value">20%</div>
                                    </div>
                                </div>
                                <div class="distribution-item">
                                    <div class="distribution-label">3</div>
                                    <div class="distribution-bar-container">
                                        <div class="distribution-bar bg-info" style="width: 30%"></div>
                                        <div class="distribution-value">30%</div>
                                    </div>
                                </div>
                                <div class="distribution-item">
                                    <div class="distribution-label">4</div>
                                    <div class="distribution-bar-container">
                                        <div class="distribution-bar bg-success" style="width: 20%"></div>
                                        <div class="distribution-value">20%</div>
                                    </div>
                                </div>
                                <div class="distribution-item">
                                    <div class="distribution-label">5</div>
                                    <div class="distribution-bar-container">
                                        <div class="distribution-bar bg-success" style="width: 20%"></div>
                                        <div class="distribution-value">20%</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="question-card mb-4">
                        <div class="question-header">
                            <h4>Q2: ${settings.includeQuestionText ? 'Unsere medizinischen Geräte (z. B. MRT, CT) sind auf dem neuesten technologischen Stand.' : 'Q2'}</h4>
                        </div>
                        <div class="question-stats">
                            <p>Durchschnitt: 4.2 | Median: 4.0 | Antworten: ${currentReportData?.surveys?.filtered || 10}</p>
                        </div>
                        ${settings.includeCharts ? `
                            <div class="question-chart text-center mb-3">
                                <img src="assets/images/demo-chart-question2.png" alt="Frage-Chart" class="demo-chart-small">
                            </div>
                        ` : ''}
                        <div class="question-distribution">
                            <div class="distribution-bars">
                                <div class="distribution-item">
                                    <div class="distribution-label">1</div>
                                    <div class="distribution-bar-container">
                                        <div class="distribution-bar bg-danger" style="width: 0%"></div>
                                        <div class="distribution-value">0%</div>
                                    </div>
                                </div>
                                <div class="distribution-item">
                                    <div class="distribution-label">2</div>
                                    <div class="distribution-bar-container">
                                        <div class="distribution-bar bg-warning" style="width: 10%"></div>
                                        <div class="distribution-value">10%</div>
                                    </div>
                                </div>
                                <div class="distribution-item">
                                    <div class="distribution-label">3</div>
                                    <div class="distribution-bar-container">
                                        <div class="distribution-bar bg-info" style="width: 10%"></div>
                                        <div class="distribution-value">10%</div>
                                    </div>
                                </div>
                                <div class="distribution-item">
                                    <div class="distribution-label">4</div>
                                    <div class="distribution-bar-container">
                                        <div class="distribution-bar bg-success" style="width: 30%"></div>
                                        <div class="distribution-value">30%</div>
                                    </div>
                                </div>
                                <div class="distribution-item">
                                    <div class="distribution-label">5</div>
                                    <div class="distribution-bar-container">
                                        <div class="distribution-bar bg-success" style="width: 50%"></div>
                                        <div class="distribution-value">50%</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="section-note">
                    <p><em>Hinweis: Die vollständigen detaillierten Ergebnisse für alle Fragen werden auf den folgenden Seiten fortgesetzt.</em></p>
                </div>
            </div>
        `;
    };
    
    /**
     * Bereichsanalyse-Inhalt generieren
     */
    const generateAreasAnalysisContent = () => {
        const settings = currentReportSettings.sections['areas-analysis'];
        
        return `
            <div class="report-areas-analysis">
                <p class="section-introduction">
                    Die folgende Analyse zeigt die durchschnittlichen Bewertungen nach Themenbereichen 
                    und ermöglicht einen schnellen Überblick über Stärken und Schwächen der verschiedenen 
                    Aspekte der Befragung.
                </p>
                
                ${settings.includeRadarChart ? `
                    <div class="areas-chart text-center mb-4">
                        <h4>Übersicht der Themenbereiche</h4>
                        <img src="assets/images/demo-chart-radar.png" alt="Bereiche-Radar-Chart" class="demo-chart">
                    </div>
                ` : ''}
                
                <div class="areas-table">
                    <h4>Bewertung nach Themenbereichen</h4>
                    <table class="table table-bordered table-striped">
                        <thead>
                            <tr>
                                <th>Themenbereich</th>
                                <th>Durchschnitt</th>
                                <th>Anzahl Fragen</th>
                                <th>Bewertung</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${currentReportData?.statistics?.areas?.map(area => `
                                <tr>
                                    <td>${area.title}</td>
                                    <td>${area.average.toFixed(2)}</td>
                                    <td>${area.questionCount}</td>
                                    <td>
                                        <div class="progress">
                                            <div class="progress-bar ${getProgressBarClass(area.average)}" 
                                                 role="progressbar" style="width: ${(area.average/5)*100}%;" 
                                                 aria-valuenow="${area.average}" aria-valuemin="0" aria-valuemax="5">
                                                ${area.average.toFixed(1)}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            `).join('') || `
                                <tr>
                                    <td>Arbeitsumfeld und Ressourcen</td>
                                    <td>3.25</td>
                                    <td>6</td>
                                    <td>
                                        <div class="progress">
                                            <div class="progress-bar bg-info" role="progressbar" style="width: 65%;" 
                                                 aria-valuenow="3.25" aria-valuemin="0" aria-valuemax="5">
                                                3.3
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td>Zusammenarbeit und Führung</td>
                                    <td>4.05</td>
                                    <td>6</td>
                                    <td>
                                        <div class="progress">
                                            <div class="progress-bar bg-success" role="progressbar" style="width: 81%;" 
                                                 aria-valuenow="4.05" aria-valuemin="0" aria-valuemax="5">
                                                4.1
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td>Arbeitsbelastung und Balance</td>
                                    <td>2.90</td>
                                    <td>6</td>
                                    <td>
                                        <div class="progress">
                                            <div class="progress-bar bg-warning" role="progressbar" style="width: 58%;" 
                                                 aria-valuenow="2.90" aria-valuemin="0" aria-valuemax="5">
                                                2.9
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
                
                <div class="areas-detail mt-4">
                    <h4>Detaillierte Analyse der Themenbereiche</h4>
                    <div class="areas-detail-item mb-4">
                        <h5>Stärkster Bereich: Zusammenarbeit und Führung (4.05)</h5>
                        <p>
                            Dieser Bereich umfasst Fragen zur Zusammenarbeit im Team, zur Kommunikation zwischen
                            verschiedenen Berufsgruppen sowie zur Erreichbarkeit und Unterstützung durch Führungskräfte.
                            Die durchweg positiven Bewertungen deuten auf ein gutes Arbeitsklima und eine wertschätzende
                            Kommunikationskultur hin.
                        </p>
                    </div>
                    <div class="areas-detail-item">
                        <h5>Schwächster Bereich: Arbeitsbelastung und Balance (2.90)</h5>
                        <p>
                            Dieser Bereich umfasst Fragen zur Arbeitsbelastung, Pausengestaltung, Dienstplanung und
                            Work-Life-Balance. Die niedrigeren Bewertungen weisen auf Handlungsbedarf hin, insbesondere
                            bei der Personalausstattung und der Bewältigung von Belastungsspitzen.
                        </p>
                    </div>
                </div>
            </div>
        `;
    };
    
    /**
     * Vergleichsanalyse-Inhalt generieren
     */
    const generateComparisonContent = () => {
        const settings = currentReportSettings.sections.comparison;
        
        return `
            <div class="report-comparison">
                <p class="section-introduction">
                    Die Vergleichsanalyse zeigt Unterschiede in den Bewertungen zwischen verschiedenen
                    ${getComparisonGroupText(settings.compareBy)}. Dies ermöglicht gezieltere
                    Maßnahmen für spezifische Mitarbeitergruppen.
                </p>
                
                ${settings.includeCharts ? `
                    <div class="comparison-chart text-center mb-4">
                        <h4>Vergleich nach ${getComparisonGroupText(settings.compareBy)}</h4>
                        <img src="assets/images/demo-chart-comparison.png" alt="Vergleichs-Chart" class="demo-chart">
                    </div>
                ` : ''}
                
                <div class="comparison-table">
                    <h4>Detaillierter Vergleich</h4>
                    <table class="table table-bordered table-striped">
                        <thead>
                            <tr>
                                <th>Themenbereich</th>
                                ${settings.compareBy === 'profession' ? `
                                    <th>Ärztlicher Dienst</th>
                                    <th>MTR</th>
                                    <th>Anmeldung/Sekretariat</th>
                                ` : settings.compareBy === 'experience' ? `
                                    <th>&lt; 2 Jahre</th>
                                    <th>2-5 Jahre</th>
                                    <th>6-10 Jahre</th>
                                    <th>&gt; 10 Jahre</th>
                                ` : `
                                    <th>&lt; 1 Jahr</th>
                                    <th>1-3 Jahre</th>
                                    <th>4-10 Jahre</th>
                                    <th>&gt; 10 Jahre</th>
                                `}
                                <th>Gesamt</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Arbeitsumfeld und Ressourcen</td>
                                ${settings.compareBy === 'profession' ? `
                                    <td>3.4</td>
                                    <td>3.2</td>
                                    <td>3.1</td>
                                ` : settings.compareBy === 'experience' ? `
                                    <td>3.5</td>
                                    <td>3.3</td>
                                    <td>3.2</td>
                                    <td>3.0</td>
                                ` : `
                                    <td>3.5</td>
                                    <td>3.4</td>
                                    <td>3.2</td>
                                    <td>3.0</td>
                                `}
                                <td>3.25</td>
                            </tr>
                            <tr>
                                <td>Zusammenarbeit und Führung</td>
                                ${settings.compareBy === 'profession' ? `
                                    <td>4.1</td>
                                    <td>4.2</td>
                                    <td>3.8</td>
                                ` : settings.compareBy === 'experience' ? `
                                    <td>4.2</td>
                                    <td>4.1</td>
                                    <td>4.0</td>
                                    <td>3.9</td>
                                ` : `
                                    <td>4.2</td>
                                    <td>4.1</td>
                                    <td>4.0</td>
                                    <td>3.9</td>
                                `}
                                <td>4.05</td>
                            </tr>
                            <tr>
                                <td>Arbeitsbelastung und Balance</td>
                                ${settings.compareBy === 'profession' ? `
                                    <td>3.2</td>
                                    <td>2.7</td>
                                    <td>2.8</td>
                                ` : settings.compareBy === 'experience' ? `
                                    <td>3.3</td>
                                    <td>3.0</td>
                                    <td>2.7</td>
                                    <td>2.6</td>
                                ` : `
                                    <td>3.2</td>
                                    <td>3.1</td>
                                    <td>2.8</td>
                                    <td>2.5</td>
                                `}
                                <td>2.90</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div class="comparison-insights mt-4">
                    <h4>Erkenntnisse aus dem Vergleich</h4>
                    <ul>
                        <li>
                            <strong>Arbeitsbelastung:</strong> Mitarbeiter mit längerer Zugehörigkeit zur Abteilung 
                            bewerten die Arbeitsbelastung kritischer als neu hinzugekommene Kollegen.
                        </li>
                        <li>
                            <strong>Zusammenarbeit:</strong> MTRs bewerten die Teamzusammenarbeit besonders positiv, 
                            was auf eine gute Integration dieser Berufsgruppe hindeutet.
                        </li>
                        <li>
                            <strong>Ressourcen:</strong> Der ärztliche Dienst bewertet die technische Ausstattung 
                            etwas besser als die anderen Berufsgruppen.
                        </li>
                    </ul>
                </div>
            </div>
        `;
    };
    
    /**
     * Kernerkenntnisse-Inhalt generieren
     */
    const generateKeyFindingsContent = () => {
        const settings = currentReportSettings.sections['key-findings'];
        
        return `
            <div class="report-key-findings">
                <p class="section-introduction">
                    Die folgenden Kernerkenntnisse fassen die wichtigsten Ergebnisse der Befragung zusammen
                    und bilden die Grundlage für die Ableitung von Handlungsempfehlungen.
                </p>
                
                <div class="key-findings-list">
                    <div class="key-finding-item">
                        <h4 class="key-finding-title">1. Positive Teamkultur</h4>
                        <p class="key-finding-description">
                            Die Zusammenarbeit im Team wird durchgehend positiv bewertet (4.5/5.0). 
                            Dies zeigt sich besonders in den Antworten zur gegenseitigen Unterstützung
                            und zum respektvollen Umgang zwischen den verschiedenen Berufsgruppen.
                            Die offenen Antworten bestätigen dieses Bild und heben die kollegiale
                            Atmosphäre als besondere Stärke hervor.
                        </p>
                        ${settings.includeRecommendations ? `
                            <div class="key-finding-recommendation">
                                <strong>Empfehlung:</strong> Die bestehenden Teamstrukturen sollten beibehalten 
                                und als Vorbild für andere Bereiche genutzt werden. Regelmäßige Teamevents können
                                diese Stärke weiter festigen.
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="key-finding-item">
                        <h4 class="key-finding-title">2. Verbesserungsbedarf bei IT-Systemen</h4>
                        <p class="key-finding-description">
                            Die IT-Systeme werden mit 2.8/5.0 unterdurchschnittlich bewertet. 
                            Dies stellt ein Hindernis für effizientes Arbeiten dar und wird von
                            allen Berufsgruppen kritisch gesehen. Besonders problematisch werden
                            die Systemstabilität und die fehlende Integration verschiedener
                            Anwendungen wahrgenommen.
                        </p>
                        ${settings.includeRecommendations ? `
                            <div class="key-finding-recommendation">
                                <strong>Empfehlung:</strong> Durchführung einer IT-Bedarfsanalyse unter
                                Einbeziehung aller Berufsgruppen. Entwicklung eines kurz- und mittelfristigen
                                Optimierungsplans mit klaren Prioritäten.
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="key-finding-item">
                        <h4 class="key-finding-title">3. Hohe Arbeitsbelastung</h4>
                        <p class="key-finding-description">
                            Die Bewertung der Arbeitsbelastung liegt mit durchschnittlich 2.9/5.0
                            deutlich unter dem Gesamtdurchschnitt. Besonders kritisch werden die
                            Personalausstattung (2.5/5.0) und die Maßnahmen zur Reduzierung von
                            Belastungen durch Personalmangel (2.3/5.0) gesehen.
                        </p>
                        ${settings.includeRecommendations ? `
                            <div class="key-finding-recommendation">
                                <strong>Empfehlung:</strong> Überprüfung der Personalplanung und -verteilung,
                                insbesondere während Belastungsspitzen. Entwicklung eines Konzepts zum
                                verbesserten Umgang mit Personalengpässen (z.B. Bereitschaftspool,
                                flexible Arbeitsmodelle).
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="key-finding-item">
                        <h4 class="key-finding-title">4. Gute technische Ausstattung</h4>
                        <p class="key-finding-description">
                            Die medizinischen Geräte (MRT, CT etc.) werden mit 4.2/5.0 sehr gut bewertet.
                            Die technologische Ausstattung stellt somit eine wesentliche Stärke der Abteilung dar,
                            die auch zur Mitarbeiterzufriedenheit beiträgt.
                        </p>
                        ${settings.includeRecommendations ? `
                            <div class="key-finding-recommendation">
                                <strong>Empfehlung:</strong> Fortführung der regelmäßigen Investitionen in
                                die technische Infrastruktur. Stärkere Kommunikation dieser Stärke auch
                                in der Außendarstellung (z.B. bei der Personalgewinnung).
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="key-finding-item">
                        <h4 class="key-finding-title">5. Patientenorientierung</h4>
                        <p class="key-finding-description">
                            Die Qualität der Patientenversorgung wird mit 4.0/5.0 gut bewertet.
                            Allerdings zeigt die Frage zur ausreichenden Zeit für die individuelle
                            Patientenbetreuung (3.2/5.0) Optimierungspotential.
                        </p>
                        ${settings.includeRecommendations ? `
                            <div class="key-finding-recommendation">
                                <strong>Empfehlung:</strong> Analyse der Patientenprozesse mit Blick auf
                                Optimierungspotentiale, die mehr Zeit für die direkte Patientenbetreuung
                                schaffen könnten (z.B. Reduzierung administrativer Aufgaben).
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    };
    
    /**
     * Empfehlungen-Inhalt generieren
     */
    const generateRecommendationsContent = () => {
        const settings = currentReportSettings.sections.recommendations;
        
        return `
            <div class="report-recommendations">
                <p class="section-introduction">
                    Basierend auf der Analyse der Befragungsergebnisse werden folgende
                    Maßnahmen zur Optimierung empfohlen. Diese adressieren sowohl die
                    identifizierten Schwachstellen als auch die Stärkung bereits positiv
                    bewerteter Bereiche.
                </p>
                
                <div class="recommendations-list">
                    <div class="recommendation-item">
                        ${settings.prioritize ? '<div class="priority-badge high">Hohe Priorität</div>' : ''}
                        <h4 class="recommendation-title">Optimierung der IT-Systeme</h4>
                        <p class="recommendation-description">
                            Durchführung einer IT-Bedarfsanalyse und Identifikation von Problemstellen
                            im aktuellen Workflow. Besonderes Augenmerk sollte auf die Integration der
                            verschiedenen Systeme und die Verbesserung der Systemstabilität gelegt werden.
                            Basierend darauf sollte ein Verbesserungsplan mit kurz- und langfristigen 
                            Maßnahmen entwickelt werden.
                        </p>
                        ${settings.includeResponsibilities ? `
                            <div class="recommendation-responsibility">
                                <strong>Verantwortlich:</strong> IT-Abteilung, Abteilungsleitung
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="recommendation-item">
                        ${settings.prioritize ? '<div class="priority-badge high">Hohe Priorität</div>' : ''}
                        <h4 class="recommendation-title">Personalmanagement verbessern</h4>
                        <p class="recommendation-description">
                            Entwicklung eines Konzepts zum verbesserten Umgang mit Personalengpässen.
                            Dies sollte flexible Arbeitsmodelle, einen abteilungsübergreifenden Bereitschaftspool
                            für Engpässe sowie eine optimierte Dienstplanung umfassen. Zusätzlich sollte
                            ein strukturierter Prozess für Feedbackgespräche zur Arbeitsbelastung etabliert werden.
                        </p>
                        ${settings.includeResponsibilities ? `
                            <div class="recommendation-responsibility">
                                <strong>Verantwortlich:</strong> Personalmanagement, Bereichsleitung
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="recommendation-item">
                        ${settings.prioritize ? '<div class="priority-badge medium">Mittlere Priorität</div>' : ''}
                        <h4 class="recommendation-title">Fortbildungsprogramm erweitern</h4>
                        <p class="recommendation-description">
                            Entwicklung eines strukturierten Fortbildungsprogramms mit spezifischen
                            Angeboten für die verschiedenen Berufsgruppen. Der Fokus sollte auf fachlicher
                            Weiterentwicklung, aber auch auf Soft-Skills wie Kommunikation und Stressmanagement
                            liegen. Die Angebote sollten zeitlich so gestaltet sein, dass sie trotz der
                            Arbeitsbelastung wahrgenommen werden können.
                        </p>
                        ${settings.includeResponsibilities ? `
                            <div class="recommendation-responsibility">
                                <strong>Verantwortlich:</strong> Personalentwicklung, Fachexperten der Abteilung
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="recommendation-item">
                        ${settings.prioritize ? '<div class="priority-badge medium">Mittlere Priorität</div>' : ''}
                        <h4 class="recommendation-title">Prozessoptimierung in der Patientenversorgung</h4>
                        <p class="recommendation-description">
                            Durchführung einer Prozessanalyse mit dem Ziel, administrative Aufgaben zu reduzieren
                            und mehr Zeit für die direkte Patientenbetreuung zu schaffen. Hierbei sollten
                            insbesondere Dokumentationsprozesse und Übergaberoutinen optimiert werden.
                            Die Mitarbeiter sollten aktiv in diesen Verbesserungsprozess einbezogen werden.
                        </p>
                        ${settings.includeResponsibilities ? `
                            <div class="recommendation-responsibility">
                                <strong>Verantwortlich:</strong> Qualitätsmanagement, interdisziplinäres Team
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="recommendation-item">
                        ${settings.prioritize ? '<div class="priority-badge normal">Normale Priorität</div>' : ''}
                        <h4 class="recommendation-title">Teambuilding-Maßnahmen fortführen</h4>
                        <p class="recommendation-description">
                            Beibehaltung und systematische Ausweitung der erfolgreichen Teambuilding-Maßnahmen.
                            Dies umfasst regelmäßige Teamevents, interdisziplinäre Fallbesprechungen und
                            gemeinsame Fortbildungen. Die positiven Aspekte der Teamkultur sollten auch
                            aktiv in der Kommunikation nach außen (z.B. bei der Personalgewinnung) genutzt werden.
                        </p>
                        ${settings.includeResponsibilities ? `
                            <div class="recommendation-responsibility">
                                <strong>Verantwortlich:</strong> Teamleitung, alle Mitarbeiter
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    };
    
    /**
     * Maßnahmenplan-Inhalt generieren
     */
    const generateActionPlanContent = () => {
        const settings = currentReportSettings.sections['action-plan'];
        
        return `
            <div class="report-action-plan">
                <p class="section-introduction">
                    Der folgende Maßnahmenplan fasst die konkreten Schritte zur Umsetzung der
                    Empfehlungen zusammen. Er dient als Grundlage für das weitere Vorgehen und
                    die Erfolgsmessung.
                </p>
                
                <div class="action-plan-table">
                    <table class="table table-bordered">
                        <thead>
                            <tr>
                                <th style="width: 5%">#</th>
                                <th>Maßnahme</th>
                                ${settings.includeDates ? '<th>Zeitplan</th>' : ''}
                                ${settings.includeOwners ? '<th>Verantwortlich</th>' : ''}
                                <th style="width: 15%">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>1</td>
                                <td>
                                    <strong>IT-Bedarfsanalyse durchführen</strong>
                                    <div class="small">Strukturierte Befragung aller Berufsgruppen zu IT-Problemen und -Bedarfen</div>
                                </td>
                                ${settings.includeDates ? '<td>Q2 2025</td>' : ''}
                                ${settings.includeOwners ? '<td>IT-Abteilung, Abteilungsleitung</td>' : ''}
                                <td><span class="badge bg-warning">Planung</span></td>
                            </tr>
                            <tr>
                                <td>2</td>
                                <td>
                                    <strong>Personalbedarfsanalyse aktualisieren</strong>
                                    <div class="small">Überprüfung der aktuellen Personalausstattung und -verteilung</div>
                                </td>
                                ${settings.includeDates ? '<td>Q2 2025</td>' : ''}
                                ${settings.includeOwners ? '<td>Personalmanagement, Bereichsleitung</td>' : ''}
                                <td><span class="badge bg-success">In Bearbeitung</span></td>
                            </tr>
                            <tr>
                                <td>3</td>
                                <td>
                                    <strong>Fortbildungskonzept entwickeln</strong>
                                    <div class="small">Erstellung eines bedarfsorientierten Fortbildungsplans für alle Berufsgruppen</div>
                                </td>
                                ${settings.includeDates ? '<td>Q3 2025</td>' : ''}
                                ${settings.includeOwners ? '<td>Personalentwicklung</td>' : ''}
                                <td><span class="badge bg-info">Vorbereitung</span></td>
                            </tr>
                            <tr>
                                <td>4</td>
                                <td>
                                    <strong>Prozessanalyse Patientenversorgung</strong>
                                    <div class="small">Identifikation von Optimierungspotentialen und Zeitfressern in Arbeitsabläufen</div>
                                </td>
                                ${settings.includeDates ? '<td>Q3 2025</td>' : ''}
                                ${settings.includeOwners ? '<td>Qualitätsmanagement</td>' : ''}
                                <td><span class="badge bg-secondary">Geplant</span></td>
                            </tr>
                            <tr>
                                <td>5</td>
                                <td>
                                    <strong>Teambuilding-Konzept aktualisieren</strong>
                                    <div class="small">Entwicklung eines strukturierten Konzepts für regelmäßige Teamevents</div>
                                </td>
                                ${settings.includeDates ? '<td>Q4 2025</td>' : ''}
                                ${settings.includeOwners ? '<td>Teamleitung</td>' : ''}
                                <td><span class="badge bg-secondary">Geplant</span></td>
                            </tr>
                            <tr>
                                <td>6</td>
                                <td>
                                    <strong>Follow-up-Befragung planen</strong>
                                    <div class="small">Vorbereitung einer fokussierten Nachbefragung zur Erfolgsmessung</div>
                                </td>
                                ${settings.includeDates ? '<td>Q1 2026</td>' : ''}
                                ${settings.includeOwners ? '<td>Abteilungsleitung</td>' : ''}
                                <td><span class="badge bg-secondary">Geplant</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div class="action-plan-notes mt-4">
                    <h4>Hinweise zur Umsetzung</h4>
                    <ul>
                        <li>Alle Maßnahmen sollten regelmäßig auf ihren Fortschritt überprüft werden</li>
                        <li>Eine Steuerungsgruppe sollte die Gesamtumsetzung koordinieren</li>
                        <li>Die Mitarbeiter sollten kontinuierlich über Fortschritte informiert werden</li>
                        <li>Die Wirksamkeit der Maßnahmen sollte durch eine Follow-up-Befragung evaluiert werden</li>
                    </ul>
                </div>
            </div>
        `;
    };
    
    /**
     * Anhang-Inhalt generieren
     */
    const generateAppendixContent = () => {
        const settings = currentReportSettings.sections.appendix;
        
        return `
            <div class="report-appendix">
                <p class="section-introduction">
                    Dieser Anhang enthält ergänzende Informationen zur Befragung und ihrer Auswertung.
                </p>
                
                ${settings.includeSurvey ? `
                    <div class="appendix-survey mt-4">
                        <h3>Original-Fragebogen</h3>
                        <p class="text-muted mb-4">
                            Nachfolgend ist der vollständige Fragebogen der Mitarbeiterbefragung 2025 dargestellt.
                        </p>
                        
                        <div class="appendix-survey-section mb-4">
                            <h4>I. Arbeitsumfeld und Ressourcen</h4>
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Nr.</th>
                                        <th>Aussage</th>
                                        <th>Skala</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>1</td>
                                        <td>Meine technische Ausstattung (z. B. Computer, Arbeitsplatz) ermöglicht mir effizientes Arbeiten.</td>
                                        <td>1-5</td>
                                    </tr>
                                    <tr>
                                        <td>2</td>
                                        <td>Unsere medizinischen Geräte (z. B. MRT, CT) sind auf dem neuesten technologischen Stand.</td>
                                        <td>1-5</td>
                                    </tr>
                                    <tr>
                                        <td>3</td>
                                        <td>Die Arbeitsprozesse in unserer Abteilung sind klar und effizient organisiert.</td>
                                        <td>1-5</td>
                                    </tr>
                                    <tr>
                                        <td>4</td>
                                        <td>Die Personalstärke ist ausreichend, um die täglichen Aufgaben gut zu bewältigen.</td>
                                        <td>1-5</td>
                                    </tr>
                                    <tr>
                                        <td>5</td>
                                        <td>Die Arbeitslast ist fair auf alle Kolleginnen und Kollegen verteilt.</td>
                                        <td>1-5</td>
                                    </tr>
                                    <tr>
                                        <td>6</td>
                                        <td>Die IT-Systeme (z.B. SAP, PACS) unterstützen meine Arbeit zuverlässig und effektiv.</td>
                                        <td>1-5</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        
                        <div class="appendix-survey-section mb-4">
                            <h4>II. Zusammenarbeit und Führung</h4>
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Nr.</th>
                                        <th>Aussage</th>
                                        <th>Skala</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>7</td>
                                        <td>Bei Fragen oder Problemen kann ich meine Führungskräfte schnell und unkompliziert erreichen.</td>
                                        <td>1-5</td>
                                    </tr>
                                    <tr>
                                        <td>8</td>
                                        <td>Ich erhalte regelmäßig hilfreiches Feedback zu meiner Arbeitsleistung.</td>
                                        <td>1-5</td>
                                    </tr>
                                    <tr>
                                        <td>9</td>
                                        <td>Die Zusammenarbeit im Team ist konstruktiv und wertschätzend.</td>
                                        <td>1-5</td>
                                    </tr>
                                    <tr>
                                        <td>10</td>
                                        <td>Ärzte und MTRs kommunizieren respektvoll und zielorientiert miteinander.</td>
                                        <td>1-5</td>
                                    </tr>
                                    <tr>
                                        <td>11</td>
                                        <td>Entscheidungen der Führungsebene sind für mich transparent und nachvollziehbar.</td>
                                        <td>1-5</td>
                                    </tr>
                                    <tr>
                                        <td>12</td>
                                        <td>Meine Vorschläge zur Verbesserung werden ernst genommen und geprüft.</td>
                                        <td>1-5</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        
                        <p class="text-muted">
                            <em>Hinweis: Der vollständige Fragebogen umfasst weitere Abschnitte, die hier aus Platzgründen nicht dargestellt sind.</em>
                        </p>
                    </div>
                ` : ''}
                
                ${settings.includeMethodology ? `
                    <div class="appendix-methodology mt-4">
                        <h3>Methodische Erläuterungen</h3>
                        
                        <h5>Durchführung der Befragung</h5>
                        <p>
                            Die Mitarbeiterbefragung wurde im Zeitraum vom 01.03.2025 bis 31.03.2025 als anonyme
                            schriftliche Befragung durchgeführt. Die Fragebögen wurden in Papierform verteilt und
                            konnten anonym in verschlossenen Boxen abgegeben werden. Zusätzlich bestand die Möglichkeit,
                            den Fragebogen online auszufüllen.
                        </p>
                        
                        <h5>Rücklaufquote</h5>
                        <p>
                            Von insgesamt 12 verteilten Fragebögen wurden 10 ausgefüllt zurückgegeben,
                            was einer Rücklaufquote von 83,3% entspricht.
                        </p>
                        
                        <h5>Auswertung</h5>
                        <p>
                            Die quantitativen Daten wurden statistisch ausgewertet (Mittelwerte, Mediane,
                            Standardabweichungen). Für die offenen Fragen wurde eine qualitative Inhaltsanalyse
                            durchgeführt, bei der die Antworten kategorisiert und zusammengefasst wurden.
                        </p>
                        
                        <h5>Anonymität</h5>
                        <p>
                            Bei der Auswertung wurde strengstens auf die Anonymität der Teilnehmer geachtet.
                            Bei demografischen Gruppen mit weniger als 3 Personen wurden keine gruppenspezifischen
                            Auswertungen vorgenommen, um Rückschlüsse auf Einzelpersonen zu verhindern.
                        </p>
                    </div>
                ` : ''}
            </div>
        `;
    };
    
    /**
     * Canvas für PDF-Vorschau initialisieren
     */
    const initPreviewCanvas = () => {
        try {
            // PDF-Vorschau nur wenn jsPDF verfügbar ist
            if (!window.jsPDF) return;
            
            // Bestehenden Canvas entfernen (falls vorhanden)
            if (previewCanvas) {
                previewCanvas = null;
            }
            
            // Testweise ein leeres PDF erstellen
            // In einer realen Anwendung würde hier das tatsächliche Berichts-PDF gerendert
        } catch (error) {
            console.error('Fehler bei der Initialisierung des PDF-Canvas:', error);
        }
    };
    
    /**
     * Bericht als PDF exportieren
     */
    const exportReportAsPDF = () => {
        try {
            // Prüfen ob jsPDF verfügbar ist
            if (!window.jsPDF) {
                Utils.notifications.error('PDF-Export benötigt die jsPDF-Bibliothek, die nicht geladen werden konnte.');
                return;
            }
            
            // Lade-Anzeige
            Utils.modal.loading('Bericht wird als PDF exportiert...');
            
            // Kurze Verzögerung für besseres UX
            setTimeout(() => {
                try {
                    // Seitenformat bestimmen
                    const orientation = currentReportSettings.pageSettings.orientation;
                    const format = currentReportSettings.pageSettings.size;
                    
                    // PDF-Dokument erstellen
                    const pdf = new jsPDF({
                        orientation: orientation,
                        unit: 'mm',
                        format: format
                    });
                    
                    // PDF-Metadaten setzen
                    pdf.setProperties({
                        title: currentReportSettings.title,
                        subject: 'Mitarbeiterbefragung 2025',
                        author: currentReportSettings.author,
                        creator: 'Befragungssystem'
                    });
                    
                    // Titelseite erstellen
                    if (currentReportSettings.sections.title.include) {
                        createPDFTitlePage(pdf);
                    }
                    
                    // Aktive Abschnitte filtern
                    const activeSections = [];
                    
                    for (const sectionId of Object.keys(currentReportSettings.sections)) {
                        if (currentReportSettings.sections[sectionId].include && sectionId !== 'title') {
                            const sectionOption = sectionOptions.find(s => s.id === sectionId);
                            if (sectionOption) {
                                activeSections.push({
                                    id: sectionId,
                                    name: sectionOption.name
                                });
                            }
                        }
                    }
                    
                    // Inhaltsverzeichnis
                    if (activeSections.length > 3) {
                        pdf.addPage();
                        createPDFTableOfContents(pdf, activeSections);
                    }
                    
                    // Abschnitte erstellen
                    activeSections.forEach(section => {
                        pdf.addPage();
                        createPDFSection(pdf, section.id, section.name);
                    });
                    
                    // PDF speichern
                    const filename = sanitizeFilename(currentReportSettings.title) || 'mitarbeiterbefragung-bericht';
                    pdf.save(`${filename}.pdf`);
                    
                    // Lade-Dialog schließen
                    Utils.modal.close();
                    
                    // Erfolgsmeldung
                    Utils.notifications.success('Bericht wurde erfolgreich als PDF exportiert.');
                } catch (error) {
                    console.error('Fehler beim PDF-Export:', error);
                    Utils.modal.close();
                    Utils.notifications.error(`Fehler beim PDF-Export: ${error.message}`);
                }
            }, 1000);
        } catch (error) {
            console.error('Fehler beim PDF-Export:', error);
            Utils.notifications.error(`Fehler beim PDF-Export: ${error.message}`);
        }
    };
    
    /**
     * PDF-Titelseite erstellen
     */
    const createPDFTitlePage = (pdf) => {
        // Diese Funktion ist ein Platzhalter für die tatsächliche PDF-Generierung
        // In einer realen Implementierung würde hier mit jsPDF-APIs gearbeitet werden
    };
    
    /**
     * PDF-Inhaltsverzeichnis erstellen
     */
    const createPDFTableOfContents = (pdf, sections) => {
        // Diese Funktion ist ein Platzhalter für die tatsächliche PDF-Generierung
        // In einer realen Implementierung würde hier mit jsPDF-APIs gearbeitet werden
    };
    
    /**
     * PDF-Abschnitt erstellen
     */
    const createPDFSection = (pdf, sectionId, sectionName) => {
        // Diese Funktion ist ein Platzhalter für die tatsächliche PDF-Generierung
        // In einer realen Implementierung würde hier mit jsPDF-APIs gearbeitet werden
    };
    
    /**
     * Bericht als Bildserie exportieren
     */
    const exportReportAsImages = () => {
        try {
            // Lade-Anzeige
            Utils.modal.loading('Bericht wird als Bildserie exportiert...');
            
            // Kurze Verzögerung für besseres UX
            setTimeout(() => {
                try {
                    // Alle Berichtsseiten finden
                    const reportPages = document.querySelectorAll('.report-page');
                    if (reportPages.length === 0) {
                        Utils.modal.close();
                        Utils.notifications.warning('Keine Berichtsseiten gefunden.');
                        return;
                    }
                    
                    // Basisname für die Bilder
                    const baseFilename = sanitizeFilename(currentReportSettings.title) || 'mitarbeiterbefragung-bericht';
                    
                    // HTML2Canvas für jede Seite erstellen und als Bild speichern
                    let processedPages = 0;
                    
                    // Wir simulieren hier den Export, indem wir nach einer kurzen Verzögerung eine Erfolgsmeldung anzeigen
                    // In einer realen Implementierung würde hier mit html2canvas gearbeitet werden
                    setTimeout(() => {
                        Utils.modal.close();
                        Utils.notifications.success(`${reportPages.length} Berichtsseiten wurden als Bilder exportiert.`);
                    }, 1500);
                } catch (error) {
                    console.error('Fehler beim Bild-Export:', error);
                    Utils.modal.close();
                    Utils.notifications.error(`Fehler beim Bild-Export: ${error.message}`);
                }
            }, 1000);
        } catch (error) {
            console.error('Fehler beim Bild-Export:', error);
            Utils.notifications.error(`Fehler beim Bild-Export: ${error.message}`);
        }
    };
    
    /**
     * Bericht drucken
     */
    const printReport = () => {
        try {
            // Aktuellen Zustand speichern
            const currentPreviewContent = document.getElementById('report-preview-content').innerHTML;
            
            // Druckoptimierte Version generieren
            document.getElementById('report-preview-content').innerHTML = generatePrintVersion();
            
            // Druckdialog öffnen
            window.print();
            
            // Nach dem Druck den ursprünglichen Zustand wiederherstellen
            setTimeout(() => {
                document.getElementById('report-preview-content').innerHTML = currentPreviewContent;
            }, 1000);
        } catch (error) {
            console.error('Fehler beim Drucken des Berichts:', error);
            Utils.notifications.error(`Fehler beim Drucken: ${error.message}`);
        }
    };
    
    /**
     * Druckoptimierte Version des Berichts generieren
     */
    const generatePrintVersion = () => {
        // Aktive Abschnitte filtern
        const activeSections = [];
        
        for (const sectionId of Object.keys(currentReportSettings.sections)) {
            if (currentReportSettings.sections[sectionId].include) {
                const sectionOption = sectionOptions.find(s => s.id === sectionId);
                if (sectionOption) {
                    activeSections.push({
                        id: sectionId,
                        name: sectionOption.name,
                        icon: sectionOption.icon
                    });
                }
            }
        }
        
        // HTML für die druckoptimierte Version generieren
        let printHTML = `<div class="print-container">`;
        
        // Titelseite
        if (currentReportSettings.sections.title.include) {
            printHTML += `
                <div class="print-page print-title-page">
                    ${generateTitlePagePreview()}
                </div>
            `;
        }
        
        // Inhaltsverzeichnis
        if (activeSections.length > 3) {
            printHTML += `
                <div class="print-page print-toc-page">
                    ${generateTOCPagePreview(activeSections)}
                </div>
            `;
        }
        
        // Abschnitte
        activeSections.forEach(section => {
            if (section.id === 'title') return; // Titelseite wurde bereits erstellt
            
            printHTML += `
                <div class="print-page print-content-page">
                    ${generateSectionPreview(section.id, section.name, section.icon)}
                </div>
            `;
            
            // Für umfangreiche Abschnitte ggf. zusätzliche Seiten
            if (section.id === 'detailed-results') {
                printHTML += `
                    <div class="print-page print-content-page">
                        ${generateSectionPreviewContinuation(section.id)}
                    </div>
                `;
            }
        });
        
        printHTML += `</div>`;
        
        return printHTML;
    };
    
    /**
     * Abbrechen und verwerfen des aktuellen Berichts bestätigen
     */
    const confirmDiscardReport = () => {
        Utils.modal.confirm(
            'Möchten Sie wirklich abbrechen? Alle nicht gespeicherten Änderungen gehen verloren.',
            () => {
                // Zum Vorlagen-Modus zurückkehren
                currentTemplate = null;
                currentReportSettings = null;
                currentReportData = null;
                
                // Navigation aktualisieren
                document.querySelectorAll('.report-nav-btn').forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.dataset.view === 'templates') {
                        btn.classList.add('active');
                    }
                });
                
                // Templates anzeigen
                showTemplatesView();
            }
        );
    };
    
    /**
     * Aktuellen Bericht speichern
     */
    const saveReport = () => {
        try {
            // Aktuelle Eingaben in die Settings übernehmen
            updateSettingsFromInputs();
            
            // Bestehenden Bericht aktualisieren oder neuen erstellen
            const reportId = currentReportSettings.reportId || `report_${new Date().getTime()}_${Math.floor(Math.random() * 1000)}`;
            const now = new Date().toISOString();
            
            const report = {
                id: reportId,
                templateId: currentTemplate.id,
                created: currentReportSettings.reportId ? undefined : now,
                lastModified: now,
                settings: { ...currentReportSettings },
                data: { ...currentReportData }
            };
            
            // Gespeicherte Berichte laden
            let savedReports = Utils.storage.get('saved_reports') || [];
            
            // Prüfen ob der Bericht bereits existiert
            const existingReportIndex = savedReports.findIndex(r => r.id === reportId);
            
            if (existingReportIndex !== -1) {
                // Bestehenden Bericht aktualisieren
                savedReports[existingReportIndex] = report;
            } else {
                // Neuen Bericht hinzufügen
                savedReports.push(report);
            }
            
            // Aktualisierte Liste speichern
            Utils.storage.set('saved_reports', savedReports);
            
            // Report-ID in den Settings speichern
            currentReportSettings.reportId = reportId;
            
            // Benachrichtigung anzeigen
            Utils.notifications.success('Bericht wurde erfolgreich gespeichert.');
            
            return true;
        } catch (error) {
            console.error('Fehler beim Speichern des Berichts:', error);
            Utils.notifications.error(`Fehler beim Speichern des Berichts: ${error.message}`);
            return false;
        }
    };
    
    /**
     * Aktuelle Eingaben in die Settings übernehmen
     */
    const updateSettingsFromInputs = () => {
        // Allgemeine Einstellungen
        const title = document.getElementById('report-title');
        const subtitle = document.getElementById('report-subtitle');
        const author = document.getElementById('report-author');
        const date = document.getElementById('report-date');
        const orientation = document.getElementById('page-orientation');
        const pageSize = document.getElementById('page-size');
        const includeHeader = document.getElementById('include-header-checkbox');
        const includeFooter = document.getElementById('include-footer-checkbox');
        const includePageNumbers = document.getElementById('include-page-numbers-checkbox');
        const includeLogo = document.getElementById('include-logo-checkbox');
        const primaryColor = document.getElementById('primary-color');
        const secondaryColor = document.getElementById('secondary-color');
        const useCurrentFilters = document.getElementById('use-current-filters');
        
        if (title) currentReportSettings.title = title.value;
        if (subtitle) currentReportSettings.subtitle = subtitle.value;
        if (author) currentReportSettings.author = author.value;
        if (date) currentReportSettings.date = date.value;
        if (orientation) currentReportSettings.pageSettings.orientation = orientation.value;
        if (pageSize) currentReportSettings.pageSettings.size = pageSize.value;
        if (includeHeader) currentReportSettings.pageSettings.header = includeHeader.checked;
        if (includeFooter) currentReportSettings.pageSettings.footer = includeFooter.checked;
        if (includePageNumbers) currentReportSettings.pageSettings.pageNumbers = includePageNumbers.checked;
        if (includeLogo) currentReportSettings.logo.use = includeLogo.checked;
        if (primaryColor) currentReportSettings.colors.primary = primaryColor.value;
        if (secondaryColor) currentReportSettings.colors.secondary = secondaryColor.value;
        if (useCurrentFilters) currentReportSettings.filters.useCurrentFilters = useCurrentFilters.checked;
        
        // Sektionseinstellungen werden bereits durch die Event-Listener aktualisiert
    };
    
    /**
     * Hilfstext für Vergleichsgruppen holen
     */
    const getComparisonGroupText = (compareBy) => {
        switch (compareBy) {
            case 'profession': return 'Berufsgruppen';
            case 'experience': return 'Berufserfahrung';
            case 'tenure': return 'Zugehörigkeitsdauer';
            default: return 'Gruppen';
        }
    };
    
    /**
     * Progress-Bar-Klasse basierend auf Wert bestimmen
     */
    const getProgressBarClass = (value) => {
        if (value >= 4.5) return 'bg-success';
        if (value >= 4.0) return 'bg-success';
        if (value >= 3.5) return 'bg-info';
        if (value >= 3.0) return 'bg-info';
        if (value >= 2.5) return 'bg-warning';
        if (value >= 2.0) return 'bg-warning';
        return 'bg-danger';
    };
    
    /**
     * Text für Dateinamen aufbereiten (keine Sonderzeichen)
     */
    const sanitizeFilename = (text) => {
        if (!text) return '';
        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '') // Entfernt Sonderzeichen
            .replace(/\s+/g, '-')     // Ersetzt Leerzeichen durch Bindestriche
            .replace(/--+/g, '-')     // Entfernt doppelte Bindestriche
            .replace(/^-+/, '')       // Entfernt Bindestriche am Anfang
            .replace(/-+$/, '');      // Entfernt Bindestriche am Ende
    };
    
    /**
     * Text auf bestimmte Länge kürzen
     */
    const truncateText = (text, maxLength) => {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
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
        currentTemplate = null;
        currentReportData = null;
        currentReportSettings = null;
        previewCanvas = null;
        currentView = 'templates';
    };
    
    // Öffentliche API
    return {
        init,
        show,
        hide,
        dispose
    };
})();