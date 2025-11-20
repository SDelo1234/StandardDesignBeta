import fs from 'fs';
import { jsPDF } from 'jspdf';
import { createDesignBriefPayload } from '../src/utils/designBrief.js';

// Mock browser environment
global.window = { jspdf: { jsPDF } };
global.document = {
    createElement: () => ({}),
    getElementById: () => null,
    body: { appendChild: () => { } }
};

// Mock fetch to avoid network requests and image processing issues in Node
global.fetch = async (url) => {
    if (url === '/browne_logo.jpg') {
        console.log('Loading local logo...');
        const buffer = fs.readFileSync('./public/browne_logo.jpg');
        const blobObj = {
            _buffer: buffer,
            type: 'image/jpeg'
        };
        return {
            ok: true,
            status: 200,
            blob: async () => blobObj,
        };
    }
    if (url === '/mock_map.png') {
        console.log('Loading mock map...');
        const buffer = fs.readFileSync('./public/mock_map.png');
        const blobObj = {
            _buffer: buffer,
            type: 'image/png'
        };
        return {
            ok: true,
            status: 200,
            blob: async () => blobObj,
        };
    }
    return {
        ok: false,
        status: 404,
        blob: async () => new Blob([]),
    };
};

// Mock FileReader
global.FileReader = class {
    constructor() {
        this.result = null;
        this.onloadend = () => { }; // Mock onloadend event handler
        this.onerror = () => { }; // Mock onerror event handler
    }
    readAsDataURL(blob) {
        // In our mock fetch, blob is actually a promise that resolves to a Blob-like object
        // But we can just access the underlying buffer if we structure our mock correctly.
        // However, the blob in the fetch mock is `async () => new Blob(...)`.
        // Let's simplify. The fetch mock returns a blob method.
        // Wait, the code calls `await response.blob()`.
        // So `blob` passed here is the result of that.

        // Let's assume the blob has a text() or arrayBuffer() method or we can just hack it since we know what we passed.
        // In the fetch mock: `blob: async () => new Blob([buffer], { type: 'image/jpeg' })`
        // The Blob polyfill in Node might be tricky.

        // Let's try to read the buffer directly if possible, or use a simpler approach.
        // Since we control the fetch mock, let's attach the buffer to the blob.

        if (blob._buffer) {
            const base64 = blob._buffer.toString('base64');
            this.result = `data:image/jpeg;base64,${base64}`;
            this.onloadend();
        } else {
            // Fallback for empty blob or other cases
            this.result = '';
            this.onloadend();
        }
    }
};

// Monkey-patch save to write to disk
jsPDF.prototype.save = function (filename) {
    console.log(`Saving PDF to ${filename}...`);
    const data = this.output();
    fs.writeFileSync(filename, data, 'binary');
    console.log('PDF saved successfully.');
};

// Import the function AFTER mocking
import { generateDesignBriefPdf } from '../src/utils/designBrief.js';

const baseForm = {
    projectName: "Riverside Upgrade",
    postcode: "SW1A 1AA",
    installationMonth: 5,
    durationCategory: "UNDER_4_MONTHS",
    ground: "Hardstanding (concrete/asphalt)",
    requestEmail: "sam@example.com"
};

const options = [
    { id: "A", name: "Standard panels", capacity_kpa: 0.1234, maxHeight_m: 2 },
    { id: "B", name: "Ballasted panels", capacity_kpa: 0.456, maxHeight_m: 2.4 },
];

const wind = {
    source: "dataset",
    match: "SW1A 1AA",
    pressure_kpa: 0.321,
    speed_ms: 24.5,
    vb_map: 22.8,
    baseWind: {
        pressure_kpa: 0.28,
    },
    terrainCategory: "TC2",
    terrainRoughness_z0_m: 0.05,
    derivedFactors: {
        vb_ms: 24.5,
        qb_kpa: 0.321,
        cProb: 1.12,
        cSeason: 0.95,
        cAlt: 1.03,
        cDir: 0.9,
        returnPeriodYears: 5,
    },
    inputs: {
        distanceToSea_km: 2.345,
        altitude_mAOD: 85.2,
        fenceHeight_m: 2.4,
        terrainCategory: "TC2",
        terrainRoughness_z0_m: 0.05,
    },
};

const payload = createDesignBriefPayload({
    form: baseForm,
    wind,
    options,
    selectedIds: ["A", "B"],
    currentDate: new Date(),
});

// Run generation
// Use the mock map image for testing
const mockMapImage = `data:image/png;base64,${fs.readFileSync('./public/mock_map.png').toString('base64')}`;

generateDesignBriefPdf({ payload, mapImage: mockMapImage })
    .then(filename => {
        console.log(`Generated: ${filename}`);
    })
    .catch(err => {
        console.error("Error generating PDF:", err);
        process.exit(1);
    });
