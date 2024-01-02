import neon from "./old_neon.js";

const code = 
`class Main {
    private void main() {
        Base.Log("Hey")
    }
}`;

neon(code, "Main.main", true);
