/**
 * survey-schema.js
 * Definiert die Struktur des Fragebogens, Validierungsregeln und Hilfsfunktionen 
 * für die Mitarbeiterbefragung der Klinik für Radiologie und Nuklearmedizin
 */

const SurveySchema = (() => {
    // Fragebogenbereiche mit entsprechenden Fragen
    const sections = [
        {
            id: "arbeitsumfeld",
            title: "I. Arbeitsumfeld und Ressourcen",
            description: "1 = Stimme gar nicht zu | 2 = Stimme eher nicht zu | 3 = Teils/teils | 4 = Stimme eher zu | 5 = Stimme voll zu",
            questions: [
                { id: "q1", text: "Meine technische Ausstattung (z. B. Computer, Arbeitsplatz) ermöglicht mir effizientes Arbeiten.", type: "likert" },
                { id: "q2", text: "Unsere medizinischen Geräte (z. B. MRT, CT) sind auf dem neuesten technologischen Stand.", type: "likert" },
                { id: "q3", text: "Die Arbeitsprozesse in unserer Abteilung sind klar und effizient organisiert.", type: "likert" },
                { id: "q4", text: "Die Personalstärke ist ausreichend, um die täglichen Aufgaben gut zu bewältigen.", type: "likert" },
                { id: "q5", text: "Die Arbeitslast ist fair auf alle Kolleginnen und Kollegen verteilt.", type: "likert" },
                { id: "q6", text: "Die IT-Systeme (z.B. SAP, PACS) unterstützen meine Arbeit zuverlässig und effektiv.", type: "likert" }
            ]
        },
        {
            id: "zusammenarbeit",
            title: "II. Zusammenarbeit und Führung",
            description: "1 = Stimme gar nicht zu | 2 = Stimme eher nicht zu | 3 = Teils/teils | 4 = Stimme eher zu | 5 = Stimme voll zu",
            questions: [
                { id: "q7", text: "Bei Fragen oder Problemen kann ich meine Führungskräfte schnell und unkompliziert erreichen.", type: "likert" },
                { id: "q8", text: "Ich erhalte regelmäßig hilfreiches Feedback zu meiner Arbeitsleistung.", type: "likert" },
                { id: "q9", text: "Die Zusammenarbeit im Team ist konstruktiv und wertschätzend.", type: "likert" },
                { id: "q10", text: "Ärzte und MTRs kommunizieren respektvoll und zielorientiert miteinander.", type: "likert" },
                { id: "q11", text: "Entscheidungen der Führungsebene sind für mich transparent und nachvollziehbar.", type: "likert" },
                { id: "q12", text: "Meine Vorschläge zur Verbesserung werden ernst genommen und geprüft.", type: "likert" }
            ]
        },
        {
            id: "arbeitsbelastung",
            title: "III. Arbeitsbelastung und Balance",
            description: "1 = Stimme gar nicht zu | 2 = Stimme eher nicht zu | 3 = Teils/teils | 4 = Stimme eher zu | 5 = Stimme voll zu",
            questions: [
                { id: "q13", text: "Meine Arbeitsbelastung ist in der Regel gut zu bewältigen.", type: "likert" },
                { id: "q14", text: "Der Dienstplan berücksichtigt meine persönlichen Wünsche nach Möglichkeit.", type: "likert" },
                { id: "q15", text: "Ich kann meine Pausen regelmäßig und ohne Zeitdruck nehmen.", type: "likert" },
                { id: "q16", text: "Überstunden werden fair durch Freizeit oder finanzielle Kompensation ausgeglichen.", type: "likert" },
                { id: "q17", text: "Beruf und Privatleben lassen sich in unserer Abteilung gut vereinbaren.", type: "likert" },
                { id: "q18", text: "Es gibt wirksame Maßnahmen, um die Belastung durch Personalmangel zu reduzieren.", type: "likert" }
            ]
        },
        {
            id: "entwicklung",
            title: "IV. Entwicklung und Anerkennung",
            description: "1 = Stimme gar nicht zu | 2 = Stimme eher nicht zu | 3 = Teils/teils | 4 = Stimme eher zu | 5 = Stimme voll zu",
            questions: [
                { id: "q19", text: "Ich habe Zugang zu Fortbildungen, die meine fachliche Weiterentwicklung fördern.", type: "likert" },
                { id: "q20", text: "Meine berufliche Entwicklung wird aktiv unterstützt (z. B. durch interne Förderprogramme).", type: "likert" },
                { id: "q21", text: "Meine Arbeit wird von Kollegen und Vorgesetzten wertgeschätzt.", type: "likert" },
                { id: "q22", text: "Ich fühle mich als geschätztes und vollwertiges Mitglied unseres Teams.", type: "likert" },
                { id: "q23", text: "Meine Vergütung entspricht meiner Qualifikation und Verantwortung.", type: "likert" }
            ]
        },
        {
            id: "patienten",
            title: "V. Patientenorientierung und Qualität",
            description: "1 = Stimme gar nicht zu | 2 = Stimme eher nicht zu | 3 = Teils/teils | 4 = Stimme eher zu | 5 = Stimme voll zu",
            questions: [
                { id: "q24", text: "Die hohe Qualität der Patientenversorgung hat bei uns oberste Priorität.", type: "likert" },
                { id: "q25", text: "Ich habe ausreichend Zeit, um Patienten individuell und sorgfältig zu betreuen.", type: "likert" },
                { id: "q26", text: "Unsere Arbeitsabläufe gewährleisten eine hohe Sicherheit für unsere Patienten.", type: "likert" },
                { id: "q27", text: "Fehler werden offen angesprochen und als Chance zur Verbesserung genutzt.", type: "likert" },
                { id: "q28", text: "Die Zusammenarbeit mit anderen Abteilungen ist effektiv und unterstützend.", type: "likert" }
            ]
        },
        {
            id: "innovation",
            title: "VI. Innovation und Perspektiven",
            description: "1 = Stimme gar nicht zu | 2 = Stimme eher nicht zu | 3 = Teils/teils | 4 = Stimme eher zu | 5 = Stimme voll zu",
            questions: [
                { id: "q29", text: "Unsere Abteilung ist gut auf zukünftige Entwicklungen im Gesundheitswesen vorbereitet.", type: "likert" },
                { id: "q30", text: "Neue Technologien (z. B. KI, moderne Geräte) werden sinnvoll und zum Nutzen der Patienten eingeführt.", type: "likert" },
                { id: "q31", text: "Ich sehe meine berufliche Zukunft in dieser Abteilung langfristig positiv.", type: "likert" },
                { id: "q32", text: "Die Digitalisierung unterstützt und erleichtert meine tägliche Arbeit spürbar.", type: "likert" }
            ]
        },
        {
            id: "gesamteindruck",
            title: "VII. Gesamteindruck",
            description: "1 = Stimme gar nicht zu | 2 = Stimme eher nicht zu | 3 = Teils/teils | 4 = Stimme eher zu | 5 = Stimme voll zu",
            questions: [
                { id: "q33", text: "Insgesamt bin ich mit meiner Arbeit in der Abteilung zufrieden.", type: "likert" },
                { id: "q34", text: "Ich würde unsere Abteilung als attraktiven Arbeitgeber weiterempfehlen.", type: "likert" }
            ]
        },
        {
            id: "offeneFragen",
            title: "VIII. Ihre Stimme – Offene Fragen",
            description: "",
            questions: [
                { id: "q35", text: "Was schätzen Sie an Ihrer Arbeit in unserer Abteilung besonders? (Nennen Sie bis zu 3 Punkte)", type: "text" },
                { id: "q36", text: "Welche Bereiche sehen Sie als dringend verbesserungsbedürftig an? (Nennen Sie bis zu 3 Punkte)", type: "text" },
                { id: "q37", text: "Haben Sie konkrete Ideen zur Bewältigung des aktuellen Personalmangels?", type: "text" },
                { id: "q38", text: "Haben Sie weitere Anmerkungen, Wünsche oder Anregungen?", type: "text" }
            ]
        }
    ];

    // Demografische Daten (optional)
    const demographicOptions = {
        profession: [
            { id: "arzt", label: "Ärztlicher Dienst" },
            { id: "mtr", label: "MTR" },
            { id: "anmeldung", label: "Anmeldung/Sekretariat" }
        ],
        experience: [
            { id: "lt2", label: "Weniger als 2 Jahre" },
            { id: "2to5", label: "2–5 Jahre" },
            { id: "6to10", label: "6–10 Jahre" },
            { id: "gt10", label: "Über 10 Jahre" }
        ],
        tenure: [
            { id: "lt1", label: "Weniger als 1 Jahr" },
            { id: "1to3", label: "1–3 Jahre" },
            { id: "4to10", label: "4–10 Jahre" },
            { id: "gt10", label: "Über 10 Jahre" }
        ]
    };

    // Kategorisierung für Analysen und Empfehlungen
    const categorization = {
        areas: [
            {
                id: "technical",
                title: "Technische Ausstattung",
                questions: ["q1", "q2", "q6"]
            },
            {
                id: "processes",
                title: "Arbeitsorganisation",
                questions: ["q3", "q4", "q5"]
            },
            {
                id: "leadership",
                title: "Führung",
                questions: ["q7", "q8", "q11", "q12"]
            },
            {
                id: "teamwork",
                title: "Teamarbeit",
                questions: ["q9", "q10", "q21", "q22", "q28"]
            },
            {
                id: "workload",
                title: "Arbeitsbelastung",
                questions: ["q13", "q15", "q18"]
            },
            {
                id: "worklifebalance",
                title: "Work-Life-Balance",
                questions: ["q14", "q16", "q17"]
            },
            {
                id: "development",
                title: "Entwicklung",
                questions: ["q19", "q20"]
            },
            {
                id: "compensation",
                title: "Vergütung",
                questions: ["q23"]
            },
            {
                id: "patientcare",
                title: "Patientenversorgung",
                questions: ["q24", "q25", "q26"]
            },
            {
                id: "qualityculture",
                title: "Qualitätskultur",
                questions: ["q27"]
            },
            {
                id: "future",
                title: "Zukunftsperspektiven",
                questions: ["q29", "q30", "q31"]
            },
            {
                id: "digitalization",
                title: "Digitalisierung",
                questions: ["q32"]
            },
            {
                id: "overall",
                title: "Gesamtzufriedenheit",
                questions: ["q33", "q34"]
            }
        ],
        // Kritische Schwellenwerte für Handlungsempfehlungen
        thresholds: {
            critical: 2.5,
            warning: 3.2,
            good: 3.8,
            excellent: 4.5
        }
    };

    // Leerer Fragebogen als Template
    const emptyTemplate = () => {
        const template = {
            id: `survey_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            timestamp: new Date().toISOString(),
            profession: '',
            experience: '',
            tenure: ''
        };
        
        // Alle Fragen mit Standardwerten befüllen
        for (const section of sections) {
            for (const question of section.questions) {
                template[question.id] = question.type === 'likert' ? null : '';
            }
        }
        
        return template;
    };

    // Validierungsfunktionen
    const validators = {
        // Prüft ob ein Likert-Wert gültig ist
        isValidLikertValue: (value) => {
            if (value === null || value === '') return true; // Leere Werte erlauben
            const numValue = parseInt(value, 10);
            return !isNaN(numValue) && numValue >= 1 && numValue <= 5;
        },
        
        // Prüft ob ein Datensatz das korrekte Format hat
        isValidSurveyData: (data) => {
            if (!data || typeof data !== 'object') return false;
            if (!data.id || !data.timestamp) return false;
            
            // Prüfe alle Likert-Fragen
            for (const section of sections) {
                for (const question of section.questions) {
                    if (question.type === 'likert' && data[question.id] !== null) {
                        if (!validators.isValidLikertValue(data[question.id])) {
                            return false;
                        }
                    }
                }
            }
            
            return true;
        },
        
        // Prüft wie vollständig ein Fragebogen ausgefüllt ist
        getSurveyCompleteness: (data) => {
            if (!data) return 0;
            
            let answeredQuestions = 0;
            let totalQuestions = 0;
            
            for (const section of sections) {
                for (const question of section.questions) {
                    totalQuestions++;
                    if (data[question.id] !== null && data[question.id] !== '') {
                        answeredQuestions++;
                    }
                }
            }
            
            return answeredQuestions / totalQuestions;
        }
    };

    // CSV-Konvertierung
    const csvHelpers = {
        // Generiere CSV-Header
        getCSVHeader: () => {
            let header = ['id', 'timestamp'];
            sections.forEach(section => {
                section.questions.forEach(question => {
                    header.push(question.id);
                });
            });
            header = [...header, 'profession', 'experience', 'tenure'];
            return header;
        },
        
        // CSV-Zeile zu Objekt konvertieren
        csvRowToObject: (row, header) => {
            if (!row || !header || header.length === 0) return null;
            
            const obj = {};
            header.forEach((key, index) => {
                if (row[index] !== undefined) {
                    if (key.startsWith('q') && !isNaN(parseInt(key.substring(1)))) {
                        // Konvertiere Zahlen für Likert-Skala
                        const isLikert = sections.some(section => 
                            section.questions.some(q => q.id === key && q.type === 'likert')
                        );
                        
                        if (isLikert && row[index] !== '') {
                            const numVal = parseInt(row[index], 10);
                            obj[key] = isNaN(numVal) ? null : numVal;
                        } else {
                            obj[key] = row[index];
                        }
                    } else {
                        obj[key] = row[index];
                    }
                }
            });
            
            return obj;
        },
        
        // Objekt zu CSV-Zeile konvertieren
        objectToCSVRow: (obj, header) => {
            if (!obj || !header) return [];
            
            return header.map(key => {
                if (obj[key] === null || obj[key] === undefined) {
                    return '';
                }
                return obj[key];
            });
        }
    };

    // Hilfsfunktionen für statistische Analysen
    const statistics = {
        // Berechnet den Durchschnitt für eine Frage über alle Datensätze
        calculateAverage: (data, questionId) => {
            if (!data || !Array.isArray(data) || data.length === 0) return 0;
            
            const validValues = data
                .map(entry => entry[questionId])
                .filter(val => val !== null && val !== undefined && val !== '');
                
            if (validValues.length === 0) return 0;
            
            const sum = validValues.reduce((acc, val) => {
                const numVal = parseFloat(val);
                return acc + (isNaN(numVal) ? 0 : numVal);
            }, 0);
            
            return sum / validValues.length;
        },
        
        // Berechnet den Durchschnitt für einen Bereich
        calculateAreaAverage: (data, areaId) => {
            const area = categorization.areas.find(a => a.id === areaId);
            if (!area || !data || !Array.isArray(data) || data.length === 0) return 0;
            
            const questionAverages = area.questions.map(qId => 
                statistics.calculateAverage(data, qId)
            );
            
            if (questionAverages.length === 0) return 0;
            
            const sum = questionAverages.reduce((acc, val) => acc + val, 0);
            return sum / questionAverages.length;
        },
        
        // Identifiziert Stärken und Schwächen basierend auf den Durchschnittswerten
        identifyStrengthsAndWeaknesses: (data) => {
            if (!data || !Array.isArray(data) || data.length === 0) 
                return { strengths: [], weaknesses: [] };
            
            const areaAverages = categorization.areas.map(area => ({
                id: area.id,
                title: area.title,
                average: statistics.calculateAreaAverage(data, area.id)
            }));
            
            // Nach Durchschnitt sortieren
            const sortedAreas = [...areaAverages].sort((a, b) => b.average - a.average);
            
            return {
                strengths: sortedAreas.slice(0, 3),
                weaknesses: sortedAreas.slice(-3).reverse()
            };
        },
        
        // Berechnet die Standardabweichung für eine Frage
        calculateStandardDeviation: (data, questionId) => {
            if (!data || !Array.isArray(data) || data.length === 0) return 0;
            
            const validValues = data
                .map(entry => entry[questionId])
                .filter(val => val !== null && val !== undefined && val !== '');
                
            if (validValues.length === 0) return 0;
            
            const avg = statistics.calculateAverage(data, questionId);
            const squaredDiffs = validValues.map(val => {
                const numVal = parseFloat(val);
                return isNaN(numVal) ? 0 : Math.pow(numVal - avg, 2);
            });
            
            const sum = squaredDiffs.reduce((acc, val) => acc + val, 0);
            return Math.sqrt(sum / validValues.length);
        },
        
        // Berechnet den Median für eine Frage
        calculateMedian: (data, questionId) => {
            if (!data || !Array.isArray(data) || data.length === 0) return 0;
            
            const validValues = data
                .map(entry => entry[questionId])
                .filter(val => val !== null && val !== undefined && val !== '')
                .map(val => parseFloat(val))
                .filter(val => !isNaN(val))
                .sort((a, b) => a - b);
                
            if (validValues.length === 0) return 0;
            
            const mid = Math.floor(validValues.length / 2);
            
            if (validValues.length % 2 === 0) {
                return (validValues[mid - 1] + validValues[mid]) / 2;
            } else {
                return validValues[mid];
            }
        }
    };

    // Datenfilter für verschiedene Analysen
    const filters = {
        // Filtert Daten nach demografischen Merkmalen
        filterByDemographic: (data, field, value) => {
            if (!data || !Array.isArray(data) || data.length === 0) return [];
            if (!field || !value) return data;
            
            return data.filter(entry => entry[field] === value);
        },
        
        // Filtert Daten nach mehreren Kriterien
        applyMultipleFilters: (data, filterCriteria) => {
            if (!data || !Array.isArray(data) || data.length === 0) return [];
            if (!filterCriteria || Object.keys(filterCriteria).length === 0) return data;
            
            return data.filter(entry => {
                for (const [field, value] of Object.entries(filterCriteria)) {
                    if (value && entry[field] !== value) {
                        return false;
                    }
                }
                return true;
            });
        }
    };

    // Öffentliche API
    return {
        sections,
        demographicOptions,
        categorization,
        emptyTemplate,
        validators,
        csvHelpers,
        statistics,
        filters,
        
        // Hilfsfunktionen für die Benutzeroberfläche
        ui: {
            // Gibt alle Fragen als flache Liste zurück
            getAllQuestions: () => {
                return sections.flatMap(section => 
                    section.questions.map(question => ({
                        ...question,
                        sectionId: section.id,
                        sectionTitle: section.title
                    }))
                );
            },
            
            // Findet eine Frage anhand ihrer ID
            getQuestionById: (questionId) => {
                for (const section of sections) {
                    const question = section.questions.find(q => q.id === questionId);
                    if (question) {
                        return {
                            ...question,
                            sectionId: section.id,
                            sectionTitle: section.title
                        };
                    }
                }
                return null;
            },
            
            // Liefert Kategoriefarbe basierend auf dem Durchschnittswert
            getCategoryColorClass: (average) => {
                if (average <= categorization.thresholds.critical) return 'category-critical';
                if (average <= categorization.thresholds.warning) return 'category-warning';
                if (average <= categorization.thresholds.good) return 'category-good';
                return 'category-excellent';
            }
        }
    };
})();

// Export für ES6 Module und CommonJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SurveySchema;
} else if (typeof define === 'function' && define.amd) {
    define([], function() { return SurveySchema; });
} else {
    window.SurveySchema = SurveySchema;
}