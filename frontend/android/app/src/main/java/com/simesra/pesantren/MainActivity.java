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
    public static final String CHANNEL_ID = "as_syadzili_channel_v5"; // v5: channel baru dengan suara & getaran lengkap

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

        // Tangani intent jika aplikasi dijalankan/dibuka pertama kali dari klik notifikasi
        handleNotificationIntent(getIntent());
    }

    @Override
    protected void onNewIntent(android.content.Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        // Tangani intent jika aplikasi di-resume dari background via klik notifikasi
        handleNotificationIntent(intent);
    }

    private void handleNotificationIntent(android.content.Intent intent) {
        if (intent != null && intent.getBooleanExtra("open_notifications", false)) {
            Log.d(TAG, "Menerima intent klik notifikasi. Mengirim event ke WebView...");
            
            // Simpan flag ke sessionStorage agar bisa dibaca meski event terlewat
            // Coba kirim event beberapa kali dengan delay berbeda agar pasti diterima
            android.os.Handler handler = new android.os.Handler(android.os.Looper.getMainLooper());
            
            Runnable dispatchEvent = () -> {
                if (getBridge() != null && getBridge().getWebView() != null) {
                    getBridge().getWebView().evaluateJavascript(
                        "(function() {" +
                        "  sessionStorage.setItem('openNotificationsOnLoad', 'true');" +
                        "  window.dispatchEvent(new CustomEvent('openNotifications'));" +
                        "})()",
                        null
                    );
                }
            };
            
            // Coba dispatch event di 0.8s, 1.5s, dan 3s setelah app terbuka
            handler.postDelayed(dispatchEvent, 800);
            handler.postDelayed(dispatchEvent, 1500);
            handler.postDelayed(dispatchEvent, 3000);
        }
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

