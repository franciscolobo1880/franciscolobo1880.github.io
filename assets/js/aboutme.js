$(document).ready(function() {
    let socialsData = {};
    let researchData = {};
    let softwareData = {};
    let textData = {};
    let photosData = {};
    let currentPhotoIndex = 0;
    let totalPhotos = 0;

    console.log('About Me page loaded, starting data fetch...');

    // Load JSON files including text and photos
    Promise.all([
        fetch('content/database/aboutme_socials.json')
            .then(response => {
                console.log('Socials response:', response.status, response.statusText);
                if (!response.ok) throw new Error(`Socials: ${response.status}`);
                return response.json();
            })
            .catch(err => {
                console.error('Error loading socials data:', err);
                return {};
            }),
        fetch('content/database/aboutme_research.json')
            .then(response => {
                console.log('Research response:', response.status, response.statusText);
                if (!response.ok) throw new Error(`Research: ${response.status}`);
                return response.json();
            })
            .catch(err => {
                console.error('Error loading research data:', err);
                return {};
            }),
        fetch('content/database/aboutme_softwares.json')
            .then(response => {
                console.log('Software response:', response.status, response.statusText);
                if (!response.ok) throw new Error(`Software: ${response.status}`);
                return response.json();
            })
            .catch(err => {
                console.error('Error loading software data:', err);
                return {};
            }),
        fetch('content/database/aboutme_text.json')
            .then(response => {
                console.log('Text response:', response.status, response.statusText);
                if (!response.ok) throw new Error(`Text: ${response.status}`);
                return response.json();
            })
            .catch(err => {
                console.error('Error loading text data:', err);
                return {};
            }),
        fetch('content/database/aboutme_photos.json')
            .then(response => {
                console.log('Photos response:', response.status, response.statusText);
                if (!response.ok) throw new Error(`Photos: ${response.status}`);
                return response.json();
            })
            .catch(err => {
                console.error('Error loading photos data:', err);
                return {};
            })
    ]).then(([socials, research, software, text, photos]) => {
        console.log('About Me data loaded successfully!');
        console.log('Socials data:', socials);
        console.log('Research data:', research);
        console.log('Software data:', software);
        console.log('Text data:', text);
        console.log('Photos data:', photos);
        
        socialsData = socials;
        researchData = research;
        softwareData = software;
        textData = text;
        photosData = photos;
        
        // Calculate total photos from the photos data
        totalPhotos = Object.keys(photosData).length;
        
        setupIntroduction();
        renderResearchInterests();
        renderSoftwareCompetencies();
        renderSocialLinks();
        setupPhotoGallery();
        setupSubsectionNavigation();
        
    }).catch(error => {
        console.error('CRITICAL ERROR loading About Me data:', error);
        $('#research-grid').html('<div class="loading-message" style="color: red;">Error loading research data: ' + error.message + '</div>');
        $('#software-grid').html('<div class="loading-message" style="color: red;">Error loading software data: ' + error.message + '</div>');
        $('#socials-grid').html('<div class="loading-message" style="color: red;">Error loading social links: ' + error.message + '</div>');
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
            console.log('CV_photo.jpeg not found, checking alternatives...');
            $(this).attr('src', 'content/photos/CV_photo.jpg');
        });
    }

    function renderResearchInterests() {
        const container = $('#research-grid');
        container.empty();

        if (!researchData || Object.keys(researchData).length === 0) {
            container.html('<div class="loading-message">No research interests data available.</div>');
            return;
        }

        // Simply display each research topic
        Object.keys(researchData).forEach(key => {
            const researchTopic = researchData[key]; // Just the text like "Topology", "2D crystals"
            
            const researchHtml = `
                <div class="research-item">
                    <p class="research-name">${researchTopic}</p>
                </div>
            `;
            container.append(researchHtml);
        });
    }

    function renderSoftwareCompetencies() {
        const container = $('#software-grid');
        container.empty();

        if (!softwareData || Object.keys(softwareData).length === 0) {
            container.html('<div class="loading-message">No software data available.</div>');
            return;
        }

        // Display each software with logo (like social links)
        Object.keys(softwareData).forEach(key => {
            const softwareName = softwareData[key]; // "Github", "Inkscape", "JavaScript", etc.
            const iconClass = getSoftwareIcon(softwareName);
            
            const softwareHtml = `
                <div class="software-item">
                    <div class="software-icon">
                        <i class="${iconClass}"></i>
                    </div>
                    <div class="software-content">
                        <div class="software-name">${softwareName}</div>
                    </div>
                </div>
            `;
            container.append(softwareHtml);
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

    function getSoftwareIcon(softwareName) {
        const lowerName = softwareName.toLowerCase();
        
        const iconMap = {
            'github': 'fab fa-github',
            'git': 'fab fa-git',
            'inkscape': 'fas fa-pencil-ruler',
            'javascript': 'fab fa-js-square',
            'js': 'fab fa-js-square',
            'latex': 'fas fa-file-code',
            'mathematica': 'fas fa-superscript',
            'matlab': 'fas fa-calculator',
            'julia': 'fas fa-code',
            'python': 'fab fa-python',
            'html': 'fab fa-html5',
            'css': 'fab fa-css3-alt',
            'node': 'fab fa-node-js',
            'react': 'fab fa-react',
            'vue': 'fab fa-vuejs',
            'angular': 'fab fa-angular',
            'docker': 'fab fa-docker',
            'linux': 'fab fa-linux',
            'ubuntu': 'fab fa-ubuntu',
            'windows': 'fab fa-windows',
            'apple': 'fab fa-apple',
            'android': 'fab fa-android',
            'photoshop': 'fas fa-palette',
            'illustrator': 'fas fa-palette',
            'figma': 'fab fa-figma',
            'sketch': 'fas fa-vector-square',
            'adobe': 'fab fa-adobe',
            'blender': 'fas fa-cube',
            'unity': 'fab fa-unity',
            'unreal': 'fas fa-gamepad',
            'wordpress': 'fab fa-wordpress',
            'php': 'fab fa-php',
            'mysql': 'fas fa-database',
            'postgresql': 'fas fa-database',
            'mongodb': 'fas fa-leaf',
            'firebase': 'fas fa-fire',
            'aws': 'fab fa-aws',
            'google cloud': 'fab fa-google',
            'azure': 'fab fa-microsoft'
        };
        
        for (const key in iconMap) {
            if (lowerName.includes(key)) {
                return iconMap[key];
            }
        }
        
        return 'fas fa-code'; // Default programming icon
    }

    function setupPhotoGallery() {
        if (totalPhotos === 0) {
            $('#photos .photo-display').html('<div class="loading-message">No photos available.</div>');
            return;
        }
        
        currentPhotoIndex = 1; // Start with photo 1
        updatePhotoDisplay();
        
        // Setup navigation buttons
        $('#photo-prev').on('click', function() {
            currentPhotoIndex = currentPhotoIndex <= 1 ? totalPhotos : currentPhotoIndex - 1;
            updatePhotoDisplay();
        });
        
        $('#photo-next').on('click', function() {
            currentPhotoIndex = currentPhotoIndex >= totalPhotos ? 1 : currentPhotoIndex + 1;
            updatePhotoDisplay();
        });
    }

    function updatePhotoDisplay() {
        // Format photo index with leading zero (Photo01, Photo02, etc.)
        const photoKey = `Photo${currentPhotoIndex.toString().padStart(2, '0')}`;
        const photoSrc = `content/photos/${photoKey}.png`;
        const photoCaption = photosData[photoKey] || `Photo ${currentPhotoIndex}`;
        
        // Update image
        $('#current-photo').attr('src', photoSrc);
        
        // Update or create caption
        let captionElement = $('#photo-caption');
        if (captionElement.length === 0) {
            // Create caption element if it doesn't exist
            captionElement = $('<p id="photo-caption" class="photo-caption"></p>');
            $('.photo-display').append(captionElement);
        }
        captionElement.text(photoCaption);
        
        // Handle image load errors
        $('#current-photo').off('error').on('error', function() {
            console.log(`${photoKey}.png not found, trying .jpg...`);
            
            // Try .jpg extension
            const jpgSrc = `content/photos/${photoKey}.jpg`;
            $(this).attr('src', jpgSrc);
            
            $(this).off('error').on('error', function() {
                console.log(`${photoKey} not found in any format, trying next...`);
                // If both png and jpg fail, try next photo
                currentPhotoIndex = currentPhotoIndex >= totalPhotos ? 1 : currentPhotoIndex + 1;
                if (currentPhotoIndex <= totalPhotos) {
                    updatePhotoDisplay();
                } else {
                    // If all photos fail, show error
                    $('.photo-display').html('<div class="loading-message">No photos found.</div>');
                }
            });
        });
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

    function formatSocialNameWithBreaks(socialType) {
        const words = socialType.split(' ');
        if (words.length > 1) {
            return words.join('\n');
        }
        return socialType;
    }

    function getSocialIcon(socialType) {
        const lowerType = socialType.toLowerCase();
        
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
            'institute': 'fas fa-university',
            'university': 'fas fa-university',
            'institution': 'fas fa-university'
        };
        
        for (const key in iconMap) {
            if (lowerType.includes(key)) {
                return iconMap[key];
            }
        }
        
        return 'fas fa-link';
    }

    function formatSocialName(id) {
        return id.split('_')
                 .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                 .join(' ');
    }
});