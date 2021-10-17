const http = require('http')
const { createCanvas } = require('canvas')
const assert = require('assert')
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js')

const host = process.env.PDF2PNG_HOST || '0.0.0.0'
const port = process.env.PDF2PNG_PORT || 3001
const defaultFontsPath = process.env.PDF2PNG_FONTS || './node_modules/pdfjs-dist/standard_fonts/'

function NodeCanvasFactory() {
}

NodeCanvasFactory.prototype = {
    create: function NodeCanvasFactory_create(width, height) {
        assert(width > 0 && height > 0, 'Invalid canvas size');
        let canvas = createCanvas(width, height, 'png');
        let context = canvas.getContext('2d');
        return {
            canvas: canvas,
            context: context,
        };
    },

    reset: function NodeCanvasFactory_reset(canvasAndContext, width, height) {
        assert(canvasAndContext.canvas, 'Canvas is not specified');
        assert(width > 0 && height > 0, 'Invalid canvas size');
        canvasAndContext.canvas.width = width;
        canvasAndContext.canvas.height = height;
    },

    destroy: function NodeCanvasFactory_destroy(canvasAndContext) {
        assert(canvasAndContext.canvas, 'Canvas is not specified');

        // Zeroing the width and height cause Firefox to release graphics
        // resources immediately, which can greatly reduce memory consumption.
        canvasAndContext.canvas.width = 0;
        canvasAndContext.canvas.height = 0;
        canvasAndContext.canvas = null;
        canvasAndContext.context = null;
    },
};

http.createServer(function (req, res) {

    if (req.method !== 'POST') {
        res.writeHead(405, {'Content-Type': 'text/plain'});
        res.end('Method Not Allowed\n only POST requests are supported');
        console.error((new Date()).toISOString() + 'http method not allowed: ' + req.method);

        return;
    }
    console.log((new Date()).toISOString() + ' incoming POST request');

    // read incoming POST data in chunks 
    let chunks = [];
    req.on('data', chunk => {
        chunks.push(chunk);
    });

    req.on('end', () => {
        // Read the PDF file into a typed array so PDF.js can load it.
        const rawData = new Uint8Array(Buffer.concat(chunks));

        // Load the PDF file.
        pdfjsLib.getDocument({
            data: rawData,
            disableFontFace: false,
            standardFontDataUrl: defaultFontsPath
        }).promise.then(async (pdfDocument) => {
            console.log((new Date()).toISOString() + ' PDF loaded (' + rawData.byteLength + ' Bytes)');
            const pages = [];

            for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber++) {
                await pdfDocument.getPage(pageNumber).then(async (page) => {
                    // Render the page on a Node canvas with 100% scale.
                    const viewport = page.getViewport({scale: 1,});
                    const canvasFactory = new NodeCanvasFactory();
                    const canvasAndContext = canvasFactory.create(viewport.width, viewport.height);
                    const renderContext = {
                        canvasContext: canvasAndContext.context,
                        viewport: viewport,
                        canvasFactory: canvasFactory
                    };

                    await page.render(renderContext).promise.then(function () {
                        res.writeHead(200, {'Content-Type': 'image/png'});
                        pages.push({
                            page_number: pageNumber,
                            data: canvasAndContext.canvas.toDataURL().replace("data:image/png;base64," , "")
                        });
                        console.log((new Date()).toISOString() + ' PNG created');
                    });
                });

            }

            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify(pages));
        }).catch((reason) => {
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({error: 'Could not convert PDF'}));
            console.error((new Date()).toISOString() + ' Failed to generate: ' + reason);
        });

    });

}).listen(port, host);

console.log('PDF2PNG Server listening on ' + host + ':' + port + ' waiting for PDF data via POST requests');
