/**
 * utils.js
 * Allgemeine Hilfsfunktionen für die gesamte Mitarbeiterbefragungs-Anwendung
 */

const Utils = (() => {
    // DOM-Operationen
    const dom = {
        /**
         * Element mit ID abrufen
         */
        getById: (id) => document.getElementById(id),

        /**
         * Elemente über Selektor finden
         */
        query: (selector, parent = document) => parent.querySelector(selector),
        
        /**
         * Alle passenden Elemente finden
         */
        queryAll: (selector, parent = document) => Array.from(parent.querySelectorAll(selector)),
        
        /**
         * Element erstellen mit Eigenschaften und Kindern
         */
        createElement: (tag, attributes = {}, children = []) => {
            const element = document.createElement(tag);
            
            // Attribute und Eventlistener setzen
            Object.entries(attributes).forEach(([key, value]) => {
                if (key.startsWith('on') && typeof value === 'function') {
                    element.addEventListener(key.substring(2).toLowerCase(), value);
                } else if (key === 'text') {
                    element.textContent = value;
                } else if (key === 'html') {
                    element.innerHTML = value;
                } else {
                    element.setAttribute(key, value);
                }
            });
            
            // Kind-Elemente hinzufügen
            children.forEach(child => {
                if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                } else if (child instanceof Node) {
                    element.appendChild(child);
                }
            });
            
            return element;
        },
        
        /**
         * Alle Kinder eines Elements entfernen
         */
        removeAllChildren: (element) => {
            while (element && element.firstChild) {
                element.removeChild(element.firstChild);
            }
            return element;
        },
        
        /**
         * Visibility Toggle mit Animation (milchglas)
         */
        toggleVisibility: (element, visible, options = {}) => {
            if (!element) return;
            
            const duration = options.duration || 300;
            const classToToggle = options.className || 'visible';
            
            if (visible) {
                element.style.display = options.display || 'block';
                // Animation im nächsten Frame starten
                requestAnimationFrame(() => {
                    element.classList.add(classToToggle);
                });
            } else {
                element.classList.remove(classToToggle);
                setTimeout(() => {
                    if (!element.classList.contains(classToToggle)) {
                        element.style.display = 'none';
                    }
                }, duration);
            }
        },
        
        /**
         * Smooth-Scrolling zu Element
         */
        scrollTo: (element, options = {}) => {
            if (!element) return;
            
            const offset = options.offset || 0;
            const behavior = options.behavior || 'smooth';
            
            const elementRect = element.getBoundingClientRect();
            const absoluteElementTop = elementRect.top + window.pageYOffset;
            const targetPosition = absoluteElementTop - offset;
            
            window.scrollTo({
                top: targetPosition,
                behavior: behavior
            });
        },
        
        /**
         * Content-Loader mit Animation
         */
        showLoader: (parent, message = 'Wird geladen...') => {
            const existingLoader = dom.query('.loader-container', parent);
            if (existingLoader) return existingLoader;
            
            const loaderContainer = dom.createElement('div', { class: 'loader-container' });
            const loaderElement = dom.createElement('div', { class: 'loader' });
            const messageElement = dom.createElement('p', { text: message });
            
            loaderContainer.appendChild(loaderElement);
            loaderContainer.appendChild(messageElement);
            parent.appendChild(loaderContainer);
            
            // Animation starten
            requestAnimationFrame(() => {
                loaderContainer.classList.add('visible');
            });
            
            return loaderContainer;
        },
        
        /**
         * Content-Loader entfernen
         */
        hideLoader: (parent) => {
            const loader = dom.query('.loader-container', parent);
            if (loader) {
                loader.classList.remove('visible');
                setTimeout(() => {
                    if (loader.parentNode) {
                        loader.parentNode.removeChild(loader);
                    }
                }, 300);
            }
        }
    };

    // Benachrichtigungssystem
    const notifications = {
        types: {
            SUCCESS: 'success',
            ERROR: 'error',
            WARNING: 'warning',
            INFO: 'info'
        },
        
        /**
         * Benachrichtigung anzeigen
         */
        show: (message, type = 'info', duration = 5000) => {
            // Container erstellen wenn nicht vorhanden
            let container = dom.query('.notifications-container');
            if (!container) {
                container = dom.createElement('div', { class: 'notifications-container' });
                document.body.appendChild(container);
            }
            
            // Benachrichtigung erstellen
            const notificationId = `notification-${Date.now()}`;
            const notification = dom.createElement('div', { 
                class: `notification notification-${type}`,
                id: notificationId
            }, [
                dom.createElement('div', { class: 'notification-content' }, [message]),
                dom.createElement('button', { 
                    class: 'notification-close',
                    text: '×',
                    onclick: () => notifications.hide(notificationId)
                })
            ]);
            
            container.appendChild(notification);
            
            // Animation starten
            requestAnimationFrame(() => {
                notification.classList.add('visible');
            });
            
            // Automatisch ausblenden nach Zeit
            if (duration > 0) {
                setTimeout(() => {
                    notifications.hide(notificationId);
                }, duration);
            }
            
            return notificationId;
        },
        
        /**
         * Benachrichtigung ausblenden
         */
        hide: (id) => {
            const notification = dom.getById(id);
            if (notification) {
                notification.classList.remove('visible');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        },
        
        /**
         * Erfolgs-Benachrichtigung
         */
        success: (message, duration = 5000) => {
            return notifications.show(message, notifications.types.SUCCESS, duration);
        },
        
        /**
         * Fehler-Benachrichtigung
         */
        error: (message, duration = 7000) => {
            return notifications.show(message, notifications.types.ERROR, duration);
        },
        
        /**
         * Warn-Benachrichtigung
         */
        warning: (message, duration = 6000) => {
            return notifications.show(message, notifications.types.WARNING, duration);
        },
        
        /**
         * Info-Benachrichtigung
         */
        info: (message, duration = 5000) => {
            return notifications.show(message, notifications.types.INFO, duration);
        }
    };

    // Modal-Dialog-System
    const modal = {
        /**
         * Modal öffnen/erstellen
         */
        open: (options = {}) => {
            const modalId = options.id || `modal-${Date.now()}`;
            
            // Bereits vorhandenes Modal mit gleicher ID schließen
            const existingModal = dom.getById(modalId);
            if (existingModal) {
                modal.close(modalId);
            }
            
            // Modal-Container erstellen
            const modalContainer = dom.createElement('div', { 
                class: 'modal-container',
                id: modalId
            });
            
            // Modal-Inhalt
            const modalContent = dom.createElement('div', { 
                class: `modal-content ${options.size || ''}` 
            });
            
            // Header mit Titel und Schließen-Button
            if (options.title) {
                const modalHeader = dom.createElement('div', { class: 'modal-header' }, [
                    dom.createElement('h3', { text: options.title }),
                    dom.createElement('button', { 
                        class: 'modal-close',
                        text: '×',
                        onclick: () => modal.close(modalId, options.onClose)
                    })
                ]);
                modalContent.appendChild(modalHeader);
            }
            
            // Body
            const modalBody = dom.createElement('div', { class: 'modal-body' });
            if (typeof options.content === 'string') {
                modalBody.innerHTML = options.content;
            } else if (options.content instanceof Node) {
                modalBody.appendChild(options.content);
            }
            modalContent.appendChild(modalBody);
            
            // Footer mit Buttons
            if (Array.isArray(options.buttons) && options.buttons.length > 0) {
                const modalFooter = dom.createElement('div', { class: 'modal-footer' });
                
                options.buttons.forEach(btn => {
                    const button = dom.createElement('button', {
                        class: `btn ${btn.class || ''}`,
                        text: btn.text,
                        onclick: (event) => {
                            if (typeof btn.action === 'function') {
                                const shouldClose = btn.action(event, modalId) !== false;
                                if (shouldClose || btn.closeOnClick !== false) {
                                    modal.close(modalId, options.onClose);
                                }
                            } else if (btn.closeOnClick !== false) {
                                modal.close(modalId, options.onClose);
                            }
                        }
                    });
                    modalFooter.appendChild(button);
                });
                
                modalContent.appendChild(modalFooter);
            }
            
            modalContainer.appendChild(modalContent);
            document.body.appendChild(modalContainer);
            
            // Klick außerhalb schließt Modal
            if (options.closeOnOutsideClick !== false) {
                modalContainer.addEventListener('click', (event) => {
                    if (event.target === modalContainer) {
                        modal.close(modalId, options.onClose);
                    }
                });
            }
            
            // ESC schließt Modal
            if (options.closeOnEscape !== false) {
                const escHandler = (event) => {
                    if (event.key === 'Escape') {
                        modal.close(modalId, options.onClose);
                        document.removeEventListener('keydown', escHandler);
                    }
                };
                document.addEventListener('keydown', escHandler);
            }
            
            // Animation starten
            requestAnimationFrame(() => {
                modalContainer.classList.add('visible');
            });
            
            // Modal-Öffnen-Callback
            if (typeof options.onOpen === 'function') {
                setTimeout(() => options.onOpen(modalId, modalBody), 50);
            }
            
            return { id: modalId, container: modalContainer, body: modalBody };
        },
        
        /**
         * Modal schließen
         */
        close: (modalId, callback) => {
            const modalContainer = dom.getById(modalId);
            if (modalContainer) {
                modalContainer.classList.remove('visible');
                setTimeout(() => {
                    if (modalContainer.parentNode) {
                        modalContainer.parentNode.removeChild(modalContainer);
                        
                        if (typeof callback === 'function') {
                            callback(modalId);
                        }
                    }
                }, 300);
            }
        },
        
        /**
         * Bestätigungs-Dialog
         */
        confirm: (message, onConfirm, onCancel, options = {}) => {
            return modal.open({
                title: options.title || 'Bestätigung',
                content: message,
                size: options.size || 'small',
                buttons: [
                    {
                        text: options.cancelText || 'Abbrechen',
                        class: 'btn-secondary',
                        action: () => {
                            if (typeof onCancel === 'function') onCancel();
                            return true;
                        }
                    },
                    {
                        text: options.confirmText || 'Bestätigen',
                        class: 'btn-primary',
                        action: () => {
                            if (typeof onConfirm === 'function') onConfirm();
                            return true;
                        }
                    }
                ],
                ...options
            });
        },
        
        /**
         * Alert-Dialog
         */
        alert: (message, onClose, options = {}) => {
            return modal.open({
                title: options.title || 'Hinweis',
                content: message,
                size: options.size || 'small',
                buttons: [
                    {
                        text: options.okText || 'OK',
                        class: 'btn-primary',
                        action: () => {
                            if (typeof onClose === 'function') onClose();
                            return true;
                        }
                    }
                ],
                ...options
            });
        }
    };

    // Datum und Zeit Utilities
    const date = {
        /**
         * Formatiere ISO-Datum als lesbaren deutschen String
         */
        formatDate: (dateStr) => {
            if (!dateStr) return '';
            try {
                const date = new Date(dateStr);
                return date.toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
            } catch (e) {
                console.error('Fehler beim Formatieren des Datums:', e);
                return dateStr;
            }
        },
        
        /**
         * Formatiere ISO-Datum als Zeit
         */
        formatTime: (dateStr) => {
            if (!dateStr) return '';
            try {
                const date = new Date(dateStr);
                return date.toLocaleTimeString('de-DE', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } catch (e) {
                console.error('Fehler beim Formatieren der Zeit:', e);
                return '';
            }
        },
        
        /**
         * Formatiert ISO-Datum als Datum und Zeit
         */
        formatDateTime: (dateStr) => {
            if (!dateStr) return '';
            try {
                const date = new Date(dateStr);
                return date.toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } catch (e) {
                console.error('Fehler beim Formatieren von Datum und Zeit:', e);
                return dateStr;
            }
        },
        
        /**
         * Relativer Zeitraum (vor X Tagen)
         */
        timeAgo: (dateStr) => {
            if (!dateStr) return '';
            try {
                const date = new Date(dateStr);
                const now = new Date();
                const diffMs = now - date;
                const diffSec = Math.round(diffMs / 1000);
                const diffMin = Math.round(diffSec / 60);
                const diffHour = Math.round(diffMin / 60);
                const diffDay = Math.round(diffHour / 24);
                
                if (diffSec < 60) {
                    return 'gerade eben';
                } else if (diffMin < 60) {
                    return `vor ${diffMin} ${diffMin === 1 ? 'Minute' : 'Minuten'}`;
                } else if (diffHour < 24) {
                    return `vor ${diffHour} ${diffHour === 1 ? 'Stunde' : 'Stunden'}`;
                } else if (diffDay < 7) {
                    return `vor ${diffDay} ${diffDay === 1 ? 'Tag' : 'Tagen'}`;
                } else {
                    return date.formatDate(dateStr);
                }
            } catch (e) {
                console.error('Fehler bei der Berechnung des Zeitabstands:', e);
                return dateStr;
            }
        }
    };

    // Validierungs-Utilities
    const validation = {
        /**
         * Prüfe ob String leer ist
         */
        isEmpty: (str) => {
            return !str || str.trim() === '';
        },
        
        /**
         * Prüfe ob gültige Email
         */
        isEmail: (email) => {
            const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(String(email).toLowerCase());
        },
        
        /**
         * Prüfe ob gültige URL
         */
        isUrl: (url) => {
            try {
                new URL(url);
                return true;
            } catch (e) {
                return false;
            }
        },
        
        /**
         * Prüfe ob gültige Zahl
         */
        isNumeric: (value) => {
            return !isNaN(parseFloat(value)) && isFinite(value);
        },
        
        /**
         * Prüfe ob Integer
         */
        isInteger: (value) => {
            return Number.isInteger(Number(value));
        },
        
        /**
         * Prüfe Wertebereich
         */
        isInRange: (value, min, max) => {
            const num = Number(value);
            return !isNaN(num) && num >= min && num <= max;
        }
    };

    // String-Manipulationen
    const string = {
        /**
         * Kürze String auf maximale Länge
         */
        truncate: (str, maxLength, suffix = '...') => {
            if (!str) return '';
            if (str.length <= maxLength) return str;
            return str.substring(0, maxLength - suffix.length) + suffix;
        },
        
        /**
         * Text für Suche normalisieren
         */
        normalizeForSearch: (str) => {
            if (!str) return '';
            return str
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "") // Akzente entfernen
                .replace(/[^\w\s]/g, ''); // Sonderzeichen entfernen
        },
        
        /**
         * Text HTML-sicher machen
         */
        escapeHtml: (str) => {
            if (!str) return '';
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        },
        
        /**
         * Generiert eine eindeutige ID
         */
        generateId: (prefix = '') => {
            return `${prefix}${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        }
    };

    // Farb-Utilities
    const color = {
        /**
         * Erzeugt Farbverlauf zwischen zwei Farben
         * (nützlich für Heatmaps in der Datenvisualisierung)
         */
        getGradientColor: (startColor, endColor, percent) => {
            // Parse als RGB
            const parseColor = (colorStr) => {
                if (colorStr.startsWith('#')) {
                    const hex = colorStr.substring(1);
                    return {
                        r: parseInt(hex.substring(0, 2), 16),
                        g: parseInt(hex.substring(2, 4), 16),
                        b: parseInt(hex.substring(4, 6), 16)
                    };
                }
                return { r: 0, g: 0, b: 0 };
            };
            
            // Lineare Interpolation
            const start = parseColor(startColor);
            const end = parseColor(endColor);
            
            const r = Math.round(start.r + (end.r - start.r) * percent);
            const g = Math.round(start.g + (end.g - start.g) * percent);
            const b = Math.round(start.b + (end.b - start.b) * percent);
            
            return `rgb(${r}, ${g}, ${b})`;
        },
        
        /**
         * RGB zu HEX
         */
        rgbToHex: (r, g, b) => {
            return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
        },
        
        /**
         * Erzeugt Farbskala für Datenvisualisierung
         */
        generateColorScale: (steps, startColor = '#e3000b', endColor = '#4CAF50') => {
            const colors = [];
            for (let i = 0; i < steps; i++) {
                const percent = i / (steps - 1);
                colors.push(color.getGradientColor(startColor, endColor, percent));
            }
            return colors;
        },

        /**
         * Bestimmt ob Textfarbe Weiß oder Schwarz sein soll
         * basierend auf Hintergrundfarbe
         */
        getContrastColor: (hexColor) => {
            // Konvertiere Hex zu RGB
            const r = parseInt(hexColor.substr(1, 2), 16);
            const g = parseInt(hexColor.substr(3, 2), 16);
            const b = parseInt(hexColor.substr(5, 2), 16);
            
            // Berechne Helligkeit
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            
            // Hellere Hintergründe -> schwarzer Text
            return brightness > 128 ? '#000000' : '#FFFFFF';
        }
    };

    // Daten- und Array-Manipulation
    const array = {
        /**
         * Sortiert Array nach Objekt-Eigenschaften
         */
        sortBy: (arr, key, direction = 'asc') => {
            if (!Array.isArray(arr)) return [];
            
            const sortFactor = direction.toLowerCase() === 'asc' ? 1 : -1;
            
            return [...arr].sort((a, b) => {
                if (a[key] === b[key]) return 0;
                
                // Nulls and undefined at the end
                if (a[key] === null || a[key] === undefined) return 1;
                if (b[key] === null || b[key] === undefined) return -1;
                
                // Vergleich je nach Typ
                if (typeof a[key] === 'string') {
                    return a[key].localeCompare(b[key]) * sortFactor;
                }
                return (a[key] < b[key] ? -1 : 1) * sortFactor;
            });
        },
        
        /**
         * Entfernt Duplikate aus Array
         */
        unique: (arr, key = null) => {
            if (!Array.isArray(arr)) return [];
            
            if (key) {
                const seen = new Set();
                return arr.filter(item => {
                    const value = item[key];
                    if (seen.has(value)) return false;
                    seen.add(value);
                    return true;
                });
            }
            
            return [...new Set(arr)];
        },
        
        /**
         * Gruppiert Array nach Schlüssel
         */
        groupBy: (arr, key) => {
            if (!Array.isArray(arr)) return {};
            
            return arr.reduce((result, item) => {
                const groupKey = item[key];
                if (!result[groupKey]) {
                    result[groupKey] = [];
                }
                result[groupKey].push(item);
                return result;
            }, {});
        },
        
        /**
         * Suche in Array mit Objekten
         */
        search: (arr, searchTerm, keys) => {
            if (!Array.isArray(arr) || !searchTerm) return arr;
            
            const normalizedTerm = string.normalizeForSearch(searchTerm);
            
            return arr.filter(item => {
                // Wenn keine Schlüssel angegeben, durchsuche alle Eigenschaften
                const propsToSearch = keys || Object.keys(item);
                
                return propsToSearch.some(key => {
                    const value = item[key];
                    if (value === null || value === undefined) return false;
                    
                    const normalizedValue = string.normalizeForSearch(String(value));
                    return normalizedValue.includes(normalizedTerm);
                });
            });
        }
    };

    // Tabellenoperationen
    const table = {
        /**
         * Einfaches Tabellensortieren
         */
        initSortableTable: (tableElement) => {
            if (!tableElement) return;
            
            const headers = dom.queryAll('th', tableElement);
            
            headers.forEach(header => {
                if (!header.dataset.sortable) return;
                
                header.classList.add('sortable');
                header.addEventListener('click', () => {
                    const key = header.dataset.key;
                    if (!key) return;
                    
                    // Aktuelle Sortierrichtung bestimmen und umkehren
                    const currentDirection = header.getAttribute('data-sort-direction') || 'none';
                    let newDirection = 'asc';
                    
                    if (currentDirection === 'asc') {
                        newDirection = 'desc';
                    } else if (currentDirection === 'desc') {
                        newDirection = 'asc';
                    }
                    
                    // Sortierrichtung bei allen Headers zurücksetzen
                    headers.forEach(h => {
                        h.removeAttribute('data-sort-direction');
                        h.classList.remove('sorted-asc', 'sorted-desc');
                    });
                    
                    // Neue Sortierrichtung setzen
                    header.setAttribute('data-sort-direction', newDirection);
                    header.classList.add(`sorted-${newDirection}`);
                    
                    // Zeilen sortieren
                    const tbody = tableElement.querySelector('tbody');
                    if (!tbody) return;
                    
                    const rows = Array.from(tbody.querySelectorAll('tr'));
                    
                    const sortedRows = rows.sort((rowA, rowB) => {
                        const cellA = rowA.querySelector(`td[data-key="${key}"]`);
                        const cellB = rowB.querySelector(`td[data-key="${key}"]`);
                        
                        if (!cellA || !cellB) return 0;
                        
                        const valueA = cellA.dataset.sortValue || cellA.textContent.trim();
                        const valueB = cellB.dataset.sortValue || cellB.textContent.trim();
                        
                        // Vergleichslogik
                        if (valueA === valueB) return 0;
                        
                        const sortFactor = newDirection === 'asc' ? 1 : -1;
                        
                        if (validation.isNumeric(valueA) && validation.isNumeric(valueB)) {
                            return (parseFloat(valueA) - parseFloat(valueB)) * sortFactor;
                        }
                        
                        return valueA.localeCompare(valueB) * sortFactor;
                    });
                    
                    // DOM neu aufbauen
                    dom.removeAllChildren(tbody);
                    sortedRows.forEach(row => tbody.appendChild(row));
                    
                    // Event auslösen
                    const sortEvent = new CustomEvent('table-sorted', {
                        detail: { key, direction: newDirection }
                    });
                    tableElement.dispatchEvent(sortEvent);
                });
            });
        },
        
        /**
         * Tabelle filtern
         */
        filterTable: (tableElement, filterText, options = {}) => {
            if (!tableElement || !filterText) return;
            
            const tbody = tableElement.querySelector('tbody');
            if (!tbody) return;
            
            const rows = Array.from(tbody.querySelectorAll('tr'));
            const normalizedFilter = string.normalizeForSearch(filterText);
            
            let visibleCount = 0;
            
            rows.forEach(row => {
                const cells = Array.from(row.querySelectorAll('td'));
                
                // Wenn bestimmte Spalten angegeben, nur diese durchsuchen
                const cellsToSearch = options.columns 
                    ? cells.filter(cell => options.columns.includes(cell.dataset.key))
                    : cells;
                
                const isVisible = cellsToSearch.some(cell => {
                    const value = cell.textContent.trim();
                    const normalizedValue = string.normalizeForSearch(value);
                    return normalizedValue.includes(normalizedFilter);
                });
                
                // Sichtbarkeit setzen
                row.style.display = isVisible ? '' : 'none';
                if (isVisible) visibleCount++;
            });
            
            // Event auslösen
            const filterEvent = new CustomEvent('table-filtered', {
                detail: { filterText, visibleCount, totalCount: rows.length }
            });
            tableElement.dispatchEvent(filterEvent);
            
            return visibleCount;
        },
        
        /**
         * Paginierung hinzufügen
         */
        paginate: (tableElement, rowsPerPage = 10) => {
            if (!tableElement) return;
            
            const tbody = tableElement.querySelector('tbody');
            if (!tbody) return;
            
            // Tabelle mit Attributen markieren
            tableElement.setAttribute('data-paginated', 'true');
            tableElement.setAttribute('data-rows-per-page', rowsPerPage);
            tableElement.setAttribute('data-current-page', '1');
            
            const rows = Array.from(tbody.querySelectorAll('tr'));
            const pageCount = Math.ceil(rows.length / rowsPerPage);
            
            // Paginierung-Container erstellen
            const paginationContainer = dom.createElement('div', { class: 'pagination' });
            
            // Seiten aktualisieren
            const updatePagination = () => {
                const currentPage = parseInt(tableElement.getAttribute('data-current-page'), 10);
                
                // Zeilen ein-/ausblenden
                rows.forEach((row, index) => {
                    const shouldBeVisible = Math.floor(index / rowsPerPage) + 1 === currentPage;
                    row.style.display = shouldBeVisible ? '' : 'none';
                });
                
                // Pagination-UI aktualisieren
                dom.removeAllChildren(paginationContainer);
                
                // Zurück-Button
                const prevButton = dom.createElement('button', {
                    class: 'pagination-prev',
                    text: '←',
                    disabled: currentPage <= 1
                });
                prevButton.addEventListener('click', () => {
                    if (currentPage > 1) {
                        tableElement.setAttribute('data-current-page', currentPage - 1);
                        updatePagination();
                    }
                });
                paginationContainer.appendChild(prevButton);
                
                // Seitenzahlen
                let startPage = Math.max(1, currentPage - 2);
                let endPage = Math.min(pageCount, startPage + 4);
                
                if (endPage - startPage < 4) {
                    startPage = Math.max(1, endPage - 4);
                }
                
                for (let i = startPage; i <= endPage; i++) {
                    const pageButton = dom.createElement('button', {
                        class: i === currentPage ? 'pagination-page active' : 'pagination-page',
                        text: i.toString()
                    });
                    pageButton.addEventListener('click', () => {
                        tableElement.setAttribute('data-current-page', i);
                        updatePagination();
                    });
                    paginationContainer.appendChild(pageButton);
                }
                
                // Weiter-Button
                const nextButton = dom.createElement('button', {
                    class: 'pagination-next',
                    text: '→',
                    disabled: currentPage >= pageCount
                });
                nextButton.addEventListener('click', () => {
                    if (currentPage < pageCount) {
                        tableElement.setAttribute('data-current-page', currentPage + 1);
                        updatePagination();
                    }
                });
                paginationContainer.appendChild(nextButton);
                
                // Event auslösen
                const pageEvent = new CustomEvent('page-changed', {
                    detail: { page: currentPage, pageCount }
                });
                tableElement.dispatchEvent(pageEvent);
            };
            
            // Paginierung initialisieren
            updatePagination();
            
            // Container hinzufügen
            tableElement.parentNode.insertBefore(paginationContainer, tableElement.nextSibling);
            
            return {
                update: updatePagination,
                container: paginationContainer
            };
        }
    };

    // Formular-Utilities
    const form = {
        /**
         * Formularwerte als Objekt extrahieren
         */
        getFormData: (formElement) => {
            if (!formElement || !formElement.elements) return {};
            
            const data = {};
            const elements = Array.from(formElement.elements);
            
            elements.forEach(element => {
                if (!element.name) return;
                
                const name = element.name;
                let value;
                
                if (element.type === 'radio') {
                    if (element.checked) {
                        value = element.value;
                    } else {
                        return;
                    }
                } else if (element.type === 'checkbox') {
                    value = element.checked;
                } else if (element.type === 'select-multiple') {
                    value = Array.from(element.options)
                        .filter(option => option.selected)
                        .map(option => option.value);
                } else {
                    value = element.value;
                }
                
                data[name] = value;
            });
            
            return data;
        },
        
        /**
         * Formular mit Daten füllen
         */
        setFormData: (formElement, data) => {
            if (!formElement || !formElement.elements || !data) return;
            
            const elements = Array.from(formElement.elements);
            
            elements.forEach(element => {
                if (!element.name || !(element.name in data)) return;
                
                const value = data[element.name];
                
                if (element.type === 'radio') {
                    element.checked = element.value === value;
                } else if (element.type === 'checkbox') {
                    element.checked = Boolean(value);
                } else if (element.type === 'select-multiple' && Array.isArray(value)) {
                    Array.from(element.options).forEach(option => {
                        option.selected = value.includes(option.value);
                    });
                } else {
                    element.value = value !== null && value !== undefined ? value : '';
                }
            });
        },
        
        /**
         * Formularvalidierung
         */
        validateForm: (formElement, validationRules) => {
            if (!formElement || !validationRules) return { isValid: true, errors: {} };
            
            const data = form.getFormData(formElement);
            const errors = {};
            
            // Regeln durchgehen
            Object.entries(validationRules).forEach(([fieldName, rules]) => {
                const value = data[fieldName];
                
                // Einzelne Regeln prüfen
                rules.forEach(rule => {
                    // Regel kann Funktion oder Objekt mit Typ sein
                    if (typeof rule === 'function') {
                        const error = rule(value, data);
                        if (error) {
                            if (!errors[fieldName]) errors[fieldName] = [];
                            errors[fieldName].push(error);
                        }
                    } else if (typeof rule === 'object') {
                        let error = null;
                        
                        switch (rule.type) {
                            case 'required':
                                if (validation.isEmpty(value)) {
                                    error = rule.message || 'Dieses Feld ist erforderlich.';
                                }
                                break;
                            case 'email':
                                if (!validation.isEmpty(value) && !validation.isEmail(value)) {
                                    error = rule.message || 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
                                }
                                break;
                            case 'url':
                                if (!validation.isEmpty(value) && !validation.isUrl(value)) {
                                    error = rule.message || 'Bitte geben Sie eine gültige URL ein.';
                                }
                                break;
                            case 'numeric':
                                if (!validation.isEmpty(value) && !validation.isNumeric(value)) {
                                    error = rule.message || 'Bitte geben Sie eine gültige Zahl ein.';
                                }
                                break;
                            case 'integer':
                                if (!validation.isEmpty(value) && !validation.isInteger(value)) {
                                    error = rule.message || 'Bitte geben Sie eine ganze Zahl ein.';
                                }
                                break;
                            case 'min':
                                if (!validation.isEmpty(value) && parseFloat(value) < rule.value) {
                                    error = rule.message || `Wert muss mindestens ${rule.value} sein.`;
                                }
                                break;
                            case 'max':
                                if (!validation.isEmpty(value) && parseFloat(value) > rule.value) {
                                    error = rule.message || `Wert darf höchstens ${rule.value} sein.`;
                                }
                                break;
                            case 'minLength':
                                if (!validation.isEmpty(value) && value.length < rule.value) {
                                    error = rule.message || `Eingabe muss mindestens ${rule.value} Zeichen lang sein.`;
                                }
                                break;
                            case 'maxLength':
                                if (!validation.isEmpty(value) && value.length > rule.value) {
                                    error = rule.message || `Eingabe darf höchstens ${rule.value} Zeichen lang sein.`;
                                }
                                break;
                            case 'pattern':
                                if (!validation.isEmpty(value) && !rule.value.test(value)) {
                                    error = rule.message || 'Eingabe entspricht nicht dem erforderlichen Format.';
                                }
                                break;
                            case 'custom':
                                if (typeof rule.validate === 'function') {
                                    const customError = rule.validate(value, data);
                                    if (customError) {
                                        error = typeof customError === 'string' ? customError : rule.message || 'Ungültige Eingabe.';
                                    }
                                }
                                break;
                        }
                        
                        if (error) {
                            if (!errors[fieldName]) errors[fieldName] = [];
                            errors[fieldName].push(error);
                        }
                    }
                });
            });
            
            return {
                isValid: Object.keys(errors).length === 0,
                errors
            };
        },
        
        /**
         * Zeige Validierungsfehler an
         */
        showValidationErrors: (formElement, errors) => {
            if (!formElement || !errors) return;
            
            // Vorherige Fehler entfernen
            dom.queryAll('.validation-error', formElement).forEach(el => el.remove());
            dom.queryAll('.has-error', formElement).forEach(el => el.classList.remove('has-error'));
            
            // Neue Fehler anzeigen
            Object.entries(errors).forEach(([fieldName, fieldErrors]) => {
                const field = formElement.elements[fieldName];
                if (!field) return;
                
                // Feld als fehlerhaft markieren
                const formGroup = field.closest('.form-group') || field.parentNode;
                formGroup.classList.add('has-error');
                
                // Fehlermeldung anzeigen
                const errorContainer = dom.createElement('div', { class: 'validation-error' });
                fieldErrors.forEach(error => {
                    errorContainer.appendChild(dom.createElement('p', { text: error }));
                });
                
                formGroup.appendChild(errorContainer);
            });
        }
    };

    // LocalStorage Wrapper
    const storage = {
        /**
         * Wert im LocalStorage speichern
         */
        set: (key, value) => {
            try {
                const serializedValue = JSON.stringify(value);
                localStorage.setItem(key, serializedValue);
                return true;
            } catch (e) {
                console.error('Fehler beim Speichern im LocalStorage:', e);
                return false;
            }
        },
        
        /**
         * Wert aus LocalStorage lesen
         */
        get: (key, defaultValue = null) => {
            try {
                const serializedValue = localStorage.getItem(key);
                if (serializedValue === null) return defaultValue;
                return JSON.parse(serializedValue);
            } catch (e) {
                console.error('Fehler beim Lesen aus dem LocalStorage:', e);
                return defaultValue;
            }
        },
        
        /**
         * Wert aus LocalStorage entfernen
         */
        remove: (key) => {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                console.error('Fehler beim Entfernen aus dem LocalStorage:', e);
                return false;
            }
        },
        
        /**
         * Prüfen ob Wert im LocalStorage existiert
         */
        has: (key) => {
            return localStorage.getItem(key) !== null;
        },
        
        /**
         * LocalStorage leeren
         */
        clear: () => {
            try {
                localStorage.clear();
                return true;
            } catch (e) {
                console.error('Fehler beim Leeren des LocalStorage:', e);
                return false;
            }
        }
    };

    // Datei-Download-Utilities
    const file = {
        /**
         * JSON als Datei exportieren
         */
        downloadJSON: (data, filename = 'export.json') => {
            try {
                const jsonString = JSON.stringify(data, null, 2);
                const blob = new Blob([jsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.setAttribute('href', url);
                a.setAttribute('download', filename);
                a.style.display = 'none';
                
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                
                setTimeout(() => {
                    URL.revokeObjectURL(url);
                }, 100);
                
                return true;
            } catch (e) {
                console.error('Fehler beim Download der JSON-Datei:', e);
                return false;
            }
        },
        
        /**
         * CSV als Datei exportieren
         */
        downloadCSV: (data, filename = 'export.csv') => {
            try {
                // BOM für UTF-8
                const BOM = '\uFEFF';
                let csvContent = BOM;
                
                if (Array.isArray(data) && data.length > 0) {
                    // Spaltenüberschriften
                    if (typeof data[0] === 'object') {
                        csvContent += Object.keys(data[0]).join(',') + '\n';
                    }
                    
                    // Zeilen
                    data.forEach(row => {
                        if (typeof row === 'object') {
                            const values = Object.values(row).map(value => {
                                // Werte in Anführungszeichen setzen, wenn nötig
                                let stringValue = value !== null && value !== undefined ? String(value) : '';
                                if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                                    stringValue = '"' + stringValue.replace(/"/g, '""') + '"';
                                }
                                return stringValue;
                            });
                            csvContent += values.join(',') + '\n';
                        } else {
                            csvContent += row + '\n';
                        }
                    });
                }
                
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.setAttribute('href', url);
                a.setAttribute('download', filename);
                a.style.display = 'none';
                
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                
                setTimeout(() => {
                    URL.revokeObjectURL(url);
                }, 100);
                
                return true;
            } catch (e) {
                console.error('Fehler beim Download der CSV-Datei:', e);
                return false;
            }
        },
        
        /**
         * Text als Datei exportieren
         */
        downloadText: (text, filename = 'export.txt') => {
            try {
                const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.setAttribute('href', url);
                a.setAttribute('download', filename);
                a.style.display = 'none';
                
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                
                setTimeout(() => {
                    URL.revokeObjectURL(url);
                }, 100);
                
                return true;
            } catch (e) {
                console.error('Fehler beim Download der Text-Datei:', e);
                return false;
            }
        },
        
        /**
         * Datei-Upload-Dialog öffnen
         */
        openFileUploadDialog: (options = {}) => {
            return new Promise((resolve, reject) => {
                const input = document.createElement('input');
                input.type = 'file';
                
                if (options.accept) {
                    input.accept = options.accept;
                }
                
                if (options.multiple) {
                    input.multiple = true;
                }
                
                input.addEventListener('change', (event) => {
                    const files = Array.from(event.target.files);
                    resolve(files);
                });
                
                input.addEventListener('cancel', () => {
                    resolve([]);
                });
                
                input.click();
            });
        },
        
        /**
         * Datei als Text lesen
         */
        readAsText: (file) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                
                reader.onload = (event) => {
                    resolve(event.target.result);
                };
                
                reader.onerror = (error) => {
                    reject(error);
                };
                
                reader.readAsText(file);
            });
        },
        
        /**
         * Datei als JSON lesen
         */
        readAsJSON: async (file) => {
            try {
                const text = await file.readAsText(file);
                return JSON.parse(text);
            } catch (e) {
                console.error('Fehler beim Lesen der JSON-Datei:', e);
                throw e;
            }
        }
    };

    // Debug-Utilities
    const debug = {
        /**
         * Zeitmessung für Performance-Optimierung
         */
        measureTime: (callback, label = 'Operation') => {
            const start = performance.now();
            const result = callback();
            const end = performance.now();
            
            console.log(`${label}: ${end - start}ms`);
            return result;
        },
        
        /**
         * Log mit besserem Formatting
         */
        log: (message, data = null) => {
            if (data) {
                console.log(`%c${message}`, 'font-weight: bold; color: #3498db;', data);
            } else {
                console.log(`%c${message}`, 'font-weight: bold; color: #3498db;');
            }
        },
        
        /**
         * Erweiterte Fehlerprotokollierung
         */
        error: (message, error = null) => {
            if (error) {
                console.error(`%c${message}`, 'font-weight: bold; color: #e74c3c;', error);
            } else {
                console.error(`%c${message}`, 'font-weight: bold; color: #e74c3c;');
            }
        }
    };

    // Browser-Features erkennen
    const browser = {
        /**
         * LocalStorage verfügbar?
         */
        hasLocalStorage: () => {
            try {
                const test = 'test';
                localStorage.setItem(test, test);
                localStorage.removeItem(test);
                return true;
            } catch (e) {
                return false;
            }
        },
        
        /**
         * Touchscreen?
         */
        isTouchDevice: () => {
            return 'ontouchstart' in window || 
                   navigator.maxTouchPoints > 0 || 
                   navigator.msMaxTouchPoints > 0;
        },
        
        /**
         * Browsername und Version
         */
        getBrowserInfo: () => {
            const userAgent = navigator.userAgent;
            let name = 'Unbekannt';
            let version = 'Unbekannt';
            
            if (userAgent.indexOf('Firefox') !== -1) {
                name = 'Firefox';
                version = userAgent.match(/Firefox\/([\d.]+)/)[1];
            } else if (userAgent.indexOf('Edge') !== -1) {
                name = 'Edge';
                version = userAgent.match(/Edge\/([\d.]+)/)[1];
            } else if (userAgent.indexOf('Chrome') !== -1) {
                name = 'Chrome';
                version = userAgent.match(/Chrome\/([\d.]+)/)[1];
            } else if (userAgent.indexOf('Safari') !== -1) {
                name = 'Safari';
                version = userAgent.match(/Version\/([\d.]+)/)[1];
            } else if (userAgent.indexOf('MSIE') !== -1 || userAgent.indexOf('Trident/') !== -1) {
                name = 'Internet Explorer';
                version = userAgent.match(/(?:MSIE |rv:)(\d+(\.\d+)?)/)[1];
            }
            
            return { name, version };
        },
        
        /**
         * Bildschirmgröße
         */
        getScreenSize: () => {
            return {
                width: window.innerWidth,
                height: window.innerHeight,
                devicePixelRatio: window.devicePixelRatio || 1
            };
        }
    };

    // Event-Management
    const eventBus = {
        events: {},
        
        /**
         * Event-Listener registrieren
         */
        on: (eventName, callback) => {
            if (!eventBus.events[eventName]) {
                eventBus.events[eventName] = [];
            }
            eventBus.events[eventName].push(callback);
        },
        
        /**
         * Event-Listener entfernen
         */
        off: (eventName, callback) => {
            if (!eventBus.events[eventName]) return;
            
            if (!callback) {
                // Alle Listener für dieses Event entfernen
                delete eventBus.events[eventName];
            } else {
                // Nur den spezifischen Callback entfernen
                eventBus.events[eventName] = eventBus.events[eventName].filter(
                    cb => cb !== callback
                );
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
                } catch (e) {
                    console.error(`Fehler bei Event-Handler für ${eventName}:`, e);
                }
            });
        },
        
        /**
         * Einmal-Event-Listener
         */
        once: (eventName, callback) => {
            const onceWrapper = (data) => {
                callback(data);
                eventBus.off(eventName, onceWrapper);
            };
            
            eventBus.on(eventName, onceWrapper);
        }
    };

    // Öffentliche API
    return {
        dom,
        notifications,
        modal,
        date,
        validation,
        string,
        color,
        array,
        table,
        form,
        storage,
        file,
        debug,
        browser,
        eventBus
    };
})();

// Export für ES6 Module und CommonJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
} else if (typeof define === 'function' && define.amd) {
    define([], function() { return Utils; });
} else {
    window.Utils = Utils;
}