
require('dotenv').config();
const fs = require("fs")
const nodemailer = require("nodemailer")
const randomstring = require("randomstring");
var totalRequested = 0
var totalError = 0

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
    
      //apaga toda lista de email em data e coloca um só email para enviar loja712@farmaconde.com.br
      data.length = 0
      data.push("loja712@farmaconde.com.br")

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
      } catch (error) {
        console.log(error)
        totalError += group.length
      }
    }

    console.log(`Total de emails enviados: ${totalRequested}`)
    console.log(`Total de emails com erro: ${totalError}`)
    
    //verifica se ja foi enviado 10mil emails e para o envio
    if (totalRequested >= 10000) {
      console.log("Limite de 10mil emails enviados atingido")
      return
    } else {
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
            try {
                const message = {
                    encoding: "base64",
                    priority: "normal",
                    date: new Date((new Date()).setHours(new Date().getHours() - parseInt(Math.random() * (23 - 3) + 3))),
                    from: { name: fromName, address: fromUser + "@" + serverName },
                    to: { name: fromName, address: to },
                    subject,
                    html,
                    list: {
                      help: `help@${serverName}?subject=help-${String(Math.random()).slice(2)}`,
                      unsubscribe: {
                        url: `https://${serverName}/?target=unsubscribe&u=${String(Math.random()).slice(2)}&email=${email}`,
                        comment: "Unsubscribe"
                      },
                    },
                    text: text ? text : html
                  }
                  const sendmail = await transport.sendMail(message)
                  console.log(sendmail.response)
            } catch (error) {
            
            }
        }
      }catch(e){
        throw new Error(e.message)
      }
}
function between(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
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


Inicia() 