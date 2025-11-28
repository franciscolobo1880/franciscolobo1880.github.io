$(document).ready(function() {
    let allPublications = [];
    let authorsData = {};
    let filteredPublications = [];
    let allYears = [];

    console.log('Publications.js loaded, starting data fetch...');

    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const urlType = urlParams.get('type');
    const urlHighlight = urlParams.get('highlight');
    
    console.log('URL parameters:', { type: urlType, highlight: urlHighlight });

    // Load all JSON files with better error handling
    Promise.all([
        fetch('content/database/publications_papers.json')
            .then(response => {
                console.log('Papers response:', response.status, response.statusText);
                if (!response.ok) throw new Error(`Papers: ${response.status}`);
                return response.json();
            })
            .catch(err => {
                console.error('Error loading papers:', err);
                return {};
            }),
        fetch('content/database/publications_preprints.json')
            .then(response => {
                console.log('Preprints response:', response.status, response.statusText);
                if (!response.ok) throw new Error(`Preprints: ${response.status}`);
                return response.json();
            })
            .catch(err => {
                console.error('Error loading preprints:', err);
                return {};
            }),
        fetch('content/database/publications_thesis.json')
            .then(response => {
                console.log('Thesis response:', response.status, response.statusText);
                if (!response.ok) throw new Error(`Thesis: ${response.status}`);
                return response.json();
            })
            .catch(err => {
                console.error('Error loading thesis:', err);
                return {};
            }),
        fetch('content/database/publications_books.json')
            .then(response => {
                console.log('Books response:', response.status, response.statusText);
                if (!response.ok) throw new Error(`Books: ${response.status}`);
                return response.json();
            })
            .catch(err => {
                console.error('Error loading books:', err);
                return {};
            }),
        fetch('content/database/publications_logs.json')
            .then(response => {
                console.log('Logs response:', response.status, response.statusText);
                if (!response.ok) throw new Error(`Logs: ${response.status}`);
                return response.json();
            })
            .catch(err => {
                console.error('Error loading logs:', err);
                return {};
            }),
        fetch('content/database/publications_notes.json')
            .then(response => {
                console.log('Notes response:', response.status, response.statusText);
                if (!response.ok) throw new Error(`Notes: ${response.status}`);
                return response.json();
            })
            .catch(err => {
                console.error('Error loading notes:', err);
                return {};
            }),
        fetch('content/database/publications_authors.json')
            .then(response => {
                console.log('Authors response:', response.status, response.statusText);
                if (!response.ok) throw new Error(`Authors: ${response.status}`);
                return response.json();
            })
            .catch(err => {
                console.error('Error loading authors:', err);
                return {};
            })
    ]).then(([papers, preprints, thesis, books, logs, notes, authors]) => {
        console.log('ALL FILES LOADED SUCCESSFULLY!');
        console.log('Raw loaded data:', { papers, preprints, thesis, books, logs, notes, authors });
        
        allPublications = [];
        authorsData = authors;
        
        // Process papers - Added BibTeX support
        console.log('Processing papers...', Object.keys(papers));
        Object.keys(papers).forEach(key => {
            const item = papers[key];
            console.log('Processing paper:', key, item);
            allPublications.push({
                id: key,
                type: 'papers',
                name: item.name,
                authors: item.authors || ['Francisco Lobo'],
                date: item.date,
                journal: item.journal || null,
                local_link: item.local_link || null,
                journal_link: item.journal_link || null,
                arxiv_link: item.arXiv_link || null,
                github_link: item.github_repository_link || null,
                supplementary_link: item.supplementary_notes_link || null,
                slides_link: item.slides_presentation_link || null,
                poster_link: item.poster_presentation_link || null,
                bibtex: item.bibtex || null
            });
        });
        
        // Process preprints
        console.log('Processing preprints...', Object.keys(preprints));
        Object.keys(preprints).forEach(key => {
            const item = preprints[key];
            console.log('Processing preprint:', key, item);
            allPublications.push({
                id: key,
                type: 'preprints',
                name: item.name,
                authors: item.authors || ['Francisco Lobo'],
                date: item.date,
                journal: item.journal || null,
                local_link: item.local_link || null,
                journal_link: item.journal_link || null,
                arxiv_link: item.arXiv_link || null,
                github_link: item.github_repository_link || null,
                supplementary_link: item.supplementary_notes_link || null,
                slides_link: item.slides_presentation_link || null,
                poster_link: item.poster_presentation_link || null,
                bibtex: item.bibtex || null
            });
        });
        
        // Process thesis
        console.log('Processing thesis...', Object.keys(thesis));
        Object.keys(thesis).forEach(key => {
            const item = thesis[key];
            console.log('Processing thesis:', key, item);
            allPublications.push({
                id: key,
                type: 'thesis',
                name: item.name,
                authors: item.authors || ['Francisco Lobo'],
                date: item.date,
                journal: null,
                local_link: item.local_link || null,
                journal_link: null,
                arxiv_link: null,
                github_link: null,
                supplementary_link: null,
                slides_link: item.slides_presentation_link || null,
                poster_link: item.poster_presentation_link || null,
                bibtex: item.bibtex || null
            });
        });
        
        // Process books
        console.log('Processing books...', Object.keys(books));
        Object.keys(books).forEach(key => {
            const item = books[key];
            console.log('Processing book:', key, item);
            allPublications.push({
                id: key,
                type: 'books',
                name: item.name,
                authors: item.authors || ['Francisco Lobo'],
                date: item.date,
                journal: item.publisher || null,
                local_link: item.local_link || null,
                journal_link: item.publisher_link || null,
                arxiv_link: null,
                github_link: null,
                supplementary_link: null,
                slides_link: null,
                poster_link: null,
                bibtex: item.bibtex || null
            });
        });
        
        // Process logs - FIXED: Added missing authors and correct supplementary mapping
        console.log('Processing logs...', Object.keys(logs));
        Object.keys(logs).forEach(key => {
            const item = logs[key];
            console.log('Processing log:', key, item);
            allPublications.push({
                id: key,
                type: 'logs',
                name: item.name,
                authors: item.authors || ['Francisco Lobo'],
                date: item.date,
                journal: null,
                local_link: item.local_link || null,
                journal_link: null,
                arxiv_link: null,
                github_link: item.github_repository_link || null,
                supplementary_link: item.supplementary_worksheet_link || null,
                slides_link: item.slides_presentation_link || null,
                poster_link: null,
                bibtex: null
            });
        });
        
        // Process notes - FIXED: Correct authors and supplementary mapping
        console.log('Processing notes...', Object.keys(notes));
        Object.keys(notes).forEach(key => {
            const item = notes[key];
            console.log('Processing note:', key, item);
            allPublications.push({
                id: key,
                type: 'notes',
                name: item.name,
                authors: item.authors || ['Francisco Lobo'],
                date: item.date,
                journal: item.course || null,
                local_link: item.local_link || null,
                journal_link: null,
                arxiv_link: null,
                github_link: null,
                supplementary_link: item.worksheet_link || null,
                slides_link: null,
                poster_link: null,
                bibtex: null
            });
        });
        
        console.log('FINAL PROCESSED PUBLICATIONS:', allPublications);
        console.log('Total publications:', allPublications.length);
        
        // Set initial filter based on URL parameter or default to preprints
        const initialType = urlType || 'preprints';
        $(`#type-${initialType}`).prop('checked', true);
        $('.type-toggle-container').attr('data-selected', initialType);
        
        setupFilters();
        setupSearch();
        updateYearRange();
        generateYearTicks();
        updateSliderRange();
        
        // Apply initial filter
        applyFilters();
        
        // Handle highlight parameter
        if (urlHighlight) {
            console.log('Highlighting publication:', urlHighlight);
            setTimeout(() => {
                // Set search to the highlight term
                $('#publication-search').val(urlHighlight).trigger('input');
                
                // Scroll to the highlighted publication
                const targetElement = $(`.publication-item:contains('${urlHighlight}')`).first();
                if (targetElement.length > 0) {
                    targetElement.get(0).scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                    
                    // Add visual highlight effect
                    targetElement.css({
                        'background-color': 'rgba(247, 208, 2, 0.2)',
                        'border-color': '#F7D002',
                        'transition': 'all 0.5s ease'
                    });
                    
                    // Remove highlight after 3 seconds
                    setTimeout(() => {
                        targetElement.css({
                            'background-color': '',
                            'border-color': '',
                            'transition': 'all 0.5s ease'
                        });
                    }, 3000);
                }
            }, 500);
        }
        
    }).catch(error => {
        console.error('CRITICAL ERROR loading data:', error);
        $('#publications-list').html('<p style="color: red; padding: 20px;">Error loading publications: ' + error.message + '</p>');
        $('#results-count').text('Error loading data');
    });

    function renderPublications() {
        console.log('RENDERING PUBLICATIONS:', filteredPublications.length);
        const container = $('#publications-list');
        const noResultsElement = $('#no-results');
        
        // Clear everything immediately - no animations
        container.empty();
        noResultsElement.hide();

        if (filteredPublications.length === 0) {
            console.log('NO PUBLICATIONS TO SHOW');
            noResultsElement.show();
            updateResultsCount();
            return;
        }

        // Render publications immediately - no animations
        filteredPublications.forEach((pub) => {
            console.log('Creating publication item:', pub);
            const publicationHtml = createPublicationItem(pub);
            container.append(publicationHtml);
        });
        
        updateResultsCount();
    }

    // BibTeX copy functionality
    function copyBibTeX(bibtex) {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(bibtex).then(() => {
                console.log('BibTeX copied to clipboard');
                // Show success message
                showCopyMessage('BibTeX citation copied to clipboard!');
            }).catch(err => {
                console.error('Failed to copy BibTeX: ', err);
                fallbackCopyTextToClipboard(bibtex);
            });
        } else {
            fallbackCopyTextToClipboard(bibtex);
        }
    }

    function fallbackCopyTextToClipboard(text) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            console.log('BibTeX copied to clipboard (fallback)');
            showCopyMessage('BibTeX citation copied to clipboard!');
        } catch (err) {
            console.error('Fallback: Oops, unable to copy', err);
        }
        
        document.body.removeChild(textArea);
    }

    function showCopyMessage(message) {
        // Create temporary message with light grey background
        const messageDiv = $(`<div style="position: fixed; top: 20px; right: 20px; background-color: #4a4a4aff; color: white; padding: 1em 1.2em; border-radius: 6px; z-index: 9999; font-size: 0.9em; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);">${message}</div>`);
        $('body').append(messageDiv);
        
        // Remove after 3 seconds with fade out
        setTimeout(() => {
            messageDiv.fadeOut(400, () => messageDiv.remove());
        }, 3000);
    }

    function createPublicationItem(pub) {
        // FIXED AUTHOR LINKING - Match by name from the JSON structure
        const authorLinks = pub.authors.map(authorName => {
            const author = Object.values(authorsData).find(auth => auth.name === authorName);
            if (author && author.google_scholar_link) {
                return `<a href="${author.google_scholar_link}" target="_blank" class="author-link">${authorName}</a>`;
            }
            return authorName;
        }).join(', ');

        // Create publication links
        let linksHtml = '';
        
        // PDF link
        if (pub.local_link) {
            const linkText = pub.type === 'books' ? 'View Book' : 'PDF';
            linksHtml += `<a href="${pub.local_link}" target="_blank" class="publication-link">
                <i class="fas fa-file-pdf"></i> ${linkText}
            </a>`;
        }
        
        // Journal/Publisher link
        if (pub.journal_link) {
            const linkText = pub.type === 'books' ? 'Publisher' : 'Journal';
            linksHtml += `<a href="${pub.journal_link}" target="_blank" class="publication-link">
                <i class="fas fa-external-link-alt"></i> ${linkText}
            </a>`;
        }
        
        // arXiv link - using actual arXiv logo style
        if (pub.arxiv_link) {
            linksHtml += `<a href="${pub.arxiv_link}" target="_blank" class="publication-link">
                <i class="ai ai-arxiv"></i> arXiv
            </a>`;
        }
        
        // GitHub link
        if (pub.github_link) {
            linksHtml += `<a href="${pub.github_link}" target="_blank" class="publication-link">
                <i class="fab fa-github"></i> Code
            </a>`;
        }
        
        // Supplementary notes/worksheet - changed "Supplementary" to "Appendix"
        if (pub.supplementary_link) {
            const linkText = pub.type === 'notes' ? 'Worksheet' : pub.type === 'logs' ? 'Worksheet' : 'Appendix';
            linksHtml += `<a href="${pub.supplementary_link}" target="_blank" class="publication-link">
                <i class="fas fa-file-alt"></i> ${linkText}
            </a>`;
        }
        
        // Slides - restored the icon
        if (pub.slides_link) {
            linksHtml += `<a href="${pub.slides_link}" target="_blank" class="publication-link">
                <i class="fas fa-file-powerpoint"></i> Slides
            </a>`;
        }
        
        // Poster
        if (pub.poster_link) {
            linksHtml += `<a href="${pub.poster_link}" target="_blank" class="publication-link">
                <i class="fas fa-image"></i> Poster
            </a>`;
        }

        // BibTeX link (only for papers and preprints) - using quote-right icon
        if (pub.bibtex && (pub.type === 'papers' || pub.type === 'preprints')) {
            linksHtml += `<a href="javascript:void(0);" class="publication-link bibtex-button" data-bibtex="${encodeURIComponent(pub.bibtex)}">
                <i class="fas fa-quote-right"></i> BibTeX
            </a>`;
        }

        const displayDate = pub.date || 'Date not available';
        return `
            <div class="publication-item" data-id="${pub.id}">
                <div class="publication-title">
                    <h3><a href="${pub.local_link || '#'}" target="_blank">${pub.name}</a></h3>
                </div>
                <div class="publication-meta">
                    <p><strong>Authors:</strong> ${authorLinks}</p>
                    ${pub.journal ? `<p><strong>Journal:</strong> ${pub.journal}</p>` : ''}
                    <p><strong>Date of publication:</strong> ${displayDate}</p>
                </div>
                <div class="publication-links">
                    ${linksHtml}
                </div>
            </div>
        `;
    }

    // Event delegation for BibTeX buttons
    $(document).on('click', '.bibtex-button', function(e) {
        e.preventDefault();
        const bibtex = decodeURIComponent($(this).data('bibtex'));
        copyBibTeX(bibtex);
    });

    function extractYear(dateString) {
        return dateString ? dateString.split('/').pop() : '2024';
    }

    function setupFilters() {
        // Type filter change
        $('input[name="publication-type"]').on('change', function() {
            const selectedType = $(this).val();
            $('.type-toggle-container').attr('data-selected', selectedType);
            applyFilters();
        });
    }

    function setupSearch() {
        $('#publication-search').on('input', function() {
            applyFilters();
        });
    }

    function updateYearRange() {
        allYears = [...new Set(allPublications.map(pub => parseInt(extractYear(pub.date))))];
        allYears.sort((a, b) => a - b);
        
        const minYear = allYears[0] || 2020;
        const maxYear = allYears[allYears.length - 1] || 2025;
        
        $('#year-min, #year-max').attr('min', minYear).attr('max', maxYear);
        $('#year-min').val(minYear);
        $('#year-max').val(maxYear);
        
        console.log('Year range updated:', minYear, 'to', maxYear);
    }

    function generateYearTicks() {
        const ticksContainer = $('#year-ticks');
        ticksContainer.empty();
        
        const minYear = parseInt($('#year-min').attr('min'));
        const maxYear = parseInt($('#year-max').attr('max'));
        
        for (let year = minYear; year <= maxYear; year++) {
            const position = ((year - minYear) / (maxYear - minYear)) * 100;
            ticksContainer.append(`
                <div class="year-tick" style="left: ${position}%">
                    <div class="year-tick-label">${year}</div>
                </div>
            `);
        }
    }

    function updateSliderRange() {
        const minVal = parseInt($('#year-min').val());
        const maxVal = parseInt($('#year-max').val());
        const minYear = parseInt($('#year-min').attr('min'));
        const maxYear = parseInt($('#year-max').attr('max'));
        
        const minPercent = ((minVal - minYear) / (maxYear - minYear)) * 100;
        const maxPercent = ((maxVal - minYear) / (maxYear - minYear)) * 100;
        
        $('.year-slider-range').css({
            'left': minPercent + '%',
            'width': (maxPercent - minPercent) + '%'
        });
        
        $('#year-min, #year-max').on('input', function() {
            updateSliderRange();
            applyFilters();
        });
    }

    function updateResultsCount() {
        const count = filteredPublications.length;
        $('#results-count').text(`${count} result${count !== 1 ? 's' : ''}`);
    }

    function applyFilters() {
        console.log('APPLYING FILTERS...');
        
        const selectedType = $('input[name="publication-type"]:checked').val();
        const searchTerm = $('#publication-search').val().toLowerCase().trim();
        const minYear = parseInt($('#year-min').val());
        const maxYear = parseInt($('#year-max').val());
        
        console.log('Filter parameters:', { selectedType, searchTerm, minYear, maxYear });
        
        // Start with all publications
        let filtered = [...allPublications];
        
        // Apply type filter
        if (selectedType) {
            console.log(`Filtering by type: ${selectedType}`);
            filtered = filtered.filter(pub => pub.type === selectedType);
            console.log(`After type filter: ${filtered.length} publications`);
        }
        
        // Apply search filter
        if (searchTerm) {
            console.log(`Filtering by search term: "${searchTerm}"`);
            filtered = filtered.filter(pub => {
                const searchableText = [
                    pub.name,
                    pub.id,
                    ...(pub.authors || []),
                    pub.journal || ''
                ].join(' ').toLowerCase();
                
                const matches = searchableText.includes(searchTerm);
                if (matches) console.log(`Search match found: ${pub.name}`);
                return matches;
            });
            console.log(`After search filter: ${filtered.length} publications`);
        }
        
        // Apply year filter
        filtered = filtered.filter(pub => {
            const pubYear = parseInt(extractYear(pub.date));
            const inRange = pubYear >= minYear && pubYear <= maxYear;
            return inRange;
        });
        
        console.log(`FINAL FILTERED RESULTS: ${filtered.length} publications`);
        
        // Sort by date (most recent first)
        filtered.sort((a, b) => {
            const dateA = new Date(a.date?.split('/').reverse().join('-') || '1900-01-01');
            const dateB = new Date(b.date?.split('/').reverse().join('-') || '1900-01-01');
            return dateB - dateA;
        });
        
        filteredPublications = filtered;
        renderPublications();
    }
});