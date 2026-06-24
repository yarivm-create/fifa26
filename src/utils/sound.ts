// Synthesizes a short referee-whistle sound with the Web Audio API so we don't
// need to bundle an audio asset. Safe to call anywhere: if audio isn't
// supported or is blocked by autoplay policy, it fails silently.

export function playWhistle(): void {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    const master = ctx.createGain();
    master.gain.value = 0.0001;
    master.connect(ctx.destination);

    // A whistle is a high tone with fast vibrato (the "pea" trill).
    const osc = ctx.createOscillator();
    osc.type = 'square';
    const vibrato = ctx.createOscillator();
    const vibratoGain = ctx.createGain();
    vibrato.frequency.value = 28; // trill rate
    vibratoGain.gain.value = 120; // trill depth (Hz)
    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc.frequency);
    osc.frequency.value = 2300;
    osc.connect(master);

    const now = ctx.currentTime;
    // Two short blasts, like a final-whistle "peep-peep".
    const blast = (start: number, dur: number) => {
      master.gain.setValueAtTime(0.0001, start);
      master.gain.exponentialRampToValueAtTime(0.22, start + 0.03);
      master.gain.setValueAtTime(0.22, start + dur - 0.05);
      master.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    };
    blast(now + 0.0, 0.22);
    blast(now + 0.3, 0.45);

    osc.start(now);
    vibrato.start(now);
    const stopAt = now + 0.9;
    osc.stop(stopAt);
    vibrato.stop(stopAt);
    setTimeout(() => ctx.close().catch(() => {}), 1200);
  } catch {
    /* audio not available — ignore */
  }
}
