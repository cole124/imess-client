import axios from 'axios'
import { _ } from '@/plugins/ic-underscore.js'

import * as JsStore from "jsstore";

var dbName = "SMS" + (process.env.NODE_ENV === 'production' ? '' : 'DEV');
const DBVersion = 2
var port
var connection = new JsStore.Connection();

const ports = [];

self.onerror = function (e) {
    port.postMessage(e);
};

self.addEventListener("connect", function (e) {
    port = e.ports[0];
    ports.push(port)

    port.addEventListener("message", function (event) {
        switch (event.data.cmd) {
            case 'install':
                initDb().then(function (c) {
                    port.postMessage('installed')
                })
                    .catch(err => port.postMessage(err))

                break
            case 'start':
                GetChats()
                    .then(r => console.log('Chats Added to Db', r))
                break
        }
    }, false);
    port.start();
}, false);

async function initDb() {
    var isDbCreated = await connection.initDb(getDbSchema());
    if (isDbCreated) {
        console.log('db created');
    }
    else {
        console.log('db opened');
    }
    return connection;
}

function getDbSchema() {
    var db = {
        name: dbName,
        tables: [{
            name: 'Chats',
            columns: {
                ROWID: { primaryKey: true, dataType: JsStore.DATA_TYPE.Number },
            },
            version: DBVersion
        }]
    }
    return db;
}

// addEventListener('install', (event) => {
//     event.waitUntil(initDb().then(function (connection) {
//         return connection.terminate();
//     }));
// });

addEventListener("message", async event => {
    switch (event.data.cmd) {
        case 'install':
            initDb().then(function (c) {
                connection = c
                port.postMessage('installed')
            })

            break
        case 'start':
            GetChats()
                .then(r => console.log('Chats Added to Db', r))
            break
    }
});

async function GetChats() {
    axios({ url: '#{apiUrl}#/api/chats', method: 'GET' })
        .then(resp => {
            return addChats(resp.data);
        }).catch(err => console.error(err));
}

function addChats(val) {
    var v = val;
    if (!_.isArray(val)) v = [val];

    return connection.insert({
        into: "Chats",
        values: v,
        upsert: true,
        return: true
    })
        .catch(err => console.error('Error Inserting Chats', err))
}