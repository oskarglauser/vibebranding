document.addEventListener('DOMContentLoaded', function() {
    const brandNameInput = document.getElementById('brand-name');
    const fontSelect = document.getElementById('font-select');
    const letterSpacingRadios = document.querySelectorAll('input[name="letter-spacing"]');
    const textCaseRadios = document.querySelectorAll('input[name="text-case"]');
    const logoPreview = document.getElementById('logo-preview');
    const exportPngBtn = document.getElementById('export-png');
    const exportSvgBtn = document.getElementById('export-svg');

    function updatePreview() {
        const brandName = brandNameInput.value.trim() || 'Your Brand';
        const selectedFont = fontSelect.value;
        const selectedLetterSpacing = document.querySelector('input[name="letter-spacing"]:checked').value;
        const selectedTextCase = document.querySelector('input[name="text-case"]:checked').value;

        logoPreview.textContent = brandName;
        logoPreview.style.fontFamily = `'${selectedFont}', sans-serif`;
        
        logoPreview.className = 'logo';
        logoPreview.classList.add(`letter-spacing-${selectedLetterSpacing}`);
        logoPreview.classList.add(`text-case-${selectedTextCase}`);
    }

    brandNameInput.addEventListener('input', updatePreview);
    fontSelect.addEventListener('change', updatePreview);
    
    letterSpacingRadios.forEach(radio => {
        radio.addEventListener('change', updatePreview);
    });
    
    textCaseRadios.forEach(radio => {
        radio.addEventListener('change', updatePreview);
    });

    exportPngBtn.addEventListener('click', function() {
        exportAsPNG();
    });

    exportSvgBtn.addEventListener('click', function() {
        exportAsSVG();
    });

    function exportAsPNG() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const logoText = logoPreview.textContent;
        
        canvas.width = 800;
        canvas.height = 300;
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const computedStyle = window.getComputedStyle(logoPreview);
        const fontSize = 80;
        const fontFamily = computedStyle.fontFamily;
        const letterSpacing = getLetterSpacingValue(computedStyle);
        const textTransform = computedStyle.textTransform;
        
        let displayText = logoText;
        if (textTransform === 'uppercase') {
            displayText = logoText.toUpperCase();
        }
        
        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.fillStyle = '#1a202c';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (letterSpacing !== 'normal') {
            drawTextWithLetterSpacing(ctx, displayText, canvas.width / 2, canvas.height / 2, letterSpacing);
        } else {
            ctx.fillText(displayText, canvas.width / 2, canvas.height / 2);
        }
        
        const link = document.createElement('a');
        link.download = `${logoText.replace(/\s+/g, '-').toLowerCase()}-logo.png`;
        link.href = canvas.toDataURL();
        link.click();
    }

    function exportAsSVG() {
        const logoText = logoPreview.textContent;
        const computedStyle = window.getComputedStyle(logoPreview);
        const fontFamily = computedStyle.fontFamily;
        const letterSpacing = getLetterSpacingValue(computedStyle);
        const textTransform = computedStyle.textTransform;
        
        let displayText = logoText;
        if (textTransform === 'uppercase') {
            displayText = logoText.toUpperCase();
        }
        
        const svgWidth = 800;
        const svgHeight = 300;
        const fontSize = 80;
        
        const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#ffffff"/>
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" 
          font-family="${fontFamily}" font-size="${fontSize}" fill="#1a202c" 
          letter-spacing="${letterSpacing}">${displayText}</text>
</svg>`;
        
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const link = document.createElement('a');
        link.download = `${logoText.replace(/\s+/g, '-').toLowerCase()}-logo.svg`;
        link.href = URL.createObjectURL(blob);
        link.click();
    }

    function getLetterSpacingValue(computedStyle) {
        const logoElement = logoPreview;
        if (logoElement.classList.contains('letter-spacing-tight')) {
            return '-0.02em';
        } else if (logoElement.classList.contains('letter-spacing-wide')) {
            return '0.1em';
        }
        return 'normal';
    }

    function drawTextWithLetterSpacing(ctx, text, x, y, letterSpacing) {
        const spacing = letterSpacing === '-0.02em' ? -2 : (letterSpacing === '0.1em' ? 8 : 0);
        const totalWidth = ctx.measureText(text).width + (text.length - 1) * spacing;
        let currentX = x - totalWidth / 2;
        
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const charWidth = ctx.measureText(char).width;
            ctx.fillText(char, currentX + charWidth / 2, y);
            currentX += charWidth + spacing;
        }
    }

    updatePreview();
});