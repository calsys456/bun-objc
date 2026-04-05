import { expect, test } from "bun:test";

// You cannot quit the NS event loop in anyway yet,
// NSApplication.stop: simply does not work no matter how many events you pump.
// So this test spawns a separate process
test("Create window", async () => {
    const proc = Bun.spawn(["bun", "test/helloworld.ts"])
    const code = await proc.exited;
    expect(code).toBe(0);
});