import type { Exercise } from './index';

const now = new Date().toISOString();

function ex(
  name: string,
  category: string,
  role: Exercise['training_role'],
  pattern: string,
  primary: string[],
  secondary: string[],
  equipment: string[],
  bilateral = true,
  bodyweight = false,
  barWeight = 0,
  increment = 2.5
): Omit<Exercise, 'id'> {
  return {
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    category,
    training_role: role,
    movement_pattern: pattern,
    primary_muscles: primary,
    secondary_muscles: secondary,
    equipment,
    is_bilateral: bilateral,
    is_bodyweight: bodyweight,
    default_bar_weight_kg: barWeight,
    default_increment_kg: increment,
    is_system: true,
    is_active: true,
    notes: '',
    created_at: now
  };
}

export const seedExercises: Omit<Exercise, 'id'>[] = [
  // ── BARBELL — MAIN ──────────────────────────────────────────────────────────
  ex('Barbell Back Squat',      'legs',  'main',      'squat',            ['quads','glutes'],         ['hamstrings','lower_back','calves'], ['barbell'], true,  false, 20, 2.5),
  ex('Barbell Front Squat',     'legs',  'main',      'squat',            ['quads'],                  ['glutes','upper_back'],             ['barbell'], true,  false, 20, 2.5),
  ex('Conventional Deadlift',   'hinge', 'main',      'hinge',            ['glutes','hamstrings','lower_back'], ['quads','lats','traps'], ['barbell'], true, false, 20, 2.5),
  ex('Romanian Deadlift',       'hinge', 'main',      'hinge',            ['hamstrings','glutes'],    ['lower_back'],                      ['barbell'], true,  false, 20, 2.5),
  ex('Sumo Deadlift',           'hinge', 'main',      'hinge',            ['glutes','hamstrings','adductors'], ['quads','lower_back'],    ['barbell'], true,  false, 20, 2.5),
  ex('Barbell Bench Press',     'push',  'main',      'horizontal_push',  ['chest','front_delt'],     ['tricep'],                          ['barbell'], true,  false, 20, 2.5),
  ex('Incline Barbell Press',   'push',  'secondary', 'horizontal_push',  ['chest','front_delt'],     ['tricep'],                          ['barbell'], true,  false, 20, 2.5),
  ex('Barbell Overhead Press',  'push',  'main',      'vertical_push',    ['front_delt','side_delt'], ['tricep','upper_back'],             ['barbell'], true,  false, 20, 2.5),
  ex('Barbell Row (Bent Over)', 'pull',  'main',      'horizontal_pull',  ['lats','upper_back'],      ['bicep','rear_delt'],               ['barbell'], true,  false, 20, 2.5),
  ex('Barbell Hip Thrust',      'hinge', 'main',      'hinge',            ['glutes'],                 ['hamstrings'],                      ['barbell'], true,  false, 20, 2.5),
  ex('Good Morning',            'hinge', 'secondary', 'hinge',            ['hamstrings','lower_back'],['glutes'],                          ['barbell'], true,  false, 20, 2.5),
  ex('Barbell Lunge',           'legs',  'secondary', 'lunge',            ['quads','glutes'],         ['hamstrings','calves'],             ['barbell'], false, false, 20, 2.5),
  ex('Close-Grip Bench Press',  'push',  'secondary', 'horizontal_push',  ['tricep','chest'],         ['front_delt'],                      ['barbell'], true,  false, 20, 2.5),
  ex('Barbell Curl',            'pull',  'accessory', 'isolation',        ['bicep'],                  ['forearm'],                         ['barbell'], true,  false, 20, 1.0),
  ex('Barbell Shrug',           'pull',  'accessory', 'isolation',        ['traps'],                  ['forearm'],                         ['barbell'], true,  false, 20, 2.5),
  ex('Zercher Squat',           'legs',  'secondary', 'squat',            ['quads','glutes'],         ['upper_back','core'],               ['barbell'], true,  false, 20, 2.5),
  ex('Paused Squat',            'legs',  'secondary', 'squat',            ['quads','glutes'],         ['hamstrings'],                      ['barbell'], true,  false, 20, 2.5),
  ex('Deficit Deadlift',        'hinge', 'secondary', 'hinge',            ['hamstrings','glutes'],    ['lower_back','quads'],              ['barbell'], true,  false, 20, 2.5),
  ex('Stiff-Leg Deadlift',      'hinge', 'secondary', 'hinge',            ['hamstrings','glutes'],    ['lower_back'],                      ['barbell'], true,  false, 20, 2.5),

  // ── DUMBBELL — MAIN / SECONDARY ─────────────────────────────────────────────
  ex('Dumbbell Bench Press',    'push',  'secondary', 'horizontal_push',  ['chest','front_delt'],     ['tricep'],                          ['dumbbell'], true,  false, 0, 2.0),
  ex('Incline Dumbbell Press',  'push',  'secondary', 'horizontal_push',  ['chest','front_delt'],     ['tricep'],                          ['dumbbell'], true,  false, 0, 2.0),
  ex('Dumbbell Shoulder Press', 'push',  'secondary', 'vertical_push',    ['front_delt','side_delt'], ['tricep'],                          ['dumbbell'], true,  false, 0, 2.0),
  ex('Dumbbell Row',            'pull',  'secondary', 'horizontal_pull',  ['lats','upper_back'],      ['bicep','rear_delt'],               ['dumbbell'], false, false, 0, 2.0),
  ex('Dumbbell RDL',            'hinge', 'secondary', 'hinge',            ['hamstrings','glutes'],    ['lower_back'],                      ['dumbbell'], true,  false, 0, 2.0),
  ex('Dumbbell Hip Thrust',     'hinge', 'secondary', 'hinge',            ['glutes'],                 ['hamstrings'],                      ['dumbbell'], true,  false, 0, 2.0),
  ex('Goblet Squat',            'legs',  'secondary', 'squat',            ['quads','glutes'],         ['upper_back','core'],               ['dumbbell','kettlebell'], true, false, 0, 2.0),
  ex('Dumbbell Lunge',          'legs',  'secondary', 'lunge',            ['quads','glutes'],         ['hamstrings','calves'],             ['dumbbell'], false, false, 0, 2.0),
  ex('Bulgarian Split Squat',   'legs',  'secondary', 'lunge',            ['quads','glutes'],         ['hamstrings'],                      ['dumbbell','barbell'], false, false, 0, 2.0),
  ex('Dumbbell Step-Up',        'legs',  'accessory', 'lunge',            ['quads','glutes'],         ['hamstrings'],                      ['dumbbell'], false, false, 0, 2.0),

  // ── DUMBBELL — ACCESSORY ────────────────────────────────────────────────────
  ex('Dumbbell Lateral Raise',  'push',  'accessory', 'isolation',        ['side_delt'],              ['front_delt'],                      ['dumbbell'], true,  false, 0, 1.0),
  ex('Dumbbell Front Raise',    'push',  'accessory', 'isolation',        ['front_delt'],             [],                                  ['dumbbell'], true,  false, 0, 1.0),
  ex('Dumbbell Rear Delt Fly',  'pull',  'accessory', 'isolation',        ['rear_delt'],              ['upper_back'],                      ['dumbbell'], true,  false, 0, 1.0),
  ex('Dumbbell Curl',           'pull',  'accessory', 'isolation',        ['bicep'],                  ['forearm'],                         ['dumbbell'], true,  false, 0, 1.0),
  ex('Hammer Curl',             'pull',  'accessory', 'isolation',        ['bicep','forearm'],        [],                                  ['dumbbell'], true,  false, 0, 1.0),
  ex('Concentration Curl',      'pull',  'accessory', 'isolation',        ['bicep'],                  [],                                  ['dumbbell'], false, false, 0, 1.0),
  ex('Dumbbell Tricep Kickback','push',  'accessory', 'isolation',        ['tricep'],                 [],                                  ['dumbbell'], false, false, 0, 1.0),
  ex('Dumbbell Skullcrusher',   'push',  'accessory', 'isolation',        ['tricep'],                 [],                                  ['dumbbell'], true,  false, 0, 1.0),
  ex('Dumbbell Shrug',          'pull',  'accessory', 'isolation',        ['traps'],                  [],                                  ['dumbbell'], true,  false, 0, 1.0),
  ex('Chest-Supported Row',     'pull',  'secondary', 'horizontal_pull',  ['upper_back','lats'],      ['bicep','rear_delt'],               ['dumbbell'], true,  false, 0, 2.0),
  ex('Single-Leg RDL',          'hinge', 'secondary', 'hinge',            ['hamstrings','glutes'],    ['lower_back'],                      ['dumbbell'], false, false, 0, 2.0),

  // ── CABLE ────────────────────────────────────────────────────────────────────
  ex('Cable Row (Seated)',       'pull',  'secondary', 'horizontal_pull',  ['upper_back','lats'],      ['bicep','rear_delt'],               ['cable'], true,  false, 0, 2.5),
  ex('Lat Pulldown',            'pull',  'secondary', 'vertical_pull',    ['lats'],                   ['bicep','rear_delt'],               ['cable'], true,  false, 0, 2.5),
  ex('Face Pull',               'pull',  'accessory', 'horizontal_pull',  ['rear_delt','upper_back'], [],                                  ['cable'], true,  false, 0, 2.5),
  ex('Cable Fly (Low-to-High)', 'push',  'accessory', 'isolation',        ['chest'],                  ['front_delt'],                      ['cable'], true,  false, 0, 2.5),
  ex('Cable Fly (High-to-Low)', 'push',  'accessory', 'isolation',        ['chest'],                  ['front_delt'],                      ['cable'], true,  false, 0, 2.5),
  ex('Cable Lateral Raise',     'push',  'accessory', 'isolation',        ['side_delt'],              [],                                  ['cable'], false, false, 0, 2.5),
  ex('Cable Curl',              'pull',  'accessory', 'isolation',        ['bicep'],                  [],                                  ['cable'], true,  false, 0, 2.5),
  ex('Tricep Pushdown (Rope)',  'push',  'accessory', 'isolation',        ['tricep'],                 [],                                  ['cable'], true,  false, 0, 2.5),
  ex('Tricep Pushdown (Bar)',   'push',  'accessory', 'isolation',        ['tricep'],                 [],                                  ['cable'], true,  false, 0, 2.5),
  ex('Overhead Tricep Extension','push', 'accessory', 'isolation',        ['tricep'],                 [],                                  ['cable'], true,  false, 0, 2.5),
  ex('Pallof Press',            'core',  'accessory', 'rotation',         ['abs','obliques'],         ['hip_flexor'],                      ['cable'], true,  false, 0, 2.5),
  ex('Cable Crunch',            'core',  'accessory', 'isolation',        ['abs'],                    [],                                  ['cable'], true,  false, 0, 2.5),
  ex('Cable Kickback',          'hinge', 'accessory', 'isolation',        ['glutes'],                 [],                                  ['cable'], false, false, 0, 2.5),
  ex('Straight-Arm Pulldown',   'pull',  'accessory', 'isolation',        ['lats'],                   [],                                  ['cable'], true,  false, 0, 2.5),

  // ── MACHINE ──────────────────────────────────────────────────────────────────
  ex('Leg Press',               'legs',  'secondary', 'squat',            ['quads','glutes'],         ['hamstrings','calves'],             ['machine'], true,  false, 0, 5.0),
  ex('Hack Squat',              'legs',  'secondary', 'squat',            ['quads'],                  ['glutes','hamstrings'],             ['machine'], true,  false, 0, 5.0),
  ex('Leg Extension',           'legs',  'accessory', 'isolation',        ['quads'],                  [],                                  ['machine'], true,  false, 0, 2.5),
  ex('Leg Curl (Lying)',        'legs',  'accessory', 'isolation',        ['hamstrings'],             [],                                  ['machine'], true,  false, 0, 2.5),
  ex('Leg Curl (Seated)',       'legs',  'accessory', 'isolation',        ['hamstrings'],             [],                                  ['machine'], true,  false, 0, 2.5),
  ex('Calf Raise (Machine)',    'legs',  'accessory', 'isolation',        ['calves'],                 [],                                  ['machine'], true,  false, 0, 5.0),
  ex('Seated Calf Raise',       'legs',  'accessory', 'isolation',        ['calves'],                 [],                                  ['machine'], true,  false, 0, 2.5),
  ex('Chest Press (Machine)',   'push',  'secondary', 'horizontal_push',  ['chest','front_delt'],     ['tricep'],                          ['machine'], true,  false, 0, 2.5),
  ex('Pec Deck / Machine Fly',  'push',  'accessory', 'isolation',        ['chest'],                  ['front_delt'],                      ['machine'], true,  false, 0, 2.5),
  ex('Machine Row',             'pull',  'secondary', 'horizontal_pull',  ['upper_back','lats'],      ['bicep'],                           ['machine'], true,  false, 0, 2.5),
  ex('Machine Shoulder Press',  'push',  'secondary', 'vertical_push',    ['front_delt','side_delt'], ['tricep'],                          ['machine'], true,  false, 0, 2.5),
  ex('Smith Machine Squat',     'legs',  'secondary', 'squat',            ['quads','glutes'],         ['hamstrings'],                      ['machine'], true,  false, 0, 2.5),
  ex('Hip Abductor (Machine)',  'legs',  'rehab_support','isolation',      ['abductors','glutes'],     [],                                  ['machine'], true,  false, 0, 2.5),
  ex('Hip Adductor (Machine)',  'legs',  'rehab_support','isolation',      ['adductors'],              [],                                  ['machine'], true,  false, 0, 2.5),

  // ── BODYWEIGHT ───────────────────────────────────────────────────────────────
  ex('Pull-Up',                 'pull',  'main',      'vertical_pull',    ['lats','upper_back'],      ['bicep'],                           ['pull_up_bar','bodyweight'], true, true, 0, 1.0),
  ex('Chin-Up',                 'pull',  'secondary', 'vertical_pull',    ['lats','bicep'],           ['upper_back'],                      ['pull_up_bar','bodyweight'], true, true, 0, 1.0),
  ex('Dip',                     'push',  'secondary', 'vertical_push',    ['tricep','chest'],         ['front_delt'],                      ['dip_bar','bodyweight'], true, true, 0, 1.0),
  ex('Push-Up',                 'push',  'secondary', 'horizontal_push',  ['chest','front_delt'],     ['tricep'],                          ['bodyweight'], true, true, 0, 0),
  ex('Ring Row',                'pull',  'secondary', 'horizontal_pull',  ['upper_back','lats'],      ['bicep'],                           ['bodyweight'], true, true, 0, 0),
  ex('Inverted Row',            'pull',  'secondary', 'horizontal_pull',  ['upper_back','lats'],      ['bicep'],                           ['bodyweight'], true, true, 0, 0),
  ex('Pike Push-Up',            'push',  'secondary', 'vertical_push',    ['front_delt'],             ['tricep'],                          ['bodyweight'], true, true, 0, 0),
  ex('Glute Bridge (BW)',       'hinge', 'warmup',    'hinge',            ['glutes'],                 ['hamstrings'],                      ['bodyweight'], true, true, 0, 0),
  ex('Nordic Curl',             'hinge', 'accessory', 'hinge',            ['hamstrings'],             [],                                  ['bodyweight'], true, true, 0, 0),

  // ── KETTLEBELL ───────────────────────────────────────────────────────────────
  ex('Kettlebell Swing',        'hinge', 'secondary', 'hinge',            ['glutes','hamstrings'],    ['lower_back','lats'],               ['kettlebell'], true, false, 0, 4.0),
  ex('Kettlebell Turkish Get-Up','other','secondary', 'other',            ['glutes','shoulder','core'],['tricep'],                         ['kettlebell'], false, false, 0, 4.0),
  ex('Kettlebell Clean',        'hinge', 'secondary', 'hinge',            ['glutes','hamstrings','traps'],['lower_back'],                  ['kettlebell'], false, false, 0, 4.0),

  // ── CORE ─────────────────────────────────────────────────────────────────────
  ex('Plank',                   'core',  'accessory', 'other',            ['abs','obliques'],         ['lower_back'],                      ['bodyweight'], true, true, 0, 0),
  ex('Side Plank',              'core',  'accessory', 'other',            ['obliques','abs'],         [],                                  ['bodyweight'], false, true, 0, 0),
  ex('Ab Wheel Rollout',        'core',  'accessory', 'other',            ['abs'],                    ['lower_back','lats'],               ['other'], true, true, 0, 0),
  ex('Hanging Leg Raise',       'core',  'accessory', 'isolation',        ['abs','hip_flexor'],       [],                                  ['pull_up_bar'], true, true, 0, 0),
  ex('Dead Bug',                'core',  'rehab_support','other',         ['abs'],                    ['hip_flexor'],                      ['bodyweight'], true, true, 0, 0),
  ex('Bird Dog',                'core',  'rehab_support','other',         ['lower_back','abs'],       ['glutes'],                          ['bodyweight'], true, true, 0, 0),
  ex('Copenhagen Plank',        'core',  'rehab_support','other',         ['adductors','obliques'],   [],                                  ['bodyweight'], false, true, 0, 0),

  // ── REHAB / SUPPORT ──────────────────────────────────────────────────────────
  ex('Banded Clamshell',        'legs',  'rehab_support','isolation',     ['abductors','glutes'],     [],                                  ['other'], false, true, 0, 0),
  ex('Banded Hip Thrust',       'hinge', 'rehab_support','hinge',         ['glutes'],                 ['hamstrings'],                      ['other'], true, true, 0, 0),
  ex('Scapular Pull-Up',        'pull',  'rehab_support','vertical_pull', ['upper_back'],             [],                                  ['pull_up_bar','bodyweight'], true, true, 0, 0),
  ex('Band Pull-Apart',         'pull',  'rehab_support','horizontal_pull',['rear_delt','upper_back'],[],                                  ['other'], true, false, 0, 0),
  ex('Wall Slide',              'push',  'rehab_support','other',         ['front_delt','upper_back'],[],                                  ['bodyweight'], true, true, 0, 0),
  ex('Reverse Hyper',           'hinge', 'rehab_support','hinge',         ['glutes','hamstrings','lower_back'],[],                        ['machine'], true, false, 0, 2.5),
];
