/* Notes Page JavaScript */

(function() {
    'use strict';

    // Data containers
    let logs = {};
    let rough = {};

    // State
    let searchQuery = '';

    // Initialize
    async function init() {
        await loadAllData();
        setupControls();
        renderNotes();
    }

    // Load all JSON data
    async function loadAllData() {
        const basePath = 'content/database/';
        
        const [logsRes, roughRes] = await Promise.all([
            fetch(basePath + 'notes_logs.json'),
            fetch(basePath + 'notes_rough.json')
        ]);

        logs = await logsRes.json();
        rough = await roughRes.json();
    }

    // Setup controls
    function setupControls() {
        const searchInput = document.getElementById('search-input');
        searchInput.addEventListener('input', function() {
            searchQuery = this.value.toLowerCase();
            renderNotes();
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

    // Render log entry
    function renderLogEntry(key, entry) {
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
                    <span class="log-type">Log</span>
                </div>
                <div class="log-title">${entry.name}</div>
                ${linksHtml ? `<div class="log-links">${linksHtml}</div>` : ''}
            </div>
        `;
    }

    // Render rough entry
    function renderRoughEntry(key, entry) {
        // If github_repository_link exists and is not empty, render with link containers
        if (entry.github_repository_link) {
            let linksHtml = `
                <a href="${entry.local_link}" class="rough-link" target="_blank" rel="noopener">
                    <i class="fas fa-file-pdf"></i>
                    <span>PDF</span>
                </a>
                <a href="${entry.github_repository_link}" class="rough-link" target="_blank" rel="noopener">
                    <i class="fab fa-github"></i>
                    <span>GitHub</span>
                </a>
            `;
            
            return `
                <div class="rough-card-container" data-key="${key}">
                    <div class="rough-header-static">
                        <span class="rough-type">Rough</span>
                    </div>
                    <div class="rough-title-static">${entry.name}</div>
                    <div class="rough-links">${linksHtml}</div>
                </div>
            `;
        }
        
        // Default: clickable card linking to PDF
        return `
            <a href="${entry.local_link}" class="rough-card" data-key="${key}" target="_blank" rel="noopener">
                <div class="rough-header">
                    <span class="rough-type">Rough</span>
                    <span class="rough-title">${entry.name}</span>
                    <i class="fas fa-file-pdf rough-icon"></i>
                </div>
            </a>
        `;
    }

    // Collect and sort entries
    function collectLogs() {
        const entries = [];
        
        for (const [key, entry] of Object.entries(logs)) {
            if (matchesSearch(entry, key)) {
                entries.push({ key, entry, year: extractYear(entry.date) });
            }
        }

        // Sort by year descending (most recent first)
        entries.sort((a, b) => b.year - a.year);
        
        return entries;
    }

    function collectRough() {
        const entries = [];
        
        for (const [key, entry] of Object.entries(rough)) {
            if (matchesSearch(entry, key)) {
                entries.push({ key, entry, year: extractYear(entry.date) });
            }
        }

        // Sort by year descending (most recent first)
        entries.sort((a, b) => b.year - a.year);
        
        return entries;
    }

    // Render all notes
    function renderNotes() {
        const logsContainer = document.getElementById('logs-container');
        const roughContainer = document.getElementById('rough-container');
        const separator = document.querySelector('.section-separator');

        const logEntries = collectLogs();
        const roughEntries = collectRough();

        // Render logs
        if (logEntries.length === 0) {
            logsContainer.innerHTML = '<div class="no-results">No log notes match the search.</div>';
        } else {
            let logsHtml = '';
            logEntries.forEach(({ key, entry }) => {
                logsHtml += renderLogEntry(key, entry);
            });
            logsContainer.innerHTML = logsHtml;
        }

        // Show/hide separator based on content
        if (logEntries.length === 0 && roughEntries.length === 0) {
            separator.classList.add('hidden');
        } else {
            separator.classList.remove('hidden');
        }

        // Render rough notes
        if (roughEntries.length === 0) {
            roughContainer.innerHTML = '<div class="no-results">No rough notes match the search.</div>';
        } else {
            let roughHtml = '';
            roughEntries.forEach(({ key, entry }) => {
                roughHtml += renderRoughEntry(key, entry);
            });
            roughContainer.innerHTML = roughHtml;
        }
    }

    // Start
    document.addEventListener('DOMContentLoaded', init);
})();
