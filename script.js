document.addEventListener('DOMContentLoaded', function() {
    // Theme toggle functionality
    const themeToggle = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    const icon = themeToggle.querySelector('i');
    
    // Check for saved theme preference or use preferred color scheme
    const savedTheme = localStorage.getItem('theme') || 
                      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    htmlElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });
    
    function updateThemeIcon(theme) {
        if (theme === 'dark') {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    }
    
    // Subdomain functionality
    const subdomainInput = document.getElementById('subdomain-input');
    const checkButton = document.getElementById('check-availability');
    const createButton = document.getElementById('create-subdomain');
    const statusMessage = document.getElementById('status-message');
    
    checkButton.addEventListener('click', checkSubdomainAvailability);
    createButton.addEventListener('click', createSubdomain);
    subdomainInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            checkSubdomainAvailability();
        }
    });
    
    function checkSubdomainAvailability() {
        const subdomain = subdomainInput.value.trim();
        
        // Validate subdomain
        if (!subdomain) {
            showStatus('Please enter a subdomain name', 'error');
            return;
        }
        
        if (!/^[a-z0-9-]+$/.test(subdomain)) {
            showStatus('Subdomain can only contain lowercase letters, numbers, and hyphens', 'error');
            return;
        }
        
        if (subdomain.length < 3 || subdomain.length > 63) {
            showStatus('Subdomain must be between 3 and 63 characters', 'error');
            return;
        }
        
        // Simulate API call to check availability
        showStatus('Checking availability...', 'info');
        createButton.disabled = true;
        
        // In a real implementation, this would be an API call to your backend
        setTimeout(() => {
            // For demo purposes, we'll randomly determine availability
            const isAvailable = Math.random() > 0.5;
            
            if (isAvailable) {
                showStatus(`${subdomain}.nubisync.com is available!`, 'success');
                createButton.disabled = false;
            } else {
                showStatus(`${subdomain}.nubisync.com is not available`, 'error');
                createButton.disabled = true;
            }
        }, 1000);
    }
    
    function createSubdomain() {
        const subdomain = subdomainInput.value.trim();
        showStatus(`Creating ${subdomain}.nubisync.com...`, 'info');
        createButton.disabled = true;
        checkButton.disabled = true;
        
        // Simulate API call to create subdomain
        setTimeout(() => {
            showStatus(`Success! ${subdomain}.nubisync.com has been created and is being deployed.`, 'success');
            
            // Reset form after creation
            setTimeout(() => {
                subdomainInput.value = '';
                createButton.disabled = true;
                checkButton.disabled = false;
                showStatus('', 'info');
                statusMessage.style.display = 'none';
            }, 3000);
        }, 2000);
    }
    
    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.style.display = 'block';
        statusMessage.className = ''; // Clear previous classes
        statusMessage.classList.add(type);
    }
});