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
            paths = Globby.sync( _assetsPath + '**/' + name + '*', {nocase: true} );

            for (i = 0; i < paths.length; i++) {
                path = paths[i];
                // Filte meta files
                if (Path.extname(path).toUpperCase() === '.META') {
                    continue;
                }

                file = {
                    path: path.substr(_assetsPath.length),
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

            var filesElems = this.$.files;
            var items = filesElems.getElementsByTagName('QUICK-OPEN-FILE-ITEM');
            var lastSelected = null;
            for (var i = items.length - 1; i >= 0; i--) {
                current = items[i];
                if (lastSelected) {
                    lastSelected.selected = false;
                    current.selected = true;
                    filesElems.scrollTop = current.offsetTop;
                    return;
                }
                if (current.selected) {
                    lastSelected = current;
                }
            };
        }
        // down-arrow
        else if ( event.keyCode === 40 ) {
            event.stopPropagation();
            event.preventDefault();

            var filesElems = this.$.files;
            var items = filesElems.getElementsByTagName('QUICK-OPEN-FILE-ITEM');
            var lastSelected = null;
            var current = null;
            for (var i = 0; i < items.length; i++) {
                current = items[i];
                if (lastSelected) {
                    lastSelected.selected = false;
                    current.selected = true;
                    filesElems.scrollTop = current.offsetTop;
                    return;
                }
                if (current.selected) {
                    lastSelected = current;
                }
            };
        }
        // enter
        else if ( event.keyCode === 13 ) {
            event.stopPropagation();
            event.preventDefault();

            this._onConfirm();
        }
    },

    _onConfirm: function () {
        var filesElems = this.$.files;
        var item = filesElems.getElementsByClassName('selected')[0];
        if (item) {
            this.openFile(item.parentElement.path);
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
            }
            else {
                try {
                    meta = JSON.parse(data);
                    uuid = meta.uuid;
                }
                catch (e) {
                }
                if (!uuid) {
                    Editor.error('Failed to parse meta file of', path);
                }
                else {
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
                }
            }
        });
    }
});

})();