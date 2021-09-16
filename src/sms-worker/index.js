const worker = new Worker('./smsWorker.js', { type: 'module' });

const send = message => worker.postMessage(message)

const install = message => worker.postMessage({ cmd: "install" })

export default {
    worker,
    send,
    install
}