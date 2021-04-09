'use babel';

import {Disposable, CompositeDisposable} from 'atom';

export default {

    undoCheckpoint: null,
    disposables: new CompositeDisposable(),

    /**
     * Add custom disposable event listener
     * @param {object}   textEditor A valid atom text editor
     * @param {string}   eventName  A valid event name
     * @param {function} handler    The callback/function we want to occur with the event
     */
    addEventListener(textEditor, eventName, handler) {
        // get editor element
        const textEditorElement = atom.views.getView(textEditor);

        // add event listener
        textEditorElement.addEventListener(eventName, handler);

        // return a disposable for this.disposables (CompositeDisposable)
        return new Disposable(() => {
            // return the remove event listener
            return textEditorElement.removeEventListener(eventName, handler);
        });
    },

    /**
     * Activate package
     */
    activate() {
        // observe all editor tabs
        atom.workspace.observeTextEditors(textEditor => {
            // get text buffer
            let textBuffer = textEditor.getBuffer();

            // listen for keydown. This triggers before the paste, allowing us
            // to start the undo checkpoint in the correct position
            this.disposables.add(this.addEventListener(textEditor, 'keydown', (event) => {
                // create buffer checkpoint, used for undo
                this.undoCheckpoint = textBuffer.createCheckpoint();
            }));

            // listen for changes
            this.disposables.add(textBuffer.onDidChange((event) => {
                // loop through changes
                for (let i = 0; i < event.changes.length; i++) {
                    const change = event.changes[i];

                    // bail early if not correct string length
                    if (change.newText.length !== 3 && change.newText.length !== 6) {
                        continue;
                    }

                    // bail if not a hex?
                    if (!this.isHex(change.newText)) {
                        continue;
                    }

                    // move to start for hex
                    textEditor.setCursorBufferPosition(change.newStart);

                    // add hash
                    textEditor.insertText('#');

                    // increment end column by 1
                    change.newEnd.column++;

                    // move cursor to end
                    textEditor.setCursorBufferPosition(change.newEnd);
                }

                // group all changes since checkpoint so an undo, undoes all cursors in one
                textBuffer.groupChangesSinceCheckpoint(this.undoCheckpoint);
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
