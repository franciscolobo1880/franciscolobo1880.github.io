/* Curriculum Page JavaScript */

(function() {
    'use strict';

    // Data containers
    let welcomeText = {};
    let socials = {};
    let degrees = {};
    let conferences = {};
    let visits = {};
    let outreach = {};
    let contracts = {};
    let people = {};

    // State
    let activeToggles = new Set(['degree']);
    const currentYear = new Date().getFullYear();
    let yearFrom = currentYear - 2;
    let yearTo = currentYear;
    let searchQuery = '';

    // Initialize
    async function init() {
        await loadAllData();
        renderWelcomeText();
        renderSocials();
        setupControls();
        renderEntries();
    }

    // Load all JSON data
    async function loadAllData() {
        const basePath = 'content/database/';
        
        const [
            welcomeRes,
            socialsRes,
            degreesRes,
            conferencesRes,
            visitsRes,
            outreachRes,
            contractsRes,
            peopleRes
        ] = await Promise.all([
            fetch(basePath + 'curriculum_welcometext.json'),
            fetch(basePath + 'curriculum_socials.json'),
            fetch(basePath + 'curriculum_degrees.json'),
            fetch(basePath + 'curriculum_conferences.json'),
            fetch(basePath + 'curriculum_visits.json'),
            fetch(basePath + 'curriculum_outreach.json'),
            fetch(basePath + 'curriculum_contracts.json'),
            fetch(basePath + 'people.json')
        ]);

        welcomeText = await welcomeRes.json();
        socials = await socialsRes.json();
        degrees = await degreesRes.json();
        conferences = await conferencesRes.json();
        visits = await visitsRes.json();
        outreach = await outreachRes.json();
        contracts = await contractsRes.json();
        people = await peopleRes.json();
    }

    // Parse welcome text with links
    function parseWelcomeText(text) {
        // Pattern: *text (url)* becomes <a href="url">text</a>
        return text.replace(/\*([^(]+)\s*\(([^)]+)\)\*/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    }

    // Render welcome text
    function renderWelcomeText() {
        const container = document.getElementById('welcome-text');
        const parsedText = parseWelcomeText(welcomeText.welcome_text);
        container.innerHTML = `<p>${parsedText}</p>`;
    }

    // Get Font Awesome icon for social type
    function getSocialIcon(type) {
        const icons = {
            'ORCID': 'fab fa-orcid',
            'Scholar': 'fas fa-graduation-cap',
            'Github': 'fab fa-github',
            'Email': 'fas fa-envelope',
            'Institute': 'fas fa-building'
        };
        return icons[type] || 'fas fa-link';
    }

    // Render socials
    function renderSocials() {
        const container = document.getElementById('socials-container');
        let html = '';
        
        for (const [key, social] of Object.entries(socials)) {
            const icon = getSocialIcon(key);
            const displayText = social.name || key;
            html += `
                <a href="${social.link}" class="social-item" target="_blank" rel="noopener">
                    <i class="${icon}"></i>
                    <span>${displayText}</span>
                </a>
            `;
        }
        
        container.innerHTML = html;
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

    // Extract years from date string
    function extractYears(dateStr) {
        if (!dateStr) return { start: null, end: null };
        
        // Handle range: "2023-2027"
        const rangeMatch = dateStr.match(/(\d{4})-(\d{4})/);
        if (rangeMatch) {
            return { start: parseInt(rangeMatch[1]), end: parseInt(rangeMatch[2]) };
        }
        
        // Handle single year in various formats
        const yearMatch = dateStr.match(/(\d{4})/);
        if (yearMatch) {
            const year = parseInt(yearMatch[1]);
            return { start: year, end: year };
        }
        
        return { start: null, end: null };
    }

    // Check if entry is within year range
    function isInYearRange(dateStr) {
        const { start, end } = extractYears(dateStr);
        if (start === null) return true; // No date, include by default
        
        // Entry overlaps with filter range
        return !(end < yearFrom || start > yearTo);
    }

    // Check if entry matches search
    function matchesSearch(entry, key) {
        if (!searchQuery) return true;
        
        const searchableFields = [
            entry.name,
            entry.topic,
            entry.city,
            entry.date,
            entry.university,
            entry.institution,
            entry.from,
            entry.at,
            entry.medium,
            key
        ];

        // Add advisor names
        if (entry.advisors) {
            entry.advisors.forEach(advisorKey => {
                if (people[advisorKey]) {
                    searchableFields.push(people[advisorKey].name);
                }
            });
        }

        // Add collaborator names
        if (entry.collaborators) {
            entry.collaborators.forEach(collabKey => {
                if (people[collabKey]) {
                    searchableFields.push(people[collabKey].name);
                }
            });
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

    // Render degree entry
    function renderDegreeEntry(key, entry) {
        const advisorLinks = entry.advisors.map(a => getPersonLink(a)).join(', ');
        
        let institutionHtml = '';
        if (entry.university) {
            institutionHtml += `<a href="${entry.university_link}" target="_blank" rel="noopener">${entry.university}</a>`;
            if (entry.university_city) institutionHtml += ` — ${entry.university_city}`;
        }
        if (entry.institution) {
            institutionHtml += `<br><a href="${entry.institution_link}" target="_blank" rel="noopener">${entry.institution}</a>`;
            if (entry.institution_city) institutionHtml += ` — ${entry.institution_city}`;
        }
        if (entry.team) {
            institutionHtml += `<br><a href="${entry.team_link}" target="_blank" rel="noopener">${entry.team}</a>`;
        }

        return `
            <div class="entry-card" data-type="degree">
                <div class="entry-header">
                    <span class="entry-type">Degree</span>
                    <span class="entry-date">${entry.date}</span>
                </div>
                <div class="entry-title">${entry.name} in ${entry.topic}</div>
                <div class="entry-institution">${institutionHtml}</div>
                <div class="entry-advisors"><span>Advisors:</span> ${advisorLinks}</div>
            </div>
        `;
    }

    // Render contract entry
    function renderContractEntry(key, entry) {
        return `
            <div class="entry-card" data-type="contract">
                <div class="entry-header">
                    <span class="entry-type">Contract</span>
                    <span class="entry-date">${entry.date}</span>
                </div>
                <div class="entry-title">${entry.name}</div>
                <div class="entry-meta">
                    Reference: ${entry.reference}<br>
                    From: <a href="${entry.from_link}" target="_blank" rel="noopener">${entry.from}</a><br>
                    At: <a href="${entry.at_link}" target="_blank" rel="noopener">${entry.at}</a>
                </div>
                <div class="entry-location">${entry.city}</div>
            </div>
        `;
    }

    // Render conference entry
    function renderConferenceEntry(key, entry) {
        const medium = entry.medium ? `<span class="entry-medium">${entry.medium}</span>` : '';
        
        return `
            <div class="entry-card" data-type="conference">
                <div class="entry-header">
                    <div class="entry-tags">
                        <span class="entry-type">Conference</span>${medium}
                    </div>
                    <span class="entry-date">${entry.date}</span>
                </div>
                <div class="entry-title">
                    <a href="${entry.link}" target="_blank" rel="noopener">${entry.name}</a>
                </div>
                <div class="entry-location">${entry.city}</div>
            </div>
        `;
    }

    // Render visit entry
    function renderVisitEntry(key, entry) {
        const collaboratorLinks = entry.collaborators ? entry.collaborators.map(c => getPersonLink(c)).join(', ') : '';
        
        return `
            <div class="entry-card" data-type="visit">
                <div class="entry-header">
                    <span class="entry-type">Visit</span>
                    <span class="entry-date">${entry.date}</span>
                </div>
                <div class="entry-title">
                    <a href="${entry.link}" target="_blank" rel="noopener">${entry.name}</a>
                </div>
                <div class="entry-meta">${entry.topic}</div>
                <div class="entry-location">${entry.city}</div>
                ${collaboratorLinks ? `<div class="entry-collaborators">With: ${collaboratorLinks}</div>` : ''}
            </div>
        `;
    }

    // Render outreach entry
    function renderOutreachEntry(key, entry) {
        const medium = entry.medium ? `<span class="entry-medium">${entry.medium}</span>` : '';
        
        return `
            <div class="entry-card" data-type="outreach">
                <div class="entry-header">
                    <div class="entry-tags">
                        <span class="entry-type">Outreach</span>${medium}
                    </div>
                    <span class="entry-date">${entry.date}</span>
                </div>
                <div class="entry-title">
                    <a href="${entry.link}" target="_blank" rel="noopener">${entry.name}</a>
                </div>
                <div class="entry-meta">${entry.topic}</div>
                <div class="entry-location">${entry.city}</div>
            </div>
        `;
    }

    // Collect all entries
    function collectEntries() {
        const entries = [];

        if (activeToggles.has('degree')) {
            for (const [key, entry] of Object.entries(degrees)) {
                if (isInYearRange(entry.date) && matchesSearch(entry, key)) {
                    entries.push({ key, entry, type: 'degree', render: renderDegreeEntry });
                }
            }
        }

        if (activeToggles.has('contract')) {
            for (const [key, entry] of Object.entries(contracts)) {
                if (isInYearRange(entry.date) && matchesSearch(entry, key)) {
                    entries.push({ key, entry, type: 'contract', render: renderContractEntry });
                }
            }
        }

        if (activeToggles.has('conference')) {
            for (const [key, entry] of Object.entries(conferences)) {
                if (isInYearRange(entry.date) && matchesSearch(entry, key)) {
                    entries.push({ key, entry, type: 'conference', render: renderConferenceEntry });
                }
            }
        }

        if (activeToggles.has('visit')) {
            for (const [key, entry] of Object.entries(visits)) {
                if (isInYearRange(entry.date) && matchesSearch(entry, key)) {
                    entries.push({ key, entry, type: 'visit', render: renderVisitEntry });
                }
            }
        }

        if (activeToggles.has('outreach')) {
            for (const [key, entry] of Object.entries(outreach)) {
                if (isInYearRange(entry.date) && matchesSearch(entry, key)) {
                    entries.push({ key, entry, type: 'outreach', render: renderOutreachEntry });
                }
            }
        }

        // Sort by date (most recent first)
        entries.sort((a, b) => {
            const aYears = extractYears(a.entry.date);
            const bYears = extractYears(b.entry.date);
            const aYear = aYears.end || aYears.start || 0;
            const bYear = bYears.end || bYears.start || 0;
            return bYear - aYear;
        });

        return entries;
    }

    // Render all entries
    function renderEntries() {
        const container = document.getElementById('entries-container');
        const entries = collectEntries();

        if (entries.length === 0) {
            container.innerHTML = '<div class="no-results">No entries match the current filters.</div>';
            return;
        }

        let html = '';
        entries.forEach(({ key, entry, render }) => {
            html += render(key, entry);
        });

        container.innerHTML = html;
    }

    // Start
    document.addEventListener('DOMContentLoaded', init);
})();
