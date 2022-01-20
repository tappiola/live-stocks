export function clickOutside(elem) {

    const handleClick = event => {
        if (elem && !elem.contains(event.target) && !event.defaultPrevented) {
            elem.dispatchEvent(
                new CustomEvent('click_outside', elem)
            )
        }
    }

    document.addEventListener('click', handleClick, true);

    return {
        destroy() {
            document.removeEventListener('click', handleClick, true);
        }
    }
}