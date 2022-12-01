use jni::JNIEnv;
use jni::objects::JObject;
use jni::sys::{jint, jlong};

mod node;
pub mod style;

#[no_mangle]
pub extern "system" fn JNI_OnLoad() -> jint {
    {
        android_logger::init_once(
            android_logger::Config::default().with_min_level(log::Level::Debug),
        );

        log::info!("Mason library loaded");
    }

    jni::sys::JNI_VERSION_1_6
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeInit(
    _: JNIEnv,
    _: JObject,
) -> jlong {
    mason_core::Mason::new().into_raw() as jlong
}

#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeInitWithCapacity(
    _: JNIEnv,
    _: JObject,
    capacity: jint
) -> jlong {
    mason_core::Mason::with_capacity(capacity as usize).into_raw() as jlong
}



#[no_mangle]
pub extern "system" fn Java_org_nativescript_mason_masonkit_Mason_nativeClear(
    _: JNIEnv,
    _: JObject,
    taffy: jlong,
) {
    if taffy == 0 {
        return;
    }
    unsafe {
        let mut mason  = Box::from_raw( taffy as *mut mason_core::Mason);
        mason.clear();
        Box::leak(mason);
    }
}
