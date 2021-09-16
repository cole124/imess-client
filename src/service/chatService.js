import { connection } from "./jsstore_con";
import { _ } from '@/plugins/ic-underscore.js'

export class ChatService {

    constructor(conn) {
        this.connection = conn
        this.chatTable = "Chats";
        this.messageTable = "Messages";
        this.attachmentsTable = "Attachments";
    }

    addChats(val) {
        var v = val;
        if (!_.isArray(val)) v = [val];

        return connection.insert({
            into: this.chatTable,
            values: v,
            upsert: true,
            return: true
        })
            .catch(err => console.error('Error Inserting Chats', err))
    }

    addMessages(val) {
        var v = val;
        if (!_.isArray(val)) v = [val];

        return connection.insert({
            into: this.messageTable,
            values: v,
            upsert: true,
            return: true
        })
            .catch(err => console.error('Error Inserting Messages', err))
    }
}