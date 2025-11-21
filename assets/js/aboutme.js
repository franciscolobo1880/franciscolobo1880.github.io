$(document).ready(function() {
    let careerData = {};
    let socialsData = {};

    console.log('About Me page loaded, starting data fetch...');

    // Load JSON files
    Promise.all([
        fetch('content/database/aboutme_carrer.json')
            .then(response => {
                console.log('Career response:', response.status, response.statusText);
                if (!response.ok) throw new Error(`Career: ${response.status}`);
                return response.json();
            })
            .catch(err => {
                console.error('Error loading career data:', err);
                return {};
            }),
        fetch('content/database/aboutme_socials.json')
            .then(response => {
                console.log('Socials response:', response.status, response.statusText);
                if (!response.ok) throw new Error(`Socials: ${response.status}`);
                return response.json();
            })
            .catch(err => {
                console.error('Error loading socials data:', err);
                return {};
            })
    ]).then(([career, socials]) => {
        console.log('About Me data loaded successfully!');
        console.log('Career data:', career);
        console.log('Socials data:', socials);
        
        careerData = career;
        socialsData = socials;
        
        setupIntroduction();
        renderCareerTimeline();
        renderSocialLinks();
        
    }).catch(error => {
        console.error('CRITICAL ERROR loading About Me data:', error);
        $('#career-timeline').html('<div class="loading-message" style="color: red;">Error loading career data: ' + error.message + '</div>');
        $('#socials-grid').html('<div class="loading-message" style="color: red;">Error loading social links: ' + error.message + '</div>');
    });

    function setupIntroduction() {
        const introParagraph = `
            I am a passionate researcher in condensed matter physics, currently pursuing my PhD at ICMM-CSIC in Madrid. 
            My work focuses on quantum dynamics and many-body systems within the QUDYMA research group. 
            I am committed to advancing our understanding of quantum materials and their fascinating properties 
            through computational modeling and theoretical analysis.
        `;
        
        $('#intro-paragraph').text(introParagraph.trim());
        
        const profileImage = $('#profile-image');
        profileImage.attr('src', 'content/photos/CV_photo.jpeg');
        profileImage.on('error', function() {
            console.log('CV_photo.jpeg not found, checking alternatives...');
            $(this).attr('src', 'content/photos/CV_photo.jpg');
        });
    }

    function renderCareerTimeline() {
        const container = $('#career-timeline');
        container.empty();

        if (!careerData || Object.keys(careerData).length === 0) {
            container.html('<div class="loading-message">No career data available.</div>');
            return;
        }

        // Convert to array and sort by start year (most recent first)
        const careerItems = Object.keys(careerData).map(key => ({
            id: key,
            ...careerData[key]
        })).sort((a, b) => {
            const yearA = extractStartYear(a.career_dates);
            const yearB = extractStartYear(b.career_dates);
            return yearB - yearA; // Most recent first
        });

        careerItems.forEach(item => {
            const careerHtml = createCareerItem(item);
            container.append(careerHtml);
        });
    }

    function createCareerItem(item) {
        // Create the main title (career_type + career_field)
        const mainTitle = item.career_field ? 
            `${item.career_type} in ${item.career_field}` : 
            item.career_type || 'Position';

        // Build university info
        const universityInfo = item.career_university ? 
            (item.career_university_link ? 
                `<p>University: <a href="${item.career_university_link}" target="_blank" rel="noopener noreferrer">${item.career_university}</a></p>` : 
                `<p>University: ${item.career_university}</p>`) : 
            '';

        // Build institute info (only if different from university)
        const instituteInfo = item.career_institution && item.career_institution.trim() ? 
            (item.career_institution_link ? 
                `<p>Institute: <a href="${item.career_institution_link}" target="_blank" rel="noopener noreferrer">${item.career_institution}</a></p>` : 
                `<p>Institute: ${item.career_institution}</p>`) : 
            '';

        // Build team info
        const teamInfo = item.career_team && item.career_team.trim() ? 
            (item.career_team_link ? 
                `<p>Team: <a href="${item.career_team_link}" target="_blank" rel="noopener noreferrer">${item.career_team}</a></p>` : 
                `<p>Team: ${item.career_team}</p>`) : 
            '';

        // Location (prefer institution city, fallback to university city)
        const location = item.career_institution_city || item.career_university_city;
        const locationInfo = location ? 
            `<div class="career-location"><i class="fas fa-map-marker-alt"></i> ${location}</div>` : '';
        
        return `
            <div class="career-item">
                <div class="career-content">
                    <div class="career-main-info">
                        <div class="career-title">
                            <h3>${mainTitle}</h3>
                            <div class="career-institution-info">
                                ${universityInfo}
                                ${instituteInfo}
                                ${teamInfo}
                            </div>
                        </div>
                        <div class="career-period">${item.career_dates || 'Period'}</div>
                    </div>
                    ${locationInfo}
                </div>
            </div>
        `;
    }

    function extractStartYear(dateString) {
        if (!dateString) return 0;
        
        const yearMatch = dateString.match(/\b(20\d{2})\b/);
        return yearMatch ? parseInt(yearMatch[1]) : 0;
    }

    function renderSocialLinks() {
        const container = $('#socials-grid');
        container.empty();

        if (!socialsData || Object.keys(socialsData).length === 0) {
            container.html('<div class="loading-message">No social links available.</div>');
            return;
        }

        Object.keys(socialsData).forEach(key => {
            const social = socialsData[key];
            const socialHtml = createSocialItem(key, social);
            container.append(socialHtml);
        });
    }

    function createSocialItem(id, social) {
        const socialType = social.social_type || formatSocialName(id);
        const iconClass = getSocialIcon(socialType);
        const link = social.social_link || '#';
        
        // Format social name to always break into multiple lines if it contains multiple words
        const formattedName = formatSocialNameWithBreaks(socialType);
        
        return `
            <a href="${link}" class="social-item" target="_blank" rel="noopener noreferrer">
                <div class="social-icon">
                    <i class="${iconClass}"></i>
                </div>
                <div class="social-content">
                    <div class="social-name">${formattedName}</div>
                </div>
            </a>
        `;
    }

    function formatSocialNameWithBreaks(socialType) {
        // Split by spaces and join with line breaks
        const words = socialType.split(' ');
        if (words.length > 1) {
            // For multi-word names, put each word on its own line
            return words.join('\n');
        }
        return socialType;
    }

    function getSocialIcon(socialType) {
        const lowerType = socialType.toLowerCase();
        
        // Map social platform names to FontAwesome icons
        const iconMap = {
            'google scholar': 'fas fa-graduation-cap',
            'scholar': 'fas fa-graduation-cap',
            'orcid': 'fab fa-orcid',
            'researchgate': 'fab fa-researchgate',
            'research gate': 'fab fa-researchgate',
            'linkedin': 'fab fa-linkedin',
            'github': 'fab fa-github',
            'twitter': 'fab fa-twitter',
            'x': 'fab fa-x-twitter',
            'email': 'fas fa-envelope',
            'mail': 'fas fa-envelope',
            'personal email': 'fas fa-envelope',
            'personal': 'fas fa-envelope',
            'website': 'fas fa-globe',
            'personal website': 'fas fa-globe',
            'instagram': 'fab fa-instagram',
            'facebook': 'fab fa-facebook',
            'youtube': 'fab fa-youtube',
            'arxiv': 'fas fa-archive',
            'scopus': 'fas fa-search',
            'web of science': 'fas fa-microscope',
            'publons': 'fas fa-user-graduate',
            // SPECIAL CASE FOR INSTITUTE/UNIVERSITY
            'institute': 'fas fa-university',
            'university': 'fas fa-university',
            'institution': 'fas fa-university'
        };
        
        // Find matching icon
        for (const key in iconMap) {
            if (lowerType.includes(key)) {
                return iconMap[key];
            }
        }
        
        // Default icon
        return 'fas fa-link';
    }

    function formatSocialName(id) {
        return id.split('_')
                 .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                 .join(' ');
    }
});