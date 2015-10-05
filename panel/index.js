(function () {

var Path = require('fire-path');
var Fs = require('fire-fs');
var Globby = require("globby");

var _assetsPath = '';

Editor.registerPanel( 'quick-open.panel', {
    listeners: {
        'keydown': '_onKeyDown',
    },

    properties: {
        searchText: {
            type: String,
            value: ''
        }
    },

    ready: function () {
        var search = this.$.search, searchElem, self = this;
        // A trick to make input field auto focused
        setTimeout(function () {
            search.$.input.select();
        }, 1);
        
        this.searchText = '';
        Editor.assetdb.queryPathByUrl('assets://', function (url) {
            if (url) {
                _assetsPath = url + "/";
            }
        });
    },

    search: function (name) {
        var files = [], file, paths, path, i;

        if (_assetsPath !== '' && name !== '') {
            paths = Globby.sync( Path.join( _assetsPath, '**', name+'*' ), {nocase: true} );

            for (i = 0; i < paths.length; i++) {
                path = Path.resolve(paths[i]);
                // Filte meta files
                if (Path.extname(path).toUpperCase() === '.META') {
                    continue;
                }

                file = {
                    path: Path.relative( _assetsPath, path ),
                    count: i,
                    selected: (i == 0 ? true : false)
                }
                files.push(file);
            }
        }

        return files;
    },

    _onKeyDown: function ( event ) {
        // up-arrow
        if ( event.keyCode === 38 ) {
            event.stopPropagation();
            event.preventDefault();

            var selected = this.$.filesList.querySelector("[selected]");
            var nextSelect = selected.previousElementSibling;
            // Valid next selected item (the one on top of the current one)
            if (nextSelect && nextSelect.selected !== undefined) {
                selected.selected = false;
                nextSelect.selected = true;
                this.$.filesList.scrollTop = nextSelect.offsetTop;
                return;
            }
        }
        // down-arrow
        else if ( event.keyCode === 40 ) {
            event.stopPropagation();
            event.preventDefault();

            var selected = this.$.filesList.querySelector("[selected]");
            var nextSelect = selected.nextElementSibling;
            // Valid next selected item (the one on top of the current one)
            if (nextSelect && nextSelect.selected !== undefined) {
                selected.selected = false;
                nextSelect.selected = true;
                this.$.filesList.scrollTop = nextSelect.offsetTop;
                return;
            }
        }
        // enter
        else if ( event.keyCode === 13 ) {
            event.stopPropagation();
            event.preventDefault();

            this._onConfirm();
        }
    },

    _onConfirm: function () {
        var filesElems = this.$.filesList;
        var items = filesElems.children, i, item;
        for (i = 0; i < items.length; i++) {
            item = items[i];
            if (item.selected) {
                this.openFile(item.path);
                break;
            }
        }
    },

    openFile: function (path) {
        var url = _assetsPath + path;

        // Get uuid
        Fs.readFile(url + '.meta', function (err, data) {
            var uuid = '';
            var meta = null;
            if (err) {
                Editor.error('Failed to read meta file of', path);
                return;
            }

            try {
                meta = JSON.parse(data);
                uuid = meta.uuid;
            }
            catch (e) {
            }
            if (!uuid) {
                Editor.error('Failed to parse meta file of', path);
                return;
            }

            // Open file
            Editor.assetdb.queryInfoByUuid( uuid, function ( info ) {
                var assetType = info.type;
                if ( assetType === 'javascript' || assetType === 'coffeescript' ) {
                    Editor.sendToCore('code-editor:open-by-uuid', uuid);
                }
                else if ( assetType === 'scene' ) {
                    Editor.sendToCore('scene:open-by-uuid', uuid);
                }
            });
        });
    }
});

})();