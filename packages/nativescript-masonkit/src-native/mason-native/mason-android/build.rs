fn main() {

    println!("cargo:rerun-if-changed=build.rs");
    println!("cargo:rerun-if-changed=src/lib.rs");
    println!("cargo:rerun-if-changed=src/node.rs");
    println!("cargo:rerun-if-changed=src/style.rs");

    let _ = cxx_build::bridges(["src/lib.rs"]);

}
