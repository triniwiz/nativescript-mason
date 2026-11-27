// libfontmanager.so comes from @nativescript/font-manager; the app ships it next to libmasonkit.so.
fn main() {
    println!("cargo:rerun-if-env-changed=FONT_MANAGER_LIB_DIR");
    match std::env::var("FONT_MANAGER_LIB_DIR") {
        Ok(dir) => println!("cargo:rustc-link-search=native={dir}"),
        Err(_) => println!("cargo:warning=FONT_MANAGER_LIB_DIR is not set; libfontmanager.so must be on the linker path"),
    }
    println!("cargo:rustc-link-arg=-Wl,-rpath,$ORIGIN");
}
