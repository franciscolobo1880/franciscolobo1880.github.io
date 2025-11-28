$(document).ready(function() {
    let conferencesData = {};
    let visitsData = {};
    let outreachData = {};
    let publicationsData = {};
    let thesisData = {};
    let authorsData = {};
    let map = null;
    let markersLayer = null;
    let allMarkers = [];
    let visitedCountries = new Set();
    let currentSelectedCoordinates = null;
    let activeSection = null; // Track which section is currently active
    
    console.log('Collaborations page loaded, starting data fetch...');

    // Load JSON data
    Promise.all([
        fetch('content/database/collaborations_conferences.json')
            .then(response => {
                console.log('Conferences response:', response.status, response.statusText);
                if (!response.ok) throw new Error(`Conferences: ${response.status}`);
                return response.json();
            })
            .catch(err => {
                console.error('Error loading conferences data:', err);
                return {};
            }),
        fetch('content/database/collaborations_visits.json')
            .then(response => {
                console.log('Visits response:', response.status, response.statusText);
                if (!response.ok) throw new Error(`Visits: ${response.status}`);
                return response.json();
            })
            .catch(err => {
                console.error('Error loading visits data:', err);
                return {};
            }),
        fetch('content/database/collaborations_outreach.json')
            .then(response => {
                console.log('Outreach response:', response.status, response.statusText);
                if (!response.ok) throw new Error(`Outreach: ${response.status}`);
                return response.json();
            })
            .catch(err => {
                console.error('Error loading outreach data:', err);
                return {};
            }),
        fetch('content/database/publications_papers.json')
            .then(response => {
                console.log('Publications response:', response.status, response.statusText);
                if (!response.ok) throw new Error(`Publications: ${response.status}`);
                return response.json();
            })
            .catch(err => {
                console.error('Error loading publications data:', err);
                return {};
            }),
        fetch('content/database/publications_thesis.json')
            .then(response => {
                console.log('Thesis response:', response.status, response.statusText);
                if (!response.ok) throw new Error(`Thesis: ${response.status}`);
                return response.json();
            })
            .catch(err => {
                console.error('Error loading thesis data:', err);
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
    ]).then(([conferences, visits, outreach, publications, thesis, authors]) => {
        console.log('All data loaded successfully!');
        console.log('Conferences data:', conferences);
        console.log('Visits data:', visits);
        console.log('Outreach data:', outreach);
        console.log('Publications data:', publications);
        console.log('Thesis data:', thesis);
        console.log('Authors data:', authors);
        
        conferencesData = conferences;
        visitsData = visits;
        outreachData = outreach;
        publicationsData = publications;
        thesisData = thesis;
        authorsData = authors;
        
        initializeLeafletMap();
        updateStatistics();
        setupStatClickEvents();
        renderContentSections();
        
    }).catch(error => {
        console.error('CRITICAL ERROR loading data:', error);
        showMapError(error);
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

        // Add minimalist grey tile layer (CartoDB Positron)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap contributors © CARTO',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(map);

        // Create marker cluster group with white numbers
        markersLayer = L.markerClusterGroup({
            maxClusterRadius: 50,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            iconCreateFunction: function(cluster) {
                return L.divIcon({
                    html: '<div><span>' + cluster.getChildCount() + '</span></div>',
                    className: 'marker-cluster',
                    iconSize: new L.Point(40, 40)
                });
            }
        });

        // Add conference markers
        Object.keys(conferencesData).forEach(key => {
            const conference = conferencesData[key];
            if (conference.coordinates) {
                addLeafletMarker(key, conference, 'conference');
            }
        });

        // Add visit markers
        Object.keys(visitsData).forEach(key => {
            const visit = visitsData[key];
            if (visit.coordinates) {
                addLeafletMarker(key, visit, 'visit');
            }
        });

        // Add outreach markers  
        Object.keys(outreachData).forEach(key => {
            const outreach = outreachData[key];
            if (outreach.coordinates) {
                addLeafletMarker(key, outreach, 'outreach');
            }
        });

        // Add markers to map
        map.addLayer(markersLayer);
    }

    function addLeafletMarker(id, data, type) {
        const coords = data.coordinates;
        
        if (!coords) {
            console.log(`No coordinates found for ${type} ${id}`);
            return;
        }
        
        // Skip items with empty coordinates (like online conferences)
        if (coords.trim() === '') {
            console.log(`Empty coordinates for ${type} ${id}`);
            return;
        }
        
        const [lat, lng] = coords.split(',').map(s => parseFloat(s.trim()));
        
        if (isNaN(lat) || isNaN(lng)) {
            console.log(`Invalid coordinates for ${type} ${id}: ${coords}`);
            return;
        }
        
        // Create custom marker with SOLID GREY color
        const marker = L.circleMarker([lat, lng], {
            radius: 8,
            fillColor: '#9b9b9bff',
            color: '#4a4a4aff',
            weight: 2,
            opacity: 1,
            fillOpacity: 1
        });

        // Store marker data
        marker.markerData = {
            id: id,
            type: type,
            data: data
        };

        // Add click event
        marker.on('click', function() {
            // Hide all sections when clicking on a pin
            hideAllSections();
            highlightMarker(marker);
            showPinInfo(data, type, coords);
        });

        // Add to collections
        allMarkers.push(marker);
        markersLayer.addLayer(marker);

        // Track visited countries
        let place;
        switch(type) {
            case 'conference':
                place = data.conference_place;
                break;
            case 'visit':
                place = data.visit_place;
                break;
            case 'outreach':
                place = data.outreach_place;
                break;
        }
        
        if (place) {
            const country = place.split(',').pop().trim();
            visitedCountries.add(country);
        }
    }

    function highlightMarker(selectedMarker) {
        // Reset all markers to solid grey
        allMarkers.forEach(marker => {
            marker.setStyle({
                fillColor: '#9b9b9bff',
                fillOpacity: 1
            });
        });

        // Highlight selected marker with yellow
        selectedMarker.setStyle({
            fillColor: '#F7D002',
            fillOpacity: 1
        });
    }

    function showPinInfo(data, type, coordinates) {
        const $info = $('#pin-info');
        
        // Store coordinates for reference
        currentSelectedCoordinates = coordinates;
        
        let title, location, date, typeDisplay;
        
        switch(type) {
            case 'conference':
                title = data.conference_name;
                location = data.conference_place;
                date = data.conference_date;
                typeDisplay = `Conference (${data.conference_medium})`;
                break;
            case 'visit':
                title = data.visit_institute;
                location = data.visit_place;
                date = data.visit_date;
                typeDisplay = 'Research Visit';
                break;
            case 'outreach':
                title = data.outreach_name || 'Outreach Activity';
                location = data.outreach_place;
                date = data.outreach_date;
                typeDisplay = 'Outreach';
                break;
        }
        
        $('#info-title').text(title);
        
        // Make location clickable to zoom to it - YELLOW COLOR for pin info
        $('#info-location').html(`<i class="fas fa-map-marker-alt" style="color: #F7D002;"></i> <strong>Location:</strong> <span class="clickable-location" data-coords="${coordinates}">${location}</span>`);
        $('#info-date').html(`<i class="fas fa-calendar" style="color: #F7D002;"></i> <strong>Date:</strong> ${date}`);
        $('#info-type').html(`<i class="fas fa-tag" style="color: #F7D002;"></i> <strong>Type:</strong> ${typeDisplay}`);
        
        // Handle additional info for research visits
        if (type === 'visit') {
            const topicInfo = data.visit_topic ? `<p><i class="fas fa-lightbulb" style="color: #F7D002;"></i> <strong>Topic:</strong> ${data.visit_topic}</p>` : '';
            $('#info-type').after(topicInfo);
        }
        
        // Handle collaborators
        const collaboratorsContainer = $('#info-collaborators');
        collaboratorsContainer.empty();
        
        let collaboratorKeys = [];
        for (let key in data) {
            if (key.includes('collaborator')) {
                collaboratorKeys.push(key);
            }
        }
        
        if (collaboratorKeys.length > 0) {
            let collaboratorsHtml = '<p><strong>Collaborators:</strong></p><div class="collaborators-list">';
            collaboratorKeys.forEach(key => {
                const authorId = data[key];
                const author = authorsData[authorId];
                if (author) {
                    if (author.google_scholar_link) {
                        collaboratorsHtml += `<a href="${author.google_scholar_link}" target="_blank" class="collaborator-link">${author.name}</a>`;
                    } else {
                        collaboratorsHtml += `<span class="collaborator-link">${author.name}</span>`;
                    }
                }
            });
            collaboratorsHtml += '</div>';
            collaboratorsContainer.html(collaboratorsHtml);
        }
        
        // Handle papers - Use paper key instead of full title
        const papersContainer = $('#info-papers');
        papersContainer.empty();
        
        if (data.conference_presented_work) {
            const presentedWork = data.conference_presented_work;
            if (presentedWork.work) {
                let paper = null;
                let publicationType = '';
                if (presentedWork.from === 'publications_papers.json') {
                    paper = publicationsData[presentedWork.work];
                    publicationType = 'papers';
                } else if (presentedWork.from === 'publications_thesis.json') {
                    paper = thesisData[presentedWork.work];
                    publicationType = 'thesis';
                }
                
                if (paper) {
                    const papersHtml = `
                        <p><strong>Presented Work:</strong></p>
                        <div class="papers-list">
                            <a href="publications.html?type=${publicationType}&highlight=${presentedWork.work}" class="paper-link dotted-link">${presentedWork.work}</a>
                        </div>
                    `;
                    papersContainer.html(papersHtml);
                }
            }
        }
        
        $info.show();
    }

    function zoomToLocation(coordinates) {
        if (!coordinates || coordinates.trim() === '') return;
        
        const [lat, lng] = coordinates.split(',').map(s => parseFloat(s.trim()));
        if (!isNaN(lat) && !isNaN(lng)) {
            map.setView([lat, lng], 10, {
                animate: true,
                duration: 1.0
            });
        }
    }

    function hideAllSections() {
        $('.content-section').hide();
        $('.stat-item').removeClass('active');
        resetAllMarkers();
        activeSection = null;
    }

    function setupStatClickEvents() {
        // Remove any existing event handlers
        $('.stat-item').off('click mouseenter mouseleave');
        
        // Conference talks click
        $('#talks-stat').on('click', function() {
            toggleSection('talks', 'talk');
        });

        // Conference posters click
        $('#posters-stat').on('click', function() {
            toggleSection('posters', 'poster');
        });

        // Invited talks click
        $('#invited-stat').on('click', function() {
            toggleSection('invited', 'invited');
        });

        // Visits click
        $('#visits-stat').on('click', function() {
            toggleSection('visits', 'visit');
        });

        // Outreach click
        $('#outreach-stat').on('click', function() {
            toggleSection('outreach', 'outreach');
        });
        
        // Add hover effects for visual feedback
        $('.stat-item').on('mouseenter', function() {
            if (!$(this).hasClass('active')) {
                $(this).addClass('hover');
            }
        }).on('mouseleave', function() {
            $(this).removeClass('hover');
        });
    }

    function toggleSection(sectionName, markerType) {
        const sectionId = `#${sectionName}-section`;
        const statId = `#${sectionName}-stat`;
        
        // Hide pin info when toggling sections
        $('#pin-info').hide();
        
        // If this section is already active, hide it
        if (activeSection === sectionName) {
            $(sectionId).hide();
            $(statId).removeClass('active');
            resetAllMarkers();
            activeSection = null;
        } else {
            // Hide all other sections and remove their active states
            $('.content-section').hide();
            $('.stat-item').removeClass('active');
            
            // Show this section and mark as active
            $(sectionId).show();
            $(statId).addClass('active');
            highlightMarkersByType(markerType);
            activeSection = sectionName;
            
            // REMOVED THE SCROLL BEHAVIOR - No more forced scrolling
        }
    }

    function highlightMarkersByType(targetType) {
        allMarkers.forEach(marker => {
            const markerType = marker.markerData.type;
            const markerData = marker.markerData.data;
            
            let shouldHighlight = false;
            
            if (targetType === 'talk' && markerType === 'conference' && markerData.conference_medium === 'talk') {
                shouldHighlight = true;
            } else if (targetType === 'poster' && markerType === 'conference' && markerData.conference_medium === 'poster') {
                shouldHighlight = true;
            } else if (targetType === 'invited' && markerType === 'conference' && markerData.conference_medium === 'invited') {
                shouldHighlight = true;
            } else if (targetType === markerType) {
                shouldHighlight = true;
            }
            
            if (shouldHighlight) {
                marker.setStyle({
                    fillColor: '#F7D002',
                    fillOpacity: 1
                });
            } else {
                marker.setStyle({
                    fillColor: '#9b9b9bff',
                    fillOpacity: 0.3
                });
            }
        });
        
        highlightClustersWithTargetType(targetType);
    }

    function highlightClustersWithTargetType(targetType) {
        const clusters = document.querySelectorAll('.marker-cluster');
        
        clusters.forEach(cluster => {
            const $cluster = $(cluster);
            let hasTargetType = false;
            
            // Get all markers in cluster
            markersLayer.eachLayer(function(layer) {
                if (layer instanceof L.MarkerClusterGroup) return;
                
                const markerType = layer.markerData ? layer.markerData.type : null;
                const markerData = layer.markerData ? layer.markerData.data : null;
                
                if (!markerType || !markerData) return;
                
                let isTargetType = false;
                
                if (targetType === 'talk' && markerType === 'conference' && markerData.conference_medium === 'talk') {
                    isTargetType = true;
                } else if (targetType === 'poster' && markerType === 'conference' && markerData.conference_medium === 'poster') {
                    isTargetType = true;
                } else if (targetType === 'invited' && markerType === 'conference' && markerData.conference_medium === 'invited') {
                    isTargetType = true;
                } else if (targetType === markerType) {
                    isTargetType = true;
                }
                
                if (isTargetType) {
                    const markerLatLng = layer.getLatLng();
                    const clusterBounds = markersLayer.getBounds();
                    
                    if (clusterBounds.contains(markerLatLng)) {
                        hasTargetType = true;
                    }
                }
            });
            
            if (hasTargetType) {
                $cluster.addClass('highlighted');
            } else {
                $cluster.removeClass('highlighted');
                $cluster.css('opacity', '0.3');
            }
        });
    }

    function resetAllMarkers() {
        allMarkers.forEach(marker => {
            marker.setStyle({
                fillColor: '#9b9b9bff',
                fillOpacity: 1
            });
        });
        
        const clusters = document.querySelectorAll('.marker-cluster');
        clusters.forEach(cluster => {
            $(cluster).removeClass('highlighted').css('opacity', '1');
        });
    }

    function updateStatistics() {
        let talks = 0, posters = 0, invited = 0;
        
        Object.values(conferencesData).forEach(conference => {
            switch(conference.conference_medium) {
                case 'talk':
                    talks++;
                    break;
                case 'poster':
                    posters++;
                    break;
                case 'invited':
                    invited++;
                    break;
            }
        });
        
        $('#talks-count').text(talks);
        $('#posters-count').text(posters);
        $('#invited-count').text(invited);
        $('#visits-count').text(Object.keys(visitsData).length);
        $('#outreach-count').text(Object.keys(outreachData).length);
    }

    function renderContentSections() {
        renderConferenceTalks();
        renderConferencePosters();
        renderInvitedTalks();
        renderVisits();
        renderOutreach();
    }

    function renderConferenceTalks() {
        const container = $('#talks-grid');
        container.empty();
        
        const talks = Object.keys(conferencesData).filter(key => 
            conferencesData[key].conference_medium === 'talk'
        );
        
        if (talks.length === 0) {
            container.html('<div class="loading-message">No conference talks available.</div>');
            return;
        }
        
        talks.forEach(key => {
            const conference = conferencesData[key];
            const card = createActivityCard(conference, 'talk', key);
            container.append(card);
        });
    }

    function renderConferencePosters() {
        const container = $('#posters-grid');
        container.empty();
        
        const posters = Object.keys(conferencesData).filter(key => 
            conferencesData[key].conference_medium === 'poster'
        );
        
        if (posters.length === 0) {
            container.html('<div class="loading-message">No conference posters available.</div>');
            return;
        }
        
        posters.forEach(key => {
            const conference = conferencesData[key];
            const card = createActivityCard(conference, 'poster', key);
            container.append(card);
        });
    }

    function renderInvitedTalks() {
        const container = $('#invited-grid');
        container.empty();
        
        const invited = Object.keys(conferencesData).filter(key => 
            conferencesData[key].conference_medium === 'invited'
        );
        
        if (invited.length === 0) {
            container.html('<div class="loading-message">No invited talks available.</div>');
            return;
        }
        
        invited.forEach(key => {
            const conference = conferencesData[key];
            const card = createActivityCard(conference, 'invited', key);
            container.append(card);
        });
    }

    function renderVisits() {
        const container = $('#visits-grid');
        container.empty();
        
        if (Object.keys(visitsData).length === 0) {
            container.html('<div class="loading-message">No research visits available.</div>');
            return;
        }
        
        Object.keys(visitsData).forEach(key => {
            const visit = visitsData[key];
            const card = createActivityCard(visit, 'visit', key);
            container.append(card);
        });
    }

    function renderOutreach() {
        const container = $('#outreach-grid');
        container.empty();
        
        if (Object.keys(outreachData).length === 0) {
            container.html('<div class="loading-message">No outreach activities available.</div>');
            return;
        }
        
        Object.keys(outreachData).forEach(key => {
            const outreach = outreachData[key];
            const card = createActivityCard(outreach, 'outreach', key);
            container.append(card);
        });
    }

    function createActivityCard(data, type, key) {
        let title, location, date, titleLink, topicInfo = '';
        
        switch(type) {
            case 'talk':
            case 'poster':
            case 'invited':
                title = data.conference_name;
                titleLink = data.conference_link || '#';
                location = data.conference_place;
                date = data.conference_date;
                break;
            case 'visit':
                title = data.visit_institute;
                titleLink = data.visit_institute_link || '#';
                location = data.visit_place;
                date = data.visit_date;
                topicInfo = data.visit_topic ? `
                    <div class="activity-topic">
                        <i class="fas fa-lightbulb"></i>
                        <strong>Topic:</strong> ${data.visit_topic}
                    </div>
                ` : '';
                break;
            case 'outreach':
                title = data.outreach_name || 'Outreach Activity';
                titleLink = data.outreach_link || '#';
                location = data.outreach_place;
                date = data.outreach_date;
                break;
        }
        
        let html = `
            <div class="activity-card">
                <h3><a href="${titleLink}" target="_blank" rel="noopener noreferrer" class="dotted-link">${title}</a></h3>
                ${topicInfo}
                <div class="activity-meta">
                    <i class="fas fa-map-marker-alt" style="color: #F7D002;"></i>
                    <span class="clickable-location" data-coords="${data.coordinates}">${location}</span>
                </div>
                <div class="activity-meta">
                    <i class="fas fa-calendar" style="color: #F7D002;"></i>
                    ${date}
                </div>
        `;
        
        // Add collaborators for visits (as simple links, not containers)
        if (type === 'visit') {
            let collaboratorKeys = [];
            for (let dataKey in data) {
                if (dataKey.includes('collaborator')) {
                    collaboratorKeys.push(dataKey);
                }
            }
            
            if (collaboratorKeys.length > 0) {
                html += '<div class="activity-collaborators-simple"><strong>Collaborators:</strong> ';
                const collaboratorLinks = [];
                collaboratorKeys.forEach(collabKey => {
                    const authorId = data[collabKey];
                    const author = authorsData[authorId];
                    if (author) {
                        if (author.google_scholar_link) {
                            collaboratorLinks.push(`<a href="${author.google_scholar_link}" target="_blank" class="simple-collaborator-link">${author.name}</a>`);
                        } else {
                            collaboratorLinks.push(`<span class="simple-collaborator-link">${author.name}</span>`);
                        }
                    }
                });
                html += collaboratorLinks.join(', ') + '</div>';
            }
        }
        
        // Add presented work if available - Use paper key instead of full title
        if (data.conference_presented_work && data.conference_presented_work.work) {
            const presentedWork = data.conference_presented_work;
            let paper = null;
            let publicationType = '';
            if (presentedWork.from === 'publications_papers.json') {
                paper = publicationsData[presentedWork.work];
                publicationType = 'papers';
            } else if (presentedWork.from === 'publications_thesis.json') {
                paper = thesisData[presentedWork.work];
                publicationType = 'thesis';
            }
            
            if (paper) {
                html += `
                    <div class="activity-presented-work">
                        <strong>Presented Work:</strong> 
                        <a href="publications.html?type=${publicationType}&highlight=${presentedWork.work}" class="dotted-link">${presentedWork.work}</a>
                    </div>
                `;
            }
        }
        
        html += '</div>';
        
        return html;
    }

    // Setup location click handlers after cards are created
    $(document).on('click', '.clickable-location', function() {
        const coords = $(this).data('coords');
        zoomToLocation(coords);
    });

    function showMapError(error) {
        $('#world-map').html(`
            <div class="loading-map">
                <div style="text-align: center;">
                    <p><i class="fas fa-exclamation-triangle" style="color: #F7D002; font-size: 2em; margin-bottom: 0.5em;"></i></p>
                    <p>Error loading map data:</p>
                    <p style="font-size: 0.9em; opacity: 0.8;">${error.message}</p>
                </div>
            </div>
        `);
    }
});