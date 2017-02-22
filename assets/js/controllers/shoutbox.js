define(
    [
        '$', 
        '_',
        'utils/template', 
        'utils/api',
        'utils/emoji',
        'utils/message',
        'utils/storage',
        'controllers/shout'
    ], 
    function(
        $, 
        _,
        template, 
        api,
        emoji,
        message,
        storage,
        shoutCtrl
    ) {
        var shoutForm;
        var typeahead;
        var shoutElement;
        var typeaheadOpen = false;
        var typeaheadCursor;
        var typeaheadTriggers ='[\:\#\@]?'; 
        var typeaheadData = {};
        var locationActive = false;

        var typeaheadHandlers = [
            _handleHashtagTypeahead,
            _handleMentionTypeahead,
            _handleEmojiTypeahead
        ];

        var keypressHandlers = [
            _handleEnterKeypress,
            _handleArrowKeypress
        ];
        
        return {
            init: init,
            placeholderUpdate: _placeholderUpdate
        };

        function init(element) {
            if (element.length === 0) return;
            
            shoutForm = element;
            shoutElement = shoutForm.find('[data-shout]');
            typeahead = shoutForm.find('.shout-typeahead');

            element.on('keyup', '[data-shout]', function(e) {
                _handleKeyPress($(this), e);
            });

            typeahead.on('click', '[data-typeahead-id]', function(e) {
                _handleTypeaheadClick($(this), e);
            });

            element.on('keydown', '[data-shout]', function(e) {
                if(e.key === 'Enter') {
                    _handleKeyPress($(this), e);
                }
            });

            element.get(0).addEventListener('paste', function(e) {
                // cancel paste
                e.preventDefault();
                // console.log('paste detected!');

                // get text representation of clipboard
                var text = e.clipboardData.getData('text/plain');

                // insert text manually
                document.execCommand('insertHTML', false, text);
            });

            element.on('click', '[data-shout-location]', function() {
                _activateLocation(element);
            });

            if (storage.has('location') && (Date.now() - storage.get('location-timestamp')) < 30*60*1000 ) {
                locationActive = true;
                element.find('[data-shout-location]').addClass('active');        
            }

            _placeholderUpdate();
            _loadTypeaheadData();
        }

        ////////////////////////////////////////////////////////////////////////////////////////////////////
        // private methods /////////////////////////////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////////////////////////////////////////////

        function _activateLocation(element) {
            if (!locationActive) {
                if (navigator.geolocation) {
                    element.find('[data-shout-location]').find('i').addClass('fa-spin');

                    navigator.geolocation.getCurrentPosition(function(pos) {
                        console.log('user pos is', pos, JSON.stringify(pos.coords.latitude));
                        element.find('[data-shout-location]').addClass('active');
                        element.find('[data-shout-location]').find('i').removeClass('fa-spin');
                        locationActive = true;
                        storage.set('session', 'location', pos.coords.longitude + '-' + pos.coords.latitude);
                        storage.set('session', 'location-timestamp', Date.now());
                    });
                } else {
                    message.error('Not supported', 'Geolocation is not supported by your browser :(')
                }
            } else {
                locationActive = false;
                element.find('[data-shout-location].active').removeClass('active');        
            }
        }

        function _loadTypeaheadData() {
            api.call('get', 'typeahead').done(function(data) {
                typeaheadData = data;
            });
        }

        function _handleTypeaheadHandlers(word) {
            var stopped = false;
            var handler;

            for (var i in typeaheadHandlers) {
                handler = typeaheadHandlers[i](word);

                // console.log('_handle', word, handler);

                if (handler !== false) {
                    if (handler.data.length === 0) {
                        _closeTypeahead();
                    } else {
                        _populateTypeahead(handler.data, handler.type);
                        _openTypeahead();
                    }

                    stopped = true;
                    break;
                }
            }

            if (!stopped) {
                _closeTypeahead();
            }
        }

        function _handleKeyPress(element, event) {
            var handler;
            var stopped = false; 

            for (var i in keypressHandlers) {
                handler = keypressHandlers[i](element, event.key, event);
                if (handler) {
                    event.preventDefault();
                    stopped = true;
                    break;
                }
            }

            if (!stopped) {
                shoutCtrl.updateLengthDisplay(element, event);
                _handleTypeahead();
                _placeholderUpdate();
                // console.log('keypress:', event.key);
            }
        }

        function _handleTypeaheadClick(element, event) {
            var typeaheadId = element.attr('data-typeahead-id')*1;

            if (typeaheadOpen) {
                // console.log('click on #', typeaheadId);
                _setCursorToEnd(shoutElement);
                _replaceCurrentWord(
                    _getTypeaheadElement(
                        typeaheadId,
                        _getTypeaheadData()
                    )
                    .text
                    .replace(new RegExp(typeaheadTriggers), '')
                );
                _setCursorToEnd(shoutElement);
                _closeTypeahead();
            }
        }

        function _handleEnterKeypress(elem, key, event) {
            if (key === 'Enter' && event.type === 'keydown') {
                if (typeaheadOpen) {
                    var word = template.escapeHtml(_getCurrentWord());
                    // select typeahead option
                    // console.log('select typeahead option', typeaheadCursor, _getCurrentWord());

                    if (typeaheadCursor !== undefined) {
                        _replaceCurrentWord(
                            _getTypeaheadElement(
                                _getTypeaheadId(typeaheadCursor),
                                _getTypeaheadData()
                            )
                            .text
                            .replace(new RegExp(typeaheadTriggers), '')
                        );
                        _setCursorToEnd(shoutElement);
                        _closeTypeahead();
                    }
                } else {
                    _pasteHtmlAtCaret('<br><br>');
                    _setCursorToEnd(elem);
                }

                return true;
            }

            return false;
        }

        function _getTypeaheadId(cursorPos) {
            return typeahead.find('.dropdown-item:eq(' + cursorPos + ') [data-typeahead-id]').attr('data-typeahead-id')*1;
        }

        function _getTypeaheadElement(typeaheadId, data) {
            return _.find(data, { id: typeaheadId });
        }

        function _getTypeaheadDataType() {
            return typeahead.attr('data-typeahead-type');
        }

        function _getTypeaheadData(type) {
            type = type || _getTypeaheadDataType();
            return typeaheadData[type];
        }

        function _handleArrowKeypress(elem, key) {
            if (typeaheadOpen) {
                if (key === 'ArrowDown' || key === 'ArrowLeft') {
                    _moveTypeaheadCursor(1);

                    return true;
                } else if (key === 'ArrowUp' || key === 'ArrowRight') {
                    _moveTypeaheadCursor(-1);

                    return true;
                }
            }

            return false;
        }

        function _moveTypeaheadCursor(delta) {
            var typeaheadLength = typeahead.find('.dropdown-item').length;

            typeahead.find('.dropdown-item.active').removeClass('active');

            if (typeaheadCursor === undefined) {
                // select first item
                typeaheadCursor = 0;
                typeahead.find('.dropdown-item').first().addClass('active');
            } else {
                // select delta-item
                if (typeaheadCursor === 0 && delta === -1) {
                    typeaheadCursor = typeaheadLength - 1;
                } else if(typeaheadLength - 1 < typeaheadCursor + delta) {
                    typeaheadCursor = 0;
                } else {
                    typeaheadCursor = typeaheadCursor + delta;
                }

                typeahead.find('.dropdown-item:eq(' + typeaheadCursor + ')').addClass('active');
            }

        }
        
        function _placeholderUpdate() {
            var ele = $('[contenteditable][placeholder]');
            var shoutLength = shoutCtrl.getNewShoutText(ele).length;

            if (shoutLength === 0) {
                ele.addClass('placeholder-visible');
            } else {
                ele.removeClass('placeholder-visible'); 
            }
        }
        
        function _handleTypeahead() {
            var word = template.escapeHtml(_getCurrentWord());

            _handleTypeaheadHandlers(word);
        }

        function _handleHashtagTypeahead(word) {
            if (word.substring(0,1) !== '#') { return false; }

            return { type: 'hashtag', data: _filterArray(_getTypeaheadData('hashtag'), word) };
        }

        function _handleMentionTypeahead(word) {
            if (word.substring(0,1) !== '@') { return false; }

            return { type: 'mention', data: _filterArray(_getTypeaheadData('mention'), word) };
        }

        function _handleEmojiTypeahead(word) {
            if (word.substring(0,1) !== ':') { return false; }

            return { type: 'emoji', data: _filterArray(_getTypeaheadData('emoji'), word) };
        }

        function _openTypeahead(type) {
            typeahead.addClass('open');
            typeaheadOpen = true;
        }

        function _closeTypeahead() {
            typeahead.removeClass('open');
            typeahead.removeAttr('data-typeahead-type');
            typeaheadCursor = undefined;
            typeaheadOpen = false;
        }
        
        function _populateTypeahead(dataArray, dataType) {
            var dropdown = typeahead.find('.dropdown-menu');
            var html;
            dropdown.html('');
            typeahead.attr('data-typeahead-type', dataType);
            
            for (var i in dataArray) {
                html = _getTypeaheadTemplate(dataType, dataArray[i]);
                dropdown.append(html);
                if (i >= 10) break;
            }

            emoji.replace(dropdown);
        }
        
        function _getTypeaheadTemplate(type, data) {   
            var tpl = '';
            var html = '';
            switch (type) {
                case 'emoji':
                    tpl = '<a class="dropdown-item">{{{element}}} <span data-typeahead-id="{{id}}"">{{{textParsed}}}</span></a>';
                    break;
                case 'mention':
                    tpl = '<a class="dropdown-item"><img class="gravatar" src="{{gravatar}}"><span data-typeahead-id="{{id}}"">{{{textParsed}}}</span> <span class="text-muted">{{name}}</span></a>';
                    break;
                default:
                    tpl = '<a class="dropdown-item">{{{textParsed}}}<span data-typeahead-id="{{id}}""></span></a>';
                    break;
            }

            html = template.render('shoutboxList'+ type, data, tpl);
            
            return html;
        }

        function _replaceCurrentWord(replacementText) {
            var sel = window.getSelection();

            // if (sel.baseNode.parentNode !== shoutElement.get(0)) {
            //     var range = document.createRange();
            //     range.selectNodeContents(shoutElement.get(0))
            //     sel.removeAllRanges();
            //     sel.addRange(range);
            // }

            var selectedRange = sel.getRangeAt(0);
            sel.collapseToStart();
            sel.modify('move', 'backward', 'word');
            sel.modify('extend', 'forward', 'word');

            sel.deleteFromDocument();
            _pasteTextAtCaret(replacementText);
            shoutElement.get(0).normalize();

            sel.removeAllRanges();
            sel.addRange(selectedRange);
            // if (sel.rangeCount) {
            //     range = sel.getRangeAt(0);
            //     range.deleteContents();
            //     range.insertNode(document.createTextNode(replacementText));
            // }
        }

        function _getCurrentWord() {
            if (!!_getLastChar().match(/\s/)) {
                return ' ';
            } else {
                var sel = window.getSelection();
                var word = '';
                var selectedRange = sel.getRangeAt(0); 
                sel.collapseToStart(); 
                sel.modify('move', 'backward', 'word');
                sel.modify('extend', 'forward', 'word');

                word = sel.toString(); 

                res = sel.focusNode.nodeValue ? sel.focusNode.nodeValue.trim().match(new RegExp(typeaheadTriggers + word + typeaheadTriggers)) : null;
                word = res ? res[0] : word;
                
                // Restore selection
                sel.removeAllRanges();
                sel.addRange(selectedRange);
                return word;
            }
        }
    
        function _getLastChar() {
            var sel = window.getSelection(); 
            var word = '';
            var selectedRange = sel.getRangeAt(0); 
            sel.collapseToStart(); 
            sel.modify('move', 'backward', 'character');
            sel.modify('extend', 'forward', 'character');

            word = sel.toString(); 
            
            // Restore selection
            sel.removeAllRanges();
            sel.addRange(selectedRange);
            return word;
        }
    }
)

