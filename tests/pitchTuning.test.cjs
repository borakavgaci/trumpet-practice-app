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
        if (request.endsWith(".css")) return {};
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
const { default: createPitchTracker, PITCH_TRACKING } = loadSource("src/utils/createPitchTracker.ts");
const { default: createGaugeMotion, GAUGE_MOTION } = loadSource("src/utils/createGaugeMotion.ts");
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
        assert.deepEqual(tuning.lowerNote, { noteName: "G", octave });
        assert.deepEqual(tuning.upperNote, { noteName: "B", octave });
    }
});

test("432 Hz stays A4 while retaining its measured frequency and negative deviation", () => {
    const tuning = getPitchTuning(432);
    assert.deepEqual(tuning.note, { noteName: "A", octave: 4 });
    assert.equal(tuning.frequency, 432);
    assert.equal(tuning.referenceFrequency, 440);
    near(tuning.cents, -31.766653633429282);
    near(tuning.barPosition, 0.4205833659164268);
    assert.equal(tuning.direction, "flat");
});

test("sharp notes move right and fractional cents are not rounded away", () => {
    const sharp = getPitchTuning(detunedA4(25));
    near(sharp.cents, 25);
    near(sharp.barPosition, 0.5625);
    assert.equal(sharp.direction, "sharp");
    const tiny = getPitchTuning(detunedA4(0.12345));
    near(tiny.cents, 0.12345);
    assert.equal(tiny.direction, "in-tune");
    assert.ok(tiny.barPosition > 0.5);
});

test("the ten-cent tolerance is inclusive and does not snap the actual reading to zero", () => {
    for (const cents of [-10, -9.9, 9.9, 10]) {
        const tuning = getPitchTuning(detunedA4(cents));
        near(tuning.cents, cents);
        assert.equal(tuning.direction, "in-tune", `${cents} cents`);
    }
    assert.equal(getPitchTuning(detunedA4(-10.1)).direction, "flat");
    assert.equal(getPitchTuning(detunedA4(10.1)).direction, "sharp");
});

test("the automatic reference changes to the nearest note across semitone midpoints", () => {
    assert.deepEqual(getPitchTuning(detunedA4(49.9)).note, { noteName: "A", octave: 4 });
    const above = getPitchTuning(detunedA4(50.1));
    assert.deepEqual(above.note, { noteName: "A#", octave: 4 });
    near(above.cents, -49.9);
    assert.deepEqual(above.lowerNote, { noteName: "G#", octave: 4 });
    assert.deepEqual(above.upperNote, { noteName: "C", octave: 5 });
    const below = getPitchTuning(detunedA4(-50.1));
    assert.deepEqual(below.note, { noteName: "G#", octave: 4 });
    near(below.cents, 49.9);
});

