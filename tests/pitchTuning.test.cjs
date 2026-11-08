const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

// Exercise the actual TS utilities and TSX display using the existing compiler.
// No generated files or additional test dependencies are needed.
const modules = new Map();
function loadSource(relativePath) {
    const filename = path.resolve(__dirname, "..", relativePath);
    if (modules.has(filename)) return modules.get(filename).exports;
    const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
        fileName: filename,
        reportDiagnostics: true,
        compilerOptions: {
            target: ts.ScriptTarget.ES2020,
            module: ts.ModuleKind.CommonJS,
            jsx: ts.JsxEmit.ReactJSX,
            esModuleInterop: true,
        },
    });
    assert.equal(compiled.diagnostics.filter(d => d.category === ts.DiagnosticCategory.Error).length, 0, filename);
    const module = { exports: {} };
    modules.set(filename, module);
    const localRequire = request => {
        if (!request.startsWith(".")) return require(request);
        const base = path.resolve(path.dirname(filename), request);
        const resolved = [base + ".ts", base + ".tsx"].find(file => fs.existsSync(file));
        assert.ok(resolved, `Cannot resolve ${request} from ${filename}`);
        return loadSource(path.relative(path.resolve(__dirname, ".."), resolved));
    };
    new Function("require", "module", "exports", compiled.outputText)(localRequire, module, module.exports);
    return module.exports;
}

const { default: getPitchTuning } = loadSource("src/utils/getPitchTuning.ts");
const { default: frequencyToPitchedNote } = loadSource("src/utils/frequencyToPitchedNote.ts");
const { default: transposeNote } = loadSource("src/utils/transposeNote.ts");
const { default: NoteDisplay } = loadSource("src/components/NoteDisplay/NoteDisplay.tsx");
const near = (actual, expected, tolerance = 1e-8) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
const detunedA4 = cents => 440 * 2 ** (cents / 1200);

test("exact A notes keep their octave and have a centered, zero-cent reading", () => {
    for (const [frequency, octave] of [[220, 3], [440, 4], [880, 5]]) {
        const tuning = getPitchTuning(frequency);
        assert.deepEqual(tuning.note, { noteName: "A", octave });
        assert.equal(tuning.frequency, frequency);
        assert.equal(tuning.referenceFrequency, frequency);
        assert.equal(tuning.cents, 0);
        assert.equal(Object.is(tuning.cents, -0), false);
        assert.equal(tuning.direction, "in-tune");
        assert.equal(tuning.barPosition, 0.5);
        assert.deepEqual(tuning.lowerNote, { noteName: "G#", octave });
        assert.deepEqual(tuning.upperNote, { noteName: "A#", octave });
    }
});

test("432 Hz stays A4 while retaining its measured frequency and negative deviation", () => {
    const tuning = getPitchTuning(432);
    assert.deepEqual(tuning.note, { noteName: "A", octave: 4 });
    assert.equal(tuning.frequency, 432);
    assert.equal(tuning.referenceFrequency, 440);
    near(tuning.cents, -31.766653633429282);
    near(tuning.barPosition, 0.3411667318328536);
    assert.equal(tuning.direction, "flat");
});

test("sharp notes move right and fractional cents are not rounded away", () => {
    const sharp = getPitchTuning(detunedA4(25));
    near(sharp.cents, 25);
    near(sharp.barPosition, 0.625);
    assert.equal(sharp.direction, "sharp");
    const tiny = getPitchTuning(detunedA4(0.12345));
    near(tiny.cents, 0.12345);
    assert.equal(tiny.direction, "in-tune");
    assert.ok(tiny.barPosition > 0.5);
});

test("the five-cent tolerance is inclusive and does not snap the actual reading to zero", () => {
    for (const cents of [-5, -4.9, 4.9, 5]) {
        const tuning = getPitchTuning(detunedA4(cents));
        near(tuning.cents, cents);
        assert.equal(tuning.direction, "in-tune", `${cents} cents`);
    }
    assert.equal(getPitchTuning(detunedA4(-5.1)).direction, "flat");
    assert.equal(getPitchTuning(detunedA4(5.1)).direction, "sharp");
});

