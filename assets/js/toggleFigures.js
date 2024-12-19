function toggleFigures(button) {
    // Find the parent image container (this will work for each specific container)
    const imageContainer = button.closest('.image'); // This ensures that only the relevant container is affected
    
    // Get all figure elements inside this container
    const figures = imageContainer.querySelectorAll('.figure');
    
    // Find the currently active figure within this container
    let activeIndex = -1;
    figures.forEach((figure, index) => {
        if (figure.classList.contains('active')) {
            activeIndex = index;
        }
    });

    // Remove the active class from the current active figure
    if (activeIndex >= 0) {
        figures[activeIndex].classList.remove('active');
    }

    // Calculate the index of the next figure to show (loop back to first if needed)
    const nextIndex = (activeIndex + 1) % figures.length;

    // Add the active class to the next figure
    figures[nextIndex].classList.add('active');
}
