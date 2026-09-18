<template>
  <Page iosOverflowSafeAreaEnabled="false">
    <ActionBar title="Doctor — Schedule">
      <NavigationButton text="Back" android.systemIcon="ic_menu_back" @tap="$navigateBack()" />
    </ActionBar>
    <Scroll class="page">
      <main class="page-body">
        <section class="doctor-head">
          <div class="avatar"><span>ES</span></div>
          <div class="doctor-body">
            <h1>Dr. Elena Strauss</h1>
            <p class="spec">Cardiology · St. Aurelia Hospital</p>
          </div>
        </section>

        <section class="stat-row">
          <div class="stat"><span class="stat-value">18</span><span class="stat-label">Today</span></div>
          <div class="stat"><span class="stat-value">6</span><span class="stat-label">Done</span></div>
          <div class="stat"><span class="stat-value">2</span><span class="stat-label">Waiting</span></div>
        </section>

        <h2>Appointments</h2>
        <section class="appt-list">
          <article v-for="a in appointments" :key="a.time" class="appt-card">
            <div class="time-col">
              <span class="time">{{ a.time }}</span>
              <span class="dur">{{ a.dur }} min</span>
            </div>
            <div class="pavatar" :style="{ backgroundColor: a.color }"><span>{{ a.initials }}</span></div>
            <div class="appt-body">
              <p class="pname">{{ a.patient }}</p>
              <p class="reason">{{ a.reason }}</p>
            </div>
            <span class="badge" :class="a.statusClass">{{ a.status }}</span>
          </article>
        </section>
      </main>
    </Scroll>
  </Page>
</template>

<script lang="ts" setup>
import { $navigateBack } from 'nativescript-vue';
const appointments = [
  { time: '09:30', dur: 30, patient: 'Marta Kowalski', initials: 'MK', color: '#6c5ce7', reason: 'Annual check-up', status: 'Done', statusClass: 'done' },
  { time: '10:15', dur: 45, patient: 'Jon Peters', initials: 'JP', color: '#0984e3', reason: 'ECG follow-up', status: 'Done', statusClass: 'done' },
  { time: '11:00', dur: 30, patient: 'Aisha Khan', initials: 'AK', color: '#00b894', reason: 'Blood pressure review', status: 'In room', statusClass: 'active' },
  { time: '11:45', dur: 30, patient: 'Tomás Ribeiro', initials: 'TR', color: '#e17055', reason: 'Post-op consult', status: 'Waiting', statusClass: 'waiting' },
  { time: '13:00', dur: 60, patient: 'Lena Fischer', initials: 'LF', color: '#e84393', reason: 'Stress test', status: 'Scheduled', statusClass: 'scheduled' },
];
</script>

<style scoped>
.page { background-color: var(--bg); overflow-y: scroll; }
main { display: flex; flex-direction: column; gap: 12; }
h2 { font-size: 14; font-weight: bold; color: var(--text); }
.doctor-head { display: flex; flex-direction: row; align-items: center; gap: 12; background-color: var(--surface); border-radius: 14; padding: 14; box-shadow: 0 2px 8px var(--shadow); }
.avatar { width: 54; height: 54; border-radius: 27; background-color: #0984e3; display: flex; align-items: center; justify-content: center; }
.avatar span { color: #ffffff; font-size: 18; font-weight: bold; }
.doctor-body { display: flex; flex-direction: column; gap: 2; }
.doctor-body h1 { font-size: 17; font-weight: bold; color: var(--text); }
.spec { font-size: 12; color: var(--muted); }
.stat-row { display: flex; flex-direction: row; gap: 10; }
.stat { flex-grow: 1; background-color: var(--surface); border-radius: 12; padding: 12; display: flex; flex-direction: column; align-items: center; gap: 2; box-shadow: 0 2px 8px var(--shadow); }
.stat-value { font-size: 18; font-weight: bold; color: var(--text); }
.stat-label { font-size: 11; color: var(--muted); }
.appt-list { display: flex; flex-direction: column; gap: 8; }
.appt-card { display: flex; flex-direction: row; align-items: center; gap: 10; background-color: var(--surface); border-radius: 12; padding: 12; box-shadow: 0 2px 8px var(--shadow); }
.time-col { display: flex; flex-direction: column; align-items: center; width: 44; }
.time { font-size: 13; font-weight: bold; color: var(--text); }
.dur { font-size: 10; color: var(--muted); }
.pavatar { width: 36; height: 36; border-radius: 18; display: flex; align-items: center; justify-content: center; }
.pavatar span { color: #ffffff; font-size: 12; font-weight: bold; }
.appt-body { flex-grow: 1; display: flex; flex-direction: column; gap: 1; }
.pname { font-size: 13; font-weight: bold; color: var(--text); }
.reason { font-size: 11; color: var(--muted); }
.badge { font-size: 10; font-weight: bold; padding: 3 8; border-radius: 10; }
.badge.done { background-color: var(--surface-2); color: var(--muted); }
.badge.active { background-color: #e7f9f2; color: #00b894; }
.badge.waiting { background-color: #fff3d6; color: #c98a12; }
.badge.scheduled { background-color: #e8f1fd; color: #0984e3; }
</style>
