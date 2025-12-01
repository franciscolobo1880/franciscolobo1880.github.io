$(document).ready(function() {
    let allCollaborations = [];
    let authorsData = {};
    let publicationsData = {};
    let thesisData = {};
    let filteredCollaborations = [];
    let allYears = [];
    let map = null;
    let markersLayer = null;

    console.log('Collaborations page loaded, starting data fetch...');

    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const urlType = urlParams.get('type');
    
    console.log('URL parameters:', { type: urlType });

    // Load JSON data
    Promise.all([
        fetch('content/database/collaborations_conferences.json')
            .then(response => {
                console.log('Conferences response:', response.status, response.statusText);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .catch(err => {
                console.error('Error loading conferences data:', err);
                return {};
            }),
        fetch('content/database/collaborations_visits.json')
            .then(response => {
                console.log('Visits response:', response.status, response.statusText);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .catch(err => {
                console.error('Error loading visits data:', err);
                return {};
            }),
        fetch('content/database/collaborations_outreach.json')
            .then(response => {
                console.log('Outreach response:', response.status, response.statusText);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .catch(err => {
                console.error('Error loading outreach data:', err);
                return {};
            }),
        fetch('content/database/publications_papers.json')
            .then(response => {
                console.log('Publications response:', response.status, response.statusText);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .catch(err => {
                console.error('Error loading publications data:', err);
                return {};
            }),
        fetch('content/database/publications_thesis.json')
            .then(response => {
                console.log('Thesis response:', response.status, response.statusText);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .catch(err => {
                console.error('Error loading thesis data:', err);
                return {};
            }),
        fetch('content/database/publications_authors.json')
            .then(response => {
                console.log('Authors response:', response.status, response.statusText);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .catch(err => {
                console.error('Error loading authors data:', err);
                return {};
            })
    ]).then(([conferences, visits, outreach, publications, thesis, authors]) => {
        console.log('All data loaded successfully!');
        
        publicationsData = publications;
        thesisData = thesis;
        authorsData = authors;
        allCollaborations = [];
        
        // Process conferences by type (talks, posters, invited)
        Object.keys(conferences).forEach(key => {
            const conf = conferences[key];
            if (conf.conference_date && conf.conference_name) {
                const medium = conf.conference_medium || 'talk';
                let type = 'talks'; // default
                
                if (medium === 'poster') {
                    type = 'posters';
                } else if (medium === 'invited' || conf.conference_name.toLowerCase().includes('invited')) {
                    type = 'invited';
                } else {
                    type = 'talks';
                }
                
                allCollaborations.push({
                    id: key,
                    type: type,
                    title: conf.conference_name,
                    date: conf.conference_date,
                    place: conf.conference_place || '',
                    coordinates: conf.coordinates || '',
                    link: conf.conference_link || '',
                    medium: medium,
                    presentedWork: conf.conference_presented_work || null,
                    year: extractYear(conf.conference_date),
                    data: conf
                });
            }
        });
        
        // Process visits
        Object.keys(visits).forEach(key => {
            const visit = visits[key];
            if (visit.visit_date && visit.visit_institute) {
                const collaborators = [];
                for (let i = 1; i <= 10; i++) {
                    const collab = visit[`visit_collaborator${i.toString().padStart(2, '0')}`];
                    if (collab && collab.trim()) {
                        collaborators.push(collab.trim());
                    }
                }
                
                allCollaborations.push({
                    id: key,
                    type: 'visits',
                    title: visit.visit_institute,
                    date: visit.visit_date,
                    place: visit.visit_place || '',
                    coordinates: visit.coordinates || '',
                    link: visit.visit_institute_link || '',
                    topic: visit.visit_topic || '',
                    collaborators: collaborators,
                    year: extractYear(visit.visit_date),
                    data: visit
                });
            }
        });
        
        // Process outreach
        Object.keys(outreach).forEach(key => {
            const out = outreach[key];
            if (out.outreach_date && out.outreach_name) {
                allCollaborations.push({
                    id: key,
                    type: 'outreach',
                    title: out.outreach_name,
                    date: out.outreach_date,
                    place: out.outreach_place || '',
                    coordinates: out.coordinates || '',
                    link: out.outreach_link || '',
                    audience: out.outreach_audience || '',
                    year: extractYear(out.outreach_date),
                    data: out
                });
            }
        });
        
        console.log('FINAL PROCESSED COLLABORATIONS:', allCollaborations);
        
        // Set initial filter based on URL parameter or default to talks
        const initialType = urlType || 'talks';
        $(`#type-${initialType}`).prop('checked', true);
        $('.type-toggle-container').attr('data-selected', initialType);
        
        initializeLeafletMap();
        setupFilters();
        setupSearch();
        updateYearRange();
        generateYearTicks();
        updateSliderRange();
        
        // Apply initial filter
        applyFilters();
        
    }).catch(error => {
        console.error('CRITICAL ERROR loading data:', error);
        $('#collaborations-list').html('<p style="color: red; padding: 20px;">Error loading collaborations: ' + error.message + '</p>');
        $('#results-count').text('Error loading data');
    });

    function initializeLeafletMap() {
        // Initialize the map
        map = L.map('world-map', {
            center: [40, 0],
            zoom: 2,
            minZoom: 2,
            maxZoom: 18,
            zoomControl: true,
            worldCopyJump: true
        });

        // Add minimalist grey tile layer
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap contributors © CARTO',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(map);

        // Create marker cluster group
        markersLayer = L.markerClusterGroup({
            maxClusterRadius: 50,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            iconCreateFunction: function(cluster) {
                return L.divIcon({
                    html: '<span>' + cluster.getChildCount() + '</span>',
                    className: 'marker-cluster',
                    iconSize: [30, 30]
                });
            }
        });

        // Add markers to map
        map.addLayer(markersLayer);
        
        // Update markers when filters change
        updateMapMarkers();
    }

    function updateMapMarkers() {
        if (!markersLayer) return;
        
        // Clear existing markers
        markersLayer.clearLayers();
        
        // Add markers for filtered collaborations
        filteredCollaborations.forEach(collab => {
            if (collab.coordinates && collab.coordinates.trim() !== '') {
                const coords = collab.coordinates.split(',').map(s => parseFloat(s.trim()));
                
                if (!isNaN(coords[0]) && !isNaN(coords[1])) {
                    // Create CircleMarker with darker grey border
                    const marker = L.circleMarker([coords[0], coords[1]], {
                        radius: 6,
                        fillColor: '#9b9b9bff',
                        color: '#4a4a4aff',  // Changed to darker grey border
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 1
                    });

                    // Bind tooltip with proper Leaflet configuration
                    marker.bindTooltip(collab.title, {
                        direction: 'top',
                        offset: [0, -10],
                        opacity: 1,
                        className: 'collaboration-tooltip'
                    });

                    // Add hover effects
                    marker.on('mouseover', function(e) {
                        this.setStyle({
                            radius: 8,
                            fillColor: '#F7D002'
                        });
                        this.openTooltip();
                    });

                    marker.on('mouseout', function(e) {
                        this.setStyle({
                            radius: 6,
                            fillColor: '#9b9b9bff'
                        });
                        this.closeTooltip();
                    });

                    markersLayer.addLayer(marker);
                }
            }
        });
    }

    function extractYear(dateString) {
        const match = dateString.match(/\d{4}/);
        return match ? parseInt(match[0]) : new Date().getFullYear();
    }

    function setupFilters() {
        $('input[name="collaboration-type"]').on('change', function() {
            const selectedType = $(this).val();
            $('.type-toggle-container').attr('data-selected', selectedType);
            applyFilters();
        });
    }

    function setupSearch() {
        $('#collaboration-search').on('input', function() {
            applyFilters();
        });
    }

    function updateYearRange() {
        if (allCollaborations.length === 0) return;
        
        allYears = allCollaborations.map(collab => collab.year).filter(year => !isNaN(year));
        
        if (allYears.length === 0) return;
        
        const minYear = Math.min(...allYears);
        const maxYear = Math.max(...allYears);
        
        $('#year-min, #year-max').attr('min', minYear).attr('max', maxYear);
        $('#year-min').val(minYear);
        $('#year-max').val(maxYear);
    }

    function generateYearTicks() {
        if (allYears.length === 0) return;
        
        const minYear = Math.min(...allYears);
        const maxYear = Math.max(...allYears);
        const yearRange = maxYear - minYear;
        
        const $ticks = $('#year-ticks');
        $ticks.empty();
        
        if (yearRange <= 6) {
            for (let year = minYear; year <= maxYear; year++) {
                const position = ((year - minYear) / yearRange) * 100;
                $ticks.append(`<div class="year-tick" style="left: ${position}%"><div class="year-tick-label">${year}</div></div>`);
            }
        } else {
            const step = Math.ceil(yearRange / 5);
            for (let year = minYear; year <= maxYear; year += step) {
                const position = ((year - minYear) / yearRange) * 100;
                $ticks.append(`<div class="year-tick" style="left: ${position}%"><div class="year-tick-label">${year}</div></div>`);
            }
        }
    }

    function updateSliderRange() {
        const minVal = parseInt($('#year-min').val());
        const maxVal = parseInt($('#year-max').val());
        const minYear = parseInt($('#year-min').attr('min'));
        const maxYear = parseInt($('#year-min').attr('max'));
        
        if (maxYear > minYear) {
            const minPercent = ((minVal - minYear) / (maxYear - minYear)) * 100;
            const maxPercent = ((maxVal - minYear) / (maxYear - minYear)) * 100;
            
            $('.year-slider-range').css({
                'left': minPercent + '%',
                'width': (maxPercent - minPercent) + '%'
            });
        }
    }

    $('#year-min, #year-max').on('input', function() {
        const minVal = parseInt($('#year-min').val());
        const maxVal = parseInt($('#year-max').val());
        
        if (minVal > maxVal) {
            if ($(this).attr('id') === 'year-min') {
                $('#year-max').val(minVal);
            } else {
                $('#year-min').val(maxVal);
            }
        }
        
        updateSliderRange();
        applyFilters();
    });

    function applyFilters() {
        const selectedType = $('input[name="collaboration-type"]:checked').val();
        const searchTerm = $('#collaboration-search').val().toLowerCase();
        const minYear = parseInt($('#year-min').val());
        const maxYear = parseInt($('#year-max').val());
        
        console.log('Applying filters:', { selectedType, searchTerm, minYear, maxYear });
        
        filteredCollaborations = allCollaborations.filter(collab => {
            // Type filter
            if (collab.type !== selectedType) return false;
            
            // Year filter
            if (collab.year < minYear || collab.year > maxYear) return false;
            
            // Search filter
            if (searchTerm) {
                const searchableText = [
                    collab.title,
                    collab.place,
                    collab.topic || '',
                    collab.medium || '',
                    collab.audience || '',
                    ...(collab.collaborators || [])
                ].join(' ').toLowerCase();
                
                if (!searchableText.includes(searchTerm)) return false;
            }
            
            return true;
        });
        
        console.log('Filtered collaborations:', filteredCollaborations.length);
        
        renderCollaborations();
        updateMapMarkers();
    }

    function renderCollaborations() {
        const container = $('#collaborations-list');
        const noResultsElement = $('#no-results');
        
        container.empty();
        noResultsElement.hide();

        if (filteredCollaborations.length === 0) {
            noResultsElement.show();
            $('#results-count').text('0 results');
            return;
        }

        // Sort by year (newest first)
        const sorted = [...filteredCollaborations].sort((a, b) => b.year - a.year);

        sorted.forEach((collab) => {
            const item = createCollaborationItem(collab);
            container.append(item);
        });
        
        updateResultsCount();
    }

    function createCollaborationItem(collab) {
        let html = `
            <div class="collaboration-item">
                <div class="collaboration-title">
                    <h3>
        `;
        
        if (collab.link) {
            html += `<a href="${collab.link}" target="_blank" rel="noopener">${collab.title}</a>`;
        } else {
            html += collab.title;
        }
        
        html += `</h3></div><div class="collaboration-meta">`;
        
        // Date and place
        if (collab.date) {
            html += `<p><i class="fas fa-calendar"></i><strong>Date:</strong> ${collab.date}</p>`;
        }
        
        if (collab.place) {
            html += `<p><i class="fas fa-map-marker-alt"></i><strong>Place:</strong> ${collab.place}</p>`;
        }
        
        // Type-specific information
        if (collab.type === 'visits') {
            if (collab.topic) {
                html += `<p><i class="fas fa-lightbulb"></i><strong>Topic:</strong> ${collab.topic}</p>`;
            }
            
            if (collab.collaborators && collab.collaborators.length > 0) {
                html += `<p><i class="fas fa-users"></i><strong>Collaborators:</strong> `;
                const collaboratorLinks = collab.collaborators.map(collaborator => {
                    // Look for author by name in authorsData
                    const authorKey = Object.keys(authorsData).find(key => 
                        authorsData[key].name && authorsData[key].name.toLowerCase() === collaborator.toLowerCase()
                    );
                    
                    if (authorKey && authorsData[authorKey]) {
                        return `<span class="author-link">${authorsData[authorKey].name}</span>`;
                    } else {
                        return `<span>${collaborator}</span>`;
                    }
                });
                html += collaboratorLinks.join(', ') + `</p>`;
            }
        } else if (collab.type === 'outreach') {
            if (collab.audience) {
                html += `<p><i class="fas fa-users"></i><strong>Audience:</strong> ${collab.audience}</p>`;
            }
        }
        
        html += `</div>`;
        
        // Links section
        html += `<div class="collaboration-links">`;
        
        // Conference website link (only for conferences)
        if ((collab.type === 'talks' || collab.type === 'posters' || collab.type === 'invited') && collab.link) {
            html += `<a href="${collab.link}" target="_blank" class="collaboration-link">
                <i class="fas fa-globe"></i>Conference
            </a>`;
        }
        
        // Presented work (only for conferences with work) - Always shows "Presented work" and links to publications page
        if ((collab.type === 'talks' || collab.type === 'posters' || collab.type === 'invited') && 
            collab.presentedWork && collab.presentedWork.work) {
            
            // Determine the publication type based on the work reference
            let publicationType = 'papers'; // default
            if (collab.presentedWork.from === 'publications_thesis.json') {
                publicationType = 'thesis';
            } else if (collab.presentedWork.from === 'publications_papers.json') {
                publicationType = 'papers';
            }
            
            // Create link to publications page with search term pre-filled
            const publicationsUrl = `publications.html?type=${publicationType}&highlight=${collab.presentedWork.work}`;
            
            html += `<a href="${publicationsUrl}" class="collaboration-link">
                <i class="fas fa-file-alt"></i>Presented work
            </a>`;
        }
        
        html += `</div></div>`;
        
        return $(html);
    }

    function updateResultsCount() {
        const count = filteredCollaborations.length;
        $('#results-count').text(`${count} result${count !== 1 ? 's' : ''}`);
    }
});