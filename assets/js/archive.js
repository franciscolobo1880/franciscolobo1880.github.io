/* Archive Page JavaScript */

(function() {
    'use strict';

    // Data containers
    let logbooks = {};
    let studies = {};
    let notes = {};

    // State
    let searchQuery = '';

    // Initialize
    async function init() {
        await loadAllData();
        setupControls();
        renderArchive();
    }

    // Load all JSON data
    async function loadAllData() {
        const basePath = 'content/database/';
        
        const [logbooksRes, studiesRes, notesRes] = await Promise.all([
            fetch(basePath + 'archive_logbooks.json'),
            fetch(basePath + 'archive_studies.json'),
            fetch(basePath + 'archive_notes.json')
        ]);

        logbooks = await logbooksRes.json();
        studies = await studiesRes.json();
        notes = await notesRes.json();
    }

    // Setup controls
    function setupControls() {
        const searchInput = document.getElementById('search-input');
        searchInput.addEventListener('input', function() {
            searchQuery = this.value.toLowerCase();
            renderArchive();
        });
    }

    // Extract year from date for sorting
    function extractYear(dateStr) {
        if (!dateStr) return 0;
        const match = dateStr.match(/(\d{4})/);
        return match ? parseInt(match[1]) : 0;
    }

    // Check if entry matches search
    function matchesSearch(entry, key) {
        if (!searchQuery) return true;
        
        const searchableFields = [
            entry.name,
            key
        ];

        const searchText = searchableFields.filter(Boolean).join(' ').toLowerCase();
        return searchText.includes(searchQuery);
    }

    // Render logbook entry
    function renderLogbookEntry(key, entry) {
        let linksHtml = '';

        if (entry.local_link) {
            linksHtml += `
                <a href="${entry.local_link}" class="log-link" target="_blank" rel="noopener">
                    <i class="fas fa-file-pdf"></i>
                    <span>PDF</span>
                </a>
            `;
        }

        if (entry.github_repository_link) {
            linksHtml += `
                <a href="${entry.github_repository_link}" class="log-link" target="_blank" rel="noopener">
                    <i class="fab fa-github"></i>
                    <span>GitHub</span>
                </a>
            `;
        }

        if (entry.supplementary_worksheet_link) {
            linksHtml += `
                <a href="${entry.supplementary_worksheet_link}" class="log-link" target="_blank" rel="noopener">
                    <i class="fas fa-file-alt"></i>
                    <span>Worksheet</span>
                </a>
            `;
        }

        return `
            <div class="log-card" data-key="${key}">
                <div class="log-header">
                    <span class="log-type">Logbook</span>
                </div>
                <div class="log-title">${entry.name}</div>
                ${linksHtml ? `<div class="log-links">${linksHtml}</div>` : ''}
            </div>
        `;
    }

    // Render study entry
    function renderStudyEntry(key, entry) {
        let linksHtml = '';

        if (entry.local_link) {
            linksHtml += `
                <a href="${entry.local_link}" class="study-link" target="_blank" rel="noopener">
                    <i class="fas fa-file-pdf"></i>
                    <span>PDF</span>
                </a>
            `;
        }

        if (entry.github_repository_link) {
            linksHtml += `
                <a href="${entry.github_repository_link}" class="study-link" target="_blank" rel="noopener">
                    <i class="fab fa-github"></i>
                    <span>GitHub</span>
                </a>
            `;
        }

        return `
            <div class="study-card" data-key="${key}">
                <div class="study-header">
                    <span class="study-type">Study</span>
                </div>
                <div class="study-title">${entry.name}</div>
                ${linksHtml ? `<div class="study-links">${linksHtml}</div>` : ''}
            </div>
        `;
    }

    // Render note entry
    function renderNoteEntry(key, entry) {
        // If github_repository_link exists and is not empty, render with link containers
        if (entry.github_repository_link) {
            let linksHtml = `
                <a href="${entry.local_link}" class="note-link" target="_blank" rel="noopener">
                    <i class="fas fa-file-pdf"></i>
                    <span>PDF</span>
                </a>
                <a href="${entry.github_repository_link}" class="note-link" target="_blank" rel="noopener">
                    <i class="fab fa-github"></i>
                    <span>GitHub</span>
                </a>
            `;
            
            return `
                <div class="note-card-container" data-key="${key}">
                    <div class="note-header-static">
                        <span class="note-type">Note</span>
                    </div>
                    <div class="note-title-static">${entry.name}</div>
                    <div class="note-links">${linksHtml}</div>
                </div>
            `;
        }
        
        // Default: clickable card linking to PDF
        return `
            <a href="${entry.local_link}" class="note-card" data-key="${key}" target="_blank" rel="noopener">
                <div class="note-header">
                    <span class="note-type">Note</span>
                    <span class="note-title">${entry.name}</span>
                    <i class="fas fa-file-pdf note-icon"></i>
                </div>
            </a>
        `;
    }

    // Collect and sort entries
    function collectLogbooks() {
        const entries = [];
        
        for (const [key, entry] of Object.entries(logbooks)) {
            if (matchesSearch(entry, key)) {
                entries.push({ key, entry, year: extractYear(entry.date) });
            }
        }

        // Sort by year descending (most recent first)
        entries.sort((a, b) => b.year - a.year);
        
        return entries;
    }

    function collectStudies() {
        const entries = [];
        
        for (const [key, entry] of Object.entries(studies)) {
            if (matchesSearch(entry, key)) {
                entries.push({ key, entry, year: extractYear(entry.date) });
            }
        }

        // Sort by year descending (most recent first)
        entries.sort((a, b) => b.year - a.year);
        
        return entries;
    }

    function collectNotes() {
        const entries = [];
        
        for (const [key, entry] of Object.entries(notes)) {
            if (matchesSearch(entry, key)) {
                entries.push({ key, entry, year: extractYear(entry.date) });
            }
        }

        // Sort by year descending (most recent first)
        entries.sort((a, b) => b.year - a.year);
        
        return entries;
    }

    // Render all archive sections
    function renderArchive() {
        const archiveSection = document.querySelector('.archive-section');
        const counterElement = document.getElementById('result-counter');
        const logbooksContainer = document.getElementById('logbooks-container');
        const studiesContainer = document.getElementById('studies-container');
        const notesContainer = document.getElementById('notes-container');
        const logbooksWrapper = logbooksContainer.closest('.section-wrapper');
        const studiesWrapper = studiesContainer.closest('.section-wrapper');
        const notesWrapper = notesContainer.closest('.section-wrapper');

        const logbookEntries = collectLogbooks();
        const studyEntries = collectStudies();
        const noteEntries = collectNotes();
        const totalResults = logbookEntries.length + studyEntries.length + noteEntries.length;
        const isSearchActive = searchQuery.trim().length > 0;

        // Mirror publications counter text format.
        counterElement.innerHTML = `<span>${totalResults}</span> result${totalResults !== 1 ? 's' : ''}`;
        archiveSection.classList.toggle('search-active', isSearchActive);

        const sectionStates = [
            { wrapper: logbooksWrapper, hasResults: logbookEntries.length > 0 },
            { wrapper: studiesWrapper, hasResults: studyEntries.length > 0 },
            { wrapper: notesWrapper, hasResults: noteEntries.length > 0 }
        ];

        let hasPreviousVisibleSection = false;
        sectionStates.forEach(({ wrapper, hasResults }) => {
            wrapper.classList.toggle('has-results', hasResults);
            wrapper.classList.toggle('search-stacked', isSearchActive && hasResults && hasPreviousVisibleSection);

            if (hasResults) {
                hasPreviousVisibleSection = true;
            }
        });

        // Render logbooks
        if (logbookEntries.length === 0) {
            logbooksContainer.innerHTML = '<div class="no-results">No logbooks match the search.</div>';
        } else {
            let logbooksHtml = '';
            logbookEntries.forEach(({ key, entry }) => {
                logbooksHtml += renderLogbookEntry(key, entry);
            });
            logbooksContainer.innerHTML = logbooksHtml;
        }

        // Render studies
        if (studyEntries.length === 0) {
            studiesContainer.innerHTML = '<div class="no-results">No studies match the search.</div>';
        } else {
            let studiesHtml = '';
            studyEntries.forEach(({ key, entry }) => {
                studiesHtml += renderStudyEntry(key, entry);
            });
            studiesContainer.innerHTML = studiesHtml;
        }

        // Render notes
        if (noteEntries.length === 0) {
            notesContainer.innerHTML = '<div class="no-results">No notes match the search.</div>';
        } else {
            let notesHtml = '';
            noteEntries.forEach(({ key, entry }) => {
                notesHtml += renderNoteEntry(key, entry);
            });
            notesContainer.innerHTML = notesHtml;
        }
    }

    // Start
    document.addEventListener('DOMContentLoaded', init);
})();
