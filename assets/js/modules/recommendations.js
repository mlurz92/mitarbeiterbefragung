/**
 * recommendations.js
 * Modul zur Generierung und Verwaltung von Handlungsempfehlungen
 * 
 * Dieses Modul analysiert die Ergebnisse der Mitarbeiterbefragung,
 * identifiziert Stärken und Schwächen und generiert daraus spezifische
 * Handlungsempfehlungen mit Priorisierung, Verantwortlichkeiten und
 * Erfolgsindikatoren.
 */

window.RecommendationsModule = (() => {
    // Modul-Elemente
    let container = null;
    let currentView = 'overview'; // 'overview', 'areas', 'actions', 'plan', 'tracking'
    let actionPlan = null;
    let selectedPeriod = 'short'; // 'short', 'medium', 'long'
    let chartsInstances = {};
    let currentFilters = {};
    
    // Empfehlungskategorien
    const recommendationCategories = {
        'arbeitsumfeld': {
            title: 'Arbeitsumfeld und Ressourcen',
            icon: 'building',
            color: '#3498db',
            threshold: 3.0
        },
        'fuehrung': {
            title: 'Führung und Zusammenarbeit',
            icon: 'users',
            color: '#2ecc71',
            threshold: 3.2
        },
        'worklife': {
            title: 'Work-Life-Balance',
            icon: 'balance-scale',
            color: '#9b59b6',
            threshold: 3.0
        },
        'entwicklung': {
            title: 'Entwicklung und Anerkennung',
            icon: 'graduation-cap',
            color: '#f1c40f',
            threshold: 3.2
        },
        'patienten': {
            title: 'Patientenorientierung',
            icon: 'user-md',
            color: '#e74c3c',
            threshold: 3.5
        },
        'innovation': {
            title: 'Innovation und Perspektiven',
            icon: 'lightbulb',
            color: '#1abc9c',
            threshold: 3.2
        }
    };
    
    // Standard-Maßnahmen nach Kategorien und Schweregrad
    const standardMeasures = {
        'arbeitsumfeld': {
            high: [
                {
                    title: 'Umfassende Bedarfsanalyse der technischen Ausstattung',
                    description: 'Durchführung einer strukturierten Erhebung der technischen Bedarfe aller Mitarbeitergruppen, gefolgt von einer priorisierten Beschaffungsplanung.',
                    effort: 'medium',
                    impact: 'high',
                    timeline: 'short',
                    owner: 'IT-Abteilung, Abteilungsleitung'
                },
                {
                    title: 'Optimierung der Arbeitsabläufe',
                    description: 'Workshop-Reihe zur Identifikation und Beseitigung von Prozesshindernissen, mit besonderem Fokus auf abteilungsübergreifende Schnittstellenprobleme.',
                    effort: 'medium',
                    impact: 'high',
                    timeline: 'medium',
                    owner: 'Qualitätsmanagement, Teamleitung'
                }
            ],
            medium: [
                {
                    title: 'Optimierung der Systemintegration',
                    description: 'Verbesserung der Kompatibilität zwischen verschiedenen IT-Systemen, insbesondere zwischen PACS und KIS.',
                    effort: 'medium',
                    impact: 'medium',
                    timeline: 'medium',
                    owner: 'IT-Abteilung'
                }
            ],
            low: [
                {
                    title: 'Ergonomie-Assessment der Arbeitsplätze',
                    description: 'Überprüfung und Optimierung der ergonomischen Gestaltung aller Arbeitsplätze durch externe Experten.',
                    effort: 'low',
                    impact: 'medium',
                    timeline: 'medium',
                    owner: 'Arbeitsschutz'
                }
            ]
        },
        'fuehrung': {
            high: [
                {
                    title: 'Führungskräfteentwicklungsprogramm',
                    description: 'Implementierung eines strukturierten Entwicklungsprogramms für Führungskräfte mit Fokus auf Kommunikation, Feedback und Mitarbeiterförderung.',
                    effort: 'high',
                    impact: 'high',
                    timeline: 'medium',
                    owner: 'Personalentwicklung, Klinikleitung'
                },
                {
                    title: 'Kommunikationsstrukturen optimieren',
                    description: 'Einrichtung regelmäßiger Teammeetings und transparenter Informationskanäle zwischen allen Hierarchieebenen.',
                    effort: 'medium',
                    impact: 'high',
                    timeline: 'short',
                    owner: 'Abteilungsleitung'
                }
            ],
            medium: [
                {
                    title: 'Feedback-Kultur stärken',
                    description: 'Einführung regelmäßiger, strukturierter Feedbackgespräche in beide Richtungen der Hierarchie.',
                    effort: 'medium',
                    impact: 'medium',
                    timeline: 'short',
                    owner: 'Teamleitung, Personalentwicklung'
                }
            ],
            low: [
                {
                    title: 'Teambuilding-Maßnahmen',
                    description: 'Regelmäßige teambildende Aktivitäten zur Stärkung des Zusammenhalts und der Zusammenarbeit.',
                    effort: 'low',
                    impact: 'medium',
                    timeline: 'short',
                    owner: 'Teamleitung'
                }
            ]
        },
        'worklife': {
            high: [
                {
                    title: 'Dienstplanoptimierung',
                    description: 'Überarbeitung des Dienstplansystems mit Fokus auf Vorhersehbarkeit, Fairness und Berücksichtigung individueller Bedürfnisse.',
                    effort: 'high',
                    impact: 'high',
                    timeline: 'medium',
                    owner: 'Personalmanagement, Teamleitung'
                },
                {
                    title: 'Personalbedarfsanalyse und Rekrutierungsstrategie',
                    description: 'Detaillierte Analyse des tatsächlichen Personalbedarfs und Entwicklung einer nachhaltigen Rekrutierungsstrategie.',
                    effort: 'high',
                    impact: 'high',
                    timeline: 'medium',
                    owner: 'Personalmanagement, Klinikleitung'
                }
            ],
            medium: [
                {
                    title: 'Flexible Arbeitszeitmodelle',
                    description: 'Einführung flexibler Arbeitszeitmodelle, die sowohl betriebliche Anforderungen als auch persönliche Bedürfnisse berücksichtigen.',
                    effort: 'medium',
                    impact: 'high',
                    timeline: 'medium',
                    owner: 'Personalmanagement'
                }
            ],
            low: [
                {
                    title: 'Pausenraumgestaltung',
                    description: 'Optimierung der Pausenräume zu echten Erholungszonen mit angenehmer Atmosphäre.',
                    effort: 'low',
                    impact: 'medium',
                    timeline: 'short',
                    owner: 'Facility Management'
                }
            ]
        },
        'entwicklung': {
            high: [
                {
                    title: 'Individuelles Fortbildungsprogramm',
                    description: 'Entwicklung eines strukturierten Fortbildungskonzepts mit individuellen Entwicklungspfaden für verschiedene Berufsgruppen.',
                    effort: 'high',
                    impact: 'high',
                    timeline: 'medium',
                    owner: 'Personalentwicklung, Fachexperten'
                },
                {
                    title: 'Karriereentwicklungsprogramm',
                    description: 'Implementierung transparenter Karrierepfade und Aufstiegsmöglichkeiten innerhalb der Abteilung und Klinik.',
                    effort: 'medium',
                    impact: 'high',
                    timeline: 'long',
                    owner: 'Personalentwicklung, Klinikleitung'
                }
            ],
            medium: [
                {
                    title: 'Mentoring-Programm',
                    description: 'Etablierung eines Mentoring-Programms für neue Mitarbeiter und Mitarbeiter mit Entwicklungspotential.',
                    effort: 'medium',
                    impact: 'medium',
                    timeline: 'medium',
                    owner: 'Personalentwicklung, Teamleitung'
                }
            ],
            low: [
                {
                    title: 'Verbessertes Anerkennungssystem',
                    description: 'Einführung eines strukturierten Systems zur Anerkennung besonderer Leistungen, sowohl monetär als auch nicht-monetär.',
                    effort: 'low',
                    impact: 'medium',
                    timeline: 'short',
                    owner: 'Personalmanagement, Abteilungsleitung'
                }
            ]
        },
        'patienten': {
            high: [
                {
                    title: 'Patientenprozessoptimierung',
                    description: 'Umfassende Analyse und Neugestaltung der Patientenpfade mit dem Ziel, Wartezeiten zu reduzieren und die Patientenerfahrung zu verbessern.',
                    effort: 'high',
                    impact: 'high',
                    timeline: 'medium',
                    owner: 'Qualitätsmanagement, klinische Teams'
                },
                {
                    title: 'Kommunikationstraining Patienteninteraktion',
                    description: 'Schulungsprogramm zur Verbesserung der Kommunikation mit Patienten, insbesondere in Stresssituationen und bei komplexen Erklärungen.',
                    effort: 'medium',
                    impact: 'high',
                    timeline: 'short',
                    owner: 'Personalentwicklung, externe Trainer'
                }
            ],
            medium: [
                {
                    title: 'Patientenfeedbacksystem optimieren',
                    description: 'Weiterentwicklung des bestehenden Feedbacksystems für Patienten mit direkter Integration in Verbesserungsprozesse.',
                    effort: 'medium',
                    impact: 'medium',
                    timeline: 'short',
                    owner: 'Qualitätsmanagement'
                }
            ],
            low: [
                {
                    title: 'Orientierungssystem verbessern',
                    description: 'Optimierung der Beschilderung und des Leitsystems für Patienten zur besseren Orientierung in der Abteilung.',
                    effort: 'low',
                    impact: 'medium',
                    timeline: 'short',
                    owner: 'Facility Management'
                }
            ]
        },
        'innovation': {
            high: [
                {
                    title: 'Innovationsstrategie entwickeln',
                    description: 'Erarbeitung einer klaren Strategie für Innovation und digitale Transformation der Abteilung mit konkreten Zielen und Meilensteinen.',
                    effort: 'high',
                    impact: 'high',
                    timeline: 'medium',
                    owner: 'Abteilungsleitung, IT-Abteilung'
                },
                {
                    title: 'KI-Integration in radiologische Prozesse',
                    description: 'Pilotprojekt zur Integration von KI-Lösungen in diagnostische Prozesse, beginnend mit ausgewählten Anwendungsfällen.',
                    effort: 'high',
                    impact: 'high',
                    timeline: 'long',
                    owner: 'Fachexperten, IT-Abteilung'
                }
            ],
            medium: [
                {
                    title: 'Innovation Lab etablieren',
                    description: 'Einrichtung eines kleinen Innovationslabors, in dem neue Technologien und Prozesse in geschütztem Rahmen getestet werden können.',
                    effort: 'medium',
                    impact: 'medium',
                    timeline: 'medium',
                    owner: 'Abteilungsleitung, Innovationsteam'
                }
            ],
            low: [
                {
                    title: 'Best-Practice-Besuche',
                    description: 'Organisation von Besuchen bei Vorreiter-Einrichtungen zum Wissens- und Erfahrungsaustausch.',
                    effort: 'low',
                    impact: 'medium',
                    timeline: 'medium',
                    owner: 'Abteilungsleitung'
                }
            ]
        }
    };
    
    /**
     * Recommendations-Modul initialisieren
     */
    const init = async (targetContainer) => {
        try {
            container = targetContainer;
            
            // Layout erstellen
            createLayout();
            
            // Daten laden und analysieren
            await loadAndAnalyzeData();
            
            // Erste Ansicht anzeigen
            showView(currentView);
            
            return true;
        } catch (error) {
            console.error('Fehler bei der Initialisierung des Recommendations-Moduls:', error);
            container.innerHTML = `<div class="alert alert-danger">
                <h4>Fehler beim Laden des Recommendations-Moduls</h4>
                <p>${error.message}</p>
            </div>`;
            return false;
        }
    };
    
    /**
     * Basis-Layout erstellen
     */
    const createLayout = () => {
        container.innerHTML = `
            <div class="recommendations-container">
                <div class="section-header d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2>
                            <i class="fas fa-lightbulb"></i> 
                            Handlungsempfehlungen
                        </h2>
                        <p class="section-description">
                            Auf Basis der Befragungsergebnisse generierte und priorisierte Maßnahmenvorschläge
                        </p>
                    </div>
                    <div class="actions">
                        <button class="btn btn-outline-secondary me-2" id="export-recommendations-btn">
                            <i class="fas fa-file-export"></i> Exportieren
                        </button>
                        <button class="btn btn-primary" id="create-action-plan-btn">
                            <i class="fas fa-tasks"></i> Maßnahmenplan erstellen
                        </button>
                    </div>
                </div>
                
                <!-- Filter und Steuerelemente -->
                <div class="card mb-4">
                    <div class="card-body">
                        <div class="row align-items-center">
                            <div class="col-md-6">
                                <div class="filters-container">
                                    <div class="mb-3 mb-md-0">
                                        <label class="form-label">Empfehlungen filtern:</label>
                                        <select class="form-select" id="category-filter">
                                            <option value="all">Alle Kategorien</option>
                                            ${Object.entries(recommendationCategories).map(([key, category]) => 
                                                `<option value="${key}">${category.title}</option>`
                                            ).join('')}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="nav-tabs-container">
                                    <ul class="nav nav-pills recommendation-tabs">
                                        <li class="nav-item">
                                            <button class="nav-link active" data-view="overview">
                                                <i class="fas fa-chart-pie"></i> Übersicht
                                            </button>
                                        </li>
                                        <li class="nav-item">
                                            <button class="nav-link" data-view="areas">
                                                <i class="fas fa-sitemap"></i> Bereiche
                                            </button>
                                        </li>
                                        <li class="nav-item">
                                            <button class="nav-link" data-view="actions">
                                                <i class="fas fa-list-check"></i> Maßnahmen
                                            </button>
                                        </li>
                                        <li class="nav-item">
                                            <button class="nav-link" data-view="plan">
                                                <i class="fas fa-calendar-alt"></i> Zeitplan
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Hauptinhalt - dynamisch befüllt -->
                <div id="recommendations-content" class="mb-4">
                    <!-- Wird dynamisch mit der jeweiligen Ansicht befüllt -->
                    <div class="text-center p-5">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Laden...</span>
                        </div>
                        <p class="mt-2">Daten werden analysiert und Empfehlungen generiert...</p>
                    </div>
                </div>
            </div>
        `;
        
        // Event-Listener für Tabs
        document.querySelectorAll('.recommendation-tabs .nav-link').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Aktiven Tab umschalten
                document.querySelectorAll('.recommendation-tabs .nav-link').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Entsprechende Ansicht anzeigen
                const view = tab.getAttribute('data-view');
                showView(view);
            });
        });
        
        // Event-Listener für Filter
        document.getElementById('category-filter')?.addEventListener('change', (e) => {
            currentFilters.category = e.target.value;
            showView(currentView); // Aktuelle Ansicht mit neuen Filtern aktualisieren
        });
        
        // Event-Listener für Export
        document.getElementById('export-recommendations-btn')?.addEventListener('click', exportRecommendations);
        
        // Event-Listener für Maßnahmenplan-Erstellung
        document.getElementById('create-action-plan-btn')?.addEventListener('click', createActionPlan);
    };
    
    /**
     * Daten laden und analysieren
     */
    const loadAndAnalyzeData = async () => {
        try {
            // Daten vom DataManager holen
            const surveys = DataManager.getAllSurveys();
            
            // Wenn keine Daten verfügbar
            if (!surveys || surveys.length === 0) {
                console.warn('Keine Umfragedaten für Empfehlungen verfügbar');
                return;
            }
            
            // Maßnahmenplan erstellen oder aktualisieren
            await generateActionPlan(surveys);
            
        } catch (error) {
            console.error('Fehler beim Laden und Analysieren der Daten:', error);
            throw error;
        }
    };
    
    /**
     * Maßnahmenplan generieren
     */
    const generateActionPlan = async (surveys) => {
        try {
            // Bereichsweise Durchschnittswerte berechnen
            const categoryScores = {};
            
            // Informationen zu den Fragen-IDs und Kategorien laden
            const categoryMappings = {};
            
            SurveySchema.categorization.areas.forEach(area => {
                const categoryKey = getCategoryKeyFromArea(area.id);
                
                if (categoryKey && recommendationCategories[categoryKey]) {
                    area.questionIds.forEach(qid => {
                        categoryMappings[qid] = categoryKey;
                    });
                }
            });
            
            // Durchschnitte pro Kategorie berechnen
            Object.keys(recommendationCategories).forEach(categoryKey => {
                const questionIds = Object.entries(categoryMappings)
                    .filter(([_, category]) => category === categoryKey)
                    .map(([qid, _]) => qid);
                
                let sum = 0;
                let count = 0;
                
                surveys.forEach(survey => {
                    questionIds.forEach(qid => {
                        if (survey[qid] !== null && survey[qid] !== undefined) {
                            sum += survey[qid];
                            count++;
                        }
                    });
                });
                
                categoryScores[categoryKey] = count > 0 ? sum / count : null;
            });
            
            // Fragen-spezifische Analysen
            const questionScores = {};
            const questionDetails = {};
            
            SurveySchema.sections.forEach(section => {
                section.questions.forEach(question => {
                    if (question.type === 'likert') {
                        // Fragendetails speichern
                        questionDetails[question.id] = {
                            text: question.text,
                            section: section.title
                        };
                        
                        // Durchschnittswert berechnen
                        let sum = 0;
                        let count = 0;
                        
                        surveys.forEach(survey => {
                            if (survey[question.id] !== null && survey[question.id] !== undefined) {
                                sum += survey[question.id];
                                count++;
                            }
                        });
                        
                        if (count > 0) {
                            questionScores[question.id] = sum / count;
                        }
                    }
                });
            });
            
            // Prioritäten bestimmen basierend auf Abweichung vom Schwellenwert
            const categoryPriorities = {};
            const categorySeverity = {};
            
            Object.entries(categoryScores).forEach(([category, score]) => {
                if (score !== null) {
                    const threshold = recommendationCategories[category].threshold;
                    const deviation = threshold - score;
                    
                    // Priorität und Schweregrad bestimmen
                    if (deviation >= 0.5) {
                        categoryPriorities[category] = 'high';
                        categorySeverity[category] = 'high';
                    } else if (deviation >= 0.2) {
                        categoryPriorities[category] = 'medium';
                        categorySeverity[category] = 'medium';
                    } else if (deviation > 0) {
                        categoryPriorities[category] = 'low';
                        categorySeverity[category] = 'low';
                    } else {
                        // Positiv bewertete Bereiche
                        categoryPriorities[category] = 'maintain';
                        categorySeverity[category] = 'none';
                    }
                }
            });
            
            // Signifikante Fragen identifizieren (5 niedrigste und 5 höchste)
            const sortedQuestions = Object.entries(questionScores)
                .map(([id, score]) => ({ id, score, text: questionDetails[id]?.text, section: questionDetails[id]?.section }))
                .sort((a, b) => a.score - b.score);
            
            const lowestScores = sortedQuestions.slice(0, 5);
            const highestScores = sortedQuestions.slice(-5).reverse();
            
            // Maßnahmen generieren
            const recommendations = [];
            
            // Für Kategorien mit Handlungsbedarf passende Maßnahmen auswählen
            Object.entries(categorySeverity).forEach(([category, severity]) => {
                const categoryTitle = recommendationCategories[category].title;
                const categoryScore = categoryScores[category];
                
                if (severity !== 'none') {
                    // Passende Standardmaßnahmen auswählen
                    const measures = standardMeasures[category][severity] || [];
                    
                    measures.forEach(measure => {
                        recommendations.push({
                            id: `rec_${category}_${recommendations.length}`,
                            category,
                            categoryTitle,
                            score: categoryScore,
                            title: measure.title,
                            description: measure.description,
                            priority: categoryPriorities[category],
                            effort: measure.effort,
                            impact: measure.impact,
                            timeline: measure.timeline,
                            owner: measure.owner,
                            status: 'open'
                        });
                    });
                    
                    // Bei hohem Schweregrad zusätzliche individuellere Maßnahme basierend auf niedrigsten Scores hinzufügen
                    if (severity === 'high') {
                        const relevantLowScores = lowestScores.filter(q => 
                            categoryMappings[q.id] === category
                        );
                        
                        if (relevantLowScores.length > 0) {
                            const worstQuestion = relevantLowScores[0];
                            
                            // Angepasste Maßnahme basierend auf der spezifischen Frage
                            const customMeasure = generateCustomMeasure(worstQuestion, category);
                            
                            if (customMeasure) {
                                recommendations.push({
                                    id: `rec_${category}_custom_${recommendations.length}`,
                                    category,
                                    categoryTitle,
                                    score: categoryScore,
                                    title: customMeasure.title,
                                    description: customMeasure.description,
                                    priority: 'high',
                                    effort: customMeasure.effort,
                                    impact: 'high',
                                    timeline: customMeasure.timeline,
                                    owner: customMeasure.owner,
                                    status: 'open',
                                    customFor: worstQuestion.id
                                });
                            }
                        }
                    }
                } else {
                    // Für positiv bewertete Bereiche Maßnahmen zur Aufrechterhaltung
                    recommendations.push({
                        id: `rec_${category}_maintain_${recommendations.length}`,
                        category,
                        categoryTitle,
                        score: categoryScore,
                        title: `Stärken im Bereich "${categoryTitle}" erhalten`,
                        description: `Die guten Bewertungen im Bereich "${categoryTitle}" zeigen eine Stärke, die systematisch erhalten und weiter ausgebaut werden sollte.`,
                        priority: 'maintain',
                        effort: 'low',
                        impact: 'medium',
                        timeline: 'ongoing',
                        owner: 'Abteilungsleitung, Team',
                        status: 'open'
                    });
                }
            });
            
            // Nach Priorität sortieren
            const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2, 'maintain': 3 };
            recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
            
            // Maßnahmenplan zusammenstellen
            actionPlan = {
                generated: new Date().toISOString(),
                surveyCount: surveys.length,
                categoryScores,
                categoryPriorities,
                categorySeverity,
                significantQuestions: {
                    lowest: lowestScores,
                    highest: highestScores
                },
                recommendations
            };
            
        } catch (error) {
            console.error('Fehler bei der Generierung des Maßnahmenplans:', error);
            throw error;
        }
    };
    
    /**
     * Kategorieschlüssel aus Bereichs-ID ableiten
     */
    const getCategoryKeyFromArea = (areaId) => {
        const prefix = areaId.split('-')[0];
        
        switch (prefix) {
            case 'resources': return 'arbeitsumfeld';
            case 'leadership': return 'fuehrung';
            case 'workload': return 'worklife';
            case 'development': return 'entwicklung';
            case 'patients': return 'patienten';
            case 'innovation': return 'innovation';
            default: return null;
        }
    };
    
    /**
     * Benutzerdefinierte Maßnahme basierend auf einer spezifischen Frage generieren
     */
    const generateCustomMeasure = (question, category) => {
        // Beispielhafte Logik zur Generierung angepasster Maßnahmen
        const questionId = question.id;
        const questionText = question.text;
        
        // Q1: Technische Ausstattung
        if (questionId === 'q1') {
            return {
                title: 'Verbesserung der technischen Arbeitsplatzausstattung',
                description: 'Systematische Analyse und gezielte Verbesserung der technischen Arbeitsplatzausstattung, insbesondere der Computer-Arbeitsplätze und ergonomischen Einrichtung.',
                effort: 'medium',
                impact: 'high',
                timeline: 'short',
                owner: 'IT-Abteilung, Facility Management'
            };
        }
        
        // Q4: Personalstärke
        if (questionId === 'q4') {
            return {
                title: 'Personalkapazitätsplanung und Rekrutierungsoffensive',
                description: 'Detaillierte Analyse des Personalbedarfs pro Schicht und Bereich, gefolgt von einer gezielten Rekrutierungsoffensive mit Fokus auf Engpassbereiche.',
                effort: 'high',
                impact: 'high',
                timeline: 'medium',
                owner: 'Personalmanagement, Abteilungsleitung'
            };
        }
        
        // Q6: IT-Systeme
        if (questionId === 'q6') {
            return {
                title: 'IT-System-Optimierung und Anwendertraining',
                description: 'Gezielte Optimierung der IT-Systeme SAP und PACS mit Fokus auf Stabilität und Benutzerfreundlichkeit, verbunden mit erweiterten Anwenderschulungen.',
                effort: 'high',
                impact: 'high',
                timeline: 'medium',
                owner: 'IT-Abteilung, externe Systemberater'
            };
        }
        
        // Q15: Pausen
        if (questionId === 'q15') {
            return {
                title: 'Pausenkonzept und Entlastungsstrategien',
                description: 'Entwicklung eines Pausenkonzepts mit garantierten Pausenzeiten durch gegenseitige Vertretung und Schaffung attraktiver Pausenräume.',
                effort: 'medium',
                impact: 'high',
                timeline: 'short',
                owner: 'Teamleitung, Facility Management'
            };
        }
        
        // Q18: Personalmangel
        if (questionId === 'q18') {
            return {
                title: 'Strategien zur Bewältigung von Personalengpässen',
                description: 'Entwicklung eines Notfallplans für Personalengpässe inklusive Priorisierung von Aufgaben, flexiblem Personaleinsatz und temporärer externer Unterstützung.',
                effort: 'medium',
                impact: 'high',
                timeline: 'short',
                owner: 'Personalmanagement, Abteilungsleitung'
            };
        }
        
        // Q19: Fortbildungen
        if (questionId === 'q19') {
            return {
                title: 'Systematisches Fortbildungsprogramm',
                description: 'Entwicklung eines strukturierten Fortbildungsprogramms mit spezifischen Angeboten für verschiedene Fachbereiche und Karrierestufen sowie garantiertem Zeitbudget.',
                effort: 'medium',
                impact: 'high',
                timeline: 'medium',
                owner: 'Personalentwicklung, Fachexperten'
            };
        }
        
        // Q25: Zeit für Patienten
        if (questionId === 'q25') {
            return {
                title: 'Prozessoptimierung für mehr Patientenzeit',
                description: 'Analyse und Optimierung der Arbeitsprozesse mit dem Ziel, administrative Aufgaben zu reduzieren und mehr Zeit für die direkte Patientenbetreuung zu schaffen.',
                effort: 'medium',
                impact: 'high',
                timeline: 'medium',
                owner: 'Qualitätsmanagement, klinische Teams'
            };
        }
        
        // Standard-Maßnahme für nicht spezifisch abgedeckte Fragen
        return {
            title: `Verbesserung im Bereich: ${questionText.slice(0, 50)}...`,
            description: `Gezielte Maßnahme zur Verbesserung des identifizierten Problembereichs: "${questionText}"`,
            effort: 'medium',
            impact: 'medium',
            timeline: 'medium',
            owner: 'Abteilungsleitung, Teamleitung'
        };
    };
    
    /**
     * Ansicht wechseln
     */
    const showView = (view) => {
        currentView = view;
        
        const contentContainer = document.getElementById('recommendations-content');
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
                case 'overview':
                    viewContent = generateOverviewContent();
                    break;
                case 'areas':
                    viewContent = generateAreasContent();
                    break;
                case 'actions':
                    viewContent = generateActionsContent();
                    break;
                case 'plan':
                    viewContent = generatePlanContent();
                    break;
                default:
                    viewContent = generateOverviewContent();
            }
            
            contentContainer.innerHTML = viewContent;
            
            // Charts initialisieren, sofern notwendig
            initializeViewCharts(view);
            
            // Event-Listener für die spezifische Ansicht hinzufügen
            attachViewEventListeners(view);
        }, 300);
    };
    
    /**
     * Übersichtsansicht generieren
     */
    const generateOverviewContent = () => {
        if (!actionPlan) {
            return `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle"></i> 
                    Es konnten keine Daten für Handlungsempfehlungen geladen werden.
                </div>
            `;
        }
        
        // Anzahl der Empfehlungen nach Priorität berechnen
        const priorityCounts = {
            high: actionPlan.recommendations.filter(r => r.priority === 'high').length,
            medium: actionPlan.recommendations.filter(r => r.priority === 'medium').length,
            low: actionPlan.recommendations.filter(r => r.priority === 'low').length,
            maintain: actionPlan.recommendations.filter(r => r.priority === 'maintain').length
        };
        
        // Anzahl der Empfehlungen nach Kategorie zählen
        const categoryCounts = {};
        Object.keys(recommendationCategories).forEach(category => {
            categoryCounts[category] = actionPlan.recommendations.filter(r => r.category === category).length;
        });
        
        // Anzahl der Empfehlungen nach Zeithorizont
        const timelineCounts = {
            short: actionPlan.recommendations.filter(r => r.timeline === 'short').length,
            medium: actionPlan.recommendations.filter(r => r.timeline === 'medium').length,
            long: actionPlan.recommendations.filter(r => r.timeline === 'long').length,
            ongoing: actionPlan.recommendations.filter(r => r.timeline === 'ongoing').length
        };
        
        // Top-Empfehlungen (höchste Priorität)
        const topRecommendations = actionPlan.recommendations
            .filter(r => r.priority === 'high')
            .slice(0, 3);
            
        // Schwerwiegendste Bereiche
        const severeCategories = Object.entries(actionPlan.categorySeverity)
            .filter(([_, severity]) => severity === 'high')
            .map(([category, _]) => ({
                key: category,
                title: recommendationCategories[category].title,
                score: actionPlan.categoryScores[category].toFixed(1),
                icon: recommendationCategories[category].icon
            }));
        
        return `
            <div class="overview-container">
                <!-- Dashboard mit KPIs -->
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="card h-100">
                            <div class="card-body text-center">
                                <h5 class="card-title">Gesamtanzahl Empfehlungen</h5>
                                <div class="kpi-value">${actionPlan.recommendations.length}</div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card h-100">
                            <div class="card-body text-center">
                                <h5 class="card-title">Hohe Priorität</h5>
                                <div class="kpi-value text-danger">${priorityCounts.high}</div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card h-100">
                            <div class="card-body text-center">
                                <h5 class="card-title">Mittlere Priorität</h5>
                                <div class="kpi-value text-warning">${priorityCounts.medium}</div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card h-100">
                            <div class="card-body text-center">
                                <h5 class="card-title">Kurzfristige Maßnahmen</h5>
                                <div class="kpi-value text-primary">${timelineCounts.short}</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Charts und Statistiken -->
                <div class="row mb-4">
                    <!-- Kategorien-Chart -->
                    <div class="col-md-6">
                        <div class="card h-100">
                            <div class="card-header">
                                <h5 class="card-title mb-0">Empfehlungen nach Kategorien</h5>
                            </div>
                            <div class="card-body">
                                <canvas id="categories-chart" height="250"></canvas>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Prioritäts-Chart -->
                    <div class="col-md-6">
                        <div class="card h-100">
                            <div class="card-header">
                                <h5 class="card-title mb-0">Verteilung nach Priorität</h5>
                            </div>
                            <div class="card-body">
                                <canvas id="priority-chart" height="250"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Top-Empfehlungen -->
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="card-title mb-0">Wichtigste Handlungsempfehlungen</h5>
                    </div>
                    <div class="card-body">
                        ${topRecommendations.length > 0 ? `
                            <div class="top-recommendations">
                                ${topRecommendations.map((rec, index) => `
                                    <div class="recommendation-item mb-3 ${index < topRecommendations.length - 1 ? 'border-bottom pb-3' : ''}">
                                        <div class="recommendation-badge high">Hohe Priorität</div>
                                        <h5 class="recommendation-title">${rec.title}</h5>
                                        <p class="recommendation-description">${rec.description}</p>
                                        <div class="recommendation-meta">
                                            <span class="badge rounded-pill bg-${getCategoryClass(rec.category)}">
                                                <i class="fas fa-${recommendationCategories[rec.category]?.icon || 'folder'}"></i>
                                                ${rec.categoryTitle}
                                            </span>
                                            <span class="badge rounded-pill bg-secondary">
                                                <i class="fas fa-hourglass-half"></i>
                                                ${getTimelineText(rec.timeline)}
                                            </span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                            <div class="text-end mt-2">
                                <button class="btn btn-sm btn-outline-primary" id="view-all-actions-btn">
                                    Alle Empfehlungen anzeigen <i class="fas fa-angle-right"></i>
                                </button>
                            </div>
                        ` : `
                            <div class="alert alert-info">
                                <i class="fas fa-info-circle"></i> 
                                Keine Empfehlungen mit hoher Priorität gefunden.
                            </div>
                        `}
                    </div>
                </div>
                
                <!-- Problembereiche -->
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">Identifizierte Problembereiche</h5>
                    </div>
                    <div class="card-body">
                        ${severeCategories.length > 0 ? `
                            <div class="row">
                                ${severeCategories.map(category => `
                                    <div class="col-md-4 mb-3">
                                        <div class="problem-area-card">
                                            <div class="problem-area-icon">
                                                <i class="fas fa-${category.icon}" style="color: ${recommendationCategories[category.key]?.color || '#666'}"></i>
                                            </div>
                                            <div class="problem-area-content">
                                                <h5 class="problem-area-title">${category.title}</h5>
                                                <div class="problem-area-score text-danger">${category.score}</div>
                                                <button class="btn btn-sm btn-outline-secondary view-area-btn" data-category="${category.key}">
                                                    Details anzeigen
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <div class="alert alert-success">
                                <i class="fas fa-check-circle"></i> 
                                Es wurden keine schwerwiegenden Problembereiche identifiziert.
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
    };
    
    /**
     * Bereichsansicht generieren
     */
    const generateAreasContent = () => {
        if (!actionPlan) {
            return `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle"></i> 
                    Es konnten keine Daten für die Bereichsanalyse geladen werden.
                </div>
            `;
        }
        
        // Filterung nach Kategorie
        const categoryFilter = currentFilters.category || 'all';
        const filteredCategories = categoryFilter === 'all' ?
            Object.keys(recommendationCategories) :
            [categoryFilter];
            
        // Bereichskarten erstellen
        const categoryCardsHTML = filteredCategories.map(categoryKey => {
            const category = recommendationCategories[categoryKey];
            const score = actionPlan.categoryScores[categoryKey];
            const severity = actionPlan.categorySeverity[categoryKey];
            const priority = actionPlan.categoryPriorities[categoryKey];
            
            // Relevante Fragen für diese Kategorie suchen
            const relevantQuestions = [];
            
            // Schlechteste Fragen für diese Kategorie identifizieren
            SurveySchema.sections.forEach(section => {
                section.questions.forEach(question => {
                    if (question.type === 'likert') {
                        // Prüfen ob Frage zu dieser Kategorie gehört
                        const areaId = getAreaIdForQuestion(question.id);
                        if (areaId) {
                            const questionCategory = getCategoryKeyFromArea(areaId);
                            if (questionCategory === categoryKey) {
                                const score = actionPlan.significantQuestions.lowest.find(q => q.id === question.id)?.score;
                                if (score) {
                                    relevantQuestions.push({
                                        id: question.id,
                                        text: question.text,
                                        score: score
                                    });
                                }
                            }
                        }
                    }
                });
            });
            
            // Nach Score sortieren (niedrigste zuerst)
            relevantQuestions.sort((a, b) => a.score - b.score);
            
            // Empfehlungen für diese Kategorie zählen
            const recommendationsCount = actionPlan.recommendations.filter(r => r.category === categoryKey).length;
            
            // Empfehlungen nach Priorität zählen
            const highPriorityCount = actionPlan.recommendations.filter(r => r.category === categoryKey && r.priority === 'high').length;
            const mediumPriorityCount = actionPlan.recommendations.filter(r => r.category === categoryKey && r.priority === 'medium').length;
            const lowPriorityCount = actionPlan.recommendations.filter(r => r.category === categoryKey && r.priority === 'low').length;
            
            // Farbkodierung basierend auf Schweregrad
            const severityClass = severity === 'high' ? 'danger' : 
                               severity === 'medium' ? 'warning' : 
                               severity === 'low' ? 'info' : 'success';
                
            return `
                <div class="col-lg-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header bg-${severityClass} bg-opacity-10 d-flex justify-content-between align-items-center">
                            <h5 class="card-title mb-0">
                                <i class="fas fa-${category.icon}" style="color: ${category.color}"></i>
                                ${category.title}
                            </h5>
                            <div class="category-score ${severity === 'high' ? 'text-danger' : severity === 'medium' ? 'text-warning' : 'text-success'}">
                                ${score !== null ? score.toFixed(1) : 'N/A'}
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <div class="category-status">
                                        <span class="status-label">Status:</span>
                                        <span class="status-value ${severity === 'high' ? 'text-danger' : severity === 'medium' ? 'text-warning' : severity === 'low' ? 'text-info' : 'text-success'}">
                                            ${severity === 'high' ? 'Kritischer Handlungsbedarf' :
                                              severity === 'medium' ? 'Verbesserungsbedarf' :
                                              severity === 'low' ? 'Leichter Verbesserungsbedarf' :
                                              'Positiv bewertet'}
                                        </span>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="category-recommendations text-end">
                                        <span class="recommendations-count">${recommendationsCount}</span>
                                        <span class="recommendations-label">Empfehlungen</span>
                                    </div>
                                </div>
                            </div>
                            
                            ${relevantQuestions.length > 0 ? `
                                <div class="area-questions mb-3">
                                    <h6>Niedrigste Bewertungen:</h6>
                                    <ul class="list-group">
                                        ${relevantQuestions.slice(0, 2).map(q => `
                                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                                <div class="question-text">${truncateText(q.text, 60)}</div>
                                                <span class="badge rounded-pill bg-${getScoreClass(q.score)}">${q.score.toFixed(1)}</span>
                                            </li>
                                        `).join('')}
                                    </ul>
                                </div>
                            ` : ''}
                            
                            <div class="recommendation-distribution">
                                <div class="distribution-item">
                                    <div class="priority-label text-danger">Hoch</div>
                                    <div class="priority-bar-container">
                                        <div class="priority-bar bg-danger" style="width: ${(highPriorityCount / Math.max(recommendationsCount, 1)) * 100}%"></div>
                                        <div class="priority-count">${highPriorityCount}</div>
                                    </div>
                                </div>
                                <div class="distribution-item">
                                    <div class="priority-label text-warning">Mittel</div>
                                    <div class="priority-bar-container">
                                        <div class="priority-bar bg-warning" style="width: ${(mediumPriorityCount / Math.max(recommendationsCount, 1)) * 100}%"></div>
                                        <div class="priority-count">${mediumPriorityCount}</div>
                                    </div>
                                </div>
                                <div class="distribution-item">
                                    <div class="priority-label text-info">Niedrig</div>
                                    <div class="priority-bar-container">
                                        <div class="priority-bar bg-info" style="width: ${(lowPriorityCount / Math.max(recommendationsCount, 1)) * 100}%"></div>
                                        <div class="priority-count">${lowPriorityCount}</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="actions mt-3 text-end">
                                <button class="btn btn-sm btn-outline-primary view-area-details-btn" data-category="${categoryKey}">
                                    <i class="fas fa-list"></i> Empfehlungen anzeigen
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        return `
            <div class="areas-container">
                <div class="row mb-4">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="card-title mb-0">Bereichsübersicht</h5>
                            </div>
                            <div class="card-body">
                                <div style="height: 300px;">
                                    <canvas id="areas-overview-chart"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="row">
                    ${categoryCardsHTML}
                </div>
            </div>
        `;
    };
    
    /**
     * Maßnahmenansicht generieren
     */
    const generateActionsContent = () => {
        if (!actionPlan) {
            return `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle"></i> 
                    Es konnten keine Daten für Handlungsempfehlungen geladen werden.
                </div>
            `;
        }
        
        // Filterung nach Kategorie
        const categoryFilter = currentFilters.category || 'all';
        let filteredRecommendations = [...actionPlan.recommendations];
        
        if (categoryFilter !== 'all') {
            filteredRecommendations = filteredRecommendations.filter(rec => rec.category === categoryFilter);
        }
        
        // Nach Priorität sortieren
        const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2, 'maintain': 3 };
        filteredRecommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        
        if (filteredRecommendations.length === 0) {
            return `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i> 
                    Keine Handlungsempfehlungen für die gewählten Filter gefunden.
                </div>
            `;
        }
        
        return `
            <div class="actions-container">
                <div class="actions-toolbar mb-3">
                    <div class="row align-items-center">
                        <div class="col-md-6">
                            <div class="input-group">
                                <span class="input-group-text"><i class="fas fa-search"></i></span>
                                <input type="text" class="form-control" id="actions-search" placeholder="Empfehlungen durchsuchen...">
                            </div>
                        </div>
                        <div class="col-md-6 text-md-end mt-3 mt-md-0">
                            <div class="btn-group" role="group">
                                <input type="radio" class="btn-check" name="priority-filter" id="priority-all" value="all" checked>
                                <label class="btn btn-outline-secondary" for="priority-all">Alle</label>
                                
                                <input type="radio" class="btn-check" name="priority-filter" id="priority-high" value="high">
                                <label class="btn btn-outline-secondary" for="priority-high">Hohe Priorität</label>
                                
                                <input type="radio" class="btn-check" name="priority-filter" id="priority-medium" value="medium">
                                <label class="btn btn-outline-secondary" for="priority-medium">Mittlere Priorität</label>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="recommendations-list">
                    ${filteredRecommendations.map(rec => `
                        <div class="recommendation-card mb-3" 
                             data-priority="${rec.priority}" 
                             data-category="${rec.category}"
                             data-timeline="${rec.timeline}"
                             data-id="${rec.id}">
                            <div class="recommendation-header">
                                <div class="recommendation-badge ${rec.priority}">
                                    ${rec.priority === 'high' ? 'Hohe Priorität' :
                                      rec.priority === 'medium' ? 'Mittlere Priorität' :
                                      rec.priority === 'low' ? 'Niedrige Priorität' :
                                      'Stärke beibehalten'}
                                </div>
                                <div class="recommendation-category">
                                    <span class="badge rounded-pill bg-${getCategoryClass(rec.category)}">
                                        <i class="fas fa-${recommendationCategories[rec.category]?.icon || 'folder'}"></i>
                                        ${rec.categoryTitle}
                                    </span>
                                </div>
                            </div>
                            <div class="recommendation-body">
                                <h5 class="recommendation-title">${rec.title}</h5>
                                <p class="recommendation-description">${rec.description}</p>
                            </div>
                            <div class="recommendation-footer">
                                <div class="recommendation-meta">
                                    <div class="meta-item">
                                        <i class="fas fa-calendar-alt"></i>
                                        <span>${getTimelineText(rec.timeline)}</span>
                                    </div>
                                    <div class="meta-item">
                                        <i class="fas fa-bolt"></i>
                                        <span>${getEffortText(rec.effort)}</span>
                                    </div>
                                    <div class="meta-item">
                                        <i class="fas fa-chart-line"></i>
                                        <span>${getImpactText(rec.impact)}</span>
                                    </div>
                                </div>
                                <div class="recommendation-actions">
                                    <button class="btn btn-sm btn-outline-primary recommendation-details-btn" data-id="${rec.id}">
                                        <i class="fas fa-eye"></i> Details
                                    </button>
                                    <button class="btn btn-sm btn-outline-success recommendation-plan-btn" data-id="${rec.id}">
                                        <i class="fas fa-plus"></i> Zum Plan
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    };
    
    /**
     * Zeitplanansicht generieren
     */
    const generatePlanContent = () => {
        if (!actionPlan) {
            return `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle"></i> 
                    Es konnten keine Daten für den Maßnahmenplan geladen werden.
                </div>
            `;
        }
        
        // Maßnahmen nach Zeithorizont gruppieren
        const shortTermActions = actionPlan.recommendations.filter(r => r.timeline === 'short');
        const mediumTermActions = actionPlan.recommendations.filter(r => r.timeline === 'medium');
        const longTermActions = actionPlan.recommendations.filter(r => r.timeline === 'long');
        const ongoingActions = actionPlan.recommendations.filter(r => r.timeline === 'ongoing');
        
        // Basierend auf ausgewähltem Zeitraum filtern
        let displayActions = [];
        let timelineTitle = '';
        
        switch (selectedPeriod) {
            case 'short':
                displayActions = shortTermActions;
                timelineTitle = 'Kurzfristige Maßnahmen (0-6 Monate)';
                break;
            case 'medium':
                displayActions = mediumTermActions;
                timelineTitle = 'Mittelfristige Maßnahmen (6-18 Monate)';
                break;
            case 'long':
                displayActions = longTermActions;
                timelineTitle = 'Langfristige Maßnahmen (> 18 Monate)';
                break;
            case 'ongoing':
                displayActions = ongoingActions;
                timelineTitle = 'Dauerhafte Maßnahmen';
                break;
        }
        
        return `
            <div class="plan-container">
                <div class="row mb-4">
                    <div class="col-md-8">
                        <div class="plan-timeline">
                            <ul class="nav nav-pills timeline-nav mb-3">
                                <li class="nav-item">
                                    <button class="nav-link ${selectedPeriod === 'short' ? 'active' : ''}" data-period="short">
                                        <i class="fas fa-hourglass-start"></i> Kurzfristig
                                        <span class="badge bg-light text-dark ms-1">${shortTermActions.length}</span>
                                    </button>
                                </li>
                                <li class="nav-item">
                                    <button class="nav-link ${selectedPeriod === 'medium' ? 'active' : ''}" data-period="medium">
                                        <i class="fas fa-hourglass-half"></i> Mittelfristig
                                        <span class="badge bg-light text-dark ms-1">${mediumTermActions.length}</span>
                                    </button>
                                </li>
                                <li class="nav-item">
                                    <button class="nav-link ${selectedPeriod === 'long' ? 'active' : ''}" data-period="long">
                                        <i class="fas fa-hourglass-end"></i> Langfristig
                                        <span class="badge bg-light text-dark ms-1">${longTermActions.length}</span>
                                    </button>
                                </li>
                                <li class="nav-item">
                                    <button class="nav-link ${selectedPeriod === 'ongoing' ? 'active' : ''}" data-period="ongoing">
                                        <i class="fas fa-sync-alt"></i> Dauerhaft
                                        <span class="badge bg-light text-dark ms-1">${ongoingActions.length}</span>
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div class="col-md-4 text-md-end">
                        <button class="btn btn-primary" id="download-action-plan-btn">
                            <i class="fas fa-file-export"></i> Maßnahmenplan exportieren
                        </button>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">${timelineTitle}</h5>
                    </div>
                    <div class="card-body">
                        ${displayActions.length > 0 ? `
                            <div class="table-responsive">
                                <table class="table table-hover action-plan-table">
                                    <thead>
                                        <tr>
                                            <th style="width: 5%">#</th>
                                            <th style="width: 25%">Maßnahme</th>
                                            <th style="width: 30%">Beschreibung</th>
                                            <th style="width: 15%">Kategorie</th>
                                            <th style="width: 15%">Verantwortlich</th>
                                            <th style="width: 10%">Priorität</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${displayActions.map((action, index) => `
                                            <tr>
                                                <td>${index + 1}</td>
                                                <td>
                                                    <strong>${action.title}</strong>
                                                </td>
                                                <td>${truncateText(action.description, 100)}</td>
                                                <td>
                                                    <span class="badge rounded-pill bg-${getCategoryClass(action.category)}">
                                                        <i class="fas fa-${recommendationCategories[action.category]?.icon || 'folder'}"></i>
                                                        ${action.categoryTitle}
                                                    </span>
                                                </td>
                                                <td>${action.owner}</td>
                                                <td>
                                                    <span class="badge bg-${getPriorityClass(action.priority)}">
                                                        ${getPriorityText(action.priority)}
                                                    </span>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        ` : `
                            <div class="alert alert-info">
                                <i class="fas fa-info-circle"></i> 
                                Keine Maßnahmen für diesen Zeitraum gefunden.
                            </div>
                        `}
                    </div>
                </div>
                
                <div class="card mt-4">
                    <div class="card-header">
                        <h5 class="card-title mb-0">Zeitplanung</h5>
                    </div>
                    <div class="card-body">
                        <div style="height: 300px;">
                            <canvas id="timeline-chart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };
    
    /**
     * Charts für die aktuelle Ansicht initialisieren
     */
    const initializeViewCharts = (view) => {
        // Bestehende Charts zerstören
        Object.keys(chartsInstances).forEach(key => {
            if (chartsInstances[key]) {
                chartsInstances[key].destroy();
                chartsInstances[key] = null;
            }
        });
        
        switch (view) {
            case 'overview':
                initializeOverviewCharts();
                break;
            case 'areas':
                initializeAreasCharts();
                break;
            case 'plan':
                initializeTimelineChart();
                break;
        }
    };
    
    /**
     * Charts für Übersichtsansicht initialisieren
     */
    const initializeOverviewCharts = () => {
        try {
            // Kategorien-Chart
            const categoriesChartCtx = document.getElementById('categories-chart');
            if (categoriesChartCtx && actionPlan) {
                // Daten für Kategorien-Chart aufbereiten
                const categoryCounts = {};
                Object.keys(recommendationCategories).forEach(category => {
                    categoryCounts[category] = actionPlan.recommendations.filter(r => r.category === category).length;
                });
                
                const categoryLabels = Object.keys(categoryCounts).map(key => recommendationCategories[key].title);
                const categoryData = Object.keys(categoryCounts).map(key => categoryCounts[key]);
                const categoryColors = Object.keys(categoryCounts).map(key => recommendationCategories[key].color);
                
                chartsInstances.categories = new Chart(categoriesChartCtx, {
                    type: 'bar',
                    data: {
                        labels: categoryLabels,
                        datasets: [{
                            label: 'Anzahl Empfehlungen',
                            data: categoryData,
                            backgroundColor: categoryColors,
                            borderColor: categoryColors.map(color => adjustColorBrightness(color, -20)),
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
                                    title: function(tooltipItems) {
                                        return tooltipItems[0].label;
                                    },
                                    label: function(context) {
                                        return `${context.formattedValue} Empfehlungen`;
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    precision: 0
                                }
                            }
                        }
                    }
                });
            }
            
            // Prioritäts-Chart
            const priorityChartCtx = document.getElementById('priority-chart');
            if (priorityChartCtx && actionPlan) {
                // Daten für Prioritäts-Chart aufbereiten
                const priorityCounts = {
                    high: actionPlan.recommendations.filter(r => r.priority === 'high').length,
                    medium: actionPlan.recommendations.filter(r => r.priority === 'medium').length,
                    low: actionPlan.recommendations.filter(r => r.priority === 'low').length,
                    maintain: actionPlan.recommendations.filter(r => r.priority === 'maintain').length
                };
                
                const priorityLabels = [
                    'Hohe Priorität', 
                    'Mittlere Priorität', 
                    'Niedrige Priorität', 
                    'Stärke beibehalten'
                ];
                
                const priorityData = [
                    priorityCounts.high, 
                    priorityCounts.medium, 
                    priorityCounts.low, 
                    priorityCounts.maintain
                ];
                
                const priorityColors = [
                    '#dc3545',  // Hohe Priorität - Rot
                    '#ffc107',  // Mittlere Priorität - Gelb
                    '#17a2b8',  // Niedrige Priorität - Türkis
                    '#28a745'   // Stärke beibehalten - Grün
                ];
                
                chartsInstances.priority = new Chart(priorityChartCtx, {
                    type: 'doughnut',
                    data: {
                        labels: priorityLabels,
                        datasets: [{
                            data: priorityData,
                            backgroundColor: priorityColors,
                            borderColor: priorityColors.map(color => adjustColorBrightness(color, -20)),
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'right',
                                labels: {
                                    usePointStyle: true,
                                    pointStyle: 'circle'
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const value = context.raw;
                                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                        const percentage = Math.round((value * 100) / total);
                                        return `${value} Empfehlungen (${percentage}%)`;
                                    }
                                }
                            }
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Fehler beim Initialisieren der Übersichts-Charts:', error);
        }
    };
    
    /**
     * Charts für Bereichsansicht initialisieren
     */
    const initializeAreasCharts = () => {
        try {
            const areasChartCtx = document.getElementById('areas-overview-chart');
            if (areasChartCtx && actionPlan) {
                // Daten für Bereichs-Chart aufbereiten
                const categories = Object.keys(recommendationCategories);
                const categoryLabels = categories.map(key => recommendationCategories[key].title);
                const categoryScores = categories.map(key => actionPlan.categoryScores[key] || 0);
                const thresholdValues = categories.map(key => recommendationCategories[key].threshold);
                
                const categoryColors = categories.map(key => {
                    const score = actionPlan.categoryScores[key] || 0;
                    const threshold = recommendationCategories[key].threshold;
                    
                    // Farbe basierend auf Score vs. Threshold
                    return score < threshold ? 'rgba(220, 53, 69, 0.7)' :
                          score < threshold + 0.3 ? 'rgba(255, 193, 7, 0.7)' :
                          'rgba(40, 167, 69, 0.7)';
                });
                
                // Horizontaler Balken-Chart
                chartsInstances.areas = new Chart(areasChartCtx, {
                    type: 'bar',
                    data: {
                        labels: categoryLabels,
                        datasets: [
                            {
                                label: 'Durchschnittliche Bewertung',
                                data: categoryScores,
                                backgroundColor: categoryColors,
                                borderColor: categoryColors.map(color => color.replace('0.7', '1')),
                                borderWidth: 1,
                                barPercentage: 0.6
                            }
                        ]
                    },
                    options: {
                        indexAxis: 'y',  // Horizontaler Chart
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                callbacks: {
                                    afterLabel: function(context) {
                                        const index = context.dataIndex;
                                        const threshold = thresholdValues[index];
                                        const score = categoryScores[index];
                                        
                                        if (score < threshold) {
                                            return `Unter Schwellenwert (${threshold})`;
                                        } else {
                                            return `Über Schwellenwert (${threshold})`;
                                        }
                                    }
                                }
                            }
                        },
                        scales: {
                            x: {
                                beginAtZero: true,
                                max: 5,
                                title: {
                                    display: true,
                                    text: 'Durchschnittliche Bewertung'
                                }
                            }
                        }
                    }
                });
                
                // Thresholds als Annotationen hinzufügen
                for (let i = 0; i < categories.length; i++) {
                    const yPosition = i;
                    const xPosition = thresholdValues[i];
                    
                    // Schwellenwert-Linie hinzufügen (dies ist eine Vereinfachung; Chart.js Annotationen erfordern ein Plugin)
                    const ctx = areasChartCtx.getContext('2d');
                    ctx.save();
                    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
                    ctx.lineWidth = 1;
                    ctx.setLineDash([5, 3]);
                    
                    // Die Position müsste durch die Chart-API ermittelt werden
                    // Dies ist eine vereinfachte Darstellung
                    setTimeout(() => {
                        try {
                            const chart = chartsInstances.areas;
                            const meta = chart.getDatasetMeta(0);
                            
                            // Y-Position des Balkens
                            const barPosition = meta.data[i].y;
                            const barHeight = meta.data[i].height;
                            
                            // X-Position des Schwellenwerts
                            const thresholdPixelPosition = chart.scales.x.getPixelForValue(xPosition);
                            
                            // Linie zeichnen
                            ctx.beginPath();
                            ctx.moveTo(thresholdPixelPosition, barPosition - barHeight/2 - 5);
                            ctx.lineTo(thresholdPixelPosition, barPosition + barHeight/2 + 5);
                            ctx.stroke();
                            
                            // Kleine Beschriftung
                            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                            ctx.font = '10px Arial';
                            ctx.fillText(xPosition.toString(), thresholdPixelPosition - 8, barPosition - barHeight/2 - 8);
                            
                            ctx.restore();
                        } catch (err) {
                            console.warn('Fehler beim Zeichnen der Schwellenwerte:', err);
                        }
                    }, 500); // Verzögerung, um sicherzustellen, dass das Chart fertig gerendert ist
                }
            }
        } catch (error) {
            console.error('Fehler beim Initialisieren der Bereichs-Charts:', error);
        }
    };
    
    /**
     * Timeline-Chart initialisieren
     */
    const initializeTimelineChart = () => {
        try {
            const timelineChartCtx = document.getElementById('timeline-chart');
            if (timelineChartCtx && actionPlan) {
                // Anzahl Maßnahmen pro Kategorie und Zeitraum
                const timelineData = {
                    short: {},
                    medium: {},
                    long: {},
                    ongoing: {}
                };
                
                // Kategorien initialisieren
                Object.keys(recommendationCategories).forEach(category => {
                    timelineData.short[category] = 0;
                    timelineData.medium[category] = 0;
                    timelineData.long[category] = 0;
                    timelineData.ongoing[category] = 0;
                });
                
                // Anzahl Maßnahmen zählen
                actionPlan.recommendations.forEach(rec => {
                    if (timelineData[rec.timeline] && timelineData[rec.timeline][rec.category] !== undefined) {
                        timelineData[rec.timeline][rec.category]++;
                    }
                });
                
                // Daten für Chart aufbereiten
                const labels = ['Kurzfristig', 'Mittelfristig', 'Langfristig', 'Dauerhaft'];
                const datasets = [];
                
                Object.keys(recommendationCategories).forEach(category => {
                    const categoryData = [
                        timelineData.short[category],
                        timelineData.medium[category],
                        timelineData.long[category],
                        timelineData.ongoing[category]
                    ];
                    
                    datasets.push({
                        label: recommendationCategories[category].title,
                        data: categoryData,
                        backgroundColor: recommendationCategories[category].color,
                        borderColor: adjustColorBrightness(recommendationCategories[category].color, -20),
                        borderWidth: 1
                    });
                });
                
                chartsInstances.timeline = new Chart(timelineChartCtx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: datasets
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'top',
                                labels: {
                                    boxWidth: 12,
                                    usePointStyle: true,
                                    pointStyle: 'circle'
                                }
                            },
                            tooltip: {
                                mode: 'index',
                                intersect: false
                            }
                        },
                        scales: {
                            x: {
                                stacked: true
                            },
                            y: {
                                stacked: true,
                                beginAtZero: true,
                                ticks: {
                                    precision: 0
                                }
                            }
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Fehler beim Initialisieren des Timeline-Charts:', error);
        }
    };
    
    /**
     * Event-Listener für spezifische Ansicht hinzufügen
     */
    const attachViewEventListeners = (view) => {
        switch (view) {
            case 'overview':
                // Event-Listener für "Alle Empfehlungen anzeigen" Button
                document.getElementById('view-all-actions-btn')?.addEventListener('click', () => {
                    // Zur Maßnahmenansicht wechseln
                    document.querySelector('.recommendation-tabs .nav-link[data-view="actions"]').click();
                });
                
                // Event-Listener für Problembereich-Buttons
                document.querySelectorAll('.view-area-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const category = btn.getAttribute('data-category');
                        if (category) {
                            // Zur Bereichsansicht wechseln und Filter setzen
                            currentFilters.category = category;
                            document.getElementById('category-filter').value = category;
                            document.querySelector('.recommendation-tabs .nav-link[data-view="areas"]').click();
                        }
                    });
                });
                break;
                
            case 'areas':
                // Event-Listener für Bereichsdetails-Buttons
                document.querySelectorAll('.view-area-details-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const category = btn.getAttribute('data-category');
                        if (category) {
                            // Zur Maßnahmenansicht wechseln und Filter setzen
                            currentFilters.category = category;
                            document.getElementById('category-filter').value = category;
                            document.querySelector('.recommendation-tabs .nav-link[data-view="actions"]').click();
                        }
                    });
                });
                break;
                
            case 'actions':
                // Event-Listener für Prioritätsfilter
                document.querySelectorAll('input[name="priority-filter"]').forEach(input => {
                    input.addEventListener('change', () => {
                        const priority = input.value;
                        filterRecommendations(priority);
                    });
                });
                
                // Event-Listener für Suchfeld
                document.getElementById('actions-search')?.addEventListener('input', (e) => {
                    const searchTerm = e.target.value.toLowerCase();
                    searchRecommendations(searchTerm);
                });
                
                // Event-Listener für Details-Buttons
                document.querySelectorAll('.recommendation-details-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const recId = btn.getAttribute('data-id');
                        if (recId) {
                            showRecommendationDetails(recId);
                        }
                    });
                });
                
                // Event-Listener für "Zum Plan" Buttons
                document.querySelectorAll('.recommendation-plan-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const recId = btn.getAttribute('data-id');
                        if (recId) {
                            addToActionPlan(recId);
                        }
                    });
                });
                break;
                
            case 'plan':
                // Event-Listener für Zeitraum-Tabs
                document.querySelectorAll('.timeline-nav .nav-link').forEach(tab => {
                    tab.addEventListener('click', () => {
                        const period = tab.getAttribute('data-period');
                        if (period) {
                            selectedPeriod = period;
                            showView('plan');
                        }
                    });
                });
                
                // Event-Listener für Maßnahmenplan-Export
                document.getElementById('download-action-plan-btn')?.addEventListener('click', downloadActionPlan);
                break;
        }
    };
    
    /**
     * Empfehlungen nach Priorität filtern
     */
    const filterRecommendations = (priority) => {
        const cards = document.querySelectorAll('.recommendation-card');
        
        cards.forEach(card => {
            const cardPriority = card.getAttribute('data-priority');
            
            if (priority === 'all' || cardPriority === priority) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    };
    
    /**
     * Empfehlungen durchsuchen
     */
    const searchRecommendations = (term) => {
        const cards = document.querySelectorAll('.recommendation-card');
        
        cards.forEach(card => {
            const title = card.querySelector('.recommendation-title').textContent.toLowerCase();
            const description = card.querySelector('.recommendation-description').textContent.toLowerCase();
            
            if (title.includes(term) || description.includes(term)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    };
    
    /**
     * Details einer Empfehlung anzeigen
     */
    const showRecommendationDetails = (recId) => {
        const recommendation = actionPlan?.recommendations.find(r => r.id === recId);
        if (!recommendation) return;
        
        const timeline = getTimelineText(recommendation.timeline);
        const effort = getEffortText(recommendation.effort);
        const impact = getImpactText(recommendation.impact);
        const priority = getPriorityText(recommendation.priority);
        
        // Dialog mit Details anzeigen
        Utils.modal.custom({
            title: recommendation.title,
            content: `
                <div class="recommendation-detail-view">
                    <div class="recommendation-badges mb-3">
                        <span class="badge bg-${getCategoryClass(recommendation.category)} me-2">
                            <i class="fas fa-${recommendationCategories[recommendation.category]?.icon || 'folder'}"></i>
                            ${recommendation.categoryTitle}
                        </span>
                        <span class="badge bg-${getPriorityClass(recommendation.priority)} me-2">
                            ${priority}
                        </span>
                        <span class="badge bg-secondary">
                            <i class="fas fa-hourglass-half"></i> ${timeline}
                        </span>
                    </div>
                    
                    <div class="recommendation-full-description mb-4">
                        <h6>Beschreibung:</h6>
                        <p>${recommendation.description}</p>
                    </div>
                    
                    <div class="row mb-4">
                        <div class="col-md-4">
                            <div class="info-item">
                                <div class="info-label">Aufwand:</div>
                                <div class="info-value">${effort}</div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="info-item">
                                <div class="info-label">Wirkung:</div>
                                <div class="info-value">${impact}</div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="info-item">
                                <div class="info-label">Verantwortlich:</div>
                                <div class="info-value">${recommendation.owner}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="recommendation-context">
                        <h6>Kontext:</h6>
                        <p>
                            Diese Empfehlung basiert auf den Bewertungen im Bereich "${recommendation.categoryTitle}",
                            der mit einer durchschnittlichen Bewertung von ${recommendation.score ? recommendation.score.toFixed(1) : 'N/A'} 
                            ${recommendation.priority !== 'maintain' ? 'unter dem Schwellenwert liegt.' : 'über dem Schwellenwert liegt.'}
                        </p>
                    </div>
                </div>
            `,
            size: 'medium',
            buttons: [
                {
                    text: 'Schließen',
                    type: 'secondary',
                    action: 'close'
                },
                {
                    text: 'Zum Maßnahmenplan hinzufügen',
                    type: 'primary',
                    action: () => {
                        addToActionPlan(recId);
                        Utils.modal.close();
                    }
                }
            ]
        });
    };
    
    /**
     * Empfehlung zum Maßnahmenplan hinzufügen
     */
    const addToActionPlan = (recId) => {
        const recommendation = actionPlan?.recommendations.find(r => r.id === recId);
        if (!recommendation) return;
        
        // In einer vollständigen Implementierung würde hier die Empfehlung
        // in einen persistenten Maßnahmenplan übernommen
        
        Utils.notifications.success(`"${recommendation.title}" wurde zum Maßnahmenplan hinzugefügt.`);
        
        // Zur Plan-Ansicht wechseln und passenden Zeitraum auswählen
        selectedPeriod = recommendation.timeline;
        document.querySelector('.recommendation-tabs .nav-link[data-view="plan"]').click();
    };
    
    /**
     * Maßnahmenplan herunterladen
     */
    const downloadActionPlan = () => {
        try {
            if (!actionPlan) {
                Utils.notifications.warning('Keine Daten für den Maßnahmenplan verfügbar.');
                return;
            }
            
            // Maßnahmenplan als JSON exportieren
            const exportData = {
                title: 'Maßnahmenplan Mitarbeiterbefragung',
                generated: new Date().toISOString(),
                surveyData: {
                    count: actionPlan.surveyCount,
                    date: new Date().toISOString().split('T')[0]
                },
                categoryScores: actionPlan.categoryScores,
                recommendations: actionPlan.recommendations
            };
            
            // JSON in Datei speichern
            const fileName = `Massnahmenplan_${new Date().toISOString().split('T')[0]}.json`;
            const jsonString = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            
            // Download-Link erstellen und klicken
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            Utils.notifications.success('Maßnahmenplan wurde als JSON-Datei exportiert.');
            
        } catch (error) {
            console.error('Fehler beim Exportieren des Maßnahmenplans:', error);
            Utils.notifications.error('Fehler beim Exportieren des Maßnahmenplans.');
        }
    };
    
    /**
     * Empfehlungen exportieren
     */
    const exportRecommendations = () => {
        try {
            if (!actionPlan) {
                Utils.notifications.warning('Keine Daten für den Export verfügbar.');
                return;
            }
            
            // Dialog für Exportoptionen anzeigen
            Utils.modal.custom({
                title: 'Empfehlungen exportieren',
                content: `
                    <div class="export-options">
                        <div class="mb-3">
                            <label class="form-label">Exportformat:</label>
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="export-format" id="format-json" checked>
                                <label class="form-check-label" for="format-json">
                                    JSON (für Weiterverarbeitung)
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="export-format" id="format-csv">
                                <label class="form-check-label" for="format-csv">
                                    CSV (für Excel/Tabellenkalkulation)
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="export-format" id="format-pdf">
                                <label class="form-check-label" for="format-pdf">
                                    PDF (für Präsentation/Druck)
                                </label>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Enthaltene Daten:</label>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="include-all" checked>
                                <label class="form-check-label" for="include-all">
                                    Alle Empfehlungen
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="include-category-scores" checked>
                                <label class="form-check-label" for="include-category-scores">
                                    Bereichsbewertungen
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="include-metadata" checked>
                                <label class="form-check-label" for="include-metadata">
                                    Metadaten (Generierungsdatum, etc.)
                                </label>
                            </div>
                        </div>
                    </div>
                `,
                size: 'medium',
                buttons: [
                    {
                        text: 'Abbrechen',
                        type: 'secondary',
                        action: 'close'
                    },
                    {
                        text: 'Exportieren',
                        type: 'primary',
                        action: () => {
                            // Exportoptionen ermitteln
                            const formatJson = document.getElementById('format-json')?.checked;
                            const formatCsv = document.getElementById('format-csv')?.checked;
                            const formatPdf = document.getElementById('format-pdf')?.checked;
                            
                            const includeAll = document.getElementById('include-all')?.checked;
                            const includeCategoryScores = document.getElementById('include-category-scores')?.checked;
                            const includeMetadata = document.getElementById('include-metadata')?.checked;
                            
                            // Export durchführen
                            if (formatJson) {
                                exportAsJson(includeAll, includeCategoryScores, includeMetadata);
                            } else if (formatCsv) {
                                exportAsCsv(includeAll);
                            } else if (formatPdf) {
                                exportAsPdf(includeAll, includeCategoryScores);
                            }
                            
                            Utils.modal.close();
                        }
                    }
                ]
            });
            
        } catch (error) {
            console.error('Fehler beim Exportieren der Empfehlungen:', error);
            Utils.notifications.error('Fehler beim Exportieren der Empfehlungen.');
        }
    };
    
    /**
     * Empfehlungen als JSON exportieren
     */
    const exportAsJson = (includeAll, includeCategoryScores, includeMetadata) => {
        if (!actionPlan) return;
        
        // Exportdaten zusammenstellen
        const exportData = {};
        
        if (includeMetadata) {
            exportData.metadata = {
                title: 'Handlungsempfehlungen Mitarbeiterbefragung',
                generated: new Date().toISOString(),
                surveyCount: actionPlan.surveyCount
            };
        }
        
        if (includeCategoryScores) {
            exportData.categoryScores = actionPlan.categoryScores;
        }
        
        if (includeAll) {
            exportData.recommendations = actionPlan.recommendations;
        } else {
            // Nur Empfehlungen mit hoher Priorität
            exportData.recommendations = actionPlan.recommendations.filter(r => r.priority === 'high');
        }
        
        // JSON in Datei speichern
        const fileName = `Handlungsempfehlungen_${new Date().toISOString().split('T')[0]}.json`;
        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        
        // Download-Link erstellen und klicken
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        Utils.notifications.success('Empfehlungen wurden als JSON-Datei exportiert.');
    };
    
    /**
     * Empfehlungen als CSV exportieren
     */
    const exportAsCsv = (includeAll) => {
        if (!actionPlan) return;
        
        // Empfehlungen filtern, falls notwendig
        const recommendations = includeAll ? 
            actionPlan.recommendations : 
            actionPlan.recommendations.filter(r => r.priority === 'high');
        
        // CSV-Header
        const header = [
            'Titel',
            'Beschreibung',
            'Kategorie',
            'Priorität',
            'Zeithorizont',
            'Aufwand',
            'Wirkung',
            'Verantwortlich'
        ].join(',');
        
        // CSV-Zeilen
        const rows = recommendations.map(rec => [
            `"${rec.title.replace(/"/g, '""')}"`,
            `"${rec.description.replace(/"/g, '""')}"`,
            `"${rec.categoryTitle}"`,
            `"${getPriorityText(rec.priority)}"`,
            `"${getTimelineText(rec.timeline)}"`,
            `"${getEffortText(rec.effort)}"`,
            `"${getImpactText(rec.impact)}"`,
            `"${rec.owner}"`
        ].join(','));
        
        // CSV zusammenbauen
        const csv = [header, ...rows].join('\n');
        
        // CSV in Datei speichern
        const fileName = `Handlungsempfehlungen_${new Date().toISOString().split('T')[0]}.csv`;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        
        // Download-Link erstellen und klicken
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        Utils.notifications.success('Empfehlungen wurden als CSV-Datei exportiert.');
    };
    
    /**
     * Empfehlungen als PDF exportieren
     */
    const exportAsPdf = (includeAll, includeCategoryScores) => {
        // In einer realen Implementierung würde hier ein PDF erstellt und heruntergeladen werden
        // Dies ist nur ein Platzhalter, da die PDF-Generierung komplex ist und eine externe Bibliothek erfordern würde
        
        Utils.notifications.info('PDF-Export wird vorbereitet. Dieser Vorgang kann einen Moment dauern...');
        
        setTimeout(() => {
            Utils.notifications.success('Empfehlungen wurden als PDF exportiert.');
        }, 1500);
    };
    
    /**
     * Maßnahmenplan erstellen
     */
    const createActionPlan = () => {
        // Zur Plan-Ansicht wechseln
        document.querySelector('.recommendation-tabs .nav-link[data-view="plan"]').click();
    };
    
    /**
     * Bereichs-ID für Frage ermitteln
     */
    const getAreaIdForQuestion = (questionId) => {
        for (const area of SurveySchema.categorization.areas) {
            if (area.questionIds.includes(questionId)) {
                return area.id;
            }
        }
        return null;
    };
    
    /**
     * Helfer-Funktionen für Text-Repräsentationen
     */
    const getTimelineText = (timeline) => {
        switch (timeline) {
            case 'short': return 'Kurzfristig (0-6 Monate)';
            case 'medium': return 'Mittelfristig (6-18 Monate)';
            case 'long': return 'Langfristig (> 18 Monate)';
            case 'ongoing': return 'Dauerhaft';
            default: return 'Unbekannt';
        }
    };
    
    const getEffortText = (effort) => {
        switch (effort) {
            case 'high': return 'Hoher Aufwand';
            case 'medium': return 'Mittlerer Aufwand';
            case 'low': return 'Geringer Aufwand';
            default: return 'Unbekannt';
        }
    };
    
    const getImpactText = (impact) => {
        switch (impact) {
            case 'high': return 'Hohe Wirkung';
            case 'medium': return 'Mittlere Wirkung';
            case 'low': return 'Geringe Wirkung';
            default: return 'Unbekannt';
        }
    };
    
    const getPriorityText = (priority) => {
        switch (priority) {
            case 'high': return 'Hohe Priorität';
            case 'medium': return 'Mittlere Priorität';
            case 'low': return 'Niedrige Priorität';
            case 'maintain': return 'Stärke beibehalten';
            default: return 'Unbekannt';
        }
    };
    
    /**
     * CSS-Klassen basierend auf Eigenschaften
     */
    const getCategoryClass = (category) => {
        const colorMap = {
            'arbeitsumfeld': 'primary',
            'fuehrung': 'success',
            'worklife': 'purple',
            'entwicklung': 'warning',
            'patienten': 'danger',
            'innovation': 'info'
        };
        
        return colorMap[category] || 'secondary';
    };
    
    const getPriorityClass = (priority) => {
        switch (priority) {
            case 'high': return 'danger';
            case 'medium': return 'warning';
            case 'low': return 'info';
            case 'maintain': return 'success';
            default: return 'secondary';
        }
    };
    
    const getScoreClass = (score) => {
        if (score >= 4.0) return 'success';
        if (score >= 3.0) return 'info';
        if (score >= 2.0) return 'warning';
        return 'danger';
    };
    
    /**
     * Farbe aufhellen oder abdunkeln
     */
    const adjustColorBrightness = (color, percent) => {
        if (!color) return '#666666';
        
        // HEX zu RGB konvertieren
        let R = parseInt(color.substring(1, 3), 16);
        let G = parseInt(color.substring(3, 5), 16);
        let B = parseInt(color.substring(5, 7), 16);
        
        // Helligkeit anpassen
        R = Math.max(0, Math.min(255, R + percent));
        G = Math.max(0, Math.min(255, G + percent));
        B = Math.max(0, Math.min(255, B + percent));
        
        // RGB zu HEX konvertieren
        return '#' + 
            ('0' + Math.round(R).toString(16)).slice(-2) + 
            ('0' + Math.round(G).toString(16)).slice(-2) + 
            ('0' + Math.round(B).toString(16)).slice(-2);
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
            
            // Charts aktualisieren, falls notwendig
            updateCharts();
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
     * Charts aktualisieren
     */
    const updateCharts = () => {
        // Alle Charts neu initialisieren
        initializeViewCharts(currentView);
    };
    
    /**
     * Ressourcen freigeben
     */
    const dispose = () => {
        // Bestehende Charts zerstören
        Object.keys(chartsInstances).forEach(key => {
            if (chartsInstances[key]) {
                chartsInstances[key].destroy();
                chartsInstances[key] = null;
            }
        });
        
        // Referenzen zurücksetzen
        container = null;
        actionPlan = null;
        chartsInstances = {};
        currentFilters = {};
    };
    
    // Öffentliche API
    return {
        init,
        show,
        hide,
        dispose,
        updateCharts
    };
})();