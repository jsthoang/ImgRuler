
  // ===== content.js =====
  (function() {
    let mode = null;
    let startPoint = null;
    let currentLine = null;
    let referencePixels = null;
    let referenceLength = null;
    let unit = 'mm';
    let measurements = [];
    let draggedHandle = null;
    let draggedLine = null;
    let panelVisible = false;
    let overlay = null;
  
    const styles = `
      .length-meter-line {
        position: absolute;
        height: 3px;
        background: #2196F3;
        transform-origin: left center;
        pointer-events: none;
        z-index: 999998;
        box-shadow: 0 0 5px rgba(0,0,0,0.3);
      }
      .reference-line {
        background: #4CAF50 !important;
      }
      .measure-line {
        background: #2196F3 !important;
      }
      .length-meter-handle {
        position: absolute;
        width: 0;
        height: 0;
        border-top: 10px solid transparent;
        border-bottom: 10px solid transparent;
        border-left: 16px solid #2196F3;
        cursor: move;
        z-index: 999999;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        pointer-events: auto;
      }
      .length-meter-handle:hover {
        transform: scale(1.2);
      }
      .length-meter-handle.reference {
        border-left-color: #4CAF50;
      }
      .length-meter-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.01);
        z-index: 999997;
        cursor: crosshair;
      }
      .length-meter-label {
        position: absolute;
        background: rgba(0,0,0,0.85);
        color: white;
        padding: 6px 12px;
        border-radius: 4px;
        font-family: Arial, sans-serif;
        font-size: 13px;
        font-weight: 600;
        pointer-events: none;
        z-index: 999999;
        transform: translate(-50%, 0);
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      }
      .length-meter-notification {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.9);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-family: Arial, sans-serif;
        font-size: 13px;
        z-index: 9999999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideDown 0.3s ease;
      }
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }
      .length-meter-panel {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 280px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.15);
        z-index: 9999999;
        font-family: Arial, sans-serif;
        animation: slideIn 0.3s ease;
      }
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      .length-meter-panel-header {
        padding: 16px;
        border-bottom: 1px solid #e0e0e0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .length-meter-panel-header h3 {
        margin: 0;
        font-size: 16px;
        color: #333;
      }
      .length-meter-close {
        background: none;
        border: none;
        font-size: 24px;
        color: #999;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        line-height: 20px;
      }
      .length-meter-close:hover {
        color: #333;
      }
      .length-meter-panel-body {
        padding: 16px;
      }
      .length-meter-input-group {
        margin-bottom: 12px;
      }
      .length-meter-input-group label {
        display: block;
        margin-bottom: 6px;
        color: #555;
        font-size: 12px;
        font-weight: 600;
      }
      .length-meter-input-group input,
      .length-meter-input-group select {
        width: 100%;
        padding: 8px 10px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 14px;
        box-sizing: border-box;
      }
      .length-meter-btn {
        width: 100%;
        padding: 10px;
        margin: 6px 0;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
        transition: all 0.2s;
      }
      .length-meter-btn-primary {
        background: #4CAF50;
        color: white;
      }
      .length-meter-btn-primary:hover {
        background: #45a049;
      }
      .length-meter-btn-secondary {
        background: #2196F3;
        color: white;
      }
      .length-meter-btn-secondary:hover {
        background: #0b7dda;
      }
      .length-meter-btn-danger {
        background: #f44336;
        color: white;
      }
      .length-meter-btn-danger:hover {
        background: #da190b;
      }
    `;
  
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'togglePanel') {
        togglePanel();
      }
    });
  
    function togglePanel() {
      if (panelVisible) {
        hidePanel();
      } else {
        showPanel();
      }
    }
  
    function showPanel() {
      if (document.querySelector('.length-meter-panel')) return;
      
      panelVisible = true;
      const panel = document.createElement('div');
      panel.className = 'length-meter-panel';
      panel.innerHTML = `
        <div class="length-meter-panel-header">
          <h3>📏 Length Meter</h3>
          <button class="length-meter-close">×</button>
        </div>
        <div class="length-meter-panel-body">
          <div class="length-meter-input-group">
            <label>Reference Length</label>
            <input type="number" id="lm-refLength" placeholder="Enter known length" step="0.01">
          </div>
          <div class="length-meter-input-group">
            <label>Unit</label>
            <select id="lm-unit">
              <option value="mm" selected>mm</option>
              <option value="cm">cm</option>
              <option value="m">m</option>
              <option value="inch">inch</option>
              <option value="ft">ft</option>
            </select>
          </div>
          <button class="length-meter-btn length-meter-btn-primary" id="lm-setReference">Set Reference Length</button>
          <button class="length-meter-btn length-meter-btn-secondary" id="lm-measure">Measure Length</button>
          <button class="length-meter-btn length-meter-btn-danger" id="lm-clear">Clear All</button>
        </div>
      `;
      
      document.body.appendChild(panel);
      
      panel.querySelector('.length-meter-close').addEventListener('click', hidePanel);
      panel.querySelector('#lm-setReference').addEventListener('click', handleSetReference);
      panel.querySelector('#lm-measure').addEventListener('click', handleMeasure);
      panel.querySelector('#lm-clear').addEventListener('click', handleClear);
    }
  
    function hidePanel() {
      const panel = document.querySelector('.length-meter-panel');
      if (panel) {
        panel.remove();
        panelVisible = false;
      }
    }
  
    function handleSetReference() {
      const refLength = document.getElementById('lm-refLength').value;
      const unitValue = document.getElementById('lm-unit').value;
      
      if (!refLength || refLength <= 0) {
        showNotification('⚠️ Please enter a valid reference length');
        return;
      }
      
      mode = 'reference';
      referenceLength = parseFloat(refLength);
      unit = unitValue;
      showOverlay();
      showNotification(`Click and drag to mark ${referenceLength} ${unit}`);
    }
  
    function handleMeasure() {
      if (!referencePixels) {
        showNotification('⚠️ Please set a reference length first!');
        return;
      }
      mode = 'measure';
      showOverlay();
      showNotification('Click and drag to measure');
    }
  
    function handleClear() {
      clearAll();
      showNotification('✓ All measurements cleared');
    }
  
    function showOverlay() {
      if (overlay) return;
      overlay = document.createElement('div');
      overlay.className = 'length-meter-overlay';
      document.body.appendChild(overlay);
    }
  
    function hideOverlay() {
      if (overlay) {
        overlay.remove();
        overlay = null;
      }
    }
  
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  
    function handleMouseDown(e) {
      // Check if clicking on a handle
      if (e.target.classList.contains('length-meter-handle')) {
        draggedHandle = e.target;
        draggedLine = draggedHandle.lineElement;
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      
      if (!mode) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      startPoint = {x: e.pageX, y: e.pageY};
      
      currentLine = document.createElement('div');
      currentLine.className = 'length-meter-line';
      document.body.appendChild(currentLine);
    }
  
    function handleMouseMove(e) {
      // Handle dragging
      if (draggedHandle && draggedLine) {
        e.preventDefault();
        e.stopPropagation();
        
        const isStart = draggedHandle.handleType === 'start';
        const line = draggedLine;
        
        if (isStart) {
          line.startPoint = {x: e.pageX, y: e.pageY};
        } else {
          line.endPoint = {x: e.pageX, y: e.pageY};
        }
        
        updateLineAndHandles(line, line.startPoint, line.endPoint);
        return;
      }
      
      if (!mode || !startPoint || !currentLine) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      const endPoint = {x: e.pageX, y: e.pageY};
      updateLine(currentLine, startPoint, endPoint);
    }
  
    function handleMouseUp(e) {
      // Handle dropping
      if (draggedHandle) {
        draggedHandle = null;
        draggedLine = null;
        return;
      }
      
      if (!mode || !startPoint || !currentLine) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      const endPoint = {x: e.pageX, y: e.pageY};
      const pixels = calculateDistance(startPoint, endPoint);
      
      if (pixels < 5) {
        currentLine.remove();
        startPoint = null;
        currentLine = null;
        hideOverlay();
        return;
      }
      
      currentLine.startPoint = startPoint;
      currentLine.endPoint = endPoint;
      
      if (mode === 'reference') {
        referencePixels = pixels;
        currentLine.classList.add('reference-line');
        currentLine.isReference = true;
        addHandlesAndLabel(currentLine, startPoint, endPoint, `${referenceLength} ${unit}`, true);
        measurements.push(currentLine);
        showNotification(`✓ Reference set: ${referenceLength} ${unit}`);
        mode = null;
        hideOverlay();
      } else if (mode === 'measure') {
        const measuredLength = (pixels / referencePixels) * referenceLength;
        currentLine.classList.add('measure-line');
        addHandlesAndLabel(currentLine, startPoint, endPoint, `${measuredLength.toFixed(2)} ${unit}`, false);
        measurements.push(currentLine);
        mode = null;
        hideOverlay();
      }
      
      startPoint = null;
      currentLine = null;
    }
  
    function updateLine(line, start, end) {
      const length = calculateDistance(start, end);
      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      
      line.style.width = length + 'px';
      line.style.left = start.x + 'px';
      line.style.top = start.y + 'px';
      line.style.transform = `rotate(${angle}rad)`;
    }
  
    function updateLineAndHandles(line, start, end) {
      updateLine(line, start, end);
      
      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      
      // Update handles - arrows positioned INSIDE the line, pointing outward
      // Start arrow at the start point, pointing outward (left)
      if (line.startHandle) {
        line.startHandle.style.left = start.x + 'px';
        line.startHandle.style.top = start.y + 'px';
        line.startHandle.style.transform = `translate(0px, -50%) rotate(${angle + Math.PI}rad)`;
      }
      // End arrow at the end point, pointing outward (right)
      if (line.endHandle) {
        line.endHandle.style.left = end.x + 'px';
        line.endHandle.style.top = end.y + 'px';
        line.endHandle.style.transform = `translate(-16px, -50%) rotate(${angle}rad)`;
      }
      
      // Update label
      if (line.label) {
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        line.label.style.left = midX + 'px';
        line.label.style.top = (midY - 25) + 'px';
        
        // Recalculate measurement if not reference
        if (!line.isReference && referencePixels) {
          const pixels = calculateDistance(start, end);
          const measuredLength = (pixels / referencePixels) * referenceLength;
          line.label.textContent = `${measuredLength.toFixed(2)} ${unit}`;
        }
      }
    }
  
    function calculateDistance(p1, p2) {
      return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    }
  
    function addHandlesAndLabel(line, start, end, text, isRef) {
      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      
      // Start handle (arrow inside the line, pointing outward/left)
      const startHandle = document.createElement('div');
      startHandle.className = 'length-meter-handle' + (isRef ? ' reference' : '');
      startHandle.style.left = start.x + 'px';
      startHandle.style.top = start.y + 'px';
      startHandle.style.transform = `translate(0px, -50%) rotate(${angle + Math.PI}rad)`;
      startHandle.handleType = 'start';
      startHandle.lineElement = line;
      document.body.appendChild(startHandle);
      measurements.push(startHandle);
      line.startHandle = startHandle;
      
      // End handle (arrow inside the line, pointing outward/right)
      const endHandle = document.createElement('div');
      endHandle.className = 'length-meter-handle' + (isRef ? ' reference' : '');
      endHandle.style.left = end.x + 'px';
      endHandle.style.top = end.y + 'px';
      endHandle.style.transform = `translate(-16px, -50%) rotate(${angle}rad)`;
      endHandle.handleType = 'end';
      endHandle.lineElement = line;
      document.body.appendChild(endHandle);
      measurements.push(endHandle);
      line.endHandle = endHandle;
      
      // Label
      const label = document.createElement('div');
      label.className = 'length-meter-label';
      label.textContent = text;
      
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      
      label.style.left = midX + 'px';
      label.style.top = (midY - 25) + 'px';
      
      document.body.appendChild(label);
      measurements.push(label);
      line.label = label;
    }
  
    function showNotification(message) {
      const existing = document.querySelector('.length-meter-notification');
      if (existing) existing.remove();
      
      const notification = document.createElement('div');
      notification.className = 'length-meter-notification';
      notification.textContent = message;
      document.body.appendChild(notification);
      
      setTimeout(() => notification.remove(), 3000);
    }
  
    function clearAll() {
      measurements.forEach(el => el.remove());
      measurements = [];
      referencePixels = null;
      referenceLength = null;
      mode = null;
      startPoint = null;
      if (currentLine) {
        currentLine.remove();
        currentLine = null;
      }
    }
  })();