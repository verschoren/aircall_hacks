/*
This code takes a webhook from AirCall, parses the contents and creates a Zendesk ticket.
Useful for AirCall IVRs which do not support the Zendesk integration yet.

CAPITALS are variables for Cloudflare workers, on which this code is based.

*/
async function handlePostRequest(request) {

    let reqBody = await readRequestBody(request)
    let phone_number = reqBody.data.raw_digits; //+32 475123 34 56
    let timestamp = reqBody.timestamp; //1584105967
    let duration = reqBody.data.duration; //11
    let token = reqBody.token; //cb11c222f05fc1425ebc439abc123456
  
    let linename = "IVR";
    
    content = "<strong>Inbound answered call on '+linename+'</strong><br>";
    content += "<strong>Caller Phone number:</strong> "+phone_number+"<br>";
    content += "<strong>Waiting time:</strong> 00:00:"+duration+"<br>";
    content += "[Token: "+token+"]<br>";

    const destination = 'https://'+DOMAIN+'.zendesk.com/api/v2/tickets.json';
    let body = {
        "ticket": {
            "requester": {
                "email": timestamp+"@example.com",
                "name": phone_number+ " Aircall New Contact"
            },
            "subject": "Inbound answered call on "+linename, 
            "comment": { "html_body": content },
            "is_public": "false"
        }
    };
    let response = await fetch(destination, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=utf-8',
            'Authorization': 'Basic ' + AUTH
        },
        body: JSON.stringify(body)
    });
    let json = await response.json();
    return new Response("Ticket #" + json['ticket']['id'] + " created");
}
async function handleRequest(request) {
  let retBody = `The request was a GET `
  return new Response(retBody)
}
addEventListener('fetch', event => {
  const { request } = event
  const { url } = request
  if (request.method === 'POST') {
    return event.respondWith(handlePostRequest(request))
  }
})

/**
 * rawHtmlResponse delievers a response with HTML inputted directly
 * into the worker script
 * @param {string} html
 */
async function rawHtmlResponse(html) {
  const init = {
    headers: {
      'content-type': 'text/html;charset=UTF-8',
    },
  }
  return new Response(html, init)
}
/**
 * readRequestBody reads in the incoming request body
 * Use await readRequestBody(..) in an async function to get the string
 * @param {Request} request the incoming request to read from
 */
async function readRequestBody(request) {
  const { headers } = request
  const contentType = headers.get('content-type')
  if (contentType.includes('application/json')) {
    const body = await request.json()
    return body;
   // return JSON.stringify(body)
  } else if (contentType.includes('application/text')) {
    const body = await request.text()
    return body
  } else if (contentType.includes('text/html')) {
    const body = await request.text()
    return body
  } else if (contentType.includes('form')) {
    const formData = await request.formData()
    let body = {}
    for (let entry of formData.entries()) {
      body[entry[0]] = entry[1]
    }
    return JSON.stringify(body)
  } else {
    let myBlob = await request.blob()
    var objectURL = URL.createObjectURL(myBlob)
    return objectURL
  }
}
