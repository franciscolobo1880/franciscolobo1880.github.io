$(document).ready(function() {
    let allCurriculumItems = [];
    let filteredCurriculumItems = [];
    let allYears = [];
    let authorsData = {};

    console.log('Curriculum page loaded, starting data fetch...');

    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const urlType = urlParams.get('type');
    
    console.log('URL parameters:', { type: urlType });

    // Load JSON files (removed workflow)
    Promise.all([
        fetch('content/database/curriculum_research.json')
            .then(response => {
                console.log('Research response:', response.status, response.statusText);
                if (!response.ok) throw new Error(`Research: ${response.status}`);
                return response.json();
            })
            .catch(err => {
                console.error('Error loading research data:', err);
                return {};
            }),
        fetch('content/database/curriculum_group.json')
            .then(response => {
                console.log('Group response:', response.status, response.statusText);
                if (!response.ok) throw new Error(`Group: ${response.status}`);
                return response.json();
            })
            .catch(err => {
                console.error('Error loading group data:', err);
                return {};
            }),
        fetch('content/database/curriculum_degrees.json')
            .then(response => {
                console.log('Degrees response:', response.status, response.statusText);
                if (!response.ok) throw new Error(`Degrees: ${response.status}`);
                return response.json();
            })
            .catch(err => {
                console.error('Error loading degrees data:', err);
                return {};
            }),
        fetch('content/database/curriculum_contracts.json')
            .then(response => {
                console.log('Contracts response:', response.status, response.statusText);
                if (!response.ok) throw new Error(`Contracts: ${response.status}`);
                return response.json();
            })
            .catch(err => {
                console.error('Error loading contracts data:', err);
                return {};
            }),
        fetch('content/database/curriculum_awards.json')
            .then(response => {
                console.log('Awards response:', response.status, response.statusText);
                if (!response.ok) throw new Error(`Awards: ${response.status}`);
                return response.json();
            })
            .catch(err => {
                console.error('Error loading awards data:', err);
                return {};
            }),
        fetch('content/database/curriculum_teaching.json')
            .then(response => {
                console.log('Teaching response:', response.status, response.statusText);
                if (!response.ok) throw new Error(`Teaching: ${response.status}`);
                return response.json();
            })
            .catch(err => {
                console.error('Error loading teaching data:', err);
                return {};
            }),
        fetch('content/database/publications_authors.json')
            .then(response => {
                console.log('Authors response:', response.status, response.statusText);
                if (!response.ok) throw new Error(`Authors: ${response.status}`);
                return response.json();
            })
            .catch(err => {
                console.error('Error loading authors data:', err);
                return {};
            })
    ]).then(([research, group, degrees, contracts, awards, teaching, authors]) => {
        console.log('Curriculum data loaded successfully!');
        console.log('Research data:', research);
        console.log('Group data:', group);
        console.log('Degrees data:', degrees);
        console.log('Contracts data:', contracts);
        console.log('Awards data:', awards);
        console.log('Teaching data:', teaching);
        console.log('Authors data:', authors);
        
        allCurriculumItems = [];
        authorsData = authors;
        
        // Process research
        console.log('Processing research...', Object.keys(research));
        Object.keys(research).forEach(key => {
            const item = research[key];
            console.log('Processing research:', key, item);
            allCurriculumItems.push({
                id: key,
                type: 'research',
                name: createMainTitle(item, 'research'),
                searchText: createSearchText(item, 'research'),
                dates: '',
                ...item
            });
        });
        
        // Process group
        console.log('Processing group...', Object.keys(group));
        Object.keys(group).forEach(key => {
            const item = group[key];
            console.log('Processing group:', key, item);
            allCurriculumItems.push({
                id: key,
                type: 'group',
                name: createMainTitle(item, 'group'),
                searchText: createSearchText(item, 'group'),
                dates: '',
                ...item
            });
        });
        
        // Process degrees
        console.log('Processing degrees...', Object.keys(degrees));
        Object.keys(degrees).forEach(key => {
            const item = degrees[key];
            console.log('Processing degree:', key, item);
            allCurriculumItems.push({
                id: key,
                type: 'degrees',
                name: createMainTitle(item, 'degrees'),
                searchText: createSearchText(item, 'degrees'),
                dates: item.degree_dates || '',
                ...item
            });
        });
        
        // Process contracts
        console.log('Processing contracts...', Object.keys(contracts));
        Object.keys(contracts).forEach(key => {
            const item = contracts[key];
            console.log('Processing contract:', key, item);
            allCurriculumItems.push({
                id: key,
                type: 'contracts',
                name: createMainTitle(item, 'contracts'),
                searchText: createSearchText(item, 'contracts'),
                dates: item.dates || '',
                contract_type: item.type,
                from: item.from,
                from_link: item.from_link,
                reference: item.reference,
                at: item.at,
                at_link: item.at_link,
                at_city: item.at_city
            });
        });
        
        // Process awards
        console.log('Processing awards...', Object.keys(awards));
        Object.keys(awards).forEach(key => {
            const item = awards[key];
            console.log('Processing award:', key, item);
            allCurriculumItems.push({
                id: key,
                type: 'awards',
                name: createMainTitle(item, 'awards'),
                searchText: createSearchText(item, 'awards'),
                dates: item.dates || item.period || '',
                ...item
            });
        });
        
        // Process teaching
        console.log('Processing teaching...', Object.keys(teaching));
        Object.keys(teaching).forEach(key => {
            const item = teaching[key];
            console.log('Processing teaching:', key, item);
            allCurriculumItems.push({
                id: key,
                type: 'teaching',
                name: createMainTitle(item, 'teaching'),
                searchText: createSearchText(item, 'teaching'),
                dates: item.dates || item.period || '',
                ...item
            });
        });
        
        console.log('FINAL PROCESSED CURRICULUM:', allCurriculumItems);
        console.log('Total items:', allCurriculumItems.length);
        
        // Set initial filter based on URL parameter or default to research
        const initialType = urlType || 'research';
        $(`#type-${initialType}`).prop('checked', true);
        $('.type-toggle-container').attr('data-selected', initialType);
        
        setupFilters();
        setupSearch();
        updateYearRange();
        generateYearTicks();
        updateSliderRange();
        
        // Apply initial filter
        applyFilters();
        
    }).catch(error => {
        console.error('CRITICAL ERROR loading Curriculum data:', error);
        $('#curriculum-list').html('<p style="color: red; padding: 20px;">Error loading curriculum: ' + error.message + '</p>');
        $('#results-count').text('Error loading data');
    });

    function createMainTitle(item, type) {
        switch (type) {
            case 'research':
                return item.title || item.name || item.id;
            case 'group':
                return item.name || item.title || item.id;
            case 'degrees':
                const degreeType = item.degree_type || '';
                const degreeName = item.degree_name || '';
                return `${degreeType} ${degreeName}`.trim() || item.title || item.id;
            case 'contracts':
                return item.type || item.title || item.id;
            case 'awards':
                return item.title || item.name || item.id;
            case 'teaching':
                return item.title || item.name || item.id;
            default:
                return item.title || item.name || 'Item';
        }
    }

    function createSearchText(item, type) {
        let searchTerms = [];
        
        // Add main identifiers
        searchTerms.push(item.id || '');
        
        switch (type) {
            case 'research':
                searchTerms.push(item.title || item.name || '');
                if (item.subtopics && Array.isArray(item.subtopics)) {
                    searchTerms.push(...item.subtopics);
                }
                break;
            case 'group':
                searchTerms.push(item.name || '');
                break;
            case 'degrees':
                searchTerms.push(item.degree_type || '');
                searchTerms.push(item.degree_name || '');
                searchTerms.push(item.degree_university || '');
                searchTerms.push(item.degree_institution || '');
                searchTerms.push(item.degree_team || '');
                searchTerms.push(item.degree_field || '');
                if (item.degree_advisors && Array.isArray(item.degree_advisors)) {
                    searchTerms.push(...item.degree_advisors);
                }
                break;
            case 'contracts':
                searchTerms.push(item.type || '');
                searchTerms.push(item.from || '');
                searchTerms.push(item.reference || '');
                searchTerms.push(item.at || '');
                searchTerms.push(item.at_city || '');
                break;
            case 'awards':
                searchTerms.push(item.title || '');
                searchTerms.push(item.institution || '');
                searchTerms.push(item.description || '');
                searchTerms.push(item.location || '');
                break;
            case 'teaching':
                searchTerms.push(item.title || '');
                searchTerms.push(item.institution || '');
                searchTerms.push(item.course || '');
                searchTerms.push(item.level || '');
                searchTerms.push(item.students || '');
                break;
        }
        
        return searchTerms.filter(term => term).join(' ').toLowerCase();
    }

    function renderCurriculumItems() {
        console.log('RENDERING CURRICULUM ITEMS:', filteredCurriculumItems.length);
        const container = $('#curriculum-list');
        const noResultsElement = $('#no-results');
        
        // Clear everything immediately
        container.empty();
        noResultsElement.hide();

        if (filteredCurriculumItems.length === 0) {
            console.log('NO CURRICULUM ITEMS TO SHOW');
            noResultsElement.show();
            updateResultsCount();
            return;
        }

        // Render items immediately
        filteredCurriculumItems.forEach((item) => {
            console.log('Creating curriculum item:', item);
            const itemHtml = createCurriculumItem(item);
            container.append(itemHtml);
        });
        
        updateResultsCount();
    }

    function createCurriculumItem(item) {
        console.log('Creating item:', item);
        
        // Handle research items (keyword tags)
        if (item.type === 'research') {
            return createResearchItem(item);
        }
        
        if (item.type === 'group') {
            return `
                <div class="group-item" data-id="${item.id}">
                    <div class="group-name">${item.name}</div>
                </div>
            `;
        }
        
        // Handle other types (degrees, contracts, awards, teaching) with full career item structure
        return createCareerItem(item);
    }

    function createResearchItem(item) {
        // Create research item with subtopics as tags if available
        let subtopicsHtml = '';
        if (item.subtopics && Array.isArray(item.subtopics)) {
            const nonEmptySubtopics = item.subtopics.filter(topic => topic && topic.trim());
            if (nonEmptySubtopics.length > 0) {
                subtopicsHtml = `
                    <div class="research-subtopics">
                        ${nonEmptySubtopics.map(topic => `<span class="research-tag">${topic}</span>`).join('')}
                    </div>
                `;
            }
        }
        
        return `
            <div class="research-item" data-id="${item.id}">
                <div class="research-header">
                    <div class="research-name">${item.title || item.name}</div>
                </div>
                ${subtopicsHtml}
            </div>
        `;
    }

    function createCareerItem(item) {
        console.log('Creating career item:', item);
        
        // Handle different JSON structures
        let mainTitle, organizationInfo, instituteInfo, teamInfo, referenceInfo, location, dates;

        // Check if this is contracts type
        if (item.type === 'contracts') {
            // Contracts structure
            mainTitle = item.contract_type || 'Fellowship/Contract';
            
            // From information
            const fromText = item.from || '';
            const fromLink = item.from_link || '';
            organizationInfo = fromLink ? 
                `<p><strong>From:</strong> <a href="${fromLink}" target="_blank">${fromText}</a></p>` :
                `<p><strong>From:</strong> ${fromText}</p>`;

            // At information  
            const atText = item.at || '';
            const atLink = item.at_link || '';
            instituteInfo = atLink ?
                `<p><strong>At:</strong> <a href="${atLink}" target="_blank">${atText}</a></p>` :
                `<p><strong>At:</strong> ${atText}</p>`;

            // Reference information
            const referenceText = item.reference || '';
            referenceInfo = referenceText ? `<p><strong>Reference:</strong> ${referenceText}</p>` : '';

            teamInfo = '';
            location = item.at_city || '';
            dates = item.dates || '';

        } else if (item.type === 'degrees') {
            // COMPLETE Degrees structure - EXACTLY as requested
            const degreeType = item.degree_type || '';
            const degreeField = item.degree_field || '';
            mainTitle = `${degreeType}`.trim();
            if (degreeField) {
                mainTitle += ` in ${degreeField}`;
            }

            // University information - COMPLETE FORMAT AS REQUESTED
            const university = item.degree_university || '';
            const universityLink = item.degree_university_link || '';
            organizationInfo = '';
            if (university) {
                organizationInfo = universityLink ?
                    `<p><strong>University:</strong> <a href="${universityLink}" target="_blank">${university}</a></p>` :
                    `<p><strong>University:</strong> ${university}</p>`;
            }

            // Institute information - AS REQUESTED
            const institution = item.degree_institution || '';
            const institutionLink = item.degree_institution_link || '';
            instituteInfo = '';
            if (institution) {
                instituteInfo = institutionLink ?
                    `<p><strong>Institute:</strong> <a href="${institutionLink}" target="_blank">${institution}</a></p>` :
                    `<p><strong>Institute:</strong> ${institution}</p>`;
            }

            // Team information - AS REQUESTED
            const team = item.degree_team || '';
            const teamLink = item.degree_team_link || '';
            teamInfo = '';
            if (team) {
                teamInfo = teamLink ?
                    `<p><strong>Team:</strong> <a href="${teamLink}" target="_blank">${team}</a></p>` :
                    `<p><strong>Team:</strong> ${team}</p>`;
            }

            // Advisors with links to Google Scholar - COMPLETE FORMAT AS REQUESTED
            referenceInfo = '';
            if (item.degree_advisors && Array.isArray(item.degree_advisors)) {
                const advisorLinks = item.degree_advisors.map(advisorName => {
                    const advisorData = authorsData[advisorName];
                    if (advisorData && advisorData.google_scholar_link) {
                        return `<a href="${advisorData.google_scholar_link}" target="_blank">${advisorData.name || advisorName}</a>`;
                    }
                    return advisorName;
                });
                referenceInfo = `<p><strong>Advisor${advisorLinks.length > 1 ? 's' : ''}:</strong> ${advisorLinks.join(', ')}</p>`;
            }

            // Location - AS REQUESTED: Madrid, Spain format
            const city = item.degree_university_city || item.degree_institution_city || '';
            location = city;
            
            // Dates - AS REQUESTED
            dates = item.degree_dates || '';

        } else {
            // Default structure for awards, teaching, etc.
            mainTitle = item.title || item.name || 'Item';
            organizationInfo = item.institution ? `<p><strong>Institution:</strong> ${item.institution}</p>` : '';
            instituteInfo = item.description ? `<p>${item.description}</p>` : '';
            teamInfo = '';
            referenceInfo = '';
            location = item.location || '';
            dates = item.dates || item.period || '';
        }

        const locationInfo = location ? 
            `<div class="career-location"><i class="fas fa-map-marker-alt"></i> ${location}</div>` : '';
        
        return `
            <div class="career-item" data-id="${item.id}">
                <div class="career-content">
                    <div class="career-main-info">
                        <div class="career-title">
                            <h3>${mainTitle}</h3>
                            <div class="career-details">
                                ${organizationInfo}
                                ${instituteInfo}
                                ${teamInfo}
                                ${referenceInfo}
                            </div>
                        </div>
                        <div class="career-period">${dates}</div>
                    </div>
                    ${locationInfo}
                </div>
            </div>
        `;
    }

    function extractStartYear(dateString) {
        if (!dateString) return 0;
        
        // Look for 4-digit year pattern
        const yearMatch = dateString.match(/\b(20\d{2}|19\d{2})\b/);
        return yearMatch ? parseInt(yearMatch[1]) : 0;
    }

    function setupFilters() {
        // Type filter change
        $('input[name="curriculum-type"]').on('change', function() {
            const selectedValue = $(this).val();
            $('.type-toggle-container').attr('data-selected', selectedValue);
            applyFilters();
        });
    }

    function setupSearch() {
        // Fixed to use correct ID that matches the HTML
        $('#publication-search').on('input', function() {
            applyFilters();
        });
    }

    function updateYearRange() {
        allYears = [...new Set(allCurriculumItems.map(item => extractStartYear(item.dates)))].filter(year => year > 0);
        allYears.sort((a, b) => a - b);
        
        const minYear = allYears[0] || 2018;
        const maxYear = allYears[allYears.length - 1] || 2027;
        
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
        
        // Generate ticks and labels separately to prevent overlap
        for (let year = minYear; year <= maxYear; year++) {
            const position = ((year - minYear) / (maxYear - minYear)) * 100;
            
            // Create tick mark
            const tick = $(`<div class="year-tick" style="left: ${position}%"></div>`);
            ticksContainer.append(tick);
            
            // Create label
            const label = $(`<div class="year-tick-label" style="left: ${position}%">${year}</div>`);
            ticksContainer.append(label);
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
        const count = filteredCurriculumItems.length;
        $('#results-count').text(`${count} result${count !== 1 ? 's' : ''}`);
    }

    function applyFilters() {
        console.log('APPLYING FILTERS...');
        
        const selectedType = $('input[name="curriculum-type"]:checked').val();
        const searchTerm = $('#publication-search').val().toLowerCase().trim();
        const minYear = parseInt($('#year-min').val());
        const maxYear = parseInt($('#year-max').val());
        
        console.log('Filter parameters:', { selectedType, searchTerm, minYear, maxYear });
        
        // Start with all curriculum items
        let filtered = [...allCurriculumItems];
        
        // Apply type filter
        if (selectedType) {
            filtered = filtered.filter(item => {
                console.log('Checking type filter:', item.type, 'vs', selectedType);
                return item.type === selectedType;
            });
        }
        
        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(item => {
                const matches = item.searchText.includes(searchTerm);
                if (matches) {
                    console.log('Search match:', item.id, 'for term:', searchTerm);
                }
                return matches;
            });
        }
        
        // Apply year filter (skip for research and group items which have no dates)
        if (selectedType !== 'research' && selectedType !== 'group') {
            filtered = filtered.filter(item => {
                const itemYear = extractStartYear(item.dates);
                if (itemYear === 0) return true; // Include items without dates
                return itemYear >= minYear && itemYear <= maxYear;
            });
        }
        
        console.log(`FINAL FILTERED RESULTS: ${filtered.length} curriculum items`);
        
        // Sort by date (most recent first), but keep research and group items in original order
        filtered.sort((a, b) => {
            if (a.type === 'research' || a.type === 'group' || 
                b.type === 'research' || b.type === 'group') {
                return 0; // Keep original order for research and group
            }
            const yearA = extractStartYear(a.dates);
            const yearB = extractStartYear(b.dates);
            return yearB - yearA;
        });
        
        filteredCurriculumItems = filtered;
        renderCurriculumItems();
    }
});