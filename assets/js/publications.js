/* Publications Page JavaScript */

(function() {
    'use strict';

    // Data containers
    let preprints = {};
    let papers = {};
    let books = {};
    let theses = {};
    let people = {};

    // State
    let activeToggles = new Set(['preprint', 'paper', 'book', 'thesis']);
    const currentYear = new Date().getFullYear();
    let yearFrom = currentYear - 2;
    let yearTo = currentYear;
    let searchQuery = '';

    // Initialize
    async function init() {
        await loadAllData();
        setupControls();
        renderEntries();
    }

    // Load all JSON data
    async function loadAllData() {
        const basePath = 'content/database/';
        
        const [
            preprintsRes,
            papersRes,
            booksRes,
            thesesRes,
            peopleRes
        ] = await Promise.all([
            fetch(basePath + 'publications_preprints.json'),
            fetch(basePath + 'publications_papers.json'),
            fetch(basePath + 'publications_books.json'),
            fetch(basePath + 'publications_theses.json'),
            fetch(basePath + 'people.json')
        ]);

        preprints = await preprintsRes.json();
        papers = await papersRes.json();
        books = await booksRes.json();
        theses = await thesesRes.json();
        people = await peopleRes.json();
    }

    // Setup controls
    function setupControls() {
        // Year inputs
        const yearFromInput = document.getElementById('year-from');
        const yearToInput = document.getElementById('year-to');
        yearFromInput.value = yearFrom;
        yearToInput.value = yearTo;

        yearFromInput.addEventListener('change', function() {
            yearFrom = parseInt(this.value) || currentYear - 2;
            renderEntries();
        });

        yearToInput.addEventListener('change', function() {
            yearTo = parseInt(this.value) || currentYear;
            renderEntries();
        });

        // Search input
        const searchInput = document.getElementById('search-input');
        searchInput.addEventListener('input', function() {
            searchQuery = this.value.toLowerCase();
            renderEntries();
        });

        // Toggle buttons
        const toggleBtns = document.querySelectorAll('.toggle-btn');
        toggleBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const type = this.dataset.type;
                if (activeToggles.has(type)) {
                    activeToggles.delete(type);
                    this.classList.remove('active');
                } else {
                    activeToggles.add(type);
                    this.classList.add('active');
                }
                renderEntries();
            });
        });
    }

    // Extract year from date string
    function extractYear(dateStr) {
        if (!dateStr) return null;
        const match = dateStr.match(/(\d{4})/);
        return match ? parseInt(match[1]) : null;
    }

    // Check if entry is within year range
    function isInYearRange(dateStr) {
        const year = extractYear(dateStr);
        if (year === null) return true;
        return year >= yearFrom && year <= yearTo;
    }

    // Check if entry matches search
    function matchesSearch(entry, key) {
        if (!searchQuery) return true;
        
        const searchableFields = [
            entry.name,
            entry.journal,
            entry.date,
            key
        ];

        // Add author names
        if (entry.authors) {
            entry.authors.forEach(authorKey => {
                if (people[authorKey]) {
                    searchableFields.push(people[authorKey].name);
                }
            });
        }

        // Add acknowledgements
        if (entry.acknowledgement && Array.isArray(entry.acknowledgement)) {
            entry.acknowledgement.forEach(ack => searchableFields.push(ack));
        }

        const searchText = searchableFields.filter(Boolean).join(' ').toLowerCase();
        return searchText.includes(searchQuery);
    }

    // Get person link
    function getPersonLink(personKey) {
        const person = people[personKey];
        if (!person) return personKey;
        
        if (person.google_scholar_link) {
            return `<a href="${person.google_scholar_link}" target="_blank" rel="noopener">${person.name}</a>`;
        }
        return person.name;
    }

    // Get link icon
    function getLinkIcon(linkType) {
        const icons = {
            'local_link': 'fas fa-file-pdf',
            'journal_link': 'fas fa-book',
            'arXiv_link': 'fas fa-archive',
            'github_repository_link': 'fab fa-github',
            'supplementary_notes_link': 'fas fa-file-alt',
            'slides_presentation_link': 'fas fa-desktop',
            'poster_presentation_link': 'fas fa-image'
        };
        return icons[linkType] || 'fas fa-link';
    }

    // Get link label
    function getLinkLabel(linkType) {
        const labels = {
            'local_link': 'PDF',
            'journal_link': 'Journal',
            'arXiv_link': 'arXiv',
            'github_repository_link': 'GitHub',
            'supplementary_notes_link': 'Notes',
            'slides_presentation_link': 'Slides',
            'poster_presentation_link': 'Poster'
        };
        return labels[linkType] || 'Link';
    }

    // Build links HTML
    function buildLinksHtml(entry, key) {
        const linkFields = [
            'local_link',
            'journal_link',
            'arXiv_link',
            'github_repository_link',
            'supplementary_notes_link',
            'slides_presentation_link',
            'poster_presentation_link'
        ];

        let html = '';
        
        linkFields.forEach(field => {
            if (entry[field]) {
                const icon = getLinkIcon(field);
                const label = getLinkLabel(field);
                html += `
                    <a href="${entry[field]}" class="pub-link" target="_blank" rel="noopener">
                        <i class="${icon}"></i>
                        <span>${label}</span>
                    </a>
                `;
            }
        });

        // Add bibtex button if available
        if (entry.bibtex) {
            html += `
                <button class="pub-link bibtex-btn" data-key="${key}">
                    <i class="fas fa-quote-right"></i>
                    <span>BibTeX</span>
                </button>
            `;
        }

        return html;
    }

    // Render publication entry
    function renderPublicationEntry(key, entry, type) {
        const authorLinks = entry.authors.map(a => getPersonLink(a)).join(', ');
        const linksHtml = buildLinksHtml(entry, key);
        
        const typeLabel = type === 'preprint' ? 'Preprint' : 
                          type === 'paper' ? 'Paper' : 
                          type === 'book' ? 'Book' : 'Thesis';

        let journalHtml = '';
        if (entry.journal) {
            journalHtml = `<div class="pub-journal">${entry.journal}</div>`;
        }

        let ackHtml = '';
        if (entry.acknowledgement && entry.acknowledgement.length > 0) {
            const ackList = Array.isArray(entry.acknowledgement) ? entry.acknowledgement : [entry.acknowledgement];
            if (ackList.filter(Boolean).length > 0) {
                ackHtml = `<div class="pub-acknowledgement">${ackList.filter(Boolean).join(', ')}</div>`;
            }
        }

        let bibtexHtml = '';
        if (entry.bibtex) {
            bibtexHtml = `
                <div class="bibtex-container" id="bibtex-${key}">
                    <pre class="bibtex-content">${entry.bibtex}</pre>
                </div>
            `;
        }

        return `
            <div class="pub-card" data-type="${type}">
                <div class="pub-header">
                    <span class="pub-type">${typeLabel}</span>
                    <span class="pub-date">${entry.date}</span>
                </div>
                <div class="pub-title">${entry.name}</div>
                <div class="pub-authors">${authorLinks}</div>
                ${journalHtml}
                ${ackHtml}
                <div class="pub-links">${linksHtml}</div>
                ${bibtexHtml}
            </div>
        `;
    }

    // Collect all entries
    function collectEntries() {
        const entries = [];

        if (activeToggles.has('preprint')) {
            for (const [key, entry] of Object.entries(preprints)) {
                if (isInYearRange(entry.date) && matchesSearch(entry, key)) {
                    entries.push({ key, entry, type: 'preprint' });
                }
            }
        }

        if (activeToggles.has('paper')) {
            for (const [key, entry] of Object.entries(papers)) {
                if (isInYearRange(entry.date) && matchesSearch(entry, key)) {
                    entries.push({ key, entry, type: 'paper' });
                }
            }
        }

        if (activeToggles.has('book')) {
            for (const [key, entry] of Object.entries(books)) {
                if (isInYearRange(entry.date) && matchesSearch(entry, key)) {
                    entries.push({ key, entry, type: 'book' });
                }
            }
        }

        if (activeToggles.has('thesis')) {
            for (const [key, entry] of Object.entries(theses)) {
                if (isInYearRange(entry.date) && matchesSearch(entry, key)) {
                    entries.push({ key, entry, type: 'thesis' });
                }
            }
        }

        // Sort by date (most recent first)
        entries.sort((a, b) => {
            const aYear = extractYear(a.entry.date) || 0;
            const bYear = extractYear(b.entry.date) || 0;
            return bYear - aYear;
        });

        return entries;
    }

    // Setup bibtex toggle handlers
    function setupBibtexHandlers() {
        document.querySelectorAll('.bibtex-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const key = this.dataset.key;
                const container = document.getElementById(`bibtex-${key}`);
                if (container) {
                    container.classList.toggle('visible');
                }
            });
        });
    }

    // Render all entries
    function renderEntries() {
        const container = document.getElementById('entries-container');
        const counterElement = document.getElementById('result-counter');
        const entries = collectEntries();

        // Update result counter
        counterElement.innerHTML = `<span>${entries.length}</span> result${entries.length !== 1 ? 's' : ''}`;

        if (entries.length === 0) {
            container.innerHTML = '<div class="no-results">No publications match the current filters.</div>';
            return;
        }

        let html = '';
        entries.forEach(({ key, entry, type }) => {
            html += renderPublicationEntry(key, entry, type);
        });

        container.innerHTML = html;
        setupBibtexHandlers();
    }

    // Start
    document.addEventListener('DOMContentLoaded', init);
})();
