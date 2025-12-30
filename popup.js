// ===== popup.js =====
document.getElementById('setReference').addEventListener('click', () => {
    const refLength = document.getElementById('refLength').value;
    const unit = document.getElementById('unit').value;
    
    if (!refLength || refLength <= 0) {
      alert('Please enter a valid reference length');
      return;
    }
    
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'setReference',
        refLength: parseFloat(refLength),
        unit: unit
      });
      window.close();
    });
  });
  
  document.getElementById('measure').addEventListener('click', () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'measure'
      });
      window.close();
    });
  });
  
  document.getElementById('clear').addEventListener('click', () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'clear'
      });
      window.close();
    });
  });