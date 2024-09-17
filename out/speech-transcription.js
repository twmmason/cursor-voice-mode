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
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class SpeechTranscription {
    constructor(outputDir, outputChannel) {
        this.outputDir = outputDir;
        this.outputChannel = outputChannel;
        this.fileName = 'recording';
        this.recordingProcess = null;
    }
    async checkIfInstalled(command) {
        try {
            await execAsync(`${command} --help`);
            return true;
        }
        catch (error) {
            return false;
        }
    }
    getOutputDir() {
        return this.outputDir;
    }
    startRecording() {
        try {
            this.recordingProcess = (0, child_process_1.exec)(`sox -d -b 16 -e signed -c 1 -r 16k ${this.outputDir}/${this.fileName}.wav`, (error, stdout, stderr) => {
                if (error) {
                    this.outputChannel.appendLine(`Whisper Assistant: error: ${error}`);
                    return;
                }
                if (stderr) {
                    this.outputChannel.appendLine(`Whisper Assistant: SoX process has been killed: ${stderr}`);
                    return;
                }
                this.outputChannel.appendLine(`Whisper Assistant: stdout: ${stdout}`);
            });
        }
        catch (error) {
            this.outputChannel.appendLine(`Whisper Assistant: error: ${error}`);
        }
    }
    async stopRecording() {
        if (!this.recordingProcess) {
            this.outputChannel.appendLine('Whisper Assistant: No recording process found');
            return;
        }
        this.outputChannel.appendLine('Whisper Assistant: Stopping recording');
        this.recordingProcess.kill();
        this.recordingProcess = null;
    }
    async transcribeRecording(model) {
        try {
            this.outputChannel.appendLine(`Whisper Assistant: Transcribing recording using '${model}' model`);
            const { stdout, stderr } = await execAsync(`whisper ${this.outputDir}/${this.fileName}.wav --model ${model} --output_format json --task transcribe --language English --fp16 False --output_dir ${this.outputDir}`);
            this.outputChannel.appendLine(`Whisper Assistant: Transcription: ${stdout}`);
            return await this.handleTranscription();
        }
        catch (error) {
            this.outputChannel.appendLine(`Whisper Assistant: error: ${error}`);
        }
    }
    async handleTranscription() {
        try {
            const data = await fs.promises.readFile(`${this.outputDir}/${this.fileName}.json`, 'utf8');
            if (!data) {
                this.outputChannel.appendLine('Whisper Assistant: No transcription data found');
                return;
            }
            const transcription = JSON.parse(data);
            this.outputChannel.appendLine(`Whisper Assistant: ${transcription.text}`);
            return transcription;
        }
        catch (err) {
            this.outputChannel.appendLine(`Whisper Assistant: Error reading file from disk: ${err}`);
        }
    }
    deleteFiles() {
        // Delete files
        fs.unlinkSync(`${this.outputDir}/${this.fileName}.wav`);
        fs.unlinkSync(`${this.outputDir}/${this.fileName}.json`);
    }
}
exports.default = SpeechTranscription;
//# sourceMappingURL=speech-transcription.js.map