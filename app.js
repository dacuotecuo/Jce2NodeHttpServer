
const Hapi = require('hapi');
const Path = require('path');
const multiparty = require('multiparty');

const host = process.env.IP    || '127.0.0.1';
const port = process.env.PORT  || 10080;

const server = new Hapi.Server({
    connections: {
        routes: {
            files: {
                relativeTo: Path.join(__dirname, 'views')
            }
        }
    }
});


server.connection({
    host: host,
    port: port
});

server.register(require('inert'), () => {

    server.route([{
        method  : 'GET',
        path    : '/',
        handler : (_, reply) => reply.file('index.html'),
        config: {
            state: {
                parse: false,
                failAction: 'ignore'
            }
        }
    }, {
        method  : 'POST',
        path    : '/upload',
        handler : (request, reply) => {
            const form = new multiparty.Form()
            form.parse(request.payload, function(err, fields, files) {
                if (err) return reply(err);
                else {
                    fs.readFile(files.file[0].path, (err, data) => {

                    });
                }
            });

        },
        config: {
            state: {
                parse: false,
                failAction: 'ignore'
            },
            payload: {
                output  : 'stream',
                parse   : false,
                allow   : 'multipart/form-data',
                maxBytes: 209715200
            }
        }
    }]);

    server.start(() => {
        console.info(`Hapi is listening at ${server.info.uri}`);
    });
});