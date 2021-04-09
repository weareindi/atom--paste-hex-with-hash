'use babel';

import {CompositeDisposable} from 'atom';

export default {

    disposables: new CompositeDisposable(),

    /**
     * Activate package
     */
    activate() {
        // observe all editor tabs
        atom.workspace.observeTextEditors(textEditor => {
            // get text buffer
            let textBuffer = textEditor.getBuffer();

            // listen for text insert event
             this.disposables.add(textEditor.onDidInsertText((event) => {
                // bail early if not correct string length
                if (event.text.length !== 3 && event.text.length !== 6) {
                    return;
                }

                // bail if not a hex?
                if (!this.isHex(event.text)) {
                    return;
                }

                // must be a hex, lets prepend with #
                textBuffer.setText(`#${event.text}`);
            }));
        });
    },

    /**
     * Check if string is hex without preceeding #
     * @param  {string}  string
     * @return {Boolean}
     */
    isHex(string) {
        return (new RegExp(/^(?:[0-9a-f]{3}){1,2}$/, 'i')).test(string);
    },

    /**
     * Deactivate the package
     */
    deactivate() {
        // remove all binds
        this.disposables.dispose();
    }
};
