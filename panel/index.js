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
        },
        fileItems: {
            type: Array,
            value: function () {
                return [];
            }
        }
    },

    ready: function () {
        var search = this.$.search, searchElem, self = this;
        // A trick to make input field auto focused
        setTimeout(function () {
            search.$.input.select();
        }, 1);
        
        Editor.assetdb.queryPathByUrl('assets://', function (url) {
            if (url) {
                _assetsPath = url + "/";
            }
        });

        this.searchText = '';
    },

    search: function (event) {
        var name = event.target.inputValue;
        var files = [], file, paths, path, i, count;

        if (_assetsPath !== '' && name !== '') {
            paths = Globby.sync( Path.join( _assetsPath, '**', name+'*' ), {nocase: true} );

            for (i = 0, count = 0; i < paths.length; i++) {
                path = Path.resolve(paths[i]);
                // Filte meta files
                if (Path.extname(path).toUpperCase() === '.META') {
                    continue;
                }

                file = {
                    path: Path.relative( _assetsPath, path ),
                    count: count,
                    selected: (i == 0 ? true : false)
                }
                files.push(file);
                count++;
            }
        }

        this.set("fileItems", files);
    },

    _onKeyDown: function ( event ) {
        // up-arrow
        if ( event.keyCode === 38 ) {
            event.stopPropagation();
            event.preventDefault();

            var files = this.$.files,
                filesDom = this.$.filesList.children,
                items = files.items, i, selected = -1, 
                previous, current;
            // Search from bottom to top
            for (i = items.length - 1; i >= 0; i--) {
                if (selected >= 0) {
                    previous = files.modelForElement(filesDom[selected]);
                    current = files.modelForElement(filesDom[i]);
                    previous.set("item.selected", false);
                    current.set("item.selected", true);
                    return;
                }
                if (items[i].selected) {
                    selected = i;
                }
            }
        }
        // down-arrow
        else if ( event.keyCode === 40 ) {
            event.stopPropagation();
            event.preventDefault();

            var files = this.$.files,
                filesDom = this.$.filesList.children,
                items = files.items, i, selected = -1, 
                previous, current;
            // Search from top to bottom
            for (i = 0; i < items.length; i++) {
                if (selected >= 0) {
                    previous = files.modelForElement(filesDom[selected]);
                    current = files.modelForElement(filesDom[i]);
                    previous.set("item.selected", false);
                    current.set("item.selected", true);
                    return;
                }
                if (items[i].selected) {
                    selected = i;
                }
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
        var items = this.$.files.items, i, fileModel;
        if (!items) 
            return;

        for (i = 0; i < items.length; i++) {
            if (items[i].selected) {
                this.openFile(items[i].path);
                return;
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