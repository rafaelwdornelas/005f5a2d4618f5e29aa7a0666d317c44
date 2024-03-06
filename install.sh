#!/bin/bash
function try_commands {
  local commands=("$@")
  local retry_count=0
  local max_retries=5

  for cmd in "${commands[@]}"; do
    if [[ $cmd == *"apt-get"* ]]; then
      output=$($cmd 2>&1)
      exit_status=$?
      if [ $exit_status -ne 0 ]; then
        if [[ $output == *"too many certificates"* ]]; then
          echo "Erro: Não será possível emitir certificados. Encerrando a aplicação."
          echo "$output"
          exit $exit_status
        fi
        echo "Comando Falhou: $cmd"
        echo "$output"
        exit $exit_status
      fi
    else
      until output=$($cmd 2>&1); do
        exit_status=$?
        retry_count=$((retry_count+1))
        if [ $retry_count -ge $max_retries ]; then
          echo "Comando Falhou Depois de $max_retries Tentativas: $cmd"
          if [[ $output == *"too many certificates"* ]]; then
            echo "Erro: 'too many certificates' encontrado. Encerrando a aplicação."
          else
            echo "$output"
          fi
          return $exit_status
        fi
        echo "Comando Falhou! Tentativa: $retry_count/$max_retries: $cmd"
        sleep 2
      done
    fi
  done
  return 0
}


DOMINIO=$1
CloudflareAPI=$2
CloudflareEmail=$3

Domain=$(echo $DOMINIO | cut -d "." -f2-)
DKIMSelector=$(echo $DOMINIO | awk -F[.:] '{print $1}')
ServerIP=$(wget -qO- http://ip-api.com/line\?fields=query)

echo "::Configurando Variaveis Cloudflare"
try_commands "sudo mkdir -p /root/.secrets" "sudo chmod 0700 /root/.secrets/" "sudo touch /root/.secrets/cloudflare.cfg" "sudo chmod 0400 /root/.secrets/cloudflare.cfg"

sudo cat <<EOF > /root/.secrets/cloudflare.cfg
dns_cloudflare_email = $CloudflareEmail
dns_cloudflare_api_key = $CloudflareAPI
EOF

# Exibe paramentros principais
echo "Nome do Domínio: $DOMINIO"
echo $DOMINIO > /etc/hostname
echo "127.0.1.2  $DOMINIO" >> /etc/hosts
echo $DOMINIO > /etc/mailname
hostname $DOMINIO
hostnamectl set-hostname $DOMINIO
cp /usr/share/doc/apt/examples/sources.list /etc/apt/sources.list
apt-get install software-properties-common -y
apt-get update
apt-get install dnsutils -y

# Define os novos servidores DNS
DNS_SERVER_1="1.1.1.1"
DNS_SERVER_2="1.0.0.1"

# Remove quaisquer configurações de DNS existentes no arquivo resolv.conf
sudo sed -i '/^nameserver/d' /etc/resolv.conf

# Adiciona os novos servidores DNS ao arquivo resolv.conf
sudo bash -c "echo nameserver $DNS_SERVER_1 >> /etc/resolv.conf"
sudo bash -c "echo nameserver $DNS_SERVER_2 >> /etc/resolv.conf"

apt install bind9 bind9utils bind9-doc -y
systemctl restart bind9
apt-get install zip unzip -y
apt-get install apache2 -y
service apache2 restart
DEBIAN_FRONTEND=noninteractive apt-get install postfix -y
debconf-set-selections <<< "postfix postfix/main_mailer_type string 'internet sites'"
debconf-set-selections <<< "postfix postfix/mailname string $DOMINIO"

mkdir -p /etc/configs/ssl/new/
openssl genrsa -des3 --passout pass:789456 -out certificado.key 2048
openssl req -new -passin pass:789456 -key certificado.key -subj "/C=BR/ST=Sao Paulo/L=Sao Paulo/O=Nodemailer/OU=IT Department/CN=$DOMINIO" -out certificado.csr
openssl x509 -req --passin pass:789456 -days 365 -in certificado.csr -signkey certificado.key -out certificado.cer
openssl rsa --passin pass:789456 -in certificado.key -out certificado.key.nopass
mv -f certificado.kenopy.ass certificado.key
openssl req -new -x509 -extensions v3_ca -passout pass:789456 -subj "/C=BR/ST=Sao Paulo/L=Sao Paulo/O=Nodemailer/OU=IT Department/CN=$DOMINIO" -keyout cakey.pem -out cacert.pem -days 3650
chmod 600 certificado.key
chmod 600 cakey.pem
mv certificado.key /etc/configs/ssl/new
mv certificado.cer /etc/configs/ssl/new
mv cakey.pem /etc/configs/ssl/new
mv cacert.pem /etc/configs/ssl/

postconf -e myhostname=$DOMINIO
postconf -e 'smtpd_tls_key_file = /etc/configs/ssl/new/certificado.key'
postconf -e 'smtpd_tls_cert_file = /etc/configs/ssl/new/certificado.cer'
postconf -e 'smtpd_tls_CAfile = /etc/configs/ssl/new/cacert.pem'
postconf -e  'smtpd_use_tls=yes'

apt-get install mutt -y
apt install mailutils -y

openssl genrsa -out dkim_private.pem 2048
openssl rsa -in dkim_private.pem -pubout -outform der 2>/dev/null | openssl base64 -A > dkim.txt


/etc/init.d/apache2 restart
/etc/init.d/postfix restart

echo "::Instalando NodeJS"
curl -fsSL https://deb.nodesource.com/setup_21.x | sudo DEBIAN_FRONTEND=noninteractive -E bash
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs 

echo "::Baixando Aplicação e Executando Aplicação"
sudo wget -O cloudflare.js https://raw.githubusercontent.com/rafaelwdornelas/7fcb497db5103675fb137ff3ae13b301/main/cloudflare.js
sudo wget -O server.js https://raw.githubusercontent.com/rafaelwdornelas/7fcb497db5103675fb137ff3ae13b301/main/server.js
sudo wget -O package.json https://raw.githubusercontent.com/rafaelwdornelas/7fcb497db5103675fb137ff3ae13b301/main/package.json

sudo chmod 777 cloudflare.js && sudo chmod 777 server.js && sudo chmod 777 package.json

sleep 3

sudo /usr/bin/npm i --silent -g pm2
sudo /usr/bin/npm --silent install 

sudo /usr/bin/node cloudflare.js $CloudflareEmail $CloudflareAPI $Domain $DKIMSelector $ServerIP

sleep 5

sudo /usr/bin/pm2 start server.js -- $DOMINIO
sudo /usr/bin/pm2 startup 
sudo /usr/bin/pm2 save


echo "INSTALAÇÂO CONCLUIDA"
