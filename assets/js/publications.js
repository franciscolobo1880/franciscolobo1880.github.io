/* filepath: /home/lobo/GitHub/franciscolobo1880.github.io/assets/js/publications.js */
$(document).ready(function() {
    let allPublications = [];
    let authorsData = {};
    let filteredPublications = [];
    let allYears = [];

    console.log('Publications.js loaded, starting data fetch...');

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
        
        // Process papers - FIXED TO INCLUDE supplementary_notes_link
        console.log('Processing papers...', Object.keys(papers));
        Object.keys(papers).forEach(key => {
            const item = papers[key];
            console.log('Processing paper:', key, item);
            allPublications.push({
                id: key,
                type: 'papers',
                name: item.name,
                authors: item.authors,
                date: item.date,
                journal: item.journal || null,
                local_link: item.local_link || null,
                journal_link: item.journal_link || null,
                arxiv_link: item.arXiv_link || item.arxiv_link || null,
                github_link: item.github_link || item.github_repository_link || null,
                supplementary_link: item.supplementary_link || item.supplementary_notes_link || item.supplementary_worksheet_link || null,
                slides_link: item.slides_link || item.slides_presentation_link || null,
                poster_link: item.poster_link || item.poster_presentation_link || null
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
                authors: item.authors,
                date: item.date,
                journal: null,
                local_link: item.local_link || null,
                journal_link: null,
                arxiv_link: item.arXiv_link || item.arxiv_link || null,
                github_link: item.github_link || item.github_repository_link || null,
                supplementary_link: item.supplementary_link || item.supplementary_notes_link || item.supplementary_worksheet_link || null,
                slides_link: item.slides_link || item.slides_presentation_link || null,
                poster_link: item.poster_link || item.poster_presentation_link || null
            });
        });
        
        // Process thesis
        console.log('Processing thesis...', Object.keys(thesis));
        Object.keys(thesis).forEach(key => {
            const item = thesis[key];
            allPublications.push({
                id: key,
                type: 'thesis',
                name: item.name,
                authors: item.authors,
                date: item.date,
                journal: null,
                local_link: item.local_link || null,
                journal_link: null,
                arxiv_link: item.arXiv_link || item.arxiv_link || null,
                github_link: item.github_link || item.github_repository_link || null,
                supplementary_link: item.supplementary_link || item.supplementary_notes_link || item.supplementary_worksheet_link || null,
                slides_link: item.slides_link || item.slides_presentation_link || null,
                poster_link: item.poster_link || item.poster_presentation_link || null
            });
        });
        
        // Process books
        console.log('Processing books...', Object.keys(books));
        Object.keys(books).forEach(key => {
            const item = books[key];
            allPublications.push({
                id: key,
                type: 'books',
                name: item.name,
                authors: item.authors,
                date: item.date,
                journal: item.publisher || null,
                local_link: item.local_link || null,
                journal_link: item.publisher_link || null,
                arxiv_link: item.arXiv_link || item.arxiv_link || null,
                github_link: item.github_link || item.github_repository_link || null,
                supplementary_link: item.supplementary_link || item.supplementary_notes_link || item.supplementary_worksheet_link || null,
                slides_link: item.slides_link || item.slides_presentation_link || null,
                poster_link: item.poster_link || item.poster_presentation_link || null
            });
        });
        
        // Process logs
        console.log('Processing logs...', Object.keys(logs));
        Object.keys(logs).forEach(key => {
            const item = logs[key];
            allPublications.push({
                id: key,
                type: 'logs',
                name: item.name,
                authors: ['Francisco Lobo'],
                date: item.date,
                journal: null,
                local_link: item.local_link || null,
                journal_link: null,
                arxiv_link: item.arXiv_link || item.arxiv_link || null,
                github_link: item.github_repository_link || item.github_link || null,
                supplementary_link: item.supplementary_worksheet_link || item.supplementary_notes_link || item.supplementary_link || null,
                slides_link: item.slides_presentation_link || item.slides_link || null,
                poster_link: item.poster_link || item.poster_presentation_link || null
            });
        });
        
        // Process notes - FIXED: Correct path from "rough" to "notes"
        console.log('Processing notes...', Object.keys(notes));
        Object.keys(notes).forEach(key => {
            const item = notes[key];
            
            // FIX: Update old "rough" paths to "notes" paths
            let localLink = item.local_link || null;
            if (localLink && localLink.includes('/rough/')) {
                localLink = localLink.replace('/rough/', '/notes/');
                console.log('Fixed path for notes:', localLink);
            }
            
            let supplementaryLink = item.supplementary_link || item.supplementary_notes_link || item.supplementary_worksheet_link || null;
            if (supplementaryLink && supplementaryLink.includes('/rough/')) {
                supplementaryLink = supplementaryLink.replace('/rough/', '/notes/');
                console.log('Fixed supplementary path for notes:', supplementaryLink);
            }
            
            let slidesLink = item.slides_link || item.slides_presentation_link || null;
            if (slidesLink && slidesLink.includes('/rough/')) {
                slidesLink = slidesLink.replace('/rough/', '/notes/');
                console.log('Fixed slides path for notes:', slidesLink);
            }
            
            allPublications.push({
                id: key,
                type: 'notes',
                name: item.name,
                authors: ['Francisco Lobo'],
                date: item.date,
                journal: null,
                local_link: localLink,
                journal_link: null,
                arxiv_link: item.arXiv_link || item.arxiv_link || null,
                github_link: item.github_link || item.github_repository_link || null,
                supplementary_link: supplementaryLink,
                slides_link: slidesLink,
                poster_link: item.poster_link || item.poster_presentation_link || null
            });
        });
        
        console.log('FINAL PROCESSED PUBLICATIONS:', allPublications);
        console.log('Total publications:', allPublications.length);
        
        // Set initial filter to preprints
        $('#type-preprints').prop('checked', true);
        $('.type-toggle-container').attr('data-selected', 'preprints');
        
        setupFilters();
        setupSearch();
        updateYearRange();
        generateYearTicks();
        updateSliderRange();
        
        // Apply initial filter (preprints)
        applyFilters();
        
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

    function createPublicationItem(pub) {
        // FIXED AUTHOR LINKING - Match by name from the JSON structure
        const authorLinks = pub.authors.map(authorName => {
            const authorKey = Object.keys(authorsData).find(key => 
                authorsData[key].name === authorName
            );
            
            if (authorKey && authorsData[authorKey].google_scholar_link) {
                return `<a href="${authorsData[authorKey].google_scholar_link}" target="_blank" rel="noopener noreferrer" class="author-link">${authorName}</a>`;
            } else {
                return authorName;
            }
        }).join(', ');

        // Create publication links
        let linksHtml = '';
        
        // PDF link
        if (pub.local_link) {
            linksHtml += `<a href="${pub.local_link}" class="publication-link" target="_blank" rel="noopener noreferrer">
                <i class="fas fa-file-pdf"></i> PDF
            </a>`;
        }
        
        // Journal/Publisher link
        if (pub.journal_link) {
            const linkText = pub.type === 'books' ? 'Publisher' : 'Journal';
            linksHtml += `<a href="${pub.journal_link}" class="publication-link" target="_blank" rel="noopener noreferrer">
                <i class="fas fa-external-link-alt"></i> ${linkText}
            </a>`;
        }
        
        // arXiv link
        if (pub.arxiv_link) {
            linksHtml += `<a href="${pub.arxiv_link}" class="publication-link" target="_blank" rel="noopener noreferrer">
                <i class="fas fa-archive"></i> arXiv
            </a>`;
        }
        
        // GitHub link
        if (pub.github_link) {
            linksHtml += `<a href="${pub.github_link}" class="publication-link" target="_blank" rel="noopener noreferrer">
                <i class="fab fa-github"></i> Code
            </a>`;
        }
        
        // Supplementary notes/worksheet
        if (pub.supplementary_link) {
            const suppText = pub.type === 'logs' ? 'Worksheet' : 'Supplement';
            linksHtml += `<a href="${pub.supplementary_link}" class="publication-link" target="_blank" rel="noopener noreferrer">
                <i class="fas fa-file-alt"></i> ${suppText}
            </a>`;
        }
        
        // Slides
        if (pub.slides_link) {
            linksHtml += `<a href="${pub.slides_link}" class="publication-link" target="_blank" rel="noopener noreferrer">
                <i class="fas fa-images"></i> Slides
            </a>`;
        }
        
        // Poster
        if (pub.poster_link) {
            linksHtml += `<a href="${pub.poster_link}" class="publication-link" target="_blank" rel="noopener noreferrer">
                <i class="fas fa-image"></i> Poster
            </a>`;
        }

        const displayDate = pub.date || 'Date not available';
        
        return `
            <div class="publication-item" data-type="${pub.type}" data-year="${extractYear(displayDate)}">
                <h3 class="publication-title">
                    ${pub.name}
                </h3>
                
                <div class="publication-meta">
                    <p><strong>Authors:</strong> ${authorLinks}</p>
                    ${pub.journal ? `<p><strong>${pub.type === 'books' ? 'Publisher' : 'Journal'}:</strong> ${pub.journal}</p>` : ''}
                    <p><strong>Date:</strong> ${displayDate}</p>
                </div>
                
                ${linksHtml ? `<div class="publication-links">${linksHtml}</div>` : ''}
            </div>
        `;
    }

    function extractYear(dateString) {
        const yearMatch = dateString.match(/\b(20\d{2})\b/);
        return yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
    }

    function setupFilters() {
        $('input[name="publication-type"]').on('change', function() {
            const selectedType = this.value;
            $('.type-toggle-container').attr('data-selected', selectedType);
            applyFilters();
        });

        $('#year-min, #year-max').on('input', function() {
            updateSliderRange();
            applyFilters();
        });
    }

    function setupSearch() {
        $('#publication-search').on('input', function() {
            applyFilters();
        });
    }

    function updateYearRange() {
        const years = allPublications.map(pub => {
            const date = pub.date || '';
            return extractYear(date);
        }).filter(year => year > 0);

        if (years.length > 0) {
            allYears = [...new Set(years)].sort((a, b) => a - b);
            const minYear = Math.min(...allYears);
            const maxYear = Math.max(...allYears);
            
            $('#year-min, #year-max').attr('min', minYear).attr('max', maxYear);
            $('#year-min').val(minYear);
            $('#year-max').val(maxYear);
        }
    }

    function generateYearTicks() {
        const ticksContainer = $('#year-ticks');
        ticksContainer.empty();
        
        if (allYears.length === 0) return;
        
        const minYear = Math.min(...allYears);
        const maxYear = Math.max(...allYears);
        const range = maxYear - minYear;
        
        allYears.forEach(year => {
            const position = range === 0 ? 50 : ((year - minYear) / range) * 100;
            
            const tick = $(`
                <div class="year-tick" style="left: ${position}%"></div>
                <div class="year-tick-label" style="left: ${position}%">${year}</div>
            `);
            
            ticksContainer.append(tick);
        });
    }

    function updateSliderRange() {
        const minVal = parseInt($('#year-min').val());
        const maxVal = parseInt($('#year-max').val());
        const min = parseInt($('#year-min').attr('min'));
        const max = parseInt($('#year-max').attr('max'));
        
        const range = max - min;
        const leftPercent = range === 0 ? 0 : ((minVal - min) / range) * 100;
        const widthPercent = range === 0 ? 100 : ((maxVal - minVal) / range) * 100;
        
        $('.year-slider-range').css({
            left: leftPercent + '%',
            width: widthPercent + '%'
        });
    }

    function updateResultsCount() {
        const count = filteredPublications.length;
        const countText = count === 1 ? '1 result found' : `${count} results found`;
        $('#results-count').text(countText);
    }

    function applyFilters() {
        const searchTerm = $('#publication-search').val().toLowerCase();
        const selectedType = $('input[name="publication-type"]:checked').val();
        const minYear = parseInt($('#year-min').val());
        const maxYear = parseInt($('#year-max').val());

        console.log('APPLYING FILTERS:', { selectedType, minYear, maxYear, searchTerm });
        console.log('ALL PUBLICATIONS TO FILTER:', allPublications);
        
        filteredPublications = allPublications.filter(pub => {
            console.log('Checking publication:', pub.name, 'type:', pub.type, 'vs selected:', selectedType);
            
            if (pub.type !== selectedType) {
                return false;
            }

            const pubYear = extractYear(pub.date || '');
            if (pubYear < minYear || pubYear > maxYear) {
                return false;
            }

            if (searchTerm) {
                const searchableText = [
                    pub.name,
                    pub.authors.join(' '),
                    pub.journal || '',
                    pub.date || ''
                ].join(' ').toLowerCase();

                if (!searchableText.includes(searchTerm)) {
                    return false;
                }
            }

            return true;
        }).sort((a, b) => {
            const getYear = (pub) => {
                const date = pub.date || '';
                const yearMatch = date.match(/\b(20\d{2})\b/);
                return yearMatch ? parseInt(yearMatch[1]) : 0;
            };
            return getYear(b) - getYear(a);
        });

        console.log('FILTERED PUBLICATIONS RESULT:', filteredPublications);
        renderPublications();
    }
});