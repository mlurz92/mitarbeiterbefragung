/**
 * app.js
 * Zentrale Anwendungslogik und Routing für die Mitarbeiterbefragung
 * Klinik für Radiologie und Nuklearmedizin
 */

const App = (() => {
    // Konstanten
    const DEFAULT_MODULE = 'dashboard';
    const MODULE_CONTAINER_ID = 'module-container';
    
    // Status-Variablen
    let currentModule = null;
    let isInitialized = false;
    let moduleInstances = {};
    let routerInitialized = false;
    
    /**
     * Module und ihre Abhängigkeiten
     */
    const moduleDefinitions = {
        dashboard: {
            title: 'Dashboard',
            icon: 'chart-pie',
            dependencies: ['data-manager'],
            instance: null
        },
        'data-entry': {
            title: 'Datenerfassung',
            icon: 'edit',
            dependencies: ['data-manager'],
            instance: null
        },
        'data-import-export': {
            title: 'Import / Export',
            icon: 'file-import',
            dependencies: ['data-manager'],
            instance: null
        },
        analysis: {
            title: 'Datenanalyse',
            icon: 'chart-bar',
            dependencies: ['data-manager'],
            instance: null
        },
        reporting: {
            title: 'Berichte',
            icon: 'file-pdf',
            dependencies: ['data-manager'],
            instance: null
        },
        recommendations: {
            title: 'Handlungsempfehlungen',
            icon: 'lightbulb',
            dependencies: ['data-manager'],
            instance: null
        },
        administration: {
            title: 'Verwaltung',
            icon: 'cogs',
            dependencies: ['data-manager'],
            instance: null
        }
    };
    
    /**
     * Modul initialisieren und anzeigen
     */
    const initModule = async (moduleId) => {
        try {
            // Container abrufen
            const container = document.getElementById(MODULE_CONTAINER_ID);
            if (!container) {
                throw new Error('Container für Module nicht gefunden');
            }
            
            // Prüfen ob Modul existiert
            if (!moduleDefinitions[moduleId]) {
                throw new Error(`Modul "${moduleId}" nicht gefunden`);
            }
            
            // Loader anzeigen während Modul geladen wird
            Utils.dom.showLoader(container, `Modul "${moduleDefinitions[moduleId].title}" wird geladen...`);
            
            // Wenn Modul bereits initialisiert, einfach anzeigen
            if (moduleInstances[moduleId]) {
                if (typeof moduleInstances[moduleId].show === 'function') {
                    // Schrittweise UI aktualisieren um Jank zu vermeiden
                    setTimeout(() => {
                        Utils.dom.hideLoader(container);
                        moduleInstances[moduleId].show();
                        
                        // Aktiven Navigations-Link aktualisieren
                        updateActiveNavLink(moduleId);
                        
                        // Titel aktualisieren
                        document.title = `${moduleDefinitions[moduleId].title} | Mitarbeiterbefragung 2025`;
                        
                        // Modul-Status aktualisieren
                        currentModule = moduleId;
                    }, 100);
                    
                    return moduleInstances[moduleId];
                }
            }
            
            // Modul dynamisch laden und initialisieren
            const moduleInstance = await loadModule(moduleId);
            
            if (!moduleInstance) {
                throw new Error(`Modul "${moduleId}" konnte nicht geladen werden`);
            }
            
            // Modul initialisieren
            if (typeof moduleInstance.init === 'function') {
                await moduleInstance.init(container);
            }
            
            // Modul anzeigen
            if (typeof moduleInstance.show === 'function') {
                moduleInstance.show();
            }
            
            // Modul speichern
            moduleInstances[moduleId] = moduleInstance;
            
            // Aktiven Navigations-Link aktualisieren
            updateActiveNavLink(moduleId);
            
            // Titel aktualisieren
            document.title = `${moduleDefinitions[moduleId].title} | Mitarbeiterbefragung 2025`;
            
            // Loader entfernen
            Utils.dom.hideLoader(container);
            
            // Modul-Status aktualisieren
            currentModule = moduleId;
            
            return moduleInstance;
            
        } catch (error) {
            console.error(`Fehler beim Initialisieren des Moduls "${moduleId}":`, error);
            
            // Container abrufen
            const container = document.getElementById(MODULE_CONTAINER_ID);
            
            // Loader entfernen
            if (container) {
                Utils.dom.hideLoader(container);
                
                // Fehlermeldung anzeigen
                container.innerHTML = `
                    <div class="alert alert-danger">
                        <h4>Fehler beim Laden des Moduls</h4>
                        <p>Das Modul "${moduleDefinitions[moduleId]?.title || moduleId}" konnte nicht geladen werden.</p>
                        <p>Fehlermeldung: ${error.message}</p>
                        <button class="btn btn-primary mt-3" id="retry-module-button">
                            <i class="fas fa-sync-alt"></i> Erneut versuchen
                        </button>
                    </div>
                `;
                
                // Event-Listener für Retry-Button
                const retryButton = document.getElementById('retry-module-button');
                if (retryButton) {
                    retryButton.addEventListener('click', () => {
                        container.innerHTML = '';
                        initModule(moduleId);
                    });
                }
            }
            
            // Benachrichtigung anzeigen
            Utils.notifications.error(`Fehler: Modul "${moduleDefinitions[moduleId]?.title || moduleId}" konnte nicht geladen werden.`);
            
            return null;
        }
    };
    
    /**
     * Modul-Instanz laden oder abrufen
     */
    const loadModule = async (moduleId) => {
        try {
            // Prüfe ob globale Klasse bereits existiert
            const globalModuleName = moduleIdToClassName(moduleId);
            if (window[globalModuleName]) {
                return window[globalModuleName];
            }
            
            // Hier würden wir normalerweise Code für das dynamische Laden von Modulen haben
            // Da wir aber alle Module im HTML bereits eingebunden haben,
            // müssen wir nur prüfen ob sie verfügbar sind
            
            if (!window[globalModuleName]) {
                throw new Error(`Modul-Klasse "${globalModuleName}" nicht gefunden`);
            }
            
            return window[globalModuleName];
        } catch (error) {
            console.error(`Fehler beim Laden des Moduls "${moduleId}":`, error);
            throw error;
        }
    };
    
    /**
     * Modul-ID in Klassennamen umwandeln (z.B. data-entry -> DataEntryModule)
     */
    const moduleIdToClassName = (moduleId) => {
        return moduleId
            .split('-')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join('') + 'Module';
    };
    
    /**
     * Aktiven Navigations-Link aktualisieren
     */
    const updateActiveNavLink = (moduleId) => {
        // Alle Links finden und aktive Klasse entfernen
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
        });
        
        // Aktiven Link finden und Klasse hinzufügen
        const activeLink = document.querySelector(`.nav-link[data-module="${moduleId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    };
    
    /**
     * Router initialisieren
     */
    const initRouter = () => {
        if (routerInitialized) return;
        
        // Navigation Links mit Event-Listenern versehen
        const navLinks = document.querySelectorAll('.nav-link[data-module]');
        navLinks.forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                const moduleId = link.getAttribute('data-module');
                navigateTo(moduleId);
            });
        });
        
        // Initialen Modulnamen aus URL-Hash lesen oder Default verwenden
        const hash = window.location.hash.substring(1); // # entfernen
        const initialModule = hash && moduleDefinitions[hash] ? hash : DEFAULT_MODULE;
        
        // Auf Änderungen des Hash-Teils der URL reagieren
        window.addEventListener('hashchange', () => {
            const newHash = window.location.hash.substring(1);
            if (newHash && moduleDefinitions[newHash]) {
                navigateTo(newHash, false); // false = Hash nicht erneut setzen
            }
        });
        
        // Initial-Modul laden
        navigateTo(initialModule);
        
        routerInitialized = true;
    };
    
    /**
     * Zu einem Modul navigieren
     */
    const navigateTo = async (moduleId, updateHash = true) => {
        try {
            // Hash aktualisieren, falls gewünscht
            if (updateHash) {
                window.location.hash = moduleId;
                return; // Die hashchange-Event wird den Rest erledigen
            }
            
            // Wenn zum gleichen Modul navigiert wird, nichts tun
            if (currentModule === moduleId) {
                return;
            }
            
            // Container leeren und Loader anzeigen
            const container = document.getElementById(MODULE_CONTAINER_ID);
            Utils.dom.removeAllChildren(container);
            
            // Sidebar auf mobilen Geräten schließen
            const sidebar = document.getElementById('app-sidebar');
            if (sidebar) {
                sidebar.classList.remove('active');
            }
            
            // Vor dem Modulwechsel das aktuelle Modul ausblenden
            if (currentModule && moduleInstances[currentModule]) {
                if (typeof moduleInstances[currentModule].hide === 'function') {
                    await moduleInstances[currentModule].hide();
                }
            }
            
            // Neues Modul initialisieren
            await initModule(moduleId);
            
            // Event auslösen
            eventBus.emit('moduleChanged', {
                previous: currentModule,
                current: moduleId
            });
            
        } catch (error) {
            console.error('Navigationsfehler:', error);
            Utils.notifications.error('Navigation fehlgeschlagen: ' + error.message);
        }
    };
    
    /**
     * Zentraler Event-Bus für modulübergreifende Kommunikation
     */
    const eventBus = {
        events: {},
        
        /**
         * Event registrieren
         */
        on: (eventName, callback) => {
            if (!eventBus.events[eventName]) {
                eventBus.events[eventName] = [];
            }
            eventBus.events[eventName].push(callback);
            
            // Handler zum Entfernen zurückgeben
            return () => {
                eventBus.off(eventName, callback);
            };
        },
        
        /**
         * Event abmelden
         */
        off: (eventName, callback) => {
            if (!eventBus.events[eventName]) return;
            
            if (callback) {
                eventBus.events[eventName] = eventBus.events[eventName].filter(cb => cb !== callback);
            } else {
                delete eventBus.events[eventName];
            }
        },
        
        /**
         * Event auslösen
         */
        emit: (eventName, data) => {
            if (!eventBus.events[eventName]) return;
            
            eventBus.events[eventName].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event handler for "${eventName}":`, error);
                }
            });
        },
        
        /**
         * Einmaliges Event registrieren
         */
        once: (eventName, callback) => {
            const onceHandler = (data) => {
                callback(data);
                eventBus.off(eventName, onceHandler);
            };
            
            eventBus.on(eventName, onceHandler);
        }
    };
    
    /**
     * Toast-Benachrichtigung anzeigen
     */
    const showToast = (message, type = 'info', options = {}) => {
        const duration = options.duration || 5000;
        Utils.notifications.show(message, type, duration);
    };
    
    /**
     * Anwendung initialisieren
     */
    const init = async () => {
        if (isInitialized) return;
        
        try {
            console.log('Initialisiere Anwendung...');
            
            // Erforderliche Abhängigkeiten prüfen
            if (!window.Utils || !window.SurveySchema || !window.DataManager) {
                throw new Error('Erforderliche Abhängigkeiten nicht geladen');
            }
            
            // DataManager initialisieren
            const dataLoadSuccess = DataManager.loadFromLocalStorage();
            if (dataLoadSuccess) {
                console.log('Daten aus LocalStorage geladen');
                
                // Anzahl der geladenen Datensätze
                const surveyCount = DataManager.getAllSurveys().length;
                if (surveyCount > 0) {
                    Utils.notifications.success(`${surveyCount} Fragebögen geladen.`);
                }
            } else {
                console.log('Keine gespeicherten Daten gefunden, starte mit leerer Datenbank');
            }
            
            // Benutzerinterface für Fehlerbehandlung einrichten
            window.addEventListener('error', function(event) {
                console.error('Global error:', event.error);
                Utils.notifications.error(`Ein Fehler ist aufgetreten: ${event.error?.message || 'Unbekannter Fehler'}`);
            });
            
            // Unbehandelte Promise-Rejections
            window.addEventListener('unhandledrejection', function(event) {
                console.error('Unhandled promise rejection:', event.reason);
                Utils.notifications.error(`Ein asynchroner Fehler ist aufgetreten: ${event.reason?.message || 'Unbekannter Fehler'}`);
            });
            
            // Router initialisieren
            initRouter();
            
            // IsInitialized setzen
            isInitialized = true;
            
            // Event auslösen
            eventBus.emit('appInitialized', { timestamp: new Date() });
            
        } catch (error) {
            console.error('Fehler bei der Initialisierung der Anwendung:', error);
            
            // Container für Fehlermeldung abrufen
            const container = document.getElementById(MODULE_CONTAINER_ID);
            if (container) {
                Utils.dom.hideLoader(container);
                
                // Kritische Fehlermeldung anzeigen
                container.innerHTML = `
                    <div class="alert alert-danger">
                        <h4>Kritischer Fehler</h4>
                        <p>Die Anwendung konnte nicht initialisiert werden.</p>
                        <p>Fehlermeldung: ${error.message}</p>
                        <button class="btn btn-primary mt-3" onclick="location.reload()">
                            <i class="fas fa-sync-alt"></i> Anwendung neu laden
                        </button>
                    </div>
                `;
            }
            
            // Benachrichtigung anzeigen
            Utils.notifications.error('Kritischer Fehler: Die Anwendung konnte nicht initialisiert werden.');
        }
    };
    
    /**
     * Beispieldaten laden (nur für Entwicklung/Test)
     */
    const loadSampleData = () => {
        try {
            // Prüfen ob bereits Daten vorhanden sind
            const existingData = DataManager.getAllSurveys();
            if (existingData.length > 0) {
                console.log('Es sind bereits Daten vorhanden, keine Beispieldaten geladen');
                return;
            }
            
            // Beispieldaten erstellen
            const sampleData = [];
            
            // 10 zufällige Fragebögen erzeugen
            for (let i = 0; i < 10; i++) {
                const survey = SurveySchema.emptyTemplate();
                
                // Zufällige Antworten für Likert-Fragen
                for (const section of SurveySchema.sections) {
                    for (const question of section.questions) {
                        if (question.type === 'likert') {
                            // 1-5 für Likert-Skala
                            survey[question.id] = Math.floor(Math.random() * 5) + 1;
                        }
                    }
                }
                
                // Demografische Daten
                const professions = ['arzt', 'mtr', 'anmeldung'];
                const experiences = ['lt2', '2to5', '6to10', 'gt10'];
                const tenures = ['lt1', '1to3', '4to10', 'gt10'];
                
                survey.profession = professions[Math.floor(Math.random() * professions.length)];
                survey.experience = experiences[Math.floor(Math.random() * experiences.length)];
                survey.tenure = tenures[Math.floor(Math.random() * tenures.length)];
                
                // Textantworten
                survey.q35 = 'Beispiel für Stärke 1; Beispiel für Stärke 2';
                survey.q36 = 'Beispiel für Verbesserung 1; Beispiel für Verbesserung 2';
                
                // Zum Array hinzufügen
                sampleData.push(survey);
            }
            
            // Daten importieren
            const result = DataManager.importSurveys(sampleData);
            
            if (result.success) {
                console.log(`${result.imported} Beispieldatensätze geladen`);
                Utils.notifications.success(`${result.imported} Beispieldatensätze wurden geladen.`);
            } else {
                console.error('Fehler beim Laden der Beispieldaten:', result.errors);
            }
            
        } catch (error) {
            console.error('Fehler beim Laden der Beispieldaten:', error);
        }
    };
    
    /**
     * Projekt-URL kopieren
     * Ermöglicht das Teilen des aktuellen Projektstandes via URL
     */
    const shareProjectUrl = async () => {
        try {
            // Aktuellen Projektstand exportieren
            const projectData = DataManager.exportProject({ download: false }).projectData;
            
            if (!projectData) {
                throw new Error('Keine Projektdaten vorhanden');
            }
            
            // Daten komprimieren und als Base64 kodieren
            const jsonString = JSON.stringify(projectData);
            const compressedData = await compressData(jsonString);
            const base64Data = btoa(compressedData);
            
            // URL erstellen
            const baseUrl = window.location.href.split('#')[0];
            const shareUrl = `${baseUrl}#share=${base64Data}`;
            
            // URL in die Zwischenablage kopieren
            await navigator.clipboard.writeText(shareUrl);
            
            Utils.notifications.success('Projekt-URL wurde in die Zwischenablage kopiert.');
            
            return shareUrl;
            
        } catch (error) {
            console.error('Fehler beim Erstellen der Projekt-URL:', error);
            Utils.notifications.error('Projekt-URL konnte nicht erstellt werden: ' + error.message);
            return null;
        }
    };
    
    /**
     * Daten komprimieren (vereinfachte Implementierung)
     */
    const compressData = async (data) => {
        // In einer realen Implementierung würde hier eine echte Kompression stattfinden
        // Für diese Version geben wir einfach die Daten zurück
        return data;
    };
    
    /**
     * Daten dekomprimieren (vereinfachte Implementierung)
     */
    const decompressData = async (data) => {
        // In einer realen Implementierung würde hier eine echte Dekompression stattfinden
        // Für diese Version geben wir einfach die Daten zurück
        return data;
    };
    
    /**
     * Geteiltes Projekt aus URL laden
     */
    const loadSharedProject = async () => {
        try {
            const hash = window.location.hash;
            const shareMatch = hash.match(/#share=(.+)/);
            
            if (!shareMatch || !shareMatch[1]) {
                return false;
            }
            
            // Base64-Daten dekodieren
            const base64Data = shareMatch[1];
            const compressedData = atob(base64Data);
            const jsonString = await decompressData(compressedData);
            
            // Daten parsen
            const projectData = JSON.parse(jsonString);
            
            // Daten validieren
            if (!projectData || !projectData.surveys || !Array.isArray(projectData.surveys)) {
                throw new Error('Ungültiges Projektformat');
            }
            
            // Bestätigung anfordern
            const confirmed = await new Promise(resolve => {
                Utils.modal.confirm(
                    `Möchten Sie das geteilte Projekt laden? Es enthält ${projectData.surveys.length} Fragebögen.`,
                    () => resolve(true),
                    () => resolve(false),
                    {
                        title: 'Geteiltes Projekt laden',
                        confirmText: 'Ja, laden',
                        cancelText: 'Abbrechen'
                    }
                );
            });
            
            if (!confirmed) {
                // Hash aus URL entfernen
                window.history.replaceState(null, '', window.location.pathname);
                return false;
            }
            
            // Aktuellen Projektstand sichern
            const currentState = DataManager.getState();
            
            // Neues Projekt importieren
            const importResult = DataManager.importProject(projectData);
            
            if (!importResult.success) {
                throw new Error('Fehler beim Importieren des Projekts');
            }
            
            // Hash aus URL entfernen
            window.history.replaceState(null, '', window.location.pathname);
            
            // Erfolg melden
            Utils.notifications.success(`Geteiltes Projekt mit ${projectData.surveys.length} Fragebögen erfolgreich geladen.`);
            
            // UI aktualisieren
            navigateTo(DEFAULT_MODULE, true);
            
            return true;
            
        } catch (error) {
            console.error('Fehler beim Laden des geteilten Projekts:', error);
            Utils.notifications.error('Das geteilte Projekt konnte nicht geladen werden: ' + error.message);
            
            // Hash aus URL entfernen
            window.history.replaceState(null, '', window.location.pathname);
            
            return false;
        }
    };
    
    // Öffentliche API
    return {
        // Basisfunktionen
        init,
        navigateTo,
        eventBus,
        showToast,
        
        // Hilfsfunktionen
        loadSampleData,
        shareProjectUrl,
        loadSharedProject,
        
        // Zugriff auf Module
        getModule: (moduleId) => moduleInstances[moduleId] || null,
        getAllModules: () => ({ ...moduleInstances }),
        
        // Zustandsinformationen
        getCurrentModule: () => currentModule,
        isInitialized: () => isInitialized,
        
        // Konstanten
        DEFAULT_MODULE,
        MODULE_CONTAINER_ID
    };
})();

// Automatische Initialisierung wenn keine explizite Initialisierung erwünscht ist
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    // Wenn DOM bereits geladen, direkt initialisieren
    setTimeout(function() {
        App.init();
        
        // Prüfen auf geteilte Projekte in der URL
        App.loadSharedProject();
    }, 1);
} else {
    // Ansonsten auf DOM warten
    document.addEventListener('DOMContentLoaded', function() {
        App.init();
        
        // Prüfen auf geteilte Projekte in der URL
        App.loadSharedProject();
    });
}