import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const ID = 'download'; // satu notifikasi yang terus diganti isinya
// progress di channel LOW agar tidak bunyi/heads-up tiap update; hasil akhir di channel DEFAULT
const PROGRESS = 'download-progress';
const RESULT = 'download-result';

Notifications.setNotificationHandler({
  // tanpa handler, notifikasi tidak tampil saat app sedang dibuka
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

let ready;
const setup = () => (ready ??= (async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(PROGRESS, { name: 'Download berlangsung', importance: Notifications.AndroidImportance.LOW });
    await Notifications.setNotificationChannelAsync(RESULT, { name: 'Download selesai/gagal', importance: Notifications.AndroidImportance.DEFAULT });
  }
  const { granted } = await Notifications.requestPermissionsAsync();
  return granted;
})().catch(() => false));

async function show(title, body, channelId, sticky = false) {
  if (!(await setup())) return; // izin ditolak: status tetap terlihat di layar
  await Notifications.scheduleNotificationAsync({ identifier: ID, content: { title, body, sticky, autoDismiss: !sticky }, trigger: channelId ? { channelId } : null });
}

// antre berurutan supaya update progress yang telat tidak menimpa notifikasi selesai/gagal
let queue = Promise.resolve();
const safe = (fn) => (queue = queue.then(fn).catch((e) => console.warn('notifikasi gagal', e)));

export const notifyProgress = (title, pct) =>
  safe(() => show('Sedang mengunduh', pct >= 0 ? `${title} · ${Math.round(pct)}%` : title, PROGRESS, true));
export const notifyDone = (title) => safe(() => show('Download selesai', title, RESULT));
export const notifyFailed = (title, reason) => safe(() => show('Download gagal', `${title}: ${reason}`, RESULT));
export const notifyCanceled = (title) => safe(() => show('Download dibatalkan', title, RESULT));
