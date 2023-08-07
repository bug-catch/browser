import Perfume from "perfume.js";

export const errorFormat = (evt: ErrorEvent | PromiseRejectionEvent) => {
    // Collect error data from event
    const data = {} as any;

    const errEvent = evt as ErrorEvent;
    const rejectionEvent = evt as PromiseRejectionEvent;

    // Detect error event
    // separate error and unhandledrejection
    if (errEvent?.error) {
        // Error event
        data.type = evt.type;
        data.message = errEvent.message;
        data.filename = errEvent.filename;
        data.line = errEvent.lineno || -1;
        data.column = errEvent.colno || -1;
        data.error = {
            name: errEvent.error.name,
            message: errEvent.error.message,
            stack: errEvent.error.stack,
        };
    } else {
        // Promise rejection event
        data.type = evt.type;
        data.message = rejectionEvent.reason.message;
        data.filename = "";
        data.line = -1;
        data.column = -1;
        data.error = {
            name: rejectionEvent.reason.name,
            message: rejectionEvent.reason.message,
            stack: rejectionEvent.reason.stack,
        };

        // Extract line and column numbers
        // from stack trace
        const stackLinePosition = (/:[0-9]+:[0-9]+/.exec(
            rejectionEvent.reason.stack
        ) || [""])[0].split(":");

        if (stackLinePosition.length === 3) {
            data.line = Number(stackLinePosition[1]);
            data.column = Number(stackLinePosition[2]);
        }
    }

    return data;
};

export const polyfillRequiredWindowFunctions = () => {
    // Polyfill `requestIdleCallback` and `cancelIdleCallback`
    if (typeof window !== "undefined") {
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
    }
};

/**
 * Web Vitals (via perfume.js)
 */
export const initVitals = ({
    release,
    logEvents,
    requiredVitals,
    _catchVitals,
}: any) => {
    if (typeof window === "undefined") return;

    const store = JSON.parse(
        window.localStorage.getItem("bug-catch/vitals") || "{}"
    );

    // Only send Vitals once per version (or after 2 weeks)
    if (
        store &&
        store.release === release &&
        (Date.now() - store.lastSent) / 3600000 / 24 < 14 // Time since last vital sent is less than 14 days
    ) {
        if (logEvents)
            console.log("[Bug Catch] web-vitals limit has been reached");
        return;
    }

    new Perfume({
        analyticsTracker: (options) => {
            const vitalsData = {} as any;
            const { metricName, data, navigatorInformation } = options;

            if (!vitalsData?.navigatorInformation)
                vitalsData.navigatorInformation = navigatorInformation;

            vitalsData[metricName] = data;

            // Check required web vitals data has been collected
            const hasRequiredVitals = () => {
                let isTrue = true;

                requiredVitals.forEach((prop: string) => {
                    if (!vitalsData.hasOwnProperty(prop)) isTrue = false;
                });

                return isTrue;
            };

            // Check required data has been collected
            if (
                Object.keys(vitalsData).length >= requiredVitals.length &&
                hasRequiredVitals()
            ) {
                requestIdleCallback(() => _catchVitals(vitalsData));
            }
        },
    });
};

export const sendData = (url: string, data: any) => {
    // Uses `XMLHttpRequest` to maximize compatibility and reduce need for third-party libraries.
    const req = new XMLHttpRequest();
    req.open("POST", url, true);
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify(data));
};
