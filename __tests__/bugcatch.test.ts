import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { init } from "../dist/index";

beforeEach(async () => {
    // Mock `XMLHttpRequest`
});

afterEach(async () => {});

test("Class init works", () => {
    const bugcatch = init({
        baseUrl: "http://localhost:1000",
        release: "1.2.3",
        logEvents: true,
        disableExceptionHandler: true
    });

    expect(bugcatch.getOptions()).toStrictEqual({
        baseUrl: "http://localhost:1000",
        release: "1.2.3",
        logEvents: true,
        disableExceptionHandler: true
    });
});
