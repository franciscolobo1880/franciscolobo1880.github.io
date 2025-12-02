$(document).ready(function() {
    let socialsData = {};
    let textData = {};
    let photosData = {};
    let workflowData = {};
    let currentPhotoIndex = 0;
    let totalPhotos = 0;

    console.log('About Me page loaded, starting data fetch...');

    // Load JSON files (added workflow)
    Promise.all([
        fetch('content/database/aboutme_socials.json')
            .then(response => {
                console.log('Socials response:', response.status, response.statusText);
                if (!response.ok) throw new Error('Failed to load socials');
                return response.json();
            })
            .catch(err => {
                console.error('Error loading socials data:', err);
                return {};
            }),
        fetch('content/database/aboutme_text.json')
            .then(response => {
                console.log('Text response:', response.status, response.statusText);
                if (!response.ok) throw new Error('Failed to load text');
                return response.json();
            })
            .catch(err => {
                console.error('Error loading text data:', err);
                return {};
            }),
        fetch('content/database/aboutme_photos.json')
            .then(response => {
                console.log('Photos response:', response.status, response.statusText);
                if (!response.ok) throw new Error('Failed to load photos');
                return response.json();
            })
            .catch(err => {
                console.error('Error loading photos data:', err);
                return {};
            }),
        fetch('content/database/aboutme_workflow.json')
            .then(response => {
                console.log('Workflow response:', response.status, response.statusText);
                if (!response.ok) throw new Error('Failed to load workflow');
                return response.json();
            })
            .catch(err => {
                console.error('Error loading workflow data:', err);
                return {};
            })
    ]).then(([socials, text, photos, workflow]) => {
        console.log('About Me data loaded successfully!');
        console.log('Socials data:', socials);
        console.log('Text data:', text);
        console.log('Photos data:', photos);
        console.log('Workflow data:', workflow);
        
        socialsData = socials;
        textData = text;
        photosData = photos;
        workflowData = workflow;
        
        // Calculate total photos from the photos data
        totalPhotos = Object.keys(photosData).length;
        
        setupIntroduction();
        renderSocialLinks();
        renderWorkflow();
        setupPhotoGallery();
        
    }).catch(error => {
        console.error('CRITICAL ERROR loading About Me data:', error);
        $('#socials-grid').html('<div class="loading-message" style="color: red;">Error loading social links: ' + error.message + '</div>');
        $('#workflow-content').html('<div class="loading-message" style="color: red;">Error loading workflow: ' + error.message + '</div>');
        $('#photos .photo-display').html('<div class="loading-message" style="color: red;">Error loading photos: ' + error.message + '</div>');
    });

    function setupIntroduction() {
        // Load text from JSON
        const welcomeText = textData.welcome_text || `
            I am a passionate researcher in condensed matter physics, currently pursuing my PhD at ICMM-CSIC in Madrid. 
            My work focuses on quantum dynamics and many-body systems within the QUDYMA research group. 
            I am committed to advancing our understanding of quantum materials and their fascinating properties 
            through computational modeling and theoretical analysis.
        `;
        
        $('#intro-paragraph').text(welcomeText.trim());
        
        const profileImage = $('#profile-image');
        profileImage.attr('src', 'content/photos/CV_photo.jpeg');
        profileImage.on('error', function() {
            $(this).attr('src', 'content/photos/profile.jpg');
        });
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

    function renderWorkflow() {
        const container = $('#workflow-content');
        container.empty();

        if (!workflowData || !workflowData.Workflow) {
            container.html('<div class="loading-message">No workflow data available.</div>');
            return;
        }

        // Create workflow container using the curriculum styles
        const workflowHtml = createWorkflowItem({
            id: 'workflow',
            type: 'workflow',
            ...workflowData.Workflow
        });
        
        container.append(workflowHtml);
    }

    function createWorkflowItem(item) {
        console.log('Creating workflow item:', item);
        
        let workflowSections = '';
        
        // Create sections for each workflow type (same as curriculum.js)
        if (item['Coding']) {
            workflowSections += createWorkflowSection('Coding', item['Coding']);
        }
        if (item['Writing']) {
            workflowSections += createWorkflowSection('Writing', item['Writing']);
        }
        if (item['Presenting']) {
            workflowSections += createWorkflowSection('Presenting', item['Presenting']);
        }
        
        return `
            <div class="workflow-container">
                ${workflowSections}
            </div>
        `;
    }

    function createWorkflowSection(title, content) {
        // Process content to handle markdown-like formatting and create hoverable containers
        // Handle Quantica.jl link extraction from the JSON format
        let processedContent = content.replace(/\*([^*]+)\*/g, (match, text) => {
            // Check if this contains a URL in parentheses
            const urlMatch = text.match(/^(.+?)\s*\(([^)]+)\)$/);
            if (urlMatch) {
                const linkText = urlMatch[1].trim();
                const url = urlMatch[2].trim();
                return `<a href="${url}" class="workflow-highlight quantica-link" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
            }
            return `<span class="workflow-highlight">${text}</span>`;
        }).replace(/\n/g, '<br>');
        
        return `
            <div class="workflow-section">
                <h3 class="workflow-title">${title}</h3>
                <div class="workflow-content">
                    <p>${processedContent}</p>
                </div>
            </div>
        `;
    }

    function setupPhotoGallery() {
        if (totalPhotos === 0) {
            $('#photos .photo-display').html('<div class="loading-message">No photos available.</div>');
            return;
        }

        // Set up navigation buttons
        $('#photo-prev').on('click', function() {
            currentPhotoIndex = (currentPhotoIndex - 1 + totalPhotos) % totalPhotos;
            updatePhotoDisplay();
        });

        $('#photo-next').on('click', function() {
            currentPhotoIndex = (currentPhotoIndex + 1) % totalPhotos;
            updatePhotoDisplay();
        });

        // Initialize first photo
        updatePhotoDisplay();
    }

    function updatePhotoDisplay() {
        const photoKeys = Object.keys(photosData);
        if (photoKeys.length === 0) return;

        const currentPhotoKey = photoKeys[currentPhotoIndex];
        const currentPhotoData = photosData[currentPhotoKey];
        
        // Update image
        const photoImg = $('#current-photo');
        const photoPath = `content/photos/${currentPhotoKey}.png`;
        
        photoImg.attr('src', photoPath);
        photoImg.attr('alt', currentPhotoData || 'Photo');

        // Handle image load error
        photoImg.off('error').on('error', function() {
            // Try with .jpg extension if .png fails
            const jpgPath = `content/photos/${currentPhotoKey}.jpg`;
            $(this).attr('src', jpgPath);
            
            // If jpg also fails, show placeholder
            $(this).off('error').on('error', function() {
                $(this).attr('src', 'content/photos/placeholder.png');
            });
        });

        // Add/update caption if it exists
        let captionHtml = '';
        if (currentPhotoData && currentPhotoData.trim()) {
            captionHtml = `<p class="photo-caption">${currentPhotoData}</p>`;
        }
        
        // Remove existing caption and add new one
        $('.photo-caption').remove();
        if (captionHtml) {
            $('.photo-display').append(captionHtml);
        }
    }

    function formatSocialNameWithBreaks(socialType) {
        // Add line breaks for long social media names
        return socialType.replace(' Scholar', '\nScholar').replace(' email', '\nemail');
    }

    function getSocialIcon(socialType) {
        const lowerType = socialType.toLowerCase();
        if (lowerType.includes('email')) return 'fas fa-envelope';
        if (lowerType.includes('linkedin')) return 'fab fa-linkedin';
        if (lowerType.includes('github')) return 'fab fa-github';
        if (lowerType.includes('scholar')) return 'fas fa-graduation-cap';
        if (lowerType.includes('orcid')) return 'fab fa-orcid';
        if (lowerType.includes('researchgate')) return 'fab fa-researchgate';
        if (lowerType.includes('twitter')) return 'fab fa-twitter';
        if (lowerType.includes('facebook')) return 'fab fa-facebook';
        if (lowerType.includes('instagram')) return 'fab fa-instagram';
        if (lowerType.includes('youtube')) return 'fab fa-youtube';
        if (lowerType.includes('cv')) return 'fas fa-file-pdf';
        return 'fas fa-link';
    }

    function formatSocialName(id) {
        return id.replace(/([A-Z])/g, ' $1').trim();
    }
});