
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0

const express = require("express")
const nodemailer = require("nodemailer")
const { convert } = require("html-to-text")
const app = express()
const fs = require("fs");
const md5 = require('md5');
const { v4: uuidv4 } = require('uuid');
const randomstring = require("randomstring");
let enviocontagem = 0
let linkgerado = ""

// Array de chaves API e domínios
const apiKeys = [
    { API: "AIzaSyBimuzHmQKpSV2TkQTJnwtodfciaFY8XpE", dominio: "rcw3r" },
    { API: "AIzaSyDqCKRSMead2B8Ko6MgaJqsDVdUxz2lAdQ", dominio: "xek99" },
    { API: "AIzaSyC8nnQXBJEsnfxgpIapFDtFDkr62xDLke4", dominio: "d8hxy" }
];

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

app.post("/emailmanager/v2/85136c79cbf9fe36bb9d05d0639c70c265c18d37/sendmail", async (req, res) => {
  
  let enviolive = 0
  let enviodie = 0
  try{
    const { to, fromName, fromUser, subject, html, attachments, link } = req.body
    const dkim = await fs.readFileSync("./dkim_private.pem", "utf8");

    const transport = nodemailer.createTransport({
        host: 'localhost',
        port: 25,
        auth: {
          user: '', // Se necessário
          pass: '' // Se necessário
      },
      secure: false, // Desative a conexão segura
      ignoreTLS: true, // Desative o uso de STARTTLS
        dkim: {
            domainName: serverName,
            keySelector: serverName.split(".")[0],
            privateKey: dkim,
        },
    });


    for (const destinatario of to) {
      try {
        let htmlnew = await editehtml(html)
        htmlnew = await trocalink(htmlnew, link)
        // Gerar um UUID aleatório
        const id = await uuidv4();
        // Codificar o hash 
        const hash = await md5(id);
    
        const fromx = fromUser + randomstring.generate(between(3, 5)) + "@" + serverName
        let message = {
          encoding: "base64",
          from:
            fromName +
            " <" + fromx +
            ">",
          to: destinatario,
          subject: subject,
          html: htmlnew,
          list: {
            unsubscribe: [{
              url: "https://" + serverName + "/?a=ses&tss=" + String(Math.random()).slice(2),
              comment: "remover"
            }],
          },
          text: convert(html, { wordwrap: 85 }),
          headers: {
            "Message-ID": "<"+hash+"@"+serverName+">",
          },
        }
        if (attachments) message["attachments"] = attachments
        const sendmail = await transport.sendMail(message)
        if (!sendmail.response.match("250 2.0.0 Ok")) throw new Error("error_to_send")
        enviolive++
      } catch (error) {
        enviodie++
      }
    }

    return res.status(200).json({ error: enviodie, success: enviolive})
  } catch (e) {
    console.log(e)
    return res.status(200).json({ error: enviodie, success: enviolive })
  }
})

app.listen(4500)


async function trocalink(html, url) {
  if (linkgerado == "") {
    enviocontagem = 1
    linkgerado = await generateURL(url)
    const regex = /%%LINK%%/g;
    return html.replace(regex, linkgerado);
  } else if (enviocontagem % 1000 === 0) {
    enviocontagem++
    linkgerado = await generateURL(url)
    const regex = /%%LINK%%/g;
    return html.replace(regex, linkgerado);
  } else {
    enviocontagem++
    const regex = /%%LINK%%/g;
    return html.replace(regex, linkgerado);
  }
  
}

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

// Função para selecionar aleatoriamente uma chave API
function getRandomAPIKey() {
    const randomIndex = Math.floor(Math.random() * apiKeys.length);
    return apiKeys[randomIndex];
}

async function generateURL(sourceURL) {
    try {
         // Seleciona aleatoriamente uma chave API do array
        const { API, dominio } = getRandomAPIKey();
        
        const requestBody = {
            longDynamicLink: `https://${dominio}.app.goo.gl/?link=${sourceURL}`
        };

        const response = await fetch(`https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=${API}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });

        if (response.status !== 200) {
            console.log(" -> Problema na API de Encurtamento de URL <- ");
            return sourceURL;
        }

        const responseData = await response.json();
        let newlink = responseData.shortLink;
        if (newlink == "") {
            return sourceURL;
        }
        return newlink;
    } catch (e) {
        console.log(e.message);
        return sourceURL;
    }
}

function between(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
