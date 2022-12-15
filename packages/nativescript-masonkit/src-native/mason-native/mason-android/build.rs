fn main() {
    println!("cargo:rerun-if-changed=build.rs");
    println!("cargo:rerun-if-changed=src/lib.rs");

    println!("cargo:rerun-if-changed=src/cpp/JSIRuntime.h");
    println!("cargo:rerun-if-changed=src/cpp/JSIRuntime.cpp");

    println!("cargo:rerun-if-changed=src/cpp/MasonJSIModule.h");
    println!("cargo:rerun-if-changed=src/cpp/MasonJSIModule.cpp");

    cxx_build::bridges(["src/lib.rs"])
        .include("include")
        .include("src/cpp")
        .file("src/cpp/jsi/jsi.cpp")
        .file("src/cpp/v8runtime/HostProxy.cpp")
        .file("src/cpp/v8runtime/JSIV8ValueConverter.cpp")
        .file("src/cpp/v8runtime/V8PointerValue.cpp")
        .file("src/cpp/v8runtime/V8Runtime.cpp")
        .file("src/cpp/v8runtime/V8RuntimeFactory.cpp")
        .file("src/cpp/MasonJSIModule.cpp")
        .file("src/cpp/JSIRuntime.cpp")
        .flag_if_supported("-std=c++14")
        .extra_warnings(false)
        .compile("mason-cxx");
}
