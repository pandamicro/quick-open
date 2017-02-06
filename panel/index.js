var Path = require('fire-path');
var Fs = require('fire-fs');
var Globby = require("globby");

var _assetsPath = '';

var createVue = function (elem) {
    var vm = new Vue({
        el: elem,
        data: {
            searchText: '',
            fileItems: [],
            selected: ''
        },
        methods: {
            search () {
                var name = this.searchText;
                var files = [], file, paths, path, i, count;

                if (_assetsPath !== '' && name !== '') {
                    paths = Globby.sync( Path.join( _assetsPath, '**', name+'*' ), {nocase: true} );

                    for (i = 0, count = 0; i < paths.length; i++) {
                        path = Path.resolve(paths[i]);
                        if (Path.extname(path).toUpperCase() === '.META') {
                            continue;
                        }

                        file = {
                            path: Path.relative( _assetsPath, path ),
                            count: count,
                            selected: (i === 0 ? true : false)
                        };
                        files.push(file);
                        count++;
                    }
                }
                this.fileItems = files;
                this.selected = files.length > 0 ? files[0].path : '';
            },

            _onKeyUp (event) {
                var items = this.fileItems, i, selected = -1, 
                    previous, current;
                if (event.keyCode === 38) {
                    event.stopPropagation();
                    event.preventDefault();

                    for (i = items.length - 1; i >= 0; i--) {
                        if (selected >= 0) {
                            previous = items[selected];
                            current = items[i];
                            previous.selected = false;
                            current.selected = true;
                            this.selected = current.path;
                            this.$els.fileslist.scrollTop = this.$els.fileslist.children[i].offsetTop;
                            return;
                        }
                        if (items[i].selected) {
                            selected = i;
                        }
                    }
                }
                else if (event.keyCode === 40) {
                    event.stopPropagation();
                    event.preventDefault();

                    for (i = 0; i < items.length; i++) {
                        if (selected >= 0) {
                            previous = items[selected];
                            current = items[i];
                            previous.selected = false;
                            current.selected = true;
                            this.selected = current.path;
                            this.$els.fileslist.scrollTop = this.$els.fileslist.children[i].offsetTop;
                            return;
                        }
                        if (items[i].selected) {
                            selected = i;
                        }
                    }
                }
                else if (event.keyCode === 13) {
                    event.stopPropagation();
                    event.preventDefault();

                    this._onConfirm();
                }
            },

            _onConfirm () {
                var path = this.selected;
                if (path) {
                    Editor.Ipc.sendToMain('quick-open:open-file', path, _assetsPath + path + '.meta', function (error) {
                        console.log('OPENED FILE ' + path);
                    });
                }
            }
        }
    });

    vm.$els.search.$input.addEventListener('keyup', vm._onKeyUp);

    setTimeout(function () {
        var input = vm.$els.search.$input;
        input.focus();
        input.select();
    }, 1);

    return vm;
};

Editor.Panel.extend({

    style: Fs.readFileSync(Editor.url('packages://quick-open/panel/index.css')) + '',
    template: Fs.readFileSync(Editor.url('packages://quick-open/panel/index.html')) + '',

    ready () {
        Editor.assetdb.queryPathByUrl('db://assets', function (error, url) {
            if (url) {
                _assetsPath = url + "/";
            }
        });

        this._vm = createVue(this.shadowRoot);
    },

    listeners: {
        'focus' () {
            var input = this._vm.$els.search.$input;
            input.focus();
            input.select();
        }
    }
});