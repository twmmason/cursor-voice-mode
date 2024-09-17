"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const path_1 = __importDefault(require("path"));
const mocha_1 = __importDefault(require("mocha"));
const fs_1 = __importDefault(require("fs"));
function run() {
    // Create the mocha test
    const mocha = new mocha_1.default({
        ui: 'tdd',
        color: true,
        timeout: 15000,
    });
    const testsRoot = path_1.default.resolve(__dirname, '../suite');
    return new Promise((c, e) => {
        console.log('Running tests', testsRoot);
        fs_1.default.readdir(testsRoot, (err, files) => {
            if (err) {
                return e(err);
            }
            const testFiles = files.filter((file) => file.endsWith('.test.js'));
            console.log('Test files', testFiles);
            testFiles.forEach((file) => {
                console.log('Adding test file', file);
                mocha.addFile(path_1.default.resolve(testsRoot, file));
            });
            try {
                // Run the mocha test
                mocha.run((failures) => {
                    if (failures > 0) {
                        e(new Error(`${failures} tests failed.`));
                    }
                    else {
                        c();
                    }
                });
            }
            catch (err) {
                console.error(err);
                e(err);
            }
        });
    });
}
exports.run = run;
//# sourceMappingURL=index.js.map