# Script playground

From the repository root, run `node tools/embed-playground/server.mjs`, then open http://localhost:4000. No package installation or deployment is needed. The server binds only to this computer.

Paste your complete script tag from Clarivo Settings, or upload an HTML, JavaScript or text file. Choose **Load widget** to execute its scripts in the dummy shop preview. Uploads stay in the browser. The tool extracts script tags from HTML rather than replacing the sample shop. Reset removes the running widget but keeps your editor contents. Phone width sets the actual preview viewport to at most 390 pixels.

Use your own trusted script. Nothing executes until you choose Load widget. The preview shares the local playground origin so the real widget can validate its parent and retain visitor storage.

For the local Clarivo app, the snippet URL should be `http://localhost:3000/embed.js` with your real `data-workspace` ID. The domain setting uses the hostname `localhost`, without a port. The development loopback exception can also admit local testing, but does not mark installation complete. The app must be running separately.

Running this static playground has no hosting charge. Loading a real widget can contact the database, authentication and realtime services configured by the target app, even when the web app runs locally. It is not an entirely offline test and does not guarantee zero provider cost. The existing cloud testing pause remains in place. No real widget or cloud endpoint was automatically loaded by creating this tool.

The connected milestone currently supports human chat. Send a visitor message here and reply from the owner inbox. Automatic AI answers and knowledge ingestion remain deferred.
