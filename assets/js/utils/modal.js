define(
    [
        '$', 
        '_',
        'bootstrap'
    ], 
    function(
        $, 
        _,
        bootstrap
    ) {
        var modal = $('#modalContainer');
        var modalHeader = modal.find('.modal-header');
        var modalTitle = modalHeader.find('.modal-title');
        var modalClose = modalHeader.find('.close');
        var modalBody = modal.find('.modal-body');
        var modalBodyContent = modalBody.find('[data-modal-body]');
        var modalFooter = modal.find('.modal-footer');
        var modalDialog = modal.find('.modal-dialog');
        var modalBodyClose = modalBody.find('.close');
        
        var defaults = {
            displayHeader: true,
            displayFooter: false,
            displayClose: true,
            displayBodyClose: false,
            title: 'Modal Titel',
            body: '<p>Hallo Welt!</p>',
            footer: '',
            instant: true,
            size: 'normal',
            buttons: [],
            onHide: false,
            onHidden: false,
            onShow: false,
            onShown: false,
        };
        
        return {
            init: init,
            showModal: showModal,
            hideModal: hideModal
        };

        function init(options) {
            options = _.extend(defaults, options);
            
            _resetModal();
            
            if (!options.displayHeader) { modalHeader.hide(); }
            if (options.displayFooter) { modalFooter.show(); }
            if (options.displayBodyClose) { modalBodyClose.show(); }
            if (!options.displayClose) { modalClose.show(); }
            
            if (options.title.length === 0) { modalTitle.hide(); }
            else {
                modalTitle.html(options.title);
            }
            
            modalBodyContent.html(options.body);
            
            if (options.footer.length === 0) { modalFooter.hide(); }
            else {
                modalFooter.html(options.footer);
            }
            
            if (options.buttons.length > 0) {
                modalFooter.html('').show();
                var button = {};
                var b;
                
                for (var i in options.buttons) {
                    b = options.buttons[i];
                    button = $('<button class="btn"></button');
                    button.text(b.text);
                    button.addClass(b.class ? b.class : 'btn-default');
                    
                    if (b.type === 'close') {
                        button.attr('data-dismiss', 'modal');
                    }
                    
                    if (b.type === 'confirm' && b.cb && typeof b.cb === 'function') {
                        button.on('click', { modal: modal, modalBody: modalBody }, b.cb);
                        button.on('click', hideModal);
                    }
                    
                    modalFooter.append(button);
                }
            }
            
            if (options.size === 'small') { modalDialog.addClass('modal-sm') }
            else if (options.size === 'large') { modalDialog.addClass('modal-lg') }
            
            modal.modal({
                show: options.instant
            });
        
            modal.on('hidden.bs.modal', _resetModal);

            if (typeof options.onHide === 'function') {
                modal.on('hide.bs.modal', function(e) { options.onHide(e, modal); });
            }

            if (typeof options.onHidden === 'function') {
                modal.on('hidden.bs.modal', function(e) { options.onHidden(e, modal); });
            }

            if (typeof options.onShow === 'function') {
                modal.on('show.bs.modal', function(e) { options.onShow(e, modal); });
            }

            if (typeof options.onShown === 'function') {
                modal.on('shown.bs.modal', function(e) { options.onShown(e, modal); });
            }
        
            return modal;
        }
        
        function showModal() {
            modal.modal('show');
        }
        
        function hideModal() {
            modal.modal('hide');
        }

        function _resetModal() {
            modalTitle.html('');
            modalBodyContent.html('');
            modalFooter.html('').hide();
            modalBodyClose.hide();
            modalHeader.show();
            modalClose.show();
            modalDialog.removeClass('modal-lg');
            modalDialog.removeClass('modal-sm');
        }
    }
)