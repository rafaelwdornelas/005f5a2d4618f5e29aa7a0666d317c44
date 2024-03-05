
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0

const express = require("express")
const nodemailer = require("nodemailer")
const { convert } = require("html-to-text")
const app = express()

const elementos = [
  "-ms-user-select: none;",
  "-webkit-text-decoration-skip: objects;",
  "-webkit-user-select: none;",
  "align-items: center;",
  "align-items: left;",
  "background-color: transparent;",
  "border: 0 none transparent;",
  "border: none !important;",
  "border: none;",
  "bottom: 0;",
  "bottom: 10;",
  "bottom: 20;",
  "box-shadow: none !important;",
  "box-sizing: content-box;",
  "color: #fff;",
  "color: inherit;",
  "display: flex;",
  "display: grid;",
  "display: inline !important;",
  "display: inline;",
  "fill: currentColor;",
  "flex-grow: 0;",
  "flex-shrink: 0;",
  "font-size: 1em;",
  "font: inherit inherit inherit/inherit inherit;",
  "grid-gap: 30px;",
  "grid-template-columns: 1fr 1fr;",
  "height: 0 !important;",
  "height: 100%;",
  "height: calc(1em + 3px);",
  "justify-content: center;",
  "left: calc(50% - 0.5em) !important;",
  "letter-spacing: inherit;",
  "line-height: 1 !important;",
  "line-height: calc(1em + 2px);",
  "line-height: inherit;",
  "margin: 0 !important;",
  "margin: 0;",
  "min-height: 0 !important;",
  "min-width: 0 !important;",
  "opacity: 1;",
  "opacity: 10;",
  "opacity: 20;",
  "opacity: 30;",
  "outline-width: 0;",
  "outline: none !important;",
  "overflow-x: auto;",
  "overflow-y: hidden;",
  "padding: 0.5em !important;",
  "position: absolute !important;",
  "position: absolute;",
  "position: relative;",
  "right: 0;",
  "scrollbar-width: none;",
  "text-align: center;",
  "text-align: left;",
  "text-decoration: none;",
  "text-transform: inherit;",
  "top: 0;",
  "top: 10;",
  "top: 50;",
  "top: calc(50% - 0.5em) !important;",
  "transform: translate(50%, -50%);",
  "user-select: none;",
  "vertical-align: baseline;",
  "vertical-align: middle;",
  "white-space: nowrap;",
  "width: 0 !important;",
  "width: 100%;",
  "width: 2em;",
  "width: calc(1em + 3px);",
  "z-index: 1;",
];
const tags = [
  "-carousel",
  "-inner",
  "-thumbnails",
  "-layout",
  "-position",
  "-bottom",
  "-left",
  "-top",
  "-repeater",
  "-horizontal",
  "-webkit",
  "-back",
  "-image",
  "-price",
  "-old",
  "-quantity",
  "-button",
  "-blocks",
  "-totals",
  "-tables",
  "-countdown",
  "-nav",
  "-next",
];
const inicio = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
];

app.use(express.json())

const serverName = process.argv[2]

app.get("/working", (req,res) => {
  return res.json({ online: true })
})

app.post("/emailmanager/v2/85136c79cbf9fe36bb9d05d0639c70c265c18d37/sendmail", async (req,res) => {
  try{
    const { to, fromName, fromUser, subject, html, attachments } = req.body
    const toAddress = to.shift()
    const dkim = await fs.readFileSync("./dkim_private.pem", "utf8");
    const htmlnew = await editehtml(html)
    let message = {
        encoding: "base64",
        from:
        "=?UTF-8?B?" +
        Buffer.alloc(name.length, name).toString("base64") +
        "?=" +
        " <" +
        fromUser +
        randomstring.generate(between(3, 5)) +
        "@" +
        serverName +
        ">",
      to: { name: fromName, address: toAddress },
        bcc: to,
      subject: {
        prepared: true,
        value:
          "=?UTF-8?B?" +
          Buffer.alloc(subject.length, subject).toString("base64") +
          "?=",
      },
      html: htmlnew,
      list: {
        unsubscribe: [{
          url: "https://" + serverName + "/?a=unsubscribe&hash=" + String(Math.random()).slice(2),
          comment: "Unsubscribe"
        }],
      },
      text: convert(html, { wordwrap: 85 })
    }
    if(attachments) message["attachments"] = attachments
    const transport = nodemailer.createTransport({
        service: "postfix",
        host: "localhost",
        secure: false,
        port: 25,
        tls: { rejectUnauthorized: false },
        dkim: {
            domainName: hostName,
            keySelector: hostName.split(".")[0],
            privateKey: dkim,
        },
    });
    const sendmail = await transport.sendMail(message)
    if(!sendmail.response.match("250 2.0.0 Ok")) throw new Error("error_to_send")
    return res.status(200).json({ error: false, success: true, sendmail })
  }catch(e){
    return res.status(200).json({ error: true, errorName: e.message })
  }
})

app.listen(4500)


async function editehtml(html) {
    //altera numero randomico
    html = html.replace(/#number-(.*?)#/gim, (_, size, __) => genNumber(Number(size)))
    
    //adiciona um ID no final do email
    html = html.replace(
    /<\/html>/g,
    '<br><br><br><br><br><br><font color="#fff">IDs_' +
      randomstring.generate(between(15, 50)) +
      "_</font></html>"
    );
    
    //cria uma css randomico no html
    let css = await cssgenerator();
    html = html.replace(/<\/head>/g, "<style>" + css + "</style></head>");

    //Pula linhas de forma randomica
    htmlarry = html.split("\n");
    let novohtml = "";
    htmlarry.forEach(function (item) {
        if (item.includes("<")) {
            novohtml += "\n".repeat(between(50, 250)) + item + "\n";
            item + "\n";
        } else {
            novohtml += item + "\n";
        }
    });

    html = novohtml;
    return html
}

function genNumber(length){
    let generated = ""
    for(let i = 0; i < length; i++) generated += String(Math.random()).substring(3)
    return generated.slice(0, length)
}

async function cssgenerator() {
  let linhas = between(500, 1000);
  let letra = inicio[Math.floor(Math.random() * inicio.length)];
  let currentlinhas = 0;
  let css = "";
  //faz um loop ate montar todas as linhas
  do {
    let quanttags = between(1, 3);
    css = css + letra;
    for (let i = 0; i < quanttags; i++) {
      let tagstmp = tags[Math.floor(Math.random() * tags.length)];
      css = css + tagstmp;
    }
    css = css + " {\r\n";
    let quantelementos = between(1, 20);
    for (let i = 0; i < quantelementos; i++) {
      let elemtmp = elementos[Math.floor(Math.random() * elementos.length)];
      css = css + "\t" + elemtmp + "\r\n";
    }
    css = css + "}\r\n";
    currentlinhas = css.split(/\r\n|\r|\n/).length;
  } while (currentlinhas < linhas);
  return css;
}
