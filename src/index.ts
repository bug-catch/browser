import {
    browserName,
    browserVersion,
    osName,
    osVersion,
    deviceType,
} from "react-device-detect";

import {
    errorFormat,
    initVitals,
    polyfillRequiredWindowFunctions,
    sendData,
    toLower,
} from "./helpers";

polyfillRequiredWindowFunctions();

export type DefaultOptions = {
    baseUrl: string;
    release: string;
    logEvents?: boolean;
    captureDeviceInfo?: boolean;
    disableWebVitals?: boolean;
    disableError?: boolean;
    disableUnhandledRejection?: boolean;
    requiredVitals?: string[];
};

class BugCatch {
    baseUrl: string;
    release: string;
    logEvents?: boolean;
    captureDeviceInfo?: boolean;
    disableWebVitals?: boolean;
    disableError?: boolean;
    disableUnhandledRejection?: boolean;
    requiredVitals?: string[];
    deviceInfo?: any;

    constructor(userOptions: DefaultOptions) {
        this.baseUrl = userOptions.baseUrl;
        this.release = userOptions.release;
        this.logEvents = userOptions.logEvents ?? false;
        this.captureDeviceInfo = userOptions.captureDeviceInfo ?? true;
        this.disableWebVitals = userOptions.disableWebVitals ?? false;
        this.disableError = userOptions.disableError ?? false;
        this.disableUnhandledRejection =
            userOptions.disableUnhandledRejection ?? false;
        this.requiredVitals = userOptions.requiredVitals || [
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
        ];

        if (typeof window !== "undefined") {
            // Listen to uncaught errors
            if (!this.disableError)
                window.addEventListener("error", this.onError);

            // Listen to uncaught promises rejections
            if (!this.disableUnhandledRejection)
                window.addEventListener("unhandledrejection", this.onError);

            // Web Vitals
            if (!this.disableWebVitals)
                initVitals({
                    release: this.release,
                    logEvents: this.logEvents,
                    requiredVitals: this.requiredVitals,
                    _catchVitals: this._catchVitals,
                });
        }

        this.deviceInfo = undefined;
        if (this.captureDeviceInfo) this.setDeviceInfo();
    }

    private setDeviceInfo = () => {
        try {
            this.deviceInfo = {
                device: toLower(deviceType),
                browser: {
                    name: toLower(browserName),
                    version: toLower(browserVersion),
                },
                os: {
                    name: toLower(osName),
                    version: toLower(osVersion),
                },
            };

            if (this.logEvents)
                console.log("[Bug Catch] Device info", this.deviceInfo);
        } catch (error) {
            console.error("[Bug Catch] Device info error:", error);
        }

        return this.deviceInfo;
    };

    /**
     * Send web-vitals data to the server.
     */
    private _catchVitals = (data: any) => {
        try {
            if (data?.hasSent) return false;
            data.hasSent = true;

            if (this.logEvents)
                console.log("[Bug Catch] Web-Vitals data", data);

            sendData(`${this.baseUrl}/catch/vitals`, data);

            if (typeof window !== "undefined") {
                window.localStorage.setItem(
                    "bug-catch/vitals",
                    JSON.stringify({
                        lastSent: Date.now(),
                        release: this.release,
                    })
                );
            }
        } catch (error) {
            console.error("[Bug Catch] XHR post error:", error);
        }
    };

    /**
     * Send event data to the server.
     */
    private _catchEvent = (data: any) => {
        try {
            sendData(`${this.baseUrl}/catch/event`, data);
        } catch (error) {
            console.error("[Bug Catch] XHR post error:", error);
        }
    };

    /**
     * Create new event object
     */
    private _newEvent = (
        type: any,
        data: any,
        incidentData: any = undefined
    ) => {
        return {
            type,
            data,
            incidentData,
            device: this.deviceInfo,
            release: this.release,
            location:
                typeof window !== "undefined" ? window?.location?.href : "",
        };
    };

    /**
     * Handle error events
     */
    onError = (evt: ErrorEvent | PromiseRejectionEvent) => {
        this._catchEvent(this._newEvent("error", errorFormat(evt)));
    };

    /**
     * Create a new event and submit the data to the API.
     */
    recordEvent = (name: string, data: any, incidentData: any = undefined) => {
        if (this.logEvents)
            console.log(`[Bug Catch] Event: ${name}`, {
                name,
                data,
                incidentData,
            });

        // Send incident data to server
        this._catchEvent(this._newEvent(name, data, incidentData));
    };
}

/**
 * Initialise bug-catch.
 */
export const init = (userOptions: DefaultOptions) => {
    return new BugCatch(userOptions);
};

export default BugCatch;
