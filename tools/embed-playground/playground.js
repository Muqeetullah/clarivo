const snippet = document.querySelector("#snippet");
const status = document.querySelector("#status");
const preview = document.querySelector("#preview");
const base = `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Northstar demo store</title><style>*{box-sizing:border-box}body{margin:0;font:16px/1.6 system-ui;color:#17332c;background:#fafbf8}header{padding:24px 7%;border-bottom:1px solid #dce3da;font-weight:700}main{padding:65px 7%;max-width:850px}span{color:#627669;font-size:13px}h1{font-size:clamp(32px,6vw,52px);line-height:1.15;letter-spacing:-2px}p{color:#566a60;max-width:520px}.card{padding:24px;border:1px solid #dce3da;border-radius:16px;margin-top:32px;background:white}</style></head><body><header>Northstar / Demo store</header><main><span>YOUR DUMMY WEBSITE</span><h1>Thoughtful essentials.<br>Helpful conversations.</h1><p>This sample shop is a place to try your Clarivo installation. Once your script loads, look for the chat launcher in the corner.</p><div class="card"><strong>Try a support conversation</strong><p>Send “Hello, I need some help,” then reply from your Clarivo owner inbox. Refresh to check that the conversation is saved.</p></div></main></body></html>`;
function render(html) {
  // Use a real URL: about:srcdoc has an empty hostname and a null URL origin.
  preview.onload = () => {
    preview.onload = null;
    const document = preview.contentDocument;
    document.open();
    document.write(html);
    document.close();
  };
  preview.removeAttribute("srcdoc");
  preview.src = `/preview?run=${Date.now()}`;
}
function reset() {
  render(base);
}
reset();
document.querySelector("#reset").onclick = () => {
  reset();
  status.textContent =
    "Preview reset. Your pasted script is kept in the editor.";
};
document.querySelector("#phone").onclick = (event) => {
  const phone = event.currentTarget.getAttribute("aria-pressed") !== "true";
  event.currentTarget.setAttribute("aria-pressed", String(phone));
  preview.style.maxWidth = phone ? "390px" : "100%";
  event.currentTarget.textContent = phone ? "Desktop width" : "Phone width";
};
document.querySelector("#file").onchange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 1024 * 1024) {
    status.textContent = "Choose a file smaller than 1 MB.";
    return;
  }
  try {
    const contents = await file.text();
    snippet.value = /\.js$/i.test(file.name)
      ? `<script>${contents.replace(/<\/script/gi, "<\\/script")}</script>`
      : contents;
    status.textContent = `${file.name} is ready. Choose Load widget to run it.`;
  } catch {
    status.textContent =
      "Unable to read this file. Try pasting the snippet instead.";
  }
};
document.querySelector("#load").onclick = () => {
  const parsed = new DOMParser().parseFromString(snippet.value, "text/html");
  const scripts = [...parsed.querySelectorAll("script")];
  if (!scripts.length) {
    status.textContent =
      "Paste the complete script tag from Clarivo Settings, or upload a JavaScript file.";
    return;
  }
  const doc = new DOMParser().parseFromString(base, "text/html");
  for (const source of scripts) {
    const script = doc.createElement("script");
    for (const attribute of source.attributes)
      script.setAttribute(attribute.name, attribute.value);
    script.textContent = source.textContent;
    doc.body.append(script);
  }
  render(`<!doctype html>${doc.documentElement.outerHTML}`);
  status.textContent =
    "Script added to the preview. If the launcher stays hidden, check the app is running and localhost is allowed. This does not confirm a successful connection.";
};
