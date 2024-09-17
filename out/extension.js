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
exports.initializeOutputChannel = exports.deactivate = exports.toggleRecordingCommand = exports.initializeWorkspace = exports.initializeStatusBarItem = exports.activate = exports.state = void 0;
const vscode = __importStar(require("vscode"));
const speech_transcription_1 = __importDefault(require("./speech-transcription"));
const fs = __importStar(require("fs"));
exports.state = {
    myStatusBarItem: undefined,
    isRecording: false,
    isTranscribing: false,
    speechTranscription: undefined,
    workspacePath: undefined,
    outputDir: undefined,
    recordingStartTime: undefined,
};
async function activate(context) {
    initializeWorkspace();
    if (exports.state.workspacePath === undefined || exports.state.outputDir === undefined) {
        console.log('Please open a workspace directory before starting recording.');
        return;
    }
    // Initialize the Recording class
    initializeOutputChannel();
    exports.state.speechTranscription = new speech_transcription_1.default(exports.state.outputDir, exports.state.outputChannel);
    // Check if Sox and Whisper are installed
    const isSoxInstalled = await exports.state.speechTranscription?.checkIfInstalled('sox');
    const isWhisperInstalled = await exports.state.speechTranscription?.checkIfInstalled('whisper');
    if (!isSoxInstalled) {
        vscode.window.showErrorMessage('SoX is not installed. Please install Sox for this extension to work properly.');
    }
    if (!isWhisperInstalled) {
        vscode.window.showErrorMessage('Whisper is not installed. Please install Whisper for this extension to work properly.');
    }
    if (isSoxInstalled && isWhisperInstalled) {
        registerCommands(context);
        initializeStatusBarItem();
        updateStatusBarItem();
        if (exports.state.myStatusBarItem !== undefined) {
            context.subscriptions.push(exports.state.myStatusBarItem);
        }
        console.log('Congratulations, your extension "Whisper Assistant" is now active!');
    }
}
exports.activate = activate;
function initializeStatusBarItem() {
    // create a new status bar item that we can now manage
    exports.state.myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1);
    exports.state.myStatusBarItem.command = 'whisperAssistant.toggleRecording';
    exports.state.myStatusBarItem.show(); // Make sure the status bar item is shown
}
exports.initializeStatusBarItem = initializeStatusBarItem;
function initializeWorkspace() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders !== undefined) {
        exports.state.workspacePath = workspaceFolders[0].uri.fsPath;
        const whisperDir = `${exports.state.workspacePath}/.whisper`;
        if (!fs.existsSync(whisperDir)) {
            fs.mkdirSync(whisperDir);
        }
        exports.state.outputDir = `${exports.state.workspacePath}/.whisper`;
    }
}
exports.initializeWorkspace = initializeWorkspace;
function registerCommands(context) {
    let toggleRecordingDisposable = vscode.commands.registerCommand('whisperAssistant.toggleRecording', toggleRecordingCommand);
    context.subscriptions.push(toggleRecordingDisposable);
}
async function toggleRecordingCommand() {
    if (exports.state.workspacePath !== undefined &&
        exports.state.outputDir !== undefined &&
        exports.state.speechTranscription !== undefined &&
        !exports.state.isTranscribing) {
        if (!exports.state.isRecording) {
            exports.state.speechTranscription.startRecording();
            exports.state.recordingStartTime = Date.now();
            exports.state.isRecording = true;
            updateStatusBarItem();
            setInterval(updateStatusBarItem, 1000);
        }
        else {
            exports.state.speechTranscription.stopRecording();
            exports.state.isTranscribing = true;
            exports.state.isRecording = false;
            updateStatusBarItem();
            const progressOptions = {
                location: vscode.ProgressLocation.Notification,
                cancellable: false,
            };
            await vscode.window.withProgress(progressOptions, async (progress) => {
                const incrementData = initializeIncrementData();
                const interval = startProgressInterval(progress, incrementData);
                if (exports.state.speechTranscription !== undefined) {
                    const model = getWhisperModel();
                    const transcription = await exports.state.speechTranscription.transcribeRecording(model);
                    if (transcription) {
                        vscode.env.clipboard.writeText(transcription.text).then(() => {
                            vscode.commands.executeCommand('editor.action.clipboardPasteAction');
                        });
                    }
                }
                await finalizeProgress(progress, interval, incrementData);
            });
            // Delete the recording/transcription files
            if (exports.state.speechTranscription !== undefined) {
                exports.state.speechTranscription.deleteFiles();
            }
        }
    }
}
exports.toggleRecordingCommand = toggleRecordingCommand;
function updateStatusBarItem() {
    if (exports.state.myStatusBarItem === undefined) {
        return;
    }
    if (exports.state.isRecording && exports.state.recordingStartTime !== undefined) {
        const recordingDuration = Math.floor((Date.now() - exports.state.recordingStartTime) / 1000);
        const minutes = Math.floor(recordingDuration / 60);
        const seconds = recordingDuration % 60;
        exports.state.myStatusBarItem.text = `$(stop) ${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
    }
    else {
        exports.state.myStatusBarItem.text = exports.state.isTranscribing
            ? `$(loading~spin)`
            : `$(quote)`;
    }
}
function initializeIncrementData() {
    let increment = 0;
    const recordingDuration = exports.state.recordingStartTime
        ? (Date.now() - exports.state.recordingStartTime) / 1000
        : 0;
    const secondsDuration = recordingDuration % 60;
    const transcriptionTime = secondsDuration * 0.2 + 10; // 20% of the recording time + 10 seconds
    const incrementInterval = transcriptionTime * 30; // interval time to increment the progress bar
    return { increment, incrementInterval };
}
function startProgressInterval(progress, incrementData) {
    const interval = setInterval(() => {
        incrementData.increment += 1; // increment by 1% to slow down the progress
        progress.report({
            increment: incrementData.increment,
            message: 'Transcribing...',
        });
    }, incrementData.incrementInterval);
    return interval;
}
async function finalizeProgress(progress, interval, incrementData) {
    clearInterval(interval);
    progress.report({
        increment: 100,
        message: 'Text has been transcribed and saved to the clipboard.',
    });
    exports.state.isTranscribing = false;
    exports.state.recordingStartTime = undefined;
    updateStatusBarItem();
    // Delay the closing of the progress pop-up by 2.5 second to allow the user to see the completion message
    await new Promise((resolve) => setTimeout(resolve, 2500));
}
// This method is called when your extension is deactivated
function deactivate() {
    // Dispose the status bar item
    if (exports.state.myStatusBarItem) {
        exports.state.myStatusBarItem.dispose();
    }
    // Reset variables
    exports.state.isRecording = false;
    exports.state.isTranscribing = false;
    exports.state.speechTranscription = undefined;
    exports.state.workspacePath = undefined;
    exports.state.outputDir = undefined;
    exports.state.recordingStartTime = undefined;
    // Log the deactivation
    console.log('Your extension "Whisper Assistant" is now deactivated');
}
exports.deactivate = deactivate;
function getWhisperModel() {
    const config = vscode.workspace.getConfiguration('whisper-assistant');
    const whisperModel = config.get('model');
    if (!whisperModel) {
        exports.state.outputChannel?.appendLine('Whisper Assistant: No whisper model found in configuration');
        return 'base';
    }
    return whisperModel;
}
function initializeOutputChannel() {
    exports.state.outputChannel = vscode.window.createOutputChannel('Whisper Assistant');
}
exports.initializeOutputChannel = initializeOutputChannel;
//# sourceMappingURL=extension.js.map