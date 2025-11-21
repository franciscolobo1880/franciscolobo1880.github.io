/* filepath: /home/lobo/GitHub/franciscolobo1880.github.io/assets/js/collaborations.js */
$(document).ready(function() {
    let conferencesData = {};
    let visitsData = {};
    let publicationsData = {};
    let thesisData = {};
    let map = null;
    let markersLayer = null;
    let allMarkers = [];
    let visitedCountries = new Set();
    let currentSelectedCoordinates = null;
    
    console.log('Collaborations page loaded, starting data fetch...');

    // Load JSON data including publications AND thesis
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
            })
    ]).then(([conferences, visits, publications, thesis]) => {
        console.log('All data loaded successfully!');
        console.log('Conferences data:', conferences);
        console.log('Visits data:', visits);
        console.log('Publications data:', publications);
        console.log('Thesis data:', thesis);
        
        conferencesData = conferences;
        visitsData = visits;
        publicationsData = publications;
        thesisData = thesis;
        
        initializeLeafletMap();
        updateStatistics();
        setupStatHoverEvents();
        
    }).catch(error => {
        console.error('CRITICAL ERROR loading data:', error);
        showMapError(error);
    });

    function initializeLeafletMap() {
        // Initialize the map
        map = L.map('world-map', {
            center: [40, 0], // Center on Europe/Africa
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
                    html: '<div><span style="font-weight: 900; font-size: 14px; color: white; text-shadow: 1px 1px 2px rgba(0,0,0,0.7);">' + cluster.getChildCount() + '</span></div>',
                    className: 'marker-cluster',
                    iconSize: L.point(40, 40)
                });
            }
        });

        // Add conference markers
        Object.keys(conferencesData).forEach(key => {
            const conference = conferencesData[key];
            if (conference.conference_coordinates && conference.conference_coordinates.trim()) {
                addLeafletMarker(key, conference, 'conference');
            }
        });

        // Add visit markers
        Object.keys(visitsData).forEach(key => {
            const visit = visitsData[key];
            if (visit.visit_coordinates && visit.visit_coordinates.trim()) {
                addLeafletMarker(key, visit, 'visit');
            }
        });

        // Add markers to map
        map.addLayer(markersLayer);
    }

    function addLeafletMarker(id, data, type) {
        const coords = type === 'conference' ? data.conference_coordinates : data.visit_coordinates;
        const [lat, lng] = coords.split(',').map(s => parseFloat(s.trim()));
        
        // Create custom marker with SOLID GREY color
        const marker = L.circleMarker([lat, lng], {
            radius: 8,
            fillColor: '#9b9b9bff', // lighter_grey (solid color)
            color: '#4a4a4aff', // dark_grey for border
            weight: 2,
            opacity: 1,
            fillOpacity: 1 // Solid, not transparent
        });

        // Store marker data
        marker.markerData = {
            id: id,
            type: type,
            data: data
        };

        // Add click event
        marker.on('click', function() {
            showPinInfo(data, type, coords);
            
            // Highlight this marker
            highlightMarker(marker);
        });

        // Add to collections
        allMarkers.push(marker);
        markersLayer.addLayer(marker);

        // Track visited countries (still needed for counting)
        const place = type === 'conference' ? data.conference_place : data.visit_place;
        if (place) {
            const country = place.split(',').pop().trim();
            visitedCountries.add(country);
        }
    }

    function highlightMarker(selectedMarker) {
        // Reset all markers to solid grey
        allMarkers.forEach(marker => {
            marker.setStyle({
                fillColor: '#9b9b9bff', // lighter_grey
                fillOpacity: 1
            });
        });

        // Highlight selected marker with yellow
        selectedMarker.setStyle({
            fillColor: '#F7D002', // toasted_yellow
            fillOpacity: 1
        });
    }

    function showPinInfo(data, type, coordinates) {
        const $info = $('#pin-info');
        
        // Store coordinates for reference
        currentSelectedCoordinates = coordinates;
        
        if (type === 'conference') {
            $('#info-title').text(data.conference_name || 'Conference');
            $('#info-location').html(`
                <i class="fas fa-map-marker-alt"></i> <strong>Location:</strong> ${data.conference_place || 'Unknown location'}
            `);
            $('#info-date').html(`
                <i class="fas fa-calendar-alt"></i> <strong>Date:</strong> ${data.conference_date || 'N/A'}
            `);
            $('#info-type').html(`
                <i class="fas fa-tag"></i> <strong>Type:</strong> ${data.conference_medium || 'N/A'}
            `);
            
            // Handle conference website link
            if (data.conference_link && data.conference_link.trim()) {
                $('#conference-website a').attr('href', data.conference_link);
                $('#conference-website').show();
            } else {
                $('#conference-website').hide();
            }
            
            // Handle presented work - FIXED METHOD
            if (data.conference_presented_work && data.conference_presented_work.trim()) {
                const publicationKey = data.conference_presented_work;
                
                // Check both publications and thesis
                let publication = publicationsData[publicationKey];
                let toggleValue = 'papers';
                
                if (!publication) {
                    publication = thesisData[publicationKey];
                    toggleValue = 'thesis';
                }
                
                if (publication) {
                    // Create URL that will be handled by publications.js
                    const publicationUrl = `publications.html?toggle=${toggleValue}&search=${encodeURIComponent(publication.name)}`;
                    $('#publication-link').attr('href', publicationUrl);
                    $('#presented-work').show();
                    console.log(`Created publication link: ${publicationUrl}`); // Debug
                    console.log(`Publication found:`, publication); // Debug
                } else {
                    $('#presented-work').hide();
                    console.log(`No publication found for key: ${publicationKey}`); // Debug
                }
            } else {
                $('#presented-work').hide();
            }
            
            // Hide visit-specific elements
            $('#visit-website').hide();
            
        } else {
            $('#info-title').text(data.visit_institution || 'Research Visit');
            $('#info-location').html(`
                <i class="fas fa-map-marker-alt"></i> <strong>Location:</strong> ${data.visit_place || 'Unknown location'}
            `);
            $('#info-date').html(`
                <i class="fas fa-calendar-alt"></i> <strong>Date:</strong> ${data.visit_date || 'N/A'}
            `);
            $('#info-type').html(`
                <i class="fas fa-clock"></i> <strong>Duration:</strong> ${data.visit_duration || 'N/A'}
            `);
            
            // Hide conference-specific elements
            $('#conference-website').hide();
            $('#presented-work').hide();
            
            if (data.visit_link && data.visit_link.trim()) {
                $('#visit-website a').attr('href', data.visit_link);
                $('#visit-website').show();
            } else {
                $('#visit-website').hide();
            }
        }
        
        $info.show();
    }

    function setupStatHoverEvents() {
        // Conferences hover
        $('#conferences-stat').on('mouseenter', function() {
            highlightMarkersByType('conference');
            $(this).addClass('active');
        }).on('mouseleave', function() {
            resetAllMarkers();
            $(this).removeClass('active');
        });

        // Visits hover
        $('#visits-stat').on('mouseenter', function() {
            highlightMarkersByType('visit');
            $(this).addClass('active');
        }).on('mouseleave', function() {
            resetAllMarkers();
            $(this).removeClass('active');
        });
    }

    function highlightMarkersByType(targetType) {
        console.log(`Highlighting markers of type: ${targetType}`); // Debug
        
        // First, highlight individual markers
        allMarkers.forEach(marker => {
            if (marker.markerData.type === targetType) {
                marker.setStyle({
                    fillColor: '#F7D002', // toasted_yellow
                    fillOpacity: 1
                });
            } else {
                marker.setStyle({
                    fillColor: '#9b9b9bff', // lighter_grey
                    fillOpacity: 0.5 // Dimmed
                });
            }
        });

        // IMPROVED cluster highlighting with proper layer access
        setTimeout(() => {
            highlightClustersWithTargetType(targetType);
        }, 100); // Small delay to ensure clusters are rendered
    }

    function highlightClustersWithTargetType(targetType) {
        console.log(`Attempting to highlight clusters for type: ${targetType}`); // Debug
        
        // Access clusters through the cluster layer's _layers
        if (markersLayer._layers) {
            Object.values(markersLayer._layers).forEach(layer => {
                // Check if this is a cluster with child markers
                if (layer._markers && layer._markers.length > 0) {
                    const hasTargetType = layer._markers.some(childMarker => {
                        return childMarker.markerData && childMarker.markerData.type === targetType;
                    });
                    
                    console.log(`Cluster has ${layer._markers.length} markers, contains ${targetType}: ${hasTargetType}`); // Debug
                    
                    // Apply highlighting to the cluster icon
                    if (layer._icon) {
                        if (hasTargetType) {
                            layer._icon.style.backgroundColor = '#F7D002'; // toasted_yellow
                            const innerDiv = layer._icon.querySelector('div');
                            if (innerDiv) {
                                innerDiv.style.backgroundColor = '#F7D002';
                            }
                            console.log(`Highlighted cluster with ${layer._markers.length} markers`); // Debug
                        } else {
                            layer._icon.style.backgroundColor = '#9b9b9bff'; // lighter_grey
                            const innerDiv = layer._icon.querySelector('div');
                            if (innerDiv) {
                                innerDiv.style.backgroundColor = '#9b9b9bff';
                            }
                        }
                    }
                }
            });
        }

        // ALTERNATIVE: Also check through _featureGroup if available
        if (markersLayer._featureGroup && markersLayer._featureGroup._layers) {
            Object.values(markersLayer._featureGroup._layers).forEach(layer => {
                if (layer._childClusters || layer._markers) {
                    const allChildMarkers = layer.getAllChildMarkers ? layer.getAllChildMarkers() : [];
                    
                    if (allChildMarkers.length > 0) {
                        const hasTargetType = allChildMarkers.some(childMarker => {
                            return childMarker.markerData && childMarker.markerData.type === targetType;
                        });
                        
                        if (layer._icon) {
                            if (hasTargetType) {
                                layer._icon.style.backgroundColor = '#F7D002'; // toasted_yellow
                                const innerDiv = layer._icon.querySelector('div');
                                if (innerDiv) {
                                    innerDiv.style.backgroundColor = '#F7D002';
                                }
                            } else {
                                layer._icon.style.backgroundColor = '#9b9b9bff'; // lighter_grey
                                const innerDiv = layer._icon.querySelector('div');
                                if (innerDiv) {
                                    innerDiv.style.backgroundColor = '#9b9b9bff';
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    function resetAllMarkers() {
        // Reset individual markers
        allMarkers.forEach(marker => {
            marker.setStyle({
                fillColor: '#9b9b9bff', // lighter_grey
                fillOpacity: 1
            });
        });

        // Reset cluster colors through both possible layer structures
        if (markersLayer._layers) {
            Object.values(markersLayer._layers).forEach(layer => {
                if (layer._icon) {
                    layer._icon.style.backgroundColor = '#9b9b9bff'; // lighter_grey
                    const innerDiv = layer._icon.querySelector('div');
                    if (innerDiv) {
                        innerDiv.style.backgroundColor = '#9b9b9bff';
                    }
                }
            });
        }

        if (markersLayer._featureGroup && markersLayer._featureGroup._layers) {
            Object.values(markersLayer._featureGroup._layers).forEach(layer => {
                if (layer._icon) {
                    layer._icon.style.backgroundColor = '#9b9b9bff'; // lighter_grey
                    const innerDiv = layer._icon.querySelector('div');
                    if (innerDiv) {
                        innerDiv.style.backgroundColor = '#9b9b9bff';
                    }
                }
            });
        }
    }

    function updateStatistics() {
        const conferencesCount = Object.keys(conferencesData).length;
        const visitsCount = Object.keys(visitsData).length;
        
        // STATIC counters - no animation
        $('#conferences-count').text(conferencesCount);
        $('#visits-count').text(visitsCount);
        
        console.log(`Static counts set: Conferences=${conferencesCount}, Visits=${visitsCount}`); // Debug
    }

    function showMapError(error) {
        $('#world-map').html(`
            <div class="loading-map">
                <div style="text-align: center;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2em; margin-bottom: 0.5em; color: #F7D002;"></i>
                    <p>Error loading map data: ${error.message}</p>
                    <p>Please try refreshing the page.</p>
                </div>
            </div>
        `);
    }
});