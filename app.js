const venom = require("venom-bot");
const axios = require("axios");
const banco = require("./src/banco");
const path = require('path');
const treinamento = `
Você é um assistente virtual de atendimento de uma loja de geladinho gourmet chamada Meu Geladin Gourmet. Você deve ser educada, atenciosa, amigável, cordial e muito paciente.

Você não pode oferecer nenhum item ou sabor que não esteja em nosso cardápio. Siga estritamente o roteiro.

Dê um delay de 10 segundos por mesagem.

Não responda nada fora do roteiro, se não souber algo é só informar que em breve entraremos em contato.

Responda sempre em uma mensagem só.

O roteiro de atendimento é:
  1 - Saudação inicial, 👋🏻 cumprimente  o cliente e agradeça por entrar em contato. ☺️ Informe que com o assistente ele pode tirar dúvidas e caso queira fazer um pedido é só acessar o link do nosso cardápio digital, que por ele pode fazer o pedido e quando finalizar o pedido retorna para conversa para concluir, efetuar o pagamento, calcularmos o frete e enviarmos o pedido \n https://meugeladingourmet.netlify.app/
  2 - Se o cleinte quiser pode perguntar sobre orçamento, ai é só informar que já entraremos em contato.
  3 - Quando receber o pedido, informar que em breve entraremos em contato para mandar o frete, caso o pagamento for por pix enviar o pix que é celular 19991030194. 
  4 - Quando receber o pedido e for para retirada e for pagamento por pix, enviar o pix que é o celular 19991030194 e informar que ja pode retirar o pedido.
`
venom
  .create({
    session: 'chatGPT_BOT',
    headless: false,
          
  })
  .then((client) => {
      // Assine o evento 'onQR' para capturar o QR code gerado
      client.onQR((qrCode) => {
          // Envia o QR code para a página HTML
          io.emit('updateQRCode', qrCode);
    });

       // Assine o evento 'status' para capturar o status da conexão
    client.onStateChanged((state) => {
      io.emit('connectionStatus', state);
    });
  })

  .catch((err) => console.log(err));

const header = {
  "Content-Type": "application/json",
  "Authorization": "Bearer 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"
}

const start = (client) => {
  client.onMessage((message) => {
    const userCadastrado = banco.db.find(numero => numero.num === message.from);
    if (!userCadastrado) {
      console.log("Cadastrando usuario");
      banco.db.push({ num: message.from, historico: [] });
    } else {
      console.log("usuario já cadastrado");
    }

    const historico = banco.db.find(num => num.num === message.from);
    historico.historico.push("user: " + message.body);
    console.log(historico.historico);

    console.log(banco.db);
    axios.post("https://api.openai.com/v1/chat/completions", {
      "model": "gpt-3.5-turbo",
      "messages": [
        { "role": "system", "content": treinamento },
        { "role": "system", "content": "historico de conversas: " + historico.historico },
        { "role": "user", "content": message.body }
      ]
    }, {
      headers: header
    })
      .then((response) => {
        console.log(response.data.choices[0].message.content);
        historico.historico.push("assistent: " + response.data.choices[0].message.content);
        client.sendText(message.from, response.data.choices[0].message.content);
      })
      .catch((err) => {
        console.log(err);
      })

  })
};

