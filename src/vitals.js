"use strict";
import Perfume from "perfume.js";
import { post, newEvent } from "./api";

// Global vitals object
const vitalsData = {};

/**
 * Send all web vitals that have been gathered (some may be left out as the data is collected individually)
 * @param {object} userOptions global options object
 */
const sendVitals = (vitalsData, userOptions) => {
    if (vitalsData["hasSent"]) return false;
    vitalsData["hasSent"] = true;

    if (userOptions.logEvents)
        console.log("[Bug Catch] Web-Vitals data", vitalsData);

    // Send web vitals data to server
    post(
        `${userOptions.base_url}/catch/vitals`,
        newEvent("vitals", vitalsData, userOptions)
    );

    //
    window.localStorage.setItem(
        "bug-catch/vitals",
        JSON.stringify({
            lastSent: Date.now(),
            release: userOptions.release,
        })
    );
};

/**
 * Web Vitals (via perfume.js)
 * @param {object} userOptions global options object
 */
export const initVitals = (userOptions) => {
    const store = JSON.parse(window.localStorage.getItem("bug-catch/vitals"));

    // Only send Vitals once per version (or after 2 weeks)
    if (
        store &&
        store.release === userOptions.release &&
        (Date.now() - store.lastSent) / 3600000 / 24 < 14 // Time since last vital sent is less than 14 days
    ) {
        if (userOptions.logEvents)
            console.log("[Bug Catch] web-vitals limit has been reached");
        return false;
    }

    new Perfume({
        analyticsTracker: (options) => {
            const { metricName, data, navigatorInformation } = options;

            if (!vitalsData["navigatorInformation"])
                vitalsData["navigatorInformation"] = navigatorInformation;

            vitalsData[metricName] = data;

            // Check required web vitals data has been collected
            const hasRequiredVitals = () => {
                let isTrue = true;

                userOptions.requiredVitals.forEach((prop) => {
                    if (!vitalsData.hasOwnProperty(prop)) isTrue = false;
                });

                return isTrue;
            };

            // Check required data has been collected
            if (
                Object.keys(vitalsData).length >=
                    userOptions.requiredVitals.length &&
                hasRequiredVitals()
            ) {
                requestIdleCallback(() => sendVitals(vitalsData, userOptions));
            }
        },
    });
};
