// frontend/js/subdomain.js
document.getElementById('create-subdomain').addEventListener('click', async () => {
    const subdomain = document.getElementById('subdomain-input').value.trim();
    
    try {
      const response = await fetch('/api/subdomains/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: subdomain })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`Created! Access at: ${data.url}`);
        window.open(data.url, '_blank');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert('Network error - please try again');
    }
  });