/**
 * New event object, this object is what gets sent to the API
 * @param {string} type event type eg, "error"
 * @param {*} data data attached to event
 * @param {object} options global options object
 */
export const newEvent = (type, data, options) => {
    return {
        type: type,
        data: data,
        release: options.release,
        location: window.location.href,
    };
};

/**
 * Post request
 * @param {string} url address to post to
 * @param {object} data object to send
 */
export const post = (url, data) => {
    try {
        const req = new XMLHttpRequest();
        req.open("POST", url, true);
        req.setRequestHeader("Content-Type", "application/json");
        req.send(JSON.stringify(data));
    } catch (error) {
        console.error("[Bug Catch] XHR post error:", error);
    }
};
