document.addEventListener('DOMContentLoaded', function() {
    // Configuration
    const config = {
        // This will be replaced with your actual API Gateway endpoint
        apiEndpoint: 'https://YOUR_API_GATEWAY_ID.execute-api.YOUR_REGION.amazonaws.com/dev/upload',
        maxFileSize: 2 * 1024 * 1024, // 2MB in bytes
        allowedFileTypes: ['.doc', '.txt', '.pdf', '.ppt']
    };

    // DOM Elements
    const form = document.getElementById('document-upload-form');
    const uploadButton = document.getElementById('upload-button');
    const statusContainer = document.getElementById('upload-status');
    const statusMessage = document.getElementById('status-message');
    const uploadDetails = document.getElementById('upload-details');
    const environmentBadge = document.getElementById('environment-badge');
    
    // Detect environment from URL and update badge
    function detectEnvironment() {
        const url = window.location.href.toLowerCase();
        if (url.includes('prod') || url.includes('production')) {
            environmentBadge.textContent = 'PROD';
            environmentBadge.style.backgroundColor = '#d32f2f'; // Red for production
            // Update API endpoint for production
            config.apiEndpoint = config.apiEndpoint.replace('/dev/', '/prod/');
        } else {
            environmentBadge.textContent = 'DEV';
        }
    }
    
    // Validate file type and size
    function validateFile(file) {
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!config.allowedFileTypes.includes(fileExtension)) {
            return {
                valid: false,
                message: `Invalid file type. Allowed types: ${config.allowedFileTypes.join(', ')}`
            };
        }
        
        if (file.size > config.maxFileSize) {
            return {
                valid: false,
                message: `File size exceeds the maximum limit of 2MB`
            };
        }
        
        return { valid: true };
    }
    
    // Show status message
    function showStatus(isSuccess, message, details = null) {
        statusContainer.className = 'upload-status ' + (isSuccess ? 'success' : 'error');
        statusMessage.textContent = message;
        statusContainer.style.display = 'block';
        
        if (details) {
            let detailsHtml = '';
            for (const [key, value] of Object.entries(details)) {
                detailsHtml += `<p><strong>${key}:</strong> ${value}</p>`;
            }
            uploadDetails.innerHTML = detailsHtml;
        } else {
            uploadDetails.innerHTML = '';
        }
        
        // Scroll to status message
        statusContainer.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Handle form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Reset status
        statusContainer.style.display = 'none';
        
        // Get form data
        const clientId = document.getElementById('clientId').value.trim();
        const caseId = document.getElementById('caseId').value.trim();
        const documentType = document.getElementById('documentType').value;
        const fileInput = document.getElementById('file');
        
        if (!clientId || !caseId || !documentType || !fileInput.files.length) {
            showStatus(false, 'Please fill in all required fields');
            return;
        }
        
        const file = fileInput.files[0];
        const fileValidation = validateFile(file);
        
        if (!fileValidation.valid) {
            showStatus(false, fileValidation.message);
            return;
        }
        
        // Disable button and show loading state
        uploadButton.disabled = true;
        uploadButton.textContent = 'Uploading...';
        
        try {
            // Read file as base64
            const fileContent = await readFileAsBase64(file);
            
            // Prepare request payload
            const payload = {
                clientId: clientId,
                caseId: caseId,
                documentType: documentType,
                fileName: file.name,
                fileContent: fileContent
            };
            
            // Send request to API
            const response = await fetch(config.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                // Success
                showStatus(true, 'File uploaded successfully', {
                    'Client ID': clientId,
                    'Case ID': caseId,
                    'Document Type': documentType,
                    'File Name': file.name,
                    'Location': result.location || 'N/A',
                    'Environment': result.environment || environmentBadge.textContent
                });
                
                // Reset form
                form.reset();
            } else {
                // API returned an error
                showStatus(false, result.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            showStatus(false, 'An error occurred during upload. Please try again.');
        } finally {
            // Re-enable button
            uploadButton.disabled = false;
            uploadButton.textContent = 'Upload Document';
        }
    });
    
    // Helper function to read file as base64
    function readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    }
    
    // Initialize
    detectEnvironment();
});