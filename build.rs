use std::{path::Path, process::Command};

fn main() {
    if std::env::var("PROFILE").unwrap() != "release" {
        return;
    }
    println!("cargo:rerun-if-changed=frontend/src");
    println!("cargo:rerun-if-changed=frontend/public");
    println!("cargo:rerun-if-changed=frontend/index.html");
    println!("cargo:rerun-if-changed=frontend/package.json");
    println!("cargo:rerun-if-changed=frontend/bun.lock");
    println!("cargo:rerun-if-changed=frontend/vite.config.ts");
    println!("cargo:rerun-if-changed=frontend/tsconfig.json");
    println!("cargo:rerun-if-changed=frontend/tsconfig.app.json");
    println!("cargo:rerun-if-changed=frontend/tsconfig.node.json");

    let bun =
        which::which("bun").expect("bun not found in PATH. Please install bun: https://bun.sh");
    
    if !Path::new("frontend/node_modules").exists() {
        println!("cargo:warning=Installing frontend dependencies...");
        let status = Command::new(&bun)
            .args(["install"])
            .current_dir("frontend")
            .status()
            .expect("failed to run bun install");

        if !status.success() {
            panic!("bun install failed");
        }
    }

    let status = Command::new(bun)
        .args(["run", "build"])
        .current_dir("frontend")
        .status()
        .expect("failed to run bun");

    if !status.success() {
        panic!("frontend build failed");
    }
}
