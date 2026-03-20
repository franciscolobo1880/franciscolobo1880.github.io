/* Archive Page JavaScript */

(function() {
    'use strict';

    // Data containers
    let logbooks = {};
    let studies = {};
    let notes = {};

    // State
    let activeToggles = new Set(['logbook', 'study']);
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
            renderEntries();
        });

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

    // Check if entry matches search
    function matchesSearch(entry, key) {
        if (!searchQuery) return true;

        const searchableFields = [
            entry.name,
            entry.date,
            entry.archive_type,
            key
        ];

        const searchText = searchableFields.filter(Boolean).join(' ').toLowerCase();
        return searchText.includes(searchQuery);
    }

    // Get link icon
    function getLinkIcon(linkType) {
        const icons = {
            local_link: 'fas fa-file-pdf',
            github_repository_link: 'fab fa-github',
            supplementary_worksheet_link: 'fas fa-file-alt'
        };

        return icons[linkType] || 'fas fa-link';
    }

    // Get link label
    function getLinkLabel(linkType) {
        const labels = {
            local_link: 'PDF',
            github_repository_link: 'GitHub',
            supplementary_worksheet_link: 'Worksheet'
        };

        return labels[linkType] || 'Link';
    }

    // Collect all non-empty links in display order.
    function getEntryLinks(entry) {
        const linkFields = [
            'local_link',
            'supplementary_worksheet_link',
            'github_repository_link'
        ];

        const links = [];

        linkFields.forEach(field => {
            const value = entry[field];
            if (typeof value === 'string' && value.trim()) {
                links.push({
                    url: value,
                    icon: getLinkIcon(field),
                    label: getLinkLabel(field)
                });
            }
        });

        return links;
    }

    // Build links HTML
    function buildLinksHtml(links) {
        let html = '';

        links.forEach(link => {
            html += `
                <a href="${link.url}" class="archive-link" target="_blank" rel="noopener">
                    <i class="${link.icon}"></i>
                    <span>${link.label}</span>
                </a>
            `;
        });

        return html;
    }

    // Render archive entry
    function renderArchiveEntry(key, entry, type) {
        const links = getEntryLinks(entry);
        const isSingleLink = links.length === 1;
        const linksHtml = isSingleLink ? '' : buildLinksHtml(links);
        const typeLabel = type === 'logbook' ? 'Logbook' : type === 'study' ? 'Study' : 'Note';

        if (isSingleLink) {
            return `
                <a href="${links[0].url}" class="archive-card archive-card-clickable archive-card-single-link" data-type="${type}" data-key="${key}" target="_blank" rel="noopener">
                    <div class="archive-header">
                        <span class="archive-type">${typeLabel}</span>
                        <span class="archive-date">${entry.date || ''}</span>
                    </div>
                    <div class="archive-title">${entry.name}</div>
                </a>
            `;
        }

        return `
            <div class="archive-card" data-type="${type}" data-key="${key}">
                <div class="archive-header">
                    <span class="archive-type">${typeLabel}</span>
                    <span class="archive-date">${entry.date || ''}</span>
                </div>
                <div class="archive-title">${entry.name}</div>
                ${linksHtml ? `<div class="archive-links">${linksHtml}</div>` : ''}
            </div>
        `;
    }

    // Collect all entries
    function collectEntries() {
        const entries = [];

        if (activeToggles.has('logbook')) {
            for (const [key, entry] of Object.entries(logbooks)) {
                if (matchesSearch(entry, key)) {
                    entries.push({ key, entry, type: 'logbook' });
                }
            }
        }

        if (activeToggles.has('study')) {
            for (const [key, entry] of Object.entries(studies)) {
                if (matchesSearch(entry, key)) {
                    entries.push({ key, entry, type: 'study' });
                }
            }
        }

        if (activeToggles.has('note')) {
            for (const [key, entry] of Object.entries(notes)) {
                if (matchesSearch(entry, key)) {
                    entries.push({ key, entry, type: 'note' });
                }
            }
        }

        // Sort by year descending (most recent first).
        entries.sort((a, b) => {
            const aYear = extractYear(a.entry.date) || 0;
            const bYear = extractYear(b.entry.date) || 0;
            return bYear - aYear;
        });

        return entries;
    }

    // Render all entries
    function renderEntries() {
        const container = document.getElementById('entries-container');
        const counterElement = document.getElementById('result-counter');
        const entries = collectEntries();

        counterElement.innerHTML = `<span>${entries.length}</span> result${entries.length !== 1 ? 's' : ''}`;

        if (entries.length === 0) {
            container.innerHTML = '<div class="no-results">No archive entries match the current filters.</div>';
            return;
        }

        let html = '';
        entries.forEach(({ key, entry, type }) => {
            html += renderArchiveEntry(key, entry, type);
        });

        container.innerHTML = html;
    }

    // Start
    document.addEventListener('DOMContentLoaded', init);
})();
