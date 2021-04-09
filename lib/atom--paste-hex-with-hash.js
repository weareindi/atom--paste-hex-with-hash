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

            // listen for changes
            this.disposables.add(textBuffer.onDidChange((event) => {
                // create buffer checkpoint, used for undo
                const undoCheckpoint = textEditor.createCheckpoint();

                let cursorPositions = [];

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

                    // populate cursorPositions array
                    cursorPositions.push(change.newEnd);
                }

                // group all changes since checkpoint so an undo, undoes all cursors in one
                textBuffer.groupChangesSinceCheckpoint(undoCheckpoint);

                // set new cursor positions
                this.resetCursors(textEditor, cursorPositions);
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
     * Reset cursor positions to end of each insert
     * @param {object} textEditor      A valid atom text editor
     * @param {array}  cursorPositions A array of point values corresponding to cursor positions in the document
     */
    resetCursors(textEditor, cursorPositions) {
        // loop through cursors
        for (let i = 0; i < cursorPositions.length; i++) {
            // cursor position
            const cursorPosition = cursorPositions[i];

            // set cursors
            textEditor.addCursorAtBufferPosition(cursorPosition);
        }
    },

    /**
     * Deactivate the package
     */
    deactivate() {
        // remove all binds
        this.disposables.dispose();
    }
};
