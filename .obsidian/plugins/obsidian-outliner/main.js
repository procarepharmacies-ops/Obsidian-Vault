'use strict';

var obsidian = require('obsidian');
var view = require('@codemirror/view');
var language = require('@codemirror/language');
var state = require('@codemirror/state');

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol, Iterator */


function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

class MoveCursorToPreviousUnfoldedLine {
    constructor(root) {
        this.root = root;
        this.stopPropagation = false;
        this.updated = false;
    }
    shouldStopPropagation() {
        return this.stopPropagation;
    }
    shouldUpdate() {
        return this.updated;
    }
    perform() {
        const { root } = this;
        if (!root.hasSingleCursor()) {
            return;
        }
        const list = this.root.getListUnderCursor();
        const cursor = this.root.getCursor();
        const lines = list.getLinesInfo();
        const lineNo = lines.findIndex((l) => {
            return (cursor.ch === l.from.ch + list.getCheckboxLength() &&
                cursor.line === l.from.line);
        });
        if (lineNo === 0) {
            this.moveCursorToPreviousUnfoldedItem(root, cursor);
        }
        else if (lineNo > 0) {
            this.moveCursorToPreviousNoteLine(root, lines, lineNo);
        }
    }
    moveCursorToPreviousNoteLine(root, lines, lineNo) {
        this.stopPropagation = true;
        this.updated = true;
        root.replaceCursor(lines[lineNo - 1].to);
    }
    moveCursorToPreviousUnfoldedItem(root, cursor) {
        const prev = root.getListUnderLine(cursor.line - 1);
        if (!prev) {
            return;
        }
        this.stopPropagation = true;
        this.updated = true;
        if (prev.isFolded()) {
            const foldRoot = prev.getTopFoldRoot();
            const firstLineEnd = foldRoot.getLinesInfo()[0].to;
            root.replaceCursor(firstLineEnd);
        }
        else {
            root.replaceCursor(prev.getLastLineContentEnd());
        }
    }
}

function getEditorFromState(state) {
    const { editor } = state.field(obsidian.editorInfoField);
    if (!editor) {
        return null;
    }
    return new MyEditor(editor);
}
function foldInside(view, from, to) {
    let found = null;
    language.foldedRanges(view.state).between(from, to, (from, to) => {
        if (!found || found.from > from)
            found = { from, to };
    });
    return found;
}
class MyEditor {
    constructor(e) {
        this.e = e;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.view = this.e.cm;
    }
    getCursor() {
        return this.e.getCursor();
    }
    getLine(n) {
        return this.e.getLine(n);
    }
    lastLine() {
        return this.e.lastLine();
    }
    listSelections() {
        return this.e.listSelections();
    }
    getRange(from, to) {
        return this.e.getRange(from, to);
    }
    replaceRange(replacement, from, to) {
        return this.e.replaceRange(replacement, from, to);
    }
    setSelections(selections) {
        this.e.setSelections(selections);
    }
    setValue(text) {
        this.e.setValue(text);
    }
    getValue() {
        return this.e.getValue();
    }
    offsetToPos(offset) {
        return this.e.offsetToPos(offset);
    }
    posToOffset(pos) {
        return this.e.posToOffset(pos);
    }
    fold(n) {
        const { view } = this;
        const l = view.lineBlockAt(view.state.doc.line(n + 1).from);
        const range = language.foldable(view.state, l.from, l.to);
        if (!range || range.from === range.to) {
            return;
        }
        view.dispatch({ effects: [language.foldEffect.of(range)] });
    }
    unfold(n) {
        const { view } = this;
        const l = view.lineBlockAt(view.state.doc.line(n + 1).from);
        const range = foldInside(view, l.from, l.to);
        if (!range) {
            return;
        }
        view.dispatch({ effects: [language.unfoldEffect.of(range)] });
    }
    getAllFoldedLines() {
        const c = language.foldedRanges(this.view.state).iter();
        const res = [];
        while (c.value) {
            res.push(this.offsetToPos(c.from).line);
            c.next();
        }
        return res;
    }
    triggerOnKeyDown(e) {
        view.runScopeHandlers(this.view, e, "editor");
    }
    getZoomRange() {
        if (!window.ObsidianZoomPlugin) {
            return null;
        }
        return window.ObsidianZoomPlugin.getZoomRange(this.e);
    }
    zoomOut() {
        if (!window.ObsidianZoomPlugin) {
            return;
        }
        window.ObsidianZoomPlugin.zoomOut(this.e);
    }
    zoomIn(line) {
        if (!window.ObsidianZoomPlugin) {
            return;
        }
        window.ObsidianZoomPlugin.zoomIn(this.e, line);
    }
    tryRefreshZoom(line) {
        if (!window.ObsidianZoomPlugin) {
            return;
        }
        if (window.ObsidianZoomPlugin.refreshZoom) {
            window.ObsidianZoomPlugin.refreshZoom(this.e);
        }
        else {
            window.ObsidianZoomPlugin.zoomIn(this.e, line);
        }
    }
}

function createKeymapRunCallback(config) {
    const check = config.check || (() => true);
    const { run } = config;
    return (view) => {
        const editor = getEditorFromState(view.state);
        if (!check(editor)) {
            return false;
        }
        const { shouldUpdate, shouldStopPropagation } = run(editor);
        return shouldUpdate || shouldStopPropagation;
    };
}

class ArrowLeftAndCtrlArrowLeftBehaviourOverride {
    constructor(plugin, settings, imeDetector, operationPerformer) {
        this.plugin = plugin;
        this.settings = settings;
        this.imeDetector = imeDetector;
        this.operationPerformer = operationPerformer;
        this.check = () => {
            return (this.settings.keepCursorWithinContent !== "never" &&
                !this.imeDetector.isOpened());
        };
        this.run = (editor) => {
            return this.operationPerformer.perform((root) => new MoveCursorToPreviousUnfoldedLine(root), editor);
        };
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            this.plugin.registerEditorExtension(view.keymap.of([
                {
                    key: "ArrowLeft",
                    run: createKeymapRunCallback({
                        check: this.check,
                        run: this.run,
                    }),
                },
                {
                    win: "c-ArrowLeft",
                    linux: "c-ArrowLeft",
                    run: createKeymapRunCallback({
                        check: this.check,
                        run: this.run,
                    }),
                },
            ]));
        });
    }
    unload() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
}

function cmpPos(a, b) {
    return a.line - b.line || a.ch - b.ch;
}
function maxPos(a, b) {
    return cmpPos(a, b) < 0 ? b : a;
}
function minPos(a, b) {
    return cmpPos(a, b) < 0 ? a : b;
}
function isRangesIntersects(a, b) {
    return cmpPos(a[1], b[0]) >= 0 && cmpPos(a[0], b[1]) <= 0;
}
function recalculateNumericBullets(root) {
    function visit(parent) {
        let index = 1;
        for (const child of parent.getChildren()) {
            if (/\d+\./.test(child.getBullet())) {
                child.replateBullet(`${index++}.`);
            }
            visit(child);
        }
    }
    visit(root);
}
let idSeq = 0;
class List {
    constructor(root, indent, bullet, optionalCheckbox, spaceAfterBullet, firstLine, foldRoot) {
        this.root = root;
        this.indent = indent;
        this.bullet = bullet;
        this.optionalCheckbox = optionalCheckbox;
        this.spaceAfterBullet = spaceAfterBullet;
        this.foldRoot = foldRoot;
        this.parent = null;
        this.children = [];
        this.notesIndent = null;
        this.lines = [];
        this.id = idSeq++;
        this.lines.push(firstLine);
    }
    getID() {
        return this.id;
    }
    getNotesIndent() {
        return this.notesIndent;
    }
    setNotesIndent(notesIndent) {
        if (this.notesIndent !== null) {
            throw new Error(`Notes indent already provided`);
        }
        this.notesIndent = notesIndent;
    }
    addLine(text) {
        if (this.notesIndent === null) {
            throw new Error(`Unable to add line, notes indent should be provided first`);
        }
        this.lines.push(text);
    }
    replaceLines(lines) {
        if (lines.length > 1 && this.notesIndent === null) {
            throw new Error(`Unable to add line, notes indent should be provided first`);
        }
        this.lines = lines;
    }
    getLineCount() {
        return this.lines.length;
    }
    getRoot() {
        return this.root;
    }
    getChildren() {
        return this.children.concat();
    }
    getLinesInfo() {
        const startLine = this.root.getContentLinesRangeOf(this)[0];
        return this.lines.map((row, i) => {
            const line = startLine + i;
            const startCh = i === 0 ? this.getContentStartCh() : this.notesIndent.length;
            const endCh = startCh + row.length;
            return {
                text: row,
                from: { line, ch: startCh },
                to: { line, ch: endCh },
            };
        });
    }
    getLines() {
        return this.lines.concat();
    }
    getFirstLineContentStart() {
        const startLine = this.root.getContentLinesRangeOf(this)[0];
        return {
            line: startLine,
            ch: this.getContentStartCh(),
        };
    }
    getFirstLineContentStartAfterCheckbox() {
        const startLine = this.root.getContentLinesRangeOf(this)[0];
        return {
            line: startLine,
            ch: this.getContentStartCh() + this.getCheckboxLength(),
        };
    }
    getLastLineContentEnd() {
        const endLine = this.root.getContentLinesRangeOf(this)[1];
        const endCh = this.lines.length === 1
            ? this.getContentStartCh() + this.lines[0].length
            : this.notesIndent.length + this.lines[this.lines.length - 1].length;
        return {
            line: endLine,
            ch: endCh,
        };
    }
    getContentEndIncludingChildren() {
        return this.getLastChild().getLastLineContentEnd();
    }
    getLastChild() {
        let lastChild = this;
        while (!lastChild.isEmpty()) {
            lastChild = lastChild.getChildren().last();
        }
        return lastChild;
    }
    getContentStartCh() {
        return this.indent.length + this.bullet.length + 1;
    }
    isFolded() {
        if (this.foldRoot) {
            return true;
        }
        if (this.parent) {
            return this.parent.isFolded();
        }
        return false;
    }
    isFoldRoot() {
        return this.foldRoot;
    }
    getTopFoldRoot() {
        let tmp = this;
        let foldRoot = null;
        while (tmp) {
            if (tmp.isFoldRoot()) {
                foldRoot = tmp;
            }
            tmp = tmp.parent;
        }
        return foldRoot;
    }
    getLevel() {
        if (!this.parent) {
            return 0;
        }
        return this.parent.getLevel() + 1;
    }
    unindentContent(from, till) {
        this.indent = this.indent.slice(0, from) + this.indent.slice(till);
        if (this.notesIndent !== null) {
            this.notesIndent =
                this.notesIndent.slice(0, from) + this.notesIndent.slice(till);
        }
        for (const child of this.children) {
            child.unindentContent(from, till);
        }
    }
    indentContent(indentPos, indentChars) {
        this.indent =
            this.indent.slice(0, indentPos) +
                indentChars +
                this.indent.slice(indentPos);
        if (this.notesIndent !== null) {
            this.notesIndent =
                this.notesIndent.slice(0, indentPos) +
                    indentChars +
                    this.notesIndent.slice(indentPos);
        }
        for (const child of this.children) {
            child.indentContent(indentPos, indentChars);
        }
    }
    getFirstLineIndent() {
        return this.indent;
    }
    getBullet() {
        return this.bullet;
    }
    getSpaceAfterBullet() {
        return this.spaceAfterBullet;
    }
    getCheckboxLength() {
        return this.optionalCheckbox.length;
    }
    replateBullet(bullet) {
        this.bullet = bullet;
    }
    getParent() {
        return this.parent;
    }
    addBeforeAll(list) {
        this.children.unshift(list);
        list.parent = this;
    }
    addAfterAll(list) {
        this.children.push(list);
        list.parent = this;
    }
    removeChild(list) {
        const i = this.children.indexOf(list);
        this.children.splice(i, 1);
        list.parent = null;
    }
    addBefore(before, list) {
        const i = this.children.indexOf(before);
        this.children.splice(i, 0, list);
        list.parent = this;
    }
    addAfter(before, list) {
        const i = this.children.indexOf(before);
        this.children.splice(i + 1, 0, list);
        list.parent = this;
    }
    getPrevSiblingOf(list) {
        const i = this.children.indexOf(list);
        return i > 0 ? this.children[i - 1] : null;
    }
    getNextSiblingOf(list) {
        const i = this.children.indexOf(list);
        return i >= 0 && i < this.children.length ? this.children[i + 1] : null;
    }
    isEmpty() {
        return this.children.length === 0;
    }
    print() {
        let res = "";
        for (let i = 0; i < this.lines.length; i++) {
            res +=
                i === 0
                    ? this.indent + this.bullet + this.spaceAfterBullet
                    : this.notesIndent;
            res += this.lines[i];
            res += "\n";
        }
        for (const child of this.children) {
            res += child.print();
        }
        return res;
    }
    clone(newRoot) {
        const clone = new List(newRoot, this.indent, this.bullet, this.optionalCheckbox, this.spaceAfterBullet, "", this.foldRoot);
        clone.id = this.id;
        clone.lines = this.lines.concat();
        clone.notesIndent = this.notesIndent;
        for (const child of this.children) {
            clone.addAfterAll(child.clone(newRoot));
        }
        return clone;
    }
}
class Root {
    constructor(start, end, selections) {
        this.start = start;
        this.end = end;
        this.rootList = new List(this, "", "", "", "", "", false);
        this.selections = [];
        this.replaceSelections(selections);
    }
    getRootList() {
        return this.rootList;
    }
    getContentRange() {
        return [this.getContentStart(), this.getContentEnd()];
    }
    getContentStart() {
        return Object.assign({}, this.start);
    }
    getContentEnd() {
        return Object.assign({}, this.end);
    }
    getSelections() {
        return this.selections.map((s) => ({
            anchor: Object.assign({}, s.anchor),
            head: Object.assign({}, s.head),
        }));
    }
    hasSingleCursor() {
        if (!this.hasSingleSelection()) {
            return false;
        }
        const selection = this.selections[0];
        return (selection.anchor.line === selection.head.line &&
            selection.anchor.ch === selection.head.ch);
    }
    hasSingleSelection() {
        return this.selections.length === 1;
    }
    getSelection() {
        const selection = this.selections[this.selections.length - 1];
        const from = selection.anchor.ch > selection.head.ch
            ? selection.head.ch
            : selection.anchor.ch;
        const to = selection.anchor.ch > selection.head.ch
            ? selection.anchor.ch
            : selection.head.ch;
        return Object.assign(Object.assign({}, selection), { from,
            to });
    }
    getCursor() {
        return Object.assign({}, this.selections[this.selections.length - 1].head);
    }
    replaceCursor(cursor) {
        this.selections = [{ anchor: cursor, head: cursor }];
    }
    replaceSelections(selections) {
        if (selections.length < 1) {
            throw new Error(`Unable to create Root without selections`);
        }
        this.selections = selections;
    }
    getListUnderCursor() {
        return this.getListUnderLine(this.getCursor().line);
    }
    getListUnderLine(line) {
        if (line < this.start.line || line > this.end.line) {
            return;
        }
        let result = null;
        let index = this.start.line;
        const visitArr = (ll) => {
            for (const l of ll) {
                const listFromLine = index;
                const listTillLine = listFromLine + l.getLineCount() - 1;
                if (line >= listFromLine && line <= listTillLine) {
                    result = l;
                }
                else {
                    index = listTillLine + 1;
                    visitArr(l.getChildren());
                }
                if (result !== null) {
                    return;
                }
            }
        };
        visitArr(this.rootList.getChildren());
        return result;
    }
    getContentLinesRangeOf(list) {
        let result = null;
        let line = this.start.line;
        const visitArr = (ll) => {
            for (const l of ll) {
                const listFromLine = line;
                const listTillLine = listFromLine + l.getLineCount() - 1;
                if (l === list) {
                    result = [listFromLine, listTillLine];
                }
                else {
                    line = listTillLine + 1;
                    visitArr(l.getChildren());
                }
                if (result !== null) {
                    return;
                }
            }
        };
        visitArr(this.rootList.getChildren());
        return result;
    }
    getChildren() {
        return this.rootList.getChildren();
    }
    print() {
        let res = "";
        for (const child of this.rootList.getChildren()) {
            res += child.print();
        }
        return res.replace(/\n$/, "");
    }
    clone() {
        const clone = new Root(Object.assign({}, this.start), Object.assign({}, this.end), this.getSelections());
        clone.rootList = this.rootList.clone(clone);
        return clone;
    }
}

class DeleteTillPreviousLineContentEnd {
    constructor(root) {
        this.root = root;
        this.stopPropagation = false;
        this.updated = false;
    }
    shouldStopPropagation() {
        return this.stopPropagation;
    }
    shouldUpdate() {
        return this.updated;
    }
    perform() {
        const { root } = this;
        if (!root.hasSingleCursor()) {
            return;
        }
        const list = root.getListUnderCursor();
        const cursor = root.getCursor();
        const lines = list.getLinesInfo();
        const lineNo = lines.findIndex((l) => cursor.ch === l.from.ch && cursor.line === l.from.line);
        if (lineNo === 0) {
            this.mergeWithPreviousItem(root, cursor, list);
        }
        else if (lineNo > 0) {
            this.mergeNotes(root, cursor, list, lines, lineNo);
        }
    }
    mergeNotes(root, cursor, list, lines, lineNo) {
        this.stopPropagation = true;
        this.updated = true;
        const prevLineNo = lineNo - 1;
        root.replaceCursor({
            line: cursor.line - 1,
            ch: lines[prevLineNo].text.length + lines[prevLineNo].from.ch,
        });
        lines[prevLineNo].text += lines[lineNo].text;
        lines.splice(lineNo, 1);
        list.replaceLines(lines.map((l) => l.text));
    }
    mergeWithPreviousItem(root, cursor, list) {
        if (root.getChildren()[0] === list && list.isEmpty()) {
            return;
        }
        this.stopPropagation = true;
        const prev = root.getListUnderLine(cursor.line - 1);
        if (!prev) {
            return;
        }
        const bothAreEmpty = prev.isEmpty() && list.isEmpty();
        const prevIsEmptyAndSameLevel = prev.isEmpty() && !list.isEmpty() && prev.getLevel() === list.getLevel();
        const listIsEmptyAndPrevIsParent = list.isEmpty() && prev.getLevel() === list.getLevel() - 1;
        if (bothAreEmpty || prevIsEmptyAndSameLevel || listIsEmptyAndPrevIsParent) {
            this.updated = true;
            const parent = list.getParent();
            const prevEnd = prev.getLastLineContentEnd();
            if (!prev.getNotesIndent() && list.getNotesIndent()) {
                prev.setNotesIndent(prev.getFirstLineIndent() +
                    list.getNotesIndent().slice(list.getFirstLineIndent().length));
            }
            const oldLines = prev.getLines();
            const newLines = list.getLines();
            oldLines[oldLines.length - 1] += newLines[0];
            const resultLines = oldLines.concat(newLines.slice(1));
            prev.replaceLines(resultLines);
            parent.removeChild(list);
            for (const c of list.getChildren()) {
                list.removeChild(c);
                prev.addAfterAll(c);
            }
            root.replaceCursor(prevEnd);
            recalculateNumericBullets(root);
        }
    }
}

class BackspaceBehaviourOverride {
    constructor(plugin, settings, imeDetector, operationPerformer) {
        this.plugin = plugin;
        this.settings = settings;
        this.imeDetector = imeDetector;
        this.operationPerformer = operationPerformer;
        this.check = () => {
            return (this.settings.keepCursorWithinContent !== "never" &&
                !this.imeDetector.isOpened());
        };
        this.run = (editor) => {
            return this.operationPerformer.perform((root) => new DeleteTillPreviousLineContentEnd(root), editor);
        };
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            this.plugin.registerEditorExtension(view.keymap.of([
                {
                    key: "Backspace",
                    run: createKeymapRunCallback({
                        check: this.check,
                        run: this.run,
                    }),
                },
            ]));
        });
    }
    unload() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
}

const BETTER_LISTS_BODY_CLASS = "outliner-plugin-better-lists";
class BetterListsStyles {
    constructor(settings, obsidianSettings) {
        this.settings = settings;
        this.obsidianSettings = obsidianSettings;
        this.updateBodyClass = () => {
            const shouldExists = this.obsidianSettings.isDefaultThemeEnabled() &&
                this.settings.betterListsStyles;
            const exists = document.body.classList.contains(BETTER_LISTS_BODY_CLASS);
            if (shouldExists && !exists) {
                document.body.classList.add(BETTER_LISTS_BODY_CLASS);
            }
            if (!shouldExists && exists) {
                document.body.classList.remove(BETTER_LISTS_BODY_CLASS);
            }
        };
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            this.updateBodyClass();
            this.updateBodyClassInterval = window.setInterval(() => {
                this.updateBodyClass();
            }, 1000);
        });
    }
    unload() {
        return __awaiter(this, void 0, void 0, function* () {
            clearInterval(this.updateBodyClassInterval);
            document.body.classList.remove(BETTER_LISTS_BODY_CLASS);
        });
    }
}

class SelectAllContent {
    constructor(root) {
        this.root = root;
        this.stopPropagation = false;
        this.updated = false;
    }
    shouldStopPropagation() {
        return this.stopPropagation;
    }
    shouldUpdate() {
        return this.updated;
    }
    perform() {
        const { root } = this;
        if (!root.hasSingleSelection()) {
            return;
        }
        const selection = root.getSelections()[0];
        const [rootStart, rootEnd] = root.getContentRange();
        const selectionFrom = minPos(selection.anchor, selection.head);
        const selectionTo = maxPos(selection.anchor, selection.head);
        if (selectionFrom.line < rootStart.line ||
            selectionTo.line > rootEnd.line) {
            return false;
        }
        if (selectionFrom.line === rootStart.line &&
            selectionFrom.ch === rootStart.ch &&
            selectionTo.line === rootEnd.line &&
            selectionTo.ch === rootEnd.ch) {
            return false;
        }
        const list = root.getListUnderCursor();
        const contentStart = list.getFirstLineContentStartAfterCheckbox();
        const contentEnd = list.getLastLineContentEnd();
        const listUnderSelectionFrom = root.getListUnderLine(selectionFrom.line);
        const listStart = listUnderSelectionFrom.getFirstLineContentStartAfterCheckbox();
        const listEnd = listUnderSelectionFrom.getContentEndIncludingChildren();
        this.stopPropagation = true;
        this.updated = true;
        if (selectionFrom.line === contentStart.line &&
            selectionFrom.ch === contentStart.ch &&
            selectionTo.line === contentEnd.line &&
            selectionTo.ch === contentEnd.ch) {
            if (list.getChildren().length) {
                // select sub lists
                root.replaceSelections([
                    { anchor: contentStart, head: list.getContentEndIncludingChildren() },
                ]);
            }
            else {
                // select whole list
                root.replaceSelections([{ anchor: rootStart, head: rootEnd }]);
            }
        }
        else if (listStart.ch == selectionFrom.ch &&
            listEnd.line == selectionTo.line &&
            listEnd.ch == selectionTo.ch) {
            // select whole list
            root.replaceSelections([{ anchor: rootStart, head: rootEnd }]);
        }
        else if ((selectionFrom.line > contentStart.line ||
            (selectionFrom.line == contentStart.line &&
                selectionFrom.ch >= contentStart.ch)) &&
            (selectionTo.line < contentEnd.line ||
                (selectionTo.line == contentEnd.line &&
                    selectionTo.ch <= contentEnd.ch))) {
            // select whole line
            root.replaceSelections([{ anchor: contentStart, head: contentEnd }]);
        }
        else {
            this.stopPropagation = false;
            this.updated = false;
            return false;
        }
        return true;
    }
}

class CtrlAAndCmdABehaviourOverride {
    constructor(plugin, settings, imeDetector, operationPerformer) {
        this.plugin = plugin;
        this.settings = settings;
        this.imeDetector = imeDetector;
        this.operationPerformer = operationPerformer;
        this.check = () => {
            return (this.settings.overrideSelectAllBehaviour && !this.imeDetector.isOpened());
        };
        this.run = (editor) => {
            return this.operationPerformer.perform((root) => new SelectAllContent(root), editor);
        };
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            this.plugin.registerEditorExtension(view.keymap.of([
                {
                    key: "c-a",
                    mac: "m-a",
                    run: createKeymapRunCallback({
                        check: this.check,
                        run: this.run,
                    }),
                },
            ]));
        });
    }
    unload() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
}

class DeleteTillNextLineContentStart {
    constructor(root) {
        this.root = root;
        this.deleteTillPreviousLineContentEnd =
            new DeleteTillPreviousLineContentEnd(root);
    }
    shouldStopPropagation() {
        return this.deleteTillPreviousLineContentEnd.shouldStopPropagation();
    }
    shouldUpdate() {
        return this.deleteTillPreviousLineContentEnd.shouldUpdate();
    }
    perform() {
        const { root } = this;
        if (!root.hasSingleCursor()) {
            return;
        }
        const list = root.getListUnderCursor();
        const cursor = root.getCursor();
        const lines = list.getLinesInfo();
        const lineNo = lines.findIndex((l) => cursor.ch === l.to.ch && cursor.line === l.to.line);
        if (lineNo === lines.length - 1) {
            const nextLine = lines[lineNo].to.line + 1;
            const nextList = root.getListUnderLine(nextLine);
            if (!nextList) {
                return;
            }
            root.replaceCursor(nextList.getFirstLineContentStart());
            this.deleteTillPreviousLineContentEnd.perform();
        }
        else if (lineNo >= 0) {
            root.replaceCursor(lines[lineNo + 1].from);
            this.deleteTillPreviousLineContentEnd.perform();
        }
    }
}

class DeleteBehaviourOverride {
    constructor(plugin, settings, imeDetector, operationPerformer) {
        this.plugin = plugin;
        this.settings = settings;
        this.imeDetector = imeDetector;
        this.operationPerformer = operationPerformer;
        this.check = () => {
            return (this.settings.keepCursorWithinContent !== "never" &&
                !this.imeDetector.isOpened());
        };
        this.run = (editor) => {
            return this.operationPerformer.perform((root) => new DeleteTillNextLineContentStart(root), editor);
        };
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            this.plugin.registerEditorExtension(view.keymap.of([
                {
                    key: "Delete",
                    run: createKeymapRunCallback({
                        check: this.check,
                        run: this.run,
                    }),
                },
            ]));
        });
    }
    unload() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
}

class MoveListToDifferentPosition {
    constructor(root, listToMove, placeToMove, whereToMove, defaultIndentChars) {
        this.root = root;
        this.listToMove = listToMove;
        this.placeToMove = placeToMove;
        this.whereToMove = whereToMove;
        this.defaultIndentChars = defaultIndentChars;
        this.stopPropagation = false;
        this.updated = false;
    }
    shouldStopPropagation() {
        return this.stopPropagation;
    }
    shouldUpdate() {
        return this.updated;
    }
    perform() {
        if (this.listToMove === this.placeToMove) {
            return;
        }
        this.stopPropagation = true;
        this.updated = true;
        const cursorAnchor = this.calculateCursorAnchor();
        this.moveList();
        this.changeIndent();
        this.restoreCursor(cursorAnchor);
        recalculateNumericBullets(this.root);
    }
    calculateCursorAnchor() {
        const cursorLine = this.root.getCursor().line;
        const lines = [
            this.listToMove.getFirstLineContentStart().line,
            this.listToMove.getLastLineContentEnd().line,
            this.placeToMove.getFirstLineContentStart().line,
            this.placeToMove.getLastLineContentEnd().line,
        ];
        const listStartLine = Math.min(...lines);
        const listEndLine = Math.max(...lines);
        if (cursorLine < listStartLine || cursorLine > listEndLine) {
            return null;
        }
        const cursor = this.root.getCursor();
        const cursorList = this.root.getListUnderLine(cursor.line);
        const cursorListStart = cursorList.getFirstLineContentStart();
        const lineDiff = cursor.line - cursorListStart.line;
        const chDiff = cursor.ch - cursorListStart.ch;
        return { cursorList, lineDiff, chDiff };
    }
    moveList() {
        this.listToMove.getParent().removeChild(this.listToMove);
        switch (this.whereToMove) {
            case "before":
                this.placeToMove
                    .getParent()
                    .addBefore(this.placeToMove, this.listToMove);
                break;
            case "after":
                this.placeToMove
                    .getParent()
                    .addAfter(this.placeToMove, this.listToMove);
                break;
            case "inside":
                this.placeToMove.addBeforeAll(this.listToMove);
                break;
        }
    }
    changeIndent() {
        const oldIndent = this.listToMove.getFirstLineIndent();
        const newIndent = this.whereToMove === "inside"
            ? this.placeToMove.getFirstLineIndent() + this.defaultIndentChars
            : this.placeToMove.getFirstLineIndent();
        this.listToMove.unindentContent(0, oldIndent.length);
        this.listToMove.indentContent(0, newIndent);
    }
    restoreCursor(cursorAnchor) {
        if (cursorAnchor) {
            const cursorListStart = cursorAnchor.cursorList.getFirstLineContentStart();
            this.root.replaceCursor({
                line: cursorListStart.line + cursorAnchor.lineDiff,
                ch: cursorListStart.ch + cursorAnchor.chDiff,
            });
        }
        else {
            // When you move a list, the screen scrolls to the cursor.
            // It is better to move the cursor into the viewport than let the screen scroll.
            this.root.replaceCursor(this.listToMove.getLastLineContentEnd());
        }
    }
}

const BODY_CLASS = "outliner-plugin-dnd";
class DragAndDrop {
    constructor(plugin, settings, obisidian, parser, operationPerformer) {
        this.plugin = plugin;
        this.settings = settings;
        this.obisidian = obisidian;
        this.parser = parser;
        this.operationPerformer = operationPerformer;
        this.preStart = null;
        this.state = null;
        this.handleSettingsChange = () => {
            if (!isFeatureSupported()) {
                return;
            }
            if (this.settings.dragAndDrop) {
                document.body.classList.add(BODY_CLASS);
            }
            else {
                document.body.classList.remove(BODY_CLASS);
            }
        };
        this.handleMouseDown = (e) => {
            if (!isFeatureSupported() ||
                !this.settings.dragAndDrop ||
                !isClickOnBullet(e)) {
                return;
            }
            const view = getEditorViewFromHTMLElement(e.target);
            if (!view) {
                return;
            }
            e.preventDefault();
            e.stopPropagation();
            this.preStart = {
                x: e.x,
                y: e.y,
                view,
            };
        };
        this.handleMouseMove = (e) => {
            if (this.preStart) {
                this.startDragging();
            }
            if (this.state) {
                this.detectAndDrawDropZone(e.x, e.y);
            }
        };
        this.handleMouseUp = () => {
            if (this.preStart) {
                this.preStart = null;
            }
            if (this.state) {
                this.stopDragging();
            }
        };
        this.handleKeyDown = (e) => {
            if (this.state && e.code === "Escape") {
                this.cancelDragging();
            }
        };
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            this.plugin.registerEditorExtension([
                draggingLinesStateField,
                droppingLinesStateField,
            ]);
            this.enableFeatureToggle();
            this.createDropZone();
            this.addEventListeners();
        });
    }
    unload() {
        return __awaiter(this, void 0, void 0, function* () {
            this.removeEventListeners();
            this.removeDropZone();
            this.disableFeatureToggle();
        });
    }
    enableFeatureToggle() {
        this.settings.onChange(this.handleSettingsChange);
        this.handleSettingsChange();
    }
    disableFeatureToggle() {
        this.settings.removeCallback(this.handleSettingsChange);
        document.body.classList.remove(BODY_CLASS);
    }
    createDropZone() {
        this.dropZonePadding = document.createElement("div");
        this.dropZonePadding.classList.add("outliner-plugin-drop-zone-padding");
        this.dropZone = document.createElement("div");
        this.dropZone.classList.add("outliner-plugin-drop-zone");
        this.dropZone.style.display = "none";
        this.dropZone.appendChild(this.dropZonePadding);
        document.body.appendChild(this.dropZone);
    }
    removeDropZone() {
        document.body.removeChild(this.dropZone);
        this.dropZonePadding = null;
        this.dropZone = null;
    }
    addEventListeners() {
        document.addEventListener("mousedown", this.handleMouseDown, {
            capture: true,
        });
        document.addEventListener("mousemove", this.handleMouseMove);
        document.addEventListener("mouseup", this.handleMouseUp);
        document.addEventListener("keydown", this.handleKeyDown);
    }
    removeEventListeners() {
        document.removeEventListener("mousedown", this.handleMouseDown, {
            capture: true,
        });
        document.removeEventListener("mousemove", this.handleMouseMove);
        document.removeEventListener("mouseup", this.handleMouseUp);
        document.removeEventListener("keydown", this.handleKeyDown);
    }
    startDragging() {
        const { x, y, view } = this.preStart;
        this.preStart = null;
        const editor = getEditorFromState(view.state);
        const pos = editor.offsetToPos(view.posAtCoords({ x, y }));
        const root = this.parser.parse(editor, pos);
        const list = root.getListUnderLine(pos.line);
        const state = new DragAndDropState(view, editor, root, list);
        if (!state.hasDropVariants()) {
            return;
        }
        this.state = state;
        this.highlightDraggingLines();
    }
    detectAndDrawDropZone(x, y) {
        this.state.calculateNearestDropVariant(x, y);
        this.drawDropZone();
    }
    cancelDragging() {
        this.state.dropVariant = null;
        this.stopDragging();
    }
    stopDragging() {
        this.unhightlightDraggingLines();
        this.hideDropZone();
        this.applyChanges();
        this.state = null;
    }
    applyChanges() {
        if (!this.state.dropVariant) {
            return;
        }
        const { state } = this;
        const { dropVariant, editor, root, list } = state;
        const newRoot = this.parser.parse(editor, root.getContentStart());
        if (!isSameRoots(root, newRoot)) {
            new obsidian.Notice(`The item cannot be moved. The page content changed during the move.`, 5000);
            return;
        }
        this.operationPerformer.eval(root, new MoveListToDifferentPosition(root, list, dropVariant.placeToMove, dropVariant.whereToMove, this.obisidian.getDefaultIndentChars()), editor);
    }
    highlightDraggingLines() {
        const { state } = this;
        const { list, editor, view } = state;
        const lines = [];
        const fromLine = list.getFirstLineContentStart().line;
        const tillLine = list.getContentEndIncludingChildren().line;
        for (let i = fromLine; i <= tillLine; i++) {
            lines.push(editor.posToOffset({ line: i, ch: 0 }));
        }
        view.dispatch({
            effects: [dndStarted.of(lines)],
        });
        document.body.classList.add("outliner-plugin-dragging");
    }
    unhightlightDraggingLines() {
        document.body.classList.remove("outliner-plugin-dragging");
        this.state.view.dispatch({
            effects: [dndEnded.of()],
        });
    }
    drawDropZone() {
        const { state } = this;
        const { view, editor, dropVariant } = state;
        const newParent = dropVariant.whereToMove === "inside"
            ? dropVariant.placeToMove
            : dropVariant.placeToMove.getParent();
        const newParentIsRootList = !newParent.getParent();
        {
            const width = Math.round(view.contentDOM.offsetWidth -
                (dropVariant.left - this.state.leftPadding));
            this.dropZone.style.display = "block";
            this.dropZone.style.top = dropVariant.top + "px";
            this.dropZone.style.left = dropVariant.left + "px";
            this.dropZone.style.width = width + "px";
        }
        {
            const level = newParent.getLevel();
            const indentWidth = this.state.tabWidth;
            const width = indentWidth * level;
            const dashPadding = 3;
            const dashWidth = indentWidth - dashPadding;
            const color = getComputedStyle(document.body).getPropertyValue("--color-accent");
            this.dropZonePadding.style.width = `${width}px`;
            this.dropZonePadding.style.marginLeft = `-${width}px`;
            this.dropZonePadding.style.backgroundImage = `url('data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%20${width}%204%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cline%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%22${width}%22%20y2%3D%220%22%20stroke%3D%22${color}%22%20stroke-width%3D%228%22%20stroke-dasharray%3D%22${dashWidth}%20${dashPadding}%22%2F%3E%3C%2Fsvg%3E')`;
        }
        this.state.view.dispatch({
            effects: [
                dndMoved.of(newParentIsRootList
                    ? null
                    : editor.posToOffset({
                        line: newParent.getFirstLineContentStart().line,
                        ch: 0,
                    })),
            ],
        });
    }
    hideDropZone() {
        this.dropZone.style.display = "none";
    }
}
class DragAndDropState {
    constructor(view, editor, root, list) {
        this.view = view;
        this.editor = editor;
        this.root = root;
        this.list = list;
        this.dropVariants = new Map();
        this.dropVariant = null;
        this.leftPadding = 0;
        this.tabWidth = 0;
        this.collectDropVariants();
        this.calculateLeftPadding();
        this.calculateTabWidth();
    }
    getDropVariants() {
        return Array.from(this.dropVariants.values());
    }
    hasDropVariants() {
        return this.dropVariants.size > 0;
    }
    calculateNearestDropVariant(x, y) {
        const { view, editor } = this;
        const dropVariants = this.getDropVariants();
        const possibleDropVariants = [];
        for (const v of dropVariants) {
            const { placeToMove } = v;
            const positionAfterList = v.whereToMove === "after" || v.whereToMove === "inside";
            const line = positionAfterList
                ? placeToMove.getContentEndIncludingChildren().line
                : placeToMove.getFirstLineContentStart().line;
            const linePos = editor.posToOffset({
                line,
                ch: 0,
            });
            const coords = view.coordsAtPos(linePos, -1);
            if (!coords) {
                continue;
            }
            v.left = this.leftPadding + (v.level - 1) * this.tabWidth;
            v.top = coords.top;
            if (positionAfterList) {
                v.top += view.lineBlockAt(linePos).height;
            }
            // Better vertical alignment
            v.top -= 8;
            possibleDropVariants.push(v);
        }
        const nearestLineTop = possibleDropVariants
            .sort((a, b) => Math.abs(y - a.top) - Math.abs(y - b.top))
            .first().top;
        const variansOnNearestLine = possibleDropVariants.filter((v) => Math.abs(v.top - nearestLineTop) <= 4);
        this.dropVariant = variansOnNearestLine
            .sort((a, b) => Math.abs(x - a.left) - Math.abs(x - b.left))
            .first();
    }
    addDropVariant(v) {
        this.dropVariants.set(`${v.line} ${v.level}`, v);
    }
    collectDropVariants() {
        const visit = (lists) => {
            for (const placeToMove of lists) {
                const lineBefore = placeToMove.getFirstLineContentStart().line;
                const lineAfter = placeToMove.getContentEndIncludingChildren().line + 1;
                const level = placeToMove.getLevel();
                this.addDropVariant({
                    line: lineBefore,
                    level,
                    left: 0,
                    top: 0,
                    placeToMove,
                    whereToMove: "before",
                });
                this.addDropVariant({
                    line: lineAfter,
                    level,
                    left: 0,
                    top: 0,
                    placeToMove,
                    whereToMove: "after",
                });
                if (placeToMove === this.list) {
                    continue;
                }
                if (placeToMove.isEmpty()) {
                    this.addDropVariant({
                        line: lineAfter,
                        level: level + 1,
                        left: 0,
                        top: 0,
                        placeToMove,
                        whereToMove: "inside",
                    });
                }
                else {
                    visit(placeToMove.getChildren());
                }
            }
        };
        visit(this.root.getChildren());
    }
    calculateLeftPadding() {
        const cmLine = this.view.dom.querySelector("div.cm-line");
        this.leftPadding = cmLine.getBoundingClientRect().left;
    }
    calculateTabWidth() {
        const { view } = this;
        const indentDom = view.dom.querySelector(".cm-indent");
        if (indentDom) {
            this.tabWidth = indentDom.offsetWidth;
            return;
        }
        const singleIndent = language.indentString(view.state, language.getIndentUnit(view.state));
        for (let i = 1; i <= view.state.doc.lines; i++) {
            const line = view.state.doc.line(i);
            if (line.text.startsWith(singleIndent)) {
                const a = view.coordsAtPos(line.from, -1);
                if (!a) {
                    continue;
                }
                const b = view.coordsAtPos(line.from + singleIndent.length, -1);
                if (!b) {
                    continue;
                }
                this.tabWidth = b.left - a.left;
                return;
            }
        }
        this.tabWidth = view.defaultCharacterWidth * language.getIndentUnit(view.state);
    }
}
const dndStarted = state.StateEffect.define({
    map: (lines, change) => lines.map((l) => change.mapPos(l)),
});
const dndMoved = state.StateEffect.define({
    map: (line, change) => (line !== null ? change.mapPos(line) : line),
});
const dndEnded = state.StateEffect.define();
const draggingLineDecoration = view.Decoration.line({
    class: "outliner-plugin-dragging-line",
});
const droppingLineDecoration = view.Decoration.line({
    class: "outliner-plugin-dropping-line",
});
const draggingLinesStateField = state.StateField.define({
    create: () => view.Decoration.none,
    update: (dndState, tr) => {
        dndState = dndState.map(tr.changes);
        for (const e of tr.effects) {
            if (e.is(dndStarted)) {
                dndState = dndState.update({
                    add: e.value.map((l) => draggingLineDecoration.range(l, l)),
                });
            }
            if (e.is(dndEnded)) {
                dndState = view.Decoration.none;
            }
        }
        return dndState;
    },
    provide: (f) => view.EditorView.decorations.from(f),
});
const droppingLinesStateField = state.StateField.define({
    create: () => view.Decoration.none,
    update: (dndDroppingState, tr) => {
        dndDroppingState = dndDroppingState.map(tr.changes);
        for (const e of tr.effects) {
            if (e.is(dndMoved)) {
                dndDroppingState =
                    e.value === null
                        ? view.Decoration.none
                        : view.Decoration.set(droppingLineDecoration.range(e.value, e.value));
            }
            if (e.is(dndEnded)) {
                dndDroppingState = view.Decoration.none;
            }
        }
        return dndDroppingState;
    },
    provide: (f) => view.EditorView.decorations.from(f),
});
function getEditorViewFromHTMLElement(e) {
    while (e && !e.classList.contains("cm-editor")) {
        e = e.parentElement;
    }
    if (!e) {
        return null;
    }
    return view.EditorView.findFromDOM(e);
}
function isClickOnBullet(e) {
    let el = e.target;
    while (el) {
        if (el.classList.contains("cm-formatting-list") ||
            el.classList.contains("cm-fold-indicator") ||
            el.classList.contains("task-list-item-checkbox")) {
            return true;
        }
        el = el.parentElement;
    }
    return false;
}
function isSameRoots(a, b) {
    const [aStart, aEnd] = a.getContentRange();
    const [bStart, bEnd] = b.getContentRange();
    if (cmpPos(aStart, bStart) !== 0 || cmpPos(aEnd, bEnd) !== 0) {
        return false;
    }
    return a.print() === b.print();
}
function isFeatureSupported() {
    return obsidian.Platform.isDesktop;
}

class KeepCursorOutsideFoldedLines {
    constructor(root) {
        this.root = root;
        this.stopPropagation = false;
        this.updated = false;
    }
    shouldStopPropagation() {
        return this.stopPropagation;
    }
    shouldUpdate() {
        return this.updated;
    }
    perform() {
        const { root } = this;
        if (!root.hasSingleCursor()) {
            return;
        }
        const cursor = root.getCursor();
        const list = root.getListUnderCursor();
        if (!list.isFolded()) {
            return;
        }
        const foldRoot = list.getTopFoldRoot();
        const firstLineEnd = foldRoot.getLinesInfo()[0].to;
        if (cursor.line > firstLineEnd.line) {
            this.updated = true;
            this.stopPropagation = true;
            root.replaceCursor(firstLineEnd);
        }
    }
}

class KeepCursorWithinListContent {
    constructor(root) {
        this.root = root;
        this.stopPropagation = false;
        this.updated = false;
    }
    shouldStopPropagation() {
        return this.stopPropagation;
    }
    shouldUpdate() {
        return this.updated;
    }
    perform() {
        const { root } = this;
        if (!root.hasSingleCursor()) {
            return;
        }
        const cursor = root.getCursor();
        const list = root.getListUnderCursor();
        const contentStart = list.getFirstLineContentStartAfterCheckbox();
        const linePrefix = contentStart.line === cursor.line
            ? contentStart.ch
            : list.getNotesIndent().length;
        if (cursor.ch < linePrefix) {
            this.updated = true;
            this.stopPropagation = true;
            root.replaceCursor({
                line: cursor.line,
                ch: linePrefix,
            });
        }
    }
}

class EditorSelectionsBehaviourOverride {
    constructor(plugin, settings, parser, operationPerformer) {
        this.plugin = plugin;
        this.settings = settings;
        this.parser = parser;
        this.operationPerformer = operationPerformer;
        this.transactionExtender = (tr) => {
            if (this.settings.keepCursorWithinContent === "never" || !tr.selection) {
                return null;
            }
            const editor = getEditorFromState(tr.startState);
            setTimeout(() => {
                this.handleSelectionsChanges(editor);
            }, 0);
            return null;
        };
        this.handleSelectionsChanges = (editor) => {
            const root = this.parser.parse(editor);
            if (!root) {
                return;
            }
            {
                const { shouldStopPropagation } = this.operationPerformer.eval(root, new KeepCursorOutsideFoldedLines(root), editor);
                if (shouldStopPropagation) {
                    return;
                }
            }
            this.operationPerformer.eval(root, new KeepCursorWithinListContent(root), editor);
        };
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            this.plugin.registerEditorExtension(state.EditorState.transactionExtender.of(this.transactionExtender));
        });
    }
    unload() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
}

const checkboxRe = `\\[[^\\[\\]]\\][ \t]`;

function isEmptyLineOrEmptyCheckbox(line) {
    return line === "" || line === "[ ] ";
}

class CreateNewItem {
    constructor(root, defaultIndentChars, getZoomRange, after = true) {
        this.root = root;
        this.defaultIndentChars = defaultIndentChars;
        this.getZoomRange = getZoomRange;
        this.after = after;
        this.stopPropagation = false;
        this.updated = false;
    }
    shouldStopPropagation() {
        return this.stopPropagation;
    }
    shouldUpdate() {
        return this.updated;
    }
    perform() {
        const { root } = this;
        if (!root.hasSingleSelection()) {
            return;
        }
        const selection = root.getSelection();
        if (!selection || selection.anchor.line !== selection.head.line) {
            return;
        }
        const list = root.getListUnderCursor();
        const lines = list.getLinesInfo();
        if (lines.length === 1 && isEmptyLineOrEmptyCheckbox(lines[0].text)) {
            return;
        }
        const cursor = root.getCursor();
        const lineUnderCursor = lines.find((l) => l.from.line === cursor.line);
        if (cursor.ch < lineUnderCursor.from.ch) {
            return;
        }
        const { oldLines, newLines } = lines.reduce((acc, line) => {
            if (cursor.line > line.from.line) {
                acc.oldLines.push(line.text);
            }
            else if (cursor.line === line.from.line) {
                const left = line.text.slice(0, selection.from - line.from.ch);
                const right = line.text.slice(selection.to - line.from.ch);
                acc.oldLines.push(left);
                acc.newLines.push(right);
            }
            else if (cursor.line < line.from.line) {
                acc.newLines.push(line.text);
            }
            return acc;
        }, {
            oldLines: [],
            newLines: [],
        });
        const codeBlockBacticks = oldLines.join("\n").split("```").length - 1;
        const isInsideCodeblock = codeBlockBacticks > 0 && codeBlockBacticks % 2 !== 0;
        if (isInsideCodeblock) {
            return;
        }
        this.stopPropagation = true;
        this.updated = true;
        const zoomRange = this.getZoomRange.getZoomRange();
        const listIsZoomingRoot = Boolean(zoomRange &&
            list.getFirstLineContentStart().line >= zoomRange.from.line &&
            list.getLastLineContentEnd().line <= zoomRange.from.line);
        const hasChildren = !list.isEmpty();
        const childIsFolded = list.isFoldRoot();
        const endPos = list.getLastLineContentEnd();
        const endOfLine = cursor.line === endPos.line && cursor.ch === endPos.ch;
        const onChildLevel = listIsZoomingRoot || (hasChildren && !childIsFolded && endOfLine);
        const indent = onChildLevel
            ? hasChildren
                ? list.getChildren()[0].getFirstLineIndent()
                : list.getFirstLineIndent() + this.defaultIndentChars
            : list.getFirstLineIndent();
        const bullet = onChildLevel && hasChildren
            ? list.getChildren()[0].getBullet()
            : list.getBullet();
        const spaceAfterBullet = onChildLevel && hasChildren
            ? list.getChildren()[0].getSpaceAfterBullet()
            : list.getSpaceAfterBullet();
        const prefix = oldLines[0].match(checkboxRe) ? "[ ] " : "";
        const newList = new List(list.getRoot(), indent, bullet, prefix, spaceAfterBullet, prefix + newLines.shift(), false);
        if (newLines.length > 0) {
            newList.setNotesIndent(list.getNotesIndent());
            for (const line of newLines) {
                newList.addLine(line);
            }
        }
        if (onChildLevel) {
            list.addBeforeAll(newList);
        }
        else {
            if (!childIsFolded || !endOfLine) {
                const children = list.getChildren();
                for (const child of children) {
                    list.removeChild(child);
                    newList.addAfterAll(child);
                }
            }
            if (this.after) {
                list.getParent().addAfter(list, newList);
            }
            else {
                list.getParent().addBefore(list, newList);
            }
        }
        list.replaceLines(oldLines);
        const newListStart = newList.getFirstLineContentStart();
        root.replaceCursor({
            line: newListStart.line,
            ch: newListStart.ch + prefix.length,
        });
        recalculateNumericBullets(root);
    }
}

class OutdentList {
    constructor(root) {
        this.root = root;
        this.stopPropagation = false;
        this.updated = false;
    }
    shouldStopPropagation() {
        return this.stopPropagation;
    }
    shouldUpdate() {
        return this.updated;
    }
    perform() {
        const { root } = this;
        if (!root.hasSingleCursor()) {
            return;
        }
        this.stopPropagation = true;
        const list = root.getListUnderCursor();
        const parent = list.getParent();
        const grandParent = parent.getParent();
        if (!grandParent) {
            return;
        }
        this.updated = true;
        const listStartLineBefore = root.getContentLinesRangeOf(list)[0];
        const indentRmFrom = parent.getFirstLineIndent().length;
        const indentRmTill = list.getFirstLineIndent().length;
        parent.removeChild(list);
        grandParent.addAfter(parent, list);
        list.unindentContent(indentRmFrom, indentRmTill);
        const listStartLineAfter = root.getContentLinesRangeOf(list)[0];
        const lineDiff = listStartLineAfter - listStartLineBefore;
        const chDiff = indentRmTill - indentRmFrom;
        const cursor = root.getCursor();
        root.replaceCursor({
            line: cursor.line + lineDiff,
            ch: cursor.ch - chDiff,
        });
        recalculateNumericBullets(root);
    }
}

class OutdentListIfItsEmpty {
    constructor(root) {
        this.root = root;
        this.outdentList = new OutdentList(root);
    }
    shouldStopPropagation() {
        return this.outdentList.shouldStopPropagation();
    }
    shouldUpdate() {
        return this.outdentList.shouldUpdate();
    }
    perform() {
        const { root } = this;
        if (!root.hasSingleCursor()) {
            return;
        }
        const list = root.getListUnderCursor();
        const lines = list.getLines();
        if (lines.length > 1 ||
            !isEmptyLineOrEmptyCheckbox(lines[0]) ||
            list.getLevel() === 1) {
            return;
        }
        this.outdentList.perform();
    }
}

class EnterBehaviourOverride {
    constructor(plugin, settings, imeDetector, obsidianSettings, parser, operationPerformer) {
        this.plugin = plugin;
        this.settings = settings;
        this.imeDetector = imeDetector;
        this.obsidianSettings = obsidianSettings;
        this.parser = parser;
        this.operationPerformer = operationPerformer;
        this.check = () => {
            return this.settings.overrideEnterBehaviour && !this.imeDetector.isOpened();
        };
        this.run = (editor) => {
            const root = this.parser.parse(editor);
            if (!root) {
                return {
                    shouldUpdate: false,
                    shouldStopPropagation: false,
                };
            }
            {
                const res = this.operationPerformer.eval(root, new OutdentListIfItsEmpty(root), editor);
                if (res.shouldStopPropagation) {
                    return res;
                }
            }
            {
                const defaultIndentChars = this.obsidianSettings.getDefaultIndentChars();
                const zoomRange = editor.getZoomRange();
                const getZoomRange = {
                    getZoomRange: () => zoomRange,
                };
                const res = this.operationPerformer.eval(root, new CreateNewItem(root, defaultIndentChars, getZoomRange), editor);
                if (res.shouldUpdate && zoomRange) {
                    editor.tryRefreshZoom(zoomRange.from.line);
                }
                return res;
            }
        };
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            this.plugin.registerEditorExtension(state.Prec.highest(view.keymap.of([
                {
                    key: "Enter",
                    run: createKeymapRunCallback({
                        check: this.check,
                        run: this.run,
                    }),
                },
            ])));
        });
    }
    unload() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
}

function createEditorCallback(cb) {
    return (editor) => {
        const myEditor = new MyEditor(editor);
        const shouldStopPropagation = cb(myEditor);
        if (!shouldStopPropagation &&
            window.event &&
            window.event.type === "keydown") {
            myEditor.triggerOnKeyDown(window.event);
        }
    };
}

class ListsFoldingCommands {
    constructor(plugin, obsidianSettings) {
        this.plugin = plugin;
        this.obsidianSettings = obsidianSettings;
        this.fold = (editor) => {
            return this.setFold(editor, "fold");
        };
        this.unfold = (editor) => {
            return this.setFold(editor, "unfold");
        };
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            this.plugin.addCommand({
                id: "fold",
                icon: "chevrons-down-up",
                name: "Fold the list",
                editorCallback: createEditorCallback(this.fold),
                hotkeys: [
                    {
                        modifiers: ["Mod"],
                        key: "ArrowUp",
                    },
                ],
            });
            this.plugin.addCommand({
                id: "unfold",
                icon: "chevrons-up-down",
                name: "Unfold the list",
                editorCallback: createEditorCallback(this.unfold),
                hotkeys: [
                    {
                        modifiers: ["Mod"],
                        key: "ArrowDown",
                    },
                ],
            });
        });
    }
    unload() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    setFold(editor, type) {
        if (!this.obsidianSettings.getFoldSettings().foldIndent) {
            new obsidian.Notice(`Unable to ${type} because folding is disabled. Please enable "Fold indent" in Obsidian settings.`, 5000);
            return true;
        }
        const cursor = editor.getCursor();
        if (type === "fold") {
            editor.fold(cursor.line);
        }
        else {
            editor.unfold(cursor.line);
        }
        return true;
    }
}

class IndentList {
    constructor(root, defaultIndentChars) {
        this.root = root;
        this.defaultIndentChars = defaultIndentChars;
        this.stopPropagation = false;
        this.updated = false;
    }
    shouldStopPropagation() {
        return this.stopPropagation;
    }
    shouldUpdate() {
        return this.updated;
    }
    perform() {
        const { root } = this;
        if (!root.hasSingleCursor()) {
            return;
        }
        this.stopPropagation = true;
        const list = root.getListUnderCursor();
        const parent = list.getParent();
        const prev = parent.getPrevSiblingOf(list);
        if (!prev) {
            return;
        }
        this.updated = true;
        const listStartLineBefore = root.getContentLinesRangeOf(list)[0];
        const indentPos = list.getFirstLineIndent().length;
        let indentChars = "";
        if (indentChars === "" && !prev.isEmpty()) {
            indentChars = prev
                .getChildren()[0]
                .getFirstLineIndent()
                .slice(prev.getFirstLineIndent().length);
        }
        if (indentChars === "") {
            indentChars = list
                .getFirstLineIndent()
                .slice(parent.getFirstLineIndent().length);
        }
        if (indentChars === "" && !list.isEmpty()) {
            indentChars = list.getChildren()[0].getFirstLineIndent();
        }
        if (indentChars === "") {
            indentChars = this.defaultIndentChars;
        }
        parent.removeChild(list);
        prev.addAfterAll(list);
        list.indentContent(indentPos, indentChars);
        const listStartLineAfter = root.getContentLinesRangeOf(list)[0];
        const lineDiff = listStartLineAfter - listStartLineBefore;
        const cursor = root.getCursor();
        root.replaceCursor({
            line: cursor.line + lineDiff,
            ch: cursor.ch + indentChars.length,
        });
        recalculateNumericBullets(root);
    }
}

class MoveListDown {
    constructor(root) {
        this.root = root;
        this.stopPropagation = false;
        this.updated = false;
    }
    shouldStopPropagation() {
        return this.stopPropagation;
    }
    shouldUpdate() {
        return this.updated;
    }
    perform() {
        const { root } = this;
        if (!root.hasSingleCursor()) {
            return;
        }
        this.stopPropagation = true;
        const list = root.getListUnderCursor();
        const parent = list.getParent();
        const grandParent = parent.getParent();
        const next = parent.getNextSiblingOf(list);
        const listStartLineBefore = root.getContentLinesRangeOf(list)[0];
        if (!next && grandParent) {
            const newParent = grandParent.getNextSiblingOf(parent);
            if (newParent) {
                this.updated = true;
                parent.removeChild(list);
                newParent.addBeforeAll(list);
            }
        }
        else if (next) {
            this.updated = true;
            parent.removeChild(list);
            parent.addAfter(next, list);
        }
        if (!this.updated) {
            return;
        }
        const listStartLineAfter = root.getContentLinesRangeOf(list)[0];
        const lineDiff = listStartLineAfter - listStartLineBefore;
        const cursor = root.getCursor();
        root.replaceCursor({
            line: cursor.line + lineDiff,
            ch: cursor.ch,
        });
        recalculateNumericBullets(root);
    }
}

class MoveListUp {
    constructor(root) {
        this.root = root;
        this.stopPropagation = false;
        this.updated = false;
    }
    shouldStopPropagation() {
        return this.stopPropagation;
    }
    shouldUpdate() {
        return this.updated;
    }
    perform() {
        const { root } = this;
        if (!root.hasSingleCursor()) {
            return;
        }
        this.stopPropagation = true;
        const list = root.getListUnderCursor();
        const parent = list.getParent();
        const grandParent = parent.getParent();
        const prev = parent.getPrevSiblingOf(list);
        const listStartLineBefore = root.getContentLinesRangeOf(list)[0];
        if (!prev && grandParent) {
            const newParent = grandParent.getPrevSiblingOf(parent);
            if (newParent) {
                this.updated = true;
                parent.removeChild(list);
                newParent.addAfterAll(list);
            }
        }
        else if (prev) {
            this.updated = true;
            parent.removeChild(list);
            parent.addBefore(prev, list);
        }
        if (!this.updated) {
            return;
        }
        const listStartLineAfter = root.getContentLinesRangeOf(list)[0];
        const lineDiff = listStartLineAfter - listStartLineBefore;
        const cursor = root.getCursor();
        root.replaceCursor({
            line: cursor.line + lineDiff,
            ch: cursor.ch,
        });
        recalculateNumericBullets(root);
    }
}

class ListsMovementCommands {
    constructor(plugin, obsidianSettings, operationPerformer) {
        this.plugin = plugin;
        this.obsidianSettings = obsidianSettings;
        this.operationPerformer = operationPerformer;
        this.moveListDown = (editor) => {
            const { shouldStopPropagation } = this.operationPerformer.perform((root) => new MoveListDown(root), editor);
            return shouldStopPropagation;
        };
        this.moveListUp = (editor) => {
            const { shouldStopPropagation } = this.operationPerformer.perform((root) => new MoveListUp(root), editor);
            return shouldStopPropagation;
        };
        this.indentList = (editor) => {
            const { shouldStopPropagation } = this.operationPerformer.perform((root) => new IndentList(root, this.obsidianSettings.getDefaultIndentChars()), editor);
            return shouldStopPropagation;
        };
        this.outdentList = (editor) => {
            const { shouldStopPropagation } = this.operationPerformer.perform((root) => new OutdentList(root), editor);
            return shouldStopPropagation;
        };
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            this.plugin.addCommand({
                id: "move-list-item-up",
                icon: "arrow-up",
                name: "Move list and sublists up",
                editorCallback: createEditorCallback(this.moveListUp),
                hotkeys: [
                    {
                        modifiers: ["Mod", "Shift"],
                        key: "ArrowUp",
                    },
                ],
            });
            this.plugin.addCommand({
                id: "move-list-item-down",
                icon: "arrow-down",
                name: "Move list and sublists down",
                editorCallback: createEditorCallback(this.moveListDown),
                hotkeys: [
                    {
                        modifiers: ["Mod", "Shift"],
                        key: "ArrowDown",
                    },
                ],
            });
            this.plugin.addCommand({
                id: "indent-list",
                icon: "indent",
                name: "Indent the list and sublists",
                editorCallback: createEditorCallback(this.indentList),
                hotkeys: [],
            });
            this.plugin.addCommand({
                id: "outdent-list",
                icon: "outdent",
                name: "Outdent the list and sublists",
                editorCallback: createEditorCallback(this.outdentList),
                hotkeys: [],
            });
        });
    }
    unload() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
}

class DeleteTillCurrentLineContentStart {
    constructor(root) {
        this.root = root;
        this.stopPropagation = false;
        this.updated = false;
    }
    shouldStopPropagation() {
        return this.stopPropagation;
    }
    shouldUpdate() {
        return this.updated;
    }
    perform() {
        const { root } = this;
        if (!root.hasSingleCursor()) {
            return;
        }
        this.stopPropagation = true;
        this.updated = true;
        const cursor = root.getCursor();
        const list = root.getListUnderCursor();
        const lines = list.getLinesInfo();
        const lineNo = lines.findIndex((l) => l.from.line === cursor.line);
        lines[lineNo].text = lines[lineNo].text.slice(cursor.ch - lines[lineNo].from.ch);
        list.replaceLines(lines.map((l) => l.text));
        root.replaceCursor(lines[lineNo].from);
    }
}

class MetaBackspaceBehaviourOverride {
    constructor(plugin, settings, imeDetector, operationPerformer) {
        this.plugin = plugin;
        this.settings = settings;
        this.imeDetector = imeDetector;
        this.operationPerformer = operationPerformer;
        this.check = () => {
            return (this.settings.keepCursorWithinContent !== "never" &&
                !this.imeDetector.isOpened());
        };
        this.run = (editor) => {
            return this.operationPerformer.perform((root) => new DeleteTillCurrentLineContentStart(root), editor);
        };
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            this.plugin.registerEditorExtension(view.keymap.of([
                {
                    mac: "m-Backspace",
                    run: createKeymapRunCallback({
                        check: this.check,
                        run: this.run,
                    }),
                },
            ]));
        });
    }
    unload() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
}

class ObsidianOutlinerPluginSettingTab extends obsidian.PluginSettingTab {
    constructor(app, plugin, settings) {
        super(app, plugin);
        this.settings = settings;
    }
    display() {
        const { containerEl } = this;
        containerEl.empty();
        new obsidian.Setting(containerEl)
            .setName("Stick the cursor to the content")
            .setDesc("Don't let the cursor move to the bullet position.")
            .addDropdown((dropdown) => {
            dropdown
                .addOptions({
                never: "Never",
                "bullet-only": "Stick cursor out of bullets",
                "bullet-and-checkbox": "Stick cursor out of bullets and checkboxes",
            })
                .setValue(this.settings.keepCursorWithinContent)
                .onChange((value) => __awaiter(this, void 0, void 0, function* () {
                this.settings.keepCursorWithinContent = value;
                yield this.settings.save();
            }));
        });
        new obsidian.Setting(containerEl)
            .setName("Enhance the Tab key")
            .setDesc("Make Tab and Shift-Tab behave the same as other outliners.")
            .addToggle((toggle) => {
            toggle
                .setValue(this.settings.overrideTabBehaviour)
                .onChange((value) => __awaiter(this, void 0, void 0, function* () {
                this.settings.overrideTabBehaviour = value;
                yield this.settings.save();
            }));
        });
        new obsidian.Setting(containerEl)
            .setName("Enhance the Enter key")
            .setDesc("Make the Enter key behave the same as other outliners.")
            .addToggle((toggle) => {
            toggle
                .setValue(this.settings.overrideEnterBehaviour)
                .onChange((value) => __awaiter(this, void 0, void 0, function* () {
                this.settings.overrideEnterBehaviour = value;
                yield this.settings.save();
            }));
        });
        new obsidian.Setting(containerEl)
            .setName("Vim-mode o/O inserts bullets")
            .setDesc("Create a bullet when pressing o or O in Vim mode.")
            .addToggle((toggle) => {
            toggle
                .setValue(this.settings.overrideVimOBehaviour)
                .onChange((value) => __awaiter(this, void 0, void 0, function* () {
                this.settings.overrideVimOBehaviour = value;
                yield this.settings.save();
            }));
        });
        new obsidian.Setting(containerEl)
            .setName("Enhance the Ctrl+A or Cmd+A behavior")
            .setDesc("Press the hotkey once to select the current list item. Press the hotkey twice to select the entire list.")
            .addToggle((toggle) => {
            toggle
                .setValue(this.settings.overrideSelectAllBehaviour)
                .onChange((value) => __awaiter(this, void 0, void 0, function* () {
                this.settings.overrideSelectAllBehaviour = value;
                yield this.settings.save();
            }));
        });
        new obsidian.Setting(containerEl)
            .setName("Improve the style of your lists")
            .setDesc("Styles are only compatible with built-in Obsidian themes and may not be compatible with other themes.")
            .addToggle((toggle) => {
            toggle
                .setValue(this.settings.betterListsStyles)
                .onChange((value) => __awaiter(this, void 0, void 0, function* () {
                this.settings.betterListsStyles = value;
                yield this.settings.save();
            }));
        });
        new obsidian.Setting(containerEl)
            .setName("Draw vertical indentation lines")
            .addToggle((toggle) => {
            toggle.setValue(this.settings.verticalLines).onChange((value) => __awaiter(this, void 0, void 0, function* () {
                this.settings.verticalLines = value;
                yield this.settings.save();
            }));
        });
        new obsidian.Setting(containerEl)
            .setName("Vertical indentation line click action")
            .addDropdown((dropdown) => {
            dropdown
                .addOptions({
                none: "None",
                "zoom-in": "Zoom In",
                "toggle-folding": "Toggle Folding",
            })
                .setValue(this.settings.verticalLinesAction)
                .onChange((value) => __awaiter(this, void 0, void 0, function* () {
                this.settings.verticalLinesAction = value;
                yield this.settings.save();
            }));
        });
        new obsidian.Setting(containerEl).setName("Drag-and-Drop").addToggle((toggle) => {
            toggle.setValue(this.settings.dragAndDrop).onChange((value) => __awaiter(this, void 0, void 0, function* () {
                this.settings.dragAndDrop = value;
                yield this.settings.save();
            }));
        });
        new obsidian.Setting(containerEl)
            .setName("Debug mode")
            .setDesc("Open DevTools (Command+Option+I or Control+Shift+I) to copy the debug logs.")
            .addToggle((toggle) => {
            toggle.setValue(this.settings.debug).onChange((value) => __awaiter(this, void 0, void 0, function* () {
                this.settings.debug = value;
                yield this.settings.save();
            }));
        });
    }
}
class SettingsTab {
    constructor(plugin, settings) {
        this.plugin = plugin;
        this.settings = settings;
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            this.plugin.addSettingTab(new ObsidianOutlinerPluginSettingTab(this.plugin.app, this.plugin, this.settings));
        });
    }
    unload() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
}

class ShiftTabBehaviourOverride {
    constructor(plugin, imeDetector, settings, operationPerformer) {
        this.plugin = plugin;
        this.imeDetector = imeDetector;
        this.settings = settings;
        this.operationPerformer = operationPerformer;
        this.check = () => {
            return this.settings.overrideTabBehaviour && !this.imeDetector.isOpened();
        };
        this.run = (editor) => {
            return this.operationPerformer.perform((root) => new OutdentList(root), editor);
        };
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            this.plugin.registerEditorExtension(state.Prec.highest(view.keymap.of([
                {
                    key: "s-Tab",
                    run: createKeymapRunCallback({
                        check: this.check,
                        run: this.run,
                    }),
                },
            ])));
        });
    }
    unload() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
}

class SystemInfoModal extends obsidian.Modal {
    constructor(app, settings) {
        super(app);
        this.settings = settings;
    }
    onOpen() {
        return __awaiter(this, void 0, void 0, function* () {
            this.titleEl.setText("System Information");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const app = this.app;
            const data = {
                process: {
                    arch: process.arch,
                    platform: process.platform,
                },
                app: {
                    internalPlugins: {
                        config: app.internalPlugins.config,
                    },
                    isMobile: app.isMobile,
                    plugins: {
                        enabledPlugins: Array.from(app.plugins.enabledPlugins),
                        manifests: Object.keys(app.plugins.manifests).reduce((acc, key) => {
                            acc[key] = {
                                version: app.plugins.manifests[key].version,
                            };
                            return acc;
                        }, {}),
                    },
                    vault: {
                        config: app.vault.config,
                    },
                },
                plugin: {
                    settings: { values: this.settings.getValues() },
                },
            };
            const text = JSON.stringify(data, null, 2);
            const pre = this.contentEl.createEl("pre");
            pre.setText(text);
            pre.setCssStyles({
                overflow: "scroll",
                maxHeight: "300px",
            });
            const button = this.contentEl.createEl("button");
            button.setText("Copy and Close");
            button.onClickEvent(() => {
                navigator.clipboard.writeText("```json\n" + text + "\n```");
                this.close();
            });
        });
    }
}
class SystemInfo {
    constructor(plugin, settings) {
        this.plugin = plugin;
        this.settings = settings;
        this.callback = () => {
            const modal = new SystemInfoModal(this.plugin.app, this.settings);
            modal.open();
        };
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            this.plugin.addCommand({
                id: "system-info",
                name: "Show System Info",
                callback: this.callback,
                hotkeys: [
                    {
                        modifiers: ["Mod", "Shift", "Alt"],
                        key: "I",
                    },
                ],
            });
        });
    }
    unload() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
}

class TabBehaviourOverride {
    constructor(plugin, imeDetector, obsidianSettings, settings, operationPerformer) {
        this.plugin = plugin;
        this.imeDetector = imeDetector;
        this.obsidianSettings = obsidianSettings;
        this.settings = settings;
        this.operationPerformer = operationPerformer;
        this.check = () => {
            return this.settings.overrideTabBehaviour && !this.imeDetector.isOpened();
        };
        this.run = (editor) => {
            return this.operationPerformer.perform((root) => new IndentList(root, this.obsidianSettings.getDefaultIndentChars()), editor);
        };
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            this.plugin.registerEditorExtension(state.Prec.highest(view.keymap.of([
                {
                    key: "Tab",
                    run: createKeymapRunCallback({
                        check: this.check,
                        run: this.run,
                    }),
                },
            ])));
        });
    }
    unload() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
}

const VERTICAL_LINES_BODY_CLASS = "outliner-plugin-vertical-lines";
class VerticalLinesPluginValue {
    constructor(settings, obsidianSettings, parser, view) {
        this.settings = settings;
        this.obsidianSettings = obsidianSettings;
        this.parser = parser;
        this.view = view;
        this.lineElements = [];
        this.waitForEditor = () => {
            const editor = getEditorFromState(this.view.state);
            if (!editor) {
                setTimeout(this.waitForEditor, 0);
                return;
            }
            this.editor = editor;
            this.scheduleRecalculate();
        };
        this.onScroll = (e) => {
            const { scrollLeft, scrollTop } = e.target;
            this.scroller.scrollTo(scrollLeft, scrollTop);
        };
        this.scheduleRecalculate = () => {
            clearTimeout(this.scheduled);
            this.scheduled = setTimeout(this.calculate, 0);
        };
        this.calculate = () => {
            this.lines = [];
            if (this.settings.verticalLines &&
                this.obsidianSettings.isDefaultThemeEnabled() &&
                this.view.viewportLineBlocks.length > 0 &&
                this.view.visibleRanges.length > 0) {
                const fromLine = this.editor.offsetToPos(this.view.viewport.from).line;
                const toLine = this.editor.offsetToPos(this.view.viewport.to).line;
                const lists = this.parser.parseRange(this.editor, fromLine, toLine);
                for (const list of lists) {
                    this.lastLine = list.getContentEnd().line;
                    for (const c of list.getChildren()) {
                        this.recursive(c);
                    }
                }
                this.lines.sort((a, b) => a.top === b.top ? a.left - b.left : a.top - b.top);
            }
            this.updateDom();
        };
        this.onClick = (e) => {
            e.preventDefault();
            const line = this.lines[Number(e.target.dataset.index)];
            switch (this.settings.verticalLinesAction) {
                case "zoom-in":
                    this.zoomIn(line);
                    break;
                case "toggle-folding":
                    this.toggleFolding(line);
                    break;
            }
        };
        this.view.scrollDOM.addEventListener("scroll", this.onScroll);
        this.settings.onChange(this.scheduleRecalculate);
        this.prepareDom();
        this.waitForEditor();
    }
    prepareDom() {
        this.contentContainer = document.createElement("div");
        this.contentContainer.classList.add("outliner-plugin-list-lines-content-container");
        this.scroller = document.createElement("div");
        this.scroller.classList.add("outliner-plugin-list-lines-scroller");
        this.scroller.appendChild(this.contentContainer);
        this.view.dom.appendChild(this.scroller);
    }
    update(update) {
        if (update.docChanged ||
            update.viewportChanged ||
            update.geometryChanged ||
            update.transactions.some((tr) => tr.reconfigured)) {
            this.scheduleRecalculate();
        }
    }
    getNextSibling(list) {
        let listTmp = list;
        let p = listTmp.getParent();
        while (p) {
            const nextSibling = p.getNextSiblingOf(listTmp);
            if (nextSibling) {
                return nextSibling;
            }
            listTmp = p;
            p = listTmp.getParent();
        }
        return null;
    }
    recursive(list, parentCtx = {}) {
        const children = list.getChildren();
        if (children.length === 0) {
            return;
        }
        const fromOffset = this.editor.posToOffset({
            line: list.getFirstLineContentStart().line,
            ch: list.getFirstLineIndent().length,
        });
        const nextSibling = this.getNextSibling(list);
        const tillOffset = this.editor.posToOffset({
            line: nextSibling
                ? nextSibling.getFirstLineContentStart().line - 1
                : this.lastLine,
            ch: 0,
        });
        let visibleFrom = this.view.visibleRanges[0].from;
        let visibleTo = this.view.visibleRanges[this.view.visibleRanges.length - 1].to;
        const zoomRange = this.editor.getZoomRange();
        if (zoomRange) {
            visibleFrom = Math.max(visibleFrom, this.editor.posToOffset(zoomRange.from));
            visibleTo = Math.min(visibleTo, this.editor.posToOffset(zoomRange.to));
        }
        if (fromOffset > visibleTo || tillOffset < visibleFrom) {
            return;
        }
        const coords = this.view.coordsAtPos(fromOffset, 1);
        if (parentCtx.rootLeft === undefined) {
            parentCtx.rootLeft = coords.left;
        }
        const left = Math.floor(coords.right - parentCtx.rootLeft);
        const top = visibleFrom > 0 && fromOffset < visibleFrom
            ? -20
            : this.view.lineBlockAt(fromOffset).top;
        const bottom = tillOffset > visibleTo
            ? this.view.lineBlockAt(visibleTo - 1).bottom
            : this.view.lineBlockAt(tillOffset).bottom;
        const height = bottom - top;
        if (height > 0 && !list.isFolded()) {
            const nextSibling = list.getParent().getNextSiblingOf(list);
            const hasNextSibling = !!nextSibling &&
                this.editor.posToOffset(nextSibling.getFirstLineContentStart()) <=
                    visibleTo;
            this.lines.push({
                top,
                left,
                height: `calc(${height}px ${hasNextSibling ? "- 1.5em" : "- 2em"})`,
                list,
            });
        }
        for (const child of children) {
            if (!child.isEmpty()) {
                this.recursive(child, parentCtx);
            }
        }
    }
    zoomIn(line) {
        const editor = getEditorFromState(this.view.state);
        editor.zoomIn(line.list.getFirstLineContentStart().line);
    }
    toggleFolding(line) {
        const { list } = line;
        if (list.isEmpty()) {
            return;
        }
        let needToUnfold = true;
        const linesToToggle = [];
        for (const c of list.getChildren()) {
            if (c.isEmpty()) {
                continue;
            }
            if (!c.isFolded()) {
                needToUnfold = false;
            }
            linesToToggle.push(c.getFirstLineContentStart().line);
        }
        const editor = getEditorFromState(this.view.state);
        for (const l of linesToToggle) {
            if (needToUnfold) {
                editor.unfold(l);
            }
            else {
                editor.fold(l);
            }
        }
    }
    updateDom() {
        const cmScroll = this.view.scrollDOM;
        const cmContent = this.view.contentDOM;
        const cmContentContainer = cmContent.parentElement;
        const cmSizer = cmContentContainer.parentElement;
        /**
         * Obsidian can add additional elements into Content Manager.
         * The most obvious case is the 'embedded-backlinks' core plugin that adds a menu inside a Content Manager.
         * We must take heights of all of these elements into account
         * to be able to calculate the correct size of lines' container.
         */
        let cmSizerChildrenSumHeight = 0;
        for (let i = 0; i < cmSizer.children.length; i++) {
            cmSizerChildrenSumHeight += cmSizer.children[i].clientHeight;
        }
        this.scroller.style.top = cmScroll.offsetTop + "px";
        this.contentContainer.style.height = cmSizerChildrenSumHeight + "px";
        this.contentContainer.style.marginLeft =
            cmContentContainer.offsetLeft + "px";
        this.contentContainer.style.marginTop =
            cmContent.firstElementChild.offsetTop - 24 + "px";
        for (let i = 0; i < this.lines.length; i++) {
            if (this.lineElements.length === i) {
                const e = document.createElement("div");
                e.classList.add("outliner-plugin-list-line");
                e.dataset.index = String(i);
                e.addEventListener("mousedown", this.onClick);
                this.contentContainer.appendChild(e);
                this.lineElements.push(e);
            }
            const l = this.lines[i];
            const e = this.lineElements[i];
            e.style.top = l.top + "px";
            e.style.left = l.left + "px";
            e.style.height = l.height;
            e.style.display = "block";
        }
        for (let i = this.lines.length; i < this.lineElements.length; i++) {
            const e = this.lineElements[i];
            e.style.top = "0px";
            e.style.left = "0px";
            e.style.height = "0px";
            e.style.display = "none";
        }
    }
    destroy() {
        this.settings.removeCallback(this.scheduleRecalculate);
        this.view.scrollDOM.removeEventListener("scroll", this.onScroll);
        this.view.dom.removeChild(this.scroller);
        clearTimeout(this.scheduled);
    }
}
class VerticalLines {
    constructor(plugin, settings, obsidianSettings, parser) {
        this.plugin = plugin;
        this.settings = settings;
        this.obsidianSettings = obsidianSettings;
        this.parser = parser;
        this.updateBodyClass = () => {
            const shouldExists = this.obsidianSettings.isDefaultThemeEnabled() &&
                this.settings.verticalLines;
            const exists = document.body.classList.contains(VERTICAL_LINES_BODY_CLASS);
            if (shouldExists && !exists) {
                document.body.classList.add(VERTICAL_LINES_BODY_CLASS);
            }
            if (!shouldExists && exists) {
                document.body.classList.remove(VERTICAL_LINES_BODY_CLASS);
            }
        };
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            this.updateBodyClass();
            this.updateBodyClassInterval = window.setInterval(() => {
                this.updateBodyClass();
            }, 1000);
            this.plugin.registerEditorExtension(view.ViewPlugin.define((view) => new VerticalLinesPluginValue(this.settings, this.obsidianSettings, this.parser, view)));
        });
    }
    unload() {
        return __awaiter(this, void 0, void 0, function* () {
            clearInterval(this.updateBodyClassInterval);
            document.body.classList.remove(VERTICAL_LINES_BODY_CLASS);
        });
    }
}

class VimOBehaviourOverride {
    constructor(plugin, settings, obsidianSettings, parser, operationPerformer) {
        this.plugin = plugin;
        this.settings = settings;
        this.obsidianSettings = obsidianSettings;
        this.parser = parser;
        this.operationPerformer = operationPerformer;
        this.inited = false;
        this.handleSettingsChange = () => {
            if (!this.settings.overrideVimOBehaviour) {
                return;
            }
            if (!window.CodeMirrorAdapter || !window.CodeMirrorAdapter.Vim) {
                console.error("Vim adapter not found");
                return;
            }
            const vim = window.CodeMirrorAdapter.Vim;
            const plugin = this.plugin;
            const parser = this.parser;
            const obsidianSettings = this.obsidianSettings;
            const operationPerformer = this.operationPerformer;
            const settings = this.settings;
            vim.defineAction("insertLineAfterBullet", (cm, operatorArgs) => {
                // Move the cursor to the end of the line
                vim.handleEx(cm, "normal! A");
                if (!settings.overrideVimOBehaviour) {
                    if (operatorArgs.after) {
                        vim.handleEx(cm, "normal! o");
                    }
                    else {
                        vim.handleEx(cm, "normal! O");
                    }
                    vim.enterInsertMode(cm);
                    return;
                }
                const view = plugin.app.workspace.getActiveViewOfType(obsidian.MarkdownView);
                const editor = new MyEditor(view.editor);
                const root = parser.parse(editor);
                if (!root) {
                    if (operatorArgs.after) {
                        vim.handleEx(cm, "normal! o");
                    }
                    else {
                        vim.handleEx(cm, "normal! O");
                    }
                    vim.enterInsertMode(cm);
                    return;
                }
                const defaultIndentChars = obsidianSettings.getDefaultIndentChars();
                const zoomRange = editor.getZoomRange();
                const getZoomRange = {
                    getZoomRange: () => zoomRange,
                };
                const res = operationPerformer.eval(root, new CreateNewItem(root, defaultIndentChars, getZoomRange, operatorArgs.after), editor);
                if (res.shouldUpdate && zoomRange) {
                    editor.tryRefreshZoom(zoomRange.from.line);
                }
                // Ensure the editor is always left in insert mode
                vim.enterInsertMode(cm);
            });
            vim.mapCommand("o", "action", "insertLineAfterBullet", {}, {
                isEdit: true,
                context: "normal",
                interlaceInsertRepeat: true,
                actionArgs: { after: true },
            });
            vim.mapCommand("O", "action", "insertLineAfterBullet", {}, {
                isEdit: true,
                context: "normal",
                interlaceInsertRepeat: true,
                actionArgs: { after: false },
            });
            this.inited = true;
        };
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            this.settings.onChange(this.handleSettingsChange);
            this.handleSettingsChange();
        });
    }
    unload() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.inited) {
                return;
            }
            new obsidian.Notice(`To fully unload obsidian-outliner plugin, please restart the app`, 5000);
        });
    }
}

class ChangesApplicator {
    apply(editor, prevRoot, newRoot) {
        const changes = this.calculateChanges(editor, prevRoot, newRoot);
        if (changes) {
            const { replacement, changeFrom, changeTo } = changes;
            const { unfold, fold } = this.calculateFoldingOprations(prevRoot, newRoot, changeFrom, changeTo);
            for (const line of unfold) {
                editor.unfold(line);
            }
            editor.replaceRange(replacement, changeFrom, changeTo);
            for (const line of fold) {
                editor.fold(line);
            }
        }
        editor.setSelections(newRoot.getSelections());
    }
    calculateChanges(editor, prevRoot, newRoot) {
        const rootRange = prevRoot.getContentRange();
        const oldString = editor.getRange(rootRange[0], rootRange[1]);
        const newString = newRoot.print();
        const changeFrom = Object.assign({}, rootRange[0]);
        const changeTo = Object.assign({}, rootRange[1]);
        let oldTmp = oldString;
        let newTmp = newString;
        while (true) {
            const nlIndex = oldTmp.lastIndexOf("\n");
            if (nlIndex < 0) {
                break;
            }
            const oldLine = oldTmp.slice(nlIndex);
            const newLine = newTmp.slice(-oldLine.length);
            if (oldLine !== newLine) {
                break;
            }
            oldTmp = oldTmp.slice(0, -oldLine.length);
            newTmp = newTmp.slice(0, -oldLine.length);
            const nlIndex2 = oldTmp.lastIndexOf("\n");
            changeTo.ch =
                nlIndex2 >= 0 ? oldTmp.length - nlIndex2 - 1 : oldTmp.length;
            changeTo.line--;
        }
        while (true) {
            const nlIndex = oldTmp.indexOf("\n");
            if (nlIndex < 0) {
                break;
            }
            const oldLine = oldTmp.slice(0, nlIndex + 1);
            const newLine = newTmp.slice(0, oldLine.length);
            if (oldLine !== newLine) {
                break;
            }
            changeFrom.line++;
            oldTmp = oldTmp.slice(oldLine.length);
            newTmp = newTmp.slice(oldLine.length);
        }
        if (oldTmp === newTmp) {
            return null;
        }
        return {
            replacement: newTmp,
            changeFrom,
            changeTo,
        };
    }
    calculateFoldingOprations(prevRoot, newRoot, changeFrom, changeTo) {
        const changedRange = [changeFrom, changeTo];
        const prevLists = getAllChildren(prevRoot);
        const newLists = getAllChildren(newRoot);
        const unfold = [];
        const fold = [];
        for (const prevList of prevLists.values()) {
            if (!prevList.isFoldRoot()) {
                continue;
            }
            const newList = newLists.get(prevList.getID());
            if (!newList) {
                continue;
            }
            const prevListRange = [
                prevList.getFirstLineContentStart(),
                prevList.getContentEndIncludingChildren(),
            ];
            if (isRangesIntersects(prevListRange, changedRange)) {
                unfold.push(prevList.getFirstLineContentStart().line);
                fold.push(newList.getFirstLineContentStart().line);
            }
        }
        unfold.sort((a, b) => b - a);
        fold.sort((a, b) => b - a);
        return { unfold, fold };
    }
}
function getAllChildrenReduceFn(acc, child) {
    acc.set(child.getID(), child);
    child.getChildren().reduce(getAllChildrenReduceFn, acc);
    return acc;
}
function getAllChildren(root) {
    return root.getChildren().reduce(getAllChildrenReduceFn, new Map());
}

class IMEDetector {
    constructor() {
        this.composition = false;
        this.onCompositionStart = () => {
            this.composition = true;
        };
        this.onCompositionEnd = () => {
            this.composition = false;
        };
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            document.addEventListener("compositionstart", this.onCompositionStart);
            document.addEventListener("compositionend", this.onCompositionEnd);
        });
    }
    unload() {
        return __awaiter(this, void 0, void 0, function* () {
            document.removeEventListener("compositionend", this.onCompositionEnd);
            document.removeEventListener("compositionstart", this.onCompositionStart);
        });
    }
    isOpened() {
        return this.composition && obsidian.Platform.isDesktop;
    }
}

class Logger {
    constructor(settings) {
        this.settings = settings;
    }
    log(method, ...args) {
        if (!this.settings.debug) {
            return;
        }
        console.info(method, ...args);
    }
    bind(method) {
        return (...args) => this.log(method, ...args);
    }
}

function getHiddenObsidianConfig(app) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return app.vault.config;
}
class ObsidianSettings {
    constructor(app) {
        this.app = app;
    }
    isLegacyEditorEnabled() {
        const config = Object.assign({ legacyEditor: false }, getHiddenObsidianConfig(this.app));
        return config.legacyEditor;
    }
    isDefaultThemeEnabled() {
        const config = Object.assign({ cssTheme: "" }, getHiddenObsidianConfig(this.app));
        return config.cssTheme === "";
    }
    getTabsSettings() {
        return Object.assign({ useTab: true, tabSize: 4 }, getHiddenObsidianConfig(this.app));
    }
    getFoldSettings() {
        return Object.assign({ foldIndent: true }, getHiddenObsidianConfig(this.app));
    }
    getDefaultIndentChars() {
        const { useTab, tabSize } = this.getTabsSettings();
        return useTab ? "\t" : new Array(tabSize).fill(" ").join("");
    }
}

class OperationPerformer {
    constructor(parser, changesApplicator) {
        this.parser = parser;
        this.changesApplicator = changesApplicator;
    }
    eval(root, op, editor) {
        const prevRoot = root.clone();
        op.perform();
        if (op.shouldUpdate()) {
            this.changesApplicator.apply(editor, prevRoot, root);
        }
        return {
            shouldUpdate: op.shouldUpdate(),
            shouldStopPropagation: op.shouldStopPropagation(),
        };
    }
    perform(cb, editor, cursor = editor.getCursor()) {
        const root = this.parser.parse(editor, cursor);
        if (!root) {
            return { shouldUpdate: false, shouldStopPropagation: false };
        }
        const op = cb(root);
        return this.eval(root, op, editor);
    }
}

const bulletSignRe = `(?:[-*+]|\\d+\\.)`;
const optionalCheckboxRe = `(?:${checkboxRe})?`;
const listItemWithoutSpacesRe = new RegExp(`^${bulletSignRe}( |\t)`);
const listItemRe = new RegExp(`^[ \t]*${bulletSignRe}( |\t)`);
const stringWithSpacesRe = new RegExp(`^[ \t]+`);
const parseListItemRe = new RegExp(`^([ \t]*)(${bulletSignRe})( |\t)(${optionalCheckboxRe})(.*)$`);
class Parser {
    constructor(logger, settings) {
        this.logger = logger;
        this.settings = settings;
    }
    parseRange(editor, fromLine = 0, toLine = editor.lastLine()) {
        const lists = [];
        for (let i = fromLine; i <= toLine; i++) {
            const line = editor.getLine(i);
            if (i === fromLine || this.isListItem(line)) {
                const list = this.parseWithLimits(editor, i, fromLine, toLine);
                if (list) {
                    lists.push(list);
                    i = list.getContentEnd().line;
                }
            }
        }
        return lists;
    }
    parse(editor, cursor = editor.getCursor()) {
        return this.parseWithLimits(editor, cursor.line, 0, editor.lastLine());
    }
    parseWithLimits(editor, parsingStartLine, limitFrom, limitTo) {
        const d = this.logger.bind("parseList");
        const error = (msg) => {
            d(msg);
            return null;
        };
        const line = editor.getLine(parsingStartLine);
        let listLookingPos = null;
        if (this.isListItem(line)) {
            listLookingPos = parsingStartLine;
        }
        else if (this.isLineWithIndent(line)) {
            let listLookingPosSearch = parsingStartLine - 1;
            while (listLookingPosSearch >= 0) {
                const line = editor.getLine(listLookingPosSearch);
                if (this.isListItem(line)) {
                    listLookingPos = listLookingPosSearch;
                    break;
                }
                else if (this.isLineWithIndent(line)) {
                    listLookingPosSearch--;
                }
                else {
                    break;
                }
            }
        }
        if (listLookingPos === null) {
            return null;
        }
        let listStartLine = null;
        let listStartLineLookup = listLookingPos;
        while (listStartLineLookup >= 0) {
            const line = editor.getLine(listStartLineLookup);
            if (!this.isListItem(line) && !this.isLineWithIndent(line)) {
                break;
            }
            if (this.isListItemWithoutSpaces(line)) {
                listStartLine = listStartLineLookup;
                if (listStartLineLookup <= limitFrom) {
                    break;
                }
            }
            listStartLineLookup--;
        }
        if (listStartLine === null) {
            return null;
        }
        let listEndLine = listLookingPos;
        let listEndLineLookup = listLookingPos;
        while (listEndLineLookup <= editor.lastLine()) {
            const line = editor.getLine(listEndLineLookup);
            if (!this.isListItem(line) && !this.isLineWithIndent(line)) {
                break;
            }
            if (!this.isEmptyLine(line)) {
                listEndLine = listEndLineLookup;
            }
            if (listEndLineLookup >= limitTo) {
                listEndLine = limitTo;
                break;
            }
            listEndLineLookup++;
        }
        if (listStartLine > parsingStartLine || listEndLine < parsingStartLine) {
            return null;
        }
        // if the last line contains only spaces and that's incorrect indent, then ignore the last line
        // https://github.com/vslinko/obsidian-outliner/issues/368
        if (listEndLine > listStartLine) {
            const lastLine = editor.getLine(listEndLine);
            if (lastLine.trim().length === 0) {
                const prevLine = editor.getLine(listEndLine - 1);
                const [, prevLineIndent] = /^(\s*)/.exec(prevLine);
                if (!lastLine.startsWith(prevLineIndent)) {
                    listEndLine--;
                }
            }
        }
        const root = new Root({ line: listStartLine, ch: 0 }, { line: listEndLine, ch: editor.getLine(listEndLine).length }, editor.listSelections().map((r) => ({
            anchor: { line: r.anchor.line, ch: r.anchor.ch },
            head: { line: r.head.line, ch: r.head.ch },
        })));
        let currentParent = root.getRootList();
        let currentList = null;
        let currentIndent = "";
        const foldedLines = editor.getAllFoldedLines();
        for (let l = listStartLine; l <= listEndLine; l++) {
            const line = editor.getLine(l);
            const matches = parseListItemRe.exec(line);
            if (matches) {
                const [, indent, bullet, spaceAfterBullet] = matches;
                let [, , , , optionalCheckbox, content] = matches;
                content = optionalCheckbox + content;
                if (this.settings.keepCursorWithinContent !== "bullet-and-checkbox") {
                    optionalCheckbox = "";
                }
                const compareLength = Math.min(currentIndent.length, indent.length);
                const indentSlice = indent.slice(0, compareLength);
                const currentIndentSlice = currentIndent.slice(0, compareLength);
                if (indentSlice !== currentIndentSlice) {
                    const expected = currentIndentSlice
                        .replace(/ /g, "S")
                        .replace(/\t/g, "T");
                    const got = indentSlice.replace(/ /g, "S").replace(/\t/g, "T");
                    return error(`Unable to parse list: expected indent "${expected}", got "${got}"`);
                }
                if (indent.length > currentIndent.length) {
                    currentParent = currentList;
                    currentIndent = indent;
                }
                else if (indent.length < currentIndent.length) {
                    while (currentParent.getFirstLineIndent().length >= indent.length &&
                        currentParent.getParent()) {
                        currentParent = currentParent.getParent();
                    }
                    currentIndent = indent;
                }
                const foldRoot = foldedLines.includes(l);
                currentList = new List(root, indent, bullet, optionalCheckbox, spaceAfterBullet, content, foldRoot);
                currentParent.addAfterAll(currentList);
            }
            else if (this.isLineWithIndent(line)) {
                if (!currentList) {
                    return error(`Unable to parse list: expected list item, got empty line`);
                }
                const indentToCheck = currentList.getNotesIndent() || currentIndent;
                if (line.indexOf(indentToCheck) !== 0) {
                    const expected = indentToCheck.replace(/ /g, "S").replace(/\t/g, "T");
                    const got = line
                        .match(/^[ \t]*/)[0]
                        .replace(/ /g, "S")
                        .replace(/\t/g, "T");
                    return error(`Unable to parse list: expected indent "${expected}", got "${got}"`);
                }
                if (!currentList.getNotesIndent()) {
                    const matches = line.match(/^[ \t]+/);
                    if (!matches || matches[0].length <= currentIndent.length) {
                        if (/^\s+$/.test(line)) {
                            continue;
                        }
                        return error(`Unable to parse list: expected some indent, got no indent`);
                    }
                    currentList.setNotesIndent(matches[0]);
                }
                currentList.addLine(line.slice(currentList.getNotesIndent().length));
            }
            else {
                return error(`Unable to parse list: expected list item or note, got "${line}"`);
            }
        }
        return root;
    }
    isEmptyLine(line) {
        return line.length === 0;
    }
    isLineWithIndent(line) {
        return stringWithSpacesRe.test(line);
    }
    isListItem(line) {
        return listItemRe.test(line);
    }
    isListItemWithoutSpaces(line) {
        return listItemWithoutSpacesRe.test(line);
    }
}

const DEFAULT_SETTINGS = {
    styleLists: true,
    debug: false,
    stickCursor: "bullet-and-checkbox",
    betterEnter: true,
    betterVimO: true,
    betterTab: true,
    selectAll: true,
    listLines: false,
    listLineAction: "toggle-folding",
    dnd: true,
    previousRelease: null,
};
class Settings {
    constructor(storage) {
        this.storage = storage;
        this.callbacks = new Set();
    }
    get keepCursorWithinContent() {
        // Adaptor for users migrating from older version of the plugin.
        if (this.values.stickCursor === true) {
            return "bullet-and-checkbox";
        }
        else if (this.values.stickCursor === false) {
            return "never";
        }
        return this.values.stickCursor;
    }
    set keepCursorWithinContent(value) {
        this.set("stickCursor", value);
    }
    get overrideTabBehaviour() {
        return this.values.betterTab;
    }
    set overrideTabBehaviour(value) {
        this.set("betterTab", value);
    }
    get overrideEnterBehaviour() {
        return this.values.betterEnter;
    }
    set overrideEnterBehaviour(value) {
        this.set("betterEnter", value);
    }
    get overrideVimOBehaviour() {
        return this.values.betterVimO;
    }
    set overrideVimOBehaviour(value) {
        this.set("betterVimO", value);
    }
    get overrideSelectAllBehaviour() {
        return this.values.selectAll;
    }
    set overrideSelectAllBehaviour(value) {
        this.set("selectAll", value);
    }
    get betterListsStyles() {
        return this.values.styleLists;
    }
    set betterListsStyles(value) {
        this.set("styleLists", value);
    }
    get verticalLines() {
        return this.values.listLines;
    }
    set verticalLines(value) {
        this.set("listLines", value);
    }
    get verticalLinesAction() {
        return this.values.listLineAction;
    }
    set verticalLinesAction(value) {
        this.set("listLineAction", value);
    }
    get dragAndDrop() {
        return this.values.dnd;
    }
    set dragAndDrop(value) {
        this.set("dnd", value);
    }
    get debug() {
        return this.values.debug;
    }
    set debug(value) {
        this.set("debug", value);
    }
    get previousRelease() {
        return this.values.previousRelease;
    }
    set previousRelease(value) {
        this.set("previousRelease", value);
    }
    onChange(cb) {
        this.callbacks.add(cb);
    }
    removeCallback(cb) {
        this.callbacks.delete(cb);
    }
    reset() {
        for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) {
            this.set(k, v);
        }
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            this.values = Object.assign({}, DEFAULT_SETTINGS, yield this.storage.loadData());
        });
    }
    save() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.storage.saveData(this.values);
        });
    }
    getValues() {
        return Object.assign({}, this.values);
    }
    set(key, value) {
        this.values[key] = value;
        for (const cb of this.callbacks) {
            cb();
        }
    }
}

class ObsidianOutlinerPlugin extends obsidian.Plugin {
    onload() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Loading obsidian-outliner`);
            yield this.prepareSettings();
            this.obsidianSettings = new ObsidianSettings(this.app);
            this.logger = new Logger(this.settings);
            this.parser = new Parser(this.logger, this.settings);
            this.changesApplicator = new ChangesApplicator();
            this.operationPerformer = new OperationPerformer(this.parser, this.changesApplicator);
            this.imeDetector = new IMEDetector();
            yield this.imeDetector.load();
            this.features = [
                // service features
                // new ReleaseNotesAnnouncement(this, this.settings),
                new SettingsTab(this, this.settings),
                new SystemInfo(this, this.settings),
                // general features
                new ListsMovementCommands(this, this.obsidianSettings, this.operationPerformer),
                new ListsFoldingCommands(this, this.obsidianSettings),
                // features based on settings.keepCursorWithinContent
                new EditorSelectionsBehaviourOverride(this, this.settings, this.parser, this.operationPerformer),
                new ArrowLeftAndCtrlArrowLeftBehaviourOverride(this, this.settings, this.imeDetector, this.operationPerformer),
                new BackspaceBehaviourOverride(this, this.settings, this.imeDetector, this.operationPerformer),
                new MetaBackspaceBehaviourOverride(this, this.settings, this.imeDetector, this.operationPerformer),
                new DeleteBehaviourOverride(this, this.settings, this.imeDetector, this.operationPerformer),
                // features based on settings.overrideTabBehaviour
                new TabBehaviourOverride(this, this.imeDetector, this.obsidianSettings, this.settings, this.operationPerformer),
                new ShiftTabBehaviourOverride(this, this.imeDetector, this.settings, this.operationPerformer),
                // features based on settings.overrideEnterBehaviour
                new EnterBehaviourOverride(this, this.settings, this.imeDetector, this.obsidianSettings, this.parser, this.operationPerformer),
                // features based on settings.overrideVimOBehaviour
                new VimOBehaviourOverride(this, this.settings, this.obsidianSettings, this.parser, this.operationPerformer),
                // features based on settings.overrideSelectAllBehaviour
                new CtrlAAndCmdABehaviourOverride(this, this.settings, this.imeDetector, this.operationPerformer),
                // features based on settings.betterListsStyles
                new BetterListsStyles(this.settings, this.obsidianSettings),
                // features based on settings.verticalLines
                new VerticalLines(this, this.settings, this.obsidianSettings, this.parser),
                // features based on settings.dragAndDrop
                new DragAndDrop(this, this.settings, this.obsidianSettings, this.parser, this.operationPerformer),
            ];
            for (const feature of this.features) {
                yield feature.load();
            }
        });
    }
    onunload() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Unloading obsidian-outliner`);
            yield this.imeDetector.unload();
            for (const feature of this.features) {
                yield feature.unload();
            }
        });
    }
    prepareSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            this.settings = new Settings(this);
            yield this.settings.load();
        });
    }
}

module.exports = ObsidianOutlinerPlugin;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsiLi4vbm9kZV9tb2R1bGVzL3RzbGliL3RzbGliLmVzNi5qcyIsIi4uL3NyYy9vcGVyYXRpb25zL01vdmVDdXJzb3JUb1ByZXZpb3VzVW5mb2xkZWRMaW5lLnRzIiwiLi4vc3JjL2VkaXRvci9pbmRleC50cyIsIi4uL3NyYy91dGlscy9jcmVhdGVLZXltYXBSdW5DYWxsYmFjay50cyIsIi4uL3NyYy9mZWF0dXJlcy9BcnJvd0xlZnRBbmRDdHJsQXJyb3dMZWZ0QmVoYXZpb3VyT3ZlcnJpZGUudHMiLCIuLi9zcmMvcm9vdC9pbmRleC50cyIsIi4uL3NyYy9vcGVyYXRpb25zL0RlbGV0ZVRpbGxQcmV2aW91c0xpbmVDb250ZW50RW5kLnRzIiwiLi4vc3JjL2ZlYXR1cmVzL0JhY2tzcGFjZUJlaGF2aW91ck92ZXJyaWRlLnRzIiwiLi4vc3JjL2ZlYXR1cmVzL0JldHRlckxpc3RzU3R5bGVzLnRzIiwiLi4vc3JjL29wZXJhdGlvbnMvU2VsZWN0QWxsQ29udGVudC50cyIsIi4uL3NyYy9mZWF0dXJlcy9DdHJsQUFuZENtZEFCZWhhdmlvdXJPdmVycmlkZS50cyIsIi4uL3NyYy9vcGVyYXRpb25zL0RlbGV0ZVRpbGxOZXh0TGluZUNvbnRlbnRTdGFydC50cyIsIi4uL3NyYy9mZWF0dXJlcy9EZWxldGVCZWhhdmlvdXJPdmVycmlkZS50cyIsIi4uL3NyYy9vcGVyYXRpb25zL01vdmVMaXN0VG9EaWZmZXJlbnRQb3NpdGlvbi50cyIsIi4uL3NyYy9mZWF0dXJlcy9EcmFnQW5kRHJvcC50cyIsIi4uL3NyYy9vcGVyYXRpb25zL0tlZXBDdXJzb3JPdXRzaWRlRm9sZGVkTGluZXMudHMiLCIuLi9zcmMvb3BlcmF0aW9ucy9LZWVwQ3Vyc29yV2l0aGluTGlzdENvbnRlbnQudHMiLCIuLi9zcmMvZmVhdHVyZXMvRWRpdG9yU2VsZWN0aW9uc0JlaGF2aW91ck92ZXJyaWRlLnRzIiwiLi4vc3JjL3V0aWxzL2NoZWNrYm94UmUudHMiLCIuLi9zcmMvdXRpbHMvaXNFbXB0eUxpbmVPckVtcHR5Q2hlY2tib3gudHMiLCIuLi9zcmMvb3BlcmF0aW9ucy9DcmVhdGVOZXdJdGVtLnRzIiwiLi4vc3JjL29wZXJhdGlvbnMvT3V0ZGVudExpc3QudHMiLCIuLi9zcmMvb3BlcmF0aW9ucy9PdXRkZW50TGlzdElmSXRzRW1wdHkudHMiLCIuLi9zcmMvZmVhdHVyZXMvRW50ZXJCZWhhdmlvdXJPdmVycmlkZS50cyIsIi4uL3NyYy91dGlscy9jcmVhdGVFZGl0b3JDYWxsYmFjay50cyIsIi4uL3NyYy9mZWF0dXJlcy9MaXN0c0ZvbGRpbmdDb21tYW5kcy50cyIsIi4uL3NyYy9vcGVyYXRpb25zL0luZGVudExpc3QudHMiLCIuLi9zcmMvb3BlcmF0aW9ucy9Nb3ZlTGlzdERvd24udHMiLCIuLi9zcmMvb3BlcmF0aW9ucy9Nb3ZlTGlzdFVwLnRzIiwiLi4vc3JjL2ZlYXR1cmVzL0xpc3RzTW92ZW1lbnRDb21tYW5kcy50cyIsIi4uL3NyYy9vcGVyYXRpb25zL0RlbGV0ZVRpbGxDdXJyZW50TGluZUNvbnRlbnRTdGFydC50cyIsIi4uL3NyYy9mZWF0dXJlcy9NZXRhQmFja3NwYWNlQmVoYXZpb3VyT3ZlcnJpZGUudHMiLCIuLi9zcmMvZmVhdHVyZXMvU2V0dGluZ3NUYWIudHMiLCIuLi9zcmMvZmVhdHVyZXMvU2hpZnRUYWJCZWhhdmlvdXJPdmVycmlkZS50cyIsIi4uL3NyYy9mZWF0dXJlcy9TeXN0ZW1JbmZvLnRzIiwiLi4vc3JjL2ZlYXR1cmVzL1RhYkJlaGF2aW91ck92ZXJyaWRlLnRzIiwiLi4vc3JjL2ZlYXR1cmVzL1ZlcnRpY2FsTGluZXMudHMiLCIuLi9zcmMvZmVhdHVyZXMvVmltT0JlaGF2aW91ck92ZXJyaWRlLnRzIiwiLi4vc3JjL3NlcnZpY2VzL0NoYW5nZXNBcHBsaWNhdG9yLnRzIiwiLi4vc3JjL3NlcnZpY2VzL0lNRURldGVjdG9yLnRzIiwiLi4vc3JjL3NlcnZpY2VzL0xvZ2dlci50cyIsIi4uL3NyYy9zZXJ2aWNlcy9PYnNpZGlhblNldHRpbmdzLnRzIiwiLi4vc3JjL3NlcnZpY2VzL09wZXJhdGlvblBlcmZvcm1lci50cyIsIi4uL3NyYy9zZXJ2aWNlcy9QYXJzZXIudHMiLCIuLi9zcmMvc2VydmljZXMvU2V0dGluZ3MudHMiLCIuLi9zcmMvT2JzaWRpYW5PdXRsaW5lclBsdWdpbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbkNvcHlyaWdodCAoYykgTWljcm9zb2Z0IENvcnBvcmF0aW9uLlxyXG5cclxuUGVybWlzc2lvbiB0byB1c2UsIGNvcHksIG1vZGlmeSwgYW5kL29yIGRpc3RyaWJ1dGUgdGhpcyBzb2Z0d2FyZSBmb3IgYW55XHJcbnB1cnBvc2Ugd2l0aCBvciB3aXRob3V0IGZlZSBpcyBoZXJlYnkgZ3JhbnRlZC5cclxuXHJcblRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIgQU5EIFRIRSBBVVRIT1IgRElTQ0xBSU1TIEFMTCBXQVJSQU5USUVTIFdJVEhcclxuUkVHQVJEIFRPIFRISVMgU09GVFdBUkUgSU5DTFVESU5HIEFMTCBJTVBMSUVEIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZXHJcbkFORCBGSVRORVNTLiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SIEJFIExJQUJMRSBGT1IgQU5ZIFNQRUNJQUwsIERJUkVDVCxcclxuSU5ESVJFQ1QsIE9SIENPTlNFUVVFTlRJQUwgREFNQUdFUyBPUiBBTlkgREFNQUdFUyBXSEFUU09FVkVSIFJFU1VMVElORyBGUk9NXHJcbkxPU1MgT0YgVVNFLCBEQVRBIE9SIFBST0ZJVFMsIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBORUdMSUdFTkNFIE9SXHJcbk9USEVSIFRPUlRJT1VTIEFDVElPTiwgQVJJU0lORyBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBVU0UgT1JcclxuUEVSRk9STUFOQ0UgT0YgVEhJUyBTT0ZUV0FSRS5cclxuKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogKi9cclxuLyogZ2xvYmFsIFJlZmxlY3QsIFByb21pc2UsIFN1cHByZXNzZWRFcnJvciwgU3ltYm9sLCBJdGVyYXRvciAqL1xyXG5cclxudmFyIGV4dGVuZFN0YXRpY3MgPSBmdW5jdGlvbihkLCBiKSB7XHJcbiAgICBleHRlbmRTdGF0aWNzID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8XHJcbiAgICAgICAgKHsgX19wcm90b19fOiBbXSB9IGluc3RhbmNlb2YgQXJyYXkgJiYgZnVuY3Rpb24gKGQsIGIpIHsgZC5fX3Byb3RvX18gPSBiOyB9KSB8fFxyXG4gICAgICAgIGZ1bmN0aW9uIChkLCBiKSB7IGZvciAodmFyIHAgaW4gYikgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChiLCBwKSkgZFtwXSA9IGJbcF07IH07XHJcbiAgICByZXR1cm4gZXh0ZW5kU3RhdGljcyhkLCBiKTtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2V4dGVuZHMoZCwgYikge1xyXG4gICAgaWYgKHR5cGVvZiBiICE9PSBcImZ1bmN0aW9uXCIgJiYgYiAhPT0gbnVsbClcclxuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2xhc3MgZXh0ZW5kcyB2YWx1ZSBcIiArIFN0cmluZyhiKSArIFwiIGlzIG5vdCBhIGNvbnN0cnVjdG9yIG9yIG51bGxcIik7XHJcbiAgICBleHRlbmRTdGF0aWNzKGQsIGIpO1xyXG4gICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XHJcbiAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XHJcbn1cclxuXHJcbmV4cG9ydCB2YXIgX19hc3NpZ24gPSBmdW5jdGlvbigpIHtcclxuICAgIF9fYXNzaWduID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiBfX2Fzc2lnbih0KSB7XHJcbiAgICAgICAgZm9yICh2YXIgcywgaSA9IDEsIG4gPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XHJcbiAgICAgICAgICAgIHMgPSBhcmd1bWVudHNbaV07XHJcbiAgICAgICAgICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSkgdFtwXSA9IHNbcF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0O1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIF9fYXNzaWduLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3Jlc3QocywgZSkge1xyXG4gICAgdmFyIHQgPSB7fTtcclxuICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSAmJiBlLmluZGV4T2YocCkgPCAwKVxyXG4gICAgICAgIHRbcF0gPSBzW3BdO1xyXG4gICAgaWYgKHMgIT0gbnVsbCAmJiB0eXBlb2YgT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyA9PT0gXCJmdW5jdGlvblwiKVxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBwID0gT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhzKTsgaSA8IHAubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKGUuaW5kZXhPZihwW2ldKSA8IDAgJiYgT2JqZWN0LnByb3RvdHlwZS5wcm9wZXJ0eUlzRW51bWVyYWJsZS5jYWxsKHMsIHBbaV0pKVxyXG4gICAgICAgICAgICAgICAgdFtwW2ldXSA9IHNbcFtpXV07XHJcbiAgICAgICAgfVxyXG4gICAgcmV0dXJuIHQ7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2RlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XHJcbiAgICB2YXIgYyA9IGFyZ3VtZW50cy5sZW5ndGgsIHIgPSBjIDwgMyA/IHRhcmdldCA6IGRlc2MgPT09IG51bGwgPyBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIGtleSkgOiBkZXNjLCBkO1xyXG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcclxuICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XHJcbiAgICByZXR1cm4gYyA+IDMgJiYgciAmJiBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHIpLCByO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19wYXJhbShwYXJhbUluZGV4LCBkZWNvcmF0b3IpIHtcclxuICAgIHJldHVybiBmdW5jdGlvbiAodGFyZ2V0LCBrZXkpIHsgZGVjb3JhdG9yKHRhcmdldCwga2V5LCBwYXJhbUluZGV4KTsgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19lc0RlY29yYXRlKGN0b3IsIGRlc2NyaXB0b3JJbiwgZGVjb3JhdG9ycywgY29udGV4dEluLCBpbml0aWFsaXplcnMsIGV4dHJhSW5pdGlhbGl6ZXJzKSB7XHJcbiAgICBmdW5jdGlvbiBhY2NlcHQoZikgeyBpZiAoZiAhPT0gdm9pZCAwICYmIHR5cGVvZiBmICE9PSBcImZ1bmN0aW9uXCIpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJGdW5jdGlvbiBleHBlY3RlZFwiKTsgcmV0dXJuIGY7IH1cclxuICAgIHZhciBraW5kID0gY29udGV4dEluLmtpbmQsIGtleSA9IGtpbmQgPT09IFwiZ2V0dGVyXCIgPyBcImdldFwiIDoga2luZCA9PT0gXCJzZXR0ZXJcIiA/IFwic2V0XCIgOiBcInZhbHVlXCI7XHJcbiAgICB2YXIgdGFyZ2V0ID0gIWRlc2NyaXB0b3JJbiAmJiBjdG9yID8gY29udGV4dEluW1wic3RhdGljXCJdID8gY3RvciA6IGN0b3IucHJvdG90eXBlIDogbnVsbDtcclxuICAgIHZhciBkZXNjcmlwdG9yID0gZGVzY3JpcHRvckluIHx8ICh0YXJnZXQgPyBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwgY29udGV4dEluLm5hbWUpIDoge30pO1xyXG4gICAgdmFyIF8sIGRvbmUgPSBmYWxzZTtcclxuICAgIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgdmFyIGNvbnRleHQgPSB7fTtcclxuICAgICAgICBmb3IgKHZhciBwIGluIGNvbnRleHRJbikgY29udGV4dFtwXSA9IHAgPT09IFwiYWNjZXNzXCIgPyB7fSA6IGNvbnRleHRJbltwXTtcclxuICAgICAgICBmb3IgKHZhciBwIGluIGNvbnRleHRJbi5hY2Nlc3MpIGNvbnRleHQuYWNjZXNzW3BdID0gY29udGV4dEluLmFjY2Vzc1twXTtcclxuICAgICAgICBjb250ZXh0LmFkZEluaXRpYWxpemVyID0gZnVuY3Rpb24gKGYpIHsgaWYgKGRvbmUpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgYWRkIGluaXRpYWxpemVycyBhZnRlciBkZWNvcmF0aW9uIGhhcyBjb21wbGV0ZWRcIik7IGV4dHJhSW5pdGlhbGl6ZXJzLnB1c2goYWNjZXB0KGYgfHwgbnVsbCkpOyB9O1xyXG4gICAgICAgIHZhciByZXN1bHQgPSAoMCwgZGVjb3JhdG9yc1tpXSkoa2luZCA9PT0gXCJhY2Nlc3NvclwiID8geyBnZXQ6IGRlc2NyaXB0b3IuZ2V0LCBzZXQ6IGRlc2NyaXB0b3Iuc2V0IH0gOiBkZXNjcmlwdG9yW2tleV0sIGNvbnRleHQpO1xyXG4gICAgICAgIGlmIChraW5kID09PSBcImFjY2Vzc29yXCIpIHtcclxuICAgICAgICAgICAgaWYgKHJlc3VsdCA9PT0gdm9pZCAwKSBjb250aW51ZTtcclxuICAgICAgICAgICAgaWYgKHJlc3VsdCA9PT0gbnVsbCB8fCB0eXBlb2YgcmVzdWx0ICE9PSBcIm9iamVjdFwiKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiT2JqZWN0IGV4cGVjdGVkXCIpO1xyXG4gICAgICAgICAgICBpZiAoXyA9IGFjY2VwdChyZXN1bHQuZ2V0KSkgZGVzY3JpcHRvci5nZXQgPSBfO1xyXG4gICAgICAgICAgICBpZiAoXyA9IGFjY2VwdChyZXN1bHQuc2V0KSkgZGVzY3JpcHRvci5zZXQgPSBfO1xyXG4gICAgICAgICAgICBpZiAoXyA9IGFjY2VwdChyZXN1bHQuaW5pdCkpIGluaXRpYWxpemVycy51bnNoaWZ0KF8pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChfID0gYWNjZXB0KHJlc3VsdCkpIHtcclxuICAgICAgICAgICAgaWYgKGtpbmQgPT09IFwiZmllbGRcIikgaW5pdGlhbGl6ZXJzLnVuc2hpZnQoXyk7XHJcbiAgICAgICAgICAgIGVsc2UgZGVzY3JpcHRvcltrZXldID0gXztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAodGFyZ2V0KSBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBjb250ZXh0SW4ubmFtZSwgZGVzY3JpcHRvcik7XHJcbiAgICBkb25lID0gdHJ1ZTtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3J1bkluaXRpYWxpemVycyh0aGlzQXJnLCBpbml0aWFsaXplcnMsIHZhbHVlKSB7XHJcbiAgICB2YXIgdXNlVmFsdWUgPSBhcmd1bWVudHMubGVuZ3RoID4gMjtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaW5pdGlhbGl6ZXJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgdmFsdWUgPSB1c2VWYWx1ZSA/IGluaXRpYWxpemVyc1tpXS5jYWxsKHRoaXNBcmcsIHZhbHVlKSA6IGluaXRpYWxpemVyc1tpXS5jYWxsKHRoaXNBcmcpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHVzZVZhbHVlID8gdmFsdWUgOiB2b2lkIDA7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19wcm9wS2V5KHgpIHtcclxuICAgIHJldHVybiB0eXBlb2YgeCA9PT0gXCJzeW1ib2xcIiA/IHggOiBcIlwiLmNvbmNhdCh4KTtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3NldEZ1bmN0aW9uTmFtZShmLCBuYW1lLCBwcmVmaXgpIHtcclxuICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gXCJzeW1ib2xcIikgbmFtZSA9IG5hbWUuZGVzY3JpcHRpb24gPyBcIltcIi5jb25jYXQobmFtZS5kZXNjcmlwdGlvbiwgXCJdXCIpIDogXCJcIjtcclxuICAgIHJldHVybiBPYmplY3QuZGVmaW5lUHJvcGVydHkoZiwgXCJuYW1lXCIsIHsgY29uZmlndXJhYmxlOiB0cnVlLCB2YWx1ZTogcHJlZml4ID8gXCJcIi5jb25jYXQocHJlZml4LCBcIiBcIiwgbmFtZSkgOiBuYW1lIH0pO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fbWV0YWRhdGEobWV0YWRhdGFLZXksIG1ldGFkYXRhVmFsdWUpIHtcclxuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5tZXRhZGF0YSA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gUmVmbGVjdC5tZXRhZGF0YShtZXRhZGF0YUtleSwgbWV0YWRhdGFWYWx1ZSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2F3YWl0ZXIodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7XHJcbiAgICBmdW5jdGlvbiBhZG9wdCh2YWx1ZSkgeyByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBQID8gdmFsdWUgOiBuZXcgUChmdW5jdGlvbiAocmVzb2x2ZSkgeyByZXNvbHZlKHZhbHVlKTsgfSk7IH1cclxuICAgIHJldHVybiBuZXcgKFAgfHwgKFAgPSBQcm9taXNlKSkoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgIGZ1bmN0aW9uIGZ1bGZpbGxlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci5uZXh0KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cclxuICAgICAgICBmdW5jdGlvbiByZWplY3RlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvcltcInRocm93XCJdKHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cclxuICAgICAgICBmdW5jdGlvbiBzdGVwKHJlc3VsdCkgeyByZXN1bHQuZG9uZSA/IHJlc29sdmUocmVzdWx0LnZhbHVlKSA6IGFkb3B0KHJlc3VsdC52YWx1ZSkudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkKTsgfVxyXG4gICAgICAgIHN0ZXAoKGdlbmVyYXRvciA9IGdlbmVyYXRvci5hcHBseSh0aGlzQXJnLCBfYXJndW1lbnRzIHx8IFtdKSkubmV4dCgpKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19nZW5lcmF0b3IodGhpc0FyZywgYm9keSkge1xyXG4gICAgdmFyIF8gPSB7IGxhYmVsOiAwLCBzZW50OiBmdW5jdGlvbigpIHsgaWYgKHRbMF0gJiAxKSB0aHJvdyB0WzFdOyByZXR1cm4gdFsxXTsgfSwgdHJ5czogW10sIG9wczogW10gfSwgZiwgeSwgdCwgZyA9IE9iamVjdC5jcmVhdGUoKHR5cGVvZiBJdGVyYXRvciA9PT0gXCJmdW5jdGlvblwiID8gSXRlcmF0b3IgOiBPYmplY3QpLnByb3RvdHlwZSk7XHJcbiAgICByZXR1cm4gZy5uZXh0ID0gdmVyYigwKSwgZ1tcInRocm93XCJdID0gdmVyYigxKSwgZ1tcInJldHVyblwiXSA9IHZlcmIoMiksIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiAoZ1tTeW1ib2wuaXRlcmF0b3JdID0gZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzOyB9KSwgZztcclxuICAgIGZ1bmN0aW9uIHZlcmIobikgeyByZXR1cm4gZnVuY3Rpb24gKHYpIHsgcmV0dXJuIHN0ZXAoW24sIHZdKTsgfTsgfVxyXG4gICAgZnVuY3Rpb24gc3RlcChvcCkge1xyXG4gICAgICAgIGlmIChmKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiR2VuZXJhdG9yIGlzIGFscmVhZHkgZXhlY3V0aW5nLlwiKTtcclxuICAgICAgICB3aGlsZSAoZyAmJiAoZyA9IDAsIG9wWzBdICYmIChfID0gMCkpLCBfKSB0cnkge1xyXG4gICAgICAgICAgICBpZiAoZiA9IDEsIHkgJiYgKHQgPSBvcFswXSAmIDIgPyB5W1wicmV0dXJuXCJdIDogb3BbMF0gPyB5W1widGhyb3dcIl0gfHwgKCh0ID0geVtcInJldHVyblwiXSkgJiYgdC5jYWxsKHkpLCAwKSA6IHkubmV4dCkgJiYgISh0ID0gdC5jYWxsKHksIG9wWzFdKSkuZG9uZSkgcmV0dXJuIHQ7XHJcbiAgICAgICAgICAgIGlmICh5ID0gMCwgdCkgb3AgPSBbb3BbMF0gJiAyLCB0LnZhbHVlXTtcclxuICAgICAgICAgICAgc3dpdGNoIChvcFswXSkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAwOiBjYXNlIDE6IHQgPSBvcDsgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIDQ6IF8ubGFiZWwrKzsgcmV0dXJuIHsgdmFsdWU6IG9wWzFdLCBkb25lOiBmYWxzZSB9O1xyXG4gICAgICAgICAgICAgICAgY2FzZSA1OiBfLmxhYmVsKys7IHkgPSBvcFsxXTsgb3AgPSBbMF07IGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgY2FzZSA3OiBvcCA9IF8ub3BzLnBvcCgpOyBfLnRyeXMucG9wKCk7IGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICBpZiAoISh0ID0gXy50cnlzLCB0ID0gdC5sZW5ndGggPiAwICYmIHRbdC5sZW5ndGggLSAxXSkgJiYgKG9wWzBdID09PSA2IHx8IG9wWzBdID09PSAyKSkgeyBfID0gMDsgY29udGludWU7IH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAob3BbMF0gPT09IDMgJiYgKCF0IHx8IChvcFsxXSA+IHRbMF0gJiYgb3BbMV0gPCB0WzNdKSkpIHsgXy5sYWJlbCA9IG9wWzFdOyBicmVhazsgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcFswXSA9PT0gNiAmJiBfLmxhYmVsIDwgdFsxXSkgeyBfLmxhYmVsID0gdFsxXTsgdCA9IG9wOyBicmVhazsgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0ICYmIF8ubGFiZWwgPCB0WzJdKSB7IF8ubGFiZWwgPSB0WzJdOyBfLm9wcy5wdXNoKG9wKTsgYnJlYWs7IH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAodFsyXSkgXy5vcHMucG9wKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgXy50cnlzLnBvcCgpOyBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBvcCA9IGJvZHkuY2FsbCh0aGlzQXJnLCBfKTtcclxuICAgICAgICB9IGNhdGNoIChlKSB7IG9wID0gWzYsIGVdOyB5ID0gMDsgfSBmaW5hbGx5IHsgZiA9IHQgPSAwOyB9XHJcbiAgICAgICAgaWYgKG9wWzBdICYgNSkgdGhyb3cgb3BbMV07IHJldHVybiB7IHZhbHVlOiBvcFswXSA/IG9wWzFdIDogdm9pZCAwLCBkb25lOiB0cnVlIH07XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCB2YXIgX19jcmVhdGVCaW5kaW5nID0gT2JqZWN0LmNyZWF0ZSA/IChmdW5jdGlvbihvLCBtLCBrLCBrMikge1xyXG4gICAgaWYgKGsyID09PSB1bmRlZmluZWQpIGsyID0gaztcclxuICAgIHZhciBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihtLCBrKTtcclxuICAgIGlmICghZGVzYyB8fCAoXCJnZXRcIiBpbiBkZXNjID8gIW0uX19lc01vZHVsZSA6IGRlc2Mud3JpdGFibGUgfHwgZGVzYy5jb25maWd1cmFibGUpKSB7XHJcbiAgICAgICAgZGVzYyA9IHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBmdW5jdGlvbigpIHsgcmV0dXJuIG1ba107IH0gfTtcclxuICAgIH1cclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvLCBrMiwgZGVzYyk7XHJcbn0pIDogKGZ1bmN0aW9uKG8sIG0sIGssIGsyKSB7XHJcbiAgICBpZiAoazIgPT09IHVuZGVmaW5lZCkgazIgPSBrO1xyXG4gICAgb1trMl0gPSBtW2tdO1xyXG59KTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2V4cG9ydFN0YXIobSwgbykge1xyXG4gICAgZm9yICh2YXIgcCBpbiBtKSBpZiAocCAhPT0gXCJkZWZhdWx0XCIgJiYgIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvLCBwKSkgX19jcmVhdGVCaW5kaW5nKG8sIG0sIHApO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX192YWx1ZXMobykge1xyXG4gICAgdmFyIHMgPSB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgU3ltYm9sLml0ZXJhdG9yLCBtID0gcyAmJiBvW3NdLCBpID0gMDtcclxuICAgIGlmIChtKSByZXR1cm4gbS5jYWxsKG8pO1xyXG4gICAgaWYgKG8gJiYgdHlwZW9mIG8ubGVuZ3RoID09PSBcIm51bWJlclwiKSByZXR1cm4ge1xyXG4gICAgICAgIG5leHQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKG8gJiYgaSA+PSBvLmxlbmd0aCkgbyA9IHZvaWQgMDtcclxuICAgICAgICAgICAgcmV0dXJuIHsgdmFsdWU6IG8gJiYgb1tpKytdLCBkb25lOiAhbyB9O1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKHMgPyBcIk9iamVjdCBpcyBub3QgaXRlcmFibGUuXCIgOiBcIlN5bWJvbC5pdGVyYXRvciBpcyBub3QgZGVmaW5lZC5cIik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3JlYWQobywgbikge1xyXG4gICAgdmFyIG0gPSB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgb1tTeW1ib2wuaXRlcmF0b3JdO1xyXG4gICAgaWYgKCFtKSByZXR1cm4gbztcclxuICAgIHZhciBpID0gbS5jYWxsKG8pLCByLCBhciA9IFtdLCBlO1xyXG4gICAgdHJ5IHtcclxuICAgICAgICB3aGlsZSAoKG4gPT09IHZvaWQgMCB8fCBuLS0gPiAwKSAmJiAhKHIgPSBpLm5leHQoKSkuZG9uZSkgYXIucHVzaChyLnZhbHVlKTtcclxuICAgIH1cclxuICAgIGNhdGNoIChlcnJvcikgeyBlID0geyBlcnJvcjogZXJyb3IgfTsgfVxyXG4gICAgZmluYWxseSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgaWYgKHIgJiYgIXIuZG9uZSAmJiAobSA9IGlbXCJyZXR1cm5cIl0pKSBtLmNhbGwoaSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZpbmFsbHkgeyBpZiAoZSkgdGhyb3cgZS5lcnJvcjsgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGFyO1xyXG59XHJcblxyXG4vKiogQGRlcHJlY2F0ZWQgKi9cclxuZXhwb3J0IGZ1bmN0aW9uIF9fc3ByZWFkKCkge1xyXG4gICAgZm9yICh2YXIgYXIgPSBbXSwgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspXHJcbiAgICAgICAgYXIgPSBhci5jb25jYXQoX19yZWFkKGFyZ3VtZW50c1tpXSkpO1xyXG4gICAgcmV0dXJuIGFyO1xyXG59XHJcblxyXG4vKiogQGRlcHJlY2F0ZWQgKi9cclxuZXhwb3J0IGZ1bmN0aW9uIF9fc3ByZWFkQXJyYXlzKCkge1xyXG4gICAgZm9yICh2YXIgcyA9IDAsIGkgPSAwLCBpbCA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBpbDsgaSsrKSBzICs9IGFyZ3VtZW50c1tpXS5sZW5ndGg7XHJcbiAgICBmb3IgKHZhciByID0gQXJyYXkocyksIGsgPSAwLCBpID0gMDsgaSA8IGlsOyBpKyspXHJcbiAgICAgICAgZm9yICh2YXIgYSA9IGFyZ3VtZW50c1tpXSwgaiA9IDAsIGpsID0gYS5sZW5ndGg7IGogPCBqbDsgaisrLCBrKyspXHJcbiAgICAgICAgICAgIHJba10gPSBhW2pdO1xyXG4gICAgcmV0dXJuIHI7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3NwcmVhZEFycmF5KHRvLCBmcm9tLCBwYWNrKSB7XHJcbiAgICBpZiAocGFjayB8fCBhcmd1bWVudHMubGVuZ3RoID09PSAyKSBmb3IgKHZhciBpID0gMCwgbCA9IGZyb20ubGVuZ3RoLCBhcjsgaSA8IGw7IGkrKykge1xyXG4gICAgICAgIGlmIChhciB8fCAhKGkgaW4gZnJvbSkpIHtcclxuICAgICAgICAgICAgaWYgKCFhcikgYXIgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChmcm9tLCAwLCBpKTtcclxuICAgICAgICAgICAgYXJbaV0gPSBmcm9tW2ldO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB0by5jb25jYXQoYXIgfHwgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoZnJvbSkpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19hd2FpdCh2KSB7XHJcbiAgICByZXR1cm4gdGhpcyBpbnN0YW5jZW9mIF9fYXdhaXQgPyAodGhpcy52ID0gdiwgdGhpcykgOiBuZXcgX19hd2FpdCh2KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXN5bmNHZW5lcmF0b3IodGhpc0FyZywgX2FyZ3VtZW50cywgZ2VuZXJhdG9yKSB7XHJcbiAgICBpZiAoIVN5bWJvbC5hc3luY0l0ZXJhdG9yKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3ltYm9sLmFzeW5jSXRlcmF0b3IgaXMgbm90IGRlZmluZWQuXCIpO1xyXG4gICAgdmFyIGcgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cyB8fCBbXSksIGksIHEgPSBbXTtcclxuICAgIHJldHVybiBpID0gT2JqZWN0LmNyZWF0ZSgodHlwZW9mIEFzeW5jSXRlcmF0b3IgPT09IFwiZnVuY3Rpb25cIiA/IEFzeW5jSXRlcmF0b3IgOiBPYmplY3QpLnByb3RvdHlwZSksIHZlcmIoXCJuZXh0XCIpLCB2ZXJiKFwidGhyb3dcIiksIHZlcmIoXCJyZXR1cm5cIiwgYXdhaXRSZXR1cm4pLCBpW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXM7IH0sIGk7XHJcbiAgICBmdW5jdGlvbiBhd2FpdFJldHVybihmKSB7IHJldHVybiBmdW5jdGlvbiAodikgeyByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHYpLnRoZW4oZiwgcmVqZWN0KTsgfTsgfVxyXG4gICAgZnVuY3Rpb24gdmVyYihuLCBmKSB7IGlmIChnW25dKSB7IGlbbl0gPSBmdW5jdGlvbiAodikgeyByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKGEsIGIpIHsgcS5wdXNoKFtuLCB2LCBhLCBiXSkgPiAxIHx8IHJlc3VtZShuLCB2KTsgfSk7IH07IGlmIChmKSBpW25dID0gZihpW25dKTsgfSB9XHJcbiAgICBmdW5jdGlvbiByZXN1bWUobiwgdikgeyB0cnkgeyBzdGVwKGdbbl0odikpOyB9IGNhdGNoIChlKSB7IHNldHRsZShxWzBdWzNdLCBlKTsgfSB9XHJcbiAgICBmdW5jdGlvbiBzdGVwKHIpIHsgci52YWx1ZSBpbnN0YW5jZW9mIF9fYXdhaXQgPyBQcm9taXNlLnJlc29sdmUoci52YWx1ZS52KS50aGVuKGZ1bGZpbGwsIHJlamVjdCkgOiBzZXR0bGUocVswXVsyXSwgcik7IH1cclxuICAgIGZ1bmN0aW9uIGZ1bGZpbGwodmFsdWUpIHsgcmVzdW1lKFwibmV4dFwiLCB2YWx1ZSk7IH1cclxuICAgIGZ1bmN0aW9uIHJlamVjdCh2YWx1ZSkgeyByZXN1bWUoXCJ0aHJvd1wiLCB2YWx1ZSk7IH1cclxuICAgIGZ1bmN0aW9uIHNldHRsZShmLCB2KSB7IGlmIChmKHYpLCBxLnNoaWZ0KCksIHEubGVuZ3RoKSByZXN1bWUocVswXVswXSwgcVswXVsxXSk7IH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXN5bmNEZWxlZ2F0b3Iobykge1xyXG4gICAgdmFyIGksIHA7XHJcbiAgICByZXR1cm4gaSA9IHt9LCB2ZXJiKFwibmV4dFwiKSwgdmVyYihcInRocm93XCIsIGZ1bmN0aW9uIChlKSB7IHRocm93IGU7IH0pLCB2ZXJiKFwicmV0dXJuXCIpLCBpW1N5bWJvbC5pdGVyYXRvcl0gPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzOyB9LCBpO1xyXG4gICAgZnVuY3Rpb24gdmVyYihuLCBmKSB7IGlbbl0gPSBvW25dID8gZnVuY3Rpb24gKHYpIHsgcmV0dXJuIChwID0gIXApID8geyB2YWx1ZTogX19hd2FpdChvW25dKHYpKSwgZG9uZTogZmFsc2UgfSA6IGYgPyBmKHYpIDogdjsgfSA6IGY7IH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXN5bmNWYWx1ZXMobykge1xyXG4gICAgaWYgKCFTeW1ib2wuYXN5bmNJdGVyYXRvcikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN5bWJvbC5hc3luY0l0ZXJhdG9yIGlzIG5vdCBkZWZpbmVkLlwiKTtcclxuICAgIHZhciBtID0gb1tTeW1ib2wuYXN5bmNJdGVyYXRvcl0sIGk7XHJcbiAgICByZXR1cm4gbSA/IG0uY2FsbChvKSA6IChvID0gdHlwZW9mIF9fdmFsdWVzID09PSBcImZ1bmN0aW9uXCIgPyBfX3ZhbHVlcyhvKSA6IG9bU3ltYm9sLml0ZXJhdG9yXSgpLCBpID0ge30sIHZlcmIoXCJuZXh0XCIpLCB2ZXJiKFwidGhyb3dcIiksIHZlcmIoXCJyZXR1cm5cIiksIGlbU3ltYm9sLmFzeW5jSXRlcmF0b3JdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSwgaSk7XHJcbiAgICBmdW5jdGlvbiB2ZXJiKG4pIHsgaVtuXSA9IG9bbl0gJiYgZnVuY3Rpb24gKHYpIHsgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHsgdiA9IG9bbl0odiksIHNldHRsZShyZXNvbHZlLCByZWplY3QsIHYuZG9uZSwgdi52YWx1ZSk7IH0pOyB9OyB9XHJcbiAgICBmdW5jdGlvbiBzZXR0bGUocmVzb2x2ZSwgcmVqZWN0LCBkLCB2KSB7IFByb21pc2UucmVzb2x2ZSh2KS50aGVuKGZ1bmN0aW9uKHYpIHsgcmVzb2x2ZSh7IHZhbHVlOiB2LCBkb25lOiBkIH0pOyB9LCByZWplY3QpOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX21ha2VUZW1wbGF0ZU9iamVjdChjb29rZWQsIHJhdykge1xyXG4gICAgaWYgKE9iamVjdC5kZWZpbmVQcm9wZXJ0eSkgeyBPYmplY3QuZGVmaW5lUHJvcGVydHkoY29va2VkLCBcInJhd1wiLCB7IHZhbHVlOiByYXcgfSk7IH0gZWxzZSB7IGNvb2tlZC5yYXcgPSByYXc7IH1cclxuICAgIHJldHVybiBjb29rZWQ7XHJcbn07XHJcblxyXG52YXIgX19zZXRNb2R1bGVEZWZhdWx0ID0gT2JqZWN0LmNyZWF0ZSA/IChmdW5jdGlvbihvLCB2KSB7XHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkobywgXCJkZWZhdWx0XCIsIHsgZW51bWVyYWJsZTogdHJ1ZSwgdmFsdWU6IHYgfSk7XHJcbn0pIDogZnVuY3Rpb24obywgdikge1xyXG4gICAgb1tcImRlZmF1bHRcIl0gPSB2O1xyXG59O1xyXG5cclxudmFyIG93bktleXMgPSBmdW5jdGlvbihvKSB7XHJcbiAgICBvd25LZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMgfHwgZnVuY3Rpb24gKG8pIHtcclxuICAgICAgICB2YXIgYXIgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBrIGluIG8pIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobywgaykpIGFyW2FyLmxlbmd0aF0gPSBrO1xyXG4gICAgICAgIHJldHVybiBhcjtcclxuICAgIH07XHJcbiAgICByZXR1cm4gb3duS2V5cyhvKTtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2ltcG9ydFN0YXIobW9kKSB7XHJcbiAgICBpZiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSByZXR1cm4gbW9kO1xyXG4gICAgdmFyIHJlc3VsdCA9IHt9O1xyXG4gICAgaWYgKG1vZCAhPSBudWxsKSBmb3IgKHZhciBrID0gb3duS2V5cyhtb2QpLCBpID0gMDsgaSA8IGsubGVuZ3RoOyBpKyspIGlmIChrW2ldICE9PSBcImRlZmF1bHRcIikgX19jcmVhdGVCaW5kaW5nKHJlc3VsdCwgbW9kLCBrW2ldKTtcclxuICAgIF9fc2V0TW9kdWxlRGVmYXVsdChyZXN1bHQsIG1vZCk7XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19pbXBvcnREZWZhdWx0KG1vZCkge1xyXG4gICAgcmV0dXJuIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpID8gbW9kIDogeyBkZWZhdWx0OiBtb2QgfTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fY2xhc3NQcml2YXRlRmllbGRHZXQocmVjZWl2ZXIsIHN0YXRlLCBraW5kLCBmKSB7XHJcbiAgICBpZiAoa2luZCA9PT0gXCJhXCIgJiYgIWYpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJQcml2YXRlIGFjY2Vzc29yIHdhcyBkZWZpbmVkIHdpdGhvdXQgYSBnZXR0ZXJcIik7XHJcbiAgICBpZiAodHlwZW9mIHN0YXRlID09PSBcImZ1bmN0aW9uXCIgPyByZWNlaXZlciAhPT0gc3RhdGUgfHwgIWYgOiAhc3RhdGUuaGFzKHJlY2VpdmVyKSkgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCByZWFkIHByaXZhdGUgbWVtYmVyIGZyb20gYW4gb2JqZWN0IHdob3NlIGNsYXNzIGRpZCBub3QgZGVjbGFyZSBpdFwiKTtcclxuICAgIHJldHVybiBraW5kID09PSBcIm1cIiA/IGYgOiBraW5kID09PSBcImFcIiA/IGYuY2FsbChyZWNlaXZlcikgOiBmID8gZi52YWx1ZSA6IHN0YXRlLmdldChyZWNlaXZlcik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2NsYXNzUHJpdmF0ZUZpZWxkU2V0KHJlY2VpdmVyLCBzdGF0ZSwgdmFsdWUsIGtpbmQsIGYpIHtcclxuICAgIGlmIChraW5kID09PSBcIm1cIikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlByaXZhdGUgbWV0aG9kIGlzIG5vdCB3cml0YWJsZVwiKTtcclxuICAgIGlmIChraW5kID09PSBcImFcIiAmJiAhZikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlByaXZhdGUgYWNjZXNzb3Igd2FzIGRlZmluZWQgd2l0aG91dCBhIHNldHRlclwiKTtcclxuICAgIGlmICh0eXBlb2Ygc3RhdGUgPT09IFwiZnVuY3Rpb25cIiA/IHJlY2VpdmVyICE9PSBzdGF0ZSB8fCAhZiA6ICFzdGF0ZS5oYXMocmVjZWl2ZXIpKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IHdyaXRlIHByaXZhdGUgbWVtYmVyIHRvIGFuIG9iamVjdCB3aG9zZSBjbGFzcyBkaWQgbm90IGRlY2xhcmUgaXRcIik7XHJcbiAgICByZXR1cm4gKGtpbmQgPT09IFwiYVwiID8gZi5jYWxsKHJlY2VpdmVyLCB2YWx1ZSkgOiBmID8gZi52YWx1ZSA9IHZhbHVlIDogc3RhdGUuc2V0KHJlY2VpdmVyLCB2YWx1ZSkpLCB2YWx1ZTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fY2xhc3NQcml2YXRlRmllbGRJbihzdGF0ZSwgcmVjZWl2ZXIpIHtcclxuICAgIGlmIChyZWNlaXZlciA9PT0gbnVsbCB8fCAodHlwZW9mIHJlY2VpdmVyICE9PSBcIm9iamVjdFwiICYmIHR5cGVvZiByZWNlaXZlciAhPT0gXCJmdW5jdGlvblwiKSkgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCB1c2UgJ2luJyBvcGVyYXRvciBvbiBub24tb2JqZWN0XCIpO1xyXG4gICAgcmV0dXJuIHR5cGVvZiBzdGF0ZSA9PT0gXCJmdW5jdGlvblwiID8gcmVjZWl2ZXIgPT09IHN0YXRlIDogc3RhdGUuaGFzKHJlY2VpdmVyKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYWRkRGlzcG9zYWJsZVJlc291cmNlKGVudiwgdmFsdWUsIGFzeW5jKSB7XHJcbiAgICBpZiAodmFsdWUgIT09IG51bGwgJiYgdmFsdWUgIT09IHZvaWQgMCkge1xyXG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIHZhbHVlICE9PSBcImZ1bmN0aW9uXCIpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJPYmplY3QgZXhwZWN0ZWQuXCIpO1xyXG4gICAgICAgIHZhciBkaXNwb3NlLCBpbm5lcjtcclxuICAgICAgICBpZiAoYXN5bmMpIHtcclxuICAgICAgICAgICAgaWYgKCFTeW1ib2wuYXN5bmNEaXNwb3NlKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3ltYm9sLmFzeW5jRGlzcG9zZSBpcyBub3QgZGVmaW5lZC5cIik7XHJcbiAgICAgICAgICAgIGRpc3Bvc2UgPSB2YWx1ZVtTeW1ib2wuYXN5bmNEaXNwb3NlXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGRpc3Bvc2UgPT09IHZvaWQgMCkge1xyXG4gICAgICAgICAgICBpZiAoIVN5bWJvbC5kaXNwb3NlKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3ltYm9sLmRpc3Bvc2UgaXMgbm90IGRlZmluZWQuXCIpO1xyXG4gICAgICAgICAgICBkaXNwb3NlID0gdmFsdWVbU3ltYm9sLmRpc3Bvc2VdO1xyXG4gICAgICAgICAgICBpZiAoYXN5bmMpIGlubmVyID0gZGlzcG9zZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHR5cGVvZiBkaXNwb3NlICE9PSBcImZ1bmN0aW9uXCIpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJPYmplY3Qgbm90IGRpc3Bvc2FibGUuXCIpO1xyXG4gICAgICAgIGlmIChpbm5lcikgZGlzcG9zZSA9IGZ1bmN0aW9uKCkgeyB0cnkgeyBpbm5lci5jYWxsKHRoaXMpOyB9IGNhdGNoIChlKSB7IHJldHVybiBQcm9taXNlLnJlamVjdChlKTsgfSB9O1xyXG4gICAgICAgIGVudi5zdGFjay5wdXNoKHsgdmFsdWU6IHZhbHVlLCBkaXNwb3NlOiBkaXNwb3NlLCBhc3luYzogYXN5bmMgfSk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmIChhc3luYykge1xyXG4gICAgICAgIGVudi5zdGFjay5wdXNoKHsgYXN5bmM6IHRydWUgfSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdmFsdWU7XHJcblxyXG59XHJcblxyXG52YXIgX1N1cHByZXNzZWRFcnJvciA9IHR5cGVvZiBTdXBwcmVzc2VkRXJyb3IgPT09IFwiZnVuY3Rpb25cIiA/IFN1cHByZXNzZWRFcnJvciA6IGZ1bmN0aW9uIChlcnJvciwgc3VwcHJlc3NlZCwgbWVzc2FnZSkge1xyXG4gICAgdmFyIGUgPSBuZXcgRXJyb3IobWVzc2FnZSk7XHJcbiAgICByZXR1cm4gZS5uYW1lID0gXCJTdXBwcmVzc2VkRXJyb3JcIiwgZS5lcnJvciA9IGVycm9yLCBlLnN1cHByZXNzZWQgPSBzdXBwcmVzc2VkLCBlO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fZGlzcG9zZVJlc291cmNlcyhlbnYpIHtcclxuICAgIGZ1bmN0aW9uIGZhaWwoZSkge1xyXG4gICAgICAgIGVudi5lcnJvciA9IGVudi5oYXNFcnJvciA/IG5ldyBfU3VwcHJlc3NlZEVycm9yKGUsIGVudi5lcnJvciwgXCJBbiBlcnJvciB3YXMgc3VwcHJlc3NlZCBkdXJpbmcgZGlzcG9zYWwuXCIpIDogZTtcclxuICAgICAgICBlbnYuaGFzRXJyb3IgPSB0cnVlO1xyXG4gICAgfVxyXG4gICAgdmFyIHIsIHMgPSAwO1xyXG4gICAgZnVuY3Rpb24gbmV4dCgpIHtcclxuICAgICAgICB3aGlsZSAociA9IGVudi5zdGFjay5wb3AoKSkge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFyLmFzeW5jICYmIHMgPT09IDEpIHJldHVybiBzID0gMCwgZW52LnN0YWNrLnB1c2gociksIFByb21pc2UucmVzb2x2ZSgpLnRoZW4obmV4dCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoci5kaXNwb3NlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHIuZGlzcG9zZS5jYWxsKHIudmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChyLmFzeW5jKSByZXR1cm4gcyB8PSAyLCBQcm9taXNlLnJlc29sdmUocmVzdWx0KS50aGVuKG5leHQsIGZ1bmN0aW9uKGUpIHsgZmFpbChlKTsgcmV0dXJuIG5leHQoKTsgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHMgfD0gMTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgZmFpbChlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAocyA9PT0gMSkgcmV0dXJuIGVudi5oYXNFcnJvciA/IFByb21pc2UucmVqZWN0KGVudi5lcnJvcikgOiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICBpZiAoZW52Lmhhc0Vycm9yKSB0aHJvdyBlbnYuZXJyb3I7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbmV4dCgpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19yZXdyaXRlUmVsYXRpdmVJbXBvcnRFeHRlbnNpb24ocGF0aCwgcHJlc2VydmVKc3gpIHtcclxuICAgIGlmICh0eXBlb2YgcGF0aCA9PT0gXCJzdHJpbmdcIiAmJiAvXlxcLlxcLj9cXC8vLnRlc3QocGF0aCkpIHtcclxuICAgICAgICByZXR1cm4gcGF0aC5yZXBsYWNlKC9cXC4odHN4KSR8KCg/OlxcLmQpPykoKD86XFwuW14uL10rPyk/KVxcLihbY21dPyl0cyQvaSwgZnVuY3Rpb24gKG0sIHRzeCwgZCwgZXh0LCBjbSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdHN4ID8gcHJlc2VydmVKc3ggPyBcIi5qc3hcIiA6IFwiLmpzXCIgOiBkICYmICghZXh0IHx8ICFjbSkgPyBtIDogKGQgKyBleHQgKyBcIi5cIiArIGNtLnRvTG93ZXJDYXNlKCkgKyBcImpzXCIpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHBhdGg7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IHtcclxuICAgIF9fZXh0ZW5kczogX19leHRlbmRzLFxyXG4gICAgX19hc3NpZ246IF9fYXNzaWduLFxyXG4gICAgX19yZXN0OiBfX3Jlc3QsXHJcbiAgICBfX2RlY29yYXRlOiBfX2RlY29yYXRlLFxyXG4gICAgX19wYXJhbTogX19wYXJhbSxcclxuICAgIF9fZXNEZWNvcmF0ZTogX19lc0RlY29yYXRlLFxyXG4gICAgX19ydW5Jbml0aWFsaXplcnM6IF9fcnVuSW5pdGlhbGl6ZXJzLFxyXG4gICAgX19wcm9wS2V5OiBfX3Byb3BLZXksXHJcbiAgICBfX3NldEZ1bmN0aW9uTmFtZTogX19zZXRGdW5jdGlvbk5hbWUsXHJcbiAgICBfX21ldGFkYXRhOiBfX21ldGFkYXRhLFxyXG4gICAgX19hd2FpdGVyOiBfX2F3YWl0ZXIsXHJcbiAgICBfX2dlbmVyYXRvcjogX19nZW5lcmF0b3IsXHJcbiAgICBfX2NyZWF0ZUJpbmRpbmc6IF9fY3JlYXRlQmluZGluZyxcclxuICAgIF9fZXhwb3J0U3RhcjogX19leHBvcnRTdGFyLFxyXG4gICAgX192YWx1ZXM6IF9fdmFsdWVzLFxyXG4gICAgX19yZWFkOiBfX3JlYWQsXHJcbiAgICBfX3NwcmVhZDogX19zcHJlYWQsXHJcbiAgICBfX3NwcmVhZEFycmF5czogX19zcHJlYWRBcnJheXMsXHJcbiAgICBfX3NwcmVhZEFycmF5OiBfX3NwcmVhZEFycmF5LFxyXG4gICAgX19hd2FpdDogX19hd2FpdCxcclxuICAgIF9fYXN5bmNHZW5lcmF0b3I6IF9fYXN5bmNHZW5lcmF0b3IsXHJcbiAgICBfX2FzeW5jRGVsZWdhdG9yOiBfX2FzeW5jRGVsZWdhdG9yLFxyXG4gICAgX19hc3luY1ZhbHVlczogX19hc3luY1ZhbHVlcyxcclxuICAgIF9fbWFrZVRlbXBsYXRlT2JqZWN0OiBfX21ha2VUZW1wbGF0ZU9iamVjdCxcclxuICAgIF9faW1wb3J0U3RhcjogX19pbXBvcnRTdGFyLFxyXG4gICAgX19pbXBvcnREZWZhdWx0OiBfX2ltcG9ydERlZmF1bHQsXHJcbiAgICBfX2NsYXNzUHJpdmF0ZUZpZWxkR2V0OiBfX2NsYXNzUHJpdmF0ZUZpZWxkR2V0LFxyXG4gICAgX19jbGFzc1ByaXZhdGVGaWVsZFNldDogX19jbGFzc1ByaXZhdGVGaWVsZFNldCxcclxuICAgIF9fY2xhc3NQcml2YXRlRmllbGRJbjogX19jbGFzc1ByaXZhdGVGaWVsZEluLFxyXG4gICAgX19hZGREaXNwb3NhYmxlUmVzb3VyY2U6IF9fYWRkRGlzcG9zYWJsZVJlc291cmNlLFxyXG4gICAgX19kaXNwb3NlUmVzb3VyY2VzOiBfX2Rpc3Bvc2VSZXNvdXJjZXMsXHJcbiAgICBfX3Jld3JpdGVSZWxhdGl2ZUltcG9ydEV4dGVuc2lvbjogX19yZXdyaXRlUmVsYXRpdmVJbXBvcnRFeHRlbnNpb24sXHJcbn07XHJcbiIsImltcG9ydCB7IE9wZXJhdGlvbiB9IGZyb20gXCIuL09wZXJhdGlvblwiO1xuXG5pbXBvcnQgeyBMaXN0TGluZSwgUG9zaXRpb24sIFJvb3QgfSBmcm9tIFwiLi4vcm9vdFwiO1xuXG5leHBvcnQgY2xhc3MgTW92ZUN1cnNvclRvUHJldmlvdXNVbmZvbGRlZExpbmUgaW1wbGVtZW50cyBPcGVyYXRpb24ge1xuICBwcml2YXRlIHN0b3BQcm9wYWdhdGlvbiA9IGZhbHNlO1xuICBwcml2YXRlIHVwZGF0ZWQgPSBmYWxzZTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJvb3Q6IFJvb3QpIHt9XG5cbiAgc2hvdWxkU3RvcFByb3BhZ2F0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnN0b3BQcm9wYWdhdGlvbjtcbiAgfVxuXG4gIHNob3VsZFVwZGF0ZSgpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVkO1xuICB9XG5cbiAgcGVyZm9ybSgpIHtcbiAgICBjb25zdCB7IHJvb3QgfSA9IHRoaXM7XG5cbiAgICBpZiAoIXJvb3QuaGFzU2luZ2xlQ3Vyc29yKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBsaXN0ID0gdGhpcy5yb290LmdldExpc3RVbmRlckN1cnNvcigpO1xuICAgIGNvbnN0IGN1cnNvciA9IHRoaXMucm9vdC5nZXRDdXJzb3IoKTtcbiAgICBjb25zdCBsaW5lcyA9IGxpc3QuZ2V0TGluZXNJbmZvKCk7XG4gICAgY29uc3QgbGluZU5vID0gbGluZXMuZmluZEluZGV4KChsKSA9PiB7XG4gICAgICByZXR1cm4gKFxuICAgICAgICBjdXJzb3IuY2ggPT09IGwuZnJvbS5jaCArIGxpc3QuZ2V0Q2hlY2tib3hMZW5ndGgoKSAmJlxuICAgICAgICBjdXJzb3IubGluZSA9PT0gbC5mcm9tLmxpbmVcbiAgICAgICk7XG4gICAgfSk7XG5cbiAgICBpZiAobGluZU5vID09PSAwKSB7XG4gICAgICB0aGlzLm1vdmVDdXJzb3JUb1ByZXZpb3VzVW5mb2xkZWRJdGVtKHJvb3QsIGN1cnNvcik7XG4gICAgfSBlbHNlIGlmIChsaW5lTm8gPiAwKSB7XG4gICAgICB0aGlzLm1vdmVDdXJzb3JUb1ByZXZpb3VzTm90ZUxpbmUocm9vdCwgbGluZXMsIGxpbmVObyk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBtb3ZlQ3Vyc29yVG9QcmV2aW91c05vdGVMaW5lKFxuICAgIHJvb3Q6IFJvb3QsXG4gICAgbGluZXM6IExpc3RMaW5lW10sXG4gICAgbGluZU5vOiBudW1iZXIsXG4gICkge1xuICAgIHRoaXMuc3RvcFByb3BhZ2F0aW9uID0gdHJ1ZTtcbiAgICB0aGlzLnVwZGF0ZWQgPSB0cnVlO1xuXG4gICAgcm9vdC5yZXBsYWNlQ3Vyc29yKGxpbmVzW2xpbmVObyAtIDFdLnRvKTtcbiAgfVxuXG4gIHByaXZhdGUgbW92ZUN1cnNvclRvUHJldmlvdXNVbmZvbGRlZEl0ZW0ocm9vdDogUm9vdCwgY3Vyc29yOiBQb3NpdGlvbikge1xuICAgIGNvbnN0IHByZXYgPSByb290LmdldExpc3RVbmRlckxpbmUoY3Vyc29yLmxpbmUgLSAxKTtcblxuICAgIGlmICghcHJldikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuc3RvcFByb3BhZ2F0aW9uID0gdHJ1ZTtcbiAgICB0aGlzLnVwZGF0ZWQgPSB0cnVlO1xuXG4gICAgaWYgKHByZXYuaXNGb2xkZWQoKSkge1xuICAgICAgY29uc3QgZm9sZFJvb3QgPSBwcmV2LmdldFRvcEZvbGRSb290KCk7XG4gICAgICBjb25zdCBmaXJzdExpbmVFbmQgPSBmb2xkUm9vdC5nZXRMaW5lc0luZm8oKVswXS50bztcbiAgICAgIHJvb3QucmVwbGFjZUN1cnNvcihmaXJzdExpbmVFbmQpO1xuICAgIH0gZWxzZSB7XG4gICAgICByb290LnJlcGxhY2VDdXJzb3IocHJldi5nZXRMYXN0TGluZUNvbnRlbnRFbmQoKSk7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBFZGl0b3IsIGVkaXRvckluZm9GaWVsZCB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5pbXBvcnQge1xuICBmb2xkRWZmZWN0LFxuICBmb2xkYWJsZSxcbiAgZm9sZGVkUmFuZ2VzLFxuICB1bmZvbGRFZmZlY3QsXG59IGZyb20gXCJAY29kZW1pcnJvci9sYW5ndWFnZVwiO1xuaW1wb3J0IHsgRWRpdG9yU3RhdGUgfSBmcm9tIFwiQGNvZGVtaXJyb3Ivc3RhdGVcIjtcbmltcG9ydCB7IEVkaXRvclZpZXcsIHJ1blNjb3BlSGFuZGxlcnMgfSBmcm9tIFwiQGNvZGVtaXJyb3Ivdmlld1wiO1xuXG5leHBvcnQgY2xhc3MgTXlFZGl0b3JQb3NpdGlvbiB7XG4gIGxpbmU6IG51bWJlcjtcbiAgY2g6IG51bWJlcjtcbn1cblxuZXhwb3J0IGNsYXNzIE15RWRpdG9yUmFuZ2Uge1xuICBmcm9tOiBNeUVkaXRvclBvc2l0aW9uO1xuICB0bzogTXlFZGl0b3JQb3NpdGlvbjtcbn1cblxuZXhwb3J0IGNsYXNzIE15RWRpdG9yU2VsZWN0aW9uIHtcbiAgYW5jaG9yOiBNeUVkaXRvclBvc2l0aW9uO1xuICBoZWFkOiBNeUVkaXRvclBvc2l0aW9uO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RWRpdG9yRnJvbVN0YXRlKHN0YXRlOiBFZGl0b3JTdGF0ZSkge1xuICBjb25zdCB7IGVkaXRvciB9ID0gc3RhdGUuZmllbGQoZWRpdG9ySW5mb0ZpZWxkKTtcblxuICBpZiAoIWVkaXRvcikge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIG5ldyBNeUVkaXRvcihlZGl0b3IpO1xufVxuXG5kZWNsYXJlIGdsb2JhbCB7XG4gIGludGVyZmFjZSBXaW5kb3cge1xuICAgIE9ic2lkaWFuWm9vbVBsdWdpbj86IHtcbiAgICAgIGdldFpvb21SYW5nZShlOiBFZGl0b3IpOiBNeUVkaXRvclJhbmdlO1xuICAgICAgem9vbU91dChlOiBFZGl0b3IpOiB2b2lkO1xuICAgICAgem9vbUluKGU6IEVkaXRvciwgbGluZTogbnVtYmVyKTogdm9pZDtcbiAgICAgIHJlZnJlc2hab29tPyhlOiBFZGl0b3IpOiB2b2lkO1xuICAgIH07XG4gIH1cbn1cblxuZnVuY3Rpb24gZm9sZEluc2lkZSh2aWV3OiBFZGl0b3JWaWV3LCBmcm9tOiBudW1iZXIsIHRvOiBudW1iZXIpIHtcbiAgbGV0IGZvdW5kOiB7IGZyb206IG51bWJlcjsgdG86IG51bWJlciB9IHwgbnVsbCA9IG51bGw7XG4gIGZvbGRlZFJhbmdlcyh2aWV3LnN0YXRlKS5iZXR3ZWVuKGZyb20sIHRvLCAoZnJvbSwgdG8pID0+IHtcbiAgICBpZiAoIWZvdW5kIHx8IGZvdW5kLmZyb20gPiBmcm9tKSBmb3VuZCA9IHsgZnJvbSwgdG8gfTtcbiAgfSk7XG4gIHJldHVybiBmb3VuZDtcbn1cblxuZXhwb3J0IGNsYXNzIE15RWRpdG9yIHtcbiAgcHJpdmF0ZSB2aWV3OiBFZGl0b3JWaWV3O1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgZTogRWRpdG9yKSB7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgICB0aGlzLnZpZXcgPSAodGhpcy5lIGFzIGFueSkuY207XG4gIH1cblxuICBnZXRDdXJzb3IoKTogTXlFZGl0b3JQb3NpdGlvbiB7XG4gICAgcmV0dXJuIHRoaXMuZS5nZXRDdXJzb3IoKTtcbiAgfVxuXG4gIGdldExpbmUobjogbnVtYmVyKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5lLmdldExpbmUobik7XG4gIH1cblxuICBsYXN0TGluZSgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLmUubGFzdExpbmUoKTtcbiAgfVxuXG4gIGxpc3RTZWxlY3Rpb25zKCk6IE15RWRpdG9yU2VsZWN0aW9uW10ge1xuICAgIHJldHVybiB0aGlzLmUubGlzdFNlbGVjdGlvbnMoKTtcbiAgfVxuXG4gIGdldFJhbmdlKGZyb206IE15RWRpdG9yUG9zaXRpb24sIHRvOiBNeUVkaXRvclBvc2l0aW9uKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5lLmdldFJhbmdlKGZyb20sIHRvKTtcbiAgfVxuXG4gIHJlcGxhY2VSYW5nZShcbiAgICByZXBsYWNlbWVudDogc3RyaW5nLFxuICAgIGZyb206IE15RWRpdG9yUG9zaXRpb24sXG4gICAgdG86IE15RWRpdG9yUG9zaXRpb24sXG4gICk6IHZvaWQge1xuICAgIHJldHVybiB0aGlzLmUucmVwbGFjZVJhbmdlKHJlcGxhY2VtZW50LCBmcm9tLCB0byk7XG4gIH1cblxuICBzZXRTZWxlY3Rpb25zKHNlbGVjdGlvbnM6IE15RWRpdG9yU2VsZWN0aW9uW10pOiB2b2lkIHtcbiAgICB0aGlzLmUuc2V0U2VsZWN0aW9ucyhzZWxlY3Rpb25zKTtcbiAgfVxuXG4gIHNldFZhbHVlKHRleHQ6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMuZS5zZXRWYWx1ZSh0ZXh0KTtcbiAgfVxuXG4gIGdldFZhbHVlKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuZS5nZXRWYWx1ZSgpO1xuICB9XG5cbiAgb2Zmc2V0VG9Qb3Mob2Zmc2V0OiBudW1iZXIpOiBNeUVkaXRvclBvc2l0aW9uIHtcbiAgICByZXR1cm4gdGhpcy5lLm9mZnNldFRvUG9zKG9mZnNldCk7XG4gIH1cblxuICBwb3NUb09mZnNldChwb3M6IE15RWRpdG9yUG9zaXRpb24pOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLmUucG9zVG9PZmZzZXQocG9zKTtcbiAgfVxuXG4gIGZvbGQobjogbnVtYmVyKTogdm9pZCB7XG4gICAgY29uc3QgeyB2aWV3IH0gPSB0aGlzO1xuICAgIGNvbnN0IGwgPSB2aWV3LmxpbmVCbG9ja0F0KHZpZXcuc3RhdGUuZG9jLmxpbmUobiArIDEpLmZyb20pO1xuICAgIGNvbnN0IHJhbmdlID0gZm9sZGFibGUodmlldy5zdGF0ZSwgbC5mcm9tLCBsLnRvKTtcblxuICAgIGlmICghcmFuZ2UgfHwgcmFuZ2UuZnJvbSA9PT0gcmFuZ2UudG8pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2aWV3LmRpc3BhdGNoKHsgZWZmZWN0czogW2ZvbGRFZmZlY3Qub2YocmFuZ2UpXSB9KTtcbiAgfVxuXG4gIHVuZm9sZChuOiBudW1iZXIpOiB2b2lkIHtcbiAgICBjb25zdCB7IHZpZXcgfSA9IHRoaXM7XG4gICAgY29uc3QgbCA9IHZpZXcubGluZUJsb2NrQXQodmlldy5zdGF0ZS5kb2MubGluZShuICsgMSkuZnJvbSk7XG4gICAgY29uc3QgcmFuZ2UgPSBmb2xkSW5zaWRlKHZpZXcsIGwuZnJvbSwgbC50byk7XG5cbiAgICBpZiAoIXJhbmdlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmlldy5kaXNwYXRjaCh7IGVmZmVjdHM6IFt1bmZvbGRFZmZlY3Qub2YocmFuZ2UpXSB9KTtcbiAgfVxuXG4gIGdldEFsbEZvbGRlZExpbmVzKCk6IG51bWJlcltdIHtcbiAgICBjb25zdCBjID0gZm9sZGVkUmFuZ2VzKHRoaXMudmlldy5zdGF0ZSkuaXRlcigpO1xuICAgIGNvbnN0IHJlczogbnVtYmVyW10gPSBbXTtcbiAgICB3aGlsZSAoYy52YWx1ZSkge1xuICAgICAgcmVzLnB1c2godGhpcy5vZmZzZXRUb1BvcyhjLmZyb20pLmxpbmUpO1xuICAgICAgYy5uZXh0KCk7XG4gICAgfVxuICAgIHJldHVybiByZXM7XG4gIH1cblxuICB0cmlnZ2VyT25LZXlEb3duKGU6IEtleWJvYXJkRXZlbnQpOiB2b2lkIHtcbiAgICBydW5TY29wZUhhbmRsZXJzKHRoaXMudmlldywgZSwgXCJlZGl0b3JcIik7XG4gIH1cblxuICBnZXRab29tUmFuZ2UoKTogTXlFZGl0b3JSYW5nZSB8IG51bGwge1xuICAgIGlmICghd2luZG93Lk9ic2lkaWFuWm9vbVBsdWdpbikge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIHdpbmRvdy5PYnNpZGlhblpvb21QbHVnaW4uZ2V0Wm9vbVJhbmdlKHRoaXMuZSk7XG4gIH1cblxuICB6b29tT3V0KCkge1xuICAgIGlmICghd2luZG93Lk9ic2lkaWFuWm9vbVBsdWdpbikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHdpbmRvdy5PYnNpZGlhblpvb21QbHVnaW4uem9vbU91dCh0aGlzLmUpO1xuICB9XG5cbiAgem9vbUluKGxpbmU6IG51bWJlcikge1xuICAgIGlmICghd2luZG93Lk9ic2lkaWFuWm9vbVBsdWdpbikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHdpbmRvdy5PYnNpZGlhblpvb21QbHVnaW4uem9vbUluKHRoaXMuZSwgbGluZSk7XG4gIH1cblxuICB0cnlSZWZyZXNoWm9vbShsaW5lOiBudW1iZXIpIHtcbiAgICBpZiAoIXdpbmRvdy5PYnNpZGlhblpvb21QbHVnaW4pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAod2luZG93Lk9ic2lkaWFuWm9vbVBsdWdpbi5yZWZyZXNoWm9vbSkge1xuICAgICAgd2luZG93Lk9ic2lkaWFuWm9vbVBsdWdpbi5yZWZyZXNoWm9vbSh0aGlzLmUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB3aW5kb3cuT2JzaWRpYW5ab29tUGx1Z2luLnpvb21Jbih0aGlzLmUsIGxpbmUpO1xuICAgIH1cbiAgfVxufVxuIiwiaW1wb3J0IHsgRWRpdG9yVmlldyB9IGZyb20gXCJAY29kZW1pcnJvci92aWV3XCI7XG5cbmltcG9ydCB7IE15RWRpdG9yLCBnZXRFZGl0b3JGcm9tU3RhdGUgfSBmcm9tIFwiLi4vZWRpdG9yXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVLZXltYXBSdW5DYWxsYmFjayhjb25maWc6IHtcbiAgY2hlY2s/OiAoZWRpdG9yOiBNeUVkaXRvcikgPT4gYm9vbGVhbjtcbiAgcnVuOiAoZWRpdG9yOiBNeUVkaXRvcikgPT4ge1xuICAgIHNob3VsZFVwZGF0ZTogYm9vbGVhbjtcbiAgICBzaG91bGRTdG9wUHJvcGFnYXRpb246IGJvb2xlYW47XG4gIH07XG59KSB7XG4gIGNvbnN0IGNoZWNrID0gY29uZmlnLmNoZWNrIHx8ICgoKSA9PiB0cnVlKTtcbiAgY29uc3QgeyBydW4gfSA9IGNvbmZpZztcblxuICByZXR1cm4gKHZpZXc6IEVkaXRvclZpZXcpOiBib29sZWFuID0+IHtcbiAgICBjb25zdCBlZGl0b3IgPSBnZXRFZGl0b3JGcm9tU3RhdGUodmlldy5zdGF0ZSk7XG5cbiAgICBpZiAoIWNoZWNrKGVkaXRvcikpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zdCB7IHNob3VsZFVwZGF0ZSwgc2hvdWxkU3RvcFByb3BhZ2F0aW9uIH0gPSBydW4oZWRpdG9yKTtcblxuICAgIHJldHVybiBzaG91bGRVcGRhdGUgfHwgc2hvdWxkU3RvcFByb3BhZ2F0aW9uO1xuICB9O1xufVxuIiwiaW1wb3J0IHsgUGx1Z2luIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmltcG9ydCB7IGtleW1hcCB9IGZyb20gXCJAY29kZW1pcnJvci92aWV3XCI7XG5cbmltcG9ydCB7IEZlYXR1cmUgfSBmcm9tIFwiLi9GZWF0dXJlXCI7XG5cbmltcG9ydCB7IE15RWRpdG9yIH0gZnJvbSBcIi4uL2VkaXRvclwiO1xuaW1wb3J0IHsgTW92ZUN1cnNvclRvUHJldmlvdXNVbmZvbGRlZExpbmUgfSBmcm9tIFwiLi4vb3BlcmF0aW9ucy9Nb3ZlQ3Vyc29yVG9QcmV2aW91c1VuZm9sZGVkTGluZVwiO1xuaW1wb3J0IHsgSU1FRGV0ZWN0b3IgfSBmcm9tIFwiLi4vc2VydmljZXMvSU1FRGV0ZWN0b3JcIjtcbmltcG9ydCB7IE9wZXJhdGlvblBlcmZvcm1lciB9IGZyb20gXCIuLi9zZXJ2aWNlcy9PcGVyYXRpb25QZXJmb3JtZXJcIjtcbmltcG9ydCB7IFNldHRpbmdzIH0gZnJvbSBcIi4uL3NlcnZpY2VzL1NldHRpbmdzXCI7XG5pbXBvcnQgeyBjcmVhdGVLZXltYXBSdW5DYWxsYmFjayB9IGZyb20gXCIuLi91dGlscy9jcmVhdGVLZXltYXBSdW5DYWxsYmFja1wiO1xuXG5leHBvcnQgY2xhc3MgQXJyb3dMZWZ0QW5kQ3RybEFycm93TGVmdEJlaGF2aW91ck92ZXJyaWRlIGltcGxlbWVudHMgRmVhdHVyZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcGx1Z2luOiBQbHVnaW4sXG4gICAgcHJpdmF0ZSBzZXR0aW5nczogU2V0dGluZ3MsXG4gICAgcHJpdmF0ZSBpbWVEZXRlY3RvcjogSU1FRGV0ZWN0b3IsXG4gICAgcHJpdmF0ZSBvcGVyYXRpb25QZXJmb3JtZXI6IE9wZXJhdGlvblBlcmZvcm1lcixcbiAgKSB7fVxuXG4gIGFzeW5jIGxvYWQoKSB7XG4gICAgdGhpcy5wbHVnaW4ucmVnaXN0ZXJFZGl0b3JFeHRlbnNpb24oXG4gICAgICBrZXltYXAub2YoW1xuICAgICAgICB7XG4gICAgICAgICAga2V5OiBcIkFycm93TGVmdFwiLFxuICAgICAgICAgIHJ1bjogY3JlYXRlS2V5bWFwUnVuQ2FsbGJhY2soe1xuICAgICAgICAgICAgY2hlY2s6IHRoaXMuY2hlY2ssXG4gICAgICAgICAgICBydW46IHRoaXMucnVuLFxuICAgICAgICAgIH0pLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgd2luOiBcImMtQXJyb3dMZWZ0XCIsXG4gICAgICAgICAgbGludXg6IFwiYy1BcnJvd0xlZnRcIixcbiAgICAgICAgICBydW46IGNyZWF0ZUtleW1hcFJ1bkNhbGxiYWNrKHtcbiAgICAgICAgICAgIGNoZWNrOiB0aGlzLmNoZWNrLFxuICAgICAgICAgICAgcnVuOiB0aGlzLnJ1bixcbiAgICAgICAgICB9KSxcbiAgICAgICAgfSxcbiAgICAgIF0pLFxuICAgICk7XG4gIH1cblxuICBhc3luYyB1bmxvYWQoKSB7fVxuXG4gIHByaXZhdGUgY2hlY2sgPSAoKSA9PiB7XG4gICAgcmV0dXJuIChcbiAgICAgIHRoaXMuc2V0dGluZ3Mua2VlcEN1cnNvcldpdGhpbkNvbnRlbnQgIT09IFwibmV2ZXJcIiAmJlxuICAgICAgIXRoaXMuaW1lRGV0ZWN0b3IuaXNPcGVuZWQoKVxuICAgICk7XG4gIH07XG5cbiAgcHJpdmF0ZSBydW4gPSAoZWRpdG9yOiBNeUVkaXRvcikgPT4ge1xuICAgIHJldHVybiB0aGlzLm9wZXJhdGlvblBlcmZvcm1lci5wZXJmb3JtKFxuICAgICAgKHJvb3QpID0+IG5ldyBNb3ZlQ3Vyc29yVG9QcmV2aW91c1VuZm9sZGVkTGluZShyb290KSxcbiAgICAgIGVkaXRvcixcbiAgICApO1xuICB9O1xufVxuIiwiZXhwb3J0IGZ1bmN0aW9uIGNtcFBvcyhhOiBQb3NpdGlvbiwgYjogUG9zaXRpb24pIHtcbiAgcmV0dXJuIGEubGluZSAtIGIubGluZSB8fCBhLmNoIC0gYi5jaDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1heFBvcyhhOiBQb3NpdGlvbiwgYjogUG9zaXRpb24pIHtcbiAgcmV0dXJuIGNtcFBvcyhhLCBiKSA8IDAgPyBiIDogYTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1pblBvcyhhOiBQb3NpdGlvbiwgYjogUG9zaXRpb24pIHtcbiAgcmV0dXJuIGNtcFBvcyhhLCBiKSA8IDAgPyBhIDogYjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzUmFuZ2VzSW50ZXJzZWN0cyhcbiAgYTogW1Bvc2l0aW9uLCBQb3NpdGlvbl0sXG4gIGI6IFtQb3NpdGlvbiwgUG9zaXRpb25dLFxuKSB7XG4gIHJldHVybiBjbXBQb3MoYVsxXSwgYlswXSkgPj0gMCAmJiBjbXBQb3MoYVswXSwgYlsxXSkgPD0gMDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlY2FsY3VsYXRlTnVtZXJpY0J1bGxldHMocm9vdDogUm9vdCkge1xuICBmdW5jdGlvbiB2aXNpdChwYXJlbnQ6IFJvb3QgfCBMaXN0KSB7XG4gICAgbGV0IGluZGV4ID0gMTtcblxuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgcGFyZW50LmdldENoaWxkcmVuKCkpIHtcbiAgICAgIGlmICgvXFxkK1xcLi8udGVzdChjaGlsZC5nZXRCdWxsZXQoKSkpIHtcbiAgICAgICAgY2hpbGQucmVwbGF0ZUJ1bGxldChgJHtpbmRleCsrfS5gKTtcbiAgICAgIH1cblxuICAgICAgdmlzaXQoY2hpbGQpO1xuICAgIH1cbiAgfVxuXG4gIHZpc2l0KHJvb3QpO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFBvc2l0aW9uIHtcbiAgY2g6IG51bWJlcjtcbiAgbGluZTogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIExpc3RMaW5lIHtcbiAgdGV4dDogc3RyaW5nO1xuICBmcm9tOiBQb3NpdGlvbjtcbiAgdG86IFBvc2l0aW9uO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJhbmdlIHtcbiAgYW5jaG9yOiBQb3NpdGlvbjtcbiAgaGVhZDogUG9zaXRpb247XG59XG5cbmxldCBpZFNlcSA9IDA7XG5cbmV4cG9ydCBjbGFzcyBMaXN0IHtcbiAgcHJpdmF0ZSBpZDogbnVtYmVyO1xuICBwcml2YXRlIHBhcmVudDogTGlzdCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGNoaWxkcmVuOiBMaXN0W10gPSBbXTtcbiAgcHJpdmF0ZSBub3Rlc0luZGVudDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgbGluZXM6IHN0cmluZ1tdID0gW107XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByb290OiBSb290LFxuICAgIHByaXZhdGUgaW5kZW50OiBzdHJpbmcsXG4gICAgcHJpdmF0ZSBidWxsZXQ6IHN0cmluZyxcbiAgICBwcml2YXRlIG9wdGlvbmFsQ2hlY2tib3g6IHN0cmluZyxcbiAgICBwcml2YXRlIHNwYWNlQWZ0ZXJCdWxsZXQ6IHN0cmluZyxcbiAgICBmaXJzdExpbmU6IHN0cmluZyxcbiAgICBwcml2YXRlIGZvbGRSb290OiBib29sZWFuLFxuICApIHtcbiAgICB0aGlzLmlkID0gaWRTZXErKztcbiAgICB0aGlzLmxpbmVzLnB1c2goZmlyc3RMaW5lKTtcbiAgfVxuXG4gIGdldElEKCkge1xuICAgIHJldHVybiB0aGlzLmlkO1xuICB9XG5cbiAgZ2V0Tm90ZXNJbmRlbnQoKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgcmV0dXJuIHRoaXMubm90ZXNJbmRlbnQ7XG4gIH1cblxuICBzZXROb3Rlc0luZGVudChub3Rlc0luZGVudDogc3RyaW5nKSB7XG4gICAgaWYgKHRoaXMubm90ZXNJbmRlbnQgIT09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgTm90ZXMgaW5kZW50IGFscmVhZHkgcHJvdmlkZWRgKTtcbiAgICB9XG4gICAgdGhpcy5ub3Rlc0luZGVudCA9IG5vdGVzSW5kZW50O1xuICB9XG5cbiAgYWRkTGluZSh0ZXh0OiBzdHJpbmcpIHtcbiAgICBpZiAodGhpcy5ub3Rlc0luZGVudCA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgVW5hYmxlIHRvIGFkZCBsaW5lLCBub3RlcyBpbmRlbnQgc2hvdWxkIGJlIHByb3ZpZGVkIGZpcnN0YCxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgdGhpcy5saW5lcy5wdXNoKHRleHQpO1xuICB9XG5cbiAgcmVwbGFjZUxpbmVzKGxpbmVzOiBzdHJpbmdbXSkge1xuICAgIGlmIChsaW5lcy5sZW5ndGggPiAxICYmIHRoaXMubm90ZXNJbmRlbnQgPT09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYFVuYWJsZSB0byBhZGQgbGluZSwgbm90ZXMgaW5kZW50IHNob3VsZCBiZSBwcm92aWRlZCBmaXJzdGAsXG4gICAgICApO1xuICAgIH1cblxuICAgIHRoaXMubGluZXMgPSBsaW5lcztcbiAgfVxuXG4gIGdldExpbmVDb3VudCgpIHtcbiAgICByZXR1cm4gdGhpcy5saW5lcy5sZW5ndGg7XG4gIH1cblxuICBnZXRSb290KCkge1xuICAgIHJldHVybiB0aGlzLnJvb3Q7XG4gIH1cblxuICBnZXRDaGlsZHJlbigpIHtcbiAgICByZXR1cm4gdGhpcy5jaGlsZHJlbi5jb25jYXQoKTtcbiAgfVxuXG4gIGdldExpbmVzSW5mbygpOiBMaXN0TGluZVtdIHtcbiAgICBjb25zdCBzdGFydExpbmUgPSB0aGlzLnJvb3QuZ2V0Q29udGVudExpbmVzUmFuZ2VPZih0aGlzKVswXTtcblxuICAgIHJldHVybiB0aGlzLmxpbmVzLm1hcCgocm93LCBpKSA9PiB7XG4gICAgICBjb25zdCBsaW5lID0gc3RhcnRMaW5lICsgaTtcbiAgICAgIGNvbnN0IHN0YXJ0Q2ggPVxuICAgICAgICBpID09PSAwID8gdGhpcy5nZXRDb250ZW50U3RhcnRDaCgpIDogdGhpcy5ub3Rlc0luZGVudC5sZW5ndGg7XG4gICAgICBjb25zdCBlbmRDaCA9IHN0YXJ0Q2ggKyByb3cubGVuZ3RoO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICB0ZXh0OiByb3csXG4gICAgICAgIGZyb206IHsgbGluZSwgY2g6IHN0YXJ0Q2ggfSxcbiAgICAgICAgdG86IHsgbGluZSwgY2g6IGVuZENoIH0sXG4gICAgICB9O1xuICAgIH0pO1xuICB9XG5cbiAgZ2V0TGluZXMoKTogc3RyaW5nW10ge1xuICAgIHJldHVybiB0aGlzLmxpbmVzLmNvbmNhdCgpO1xuICB9XG5cbiAgZ2V0Rmlyc3RMaW5lQ29udGVudFN0YXJ0KCkge1xuICAgIGNvbnN0IHN0YXJ0TGluZSA9IHRoaXMucm9vdC5nZXRDb250ZW50TGluZXNSYW5nZU9mKHRoaXMpWzBdO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGxpbmU6IHN0YXJ0TGluZSxcbiAgICAgIGNoOiB0aGlzLmdldENvbnRlbnRTdGFydENoKCksXG4gICAgfTtcbiAgfVxuXG4gIGdldEZpcnN0TGluZUNvbnRlbnRTdGFydEFmdGVyQ2hlY2tib3goKSB7XG4gICAgY29uc3Qgc3RhcnRMaW5lID0gdGhpcy5yb290LmdldENvbnRlbnRMaW5lc1JhbmdlT2YodGhpcylbMF07XG5cbiAgICByZXR1cm4ge1xuICAgICAgbGluZTogc3RhcnRMaW5lLFxuICAgICAgY2g6IHRoaXMuZ2V0Q29udGVudFN0YXJ0Q2goKSArIHRoaXMuZ2V0Q2hlY2tib3hMZW5ndGgoKSxcbiAgICB9O1xuICB9XG5cbiAgZ2V0TGFzdExpbmVDb250ZW50RW5kKCkge1xuICAgIGNvbnN0IGVuZExpbmUgPSB0aGlzLnJvb3QuZ2V0Q29udGVudExpbmVzUmFuZ2VPZih0aGlzKVsxXTtcbiAgICBjb25zdCBlbmRDaCA9XG4gICAgICB0aGlzLmxpbmVzLmxlbmd0aCA9PT0gMVxuICAgICAgICA/IHRoaXMuZ2V0Q29udGVudFN0YXJ0Q2goKSArIHRoaXMubGluZXNbMF0ubGVuZ3RoXG4gICAgICAgIDogdGhpcy5ub3Rlc0luZGVudC5sZW5ndGggKyB0aGlzLmxpbmVzW3RoaXMubGluZXMubGVuZ3RoIC0gMV0ubGVuZ3RoO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGxpbmU6IGVuZExpbmUsXG4gICAgICBjaDogZW5kQ2gsXG4gICAgfTtcbiAgfVxuXG4gIGdldENvbnRlbnRFbmRJbmNsdWRpbmdDaGlsZHJlbigpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRMYXN0Q2hpbGQoKS5nZXRMYXN0TGluZUNvbnRlbnRFbmQoKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0TGFzdENoaWxkKCkge1xuICAgIGxldCBsYXN0Q2hpbGQ6IExpc3QgPSB0aGlzO1xuXG4gICAgd2hpbGUgKCFsYXN0Q2hpbGQuaXNFbXB0eSgpKSB7XG4gICAgICBsYXN0Q2hpbGQgPSBsYXN0Q2hpbGQuZ2V0Q2hpbGRyZW4oKS5sYXN0KCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGxhc3RDaGlsZDtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0Q29udGVudFN0YXJ0Q2goKSB7XG4gICAgcmV0dXJuIHRoaXMuaW5kZW50Lmxlbmd0aCArIHRoaXMuYnVsbGV0Lmxlbmd0aCArIDE7XG4gIH1cblxuICBpc0ZvbGRlZCgpOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5mb2xkUm9vdCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMucGFyZW50KSB7XG4gICAgICByZXR1cm4gdGhpcy5wYXJlbnQuaXNGb2xkZWQoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpc0ZvbGRSb290KCkge1xuICAgIHJldHVybiB0aGlzLmZvbGRSb290O1xuICB9XG5cbiAgZ2V0VG9wRm9sZFJvb3QoKSB7XG4gICAgbGV0IHRtcDogTGlzdCA9IHRoaXM7XG4gICAgbGV0IGZvbGRSb290OiBMaXN0IHwgbnVsbCA9IG51bGw7XG4gICAgd2hpbGUgKHRtcCkge1xuICAgICAgaWYgKHRtcC5pc0ZvbGRSb290KCkpIHtcbiAgICAgICAgZm9sZFJvb3QgPSB0bXA7XG4gICAgICB9XG4gICAgICB0bXAgPSB0bXAucGFyZW50O1xuICAgIH1cbiAgICByZXR1cm4gZm9sZFJvb3Q7XG4gIH1cblxuICBnZXRMZXZlbCgpOiBudW1iZXIge1xuICAgIGlmICghdGhpcy5wYXJlbnQpIHtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnBhcmVudC5nZXRMZXZlbCgpICsgMTtcbiAgfVxuXG4gIHVuaW5kZW50Q29udGVudChmcm9tOiBudW1iZXIsIHRpbGw6IG51bWJlcikge1xuICAgIHRoaXMuaW5kZW50ID0gdGhpcy5pbmRlbnQuc2xpY2UoMCwgZnJvbSkgKyB0aGlzLmluZGVudC5zbGljZSh0aWxsKTtcbiAgICBpZiAodGhpcy5ub3Rlc0luZGVudCAhPT0gbnVsbCkge1xuICAgICAgdGhpcy5ub3Rlc0luZGVudCA9XG4gICAgICAgIHRoaXMubm90ZXNJbmRlbnQuc2xpY2UoMCwgZnJvbSkgKyB0aGlzLm5vdGVzSW5kZW50LnNsaWNlKHRpbGwpO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgdGhpcy5jaGlsZHJlbikge1xuICAgICAgY2hpbGQudW5pbmRlbnRDb250ZW50KGZyb20sIHRpbGwpO1xuICAgIH1cbiAgfVxuXG4gIGluZGVudENvbnRlbnQoaW5kZW50UG9zOiBudW1iZXIsIGluZGVudENoYXJzOiBzdHJpbmcpIHtcbiAgICB0aGlzLmluZGVudCA9XG4gICAgICB0aGlzLmluZGVudC5zbGljZSgwLCBpbmRlbnRQb3MpICtcbiAgICAgIGluZGVudENoYXJzICtcbiAgICAgIHRoaXMuaW5kZW50LnNsaWNlKGluZGVudFBvcyk7XG4gICAgaWYgKHRoaXMubm90ZXNJbmRlbnQgIT09IG51bGwpIHtcbiAgICAgIHRoaXMubm90ZXNJbmRlbnQgPVxuICAgICAgICB0aGlzLm5vdGVzSW5kZW50LnNsaWNlKDAsIGluZGVudFBvcykgK1xuICAgICAgICBpbmRlbnRDaGFycyArXG4gICAgICAgIHRoaXMubm90ZXNJbmRlbnQuc2xpY2UoaW5kZW50UG9zKTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIHRoaXMuY2hpbGRyZW4pIHtcbiAgICAgIGNoaWxkLmluZGVudENvbnRlbnQoaW5kZW50UG9zLCBpbmRlbnRDaGFycyk7XG4gICAgfVxuICB9XG5cbiAgZ2V0Rmlyc3RMaW5lSW5kZW50KCkge1xuICAgIHJldHVybiB0aGlzLmluZGVudDtcbiAgfVxuXG4gIGdldEJ1bGxldCgpIHtcbiAgICByZXR1cm4gdGhpcy5idWxsZXQ7XG4gIH1cblxuICBnZXRTcGFjZUFmdGVyQnVsbGV0KCkge1xuICAgIHJldHVybiB0aGlzLnNwYWNlQWZ0ZXJCdWxsZXQ7XG4gIH1cblxuICBnZXRDaGVja2JveExlbmd0aCgpIHtcbiAgICByZXR1cm4gdGhpcy5vcHRpb25hbENoZWNrYm94Lmxlbmd0aDtcbiAgfVxuXG4gIHJlcGxhdGVCdWxsZXQoYnVsbGV0OiBzdHJpbmcpIHtcbiAgICB0aGlzLmJ1bGxldCA9IGJ1bGxldDtcbiAgfVxuXG4gIGdldFBhcmVudCgpIHtcbiAgICByZXR1cm4gdGhpcy5wYXJlbnQ7XG4gIH1cblxuICBhZGRCZWZvcmVBbGwobGlzdDogTGlzdCkge1xuICAgIHRoaXMuY2hpbGRyZW4udW5zaGlmdChsaXN0KTtcbiAgICBsaXN0LnBhcmVudCA9IHRoaXM7XG4gIH1cblxuICBhZGRBZnRlckFsbChsaXN0OiBMaXN0KSB7XG4gICAgdGhpcy5jaGlsZHJlbi5wdXNoKGxpc3QpO1xuICAgIGxpc3QucGFyZW50ID0gdGhpcztcbiAgfVxuXG4gIHJlbW92ZUNoaWxkKGxpc3Q6IExpc3QpIHtcbiAgICBjb25zdCBpID0gdGhpcy5jaGlsZHJlbi5pbmRleE9mKGxpc3QpO1xuICAgIHRoaXMuY2hpbGRyZW4uc3BsaWNlKGksIDEpO1xuICAgIGxpc3QucGFyZW50ID0gbnVsbDtcbiAgfVxuXG4gIGFkZEJlZm9yZShiZWZvcmU6IExpc3QsIGxpc3Q6IExpc3QpIHtcbiAgICBjb25zdCBpID0gdGhpcy5jaGlsZHJlbi5pbmRleE9mKGJlZm9yZSk7XG4gICAgdGhpcy5jaGlsZHJlbi5zcGxpY2UoaSwgMCwgbGlzdCk7XG4gICAgbGlzdC5wYXJlbnQgPSB0aGlzO1xuICB9XG5cbiAgYWRkQWZ0ZXIoYmVmb3JlOiBMaXN0LCBsaXN0OiBMaXN0KSB7XG4gICAgY29uc3QgaSA9IHRoaXMuY2hpbGRyZW4uaW5kZXhPZihiZWZvcmUpO1xuICAgIHRoaXMuY2hpbGRyZW4uc3BsaWNlKGkgKyAxLCAwLCBsaXN0KTtcbiAgICBsaXN0LnBhcmVudCA9IHRoaXM7XG4gIH1cblxuICBnZXRQcmV2U2libGluZ09mKGxpc3Q6IExpc3QpIHtcbiAgICBjb25zdCBpID0gdGhpcy5jaGlsZHJlbi5pbmRleE9mKGxpc3QpO1xuICAgIHJldHVybiBpID4gMCA/IHRoaXMuY2hpbGRyZW5baSAtIDFdIDogbnVsbDtcbiAgfVxuXG4gIGdldE5leHRTaWJsaW5nT2YobGlzdDogTGlzdCkge1xuICAgIGNvbnN0IGkgPSB0aGlzLmNoaWxkcmVuLmluZGV4T2YobGlzdCk7XG4gICAgcmV0dXJuIGkgPj0gMCAmJiBpIDwgdGhpcy5jaGlsZHJlbi5sZW5ndGggPyB0aGlzLmNoaWxkcmVuW2kgKyAxXSA6IG51bGw7XG4gIH1cblxuICBpc0VtcHR5KCkge1xuICAgIHJldHVybiB0aGlzLmNoaWxkcmVuLmxlbmd0aCA9PT0gMDtcbiAgfVxuXG4gIHByaW50KCkge1xuICAgIGxldCByZXMgPSBcIlwiO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmxpbmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICByZXMgKz1cbiAgICAgICAgaSA9PT0gMFxuICAgICAgICAgID8gdGhpcy5pbmRlbnQgKyB0aGlzLmJ1bGxldCArIHRoaXMuc3BhY2VBZnRlckJ1bGxldFxuICAgICAgICAgIDogdGhpcy5ub3Rlc0luZGVudDtcbiAgICAgIHJlcyArPSB0aGlzLmxpbmVzW2ldO1xuICAgICAgcmVzICs9IFwiXFxuXCI7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiB0aGlzLmNoaWxkcmVuKSB7XG4gICAgICByZXMgKz0gY2hpbGQucHJpbnQoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzO1xuICB9XG5cbiAgY2xvbmUobmV3Um9vdDogUm9vdCkge1xuICAgIGNvbnN0IGNsb25lID0gbmV3IExpc3QoXG4gICAgICBuZXdSb290LFxuICAgICAgdGhpcy5pbmRlbnQsXG4gICAgICB0aGlzLmJ1bGxldCxcbiAgICAgIHRoaXMub3B0aW9uYWxDaGVja2JveCxcbiAgICAgIHRoaXMuc3BhY2VBZnRlckJ1bGxldCxcbiAgICAgIFwiXCIsXG4gICAgICB0aGlzLmZvbGRSb290LFxuICAgICk7XG4gICAgY2xvbmUuaWQgPSB0aGlzLmlkO1xuICAgIGNsb25lLmxpbmVzID0gdGhpcy5saW5lcy5jb25jYXQoKTtcbiAgICBjbG9uZS5ub3Rlc0luZGVudCA9IHRoaXMubm90ZXNJbmRlbnQ7XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiB0aGlzLmNoaWxkcmVuKSB7XG4gICAgICBjbG9uZS5hZGRBZnRlckFsbChjaGlsZC5jbG9uZShuZXdSb290KSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNsb25lO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBSb290IHtcbiAgcHJpdmF0ZSByb290TGlzdCA9IG5ldyBMaXN0KHRoaXMsIFwiXCIsIFwiXCIsIFwiXCIsIFwiXCIsIFwiXCIsIGZhbHNlKTtcbiAgcHJpdmF0ZSBzZWxlY3Rpb25zOiBSYW5nZVtdID0gW107XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBzdGFydDogUG9zaXRpb24sXG4gICAgcHJpdmF0ZSBlbmQ6IFBvc2l0aW9uLFxuICAgIHNlbGVjdGlvbnM6IFJhbmdlW10sXG4gICkge1xuICAgIHRoaXMucmVwbGFjZVNlbGVjdGlvbnMoc2VsZWN0aW9ucyk7XG4gIH1cblxuICBnZXRSb290TGlzdCgpIHtcbiAgICByZXR1cm4gdGhpcy5yb290TGlzdDtcbiAgfVxuXG4gIGdldENvbnRlbnRSYW5nZSgpOiBbUG9zaXRpb24sIFBvc2l0aW9uXSB7XG4gICAgcmV0dXJuIFt0aGlzLmdldENvbnRlbnRTdGFydCgpLCB0aGlzLmdldENvbnRlbnRFbmQoKV07XG4gIH1cblxuICBnZXRDb250ZW50U3RhcnQoKTogUG9zaXRpb24ge1xuICAgIHJldHVybiB7IC4uLnRoaXMuc3RhcnQgfTtcbiAgfVxuXG4gIGdldENvbnRlbnRFbmQoKTogUG9zaXRpb24ge1xuICAgIHJldHVybiB7IC4uLnRoaXMuZW5kIH07XG4gIH1cblxuICBnZXRTZWxlY3Rpb25zKCk6IFJhbmdlW10ge1xuICAgIHJldHVybiB0aGlzLnNlbGVjdGlvbnMubWFwKChzKSA9PiAoe1xuICAgICAgYW5jaG9yOiB7IC4uLnMuYW5jaG9yIH0sXG4gICAgICBoZWFkOiB7IC4uLnMuaGVhZCB9LFxuICAgIH0pKTtcbiAgfVxuXG4gIGhhc1NpbmdsZUN1cnNvcigpIHtcbiAgICBpZiAoIXRoaXMuaGFzU2luZ2xlU2VsZWN0aW9uKCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zdCBzZWxlY3Rpb24gPSB0aGlzLnNlbGVjdGlvbnNbMF07XG5cbiAgICByZXR1cm4gKFxuICAgICAgc2VsZWN0aW9uLmFuY2hvci5saW5lID09PSBzZWxlY3Rpb24uaGVhZC5saW5lICYmXG4gICAgICBzZWxlY3Rpb24uYW5jaG9yLmNoID09PSBzZWxlY3Rpb24uaGVhZC5jaFxuICAgICk7XG4gIH1cblxuICBoYXNTaW5nbGVTZWxlY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuc2VsZWN0aW9ucy5sZW5ndGggPT09IDE7XG4gIH1cblxuICBnZXRTZWxlY3Rpb24oKSB7XG4gICAgY29uc3Qgc2VsZWN0aW9uID0gdGhpcy5zZWxlY3Rpb25zW3RoaXMuc2VsZWN0aW9ucy5sZW5ndGggLSAxXTtcblxuICAgIGNvbnN0IGZyb20gPVxuICAgICAgc2VsZWN0aW9uLmFuY2hvci5jaCA+IHNlbGVjdGlvbi5oZWFkLmNoXG4gICAgICAgID8gc2VsZWN0aW9uLmhlYWQuY2hcbiAgICAgICAgOiBzZWxlY3Rpb24uYW5jaG9yLmNoO1xuICAgIGNvbnN0IHRvID1cbiAgICAgIHNlbGVjdGlvbi5hbmNob3IuY2ggPiBzZWxlY3Rpb24uaGVhZC5jaFxuICAgICAgICA/IHNlbGVjdGlvbi5hbmNob3IuY2hcbiAgICAgICAgOiBzZWxlY3Rpb24uaGVhZC5jaDtcblxuICAgIHJldHVybiB7XG4gICAgICAuLi5zZWxlY3Rpb24sXG4gICAgICBmcm9tLFxuICAgICAgdG8sXG4gICAgfTtcbiAgfVxuXG4gIGdldEN1cnNvcigpIHtcbiAgICByZXR1cm4geyAuLi50aGlzLnNlbGVjdGlvbnNbdGhpcy5zZWxlY3Rpb25zLmxlbmd0aCAtIDFdLmhlYWQgfTtcbiAgfVxuXG4gIHJlcGxhY2VDdXJzb3IoY3Vyc29yOiBQb3NpdGlvbikge1xuICAgIHRoaXMuc2VsZWN0aW9ucyA9IFt7IGFuY2hvcjogY3Vyc29yLCBoZWFkOiBjdXJzb3IgfV07XG4gIH1cblxuICByZXBsYWNlU2VsZWN0aW9ucyhzZWxlY3Rpb25zOiBSYW5nZVtdKSB7XG4gICAgaWYgKHNlbGVjdGlvbnMubGVuZ3RoIDwgMSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmFibGUgdG8gY3JlYXRlIFJvb3Qgd2l0aG91dCBzZWxlY3Rpb25zYCk7XG4gICAgfVxuICAgIHRoaXMuc2VsZWN0aW9ucyA9IHNlbGVjdGlvbnM7XG4gIH1cblxuICBnZXRMaXN0VW5kZXJDdXJzb3IoKTogTGlzdCB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0TGlzdFVuZGVyTGluZSh0aGlzLmdldEN1cnNvcigpLmxpbmUpO1xuICB9XG5cbiAgZ2V0TGlzdFVuZGVyTGluZShsaW5lOiBudW1iZXIpIHtcbiAgICBpZiAobGluZSA8IHRoaXMuc3RhcnQubGluZSB8fCBsaW5lID4gdGhpcy5lbmQubGluZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCByZXN1bHQ6IExpc3QgPSBudWxsO1xuICAgIGxldCBpbmRleDogbnVtYmVyID0gdGhpcy5zdGFydC5saW5lO1xuXG4gICAgY29uc3QgdmlzaXRBcnIgPSAobGw6IExpc3RbXSkgPT4ge1xuICAgICAgZm9yIChjb25zdCBsIG9mIGxsKSB7XG4gICAgICAgIGNvbnN0IGxpc3RGcm9tTGluZSA9IGluZGV4O1xuICAgICAgICBjb25zdCBsaXN0VGlsbExpbmUgPSBsaXN0RnJvbUxpbmUgKyBsLmdldExpbmVDb3VudCgpIC0gMTtcblxuICAgICAgICBpZiAobGluZSA+PSBsaXN0RnJvbUxpbmUgJiYgbGluZSA8PSBsaXN0VGlsbExpbmUpIHtcbiAgICAgICAgICByZXN1bHQgPSBsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGluZGV4ID0gbGlzdFRpbGxMaW5lICsgMTtcbiAgICAgICAgICB2aXNpdEFycihsLmdldENoaWxkcmVuKCkpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZXN1bHQgIT09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuXG4gICAgdmlzaXRBcnIodGhpcy5yb290TGlzdC5nZXRDaGlsZHJlbigpKTtcblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBnZXRDb250ZW50TGluZXNSYW5nZU9mKGxpc3Q6IExpc3QpOiBbbnVtYmVyLCBudW1iZXJdIHwgbnVsbCB7XG4gICAgbGV0IHJlc3VsdDogW251bWJlciwgbnVtYmVyXSB8IG51bGwgPSBudWxsO1xuICAgIGxldCBsaW5lOiBudW1iZXIgPSB0aGlzLnN0YXJ0LmxpbmU7XG5cbiAgICBjb25zdCB2aXNpdEFyciA9IChsbDogTGlzdFtdKSA9PiB7XG4gICAgICBmb3IgKGNvbnN0IGwgb2YgbGwpIHtcbiAgICAgICAgY29uc3QgbGlzdEZyb21MaW5lID0gbGluZTtcbiAgICAgICAgY29uc3QgbGlzdFRpbGxMaW5lID0gbGlzdEZyb21MaW5lICsgbC5nZXRMaW5lQ291bnQoKSAtIDE7XG5cbiAgICAgICAgaWYgKGwgPT09IGxpc3QpIHtcbiAgICAgICAgICByZXN1bHQgPSBbbGlzdEZyb21MaW5lLCBsaXN0VGlsbExpbmVdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxpbmUgPSBsaXN0VGlsbExpbmUgKyAxO1xuICAgICAgICAgIHZpc2l0QXJyKGwuZ2V0Q2hpbGRyZW4oKSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocmVzdWx0ICE9PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcblxuICAgIHZpc2l0QXJyKHRoaXMucm9vdExpc3QuZ2V0Q2hpbGRyZW4oKSk7XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgZ2V0Q2hpbGRyZW4oKSB7XG4gICAgcmV0dXJuIHRoaXMucm9vdExpc3QuZ2V0Q2hpbGRyZW4oKTtcbiAgfVxuXG4gIHByaW50KCkge1xuICAgIGxldCByZXMgPSBcIlwiO1xuXG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiB0aGlzLnJvb3RMaXN0LmdldENoaWxkcmVuKCkpIHtcbiAgICAgIHJlcyArPSBjaGlsZC5wcmludCgpO1xuICAgIH1cblxuICAgIHJldHVybiByZXMucmVwbGFjZSgvXFxuJC8sIFwiXCIpO1xuICB9XG5cbiAgY2xvbmUoKSB7XG4gICAgY29uc3QgY2xvbmUgPSBuZXcgUm9vdChcbiAgICAgIHsgLi4udGhpcy5zdGFydCB9LFxuICAgICAgeyAuLi50aGlzLmVuZCB9LFxuICAgICAgdGhpcy5nZXRTZWxlY3Rpb25zKCksXG4gICAgKTtcbiAgICBjbG9uZS5yb290TGlzdCA9IHRoaXMucm9vdExpc3QuY2xvbmUoY2xvbmUpO1xuICAgIHJldHVybiBjbG9uZTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgT3BlcmF0aW9uIH0gZnJvbSBcIi4vT3BlcmF0aW9uXCI7XG5cbmltcG9ydCB7XG4gIExpc3QsXG4gIExpc3RMaW5lLFxuICBQb3NpdGlvbixcbiAgUm9vdCxcbiAgcmVjYWxjdWxhdGVOdW1lcmljQnVsbGV0cyxcbn0gZnJvbSBcIi4uL3Jvb3RcIjtcblxuZXhwb3J0IGNsYXNzIERlbGV0ZVRpbGxQcmV2aW91c0xpbmVDb250ZW50RW5kIGltcGxlbWVudHMgT3BlcmF0aW9uIHtcbiAgcHJpdmF0ZSBzdG9wUHJvcGFnYXRpb24gPSBmYWxzZTtcbiAgcHJpdmF0ZSB1cGRhdGVkID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSByb290OiBSb290KSB7fVxuXG4gIHNob3VsZFN0b3BQcm9wYWdhdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5zdG9wUHJvcGFnYXRpb247XG4gIH1cblxuICBzaG91bGRVcGRhdGUoKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlZDtcbiAgfVxuXG4gIHBlcmZvcm0oKSB7XG4gICAgY29uc3QgeyByb290IH0gPSB0aGlzO1xuXG4gICAgaWYgKCFyb290Lmhhc1NpbmdsZUN1cnNvcigpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgbGlzdCA9IHJvb3QuZ2V0TGlzdFVuZGVyQ3Vyc29yKCk7XG4gICAgY29uc3QgY3Vyc29yID0gcm9vdC5nZXRDdXJzb3IoKTtcbiAgICBjb25zdCBsaW5lcyA9IGxpc3QuZ2V0TGluZXNJbmZvKCk7XG5cbiAgICBjb25zdCBsaW5lTm8gPSBsaW5lcy5maW5kSW5kZXgoXG4gICAgICAobCkgPT4gY3Vyc29yLmNoID09PSBsLmZyb20uY2ggJiYgY3Vyc29yLmxpbmUgPT09IGwuZnJvbS5saW5lLFxuICAgICk7XG5cbiAgICBpZiAobGluZU5vID09PSAwKSB7XG4gICAgICB0aGlzLm1lcmdlV2l0aFByZXZpb3VzSXRlbShyb290LCBjdXJzb3IsIGxpc3QpO1xuICAgIH0gZWxzZSBpZiAobGluZU5vID4gMCkge1xuICAgICAgdGhpcy5tZXJnZU5vdGVzKHJvb3QsIGN1cnNvciwgbGlzdCwgbGluZXMsIGxpbmVObyk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBtZXJnZU5vdGVzKFxuICAgIHJvb3Q6IFJvb3QsXG4gICAgY3Vyc29yOiBQb3NpdGlvbixcbiAgICBsaXN0OiBMaXN0LFxuICAgIGxpbmVzOiBMaXN0TGluZVtdLFxuICAgIGxpbmVObzogbnVtYmVyLFxuICApIHtcbiAgICB0aGlzLnN0b3BQcm9wYWdhdGlvbiA9IHRydWU7XG4gICAgdGhpcy51cGRhdGVkID0gdHJ1ZTtcblxuICAgIGNvbnN0IHByZXZMaW5lTm8gPSBsaW5lTm8gLSAxO1xuXG4gICAgcm9vdC5yZXBsYWNlQ3Vyc29yKHtcbiAgICAgIGxpbmU6IGN1cnNvci5saW5lIC0gMSxcbiAgICAgIGNoOiBsaW5lc1twcmV2TGluZU5vXS50ZXh0Lmxlbmd0aCArIGxpbmVzW3ByZXZMaW5lTm9dLmZyb20uY2gsXG4gICAgfSk7XG5cbiAgICBsaW5lc1twcmV2TGluZU5vXS50ZXh0ICs9IGxpbmVzW2xpbmVOb10udGV4dDtcbiAgICBsaW5lcy5zcGxpY2UobGluZU5vLCAxKTtcblxuICAgIGxpc3QucmVwbGFjZUxpbmVzKGxpbmVzLm1hcCgobCkgPT4gbC50ZXh0KSk7XG4gIH1cblxuICBwcml2YXRlIG1lcmdlV2l0aFByZXZpb3VzSXRlbShyb290OiBSb290LCBjdXJzb3I6IFBvc2l0aW9uLCBsaXN0OiBMaXN0KSB7XG4gICAgaWYgKHJvb3QuZ2V0Q2hpbGRyZW4oKVswXSA9PT0gbGlzdCAmJiBsaXN0LmlzRW1wdHkoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuc3RvcFByb3BhZ2F0aW9uID0gdHJ1ZTtcblxuICAgIGNvbnN0IHByZXYgPSByb290LmdldExpc3RVbmRlckxpbmUoY3Vyc29yLmxpbmUgLSAxKTtcblxuICAgIGlmICghcHJldikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGJvdGhBcmVFbXB0eSA9IHByZXYuaXNFbXB0eSgpICYmIGxpc3QuaXNFbXB0eSgpO1xuICAgIGNvbnN0IHByZXZJc0VtcHR5QW5kU2FtZUxldmVsID1cbiAgICAgIHByZXYuaXNFbXB0eSgpICYmICFsaXN0LmlzRW1wdHkoKSAmJiBwcmV2LmdldExldmVsKCkgPT09IGxpc3QuZ2V0TGV2ZWwoKTtcbiAgICBjb25zdCBsaXN0SXNFbXB0eUFuZFByZXZJc1BhcmVudCA9XG4gICAgICBsaXN0LmlzRW1wdHkoKSAmJiBwcmV2LmdldExldmVsKCkgPT09IGxpc3QuZ2V0TGV2ZWwoKSAtIDE7XG5cbiAgICBpZiAoYm90aEFyZUVtcHR5IHx8IHByZXZJc0VtcHR5QW5kU2FtZUxldmVsIHx8IGxpc3RJc0VtcHR5QW5kUHJldklzUGFyZW50KSB7XG4gICAgICB0aGlzLnVwZGF0ZWQgPSB0cnVlO1xuXG4gICAgICBjb25zdCBwYXJlbnQgPSBsaXN0LmdldFBhcmVudCgpO1xuICAgICAgY29uc3QgcHJldkVuZCA9IHByZXYuZ2V0TGFzdExpbmVDb250ZW50RW5kKCk7XG5cbiAgICAgIGlmICghcHJldi5nZXROb3Rlc0luZGVudCgpICYmIGxpc3QuZ2V0Tm90ZXNJbmRlbnQoKSkge1xuICAgICAgICBwcmV2LnNldE5vdGVzSW5kZW50KFxuICAgICAgICAgIHByZXYuZ2V0Rmlyc3RMaW5lSW5kZW50KCkgK1xuICAgICAgICAgICAgbGlzdC5nZXROb3Rlc0luZGVudCgpLnNsaWNlKGxpc3QuZ2V0Rmlyc3RMaW5lSW5kZW50KCkubGVuZ3RoKSxcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgb2xkTGluZXMgPSBwcmV2LmdldExpbmVzKCk7XG4gICAgICBjb25zdCBuZXdMaW5lcyA9IGxpc3QuZ2V0TGluZXMoKTtcbiAgICAgIG9sZExpbmVzW29sZExpbmVzLmxlbmd0aCAtIDFdICs9IG5ld0xpbmVzWzBdO1xuICAgICAgY29uc3QgcmVzdWx0TGluZXMgPSBvbGRMaW5lcy5jb25jYXQobmV3TGluZXMuc2xpY2UoMSkpO1xuXG4gICAgICBwcmV2LnJlcGxhY2VMaW5lcyhyZXN1bHRMaW5lcyk7XG4gICAgICBwYXJlbnQucmVtb3ZlQ2hpbGQobGlzdCk7XG5cbiAgICAgIGZvciAoY29uc3QgYyBvZiBsaXN0LmdldENoaWxkcmVuKCkpIHtcbiAgICAgICAgbGlzdC5yZW1vdmVDaGlsZChjKTtcbiAgICAgICAgcHJldi5hZGRBZnRlckFsbChjKTtcbiAgICAgIH1cblxuICAgICAgcm9vdC5yZXBsYWNlQ3Vyc29yKHByZXZFbmQpO1xuXG4gICAgICByZWNhbGN1bGF0ZU51bWVyaWNCdWxsZXRzKHJvb3QpO1xuICAgIH1cbiAgfVxufVxuIiwiaW1wb3J0IHsgUGx1Z2luIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmltcG9ydCB7IGtleW1hcCB9IGZyb20gXCJAY29kZW1pcnJvci92aWV3XCI7XG5cbmltcG9ydCB7IEZlYXR1cmUgfSBmcm9tIFwiLi9GZWF0dXJlXCI7XG5cbmltcG9ydCB7IE15RWRpdG9yIH0gZnJvbSBcIi4uL2VkaXRvclwiO1xuaW1wb3J0IHsgRGVsZXRlVGlsbFByZXZpb3VzTGluZUNvbnRlbnRFbmQgfSBmcm9tIFwiLi4vb3BlcmF0aW9ucy9EZWxldGVUaWxsUHJldmlvdXNMaW5lQ29udGVudEVuZFwiO1xuaW1wb3J0IHsgSU1FRGV0ZWN0b3IgfSBmcm9tIFwiLi4vc2VydmljZXMvSU1FRGV0ZWN0b3JcIjtcbmltcG9ydCB7IE9wZXJhdGlvblBlcmZvcm1lciB9IGZyb20gXCIuLi9zZXJ2aWNlcy9PcGVyYXRpb25QZXJmb3JtZXJcIjtcbmltcG9ydCB7IFNldHRpbmdzIH0gZnJvbSBcIi4uL3NlcnZpY2VzL1NldHRpbmdzXCI7XG5pbXBvcnQgeyBjcmVhdGVLZXltYXBSdW5DYWxsYmFjayB9IGZyb20gXCIuLi91dGlscy9jcmVhdGVLZXltYXBSdW5DYWxsYmFja1wiO1xuXG5leHBvcnQgY2xhc3MgQmFja3NwYWNlQmVoYXZpb3VyT3ZlcnJpZGUgaW1wbGVtZW50cyBGZWF0dXJlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBwbHVnaW46IFBsdWdpbixcbiAgICBwcml2YXRlIHNldHRpbmdzOiBTZXR0aW5ncyxcbiAgICBwcml2YXRlIGltZURldGVjdG9yOiBJTUVEZXRlY3RvcixcbiAgICBwcml2YXRlIG9wZXJhdGlvblBlcmZvcm1lcjogT3BlcmF0aW9uUGVyZm9ybWVyLFxuICApIHt9XG5cbiAgYXN5bmMgbG9hZCgpIHtcbiAgICB0aGlzLnBsdWdpbi5yZWdpc3RlckVkaXRvckV4dGVuc2lvbihcbiAgICAgIGtleW1hcC5vZihbXG4gICAgICAgIHtcbiAgICAgICAgICBrZXk6IFwiQmFja3NwYWNlXCIsXG4gICAgICAgICAgcnVuOiBjcmVhdGVLZXltYXBSdW5DYWxsYmFjayh7XG4gICAgICAgICAgICBjaGVjazogdGhpcy5jaGVjayxcbiAgICAgICAgICAgIHJ1bjogdGhpcy5ydW4sXG4gICAgICAgICAgfSksXG4gICAgICAgIH0sXG4gICAgICBdKSxcbiAgICApO1xuICB9XG5cbiAgYXN5bmMgdW5sb2FkKCkge31cblxuICBwcml2YXRlIGNoZWNrID0gKCkgPT4ge1xuICAgIHJldHVybiAoXG4gICAgICB0aGlzLnNldHRpbmdzLmtlZXBDdXJzb3JXaXRoaW5Db250ZW50ICE9PSBcIm5ldmVyXCIgJiZcbiAgICAgICF0aGlzLmltZURldGVjdG9yLmlzT3BlbmVkKClcbiAgICApO1xuICB9O1xuXG4gIHByaXZhdGUgcnVuID0gKGVkaXRvcjogTXlFZGl0b3IpID0+IHtcbiAgICByZXR1cm4gdGhpcy5vcGVyYXRpb25QZXJmb3JtZXIucGVyZm9ybShcbiAgICAgIChyb290KSA9PiBuZXcgRGVsZXRlVGlsbFByZXZpb3VzTGluZUNvbnRlbnRFbmQocm9vdCksXG4gICAgICBlZGl0b3IsXG4gICAgKTtcbiAgfTtcbn1cbiIsImltcG9ydCB7IEZlYXR1cmUgfSBmcm9tIFwiLi9GZWF0dXJlXCI7XG5cbmltcG9ydCB7IE9ic2lkaWFuU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2VydmljZXMvT2JzaWRpYW5TZXR0aW5nc1wiO1xuaW1wb3J0IHsgU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2VydmljZXMvU2V0dGluZ3NcIjtcblxuY29uc3QgQkVUVEVSX0xJU1RTX0JPRFlfQ0xBU1MgPSBcIm91dGxpbmVyLXBsdWdpbi1iZXR0ZXItbGlzdHNcIjtcblxuZXhwb3J0IGNsYXNzIEJldHRlckxpc3RzU3R5bGVzIGltcGxlbWVudHMgRmVhdHVyZSB7XG4gIHByaXZhdGUgdXBkYXRlQm9keUNsYXNzSW50ZXJ2YWw6IG51bWJlcjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHNldHRpbmdzOiBTZXR0aW5ncyxcbiAgICBwcml2YXRlIG9ic2lkaWFuU2V0dGluZ3M6IE9ic2lkaWFuU2V0dGluZ3MsXG4gICkge31cblxuICBhc3luYyBsb2FkKCkge1xuICAgIHRoaXMudXBkYXRlQm9keUNsYXNzKCk7XG4gICAgdGhpcy51cGRhdGVCb2R5Q2xhc3NJbnRlcnZhbCA9IHdpbmRvdy5zZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICB0aGlzLnVwZGF0ZUJvZHlDbGFzcygpO1xuICAgIH0sIDEwMDApO1xuICB9XG5cbiAgYXN5bmMgdW5sb2FkKCkge1xuICAgIGNsZWFySW50ZXJ2YWwodGhpcy51cGRhdGVCb2R5Q2xhc3NJbnRlcnZhbCk7XG4gICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKEJFVFRFUl9MSVNUU19CT0RZX0NMQVNTKTtcbiAgfVxuXG4gIHByaXZhdGUgdXBkYXRlQm9keUNsYXNzID0gKCkgPT4ge1xuICAgIGNvbnN0IHNob3VsZEV4aXN0cyA9XG4gICAgICB0aGlzLm9ic2lkaWFuU2V0dGluZ3MuaXNEZWZhdWx0VGhlbWVFbmFibGVkKCkgJiZcbiAgICAgIHRoaXMuc2V0dGluZ3MuYmV0dGVyTGlzdHNTdHlsZXM7XG4gICAgY29uc3QgZXhpc3RzID0gZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuY29udGFpbnMoQkVUVEVSX0xJU1RTX0JPRFlfQ0xBU1MpO1xuXG4gICAgaWYgKHNob3VsZEV4aXN0cyAmJiAhZXhpc3RzKSB7XG4gICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoQkVUVEVSX0xJU1RTX0JPRFlfQ0xBU1MpO1xuICAgIH1cblxuICAgIGlmICghc2hvdWxkRXhpc3RzICYmIGV4aXN0cykge1xuICAgICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKEJFVFRFUl9MSVNUU19CT0RZX0NMQVNTKTtcbiAgICB9XG4gIH07XG59XG4iLCJpbXBvcnQgeyBPcGVyYXRpb24gfSBmcm9tIFwiLi9PcGVyYXRpb25cIjtcblxuaW1wb3J0IHsgUm9vdCwgbWF4UG9zLCBtaW5Qb3MgfSBmcm9tIFwiLi4vcm9vdFwiO1xuXG5leHBvcnQgY2xhc3MgU2VsZWN0QWxsQ29udGVudCBpbXBsZW1lbnRzIE9wZXJhdGlvbiB7XG4gIHByaXZhdGUgc3RvcFByb3BhZ2F0aW9uID0gZmFsc2U7XG4gIHByaXZhdGUgdXBkYXRlZCA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcm9vdDogUm9vdCkge31cblxuICBzaG91bGRTdG9wUHJvcGFnYXRpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuc3RvcFByb3BhZ2F0aW9uO1xuICB9XG5cbiAgc2hvdWxkVXBkYXRlKCkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZWQ7XG4gIH1cblxuICBwZXJmb3JtKCkge1xuICAgIGNvbnN0IHsgcm9vdCB9ID0gdGhpcztcblxuICAgIGlmICghcm9vdC5oYXNTaW5nbGVTZWxlY3Rpb24oKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHNlbGVjdGlvbiA9IHJvb3QuZ2V0U2VsZWN0aW9ucygpWzBdO1xuICAgIGNvbnN0IFtyb290U3RhcnQsIHJvb3RFbmRdID0gcm9vdC5nZXRDb250ZW50UmFuZ2UoKTtcblxuICAgIGNvbnN0IHNlbGVjdGlvbkZyb20gPSBtaW5Qb3Moc2VsZWN0aW9uLmFuY2hvciwgc2VsZWN0aW9uLmhlYWQpO1xuICAgIGNvbnN0IHNlbGVjdGlvblRvID0gbWF4UG9zKHNlbGVjdGlvbi5hbmNob3IsIHNlbGVjdGlvbi5oZWFkKTtcblxuICAgIGlmIChcbiAgICAgIHNlbGVjdGlvbkZyb20ubGluZSA8IHJvb3RTdGFydC5saW5lIHx8XG4gICAgICBzZWxlY3Rpb25Uby5saW5lID4gcm9vdEVuZC5saW5lXG4gICAgKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgc2VsZWN0aW9uRnJvbS5saW5lID09PSByb290U3RhcnQubGluZSAmJlxuICAgICAgc2VsZWN0aW9uRnJvbS5jaCA9PT0gcm9vdFN0YXJ0LmNoICYmXG4gICAgICBzZWxlY3Rpb25Uby5saW5lID09PSByb290RW5kLmxpbmUgJiZcbiAgICAgIHNlbGVjdGlvblRvLmNoID09PSByb290RW5kLmNoXG4gICAgKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3QgbGlzdCA9IHJvb3QuZ2V0TGlzdFVuZGVyQ3Vyc29yKCk7XG4gICAgY29uc3QgY29udGVudFN0YXJ0ID0gbGlzdC5nZXRGaXJzdExpbmVDb250ZW50U3RhcnRBZnRlckNoZWNrYm94KCk7XG4gICAgY29uc3QgY29udGVudEVuZCA9IGxpc3QuZ2V0TGFzdExpbmVDb250ZW50RW5kKCk7XG4gICAgY29uc3QgbGlzdFVuZGVyU2VsZWN0aW9uRnJvbSA9IHJvb3QuZ2V0TGlzdFVuZGVyTGluZShzZWxlY3Rpb25Gcm9tLmxpbmUpO1xuICAgIGNvbnN0IGxpc3RTdGFydCA9XG4gICAgICBsaXN0VW5kZXJTZWxlY3Rpb25Gcm9tLmdldEZpcnN0TGluZUNvbnRlbnRTdGFydEFmdGVyQ2hlY2tib3goKTtcbiAgICBjb25zdCBsaXN0RW5kID0gbGlzdFVuZGVyU2VsZWN0aW9uRnJvbS5nZXRDb250ZW50RW5kSW5jbHVkaW5nQ2hpbGRyZW4oKTtcblxuICAgIHRoaXMuc3RvcFByb3BhZ2F0aW9uID0gdHJ1ZTtcbiAgICB0aGlzLnVwZGF0ZWQgPSB0cnVlO1xuXG4gICAgaWYgKFxuICAgICAgc2VsZWN0aW9uRnJvbS5saW5lID09PSBjb250ZW50U3RhcnQubGluZSAmJlxuICAgICAgc2VsZWN0aW9uRnJvbS5jaCA9PT0gY29udGVudFN0YXJ0LmNoICYmXG4gICAgICBzZWxlY3Rpb25Uby5saW5lID09PSBjb250ZW50RW5kLmxpbmUgJiZcbiAgICAgIHNlbGVjdGlvblRvLmNoID09PSBjb250ZW50RW5kLmNoXG4gICAgKSB7XG4gICAgICBpZiAobGlzdC5nZXRDaGlsZHJlbigpLmxlbmd0aCkge1xuICAgICAgICAvLyBzZWxlY3Qgc3ViIGxpc3RzXG4gICAgICAgIHJvb3QucmVwbGFjZVNlbGVjdGlvbnMoW1xuICAgICAgICAgIHsgYW5jaG9yOiBjb250ZW50U3RhcnQsIGhlYWQ6IGxpc3QuZ2V0Q29udGVudEVuZEluY2x1ZGluZ0NoaWxkcmVuKCkgfSxcbiAgICAgICAgXSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBzZWxlY3Qgd2hvbGUgbGlzdFxuICAgICAgICByb290LnJlcGxhY2VTZWxlY3Rpb25zKFt7IGFuY2hvcjogcm9vdFN0YXJ0LCBoZWFkOiByb290RW5kIH1dKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKFxuICAgICAgbGlzdFN0YXJ0LmNoID09IHNlbGVjdGlvbkZyb20uY2ggJiZcbiAgICAgIGxpc3RFbmQubGluZSA9PSBzZWxlY3Rpb25Uby5saW5lICYmXG4gICAgICBsaXN0RW5kLmNoID09IHNlbGVjdGlvblRvLmNoXG4gICAgKSB7XG4gICAgICAvLyBzZWxlY3Qgd2hvbGUgbGlzdFxuICAgICAgcm9vdC5yZXBsYWNlU2VsZWN0aW9ucyhbeyBhbmNob3I6IHJvb3RTdGFydCwgaGVhZDogcm9vdEVuZCB9XSk7XG4gICAgfSBlbHNlIGlmIChcbiAgICAgIChzZWxlY3Rpb25Gcm9tLmxpbmUgPiBjb250ZW50U3RhcnQubGluZSB8fFxuICAgICAgICAoc2VsZWN0aW9uRnJvbS5saW5lID09IGNvbnRlbnRTdGFydC5saW5lICYmXG4gICAgICAgICAgc2VsZWN0aW9uRnJvbS5jaCA+PSBjb250ZW50U3RhcnQuY2gpKSAmJlxuICAgICAgKHNlbGVjdGlvblRvLmxpbmUgPCBjb250ZW50RW5kLmxpbmUgfHxcbiAgICAgICAgKHNlbGVjdGlvblRvLmxpbmUgPT0gY29udGVudEVuZC5saW5lICYmXG4gICAgICAgICAgc2VsZWN0aW9uVG8uY2ggPD0gY29udGVudEVuZC5jaCkpXG4gICAgKSB7XG4gICAgICAvLyBzZWxlY3Qgd2hvbGUgbGluZVxuICAgICAgcm9vdC5yZXBsYWNlU2VsZWN0aW9ucyhbeyBhbmNob3I6IGNvbnRlbnRTdGFydCwgaGVhZDogY29udGVudEVuZCB9XSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc3RvcFByb3BhZ2F0aW9uID0gZmFsc2U7XG4gICAgICB0aGlzLnVwZGF0ZWQgPSBmYWxzZTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgUGx1Z2luIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmltcG9ydCB7IGtleW1hcCB9IGZyb20gXCJAY29kZW1pcnJvci92aWV3XCI7XG5cbmltcG9ydCB7IEZlYXR1cmUgfSBmcm9tIFwiLi9GZWF0dXJlXCI7XG5cbmltcG9ydCB7IE15RWRpdG9yIH0gZnJvbSBcIi4uL2VkaXRvclwiO1xuaW1wb3J0IHsgU2VsZWN0QWxsQ29udGVudCB9IGZyb20gXCIuLi9vcGVyYXRpb25zL1NlbGVjdEFsbENvbnRlbnRcIjtcbmltcG9ydCB7IElNRURldGVjdG9yIH0gZnJvbSBcIi4uL3NlcnZpY2VzL0lNRURldGVjdG9yXCI7XG5pbXBvcnQgeyBPcGVyYXRpb25QZXJmb3JtZXIgfSBmcm9tIFwiLi4vc2VydmljZXMvT3BlcmF0aW9uUGVyZm9ybWVyXCI7XG5pbXBvcnQgeyBTZXR0aW5ncyB9IGZyb20gXCIuLi9zZXJ2aWNlcy9TZXR0aW5nc1wiO1xuaW1wb3J0IHsgY3JlYXRlS2V5bWFwUnVuQ2FsbGJhY2sgfSBmcm9tIFwiLi4vdXRpbHMvY3JlYXRlS2V5bWFwUnVuQ2FsbGJhY2tcIjtcblxuZXhwb3J0IGNsYXNzIEN0cmxBQW5kQ21kQUJlaGF2aW91ck92ZXJyaWRlIGltcGxlbWVudHMgRmVhdHVyZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcGx1Z2luOiBQbHVnaW4sXG4gICAgcHJpdmF0ZSBzZXR0aW5nczogU2V0dGluZ3MsXG4gICAgcHJpdmF0ZSBpbWVEZXRlY3RvcjogSU1FRGV0ZWN0b3IsXG4gICAgcHJpdmF0ZSBvcGVyYXRpb25QZXJmb3JtZXI6IE9wZXJhdGlvblBlcmZvcm1lcixcbiAgKSB7fVxuXG4gIGFzeW5jIGxvYWQoKSB7XG4gICAgdGhpcy5wbHVnaW4ucmVnaXN0ZXJFZGl0b3JFeHRlbnNpb24oXG4gICAgICBrZXltYXAub2YoW1xuICAgICAgICB7XG4gICAgICAgICAga2V5OiBcImMtYVwiLFxuICAgICAgICAgIG1hYzogXCJtLWFcIixcbiAgICAgICAgICBydW46IGNyZWF0ZUtleW1hcFJ1bkNhbGxiYWNrKHtcbiAgICAgICAgICAgIGNoZWNrOiB0aGlzLmNoZWNrLFxuICAgICAgICAgICAgcnVuOiB0aGlzLnJ1bixcbiAgICAgICAgICB9KSxcbiAgICAgICAgfSxcbiAgICAgIF0pLFxuICAgICk7XG4gIH1cblxuICBhc3luYyB1bmxvYWQoKSB7fVxuXG4gIHByaXZhdGUgY2hlY2sgPSAoKSA9PiB7XG4gICAgcmV0dXJuIChcbiAgICAgIHRoaXMuc2V0dGluZ3Mub3ZlcnJpZGVTZWxlY3RBbGxCZWhhdmlvdXIgJiYgIXRoaXMuaW1lRGV0ZWN0b3IuaXNPcGVuZWQoKVxuICAgICk7XG4gIH07XG5cbiAgcHJpdmF0ZSBydW4gPSAoZWRpdG9yOiBNeUVkaXRvcikgPT4ge1xuICAgIHJldHVybiB0aGlzLm9wZXJhdGlvblBlcmZvcm1lci5wZXJmb3JtKFxuICAgICAgKHJvb3QpID0+IG5ldyBTZWxlY3RBbGxDb250ZW50KHJvb3QpLFxuICAgICAgZWRpdG9yLFxuICAgICk7XG4gIH07XG59XG4iLCJpbXBvcnQgeyBEZWxldGVUaWxsUHJldmlvdXNMaW5lQ29udGVudEVuZCB9IGZyb20gXCIuL0RlbGV0ZVRpbGxQcmV2aW91c0xpbmVDb250ZW50RW5kXCI7XG5pbXBvcnQgeyBPcGVyYXRpb24gfSBmcm9tIFwiLi9PcGVyYXRpb25cIjtcblxuaW1wb3J0IHsgUm9vdCB9IGZyb20gXCIuLi9yb290XCI7XG5cbmV4cG9ydCBjbGFzcyBEZWxldGVUaWxsTmV4dExpbmVDb250ZW50U3RhcnQgaW1wbGVtZW50cyBPcGVyYXRpb24ge1xuICBwcml2YXRlIGRlbGV0ZVRpbGxQcmV2aW91c0xpbmVDb250ZW50RW5kOiBEZWxldGVUaWxsUHJldmlvdXNMaW5lQ29udGVudEVuZDtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJvb3Q6IFJvb3QpIHtcbiAgICB0aGlzLmRlbGV0ZVRpbGxQcmV2aW91c0xpbmVDb250ZW50RW5kID1cbiAgICAgIG5ldyBEZWxldGVUaWxsUHJldmlvdXNMaW5lQ29udGVudEVuZChyb290KTtcbiAgfVxuXG4gIHNob3VsZFN0b3BQcm9wYWdhdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5kZWxldGVUaWxsUHJldmlvdXNMaW5lQ29udGVudEVuZC5zaG91bGRTdG9wUHJvcGFnYXRpb24oKTtcbiAgfVxuXG4gIHNob3VsZFVwZGF0ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5kZWxldGVUaWxsUHJldmlvdXNMaW5lQ29udGVudEVuZC5zaG91bGRVcGRhdGUoKTtcbiAgfVxuXG4gIHBlcmZvcm0oKSB7XG4gICAgY29uc3QgeyByb290IH0gPSB0aGlzO1xuXG4gICAgaWYgKCFyb290Lmhhc1NpbmdsZUN1cnNvcigpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgbGlzdCA9IHJvb3QuZ2V0TGlzdFVuZGVyQ3Vyc29yKCk7XG4gICAgY29uc3QgY3Vyc29yID0gcm9vdC5nZXRDdXJzb3IoKTtcbiAgICBjb25zdCBsaW5lcyA9IGxpc3QuZ2V0TGluZXNJbmZvKCk7XG5cbiAgICBjb25zdCBsaW5lTm8gPSBsaW5lcy5maW5kSW5kZXgoXG4gICAgICAobCkgPT4gY3Vyc29yLmNoID09PSBsLnRvLmNoICYmIGN1cnNvci5saW5lID09PSBsLnRvLmxpbmUsXG4gICAgKTtcblxuICAgIGlmIChsaW5lTm8gPT09IGxpbmVzLmxlbmd0aCAtIDEpIHtcbiAgICAgIGNvbnN0IG5leHRMaW5lID0gbGluZXNbbGluZU5vXS50by5saW5lICsgMTtcbiAgICAgIGNvbnN0IG5leHRMaXN0ID0gcm9vdC5nZXRMaXN0VW5kZXJMaW5lKG5leHRMaW5lKTtcbiAgICAgIGlmICghbmV4dExpc3QpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgcm9vdC5yZXBsYWNlQ3Vyc29yKG5leHRMaXN0LmdldEZpcnN0TGluZUNvbnRlbnRTdGFydCgpKTtcbiAgICAgIHRoaXMuZGVsZXRlVGlsbFByZXZpb3VzTGluZUNvbnRlbnRFbmQucGVyZm9ybSgpO1xuICAgIH0gZWxzZSBpZiAobGluZU5vID49IDApIHtcbiAgICAgIHJvb3QucmVwbGFjZUN1cnNvcihsaW5lc1tsaW5lTm8gKyAxXS5mcm9tKTtcbiAgICAgIHRoaXMuZGVsZXRlVGlsbFByZXZpb3VzTGluZUNvbnRlbnRFbmQucGVyZm9ybSgpO1xuICAgIH1cbiAgfVxufVxuIiwiaW1wb3J0IHsgUGx1Z2luIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmltcG9ydCB7IGtleW1hcCB9IGZyb20gXCJAY29kZW1pcnJvci92aWV3XCI7XG5cbmltcG9ydCB7IEZlYXR1cmUgfSBmcm9tIFwiLi9GZWF0dXJlXCI7XG5cbmltcG9ydCB7IE15RWRpdG9yIH0gZnJvbSBcIi4uL2VkaXRvclwiO1xuaW1wb3J0IHsgRGVsZXRlVGlsbE5leHRMaW5lQ29udGVudFN0YXJ0IH0gZnJvbSBcIi4uL29wZXJhdGlvbnMvRGVsZXRlVGlsbE5leHRMaW5lQ29udGVudFN0YXJ0XCI7XG5pbXBvcnQgeyBJTUVEZXRlY3RvciB9IGZyb20gXCIuLi9zZXJ2aWNlcy9JTUVEZXRlY3RvclwiO1xuaW1wb3J0IHsgT3BlcmF0aW9uUGVyZm9ybWVyIH0gZnJvbSBcIi4uL3NlcnZpY2VzL09wZXJhdGlvblBlcmZvcm1lclwiO1xuaW1wb3J0IHsgU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2VydmljZXMvU2V0dGluZ3NcIjtcbmltcG9ydCB7IGNyZWF0ZUtleW1hcFJ1bkNhbGxiYWNrIH0gZnJvbSBcIi4uL3V0aWxzL2NyZWF0ZUtleW1hcFJ1bkNhbGxiYWNrXCI7XG5cbmV4cG9ydCBjbGFzcyBEZWxldGVCZWhhdmlvdXJPdmVycmlkZSBpbXBsZW1lbnRzIEZlYXR1cmUge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHBsdWdpbjogUGx1Z2luLFxuICAgIHByaXZhdGUgc2V0dGluZ3M6IFNldHRpbmdzLFxuICAgIHByaXZhdGUgaW1lRGV0ZWN0b3I6IElNRURldGVjdG9yLFxuICAgIHByaXZhdGUgb3BlcmF0aW9uUGVyZm9ybWVyOiBPcGVyYXRpb25QZXJmb3JtZXIsXG4gICkge31cblxuICBhc3luYyBsb2FkKCkge1xuICAgIHRoaXMucGx1Z2luLnJlZ2lzdGVyRWRpdG9yRXh0ZW5zaW9uKFxuICAgICAga2V5bWFwLm9mKFtcbiAgICAgICAge1xuICAgICAgICAgIGtleTogXCJEZWxldGVcIixcbiAgICAgICAgICBydW46IGNyZWF0ZUtleW1hcFJ1bkNhbGxiYWNrKHtcbiAgICAgICAgICAgIGNoZWNrOiB0aGlzLmNoZWNrLFxuICAgICAgICAgICAgcnVuOiB0aGlzLnJ1bixcbiAgICAgICAgICB9KSxcbiAgICAgICAgfSxcbiAgICAgIF0pLFxuICAgICk7XG4gIH1cblxuICBhc3luYyB1bmxvYWQoKSB7fVxuXG4gIHByaXZhdGUgY2hlY2sgPSAoKSA9PiB7XG4gICAgcmV0dXJuIChcbiAgICAgIHRoaXMuc2V0dGluZ3Mua2VlcEN1cnNvcldpdGhpbkNvbnRlbnQgIT09IFwibmV2ZXJcIiAmJlxuICAgICAgIXRoaXMuaW1lRGV0ZWN0b3IuaXNPcGVuZWQoKVxuICAgICk7XG4gIH07XG5cbiAgcHJpdmF0ZSBydW4gPSAoZWRpdG9yOiBNeUVkaXRvcikgPT4ge1xuICAgIHJldHVybiB0aGlzLm9wZXJhdGlvblBlcmZvcm1lci5wZXJmb3JtKFxuICAgICAgKHJvb3QpID0+IG5ldyBEZWxldGVUaWxsTmV4dExpbmVDb250ZW50U3RhcnQocm9vdCksXG4gICAgICBlZGl0b3IsXG4gICAgKTtcbiAgfTtcbn1cbiIsImltcG9ydCB7IE9wZXJhdGlvbiB9IGZyb20gXCIuL09wZXJhdGlvblwiO1xuXG5pbXBvcnQgeyBMaXN0LCBSb290LCByZWNhbGN1bGF0ZU51bWVyaWNCdWxsZXRzIH0gZnJvbSBcIi4uL3Jvb3RcIjtcblxuaW50ZXJmYWNlIEN1cnNvckFuY2hvciB7XG4gIGN1cnNvckxpc3Q6IExpc3Q7XG4gIGxpbmVEaWZmOiBudW1iZXI7XG4gIGNoRGlmZjogbnVtYmVyO1xufVxuXG5leHBvcnQgY2xhc3MgTW92ZUxpc3RUb0RpZmZlcmVudFBvc2l0aW9uIGltcGxlbWVudHMgT3BlcmF0aW9uIHtcbiAgcHJpdmF0ZSBzdG9wUHJvcGFnYXRpb24gPSBmYWxzZTtcbiAgcHJpdmF0ZSB1cGRhdGVkID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByb290OiBSb290LFxuICAgIHByaXZhdGUgbGlzdFRvTW92ZTogTGlzdCxcbiAgICBwcml2YXRlIHBsYWNlVG9Nb3ZlOiBMaXN0LFxuICAgIHByaXZhdGUgd2hlcmVUb01vdmU6IFwiYmVmb3JlXCIgfCBcImFmdGVyXCIgfCBcImluc2lkZVwiLFxuICAgIHByaXZhdGUgZGVmYXVsdEluZGVudENoYXJzOiBzdHJpbmcsXG4gICkge31cblxuICBzaG91bGRTdG9wUHJvcGFnYXRpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuc3RvcFByb3BhZ2F0aW9uO1xuICB9XG5cbiAgc2hvdWxkVXBkYXRlKCkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZWQ7XG4gIH1cblxuICBwZXJmb3JtKCkge1xuICAgIGlmICh0aGlzLmxpc3RUb01vdmUgPT09IHRoaXMucGxhY2VUb01vdmUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLnN0b3BQcm9wYWdhdGlvbiA9IHRydWU7XG4gICAgdGhpcy51cGRhdGVkID0gdHJ1ZTtcblxuICAgIGNvbnN0IGN1cnNvckFuY2hvciA9IHRoaXMuY2FsY3VsYXRlQ3Vyc29yQW5jaG9yKCk7XG4gICAgdGhpcy5tb3ZlTGlzdCgpO1xuICAgIHRoaXMuY2hhbmdlSW5kZW50KCk7XG4gICAgdGhpcy5yZXN0b3JlQ3Vyc29yKGN1cnNvckFuY2hvcik7XG4gICAgcmVjYWxjdWxhdGVOdW1lcmljQnVsbGV0cyh0aGlzLnJvb3QpO1xuICB9XG5cbiAgcHJpdmF0ZSBjYWxjdWxhdGVDdXJzb3JBbmNob3IoKTogQ3Vyc29yQW5jaG9yIHtcbiAgICBjb25zdCBjdXJzb3JMaW5lID0gdGhpcy5yb290LmdldEN1cnNvcigpLmxpbmU7XG5cbiAgICBjb25zdCBsaW5lcyA9IFtcbiAgICAgIHRoaXMubGlzdFRvTW92ZS5nZXRGaXJzdExpbmVDb250ZW50U3RhcnQoKS5saW5lLFxuICAgICAgdGhpcy5saXN0VG9Nb3ZlLmdldExhc3RMaW5lQ29udGVudEVuZCgpLmxpbmUsXG4gICAgICB0aGlzLnBsYWNlVG9Nb3ZlLmdldEZpcnN0TGluZUNvbnRlbnRTdGFydCgpLmxpbmUsXG4gICAgICB0aGlzLnBsYWNlVG9Nb3ZlLmdldExhc3RMaW5lQ29udGVudEVuZCgpLmxpbmUsXG4gICAgXTtcbiAgICBjb25zdCBsaXN0U3RhcnRMaW5lID0gTWF0aC5taW4oLi4ubGluZXMpO1xuICAgIGNvbnN0IGxpc3RFbmRMaW5lID0gTWF0aC5tYXgoLi4ubGluZXMpO1xuXG4gICAgaWYgKGN1cnNvckxpbmUgPCBsaXN0U3RhcnRMaW5lIHx8IGN1cnNvckxpbmUgPiBsaXN0RW5kTGluZSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgY3Vyc29yID0gdGhpcy5yb290LmdldEN1cnNvcigpO1xuICAgIGNvbnN0IGN1cnNvckxpc3QgPSB0aGlzLnJvb3QuZ2V0TGlzdFVuZGVyTGluZShjdXJzb3IubGluZSk7XG4gICAgY29uc3QgY3Vyc29yTGlzdFN0YXJ0ID0gY3Vyc29yTGlzdC5nZXRGaXJzdExpbmVDb250ZW50U3RhcnQoKTtcbiAgICBjb25zdCBsaW5lRGlmZiA9IGN1cnNvci5saW5lIC0gY3Vyc29yTGlzdFN0YXJ0LmxpbmU7XG4gICAgY29uc3QgY2hEaWZmID0gY3Vyc29yLmNoIC0gY3Vyc29yTGlzdFN0YXJ0LmNoO1xuXG4gICAgcmV0dXJuIHsgY3Vyc29yTGlzdCwgbGluZURpZmYsIGNoRGlmZiB9O1xuICB9XG5cbiAgcHJpdmF0ZSBtb3ZlTGlzdCgpIHtcbiAgICB0aGlzLmxpc3RUb01vdmUuZ2V0UGFyZW50KCkucmVtb3ZlQ2hpbGQodGhpcy5saXN0VG9Nb3ZlKTtcblxuICAgIHN3aXRjaCAodGhpcy53aGVyZVRvTW92ZSkge1xuICAgICAgY2FzZSBcImJlZm9yZVwiOlxuICAgICAgICB0aGlzLnBsYWNlVG9Nb3ZlXG4gICAgICAgICAgLmdldFBhcmVudCgpXG4gICAgICAgICAgLmFkZEJlZm9yZSh0aGlzLnBsYWNlVG9Nb3ZlLCB0aGlzLmxpc3RUb01vdmUpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBcImFmdGVyXCI6XG4gICAgICAgIHRoaXMucGxhY2VUb01vdmVcbiAgICAgICAgICAuZ2V0UGFyZW50KClcbiAgICAgICAgICAuYWRkQWZ0ZXIodGhpcy5wbGFjZVRvTW92ZSwgdGhpcy5saXN0VG9Nb3ZlKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgXCJpbnNpZGVcIjpcbiAgICAgICAgdGhpcy5wbGFjZVRvTW92ZS5hZGRCZWZvcmVBbGwodGhpcy5saXN0VG9Nb3ZlKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBjaGFuZ2VJbmRlbnQoKSB7XG4gICAgY29uc3Qgb2xkSW5kZW50ID0gdGhpcy5saXN0VG9Nb3ZlLmdldEZpcnN0TGluZUluZGVudCgpO1xuICAgIGNvbnN0IG5ld0luZGVudCA9XG4gICAgICB0aGlzLndoZXJlVG9Nb3ZlID09PSBcImluc2lkZVwiXG4gICAgICAgID8gdGhpcy5wbGFjZVRvTW92ZS5nZXRGaXJzdExpbmVJbmRlbnQoKSArIHRoaXMuZGVmYXVsdEluZGVudENoYXJzXG4gICAgICAgIDogdGhpcy5wbGFjZVRvTW92ZS5nZXRGaXJzdExpbmVJbmRlbnQoKTtcbiAgICB0aGlzLmxpc3RUb01vdmUudW5pbmRlbnRDb250ZW50KDAsIG9sZEluZGVudC5sZW5ndGgpO1xuICAgIHRoaXMubGlzdFRvTW92ZS5pbmRlbnRDb250ZW50KDAsIG5ld0luZGVudCk7XG4gIH1cblxuICBwcml2YXRlIHJlc3RvcmVDdXJzb3IoY3Vyc29yQW5jaG9yOiBDdXJzb3JBbmNob3IpIHtcbiAgICBpZiAoY3Vyc29yQW5jaG9yKSB7XG4gICAgICBjb25zdCBjdXJzb3JMaXN0U3RhcnQgPVxuICAgICAgICBjdXJzb3JBbmNob3IuY3Vyc29yTGlzdC5nZXRGaXJzdExpbmVDb250ZW50U3RhcnQoKTtcblxuICAgICAgdGhpcy5yb290LnJlcGxhY2VDdXJzb3Ioe1xuICAgICAgICBsaW5lOiBjdXJzb3JMaXN0U3RhcnQubGluZSArIGN1cnNvckFuY2hvci5saW5lRGlmZixcbiAgICAgICAgY2g6IGN1cnNvckxpc3RTdGFydC5jaCArIGN1cnNvckFuY2hvci5jaERpZmYsXG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gV2hlbiB5b3UgbW92ZSBhIGxpc3QsIHRoZSBzY3JlZW4gc2Nyb2xscyB0byB0aGUgY3Vyc29yLlxuICAgICAgLy8gSXQgaXMgYmV0dGVyIHRvIG1vdmUgdGhlIGN1cnNvciBpbnRvIHRoZSB2aWV3cG9ydCB0aGFuIGxldCB0aGUgc2NyZWVuIHNjcm9sbC5cbiAgICAgIHRoaXMucm9vdC5yZXBsYWNlQ3Vyc29yKHRoaXMubGlzdFRvTW92ZS5nZXRMYXN0TGluZUNvbnRlbnRFbmQoKSk7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBOb3RpY2UsIFBsYXRmb3JtLCBQbHVnaW4gfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuaW1wb3J0IHsgZ2V0SW5kZW50VW5pdCwgaW5kZW50U3RyaW5nIH0gZnJvbSBcIkBjb2RlbWlycm9yL2xhbmd1YWdlXCI7XG5pbXBvcnQgeyBTdGF0ZUVmZmVjdCwgU3RhdGVGaWVsZCB9IGZyb20gXCJAY29kZW1pcnJvci9zdGF0ZVwiO1xuaW1wb3J0IHsgRGVjb3JhdGlvbiwgRGVjb3JhdGlvblNldCwgRWRpdG9yVmlldyB9IGZyb20gXCJAY29kZW1pcnJvci92aWV3XCI7XG5cbmltcG9ydCB7IEZlYXR1cmUgfSBmcm9tIFwiLi9GZWF0dXJlXCI7XG5cbmltcG9ydCB7IE15RWRpdG9yLCBnZXRFZGl0b3JGcm9tU3RhdGUgfSBmcm9tIFwiLi4vZWRpdG9yXCI7XG5pbXBvcnQgeyBNb3ZlTGlzdFRvRGlmZmVyZW50UG9zaXRpb24gfSBmcm9tIFwiLi4vb3BlcmF0aW9ucy9Nb3ZlTGlzdFRvRGlmZmVyZW50UG9zaXRpb25cIjtcbmltcG9ydCB7IExpc3QsIFJvb3QsIGNtcFBvcyB9IGZyb20gXCIuLi9yb290XCI7XG5pbXBvcnQgeyBPYnNpZGlhblNldHRpbmdzIH0gZnJvbSBcIi4uL3NlcnZpY2VzL09ic2lkaWFuU2V0dGluZ3NcIjtcbmltcG9ydCB7IE9wZXJhdGlvblBlcmZvcm1lciB9IGZyb20gXCIuLi9zZXJ2aWNlcy9PcGVyYXRpb25QZXJmb3JtZXJcIjtcbmltcG9ydCB7IFBhcnNlciB9IGZyb20gXCIuLi9zZXJ2aWNlcy9QYXJzZXJcIjtcbmltcG9ydCB7IFNldHRpbmdzIH0gZnJvbSBcIi4uL3NlcnZpY2VzL1NldHRpbmdzXCI7XG5cbmNvbnN0IEJPRFlfQ0xBU1MgPSBcIm91dGxpbmVyLXBsdWdpbi1kbmRcIjtcblxuZXhwb3J0IGNsYXNzIERyYWdBbmREcm9wIGltcGxlbWVudHMgRmVhdHVyZSB7XG4gIHByaXZhdGUgZHJvcFpvbmU6IEhUTUxEaXZFbGVtZW50O1xuICBwcml2YXRlIGRyb3Bab25lUGFkZGluZzogSFRNTERpdkVsZW1lbnQ7XG4gIHByaXZhdGUgcHJlU3RhcnQ6IERyYWdBbmREcm9wUHJlU3RhcnRTdGF0ZSB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIHN0YXRlOiBEcmFnQW5kRHJvcFN0YXRlIHwgbnVsbCA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBwbHVnaW46IFBsdWdpbixcbiAgICBwcml2YXRlIHNldHRpbmdzOiBTZXR0aW5ncyxcbiAgICBwcml2YXRlIG9iaXNpZGlhbjogT2JzaWRpYW5TZXR0aW5ncyxcbiAgICBwcml2YXRlIHBhcnNlcjogUGFyc2VyLFxuICAgIHByaXZhdGUgb3BlcmF0aW9uUGVyZm9ybWVyOiBPcGVyYXRpb25QZXJmb3JtZXIsXG4gICkge31cblxuICBhc3luYyBsb2FkKCkge1xuICAgIHRoaXMucGx1Z2luLnJlZ2lzdGVyRWRpdG9yRXh0ZW5zaW9uKFtcbiAgICAgIGRyYWdnaW5nTGluZXNTdGF0ZUZpZWxkLFxuICAgICAgZHJvcHBpbmdMaW5lc1N0YXRlRmllbGQsXG4gICAgXSk7XG4gICAgdGhpcy5lbmFibGVGZWF0dXJlVG9nZ2xlKCk7XG4gICAgdGhpcy5jcmVhdGVEcm9wWm9uZSgpO1xuICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcnMoKTtcbiAgfVxuXG4gIGFzeW5jIHVubG9hZCgpIHtcbiAgICB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXJzKCk7XG4gICAgdGhpcy5yZW1vdmVEcm9wWm9uZSgpO1xuICAgIHRoaXMuZGlzYWJsZUZlYXR1cmVUb2dnbGUoKTtcbiAgfVxuXG4gIHByaXZhdGUgZW5hYmxlRmVhdHVyZVRvZ2dsZSgpIHtcbiAgICB0aGlzLnNldHRpbmdzLm9uQ2hhbmdlKHRoaXMuaGFuZGxlU2V0dGluZ3NDaGFuZ2UpO1xuICAgIHRoaXMuaGFuZGxlU2V0dGluZ3NDaGFuZ2UoKTtcbiAgfVxuXG4gIHByaXZhdGUgZGlzYWJsZUZlYXR1cmVUb2dnbGUoKSB7XG4gICAgdGhpcy5zZXR0aW5ncy5yZW1vdmVDYWxsYmFjayh0aGlzLmhhbmRsZVNldHRpbmdzQ2hhbmdlKTtcbiAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoQk9EWV9DTEFTUyk7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZURyb3Bab25lKCkge1xuICAgIHRoaXMuZHJvcFpvbmVQYWRkaW5nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICB0aGlzLmRyb3Bab25lUGFkZGluZy5jbGFzc0xpc3QuYWRkKFwib3V0bGluZXItcGx1Z2luLWRyb3Atem9uZS1wYWRkaW5nXCIpO1xuICAgIHRoaXMuZHJvcFpvbmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIHRoaXMuZHJvcFpvbmUuY2xhc3NMaXN0LmFkZChcIm91dGxpbmVyLXBsdWdpbi1kcm9wLXpvbmVcIik7XG4gICAgdGhpcy5kcm9wWm9uZS5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgdGhpcy5kcm9wWm9uZS5hcHBlbmRDaGlsZCh0aGlzLmRyb3Bab25lUGFkZGluZyk7XG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLmRyb3Bab25lKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVtb3ZlRHJvcFpvbmUoKSB7XG4gICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZCh0aGlzLmRyb3Bab25lKTtcbiAgICB0aGlzLmRyb3Bab25lUGFkZGluZyA9IG51bGw7XG4gICAgdGhpcy5kcm9wWm9uZSA9IG51bGw7XG4gIH1cblxuICBwcml2YXRlIGFkZEV2ZW50TGlzdGVuZXJzKCkge1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgdGhpcy5oYW5kbGVNb3VzZURvd24sIHtcbiAgICAgIGNhcHR1cmU6IHRydWUsXG4gICAgfSk7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCB0aGlzLmhhbmRsZU1vdXNlTW92ZSk7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgdGhpcy5oYW5kbGVNb3VzZVVwKTtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCB0aGlzLmhhbmRsZUtleURvd24pO1xuICB9XG5cbiAgcHJpdmF0ZSByZW1vdmVFdmVudExpc3RlbmVycygpIHtcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIHRoaXMuaGFuZGxlTW91c2VEb3duLCB7XG4gICAgICBjYXB0dXJlOiB0cnVlLFxuICAgIH0pO1xuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgdGhpcy5oYW5kbGVNb3VzZU1vdmUpO1xuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIHRoaXMuaGFuZGxlTW91c2VVcCk7XG4gICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgdGhpcy5oYW5kbGVLZXlEb3duKTtcbiAgfVxuXG4gIHByaXZhdGUgaGFuZGxlU2V0dGluZ3NDaGFuZ2UgPSAoKSA9PiB7XG4gICAgaWYgKCFpc0ZlYXR1cmVTdXBwb3J0ZWQoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnNldHRpbmdzLmRyYWdBbmREcm9wKSB7XG4gICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoQk9EWV9DTEFTUyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZShCT0RZX0NMQVNTKTtcbiAgICB9XG4gIH07XG5cbiAgcHJpdmF0ZSBoYW5kbGVNb3VzZURvd24gPSAoZTogTW91c2VFdmVudCkgPT4ge1xuICAgIGlmIChcbiAgICAgICFpc0ZlYXR1cmVTdXBwb3J0ZWQoKSB8fFxuICAgICAgIXRoaXMuc2V0dGluZ3MuZHJhZ0FuZERyb3AgfHxcbiAgICAgICFpc0NsaWNrT25CdWxsZXQoZSlcbiAgICApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB2aWV3ID0gZ2V0RWRpdG9yVmlld0Zyb21IVE1MRWxlbWVudChlLnRhcmdldCBhcyBIVE1MRWxlbWVudCk7XG4gICAgaWYgKCF2aWV3KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cbiAgICB0aGlzLnByZVN0YXJ0ID0ge1xuICAgICAgeDogZS54LFxuICAgICAgeTogZS55LFxuICAgICAgdmlldyxcbiAgICB9O1xuICB9O1xuXG4gIHByaXZhdGUgaGFuZGxlTW91c2VNb3ZlID0gKGU6IE1vdXNlRXZlbnQpID0+IHtcbiAgICBpZiAodGhpcy5wcmVTdGFydCkge1xuICAgICAgdGhpcy5zdGFydERyYWdnaW5nKCk7XG4gICAgfVxuICAgIGlmICh0aGlzLnN0YXRlKSB7XG4gICAgICB0aGlzLmRldGVjdEFuZERyYXdEcm9wWm9uZShlLngsIGUueSk7XG4gICAgfVxuICB9O1xuXG4gIHByaXZhdGUgaGFuZGxlTW91c2VVcCA9ICgpID0+IHtcbiAgICBpZiAodGhpcy5wcmVTdGFydCkge1xuICAgICAgdGhpcy5wcmVTdGFydCA9IG51bGw7XG4gICAgfVxuICAgIGlmICh0aGlzLnN0YXRlKSB7XG4gICAgICB0aGlzLnN0b3BEcmFnZ2luZygpO1xuICAgIH1cbiAgfTtcblxuICBwcml2YXRlIGhhbmRsZUtleURvd24gPSAoZTogS2V5Ym9hcmRFdmVudCkgPT4ge1xuICAgIGlmICh0aGlzLnN0YXRlICYmIGUuY29kZSA9PT0gXCJFc2NhcGVcIikge1xuICAgICAgdGhpcy5jYW5jZWxEcmFnZ2luZygpO1xuICAgIH1cbiAgfTtcblxuICBwcml2YXRlIHN0YXJ0RHJhZ2dpbmcoKSB7XG4gICAgY29uc3QgeyB4LCB5LCB2aWV3IH0gPSB0aGlzLnByZVN0YXJ0O1xuICAgIHRoaXMucHJlU3RhcnQgPSBudWxsO1xuXG4gICAgY29uc3QgZWRpdG9yID0gZ2V0RWRpdG9yRnJvbVN0YXRlKHZpZXcuc3RhdGUpO1xuICAgIGNvbnN0IHBvcyA9IGVkaXRvci5vZmZzZXRUb1Bvcyh2aWV3LnBvc0F0Q29vcmRzKHsgeCwgeSB9KSk7XG4gICAgY29uc3Qgcm9vdCA9IHRoaXMucGFyc2VyLnBhcnNlKGVkaXRvciwgcG9zKTtcbiAgICBjb25zdCBsaXN0ID0gcm9vdC5nZXRMaXN0VW5kZXJMaW5lKHBvcy5saW5lKTtcbiAgICBjb25zdCBzdGF0ZSA9IG5ldyBEcmFnQW5kRHJvcFN0YXRlKHZpZXcsIGVkaXRvciwgcm9vdCwgbGlzdCk7XG5cbiAgICBpZiAoIXN0YXRlLmhhc0Ryb3BWYXJpYW50cygpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5zdGF0ZSA9IHN0YXRlO1xuICAgIHRoaXMuaGlnaGxpZ2h0RHJhZ2dpbmdMaW5lcygpO1xuICB9XG5cbiAgcHJpdmF0ZSBkZXRlY3RBbmREcmF3RHJvcFpvbmUoeDogbnVtYmVyLCB5OiBudW1iZXIpIHtcbiAgICB0aGlzLnN0YXRlLmNhbGN1bGF0ZU5lYXJlc3REcm9wVmFyaWFudCh4LCB5KTtcbiAgICB0aGlzLmRyYXdEcm9wWm9uZSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBjYW5jZWxEcmFnZ2luZygpIHtcbiAgICB0aGlzLnN0YXRlLmRyb3BWYXJpYW50ID0gbnVsbDtcbiAgICB0aGlzLnN0b3BEcmFnZ2luZygpO1xuICB9XG5cbiAgcHJpdmF0ZSBzdG9wRHJhZ2dpbmcoKSB7XG4gICAgdGhpcy51bmhpZ2h0bGlnaHREcmFnZ2luZ0xpbmVzKCk7XG4gICAgdGhpcy5oaWRlRHJvcFpvbmUoKTtcbiAgICB0aGlzLmFwcGx5Q2hhbmdlcygpO1xuICAgIHRoaXMuc3RhdGUgPSBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSBhcHBseUNoYW5nZXMoKSB7XG4gICAgaWYgKCF0aGlzLnN0YXRlLmRyb3BWYXJpYW50KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgeyBzdGF0ZSB9ID0gdGhpcztcbiAgICBjb25zdCB7IGRyb3BWYXJpYW50LCBlZGl0b3IsIHJvb3QsIGxpc3QgfSA9IHN0YXRlO1xuXG4gICAgY29uc3QgbmV3Um9vdCA9IHRoaXMucGFyc2VyLnBhcnNlKGVkaXRvciwgcm9vdC5nZXRDb250ZW50U3RhcnQoKSk7XG4gICAgaWYgKCFpc1NhbWVSb290cyhyb290LCBuZXdSb290KSkge1xuICAgICAgbmV3IE5vdGljZShcbiAgICAgICAgYFRoZSBpdGVtIGNhbm5vdCBiZSBtb3ZlZC4gVGhlIHBhZ2UgY29udGVudCBjaGFuZ2VkIGR1cmluZyB0aGUgbW92ZS5gLFxuICAgICAgICA1MDAwLFxuICAgICAgKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLm9wZXJhdGlvblBlcmZvcm1lci5ldmFsKFxuICAgICAgcm9vdCxcbiAgICAgIG5ldyBNb3ZlTGlzdFRvRGlmZmVyZW50UG9zaXRpb24oXG4gICAgICAgIHJvb3QsXG4gICAgICAgIGxpc3QsXG4gICAgICAgIGRyb3BWYXJpYW50LnBsYWNlVG9Nb3ZlLFxuICAgICAgICBkcm9wVmFyaWFudC53aGVyZVRvTW92ZSxcbiAgICAgICAgdGhpcy5vYmlzaWRpYW4uZ2V0RGVmYXVsdEluZGVudENoYXJzKCksXG4gICAgICApLFxuICAgICAgZWRpdG9yLFxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIGhpZ2hsaWdodERyYWdnaW5nTGluZXMoKSB7XG4gICAgY29uc3QgeyBzdGF0ZSB9ID0gdGhpcztcbiAgICBjb25zdCB7IGxpc3QsIGVkaXRvciwgdmlldyB9ID0gc3RhdGU7XG5cbiAgICBjb25zdCBsaW5lcyA9IFtdO1xuICAgIGNvbnN0IGZyb21MaW5lID0gbGlzdC5nZXRGaXJzdExpbmVDb250ZW50U3RhcnQoKS5saW5lO1xuICAgIGNvbnN0IHRpbGxMaW5lID0gbGlzdC5nZXRDb250ZW50RW5kSW5jbHVkaW5nQ2hpbGRyZW4oKS5saW5lO1xuICAgIGZvciAobGV0IGkgPSBmcm9tTGluZTsgaSA8PSB0aWxsTGluZTsgaSsrKSB7XG4gICAgICBsaW5lcy5wdXNoKGVkaXRvci5wb3NUb09mZnNldCh7IGxpbmU6IGksIGNoOiAwIH0pKTtcbiAgICB9XG4gICAgdmlldy5kaXNwYXRjaCh7XG4gICAgICBlZmZlY3RzOiBbZG5kU3RhcnRlZC5vZihsaW5lcyldLFxuICAgIH0pO1xuXG4gICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkKFwib3V0bGluZXItcGx1Z2luLWRyYWdnaW5nXCIpO1xuICB9XG5cbiAgcHJpdmF0ZSB1bmhpZ2h0bGlnaHREcmFnZ2luZ0xpbmVzKCkge1xuICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZShcIm91dGxpbmVyLXBsdWdpbi1kcmFnZ2luZ1wiKTtcblxuICAgIHRoaXMuc3RhdGUudmlldy5kaXNwYXRjaCh7XG4gICAgICBlZmZlY3RzOiBbZG5kRW5kZWQub2YoKV0sXG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGRyYXdEcm9wWm9uZSgpIHtcbiAgICBjb25zdCB7IHN0YXRlIH0gPSB0aGlzO1xuICAgIGNvbnN0IHsgdmlldywgZWRpdG9yLCBkcm9wVmFyaWFudCB9ID0gc3RhdGU7XG5cbiAgICBjb25zdCBuZXdQYXJlbnQgPVxuICAgICAgZHJvcFZhcmlhbnQud2hlcmVUb01vdmUgPT09IFwiaW5zaWRlXCJcbiAgICAgICAgPyBkcm9wVmFyaWFudC5wbGFjZVRvTW92ZVxuICAgICAgICA6IGRyb3BWYXJpYW50LnBsYWNlVG9Nb3ZlLmdldFBhcmVudCgpO1xuICAgIGNvbnN0IG5ld1BhcmVudElzUm9vdExpc3QgPSAhbmV3UGFyZW50LmdldFBhcmVudCgpO1xuXG4gICAge1xuICAgICAgY29uc3Qgd2lkdGggPSBNYXRoLnJvdW5kKFxuICAgICAgICB2aWV3LmNvbnRlbnRET00ub2Zmc2V0V2lkdGggLVxuICAgICAgICAgIChkcm9wVmFyaWFudC5sZWZ0IC0gdGhpcy5zdGF0ZS5sZWZ0UGFkZGluZyksXG4gICAgICApO1xuXG4gICAgICB0aGlzLmRyb3Bab25lLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XG4gICAgICB0aGlzLmRyb3Bab25lLnN0eWxlLnRvcCA9IGRyb3BWYXJpYW50LnRvcCArIFwicHhcIjtcbiAgICAgIHRoaXMuZHJvcFpvbmUuc3R5bGUubGVmdCA9IGRyb3BWYXJpYW50LmxlZnQgKyBcInB4XCI7XG4gICAgICB0aGlzLmRyb3Bab25lLnN0eWxlLndpZHRoID0gd2lkdGggKyBcInB4XCI7XG4gICAgfVxuXG4gICAge1xuICAgICAgY29uc3QgbGV2ZWwgPSBuZXdQYXJlbnQuZ2V0TGV2ZWwoKTtcbiAgICAgIGNvbnN0IGluZGVudFdpZHRoID0gdGhpcy5zdGF0ZS50YWJXaWR0aDtcbiAgICAgIGNvbnN0IHdpZHRoID0gaW5kZW50V2lkdGggKiBsZXZlbDtcbiAgICAgIGNvbnN0IGRhc2hQYWRkaW5nID0gMztcbiAgICAgIGNvbnN0IGRhc2hXaWR0aCA9IGluZGVudFdpZHRoIC0gZGFzaFBhZGRpbmc7XG4gICAgICBjb25zdCBjb2xvciA9IGdldENvbXB1dGVkU3R5bGUoZG9jdW1lbnQuYm9keSkuZ2V0UHJvcGVydHlWYWx1ZShcbiAgICAgICAgXCItLWNvbG9yLWFjY2VudFwiLFxuICAgICAgKTtcblxuICAgICAgdGhpcy5kcm9wWm9uZVBhZGRpbmcuc3R5bGUud2lkdGggPSBgJHt3aWR0aH1weGA7XG4gICAgICB0aGlzLmRyb3Bab25lUGFkZGluZy5zdHlsZS5tYXJnaW5MZWZ0ID0gYC0ke3dpZHRofXB4YDtcbiAgICAgIHRoaXMuZHJvcFpvbmVQYWRkaW5nLnN0eWxlLmJhY2tncm91bmRJbWFnZSA9IGB1cmwoJ2RhdGE6aW1hZ2Uvc3ZnK3htbCwlM0NzdmclMjB2aWV3Qm94JTNEJTIyMCUyMDAlMjAke3dpZHRofSUyMDQlMjIlMjB4bWxucyUzRCUyMmh0dHAlM0ElMkYlMkZ3d3cudzMub3JnJTJGMjAwMCUyRnN2ZyUyMiUzRSUzQ2xpbmUlMjB4MSUzRCUyMjAlMjIlMjB5MSUzRCUyMjAlMjIlMjB4MiUzRCUyMiR7d2lkdGh9JTIyJTIweTIlM0QlMjIwJTIyJTIwc3Ryb2tlJTNEJTIyJHtjb2xvcn0lMjIlMjBzdHJva2Utd2lkdGglM0QlMjI4JTIyJTIwc3Ryb2tlLWRhc2hhcnJheSUzRCUyMiR7ZGFzaFdpZHRofSUyMCR7ZGFzaFBhZGRpbmd9JTIyJTJGJTNFJTNDJTJGc3ZnJTNFJylgO1xuICAgIH1cblxuICAgIHRoaXMuc3RhdGUudmlldy5kaXNwYXRjaCh7XG4gICAgICBlZmZlY3RzOiBbXG4gICAgICAgIGRuZE1vdmVkLm9mKFxuICAgICAgICAgIG5ld1BhcmVudElzUm9vdExpc3RcbiAgICAgICAgICAgID8gbnVsbFxuICAgICAgICAgICAgOiBlZGl0b3IucG9zVG9PZmZzZXQoe1xuICAgICAgICAgICAgICAgIGxpbmU6IG5ld1BhcmVudC5nZXRGaXJzdExpbmVDb250ZW50U3RhcnQoKS5saW5lLFxuICAgICAgICAgICAgICAgIGNoOiAwLFxuICAgICAgICAgICAgICB9KSxcbiAgICAgICAgKSxcbiAgICAgIF0sXG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGhpZGVEcm9wWm9uZSgpIHtcbiAgICB0aGlzLmRyb3Bab25lLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgfVxufVxuXG5pbnRlcmZhY2UgRHJvcFZhcmlhbnQge1xuICBsaW5lOiBudW1iZXI7XG4gIGxldmVsOiBudW1iZXI7XG4gIGxlZnQ6IG51bWJlcjtcbiAgdG9wOiBudW1iZXI7XG4gIHBsYWNlVG9Nb3ZlOiBMaXN0O1xuICB3aGVyZVRvTW92ZTogXCJhZnRlclwiIHwgXCJiZWZvcmVcIiB8IFwiaW5zaWRlXCI7XG59XG5cbmludGVyZmFjZSBEcmFnQW5kRHJvcFByZVN0YXJ0U3RhdGUge1xuICB4OiBudW1iZXI7XG4gIHk6IG51bWJlcjtcbiAgdmlldzogRWRpdG9yVmlldztcbn1cblxuY2xhc3MgRHJhZ0FuZERyb3BTdGF0ZSB7XG4gIHByaXZhdGUgZHJvcFZhcmlhbnRzOiBNYXA8c3RyaW5nLCBEcm9wVmFyaWFudD4gPSBuZXcgTWFwKCk7XG4gIHB1YmxpYyBkcm9wVmFyaWFudDogRHJvcFZhcmlhbnQgPSBudWxsO1xuICBwdWJsaWMgbGVmdFBhZGRpbmcgPSAwO1xuICBwdWJsaWMgdGFiV2lkdGggPSAwO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHB1YmxpYyByZWFkb25seSB2aWV3OiBFZGl0b3JWaWV3LFxuICAgIHB1YmxpYyByZWFkb25seSBlZGl0b3I6IE15RWRpdG9yLFxuICAgIHB1YmxpYyByZWFkb25seSByb290OiBSb290LFxuICAgIHB1YmxpYyByZWFkb25seSBsaXN0OiBMaXN0LFxuICApIHtcbiAgICB0aGlzLmNvbGxlY3REcm9wVmFyaWFudHMoKTtcbiAgICB0aGlzLmNhbGN1bGF0ZUxlZnRQYWRkaW5nKCk7XG4gICAgdGhpcy5jYWxjdWxhdGVUYWJXaWR0aCgpO1xuICB9XG5cbiAgZ2V0RHJvcFZhcmlhbnRzKCkge1xuICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMuZHJvcFZhcmlhbnRzLnZhbHVlcygpKTtcbiAgfVxuXG4gIGhhc0Ryb3BWYXJpYW50cygpIHtcbiAgICByZXR1cm4gdGhpcy5kcm9wVmFyaWFudHMuc2l6ZSA+IDA7XG4gIH1cblxuICBjYWxjdWxhdGVOZWFyZXN0RHJvcFZhcmlhbnQoeDogbnVtYmVyLCB5OiBudW1iZXIpIHtcbiAgICBjb25zdCB7IHZpZXcsIGVkaXRvciB9ID0gdGhpcztcblxuICAgIGNvbnN0IGRyb3BWYXJpYW50cyA9IHRoaXMuZ2V0RHJvcFZhcmlhbnRzKCk7XG4gICAgY29uc3QgcG9zc2libGVEcm9wVmFyaWFudHMgPSBbXTtcblxuICAgIGZvciAoY29uc3QgdiBvZiBkcm9wVmFyaWFudHMpIHtcbiAgICAgIGNvbnN0IHsgcGxhY2VUb01vdmUgfSA9IHY7XG5cbiAgICAgIGNvbnN0IHBvc2l0aW9uQWZ0ZXJMaXN0ID1cbiAgICAgICAgdi53aGVyZVRvTW92ZSA9PT0gXCJhZnRlclwiIHx8IHYud2hlcmVUb01vdmUgPT09IFwiaW5zaWRlXCI7XG4gICAgICBjb25zdCBsaW5lID0gcG9zaXRpb25BZnRlckxpc3RcbiAgICAgICAgPyBwbGFjZVRvTW92ZS5nZXRDb250ZW50RW5kSW5jbHVkaW5nQ2hpbGRyZW4oKS5saW5lXG4gICAgICAgIDogcGxhY2VUb01vdmUuZ2V0Rmlyc3RMaW5lQ29udGVudFN0YXJ0KCkubGluZTtcbiAgICAgIGNvbnN0IGxpbmVQb3MgPSBlZGl0b3IucG9zVG9PZmZzZXQoe1xuICAgICAgICBsaW5lLFxuICAgICAgICBjaDogMCxcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBjb29yZHMgPSB2aWV3LmNvb3Jkc0F0UG9zKGxpbmVQb3MsIC0xKTtcblxuICAgICAgaWYgKCFjb29yZHMpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIHYubGVmdCA9IHRoaXMubGVmdFBhZGRpbmcgKyAodi5sZXZlbCAtIDEpICogdGhpcy50YWJXaWR0aDtcbiAgICAgIHYudG9wID0gY29vcmRzLnRvcDtcblxuICAgICAgaWYgKHBvc2l0aW9uQWZ0ZXJMaXN0KSB7XG4gICAgICAgIHYudG9wICs9IHZpZXcubGluZUJsb2NrQXQobGluZVBvcykuaGVpZ2h0O1xuICAgICAgfVxuXG4gICAgICAvLyBCZXR0ZXIgdmVydGljYWwgYWxpZ25tZW50XG4gICAgICB2LnRvcCAtPSA4O1xuXG4gICAgICBwb3NzaWJsZURyb3BWYXJpYW50cy5wdXNoKHYpO1xuICAgIH1cblxuICAgIGNvbnN0IG5lYXJlc3RMaW5lVG9wID0gcG9zc2libGVEcm9wVmFyaWFudHNcbiAgICAgIC5zb3J0KChhLCBiKSA9PiBNYXRoLmFicyh5IC0gYS50b3ApIC0gTWF0aC5hYnMoeSAtIGIudG9wKSlcbiAgICAgIC5maXJzdCgpLnRvcDtcblxuICAgIGNvbnN0IHZhcmlhbnNPbk5lYXJlc3RMaW5lID0gcG9zc2libGVEcm9wVmFyaWFudHMuZmlsdGVyKFxuICAgICAgKHYpID0+IE1hdGguYWJzKHYudG9wIC0gbmVhcmVzdExpbmVUb3ApIDw9IDQsXG4gICAgKTtcblxuICAgIHRoaXMuZHJvcFZhcmlhbnQgPSB2YXJpYW5zT25OZWFyZXN0TGluZVxuICAgICAgLnNvcnQoKGEsIGIpID0+IE1hdGguYWJzKHggLSBhLmxlZnQpIC0gTWF0aC5hYnMoeCAtIGIubGVmdCkpXG4gICAgICAuZmlyc3QoKTtcbiAgfVxuXG4gIHByaXZhdGUgYWRkRHJvcFZhcmlhbnQodjogRHJvcFZhcmlhbnQpIHtcbiAgICB0aGlzLmRyb3BWYXJpYW50cy5zZXQoYCR7di5saW5lfSAke3YubGV2ZWx9YCwgdik7XG4gIH1cblxuICBwcml2YXRlIGNvbGxlY3REcm9wVmFyaWFudHMoKSB7XG4gICAgY29uc3QgdmlzaXQgPSAobGlzdHM6IExpc3RbXSkgPT4ge1xuICAgICAgZm9yIChjb25zdCBwbGFjZVRvTW92ZSBvZiBsaXN0cykge1xuICAgICAgICBjb25zdCBsaW5lQmVmb3JlID0gcGxhY2VUb01vdmUuZ2V0Rmlyc3RMaW5lQ29udGVudFN0YXJ0KCkubGluZTtcbiAgICAgICAgY29uc3QgbGluZUFmdGVyID0gcGxhY2VUb01vdmUuZ2V0Q29udGVudEVuZEluY2x1ZGluZ0NoaWxkcmVuKCkubGluZSArIDE7XG5cbiAgICAgICAgY29uc3QgbGV2ZWwgPSBwbGFjZVRvTW92ZS5nZXRMZXZlbCgpO1xuXG4gICAgICAgIHRoaXMuYWRkRHJvcFZhcmlhbnQoe1xuICAgICAgICAgIGxpbmU6IGxpbmVCZWZvcmUsXG4gICAgICAgICAgbGV2ZWwsXG4gICAgICAgICAgbGVmdDogMCxcbiAgICAgICAgICB0b3A6IDAsXG4gICAgICAgICAgcGxhY2VUb01vdmUsXG4gICAgICAgICAgd2hlcmVUb01vdmU6IFwiYmVmb3JlXCIsXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmFkZERyb3BWYXJpYW50KHtcbiAgICAgICAgICBsaW5lOiBsaW5lQWZ0ZXIsXG4gICAgICAgICAgbGV2ZWwsXG4gICAgICAgICAgbGVmdDogMCxcbiAgICAgICAgICB0b3A6IDAsXG4gICAgICAgICAgcGxhY2VUb01vdmUsXG4gICAgICAgICAgd2hlcmVUb01vdmU6IFwiYWZ0ZXJcIixcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHBsYWNlVG9Nb3ZlID09PSB0aGlzLmxpc3QpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwbGFjZVRvTW92ZS5pc0VtcHR5KCkpIHtcbiAgICAgICAgICB0aGlzLmFkZERyb3BWYXJpYW50KHtcbiAgICAgICAgICAgIGxpbmU6IGxpbmVBZnRlcixcbiAgICAgICAgICAgIGxldmVsOiBsZXZlbCArIDEsXG4gICAgICAgICAgICBsZWZ0OiAwLFxuICAgICAgICAgICAgdG9wOiAwLFxuICAgICAgICAgICAgcGxhY2VUb01vdmUsXG4gICAgICAgICAgICB3aGVyZVRvTW92ZTogXCJpbnNpZGVcIixcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2aXNpdChwbGFjZVRvTW92ZS5nZXRDaGlsZHJlbigpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG5cbiAgICB2aXNpdCh0aGlzLnJvb3QuZ2V0Q2hpbGRyZW4oKSk7XG4gIH1cblxuICBwcml2YXRlIGNhbGN1bGF0ZUxlZnRQYWRkaW5nKCkge1xuICAgIGNvbnN0IGNtTGluZSA9IHRoaXMudmlldy5kb20ucXVlcnlTZWxlY3RvcihcImRpdi5jbS1saW5lXCIpO1xuICAgIHRoaXMubGVmdFBhZGRpbmcgPSBjbUxpbmUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkubGVmdDtcbiAgfVxuXG4gIHByaXZhdGUgY2FsY3VsYXRlVGFiV2lkdGgoKSB7XG4gICAgY29uc3QgeyB2aWV3IH0gPSB0aGlzO1xuXG4gICAgY29uc3QgaW5kZW50RG9tID0gdmlldy5kb20ucXVlcnlTZWxlY3RvcihcIi5jbS1pbmRlbnRcIik7XG4gICAgaWYgKGluZGVudERvbSkge1xuICAgICAgdGhpcy50YWJXaWR0aCA9IChpbmRlbnREb20gYXMgSFRNTEVsZW1lbnQpLm9mZnNldFdpZHRoO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHNpbmdsZUluZGVudCA9IGluZGVudFN0cmluZyh2aWV3LnN0YXRlLCBnZXRJbmRlbnRVbml0KHZpZXcuc3RhdGUpKTtcblxuICAgIGZvciAobGV0IGkgPSAxOyBpIDw9IHZpZXcuc3RhdGUuZG9jLmxpbmVzOyBpKyspIHtcbiAgICAgIGNvbnN0IGxpbmUgPSB2aWV3LnN0YXRlLmRvYy5saW5lKGkpO1xuXG4gICAgICBpZiAobGluZS50ZXh0LnN0YXJ0c1dpdGgoc2luZ2xlSW5kZW50KSkge1xuICAgICAgICBjb25zdCBhID0gdmlldy5jb29yZHNBdFBvcyhsaW5lLmZyb20sIC0xKTtcbiAgICAgICAgaWYgKCFhKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBiID0gdmlldy5jb29yZHNBdFBvcyhsaW5lLmZyb20gKyBzaW5nbGVJbmRlbnQubGVuZ3RoLCAtMSk7XG4gICAgICAgIGlmICghYikge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy50YWJXaWR0aCA9IGIubGVmdCAtIGEubGVmdDtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMudGFiV2lkdGggPSB2aWV3LmRlZmF1bHRDaGFyYWN0ZXJXaWR0aCAqIGdldEluZGVudFVuaXQodmlldy5zdGF0ZSk7XG4gIH1cbn1cblxuY29uc3QgZG5kU3RhcnRlZCA9IFN0YXRlRWZmZWN0LmRlZmluZTxudW1iZXJbXT4oe1xuICBtYXA6IChsaW5lcywgY2hhbmdlKSA9PiBsaW5lcy5tYXAoKGwpID0+IGNoYW5nZS5tYXBQb3MobCkpLFxufSk7XG5cbmNvbnN0IGRuZE1vdmVkID0gU3RhdGVFZmZlY3QuZGVmaW5lPG51bWJlciB8IG51bGw+KHtcbiAgbWFwOiAobGluZSwgY2hhbmdlKSA9PiAobGluZSAhPT0gbnVsbCA/IGNoYW5nZS5tYXBQb3MobGluZSkgOiBsaW5lKSxcbn0pO1xuXG5jb25zdCBkbmRFbmRlZCA9IFN0YXRlRWZmZWN0LmRlZmluZTx2b2lkPigpO1xuXG5jb25zdCBkcmFnZ2luZ0xpbmVEZWNvcmF0aW9uID0gRGVjb3JhdGlvbi5saW5lKHtcbiAgY2xhc3M6IFwib3V0bGluZXItcGx1Z2luLWRyYWdnaW5nLWxpbmVcIixcbn0pO1xuXG5jb25zdCBkcm9wcGluZ0xpbmVEZWNvcmF0aW9uID0gRGVjb3JhdGlvbi5saW5lKHtcbiAgY2xhc3M6IFwib3V0bGluZXItcGx1Z2luLWRyb3BwaW5nLWxpbmVcIixcbn0pO1xuXG5jb25zdCBkcmFnZ2luZ0xpbmVzU3RhdGVGaWVsZCA9IFN0YXRlRmllbGQuZGVmaW5lPERlY29yYXRpb25TZXQ+KHtcbiAgY3JlYXRlOiAoKSA9PiBEZWNvcmF0aW9uLm5vbmUsXG5cbiAgdXBkYXRlOiAoZG5kU3RhdGUsIHRyKSA9PiB7XG4gICAgZG5kU3RhdGUgPSBkbmRTdGF0ZS5tYXAodHIuY2hhbmdlcyk7XG5cbiAgICBmb3IgKGNvbnN0IGUgb2YgdHIuZWZmZWN0cykge1xuICAgICAgaWYgKGUuaXMoZG5kU3RhcnRlZCkpIHtcbiAgICAgICAgZG5kU3RhdGUgPSBkbmRTdGF0ZS51cGRhdGUoe1xuICAgICAgICAgIGFkZDogZS52YWx1ZS5tYXAoKGwpID0+IGRyYWdnaW5nTGluZURlY29yYXRpb24ucmFuZ2UobCwgbCkpLFxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYgKGUuaXMoZG5kRW5kZWQpKSB7XG4gICAgICAgIGRuZFN0YXRlID0gRGVjb3JhdGlvbi5ub25lO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBkbmRTdGF0ZTtcbiAgfSxcblxuICBwcm92aWRlOiAoZikgPT4gRWRpdG9yVmlldy5kZWNvcmF0aW9ucy5mcm9tKGYpLFxufSk7XG5cbmNvbnN0IGRyb3BwaW5nTGluZXNTdGF0ZUZpZWxkID0gU3RhdGVGaWVsZC5kZWZpbmU8RGVjb3JhdGlvblNldD4oe1xuICBjcmVhdGU6ICgpID0+IERlY29yYXRpb24ubm9uZSxcblxuICB1cGRhdGU6IChkbmREcm9wcGluZ1N0YXRlLCB0cikgPT4ge1xuICAgIGRuZERyb3BwaW5nU3RhdGUgPSBkbmREcm9wcGluZ1N0YXRlLm1hcCh0ci5jaGFuZ2VzKTtcblxuICAgIGZvciAoY29uc3QgZSBvZiB0ci5lZmZlY3RzKSB7XG4gICAgICBpZiAoZS5pcyhkbmRNb3ZlZCkpIHtcbiAgICAgICAgZG5kRHJvcHBpbmdTdGF0ZSA9XG4gICAgICAgICAgZS52YWx1ZSA9PT0gbnVsbFxuICAgICAgICAgICAgPyBEZWNvcmF0aW9uLm5vbmVcbiAgICAgICAgICAgIDogRGVjb3JhdGlvbi5zZXQoZHJvcHBpbmdMaW5lRGVjb3JhdGlvbi5yYW5nZShlLnZhbHVlLCBlLnZhbHVlKSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChlLmlzKGRuZEVuZGVkKSkge1xuICAgICAgICBkbmREcm9wcGluZ1N0YXRlID0gRGVjb3JhdGlvbi5ub25lO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBkbmREcm9wcGluZ1N0YXRlO1xuICB9LFxuXG4gIHByb3ZpZGU6IChmKSA9PiBFZGl0b3JWaWV3LmRlY29yYXRpb25zLmZyb20oZiksXG59KTtcblxuZnVuY3Rpb24gZ2V0RWRpdG9yVmlld0Zyb21IVE1MRWxlbWVudChlOiBIVE1MRWxlbWVudCkge1xuICB3aGlsZSAoZSAmJiAhZS5jbGFzc0xpc3QuY29udGFpbnMoXCJjbS1lZGl0b3JcIikpIHtcbiAgICBlID0gZS5wYXJlbnRFbGVtZW50O1xuICB9XG5cbiAgaWYgKCFlKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4gRWRpdG9yVmlldy5maW5kRnJvbURPTShlKTtcbn1cblxuZnVuY3Rpb24gaXNDbGlja09uQnVsbGV0KGU6IE1vdXNlRXZlbnQpIHtcbiAgbGV0IGVsID0gZS50YXJnZXQgYXMgSFRNTEVsZW1lbnQ7XG5cbiAgd2hpbGUgKGVsKSB7XG4gICAgaWYgKFxuICAgICAgZWwuY2xhc3NMaXN0LmNvbnRhaW5zKFwiY20tZm9ybWF0dGluZy1saXN0XCIpIHx8XG4gICAgICBlbC5jbGFzc0xpc3QuY29udGFpbnMoXCJjbS1mb2xkLWluZGljYXRvclwiKSB8fFxuICAgICAgZWwuY2xhc3NMaXN0LmNvbnRhaW5zKFwidGFzay1saXN0LWl0ZW0tY2hlY2tib3hcIilcbiAgICApIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGVsID0gZWwucGFyZW50RWxlbWVudDtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gaXNTYW1lUm9vdHMoYTogUm9vdCwgYjogUm9vdCkge1xuICBjb25zdCBbYVN0YXJ0LCBhRW5kXSA9IGEuZ2V0Q29udGVudFJhbmdlKCk7XG4gIGNvbnN0IFtiU3RhcnQsIGJFbmRdID0gYi5nZXRDb250ZW50UmFuZ2UoKTtcblxuICBpZiAoY21wUG9zKGFTdGFydCwgYlN0YXJ0KSAhPT0gMCB8fCBjbXBQb3MoYUVuZCwgYkVuZCkgIT09IDApIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gYS5wcmludCgpID09PSBiLnByaW50KCk7XG59XG5cbmZ1bmN0aW9uIGlzRmVhdHVyZVN1cHBvcnRlZCgpIHtcbiAgcmV0dXJuIFBsYXRmb3JtLmlzRGVza3RvcDtcbn1cbiIsImltcG9ydCB7IE9wZXJhdGlvbiB9IGZyb20gXCIuL09wZXJhdGlvblwiO1xuXG5pbXBvcnQgeyBSb290IH0gZnJvbSBcIi4uL3Jvb3RcIjtcblxuZXhwb3J0IGNsYXNzIEtlZXBDdXJzb3JPdXRzaWRlRm9sZGVkTGluZXMgaW1wbGVtZW50cyBPcGVyYXRpb24ge1xuICBwcml2YXRlIHN0b3BQcm9wYWdhdGlvbiA9IGZhbHNlO1xuICBwcml2YXRlIHVwZGF0ZWQgPSBmYWxzZTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJvb3Q6IFJvb3QpIHt9XG5cbiAgc2hvdWxkU3RvcFByb3BhZ2F0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnN0b3BQcm9wYWdhdGlvbjtcbiAgfVxuXG4gIHNob3VsZFVwZGF0ZSgpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVkO1xuICB9XG5cbiAgcGVyZm9ybSgpIHtcbiAgICBjb25zdCB7IHJvb3QgfSA9IHRoaXM7XG5cbiAgICBpZiAoIXJvb3QuaGFzU2luZ2xlQ3Vyc29yKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBjdXJzb3IgPSByb290LmdldEN1cnNvcigpO1xuXG4gICAgY29uc3QgbGlzdCA9IHJvb3QuZ2V0TGlzdFVuZGVyQ3Vyc29yKCk7XG4gICAgaWYgKCFsaXN0LmlzRm9sZGVkKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBmb2xkUm9vdCA9IGxpc3QuZ2V0VG9wRm9sZFJvb3QoKTtcbiAgICBjb25zdCBmaXJzdExpbmVFbmQgPSBmb2xkUm9vdC5nZXRMaW5lc0luZm8oKVswXS50bztcblxuICAgIGlmIChjdXJzb3IubGluZSA+IGZpcnN0TGluZUVuZC5saW5lKSB7XG4gICAgICB0aGlzLnVwZGF0ZWQgPSB0cnVlO1xuICAgICAgdGhpcy5zdG9wUHJvcGFnYXRpb24gPSB0cnVlO1xuICAgICAgcm9vdC5yZXBsYWNlQ3Vyc29yKGZpcnN0TGluZUVuZCk7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBPcGVyYXRpb24gfSBmcm9tIFwiLi9PcGVyYXRpb25cIjtcblxuaW1wb3J0IHsgUm9vdCB9IGZyb20gXCIuLi9yb290XCI7XG5cbmV4cG9ydCBjbGFzcyBLZWVwQ3Vyc29yV2l0aGluTGlzdENvbnRlbnQgaW1wbGVtZW50cyBPcGVyYXRpb24ge1xuICBwcml2YXRlIHN0b3BQcm9wYWdhdGlvbiA9IGZhbHNlO1xuICBwcml2YXRlIHVwZGF0ZWQgPSBmYWxzZTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJvb3Q6IFJvb3QpIHt9XG5cbiAgc2hvdWxkU3RvcFByb3BhZ2F0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnN0b3BQcm9wYWdhdGlvbjtcbiAgfVxuXG4gIHNob3VsZFVwZGF0ZSgpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVkO1xuICB9XG5cbiAgcGVyZm9ybSgpIHtcbiAgICBjb25zdCB7IHJvb3QgfSA9IHRoaXM7XG5cbiAgICBpZiAoIXJvb3QuaGFzU2luZ2xlQ3Vyc29yKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBjdXJzb3IgPSByb290LmdldEN1cnNvcigpO1xuICAgIGNvbnN0IGxpc3QgPSByb290LmdldExpc3RVbmRlckN1cnNvcigpO1xuICAgIGNvbnN0IGNvbnRlbnRTdGFydCA9IGxpc3QuZ2V0Rmlyc3RMaW5lQ29udGVudFN0YXJ0QWZ0ZXJDaGVja2JveCgpO1xuICAgIGNvbnN0IGxpbmVQcmVmaXggPVxuICAgICAgY29udGVudFN0YXJ0LmxpbmUgPT09IGN1cnNvci5saW5lXG4gICAgICAgID8gY29udGVudFN0YXJ0LmNoXG4gICAgICAgIDogbGlzdC5nZXROb3Rlc0luZGVudCgpLmxlbmd0aDtcblxuICAgIGlmIChjdXJzb3IuY2ggPCBsaW5lUHJlZml4KSB7XG4gICAgICB0aGlzLnVwZGF0ZWQgPSB0cnVlO1xuICAgICAgdGhpcy5zdG9wUHJvcGFnYXRpb24gPSB0cnVlO1xuICAgICAgcm9vdC5yZXBsYWNlQ3Vyc29yKHtcbiAgICAgICAgbGluZTogY3Vyc29yLmxpbmUsXG4gICAgICAgIGNoOiBsaW5lUHJlZml4LFxuICAgICAgfSk7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBQbHVnaW4gfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuaW1wb3J0IHsgRWRpdG9yU3RhdGUsIFRyYW5zYWN0aW9uIH0gZnJvbSBcIkBjb2RlbWlycm9yL3N0YXRlXCI7XG5cbmltcG9ydCB7IEZlYXR1cmUgfSBmcm9tIFwiLi9GZWF0dXJlXCI7XG5cbmltcG9ydCB7IE15RWRpdG9yLCBnZXRFZGl0b3JGcm9tU3RhdGUgfSBmcm9tIFwiLi4vZWRpdG9yXCI7XG5pbXBvcnQgeyBLZWVwQ3Vyc29yT3V0c2lkZUZvbGRlZExpbmVzIH0gZnJvbSBcIi4uL29wZXJhdGlvbnMvS2VlcEN1cnNvck91dHNpZGVGb2xkZWRMaW5lc1wiO1xuaW1wb3J0IHsgS2VlcEN1cnNvcldpdGhpbkxpc3RDb250ZW50IH0gZnJvbSBcIi4uL29wZXJhdGlvbnMvS2VlcEN1cnNvcldpdGhpbkxpc3RDb250ZW50XCI7XG5pbXBvcnQgeyBPcGVyYXRpb25QZXJmb3JtZXIgfSBmcm9tIFwiLi4vc2VydmljZXMvT3BlcmF0aW9uUGVyZm9ybWVyXCI7XG5pbXBvcnQgeyBQYXJzZXIgfSBmcm9tIFwiLi4vc2VydmljZXMvUGFyc2VyXCI7XG5pbXBvcnQgeyBTZXR0aW5ncyB9IGZyb20gXCIuLi9zZXJ2aWNlcy9TZXR0aW5nc1wiO1xuXG5leHBvcnQgY2xhc3MgRWRpdG9yU2VsZWN0aW9uc0JlaGF2aW91ck92ZXJyaWRlIGltcGxlbWVudHMgRmVhdHVyZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcGx1Z2luOiBQbHVnaW4sXG4gICAgcHJpdmF0ZSBzZXR0aW5nczogU2V0dGluZ3MsXG4gICAgcHJpdmF0ZSBwYXJzZXI6IFBhcnNlcixcbiAgICBwcml2YXRlIG9wZXJhdGlvblBlcmZvcm1lcjogT3BlcmF0aW9uUGVyZm9ybWVyLFxuICApIHt9XG5cbiAgYXN5bmMgbG9hZCgpIHtcbiAgICB0aGlzLnBsdWdpbi5yZWdpc3RlckVkaXRvckV4dGVuc2lvbihcbiAgICAgIEVkaXRvclN0YXRlLnRyYW5zYWN0aW9uRXh0ZW5kZXIub2YodGhpcy50cmFuc2FjdGlvbkV4dGVuZGVyKSxcbiAgICApO1xuICB9XG5cbiAgYXN5bmMgdW5sb2FkKCkge31cblxuICBwcml2YXRlIHRyYW5zYWN0aW9uRXh0ZW5kZXIgPSAodHI6IFRyYW5zYWN0aW9uKTogbnVsbCA9PiB7XG4gICAgaWYgKHRoaXMuc2V0dGluZ3Mua2VlcEN1cnNvcldpdGhpbkNvbnRlbnQgPT09IFwibmV2ZXJcIiB8fCAhdHIuc2VsZWN0aW9uKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCBlZGl0b3IgPSBnZXRFZGl0b3JGcm9tU3RhdGUodHIuc3RhcnRTdGF0ZSk7XG5cbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHRoaXMuaGFuZGxlU2VsZWN0aW9uc0NoYW5nZXMoZWRpdG9yKTtcbiAgICB9LCAwKTtcblxuICAgIHJldHVybiBudWxsO1xuICB9O1xuXG4gIHByaXZhdGUgaGFuZGxlU2VsZWN0aW9uc0NoYW5nZXMgPSAoZWRpdG9yOiBNeUVkaXRvcikgPT4ge1xuICAgIGNvbnN0IHJvb3QgPSB0aGlzLnBhcnNlci5wYXJzZShlZGl0b3IpO1xuXG4gICAgaWYgKCFyb290KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAge1xuICAgICAgY29uc3QgeyBzaG91bGRTdG9wUHJvcGFnYXRpb24gfSA9IHRoaXMub3BlcmF0aW9uUGVyZm9ybWVyLmV2YWwoXG4gICAgICAgIHJvb3QsXG4gICAgICAgIG5ldyBLZWVwQ3Vyc29yT3V0c2lkZUZvbGRlZExpbmVzKHJvb3QpLFxuICAgICAgICBlZGl0b3IsXG4gICAgICApO1xuXG4gICAgICBpZiAoc2hvdWxkU3RvcFByb3BhZ2F0aW9uKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLm9wZXJhdGlvblBlcmZvcm1lci5ldmFsKFxuICAgICAgcm9vdCxcbiAgICAgIG5ldyBLZWVwQ3Vyc29yV2l0aGluTGlzdENvbnRlbnQocm9vdCksXG4gICAgICBlZGl0b3IsXG4gICAgKTtcbiAgfTtcbn1cbiIsImV4cG9ydCBjb25zdCBjaGVja2JveFJlID0gYFxcXFxbW15cXFxcW1xcXFxdXVxcXFxdWyBcXHRdYDtcbiIsImV4cG9ydCBmdW5jdGlvbiBpc0VtcHR5TGluZU9yRW1wdHlDaGVja2JveChsaW5lOiBzdHJpbmcpIHtcbiAgcmV0dXJuIGxpbmUgPT09IFwiXCIgfHwgbGluZSA9PT0gXCJbIF0gXCI7XG59XG4iLCJpbXBvcnQgeyBPcGVyYXRpb24gfSBmcm9tIFwiLi9PcGVyYXRpb25cIjtcblxuaW1wb3J0IHsgTGlzdCwgUG9zaXRpb24sIFJvb3QsIHJlY2FsY3VsYXRlTnVtZXJpY0J1bGxldHMgfSBmcm9tIFwiLi4vcm9vdFwiO1xuaW1wb3J0IHsgY2hlY2tib3hSZSB9IGZyb20gXCIuLi91dGlscy9jaGVja2JveFJlXCI7XG5pbXBvcnQgeyBpc0VtcHR5TGluZU9yRW1wdHlDaGVja2JveCB9IGZyb20gXCIuLi91dGlscy9pc0VtcHR5TGluZU9yRW1wdHlDaGVja2JveFwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIEdldFpvb21SYW5nZSB7XG4gIGdldFpvb21SYW5nZSgpOiB7IGZyb206IFBvc2l0aW9uOyB0bzogUG9zaXRpb24gfSB8IG51bGw7XG59XG5cbmV4cG9ydCBjbGFzcyBDcmVhdGVOZXdJdGVtIGltcGxlbWVudHMgT3BlcmF0aW9uIHtcbiAgcHJpdmF0ZSBzdG9wUHJvcGFnYXRpb24gPSBmYWxzZTtcbiAgcHJpdmF0ZSB1cGRhdGVkID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByb290OiBSb290LFxuICAgIHByaXZhdGUgZGVmYXVsdEluZGVudENoYXJzOiBzdHJpbmcsXG4gICAgcHJpdmF0ZSBnZXRab29tUmFuZ2U6IEdldFpvb21SYW5nZSxcbiAgICBwcml2YXRlIGFmdGVyOiBib29sZWFuID0gdHJ1ZSxcbiAgKSB7fVxuXG4gIHNob3VsZFN0b3BQcm9wYWdhdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5zdG9wUHJvcGFnYXRpb247XG4gIH1cblxuICBzaG91bGRVcGRhdGUoKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlZDtcbiAgfVxuXG4gIHBlcmZvcm0oKSB7XG4gICAgY29uc3QgeyByb290IH0gPSB0aGlzO1xuXG4gICAgaWYgKCFyb290Lmhhc1NpbmdsZVNlbGVjdGlvbigpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgc2VsZWN0aW9uID0gcm9vdC5nZXRTZWxlY3Rpb24oKTtcbiAgICBpZiAoIXNlbGVjdGlvbiB8fCBzZWxlY3Rpb24uYW5jaG9yLmxpbmUgIT09IHNlbGVjdGlvbi5oZWFkLmxpbmUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBsaXN0ID0gcm9vdC5nZXRMaXN0VW5kZXJDdXJzb3IoKTtcbiAgICBjb25zdCBsaW5lcyA9IGxpc3QuZ2V0TGluZXNJbmZvKCk7XG5cbiAgICBpZiAobGluZXMubGVuZ3RoID09PSAxICYmIGlzRW1wdHlMaW5lT3JFbXB0eUNoZWNrYm94KGxpbmVzWzBdLnRleHQpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgY3Vyc29yID0gcm9vdC5nZXRDdXJzb3IoKTtcbiAgICBjb25zdCBsaW5lVW5kZXJDdXJzb3IgPSBsaW5lcy5maW5kKChsKSA9PiBsLmZyb20ubGluZSA9PT0gY3Vyc29yLmxpbmUpO1xuXG4gICAgaWYgKGN1cnNvci5jaCA8IGxpbmVVbmRlckN1cnNvci5mcm9tLmNoKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgeyBvbGRMaW5lcywgbmV3TGluZXMgfSA9IGxpbmVzLnJlZHVjZShcbiAgICAgIChhY2MsIGxpbmUpID0+IHtcbiAgICAgICAgaWYgKGN1cnNvci5saW5lID4gbGluZS5mcm9tLmxpbmUpIHtcbiAgICAgICAgICBhY2Mub2xkTGluZXMucHVzaChsaW5lLnRleHQpO1xuICAgICAgICB9IGVsc2UgaWYgKGN1cnNvci5saW5lID09PSBsaW5lLmZyb20ubGluZSkge1xuICAgICAgICAgIGNvbnN0IGxlZnQgPSBsaW5lLnRleHQuc2xpY2UoMCwgc2VsZWN0aW9uLmZyb20gLSBsaW5lLmZyb20uY2gpO1xuICAgICAgICAgIGNvbnN0IHJpZ2h0ID0gbGluZS50ZXh0LnNsaWNlKHNlbGVjdGlvbi50byAtIGxpbmUuZnJvbS5jaCk7XG4gICAgICAgICAgYWNjLm9sZExpbmVzLnB1c2gobGVmdCk7XG4gICAgICAgICAgYWNjLm5ld0xpbmVzLnB1c2gocmlnaHQpO1xuICAgICAgICB9IGVsc2UgaWYgKGN1cnNvci5saW5lIDwgbGluZS5mcm9tLmxpbmUpIHtcbiAgICAgICAgICBhY2MubmV3TGluZXMucHVzaChsaW5lLnRleHQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIG9sZExpbmVzOiBbXSxcbiAgICAgICAgbmV3TGluZXM6IFtdLFxuICAgICAgfSxcbiAgICApO1xuXG4gICAgY29uc3QgY29kZUJsb2NrQmFjdGlja3MgPSBvbGRMaW5lcy5qb2luKFwiXFxuXCIpLnNwbGl0KFwiYGBgXCIpLmxlbmd0aCAtIDE7XG4gICAgY29uc3QgaXNJbnNpZGVDb2RlYmxvY2sgPVxuICAgICAgY29kZUJsb2NrQmFjdGlja3MgPiAwICYmIGNvZGVCbG9ja0JhY3RpY2tzICUgMiAhPT0gMDtcblxuICAgIGlmIChpc0luc2lkZUNvZGVibG9jaykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuc3RvcFByb3BhZ2F0aW9uID0gdHJ1ZTtcbiAgICB0aGlzLnVwZGF0ZWQgPSB0cnVlO1xuXG4gICAgY29uc3Qgem9vbVJhbmdlID0gdGhpcy5nZXRab29tUmFuZ2UuZ2V0Wm9vbVJhbmdlKCk7XG4gICAgY29uc3QgbGlzdElzWm9vbWluZ1Jvb3QgPSBCb29sZWFuKFxuICAgICAgem9vbVJhbmdlICYmXG4gICAgICBsaXN0LmdldEZpcnN0TGluZUNvbnRlbnRTdGFydCgpLmxpbmUgPj0gem9vbVJhbmdlLmZyb20ubGluZSAmJlxuICAgICAgbGlzdC5nZXRMYXN0TGluZUNvbnRlbnRFbmQoKS5saW5lIDw9IHpvb21SYW5nZS5mcm9tLmxpbmUsXG4gICAgKTtcblxuICAgIGNvbnN0IGhhc0NoaWxkcmVuID0gIWxpc3QuaXNFbXB0eSgpO1xuICAgIGNvbnN0IGNoaWxkSXNGb2xkZWQgPSBsaXN0LmlzRm9sZFJvb3QoKTtcbiAgICBjb25zdCBlbmRQb3MgPSBsaXN0LmdldExhc3RMaW5lQ29udGVudEVuZCgpO1xuICAgIGNvbnN0IGVuZE9mTGluZSA9IGN1cnNvci5saW5lID09PSBlbmRQb3MubGluZSAmJiBjdXJzb3IuY2ggPT09IGVuZFBvcy5jaDtcblxuICAgIGNvbnN0IG9uQ2hpbGRMZXZlbCA9XG4gICAgICBsaXN0SXNab29taW5nUm9vdCB8fCAoaGFzQ2hpbGRyZW4gJiYgIWNoaWxkSXNGb2xkZWQgJiYgZW5kT2ZMaW5lKTtcblxuICAgIGNvbnN0IGluZGVudCA9IG9uQ2hpbGRMZXZlbFxuICAgICAgPyBoYXNDaGlsZHJlblxuICAgICAgICA/IGxpc3QuZ2V0Q2hpbGRyZW4oKVswXS5nZXRGaXJzdExpbmVJbmRlbnQoKVxuICAgICAgICA6IGxpc3QuZ2V0Rmlyc3RMaW5lSW5kZW50KCkgKyB0aGlzLmRlZmF1bHRJbmRlbnRDaGFyc1xuICAgICAgOiBsaXN0LmdldEZpcnN0TGluZUluZGVudCgpO1xuXG4gICAgY29uc3QgYnVsbGV0ID1cbiAgICAgIG9uQ2hpbGRMZXZlbCAmJiBoYXNDaGlsZHJlblxuICAgICAgICA/IGxpc3QuZ2V0Q2hpbGRyZW4oKVswXS5nZXRCdWxsZXQoKVxuICAgICAgICA6IGxpc3QuZ2V0QnVsbGV0KCk7XG5cbiAgICBjb25zdCBzcGFjZUFmdGVyQnVsbGV0ID1cbiAgICAgIG9uQ2hpbGRMZXZlbCAmJiBoYXNDaGlsZHJlblxuICAgICAgICA/IGxpc3QuZ2V0Q2hpbGRyZW4oKVswXS5nZXRTcGFjZUFmdGVyQnVsbGV0KClcbiAgICAgICAgOiBsaXN0LmdldFNwYWNlQWZ0ZXJCdWxsZXQoKTtcblxuICAgIGNvbnN0IHByZWZpeCA9IG9sZExpbmVzWzBdLm1hdGNoKGNoZWNrYm94UmUpID8gXCJbIF0gXCIgOiBcIlwiO1xuXG4gICAgY29uc3QgbmV3TGlzdCA9IG5ldyBMaXN0KFxuICAgICAgbGlzdC5nZXRSb290KCksXG4gICAgICBpbmRlbnQsXG4gICAgICBidWxsZXQsXG4gICAgICBwcmVmaXgsXG4gICAgICBzcGFjZUFmdGVyQnVsbGV0LFxuICAgICAgcHJlZml4ICsgbmV3TGluZXMuc2hpZnQoKSxcbiAgICAgIGZhbHNlLFxuICAgICk7XG5cbiAgICBpZiAobmV3TGluZXMubGVuZ3RoID4gMCkge1xuICAgICAgbmV3TGlzdC5zZXROb3Rlc0luZGVudChsaXN0LmdldE5vdGVzSW5kZW50KCkpO1xuICAgICAgZm9yIChjb25zdCBsaW5lIG9mIG5ld0xpbmVzKSB7XG4gICAgICAgIG5ld0xpc3QuYWRkTGluZShsaW5lKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAob25DaGlsZExldmVsKSB7XG4gICAgICBsaXN0LmFkZEJlZm9yZUFsbChuZXdMaXN0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKCFjaGlsZElzRm9sZGVkIHx8ICFlbmRPZkxpbmUpIHtcbiAgICAgICAgY29uc3QgY2hpbGRyZW4gPSBsaXN0LmdldENoaWxkcmVuKCk7XG4gICAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgY2hpbGRyZW4pIHtcbiAgICAgICAgICBsaXN0LnJlbW92ZUNoaWxkKGNoaWxkKTtcbiAgICAgICAgICBuZXdMaXN0LmFkZEFmdGVyQWxsKGNoaWxkKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5hZnRlcikge1xuICAgICAgICBsaXN0LmdldFBhcmVudCgpLmFkZEFmdGVyKGxpc3QsIG5ld0xpc3QpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGlzdC5nZXRQYXJlbnQoKS5hZGRCZWZvcmUobGlzdCwgbmV3TGlzdCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGlzdC5yZXBsYWNlTGluZXMob2xkTGluZXMpO1xuXG4gICAgY29uc3QgbmV3TGlzdFN0YXJ0ID0gbmV3TGlzdC5nZXRGaXJzdExpbmVDb250ZW50U3RhcnQoKTtcbiAgICByb290LnJlcGxhY2VDdXJzb3Ioe1xuICAgICAgbGluZTogbmV3TGlzdFN0YXJ0LmxpbmUsXG4gICAgICBjaDogbmV3TGlzdFN0YXJ0LmNoICsgcHJlZml4Lmxlbmd0aCxcbiAgICB9KTtcblxuICAgIHJlY2FsY3VsYXRlTnVtZXJpY0J1bGxldHMocm9vdCk7XG4gIH1cbn1cbiIsImltcG9ydCB7IE9wZXJhdGlvbiB9IGZyb20gXCIuL09wZXJhdGlvblwiO1xuXG5pbXBvcnQgeyBSb290LCByZWNhbGN1bGF0ZU51bWVyaWNCdWxsZXRzIH0gZnJvbSBcIi4uL3Jvb3RcIjtcblxuZXhwb3J0IGNsYXNzIE91dGRlbnRMaXN0IGltcGxlbWVudHMgT3BlcmF0aW9uIHtcbiAgcHJpdmF0ZSBzdG9wUHJvcGFnYXRpb24gPSBmYWxzZTtcbiAgcHJpdmF0ZSB1cGRhdGVkID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSByb290OiBSb290KSB7fVxuXG4gIHNob3VsZFN0b3BQcm9wYWdhdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5zdG9wUHJvcGFnYXRpb247XG4gIH1cblxuICBzaG91bGRVcGRhdGUoKSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlZDtcbiAgfVxuXG4gIHBlcmZvcm0oKSB7XG4gICAgY29uc3QgeyByb290IH0gPSB0aGlzO1xuXG4gICAgaWYgKCFyb290Lmhhc1NpbmdsZUN1cnNvcigpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5zdG9wUHJvcGFnYXRpb24gPSB0cnVlO1xuXG4gICAgY29uc3QgbGlzdCA9IHJvb3QuZ2V0TGlzdFVuZGVyQ3Vyc29yKCk7XG4gICAgY29uc3QgcGFyZW50ID0gbGlzdC5nZXRQYXJlbnQoKTtcbiAgICBjb25zdCBncmFuZFBhcmVudCA9IHBhcmVudC5nZXRQYXJlbnQoKTtcblxuICAgIGlmICghZ3JhbmRQYXJlbnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLnVwZGF0ZWQgPSB0cnVlO1xuXG4gICAgY29uc3QgbGlzdFN0YXJ0TGluZUJlZm9yZSA9IHJvb3QuZ2V0Q29udGVudExpbmVzUmFuZ2VPZihsaXN0KVswXTtcbiAgICBjb25zdCBpbmRlbnRSbUZyb20gPSBwYXJlbnQuZ2V0Rmlyc3RMaW5lSW5kZW50KCkubGVuZ3RoO1xuICAgIGNvbnN0IGluZGVudFJtVGlsbCA9IGxpc3QuZ2V0Rmlyc3RMaW5lSW5kZW50KCkubGVuZ3RoO1xuXG4gICAgcGFyZW50LnJlbW92ZUNoaWxkKGxpc3QpO1xuICAgIGdyYW5kUGFyZW50LmFkZEFmdGVyKHBhcmVudCwgbGlzdCk7XG4gICAgbGlzdC51bmluZGVudENvbnRlbnQoaW5kZW50Um1Gcm9tLCBpbmRlbnRSbVRpbGwpO1xuXG4gICAgY29uc3QgbGlzdFN0YXJ0TGluZUFmdGVyID0gcm9vdC5nZXRDb250ZW50TGluZXNSYW5nZU9mKGxpc3QpWzBdO1xuICAgIGNvbnN0IGxpbmVEaWZmID0gbGlzdFN0YXJ0TGluZUFmdGVyIC0gbGlzdFN0YXJ0TGluZUJlZm9yZTtcbiAgICBjb25zdCBjaERpZmYgPSBpbmRlbnRSbVRpbGwgLSBpbmRlbnRSbUZyb207XG5cbiAgICBjb25zdCBjdXJzb3IgPSByb290LmdldEN1cnNvcigpO1xuICAgIHJvb3QucmVwbGFjZUN1cnNvcih7XG4gICAgICBsaW5lOiBjdXJzb3IubGluZSArIGxpbmVEaWZmLFxuICAgICAgY2g6IGN1cnNvci5jaCAtIGNoRGlmZixcbiAgICB9KTtcblxuICAgIHJlY2FsY3VsYXRlTnVtZXJpY0J1bGxldHMocm9vdCk7XG4gIH1cbn1cbiIsImltcG9ydCB7IE9wZXJhdGlvbiB9IGZyb20gXCIuL09wZXJhdGlvblwiO1xuaW1wb3J0IHsgT3V0ZGVudExpc3QgfSBmcm9tIFwiLi9PdXRkZW50TGlzdFwiO1xuXG5pbXBvcnQgeyBSb290IH0gZnJvbSBcIi4uL3Jvb3RcIjtcbmltcG9ydCB7IGlzRW1wdHlMaW5lT3JFbXB0eUNoZWNrYm94IH0gZnJvbSBcIi4uL3V0aWxzL2lzRW1wdHlMaW5lT3JFbXB0eUNoZWNrYm94XCI7XG5cbmV4cG9ydCBjbGFzcyBPdXRkZW50TGlzdElmSXRzRW1wdHkgaW1wbGVtZW50cyBPcGVyYXRpb24ge1xuICBwcml2YXRlIG91dGRlbnRMaXN0OiBPdXRkZW50TGlzdDtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJvb3Q6IFJvb3QpIHtcbiAgICB0aGlzLm91dGRlbnRMaXN0ID0gbmV3IE91dGRlbnRMaXN0KHJvb3QpO1xuICB9XG5cbiAgc2hvdWxkU3RvcFByb3BhZ2F0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLm91dGRlbnRMaXN0LnNob3VsZFN0b3BQcm9wYWdhdGlvbigpO1xuICB9XG5cbiAgc2hvdWxkVXBkYXRlKCkge1xuICAgIHJldHVybiB0aGlzLm91dGRlbnRMaXN0LnNob3VsZFVwZGF0ZSgpO1xuICB9XG5cbiAgcGVyZm9ybSgpIHtcbiAgICBjb25zdCB7IHJvb3QgfSA9IHRoaXM7XG5cbiAgICBpZiAoIXJvb3QuaGFzU2luZ2xlQ3Vyc29yKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBsaXN0ID0gcm9vdC5nZXRMaXN0VW5kZXJDdXJzb3IoKTtcbiAgICBjb25zdCBsaW5lcyA9IGxpc3QuZ2V0TGluZXMoKTtcblxuICAgIGlmIChcbiAgICAgIGxpbmVzLmxlbmd0aCA+IDEgfHxcbiAgICAgICFpc0VtcHR5TGluZU9yRW1wdHlDaGVja2JveChsaW5lc1swXSkgfHxcbiAgICAgIGxpc3QuZ2V0TGV2ZWwoKSA9PT0gMVxuICAgICkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMub3V0ZGVudExpc3QucGVyZm9ybSgpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBQbHVnaW4gfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuaW1wb3J0IHsgUHJlYyB9IGZyb20gXCJAY29kZW1pcnJvci9zdGF0ZVwiO1xuaW1wb3J0IHsga2V5bWFwIH0gZnJvbSBcIkBjb2RlbWlycm9yL3ZpZXdcIjtcblxuaW1wb3J0IHsgRmVhdHVyZSB9IGZyb20gXCIuL0ZlYXR1cmVcIjtcblxuaW1wb3J0IHsgTXlFZGl0b3IgfSBmcm9tIFwiLi4vZWRpdG9yXCI7XG5pbXBvcnQgeyBDcmVhdGVOZXdJdGVtIH0gZnJvbSBcIi4uL29wZXJhdGlvbnMvQ3JlYXRlTmV3SXRlbVwiO1xuaW1wb3J0IHsgT3V0ZGVudExpc3RJZkl0c0VtcHR5IH0gZnJvbSBcIi4uL29wZXJhdGlvbnMvT3V0ZGVudExpc3RJZkl0c0VtcHR5XCI7XG5pbXBvcnQgeyBJTUVEZXRlY3RvciB9IGZyb20gXCIuLi9zZXJ2aWNlcy9JTUVEZXRlY3RvclwiO1xuaW1wb3J0IHsgT2JzaWRpYW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXJ2aWNlcy9PYnNpZGlhblNldHRpbmdzXCI7XG5pbXBvcnQgeyBPcGVyYXRpb25QZXJmb3JtZXIgfSBmcm9tIFwiLi4vc2VydmljZXMvT3BlcmF0aW9uUGVyZm9ybWVyXCI7XG5pbXBvcnQgeyBQYXJzZXIgfSBmcm9tIFwiLi4vc2VydmljZXMvUGFyc2VyXCI7XG5pbXBvcnQgeyBTZXR0aW5ncyB9IGZyb20gXCIuLi9zZXJ2aWNlcy9TZXR0aW5nc1wiO1xuaW1wb3J0IHsgY3JlYXRlS2V5bWFwUnVuQ2FsbGJhY2sgfSBmcm9tIFwiLi4vdXRpbHMvY3JlYXRlS2V5bWFwUnVuQ2FsbGJhY2tcIjtcblxuZXhwb3J0IGNsYXNzIEVudGVyQmVoYXZpb3VyT3ZlcnJpZGUgaW1wbGVtZW50cyBGZWF0dXJlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBwbHVnaW46IFBsdWdpbixcbiAgICBwcml2YXRlIHNldHRpbmdzOiBTZXR0aW5ncyxcbiAgICBwcml2YXRlIGltZURldGVjdG9yOiBJTUVEZXRlY3RvcixcbiAgICBwcml2YXRlIG9ic2lkaWFuU2V0dGluZ3M6IE9ic2lkaWFuU2V0dGluZ3MsXG4gICAgcHJpdmF0ZSBwYXJzZXI6IFBhcnNlcixcbiAgICBwcml2YXRlIG9wZXJhdGlvblBlcmZvcm1lcjogT3BlcmF0aW9uUGVyZm9ybWVyLFxuICApIHt9XG5cbiAgYXN5bmMgbG9hZCgpIHtcbiAgICB0aGlzLnBsdWdpbi5yZWdpc3RlckVkaXRvckV4dGVuc2lvbihcbiAgICAgIFByZWMuaGlnaGVzdChcbiAgICAgICAga2V5bWFwLm9mKFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBrZXk6IFwiRW50ZXJcIixcbiAgICAgICAgICAgIHJ1bjogY3JlYXRlS2V5bWFwUnVuQ2FsbGJhY2soe1xuICAgICAgICAgICAgICBjaGVjazogdGhpcy5jaGVjayxcbiAgICAgICAgICAgICAgcnVuOiB0aGlzLnJ1bixcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0pLFxuICAgICAgKSxcbiAgICApO1xuICB9XG5cbiAgYXN5bmMgdW5sb2FkKCkge31cblxuICBwcml2YXRlIGNoZWNrID0gKCkgPT4ge1xuICAgIHJldHVybiB0aGlzLnNldHRpbmdzLm92ZXJyaWRlRW50ZXJCZWhhdmlvdXIgJiYgIXRoaXMuaW1lRGV0ZWN0b3IuaXNPcGVuZWQoKTtcbiAgfTtcblxuICBwcml2YXRlIHJ1biA9IChlZGl0b3I6IE15RWRpdG9yKSA9PiB7XG4gICAgY29uc3Qgcm9vdCA9IHRoaXMucGFyc2VyLnBhcnNlKGVkaXRvcik7XG5cbiAgICBpZiAoIXJvb3QpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHNob3VsZFVwZGF0ZTogZmFsc2UsXG4gICAgICAgIHNob3VsZFN0b3BQcm9wYWdhdGlvbjogZmFsc2UsXG4gICAgICB9O1xuICAgIH1cblxuICAgIHtcbiAgICAgIGNvbnN0IHJlcyA9IHRoaXMub3BlcmF0aW9uUGVyZm9ybWVyLmV2YWwoXG4gICAgICAgIHJvb3QsXG4gICAgICAgIG5ldyBPdXRkZW50TGlzdElmSXRzRW1wdHkocm9vdCksXG4gICAgICAgIGVkaXRvcixcbiAgICAgICk7XG5cbiAgICAgIGlmIChyZXMuc2hvdWxkU3RvcFByb3BhZ2F0aW9uKSB7XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgICB9XG4gICAgfVxuXG4gICAge1xuICAgICAgY29uc3QgZGVmYXVsdEluZGVudENoYXJzID0gdGhpcy5vYnNpZGlhblNldHRpbmdzLmdldERlZmF1bHRJbmRlbnRDaGFycygpO1xuICAgICAgY29uc3Qgem9vbVJhbmdlID0gZWRpdG9yLmdldFpvb21SYW5nZSgpO1xuICAgICAgY29uc3QgZ2V0Wm9vbVJhbmdlID0ge1xuICAgICAgICBnZXRab29tUmFuZ2U6ICgpID0+IHpvb21SYW5nZSxcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlcyA9IHRoaXMub3BlcmF0aW9uUGVyZm9ybWVyLmV2YWwoXG4gICAgICAgIHJvb3QsXG4gICAgICAgIG5ldyBDcmVhdGVOZXdJdGVtKHJvb3QsIGRlZmF1bHRJbmRlbnRDaGFycywgZ2V0Wm9vbVJhbmdlKSxcbiAgICAgICAgZWRpdG9yLFxuICAgICAgKTtcblxuICAgICAgaWYgKHJlcy5zaG91bGRVcGRhdGUgJiYgem9vbVJhbmdlKSB7XG4gICAgICAgIGVkaXRvci50cnlSZWZyZXNoWm9vbSh6b29tUmFuZ2UuZnJvbS5saW5lKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG4gIH07XG59XG4iLCJpbXBvcnQgeyBFZGl0b3IgfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuaW1wb3J0IHsgTXlFZGl0b3IgfSBmcm9tIFwiLi4vZWRpdG9yXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFZGl0b3JDYWxsYmFjayhjYjogKGVkaXRvcjogTXlFZGl0b3IpID0+IGJvb2xlYW4pIHtcbiAgcmV0dXJuIChlZGl0b3I6IEVkaXRvcikgPT4ge1xuICAgIGNvbnN0IG15RWRpdG9yID0gbmV3IE15RWRpdG9yKGVkaXRvcik7XG4gICAgY29uc3Qgc2hvdWxkU3RvcFByb3BhZ2F0aW9uID0gY2IobXlFZGl0b3IpO1xuXG4gICAgaWYgKFxuICAgICAgIXNob3VsZFN0b3BQcm9wYWdhdGlvbiAmJlxuICAgICAgd2luZG93LmV2ZW50ICYmXG4gICAgICB3aW5kb3cuZXZlbnQudHlwZSA9PT0gXCJrZXlkb3duXCJcbiAgICApIHtcbiAgICAgIG15RWRpdG9yLnRyaWdnZXJPbktleURvd24od2luZG93LmV2ZW50IGFzIEtleWJvYXJkRXZlbnQpO1xuICAgIH1cbiAgfTtcbn1cbiIsImltcG9ydCB7IE5vdGljZSwgUGx1Z2luIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmltcG9ydCB7IEZlYXR1cmUgfSBmcm9tIFwiLi9GZWF0dXJlXCI7XG5cbmltcG9ydCB7IE15RWRpdG9yIH0gZnJvbSBcIi4uL2VkaXRvclwiO1xuaW1wb3J0IHsgT2JzaWRpYW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXJ2aWNlcy9PYnNpZGlhblNldHRpbmdzXCI7XG5pbXBvcnQgeyBjcmVhdGVFZGl0b3JDYWxsYmFjayB9IGZyb20gXCIuLi91dGlscy9jcmVhdGVFZGl0b3JDYWxsYmFja1wiO1xuXG5leHBvcnQgY2xhc3MgTGlzdHNGb2xkaW5nQ29tbWFuZHMgaW1wbGVtZW50cyBGZWF0dXJlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBwbHVnaW46IFBsdWdpbixcbiAgICBwcml2YXRlIG9ic2lkaWFuU2V0dGluZ3M6IE9ic2lkaWFuU2V0dGluZ3MsXG4gICkge31cblxuICBhc3luYyBsb2FkKCkge1xuICAgIHRoaXMucGx1Z2luLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwiZm9sZFwiLFxuICAgICAgaWNvbjogXCJjaGV2cm9ucy1kb3duLXVwXCIsXG4gICAgICBuYW1lOiBcIkZvbGQgdGhlIGxpc3RcIixcbiAgICAgIGVkaXRvckNhbGxiYWNrOiBjcmVhdGVFZGl0b3JDYWxsYmFjayh0aGlzLmZvbGQpLFxuICAgICAgaG90a2V5czogW1xuICAgICAgICB7XG4gICAgICAgICAgbW9kaWZpZXJzOiBbXCJNb2RcIl0sXG4gICAgICAgICAga2V5OiBcIkFycm93VXBcIixcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICB0aGlzLnBsdWdpbi5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcInVuZm9sZFwiLFxuICAgICAgaWNvbjogXCJjaGV2cm9ucy11cC1kb3duXCIsXG4gICAgICBuYW1lOiBcIlVuZm9sZCB0aGUgbGlzdFwiLFxuICAgICAgZWRpdG9yQ2FsbGJhY2s6IGNyZWF0ZUVkaXRvckNhbGxiYWNrKHRoaXMudW5mb2xkKSxcbiAgICAgIGhvdGtleXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIG1vZGlmaWVyczogW1wiTW9kXCJdLFxuICAgICAgICAgIGtleTogXCJBcnJvd0Rvd25cIixcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSk7XG4gIH1cblxuICBhc3luYyB1bmxvYWQoKSB7fVxuXG4gIHByaXZhdGUgc2V0Rm9sZChlZGl0b3I6IE15RWRpdG9yLCB0eXBlOiBcImZvbGRcIiB8IFwidW5mb2xkXCIpIHtcbiAgICBpZiAoIXRoaXMub2JzaWRpYW5TZXR0aW5ncy5nZXRGb2xkU2V0dGluZ3MoKS5mb2xkSW5kZW50KSB7XG4gICAgICBuZXcgTm90aWNlKFxuICAgICAgICBgVW5hYmxlIHRvICR7dHlwZX0gYmVjYXVzZSBmb2xkaW5nIGlzIGRpc2FibGVkLiBQbGVhc2UgZW5hYmxlIFwiRm9sZCBpbmRlbnRcIiBpbiBPYnNpZGlhbiBzZXR0aW5ncy5gLFxuICAgICAgICA1MDAwLFxuICAgICAgKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGN1cnNvciA9IGVkaXRvci5nZXRDdXJzb3IoKTtcblxuICAgIGlmICh0eXBlID09PSBcImZvbGRcIikge1xuICAgICAgZWRpdG9yLmZvbGQoY3Vyc29yLmxpbmUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBlZGl0b3IudW5mb2xkKGN1cnNvci5saW5lKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHByaXZhdGUgZm9sZCA9IChlZGl0b3I6IE15RWRpdG9yKSA9PiB7XG4gICAgcmV0dXJuIHRoaXMuc2V0Rm9sZChlZGl0b3IsIFwiZm9sZFwiKTtcbiAgfTtcblxuICBwcml2YXRlIHVuZm9sZCA9IChlZGl0b3I6IE15RWRpdG9yKSA9PiB7XG4gICAgcmV0dXJuIHRoaXMuc2V0Rm9sZChlZGl0b3IsIFwidW5mb2xkXCIpO1xuICB9O1xufVxuIiwiaW1wb3J0IHsgT3BlcmF0aW9uIH0gZnJvbSBcIi4vT3BlcmF0aW9uXCI7XG5cbmltcG9ydCB7IFJvb3QsIHJlY2FsY3VsYXRlTnVtZXJpY0J1bGxldHMgfSBmcm9tIFwiLi4vcm9vdFwiO1xuXG5leHBvcnQgY2xhc3MgSW5kZW50TGlzdCBpbXBsZW1lbnRzIE9wZXJhdGlvbiB7XG4gIHByaXZhdGUgc3RvcFByb3BhZ2F0aW9uID0gZmFsc2U7XG4gIHByaXZhdGUgdXBkYXRlZCA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcm9vdDogUm9vdCxcbiAgICBwcml2YXRlIGRlZmF1bHRJbmRlbnRDaGFyczogc3RyaW5nLFxuICApIHt9XG5cbiAgc2hvdWxkU3RvcFByb3BhZ2F0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnN0b3BQcm9wYWdhdGlvbjtcbiAgfVxuXG4gIHNob3VsZFVwZGF0ZSgpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVkO1xuICB9XG5cbiAgcGVyZm9ybSgpIHtcbiAgICBjb25zdCB7IHJvb3QgfSA9IHRoaXM7XG5cbiAgICBpZiAoIXJvb3QuaGFzU2luZ2xlQ3Vyc29yKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLnN0b3BQcm9wYWdhdGlvbiA9IHRydWU7XG5cbiAgICBjb25zdCBsaXN0ID0gcm9vdC5nZXRMaXN0VW5kZXJDdXJzb3IoKTtcbiAgICBjb25zdCBwYXJlbnQgPSBsaXN0LmdldFBhcmVudCgpO1xuICAgIGNvbnN0IHByZXYgPSBwYXJlbnQuZ2V0UHJldlNpYmxpbmdPZihsaXN0KTtcblxuICAgIGlmICghcHJldikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMudXBkYXRlZCA9IHRydWU7XG5cbiAgICBjb25zdCBsaXN0U3RhcnRMaW5lQmVmb3JlID0gcm9vdC5nZXRDb250ZW50TGluZXNSYW5nZU9mKGxpc3QpWzBdO1xuXG4gICAgY29uc3QgaW5kZW50UG9zID0gbGlzdC5nZXRGaXJzdExpbmVJbmRlbnQoKS5sZW5ndGg7XG4gICAgbGV0IGluZGVudENoYXJzID0gXCJcIjtcblxuICAgIGlmIChpbmRlbnRDaGFycyA9PT0gXCJcIiAmJiAhcHJldi5pc0VtcHR5KCkpIHtcbiAgICAgIGluZGVudENoYXJzID0gcHJldlxuICAgICAgICAuZ2V0Q2hpbGRyZW4oKVswXVxuICAgICAgICAuZ2V0Rmlyc3RMaW5lSW5kZW50KClcbiAgICAgICAgLnNsaWNlKHByZXYuZ2V0Rmlyc3RMaW5lSW5kZW50KCkubGVuZ3RoKTtcbiAgICB9XG5cbiAgICBpZiAoaW5kZW50Q2hhcnMgPT09IFwiXCIpIHtcbiAgICAgIGluZGVudENoYXJzID0gbGlzdFxuICAgICAgICAuZ2V0Rmlyc3RMaW5lSW5kZW50KClcbiAgICAgICAgLnNsaWNlKHBhcmVudC5nZXRGaXJzdExpbmVJbmRlbnQoKS5sZW5ndGgpO1xuICAgIH1cblxuICAgIGlmIChpbmRlbnRDaGFycyA9PT0gXCJcIiAmJiAhbGlzdC5pc0VtcHR5KCkpIHtcbiAgICAgIGluZGVudENoYXJzID0gbGlzdC5nZXRDaGlsZHJlbigpWzBdLmdldEZpcnN0TGluZUluZGVudCgpO1xuICAgIH1cblxuICAgIGlmIChpbmRlbnRDaGFycyA9PT0gXCJcIikge1xuICAgICAgaW5kZW50Q2hhcnMgPSB0aGlzLmRlZmF1bHRJbmRlbnRDaGFycztcbiAgICB9XG5cbiAgICBwYXJlbnQucmVtb3ZlQ2hpbGQobGlzdCk7XG4gICAgcHJldi5hZGRBZnRlckFsbChsaXN0KTtcbiAgICBsaXN0LmluZGVudENvbnRlbnQoaW5kZW50UG9zLCBpbmRlbnRDaGFycyk7XG5cbiAgICBjb25zdCBsaXN0U3RhcnRMaW5lQWZ0ZXIgPSByb290LmdldENvbnRlbnRMaW5lc1JhbmdlT2YobGlzdClbMF07XG4gICAgY29uc3QgbGluZURpZmYgPSBsaXN0U3RhcnRMaW5lQWZ0ZXIgLSBsaXN0U3RhcnRMaW5lQmVmb3JlO1xuXG4gICAgY29uc3QgY3Vyc29yID0gcm9vdC5nZXRDdXJzb3IoKTtcbiAgICByb290LnJlcGxhY2VDdXJzb3Ioe1xuICAgICAgbGluZTogY3Vyc29yLmxpbmUgKyBsaW5lRGlmZixcbiAgICAgIGNoOiBjdXJzb3IuY2ggKyBpbmRlbnRDaGFycy5sZW5ndGgsXG4gICAgfSk7XG5cbiAgICByZWNhbGN1bGF0ZU51bWVyaWNCdWxsZXRzKHJvb3QpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBPcGVyYXRpb24gfSBmcm9tIFwiLi9PcGVyYXRpb25cIjtcblxuaW1wb3J0IHsgUm9vdCwgcmVjYWxjdWxhdGVOdW1lcmljQnVsbGV0cyB9IGZyb20gXCIuLi9yb290XCI7XG5cbmV4cG9ydCBjbGFzcyBNb3ZlTGlzdERvd24gaW1wbGVtZW50cyBPcGVyYXRpb24ge1xuICBwcml2YXRlIHN0b3BQcm9wYWdhdGlvbiA9IGZhbHNlO1xuICBwcml2YXRlIHVwZGF0ZWQgPSBmYWxzZTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJvb3Q6IFJvb3QpIHt9XG5cbiAgc2hvdWxkU3RvcFByb3BhZ2F0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnN0b3BQcm9wYWdhdGlvbjtcbiAgfVxuXG4gIHNob3VsZFVwZGF0ZSgpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVkO1xuICB9XG5cbiAgcGVyZm9ybSgpIHtcbiAgICBjb25zdCB7IHJvb3QgfSA9IHRoaXM7XG5cbiAgICBpZiAoIXJvb3QuaGFzU2luZ2xlQ3Vyc29yKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLnN0b3BQcm9wYWdhdGlvbiA9IHRydWU7XG5cbiAgICBjb25zdCBsaXN0ID0gcm9vdC5nZXRMaXN0VW5kZXJDdXJzb3IoKTtcbiAgICBjb25zdCBwYXJlbnQgPSBsaXN0LmdldFBhcmVudCgpO1xuICAgIGNvbnN0IGdyYW5kUGFyZW50ID0gcGFyZW50LmdldFBhcmVudCgpO1xuICAgIGNvbnN0IG5leHQgPSBwYXJlbnQuZ2V0TmV4dFNpYmxpbmdPZihsaXN0KTtcblxuICAgIGNvbnN0IGxpc3RTdGFydExpbmVCZWZvcmUgPSByb290LmdldENvbnRlbnRMaW5lc1JhbmdlT2YobGlzdClbMF07XG5cbiAgICBpZiAoIW5leHQgJiYgZ3JhbmRQYXJlbnQpIHtcbiAgICAgIGNvbnN0IG5ld1BhcmVudCA9IGdyYW5kUGFyZW50LmdldE5leHRTaWJsaW5nT2YocGFyZW50KTtcblxuICAgICAgaWYgKG5ld1BhcmVudCkge1xuICAgICAgICB0aGlzLnVwZGF0ZWQgPSB0cnVlO1xuICAgICAgICBwYXJlbnQucmVtb3ZlQ2hpbGQobGlzdCk7XG4gICAgICAgIG5ld1BhcmVudC5hZGRCZWZvcmVBbGwobGlzdCk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChuZXh0KSB7XG4gICAgICB0aGlzLnVwZGF0ZWQgPSB0cnVlO1xuICAgICAgcGFyZW50LnJlbW92ZUNoaWxkKGxpc3QpO1xuICAgICAgcGFyZW50LmFkZEFmdGVyKG5leHQsIGxpc3QpO1xuICAgIH1cblxuICAgIGlmICghdGhpcy51cGRhdGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgbGlzdFN0YXJ0TGluZUFmdGVyID0gcm9vdC5nZXRDb250ZW50TGluZXNSYW5nZU9mKGxpc3QpWzBdO1xuICAgIGNvbnN0IGxpbmVEaWZmID0gbGlzdFN0YXJ0TGluZUFmdGVyIC0gbGlzdFN0YXJ0TGluZUJlZm9yZTtcblxuICAgIGNvbnN0IGN1cnNvciA9IHJvb3QuZ2V0Q3Vyc29yKCk7XG4gICAgcm9vdC5yZXBsYWNlQ3Vyc29yKHtcbiAgICAgIGxpbmU6IGN1cnNvci5saW5lICsgbGluZURpZmYsXG4gICAgICBjaDogY3Vyc29yLmNoLFxuICAgIH0pO1xuXG4gICAgcmVjYWxjdWxhdGVOdW1lcmljQnVsbGV0cyhyb290KTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgT3BlcmF0aW9uIH0gZnJvbSBcIi4vT3BlcmF0aW9uXCI7XG5cbmltcG9ydCB7IFJvb3QsIHJlY2FsY3VsYXRlTnVtZXJpY0J1bGxldHMgfSBmcm9tIFwiLi4vcm9vdFwiO1xuXG5leHBvcnQgY2xhc3MgTW92ZUxpc3RVcCBpbXBsZW1lbnRzIE9wZXJhdGlvbiB7XG4gIHByaXZhdGUgc3RvcFByb3BhZ2F0aW9uID0gZmFsc2U7XG4gIHByaXZhdGUgdXBkYXRlZCA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcm9vdDogUm9vdCkge31cblxuICBzaG91bGRTdG9wUHJvcGFnYXRpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuc3RvcFByb3BhZ2F0aW9uO1xuICB9XG5cbiAgc2hvdWxkVXBkYXRlKCkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZWQ7XG4gIH1cblxuICBwZXJmb3JtKCkge1xuICAgIGNvbnN0IHsgcm9vdCB9ID0gdGhpcztcblxuICAgIGlmICghcm9vdC5oYXNTaW5nbGVDdXJzb3IoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuc3RvcFByb3BhZ2F0aW9uID0gdHJ1ZTtcblxuICAgIGNvbnN0IGxpc3QgPSByb290LmdldExpc3RVbmRlckN1cnNvcigpO1xuICAgIGNvbnN0IHBhcmVudCA9IGxpc3QuZ2V0UGFyZW50KCk7XG4gICAgY29uc3QgZ3JhbmRQYXJlbnQgPSBwYXJlbnQuZ2V0UGFyZW50KCk7XG4gICAgY29uc3QgcHJldiA9IHBhcmVudC5nZXRQcmV2U2libGluZ09mKGxpc3QpO1xuXG4gICAgY29uc3QgbGlzdFN0YXJ0TGluZUJlZm9yZSA9IHJvb3QuZ2V0Q29udGVudExpbmVzUmFuZ2VPZihsaXN0KVswXTtcblxuICAgIGlmICghcHJldiAmJiBncmFuZFBhcmVudCkge1xuICAgICAgY29uc3QgbmV3UGFyZW50ID0gZ3JhbmRQYXJlbnQuZ2V0UHJldlNpYmxpbmdPZihwYXJlbnQpO1xuXG4gICAgICBpZiAobmV3UGFyZW50KSB7XG4gICAgICAgIHRoaXMudXBkYXRlZCA9IHRydWU7XG4gICAgICAgIHBhcmVudC5yZW1vdmVDaGlsZChsaXN0KTtcbiAgICAgICAgbmV3UGFyZW50LmFkZEFmdGVyQWxsKGxpc3QpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAocHJldikge1xuICAgICAgdGhpcy51cGRhdGVkID0gdHJ1ZTtcbiAgICAgIHBhcmVudC5yZW1vdmVDaGlsZChsaXN0KTtcbiAgICAgIHBhcmVudC5hZGRCZWZvcmUocHJldiwgbGlzdCk7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLnVwZGF0ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBsaXN0U3RhcnRMaW5lQWZ0ZXIgPSByb290LmdldENvbnRlbnRMaW5lc1JhbmdlT2YobGlzdClbMF07XG4gICAgY29uc3QgbGluZURpZmYgPSBsaXN0U3RhcnRMaW5lQWZ0ZXIgLSBsaXN0U3RhcnRMaW5lQmVmb3JlO1xuXG4gICAgY29uc3QgY3Vyc29yID0gcm9vdC5nZXRDdXJzb3IoKTtcbiAgICByb290LnJlcGxhY2VDdXJzb3Ioe1xuICAgICAgbGluZTogY3Vyc29yLmxpbmUgKyBsaW5lRGlmZixcbiAgICAgIGNoOiBjdXJzb3IuY2gsXG4gICAgfSk7XG5cbiAgICByZWNhbGN1bGF0ZU51bWVyaWNCdWxsZXRzKHJvb3QpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBQbHVnaW4gfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuaW1wb3J0IHsgRmVhdHVyZSB9IGZyb20gXCIuL0ZlYXR1cmVcIjtcblxuaW1wb3J0IHsgTXlFZGl0b3IgfSBmcm9tIFwiLi4vZWRpdG9yXCI7XG5pbXBvcnQgeyBJbmRlbnRMaXN0IH0gZnJvbSBcIi4uL29wZXJhdGlvbnMvSW5kZW50TGlzdFwiO1xuaW1wb3J0IHsgTW92ZUxpc3REb3duIH0gZnJvbSBcIi4uL29wZXJhdGlvbnMvTW92ZUxpc3REb3duXCI7XG5pbXBvcnQgeyBNb3ZlTGlzdFVwIH0gZnJvbSBcIi4uL29wZXJhdGlvbnMvTW92ZUxpc3RVcFwiO1xuaW1wb3J0IHsgT3V0ZGVudExpc3QgfSBmcm9tIFwiLi4vb3BlcmF0aW9ucy9PdXRkZW50TGlzdFwiO1xuaW1wb3J0IHsgT2JzaWRpYW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXJ2aWNlcy9PYnNpZGlhblNldHRpbmdzXCI7XG5pbXBvcnQgeyBPcGVyYXRpb25QZXJmb3JtZXIgfSBmcm9tIFwiLi4vc2VydmljZXMvT3BlcmF0aW9uUGVyZm9ybWVyXCI7XG5pbXBvcnQgeyBjcmVhdGVFZGl0b3JDYWxsYmFjayB9IGZyb20gXCIuLi91dGlscy9jcmVhdGVFZGl0b3JDYWxsYmFja1wiO1xuXG5leHBvcnQgY2xhc3MgTGlzdHNNb3ZlbWVudENvbW1hbmRzIGltcGxlbWVudHMgRmVhdHVyZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcGx1Z2luOiBQbHVnaW4sXG4gICAgcHJpdmF0ZSBvYnNpZGlhblNldHRpbmdzOiBPYnNpZGlhblNldHRpbmdzLFxuICAgIHByaXZhdGUgb3BlcmF0aW9uUGVyZm9ybWVyOiBPcGVyYXRpb25QZXJmb3JtZXIsXG4gICkge31cblxuICBhc3luYyBsb2FkKCkge1xuICAgIHRoaXMucGx1Z2luLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwibW92ZS1saXN0LWl0ZW0tdXBcIixcbiAgICAgIGljb246IFwiYXJyb3ctdXBcIixcbiAgICAgIG5hbWU6IFwiTW92ZSBsaXN0IGFuZCBzdWJsaXN0cyB1cFwiLFxuICAgICAgZWRpdG9yQ2FsbGJhY2s6IGNyZWF0ZUVkaXRvckNhbGxiYWNrKHRoaXMubW92ZUxpc3RVcCksXG4gICAgICBob3RrZXlzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBtb2RpZmllcnM6IFtcIk1vZFwiLCBcIlNoaWZ0XCJdLFxuICAgICAgICAgIGtleTogXCJBcnJvd1VwXCIsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgdGhpcy5wbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJtb3ZlLWxpc3QtaXRlbS1kb3duXCIsXG4gICAgICBpY29uOiBcImFycm93LWRvd25cIixcbiAgICAgIG5hbWU6IFwiTW92ZSBsaXN0IGFuZCBzdWJsaXN0cyBkb3duXCIsXG4gICAgICBlZGl0b3JDYWxsYmFjazogY3JlYXRlRWRpdG9yQ2FsbGJhY2sodGhpcy5tb3ZlTGlzdERvd24pLFxuICAgICAgaG90a2V5czogW1xuICAgICAgICB7XG4gICAgICAgICAgbW9kaWZpZXJzOiBbXCJNb2RcIiwgXCJTaGlmdFwiXSxcbiAgICAgICAgICBrZXk6IFwiQXJyb3dEb3duXCIsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgdGhpcy5wbHVnaW4uYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJpbmRlbnQtbGlzdFwiLFxuICAgICAgaWNvbjogXCJpbmRlbnRcIixcbiAgICAgIG5hbWU6IFwiSW5kZW50IHRoZSBsaXN0IGFuZCBzdWJsaXN0c1wiLFxuICAgICAgZWRpdG9yQ2FsbGJhY2s6IGNyZWF0ZUVkaXRvckNhbGxiYWNrKHRoaXMuaW5kZW50TGlzdCksXG4gICAgICBob3RrZXlzOiBbXSxcbiAgICB9KTtcblxuICAgIHRoaXMucGx1Z2luLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwib3V0ZGVudC1saXN0XCIsXG4gICAgICBpY29uOiBcIm91dGRlbnRcIixcbiAgICAgIG5hbWU6IFwiT3V0ZGVudCB0aGUgbGlzdCBhbmQgc3VibGlzdHNcIixcbiAgICAgIGVkaXRvckNhbGxiYWNrOiBjcmVhdGVFZGl0b3JDYWxsYmFjayh0aGlzLm91dGRlbnRMaXN0KSxcbiAgICAgIGhvdGtleXM6IFtdLFxuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgdW5sb2FkKCkge31cblxuICBwcml2YXRlIG1vdmVMaXN0RG93biA9IChlZGl0b3I6IE15RWRpdG9yKSA9PiB7XG4gICAgY29uc3QgeyBzaG91bGRTdG9wUHJvcGFnYXRpb24gfSA9IHRoaXMub3BlcmF0aW9uUGVyZm9ybWVyLnBlcmZvcm0oXG4gICAgICAocm9vdCkgPT4gbmV3IE1vdmVMaXN0RG93bihyb290KSxcbiAgICAgIGVkaXRvcixcbiAgICApO1xuXG4gICAgcmV0dXJuIHNob3VsZFN0b3BQcm9wYWdhdGlvbjtcbiAgfTtcblxuICBwcml2YXRlIG1vdmVMaXN0VXAgPSAoZWRpdG9yOiBNeUVkaXRvcikgPT4ge1xuICAgIGNvbnN0IHsgc2hvdWxkU3RvcFByb3BhZ2F0aW9uIH0gPSB0aGlzLm9wZXJhdGlvblBlcmZvcm1lci5wZXJmb3JtKFxuICAgICAgKHJvb3QpID0+IG5ldyBNb3ZlTGlzdFVwKHJvb3QpLFxuICAgICAgZWRpdG9yLFxuICAgICk7XG5cbiAgICByZXR1cm4gc2hvdWxkU3RvcFByb3BhZ2F0aW9uO1xuICB9O1xuXG4gIHByaXZhdGUgaW5kZW50TGlzdCA9IChlZGl0b3I6IE15RWRpdG9yKSA9PiB7XG4gICAgY29uc3QgeyBzaG91bGRTdG9wUHJvcGFnYXRpb24gfSA9IHRoaXMub3BlcmF0aW9uUGVyZm9ybWVyLnBlcmZvcm0oXG4gICAgICAocm9vdCkgPT5cbiAgICAgICAgbmV3IEluZGVudExpc3Qocm9vdCwgdGhpcy5vYnNpZGlhblNldHRpbmdzLmdldERlZmF1bHRJbmRlbnRDaGFycygpKSxcbiAgICAgIGVkaXRvcixcbiAgICApO1xuXG4gICAgcmV0dXJuIHNob3VsZFN0b3BQcm9wYWdhdGlvbjtcbiAgfTtcblxuICBwcml2YXRlIG91dGRlbnRMaXN0ID0gKGVkaXRvcjogTXlFZGl0b3IpID0+IHtcbiAgICBjb25zdCB7IHNob3VsZFN0b3BQcm9wYWdhdGlvbiB9ID0gdGhpcy5vcGVyYXRpb25QZXJmb3JtZXIucGVyZm9ybShcbiAgICAgIChyb290KSA9PiBuZXcgT3V0ZGVudExpc3Qocm9vdCksXG4gICAgICBlZGl0b3IsXG4gICAgKTtcblxuICAgIHJldHVybiBzaG91bGRTdG9wUHJvcGFnYXRpb247XG4gIH07XG59XG4iLCJpbXBvcnQgeyBPcGVyYXRpb24gfSBmcm9tIFwiLi9PcGVyYXRpb25cIjtcblxuaW1wb3J0IHsgUm9vdCB9IGZyb20gXCIuLi9yb290XCI7XG5cbmV4cG9ydCBjbGFzcyBEZWxldGVUaWxsQ3VycmVudExpbmVDb250ZW50U3RhcnQgaW1wbGVtZW50cyBPcGVyYXRpb24ge1xuICBwcml2YXRlIHN0b3BQcm9wYWdhdGlvbiA9IGZhbHNlO1xuICBwcml2YXRlIHVwZGF0ZWQgPSBmYWxzZTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJvb3Q6IFJvb3QpIHt9XG5cbiAgc2hvdWxkU3RvcFByb3BhZ2F0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnN0b3BQcm9wYWdhdGlvbjtcbiAgfVxuXG4gIHNob3VsZFVwZGF0ZSgpIHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVkO1xuICB9XG5cbiAgcGVyZm9ybSgpIHtcbiAgICBjb25zdCB7IHJvb3QgfSA9IHRoaXM7XG5cbiAgICBpZiAoIXJvb3QuaGFzU2luZ2xlQ3Vyc29yKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLnN0b3BQcm9wYWdhdGlvbiA9IHRydWU7XG4gICAgdGhpcy51cGRhdGVkID0gdHJ1ZTtcblxuICAgIGNvbnN0IGN1cnNvciA9IHJvb3QuZ2V0Q3Vyc29yKCk7XG4gICAgY29uc3QgbGlzdCA9IHJvb3QuZ2V0TGlzdFVuZGVyQ3Vyc29yKCk7XG4gICAgY29uc3QgbGluZXMgPSBsaXN0LmdldExpbmVzSW5mbygpO1xuICAgIGNvbnN0IGxpbmVObyA9IGxpbmVzLmZpbmRJbmRleCgobCkgPT4gbC5mcm9tLmxpbmUgPT09IGN1cnNvci5saW5lKTtcblxuICAgIGxpbmVzW2xpbmVOb10udGV4dCA9IGxpbmVzW2xpbmVOb10udGV4dC5zbGljZShcbiAgICAgIGN1cnNvci5jaCAtIGxpbmVzW2xpbmVOb10uZnJvbS5jaCxcbiAgICApO1xuXG4gICAgbGlzdC5yZXBsYWNlTGluZXMobGluZXMubWFwKChsKSA9PiBsLnRleHQpKTtcbiAgICByb290LnJlcGxhY2VDdXJzb3IobGluZXNbbGluZU5vXS5mcm9tKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgUGx1Z2luIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmltcG9ydCB7IGtleW1hcCB9IGZyb20gXCJAY29kZW1pcnJvci92aWV3XCI7XG5cbmltcG9ydCB7IEZlYXR1cmUgfSBmcm9tIFwiLi9GZWF0dXJlXCI7XG5cbmltcG9ydCB7IE15RWRpdG9yIH0gZnJvbSBcIi4uL2VkaXRvclwiO1xuaW1wb3J0IHsgRGVsZXRlVGlsbEN1cnJlbnRMaW5lQ29udGVudFN0YXJ0IH0gZnJvbSBcIi4uL29wZXJhdGlvbnMvRGVsZXRlVGlsbEN1cnJlbnRMaW5lQ29udGVudFN0YXJ0XCI7XG5pbXBvcnQgeyBJTUVEZXRlY3RvciB9IGZyb20gXCIuLi9zZXJ2aWNlcy9JTUVEZXRlY3RvclwiO1xuaW1wb3J0IHsgT3BlcmF0aW9uUGVyZm9ybWVyIH0gZnJvbSBcIi4uL3NlcnZpY2VzL09wZXJhdGlvblBlcmZvcm1lclwiO1xuaW1wb3J0IHsgU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2VydmljZXMvU2V0dGluZ3NcIjtcbmltcG9ydCB7IGNyZWF0ZUtleW1hcFJ1bkNhbGxiYWNrIH0gZnJvbSBcIi4uL3V0aWxzL2NyZWF0ZUtleW1hcFJ1bkNhbGxiYWNrXCI7XG5cbmV4cG9ydCBjbGFzcyBNZXRhQmFja3NwYWNlQmVoYXZpb3VyT3ZlcnJpZGUgaW1wbGVtZW50cyBGZWF0dXJlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBwbHVnaW46IFBsdWdpbixcbiAgICBwcml2YXRlIHNldHRpbmdzOiBTZXR0aW5ncyxcbiAgICBwcml2YXRlIGltZURldGVjdG9yOiBJTUVEZXRlY3RvcixcbiAgICBwcml2YXRlIG9wZXJhdGlvblBlcmZvcm1lcjogT3BlcmF0aW9uUGVyZm9ybWVyLFxuICApIHt9XG5cbiAgYXN5bmMgbG9hZCgpIHtcbiAgICB0aGlzLnBsdWdpbi5yZWdpc3RlckVkaXRvckV4dGVuc2lvbihcbiAgICAgIGtleW1hcC5vZihbXG4gICAgICAgIHtcbiAgICAgICAgICBtYWM6IFwibS1CYWNrc3BhY2VcIixcbiAgICAgICAgICBydW46IGNyZWF0ZUtleW1hcFJ1bkNhbGxiYWNrKHtcbiAgICAgICAgICAgIGNoZWNrOiB0aGlzLmNoZWNrLFxuICAgICAgICAgICAgcnVuOiB0aGlzLnJ1bixcbiAgICAgICAgICB9KSxcbiAgICAgICAgfSxcbiAgICAgIF0pLFxuICAgICk7XG4gIH1cblxuICBhc3luYyB1bmxvYWQoKSB7fVxuXG4gIHByaXZhdGUgY2hlY2sgPSAoKSA9PiB7XG4gICAgcmV0dXJuIChcbiAgICAgIHRoaXMuc2V0dGluZ3Mua2VlcEN1cnNvcldpdGhpbkNvbnRlbnQgIT09IFwibmV2ZXJcIiAmJlxuICAgICAgIXRoaXMuaW1lRGV0ZWN0b3IuaXNPcGVuZWQoKVxuICAgICk7XG4gIH07XG5cbiAgcHJpdmF0ZSBydW4gPSAoZWRpdG9yOiBNeUVkaXRvcikgPT4ge1xuICAgIHJldHVybiB0aGlzLm9wZXJhdGlvblBlcmZvcm1lci5wZXJmb3JtKFxuICAgICAgKHJvb3QpID0+IG5ldyBEZWxldGVUaWxsQ3VycmVudExpbmVDb250ZW50U3RhcnQocm9vdCksXG4gICAgICBlZGl0b3IsXG4gICAgKTtcbiAgfTtcbn1cbiIsImltcG9ydCB7IEFwcCwgUGx1Z2luLCBQbHVnaW5TZXR0aW5nVGFiLCBTZXR0aW5nIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmltcG9ydCB7IEZlYXR1cmUgfSBmcm9tIFwiLi9GZWF0dXJlXCI7XG5cbmltcG9ydCB7XG4gIEtlZXBDdXJzb3JXaXRoaW5Db250ZW50LFxuICBTZXR0aW5ncyxcbiAgVmVydGljYWxMaW5lc0FjdGlvbixcbn0gZnJvbSBcIi4uL3NlcnZpY2VzL1NldHRpbmdzXCI7XG5cbmNsYXNzIE9ic2lkaWFuT3V0bGluZXJQbHVnaW5TZXR0aW5nVGFiIGV4dGVuZHMgUGx1Z2luU2V0dGluZ1RhYiB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIGFwcDogQXBwLFxuICAgIHBsdWdpbjogUGx1Z2luLFxuICAgIHByaXZhdGUgc2V0dGluZ3M6IFNldHRpbmdzLFxuICApIHtcbiAgICBzdXBlcihhcHAsIHBsdWdpbik7XG4gIH1cblxuICBkaXNwbGF5KCk6IHZvaWQge1xuICAgIGNvbnN0IHsgY29udGFpbmVyRWwgfSA9IHRoaXM7XG5cbiAgICBjb250YWluZXJFbC5lbXB0eSgpO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlN0aWNrIHRoZSBjdXJzb3IgdG8gdGhlIGNvbnRlbnRcIilcbiAgICAgIC5zZXREZXNjKFwiRG9uJ3QgbGV0IHRoZSBjdXJzb3IgbW92ZSB0byB0aGUgYnVsbGV0IHBvc2l0aW9uLlwiKVxuICAgICAgLmFkZERyb3Bkb3duKChkcm9wZG93bikgPT4ge1xuICAgICAgICBkcm9wZG93blxuICAgICAgICAgIC5hZGRPcHRpb25zKHtcbiAgICAgICAgICAgIG5ldmVyOiBcIk5ldmVyXCIsXG4gICAgICAgICAgICBcImJ1bGxldC1vbmx5XCI6IFwiU3RpY2sgY3Vyc29yIG91dCBvZiBidWxsZXRzXCIsXG4gICAgICAgICAgICBcImJ1bGxldC1hbmQtY2hlY2tib3hcIjogXCJTdGljayBjdXJzb3Igb3V0IG9mIGJ1bGxldHMgYW5kIGNoZWNrYm94ZXNcIixcbiAgICAgICAgICB9IGFzIHsgW2tleSBpbiBLZWVwQ3Vyc29yV2l0aGluQ29udGVudF06IHN0cmluZyB9KVxuICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnNldHRpbmdzLmtlZXBDdXJzb3JXaXRoaW5Db250ZW50KVxuICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWU6IEtlZXBDdXJzb3JXaXRoaW5Db250ZW50KSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNldHRpbmdzLmtlZXBDdXJzb3JXaXRoaW5Db250ZW50ID0gdmFsdWU7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnNldHRpbmdzLnNhdmUoKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkVuaGFuY2UgdGhlIFRhYiBrZXlcIilcbiAgICAgIC5zZXREZXNjKFwiTWFrZSBUYWIgYW5kIFNoaWZ0LVRhYiBiZWhhdmUgdGhlIHNhbWUgYXMgb3RoZXIgb3V0bGluZXJzLlwiKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PiB7XG4gICAgICAgIHRvZ2dsZVxuICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnNldHRpbmdzLm92ZXJyaWRlVGFiQmVoYXZpb3VyKVxuICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc2V0dGluZ3Mub3ZlcnJpZGVUYWJCZWhhdmlvdXIgPSB2YWx1ZTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuc2V0dGluZ3Muc2F2ZSgpO1xuICAgICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiRW5oYW5jZSB0aGUgRW50ZXIga2V5XCIpXG4gICAgICAuc2V0RGVzYyhcIk1ha2UgdGhlIEVudGVyIGtleSBiZWhhdmUgdGhlIHNhbWUgYXMgb3RoZXIgb3V0bGluZXJzLlwiKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PiB7XG4gICAgICAgIHRvZ2dsZVxuICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnNldHRpbmdzLm92ZXJyaWRlRW50ZXJCZWhhdmlvdXIpXG4gICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy5vdmVycmlkZUVudGVyQmVoYXZpb3VyID0gdmFsdWU7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnNldHRpbmdzLnNhdmUoKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlZpbS1tb2RlIG8vTyBpbnNlcnRzIGJ1bGxldHNcIilcbiAgICAgIC5zZXREZXNjKFwiQ3JlYXRlIGEgYnVsbGV0IHdoZW4gcHJlc3NpbmcgbyBvciBPIGluIFZpbSBtb2RlLlwiKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PiB7XG4gICAgICAgIHRvZ2dsZVxuICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnNldHRpbmdzLm92ZXJyaWRlVmltT0JlaGF2aW91cilcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNldHRpbmdzLm92ZXJyaWRlVmltT0JlaGF2aW91ciA9IHZhbHVlO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5zZXR0aW5ncy5zYXZlKCk7XG4gICAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJFbmhhbmNlIHRoZSBDdHJsK0Egb3IgQ21kK0EgYmVoYXZpb3JcIilcbiAgICAgIC5zZXREZXNjKFxuICAgICAgICBcIlByZXNzIHRoZSBob3RrZXkgb25jZSB0byBzZWxlY3QgdGhlIGN1cnJlbnQgbGlzdCBpdGVtLiBQcmVzcyB0aGUgaG90a2V5IHR3aWNlIHRvIHNlbGVjdCB0aGUgZW50aXJlIGxpc3QuXCIsXG4gICAgICApXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+IHtcbiAgICAgICAgdG9nZ2xlXG4gICAgICAgICAgLnNldFZhbHVlKHRoaXMuc2V0dGluZ3Mub3ZlcnJpZGVTZWxlY3RBbGxCZWhhdmlvdXIpXG4gICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy5vdmVycmlkZVNlbGVjdEFsbEJlaGF2aW91ciA9IHZhbHVlO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5zZXR0aW5ncy5zYXZlKCk7XG4gICAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJJbXByb3ZlIHRoZSBzdHlsZSBvZiB5b3VyIGxpc3RzXCIpXG4gICAgICAuc2V0RGVzYyhcbiAgICAgICAgXCJTdHlsZXMgYXJlIG9ubHkgY29tcGF0aWJsZSB3aXRoIGJ1aWx0LWluIE9ic2lkaWFuIHRoZW1lcyBhbmQgbWF5IG5vdCBiZSBjb21wYXRpYmxlIHdpdGggb3RoZXIgdGhlbWVzLlwiLFxuICAgICAgKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PiB7XG4gICAgICAgIHRvZ2dsZVxuICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnNldHRpbmdzLmJldHRlckxpc3RzU3R5bGVzKVxuICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc2V0dGluZ3MuYmV0dGVyTGlzdHNTdHlsZXMgPSB2YWx1ZTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuc2V0dGluZ3Muc2F2ZSgpO1xuICAgICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiRHJhdyB2ZXJ0aWNhbCBpbmRlbnRhdGlvbiBsaW5lc1wiKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PiB7XG4gICAgICAgIHRvZ2dsZS5zZXRWYWx1ZSh0aGlzLnNldHRpbmdzLnZlcnRpY2FsTGluZXMpLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIHRoaXMuc2V0dGluZ3MudmVydGljYWxMaW5lcyA9IHZhbHVlO1xuICAgICAgICAgIGF3YWl0IHRoaXMuc2V0dGluZ3Muc2F2ZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIlZlcnRpY2FsIGluZGVudGF0aW9uIGxpbmUgY2xpY2sgYWN0aW9uXCIpXG4gICAgICAuYWRkRHJvcGRvd24oKGRyb3Bkb3duKSA9PiB7XG4gICAgICAgIGRyb3Bkb3duXG4gICAgICAgICAgLmFkZE9wdGlvbnMoe1xuICAgICAgICAgICAgbm9uZTogXCJOb25lXCIsXG4gICAgICAgICAgICBcInpvb20taW5cIjogXCJab29tIEluXCIsXG4gICAgICAgICAgICBcInRvZ2dsZS1mb2xkaW5nXCI6IFwiVG9nZ2xlIEZvbGRpbmdcIixcbiAgICAgICAgICB9IGFzIHsgW2tleSBpbiBWZXJ0aWNhbExpbmVzQWN0aW9uXTogc3RyaW5nIH0pXG4gICAgICAgICAgLnNldFZhbHVlKHRoaXMuc2V0dGluZ3MudmVydGljYWxMaW5lc0FjdGlvbilcbiAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlOiBWZXJ0aWNhbExpbmVzQWN0aW9uKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNldHRpbmdzLnZlcnRpY2FsTGluZXNBY3Rpb24gPSB2YWx1ZTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuc2V0dGluZ3Muc2F2ZSgpO1xuICAgICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbCkuc2V0TmFtZShcIkRyYWctYW5kLURyb3BcIikuYWRkVG9nZ2xlKCh0b2dnbGUpID0+IHtcbiAgICAgIHRvZ2dsZS5zZXRWYWx1ZSh0aGlzLnNldHRpbmdzLmRyYWdBbmREcm9wKS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgdGhpcy5zZXR0aW5ncy5kcmFnQW5kRHJvcCA9IHZhbHVlO1xuICAgICAgICBhd2FpdCB0aGlzLnNldHRpbmdzLnNhdmUoKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkRlYnVnIG1vZGVcIilcbiAgICAgIC5zZXREZXNjKFxuICAgICAgICBcIk9wZW4gRGV2VG9vbHMgKENvbW1hbmQrT3B0aW9uK0kgb3IgQ29udHJvbCtTaGlmdCtJKSB0byBjb3B5IHRoZSBkZWJ1ZyBsb2dzLlwiLFxuICAgICAgKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PiB7XG4gICAgICAgIHRvZ2dsZS5zZXRWYWx1ZSh0aGlzLnNldHRpbmdzLmRlYnVnKS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICB0aGlzLnNldHRpbmdzLmRlYnVnID0gdmFsdWU7XG4gICAgICAgICAgYXdhaXQgdGhpcy5zZXR0aW5ncy5zYXZlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFNldHRpbmdzVGFiIGltcGxlbWVudHMgRmVhdHVyZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcGx1Z2luOiBQbHVnaW4sXG4gICAgcHJpdmF0ZSBzZXR0aW5nczogU2V0dGluZ3MsXG4gICkge31cblxuICBhc3luYyBsb2FkKCkge1xuICAgIHRoaXMucGx1Z2luLmFkZFNldHRpbmdUYWIoXG4gICAgICBuZXcgT2JzaWRpYW5PdXRsaW5lclBsdWdpblNldHRpbmdUYWIoXG4gICAgICAgIHRoaXMucGx1Z2luLmFwcCxcbiAgICAgICAgdGhpcy5wbHVnaW4sXG4gICAgICAgIHRoaXMuc2V0dGluZ3MsXG4gICAgICApLFxuICAgICk7XG4gIH1cblxuICBhc3luYyB1bmxvYWQoKSB7fVxufVxuIiwiaW1wb3J0IHsgUGx1Z2luIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmltcG9ydCB7IFByZWMgfSBmcm9tIFwiQGNvZGVtaXJyb3Ivc3RhdGVcIjtcbmltcG9ydCB7IGtleW1hcCB9IGZyb20gXCJAY29kZW1pcnJvci92aWV3XCI7XG5cbmltcG9ydCB7IEZlYXR1cmUgfSBmcm9tIFwiLi9GZWF0dXJlXCI7XG5cbmltcG9ydCB7IE15RWRpdG9yIH0gZnJvbSBcIi4uL2VkaXRvclwiO1xuaW1wb3J0IHsgT3V0ZGVudExpc3QgfSBmcm9tIFwiLi4vb3BlcmF0aW9ucy9PdXRkZW50TGlzdFwiO1xuaW1wb3J0IHsgSU1FRGV0ZWN0b3IgfSBmcm9tIFwiLi4vc2VydmljZXMvSU1FRGV0ZWN0b3JcIjtcbmltcG9ydCB7IE9wZXJhdGlvblBlcmZvcm1lciB9IGZyb20gXCIuLi9zZXJ2aWNlcy9PcGVyYXRpb25QZXJmb3JtZXJcIjtcbmltcG9ydCB7IFNldHRpbmdzIH0gZnJvbSBcIi4uL3NlcnZpY2VzL1NldHRpbmdzXCI7XG5pbXBvcnQgeyBjcmVhdGVLZXltYXBSdW5DYWxsYmFjayB9IGZyb20gXCIuLi91dGlscy9jcmVhdGVLZXltYXBSdW5DYWxsYmFja1wiO1xuXG5leHBvcnQgY2xhc3MgU2hpZnRUYWJCZWhhdmlvdXJPdmVycmlkZSBpbXBsZW1lbnRzIEZlYXR1cmUge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHBsdWdpbjogUGx1Z2luLFxuICAgIHByaXZhdGUgaW1lRGV0ZWN0b3I6IElNRURldGVjdG9yLFxuICAgIHByaXZhdGUgc2V0dGluZ3M6IFNldHRpbmdzLFxuICAgIHByaXZhdGUgb3BlcmF0aW9uUGVyZm9ybWVyOiBPcGVyYXRpb25QZXJmb3JtZXIsXG4gICkge31cblxuICBhc3luYyBsb2FkKCkge1xuICAgIHRoaXMucGx1Z2luLnJlZ2lzdGVyRWRpdG9yRXh0ZW5zaW9uKFxuICAgICAgUHJlYy5oaWdoZXN0KFxuICAgICAgICBrZXltYXAub2YoW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIGtleTogXCJzLVRhYlwiLFxuICAgICAgICAgICAgcnVuOiBjcmVhdGVLZXltYXBSdW5DYWxsYmFjayh7XG4gICAgICAgICAgICAgIGNoZWNrOiB0aGlzLmNoZWNrLFxuICAgICAgICAgICAgICBydW46IHRoaXMucnVuLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgfSxcbiAgICAgICAgXSksXG4gICAgICApLFxuICAgICk7XG4gIH1cblxuICBhc3luYyB1bmxvYWQoKSB7fVxuXG4gIHByaXZhdGUgY2hlY2sgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHRoaXMuc2V0dGluZ3Mub3ZlcnJpZGVUYWJCZWhhdmlvdXIgJiYgIXRoaXMuaW1lRGV0ZWN0b3IuaXNPcGVuZWQoKTtcbiAgfTtcblxuICBwcml2YXRlIHJ1biA9IChlZGl0b3I6IE15RWRpdG9yKSA9PiB7XG4gICAgcmV0dXJuIHRoaXMub3BlcmF0aW9uUGVyZm9ybWVyLnBlcmZvcm0oXG4gICAgICAocm9vdCkgPT4gbmV3IE91dGRlbnRMaXN0KHJvb3QpLFxuICAgICAgZWRpdG9yLFxuICAgICk7XG4gIH07XG59XG4iLCJpbXBvcnQgeyBBcHAsIE1vZGFsLCBQbHVnaW4gfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuaW1wb3J0IHsgRmVhdHVyZSB9IGZyb20gXCIuL0ZlYXR1cmVcIjtcblxuaW1wb3J0IHsgU2V0dGluZ3MgfSBmcm9tIFwiLi4vc2VydmljZXMvU2V0dGluZ3NcIjtcblxuaW50ZXJmYWNlIEFwcEhpZGRlblByb3BzIHtcbiAgaW50ZXJuYWxQbHVnaW5zOiB7XG4gICAgY29uZmlnOiB7IFtrZXk6IHN0cmluZ106IGJvb2xlYW4gfTtcbiAgfTtcbiAgaXNNb2JpbGU6IGJvb2xlYW47XG4gIHBsdWdpbnM6IHtcbiAgICBlbmFibGVkUGx1Z2luczogU2V0PHN0cmluZz47XG4gICAgbWFuaWZlc3RzOiB7IFtrZXk6IHN0cmluZ106IHsgdmVyc2lvbjogc3RyaW5nIH0gfTtcbiAgfTtcbiAgdmF1bHQ6IHtcbiAgICBjb25maWc6IG9iamVjdDtcbiAgfTtcbn1cblxuY2xhc3MgU3lzdGVtSW5mb01vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBjb25zdHJ1Y3RvcihcbiAgICBhcHA6IEFwcCxcbiAgICBwcml2YXRlIHNldHRpbmdzOiBTZXR0aW5ncyxcbiAgKSB7XG4gICAgc3VwZXIoYXBwKTtcbiAgfVxuXG4gIGFzeW5jIG9uT3BlbigpIHtcbiAgICB0aGlzLnRpdGxlRWwuc2V0VGV4dChcIlN5c3RlbSBJbmZvcm1hdGlvblwiKTtcblxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gICAgY29uc3QgYXBwID0gdGhpcy5hcHAgYXMgYW55IGFzIEFwcEhpZGRlblByb3BzO1xuXG4gICAgY29uc3QgZGF0YSA9IHtcbiAgICAgIHByb2Nlc3M6IHtcbiAgICAgICAgYXJjaDogcHJvY2Vzcy5hcmNoLFxuICAgICAgICBwbGF0Zm9ybTogcHJvY2Vzcy5wbGF0Zm9ybSxcbiAgICAgIH0sXG4gICAgICBhcHA6IHtcbiAgICAgICAgaW50ZXJuYWxQbHVnaW5zOiB7XG4gICAgICAgICAgY29uZmlnOiBhcHAuaW50ZXJuYWxQbHVnaW5zLmNvbmZpZyxcbiAgICAgICAgfSxcbiAgICAgICAgaXNNb2JpbGU6IGFwcC5pc01vYmlsZSxcbiAgICAgICAgcGx1Z2luczoge1xuICAgICAgICAgIGVuYWJsZWRQbHVnaW5zOiBBcnJheS5mcm9tKGFwcC5wbHVnaW5zLmVuYWJsZWRQbHVnaW5zKSxcbiAgICAgICAgICBtYW5pZmVzdHM6IE9iamVjdC5rZXlzKGFwcC5wbHVnaW5zLm1hbmlmZXN0cykucmVkdWNlKFxuICAgICAgICAgICAgKGFjYywga2V5KSA9PiB7XG4gICAgICAgICAgICAgIGFjY1trZXldID0ge1xuICAgICAgICAgICAgICAgIHZlcnNpb246IGFwcC5wbHVnaW5zLm1hbmlmZXN0c1trZXldLnZlcnNpb24sXG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge30gYXMgeyBba2V5OiBzdHJpbmddOiB7IHZlcnNpb246IHN0cmluZyB9IH0sXG4gICAgICAgICAgKSxcbiAgICAgICAgfSxcbiAgICAgICAgdmF1bHQ6IHtcbiAgICAgICAgICBjb25maWc6IGFwcC52YXVsdC5jb25maWcsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgcGx1Z2luOiB7XG4gICAgICAgIHNldHRpbmdzOiB7IHZhbHVlczogdGhpcy5zZXR0aW5ncy5nZXRWYWx1ZXMoKSB9LFxuICAgICAgfSxcbiAgICB9O1xuXG4gICAgY29uc3QgdGV4dCA9IEpTT04uc3RyaW5naWZ5KGRhdGEsIG51bGwsIDIpO1xuXG4gICAgY29uc3QgcHJlID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJwcmVcIik7XG4gICAgcHJlLnNldFRleHQodGV4dCk7XG4gICAgcHJlLnNldENzc1N0eWxlcyh7XG4gICAgICBvdmVyZmxvdzogXCJzY3JvbGxcIixcbiAgICAgIG1heEhlaWdodDogXCIzMDBweFwiLFxuICAgIH0pO1xuXG4gICAgY29uc3QgYnV0dG9uID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJidXR0b25cIik7XG4gICAgYnV0dG9uLnNldFRleHQoXCJDb3B5IGFuZCBDbG9zZVwiKTtcbiAgICBidXR0b24ub25DbGlja0V2ZW50KCgpID0+IHtcbiAgICAgIG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KFwiYGBganNvblxcblwiICsgdGV4dCArIFwiXFxuYGBgXCIpO1xuICAgICAgdGhpcy5jbG9zZSgpO1xuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBTeXN0ZW1JbmZvIGltcGxlbWVudHMgRmVhdHVyZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcGx1Z2luOiBQbHVnaW4sXG4gICAgcHJpdmF0ZSBzZXR0aW5nczogU2V0dGluZ3MsXG4gICkge31cblxuICBhc3luYyBsb2FkKCkge1xuICAgIHRoaXMucGx1Z2luLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwic3lzdGVtLWluZm9cIixcbiAgICAgIG5hbWU6IFwiU2hvdyBTeXN0ZW0gSW5mb1wiLFxuICAgICAgY2FsbGJhY2s6IHRoaXMuY2FsbGJhY2ssXG4gICAgICBob3RrZXlzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBtb2RpZmllcnM6IFtcIk1vZFwiLCBcIlNoaWZ0XCIsIFwiQWx0XCJdLFxuICAgICAgICAgIGtleTogXCJJXCIsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgdW5sb2FkKCkge31cblxuICBwcml2YXRlIGNhbGxiYWNrID0gKCkgPT4ge1xuICAgIGNvbnN0IG1vZGFsID0gbmV3IFN5c3RlbUluZm9Nb2RhbCh0aGlzLnBsdWdpbi5hcHAsIHRoaXMuc2V0dGluZ3MpO1xuICAgIG1vZGFsLm9wZW4oKTtcbiAgfTtcbn1cbiIsImltcG9ydCB7IFBsdWdpbiB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5pbXBvcnQgeyBQcmVjIH0gZnJvbSBcIkBjb2RlbWlycm9yL3N0YXRlXCI7XG5pbXBvcnQgeyBrZXltYXAgfSBmcm9tIFwiQGNvZGVtaXJyb3Ivdmlld1wiO1xuXG5pbXBvcnQgeyBGZWF0dXJlIH0gZnJvbSBcIi4vRmVhdHVyZVwiO1xuXG5pbXBvcnQgeyBNeUVkaXRvciB9IGZyb20gXCIuLi9lZGl0b3JcIjtcbmltcG9ydCB7IEluZGVudExpc3QgfSBmcm9tIFwiLi4vb3BlcmF0aW9ucy9JbmRlbnRMaXN0XCI7XG5pbXBvcnQgeyBJTUVEZXRlY3RvciB9IGZyb20gXCIuLi9zZXJ2aWNlcy9JTUVEZXRlY3RvclwiO1xuaW1wb3J0IHsgT2JzaWRpYW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXJ2aWNlcy9PYnNpZGlhblNldHRpbmdzXCI7XG5pbXBvcnQgeyBPcGVyYXRpb25QZXJmb3JtZXIgfSBmcm9tIFwiLi4vc2VydmljZXMvT3BlcmF0aW9uUGVyZm9ybWVyXCI7XG5pbXBvcnQgeyBTZXR0aW5ncyB9IGZyb20gXCIuLi9zZXJ2aWNlcy9TZXR0aW5nc1wiO1xuaW1wb3J0IHsgY3JlYXRlS2V5bWFwUnVuQ2FsbGJhY2sgfSBmcm9tIFwiLi4vdXRpbHMvY3JlYXRlS2V5bWFwUnVuQ2FsbGJhY2tcIjtcblxuZXhwb3J0IGNsYXNzIFRhYkJlaGF2aW91ck92ZXJyaWRlIGltcGxlbWVudHMgRmVhdHVyZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcGx1Z2luOiBQbHVnaW4sXG4gICAgcHJpdmF0ZSBpbWVEZXRlY3RvcjogSU1FRGV0ZWN0b3IsXG4gICAgcHJpdmF0ZSBvYnNpZGlhblNldHRpbmdzOiBPYnNpZGlhblNldHRpbmdzLFxuICAgIHByaXZhdGUgc2V0dGluZ3M6IFNldHRpbmdzLFxuICAgIHByaXZhdGUgb3BlcmF0aW9uUGVyZm9ybWVyOiBPcGVyYXRpb25QZXJmb3JtZXIsXG4gICkge31cblxuICBhc3luYyBsb2FkKCkge1xuICAgIHRoaXMucGx1Z2luLnJlZ2lzdGVyRWRpdG9yRXh0ZW5zaW9uKFxuICAgICAgUHJlYy5oaWdoZXN0KFxuICAgICAgICBrZXltYXAub2YoW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIGtleTogXCJUYWJcIixcbiAgICAgICAgICAgIHJ1bjogY3JlYXRlS2V5bWFwUnVuQ2FsbGJhY2soe1xuICAgICAgICAgICAgICBjaGVjazogdGhpcy5jaGVjayxcbiAgICAgICAgICAgICAgcnVuOiB0aGlzLnJ1bixcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0pLFxuICAgICAgKSxcbiAgICApO1xuICB9XG5cbiAgYXN5bmMgdW5sb2FkKCkge31cblxuICBwcml2YXRlIGNoZWNrID0gKCkgPT4ge1xuICAgIHJldHVybiB0aGlzLnNldHRpbmdzLm92ZXJyaWRlVGFiQmVoYXZpb3VyICYmICF0aGlzLmltZURldGVjdG9yLmlzT3BlbmVkKCk7XG4gIH07XG5cbiAgcHJpdmF0ZSBydW4gPSAoZWRpdG9yOiBNeUVkaXRvcikgPT4ge1xuICAgIHJldHVybiB0aGlzLm9wZXJhdGlvblBlcmZvcm1lci5wZXJmb3JtKFxuICAgICAgKHJvb3QpID0+XG4gICAgICAgIG5ldyBJbmRlbnRMaXN0KHJvb3QsIHRoaXMub2JzaWRpYW5TZXR0aW5ncy5nZXREZWZhdWx0SW5kZW50Q2hhcnMoKSksXG4gICAgICBlZGl0b3IsXG4gICAgKTtcbiAgfTtcbn1cbiIsImltcG9ydCB7IFBsdWdpbiB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5pbXBvcnQge1xuICBFZGl0b3JWaWV3LFxuICBQbHVnaW5WYWx1ZSxcbiAgVmlld1BsdWdpbixcbiAgVmlld1VwZGF0ZSxcbn0gZnJvbSBcIkBjb2RlbWlycm9yL3ZpZXdcIjtcblxuaW1wb3J0IHsgRmVhdHVyZSB9IGZyb20gXCIuL0ZlYXR1cmVcIjtcblxuaW1wb3J0IHsgTXlFZGl0b3IsIGdldEVkaXRvckZyb21TdGF0ZSB9IGZyb20gXCIuLi9lZGl0b3JcIjtcbmltcG9ydCB7IExpc3QgfSBmcm9tIFwiLi4vcm9vdFwiO1xuaW1wb3J0IHsgT2JzaWRpYW5TZXR0aW5ncyB9IGZyb20gXCIuLi9zZXJ2aWNlcy9PYnNpZGlhblNldHRpbmdzXCI7XG5pbXBvcnQgeyBQYXJzZXIgfSBmcm9tIFwiLi4vc2VydmljZXMvUGFyc2VyXCI7XG5pbXBvcnQgeyBTZXR0aW5ncyB9IGZyb20gXCIuLi9zZXJ2aWNlcy9TZXR0aW5nc1wiO1xuXG5jb25zdCBWRVJUSUNBTF9MSU5FU19CT0RZX0NMQVNTID0gXCJvdXRsaW5lci1wbHVnaW4tdmVydGljYWwtbGluZXNcIjtcblxuaW50ZXJmYWNlIExpbmVEYXRhIHtcbiAgdG9wOiBudW1iZXI7XG4gIGxlZnQ6IG51bWJlcjtcbiAgaGVpZ2h0OiBzdHJpbmc7XG4gIGxpc3Q6IExpc3Q7XG59XG5cbmNsYXNzIFZlcnRpY2FsTGluZXNQbHVnaW5WYWx1ZSBpbXBsZW1lbnRzIFBsdWdpblZhbHVlIHtcbiAgcHJpdmF0ZSBzY2hlZHVsZWQ6IFJldHVyblR5cGU8dHlwZW9mIHNldFRpbWVvdXQ+O1xuICBwcml2YXRlIHNjcm9sbGVyOiBIVE1MRWxlbWVudDtcbiAgcHJpdmF0ZSBjb250ZW50Q29udGFpbmVyOiBIVE1MRWxlbWVudDtcbiAgcHJpdmF0ZSBlZGl0b3I6IE15RWRpdG9yO1xuICBwcml2YXRlIGxhc3RMaW5lOiBudW1iZXI7XG4gIHByaXZhdGUgbGluZXM6IExpbmVEYXRhW107XG4gIHByaXZhdGUgbGluZUVsZW1lbnRzOiBIVE1MRWxlbWVudFtdID0gW107XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBzZXR0aW5nczogU2V0dGluZ3MsXG4gICAgcHJpdmF0ZSBvYnNpZGlhblNldHRpbmdzOiBPYnNpZGlhblNldHRpbmdzLFxuICAgIHByaXZhdGUgcGFyc2VyOiBQYXJzZXIsXG4gICAgcHJpdmF0ZSB2aWV3OiBFZGl0b3JWaWV3LFxuICApIHtcbiAgICB0aGlzLnZpZXcuc2Nyb2xsRE9NLmFkZEV2ZW50TGlzdGVuZXIoXCJzY3JvbGxcIiwgdGhpcy5vblNjcm9sbCk7XG4gICAgdGhpcy5zZXR0aW5ncy5vbkNoYW5nZSh0aGlzLnNjaGVkdWxlUmVjYWxjdWxhdGUpO1xuXG4gICAgdGhpcy5wcmVwYXJlRG9tKCk7XG4gICAgdGhpcy53YWl0Rm9yRWRpdG9yKCk7XG4gIH1cblxuICBwcml2YXRlIHdhaXRGb3JFZGl0b3IgPSAoKSA9PiB7XG4gICAgY29uc3QgZWRpdG9yID0gZ2V0RWRpdG9yRnJvbVN0YXRlKHRoaXMudmlldy5zdGF0ZSk7XG4gICAgaWYgKCFlZGl0b3IpIHtcbiAgICAgIHNldFRpbWVvdXQodGhpcy53YWl0Rm9yRWRpdG9yLCAwKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5lZGl0b3IgPSBlZGl0b3I7XG4gICAgdGhpcy5zY2hlZHVsZVJlY2FsY3VsYXRlKCk7XG4gIH07XG5cbiAgcHJpdmF0ZSBwcmVwYXJlRG9tKCkge1xuICAgIHRoaXMuY29udGVudENvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgdGhpcy5jb250ZW50Q29udGFpbmVyLmNsYXNzTGlzdC5hZGQoXG4gICAgICBcIm91dGxpbmVyLXBsdWdpbi1saXN0LWxpbmVzLWNvbnRlbnQtY29udGFpbmVyXCIsXG4gICAgKTtcblxuICAgIHRoaXMuc2Nyb2xsZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIHRoaXMuc2Nyb2xsZXIuY2xhc3NMaXN0LmFkZChcIm91dGxpbmVyLXBsdWdpbi1saXN0LWxpbmVzLXNjcm9sbGVyXCIpO1xuXG4gICAgdGhpcy5zY3JvbGxlci5hcHBlbmRDaGlsZCh0aGlzLmNvbnRlbnRDb250YWluZXIpO1xuICAgIHRoaXMudmlldy5kb20uYXBwZW5kQ2hpbGQodGhpcy5zY3JvbGxlcik7XG4gIH1cblxuICBwcml2YXRlIG9uU2Nyb2xsID0gKGU6IEV2ZW50KSA9PiB7XG4gICAgY29uc3QgeyBzY3JvbGxMZWZ0LCBzY3JvbGxUb3AgfSA9IGUudGFyZ2V0IGFzIEhUTUxFbGVtZW50O1xuICAgIHRoaXMuc2Nyb2xsZXIuc2Nyb2xsVG8oc2Nyb2xsTGVmdCwgc2Nyb2xsVG9wKTtcbiAgfTtcblxuICBwcml2YXRlIHNjaGVkdWxlUmVjYWxjdWxhdGUgPSAoKSA9PiB7XG4gICAgY2xlYXJUaW1lb3V0KHRoaXMuc2NoZWR1bGVkKTtcbiAgICB0aGlzLnNjaGVkdWxlZCA9IHNldFRpbWVvdXQodGhpcy5jYWxjdWxhdGUsIDApO1xuICB9O1xuXG4gIHVwZGF0ZSh1cGRhdGU6IFZpZXdVcGRhdGUpIHtcbiAgICBpZiAoXG4gICAgICB1cGRhdGUuZG9jQ2hhbmdlZCB8fFxuICAgICAgdXBkYXRlLnZpZXdwb3J0Q2hhbmdlZCB8fFxuICAgICAgdXBkYXRlLmdlb21ldHJ5Q2hhbmdlZCB8fFxuICAgICAgdXBkYXRlLnRyYW5zYWN0aW9ucy5zb21lKCh0cikgPT4gdHIucmVjb25maWd1cmVkKVxuICAgICkge1xuICAgICAgdGhpcy5zY2hlZHVsZVJlY2FsY3VsYXRlKCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBjYWxjdWxhdGUgPSAoKSA9PiB7XG4gICAgdGhpcy5saW5lcyA9IFtdO1xuXG4gICAgaWYgKFxuICAgICAgdGhpcy5zZXR0aW5ncy52ZXJ0aWNhbExpbmVzICYmXG4gICAgICB0aGlzLm9ic2lkaWFuU2V0dGluZ3MuaXNEZWZhdWx0VGhlbWVFbmFibGVkKCkgJiZcbiAgICAgIHRoaXMudmlldy52aWV3cG9ydExpbmVCbG9ja3MubGVuZ3RoID4gMCAmJlxuICAgICAgdGhpcy52aWV3LnZpc2libGVSYW5nZXMubGVuZ3RoID4gMFxuICAgICkge1xuICAgICAgY29uc3QgZnJvbUxpbmUgPSB0aGlzLmVkaXRvci5vZmZzZXRUb1Bvcyh0aGlzLnZpZXcudmlld3BvcnQuZnJvbSkubGluZTtcbiAgICAgIGNvbnN0IHRvTGluZSA9IHRoaXMuZWRpdG9yLm9mZnNldFRvUG9zKHRoaXMudmlldy52aWV3cG9ydC50bykubGluZTtcbiAgICAgIGNvbnN0IGxpc3RzID0gdGhpcy5wYXJzZXIucGFyc2VSYW5nZSh0aGlzLmVkaXRvciwgZnJvbUxpbmUsIHRvTGluZSk7XG5cbiAgICAgIGZvciAoY29uc3QgbGlzdCBvZiBsaXN0cykge1xuICAgICAgICB0aGlzLmxhc3RMaW5lID0gbGlzdC5nZXRDb250ZW50RW5kKCkubGluZTtcblxuICAgICAgICBmb3IgKGNvbnN0IGMgb2YgbGlzdC5nZXRDaGlsZHJlbigpKSB7XG4gICAgICAgICAgdGhpcy5yZWN1cnNpdmUoYyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdGhpcy5saW5lcy5zb3J0KChhLCBiKSA9PlxuICAgICAgICBhLnRvcCA9PT0gYi50b3AgPyBhLmxlZnQgLSBiLmxlZnQgOiBhLnRvcCAtIGIudG9wLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICB0aGlzLnVwZGF0ZURvbSgpO1xuICB9O1xuXG4gIHByaXZhdGUgZ2V0TmV4dFNpYmxpbmcobGlzdDogTGlzdCk6IExpc3QgfCBudWxsIHtcbiAgICBsZXQgbGlzdFRtcCA9IGxpc3Q7XG4gICAgbGV0IHAgPSBsaXN0VG1wLmdldFBhcmVudCgpO1xuICAgIHdoaWxlIChwKSB7XG4gICAgICBjb25zdCBuZXh0U2libGluZyA9IHAuZ2V0TmV4dFNpYmxpbmdPZihsaXN0VG1wKTtcbiAgICAgIGlmIChuZXh0U2libGluZykge1xuICAgICAgICByZXR1cm4gbmV4dFNpYmxpbmc7XG4gICAgICB9XG4gICAgICBsaXN0VG1wID0gcDtcbiAgICAgIHAgPSBsaXN0VG1wLmdldFBhcmVudCgpO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgcmVjdXJzaXZlKGxpc3Q6IExpc3QsIHBhcmVudEN0eDogeyByb290TGVmdD86IG51bWJlciB9ID0ge30pIHtcbiAgICBjb25zdCBjaGlsZHJlbiA9IGxpc3QuZ2V0Q2hpbGRyZW4oKTtcblxuICAgIGlmIChjaGlsZHJlbi5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBmcm9tT2Zmc2V0ID0gdGhpcy5lZGl0b3IucG9zVG9PZmZzZXQoe1xuICAgICAgbGluZTogbGlzdC5nZXRGaXJzdExpbmVDb250ZW50U3RhcnQoKS5saW5lLFxuICAgICAgY2g6IGxpc3QuZ2V0Rmlyc3RMaW5lSW5kZW50KCkubGVuZ3RoLFxuICAgIH0pO1xuICAgIGNvbnN0IG5leHRTaWJsaW5nID0gdGhpcy5nZXROZXh0U2libGluZyhsaXN0KTtcbiAgICBjb25zdCB0aWxsT2Zmc2V0ID0gdGhpcy5lZGl0b3IucG9zVG9PZmZzZXQoe1xuICAgICAgbGluZTogbmV4dFNpYmxpbmdcbiAgICAgICAgPyBuZXh0U2libGluZy5nZXRGaXJzdExpbmVDb250ZW50U3RhcnQoKS5saW5lIC0gMVxuICAgICAgICA6IHRoaXMubGFzdExpbmUsXG4gICAgICBjaDogMCxcbiAgICB9KTtcblxuICAgIGxldCB2aXNpYmxlRnJvbSA9IHRoaXMudmlldy52aXNpYmxlUmFuZ2VzWzBdLmZyb207XG4gICAgbGV0IHZpc2libGVUbyA9XG4gICAgICB0aGlzLnZpZXcudmlzaWJsZVJhbmdlc1t0aGlzLnZpZXcudmlzaWJsZVJhbmdlcy5sZW5ndGggLSAxXS50bztcbiAgICBjb25zdCB6b29tUmFuZ2UgPSB0aGlzLmVkaXRvci5nZXRab29tUmFuZ2UoKTtcbiAgICBpZiAoem9vbVJhbmdlKSB7XG4gICAgICB2aXNpYmxlRnJvbSA9IE1hdGgubWF4KFxuICAgICAgICB2aXNpYmxlRnJvbSxcbiAgICAgICAgdGhpcy5lZGl0b3IucG9zVG9PZmZzZXQoem9vbVJhbmdlLmZyb20pLFxuICAgICAgKTtcbiAgICAgIHZpc2libGVUbyA9IE1hdGgubWluKHZpc2libGVUbywgdGhpcy5lZGl0b3IucG9zVG9PZmZzZXQoem9vbVJhbmdlLnRvKSk7XG4gICAgfVxuXG4gICAgaWYgKGZyb21PZmZzZXQgPiB2aXNpYmxlVG8gfHwgdGlsbE9mZnNldCA8IHZpc2libGVGcm9tKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgY29vcmRzID0gdGhpcy52aWV3LmNvb3Jkc0F0UG9zKGZyb21PZmZzZXQsIDEpO1xuICAgIGlmIChwYXJlbnRDdHgucm9vdExlZnQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcGFyZW50Q3R4LnJvb3RMZWZ0ID0gY29vcmRzLmxlZnQ7XG4gICAgfVxuICAgIGNvbnN0IGxlZnQgPSBNYXRoLmZsb29yKGNvb3Jkcy5yaWdodCAtIHBhcmVudEN0eC5yb290TGVmdCk7XG5cbiAgICBjb25zdCB0b3AgPVxuICAgICAgdmlzaWJsZUZyb20gPiAwICYmIGZyb21PZmZzZXQgPCB2aXNpYmxlRnJvbVxuICAgICAgICA/IC0yMFxuICAgICAgICA6IHRoaXMudmlldy5saW5lQmxvY2tBdChmcm9tT2Zmc2V0KS50b3A7XG4gICAgY29uc3QgYm90dG9tID1cbiAgICAgIHRpbGxPZmZzZXQgPiB2aXNpYmxlVG9cbiAgICAgICAgPyB0aGlzLnZpZXcubGluZUJsb2NrQXQodmlzaWJsZVRvIC0gMSkuYm90dG9tXG4gICAgICAgIDogdGhpcy52aWV3LmxpbmVCbG9ja0F0KHRpbGxPZmZzZXQpLmJvdHRvbTtcbiAgICBjb25zdCBoZWlnaHQgPSBib3R0b20gLSB0b3A7XG5cbiAgICBpZiAoaGVpZ2h0ID4gMCAmJiAhbGlzdC5pc0ZvbGRlZCgpKSB7XG4gICAgICBjb25zdCBuZXh0U2libGluZyA9IGxpc3QuZ2V0UGFyZW50KCkuZ2V0TmV4dFNpYmxpbmdPZihsaXN0KTtcbiAgICAgIGNvbnN0IGhhc05leHRTaWJsaW5nID1cbiAgICAgICAgISFuZXh0U2libGluZyAmJlxuICAgICAgICB0aGlzLmVkaXRvci5wb3NUb09mZnNldChuZXh0U2libGluZy5nZXRGaXJzdExpbmVDb250ZW50U3RhcnQoKSkgPD1cbiAgICAgICAgICB2aXNpYmxlVG87XG5cbiAgICAgIHRoaXMubGluZXMucHVzaCh7XG4gICAgICAgIHRvcCxcbiAgICAgICAgbGVmdCxcbiAgICAgICAgaGVpZ2h0OiBgY2FsYygke2hlaWdodH1weCAke2hhc05leHRTaWJsaW5nID8gXCItIDEuNWVtXCIgOiBcIi0gMmVtXCJ9KWAsXG4gICAgICAgIGxpc3QsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGNoaWxkcmVuKSB7XG4gICAgICBpZiAoIWNoaWxkLmlzRW1wdHkoKSkge1xuICAgICAgICB0aGlzLnJlY3Vyc2l2ZShjaGlsZCwgcGFyZW50Q3R4KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIG9uQ2xpY2sgPSAoZTogTW91c2VFdmVudCkgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgIGNvbnN0IGxpbmUgPSB0aGlzLmxpbmVzW051bWJlcigoZS50YXJnZXQgYXMgSFRNTEVsZW1lbnQpLmRhdGFzZXQuaW5kZXgpXTtcblxuICAgIHN3aXRjaCAodGhpcy5zZXR0aW5ncy52ZXJ0aWNhbExpbmVzQWN0aW9uKSB7XG4gICAgICBjYXNlIFwiem9vbS1pblwiOlxuICAgICAgICB0aGlzLnpvb21JbihsaW5lKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgXCJ0b2dnbGUtZm9sZGluZ1wiOlxuICAgICAgICB0aGlzLnRvZ2dsZUZvbGRpbmcobGluZSk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfTtcblxuICBwcml2YXRlIHpvb21JbihsaW5lOiBMaW5lRGF0YSkge1xuICAgIGNvbnN0IGVkaXRvciA9IGdldEVkaXRvckZyb21TdGF0ZSh0aGlzLnZpZXcuc3RhdGUpO1xuXG4gICAgZWRpdG9yLnpvb21JbihsaW5lLmxpc3QuZ2V0Rmlyc3RMaW5lQ29udGVudFN0YXJ0KCkubGluZSk7XG4gIH1cblxuICBwcml2YXRlIHRvZ2dsZUZvbGRpbmcobGluZTogTGluZURhdGEpIHtcbiAgICBjb25zdCB7IGxpc3QgfSA9IGxpbmU7XG5cbiAgICBpZiAobGlzdC5pc0VtcHR5KCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsZXQgbmVlZFRvVW5mb2xkID0gdHJ1ZTtcbiAgICBjb25zdCBsaW5lc1RvVG9nZ2xlOiBudW1iZXJbXSA9IFtdO1xuICAgIGZvciAoY29uc3QgYyBvZiBsaXN0LmdldENoaWxkcmVuKCkpIHtcbiAgICAgIGlmIChjLmlzRW1wdHkoKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGlmICghYy5pc0ZvbGRlZCgpKSB7XG4gICAgICAgIG5lZWRUb1VuZm9sZCA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgbGluZXNUb1RvZ2dsZS5wdXNoKGMuZ2V0Rmlyc3RMaW5lQ29udGVudFN0YXJ0KCkubGluZSk7XG4gICAgfVxuXG4gICAgY29uc3QgZWRpdG9yID0gZ2V0RWRpdG9yRnJvbVN0YXRlKHRoaXMudmlldy5zdGF0ZSk7XG5cbiAgICBmb3IgKGNvbnN0IGwgb2YgbGluZXNUb1RvZ2dsZSkge1xuICAgICAgaWYgKG5lZWRUb1VuZm9sZCkge1xuICAgICAgICBlZGl0b3IudW5mb2xkKGwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZWRpdG9yLmZvbGQobCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSB1cGRhdGVEb20oKSB7XG4gICAgY29uc3QgY21TY3JvbGwgPSB0aGlzLnZpZXcuc2Nyb2xsRE9NO1xuICAgIGNvbnN0IGNtQ29udGVudCA9IHRoaXMudmlldy5jb250ZW50RE9NO1xuICAgIGNvbnN0IGNtQ29udGVudENvbnRhaW5lciA9IGNtQ29udGVudC5wYXJlbnRFbGVtZW50O1xuICAgIGNvbnN0IGNtU2l6ZXIgPSBjbUNvbnRlbnRDb250YWluZXIucGFyZW50RWxlbWVudDtcblxuICAgIC8qKlxuICAgICAqIE9ic2lkaWFuIGNhbiBhZGQgYWRkaXRpb25hbCBlbGVtZW50cyBpbnRvIENvbnRlbnQgTWFuYWdlci5cbiAgICAgKiBUaGUgbW9zdCBvYnZpb3VzIGNhc2UgaXMgdGhlICdlbWJlZGRlZC1iYWNrbGlua3MnIGNvcmUgcGx1Z2luIHRoYXQgYWRkcyBhIG1lbnUgaW5zaWRlIGEgQ29udGVudCBNYW5hZ2VyLlxuICAgICAqIFdlIG11c3QgdGFrZSBoZWlnaHRzIG9mIGFsbCBvZiB0aGVzZSBlbGVtZW50cyBpbnRvIGFjY291bnRcbiAgICAgKiB0byBiZSBhYmxlIHRvIGNhbGN1bGF0ZSB0aGUgY29ycmVjdCBzaXplIG9mIGxpbmVzJyBjb250YWluZXIuXG4gICAgICovXG4gICAgbGV0IGNtU2l6ZXJDaGlsZHJlblN1bUhlaWdodCA9IDA7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjbVNpemVyLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjbVNpemVyQ2hpbGRyZW5TdW1IZWlnaHQgKz0gY21TaXplci5jaGlsZHJlbltpXS5jbGllbnRIZWlnaHQ7XG4gICAgfVxuXG4gICAgdGhpcy5zY3JvbGxlci5zdHlsZS50b3AgPSBjbVNjcm9sbC5vZmZzZXRUb3AgKyBcInB4XCI7XG4gICAgdGhpcy5jb250ZW50Q29udGFpbmVyLnN0eWxlLmhlaWdodCA9IGNtU2l6ZXJDaGlsZHJlblN1bUhlaWdodCArIFwicHhcIjtcbiAgICB0aGlzLmNvbnRlbnRDb250YWluZXIuc3R5bGUubWFyZ2luTGVmdCA9XG4gICAgICBjbUNvbnRlbnRDb250YWluZXIub2Zmc2V0TGVmdCArIFwicHhcIjtcbiAgICB0aGlzLmNvbnRlbnRDb250YWluZXIuc3R5bGUubWFyZ2luVG9wID1cbiAgICAgIChjbUNvbnRlbnQuZmlyc3RFbGVtZW50Q2hpbGQgYXMgSFRNTEVsZW1lbnQpLm9mZnNldFRvcCAtIDI0ICsgXCJweFwiO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmxpbmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAodGhpcy5saW5lRWxlbWVudHMubGVuZ3RoID09PSBpKSB7XG4gICAgICAgIGNvbnN0IGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICBlLmNsYXNzTGlzdC5hZGQoXCJvdXRsaW5lci1wbHVnaW4tbGlzdC1saW5lXCIpO1xuICAgICAgICBlLmRhdGFzZXQuaW5kZXggPSBTdHJpbmcoaSk7XG4gICAgICAgIGUuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCB0aGlzLm9uQ2xpY2spO1xuICAgICAgICB0aGlzLmNvbnRlbnRDb250YWluZXIuYXBwZW5kQ2hpbGQoZSk7XG4gICAgICAgIHRoaXMubGluZUVsZW1lbnRzLnB1c2goZSk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGwgPSB0aGlzLmxpbmVzW2ldO1xuICAgICAgY29uc3QgZSA9IHRoaXMubGluZUVsZW1lbnRzW2ldO1xuICAgICAgZS5zdHlsZS50b3AgPSBsLnRvcCArIFwicHhcIjtcbiAgICAgIGUuc3R5bGUubGVmdCA9IGwubGVmdCArIFwicHhcIjtcbiAgICAgIGUuc3R5bGUuaGVpZ2h0ID0gbC5oZWlnaHQ7XG4gICAgICBlLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XG4gICAgfVxuXG4gICAgZm9yIChsZXQgaSA9IHRoaXMubGluZXMubGVuZ3RoOyBpIDwgdGhpcy5saW5lRWxlbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGUgPSB0aGlzLmxpbmVFbGVtZW50c1tpXTtcbiAgICAgIGUuc3R5bGUudG9wID0gXCIwcHhcIjtcbiAgICAgIGUuc3R5bGUubGVmdCA9IFwiMHB4XCI7XG4gICAgICBlLnN0eWxlLmhlaWdodCA9IFwiMHB4XCI7XG4gICAgICBlLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICB9XG4gIH1cblxuICBkZXN0cm95KCkge1xuICAgIHRoaXMuc2V0dGluZ3MucmVtb3ZlQ2FsbGJhY2sodGhpcy5zY2hlZHVsZVJlY2FsY3VsYXRlKTtcbiAgICB0aGlzLnZpZXcuc2Nyb2xsRE9NLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJzY3JvbGxcIiwgdGhpcy5vblNjcm9sbCk7XG4gICAgdGhpcy52aWV3LmRvbS5yZW1vdmVDaGlsZCh0aGlzLnNjcm9sbGVyKTtcbiAgICBjbGVhclRpbWVvdXQodGhpcy5zY2hlZHVsZWQpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBWZXJ0aWNhbExpbmVzIGltcGxlbWVudHMgRmVhdHVyZSB7XG4gIHByaXZhdGUgdXBkYXRlQm9keUNsYXNzSW50ZXJ2YWw6IG51bWJlcjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHBsdWdpbjogUGx1Z2luLFxuICAgIHByaXZhdGUgc2V0dGluZ3M6IFNldHRpbmdzLFxuICAgIHByaXZhdGUgb2JzaWRpYW5TZXR0aW5nczogT2JzaWRpYW5TZXR0aW5ncyxcbiAgICBwcml2YXRlIHBhcnNlcjogUGFyc2VyLFxuICApIHt9XG5cbiAgYXN5bmMgbG9hZCgpIHtcbiAgICB0aGlzLnVwZGF0ZUJvZHlDbGFzcygpO1xuICAgIHRoaXMudXBkYXRlQm9keUNsYXNzSW50ZXJ2YWwgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgdGhpcy51cGRhdGVCb2R5Q2xhc3MoKTtcbiAgICB9LCAxMDAwKTtcblxuICAgIHRoaXMucGx1Z2luLnJlZ2lzdGVyRWRpdG9yRXh0ZW5zaW9uKFxuICAgICAgVmlld1BsdWdpbi5kZWZpbmUoXG4gICAgICAgICh2aWV3KSA9PlxuICAgICAgICAgIG5ldyBWZXJ0aWNhbExpbmVzUGx1Z2luVmFsdWUoXG4gICAgICAgICAgICB0aGlzLnNldHRpbmdzLFxuICAgICAgICAgICAgdGhpcy5vYnNpZGlhblNldHRpbmdzLFxuICAgICAgICAgICAgdGhpcy5wYXJzZXIsXG4gICAgICAgICAgICB2aWV3LFxuICAgICAgICAgICksXG4gICAgICApLFxuICAgICk7XG4gIH1cblxuICBhc3luYyB1bmxvYWQoKSB7XG4gICAgY2xlYXJJbnRlcnZhbCh0aGlzLnVwZGF0ZUJvZHlDbGFzc0ludGVydmFsKTtcbiAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoVkVSVElDQUxfTElORVNfQk9EWV9DTEFTUyk7XG4gIH1cblxuICBwcml2YXRlIHVwZGF0ZUJvZHlDbGFzcyA9ICgpID0+IHtcbiAgICBjb25zdCBzaG91bGRFeGlzdHMgPVxuICAgICAgdGhpcy5vYnNpZGlhblNldHRpbmdzLmlzRGVmYXVsdFRoZW1lRW5hYmxlZCgpICYmXG4gICAgICB0aGlzLnNldHRpbmdzLnZlcnRpY2FsTGluZXM7XG4gICAgY29uc3QgZXhpc3RzID0gZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuY29udGFpbnMoVkVSVElDQUxfTElORVNfQk9EWV9DTEFTUyk7XG5cbiAgICBpZiAoc2hvdWxkRXhpc3RzICYmICFleGlzdHMpIHtcbiAgICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmFkZChWRVJUSUNBTF9MSU5FU19CT0RZX0NMQVNTKTtcbiAgICB9XG5cbiAgICBpZiAoIXNob3VsZEV4aXN0cyAmJiBleGlzdHMpIHtcbiAgICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZShWRVJUSUNBTF9MSU5FU19CT0RZX0NMQVNTKTtcbiAgICB9XG4gIH07XG59XG4iLCJpbXBvcnQgeyBNYXJrZG93blZpZXcsIE5vdGljZSwgUGx1Z2luIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmltcG9ydCB7IE15RWRpdG9yIH0gZnJvbSBcInNyYy9lZGl0b3JcIjtcbmltcG9ydCB7IENyZWF0ZU5ld0l0ZW0gfSBmcm9tIFwic3JjL29wZXJhdGlvbnMvQ3JlYXRlTmV3SXRlbVwiO1xuaW1wb3J0IHsgT2JzaWRpYW5TZXR0aW5ncyB9IGZyb20gXCJzcmMvc2VydmljZXMvT2JzaWRpYW5TZXR0aW5nc1wiO1xuaW1wb3J0IHsgT3BlcmF0aW9uUGVyZm9ybWVyIH0gZnJvbSBcInNyYy9zZXJ2aWNlcy9PcGVyYXRpb25QZXJmb3JtZXJcIjtcbmltcG9ydCB7IFBhcnNlciB9IGZyb20gXCJzcmMvc2VydmljZXMvUGFyc2VyXCI7XG5pbXBvcnQgeyBTZXR0aW5ncyB9IGZyb20gXCJzcmMvc2VydmljZXMvU2V0dGluZ3NcIjtcblxuaW1wb3J0IHsgRmVhdHVyZSB9IGZyb20gXCIuL0ZlYXR1cmVcIjtcblxuZGVjbGFyZSBnbG9iYWwge1xuICB0eXBlIENNID0gb2JqZWN0O1xuXG4gIGludGVyZmFjZSBWaW0ge1xuICAgIGRlZmluZUFjdGlvbjxUPihuYW1lOiBzdHJpbmcsIGZuOiAoY206IENNLCBhcmdzOiBUKSA9PiB2b2lkKTogdm9pZDtcblxuICAgIGhhbmRsZUV4KGNtOiBDTSwgY29tbWFuZDogc3RyaW5nKTogdm9pZDtcblxuICAgIGVudGVySW5zZXJ0TW9kZShjbTogQ00pOiB2b2lkO1xuXG4gICAgbWFwQ29tbWFuZChcbiAgICAgIGtleXM6IHN0cmluZyxcbiAgICAgIHR5cGU6IHN0cmluZyxcbiAgICAgIG5hbWU6IHN0cmluZyxcbiAgICAgIGFyZ3M6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICAgICAgZXh0cmE6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICAgICk6IHZvaWQ7XG4gIH1cblxuICBpbnRlcmZhY2UgV2luZG93IHtcbiAgICBDb2RlTWlycm9yQWRhcHRlcj86IHtcbiAgICAgIFZpbT86IFZpbTtcbiAgICB9O1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBWaW1PQmVoYXZpb3VyT3ZlcnJpZGUgaW1wbGVtZW50cyBGZWF0dXJlIHtcbiAgcHJpdmF0ZSBpbml0ZWQgPSBmYWxzZTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHBsdWdpbjogUGx1Z2luLFxuICAgIHByaXZhdGUgc2V0dGluZ3M6IFNldHRpbmdzLFxuICAgIHByaXZhdGUgb2JzaWRpYW5TZXR0aW5nczogT2JzaWRpYW5TZXR0aW5ncyxcbiAgICBwcml2YXRlIHBhcnNlcjogUGFyc2VyLFxuICAgIHByaXZhdGUgb3BlcmF0aW9uUGVyZm9ybWVyOiBPcGVyYXRpb25QZXJmb3JtZXIsXG4gICkge31cblxuICBhc3luYyBsb2FkKCkge1xuICAgIHRoaXMuc2V0dGluZ3Mub25DaGFuZ2UodGhpcy5oYW5kbGVTZXR0aW5nc0NoYW5nZSk7XG4gICAgdGhpcy5oYW5kbGVTZXR0aW5nc0NoYW5nZSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBoYW5kbGVTZXR0aW5nc0NoYW5nZSA9ICgpID0+IHtcbiAgICBpZiAoIXRoaXMuc2V0dGluZ3Mub3ZlcnJpZGVWaW1PQmVoYXZpb3VyKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCF3aW5kb3cuQ29kZU1pcnJvckFkYXB0ZXIgfHwgIXdpbmRvdy5Db2RlTWlycm9yQWRhcHRlci5WaW0pIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJWaW0gYWRhcHRlciBub3QgZm91bmRcIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgdmltID0gd2luZG93LkNvZGVNaXJyb3JBZGFwdGVyLlZpbTtcbiAgICBjb25zdCBwbHVnaW4gPSB0aGlzLnBsdWdpbjtcbiAgICBjb25zdCBwYXJzZXIgPSB0aGlzLnBhcnNlcjtcbiAgICBjb25zdCBvYnNpZGlhblNldHRpbmdzID0gdGhpcy5vYnNpZGlhblNldHRpbmdzO1xuICAgIGNvbnN0IG9wZXJhdGlvblBlcmZvcm1lciA9IHRoaXMub3BlcmF0aW9uUGVyZm9ybWVyO1xuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5zZXR0aW5ncztcblxuICAgIHZpbS5kZWZpbmVBY3Rpb24oXG4gICAgICBcImluc2VydExpbmVBZnRlckJ1bGxldFwiLFxuICAgICAgKGNtLCBvcGVyYXRvckFyZ3M6IHsgYWZ0ZXI6IGJvb2xlYW4gfSkgPT4ge1xuICAgICAgICAvLyBNb3ZlIHRoZSBjdXJzb3IgdG8gdGhlIGVuZCBvZiB0aGUgbGluZVxuICAgICAgICB2aW0uaGFuZGxlRXgoY20sIFwibm9ybWFsISBBXCIpO1xuXG4gICAgICAgIGlmICghc2V0dGluZ3Mub3ZlcnJpZGVWaW1PQmVoYXZpb3VyKSB7XG4gICAgICAgICAgaWYgKG9wZXJhdG9yQXJncy5hZnRlcikge1xuICAgICAgICAgICAgdmltLmhhbmRsZUV4KGNtLCBcIm5vcm1hbCEgb1wiKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmltLmhhbmRsZUV4KGNtLCBcIm5vcm1hbCEgT1wiKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmltLmVudGVySW5zZXJ0TW9kZShjbSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdmlldyA9IHBsdWdpbi5hcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbiAgICAgICAgY29uc3QgZWRpdG9yID0gbmV3IE15RWRpdG9yKHZpZXcuZWRpdG9yKTtcbiAgICAgICAgY29uc3Qgcm9vdCA9IHBhcnNlci5wYXJzZShlZGl0b3IpO1xuXG4gICAgICAgIGlmICghcm9vdCkge1xuICAgICAgICAgIGlmIChvcGVyYXRvckFyZ3MuYWZ0ZXIpIHtcbiAgICAgICAgICAgIHZpbS5oYW5kbGVFeChjbSwgXCJub3JtYWwhIG9cIik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZpbS5oYW5kbGVFeChjbSwgXCJub3JtYWwhIE9cIik7XG4gICAgICAgICAgfVxuICAgICAgICAgIHZpbS5lbnRlckluc2VydE1vZGUoY20pO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGRlZmF1bHRJbmRlbnRDaGFycyA9IG9ic2lkaWFuU2V0dGluZ3MuZ2V0RGVmYXVsdEluZGVudENoYXJzKCk7XG4gICAgICAgIGNvbnN0IHpvb21SYW5nZSA9IGVkaXRvci5nZXRab29tUmFuZ2UoKTtcbiAgICAgICAgY29uc3QgZ2V0Wm9vbVJhbmdlID0ge1xuICAgICAgICAgIGdldFpvb21SYW5nZTogKCkgPT4gem9vbVJhbmdlLFxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IHJlcyA9IG9wZXJhdGlvblBlcmZvcm1lci5ldmFsKFxuICAgICAgICAgIHJvb3QsXG4gICAgICAgICAgbmV3IENyZWF0ZU5ld0l0ZW0oXG4gICAgICAgICAgICByb290LFxuICAgICAgICAgICAgZGVmYXVsdEluZGVudENoYXJzLFxuICAgICAgICAgICAgZ2V0Wm9vbVJhbmdlLFxuICAgICAgICAgICAgb3BlcmF0b3JBcmdzLmFmdGVyLFxuICAgICAgICAgICksXG4gICAgICAgICAgZWRpdG9yLFxuICAgICAgICApO1xuXG4gICAgICAgIGlmIChyZXMuc2hvdWxkVXBkYXRlICYmIHpvb21SYW5nZSkge1xuICAgICAgICAgIGVkaXRvci50cnlSZWZyZXNoWm9vbSh6b29tUmFuZ2UuZnJvbS5saW5lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEVuc3VyZSB0aGUgZWRpdG9yIGlzIGFsd2F5cyBsZWZ0IGluIGluc2VydCBtb2RlXG4gICAgICAgIHZpbS5lbnRlckluc2VydE1vZGUoY20pO1xuICAgICAgfSxcbiAgICApO1xuXG4gICAgdmltLm1hcENvbW1hbmQoXG4gICAgICBcIm9cIixcbiAgICAgIFwiYWN0aW9uXCIsXG4gICAgICBcImluc2VydExpbmVBZnRlckJ1bGxldFwiLFxuICAgICAge30sXG4gICAgICB7XG4gICAgICAgIGlzRWRpdDogdHJ1ZSxcbiAgICAgICAgY29udGV4dDogXCJub3JtYWxcIixcbiAgICAgICAgaW50ZXJsYWNlSW5zZXJ0UmVwZWF0OiB0cnVlLFxuICAgICAgICBhY3Rpb25BcmdzOiB7IGFmdGVyOiB0cnVlIH0sXG4gICAgICB9LFxuICAgICk7XG5cbiAgICB2aW0ubWFwQ29tbWFuZChcbiAgICAgIFwiT1wiLFxuICAgICAgXCJhY3Rpb25cIixcbiAgICAgIFwiaW5zZXJ0TGluZUFmdGVyQnVsbGV0XCIsXG4gICAgICB7fSxcbiAgICAgIHtcbiAgICAgICAgaXNFZGl0OiB0cnVlLFxuICAgICAgICBjb250ZXh0OiBcIm5vcm1hbFwiLFxuICAgICAgICBpbnRlcmxhY2VJbnNlcnRSZXBlYXQ6IHRydWUsXG4gICAgICAgIGFjdGlvbkFyZ3M6IHsgYWZ0ZXI6IGZhbHNlIH0sXG4gICAgICB9LFxuICAgICk7XG5cbiAgICB0aGlzLmluaXRlZCA9IHRydWU7XG4gIH07XG5cbiAgYXN5bmMgdW5sb2FkKCkge1xuICAgIGlmICghdGhpcy5pbml0ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBuZXcgTm90aWNlKFxuICAgICAgYFRvIGZ1bGx5IHVubG9hZCBvYnNpZGlhbi1vdXRsaW5lciBwbHVnaW4sIHBsZWFzZSByZXN0YXJ0IHRoZSBhcHBgLFxuICAgICAgNTAwMCxcbiAgICApO1xuICB9XG59XG4iLCJpbXBvcnQgeyBNeUVkaXRvciB9IGZyb20gXCIuLi9lZGl0b3JcIjtcbmltcG9ydCB7IExpc3QsIFBvc2l0aW9uLCBSb290LCBpc1Jhbmdlc0ludGVyc2VjdHMgfSBmcm9tIFwiLi4vcm9vdFwiO1xuXG5leHBvcnQgY2xhc3MgQ2hhbmdlc0FwcGxpY2F0b3Ige1xuICBhcHBseShlZGl0b3I6IE15RWRpdG9yLCBwcmV2Um9vdDogUm9vdCwgbmV3Um9vdDogUm9vdCkge1xuICAgIGNvbnN0IGNoYW5nZXMgPSB0aGlzLmNhbGN1bGF0ZUNoYW5nZXMoZWRpdG9yLCBwcmV2Um9vdCwgbmV3Um9vdCk7XG4gICAgaWYgKGNoYW5nZXMpIHtcbiAgICAgIGNvbnN0IHsgcmVwbGFjZW1lbnQsIGNoYW5nZUZyb20sIGNoYW5nZVRvIH0gPSBjaGFuZ2VzO1xuXG4gICAgICBjb25zdCB7IHVuZm9sZCwgZm9sZCB9ID0gdGhpcy5jYWxjdWxhdGVGb2xkaW5nT3ByYXRpb25zKFxuICAgICAgICBwcmV2Um9vdCxcbiAgICAgICAgbmV3Um9vdCxcbiAgICAgICAgY2hhbmdlRnJvbSxcbiAgICAgICAgY2hhbmdlVG8sXG4gICAgICApO1xuXG4gICAgICBmb3IgKGNvbnN0IGxpbmUgb2YgdW5mb2xkKSB7XG4gICAgICAgIGVkaXRvci51bmZvbGQobGluZSk7XG4gICAgICB9XG5cbiAgICAgIGVkaXRvci5yZXBsYWNlUmFuZ2UocmVwbGFjZW1lbnQsIGNoYW5nZUZyb20sIGNoYW5nZVRvKTtcblxuICAgICAgZm9yIChjb25zdCBsaW5lIG9mIGZvbGQpIHtcbiAgICAgICAgZWRpdG9yLmZvbGQobGluZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZWRpdG9yLnNldFNlbGVjdGlvbnMobmV3Um9vdC5nZXRTZWxlY3Rpb25zKCkpO1xuICB9XG5cbiAgcHJpdmF0ZSBjYWxjdWxhdGVDaGFuZ2VzKGVkaXRvcjogTXlFZGl0b3IsIHByZXZSb290OiBSb290LCBuZXdSb290OiBSb290KSB7XG4gICAgY29uc3Qgcm9vdFJhbmdlID0gcHJldlJvb3QuZ2V0Q29udGVudFJhbmdlKCk7XG4gICAgY29uc3Qgb2xkU3RyaW5nID0gZWRpdG9yLmdldFJhbmdlKHJvb3RSYW5nZVswXSwgcm9vdFJhbmdlWzFdKTtcbiAgICBjb25zdCBuZXdTdHJpbmcgPSBuZXdSb290LnByaW50KCk7XG5cbiAgICBjb25zdCBjaGFuZ2VGcm9tID0geyAuLi5yb290UmFuZ2VbMF0gfTtcbiAgICBjb25zdCBjaGFuZ2VUbyA9IHsgLi4ucm9vdFJhbmdlWzFdIH07XG4gICAgbGV0IG9sZFRtcCA9IG9sZFN0cmluZztcbiAgICBsZXQgbmV3VG1wID0gbmV3U3RyaW5nO1xuXG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGNvbnN0IG5sSW5kZXggPSBvbGRUbXAubGFzdEluZGV4T2YoXCJcXG5cIik7XG5cbiAgICAgIGlmIChubEluZGV4IDwgMCkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgY29uc3Qgb2xkTGluZSA9IG9sZFRtcC5zbGljZShubEluZGV4KTtcbiAgICAgIGNvbnN0IG5ld0xpbmUgPSBuZXdUbXAuc2xpY2UoLW9sZExpbmUubGVuZ3RoKTtcblxuICAgICAgaWYgKG9sZExpbmUgIT09IG5ld0xpbmUpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIG9sZFRtcCA9IG9sZFRtcC5zbGljZSgwLCAtb2xkTGluZS5sZW5ndGgpO1xuICAgICAgbmV3VG1wID0gbmV3VG1wLnNsaWNlKDAsIC1vbGRMaW5lLmxlbmd0aCk7XG4gICAgICBjb25zdCBubEluZGV4MiA9IG9sZFRtcC5sYXN0SW5kZXhPZihcIlxcblwiKTtcbiAgICAgIGNoYW5nZVRvLmNoID1cbiAgICAgICAgbmxJbmRleDIgPj0gMCA/IG9sZFRtcC5sZW5ndGggLSBubEluZGV4MiAtIDEgOiBvbGRUbXAubGVuZ3RoO1xuICAgICAgY2hhbmdlVG8ubGluZS0tO1xuICAgIH1cblxuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBjb25zdCBubEluZGV4ID0gb2xkVG1wLmluZGV4T2YoXCJcXG5cIik7XG5cbiAgICAgIGlmIChubEluZGV4IDwgMCkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgY29uc3Qgb2xkTGluZSA9IG9sZFRtcC5zbGljZSgwLCBubEluZGV4ICsgMSk7XG4gICAgICBjb25zdCBuZXdMaW5lID0gbmV3VG1wLnNsaWNlKDAsIG9sZExpbmUubGVuZ3RoKTtcblxuICAgICAgaWYgKG9sZExpbmUgIT09IG5ld0xpbmUpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGNoYW5nZUZyb20ubGluZSsrO1xuICAgICAgb2xkVG1wID0gb2xkVG1wLnNsaWNlKG9sZExpbmUubGVuZ3RoKTtcbiAgICAgIG5ld1RtcCA9IG5ld1RtcC5zbGljZShvbGRMaW5lLmxlbmd0aCk7XG4gICAgfVxuXG4gICAgaWYgKG9sZFRtcCA9PT0gbmV3VG1wKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgcmVwbGFjZW1lbnQ6IG5ld1RtcCxcbiAgICAgIGNoYW5nZUZyb20sXG4gICAgICBjaGFuZ2VUbyxcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBjYWxjdWxhdGVGb2xkaW5nT3ByYXRpb25zKFxuICAgIHByZXZSb290OiBSb290LFxuICAgIG5ld1Jvb3Q6IFJvb3QsXG4gICAgY2hhbmdlRnJvbTogUG9zaXRpb24sXG4gICAgY2hhbmdlVG86IFBvc2l0aW9uLFxuICApIHtcbiAgICBjb25zdCBjaGFuZ2VkUmFuZ2U6IFtQb3NpdGlvbiwgUG9zaXRpb25dID0gW2NoYW5nZUZyb20sIGNoYW5nZVRvXTtcblxuICAgIGNvbnN0IHByZXZMaXN0cyA9IGdldEFsbENoaWxkcmVuKHByZXZSb290KTtcbiAgICBjb25zdCBuZXdMaXN0cyA9IGdldEFsbENoaWxkcmVuKG5ld1Jvb3QpO1xuXG4gICAgY29uc3QgdW5mb2xkOiBudW1iZXJbXSA9IFtdO1xuICAgIGNvbnN0IGZvbGQ6IG51bWJlcltdID0gW107XG5cbiAgICBmb3IgKGNvbnN0IHByZXZMaXN0IG9mIHByZXZMaXN0cy52YWx1ZXMoKSkge1xuICAgICAgaWYgKCFwcmV2TGlzdC5pc0ZvbGRSb290KCkpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IG5ld0xpc3QgPSBuZXdMaXN0cy5nZXQocHJldkxpc3QuZ2V0SUQoKSk7XG5cbiAgICAgIGlmICghbmV3TGlzdCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcHJldkxpc3RSYW5nZTogW1Bvc2l0aW9uLCBQb3NpdGlvbl0gPSBbXG4gICAgICAgIHByZXZMaXN0LmdldEZpcnN0TGluZUNvbnRlbnRTdGFydCgpLFxuICAgICAgICBwcmV2TGlzdC5nZXRDb250ZW50RW5kSW5jbHVkaW5nQ2hpbGRyZW4oKSxcbiAgICAgIF07XG5cbiAgICAgIGlmIChpc1Jhbmdlc0ludGVyc2VjdHMocHJldkxpc3RSYW5nZSwgY2hhbmdlZFJhbmdlKSkge1xuICAgICAgICB1bmZvbGQucHVzaChwcmV2TGlzdC5nZXRGaXJzdExpbmVDb250ZW50U3RhcnQoKS5saW5lKTtcbiAgICAgICAgZm9sZC5wdXNoKG5ld0xpc3QuZ2V0Rmlyc3RMaW5lQ29udGVudFN0YXJ0KCkubGluZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdW5mb2xkLnNvcnQoKGEsIGIpID0+IGIgLSBhKTtcbiAgICBmb2xkLnNvcnQoKGEsIGIpID0+IGIgLSBhKTtcblxuICAgIHJldHVybiB7IHVuZm9sZCwgZm9sZCB9O1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldEFsbENoaWxkcmVuUmVkdWNlRm4oYWNjOiBNYXA8bnVtYmVyLCBMaXN0PiwgY2hpbGQ6IExpc3QpIHtcbiAgYWNjLnNldChjaGlsZC5nZXRJRCgpLCBjaGlsZCk7XG4gIGNoaWxkLmdldENoaWxkcmVuKCkucmVkdWNlKGdldEFsbENoaWxkcmVuUmVkdWNlRm4sIGFjYyk7XG5cbiAgcmV0dXJuIGFjYztcbn1cblxuZnVuY3Rpb24gZ2V0QWxsQ2hpbGRyZW4ocm9vdDogUm9vdCk6IE1hcDxudW1iZXIsIExpc3Q+IHtcbiAgcmV0dXJuIHJvb3QuZ2V0Q2hpbGRyZW4oKS5yZWR1Y2UoZ2V0QWxsQ2hpbGRyZW5SZWR1Y2VGbiwgbmV3IE1hcCgpKTtcbn1cbiIsImltcG9ydCB7IFBsYXRmb3JtIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmV4cG9ydCBjbGFzcyBJTUVEZXRlY3RvciB7XG4gIHByaXZhdGUgY29tcG9zaXRpb24gPSBmYWxzZTtcblxuICBhc3luYyBsb2FkKCkge1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjb21wb3NpdGlvbnN0YXJ0XCIsIHRoaXMub25Db21wb3NpdGlvblN0YXJ0KTtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiY29tcG9zaXRpb25lbmRcIiwgdGhpcy5vbkNvbXBvc2l0aW9uRW5kKTtcbiAgfVxuXG4gIGFzeW5jIHVubG9hZCgpIHtcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwiY29tcG9zaXRpb25lbmRcIiwgdGhpcy5vbkNvbXBvc2l0aW9uRW5kKTtcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwiY29tcG9zaXRpb25zdGFydFwiLCB0aGlzLm9uQ29tcG9zaXRpb25TdGFydCk7XG4gIH1cblxuICBpc09wZW5lZCgpIHtcbiAgICByZXR1cm4gdGhpcy5jb21wb3NpdGlvbiAmJiBQbGF0Zm9ybS5pc0Rlc2t0b3A7XG4gIH1cblxuICBwcml2YXRlIG9uQ29tcG9zaXRpb25TdGFydCA9ICgpID0+IHtcbiAgICB0aGlzLmNvbXBvc2l0aW9uID0gdHJ1ZTtcbiAgfTtcblxuICBwcml2YXRlIG9uQ29tcG9zaXRpb25FbmQgPSAoKSA9PiB7XG4gICAgdGhpcy5jb21wb3NpdGlvbiA9IGZhbHNlO1xuICB9O1xufVxuIiwiLyogZXNsaW50LWRpc2FibGUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueSAqL1xuaW1wb3J0IHsgU2V0dGluZ3MgfSBmcm9tIFwiLi9TZXR0aW5nc1wiO1xuXG5leHBvcnQgY2xhc3MgTG9nZ2VyIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBzZXR0aW5nczogU2V0dGluZ3MpIHt9XG5cbiAgbG9nKG1ldGhvZDogc3RyaW5nLCAuLi5hcmdzOiBhbnlbXSkge1xuICAgIGlmICghdGhpcy5zZXR0aW5ncy5kZWJ1Zykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnNvbGUuaW5mbyhtZXRob2QsIC4uLmFyZ3MpO1xuICB9XG5cbiAgYmluZChtZXRob2Q6IHN0cmluZykge1xuICAgIHJldHVybiAoLi4uYXJnczogYW55W10pID0+IHRoaXMubG9nKG1ldGhvZCwgLi4uYXJncyk7XG4gIH1cbn1cbiIsImltcG9ydCB7IEFwcCB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIE9ic2lkaWFuVGFic1NldHRpbmdzIHtcbiAgdXNlVGFiOiBib29sZWFuO1xuICB0YWJTaXplOiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgT2JzaWRpYW5Gb2xkU2V0dGluZ3Mge1xuICBmb2xkSW5kZW50OiBib29sZWFuO1xufVxuXG5mdW5jdGlvbiBnZXRIaWRkZW5PYnNpZGlhbkNvbmZpZyhhcHA6IEFwcCkge1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICByZXR1cm4gKGFwcC52YXVsdCBhcyBhbnkpLmNvbmZpZztcbn1cblxuZXhwb3J0IGNsYXNzIE9ic2lkaWFuU2V0dGluZ3Mge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGFwcDogQXBwKSB7fVxuXG4gIGlzTGVnYWN5RWRpdG9yRW5hYmxlZCgpIHtcbiAgICBjb25zdCBjb25maWc6IHsgbGVnYWN5RWRpdG9yOiBib29sZWFuIH0gPSB7XG4gICAgICBsZWdhY3lFZGl0b3I6IGZhbHNlLFxuICAgICAgLi4uZ2V0SGlkZGVuT2JzaWRpYW5Db25maWcodGhpcy5hcHApLFxuICAgIH07XG5cbiAgICByZXR1cm4gY29uZmlnLmxlZ2FjeUVkaXRvcjtcbiAgfVxuXG4gIGlzRGVmYXVsdFRoZW1lRW5hYmxlZCgpIHtcbiAgICBjb25zdCBjb25maWc6IHsgY3NzVGhlbWU6IHN0cmluZyB9ID0ge1xuICAgICAgY3NzVGhlbWU6IFwiXCIsXG4gICAgICAuLi5nZXRIaWRkZW5PYnNpZGlhbkNvbmZpZyh0aGlzLmFwcCksXG4gICAgfTtcblxuICAgIHJldHVybiBjb25maWcuY3NzVGhlbWUgPT09IFwiXCI7XG4gIH1cblxuICBnZXRUYWJzU2V0dGluZ3MoKTogT2JzaWRpYW5UYWJzU2V0dGluZ3Mge1xuICAgIHJldHVybiB7XG4gICAgICB1c2VUYWI6IHRydWUsXG4gICAgICB0YWJTaXplOiA0LFxuICAgICAgLi4uZ2V0SGlkZGVuT2JzaWRpYW5Db25maWcodGhpcy5hcHApLFxuICAgIH07XG4gIH1cblxuICBnZXRGb2xkU2V0dGluZ3MoKTogT2JzaWRpYW5Gb2xkU2V0dGluZ3Mge1xuICAgIHJldHVybiB7XG4gICAgICBmb2xkSW5kZW50OiB0cnVlLFxuICAgICAgLi4uZ2V0SGlkZGVuT2JzaWRpYW5Db25maWcodGhpcy5hcHApLFxuICAgIH07XG4gIH1cblxuICBnZXREZWZhdWx0SW5kZW50Q2hhcnMoKSB7XG4gICAgY29uc3QgeyB1c2VUYWIsIHRhYlNpemUgfSA9IHRoaXMuZ2V0VGFic1NldHRpbmdzKCk7XG5cbiAgICByZXR1cm4gdXNlVGFiID8gXCJcXHRcIiA6IG5ldyBBcnJheSh0YWJTaXplKS5maWxsKFwiIFwiKS5qb2luKFwiXCIpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBDaGFuZ2VzQXBwbGljYXRvciB9IGZyb20gXCIuL0NoYW5nZXNBcHBsaWNhdG9yXCI7XG5pbXBvcnQgeyBQYXJzZXIgfSBmcm9tIFwiLi9QYXJzZXJcIjtcblxuaW1wb3J0IHsgTXlFZGl0b3IgfSBmcm9tIFwiLi4vZWRpdG9yXCI7XG5pbXBvcnQgeyBPcGVyYXRpb24gfSBmcm9tIFwiLi4vb3BlcmF0aW9ucy9PcGVyYXRpb25cIjtcbmltcG9ydCB7IFJvb3QgfSBmcm9tIFwiLi4vcm9vdFwiO1xuXG5leHBvcnQgY2xhc3MgT3BlcmF0aW9uUGVyZm9ybWVyIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBwYXJzZXI6IFBhcnNlcixcbiAgICBwcml2YXRlIGNoYW5nZXNBcHBsaWNhdG9yOiBDaGFuZ2VzQXBwbGljYXRvcixcbiAgKSB7fVxuXG4gIGV2YWwocm9vdDogUm9vdCwgb3A6IE9wZXJhdGlvbiwgZWRpdG9yOiBNeUVkaXRvcikge1xuICAgIGNvbnN0IHByZXZSb290ID0gcm9vdC5jbG9uZSgpO1xuXG4gICAgb3AucGVyZm9ybSgpO1xuXG4gICAgaWYgKG9wLnNob3VsZFVwZGF0ZSgpKSB7XG4gICAgICB0aGlzLmNoYW5nZXNBcHBsaWNhdG9yLmFwcGx5KGVkaXRvciwgcHJldlJvb3QsIHJvb3QpO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBzaG91bGRVcGRhdGU6IG9wLnNob3VsZFVwZGF0ZSgpLFxuICAgICAgc2hvdWxkU3RvcFByb3BhZ2F0aW9uOiBvcC5zaG91bGRTdG9wUHJvcGFnYXRpb24oKSxcbiAgICB9O1xuICB9XG5cbiAgcGVyZm9ybShcbiAgICBjYjogKHJvb3Q6IFJvb3QpID0+IE9wZXJhdGlvbixcbiAgICBlZGl0b3I6IE15RWRpdG9yLFxuICAgIGN1cnNvciA9IGVkaXRvci5nZXRDdXJzb3IoKSxcbiAgKSB7XG4gICAgY29uc3Qgcm9vdCA9IHRoaXMucGFyc2VyLnBhcnNlKGVkaXRvciwgY3Vyc29yKTtcblxuICAgIGlmICghcm9vdCkge1xuICAgICAgcmV0dXJuIHsgc2hvdWxkVXBkYXRlOiBmYWxzZSwgc2hvdWxkU3RvcFByb3BhZ2F0aW9uOiBmYWxzZSB9O1xuICAgIH1cblxuICAgIGNvbnN0IG9wID0gY2Iocm9vdCk7XG5cbiAgICByZXR1cm4gdGhpcy5ldmFsKHJvb3QsIG9wLCBlZGl0b3IpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBMb2dnZXIgfSBmcm9tIFwiLi9Mb2dnZXJcIjtcbmltcG9ydCB7IFNldHRpbmdzIH0gZnJvbSBcIi4vU2V0dGluZ3NcIjtcblxuaW1wb3J0IHsgTGlzdCwgUm9vdCB9IGZyb20gXCIuLi9yb290XCI7XG5pbXBvcnQgeyBjaGVja2JveFJlIH0gZnJvbSBcIi4uL3V0aWxzL2NoZWNrYm94UmVcIjtcblxuY29uc3QgYnVsbGV0U2lnblJlID0gYCg/OlstKitdfFxcXFxkK1xcXFwuKWA7XG5jb25zdCBvcHRpb25hbENoZWNrYm94UmUgPSBgKD86JHtjaGVja2JveFJlfSk/YDtcblxuY29uc3QgbGlzdEl0ZW1XaXRob3V0U3BhY2VzUmUgPSBuZXcgUmVnRXhwKGBeJHtidWxsZXRTaWduUmV9KCB8XFx0KWApO1xuY29uc3QgbGlzdEl0ZW1SZSA9IG5ldyBSZWdFeHAoYF5bIFxcdF0qJHtidWxsZXRTaWduUmV9KCB8XFx0KWApO1xuY29uc3Qgc3RyaW5nV2l0aFNwYWNlc1JlID0gbmV3IFJlZ0V4cChgXlsgXFx0XStgKTtcbmNvbnN0IHBhcnNlTGlzdEl0ZW1SZSA9IG5ldyBSZWdFeHAoXG4gIGBeKFsgXFx0XSopKCR7YnVsbGV0U2lnblJlfSkoIHxcXHQpKCR7b3B0aW9uYWxDaGVja2JveFJlfSkoLiopJGAsXG4pO1xuXG5leHBvcnQgaW50ZXJmYWNlIFJlYWRlclBvc2l0aW9uIHtcbiAgbGluZTogbnVtYmVyO1xuICBjaDogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJlYWRlclNlbGVjdGlvbiB7XG4gIGFuY2hvcjogUmVhZGVyUG9zaXRpb247XG4gIGhlYWQ6IFJlYWRlclBvc2l0aW9uO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJlYWRlciB7XG4gIGdldEN1cnNvcigpOiBSZWFkZXJQb3NpdGlvbjtcbiAgZ2V0TGluZShuOiBudW1iZXIpOiBzdHJpbmc7XG4gIGxhc3RMaW5lKCk6IG51bWJlcjtcbiAgbGlzdFNlbGVjdGlvbnMoKTogUmVhZGVyU2VsZWN0aW9uW107XG4gIGdldEFsbEZvbGRlZExpbmVzKCk6IG51bWJlcltdO1xufVxuXG5pbnRlcmZhY2UgUGFyc2VMaXN0TGlzdCB7XG4gIGdldEZpcnN0TGluZUluZGVudCgpOiBzdHJpbmc7XG4gIHNldE5vdGVzSW5kZW50KG5vdGVzSW5kZW50OiBzdHJpbmcpOiB2b2lkO1xuICBnZXROb3Rlc0luZGVudCgpOiBzdHJpbmcgfCBudWxsO1xuICBhZGRMaW5lKHRleHQ6IHN0cmluZyk6IHZvaWQ7XG4gIGdldFBhcmVudCgpOiBQYXJzZUxpc3RMaXN0IHwgbnVsbDtcbiAgYWRkQWZ0ZXJBbGwobGlzdDogUGFyc2VMaXN0TGlzdCk6IHZvaWQ7XG59XG5cbmV4cG9ydCBjbGFzcyBQYXJzZXIge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIGxvZ2dlcjogTG9nZ2VyLFxuICAgIHByaXZhdGUgc2V0dGluZ3M6IFNldHRpbmdzLFxuICApIHt9XG5cbiAgcGFyc2VSYW5nZShlZGl0b3I6IFJlYWRlciwgZnJvbUxpbmUgPSAwLCB0b0xpbmUgPSBlZGl0b3IubGFzdExpbmUoKSk6IFJvb3RbXSB7XG4gICAgY29uc3QgbGlzdHM6IFJvb3RbXSA9IFtdO1xuXG4gICAgZm9yIChsZXQgaSA9IGZyb21MaW5lOyBpIDw9IHRvTGluZTsgaSsrKSB7XG4gICAgICBjb25zdCBsaW5lID0gZWRpdG9yLmdldExpbmUoaSk7XG5cbiAgICAgIGlmIChpID09PSBmcm9tTGluZSB8fCB0aGlzLmlzTGlzdEl0ZW0obGluZSkpIHtcbiAgICAgICAgY29uc3QgbGlzdCA9IHRoaXMucGFyc2VXaXRoTGltaXRzKGVkaXRvciwgaSwgZnJvbUxpbmUsIHRvTGluZSk7XG5cbiAgICAgICAgaWYgKGxpc3QpIHtcbiAgICAgICAgICBsaXN0cy5wdXNoKGxpc3QpO1xuICAgICAgICAgIGkgPSBsaXN0LmdldENvbnRlbnRFbmQoKS5saW5lO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGxpc3RzO1xuICB9XG5cbiAgcGFyc2UoZWRpdG9yOiBSZWFkZXIsIGN1cnNvciA9IGVkaXRvci5nZXRDdXJzb3IoKSk6IFJvb3QgfCBudWxsIHtcbiAgICByZXR1cm4gdGhpcy5wYXJzZVdpdGhMaW1pdHMoZWRpdG9yLCBjdXJzb3IubGluZSwgMCwgZWRpdG9yLmxhc3RMaW5lKCkpO1xuICB9XG5cbiAgcHJpdmF0ZSBwYXJzZVdpdGhMaW1pdHMoXG4gICAgZWRpdG9yOiBSZWFkZXIsXG4gICAgcGFyc2luZ1N0YXJ0TGluZTogbnVtYmVyLFxuICAgIGxpbWl0RnJvbTogbnVtYmVyLFxuICAgIGxpbWl0VG86IG51bWJlcixcbiAgKTogUm9vdCB8IG51bGwge1xuICAgIGNvbnN0IGQgPSB0aGlzLmxvZ2dlci5iaW5kKFwicGFyc2VMaXN0XCIpO1xuICAgIGNvbnN0IGVycm9yID0gKG1zZzogc3RyaW5nKTogbnVsbCA9PiB7XG4gICAgICBkKG1zZyk7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9O1xuXG4gICAgY29uc3QgbGluZSA9IGVkaXRvci5nZXRMaW5lKHBhcnNpbmdTdGFydExpbmUpO1xuXG4gICAgbGV0IGxpc3RMb29raW5nUG9zOiBudW1iZXIgfCBudWxsID0gbnVsbDtcblxuICAgIGlmICh0aGlzLmlzTGlzdEl0ZW0obGluZSkpIHtcbiAgICAgIGxpc3RMb29raW5nUG9zID0gcGFyc2luZ1N0YXJ0TGluZTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuaXNMaW5lV2l0aEluZGVudChsaW5lKSkge1xuICAgICAgbGV0IGxpc3RMb29raW5nUG9zU2VhcmNoID0gcGFyc2luZ1N0YXJ0TGluZSAtIDE7XG4gICAgICB3aGlsZSAobGlzdExvb2tpbmdQb3NTZWFyY2ggPj0gMCkge1xuICAgICAgICBjb25zdCBsaW5lID0gZWRpdG9yLmdldExpbmUobGlzdExvb2tpbmdQb3NTZWFyY2gpO1xuICAgICAgICBpZiAodGhpcy5pc0xpc3RJdGVtKGxpbmUpKSB7XG4gICAgICAgICAgbGlzdExvb2tpbmdQb3MgPSBsaXN0TG9va2luZ1Bvc1NlYXJjaDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmlzTGluZVdpdGhJbmRlbnQobGluZSkpIHtcbiAgICAgICAgICBsaXN0TG9va2luZ1Bvc1NlYXJjaC0tO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGxpc3RMb29raW5nUG9zID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBsZXQgbGlzdFN0YXJ0TGluZTogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG4gICAgbGV0IGxpc3RTdGFydExpbmVMb29rdXAgPSBsaXN0TG9va2luZ1BvcztcbiAgICB3aGlsZSAobGlzdFN0YXJ0TGluZUxvb2t1cCA+PSAwKSB7XG4gICAgICBjb25zdCBsaW5lID0gZWRpdG9yLmdldExpbmUobGlzdFN0YXJ0TGluZUxvb2t1cCk7XG4gICAgICBpZiAoIXRoaXMuaXNMaXN0SXRlbShsaW5lKSAmJiAhdGhpcy5pc0xpbmVXaXRoSW5kZW50KGxpbmUpKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuaXNMaXN0SXRlbVdpdGhvdXRTcGFjZXMobGluZSkpIHtcbiAgICAgICAgbGlzdFN0YXJ0TGluZSA9IGxpc3RTdGFydExpbmVMb29rdXA7XG4gICAgICAgIGlmIChsaXN0U3RhcnRMaW5lTG9va3VwIDw9IGxpbWl0RnJvbSkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBsaXN0U3RhcnRMaW5lTG9va3VwLS07XG4gICAgfVxuXG4gICAgaWYgKGxpc3RTdGFydExpbmUgPT09IG51bGwpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGxldCBsaXN0RW5kTGluZSA9IGxpc3RMb29raW5nUG9zO1xuICAgIGxldCBsaXN0RW5kTGluZUxvb2t1cCA9IGxpc3RMb29raW5nUG9zO1xuICAgIHdoaWxlIChsaXN0RW5kTGluZUxvb2t1cCA8PSBlZGl0b3IubGFzdExpbmUoKSkge1xuICAgICAgY29uc3QgbGluZSA9IGVkaXRvci5nZXRMaW5lKGxpc3RFbmRMaW5lTG9va3VwKTtcbiAgICAgIGlmICghdGhpcy5pc0xpc3RJdGVtKGxpbmUpICYmICF0aGlzLmlzTGluZVdpdGhJbmRlbnQobGluZSkpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBpZiAoIXRoaXMuaXNFbXB0eUxpbmUobGluZSkpIHtcbiAgICAgICAgbGlzdEVuZExpbmUgPSBsaXN0RW5kTGluZUxvb2t1cDtcbiAgICAgIH1cbiAgICAgIGlmIChsaXN0RW5kTGluZUxvb2t1cCA+PSBsaW1pdFRvKSB7XG4gICAgICAgIGxpc3RFbmRMaW5lID0gbGltaXRUbztcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBsaXN0RW5kTGluZUxvb2t1cCsrO1xuICAgIH1cblxuICAgIGlmIChsaXN0U3RhcnRMaW5lID4gcGFyc2luZ1N0YXJ0TGluZSB8fCBsaXN0RW5kTGluZSA8IHBhcnNpbmdTdGFydExpbmUpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8vIGlmIHRoZSBsYXN0IGxpbmUgY29udGFpbnMgb25seSBzcGFjZXMgYW5kIHRoYXQncyBpbmNvcnJlY3QgaW5kZW50LCB0aGVuIGlnbm9yZSB0aGUgbGFzdCBsaW5lXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3ZzbGlua28vb2JzaWRpYW4tb3V0bGluZXIvaXNzdWVzLzM2OFxuICAgIGlmIChsaXN0RW5kTGluZSA+IGxpc3RTdGFydExpbmUpIHtcbiAgICAgIGNvbnN0IGxhc3RMaW5lID0gZWRpdG9yLmdldExpbmUobGlzdEVuZExpbmUpO1xuICAgICAgaWYgKGxhc3RMaW5lLnRyaW0oKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgY29uc3QgcHJldkxpbmUgPSBlZGl0b3IuZ2V0TGluZShsaXN0RW5kTGluZSAtIDEpO1xuICAgICAgICBjb25zdCBbLCBwcmV2TGluZUluZGVudF0gPSAvXihcXHMqKS8uZXhlYyhwcmV2TGluZSk7XG4gICAgICAgIGlmICghbGFzdExpbmUuc3RhcnRzV2l0aChwcmV2TGluZUluZGVudCkpIHtcbiAgICAgICAgICBsaXN0RW5kTGluZS0tO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3Qgcm9vdCA9IG5ldyBSb290KFxuICAgICAgeyBsaW5lOiBsaXN0U3RhcnRMaW5lLCBjaDogMCB9LFxuICAgICAgeyBsaW5lOiBsaXN0RW5kTGluZSwgY2g6IGVkaXRvci5nZXRMaW5lKGxpc3RFbmRMaW5lKS5sZW5ndGggfSxcbiAgICAgIGVkaXRvci5saXN0U2VsZWN0aW9ucygpLm1hcCgocikgPT4gKHtcbiAgICAgICAgYW5jaG9yOiB7IGxpbmU6IHIuYW5jaG9yLmxpbmUsIGNoOiByLmFuY2hvci5jaCB9LFxuICAgICAgICBoZWFkOiB7IGxpbmU6IHIuaGVhZC5saW5lLCBjaDogci5oZWFkLmNoIH0sXG4gICAgICB9KSksXG4gICAgKTtcblxuICAgIGxldCBjdXJyZW50UGFyZW50OiBQYXJzZUxpc3RMaXN0ID0gcm9vdC5nZXRSb290TGlzdCgpO1xuICAgIGxldCBjdXJyZW50TGlzdDogUGFyc2VMaXN0TGlzdCB8IG51bGwgPSBudWxsO1xuICAgIGxldCBjdXJyZW50SW5kZW50ID0gXCJcIjtcblxuICAgIGNvbnN0IGZvbGRlZExpbmVzID0gZWRpdG9yLmdldEFsbEZvbGRlZExpbmVzKCk7XG5cbiAgICBmb3IgKGxldCBsID0gbGlzdFN0YXJ0TGluZTsgbCA8PSBsaXN0RW5kTGluZTsgbCsrKSB7XG4gICAgICBjb25zdCBsaW5lID0gZWRpdG9yLmdldExpbmUobCk7XG4gICAgICBjb25zdCBtYXRjaGVzID0gcGFyc2VMaXN0SXRlbVJlLmV4ZWMobGluZSk7XG5cbiAgICAgIGlmIChtYXRjaGVzKSB7XG4gICAgICAgIGNvbnN0IFssIGluZGVudCwgYnVsbGV0LCBzcGFjZUFmdGVyQnVsbGV0XSA9IG1hdGNoZXM7XG4gICAgICAgIGxldCBbLCAsICwgLCBvcHRpb25hbENoZWNrYm94LCBjb250ZW50XSA9IG1hdGNoZXM7XG5cbiAgICAgICAgY29udGVudCA9IG9wdGlvbmFsQ2hlY2tib3ggKyBjb250ZW50O1xuICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5rZWVwQ3Vyc29yV2l0aGluQ29udGVudCAhPT0gXCJidWxsZXQtYW5kLWNoZWNrYm94XCIpIHtcbiAgICAgICAgICBvcHRpb25hbENoZWNrYm94ID0gXCJcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNvbXBhcmVMZW5ndGggPSBNYXRoLm1pbihjdXJyZW50SW5kZW50Lmxlbmd0aCwgaW5kZW50Lmxlbmd0aCk7XG4gICAgICAgIGNvbnN0IGluZGVudFNsaWNlID0gaW5kZW50LnNsaWNlKDAsIGNvbXBhcmVMZW5ndGgpO1xuICAgICAgICBjb25zdCBjdXJyZW50SW5kZW50U2xpY2UgPSBjdXJyZW50SW5kZW50LnNsaWNlKDAsIGNvbXBhcmVMZW5ndGgpO1xuXG4gICAgICAgIGlmIChpbmRlbnRTbGljZSAhPT0gY3VycmVudEluZGVudFNsaWNlKSB7XG4gICAgICAgICAgY29uc3QgZXhwZWN0ZWQgPSBjdXJyZW50SW5kZW50U2xpY2VcbiAgICAgICAgICAgIC5yZXBsYWNlKC8gL2csIFwiU1wiKVxuICAgICAgICAgICAgLnJlcGxhY2UoL1xcdC9nLCBcIlRcIik7XG4gICAgICAgICAgY29uc3QgZ290ID0gaW5kZW50U2xpY2UucmVwbGFjZSgvIC9nLCBcIlNcIikucmVwbGFjZSgvXFx0L2csIFwiVFwiKTtcblxuICAgICAgICAgIHJldHVybiBlcnJvcihcbiAgICAgICAgICAgIGBVbmFibGUgdG8gcGFyc2UgbGlzdDogZXhwZWN0ZWQgaW5kZW50IFwiJHtleHBlY3RlZH1cIiwgZ290IFwiJHtnb3R9XCJgLFxuICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaW5kZW50Lmxlbmd0aCA+IGN1cnJlbnRJbmRlbnQubGVuZ3RoKSB7XG4gICAgICAgICAgY3VycmVudFBhcmVudCA9IGN1cnJlbnRMaXN0O1xuICAgICAgICAgIGN1cnJlbnRJbmRlbnQgPSBpbmRlbnQ7XG4gICAgICAgIH0gZWxzZSBpZiAoaW5kZW50Lmxlbmd0aCA8IGN1cnJlbnRJbmRlbnQubGVuZ3RoKSB7XG4gICAgICAgICAgd2hpbGUgKFxuICAgICAgICAgICAgY3VycmVudFBhcmVudC5nZXRGaXJzdExpbmVJbmRlbnQoKS5sZW5ndGggPj0gaW5kZW50Lmxlbmd0aCAmJlxuICAgICAgICAgICAgY3VycmVudFBhcmVudC5nZXRQYXJlbnQoKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgY3VycmVudFBhcmVudCA9IGN1cnJlbnRQYXJlbnQuZ2V0UGFyZW50KCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGN1cnJlbnRJbmRlbnQgPSBpbmRlbnQ7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBmb2xkUm9vdCA9IGZvbGRlZExpbmVzLmluY2x1ZGVzKGwpO1xuXG4gICAgICAgIGN1cnJlbnRMaXN0ID0gbmV3IExpc3QoXG4gICAgICAgICAgcm9vdCxcbiAgICAgICAgICBpbmRlbnQsXG4gICAgICAgICAgYnVsbGV0LFxuICAgICAgICAgIG9wdGlvbmFsQ2hlY2tib3gsXG4gICAgICAgICAgc3BhY2VBZnRlckJ1bGxldCxcbiAgICAgICAgICBjb250ZW50LFxuICAgICAgICAgIGZvbGRSb290LFxuICAgICAgICApO1xuICAgICAgICBjdXJyZW50UGFyZW50LmFkZEFmdGVyQWxsKGN1cnJlbnRMaXN0KTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5pc0xpbmVXaXRoSW5kZW50KGxpbmUpKSB7XG4gICAgICAgIGlmICghY3VycmVudExpc3QpIHtcbiAgICAgICAgICByZXR1cm4gZXJyb3IoXG4gICAgICAgICAgICBgVW5hYmxlIHRvIHBhcnNlIGxpc3Q6IGV4cGVjdGVkIGxpc3QgaXRlbSwgZ290IGVtcHR5IGxpbmVgLFxuICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBpbmRlbnRUb0NoZWNrID0gY3VycmVudExpc3QuZ2V0Tm90ZXNJbmRlbnQoKSB8fCBjdXJyZW50SW5kZW50O1xuXG4gICAgICAgIGlmIChsaW5lLmluZGV4T2YoaW5kZW50VG9DaGVjaykgIT09IDApIHtcbiAgICAgICAgICBjb25zdCBleHBlY3RlZCA9IGluZGVudFRvQ2hlY2sucmVwbGFjZSgvIC9nLCBcIlNcIikucmVwbGFjZSgvXFx0L2csIFwiVFwiKTtcbiAgICAgICAgICBjb25zdCBnb3QgPSBsaW5lXG4gICAgICAgICAgICAubWF0Y2goL15bIFxcdF0qLylbMF1cbiAgICAgICAgICAgIC5yZXBsYWNlKC8gL2csIFwiU1wiKVxuICAgICAgICAgICAgLnJlcGxhY2UoL1xcdC9nLCBcIlRcIik7XG5cbiAgICAgICAgICByZXR1cm4gZXJyb3IoXG4gICAgICAgICAgICBgVW5hYmxlIHRvIHBhcnNlIGxpc3Q6IGV4cGVjdGVkIGluZGVudCBcIiR7ZXhwZWN0ZWR9XCIsIGdvdCBcIiR7Z290fVwiYCxcbiAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFjdXJyZW50TGlzdC5nZXROb3Rlc0luZGVudCgpKSB7XG4gICAgICAgICAgY29uc3QgbWF0Y2hlcyA9IGxpbmUubWF0Y2goL15bIFxcdF0rLyk7XG5cbiAgICAgICAgICBpZiAoIW1hdGNoZXMgfHwgbWF0Y2hlc1swXS5sZW5ndGggPD0gY3VycmVudEluZGVudC5sZW5ndGgpIHtcbiAgICAgICAgICAgIGlmICgvXlxccyskLy50ZXN0KGxpbmUpKSB7XG4gICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gZXJyb3IoXG4gICAgICAgICAgICAgIGBVbmFibGUgdG8gcGFyc2UgbGlzdDogZXhwZWN0ZWQgc29tZSBpbmRlbnQsIGdvdCBubyBpbmRlbnRgLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjdXJyZW50TGlzdC5zZXROb3Rlc0luZGVudChtYXRjaGVzWzBdKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGN1cnJlbnRMaXN0LmFkZExpbmUobGluZS5zbGljZShjdXJyZW50TGlzdC5nZXROb3Rlc0luZGVudCgpLmxlbmd0aCkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGVycm9yKFxuICAgICAgICAgIGBVbmFibGUgdG8gcGFyc2UgbGlzdDogZXhwZWN0ZWQgbGlzdCBpdGVtIG9yIG5vdGUsIGdvdCBcIiR7bGluZX1cImAsXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJvb3Q7XG4gIH1cblxuICBwcml2YXRlIGlzRW1wdHlMaW5lKGxpbmU6IHN0cmluZykge1xuICAgIHJldHVybiBsaW5lLmxlbmd0aCA9PT0gMDtcbiAgfVxuXG4gIHByaXZhdGUgaXNMaW5lV2l0aEluZGVudChsaW5lOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gc3RyaW5nV2l0aFNwYWNlc1JlLnRlc3QobGluZSk7XG4gIH1cblxuICBwcml2YXRlIGlzTGlzdEl0ZW0obGluZTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIGxpc3RJdGVtUmUudGVzdChsaW5lKTtcbiAgfVxuXG4gIHByaXZhdGUgaXNMaXN0SXRlbVdpdGhvdXRTcGFjZXMobGluZTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIGxpc3RJdGVtV2l0aG91dFNwYWNlc1JlLnRlc3QobGluZSk7XG4gIH1cbn1cbiIsImV4cG9ydCB0eXBlIFZlcnRpY2FsTGluZXNBY3Rpb24gPSBcIm5vbmVcIiB8IFwiem9vbS1pblwiIHwgXCJ0b2dnbGUtZm9sZGluZ1wiO1xuZXhwb3J0IHR5cGUgS2VlcEN1cnNvcldpdGhpbkNvbnRlbnQgPVxuICB8IFwibmV2ZXJcIlxuICB8IFwiYnVsbGV0LW9ubHlcIlxuICB8IFwiYnVsbGV0LWFuZC1jaGVja2JveFwiO1xuXG5pbnRlcmZhY2UgU2V0dGluZ3NPYmplY3Qge1xuICBzdHlsZUxpc3RzOiBib29sZWFuO1xuICBkZWJ1ZzogYm9vbGVhbjtcbiAgc3RpY2tDdXJzb3I6IEtlZXBDdXJzb3JXaXRoaW5Db250ZW50IHwgYm9vbGVhbjtcbiAgYmV0dGVyRW50ZXI6IGJvb2xlYW47XG4gIGJldHRlclZpbU86IGJvb2xlYW47XG4gIGJldHRlclRhYjogYm9vbGVhbjtcbiAgc2VsZWN0QWxsOiBib29sZWFuO1xuICBsaXN0TGluZXM6IGJvb2xlYW47XG4gIGxpc3RMaW5lQWN0aW9uOiBWZXJ0aWNhbExpbmVzQWN0aW9uO1xuICBkbmQ6IGJvb2xlYW47XG4gIHByZXZpb3VzUmVsZWFzZTogc3RyaW5nIHwgbnVsbDtcbn1cblxuY29uc3QgREVGQVVMVF9TRVRUSU5HUzogU2V0dGluZ3NPYmplY3QgPSB7XG4gIHN0eWxlTGlzdHM6IHRydWUsXG4gIGRlYnVnOiBmYWxzZSxcbiAgc3RpY2tDdXJzb3I6IFwiYnVsbGV0LWFuZC1jaGVja2JveFwiLFxuICBiZXR0ZXJFbnRlcjogdHJ1ZSxcbiAgYmV0dGVyVmltTzogdHJ1ZSxcbiAgYmV0dGVyVGFiOiB0cnVlLFxuICBzZWxlY3RBbGw6IHRydWUsXG4gIGxpc3RMaW5lczogZmFsc2UsXG4gIGxpc3RMaW5lQWN0aW9uOiBcInRvZ2dsZS1mb2xkaW5nXCIsXG4gIGRuZDogdHJ1ZSxcbiAgcHJldmlvdXNSZWxlYXNlOiBudWxsLFxufTtcblxuZXhwb3J0IGludGVyZmFjZSBTdG9yYWdlIHtcbiAgbG9hZERhdGEoKTogUHJvbWlzZTxTZXR0aW5nc09iamVjdD47XG4gIHNhdmVEYXRhKHNldHRpbmdzOiBTZXR0aW5nc09iamVjdCk6IFByb21pc2U8dm9pZD47XG59XG5cbnR5cGUgQ2FsbGJhY2sgPSAoKSA9PiB2b2lkO1xuXG5leHBvcnQgY2xhc3MgU2V0dGluZ3Mge1xuICBwcml2YXRlIHN0b3JhZ2U6IFN0b3JhZ2U7XG4gIHByaXZhdGUgdmFsdWVzOiBTZXR0aW5nc09iamVjdDtcbiAgcHJpdmF0ZSBjYWxsYmFja3M6IFNldDxDYWxsYmFjaz47XG5cbiAgY29uc3RydWN0b3Ioc3RvcmFnZTogU3RvcmFnZSkge1xuICAgIHRoaXMuc3RvcmFnZSA9IHN0b3JhZ2U7XG4gICAgdGhpcy5jYWxsYmFja3MgPSBuZXcgU2V0KCk7XG4gIH1cblxuICBnZXQga2VlcEN1cnNvcldpdGhpbkNvbnRlbnQoKSB7XG4gICAgLy8gQWRhcHRvciBmb3IgdXNlcnMgbWlncmF0aW5nIGZyb20gb2xkZXIgdmVyc2lvbiBvZiB0aGUgcGx1Z2luLlxuICAgIGlmICh0aGlzLnZhbHVlcy5zdGlja0N1cnNvciA9PT0gdHJ1ZSkge1xuICAgICAgcmV0dXJuIFwiYnVsbGV0LWFuZC1jaGVja2JveFwiO1xuICAgIH0gZWxzZSBpZiAodGhpcy52YWx1ZXMuc3RpY2tDdXJzb3IgPT09IGZhbHNlKSB7XG4gICAgICByZXR1cm4gXCJuZXZlclwiO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnZhbHVlcy5zdGlja0N1cnNvcjtcbiAgfVxuXG4gIHNldCBrZWVwQ3Vyc29yV2l0aGluQ29udGVudCh2YWx1ZTogS2VlcEN1cnNvcldpdGhpbkNvbnRlbnQpIHtcbiAgICB0aGlzLnNldChcInN0aWNrQ3Vyc29yXCIsIHZhbHVlKTtcbiAgfVxuXG4gIGdldCBvdmVycmlkZVRhYkJlaGF2aW91cigpIHtcbiAgICByZXR1cm4gdGhpcy52YWx1ZXMuYmV0dGVyVGFiO1xuICB9XG5cbiAgc2V0IG92ZXJyaWRlVGFiQmVoYXZpb3VyKHZhbHVlOiBib29sZWFuKSB7XG4gICAgdGhpcy5zZXQoXCJiZXR0ZXJUYWJcIiwgdmFsdWUpO1xuICB9XG5cbiAgZ2V0IG92ZXJyaWRlRW50ZXJCZWhhdmlvdXIoKSB7XG4gICAgcmV0dXJuIHRoaXMudmFsdWVzLmJldHRlckVudGVyO1xuICB9XG5cbiAgc2V0IG92ZXJyaWRlRW50ZXJCZWhhdmlvdXIodmFsdWU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLnNldChcImJldHRlckVudGVyXCIsIHZhbHVlKTtcbiAgfVxuXG4gIGdldCBvdmVycmlkZVZpbU9CZWhhdmlvdXIoKSB7XG4gICAgcmV0dXJuIHRoaXMudmFsdWVzLmJldHRlclZpbU87XG4gIH1cblxuICBzZXQgb3ZlcnJpZGVWaW1PQmVoYXZpb3VyKHZhbHVlOiBib29sZWFuKSB7XG4gICAgdGhpcy5zZXQoXCJiZXR0ZXJWaW1PXCIsIHZhbHVlKTtcbiAgfVxuXG4gIGdldCBvdmVycmlkZVNlbGVjdEFsbEJlaGF2aW91cigpIHtcbiAgICByZXR1cm4gdGhpcy52YWx1ZXMuc2VsZWN0QWxsO1xuICB9XG5cbiAgc2V0IG92ZXJyaWRlU2VsZWN0QWxsQmVoYXZpb3VyKHZhbHVlOiBib29sZWFuKSB7XG4gICAgdGhpcy5zZXQoXCJzZWxlY3RBbGxcIiwgdmFsdWUpO1xuICB9XG5cbiAgZ2V0IGJldHRlckxpc3RzU3R5bGVzKCkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlcy5zdHlsZUxpc3RzO1xuICB9XG5cbiAgc2V0IGJldHRlckxpc3RzU3R5bGVzKHZhbHVlOiBib29sZWFuKSB7XG4gICAgdGhpcy5zZXQoXCJzdHlsZUxpc3RzXCIsIHZhbHVlKTtcbiAgfVxuXG4gIGdldCB2ZXJ0aWNhbExpbmVzKCkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlcy5saXN0TGluZXM7XG4gIH1cblxuICBzZXQgdmVydGljYWxMaW5lcyh2YWx1ZTogYm9vbGVhbikge1xuICAgIHRoaXMuc2V0KFwibGlzdExpbmVzXCIsIHZhbHVlKTtcbiAgfVxuXG4gIGdldCB2ZXJ0aWNhbExpbmVzQWN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlcy5saXN0TGluZUFjdGlvbjtcbiAgfVxuXG4gIHNldCB2ZXJ0aWNhbExpbmVzQWN0aW9uKHZhbHVlOiBWZXJ0aWNhbExpbmVzQWN0aW9uKSB7XG4gICAgdGhpcy5zZXQoXCJsaXN0TGluZUFjdGlvblwiLCB2YWx1ZSk7XG4gIH1cblxuICBnZXQgZHJhZ0FuZERyb3AoKSB7XG4gICAgcmV0dXJuIHRoaXMudmFsdWVzLmRuZDtcbiAgfVxuXG4gIHNldCBkcmFnQW5kRHJvcCh2YWx1ZTogYm9vbGVhbikge1xuICAgIHRoaXMuc2V0KFwiZG5kXCIsIHZhbHVlKTtcbiAgfVxuXG4gIGdldCBkZWJ1ZygpIHtcbiAgICByZXR1cm4gdGhpcy52YWx1ZXMuZGVidWc7XG4gIH1cblxuICBzZXQgZGVidWcodmFsdWU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLnNldChcImRlYnVnXCIsIHZhbHVlKTtcbiAgfVxuXG4gIGdldCBwcmV2aW91c1JlbGVhc2UoKSB7XG4gICAgcmV0dXJuIHRoaXMudmFsdWVzLnByZXZpb3VzUmVsZWFzZTtcbiAgfVxuXG4gIHNldCBwcmV2aW91c1JlbGVhc2UodmFsdWU6IHN0cmluZyB8IG51bGwpIHtcbiAgICB0aGlzLnNldChcInByZXZpb3VzUmVsZWFzZVwiLCB2YWx1ZSk7XG4gIH1cblxuICBvbkNoYW5nZShjYjogQ2FsbGJhY2spIHtcbiAgICB0aGlzLmNhbGxiYWNrcy5hZGQoY2IpO1xuICB9XG5cbiAgcmVtb3ZlQ2FsbGJhY2soY2I6IENhbGxiYWNrKTogdm9pZCB7XG4gICAgdGhpcy5jYWxsYmFja3MuZGVsZXRlKGNiKTtcbiAgfVxuXG4gIHJlc2V0KCkge1xuICAgIGZvciAoY29uc3QgW2ssIHZdIG9mIE9iamVjdC5lbnRyaWVzKERFRkFVTFRfU0VUVElOR1MpKSB7XG4gICAgICB0aGlzLnNldChrIGFzIGtleW9mIFNldHRpbmdzT2JqZWN0LCB2KTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBsb2FkKCkge1xuICAgIHRoaXMudmFsdWVzID0gT2JqZWN0LmFzc2lnbihcbiAgICAgIHt9LFxuICAgICAgREVGQVVMVF9TRVRUSU5HUyxcbiAgICAgIGF3YWl0IHRoaXMuc3RvcmFnZS5sb2FkRGF0YSgpLFxuICAgICk7XG4gIH1cblxuICBhc3luYyBzYXZlKCkge1xuICAgIGF3YWl0IHRoaXMuc3RvcmFnZS5zYXZlRGF0YSh0aGlzLnZhbHVlcyk7XG4gIH1cblxuICBnZXRWYWx1ZXMoKTogU2V0dGluZ3NPYmplY3Qge1xuICAgIHJldHVybiB7IC4uLnRoaXMudmFsdWVzIH07XG4gIH1cblxuICBwcml2YXRlIHNldDxUIGV4dGVuZHMga2V5b2YgU2V0dGluZ3NPYmplY3Q+KFxuICAgIGtleTogVCxcbiAgICB2YWx1ZTogU2V0dGluZ3NPYmplY3RbVF0sXG4gICk6IHZvaWQge1xuICAgIHRoaXMudmFsdWVzW2tleV0gPSB2YWx1ZTtcblxuICAgIGZvciAoY29uc3QgY2Igb2YgdGhpcy5jYWxsYmFja3MpIHtcbiAgICAgIGNiKCk7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBQbHVnaW4gfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuaW1wb3J0IHsgQXJyb3dMZWZ0QW5kQ3RybEFycm93TGVmdEJlaGF2aW91ck92ZXJyaWRlIH0gZnJvbSBcIi4vZmVhdHVyZXMvQXJyb3dMZWZ0QW5kQ3RybEFycm93TGVmdEJlaGF2aW91ck92ZXJyaWRlXCI7XG5pbXBvcnQgeyBCYWNrc3BhY2VCZWhhdmlvdXJPdmVycmlkZSB9IGZyb20gXCIuL2ZlYXR1cmVzL0JhY2tzcGFjZUJlaGF2aW91ck92ZXJyaWRlXCI7XG5pbXBvcnQgeyBCZXR0ZXJMaXN0c1N0eWxlcyB9IGZyb20gXCIuL2ZlYXR1cmVzL0JldHRlckxpc3RzU3R5bGVzXCI7XG5pbXBvcnQgeyBDdHJsQUFuZENtZEFCZWhhdmlvdXJPdmVycmlkZSB9IGZyb20gXCIuL2ZlYXR1cmVzL0N0cmxBQW5kQ21kQUJlaGF2aW91ck92ZXJyaWRlXCI7XG5pbXBvcnQgeyBEZWxldGVCZWhhdmlvdXJPdmVycmlkZSB9IGZyb20gXCIuL2ZlYXR1cmVzL0RlbGV0ZUJlaGF2aW91ck92ZXJyaWRlXCI7XG5pbXBvcnQgeyBEcmFnQW5kRHJvcCB9IGZyb20gXCIuL2ZlYXR1cmVzL0RyYWdBbmREcm9wXCI7XG5pbXBvcnQgeyBFZGl0b3JTZWxlY3Rpb25zQmVoYXZpb3VyT3ZlcnJpZGUgfSBmcm9tIFwiLi9mZWF0dXJlcy9FZGl0b3JTZWxlY3Rpb25zQmVoYXZpb3VyT3ZlcnJpZGVcIjtcbmltcG9ydCB7IEVudGVyQmVoYXZpb3VyT3ZlcnJpZGUgfSBmcm9tIFwiLi9mZWF0dXJlcy9FbnRlckJlaGF2aW91ck92ZXJyaWRlXCI7XG5pbXBvcnQgeyBGZWF0dXJlIH0gZnJvbSBcIi4vZmVhdHVyZXMvRmVhdHVyZVwiO1xuaW1wb3J0IHsgTGlzdHNGb2xkaW5nQ29tbWFuZHMgfSBmcm9tIFwiLi9mZWF0dXJlcy9MaXN0c0ZvbGRpbmdDb21tYW5kc1wiO1xuaW1wb3J0IHsgTGlzdHNNb3ZlbWVudENvbW1hbmRzIH0gZnJvbSBcIi4vZmVhdHVyZXMvTGlzdHNNb3ZlbWVudENvbW1hbmRzXCI7XG5pbXBvcnQgeyBNZXRhQmFja3NwYWNlQmVoYXZpb3VyT3ZlcnJpZGUgfSBmcm9tIFwiLi9mZWF0dXJlcy9NZXRhQmFja3NwYWNlQmVoYXZpb3VyT3ZlcnJpZGVcIjtcbi8vIGltcG9ydCB7IFJlbGVhc2VOb3Rlc0Fubm91bmNlbWVudCB9IGZyb20gXCIuL2ZlYXR1cmVzL1JlbGVhc2VOb3Rlc0Fubm91bmNlbWVudFwiO1xuaW1wb3J0IHsgU2V0dGluZ3NUYWIgfSBmcm9tIFwiLi9mZWF0dXJlcy9TZXR0aW5nc1RhYlwiO1xuaW1wb3J0IHsgU2hpZnRUYWJCZWhhdmlvdXJPdmVycmlkZSB9IGZyb20gXCIuL2ZlYXR1cmVzL1NoaWZ0VGFiQmVoYXZpb3VyT3ZlcnJpZGVcIjtcbmltcG9ydCB7IFN5c3RlbUluZm8gfSBmcm9tIFwiLi9mZWF0dXJlcy9TeXN0ZW1JbmZvXCI7XG5pbXBvcnQgeyBUYWJCZWhhdmlvdXJPdmVycmlkZSB9IGZyb20gXCIuL2ZlYXR1cmVzL1RhYkJlaGF2aW91ck92ZXJyaWRlXCI7XG5pbXBvcnQgeyBWZXJ0aWNhbExpbmVzIH0gZnJvbSBcIi4vZmVhdHVyZXMvVmVydGljYWxMaW5lc1wiO1xuaW1wb3J0IHsgVmltT0JlaGF2aW91ck92ZXJyaWRlIH0gZnJvbSBcIi4vZmVhdHVyZXMvVmltT0JlaGF2aW91ck92ZXJyaWRlXCI7XG5pbXBvcnQgeyBDaGFuZ2VzQXBwbGljYXRvciB9IGZyb20gXCIuL3NlcnZpY2VzL0NoYW5nZXNBcHBsaWNhdG9yXCI7XG5pbXBvcnQgeyBJTUVEZXRlY3RvciB9IGZyb20gXCIuL3NlcnZpY2VzL0lNRURldGVjdG9yXCI7XG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tIFwiLi9zZXJ2aWNlcy9Mb2dnZXJcIjtcbmltcG9ydCB7IE9ic2lkaWFuU2V0dGluZ3MgfSBmcm9tIFwiLi9zZXJ2aWNlcy9PYnNpZGlhblNldHRpbmdzXCI7XG5pbXBvcnQgeyBPcGVyYXRpb25QZXJmb3JtZXIgfSBmcm9tIFwiLi9zZXJ2aWNlcy9PcGVyYXRpb25QZXJmb3JtZXJcIjtcbmltcG9ydCB7IFBhcnNlciB9IGZyb20gXCIuL3NlcnZpY2VzL1BhcnNlclwiO1xuaW1wb3J0IHsgU2V0dGluZ3MgfSBmcm9tIFwiLi9zZXJ2aWNlcy9TZXR0aW5nc1wiO1xuXG5kZWNsYXJlIGdsb2JhbCB7XG4gIGNvbnN0IFBMVUdJTl9WRVJTSU9OOiBzdHJpbmc7XG4gIGNvbnN0IENIQU5HRUxPR19NRDogc3RyaW5nO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBPYnNpZGlhbk91dGxpbmVyUGx1Z2luIGV4dGVuZHMgUGx1Z2luIHtcbiAgcHJpdmF0ZSBmZWF0dXJlczogRmVhdHVyZVtdO1xuICBwcm90ZWN0ZWQgc2V0dGluZ3M6IFNldHRpbmdzO1xuICBwcml2YXRlIGxvZ2dlcjogTG9nZ2VyO1xuICBwcml2YXRlIG9ic2lkaWFuU2V0dGluZ3M6IE9ic2lkaWFuU2V0dGluZ3M7XG4gIHByaXZhdGUgcGFyc2VyOiBQYXJzZXI7XG4gIHByaXZhdGUgY2hhbmdlc0FwcGxpY2F0b3I6IENoYW5nZXNBcHBsaWNhdG9yO1xuICBwcml2YXRlIG9wZXJhdGlvblBlcmZvcm1lcjogT3BlcmF0aW9uUGVyZm9ybWVyO1xuICBwcml2YXRlIGltZURldGVjdG9yOiBJTUVEZXRlY3RvcjtcblxuICBhc3luYyBvbmxvYWQoKSB7XG4gICAgY29uc29sZS5sb2coYExvYWRpbmcgb2JzaWRpYW4tb3V0bGluZXJgKTtcblxuICAgIGF3YWl0IHRoaXMucHJlcGFyZVNldHRpbmdzKCk7XG5cbiAgICB0aGlzLm9ic2lkaWFuU2V0dGluZ3MgPSBuZXcgT2JzaWRpYW5TZXR0aW5ncyh0aGlzLmFwcCk7XG4gICAgdGhpcy5sb2dnZXIgPSBuZXcgTG9nZ2VyKHRoaXMuc2V0dGluZ3MpO1xuICAgIHRoaXMucGFyc2VyID0gbmV3IFBhcnNlcih0aGlzLmxvZ2dlciwgdGhpcy5zZXR0aW5ncyk7XG4gICAgdGhpcy5jaGFuZ2VzQXBwbGljYXRvciA9IG5ldyBDaGFuZ2VzQXBwbGljYXRvcigpO1xuICAgIHRoaXMub3BlcmF0aW9uUGVyZm9ybWVyID0gbmV3IE9wZXJhdGlvblBlcmZvcm1lcihcbiAgICAgIHRoaXMucGFyc2VyLFxuICAgICAgdGhpcy5jaGFuZ2VzQXBwbGljYXRvcixcbiAgICApO1xuXG4gICAgdGhpcy5pbWVEZXRlY3RvciA9IG5ldyBJTUVEZXRlY3RvcigpO1xuICAgIGF3YWl0IHRoaXMuaW1lRGV0ZWN0b3IubG9hZCgpO1xuXG4gICAgdGhpcy5mZWF0dXJlcyA9IFtcbiAgICAgIC8vIHNlcnZpY2UgZmVhdHVyZXNcbiAgICAgIC8vIG5ldyBSZWxlYXNlTm90ZXNBbm5vdW5jZW1lbnQodGhpcywgdGhpcy5zZXR0aW5ncyksXG4gICAgICBuZXcgU2V0dGluZ3NUYWIodGhpcywgdGhpcy5zZXR0aW5ncyksXG4gICAgICBuZXcgU3lzdGVtSW5mbyh0aGlzLCB0aGlzLnNldHRpbmdzKSxcblxuICAgICAgLy8gZ2VuZXJhbCBmZWF0dXJlc1xuICAgICAgbmV3IExpc3RzTW92ZW1lbnRDb21tYW5kcyhcbiAgICAgICAgdGhpcyxcbiAgICAgICAgdGhpcy5vYnNpZGlhblNldHRpbmdzLFxuICAgICAgICB0aGlzLm9wZXJhdGlvblBlcmZvcm1lcixcbiAgICAgICksXG4gICAgICBuZXcgTGlzdHNGb2xkaW5nQ29tbWFuZHModGhpcywgdGhpcy5vYnNpZGlhblNldHRpbmdzKSxcblxuICAgICAgLy8gZmVhdHVyZXMgYmFzZWQgb24gc2V0dGluZ3Mua2VlcEN1cnNvcldpdGhpbkNvbnRlbnRcbiAgICAgIG5ldyBFZGl0b3JTZWxlY3Rpb25zQmVoYXZpb3VyT3ZlcnJpZGUoXG4gICAgICAgIHRoaXMsXG4gICAgICAgIHRoaXMuc2V0dGluZ3MsXG4gICAgICAgIHRoaXMucGFyc2VyLFxuICAgICAgICB0aGlzLm9wZXJhdGlvblBlcmZvcm1lcixcbiAgICAgICksXG4gICAgICBuZXcgQXJyb3dMZWZ0QW5kQ3RybEFycm93TGVmdEJlaGF2aW91ck92ZXJyaWRlKFxuICAgICAgICB0aGlzLFxuICAgICAgICB0aGlzLnNldHRpbmdzLFxuICAgICAgICB0aGlzLmltZURldGVjdG9yLFxuICAgICAgICB0aGlzLm9wZXJhdGlvblBlcmZvcm1lcixcbiAgICAgICksXG4gICAgICBuZXcgQmFja3NwYWNlQmVoYXZpb3VyT3ZlcnJpZGUoXG4gICAgICAgIHRoaXMsXG4gICAgICAgIHRoaXMuc2V0dGluZ3MsXG4gICAgICAgIHRoaXMuaW1lRGV0ZWN0b3IsXG4gICAgICAgIHRoaXMub3BlcmF0aW9uUGVyZm9ybWVyLFxuICAgICAgKSxcbiAgICAgIG5ldyBNZXRhQmFja3NwYWNlQmVoYXZpb3VyT3ZlcnJpZGUoXG4gICAgICAgIHRoaXMsXG4gICAgICAgIHRoaXMuc2V0dGluZ3MsXG4gICAgICAgIHRoaXMuaW1lRGV0ZWN0b3IsXG4gICAgICAgIHRoaXMub3BlcmF0aW9uUGVyZm9ybWVyLFxuICAgICAgKSxcbiAgICAgIG5ldyBEZWxldGVCZWhhdmlvdXJPdmVycmlkZShcbiAgICAgICAgdGhpcyxcbiAgICAgICAgdGhpcy5zZXR0aW5ncyxcbiAgICAgICAgdGhpcy5pbWVEZXRlY3RvcixcbiAgICAgICAgdGhpcy5vcGVyYXRpb25QZXJmb3JtZXIsXG4gICAgICApLFxuXG4gICAgICAvLyBmZWF0dXJlcyBiYXNlZCBvbiBzZXR0aW5ncy5vdmVycmlkZVRhYkJlaGF2aW91clxuICAgICAgbmV3IFRhYkJlaGF2aW91ck92ZXJyaWRlKFxuICAgICAgICB0aGlzLFxuICAgICAgICB0aGlzLmltZURldGVjdG9yLFxuICAgICAgICB0aGlzLm9ic2lkaWFuU2V0dGluZ3MsXG4gICAgICAgIHRoaXMuc2V0dGluZ3MsXG4gICAgICAgIHRoaXMub3BlcmF0aW9uUGVyZm9ybWVyLFxuICAgICAgKSxcbiAgICAgIG5ldyBTaGlmdFRhYkJlaGF2aW91ck92ZXJyaWRlKFxuICAgICAgICB0aGlzLFxuICAgICAgICB0aGlzLmltZURldGVjdG9yLFxuICAgICAgICB0aGlzLnNldHRpbmdzLFxuICAgICAgICB0aGlzLm9wZXJhdGlvblBlcmZvcm1lcixcbiAgICAgICksXG5cbiAgICAgIC8vIGZlYXR1cmVzIGJhc2VkIG9uIHNldHRpbmdzLm92ZXJyaWRlRW50ZXJCZWhhdmlvdXJcbiAgICAgIG5ldyBFbnRlckJlaGF2aW91ck92ZXJyaWRlKFxuICAgICAgICB0aGlzLFxuICAgICAgICB0aGlzLnNldHRpbmdzLFxuICAgICAgICB0aGlzLmltZURldGVjdG9yLFxuICAgICAgICB0aGlzLm9ic2lkaWFuU2V0dGluZ3MsXG4gICAgICAgIHRoaXMucGFyc2VyLFxuICAgICAgICB0aGlzLm9wZXJhdGlvblBlcmZvcm1lcixcbiAgICAgICksXG5cbiAgICAgIC8vIGZlYXR1cmVzIGJhc2VkIG9uIHNldHRpbmdzLm92ZXJyaWRlVmltT0JlaGF2aW91clxuICAgICAgbmV3IFZpbU9CZWhhdmlvdXJPdmVycmlkZShcbiAgICAgICAgdGhpcyxcbiAgICAgICAgdGhpcy5zZXR0aW5ncyxcbiAgICAgICAgdGhpcy5vYnNpZGlhblNldHRpbmdzLFxuICAgICAgICB0aGlzLnBhcnNlcixcbiAgICAgICAgdGhpcy5vcGVyYXRpb25QZXJmb3JtZXIsXG4gICAgICApLFxuXG4gICAgICAvLyBmZWF0dXJlcyBiYXNlZCBvbiBzZXR0aW5ncy5vdmVycmlkZVNlbGVjdEFsbEJlaGF2aW91clxuICAgICAgbmV3IEN0cmxBQW5kQ21kQUJlaGF2aW91ck92ZXJyaWRlKFxuICAgICAgICB0aGlzLFxuICAgICAgICB0aGlzLnNldHRpbmdzLFxuICAgICAgICB0aGlzLmltZURldGVjdG9yLFxuICAgICAgICB0aGlzLm9wZXJhdGlvblBlcmZvcm1lcixcbiAgICAgICksXG5cbiAgICAgIC8vIGZlYXR1cmVzIGJhc2VkIG9uIHNldHRpbmdzLmJldHRlckxpc3RzU3R5bGVzXG4gICAgICBuZXcgQmV0dGVyTGlzdHNTdHlsZXModGhpcy5zZXR0aW5ncywgdGhpcy5vYnNpZGlhblNldHRpbmdzKSxcblxuICAgICAgLy8gZmVhdHVyZXMgYmFzZWQgb24gc2V0dGluZ3MudmVydGljYWxMaW5lc1xuICAgICAgbmV3IFZlcnRpY2FsTGluZXMoXG4gICAgICAgIHRoaXMsXG4gICAgICAgIHRoaXMuc2V0dGluZ3MsXG4gICAgICAgIHRoaXMub2JzaWRpYW5TZXR0aW5ncyxcbiAgICAgICAgdGhpcy5wYXJzZXIsXG4gICAgICApLFxuXG4gICAgICAvLyBmZWF0dXJlcyBiYXNlZCBvbiBzZXR0aW5ncy5kcmFnQW5kRHJvcFxuICAgICAgbmV3IERyYWdBbmREcm9wKFxuICAgICAgICB0aGlzLFxuICAgICAgICB0aGlzLnNldHRpbmdzLFxuICAgICAgICB0aGlzLm9ic2lkaWFuU2V0dGluZ3MsXG4gICAgICAgIHRoaXMucGFyc2VyLFxuICAgICAgICB0aGlzLm9wZXJhdGlvblBlcmZvcm1lcixcbiAgICAgICksXG4gICAgXTtcblxuICAgIGZvciAoY29uc3QgZmVhdHVyZSBvZiB0aGlzLmZlYXR1cmVzKSB7XG4gICAgICBhd2FpdCBmZWF0dXJlLmxvYWQoKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBvbnVubG9hZCgpIHtcbiAgICBjb25zb2xlLmxvZyhgVW5sb2FkaW5nIG9ic2lkaWFuLW91dGxpbmVyYCk7XG5cbiAgICBhd2FpdCB0aGlzLmltZURldGVjdG9yLnVubG9hZCgpO1xuXG4gICAgZm9yIChjb25zdCBmZWF0dXJlIG9mIHRoaXMuZmVhdHVyZXMpIHtcbiAgICAgIGF3YWl0IGZlYXR1cmUudW5sb2FkKCk7XG4gICAgfVxuICB9XG5cbiAgcHJvdGVjdGVkIGFzeW5jIHByZXBhcmVTZXR0aW5ncygpIHtcbiAgICB0aGlzLnNldHRpbmdzID0gbmV3IFNldHRpbmdzKHRoaXMpO1xuICAgIGF3YWl0IHRoaXMuc2V0dGluZ3MubG9hZCgpO1xuICB9XG59XG4iXSwibmFtZXMiOlsiZWRpdG9ySW5mb0ZpZWxkIiwiZm9sZGVkUmFuZ2VzIiwiZm9sZGFibGUiLCJmb2xkRWZmZWN0IiwidW5mb2xkRWZmZWN0IiwicnVuU2NvcGVIYW5kbGVycyIsImtleW1hcCIsIk5vdGljZSIsImluZGVudFN0cmluZyIsImdldEluZGVudFVuaXQiLCJTdGF0ZUVmZmVjdCIsIkRlY29yYXRpb24iLCJTdGF0ZUZpZWxkIiwiRWRpdG9yVmlldyIsIlBsYXRmb3JtIiwiRWRpdG9yU3RhdGUiLCJQcmVjIiwiUGx1Z2luU2V0dGluZ1RhYiIsIlNldHRpbmciLCJNb2RhbCIsIlZpZXdQbHVnaW4iLCJNYXJrZG93blZpZXciLCJQbHVnaW4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQWtHQTtBQUNPLFNBQVMsU0FBUyxDQUFDLE9BQU8sRUFBRSxVQUFVLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRTtBQUM3RCxJQUFJLFNBQVMsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLE9BQU8sS0FBSyxZQUFZLENBQUMsR0FBRyxLQUFLLEdBQUcsSUFBSSxDQUFDLENBQUMsVUFBVSxPQUFPLEVBQUUsRUFBRSxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDaEgsSUFBSSxPQUFPLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxPQUFPLENBQUMsRUFBRSxVQUFVLE9BQU8sRUFBRSxNQUFNLEVBQUU7QUFDL0QsUUFBUSxTQUFTLFNBQVMsQ0FBQyxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ25HLFFBQVEsU0FBUyxRQUFRLENBQUMsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3RHLFFBQVEsU0FBUyxJQUFJLENB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
