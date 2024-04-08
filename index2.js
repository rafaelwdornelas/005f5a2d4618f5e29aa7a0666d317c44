
require('dotenv').config();
const fs = require("fs")
const nodemailer = require("nodemailer")
const randomstring = require("randomstring");
const { exec } = require('child_process');
const { spawn } = require('child_process');
const util = require('util');
const http = require('http');
const https = require('https');
const execProm = util.promisify(exec);
var totalRequested = 0
var totalError = 0
var locaweb = true; 
var bloqueado = false; 
var externalIP = "127.0.0.1"
//função pagar o hostname do servidor
function getServerName() {
  const hostname = require('os').hostname()
  return hostname
}

async function Inicia() {
    const IP = process.env.IP
    const PORT = process.env.PORTA
    const serverName = getServerName()
    const UrlEmails = `http://${IP}:${PORT}/emails`
    const URLhtml = `http://${IP}:${PORT}/html`

    //faz uma requisição para o servidor para pegar os emails
    const response = await fetch(UrlEmails)
    const data = await response.json()
    
     /*  //apaga toda lista de email em data e coloca um só email para enviar loja712@farmaconde.com.br
      data.length = 0
      data.push("loja712@farmaconde.com.br")
 */
    //verifica se tem emails para enviar
    if (data.length == 0) {
      console.log("Não há emails para enviar")
      return
    }

  

    //pegar o html
    const responseHtml = await fetch(URLhtml)
    const html = await responseHtml.text()
    const text = HTMLPartToTextPart(html)

   //cria grupos de 25 emails
    const groups = data.reduce((acc, email, index) => {
      const groupIndex = Math.floor(index / 25)
      if (!acc[groupIndex]) {
        acc[groupIndex] = []
      }
      acc[groupIndex].push(email)
      return acc
    }, [])

    //envia o email para cada grupo
    for (const group of groups) {
      try {
        await sendEmail(group, html, text,serverName)
        totalRequested += group.length
        if (totalRequested % 100 === 0) {
            addEnviados(totalRequested);
        }
      } catch (error) {
        console.log(error)
        totalError += group.length
      }
    }

    console.log(`Total de emails enviados: ${totalRequested}`)
    console.log(`Total de emails com erro: ${totalError}`)
    
    //verifica se ja foi enviado 10mil emails e para o envio
    if (totalRequested >= 10000) {
       addEnviados(10000);
      console.log("Limite de 10mil emails enviados atingido")
      //fecha programa
        process.exit(0)
    } else {
        await esperaFila()
        Inicia()
    }
}

async function sendEmail(emails, html, text, serverName) {
    try {
        const transport = nodemailer.createTransport({ port: 25, tls: { rejectUnauthorized: false }, ignoreTLS: true })
        const fromName = process.env.NAME
        const fromUser = randomstring.generate(between(3, 5)) 
        const subject = process.env.ASSUNTO

        for (const to of emails) {
            tmphtml = await editehtml(html)
            console.log("enviando para",to)
            try {
                const message = {
                    encoding: "base64",
                    priority: "normal",
                    date: new Date((new Date()).setHours(new Date().getHours() - parseInt(Math.random() * (23 - 3) + 3))),
                    from: { name: fromName, address: fromUser + "@" + serverName },
                    to: { name: fromName, address: to.email },
                    subject,
                    html:tmphtml,
                    list: {
                      help: `help@${serverName}?subject=help-${String(Math.random()).slice(2)}`,
                      unsubscribe: {
                        url: `https://${serverName}/?target=unsubscribe&u=${String(Math.random()).slice(2)}&email=${to.email}`,
                        comment: "Unsubscribe"
                      },
                    },
                    text: text ? text : html
                  }
                 /*  const sendmail = await transport.sendMail(message)
                  console.log(sendmail.response) */
                  await transport.sendMail(message)
            } catch (error) {
              console.log(error)
            }
        }
      }catch(e){
        throw new Error(e.message)
      }
}

function getString(input, start, end) {
    const startIndex = input.indexOf(start) + start.length;
    const endIndex = input.indexOf(end, startIndex);
    return input.substring(startIndex, endIndex);
}

function addSend(email, relay) {
    console.log(`Sucesso: Email: ${email}, Provedor: ${relay}`);
}

