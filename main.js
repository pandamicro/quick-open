var Fs = require('fire-fs');

module.exports = {
    load: function () {
    },

    unload: function () {
    },

    messages: {
        'open' () {
            Editor.Panel.open('quick-open');
        },

        'open-file' (event, path, metaPath) {
            // Get uuid
            Fs.readFile(metaPath, function (err, data) {
                var uuid = '';
                var error = '';
                var meta = null;
                if (err) {
                    error = 'Failed to read meta file of ' + path + '(' + err + ')';
                    Editor.error(error);
                    event.reply && event.reply(new Error(error));
                    return;
                }

                try {
                    meta = JSON.parse(data);
                    uuid = meta.uuid;
                }
                catch (e) {
                }
                if (!uuid) {
                    error = 'Failed to parse meta file of ' + path;
                    Editor.error(error);
                    event.reply && event.reply(new Error(error));
                    return;
                }

                // Open file
                var info = Editor.assetdb.assetInfoByUuid(uuid);
                var assetType = info.type;
                switch (assetType) {
                case 'javascript':
                case 'coffeescript':
                case 'markdown':
                case 'text':
                    Editor.Ipc.sendToMain('assets:open-text-file', uuid);
                    break;
                case 'scene':
                    Editor.Panel.open('scene', {
                        uuid: uuid,
                    });
                    break;
                case 'prefab':
                    Editor.Ipc.sendToAll('scene:enter-prefab-edit-mode', uuid);
                    break;
                default:
                    event.reply && event.reply(new Error('Failed to open file (' + path + ') of type: ' + assetType));
                    return;
                }
                event.reply && event.reply(null);
            });
        }
    }

};
