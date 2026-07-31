package com.simesra.pesantren;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;

import com.getcapacitor.BridgeActivity;
import com.google.firebase.messaging.FirebaseMessaging;

public class MainActivity extends BridgeActivity {

    private static final String TAG = "MainActivity";
    public static final String CHANNEL_ID = "as_syadzili_channel_v4"; // Gunakan v4 agar OS mendefinisikan ulang channel baru dengan suara

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Buat channel notifikasi SEGERA agar ada sebelum FCM mengirimkan pesan apapun
        createNotificationChannel();

        // Daftarkan HP ini ke topik global agar menerima notifikasi pengumuman dari admin
        FirebaseMessaging.getInstance().subscribeToTopic("global_announcements")
                .addOnCompleteListener(task -> {
                    if (task.isSuccessful()) {
                        Log.d(TAG, "Berhasil subscribe ke topik global_announcements");
                    } else {
                        Log.e(TAG, "Gagal subscribe ke topik global_announcements", task.getException());
                    }
                });
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "AS-SYADZILI Notifikasi",
                    NotificationManager.IMPORTANCE_HIGH  // IMPORTANCE_HIGH = bersuara dan muncul di atas layar (heads-up)
            );
            channel.setDescription("Notifikasi resmi dari Pesantren Miftahul Huda As-Syadzili");
            channel.enableVibration(true);
            channel.setShowBadge(true);

            // Set Suara Bawaan pada Channel secara eksplisit
            Uri defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                    .build();
            channel.setSound(defaultSoundUri, audioAttributes);

            NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            if (manager != null) {
                manager.createNotificationChannel(channel);
                Log.d(TAG, "Notification channel berhasil dibuat: " + CHANNEL_ID);
            }
        }
    }
}