test("the automatic reference changes to the nearest note across semitone midpoints", () => {
    assert.deepEqual(getPitchTuning(detunedA4(49.9)).note, { noteName: "A", octave: 4 });
    const above = getPitchTuning(detunedA4(50.1));
    assert.deepEqual(above.note, { noteName: "A#", octave: 4 });
    near(above.cents, -49.9);
    assert.deepEqual(above.lowerNote, { noteName: "A", octave: 4 });
    assert.deepEqual(above.upperNote, { noteName: "B", octave: 4 });
    const below = getPitchTuning(detunedA4(-50.1));
    assert.deepEqual(below.note, { noteName: "G#", octave: 4 });
    near(below.cents, 49.9);
});

test("neighbor labels cross octave boundaries correctly", () => {
    const c4 = getPitchTuning(261.6255653005986);
    assert.deepEqual(c4.note, { noteName: "C", octave: 4 });
    assert.deepEqual(c4.lowerNote, { noteName: "B", octave: 3 });
    assert.deepEqual(c4.upperNote, { noteName: "C#", octave: 4 });
    const b4 = getPitchTuning(493.8833012561241);
    assert.deepEqual(b4.upperNote, { noteName: "C", octave: 5 });
});

test("the full keyboard range preserves note labels, cents, and concert/trumpet relationships", () => {
    const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    for (let midi = 54; midi <= 83; midi++) {
        const reference = 440 * 2 ** ((midi - 69) / 12);
        for (const cents of [-27, 0, 27]) {
            const frequency = reference * 2 ** (cents / 1200);
            const tuning = getPitchTuning(frequency);
            assert.deepEqual(tuning.note, { noteName: names[midi % 12], octave: Math.floor(midi / 12) - 1 });
            near(tuning.cents, cents);
            near(tuning.referenceFrequency, reference);
            near(tuning.barPosition, 0.5 + cents / 200);
            const written = transposeNote(tuning.note, 2);
            assert.deepEqual(written, { noteName: names[(midi + 2) % 12], octave: Math.floor((midi + 2) / 12) - 1 });
            const writtenFrequency = frequency * 2 ** (2 / 12);
            near(getPitchTuning(writtenFrequency).cents, tuning.cents);
        }
    }
});

test("missing or invalid frequencies yield no note or tuning reading", () => {
    for (const value of [null, undefined, 0, -440, NaN, Infinity, -Infinity]) {
        assert.equal(frequencyToPitchedNote(value), null);
        assert.equal(getPitchTuning(value), null);
    }
});

test("positive frequencies below MIDI zero still produce a valid note name", () => {
    assert.deepEqual(frequencyToPitchedNote(1), { noteName: "C", octave: -4 });
    assert.ok(Number.isFinite(getPitchTuning(1).cents));
});

function display(frequency, isListening = true) {
    const tuning = getPitchTuning(frequency);
    return renderToStaticMarkup(React.createElement(NoteDisplay, {
        tuning,
        isListening,
        concertNote: tuning?.note ?? null,
        trumpetNote: tuning ? transposeNote(tuning.note, 2) : null,
    }));
}

test("the display shows concert and trumpet notes alongside signed cents and direction", () => {
    const flat = display(432);
    assert.match(flat, /Concert Note: A4/);
    assert.match(flat, /Trumpet Note: B4/);
    assert.match(flat, /432\.0 Hz/);
    assert.match(flat, /-31\.8 cent/);
    assert.match(flat, /Pes/);
    const sharp = display(detunedA4(25));
    assert.match(sharp, /\+25\.0 cent/);
    assert.match(sharp, /Tiz/);
    assert.match(display(440), /0\.0 cent.*Akortta/);
    assert.doesNotMatch(display(detunedA4(-0.01)), /-0\.0 cent/);
});

test("silence and a stopped microphone hide the previous deviation", () => {
    assert.match(display(null), /Nota bekleniyor/);
    assert.doesNotMatch(display(null), /Hz|cent|NaN|Infinity/);
    assert.match(display(null, false), /Mikrofon kapalı/);
    assert.doesNotMatch(display(432, false), /Hz|cent/);
});
