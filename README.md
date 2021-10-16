# pdf2png-service

A webservice to convert PDF files to PNG images, based on Node.js

## Setup
Install Node.js, e.g. `nvm i 14`  
Install dependencies: `npm install` 

## Configuration
The default port is 3001.

The port can be changed with the environment variable $PDF2PNG_PORT

## Usage
Start the service: `npm start` or `node server.js`.

You can listen on another host by setting `APP_HOST` (default: 0.0.0.0), or another port by setting `APP_PORT

If everything is OK there will appear a line like:  
_PDF2PNG Server listening on 3001 waiting for PDF data via POST requests_

Now use a POST request to send a PDF file to the webservice:

    curl --data-binary @myfile.pdf http://127.0.0.1:3001/ -o firstpage.png

You will receive a JSON response with all the pages as PNG in base64 format.

```json
[
  {
    "page_number": 1,
    "data": "base64........."
  },
  {
    "page_number": 2,
    "data": "base64........."
  },
]
```

### Docker

    docker run -p 3080:3001 storewire/pdf2png-service

will start the webservice on http://localhost:3080
