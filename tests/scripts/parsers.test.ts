import { normalizarEjercicio, extraerVariante, normalizarTempo, extraerReps, parsearMetcon } from '../../scripts/notion/parsers';

test('normalizarEjercicio unifica erratas', () => {
  expect(normalizarEjercicio('Back Squat')).toBe('back-squat');
  expect(normalizarEjercicio('SNACH')).toBe('snatch');
  expect(normalizarEjercicio('Snach')).toBe('snatch');
  expect(normalizarEjercicio('Puss Press')).toBe('push-press');
  expect(normalizarEjercicio('Puss ups')).toBe('push-ups');
  expect(normalizarEjercicio('Shoulder press')).toBe('shoulder-press');
  expect(normalizarEjercicio(null)).toBeNull();
});
test('extraerReps', () => {
  expect(extraerReps('Back Squad 5x94kg')).toBe(5);
  expect(extraerReps('Back Squad. 96x8')).toBe(8);
  expect(extraerReps('Shoulder press btw 42kg x6')).toBe(6);
  expect(extraerReps('Back Squad 100kg x4')).toBe(4);
  expect(extraerReps('Press banca 60kg. X5')).toBe(5);
  expect(extraerReps('Shoulder press 43kg x 8*')).toBe(8);
  expect(extraerReps('Dips')).toBeNull();
});
test('extraerVariante', () => {
  expect(extraerVariante('Shoulder press btw 42kg x6')).toBe('btn');
  expect(extraerVariante('Sounder press btn 5x42kg')).toBe('btn');
  expect(extraerVariante('Back Squad H.L. close 6x90')).toBe('close grip');
  expect(extraerVariante('Back Squad hL. 85kg x 8')).toBe('barra alta');
  expect(extraerVariante('Press banca MG 64kg x 6')).toBe('agarre medio');
  expect(extraerVariante('Pres banca mis grip 70x5')).toBe('agarre medio');
  expect(extraerVariante('Press banca medio 62x8 3 seg.')).toBe('agarre medio');
  expect(extraerVariante('Back Squad 5x94kg')).toBeUndefined();
});
test('normalizarTempo', () => {
  expect(normalizarTempo('Cuatro segundos con pausa')).toBe('4s+pausa');
  expect(normalizarTempo('3 seg. Más pausa')).toBe('3s+pausa');
  expect(normalizarTempo(',4seg.')).toBe('4s');
  expect(normalizarTempo('3 segundos')).toBe('3s');
  expect(normalizarTempo(null)).toBeUndefined();
});
test('parsearMetcon intervalos con reps', () =>
  expect(parsearMetcon('Metcom\nAMRAP 1’ on, 1’ off 16’ (153)\n30’’ maxBack Squat 50kg\n30’’ Max burpee'))
    .toMatchObject({ formato: 'Intervalos', duracionMin: 16, resultado: { tipo: 'reps', valor: '153' } }));
test('parsearMetcon for time', () =>
  expect(parsearMetcon('Metcom\n21,15,9 (11:50)\nDealdfit 102kg\nToes2bar\nBurpees obb')?.resultado)
    .toEqual({ tipo: 'tiempo', valor: '11:50' }));
test('parsearMetcon AMRAP ignora pesos entre paréntesis', () =>
  expect(parsearMetcon('Performamce\nAmrap 20 min\n400m run\n30 Swim KB (16kg)\n20 burpees\nMarca (3+200)'))
    .toMatchObject({ formato: 'AMRAP', duracionMin: 20, resultado: { tipo: 'rondas+reps', valor: '3+200' } }));
test('parsearMetcon EMOM por bloques', () =>
  expect(parsearMetcon('Metcom\nEMOM 10’\n10Cal row\nMax burpees (40)\n\nEMOM 10’\n10Cal Bk\nMax reps KB Swim (51)')?.resultado)
    .toEqual({ tipo: 'bloques', valor: '40/51' }));
test('parsearMetcon I go you go', () =>
  expect(parsearMetcon('Metcom\nI go you go (20min) 446\nMax Kb swim 26kg\nMax Burpees')?.formato).toBe('Intervalos'));
test('parsearMetcon vacío', () => {
  expect(parsearMetcon('Metcom\n')).toBeUndefined();
  expect(parsearMetcon('')).toBeUndefined();
});
test('descripcion sin el título', () =>
  expect(parsearMetcon('Metcom\n21,15,9 (11:50)\nDealdfit 102kg')?.descripcion).toBe('21,15,9 (11:50)\nDealdfit 102kg'));

test('normalizarTempo usa el primer dígito aislado (formato 3-0-1-0) y 5 seg', () => {
  expect(normalizarTempo('3-0-1-0')).toBe('3s');
  expect(normalizarTempo('4-1-x-0')).toBe('4s');
  expect(normalizarTempo('5 seg.')).toBe('5s');
  expect(normalizarTempo('Cinco segundos de bajada')).toBe('5s');
  expect(normalizarTempo('75%')).toBeUndefined();
  expect(normalizarTempo('Técnica EMOM 14MIM')).toBeUndefined();
});
test('extraerVariante: agarre cerrado y mid grip', () => {
  expect(extraerVariante('Press banca agarre cerrado 67kg')).toBe('close grip');
  expect(extraerVariante('Press banca mid grip 65kg')).toBe('agarre medio');
  expect(extraerVariante('Prees Banca mind grip 64kg. 4seg.')).toBe('agarre medio');
});