function _filterArray(array, search) {
    var returnArray = [];
    var key = 'text';

    for (var i in array) {
        if (array[i][key].indexOf(search) > -1) {
            array[i].textParsed = array[i][key].replace(search, '<strong class="text-primary">' + search + '</strong>');
            returnArray.push(array[i]);
        }
    }
    
    return returnArray;
}

function _setCursorToEnd(element) {
    var range = document.createRange();//Create a range (a range is a like the selection but invisible)
    range.selectNodeContents(element[0]);//Select the entire contents of the element with the range
    range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start

    var selection = window.getSelection();//get the selection object (allows you to change selection)
    selection.removeAllRanges();//remove any selections already made
    selection.addRange(range);//make the range you have just created the visible selection
}

function _pasteHtmlAtCaret(html) {
    var sel, range;
    sel = window.getSelection();
    if (sel.getRangeAt && sel.rangeCount) {
        range = sel.getRangeAt(0);
        range.deleteContents();

        // Range.createContextualFragment() would be useful here but is
        // only relatively recently standardized and is not supported in
        // some browsers (IE9, for one)
        var el = document.createElement("div");
        el.innerHTML = html;
        var frag = document.createDocumentFragment(), node, lastNode;
        while ( (node = el.firstChild) ) {
            lastNode = frag.appendChild(node);
        }
        range.insertNode(frag);

        // Preserve the selection
        if (lastNode) {
            range = range.cloneRange();
            range.setStartAfter(lastNode);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }
}

function _pasteTextAtCaret(text) {
    var sel, range;
    sel = window.getSelection();
    if (sel.getRangeAt && sel.rangeCount) {
        range = sel.getRangeAt(0);
        range.deleteContents();

        var frag = document.createDocumentFragment(), node, lastNode;
        lastNode = frag.appendChild(document.createTextNode(text));

        range.insertNode(frag);

        // Preserve the selection
        if (lastNode) {
            range = range.cloneRange();
            range.setStartAfter(lastNode);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }
}