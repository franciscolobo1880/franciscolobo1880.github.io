$(document).ready(function() {
    let degreesData = {};
    let contractsData = {};
    let awardsData = {};
    let teachingData = {};

    console.log('Curriculum page loaded, starting data fetch...');

    // Load JSON files
    Promise.all([
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
            })
    ]).then(([degrees, contracts, awards, teaching]) => {
        console.log('Curriculum data loaded successfully!');
        console.log('Degrees data:', degrees);
        console.log('Contracts data:', contracts);
        console.log('Awards data:', awards);
        console.log('Teaching data:', teaching);
        
        degreesData = degrees;
        contractsData = contracts;
        awardsData = awards;
        teachingData = teaching;
        
        renderDegreesTimeline();
        renderContractsTimeline();
        renderAwardsTimeline();
        renderTeachingTimeline();
        setupSubsectionNavigation();
        
    }).catch(error => {
        console.error('CRITICAL ERROR loading Curriculum data:', error);
        showErrorMessage('#degrees-timeline', 'Error loading degrees data: ' + error.message);
        showErrorMessage('#contracts-timeline', 'Error loading contracts data: ' + error.message);
        showErrorMessage('#awards-timeline', 'Error loading awards data: ' + error.message);
        showErrorMessage('#teaching-timeline', 'Error loading teaching data: ' + error.message);
    });

    function renderDegreesTimeline() {
        renderTimeline('#degrees-timeline', degreesData, 'No academic degrees data available.');
    }

    function renderContractsTimeline() {
        renderTimeline('#contracts-timeline', contractsData, 'No contracts and fellowships data available.');
    }

    function renderAwardsTimeline() {
        // Check if awards data is empty (just {})
        if (!awardsData || Object.keys(awardsData).length === 0) {
            $('#awards-timeline').html('<div class="loading-message">No awards data available.</div>');
            return;
        }
        renderTimeline('#awards-timeline', awardsData, 'No awards data available.');
    }

    function renderTeachingTimeline() {
        // Check if teaching data is empty (just {})
        if (!teachingData || Object.keys(teachingData).length === 0) {
            $('#teaching-timeline').html('<div class="loading-message">No teaching data available.</div>');
            return;
        }
        renderTimeline('#teaching-timeline', teachingData, 'No teaching data available.');
    }

    function renderTimeline(containerId, data, emptyMessage) {
        const container = $(containerId);
        container.empty();

        if (!data || Object.keys(data).length === 0) {
            container.html(`<div class="loading-message">${emptyMessage}</div>`);
            return;
        }

        // Convert to array and sort by start year (most recent first)
        const items = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
        })).sort((a, b) => {
            const yearA = extractStartYear(a.career_dates || a.dates);
            const yearB = extractStartYear(b.career_dates || b.dates);
            return yearB - yearA; // Most recent first
        });

        items.forEach(item => {
            const itemHtml = createCareerItem(item);
            container.append(itemHtml);
        });
    }

    function createCareerItem(item) {
        console.log('Creating item:', item); // Debug log
        
        // Handle different JSON structures
        let mainTitle, organizationInfo, instituteInfo, referenceInfo, location, dates;

        // Check if this is new contracts structure (has 'type' field)
        if (item.type) {
            // New contracts structure
            mainTitle = item.type || 'Fellowship/Contract';

            // Organization that grants the fellowship
            organizationInfo = item.from ? 
                (item.from_link ? 
                    `<p><strong>From:</strong> <a href="${item.from_link}" target="_blank" rel="noopener noreferrer">${item.from}</a></p>` : 
                    `<p><strong>From:</strong> ${item.from}</p>`) : 
                '';

            // Institution where the fellowship is conducted
            instituteInfo = item.at ? 
                (item.at_link ? 
                    `<p><strong>At:</strong> <a href="${item.at_link}" target="_blank" rel="noopener noreferrer">${item.at}</a></p>` : 
                    `<p><strong>At:</strong> ${item.at}</p>`) : 
                '';

            // Reference number
            referenceInfo = item.reference ? 
                `<p><strong>Reference:</strong> ${item.reference}</p>` : 
                '';

            location = item.at_city;
            dates = item.dates || 'Period';

        } else if (item.contract_name) {
            // Old contracts structure (fallback)
            mainTitle = item.contract_topic ? 
                `${item.contract_name} in ${item.contract_topic}` : 
                item.contract_name || 'Contract';

            organizationInfo = '';
            
            instituteInfo = item.contract_place ? 
                (item.contract_place_link ? 
                    `<p><strong>Institute:</strong> <a href="${item.contract_place_link}" target="_blank" rel="noopener noreferrer">${item.contract_place}</a></p>` : 
                    `<p><strong>Institute:</strong> ${item.contract_place}</p>`) : 
                '';

            referenceInfo = '';
            location = item.contract_place_city;
            dates = item.contract_dates || 'Period';

        } else if (item.career_type) {
            // Degrees structure
            mainTitle = item.career_field ? 
                `${item.career_type} in ${item.career_field}` : 
                item.career_type || 'Position';

            organizationInfo = item.career_university ? 
                (item.career_university_link ? 
                    `<p><strong>University:</strong> <a href="${item.career_university_link}" target="_blank" rel="noopener noreferrer">${item.career_university}</a></p>` : 
                    `<p><strong>University:</strong> ${item.career_university}</p>`) : 
                '';

            instituteInfo = item.career_institution && item.career_institution.trim() ? 
                (item.career_institution_link ? 
                    `<p><strong>Institute:</strong> <a href="${item.career_institution_link}" target="_blank" rel="noopener noreferrer">${item.career_institution}</a></p>` : 
                    `<p><strong>Institute:</strong> ${item.career_institution}</p>`) : 
                '';

            referenceInfo = item.career_team && item.career_team.trim() ? 
                (item.career_team_link ? 
                    `<p><strong>Team:</strong> <a href="${item.career_team_link}" target="_blank" rel="noopener noreferrer">${item.career_team}</a></p>` : 
                    `<p><strong>Team:</strong> ${item.career_team}</p>`) : 
                '';

            location = item.career_institution_city || item.career_university_city;
            dates = item.career_dates || 'Period';

        } else {
            // Generic fallback structure (for awards, teaching, etc.)
            mainTitle = item.title || item.name || 'Item';
            organizationInfo = '';
            instituteInfo = '';
            referenceInfo = '';
            location = item.location || item.city;
            dates = item.dates || item.period || 'Period';

            // Add any description if available
            if (item.description) {
                instituteInfo = `<p><strong>Description:</strong> ${item.description}</p>`;
            }
        }

        const locationInfo = location ? 
            `<div class="career-location"><i class="fas fa-map-marker-alt"></i> ${location}</div>` : '';
        
        return `
            <div class="career-item">
                <div class="career-content">
                    <div class="career-main-info">
                        <div class="career-title">
                            <h3>${mainTitle}</h3>
                            <div class="career-institution-info">
                                ${organizationInfo}
                                ${instituteInfo}
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

    function showErrorMessage(containerId, message) {
        $(containerId).html(`<div class="loading-message" style="color: red;">${message}</div>`);
    }

    function setupSubsectionNavigation() {
        $('.subsection-link').on('click', function(e) {
            e.preventDefault();
            
            const targetId = $(this).attr('href');
            const targetSection = $(targetId);
            
            if (targetSection.length) {
                // Remove active class from all links
                $('.subsection-link').removeClass('active');
                // Add active class to clicked link
                $(this).addClass('active');
                
                // Smooth scroll to target
                $('html, body').animate({
                    scrollTop: targetSection.offset().top - 150 // Account for sticky headers
                }, 600);
            }
        });
        
        // Update active link on scroll
        $(window).on('scroll', function() {
            updateActiveSubsectionLink();
        });
    }

    function updateActiveSubsectionLink() {
        const scrollTop = $(window).scrollTop() + 200; // Offset for headers
        
        $('.subsection').each(function() {
            const sectionTop = $(this).offset().top;
            const sectionBottom = sectionTop + $(this).outerHeight();
            const sectionId = '#' + $(this).attr('id');
            
            if (scrollTop >= sectionTop && scrollTop < sectionBottom) {
                $('.subsection-link').removeClass('active');
                $(`.subsection-link[href="${sectionId}"]`).addClass('active');
            }
        });
    }
});