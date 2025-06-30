document.addEventListener('DOMContentLoaded', function () {
    const uploadForm = document.getElementById('uploadForm');
    const statusMessage = document.getElementById('statusMessage');
    const fileInput = document.getElementById('document');

    const API_BASE = "https://rrdb8rze7l.execute-api.us-east-1.amazonaws.com/dev";

    uploadForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const clientId = document.getElementById('clientId').value.trim();
        const caseId = document.getElementById('caseId').value.trim();
        const documentType = document.getElementById('documentType').value;
        const file = fileInput.files[0];

        if (!validateFile(file)) return;

        showStatus('Uploading your document...', 'loading');

        try {
            const base64Content = await toBase64(file);

            const payload = {
                clientId,
                caseId,
                documentType,
                fileName: file.name,
                fileContent: base64Content.split(',')[1]  // remove "data:*/*;base64," prefix
            };

            const response = await fetch(`${API_BASE}/upload`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok) {
                showStatus('Document uploaded successfully!', 'success');
                uploadForm.reset();
            } else {
                console.error('Upload failed:', result.error || result);
                showStatus(`Upload failed: ${result.error || 'Unknown error'}`, 'error');
            }
        } catch (error) {
            console.error('Upload error:', error);
            showStatus('Error uploading document. Please try again.', 'error');
        }
    });

    function validateFile(file) {
        if (!file) {
            showStatus('Please select a file to upload.', 'error');
            return false;
        }

        if (file.size > 2 * 1024 * 1024) {
            showStatus('File size exceeds the 2MB limit.', 'error');
            return false;
        }

        const fileName = file.name;
        const extension = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
        const allowedExtensions = ['doc', 'txt', 'pdf', 'ppt'];

        if (!allowedExtensions.includes(extension)) {
            showStatus('Only .doc, .txt, .pdf, and .ppt files are allowed.', 'error');
            return false;
        }

        return true;
    }

    function toBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = 'status-message';
        statusMessage.classList.remove('loading', 'success', 'error');
        statusMessage.classList.add(type);
    }
});
