
const Hapi = require('hapi');
const Path = require('path');
const multiparty = require('multiparty');
const fs = require('fs');

require('shelljs/global');

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
            if (!which('jce2node')) {

                return reply('jce2node not exist')
            }

            const form = new multiparty.Form()
            form.parse(request.payload, function(err, fields, files) {
                if (err) {

                    console.log(err);
                    return reply('file upload error');
                }

                const fileName = files.upload[0].originalFilename;

                if (!/\.jce/.test(fileName)) {

                    return reply('file name is invalid, only jce can be uploaded');

                }

                fs.readFile(files.upload[0].path, (err, data) => {

                    if (err) {
                        console.log(err);
                        reply('read file error');
                    }

                    const fileContent = data.toString('utf8');

                    const folderName = fileName.slice(0, fileName.indexOf('.jce'));

                    if (!fs.existsSync(`${__dirname}/views/file/${folderName}`)) {
                        fs.mkdirSync(`${__dirname}/views/file/${folderName}`);
                    }

                    fs.writeFileSync(`./views/file/${folderName}/${fileName}`, fileContent, 'utf8');

                    exec(`jce2node --server --client ${fileName}`);
                    
                    cd('views/file');

                    console.log(`tar cvfz ${folderName}.tgz ${folderName}/`);

                    exec(`tar cvfz ${folderName}.tgz ${folderName}/`);

                    setTimeout(() => {

                        cd(`${__dirname}/views/file`);
                        exec(`rm -rf ${folderName}.tgz ${folderName}/`);

                    }, 5 * 1e3);

                    return reply.redirect(`/download?file=${folderName}`);

                });
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
    }, {
        method  : 'GET',
        path    : '/download',
        handler : (request, reply) => {

            const file = request.query.file;

            reply.file(`file/${file}.tgz`).header('Content-Disposition', `attachment; filename=${file}.tgz`);
        },
        config  : {
            state : {
                parse : false,
                failAction: 'ignore'
            }
        }
    }]);

    server.start(() => {
        console.info(`Hapi is listening at ${server.info.uri}`);
    });
});