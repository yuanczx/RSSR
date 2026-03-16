use std::process::Command;

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

    println!("Using bun at: {}", bun.display());

    let status = Command::new(bun)
        .args(["run", "build"])
        .current_dir("frontend")
        .status()
        .expect("failed to run bun");

    if !status.success() {
        panic!("frontend build failed");
    }
}
