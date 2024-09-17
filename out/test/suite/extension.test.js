"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
const vscode = __importStar(require("vscode"));
const speech_transcription_1 = __importDefault(require("../../speech-transcription"));
const extension_1 = require("../../extension");
// NOTE: Tests can only be run if a workspace is open, so we need to open a known workspace before running the tests
const outputWorkspace = '/Users/martin/Documents/www';
suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');
    (0, extension_1.initializeOutputChannel)();
    suiteSetup(async () => {
        // Open a specific workspace directory before running the tests
        const uri = vscode.Uri.file(outputWorkspace);
        await vscode.commands.executeCommand('vscode.openFolder', uri);
    });
    test('Check if Sox is installed', async () => {
        if (extension_1.state.outputChannel === undefined) {
            throw new Error('Output channel is undefined');
        }
        const speechTranscription = new speech_transcription_1.default(outputWorkspace, extension_1.state.outputChannel);
        const isSoxInstalled = await speechTranscription.checkIfInstalled('sox');
        assert.strictEqual(isSoxInstalled, true);
    });
    test('Check if Whisper is installed', async () => {
        if (extension_1.state.outputChannel === undefined) {
            throw new Error('Output channel is undefined');
        }
        const speechTranscription = new speech_transcription_1.default(outputWorkspace, extension_1.state.outputChannel);
        const isWhisperInstalled = await speechTranscription.checkIfInstalled('whisper');
        assert.strictEqual(isWhisperInstalled, true);
    });
    test('Check if workspace is initialized correctly', () => {
        (0, extension_1.initializeWorkspace)();
        assert.strictEqual(extension_1.state.workspacePath !== undefined, true);
        assert.strictEqual(extension_1.state.outputDir !== undefined, true);
    });
    test('Check if status bar item is initialized correctly', () => {
        (0, extension_1.initializeStatusBarItem)();
        assert.strictEqual(extension_1.state.myStatusBarItem !== undefined, true);
    });
    test('Check if recording can be toggled', async () => {
        await (0, extension_1.toggleRecordingCommand)();
        assert.strictEqual(extension_1.state.isRecording, true);
        await new Promise((resolve) => setTimeout(resolve, 3000)); // record for 3 seconds
        await (0, extension_1.toggleRecordingCommand)();
        assert.strictEqual(extension_1.state.isRecording, false);
    });
    // TODO: Add a test that verifies that during transcribing the status bar item is updated correctly
    // TODO: Add a test that verifies that the transcribing process is started correctly and the toggleRecordingCommand is disabled
    // TODO: Add a test to make sure the transcription text is copied to the clipboard
    test('Check if extension is deactivated correctly', () => {
        (0, extension_1.deactivate)();
        assert.strictEqual(extension_1.state.isRecording, false);
        assert.strictEqual(extension_1.state.isTranscribing, false);
        assert.strictEqual(extension_1.state.workspacePath, undefined);
        assert.strictEqual(extension_1.state.outputDir, undefined);
        assert.strictEqual(extension_1.state.recordingStartTime, undefined);
    });
});
//# sourceMappingURL=extension.test.js.map