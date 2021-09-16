import { connection } from "./jsstore_con";
import * as JsStore from "jsstore";


const DBName = "SMS" + (process.env.NODE_ENV === 'production' ? '' : 'DEV');
//const DBName = `InFormCloud#{envsuffix}#`;
const DBVersion = 1;

const getDatabase = () => {
    var arrTables = [
        {
            name: 'Chats',
            columns: {
                ROWID: { primaryKey: true, dataType: JsStore.DATA_TYPE.Number },
            },
            version: DBVersion
        },
        {
            name: 'Messages',
            columns: {
                ROWID: { primaryKey: true, dataType: JsStore.DATA_TYPE.Number },
                Z_PK: { dataType: JsStore.DATA_TYPE.String },
                dSort: { dataType: JsStore.DATA_TYPE.Number },
                hID: { dataType: JsStore.DATA_TYPE.String },
                text: { dataType: JsStore.DATA_TYPE.String },
            },
            version: DBVersion
        },
        {
            name: 'Attachments',
            columns: {
                attachment_id: { primaryKey: true, dataType: JsStore.DATA_TYPE.Number },
            },
            version: DBVersion
        },
    ]

    const dataBase = {
        name: "SMS" + (process.env.NODE_ENV === 'production' ? '' : 'DEV'),
        tables: arrTables
    };
    return dataBase;
}

export const initJsStore = async () => {
    const dataBase = getDatabase();
    return await connection.initDb(dataBase);
};