export const professions = [
  { path: 'designer', name: 'Designer', desc: 'Portfolio', glyph: 'De', color: '#e84393', load: () => import('./designer.component').then((m) => m.DesignerComponent) },
  { path: 'developer', name: 'Developer', desc: 'Repos', glyph: 'Dv', color: '#6c5ce7', load: () => import('./developer.component').then((m) => m.DeveloperComponent) },
  { path: 'photographer', name: 'Photographer', desc: 'Studio', glyph: 'Ph', color: '#0984e3', load: () => import('./photographer.component').then((m) => m.PhotographerComponent) },
  { path: 'chef', name: 'Chef', desc: 'Kitchen', glyph: 'Ch', color: '#e17055', load: () => import('./chef.component').then((m) => m.ChefComponent) },
  { path: 'doctor', name: 'Doctor', desc: 'Schedule', glyph: 'Dr', color: '#00b894', load: () => import('./doctor.component').then((m) => m.DoctorComponent) },
  { path: 'lawyer', name: 'Lawyer', desc: 'Docket', glyph: 'La', color: '#636e72', load: () => import('./lawyer.component').then((m) => m.LawyerComponent) },
  { path: 'teacher', name: 'Teacher', desc: 'Class', glyph: 'Te', color: '#fdcb6e', load: () => import('./teacher.component').then((m) => m.TeacherComponent) },
  { path: 'architect', name: 'Architect', desc: 'Studio', glyph: 'Ar', color: '#2d3436', load: () => import('./architect.component').then((m) => m.ArchitectComponent) },
  { path: 'musician', name: 'Musician', desc: 'Studio', glyph: 'Mu', color: '#fd79a8', load: () => import('./musician.component').then((m) => m.MusicianComponent) },
  { path: 'marketer', name: 'Marketer', desc: 'Campaigns', glyph: 'Ma', color: '#00cec9', load: () => import('./marketer.component').then((m) => m.MarketerComponent) },
];
