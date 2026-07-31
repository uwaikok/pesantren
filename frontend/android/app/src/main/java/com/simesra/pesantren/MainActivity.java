package com.simesra.pesantren;

import android.os.Bundle;
import android.util.Log;

import com.getcapacitor.BridgeActivity;
import com.google.firebase.messaging.FirebaseMessaging;

public class MainActivity extends BridgeActivity {

    private static final String TAG = "MainActivity";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

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
}

