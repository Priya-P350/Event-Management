const QRCode = require('qrcode');

/**
 * Generates a Data URL image representation of a QR code payload.
 */
async function generateQRCodeDataUrl(textPayload) {
    try {
        const dataUrl = await QRCode.toDataURL(textPayload, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            margin: 2,
            scale: 8,
            color: {
                dark: '#020617', // Deep obsidian black
                light: '#ffffff' // High contrast white
            }
        });
        return dataUrl;
    } catch (error) {
        console.error('[QR Generation Error]', error);
        throw error;
    }
}

module.exports = {
    generateQRCodeDataUrl
};
