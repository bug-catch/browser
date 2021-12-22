"use strict";
import { initVitals } from "./vitals";
import { post, newEvent } from "./api";

window.requestIdleCallback =
    window.requestIdleCallback ||
    function (cb) {
        var start = Date.now();
        return setTimeout(function () {
            cb({
                didTimeout: false,
                timeRemaining: function () {
                    return Math.max(0, 50 - (Date.now() - start));
                },
            });
        }, 1);
    };

window.cancelIdleCallback =
    window.cancelIdleCallback ||
    function (id) {
        clearTimeout(id);
    };

/**
 * Default options object
 */
const options = {
    base_url: "",
    release: "0.0.0",
    logEvents: false,
    disableWebVitals: false,
    disableError: false,
    disableUnhandledRejection: false,
    requiredVitals: [
        "cls",
        // "dataConsumption",
        "fcp",
        "fid",
        "fp",
        "lcp",
        "navigationTiming",
        "navigatorInformation",
        "networkInformation",
        "storageEstimate",
        "tbt",
        "ttfb",
    ],
};

/**
 * Set options object
 * @param {object} userOptions global options object
 */
const setOptions = (userOptions) => {
    Object.assign(options, userOptions);
};

/**
 * Handle error events
 * @param {object} error event object
 */
const onError = (evt) => {
    // Collect error data from event
    const data = {};

    // Detect error event
    // separate error and unhandledrejection
    if (evt.error) {
        // Error event
        data.type = evt.type;
        data.message = evt.message;
        data.filename = evt.filename;
        data.line = evt.lineno || -1;
        data.column = evt.colno || -1;
        data.error = {
            name: evt.error.name,
            message: evt.error.message,
            stack: evt.error.stack,
        };
    } else {
        // Promise rejection event
        data.type = evt.type;
        data.message = evt.reason.message;
        data.filename = "";
        data.line = -1;
        data.column = -1;
        data.error = {
            name: evt.reason.name,
            message: evt.reason.message,
            stack: evt.reason.stack,
        };

        // Extract line and column numbers
        // from stack trace
        const stackLinePosition = (/:[0-9]+:[0-9]+/.exec(evt.reason.stack) || [
            "",
        ])[0].split(":");

        if (stackLinePosition.length === 3) {
            data.line = Number(stackLinePosition[1]);
            data.column = Number(stackLinePosition[2]);
        }
    }

    // Send incident data to server
    post(`${options.base_url}/catch/event`, newEvent("error", data, options));

    return true;
};

/**
 * Create a new event and submit the data to the API
 * (User-facing abstraction above the 'newEvent' function)
 * @param {string} name event name/type eg, "error"
 * @param {*} data data attached to event
 */
export const recordEvent = (name, data, userOptions) => {
    setOptions(userOptions);

    if (options.logEvents)
        console.log(`[Bug Catch] Event: ${name}`, { name, data });

    // Send incident data to server
    post(`${options.base_url}/event`, newEvent(name, data, options));
};

/**
 * Initialise bug-catch to catch all errors + gather web vitals data
 * @param {object} userOptions global options object
 */
export const init = (userOptions) => {
    setOptions(userOptions);

    // Listen to uncaught errors
    if (!options.disableError) window.addEventListener("error", onError);

    // Listen to uncaught promises rejections
    if (!options.disableUnhandledRejection)
        window.addEventListener("unhandledrejection", onError);

    // Web Vitals
    if (!options.disableWebVitals) initVitals(options);
};
