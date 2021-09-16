/* eslint-disable */
export default class Server {
  constructor(address, Vue, port = '44055', endpoint = 'api') {
    this.url = `${address}:${port}/${endpoint}`
    this.http = Vue.$http
  }

  GET(endpoint) {
    return this.http.get(this.url + `${endpoint}`).then((resp) => {
      return resp.data
    }, (resp) => {
      console.log(`Error! ${resp}`)
      return null
    })
  }

  POST(endpoint) {
    return this.http.post(this.url + `${endpoint}`).then((resp) => {
      return resp.data
    }, (resp) => {
      console.log(`Error! ${resp}`)
      return null
    })
  }

  getChats() { return this.GET('/chats') }

  getAttachments() { return this.GET('/attachments') }

  getMessages(chatId) { return this.GET(`/messages/${chatId}`) }
  getMessagesPaged(chatId, page) { return this.GET(`/messages/${chatId}/${(page - 1) * 20}`) }

  getMessageAttachment(msgId) { return this.GET(`/attachments/${msgId}`) }

  postMessage(personId, msg) {
    return this.POST(`/message/${personId}/${msg}`)
  }

}
