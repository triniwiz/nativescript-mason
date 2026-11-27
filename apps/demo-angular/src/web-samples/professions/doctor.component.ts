import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { DemoPageComponent } from '../../shared/demo-page.component';

@Component({ selector: 'demo-doctor', templateUrl: 'doctor.component.html', styleUrl: 'doctor.component.scss', imports: [DemoPageComponent], schemas: [NO_ERRORS_SCHEMA] })
export class DoctorComponent {
  readonly appointments = [
    { time: '09:30', dur: 30, patient: 'Marta Kowalski', initials: 'MK', color: '#6c5ce7', reason: 'Annual check-up', status: 'Done', statusClass: 'done' },
    { time: '10:15', dur: 45, patient: 'Jon Peters', initials: 'JP', color: '#0984e3', reason: 'ECG follow-up', status: 'Done', statusClass: 'done' },
    { time: '11:00', dur: 30, patient: 'Aisha Khan', initials: 'AK', color: '#00b894', reason: 'Blood pressure review', status: 'In room', statusClass: 'active' },
    { time: '11:45', dur: 30, patient: 'Tomás Ribeiro', initials: 'TR', color: '#e17055', reason: 'Post-op consult', status: 'Waiting', statusClass: 'waiting' },
    { time: '13:00', dur: 60, patient: 'Lena Fischer', initials: 'LF', color: '#e84393', reason: 'Stress test', status: 'Scheduled', statusClass: 'scheduled' },
  ];
}
