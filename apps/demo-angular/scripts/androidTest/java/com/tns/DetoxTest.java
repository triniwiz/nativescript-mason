package com.tns;

import com.wix.detox.Detox;
import com.wix.detox.config.DetoxConfig;

import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.filters.LargeTest;
import androidx.test.rule.ActivityTestRule;

@RunWith(AndroidJUnit4.class)
@LargeTest
public class DetoxTest {

    @Rule
    public ActivityTestRule<com.tns.NativeScriptActivity> mActivityRule = new ActivityTestRule<>(com.tns.NativeScriptActivity.class, false, false);

    @Test
    public void runDetoxTests() {
        DetoxConfig detoxConfig = new DetoxConfig();
        detoxConfig.idlePolicyConfig.masterTimeoutSec = 999999;
        detoxConfig.idlePolicyConfig.idleResourceTimeoutSec = 9999999;

        Detox.runTests(mActivityRule, detoxConfig);
    }
}
