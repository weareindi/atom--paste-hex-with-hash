'use babel';

import config from './config.json';
import {CompositeDisposable} from 'atom';
import {shell} from 'electron';

export default {

    config: config,
    disposables: new CompositeDisposable(),
    notifications: [],

    /**
     * Activate package
     */
    activate() {
        // Notification
        this.handleNotification();

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

                    // already has a hash (#)?, no need to add another
                    if (this.isPrefixed(textEditor, change.start)) {
                        continue;
                    }

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
     * Check if character before our pasted string is or is not a hash (#)
     * @param  {object}  textEditor      A valid atom text editor
     * @param  {array}   cursorPositions An object contating point values corresponding to the cursor position in the edtior
     * @return {Boolean}
     */
    isPrefixed(textEditor, position) {
        // start of row, no space for a prefix/#
        if (position.column === 0) {
            return false;
        }

        // clone supplied position so our prefix check doesn't interfere with current cursor poisiton
        position = { ...position };

        // get chararcter preceeding our paste/change
        const range = [{
            column: position.column - 1,
            row: position.row
        }, position];

        const character = textEditor.getTextInBufferRange(range);

        // if not a hash (#), return false
        if (character !== '#') {
            return false;
        }

        // if we got here it must be a hash (#), return true
        return true;
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
        this.clearNotifications();

        // remove all binds
        this.disposables.dispose();
    },

    /**
     * Clear notifications
     */
    clearNotifications() {
        Array.from(this.notifications, (notification) => {
            notification.dismiss();
        });
    },

    /**
     * Handle Notification
     */
    handleNotification() {
        // are we happy to show the intro notification?
        const showIntro = atom.config.get('atom--paste-hex-with-hash.intro');
        if (typeof showIntro === 'undefined' || !showIntro) {
            return;
        }

        // notification
        const notification = atom.notifications.addInfo(
        `<p>Excellent! You're using the 'atom--paste-hex-with-hash' package.</p><p><strong>Written for us, shared with you</strong>.</p><hr><p>We welcome any issues or feature requests in the package repository on GitHub.</p><p>If the package is useful to you, please do give it a star on GitHub so we know we've done something good.</p><p><em>Thank you.</em></p>`,
        {
            buttons: [
                {
                    className: 'weareindi-atom-button weareindi-atom-button--github',
                    text: 'Package GitHub',
                    onDidClick: () => {
                        shell.openExternal('https://github.com/weareindi/atom--paste-hex-with-hash');
                    }
                },
                {
                    className: 'weareindi-atom-button weareindi-atom-button--website',
                    text: 'We Are Indi',
                    onDidClick: () => {
                        shell.openExternal('https://weareindi.co.uk');
                    }
                }
            ],
            dismissable: true
        });

        // push into array so we can handle deactivation cleanly
        this.notifications.push(notification);

        // update config so we dont show on next activation
        atom.config.set('atom--paste-hex-with-hash.intro', false);
    }
};
