export const debounce = (callback, delay) => {
    let timeout;

    return (...args) => {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => callback.apply(context, args), delay);
    };
};

export const getCssVariable = name => getComputedStyle(document.body).getPropertyValue(name);