//função para gerar um numero aleatorio entre min e max
function between(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

//função para converter o html em texto
const HTMLPartToTextPart = (HTMLPart) => (
    HTMLPart
      .replace(/\n/ig, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style[^>]*>/ig, '')
      .replace(/<head[^>]*>[\s\S]*?<\/head[^>]*>/ig, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script[^>]*>/ig, '')
      .replace(/<\/\s*(?:p|div)>/ig, '\n')
      .replace(/<br[^>]*\/?>/ig, '\n')
      .replace(/<[^>]*>/ig, '')
      .replace('&nbsp;', ' ')
      .replace(/[^\S\r\n][^\S\r\n]+/ig, ' ')
  );

  async function esperaFila() {
    while (true) {
        const fila = await getFilaMailq();
        console.log("Fila de envio de email: ", fila);
        if (fila > 100) {
            console.log("Fila de envio de email maior que 100, aguardando 1 minuto");
            await sleep(60000); // Sleep for 1 minute
            clearList();
        } else {
            console.log("Fila de envio de email menor que 100, enviando email");
            break;
        }
    }
}

async function getFilaMailq() {
  try {
      const { stdout, stderr } = await execProm(`mailq | grep -c "^[A-F0-9]"`);
      return parseInt(stdout.trim(), 10);
  } catch (error) {
      if (error.stdout) {
          return parseInt(error.stdout.trim(), 10);
      }
      console.error("Erro ao obter a fila de e-mails:", error);
      return 0;
  }
}

function clearList() {
    const firstCmd = `sudo postsuper -d ALL deferred`;

    exec(firstCmd, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Stderr: ${stderr}`);
            return;
        }
        console.log(`Output: ${stdout}`);
    });
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
} 

async function addRegistro() {
    const IP = process.env.IP
    const PORT = process.env.PORTA
    const IPserver = IP + ":" + PORT; // Replace with your server's IP or hostname
    const hostname = getServerName();

    try {
        externalIP = await getExternalIP();
        console.log(`External IP: ${externalIP}`);

        const url = `http://${IPserver}/adddominio?dominio=${hostname}&ip=${externalIP}`;
        console.log(`URL: ${url}`);
        http.get(url, (res) => {
            if (res.statusCode !== 200) {
                console.log(`${hostname} Não adicionado !!!`);
                return;
            }
            res.on('data', () => {
                // Process the response data if needed
            });
            res.on('end', () => {
                console.log(`${hostname} adicionado.`);
            });
        }).on('error', (err) => {
            console.error(`${hostname} Não adicionado !!!`, err);
        });
    } catch (error) {
        console.error(`Error getting external IP: ${error}`);
    }
}

async function addEnviados(quant) {
    const IP = process.env.IP
    const PORT = process.env.PORTA
    const IPserver = IP + ":" + PORT;
    const hostname = getServerName();

    

    const url = `http://${IPserver}/addenviados?dominio=${hostname}&ip=${externalIP}&enviados=${quant}&locaweb=${locaweb}&bloqueado=${bloqueado}`;

    http.get(url, (res) => {
        if (res.statusCode !== 200) {
            console.log(`${hostname} Não adicionado !!!`);
            return;
        }
        res.on('data', () => {
            // Process the response data if needed
        });
        res.on('end', () => {
            console.log(`${hostname} adicionado.`);
        });
    }).on('error', (err) => {
        console.error(`${hostname} Não adicionado !!!`, err);
    });
}

async function getExternalIP() {
    return new Promise((resolve, reject) => {
        https.get('https://api.ipify.org', (res) => {
            let ip = '';
            res.on('data', chunk => {
                ip += chunk;
            });
            res.on('end', () => {
                resolve(ip);
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

async function editehtml(html) {
    //altera numero randomico
    html = html.replace(/%%N(.*?)%%/gim, (_, size, __) => genNumber(Number(size)))
    
    //adiciona um ID no final do email
    html = html.replace(
    /<\/html>/g,
    '<br><br><br><br><br><br><font color="#fff">Tipe_' +
      randomstring.generate(between(15, 50)) +
      "_S</font></html>"
    );
    
   
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

function verificaLog() {
    const firstCmd = "tail -f /var/log/syslog | grep status=";
    const cmd = spawn("bash", ["-c", firstCmd]);

    cmd.stdout.on('data', (data) => {
        const retorno = data.toString();
        const retornoarr = retorno.split("\n");

        for (let linha of retornoarr) {
            if (linha.includes("status=sent")) {
                if (linha.includes("to=<") && linha.includes("relay=")) {
                    const xemail = getString(linha, "to=<", ">");
                    const xrelay = getString(linha, "relay=", "[");
                    addSend(xemail, xrelay);
                    if (linha.includes("locaweb.com.br")) {
                        locaweb = true;
                        bloqueado = false;
                    }
                }
            } else if (linha.includes("status=")) {
                if (linha.includes("blocked using ") && !linha.includes("outlook.com") && linha.includes("locaweb.com.br")) {
                    console.log("Bloqueado");
                    //console.log(linha);
                    locaweb = false;
                    bloqueado = true;
                }
            }
        }
    });

    cmd.stderr.on('data', (data) => {
        console.error(`stderr: ${data.toString()}`);
    });

    cmd.on('close', (code) => {
        console.log(`Child process exited with code ${code}`);
    });
}

async function start() {
    try {
        await addRegistro();
        //exucuta a função verificaLog sem parar o prorgama
        verificaLog();
        Inicia();
    } catch (error) {
        console.error("Error starting the process:", error);
    }
}
start()