test("neighbor labels cross octave boundaries correctly", () => {
    const c4 = getPitchTuning(261.6255653005986);
    assert.deepEqual(c4.note, { noteName: "C", octave: 4 });
    assert.deepEqual(c4.lowerNote, { noteName: "A#", octave: 3 });
    assert.deepEqual(c4.upperNote, { noteName: "D", octave: 4 });
    const b4 = getPitchTuning(493.8833012561241);
    assert.deepEqual(b4.upperNote, { noteName: "C#", octave: 5 });
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
            near(tuning.barPosition, 0.5 + cents / 400);
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
    const text = html => html.replace(/<[^>]*>/g, "");
    assert.match(flat, /aria-label="Concert nota: A4"/);
    assert.match(flat, /aria-label="Bb trompet notası: B4"/);
    assert.match(text(flat), /432\.0 Hz/);
    assert.match(text(flat), /-31\.8 cent/);
    assert.match(text(flat), /Pes/);
    assert.match(flat, /role="meter"/);
    assert.match(flat, /aria-valuenow="-31\.7666/);
    assert.match(flat, /left:42\.0583/);
    const sharp = text(display(detunedA4(25)));
    assert.match(sharp, /\+25\.0 cent/);
    assert.match(sharp, /Tiz/);
    assert.match(text(display(440)), /Akortta.*0\.0 cent/);
    assert.doesNotMatch(text(display(detunedA4(-0.01))), /-0\.0 cent/);
});

test("the wider gauge aligns five notes, a single reference zone, and a two-semitone meter", () => {
    const html = display(440);
    const labels = Array.from(html.matchAll(/class="gauge-note-label [^"]*" style="left:([^%]+)%">([^<]+)<\/span>/g));
    assert.deepEqual(labels.map(match => match[2]), ["G4", "G♯4", "A4", "A♯4", "B4"]);
    assert.deepEqual(labels.map(match => Number(match[1])), [0, 25, 50, 75, 100]);
    assert.match(html, /class="gauge-note-label is-reference" style="left:50%">A4/);
    assert.equal((html.match(/class="gauge-in-tune-zone"/g) || []).length, 1);
    assert.match(html, /class="gauge-in-tune-zone" style="width:5%;left:47\.5%"/);
    assert.match(html, /aria-valuemin="-200" aria-valuemax="200"/);
});

test("silence and a stopped microphone hide the previous deviation", () => {
    assert.match(display(null), /Nota bekleniyor/);
    assert.doesNotMatch(display(null).replace(/<[^>]*>/g, ""), /Hz|cent|NaN|Infinity/);
    assert.doesNotMatch(display(null), /aria-valuenow|gauge-needle/);
    assert.match(display(null, false), /Mikrofon kapalı/);
    assert.doesNotMatch(display(432, false).replace(/<[^>]*>/g, ""), /Hz|cent/);
});

test("single-frame octave glitches do not move an established reading", () => {
    const tracker = createPitchTracker();
    for (let time = 0; time <= 160; time += 16) tracker.update(440, time);
    near(tracker.update(880, 176).frequency, 440);
    const recovered = tracker.update(440, 192);
    near(recovered.frequency, 440);
    assert.deepEqual(recovered.note, { noteName: "A", octave: 4 });
});

test("boundary jitter holds the note name while the bar continues following fractional pitch", () => {
    const tracker = createPitchTracker();
    tracker.update(440, 0);
    let reading;
    const positions = [];
    for (let step = 1; step <= 120; step++) {
        reading = tracker.update(detunedA4(step % 2 ? 46 : 56), step * 16);
        assert.deepEqual(reading.note, { noteName: "A", octave: 4 });
        positions.push(reading.barPosition);
    }
    assert.ok(Math.max(...positions) - Math.min(...positions) > 0.01);
    assert.ok(reading.cents > 45 && reading.cents < 57);
});

test("a sustained new note is accepted and its label does not bounce back at the midpoint", () => {
    const tracker = createPitchTracker();
    for (let step = 0; step <= 10; step++) tracker.update(440, step * 16);
    assert.deepEqual(tracker.update(detunedA4(100), 176).note, { noteName: "A", octave: 4 });
    let reading;
    for (let step = 12; step <= 35; step++) reading = tracker.update(detunedA4(100), step * 16);
    assert.deepEqual(reading.note, { noteName: "A#", octave: 4 });
    for (let step = 36; step <= 60; step++) reading = tracker.update(detunedA4(50), step * 16);
    assert.deepEqual(reading.note, { noteName: "A#", octave: 4 });
});

test("A4 to A#4 glissando moves monotonically to the right without a midpoint wrap", () => {
    const tracker = createPitchTracker();
    let previousPosition = 0.5;
    let reading;
    for (let step = 0; step <= 120; step++) {
        reading = tracker.update(detunedA4(step * 100 / 120), step * 1000 / 60);
        assert.deepEqual(reading.gaugeNote, { noteName: "A", octave: 4 });
        assert.deepEqual(reading.lowerNote, { noteName: "G", octave: 4 });
        assert.deepEqual(reading.upperNote, { noteName: "B", octave: 4 });
        assert.ok(reading.barPosition + 1e-9 >= previousPosition);
        previousPosition = reading.barPosition;
    }
    for (let step = 121; step <= 160; step++) reading = tracker.update(detunedA4(100), step * 1000 / 60);
    assert.deepEqual(reading.note, { noteName: "A#", octave: 4 });
    near(reading.cents, 0, 0.05);
    near(reading.gaugeCents, 100, 0.05);
    near(reading.barPosition, 0.75, 0.0002);
});

test("descending semitone slides move left and upward octave boundaries preserve the bar scale", () => {
    const tracker = createPitchTracker();
    let previousPosition = 0.5;
    let reading;
    for (let step = 0; step <= 120; step++) {
        reading = tracker.update(detunedA4(-step * 100 / 120), step * 1000 / 60);
        assert.deepEqual(reading.gaugeNote, { noteName: "A", octave: 4 });
        assert.ok(reading.barPosition <= previousPosition + 1e-9);
        previousPosition = reading.barPosition;
    }
    assert.deepEqual(reading.note, { noteName: "G#", octave: 4 });
    for (let step = 121; step <= 160; step++) reading = tracker.update(detunedA4(-100), step * 1000 / 60);
    near(reading.barPosition, 0.25, 0.0002);
    tracker.reset();
    for (let step = 0; step <= 120; step++) {
        const midi = 71 + step / 120;
        reading = tracker.update(440 * 2 ** ((midi - 69) / 12), step * 1000 / 60);
        assert.deepEqual(reading.gaugeNote, { noteName: "B", octave: 4 });
        assert.deepEqual(reading.upperNote, { noteName: "C#", octave: 5 });
    }
    assert.deepEqual(reading.note, { noteName: "C", octave: 5 });
});

test("whole-tone slides keep their scale in both directions and preserve fractional movement", () => {
    for (const direction of [-1, 1]) {
        const tracker = createPitchTracker();
        let previousPosition = 0.5;
        let reading;
        for (let step = 0; step <= 180; step++) {
            reading = tracker.update(detunedA4(direction * step * 200 / 180), step * 1000 / 60);
            assert.deepEqual(reading.gaugeNote, { noteName: "A", octave: 4 });
            assert.ok(direction * (reading.barPosition - previousPosition) >= -1e-9);
            previousPosition = reading.barPosition;
        }
        for (let step = 181; step <= 240; step++) reading = tracker.update(detunedA4(direction * 200), step * 1000 / 60);
        near(reading.barPosition, direction === 1 ? 1 : 0, 0.0001);
        near(reading.gaugeCents, direction * 200, 0.05);
        assert.deepEqual(reading.note, { noteName: direction === 1 ? "B" : "G", octave: 4 });
    }
});

test("the bar recenters only after pitch leaves the wider range and its edge margin", () => {
    const tracker = createPitchTracker();
    tracker.update(440, 0);
    let reading;
    for (let step = 1; step <= 60; step++) reading = tracker.update(detunedA4(205), step * 16);
    assert.deepEqual(reading.gaugeNote, { noteName: "A", octave: 4 });
    near(reading.barPosition, 1);
    for (let step = 61; step <= 120; step++) reading = tracker.update(detunedA4(250), step * 16);
    assert.deepEqual(reading.gaugeNote, { noteName: "B", octave: 4 });
    near(reading.gaugeCents, 50, 0.05);
    assert.ok(reading.barPosition > 0 && reading.barPosition < 1);
});

test("brief dropouts preserve continuity, while silence and session reset clear the previous scale", () => {
    const tracker = createPitchTracker();
    const first = tracker.update(440, 0);
    assert.equal(tracker.update(null, 16), first);
    assert.equal(tracker.update(null, PITCH_TRACKING.silenceResetMs - 1), first);
    assert.equal(tracker.update(null, PITCH_TRACKING.silenceResetMs), null);
    const next = tracker.update(detunedA4(100), PITCH_TRACKING.silenceResetMs + 16);
    assert.deepEqual(next.gaugeNote, { noteName: "A#", octave: 4 });
    near(next.barPosition, 0.5);
    tracker.reset();
    assert.equal(tracker.update(null, PITCH_TRACKING.silenceResetMs + 32), null);
    assert.deepEqual(tracker.update(220, PITCH_TRACKING.silenceResetMs + 48).note, { noteName: "A", octave: 3 });
});

test("invalid timing and frequencies cannot leave NaN or infinity in a tracked reading", () => {
    const tracker = createPitchTracker();
    assert.equal(tracker.update(440, NaN), null);
    assert.equal(tracker.update(Infinity, 0), null);
    assert.equal(tracker.update(-440, 16), null);
    tracker.update(440, 32);
    assert.equal(tracker.update(440, Infinity), null);
    tracker.update(440, 64);
    assert.deepEqual(tracker.update(220, 0).note, { noteName: "A", octave: 3 });
});

test("meter accessibility describes the held bar reference independently of the detected note", () => {
    const tuning = getPitchTuning(detunedA4(100), { noteMidi: 70, gaugeMidi: 69 });
    const html = renderToStaticMarkup(React.createElement(NoteDisplay, {
        tuning, isListening: true, concertNote: tuning.note, trumpetNote: transposeNote(tuning.note, 2),
    }));
    assert.match(html, /aria-label="Concert nota: A#4"/);
    assert.match(html, /aria-label="Bb trompet notası: C5"/);
    assert.match(html, /aria-valuetext="A4 merkezine göre 100\.0 cent"/);
    near(Number(html.match(/class="gauge-needle [^"]*" style="left:([^%]+)%"/)[1]), 75);
    assert.match(html.replace(/<[^>]*>/g, ""), /SAPMA · A♯4/);
});

test("short multi-frame octave bursts cannot move the tracked pitch or its scale", () => {
    const tracker = createPitchTracker();
    for (let step = 0; step <= 20; step++) tracker.update(440, step * 16);
    for (let step = 21; step <= 26; step++) {
        const reading = tracker.update(880, step * 16);
        near(reading.frequency, 440);
        assert.deepEqual(reading.gaugeNote, { noteName: "A", octave: 4 });
    }
    near(tracker.update(440, 432).frequency, 440);
});

test("a genuine sustained octave leap is eventually accepted", () => {
    const tracker = createPitchTracker();
    tracker.update(440, 0);
    let reading;
    for (let step = 1; step <= 100; step++) reading = tracker.update(880, step * 16);
    assert.deepEqual(reading.note, { noteName: "A", octave: 5 });
    near(reading.frequency, 880, 0.01);
});

test("needle movement is bounded even when a target jumps from one edge to the other", () => {
    const motion = createGaugeMotion();
    let previous = motion.update({ centerMidi: 69, offsetCents: -200 }, 0);
    for (let step = 1; step <= 120; step++) {
        const frame = motion.update({ centerMidi: 69, offsetCents: 200 }, step * 1000 / 60);
        assert.ok(frame.position >= previous.position - 1e-9);
        assert.ok(frame.position - previous.position <= GAUGE_MOTION.maxSemitonesPerSecond / 240 + 1e-9);
        assert.ok(frame.position <= 1);
        previous = frame;
    }
    near(previous.position, 1, 0.0001);
});

test("reference changes pan the scale and move the existing needle without a coordinate jump", () => {
    const motion = createGaugeMotion();
    const before = motion.update({ centerMidi: 69, offsetCents: 100 }, 0);
    const first = motion.update({ centerMidi: 70, offsetCents: 0 }, 1000 / 60);
    assert.ok(first.centerMidi > 69 && first.centerMidi < 70);
    assert.ok(Math.abs(first.position - before.position) < 0.01);
    near(first.centerMidi + first.offsetCents / 100, 70, 0.0001);
    let frame;
    for (let step = 2; step <= 120; step++) frame = motion.update({ centerMidi: 70, offsetCents: 0 }, step * 1000 / 60);
    near(frame.centerMidi, 70, 0.0001);
    near(frame.position, 0.5, 0.0001);
});

test("a stalled animation frame cannot teleport the needle on resuming", () => {
    const motion = createGaugeMotion();
    const first = motion.update({ centerMidi: 69, offsetCents: -100 }, 0);
    const resumed = motion.update({ centerMidi: 69, offsetCents: 100 }, 10000);
    assert.ok(resumed.position - first.position < 0.03);
    assert.ok(resumed.position < 0.35);
});

test("a distant note changes the scale promptly without teleporting the needle", () => {
    const motion = createGaugeMotion();
    const first = motion.update({ centerMidi: 69, offsetCents: 20 }, 0);
    const changed = motion.update({ centerMidi: 81, offsetCents: 0 }, 1000 / 60);
    near(changed.centerMidi, 81);
    assert.ok(Math.abs(changed.position - first.position) < 0.01);
    let settled;
    for (let step = 2; step <= 60; step++) settled = motion.update({ centerMidi: 81, offsetCents: 0 }, step * 1000 / 60);
    near(settled.position, 0.5, 0.0001);
});

test("small measurement jitter settles instead of making the needle tremble", () => {
    const motion = createGaugeMotion();
    motion.update({ centerMidi: 69, offsetCents: 0 }, 0);
    for (let step = 1; step <= 120; step++) {
        const frame = motion.update({ centerMidi: 69, offsetCents: step % 2 ? 0.6 : -0.6 }, step * 1000 / 60);
        near(frame.position, 0.5);
    }
});

test("motion remains consistent across common screen refresh rates", () => {
    const positions = [30, 60, 120].map(fps => {
        const motion = createGaugeMotion();
        motion.update({ centerMidi: 69, offsetCents: 0 }, 0);
        let frame;
        for (let step = 1; step <= fps; step++) frame = motion.update({ centerMidi: 69, offsetCents: 100 }, step * 1000 / fps);
        return frame.position;
    });
    near(positions[0], positions[1], 0.001);
    near(positions[1], positions[2], 0.001);
});

test("reduced motion can snap to a valid reading, while reset and invalid data clear animation state", () => {
    const motion = createGaugeMotion();
    motion.update({ centerMidi: 69, offsetCents: 0 }, 0);
    near(motion.update({ centerMidi: 70, offsetCents: -40 }, 16, true).position, 0.4);
    assert.equal(motion.update(null, 32), null);
    near(motion.update({ centerMidi: 65, offsetCents: 0 }, 48).centerMidi, 65);
    assert.equal(motion.update({ centerMidi: NaN, offsetCents: 0 }, 64), null);
    motion.reset();
    near(motion.update({ centerMidi: 60, offsetCents: 20 }, 80).position, 0.55);
});

test("noisy sustained pitch is strongly damped without losing a slow intentional slide", () => {
    const tracker = createPitchTracker();
    const motion = createGaugeMotion();
    const measured = [];
    tracker.update(440, 0);
    motion.update({ centerMidi: 69, offsetCents: 0 }, 0);
    for (let step = 1; step <= 240; step++) {
        const time = step / 60;
        const cents = 35 * Math.sin(2 * Math.PI * 6 * time);
        const reading = tracker.update(detunedA4(cents), time * 1000);
        const frame = motion.update({ centerMidi: 69, offsetCents: reading.gaugeCents }, time * 1000);
        if (step > 60) measured.push(frame.offsetCents);
    }
    const rms = Math.sqrt(measured.reduce((sum, value) => sum + value * value, 0) / measured.length);
    assert.ok(rms < 3, `Displayed jitter RMS: ${rms} cents`);
    let previous = motion.update({ centerMidi: 69, offsetCents: 0 }, 4000);
    // Start a fresh smooth slide to avoid including the prior vibrato's settling.
    tracker.reset();
    motion.reset();
    for (let step = 0; step <= 180; step++) {
        const reading = tracker.update(detunedA4(step * 100 / 180), step * 1000 / 60);
        const frame = motion.update({ centerMidi: 69, offsetCents: reading.gaugeCents }, step * 1000 / 60);
        if (step > 0) assert.ok(frame.position >= previous.position - 1e-9);
        previous = frame;
    }
    assert.ok(previous.position > 0.715);
});
